import {
  Incapacidad,
  CalculoAcumuladoIncapacidadEmpleado,
  OrigenIncapacidad,
  SubtipoIncapacidad,
  Empleado
} from '../types';

// ==========================================
// CATÁLOGO FRECUENTE CIE-10 (COLOMBIA)
// ==========================================
export interface CatalogoCIE10Item {
  codigo: string;
  descripcion: string;
  capitulo: string;
  origenHabitual: OrigenIncapacidad;
  diasSugeridos: number;
}

export const CATALOGO_CIE10: CatalogoCIE10Item[] = [
  // Osteomuscular / Ergonómico
  { codigo: 'M54.5', descripcion: 'Lumbago no especificado (Dolor lumbar agudo/subagudo)', capitulo: 'Sistema Osteomuscular', origenHabitual: 'Comun', diasSugeridos: 5 },
  { codigo: 'M54.2', descripcion: 'Cervicalgia (Espasmo muscular cervical)', capitulo: 'Sistema Osteomuscular', origenHabitual: 'Comun', diasSugeridos: 3 },
  { codigo: 'M75.1', descripcion: 'Síndrome del manguito rotador / Tendinitis de hombro', capitulo: 'Sistema Osteomuscular', origenHabitual: 'Laboral', diasSugeridos: 15 },
  { codigo: 'M65.4', descripcion: 'Tenosinovitis estiloides radial (De Quervain)', capitulo: 'Sistema Osteomuscular', origenHabitual: 'Laboral', diasSugeridos: 10 },
  { codigo: 'G56.0', descripcion: 'Síndrome del túnel carpiano bilateral/unilateral', capitulo: 'Sistema Osteomuscular', origenHabitual: 'Laboral', diasSugeridos: 20 },
  { codigo: 'M51.2', descripcion: 'Hernia discal lumbar con radiculopatía', capitulo: 'Sistema Osteomuscular', origenHabitual: 'Comun', diasSugeridos: 21 },
  // Traumatismos y Accidentes (AT frecuentes)
  { codigo: 'S93.4', descripcion: 'Esguince y desgarro del ligamento del tobillo', capitulo: 'Traumatismos y Envenenamientos', origenHabitual: 'Laboral', diasSugeridos: 12 },
  { codigo: 'S62.6', descripcion: 'Fractura de dedo de la mano / Falange', capitulo: 'Traumatismos y Envenenamientos', origenHabitual: 'Laboral', diasSugeridos: 25 },
  { codigo: 'S61.0', descripcion: 'Herida de dedo de la mano sin lesión de uña', capitulo: 'Traumatismos y Envenenamientos', origenHabitual: 'Laboral', diasSugeridos: 7 },
  { codigo: 'S83.2', descripcion: 'Desgarro de menisco actual / Rodilla', capitulo: 'Traumatismos y Envenenamientos', origenHabitual: 'Laboral', diasSugeridos: 30 },
  { codigo: 'T15.9', descripcion: 'Cuerpo extraño en la parte externa del ojo', capitulo: 'Traumatismos y Envenenamientos', origenHabitual: 'Laboral', diasSugeridos: 4 },
  // Respiratorio e Infeccioso
  { codigo: 'J00', descripcion: 'Rinofaringitis aguda (Resfriado común)', capitulo: 'Enfermedades Respiratorias', origenHabitual: 'Comun', diasSugeridos: 3 },
  { codigo: 'J06.9', descripcion: 'Infección aguda de las vías respiratorias superiores', capitulo: 'Enfermedades Respiratorias', origenHabitual: 'Comun', diasSugeridos: 3 },
  { codigo: 'J18.9', descripcion: 'Neumonía bacteriana / viral no especificada', capitulo: 'Enfermedades Respiratorias', origenHabitual: 'Comun', diasSugeridos: 14 },
  { codigo: 'J20.9', descripcion: 'Bronquitis aguda no especificada', capitulo: 'Enfermedades Respiratorias', origenHabitual: 'Comun', diasSugeridos: 5 },
  { codigo: 'U07.1', descripcion: 'COVID-19 confirmado por laboratorio', capitulo: 'Códigos Especiales OMS', origenHabitual: 'Comun', diasSugeridos: 7 },
  // Gastrointestinal y Quirúrgico
  { codigo: 'A09', descripcion: 'Gastroenteritis y colitis de origen infeccioso', capitulo: 'Enfermedades Infecciosas', origenHabitual: 'Comun', diasSugeridos: 3 },
  { codigo: 'K35.8', descripcion: 'Apendicitis aguda intervenida por laparoscopia', capitulo: 'Sistema Digestivo', origenHabitual: 'Comun', diasSugeridos: 20 },
  { codigo: 'K40.9', descripcion: 'Hernia inguinal unilateral sin obstrucción ni gangrena', capitulo: 'Sistema Digestivo', origenHabitual: 'Comun', diasSugeridos: 28 },
  // Neurológico y Salud Mental
  { codigo: 'G43.9', descripcion: 'Migraña no especificada refractaria', capitulo: 'Sistema Nervioso', origenHabitual: 'Comun', diasSugeridos: 2 },
  { codigo: 'F41.2', descripcion: 'Trastorno mixto de ansiedad y depresión', capitulo: 'Trastornos Mentales', origenHabitual: 'Comun', diasSugeridos: 15 },
  { codigo: 'F43.0', descripcion: 'Reacción a estrés agudo / Sobrecarga emocional', capitulo: 'Trastornos Mentales', origenHabitual: 'Comun', diasSugeridos: 7 },
  // Maternidad y Paternidad
  { codigo: 'O80', descripcion: 'Parto único espontáneo a término (Licencia de Maternidad Ley 1822)', capitulo: 'Embarazo, Parto y Puerperio', origenHabitual: 'Comun', diasSugeridos: 126 },
  { codigo: 'Z39.0', descripcion: 'Atención y examen inmediatamente después del parto (Licencia Paternidad Ley 2114)', capitulo: 'Factores de Estado de Salud', origenHabitual: 'Comun', diasSugeridos: 14 }
];

