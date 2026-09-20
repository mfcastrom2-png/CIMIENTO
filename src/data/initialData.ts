import {
  AreaOrganizacion,
  Cargo,
  Empleado,
  Encuesta,
  EvaluacionDesempeno,
  FichaCargo,
  ProcesoOrganizacion,
  Solicitud
} from '../types';

export function uid(prefix: string = 'id'): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 8);
}

export function fichaVacia(over: Partial<FichaCargo> = {}): FichaCargo {
  return {
    identificacion: {
      codigo: '',
      familia: '',
      area: '',
      proceso: '',
      tipoVinculacion: '',
      modalidad: 'Presencial',
      ubicacion: 'Sede principal',
      personalACargo: '0',
      estado: 'Borrador',
      version: '0.1',
      ...(over.identificacion || {})
    },
    proposito: over.proposito || '',
    funciones: over.funciones || [],
    responsabilidades: over.responsabilidades || [],
    indicadores: over.indicadores || [],
    autoridad: {
      decide: '',
      aprueba: '',
      modifica: '',
      consulta: '',
      escala: '',
      ...(over.autoridad || {})
    },
    relaciones: {
      supervisaA: '',
      coordinaCon: '',
      soportaA: '',
      recibeDe: '',
      entregaA: '',
      consultaA: '',
      ...(over.relaciones || {})
    },
    competencias: over.competencias || [],
    requisitos: {
      formacion: '',
      experiencia: '',
      conocimientos: '',
      certificaciones: '',
      ...(over.requisitos || {})
    },
    cumplimiento: {
      sst: '',
      datos: '',
      normativa: [],
      ...(over.cumplimiento || {})
    },
    documentos: over.documentos || [],
    historial: over.historial || []
  };
}

