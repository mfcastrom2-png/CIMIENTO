import {
  ClaseRiesgoARL,
  DetalleAportesEmpresa,
  DetalleDeducciones,
  DetalleDevengado,
  DetalleProvisionesPrestaciones,
  Empleado,
  LiquidacionEmpleadoNomina,
  NovedadNominaEmpleado,
  ParametrosLegalesNomina,
  PeriodoNomina,
  ReservaProvisionEmpleado,
  SimulacionLiquidacionDefinitiva
} from '../types';

/**
 * PARÁMETROS LEGALES DE REFERENCIA COLOMBIA 2026
 * Actualizados con la normatividad laboral vigente:
 * - Salario Mínimo Legal Mensual Vigente (SMMLV): $1.560.000 COP
 * - Auxilio Legal de Transporte (<= 2 SMMLV): $220.000 COP
 * - Unidad de Valor Tributario (UVT DIAN 2026): $52.374 COP
 * - Tope auxilio de transporte: 2 SMMLV ($3.120.000 COP)
 * - Tope exoneración aportes Art 114-1 E.T. (Salud, SENA, ICBF): 10 SMMLV ($15.600.000 COP)
 * - Jornada semanal máxima legal (Ley 2101 de 2021 vigente en 2026): 42 horas semanales
 * - Divisor mensual de horas ordinarias: 210 horas (42h / 6d * 30d)
 */
export const PARAMETROS_COLOMBIA_2026: ParametrosLegalesNomina = {
  anoVigencia: 2026,
  smmlv: 1560000, // Salario mínimo legal mensual vigente 2026
  auxilioTransporte: 220000, // Auxilio legal de transporte 2026
  uvt: 52374, // Unidad de Valor Tributario DIAN 2026
  topeSmmlvAuxilioTransporte: 2, // Hasta 2 SMMLV ($3.120.000)
  topeSmmlvExoneracionParafiscales: 10, // Menos de 10 SMMLV para exoneración de Salud, Sena, ICBF (Art 114-1 E.T.) ($15.600.000)
  pctSaludEmpleado: 0.04,
  pctPensionEmpleado: 0.04,
  pctSaludEmpleador: 0.085,
  pctPensionEmpleador: 0.12,
  tarifasARL: {
    I: 0.00522,   // Riesgo I: 0.522% (Administrativo, financiero, oficina)
    II: 0.01044,  // Riesgo II: 1.044% (Comercio, algunos laboratorios)
    III: 0.02436, // Riesgo III: 2.436% (Procesos de manufactura, brigadas)
    IV: 0.04350,  // Riesgo IV: 4.350% (Transporte, operaciones técnicas pesadas, trabajo en alturas/redes)
    V: 0.06960    // Riesgo V: 6.960% (Minería, construcción pesada)
  },
  pctCajaCompensacion: 0.04,
  pctSena: 0.02,
  pctIcbf: 0.03,
  pctCesantias: 0.0833, // 8.33% (1 mes por año laborado)
  pctInteresesCesantias: 0.01, // 1% mensual sobre cesantías (12% anual)
  pctPrimaServicios: 0.0833, // 8.33% (1 mes por año: 1er semestre en junio y 2do semestre en diciembre)
  pctVacaciones: 0.0417, // 4.17% (15 días hábiles remunerados por año = 15/360)
  horasSemanalesJornada: 42, // Ley 2101/2021: 42 horas semanales vigentes
  horasMensualesJornada: 210, // Ley 2101/2021: 42 horas semanales vigentes en 2026
  factorRecargoNocturno: 0.35, // 35% recargo nocturno
  factorExtraDiurna: 1.25, // 25% recargo (factor 1.25)
  factorExtraNocturna: 1.75, // 75% recargo (factor 1.75)
  factorDominicalFestivoDiurno: 1.75, // 75% recargo (factor 1.75)
  factorDominicalFestivoNocturno: 2.10, // 110% recargo (factor 2.10)
  exoneradoParafiscalesLey1607: true
};

