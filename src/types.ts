export type Role = 'admin' | 'empleado';

export type Modalidad = 'Presencial' | 'Remoto' | 'Híbrido';
export type EstadoFicha = 'Vigente' | 'Borrador' | 'En revisión';
export type Criticidad = 'Alta' | 'Media' | 'Baja';
export type NivelCompetencia = 'Básico' | 'Intermedio' | 'Alto';
export type TipoCompetencia = 'Corporativa' | 'Técnica';
export type TipoSolicitud = 'Vacaciones' | 'Permiso' | 'Licencia' | 'Incapacidad' | 'Cesantías' | 'Certificado';
export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export type TipoProceso = 'Estratégico' | 'Misional / Operativo' | 'Apoyo' | 'Control y Evaluación';

export interface ProcesoOrganizacion {
  id: string;
  empresaId?: string;
  codigo?: string;
  nombre: string;
  tipo: TipoProceso;
  objetivo?: string;
  liderCargoId?: string;
  liderNombre?: string;
}

export interface AreaOrganizacion {
  id: string;
  empresaId?: string;
  codigo?: string;
  nombre: string;
  procesoId?: string;
  procesoNombre?: string;
  lider?: string;
  liderCargoId?: string;
  descripcion?: string;
}

// 1. Identificación y estructura de cargo
export interface FuncionCargo {
  id: string;
  texto: string;
  condicion: string;
  resultado: string;
  criticidad: Criticidad;
  estado: string;
}

export interface ResponsabilidadCargo {
  id: string;
  categoria: 'Operativa' | 'Cliente' | 'Recursos' | 'Información' | 'Cumplimiento' | 'Calidad' | 'SST' | 'Seguridad' | 'Ambiental';
  descripcion: string;
}

export interface IndicadorCargo {
  id: string;
  nombre: string;
  formula: string;
  unidad: string; // '%', 'días', '$', etc.
  frecuencia: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual';
  pesoSugerido?: number; // p.ej. 15%
  meta?: string | number;
}

export interface AutoridadRelaciones {
  decide: string;
  aprueba: string;
  modifica: string;
  consulta: string;
  escala: string;
  supervisaA: string;
  coordinaCon: string;
  soportaA: string;
  recibeDe: string;
  entregaA: string;
  consultaA: string;
}

export interface CompetenciaCargo {
  id: string;
  nombre: string;
  tipo: TipoCompetencia;
  nivel: NivelCompetencia;
  conductas: string;
}

export interface RequisitosCargo {
  formacion: string;
  experiencia: string;
  conocimientos: string;
  certificaciones: string;
}

export interface NormativaItem {
  id: string;
  norma: string;
  tema: string;
  vigencia: string;
}

export interface CumplimientoCargo {
  sst: string;
  datos: string;
  normativa: NormativaItem[];
}

export interface DocumentoCargo {
  id: string;
  nombre: string;
}

export interface HistorialVersionCargo {
  id: string;
  version: string;
  fecha: string;
  motivo: string;
  responsable: string;
  aprobador: string;
}

export interface FichaCargo {
  identificacion: {
    codigo: string;
    familia: string;
    area: string;
    proceso: string;
    tipoVinculacion: string;
    modalidad: Modalidad;
    ubicacion: string;
    personalACargo: string;
    estado: EstadoFicha;
    version: string;
  };
  proposito: string;
  funciones: FuncionCargo[];
  responsabilidades: ResponsabilidadCargo[];
  indicadores: IndicadorCargo[];
  autoridad: {
    decide: string;
    aprueba: string;
    modifica: string;
    consulta: string;
    escala: string;
  };
  relaciones: {
    supervisaA: string;
    coordinaCon: string;
    soportaA: string;
    recibeDe: string;
    entregaA: string;
    consultaA: string;
  };
  competencias: CompetenciaCargo[];
  requisitos: RequisitosCargo;
  cumplimiento: CumplimientoCargo;
  documentos: DocumentoCargo[];
  historial: HistorialVersionCargo[];
}

