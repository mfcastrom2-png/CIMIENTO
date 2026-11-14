import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  FileSearch,
  Flashlight,
  History,
  ImageUp,
  Lock,
  Pause,
  Play,
  QrCode,
  RefreshCw,
  Search,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  SwitchCamera,
  Trash2,
  UserCheck
} from 'lucide-react';
import {
  ResultadoValidacionQrFirestore,
  validarContratoQrContraFirestore
} from '../../services/verificacionCertificadosService';
import { ConfiguracionEmpresa, Empleado, UsuarioSistema } from '../../types';

interface EscanerQrContratosViewProps {
  empleados: Empleado[];
  empresa?: ConfiguracionEmpresa;
  currentUser?: UsuarioSistema | null;
  onIrAEmpleados?: () => void;
  onIrAVerificadorManual?: () => void;
}

type EstadoCamara = 'inactiva' | 'solicitando' | 'activa' | 'denegada' | 'sin_dispositivo' | 'error';
type FiltroHistorial = 'todos' | 'autenticos' | 'alertas';

export const EscanerQrContratosView: React.FC<EscanerQrContratosViewProps> = ({
  empleados,
  empresa,
  currentUser,
  onIrAEmpleados,
  onIrAVerificadorManual
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lastDecodeAtRef = useRef<number>(0);
  const lastScannedValueRef = useRef<{ value: string; timestamp: number }>({ value: '', timestamp: 0 });
  const pausadoRef = useRef<boolean>(false);
  const validandoRef = useRef<boolean>(false);

  const [estadoCamara, setEstadoCamara] = useState<EstadoCamara>('inactiva');
  const [mensajeCamara, setMensajeCamara] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [dispositivosCamara, setDispositivosCamara] = useState<MediaDeviceInfo[]>([]);
  const [deviceIdSeleccionado, setDeviceIdSeleccionado] = useState<string>('');
  const [escaneoPausado, setEscaneoPausado] = useState<boolean>(false);
  const [linternaDisponible, setLinternaDisponible] = useState<boolean>(false);
  const [linternaActiva, setLinternaActiva] = useState<boolean>(false);
  const [destelloDeteccion, setDestelloDeteccion] = useState<boolean>(false);

  const [entradaManual, setEntradaManual] = useState<string>('');
  const [validando, setValidando] = useState<boolean>(false);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const [resultadoActual, setResultadoActual] = useState<ResultadoValidacionQrFirestore | null>(null);
  const [historial, setHistorial] = useState<ResultadoValidacionQrFirestore[]>([]);
  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorial>('todos');
  const [copiadoHash, setCopiadoHash] = useState<boolean>(false);

  useEffect(() => {
    pausadoRef.current = escaneoPausado;
  }, [escaneoPausado]);

  useEffect(() => {
    validandoRef.current = validando;
  }, [validando]);

  const emitirSonidoDeteccion = useCallback((esAutentico: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(esAutentico ? 880 : 340, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 240);
    } catch {
      // Silencioso si el navegador restringe Web Audio
    }
  }, []);

  const detenerCamara = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignorar error al liberar track
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setLinternaDisponible(false);
    setLinternaActiva(false);
    setEstadoCamara('inactiva');
  }, []);

  useEffect(() => {
    return () => {
      detenerCamara();
    };
  }, [detenerCamara]);

  const procesarCodigoDetectado = useCallback(
    async (rawQr: string) => {
      const limpio = rawQr.trim();
      if (!limpio) return;

      setValidando(true);
      setErrorImagen(null);
      setDestelloDeteccion(true);
      setTimeout(() => setDestelloDeteccion(false), 550);

      try {
        const res = await validarContratoQrContraFirestore(limpio, empleados);
        setResultadoActual(res);
        setHistorial(prev => [res, ...prev.filter(item => item.idRegistro !== res.idRegistro)].slice(0, 30));
        emitirSonidoDeteccion(res.esAutentico);
      } finally {
        setValidando(false);
      }
    },
    [empleados, emitirSonidoDeteccion]
  );

  const bucleEscaneo = useCallback(() => {
    if (estadoCamara !== 'activa') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ahora = performance.now();

    if (
      video &&
      canvas &&
      video.readyState === video.HAVE_ENOUGH_DATA &&
      !pausadoRef.current &&
      !validandoRef.current &&
      ahora - lastDecodeAtRef.current >= 120
    ) {
      lastDecodeAtRef.current = ahora;
      const ancho = video.videoWidth;
      const alto = video.videoHeight;

      if (ancho > 0 && alto > 0) {
        if (canvas.width !== ancho || canvas.height !== alto) {
          canvas.width = ancho;
          canvas.height = alto;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, ancho, alto);
          const imageData = ctx.getImageData(0, 0, ancho, alto);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (code?.data) {
            const yaLeidoRecientemente =
              lastScannedValueRef.current.value === code.data &&
              Date.now() - lastScannedValueRef.current.timestamp < 3200;

            if (!yaLeidoRecientemente) {
              lastScannedValueRef.current = { value: code.data, timestamp: Date.now() };
              void procesarCodigoDetectado(code.data);
            }
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(bucleEscaneo);
  }, [estadoCamara, procesarCodigoDetectado]);

  useEffect(() => {
    if (estadoCamara === 'activa') {
      rafRef.current = requestAnimationFrame(bucleEscaneo);
      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }
  }, [estadoCamara, bucleEscaneo]);

  const iniciarCamara = useCallback(
    async (modoSolicitado?: 'environment' | 'user', deviceIdOverride?: string) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setEstadoCamara('sin_dispositivo');
        setMensajeCamara('Este navegador o contexto no permite acceder a la cámara web. Utilice "Subir imagen QR" o validación manual.');
        return;
      }

      detenerCamara();
      setEstadoCamara('solicitando');
      setMensajeCamara('');
      setErrorImagen(null);

      const modo = modoSolicitado || facingMode;
      const devId = deviceIdOverride !== undefined ? deviceIdOverride : deviceIdSeleccionado;

      try {
        const videoConstraints: MediaTrackConstraints = devId
          ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: modo }, width: { ideal: 1280 }, height: { ideal: 720 } };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Verificar soporte de linterna (torch)
        const track = stream.getVideoTracks()[0];
        if (track && typeof track.getCapabilities === 'function') {
          const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
          setLinternaDisponible(Boolean(caps?.torch));
        } else {
          setLinternaDisponible(false);
        }

        // Enumerar cámaras disponibles para selector
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setDispositivosCamara(videoInputs);
          if (!devId && track?.getSettings?.().deviceId) {
            setDeviceIdSeleccionado(track.getSettings().deviceId || '');
          }
        } catch {
          // Opcional
        }

        setEscaneoPausado(false);
        setEstadoCamara('activa');
      } catch (err) {
        const nombreError = err instanceof Error ? err.name : '';
        if (nombreError === 'NotAllowedError' || nombreError === 'PermissionDeniedError') {
          setEstadoCamara('denegada');
          setMensajeCamara('Permiso de cámara denegado. Habilite el acceso a la cámara en su navegador o cargue una foto del QR.');
        } else if (nombreError === 'NotFoundError' || nombreError === 'DevicesNotFoundError') {
          setEstadoCamara('sin_dispositivo');
          setMensajeCamara('No se detectó una cámara física en este equipo. Puede subir una imagen del QR o pegar los datos.');
        } else {
          setEstadoCamara('error');
          setMensajeCamara('No fue posible iniciar la transmisión de video. Verifique que ninguna otra aplicación esté usando la cámara.');
        }
      }
    },
    [detenerCamara, facingMode, deviceIdSeleccionado]
  );

  const handleCambiarCamaraOrientacion = () => {
    const nuevoModo = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nuevoModo);
    setDeviceIdSeleccionado('');
    if (estadoCamara === 'activa') {
      void iniciarCamara(nuevoModo, '');
    }
  };

  const handleSeleccionarDispositivo = (nuevoId: string) => {
    setDeviceIdSeleccionado(nuevoId);
    if (estadoCamara === 'activa') {
      void iniciarCamara(facingMode, nuevoId);
    }
  };

  const handleToggleLinterna = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const siguiente = !linternaActiva;
    try {
      await track.applyConstraints({
        advanced: [{ torch: siguiente } as MediaTrackConstraintSet & { torch: boolean }]
      });
      setLinternaActiva(siguiente);
    } catch {
      setLinternaDisponible(false);
    }
  };

  const handleSubirImagenQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorImagen(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1400;
        const escala = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));

        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext('2d');
        if (!ctx) {
          setErrorImagen('No se pudo inicializar el procesador de imagen.');
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const decoded = jsQR(data.data, data.width, data.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (!decoded?.data) {
          setErrorImagen('No se detectó ningún código QR legible en la imagen seleccionada. Intente con un recorte más nítido.');
          return;
        }

        lastScannedValueRef.current = { value: decoded.data, timestamp: Date.now() };
        void procesarCodigoDetectado(decoded.data);
      };
      img.onerror = () => {
        setErrorImagen('El archivo seleccionado no es una imagen válida.');
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleValidacionManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entradaManual.trim()) return;
    lastScannedValueRef.current = { value: entradaManual.trim(), timestamp: Date.now() };
    void procesarCodigoDetectado(entradaManual);
  };

  const handleCopiarHash = (texto: string) => {
    if (!texto || !navigator.clipboard) return;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoHash(true);
      setTimeout(() => setCopiadoHash(false), 1800);
    }).catch(() => {});
  };

  const historialFiltrado = useMemo(() => {
    if (filtroHistorial === 'autenticos') {
      return historial.filter(h => h.esAutentico);
    }
    if (filtroHistorial === 'alertas') {
      return historial.filter(h => !h.esAutentico);
    }
    return historial;
  }, [historial, filtroHistorial]);

  const estadisticasSesion = useMemo(() => {
    const total = historial.length;
    const autenticos = historial.filter(h => h.esAutentico).length;
    const alertas = total - autenticos;
    return { total, autenticos, alertas };
  }, [historial]);

  const estiloEstado = useMemo(() => {
    if (!resultadoActual) return null;
    switch (resultadoActual.estadoValidacion) {
      case 'AUTENTICO_FIRMA_Y_HASH_COINCIDEN':
        return {
          container: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          iconBg: 'bg-emerald-600 text-white',
          titulo: 'CONTRATO AUTÉNTICO Y VERIFICADO',
          subtitulo: 'Firma criptográfica y hash SHA-256 confirmados en Firestore',
          Icono: CheckCircle2
        };
      case 'REVOCADO_O_ANULADO':
        return {
          container: 'bg-amber-50 border-amber-300 text-amber-950',
          iconBg: 'bg-amber-600 text-white',
          titulo: 'DOCUMENTO REVOCADO O ANULADO',
          subtitulo: 'El contrato fue invalidado en el registro de Firestore',
          Icono: AlertTriangle
        };
      case 'ALTERADO_O_HASH_NO_COINCIDE':
        return {
          container: 'bg-rose-50 border-rose-300 text-rose-950',
          iconBg: 'bg-rose-600 text-white',
          titulo: 'ALERTA DE INTEGRIDAD DOCUMENTAL',
          subtitulo: 'Discrepancia detectada entre el QR físico y Firestore',
          Icono: ShieldAlert
        };
      default:
        return {
          container: 'bg-slate-100 border-slate-300 text-slate-900',
          iconBg: 'bg-slate-700 text-white',
          titulo: 'SIN REGISTRO ACTIVO EN FIRESTORE',
          subtitulo: 'No existe un contrato coincidente en la base institucional',
          Icono: SearchX
        };
    }
  }, [resultadoActual]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Operativo Limpio */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#18235C] text-white flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Escáner QR de Contratos Físicos
              </h1>
              <p className="text-xs text-slate-500">
                {empresa?.nombreComercial || 'B GROUP INGENIERIA'} · Auditoría en tiempo real contra firma Ley 527 y hash SHA-256 en Firestore
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onIrAVerificadorManual && (
            <button
              type="button"
              onClick={onIrAVerificadorManual}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <FileSearch className="w-4 h-4 text-slate-500" />
              <span>Verificador Manual</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <ImageUp className="w-4 h-4 text-[#18235C]" />
            <span>Subir Imagen QR</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSubirImagenQr}
            className="hidden"
          />

          {estadoCamara === 'activa' ? (
            <button
              type="button"
              onClick={detenerCamara}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
              <span>Detener Cámara</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void iniciarCamara()}
              disabled={estadoCamara === 'solicitando'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Camera className="w-4 h-4 text-[#00FF00]" />
              <span>{estadoCamara === 'solicitando' ? 'Iniciando Cámara...' : 'Activar Cámara'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Principal: Visor de Cámara (Izquierda) + Diagnóstico en Tiempo Real (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Cámara & Entrada Alternativa */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#18235C]" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Visor Óptico de Cámara
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {estadoCamara === 'activa'
                  ? escaneoPausado
                    ? 'PAUSADO'
                    : validando
                    ? 'VALIDANDO...'
                    : 'ESCANEANDO'
                  : 'EN ESPERA'}
              </span>
            </div>

            {/* Viewport de Video */}
            <div
              className={`relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-slate-950 border transition-colors ${
                destelloDeteccion ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-slate-200'
              }`}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${estadoCamara === 'activa' ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Retícula de Enfoque cuando está activa */}
              {estadoCamara === 'activa' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 sm:w-56 sm:h-56 relative">
                    <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white rounded-tl-md" />
                    <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white rounded-tr-md" />
                    <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white rounded-bl-md" />
                    <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white rounded-br-md" />
                    {!escaneoPausado && (
                      <div className="absolute inset-x-3 top-1/2 h-px bg-[#00FF00]/70" />
                    )}
                  </div>
                  <div className="absolute bottom-3 inset-x-3 flex justify-center">
                    <span className="px-2.5 py-1 rounded bg-slate-950/80 text-white text-[11px] font-medium">
                      {escaneoPausado
                        ? 'Lectura pausada manualmente'
                        : 'Enfoque el código QR impreso en la última página del contrato'}
                    </span>
                  </div>
                </div>
              )}

              {/* Estados Inactivos / Permisos */}
              {estadoCamara !== 'activa' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                  {estadoCamara === 'solicitando' ? (
                    <>
                      <RefreshCw className="w-8 h-8 text-[#8FA7D6] animate-spin" />
                      <p className="text-xs text-slate-200 font-medium">
                        Solicitando acceso a la cámara del dispositivo...
                      </p>
                    </>
                  ) : estadoCamara === 'denegada' || estadoCamara === 'sin_dispositivo' || estadoCamara === 'error' ? (
                    <>
                      <CameraOff className="w-9 h-9 text-amber-400" />
                      <div className="space-y-1 max-w-xs">
                        <p className="text-xs font-bold text-white">Cámara no disponible</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{mensajeCamara}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => void iniciarCamara()}
                          className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer"
                        >
                          Reintentar Cámara
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-[#00FF00] text-[#18235C] text-xs font-bold cursor-pointer"
                        >
                          Cargar Foto del QR
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-[#00FF00]" />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <p className="text-sm font-bold text-white">Cámara lista para auditoría</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Active la cámara para leer el código QR del contrato físico y validarlo en tiempo real contra Firestore.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void iniciarCamara()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00FF00] hover:bg-[#00e600] text-[#18235C] text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Iniciar Escaneo con Cámara</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Controles de Cámara Activa */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCambiarCamaraOrientacion}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
                  title="Alternar entre cámara trasera y frontal"
                >
                  <SwitchCamera className="w-3.5 h-3.5 text-slate-600" />
                  <span>{facingMode === 'environment' ? 'Trasera' : 'Frontal'}</span>
                </button>

                {estadoCamara === 'activa' && (
                  <button
                    type="button"
                    onClick={() => setEscaneoPausado(p => !p)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    {escaneoPausado ? (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reanudar</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pausar</span>
                      </>
                    )}
                  </button>
                )}

                {linternaDisponible && estadoCamara === 'activa' && (
                  <button
                    type="button"
                    onClick={() => void handleToggleLinterna()}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      linternaActiva
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    <span>Flash</span>
                  </button>
                )}
              </div>

              {dispositivosCamara.length > 1 && (
                <select
                  value={deviceIdSeleccionado}
                  onChange={e => handleSeleccionarDispositivo(e.target.value)}
                  className="max-w-[175px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:border-[#18235C]"
                  aria-label="Seleccionar cámara"
                >
                  <option value="">Cámara automática</option>
                  {dispositivosCamara.map((d, idx) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Cámara ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {errorImagen && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorImagen}</span>
              </div>
            )}
          </div>

          {/* Entrada Manual / Respaldo */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
            <label htmlFor="manual-qr-input" className="block text-xs font-bold text-slate-800">
              Validación Directa (Código, URL Firmada o JSON del QR)
            </label>
            <form onSubmit={handleValidacionManual} className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="manual-qr-input"
                  type="text"
                  value={entradaManual}
                  onChange={e => setEntradaManual(e.target.value)}
                  placeholder='Ej: CTR-BGROUP-2026-0001 o {"idContrato":...}'
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-[#18235C]"
                />
              </div>
              <button
                type="submit"
                disabled={validando || !entradaManual.trim()}
                className="px-3.5 py-2 rounded-lg bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                Validar
              </button>
            </form>
            <p className="text-[11px] text-slate-500">
              Útil si el lector USB tipo pistola ingresa el contenido del QR o si el contrato físico presenta desgaste en el papel.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Resultado de Validación contra Firestore */}
        <div className="lg:col-span-7 space-y-4">
          {validando && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#18235C] animate-spin mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Validando firma y hash SHA-256 en Firestore...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Contrastando certificados emitidos y expediente digital del colaborador
                </p>
              </div>
            </div>
          )}

          {!validando && !resultadoActual && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#18235C] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Esperando lectura de código QR
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Al detectar el QR de un contrato laboral impreso, el sistema ejecutará automáticamente tres verificaciones criptográficas en tiempo real:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-mono font-bold text-[#18235C]">01 · METADATOS JSON</span>
                  <p className="text-xs font-semibold text-slate-900">Extracción de Payload</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Decodifica nombre, número de cédula, ID del contrato y URL firmada.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-mono font-bold text-[#18235C]">02 · LEY 527 / 1999</span>
                  <p className="text-xs font-semibold text-slate-900">Firma Criptográfica</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Verifica que el parámetro <span className="font-mono">sig</span> de la URL no haya sido alterado.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-mono font-bold text-[#18235C]">03 · FIRESTORE SHA-256</span>
                  <p className="text-xs font-semibold text-slate-900">Contraste de Hash</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Compara el hash del documento físico contra el almacenado en Firestore.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!validando && resultadoActual && estiloEstado && (
            <div className="space-y-4">
              {/* Tarjeta Principal de Veredicto */}
              <div className={`rounded-xl border p-5 space-y-4 ${estiloEstado.container}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${estiloEstado.iconBg}`}>
                      <estiloEstado.Icono className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold tracking-tight">
                        {estiloEstado.titulo}
                      </h2>
                      <p className="text-xs opacity-85 mt-0.5">
                        {resultadoActual.mensajeVeredicto}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[11px] font-mono uppercase opacity-75 block">
                      ID Contrato
                    </span>
                    <span className="text-sm font-mono font-bold tabular-nums">
                      {resultadoActual.codigoContrato}
                    </span>
                  </div>
                </div>

                {/* Strip de 3 Verificaciones */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-white border border-slate-200/80 rounded-lg p-3 space-y-1 text-slate-900">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Firma URL (sig)
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {resultadoActual.firmaUrlValida === true ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-700">Firma Válida</span>
                        </>
                      ) : resultadoActual.firmaUrlValida === false ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-rose-700">Firma Alterada</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-amber-700">Sin parámetro sig</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-lg p-3 space-y-1 text-slate-900">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Hash SHA-256 vs Firestore
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {resultadoActual.hashCoincide === true ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-700">Coincide 100%</span>
                        </>
                      ) : resultadoActual.hashCoincide === false ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-rose-700">No Coincide</span>
                        </>
                      ) : resultadoActual.hashFirestore ? (
                        <>
                          <FileCheck2 className="w-4 h-4 text-slate-600 shrink-0" />
                          <span className="text-slate-700">Hash en Firestore</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-amber-700">Sin Hash Firmado</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-lg p-3 space-y-1 text-slate-900">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Fuente Firestore
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {resultadoActual.fuenteFirestore !== 'ninguna' ? (
                        <>
                          <Lock className="w-4 h-4 text-[#18235C] shrink-0" />
                          <span className="text-slate-900 font-mono text-[11px]">
                            {resultadoActual.fuenteFirestore === 'ambas'
                              ? 'certificados + empleados'
                              : resultadoActual.fuenteFirestore}
                          </span>
                        </>
                      ) : (
                        <>
                          <SearchX className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="text-slate-600">No localizado</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparador Criptográfico de Hashes */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Comparación de Hash SHA-256
                  </span>
                  {resultadoActual.hashFirestore && (
                    <button
                      type="button"
                      onClick={() => handleCopiarHash(resultadoActual.hashFirestore || '')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#18235C] hover:underline cursor-pointer"
                    >
                      {copiadoHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoHash ? 'Hash copiado' : 'Copiar hash Firestore'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-500 font-medium shrink-0">Hash leído del QR físico:</span>
                    <span className="font-mono text-slate-900 font-semibold break-all tabular-nums">
                      {resultadoActual.hashQr || 'No incluido en el QR'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-500 font-medium shrink-0">Hash almacenado en Firestore:</span>
                    <span
                      className={`font-mono font-semibold break-all tabular-nums ${
                        resultadoActual.hashCoincide === true
                          ? 'text-emerald-700'
                          : resultadoActual.hashCoincide === false
                          ? 'text-rose-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {resultadoActual.hashFirestore || 'Sin hash registrado en Firestore'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metadatos del Colaborador y Contrato */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Datos del Titular y Contrato
                  </span>
                  {onIrAEmpleados && resultadoActual.datosEmpleadoContrato && (
                    <button
                      type="button"
                      onClick={onIrAEmpleados}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-[#18235C] cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ver Directorio de Personal</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-0.5">
                    <span className="text-[11px] text-slate-500 block">Colaborador (Firestore / QR)</span>
                    <strong className="text-slate-900 text-sm block">
                      {resultadoActual.datosEmpleadoContrato?.nombreCompleto ||
                        resultadoActual.registroCertificado?.titularNombre ||
                        resultadoActual.payloadQr?.nombreEmpleado ||
                        'No especificado'}
                    </strong>
                    <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                      Doc: {resultadoActual.datosEmpleadoContrato?.documento ||
                        resultadoActual.registroCertificado?.titularDocumento ||
                        resultadoActual.payloadQr?.numeroDocumento ||
                        'N/D'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-0.5">
                    <span className="text-[11px] text-slate-500 block">Tipo y Estado Contractual</span>
                    <strong className="text-slate-900 text-sm block">
                      {resultadoActual.datosEmpleadoContrato?.tipoContrato || resultadoActual.tipoDocumento}
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      {resultadoActual.datosEmpleadoContrato?.cargoNombre ||
                        resultadoActual.registroCertificado?.titularCargo ||
                        'Cargo institucional'}{' '}
                      ·{' '}
                      <strong className="text-slate-800">
                        {resultadoActual.datosEmpleadoContrato?.estadoContrato ||
                          resultadoActual.registroCertificado?.estado ||
                          'Sin estado'}
                      </strong>
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-0.5">
                    <span className="text-[11px] text-slate-500 block">Fecha de Firma / Emisión</span>
                    <strong className="text-slate-900 font-mono text-xs block tabular-nums">
                      {resultadoActual.datosEmpleadoContrato?.fechaFirma
                        ? resultadoActual.datosEmpleadoContrato.fechaFirma.slice(0, 19).replace('T', ' ')
                        : resultadoActual.registroCertificado?.fechaEmision || 'Pendiente de firma'}
                    </strong>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      Validado: {new Date(resultadoActual.verificadoEnISO).toLocaleTimeString('es-CO')}
                      {currentUser?.nombre ? ` · Auditor: ${currentUser.nombre}` : ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] text-slate-500 block">Rúbrica Digital Almacenada</span>
                    {resultadoActual.datosEmpleadoContrato?.firmaCandidatoUrl ? (
                      <div className="h-10 bg-white border border-slate-200 rounded px-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={resultadoActual.datosEmpleadoContrato.firmaCandidatoUrl}
                          alt="Firma registrada en Firestore"
                          className="max-h-8 w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic block pt-1">
                        Sin imagen de rúbrica capturada en contrato
                      </span>
                    )}
                  </div>
                </div>

                {/* Detalle Técnico de Validación */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Bitácora de Comprobaciones
                  </span>
                  <ul className="space-y-1">
                    {resultadoActual.detallesValidacion.map((detalle, index) => (
                      <li key={index} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="text-[#18235C] font-mono font-bold mt-0.5">›</span>
                        <span>{detalle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historial de Auditoría de la Sesión */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#18235C]" />
            <h3 className="text-sm font-bold text-slate-900">
              Historial de Validaciones de Sesión
            </h3>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {estadisticasSesion.total} escaneos · {estadisticasSesion.autenticos} auténticos · {estadisticasSesion.alertas} alertas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'autenticos', label: 'Auténticos' },
                  { id: 'alertas', label: 'Alertas' }
                ] as { id: FiltroHistorial; label: string }[]
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroHistorial(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    filtroHistorial === tab.id
                      ? 'bg-white text-[#18235C] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {historial.length > 0 && (
              <button
                type="button"
                onClick={() => setHistorial([])}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 cursor-pointer"
                title="Limpiar historial de la sesión"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {historialFiltrado.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {historial.length === 0
              ? 'Aún no se han escaneado contratos en esta sesión.'
              : 'No hay registros que coincidan con el filtro seleccionado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Hora</th>
                  <th className="py-2.5 px-4">Contrato</th>
                  <th className="py-2.5 px-4">Colaborador</th>
                  <th className="py-2.5 px-4">Firma URL</th>
                  <th className="py-2.5 px-4">Hash Firestore</th>
                  <th className="py-2.5 px-4">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historialFiltrado.map(item => (
                  <tr
                    key={item.idRegistro}
                    onClick={() => setResultadoActual(item)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                      resultadoActual?.idRegistro === item.idRegistro ? 'bg-slate-50/90' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(item.verificadoEnISO).toLocaleTimeString('es-CO')}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#18235C] whitespace-nowrap">
                      {item.codigoContrato}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">
                      <span className="font-semibold block">
                        {item.datosEmpleadoContrato?.nombreCompleto ||
                          item.registroCertificado?.titularNombre ||
                          item.payloadQr?.nombreEmpleado ||
                          'No registrado'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {item.datosEmpleadoContrato?.documento ||
                          item.registroCertificado?.titularDocumento ||
                          item.payloadQr?.numeroDocumento ||
                          ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {item.firmaUrlValida === true ? (
                        <span className="text-emerald-700 font-semibold">Válida</span>
                      ) : item.firmaUrlValida === false ? (
                        <span className="text-rose-700 font-semibold">Inválida</span>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {item.hashCoincide === true ? (
                        <span className="text-emerald-700 font-semibold">Coincide</span>
                      ) : item.hashCoincide === false ? (
                        <span className="text-rose-700 font-semibold">Discrepancia</span>
                      ) : (
                        <span className="text-slate-500">Sin contraste</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          item.esAutentico
                            ? 'text-emerald-700'
                            : item.estadoValidacion === 'REVOCADO_O_ANULADO'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {item.esAutentico ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {item.esAutentico
                            ? 'Auténtico'
                            : item.estadoValidacion === 'REVOCADO_O_ANULADO'
                            ? 'Revocado'
                            : item.estadoValidacion === 'ALTERADO_O_HASH_NO_COINCIDE'
                            ? 'Alterado'
                            : 'No encontrado'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
