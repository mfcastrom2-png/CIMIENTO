import {
  IndicadorSST,
  MedicionIndicadorSST,
  SemaforoResultado,
  SentidoIndicadorSST
} from '../types';
import {
  procesarCalculoIndicador,
  ResultadoEvaluacionMotor,
  validarSintaxisFormula
} from '../utils/motorCalculoIndicadores';

export { procesarCalculoIndicador, validarSintaxisFormula };
export type { ResultadoEvaluacionMotor };

export interface CalculoMedicionResultado {
  resultadoNumerico: number | null;
  resultadoFormateado: string;
  semaforo: SemaforoResultado;
  cumpleMeta: boolean;
  razon?: string;
}

/**
 * Motor de Cálculo Paramétrico de Indicadores SG-SST
 * Delega en motorCalculoIndicadores para evaluación matemática dinámica segura.
 */
export function calcularResultadoMedicion(
  numerador: number | string | undefined | null,
  denominador: number | string | undefined | null,
  factor: number = 100,
  meta: number,
  limiteAmarillo: number,
  sentido: SentidoIndicadorSST = 'Mayor es mejor',
  unidadMedida: string = '%',
  rangoMin?: number,
  rangoMax?: number,
  formulaTexto?: string
): CalculoMedicionResultado {
  const res = procesarCalculoIndicador({
    numerador,
    denominador,
    factorMultiplicador: factor,
    meta,
    limiteAmarillo,
    sentido,
    unidadMedida,
    rangoMin,
    rangoMax,
    formulaTexto
  });

  return {
    resultadoNumerico: res.resultadoNumerico,
    resultadoFormateado: res.resultadoFormateado,
    semaforo: res.semaforo,
    cumpleMeta: res.cumpleMeta,
    razon: res.razonTecnica
  };
}

export interface AnalisisComparativoIndicador {
  medicionActual: MedicionIndicadorSST | null;
  medicionAnterior: MedicionIndicadorSST | null;
  medicionAnoAnterior: MedicionIndicadorSST | null;
  promedioHistorico: number | null;
  totalMedicionesValidas: number;
  variacionPeriodoAnterior: number | null;
  tendencia: 'Mejora' | 'Estable' | 'Deterioro' | 'Sin datos suficientes';
  interpretacionObjetiva: string;
  alertasDetectadas: string[];
}

/**
 * Genera análisis comparativo objetivo y tendencias históricas sin especular causas
 */