export interface Cargo {
  id: string;
  empresaId?: string;
  nombre: string;
  reportaA: string | null;
  ficha: FichaCargo;
}

export interface Familiar {
  nombre: string;
  parentesco: string;
  nacimiento: string;
}

export interface ContratoEmpleado {
  tipo: string;
  inicio: string;
  fin: string;
  salario: string;
}

export interface Empleado {
  id: string;
  empresaId?: string; // Multi-Tenancy
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  cargoId: string;
  formacion: string;
  experiencia: string;
  salarioBase?: number;
  contrato: ContratoEmpleado;
  familia: Familiar[];
  activo: boolean;
}

export interface Solicitud {
  id: string;
  empresaId?: string; // Multi-Tenancy
  empleadoId: string;
  tipo: TipoSolicitud;
  inicio: string;
  fin: string;
  motivo: string;
  estado: EstadoSolicitud;
  decisorId: string | null;
  fechaDecision: string | null;
  comentario: string;
  fechaCreacion?: string;
}

export interface PreguntaEncuesta {
  id: string;
  texto: string;
  tipo: 'escala' | 'texto';
}

export interface RespuestaEncuesta {
  empleadoId: string;
  [key: string]: string;
}

export interface Encuesta {
  id: string;
  titulo: string;
  preguntas: PreguntaEncuesta[];
  respuestas: RespuestaEncuesta[];
}

// ==========================================
// MODELO DE EVALUACIÓN DE DESEMPEÑO (100 PTS)
// Según documento técnico:
// Componente 1: Resultados del cargo (50%)
// Componente 2: Competencias (25%)
// Componente 3: Responsabilidades y Cumplimiento (15%)
// Componente 4: Desarrollo y Mejora (10%)
// ==========================================

export type NivelCumplimiento = 1 | 2 | 3 | 4 | 5;

export interface ItemResultadoEvaluacion {
  id: string;
  indicadorNombre: string;
  formula: string;
  unidad: string;
  meta: number;
  resultadoReal: number;
  evidencia: string; // ej. "Reporte OT-2026-09"
  peso: number; // Porcentaje del componente, ej. 15%
  nivelCalculado: NivelCumplimiento; // 1: <70%, 2: 70-89%, 3: 90-99%, 4: 100-109%, 5: >=110%
  puntajePonderado: number; // Aporte al subtotal de 50 pts
  observacion?: string;
}

export interface ItemCompetenciaEvaluacion {
  id: string;
  competenciaNombre: string;
  tipo: TipoCompetencia;
  nivelRequerido: NivelCompetencia;
  calificacionNivel: NivelCumplimiento; // 1 a 5 según conductas observables
  conductaObservable: string; // Descripción del comportamiento manifestado
  evidencia: string; // Obligatorio según modelo técnico (ej. caso PQR, orden, acta)
  observacion: string;
}

export interface ComponenteCumplimientoEvaluacion {
  cumplimientoProcedimientos: { nivel: NivelCumplimiento; evidencia: string; peso: 4 };
  sgSst: { 
    nivel: NivelCumplimiento; 
    evidencia: string; 
    peso: 4; 
    usaEpp: boolean;
    reportaCondiciones: boolean;
    cumpleTrabajoSeguro: boolean;
    participaCapacitaciones: boolean;
  };
  gestionInformacion: { nivel: NivelCumplimiento; evidencia: string; peso: 3 };
  cumplimientoAdministrativo: { nivel: NivelCumplimiento; evidencia: string; peso: 2 };
  convivenciaConducta: { nivel: NivelCumplimiento; evidencia: string; peso: 2 };
  totalObtenido: number; // Hasta 15 pts
}

export interface ComponenteDesarrolloEvaluacion {
  cumplimientoPlanAnterior: { nivel: NivelCumplimiento; detalle: string; peso: 4 };
  aprendizajeCapacitacion: { nivel: NivelCumplimiento; detalle: string; peso: 3 };
  iniciativasMejora: { nivel: NivelCumplimiento; detalle: string; peso: 3 }; // ej. aportó checklist que redujo reprocesos
  totalObtenido: number; // Hasta 10 pts
}

