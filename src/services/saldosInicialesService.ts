import { Empleado, SaldoInicialEmpleadoNomina, NovedadNominaEmpleado } from '../types';

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
  totalCarteraPrestamosCOP: number;
  totalIngresosAcumuladosAnoCOP: number;
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
  'prestamoEmpresaSaldoCOP',
  'prestamoEmpresaCuotaMensualCOP',
  'libranzaSaldoCOP',
  'libranzaCuotaMensualCOP',
  'embargoJudicialSaldoCOP',
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

  // Si tiene formato latino $ 1.500.000,00 o anglosajón 1,500,000.00
  let limpio = str.replace(/[$\s]/g, '');
  
  // Si contiene tanto punto como coma, determinar cuál es decimal
  if (limpio.includes('.') && limpio.includes(',')) {
    const ultimoPunto = limpio.lastIndexOf('.');
    const ultimaComa = limpio.lastIndexOf(',');
    if (ultimaComa > ultimoPunto) {
      // 1.500.000,50 -> formato colombiano
      limpio = limpio.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,500,000.50 -> formato americano
      limpio = limpio.replace(/,/g, '');
    }
  } else if (limpio.includes(',')) {
    // Si solo tiene coma y tiene 1 o 2 decimales al final: 1200,50 -> 1200.50
    // Si tiene 3 dígitos después de la coma: 1,500 o 25,000 -> 1500 / 25000
    const partes = limpio.split(',');
    if (partes.length === 2 && partes[1].length <= 2) {
      limpio = partes[0] + '.' + partes[1];
    } else {
      limpio = limpio.replace(/,/g, '');
    }
  } else if (limpio.includes('.')) {
    // Si solo tiene puntos, verificar si es separador de miles colombiano (ej. 1.750.000)
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
 * Genera la plantilla oficial descargable en formato CSV
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
      '1200000',
      '150000',
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
      '0',
      '0',
      '2400000',
      '200000',
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
        totalCarteraPrestamosCOP: 0,
        totalIngresosAcumuladosAnoCOP: 0
      }
    };
  }

  // Detectar separador (tabulación para Excel copy-paste, coma o punto y coma para CSV)
  const primeraLinea = lineas[0];
  let separador = ',';
  if (primeraLinea.includes('\t')) {
    separador = '\t';
  } else if (primeraLinea.includes(';') && !primeraLinea.includes(',')) {
    separador = ';';
  }

  // Verificar si la primera fila es encabezado
  let indiceInicio = 0;
  const primeraFilaMinuscula = primeraLinea.toLowerCase();
  if (
    primeraFilaMinuscula.includes('documento') ||
    primeraFilaMinuscula.includes('cedula') ||
    primeraFilaMinuscula.includes('nombre') ||
    primeraFilaMinuscula.includes('vacacion')
  ) {
    indiceInicio = 1;
  }

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
    
    // Separar columnas respetando comillas
    let columnas: string[] = [];
    if (separador === '\t') {
      columnas = linea.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
    } else {
      // Regex para CSV respetando comillas
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

    const documentoRaw = (columnas[0] || '').trim();
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
    const nombreCompleto = (columnas[1] || '').trim() || empCoincidente?.nombre || `Colaborador Doc. ${documentoRaw}`;
    const cargoNombre = (columnas[2] || '').trim() || empCoincidente?.laboral?.cargoNombre || empCoincidente?.cargoId || 'Colaborador';
    
    let fechaIngreso = (columnas[3] || '').trim() || empCoincidente?.laboral?.fechaIngreso || empCoincidente?.contrato?.inicio || '';
    if (fechaIngreso && !validarFechaYMD(fechaIngreso)) {
      advertencias.push({
        fila: numFila,
        mensaje: `Formato de fecha de ingreso "${fechaIngreso}" dudoso. Se recomienda AAAA-MM-DD.`
      });
    }

    let fechaCorteSaldos = (columnas[4] || '').trim() || fechaCorteDefault;
    if (!validarFechaYMD(fechaCorteSaldos)) {
      fechaCorteSaldos = fechaCorteDefault;
    }

    // 1. Prestaciones y pasivos
    const vacacionesDias = limpiarNumeroMoneda(columnas[5]);
    const vacacionesCOP = limpiarNumeroMoneda(columnas[6]);
    const cesantiasCOP = limpiarNumeroMoneda(columnas[7]);
    const interesesCesantiasCOP = limpiarNumeroMoneda(columnas[8]);
    const primaServiciosCOP = limpiarNumeroMoneda(columnas[9]);
    const diasPrima = parseInt(columnas[10] || '180', 10) || 180;

    // 2. Acumulados tributarios y DIAN
    const ingresosAno = limpiarNumeroMoneda(columnas[11]);
    const saludAno = limpiarNumeroMoneda(columnas[12]);
    const pensionAno = limpiarNumeroMoneda(columnas[13]);
    const fspAno = limpiarNumeroMoneda(columnas[14]);
    const retencionAno = limpiarNumeroMoneda(columnas[15]);
    const cesantiasPagadasAno = limpiarNumeroMoneda(columnas[16]);

    // 3. Préstamos y deducciones
    const prestamoSaldo = limpiarNumeroMoneda(columnas[17]);
    const prestamoCuota = limpiarNumeroMoneda(columnas[18]);
    const libranzaSaldo = limpiarNumeroMoneda(columnas[19]);
    const libranzaCuota = limpiarNumeroMoneda(columnas[20]);
    const embargoSaldo = limpiarNumeroMoneda(columnas[21]);
    const otrasDeduccionesFijas = limpiarNumeroMoneda(columnas[22]);

    const observaciones = (columnas[23] || '').trim();

    if (!empCoincidente) {
      advertencias.push({
        fila: numFila,
        mensaje: `El documento ${documentoRaw} (${nombreCompleto}) no se encuentra en el censo activo de colaboradores. Se creará como saldo referencial.`
      });
    }

    const itemSaldo: SaldoInicialEmpleadoNomina = {
      id: `saldo-${documentoLimpio.toLowerCase()}`,
      empleadoId: empCoincidente?.id,
      documento: documentoRaw,
      nombreCompleto,
      cargoNombre,
      fechaIngreso: fechaIngreso || undefined,
      fechaCorteSaldos,

      vacacionesDiasPendientes: vacacionesDias,
      vacacionesValorAcumuladoCOP: vacacionesCOP,
      cesantiasSaldoAcumuladoCOP: cesantiasCOP,
      interesesCesantiasAcumuladoCOP: interesesCesantiasCOP,
      primaServiciosBaseSemestreCOP: primaServiciosCOP,
      diasTrabajadosSemestrePrima: diasPrima,

      ingresosLaboralesAcumuladosAnoCOP: ingresosAno,
      saludAportesAcumuladosAnoCOP: saludAno,
      pensionAportesAcumuladosAnoCOP: pensionAno,
      fspAportesAcumuladosAnoCOP: fspAno,
      retencionFuenteAcumuladaAnoCOP: retencionAno,
      cesantiasPagadasAnoCOP: cesantiasPagadasAno,

      prestamoEmpresaSaldoCOP: prestamoSaldo,
      prestamoEmpresaCuotaMensualCOP: prestamoCuota,
      libranzaSaldoCOP: libranzaSaldo,
      libranzaCuotaMensualCOP: libranzaCuota,
      embargoJudicialSaldoCOP: embargoSaldo,
      otrasDeduccionesFijasMensualCOP: otrasDeduccionesFijas,

      observaciones: observaciones || undefined,
      fechaRegistro: new Date().toISOString(),
      aplicadoEnNomina: false,
      aplicadoEnVacaciones: false
    };

    items.push(itemSaldo);
  }

  // Calcular métricas del resumen consolidado
  const totalPasivosCOP = items.reduce((acc, curr) => {
    return acc + curr.vacacionesValorAcumuladoCOP + curr.cesantiasSaldoAcumuladoCOP + curr.interesesCesantiasAcumuladoCOP + curr.primaServiciosBaseSemestreCOP;
  }, 0);

  const totalDiasVacaciones = items.reduce((acc, curr) => acc + curr.vacacionesDiasPendientes, 0);
  const totalCarteraPrestamosCOP = items.reduce((acc, curr) => acc + curr.prestamoEmpresaSaldoCOP + curr.libranzaSaldoCOP + curr.embargoJudicialSaldoCOP, 0);
  const totalIngresosAcumuladosAnoCOP = items.reduce((acc, curr) => acc + curr.ingresosLaboralesAcumuladosAnoCOP, 0);

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
      totalCarteraPrestamosCOP,
      totalIngresosAcumuladosAnoCOP
    }
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
    if (s.empleadoId) {
      const cuotaTotalPrestamos = s.prestamoEmpresaCuotaMensualCOP + s.libranzaCuotaMensualCOP + s.embargoJudicialSaldoCOP + s.otrasDeduccionesFijasMensualCOP;
      if (cuotaTotalPrestamos > 0) {
        novedadesMap[s.empleadoId] = {
          prestamosYDeducciones: cuotaTotalPrestamos,
          otrasDeduccionesTexto: [
            s.prestamoEmpresaCuotaMensualCOP > 0 ? `Préstamo: $${s.prestamoEmpresaCuotaMensualCOP.toLocaleString('es-CO')}` : null,
            s.libranzaCuotaMensualCOP > 0 ? `Libranza: $${s.libranzaCuotaMensualCOP.toLocaleString('es-CO')}` : null,
            s.embargoJudicialSaldoCOP > 0 ? `Embargo: $${s.embargoJudicialSaldoCOP.toLocaleString('es-CO')}` : null,
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
      const salarioBase = emp.compensacion?.salarioBasico || emp.salarioBase || 2000000;
      const docLimpio = (emp.documento || `102089241${idx}`).replace(/[^0-9a-zA-Z]/g, '');
      const diasVac = [12.5, 6, 18, 0, 7.5, 15][idx % 6];
      const vacCOP = Math.round((salarioBase / 30) * diasVac);
      const cesCOP = Math.round((salarioBase / 360) * 180);
      const intCesCOP = Math.round((cesCOP * 0.12 * 180) / 360);
      const primaCOP = Math.round((salarioBase / 360) * 60);

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

        vacacionesDiasPendientes: diasVac,
        vacacionesValorAcumuladoCOP: vacCOP,
        cesantiasSaldoAcumuladoCOP: cesCOP,
        interesesCesantiasAcumuladoCOP: intCesCOP,
        primaServiciosBaseSemestreCOP: primaCOP,
        diasTrabajadosSemestrePrima: 60,

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
        otrasDeduccionesFijasMensualCOP: idx === 1 ? 50000 : 0,

        observaciones: `Corte contable de empalme histórico a ${fechaCorte}`,
        fechaRegistro: new Date().toISOString(),
        aplicadoEnNomina: true,
        aplicadoEnVacaciones: true
      };
    });
  }

  // Fallback si no hay empleados
  return [
    {
      id: 'saldo-1020892411',
      documento: '1020892411',
      nombreCompleto: 'Carlos Andrés Restrepo Morales',
      cargoNombre: 'Técnico de Redes y Telecomunicaciones',
      fechaIngreso: '2024-03-15',
      fechaCorteSaldos: fechaCorte,
      vacacionesDiasPendientes: 18.5,
      vacacionesValorAcumuladoCOP: 1285000,
      cesantiasSaldoAcumuladoCOP: 1750905,
      interesesCesantiasAcumuladoCOP: 210108,
      primaServiciosBaseSemestreCOP: 875452,
      diasTrabajadosSemestrePrima: 60,
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
      vacacionesDiasPendientes: 7.0,
      vacacionesValorAcumuladoCOP: 850000,
      cesantiasSaldoAcumuladoCOP: 2850000,
      interesesCesantiasAcumuladoCOP: 342000,
      primaServiciosBaseSemestreCOP: 1425000,
      diasTrabajadosSemestrePrima: 60,
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