export const MESES_COLOMBIA = [
  { id: 1, nombre: 'Enero', codigo: '01', dias: 31 },
  { id: 2, nombre: 'Febrero', codigo: '02', dias: 28 },
  { id: 3, nombre: 'Marzo', codigo: '03', dias: 31 },
  { id: 4, nombre: 'Abril', codigo: '04', dias: 30 },
  { id: 5, nombre: 'Mayo', codigo: '05', dias: 31 },
  { id: 6, nombre: 'Junio', codigo: '06', dias: 30 },
  { id: 7, nombre: 'Julio', codigo: '07', dias: 31 },
  { id: 8, nombre: 'Agosto', codigo: '08', dias: 31 },
  { id: 9, nombre: 'Septiembre', codigo: '09', dias: 30 },
  { id: 10, nombre: 'Octubre', codigo: '10', dias: 31 },
  { id: 11, nombre: 'Noviembre', codigo: '11', dias: 30 },
  { id: 12, nombre: 'Diciembre', codigo: '12', dias: 31 }
];

export function obtenerNombreMes(mesNumero: number): string {
  const m = MESES_COLOMBIA.find(item => item.id === mesNumero);
  return m ? m.nombre : `Mes ${mesNumero}`;
}

export function obtenerDiasMes(ano: number, mesNumero: number): number {
  return new Date(ano, mesNumero, 0).getDate();
}