export type EstadoEvaluacion = 
  | 'BORRADOR'
  | 'AUTOEVALUACION'
  | 'EVALUACION_JEFE'
  | 'VALIDACION'
  | 'RETROALIMENTACION'
  | 'PLAN_DESARROLLO'
  | 'APROBADA'
  | 'CERRADA';

export type ClasificacionDesempeno = 
  | 'Excepcional'    // 90-100
  | 'Sobresaliente'  // 80-89
  | 'Satisfactorio'  // 70-79
  | 'En desarrollo'  // 60-69
  | 'Crítico';        // <60

export interface ItemPlanDesarrollo {
  id: string;
  competenciaOIndicador: string;
  brechaDetectada: string;
  causaRaiz: string;
  accionPropuesta: string; // Capacitación, coaching, reentrenamiento, etc.
  responsable: string;
  fechaCompromiso: string;
  evidenciaEsperada: string;
  estado: 'Pendiente' | 'En curso' | 'Cumplido';
}

export interface PonderacionMultifuente {
  jefePeso: number; // ej. 60
  autoevaluacionPeso: number; // ej. 10
  paresPeso: number; // ej. 15
  clientesPeso: number; // ej. 15
}

export interface SesgoDetectado {
  tipo: 'FaltaEvidencia' | 'EfectoHalo' | 'Indulgencia' | 'InconsistenciaFormula';
  mensaje: string;
  severidad: 'alta' | 'media' | 'baja';
}

export interface EvaluacionDesempeno {
  id: string;
  empresaId?: string;
  empleadoId: string;
  cargoId: string;
  periodo: string; // ej. "2026 - S1"
  evaluadorId: string;
  fechaCreacion: string;
  fechaCierre?: string;
  estado: EstadoEvaluacion;
  multifuente: PonderacionMultifuente;

  // 4 Componentes técnicos (100 pts)
  resultados: ItemResultadoEvaluacion[]; // Hasta 50 pts
  competencias: ItemCompetenciaEvaluacion[]; // Hasta 25 pts
  cumplimiento: ComponenteCumplimientoEvaluacion; // Hasta 15 pts
  desarrollo: ComponenteDesarrolloEvaluacion; // Hasta 10 pts

  // Puntuaciones
  subtotalResultados: number; // / 50
  subtotalCompetencias: number; // / 25
  subtotalCumplimiento: number; // / 15
  subtotalDesarrollo: number; // / 10
  puntajeFinal: number; // / 100
  clasificacion: ClasificacionDesempeno;

  // Auditoría y asistencia de IA
  sesgosYAlertas: SesgoDetectado[];
  retroalimentacionTexto: string;
  planDesarrollo: ItemPlanDesarrollo[];
  historialCambios: {
    fecha: string;
    usuario: string;
    accion: string;
    estadoAnterior: string;
    estadoNuevo: string;
  }[];
}

// ==========================================
// 1. MÓDULO DE NÓMINA Y PRESTACIONES SOCIALES (COLOMBIA)
// Normatividad: Código Sustantivo del Trabajo (CST), Ley 100/93,
// Ley 1607/12, Ley 1819/16, Ley 2101/21 y decretos reglamentarios
// ==========================================

