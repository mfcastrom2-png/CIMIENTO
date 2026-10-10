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
  const rolReal: RolSistema = currentUser?.rol || 'empleado';
  const esAdminReal = rolReal === 'superadmin' || rolReal === 'admin_gh';
  const rol: RolSistema = esAdminReal ? (currentRole === 'empleado' ? 'empleado' : rolReal) : rolReal;
  const permisos = currentUser?.permisos || [];

  const tienePermiso = (modulo: string) => {
    if (rolReal === 'empleado') {
      if (modulo === 'evaluaciones') return true;
      if (modulo === 'documentos') return false;
      return permisos.includes(modulo);
    }
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

      <div className="mb-3">
        <button
          type="button"
          onClick={() => onNavigate('portal')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
            currentView === 'portal'
              ? 'bg-[#8FA7D6] text-[#18235C] font-bold shadow-xs'
              : 'text-white/90 hover:bg-[#8FA7D6]/15 hover:text-white'
          }`}
          aria-label="Abrir portal de módulos"
        >
          <div className="flex items-center gap-3">
            <Layers className={`w-4 h-4 ${currentView === 'portal' ? 'text-[#18235C]' : 'text-[#8FA7D6]'}`} />
            <span>Portal de Módulos</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#00FF00] shrink-0" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
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
          </>
        )}
      </nav>

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
