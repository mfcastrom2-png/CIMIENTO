import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  BookOpen,
  Users,
  Award,
  CalendarCheck,
  FileText,
  ShieldCheck,
  GraduationCap,
  HardHat,
  Receipt,
  Lock,
  Vote,
  Palmtree,
  UserCog,
  Clock,
  LogOut,
  Package,
  FileDown,
  Warehouse,
  Scale
} from 'lucide-react';
import { Role, UsuarioSistema } from '../types';

interface SidebarProps {
  currentRole?: Role;
  currentView: string;
  onNavigate: (view: string) => void;
  pendingRequestsCount?: number;
  userName?: string;
  userSubtitle?: string;
  currentUser?: UsuarioSistema | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole = 'admin',
  currentView,
  onNavigate,
  pendingRequestsCount = 0,
  userName = 'Dirección de Gestión Humana',
  userSubtitle = 'B GROUP INGENIERIA S.A.S.',
  currentUser,
  onLogout
}) => {
  const rol = currentUser?.rol || (currentRole === 'admin' ? 'admin_gh' : 'empleado');
  const permisos = currentUser?.permisos || [];

  const tienePermiso = (modulo: string) => {
    if (rol === 'superadmin' || rol === 'admin_gh') return true;
    if (permisos.includes(modulo)) return true;
    return false;
  };

  const esEmpleado = rol === 'empleado';
  const esSST = rol === 'responsable_sst';

  return (
    <aside className="w-64 bg-[#18235C] text-white flex flex-col shrink-0 min-h-screen p-5 select-none border-r border-[#101740]">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-[#8FA7D6]/20 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#101740] border border-[#8FA7D6]/60 flex items-center justify-center shrink-0 shadow-xs">
          <span className="font-bold text-lg text-[#00FF00]">B</span>
        </div>
        <div>
          <span className="text-base font-bold tracking-wide text-white block leading-tight">
            B GROUP
          </span>
          <span className="text-[10px] text-[#8FA7D6] tracking-wider font-semibold block leading-tight">
            INGENIERIA S.A.S.
          </span>
        </div>
      </div>

      {/* Navigation Links based on RBAC */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        
        {/* SECCIÓN GENERAL */}
        <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-2 pb-1">
          {esEmpleado ? 'Mi Portal' : 'General'}
        </div>

        {tienePermiso('dashboard') && (
          <button
            id="nav-dashboard"
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              currentView === 'dashboard'
                ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
            <span>{esEmpleado ? 'Mi Tablero de Resumen' : 'Tablero de control'}</span>
          </button>
        )}

        {/* SI ES EMPLEADO: SERVICIOS DIRECTOS DEL TRABAJADOR */}
        {esEmpleado && (
          <>
            <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
              Mis Servicios & Pagos
            </div>

            <button
              id="nav-nomina-empleado"
              onClick={() => onNavigate('nomina')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                currentView === 'nomina'
                  ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                  : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileDown className={`w-4 h-4 ${currentView === 'nomina' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                <span>Mi Desprendible de Pago</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'nomina' ? 'bg-[#18235C] text-[#00FF00]' : 'bg-[#00FF00] text-[#18235C]'
              }`}>
                Descargar
              </span>
            </button>

            <button
              id="nav-epp-empleado"
              onClick={() => onNavigate('epps')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                currentView === 'epps'
                  ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                  : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <HardHat className={`w-4 h-4 ${currentView === 'epps' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                <span>Solicitar EPPs & Dotación</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'epps' ? 'bg-[#18235C] text-[#8FA7D6]' : 'bg-[#8FA7D6]/20 text-[#8FA7D6]'
              }`}>
                Res. 2400
              </span>
            </button>

            <button
              id="nav-solicitudes-empleado"
              onClick={() => onNavigate('solicitudes')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                currentView === 'solicitudes'
                  ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                  : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className={`w-4 h-4 ${currentView === 'solicitudes' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                <span>Permisos & Solicitudes</span>
              </div>
            </button>

            <button
              id="nav-vacaciones-empleado"
              onClick={() => onNavigate('vacaciones')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                currentView === 'vacaciones'
                  ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                  : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Palmtree className={`w-4 h-4 ${currentView === 'vacaciones' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                <span>Mis Vacaciones (CST 186)</span>
              </div>
            </button>

            <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
              Participación & SST
            </div>

            <button
              id="nav-votaciones-sst-empleado"
              onClick={() => onNavigate('votaciones-sst')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                currentView === 'votaciones-sst'
                  ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                  : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Vote className={`w-4 h-4 ${currentView === 'votaciones-sst' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                <span>Votar COPASST & Convivencia</span>
              </div>
              <span className="text-[10px] bg-[#00FF00] text-[#18235C] px-1.5 py-0.5 rounded font-bold">
                Activa
              </span>
            </button>

            <button
              id="nav-capacitaciones-empleado"
              onClick={() => onNavigate('capacitaciones')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                currentView === 'capacitaciones'
                  ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                  : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className={`w-4 h-4 ${currentView === 'capacitaciones' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                <span>Mis Capacitaciones</span>
              </div>
            </button>
          </>
        )}

        {/* NAVEGACIÓN PARA ROLES ADMINISTRATIVOS, LÍDERES Y SST */}
        {!esEmpleado && (
          <>
            {/* SECCIÓN ORGANIZACIÓN */}
            {(tienePermiso('estructura') || tienePermiso('cargos')) && (
              <>
                <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                  Organización
                </div>
                {tienePermiso('estructura') && (
                  <button
                    id="nav-estructura"
                    onClick={() => onNavigate('estructura')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'estructura'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <GitFork className={`w-4 h-4 ${currentView === 'estructura' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                    <span>Estructura organizacional</span>
                  </button>
                )}
                {tienePermiso('cargos') && (
                  <button
                    id="nav-cargos"
                    onClick={() => onNavigate('cargos')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'cargos'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <BookOpen className={`w-4 h-4 ${currentView === 'cargos' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                    <span>Manual de cargos</span>
                  </button>
                )}
              </>
            )}

            {/* SECCIÓN PERSONAS */}
            {(tienePermiso('empleados') || tienePermiso('evaluaciones') || tienePermiso('solicitudes')) && (
              <>
                <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                  Personas & Desempeño
                </div>
                {tienePermiso('empleados') && (
                  <button
                    id="nav-empleados"
                    onClick={() => onNavigate('empleados')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'empleados'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <Users className={`w-4 h-4 ${currentView === 'empleados' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                    <span>Colaboradores</span>
                  </button>
                )}
                {tienePermiso('evaluaciones') && (
                  <button
                    id="nav-evaluaciones"
                    onClick={() => onNavigate('evaluaciones')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'evaluaciones'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Award className={`w-4 h-4 ${currentView === 'evaluaciones' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                      <span>Evaluación desempeño</span>
                    </div>
                    <span className="text-[10px] bg-[#00FF00] text-[#18235C] px-1.5 py-0.5 rounded font-bold">
                      100 pts
                    </span>
                  </button>
                )}
                {tienePermiso('solicitudes') && (
                  <button
                    id="nav-solicitudes"
                    onClick={() => onNavigate('solicitudes')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'solicitudes'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CalendarCheck className={`w-4 h-4 ${currentView === 'solicitudes' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                      <span>Solicitudes</span>
                    </div>
                    {pendingRequestsCount > 0 && (
                      <span className="text-[10px] bg-[#00FF00] text-[#18235C] px-1.5 py-0.5 rounded font-bold">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </button>
                )}
              </>
            )}

            {/* SECCIÓN SEGURIDAD & SST */}
            {(tienePermiso('sst') || tienePermiso('epps') || esSST) && (
              <>
                <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                  Seguridad & SG-SST
                </div>
                <button
                  id="nav-sst"
                  onClick={() => onNavigate('sst')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    currentView === 'sst'
                      ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                      : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HardHat className={`w-4 h-4 ${currentView === 'sst' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                    <span>SG-SST Res. 0312</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    currentView === 'sst' ? 'bg-[#18235C] text-[#8FA7D6]' : 'bg-[#8FA7D6]/20 text-[#8FA7D6]'
                  }`}>
                    21 Estándares
                  </span>
                </button>

                <button
                  id="nav-epps"
                  onClick={() => onNavigate('epps')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    currentView === 'epps'
                      ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                      : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Warehouse className={`w-4 h-4 ${currentView === 'epps' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                    <span>Inventario de EPPs</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    currentView === 'epps' ? 'bg-[#18235C] text-white' : 'bg-[#8FA7D6]/20 text-[#8FA7D6]'
                  }`}>
                    Almacén
                  </span>
                </button>

                <button
                  id="nav-votaciones-sst"
                  onClick={() => onNavigate('votaciones-sst')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    currentView === 'votaciones-sst'
                      ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                      : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Vote className={`w-4 h-4 ${currentView === 'votaciones-sst' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                    <span>Votaciones COPASST</span>
                  </div>
                  <span className="text-[10px] bg-[#00FF00] text-[#18235C] px-1.5 py-0.5 rounded font-bold">
                    Elecciones
                  </span>
                </button>

                {tienePermiso('capacitaciones') && (
                  <button
                    id="nav-capacitaciones"
                    onClick={() => onNavigate('capacitaciones')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'capacitaciones'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap className={`w-4 h-4 ${currentView === 'capacitaciones' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                      <span>Capacitaciones</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      currentView === 'capacitaciones' ? 'bg-[#18235C] text-[#8FA7D6]' : 'bg-[#8FA7D6]/20 text-[#8FA7D6]'
                    }`}>
                      2026
                    </span>
                  </button>
                )}
              </>
            )}

            {/* SECCIÓN FINANZAS & COMPENSACIÓN */}
            {(tienePermiso('nomina') || rol === 'admin_gh' || rol === 'superadmin') && (
              <>
                <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                  Finanzas & Compensación
                </div>
                <button
                  id="nav-nomina"
                  onClick={() => onNavigate('nomina')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    currentView === 'nomina'
                      ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                      : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Receipt className={`w-4 h-4 ${currentView === 'nomina' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                    <span>Nómina y Prestaciones</span>
                  </div>
                  <span className="text-[10px] bg-[#101740] text-[#00FF00] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 text-[#00FF00]" />
                    Admin
                  </span>
                </button>

                <button
                  id="nav-parametros-nomina"
                  onClick={() => onNavigate('parametros-nomina')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    currentView === 'parametros-nomina'
                      ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                      : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Scale className={`w-4 h-4 ${currentView === 'parametros-nomina' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                    <span>Parámetros de Nómina</span>
                  </div>
                  <span className="text-[10px] bg-[#101740] text-[#00FF00] px-1.5 py-0.5 rounded font-bold">
                    SMMLV
                  </span>
                </button>

                <button
                  id="nav-vacaciones"
                  onClick={() => onNavigate('vacaciones')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    currentView === 'vacaciones'
                      ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                      : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Palmtree className={`w-4 h-4 ${currentView === 'vacaciones' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                    <span>Control de Vacaciones</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    currentView === 'vacaciones' ? 'bg-[#18235C] text-[#8FA7D6]' : 'bg-[#8FA7D6]/20 text-[#8FA7D6]'
                  }`}>
                    Art. 186 CST
                  </span>
                </button>
              </>
            )}

            {/* SECCIÓN DOCUMENTOS Y GOBERNANZA */}
            <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
              Documentos & Sistema
            </div>
            {tienePermiso('documentos') && (
              <button
                id="nav-documentos"
                onClick={() => onNavigate('documentos')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'documentos'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <FileText className={`w-4 h-4 ${currentView === 'documentos' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                <span>Documentos y actas</span>
              </button>
            )}

            {tienePermiso('usuarios') && (
              <button
                id="nav-usuarios"
                onClick={() => onNavigate('usuarios')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'usuarios'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCog className={`w-4 h-4 ${currentView === 'usuarios' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                  <span>Gestión de Usuarios</span>
                </div>
                <span className="text-[10px] bg-[#101740] text-[#00FF00] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5 text-[#00FF00]" />
                  RBAC
                </span>
              </button>
            )}
          </>
        )}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="pt-3 mt-auto border-t border-[#8FA7D6]/20 space-y-2">
        <div className="bg-[#101740] p-2.5 rounded-lg border border-[#8FA7D6]/30">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00FF00] shrink-0" />
              <span className="text-xs font-semibold text-white truncate">
                {currentUser?.nombre || userName}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8FA7D6] block truncate">
              {currentUser?.cargoNombre || userSubtitle}
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#8FA7D6]/20 text-[#00FF00] font-bold">
              {rol.replace('_', ' ')}
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-[#8FA7D6]/10 hover:bg-rose-950/40 text-xs text-[#8FA7D6] hover:text-white transition-colors"
            title="Cerrar sesión segura del sistema"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
};