export type ClaseRiesgoARL = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface ParametrosLegalesNomina {
  anoVigencia: number;
  smmlv: number; // Salario Mínimo Mensual Legal Vigente
  auxilioTransporte: number; // Auxilio Legal de Transporte
  uvt: number; // Unidad de Valor Tributario
  topeSmmlvAuxilioTransporte: number; // Máximo 2 SMMLV
  topeSmmlvExoneracionParafiscales: number; // Menor a 10 SMMLV (Art 114-1 ET)
  pctSaludEmpleado: number; // 4.0%
  pctPensionEmpleado: number; // 4.0%
  pctSaludEmpleador: number; // 8.5% (exonerable)
  pctPensionEmpleador: number; // 12.0%
  tarifasARL: Record<ClaseRiesgoARL, number>; // I: 0.522%, II: 1.044%, III: 2.436%, IV: 4.350%, V: 6.960%
  pctCajaCompensacion: number; // 4.0%
  pctSena: number; // 2.0% (exonerable)
  pctIcbf: number; // 3.0% (exonerable)
  pctCesantias: number; // 8.33%
  pctInteresesCesantias: number; // 1.0% mensual / 12% anual
  pctPrimaServicios: number; // 8.33%
  pctVacaciones: number; // 4.17%
  horasSemanalesJornada?: number; // p.ej. 42h (Ley 2101 de 2021)
  horasMensualesJornada?: number; // Jornada comercial mensual Ley 2101/21 (210 horas en 2026 para 42h/semana)
  factorRecargoNocturno?: number; // 0.35 (35%)
  factorExtraDiurna?: number; // 1.25 (125% - recargo 25%)
  factorExtraNocturna?: number; // 1.75 (175% - recargo 75%)
  factorDominicalFestivoDiurno?: number; // 1.75 (175% - recargo 75%)
  factorDominicalFestivoNocturno?: number; // 2.10 (210% - recargo 110%)
  exoneradoParafiscalesLey1607?: boolean; // Exoneración general si aplica Art 114-1 ET
}

export interface ReservaProvisionEmpleado {
  empleadoId: string;
  empleadoNombre: string;
  cargoNombre: string;
  salarioBasico: number;
  basePrestaciones: number;
  baseVacaciones: number;
  mesesAcumuladosAno: number;
  diasAcumuladosAno: number;
  cesantiasMes: number;
  interesesCesantiasMes: number;
  primaServiciosMes: number;
  vacacionesMes: number;
  totalProvisionesMes: number;
  cesantiasAcumuladas: number;
  interesesCesantiasAcumulados: number;
  primaServiciosAcumulada: number;
  vacacionesAcumuladas: number;
  totalPasivoAcumulado: number;
  pensionPatronalMes: number;
  saludPatronalMes: number;
  arlMes: number;
  cajaCompensacionMes: number;
  senaMes: number;
  icbfMes: number;
  totalCargaPatronalMes: number;
  totalCostoEmpresaMes: number;
}

export interface NovedadNominaEmpleado {
  diasTrabajados: number; // 30 días base mes comercial
  horasExtrasDiurnas: number; // Recargo 25%
  horasExtrasNocturnas: number; // Recargo 75%
  horasFestivasDiurnas: number; // Recargo 75% o 100%
  horasFestivasNocturnas: number; // Recargo 110% o 150%
  recargoNocturnoOrdinario: number; // Recargo 35%
  bonificacionesSalariales: number;
  bonificacionesNoSalariales: number;
  comisiones: number;
  incapacidadDias: number;
  licenciaRemuneradaDias: number;
  prestamosYDeducciones: number;
  otrasDeduccionesTexto?: string;
}

export interface DetalleDevengado {
  salarioBasico: number;
  salarioProporcional: number;
  auxilioTransporte: number;
  valorHorasExtrasYRecargos: number;
  bonificacionesYComisiones: number;
  totalDevengado: number;
}

export interface DetalleDeducciones {
  saludEmpleado: number; // 4%
  pensionEmpleado: number; // 4%
  fondoSolidaridadPensional: number; // 1% - 2% si > 4 SMMLV
  retencionFuente: number;
  prestamosOtrasDeducciones: number;
  totalDeducciones: number;
}

export interface DetalleAportesEmpresa {
  saludEmpleador: number; // 8.5% o 0 si exonerado
  pensionEmpleador: number; // 12%
  arl: number; // Tarifa según clase
  tarifaArlAplicada: number;
  cajaCompensacion: number; // 4%
  sena: number; // 2% o 0 si exonerado
  icbf: number; // 3% o 0 si exonerado
  totalSeguridadSocialYParafiscales: number;
  exoneradoArt114_1: boolean;
}

export interface DetalleProvisionesPrestaciones {
  cesantias: number; // 8.33%
  interesesCesantias: number; // 1%
  primaServicios: number; // 8.33%
  vacaciones: number; // 4.17%
  totalProvisiones: number;
}

