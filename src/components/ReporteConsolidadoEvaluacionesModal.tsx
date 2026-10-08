import React, { useState, useMemo } from 'react';
import { EvaluacionDesempeno, Empleado, Cargo, ConfiguracionEmpresa, AreaOrganizacion } from '../types';
import { initialEmpresa } from '../data/initialData';
import { exportarContenedorAPDF, imprimirDocumento } from '../utils/printUtils';
import {
  FileText,
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
  Lock,
  Layers,
  Calendar
} from 'lucide-react';
import { CodigoQRVerificacion } from './CodigoQRVerificacion';
import { FirmaDigitalStamp } from './FirmaDigitalStamp';
import { HerramientaFirmaDigitalModal, DatosFirmaDigital } from './HerramientaFirmaDigitalModal';
import { registrarCertificadoEmitido, generarHashIntegridadDocumento } from '../services/verificacionCertificadosService';

interface ReporteConsolidadoEvaluacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluaciones: EvaluacionDesempeno[];
  empleados: Empleado[];
  cargos: Cargo[];
  empresa?: ConfiguracionEmpresa;
  areaNombreDefault?: string;
  periodoDefault?: string;
}

export const ReporteConsolidadoEvaluacionesModal: React.FC<ReporteConsolidadoEvaluacionesModalProps> = ({
  isOpen,
  onClose,
  evaluaciones,
  empleados,
  cargos,
  empresa = initialEmpresa,
  areaNombreDefault = 'TODAS',
  periodoDefault = 'TODOS'
}) => {
  const [filtroArea, setFiltroArea] = useState<string>(areaNombreDefault);
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>(periodoDefault);
  const [filtroNivel, setFiltroNivel] = useState<string>('TODOS');
  const [exportandoPdf, setExportandoPdf] = useState(false);

  // Estados de Firma Digital
  const [modalFirmaOpen, setModalFirmaOpen] = useState(false);
  const [tipoFirmante, setTipoFirmante] = useState<'lider' | 'gh'>('lider');
  const [firmaLider, setFirmaLider] = useState<DatosFirmaDigital | null>(null);
  const [firmaGH, setFirmaGH] = useState<DatosFirmaDigital | null>(null);

  if (!isOpen) return null;

  const razonSocial = empresa?.razonSocial || empresa?.nombreComercial || 'Empresa Institucional';
  const nitCompleto = empresa?.nit ? `NIT ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : '';
  const logoUrl = empresa?.identidadVisual?.logoUrl;

  // Lista de áreas únicas
  const areasDisponibles = Array.from(
    new Set(
      empleados.map(e => {
        const c = cargos.find(cg => cg.id === e.cargoId);
        return (e as any).areaNombre || c?.ficha.identificacion.area || 'Operaciones';
      })
    )
  ).filter(Boolean);

  // Lista de períodos únicos
  const periodosDisponibles = Array.from(
    new Set(evaluaciones.map(e => e.periodo))
  ).filter(Boolean);

  // Evaluaciones filtradas
  const evaluacionesFiltradas = evaluaciones.filter(ev => {
    const emp = empleados.find(e => e.id === ev.empleadoId);
    const cg = cargos.find(c => c.id === ev.cargoId);
    const areaEmp = (emp as any)?.areaNombre || cg?.ficha.identificacion.area || 'Operaciones';

    const matchArea = filtroArea === 'TODAS' || areaEmp === filtroArea;
    const matchPeriodo = filtroPeriodo === 'TODOS' || ev.periodo === filtroPeriodo;

    let nivel = 'Satisfactorio';
    if (ev.puntajeFinal >= 85) nivel = 'Sobresaliente';
    else if (ev.puntajeFinal >= 70) nivel = 'Satisfactorio';
    else if (ev.puntajeFinal >= 50) nivel = 'En Desarrollo';
    else nivel = 'Crítico';

    const matchNivel = filtroNivel === 'TODOS' || nivel === filtroNivel;

    return matchArea && matchPeriodo && matchNivel;
  });

  // Métricas Consolidadas
  const totalEvaluados = evaluacionesFiltradas.length;
  const promedioGeneral = totalEvaluados > 0
    ? (evaluacionesFiltradas.reduce((acc, curr) => acc + curr.puntajeFinal, 0) / totalEvaluados).toFixed(1)
    : '0.0';

  const promedioKpis = totalEvaluados > 0
    ? (evaluacionesFiltradas.reduce((acc, curr) => acc + (curr.subtotalResultados ?? 40), 0) / totalEvaluados).toFixed(1)
    : '0.0';

  const promedioCompetencias = totalEvaluados > 0
    ? (evaluacionesFiltradas.reduce((acc, curr) => acc + (curr.subtotalCompetencias ?? 20), 0) / totalEvaluados).toFixed(1)
    : '0.0';

  const promedioSST = totalEvaluados > 0
    ? (evaluacionesFiltradas.reduce((acc, curr) => acc + (curr.subtotalCumplimiento ?? 13), 0) / totalEvaluados).toFixed(1)
    : '0.0';

  const promedioMejora = totalEvaluados > 0
    ? (evaluacionesFiltradas.reduce((acc, curr) => acc + (curr.subtotalDesarrollo ?? 8), 0) / totalEvaluados).toFixed(1)
    : '0.0';

  const sobresalientesCount = evaluacionesFiltradas.filter(e => e.puntajeFinal >= 85).length;
  const satisfactoriosCount = evaluacionesFiltradas.filter(e => e.puntajeFinal >= 70 && e.puntajeFinal < 85).length;
  const enDesarrolloCount = evaluacionesFiltradas.filter(e => e.puntajeFinal >= 50 && e.puntajeFinal < 70).length;
  const criticosCount = evaluacionesFiltradas.filter(e => e.puntajeFinal < 50).length;

  const codigoReporte = `REP-EVAL-${filtroArea === 'TODAS' ? 'GEN' : filtroArea.slice(0, 4).toUpperCase()}-2026`;
  const nombreArchivo = `Reporte_Consolidado_Evaluaciones_${filtroArea.replace(/\s+/g, '_')}_2026`;

  const handleExportarPdf = async () => {
    setExportandoPdf(true);
    try {
      await registrarCertificadoEmitido({
        codigoVerificacion: codigoReporte,
        tipoDocumento: 'Acta de Evaluación de Desempeño',
        titularNombre: `Consolidado ${filtroArea === 'TODAS' ? 'General' : filtroArea}`,
        titularDocumento: `Reporte ${totalEvaluados} Evaluaciones`,
        titularCargo: `Líder de Área / Gestión Humana`,
        fechaEmision: new Date().toLocaleDateString('es-CO'),
        fechaRegistroISO: new Date().toISOString(),
        emisorRazonSocial: razonSocial,
        emisorNit: nitCompleto,
        firmanteNombre: firmaLider?.firmanteNombre || 'Líder Evaluador',
        firmanteCargo: 'Líder de Área / Proceso',
        hashIntegridad: generarHashIntegridadDocumento({ codigo: codigoReporte, total: totalEvaluados, prom: promedioGeneral }),
        estado: 'VIGENTE_AUTENTICO',
        firmaDigitalUrl: firmaLider?.dataUrl || firmaGH?.dataUrl
      });
      await exportarContenedorAPDF('area-impresion-reporte-evaluaciones', nombreArchivo);
    } finally {
      setExportandoPdf(false);
    }
  };

  const handleImprimir = () => {
    imprimirDocumento(nombreArchivo, 'area-impresion-reporte-evaluaciones');
  };

  const abrirModalFirmar = (tipo: 'lider' | 'gh') => {
    setTipoFirmante(tipo);
    setModalFirmaOpen(true);
  };

  const handleGuardarFirma = (firma: DatosFirmaDigital) => {
    if (tipoFirmante === 'lider') {
      setFirmaLider(firma);
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
              <Award className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                Generador de Reportes en PDF — Evaluaciones de Desempeño
              </h2>
              <span className="text-[11px] text-[#8FA7D6] block">
                Formato Ejecutivo Oficial Consolidado para Líderes de Área y Dirección
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
              <label className="block font-bold text-[#18235C] mb-1">Filtrar por Área / Proceso:</label>
              <select
                value={filtroArea}
                onChange={e => setFiltroArea(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/50 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#18235C]"
              >
                <option value="TODAS">Todas las Áreas de la Empresa</option>
                {areasDisponibles.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Período de Evaluación:</label>
              <select
                value={filtroPeriodo}
                onChange={e => setFiltroPeriodo(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/50 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#18235C]"
              >
                <option value="TODOS">Todos los Períodos Registrados</option>
                {periodosDisponibles.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Nivel de Calificación:</label>
              <select
                value={filtroNivel}
                onChange={e => setFiltroNivel(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/50 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#18235C]"
              >
                <option value="TODOS">Todos los Rangos de Desempeño</option>
                <option value="Sobresaliente">Sobresaliente (85 - 100 Pts)</option>
                <option value="Satisfactorio">Satisfactorio (70 - 84 Pts)</option>
                <option value="En Desarrollo">En Desarrollo (50 - 69 Pts)</option>
                <option value="Crítico">Crítico (&lt; 50 Pts)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white">
          <div
            id="area-impresion-reporte-evaluaciones"
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
                    {nitCompleto} · Dirección de Gestión Humana & Desarrollo Organizacional
                  </span>
                  <span className="text-xs font-bold text-[#18235C] uppercase tracking-wider block mt-0.5">
                    Informe Ejecutivo Consolidado de Evaluación Técnica de Desempeño (100 Pts)
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-[10px] text-slate-500 shrink-0">
                <div className="font-bold text-[#18235C] text-xs">CÓD: {codigoReporte}</div>
                <div>Fecha Emisión: {new Date().toLocaleDateString('es-CO')}</div>
                <div>Período: {filtroPeriodo === 'TODOS' ? 'Consolidado 2026' : filtroPeriodo}</div>
              </div>
            </div>

            {/* Parámetros del Reporte */}
            <div className="p-3.5 bg-gradient-to-r from-[#18235C]/5 to-transparent rounded-xl border border-[#8FA7D6]/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Área / Proceso</span>
                <strong className="text-[#18235C]">{filtroArea === 'TODAS' ? 'Toda la Organización' : filtroArea}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Colaboradores Evaluados</span>
                <strong className="text-[#18235C] text-sm">{totalEvaluados} Trabajadores</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Calificación Promedio</span>
                <strong className="text-emerald-700 text-sm">{promedioGeneral} / 100 Pts</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Metodología Legal</span>
                <strong className="text-slate-800">4 Ejes Objetivos CST</strong>
              </div>
            </div>

            {/* Resumen Cuantitativo por Ejes Técnicos */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#18235C] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                1. Consolidado Cuantitativo por Componente Técnico (100 Puntos)
              </h3>
              <table className="w-full text-left border border-[#8FA7D6]/40 rounded-xl overflow-hidden text-xs">
                <thead className="bg-[#18235C] text-white">
                  <tr>
                    <th className="py-2.5 px-3">Eje de Evaluación</th>
                    <th className="py-2.5 px-3 text-center">Peso Máximo</th>
                    <th className="py-2.5 px-3 text-center">Promedio Obtenido</th>
                    <th className="py-2.5 px-3 text-right">% Cumplimiento Eje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20 font-medium">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-[#18235C]">1. Resultados del Cargo (KPIs y Metas Clave)</td>
                    <td className="py-2 px-3 text-center font-mono">50 Pts</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-[#18235C]">{promedioKpis} Pts</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">{((Number(promedioKpis) / 50) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-[#18235C]">2. Competencias Técnicas y Conductuales Observables</td>
                    <td className="py-2 px-3 text-center font-mono">25 Pts</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-[#18235C]">{promedioCompetencias} Pts</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">{((Number(promedioCompetencias) / 25) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-[#18235C]">3. SG-SST, Procedimientos Operativos y Cumplimiento</td>
                    <td className="py-2 px-3 text-center font-mono">15 Pts</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-[#18235C]">{promedioSST} Pts</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">{((Number(promedioSST) / 15) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-[#18235C]">4. Desarrollo, Innovación y Mejora Continua</td>
                    <td className="py-2 px-3 text-center font-mono">10 Pts</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-[#18235C]">{promedioMejora} Pts</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">{((Number(promedioMejora) / 10) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="bg-[#18235C]/10 font-bold border-t-2 border-[#18235C]">
                    <td className="py-2.5 px-3 text-[#18235C]">PROMEDIO GLOBAL CONSOLIDADO</td>
                    <td className="py-2.5 px-3 text-center font-mono">100 Pts</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-900 text-sm font-black">{promedioGeneral} Pts</td>
                    <td className="py-2.5 px-3 text-right text-emerald-800 font-black">{promedioGeneral}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Distribución por Niveles de Desempeño */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Sobresaliente (85-100)</span>
                <strong className="text-lg text-emerald-900 font-black block">{sobresalientesCount}</strong>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {totalEvaluados > 0 ? ((sobresalientesCount / totalEvaluados) * 100).toFixed(0) : 0}% del equipo
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-300">
                <span className="text-[10px] uppercase font-bold text-blue-800 block">Satisfactorio (70-84)</span>
                <strong className="text-lg text-blue-900 font-black block">{satisfactoriosCount}</strong>
                <span className="text-[10px] text-blue-700 font-medium">
                  {totalEvaluados > 0 ? ((satisfactoriosCount / totalEvaluados) * 100).toFixed(0) : 0}% del equipo
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">En Desarrollo (50-69)</span>
                <strong className="text-lg text-amber-900 font-black block">{enDesarrolloCount}</strong>
                <span className="text-[10px] text-amber-700 font-medium">
                  {totalEvaluados > 0 ? ((enDesarrolloCount / totalEvaluados) * 100).toFixed(0) : 0}% del equipo
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-300">
                <span className="text-[10px] uppercase font-bold text-rose-800 block">Crítico (&lt; 50 Pts)</span>
                <strong className="text-lg text-rose-900 font-black block">{criticosCount}</strong>
                <span className="text-[10px] text-rose-700 font-medium">
                  {totalEvaluados > 0 ? ((criticosCount / totalEvaluados) * 100).toFixed(0) : 0}% del equipo
                </span>
              </div>
            </div>

            {/* Listado Detallado de Trabajadores */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#18235C] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#18235C]" />
                2. Detalle Individual de Calificaciones por Colaborador
              </h3>
              <table className="w-full text-left border border-[#8FA7D6]/40 rounded-xl overflow-hidden text-[11px]">
                <thead className="bg-[#18235C] text-white">
                  <tr>
                    <th className="py-2 px-2.5">Colaborador / Cargo</th>
                    <th className="py-2 px-2 text-center">Cédula</th>
                    <th className="py-2 px-2 text-center">KPIs (50)</th>
                    <th className="py-2 px-2 text-center">Comp (25)</th>
                    <th className="py-2 px-2 text-center">SST (15)</th>
                    <th className="py-2 px-2 text-center">Mej (10)</th>
                    <th className="py-2 px-2 text-center font-bold">Total (100)</th>
                    <th className="py-2 px-2.5 text-right">Concepto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {evaluacionesFiltradas.map((ev, idx) => {
                    const emp = empleados.find(e => e.id === ev.empleadoId);
                    const cg = cargos.find(c => c.id === ev.cargoId);
                    return (
                      <tr key={ev.id || idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5">
                          <strong className="text-[#18235C] block">{emp?.nombre || 'Colaborador'}</strong>
                          <span className="text-[10px] text-slate-500">{cg?.nombre || 'Cargo'}</span>
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-[10px]">{emp?.documento || 'CC'}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{ev.subtotalResultados ?? 40}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{ev.subtotalCompetencias ?? 20}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{ev.subtotalCumplimiento ?? 13}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{ev.subtotalDesarrollo ?? 8}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-sm text-[#18235C]">
                          {ev.puntajeFinal}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] ${
                            ev.puntajeFinal >= 85 ? 'bg-emerald-100 text-emerald-800' :
                            ev.puntajeFinal >= 70 ? 'bg-blue-100 text-blue-800' :
                            ev.puntajeFinal >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ev.puntajeFinal >= 85 ? 'Sobresaliente' :
                             ev.puntajeFinal >= 70 ? 'Satisfactorio' :
                             ev.puntajeFinal >= 50 ? 'En Desarrollo' : 'Crítico'}
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
                {/* Firma Líder de Área */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaLider}
                    firmanteDefault={{
                      nombre: 'Líder de Área / Evaluador Principal',
                      cargo: `Líder del Área: ${filtroArea === 'TODAS' ? 'Operaciones / Dirección' : filtroArea}`,
                      documento: 'C.C. Registrada'
                    }}
                    labelCargo="Firma de Validación y Calificación Técnica"
                    onOpenFirmarModal={() => abrirModalFirmar('lider')}
                  />
                </div>

                {/* Código QR de Validación de Autenticidad */}
                <div className="sm:col-span-2 flex justify-center">
                  <CodigoQRVerificacion
                    codigoVerificacion={codigoReporte}
                    tipoDocumento="Acta de Evaluación de Desempeño"
                    titularNombre={`Consolidado ${filtroArea}`}
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
                    labelCargo="Revisión, Custodia y Registro Oficial GH"
                    onOpenFirmarModal={() => abrirModalFirmar('gh')}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Cód. Verificación: {codigoReporte}</span>
                <span>Reporte oficial con validez jurídica según Ley 527 de 1999 de Firma Digital</span>
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
        tituloDocumento={`Reporte Consolidado de Desempeño: ${filtroArea}`}
        firmanteSugerido={{
          nombre: tipoFirmante === 'lider' ? 'Líder Evaluador' : (empresa?.representanteLegal?.nombre || 'Dirección de Gestión Humana'),
          cargo: tipoFirmante === 'lider' ? `Líder del Área ${filtroArea}` : 'Dirección de Gestión Humana',
          documento: ''
        }}
      />
    </div>
  );
};