// Extrae el valor numérico de un salario formateado (ej. "$9.500.000 + comisiones" -> 9500000)
export function parseSalarioNumerico(salarioStr: string): number {
  if (!salarioStr) return 0;
  const soloNumeros = salarioStr.replace(/[^0-9]/g, '');
  const parsed = parseInt(soloNumeros, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Determina la clase de riesgo ARL según el cargo y actividad
export function determinarClaseRiesgoARL(cargoCodigo: string, cargoNombre: string): ClaseRiesgoARL {
  const nombre = (cargoNombre || '').toLowerCase();
  const codigo = (cargoCodigo || '').toLowerCase();

  if (nombre.includes('redes') || nombre.includes('técnico') || nombre.includes('alturas') || codigo.includes('tec')) {
    return 'IV'; // Técnico en campo, trabajo con infraestructura y alturas
  }
  if (nombre.includes('operativo') || nombre.includes('campo')) {
    return 'II';
  }
  return 'I'; // Riesgo I por defecto administrativo / dirección
}

// Calcula la nómina periódica para un empleado
export function calcularLiquidacionEmpleado(
  empleado: Empleado,
  cargoNombre: string,
  cargoCodigo: string,
  novedades: NovedadNominaEmpleado,
  parametros: ParametrosLegalesNomina = PARAMETROS_COLOMBIA_2026
): LiquidacionEmpleadoNomina {
  const salarioBasicoPactado = parseSalarioNumerico(empleado.contrato.salario);
  const claseRiesgoARL = determinarClaseRiesgoARL(cargoCodigo, cargoNombre);

  const diasTrabajados = Math.max(0, Math.min(30, novedades.diasTrabajados ?? 30));
  const salarioProporcional = Math.round((salarioBasicoPactado / 30) * diasTrabajados);

  // Auxilio de transporte: aplica si el salario básico pactado es menor o igual a 2 SMMLV
  // y se paga proporcional a los días laborados
  const tieneDerechoAuxilioTransporte = salarioBasicoPactado <= (parametros.smmlv * parametros.topeSmmlvAuxilioTransporte);
  const auxilioTransporte = tieneDerechoAuxilioTransporte
    ? Math.round((parametros.auxilioTransporte / 30) * diasTrabajados)
    : 0;

  // Valor hora ordinaria: jornada mensual comercial en 2026 de 210 horas (Ley 2101 de 2021: 42 horas semanales)
  const horasMensuales = parametros.horasMensualesJornada || 210;
  const valorHoraOrdinaria = salarioBasicoPactado / horasMensuales;

  // Horas extras y recargos según Código Sustantivo del Trabajo (CST) parametrizables:
  const factorHED = parametros.factorExtraDiurna ?? 1.25;
  const factorHEN = parametros.factorExtraNocturna ?? 1.75;
  const factorHFD = parametros.factorDominicalFestivoDiurno ?? 1.75;
  const factorHFN = parametros.factorDominicalFestivoNocturno ?? 2.10;
  const factorRN = parametros.factorRecargoNocturno ?? 0.35;

  const valorHED = Math.round(valorHoraOrdinaria * factorHED * (novedades.horasExtrasDiurnas || 0));
  const valorHEN = Math.round(valorHoraOrdinaria * factorHEN * (novedades.horasExtrasNocturnas || 0));
  const valorHFD = Math.round(valorHoraOrdinaria * factorHFD * (novedades.horasFestivasDiurnas || 0));
  const valorHFN = Math.round(valorHoraOrdinaria * factorHFN * (novedades.horasFestivasNocturnas || 0));
  const valorRecargoNocturno = Math.round(valorHoraOrdinaria * factorRN * (novedades.recargoNocturnoOrdinario || 0));

  const valorHorasExtrasYRecargos = valorHED + valorHEN + valorHFD + valorHFN + valorRecargoNocturno;
  const bonificacionesYComisiones = (novedades.bonificacionesSalariales || 0) + (novedades.comisiones || 0);

  const totalDevengado = salarioProporcional + auxilioTransporte + valorHorasExtrasYRecargos + bonificacionesYComisiones;

  // IBC (Ingreso Base de Cotización) para Seguridad Social:
  // El auxilio de transporte NO constituye salario ni hace parte del IBC (Art. 7 Ley 1 de 1963)
  const ibcSeguridadSocial = Math.max(
    parametros.smmlv,
    salarioProporcional + valorHorasExtrasYRecargos + bonificacionesYComisiones
  );

  // Deducciones obligatorias del trabajador:
  const saludEmpleado = Math.round(ibcSeguridadSocial * parametros.pctSaludEmpleado); // 4%
  const pensionEmpleado = Math.round(ibcSeguridadSocial * parametros.pctPensionEmpleado); // 4%

  // Fondo de Solidaridad Pensional (FSP): aplica para IBC >= 4 SMMLV (Ley 100/93 Art. 27)
  let pctFSP = 0;
  const smmlvIbc = ibcSeguridadSocial / parametros.smmlv;
  if (smmlvIbc >= 20) pctFSP = 0.020;
  else if (smmlvIbc >= 19) pctFSP = 0.018;
  else if (smmlvIbc >= 18) pctFSP = 0.016;
  else if (smmlvIbc >= 17) pctFSP = 0.014;
  else if (smmlvIbc >= 16) pctFSP = 0.012;
  else if (smmlvIbc >= 4) pctFSP = 0.010;

  const fondoSolidaridadPensional = Math.round(ibcSeguridadSocial * pctFSP);

  // Retención en la fuente (proyección Art. 383 Estatuto Tributario)
  // Depuración de ingresos: IBC - Aportes obligatorios salud/pensión/FSP
  const baseGravablePesos = Math.max(0, totalDevengado - saludEmpleado - pensionEmpleado - fondoSolidaridadPensional);
  const baseGravableUVT = baseGravablePesos / parametros.uvt;
  let retencionFuente = 0;
  if (baseGravableUVT > 95) {
    if (baseGravableUVT <= 150) {
      retencionFuente = Math.round(((baseGravableUVT - 95) * 0.19) * parametros.uvt);
    } else if (baseGravableUVT <= 360) {
      retencionFuente = Math.round((((baseGravableUVT - 150) * 0.28) + 10) * parametros.uvt);
    } else {
      retencionFuente = Math.round((((baseGravableUVT - 360) * 0.33) + 69) * parametros.uvt);
    }
  }

  const prestamosOtrasDeducciones = novedades.prestamosYDeducciones || 0;
  const totalDeducciones = saludEmpleado + pensionEmpleado + fondoSolidaridadPensional + retencionFuente + prestamosOtrasDeducciones;

  const netoAPagar = totalDevengado - totalDeducciones;

  // Aportes de la Empresa (Seguridad Social y Parafiscales):
  // Exoneración Art. 114-1 E.T. (Ley 1607/2012 y Ley 1819/2016):
  // Empleadores están exonerados de Salud (8.5%), SENA (2%) e ICBF (3%) por trabajadores que devenguen menos de 10 SMMLV
  const devengaMenos10SMMLV = salarioBasicoPactado < (parametros.smmlv * parametros.topeSmmlvExoneracionParafiscales);
  const exoneradoArt114_1 = devengaMenos10SMMLV;

  const saludEmpleador = exoneradoArt114_1 ? 0 : Math.round(ibcSeguridadSocial * parametros.pctSaludEmpleador);
  const pensionEmpleador = Math.round(ibcSeguridadSocial * parametros.pctPensionEmpleador); // 12%

  const tarifaArlAplicada = parametros.tarifasARL[claseRiesgoARL] || parametros.tarifasARL.I;
  const arl = Math.round(ibcSeguridadSocial * tarifaArlAplicada);

  const cajaCompensacion = Math.round(ibcSeguridadSocial * parametros.pctCajaCompensacion); // 4% siempre
  const sena = exoneradoArt114_1 ? 0 : Math.round(ibcSeguridadSocial * parametros.pctSena);
  const icbf = exoneradoArt114_1 ? 0 : Math.round(ibcSeguridadSocial * parametros.pctIcbf);

  const totalSeguridadSocialYParafiscales = saludEmpleador + pensionEmpleador + arl + cajaCompensacion + sena + icbf;

  // Provisiones para Prestaciones Sociales:
  // Base cesantías y prima = Devengado salarial + Auxilio de transporte
  const basePrestacionesConAuxilio = totalDevengado;
  // Base vacaciones = Solo salario sin auxilio de transporte
  const baseVacacionesSinAuxilio = totalDevengado - auxilioTransporte;

  const cesantias = Math.round(basePrestacionesConAuxilio * parametros.pctCesantias); // 8.33%
  const interesesCesantias = Math.round(cesantias * parametros.pctInteresesCesantias); // 1% mensual sobre cesantías
  const primaServicios = Math.round(basePrestacionesConAuxilio * parametros.pctPrimaServicios); // 8.33%
  const vacaciones = Math.round(baseVacacionesSinAuxilio * parametros.pctVacaciones); // 4.17%

  const totalProvisiones = cesantias + interesesCesantias + primaServicios + vacaciones;

  // Costo Total Empresa = Lo que recibe el trabajador (neto) + aportes asumidos + retenciones pagadas a entidades + provisiones
  const costoTotalEmpresa = totalDevengado + totalSeguridadSocialYParafiscales + totalProvisiones;

  const devengados: DetalleDevengado = {
    salarioBasico: salarioBasicoPactado,
    salarioProporcional,
    auxilioTransporte,
    valorHorasExtrasYRecargos,
    bonificacionesYComisiones,
    totalDevengado
  };

  const deducciones: DetalleDeducciones = {
    saludEmpleado,
    pensionEmpleado,
    fondoSolidaridadPensional,
    retencionFuente,
    prestamosOtrasDeducciones,
    totalDeducciones
  };

  const aportesEmpresa: DetalleAportesEmpresa = {
    saludEmpleador,
    pensionEmpleador,
    arl,
    tarifaArlAplicada,
    cajaCompensacion,
    sena,
    icbf,
    totalSeguridadSocialYParafiscales,
    exoneradoArt114_1
  };

  const provisiones: DetalleProvisionesPrestaciones = {
    cesantias,
    interesesCesantias,
    primaServicios,
    vacaciones,
    totalProvisiones
  };

  return {
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    empleadoDocumento: empleado.documento,
    cargoNombre,
    tipoContrato: empleado.contrato.tipo,
    claseRiesgoARL,
    salarioBasicoPactado,
    tieneDerechoAuxilioTransporte,
    novedades,
    devengados,
    deducciones,
    netoAPagar,
    aportesEmpresa,
    provisiones,
    costoTotalEmpresa
  };
}

// Simulador de Liquidación Definitiva de Contrato Laboral (CST)
export function simularLiquidacionDefinitiva(
  empleado: Empleado,
  motivoRetiro: 'Renuncia voluntaria' | 'Despido con justa causa' | 'Despido sin justa causa' | 'Terminación contrato término fijo' | 'Mutuo acuerdo',
  fechaRetiroStr: string,
  diasVacacionesPendientes: number = 0,
  parametros: ParametrosLegalesNomina = PARAMETROS_COLOMBIA_2026
): SimulacionLiquidacionDefinitiva {
  const salarioBase = parseSalarioNumerico(empleado.contrato.salario);
  const incluyeAuxilioTransporte = salarioBase <= (parametros.smmlv * parametros.topeSmmlvAuxilioTransporte);
  const auxTransporte = incluyeAuxilioTransporte ? parametros.auxilioTransporte : 0;
  const basePrestaciones = salarioBase + auxTransporte;

  const fechaIngreso = new Date(empleado.contrato.inicio);
  const fechaRetiro = new Date(fechaRetiroStr || new Date().toISOString().slice(0, 10));

  const diffTime = Math.max(0, fechaRetiro.getTime() - fechaIngreso.getTime());
  const diasTotalesLaborados = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  // Días laborados en el semestre actual para prima y en el año actual para cesantías
  const inicioAnoActual = new Date(fechaRetiro.getFullYear(), 0, 1);
  const diffAno = Math.max(0, fechaRetiro.getTime() - inicioAnoActual.getTime());
  const diasAnoActual = Math.max(1, Math.min(360, Math.round(diffAno / (1000 * 60 * 60 * 24))));

  // Cesantías definitivas del año actual: (Base * Días trabajados año) / 360
  const cesantiasPendientes = Math.round((basePrestaciones * diasAnoActual) / 360);

  // Intereses sobre cesantías: (Cesantías * Días trabajados año * 0.12) / 360
  const interesesCesantiasPendientes = Math.round((cesantiasPendientes * diasAnoActual * 0.12) / 360);

  // Prima de servicios del semestre en curso (junio o diciembre): (Base * Días semestre) / 360
  const inicioSemestre = fechaRetiro.getMonth() >= 6 ? new Date(fechaRetiro.getFullYear(), 6, 1) : new Date(fechaRetiro.getFullYear(), 0, 1);
  const diffSemestre = Math.max(0, fechaRetiro.getTime() - inicioSemestre.getTime());
  const diasSemestre = Math.max(1, Math.min(180, Math.round(diffSemestre / (1000 * 60 * 60 * 24))));
  const primaServiciosPendiente = Math.round((basePrestaciones * diasSemestre) / 360);

  // Vacaciones compensadas en dinero: (Salario * Días pendientes) / 30
  const diasVac = diasVacacionesPendientes > 0 ? diasVacacionesPendientes : Math.round((diasTotalesLaborados * 15) / 360);
  const valorVacacionesPendientes = Math.round((salarioBase * diasVac) / 30);

  // Indemnización por despido sin justa causa (Art. 64 Código Sustantivo del Trabajo):
  let indemnizacionDespidoInjusto = 0;
  if (motivoRetiro === 'Despido sin justa causa') {
    if (empleado.contrato.tipo.toLowerCase().includes('fijo')) {
      // Contrato a término fijo: El valor de los salarios correspondientes al tiempo que faltare para cumplir el plazo estipulado
      const fechaFinContrato = empleado.contrato.fin && empleado.contrato.fin !== '—'
        ? new Date(empleado.contrato.fin)
        : new Date(fechaRetiro.getTime() + 1000 * 60 * 60 * 24 * 90);
      const diasFaltantes = Math.max(15, Math.round((fechaFinContrato.getTime() - fechaRetiro.getTime()) / (1000 * 60 * 60 * 24)));
      indemnizacionDespidoInjusto = Math.round((salarioBase / 30) * diasFaltantes);
    } else {
      // Contrato a término indefinido:
      // Si devenga menos de 10 SMMLV: 30 días de salario por el primer año y 20 días adicionales por cada año siguiente
      // Si devenga 10 o más SMMLV: 20 días primer año y 15 días adicionales por año siguiente
      const anosCompletos = diasTotalesLaborados / 360;
      if (salarioBase < (parametros.smmlv * 10)) {
        if (anosCompletos <= 1) {
          indemnizacionDespidoInjusto = salarioBase; // 30 días
        } else {
          const diasIndemnizacion = 30 + ((anosCompletos - 1) * 20);
          indemnizacionDespidoInjusto = Math.round((salarioBase / 30) * diasIndemnizacion);
        }
      } else {
        if (anosCompletos <= 1) {
          indemnizacionDespidoInjusto = Math.round((salarioBase / 30) * 20); // 20 días
        } else {
          const diasIndemnizacion = 20 + ((anosCompletos - 1) * 15);
          indemnizacionDespidoInjusto = Math.round((salarioBase / 30) * diasIndemnizacion);
        }
      }
    }
  }

  const totalLiquidacionDefinitiva =
    cesantiasPendientes +
    interesesCesantiasPendientes +
    primaServiciosPendiente +
    valorVacacionesPendientes +
    indemnizacionDespidoInjusto;

  return {
    empleadoId: empleado.id,
    fechaIngreso: empleado.contrato.inicio,
    fechaRetiro: fechaRetiroStr,
    motivoRetiro,
    salarioBase,
    incluyeAuxilioTransporte,
    diasTrabajadosPeriodoActual: diasAnoActual,
    diasTotalesLaborados,
    cesantiasPendientes,
    interesesCesantiasPendientes,
    primaServiciosPendiente,
    vacacionesPendientesDias: diasVac,
    valorVacacionesPendientes,
    indemnizacionDespidoInjusto,
    totalLiquidacionDefinitiva
  };
}

export function formatMonedaCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor);
}