export interface LiquidacionEmpleadoNomina {
  empleadoId: string;
  empleadoNombre: string;
  empleadoDocumento: string;
  cargoNombre: string;
  tipoContrato: string;
  claseRiesgoARL: ClaseRiesgoARL;
  salarioBasicoPactado: number;
  tieneDerechoAuxilioTransporte: boolean;
  novedades: NovedadNominaEmpleado;
  devengados: DetalleDevengado;
  deducciones: DetalleDeducciones;
  netoAPagar: number;
  aportesEmpresa: DetalleAportesEmpresa;
  provisiones: DetalleProvisionesPrestaciones;
  costoTotalEmpresa: number;
}

export interface PeriodoNomina {
  id: string;
  empresaId?: string;
  codigoPeriodo: string; // ej. "2026-03"
  nombre: string; // "Nómina Mensual Marzo 2026"
  mes: number;
  ano: number;
  tipoPeriodo: 'Mensual' | 'Primera Quincena' | 'Segunda Quincena';
  tipo?: 'Mensual' | 'Primera Quincena' | 'Segunda Quincena';
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string;
  estado: 'Borrador' | 'Liquidada' | 'Pagada';
  liquidaciones: LiquidacionEmpleadoNomina[];
  totales: {
    totalDevengado: number;
    totalDeducciones: number;
    totalNetoPagar: number;
    totalSeguridadSocialEmpresa: number;
    totalParafiscalesEmpresa: number;
    totalProvisionesPrestaciones: number;
    costoGranTotalEmpresa: number;
  };
}

export interface SimulacionLiquidacionDefinitiva {
  empleadoId: string;
  fechaIngreso: string;
  fechaRetiro: string;
  motivoRetiro: 'Renuncia voluntaria' | 'Despido con justa causa' | 'Despido sin justa causa' | 'Terminación contrato término fijo' | 'Mutuo acuerdo';
  salarioBase: number;
  incluyeAuxilioTransporte: boolean;
  diasTrabajadosPeriodoActual: number;
  diasTotalesLaborados: number;
  cesantiasPendientes: number;
  interesesCesantiasPendientes: number;
  primaServiciosPendiente: number;
  vacacionesPendientesDias: number;
  valorVacacionesPendientes: number;
  indemnizacionDespidoInjusto: number; // Art 64 CST
  totalLiquidacionDefinitiva: number;
}

// ==========================================
// 2. MÓDULO DE SG-SST (RESOLUCIÓN 0312 DE 2019 - 21 ESTÁNDARES MÍNIMOS)
// Para empresas de 11 a 50 trabajadores clasificadas en Riesgo I, II o III
// ==========================================

export type CicloPHVA = 'Planear' | 'Hacer' | 'Verificar' | 'Actuar';
export type EstadoEstandar = 'CUMPLE' | 'NO_CUMPLE' | 'NO_APLICA_JUSTIFICADO';

export interface EstandarMinimoSST {
  id: string; // ej. "1.1.1"
  numeral: string;
  ciclo: CicloPHVA;
  categoria: string; // "I. Recursos", "II. Gestión Integral", etc.
  itemEstandar: string;
  pesoPorcentual: number; // Suma total = 100.0%
  criterioResolucion0312: string;
  modoVerificacion: string;
  estado: EstadoEstandar;
  evidenciaRegistrada: string;
  fechaVerificacion: string;
  responsableVerificacion: string;
  observaciones: string;
  planMejoraAccion?: string;
  planMejoraFecha?: string;
  planMejoraResponsable?: string;
}

