import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PortalModule {
  id: string;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  enlace: string;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  requierePermiso?: string;
  badge?: string;
}

export interface PortalCardProps {
  modulo: PortalModule;
  onNavigate: (view: string) => void;
}

const colorClasses = {
  primary: {
    bg: 'group-hover:to-[#8FA7D6]/20',
    icon: 'text-[#8FA7D6]',
    border: 'border-[#8FA7D6]/40 group-hover:border-[#8FA7D6]/70'
  },
  secondary: {
    bg: 'group-hover:to-[#00FF00]/20',
    icon: 'text-[#00FF00]',
    border: 'border-[#00FF00]/40 group-hover:border-[#00FF00]/70'
  },
  accent: {
    bg: 'group-hover:to-[#F59E0B]/20',
    icon: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/40 group-hover:border-[#F59E0B]/70'
  },
  success: {
    bg: 'group-hover:to-emerald-500/20',
    icon: 'text-emerald-500',
    border: 'border-emerald-500/40 group-hover:border-emerald-500/70'
  },
  warning: {
    bg: 'group-hover:to-amber-500/20',
    icon: 'text-amber-500',
    border: 'border-amber-500/40 group-hover:border-amber-500/70'
  },
  danger: {
    bg: 'group-hover:to-rose-500/20',
    icon: 'text-rose-500',
    border: 'border-rose-500/40 group-hover:border-rose-500/70'
  }
};

const badgeColors = {
  primary: 'bg-[#8FA7D6]/20 text-[#8FA7D6]',
  secondary: 'bg-[#00FF00]/20 text-[#00FF00]',
  accent: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  success: 'bg-emerald-500/20 text-emerald-600',
  warning: 'bg-amber-500/20 text-amber-600',
  danger: 'bg-rose-500/20 text-rose-600'
};

export const ModulosPortalCard: React.FC<PortalCardProps> = ({ modulo, onNavigate }) => {
  const Icon = modulo.icono;
  const colors = colorClasses[modulo.color];
  const badgeColor = badgeColors[modulo.color];

  return (
    <button
      type="button"
      aria-label={`Abrir módulo ${modulo.titulo}`}
      onClick={() => onNavigate(modulo.enlace)}
      className={`relative bg-white rounded-xl border ${colors.border} transition-all duration-300 text-left flex flex-col h-36 overflow-hidden cursor-pointer group hover:shadow-lg hover:-translate-y-1`}
    >
      {/* Fondo degradado animado */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-transparent ${colors.bg} rounded-bl-full z-0 group-hover:scale-125 transition-transform duration-500`} />

      <div className="flex items-start justify-between z-10 mb-3 p-5 pb-0">
        {/* Icono con contenedor */}
        <div className={`p-3 bg-white/50 rounded-lg border ${colors.border} group-hover:bg-gradient-to-br group-hover:from-white/70 group-hover:to-white/30 transition-all duration-300 shadow-sm`}>
          <Icon className={`w-6 h-6 ${colors.icon} transition-all duration-300`} />
        </div>

        {/* Flecha animada */}
        <div className="flex flex-col items-center gap-1">
          <svg
            className="chevron w-5 h-5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#00FF00]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {modulo.badge && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${badgeColor} whitespace-nowrap`}>
              {modulo.badge}
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="z-10 px-5 pb-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-[#18235C] mb-1 group-hover:text-[#101740] transition-colors duration-300 line-clamp-2">
            {modulo.titulo}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2">{modulo.descripcion}</p>
        </div>
      </div>

      {/* Borde animado inferior (efecto de línea de carga) */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-[#00FF00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};
