import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Si la aplicación ya está instalada y operando como PWA nativa, no mostramos el botón
  if (isInstalled || dismissed) {
    return null;
  }

  // Si no es instalable por prompt y tampoco es iOS, podemos ofrecer un botón explicativo o modal
  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Para navegadores de escritorio que no disparan beforeinstallprompt de inmediato
      setShowIOSGuide(true);
    }
  };

  // Render en Header
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleAction}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
            isInstallable
              ? 'bg-[#F59E0B] hover:bg-[#D97706] text-[#18235C]'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          } ${className}`}
          title="Instalar versión App móvil o escritorio en este dispositivo"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Instalar App</span>
          <span className="sm:hidden">App</span>
          <Download className="w-3 h-3 opacity-80" />
        </button>

        {showIOSGuide && (
          <GuiaInstalacionModal
            isIOS={isIOS}
            onClose={() => setShowIOSGuide(false)}
          />
        )}
      </>
    );
  }

  // Render como Banner flotante inferior (ideal para móvil)
  if (variant === 'floating') {
    return (
      <>
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-[#18235C] text-white p-3.5 rounded-2xl shadow-2xl border border-indigo-400/30 flex items-center justify-between gap-3 animate-fadeIn ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-[#18235C] flex items-center justify-center shrink-0 font-black shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Instalar B Group GH</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/30 font-semibold">PWA</span>
              </h4>
              <p className="text-[11px] text-slate-300 truncate">
                Acceso directo rápido y sin barra de navegador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAction}
              className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#18235C] text-xs font-black rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Cerrar sugerencia"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <GuiaInstalacionModal
            isIOS={isIOS}
            onClose={() => setShowIOSGuide(false)}
          />
        )}
      </>
    );
  }

  return null;
};

interface GuiaInstalacionModalProps {
  isIOS: boolean;
  onClose: () => void;
}

const GuiaInstalacionModal: React.FC<GuiaInstalacionModalProps> = ({ isIOS, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#18235C] flex items-center justify-center text-[#F59E0B]">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#18235C]">
              Instalar App B Group
            </h3>
            <p className="text-xs text-slate-500">
              {isIOS ? 'En tu iPhone / iPad (Safari)' : 'En tu dispositivo móvil o PC'}
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3.5 my-4 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                Toca el botón <strong className="text-[#18235C]">Compartir</strong> <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> en la barra inferior de Safari.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                Desliza hacia abajo y selecciona <strong className="text-[#18235C]">"Agregar a pantalla de inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                Pulsa <strong className="text-emerald-700">Agregar</strong> en la esquina superior derecha. ¡Listo! La app aparecerá en tu menú de aplicaciones.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 my-4 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                En el menú de opciones de tu navegador (los tres puntos <strong className="text-slate-900">⋮</strong>), busca la opción <strong className="text-[#18235C]">"Instalar aplicación"</strong> o <strong className="text-[#18235C]">"Agregar a la pantalla principal"</strong>.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                Confirma la instalación. La aplicación se integrará a tus aplicaciones del sistema con su icono corporativo.
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