// Helper para calcular días calendario (ambos inclusive)
export function calcularDiasEntreFechas(fechaInicio: string, fechaFin: string): number {
  if (!fechaInicio || !fechaFin) return 0;
  const ini = new Date(fechaInicio + 'T00:00:00');
  const fin = new Date(fechaFin + 'T00:00:00');
  if (isNaN(ini.getTime()) || isNaN(fin.getTime())) return 0;
  const diffTime = fin.getTime() - ini.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
}

// Helper para desglose legal de días y costos en Colombia:
// - Común (Enfermedad General): Días 1 y 2 = Empleador (pagados según CST al 66.67% o mínimo SMMLV). Días 3+ = EPS (66.67% del IBC).
// - Común (Licencia Maternidad / Paternidad): 100% asumido por EPS desde el día 1. Días empresa = 0, Días EPS = total.
// - Laboral (AT / EL): 100% asumido por ARL desde el día 1 siguiente. Días empresa = 0, Días ARL = total.
export function calcularDesgloseDiasYCostos(
  origen: OrigenIncapacidad,
  subtipo: SubtipoIncapacidad,
  totalDias: number,
  salarioBase: number
): {
  diasEmpresa: number;
  diasEntidad: number;
  valorEstimadoEmpresa: number;
  valorEstimadoEntidad: number;
  porcentajeReconocimiento: number;
} {
  const salarioDiario = Math.max(salarioBase || 1423500, 1423500) / 30; // SMMLV 2026 de referencia ~$1.423.500

  if (origen === 'Laboral') {
    // 100% ARL desde día 1
    const diasEmpresa = 0;
    const diasEntidad = totalDias;
    const valorEstimadoEmpresa = 0;
    const valorEstimadoEntidad = Math.round(diasEntidad * salarioDiario);
    return {
      diasEmpresa,
      diasEntidad,
      valorEstimadoEmpresa,
      valorEstimadoEntidad,
      porcentajeReconocimiento: 100
    };
  }

  // Licencias remuneradas especiales cubiertas al 100% por EPS
  if (subtipo === 'Licencia de Maternidad' || subtipo === 'Licencia de Paternidad') {
    return {
      diasEmpresa: 0,
      diasEntidad: totalDias,
      valorEstimadoEmpresa: 0,
      valorEstimadoEntidad: Math.round(totalDias * salarioDiario),
      porcentajeReconocimiento: 100
    };
  }

  // Origen Común - Enfermedad General:
  // Días 1 y 2 a cargo de la empresa (66.67% o 100% según política de garantía)
  const diasEmpresa = Math.min(totalDias, 2);
  const diasEntidad = Math.max(0, totalDias - 2);

  // Auxilio 66.67% según Art. 227 CST (garantizando mínimo legal diario)
  const auxilioDiario = Math.max(salarioDiario * (2 / 3), 1423500 / 30);
  const valorEstimadoEmpresa = Math.round(diasEmpresa * auxilioDiario);
  const valorEstimadoEntidad = Math.round(diasEntidad * auxilioDiario);

  return {
    diasEmpresa,
    diasEntidad,
    valorEstimadoEmpresa,
    valorEstimadoEntidad,
    porcentajeReconocimiento: 66.67
  };
}

