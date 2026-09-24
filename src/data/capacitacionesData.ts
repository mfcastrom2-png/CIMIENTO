import { Capacitacion } from '../types';

export const CAPACITACIONES_INICIALES: Capacitacion[] = [
  {
    id: 'cap_01',
    codigo: '001',
    titulo: 'Seguridad Integral en Alturas, Rescate y Trabajo Seguro en Redes FTTH (Res. 4272 de 2021)',
    objetivo: 'Capacitar y validar las competencias técnicas del personal operativo en el uso correcto de equipos de protección contra caídas, verificación de puntos de anclaje, diligenciamiento del permiso de trabajo y respuesta inicial ante emergencias en postería.',
    tipo: 'SST',
    facilitador: 'Ing. Paula Andrea Salazar',
    entidadFacilitadora: 'ARL Positiva & Centro de Entrenamiento Andino',
    duracionHoras: 8,
    modalidad: 'Presencial',
    fechaProgramada: '2026-03-25',
    horaInicio: '08:00 AM',
    lugarOEnlace: 'Centro de Entrenamiento Técnico Especializado - Pista de Alturas',
    cargosAsignados: ['c7'], // Técnico de Redes y Operaciones ISP
    estado: 'Programada',
    examenConocimiento: {
      id: 'ex_cap_01',
      titulo: 'Evaluación Técnica de Competencias: Trabajo Seguro en Alturas y Res. 4272/2021',
      instrucciones: 'Lea atentamente cada enunciado. Para aprobar esta capacitación y obtener su constancia oficial con validez SST, debe obtener mínimo el 80% de aciertos. Las respuestas incorrectas presentarán retroalimentación técnica inmediata.',
      notaMinimaAprobatoria: 80,
      tiempoLimiteMinutos: 20,
      preguntas: [
        {
          id: 'p1_1',
          enunciado: 'De acuerdo con el artículo 2 de la Resolución 4272 de 2021 del Ministerio del Trabajo, ¿a partir de qué altura se considera obligatorio el cumplimiento de los estándares de trabajo seguro en alturas en Colombia?',
          opciones: [
            'A partir de 1.50 metros sobre el nivel inferior.',
            'A partir de 2.00 metros sobre el nivel inferior.',
            'A partir de 1.80 metros únicamente en el sector de la construcción.',
            'A partir de 2.50 metros si se cuenta con escalera certificada.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'La Resolución 4272 de 2021 actualizó el umbral normativo en Colombia a 2.00 metros o más sobre un nivel inferior, con el fin de armonizar con estándares internacionales OSHA/ANSI.',
          puntos: 20
        },
        {
          id: 'p1_2',
          enunciado: '¿Cuál es la resistencia mínima certificada que debe soportar un punto de anclaje estructural individual por cada trabajador conectado?',
          opciones: [
            '2.000 libras-fuerza (8.9 kN).',
            '3.600 libras-fuerza (16 kN).',
            '5.000 libras-fuerza (22.2 kN) por persona.',
            '10.000 libras-fuerza (44.4 kN).'
          ],
          opcionCorrectaIndice: 2,
          explicacionRespuesta: 'La normativa técnica (ANSI Z359 y Res. 4272 Art. 12) exige que todo punto de anclaje fijo o móvil resista como mínimo 5.000 lbf (22.2 kN) por cada trabajador acoplado.',
          puntos: 20
        },
        {
          id: 'p1_3',
          enunciado: 'Antes de iniciar cualquier labor de empalme o tendido en postería urbana compartida con energía, ¿qué documento debe diligenciarse y validarse de forma obligatoria en el sitio de trabajo?',
          opciones: [
            'Solo el comprobante de entrega de materiales al cliente.',
            'El Permiso de Trabajo en Alturas y la lista de chequeo / Análisis de Trabajo Seguro (ATS).',
            'Una llamada telefónica al coordinador de operaciones.',
            'El recibo de pago de la planilla de seguridad social PILA.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'El Permiso de Trabajo en Alturas emitido y verificado por el coordinador de trabajo en alturas junto con el ATS en sitio es un requisito legal no delegable antes de iniciar la actividad.',
          puntos: 20
        },
        {
          id: 'p1_4',
          enunciado: 'Durante la inspección pre-operacional de un arnés de cuerpo entero, se detecta que una de las reatas principales tiene una quemadura superficial y fibras deshilachadas. ¿Cuál es el procedimiento técnico obligatorio?',
          opciones: [
            'Reforzar la zona afectada con cinta aislante de alta resistencia y continuar el turno.',
            'Utilizarlo únicamente para labores de corta duración (< 30 minutos).',
            'Retirarlo inmediatamente de servicio, marcarlo como NO APTO y entregarlo a SST para su destrucción formal.',
            'Informar al finalizar la semana en el comité de calidad.'
          ],
          opcionCorrectaIndice: 2,
          explicacionRespuesta: 'Cualquier daño estructural en reatas, costuras de carga o herrajes metálicos anula la certificación del equipo. Debe sacarse de servicio de inmediato para prevenir accidentes fatales.',
          puntos: 20
        },
        {
          id: 'p1_5',
          enunciado: '¿Por qué se debe utilizar una eslinga con absorbedor de choque (desacelerador) en caídas libres superiores a 60 centímetros?',
          opciones: [
            'Para que la cuerda no se ensucie al entrar en contacto con el poste.',
            'Para disipar la energía cinética y limitar la fuerza de impacto sobre el cuerpo del trabajador a menos de 1.800 libras (8 kN).',
            'Para alargar la distancia de descenso y llegar más rápido al suelo.',
            'Es un requisito estético sin implicaciones biomecánicas.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'El absorbedor de impacto se despliega para disipar la energía de la frenada, impidiendo lesiones internas en columna o pelvis al limitar la fuerza a menos de 8 kN / 1.800 lbf.',
          puntos: 20
        }
      ]
    },
    participantes: [
      {
        empleadoId: 'e6', // Carlos Mendivelso (Técnico de Redes)
        cargoId: 'c7',
        asistenciaConfirmada: false,
        evaluacionPresentada: false
      }
    ]
  },
  {
    id: 'cap_02',
    codigo: '002',
    titulo: 'Ergonomía Aplicada, Cuidado Osteomuscular y Prevención de Riesgo Biomecánico en Oficinas',
    objetivo: 'Entrenar al personal administrativo en la adecuada graduación del puesto de trabajo, prevención del síndrome de túnel del carpo y rutinas activas de descongestión muscular y fatiga visual.',
    tipo: 'SST',
    facilitador: 'Dra. Liliana Gómez (Fisioterapeuta Ocupacional)',
    entidadFacilitadora: 'IPS Salud del Oriente',
    duracionHoras: 3,
    modalidad: 'Presencial',
    fechaProgramada: '2026-03-28',
    horaInicio: '02:30 PM',
    lugarOEnlace: 'Sala de Capacitación Sede Central',
    cargosAsignados: ['c2', 'c3', 'c4', 'c6'], // Coordinador Admin, Contador, Asistente, Comercial
    estado: 'Programada',
    examenConocimiento: {
      id: 'ex_cap_02',
      titulo: 'Test de Conocimientos: Higiene Postural y Pausas Activas',
      instrucciones: 'Responda las 4 preguntas sobre higiene postural y hábitos saludables en pantalla. Se requiere 75% de aciertos para aprobar.',
      notaMinimaAprobatoria: 75,
      tiempoLimiteMinutos: 15,
      preguntas: [
        {
          id: 'p2_1',
          enunciado: '¿A qué altura debe estar ubicado el borde superior de la pantalla del monitor con respecto a los ojos del usuario?',
          opciones: [
            'Aproximadamente 30 centímetros por encima de la cabeza.',
            'A la misma altura de los ojos o ligeramente por debajo (ángulo de visión descendente de 10° a 20°).',
            'Al nivel del pecho para descansar los hombros.',
            'Cualquier ubicación es indiferente si se usan gafas.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'Tener el borde superior del monitor al nivel de los ojos previene la hiperextensión cervical y la fatiga del trapecio superior.',
          puntos: 25
        },
        {
          id: 'p2_2',
          enunciado: '¿Cuál es el ángulo biomecánico ideal que deben formar las rodillas y los codos al sentarse en el puesto de trabajo?',
          opciones: [
            'Un ángulo cerrado de 45° con las piernas cruzadas.',
            'Un ángulo aproximado de 90° a 100°, con los pies apoyados totalmente en el piso o apoyapiés.',
            'Un ángulo de 160° en hiperextensión.',
            'Cualquier ángulo donde la silla quede al máximo de elevación.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'El ángulo de 90°-100° facilita el retorno venoso, descarga la presión en las vértebras lumbares y evita puntos de compresión poplítea.',
          puntos: 25
        },
        {
          id: 'p2_3',
          enunciado: '¿Cuál es la frecuencia y duración recomendada para realizar pausas activas durante una jornada laboral continua de digitación?',
          opciones: [
            'Una sola pausa de 2 horas al final del turno.',
            'Mínimo dos pausas diarias de 5 a 10 minutos (una a media mañana y otra a media tarde).',
            'No es necesario realizar pausas si se tiene silla ergonómica.',
            'Cada 10 minutos detenerse durante 20 minutos.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'El estándar de salud ocupacional estipula dos momentos de descanso activo para reactivar la circulación y relajar los tendones flexores de los dedos.',
          puntos: 25
        },
        {
          id: 'p2_4',
          enunciado: 'Para evitar el síndrome del túnel carpiano al escribir en el teclado y usar el mouse, ¿cómo deben mantenerse las muñecas?',
          opciones: [
            'Dobladas hacia arriba en flexión dorsal máxima.',
            'En posición neutra y recta, sin doblar hacia arriba, abajo ni a los lados, utilizando pad mouse ergonómico.',
            'Apoyando todo el peso sobre la esquina metálica del escritorio.',
            'Con fuerza excesiva sobre el teclado numérico.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'La posición neutra de la articulación de la muñeca evita la compresión del nervio mediano dentro del canal del carpo.',
          puntos: 25
        }
      ]
    },
    participantes: [
      { empleadoId: 'e2', cargoId: 'c2', asistenciaConfirmada: false, evaluacionPresentada: false },
      { empleadoId: 'e3', cargoId: 'c3', asistenciaConfirmada: false, evaluacionPresentada: false },
      { empleadoId: 'e4', cargoId: 'c4', asistenciaConfirmada: false, evaluacionPresentada: false },
      { empleadoId: 'e5', cargoId: 'c6', asistenciaConfirmada: false, evaluacionPresentada: false }
    ]
  },
  {
    id: 'cap_03',
    codigo: '003',
    titulo: 'Protección de Datos Personales (Habeas Data - Ley 1581 de 2012) y Confidencialidad en la Empresa',
    objetivo: 'Concientizar a todos los colaboradores en el manejo ético, custodia de datos personales de clientes y empleados, confidencialidad salarial y reporte oportuno de incidentes de seguridad de la información.',
    tipo: 'Normativa y Cumplimiento',
    facilitador: 'Dra. Claudia Vengoechea (Especialista en Derecho Informático)',
    entidadFacilitadora: 'Asesoría Jurídica Corporativa',
    duracionHoras: 4,
    modalidad: 'Virtual sincrónica',
    fechaProgramada: '2026-04-04',
    horaInicio: '09:00 AM',
    lugarOEnlace: 'Google Meet / Plataforma Corporativa',
    cargosAsignados: ['TODOS'],
    estado: 'Programada',
    examenConocimiento: {
      id: 'ex_cap_03',
      titulo: 'Examen de Cumplimiento: Ley 1581 de 2012 y Confidencialidad de la Información',
      instrucciones: 'Examen obligatorio para todos los colaboradores de B GROUP INGENIERIA S.A.S. Nota aprobatoria: 80%.',
      notaMinimaAprobatoria: 80,
      tiempoLimiteMinutos: 15,
      preguntas: [
        {
          id: 'p3_1',
          enunciado: 'Según la Ley 1581 de 2012, ¿qué es un "Dato Sensible"?',
          opciones: [
            'El nombre completo de una persona en su cédula.',
            'Aquel que afecta la intimidad del Titular o cuyo uso indebido puede generar discriminación (salud, orientación sexual, datos biométricos, etc.).',
            'La dirección de la página web de una empresa proveedora.',
            'El número de teléfono fijo de la recepción de la empresa.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'Los datos sensibles tienen protección reforzada por ley ya que su divulgación no autorizada puede lesionar gravemente la esfera privada de la persona.',
          puntos: 25
        },
        {
          id: 'p3_2',
          enunciado: '¿Por qué la información de nómina y salarios de los colaboradores de la empresa tiene acceso restringido exclusivo a la Dirección de Gestión Humana y Gerencia?',
          opciones: [
            'Por capricho de los directivos para que nadie sepa cuánto ganan los demás.',
            'Porque los datos financieros, bancarios y salariales son privados y confidenciales protegidos por el deber de reserva legal y la Ley 1581 de 2012.',
            'Porque el sistema no tiene suficiente espacio para compartir los archivos.',
            'No es confidencial, cualquier colaborador puede solicitar la nómina de sus compañeros.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'La remuneración salarial y deducciones personales constituyen datos privados de naturaleza socioeconómica que no pueden ser divulgados sin autorización expresa del titular.',
          puntos: 25
        },
        {
          id: 'p3_3',
          enunciado: 'Si un cliente corporativo solicita por teléfono que le entreguemos la base de datos de usuarios o empleados de la empresa, ¿cuál es la conducta debida?',
          opciones: [
            'Enviarla inmediatamente por WhatsApp para no perder el cliente.',
            'Explicar que la información es confidencial y no se suministra sin autorización formal, canalizando la petición por el protocolo oficial de PQRS y Oficial de Protección de Datos.',
            'Cobrarle un valor adicional y entregarla en una memoria USB.',
            'Ignorar el mensaje y no responder nada.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'La entrega de bases de datos a terceros sin consentimiento informado constituye una infracción gravísima sancionable con multas de la Superintendencia de Industria y Comercio.',
          puntos: 25
        },
        {
          id: 'p3_4',
          enunciado: '¿Qué principio de la Ley 1581 exige que los datos personales solo sean tratados durante el tiempo razonable y para la finalidad que motivó su autorización?',
          opciones: [
            'Principio de Libertad.',
            'Principio de Temporalidad o Caducidad y Principio de Finalidad.',
            'Principio de Lucro Cesante.',
            'Principio de Presunción de Inocencia.'
          ],
          opcionCorrectaIndice: 1,
          explicacionRespuesta: 'Los principios de finalidad y temporalidad determinan que los datos no pueden conservarse indefinidamente ni utilizarse para fines distintos a los previamente autorizados.',
          puntos: 25
        }
      ]
    },
    participantes: [
      { empleadoId: 'e1', cargoId: 'c1', asistenciaConfirmada: false, evaluacionPresentada: false },
      { empleadoId: 'e2', cargoId: 'c2', asistenciaConfirmada: false, evaluacionPresentada: false },
      { empleadoId: 'e3', cargoId: 'c3', asistenciaConfirmada: false, evaluacionPresentada: false },
      { empleadoId: 'e4', cargoId: 'c4', asistenciaConfirmada: false, evaluacionPresentada: false },
      { empleadoId: 'e5', cargoId: 'c6', asistenciaConfirmada: false, evaluacionPresentada: false },
      { empleadoId: 'e6', cargoId: 'c7', asistenciaConfirmada: false, evaluacionPresentada: false }
    ]
  }
];
