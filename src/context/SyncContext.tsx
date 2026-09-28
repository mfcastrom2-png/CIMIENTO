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
  ProcesoOrganizacion,
  ConfiguracionEmpresa,
  EstadoSolicitud
} from '../types';
import {
  initialAreas,
  initialProcesos,
  initialCargos,
  initialEmpleados,
  initialSolicitudes,
  initialEvaluaciones,
  initialEmpresa
} from '../data/initialData';
import { INITIAL_INVENTARIO_EPP, INITIAL_SOLICITUDES_ENTREGA_EPP } from '../data/eppData';
import { INITIAL_USUARIOS_SISTEMA } from '../data/usuariosYVotacionesData';
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
  guardarUsuarioFB,
  registrarUsuarioEnAuth,
  guardarEmpresaFB,
  obtenerEmpresaFB,
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
  cloudError: string | null;
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
  handleAddEmpleado: (
    empleado: Empleado,
    opciones?: { crearUsuario?: boolean; passwordTemporal?: string }
  ) => Promise<{ usuarioCreado?: UsuarioSistema; passwordTemporal?: string; resultadoEnvio?: any } | void>;
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
  handleUpdateEstadoSolicitud: (id: string, nuevoEstado: EstadoSolicitud, comentario: string) => Promise<void>;
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
  empresa: ConfiguracionEmpresa;
  handleUpdateEmpresa: (empresa: ConfiguracionEmpresa) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, fbUser, authReady } = useAuth();

  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  const shouldOmitMocks = isProduction || localStorage.getItem('bgroup_datos_limpios') === 'true';

  const [esLimpio, setEsLimpio] = useState<boolean>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true';
  });

  const [empresa, setEmpresa] = useState<ConfiguracionEmpresa>(() => {
    try {
      const cached = localStorage.getItem('bgroup_empresa_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.razonSocial) return parsed;
      }
    } catch {}
    return initialEmpresa;
  });

  const [areas, setAreas] = useState<AreaOrganizacion[]>(() => {
    try {
      const guardadas = localStorage.getItem('bgroup_areas');
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return shouldOmitMocks ? [] : initialAreas;
  });
  const [procesos, setProcesos] = useState<ProcesoOrganizacion[]>(() => {
    try {
      const guardadas = localStorage.getItem('bgroup_procesos');
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return shouldOmitMocks ? [] : initialProcesos;
  });
  const [cargos, setCargos] = useState<Cargo[]>(() => shouldOmitMocks ? [] : initialCargos);
  const [empleados, setEmpleados] = useState<Empleado[]>(() => {
    try {
      const cached = localStorage.getItem('bgroup_empleados_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return shouldOmitMocks ? [] : initialEmpleados;
  });
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(() => {
    return shouldOmitMocks ? [] : initialSolicitudes;
  });
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDesempeno[]>(() => {
    return shouldOmitMocks ? [] : initialEvaluaciones;
  });
  const [inventarioEpp, setInventarioEpp] = useState<ItemInventarioEPP[]>(() => shouldOmitMocks ? [] : INITIAL_INVENTARIO_EPP);
  const [solicitudesEpp, setSolicitudesEpp] = useState<SolicitudEntregaEPP[]>(() => {
    return shouldOmitMocks ? [] : INITIAL_SOLICITUDES_ENTREGA_EPP;
  });
  const [usuariosList, setUsuariosList] = useState<UsuarioSistema[]>(() => {
    try {
      const eliminadosRaw = localStorage.getItem('bgroup_usuarios_eliminados');
      const eliminadosSet = new Set(eliminadosRaw ? (JSON.parse(eliminadosRaw) as string[]).map(x => String(x).toLowerCase()) : []);
      const cached = localStorage.getItem('bgroup_usuarios_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(u => !eliminadosSet.has(u.id.toLowerCase()) && !eliminadosSet.has((u.email || '').toLowerCase()));
        }
      }
      return (shouldOmitMocks ? [] : INITIAL_USUARIOS_SISTEMA).filter(
        u => !eliminadosSet.has(u.id.toLowerCase()) && !eliminadosSet.has((u.email || '').toLowerCase())
      );
    } catch {}
    return shouldOmitMocks ? [] : INITIAL_USUARIOS_SISTEMA;
  });
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
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
    setCloudError(null);
    try {
      const [resEmp, resSol, carData, evalData, eppData, solEppData, usrData, procData, areaData] = await Promise.all([
        obtenerColeccionPaginada<Empleado>('empleados', 25, null),
        obtenerColeccionPaginada<Solicitud>('solicitudes', 25, null),
        obtenerColeccionDirecta<Cargo>('cargos'),
        obtenerColeccionDirecta<EvaluacionDesempeno>('evaluaciones'),
        obtenerColeccionDirecta<ItemInventarioEPP>('inventario_epp'),
        obtenerColeccionDirecta<SolicitudEntregaEPP>('solicitudes_epp'),
        obtenerColeccionDirecta<UsuarioSistema>('usuarios'),
        obtenerColeccionDirecta<ProcesoOrganizacion>('procesos'),
        obtenerColeccionDirecta<AreaOrganizacion>('areas')
      ]);

      if (resEmp.items && resEmp.items.length > 0) {
        setEmpleados(resEmp.items);
        try {
          localStorage.setItem('bgroup_empleados_cache', JSON.stringify(resEmp.items));
        } catch {}
      } else {
        try {
          const cached = localStorage.getItem('bgroup_empleados_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEmpleados(parsed);
            }
          }
        } catch {}
      }
      setCursorUltimoEmpleado(resEmp.ultimoDoc);
      setHayMasEmpleadosNube(resEmp.hayMas);

      if (carData && carData.length > 0) {
        const seen = new Set<string>();
        const uniqueCargos = carData.filter(c => {
          if (!c || !c.id || seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });
        setCargos(uniqueCargos);
      } else {
        // Si no hay cargos en Firestore, conservar iniciales o cargados
        setCargos(prev => prev.length > 0 ? prev : (shouldOmitMocks ? [] : initialCargos));
      }

      if (procData && procData.length > 0) {
        const seenP = new Set<string>();
        const uniqueProc = procData.filter(p => {
          if (!p || !p.id || seenP.has(p.id)) return false;
          seenP.add(p.id);
          return true;
        });
        setProcesos(uniqueProc);
        try {
          localStorage.setItem('bgroup_procesos', JSON.stringify(uniqueProc));
        } catch {}
      }

      if (areaData && areaData.length > 0) {
        const seenA = new Set<string>();
        const uniqueArea = areaData.filter(a => {
          if (!a || !a.id || seenA.has(a.id)) return false;
          seenA.add(a.id);
          return true;
        });
        setAreas(uniqueArea);
        try {
          localStorage.setItem('bgroup_areas', JSON.stringify(uniqueArea));
        } catch {}
      }

      setSolicitudes(resSol.items);
      setCursorUltimaSolicitud(resSol.ultimoDoc);
      setHayMasSolicitudesNube(resSol.hayMas);

      setEvaluaciones(evalData);
      setInventarioEpp(eppData);
      setSolicitudesEpp(solEppData);
      if (usrData && usrData.length > 0) {
        setUsuariosList(usrData);
        try {
          localStorage.setItem('bgroup_usuarios_cache', JSON.stringify(usrData));
        } catch {}
      }

      // Verificación de configuración de la empresa bajo demanda (sin listener continuo)
      try {
        const empresaData = await obtenerEmpresaFB();
        if (empresaData && empresaData.razonSocial) {
          setEmpresa(empresaData);
          try {
            localStorage.setItem('bgroup_empresa_config', JSON.stringify(empresaData));
          } catch {}
        }
        const configSnap = await getDoc(doc(db, 'configuracion_empresa', 'general'));
        if (configSnap.exists()) {
          const configData = configSnap.data();
          if (configData.datosLimpios) {
            localStorage.setItem('bgroup_datos_limpios', 'true');
            setEsLimpio(true);
          }
        }
      } catch (err) {
        console.debug('Configuración empresa verificada.');
      }

      setCloudSynced(true);
      setCloudError(null);
    } catch (err: any) {
      console.warn('Advertencia en sincronización bajo demanda:', err);
      setCloudSynced(false);
      const isOffline = err?.code === 'unavailable' || err?.message?.includes('Could not reach Cloud Firestore') || err?.message?.includes('offline');
      if (isOffline) {
        setCloudError('Modo local/offline activo: Trabajando con los datos en memoria del navegador. Se reconectará automáticamente cuando mejore el canal con Cloud Firestore.');
      } else {
        const codeStr = err?.code ? `[${err.code}] ` : '';
        setCloudError(`${codeStr}${err?.message || 'Error de conexión con Cloud Firestore backend'}`);
      }
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
  const handleAddEmpleado = async (
    empleado: Empleado,
    opciones?: { crearUsuario?: boolean; passwordTemporal?: string }
  ) => {
    setEmpleados(prev => {
      const updated = [...prev.filter(e => e.id !== empleado.id), empleado];
      try {
        localStorage.setItem('bgroup_empleados_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await guardarEmpleadoFB(empleado, currentUser);
    } catch (err) {
      console.warn('Error al guardar empleado en Firestore:', err);
    }

    let usuarioCreado: UsuarioSistema | undefined;
    let resultadoEnvio: any;

    if (opciones?.crearUsuario && (empleado.email || empleado.persona?.numeroDocumento)) {
      const emailFinal = (empleado.email || `${empleado.codigo || empleado.documento}@bgroup.com.co`).trim().toLowerCase();
      const pass = opciones.passwordTemporal || 'BGroup2026*';
      const nuevoUsuario: UsuarioSistema = {
        id: `usr-${empleado.id}`,
        nombre: empleado.nombre,
        documento: empleado.documento,
        email: emailFinal,
        rol: 'empleado',
        cargoNombre: empleado.laboral?.cargoNombre || 'Colaborador',
        empresaId: empleado.empresaId || currentUser?.empresaId || 'empresa-a',
        estado: 'activo',
        ultimoAcceso: 'Nunca',
        fechaCreacion: new Date().toISOString().slice(0, 10),
        dobleFactorHabilitado: false,
        permisos: ['empleados', 'solicitudes', 'capacitaciones'],
        empleadoId: empleado.id
      };

      try {
        const authRes = await registrarUsuarioEnAuth(emailFinal, pass, empleado.nombre);
        if (authRes.success && authRes.uid) {
          nuevoUsuario.id = authRes.uid;
          resultadoEnvio = { exitoAuth: true, uid: authRes.uid };
        } else {
          resultadoEnvio = { exitoAuth: false, mensaje: authRes.message };
        }
        await guardarUsuarioFB(nuevoUsuario);
        setUsuariosList(prev => [...prev.filter(u => u.email !== emailFinal), nuevoUsuario]);
        usuarioCreado = nuevoUsuario;
      } catch (err: any) {
        console.warn('Error al aprovisionar usuario para empleado:', err);
      }
    }

    return {
      usuarioCreado,
      passwordTemporal: opciones?.passwordTemporal || 'BGroup2026*',
      resultadoEnvio
    };
  };

  const handleUpdateEmpleado = async (empleado: Empleado) => {
    setEmpleados(prev => {
      const updated = prev.map(e => e.id === empleado.id ? empleado : e);
      try {
        localStorage.setItem('bgroup_empleados_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await guardarEmpleadoFB(empleado, currentUser);
    } catch (err) {
      console.warn('Error al actualizar empleado en Firestore:', err);
    }
  };

  const handleDeleteEmpleado = async (id: string) => {
    const victima = empleados.find(e => e.id === id);
    setEmpleados(prev => {
      const updated = prev.filter(e => e.id !== id);
      try {
        localStorage.setItem('bgroup_empleados_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await eliminarEmpleadoFB(id, victima?.nombre, currentUser);
    } catch (err) {
      console.warn('Error al eliminar empleado en Firestore:', err);
    }
  };

  const handleEmpleadosImportados = (nuevos: Empleado[]) => {
    setEmpleados(prev => [...prev, ...nuevos]);
  };

  const handleUpdateEmpresa = async (nuevaEmpresa: ConfiguracionEmpresa) => {
    setEmpresa(nuevaEmpresa);
    try {
      localStorage.setItem('bgroup_empresa_config', JSON.stringify(nuevaEmpresa));
    } catch {}
    try {
      await guardarEmpresaFB(nuevaEmpresa, currentUser);
    } catch (err) {
      console.warn('Error al guardar datos de la empresa en Firestore:', err);
    }
  };

  const handleAddCargo = async (cargo: Cargo) => {
    setCargos(prev => {
      const filtered = prev.filter(c => c.id !== cargo.id);
      return [...filtered, cargo];
    });
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
    setAreas(prev => {
      const idx = prev.findIndex(a => a.id === area.id);
      const updated = idx >= 0 ? prev.map(a => a.id === area.id ? area : a) : [...prev, area];
      try {
        localStorage.setItem('bgroup_areas', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await guardarAreaFB(area, currentUser);
    } catch (err) {
      console.warn('Error al guardar área en Firestore:', err);
      throw err;
    }
  };

  const handleUpdateArea = async (area: AreaOrganizacion) => {
    setAreas(prev => {
      const updated = prev.map(a => a.id === area.id ? area : a);
      try {
        localStorage.setItem('bgroup_areas', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await guardarAreaFB(area, currentUser);
    } catch (err) {
      console.warn('Error al actualizar área en Firestore:', err);
      throw err;
    }
  };

  const handleDeleteArea = async (id: string) => {
    const victima = areas.find(a => a.id === id);
    setAreas(prev => {
      const updated = prev.filter(a => a.id !== id);
      try {
        localStorage.setItem('bgroup_areas', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await eliminarAreaFB(id, victima?.nombre, currentUser);
    } catch (err) {
      console.warn('Error al eliminar área en Firestore:', err);
      throw err;
    }
  };

  const handleAddProceso = async (proceso: ProcesoOrganizacion) => {
    setProcesos(prev => {
      const idx = prev.findIndex(p => p.id === proceso.id);
      const updated = idx >= 0 ? prev.map(p => p.id === proceso.id ? proceso : p) : [...prev, proceso];
      try {
        localStorage.setItem('bgroup_procesos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await guardarProcesoFB(proceso, currentUser);
    } catch (err) {
      console.warn('Error al guardar proceso en Firestore:', err);
      throw err;
    }
  };

  const handleUpdateProceso = async (proceso: ProcesoOrganizacion) => {
    setProcesos(prev => {
      const updated = prev.map(p => p.id === proceso.id ? proceso : p);
      try {
        localStorage.setItem('bgroup_procesos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await guardarProcesoFB(proceso, currentUser);
    } catch (err) {
      console.warn('Error al actualizar proceso en Firestore:', err);
      throw err;
    }
  };

  const handleDeleteProceso = async (id: string) => {
    const victima = procesos.find(p => p.id === id);
    setProcesos(prev => {
      const updated = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem('bgroup_procesos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await eliminarProcesoFB(id, victima?.nombre, currentUser);
    } catch (err) {
      console.warn('Error al eliminar proceso en Firestore:', err);
      throw err;
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

  const handleUpdateEstadoSolicitud = async (id: string, nuevoEstado: EstadoSolicitud, comentario: string) => {
    // Protección RBAC estricta: un colaborador o usuario no administrador no puede aprobar o rechazar solicitudes
    const isAuthorized = currentUser?.rol === 'superadmin' || currentUser?.rol === 'admin_gh' || currentUser?.permisos?.includes('solicitudes');
    if (!isAuthorized) {
      console.warn('[Seguridad RBAC] Intento no autorizado de cambiar estado de solicitud bloqueado:', currentUser?.email);
      throw new Error('No tiene permisos para aprobar o rechazar solicitudes laborales.');
    }

    const solicitudModificada = solicitudes.find(s => s.id === id);
    if (!solicitudModificada) return;

    const nuevoEventoHistorial = {
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
      usuarioNombre: currentUser?.nombre || 'Administrador GH',
      estadoAnterior: solicitudModificada.estado,
      estadoNuevo: nuevoEstado,
      comentario
    };

    const actualizada: Solicitud = {
      ...solicitudModificada,
      estado: nuevoEstado,
      decisorId: currentUser?.id || null,
      comentario,
      fechaDecision: new Date().toISOString().slice(0, 10),
      historialRespuestas: [...(solicitudModificada.historialRespuestas || []), nuevoEventoHistorial]
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
    try {
      localStorage.setItem('bgroup_usuarios_cache', JSON.stringify(nuevos));
    } catch {}
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
        cloudError,
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
        empresa,
        handleUpdateEmpresa,
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
