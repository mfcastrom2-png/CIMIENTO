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
  SimulacionLiquidacionDefinitiva,
  CalculoPrimaSemestralResult,
  CalculoCesantiasResult,
  CalculoVacacionesResult
} from '../types';

/**
 * PARÁMETROS LEGALES DE REFERENCIA COLOMBIA 2026
 * Actualizados con la normatividad laboral vigente (Decretos 1469/1470 de 2025 y Decreto 0159 de 2026):
 * - Salario Mínimo Legal Mensual Vigente (SMMLV): $1.750.905 COP
 * - Auxilio Legal de Transporte (<= 2 SMMLV): $249.095 COP
 * - Unidad de Valor Tributario (UVT DIAN 2026): $52.374 COP
 * - Tope auxilio de transporte: 2 SMMLV ($3.501.810 COP)
 * - Tope exoneración aportes Art 114-1 E.T. (Salud, SENA, ICBF): 10 SMMLV ($17.509.050 COP)
 * - Jornada semanal máxima legal (Ley 2101 de 2021 vigente en 2026): 42 horas semanales
 * - Divisor mensual de horas ordinarias: 210 horas (42h / 6d * 30d)
 */
export const PARAMETROS_COLOMBIA_2026: ParametrosLegalesNomina = {
  anoVigencia: 2026,
  smmlv: 1750905, // Salario mínimo legal mensual vigente 2026 (Decreto 0159 de 2026)
  auxilioTransporte: 249095, // Auxilio legal de transporte 2026
  uvt: 52374, // Unidad de Valor Tributario DIAN 2026
  topeSmmlvAuxilioTransporte: 2, // Hasta 2 SMMLV ($3.501.810)
  topeSmmlvExoneracionParafiscales: 10, // Menos de 10 SMMLV para exoneración de Salud, Sena, ICBF (Art 114-1 E.T.) ($17.509.050)
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
  pctInteresesCesantias: 0.12, // 12% anual sobre cesantías (Ley 52 de 1975)
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

// Determina si una vinculación contractual NO genera nómina de salarios ni prestaciones sociales patronales (ej. Prestación de Servicios, Aprendizaje, Pasantía)
export function esContratoSinNominaLaboral(tipoContrato?: string): boolean {
  if (!tipoContrato) return false;
  const t = tipoContrato.toLowerCase();
  return (
    t.includes('prestación de servicios') ||
    t.includes('prestacion de servicios') ||
    t.includes('honorarios') ||
    t.includes('pasantía') ||
    t.includes('pasantia') ||
    t.includes('aprendizaje')
  );
}

// Calcula la nómina periódica para un empleado
export function calcularLiquidacionEmpleado(
  empleado: Empleado,
  cargoNombre: string,
  cargoCodigo: string,
  novedades: NovedadNominaEmpleado,
  parametros: ParametrosLegalesNomina = PARAMETROS_COLOMBIA_2026
): LiquidacionEmpleadoNomina {
  const tipoContrato = empleado.laboral?.tipoContrato || empleado.contrato?.tipo || '';
  const esSinNomina = esContratoSinNominaLaboral(tipoContrato);
  const esAprendizajeSENA = tipoContrato.toLowerCase().includes('aprendizaje');

  const salarioBasicoPactado = parseSalarioNumerico(empleado.contrato.salario);
  const claseRiesgoARL = determinarClaseRiesgoARL(cargoCodigo, cargoNombre);

  // Verificación de Salario Integral (Art. 132 Código Sustantivo del Trabajo)
  // El Salario Integral incluye en su pago mensual el factor prestacional (prima, cesantías e intereses).
  const tipoSalarioRaw = empleado.compensacion?.tipoSalario || empleado.saldoInicial?.tipoSalario || 'Ordinario';
  const esSalarioIntegral = String(tipoSalarioRaw).toLowerCase().includes('integral');

  const diasTrabajados = Math.max(0, Math.min(30, novedades.diasTrabajados ?? 30));
  const salarioProporcional = Math.round((salarioBasicoPactado / 30) * diasTrabajados);

  // Auxilio de transporte: aplica si el salario básico pactado es menor o igual a 2 SMMLV
  // y se paga proporcional a los días laborados (NO aplica para contratos de prestación de servicios, aprendizaje ni salario integral)
  const tieneDerechoAuxilioTransporte = !esSinNomina && !esSalarioIntegral && salarioBasicoPactado <= (parametros.smmlv * parametros.topeSmmlvAuxilioTransporte);
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

  const valorHED = esSinNomina ? 0 : Math.round(valorHoraOrdinaria * factorHED * (novedades.horasExtrasDiurnas || 0));
  const valorHEN = esSinNomina ? 0 : Math.round(valorHoraOrdinaria * factorHEN * (novedades.horasExtrasNocturnas || 0));
  const valorHFD = esSinNomina ? 0 : Math.round(valorHoraOrdinaria * factorHFD * (novedades.horasFestivasDiurnas || 0));
  const valorHFN = esSinNomina ? 0 : Math.round(valorHoraOrdinaria * factorHFN * (novedades.horasFestivasNocturnas || 0));
  const valorRecargoNocturno = esSinNomina ? 0 : Math.round(valorHoraOrdinaria * factorRN * (novedades.recargoNocturnoOrdinario || 0));

  const valorHorasExtrasYRecargos = valorHED + valorHEN + valorHFD + valorHFN + valorRecargoNocturno;
  const bonificacionesSalariales = novedades.bonificacionesSalariales || 0;
  const bonificacionesNoSalariales = novedades.bonificacionesNoSalariales || 0;
  const comisiones = novedades.comisiones || 0;

  const totalDevengado = salarioProporcional + auxilioTransporte + valorHorasExtrasYRecargos + bonificacionesSalariales + comisiones + bonificacionesNoSalariales;

  // Base Prestacional para Prima de Servicios, Cesantías e Intereses (Art. 127 y 128 CST):
  // Excluye bonificaciones no salariales y auxilio de transporte en salarios > 2 SMMLV
  const baseDevengadoSalarial = salarioProporcional + auxilioTransporte + valorHorasExtrasYRecargos + bonificacionesSalariales + comisiones;

  // IBC (Ingreso Base de Cotización) para Seguridad Social:
  // Para Salario Integral, el IBC de Salud, Pensión y ARL es el 70% del salario integral (Art. 18 Ley 100/93)
  let ibcSeguridadSocial = 0;
  if (!esSinNomina) {
    if (esSalarioIntegral) {
      const ibc70 = Math.round(salarioProporcional * 0.70);
      ibcSeguridadSocial = Math.min(25 * parametros.smmlv, Math.max(parametros.smmlv, ibc70));
    } else {
      ibcSeguridadSocial = Math.max(
        parametros.smmlv,
        salarioProporcional + valorHorasExtrasYRecargos + bonificacionesSalariales + comisiones
      );
    }
  }

  // Deducciones obligatorias del trabajador:
  const saludEmpleado = esSinNomina ? 0 : Math.round(ibcSeguridadSocial * parametros.pctSaludEmpleado); // 4%
  const pensionEmpleado = esSinNomina ? 0 : Math.round(ibcSeguridadSocial * parametros.pctPensionEmpleado); // 4%

  // Fondo de Solidaridad Pensional (FSP): aplica para IBC >= 4 SMMLV (Ley 100/93 Art. 27)
  let pctFSP = 0;
  const smmlvIbc = ibcSeguridadSocial / parametros.smmlv;
  if (!esSinNomina) {
    if (smmlvIbc >= 20) pctFSP = 0.020;
    else if (smmlvIbc >= 19) pctFSP = 0.018;
    else if (smmlvIbc >= 18) pctFSP = 0.016;
    else if (smmlvIbc >= 17) pctFSP = 0.014;
    else if (smmlvIbc >= 16) pctFSP = 0.012;
    else if (smmlvIbc >= 4) pctFSP = 0.010;
  }

  const fondoSolidaridadPensional = Math.round(ibcSeguridadSocial * pctFSP);

  // Retención en la fuente (Procedimiento 1 - Arts. 383, 388 y 206 #10 E.T.):
  let retencionFuente = 0;
  if (!esSinNomina) {
    const ingresoNetoPrevio = Math.max(0, totalDevengado - saludEmpleado - pensionEmpleado - fondoSolidaridadPensional);
    const topeRentaExenta25Pesos = 65 * parametros.uvt;
    const rentaExenta25 = Math.min(Math.round(ingresoNetoPrevio * 0.25), topeRentaExenta25Pesos);
    const baseGravablePesos = Math.max(0, ingresoNetoPrevio - rentaExenta25);
    const baseGravableUVT = baseGravablePesos / parametros.uvt;

    if (baseGravableUVT > 95) {
      if (baseGravableUVT <= 150) {
        retencionFuente = Math.round(((baseGravableUVT - 95) * 0.19) * parametros.uvt);
      } else if (baseGravableUVT <= 360) {
        retencionFuente = Math.round((((baseGravableUVT - 150) * 0.28) + 10) * parametros.uvt);
      } else {
        retencionFuente = Math.round((((baseGravableUVT - 360) * 0.33) + 69) * parametros.uvt);
      }
    }
  }

  const prestamosOtrasDeducciones = novedades.prestamosYDeducciones || 0;
  const totalDeducciones = saludEmpleado + pensionEmpleado + fondoSolidaridadPensional + retencionFuente + prestamosOtrasDeducciones;

  const netoAPagar = totalDevengado - totalDeducciones;

  // Aportes de la Empresa (Seguridad Social y Parafiscales):
  const devengaMenos10SMMLV = salarioBasicoPactado < (parametros.smmlv * parametros.topeSmmlvExoneracionParafiscales);
  const exoneradoArt114_1 = devengaMenos10SMMLV && !esSalarioIntegral;

  const saludEmpleador = (esSinNomina || exoneradoArt114_1) ? 0 : Math.round(ibcSeguridadSocial * parametros.pctSaludEmpleador);
  const pensionEmpleador = esSinNomina ? 0 : Math.round(ibcSeguridadSocial * parametros.pctPensionEmpleador); // 12%

  const tarifaArlAplicada = parametros.tarifasARL[claseRiesgoARL] || parametros.tarifasARL.I;
  const arl = (esSinNomina && !esAprendizajeSENA) ? 0 : Math.round((ibcSeguridadSocial || salarioProporcional) * tarifaArlAplicada);

  const cajaCompensacion = esSinNomina ? 0 : Math.round(ibcSeguridadSocial * parametros.pctCajaCompensacion); // 4%
  const sena = (esSinNomina || exoneradoArt114_1) ? 0 : Math.round(ibcSeguridadSocial * parametros.pctSena);
  const icbf = (esSinNomina || exoneradoArt114_1) ? 0 : Math.round(ibcSeguridadSocial * parametros.pctIcbf);

  const totalSeguridadSocialYParafiscales = saludEmpleador + pensionEmpleador + arl + cajaCompensacion + sena + icbf;

  // Provisiones para Prestaciones Sociales (CST):
  // NOTA CRÍTICA LEGAL (Art. 132 CST): Para Salario Integral o Prestación de Servicios = 0 COP
  // (No genera prima, cesantías ni intereses a cesantías patronales)
  const cesantias = (esSinNomina || esSalarioIntegral) ? 0 : Math.round(baseDevengadoSalarial * parametros.pctCesantias); // 8.33%
  const factorIntereses = (parametros.pctInteresesCesantias && parametros.pctInteresesCesantias > 0.05)
    ? parametros.pctInteresesCesantias
    : 0.12;
  const interesesCesantias = (esSinNomina || esSalarioIntegral) ? 0 : Math.round(cesantias * factorIntereses); // 12% anual
  const primaServicios = (esSinNomina || esSalarioIntegral) ? 0 : Math.round(baseDevengadoSalarial * parametros.pctPrimaServicios); // 8.33%
  
  // Vacaciones: 4.17% sobre el salario sin auxilio de transporte (Aplica para Ordinario e Integral)
  const vacaciones = esSinNomina ? 0 : Math.round((salarioProporcional + valorHorasExtrasYRecargos + bonificacionesSalariales + comisiones) * parametros.pctVacaciones); // 4.17%

  const totalProvisiones = cesantias + interesesCesantias + primaServicios + vacaciones;

  // Costo Total Empresa = Lo que recibe el trabajador (neto) + aportes asumidos + retenciones pagadas a entidades + provisiones
  const costoTotalEmpresa = totalDevengado + totalSeguridadSocialYParafiscales + totalProvisiones;

  const bonificacionesYComisiones = bonificacionesSalariales + bonificacionesNoSalariales + comisiones;

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
  const tipoSalarioRaw = empleado.compensacion?.tipoSalario || empleado.saldoInicial?.tipoSalario || 'Ordinario';
  const esSalarioIntegral = String(tipoSalarioRaw).toLowerCase().includes('integral');

  const salarioBase = parseSalarioNumerico(empleado.contrato.salario);
  const incluyeAuxilioTransporte = !esSalarioIntegral && salarioBase <= (parametros.smmlv * parametros.topeSmmlvAuxilioTransporte);
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

  // Cesantías definitivas del año actual: (Base * Días trabajados año) / 360 (0 si Salario Integral)
  const cesantiasPendientes = esSalarioIntegral ? 0 : Math.round((basePrestaciones * diasAnoActual) / 360);

  // Intereses sobre cesantías: (Cesantías * Días trabajados año * 0.12) / 360 (0 si Salario Integral)
  const interesesCesantiasPendientes = esSalarioIntegral ? 0 : Math.round((cesantiasPendientes * diasAnoActual * 0.12) / 360);

  // Prima de servicios del semestre en curso (junio o diciembre): (Base * Días semestre) / 360 (0 si Salario Integral)
  const inicioSemestre = fechaRetiro.getMonth() >= 6 ? new Date(fechaRetiro.getFullYear(), 6, 1) : new Date(fechaRetiro.getFullYear(), 0, 1);
  const diffSemestre = Math.max(0, fechaRetiro.getTime() - inicioSemestre.getTime());
  const diasSemestre = Math.max(1, Math.min(180, Math.round(diffSemestre / (1000 * 60 * 60 * 24))));
  const primaServiciosPendiente = esSalarioIntegral ? 0 : Math.round((basePrestaciones * diasSemestre) / 360);

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
 * Motor de Cálculo Semestral de Prima de Servicios (Art. 306 Código Sustantivo del Trabajo - Ley 1788 de 2016)
 * Se paga en dos cuotas: 30 de Junio (1er Semestre) y 20 de Diciembre (2do Semestre)
 *
 * Fórmula Oficial CST:
 * Prima Semestral = (Base Salarial Promedio * Días Laborados en el Semestre) / 360
 *
 * Reglas de Negocio Legales:
 * 1. Base Salarial = Salario Básico + Auxilio de Transporte (Solo si Salario Básico <= 2 SMMLV) + Promedio Comisiones / Horas Extras / Recargos
 * 2. Empleados con Salario Integral o Contrato de Prestación de Servicios NO devengan prima (factor prestacional 30% ya incluido o sin relación laboral)
 * 3. Para salarios superiores a 2 SMMLV ($3.501.810 COP en 2026), el Auxilio de Transporte es $0 COP y NO se incluye en la base de prima
 */
export function calcularPrimaServiciosSemestral(
  empleado: Empleado,
  liquidacion: LiquidacionEmpleadoNomina,
  mesActual: number,
  anoActual: number,
  parametros: ParametrosLegalesNomina = PARAMETROS_COLOMBIA_2026
): CalculoPrimaSemestralResult {
  const salarioBasico = liquidacion.devengados.salarioBasico;
  const tipoContrato = empleado.laboral?.tipoContrato || empleado.contrato?.tipo || '';
  const esSinNomina = esContratoSinNominaLaboral(tipoContrato);
  const tipoSalarioRaw = empleado.compensacion?.tipoSalario || empleado.saldoInicial?.tipoSalario || 'Ordinario';
  const esSalarioIntegral = String(tipoSalarioRaw).toLowerCase().includes('integral');

  // Semestre actual (1: Ene-Jun, 2: Jul-Dic)
  const semestre: 1 | 2 = mesActual <= 6 ? 1 : 2;

  // Verificación legal de Auxilio de Transporte para la base de prima (Art. 306 CST):
  // Solo aplica si el salario básico pactado es <= 2 SMMLV ($3.501.810 en 2026) y NO es salario integral ni contrato sin nómina
  const tieneDerechoAuxilioTransporte = !esSinNomina && !esSalarioIntegral && salarioBasico <= (parametros.smmlv * parametros.topeSmmlvAuxilioTransporte);
  const auxilioTransporte = tieneDerechoAuxilioTransporte ? (liquidacion.devengados.auxilioTransporte || parametros.auxilioTransporte) : 0;

  // Promedio de recargos nocturnos, horas extras y comisiones salariales del período
  const recargosYComisiones = liquidacion.devengados.valorHorasExtrasYRecargos + liquidacion.devengados.bonificacionesYComisiones;

  // Base salarial promedio computable para la prima
  const baseSalarioPromedio = (esSinNomina || esSalarioIntegral)
    ? 0
    : (salarioBasico + auxilioTransporte + recargosYComisiones);

  // Cálculo de Días Laborados en el Semestre Activo (Máximo 180 días por semestre)
  let diasLaboradosSemestre = 180;
  const saldoIni = empleado.saldoInicial;

  // Verificar si hay datos cargados en Saldo Inicial para el semestre
  const esMismoSemestreSaldo = saldoIni?.semestrePrimaActual
    ? (saldoIni.semestrePrimaActual.includes('1er') ? 1 : 2) === semestre
    : true;

  if (saldoIni?.diasTrabajadosSemestrePrima && saldoIni.diasTrabajadosSemestrePrima > 0 && esMismoSemestreSaldo) {
    const mesBaseSaldo = semestre === 1 ? 2 : 8; // Ej. Febrero (M2) o Agosto (M8)
    const mesesDespuesSaldo = Math.max(0, mesActual - mesBaseSaldo);
    diasLaboradosSemestre = Math.min(180, saldoIni.diasTrabajadosSemestrePrima + (mesesDespuesSaldo * 30));
  } else {
    // Cálculo desde mes de inicio del semestre o fecha de ingreso del contrato
    const mesInicioSemestre = semestre === 1 ? 1 : 7;
    const mesesEnSemestre = (mesActual - mesInicioSemestre) + 1;
    let diasBase = mesesEnSemestre * 30;

    if (empleado.contrato.inicio) {
      const inicioContrato = new Date(empleado.contrato.inicio);
      if (inicioContrato.getFullYear() === anoActual) {
        const mesInicioContrato = inicioContrato.getMonth() + 1;
        const diaInicio = Math.min(30, inicioContrato.getDate());

        if ((semestre === 1 && mesInicioContrato <= 6) || (semestre === 2 && mesInicioContrato >= 7)) {
          const mesesCompletos = Math.max(0, mesActual - mesInicioContrato);
          const diasPrimerMes = Math.max(0, 30 - diaInicio + 1);
          diasBase = (mesesCompletos * 30) + diasPrimerMes;
        }
      }
    }
    diasLaboradosSemestre = Math.min(180, Math.max(1, diasBase));
  }

  // Fórmula oficial CST Prima de Servicios:
  // Prima Semestral Causada = (Base Salarial Promedio * Días Laborados en el Semestre) / 360
  const primaSemestralCausada = (esSinNomina || esSalarioIntegral)
    ? 0
    : Math.round((baseSalarioPromedio * diasLaboradosSemestre) / 360);

  // Provisión mensual (8.33% de la base salarial promedio)
  const primaMensualProvision = (esSinNomina || esSalarioIntegral)
    ? 0
    : Math.round(baseSalarioPromedio * (parametros.pctPrimaServicios || 0.0833));

  // Días de salario equivalentes ganados (15 días por semestre completo de 180 días)
  const diasEquivalentesPrima = Number(((diasLaboradosSemestre * 15) / 180).toFixed(2));

  const fechaPagoLimite = semestre === 1
    ? `30 de Junio de ${anoActual}`
    : `20 de Diciembre de ${anoActual}`;

  return {
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    documento: empleado.documento,
    cargoNombre: liquidacion.cargoNombre,
    tipoContrato: empleado.contrato.tipo,
    esSalarioIntegral,
    semestre,
    ano: anoActual,
    diasLaboradosSemestre,
    salarioBasico,
    promedioComisionesYRecargos: recargosYComisiones,
    tieneDerechoAuxilioTransporte,
    auxilioTransporte,
    baseSalarioPromedio,
    primaSemestralCausada,
    primaMensualProvision,
    diasEquivalentesPrima,
    fechaPagoLimite
  };
}

/**
 * Motor de Cálculo de Provisión Mensual y Acumulada de Cesantías e Intereses
 * (Art. 249 del CST, Ley 50 de 1990 y Ley 52 de 1975)
 *
 * Reglas de Negocio Legales:
 * 1. Provisión mensual de cesantías: 8.33% (1/12) de la base computable.
 * 2. Base Computable: Salario básico + Auxilio de Transporte (solo si salario básico <= 2 SMMLV) + Promedio comisiones/horas extras/recargos.
 * 3. Provisión mensual de intereses a cesantías: 1% mensual (12% anual sobre el valor de las cesantías causadas).
 * 4. Consignación a Fondos de Cesantías (Porvenir, Protección, Colfondos, FNA): A más tardar el 14 de Febrero del año siguiente.
 * 5. Pago de Intereses a Cesantías: Directo al empleado a más tardar el 31 de Enero del año siguiente.
 * 6. Salario Integral y Prestación de Servicios: 0 COP de cesantías patronales.
 */
export function calcularCesantiasEInteresesEmpleado(
  empleado: Empleado,
  liquidacion: LiquidacionEmpleadoNomina,
  mesActual: number,
  anoActual: number,
  parametros: ParametrosLegalesNomina = PARAMETROS_COLOMBIA_2026
): CalculoCesantiasResult {
  const salarioBasico = liquidacion.devengados.salarioBasico;
  const tipoContrato = empleado.laboral?.tipoContrato || empleado.contrato?.tipo || '';
  const esSinNomina = esContratoSinNominaLaboral(tipoContrato);
  const tipoSalarioRaw = empleado.compensacion?.tipoSalario || empleado.saldoInicial?.tipoSalario || 'Ordinario';
  const esSalarioIntegral = String(tipoSalarioRaw).toLowerCase().includes('integral');

  // Verificación legal de Auxilio de Transporte para la base de cesantías (Art. 249 CST y Ley 1 de 1963):
  const tieneDerechoAuxilioTransporte = !esSinNomina && !esSalarioIntegral && salarioBasico <= (parametros.smmlv * parametros.topeSmmlvAuxilioTransporte);
  const auxilioTransporte = tieneDerechoAuxilioTransporte ? (liquidacion.devengados.auxilioTransporte || parametros.auxilioTransporte) : 0;

  // Promedio de recargos nocturnos, dominicales, horas extras y comisiones salariales
  const recargosYComisiones = liquidacion.devengados.valorHorasExtrasYRecargos + liquidacion.devengados.bonificacionesYComisiones;

  // Base salarial computable para cesantías:
  const baseSalarioCesantias = (esSinNomina || esSalarioIntegral)
    ? 0
    : (salarioBasico + auxilioTransporte + recargosYComisiones);

  // Días laborados acumulados en el año actual (máximo 360 días)
  let diasLaboradosAno = mesActual * 30;
  if (empleado.contrato.inicio) {
    const inicioContrato = new Date(empleado.contrato.inicio);
    if (inicioContrato.getFullYear() === anoActual) {
      const mesInicio = inicioContrato.getMonth() + 1;
      const diaInicio = Math.min(30, inicioContrato.getDate());
      const mesesCompletos = Math.max(0, mesActual - mesInicio);
      const diasPrimerMes = Math.max(0, 30 - diaInicio + 1);
      diasLaboradosAno = Math.min(360, Math.max(1, (mesesCompletos * 30) + diasPrimerMes));
    }
  }

  // Provisión mensual de cesantías: 8.33% de la base computable
  const provisionMensualCesantias = (esSinNomina || esSalarioIntegral)
    ? 0
    : Math.round(baseSalarioCesantias * (parametros.pctCesantias || 0.0833));

  // Provisión mensual de intereses a cesantías: 1% mensual (12% anual)
  const factorIntereses = (parametros.pctInteresesCesantias && parametros.pctInteresesCesantias > 0.05)
    ? parametros.pctInteresesCesantias
    : 0.12;
  const provisionMensualIntereses = (esSinNomina || esSalarioIntegral)
    ? 0
    : Math.round(provisionMensualCesantias * factorIntereses);

  // Cesantías acumuladas a la fecha (YTD):
  const saldoIni = empleado.saldoInicial;
  const cesantiasCalculadas = Math.round((baseSalarioCesantias * diasLaboradosAno) / 360);
  const cesantiasAcumuladasYTD = (esSinNomina || esSalarioIntegral)
    ? 0
    : ((saldoIni?.cesantiasSaldoAcumuladoCOP && saldoIni.cesantiasSaldoAcumuladoCOP > 0)
      ? (saldoIni.cesantiasSaldoAcumuladoCOP + (provisionMensualCesantias * (mesActual % 12 || 1)))
      : cesantiasCalculadas);

  // Intereses de cesantías acumulados a la fecha (Ley 52/1975):
  const interesesCalculados = Math.round((cesantiasAcumuladasYTD * diasLaboradosAno * 0.12) / 360);
  const interesesCesantiasAcumuladosYTD = (esSinNomina || esSalarioIntegral)
    ? 0
    : ((saldoIni?.interesesCesantiasAcumuladoCOP && saldoIni.interesesCesantiasAcumuladoCOP > 0)
      ? (saldoIni.interesesCesantiasAcumuladoCOP + (provisionMensualIntereses * (mesActual % 12 || 1)))
      : interesesCalculados);

  // Fondo de cesantías asignado
  const fondoCesantias = saldoIni?.fondoCesantias || (empleado as any).seguridadSocial?.cesantiasFondo || (empleado as any).seguridadSocial?.fondoCesantias || 'Porvenir';

  const fechaLimiteConsignacionFondo = `14 de Febrero de ${anoActual + 1}`;
  const fechaLimitePagoIntereses = `31 de Enero de ${anoActual + 1}`;

  return {
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    documento: empleado.documento,
    cargoNombre: liquidacion.cargoNombre,
    tipoContrato: empleado.contrato.tipo,
    esSalarioIntegral,
    ano: anoActual,
    mes: mesActual,
    diasLaboradosAno,
    salarioBasico,
    promedioComisionesYRecargos: recargosYComisiones,
    tieneDerechoAuxilioTransporte,
    auxilioTransporte,
    baseSalarioCesantias,
    provisionMensualCesantias,
    provisionMensualIntereses,
    cesantiasAcumuladasYTD,
    interesesCesantiasAcumuladosYTD,
    fondoCesantias,
    fechaLimiteConsignacionFondo,
    fechaLimitePagoIntereses
  };
}

/**
 * Motor de Cálculo de Provisión Mensual y Pasivo Consolidado de Vacaciones
 * (Art. 186 a 192 del Código Sustantivo del Trabajo - CST)
 *
 * Reglas de Negocio Legales:
 * 1. Provisión mensual de vacaciones: 4.17% (15 días / 360 días = 1/24 ≈ 4.1667%) del salario básico computable.
 * 2. Base Computable (Art. 192 CST): Salario básico pactado (+ comisiones o recargos fijos salariales).
 *    IMPORTANTE: El Auxilio de Transporte NO se incluye en la base de vacaciones (CST Art. 192 y jurisprudencia CSJ).
 * 3. Días causados: 1.25 días hábiles remunerados por mes comercial (30 días).
 * 4. Pasivo acumulado: (Base Salarial * Días Causados) / 30.
 * 5. Salario Integral: Las vacaciones SÍ corresponden a los empleados con salario integral (descanso remunerado 15 días hábiles),
 *    a diferencia de las prestaciones sociales.
 * 6. Contratos de Prestación de Servicios (Sin Nómina): 0% y 0 COP.
 */
export function calcularVacacionesEmpleado(
  empleado: Empleado,
  liquidacion: LiquidacionEmpleadoNomina,
  mesActual: number,
  anoActual: number,
  parametros: ParametrosLegalesNomina = PARAMETROS_COLOMBIA_2026
): CalculoVacacionesResult {
  const salarioBasico = liquidacion.devengados.salarioBasico;
  const tipoContrato = empleado.laboral?.tipoContrato || empleado.contrato?.tipo || '';
  const esSinNomina = esContratoSinNominaLaboral(tipoContrato);
  const tipoSalarioRaw = empleado.compensacion?.tipoSalario || empleado.saldoInicial?.tipoSalario || 'Ordinario';
  const esSalarioIntegral = String(tipoSalarioRaw).toLowerCase().includes('integral');

  // Base salarial computable para vacaciones: Salario básico + recargos/comisiones (Sin Auxilio de Transporte Art. 192 CST)
  const recargosYComisiones = liquidacion.devengados.valorHorasExtrasYRecargos + liquidacion.devengados.bonificacionesYComisiones;
  const baseSalarioVacaciones = esSinNomina ? 0 : (salarioBasico + recargosYComisiones);

  // Días laborados acumulados en el año actual (máximo 360 días)
  let diasLaboradosAno = mesActual * 30;
  const fechaIngresoStr = obtenerFechaIngresoEmpleado(empleado);
  if (fechaIngresoStr) {
    const inicioContrato = new Date(fechaIngresoStr);
    if (inicioContrato.getFullYear() === anoActual) {
      const mesInicio = inicioContrato.getMonth() + 1;
      const diaInicio = Math.min(30, inicioContrato.getDate());
      const mesesCompletos = Math.max(0, mesActual - mesInicio);
      const diasPrimerMes = Math.max(0, 30 - diaInicio + 1);
      diasLaboradosAno = Math.min(360, Math.max(1, (mesesCompletos * 30) + diasPrimerMes));
    }
  }

  // Días de vacaciones causados por mes (1.25 días = 15/12) y en el año:
  const diasCausadosMes = esSinNomina ? 0 : Number(((15 / 360) * Math.min(30, liquidacion.novedades.diasTrabajados)).toFixed(2));
  const diasCausadosAno = esSinNomina ? 0 : Number(((diasLaboradosAno * 15) / 360).toFixed(2));

  // Provisión mensual: 4.17% (15/360) de la base computable
  const pctVacaciones = parametros.pctVacaciones || 0.0417;
  const provisionMensualVacaciones = esSinNomina ? 0 : Math.round(baseSalarioVacaciones * pctVacaciones);

  // Pasivo acumulado y saldo inicial
  const saldoIni = empleado.saldoInicial;
  const diasDisfrutadosHistorico = 0;
  const diasPendientesDisfrute = saldoIni?.vacacionesDiasPendientes && saldoIni.vacacionesDiasPendientes > 0
    ? Number((saldoIni.vacacionesDiasPendientes + (mesActual * 1.25)).toFixed(2))
    : diasCausadosAno;

  const vacCalculadas = Math.round((baseSalarioVacaciones * diasCausadosAno) / 30);
  const vacacionesAcumuladasYTD = esSinNomina
    ? 0
    : ((saldoIni?.vacacionesValorAcumuladoCOP && saldoIni.vacacionesValorAcumuladoCOP > 0)
      ? (saldoIni.vacacionesValorAcumuladoCOP + (provisionMensualVacaciones * (mesActual % 12 || 1)))
      : vacCalculadas);

  return {
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    documento: empleado.documento,
    cargoNombre: liquidacion.cargoNombre,
    tipoContrato: empleado.contrato.tipo,
    esSalarioIntegral,
    ano: anoActual,
    mes: mesActual,
    diasLaboradosAno,
    salarioBasico,
    baseSalarioVacaciones,
    diasCausadosMes,
    diasCausadosAno,
    diasDisfrutadosHistorico,
    diasPendientesDisfrute,
    provisionMensualVacaciones,
    vacacionesAcumuladasYTD,
    fechaIngreso: fechaIngresoStr
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
  // Base salarial legal para prestaciones (salario + auxilio transporte si tiene derecho + recargos y comisiones)
  const basePrestaciones = liquidacion.devengados.salarioProporcional +
    liquidacion.devengados.auxilioTransporte +
    liquidacion.devengados.valorHorasExtrasYRecargos +
    liquidacion.devengados.bonificacionesYComisiones;

  const baseVacaciones = Math.max(0, liquidacion.devengados.totalDevengado - liquidacion.devengados.auxilioTransporte);

  // Motor específico de Cesantías e Intereses de Cesantías (Art. 249 CST y Ley 50/1990)
  const resultadoCesantias = calcularCesantiasEInteresesEmpleado(empleado, liquidacion, mesActual, anoActual, parametros);
  const diasAcumuladosAno = resultadoCesantias.diasLaboradosAno;
  const mesesAcumuladosAno = Number((diasAcumuladosAno / 30).toFixed(1));

  // Motor específico de Vacaciones (Art. 186 CST)
  const resultadoVacaciones = calcularVacacionesEmpleado(empleado, liquidacion, mesActual, anoActual, parametros);

  // Provisiones mensuales causadas en el período
  const cesantiasMes = resultadoCesantias.provisionMensualCesantias;
  const interesesCesantiasMes = resultadoCesantias.provisionMensualIntereses;
  const primaServiciosMes = liquidacion.provisiones.primaServicios;
  const vacacionesMes = resultadoVacaciones.provisionMensualVacaciones;
  const totalProvisionesMes = cesantiasMes + interesesCesantiasMes + primaServiciosMes + vacacionesMes;

  // Provisiones acumuladas a la fecha (Causación de pasivo laboral estimado CST)
  const cesantiasAcumuladas = resultadoCesantias.cesantiasAcumuladasYTD;
  const interesesCesantiasAcumulados = resultadoCesantias.interesesCesantiasAcumuladosYTD;

  // Prima de Servicios Semestral: Uso del motor específico conforme al Art. 306 CST
  const resultadoPrima = calcularPrimaServiciosSemestral(empleado, liquidacion, mesActual, anoActual, parametros);
  const primaServiciosAcumulada = resultadoPrima.primaSemestralCausada;

  // Vacaciones causadas y acumuladas a la fecha
  const vacacionesAcumuladas = resultadoVacaciones.vacacionesAcumuladasYTD;

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

/**
 * Obtiene la fecha de ingreso oficial del empleado examinando sus diferentes fuentes de datos
 */
export function obtenerFechaIngresoEmpleado(empleado: Empleado): string {
  if (empleado.laboral?.fechaIngreso && empleado.laboral.fechaIngreso.trim()) {
    return empleado.laboral.fechaIngreso.trim();
  }
  if (empleado.laboral?.fechaInicioLaboral && empleado.laboral.fechaInicioLaboral.trim()) {
    return empleado.laboral.fechaInicioLaboral.trim();
  }
  if (empleado.laboral?.fechaInicioContrato && empleado.laboral.fechaInicioContrato.trim()) {
    return empleado.laboral.fechaInicioContrato.trim();
  }
  if (empleado.contrato?.inicio && empleado.contrato.inicio.trim()) {
    return empleado.contrato.inicio.trim();
  }
  if (empleado.saldoInicial?.fechaIngreso && empleado.saldoInicial.fechaIngreso.trim()) {
    return empleado.saldoInicial.fechaIngreso.trim();
  }
  return '1970-01-01';
}

/**
 * Obtiene la fecha de retiro del empleado si aplica
 */
export function obtenerFechaRetiroEmpleado(empleado: Empleado): string | undefined {
  if (empleado.fechaRetiro && empleado.fechaRetiro.trim()) {
    return empleado.fechaRetiro.trim();
  }
  if ((empleado.activo === false || empleado.estadoLaboral === 'retirado' || empleado.estadoLaboral === 'Inactivo') && empleado.laboral?.fechaTerminacionContrato) {
    return empleado.laboral.fechaTerminacionContrato.trim();
  }
  return undefined;
}

/**
 * Determina si un empleado está disponible para liquidar nómina en un período mensual específico
 * basado en su fecha de ingreso y fecha de retiro.
 *
 * Reglas de Disponibilidad:
 * 1. El empleado NO está disponible si su fecha de ingreso es posterior al fin del período mensual liquidado.
 * 2. El empleado SÍ está disponible en el período (mes/año) que tiene fecha de ingreso y en períodos posteriores.
 * 3. Si el empleado tiene fecha de retiro anterior al inicio del período, ya no está disponible.
 */
export function estaEmpleadoDisponibleEnPeriodo(
  empleado: Empleado,
  periodo: PeriodoNomina | { ano: number; mes: number; fechaInicio?: string; fechaFin?: string }
): boolean {
  const fechaIngreso = obtenerFechaIngresoEmpleado(empleado);
  const ano = periodo.ano;
  const mes = periodo.mes;
  const diasEnMes = obtenerDiasMes(ano, mes);
  const fechaInicioPeriodo = periodo.fechaInicio || `${ano}-${String(mes).padStart(2, '0')}-01`;
  const fechaFinPeriodo = periodo.fechaFin || `${ano}-${String(mes).padStart(2, '0')}-${String(diasEnMes).padStart(2, '0')}`;

  // Si la fecha de ingreso es posterior a la fecha final del período liquidado, el empleado aún no pertenece a la nómina
  if (fechaIngreso > fechaFinPeriodo) {
    return false;
  }

  // Si tiene fecha de retiro y es anterior a la fecha de inicio del período, ya fue retirado
  const fechaRetiro = obtenerFechaRetiroEmpleado(empleado);
  if (fechaRetiro && fechaRetiro < fechaInicioPeriodo) {
    return false;
  }

  return true;
}

/**
 * Calcula los días laborados por defecto para un empleado en un período mensual.
 * Si el empleado ingresó durante el mes actual del período, calcula los días proporcionales
 * según el mes comercial colombiano de 30 días (Art. 134 CST).
 */
export function calcularDiasDefectoPeriodoEmpleado(
  empleado: Empleado,
  periodo: PeriodoNomina | { ano: number; mes: number }
): number {
  const fechaIngresoStr = obtenerFechaIngresoEmpleado(empleado);
  if (!fechaIngresoStr) return 30;

  try {
    const partes = fechaIngresoStr.split('-');
    if (partes.length === 3) {
      const anoIngreso = parseInt(partes[0], 10);
      const mesIngreso = parseInt(partes[1], 10);
      const diaIngreso = parseInt(partes[2], 10);

      if (anoIngreso === periodo.ano && mesIngreso === periodo.mes) {
        // Ingresó durante este período: días desde la fecha de ingreso hasta fin de mes comercial (base 30)
        const diaInicio = Math.min(30, Math.max(1, isNaN(diaIngreso) ? 1 : diaIngreso));
        return Math.max(1, Math.min(30, 30 - diaInicio + 1));
      }
    }
  } catch {
    // Si falla el parseo, se asume mes comercial completo
  }

  return 30;
}

/**
 * Filtra la lista completa de empleados reteniendo únicamente aquellos que están disponibles
 * para liquidar en el período de nómina seleccionado.
 */
export function filtrarEmpleadosDisponiblesEnPeriodo(
  empleados: Empleado[],
  periodo: PeriodoNomina | { ano: number; mes: number; fechaInicio?: string; fechaFin?: string }
): Empleado[] {
  return empleados.filter(emp => estaEmpleadoDisponibleEnPeriodo(emp, periodo));
}