/**
 * Persistencia y obtención de los parámetros legales configurados
 */
export function obtenerParametrosConfigurados(): ParametrosLegalesNomina {
  if (typeof window === 'undefined') return PARAMETROS_COLOMBIA_2026;
  try {
    const raw = localStorage.getItem('bgroup_parametros_nomina_2026');
    if (!raw) return PARAMETROS_COLOMBIA_2026;
    const parsed = JSON.parse(raw);
    return {
      ...PARAMETROS_COLOMBIA_2026,
      ...parsed,
      tarifasARL: {
        ...PARAMETROS_COLOMBIA_2026.tarifasARL,
        ...(parsed.tarifasARL || {})
      }
    };
  } catch {
    return PARAMETROS_COLOMBIA_2026;
  }
}

export function guardarParametrosConfigurados(params: ParametrosLegalesNomina): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bgroup_parametros_nomina_2026', JSON.stringify(params));
  } catch (err) {
    console.error('Error guardando parámetros de nómina', err);
  }
}

export function restablecerParametrosLegales(): ParametrosLegalesNomina {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bgroup_parametros_nomina_2026');
  }
  return PARAMETROS_COLOMBIA_2026;
}

/**
 * Genera la estructura de un período de nómina para cualquier año y mes
 */
export function crearPeriodoNomina(
  ano: number,
  mes: number,
  tipo: 'Mensual' | 'Primera Quincena' | 'Segunda Quincena' = 'Mensual'
): PeriodoNomina {
  const mesStr = mes.toString().padStart(2, '0');
  const nombreMes = obtenerNombreMes(mes);
  const diasEnMes = obtenerDiasMes(ano, mes);
  const codigoPeriodo = `${ano}-${mesStr}${tipo === 'Primera Quincena' ? '-Q1' : tipo === 'Segunda Quincena' ? '-Q2' : ''}`;

  let fechaInicio = `${ano}-${mesStr}-01`;
  let fechaFin = `${ano}-${mesStr}-${diasEnMes.toString().padStart(2, '0')}`;
  let fechaPago = `${ano}-${mesStr}-${diasEnMes.toString().padStart(2, '0')}`;
  let nombre = `Nómina Mensual ${nombreMes} ${ano}`;

  if (tipo === 'Primera Quincena') {
    fechaInicio = `${ano}-${mesStr}-01`;
    fechaFin = `${ano}-${mesStr}-15`;
    fechaPago = `${ano}-${mesStr}-15`;
    nombre = `Nómina 1ra Quincena ${nombreMes} ${ano}`;
  } else if (tipo === 'Segunda Quincena') {
    fechaInicio = `${ano}-${mesStr}-16`;
    fechaFin = `${ano}-${mesStr}-${diasEnMes.toString().padStart(2, '0')}`;
    fechaPago = `${ano}-${mesStr}-${diasEnMes.toString().padStart(2, '0')}`;
    nombre = `Nómina 2da Quincena ${nombreMes} ${ano}`;
  }

  return {
    id: `periodo_${codigoPeriodo}`,
    codigoPeriodo,
    nombre,
    mes,
    ano,
    tipoPeriodo: tipo,
    tipo,
    fechaInicio,
    fechaFin,
    fechaPago,
    estado: 'Borrador',
    liquidaciones: [],
    totales: {
      totalDevengado: 0,
      totalDeducciones: 0,
      totalNetoPagar: 0,
      totalSeguridadSocialEmpresa: 0,
      totalParafiscalesEmpresa: 0,
      totalProvisionesPrestaciones: 0,
      costoGranTotalEmpresa: 0
    }
  };
}

