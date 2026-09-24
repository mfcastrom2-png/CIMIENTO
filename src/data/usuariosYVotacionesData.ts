import {
  ControlVacacionesEmpleado,
  LogAuditoriaUsuario,
  ProcesoVotacionSST,
  SolicitudVacacionDetalle,
  UsuarioSistema
} from '../types';

export const MODULOS_SISTEMA = [
  { id: 'dashboard', nombre: 'Tablero de Control', descripcion: 'Métricas generales, KPIs y accesos rápidos' },
  { id: 'estructura', nombre: 'Estructura Organizacional', descripcion: 'Organigrama, áreas y dependencias jerárquicas' },
  { id: 'cargos', nombre: 'Manual de Cargos', descripcion: 'Fichas técnicas, perfiles, requisitos y competencias' },
  { id: 'empleados', nombre: 'Personas & Personal', descripcion: 'Hojas de vida, contratos, datos sociodemográficos' },
  { id: 'evaluaciones', nombre: 'Evaluaciones de Desempeño', descripcion: 'Modelo de 100 pts, resultados, competencias y planes de desarrollo' },
  { id: 'solicitudes', nombre: 'Solicitudes y Permisos', descripcion: 'Trámite y aprobación de permisos, licencias y certificados' },
  { id: 'capacitaciones', nombre: 'Capacitaciones y Exámenes', descripcion: 'Plan anual, asistencia y evaluación técnica con certificados' },
  { id: 'sst', nombre: 'SG-SST (Res. 0312/19 & Votaciones)', descripcion: '21 estándares, GTC 45, comités y elecciones de COPASST / Convivencia' },
  { id: 'epps', nombre: 'Almacén & Inventario de EPPs', descripcion: 'Control de dotaciones, stock mínimo, entregas y actas Res. 2400' },
  { id: 'nomina', nombre: 'Nómina & Novedades CST', descripcion: 'Liquidación salarial, novedades, parafiscales y vacaciones' },
  { id: 'usuarios', nombre: 'Gestión de Usuarios', descripcion: 'Administración de cuentas, roles, permisos y auditoría de accesos' },
  { id: 'documentos', nombre: 'Documentos y Salidas', descripcion: 'Generación y descarga de constancias, minutas y reportes oficiales' }
];

export const INITIAL_USUARIOS_SISTEMA: UsuarioSistema[] = [
  {
    id: 'usr-admin-principal',
    nombre: 'Super Administrador',
    documento: 'NIT 900.995.99-2',
    email: 'superadmin@test-cimiento.com',
    rol: 'superadmin',
    cargoNombre: 'Gerencia General & Dirección GH',
    estado: 'activo',
    ultimoAcceso: '2026-09-15 12:40',
    fechaCreacion: '2026-01-01',
    dobleFactorHabilitado: true,
    permisos: [
      'dashboard', 'estructura', 'cargos', 'empleados', 'evaluaciones',
      'solicitudes', 'capacitaciones', 'sst', 'epps', 'nomina', 'usuarios', 'documentos'
    ]
  }
];

export const CUENTAS_PRUEBA_OFICIALES = [
  {
    email: 'superadmin@test-cimiento.com',
    pass: 'Cimiento2026*!',
    nombre: 'Super Administrador Global',
    rol: 'superadmin' as const,
    empresaId: 'empresa-a',
    documento: '10.000.001',
    permisos: [
      'dashboard',
      'empleados',
      'cargos',
      'estructura',
      'evaluaciones',
      'solicitudes',
      'nomina',
      'parametros-nomina',
      'sst',
      'epps',
      'capacitaciones',
      'vacaciones',
      'votaciones-sst',
      'usuarios',
      'documentos'
    ]
  },
  {
    email: 'admin-a@test-cimiento.com',
    pass: 'Cimiento2026*!',
    nombre: 'Administrador Empresa A',
    rol: 'admin_gh' as const,
    empresaId: 'empresa-a',
    documento: '10.000.002',
    permisos: [
      'dashboard',
      'empleados',
      'cargos',
      'estructura',
      'evaluaciones',
      'solicitudes',
      'nomina',
      'sst',
      'epps',
      'capacitaciones',
      'vacaciones',
      'votaciones-sst',
      'usuarios',
      'documentos'
    ]
  },
  {
    email: 'sst-a@test-cimiento.com',
    pass: 'Cimiento2026*!',
    nombre: 'Responsable SST Empresa A',
    rol: 'responsable_sst' as const,
    empresaId: 'empresa-a',
    documento: '10.000.003',
    permisos: [
      'dashboard',
      'sst',
      'epps',
      'capacitaciones',
      'votaciones-sst',
      'empleados'
    ]
  },
  {
    email: 'empleado-a@test-cimiento.com',
    pass: 'Cimiento2026*!',
    nombre: 'Carlos Mendoza (Empresa A)',
    rol: 'empleado' as const,
    empresaId: 'empresa-a',
    empleadoId: 'empleado-a-001',
    documento: '10.000.004',
    permisos: ['dashboard', 'solicitudes', 'capacitaciones']
  },
  {
    email: 'empleado-b@test-cimiento.com',
    pass: 'Cimiento2026*!',
    nombre: 'Laura Restrepo (Empresa B)',
    rol: 'empleado' as const,
    empresaId: 'empresa-b',
    empleadoId: 'empleado-b-001',
    documento: '20.000.001',
    permisos: ['dashboard', 'solicitudes', 'capacitaciones']
  }
];

