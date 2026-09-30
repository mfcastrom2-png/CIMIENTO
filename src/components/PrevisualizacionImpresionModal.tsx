import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileDown,
  X,
  CheckSquare,
  Square,
  Eye,
  Sliders,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { imprimirDocumentoConSecciones, exportarAPdfConSecciones } from '../utils/printUtils';

export interface SeccionImprimible {
  id: string;
  nombre: string;
  descripcion?: string;
  requerido?: boolean;
  seleccionado: boolean;
}

export interface PrevisualizacionImpresionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tituloDocumento: string;
  subtitulo?: string;
  nombreArchivo?: string;
  elementoContenedorId: string;
  seccionesDisponibles: SeccionImprimible[];
  onImprimirEjecutado?: () => void;
}

export const PrevisualizacionImpresionModal: React.FC<PrevisualizacionImpresionModalProps> = ({
  isOpen,
  onClose,
  tituloDocumento,
  subtitulo,
  nombreArchivo = 'documento.pdf',
  elementoContenedorId,
  seccionesDisponibles,
  onImprimirEjecutado
}) => {
  const [secciones, setSecciones] = useState<SeccionImprimible[]>(seccionesDisponibles);
  const [orientacion, setOrientacion] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState<number>(100);
  const [exportando, setExportando] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Sincronizar secciones cuando cambie el documento
  useEffect(() => {
    setSecciones(seccionesDisponibles);
  }, [seccionesDisponibles]);

  // Capturar el HTML del contenedor original al abrir el modal para la previsualización interactiva
  useEffect(() => {
    if (!isOpen) return;

    const targetEl = document.getElementById(elementoContenedorId) || document.querySelector(`.${elementoContenedorId}`);
    if (targetEl) {
      setPreviewHtml(targetEl.innerHTML);
    }
  }, [isOpen, elementoContenedorId]);

  if (!isOpen) return null;

  const seccionesSeleccionadasIds = secciones.filter(s => s.seleccionado).map(s => s.id);
  const totalSecciones = secciones.length;
  const activasCount = seccionesSeleccionadasIds.length;

  const toggleSeccion = (id: string) => {
    setSecciones(prev =>
      prev.map(s => {
        if (s.id === id) {
          if (s.requerido) return s; // Las requeridas no se pueden deseleccionar
          return { ...s, seleccionado: !s.seleccionado };
        }
        return s;
      })
    );
  };

  const handleSeleccionarTodas = () => {
    setSecciones(prev => prev.map(s => ({ ...s, seleccionado: true })));
  };

  const handleSeleccionarSoloRequeridas = () => {
    setSecciones(prev =>
      prev.map(s => ({ ...s, seleccionado: s.requerido || false }))
    );
  };

  const handleImprimir = () => {
    imprimirDocumentoConSecciones(
      tituloDocumento,
      elementoContenedorId,
      seccionesSeleccionadasIds
    );
    if (onImprimirEjecutado) onImprimirEjecutado();
    onClose();
  };

  const handleExportarPdf = async () => {
    setExportando(true);
    try {
      await exportarAPdfConSecciones(
        `#${elementoContenedorId}`,
        nombreArchivo,
        seccionesSeleccionadasIds
      );
    } finally {
      setExportando(false);
    }
  };

  return (
    <div
      id="modal-previsualizacion-impresion"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:hidden overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-preview-title"
    >
      <div className="bg-slate-100 rounded-2xl border border-[#8FA7D6]/50 shadow-2xl max-w-6xl w-full h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#18235C] text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/30 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-preview-title" className="text-base font-bold tracking-tight">
                Previsualización y Configuración de Impresión
              </h2>
              <p className="text-xs text-slate-300">
                {tituloDocumento} {subtitulo ? `· ${subtitulo}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal de previsualización"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Left Control Panel & Right Live Preview Sheet */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* Panel Izquierdo: Configuración de Secciones y Ajustes (4 Columnas) */}
          <div className="lg:col-span-4 bg-white border-r border-[#8FA7D6]/30 flex flex-col h-full overflow-hidden">
            {/* Header del panel */}
            <div className="p-4 border-b border-[#8FA7D6]/20 bg-slate-50/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#18235C] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Secciones a Incluir
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#18235C]/10 text-[#18235C]">
                  {activasCount} de {totalSecciones} seleccionadas
                </span>
              </div>
              <p className="text-[11px] text-[#282829]/70">
                Marque o desmarque las secciones que desea incluir en la impresión o exportación final.
              </p>
            </div>

            {/* Lista interactiva de secciones con scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {secciones.map(sec => {
                const isSelected = sec.seleccionado;
                return (
                  <div
                    key={sec.id}
                    onClick={() => toggleSeccion(sec.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-50/40 border-[#18235C]/40 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200 text-slate-400 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={sec.requerido}
                      className={`mt-0.5 shrink-0 ${sec.requerido ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#18235C]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#18235C]' : 'text-slate-500'}`}>
                          {sec.nombre}
                        </span>
                        {sec.requerido && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                            Requerido
                          </span>
                        )}
                      </div>
                      {sec.descripcion && (
                        <p className="text-[10px] text-[#282829]/70 mt-0.5 leading-tight">
                          {sec.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Accesos rápidos de selección */}
            <div className="px-4 py-2 border-t border-[#8FA7D6]/20 bg-slate-50 flex items-center justify-between text-[11px]">
              <button
                onClick={handleSeleccionarTodas}
                className="text-[#18235C] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Seleccionar Todas
              </button>
              <button
                onClick={handleSeleccionarSoloRequeridas}
                className="text-slate-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Solo Requeridas
              </button>
            </div>

            {/* Controles de página y orientación */}
            <div className="p-4 border-t border-[#8FA7D6]/30 bg-slate-50 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#18235C] mb-1">
                    Orientación
                  </label>
                  <select
                    value={orientacion}
                    onChange={e => setOrientacion(e.target.value as any)}
                    className="w-full p-1.5 text-xs bg-white border border-[#8FA7D6]/40 rounded-lg text-[#282829]"
                  >
                    <option value="portrait">Vertical (Carta)</option>
                    <option value="landscape">Horizontal (Apaisado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#18235C] mb-1">
                    Zoom Vista Previa
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setZoom(z => Math.max(50, z - 15))}
                      className="p-1.5 bg-white border border-[#8FA7D6]/40 rounded-lg hover:bg-slate-100 text-xs text-[#282829]"
                      title="Reducir zoom"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-1 text-center font-mono text-xs font-semibold text-[#18235C]">
                      {zoom}%
                    </span>
                    <button
                      onClick={() => setZoom(z => Math.min(150, z + 15))}
                      className="p-1.5 bg-white border border-[#8FA7D6]/40 rounded-lg hover:bg-slate-100 text-xs text-[#282829]"
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones de acción principales */}
              <div className="space-y-2 pt-2 border-t border-[#8FA7D6]/20">
                <button
                  id="btn-confirmar-impresion"
                  onClick={handleImprimir}
                  disabled={activasCount === 0}
                  className="w-full py-2.5 px-4 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-[#00FF00]" />
                  <span>Enviar a Diálogo de Impresión</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportarPdf}
                    disabled={exportando || activasCount === 0}
                    className="py-2 px-3 bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{exportando ? 'Generando...' : 'Descargar PDF'}</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="py-2 px-3 border border-[#8FA7D6]/40 bg-white hover:bg-slate-100 text-[#282829] text-xs font-semibold rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Vista Previa en Vivo de la Hoja de Impresión (8 Columnas) */}
          <div className="lg:col-span-8 bg-slate-200/90 p-4 sm:p-8 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-3 px-2">
              <span className="flex items-center gap-1.5 font-semibold text-[#18235C]">
                <Eye className="w-4 h-4 text-[#18235C]" />
                Hoja de Impresión Final (Simulación Formato Carta)
              </span>
              <span className="text-[11px] text-slate-500">
                Las secciones desmarcadas se ocultan automáticamente del flujo
              </span>
            </div>

            {/* Lienzo con scroll y escalado de zoom */}
            <div className="flex-1 overflow-auto rounded-xl p-2 flex justify-center items-start">
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out'
                }}
                className={`bg-white rounded-lg shadow-xl border border-slate-300 p-8 sm:p-12 transition-all my-2 ${
                  orientacion === 'portrait' ? 'w-[794px] min-h-[1123px]' : 'w-[1123px] min-h-[794px]'
                }`}
              >
                {/* Visualizador de Contenido con Filtrado de Secciones */}
                <div className="documento-imprimible-preview text-xs text-[#282829] space-y-4">
                  {/* Si previewHtml existe, renderizamos aplicando estilo condicional por sección */}
                  <div
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                    ref={el => {
                      if (!el) return;
                      // Ocultar dinámicamente las secciones excluidas en la previsualización interactiva
                      const elementos = el.querySelectorAll('[data-seccion-id]');
                      elementos.forEach(item => {
                        const secId = item.getAttribute('data-seccion-id');
                        const isIncluded = !secId || seccionesSeleccionadasIds.includes(secId);
                        if (!isIncluded) {
                          item.classList.add('seccion-excluida-impresion');
                          (item as HTMLElement).style.display = 'none';
                        } else {
                          item.classList.remove('seccion-excluida-impresion');
                          (item as HTMLElement).style.display = '';
                        }
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
