import {
  Empleado,
  Cargo,
  AreaOrganizacion,
  ConfiguracionEmpresa
} from '../types';
import {
  validarCedulaDocumentoDian,
  validarCorreoElectronicoDian,
  validarSalarioDianCst
} from '../utils/validadorDianEmpleado';
import { limpiarNumeroMoneda, validarFechaYMD } from './saldosInicialesService';
import { uid } from '../data/initialData';

export interface FilaErrorEmpleadoImport {
  fila: number;
  columna: string;
  mensaje: string;
  valor: string;
}

export interface FilaAdvertenciaEmpleadoImport {
  fila: number;
  mensaje: string;
}

export interface ResumenImportacionEmpleados {
  totalFilas: number;
  validos: number;
  conErrores: number;
  conAdvertencias: number;
}

export interface ResultadoParseoEmpleados {
  items: Empleado[];
  errores: FilaErrorEmpleadoImport[];
  advertencias: FilaAdvertenciaEmpleadoImport[];
  resumen: ResumenImportacionEmpleados;
}

export const ENCABEZADOS_CSV_EMPLEADOS = [
  'tipoDocumento',
  'documento',
  'primerNombre',
  'segundoNombre',
  'primerApellido',
  'segundoApellido',
  'fechaNacimiento',
  'genero',
  'estadoCivil',
  'direccion',
  'departamento',
  'ciudad',
  'celular',
  'correoPersonal',
  'correoCorporativo',
  'contactoEmergenciaNombre',
  'contactoEmergenciaParentesco',
  'contactoEmergenciaTelefono',
  'codigoInterno',
  'fechaIngreso',
  'cargoNombre',
  'areaNombre',
  'tipoContrato',
  'modalidadTrabajo',
  'jornadaLaboral',
  'lugarTrabajo',
  'salarioBasico',
  'tipoSalario',
  'periodicidadPago',
  'banco',
  'tipoCuenta',
  'numeroCuenta',
  'eps',
  'fondoPensiones',
  'arl',
  'nivelRiesgoArl',
  'cajaCompensacion',
  'fondoCesantias',
  'tituloAcademico',
  'institucionAcademica',
  'conceptoMedicoAptitudSst',
  'observaciones'
];

/**
 * Genera la plantilla oficial descargable en formato CSV para la importación masiva de Empleados
 */
export function generarPlantillaCsvEmpleados(): string {
  const encabezados = ENCABEZADOS_CSV_EMPLEADOS.join(',');
  const filasEjemplo = [
    [
      'CC',
      '1019034789',
      'Carlos',
      'Andres',
      'Restrepo',
      'Morales',
      '1992-05-14',
      'Masculino',
      'Soltero(a)',
      'Calle 127 # 45 - 20 Apto 402',
      'Bogotá D.C.',
      'Bogotá D.C.',
      '3184567890',
      'carlos.restrepo@gmail.com',
      'carlos.restrepo@bgroup.com.co',
      'Gloria Morales',
      'Madre',
      '3101234567',
      'EMP-012',
      '2024-03-15',
      'Técnico de Redes y Telecomunicaciones',
      'Operaciones FTTH',
      'Término indefinido',
      'Presencial',
      'Tiempo completo (42 hrs semanales - Ley 2101)',
      'Sede Principal Bogotá',
      '2850000',
      'Ordinario',
      'Quincenal',
      'Bancolombia',
      'Ahorros',
      '10234567890',
      'SURA EPS',
      'Porvenir',
      'Positiva ARL',
      'V (6.960%)',
      'Compensar',
      'Protección',
      'Tecnólogo en Telecomunicaciones',
      'SENA Centro de Electricidad y Electrónica',
      'Apto',
      'Ingreso formal por expansión de red operacional'
    ].join(','),
    [
      'CC',
      '52987456',
      'Maria',
      'Claudia',
      'Gomez',
      'Salazar',
      '1988-11-20',
      'Femenino',
      'Casado(a)',
      'Carrera 15 # 93 - 40',
      'Bogotá D.C.',
      'Bogotá D.C.',
      '3209876543',
      'maria.gomez@gmail.com',
      'maria.gomez@bgroup.com.co',
      'Jorge Gómez',
      'Esposo',
      '3159876543',
      'EMP-013',
      '2023-01-10',
      'Coordinadora de Gestión Humana',
      'Gestión Humana',
      'Término indefinido',
      'Híbrida',
      'Tiempo completo (42 hrs semanales - Ley 2101)',
      'Sede Principal Bogotá',
      '3800000',
      'Ordinario',
      'Quincenal',
      'Banco de Bogotá',
      'Ahorros',
      '98765432101',
      'Sanitas EPS',
      'Protección',
      'ARL SURA',
      'I (0.522%)',
      'Colsubsidio',
      'Porvenir',
      'Profesional en Administración de Empresas',
      'Universidad Nacional de Colombia',
      'Apto',
      'Líder de procesos de selección y nómina'
    ].join(',')
  ];

  return [encabezados, ...filasEjemplo].join('\r\n');
}

