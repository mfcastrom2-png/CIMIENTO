import React, { useState, useEffect } from 'react';
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
  Role
} from './types';
import {
  initialAreas,
  initialProcesos,
  initialCargos,
  initialEmpleados,
  initialSolicitudes,
  initialEvaluaciones
} from './data/initialData';
import { INITIAL_INVENTARIO_EPP, INITIAL_SOLICITUDES_ENTREGA_EPP } from './data/eppData';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EstructuraView } from './components/EstructuraView';
import { ManualCargosView } from './components/ManualCargosView';
import { EmpleadosView } from './components/EmpleadosView';
import { EvaluacionesAdminView } from './components/EvaluacionesAdminView';
import { SolicitudesView } from './components/SolicitudesView';
import { DocumentosView } from './components/DocumentosView';
import { NominaView } from './components/NominaView';
import { ParametrosNominaView } from './components/ParametrosNominaView';
import { SstView } from './components/SstView';
import { CapacitacionesView } from './components/CapacitacionesView';
import { UsuariosView } from './components/UsuariosView';
import { ControlVacacionesView } from './components/ControlVacacionesView';
import { VotacionesSstView } from './components/VotacionesSstView';
import { EppInventarioView } from './components/EppInventarioView';
import { EvaluacionDetalleModal } from './components/EvaluacionDetalleModal';
import { LoginView } from './components/LoginView';
import { GestionDatosModal } from './components/GestionDatosModal';
import {
  Bell,
  Cloud,
  Database,
  Lock,
  LogOut,
  ShieldCheck,
  User,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import {
  auth,
  db,
  suscribirColeccion,
  guardarEmpleadoFB,
  guardarCargoFB,
  eliminarCargoFB,
  guardarAreaFB,
  eliminarAreaFB,
  guardarProcesoFB,
  eliminarProcesoFB,
  guardarSolicitudGeneralFB,
  guardarEvaluacionFB,
  guardarInventarioEppFB,
  guardarSolicitudEppFB,
  guardarUsuarioFB,
  registrarUsuarioEnAuth,
  enviarNotificacionCorreoNuevoUsuario,
  cerrarSesion,
  obtenerPerfilUsuario
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'estructura' | 'cargos' | 'empleados' | 'evaluaciones' | 'solicitudes' | 'documentos' | 'nomina' | 'parametros-nomina' | 'sst' | 'epps' | 'capacitaciones' | 'usuarios' | 'vacaciones' | 'votaciones-sst'
  >('dashboard');

  // Sesión y Autenticación
  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(null);

  const [userRole, setUserRole] = useState<Role>(() => {
    return currentUser?.rol === 'empleado' ? 'empleado' : 'admin';
  });

  // Modal de preparación / limpieza de base de datos para producción
  const [gestionDatosModalOpen, setGestionDatosModalOpen] = useState(false);

  // Privilegio exclusivo de Superadministrador para depuración de bases de datos
  const isSuperAdmin = currentUser?.rol === 'superadmin' || currentUser?.email?.toLowerCase() === 'mf.castrom2@gmail.com';

  // Estado que determina si la base está purgada para producción
  const [esLimpio, setEsLimpio] = useState<boolean>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true';
  });

  // Application State
  const [areas, setAreas] = useState<AreaOrganizacion[]>(initialAreas);
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
  const [inventarioEpp, setInventarioEpp] = useState<ItemInventarioEPP[]>(() => {
    if (localStorage.getItem('bgroup_datos_limpios') === 'true') {
      return INITIAL_INVENTARIO_EPP.map(item => ({ ...item, stockActual: 0 }));
    }
    return INITIAL_INVENTARIO_EPP;
  });
  const [solicitudesEpp, setSolicitudesEpp] = useState<SolicitudEntregaEPP[]>(() => {
    return localStorage.getItem('bgroup_datos_limpios') === 'true' ? [] : INITIAL_SOLICITUDES_ENTREGA_EPP;
  });
  const [usuariosList, setUsuariosList] = useState<UsuarioSistema[]>([]);

  // Estado de sincronización en la nube y preparación de autenticación
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [fbUser, setFbUser] = useState<any>(null);

  // Modal de detalle de evaluación (accesible transversalmente)
  const [activeEvaluacionDetalleId, setActiveEvaluacionDetalleId] = useState<string | null>(null);

  // Escuchar cambios de autenticación en Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFbUser(fbUser);
      setAuthReady(true);
      if (!fbUser) {
        setCurrentUser(null);
        return;
      }

      try {
        const profile = await obtenerPerfilUsuario(fbUser.uid);

        if (!profile || profile.estado !== 'activo') {
          await cerrarSesion();
          setCurrentUser(null);
          return;
        }

        setCurrentUser(profile);
        setUserRole(profile.rol === 'empleado' ? 'empleado' : 'admin');
      } catch (err) {
        console.warn('Error al verificar perfil institucional:', err);
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sincronización en tiempo real con Firestore (Solo cuando auth está listo y usuario autenticado, directriz SKILL.md)
  useEffect(() => {
    if (!authReady || !fbUser) {
      setCloudSynced(false);
      return;
    }

    setCloudSynced(true);

    // 0. Detectar configuración de empresa limpia en la nube
    const unsubConfig = onSnapshot(
      doc(db, 'configuracion_empresa', 'general'),
      (docSnap) => {
        if (docSnap.exists()) {
          const configData = docSnap.data();
          if (configData.datosLimpios) {
            localStorage.setItem('bgroup_datos_limpios', 'true');
            setEsLimpio(true);
          }
        }
      },
      (error) => {
        console.warn('Configuración de empresa en modo local:', error.message);
      }
    );

    // 1. Empleados
    const unsubEmp = suscribirColeccion<Empleado>('empleados', (items) => {
      const limpio = localStorage.getItem('bgroup_datos_limpios') === 'true';
      if (items.length > 0 || limpio) {
        setEmpleados(items);
      }
      setCloudSynced(true);
    });

    // 2. Cargos
    const unsubCargos = suscribirColeccion<Cargo>('cargos', (items) => {
      if (items.length > 0) {
        setCargos(items);
      }
    });

    // 3. Solicitudes
    const unsubSol = suscribirColeccion<Solicitud>('solicitudes', (items) => {
      const limpio = localStorage.getItem('bgroup_datos_limpios') === 'true';
      if (items.length > 0 || limpio) {
        setSolicitudes(items);
      }
    });

    // 4. Evaluaciones
    const unsubEval = suscribirColeccion<EvaluacionDesempeno>('evaluaciones', (items) => {
      const limpio = localStorage.getItem('bgroup_datos_limpios') === 'true';
      if (items.length > 0 || limpio) {
        setEvaluaciones(items);
      }
    });

    // 5. Inventario EPP
    const unsubEpp = suscribirColeccion<ItemInventarioEPP>('inventario_epp', (items) => {
      if (items.length > 0) {
        setInventarioEpp(items);
      }
    });

    // 6. Solicitudes EPP
    const unsubSolEpp = suscribirColeccion<SolicitudEntregaEPP>('solicitudes_epp', (items) => {
      const limpio = localStorage.getItem('bgroup_datos_limpios') === 'true';
      if (items.length > 0 || limpio) {
        setSolicitudesEpp(items);
      }
    });

    // 7. Usuarios
    const unsubUsers = suscribirColeccion<UsuarioSistema>('usuarios', (items) => {
      if (items.length > 0) {
        setUsuariosList(items);
      }
    });

    return () => {
      unsubConfig();
      unsubEmp();
      unsubCargos();
      unsubSol();
      unsubEval();
      unsubEpp();
      unsubSolEpp();
      unsubUsers();
    };
  }, [authReady, fbUser]);

  // Al cambiar usuario o cerrar sesión
  const handleLoginSuccess = (usuario: UsuarioSistema) => {
    setCurrentUser(usuario);
    setUserRole(usuario.rol === 'empleado' ? 'empleado' : 'admin');
  };

  const handleLogout = async () => {
    try {
      await cerrarSesion();
    } catch {
      // Ignorar error si no había sesión de Firebase SDK activa
    }
    setCurrentUser(null);
  };

  // Handlers para mutaciones con guardado automático en Firebase Cloud
  const handleUpdateCargo = async (updatedCargo: Cargo) => {
    setCargos(prev => prev.map(c => c.id === updatedCargo.id ? updatedCargo : c));
    try {
      await guardarCargoFB(updatedCargo);
    } catch (err) {
      console.warn('Error al guardar cargo en Firestore:', err);
    }
  };

  const handleAddCargo = async (nuevoCargo: Cargo) => {
    setCargos(prev => [...prev, nuevoCargo]);
    try {
      await guardarCargoFB(nuevoCargo);
    } catch (err) {
      console.warn('Error al guardar cargo en Firestore:', err);
    }
  };

  const handleAddEmpleado = async (
    nuevoEmpleado: Empleado,
    opciones?: { crearUsuario?: boolean; passwordTemporal?: string }
  ) => {
    // 1. Guardar empleado
    setEmpleados(prev => [...prev, nuevoEmpleado]);
    try {
      await guardarEmpleadoFB(nuevoEmpleado);
    } catch (err) {
      console.warn('Error al guardar empleado en Firestore:', err);
    }

    // 2. Asociar creación de usuario con rol 'empleado' (por defecto habilitado)
    const debeCrearUsuario = opciones?.crearUsuario !== false;
    if (debeCrearUsuario) {
      const emailLimpio = (nuevoEmpleado.email || '').trim().toLowerCase();
      const claveAsignada = opciones?.passwordTemporal?.trim() || 'BGroup2026*';
      const cargoObj = cargos.find(c => c.id === nuevoEmpleado.cargoId);

      // Verificar si ya existe usuario con este email o documento
      const existente = usuariosList.find(
        u => (emailLimpio && u.email.toLowerCase() === emailLimpio) ||
             (nuevoEmpleado.documento && u.documento === nuevoEmpleado.documento)
      );

      let usuarioFinal: UsuarioSistema;
      if (existente) {
        usuarioFinal = {
          ...existente,
          empleadoId: nuevoEmpleado.id,
          nombre: nuevoEmpleado.nombre,
          cargoNombre: cargoObj?.nombre || existente.cargoNombre,
          password: claveAsignada
        };
      } else {
        usuarioFinal = {
          id: `usr-${nuevoEmpleado.id}`,
          nombre: nuevoEmpleado.nombre,
          documento: nuevoEmpleado.documento,
          email: emailLimpio || `empleado.${nuevoEmpleado.id}@bgroupingenieria.com`,
          rol: 'empleado',
          empleadoId: nuevoEmpleado.id,
          cargoNombre: cargoObj?.nombre || 'Colaborador',
          estado: 'activo',
          ultimoAcceso: 'Nunca',
          fechaCreacion: new Date().toISOString().split('T')[0],
          dobleFactorHabilitado: false,
          password: claveAsignada,
          permisos: ['dashboard', 'solicitudes', 'capacitaciones', 'sst', 'documentos', 'vacaciones']
        };
      }

      // Guardar en Firestore
      try {
        await guardarUsuarioFB(usuarioFinal);
      } catch (err) {
        console.warn('Error al guardar usuario asociado en Firestore:', err);
      }

      // Actualizar estado local
      setUsuariosList(prev => [usuarioFinal, ...prev.filter(u => u.id !== usuarioFinal.id)]);

      // Registrar en Firebase Authentication y despachar correo de activación
      let resultadoEnvio: { success: boolean; message: string; method?: string; errorDetalle?: string } = {
        success: false,
        message: 'No se especificó correo electrónico para el envío.'
      };

      if (emailLimpio && emailLimpio.includes('@')) {
        try {
          await registrarUsuarioEnAuth(emailLimpio, claveAsignada, nuevoEmpleado.nombre);
          resultadoEnvio = await enviarNotificacionCorreoNuevoUsuario(
            emailLimpio,
            nuevoEmpleado.nombre,
            'empleado',
            claveAsignada
          );
        } catch (err: any) {
          console.warn('Fallo en notificación por correo al crear usuario asociado:', err);
          resultadoEnvio = {
            success: false,
            message: err?.message || 'Error al conectar con el servidor de autenticación'
          };
        }
      }

      return {
        usuarioCreado: usuarioFinal,
        passwordTemporal: claveAsignada,
        resultadoEnvio
      };
    }
  };

  const handleActualizarUsuarios = (nuevos: UsuarioSistema[]) => {
    setUsuariosList(nuevos);
  };

  const handleAddSolicitud = async (nuevaSolicitud: Solicitud) => {
    setSolicitudes(prev => [nuevaSolicitud, ...prev]);
    try {
      await guardarSolicitudGeneralFB(nuevaSolicitud);
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
    } catch (err) {
      console.warn('Error al guardar evaluación en Firestore:', err);
    }
  };

  const handleDeleteEvaluacion = (evaluacionId: string) => {
    setEvaluaciones(prev => prev.filter(e => e.id !== evaluacionId));
  };

  // Limpieza total de datos de prueba para producción
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
    // Al cargar el catálogo base, los EPPs se cargan con stock 0
    setInventarioEpp(INITIAL_INVENTARIO_EPP.map(item => ({
      ...item,
      stockActual: 0
    })));
  };

  const handleEmpleadosImportados = (nuevos: Empleado[]) => {
    setEmpleados(prev => [...prev, ...nuevos]);
  };

  const handleActualizarInventarioEpp = async (nuevos: ItemInventarioEPP[]) => {
    setInventarioEpp(nuevos);
    for (const item of nuevos) {
      guardarInventarioEppFB(item).catch(() => {});
    }
  };

  const handleActualizarSolicitudesEpp = async (nuevas: SolicitudEntregaEPP[]) => {
    setSolicitudesEpp(nuevas);
    for (const sol of nuevas) {
      guardarSolicitudEppFB(sol).catch(() => {});
    }
  };

  const pendientesCount = solicitudes.filter(s => s.estado === 'Pendiente').length;
  const currentEvaluacionDetalle = evaluaciones.find(e => e.id === activeEvaluacionDetalleId);

  // Si no hay sesión iniciada, mostrar Login corporativo
  if (!currentUser) {
    return (
      <LoginView
        usuarios={usuariosList}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#FFFFFF] text-[#282829] overflow-hidden font-sans">
      {/* Sidebar de navegación */}
      <Sidebar
        currentRole={userRole}
        currentView={currentView}
        onNavigate={view => setCurrentView(view as any)}
        pendingRequestsCount={pendientesCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FFFFFF]">
        {/* Top Navbar Institucional */}
        <header className="h-14 bg-[#18235C] border-b border-[#101740] px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 text-white shadow-xs">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#101740] text-[#8FA7D6] border border-[#8FA7D6]/30">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>

            {/* Cloud Database Status Pill & Management Button */}
            {isSuperAdmin ? (
              <button
                type="button"
                id="btn-gestion-datos-nube"
                onClick={() => setGestionDatosModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101740] hover:bg-[#18235C] text-white border border-[#8FA7D6]/40 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Administrar base de datos en la nube, limpiar datos de prueba o cargar nómina real (Exclusivo Superadministrador)"
              >
                <Cloud className="w-3.5 h-3.5 text-[#8FA7D6]" />
                <span className="hidden md:inline text-[#8FA7D6]">Base en Nube:</span>
                <span className="font-bold text-white">Firebase</span>
                <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00] animate-pulse" />
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101740]/80 text-white border border-[#8FA7D6]/20 text-xs font-medium shadow-2xs"
                title="Conexión en Nube Activa"
              >
                <Cloud className="w-3.5 h-3.5 text-[#8FA7D6]" />
                <span className="hidden md:inline text-[#8FA7D6]">Nube:</span>
                <span className="font-semibold text-white">Conectada</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00]" />
              </div>
            )}

            {/* Selector de Rol para auditoría */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-[#101740] rounded-lg border border-[#8FA7D6]/30 text-xs">
              <span className="text-[11px] font-bold text-[#8FA7D6] flex items-center gap-1">
                <User className="w-3 h-3 text-[#8FA7D6]" />
                Rol:
              </span>
              <button
                onClick={() => setUserRole('admin')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  userRole === 'admin'
                    ? 'bg-[#8FA7D6] text-[#18235C] shadow-2xs'
                    : 'text-[#8FA7D6] hover:text-white'
                }`}
              >
                Administrador
              </button>
              <button
                onClick={() => setUserRole('empleado')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  userRole === 'empleado'
                    ? 'bg-[#8FA7D6] text-[#18235C] shadow-2xs'
                    : 'text-[#8FA7D6] hover:text-white'
                }`}
              >
                Empleado
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón secundario: fondo #8FA7D6 y texto #18235C (Exclusivo Superadministrador) */}
            {isSuperAdmin && (
              <button
                onClick={() => setGestionDatosModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#8FA7D6] hover:bg-white text-[#18235C] font-bold transition-colors shadow-2xs"
                title="Administración y Depuración de Bases de Datos (Exclusivo Superadministrador)"
              >
                <Database className="w-3.5 h-3.5 text-[#18235C]" />
                <span>Base de Datos</span>
              </button>
            )}

            {/* Quick Pending Alert - Acento #00FF00 */}
            {pendientesCount > 0 && (
              <button
                onClick={() => setCurrentView('solicitudes')}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[#00FF00] text-[#18235C] font-bold transition-colors hover:opacity-90 shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5 text-[#18235C]" />
                <span>{pendientesCount} por aprobar</span>
              </button>
            )}

            {/* Profile Avatar & Logout */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#8FA7D6]/30">
              <div className="w-8 h-8 rounded-lg bg-[#8FA7D6] text-[#18235C] flex items-center justify-center font-bold text-xs shadow-2xs border border-[#8FA7D6]">
                {currentUser.nombre ? currentUser.nombre.slice(0, 2).toUpperCase() : 'GH'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-tight truncate max-w-[150px]">
                  {currentUser.nombre}
                </div>
                <div className="text-[10px] text-[#8FA7D6] font-mono leading-tight truncate max-w-[150px]">
                  {currentUser.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-[#8FA7D6] hover:text-white hover:bg-[#8FA7D6]/20 transition-colors ml-1"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-rose-300 hover:text-rose-200" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FFFFFF]">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <DashboardView
                cargos={cargos}
                empleados={empleados}
                solicitudes={solicitudes}
                evaluaciones={evaluaciones}
                onNavigate={view => setCurrentView(view as any)}
                onOpenEvaluacionDetalle={evalId => setActiveEvaluacionDetalleId(evalId)}
                onOpenGestionDatos={isSuperAdmin ? () => setGestionDatosModalOpen(true) : undefined}
              />
            )}

            {currentView === 'estructura' && (
              <EstructuraView
                cargos={cargos}
                empleados={empleados}
                onAddCargo={handleAddCargo}
                onSelectCargoForManual={_cargoId => {
                  setCurrentView('cargos');
                }}
                isSuperAdmin={isSuperAdmin}
                onDepurarEstructura={isSuperAdmin ? handleLimpiarEstructura : undefined}
              />
            )}

            {currentView === 'cargos' && (
              <ManualCargosView
                cargos={cargos}
                onUpdateCargo={handleUpdateCargo}
                onAddCargo={handleAddCargo}
              />
            )}

            {currentView === 'empleados' && (
              <EmpleadosView
                empleados={empleados}
                cargos={cargos}
                solicitudes={solicitudes}
                evaluaciones={evaluaciones}
                onAddEmpleado={handleAddEmpleado}
                onOpenEvaluacionDetalle={evalId => setActiveEvaluacionDetalleId(evalId)}
                inventarioEpp={inventarioEpp}
                solicitudesEpp={solicitudesEpp}
                onActualizarInventario={handleActualizarInventarioEpp}
                onActualizarSolicitudes={handleActualizarSolicitudesEpp}
                userRole={userRole}
                usuarios={usuariosList}
              />
            )}

            {currentView === 'evaluaciones' && (
              <EvaluacionesAdminView
                evaluaciones={evaluaciones}
                empleados={empleados}
                cargos={cargos}
                onSaveEvaluacion={handleSaveEvaluacion}
                onDeleteEvaluacion={handleDeleteEvaluacion}
              />
            )}

            {currentView === 'solicitudes' && (
              <SolicitudesView
                solicitudes={solicitudes}
                empleados={empleados}
                onAddSolicitud={handleAddSolicitud}
                onUpdateEstado={handleUpdateEstadoSolicitud}
              />
            )}

            {currentView === 'capacitaciones' && (
              <CapacitacionesView
                cargos={cargos}
                empleados={empleados}
                userRole={userRole}
                rolSistema={currentUser?.rol}
              />
            )}

            {currentView === 'sst' && (
              <SstView
                userRole={userRole}
                currentEmpleadoId={empleados[0]?.id || 'e1'}
                empleados={empleados}
              />
            )}

            {currentView === 'votaciones-sst' && (
              <VotacionesSstView
                userRole={userRole}
                currentEmpleadoId={empleados[0]?.id || 'e1'}
                empleados={empleados}
              />
            )}

            {currentView === 'epps' && (
              <EppInventarioView
                userRole={userRole}
                rolSistema={currentUser?.rol}
                currentEmpleadoId={currentUser?.id || empleados[0]?.id || 'e1'}
                empleados={empleados}
                inventarioEpp={inventarioEpp}
                solicitudesEpp={solicitudesEpp}
                onActualizarInventario={handleActualizarInventarioEpp}
                onActualizarSolicitudes={handleActualizarSolicitudesEpp}
              />
            )}

            {currentView === 'nomina' && (
              <NominaView
                empleados={empleados}
                cargos={cargos}
                userRole={userRole}
                currentEmpleadoId={empleados[0]?.id || 'e1'}
              />
            )}

            {currentView === 'vacaciones' && (
              <ControlVacacionesView
                empleados={empleados}
                cargos={cargos}
                userRole={userRole}
                currentEmpleadoId={empleados[0]?.id || 'e1'}
              />
            )}

            {currentView === 'usuarios' && (
              <UsuariosView
                empleados={empleados}
                cargos={cargos}
                userRole={userRole}
                isSuperAdmin={isSuperAdmin}
                usuarios={usuariosList}
                onActualizarUsuarios={handleActualizarUsuarios}
              />
            )}

            {currentView === 'documentos' && (
              <DocumentosView
                cargos={cargos}
                empleados={empleados}
                evaluaciones={evaluaciones}
                onOpenEvaluacionDetalle={evalId => setActiveEvaluacionDetalleId(evalId)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal de Detalle Transversal de Evaluación */}
      {currentEvaluacionDetalle && (
        <EvaluacionDetalleModal
          evaluacion={currentEvaluacionDetalle}
          empleados={empleados}
          cargos={cargos}
          onClose={() => setActiveEvaluacionDetalleId(null)}
        />
      )}

      {/* Modal de Gestión de Datos en la Nube y Preparación de Producción (Exclusivo Superadministrador) */}
      {isSuperAdmin && gestionDatosModalOpen && (
        <GestionDatosModal
          onClose={() => setGestionDatosModalOpen(false)}
          empleadosCount={empleados.length}
          inventarioCount={inventarioEpp.length}
          solicitudesCount={solicitudes.length}
          cargos={cargos}
          onDatosLimpiados={handleDatosLimpiados}
          onCatalogoCargado={handleCatalogoCargado}
          onEmpleadosImportados={handleEmpleadosImportados}
          onLimpiarEpp={handleLimpiarEpp}
          onLimpiarCapacitaciones={handleLimpiarCapacitaciones}
          onLimpiarEstructura={handleLimpiarEstructura}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}