export const INITIAL_LOGS_AUDITORIA: LogAuditoriaUsuario[] = [
  {
    id: 'log-clean-1',
    usuarioId: 'usr-admin-principal',
    usuarioNombre: 'Super Administrador (B GROUP INGENIERIA)',
    accion: 'Depuración y eliminación de todas las cuentas de usuario de prueba para paso a producción',
    modulo: 'Gestión de Usuarios',
    ip: '190.158.42.10',
    fechaHora: '2026-09-15 12:40:00',
    tipo: 'SEGURIDAD'
  }
];

// ==========================================
// PROCESOS DE ELECCIÓN Y VOTACIÓN SST
// ==========================================

export const INITIAL_PROCESOS_VOTACION: ProcesoVotacionSST[] = [
  {
    id: 'elec-copasst-2026',
    tipo: 'COPASST',
    titulo: 'Elección de Representantes de los Trabajadores ante el COPASST',
    periodo: '2026 - 2028',
    fechaApertura: '2026-09-10 08:00',
    fechaCierre: '2026-09-18 17:00',
    estado: 'Abierta',
    censoElectoralTotal: 6, // 6 colaboradores habilitados en cimiento
    candidatos: [
      {
        id: 'cand-cop-1',
        nombre: 'Carlos Mendivelso',
        cargo: 'Técnico de Fibra Óptica e Instalaciones',
        documento: '1.019.034.789',
        empleadoId: 'e6',
        numeroTarjeton: 1,
        propuesta: 'Mantenimiento preventivo quincenal de equipos anticaídas (arneses y eslingas), dotación de botas con suela antideslizante para escala en postes y verificación estricta de líneas de energía compartidas.',
        votosObtenidos: 2,
        esPrincipal: true
      },
      {
        id: 'cand-cop-2',
        nombre: 'Julián Castro',
        cargo: 'Coordinador de Servicios y Almacén',
        documento: '80.123.654',
        empleadoId: 'e4',
        numeroTarjeton: 2,
        propuesta: 'Adecuación ergonómica y señalización de pasillos de bodega central, dotación de fajas lumbares de apoyo y programa continuo de pausas activas para cuadrillas y personal administrativo.',
        votosObtenidos: 1,
        esSuplente: true
      },
      {
        id: 'cand-cop-3',
        nombre: 'Camila Ospina',
        cargo: 'Ejecutiva de Cuentas B2B',
        documento: '1.032.456.987',
        empleadoId: 'e5',
        numeroTarjeton: 3,
        propuesta: 'Foco en salud mental, prevención del tecnoestrés y dotación de sillas ergonómicas certificadas con soporte lumbar regulable.',
        votosObtenidos: 0
      }
    ],
    votosEnBlanco: 0,
    totalVotosEmitidos: 3,
    votantesRegistrados: [
      {
        empleadoId: 'e3', // Laura Beltrán ya votó
        fechaHoraVoto: '2026-09-11 11:24',
        codigoCertificado: 'VOTO-COP-2026-E3-9981'
      },
      {
        empleadoId: 'e4', // Julián Castro ya votó
        fechaHoraVoto: '2026-09-11 15:40',
        codigoCertificado: 'VOTO-COP-2026-E4-1044'
      },
      {
        empleadoId: 'e5', // Camila Ospina ya votó
        fechaHoraVoto: '2026-09-12 08:15',
        codigoCertificado: 'VOTO-COP-2026-E5-7732'
      }
      // Nota: e6 (Carlos Mendivelso) NO ha votado aún, para que en la vista de empleado pueda votar!
    ],
    juradosElectorales: [
      'Marcela Rueda (Directora GH - Presidenta de Mesa)',
      'Laura Beltrán (Analista Contable - Veedora Laboral)'
    ],
    actaApertura: 'ACTA-APERTURA-COP-001/2026. Siendo las 08:00 horas del 10 de septiembre de 2026, los jurados procedieron a verificar la urna digital vacía y habilitar el censo electoral de 6 trabajadores de B GROUP INGENIERIA S.A.S.'
  },
  {
    id: 'elec-convivencia-2026',
    tipo: 'Comité de Convivencia',
    titulo: 'Elección de Representantes de los Trabajadores ante el Comité de Convivencia Laboral',
    periodo: '2026 - 2028',
    fechaApertura: '2026-09-10 08:00',
    fechaCierre: '2026-09-18 17:00',
    estado: 'Abierta',
    censoElectoralTotal: 6,
    candidatos: [
      {
        id: 'cand-conv-1',
        nombre: 'Laura Beltrán',
        cargo: 'Analista Contable y Financiera',
        documento: '1.020.789.345',
        empleadoId: 'e3',
        numeroTarjeton: 1,
        propuesta: 'Fortalecimiento de canales confidenciales de escucha activa, talleres trimestrales de comunicación no violenta y resolución conciliatoria de desacuerdos laborales.',
        votosObtenidos: 2,
        esPrincipal: true
      },
      {
        id: 'cand-conv-2',
        nombre: 'Carlos Mendivelso',
        cargo: 'Técnico de Fibra Óptica e Instalaciones',
        documento: '1.019.034.789',
        empleadoId: 'e6',
        numeroTarjeton: 2,
        propuesta: 'Garantizar el respeto mutuo entre jefaturas operativas y cuadrillas en terreno, trato digno bajo contingencias y equilibrio de jornadas laborales.',
        votosObtenidos: 1,
        esSuplente: true
      }
    ],
    votosEnBlanco: 0,
    totalVotosEmitidos: 3,
    votantesRegistrados: [
      {
        empleadoId: 'e3', // Laura Beltrán
        fechaHoraVoto: '2026-09-11 11:28',
        codigoCertificado: 'VOTO-CONV-2026-E3-5541'
      },
      {
        empleadoId: 'e4', // Julián Castro
        fechaHoraVoto: '2026-09-11 15:45',
        codigoCertificado: 'VOTO-CONV-2026-E4-3321'
      },
      {
        empleadoId: 'e5', // Camila Ospina
        fechaHoraVoto: '2026-09-12 08:20',
        codigoCertificado: 'VOTO-CONV-2026-E5-8812'
      }
      // e6 (Carlos Mendivelso) NO ha votado aún en convivencia!
    ],
    juradosElectorales: [
      'Marcela Rueda (Directora GH - Presidenta de Mesa)',
      'Andrés Pinilla (Gerente General - Delegado Patronal)'
    ],
    actaApertura: 'ACTA-APERTURA-CCL-001/2026. Conforme a las Resoluciones 652 y 1356 de 2012, se abre el proceso de votación secreta para el Comité de Convivencia Laboral de B GROUP INGENIERIA S.A.S.'
  }
];