// Incapacidades de muestra precargadas para CIMIENTO S.A.S.
export const INITIAL_INCAPACIDADES: Incapacidad[] = [
  {
    id: 'inc-001',
    empleadoId: 'e4',
    empleadoNombre: 'Carlos Mendivelso',
    empleadoNumeroDocumento: '79.882.103',
    cargoId: 'c4',
    cargoNombre: 'Técnico de Redes e Infraestructura',
    areaNombre: 'Operaciones Técnicas',
    origen: 'Laboral',
    subtipo: 'Accidente de Trabajo',
    tipoContingencia: 'Inicial',
    fechaInicio: '2026-02-16',
    fechaFin: '2026-02-27',
    fechaExpedicion: '2026-02-16',
    diasIncapacidad: 12,
    diasEmpresa: 0,
    diasEntidad: 12,
    salarioBase: 2650000,
    valorEstimadoEmpresa: 0,
    valorEstimadoEntidad: 1060000,
    codigoCIE10: 'S93.4',
    diagnostico: 'Esguince y desgarro del ligamento del tobillo en escalera técnica durante tendido de fibra',
    entidadEmisora: 'Positiva Compañía de Seguros ARL',
    numeroRadicado: 'RAD-ARL-2026-0924',
    medicoTratante: 'Dra. Liliana Gómez Cardona',
    registroMedico: 'RM-54210-COL',
    ipsAtencion: 'Clínica de Traumatología Ocupacional del Norte',
    estado: 'Finalizada',
    estadoCobro: 'Reconocido',
    observaciones: 'Reporte FURAT radicado a tiempo dentro de las 48 horas de ley. Trabajador cumplió protocolo de fisioterapia.',
    requiereExamenReintegro: true,
    examenReintegroAgendado: true,
    fechaRegistro: '2026-02-16',
    registradoPor: 'Dirección de Gestión Humana'
  },
  {
    id: 'inc-002',
    empleadoId: 'e4',
    empleadoNombre: 'Carlos Mendivelso',
    empleadoNumeroDocumento: '79.882.103',
    cargoId: 'c4',
    cargoNombre: 'Técnico de Redes e Infraestructura',
    areaNombre: 'Operaciones Técnicas',
    origen: 'Laboral',
    subtipo: 'Accidente de Trabajo',
    tipoContingencia: 'Prorroga',
    incapacidadAnteriorId: 'inc-001',
    fechaInicio: '2026-02-28',
    fechaFin: '2026-03-08',
    fechaExpedicion: '2026-02-27',
    diasIncapacidad: 9,
    diasEmpresa: 0,
    diasEntidad: 9,
    salarioBase: 2650000,
    valorEstimadoEmpresa: 0,
    valorEstimadoEntidad: 795000,
    codigoCIE10: 'S93.4',
    diagnostico: 'Prórroga de esguince de tobillo grado II - Edema residual post-inmovilización',
    entidadEmisora: 'Positiva Compañía de Seguros ARL',
    numeroRadicado: 'RAD-ARL-2026-1188',
    medicoTratante: 'Dr. Hernando Ortiz',
    registroMedico: 'RM-33109-COL',
    ipsAtencion: 'Clínica de Traumatología Ocupacional del Norte',
    estado: 'Finalizada',
    estadoCobro: 'Radicado ante Entidad',
    observaciones: 'Prórroga médica autorizada por ortopedista tratante. Requiere examen de reintegro previo a retorno a alturas.',
    requiereExamenReintegro: true,
    examenReintegroAgendado: true,
    fechaRegistro: '2026-02-27',
    registradoPor: 'Responsable SST'
  },
  {
    id: 'inc-003',
    empleadoId: 'e2',
    empleadoNombre: 'Andrés Pinilla',
    empleadoNumeroDocumento: '80.114.552',
    cargoId: 'c2',
    cargoNombre: 'Coordinador Administrativo y Financiero',
    areaNombre: 'Talento Humano y Compensación',
    origen: 'Comun',
    subtipo: 'Enfermedad General',
    tipoContingencia: 'Inicial',
    fechaInicio: '2026-03-10',
    fechaFin: '2026-03-14',
    fechaExpedicion: '2026-03-10',
    diasIncapacidad: 5,
    diasEmpresa: 2,
    diasEntidad: 3,
    salarioBase: 4800000,
    valorEstimadoEmpresa: 213333,
    valorEstimadoEntidad: 320000,
    codigoCIE10: 'M54.5',
    diagnostico: 'Lumbago no especificado - Espasmo muscular agudo post esfuerzo lumbar',
    entidadEmisora: 'EPS Sanitas',
    numeroRadicado: 'CERT-EPS-78190-2026',
    medicoTratante: 'Dra. María Paula Restrepo',
    registroMedico: 'RM-88421-BOG',
    ipsAtencion: 'Centro Médico EPS Sanitas Calle 127',
    estado: 'Finalizada',
    estadoCobro: 'Pendiente Radicación',
    observaciones: 'Reposo en casa con relajante muscular. Días 1 y 2 asumidos por la empresa, días 3, 4 y 5 pendientes de recobro ante Sanitas.',
    requiereExamenReintegro: false,
    examenReintegroAgendado: false,
    fechaRegistro: '2026-03-10',
    registradoPor: 'Dirección de Gestión Humana'
  },
  {
    id: 'inc-004',
    empleadoId: 'e3',
    empleadoNombre: 'Laura Beltrán',
    empleadoNumeroDocumento: '1.014.288.940',
    cargoId: 'c3',
    cargoNombre: 'Analista de Contabilidad y Nómina',
    areaNombre: 'Finanzas y Contabilidad',
    origen: 'Comun',
    subtipo: 'Enfermedad General',
    tipoContingencia: 'Inicial',
    // Configurada dinámicamente para que caiga en alerta activa / por vencer
    fechaInicio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaExpedicion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diasIncapacidad: 6,
    diasEmpresa: 2,
    diasEntidad: 4,
    salarioBase: 3100000,
    valorEstimadoEmpresa: 137778,
    valorEstimadoEntidad: 275556,
    codigoCIE10: 'J06.9',
    diagnostico: 'Infección respiratoria aguda con síndrome bronquial moderado',
    entidadEmisora: 'Sura EPS',
    numeroRadicado: 'SURA-MED-2026-4401',
    medicoTratante: 'Dr. Camilo Echeverri',
    registroMedico: 'RM-77123-MED',
    ipsAtencion: 'Sede Sura Salud Integral',
    estado: 'Activa',
    estadoCobro: 'Pendiente Radicación',
    observaciones: 'Incapacidad médica en curso. Alerta automática activa: vence en 3 días para coordinar reincorporación.',
    requiereExamenReintegro: false,
    examenReintegroAgendado: false,
    fechaRegistro: new Date().toISOString().split('T')[0],
    registradoPor: 'Dirección de Gestión Humana'
  }
];