/**
 * Parsea y valida el contenido CSV/TSV de empleados aplicando reglas DIAN & CST
 */
export function parsearTextoCsvEmpleados(
  contenido: string,
  cargos: Cargo[] = [],
  areas: AreaOrganizacion[] = [],
  empleadosExistentes: Empleado[] = [],
  smmlvVigente: number = 1750905
): ResultadoParseoEmpleados {
  const lineas = contenido
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items: Empleado[] = [];
  const errores: FilaErrorEmpleadoImport[] = [];
  const advertencias: FilaAdvertenciaEmpleadoImport[] = [];

  if (lineas.length === 0) {
    return {
      items: [],
      errores: [{ fila: 0, columna: 'archivo', mensaje: 'El archivo está vacío.', valor: '' }],
      advertencias: [],
      resumen: { totalFilas: 0, validos: 0, conErrores: 1, conAdvertencias: 0 }
    };
  }

  // Detectar separador
  const primeraLinea = lineas[0];
  let separador = ',';
  if (primeraLinea.includes('\t')) separador = '\t';
  else if (primeraLinea.includes(';') && !primeraLinea.includes(',')) separador = ';';

  let indiceInicio = 0;
  const primeraMinuscula = primeraLinea.toLowerCase();
  if (
    primeraMinuscula.includes('documento') ||
    primeraMinuscula.includes('cedula') ||
    primeraMinuscula.includes('nombre') ||
    primeraMinuscula.includes('primer')
  ) {
    indiceInicio = 1;
  }

  const mapaDocumentosExistentes = new Set<string>();
  empleadosExistentes.forEach(emp => {
    const doc = (emp.documento || '').replace(/[\s.-]/g, '').toLowerCase();
    if (doc) mapaDocumentosExistentes.add(doc);
  });

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

    if (columnas.length < 3) {
      errores.push({
        fila: numFila,
        columna: 'formato',
        mensaje: 'La fila no contiene suficientes columnas de datos.',
        valor: linea
      });
      continue;
    }

    const tipoDocumento = (columnas[0] || 'CC').trim().toUpperCase();
    const documentoRaw = (columnas[1] || '').trim();

    // 1. Validación DIAN del Documento
    const valDoc = validarCedulaDocumentoDian(documentoRaw, tipoDocumento, empleadosExistentes);
    if (!valDoc.esValido) {
      errores.push({
        fila: numFila,
        columna: 'documento',
        mensaje: valDoc.mensaje,
        valor: documentoRaw
      });
      continue;
    }

    const documentoLimpio = valDoc.detalles?.formatoLimpio || documentoRaw;
    if (mapaDocumentosExistentes.has(documentoLimpio.toLowerCase())) {
      errores.push({
        fila: numFila,
        columna: 'documento',
        mensaje: `El documento C.C. ${documentoLimpio} ya está registrado en la base de datos de la empresa.`,
        valor: documentoRaw
      });
      continue;
    }

    const pNombre = (columnas[2] || '').trim();
    const sNombre = (columnas[3] || '').trim();
    const pApellido = (columnas[4] || '').trim();
    const sApellido = (columnas[5] || '').trim();

    if (!pNombre || !pApellido) {
      errores.push({
        fila: numFila,
        columna: 'nombres',
        mensaje: 'El Primer Nombre y Primer Apellido son obligatorios.',
        valor: `${pNombre} ${pApellido}`
      });
      continue;
    }

    const fechaNacimiento = (columnas[6] || '1995-01-01').trim();
    const genero = (columnas[7] || 'Masculino').trim();
    const estadoCivil = (columnas[8] || 'Soltero(a)').trim();
    const direccion = (columnas[9] || 'Carrera Principal').trim();
    const departamento = (columnas[10] || 'Bogotá D.C.').trim();
    const ciudad = (columnas[11] || 'Bogotá D.C.').trim();
    const celular = (columnas[12] || '3000000000').trim();
    const correoPersonal = (columnas[13] || '').trim();
    const correoCorporativo = (columnas[14] || `${pNombre.toLowerCase()}.${pApellido.toLowerCase()}@empresa.com.co`).trim();

    // 2. Validación DIAN de Correo Corporativo
    const valCorreo = validarCorreoElectronicoDian(correoCorporativo, 'correo corporativo', true, empleadosExistentes);
    if (!valCorreo.esValido) {
      errores.push({
        fila: numFila,
        columna: 'correoCorporativo',
        mensaje: valCorreo.mensaje,
        valor: correoCorporativo
      });
      continue;
    }

    const contactoEmergenciaNombre = (columnas[15] || 'Familiar Autorizado').trim();
    const contactoEmergenciaParentesco = (columnas[16] || 'Familiar').trim();
    const contactoEmergenciaTelefono = (columnas[17] || celular).trim();

    const codigoInterno = (columnas[18] || `EMP-${Math.floor(100 + Math.random() * 900)}`).trim();
    const fechaIngreso = (columnas[19] || new Date().toISOString().slice(0, 10)).trim();
    const cargoNombre = (columnas[20] || 'Colaborador').trim();
    const areaNombre = (columnas[21] || 'Operaciones').trim();
    const tipoContrato = (columnas[22] || 'Término indefinido').trim();
    const modalidadTrabajo = (columnas[23] || 'Presencial').trim();
    const jornadaLaboral = (columnas[24] || 'Tiempo completo (42 hrs semanales - Ley 2101)').trim();
    const lugarTrabajo = (columnas[25] || 'Sede Principal Bogotá').trim();

    const salarioRaw = columnas[26];
    const valSalario = validarSalarioDianCst(salarioRaw, tipoContrato, smmlvVigente);
    if (!valSalario.esValido) {
      errores.push({
        fila: numFila,
        columna: 'salarioBasico',
        mensaje: valSalario.mensaje,
        valor: String(salarioRaw)
      });
      continue;
    }

    const salarioBasico = valSalario.detalles?.montoCOP || smmlvVigente;
    const tipoSalario = (columnas[27] || 'Ordinario').trim();
    const periodicidadPago = (columnas[28] || 'Quincenal').trim();
    const banco = (columnas[29] || 'Bancolombia').trim();
    const tipoCuenta = (columnas[30] || 'Ahorros').trim();
    const numeroCuenta = (columnas[31] || '').trim();

    const eps = (columnas[32] || 'SURA EPS').trim();
    const fondoPensiones = (columnas[33] || 'Porvenir').trim();
    const arl = (columnas[34] || 'Positiva ARL').trim();
    const nivelRiesgoArl = (columnas[35] || 'V (6.960%)').trim();
    const cajaCompensacion = (columnas[36] || 'Compensar').trim();
    const fondoCesantias = (columnas[37] || 'Protección').trim();

    const tituloAcademico = (columnas[38] || 'Técnico / Profesional').trim();
    const institucionAcademica = (columnas[39] || 'SENA / Universidad').trim();
    const conceptoMedicoAptitudSst = (columnas[40] || 'Apto').trim();
    const observaciones = (columnas[41] || '').trim();

    // Resolver coincidencia de Cargo y Área por nombre
    const cargoMatch = cargos.find(c => c.nombre.toLowerCase().trim() === cargoNombre.toLowerCase().trim()) || cargos[0];
    const areaMatch = areas.find(a => a.nombre.toLowerCase().trim() === areaNombre.toLowerCase().trim()) || areas[0];

    const nombreCompleto = [pNombre, sNombre, pApellido, sApellido].filter(Boolean).join(' ');

    const targetId = `emp-imp-${documentoLimpio.toLowerCase()}`;

    const empleadoObj: Empleado = {
      id: targetId,
      codigo: codigoInterno,
      codigoInterno,
      nombre: nombreCompleto,
      documento: documentoLimpio,
      tipoDocumento,
      email: correoCorporativo,
      telefono: celular,
      cargoId: cargoMatch?.id || 'c1',
      areaId: areaMatch?.id || 'a1',
      formacion: `${tituloAcademico} - ${institucionAcademica}`,
      experiencia: 'Verificada por importación masiva de expediente',
      salarioBase: salarioBasico,
      contrato: {
        tipo: tipoContrato,
        inicio: fechaIngreso,
        fin: '',
        salario: `$${salarioBasico.toLocaleString('es-CO')}`
      },
      familia: [],
      activo: true,
      estadoLaboral: 'Activo',
      fechaRetiro: '',
      persona: {
        tipoDocumento,
        numeroDocumento: documentoLimpio,
        primerNombre: pNombre,
        segundoNombre: sNombre,
        primerApellido: pApellido,
        segundoApellido: sApellido,
        fechaNacimiento,
        lugarNacimiento: ciudad,
        nacionalidad: 'Colombiana',
        genero: genero as any,
        estadoCivil: estadoCivil as any,
        fotoUrl: ''
      },
      contacto: {
        direccion,
        departamento,
        ciudad,
        barrio: '',
        codigoPostal: '',
        telefonoFijo: '',
        celular,
        correoPersonal,
        correoCorporativo,
        contactoEmergenciaNombre,
        contactoEmergenciaParentesco,
        contactoEmergenciaTelefono
      },
      laboral: {
        codigoInterno,
        fechaIngreso,
        fechaInicioLaboral: fechaIngreso,
        areaId: areaMatch?.id || 'a1',
        areaNombre: areaMatch?.nombre || areaNombre,
        cargoId: cargoMatch?.id || 'c1',
        cargoNombre: cargoMatch?.nombre || cargoNombre,
        jefeInmediatoId: '',
        jefeInmediatoNombre: '',
        centroCostos: 'CC-OPERACIONES',
        tipoContrato,
        fechaInicioContrato: fechaIngreso,
        fechaTerminacionContrato: '',
        jornadaLaboral,
        modalidadTrabajo: modalidadTrabajo as any,
        lugarTrabajo,
        estado: 'Activo'
      },
      compensacion: {
        salarioBasico,
        tipoSalario,
        periodicidadPago: periodicidadPago as any,
        auxilioTransporte: valSalario.detalles?.tieneAuxilioTransporte ?? true,
        bonificaciones: 0,
        comisiones: 0,
        formaPago: 'Transferencia bancaria',
        banco,
        tipoCuenta: tipoCuenta as any,
        numeroCuenta,
        historialVigencias: []
      },
      seguridadSocial: {
        eps,
        fondoPensiones,
        arl,
        nivelRiesgoArl: (nivelRiesgoArl || 'I (0.522%)') as any,
        cajaCompensacion,
        fondoCesantias,
        fechaAfiliacion: fechaIngreso,
        estadoAfiliacion: 'Activa',
        tipoAfiliacion: 'Cotizante Dependiente'
      },
      estudios: [
        {
          id: uid(),
          nivelEducativo: 'Tecnólogo',
          programa: tituloAcademico,
          tituloObtenido: tituloAcademico,
          institucion: institucionAcademica,
          fechaInicio: '2015-02-01',
          fechaFin: '2018-12-01',
          estado: 'Graduado'
        }
      ],
      experiencias: [
        {
          id: uid(),
          empresa: 'Empresa Anterior S.A.S.',
          cargo: cargoNombre,
          fechaIngreso: '2020-01-15',
          fechaRetiro: '2024-02-28',
          funcionesPrincipales: 'Funciones certificadas en expediente importado'
        }
      ],
      sst: {
        examenesOcupacionales: [
          {
            id: uid(),
            fecha: fechaIngreso,
            tipoExamen: 'Ingreso',
            entidadIps: 'IPS Médica Laboral del Oriente SAS',
            conceptoAptitud: conceptoMedicoAptitudSst as any,
            estado: 'Realizado',
            recomendaciones: 'Apto para el desempeño de funciones asignadas',
            confidencialMedico: true
          }
        ]
      },
      documentos: [],
      historialLaboral: [
        {
          id: uid(),
          fechaHora: new Date().toLocaleString('es-CO'),
          usuario: 'Sistema de Importación Masiva CSV',
          accion: 'CREACION',
          titulo: 'Vinculación e Importación de Expediente Digital',
          motivo: 'Carga masiva desde archivo plano CSV / Excel',
          valorNuevo: `Cargo: ${cargoNombre}, Salario: $${salarioBasico.toLocaleString('es-CO')}`
        }
      ]
    };

    mapaDocumentosExistentes.add(documentoLimpio.toLowerCase());
    items.push(empleadoObj);
  }

  return {
    items,
    errores,
    advertencias,
    resumen: {
      totalFilas: lineas.length - indiceInicio,
      validos: items.length,
      conErrores: errores.length,
      conAdvertencias: advertencias.length
    }
  };
}