/**
 * Calcula las reservas y provisiones periódicas y acumuladas de un empleado
 * según los artículos 186, 249, 253, 306 del CST y Ley 50 de 1990
 */
export function calcularReservasProvisionesEmpleado(
  empleado: Empleado,
  liquidacion: LiquidacionEmpleadoNomina,
  mesActual: number,
  anoActual: number,
  parametros: ParametrosLegalesNomina = PARAMETROS_COLOMBIA_2026
): ReservaProvisionEmpleado {
  const salarioBasico = liquidacion.devengados.salarioBasico;
  const basePrestaciones = liquidacion.devengados.totalDevengado;
  const baseVacaciones = Math.max(0, liquidacion.devengados.totalDevengado - liquidacion.devengados.auxilioTransporte);

  // Determinar días acumulados trabajados en el año actual (máximo 360 días)
  let diasAcumuladosAno = mesActual * 30;
  if (empleado.contrato.inicio) {
    const inicioContrato = new Date(empleado.contrato.inicio);
    if (inicioContrato.getFullYear() === anoActual) {
      const mesInicio = inicioContrato.getMonth() + 1;
      const diaInicio = Math.min(30, inicioContrato.getDate());
      const mesesCompletos = Math.max(0, mesActual - mesInicio);
      const diasPrimerMes = Math.max(0, 30 - diaInicio + 1);
      diasAcumuladosAno = Math.min(360, Math.max(1, (mesesCompletos * 30) + diasPrimerMes));
    }
  }
  const mesesAcumuladosAno = Number((diasAcumuladosAno / 30).toFixed(1));

  // Provisiones mensuales causadas en el período
  const cesantiasMes = liquidacion.provisiones.cesantias;
  const interesesCesantiasMes = liquidacion.provisiones.interesesCesantias;
  const primaServiciosMes = liquidacion.provisiones.primaServicios;
  const vacacionesMes = liquidacion.provisiones.vacaciones;
  const totalProvisionesMes = liquidacion.provisiones.totalProvisiones;

  // Provisiones acumuladas a la fecha (Causación de pasivo laboral estimado CST)
  // Cesantías: (Base * Días año) / 360
  const cesantiasAcumuladas = Math.round((basePrestaciones * diasAcumuladosAno) / 360);
  // Intereses de Cesantías: (Cesantías Acumuladas * Días año * 0.12) / 360
  const interesesCesantiasAcumulados = Math.round((cesantiasAcumuladas * diasAcumuladosAno * 0.12) / 360);

  // Prima de Servicios: Pago semestral (Ene-Junio o Julio-Diciembre)
  let diasSemestrePrima = 0;
  if (mesActual <= 6) {
    diasSemestrePrima = Math.min(180, diasAcumuladosAno);
  } else {
    // Segundo semestre: meses 7 a 12
    const mesesSegundoSemestre = mesActual - 6;
    diasSemestrePrima = Math.min(180, mesesSegundoSemestre * 30);
  }
  const primaServiciosAcumulada = Math.round((basePrestaciones * Math.max(1, diasSemestrePrima)) / 360);

  // Vacaciones causadas en el año: 15 días hábiles por cada 360 días
  const diasVacacionesCausados = (diasAcumuladosAno * 15) / 360;
  const vacacionesAcumuladas = Math.round((baseVacaciones * diasVacacionesCausados) / 30);

  const totalPasivoAcumulado =
    cesantiasAcumuladas +
    interesesCesantiasAcumulados +
    primaServiciosAcumulada +
    vacacionesAcumuladas;

  // Aportes patronales a seguridad social y parafiscales del mes
  const pensionPatronalMes = liquidacion.aportesEmpresa.pensionEmpleador;
  const saludPatronalMes = liquidacion.aportesEmpresa.saludEmpleador;
  const arlMes = liquidacion.aportesEmpresa.arl;
  const cajaCompensacionMes = liquidacion.aportesEmpresa.cajaCompensacion;
  const senaMes = liquidacion.aportesEmpresa.sena;
  const icbfMes = liquidacion.aportesEmpresa.icbf;
  const totalCargaPatronalMes = liquidacion.aportesEmpresa.totalSeguridadSocialYParafiscales;
  const totalCostoEmpresaMes = liquidacion.costoTotalEmpresa;

  return {
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    cargoNombre: liquidacion.cargoNombre,
    salarioBasico,
    basePrestaciones,
    baseVacaciones,
    mesesAcumuladosAno,
    diasAcumuladosAno,
    cesantiasMes,
    interesesCesantiasMes,
    primaServiciosMes,
    vacacionesMes,
    totalProvisionesMes,
    cesantiasAcumuladas,
    interesesCesantiasAcumulados,
    primaServiciosAcumulada,
    vacacionesAcumuladas,
    totalPasivoAcumulado,
    pensionPatronalMes,
    saludPatronalMes,
    arlMes,
    cajaCompensacionMes,
    senaMes,
    icbfMes,
    totalCargaPatronalMes,
    totalCostoEmpresaMes
  };
}

