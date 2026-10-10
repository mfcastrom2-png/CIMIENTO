import React, { useEffect, useState } from 'react';
import { Users, Shield, Receipt, FileText, Settings, GraduationCap, ClipboardList, ChevronDown } from 'lucide-react';
import { ModulosPortalCard } from './ModulosPortalCard';
import { getVisiblePortalModules } from './portalModules';
import { RolSistema, UsuarioSistema } from '../../types';

interface ModulosPortalViewProps {
  userRole: RolSistema;
  onNavigate: (view: string) => void;
}

export function ModulosPortalView({
  userRole,
  onNavigate
}: ModulosPortalViewProps) {
  const modulos = getVisiblePortalModules(userRole);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('gestion-humana');

  useEffect(() => {
    // Scroll automático hacia el portal de módulos
    const container = document.getElementById('modulos-portal-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const categories = [
    {
      id: 'gestion-humana',
      name: 'Gestión Humana',
      icon: Users,
      modules: modulos.filter(m => m.categoria === 'gestion-humana')
    },
    {
      id: 'seguridad-sst',
      name: 'Seguridad y Salud en el Trabajo',
      icon: Shield,
      modules: modulos.filter(m => m.categoria === 'seguridad-sst')
    },
    {
      id: 'nomina-prestaciones',
      name: 'Nómina y Prestaciones',
      icon: Receipt,
      modules: modulos.filter(m => m.categoria === 'nomina-prestaciones')
    },
    {
      id: 'documentacion',
      name: 'Documentación',
      icon: FileText,
      modules: modulos.filter(m => m.categoria === 'documentacion')
    },
    {
      id: 'formacion',
      name: 'Formación y Desarrollo',
      icon: GraduationCap,
      modules: modulos.filter(m => m.categoria === 'formacion')
    },
    {
      id: 'administracion',
      name: 'Administración y Control',
      icon: Settings,
      modules: modulos.filter(m => m.categoria === 'administracion')
    }
  ];

  return (
    <div id="modulos-portal-container" className="w-full min-h-screen bg-gradient-to-br from-[#F3F7FF] via-white to-[#F0F9FF] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-[#18235C] mb-3 tracking-tight">
            Portal de Módulos del Sistema
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Accede directamente a los módulos disponibles para tu rol y explora todas las funcionalidades del sistema CIMIENTO.
          </p>
        </div>

        {/* Categorías de módulos */}
        <div className="space-y-6">
          {categories.map((category) => {
            const CategoryIcon = category.icon;
            const hasModules = category.modules.length > 0;
            const isExpanded = expandedCategory === category.id;

            if (!hasModules) return null;

            return (
              <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-[#8FA7D6]/20 overflow-hidden transition-all hover:shadow-md">
                {/* Encabezado de categoría */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#F3F7FF] transition-colors group"
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
