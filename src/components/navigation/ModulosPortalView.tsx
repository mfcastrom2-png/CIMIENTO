import React, { useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import { ModulosPortalCard } from './ModulosPortalCard';
import { getVisiblePortalModules } from './portalModules';

interface ModulosPortalViewProps {
  onNavigate: (view: string) => void;
  userRole?: string;
}

export const ModulosPortalView: React.FC<ModulosPortalViewProps> = ({
  onNavigate,
  userRole = 'admin'
}) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Portal de Módulos · Cimiento';

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const { gestionHumana, sst } = getVisiblePortalModules(userRole);

  return (
    <div className="bg-[#F8FAFC] p-8 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="border-b border-[#8FA7D6]/30 pb-4">
          <h1 className="text-3xl font-bold text-[#18235C] flex items-center gap-3">
            <svg className="w-8 h-8 text-[#00FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Portal de Módulos
          </h1>
          <p className="text-sm text-slate-600 mt-1">Navegación centralizada de B GROUP INGENIERIA S.A.S.</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
            <div className="p-2 bg-[#18235C]/10 rounded-lg text-[#18235C]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#18235C]">Gestión Humana y Organización</h2>
              <p className="text-xs text-slate-500">Administración del talento humano y estructura.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gestionHumana.map((modulo) => (
              <ModulosPortalCard key={modulo.id} modulo={modulo} onNavigate={onNavigate} />
            ))}
          </div>
        </section>

        {sst.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
              <div className="p-2 bg-[#18235C]/10 rounded-lg text-[#18235C]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#18235C]">Seguridad y Salud en el Trabajo</h2>
                <p className="text-xs text-slate-500">Gestión integral del SG-SST.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sst.map((modulo) => (
                <ModulosPortalCard key={modulo.id} modulo={modulo} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
