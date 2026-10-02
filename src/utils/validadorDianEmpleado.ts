import { Empleado } from '../types';

export interface ResultadoValidacionCampo {
  esValido: boolean;
  mensaje: string;
  sugerencia?: string;
  nivel: 'success' | 'warning' | 'error';
  detalles?: {
    formatoLimpio?: string;
    esDuplicado?: boolean;
    esSalarioIntegral?: boolean;
    tieneAuxilioTransporte?: boolean;
    montoCOP?: number;
  };
}

export interface ResultadoValidacionEmpleadoDian {
  documento: ResultadoValidacionCampo;
  correoCorporativo: ResultadoValidacionCampo;
  correoPersonal: ResultadoValidacionCampo;
  salario: ResultadoValidacionCampo;
  esFormularioValido: boolean;
  resumenErrores: string[];
}

/**
 * Valida un número de documento/cédula según estándares DIAN para Nómina Electrónica en Colombia
 */
export function validarCedulaDocumentoDian(
  documentoRaw: string,
  tipoDocumento: string = 'CC',
  empleadosExistentes: Empleado[] = [],
  empleadoIdActual?: string
): ResultadoValidacionCampo {
  if (!documentoRaw || !documentoRaw.trim()) {
    return {
      esValido: false,
      mensaje: 'El número de documento de identidad es obligatorio para la nómina electrónica (DIAN).',
      nivel: 'error'
    };
  }

  // Eliminar espacios y formatear
  const documentoLimpio = documentoRaw.trim().replace(/[\s.-]/g, '');

  if (documentoLimpio.length === 0) {
    return {
      esValido: false,
      mensaje: 'Formato de documento inválido. Ingrese únicamente caracteres alfanuméricos válidos.',
      nivel: 'error'
    };
  }

  // Reglas según tipo de documento de la DIAN (Cédula de Ciudadanía, Cédula de Extranjería, NIT, Pasaporte, PEP, PPT)
  const tipoDocUpper = (tipoDocumento || 'CC').toUpperCase();

  if (tipoDocUpper === 'CC' || tipoDocUpper === 'CÉDULA DE CIUDADANÍA' || tipoDocUpper === '13') {
    if (!/^\d+$/.test(documentoLimpio)) {
      return {
        esValido: false,
        mensaje: 'La Cédula de Ciudadanía sólo debe contener dígitos numéricos (sin puntos ni letras).',
        sugerencia: `Formato limpio sugerido: ${documentoLimpio.replace(/\D/g, '')}`,
        nivel: 'error',
        detalles: { formatoLimpio: documentoLimpio.replace(/\D/g, '') }
      };
    }
    if (documentoLimpio.length < 6 || documentoLimpio.length > 10) {
      return {
        esValido: false,
        mensaje: `Longitud de Cédula fuera de rango DIAN (debe tener entre 6 y 10 dígitos numéricos). Longitud actual: ${documentoLimpio.length}.`,
        nivel: 'error'
      };
    }
  } else if (tipoDocUpper === 'NIT' || tipoDocUpper === '31') {
    const nitLimpio = documentoLimpio.replace(/[^0-9]/g, '');
    if (nitLimpio.length < 8 || nitLimpio.length > 10) {
      return {
        esValido: false,
        mensaje: 'El NIT debe contener entre 8 y 10 dígitos numéricos.',
        nivel: 'error'
      };
    }
  } else if (tipoDocUpper === 'CE' || tipoDocUpper === 'CÉDULA DE EXTRANJERÍA' || tipoDocUpper === 'PPT' || tipoDocUpper === 'PEP' || tipoDocUpper === '22') {
    if (!/^[a-zA-Z0-9]+$/.test(documentoLimpio)) {
      return {
        esValido: false,
        mensaje: `El documento ${tipoDocUpper} debe ser alfanumérico sin símbolos especiales.`,
        nivel: 'error'
      };
    }
    if (documentoLimpio.length < 5 || documentoLimpio.length > 16) {
      return {
        esValido: false,
        mensaje: `Longitud de ${tipoDocUpper} inválida (entre 5 y 16 caracteres alfanuméricos).`,
        nivel: 'error'
      };
    }
  } else {
    // Genérico alfanumérico
    if (documentoLimpio.length < 4 || documentoLimpio.length > 20) {
      return {
        esValido: false,
        mensaje: 'El número de identificación debe tener entre 4 y 20 caracteres alfanuméricos.',
        nivel: 'error'
      };
    }
  }

  // Validar duplicidad en el censo activo de colaboradores
  const docComparar = documentoLimpio.toLowerCase();
  const coincidente = empleadosExistentes.find(emp => {
    if (empleadoIdActual && emp.id === empleadoIdActual) return false;
    const docEmp = (emp.documento || '').replace(/[\s.-]/g, '').toLowerCase();
    return docEmp === docComparar;
  });

  if (coincidente) {
    return {
      esValido: false,
      mensaje: `El documento C.C. ${documentoLimpio} ya está registrado para el colaborador "${coincidente.nombre}".`,
      nivel: 'error',
      detalles: { esDuplicado: true, formatoLimpio: documentoLimpio }
    };
  }

  return {
    esValido: true,
    mensaje: `Documento de identidad DIAN válido (C.C. ${documentoLimpio}).`,
    nivel: 'success',
    detalles: { formatoLimpio: documentoLimpio, esDuplicado: false }
  };
}

