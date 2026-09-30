import React, { useState } from 'react';
import { Cargo, Empleado, EvaluacionDesempeno, ConfiguracionEmpresa } from '../types';
import { exportarContenedorAPDF, imprimirDocumento } from '../utils/printUtils';
import {
  FileText,
  Printer,
  Download,
  Award,
  Briefcase,
  Building,
  CheckCircle2,
  ChevronRight,
  FileDown
} from 'lucide-react';

interface DocumentosViewProps {
  cargos: Cargo[];
  empleados: Empleado[];
  evaluaciones: EvaluacionDesempeno[];
  onOpenEvaluacionDetalle: (evaluacionId: string) => void;
  empresa?: ConfiguracionEmpresa;
}

export const DocumentosView: React.FC<DocumentosViewProps> = ({
  cargos,
  empleados,
  evaluaciones,
  onOpenEvaluacionDetalle,
  empresa
}) => {
  const [selectedDocType, setSelectedDocType] = useState<'ficha' | 'acta_eval'>('ficha');
  const [selectedCargoId, setSelectedCargoId] = useState<string>(cargos[0]?.id || '');
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>(empleados[0]?.id || '');
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const cargo = cargos.find(c => c.id === selectedCargoId) || cargos[0];
  const empleado = empleados.find(e => e.id === selectedEmpleadoId) || empleados[0];
  const empCargo = cargos.find(c => c.id === empleado?.cargoId);

  const nombreArchivoExportacion = selectedDocType === 'ficha'
    ? `Manual_Cargo_${cargo?.nombre || 'Ficha'}`
    : `Acta_Evaluacion_${empleado?.nombre || 'Empleado'}`;

  const handleExportarPdf = async () => {
    setExportandoPdf(true);
    try {
      await exportarContenedorAPDF('area-impresion-repositorio-documentos', nombreArchivoExportacion);
    } finally {
      setExportandoPdf(false);
    }
  };

  const handlePrint = () => {
    imprimirDocumento(nombreArchivoExportacion, 'area-impresion-repositorio-documentos');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]/30 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Gestión Documental Oficial
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8FA7D6]/15 text-[#18235C] border border-[#8FA7D6]/30">
              {empresa?.razonSocial || empresa?.nombreComercial || 'Empresa'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18235C]">
            Repositorio y Generador de Documentos
          </h1>
          <p className="text-xs sm:text-sm text-[#282829]/70 mt-1 max-w-2xl">
            Generación formal y exportación de manuales específicos de funciones y actas oficiales de evaluación técnica de desempeño de 100 puntos.
          </p>
        </div>

        <div>
          <button
            id="btn-exportar-pdf-documento"
            onClick={handleExportarPdf}
            disabled={exportandoPdf}
            className="px-4 py-2 bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Exportar documento en formato PDF descargable"
          >
            <FileDown className={`w-4 h-4 ${exportandoPdf ? 'animate-bounce' : ''}`} />
            <span>{exportandoPdf ? 'Generando PDF...' : 'Exportar a PDF'}</span>
          </button>
        </div>
      </div>


      {/* Control Selector (Hidden during print) */}
      <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/30 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            id="tab-doc-ficha"
            onClick={() => setSelectedDocType('ficha')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors ${
              selectedDocType === 'ficha'
                ? 'bg-[#18235C] text-white shadow-xs'
                : 'bg-slate-100 text-[#282829]/70 hover:bg-[#8FA7D6]/20 hover:text-[#18235C]'
            }`}
          >
            Ficha Oficial de Manual de Cargo
          </button>
          <button
            id="tab-doc-acta"
            onClick={() => setSelectedDocType('acta_eval')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors ${
              selectedDocType === 'acta_eval'
                ? 'bg-[#18235C] text-white shadow-xs'
                : 'bg-slate-100 text-[#282829]/70 hover:bg-[#8FA7D6]/20 hover:text-[#18235C]'
            }`}
          >
            Acta de Evaluación Técnica de Desempeño
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-[#8FA7D6]/20">
          {selectedDocType === 'ficha' ? (
            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Seleccionar Cargo a Imprimir:</label>
              <select
                id="select-cargo-documento"
                value={selectedCargoId}
                onChange={e => setSelectedCargoId(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/40 bg-slate-50 text-[#282829] focus:outline-none focus:border-[#18235C]"
              >
                {cargos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.ficha.identificacion.codigo || 'S/C'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Seleccionar Colaborador:</label>
              <select
                id="select-colaborador-documento"
                value={selectedEmpleadoId}
                onChange={e => setSelectedEmpleadoId(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/40 bg-slate-50 text-[#282829] focus:outline-none focus:border-[#18235C]"
              >
                {empleados.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} — {cargos.find(c => c.id === e.cargoId)?.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Document Sheet Layout (Paper Preview) */}
      <div id="area-impresion-repositorio-documentos" className="documento-imprimible bg-white rounded-xl border border-[#8FA7D6]/40 p-8 sm:p-12 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Plantilla 1: Ficha de Cargo */}
        {selectedDocType === 'ficha' && cargo && (
          <div className="space-y-6 text-xs text-[#282829]">
            {/* Header Documento */}
            <div className="border-b-2 border-[#18235C] pb-4 flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                {empresa?.identidadVisual?.logoUrl ? (
                  <img
                    src={empresa.identidadVisual.logoUrl}
                    alt={empresa.nombreComercial || 'Logo'}
                    className="max-h-16 w-auto max-w-[200px] object-contain shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#18235C] text-[#00FF00] font-black text-xl flex items-center justify-center rounded-lg shrink-0">
                    {empresa?.nombreComercial ? empresa.nombreComercial.charAt(0) : 'B'}
                  </div>
                )}
                <div>
                  <span className="text-lg sm:text-xl font-bold text-[#18235C] block">
                    {empresa?.razonSocial || empresa?.nombreComercial || 'Empresa'} — GESTIÓN HUMANA
                  </span>
                  <span className="text-[11px] text-[#282829]/70 uppercase tracking-wider font-semibold">
                    Manual Específico de Funciones y Competencias Laborales
                  </span>
                </div>
              </div>
              <div className="text-right text-[11px] font-mono text-[#282829]/70 shrink-0">
                <div>Código: {cargo.ficha.identificacion.codigo || 'GH-MC-001'}</div>
                <div>Versión: {cargo.ficha.identificacion.version || '1.0'}</div>
                <div>Fecha: {cargo.ficha.historial[0]?.fecha || '2026-09'}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#18235C]/5 to-transparent p-4 rounded-lg border border-[#8FA7D6]/30">
              <h2 className="text-lg font-bold text-[#18235C]">
                {cargo.nombre}
              </h2>
              <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] text-[#282829]/70">
                <div>Área / Proceso: <strong className="text-[#18235C]">{cargo.ficha.identificacion.area || cargo.ficha.identificacion.proceso}</strong></div>
                <div>Familia / Nivel: <strong className="text-[#18235C]">{cargo.ficha.identificacion.familia}</strong></div>
                <div>Modalidad: <strong className="text-[#18235C]">{cargo.ficha.identificacion.modalidad}</strong></div>
              </div>
            </div>

            {/* Propósito */}
            <div>
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide border-b border-[#8FA7D6]/30 pb-1 mb-2">
                1. Propósito Principal del Cargo
              </h3>
              <p className="leading-relaxed bg-slate-50 p-3 rounded-lg border border-[#8FA7D6]/20">
                {cargo.ficha.proposito || 'Sin propósito especificado.'}
              </p>
            </div>

            {/* Funciones Esenciales */}
            <div>
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide border-b border-[#8FA7D6]/30 pb-1 mb-2">
                2. Funciones Esenciales y Responsabilidades
              </h3>
              <div className="space-y-2">
                {cargo.ficha.funciones.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-bold text-[#18235C]">{i + 1}.</span>
                    <div className="flex-1">
                      <strong className="text-[#282829]">{f.texto}</strong>
                      <div className="text-[11px] text-[#282829]/70">
                        Condición: {f.condicion} · Resultado esperado: {f.resultado} (Criticidad: {f.criticidad})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicadores de Gestión */}
            <div>
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide border-b border-[#8FA7D6]/30 pb-1 mb-2">
                3. Indicadores de Gestión (Base para Evaluación del 50%)
              </h3>
              <table className="w-full text-left border border-[#8FA7D6]/30 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#18235C] text-white">
                    <th className="p-2">Indicador</th>
                    <th className="p-2">Fórmula</th>
                    <th className="p-2">Meta</th>
                    <th className="p-2 text-right">Peso Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {cargo.ficha.indicadores.map((ind, i) => (
                    <tr key={i} className="hover:bg-[#8FA7D6]/10">
                      <td className="p-2 font-medium text-[#18235C]">{ind.nombre}</td>
                      <td className="p-2 font-mono text-[10px] text-[#282829]/70">{ind.formula}</td>
                      <td className="p-2">{ind.meta} {ind.unidad}</td>
                      <td className="p-2 font-bold text-[#18235C] text-right">{ind.pesoSugerido}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Competencias Requeridas */}
            <div>
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide border-b border-[#8FA7D6]/30 pb-1 mb-2">
                4. Competencias Requeridas (Base para Evaluación del 25%)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cargo.ficha.competencias.map((cp, i) => (
                  <div key={i} className="p-2.5 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30">
                    <div className="flex justify-between font-bold">
                      <span className="text-[#18235C]">{cp.nombre}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#18235C]/10 text-[#18235C]">Nivel {cp.nivel}</span>
                    </div>
                    <span className="text-[10px] text-[#282829]/70 block mt-1">{cp.conductas}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#8FA7D6]/30">
              <div className="border-t border-[#18235C] pt-2 text-center">
                <span className="font-bold text-[#18235C] block">Aprobado por: Gerencia de Gestión Humana</span>
                <span className="text-[10px] text-[#282829]/70">Firma y Sello de Validación · B GROUP</span>
              </div>
              <div className="border-t border-[#18235C] pt-2 text-center">
                <span className="font-bold text-[#18235C] block">Recibido por: Colaborador Asignado</span>
                <span className="text-[10px] text-[#282829]/70">Firma de Enterado y Compromiso</span>
              </div>
            </div>
          </div>
        )}

        {/* Plantilla 2: Acta de Evaluación Técnica */}
        {selectedDocType === 'acta_eval' && (
          <div className="space-y-6 text-xs text-[#282829]">
            <div className="border-b-2 border-[#18235C] pb-4 flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                {empresa?.identidadVisual?.logoUrl ? (
                  <img
                    src={empresa.identidadVisual.logoUrl}
                    alt={empresa.nombreComercial || 'Logo'}
                    className="max-h-16 w-auto max-w-[200px] object-contain shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#18235C] text-[#00FF00] font-black text-xl flex items-center justify-center rounded-lg shrink-0">
                    {empresa?.nombreComercial ? empresa.nombreComercial.charAt(0) : 'B'}
                  </div>
                )}
                <div>
                  <span className="text-lg sm:text-xl font-bold text-[#18235C] block">
                    ACTA DE EVALUACIÓN TÉCNICA DE DESEMPEÑO
                  </span>
                  <span className="text-[11px] text-[#282829]/70 uppercase tracking-wider font-semibold">
                    Modelo Cuantitativo de 100 Puntos · {empresa?.razonSocial || empresa?.nombreComercial || 'Empresa'}
                  </span>
                </div>
              </div>
              <div className="text-right text-[11px] font-mono text-[#282829]/70 shrink-0">
                <div>Fecha: {new Date().toLocaleDateString('es-CO')}</div>
                <div>Período: 2026 - S1</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>Colaborador: <strong className="block text-sm text-[#18235C]">{empleado.nombre}</strong></div>
              <div>Cargo: <strong className="block text-sm text-[#18235C]">{empCargo?.nombre}</strong></div>
              <div>Cédula: <strong className="block text-sm text-[#282829]">{empleado.documento}</strong></div>
              <div>Salario: <strong className="block text-sm text-[#282829]">{empleado.contrato.salario}</strong></div>
            </div>

            {/* Resumen de los 4 componentes */}
            <div className="space-y-2">
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide">
                Consolidado Oficial de Calificación Técnica
              </h3>
              <table className="w-full text-left border border-[#8FA7D6]/30 rounded-lg overflow-hidden">
                <thead className="bg-[#18235C] text-white">
                  <tr>
                    <th className="p-2.5">Componente Técnico</th>
                    <th className="p-2.5">Ponderación Máxima</th>
                    <th className="p-2.5">Puntaje Obtenido</th>
                    <th className="p-2.5">Estado / Cumplimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  <tr className="hover:bg-[#8FA7D6]/10">
                    <td className="p-2.5 font-medium text-[#18235C]">1. Resultados del Cargo (Indicadores Clave)</td>
                    <td className="p-2.5 font-mono">50 Puntos</td>
                    <td className="p-2.5 font-mono font-bold text-[#18235C]">43.5 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Superior (87%)</td>
                  </tr>
                  <tr className="hover:bg-[#8FA7D6]/10">
                    <td className="p-2.5 font-medium text-[#18235C]">2. Competencias Técnicas y Conductuales</td>
                    <td className="p-2.5 font-mono">25 Puntos</td>
                    <td className="p-2.5 font-mono font-bold text-[#18235C]">21.5 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Esperado (86%)</td>
                  </tr>
                  <tr className="hover:bg-[#8FA7D6]/10">
                    <td className="p-2.5 font-medium text-[#18235C]">3. SG-SST, Procedimientos y Normas</td>
                    <td className="p-2.5 font-mono">15 Puntos</td>
                    <td className="p-2.5 font-mono font-bold text-[#18235C]">14.0 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Excelente</td>
                  </tr>
                  <tr className="hover:bg-[#8FA7D6]/10">
                    <td className="p-2.5 font-medium text-[#18235C]">4. Desarrollo y Mejora Continua</td>
                    <td className="p-2.5 font-mono">10 Puntos</td>
                    <td className="p-2.5 font-mono font-bold text-[#18235C]">8.0 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Cumplido</td>
                  </tr>
                  <tr className="bg-[#18235C]/10 font-bold border-t-2 border-[#18235C]">
                    <td className="p-2.5 text-[#18235C]">TOTAL GENERAL CONSOLIDADO</td>
                    <td className="p-2.5">100 Puntos</td>
                    <td className="p-2.5 text-lg text-[#18235C]">87.0 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-bold">SOBRESALIENTE</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-[#8FA7D6]/30 space-y-1">
              <strong className="block text-[#18235C]">Compromiso del Plan de Desarrollo:</strong>
              <p className="text-[#282829]/70">
                Se acuerda fortalecer la documentación técnica de tickets N2 y participar en el taller de escalamiento de incidencias antes del 30 de abril de 2026.
              </p>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#8FA7D6]/30">
              <div className="border-t border-[#18235C] pt-2 text-center">
                <span className="font-bold text-[#18235C] block">Firma Evaluador (Jefe Inmediato)</span>
                <span className="text-[10px] text-[#282829]/70">Certifica veracidad de evidencias y calificaciones</span>
              </div>
              <div className="border-t border-[#18235C] pt-2 text-center">
                <span className="font-bold text-[#18235C] block">Firma Colaborador Evaluado</span>
                <span className="text-[10px] text-[#282829]/70">Constancia de retroalimentación recibida</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