export interface PeligroRiesgoGTC45 {
  id: string;
  proceso: string;
  zonaLugar: string;
  actividad: string;
  rutinaria: boolean;
  clasificacionPeligro: 'Biológico' | 'Físico' | 'Químico' | 'Psicosocial' | 'Biomecánico' | 'Condiciones de Seguridad' | 'Fenómenos Naturales';
  descripcionPeligro: string;
  efectosPosibles: string;
  controlesExistentes: {
    fuente: string;
    medio: string;
    individuo: string;
  };
  nivelDeficiencia: number; // 2, 6, 10
  nivelExposicion: number; // 1, 2, 3, 4
  nivelProbabilidad: number; // ND * NE
  interpretacionProbabilidad: 'Baja' | 'Media' | 'Alta' | 'Muy Alta';
  nivelConsecuencia: number; // 10, 25, 60, 100
  nivelRiesgo: number; // NP * NC
  interpretacionRiesgo: 'I' | 'II' | 'III' | 'IV';
  aceptabilidadRiesgo: 'No Aceptable' | 'No Aceptable o Aceptable con Control Específico' | 'Mejorable' | 'Aceptable';
  medidasIntervencion: {
    eliminacion: string;
    sustitucion: string;
    controlesIngenieria: string;
    controlesAdministrativos: string;
    epp: string;
  };
}

export interface ActaComiteSST {
  id: string;
  tipo: 'COPASST' | 'Comité de Convivencia' | 'Brigada de Emergencia';
  numeroActa: string;
  fecha: string;
  lugar: string;
  asistentes: string[];
  temasTratados: string;
  compromisos: {
    tarea: string;
    responsable: string;
    fechaLimite: string;
    estado: 'Pendiente' | 'En proceso' | 'Cumplido';
  }[];
}

export interface EstadisticaSiniestralidadSST {
  mesAno: string;
  numeroTrabajadores: number;
  horasHombreTrabajadas: number;
  accidentesTrabajo: number;
  diasIncapacidadAT: number;
  enfermedadesLaborales: number;
  diasIncapacidadEL: number;
  indiceFrecuenciaAT: number; // (AT * 240.000) / HHT
  indiceSeveridadAT: number; // (Días * 240.000) / HHT
  mortalidad: number;
  tasaAusentismoPct: number;
}

// ==========================================
// 3. MÓDULO DE PLAN DE CAPACITACIONES
// Con asignación por cargos, control de asistencia,
// y evaluación de conocimiento previa por el administrador
// ==========================================

export type TipoCapacitacion = 'SST' | 'Técnica' | 'Habilidades Blandas' | 'Normativa y Cumplimiento' | 'Gestión Operativa';
export type ModalidadCapacitacion = 'Presencial' | 'Virtual sincrónica' | 'Virtual asincrónica' | 'Mixta' | 'Asincrónica';

export interface PreguntaExamenCapacitacion {
  id: string;
  enunciado: string;
  opciones: string[];
  opcionCorrectaIndice: number; // 0, 1, 2, 3
  explicacionRespuesta: string;
  puntos: number;
}

export type PreguntaExamen = PreguntaExamenCapacitacion;

export interface ExamenConocimientoCapacitacion {
  id: string;
  titulo: string;
  instrucciones: string;
  notaMinimaAprobatoria: number; // e.g. 80 sobre 100
  tiempoLimiteMinutos?: number;
  preguntas: PreguntaExamenCapacitacion[];
}

export interface RegistroParticipanteCapacitacion {
  empleadoId: string;
  cargoId: string;
  asistenciaConfirmada: boolean;
  fechaHoraAsistencia?: string;
  fechaAsistencia?: string;
  firmaOConfirmacionTexto?: string;
  evaluacionPresentada: boolean;
  fechaHoraEvaluacion?: string;
  fechaEvaluacion?: string;
  respuestasEmpleado?: number[]; // Índices de respuestas seleccionadas
  puntajeObtenido?: number; // 0 a 100
  calificacionObtenida?: number;
  aprobado?: boolean;
  aprobada?: boolean;
  intentosRealizados?: number;
  retroalimentacion?: string;
  codigoCertificado?: string;
}

