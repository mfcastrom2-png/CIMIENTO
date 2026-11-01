import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

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

const colorConfig = {
  primary: {
    hoverBg: 'group-hover:to-[#18235C]/8',
    icon: 'text-[#18235C]',
    border: 'border-[#8FA7D6]/35 group-hover:border-[#18235C]/60',
    iconBox: 'bg-[#18235C]/10 text-[#18235C] group-hover:bg-[#18235C] group-hover:text-white',
    badge: 'bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20',
    accentLine: 'via-[#18235C]'
  },
  secondary: {
    hoverBg: 'group-hover:to-[#1E3A8A]/8',
    icon: 'text-[#1E3A8A]',
    border: 'border-[#8FA7D6]/35 group-hover:border-[#1E3A8A]/60',
    iconBox: 'bg-[#1E3A8A]/10 text-[#1E3A8A] group-hover:bg-[#1E3A8A] group-hover:text-white',
    badge: 'bg-sky-50 text-sky-800 border border-sky-200',
    accentLine: 'via-[#1E3A8A]'
  },
  accent: {
    hoverBg: 'group-hover:to-[#F59E0B]/10',
    icon: 'text-[#D97706]',
    border: 'border-[#F59E0B]/30 group-hover:border-[#F59E0B]/60',
    iconBox: 'bg-[#F59E0B]/10 text-[#D97706] group-hover:bg-[#F59E0B] group-hover:text-white',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200',
    accentLine: 'via-[#F59E0B]'
  },
  success: {
    hoverBg: 'group-hover:to-emerald-500/10',
    icon: 'text-emerald-700',
    border: 'border-emerald-200 group-hover:border-emerald-500/60',
    iconBox: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
    badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    accentLine: 'via-emerald-600'
  },
  warning: {
    hoverBg: 'group-hover:to-amber-500/10',
    icon: 'text-amber-700',
    border: 'border-amber-200 group-hover:border-amber-500/60',
    iconBox: 'bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200',
    accentLine: 'via-amber-600'
  },
  danger: {
    hoverBg: 'group-hover:to-rose-500/10',
    icon: 'text-rose-700',
    border: 'border-rose-200 group-hover:border-rose-500/60',
    iconBox: 'bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white',
    badge: 'bg-rose-50 text-rose-800 border border-rose-200',
    accentLine: 'via-rose-600'
  }
};

export const ModulosPortalCard: React.FC<PortalCardProps> = ({ modulo, onNavigate }) => {
  const Icon = modulo.icono;
  const config = colorConfig[modulo.color] || colorConfig.primary;

  return (
    <button
      type="button"
      aria-label={`Abrir módulo ${modulo.titulo}`}
      onClick={() => onNavigate(modulo.enlace)}
      className={`relative bg-white rounded-2xl border ${config.border} transition-all duration-300 text-left flex flex-col h-40 overflow-hidden cursor-pointer group shadow-xs hover:shadow-md hover:-translate-y-1`}
    >
      {/* Fondo degradado suave decorativo */}
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent ${config.hoverBg} rounded-bl-full z-0 group-hover:scale-125 transition-transform duration-500 pointer-events-none`}
      />

      <div className="flex items-start justify-between z-10 p-4 pb-2">
        {/* Contenedor del Icono */}
        <div
          className={`p-2.5 rounded-xl border border-black/5 shadow-2xs transition-all duration-300 ${config.iconBox}`}
        >
          <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" />
        </div>

        {/* Accesorios superiores: Badge y flecha */}
        <div className="flex items-center gap-1.5">
          {modulo.badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap shadow-2xs ${config.badge}`}
            >
              {modulo.badge}
            </span>
          )}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-[#18235C] group-hover:bg-[#18235C]/5 transition-all duration-200">
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Título y Descripción con tipografía consistente */}
      <div className="z-10 px-4 pb-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-[#18235C] mb-1 group-hover:text-[#101740] transition-colors duration-200 line-clamp-1 tracking-tight">
            {modulo.titulo}
          </h3>
          <p className="text-xs text-[#282829] opacity-80 line-clamp-2 leading-relaxed">
            {modulo.descripcion}
          </p>
        </div>
      </div>

      {/* Línea animada inferior con color corporativo */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${config.accentLine} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </button>
  );
};
