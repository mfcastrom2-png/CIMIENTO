import {
  ClasificacionDesempeno,
  ComponenteCumplimientoEvaluacion,
  ComponenteDesarrolloEvaluacion,
  ItemCompetenciaEvaluacion,
  ItemPlanDesarrollo,
  ItemResultadoEvaluacion,
  NivelCumplimiento,
  SesgoDetectado
} from '../types';

/**
 * Calcula el nivel de cumplimiento de un resultado según la escala del documento:
 * Nivel 5 — Excepcional: >= 110%
 * Nivel 4 — Superior: 100 - 109%
 * Nivel 3 — Esperado: 90 - 99%
 * Nivel 2 — En desarrollo: 70 - 89%
 * Nivel 1 — Crítico: < 70%
 */
export function calcularNivelResultado(meta: number, resultadoReal: number): NivelCumplimiento {
  if (meta <= 0) return 3;
  const porcentaje = (resultadoReal / meta) * 100;
  if (porcentaje >= 110) return 5;
  if (porcentaje >= 100) return 4;
  if (porcentaje >= 90) return 3;
  if (porcentaje >= 70) return 2;
  return 1;
}

export function getNivelLabel(nivel: NivelCumplimiento): string {
  switch (nivel) {
    case 5: return '5 — Excepcional';
    case 4: return '4 — Superior';
    case 3: return '3 — Esperado';
    case 2: return '2 — En desarrollo';
    case 1: return '1 — Crítico';
  }
}

export function getClasificacion(puntajeTotal: number): ClasificacionDesempeno {
  if (puntajeTotal >= 90) return 'Excepcional';
  if (puntajeTotal >= 80) return 'Sobresaliente';
  if (puntajeTotal >= 70) return 'Satisfactorio';
  if (puntajeTotal >= 60) return 'En desarrollo';
  return 'Crítico';
}

/**
 * Calcula el subtotal del Componente 1: Resultados del cargo (50% max)
 */
export function calcularSubtotalResultados(items: ItemResultadoEvaluacion[]): number {
  if (!items.length) return 0;
  // Cada item contribuye proporcionalmente a su peso asignado
  // Si los pesos suman 50: puntaje = suma( (nivel / 5) * peso )
  const totalPeso = items.reduce((acc, it) => acc + (it.peso || 0), 0);
  if (totalPeso === 0) return 0;

  const puntosPonderados = items.reduce((acc, it) => {
    const factor = it.nivelCalculado / 5; // 0.2 a 1.0
    return acc + factor * it.peso;
  }, 0);

  // Normalizamos a escala de 50 puntos si la suma de pesos no fuera exactamente 50
  const resultado = totalPeso === 50 ? puntosPonderados : (puntosPonderados / totalPeso) * 50;
  return Math.round(resultado * 10) / 10;
}

/**
 * Calcula el subtotal del Componente 2: Competencias (25% max)
 */
export function calcularSubtotalCompetencias(items: ItemCompetenciaEvaluacion[]): number {
  if (!items.length) return 0;
  const sumaNiveles = items.reduce((acc, it) => acc + it.calificacionNivel, 0);
  const promedioNivel = sumaNiveles / items.length; // Entre 1.0 y 5.0
  const puntaje = (promedioNivel / 5) * 25;
  return Math.round(puntaje * 10) / 10;
}

/**
 * Calcula el subtotal del Componente 3: Responsabilidades y Cumplimiento (15% max)
 * Procedimientos: 4%
 * SG-SST: 4%
 * Gestión de Información: 3%
 * Cumplimiento Administrativo: 2%
 * Convivencia y Conducta: 2%
 */
export function calcularSubtotalCumplimiento(c: ComponenteCumplimientoEvaluacion): number {
  const pProc = (c.cumplimientoProcedimientos.nivel / 5) * 4;
  const pSst = (c.sgSst.nivel / 5) * 4;
  const pInfo = (c.gestionInformacion.nivel / 5) * 3;
  const pAdm = (c.cumplimientoAdministrativo.nivel / 5) * 2;
  const pConv = (c.convivenciaConducta.nivel / 5) * 2;
  return Math.round((pProc + pSst + pInfo + pAdm + pConv) * 10) / 10;
}