export interface Capacitacion {
  id: string;
  codigo: string; // ej. "CAP-2026-001"
  titulo: string;
  objetivo: string;
  tipo: TipoCapacitacion;
  facilitador: string;
  entidadFacilitadora?: string;
  duracionHoras: number;
  modalidad: ModalidadCapacitacion;
  fechaProgramada: string;
  horaInicio: string;
  lugarOEnlace: string;
  cargosAsignados: string[]; // IDs de los cargos o ['TODOS']
  estado: 'Programada' | 'En ejecución' | 'Finalizada' | 'Cancelada';
  examenConocimiento: ExamenConocimientoCapacitacion;
  participantes: RegistroParticipanteCapacitacion[];
}

// ==========================================
// 4. MÓDULO DE GESTIÓN DE USUARIOS Y ACCESOS
// ==========================================

export type RolSistema = 'superadmin' | 'admin_gh' | 'lider_area' | 'responsable_sst' | 'empleado';
export type EstadoUsuario = 'activo' | 'inactivo' | 'bloqueado';

export interface PermisoSistema {
  id: string;
  modulo: string;
  descripcion: string;
}

export interface UsuarioSistema {
  id: string;
  nombre: string;
  documento: string;
  email: string;
  rol: RolSistema;
  empresaId?: string; // Aislamiento Multi-Tenant (ej. 'empresa-bgroup-001')
  empleadoId?: string; // Vinculación con registro de empleado
  cargoNombre?: string;
  estado: EstadoUsuario;
  ultimoAcceso: string;
  fechaCreacion: string;
  dobleFactorHabilitado: boolean;
  password?: string; // Solo volátil en memoria durante el despacho inicial; NUNCA persistido en Firestore
  permisos: string[]; // IDs de módulos autorizados: 'estructura', 'cargos', 'empleados', 'evaluaciones', 'solicitudes', 'capacitaciones', 'sst', 'nomina', 'usuarios', 'documentos'
}

export interface LogAuditoriaUsuario {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: string;
  modulo: string;
  ip: string;
  fechaHora: string;
  tipo: 'INFO' | 'SEGURIDAD' | 'MODIFICACION';
}

// ==========================================
// 5. VOTACIONES COPASST Y COMITÉ DE CONVIVENCIA
// Conforme a Res. 2013/1986, Res. 652/2012 y Res. 0312/2019
// ==========================================

export type TipoComiteEleccion = 'COPASST' | 'Comité de Convivencia';
export type EstadoVotacion = 'Configuracion' | 'Abierta' | 'Cerrada' | 'Escrutada';

export interface CandidatoVotacion {
  id: string;
  nombre: string;
  cargo: string;
  documento: string;
  empleadoId: string;
  numeroTarjeton: number;
  propuesta: string;
  foto?: string;
  votosObtenidos: number;
  esPrincipal?: boolean;
  esSuplente?: boolean;
}

export interface ProcesoVotacionSST {
  id: string;
  tipo: TipoComiteEleccion;
  titulo: string;
  periodo: string; // ej. "2026 - 2028"
  fechaApertura: string;
  fechaCierre: string;
  estado: EstadoVotacion;
  censoElectoralTotal: number; // Total trabajadores habilitados
  candidatos: CandidatoVotacion[];
  votosEnBlanco: number;
  totalVotosEmitidos: number;
  votantesRegistrados: {
    empleadoId: string;
    fechaHoraVoto: string;
    codigoCertificado: string;
  }[];
  juradosElectorales: string[];
  actaApertura?: string;
  actaCierreEscrutinio?: string;
}

export interface CertificadoVotoEmpleado {
  codigoCertificado: string;
  procesoId: string;
  tipoProceso: TipoComiteEleccion;
  periodo: string;
  empleadoId: string;
  empleadoNombre: string;
  empleadoDocumento: string;
  fechaHoraVoto: string;
  mesaVotacion: string;
}

// ==========================================
// 6. CUADRO DE CONTROL DE VACACIONES Y NOVEDADES
// Conforme al Art. 186 y siguientes del Código Sustantivo del Trabajo
// ==========================================

