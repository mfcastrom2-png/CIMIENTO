import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  ShieldCheck,
  Download,
  Trash2,
  Type,
  RotateCcw,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  FileText,
  FileCheck,
  Building2,
  QrCode,
  Sparkles
} from 'lucide-react';
import { UsuarioSistema, Empleado, Cargo, ConfiguracionEmpresa } from '../types';
import { initialEmpresa } from '../data/initialData';
import { generarHashIntegridadDocumento } from '../services/verificacionCertificadosService';
import { CodigoQRVerificacion } from './CodigoQRVerificacion';
import { FirmaDigitalStamp } from './FirmaDigitalStamp';
import { DatosFirmaDigital } from './HerramientaFirmaDigitalModal';

interface FirmaDigitalStudioViewProps {
  currentUser?: UsuarioSistema | null;
  empleados?: Empleado[];
  cargos?: Cargo[];
  empresa?: ConfiguracionEmpresa;
}

export const FirmaDigitalStudioView: React.FC<FirmaDigitalStudioViewProps> = ({
  currentUser,
  empleados = [],
  cargos = [],
  empresa = initialEmpresa
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [modoFirma, setModoFirma] = useState<'dibujar' | 'escribir'>('dibujar');

  // Datos del firmante
  const [nombre, setNombre] = useState(currentUser?.nombre || '');
  const [documento, setDocumento] = useState('');
  const [cargo, setCargo] = useState(currentUser?.cargoNombre || 'Colaborador');
  const [nombreTipografico, setNombreTipografico] = useState(currentUser?.nombre || '');
  const [estiloFuente, setEstiloFuente] = useState<'cursiva_1' | 'cursiva_2' | 'cursiva_3'>('cursiva_1');
  const [colorTrazo, setColorTrazo] = useState('#18235C');
  const [grosorTrazo, setGrosorTrazo] = useState(2.5);

  // Firma guardada activa
  const [firmaGuardada, setFirmaGuardada] = useState<DatosFirmaDigital | null>(() => {
    try {
      const raw = localStorage.getItem('bgroup_firma_digital_usuario');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  });

  const [copiadoHash, setCopiadoHash] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  // Cargar datos de empleado si existe
  useEffect(() => {
    if (currentUser?.empleadoId && empleados.length > 0) {
      const emp = empleados.find(e => e.id === currentUser.empleadoId);
      if (emp) {
        if (!documento) setDocumento(emp.documento);
        if (!nombre) setNombre(emp.nombre);
        if (!nombreTipografico) setNombreTipografico(emp.nombre);
        const c = cargos.find(cg => cg.id === emp.cargoId);
        if (c && !cargo) setCargo(c.nombre);
      }
    }
  }, [currentUser, empleados, cargos]);

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

  const renderizarFirmaTipografica = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorTrazo;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    let fontSpec = 'italic bold 44px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    if (estiloFuente === 'cursiva_2') {
      fontSpec = 'italic 46px "Dancing Script", "Great Vibes", "Lucida Handwriting", cursive';
    } else if (estiloFuente === 'cursiva_3') {
      fontSpec = 'bold 42px "Palatino Linotype", "Book Antiqua", serif';
    }

    ctx.font = fontSpec;
    ctx.fillText(nombreTipografico || nombre || 'Firma Digital', canvas.width / 2, canvas.height / 2);

    // Línea de rúbrica caligráfica
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 140, canvas.height / 2 + 35);
    ctx.quadraticCurveTo(canvas.width / 2, canvas.height / 2 + 50, canvas.width / 2 + 140, canvas.height / 2 + 25);
    ctx.strokeStyle = colorTrazo;
    ctx.lineWidth = 2;
    ctx.stroke();

    return canvas.toDataURL('image/png');
  };

  const guardarFirmaOficial = () => {
    let dataUrl = '';
    if (modoFirma === 'dibujar') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      dataUrl = canvas.toDataURL('image/png');
    } else {
      dataUrl = renderizarFirmaTipografica();
    }

    const fechaISO = new Date().toISOString();
    const hash = generarHashIntegridadDocumento({
      nombre,
      documento,
      cargo,
      fecha: fechaISO,
      tipo: modoFirma
    });

    const datos: DatosFirmaDigital = {
      dataUrl,
      firmanteNombre: nombre || currentUser?.nombre || 'Colaborador Institucional',
      firmanteDocumento: documento,
      firmanteCargo: cargo,
      fechaFirmaISO: fechaISO,
      fechaFirmaTexto: new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      hashFirma: hash,
      tipoFirma: modoFirma === 'dibujar' ? 'trazo_manual' : 'tipografica'
    };

    setFirmaGuardada(datos);
    try {
      localStorage.setItem('bgroup_firma_digital_usuario', JSON.stringify(datos));
    } catch {}

    setMensajeGuardado(true);
    setTimeout(() => setMensajeGuardado(false), 3000);
  };

  const descargarFirmaPng = () => {
    if (!firmaGuardada?.dataUrl) return;
    const a = document.createElement('a');
    a.href = firmaGuardada.dataUrl;
    a.download = `Firma_Digital_${(firmaGuardada.firmanteNombre || 'Usuario').replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const copiarHash = () => {
    if (!firmaGuardada?.hashFirma) return;
    navigator.clipboard.writeText(firmaGuardada.hashFirma);
    setCopiadoHash(true);
    setTimeout(() => setCopiadoHash(false), 2000);
  };

  const eliminarFirmaGuardada = () => {
    setFirmaGuardada(null);
    try {
      localStorage.removeItem('bgroup_firma_digital_usuario');
    } catch {}
    limpiarCanvas();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#8FA7D6]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-[#18235C]" />
              Herramienta de Firma Digital
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Ley 527 de 1999
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18235C]">
            Estudio y Estampado de Firma Digital
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Configure su rúbrica digital personal con hash criptográfico de integridad SHA-256 para estamparla en manuales, actas de evaluación, entrega de EPPs y certificados.
          </p>
        </div>

        {firmaGuardada && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarFirmaPng}
              className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#00FF00]" />
              <span>Descargar PNG</span>
            </button>
            <button
              type="button"
              onClick={eliminarFirmaGuardada}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title="Eliminar firma registrada"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {mensajeGuardado && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-semibold">
            ¡Firma digital y credenciales guardadas exitosamente! Ya se encuentra lista para estampar en todos los formatos del sistema.
          </div>
        </div>
      )}

      {/* Grid Principal: Canvas de Creación vs Credencial Activa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Creación y Personalización (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#8FA7D6]/40 shadow-xs space-y-4">
            {/* Selector de Modo */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-xs text-[#18235C] uppercase tracking-wider">
                1. Diseñar Rúbrica
              </span>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModoFirma('dibujar')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    modoFirma === 'dibujar'
                      ? 'bg-[#18235C] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Dibujar a Mano</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoFirma('escribir')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    modoFirma === 'escribir'
                      ? 'bg-[#18235C] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Tipográfica</span>
                </button>
              </div>
            </div>

            {/* Modo Dibujar (Canvas Pad) */}
            {modoFirma === 'dibujar' ? (
              <div className="space-y-3">
                <div className="relative border-2 border-dashed border-[#8FA7D6]/60 rounded-2xl bg-slate-50/50 p-2 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-48 bg-white rounded-xl touch-none cursor-crosshair shadow-inner"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1">
                      <PenTool className="w-6 h-6 stroke-1" />
                      <span className="text-xs font-medium">Dibuje su firma con mouse o pantalla táctil</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Color:</span>
                    {['#18235C', '#000000', '#0F4C81'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setColorTrazo(color)}
                        style={{ backgroundColor: color }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          colorTrazo === color ? 'scale-110 border-emerald-500 shadow-xs' : 'border-white'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={limpiarCanvas}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Borrar Trazo</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Modo Escribir Tipográfica */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#18235C] mb-1">Texto de la Rúbrica:</label>
                  <input
                    type="text"
                    value={nombreTipografico}
                    onChange={e => setNombreTipografico(e.target.value)}
                    placeholder="Ej: Paula Andrea Salazar"
                    className="w-full p-2.5 rounded-xl border border-[#8FA7D6] text-sm font-semibold bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 block">Estilo Caligráfico:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cursiva_1', label: 'Estilo Brush Script' },
                      { id: 'cursiva_2', label: 'Estilo Elegante' },
                      { id: 'cursiva_3', label: 'Estilo Notarial' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setEstiloFuente(f.id as any)}
                        className={`p-3 rounded-xl border text-xs text-center transition-all ${
                          estiloFuente === f.id
                            ? 'border-[#18235C] bg-[#18235C]/5 text-[#18235C] font-bold shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Metadatos del Firmante */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="font-bold text-xs text-[#18235C] uppercase tracking-wider block">
                2. Datos del Titular de la Firma
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cédula / Documento:</label>
                  <input
                    type="text"
                    value={documento}
                    onChange={e => setDocumento(e.target.value)}
                    placeholder="Ej: 52.894.112"
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cargo Institucional:</label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={guardarFirmaOficial}
              className="w-full py-3 bg-[#18235C] hover:bg-[#101740] text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-[#00FF00]" />
              <span>Guardar Rúbrica & Credencial Criptográfica</span>
            </button>
          </div>
        </div>

        {/* Panel Derecho: Visualización de Credencial y Estampado (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#8FA7D6]/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-xs text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Credencial Digital Activa
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                {firmaGuardada ? 'VIGENTE' : 'SIN REGISTRAR'}
              </span>
            </div>

            {firmaGuardada ? (
              <div className="space-y-4">
                {/* Visualizador de la Firma */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-center h-24 shadow-inner">
                    <img
                      src={firmaGuardada.dataUrl}
                      alt="Rúbrica registrada"
                      className="max-h-20 max-w-full object-contain"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <strong className="block text-sm text-[#18235C] uppercase">
                      {firmaGuardada.firmanteNombre}
                    </strong>
                    {firmaGuardada.firmanteDocumento && (
                      <span className="text-slate-600 font-mono text-xs block">
                        C.C. {firmaGuardada.firmanteDocumento}
                      </span>
                    )}
                    <span className="text-slate-700 font-medium block">
                      {firmaGuardada.firmanteCargo}
                    </span>
                    <span className="text-[10px] text-emerald-800 font-mono block">
                      Registrada: {firmaGuardada.fechaFirmaTexto}
                    </span>
                  </div>
                </div>

                {/* Token SHA-256 */}
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#00FF00]" />
                      Hash Criptográfico de Integridad:
                    </span>
                    <button
                      type="button"
                      onClick={copiarHash}
                      className="text-emerald-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiadoHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiadoHash ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <div className="font-bold text-white break-all text-xs bg-black/40 p-1.5 rounded">
                    {firmaGuardada.hashFirma}
                  </div>
                </div>

                {/* Ejemplo de Estampado en Documento */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Previsualización en Formato Oficial:
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <FirmaDigitalStamp
                      firma={firmaGuardada}
                      labelCargo="Firma de Validación y Compromiso Laboral"
                      readOnly={true}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <PenTool className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs">
                  Aún no ha configurado su firma digital. Dibújela o elija un estilo tipográfico en el panel izquierdo y presione <strong>Guardar Rúbrica</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
