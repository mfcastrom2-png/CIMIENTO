import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Empleado,
  ConfiguracionEmpresa,
  DocumentoExpedienteEmpleado,
  NotificacionVinculacion
} from '../../types';
import {
  PenTool,
  ShieldCheck,
  RotateCcw,
  Undo2,
  Sparkles,
  Printer,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Clock,
  Building2,
  Check,
  Briefcase,
  MapPin,
  Calendar,
  Lock,
  UserCheck,
  Download,
  Loader2
} from 'lucide-react';
import { uid } from '../../data/initialData';
import { CorporateLogo } from '../CorporateLogo';
import { CodigoQRVerificacion } from '../CodigoQRVerificacion';
import { exportarContenedorAPDF } from '../../utils/pdfExport';
import { imprimirDocumento } from '../../utils/printUtils';
import {
  generarPdfContratoLaboralVectorial,
  formatFechaEspanolFormal,
  construirDatosPdfContratoDesdeEmpleado
} from '../../utils/contratoPdfGenerator';
import {
  generarHashSha256,
  generarTextoNotificacionContratoFirmado,
  despacharNotificacionVinculacion,
  normalizarCodigoContratoLaboral
} from '../../services/vinculacionService';
import { registrarCertificadoEmitido } from '../../services/verificacionCertificadosService';

interface ModalFirmaContratoLaboralProps {
  empleado: Empleado;
  empresa?: ConfiguracionEmpresa;
  onClose: () => void;
  onContratoFirmado: (empleadoActualizado: Empleado) => Promise<void> | void;
  esVistaCandidato?: boolean;
}

interface StrokePoint {
  x: number;
  y: number;
}

const LOGICAL_CANVAS_WIDTH = 650;
const LOGICAL_CANVAS_HEIGHT = 180;

