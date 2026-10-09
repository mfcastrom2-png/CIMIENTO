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
  Scale,
  ShieldAlert,
  Stethoscope,
  Building2,
  Mail,
  Layers,
  Target,
  Database,
  QrCode,
  PenTool,
  ArrowRight
} from 'lucide-react';
import { Role, UsuarioSistema, RolSistema, ConfiguracionEmpresa } from '../types';
import { CorporateLogo } from './CorporateLogo';
import { LogoCimientoComercial } from './logos/LogosModulos';

interface SidebarProps {
  currentRole?: Role;
  currentView: string;
  onNavigate: (view: string) => void;
  pendingRequestsCount?: number;
  userName?: string;
  userSubtitle?: string;
  currentUser?: UsuarioSistema | null;
  onLogout?: () => void;
  empresa?: ConfiguracionEmpresa;
  onCambiarModulo?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole = 'admin',
  currentView,
  onNavigate,
  pendingRequestsCount = 0,
  userName = 'Dirección de Gestión Humana',
  userSubtitle = 'B GROUP INGENIERIA S.A.S.',
  currentUser,
  onLogout,
  empresa,
  onCambiarModulo
}) => {
  // Rol institucional real verificado desde el perfil de base de datos
  const rolReal: RolSistema = currentUser?.rol || 'empleado';
  const esAdminReal = rolReal === 'superadmin' || rolReal === 'admin_gh';

  // Solo si es administrador real puede simular la vista de prueba de empleado
  const rol: RolSistema = esAdminReal ? (currentRole === 'empleado' ? 'empleado' : rolReal) : rolReal;
  const permisos = currentUser?.permisos || [];

  const tienePermiso = (modulo: string) => {
    // Si el usuario autenticado real es colaborador/empleado, se rige estrictamente por sus permisos asignados
    if (rolReal === 'empleado') {
      if (modulo === 'evaluaciones') return true;
      if (modulo === 'documentos') return false; // El repositorio y generador de documentos institucionales es administrativo
      return permisos.includes(modulo);
    }
    // Si un administrador real está simulando la vista de empleado, filtrar módulos administrativos para fidelidad de prueba
    if (rol === 'empleado') {
      return ['dashboard', 'solicitudes', 'capacitaciones', 'vacaciones', 'votaciones-sst', 'epps', 'evaluaciones', 'nomina'].includes(modulo);
    }
    if (rol === 'superadmin' || rol === 'admin_gh') return true;
    if (permisos.includes(modulo)) return true;
    return false;
  };

  const esEmpleado = rolReal === 'empleado' || rol === 'empleado';
  const esSST = rolReal === 'responsable_sst';

  return (
    <aside className="w-64 bg-[#18235C] text-white flex flex-col shrink-0 min-h-screen p-5 select-none border-r border-[#101740]">
      {/* Brand Header */}
      <div className="pb-4 border-b border-[#8FA7D6]/20 mb-4 space-y-2">
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center max-h-16 overflow-hidden">
          <CorporateLogo
            logoUrl={empresa?.identidadVisual?.logoUrl}
            nombreComercial={empresa?.nombreComercial || 'B GROUP INGENIERIA'}
            size="sm"
            imageClassName="max-h-11 w-auto max-w-full object-contain"
          />
        </div>
        <div className="min-w-0 px-1">
          <span className="text-sm font-bold tracking-wide text-white block leading-tight truncate" title={empresa?.nombreComercial || 'B GROUP'}>
            {empresa?.nombreComercial || 'B GROUP'}
          </span>
          <span className="text-[10px] text-[#8FA7D6] tracking-wider font-semibold block leading-tight truncate" title={empresa?.razonSocial || 'INGENIERIA S.A.S.'}>
            {empresa?.razonSocial || 'INGENIERIA S.A.S.'}
          </span>
        </div>

        {/* Acceso a Cimiento Comercial: Solo para roles administrativos */}
        {(rolReal === 'superadmin' || rolReal === 'admin_gh') && onCambiarModulo && (
          <button
            type="button"
            onClick={onCambiarModulo}
            className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B]/20 via-[#D97706]/20 to-[#B45309]/20 hover:from-[#F59E0B]/30 hover:to-[#D97706]/30 border border-[#F59E0B]/40 text-[#FDE68A] text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs"
            title="Ingresar a la terminal de gestión comercial"
          >
            <div className="flex items-center gap-1.5 truncate">
              <LogoCimientoComercial size={16} />
              <span className="truncate">Cimiento Comercial</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          </button>
        )}
      </div>

      {/* Navigation Links based on RBAC */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        
        {/* SECCIÓN GENERAL */}
        <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-2 pb-1">
          {esEmpleado ? 'Mi Portal' : 'General'}
        </div>

        {tienePermiso('dashboard') && (
          <>
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
              <span>{esEmpleado ? 'Tablero de Anuncios' : 'Dashboard'}</span>
            </button>

            <button
              id="nav-muro"
              onClick={() => onNavigate('muro')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                currentView === 'muro'
                  ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                  : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${currentView === 'muro' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
              <span>Muro de Documentos</span>
            </button>
          </>
        )}

        {/* SI ES EMPLEADO: SERVICIOS DIRECTOS DEL TRABAJADOR */}
        {esEmpleado && (
          <>
            {(tienePermiso('nomina') || tienePermiso('epps') || tienePermiso('solicitudes') || tienePermiso('vacaciones')) && (
              <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                Mis Servicios & Pagos
              </div>
            )}

            {tienePermiso('nomina') && (
              <button
                id="nav-nomina-empleado"
                onClick={() => onNavigate('nomina')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'nomina'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <FileDown className={`w-4 h-4 ${currentView === 'nomina' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                <span>Mi Desprendible de Pago</span>
              </button>
            )}

            <button
              id="nav-firma-digital-empleado"
              onClick={() => onNavigate('firma-digital')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                currentView === 'firma-digital' || currentView === 'firma'
                  ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                  : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
              }`}
            >
              <PenTool className={`w-4 h-4 ${currentView === 'firma-digital' || currentView === 'firma' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
              <span>Mi Firma Digital</span>
            </button>

            {tienePermiso('epps') && (
              <button
                id="nav-epp-empleado"
                onClick={() => onNavigate('epps')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'epps'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <HardHat className={`w-4 h-4 ${currentView === 'epps' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                <span>Solicitar EPPs & Dotación</span>
              </button>
            )}

            {tienePermiso('solicitudes') && (
              <button
                id="nav-solicitudes-empleado"
                onClick={() => onNavigate('solicitudes')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'solicitudes'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <CalendarCheck className={`w-4 h-4 ${currentView === 'solicitudes' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                <span>Permisos & Solicitudes</span>
              </button>
            )}

            {tienePermiso('vacaciones') && (
              <button
                id="nav-vacaciones-empleado"
                onClick={() => onNavigate('vacaciones')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'vacaciones'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <Palmtree className={`w-4 h-4 ${currentView === 'vacaciones' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                <span>Mis Vacaciones</span>
              </button>
            )}

            {(tienePermiso('evaluaciones') || tienePermiso('capacitaciones')) && (
              <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                Desempeño & Formación
              </div>
            )}

            {tienePermiso('evaluaciones') && (
              <button
                id="nav-evaluaciones-empleado"
                onClick={() => onNavigate('evaluaciones')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'evaluaciones'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <Award className={`w-4 h-4 ${currentView === 'evaluaciones' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                <span>Evaluación de Desempeño</span>
              </button>
            )}

            {tienePermiso('capacitaciones') && (
              <button
                id="nav-capacitaciones-empleado"
                onClick={() => onNavigate('capacitaciones')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'capacitaciones'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${currentView === 'capacitaciones' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                <span>Mis Capacitaciones</span>
              </button>
            )}

            {tienePermiso('votaciones-sst') && (
              <>
                <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                  Participación & SST
                </div>

                <button
                  id="nav-votaciones-sst-empleado"
                  onClick={() => onNavigate('votaciones-sst')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    currentView === 'votaciones-sst'
                      ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                      : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                  }`}
                >
                  <Vote className={`w-4 h-4 ${currentView === 'votaciones-sst' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                  <span>Votaciones</span>
                </button>
              </>
            )}
          </>
        )}

        {/* NAVEGACIÓN PARA ROLES ADMINISTRATIVOS, LÍDERES Y SST */}
        {!esEmpleado && (
          <>
            {/* SECCIÓN ORGANIZACIÓN */}
            {(tienePermiso('empresa') || tienePermiso('estructura') || tienePermiso('cargos') || rol === 'superadmin' || rol === 'admin_gh') && (
              <>
                <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                  Organización
                </div>
                {(tienePermiso('empresa') || rol === 'superadmin' || rol === 'admin_gh') && (
                  <button
                    id="nav-empresa"
                    onClick={() => onNavigate('empresa')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'empresa'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${currentView === 'empresa' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                    <span>Datos de la Empresa</span>
                  </button>
                )}
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
                    <span>Gestión de Empleados</span>
                  </button>
                )}
                {tienePermiso('evaluaciones') && (
                  <button
                    id="nav-evaluaciones"
                    onClick={() => onNavigate('evaluaciones')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'evaluaciones'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <Award className={`w-4 h-4 ${currentView === 'evaluaciones' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                    <span>Evaluación desempeño</span>
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
            {(tienePermiso('sst') || tienePermiso('matriz-gtc45') || tienePermiso('indicadores-sst') || tienePermiso('sst-examenes') || tienePermiso('examenes') || tienePermiso('epps') || tienePermiso('votaciones-sst') || esSST || rol === 'superadmin' || rol === 'admin_gh') && (
              <>
                <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                  Seguridad & SG-SST
                </div>
                {(tienePermiso('sst') || esSST || rol === 'superadmin' || rol === 'admin_gh') && (
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
                )}

                {(tienePermiso('matriz-gtc45') || tienePermiso('sst') || esSST || rol === 'superadmin' || rol === 'admin_gh') && (
                  <button
                    id="nav-matriz-gtc45"
                    onClick={() => onNavigate('matriz-gtc45')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'matriz-gtc45' || currentView === 'matriz-riesgos'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className={`w-4 h-4 ${currentView === 'matriz-gtc45' || currentView === 'matriz-riesgos' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                      <span>Matriz de Riesgos</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      currentView === 'matriz-gtc45' || currentView === 'matriz-riesgos' ? 'bg-[#18235C] text-white' : 'bg-[#8FA7D6]/20 text-[#8FA7D6]'
                    }`}>
                      GTC 45
                    </span>
                  </button>
                )}

                {(tienePermiso('indicadores-sst') || tienePermiso('sst') || esSST || rol === 'superadmin' || rol === 'admin_gh') && (
                  <button
                    id="nav-indicadores-sst"
                    onClick={() => onNavigate('indicadores-sst')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'indicadores-sst' || currentView === 'sst-indicadores' || currentView === 'indicadores'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Target className={`w-4 h-4 ${currentView === 'indicadores-sst' || currentView === 'sst-indicadores' || currentView === 'indicadores' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                      <span>Indicadores SG-SST</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      currentView === 'indicadores-sst' || currentView === 'sst-indicadores' || currentView === 'indicadores' ? 'bg-[#18235C] text-white' : 'bg-[#00FF00]/20 text-[#00FF00]'
                    }`}>
                      PHVA / 0312
                    </span>
                  </button>
                )}

                {(tienePermiso('sst-examenes') || tienePermiso('examenes') || tienePermiso('sst') || esSST || rol === 'superadmin' || rol === 'admin_gh') && (
                  <button
                    id="nav-sst-examenes"
                    onClick={() => onNavigate('sst-examenes')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'sst-examenes' || currentView === 'examenes-medicos' || currentView === 'examenes'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Stethoscope className={`w-4 h-4 ${currentView === 'sst-examenes' || currentView === 'examenes-medicos' || currentView === 'examenes' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                      <span>Exámenes Médicos</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      currentView === 'sst-examenes' || currentView === 'examenes-medicos' || currentView === 'examenes' ? 'bg-[#18235C] text-white' : 'bg-[#00FF00]/20 text-[#00FF00]'
                    }`}>
                      SST
                    </span>
                  </button>
                )}

                {(tienePermiso('epps') || esSST || rol === 'superadmin' || rol === 'admin_gh') && (
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
                )}

                {(tienePermiso('votaciones-sst') || tienePermiso('sst') || esSST || rol === 'superadmin' || rol === 'admin_gh') && (
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
                      <span>Votaciones & Comités</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      currentView === 'votaciones-sst' ? 'bg-[#18235C] text-white' : 'bg-[#00FF00]/20 text-[#00FF00]'
                    }`}>
                      COPASST
                    </span>
                  </button>
                )}

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
            {(tienePermiso('nomina') || tienePermiso('parametros-nomina') || tienePermiso('vacaciones') || rol === 'admin_gh' || rol === 'superadmin') && (
              <>
                <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider px-3 pt-3 pb-1">
                  Finanzas & Compensación
                </div>
                {(tienePermiso('nomina') || rol === 'admin_gh' || rol === 'superadmin') && (
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
                )}

                {(tienePermiso('parametros-nomina') || rol === 'admin_gh' || rol === 'superadmin') && (
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
                )}

                {(tienePermiso('vacaciones') || tienePermiso('nomina') || rol === 'admin_gh' || rol === 'superadmin') && (
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
                )}

                {(tienePermiso('saldos-iniciales') || tienePermiso('nomina') || rol === 'admin_gh' || rol === 'superadmin') && (
                  <button
                    id="nav-saldos-iniciales"
                    onClick={() => onNavigate('saldos-iniciales')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      currentView === 'saldos-iniciales' || currentView === 'saldos'
                        ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                        : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className={`w-4 h-4 ${currentView === 'saldos-iniciales' || currentView === 'saldos' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                      <span>Saldos Iniciales</span>
                    </div>
                    <span className="text-[10px] bg-[#101740] text-[#00FF00] px-1.5 py-0.5 rounded font-bold">
                      Carga Masiva
                    </span>
                  </button>
                )}
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

            {/* Verificar Certificados: Exclusivo Gestión Humana y Administrador */}
            {(rol === 'superadmin' || rol === 'admin_gh') && (
              <button
                id="nav-verificador-certificados"
                onClick={() => onNavigate('verificar-certificados')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'verificar-certificados' || currentView === 'verificar'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
                title="Verificar autenticidad de diplomas SST y certificados laborales (Exclusivo GH y Administrador)"
              >
                <div className="flex items-center gap-3">
                  <QrCode className={`w-4 h-4 ${currentView === 'verificar-certificados' || currentView === 'verificar' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                  <span>Verificar Certificados</span>
                </div>
                <span className="text-[10px] bg-[#101740] text-[#00FF00] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5 text-[#00FF00]" />
                  GH/Admin
                </span>
              </button>
            )}

            {/* Estudio de Firma Digital */}
            {(rol === 'superadmin' || rol === 'admin_gh') && (
              <button
                id="nav-firma-digital-admin"
                onClick={() => onNavigate('firma-digital')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'firma-digital' || currentView === 'firma'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
                title="Herramienta institucional de dibujo, configuración y estampado de firma digital"
              >
                <div className="flex items-center gap-3">
                  <PenTool className={`w-4 h-4 ${currentView === 'firma-digital' || currentView === 'firma' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
                  <span>Estudio de Firma Digital</span>
                </div>
                <span className="text-[10px] bg-[#8FA7D6]/20 text-[#8FA7D6] px-1.5 py-0.5 rounded font-bold">
                  Ley 527
                </span>
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

            {(tienePermiso('buzon-correo') || rol === 'superadmin' || rol === 'admin_gh') && (
              <button
                id="nav-buzon-correo"
                onClick={() => onNavigate('buzon-correo')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'buzon-correo'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Mail className={`w-4 h-4 ${currentView === 'buzon-correo' ? 'text-[#18235C]' : 'text-[#00FF00]'}`} />
                  <span>Buzón de Notificaciones</span>
                </div>
                <span className="text-[10px] bg-[#101740] text-[#00FF00] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5 text-[#00FF00]" />
                  SMTP
                </span>
              </button>
            )}

            {(rol === 'superadmin' || rol === 'admin_gh' || tienePermiso('auditoria')) && (
              <button
                id="nav-auditoria"
                onClick={() => onNavigate('auditoria')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  currentView === 'auditoria'
                    ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
                    : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className={`w-4 h-4 ${currentView === 'auditoria' ? 'text-[#18235C]' : 'text-amber-400'}`} />
                  <span>Auditoría & Trazabilidad</span>
                </div>
                <span className="text-[10px] bg-[#101740] text-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  Audit
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