export interface ControlVacacionesEmpleado {
  empleadoId: string;
  empleadoNombre: string;
  documento: string;
  cargoNombre: string;
  fechaIngreso: string;
  diasLaboradosTotal: number;
  diasVacacionesCausados: number; // (diasLaborados * 15) / 360
  diasDisfrutadosAcumulados: number;
  diasEnSolicitud: number;
  diasPendientesDisfrute: number; // causados - disfrutados
  periodosAcumulados: number;
  estadoAlerta: 'Al día' | '1 periodo' | 'Crítico (≥ 2 periodos)';
  provisionAcumuladaCOP: number;
  ultimoPeriodoDisfrutado?: string;
}

export interface SolicitudVacacionDetalle {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaSolicitud: string;
  fechaInicio: string;
  fechaFin: string;
  fechaReintegro: string;
  diasHabiles: number;
  diasCalendario: number;
  periodoCorrespondiente: string; // ej. "2024 - 2025"
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Disfrutada';
  reemplazoCargo?: string;
  reemplazoEmpleadoId?: string;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  liquidadoEnNomina: boolean;
  valorPagadoCOP?: number;
  motivoRechazo?: string;
}

// ==========================================
// 7. INVENTARIO Y CONTROL DE EPPs (Res. 2400/1979 & Dec. 1072/2015)
// ==========================================

export type CategoriaEPP =
  | 'Protección Cabeza'
  | 'Protección Visual y Facial'
  | 'Protección Auditiva'
  | 'Protección Respiratoria'
  | 'Protección Manos'
  | 'Protección Pies'
  | 'Trabajo Seguro en Alturas'
  | 'Protección Corporal / Ropa de Trabajo';

export interface ItemInventarioEPP {
  id: string;
  empresaId?: string;
  codigo: string; // ej. EPP-CAS-01
  nombre: string;
  categoria: CategoriaEPP;
  normaTecnica: string; // ANSI Z89.1, OSHA 1926.502, ASTM F2413, etc.
  stockActual: number;
  stockMinimo: number;
  unidad: 'Unidad' | 'Par' | 'Juego / Kit' | 'Caja';
  vidaUtilDias: number; // Días estimados de durabilidad
  tallasDisponibles: string[]; // ej. ['Única'], ['38', '39', '40', '41', '42'], ['S', 'M', 'L', 'XL']
  descripcion: string;
  ubicacionAlmacen: string;
  proveedor?: string;
  precioUnitarioEstimadoCOP?: number;
}

export type EstadoSolicitudEPP = 'Pendiente' | 'Aprobada' | 'Entregada' | 'Rechazada';

export interface SolicitudEntregaEPP {
  id: string;
  empresaId?: string;
  empleadoId: string;
  empleadoNombre: string;
  cargoNombre: string;
  eppId: string;
  eppCodigo: string;
  eppNombre: string;
  eppCategoria: CategoriaEPP;
  talla: string;
  cantidad: number;
  fechaSolicitud: string;
  motivo:
    | 'Dotación Periódica Obligatoria'
    | 'Desgaste Normal / Fin Vida Útil'
    | 'Deterioro / Accidente Operativo'
    | 'Pérdida o Extravío Reportado'
    | 'Nuevo Ingreso o Cambio de Cargo';
  observacionesEmpleado: string;
  estado: EstadoSolicitudEPP;
  // Campos al momento de la entrega:
  fechaEntrega?: string;
  responsableEntrega?: string;
  loteOSerie?: string;
  observacionesEntrega?: string;
  actaEntregaNumero?: string;
  firmaConformidadTrabajador?: boolean;
  proximaReposicionSugerida?: string;
}

export type AccionAuditoria =
  | 'CREACION'
  | 'ACTUALIZACION'
  | 'ELIMINACION'
  | 'EXPORTACION'
  | 'CIERRE_PERIODO'
  | 'APERTURA_PERIODO'
  | 'PURGA_DATOS';

export interface EventoAuditoria {
  id?: string;
  timestamp: string;
  accion: AccionAuditoria | string;
  entidad: string;
  entidadId?: string;
  detalle: string;
  usuario?: {
    uid?: string;
    email?: string;
    nombre?: string;
    rol?: string;
  };
  empresaId?: string;
  metadatos?: Record<string, any>;
}