/**
 * Calcula el subtotal del Componente 4: Desarrollo y Mejora (10% max)
 * Plan anterior: 4%
 * Aprendizaje / Capacitación: 3%
 * Iniciativas de mejora: 3%
 */
export function calcularSubtotalDesarrollo(d: ComponenteDesarrolloEvaluacion): number {
  const pPlan = (d.cumplimientoPlanAnterior.nivel / 5) * 4;
  const pApre = (d.aprendizajeCapacitacion.nivel / 5) * 3;
  const pMej = (d.iniciativasMejora.nivel / 5) * 3;
  return Math.round((pPlan + pApre + pMej) * 10) / 10;
}

/**
 * Detector de sesgos e inconsistencias técnicas (Requerido por pág. 9 y 10 del documento)
 */
export function detectarSesgosYAlertas(
  resultados: ItemResultadoEvaluacion[],
  competencias: ItemCompetenciaEvaluacion[],
  cumplimiento: ComponenteCumplimientoEvaluacion
): SesgoDetectado[] {
  const alertas: SesgoDetectado[] = [];

  // 1. Detección de falta de evidencia en notas altas (Nivel 5 o 4)
  const compSinEvidencia = competencias.filter(
    c => c.calificacionNivel >= 4 && (!c.evidencia || c.evidencia.trim().length < 5)
  );
  if (compSinEvidencia.length > 0) {
    alertas.push({
      tipo: 'FaltaEvidencia',
      severidad: 'alta',
      mensaje: `Revisión requerida: Se asignó nivel sobresaliente/excepcional a ${compSinEvidencia.length} competencia(s) (${compSinEvidencia.map(c => c.competenciaNombre).join(', ')}) sin registrar evidencia objetiva verificable.`
    });
  }

  // 2. Detección de falta de evidencia en resultados clave
  const resSinEvidencia = resultados.filter(
    r => r.nivelCalculado >= 4 && (!r.evidencia || r.evidencia.trim().length < 4)
  );
  if (resSinEvidencia.length > 0) {
    alertas.push({
      tipo: 'FaltaEvidencia',
      severidad: 'media',
      mensaje: `Indicadores de resultados sin soporte: ${resSinEvidencia.length} indicador(es) no cuentan con ID de orden, ticket o informe de soporte registrado.`
    });
  }

  // 3. Efecto Halo / Indulgencia (todas las competencias tienen calificación perfecta sin matices)
  if (competencias.length >= 3) {
    const todosSon5 = competencias.every(c => c.calificacionNivel === 5);
    if (todosSon5) {
      alertas.push({
        tipo: 'EfectoHalo',
        severidad: 'alta',
        mensaje: 'Posible sesgo de indulgencia o efecto halo: Se evaluaron todas las competencias con la calificación máxima (5) de forma uniforme. Se recomienda revisar conductas observables específicas.'
      });
    }
  }

  // 4. Inconsistencia entre meta y resultado en indicadores
  resultados.forEach(r => {
    if (r.meta > 0 && r.resultadoReal > 0) {
      const porcentaje = (r.resultadoReal / r.meta) * 100;
      if (porcentaje < 70 && r.nivelCalculado >= 3) {
        alertas.push({
          tipo: 'InconsistenciaFormula',
          severidad: 'alta',
          mensaje: `Inconsistencia en "${r.indicadorNombre}": El cumplimiento real es ${Math.round(porcentaje)}% (<70%), pero tiene asignado nivel ${r.nivelCalculado}. Según la escala técnica debe ser Nivel 1 (Crítico).`
        });
      }
    }
  });

  return alertas;
}

/**
 * Generador automático de Plan de Desarrollo cuando se detectan brechas
 * (Documento pág. 10 y 11: Competencia/Indicador -> Brecha -> Causa -> Acción -> Responsable -> Fecha -> Evidencia)
 */
