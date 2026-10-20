import React, { useState, useRef } from 'react';
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
  Sparkles,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Clock,
  Building2,
  Check
} from 'lucide-react';
import { uid } from '../../data/initialData';
import { CorporateLogo } from '../CorporateLogo';
import { CodigoQRVerificacion } from '../CodigoQRVerificacion';
import {
  generarHashSha256,
  generarTextoNotificacionContratoFirmado,
  despacharNotificacionVinculacion
} from '../../services/vinculacionService';

interface ModalFirmaContratoLaboralProps {
  empleado: Empleado;
  empresa?: ConfiguracionEmpresa;
  onClose: () => void;
  onContratoFirmado: (empleadoActualizado: Empleado) => Promise<void> | void;
  esVistaCandidato?: boolean;
}

export const ModalFirmaContratoLaboral: React.FC<ModalFirmaContratoLaboralProps> = ({
  empleado,
  empresa,
  onClose,
  onContratoFirmado,
  esVistaCandidato = false
}) => {
  const contrato = empleado.vinculacion?.contratoDigital;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dibujando, setDibujando] = useState(false);
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
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Manejo del Canvas de Firma
  const empezarDibujo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDibujando(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.moveTo(x, y);
  };

  const dibujar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dibujando) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#18235C';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const terminarDibujo = () => {
    if (!dibujando) return;
    setDibujando(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setFirmaCapturada(canvas.toDataURL('image/png'));
    }
  };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setFirmaCapturada(null);
  };

  const generarRubricaAutomatica = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const texto = (firmaNombre || empleado.nombre || 'Trabajador').trim();
    ctx.save();
    ctx.strokeStyle = '#18235C';
    ctx.fillStyle = '#18235C';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    // Trazo de rúbrica
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.bezierCurveTo(120, 30, 200, 120, 280, 50);
    ctx.bezierCurveTo(340, 20, 390, 90, 450, 60);
    ctx.stroke();

    ctx.font = 'italic bold 24px Georgia, serif';
    ctx.fillText(texto.slice(0, 28), 60, 80);
    ctx.restore();

    setFirmaCapturada(canvas.toDataURL('image/png'));
  };

  const handleFirmarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!firmaCapturada) {
      setErrorValidacion('Por favor estampe su firma manuscrita en el recuadro interactivo (o use el botón de Generar Rúbrica).');
      return;
    }

    if (!aceptaTerminos) {
      setErrorValidacion('Debe marcar la casilla de aceptación y conformidad con las cláusulas contractuales.');
      return;
    }

    setGuardando(true);

    try {
      const fechaHoy = new Date().toISOString();
      const codContrato = contrato?.codigoContrato || `CTR-BGROUP-${new Date().getFullYear()}-001`;

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

      // Documento del expediente
      const nuevoDocExpediente: DocumentoExpedienteEmpleado = {
        id: uid(),
        tipoDocumento: 'Contrato Laboral',
        nombreArchivo: `Contrato_Laboral_${codContrato}_${empleado.documento}.pdf`,
        fechaCarga: fechaHoy.slice(0, 10),
        fechaExpedicion: fechaHoy.slice(0, 10),
        usuarioCarga: 'Firma Digital Ley 527/1999',
        urlArchivo: firmaCapturada,
        observaciones: `Suscrito digitalmente por ${empleado.nombre}. Sello SHA-256: ${hash.slice(0, 16)}...`,
        estado: 'Vigente'
      };

      const contratoActualizado: any = {
        ...(contrato || {}),
        firmaCandidatoUrl: firmaCapturada,
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
            titulo: 'Contrato Individual de Trabajo Firmado Digitalmente',
            motivo: `Suscripción formal bajo la Ley 527 de 1999. Radicado: ${codContrato}. SHA-256: ${hash.slice(0, 16)}...`,
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

  const nombreEmp = empresa?.razonSocial || empresa?.nombreComercial || 'B GROUP INGENIERIA S.A.S.';
  const nitEmp = empresa?.nit ? `NIT ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : 'NIT 900.995.99-2';
  const cargoTit = contrato?.cargoNombre || empleado.laboral?.cargoNombre || 'Colaborador';
  const tipoContratoTit = contrato?.tipoContrato || empleado.laboral?.tipoContrato || 'Contrato a Término Indefinido';
  const salarioVal = contrato?.salarioBasico || empleado.salarioBase || 1500000;
  const codigoContrato = contrato?.codigoContrato || `CTR-BGROUP-${new Date().getFullYear()}-001`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-4 max-h-[96vh] flex flex-col animate-fadeIn">
        {/* Cabecera */}
        <div className="bg-[#18235C] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#00FF00] border border-white/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Contrato Individual de Trabajo & Firma Digital
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Ley 527 de 1999 / CST
                </span>
              </div>
              <p className="text-xs text-[#8FA7D6] font-mono mt-0.5">
                Radicado: <strong>{codigoContrato}</strong> · Colaborador: <strong>{empleado.nombre}</strong> (C.C. {empleado.documento})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Imprimir contrato"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Contrato (Imprimible y Escolar) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-800 leading-relaxed font-sans flex-1 bg-white">
          {errorValidacion && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Encabezado Corporativo del Contrato */}
          <div className="border-2 border-[#18235C] rounded-2xl p-4 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CorporateLogo
                logoUrl={empresa?.identidadVisual?.logoUrl}
                nombreComercial={empresa?.nombreComercial}
                size="md"
                imageClassName="max-h-12 w-auto"
              />
              <div>
                <h4 className="font-black text-sm uppercase text-[#18235C]">{nombreEmp}</h4>
                <p className="text-[11px] font-mono text-slate-600">{nitEmp} · Dirección de Gestión Humana</p>
                <p className="text-[10px] text-slate-500">Bogotá D.C., República de Colombia</p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono bg-white p-3 rounded-xl border border-slate-200 shrink-0">
              <span className="text-[10px] font-bold uppercase text-indigo-700 block">
                CONTRATO INDIVIDUAL DE TRABAJO
              </span>
              <span className="text-sm font-black text-[#18235C] block">{codigoContrato}</span>
              <span className="text-[10px] text-slate-500 block">
                Vínculo: <strong>{tipoContratoTit}</strong>
              </span>
            </div>
          </div>

          {/* Cuadro Resumen de las Partes y Condiciones */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-[#18235C] text-white px-4 py-2 font-bold text-[11px] uppercase tracking-wider">
              1. Identificación de las Partes & Condiciones Esenciales (Art. 39 CST)
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Empleador:</span>
                <span className="font-bold text-slate-900">{nombreEmp} ({nitEmp})</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Trabajador(a):</span>
                <span className="font-bold text-slate-900">{empleado.nombre}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Documento de Identidad:</span>
                <span className="font-mono font-bold text-[#18235C]">{empleado.tipoDocumento || 'CC'} {empleado.documento}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cargo Asignado:</span>
                <span className="font-bold text-indigo-700">{cargoTit}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Salario Básico Mensual:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  ${salarioVal.toLocaleString('es-CO')} COP / mes
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Periodo de Prueba (Art. 78 CST):</span>
                <span className="font-bold text-blue-900">
                  {contrato?.periodoPruebaDias || 60} días calendario
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Inicio de Labores:</span>
                <span className="font-mono text-slate-800 font-semibold">{contrato?.fechaInicio || new Date().toISOString().slice(0, 10)}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Lugar y Modalidad de Trabajo:</span>
                <span className="font-semibold text-slate-800">
                  {contrato?.lugarTrabajo || 'Bogotá D.C.'} ({contrato?.modalidadTrabajo || 'Presencial'})
                </span>
              </div>
            </div>
          </div>

          {/* Cláusulas Contractuales Detalladas */}
          <div className="space-y-3 text-[11px] text-slate-700 leading-relaxed p-4 bg-slate-50/60 rounded-2xl border border-slate-200">
            <p>
              Entre los suscritos a saber: de una parte, <strong>{nombreEmp}</strong>, sociedad legalmente constituida, identificada con el {nitEmp}, que en adelante se denominará el <strong>EMPLEADOR</strong>; y de otra parte, <strong>{empleado.nombre}</strong>, mayor de edad, identificado(a) con la cédula de ciudadanía número <strong>{empleado.documento}</strong>, quien para los efectos de este contrato se denominará el(la) <strong>TRABAJADOR(A)</strong>, acuerdan celebrar el presente <strong>CONTRATO INDIVIDUAL DE TRABAJO</strong> regulado por las siguientes cláusulas:
            </p>

            <p>
              <strong>CLÁUSULA PRIMERA — OBJETO Y CARGO:</strong> El EMPLEADOR contrata los servicios personales del TRABAJADOR para desempeñar el cargo de <strong>{cargoTit}</strong>, ejecutando las funciones propias del manual de funciones, directrices de la Dirección de Gestión Humana y demás actividades conexas acordes a su capacidad profesional y técnica.
            </p>

            <p>
              <strong>CLÁUSULA SEGUNDA — REMUNERACIÓN:</strong> El EMPLEADOR pagará al TRABAJADOR por la prestación de sus servicios la suma de <strong>${salarioVal.toLocaleString('es-CO')} PESOS M/CTE (COP)</strong> mensuales, liquidable en pagos quincenales o mensuales. {contrato?.aplicaAuxilioTransporte ? 'Adicionalmente, el trabajador percibirá el Auxilio de Transporte en los términos fijados por la Ley 15 de 1959 y decretos reglamentarios.' : 'El trabajador no percibe auxilio de transporte por superar los 2 SMMLV fijados por la ley.'}
            </p>

            <p>
              <strong>CLÁUSULA TERCERA — JORNADA DE TRABAJO (LEY 2101 DE 2021):</strong> La jornada ordinaria de trabajo será de <strong>46 horas semanales</strong> (conforme a la reducción gradual de la Ley 2101 de 2021), distribuidas en los horarios que señale el EMPLEADOR, respetando el descanso dominical legal.
            </p>

            <p>
              <strong>CLÁUSULA CUARTA — PERIODO DE PRUEBA:</strong> Las partes acuerdan un periodo de prueba de <strong>{contrato?.periodoPruebaDias || 60} días calendario</strong> a partir de la fecha de inicio, durante el cual cualquiera de las partes podrá dar por terminado el contrato en cualquier momento, de conformidad con el Artículo 80 del Código Sustantivo del Trabajo (CST).
            </p>

            <p>
              <strong>CLÁUSULA QUINTA — CONFIDENCIALIDAD Y DEBERES (ART. 58 CST):</strong> El TRABAJADOR se compromete a guardar estricta reserva y secreto profesional sobre todos los datos, metodologías, códigos fuente, clientes y secretos comerciales a los que tenga acceso durante la ejecución de su labor, absteniéndose de divulgarlos o utilizarlos en provecho propio o de terceros.
            </p>

            <p>
              <strong>CLÁUSULA SEXTA — SEGURIDAD SOCIAL INTEGRAL:</strong> El EMPLEADOR afiliará y cotizará al Sistema de Seguridad Social Integral (EPS, Fondo de Pensiones AFP, ARL en el nivel de riesgo correspondiente y Caja de Compensación Familiar) conforme a la Ley 100 de 1993 y el Decreto 1072 de 2015.
            </p>
          </div>

          {/* Panel Táctil de Captura de Firma Digital (Ley 527 de 1999) */}
          <div className="p-5 bg-indigo-50/50 border-2 border-indigo-200 rounded-3xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 pb-2">
              <span className="font-extrabold text-[#18235C] text-xs flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-indigo-700" />
                <span>Panel de Firma Digital del Trabajador (Ley 527 de 1999) *</span>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={generarRubricaAutomatica}
                  className="text-xs font-bold text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Generar Rúbrica Caligráfica</span>
                </button>
                <button
                  type="button"
                  onClick={limpiarCanvas}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar Trazo</span>
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-indigo-300 rounded-2xl bg-white overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={650}
                height={160}
                onMouseDown={empezarDibujo}
                onMouseMove={dibujar}
                onMouseUp={terminarDibujo}
                onMouseLeave={terminarDibujo}
                onTouchStart={empezarDibujo}
                onTouchMove={dibujar}
                onTouchEnd={terminarDibujo}
                className="w-full h-36 cursor-crosshair touch-none"
              />
              {!firmaCapturada && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
                  Estampe aquí su firma manuscrita con el dedo o mouse (o pulse "Generar Rúbrica Caligráfica")
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Suscriptor *</label>
                <input
                  type="text"
                  required
                  value={firmaNombre}
                  onChange={e => setFirmaNombre(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Documento de Identidad *</label>
                <input
                  type="text"
                  required
                  value={firmaDocumento}
                  onChange={e => setFirmaDocumento(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            {/* Checkbox de Aceptación Expresa */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-indigo-200 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={e => setAceptaTerminos(e.target.checked)}
                className="mt-0.5 rounded text-[#18235C] w-4 h-4 shrink-0"
              />
              <span className="text-slate-800 font-semibold leading-relaxed">
                He leído íntegramente las cláusulas de este Contrato Individual de Trabajo, acepto sus términos y estampo mi firma electrónica con plena validez jurídica conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012.
              </span>
            </label>
          </div>

          {/* Sello QR y Sellado de Integridad */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CodigoQRVerificacion
                codigoVerificacion={codigoContrato}
                tipoDocumento="Contrato Individual de Trabajo CST"
                titularNombre={empleado.nombre}
                size={70}
              />
              <div className="text-[10px] text-slate-600">
                <strong className="block text-slate-900 font-bold">Certificado de Firma Electrónica:</strong>
                <span>Autenticidad respaldada por Hash SHA-256 e IP simulada de emisión.</span>
                <span className="block text-emerald-700 font-bold mt-0.5">Válido ante el Ministerio del Trabajo de Colombia.</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={handleFirmarContrato}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
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
