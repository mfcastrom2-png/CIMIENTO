import React, { useEffect, useState, useMemo } from 'react';
import { Users, Shield, Receipt, FileText, Settings, GraduationCap, ClipboardList, ChevronDown, ChevronRight, Search } from 'lucide-react';
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['gestion-humana', 'solicitudes-servicios']);
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
      name: 'Gestión Humana',
      icon: Users,
      modules: Array.isArray(modulos?.gestionHumana) ? modulos.gestionHumana : []
    },
    {
      id: 'seguridad-sst',
      name: 'Seguridad y Salud en el Trabajo',
      icon: Shield,
      modules: Array.isArray(modulos?.sst) ? modulos.sst : []
    },
    {
      id: 'nomina-prestaciones',
      name: 'Nómina y Prestaciones',
      icon: Receipt,
      modules: Array.isArray(modulos?.finanzas) ? modulos.finanzas : []
    },
    {
      id: 'documentacion',
      name: 'Documentación',
      icon: FileText,
      modules: Array.isArray(modulos?.documentos) ? modulos.documentos : []
    },
    {
      id: 'formacion',
      name: 'Formación y Desarrollo',
      icon: GraduationCap,
      modules: Array.isArray(modulos?.capacitacion) ? modulos.capacitacion : []
    },
    {
      id: 'administracion',
      name: 'Administración y Control',
      icon: Settings,
      modules: Array.isArray(modulos?.administracion) ? modulos.administracion : []
    },
    {
      id: 'solicitudes-servicios',
      name: 'Solicitudes y Peticiones',
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

  return (
    <div id="modulos-portal-container" className="w-full min-h-screen bg-gradient-to-br from-[#F3F7FF] via-white to-[#F0F9FF] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-[#18235C] mb-3 tracking-tight">
            Portal de Módulos del Sistema
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Accede directamente a los módulos disponibles para tu rol y explora todas las funcionalidades del sistema CIMIENTO.
          </p>
        </div>

        {/* Banner de Verificación Cruzada y Acceso Rápido a Solicitudes */}
        <div className="mb-6 p-4.5 rounded-2xl bg-white border border-[#8FA7D6]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#18235C]/10 border border-[#18235C]/20 rounded-xl text-[#18235C] shrink-0">
              <ClipboardList className="w-6 h-6 text-[#18235C]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#18235C]">Módulo de Solicitudes & Trámites CST</span>
                {pendingRequestsCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00FF00] text-[#18235C] shadow-2xs animate-pulse">
                    {pendingRequestsCount} por aprobar
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Al día
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acceso directo desde el menú lateral y desde el portal con filtros persistentes por estado (Pendiente / Aprobado).
              </p>
            </div>
          </div>
          <button
            type="button"
            id="portal-btn-ir-solicitudes"
            onClick={() => onNavigate('solicitudes')}
            className="px-4 py-2.5 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <span>Ir a Solicitudes</span>
            <ChevronRight className="w-4 h-4 text-[#00FF00]" />
          </button>
        </div>

        {/* Buscador de Módulos */}
        <div className="mb-6 relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar cualquier módulo o servicio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#8FA7D6]/50 rounded-xl text-xs font-medium shadow-2xs focus:ring-2 focus:ring-[#18235C]/20"
          />
        </div>

        {/* Categorías de módulos */}
        <div className="space-y-6">
          {filteredCategories.map((category) => {
            const CategoryIcon = category.icon;
            const hasModules = category.modules.length > 0;
            const isExpanded = searchTerm.trim().length > 0 || expandedCategories.includes(category.id);

            if (!hasModules) return null;

            return (
              <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-[#8FA7D6]/20 overflow-hidden transition-all hover:shadow-md">
                {/* Encabezado de categoría */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#F3F7FF] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#18235C]/10 rounded-lg group-hover:bg-[#18235C]/20 transition-colors">
                      <CategoryIcon className="w-5 h-5 text-[#18235C]" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-[#18235C]">{category.name}</h2>
                      <p className="text-xs text-slate-500">{category.modules.length} módulo{category.modules.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8FA7D6] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Contenido de módulos */}
                {isExpanded && (
                  <div className="px-6 py-6 bg-[#F9FBFF] border-t border-[#8FA7D6]/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Footer informativo */}
        <div className="mt-12 p-6 bg-[#18235C]/5 rounded-xl border border-[#18235C]/10">
          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-[#18235C] mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-[#18235C] mb-1">Acceso Basado en Roles (RBAC)</h3>
              <p className="text-xs text-slate-600">
                Los módulos mostrados están filtrados según tu perfil de usuario. Si necesitas acceder a módulos adicionales, solicita permisos a tu administrador.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