/**
 * Valida una dirección de correo electrónico según estándar RFC 5322 y DIAN Electrónica
 */
export function validarCorreoElectronicoDian(
  emailRaw: string,
  campoNombre: string = 'correo corporativo',
  esObligatorio: boolean = true,
  empleadosExistentes: Empleado[] = [],
  empleadoIdActual?: string
): ResultadoValidacionCampo {
  if (!emailRaw || !emailRaw.trim()) {
    if (!esObligatorio) {
      return {
        esValido: true,
        mensaje: `El ${campoNombre} es opcional.`,
        nivel: 'success'
      };
    }
    return {
      esValido: false,
      mensaje: `El ${campoNombre} es obligatorio para la nómina electrónica y notificaciones.`,
      nivel: 'error'
    };
  }

  const emailLimpio = emailRaw.trim().toLowerCase();

  // Regex RFC 5322 estándar con TLD de al menos 2 letras
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!regexEmail.test(emailLimpio)) {
    return {
      esValido: false,
      mensaje: `Formato de ${campoNombre} inválido ("${emailRaw}"). Debe ser tipo usuario@dominio.com`,
      nivel: 'error'
    };
  }

  // Validar espacios internos
  if (/\s/.test(emailRaw)) {
    return {
      esValido: false,
      mensaje: `El ${campoNombre} no puede contener espacios.`,
      nivel: 'error'
    };
  }

  // Si es obligatorio (como el corporativo), validar duplicados en el censo
  if (esObligatorio) {
    const coincidente = empleadosExistentes.find(emp => {
      if (empleadoIdActual && emp.id === empleadoIdActual) return false;
      const emailEmp = (emp.contacto?.correoCorporativo || emp.email || '').trim().toLowerCase();
      return emailEmp === emailLimpio;
    });

    if (coincidente) {
      return {
        esValido: false,
        mensaje: `El ${campoNombre} "${emailLimpio}" ya pertenece a "${coincidente.nombre}".`,
        nivel: 'error',
        detalles: { esDuplicado: true }
      };
    }
  }

  return {
    esValido: true,
    mensaje: `Formato de ${campoNombre} verificado y conforme a la DIAN.`,
    nivel: 'success'
  };
}

/**
 * Valida el salario devengado según el CST, SMMLV 2026 y estándar DIAN
 */