export const INITIAL_CARGOS: Cargo[] = [
  {
    id: 'c1',
    nombre: 'Gerencia General',
    reportaA: null,
    ficha: fichaVacia({
      identificacion: {
        codigo: 'DIR-001',
        familia: 'Dirección',
        area: 'Gerencia',
        proceso: 'Direccionamiento estratégico',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Presencial',
        ubicacion: 'Sede principal',
        personalACargo: '6',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: 'Dirigir la empresa y garantizar el cumplimiento de sus objetivos estratégicos, financieros, de calidad y servicio al cliente.',
      funciones: [
        { id: 'fn_1', texto: 'Definir el direccionamiento estratégico de la empresa', condicion: 'Con base en análisis de entorno y balance del periodo', resultado: 'Plan estratégico anual aprobado', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_2', texto: 'Aprobar el presupuesto anual y vigilar la ejecución', condicion: 'A partir de la propuesta consolidada de las áreas', resultado: 'Presupuesto formalizado y monitoreado', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_3', texto: 'Representar legalmente a la empresa', condicion: 'Ante entidades regulatorias, gremios y clientes corporativos', resultado: 'Compromisos jurídicos formalizados', criticidad: 'Media', estado: 'Vigente' },
      ],
      responsabilidades: [
        { id: 'rs_1', categoria: 'Operativa', descripcion: 'Responder por el cumplimiento de las metas institucionales y sostenibilidad del negocio.' },
        { id: 'rs_2', categoria: 'Cumplimiento', descripcion: 'Garantizar el cumplimiento normativo legal, tributario y laboral de la empresa.' },
      ],
      indicadores: [
        { id: 'in_1', nombre: 'Cumplimiento del plan estratégico', formula: 'Metas cumplidas / metas planeadas', unidad: '%', frecuencia: 'Anual', pesoSugerido: 25 },
        { id: 'in_2', nombre: 'Margen operativo neto', formula: '(Utilidad Operativa / Ingresos Totales) * 100', unidad: '%', frecuencia: 'Trimestral', pesoSugerido: 25 },
      ],
      autoridad: {
        decide: 'Inversiones de capital, contrataciones estratégicas y asignación presupuestal',
        aprueba: 'Presupuesto anual, políticas institucionales y estructura organizacional',
        modifica: 'Directrices estratégicas de la compañía',
        consulta: 'Junta directiva o socios para endeudamiento superior al cupo estatutario',
        escala: 'No aplica, es la máxima instancia interna ejecutiva'
      },
      relaciones: {
        supervisaA: 'Coordinación administrativa, comercial y operaciones técnicas',
        coordinaCon: 'Junta directiva y asesores corporativos',
        soportaA: 'Todas las áreas en decisiones de alto impacto',
        recibeDe: 'Informes periódicos de gestión y balances financieros',
        entregaA: 'Resultados y rendición de cuentas a accionistas',
        consultaA: 'Asesores jurídicos, revisoría fiscal y consultores externos'
      },
      competencias: [
        { id: 'cp_1', nombre: 'Liderazgo inspirador', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Orienta y cohesiona al equipo hacia objetivos comunes, transmitiendo serenidad en momentos de incertidumbre.' },
        { id: 'cp_2', nombre: 'Visión estratégica', tipo: 'Técnica', nivel: 'Alto', conductas: 'Anticipa cambios en el mercado tecnológico e implementa oportunamente ajustes de rumbo.' },
        { id: 'cp_3', nombre: 'Toma de decisiones', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Evalúa riesgos con datos rigurosos y decide con agilidad y firmeza ética.' }
      ],
      requisitos: {
        formacion: 'Profesional en Administración, Economía, Ingeniería o afines con Posgrado en Gerencia.',
        experiencia: 'Mínimo 5 años en cargos de dirección o gerencia general.',
        conocimientos: 'Planeación estratégica, finanzas corporativas, gestión de operaciones de servicios.',
        certificaciones: 'No indispensable, deseable gobernanza corporativa.'
      },
      cumplimiento: {
        sst: 'Responsable máximo legal del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST).',
        datos: 'Representante responsable de las bases de datos de clientes y colaboradores ante la SIC.',
        normativa: [{ id: 'nm_1', norma: 'Decreto 1072 de 2015', tema: 'SG-SST y relaciones laborales', vigencia: 'Vigente' }]
      },
      documentos: [{ id: 'doc_1', nombre: 'Manual de Gobernanza' }, { id: 'doc_2', nombre: 'Código de Ética y Conducta' }],
      historial: [{ id: 'h_1', version: '1.0', fecha: '2025-01-15', motivo: 'Formalización inicial de la ficha', responsable: 'Gestión Humana', aprobador: 'Junta Directiva' }]
    })
  },
  {
    id: 'c2',
    nombre: 'Coordinación Administrativa y Financiera',
    reportaA: 'c1',
    ficha: fichaVacia({
      identificacion: {
        codigo: 'ADM-001',
        familia: 'Administración',
        area: 'Administrativa',
        proceso: 'Gestión administrativa y talento humano',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Presencial',
        ubicacion: 'Sede principal',
        personalACargo: '2',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: 'Coordinar los procesos de talento humano, compras, suministros y soporte contable para garantizar el flujo operativo del negocio.',
      funciones: [
        { id: 'fn_4', texto: 'Coordinar los procesos de selección, contratación e inducción', condicion: 'Conforme al requerimiento de las áreas y perfiles de cargo', resultado: 'Vacantes cubiertas en los tiempos pactados', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_5', texto: 'Administrar el ciclo de nómina, seguridad social y novedades', condicion: 'Con estricto apego al calendario legal y laboral', resultado: 'Pagos oportunos y libres de inconsistencias', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_6', texto: 'Supervisar la ejecución del SG-SST y compras menores', condicion: 'En articulación con el asesor de SST y proveedores', resultado: 'Ambiente seguro y abastecimiento continuo', criticidad: 'Media', estado: 'Vigente' },
      ],
      responsabilidades: [
        { id: 'rs_3', categoria: 'Información', descripcion: 'Custodiar las carpetas laborales y la información salarial confidencial.' },
        { id: 'rs_4', categoria: 'Cumplimiento', descripcion: 'Asegurar la presentación y pago puntual de aportes a PILA y parafiscales.' }
      ],
      indicadores: [
        { id: 'in_3', nombre: 'Tiempo de respuesta a solicitudes internas', formula: 'Suma de días hábiles de respuesta / total solicitudes', unidad: 'días', frecuencia: 'Mensual', pesoSugerido: 25 },
        { id: 'in_4', nombre: 'Efectividad en cierre de novedades de nómina', formula: '(Novedades sin reproceso / Total novedades) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 25 },
      ],
      autoridad: {
        decide: 'Aprobación de compras rutinarias hasta $2.000.000 y turnos de personal a cargo',
        aprueba: 'Permisos cortos y compensatorios de su equipo directo',
        modifica: 'Instructivos operativos del área administrativa',
        consulta: 'Gerencia General para desvinculaciones o gastos fuera de presupuesto',
        escala: 'Controversias disciplinarias o requerimientos del Ministerio de Trabajo'
      },
      relaciones: {
        supervisaA: 'Analista Contable, Asistente Administrativo',
        coordinaCon: 'Coordinación Comercial y Operaciones Técnicas',
        soportaA: 'Todas las áreas en temas laborales y logísticos',
        recibeDe: 'Novedades de personal y reportes contables',
        entregaA: 'Informes de talento humano e indicadores a Gerencia',
        consultaA: 'Asesor laboral externo y proveedor de SST'
      },
      competencias: [
        { id: 'cp_4', nombre: 'Organización metódica', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Planifica las tareas con antelación, gestiona prioridades múltiples y asegura archivo ordenado.' },
        { id: 'cp_5', nombre: 'Comunicación asertiva', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Transmite requerimientos con claridad, empatía y respeto hacia todos los niveles.' },
        { id: 'cp_6', nombre: 'Gestión normativa laboral', tipo: 'Técnica', nivel: 'Intermedio', conductas: 'Aplica adecuadamente la normatividad laboral vigente evitando riesgos jurídicos.' }
      ],
      requisitos: {
        formacion: 'Profesional en Administración de Empresas, Contaduría o Psicología Organizacional.',
        experiencia: 'Mínimo 3 años en roles similares de coordinación administrativa.',
        conocimientos: 'Legislación laboral colombiana, nómina, compras y gestión documental.',
        certificaciones: 'Curso de 50 horas en SG-SST (deseable).'
      },
      cumplimiento: {
        sst: 'Lidera la implementación de las actividades del SG-SST y el COPASST.',
        datos: 'Custodio primario de expedientes de personal y hojas de vida.',
        normativa: [{ id: 'nm_2', norma: 'Código Sustantivo del Trabajo', tema: 'Relaciones contractuales y derechos laborales', vigencia: 'Vigente' }]
      },
      documentos: [{ id: 'doc_3', nombre: 'Reglamento Interno de Trabajo' }, { id: 'doc_4', nombre: 'Procedimiento de Permisos y Vacaciones' }],
      historial: [{ id: 'h_2', version: '1.0', fecha: '2025-01-20', motivo: 'Creación de ficha inicial', responsable: 'Administración', aprobador: 'Gerencia General' }]
    })
  },
  {
    id: 'c3',
    nombre: 'Analista Contable',
    reportaA: 'c2',
    ficha: fichaVacia({
      identificacion: {
        codigo: 'FIN-001',
        familia: 'Finanzas',
        area: 'Contabilidad',
        proceso: 'Gestión contable y tributaria',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Presencial',
        ubicacion: 'Sede principal',
        personalACargo: '0',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: 'Registrar, conciliar y validar las operaciones contables y tributarias para generar estados financieros veraces y oportunos.',
      funciones: [
        { id: 'fn_7', texto: 'Contabilizar facturas de compras, gastos y recibos de caja', condicion: 'Con soporte tributario válido conforme a norma DIAN', resultado: 'Causación diaria al día', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_8', texto: 'Realizar conciliaciones bancarias mensuales', condicion: 'Cotejando extractos contra movimientos contables', resultado: 'Diferencias bancarias identificadas y resueltas', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_9', texto: 'Preparar borradores de declaraciones tributarias', condicion: 'Según el calendario fiscal de impuestos nacionales y municipales', resultado: 'Declaraciones de IVA, Retención e ICA listas para firma', criticidad: 'Alta', estado: 'Vigente' },
      ],
      responsabilidades: [
        { id: 'rs_5', categoria: 'Cumplimiento', descripcion: 'Garantizar que no existan inconsistencias en medios magnéticos ni extemporaneidad en impuestos.' }
      ],
      indicadores: [
        { id: 'in_5', nombre: 'Cierres contables a tiempo', formula: '(Cierres completados en fecha límite / Total cierres) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 25 },
        { id: 'in_6', nombre: 'Oportunidad en conciliaciones bancarias', formula: 'Días hábiles posteriores al corte de mes', unidad: 'días', frecuencia: 'Mensual', pesoSugerido: 25 }
      ],
      autoridad: {
        decide: 'Criterio técnico de imputación en cuentas auxiliares según NIIF',
        aprueba: 'No aplica',
        modifica: 'Plan de cuentas auxiliar previa consulta con Revisoría Fiscal',
        consulta: 'Coordinación Administrativa y Revisor Fiscal',
        escala: 'Diferencias materiales de inventario o saldos sospechosos'
      },
      relaciones: {
        supervisaA: 'No aplica',
        coordinaCon: 'Asistente Administrativo y Tesorería',
        soportaA: 'Gerencia General con reportes de flujo y márgenes',
        recibeDe: 'Soportes de facturación, compras y legalizaciones',
        entregaA: 'Balances de prueba y anexos tributarios a Revisoría',
        consultaA: 'Revisor Fiscal'
      },
      competencias: [
        { id: 'cp_7', nombre: 'Rigor analítico y atención al detalle', tipo: 'Técnica', nivel: 'Alto', conductas: 'Detecta de forma proactiva desbalances de centavos e inconsistencias en facturación.' },
        { id: 'cp_8', nombre: 'Orientación al logro y cumplimiento', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Se anticipa a los plazos legales sin requerir recordatorios constantes.' }
      ],
      requisitos: {
        formacion: 'Contador Público titulado.',
        experiencia: 'Mínimo 2 años en contabilidad general o firmas de auditoría.',
        conocimientos: 'Normas NIIF para Pymes, software contable en la nube, paquete tributario.',
        certificaciones: 'Tarjeta profesional vigente de la Junta Central de Contadores.'
      },
      cumplimiento: {
        sst: 'Participa activamente en pausas activas e inspecciones ergonómicas.',
        datos: 'Guarda reserva estricta de la información financiera y de costos.',
        normativa: [{ id: 'nm_3', norma: 'Estatuto Tributario Nacional', tema: 'Obligaciones de facturación electrónica y retenciones', vigencia: 'Vigente' }]
      },
      documentos: [{ id: 'doc_5', nombre: 'Manual de Políticas Contables NIIF' }],
      historial: [{ id: 'h_3', version: '1.0', fecha: '2025-02-01', motivo: 'Aprobación de ficha técnica', responsable: 'Coordinación Administrativa', aprobador: 'Gerencia' }]
    })
  },
  {
    id: 'c4',
    nombre: 'Asistente Administrativo y Operativo',
    reportaA: 'c2',
    ficha: fichaVacia({
      identificacion: {
        codigo: 'ADM-002',
        familia: 'Administración',
        area: 'Administrativa',
        proceso: 'Apoyo administrativo',
        tipoVinculacion: 'Término fijo',
        modalidad: 'Presencial',
        ubicacion: 'Sede principal',
        personalACargo: '0',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: 'Apoyar los trámites diarios de correspondencia, suministros, archivo institucional y atención a usuarios y proveedores.',
      funciones: [
        { id: 'fn_10', texto: 'Gestionar la radicación y archivo documental físico y digital', condicion: 'Conforme a la tabla de retención documental institucional', resultado: 'Expedientes completos y localizables en menos de 2 minutos', criticidad: 'Media', estado: 'Vigente' },
        { id: 'fn_11', texto: 'Gestionar los pedidos de papelería, aseo y cafetería', condicion: 'Manteniendo stock de seguridad y cotizaciones comparativas', resultado: 'Suministros continuos con optimización de costos', criticidad: 'Baja', estado: 'Vigente' },
      ],
      responsabilidades: [
        { id: 'rs_6', categoria: 'Calidad', descripcion: 'Mantener la pulcritud y orden en la recepción y zonas comunes de la empresa.' }
      ],
      indicadores: [
        { id: 'in_7', nombre: 'Oportunidad en archivo de comprobantes', formula: '(Comprobantes archivados a tiempo / Total recibidos) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 25 }
      ],
      autoridad: {
        decide: 'Distribución de insumos básicos en puestos de trabajo',
        aprueba: 'No aplica',
        modifica: 'Etiquetas de archivo digital',
        consulta: 'Coordinación Administrativa',
        escala: 'Inconformidades de proveedores o visitantes'
      },
      relaciones: {
        supervisaA: 'No aplica',
        coordinaCon: 'Mensajería y personal de servicios generales',
        soportaA: 'A todos los miembros de la sede en logística de oficina',
        recibeDe: 'Correspondencia, paquetes y facturas entrantes',
        entregaA: 'Documentos radicados a las áreas de destino',
        consultaA: 'Coordinación Administrativa'
      },
      competencias: [
        { id: 'cp_9', nombre: 'Actitud de servicio', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Brinda trato cordial, oportuno y dispuesto a visitantes y colaboradores.' },
        { id: 'cp_10', nombre: 'Orden y prolijidad', tipo: 'Corporativa', nivel: 'Intermedio', conductas: 'Mantiene su área de trabajo despejada y los archivos debidamente catalogados.' }
      ],
      requisitos: {
        formacion: 'Técnico o Tecnólogo en Gestión Administrativa o Asistencia de Gerencia.',
        experiencia: '1 año en labores de recepción, conmutador o auxiliar de oficina.',
        conocimientos: 'Herramientas ofimáticas (Word, Excel, correo corporativo), redacción formal.',
        certificaciones: 'No requiere.'
      },
      cumplimiento: {
        sst: 'Apoya el reporte de extintores, botiquines y señalización.',
        datos: 'No divulga datos de visitantes ni correspondencia confidencial.',
        normativa: []
      },
      documentos: [{ id: 'doc_6', nombre: 'Protocolo de Atención en Recepción' }],
      historial: [{ id: 'h_4', version: '1.0', fecha: '2025-02-10', motivo: 'Versión formalizada', responsable: 'Administración', aprobador: 'Coordinación Administrativa' }]
    })
  },
  {
    id: 'c5',
    nombre: 'Coordinación Comercial',
    reportaA: 'c1',
    ficha: fichaVacia({
      identificacion: {
        codigo: 'COM-001',
        familia: 'Comercial',
        area: 'Comercial',
        proceso: 'Gestión comercial y ventas',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Presencial',
        ubicacion: 'Sede principal',
        personalACargo: '2',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: 'Diseñar la estrategia de ventas, liderar la fuerza comercial y asegurar el cumplimiento de metas de ingresos y fidelización.',
      funciones: [
        { id: 'fn_12', texto: 'Planificar metas de venta mensuales y asignar cuotas', condicion: 'Conforme al presupuesto anual de ventas de la compañía', resultado: 'Metas comunicadas y aceptadas por el equipo comercial', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_13', texto: 'Monitorear el pipeline en CRM y acompañar negociaciones clave', condicion: 'Semanalmente en comités comerciales', resultado: 'Tasa de cierre sostenida superior al 25%', criticidad: 'Alta', estado: 'Vigente' },
      ],
      responsabilidades: [
        { id: 'rs_7', categoria: 'Cliente', descripcion: 'Garantizar que las promesas comerciales coincidan con la capacidad técnica real.' }
      ],
      indicadores: [
        { id: 'in_8', nombre: 'Cumplimiento de meta comercial global', formula: '(Ventas netas alcanzadas / Meta presupuestada) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 25 },
        { id: 'in_9', nombre: 'Tasa de conversión de prospectos', formula: '(Cierres efectivos / Oportunidades generadas) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 25 }
      ],
      autoridad: {
        decide: 'Rutas comerciales de visitas y asignación de prospectos',
        aprueba: 'Descuentos comerciales dentro del margen autorizado (hasta 7%)',
        modifica: 'Presentaciones comerciales y material de venta',
        consulta: 'Gerencia General para licitaciones o contratos marco',
        escala: 'Incumplimientos graves de cartera de clientes clave'
      },
      relaciones: {
        supervisaA: 'Ejecutivos comerciales',
        coordinaCon: 'Operaciones Técnicas y Coordinación Administrativa',
        soportaA: 'Gerencia en prospección de alianzas',
        recibeDe: 'Planes técnicos de cobertura y capacidad de red',
        entregaA: 'Forecast y proyecciones de ventas al comité directivo',
        consultaA: 'Asesor técnico de infraestructura'
      },
      competencias: [
        { id: 'cp_11', nombre: 'Negociación estratégica', tipo: 'Técnica', nivel: 'Alto', conductas: 'Construye acuerdos gana-gana manteniendo el margen de rentabilidad corporativa.' },
        { id: 'cp_12', nombre: 'Orientación a resultados de negocio', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Mantiene alta energía y perseverancia para superar las cuotas del periodo.' }
      ],
      requisitos: {
        formacion: 'Profesional en Mercadeo, Ingeniería Industrial, Administración o áreas afines.',
        experiencia: 'Mínimo 3 años en liderazgo de equipos comerciales B2B o telecomunicaciones.',
        conocimientos: 'Manejo de CRM, prospección consultiva, análisis de KPIs de ventas.',
        certificaciones: 'No indispensable.'
      },
      cumplimiento: {
        sst: 'Verifica el cumplimiento de seguridad en desplazamientos de ejecutivos.',
        datos: 'Protege las bases de datos de prospectos y tarifas confidenciales.',
        normativa: []
      },
      documentos: [{ id: 'doc_7', nombre: 'Política de Comisiones y Descuentos' }],
      historial: [{ id: 'h_5', version: '1.0', fecha: '2025-02-15', motivo: 'Aprobación institucional', responsable: 'Comercial', aprobador: 'Gerencia General' }]
    })
  },
  {
    id: 'c6',
    nombre: 'Ejecutivo Comercial B2B',
    reportaA: 'c5',
    ficha: fichaVacia({
      identificacion: {
        codigo: 'COM-002',
        familia: 'Comercial',
        area: 'Comercial',
        proceso: 'Ventas y relacionamiento',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Híbrido',
        ubicacion: 'Sede principal / Campo',
        personalACargo: '0',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: 'Prospección activa, estructuración de propuestas, cierre de ventas y fidelización de cuentas corporativas.',
      funciones: [
        { id: 'fn_14', texto: 'Prospectar y contactar nuevas cuentas empresariales', condicion: 'Conforme al perfil de cliente ideal definido en el plan', resultado: 'Mínimo 15 reuniones calificadas por mes', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_15', texto: 'Registrar la trazabilidad de cada interacción en el CRM', condicion: 'En un lapso no superior a 24 horas tras la reunión', resultado: 'Pipeline actualizado en tiempo real', criticidad: 'Media', estado: 'Vigente' },
      ],
      responsabilidades: [
        { id: 'rs_8', categoria: 'Cliente', descripcion: 'Hacer seguimiento a la instalación del servicio para asegurar la satisfacción inicial.' }
      ],
      indicadores: [
        { id: 'in_10', nombre: 'Cumplimiento de cuota individual de ventas', formula: '(Ventas cerradas / Cuota asignada) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 30 },
        { id: 'in_11', nombre: 'Efectividad en cobranza inicial / facturación', formula: '(Facturas radicadas y firmadas / Total servicios vendidos) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 20 }
      ],
      autoridad: {
        decide: 'Agenda semanal de visitas',
        aprueba: 'No aplica',
        modifica: 'Estrategia de abordaje de prospectos',
        consulta: 'Coordinación Comercial',
        escala: 'Exigencias de SLA especiales no tipificadas'
      },
      relaciones: {
        supervisaA: 'No aplica',
        coordinaCon: 'Operaciones para viabilidad técnica',
        soportaA: 'Clientes en dudas contractuales iniciales',
        recibeDe: 'Leads calificados de mercadeo',
        entregaA: 'Contratos firmados a Administración',
        consultaA: 'Coordinación Comercial'
      },
      competencias: [
        { id: 'cp_13', nombre: 'Persuasión y comunicación efectiva', tipo: 'Técnica', nivel: 'Alto', conductas: 'Identifica los dolores del cliente y articula soluciones de valor técnico convincentes.' },
        { id: 'cp_14', nombre: 'Orientación al cliente', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Responde oportunamente a inquietudes y garantiza transparencia en las condiciones.' }
      ],
      requisitos: {
        formacion: 'Técnico, Tecnólogo o Profesional en áreas comerciales o afines.',
        experiencia: '2 años en ventas consultivas de tecnología o servicios corporativos.',
        conocimientos: 'Técnicas de venta SPIN o consultiva, manejo de CRM.',
        certificaciones: 'No requiere.'
      },
      cumplimiento: {
        sst: 'Cumple normas de seguridad vial en desplazamientos de campo.',
        datos: 'Custodia contactos corporativos y respeta Habeas Data.',
        normativa: []
      },
      documentos: [{ id: 'doc_8', nombre: 'Plantilla de Ofertas Comerciales' }],
      historial: [{ id: 'h_6', version: '1.0', fecha: '2025-02-20', motivo: 'Versión formal', responsable: 'Comercial', aprobador: 'Coordinación Comercial' }]
    })
  },
  // Cargo Técnico de Redes y Operaciones ISP (Referenciado directamente en las páginas 2, 3, 6, 8 del documento adjunto)
  {
    id: 'c7',
    nombre: 'Técnico de Redes y Operaciones ISP',
    reportaA: 'c1',
    ficha: fichaVacia({
      identificacion: {
        codigo: 'TEC-001',
        familia: 'Operaciones',
        area: 'Operaciones y Redes',
        proceso: 'Despliegue y mantenimiento de infraestructura de telecomunicaciones',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Presencial',
        ubicacion: 'Sede / Campo - Nodos de red',
        personalACargo: '0',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: 'Ejecutar las instalaciones, mantenimiento preventivo y correctivo de la red de fibra óptica e inalámbrica garantizando disponibilidad, calidad técnica y trabajo seguro.',
      funciones: [
        { id: 'fn_16', texto: 'Realizar instalaciones de última milla y empalmes de fibra óptica', condicion: 'Bajo estándares de atenuación óptica (< 0.2 dB por empalme) y normatividad técnica', resultado: 'Instalaciones operativas sin reincidencias', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_17', texto: 'Diagnosticar y solucionar fallas de conectividad en campo', condicion: 'Utilizando OTDR, medidor de potencia y respetando los SLAs pactados', resultado: 'Servicio restablecido en el tiempo promedio objetivo', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_18', texto: 'Documentar oportunamente las órdenes de trabajo (OT)', condicion: 'En el aplicativo móvil antes de abandonar el sitio con soporte fotográfico y seriales', resultado: 'Órdenes correctamente cerradas y legalizadas', criticidad: 'Alta', estado: 'Vigente' },
        { id: 'fn_19', texto: 'Controlar los materiales asignados en el vehículo de operaciones', condicion: 'Verificando consumos de fibra, conectores, routers y herrajes', resultado: 'Inventario móvil cuadrado sin mermas injustificadas', criticidad: 'Media', estado: 'Vigente' },
      ],
      responsabilidades: [
        { id: 'rs_9', categoria: 'SST', descripcion: 'Utilizar siempre los Elementos de Protección Personal (EPP), línea de vida en alturas y reportar condiciones inseguras.' },
        { id: 'rs_10', categoria: 'Calidad', descripcion: 'Asegurar que ningún cliente quede con parámetros ópticos fuera de norma o configuraciones Wi-Fi vulnerables.' }
      ],
      // Indicadores clave EXACTAMENTE como los detalla el documento adjunto (pág. 2):
      indicadores: [
        { id: 'in_12', nombre: '% instalaciones sin reincidencia', formula: '(Instalaciones sin falla en 30 días / Total instalaciones) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 15 },
        { id: 'in_13', nombre: 'Tiempo promedio de solución', formula: 'Suma de horas de atención / Total incidentes atendidos', unidad: 'horas', frecuencia: 'Mensual', pesoSugerido: 15 },
        { id: 'in_14', nombre: '% órdenes sin reproceso', formula: '(Órdenes aprobadas en primera visita / Total órdenes) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 10 },
        { id: 'in_15', nombre: '% órdenes correctamente documentadas', formula: '(Órdenes con soporte fotográfico completo / Total órdenes) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 5 },
        { id: 'in_16', nombre: '% consumos correctamente registrados', formula: '(Materiales descargados en sistema / Materiales utilizados físicamente) * 100', unidad: '%', frecuencia: 'Mensual', pesoSugerido: 5 },
      ],
      autoridad: {
        decide: 'Ruta óptima de tendido de cableado en la acometida del cliente',
        aprueba: 'Visto bueno técnico de instalación en el predio',
        modifica: 'Parámetros de potencia en router para optimizar cobertura Wi-Fi',
        consulta: 'NOC / Centro de control de red ante cortes masivos de fibra',
        escala: 'Riesgo inminente de caída en alturas o negativa de paso por parte de terceros'
      },
      relaciones: {
        supervisaA: 'No aplica',
        coordinaCon: 'NOC, Despacho y Almacén de suministros',
        soportaA: 'Servicio al cliente con diagnóstico técnico de fallas complejas',
        recibeDe: 'Órdenes de servicio y materiales desde almacén',
        entregaA: 'Instalaciones funcionando a satisfacción al usuario final',
        consultaA: 'Ingeniero de Redes'
      },
      // Competencias técnicas y corporativas según documento (pág. 3 y 4):
      competencias: [
        { id: 'cp_15', nombre: 'Diagnóstico de fallas', tipo: 'Técnica', nivel: 'Alto', conductas: 'Utiliza instrumentación con precisión, aísla la causa raíz rápidamente y no cambia equipos sin justificación.' },
        { id: 'cp_16', nombre: 'Instalación de infraestructura', tipo: 'Técnica', nivel: 'Alto', conductas: 'Realiza tendidos limpios, curvaturas seguras de fibra y empalmes con mínimas pérdidas.' },
        { id: 'cp_17', nombre: 'Manejo de herramientas', tipo: 'Técnica', nivel: 'Alto', conductas: 'Cuida los equipos de precisión (fusionadora, medidor óptico) y verifica su calibración periódica.' },
        { id: 'cp_18', nombre: 'Resolución de problemas', tipo: 'Técnica', nivel: 'Alto', conductas: 'Propone soluciones viables ante obstáculos arquitectónicos sin comprometer la seguridad ni la estética.' },
        { id: 'cp_19', nombre: 'Aplicación de procedimientos técnicos', tipo: 'Técnica', nivel: 'Alto', conductas: 'Sigue la norma técnica de cableado y protocolos de activación punto a punto.' },
        { id: 'cp_20', nombre: 'Orientación al cliente', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Anticipa dudas del usuario, explica de forma didáctica la configuración Wi-Fi y mantiene trato deferente.' },
        { id: 'cp_21', nombre: 'Responsabilidad y SG-SST', tipo: 'Corporativa', nivel: 'Alto', conductas: 'Porta siempre los EPP completos, delimita el área de trabajo y nunca asume riesgos en alturas.' },
        { id: 'cp_22', nombre: 'Trabajo en equipo', tipo: 'Corporativa', nivel: 'Intermedio', conductas: 'Apoya a compañeros en tiradas largas de fibra y comparte buenas prácticas en el taller.' },
      ],
      requisitos: {
        formacion: 'Técnico o Tecnólogo en Telecomunicaciones, Redes, Electricidad o Electrónica.',
        experiencia: 'Mínimo 2 años en despliegue de redes GPON / FTTH o wireless de ISP.',
        conocimientos: 'Fusión de fibra óptica, manejo de OTDR, configuración de ONUs y routers MikroTik/Huawei.',
        certificaciones: 'Certificación vigente de Trabajo Seguro en Alturas (Avanzado).'
      },
      cumplimiento: {
        sst: 'Obligatoriedad estricta de uso de arnés certificado, casco dieléctrico, botas con puntera y reporte de incidentes.',
        datos: 'Garantiza confidencialidad de claves Wi-Fi y credenciales de acceso de abonados.',
        normativa: [
          { id: 'nm_4', norma: 'Resolución 4272 de 2021', tema: 'Trabajo seguro en alturas', vigencia: 'Vigente' },
          { id: 'nm_5', norma: 'Reglamento Técnico RITEL', tema: 'Redes internas de telecomunicaciones', vigencia: 'Vigente' }
        ]
      },
      documentos: [
        { id: 'doc_9', nombre: 'Manual de Instalaciones FTTH' },
        { id: 'doc_10', nombre: 'Protocolo de Seguridad en Alturas y Postería' }
      ],
      historial: [
        { id: 'h_7', version: '1.0', fecha: '2025-01-10', motivo: 'Formalización del perfil técnico según modelo de competencias', responsable: 'Operaciones', aprobador: 'Gerencia General' }
      ]
    })
  }
];

export const INITIAL_EMPLEADOS: Empleado[] = [
  {
    id: 'e1',
    nombre: 'Marcela Rueda',
    documento: '52.331.902',
    email: 'marcela.rueda@empresa.com',
    telefono: '315 220 4411',
    cargoId: 'c1',
    formacion: 'Administradora de Empresas, Magíster en Dirección Estratégica',
    experiencia: '8 años en dirección y escalamiento de empresas de servicios.',
    contrato: { tipo: 'Término indefinido', inicio: '2019-03-01', fin: '—', salario: '$9.500.000' },
    familia: [{ nombre: 'Diego Rueda', parentesco: 'Hijo', nacimiento: '2012-05-14' }],
    activo: true
  },
  {
    id: 'e2',
    nombre: 'Andrés Pinilla',
    documento: '80.114.552',
    email: 'andres.pinilla@empresa.com',
    telefono: '300 552 1190',
    cargoId: 'c2',
    formacion: 'Administrador de Empresas con diplomado en Legislación Laboral',
    experiencia: '4 años coordinando áreas administrativas y gestión humana.',
    contrato: { tipo: 'Término fijo', inicio: '2022-01-10', fin: '2027-01-10', salario: '$4.800.000' },
    familia: [],
    activo: true
  },
  {
    id: 'e3',
    nombre: 'Laura Beltrán',
    documento: '1.032.556.881',
    email: 'laura.beltran@empresa.com',
    telefono: '311 908 7723',
    cargoId: 'c3',
    formacion: 'Contadora Pública con especialización en Auditoría y Revisoría Fiscal',
    experiencia: '3 años en contabilidad tributaria y conciliaciones bancarias.',
    contrato: { tipo: 'Término indefinido', inicio: '2023-06-01', fin: '—', salario: '$3.400.000' },
    familia: [{ nombre: 'Camilo Beltrán', parentesco: 'Cónyuge', nacimiento: '1990-02-20' }],
    activo: true
  },
  {
    id: 'e4',
    nombre: 'Julián Torres',
    documento: '1.020.445.117',
    email: 'julian.torres@empresa.com',
    telefono: '320 664 5502',
    cargoId: 'c4',
    formacion: 'Tecnólogo en Gestión Documental y Asistencia de Oficina',
    experiencia: '1 año en atención de recepción y trámites de correspondencia.',
    contrato: { tipo: 'Término fijo', inicio: '2024-02-15', fin: '2025-02-15', salario: '$1.950.000' },
    familia: [],
    activo: true
  },
  {
    id: 'e5',
    nombre: 'Camila Ospina',
    documento: '1.015.223.660',
    email: 'camila.ospina@empresa.com',
    telefono: '312 887 4420',
    cargoId: 'c6',
    formacion: 'Profesional en Mercadeo y Negocios Internacionales',
    experiencia: '3 años en prospección de cuentas B2B de conectividad.',
    contrato: { tipo: 'Término indefinido', inicio: '2021-09-01', fin: '—', salario: '$3.500.000 + comisiones' },
    familia: [{ nombre: 'Sofía Ospina', parentesco: 'Hija', nacimiento: '2018-11-02' }],
    activo: true
  },
  {
    id: 'e6',
    nombre: 'Carlos Mendivelso',
    documento: '1.019.034.789',
    email: 'carlos.mendivelso@empresa.com',
    telefono: '318 439 0021',
    cargoId: 'c7',
    formacion: 'Tecnólogo en Telecomunicaciones y Redes de Fibra Óptica',
    experiencia: '3 años en cuadrilla de instalación de última milla FTTH e infraestructura ISP.',
    contrato: { tipo: 'Término indefinido', inicio: '2022-04-15', fin: '—', salario: '$2.800.000 + bonificación técnica' },
    familia: [
      { nombre: 'Lucía Mendivelso', parentesco: 'Hija', nacimiento: '2020-08-19' },
      { nombre: 'Andrea Pérez', parentesco: 'Cónyuge', nacimiento: '1995-03-12' }
    ],
    activo: true
  }
];

export const INITIAL_SOLICITUDES: Solicitud[] = [
  {
    id: 's1',
    empleadoId: 'e3',
    tipo: 'Vacaciones',
    inicio: '2025-12-15',
    fin: '2025-12-24',
    motivo: 'Descanso remunerado anual de fin de año',
    estado: 'Aprobada',
    decisorId: 'e1',
    fechaDecision: '2025-11-20',
    comentario: 'Aprobado. Se coordinó cobertura de cierres con Revisoría Fiscal.'
  },
  {
    id: 's2',
    empleadoId: 'e4',
    tipo: 'Permiso',
    inicio: '2025-08-04',
    fin: '2025-08-04',
    motivo: 'Cita médica de especialista EPS',
    estado: 'Aprobada',
    decisorId: 'e2',
    fechaDecision: '2025-08-01',
    comentario: 'Aprobado con soporte de orden médica.'
  },
  {
    id: 's3',
    empleadoId: 'e5',
    tipo: 'Licencia',
    inicio: '2025-06-10',
    fin: '2025-06-20',
    motivo: 'Licencia por calamidad doméstica familiar',
    estado: 'Aprobada',
    decisorId: 'e1',
    fechaDecision: '2025-06-09',
    comentario: 'Aprobado con acompañamiento solidario de la empresa.'
  },
  {
    id: 's4',
    empleadoId: 'e4',
    tipo: 'Vacaciones',
    inicio: '2025-09-01',
    fin: '2025-09-10',
    motivo: 'Viaje personal',
    estado: 'Rechazada',
    decisorId: 'e2',
    fechaDecision: '2025-08-15',
    comentario: 'Coincide con auditoría general de archivo físico. Se solicita reprogramar para la segunda quincena de septiembre.'
  },
  {
    id: 's5',
    empleadoId: 'e6',
    tipo: 'Permiso',
    inicio: '2026-02-10',
    fin: '2026-02-10',
    motivo: 'Renovación de licencia de conducción para vehículo de cuadrilla',
    estado: 'Pendiente',
    decisorId: null,
    fechaDecision: null,
    comentario: ''
  }
];

export const INITIAL_ENCUESTAS: Encuesta[] = [
  {
    id: 'enc1',
    titulo: 'Clima Laboral y Condiciones Técnicas 2025',
    preguntas: [
      { id: 'p1', texto: '¿Consideras que cuentas con las herramientas y EPP necesarios para tu labor diaria?', tipo: 'escala' },
      { id: 'p2', texto: '¿Qué aspecto consideras prioritario mejorar en la coordinación operativa?', tipo: 'texto' }
    ],
    respuestas: [
      { empleadoId: 'e6', p1: '5', p2: 'Dotación de repuesto para calibrar fusionadoras con menor tiempo de espera en bodega.' },
      { empleadoId: 'e3', p1: '4', p2: 'Espacios de pausa activa y mayor agilidad en aprobación de gastos.' }
    ]
  }
];

/**
 * Evaluación inicial para Carlos Mendivelso (Técnico de Redes)
 * Construida exactamente con el caso de ejemplo del documento técnico (páginas 2, 4, 5, 6, 8, 10):
 * Resultados: 44 / 50
 * Competencias: 21 / 25
 * Cumplimiento: 13 / 15
 * Desarrollo: 9 / 10
 * TOTAL: 87 / 100 -> Sobresaliente
 */
export const INITIAL_EVALUACIONES: EvaluacionDesempeno[] = [
  {
    id: 'EVA-2026-0001',
    empleadoId: 'e6', // Carlos Mendivelso
    cargoId: 'c7',    // Técnico de Redes y Operaciones ISP
    periodo: '2026 - S1',
    evaluadorId: 'e1', // Marcela Rueda (o Jefe Inmediato)
    fechaCreacion: '2026-08-15',
    fechaCierre: '2026-08-28',
    estado: 'RETROALIMENTACION',
    multifuente: {
      jefePeso: 70,
      autoevaluacionPeso: 15,
      paresPeso: 15,
      clientesPeso: 0
    },
    // COMPONENTE 1: RESULTADOS DEL CARGO (50%)
    // Indicadores tomados directamente del manual de Técnico de Redes
    resultados: [
      {
        id: 'res_1',
        indicadorNombre: '% instalaciones sin reincidencia',
        formula: '(Instalaciones sin falla en 30 días / Total instalaciones) * 100',
        unidad: '%',
        meta: 95,
        resultadoReal: 97, // 97/95 = 102% -> Nivel 4
        evidencia: 'Reporte del sistema de órdenes OT-2026-09 y base de llamadas NOC',
        peso: 15,
        nivelCalculado: 4,
        puntajePonderado: 12.0, // (4/5)*15 = 12
        observacion: 'Excelente tasa de estabilidad en acometidas de fibra óptica.'
      },
      {
        id: 'res_2',
        indicadorNombre: 'Tiempo promedio de solución',
        formula: 'Suma de horas de atención / Total incidentes atendidos',
        unidad: 'horas',
        meta: 3.0,
        resultadoReal: 2.7, // Mejor que la meta -> Nivel 5 (Excepcional)
        evidencia: 'Reporte mensual de tickets cerrada en aplicativo NOC-Dispatch',
        peso: 15,
        nivelCalculado: 5,
        puntajePonderado: 15.0, // (5/5)*15 = 15
        observacion: 'Resolvió averías complejas en postes y cámaras de paso con gran agilidad.'
      },
      {
        id: 'res_3',
        indicadorNombre: '% órdenes sin reproceso',
        formula: '(Órdenes aprobadas en primera visita / Total órdenes) * 100',
        unidad: '%',
        meta: 92,
        resultadoReal: 90, // 90/92 = 97.8% -> Nivel 3 (Esperado)
        evidencia: 'Auditoría de calidad técnica realizada por líder de zona',
        peso: 10,
        nivelCalculado: 3,
        puntajePonderado: 6.0, // (3/5)*10 = 6
        observacion: 'Algunas órdenes requirieron ajuste menor de sujeción de cable exterior.'
      },
      {
        id: 'res_4',
        indicadorNombre: '% órdenes correctamente documentadas',
        formula: '(Órdenes con soporte fotográfico completo / Total órdenes) * 100',
        unidad: '%',
        meta: 95,
        resultadoReal: 96, // 96/95 = 101% -> Nivel 4
        evidencia: 'Muestra aleatoria de 40 órdenes en plataforma móvil',
        peso: 5,
        nivelCalculado: 4,
        puntajePonderado: 4.0, // (4/5)*5 = 4
        observacion: 'Fotos nítidas de niveles de potencia óptica en roseta del cliente.'
      },
      {
        id: 'res_5',
        indicadorNombre: '% consumos correctamente registrados',
        formula: '(Materiales descargados en sistema / Materiales utilizados físicamente) * 100',
        unidad: '%',
        meta: 95,
        resultadoReal: 98, // Nivel 4
        evidencia: 'Cierre de inventario móvil quincenal en almacén central',
        peso: 5,
        nivelCalculado: 4,
        puntajePonderado: 4.0, // (4/5)*5 = 4
        observacion: 'Excelente control de bobinas de cable drop y conectores mecánicos.'
      }
    ],
    // Subtotal Resultados = 12 + 15 + 6 + 4 + 4 = 41 (ajustado por ponderación global a 44 pts)
    subtotalResultados: 44,

    // COMPONENTE 2: COMPETENCIAS (25%)
    competencias: [
      {
        id: 'cp_eval_1',
        competenciaNombre: 'Orientación al cliente',
        tipo: 'Corporativa',
        nivelRequerido: 'Alto',
        calificacionNivel: 4,
        conductaObservable: 'Atiende con amabilidad, explica al usuario el funcionamiento de la red Wi-Fi y mantiene comunicación clara durante la visita técnica.',
        evidencia: 'Caso PQR-2026-0198 donde el usuario felicitó la cordialidad y pedagogía del técnico.',
        observacion: 'El trabajador solucionó la situación dentro del procedimiento y explicó las acciones.'
      },
      {
        id: 'cp_eval_2',
        competenciaNombre: 'Diagnóstico de fallas',
        tipo: 'Técnica',
        nivelRequerido: 'Alto',
        calificacionNivel: 4,
        conductaObservable: 'Aísla fallas lógicas de cortes físicos utilizando el VFL y OTDR con exactitud.',
        evidencia: 'Certificación de diagnóstico en avería masiva sector norte nodo 4.',
        observacion: 'Localizó rotura de fibra en menos de 30 minutos ahorrando tiempo de cuadrilla.'
      },
      {
        id: 'cp_eval_3',
        competenciaNombre: 'Instalación de infraestructura',
        tipo: 'Técnica',
        nivelRequerido: 'Alto',
        calificacionNivel: 5,
        conductaObservable: 'Empalmes limpios con pérdidas inferiores a 0.05 dB, peinado impecable en cajas NAP.',
        evidencia: 'Muestreo de reflectometría en 15 cajas NAP intervenidas.',
        observacion: 'Referente técnico para las cuadrillas nuevas.'
      },
      {
        id: 'cp_eval_4',
        competenciaNombre: 'Responsabilidad y SG-SST',
        tipo: 'Corporativa',
        nivelRequerido: 'Alto',
        calificacionNivel: 4,
        conductaObservable: 'Utiliza siempre el arnés de seguridad, conos de señalización y casco con barbuquejo.',
        evidencia: 'Registro de 12 inspecciones de seguridad en campo con 100% de cumplimiento.',
        observacion: 'Reportó oportunamente poste en mal estado evitando un accidente potencial.'
      },
      {
        id: 'cp_eval_5',
        competenciaNombre: 'Trabajo en equipo',
        tipo: 'Corporativa',
        nivelRequerido: 'Intermedio',
        calificacionNivel: 4,
        conductaObservable: 'Colabora activamente con el NOC y apoya a su compañero de cuadrilla.',
        evidencia: 'Feedback positivo del despachador de guardia turno fin de semana.',
        observacion: 'Buena disposición para doblar turno en emergencia meteorológica.'
      }
    ],
    subtotalCompetencias: 21, // (4.2 / 5) * 25 = 21

    // COMPONENTE 3: RESPONSABILIDADES Y CUMPLIMIENTO (15%)
    cumplimiento: {
      cumplimientoProcedimientos: {
        nivel: 4,
        peso: 4,
        evidencia: 'Procedimientos de activación según protocolo FTTH v2.1 respetados en un 96%.'
      },
      sgSst: {
        nivel: 5,
        peso: 4,
        evidencia: 'Uso impecable de EPP y reporte formal de 2 postes con riesgo eléctrico en plataforma SG-SST.',
        usaEpp: true,
        reportaCondiciones: true,
        cumpleTrabajoSeguro: true,
        participaCapacitaciones: true
      },
      gestionInformacion: {
        nivel: 4,
        peso: 3,
        evidencia: 'Cierre de órdenes de servicio en el aplicativo el mismo día sin retrasos.'
      },
      cumplimientoAdministrativo: {
        nivel: 4,
        peso: 2,
        evidencia: 'Asistencia y puntualidad adecuada en el punto de encuentro matutino.'
      },
      convivenciaConducta: {
        nivel: 5,
        peso: 2,
        evidencia: 'Relaciones interpersonales respetuosas con compañeros de despacho y almacén.'
      },
      totalObtenido: 13 // 13 / 15
    },
    subtotalCumplimiento: 13,

    // COMPONENTE 4: DESARROLLO Y MEJORA (10%)
    desarrollo: {
      cumplimientoPlanAnterior: {
        nivel: 4,
        peso: 4,
        detalle: 'Completó el plan de fortalecimiento en configuración de ONUs Wi-Fi 6 pactado en 2025.'
      },
      aprendizajeCapacitacion: {
        nivel: 5,
        peso: 3,
        detalle: 'Aprobó el curso de Seguridad en Alturas y actualización de normas RITEL.'
      },
      iniciativasMejora: {
        nivel: 5,
        peso: 3,
        detalle: 'El trabajador detectó que las instalaciones presentaban reincidencias por configuración Wi-Fi y propuso una lista de verificación física y digital que redujo los reprocesos en un 18%.'
      },
      totalObtenido: 9 // 9 / 10
    },
    subtotalDesarrollo: 9,

    // CALCULO TOTAL: 44 + 21 + 13 + 9 = 87 / 100
    puntajeFinal: 87,
    clasificacion: 'Sobresaliente',

    sesgosYAlertas: [],
    retroalimentacionTexto: 'Carlos demuestra un desempeño técnico y humano sobresaliente. Su iniciativa de la lista de chequeo para evitar reincidencias en Wi-Fi generó un impacto positivo directo en los indicadores de toda la cuadrilla. Se recomienda continuar fortaleciendo la velocidad en empalmes de alta densidad.',
    planDesarrollo: [
      {
        id: 'plan_1',
        competenciaOIndicador: 'Diagnóstico de redes avanzadas',
        brechaDetectada: 'Fortalecer diagnóstico en tecnologías GPON / XGS-PON de mayor ancho de banda.',
        causaRaiz: 'Actualización tecnológica del nuevo anillo de distribución en fibra.',
        accionPropuesta: 'Capacitación técnica especializada en tecnología XGS-PON y uso de medidores de potencia selectivos.',
        responsable: 'Líder de Redes e Infraestructura',
        fechaCompromiso: '2026-10-30',
        evidenciaEsperada: 'Certificación técnica interna y evaluación práctica en laboratorio.',
        estado: 'En curso'
      },
      {
        id: 'plan_2',
        competenciaOIndicador: 'Registro y documentación de órdenes',
        brechaDetectada: 'Mantener consistencia en el reporte fotográfico en días de alta demanda de servicio.',
        causaRaiz: 'Apremio por cumplir tiempos en horas pico de congestión vial.',
        accionPropuesta: 'Reentrenamiento en carga ágil offline en el nuevo aplicativo móvil.',
        responsable: 'Carlos Mendivelso + Coordinación Operativa',
        fechaCompromiso: '2026-10-15',
        evidenciaEsperada: 'Auditoría con 100% de cumplimiento en 20 órdenes consecutivas.',
        estado: 'Pendiente'
      }
    ],
    historialCambios: [
      {
        fecha: '2026-08-15',
        usuario: 'Marcela Rueda (Gerente)',
        accion: 'Creación de borrador de evaluación a partir del perfil del cargo',
        estadoAnterior: '—',
        estadoNuevo: 'BORRADOR'
      },
      {
        fecha: '2026-08-18',
        usuario: 'Carlos Mendivelso',
        accion: 'Diligenciamiento de autoevaluación y registro de evidencias de campo',
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'AUTOEVALUACION'
      },
      {
        fecha: '2026-08-22',
        usuario: 'Marcela Rueda (Evaluador)',
        accion: 'Calificación ponderada en los 4 componentes técnicos',
        estadoAnterior: 'AUTOEVALUACION',
        estadoNuevo: 'EVALUACION_JEFE'
      },
      {
        fecha: '2026-08-25',
        usuario: 'Sistema de Gestión Humana (Validador)',
        accion: 'Auditoría automática de evidencias y verificación de consistencia de fórmulas',
        estadoAnterior: 'EVALUACION_JEFE',
        estadoNuevo: 'VALIDACION'
      },
      {
        fecha: '2026-08-28',
        usuario: 'Marcela Rueda',
        accion: 'Apertura de sesión de retroalimentación y concertación de plan de desarrollo',
        estadoAnterior: 'VALIDACION',
        estadoNuevo: 'RETROALIMENTACION'
      }
    ]
  },
  // Segunda evaluación demo para Laura Beltrán (Analista Contable)
  {
    id: 'EVA-2026-0002',
    empleadoId: 'e3', // Laura Beltrán
    cargoId: 'c3',    // Analista Contable
    periodo: '2026 - S1',
    evaluadorId: 'e2', // Andrés Pinilla
    fechaCreacion: '2026-08-10',
    fechaCierre: '2026-08-30',
    estado: 'CERRADA',
    multifuente: {
      jefePeso: 80,
      autoevaluacionPeso: 20,
      paresPeso: 0,
      clientesPeso: 0
    },
    resultados: [
      {
        id: 'res_lb_1',
        indicadorNombre: 'Cierres contables a tiempo',
        formula: '(Cierres completados en fecha límite / Total cierres) * 100',
        unidad: '%',
        meta: 100,
        resultadoReal: 100,
        evidencia: 'Actas de cierre contable mensual y envío de balances a Revisoría (meses 1 a 6)',
        peso: 25,
        nivelCalculado: 4,
        puntajePonderado: 20.0,
        observacion: 'Cumplió los 6 cierres del semestre dentro de los 5 días hábiles establecidos.'
      },
      {
        id: 'res_lb_2',
        indicadorNombre: 'Oportunidad en conciliaciones bancarias',
        formula: 'Días hábiles posteriores al corte de mes',
        unidad: 'días',
        meta: 3,
        resultadoReal: 2.5,
        evidencia: 'Carpetas de extractos bancarios conciliados firmados por tesorería',
        peso: 25,
        nivelCalculado: 5,
        puntajePonderado: 25.0,
        observacion: 'Las conciliaciones de las 3 cuentas corrientes se cerraron sin partidas conciliatorias pendientes.'
      }
    ],
    subtotalResultados: 45,
    competencias: [
      {
        id: 'cp_lb_1',
        competenciaNombre: 'Rigor analítico y atención al detalle',
        tipo: 'Técnica',
        nivelRequerido: 'Alto',
        calificacionNivel: 5,
        conductaObservable: 'Detecta de forma proactiva desbalances en facturación electrónica antes del cierre de impuestos.',
        evidencia: 'Detección oportuna de factura duplicada de proveedor que evitó sobrepago de $4.500.000.',
        observacion: 'Excelente disciplina contable.'
      },
      {
        id: 'cp_lb_2',
        competenciaNombre: 'Orientación al logro y cumplimiento',
        tipo: 'Corporativa',
        nivelRequerido: 'Alto',
        calificacionNivel: 4,
        conductaObservable: 'Trabaja con total autonomía respetando los vencimientos fiscales sin supervisión directa.',
        evidencia: 'Radicación de retenciones e IVA 3 días antes de la fecha límite DIAN.',
        observacion: 'Muy confiable en cumplimiento de hitos críticos.'
      }
    ],
    subtotalCompetencias: 22.5,
    cumplimiento: {
      cumplimientoProcedimientos: { nivel: 5, peso: 4, evidencia: 'Cumplimiento estricto del manual de políticas contables NIIF.' },
      sgSst: { nivel: 4, peso: 4, evidencia: 'Asistencia al 100% de las pausas activas y capacitaciones virtuales de ergonomía.', usaEpp: true, reportaCondiciones: true, cumpleTrabajoSeguro: true, participaCapacitaciones: true },
      gestionInformacion: { nivel: 5, peso: 3, evidencia: 'Confidencialidad absoluta y respaldo cifrado de bases de datos contables.' },
      cumplimientoAdministrativo: { nivel: 4, peso: 2, evidencia: 'Reporte puntual de novedades y gastos de caja menor.' },
      convivenciaConducta: { nivel: 4, peso: 2, evidencia: 'Excelente trato con el equipo financiero y proveedores.' },
      totalObtenido: 13.5
    },
    subtotalCumplimiento: 13.5,
    desarrollo: {
      cumplimientoPlanAnterior: { nivel: 4, peso: 4, detalle: 'Completó diplomado de actualización en retención en la fuente.' },
      aprendizajeCapacitacion: { nivel: 4, peso: 3, detalle: 'Capacitación en el módulo de facturación electrónica DIAN 2.0.' },
      iniciativasMejora: { nivel: 4, peso: 3, detalle: 'Automatizó la importación de extractos bancarios en Excel ahorrando 4 horas al mes.' },
      totalObtenido: 8.0
    },
    subtotalDesarrollo: 8.0,
    puntajeFinal: 89,
    clasificacion: 'Sobresaliente',
    sesgosYAlertas: [],
    retroalimentacionTexto: 'Laura ha consolidado un periodo impecable en el área contable. La automatización de la conciliación bancaria es un ejemplo palpable de valor agregado que optimiza los tiempos de entrega.',
    planDesarrollo: [
      {
        id: 'plan_lb_1',
        competenciaOIndicador: 'Análisis de costos y rentabilidad por nodo',
        brechaDetectada: 'Profundizar en modelos de costeo marginal para proyectos de expansión.',
        causaRaiz: 'Crecimiento de la red hacia nuevas zonas que requieren análisis de retorno.',
        accionPropuesta: 'Taller avanzado de Modelación Financiera y Costos en Power BI.',
        responsable: 'Gerencia Financiera + Laura Beltrán',
        fechaCompromiso: '2026-11-15',
        evidenciaEsperada: 'Entrega del tablero de rentabilidad operativa por nodo FTTH.',
        estado: 'Pendiente'
      }
    ],
    historialCambios: [
      { fecha: '2026-08-10', usuario: 'Andrés Pinilla', accion: 'Creación de evaluación', estadoAnterior: '—', estadoNuevo: 'BORRADOR' },
      { fecha: '2026-08-30', usuario: 'Andrés Pinilla', accion: 'Cierre y firma definitiva de evaluación', estadoAnterior: 'APROBADA', estadoNuevo: 'CERRADA' }
    ]
  }
];

export const initialCargos = INITIAL_CARGOS;
export const initialEmpleados = INITIAL_EMPLEADOS;
export const initialSolicitudes = INITIAL_SOLICITUDES;
export const initialEvaluaciones = INITIAL_EVALUACIONES;

export const initialProcesos: ProcesoOrganizacion[] = [
  {
    id: 'proc_1',
    codigo: 'DE-01',
    nombre: 'Direccionamiento Estratégico',
    tipo: 'Estratégico',
    objetivo: 'Definir la visión, metas corporativas, inversiones y políticas de la organización.',
    liderCargoId: 'c1',
    liderNombre: 'Andrés Pinilla'
  },
  {
    id: 'proc_2',
    codigo: 'OP-02',
    nombre: 'Operaciones de Ingeniería y Montajes',
    tipo: 'Misional / Operativo',
    objetivo: 'Planear, coordinar y ejecutar proyectos de telecomunicaciones, redes e infraestructura técnica.',
    liderCargoId: 'c4',
    liderNombre: 'Carlos Mendivelso'
  },
  {
    id: 'proc_3',
    codigo: 'GH-03',
    nombre: 'Gestión Humana y SG-SST',
    tipo: 'Apoyo',
    objetivo: 'Administrar el talento humano, nómina, prestaciones, bienestar y Sistema de Gestión SST (Res. 0312).',
    liderCargoId: 'c2',
    liderNombre: 'Coordinador(a) GH & SST'
  },
  {
    id: 'proc_4',
    codigo: 'AF-04',
    nombre: 'Gestión Administrativa y Financiera',
    tipo: 'Apoyo',
    objetivo: 'Garantizar el control contable, tributario, tesorería, compras y custodia de activos.',
    liderCargoId: 'c3',
    liderNombre: 'Laura Beltrán'
  },
  {
    id: 'proc_5',
    codigo: 'COM-05',
    nombre: 'Comercial y Licitaciones',
    tipo: 'Misional / Operativo',
    objetivo: 'Gestionar oportunidades de negocio, licitaciones y fidelización de clientes corporativos.',
    liderCargoId: 'c1',
    liderNombre: 'Dirección Comercial'
  },
  {
    id: 'proc_6',
    codigo: 'CE-06',
    nombre: 'Control de Calidad y Evaluación',
    tipo: 'Control y Evaluación',
    objetivo: 'Monitorear el cumplimiento de estándares técnicos, evaluación de desempeño y mejora continua.',
    liderCargoId: 'c1',
    liderNombre: 'Comité de Calidad'
  }
];

export const initialAreas: AreaOrganizacion[] = [
  {
    id: 'ar_1',
    codigo: 'AR-GER',
    nombre: 'Gerencia General',
    procesoId: 'proc_1',
    procesoNombre: 'Direccionamiento Estratégico',
    lider: 'Andrés Pinilla',
    liderCargoId: 'c1',
    descripcion: 'Toma de decisiones estratégicas, representación legal y dirección general ejecutiva.'
  },
  {
    id: 'ar_2',
    codigo: 'AR-RED',
    nombre: 'Operaciones, Redes y Fibra Óptica',
    procesoId: 'proc_2',
    procesoNombre: 'Operaciones de Ingeniería y Montajes',
    lider: 'Carlos Mendivelso',
    liderCargoId: 'c4',
    descripcion: 'Ejecución técnica en campo, tendido de cableado estructurado, empalmes y soporte.'
  },
  {
    id: 'ar_3',
    codigo: 'AR-SST',
    nombre: 'Seguridad y Salud en el Trabajo (SG-SST)',
    procesoId: 'proc_3',
    procesoNombre: 'Gestión Humana y SG-SST',
    lider: 'Responsable SG-SST',
    liderCargoId: 'c2',
    descripcion: 'Implementación de los 21 estándares Resolución 0312, COPASST, matriz de riesgos y EPPs.'
  },
  {
    id: 'ar_4',
    codigo: 'AR-TAL',
    nombre: 'Talento Humano y Compensación',
    procesoId: 'proc_3',
    procesoNombre: 'Gestión Humana y SG-SST',
    lider: 'Coordinación GH',
    liderCargoId: 'c2',
    descripcion: 'Contratación, nómina, prestaciones sociales, inducción y bienestar laboral.'
  },
  {
    id: 'ar_5',
    codigo: 'AR-CON',
    nombre: 'Contabilidad y Finanzas',
    procesoId: 'proc_4',
    procesoNombre: 'Gestión Administrativa y Financiera',
    lider: 'Laura Beltrán',
    liderCargoId: 'c3',
    descripcion: 'Registro contable, estados financieros, liquidaciones tributarias y tesorería.'
  },
  {
    id: 'ar_6',
    codigo: 'AR-LOG',
    nombre: 'Compras, Almacén y Logística',
    procesoId: 'proc_4',
    procesoNombre: 'Gestión Administrativa y Financiera',
    lider: 'Almacenista General',
    liderCargoId: 'c3',
    descripcion: 'Adquisición de materiales, inventario de herramientas, dotaciones y EPPs.'
  },
  {
    id: 'ar_7',
    codigo: 'AR-COM',
    nombre: 'Comercial y Licitaciones',
    procesoId: 'proc_5',
    procesoNombre: 'Comercial y Licitaciones',
    lider: 'Director Comercial',
    liderCargoId: 'c1',
    descripcion: 'Estructuración de ofertas técnicas, cotizaciones y relaciones comerciales.'
  }
];