/**
 * Calcula el consolidado corporativo de reservas de provisiones
 */
export function calcularConsolidadoReservas(reservas: ReservaProvisionEmpleado[]) {
  return reservas.reduce(
    (acc, item) => ({
      totalSalarioBasico: acc.totalSalarioBasico + item.salarioBasico,
      totalBasePrestaciones: acc.totalBasePrestaciones + item.basePrestaciones,
      // Provisiones del mes
      totalCesantiasMes: acc.totalCesantiasMes + item.cesantiasMes,
      totalInteresesCesantiasMes: acc.totalInteresesCesantiasMes + item.interesesCesantiasMes,
      totalPrimaServiciosMes: acc.totalPrimaServiciosMes + item.primaServiciosMes,
      totalVacacionesMes: acc.totalVacacionesMes + item.vacacionesMes,
      totalProvisionesMes: acc.totalProvisionesMes + item.totalProvisionesMes,
      // Pasivo acumulado a la fecha
      totalCesantiasAcumuladas: acc.totalCesantiasAcumuladas + item.cesantiasAcumuladas,
      totalInteresesCesantiasAcumulados: acc.totalInteresesCesantiasAcumulados + item.interesesCesantiasAcumulados,
      totalPrimaServiciosAcumulada: acc.totalPrimaServiciosAcumulada + item.primaServiciosAcumulada,
      totalVacacionesAcumuladas: acc.totalVacacionesAcumuladas + item.vacacionesAcumuladas,
      totalPasivoAcumulado: acc.totalPasivoAcumulado + item.totalPasivoAcumulado,
      // Carga patronal mensual
      totalPensionPatronalMes: acc.totalPensionPatronalMes + item.pensionPatronalMes,
      totalSaludPatronalMes: acc.totalSaludPatronalMes + item.saludPatronalMes,
      totalArlMes: acc.totalArlMes + item.arlMes,
      totalCajaCompensacionMes: acc.totalCajaCompensacionMes + item.cajaCompensacionMes,
      totalSenaMes: acc.totalSenaMes + item.senaMes,
      totalIcbfMes: acc.totalIcbfMes + item.icbfMes,
      totalCargaPatronalMes: acc.totalCargaPatronalMes + item.totalCargaPatronalMes,
      totalCostoEmpresaMes: acc.totalCostoEmpresaMes + item.totalCostoEmpresaMes
    }),
    {
      totalSalarioBasico: 0,
      totalBasePrestaciones: 0,
      totalCesantiasMes: 0,
      totalInteresesCesantiasMes: 0,
      totalPrimaServiciosMes: 0,
      totalVacacionesMes: 0,
      totalProvisionesMes: 0,
      totalCesantiasAcumuladas: 0,
      totalInteresesCesantiasAcumulados: 0,
      totalPrimaServiciosAcumulada: 0,
      totalVacacionesAcumuladas: 0,
      totalPasivoAcumulado: 0,
      totalPensionPatronalMes: 0,
      totalSaludPatronalMes: 0,
      totalArlMes: 0,
      totalCajaCompensacionMes: 0,
      totalSenaMes: 0,
      totalIcbfMes: 0,
      totalCargaPatronalMes: 0,
      totalCostoEmpresaMes: 0
    }
  );
}