export function generarAnalisisComparativo(
  indicador: IndicadorSST,
  todasMediciones: MedicionIndicadorSST[]
): AnalisisComparativoIndicador {
  const medList = todasMediciones
    .filter(m => m.indicadorId === indicador.id)
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  if (medList.length === 0) {
    return {
      medicionActual: null,
      medicionAnterior: null,
      medicionAnoAnterior: null,
      promedioHistorico: null,
      totalMedicionesValidas: 0,
      variacionPeriodoAnterior: null,
      tendencia: 'Sin datos suficientes',
      interpretacionObjetiva: 'Información insuficiente: No existen mediciones registradas para evaluar el comportamiento del indicador.',
      alertasDetectadas: ['El indicador no cuenta con mediciones registradas en el sistema.']
    };
  }

  const medicionActual = medList[medList.length - 1];
  const medicionAnterior = medList.length >= 2 ? medList[medList.length - 2] : null;

  // Buscar mismo período del año anterior (ej. 2026-03 -> 2025-03)
  let medicionAnoAnterior: MedicionIndicadorSST | null = null;
  const matchAno = medicionActual.periodo.match(/^(\d{4})-(.+)$/);
  if (matchAno) {
    const anoPrev = String(Number(matchAno[1]) - 1);
    const periodoAnoAnterior = `${anoPrev}-${matchAno[2]}`;
    medicionAnoAnterior = medList.find(m => m.periodo === periodoAnoAnterior) || null;
  }

  // Promedio histórico de resultados numéricos válidos
  const valoresValidos = medList
    .map(m => m.resultadoNumerico)
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

  const totalMedicionesValidas = valoresValidos.length;
  const promedioHistorico = totalMedicionesValidas > 0
    ? Number((valoresValidos.reduce((acc, val) => acc + val, 0) / totalMedicionesValidas).toFixed(2))
    : null;

  // Variación respecto al período anterior
  let variacionPeriodoAnterior: number | null = null;
  let tendencia: 'Mejora' | 'Estable' | 'Deterioro' | 'Sin datos suficientes' = 'Sin datos suficientes';

  if (medicionActual.resultadoNumerico !== null && medicionActual.resultadoNumerico !== undefined &&
      medicionAnterior?.resultadoNumerico !== null && medicionAnterior?.resultadoNumerico !== undefined) {
    const diff = Number((medicionActual.resultadoNumerico - medicionAnterior.resultadoNumerico).toFixed(2));
    variacionPeriodoAnterior = diff;

    if (Math.abs(diff) < 0.05) {
      tendencia = 'Estable';
    } else if (indicador.sentido === 'Mayor es mejor') {
      tendencia = diff > 0 ? 'Mejora' : 'Deterioro';
    } else if (indicador.sentido === 'Menor es mejor') {
      tendencia = diff < 0 ? 'Mejora' : 'Deterioro';
    } else {
      tendencia = 'Estable';
    }
  }

  // Interpretación objetiva preliminar (sin alucinar causas)
  let interpretacionObjetiva = '';
  const alertasDetectadas: string[] = [];

  if (medicionActual.resultadoNumerico === null || medicionActual.resultadoNumerico === undefined) {
    interpretacionObjetiva = `Período ${medicionActual.periodo}: ${medicionActual.resultadoFormateado}. No es posible evaluar el cumplimiento frente a la meta de ${indicador.meta}${indicador.unidadMedida}.`;
    alertasDetectadas.push('Medición con información insuficiente o denominador en cero.');
  } else if (medicionActual.cumpleMeta) {
    interpretacionObjetiva = `El indicador cumple la meta establecida para el período ${medicionActual.periodo} (Resultado: ${medicionActual.resultadoFormateado} vs Meta: ${indicador.meta}${indicador.unidadMedida}). El proceso se encuentra bajo control en los términos previstos.`;
  } else {
    interpretacionObjetiva = `El indicador presenta un resultado de ${medicionActual.resultadoFormateado}, inferior a la meta establecida de ${indicador.meta}${indicador.unidadMedida} para el período ${medicionActual.periodo}. Se recomienda revisar las causas asociadas y registrar el plan de acción correspondiente.`;
    alertasDetectadas.push(`Desviación de meta en período ${medicionActual.periodo} (Semáforo ${medicionActual.semaforo}).`);
  }

  // Chequeo de crítico reiterado (últimas 2 mediciones en ROJO)
  if (medList.length >= 2) {
    const ultimasDos = medList.slice(-2);
    if (ultimasDos.every(m => m.semaforo === 'ROJO')) {
      alertasDetectadas.push('Condición crítica reiterada: El indicador se ha mantenido en Semáforo Rojo durante dos períodos consecutivos.');
    }
  }

  return {
    medicionActual,
    medicionAnterior,
    medicionAnoAnterior,
    promedioHistorico,
    totalMedicionesValidas,
    variacionPeriodoAnterior,
    tendencia,
    interpretacionObjetiva,
    alertasDetectadas
  };
}

/**
 * Catálogo normativo sugerido según Res. 0312 de 2019 (Arts. 30, 31, 32) y Dec. 1072 de 2015.
 * Se ofrece como plantilla opcional sin forzarla como datos de prueba.
 */