export function validarSalarioDianCst(
  salarioRaw: number | string,
  tipoContrato: string = 'Indefinido',
  smmlvVigente: number = 1750905
): ResultadoValidacionCampo {
  let monto = 0;
  if (typeof salarioRaw === 'number') {
    monto = isNaN(salarioRaw) ? 0 : salarioRaw;
  } else if (salarioRaw) {
    const limpio = String(salarioRaw).replace(/[^0-9.]/g, '');
    monto = parseFloat(limpio) || 0;
  }

  if (monto <= 0) {
    return {
      esValido: false,
      mensaje: 'El salario básico debe ser un valor numérico superior a $0 COP.',
      nivel: 'error',
      detalles: { montoCOP: 0 }
    };
  }

  // Excepción para contrato de aprendizaje Sena o prácticas (50% o 75% del SMMLV)
  const esAprendizajeSena = tipoContrato.toLowerCase().includes('sena') || tipoContrato.toLowerCase().includes('aprendizaje');
  const minimoSena = Math.round(smmlvVigente * 0.5);

  if (esAprendizajeSena && monto < minimoSena) {
    return {
      esValido: false,
      mensaje: `Para contratos de aprendizaje Sena, el apoyo de sostenimiento mínimo legal es de $${minimoSena.toLocaleString('es-CO')} COP (50% SMMLV).`,
      nivel: 'error',
      detalles: { montoCOP: monto }
    };
  }

  if (!esAprendizajeSena && monto < smmlvVigente) {
    return {
      esValido: false,
      mensaje: `El salario ingresado ($${monto.toLocaleString('es-CO')} COP) está por debajo del SMMLV legal vigente de $${smmlvVigente.toLocaleString('es-CO')} COP (Art. 145 CST).`,
      sugerencia: `El mínimo legal permitido para jornada completa en Colombia es $${smmlvVigente.toLocaleString('es-CO')} COP.`,
      nivel: 'error',
      detalles: { montoCOP: monto }
    };
  }

  // Tope máximo razonable (ej. $150.000.000 COP) para prevenir errores tipográficos
  if (monto > 150000000) {
    return {
      esValido: false,
      mensaje: `El valor de $${monto.toLocaleString('es-CO')} COP parece desproporcionado. Verifique que no haya ceros adicionales.`,
      nivel: 'error',
      detalles: { montoCOP: monto }
    };
  }

  const topeAuxilio = smmlvVigente * 2; // <= 2 SMMLV ($3.501.810 COP)
  const tieneAuxilioTransporte = monto <= topeAuxilio && !esAprendizajeSena;

  const topeSalarioIntegral = smmlvVigente * 13; // 10 SMMLV + 30% factor prestacional ($22.761.765 COP)
  const esSalarioIntegral = monto >= topeSalarioIntegral;

  let infoMensaje = `Salario ordinario válido de $${monto.toLocaleString('es-CO')} COP.`;
  if (tieneAuxilioTransporte) {
    infoMensaje += ' Genera derecho a Auxilio de Transporte (≤ 2 SMMLV).';
  } else if (esSalarioIntegral) {
    infoMensaje += ' Clasifica como Salario Integral (≥ 13 SMMLV).';
  }

  return {
    esValido: true,
    mensaje: infoMensaje,
    nivel: 'success',
    detalles: {
      montoCOP: monto,
      tieneAuxilioTransporte,
      esSalarioIntegral
    }
  };
}

/**
 * Validador unificado que consolida todos los campos clave requeridos por la DIAN
 */
export function validarFormularioEmpleadoDian(
  datos: {
    documento: string;
    tipoDocumento?: string;
    correoCorporativo: string;
    correoPersonal?: string;
    salarioBasico: number | string;
    tipoContrato?: string;
    empleadoIdActual?: string;
  },
  empleadosExistentes: Empleado[] = [],
  smmlvVigente: number = 1750905
): ResultadoValidacionEmpleadoDian {
  const valDoc = validarCedulaDocumentoDian(datos.documento, datos.tipoDocumento || 'CC', empleadosExistentes, datos.empleadoIdActual);
  const valCorreoCorp = validarCorreoElectronicoDian(datos.correoCorporativo, 'correo corporativo', true, empleadosExistentes, datos.empleadoIdActual);
  const valCorreoPers = validarCorreoElectronicoDian(datos.correoPersonal || '', 'correo personal', false, empleadosExistentes, datos.empleadoIdActual);
  const valSalario = validarSalarioDianCst(datos.salarioBasico, datos.tipoContrato || 'Indefinido', smmlvVigente);

  const errores: string[] = [];
  if (!valDoc.esValido) errores.push(valDoc.mensaje);
  if (!valCorreoCorp.esValido) errores.push(valCorreoCorp.mensaje);
  if (!valCorreoPers.esValido) errores.push(valCorreoPers.mensaje);
  if (!valSalario.esValido) errores.push(valSalario.mensaje);

  return {
    documento: valDoc,
    correoCorporativo: valCorreoCorp,
    correoPersonal: valCorreoPers,
    salario: valSalario,
    esFormularioValido: errores.length === 0,
    resumenErrores: errores
  };
}
