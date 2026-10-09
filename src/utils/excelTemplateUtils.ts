import * as XLSX from 'xlsx';
import { ClienteComercial } from '../types';

/**
 * Genera y descarga directamente la plantilla oficial de subida masiva de saldos en formato Microsoft Excel (.xlsx)
 */
export const descargarPlantillaExcelSaldos = (): void => {
  const encabezados = [
    'codigo',
    'identificacion',
    'tipo_documento',
    'nombre',
    'direccion',
    'ciudad',
    'telefono',
    'email',
    'plan_servicio',
    'saldo_pendiente',
    'fecha_vencimiento'
  ];

  const filasEjemplo = [
    [
      'CLI-2026-101',
      '901558231-1',
      'NIT',
      'Soluciones Tecnológicas Alfa S.A.S.',
      'Calle 100 # 19-61',
      'Bogotá D.C.',
      '3124567890',
      'pagos@alfa.com.co',
      'Fibra 300 Mbps Dedicado',
      450000,
      '2026-10-25'
    ],
    [
      'CLI-2026-102',
      '1018456789',
      'CC',
      'María Paula Gómez Martínez',
      'Carrera 7 # 128-40',
      'Bogotá D.C.',
      '3156789012',
      'maria.gomez@gmail.com',
      'Internet Residencial 200 Mbps',
      120000,
      '2026-10-18'
    ],
    [
      'CLI-2026-103',
      '800123999-5',
      'NIT',
      'Inversiones del Centro Ltda.',
      'Av. Carrera 68 # 45-12',
      'Bogotá D.C.',
      '3201234567',
      'cartera@inversionescentro.co',
      'Troncal SIP + Fibra 500 Mbps',
      1100000,
      '2026-10-30'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([encabezados, ...filasEjemplo]);

  // Definir anchos de columna óptimos para Excel
  ws['!cols'] = [
    { wch: 16 }, // codigo
    { wch: 18 }, // identificacion
    { wch: 16 }, // tipo_documento
    { wch: 38 }, // nombre
    { wch: 28 }, // direccion
    { wch: 16 }, // ciudad
    { wch: 16 }, // telefono
    { wch: 30 }, // email
    { wch: 32 }, // plan_servicio
    { wch: 18 }, // saldo_pendiente
    { wch: 20 }  // fecha_vencimiento
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Saldos');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Plantilla_Subida_Masiva_Saldos_Cimiento.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parsea un ArrayBuffer o matriz de datos proveniente de un archivo Excel (.xlsx / .xls)
 */
export const parsearExcelSaldos = (
  buffer: ArrayBuffer
): { clientes: ClienteComercial[]; errores: string[] } => {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const primerNombreHoja = workbook.SheetNames[0];

  if (!primerNombreHoja) {
    return { clientes: [], errores: ['El archivo Excel no contiene hojas de cálculo disponibles.'] };
  }

  const hoja = workbook.Sheets[primerNombreHoja];
  const filasMatriz = XLSX.utils.sheet_to_json<any[]>(hoja, { header: 1 });

  return procesarFilasMatrizSaldos(filasMatriz);
};

/**
 * Convierte filas bidimensionales de Excel a objetos ClienteComercial con validaciones
 */
export const procesarFilasMatrizSaldos = (
  filas: any[][]
): { clientes: ClienteComercial[]; errores: string[] } => {
  if (!filas || filas.length === 0) {
    return { clientes: [], errores: ['La hoja de cálculo está vacía.'] };
  }

  // Filtrar filas completamente vacías
  const filasValidas = filas.filter(f => f && f.some(celda => celda !== null && celda !== undefined && String(celda).trim() !== ''));

  if (filasValidas.length === 0) {
    return { clientes: [], errores: ['No se detectaron filas con datos válidos en la hoja.'] };
  }

  // Detectar si la primera fila es encabezado
  const primeraFila = filasValidas[0].map(c => String(c || '').toLowerCase().trim());
  const esEncabezado = primeraFila.some(c =>
    c.includes('nombre') || c.includes('identificacion') || c.includes('saldo') || c.includes('codigo') || c.includes('documento')
  );

  const filasAProcesar = esEncabezado ? filasValidas.slice(1) : filasValidas;
  const clientes: ClienteComercial[] = [];
  const errores: string[] = [];

  filasAProcesar.forEach((fila, idx) => {
    const numFila = esEncabezado ? idx + 2 : idx + 1;

    // Obtener valores limpios
    const codigo = String(fila[0] || '').trim() || `CLI-${Date.now()}-${idx}`;
    const identificacion = String(fila[1] || '').trim();
    const tipoDocRaw = String(fila[2] || '').trim().toUpperCase();
    const tipoIdentificacion: 'CC' | 'NIT' = tipoDocRaw === 'NIT' ? 'NIT' : 'CC';
    const nombre = String(fila[3] || '').trim();
    const direccion = String(fila[4] || '').trim() || 'No registrada';
    const ciudad = String(fila[5] || '').trim() || 'Bogotá D.C.';
    const telefono = String(fila[6] || '').trim();
    const email = String(fila[7] || '').trim();
    const planServicio = String(fila[8] || '').trim() || 'Servicio de Telecomunicaciones';
    
    // Parseo de saldo seguro
    const saldoRaw = fila[9];
    let saldoPendiente = 0;
    if (typeof saldoRaw === 'number') {
      saldoPendiente = Math.max(0, saldoRaw);
    } else if (saldoRaw !== undefined && saldoRaw !== null) {
      saldoPendiente = Math.max(0, Number(String(saldoRaw).replace(/[^0-9.-]/g, '')) || 0);
    }

    // Fecha de vencimiento
    let fechaVencimiento = String(fila[10] || '').trim();
    if (!fechaVencimiento) {
      fechaVencimiento = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    } else if (typeof fila[10] === 'number') {
      // Manejar fecha serial de Excel
      try {
        const fechaObj = XLSX.SSF.parse_date_code(fila[10]);
        if (fechaObj) {
          fechaVencimiento = `${fechaObj.y}-${String(fechaObj.m).padStart(2, '0')}-${String(fechaObj.d).padStart(2, '0')}`;
        }
      } catch {
        fechaVencimiento = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      }
    }

    if (!identificacion) {
      errores.push(`Fila ${numFila}: La identificación o NIT del cliente está vacía.`);
      return;
    }

    if (!nombre) {
      errores.push(`Fila ${numFila}: El nombre o razón social del cliente está vacío.`);
      return;
    }

    clientes.push({
      id: 'cli-imp-' + Math.random().toString(36).substring(2, 9),
      codigo,
      nombre,
      identificacion,
      tipoIdentificacion,
      direccion,
      ciudad,
      telefono,
      email,
      planServicio,
      saldoPendiente,
      fechaVencimiento,
      estado: saldoPendiente > 0 ? 'En mora' : 'Al día',
      fechaCreacion: new Date().toISOString()
    });
  });

  return { clientes, errores };
};

/**
 * Genera y descarga directamente la plantilla oficial para Importación Masiva de Colaboradores en formato Excel (.xlsx)
 */
export const descargarPlantillaExcelEmpleados = (): void => {
  const encabezados = [
    'tipoDocumento', 'numeroDocumento', 'primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido',
    'fechaNacimiento', 'genero', 'estadoCivil', 'direccionResidencia', 'ciudadResidencia', 'departamentoResidencia',
    'telefonoMovil', 'correoPersonal', 'correoCorporativo', 'contactoEmergenciaNombre', 'contactoEmergenciaParentesco',
    'contactoEmergenciaTelefono', 'codigoEmpleado', 'fechaIngreso', 'cargo', 'area', 'tipoContrato', 'modalidadTrabajo',
    'jornadaLaboral', 'sedeTrabajo', 'salarioBase', 'tipoSalario', 'periodoNomina', 'banco', 'tipoCuenta', 'numeroCuenta',
    'eps', 'fondoPensiones', 'arl', 'claseRiesgoArl', 'cajaCompensacion', 'fondoCesantias', 'tituloAcademico',
    'institucionAcademica', 'conceptoMedicoAptitudSst', 'observaciones'
  ];

  const filaEjemplo = [
    'CC', '1019034789', 'Carlos', 'Andres', 'Restrepo', 'Morales',
    '1992-05-14', 'Masculino', 'Soltero(a)', 'Calle 127 # 45 - 20 Apto 402', 'Bogotá D.C.', 'Bogotá D.C.',
    '3184567890', 'carlos.restrepo@gmail.com', 'carlos.restrepo@bgroup.com.co', 'Gloria Morales', 'Madre',
    '3101234567', 'EMP-012', '2024-03-15', 'Técnico de Redes y Telecomunicaciones', 'Operaciones FTTH', 'Término indefinido', 'Presencial',
    'Tiempo completo (42 hrs)', 'Sede Principal Bogotá', 2850000, 'Ordinario', 'Quincenal', 'Bancolombia', 'Ahorros', '10234567890',
    'SURA EPS', 'Porvenir', 'Positiva ARL', 'V (6.960%)', 'Compensar', 'Protección', 'Tecnólogo en Telecomunicaciones',
    'SENA', 'Apto', 'Ingreso formal por expansión de red operacional'
  ];

  const ws = XLSX.utils.aoa_to_sheet([encabezados, filaEjemplo]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Colaboradores');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Plantilla_Importacion_Colaboradores_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Genera y descarga directamente la plantilla oficial de Saldos Iniciales de Nómina en formato Excel (.xlsx)
 */
export const descargarPlantillaExcelSaldosNomina = (): void => {
  const encabezados = [
    'numeroDocumento', 'nombreCompleto', 'cargo', 'fechaIngreso', 'fechaCorteSaldos', 'salarioBase', 'tipoSalario',
    'tipoContrato', 'eps', 'afp', 'arl', 'ccf', 'fondoCesantias', 'diasVacacionesPendientes', 'valorConsolidadoVacaciones',
    'valorConsolidadoCesantias', 'valorConsolidadoInteresesCesantias', 'valorConsolidadoPrima', 'mesesAcumuladosPrima',
    'baseSalarioPromedioVariable', 'saldoPrestamosEmpresa', 'saldoLibranzas', 'saldoEmbargosJudiciales', 'cuotaMensualPrestamo',
    'saldoFondoAhorroEmpleado', 'saldoRetencionFuenteAcumulada', 'baseGravableAcumuladaAño', 'diasIncapacidadAcumuladosAño',
    'ibcPromedioUltimoTrimestre', 'retencionAporteVoluntarioPension', 'retencionAfcAhorroVivienda', 'anticipoNominaVigente',
    'saldoHorasExtrasPendientesLiquidar', 'saldoBonificacionesNoSalariales', 'saldoViaticosPendientesLegalizar', 'observacionesAuditoria'
  ];

  const filaEjemplo = [
    '1020892411', 'Carlos Andres Restrepo', 'Tecnico de Redes y Operaciones ISP', '2024-03-15', '2026-02-28', 2850000, 'Ordinario',
    'Término indefinido', 'SURA EPS', 'Porvenir', 'Positiva ARL', 'Compensar', 'Protección', 18.5, 1285000,
    1750905, 210108, 875452, 60,
    42500000, 1700000, 1700000, 0, 250000,
    1600000, 0, 0, 0,
    1200000, 150000, 0, 0,
    0, 0, 50000, 'Corte de saldos iniciales empalme contable'
  ];

  const ws = XLSX.utils.aoa_to_sheet([encabezados, filaEjemplo]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Saldos_Nomina');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Plantilla_Saldos_Iniciales_Nomina_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