export function generarPlanDesarrolloSugerido(
  resultados: ItemResultadoEvaluacion[],
  competencias: ItemCompetenciaEvaluacion[]
): ItemPlanDesarrollo[] {
  const plan: ItemPlanDesarrollo[] = [];

  // Revisar competencias con nivel 1 o 2 (o nivel 3 si el requerimiento es Alto)
  competencias.forEach(c => {
    if (c.calificacionNivel <= 2 || (c.nivelRequerido === 'Alto' && c.calificacionNivel === 3)) {
      const brecha = c.calificacionNivel <= 2 
        ? `Nivel observado (${c.calificacionNivel}/5) por debajo del estándar mínimo esperado.`
        : `Nivel actual (${c.calificacionNivel}/5) requiere consolidación hacia el estándar Alto requerido por el cargo.`;
      
      let accionSugerida = 'Taller práctico de reentrenamiento y acompañamiento con líder técnico.';
      let causa = 'Falta de familiarización con los procedimientos estándar o herramientas recientes.';
      let evidencia = 'Evaluación práctica de reentrenamiento y auditoría en puesto.';

      const nombreLower = c.competenciaNombre.toLowerCase();
      if (nombreLower.includes('cliente') || nombreLower.includes('comunic')) {
        accionSugerida = 'Coaching individual en manejo de conversaciones difíciles y protocolo de atención.';
        causa = 'Dificultades en desescalamiento de quejas de usuarios.';
        evidencia = 'Observación en campo y reporte de satisfacción PQR del siguiente mes.';
      } else if (nombreLower.includes('diagn') || nombreLower.includes('técn') || nombreLower.includes('herramient')) {
        accionSugerida = 'Capacitación técnica especializada y certificación en procedimientos operativos.';
        causa = 'Brecha de conocimiento en nuevas tecnologías o diagnóstico avanzado.';
        evidencia = 'Certificado de aprobación de curso técnico y reducción de reincidencias.';
      } else if (nombreLower.includes('orden') || nombreLower.includes('procedim') || nombreLower.includes('registr')) {
        accionSugerida = 'Reentrenamiento en diligenciamiento oportuno de órdenes y cierre de bitácoras.';
        causa = 'Demoras u omisiones en el reporte del sistema operativo.';
        evidencia = 'Auditoría de 10 órdenes consecutivas con 100% de cumplimiento.';
      }

      // Fecha propuesta: dentro de 60 días
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 60);

      plan.push({
        id: 'plan_' + Math.random().toString(36).slice(2, 8),
        competenciaOIndicador: c.competenciaNombre,
        brechaDetectada: brecha,
        causaRaiz: causa,
        accionPropuesta: accionSugerida,
        responsable: 'Jefe Inmediato + Trabajador',
        fechaCompromiso: fecha.toISOString().slice(0, 10),
        evidenciaEsperada: evidencia,
        estado: 'Pendiente'
      });
    }
  });

  // Revisar indicadores con nivel 1 o 2
  resultados.forEach(r => {
    if (r.nivelCalculado <= 2) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 45);

      plan.push({
        id: 'plan_' + Math.random().toString(36).slice(2, 8),
        competenciaOIndicador: `Indicador: ${r.indicadorNombre}`,
        brechaDetectada: `Cumplimiento inferior al 90% (Resultado: ${r.resultadoReal}${r.unidad} vs Meta: ${r.meta}${r.unidad}).`,
        causaRaiz: 'Cuellos de botella en la ejecución o necesidad de ajuste metodológico.',
        accionPropuesta: `Plan de choque con monitoreo quincenal para ${r.indicadorNombre}.`,
        responsable: 'Trabajador y Coordinador de Área',
        fechaCompromiso: fecha.toISOString().slice(0, 10),
        evidenciaEsperada: `Reporte de métricas del siguiente corte con cumplimiento >= 90%.`,
        estado: 'Pendiente'
      });
    }
  });

  return plan;
}
