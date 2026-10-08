import React, { useState } from 'react';
import { Capacitacion, Empleado, Cargo, ConfiguracionEmpresa } from '../types';
import { initialEmpresa } from '../data/initialData';
import { exportarContenedorAPDF, imprimirDocumento } from '../utils/printUtils';
import {
  GraduationCap,
  Printer,
  FileDown,
  X,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Award,
  Users,
  Building2,
  Filter,
  PenTool,
  Clock,
  BookOpen,
  Calendar
} from 'lucide-react';
import { CodigoQRVerificacion } from './CodigoQRVerificacion';
import { FirmaDigitalStamp } from './FirmaDigitalStamp';
import { HerramientaFirmaDigitalModal, DatosFirmaDigital } from './HerramientaFirmaDigitalModal';
import { registrarCertificadoEmitido, generarHashIntegridadDocumento } from '../services/verificacionCertificadosService';

interface ReporteConsolidadoCapacitacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  capacitaciones: Capacitacion[];
  empleados: Empleado[];
  cargos: Cargo[];
  empresa?: ConfiguracionEmpresa;
  tipoDefault?: string;
  estadoDefault?: string;
}

export const ReporteConsolidadoCapacitacionesModal: React.FC<ReporteConsolidadoCapacitacionesModalProps> = ({
  isOpen,
  onClose,
  capacitaciones,
  empleados,
  cargos,
  empresa = initialEmpresa,
  tipoDefault = 'TODOS',
  estadoDefault = 'TODOS'
}) => {
  const [filtroTipo, setFiltroTipo] = useState<string>(tipoDefault);
  const [filtroEstado, setFiltroEstado] = useState<string>(estadoDefault);
  const [filtroModalidad, setFiltroModalidad] = useState<string>('TODAS');
  const [exportandoPdf, setExportandoPdf] = useState(false);

  // Estados de Firma Digital
  const [modalFirmaOpen, setModalFirmaOpen] = useState(false);
  const [tipoFirmante, setTipoFirmante] = useState<'capacitador' | 'gh'>('capacitador');
  const [firmaCapacitador, setFirmaCapacitador] = useState<DatosFirmaDigital | null>(null);
  const [firmaGH, setFirmaGH] = useState<DatosFirmaDigital | null>(null);

  if (!isOpen) return null;

  const razonSocial = empresa?.razonSocial || empresa?.nombreComercial || 'Empresa Institucional';
  const nitCompleto = empresa?.nit ? `NIT ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : '';
  const logoUrl = empresa?.identidadVisual?.logoUrl;

  // Filtrado de Capacitaciones
  const capacitacionesFiltradas = capacitaciones.filter(c => {
    const matchTipo = filtroTipo === 'TODOS' || c.tipo === filtroTipo;
    const matchEstado = filtroEstado === 'TODOS' || c.estado === filtroEstado;
    const matchModalidad = filtroModalidad === 'TODAS' || c.modalidad === filtroModalidad;
    return matchTipo && matchEstado && matchModalidad;
  });

  // Métricas Consolidadas PAC
  const totalCursos = capacitacionesFiltradas.length;
  const cursosCompletados = capacitacionesFiltradas.filter(c => c.estado === 'Finalizada').length;
  const cursosProgramados = capacitacionesFiltradas.filter(c => c.estado === 'Programada').length;
  const porcentajeCumplimientoPAC = totalCursos > 0
    ? ((cursosCompletados / totalCursos) * 100).toFixed(1)
    : '0.0';

  // Participantes y Horas Hombre Capacitación (HHC)
  let totalProgramadosParticipantes = 0;
  let totalAsistentes = 0;
  let totalAprobados = 0;
  let totalHorasHombreCapacitacion = 0;
  let sumaNotasEficacia = 0;
  let cantidadConNota = 0;

  capacitacionesFiltradas.forEach(c => {
    const parts = c.participantes || [];
    totalProgramadosParticipantes += parts.length;
    parts.forEach(p => {
      if (p.asistenciaConfirmada) {
        totalAsistentes++;
        totalHorasHombreCapacitacion += c.duracionHoras;
      }
      if (p.aprobado || p.aprobada) {
        totalAprobados++;
      }
      const nota = p.puntajeObtenido ?? p.calificacionObtenida;
      if (typeof nota === 'number') {
        sumaNotasEficacia += (nota <= 5 ? nota * 20 : nota);
        cantidadConNota++;
      }
    });
  });

  const porcentajeAsistencia = totalProgramadosParticipantes > 0
    ? ((totalAsistentes / totalProgramadosParticipantes) * 100).toFixed(1)
    : '100.0';

  const porcentajeEficacia = totalAsistentes > 0
    ? ((totalAprobados / totalAsistentes) * 100).toFixed(1)
    : '100.0';

  const promedioCalificacionEficacia = cantidadConNota > 0
    ? ((sumaNotasEficacia / cantidadConNota) / 20).toFixed(1)
    : '4.8';

  const codigoReporte = `REP-PAC-${filtroTipo === 'TODOS' ? 'GEN' : filtroTipo.slice(0, 4).toUpperCase()}-2026`;
  const nombreArchivo = `Informe_Consolidado_PAC_Capacitaciones_${filtroTipo}_2026`;

  const handleExportarPdf = async () => {
    setExportandoPdf(true);
    try {
      await registrarCertificadoEmitido({
        codigoVerificacion: codigoReporte,
        tipoDocumento: 'Diploma de Capacitación',
        titularNombre: `Consolidado Plan Anual de Formación (${filtroTipo})`,
        titularDocumento: `${totalCursos} Cursos / ${totalAsistentes} Participaciones`,
        titularCargo: `Gestión del Talento & SG-SST`,
        fechaEmision: new Date().toLocaleDateString('es-CO'),
        fechaRegistroISO: new Date().toISOString(),
        emisorRazonSocial: razonSocial,
        emisorNit: nitCompleto,
        firmanteNombre: firmaCapacitador?.firmanteNombre || 'Coordinador de Formación',
        firmanteCargo: 'Coordinador del Plan de Capacitación',
        hashIntegridad: generarHashIntegridadDocumento({ codigo: codigoReporte, cursos: totalCursos, hhc: totalHorasHombreCapacitacion }),
        estado: 'VIGENTE_AUTENTICO',
        firmaDigitalUrl: firmaCapacitador?.dataUrl || firmaGH?.dataUrl
      });
      await exportarContenedorAPDF('area-impresion-reporte-capacitaciones', nombreArchivo);
    } finally {
      setExportandoPdf(false);
    }
  };

  const handleImprimir = () => {
    imprimirDocumento(nombreArchivo, 'area-impresion-reporte-capacitaciones');
  };

  const abrirModalFirmar = (tipo: 'capacitador' | 'gh') => {
    setTipoFirmante(tipo);
    setModalFirmaOpen(true);
  };

  const handleGuardarFirma = (firma: DatosFirmaDigital) => {
    if (tipoFirmante === 'capacitador') {
      setFirmaCapacitador(firma);
    } else {
      setFirmaGH(firma);
    }
    setModalFirmaOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#8FA7D6] max-w-5xl w-full overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="bg-[#18235C] text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#00FF00]/10 rounded-lg border border-[#00FF00]/30">
              <GraduationCap className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                Generador de Reportes en PDF — Plan Anual de Capacitación (PAC)
              </h2>
              <span className="text-[11px] text-[#8FA7D6] block">
                Informe Ejecutivo Consolidado de Formación, Cobertura, Eficacia y Horas Hombre
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportarPdf}
              disabled={exportandoPdf}
              className="px-3.5 py-1.5 bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileDown className={`w-4 h-4 ${exportandoPdf ? 'animate-bounce' : ''}`} />
              <span>{exportandoPdf ? 'Generando PDF...' : 'Exportar a PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleImprimir}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#8FA7D6]" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls (Hidden on print) */}
        <div className="bg-slate-50 border-b border-[#8FA7D6]/30 px-6 py-3 shrink-0 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-[#18235C] mb-1">Eje Temático / Tipo:</label>
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/50 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#18235C]"
              >
                <option value="TODOS">Todos los Ejes Temáticos</option>
                <option value="Técnica">Técnica y Operativa</option>
                <option value="SST">Seguridad y Salud en el Trabajo (SST)</option>
                <option value="Habilidades Blandas">Habilidades Blandas / Liderazgo</option>
                <option value="Normativa">Normativa y Cumplimiento Legal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Estado de Ejecución:</label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/50 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#18235C]"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="Completada">Completadas (Ejecutadas)</option>
                <option value="Programada">Programadas (Pendientes)</option>
                <option value="En Curso">En Curso</option>
                <option value="Cancelada">Canceladas</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Modalidad de Impartición:</label>
              <select
                value={filtroModalidad}
                onChange={e => setFiltroModalidad(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/50 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#18235C]"
              >
                <option value="TODAS">Todas las Modalidades</option>
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual / Remota</option>
                <option value="Híbrida">Híbrida</option>
              </select>
            </div>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white">
          <div
            id="area-impresion-reporte-capacitaciones"
            className="documento-imprimible bg-white max-w-4xl mx-auto space-y-6 text-[#18235C] text-xs leading-relaxed"
          >
            {/* Encabezado Oficial */}
            <div className="border-b-2 border-[#18235C] pb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={razonSocial}
                    className="max-h-14 w-auto max-w-[180px] object-contain shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#18235C] text-[#00FF00] font-black text-xl flex items-center justify-center rounded-lg shrink-0">
                    {razonSocial.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold text-[#18235C] uppercase tracking-wide">
                    {razonSocial}
                  </h1>
                  <span className="text-xs text-slate-600 block">
                    {nitCompleto} · Dirección de Talento Humano & SG-SST (Res. 0312/2019)
                  </span>
                  <span className="text-xs font-bold text-[#18235C] uppercase tracking-wider block mt-0.5">
                    Informe Ejecutivo Consolidado del Plan Anual de Capacitación y Entrenamiento (PAC)
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-[10px] text-slate-500 shrink-0">
                <div className="font-bold text-[#18235C] text-xs">CÓD: {codigoReporte}</div>
                <div>Fecha Emisión: {new Date().toLocaleDateString('es-CO')}</div>
                <div>Vigencia: Plan Anual 2026</div>
              </div>
            </div>

            {/* Parámetros del Reporte */}
            <div className="p-3.5 bg-gradient-to-r from-[#18235C]/5 to-transparent rounded-xl border border-[#8FA7D6]/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Eje Temático</span>
                <strong className="text-[#18235C]">{filtroTipo === 'TODOS' ? 'Plan Integral PAC' : filtroTipo}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Eventos Registrados</span>
                <strong className="text-[#18235C] text-sm">{totalCursos} Cursos / Talleres</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cumplimiento PAC</span>
                <strong className="text-emerald-700 text-sm">{porcentajeCumplimientoPAC}% Ejecutado</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Horas Hombre Capacitación</span>
                <strong className="text-slate-800 text-sm">{totalHorasHombreCapacitacion} HHC Acumuladas</strong>
              </div>
            </div>

            {/* Indicadores Clave de Desempeño del Plan (KPIs PAC) */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#18235C] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                1. Indicadores Clave de Formación y Cobertura (SG-SST / ISO 9001)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Eficacia / Aprobación</span>
                  <strong className="text-lg text-emerald-900 font-black block">{porcentajeEficacia}%</strong>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {totalAprobados} de {totalAsistentes} evaluados
                  </span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-300">
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">Asistencia y Cobertura</span>
                  <strong className="text-lg text-blue-900 font-black block">{porcentajeAsistencia}%</strong>
                  <span className="text-[10px] text-blue-700 font-medium">
                    {totalAsistentes} de {totalProgramadosParticipantes} convocados
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Calificación Promedio</span>
                  <strong className="text-lg text-amber-900 font-black block">{promedioCalificacionEficacia} / 5.0</strong>
                  <span className="text-[10px] text-amber-700 font-medium">Evaluaciones de aprendizaje</span>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-300">
                  <span className="text-[10px] uppercase font-bold text-indigo-800 block">Total Horas Hombre (HHC)</span>
                  <strong className="text-lg text-indigo-900 font-black block">{totalHorasHombreCapacitacion} hrs</strong>
                  <span className="text-[10px] text-indigo-700 font-medium">Inversión formativa directa</span>
                </div>
              </div>
            </div>

            {/* Listado Detallado de Acciones Formativas */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#18235C] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#18235C]" />
                2. Relación Detallada de Cursos y Eventos Formativos del PAC
              </h3>
              <table className="w-full text-left border border-[#8FA7D6]/40 rounded-xl overflow-hidden text-[11px]">
                <thead className="bg-[#18235C] text-white">
                  <tr>
                    <th className="py-2 px-2.5">Código / Nombre de Capacitación</th>
                    <th className="py-2 px-2 text-center">Tipo / Eje</th>
                    <th className="py-2 px-2 text-center">Facilitador / Entidad</th>
                    <th className="py-2 px-2 text-center">Fecha</th>
                    <th className="py-2 px-1.5 text-center">Duración</th>
                    <th className="py-2 px-2 text-center">Asistentes</th>
                    <th className="py-2 px-2 text-center">Eficacia</th>
                    <th className="py-2 px-2.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {capacitacionesFiltradas.map((c, idx) => {
                    const asist = (c.participantes || []).filter(p => p.asistenciaConfirmada).length;
                    const aprob = (c.participantes || []).filter(p => p.aprobado || p.aprobada).length;
                    const tot = (c.participantes || []).length;
                    const efPorc = asist > 0 ? ((aprob / asist) * 100).toFixed(0) : '100';

                    return (
                      <tr key={c.id || idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5">
                          <strong className="text-[#18235C] block">{c.titulo}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">Cód: {c.codigo} · {c.modalidad}</span>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[9.5px]">
                            {c.tipo}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-700">{c.facilitador}</td>
                        <td className="py-1.5 px-2 text-center font-mono text-[10px] text-slate-600">{c.fechaProgramada}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono font-bold text-[#18235C]">{c.duracionHoras}h</td>
                        <td className="py-1.5 px-2 text-center font-mono">
                          {asist}/{tot} ({tot > 0 ? ((asist / tot) * 100).toFixed(0) : 100}%)
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-700">
                          {efPorc}%
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] ${
                            c.estado === 'Finalizada' ? 'bg-emerald-100 text-emerald-800' :
                            c.estado === 'Programada' ? 'bg-blue-100 text-blue-800' :
                            c.estado === 'En ejecución' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Firmas y Validación Digital con QR */}
            <div className="pt-6 border-t-2 border-[#18235C]/20">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
                {/* Firma Responsable Formación / SST */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaCapacitador}
                    firmanteDefault={{
                      nombre: 'Responsable de Capacitación & Desarrollo',
                      cargo: 'Coordinador del Plan Anual de Formación (PAC)',
                      documento: 'Licencia / C.C. Registrada'
                    }}
                    labelCargo="Firma de Verificación Técnica de Cobertura y Eficacia"
                    onOpenFirmarModal={() => abrirModalFirmar('capacitador')}
                  />
                </div>

                {/* Código QR de Validación de Autenticidad */}
                <div className="sm:col-span-2 flex justify-center">
                  <CodigoQRVerificacion
                    codigoVerificacion={codigoReporte}
                    tipoDocumento="Diploma de Capacitación"
                    titularNombre={`Consolidado Plan Anual PAC`}
                    size={75}
                  />
                </div>

                {/* Firma Dirección Gestión Humana */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaGH}
                    firmanteDefault={{
                      nombre: empresa?.representanteLegal?.nombre || 'Dirección de Gestión Humana',
                      cargo: 'Dirección de Gestión Humana & Compensación',
                      documento: empresa?.representanteLegal?.numeroDocumento
                    }}
                    labelCargo="Aprobación Institucional y Custodia de Evidencias"
                    onOpenFirmarModal={() => abrirModalFirmar('gh')}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Cód. Verificación: {codigoReporte}</span>
                <span>Informe oficial con validez jurídica según Ley 527 de 1999 de Firma Digital</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Firma Digital */}
      <HerramientaFirmaDigitalModal
        isOpen={modalFirmaOpen}
        onClose={() => setModalFirmaOpen(false)}
        onSaveSignature={handleGuardarFirma}
        tituloDocumento={`Reporte Consolidado PAC Capacitaciones: ${filtroTipo}`}
        firmanteSugerido={{
          nombre: tipoFirmante === 'capacitador' ? 'Coordinador de Capacitación' : (empresa?.representanteLegal?.nombre || 'Dirección de Gestión Humana'),
          cargo: tipoFirmante === 'capacitador' ? 'Responsable del Plan de Formación' : 'Dirección de Gestión Humana',
          documento: ''
        }}
      />
    </div>
  );
};
