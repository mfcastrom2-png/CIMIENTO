import { Empleado, Cargo, SaldoInicialEmpleadoNomina, NovedadNominaEmpleado } from '../types';

export interface FilaErrorValidacion {
  fila: number;
  columna: string;
  mensaje: string;
  valor: string;
}

export interface FilaAdvertenciaValidacion {
  fila: number;
  mensaje: string;
}

export interface ResumenValidacionSaldos {
  totalFilas: number;
  validas: number;
  conErrores: number;
  totalPasivosCOP: number;
  totalDiasVacaciones: number;
  totalProvisionMensualVacacionesCOP: number;
  totalProvisionMensualCesantiasCOP: number;
  totalProvisionMensualInteresesCOP: number;
  totalProvisionMensualPrimaCOP: number;
  totalCargaMensualPrestacionesCOP: number;
  totalCarteraPrestamosCOP: number;
  totalIngresosAcumuladosAnoCOP: number;
  totalSalariosBaseCOP: number;
}

export interface ResultadoParseoSaldos {
  items: SaldoInicialEmpleadoNomina[];
  errores: FilaErrorValidacion[];
  advertencias: FilaAdvertenciaValidacion[];
  resumen: ResumenValidacionSaldos;
}

export const ENCABEZADOS_CSV_SALDOS = [
  'documento',
  'nombreCompleto',
  'cargoNombre',
  'fechaIngreso',
  'fechaCorteSaldos',
  'salarioBasico',
  'tipoSalario',
  'tipoContrato',
  'eps',
  'fondoPensiones',
  'arl',
  'cajaCompensacion',
  'fondoCesantias',
  'vacacionesDiasPendientes',
  'vacacionesValorAcumuladoCOP',
  'cesantiasSaldoAcumuladoCOP',
  'interesesCesantiasAcumuladoCOP',
  'primaServiciosBaseSemestreCOP',
  'diasTrabajadosSemestrePrima',
  'ingresosLaboralesAcumuladosAnoCOP',
  'saludAportesAcumuladosAnoCOP',
  'pensionAportesAcumuladosAnoCOP',
  'fspAportesAcumuladosAnoCOP',
  'retencionFuenteAcumuladaAnoCOP',
  'cesantiasPagadasAnoCOP',
  'aporteVoluntarioPensionAnoCOP',
  'deduccionDependientesAnoCOP',
  'saludPrepagadaAnoCOP',
  'prestamoEmpresaSaldoCOP',
  'prestamoEmpresaCuotaMensualCOP',
  'libranzaSaldoCOP',
  'libranzaCuotaMensualCOP',
  'embargoJudicialSaldoCOP',
  'embargoJudicialCuotaMensualCOP',
  'otrasDeduccionesFijasMensualCOP',
  'observaciones'
];

/**
 * Limpia y parsea valores monetarios y numéricos tolerando formatos:
 * "$ 1.250.000", "1250000.50", "1,250,000", "-", "", etc.
 */
export function limpiarNumeroMoneda(valor: any): number {
  if (typeof valor === 'number') {
    return isNaN(valor) ? 0 : Math.max(0, valor);
  }
  if (!valor) return 0;
  const str = String(valor).trim();
  if (str === '-' || str === '—' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return 0;

  let limpio = str.replace(/[$\s]/g, '');

  if (limpio.includes('.') && limpio.includes(',')) {
    const ultimoPunto = limpio.lastIndexOf('.');
    const ultimaComa = limpio.lastIndexOf(',');
    if (ultimaComa > ultimoPunto) {
      limpio = limpio.replace(/\./g, '').replace(',', '.');
    } else {
      limpio = limpio.replace(/,/g, '');
    }
  } else if (limpio.includes(',')) {
    const partes = limpio.split(',');
    if (partes.length === 2 && partes[1].length <= 2) {
      limpio = partes[0] + '.' + partes[1];
    } else {
      limpio = limpio.replace(/,/g, '');
    }
  } else if (limpio.includes('.')) {
    const partes = limpio.split('.');
    if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3)) {
      limpio = limpio.replace(/\./g, '');
    }
  }

  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Valida formato de fecha AAAA-MM-DD
 */
export function validarFechaYMD(fechaStr: string): boolean {
  if (!fechaStr) return false;
  const match = fechaStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!match) return false;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (y < 1980 || y > 2050 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  return true;
}

/**
 * Valida si un tipo de contrato corresponde a prestación de servicios o vínculos no laborales
 */
export function esContratoSinNomina(tipoContrato?: string): boolean {
  if (!tipoContrato) return false;
  const contratoNormalizado = String(tipoContrato).toLowerCase();
  return (
    contratoNormalizado.includes('prestacion') ||
    contratoNormalizado.includes('prestación') ||
    contratoNormalizado.includes('servicios') ||
    contratoNormalizado.includes('comercial') ||
    contratoNormalizado.includes('honorarios')
  );
}

/**
 * Calcula la provisión mensual legal de vacaciones (Art. 186 y 192 del Código Sustantivo del Trabajo - CST).
 *
 * Reglas de Negocio Legales:
 * 1. Tarifa mensual oficial: 4.17% (15 días de descanso remunerado / 360 días del año comercial = 1/24 ≈ 4.166667%).
 * 2. Base Salarial Computable: Salario básico contractual pactado (+ recargos fijos o comisiones salariales).
 *    CRÍTICO: De conformidad con el Art. 192 del CST y jurisprudencia unificada de la Sala Laboral de la CSJ,
 *    el Auxilio de Transporte NO se incluye en la base de cálculo de las vacaciones (a diferencia de cesantías y prima).
 * 3. Salario Integral (Art. 132 CST): Los trabajadores con salario integral SÍ tienen derecho a vacaciones remuneradas
 *    (15 días hábiles), por lo que la provisión mensual del 4.17% aplica sobre el salario básico integral pactado.
 * 4. Contratos de Prestación de Servicios / Sin Nómina: 0 COP (No genera vínculo laboral ni prestaciones sociales).
 */
export function calcularProvisionMensualVacaciones(
  salarioBasico: number,
  recargosFijos: number = 0,
  pctVacaciones: number = 0.0417,
  tipoContrato: string = 'Término indefinido',
  tipoSalario: string = 'Ordinario'
): number {
  if (!salarioBasico || salarioBasico <= 0) return 0;
  const contratoNormalizado = String(tipoContrato || '').toLowerCase();
  
  // Exclusión si no es relación laboral (Prestación de servicios, contratista, honorarios)
  if (
    contratoNormalizado.includes('prestacion') ||
    contratoNormalizado.includes('prestación') ||
    contratoNormalizado.includes('servicios') ||
    contratoNormalizado.includes('comercial') ||
    contratoNormalizado.includes('honorarios')
  ) {
    return 0;
  }

  const baseVacaciones = salarioBasico + Math.max(0, recargosFijos);
  return Math.round(baseVacaciones * pctVacaciones);
}