// ==========================================
// CUADRO DE CONTROL DE VACACIONES (ART. 186 CST)
// ==========================================

export const INITIAL_CONTROL_VACACIONES: ControlVacacionesEmpleado[] = [
  {
    empleadoId: 'e1',
    empleadoNombre: 'Andrés Pinilla',
    documento: '79.845.120',
    cargoNombre: 'Gerente General',
    fechaIngreso: '2020-01-15',
    diasLaboradosTotal: 2430,
    diasVacacionesCausados: 101.25,
    diasDisfrutadosAcumulados: 75,
    diasEnSolicitud: 0,
    diasPendientesDisfrute: 26.25,
    periodosAcumulados: 1.75,
    estadoAlerta: '1 periodo',
    provisionAcumuladaCOP: 10937500,
    ultimoPeriodoDisfrutado: '2024 - Periodo 4'
  },
  {
    empleadoId: 'e2',
    empleadoNombre: 'Marcela Rueda',
    documento: '52.981.450',
    cargoNombre: 'Directora de Gestión Humana',
    fechaIngreso: '2020-03-01',
    diasLaboradosTotal: 2385,
    diasVacacionesCausados: 99.38,
    diasDisfrutadosAcumulados: 70,
    diasEnSolicitud: 0,
    diasPendientesDisfrute: 29.38,
    periodosAcumulados: 1.95,
    estadoAlerta: '1 periodo',
    provisionAcumuladaCOP: 7051200,
    ultimoPeriodoDisfrutado: '2024 - Periodo 4'
  },
  {
    empleadoId: 'e3',
    empleadoNombre: 'Laura Beltrán',
    documento: '1.020.789.345',
    cargoNombre: 'Analista Contable y Financiera',
    fechaIngreso: '2021-02-01',
    diasLaboradosTotal: 2050,
    diasVacacionesCausados: 85.42,
    diasDisfrutadosAcumulados: 60,
    diasEnSolicitud: 10,
    diasPendientesDisfrute: 15.42,
    periodosAcumulados: 1.02,
    estadoAlerta: '1 periodo',
    provisionAcumuladaCOP: 1845000,
    ultimoPeriodoDisfrutado: '2025 - Periodo 3'
  },
  {
    empleadoId: 'e4',
    empleadoNombre: 'Julián Castro',
    documento: '80.123.654',
    cargoNombre: 'Coordinador de Servicios y Almacén',
    fechaIngreso: '2021-06-15',
    diasLaboradosTotal: 1915,
    diasVacacionesCausados: 79.79,
    diasDisfrutadosAcumulados: 45,
    diasEnSolicitud: 0,
    diasPendientesDisfrute: 34.79,
    periodosAcumulados: 2.31,
    estadoAlerta: 'Crítico (≥ 2 periodos)',
    provisionAcumuladaCOP: 3131100,
    ultimoPeriodoDisfrutado: '2023 - Periodo 2'
  },
  {
    empleadoId: 'e5',
    empleadoNombre: 'Camila Ospina',
    documento: '1.032.456.987',
    cargoNombre: 'Ejecutiva de Cuentas B2B',
    fechaIngreso: '2021-09-01',
    diasLaboradosTotal: 1838,
    diasVacacionesCausados: 76.58,
    diasDisfrutadosAcumulados: 60,
    diasEnSolicitud: 0,
    diasPendientesDisfrute: 16.58,
    periodosAcumulados: 1.10,
    estadoAlerta: '1 periodo',
    provisionAcumuladaCOP: 2200000,
    ultimoPeriodoDisfrutado: '2025 - Periodo 3'
  },
  {
    empleadoId: 'e6',
    empleadoNombre: 'Carlos Mendivelso',
    documento: '1.019.034.789',
    cargoNombre: 'Técnico de Fibra Óptica e Instalaciones',
    fechaIngreso: '2022-04-15',
    diasLaboradosTotal: 1610,
    diasVacacionesCausados: 67.08,
    diasDisfrutadosAcumulados: 60,
    diasEnSolicitud: 0,
    diasPendientesDisfrute: 7.08,
    periodosAcumulados: 0.47,
    estadoAlerta: 'Al día',
    provisionAcumuladaCOP: 660800,
    ultimoPeriodoDisfrutado: '2025 - Periodo 3'
  }
];

