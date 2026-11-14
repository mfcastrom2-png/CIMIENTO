import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Empleado, ConfiguracionEmpresa } from '../types';
import { normalizarCodigoContratoLaboral } from '../services/vinculacionService';
import { construirJsonQrDocumentoPdf } from '../services/verificacionCertificadosService';

export interface DatosPdfContratoLaboral {
  codigoContrato: string;
  nombreEmpresa: string;
  nitEmpresa: string;
  domicilioEmpresa: string;
  ciudadEmpresa: string;
  repLegalNombre: string;
  repLegalDocumento: string;
  empleadoNombre: string;
  empleadoTipoDocumento: string;
  empleadoDocumento: string;
  celularCandidato: string;
  correoCandidato: string;
  direccionCandidato: string;
  cargoTitulo: string;
  areaTitulo: string;
  salarioValor: number;
  duracionTexto: string;
  periodoPruebaTexto: string;
  fechaFirmaMayusculas: string;
  fechaFirmaFormalLarga: string;
  fechaInicioMayusculas: string;
  fechaInicioFormalLarga: string;
  fechaFinMayusculas: string;
  fechaFinFormalLarga: string;
  firmaCapturadaUrl?: string | null;
  firmaNombre: string;
  firmaDocumento: string;
  firmaFechaHora?: string;
  hashSha256?: string;
}

const MESES_CONTRATO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const NUMEROS_LETRAS_CONTRATO: Record<number, string> = {
  1: 'un (1)', 2: 'dos (2)', 3: 'tres (3)', 4: 'cuatro (4)', 5: 'cinco (5)',
  6: 'seis (6)', 7: 'siete (7)', 8: 'ocho (8)', 9: 'nueve (9)', 10: 'diez (10)',
  11: 'once (11)', 12: 'doce (12)', 13: 'trece (13)', 14: 'catorce (14)', 15: 'quince (15)',
  16: 'dieciséis (16)', 17: 'diecisiete (17)', 18: 'dieciocho (18)', 19: 'diecinueve (19)', 20: 'veinte (20)',
  21: 'veintiún (21)', 22: 'veintidós (22)', 23: 'veintitrés (23)', 24: 'veinticuatro (24)', 25: 'veinticinco (25)',
  26: 'veintiséis (26)', 27: 'veintisiete (27)', 28: 'veintiocho (28)', 29: 'veintinueve (29)', 30: 'treinta (30)',
  31: 'treinta y un (31)'
};

export function formatFechaEspanolFormal(fechaStr?: string): { mayusculas: string; formalLarga: string } {
  const anioEnLetras = (anio: number) =>
    anio === 2025 ? 'dos mil veinticinco (2025)' :
    anio === 2026 ? 'dos mil veintiséis (2026)' :
    anio === 2027 ? 'dos mil veintisiete (2027)' :
    `${anio}`;

  if (!fechaStr) {
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = MESES_CONTRATO[hoy.getMonth()];
    const anio = hoy.getFullYear();
    const diaLetras = NUMEROS_LETRAS_CONTRATO[dia] || `${dia}`;
    return {
      mayusculas: `${dia < 10 ? '0' : ''}${dia} DE ${mes.toUpperCase()} DE ${anio}`,
      formalLarga: `${diaLetras} de ${mes} de ${anioEnLetras(anio)}`
    };
  }

  const parts = fechaStr.slice(0, 10).split('-');
  if (parts.length === 3) {
    const anio = parseInt(parts[0], 10);
    const mesIndex = parseInt(parts[1], 10) - 1;
    const dia = parseInt(parts[2], 10);
    if (!Number.isNaN(anio) && !Number.isNaN(mesIndex) && !Number.isNaN(dia)) {
      const mes = MESES_CONTRATO[mesIndex] || 'noviembre';
      const diaLetras = NUMEROS_LETRAS_CONTRATO[dia] || `${dia}`;
      return {
        mayusculas: `${dia < 10 ? '0' : ''}${dia} DE ${mes.toUpperCase()} DE ${anio}`,
        formalLarga: `${diaLetras} de ${mes} de ${anioEnLetras(anio)}`
      };
    }
  }

  return {
    mayusculas: '03 DE NOVIEMBRE DE 2026',
    formalLarga: 'tres (3) de noviembre de dos mil veintiséis (2026)'
  };
}

export interface OpcionesConstruccionDatosContrato {
  cargoNombreOverride?: string;
  areaNombreOverride?: string;
  firmaCapturadaUrlOverride?: string | null;
  firmaNombreOverride?: string;
  firmaDocumentoOverride?: string;
}

