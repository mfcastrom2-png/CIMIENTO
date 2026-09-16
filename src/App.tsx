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
  Role
} from './types';
import {
  initialAreas,
  initialCargos,
  initialEmpleados,
  initialSolicitudes,
  initialEvaluaciones
} from './data/initialData';
import { INITIAL_INVENTARIO_EPP, INITIAL_SOLICITUDES_ENTREGA_EPP } from './data/eppData';
import { INITIAL_USUARIOS_SISTEMA } from './data/usuariosYVotacionesData';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EstructuraView } from './components/EstructuraView';
import { ManualCargosView } from './components/ManualCargosView';
import { EmpleadosView } from './components/EmpleadosView';
import { EvaluacionesAdminView } from './components/EvaluacionesAdminView';
import { SolicitudesView } from './components/SolicitudesView';
import { DocumentosView } from './components/DocumentosView';
import { NominaView } from './components/NominaView';
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
  guardarSolicitudGeneralFB,
  guardarEvaluacionFB,
  guardarInventarioEppFB,
  guardarSolicitudEppFB,
  cerrarSesion
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'estructura' | 'cargos' | 'empleados' | 'evaluaciones' | 'solicitudes' | 'documentos' | 'nomina' | 'sst' | 'epps' | 'capacitaciones' | 'usuarios' | 'vacaciones' | 'votaciones-sst'
  >('dashboard');

  // Sesión y Autenticación
  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(() => {
    const saved = localStorage.getItem('bgroup_session_user') || localStorage.getItem('cimiento_session_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.email?.endsWith('@empresa.com')) {
          return parsed;
        }
      } catch {
        // Fallback al administrador real
      }
    }
    // Usuario Super Administrador oficial
    return INITIAL_USUARIOS_SISTEMA[0];
  });

  const [userRole, setUserRole] = useState<Role>(() => {
    return currentUser?.rol === 'empleado' ? 'empleado' : 'admin';
  });

  // Modal de preparación / limpieza de base de datos para producción
  const [gestionDatosModalOpen, setGestionDatosModalOpen] = useState(false);

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
  const [usuariosList, setUsuariosList] = useState<UsuarioSistema[]>(INITIAL_USUARIOS_SISTEMA);

  // Estado de sincronización en la nube
  const [cloudSynced, setCloudSynced] = useState<boolean>(true);

  // Modal de detalle de evaluación (accesible transversalmente)
  const [activeEvaluacionDetalleId, setActiveEvaluacionDetalleId] = useState<string | null>(null);

  // Escuchar cambios de autenticación en Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Usuario autenticado con Firebase Auth
        const profile: UsuarioSistema = {
          id: fbUser.uid,
          nombre: fbUser.displayName || fbUser.email?.split('@')[0] || 'Administrador',
          email: fbUser.email || '',
          documento: '—',
          rol: fbUser.email?.includes('admin') || fbUser.email?.includes('castro') ? 'admin_gh' : 'admin_gh',
          estado: 'activo',
          ultimoAcceso: new Date().toISOString(),
          fechaCreacion: new Date().toISOString(),
          dobleFactorHabilitado: false,
          permisos: ['dashboard', 'empleados', 'cargos', 'estructura', 'evaluaciones', 'solicitudes', 'nomina', 'sst', 'capacitaciones', 'vacaciones', 'usuarios', 'documentos']
        };
        setCurrentUser(profile);
        setUserRole('admin');
        localStorage.setItem('bgroup_session_user', JSON.stringify(profile));
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sincronización en tiempo real con Firestore
  useEffect(() => {
    // 0. Detectar configuración de empresa limpia en la nube
    const unsubConfig = onSnapshot(doc(db, 'configuracion_empresa', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const configData = docSnap.data();
        if (configData.datosLimpios) {
          localStorage.setItem('bgroup_datos_limpios', 'true');
          setEsLimpio(true);
        }
      }
    });

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
  }, []);

  // Al cambiar usuario o cerrar sesión
  const handleLoginSuccess = (usuario: UsuarioSistema) => {
    setCurrentUser(usuario);
    setUserRole(usuario.rol === 'empleado' ? 'empleado' : 'admin');
    localStorage.setItem('bgroup_session_user', JSON.stringify(usuario));
  };

  const handleLogout = async () => {
    try {
      await cerrarSesion();
    } catch {
      // Ignorar error si no había sesión de Firebase SDK activa
    }
    setCurrentUser(null);
    localStorage.removeItem('bgroup_session_user');
    localStorage.removeItem('cimiento_session_user');
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

  const handleAddEmpleado = async (nuevoEmpleado: Empleado) => {
    setEmpleados(prev => [...prev, nuevoEmpleado]);
    try {
      await guardarEmpleadoFB(nuevoEmpleado);
    } catch (err) {
      console.warn('Error al guardar empleado en Firestore:', err);
    }
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
            <button
              type="button"
              onClick={() => setGestionDatosModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101740] hover:bg-[#18235C] text-white border border-[#8FA7D6]/40 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Administrar base de datos en la nube, limpiar datos de prueba o cargar nómina real"
            >
              <Cloud className="w-3.5 h-3.5 text-[#8FA7D6]" />
              <span className="hidden md:inline text-[#8FA7D6]">Base en Nube:</span>
              <span className="font-bold text-white">Firebase</span>
              <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00] animate-pulse" />
            </button>

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
            {/* Botón secundario: fondo #8FA7D6 y texto #18235C */}
            <button
              onClick={() => setGestionDatosModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#8FA7D6] hover:bg-white text-[#18235C] font-bold transition-colors shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-[#18235C]" />
              <span>Base de Datos</span>
            </button>

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
                onOpenGestionDatos={() => setGestionDatosModalOpen(true)}
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

      {/* Modal de Gestión de Datos en la Nube y Preparación de Producción */}
      {gestionDatosModalOpen && (
        <GestionDatosModal
          onClose={() => setGestionDatosModalOpen(false)}
          empleadosCount={empleados.length}
          inventarioCount={inventarioEpp.length}
          solicitudesCount={solicitudes.length}
          cargos={cargos}
          onDatosLimpiados={handleDatosLimpiados}
          onCatalogoCargado={handleCatalogoCargado}
          onEmpleadosImportados={handleEmpleadosImportados}
        />
      )}
    </div>
  );
}
