import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Shield,
  Receipt,
  FileText,
  Settings,
  GraduationCap,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { ModulosPortalCard } from './ModulosPortalCard';
import { getVisiblePortalModules } from './portalModules';
import { RolSistema, UsuarioSistema } from '../../types';

interface ModulosPortalViewProps {
  userRole: RolSistema | 'admin';
  currentUser?: UsuarioSistema | null;
  onNavigate: (view: string) => void;
  pendingRequestsCount?: number;
}

export function ModulosPortalView({
  userRole,
  currentUser,
  onNavigate,
  pendingRequestsCount = 0
}: ModulosPortalViewProps) {
  const rolEfectivo: RolSistema =
    currentUser?.rol === 'empleado' || userRole === 'empleado'
      ? 'empleado'
      : (userRole === 'admin' ? (currentUser?.rol || 'superadmin') : (currentUser?.rol || userRole || 'empleado'));

  const modulos = getVisiblePortalModules(rolEfectivo, currentUser?.permisos || []);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'gestion-humana',
    'solicitudes-servicios',
    'nomina-prestaciones'
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Scroll automático hacia el portal de módulos
    const container = document.getElementById('modulos-portal-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const categories = useMemo(() => [
    {
      id: 'gestion-humana',
      name: 'Gestión Humana & Expedientes',
      icon: Users,
      modules: Array.isArray(modulos?.gestionHumana) ? modulos.gestionHumana : []
    },
    {
      id: 'solicitudes-servicios',
      name: 'Solicitudes, Permisos & Trámites CST',
      icon: ClipboardList,
      modules: (Array.isArray(modulos?.solicitudes) ? modulos.solicitudes : []).map(m => {
        if (m.id === 'solicitudes' && pendingRequestsCount > 0) {
          return {
            ...m,
            badge: `${pendingRequestsCount} Pendiente${pendingRequestsCount > 1 ? 's' : ''}`
          };
        }
        return m;
      })
    },
    {
      id: 'nomina-prestaciones',
      name: 'Nómina, Recibos & Compensación',
      icon: Receipt,
      modules: Array.isArray(modulos?.finanzas) ? modulos.finanzas : []
    },
    {
      id: 'seguridad-sst',
      name: 'Seguridad y Salud en el Trabajo (SG-SST)',
      icon: Shield,
      modules: Array.isArray(modulos?.sst) ? modulos.sst : []
    },
    {
      id: 'documentacion',
      name: 'Gobernanza & Repositorio Documental',
      icon: FileText,
      modules: Array.isArray(modulos?.documentos) ? modulos.documentos : []
    },
    {
      id: 'formacion',
      name: 'Formación, Competencias & Evaluaciones',
      icon: GraduationCap,
      modules: Array.isArray(modulos?.capacitacion) ? modulos.capacitacion : []
    },
    {
      id: 'administracion',
      name: 'Administración, Auditoría & Control',
      icon: Settings,
      modules: Array.isArray(modulos?.administracion) ? modulos.administracion : []
    }
  ], [modulos, pendingRequestsCount]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.map(cat => ({
      ...cat,
      modules: cat.modules.filter(m =>
        m.titulo.toLowerCase().includes(term) ||
        m.descripcion.toLowerCase().includes(term) ||
        cat.name.toLowerCase().includes(term)
      )
    })).filter(cat => cat.modules.length > 0);
  }, [categories, searchTerm]);

  const totalModulosDisponibles = useMemo(() => {
    return categories.reduce((acc, cat) => acc + cat.modules.length, 0);
  }, [categories]);

  return (
    <div id="modulos-portal-container" className="w-full min-h-screen bg-[#F8FAFC] py-6 sm:py-8 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado Corporativo del Portal */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#8FA7D6]/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#18235C]/10 text-[#18235C] font-extrabold text-xs border border-[#18235C]/15 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#18235C]" />
                Portal de Colaboradores & Módulos
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold border border-slate-200">
                Rol: {rolEfectivo.toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#18235C] tracking-tight">
              Directorio de Servicios & Módulos CIMIENTO
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bienvenido a tu punto de acceso centralizado. Explora y gestiona tus trámites laborales, comprobantes de pago, solicitudes de vacaciones y herramientas operativas autorizadas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="p-4 rounded-2xl bg-[#18235C]/5 border border-[#8FA7D6]/30 text-center w-full md:w-auto">
              <span className="text-2xl font-black text-[#18235C] block">
                {totalModulosDisponibles}
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Módulos Habilitados
              </span>
            </div>
          </div>
        </div>

        {/* Banner Corporativo de Acceso Rápido a Solicitudes & Trámites */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#18235C] via-[#1E2958] to-[#1E3A8A] text-white shadow-md border border-[#18235C]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 border border-white/15 rounded-2xl text-[#F59E0B] shrink-0 shadow-inner">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold text-white">
                  Módulo de Solicitudes, Permisos & Trámites CST
                </span>
                {pendingRequestsCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#F59E0B] text-slate-900 shadow-sm animate-pulse">
                    {pendingRequestsCount} por gestionar
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Al día
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8FA7D6] mt-1 leading-relaxed max-w-xl">
                Radica incapacidades, licencias, permisos remunerados y solicitudes de vacaciones con seguimiento en tiempo real y respuesta oficial de Gestión Humana.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="portal-btn-ir-solicitudes"
            onClick={() => onNavigate('solicitudes')}
            className="px-5 py-3 bg-white hover:bg-slate-100 text-[#18235C] text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>Gestionar Mis Solicitudes</span>
            <ChevronRight className="w-4 h-4 text-[#18235C]" />
          </button>
        </div>

        {/* Buscador de Módulos */}
        <div className="relative max-w-lg mx-auto">
          <Search className="w-4 h-4 text-[#18235C] absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por módulo, trámite o servicio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#8FA7D6]/40 rounded-2xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#18235C]/20 focus:border-[#18235C] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Categorías de módulos con estilo corporativo armonizado */}
        <div className="space-y-4">
          {filteredCategories.map((category) => {
            const CategoryIcon = category.icon;
            const hasModules = category.modules.length > 0;
            const isExpanded = searchTerm.trim().length > 0 || expandedCategories.includes(category.id);

            if (!hasModules) return null;

            return (
              <div
                key={category.id}
                className="bg-white rounded-2xl border border-[#8FA7D6]/30 shadow-xs overflow-hidden transition-all hover:border-[#8FA7D6]/60"
              >
                {/* Encabezado de categoría */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-[#18235C]/10 text-[#18235C] rounded-xl group-hover:bg-[#18235C] group-hover:text-white transition-colors duration-200 border border-[#18235C]/15">
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm sm:text-base font-extrabold text-[#18235C] tracking-tight">
                        {category.name}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {category.modules.length} módulo{category.modules.length !== 1 ? 's' : ''} disponible{category.modules.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 hidden sm:inline">
                      {isExpanded ? 'Ocultar' : 'Ver'}
                    </span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[#18235C] group-hover:bg-[#18235C]/10 transition-colors">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </button>

                {/* Grid de módulos */}
                {isExpanded && (
                  <div className="px-5 py-5 bg-[#F8FAFC] border-t border-[#8FA7D6]/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.modules.map((modulo) => (
                      <ModulosPortalCard
                        key={modulo.id}
                        modulo={modulo}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer informativo armonizado */}
        <div className="p-5 bg-white rounded-2xl border border-[#8FA7D6]/30 shadow-xs flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#18235C]/10 flex items-center justify-center text-[#18235C] shrink-0 border border-[#18235C]/15">
            <Lock className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-xs text-[#18235C] uppercase tracking-wide">
              Control de Accesos & Seguridad Basada en Roles (RBAC)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Los módulos visualizados se encuentran configurados estrictamente conforme al perfil laboral de tu cuenta institucional. Si requieres acceso a un módulo adicional para tu operación diaria, comunícate con la Dirección de Gestión Humana.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