export interface DesglosePasivosLaborales {
  salarioBasico: number;
  esSalarioIntegral: boolean;
  esSinNomina: boolean;
  
  // Vacaciones (Art. 186 CST - 4.17%)
  provisionMensualVacaciones: number;
  pasivoVacacionesAcumulado: number;
  diasVacacionesPendientes: number;

  // Cesantías (Art. 249 CST - 8.33%)
  baseSalarioCesantias: number;
  provisionMensualCesantias: number;
  pasivoCesantiasAcumulado: number;

  // Intereses a Cesantías (Ley 52/1975 - 1% mensual / 12% anual)
  provisionMensualIntereses: number;
  pasivoInteresesAcumulado: number;

  // Prima de Servicios (Art. 306 CST - 8.33%)
  baseSalarioPrima: number;
  provisionMensualPrima: number;
  pasivoPrimaAcumulado: number;
  diasSemestrePrima: number;

  // Totales
  totalPasivosAcumuladosCOP: number;
  totalProvisionMensualCOP: number;
}

/**
 * Calcula el desglose integral de pasivos laborales y provisiones mensuales (21.83%)
 * para un registro de saldo inicial de nómina.
 */
export function calcularPasivosLaboralesCompletos(
  item: Partial<SaldoInicialEmpleadoNomina> & { salarioBasico?: number; tipoContrato?: string; tipoSalario?: string }
): DesglosePasivosLaborales {
  const salarioBasico = item.salarioBasico || 0;
  const tipoContrato = item.tipoContrato || 'Término indefinido';
  const tipoSalario = item.tipoSalario || 'Ordinario';
  const contratoNorm = tipoContrato.toLowerCase();

  const esSinNomina = (
    contratoNorm.includes('prestacion') ||
    contratoNorm.includes('prestación') ||
    contratoNorm.includes('servicios') ||
    contratoNorm.includes('comercial') ||
    contratoNorm.includes('honorarios')
  );

  const esSalarioIntegral = String(tipoSalario).toLowerCase().includes('integral');

  // 1. Vacaciones: 4.17% del salario básico
  const provisionMensualVacaciones = calcularProvisionMensualVacaciones(
    salarioBasico,
    0,
    0.0417,
    tipoContrato,
    tipoSalario
  );
  const diasVac = item.vacacionesDiasPendientes || 0;
  const pasivoVacacionesAcumulado = esSinNomina
    ? 0
    : ((item.vacacionesValorAcumuladoCOP !== undefined && item.vacacionesValorAcumuladoCOP > 0)
        ? item.vacacionesValorAcumuladoCOP
        : Math.round((salarioBasico / 30) * diasVac));

  // 2. Cesantías: 8.33% (0 para salario integral y sin nómina)
  const baseSalarioCesantias = (esSinNomina || esSalarioIntegral)
    ? 0
    : salarioBasico;
  const provisionMensualCesantias = (esSinNomina || esSalarioIntegral)
    ? 0
    : Math.round(baseSalarioCesantias * 0.0833);
  const pasivoCesantiasAcumulado = (esSinNomina || esSalarioIntegral)
    ? 0
    : (item.cesantiasSaldoAcumuladoCOP || 0);

  // 3. Intereses a Cesantías: 1% mensual sobre cesantías (12% anual)
  const provisionMensualIntereses = (esSinNomina || esSalarioIntegral)
    ? 0
    : Math.round(provisionMensualCesantias * 0.12);
  const pasivoInteresesAcumulado = (esSinNomina || esSalarioIntegral)
    ? 0
    : (item.interesesCesantiasAcumuladoCOP || 0);

  // 4. Prima de Servicios: 8.33% (0 para salario integral y sin nómina)
  const diasPrima = item.diasTrabajadosSemestrePrima || 180;
  const basePrima = item.primaServiciosBaseSemestreCOP || salarioBasico;
  const baseSalarioPrima = (esSinNomina || esSalarioIntegral) ? 0 : basePrima;
  const provisionMensualPrima = (esSinNomina || esSalarioIntegral)
    ? 0
    : Math.round(baseSalarioPrima * 0.0833);
  const pasivoPrimaAcumulado = (esSinNomina || esSalarioIntegral)
    ? 0
    : ((item.primaServiciosValorAcumuladoCOP !== undefined && item.primaServiciosValorAcumuladoCOP > 0)
        ? item.primaServiciosValorAcumuladoCOP
        : Math.round((baseSalarioPrima * Math.min(180, Math.max(1, diasPrima))) / 360));

  const totalPasivosAcumuladosCOP =
    pasivoVacacionesAcumulado +
    pasivoCesantiasAcumulado +
    pasivoInteresesAcumulado +
    pasivoPrimaAcumulado;

  const totalProvisionMensualCOP =
    provisionMensualVacaciones +
    provisionMensualCesantias +
    provisionMensualIntereses +
    provisionMensualPrima;

  return {
    salarioBasico,
    esSalarioIntegral,
    esSinNomina,
    provisionMensualVacaciones,
    pasivoVacacionesAcumulado,
    diasVacacionesPendientes: diasVac,
    baseSalarioCesantias,
    provisionMensualCesantias,
    pasivoCesantiasAcumulado,
    provisionMensualIntereses,
    pasivoInteresesAcumulado,
    baseSalarioPrima,
    provisionMensualPrima,
    pasivoPrimaAcumulado,
    diasSemestrePrima: diasPrima,
    totalPasivosAcumuladosCOP,
    totalProvisionMensualCOP
  };
}

/**
 * Genera la plantilla oficial descargable en formato CSV con todas las variables esenciales para producción
 */
export function generarPlantillaCsvSaldos(): string {
  const encabezados = ENCABEZADOS_CSV_SALDOS.join(',');
  const filasEjemplo = [
    [
      '1020892411',
      'Carlos Andres Restrepo',
      'Tecnico de Redes y Operaciones ISP',
      '2024-03-15',
      '2026-02-28',
      '2850000',
      'Ordinario',
      'Término indefinido',
      'SURA EPS',
      'Porvenir',
      'Positiva ARL',
      'Compensar',
      'Protección',
      '18.5',
      '1285000',
      '1750905',
      '210108',
      '875452',
      '60',
      '42500000',
      '1700000',
      '1700000',
      '0',
      '250000',
      '1600000',
      '0',
      '0',
      '0',
      '1200000',
      '150000',
      '0',
      '0',
      '0',
      '0',
      '50000',
      'Corte de saldos iniciales empalme contable feb 2026'
    ].join(','),
    [
      '52987456',
      'Maria Claudia Gomez',
      'Coordinadora de Gestion Humana',
      '2023-01-10',
      '2026-02-28',
      '4200000',
      'Ordinario',
      'Término indefinido',
      'Sanitas EPS',
      'Protección',
      'Sura ARL',
      'Colsubsidio',
      'Porvenir',
      '7.0',
      '850000',
      '2850000',
      '342000',
      '1425000',
      '60',
      '68400000',
      '2736000',
      '2736000',
      '684000',
      '1850000',
      '2700000',
      '1200000',
      '3500000',
      '450000',
      '0',
      '0',
      '2400000',
      '200000',
      '0',
      '0',
      '100000',
      'Saldo libranza bancaria activa Bancolombia'
    ].join(',')
  ];

  return [encabezados, ...filasEjemplo].join('\r\n');
}

