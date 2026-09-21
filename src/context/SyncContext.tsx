import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AreaOrganizacion,
  Cargo,
  Empleado,
  EvaluacionDesempeno,
  Solicitud,
  ItemInventarioEPP,
  SolicitudEntregaEPP,
  UsuarioSistema,
  ProcesoOrganizacion
} from '../types';
import {
  initialAreas,
  initialProcesos,
  initialCargos,
  initialEmpleados,
  initialSolicitudes,
  initialEvaluaciones
} from '../data/initialData';
import { INITIAL_INVENTARIO_EPP, INITIAL_SOLICITUDES_ENTREGA_EPP } from '../data/eppData';
import {
  db,
  suscribirColeccion,
  obtenerColeccionDirecta,
  obtenerColeccionPaginada,
  guardarEmpleadoFB,
  eliminarEmpleadoFB,
  guardarCargoFB,
  eliminarCargoFB,
  guardarAreaFB,
  eliminarAreaFB,
  guardarProcesoFB,
  eliminarProcesoFB,
  guardarSolicitudGeneralFB,
  guardarEvaluacionFB,
  guardarInventarioEppLoteFB,
  guardarSolicitudesEppLoteFB,
  registrarEventoAuditoria
} from '../lib/firebase';
import { useAuth } from './AuthContext';
import { doc, getDoc, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface SyncContextType {
  areas: AreaOrganizacion[];
  procesos: ProcesoOrganizacion[];
  cargos: Cargo[];
  empleados: Empleado[];
  solicitudes: Solicitud[];
  evaluaciones: EvaluacionDesempeno[];
  inventarioEpp: ItemInventarioEPP[];
  solicitudesEpp: SolicitudEntregaEPP[];
  usuariosList: UsuarioSistema[];
  cloudSynced: boolean;
  esLimpio: boolean;
  setEsLimpio: (val: boolean) => void;
  // Estado de Consultas Paginadas Bajo Demanda en la Nube
  cargandoNube: boolean;
  hayMasEmpleadosNube: boolean;
  cargandoMasEmpleados: boolean;
  cargarMasEmpleadosNube: () => Promise<void>;
  hayMasSolicitudesNube: boolean;
  cargandoMasSolicitudes: boolean;
  cargarMasSolicitudesNube: () => Promise<void>;
  // Acciones CRUD con Trazabilidad de Auditoría Inmutable
  handleAddEmpleado: (empleado: Empleado) => Promise<void>;
  handleUpdateEmpleado: (empleado: Empleado) => Promise<void>;
  handleDeleteEmpleado: (id: string) => Promise<void>;
  handleEmpleadosImportados: (nuevos: Empleado[]) => void;
  handleAddCargo: (cargo: Cargo) => Promise<void>;
  handleUpdateCargo: (cargo: Cargo) => Promise<void>;
  handleDeleteCargo: (id: string) => Promise<void>;
  handleAddArea: (area: AreaOrganizacion) => Promise<void>;
  handleUpdateArea: (area: AreaOrganizacion) => Promise<void>;
  handleDeleteArea: (id: string) => Promise<void>;
  handleAddProceso: (proceso: ProcesoOrganizacion) => Promise<void>;
  handleUpdateProceso: (proceso: ProcesoOrganizacion) => Promise<void>;
  handleDeleteProceso: (id: string) => Promise<void>;
  handleAddSolicitud: (nuevaSolicitud: Solicitud) => Promise<void>;
  handleUpdateEstadoSolicitud: (id: string, nuevoEstado: 'Aprobada' | 'Rechazada', comentario: string) => Promise<void>;
  handleSaveEvaluacion: (evaluacion: EvaluacionDesempeno) => Promise<void>;
  handleDeleteEvaluacion: (evaluacionId: string) => void;
  handleActualizarInventarioEpp: (nuevos: ItemInventarioEPP[]) => Promise<void>;
  handleActualizarSolicitudesEpp: (nuevas: SolicitudEntregaEPP[]) => Promise<void>;
  handleActualizarUsuarios: (nuevos: UsuarioSistema[]) => void;
  handleDatosLimpiados: () => void;
  handleLimpiarEpp: () => void;
  handleLimpiarCapacitaciones: () => void;
  handleLimpiarEstructura: () => void;
  handleCatalogoCargado: () => void;
  recargarDatosBajoDemanda: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, fbUser, authReady } = useAuth();

  const [esLimpio, setEsLimpio] = useState<boolean>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true';
  });

  const [areas, setAreas] = useState<AreaOrganizacion[]>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true' ? [] : initialAreas;
  });
  const [procesos, setProcesos] = useState<ProcesoOrganizacion[]>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true' ? [] : initialProcesos;
  });
  const [cargos, setCargos] = useState<Cargo[]>(initialCargos);
  const [empleados, setEmpleados] = useState<Empleado[]>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true' ? [] : initialEmpleados;
  });
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true' ? [] : initialSolicitudes;
  });
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDesempeno[]>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true' ? [] : initialEvaluaciones;
  });
  const [inventarioEpp, setInventarioEpp] = useState<ItemInventarioEPP[]>(INITIAL_INVENTARIO_EPP);
  const [solicitudesEpp, setSolicitudesEpp] = useState<SolicitudEntregaEPP[]>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true' ? [] : INITIAL_SOLICITUDES_ENTREGA_EPP;
  });
  const [usuariosList, setUsuariosList] = useState<UsuarioSistema[]>([]);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [cargandoNube, setCargandoNube] = useState<boolean>(false);

  // Estados de cursores para paginación bajo demanda en la nube
  const [cursorUltimoEmpleado, setCursorUltimoEmpleado] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hayMasEmpleadosNube, setHayMasEmpleadosNube] = useState<boolean>(false);
  const [cargandoMasEmpleados, setCargandoMasEmpleados] = useState<boolean>(false);

  const [cursorUltimaSolicitud, setCursorUltimaSolicitud] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hayMasSolicitudesNube, setHayMasSolicitudesNube] = useState<boolean>(false);
  const [cargandoMasSolicitudes, setCargandoMasSolicitudes] = useState<boolean>(false);

  // Recarga bajo demanda con consultas paginadas iniciales (eliminando suscripciones globales onSnapshot)
  const recargarDatosBajoDemanda = useCallback(async () => {
    if (!fbUser) return;
    setCargandoNube(true);
    try {
      const [resEmp, resSol, carData, evalData, eppData, solEppData, usrData] = await Promise.all([
        obtenerColeccionPaginada<Empleado>('empleados', 25, null),
        obtenerColeccionPaginada<Solicitud>('solicitudes', 25, null),
        obtenerColeccionDirecta<Cargo>('cargos'),
        obtenerColeccionDirecta<EvaluacionDesempeno>('evaluaciones'),
        obtenerColeccionDirecta<ItemInventarioEPP>('inventario_epp'),
        obtenerColeccionDirecta<SolicitudEntregaEPP>('solicitudes_epp'),
        obtenerColeccionDirecta<UsuarioSistema>('usuarios')
      ]);

      const limpio = localStorage.getItem('bgroup_datos_limpios') === 'true';
      if (resEmp.items.length > 0 || limpio) {
        setEmpleados(resEmp.items);
        setCursorUltimoEmpleado(resEmp.ultimoDoc);
        setHayMasEmpleadosNube(resEmp.hayMas);
      }
      if (carData.length > 0) setCargos(carData);
      if (resSol.items.length > 0 || limpio) {
        setSolicitudes(resSol.items);
        setCursorUltimaSolicitud(resSol.ultimoDoc);
        setHayMasSolicitudesNube(resSol.hayMas);
      }
      if (evalData.length > 0 || limpio) setEvaluaciones(evalData);
      if (eppData.length > 0) setInventarioEpp(eppData);
      if (solEppData.length > 0 || limpio) setSolicitudesEpp(solEppData);
      if (usrData.length > 0) setUsuariosList(usrData);

      // Verificación de configuración de la empresa bajo demanda (sin listener continuo)
      try {
        const configSnap = await getDoc(doc(db, 'configuracion_empresa', 'general'));
        if (configSnap.exists()) {
          const configData = configSnap.data();
          if (configData.datosLimpios) {
            localStorage.setItem('bgroup_datos_limpios', 'true');
            setEsLimpio(true);
          }
        }
      } catch (err) {
        console.debug('Configuración empresa cargada desde caché local.');
      }

      setCloudSynced(true);
    } catch (err) {
      console.warn('Advertencia en sincronización bajo demanda:', err);
    } finally {
      setCargandoNube(false);
    }
  }, [fbUser]);

  // Carga de la siguiente página de empleados con cursores (limit(25), startAfter(cursor))
  const cargarMasEmpleadosNube = async () => {
    if (!fbUser || !cursorUltimoEmpleado || cargandoMasEmpleados) return;
    setCargandoMasEmpleados(true);
    try {
      const res = await obtenerColeccionPaginada<Empleado>('empleados', 25, cursorUltimoEmpleado);
      if (res.items.length > 0) {
        setEmpleados(prev => {
          const idsExistentes = new Set(prev.map(p => p.id));
          const nuevos = res.items.filter(item => !idsExistentes.has(item.id));
          return [...prev, ...nuevos];
        });
        setCursorUltimoEmpleado(res.ultimoDoc);
        setHayMasEmpleadosNube(res.hayMas);
      } else {
        setHayMasEmpleadosNube(false);
      }
    } catch (err) {
      console.warn('Error al cargar página paginada de empleados:', err);
    } finally {
      setCargandoMasEmpleados(false);
    }
  };

  // Carga de la siguiente página de solicitudes con cursores
  const cargarMasSolicitudesNube = async () => {
    if (!fbUser || !cursorUltimaSolicitud || cargandoMasSolicitudes) return;
    setCargandoMasSolicitudes(true);
    try {
      const res = await obtenerColeccionPaginada<Solicitud>('solicitudes', 25, cursorUltimaSolicitud);
      if (res.items.length > 0) {
        setSolicitudes(prev => {
          const idsExistentes = new Set(prev.map(s => s.id));
          const nuevos = res.items.filter(item => !idsExistentes.has(item.id));
          return [...prev, ...nuevos];
        });
        setCursorUltimaSolicitud(res.ultimoDoc);
        setHayMasSolicitudesNube(res.hayMas);
      } else {
        setHayMasSolicitudesNube(false);
      }
    } catch (err) {
      console.warn('Error al cargar página paginada de solicitudes:', err);
    } finally {
      setCargandoMasSolicitudes(false);
    }
  };

  // Carga inicial y refresco bajo demanda sin listeners onSnapshot permanentes
  useEffect(() => {
    if (!authReady || !fbUser) {
      setCloudSynced(false);
      return;
    }

    setCloudSynced(true);
    recargarDatosBajoDemanda();

    // Refresco manual o al volver a enfocar la ventana
    const handleFocus = () => {
      recargarDatosBajoDemanda();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [authReady, fbUser, recargarDatosBajoDemanda]);

  // Handlers con Trazabilidad Inmutable
  const handleAddEmpleado = async (empleado: Empleado) => {
    setEmpleados(prev => [...prev, empleado]);
    try {
      await guardarEmpleadoFB(empleado, currentUser);
    } catch (err) {
      console.warn('Error al guardar empleado en Firestore:', err);
    }
  };

  const handleUpdateEmpleado = async (empleado: Empleado) => {
    setEmpleados(prev => prev.map(e => e.id === empleado.id ? empleado : e));
    try {
      await guardarEmpleadoFB(empleado, currentUser);
    } catch (err) {
      console.warn('Error al actualizar empleado en Firestore:', err);
    }
  };

  const handleDeleteEmpleado = async (id: string) => {
    const victima = empleados.find(e => e.id === id);
    setEmpleados(prev => prev.filter(e => e.id !== id));
    try {
      await eliminarEmpleadoFB(id, victima?.nombre, currentUser);
    } catch (err) {
      console.warn('Error al eliminar empleado en Firestore:', err);
    }
  };

  const handleEmpleadosImportados = (nuevos: Empleado[]) => {
    setEmpleados(prev => [...prev, ...nuevos]);
  };

  const handleAddCargo = async (cargo: Cargo) => {
    setCargos(prev => [...prev, cargo]);
    try {
      await guardarCargoFB(cargo, currentUser);
    } catch (err) {
      console.warn('Error al guardar cargo en Firestore:', err);
    }
  };

  const handleUpdateCargo = async (cargo: Cargo) => {
    setCargos(prev => prev.map(c => c.id === cargo.id ? cargo : c));
    try {
      await guardarCargoFB(cargo, currentUser);
    } catch (err) {
      console.warn('Error al actualizar cargo en Firestore:', err);
    }
  };

  const handleDeleteCargo = async (id: string) => {
    const victima = cargos.find(c => c.id === id);
    setCargos(prev => prev.filter(c => c.id !== id));
    try {
      await eliminarCargoFB(id, victima?.nombre, currentUser);
    } catch (err) {
      console.warn('Error al eliminar cargo en Firestore:', err);
    }
  };

  const handleAddArea = async (area: AreaOrganizacion) => {
    setAreas(prev => [...prev, area]);
    try {
      await guardarAreaFB(area);
    } catch (err) {
      console.warn('Error al guardar área en Firestore:', err);
    }
  };

  const handleUpdateArea = async (area: AreaOrganizacion) => {
    setAreas(prev => prev.map(a => a.id === area.id ? area : a));
    try {
      await guardarAreaFB(area);
    } catch (err) {
      console.warn('Error al actualizar área en Firestore:', err);
    }
  };

  const handleDeleteArea = async (id: string) => {
    setAreas(prev => prev.filter(a => a.id !== id));
    try {
      await eliminarAreaFB(id);
    } catch (err) {
      console.warn('Error al eliminar área en Firestore:', err);
    }
  };

  const handleAddProceso = async (proceso: ProcesoOrganizacion) => {
    setProcesos(prev => [...prev, proceso]);
    try {
      await guardarProcesoFB(proceso);
    } catch (err) {
      console.warn('Error al guardar proceso en Firestore:', err);
    }
  };

  const handleUpdateProceso = async (proceso: ProcesoOrganizacion) => {
    setProcesos(prev => prev.map(p => p.id === proceso.id ? proceso : p));
    try {
      await guardarProcesoFB(proceso);
    } catch (err) {
      console.warn('Error al actualizar proceso en Firestore:', err);
    }
  };

  const handleDeleteProceso = async (id: string) => {
    setProcesos(prev => prev.filter(p => p.id !== id));
    try {
      await eliminarProcesoFB(id);
    } catch (err) {
      console.warn('Error al eliminar proceso en Firestore:', err);
    }
  };

  const handleAddSolicitud = async (nuevaSolicitud: Solicitud) => {
    setSolicitudes(prev => [nuevaSolicitud, ...prev]);
    try {
      await guardarSolicitudGeneralFB(nuevaSolicitud);
      await registrarEventoAuditoria(
        'CREACION',
        'solicitudes',
        `Nueva solicitud radicada: ${nuevaSolicitud.tipo} para empleado ${nuevaSolicitud.empleadoId}`,
        currentUser,
        nuevaSolicitud.id
      );
    } catch (err) {
      console.warn('Error al guardar solicitud en Firestore:', err);
    }
  };

  const handleUpdateEstadoSolicitud = async (id: string, nuevoEstado: 'Aprobada' | 'Rechazada', comentario: string) => {
    const solicitudModificada = solicitudes.find(s => s.id === id);
    if (!solicitudModificada) return;

    const actualizada: Solicitud = {
      ...solicitudModificada,
      estado: nuevoEstado,
      comentario,
      fechaDecision: new Date().toISOString().slice(0, 10)
    };

    setSolicitudes(prev => prev.map(s => s.id === id ? actualizada : s));

    try {
      await guardarSolicitudGeneralFB(actualizada);
      await registrarEventoAuditoria(
        'ACTUALIZACION',
        'solicitudes',
        `Solicitud ${actualizada.tipo} #${id} cambiada a ${nuevoEstado} por ${currentUser?.nombre || 'Administrador'}`,
        currentUser,
        id
      );
    } catch (err) {
      console.warn('Error al actualizar solicitud en Firestore:', err);
    }
  };

  const handleSaveEvaluacion = async (evaluacion: EvaluacionDesempeno) => {
    setEvaluaciones(prev => {
      const exists = prev.some(e => e.id === evaluacion.id);
      if (exists) {
        return prev.map(e => e.id === evaluacion.id ? evaluacion : e);
      }
      return [evaluacion, ...prev];
    });

    try {
      await guardarEvaluacionFB(evaluacion);
      await registrarEventoAuditoria(
        'ACTUALIZACION',
        'evaluaciones',
        `Evaluación de desempeño registrada para empleado ${evaluacion.empleadoId} (Puntaje: ${evaluacion.puntajeFinal} pts)`,
        currentUser,
        evaluacion.id
      );
    } catch (err) {
      console.warn('Error al guardar evaluación en Firestore:', err);
    }
  };

  const handleDeleteEvaluacion = (evaluacionId: string) => {
    setEvaluaciones(prev => prev.filter(e => e.id !== evaluacionId));
  };

  const handleActualizarInventarioEpp = async (nuevos: ItemInventarioEPP[]) => {
    setInventarioEpp(nuevos);
    guardarInventarioEppLoteFB(nuevos).catch(err => {
      console.warn('Error al persistir lote de inventario EPP:', err);
    });
  };

  const handleActualizarSolicitudesEpp = async (nuevas: SolicitudEntregaEPP[]) => {
    setSolicitudesEpp(nuevas);
    guardarSolicitudesEppLoteFB(nuevas).catch(err => {
      console.warn('Error al persistir lote de solicitudes EPP:', err);
    });
  };

  const handleActualizarUsuarios = (nuevos: UsuarioSistema[]) => {
    setUsuariosList(nuevos);
  };

  const handleDatosLimpiados = () => {
    localStorage.setItem('bgroup_datos_limpios', 'true');
    localStorage.removeItem('bgroup_vacaciones_controles');
    localStorage.removeItem('bgroup_vacaciones_solicitudes');
    localStorage.removeItem('bgroup_votaciones');
    localStorage.removeItem('bgroup_novedades_nomina');
    setEsLimpio(true);
    setEmpleados([]);
    setSolicitudes([]);
    setEvaluaciones([]);
    setSolicitudesEpp([]);
    setInventarioEpp(prev => prev.map(item => ({ ...item, stockActual: 0 })));
    setCargos(initialCargos);

    registrarEventoAuditoria(
      'PURGA_DATOS',
      'sistema',
      'Purga de datos de prueba para pase a producción ejecutada por el Superadministrador',
      currentUser
    );
  };

  const handleLimpiarEpp = () => {
    setSolicitudesEpp([]);
    setInventarioEpp(prev => prev.map(item => ({ ...item, stockActual: 0 })));
  };

  const handleLimpiarCapacitaciones = () => {
    window.dispatchEvent(new Event('storage'));
  };

  const handleLimpiarEstructura = () => {
    setCargos(initialCargos);
  };

  const handleCatalogoCargado = () => {
    setInventarioEpp(INITIAL_INVENTARIO_EPP.map(item => ({
      ...item,
      stockActual: 0
    })));
  };

  return (
    <SyncContext.Provider
      value={{
        areas,
        procesos,
        cargos,
        empleados,
        solicitudes,
        evaluaciones,
        inventarioEpp,
        solicitudesEpp,
        usuariosList,
        cloudSynced,
        esLimpio,
        setEsLimpio,
        handleAddEmpleado,
        handleUpdateEmpleado,
        handleDeleteEmpleado,
        handleEmpleadosImportados,
        handleAddCargo,
        handleUpdateCargo,
        handleDeleteCargo,
        handleAddArea,
        handleUpdateArea,
        handleDeleteArea,
        handleAddProceso,
        handleUpdateProceso,
        handleDeleteProceso,
        handleAddSolicitud,
        handleUpdateEstadoSolicitud,
        handleSaveEvaluacion,
        handleDeleteEvaluacion,
        handleActualizarInventarioEpp,
        handleActualizarSolicitudesEpp,
        handleActualizarUsuarios,
        handleDatosLimpiados,
        handleLimpiarEpp,
        handleLimpiarCapacitaciones,
        handleLimpiarEstructura,
        handleCatalogoCargado,
        recargarDatosBajoDemanda,
        cargandoNube,
        hayMasEmpleadosNube,
        cargandoMasEmpleados,
        cargarMasEmpleadosNube,
        hayMasSolicitudesNube,
        cargandoMasSolicitudes,
        cargarMasSolicitudesNube
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useCompanySync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useCompanySync debe ser usado dentro de un SyncProvider');
  }
  return context;
};