// Helper para almacenamiento local persistente
const STORAGE_KEY = 'control_incapacidades_db';

export function getStoredIncapacidades(): Incapacidad[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INCAPACIDADES));
      return INITIAL_INCAPACIDADES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_INCAPACIDADES;
  } catch (e) {
    console.error('Error al leer incapacidades de localStorage:', e);
    return INITIAL_INCAPACIDADES;
  }
}

export function saveStoredIncapacidades(incapacidades: Incapacidad[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incapacidades));
    // Disparar evento de actualización para listeners locales
    window.dispatchEvent(new CustomEvent('incapacidades_updated', { detail: incapacidades }));
  } catch (e) {
    console.error('Error al guardar incapacidades en localStorage:', e);
  }
}

// ==========================================
// CÁLCULO DE ACUMULADOS Y ALERTAS DE LEY
// ==========================================
export function calcularAcumuladosPorEmpleado(
  empleados: Empleado[],
  incapacidades: Incapacidad[],
  anoRef: number = 2026
): CalculoAcumuladoIncapacidadEmpleado[] {
  const hoyStr = new Date().toISOString().split('T')[0];

  return empleados.map(emp => {
    const incapsEmp = incapacidades.filter(i => i.empleadoId === emp.id);

    // Días año en curso
    const incapsAno = incapsEmp.filter(i => {
      const yearIni = parseInt(i.fechaInicio.split('-')[0]) || 2026;
      return yearIni === anoRef;
    });

    const diasAcumuladosAno = incapsAno.reduce((acc, curr) => acc + (curr.diasIncapacidad || 0), 0);
    const diasAcumuladosHistorico = incapsEmp.reduce((acc, curr) => acc + (curr.diasIncapacidad || 0), 0);

    const diasOrigenComun = incapsEmp
      .filter(i => i.origen === 'Comun')
      .reduce((acc, curr) => acc + (curr.diasIncapacidad || 0), 0);

    const diasOrigenLaboral = incapsEmp
      .filter(i => i.origen === 'Laboral')
      .reduce((acc, curr) => acc + (curr.diasIncapacidad || 0), 0);

    // Buscar incapacidad activa
    const incActiva = incapsEmp.find(i => i.fechaInicio <= hoyStr && i.fechaFin >= hoyStr);
    const tieneIncapacidadActiva = !!incActiva;

    // Buscar próxima a vencer
    const proxima = incapsEmp
      .filter(i => i.fechaFin >= hoyStr)
      .sort((a, b) => a.fechaFin.localeCompare(b.fechaFin))[0];

    let diasParaVencer: number | undefined;
    if (proxima) {
      diasParaVencer = calcularDiasEntreFechas(hoyStr, proxima.fechaFin) - 1;
    }

    // Cálculo de cadena continua de prórrogas más larga
    let diasEpisodioContinuoActual = 0;
    if (incActiva) {
      diasEpisodioContinuoActual = incActiva.diasIncapacidad;
      let anteriorId = incActiva.incapacidadAnteriorId;
      while (anteriorId) {
        const prev = incapsEmp.find(i => i.id === anteriorId);
        if (prev) {
          diasEpisodioContinuoActual += prev.diasIncapacidad;
          anteriorId = prev.incapacidadAnteriorId;
        } else {
          break;
        }
      }
    } else if (incapsAno.length > 0) {
      diasEpisodioContinuoActual = Math.max(...incapsAno.map(i => i.diasIncapacidad));
    }

    // Evaluación de Semáforo de Ley (Decreto 19/2012 y Fuero de Salud)
    let alertaNivel: CalculoAcumuladoIncapacidadEmpleado['alertaNivel'] = 'normal';
    let mensajeAlerta: string | undefined;

    const diasParaEvaluar = Math.max(diasAcumuladosAno, diasEpisodioContinuoActual);

    if (diasParaEvaluar >= 180) {
      alertaNivel = 'critica_180';
      mensajeAlerta = 'ALERTA CRÍTICA: Supera 180 días continuos. El auxilio corresponde al Fondo de Pensiones (AFP). Aplica estabilidad laboral reforzada (Fuero de Salud).';
    } else if (diasParaEvaluar >= 120) {
      alertaNivel = 'alerta_120';
      mensajeAlerta = 'ALERTA EPS: Supera 120 días. La EPS debe remitir concepto favorable/desfavorable de rehabilitación al Fondo de Pensiones antes del día 150.';
    } else if (diasParaEvaluar >= 90) {
      alertaNivel = 'preventiva_90';
      mensajeAlerta = 'ALERTA PREVENTIVA: Supera 90 días acumulados. Solicitar a la EPS emisión temprana del concepto de rehabilitación médica.';
    }

    // Diagnósticos únicos
    const diagnosticosFrecuentes = Array.from(new Set(incapsEmp.map(i => i.codigoCIE10 + ' - ' + i.diagnostico.slice(0, 30))));

    return {
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      empleadoNumeroDocumento: emp.documento,
      cargoNombre: emp.laboral?.cargoNombre || 'Colaborador',
      areaNombre: emp.laboral?.areaNombre || 'Área General',
      salarioBase: emp.salarioBase || 1423500,
      totalIncapacidades: incapsEmp.length,
      diasAcumuladosAno,
      diasAcumuladosHistorico,
      diasOrigenComun,
      diasOrigenLaboral,
      diasEpisodioContinuoActual,
      tieneIncapacidadActiva,
      incapacidadActivaId: incActiva?.id,
      fechaProximoVencimiento: proxima?.fechaFin,
      diasParaVencer,
      alertaNivel,
      mensajeAlerta,
      diagnosticosFrecuentes
    };
  });
}