/**
 * Parsea contenido CSV o TSV (Portapapeles de Excel) y efectúa validación semántica
 */
export function parsearTextoCsvOClipboard(
  contenido: string,
  empleadosExistentes: Empleado[] = []
): ResultadoParseoSaldos {
  const lineas = contenido
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items: SaldoInicialEmpleadoNomina[] = [];
  const errores: FilaErrorValidacion[] = [];
  const advertencias: FilaAdvertenciaValidacion[] = [];

  if (lineas.length === 0) {
    return {
      items: [],
      errores: [{ fila: 0, columna: 'archivo', mensaje: 'El contenido está vacío.', valor: '' }],
      advertencias: [],
      resumen: {
        totalFilas: 0,
        validas: 0,
        conErrores: 1,
        totalPasivosCOP: 0,
        totalDiasVacaciones: 0,
        totalProvisionMensualVacacionesCOP: 0,
        totalProvisionMensualCesantiasCOP: 0,
        totalProvisionMensualInteresesCOP: 0,
        totalProvisionMensualPrimaCOP: 0,
        totalCargaMensualPrestacionesCOP: 0,
        totalCarteraPrestamosCOP: 0,
        totalIngresosAcumuladosAnoCOP: 0,
        totalSalariosBaseCOP: 0
      }
    };
  }

  // Detectar separador
  const primeraLinea = lineas[0];
  let separador = ',';
  if (primeraLinea.includes('\t')) {
    separador = '\t';
  } else if (primeraLinea.includes(';') && !primeraLinea.includes(',')) {
    separador = ';';
  }

  // Verificar encabezado y mapear nombres de columnas si existen
  let indiceInicio = 0;
  const primeraFilaMinuscula = primeraLinea.toLowerCase();
  const esEncabezado = (
    primeraFilaMinuscula.includes('documento') ||
    primeraFilaMinuscula.includes('cedula') ||
    primeraFilaMinuscula.includes('nombre') ||
    primeraFilaMinuscula.includes('vacacion')
  );

  let mapaEncabezados: Record<string, number> = {};

  if (esEncabezado) {
    indiceInicio = 1;
    const cols = primeraLinea.split(separador).map(c => c.trim().replace(/^"|"$/g, '').toLowerCase());
    cols.forEach((col, idx) => {
      mapaEncabezados[col] = idx;
    });
  }

  const getVal = (cols: string[], nombreHeader: string, indiceDefault: number): string => {
    if (mapaEncabezados[nombreHeader.toLowerCase()] !== undefined) {
      const idx = mapaEncabezados[nombreHeader.toLowerCase()];
      return cols[idx] !== undefined ? cols[idx] : '';
    }
    return cols[indiceDefault] !== undefined ? cols[indiceDefault] : '';
  };

  const mapaEmpleados = new Map<string, Empleado>();
  empleadosExistentes.forEach(emp => {
    const docLimpio = (emp.documento || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    if (docLimpio) {
      mapaEmpleados.set(docLimpio, emp);
    }
  });

  const fechaCorteDefault = new Date().toISOString().slice(0, 10);
  const documentosVistosEnLote = new Set<string>();

  for (let idx = indiceInicio; idx < lineas.length; idx++) {
    const numFila = idx + 1;
    const linea = lineas[idx];
    
    let columnas: string[] = [];
    if (separador === '\t') {
      columnas = linea.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
    } else {
      const matches = linea.match(/(".*?"|[^",;]+)(?=\s*[,;]|\s*$)/g);
      if (matches) {
        columnas = matches.map(m => m.trim().replace(/^"|"$/g, ''));
      } else {
        columnas = linea.split(separador).map(c => c.trim().replace(/^"|"$/g, ''));
      }
    }

    if (columnas.length < 2) {
      errores.push({
        fila: numFila,
        columna: 'formato',
        mensaje: 'La fila no contiene suficientes columnas de datos.',
        valor: linea
      });
      continue;
    }

    const documentoRaw = (getVal(columnas, 'documento', 0) || '').trim();
    const documentoLimpio = documentoRaw.replace(/[^0-9a-zA-Z]/g, '');

    if (!documentoLimpio) {
      errores.push({
        fila: numFila,
        columna: 'documento',
        mensaje: 'El documento o cédula es obligatorio.',
        valor: documentoRaw
      });
      continue;
    }

    if (documentosVistosEnLote.has(documentoLimpio.toLowerCase())) {
      advertencias.push({
        fila: numFila,
        mensaje: `El documento ${documentoRaw} está duplicado en el archivo. Se procesará la última aparición.`
      });
    }
    documentosVistosEnLote.add(documentoLimpio.toLowerCase());

    const empCoincidente = mapaEmpleados.get(documentoLimpio.toLowerCase());
    const nombreCompleto = (getVal(columnas, 'nombreCompleto', 1) || '').trim() || empCoincidente?.nombre || `Colaborador Doc. ${documentoRaw}`;
    const cargoNombre = (getVal(columnas, 'cargoNombre', 2) || '').trim() || empCoincidente?.laboral?.cargoNombre || empCoincidente?.cargoId || 'Colaborador';
    
    let fechaIngreso = (getVal(columnas, 'fechaIngreso', 3) || '').trim() || empCoincidente?.laboral?.fechaIngreso || empCoincidente?.contrato?.inicio || '';
    if (fechaIngreso && !validarFechaYMD(fechaIngreso)) {
      advertencias.push({
        fila: numFila,
        mensaje: `Formato de fecha de ingreso "${fechaIngreso}" dudoso. Se recomienda AAAA-MM-DD.`
      });
    }

    let fechaCorteSaldos = (getVal(columnas, 'fechaCorteSaldos', 4) || '').trim() || fechaCorteDefault;
    if (!validarFechaYMD(fechaCorteSaldos)) {
      fechaCorteSaldos = fechaCorteDefault;
    }

    // Datos salariales y contractuales de inicio de producción
    const salarioBasico = limpiarNumeroMoneda(getVal(columnas, 'salarioBasico', 5)) || empCoincidente?.compensacion?.salarioBasico || empCoincidente?.salarioBase || 0;
    const tipoSalario = (getVal(columnas, 'tipoSalario', 6) || '').trim() || empCoincidente?.compensacion?.tipoSalario || 'Ordinario';
    const tipoContrato = (getVal(columnas, 'tipoContrato', 7) || '').trim() || empCoincidente?.laboral?.tipoContrato || empCoincidente?.contrato?.tipo || 'Término indefinido';

    // Afiliaciones
    const eps = (getVal(columnas, 'eps', 8) || '').trim() || empCoincidente?.seguridadSocial?.eps || 'SURA EPS';
    const fondoPensiones = (getVal(columnas, 'fondoPensiones', 9) || '').trim() || empCoincidente?.seguridadSocial?.fondoPensiones || 'Porvenir';
    const arl = (getVal(columnas, 'arl', 10) || '').trim() || empCoincidente?.seguridadSocial?.arl || 'Positiva ARL';
    const cajaCompensacion = (getVal(columnas, 'cajaCompensacion', 11) || '').trim() || empCoincidente?.seguridadSocial?.cajaCompensacion || 'Compensar';
    const fondoCesantias = (getVal(columnas, 'fondoCesantias', 12) || '').trim() || empCoincidente?.seguridadSocial?.fondoCesantias || 'Protección';

    // Check Salario Integral (Art. 132 CST)
    const esSalarioIntegral = tipoSalario.toLowerCase().includes('integral');

    // 1. Prestaciones y pasivos
    const vacacionesDias = limpiarNumeroMoneda(getVal(columnas, 'vacacionesDiasPendientes', 13));
    const vacacionesCOP = limpiarNumeroMoneda(getVal(columnas, 'vacacionesValorAcumuladoCOP', 14));
    const cesantiasCOP = esSalarioIntegral ? 0 : limpiarNumeroMoneda(getVal(columnas, 'cesantiasSaldoAcumuladoCOP', 15));
    const interesesCesantiasCOP = esSalarioIntegral ? 0 : limpiarNumeroMoneda(getVal(columnas, 'interesesCesantiasAcumuladoCOP', 16));
    const primaServiciosBaseCOP = esSalarioIntegral ? 0 : (limpiarNumeroMoneda(getVal(columnas, 'primaServiciosBaseSemestreCOP', 17)) || salarioBasico);
    const diasPrima = parseInt(getVal(columnas, 'diasTrabajadosSemestrePrima', 18) || '180', 10) || 180;
    
    // Cálculo exacto del pasivo de Prima de Servicios (Art. 306 CST - Dos pagos al año: Junio y Diciembre)
    // Formula oficial: (Base Salarial Semestre * Días Trabajados Semestre) / 360 (0 para Salario Integral)
    const primaValRead = limpiarNumeroMoneda(getVal(columnas, 'primaServiciosValorAcumuladoCOP', -1));
    const primaServiciosValorAcumulado = esSalarioIntegral
      ? 0
      : (primaValRead > 0
          ? primaValRead
          : Math.round((primaServiciosBaseCOP * Math.min(180, Math.max(1, diasPrima))) / 360));

    const mesCorte = parseInt(fechaCorteSaldos.split('-')[1] || '6', 10);
    const semestrePrimaActual = mesCorte <= 6 ? '1er Semestre (Ene - Jun)' : '2do Semestre (Jul - Dic)';
    const primaServiciosPagadaAno = limpiarNumeroMoneda(getVal(columnas, 'primaServiciosPagadaAnoCOP', -1));

    // 2. Acumulados tributarios y DIAN
    const ingresosAno = limpiarNumeroMoneda(getVal(columnas, 'ingresosLaboralesAcumuladosAnoCOP', 19));
    const saludAno = limpiarNumeroMoneda(getVal(columnas, 'saludAportesAcumuladosAnoCOP', 20));
    const pensionAno = limpiarNumeroMoneda(getVal(columnas, 'pensionAportesAcumuladosAnoCOP', 21));
    const fspAno = limpiarNumeroMoneda(getVal(columnas, 'fspAportesAcumuladosAnoCOP', 22));
    const retencionAno = limpiarNumeroMoneda(getVal(columnas, 'retencionFuenteAcumuladaAnoCOP', 23));
    const cesantiasPagadasAno = limpiarNumeroMoneda(getVal(columnas, 'cesantiasPagadasAnoCOP', 24));
    const aporteVoluntarioPensionAno = limpiarNumeroMoneda(getVal(columnas, 'aporteVoluntarioPensionAnoCOP', 25));
    const deduccionDependientesAno = limpiarNumeroMoneda(getVal(columnas, 'deduccionDependientesAnoCOP', 26));
    const saludPrepagadaAno = limpiarNumeroMoneda(getVal(columnas, 'saludPrepagadaAnoCOP', 27));

    // 3. Préstamos y deducciones
    const prestamoSaldo = limpiarNumeroMoneda(getVal(columnas, 'prestamoEmpresaSaldoCOP', 28));
    const prestamoCuota = limpiarNumeroMoneda(getVal(columnas, 'prestamoEmpresaCuotaMensualCOP', 29));
    const libranzaSaldo = limpiarNumeroMoneda(getVal(columnas, 'libranzaSaldoCOP', 30));
    const libranzaCuota = limpiarNumeroMoneda(getVal(columnas, 'libranzaCuotaMensualCOP', 31));
    const embargoSaldo = limpiarNumeroMoneda(getVal(columnas, 'embargoJudicialSaldoCOP', 32));
    const embargoCuota = limpiarNumeroMoneda(getVal(columnas, 'embargoJudicialCuotaMensualCOP', 33));
    const otrasDeduccionesFijas = limpiarNumeroMoneda(getVal(columnas, 'otrasDeduccionesFijasMensualCOP', 34));

    const observaciones = (getVal(columnas, 'observaciones', 35) || '').trim();

    if (!empCoincidente) {
      advertencias.push({
        fila: numFila,
        mensaje: `El documento ${documentoRaw} (${nombreCompleto}) no se encuentra en el censo del módulo de empleados. Se puede crear/sincronizar automáticamente.`
      });
    }

    // Cálculo de provisiones mensuales oficiales (CST Colombia)
    const provVacacionesMes = calcularProvisionMensualVacaciones(salarioBasico, 0, 0.0417, tipoContrato, tipoSalario);
    const provCesantiasMes = (esSalarioIntegral || esContratoSinNomina(tipoContrato)) ? 0 : Math.round(salarioBasico * 0.0833);
    const provInteresesMes = (esSalarioIntegral || esContratoSinNomina(tipoContrato)) ? 0 : Math.round(provCesantiasMes * 0.12);
    const provPrimaMes = (esSalarioIntegral || esContratoSinNomina(tipoContrato)) ? 0 : Math.round(primaServiciosBaseCOP * 0.0833);
    const pasivosLaboralesEmpleado = (vacacionesCOP || 0) + (cesantiasCOP || 0) + (interesesCesantiasCOP || 0) + (primaServiciosValorAcumulado || 0);
    const provMensualTotal = provVacacionesMes + provCesantiasMes + provInteresesMes + provPrimaMes;

    const itemSaldo: SaldoInicialEmpleadoNomina = {
      id: `saldo-${documentoLimpio.toLowerCase()}`,
      empleadoId: empCoincidente?.id,
      documento: documentoRaw,
      nombreCompleto,
      cargoNombre,
      fechaIngreso: fechaIngreso || undefined,
      fechaCorteSaldos,

      salarioBasico: salarioBasico || undefined,
      tipoSalario,
      tipoContrato,

      eps,
      fondoPensiones,
      arl,
      cajaCompensacion,
      fondoCesantias,

      vacacionesDiasPendientes: vacacionesDias,
      vacacionesValorAcumuladoCOP: vacacionesCOP,
      provisionMensualVacacionesCOP: provVacacionesMes,
      cesantiasSaldoAcumuladoCOP: cesantiasCOP,
      provisionMensualCesantiasCOP: provCesantiasMes,
      interesesCesantiasAcumuladoCOP: interesesCesantiasCOP,
      provisionMensualInteresesCOP: provInteresesMes,
      totalPasivosLaboralesCOP: pasivosLaboralesEmpleado,
      totalProvisionMensualPrestacionesCOP: provMensualTotal,

      semestrePrimaActual: semestrePrimaActual as any,
      primaServiciosBaseSemestreCOP: primaServiciosBaseCOP,
      diasTrabajadosSemestrePrima: diasPrima,
      primaServiciosValorAcumuladoCOP: primaServiciosValorAcumulado,
      primaServiciosPagadaAnoCOP: primaServiciosPagadaAno > 0 ? primaServiciosPagadaAno : undefined,
      provisionMensualPrimaCOP: provPrimaMes,

      ingresosLaboralesAcumuladosAnoCOP: ingresosAno,
      saludAportesAcumuladosAnoCOP: saludAno,
      pensionAportesAcumuladosAnoCOP: pensionAno,
      fspAportesAcumuladosAnoCOP: fspAno,
      retencionFuenteAcumuladaAnoCOP: retencionAno,
      cesantiasPagadasAnoCOP: cesantiasPagadasAno,
      aporteVoluntarioPensionAnoCOP: aporteVoluntarioPensionAno,
      deduccionDependientesAnoCOP: deduccionDependientesAno,
      saludPrepagadaAnoCOP: saludPrepagadaAno,

      prestamoEmpresaSaldoCOP: prestamoSaldo,
      prestamoEmpresaCuotaMensualCOP: prestamoCuota,
      libranzaSaldoCOP: libranzaSaldo,
      libranzaCuotaMensualCOP: libranzaCuota,
      embargoJudicialSaldoCOP: embargoSaldo,
      embargoJudicialCuotaMensualCOP: embargoCuota,
      otrasDeduccionesFijasMensualCOP: otrasDeduccionesFijas,

      observaciones: observaciones || undefined,
      fechaRegistro: new Date().toISOString(),
      aplicadoEnNomina: false,
      aplicadoEnVacaciones: false
    };

    items.push(itemSaldo);
  }

  const totalPasivosCOP = items.reduce((acc, curr) => {
    return acc +
      (curr.vacacionesValorAcumuladoCOP || 0) +
      (curr.cesantiasSaldoAcumuladoCOP || 0) +
      (curr.interesesCesantiasAcumuladoCOP || 0) +
      (curr.primaServiciosValorAcumuladoCOP || Math.round(((curr.primaServiciosBaseSemestreCOP || 0) * (curr.diasTrabajadosSemestrePrima || 180)) / 360));
  }, 0);

  const totalDiasVacaciones = items.reduce((acc, curr) => acc + curr.vacacionesDiasPendientes, 0);
  const totalProvisionMensualVacacionesCOP = items.reduce((acc, curr) => acc + (curr.provisionMensualVacacionesCOP || 0), 0);
  const totalProvisionMensualCesantiasCOP = items.reduce((acc, curr) => acc + (curr.provisionMensualCesantiasCOP || 0), 0);
  const totalProvisionMensualInteresesCOP = items.reduce((acc, curr) => acc + (curr.provisionMensualInteresesCOP || 0), 0);
  const totalProvisionMensualPrimaCOP = items.reduce((acc, curr) => acc + (curr.provisionMensualPrimaCOP || 0), 0);
  const totalCargaMensualPrestacionesCOP = items.reduce((acc, curr) => acc + (curr.totalProvisionMensualPrestacionesCOP || 0), 0);
  const totalCarteraPrestamosCOP = items.reduce((acc, curr) => acc + curr.prestamoEmpresaSaldoCOP + curr.libranzaSaldoCOP + curr.embargoJudicialSaldoCOP, 0);
  const totalIngresosAcumuladosAnoCOP = items.reduce((acc, curr) => acc + curr.ingresosLaboralesAcumuladosAnoCOP, 0);
  const totalSalariosBaseCOP = items.reduce((acc, curr) => acc + (curr.salarioBasico || 0), 0);

  return {
    items,
    errores,
    advertencias,
    resumen: {
      totalFilas: lineas.length - indiceInicio,
      validas: items.length,
      conErrores: errores.length,
      totalPasivosCOP,
      totalDiasVacaciones,
      totalProvisionMensualVacacionesCOP,
      totalProvisionMensualCesantiasCOP,
      totalProvisionMensualInteresesCOP,
      totalProvisionMensualPrimaCOP,
      totalCargaMensualPrestacionesCOP,
      totalCarteraPrestamosCOP,
      totalIngresosAcumuladosAnoCOP,
      totalSalariosBaseCOP
    }
  };
}

/**
 * Sincroniza y crea si es necesario colaboradores en el Censo de Empleados
 * asegurando que el Módulo de Empleados tenga todos los datos para operar
 */
export function sincronizarOSincronizarYCrearEmpleadosDesdeSaldos(
  saldos: SaldoInicialEmpleadoNomina[],
  empleadosExistentes: Empleado[],
  cargos: Cargo[] = []
): { empleadosActualizados: Empleado[]; creadosContador: number; actualizadosContador: number } {
  const mapaEmpleados = new Map<string, Empleado>();
  empleadosExistentes.forEach(emp => {
    const docLimpio = (emp.documento || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    if (docLimpio) mapaEmpleados.set(docLimpio, emp);
  });

  let creadosContador = 0;
  let actualizadosContador = 0;

  saldos.forEach(s => {
    const docLimpio = (s.documento || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    if (!docLimpio) return;

    const empExistente = mapaEmpleados.get(docLimpio);
    const cargoEmp = cargos.find(c => c.nombre.toLowerCase().includes((s.cargoNombre || '').toLowerCase()));
    const cargoIdUsar = cargoEmp?.id || empExistente?.cargoId || 'cargo-gen';
    const salarioUsar = s.salarioBasico || empExistente?.compensacion?.salarioBasico || empExistente?.salarioBase || 2000000;

    if (empExistente) {
      actualizadosContador++;
      const empActualizado: Empleado = {
        ...empExistente,
        salarioBase: salarioUsar,
        saldoInicial: s,
        contrato: {
          ...empExistente.contrato,
          tipo: s.tipoContrato || empExistente.contrato?.tipo || 'Término indefinido',
          inicio: s.fechaIngreso || empExistente.contrato?.inicio || '2024-01-01',
          salario: `$${salarioUsar.toLocaleString('es-CO')}`
        },
        laboral: {
          ...(empExistente.laboral || {
            codigoInterno: `EMP-${s.documento.slice(-4)}`,
            fechaIngreso: s.fechaIngreso || '2024-01-01',
            fechaInicioLaboral: s.fechaIngreso || '2024-01-01',
            areaId: 'area-op',
            cargoId: cargoIdUsar,
            tipoContrato: s.tipoContrato || 'Término indefinido',
            fechaInicioContrato: s.fechaIngreso || '2024-01-01',
            jornadaLaboral: '42 hrs semanales (Ley 2101)',
            modalidadTrabajo: 'Presencial',
            lugarTrabajo: 'Sede Principal',
            estado: 'Activo'
          }),
          cargoNombre: s.cargoNombre || empExistente.laboral?.cargoNombre || 'Colaborador',
          fechaIngreso: s.fechaIngreso || empExistente.laboral?.fechaIngreso || '2024-01-01',
          tipoContrato: s.tipoContrato || empExistente.laboral?.tipoContrato || 'Término indefinido'
        },
        compensacion: {
          ...(empExistente.compensacion || {
            salarioBasico: salarioUsar,
            tipoSalario: (s.tipoSalario as any) || 'Ordinario',
            periodicidadPago: 'Quincenal',
            auxilioTransporte: salarioUsar <= 3501810,
            formaPago: 'Transferencia bancaria',
            banco: 'Bancolombia',
            tipoCuenta: 'Ahorros',
            numeroCuenta: '000000000',
            historialVigencias: []
          }),
          salarioBasico: salarioUsar,
          tipoSalario: (s.tipoSalario as any) || empExistente.compensacion?.tipoSalario || 'Ordinario'
        },
        seguridadSocial: {
          ...(empExistente.seguridadSocial || {
            eps: s.eps || 'SURA EPS',
            fondoPensiones: s.fondoPensiones || 'Porvenir',
            arl: s.arl || 'Positiva ARL',
            nivelRiesgoArl: 'I (0.522%)',
            cajaCompensacion: s.cajaCompensacion || 'Compensar',
            fondoCesantias: s.fondoCesantias || 'Protección',
            fechaAfiliacion: s.fechaIngreso || '2024-01-01',
            estadoAfiliacion: 'Activa',
            tipoAfiliacion: 'Cotizante Dependiente'
          }),
          eps: s.eps || empExistente.seguridadSocial?.eps || 'SURA EPS',
          fondoPensiones: s.fondoPensiones || empExistente.seguridadSocial?.fondoPensiones || 'Porvenir',
          arl: s.arl || empExistente.seguridadSocial?.arl || 'Positiva ARL',
          cajaCompensacion: s.cajaCompensacion || empExistente.seguridadSocial?.cajaCompensacion || 'Compensar',
          fondoCesantias: s.fondoCesantias || empExistente.seguridadSocial?.fondoCesantias || 'Protección'
        }
      };
      mapaEmpleados.set(docLimpio, empActualizado);
    } else {
      creadosContador++;
      const nombresPartes = (s.nombreCompleto || 'Colaborador').trim().split(' ');
      const pNombre = nombresPartes[0] || 'Colaborador';
      const pApellido = nombresPartes.slice(1).join(' ') || 'General';

      const nuevoEmp: Empleado = {
        id: `emp-${docLimpio}`,
        nombre: s.nombreCompleto,
        documento: s.documento,
        tipoDocumento: 'CC',
        email: `${pNombre.toLowerCase().replace(/[^a-z]/g, '')}.${pApellido.toLowerCase().replace(/[^a-z]/g, '')}@bgroup.com.co`,
        telefono: '3000000000',
        cargoId: cargoIdUsar,
        areaId: 'area-op',
        formacion: 'Profesional',
        experiencia: '2 años',
        salarioBase: salarioUsar,
        activo: true,
        estadoLaboral: 'activo',
        familia: [],
        saldoInicial: s,
        contrato: {
          tipo: s.tipoContrato || 'Término indefinido',
          inicio: s.fechaIngreso || '2024-01-01',
          fin: '—',
          salario: `$${salarioUsar.toLocaleString('es-CO')}`
        },
        persona: {
          tipoDocumento: 'CC',
          numeroDocumento: s.documento,
          primerNombre: pNombre,
          primerApellido: pApellido,
          fechaNacimiento: '1990-01-01',
          nacionalidad: 'Colombiana',
          genero: 'No especificado',
          estadoCivil: 'Soltero(a)'
        },
        contacto: {
          direccion: 'Dirección Registrada Saldos Iniciales',
          departamento: 'Bogotá D.C.',
          ciudad: 'Bogotá D.C.',
          celular: '3000000000',
          correoPersonal: `${docLimpio}@ejemplo.com`,
          correoCorporativo: `${pNombre.toLowerCase().replace(/[^a-z]/g, '')}@bgroup.com.co`,
          contactoEmergenciaNombre: 'Familiar Contacto',
          contactoEmergenciaParentesco: 'Familiar',
          contactoEmergenciaTelefono: '3000000000'
        },
        laboral: {
          codigoInterno: `EMP-${s.documento.slice(-4)}`,
          fechaIngreso: s.fechaIngreso || '2024-01-01',
          fechaInicioLaboral: s.fechaIngreso || '2024-01-01',
          areaId: 'area-op',
          areaNombre: 'Operaciones',
          cargoId: cargoIdUsar,
          cargoNombre: s.cargoNombre || 'Colaborador',
          tipoContrato: s.tipoContrato || 'Término indefinido',
          fechaInicioContrato: s.fechaIngreso || '2024-01-01',
          jornadaLaboral: '42 hrs semanales (Ley 2101)',
          modalidadTrabajo: 'Presencial',
          lugarTrabajo: 'Sede Principal Bogotá',
          estado: 'Activo'
        },
        compensacion: {
          salarioBasico: salarioUsar,
          tipoSalario: (s.tipoSalario as any) || 'Ordinario',
          periodicidadPago: 'Quincenal',
          auxilioTransporte: salarioUsar <= 3501810,
          formaPago: 'Transferencia bancaria',
          banco: 'Bancolombia',
          tipoCuenta: 'Ahorros',
          numeroCuenta: '000000000',
          historialVigencias: []
        },
        seguridadSocial: {
          eps: s.eps || 'SURA EPS',
          fondoPensiones: s.fondoPensiones || 'Porvenir',
          arl: s.arl || 'Positiva ARL',
          nivelRiesgoArl: 'I (0.522%)',
          cajaCompensacion: s.cajaCompensacion || 'Compensar',
          fondoCesantias: s.fondoCesantias || 'Protección',
          fechaAfiliacion: s.fechaIngreso || '2024-01-01',
          estadoAfiliacion: 'Activa',
          tipoAfiliacion: 'Cotizante Dependiente'
        }
      };
      mapaEmpleados.set(docLimpio, nuevoEmp);
    }
  });

  return {
    empleadosActualizados: Array.from(mapaEmpleados.values()),
    creadosContador,
    actualizadosContador
  };
}

/**
 * Genera la integración automática de novedades de nómina para deducciones de cuotas iniciales
 */
export function generarNovedadesDesdeSaldosIniciales(
  saldos: SaldoInicialEmpleadoNomina[]
): Record<string, Partial<NovedadNominaEmpleado>> {
  const novedadesMap: Record<string, Partial<NovedadNominaEmpleado>> = {};

  saldos.forEach(s => {
    if (s.empleadoId || s.documento) {
      const key = s.empleadoId || `emp-${s.documento.replace(/[^0-9a-zA-Z]/g, '').toLowerCase()}`;
      const cuotaEmbargo = s.embargoJudicialCuotaMensualCOP || s.embargoJudicialSaldoCOP || 0;
      const cuotaTotalPrestamos = s.prestamoEmpresaCuotaMensualCOP + s.libranzaCuotaMensualCOP + cuotaEmbargo + s.otrasDeduccionesFijasMensualCOP;
      if (cuotaTotalPrestamos > 0) {
        novedadesMap[key] = {
          prestamosYDeducciones: cuotaTotalPrestamos,
          otrasDeduccionesTexto: [
            s.prestamoEmpresaCuotaMensualCOP > 0 ? `Préstamo: $${s.prestamoEmpresaCuotaMensualCOP.toLocaleString('es-CO')}` : null,
            s.libranzaCuotaMensualCOP > 0 ? `Libranza: $${s.libranzaCuotaMensualCOP.toLocaleString('es-CO')}` : null,
            cuotaEmbargo > 0 ? `Embargo: $${cuotaEmbargo.toLocaleString('es-CO')}` : null,
            s.otrasDeduccionesFijasMensualCOP > 0 ? `Fondo/Otras: $${s.otrasDeduccionesFijasMensualCOP.toLocaleString('es-CO')}` : null
          ].filter(Boolean).join(' | ')
        };
      }
    }
  });

  return novedadesMap;
}

const LOCAL_STORAGE_KEY_SALDOS = 'bgroup_saldos_iniciales_nomina';

export function obtenerSaldosInicialesLocal(): SaldoInicialEmpleadoNomina[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SALDOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error al leer saldos iniciales de localStorage:', e);
    return [];
  }
}

export function guardarSaldosInicialesLocal(saldos: SaldoInicialEmpleadoNomina[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SALDOS, JSON.stringify(saldos));
  } catch (e) {
    console.error('Error al guardar saldos iniciales en localStorage:', e);
  }
}

export function agregarOActualizarSaldosLocal(nuevosSaldos: SaldoInicialEmpleadoNomina[]): SaldoInicialEmpleadoNomina[] {
  const existentes = obtenerSaldosInicialesLocal();
  const mapa = new Map<string, SaldoInicialEmpleadoNomina>();
  
  existentes.forEach(s => mapa.set(s.id, s));
  nuevosSaldos.forEach(s => mapa.set(s.id, s));

  const combinados = Array.from(mapa.values());
  guardarSaldosInicialesLocal(combinados);
  return combinados;
}

export function eliminarSaldoInicialLocal(id: string): SaldoInicialEmpleadoNomina[] {
  const existentes = obtenerSaldosInicialesLocal();
  const filtrados = existentes.filter(s => s.id !== id);
  guardarSaldosInicialesLocal(filtrados);
  return filtrados;
}

export function limpiarTodosSaldosInicialesLocal(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY_SALDOS);
}

/**
 * Genera un lote de saldos iniciales de prueba basado en colaboradores existentes o plantilla
 */
export function generarLotePruebaSaldos(empleados: Empleado[] = []): SaldoInicialEmpleadoNomina[] {
  const fechaCorte = '2026-02-28';
  
  if (empleados.length > 0) {
    return empleados.slice(0, 6).map((emp, idx) => {
      const salarioBase = emp.compensacion?.salarioBasico || emp.salarioBase || 2850000;
      const docLimpio = (emp.documento || `102089241${idx}`).replace(/[^0-9a-zA-Z]/g, '');
      const diasVac = [12.5, 6, 18, 0, 7.5, 15][idx % 6];
      const vacCOP = Math.round((salarioBase / 30) * diasVac);
      const cesCOP = Math.round((salarioBase / 360) * 180);
      const intCesCOP = Math.round((cesCOP * 0.12 * 180) / 360);
      const primaCOP = Math.round((salarioBase / 360) * 60);

      const provVac = calcularProvisionMensualVacaciones(salarioBase, 0, 0.0417, emp.laboral?.tipoContrato, emp.compensacion?.tipoSalario);
      const provCes = Math.round(salarioBase * 0.0833);
      const provInt = Math.round(provCes * 0.12);
      const provPri = Math.round(salarioBase * 0.0833);

      const tienePrestamo = idx % 2 === 0;
      const tieneLibranza = idx % 3 === 0;

      return {
        id: `saldo-${docLimpio.toLowerCase()}`,
        empleadoId: emp.id,
        documento: emp.documento || `102089241${idx}`,
        nombreCompleto: emp.nombre,
        cargoNombre: emp.laboral?.cargoNombre || emp.cargoId || 'Colaborador',
        fechaIngreso: emp.laboral?.fechaIngreso || emp.contrato?.inicio || '2024-01-15',
        fechaCorteSaldos: fechaCorte,

        salarioBasico: salarioBase,
        tipoSalario: emp.compensacion?.tipoSalario || 'Ordinario',
        tipoContrato: emp.laboral?.tipoContrato || 'Término indefinido',

        eps: emp.seguridadSocial?.eps || 'SURA EPS',
        fondoPensiones: emp.seguridadSocial?.fondoPensiones || 'Porvenir',
        arl: emp.seguridadSocial?.arl || 'Positiva ARL',
        cajaCompensacion: emp.seguridadSocial?.cajaCompensacion || 'Compensar',
        fondoCesantias: emp.seguridadSocial?.fondoCesantias || 'Protección',

        vacacionesDiasPendientes: diasVac,
        vacacionesValorAcumuladoCOP: vacCOP,
        provisionMensualVacacionesCOP: provVac,
        cesantiasSaldoAcumuladoCOP: cesCOP,
        provisionMensualCesantiasCOP: provCes,
        interesesCesantiasAcumuladoCOP: intCesCOP,
        provisionMensualInteresesCOP: provInt,
        semestrePrimaActual: '1er Semestre (Ene - Jun)',
        primaServiciosBaseSemestreCOP: salarioBase,
        diasTrabajadosSemestrePrima: 60,
        primaServiciosValorAcumuladoCOP: primaCOP,
        provisionMensualPrimaCOP: provPri,
        totalPasivosLaboralesCOP: vacCOP + cesCOP + intCesCOP + primaCOP,
        totalProvisionMensualPrestacionesCOP: provVac + provCes + provInt + provPri,

        ingresosLaboralesAcumuladosAnoCOP: salarioBase * 2,
        saludAportesAcumuladosAnoCOP: Math.round(salarioBase * 0.04 * 2),
        pensionAportesAcumuladosAnoCOP: Math.round(salarioBase * 0.04 * 2),
        fspAportesAcumuladosAnoCOP: salarioBase > 5600000 ? Math.round(salarioBase * 0.01 * 2) : 0,
        retencionFuenteAcumuladaAnoCOP: salarioBase > 6000000 ? 180000 : 0,
        cesantiasPagadasAnoCOP: cesCOP,

        prestamoEmpresaSaldoCOP: tienePrestamo ? 1500000 : 0,
        prestamoEmpresaCuotaMensualCOP: tienePrestamo ? 250000 : 0,
        libranzaSaldoCOP: tieneLibranza ? 3600000 : 0,
        libranzaCuotaMensualCOP: tieneLibranza ? 300000 : 0,
        embargoJudicialSaldoCOP: 0,
        embargoJudicialCuotaMensualCOP: 0,
        otrasDeduccionesFijasMensualCOP: idx === 1 ? 50000 : 0,

        observaciones: `Corte contable de empalme histórico a ${fechaCorte}`,
        fechaRegistro: new Date().toISOString(),
        aplicadoEnNomina: true,
        aplicadoEnVacaciones: true
      };
    });
  }

  return [
    {
      id: 'saldo-1020892411',
      documento: '1020892411',
      nombreCompleto: 'Carlos Andrés Restrepo Morales',
      cargoNombre: 'Técnico de Redes y Telecomunicaciones',
      fechaIngreso: '2024-03-15',
      fechaCorteSaldos: fechaCorte,
      salarioBasico: 2850000,
      tipoSalario: 'Ordinario',
      tipoContrato: 'Término indefinido',
      eps: 'SURA EPS',
      fondoPensiones: 'Porvenir',
      arl: 'Positiva ARL',
      cajaCompensacion: 'Compensar',
      fondoCesantias: 'Protección',
      vacacionesDiasPendientes: 18.5,
      vacacionesValorAcumuladoCOP: 1285000,
      provisionMensualVacacionesCOP: Math.round(2850000 * 0.0417),
      cesantiasSaldoAcumuladoCOP: 1750905,
      provisionMensualCesantiasCOP: Math.round(2850000 * 0.0833),
      interesesCesantiasAcumuladoCOP: 210108,
      provisionMensualInteresesCOP: Math.round(2850000 * 0.0833 * 0.12),
      semestrePrimaActual: '1er Semestre (Ene - Jun)',
      primaServiciosBaseSemestreCOP: 2850000,
      diasTrabajadosSemestrePrima: 60,
      primaServiciosValorAcumuladoCOP: 475000,
      provisionMensualPrimaCOP: Math.round(2850000 * 0.0833),
      totalPasivosLaboralesCOP: 1285000 + 1750905 + 210108 + 475000,
      totalProvisionMensualPrestacionesCOP: Math.round(2850000 * (0.0417 + 0.0833 + (0.0833 * 0.12) + 0.0833)),
      ingresosLaboralesAcumuladosAnoCOP: 42500000,
      saludAportesAcumuladosAnoCOP: 1700000,
      pensionAportesAcumuladosAnoCOP: 1700000,
      fspAportesAcumuladosAnoCOP: 0,
      retencionFuenteAcumuladaAnoCOP: 250000,
      cesantiasPagadasAnoCOP: 1600000,
      prestamoEmpresaSaldoCOP: 1200000,
      prestamoEmpresaCuotaMensualCOP: 150000,
      libranzaSaldoCOP: 0,
      libranzaCuotaMensualCOP: 0,
      embargoJudicialSaldoCOP: 0,
      otrasDeduccionesFijasMensualCOP: 50000,
      observaciones: 'Saldo inicial verificado con balance de prueba feb 2026',
      fechaRegistro: new Date().toISOString(),
      aplicadoEnNomina: true,
      aplicadoEnVacaciones: true
    },
    {
      id: 'saldo-52987456',
      documento: '52987456',
      nombreCompleto: 'María Claudia Gómez Salazar',
      cargoNombre: 'Coordinadora de Gestión Humana',
      fechaIngreso: '2023-01-10',
      fechaCorteSaldos: fechaCorte,
      salarioBasico: 4200000,
      tipoSalario: 'Ordinario',
      tipoContrato: 'Término indefinido',
      eps: 'Sanitas EPS',
      fondoPensiones: 'Protección',
      arl: 'Sura ARL',
      cajaCompensacion: 'Colsubsidio',
      fondoCesantias: 'Porvenir',
      vacacionesDiasPendientes: 7.0,
      vacacionesValorAcumuladoCOP: 850000,
      provisionMensualVacacionesCOP: Math.round(4200000 * 0.0417),
      cesantiasSaldoAcumuladoCOP: 2850000,
      provisionMensualCesantiasCOP: Math.round(4200000 * 0.0833),
      interesesCesantiasAcumuladoCOP: 342000,
      provisionMensualInteresesCOP: Math.round(4200000 * 0.0833 * 0.12),
      semestrePrimaActual: '1er Semestre (Ene - Jun)',
      primaServiciosBaseSemestreCOP: 4200000,
      diasTrabajadosSemestrePrima: 60,
      primaServiciosValorAcumuladoCOP: 700000,
      provisionMensualPrimaCOP: Math.round(4200000 * 0.0833),
      totalPasivosLaboralesCOP: 850000 + 2850000 + 342000 + 700000,
      totalProvisionMensualPrestacionesCOP: Math.round(4200000 * (0.0417 + 0.0833 + (0.0833 * 0.12) + 0.0833)),
      ingresosLaboralesAcumuladosAnoCOP: 68400000,
      saludAportesAcumuladosAnoCOP: 2736000,
      pensionAportesAcumuladosAnoCOP: 2736000,
      fspAportesAcumuladosAnoCOP: 684000,
      retencionFuenteAcumuladaAnoCOP: 1850000,
      cesantiasPagadasAnoCOP: 2700000,
      prestamoEmpresaSaldoCOP: 0,
      prestamoEmpresaCuotaMensualCOP: 0,
      libranzaSaldoCOP: 2400000,
      libranzaCuotaMensualCOP: 200000,
      embargoJudicialSaldoCOP: 0,
      otrasDeduccionesFijasMensualCOP: 100000,
      observaciones: 'Libranza activa Bancolombia cuota 12/24',
      fechaRegistro: new Date().toISOString(),
      aplicadoEnNomina: true,
      aplicadoEnVacaciones: true
    }
  ];
}