export const INITIAL_SOLICITUDES_VACACIONES: SolicitudVacacionDetalle[] = [
  {
    id: 'vac-sol-01',
    empleadoId: 'e3',
    empleadoNombre: 'Laura Beltrán',
    fechaSolicitud: '2026-09-01',
    fechaInicio: '2026-10-05',
    fechaFin: '2026-10-16',
    fechaReintegro: '2026-10-19',
    diasHabiles: 10,
    diasCalendario: 12,
    periodoCorrespondiente: '2024 - 2025',
    estado: 'Pendiente',
    reemplazoCargo: 'Auxiliar Contable Temporal / Apoyo GH',
    reemplazoEmpleadoId: 'e2',
    liquidadoEnNomina: false,
    valorPagadoCOP: 1200000
  },
  {
    id: 'vac-sol-02',
    empleadoId: 'e4',
    empleadoNombre: 'Julián Castro',
    fechaSolicitud: '2026-08-15',
    fechaInicio: '2026-11-03',
    fechaFin: '2026-11-20',
    fechaReintegro: '2026-11-23',
    diasHabiles: 15,
    diasCalendario: 18,
    periodoCorrespondiente: '2023 - 2024',
    estado: 'Aprobada',
    reemplazoCargo: 'Técnico de Redes en Rotación Bodega',
    reemplazoEmpleadoId: 'e6',
    aprobadoPor: 'Marcela Rueda (GH)',
    fechaAprobacion: '2026-08-20',
    liquidadoEnNomina: false,
    valorPagadoCOP: 1350000
  },
  {
    id: 'vac-sol-03',
    empleadoId: 'e6',
    empleadoNombre: 'Carlos Mendivelso',
    fechaSolicitud: '2025-12-01',
    fechaInicio: '2025-12-15',
    fechaFin: '2025-12-31',
    fechaReintegro: '2026-01-02',
    diasHabiles: 14,
    diasCalendario: 17,
    periodoCorrespondiente: '2024 - 2025',
    estado: 'Disfrutada',
    aprobadoPor: 'Andrés Pinilla',
    fechaAprobacion: '2025-12-05',
    liquidadoEnNomina: true,
    valorPagadoCOP: 1306666
  }
];