// ==========================================
// ALERTAS EN TIEMPO REAL
// ==========================================
export interface AlertaIncapacidadItem {
  id: string;
  tipo: 'por_vencer' | 'activa' | 'vencida_sin_reintegro' | 'acumulado_critico' | 'cobro_pendiente';
  gravedad: 'critica' | 'alerta' | 'informativa';
  titulo: string;
  descripcion: string;
  incapacidadId?: string;
  empleadoNombre: string;
  diasRestantes?: number;
}

export function obtenerAlertasIncapacidades(incapacidades: Incapacidad[]): AlertaIncapacidadItem[] {
  const hoyStr = new Date().toISOString().split('T')[0];
  const alertas: AlertaIncapacidadItem[] = [];

  incapacidades.forEach(inc => {
    const diff = calcularDiasEntreFechas(hoyStr, inc.fechaFin) - 1;

    // 1. Incapacidad próxima a vencer (≤ 5 días y no vencida)
    if (diff >= 0 && diff <= 5) {
      alertas.push({
        id: `alerta-vence-${inc.id}`,
        tipo: 'por_vencer',
        gravedad: diff <= 2 ? 'critica' : 'alerta',
        titulo: `Incapacidad próxima a vencer (${diff === 0 ? 'Vence HOY' : `en ${diff} días`})`,
        descripcion: `${inc.empleadoNombre} (${inc.diagnostico.slice(0, 45)}...) finaliza período el ${inc.fechaFin}. Coordinar reintegro laboral o verificar prórroga médica.`,
        incapacidadId: inc.id,
        empleadoNombre: inc.empleadoNombre,
        diasRestantes: diff
      });
    }

    // 2. Vencida recientemente que requiere examen de reintegro o no tiene soporte
    if (diff < 0 && diff >= -7 && inc.requiereExamenReintegro && !inc.examenReintegroAgendado) {
      alertas.push({
        id: `alerta-reintegro-${inc.id}`,
        tipo: 'vencida_sin_reintegro',
        gravedad: 'critica',
        titulo: 'Examen de Posincapacidad / Reintegro Pendiente',
        descripcion: `${inc.empleadoNombre} finalizó incapacidad de ${inc.diasIncapacidad} días (${inc.origen}). Obligatorio programar examen ocupacional de aptitud laboral.`,
        incapacidadId: inc.id,
        empleadoNombre: inc.empleadoNombre,
        diasRestantes: diff
      });
    }

    // 3. Pendiente de radicación ante EPS/ARL con valor alto
    if (inc.estadoCobro === 'Pendiente Radicación' && inc.valorEstimadoEntidad > 0 && inc.diasEntidad > 0) {
      alertas.push({
        id: `alerta-cobro-${inc.id}`,
        tipo: 'cobro_pendiente',
        gravedad: 'informativa',
        titulo: `Recobro pendiente ante ${inc.entidadEmisora}`,
        descripcion: `Radicar certificado No. ${inc.numeroRadicado} de ${inc.empleadoNombre} para recuperar auxilio económico estimado de $${inc.valorEstimadoEntidad.toLocaleString('es-CO')}.`,
        incapacidadId: inc.id,
        empleadoNombre: inc.empleadoNombre
      });
    }
  });

  return alertas;
}