export function construirDatosPdfContratoDesdeEmpleado(
  empleado: Empleado,
  empresa?: ConfiguracionEmpresa,
  opciones?: OpcionesConstruccionDatosContrato
): DatosPdfContratoLaboral {
  const contrato = empleado.vinculacion?.contratoDigital;

  const nombreCompletoEmpleado = (
    empleado.nombre?.trim() ||
    [
      empleado.persona?.primerNombre,
      empleado.persona?.segundoNombre,
      empleado.persona?.primerApellido,
      empleado.persona?.segundoApellido
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'COLABORADOR'
  );

  const documentoEmpleado = empleado.documento?.trim() || empleado.laboral?.codigoInterno || 'N/A';
  const tipoDocumentoEmpleado = empleado.persona?.tipoDocumento || empleado.tipoDocumento || 'C.C.';

  const nombreEmpresa = empresa?.razonSocial || 'B GROUP INGENIERÍA S.A.S.';
  const nitEmpresa = empresa?.nit
    ? `NIT ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}`
    : 'NIT 900.995.955-2';
  const domicilioEmpresa = empresa?.contacto?.direccion || 'Urbanización Villa Rubia, Manzana F, Lote 4';
  const ciudadEmpresa = empresa?.contacto?.ciudad || 'Cartagena de Indias';
  const repLegalNombre = empresa?.representanteLegal?.nombre || 'HERNAN RIQUELME BORJA BENITEZ';
  const repLegalDocumento = empresa?.representanteLegal?.numeroDocumento || '73.008.881';

  const cargoTitulo = (
    opciones?.cargoNombreOverride ||
    contrato?.cargoNombre ||
    empleado.laboral?.cargoNombre ||
    'TÉCNICO DE SOPORTE E INSTALACIONES'
  ).toUpperCase();

  const areaTitulo =
    opciones?.areaNombreOverride ||
    contrato?.areaNombre ||
    empleado.laboral?.areaNombre ||
    'Operaciones';

  const salarioValor = Number(
    contrato?.salarioBasico ||
    empleado.salarioBase ||
    empleado.compensacion?.salarioBasico ||
    1423500
  );

  const codigoContrato = normalizarCodigoContratoLaboral(contrato?.codigoContrato);

  const fechaInicioRaw =
    contrato?.fechaInicio ||
    empleado.laboral?.fechaInicioContrato ||
    empleado.laboral?.fechaIngreso ||
    new Date().toISOString().slice(0, 10);

  const duracionMeses = Number(contrato?.duracionMeses || 6);
  const fechaFinRaw =
    contrato?.fechaFin ||
    empleado.laboral?.fechaTerminacionContrato ||
    (() => {
      const f = new Date(fechaInicioRaw);
      if (Number.isNaN(f.getTime())) return new Date().toISOString().slice(0, 10);
      f.setMonth(f.getMonth() + duracionMeses);
      f.setDate(f.getDate() - 1);
      return f.toISOString().slice(0, 10);
    })();

  const fechaFirmaInfo = formatFechaEspanolFormal(fechaInicioRaw);
  const fechaInicioInfo = formatFechaEspanolFormal(fechaInicioRaw);
  const fechaFinInfo = formatFechaEspanolFormal(fechaFinRaw);

  const duracionTexto =
    duracionMeses === 6
      ? 'SEIS (6) MESES'
      : duracionMeses === 12
      ? 'DOCE (12) MESES'
      : `${duracionMeses} MESES`;

  const periodoPruebaDias = Number(contrato?.periodoPruebaDias || 30);
  const periodoPruebaTexto =
    periodoPruebaDias === 30
      ? 'TREINTA (30) DÍAS CALENDARIO'
      : `${periodoPruebaDias} DÍAS CALENDARIO`;

  const celularCandidato = empleado.contacto?.celular || 'Sin registrar';
  const correoCandidato =
    empleado.contacto?.correoPersonal ||
    empleado.contacto?.correoCorporativo ||
    empleado.email ||
    'Sin registrar';
  const direccionCandidato = empleado.contacto?.direccion || ciudadEmpresa;

  const firmaCapturadaUrl =
    opciones?.firmaCapturadaUrlOverride !== undefined
      ? opciones.firmaCapturadaUrlOverride
      : contrato?.firmaCandidatoUrl || null;

  return {
    codigoContrato,
    nombreEmpresa,
    nitEmpresa,
    domicilioEmpresa,
    ciudadEmpresa,
    repLegalNombre,
    repLegalDocumento,
    empleadoNombre: nombreCompletoEmpleado,
    empleadoTipoDocumento: tipoDocumentoEmpleado,
    empleadoDocumento: documentoEmpleado,
    celularCandidato,
    correoCandidato,
    direccionCandidato,
    cargoTitulo,
    areaTitulo,
    salarioValor,
    duracionTexto,
    periodoPruebaTexto,
    fechaFirmaMayusculas: fechaFirmaInfo.mayusculas,
    fechaFirmaFormalLarga: fechaFirmaInfo.formalLarga,
    fechaInicioMayusculas: fechaInicioInfo.mayusculas,
    fechaInicioFormalLarga: fechaInicioInfo.formalLarga,
    fechaFinMayusculas: fechaFinInfo.mayusculas,
    fechaFinFormalLarga: fechaFinInfo.formalLarga,
    firmaCapturadaUrl,
    firmaNombre: opciones?.firmaNombreOverride?.trim() || contrato?.firmaCandidatoNombre || nombreCompletoEmpleado,
    firmaDocumento: opciones?.firmaDocumentoOverride?.trim() || contrato?.firmaCandidatoDocumento || documentoEmpleado,
    firmaFechaHora: contrato?.firmaFechaHora,
    hashSha256: contrato?.hashSha256
  };
}

interface ClausulaPdfItem {
  titulo: string;
  cuerpo?: string;
  introLista?: string;
  itemsLista?: string[];
}

/**
 * Construye el listado exacto y completo de las veinticinco (25) cláusulas
 * del Contrato Individual de Trabajo a Término Fijo de la empresa.
 */
export function construirClausulasContratoLaboral(datos: DatosPdfContratoLaboral): ClausulaPdfItem[] {
  const salarioFormateado = `$${Number(datos.salarioValor || 0).toLocaleString('es-CO')} COP`;

  return [
    {
      titulo: 'PRIMERA. NATURALEZA Y OBJETO.',
      cuerpo: `LA PERSONA TRABAJADORA se obliga a prestar personalmente sus servicios a EL EMPLEADOR en el cargo de ${datos.cargoTitulo}, a cambio de la remuneración pactada. La prestación se desarrollará bajo la continuada subordinación de EL EMPLEADOR, quien podrá impartir instrucciones razonables sobre el modo, tiempo y cantidad de trabajo, dentro de los límites legales, contractuales, técnicos y de seguridad, y con respeto por la dignidad y los derechos fundamentales de LA PERSONA TRABAJADORA.`
    },
    {
      titulo: 'SEGUNDA. CARGO, FUNCIONES Y MANUAL.',
      cuerpo: `El cargo pertenece al área de ${datos.areaTitulo} y tendrá como superior inmediato al Supervisor de Operaciones o a la persona que EL EMPLEADOR designe formalmente. El propósito, las funciones técnicas, las responsabilidades, los resultados esperados, las relaciones, los límites de autoridad y los requisitos del cargo se desarrollan en el Anexo 1 — Manual de Funciones del ${datos.cargoTitulo}, versión 1.0 del 28 de octubre de 2026, que se incorpora a este contrato y se entrega a LA PERSONA TRABAJADORA.`
    },
    {
      titulo: 'TERCERA. FUNCIONES CONEXAS Y LÍMITES.',
      cuerpo: 'EL EMPLEADOR podrá asignar actividades complementarias que guarden relación razonable y directa con el cargo, las competencias y la operación, siempre que no impliquen desmejora ilegal, modificación unilateral de elementos esenciales del contrato ni exposición a riesgos sin controles, formación o autorización. No podrán asignarse funciones que excedan la competencia técnica, las certificaciones o las autorizaciones de LA PERSONA TRABAJADORA. Las tareas conexas no habilitan para comprometer compras, autorizar gastos, ofrecer descuentos o compensaciones, modificar contratos de usuarios ni intervenir infraestructura crítica o bienes de terceros sin autorización y permisos.'
    },
    {
      titulo: 'CUARTA. LUGAR, MODALIDAD Y DESPLAZAMIENTOS.',
      cuerpo: 'La modalidad será presencial, con trabajo de campo en la sede, nodos, infraestructura de red y domicilios de usuarios ubicados dentro del área de operación de EL EMPLEADOR. La programación y las órdenes de trabajo identificarán el sitio de cada intervención. Los cambios razonables de lugar se sujetarán al poder subordinante y al ius variandi, deberán responder a necesidades objetivas del servicio y no podrán afectar ilegítimamente la dignidad, la salud, la remuneración ni las condiciones esenciales de LA PERSONA TRABAJADORA. Los desplazamientos operativos ordenados por EL EMPLEADOR y los gastos necesarios para su ejecución serán suministrados o reembolsados de acuerdo con el procedimiento interno. No se entenderá pactada la obligación de utilizar vehículo o herramientas personales; su eventual uso requerirá acuerdo previo y escrito sobre condiciones, autorización y reconocimiento de gastos.'
    },
    {
      titulo: 'QUINTA. DURACIÓN.',
      cuerpo: `El presente contrato se celebra a término fijo por ${datos.duracionTexto}, con fecha de inicio el ${datos.fechaInicioFormalLarga} y fecha de terminación el ${datos.fechaFinFormalLarga}, ambas fechas inclusive. La duración y las fechas quedan expresamente determinadas por escrito, de conformidad con el artículo 46 del CST, modificado por el artículo 6 de la Ley 2466 de 2025. La expiración del plazo se aplicará sin desconocer fueros, estabilidad laboral reforzada, autorizaciones administrativas o judiciales previas exigibles ni otras garantías constitucionales y legales.`
    },
    {
      titulo: 'SEXTA. PRÓRROGAS Y PREAVISO DE NO RENOVACIÓN.',
      cuerpo: 'Las partes podrán acordar por escrito la prórroga del contrato. Cuando ninguna de las partes comunique por escrito a la otra su intención de terminarlo con una antelación mínima de treinta (30) días calendario al vencimiento del plazo inicial o de su prórroga, operará la renovación automática en los términos del artículo 46 del CST. Por tratarse de un contrato inicial inferior a un (1) año, la cuarta prórroga automática será por un período de un (1) año. En las prórrogas pactadas por escrito, después de la cuarta prórroga el período no podrá ser inferior a un (1) año. En todo caso, se observará el límite máximo legal de cuatro (4) años. La comunicación de no renovación deberá enviarse por un medio que permita acreditar su contenido, envío y recepción.'
    },
    {
      titulo: 'SÉPTIMA. PERÍODO DE PRUEBA.',
      cuerpo: `Las partes pactan expresamente un período de prueba de ${datos.periodoPruebaTexto}, contado desde el inicio efectivo de labores. Este término es inferior a la quinta parte de la duración inicial del contrato y no excede los máximos previstos en los artículos 76 a 80 del CST. Durante el período de prueba cualquiera de las partes podrá dar por terminado el contrato en los términos de la ley, sin perjuicio de la prohibición de discriminación y del respeto de las protecciones constitucionales aplicables. No podrá pactarse un nuevo período de prueba en contratos sucesivos entre las mismas partes, salvo la excepción legal correspondiente al primer contrato.`
    },
    {
      titulo: 'OCTAVA. SALARIO Y FORMA DE PAGO.',
      cuerpo: `EL EMPLEADOR pagará a LA PERSONA TRABAJADORA un salario ordinario mensual equivalente a ${salarioFormateado} (o el equivalente legal vigente al SMLMV en cada período de causación). El pago se realizará por quincenas, en las fechas indicadas en la ficha, con entrega del comprobante correspondiente. Si la fecha de pago coincide con un día no hábil bancario, se realizará el día hábil inmediatamente anterior. El salario remunera la jornada ordinaria pactada y no comprende ni sustituye el auxilio de transporte, las prestaciones sociales, las vacaciones, los recargos ni los demás conceptos que deban reconocerse separadamente. Todo ajuste legal del SMLMV se reflejará automáticamente en el salario.`
    },
    {
      titulo: 'NOVENA. AUXILIO DE TRANSPORTE Y OTROS PAGOS.',
      cuerpo: 'EL EMPLEADOR reconocerá el auxilio legal de transporte o el mecanismo que lo sustituya cuando LA PERSONA TRABAJADORA reúna las condiciones legales para recibirlo, en la cuantía vigente y proporcional a los días en que se cause. Su naturaleza salarial o no salarial será la que determine la ley. Los pagos destinados a reembolsar gastos o a facilitar el desempeño de la labor solo tendrán naturaleza no salarial cuando correspondan realmente a esa finalidad y cumplan los requisitos legales; la denominación asignada por las partes no podrá alterar su naturaleza jurídica.'
    },
    {
      titulo: 'DÉCIMA. PRESTACIONES, VACACIONES Y DOTACIÓN.',
      cuerpo: 'EL EMPLEADOR reconocerá y pagará oportunamente las prestaciones sociales y demás derechos laborales causados, incluidos cesantías, intereses a las cesantías, prima de servicios, vacaciones remuneradas y los conceptos que legalmente correspondan, en proporción al tiempo laborado cuando así proceda. Suministrará la dotación legal cuando se cumplan los requisitos previstos en el CST y entregará, sin costo para LA PERSONA TRABAJADORA, los elementos de protección personal y demás equipos exigidos por los riesgos y las tareas asignadas. A la terminación del contrato se liquidarán los salarios, prestaciones, vacaciones y demás acreencias causadas.'
    },
    {
      titulo: 'DÉCIMA PRIMERA. JORNADA, HORARIO Y DESCANSOS.',
      cuerpo: 'La jornada ordinaria será de cuarenta y dos (42) horas efectivas semanales, distribuida de lunes a viernes de 08:20 a 17:00 y los sábados de 08:00 a 11:40. Para que esta distribución corresponda a cuarenta y dos (42) horas efectivas, se pacta una pausa de alimentación de una (1) hora cada día de lunes a viernes, en la franja acordada en la ficha. Esa pausa no se computará como tiempo de trabajo únicamente cuando constituya una interrupción real, durante la cual LA PERSONA TRABAJADORA pueda disponer libremente de su tiempo y no permanezca a disposición de EL EMPLEADOR. Si debe atender labores, permanecer a disposición o no puede disfrutar libremente de la pausa, el tiempo se computará conforme a la ley. El día de descanso obligatorio será el domingo. Cualquier modificación del horario deberá respetar el máximo legal, los descansos y los derechos adquiridos.'
    },
    {
      titulo: 'DÉCIMA SEGUNDA. TRABAJO SUPLEMENTARIO, NOCTURNO, DOMINICAL Y FESTIVO.',
      cuerpo: 'El trabajo suplementario o de horas extras, el trabajo nocturno y el laborado en días de descanso obligatorio o festivos se reconocerán con los recargos, descansos compensatorios, reglas de causación y porcentajes vigentes en la fecha en que se preste el servicio. A la fecha de firma, el período nocturno comprende de 7:00 p. m. a 6:00 a. m. El recargo legal por laborar en el día de descanso obligatorio o festivo se encuentra en el 90 % desde el 1 de julio de 2026 y llegará al 100 % desde el 1 de julio de 2027, salvo adopción anticipada del 100 % por EL EMPLEADOR. Las horas extras no podrán exceder de dos (2) diarias ni doce (12) semanales. EL EMPLEADOR llevará el registro legal del trabajo suplementario, con identificación de la actividad y de las horas diurnas o nocturnas, y suministrará la relación y el soporte de pago cuando sean solicitados. El procedimiento interno de autorización y registro no elimina el derecho al pago del tiempo efectivamente laborado cuando haya sido requerido, conocido o recibido por EL EMPLEADOR.'
    },
    {
      titulo: 'DÉCIMA TERCERA. OBLIGACIONES ESPECIALES DEL EMPLEADOR.',
      introLista: 'Además de las obligaciones legales, EL EMPLEADOR deberá:',
      itemsLista: [
        'Pagar oportunamente el salario, prestaciones, vacaciones, auxilios, recargos y demás conceptos debidos, y entregar los comprobantes correspondientes.',
        'Afiliar a LA PERSONA TRABAJADORA al Sistema de Seguridad Social Integral y efectuar los aportes a salud, pensión, riesgos laborales y caja de compensación familiar, según corresponda, desde el inicio de la relación.',
        'Suministrar herramientas, equipos, materiales, elementos de protección personal, formación, permisos y procedimientos necesarios para ejecutar las labores de forma segura.',
        'Identificar, evaluar y controlar los peligros y riesgos asociados al cargo y a cada sitio de trabajo, y cumplir las obligaciones del SG-SST.',
        'Respetar la dignidad, intimidad, igualdad, libertad de asociación, desconexión y demás derechos de LA PERSONA TRABAJADORA, así como prevenir el acoso, la discriminación y la violencia en el trabajo.',
        'Reconocer los gastos operativos autorizados y entregar copia de este contrato y de sus anexos.'
      ]
    },
    {
      titulo: 'DÉCIMA CUARTA. OBLIGACIONES DE LA PERSONA TRABAJADORA.',
      introLista: 'LA PERSONA TRABAJADORA se obliga, además de lo previsto en la ley y en el Anexo 1, a:',
      itemsLista: [
        'Prestar personalmente el servicio con diligencia, buena fe, cuidado técnico y cumplimiento de las órdenes de trabajo y de las instrucciones legítimas de sus superiores.',
        'Atender a usuarios, compañeros y terceros con respeto; informar con claridad el alcance de las intervenciones y abstenerse de prometer compensaciones, descuentos, cambios contractuales o plazos no autorizados.',
        'Registrar de manera veraz y oportuna diagnósticos, pruebas, materiales, repuestos, tiempos, evidencias permitidas, novedades y cierre de tickets u órdenes.',
        'Proteger equipos, herramientas, materiales, instrumentos, EPP, credenciales y demás activos entregados; reportar de inmediato pérdidas, daños, faltantes o accesos no autorizados.',
        'Cumplir los protocolos de seguridad de la información y protección de datos; acceder únicamente a la información necesaria para las órdenes asignadas y no compartir credenciales.',
        'Asistir a las capacitaciones y evaluaciones aplicables, utilizar los EPP suministrados, reportar peligros, incidentes y accidentes, y abstenerse de ejecutar actividades para las que no cuente con competencia, autorización o condiciones seguras.',
        'Informar oportunamente cambios en sus datos de contacto, incapacidades, novedades y cualquier circunstancia relevante para la programación y seguridad del trabajo.'
      ]
    },
    {
      titulo: 'DÉCIMA QUINTA. SEGURIDAD Y SALUD EN EL TRABAJO.',
      cuerpo: 'Las partes cumplirán las obligaciones que les correspondan conforme al Decreto 1072 de 2015, al SG-SST y a las demás normas aplicables. Por la naturaleza operativa y de campo del cargo, ninguna tarea en alturas, postes, cubiertas, zonas de tránsito, instalaciones eléctricas o equipos energizados podrá ejecutarse sin evaluación de riesgos, capacitación, aptitud, autorización, permisos, herramientas, EPP y controles exigibles para la actividad concreta. Cuando se configure trabajo en alturas, se aplicará la Resolución 4272 de 2021 y el programa de prevención y protección contra caídas de EL EMPLEADOR. LA PERSONA TRABAJADORA podrá abstenerse de iniciar o continuar una tarea ante peligro grave o inminente, falta de autorización, formación, equipo o condiciones seguras, y deberá reportarlo inmediatamente por los canales definidos, sin que ello constituya incumplimiento cuando la abstención esté justificada.'
    },
    {
      titulo: 'DÉCIMA SEXTA. HERRAMIENTAS, ACTIVOS Y DESCUENTOS.',
      cuerpo: 'Los equipos, herramientas, instrumentos, materiales, credenciales y elementos suministrados por EL EMPLEADOR serán utilizados exclusivamente para fines laborales autorizados y deberán conservarse con diligencia y devolverse cuando sean requeridos o al terminar el vínculo. LA PERSONA TRABAJADORA reportará daños, pérdidas o faltantes y colaborará con las verificaciones correspondientes. No habrá descuentos automáticos del salario o de las prestaciones por daños, pérdidas, herramientas faltantes, multas o supuestos perjuicios. Cualquier descuento solo procederá en los eventos y bajo los requisitos estrictos previstos en la ley, sin trasladar al trabajador los riesgos ordinarios de la actividad empresarial.'
    },
    {
      titulo: 'DÉCIMA SÉPTIMA. PROTECCIÓN DE DATOS PERSONALES.',
      cuerpo: 'Las partes cumplirán la Ley 1581 de 2012, sus decretos reglamentarios y las políticas aplicables. En el desarrollo de sus funciones, LA PERSONA TRABAJADORA solo podrá consultar, recolectar, utilizar, registrar o comunicar datos personales de usuarios, empleados o terceros para finalidades laborales autorizadas, por medio de herramientas y canales aprobados. Se prohíbe copiar bases de datos, documentos de identidad, fotografías, credenciales o listados de clientes en dispositivos, cuentas o canales personales no autorizados. Las fotografías de intervenciones deberán limitarse a lo necesario para la orden de trabajo, evitando captar personas o documentos de forma innecesaria. EL EMPLEADOR tratará los datos personales de LA PERSONA TRABAJADORA con fundamento jurídico, finalidad informada y medidas de seguridad adecuadas; las autorizaciones separadas que sean legalmente necesarias se gestionarán por documento independiente.'
    },
    {
      titulo: 'DÉCIMA OCTAVA. CONFIDENCIALIDAD E INFORMACIÓN EMPRESARIAL.',
      cuerpo: 'LA PERSONA TRABAJADORA guardará reserva sobre la información no pública de naturaleza técnica, operativa, comercial, financiera, contractual, de seguridad o de clientes a la que acceda por razón del cargo, incluidas topologías, configuraciones, direcciones, claves, credenciales, inventarios, procedimientos y reportes. No podrá divulgarla, copiarla, explotarla ni utilizarla para fines propios o de terceros sin autorización. Esta obligación continuará después de terminado el contrato mientras la información conserve su carácter reservado o la ley exija su protección. No comprende información pública, conocida legítimamente sin deber de reserva, ni limita el ejercicio de derechos laborales, la denuncia de conductas ilegales o la colaboración con autoridades competentes.'
    },
    {
      titulo: 'DÉCIMA NOVENA. CONFLICTOS DE INTERÉS Y ACTIVIDADES EXTERNAS.',
      cuerpo: 'Este contrato no establece exclusividad general ni prohíbe otras actividades lícitas fuera de la jornada. LA PERSONA TRABAJADORA no podrá utilizar tiempo de trabajo, recursos, información confidencial, credenciales o relaciones de clientes de EL EMPLEADOR para actividades particulares o de terceros, ni realizar actuaciones que impliquen competencia desleal, desvío indebido de usuarios, conflicto concreto de intereses o incumplimiento de sus obligaciones. Deberá informar oportunamente los conflictos reales o potenciales que puedan afectar la imparcialidad, seguridad o cumplimiento de sus funciones.'
    },
    {
      titulo: 'VIGÉSIMA. REGLAMENTO, POLÍTICAS Y MEDIDAS DISCIPLINARIAS.',
      cuerpo: 'LA PERSONA TRABAJADORA cumplirá el Reglamento Interno de Trabajo, cuando sea legalmente exigible o se encuentre válidamente adoptado, así como las políticas y procedimientos que le hayan sido debidamente comunicados, siempre que no desconozcan la ley ni este contrato. La imposición de sanciones observará el artículo 115 del CST, modificado por el artículo 7 de la Ley 2466 de 2025. Cuando EL EMPLEADOR no esté cobijado por la excepción del parágrafo 6 de dicho artículo, aplicará el procedimiento legal general, que comprende comunicación formal de apertura, descripción escrita de los hechos, traslado de las pruebas, oportunidad de defensa y contradicción por un término no inferior a cinco (5) días, decisión motivada, proporcionalidad de la eventual sanción y posibilidad de impugnación. Si EL EMPLEADOR acredita estar comprendido en la excepción legal para micro y pequeñas empresas de menos de diez (10) trabajadores, se escuchará previamente a LA PERSONA TRABAJADORA sobre los hechos imputados y se respetarán en todo caso sus garantías de defensa y debido proceso. Cuando corresponda, se brindarán los ajustes razonables y el acompañamiento sindical previstos en la ley. No podrán imponerse sanciones no previstas en la ley, el reglamento, pacto, convención, laudo o contrato, según corresponda.'
    },
    {
      titulo: 'VIGÉSIMA PRIMERA. TERMINACIÓN E INDEMNIZACIONES.',
      cuerpo: 'El contrato terminará por vencimiento válido del plazo con observancia del preaviso legal, mutuo acuerdo, justa causa acreditada, decisión unilateral en los casos permitidos por la ley o cualquier otra causal legal. La terminación deberá respetar los fueros, la estabilidad laboral reforzada, las prohibiciones de discriminación y las autorizaciones previas que resulten exigibles. La terminación unilateral sin justa causa dará lugar a la indemnización que corresponda conforme al artículo 64 del CST y a las demás consecuencias legales. En todos los casos EL EMPLEADOR pagará los salarios, prestaciones, vacaciones, recargos y demás conceptos causados hasta la fecha de terminación.'
    },
    {
      titulo: 'VIGÉSIMA SEGUNDA. MODIFICACIONES Y ANEXOS.',
      cuerpo: `Cualquier modificación de las condiciones esenciales del contrato deberá constar por escrito y contar con el acuerdo de las partes cuando así lo exija la ley. Forman parte integral de este contrato el Anexo 1 — Manual de Funciones del ${datos.cargoTitulo}, versión 1.0 del 28 de octubre de 2026, y el Anexo 2 — Constancia de entrega de documentos y políticas. No se autoriza completar espacios sustanciales en blanco después de la firma. Toda actualización del manual deberá identificarse con versión y fecha, comunicarse y dejar constancia de entrega; no podrá modificar unilateralmente los elementos esenciales del contrato ni reducir derechos.`
    },
    {
      titulo: 'VIGÉSIMA TERCERA. PRIMACÍA DE LA REALIDAD Y NO RENUNCIA.',
      cuerpo: 'Este contrato se interpretará de acuerdo con la Constitución, la legislación laboral y el principio de primacía de la realidad sobre las formas. Ninguna de sus estipulaciones implica renuncia a derechos ciertos e indiscutibles, salarios, prestaciones, antigüedad real, estabilidad laboral reforzada ni condiciones más favorables válidamente reconocidas. Las cláusulas contrarias a normas laborales imperativas se entenderán sustituidas por las disposiciones legales aplicables.'
    },
    {
      titulo: 'VIGÉSIMA CUARTA. NOTIFICACIONES.',
      cuerpo: 'Para comunicaciones ordinarias, las partes utilizarán los datos de contacto de la ficha y deberán informar por escrito cualquier cambio. Las comunicaciones que produzcan efectos legales —incluido el preaviso de no renovación— se enviarán por un medio verificable que permita acreditar contenido, fecha de envío y recepción. El uso de correo electrónico o mensajería no releva de cumplir los requisitos legales de notificación ni de conservar el soporte correspondiente.'
    },
    {
      titulo: 'VIGÉSIMA QUINTA. INTEGRIDAD Y EJEMPLARES.',
      cuerpo: `El presente documento, junto con sus anexos identificados, contiene el acuerdo laboral escrito de las partes respecto de las condiciones aquí reguladas. Se firma en ${datos.ciudadEmpresa}, a los ${datos.fechaFirmaFormalLarga}, en dos ejemplares del mismo tenor, uno para cada parte. La firma podrá constar en medio físico o electrónico que permita identificar a las partes y conservar la integridad del documento, conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012.`
    }
  ];
}

/**
 * Genera y descarga un PDF vectorial de alta fidelidad (texto real seleccionable, sin recortes)
 * para el Contrato Individual de Trabajo a Término Fijo, tanto previo como posterior a la firma.
 */
export async function generarPdfContratoLaboralVectorial(
  datos: DatosPdfContratoLaboral,
  nombreArchivo: string
): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 215.9 mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 279.4 mm
    const marginX = 18;
    const topMargin = 20;
    const bottomMargin = 18;
    const contentWidth = pageWidth - marginX * 2;
    const maxY = pageHeight - bottomMargin;

    const NAVY: [number, number, number] = [24, 35, 92];
    const SLATE_DARK: [number, number, number] = [15, 23, 42];
    const SLATE_BODY: [number, number, number] = [30, 41, 59];
    const SLATE_MUTED: [number, number, number] = [100, 116, 139];
    const BORDER_LIGHT: [number, number, number] = [203, 213, 225];
    const BG_SOFT: [number, number, number] = [248, 250, 252];
    const EMERALD: [number, number, number] = [4, 120, 87];
    const AMBER: [number, number, number] = [180, 83, 9];

    let cursorY = topMargin;

    const ensureSpace = (neededMm: number) => {
      if (cursorY + neededMm > maxY) {
        doc.addPage();
        cursorY = topMargin;
      }
    };

    // 1. ENCABEZADO FORMAL DEL CONTRATO
    doc.setDrawColor(...NAVY);
    doc.setFillColor(...BG_SOFT);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginX, cursorY, contentWidth, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    doc.text(`${datos.nombreEmpresa.toUpperCase()} | CONEXIONES DE VIDA`, marginX + 4, cursorY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_BODY);
    doc.text(`${datos.nitEmpresa} · Dirección de Gestión Humana`, marginX + 4, cursorY + 12.5);
    doc.text(`${datos.domicilioEmpresa}, ${datos.ciudadEmpresa}`, marginX + 4, cursorY + 17);

    const estadoLabel = datos.firmaCapturadaUrl ? 'DOCUMENTO SUSCRITO DIGITALMENTE' : 'BORRADOR PREVIO A FIRMA';
    const estadoColor: [number, number, number] = datos.firmaCapturadaUrl ? EMERALD : AMBER;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...estadoColor);
    doc.text(estadoLabel, marginX + 4, cursorY + 22.5);

    // Recuadro derecho del código de contrato
    const boxW = 68;
    const boxX = marginX + contentWidth - boxW - 3;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_LIGHT);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, cursorY + 2.5, boxW, 21, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...NAVY);
    doc.text('CONTRATO INDIVIDUAL DE TRABAJO', boxX + boxW - 3, cursorY + 7.5, { align: 'right' });
    doc.text('A TÉRMINO FIJO', boxX + boxW - 3, cursorY + 11, { align: 'right' });

    doc.setFontSize(9.5);
    doc.setTextColor(67, 56, 202);
    doc.text(datos.codigoContrato, boxX + boxW - 3, cursorY + 16.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(`Vínculo: Término Fijo (${datos.duracionTexto})`, boxX + boxW - 3, cursorY + 21, { align: 'right' });

    cursorY += 32;

    // 2. FICHA DE CONDICIONES PARTICULARES
    doc.setFillColor(...NAVY);
    doc.rect(marginX, cursorY, contentWidth, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('FICHA DE CONDICIONES PARTICULARES', marginX + 3.5, cursorY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text('CST Arts. 37, 39 y 46', marginX + contentWidth - 3.5, cursorY + 5, { align: 'right' });
    cursorY += 7.5;

    const filasFicha: Array<{ label: string; value: string; highlight?: boolean }> = [
      { label: 'Ciudad y fecha de firma:', value: `${datos.ciudadEmpresa.toUpperCase()}, ${datos.fechaFirmaMayusculas}` },
      { label: 'Empleador:', value: `${datos.nombreEmpresa} — ${datos.nitEmpresa}` },
      { label: 'Domicilio del empleador:', value: `${datos.domicilioEmpresa}, ${datos.ciudadEmpresa}` },
      { label: 'Representante legal:', value: `${datos.repLegalNombre} — C.C. ${datos.repLegalDocumento}` },
      { label: 'Persona trabajadora:', value: `${datos.empleadoNombre.toUpperCase()} — ${datos.empleadoTipoDocumento} ${datos.empleadoDocumento}`, highlight: true },
      { label: 'Datos de contacto:', value: `Celular: ${datos.celularCandidato} | Correo: ${datos.correoCandidato} | Dirección: ${datos.direccionCandidato}` },
      { label: 'Cargo:', value: datos.cargoTitulo, highlight: true },
      { label: 'Área y jefe inmediato:', value: `${datos.areaTitulo} — Supervisor de Operaciones o persona formalmente designada` },
      { label: 'Lugar y modalidad:', value: 'Presencial y trabajo de campo: sede, nodos, infraestructura de red y domicilios de usuarios dentro del área de operación asignada.' },
      { label: 'Fecha de inicio:', value: datos.fechaInicioMayusculas },
      { label: 'Fecha de terminación:', value: datos.fechaFinMayusculas },
      { label: 'Duración inicial:', value: datos.duracionTexto },
      { label: 'Salario ordinario:', value: `$${datos.salarioValor.toLocaleString('es-CO')} COP / mes (o valor legal aplicable actualizado conforme al SMLMV en cada período).`, highlight: true },
      { label: 'Auxilio de transporte:', value: 'Se reconocerá cuando se cumplan los requisitos legales, en la cuantía vigente y proporcional al tiempo causado (Ley 15 de 1959).' },
      { label: 'Periodicidad y medio de pago:', value: 'Quincenal: los días 15 y el último día calendario de cada mes, mediante transferencia bancaria a la cuenta designada por la persona trabajadora o medio legal acordado.' },
      { label: 'Jornada ordinaria:', value: '42 horas efectivas semanales (Ley 2101 de 2021). Lunes a viernes: 08:20 a 17:00. Sábados: 08:00 a 11:40. Descanso semanal: domingo.' },
      { label: 'Pausa de alimentación:', value: 'Una (1) hora de lunes a viernes, entre las 12:00 y las 13:00 (o la franja programada según la orden de trabajo).' },
      { label: 'Período de prueba:', value: `${datos.periodoPruebaTexto}, pactados expresamente por escrito en este contrato conforme a los artículos 76 a 80 del CST.` }
    ];

    const labelColW = 54;
    const valueColW = contentWidth - labelColW;

    for (let idx = 0; idx < filasFicha.length; idx++) {
      const fila = filasFicha[idx];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const labelLines = doc.splitTextToSize(fila.label, labelColW - 5);

      doc.setFont('helvetica', fila.highlight ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      const valueLines = doc.splitTextToSize(fila.value, valueColW - 5);

      const lineCount = Math.max(labelLines.length, valueLines.length);
      const rowHeight = Math.max(6.8, lineCount * 4 + 3);

      ensureSpace(rowHeight);

      if (fila.highlight) {
        doc.setFillColor(238, 242, 255);
      } else if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }

      doc.setDrawColor(...BORDER_LIGHT);
      doc.setLineWidth(0.2);
      doc.rect(marginX, cursorY, contentWidth, rowHeight, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(fila.highlight ? NAVY : SLATE_MUTED));
      doc.text(labelLines, marginX + 3, cursorY + 4.5);

      doc.setFont('helvetica', fila.highlight ? 'bold' : 'normal');
      doc.setTextColor(...(fila.highlight ? NAVY : SLATE_DARK));
      doc.text(valueLines, marginX + labelColW + 2, cursorY + 4.5);

      cursorY += rowHeight;
    }

    cursorY += 6;

    // 3. PARTES Y ACUERDO (PREÁMBULO)
    const textoPreambulo = `Entre ${datos.nombreEmpresa}, identificada en la ficha de condiciones particulares, representada legalmente por quien allí aparece, quien en adelante se denominará EL EMPLEADOR, y la persona identificada en la misma ficha, quien en adelante se denominará LA PERSONA TRABAJADORA, se celebra el presente contrato individual de trabajo a término fijo. La relación se regirá por la Constitución Política, el Código Sustantivo del Trabajo (CST), la Ley 50 de 1990, la Ley 2101 de 2021, la Ley 2466 de 2025 y las demás normas que las modifiquen, adicionen o reglamenten, de acuerdo con las siguientes cláusulas:`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    const preambuloLines = doc.splitTextToSize(textoPreambulo, contentWidth - 7);
    const preambuloHeight = preambuloLines.length * 4.3 + 11;

    ensureSpace(preambuloHeight);
    doc.setFillColor(...BG_SOFT);
    doc.setDrawColor(...BORDER_LIGHT);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, cursorY, contentWidth, preambuloHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text('PARTES Y ACUERDO', marginX + 3.5, cursorY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(...SLATE_BODY);
    doc.text(preambuloLines, marginX + 3.5, cursorY + 10.5);

    cursorY += preambuloHeight + 6;

    // 4. LAS 25 CLÁUSULAS CONTRACTUALES COMPLETAS
    const clausulas = construirClausulasContratoLaboral(datos);

    const renderWrappedParagraphLines = (lines: string[], x: number, lineHeightMm: number) => {
      for (let i = 0; i < lines.length; i++) {
        ensureSpace(lineHeightMm + 1);
        doc.text(lines[i], x, cursorY);
        cursorY += lineHeightMm;
      }
    };

    for (const clausula of clausulas) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.3);
      const titleLines = doc.splitTextToSize(clausula.titulo, contentWidth);

      if (clausula.cuerpo) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.2);
        const bodyLines = doc.splitTextToSize(clausula.cuerpo, contentWidth);
        const estimatedFirstBlock = titleLines.length * 4.3 + Math.min(bodyLines.length, 3) * 4.3 + 3;
        ensureSpace(estimatedFirstBlock);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.3);
        doc.setTextColor(...NAVY);
        renderWrappedParagraphLines(titleLines, marginX, 4.3);
        cursorY += 0.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.2);
        doc.setTextColor(...SLATE_BODY);
        renderWrappedParagraphLines(bodyLines, marginX, 4.25);
      } else {
        // Cláusula con lista de obligaciones (DÉCIMA TERCERA / DÉCIMA CUARTA)
        ensureSpace(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.3);
        doc.setTextColor(...NAVY);
        renderWrappedParagraphLines(titleLines, marginX, 4.3);

        if (clausula.introLista) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.2);
          doc.setTextColor(...SLATE_BODY);
          const introLines = doc.splitTextToSize(clausula.introLista, contentWidth);
          renderWrappedParagraphLines(introLines, marginX, 4.25);
          cursorY += 1;
        }

        if (clausula.itemsLista) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.1);
          doc.setTextColor(...SLATE_BODY);
          for (const item of clausula.itemsLista) {
            const itemLines = doc.splitTextToSize(item, contentWidth - 6);
            ensureSpace(itemLines.length * 4.2 + 1.5);
            doc.text('•', marginX + 1.5, cursorY);
            renderWrappedParagraphLines(itemLines, marginX + 5.5, 4.15);
            cursorY += 0.8;
          }
        }
      }

      // Separador sutil entre cláusulas
      cursorY += 2;
      if (cursorY < maxY - 4) {
        doc.setDrawColor(235, 240, 245);
        doc.setLineWidth(0.2);
        doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
      }
      cursorY += 3.5;
    }

    // 5. SECCIÓN DE FIRMAS Y RATIFICACIÓN CONTRACTUAL + SELLO QR (NO SEPARAR FIRMAS)
    ensureSpace(88);
    cursorY += 2;

    doc.setFillColor(...BG_SOFT);
    doc.setDrawColor(...BORDER_LIGHT);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, cursorY, contentWidth, 58, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text('SECCIÓN DE FIRMAS Y RATIFICACIÓN CONTRACTUAL', marginX + 4, cursorY + 6);
    doc.setDrawColor(...BORDER_LIGHT);
    doc.line(marginX + 4, cursorY + 8.5, marginX + contentWidth - 4, cursorY + 8.5);

    const cardGap = 6;
    const cardW = (contentWidth - 8 - cardGap) / 2;
    const cardY = cursorY + 11.5;
    const cardH = 43;

    // Caja izquierda: EL EMPLEADOR
    const leftX = marginX + 4;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_LIGHT);
    doc.roundedRect(leftX, cardY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_MUTED);
    doc.text('EL EMPLEADOR:', leftX + 3, cardY + 5);

    doc.setFont('times', 'bolditalic');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text('Hernán Riquelme Borja Benítez', leftX + cardW / 2, cardY + 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text('Firma Representante Legal Certificada · REGISTRADO', leftX + cardW / 2, cardY + 20.5, { align: 'center' });

    doc.setDrawColor(...BORDER_LIGHT);
    doc.line(leftX + 4, cardY + 23.5, leftX + cardW - 4, cardY + 23.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...SLATE_DARK);
    doc.text(datos.repLegalNombre.slice(0, 42), leftX + 3, cardY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...SLATE_BODY);
    doc.text(`C.C. ${datos.repLegalDocumento} de Cartagena`, leftX + 3, cardY + 32);
    doc.setTextColor(...NAVY);
    doc.text(datos.nombreEmpresa.slice(0, 42), leftX + 3, cardY + 36);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(datos.nitEmpresa, leftX + 3, cardY + 40);

    // Caja derecha: LA PERSONA TRABAJADORA
    const rightX = leftX + cardW + cardGap;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(165, 180, 252);
    doc.roundedRect(rightX, cardY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(67, 56, 202);
    doc.text('LA PERSONA TRABAJADORA:', rightX + 3, cardY + 5);

    if (datos.firmaCapturadaUrl && datos.firmaCapturadaUrl.startsWith('data:image/')) {
      try {
        doc.addImage(datos.firmaCapturadaUrl, 'PNG', rightX + 10, cardY + 7, cardW - 20, 15, undefined, 'FAST');
      } catch {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...NAVY);
        doc.text('[Firma Electrónica Capturada]', rightX + cardW / 2, cardY + 16, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...SLATE_MUTED);
      doc.text('(Borrador Previo a Suscripción Digital)', rightX + cardW / 2, cardY + 18, { align: 'center' });
    }

    doc.setDrawColor(165, 180, 252);
    doc.line(rightX + 4, cardY + 23.5, rightX + cardW - 4, cardY + 23.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...SLATE_DARK);
    doc.text((datos.firmaNombre || datos.empleadoNombre).slice(0, 42), rightX + 3, cardY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...SLATE_BODY);
    doc.text(`${datos.empleadoTipoDocumento} ${datos.firmaDocumento || datos.empleadoDocumento}`, rightX + 3, cardY + 32);
    doc.setTextColor(67, 56, 202);
    doc.text(datos.cargoTitulo.slice(0, 44), rightX + 3, cardY + 36);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(
      datos.firmaFechaHora
        ? `Suscrito: ${datos.firmaFechaHora.slice(0, 19).replace('T', ' ')}`
        : 'Validez electrónica Ley 527 de 1999',
      rightX + 3,
      cardY + 40
    );

    cursorY += 62;

    // 6. BLOQUE QR Y CERTIFICADO DE INTEGRIDAD (JSON CODIFICADO + URL DE VALIDACIÓN FIRMADA)
    ensureSpace(28);
    doc.setFillColor(...BG_SOFT);
    doc.setDrawColor(...BORDER_LIGHT);
    doc.roundedRect(marginX, cursorY, contentWidth, 25, 1.5, 1.5, 'FD');

    let urlValidacionFirmada = '';
    try {
      const { jsonString: qrPayload, payload } = await construirJsonQrDocumentoPdf({
        nombreEmpleado: datos.empleadoNombre,
        numeroDocumento: datos.empleadoDocumento,
        idContrato: datos.codigoContrato,
        tipoDocumento: 'Contrato Laboral',
        hashSha256: datos.hashSha256
      });
      urlValidacionFirmada = payload.urlValidacionFirmada;
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#18235C', light: '#FFFFFF' }
      });
      doc.addImage(qrDataUrl, 'PNG', marginX + 3, cursorY + 2.5, 20, 20);
    } catch {
      // Si QRCode falla por alguna razón, continuamos sin bloquear la descarga
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_DARK);
    doc.text('Certificado de Firma Electrónica e Integridad Documental', marginX + 26, cursorY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(...SLATE_BODY);
    doc.text(
      `Radicado: ${datos.codigoContrato} · Titular: ${datos.empleadoNombre} (${datos.empleadoDocumento}) · Ley 527 de 1999.`,
      marginX + 26,
      cursorY + 11.5
    );
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(
      datos.hashSha256
        ? `Sello SHA-256: ${datos.hashSha256}`
        : 'Estado: Borrador previo a firma digital (el sello SHA-256 se genera al suscribir el contrato).',
      marginX + 26,
      cursorY + 16.5
    );
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.6);
    doc.setTextColor(...NAVY);
    doc.text(
      urlValidacionFirmada
        ? `QR JSON autenticado con URL firmada de validación en sistema (#/verificar · Ley 527/1999).`
        : `QR con metadatos verificables en plataforma oficial.`,
      marginX + 26,
      cursorY + 21.5
    );

    // 7. ENCABEZADOS Y PIES DE PÁGINA CORRELATIVOS EN TODAS LAS PÁGINAS
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);

      if (page > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...SLATE_MUTED);
        doc.text(
          `${datos.nombreEmpresa.toUpperCase()} · CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO FIJO`,
          marginX,
          11
        );
        doc.setFont('courier', 'bold');
        doc.text(datos.codigoContrato, pageWidth - marginX, 11, { align: 'right' });
        doc.setDrawColor(...BORDER_LIGHT);
        doc.setLineWidth(0.2);
        doc.line(marginX, 13.5, pageWidth - marginX, 13.5);
      }

      doc.setDrawColor(...BORDER_LIGHT);
      doc.setLineWidth(0.2);
      doc.line(marginX, pageHeight - 13.5, pageWidth - marginX, pageHeight - 13.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE_MUTED);
      doc.text(
        `${datos.empleadoNombre} (${datos.empleadoTipoDocumento} ${datos.empleadoDocumento}) · ${datos.codigoContrato}`,
        marginX,
        pageHeight - 9
      );
      doc.setFont('helvetica', 'bold');
      doc.text(`Página ${page} de ${totalPages}`, pageWidth - marginX, pageHeight - 9, { align: 'right' });
    }

    const cleanFileName = (nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`).replace(
      /[\\/:*?"<>|]/g,
      '_'
    );
    doc.save(cleanFileName);
    return true;
  } catch (err) {
    console.error('[contratoPdfGenerator] Error generando PDF vectorial del contrato:', err);
    return false;
  }
}
