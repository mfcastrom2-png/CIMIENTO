import React from 'react';
import { EvaluacionDesempeno, Empleado, Cargo } from '../types';
import {
  X,
  Printer,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  TrendingUp,
  Target,
  UserCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { getNivelLabel } from '../services/evaluationEngine';

interface EvaluacionDetalleModalProps {
  evaluacion: EvaluacionDesempeno;
  empleados: Empleado[];
  cargos: Cargo[];
  onClose: () => void;
}

export const EvaluacionDetalleModal: React.FC<EvaluacionDetalleModalProps> = ({
  evaluacion,
  empleados,
  cargos,
  onClose,
}) => {
  const empleado = empleados.find(e => e.id === evaluacion.empleadoId);
  const cargo = cargos.find(c => c.id === evaluacion.cargoId);
  const evaluador = empleados.find(e => e.id === evaluacion.evaluadorId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-xl border border-[#8FA7D6]/40 max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        {/* Header Modal */}
        <div className="bg-[#18235C] text-white px-6 py-4 flex items-center justify-between shrink-0 print:bg-[#18235C] print:text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#8FA7D6]/20 flex items-center justify-center border border-white/10">
              <Award className="w-6 h-6 text-[#00FF00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-wide">
                  Expediente de Evaluación Técnica de Desempeño
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-white/15 text-white">
                  {evaluacion.id}
                </span>
              </div>
              <p className="text-xs text-[#8FA7D6]">
                Modelo Cuantitativo de 100 Puntos Derivado del Cargo · Período {evaluacion.periodo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              id="btn-imprimir-evaluacion-detalle"
              onClick={handlePrint}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Imprimir / Exportar PDF"
            >
              <Printer className="w-4 h-4 text-[#00FF00]" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              id="btn-cerrar-evaluacion-detalle-top"
              onClick={onClose}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible">
          {/* Ficha de Identificación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gradient-to-br from-[#18235C]/5 to-transparent p-4 rounded-xl border border-[#8FA7D6]/30 text-xs">
            <div>
              <span className="text-[#282829]/70 block mb-0.5 font-semibold">Colaborador Evaluado</span>
              <strong className="text-sm text-[#18235C] block">{empleado?.nombre || 'Desconocido'}</strong>
              <span className="text-[11px] text-[#282829]/70">Doc: {empleado?.documento}</span>
            </div>
            <div>
              <span className="text-[#282829]/70 block mb-0.5 font-semibold">Cargo Estructural</span>
              <strong className="text-sm text-[#18235C] block">{cargo?.nombre || 'Desconocido'}</strong>
              <span className="text-[11px] text-[#282829]/70">Código: {cargo?.ficha.identificacion.codigo || 'S/C'}</span>
            </div>
            <div>
              <span className="text-[#282829]/70 block mb-0.5 font-semibold">Evaluador Responsable</span>
              <strong className="text-sm text-[#18235C] block">{evaluador?.nombre || 'Comité de Gestión Humana'}</strong>
              <span className="text-[11px] text-[#282829]/70">Fecha: {evaluacion.fechaCreacion}</span>
            </div>
            <div>
              <span className="text-[#282829]/70 block mb-0.5 font-semibold">Estado del Proceso</span>
              <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20">
                {evaluacion.estado}
              </span>
            </div>
          </div>

          {/* Resumen Cuantitativo de 100 Puntos (3 Preguntas Clave del Documento) */}
          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#8FA7D6]/20">
              <div>
                <h3 className="text-base font-bold text-[#18235C]">
                  Calificación Técnica Consolidada (Escala 100 Pts)
                </h3>
                <p className="text-xs text-[#282829]/70">
                  Responde a las 3 preguntas: 1) ¿Qué logró? 2) ¿Cómo lo logró? 3) ¿Qué debe corregir o desarrollar?
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-[#282829]/70 block">Puntaje Final:</span>
                  <span className="text-2xl font-bold text-[#18235C]">
                    {evaluacion.puntajeFinal} / 100
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#18235C]/10 text-[#18235C] font-bold text-sm border border-[#18235C]/20">
                  {evaluacion.clasificacion}
                </div>
              </div>
            </div>

            {/* Barra Visual Proporcional de los 4 Componentes */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${evaluacion.subtotalResultados}%` }}
                  className="bg-[#18235C] h-full"
                  title={`Resultados: ${evaluacion.subtotalResultados} / 50`}
                />
                <div
                  style={{ width: `${evaluacion.subtotalCompetencias}%` }}
                  className="bg-[#8FA7D6] h-full"
                  title={`Competencias: ${evaluacion.subtotalCompetencias} / 25`}
                />
                <div
                  style={{ width: `${evaluacion.subtotalCumplimiento}%` }}
                  className="bg-amber-500 h-full"
                  title={`Cumplimiento SG-SST: ${evaluacion.subtotalCumplimiento} / 15`}
                />
                <div
                  style={{ width: `${evaluacion.subtotalDesarrollo}%` }}
                  className="bg-slate-400 h-full"
                  title={`Desarrollo: ${evaluacion.subtotalDesarrollo} / 10`}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-[#8FA7D6]/30">
                  <span className="text-[#282829]/70 block text-[11px] font-medium">1. Resultados (50%)</span>
                  <strong className="text-[#18235C] text-sm">{evaluacion.subtotalResultados} / 50 pts</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-[#8FA7D6]/30">
                  <span className="text-[#282829]/70 block text-[11px] font-medium">2. Competencias (25%)</span>
                  <strong className="text-[#18235C] text-sm">{evaluacion.subtotalCompetencias} / 25 pts</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-[#8FA7D6]/30">
                  <span className="text-[#282829]/70 block text-[11px] font-medium">3. SG-SST / Normas (15%)</span>
                  <strong className="text-amber-700 text-sm">{evaluacion.subtotalCumplimiento} / 15 pts</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-[#8FA7D6]/30">
                  <span className="text-[#282829]/70 block text-[11px] font-medium">4. Desarrollo (10%)</span>
                  <strong className="text-[#282829] text-sm">{evaluacion.subtotalDesarrollo} / 10 pts</strong>
                </div>
              </div>
            </div>
          </div>

          {/* PREGUNTA 1: ¿QUÉ LOGRÓ EL COLABORADOR? (Componente 1: Resultados del Cargo - 50%) */}
          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#8FA7D6]/20">
              <Target className="w-5 h-5 text-[#18235C]" />
              <h3 className="text-base font-bold text-[#18235C]">
                1. ¿Qué logró el colaborador? — Resultados del Cargo (50 Puntos)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white">
                    <th className="py-2.5 px-3 font-semibold">Indicador & Fórmula</th>
                    <th className="py-2.5 px-3 font-semibold">Meta</th>
                    <th className="py-2.5 px-3 font-semibold">Real</th>
                    <th className="py-2.5 px-3 font-semibold">% Cumpl.</th>
                    <th className="py-2.5 px-3 font-semibold">Nivel</th>
                    <th className="py-2.5 px-3 font-semibold">Peso</th>
                    <th className="py-2.5 px-3 font-semibold">Puntaje</th>
                    <th className="py-2.5 px-3 font-semibold">Evidencia Verificable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {evaluacion.resultados.map(res => {
                    const cumplimientoPct = res.meta > 0 ? Math.round((res.resultadoReal / res.meta) * 100) : 0;
                    return (
                      <tr key={res.id} className="hover:bg-[#8FA7D6]/10">
                        <td className="py-2.5 px-3">
                          <strong className="block text-[#18235C]">{res.indicadorNombre}</strong>
                          <span className="text-[10px] text-[#282829]/70 font-mono">{res.formula || '—'}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{res.meta} {res.unidad}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#18235C]">{res.resultadoReal} {res.unidad}</td>
                        <td className="py-2.5 px-3 font-bold">{cumplimientoPct}%</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-[#8FA7D6]/30">
                            {getNivelLabel(res.nivelCalculado)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{res.peso}%</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#18235C]">{res.puntajePonderado} pts</td>
                        <td className="py-2.5 px-3 text-[#282829]/70 italic max-w-xs">{res.evidencia || 'Sin evidencia registrada'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PREGUNTA 2: ¿CÓMO LO LOGRÓ? (Componente 2: Competencias - 25%) */}
          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#8FA7D6]/20">
              <UserCheck className="w-5 h-5 text-[#18235C]" />
              <h3 className="text-base font-bold text-[#18235C]">
                2. ¿Cómo lo logró? — Competencias Técnicas y Corporativas (25 Puntos)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white">
                    <th className="py-2.5 px-3 font-semibold">Competencia</th>
                    <th className="py-2.5 px-3 font-semibold">Tipo</th>
                    <th className="py-2.5 px-3 font-semibold">Nivel Requerido</th>
                    <th className="py-2.5 px-3 font-semibold">Calificación</th>
                    <th className="py-2.5 px-3 font-semibold">Conducta Observable</th>
                    <th className="py-2.5 px-3 font-semibold">Evidencia Verificada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {evaluacion.competencias.map(cp => (
                    <tr key={cp.id} className="hover:bg-[#8FA7D6]/10">
                      <td className="py-2.5 px-3 font-bold text-[#18235C]">{cp.competenciaNombre}</td>
                      <td className="py-2.5 px-3 text-[#282829]/70">{cp.tipo}</td>
                      <td className="py-2.5 px-3 font-mono text-[#282829]/70">{cp.nivelRequerido}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          cp.calificacionNivel >= 4 ? 'bg-emerald-100 text-emerald-800' :
                          cp.calificacionNivel === 3 ? 'bg-[#18235C]/10 text-[#18235C]' : 'bg-red-100 text-red-700'
                        }`}>
                          Nivel {cp.calificacionNivel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#282829]/70 max-w-xs">{cp.conductaObservable || '—'}</td>
                      <td className="py-2.5 px-3 text-[#282829]/70 italic max-w-xs">{cp.evidencia || 'Sin evidencia'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PREGUNTA 3: ¿QUÉ DEBE MANTENER Y QUÉ DEBE DESARROLLAR? (SG-SST, Desarrollo y Plan de Mejora) */}
          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#8FA7D6]/20">
              <TrendingUp className="w-5 h-5 text-[#18235C]" />
              <h3 className="text-base font-bold text-[#18235C]">
                3. ¿Qué debe mantener y qué debe desarrollar? — SG-SST, Desarrollo y Plan de Acción
              </h3>
            </div>

            {/* Sub-bloque SST y Cumplimiento */}
            <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6]/30 space-y-3 text-xs">
              <span className="font-bold text-[#18235C] block text-sm">
                Seguridad y Salud en el Trabajo (SG-SST): {evaluacion.cumplimiento.sgSst.nivel} / 5
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 bg-white rounded-lg border border-[#8FA7D6]/30">
                  <span className="text-[#282829]/70 block">Uso de EPP:</span>
                  <strong className={evaluacion.cumplimiento.sgSst.usaEpp ? 'text-emerald-700' : 'text-red-600'}>
                    {evaluacion.cumplimiento.sgSst.usaEpp ? '✓ Cumple' : '✗ No cumple'}
                  </strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#8FA7D6]/30">
                  <span className="text-[#282829]/70 block">Reporte Condiciones:</span>
                  <strong className={evaluacion.cumplimiento.sgSst.reportaCondiciones ? 'text-emerald-700' : 'text-red-600'}>
                    {evaluacion.cumplimiento.sgSst.reportaCondiciones ? '✓ Cumple' : '✗ No cumple'}
                  </strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#8FA7D6]/30">
                  <span className="text-[#282829]/70 block">Trabajo Seguro:</span>
                  <strong className={evaluacion.cumplimiento.sgSst.cumpleTrabajoSeguro ? 'text-emerald-700' : 'text-red-600'}>
                    {evaluacion.cumplimiento.sgSst.cumpleTrabajoSeguro ? '✓ Cumple' : '✗ No cumple'}
                  </strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#8FA7D6]/30">
                  <span className="text-[#282829]/70 block">Capacitaciones:</span>
                  <strong className={evaluacion.cumplimiento.sgSst.participaCapacitaciones ? 'text-emerald-700' : 'text-red-600'}>
                    {evaluacion.cumplimiento.sgSst.participaCapacitaciones ? '✓ Cumple' : '✗ No cumple'}
                  </strong>
                </div>
              </div>
              <p className="text-[#282829]/70 text-[11px]">
                <strong>Evidencia SST:</strong> {evaluacion.cumplimiento.sgSst.evidencia}
              </p>
            </div>

            {/* Plan de Desarrollo y Cierre de Brechas */}
            <div className="space-y-3">
              <span className="font-bold text-[#18235C] block text-sm">
                Compromisos Concertados (Plan de Desarrollo)
              </span>
              <div className="space-y-2">
                {evaluacion.planDesarrollo.map((plan, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-[#8FA7D6]/30 text-xs space-y-1.5">
                    <div className="flex justify-between items-center font-bold text-[#18235C]">
                      <span>{plan.competenciaOIndicador}</span>
                      <span className="text-emerald-700 text-[11px]">Compromiso: {plan.fechaCompromiso}</span>
                    </div>
                    <p className="text-[#282829]/80">
                      <strong>Acción Concreta:</strong> {plan.accionPropuesta}
                    </p>
                    <div className="flex gap-4 text-[11px] text-[#282829]/70 pt-1">
                      <span>Responsable: <strong>{plan.responsable}</strong></span>
                      <span>Evidencia Verificable: <strong>{plan.evidenciaEsperada}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Retroalimentación Concertada */}
            {evaluacion.retroalimentacionTexto && (
              <div className="p-4 bg-slate-50 rounded-lg border border-[#8FA7D6]/30 text-xs space-y-1">
                <strong className="block text-[#18235C]">Acta de Retroalimentación Formal (1 a 1):</strong>
                <p className="text-[#282829]/80 whitespace-pre-line leading-relaxed">
                  {evaluacion.retroalimentacionTexto}
                </p>
              </div>
            )}
          </div>

          {/* Detección de Sesgos & Auditoría de Trazabilidad */}
          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 p-5 space-y-3 text-xs shadow-xs">
            <h3 className="text-base font-bold text-[#18235C]">
              Trazabilidad y Auditoría del Proceso
            </h3>

            {evaluacion.sesgosYAlertas && evaluacion.sesgosYAlertas.length > 0 ? (
              <div className="space-y-2">
                <span className="font-bold text-red-600 block">Alertas Técnicas Detectadas por el Sistema:</span>
                {evaluacion.sesgosYAlertas.map((sg, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
                    {sg.mensaje}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Auditoría limpia: Sin alertas de sesgo, indulgencia o falta de evidencia objetiva.</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#8FA7D6]/20">
              <span className="font-semibold text-[#18235C] block mb-1">Registro de Cambios:</span>
              <ul className="space-y-1 text-[#282829]/70 text-[11px]">
                {evaluacion.historialCambios?.map((h, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-mono text-[#18235C]">{h.fecha}:</span>
                    <span>{h.accion} ({h.usuario})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-[#8FA7D6]/30 px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs text-[#282829]/70">
            B GROUP INGENIERIA S.A.S. — Sistema de Gestión Humana & Evaluación de Desempeño
          </span>
          <button
            id="btn-cerrar-evaluacion-detalle"
            onClick={onClose}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#18235C]/90 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};