export const PLANTILLA_INDICADORES_NORMATIVOS_0312: Omit<IndicadorSST, 'id'>[] = [
  // 1. ESTRUCTURA (Planear)
  {
    codigo: 'IND-EST-01',
    nombre: 'Cumplimiento de la Política del SG-SST',
    descripcion: 'Mide la definición, divulgación y actualización formal de la política de seguridad y salud en el trabajo.',
    tipo: 'Estructura',
    cicloPHVA: 'Planear',
    procesoRelacionado: 'Direccionamiento Estratégico',
    estandar0312Relacionado: '1.1.2',
    referenciaNormativa: 'Res. 0312/2019 Art. 30 / Dec. 1072/2015 Art. 2.2.4.6.19',
    objetivoMedicion: 'Garantizar el 100% de adopción y socialización de la política institucional en SST.',
    interpretacion: 'Porcentaje de trabajadores informados formalmente sobre la política.',
    unidadMedida: '%',
    sentido: 'Mayor es mejor',
    formulaTexto: '(Trabajadores que conocen la política / Total trabajadores censados) × 100',
    nombreVariableNumerador: 'Trabajadores con constancia de divulgación',
    nombreVariableDenominador: 'Total trabajadores activos en el período',
    factorMultiplicador: 100,
    meta: 95,
    limiteAmarillo: 80,
    periodicidad: 'Anual',
    responsableMedicionCargo: 'Responsable SG-SST',
    responsableAnalisisCargo: 'Gerencia General',
    estado: 'Activo',
    fechaCreacion: '2026-01-15'
  },
  {
    codigo: 'IND-EST-02',
    nombre: 'Asignación de Recursos para el SG-SST',
    descripcion: 'Evalúa la ejecución del presupuesto financiero, técnico y humano asignado al SG-SST.',
    tipo: 'Estructura',
    cicloPHVA: 'Planear',
    procesoRelacionado: 'Gestión Administrativa y Financiera',
    estandar0312Relacionado: '1.1.3',
    referenciaNormativa: 'Res. 0312/2019 Art. 30 / Dec. 1072/2015 Art. 2.2.4.6.19',
    objetivoMedicion: 'Monitorear la disponibilidad oportuna de los recursos para el SG-SST.',
    interpretacion: 'Porcentaje del presupuesto ejecutado en actividades preventivas y dotación.',
    unidadMedida: '%',
    sentido: 'Mayor es mejor',
    formulaTexto: '(Presupuesto ejecutado SST / Presupuesto aprobado SST) × 100',
    nombreVariableNumerador: 'Monto COP ejecutado en SST',
    nombreVariableDenominador: 'Monto COP total presupuestado en SST',
    factorMultiplicador: 100,
    meta: 90,
    limiteAmarillo: 75,
    periodicidad: 'Trimestral',
    responsableMedicionCargo: 'Coordinador Administrativo',
    responsableAnalisisCargo: 'Responsable SG-SST',
    estado: 'Activo',
    fechaCreacion: '2026-01-15'
  },
  // 2. PROCESO (Hacer)
  {
    codigo: 'IND-PRO-01',
    nombre: 'Ejecución del Plan de Trabajo Anual en SST',
    descripcion: 'Mide el avance y cumplimiento de las actividades programadas en el plan anual de trabajo.',
    tipo: 'Proceso',
    cicloPHVA: 'Hacer',
    procesoRelacionado: 'Gestión Humana y SG-SST',
    estandar0312Relacionado: '2.1.1',
    referenciaNormativa: 'Res. 0312/2019 Art. 30 / Dec. 1072/2015 Art. 2.2.4.6.20',
    objetivoMedicion: 'Verificar el cumplimiento cronológico del plan de trabajo del SG-SST.',
    interpretacion: 'Porcentaje de actividades de prevención y promoción ejecutadas a tiempo.',
    unidadMedida: '%',
    sentido: 'Mayor es mejor',
    formulaTexto: '(Actividades ejecutadas en el período / Actividades programadas en el período) × 100',
    nombreVariableNumerador: 'Actividades ejecutadas y evidenciadas',
    nombreVariableDenominador: 'Actividades programadas en cronograma',
    factorMultiplicador: 100,
    meta: 85,
    limiteAmarillo: 70,
    periodicidad: 'Mensual',
    responsableMedicionCargo: 'Responsable SG-SST',
    responsableAnalisisCargo: 'COPASST',
    estado: 'Activo',
    fechaCreacion: '2026-01-15'
  },
  {
    codigo: 'IND-PRO-02',
    nombre: 'Cobertura del Programa de Capacitación en SST',
    descripcion: 'Mide la participación efectiva de los colaboradores en las capacitaciones programadas.',
    tipo: 'Proceso',
    cicloPHVA: 'Hacer',
    procesoRelacionado: 'Gestión Humana y SG-SST',
    estandar0312Relacionado: '1.2.1',
    referenciaNormativa: 'Res. 0312/2019 Art. 30 / Dec. 1072/2015 Art. 2.2.4.6.20',
    objetivoMedicion: 'Garantizar que todo el personal reciba las capacitaciones obligatorias de ley.',
    interpretacion: 'Porcentaje de trabajadores capacitados respecto a los convocados.',
    unidadMedida: '%',
    sentido: 'Mayor es mejor',
    formulaTexto: '(Trabajadores capacitados con evaluación aprobada / Trabajadores convocados) × 100',
    nombreVariableNumerador: 'Participantes capacitados con evaluación aprobada',
    nombreVariableDenominador: 'Total trabajadores citados o convocados',
    factorMultiplicador: 100,
    meta: 80,
    limiteAmarillo: 65,
    periodicidad: 'Mensual',
    responsableMedicionCargo: 'Responsable SG-SST',
    responsableAnalisisCargo: 'Líderes de Área',
    estado: 'Activo',
    fechaCreacion: '2026-01-15'
  },
  // 3. RESULTADO (Verificar y Actuar)
  {
    codigo: 'IND-RES-01',
    nombre: 'Índice de Frecuencia de Accidentes de Trabajo (IF)',
    descripcion: 'Número de accidentes de trabajo ocurridos en el período por cada 100 trabajadores a tiempo completo.',
    tipo: 'Resultado',
    cicloPHVA: 'Verificar',
    procesoRelacionado: 'Operaciones',
    estandar0312Relacionado: '6.1.1',
    referenciaNormativa: 'Res. 0312/2019 Art. 30 / Dec. 1072/2015 Art. 2.2.4.6.21',
    objetivoMedicion: 'Monitorear y reducir la tasa de accidentalidad laboral en la empresa.',
    interpretacion: 'Frecuencia de accidentes laborales por constante K = 240.000 horas hombre.',
    unidadMedida: 'Tasa',
    sentido: 'Menor es mejor',
    formulaTexto: '(Número de accidentes de trabajo en el período / Horas Hombre Trabajadas en el período) × 240000',
    nombreVariableNumerador: 'Número total de accidentes de trabajo (AT)',
    nombreVariableDenominador: 'Horas Hombre Trabajadas (HHT)',
    factorMultiplicador: 240000,
    meta: 2.5,
    limiteAmarillo: 5.0,
    periodicidad: 'Mensual',
    responsableMedicionCargo: 'Responsable SG-SST',
    responsableAnalisisCargo: 'COPASST y Gerencia',
    estado: 'Activo',
    fechaCreacion: '2026-01-15'
  },
  {
    codigo: 'IND-RES-02',
    nombre: 'Índice de Severidad de Accidentes de Trabajo (IS)',
    descripcion: 'Número de días de incapacidad y cargados por accidentes laborales por cada 100 trabajadores.',
    tipo: 'Resultado',
    cicloPHVA: 'Verificar',
    procesoRelacionado: 'Operaciones',
    estandar0312Relacionado: '6.1.1',
    referenciaNormativa: 'Res. 0312/2019 Art. 30 / Dec. 1072/2015 Art. 2.2.4.6.21',
    objetivoMedicion: 'Evaluar el impacto de la gravedad de los eventos sobre los días perdidos.',
    interpretacion: 'Severidad de incapacidades por constante K = 240.000 horas hombre.',
    unidadMedida: 'Días',
    sentido: 'Menor es mejor',
    formulaTexto: '(Días perdidos por incapacidad AT / Horas Hombre Trabajadas) × 240000',
    nombreVariableNumerador: 'Días de incapacidad médica emitidos por ARL/EPS',
    nombreVariableDenominador: 'Horas Hombre Trabajadas (HHT)',
    factorMultiplicador: 240000,
    meta: 10,
    limiteAmarillo: 25,
    periodicidad: 'Mensual',
    responsableMedicionCargo: 'Responsable SG-SST',
    responsableAnalisisCargo: 'COPASST y Gerencia',
    estado: 'Activo',
    fechaCreacion: '2026-01-15'
  },
  {
    codigo: 'IND-RES-03',
    nombre: 'Eficacia de las Acciones de Mejora (PHVA)',
    descripcion: 'Proporción de acciones correctivas, preventivas y de mejora implementadas y evaluadas como eficaces.',
    tipo: 'Resultado',
    cicloPHVA: 'Actuar',
    procesoRelacionado: 'Direccionamiento Estratégico',
    estandar0312Relacionado: '7.1.1',
    referenciaNormativa: 'Res. 0312/2019 Art. 30 / Dec. 1072/2015 Art. 2.2.4.6.21',
    objetivoMedicion: 'Garantizar el cierre efectivo y no recurrencia de las desviaciones identificadas.',
    interpretacion: 'Porcentaje de acciones declaradas eficaces frente al total de acciones cerradas.',
    unidadMedida: '%',
    sentido: 'Mayor es mejor',
    formulaTexto: '(Acciones verificadas eficaces / Total de acciones formuladas) × 100',
    nombreVariableNumerador: 'Acciones con dictamen de eficacia favorable',
    nombreVariableDenominador: 'Total de acciones registradas para el período',
    factorMultiplicador: 100,
    meta: 85,
    limiteAmarillo: 70,
    periodicidad: 'Trimestral',
    responsableMedicionCargo: 'Auditor Líder / Responsable SST',
    responsableAnalisisCargo: 'Gerencia General',
    estado: 'Activo',
    fechaCreacion: '2026-01-15'
  }
];
