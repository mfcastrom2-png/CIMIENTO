import React, { useState, useEffect } from 'react';
import {
  Cargo,
  Empleado,
  EvaluacionDesempeno,
  EstadoEvaluacion,
  ItemResultadoEvaluacion,
  ItemCompetenciaEvaluacion,
  ComponenteCumplimientoEvaluacion,
  ComponenteDesarrolloEvaluacion,
  ItemPlanDesarrollo,
  PonderacionMultifuente,
  NivelCumplimiento
} from '../types';
import {
  calcularNivelResultado,
  calcularSubtotalResultados,
  calcularSubtotalCompetencias,
  calcularSubtotalCumplimiento,
  calcularSubtotalDesarrollo,
  getClasificacion,
  detectarSesgosYAlertas,
  generarPlanDesarrolloSugerido,
  getNivelLabel
} from '../services/evaluationEngine';
import {
  X,
  Award,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Save,
  Wand2
} from 'lucide-react';
import { uid } from '../data/initialData';

interface EvaluacionFormModalProps {
  cargos: Cargo[];
  empleados: Empleado[];
  evaluacionToEdit?: EvaluacionDesempeno | null;
  onClose: () => void;
  onSave: (evaluacion: EvaluacionDesempeno) => void;
}

export const EvaluacionFormModal: React.FC<EvaluacionFormModalProps> = ({
  cargos,
  empleados,
  evaluacionToEdit,
  onClose,
  onSave,
}) => {
  const [step, setStep] = useState<number>(1);
  const [empleadoId, setEmpleadoId] = useState<string>(
    evaluacionToEdit?.empleadoId || empleados[0]?.id || ''
  );
  const [periodo, setPeriodo] = useState<string>(
    evaluacionToEdit?.periodo || '2026 - S1'
  );
  const [estado, setEstado] = useState<EstadoEvaluacion>(
    evaluacionToEdit?.estado || 'BORRADOR'
  );

  const selectedEmpleado = empleados.find(e => e.id === empleadoId);
  const selectedCargo = cargos.find(c => c.id === selectedEmpleado?.cargoId) || cargos[0];

  // Componente 1: Resultados
  const [resultados, setResultados] = useState<ItemResultadoEvaluacion[]>(
    evaluacionToEdit?.resultados || []
  );

  // Componente 2: Competencias
  const [competencias, setCompetencias] = useState<ItemCompetenciaEvaluacion[]>(
    evaluacionToEdit?.competencias || []
  );

  // Componente 3: Cumplimiento
  const [cumplimiento, setCumplimiento] = useState<ComponenteCumplimientoEvaluacion>(
    evaluacionToEdit?.cumplimiento || {
      cumplimientoProcedimientos: { nivel: 4, peso: 4, evidencia: 'Cumplimiento de protocolos operativos del cargo.' },
      sgSst: {
        nivel: 4,
        peso: 4,
        evidencia: 'Uso de EPP y participación en capacitaciones obligatorias.',
        usaEpp: true,
        reportaCondiciones: true,
        cumpleTrabajoSeguro: true,
        participaCapacitaciones: true
      },
      gestionInformacion: { nivel: 4, peso: 3, evidencia: 'Entrega oportuna de documentación y confidencialidad.' },
      cumplimientoAdministrativo: { nivel: 4, peso: 2, evidencia: 'Cumplimiento de horarios y radicación de soportes.' },
      convivenciaConducta: { nivel: 4, peso: 2, evidencia: 'Trato respetuoso con el equipo de trabajo.' },
      totalObtenido: 12
    }
  );

  // Componente 4: Desarrollo
  const [desarrollo, setDesarrollo] = useState<ComponenteDesarrolloEvaluacion>(
    evaluacionToEdit?.desarrollo || {
      cumplimientoPlanAnterior: { nivel: 4, peso: 4, detalle: 'Cumplió los compromisos pactados en la sesión anterior.' },
      aprendizajeCapacitacion: { nivel: 4, peso: 3, detalle: 'Participó activamente en los talleres programados.' },
      iniciativasMejora: { nivel: 4, peso: 3, detalle: 'Aportó sugerencias para la optimización de procesos.' },
      totalObtenido: 8
    }
  );

  // Multifuente
  const [multifuente, setMultifuente] = useState<PonderacionMultifuente>(
    evaluacionToEdit?.multifuente || {
      jefePeso: 70,
      autoevaluacionPeso: 15,
      paresPeso: 15,
      clientesPeso: 0
    }
  );

  const [retroalimentacion, setRetroalimentacion] = useState<string>(
    evaluacionToEdit?.retroalimentacionTexto || ''
  );
  const [planDesarrollo, setPlanDesarrollo] = useState<ItemPlanDesarrollo[]>(
    evaluacionToEdit?.planDesarrollo || []
  );

  // Si cambia el empleado y no estamos editando una existente, inicializar desde su cargo
  useEffect(() => {
    if (!evaluacionToEdit && selectedCargo && selectedCargo.ficha) {
      // 1. Inicializar indicadores desde ficha
      const f = selectedCargo.ficha;
      const indicadores = f.indicadores || [];
      const competenciasList = f.competencias || [];

      const initialRes: ItemResultadoEvaluacion[] = indicadores.map((ind, idx) => {
        const peso = ind.pesoSugerido || (indicadores.length ? Math.round(50 / indicadores.length) : 10);
        return {
          id: 'res_' + idx,
          indicadorNombre: ind.nombre,
          formula: ind.formula,
          unidad: ind.unidad,
          meta: ind.unidad === '%' ? 95 : 5,
          resultadoReal: ind.unidad === '%' ? 95 : 5,
          evidencia: '',
          peso: peso,
          nivelCalculado: 3,
          puntajePonderado: (3 / 5) * peso,
          observacion: ''
        };
      });
      setResultados(initialRes);

      // 2. Inicializar competencias desde ficha
      const initialComp: ItemCompetenciaEvaluacion[] = competenciasList.map((cp, idx) => {
        return {
          id: 'cp_' + idx,
          competenciaNombre: cp.nombre,
          tipo: cp.tipo,
          nivelRequerido: cp.nivel,
          calificacionNivel: 3,
          conductaObservable: cp.conductas || 'Cumple el comportamiento esperado en condiciones normales.',
          evidencia: '',
          observacion: ''
        };
      });
      setCompetencias(initialComp);
    }
  }, [empleadoId, evaluacionToEdit, selectedCargo]);

  // Cálculos reactivos en tiempo real
  const subResultados = calcularSubtotalResultados(resultados);
  const subCompetencias = calcularSubtotalCompetencias(competencias);
  const subCumplimiento = calcularSubtotalCumplimiento(cumplimiento);
  const subDesarrollo = calcularSubtotalDesarrollo(desarrollo);
  const puntajeTotal = Math.min(100, Math.round((subResultados + subCompetencias + subCumplimiento + subDesarrollo) * 10) / 10);
  const clasificacion = getClasificacion(puntajeTotal);

  // Detección de sesgos e inconsistencias
  const sesgos = detectarSesgosYAlertas(resultados, competencias, cumplimiento);

  // Handlers para actualizar componentes individuales
  const handleResultadoChange = (index: number, field: keyof ItemResultadoEvaluacion, value: any) => {
    const updated = [...resultados];
    updated[index] = { ...updated[index], [field]: value };

    // Si cambió meta o resultadoReal, recalcular nivel y puntaje
    if (field === 'meta' || field === 'resultadoReal') {
      const meta = field === 'meta' ? Number(value) : updated[index].meta;
      const real = field === 'resultadoReal' ? Number(value) : updated[index].resultadoReal;
      const nivel = calcularNivelResultado(meta, real);
      updated[index].nivelCalculado = nivel;
      updated[index].puntajePonderado = Math.round(((nivel / 5) * updated[index].peso) * 10) / 10;
    }
    setResultados(updated);
  };

  const handleCompetenciaChange = (index: number, field: keyof ItemCompetenciaEvaluacion, value: any) => {
    const updated = [...competencias];
    updated[index] = { ...updated[index], [field]: value };
    setCompetencias(updated);
  };

  const handleAutoGenerarPlan = () => {
    const sugerido = generarPlanDesarrolloSugerido(resultados, competencias);
    setPlanDesarrollo(sugerido);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const evaluacionFinal: EvaluacionDesempeno = {
      id: evaluacionToEdit?.id || `EVA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      empleadoId,
      cargoId: selectedCargo.id,
      periodo,
      evaluadorId: 'e1', // Administrador / Jefe evaluador
      fechaCreacion: evaluacionToEdit?.fechaCreacion || new Date().toISOString().slice(0, 10),
      fechaCierre: estado === 'CERRADA' ? (evaluacionToEdit?.fechaCierre || new Date().toISOString().slice(0, 10)) : undefined,
      estado,
      multifuente,
      resultados,
      competencias,
      cumplimiento: {
        ...cumplimiento,
        totalObtenido: subCumplimiento
      },
      desarrollo: {
        ...desarrollo,
        totalObtenido: subDesarrollo
      },
      subtotalResultados: subResultados,
      subtotalCompetencias: subCompetencias,
      subtotalCumplimiento: subCumplimiento,
      subtotalDesarrollo: subDesarrollo,
      puntajeFinal: puntajeTotal,
      clasificacion,
      sesgosYAlertas: sesgos,
      retroalimentacionTexto: retroalimentacion,
      planDesarrollo,
      historialCambios: [
        ...(evaluacionToEdit?.historialCambios || []),
        {
          fecha: new Date().toISOString().slice(0, 10),
          usuario: 'Administrador (Gestión Humana)',
          accion: `Actualización de evaluación técnica en estado ${estado}`,
          estadoAnterior: evaluacionToEdit?.estado || '—',
          estadoNuevo: estado
        }
      ]
    };

    onSave(evaluacionFinal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-[#8FA7D6]/40 max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-[#18235C] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00FF00]" />
              <h2 className="text-xl font-bold tracking-wide">
                {evaluacionToEdit ? 'Editar Evaluación Técnica' : 'Nueva Evaluación de Desempeño'}
              </h2>
            </div>
            <p className="text-xs text-[#8FA7D6] mt-0.5">
              Modelo técnico objetivo de 100 puntos derivado de la ficha del cargo · B GROUP
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Score Pill */}
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-2">
              <span className="text-[11px] text-[#8FA7D6] uppercase font-bold">Puntaje:</span>
              <span className="text-lg font-bold text-[#00FF00]">
                {puntajeTotal} / 100
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-white/20 text-white">
                {clasificacion}
              </span>
            </div>

            <button
              id="btn-cerrar-evaluacion-form"
              onClick={onClose}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Steps Navigation Bar */}
        <div className="bg-slate-50 border-b border-[#8FA7D6]/30 px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 text-xs font-semibold">
          {[
            { num: 1, label: '1. Empleado' },
            { num: 2, label: '2. Resultados (50%)' },
            { num: 3, label: '3. Competencias (25%)' },
            { num: 4, label: '4. SG-SST (15%)' },
            { num: 5, label: '5. Desarrollo (10%)' },
            { num: 6, label: '6. IA & Plan' },
          ].map(s => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                step === s.num
                  ? 'bg-[#18235C] text-white shadow-xs'
                  : 'text-[#282829]/70 hover:bg-[#8FA7D6]/20 hover:text-[#18235C]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* STEP 1: EMPLEADO Y PERIODO */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#18235C]/5 to-transparent p-3 rounded-lg border border-[#8FA7D6]/30 text-[#18235C] text-xs">
                <strong>Fundamento del Modelo Institucional B GROUP:</strong> "El modelo debe ser derivado del cargo, no una evaluación genérica de competencias más opinión del jefe. La lógica es: Cargo → Funciones → Resultados → Indicadores → Competencias → Evidencias → Evaluación → Plan de mejora."
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#5B6A62] mb-1">
                    Colaborador a Evaluar *
                  </label>
                  <select
                    disabled={!!evaluacionToEdit}
                    value={empleadoId}
                    onChange={e => setEmpleadoId(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#DCD6C8] bg-white font-medium"
                  >
                    {empleados.map(emp => {
                      const c = cargos.find(cg => cg.id === emp.cargoId);
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre} — {c?.nombre || 'Sin cargo'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#5B6A62] mb-1">
                    Periodo de Evaluación *
                  </label>
                  <input
                    type="text"
                    value={periodo}
                    onChange={e => setPeriodo(e.target.value)}
                    placeholder="Ej. 2026 - S1"
                    className="w-full p-2.5 rounded border border-[#DCD6C8] bg-white font-medium"
                  />
                </div>
              </div>

              {/* Ficha resumen del cargo asociado */}
              <div className="bg-[#F6F4EF] p-4 rounded border border-[#DCD6C8] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2A24] text-sm">
                    Ficha Técnica Vinculada: {selectedCargo?.nombre}
                  </span>
                  <span className="font-mono text-[#5B6A62]">
                    Código: {selectedCargo?.ficha.identificacion.codigo || 'S/C'}
                  </span>
                </div>
                <p className="text-[#5B6A62]">
                  <strong>Propósito del cargo:</strong> {selectedCargo?.ficha.proposito}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DCD6C8]/60 text-[11px]">
                  <div>
                    <span className="text-[#5B6A62] block">Indicadores del cargo:</span>
                    <strong className="text-[#2F5D50]">{selectedCargo?.ficha?.indicadores?.length || 0} definidos</strong>
                  </div>
                  <div>
                    <span className="text-[#5B6A62] block">Competencias a evaluar:</span>
                    <strong className="text-[#2F5D50]">{selectedCargo?.ficha?.competencias?.length || 0} requeridas</strong>
                  </div>
                  <div>
                    <span className="text-[#5B6A62] block">Funciones esenciales:</span>
                    <strong className="text-[#2F5D50]">{selectedCargo?.ficha?.funciones?.length || 0} funciones</strong>
                  </div>
                </div>
              </div>

              {/* Flujo de Estados */}
              <div>
                <label className="block text-xs font-semibold text-[#5B6A62] mb-1">
                  Estado Actual de la Evaluación
                </label>
                <select
                  value={estado}
                  onChange={e => setEstado(e.target.value as EstadoEvaluacion)}
                  className="w-full text-xs p-2.5 rounded border border-[#DCD6C8] bg-white font-semibold text-[#1E2A24]"
                >
                  <option value="BORRADOR">BORRADOR (En preparación por RRHH)</option>
                  <option value="AUTOEVALUACION">AUTOEVALUACIÓN (Habilitada para el colaborador)</option>
                  <option value="EVALUACION_JEFE">EVALUACIÓN DEL JEFE (Calificación técnica)</option>
                  <option value="VALIDACION">VALIDACIÓN (Detección de sesgos y auditoría de evidencias)</option>
                  <option value="RETROALIMENTACION">RETROALIMENTACIÓN (Sesión 1 a 1 de concertación)</option>
                  <option value="PLAN_DESARROLLO">PLAN DE DESARROLLO (Compromisos pactados)</option>
                  <option value="APROBADA">APROBADA (Firmada por ambas partes)</option>
                  <option value="CERRADA">CERRADA (Inmutable con trazabilidad permanente)</option>
                </select>
                <p className="text-[11px] text-[#5B6A62] mt-1">
                  El ciclo asegura trazabilidad: una vez cerrada, no se modifica directamente y cualquier ajuste genera auditoría.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: COMPONENTE 1 - RESULTADOS DEL CARGO (50%) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCD6C8]">
                <div>
                  <h3 className="font-serif-title text-base font-medium text-[#1E2A24]">
                    Componente 1 — Resultados del Cargo (Peso: 50%)
                  </h3>
                  <p className="text-xs text-[#5B6A62]">
                    Escala de cumplimiento: ≥110% (5 - Excepcional) | 100-109% (4 - Superior) | 90-99% (3 - Esperado) | 70-89% (2 - En desarrollo) | &lt;70% (1 - Crítico)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5B6A62] block font-medium">Subtotal Resultados:</span>
                  <span className="font-serif-title text-xl font-bold text-[#2F5D50]">
                    {subResultados} / 50 pts
                  </span>
                </div>
              </div>

              {resultados.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5B6A62] bg-[#F6F4EF] rounded border border-[#DCD6C8]">
                  Este cargo no tiene indicadores registrados en su manual. Regresa al Manual de Cargos para definir sus indicadores técnicos.
                </div>
              ) : (
                <div className="space-y-4">
                  {resultados.map((res, idx) => {
                    const cumplimientoPct = res.meta > 0 ? Math.round((res.resultadoReal / res.meta) * 100) : 0;
                    return (
                      <div key={res.id} className="p-4 rounded border border-[#DCD6C8] bg-white space-y-3 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-sm text-[#1E2A24] block">
                              {res.indicadorNombre}
                            </span>
                            <span className="text-[11px] text-[#5B6A62] font-mono">
                              Fórmula: {res.formula || 'Registro numérico directo'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E4EDE9] text-[#2F5D50]">
                              Peso: {res.peso}%
                            </span>
                            <span className="text-xs font-bold text-[#1E2A24] bg-[#F6F4EF] px-2.5 py-1 rounded border border-[#DCD6C8]">
                              Aporte: {res.puntajePonderado} pts
                            </span>
                          </div>
                        </div>

                        {/* Metas y Resultados */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-[#5B6A62] mb-1">
                              Meta Pactada ({res.unidad})
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={res.meta}
                              onChange={e => handleResultadoChange(idx, 'meta', e.target.value)}
                              className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF] font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#5B6A62] mb-1">
                              Resultado Real ({res.unidad})
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={res.resultadoReal}
                              onChange={e => handleResultadoChange(idx, 'resultadoReal', e.target.value)}
                              className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF] font-bold text-[#2F5D50]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#5B6A62] mb-1">
                              Cumplimiento (%)
                            </label>
                            <div className="p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF] font-bold text-[#1E2A24]">
                              {cumplimientoPct}%
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-[#5B6A62] mb-1">
                              Nivel Calculado
                            </label>
                            <div className="p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF] font-semibold text-xs text-[#2F5D50]">
                              {getNivelLabel(res.nivelCalculado)}
                            </div>
                          </div>
                        </div>

                        {/* Evidencia Obligatoria */}
                        <div>
                          <label className="block text-[11px] font-semibold text-[#5B6A62] mb-1">
                            Evidencia Verificable (Obligatorio: Reporte, OT, Ticket, Informe) *
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Reporte del sistema de órdenes OT-2026-09"
                            value={res.evidencia}
                            onChange={e => handleResultadoChange(idx, 'evidencia', e.target.value)}
                            className="w-full text-xs p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: COMPONENTE 2 - COMPETENCIAS (25%) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCD6C8]">
                <div>
                  <h3 className="font-serif-title text-base font-medium text-[#1E2A24]">
                    Componente 2 — Competencias del Cargo (Peso: 25%)
                  </h3>
                  <p className="text-xs text-[#5B6A62]">
                    Evaluación por conductas observables: se evitan preguntas subjetivas genéricas y se requiere evidencia objetiva.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5B6A62] block font-medium">Subtotal Competencias:</span>
                  <span className="font-serif-title text-xl font-bold text-[#2F5D50]">
                    {subCompetencias} / 25 pts
                  </span>
                </div>
              </div>

              {competencias.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5B6A62] bg-[#F6F4EF] rounded border border-[#DCD6C8]">
                  Este cargo no tiene competencias asociadas en su manual. Regresa al Manual de Cargos para definirlas.
                </div>
              ) : (
                <div className="space-y-4">
                  {competencias.map((comp, idx) => (
                    <div key={comp.id} className="p-4 rounded border border-[#DCD6C8] bg-white space-y-3 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-[#1E2A24] block">
                            {comp.competenciaNombre}
                          </span>
                          <div className="flex gap-2 text-[11px] text-[#5B6A62] mt-0.5">
                            <span>Tipo: <strong>{comp.tipo}</strong></span>
                            <span>·</span>
                            <span>Nivel Requerido: <strong>{comp.nivelRequerido}</strong></span>
                          </div>
                        </div>

                        {/* Selector de Nivel 1 a 5 */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-[#5B6A62]">Calificación:</label>
                          <select
                            value={comp.calificacionNivel}
                            onChange={e => handleCompetenciaChange(idx, 'calificacionNivel', Number(e.target.value) as NivelCumplimiento)}
                            className="text-xs font-bold p-1.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                          >
                            <option value={5}>5 — Excepcional (Anticipa y supera)</option>
                            <option value={4}>4 — Superior (Cumple y comunica claro)</option>
                            <option value={3}>3 — Esperado (Comportamiento normal)</option>
                            <option value={2}>2 — En desarrollo (Dificultades recurrentes)</option>
                            <option value={1}>1 — Crítico (Afecta negativamente)</option>
                          </select>
                        </div>
                      </div>

                      {/* Conducta Observable Descriptiva */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5B6A62] mb-1">
                          Conducta Observable Demostrada durante el Periodo
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Describa comportamientos específicos observados..."
                          value={comp.conductaObservable}
                          onChange={e => handleCompetenciaChange(idx, 'conductaObservable', e.target.value)}
                          className="w-full text-xs p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                        />
                      </div>

                      {/* Evidencia y Observación */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#5B6A62] mb-1">
                            Evidencia Objetiva Registrada * (Ej. Caso PQR, acta, certificado)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Caso PQR-2026-0198 felicitación de cliente"
                            value={comp.evidencia}
                            onChange={e => handleCompetenciaChange(idx, 'evidencia', e.target.value)}
                            className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#5B6A62] mb-1">
                            Observación / Contexto del Evaluador
                          </label>
                          <input
                            type="text"
                            placeholder="Comentario de retroalimentación constructiva"
                            value={comp.observacion}
                            onChange={e => handleCompetenciaChange(idx, 'observacion', e.target.value)}
                            className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: COMPONENTE 3 - RESPONSABILIDADES Y CUMPLIMIENTO (15%) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCD6C8]">
                <div>
                  <h3 className="font-serif-title text-base font-medium text-[#1E2A24]">
                    Componente 3 — Responsabilidades y Cumplimiento (Peso: 15%)
                  </h3>
                  <p className="text-xs text-[#5B6A62]">
                    Aspectos transversales con evidencia y contexto. No penaliza accidentes per se, sino cumplimiento de normas y EPP.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5B6A62] block font-medium">Subtotal Cumplimiento:</span>
                  <span className="font-serif-title text-xl font-bold text-[#2F5D50]">
                    {subCumplimiento} / 15 pts
                  </span>
                </div>
              </div>

              {/* SG-SST (4 pts) */}
              <div className="p-4 rounded border border-[#DCD6C8] bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#1E2A24] block">
                      Seguridad y Salud en el Trabajo (SG-SST) — 4%
                    </span>
                    <span className="text-[11px] text-[#5B6A62]">
                      Evaluación de autocuidado, reporte y trabajo seguro.
                    </span>
                  </div>
                  <select
                    value={cumplimiento.sgSst.nivel}
                    onChange={e => setCumplimiento({
                      ...cumplimiento,
                      sgSst: { ...cumplimiento.sgSst, nivel: Number(e.target.value) as NivelCumplimiento }
                    })}
                    className="text-xs font-bold p-1.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                  >
                    <option value={5}>Nivel 5 (Excelente cumplimiento SST)</option>
                    <option value={4}>Nivel 4 (Cumple estándares seguros)</option>
                    <option value={3}>Nivel 3 (Cumplimiento básico)</option>
                    <option value={2}>Nivel 2 (Observaciones de seguridad)</option>
                    <option value={1}>Nivel 1 (Fallas graves en uso de EPP)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <label className="flex items-center gap-2 p-2 rounded bg-[#F6F4EF] border border-[#DCD6C8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cumplimiento.sgSst.usaEpp}
                      onChange={e => setCumplimiento({
                        ...cumplimiento,
                        sgSst: { ...cumplimiento.sgSst, usaEpp: e.target.checked }
                      })}
                      className="rounded text-[#2F5D50]"
                    />
                    <span>Usa EPP completos</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-[#F6F4EF] border border-[#DCD6C8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cumplimiento.sgSst.reportaCondiciones}
                      onChange={e => setCumplimiento({
                        ...cumplimiento,
                        sgSst: { ...cumplimiento.sgSst, reportaCondiciones: e.target.checked }
                      })}
                      className="rounded text-[#2F5D50]"
                    />
                    <span>Reporta condiciones inseguras</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-[#F6F4EF] border border-[#DCD6C8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cumplimiento.sgSst.cumpleTrabajoSeguro}
                      onChange={e => setCumplimiento({
                        ...cumplimiento,
                        sgSst: { ...cumplimiento.sgSst, cumpleTrabajoSeguro: e.target.checked }
                      })}
                      className="rounded text-[#2F5D50]"
                    />
                    <span>Trabajo seguro en alturas/sitio</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-[#F6F4EF] border border-[#DCD6C8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cumplimiento.sgSst.participaCapacitaciones}
                      onChange={e => setCumplimiento({
                        ...cumplimiento,
                        sgSst: { ...cumplimiento.sgSst, participaCapacitaciones: e.target.checked }
                      })}
                      className="rounded text-[#2F5D50]"
                    />
                    <span>Capacitaciones obligatorias</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5B6A62] mb-1">
                    Evidencia en SST (Inspecciones de campo, reporte de condiciones)
                  </label>
                  <input
                    type="text"
                    value={cumplimiento.sgSst.evidencia}
                    onChange={e => setCumplimiento({
                      ...cumplimiento,
                      sgSst: { ...cumplimiento.sgSst, evidencia: e.target.value }
                    })}
                    className="w-full text-xs p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  />
                </div>
              </div>

              {/* Procedimientos y Gestión de Información */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded border border-[#DCD6C8] bg-white space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1E2A24]">Cumplimiento de Procedimientos (4%)</span>
                    <select
                      value={cumplimiento.cumplimientoProcedimientos.nivel}
                      onChange={e => setCumplimiento({
                        ...cumplimiento,
                        cumplimientoProcedimientos: { ...cumplimiento.cumplimientoProcedimientos, nivel: Number(e.target.value) as NivelCumplimiento }
                      })}
                      className="font-bold p-1 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Evidencia de apego a manuales y protocolos..."
                    value={cumplimiento.cumplimientoProcedimientos.evidencia}
                    onChange={e => setCumplimiento({
                      ...cumplimiento,
                      cumplimientoProcedimientos: { ...cumplimiento.cumplimientoProcedimientos, evidencia: e.target.value }
                    })}
                    className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  />
                </div>

                <div className="p-3.5 rounded border border-[#DCD6C8] bg-white space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1E2A24]">Gestión de Información & Datos (3%)</span>
                    <select
                      value={cumplimiento.gestionInformacion.nivel}
                      onChange={e => setCumplimiento({
                        ...cumplimiento,
                        gestionInformacion: { ...cumplimiento.gestionInformacion, nivel: Number(e.target.value) as NivelCumplimiento }
                      })}
                      className="font-bold p-1 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Evidencia de confidencialidad y registro oportuno..."
                    value={cumplimiento.gestionInformacion.evidencia}
                    onChange={e => setCumplimiento({
                      ...cumplimiento,
                      gestionInformacion: { ...cumplimiento.gestionInformacion, evidencia: e.target.value }
                    })}
                    className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  />
                </div>
              </div>

              {/* Administrativo y Convivencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded border border-[#DCD6C8] bg-white space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1E2A24]">Cumplimiento Administrativo (2%)</span>
                    <select
                      value={cumplimiento.cumplimientoAdministrativo.nivel}
                      onChange={e => setCumplimiento({
                        ...cumplimiento,
                        cumplimientoAdministrativo: { ...cumplimiento.cumplimientoAdministrativo, nivel: Number(e.target.value) as NivelCumplimiento }
                      })}
                      className="font-bold p-1 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Puntualidad, entrega de novedades de nómina..."
                    value={cumplimiento.cumplimientoAdministrativo.evidencia}
                    onChange={e => setCumplimiento({
                      ...cumplimiento,
                      cumplimientoAdministrativo: { ...cumplimiento.cumplimientoAdministrativo, evidencia: e.target.value }
                    })}
                    className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  />
                </div>

                <div className="p-3.5 rounded border border-[#DCD6C8] bg-white space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1E2A24]">Convivencia y Conducta Laboral (2%)</span>
                    <select
                      value={cumplimiento.convivenciaConducta.nivel}
                      onChange={e => setCumplimiento({
                        ...cumplimiento,
                        convivenciaConducta: { ...cumplimiento.convivenciaConducta, nivel: Number(e.target.value) as NivelCumplimiento }
                      })}
                      className="font-bold p-1 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Relacionamiento asertivo con compañeros y clientes..."
                    value={cumplimiento.convivenciaConducta.evidencia}
                    onChange={e => setCumplimiento({
                      ...cumplimiento,
                      convivenciaConducta: { ...cumplimiento.convivenciaConducta, evidencia: e.target.value }
                    })}
                    className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: COMPONENTE 4 - DESARROLLO Y MEJORA (10%) */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCD6C8]">
                <div>
                  <h3 className="font-serif-title text-base font-medium text-[#1E2A24]">
                    Componente 4 — Desarrollo y Mejora (Peso: 10%)
                  </h3>
                  <p className="text-xs text-[#5B6A62]">
                    Asegura que la evaluación no sea puramente punitiva, reconociendo el aprendizaje y las propuestas de optimización.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5B6A62] block font-medium">Subtotal Desarrollo:</span>
                  <span className="font-serif-title text-xl font-bold text-[#2F5D50]">
                    {subDesarrollo} / 10 pts
                  </span>
                </div>
              </div>

              {/* Cumplimiento del plan anterior (4%) */}
              <div className="p-4 rounded border border-[#DCD6C8] bg-white space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E2A24] block">Cumplimiento del Plan de Desarrollo Anterior (4%)</span>
                    <span className="text-[11px] text-[#5B6A62]">Avance en los compromisos concertados en el ciclo previo.</span>
                  </div>
                  <select
                    value={desarrollo.cumplimientoPlanAnterior.nivel}
                    onChange={e => setDesarrollo({
                      ...desarrollo,
                      cumplimientoPlanAnterior: { ...desarrollo.cumplimientoPlanAnterior, nivel: Number(e.target.value) as NivelCumplimiento }
                    })}
                    className="font-bold p-1.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={desarrollo.cumplimientoPlanAnterior.detalle}
                  onChange={e => setDesarrollo({
                    ...desarrollo,
                    cumplimientoPlanAnterior: { ...desarrollo.cumplimientoPlanAnterior, detalle: e.target.value }
                  })}
                  className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  placeholder="Detalle los compromisos cumplidos..."
                />
              </div>

              {/* Aprendizaje / Capacitación (3%) */}
              <div className="p-4 rounded border border-[#DCD6C8] bg-white space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E2A24] block">Aprendizaje y Capacitación Continua (3%)</span>
                    <span className="text-[11px] text-[#5B6A62]">Aprobación de cursos, certificaciones o entrenamientos técnicos.</span>
                  </div>
                  <select
                    value={desarrollo.aprendizajeCapacitacion.nivel}
                    onChange={e => setDesarrollo({
                      ...desarrollo,
                      aprendizajeCapacitacion: { ...desarrollo.aprendizajeCapacitacion, nivel: Number(e.target.value) as NivelCumplimiento }
                    })}
                    className="font-bold p-1.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={desarrollo.aprendizajeCapacitacion.detalle}
                  onChange={e => setDesarrollo({
                    ...desarrollo,
                    aprendizajeCapacitacion: { ...desarrollo.aprendizajeCapacitacion, detalle: e.target.value }
                  })}
                  className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  placeholder="Cursos aprobados, nuevas herramientas aprendidas..."
                />
              </div>

              {/* Iniciativas de Mejora (3%) */}
              <div className="p-4 rounded border border-[#DCD6C8] bg-white space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E2A24] block">Iniciativas de Mejora y Aportes Proactivos (3%)</span>
                    <span className="text-[11px] text-[#5B6A62]">Propuestas concretas implementadas que redujeron reprocesos o costos.</span>
                  </div>
                  <select
                    value={desarrollo.iniciativasMejora.nivel}
                    onChange={e => setDesarrollo({
                      ...desarrollo,
                      iniciativasMejora: { ...desarrollo.iniciativasMejora, nivel: Number(e.target.value) as NivelCumplimiento }
                    })}
                    className="font-bold p-1.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#2F5D50]"
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={desarrollo.iniciativasMejora.detalle}
                  onChange={e => setDesarrollo({
                    ...desarrollo,
                    iniciativasMejora: { ...desarrollo.iniciativasMejora, detalle: e.target.value }
                  })}
                  className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  placeholder="Ej. Propuso lista de verificación de configuración Wi-Fi que disminuyó reprocesos en un 18%."
                />
              </div>
            </div>
          )}

          {/* STEP 6: ASISTENTE IA, DETECCIÓN DE SESGOS Y PLAN DE DESARROLLO */}
          {step === 6 && (
            <div className="space-y-5">
              {/* Detección de Sesgos (Páginas 9-10 del documento) */}
              <div className="p-4 rounded border border-[#DCD6C8] bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-[#B5842A]" />
                    <h3 className="font-serif-title text-base font-medium text-[#1E2A24]">
                      Auditoría Técnica y Detección de Sesgos (Asistente IA)
                    </h3>
                  </div>
                  <span className="text-xs text-[#5B6A62]">
                    {sesgos.length === 0 ? 'Sin inconsistencias' : `${sesgos.length} alerta(s) identificada(s)`}
                  </span>
                </div>

                {sesgos.length === 0 ? (
                  <div className="p-3 bg-[#E4EDE9] text-[#2F5D50] rounded border border-[#2F5D50]/20 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Evaluación consistente: todos los indicadores y competencias sobresalientes cuentan con evidencias registradas y no se detecta efecto halo ni discrepancia en fórmulas.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sesgos.map((sg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded border text-xs flex items-start gap-2 ${
                          sg.severidad === 'alta'
                            ? 'bg-[#F3E3DE] border-[#A8503E]/30 text-[#A8503E]'
                            : 'bg-[#F5EAD4] border-[#B5842A]/30 text-[#B5842A]'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block mb-0.5">
                            {sg.tipo === 'FaltaEvidencia' && 'Revisión requerida: Calificación sin evidencia objetiva'}
                            {sg.tipo === 'EfectoHalo' && 'Advertencia: Posible efecto halo / indulgencia'}
                            {sg.tipo === 'InconsistenciaFormula' && 'Inconsistencia técnica en fórmula'}
                          </strong>
                          <span>{sg.mensaje}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plan de Desarrollo Automático (Páginas 10-11 del documento) */}
              <div className="p-4 rounded border border-[#DCD6C8] bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif-title text-base font-medium text-[#1E2A24]">
                      Plan de Desarrollo y Cierre de Brechas
                    </h3>
                    <p className="text-xs text-[#5B6A62]">
                      Estructura: Competencia / Brecha → Causa → Acción → Responsable → Fecha → Evidencia.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerarPlan}
                    className="px-3 py-1.5 bg-[#B5842A] hover:bg-[#966b1e] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generar con IA sugerida</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {planDesarrollo.map((p, idx) => (
                    <div key={p.id || idx} className="p-3 bg-[#F6F4EF] rounded border border-[#DCD6C8] text-xs space-y-2">
                      <div className="flex justify-between font-semibold text-[#1E2A24]">
                        <span>{p.competenciaOIndicador}</span>
                        <span className="text-[#2F5D50]">Fecha límite: {p.fechaCompromiso}</span>
                      </div>
                      <p className="text-[#5B6A62]">
                        <strong>Acción propuesta:</strong> {p.accionPropuesta}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5B6A62] pt-1 border-t border-[#DCD6C8]/60">
                        <span>Responsable: <strong>{p.responsable}</strong></span>
                        <span>Evidencia esperada: <strong>{p.evidenciaEsperada}</strong></span>
                      </div>
                    </div>
                  ))}
                  {planDesarrollo.length === 0 && (
                    <div className="py-6 text-center text-xs text-[#5B6A62]">
                      No hay acciones registradas en el plan de desarrollo. Haz clic en "Generar con IA sugerida" para crearlas según las brechas detectadas.
                    </div>
                  )}
                </div>
              </div>

              {/* Retroalimentación General del Evaluador */}
              <div className="p-4 rounded border border-[#DCD6C8] bg-white space-y-2 text-xs shadow-xs">
                <label className="block font-semibold text-[#1E2A24]">
                  Retroalimentación Cualitativa Formal (Acta de la sesión de feedback)
                </label>
                <textarea
                  rows={4}
                  value={retroalimentacion}
                  onChange={e => setRetroalimentacion(e.target.value)}
                  className="w-full p-3 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  placeholder="Escriba el resumen concertado con el colaborador respondiendo a: ¿Qué logró? ¿Cómo lo logró? y ¿Qué debe desarrollar?..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-[#8FA7D6]/30 px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                id="btn-evaluacion-form-prev"
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-3.5 py-2 text-xs font-semibold text-[#282829]/70 hover:bg-[#8FA7D6]/20 hover:text-[#18235C] rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 6 ? (
              <button
                id="btn-evaluacion-form-next"
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 bg-[#18235C] hover:bg-[#18235C]/90 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Siguiente paso</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-evaluacion-form-save"
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 bg-[#18235C] hover:bg-[#18235C]/90 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4 text-[#00FF00]" />
                <span>Guardar Evaluación ({puntajeTotal} pts)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
