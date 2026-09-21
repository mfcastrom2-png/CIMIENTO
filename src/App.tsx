import React, { useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider, useCompanySync } from './context/SyncContext';

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
import { AuditoriaView } from './components/AuditoriaView';
import { EvaluacionDetalleModal } from './components/EvaluacionDetalleModal';
import { LoginView } from './components/LoginView';
import { GestionDatosModal } from './components/GestionDatosModal';

import {
  Bell,
  Cloud,
  Database,
  LogOut,
  User,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';

function AppLayout() {
  const { currentUser, userRole, setUserRole, logout, isSuperAdmin, loginSuccess } = useAuth();
  const {
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
    cargandoNube,
    hayMasEmpleadosNube,
    cargandoMasEmpleados,
    cargarMasEmpleadosNube,
    recargarDatosBajoDemanda,
    handleAddEmpleado,
    handleUpdateEmpleado,
    handleAddCargo,
    handleUpdateCargo,
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
    handleEmpleadosImportados
  } = useCompanySync();

  const navigate = useNavigate();
  const location = useLocation();

  const [activeEvaluacionDetalleId, setActiveEvaluacionDetalleId] = useState<string | null>(null);
  const [gestionDatosModalOpen, setGestionDatosModalOpen] = useState(false);

  // Derivar la vista actual desde el path del enrutador
  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  const pendientesCount = solicitudes.filter(s => s.estado === 'Pendiente').length;
  const currentEvaluacionDetalle = evaluaciones.find(e => e.id === activeEvaluacionDetalleId);

  if (!currentUser) {
    return (
      <LoginView
        usuarios={usuariosList}
        onLoginSuccess={loginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#FFFFFF] text-[#282829] overflow-hidden font-sans">
      {/* Sidebar de navegación con integración react-router-dom */}
      <Sidebar
        currentRole={userRole}
        currentView={currentPath}
        onNavigate={(view) => navigate('/' + view)}
        pendingRequestsCount={pendientesCount}
        currentUser={currentUser}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FFFFFF]">
        {/* Top Navbar Institucional */}
        <header className="h-14 bg-[#18235C] border-b border-[#101740] px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 text-white shadow-xs">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#101740] text-[#8FA7D6] border border-[#8FA7D6]/30">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>

            {/* Botón de Refresco Bajo Demanda (eliminando onSnapshot) */}
            <button
              type="button"
              onClick={() => recargarDatosBajoDemanda()}
              disabled={cargandoNube}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#101740] hover:bg-[#18235C] text-[#8FA7D6] hover:text-white border border-[#8FA7D6]/30 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
              title="Consultar lote actualizado de Firestore bajo demanda"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargandoNube ? 'animate-spin text-white' : 'text-[#8FA7D6]'}`} />
              <span className="hidden md:inline">{cargandoNube ? 'Consultando...' : 'Actualizar Nube'}</span>
            </button>

            {/* Cloud Database Status Pill */}
            {isSuperAdmin ? (
              <button
                type="button"
                id="btn-gestion-datos-nube"
                onClick={() => setGestionDatosModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101740] hover:bg-[#18235C] text-white border border-[#8FA7D6]/40 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Administrar base de datos en la nube (Exclusivo Superadministrador)"
              >
                <Cloud className="w-3.5 h-3.5 text-[#8FA7D6]" />
                <span className="hidden md:inline text-[#8FA7D6]">Base en Nube:</span>
                <span className="font-bold text-white">Firestore</span>
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

            {/* Selector de Rol para pruebas de auditoría */}
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
            {/* Botón de Auditoría Directo */}
            <button
              onClick={() => navigate('/auditoria')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors shadow-2xs ${
                currentPath === 'auditoria'
                  ? 'bg-amber-400 text-[#18235C] border-amber-300 font-bold'
                  : 'bg-[#101740] text-amber-300 hover:bg-[#18235C] border-amber-400/30'
              }`}
              title="Libro Mayor de Auditoría Inmutable (CST / DIAN / UGPP)"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Auditoría</span>
            </button>

            {/* Botón base de datos (Exclusivo Superadministrador) */}
            {isSuperAdmin && (
              <button
                onClick={() => setGestionDatosModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#8FA7D6] hover:bg-white text-[#18235C] font-bold transition-colors shadow-2xs"
                title="Administración y Depuración de Bases de Datos"
              >
                <Database className="w-3.5 h-3.5 text-[#18235C]" />
                <span>Base de Datos</span>
              </button>
            )}

            {/* Quick Pending Alert */}
            {pendientesCount > 0 && (
              <button
                onClick={() => navigate('/solicitudes')}
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
                onClick={logout}
                className="p-1.5 rounded-lg text-[#8FA7D6] hover:text-white hover:bg-[#8FA7D6]/20 transition-colors ml-1 cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-rose-300 hover:text-rose-200" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Route View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FFFFFF]">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <DashboardView
                    cargos={cargos}
                    empleados={empleados}
                    solicitudes={solicitudes}
                    evaluaciones={evaluaciones}
                    onNavigate={(view) => navigate('/' + view)}
                    onOpenEvaluacionDetalle={(evalId) => setActiveEvaluacionDetalleId(evalId)}
                    onOpenGestionDatos={isSuperAdmin ? () => setGestionDatosModalOpen(true) : undefined}
                  />
                }
              />
              <Route
                path="/estructura"
                element={
                  <EstructuraView
                    cargos={cargos}
                    empleados={empleados}
                    onAddCargo={handleAddCargo}
                    onSelectCargoForManual={(_cargoId) => navigate('/cargos')}
                    isSuperAdmin={isSuperAdmin}
                    onDepurarEstructura={isSuperAdmin ? handleLimpiarEstructura : undefined}
                  />
                }
              />
              <Route
                path="/cargos"
                element={
                  <ManualCargosView
                    cargos={cargos}
                    onUpdateCargo={handleUpdateCargo}
                    onAddCargo={handleAddCargo}
                  />
                }
              />
              <Route
                path="/empleados"
                element={
                  <EmpleadosView
                    empleados={empleados}
                    cargos={cargos}
                    solicitudes={solicitudes}
                    evaluaciones={evaluaciones}
                    onAddEmpleado={handleAddEmpleado}
                    onOpenEvaluacionDetalle={(evalId) => setActiveEvaluacionDetalleId(evalId)}
                    inventarioEpp={inventarioEpp}
                    solicitudesEpp={solicitudesEpp}
                    onActualizarInventario={handleActualizarInventarioEpp}
                    onActualizarSolicitudes={handleActualizarSolicitudesEpp}
                    userRole={userRole}
                    usuarios={usuariosList}
                    hayMasNube={hayMasEmpleadosNube}
                    cargandoMasNube={cargandoMasEmpleados}
                    onCargarMasNube={cargarMasEmpleadosNube}
                    cargandoNube={cargandoNube}
                    onRefrescarNube={recargarDatosBajoDemanda}
                  />
                }
              />
              <Route
                path="/evaluaciones"
                element={
                  <EvaluacionesAdminView
                    evaluaciones={evaluaciones}
                    empleados={empleados}
                    cargos={cargos}
                    onSaveEvaluacion={handleSaveEvaluacion}
                    onDeleteEvaluacion={handleDeleteEvaluacion}
                  />
                }
              />
              <Route
                path="/solicitudes"
                element={
                  <SolicitudesView
                    solicitudes={solicitudes}
                    empleados={empleados}
                    onAddSolicitud={handleAddSolicitud}
                    onUpdateEstado={handleUpdateEstadoSolicitud}
                  />
                }
              />
              <Route
                path="/capacitaciones"
                element={
                  <CapacitacionesView
                    cargos={cargos}
                    empleados={empleados}
                    userRole={userRole}
                    rolSistema={currentUser?.rol}
                  />
                }
              />
              <Route
                path="/sst"
                element={
                  <SstView
                    userRole={userRole}
                    currentEmpleadoId={empleados[0]?.id || 'e1'}
                    empleados={empleados}
                  />
                }
              />
              <Route
                path="/votaciones-sst"
                element={
                  <VotacionesSstView
                    userRole={userRole}
                    currentEmpleadoId={empleados[0]?.id || 'e1'}
                    empleados={empleados}
                  />
                }
              />
              <Route
                path="/epps"
                element={
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
                }
              />
              <Route
                path="/nomina"
                element={
                  <NominaView
                    empleados={empleados}
                    cargos={cargos}
                    userRole={userRole}
                    currentEmpleadoId={empleados[0]?.id || 'e1'}
                  />
                }
              />
              <Route
                path="/parametros-nomina"
                element={
                  <ParametrosNominaView
                    isSuperAdmin={isSuperAdmin}
                  />
                }
              />
              <Route
                path="/vacaciones"
                element={
                  <ControlVacacionesView
                    empleados={empleados}
                    cargos={cargos}
                    userRole={userRole}
                    currentEmpleadoId={empleados[0]?.id || 'e1'}
                  />
                }
              />
              <Route
                path="/usuarios"
                element={
                  <UsuariosView
                    empleados={empleados}
                    cargos={cargos}
                    userRole={userRole}
                    isSuperAdmin={isSuperAdmin}
                    usuarios={usuariosList}
                    onActualizarUsuarios={handleActualizarUsuarios}
                  />
                }
              />
              <Route
                path="/documentos"
                element={
                  <DocumentosView
                    cargos={cargos}
                    empleados={empleados}
                    evaluaciones={evaluaciones}
                    onOpenEvaluacionDetalle={(evalId) => setActiveEvaluacionDetalleId(evalId)}
                  />
                }
              />
              <Route
                path="/auditoria"
                element={<AuditoriaView currentUser={currentUser} />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
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

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SyncProvider>
          <AppLayout />
        </SyncProvider>
      </AuthProvider>
    </Router>
  );
}
