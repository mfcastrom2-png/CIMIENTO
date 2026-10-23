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
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bgroup_pwa_floating_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bgroup_pwa_floating_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('bgroup_pwa_floating_dismissed', 'true');
    } catch {
      // Ignore localStorage restrictions
    }
  };

  const handleToggleMinimize = (minimizedState: boolean) => {
    setIsMinimized(minimizedState);
    try {
      localStorage.setItem('bgroup_pwa_floating_minimized', String(minimizedState));
    } catch {
      // Ignore localStorage restrictions
    }
  };

  // Si la aplicación ya está instalada o el usuario eliminó el aviso, no mostramos el banner
  if (isInstalled || (variant === 'floating' && dismissed)) {
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

  // Render como Banner flotante inferior con opción de minimizar o eliminar
  if (variant === 'floating') {
    return (
      <>
        {isMinimized ? (
          // Versión MINIMIZADA: botón compacto tipo píldora en la esquina que no obstruye la lectura
          <aside
            aria-label="Instalación de aplicación móvil PWA minimizada"
            className={`fixed bottom-3 right-3 sm:bottom-4 sm:right-6 z-40 flex items-center gap-1.5 bg-[#18235C]/95 hover:bg-[#18235C] text-white px-2.5 py-1.5 rounded-full shadow-xl border border-indigo-300/30 backdrop-blur-md transition-all duration-200 select-none ${className}`}
          >
            <button
              type="button"
              onClick={handleAction}
              className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#F59E0B] transition-colors cursor-pointer py-0.5 px-1"
              title="Instalar B Group GH en este dispositivo"
            >
              <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-[#18235C] flex items-center justify-center shrink-0">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold">Instalar App</span>
            </button>

            <div className="h-4 w-px bg-white/20 mx-0.5" />

            {/* Botón Maximizar */}
            <button
              type="button"
              onClick={() => handleToggleMinimize(false)}
              className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Expandir aviso de instalación"
              aria-label="Expandir aviso de instalación"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>

            {/* Botón Eliminar / Cerrar */}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-red-300 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Eliminar aviso (no volver a mostrar)"
              aria-label="Eliminar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </aside>
        ) : (
          // Versión EXPANDIDA: banner con información completa y controles de minimizar y eliminar
          <aside
            aria-label="Aviso de instalación de aplicación móvil B Group GH"
            className={`fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 bg-[#18235C] text-white p-3.5 rounded-2xl shadow-2xl border border-indigo-400/40 backdrop-blur-md flex flex-col gap-2.5 animate-fadeIn ${className}`}
          >
            {/* Barra superior con título y controles de minimizar / eliminar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B] text-[#18235C] flex items-center justify-center shrink-0 font-black shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span>Instalar B Group GH</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-400/30 font-semibold shrink-0">PWA</span>
                  </h4>
                </div>
              </div>

              {/* Botones de acción de la ventana: Minimizar y Eliminar */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleMinimize(true)}
                  className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                  title="Minimizar aviso para no obstruir datos"
                  aria-label="Minimizar aviso"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 text-slate-400 hover:text-red-300 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                  title="Eliminar aviso (no volver a mostrar)"
                  aria-label="Eliminar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Texto descriptivo */}
            <p className="text-[11px] text-slate-300 leading-snug">
              Accede directamente desde tu pantalla de inicio o escritorio, rápido y sin la barra del navegador.
            </p>

            {/* Botones de acción inferiores */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleToggleMinimize(true)}
                className="text-[11px] text-slate-300 hover:text-white font-medium px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
                title="Minimizar a píldora en la esquina"
              >
                <span>Minimizar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[11px] text-slate-300 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                  title="Eliminar aviso"
                >
                  <span>Eliminar</span>
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#18235C] text-xs font-black rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar ahora</span>
                </button>
              </div>
            </div>
          </aside>
        )}

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
