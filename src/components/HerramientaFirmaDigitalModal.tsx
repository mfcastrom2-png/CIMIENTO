import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  Type,
  Trash2,
  FileCheck,
  Lock,
  Download
} from 'lucide-react';
import { generarHashIntegridadDocumento } from '../services/verificacionCertificadosService';

export interface DatosFirmaDigital {
  dataUrl: string;
  firmanteNombre: string;
  firmanteDocumento: string;
  firmanteCargo: string;
  fechaFirmaISO: string;
  fechaFirmaTexto: string;
  hashFirma: string;
  tipoFirma: 'trazo_manual' | 'tipografica';
}

interface HerramientaFirmaDigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (firma: DatosFirmaDigital) => void;
  tituloDocumento?: string;
  firmanteSugerido?: {
    nombre?: string;
    documento?: string;
    cargo?: string;
  };
}

export const HerramientaFirmaDigitalModal: React.FC<HerramientaFirmaDigitalModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
  tituloDocumento = 'Documento Institucional',
  firmanteSugerido
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [modoFirma, setModoFirma] = useState<'dibujar' | 'escribir'>('dibujar');

  // Datos del firmante
  const [nombre, setNombre] = useState(firmanteSugerido?.nombre || '');
  const [documento, setDocumento] = useState(firmanteSugerido?.documento || '');
  const [cargo, setCargo] = useState(firmanteSugerido?.cargo || 'Colaborador');
  const [nombreTipografico, setNombreTipografico] = useState(firmanteSugerido?.nombre || '');
  const [colorTrazo, setColorTrazo] = useState('#18235C');
  const [grosorTrazo, setGrosorTrazo] = useState(2.5);
  const [aceptoTerminos, setAceptoTerminos] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setNombre(firmanteSugerido?.nombre || '');
      setDocumento(firmanteSugerido?.documento || '');
      setCargo(firmanteSugerido?.cargo || 'Colaborador');
      setNombreTipografico(firmanteSugerido?.nombre || '');
      setTimeout(limpiarCanvas, 100);
    }
  }, [isOpen, firmanteSugerido]);

  if (!isOpen) return null;

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.strokeStyle = colorTrazo;
    ctx.lineWidth = grosorTrazo;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const generarFirmaTipograficaCanvas = (): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 500;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.font = 'italic bold 38px "Caveat", "Brush Script MT", "Segoe Script", cursive';
    ctx.fillStyle = colorTrazo;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nombreTipografico || nombre || 'Firma Digital', 250, 70);

    ctx.strokeStyle = colorTrazo;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 115);
    ctx.quadraticCurveTo(250, 125, 420, 115);
    ctx.stroke();

    return tempCanvas.toDataURL('image/png');
  };

  const handleConfirmarFirma = () => {
    if (!nombre.trim() || !aceptoTerminos) return;

    let dataUrl = '';
    if (modoFirma === 'dibujar') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      dataUrl = canvas.toDataURL('image/png');
    } else {
      dataUrl = generarFirmaTipograficaCanvas();
    }

    const fechaHoy = new Date();
    const fechaFirmaISO = fechaHoy.toISOString();
    const fechaFirmaTexto = fechaHoy.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const hashFirma = generarHashIntegridadDocumento({
      nombre,
      documento,
      cargo,
      fechaFirmaISO,
      tituloDocumento
    });

    const resultado: DatosFirmaDigital = {
      dataUrl,
      firmanteNombre: nombre.trim(),
      firmanteDocumento: documento.trim(),
      firmanteCargo: cargo.trim(),
      fechaFirmaISO,
      fechaFirmaTexto,
      hashFirma,
      tipoFirma: modoFirma === 'dibujar' ? 'trazo_manual' : 'tipografica'
    };

    onSaveSignature(resultado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#18235C]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#8FA7D6] overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-[#18235C] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <PenTool className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Herramienta de Firma Digital</h3>
              <span className="text-[11px] text-[#8FA7D6] block">
                Validez jurídica según Ley 527 de 1999 · {tituloDocumento}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Metadatos del firmante */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-[#18235C] mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Carlos Mendivelso"
                className="w-full p-2 bg-white border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#18235C] mb-1">C.C. / Documento *</label>
              <input
                type="text"
                value={documento}
                onChange={e => setDocumento(e.target.value)}
                placeholder="Ej. 1.019.034.789"
                className="w-full p-2 bg-white border border-[#8FA7D6] rounded-lg text-xs font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-[#18235C] mb-1">Cargo / Rol *</label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Ej. Técnico de Redes"
                className="w-full p-2 bg-white border border-[#8FA7D6] rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Selector de modo */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModoFirma('dibujar')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                  modoFirma === 'dibujar'
                    ? 'bg-[#18235C] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Dibujar Trazo</span>
              </button>
              <button
                type="button"
                onClick={() => setModoFirma('escribir')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                  modoFirma === 'escribir'
                    ? 'bg-[#18235C] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Firma Tipográfica</span>
              </button>
            </div>

            {modoFirma === 'dibujar' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={limpiarCanvas}
                  className="px-2.5 py-1 text-slate-600 hover:text-rose-600 font-semibold flex items-center gap-1 bg-slate-100 hover:bg-rose-50 rounded border border-slate-200 transition-colors"
                  title="Limpiar trazo"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Borrar</span>
                </button>
              </div>
            )}
          </div>

          {/* Área de Captura de Firma */}
          {modoFirma === 'dibujar' ? (
            <div className="space-y-2">
              <div className="relative border-2 border-dashed border-[#8FA7D6] rounded-xl bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={160}
                  className="w-full h-40 cursor-crosshair touch-none block"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                    <PenTool className="w-6 h-6 mb-1 opacity-40" />
                    <span className="text-[11px] font-medium">Dibuje su firma aquí con el mouse, lápiz o dedo</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-mono text-slate-300">
                  Línea de captura digital
                </div>
              </div>

              {/* Controles de color y grosor */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <div className="flex items-center gap-3">
                  <span>Color:</span>
                  <button
                    type="button"
                    onClick={() => setColorTrazo('#18235C')}
                    className={`w-5 h-5 rounded-full bg-[#18235C] border-2 transition-transform ${colorTrazo === '#18235C' ? 'scale-125 border-emerald-500' : 'border-white'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setColorTrazo('#0F172A')}
                    className={`w-5 h-5 rounded-full bg-slate-900 border-2 transition-transform ${colorTrazo === '#0F172A' ? 'scale-125 border-emerald-500' : 'border-white'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setColorTrazo('#1E3A8A')}
                    className={`w-5 h-5 rounded-full bg-blue-900 border-2 transition-transform ${colorTrazo === '#1E3A8A' ? 'scale-125 border-emerald-500' : 'border-white'}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span>Grosor:</span>
                  <input
                    type="range"
                    min="1.5"
                    max="4.5"
                    step="0.5"
                    value={grosorTrazo}
                    onChange={e => setGrosorTrazo(parseFloat(e.target.value))}
                    className="w-20 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">Nombre o Texto de la Firma:</label>
                <input
                  type="text"
                  value={nombreTipografico}
                  onChange={e => setNombreTipografico(e.target.value)}
                  placeholder="Ingrese su nombre exacto"
                  className="w-full p-2.5 bg-slate-50 border border-[#8FA7D6] rounded-xl text-sm font-semibold"
                />
              </div>
              <div className="p-4 bg-white border-2 border-dashed border-[#8FA7D6] rounded-xl h-32 flex flex-col items-center justify-center text-center shadow-inner">
                <span
                  style={{ color: colorTrazo }}
                  className="text-3xl sm:text-4xl italic font-serif tracking-wider"
                >
                  {nombreTipografico || nombre || 'Firma Digital Autorizada'}
                </span>
                <div className="w-48 h-0.5 bg-[#18235C] mt-2 opacity-50" />
              </div>
            </div>
          )}

          {/* Consentimiento legal */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
            <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-emerald-950 font-medium">
              <input
                type="checkbox"
                checked={aceptoTerminos}
                onChange={e => setAceptoTerminos(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>
                Certifico que esta firma electrónica tiene plena validez jurídica, probatoria y vinculante conforme al <strong>Art. 57 CST</strong> y la <strong>Ley 527 de 1999 de Colombia</strong>.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmarFirma}
            disabled={!nombre.trim() || !aceptoTerminos || (modoFirma === 'dibujar' && !hasDrawn)}
            className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 text-[#00FF00]" />
            <span>Estampar Firma Digital</span>
          </button>
        </div>
      </div>
    </div>
  );
};
