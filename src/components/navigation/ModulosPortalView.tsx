import React, { useEffect, useState } from 'react';
import { Users, Shield, Receipt, FileText, Settings, GraduationCap, ClipboardList, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { ModulosPortalCard } from './ModulosPortalCard';
import { getVisiblePortalModules } from './portalModules';
import { RolSistema, UsuarioSistema } from '../../types';

interface ModulosPortalViewProps {
  onNavigate: (view: string) => void;
  userRole?: RolSistema;
  currentUser?: UsuarioSistema | null;
}

interface SectionConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  modulesKey: keyof ReturnType<typeof getVisiblePortalModules>;
  color: 'blue' | 'red' | 'green' | 'purple' | 'orange';
}

const sections: SectionConfig[] = [
  {
    icon: Users,
    title: 'Gestión Humana y Organización',
    subtitle: 'Administración del talento humano y estructura.',
    modulesKey: 'gestionHumana',
    color: 'blue'
  },
  {
    icon: Shield,
    title: 'Seguridad y Salud en el Trabajo',
    subtitle: 'Gestión integral del SG-SST.',
    modulesKey: 'sst',
    color: 'red'
  },
  {
    icon: Receipt,
    title: 'Finanzas & Compensación',
    subtitle: 'Nómina, prestaciones y control de pagos.',
    modulesKey: 'finanzas',
    color: 'green'
  },
  {
    icon: FileText,
    title: 'Documentos & Gobernanza',
    subtitle: 'Repositorio institucional y verificación de documentos.',
    modulesKey: 'documentos',
    color: 'orange'
  },
  {
    icon: GraduationCap,
    title: 'Capacitación & Desarrollo',
    subtitle: 'Programa de formación y mejora continua.',
    modulesKey: 'capacitacion',
    color: 'purple'
  },
  {
    icon: ClipboardList,
    title: 'Solicitudes & Trámites',
    subtitle: 'Permisos, licencias y certificados laborales.',
    modulesKey: 'solicitudes',
    color: 'blue'
  },
  {
    icon: Settings,
    title: 'Administración del Sistema',
    subtitle: 'Control de acceso, configuración y auditoría.',
    modulesKey: 'administracion',
    color: 'orange'
  }
];

const colorConfigs = {
  blue: {
    bg: 'bg-[#18235C]/10',
    icon: 'text-[#18235C]',
    border: 'border-[#8FA7D6]/30',
    accent: 'bg-[#8FA7D6]/20'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    accent: 'bg-red-100'
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
    accent: 'bg-emerald-100'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    accent: 'bg-purple-100'
  },
  orange: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    border: 'border-amber-200',
    accent: 'bg-amber-100'
  }
};

export const ModulosPortalView: React.FC<ModulosPortalViewProps> = ({
  onNavigate,
  userRole = 'empleado',
  currentUser
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Portal de Módulos · Cimiento';
    setIsLoading(false);

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const rol = currentUser?.rol || userRole;
  const permisos = currentUser?.permisos || [];
  const modulosPorRol = getVisiblePortalModules(rol, permisos);

  const toggleSection = (sectionKey: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionKey)) {
      newSet.delete(sectionKey);
    } else {
      newSet.add(sectionKey);
    }
    setExpandedSections(newSet);
  };

  const animationVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2
        }
      }
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: 'easeOut'
        }
      }
    },
    section: {
      hidden: { opacity: 0, height: 0 },
      visible: {
        opacity: 1,
        height: 'auto',
        transition: {
          duration: 0.4,
          ease: 'easeOut'
        }
      },
      exit: {
        opacity: 0,
        height: 0,
        transition: {
          duration: 0.3,
          ease: 'easeIn'
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F8FAFC] p-8 min-h-screen font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8FA7D6]/20 border-t-[#8FA7D6] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando Portal de Módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#F8FAFC] to-white p-8 min-h-screen font-sans">
      <motion.div className="max-w-7xl mx-auto space-y-8" variants={animationVariants.container} initial="hidden" animate="visible">
        {/* Encabezado */}
        <motion.div className="border-b border-[#8FA7D6]/30 pb-6" variants={animationVariants.item}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-[#00FF00]/20 to-[#8FA7D6]/20 rounded-xl">
                  <svg className="w-8 h-8 text-[#00FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-[#18235C]">Portal de Módulos</h1>
                  <p className="text-sm text-slate-600 mt-1">Acceso centralizado a todas las funcionalidades del sistema</p>
                </div>
              </div>
            </div>
            {currentUser && (
              <div className="text-right">
                <p className="text-sm font-semibold text-[#18235C]">{currentUser.nombre}</p>
                <p className="text-xs text-slate-600 text-[#8FA7D6]">{rol.replace(/_/g, ' ')}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Secciones de módulos */}
        <motion.div className="space-y-6" variants={animationVariants.container}>
          {sections.map((section, index) => {
            const modulosEnSeccion = modulosPorRol[section.modulesKey];
            if (modulosEnSeccion.length === 0) return null;

            const SectionIcon = section.icon;
            const colorConfig = colorConfigs[section.color];
            const isExpanded = expandedSections.has(section.modulesKey);

            return (
              <motion.div key={section.modulesKey} variants={animationVariants.item} className="space-y-4">
                {/* Encabezado de sección */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.modulesKey)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${colorConfig.border} ${colorConfig.bg} hover:shadow-md transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 ${colorConfig.accent} rounded-lg transition-colors duration-300`}>
                      <SectionIcon className={`w-6 h-6 ${colorConfig.icon}`} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-[#18235C] group-hover:text-[#101740] transition-colors">{section.title}</h2>
                      <p className="text-xs text-slate-600">{section.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1 bg-white/50 rounded-full text-[#18235C]">{modulosEnSeccion.length}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </div>
                </button>

                {/* Grid de módulos con animación */}
                {isExpanded && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={animationVariants.section}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden"
                  >
                    {modulosEnSeccion.map((modulo) => (
                      <motion.div key={modulo.id} variants={animationVariants.item}>
                        <ModulosPortalCard modulo={modulo} onNavigate={onNavigate} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Mensaje vacío */}
        {Object.values(modulosPorRol).every((arr) => arr.length === 0) && (
          <motion.div variants={animationVariants.item} className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sin módulos disponibles</h3>
            <p className="text-sm text-slate-600 mt-1">Tu rol no tiene acceso a ningún módulo en este momento.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