// ==========================================
// INTEGRACIÓN CON INDICADORES SG-SST (RES. 0312 / DEC. 1072)
// CÁLCULO DE AUSENTISMO POR CAUSA MÉDICA
// ==========================================
export interface ResumenAusentismoMes {
  periodo: string; // YYYY-MM
  diasIncapacidadComun: number;
  diasIncapacidadLaboral: number;
  totalDiasIncapacidad: number;
  trabajadoresCensados: number;
  diasLaborablesMes: number;
  diasTrabajoProgramados: number;
  tasaAusentismoPct: number;
  colaboradoresAfectados: string[];
  eventosDetalle: {
    incapacidadId: string;
    empleadoNombre: string;
    empleadoNumeroDocumento?: string;
    origen: OrigenIncapacidad;
    codigoCIE10?: string;
    diagnostico: string;
    entidadEmisora?: string;
    diasIncapacidadTotal?: number;
    diasEnMes: number;
  }[];
}

export function calcularAusentismoMes(
  incapacidades: Incapacidad[],
  periodoMes: string,
  numeroTrabajadores: number = 6,
  diasLaborablesMes: number = 24
): ResumenAusentismoMes {
  if (!periodoMes || !periodoMes.includes('-')) {
    periodoMes = new Date().toISOString().slice(0, 7);
  }

  const [anoStr, mesStr] = periodoMes.split('-');
  const ano = parseInt(anoStr, 10) || 2026;
  const mes = parseInt(mesStr, 10) || 1;
  const ultimoDiaNum = new Date(ano, mes, 0).getDate();
  const primerDiaMes = `${periodoMes}-01`;
  const ultimoDiaMes = `${periodoMes}-${String(ultimoDiaNum).padStart(2, '0')}`;

  let diasIncapacidadComun = 0;
  let diasIncapacidadLaboral = 0;
  const colaboradoresSet = new Set<string>();
  const eventosDetalle: ResumenAusentismoMes['eventosDetalle'] = [];

  incapacidades.forEach(inc => {
    const solapeInicio = inc.fechaInicio > primerDiaMes ? inc.fechaInicio : primerDiaMes;
    const solapeFin = inc.fechaFin < ultimoDiaMes ? inc.fechaFin : ultimoDiaMes;

    if (solapeInicio <= solapeFin) {
      const diasEnMes = calcularDiasEntreFechas(solapeInicio, solapeFin);
      if (diasEnMes > 0) {
        if (inc.origen === 'Laboral') {
          diasIncapacidadLaboral += diasEnMes;
        } else {
          diasIncapacidadComun += diasEnMes;
        }
        colaboradoresSet.add(inc.empleadoNombre);
        eventosDetalle.push({
          incapacidadId: inc.id,
          empleadoNombre: inc.empleadoNombre,
          empleadoNumeroDocumento: inc.empleadoNumeroDocumento,
          origen: inc.origen,
          codigoCIE10: inc.codigoCIE10,
          diagnostico: `${inc.codigoCIE10} - ${inc.diagnostico}`,
          entidadEmisora: inc.entidadEmisora,
          diasIncapacidadTotal: inc.diasIncapacidad,
          diasEnMes
        });
      }
    }
  });

  const totalDiasIncapacidad = diasIncapacidadComun + diasIncapacidadLaboral;
  const trabCount = Math.max(1, numeroTrabajadores || 6);
  const diasProgramados = Math.max(1, trabCount * (diasLaborablesMes || 24));
  const tasaAusentismoPct = Number(((totalDiasIncapacidad / diasProgramados) * 100).toFixed(2));

  return {
    periodo: periodoMes,
    diasIncapacidadComun,
    diasIncapacidadLaboral,
    totalDiasIncapacidad,
    trabajadoresCensados: trabCount,
    diasLaborablesMes: diasLaborablesMes || 24,
    diasTrabajoProgramados: diasProgramados,
    tasaAusentismoPct,
    colaboradoresAfectados: Array.from(colaboradoresSet),
    eventosDetalle
  };
}