export const ModalFirmaContratoLaboral: React.FC<ModalFirmaContratoLaboralProps> = ({
  empleado,
  empresa,
  onClose,
  onContratoFirmado,
  esVistaCandidato = false
}) => {
  const contrato = empleado.vinculacion?.contratoDigital;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<StrokePoint[][]>([]);
  const currentStrokeRef = useRef<StrokePoint[]>([]);
  const activePointerIdRef = useRef<number | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const dprRef = useRef<number>(1);

  const [cantidadTrazos, setCantidadTrazos] = useState(0);
  const [esRubricaAutomatica, setEsRubricaAutomatica] = useState(false);
  const [firmaCapturada, setFirmaCapturada] = useState<string | null>(
    contrato?.firmaCandidatoUrl || null
  );
  const [firmaNombre, setFirmaNombre] = useState(
    contrato?.firmaCandidatoNombre || empleado.nombre
  );
  const [firmaDocumento, setFirmaDocumento] = useState(
    contrato?.firmaCandidatoDocumento || empleado.documento
  );
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const handleDescargarPdf = async () => {
    setDescargandoPdf(true);
    setErrorValidacion(null);
    try {
      const codContrato = normalizarCodigoContratoLaboral(contrato?.codigoContrato);
      // Si el usuario ya trazó su firma en el lienzo pero no pulsó "Confirmar", incluirla en el PDF
      let firmaParaPdf = firmaCapturada;
      if (!firmaParaPdf && strokesRef.current.length > 0 && canvasRef.current) {
        const longitud = calcularLongitudTotalTrazos(strokesRef.current);
        if (strokesRef.current.length > 1 || longitud >= 8) {
          configurarYRedibujarCanvas(strokesRef.current);
          firmaParaPdf = canvasRef.current.toDataURL('image/png');
        }
      }

      const estadoDoc = firmaParaPdf ? 'Firmado' : 'Borrador_Previo_Firma';
      const nombreArchivo = `Contrato_Termino_Fijo_${codContrato}_${empleado.documento || empleado.laboral?.codigoInterno || 'COLABORADOR'}_${estadoDoc}`;

      const datosPdf = construirDatosPdfContratoDesdeEmpleado(empleado, empresa, {
        firmaCapturadaUrlOverride: firmaParaPdf,
        firmaNombreOverride: firmaNombre,
        firmaDocumentoOverride: firmaDocumento
      });

      const exitoVectorial = await generarPdfContratoLaboralVectorial(datosPdf, nombreArchivo);

      if (!exitoVectorial) {
        const exitoFallback = await exportarContenedorAPDF('area-impresion-contrato-laboral', nombreArchivo);
        if (!exitoFallback) {
          imprimirDocumento(nombreArchivo, 'area-impresion-contrato-laboral');
        }
      }
    } catch (err) {
      console.error('Error al generar PDF del contrato:', err);
      const codContrato = normalizarCodigoContratoLaboral(contrato?.codigoContrato);
      imprimirDocumento(`Contrato_${codContrato}`, 'area-impresion-contrato-laboral');
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleImprimirContrato = () => {
    // Si hay trazos pendientes por confirmar, sincronizar vista previa para que salgan en la impresión
    if (!firmaCapturada && strokesRef.current.length > 0) {
      const longitud = calcularLongitudTotalTrazos(strokesRef.current);
      if (strokesRef.current.length > 1 || longitud >= 8) {
        confirmarFirmaDesdeCanvas();
      }
    }
    const codContrato = normalizarCodigoContratoLaboral(contrato?.codigoContrato);
    const tituloPrint = `Contrato_Termino_Fijo_${codContrato}_${empleado.documento}`;
    // Dar un tick para que React refleje la firma antes de abrir diálogo de impresión
    setTimeout(() => {
      imprimirDocumento(tituloPrint, 'area-impresion-contrato-laboral');
    }, 60);
  };

  // Configurar escala HiDPI y renderizar todos los trazos guardados
  const configurarYRedibujarCanvas = useCallback((trazos: StrokePoint[][], trazoEnCurso?: StrokePoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    const targetWidth = Math.round(LOGICAL_CANVAS_WIDTH * dpr);
    const targetHeight = Math.round(LOGICAL_CANVAS_HEIGHT * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, LOGICAL_CANVAS_WIDTH, LOGICAL_CANVAS_HEIGHT);

    ctx.strokeStyle = '#18235C';
    ctx.fillStyle = '#18235C';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const dibujarTrazo = (puntos: StrokePoint[]) => {
      if (puntos.length === 0) return;
      if (puntos.length === 1) {
        ctx.beginPath();
        ctx.arc(puntos[0].x, puntos[0].y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (puntos.length === 2) {
        ctx.beginPath();
        ctx.moveTo(puntos[0].x, puntos[0].y);
        ctx.lineTo(puntos[1].x, puntos[1].y);
        ctx.stroke();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(puntos[0].x, puntos[0].y);
      for (let i = 1; i < puntos.length - 1; i++) {
        const midX = (puntos[i].x + puntos[i + 1].x) / 2;
        const midY = (puntos[i].y + puntos[i + 1].y) / 2;
        ctx.quadraticCurveTo(puntos[i].x, puntos[i].y, midX, midY);
      }
      const last = puntos[puntos.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    };

    trazos.forEach(dibujarTrazo);
    if (trazoEnCurso && trazoEnCurso.length > 0) {
      dibujarTrazo(trazoEnCurso);
    }

    ctx.restore();
  }, []);

  useEffect(() => {
    configurarYRedibujarCanvas(strokesRef.current);
  }, [configurarYRedibujarCanvas]);

  // Convertir coordenadas de cliente a coordenadas lógicas reales del lienzo (650x180)
  const obtenerPuntoLogico = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? LOGICAL_CANVAS_WIDTH / rect.width : 1;
    const scaleY = rect.height > 0 ? LOGICAL_CANVAS_HEIGHT / rect.height : 1;
    return {
      x: Math.max(0, Math.min(LOGICAL_CANVAS_WIDTH, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(LOGICAL_CANVAS_HEIGHT, (e.clientY - rect.top) * scaleY))
    };
  };

  // Manejo del Canvas de Firma con Pointer Events (soporta múltiples trazos separados para letra no cursiva / imprenta)
  const manejarPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ignorar botones secundarios del mouse
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Evitar interferencia de un segundo dedo o palma mientras ya hay un puntero activo
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Algunos navegadores móviles no requieren captura explícita
    }

    // Si estaba usando rúbrica automática previa, limpiar para iniciar trazo manual limpio
    if (esRubricaAutomatica) {
      strokesRef.current = [];
      setCantidadTrazos(0);
      setEsRubricaAutomatica(false);
    }

    // Si el usuario vuelve a trazar después de fijar vista previa, desbloqueamos para agregar nuevos caracteres
    if (firmaCapturada) {
      setFirmaCapturada(null);
    }

    activePointerIdRef.current = e.pointerId;
    isDrawingRef.current = true;
    const punto = obtenerPuntoLogico(e);
    currentStrokeRef.current = [punto];
    setErrorValidacion(null);
    configurarYRedibujarCanvas(strokesRef.current, currentStrokeRef.current);
  };

  const manejarPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();

    const punto = obtenerPuntoLogico(e);
    const actual = currentStrokeRef.current;
    const ultimo = actual[actual.length - 1];

    // Filtrar micro-movimientos menores a 0.8px para suavidad y rendimiento táctil
    if (ultimo) {
      const dx = punto.x - ultimo.x;
      const dy = punto.y - ultimo.y;
      if (dx * dx + dy * dy < 0.64) return;
    }

    actual.push(punto);
    configurarYRedibujarCanvas(strokesRef.current, actual);
  };

  const finalizarTrazoIndividual = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignorar si ya fue liberado
      }
    }

    if (currentStrokeRef.current.length > 0) {
      strokesRef.current = [...strokesRef.current, [...currentStrokeRef.current]];
      setCantidadTrazos(strokesRef.current.length);
    }
    currentStrokeRef.current = [];
    activePointerIdRef.current = null;
    isDrawingRef.current = false;
    configurarYRedibujarCanvas(strokesRef.current);
    // NOTA: NO finalizamos ni fijamos `firmaCapturada` aquí para que el usuario pueda levantar
    // el dedo o cursor libremente entre cada letra o carácter de su firma (ej. letra imprenta / despegada).
  };

  const calcularLongitudTotalTrazos = (trazos: StrokePoint[][]): number => {
    let total = 0;
    for (const stroke of trazos) {
      for (let i = 1; i < stroke.length; i++) {
        const dx = stroke[i].x - stroke[i - 1].x;
        const dy = stroke[i].y - stroke[i - 1].y;
        total += Math.hypot(dx, dy);
      }
    }
    return total;
  };

  const confirmarFirmaDesdeCanvas = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (strokesRef.current.length === 0) return null;

    const longitud = calcularLongitudTotalTrazos(strokesRef.current);
    if (strokesRef.current.length === 1 && longitud < 8) {
      setErrorValidacion('El trazo capturado es muy corto o parece un toque accidental. Complete su firma realizando los trazos completos antes de confirmarla.');
      return null;
    }

    configurarYRedibujarCanvas(strokesRef.current);
    const dataUrl = canvas.toDataURL('image/png');
    setFirmaCapturada(dataUrl);
    setErrorValidacion(null);
    return dataUrl;
  };

  const deshacerUltimoTrazo = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    setCantidadTrazos(strokesRef.current.length);
    setFirmaCapturada(null);
    setErrorValidacion(null);
    configurarYRedibujarCanvas(strokesRef.current);
  };

  const limpiarCanvas = () => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    activePointerIdRef.current = null;
    isDrawingRef.current = false;
    setCantidadTrazos(0);
    setEsRubricaAutomatica(false);
    setFirmaCapturada(null);
    setErrorValidacion(null);
    configurarYRedibujarCanvas([]);
  };

  const generarRubricaAutomatica = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    canvas.width = Math.round(LOGICAL_CANVAS_WIDTH * dpr);
    canvas.height = Math.round(LOGICAL_CANVAS_HEIGHT * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    strokesRef.current = [];
    currentStrokeRef.current = [];
    activePointerIdRef.current = null;
    isDrawingRef.current = false;
    setCantidadTrazos(0);
    setEsRubricaAutomatica(true);
    setErrorValidacion(null);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, LOGICAL_CANVAS_WIDTH, LOGICAL_CANVAS_HEIGHT);
    ctx.strokeStyle = '#18235C';
    ctx.fillStyle = '#18235C';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    const texto = (firmaNombre || empleado.nombre || 'Trabajador').trim();

    // Trazo de rúbrica caligráfica
    ctx.beginPath();
    ctx.moveTo(40, 108);
    ctx.bezierCurveTo(110, 32, 190, 128, 270, 52);
    ctx.bezierCurveTo(330, 24, 380, 96, 460, 62);
    ctx.stroke();

    ctx.font = 'italic bold 24px Georgia, serif';
    ctx.fillText(texto.slice(0, 28), 50, 84);
    ctx.restore();

    setFirmaCapturada(canvas.toDataURL('image/png'));
  };

  const handleFirmarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    // Si el colaborador trazó su firma manualmente pero no presionó "Confirmar y Fijar Firma", la capturamos automáticamente aquí
    let firmaFinalUrl = firmaCapturada;
    if (!firmaFinalUrl && strokesRef.current.length > 0) {
      firmaFinalUrl = confirmarFirmaDesdeCanvas();
      if (!firmaFinalUrl) return;
    }

    if (!firmaFinalUrl) {
      setErrorValidacion('Por favor trace su firma en el recuadro interactivo (puede levantar el dedo entre cada letra) y confirme su firma, o use "Generar Rúbrica Caligráfica".');
      return;
    }

    if (!aceptaTerminos) {
      setErrorValidacion('Debe marcar la casilla de aceptación expresa de las veinticinco (25) cláusulas contractuales.');
      return;
    }

    setGuardando(true);

    try {
      const fechaHoy = new Date().toISOString();
      const codContrato = normalizarCodigoContratoLaboral(contrato?.codigoContrato);

      // Generar sello criptográfico SHA-256 (Ley 527 de 1999)
      const cadenaFirma = `${codContrato}|${empleado.documento}|${contrato?.salarioBasico || empleado.salarioBase}|${fechaHoy}|${firmaDocumento}`;
      const hash = await generarHashSha256(cadenaFirma);

      // Notificación automática al Administrador de Gestión Humana
      const notifGH = generarTextoNotificacionContratoFirmado({
        candidatoNombre: empleado.nombre,
        candidatoDocumento: empleado.documento,
        codigoContrato: codContrato,
        hashSha256: hash
      });

      const nuevaNotificacion: NotificacionVinculacion = {
        id: uid(),
        fecha: fechaHoy,
        destinatario: 'administrador_gh',
        destinatarioNombre: 'Dirección de Gestión Humana',
        destinatarioEmail: 'gestionhumana@bgroup.com.co',
        tipo: 'contrato_firmado',
        asunto: notifGH.asunto,
        mensaje: notifGH.cuerpo,
        leido: false,
        canal: 'Portal'
      };

      // Despachar correo institucional a GH
      await despacharNotificacionVinculacion({
        destinatarioEmail: 'gestionhumana@bgroup.com.co',
        destinatarioNombre: 'Dirección de Gestión Humana',
        asunto: notifGH.asunto,
        cuerpo: notifGH.cuerpo,
        tipo: 'contrato_firmado'
      });

      // Registrar en el verificador de autenticidad digital (no bloqueante)
      registrarCertificadoEmitido({
        codigoVerificacion: codContrato,
        tipoDocumento: 'Contrato Laboral',
        titularNombre: firmaNombre.trim() || empleado.nombre,
        titularDocumento: firmaDocumento.trim() || empleado.documento,
        titularCargo: cargoTit,
        fechaEmision: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
        fechaRegistroISO: fechaHoy,
        emisorRazonSocial: nombreEmp,
        emisorNit: nitEmp,
        firmanteNombre: repLegalNombre,
        firmanteCargo: 'Representante Legal',
        hashIntegridad: hash,
        estado: 'VIGENTE_AUTENTICO'
      }).catch(() => {});

      // Documento del expediente (el PDF legal completo se genera dinámicamente con las 25 cláusulas)
      const nuevoDocExpediente: DocumentoExpedienteEmpleado = {
        id: uid(),
        tipoDocumento: 'Contrato Laboral',
        nombreArchivo: `Contrato_Termino_Fijo_${codContrato}_${empleado.documento}.pdf`,
        fechaCarga: fechaHoy.slice(0, 10),
        fechaExpedicion: fechaHoy.slice(0, 10),
        usuarioCarga: 'Firma Digital Ley 527/1999',
        urlArchivo: '#',
        observaciones: `Suscrito digitalmente por ${empleado.nombre}. Sello SHA-256: ${hash.slice(0, 16)}...`,
        estado: 'Vigente'
      };

      const contratoActualizado: any = {
        ...(contrato || {}),
        codigoContrato: codContrato,
        firmaCandidatoUrl: firmaFinalUrl,
        firmaCandidatoNombre: firmaNombre.trim(),
        firmaCandidatoDocumento: firmaDocumento.trim(),
        firmaFechaHora: fechaHoy,
        hashSha256: hash,
        estado: 'Firmado'
      };

      const empleadoActualizado: Empleado = {
        ...empleado,
        documentos: [nuevoDocExpediente, ...(empleado.documentos || [])],
        vinculacion: {
          ...(empleado.vinculacion || {
            fechaRegistroCandidato: fechaHoy,
            notificaciones: []
          }),
          etapaActual: 'contrato_firmado',
          fechaContratoFirmado: fechaHoy,
          contratoDigital: contratoActualizado,
          notificaciones: [nuevaNotificacion, ...(empleado.vinculacion?.notificaciones || [])]
        },
        historialLaboral: [
          {
            id: uid(),
            fechaHora: fechaHoy,
            usuario: esVistaCandidato ? 'Colaborador (Firma Digital)' : 'Administrador GH / Ventanilla',
            accion: 'CAMBIO_CONTRATO',
            titulo: 'Contrato Individual de Trabajo a Término Fijo Firmado Digitalmente',
            motivo: `Suscripción formal de 25 cláusulas bajo Ley 527 de 1999 y Ley 2466 de 2025. Radicado: ${codContrato}. SHA-256: ${hash.slice(0, 16)}...`,
            valorNuevo: 'Estado: Contrato Firmado. Pendiente formalización final en expediente.'
          },
          ...(empleado.historialLaboral || [])
        ]
      };

      await onContratoFirmado(empleadoActualizado);
      onClose();
    } catch (err: any) {
      console.error('Error al firmar contrato:', err);
      setErrorValidacion(err?.message || 'Error al procesar la firma digital.');
    } finally {
      setGuardando(false);
    }
  };

  // Parámetros y datos dinámicos del contrato
  const nombreEmp = empresa?.razonSocial || 'B GROUP INGENIERÍA S.A.S.';
  const nitEmp = empresa?.nit ? `NIT ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : 'NIT 900.995.955-2';
  const domicilioEmp = empresa?.contacto?.direccion || 'Urbanización Villa Rubia, Manzana F, Lote 4';
  const ciudadEmp = empresa?.contacto?.ciudad || 'Cartagena de Indias';
  const repLegalNombre = empresa?.representanteLegal?.nombre || 'HERNAN RIQUELME BORJA BENITEZ';
  const repLegalDoc = empresa?.representanteLegal?.numeroDocumento || '73.008.881';

  const cargoTit = (contrato?.cargoNombre || empleado.laboral?.cargoNombre || 'TÉCNICO DE SOPORTE E INSTALACIONES').toUpperCase();
  const areaTit = contrato?.areaNombre || 'Operaciones';
  const salarioVal = contrato?.salarioBasico || empleado.salarioBase || 1423500;
  const codigoContrato = normalizarCodigoContratoLaboral(contrato?.codigoContrato);

  const fechaInicioRaw = contrato?.fechaInicio || new Date().toISOString().slice(0, 10);
  const duracionMeses = contrato?.duracionMeses || 6;
  
  // Calcular fecha de fin si no viene
  const fechaFinRaw = contrato?.fechaFin || (() => {
    const f = new Date(fechaInicioRaw);
    f.setMonth(f.getMonth() + duracionMeses);
    f.setDate(f.getDate() - 1);
    return f.toISOString().slice(0, 10);
  })();

  const fechaFirmaInfo = formatFechaEspanolFormal(fechaInicioRaw);
  const fechaInicioInfo = formatFechaEspanolFormal(fechaInicioRaw);
  const fechaFinInfo = formatFechaEspanolFormal(fechaFinRaw);

  const duracionTexto = duracionMeses === 6 ? 'SEIS (6) MESES' : duracionMeses === 12 ? 'DOCE (12) MESES' : `${duracionMeses} MESES`;
  const periodoPruebaDias = contrato?.periodoPruebaDias || 30;
  const periodoPruebaTexto = periodoPruebaDias === 30 ? 'TREINTA (30) DÍAS CALENDARIO' : `${periodoPruebaDias} DÍAS CALENDARIO`;

  const celularCandidato = empleado.contacto?.celular || '301 783 21 58';
  const correoCandidato = empleado.contacto?.correoPersonal || empleado.contacto?.correoCorporativo || empleado.email || 'candidato@bgroup.com.co';
  const direccionCandidato = empleado.contacto?.direccion || 'Cartagena de Indias';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto modal-imprimible-activo print:static print:inset-auto print:block print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-3 max-h-[96vh] flex flex-col animate-fadeIn modal-imprimible-contenedor print:max-h-none print:h-auto print:overflow-visible print:block print:rounded-none print:border-0 print:shadow-none print:my-0 print:max-w-full">
        {/* Cabecera del Modal (oculta en impresión) */}
        <div className="bg-[#18235C] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-white/10 print:hidden no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#8FA7D6] border border-white/15 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Contrato Individual de Trabajo a Término Fijo & Firma Digital
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Ley 527 de 1999 · CST · Ley 2466 de 2025
                </span>
              </div>
              <p className="text-xs text-[#8FA7D6] font-mono mt-0.5">
                Radicado: <strong className="text-white">{codigoContrato}</strong> · Colaborador: <strong className="text-white">{empleado.nombre}</strong> (C.C. {empleado.documento})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={descargandoPdf}
              onClick={handleDescargarPdf}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              title="Descargar contrato completo en PDF (formato carta legal)"
            >
              {descargandoPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#8FA7D6]" />
              ) : (
                <Download className="w-4 h-4 text-[#8FA7D6]" />
              )}
              <span className="hidden sm:inline">
                {descargandoPdf ? 'Generando PDF...' : 'Descargar PDF'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleImprimirContrato}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Imprimir o guardar como PDF desde el navegador"
            >
              <Printer className="w-4 h-4 text-[#8FA7D6]" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con fondo de escritorio editorial en pantalla y limpio en impresión */}
        <div className="p-4 sm:p-7 overflow-y-auto space-y-6 text-slate-900 leading-relaxed font-sans flex-1 bg-slate-100/80 modal-imprimible-scroll print:overflow-visible print:h-auto print:max-h-none print:p-0 print:block print:bg-white">
          {errorValidacion && (
            <div className="max-w-[840px] mx-auto p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 print:hidden no-print">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Banner de Descarga / Impresión Previa a la Firma (oculto en impresión) */}
          {!contrato?.firmaFechaHora && !firmaCapturada && (
            <div className="max-w-[840px] mx-auto p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs print:hidden no-print">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-sky-700 shrink-0" />
                <span>
                  Puedes descargar una copia oficial en PDF o imprimir este contrato con las <strong>25 cláusulas</strong> y la <strong>Ficha de Condiciones Particulares</strong> antes de firmar.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleImprimirContrato}
                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 hover:bg-sky-100 text-[#18235C] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  disabled={descargandoPdf}
                  onClick={handleDescargarPdf}
                  className="px-3 py-1.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {descargandoPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* ÁREA EXCLUSIVA DE IMPRESIÓN Y EXPORTACIÓN A PDF (HOJA LEGAL COMPLETA) */}
          <div
            id="area-impresion-contrato-laboral"
            data-tipo-documento="contrato"
            className="documento-imprimible hoja-impresion-cst margen-personalizado-cst tipo-contrato max-w-[840px] mx-auto bg-white border border-slate-200/90 shadow-md rounded-2xl p-6 sm:p-10 space-y-6 print:max-w-full print:border-0 print:shadow-none print:rounded-none print:p-0"
          >
            {/* Encabezado Formal del Contrato según Modelo de la Empresa */}
            <div className="border-2 border-[#18235C] rounded-2xl p-5 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 evitar-salto">
              <div className="flex items-center gap-3">
                <CorporateLogo
                  logoUrl={empresa?.identidadVisual?.logoUrl}
                  nombreComercial={empresa?.nombreComercial}
                  size="md"
                  imageClassName="max-h-12 w-auto"
                />
                <div>
                  <h4 className="font-black text-sm uppercase text-[#18235C] tracking-wide">
                    {nombreEmp} | CONEXIONES DE VIDA
                  </h4>
                  <p className="text-[11px] font-mono text-slate-700 font-semibold">{nitEmp} · Dirección de Gestión Humana</p>
                  <p className="text-[11px] text-slate-600">{domicilioEmp}, {ciudadEmp}</p>
                  <span
                    className={`inline-block mt-1.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                      firmaCapturada || contrato?.firmaFechaHora
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {firmaCapturada || contrato?.firmaFechaHora
                      ? 'DOCUMENTO SUSCRITO DIGITALMENTE · LEY 527 DE 1999'
                      : 'BORRADOR PREVIO A SUSCRIPCIÓN DIGITAL'}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono bg-white p-3.5 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
                <span className="text-[11px] font-black uppercase text-[#18235C] block tracking-wide">
                  CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO FIJO
                </span>
                <span className="text-sm font-black text-indigo-700 block mt-0.5">{codigoContrato}</span>
                <span className="text-[10px] text-slate-600 block font-sans">
                  Vínculo: <strong>Término Fijo ({duracionTexto})</strong>
                </span>
              </div>
            </div>

            {/* FICHA DE CONDICIONES PARTICULARES */}
            <div className="border border-[#18235C]/30 rounded-2xl overflow-hidden shadow-2xs">
              <div className="bg-[#18235C] text-white px-4 py-2.5 font-black text-xs uppercase tracking-wider flex items-center justify-between evitar-salto">
                <span>FICHA DE CONDICIONES PARTICULARES</span>
                <span className="text-[10px] font-mono text-[#8FA7D6] font-normal">CST Arts. 37, 39 y 46</span>
              </div>

              <div className="divide-y divide-slate-200 bg-white text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                  <span className="font-bold text-slate-600 sm:col-span-1">Ciudad y fecha de firma:</span>
                  <span className="font-semibold text-slate-900 sm:col-span-2">
                    {ciudadEmp.toUpperCase()}, {fechaFirmaInfo.mayusculas}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                  <span className="font-bold text-slate-600 sm:col-span-1">Empleador:</span>
                  <span className="font-semibold text-slate-900 sm:col-span-2">
                    {nombreEmp} — {nitEmp}
                  </span>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Domicilio del empleador:</span>
                <span className="font-semibold text-slate-900 sm:col-span-2">
                  {domicilioEmp}, {ciudadEmp}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Representante legal:</span>
                <span className="font-semibold text-slate-900 sm:col-span-2">
                  {repLegalNombre} — C.C. {repLegalDoc}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto bg-indigo-50/30">
                <span className="font-bold text-[#18235C] sm:col-span-1">Persona trabajadora:</span>
                <span className="font-black text-[#18235C] sm:col-span-2">
                  {empleado.nombre.toUpperCase()} — {empleado.tipoDocumento || 'C.C.'} {empleado.documento}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Datos de contacto:</span>
                <span className="text-slate-800 sm:col-span-2">
                  Celular: <strong>{celularCandidato}</strong> | Correo: <strong>{correoCandidato}</strong> | Dirección: {direccionCandidato}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Cargo:</span>
                <span className="font-black text-[#18235C] sm:col-span-2">
                  {cargoTit}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Área y jefe inmediato:</span>
                <span className="font-semibold text-slate-900 sm:col-span-2">
                  {areaTit} — Supervisor de Operaciones o persona formalmente designada
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Lugar y modalidad:</span>
                <span className="text-slate-800 sm:col-span-2">
                  Presencial y trabajo de campo: sede, nodos, infraestructura de red y domicilios de usuarios dentro del área de operación asignada.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Fecha de inicio:</span>
                <span className="font-bold text-emerald-800 sm:col-span-2 font-mono">
                  {fechaInicioInfo.mayusculas}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Fecha de terminación:</span>
                <span className="font-bold text-rose-800 sm:col-span-2 font-mono">
                  {fechaFinInfo.mayusculas}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Duración inicial:</span>
                <span className="font-black text-[#18235C] sm:col-span-2">
                  {duracionTexto}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto bg-emerald-50/40">
                <span className="font-bold text-emerald-900 sm:col-span-1">Salario ordinario:</span>
                <span className="font-black text-emerald-900 sm:col-span-2 font-mono">
                  ${salarioVal.toLocaleString('es-CO')} COP / mes (o valor legal aplicable actualizado conforme al SMLMV en cada período).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Auxilio de transporte:</span>
                <span className="text-slate-800 sm:col-span-2">
                  Se reconocerá cuando se cumplan los requisitos legales, en la cuantía vigente y proporcional al tiempo causado (Ley 15 de 1959).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Periodicidad y medio de pago:</span>
                <span className="text-slate-800 sm:col-span-2">
                  Quincenal: los días 15 y el último día calendario de cada mes, mediante transferencia bancaria a la cuenta designada por la persona trabajadora o medio legal acordado.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Jornada ordinaria:</span>
                <span className="text-slate-800 sm:col-span-2">
                  42 horas efectivas semanales (Ley 2101 de 2021). Lunes a viernes: 08:20 a 17:00. Sábados: 08:00 a 11:40. Descanso semanal: domingo.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Pausa de alimentación:</span>
                <span className="text-slate-800 sm:col-span-2">
                  Una (1) hora de lunes a viernes, entre las 12:00 y las 13:00 (o la franja programada según la orden de trabajo).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-1 sm:gap-4 evitar-salto">
                <span className="font-bold text-slate-600 sm:col-span-1">Período de prueba:</span>
                <span className="font-bold text-indigo-900 sm:col-span-2">
                  {periodoPruebaTexto}, pactados expresamente por escrito en este contrato conforme a los artículos 76 a 80 del CST.
                </span>
              </div>
            </div>
          </div>

          {/* Preámbulo: PARTES Y ACUERDO */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 text-[12.5px] text-slate-800 space-y-2 evitar-salto">
            <h5 className="font-black text-xs uppercase text-[#18235C] tracking-wide">
              PARTES Y ACUERDO
            </h5>
            <p className="text-justify leading-[1.65]">
              Entre <strong>{nombreEmp}</strong>, identificada en la ficha de condiciones particulares, representada legalmente por quien allí aparece, quien en adelante se denominará <strong>EL EMPLEADOR</strong>, y la persona identificada en la misma ficha, quien en adelante se denominará <strong>LA PERSONA TRABAJADORA</strong>, se celebra el presente contrato individual de trabajo a término fijo. La relación se regirá por la Constitución Política, el Código Sustantivo del Trabajo (CST), la Ley 50 de 1990, la Ley 2101 de 2021, la Ley 2466 de 2025 y las demás normas que las modifiquen, adicionen o reglamenten, de acuerdo con las siguientes cláusulas:
            </p>
          </div>

          {/* EL ARTICULADO COMPLETO DEL MODELO DE CONTRATO (25 CLÁUSULAS VERBATIM) */}
          <div className="space-y-4 text-[12.5px] text-slate-800 leading-[1.65] p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 print:border-0 print:p-0 print:space-y-3">
            <div className="pt-2 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">PRIMERA. NATURALEZA Y OBJETO.</strong> LA PERSONA TRABAJADORA se obliga a prestar personalmente sus servicios a EL EMPLEADOR en el cargo de <strong>{cargoTit}</strong>, a cambio de la remuneración pactada. La prestación se desarrollará bajo la continuada subordinación de EL EMPLEADOR, quien podrá impartir instrucciones razonables sobre el modo, tiempo y cantidad de trabajo, dentro de los límites legales, contractuales, técnicos y de seguridad, y con respeto por la dignidad y los derechos fundamentales de LA PERSONA TRABAJADORA.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">SEGUNDA. CARGO, FUNCIONES Y MANUAL.</strong> El cargo pertenece al área de <strong>{areaTit}</strong> y tendrá como superior inmediato al Supervisor de Operaciones o a la persona que EL EMPLEADOR designe formalmente. El propósito, las funciones técnicas, las responsabilidades, los resultados esperados, las relaciones, los límites de autoridad y los requisitos del cargo se desarrollan en el <em>Anexo 1 — Manual de Funciones del {cargoTit}</em>, versión 1.0 del 28 de octubre de 2026, que se incorpora a este contrato y se entrega a LA PERSONA TRABAJADORA.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">TERCERA. FUNCIONES CONEXAS Y LÍMITES.</strong> EL EMPLEADOR podrá asignar actividades complementarias que guarden relación razonable y directa con el cargo, las competencias y la operación, siempre que no impliquen desmejora ilegal, modificación unilateral de elementos esenciales del contrato ni exposición a riesgos sin controles, formación o autorización. No podrán asignarse funciones que excedan la competencia técnica, las certificaciones o las autorizaciones de LA PERSONA TRABAJADORA. Las tareas conexas no habilitan para comprometer compras, autorizar gastos, ofrecer descuentos o compensaciones, modificar contratos de usuarios ni intervenir infraestructura crítica o bienes de terceros sin autorización y permisos.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">CUARTA. LUGAR, MODALIDAD Y DESPLAZAMIENTOS.</strong> La modalidad será presencial, con trabajo de campo en la sede, nodos, infraestructura de red y domicilios de usuarios ubicados dentro del área de operación de EL EMPLEADOR. La programación y las órdenes de trabajo identificarán el sitio de cada intervención. Los cambios razonables de lugar se sujetarán al poder subordinante y al ius variandi, deberán responder a necesidades objetivas del servicio y no podrán afectar ilegítimamente la dignidad, la salud, la remuneración ni las condiciones esenciales de LA PERSONA TRABAJADORA. Los desplazamientos operativos ordenados por EL EMPLEADOR y los gastos necesarios para su ejecución serán suministrados o reembolsados de acuerdo con el procedimiento interno. No se entenderá pactada la obligación de utilizar vehículo o herramientas personales; su eventual uso requerirá acuerdo previo y escrito sobre condiciones, autorización y reconocimiento de gastos.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">QUINTA. DURACIÓN.</strong> El presente contrato se celebra a término fijo por <strong>{duracionTexto}</strong>, con fecha de inicio el <strong>{fechaInicioInfo.formalLarga}</strong> y fecha de terminación el <strong>{fechaFinInfo.formalLarga}</strong>, ambas fechas inclusive. La duración y las fechas quedan expresamente determinadas por escrito, de conformidad con el artículo 46 del CST, modificado por el artículo 6 de la Ley 2466 de 2025. La expiración del plazo se aplicará sin desconocer fueros, estabilidad laboral reforzada, autorizaciones administrativas o judiciales previas exigibles ni otras garantías constitucionales y legales.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">SEXTA. PRÓRROGAS Y PREAVISO DE NO RENOVACIÓN.</strong> Las partes podrán acordar por escrito la prórroga del contrato. Cuando ninguna de las partes comunique por escrito a la otra su intención de terminarlo con una antelación mínima de treinta (30) días calendario al vencimiento del plazo inicial o de su prórroga, operará la renovación automática en los términos del artículo 46 del CST. Por tratarse de un contrato inicial inferior a un (1) año, la cuarta prórroga automática será por un período de un (1) año. En las prórrogas pactadas por escrito, después de la cuarta prórroga el período no podrá ser inferior a un (1) año. En todo caso, se observará el límite máximo legal de cuatro (4) años. La comunicación de no renovación deberá enviarse por un medio que permita acreditar su contenido, envío y recepción.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">SÉPTIMA. PERÍODO DE PRUEBA.</strong> Las partes pactan expresamente un período de prueba de <strong>{periodoPruebaTexto}</strong>, contado desde el inicio efectivo de labores. Este término es inferior a la quinta parte de la duración inicial del contrato y no excede los máximos previstos en los artículos 76 a 80 del CST. Durante el período de prueba cualquiera de las partes podrá dar por terminado el contrato en los términos de la ley, sin perjuicio de la prohibición de discriminación y del respeto de las protecciones constitucionales aplicables. No podrá pactarse un nuevo período de prueba en contratos sucesivos entre las mismas partes, salvo la excepción legal correspondiente al primer contrato.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">OCTAVA. SALARIO Y FORMA DE PAGO.</strong> EL EMPLEADOR pagará a LA PERSONA TRABAJADORA un salario ordinario mensual equivalente a <strong>${salarioVal.toLocaleString('es-CO')} COP</strong> (o el equivalente legal vigente al SMLMV en cada período de causación). El pago se realizará por quincenas, en las fechas indicadas en la ficha, con entrega del comprobante correspondiente. Si la fecha de pago coincide con un día no hábil bancario, se realizará el día hábil inmediatamente anterior. El salario remunera la jornada ordinaria pactada y no comprende ni sustituye el auxilio de transporte, las prestaciones sociales, las vacaciones, los recargos ni los demás conceptos que deban reconocerse separadamente. Todo ajuste legal del SMLMV se reflejará automáticamente en el salario.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">NOVENA. AUXILIO DE TRANSPORTE Y OTROS PAGOS.</strong> EL EMPLEADOR reconocerá el auxilio legal de transporte o el mecanismo que lo sustituya cuando LA PERSONA TRABAJADORA reúna las condiciones legales para recibirlo, en la cuantía vigente y proporcional a los días en que se cause. Su naturaleza salarial o no salarial será la que determine la ley. Los pagos destinados a reembolsar gastos o a facilitar el desempeño de la labor solo tendrán naturaleza no salarial cuando correspondan realmente a esa finalidad y cumplan los requisitos legales; la denominación asignada por las partes no podrá alterar su naturaleza jurídica.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">DÉCIMA. PRESTACIONES, VACACIONES Y DOTACIÓN.</strong> EL EMPLEADOR reconocerá y pagará oportunamente las prestaciones sociales y demás derechos laborales causados, incluidos cesantías, intereses a las cesantías, prima de servicios, vacaciones remuneradas y los conceptos que legalmente correspondan, en proporción al tiempo laborado cuando así proceda. Suministrará la dotación legal cuando se cumplan los requisitos previstos en el CST y entregará, sin costo para LA PERSONA TRABAJADORA, los elementos de protección personal y demás equipos exigidos por los riesgos y las tareas asignadas. A la terminación del contrato se liquidarán los salarios, prestaciones, vacaciones y demás acreencias causadas.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">DÉCIMA PRIMERA. JORNADA, HORARIO Y DESCANSOS.</strong> La jornada ordinaria será de <strong>cuarenta y dos (42) horas efectivas semanales</strong>, distribuida de lunes a viernes de 08:20 a 17:00 y los sábados de 08:00 a 11:40. Para que esta distribución corresponda a cuarenta y dos (42) horas efectivas, se pacta una pausa de alimentación de una (1) hora cada día de lunes a viernes, en la franja acordada en la ficha. Esa pausa no se computará como tiempo de trabajo únicamente cuando constituya una interrupción real, durante la cual LA PERSONA TRABAJADORA pueda disponer libremente de su tiempo y no permanezca a disposición de EL EMPLEADOR. Si debe atender labores, permanecer a disposición o no puede disfrutar libremente de la pausa, el tiempo se computará conforme a la ley. El día de descanso obligatorio será el domingo. Cualquier modificación del horario deberá respetar el máximo legal, los descansos y los derechos adquiridos.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">DÉCIMA SEGUNDA. TRABAJO SUPLEMENTARIO, NOCTURNO, DOMINICAL Y FESTIVO.</strong> El trabajo suplementario o de horas extras, el trabajo nocturno y el laborado en días de descanso obligatorio o festivos se reconocerán con los recargos, descansos compensatorios, reglas de causación y porcentajes vigentes en la fecha en que se preste el servicio. A la fecha de firma, el período nocturno comprende de 7:00 p. m. a 6:00 a. m. El recargo legal por laborar en el día de descanso obligatorio o festivo se encuentra en el 90 % desde el 1 de julio de 2026 y llegará al 100 % desde el 1 de julio de 2027, salvo adopción anticipada del 100 % por EL EMPLEADOR. Las horas extras no podrán exceder de dos (2) diarias ni doce (12) semanales. EL EMPLEADOR llevará el registro legal del trabajo suplementario, con identificación de la actividad y de las horas diurnas o nocturnas, y suministrará la relación y el soporte de pago cuando sean solicitados. El procedimiento interno de autorización y registro no elimina el derecho al pago del tiempo efectivamente laborado cuando haya sido requerido, conocido o recibido por EL EMPLEADOR.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <strong className="text-[#18235C] font-black block mb-1">DÉCIMA TERCERA. OBLIGACIONES ESPECIALES DEL EMPLEADOR.</strong>
              <span className="block mb-1.5">Además de las obligaciones legales, EL EMPLEADOR deberá:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pagar oportunamente el salario, prestaciones, vacaciones, auxilios, recargos y demás conceptos debidos, y entregar los comprobantes correspondientes.</li>
                <li>Afiliar a LA PERSONA TRABAJADORA al Sistema de Seguridad Social Integral y efectuar los aportes a salud, pensión, riesgos laborales y caja de compensación familiar, según corresponda, desde el inicio de la relación.</li>
                <li>Suministrar herramientas, equipos, materiales, elementos de protección personal, formación, permisos y procedimientos necesarios para ejecutar las labores de forma segura.</li>
                <li>Identificar, evaluar y controlar los peligros y riesgos asociados al cargo y a cada sitio de trabajo, y cumplir las obligaciones del SG-SST.</li>
                <li>Respetar la dignidad, intimidad, igualdad, libertad de asociación, desconexión y demás derechos de LA PERSONA TRABAJADORA, así como prevenir el acoso, la discriminación y la violencia en el trabajo.</li>
                <li>Reconocer los gastos operativos autorizados y entregar copia de este contrato y de sus anexos.</li>
              </ul>
            </div>

            <div className="pt-3 evitar-salto">
              <strong className="text-[#18235C] font-black block mb-1">DÉCIMA CUARTA. OBLIGACIONES DE LA PERSONA TRABAJADORA.</strong>
              <span className="block mb-1.5">LA PERSONA TRABAJADORA se obliga, además de lo previsto en la ley y en el Anexo 1, a:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>Prestar personalmente el servicio con diligencia, buena fe, cuidado técnico y cumplimiento de las órdenes de trabajo y de las instrucciones legítimas de sus superiores.</li>
                <li>Atender a usuarios, compañeros y terceros con respeto; informar con claridad el alcance de las intervenciones y abstenerse de prometer compensaciones, descuentos, cambios contractuales o plazos no autorizados.</li>
                <li>Registrar de manera veraz y oportuna diagnósticos, pruebas, materiales, repuestos, tiempos, evidencias permitidas, novedades y cierre de tickets u órdenes.</li>
                <li>Proteger equipos, herramientas, materiales, instrumentos, EPP, credenciales y demás activos entregados; reportar de inmediato pérdidas, daños, faltantes o accesos no autorizados.</li>
                <li>Cumplir los protocolos de seguridad de la información y protección de datos; acceder únicamente a la información necesaria para las órdenes asignadas y no compartir credenciales.</li>
                <li>Asistir a las capacitaciones y evaluaciones aplicables, utilizar los EPP suministrados, reportar peligros, incidentes y accidentes, y abstenerse de ejecutar actividades para las que no cuente con competencia, autorización o condiciones seguras.</li>
                <li>Informar oportunamente cambios en sus datos de contacto, incapacidades, novedades y cualquier circunstancia relevante para la programación y seguridad del trabajo.</li>
              </ul>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">DÉCIMA QUINTA. SEGURIDAD Y SALUD EN EL TRABAJO.</strong> Las partes cumplirán las obligaciones que les correspondan conforme al Decreto 1072 de 2015, al SG-SST y a las demás normas aplicables. Por la naturaleza operativa y de campo del cargo, ninguna tarea en alturas, postes, cubiertas, zonas de tránsito, instalaciones eléctricas o equipos energizados podrá ejecutarse sin evaluación de riesgos, capacitación, aptitud, autorización, permisos, herramientas, EPP y controles exigibles para la actividad concreta. Cuando se configure trabajo en alturas, se aplicará la Resolución 4272 de 2021 y el programa de prevención y protección contra caídas de EL EMPLEADOR. LA PERSONA TRABAJADORA podrá abstenerse de iniciar o continuar una tarea ante peligro grave o inminente, falta de autorización, formación, equipo o condiciones seguras, y deberá reportarlo inmediatamente por los canales definidos, sin que ello constituya incumplimiento cuando la abstención esté justificada.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">DÉCIMA SEXTA. HERRAMIENTAS, ACTIVOS Y DESCUENTOS.</strong> Los equipos, herramientas, instrumentos, materiales, credenciales y elementos suministrados por EL EMPLEADOR serán utilizados exclusivamente para fines laborales autorizados y deberán conservarse con diligencia y devolverse cuando sean requeridos o al terminar el vínculo. LA PERSONA TRABAJADORA reportará daños, pérdidas o faltantes y colaborará con las verificaciones correspondientes. No habrá descuentos automáticos del salario o de las prestaciones por daños, pérdidas, herramientas faltantes, multas o supuestos perjuicios. Cualquier descuento solo procederá en los eventos y bajo los requisitos estrictos previstos en la ley, sin trasladar al trabajador los riesgos ordinarios de la actividad empresarial.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">DÉCIMA SÉPTIMA. PROTECCIÓN DE DATOS PERSONALES.</strong> Las partes cumplirán la Ley 1581 de 2012, sus decretos reglamentarios y las políticas aplicables. En el desarrollo de sus funciones, LA PERSONA TRABAJADORA solo podrá consultar, recolectar, utilizar, registrar o comunicar datos personales de usuarios, empleados o terceros para finalidades laborales autorizadas, por medio de herramientas y canales aprobados. Se prohíbe copiar bases de datos, documentos de identidad, fotografías, credenciales o listados de clientes en dispositivos, cuentas o canales personales no autorizados. Las fotografías de intervenciones deberán limitarse a lo necesario para la orden de trabajo, evitando captar personas o documentos de forma innecesaria. EL EMPLEADOR tratará los datos personales de LA PERSONA TRABAJADORA con fundamento jurídico, finalidad informada y medidas de seguridad adecuadas; las autorizaciones separadas que sean legalmente necesarias se gestionarán por documento independiente.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">DÉCIMA OCTAVA. CONFIDENCIALIDAD E INFORMACIÓN EMPRESARIAL.</strong> LA PERSONA TRABAJADORA guardará reserva sobre la información no pública de naturaleza técnica, operativa, comercial, financiera, contractual, de seguridad o de clientes a la que acceda por razón del cargo, incluidas topologías, configuraciones, direcciones, claves, credenciales, inventarios, procedimientos y reportes. No podrá divulgarla, copiarla, explotarla ni utilizarla para fines propios o de terceros sin autorización. Esta obligación continuará después de terminado el contrato mientras la información conserve su carácter reservado o la ley exija su protección. No comprende información pública, conocida legítimamente sin deber de reserva, ni limita el ejercicio de derechos laborales, la denuncia de conductas ilegales o la colaboración con autoridades competentes.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">DÉCIMA NOVENA. CONFLICTOS DE INTERÉS Y ACTIVIDADES EXTERNAS.</strong> Este contrato no establece exclusividad general ni prohíbe otras actividades lícitas fuera de la jornada. LA PERSONA TRABAJADORA no podrá utilizar tiempo de trabajo, recursos, información confidencial, credenciales o relaciones de clientes de EL EMPLEADOR para actividades particulares o de terceros, ni realizar actuaciones que impliquen competencia desleal, desvío indebido de usuarios, conflicto concreto de intereses o incumplimiento de sus obligaciones. Deberá informar oportunamente los conflictos reales o potenciales que puedan afectar la imparcialidad, seguridad o cumplimiento de sus funciones.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">VIGÉSIMA. REGLAMENTO, POLÍTICAS Y MEDIDAS DISCIPLINARIAS.</strong> LA PERSONA TRABAJADORA cumplirá el Reglamento Interno de Trabajo, cuando sea legalmente exigible o se encuentre válidamente adoptado, así como las políticas y procedimientos que le hayan sido debidamente comunicados, siempre que no desconozcan la ley ni este contrato. La imposición de sanciones observará el artículo 115 del CST, modificado por el artículo 7 de la Ley 2466 de 2025. Cuando EL EMPLEADOR no esté cobijado por la excepción del parágrafo 6 de dicho artículo, aplicará el procedimiento legal general, que comprende comunicación formal de apertura, descripción escrita de los hechos, traslado de las pruebas, oportunidad de defensa y contradicción por un término no inferior a cinco (5) días, decisión motivada, proporcionalidad de la eventual sanción y posibilidad de impugnación. Si EL EMPLEADOR acredita estar comprendido en la excepción legal para micro y pequeñas empresas de menos de diez (10) trabajadores, se escuchará previamente a LA PERSONA TRABAJADORA sobre los hechos imputados y se respetarán en todo caso sus garantías de defensa y debido proceso. Cuando corresponda, se brindarán los ajustes razonables y el acompañamiento sindical previstos en la ley. No podrán imponerse sanciones no previstas en la ley, el reglamento, pacto, convención, laudo o contrato, según corresponda.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">VIGÉSIMA PRIMERA. TERMINACIÓN E INDEMNIZACIONES.</strong> El contrato terminará por vencimiento válido del plazo con observancia del preaviso legal, mutuo acuerdo, justa causa acreditada, decisión unilateral en los casos permitidos por la ley o cualquier otra causal legal. La terminación deberá respetar los fueros, la estabilidad laboral reforzada, las prohibiciones de discriminación y las autorizaciones previas que resulten exigibles. La terminación unilateral sin justa causa dará lugar a la indemnización que corresponda conforme al artículo 64 del CST y a las demás consecuencias legales. En todos los casos EL EMPLEADOR pagará los salarios, prestaciones, vacaciones, recargos y demás conceptos causados hasta la fecha de terminación.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">VIGÉSIMA SEGUNDA. MODIFICACIONES Y ANEXOS.</strong> Cualquier modificación de las condiciones esenciales del contrato deberá constar por escrito y contar con el acuerdo de las partes cuando así lo exija la ley. Forman parte integral de este contrato el <em>Anexo 1 — Manual de Funciones del {cargoTit}</em>, versión 1.0 del 28 de octubre de 2026, y el <em>Anexo 2 — Constancia de entrega de documentos y políticas</em>. No se autoriza completar espacios sustanciales en blanco después de la firma. Toda actualización del manual deberá identificarse con versión y fecha, comunicarse y dejar constancia de entrega; no podrá modificar unilateralmente los elementos esenciales del contrato ni reducir derechos.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">VIGÉSIMA TERCERA. PRIMACÍA DE LA REALIDAD Y NO RENUNCIA.</strong> Este contrato se interpretará de acuerdo con la Constitución, la legislación laboral y el principio de primacía de la realidad sobre las formas. Ninguna de sus estipulaciones implica renuncia a derechos ciertos e indiscutibles, salarios, prestaciones, antigüedad real, estabilidad laboral reforzada ni condiciones más favorables válidamente reconocidas. Las cláusulas contrarias a normas laborales imperativas se entenderán sustituidas por las disposiciones legales aplicables.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">VIGÉSIMA CUARTA. NOTIFICACIONES.</strong> Para comunicaciones ordinarias, las partes utilizarán los datos de contacto de la ficha y deberán informar por escrito cualquier cambio. Las comunicaciones que produzcan efectos legales —incluido el preaviso de no renovación— se enviarán por un medio verificable que permita acreditar contenido, fecha de envío y recepción. El uso de correo electrónico o mensajería no releva de cumplir los requisitos legales de notificación ni de conservar el soporte correspondiente.
              </p>
            </div>

            <div className="pt-3 evitar-salto">
              <p className="text-justify">
                <strong className="text-[#18235C] font-black">VIGÉSIMA QUINTA. INTEGRIDAD Y EJEMPLARES.</strong> El presente documento, junto con sus anexos identificados, contiene el acuerdo laboral escrito de las partes respecto de las condiciones aquí reguladas. Se firma en {ciudadEmp}, a los {fechaFirmaInfo.formalLarga}, en dos ejemplares del mismo tenor, uno para cada parte. La firma podrá constar en medio físico o electrónico que permita identificar a las partes y conservar la integridad del documento, conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012.
              </p>
            </div>
          </div>

          {/* CUADRO FORMAL DE FIRMAS DE LAS PARTES */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4 evitar-salto">
            <h5 className="font-black text-xs uppercase text-[#18235C] tracking-wide border-b border-slate-200 pb-2">
              SECCIÓN DE FIRMAS Y RATIFICACIÓN CONTRACTUAL
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* FIRMA EMPLEADOR */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    EL EMPLEADOR:
                  </span>
                  <div className="h-20 border-b border-dashed border-slate-300 flex items-center justify-center relative">
                    {/* Estampado corporativo del empleador */}
                    <div className="text-center font-serif text-[#18235C] italic select-none">
                      <span className="text-sm font-black block tracking-wider">Hernán Riquelme Borja Benítez</span>
                      <span className="text-[9px] font-sans text-slate-400 font-normal">Firma Representante Legal Certificada</span>
                    </div>
                    <div className="absolute top-1 right-2">
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        REGISTRADO
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] space-y-0.5 font-sans">
                  <p className="font-bold text-slate-900">{repLegalNombre}</p>
                  <p className="text-slate-600 font-mono">C.C. {repLegalDoc} de Cartagena</p>
                  <p className="text-indigo-800 font-semibold">{nombreEmp}</p>
                  <p className="text-slate-500 font-mono text-[9px]">{nitEmp}</p>
                </div>
              </div>

              {/* FIRMA PERSONA TRABAJADORA */}
              <div className="bg-white p-4 rounded-xl border border-indigo-200 flex flex-col justify-between space-y-3 shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block tracking-wider">
                    LA PERSONA TRABAJADORA:
                  </span>
                  <div className="h-20 border-b border-dashed border-indigo-300 flex items-center justify-center relative bg-indigo-50/20 rounded-t-lg">
                    {firmaCapturada ? (
                      <img
                        src={firmaCapturada}
                        alt="Firma del trabajador"
                        className="max-h-18 max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400 text-[10px] italic flex flex-col items-center justify-end h-full pb-1">
                        <span className="font-serif text-slate-300 select-none tracking-tighter">_________________________________</span>
                        <span className="text-[9px] text-slate-400 mt-1 font-sans">
                          (Firma Persona Trabajadora · Borrador Previo a Suscripción)
                        </span>
                      </div>
                    )}
                    {contrato?.hashSha256 && (
                      <div className="absolute top-1 right-2">
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          SHA-256 OK
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] space-y-0.5 font-sans">
                  <p className="font-bold text-slate-900">{firmaNombre || empleado.nombre}</p>
                  <p className="text-slate-600 font-mono">
                    {empleado.tipoDocumento || 'C.C.'} {firmaDocumento || empleado.documento}
                  </p>
                  <p className="text-indigo-700 font-semibold">{cargoTit}</p>
                  <p className="text-slate-500 text-[9px] font-mono">
                    {contrato?.firmaFechaHora ? `Suscrito: ${contrato.firmaFechaHora.slice(0, 19).replace('T', ' ')}` : 'Validez electrónica Ley 527 de 1999'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sello QR y Certificado de Integridad incluido dentro del documento legal imprimible */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 evitar-salto">
            <div className="flex items-center gap-3">
              <CodigoQRVerificacion
                codigoVerificacion={codigoContrato}
                tipoDocumento="Contrato Laboral"
                titularNombre={firmaNombre || empleado.nombre}
                titularDocumento={firmaDocumento || empleado.documento}
                hashSha256={contrato?.hashSha256}
                size={68}
              />
              <div className="text-[10.5px] text-slate-700 space-y-0.5">
                <strong className="block text-slate-900 font-bold">Certificado de Firma Electrónica e Integridad Documental:</strong>
                <span>Integridad respaldada conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012. Válido ante el Ministerio del Trabajo de Colombia.</span>
                <span className="block font-mono text-[9.5px] text-slate-600 break-all">
                  {contrato?.hashSha256
                    ? `Sello SHA-256: ${contrato.hashSha256}`
                    : `Radicado: ${codigoContrato} · Sello SHA-256 se genera al suscribir digitalmente.`}
                </span>
              </div>
            </div>
          </div>
        </div> {/* Cierre de #area-impresion-contrato-laboral */}

          {/* Panel Interactivo de Captura de Firma Digital (Ley 527 de 1999) - oculto en impresión */}
          <div className="max-w-[840px] mx-auto p-5 bg-gradient-to-br from-indigo-50/60 to-slate-50 border-2 border-indigo-200 rounded-3xl space-y-3 print:hidden no-print">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/80 pb-2">
              <div className="space-y-0.5">
                <span className="font-black text-[#18235C] text-xs flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-indigo-700" />
                  <span>Panel de Firma Digital del Colaborador (Ley 527 de 1999) *</span>
                </span>
                <p className="text-[11px] text-slate-600">
                  Puede escribir su firma en letra imprenta o cursiva levantando el dedo o cursor entre cada carácter. Cuando termine toda su firma, pulse <strong>Confirmar Firma</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {cantidadTrazos > 0 && (
                  <button
                    type="button"
                    onClick={deshacerUltimoTrazo}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Deshacer trazo ({cantidadTrazos})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={generarRubricaAutomatica}
                  className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Generar Rúbrica</span>
                </button>
                <button
                  type="button"
                  onClick={limpiarCanvas}
                  className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar todo</span>
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-indigo-300 rounded-2xl bg-white overflow-hidden relative shadow-inner">
              {/* Línea guía visual de firma (no se exporta en el PNG) */}
              <div className="absolute inset-x-8 bottom-8 border-b border-slate-200 pointer-events-none" />

              <canvas
                ref={canvasRef}
                onPointerDown={manejarPointerDown}
                onPointerMove={manejarPointerMove}
                onPointerUp={finalizarTrazoIndividual}
                onPointerCancel={finalizarTrazoIndividual}
                onContextMenu={e => e.preventDefault()}
                className="w-full h-44 block cursor-crosshair touch-none select-none relative z-10"
              />

              {cantidadTrazos === 0 && !firmaCapturada && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium px-6 text-center z-0">
                  Trace aquí su firma letra por letra o en trazo continuo con el dedo, lápiz táctil o ratón
                </div>
              )}
            </div>

            {/* Barra de estado del trazo y confirmación explícita */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="text-[11px] flex items-center gap-2">
                {firmaCapturada ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Firma confirmada y aplicada al contrato (puede seguir trazando si desea ajustarla)
                  </span>
                ) : cantidadTrazos > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {cantidadTrazos} {cantidadTrazos === 1 ? 'trazo capturado' : 'trazos capturados'} — continúe escribiendo o pulse Confirmar Firma
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Múltiples trazos habilitados: ideal para firmas en letra imprenta o despegada.
                  </span>
                )}
              </div>

              {cantidadTrazos > 0 && !firmaCapturada && (
                <button
                  type="button"
                  onClick={confirmarFirmaDesdeCanvas}
                  className="px-3.5 py-1.5 rounded-xl bg-[#18235C] hover:bg-[#101740] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar y Fijar Firma</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Nombre Completo del Suscriptor *
                </label>
                <input
                  type="text"
                  required
                  value={firmaNombre}
                  onChange={e => setFirmaNombre(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-[#18235C]/20"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Número de Documento de Identidad *
                </label>
                <input
                  type="text"
                  required
                  value={firmaDocumento}
                  onChange={e => setFirmaDocumento(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-[#18235C]/20"
                />
              </div>
            </div>

            {/* Checkbox de Aceptación Expresa de las 25 Cláusulas */}
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-indigo-200 cursor-pointer text-xs shadow-2xs hover:bg-indigo-50/30 transition-colors">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={e => setAceptaTerminos(e.target.checked)}
                className="mt-0.5 rounded text-[#18235C] w-4 h-4 shrink-0 focus:ring-[#18235C]"
              />
              <span className="text-slate-800 font-semibold leading-relaxed">
                He leído y analizado íntegramente las <strong>veinticinco (25) cláusulas</strong> y la <strong>Ficha de Condiciones Particulares</strong> de este <strong>Contrato Individual de Trabajo a Término Fijo</strong>, manifiesto mi conformidad y estampo mi firma electrónica con plena validez jurídica conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012.
              </span>
            </label>
          </div>

          {/* Barra Inferior de Acciones (oculta en impresión) */}
          <div className="max-w-[840px] mx-auto p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs print:hidden no-print">
            <div className="text-[11px] text-slate-600">
              <strong className="block text-slate-900 font-bold">Opciones del Documento Legal:</strong>
              <span>Puede descargar el PDF vectorial o imprimir el contrato completo antes o después de firmar.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={handleImprimirContrato}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                title="Imprimir contrato completo en formato carta"
              >
                <Printer className="w-4 h-4 text-[#18235C]" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                disabled={descargandoPdf}
                onClick={handleDescargarPdf}
                className="px-4 py-2.5 rounded-xl border border-[#18235C] bg-[#18235C]/5 hover:bg-[#18235C]/15 text-[#18235C] font-black text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="Descargar copia oficial en PDF del contrato antes o después de ser firmado"
              >
                {descargandoPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#18235C]" />
                ) : (
                  <Download className="w-4 h-4 text-[#18235C]" />
                )}
                <span>{descargandoPdf ? 'Generando PDF...' : 'Descargar Contrato (PDF)'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl cursor-pointer text-xs transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={handleFirmarContrato}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{guardando ? 'Suscripción en proceso...' : 'Suscribir Contrato Digital & Notificar a GH'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
