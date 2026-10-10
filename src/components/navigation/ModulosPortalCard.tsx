import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PortalModule {
  id: string;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  enlace: string;
  color: 'primary' | 'secondary' | 'accent';
}

export interface PortalCardProps {
  modulo: PortalModule;
  onNavigate: (view: string) => void;
}

export const ModulosPortalCard: React.FC<PortalCardProps> = ({ modulo, onNavigate }) => {
  const Icon = modulo.icono;

  const colorClasses = {
    primary: 'text-[#8FA7D6]',
    secondary: 'text-[#00FF00]',
    accent: 'text-[#F59E0B]'
  };

  return (
    <button
      type="button"
      aria-label={`Abrir módulo ${modulo.titulo}`}
      onClick={() => onNavigate(modulo.enlace)}
      className="hover-card relative bg-white p-5 rounded-xl border border-[#8FA7D6]/40 transition-all text-left flex flex-col h-32 overflow-hidden cursor-pointer group"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-[#8FA7D6]/10 rounded-bl-full z-0 group-hover:to-[#18235C]/5 transition-colors" />

      <div className="flex items-start justify-between z-10 mb-3">
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-[#F8FAFC]">
          <Icon className={`w-6 h-6 ${colorClasses[modulo.color]}`} />
        </div>

        <svg
          className="chevron w-5 h-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-[#00FF00]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="z-10">
        <h3 className="font-bold text-sm text-[#18235C] mb-1 group-hover:text-[#101740] transition-colors">
          {modulo.titulo}
        </h3>
        <p className="text-xs text-slate-500">{modulo.descripcion}</p>
      </div>
    </button>
  );
};
