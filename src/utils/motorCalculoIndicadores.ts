import {
  SemaforoResultado,
  SentidoIndicadorSST
} from '../types';

/**
 * Interfaz para el resultado integral de evaluación del Motor de Cálculo
 */
export interface ResultadoEvaluacionMotor {
  resultadoNumerico: number | null;
  resultadoFormateado: string;
  semaforo: SemaforoResultado;
  cumpleMeta: boolean;
  estadoCalculo: 'EXITOSO' | 'DENOMINADOR_CERO' | 'INFORMACION_INSUFICIENTE' | 'ERROR_SINTAXIS';
  razonTecnica?: string;
  advertencias?: string[];
  detallesCalculo?: {
    formulaAplicada: string;
    expresionEvaluada?: string;
    variablesUtilizadas: Record<string, number | null>;
    factorMultiplicador: number;
    precisionDecimales: number;
  };
}

/**
 * Parámetros de entrada para procesar el cálculo de un indicador dinámicamente
 */
export interface ParametrosCalculoIndicador {
  // Variables numéricas base
  numerador: number | string | null | undefined;
  denominador: number | string | null | undefined;
  factorMultiplicador?: number;
  // Parámetros de control
  meta: number;
  limiteAmarillo: number;
  sentido?: SentidoIndicadorSST;
  unidadMedida?: string;
  rangoMin?: number;
  rangoMax?: number;
  // Configuración de fórmula personalizada
  formulaTexto?: string;
  variablesAdicionales?: Record<string, number | string | null | undefined>;
  precisionDecimales?: number;
  permitirNegativos?: boolean;
}

/**
 * Tokenizador y evaluador aritmético seguro sin `eval` (Shunting-Yard + RPN)
 */
class EvaluadorExpresionSeguro {
  private static readonly PRECEDENCIA: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '%': 2,
    '^': 3
  };

  /**
   * Tokeniza una expresión matemática en tokens válidos
   */
  public static tokenizar(expr: string): string[] {
    // Normalizar operadores y caracteres
    const limpia = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\s+/g, '');

    const tokens: string[] = [];
    let i = 0;

    while (i < limpia.length) {
      const c = limpia[i];

      if (['+', '-', '*', '/', '%', '^', '(', ')'].includes(c)) {
        tokens.push(c);
        i++;
      } else if (/[0-9.]/.test(c)) {
        let numStr = '';
        while (i < limpia.length && /[0-9.]/.test(limpia[i])) {
          numStr += limpia[i];
          i++;
        }
        tokens.push(numStr);
      } else if (/[a-zA-Z_]/.test(c)) {
        let idStr = '';
        while (i < limpia.length && /[a-zA-Z0-9_]/.test(limpia[i])) {
          idStr += limpia[i];
          i++;
        }
        tokens.push(idStr);
      } else {
        // Ignorar o saltar caracteres no soportados
        i++;
      }
    }

    return tokens;
  }

  /**
   * Convierte tokens a notación polaca inversa (RPN)
   */
  public static aRPN(tokens: string[]): string[] {
    const salida: string[] = [];
    const pilaOperadores: string[] = [];

    for (const token of tokens) {
      if (!isNaN(Number(token))) {
        salida.push(token);
      } else if (token in this.PRECEDENCIA) {
        while (
          pilaOperadores.length > 0 &&
          pilaOperadores[pilaOperadores.length - 1] !== '(' &&
          this.PRECEDENCIA[pilaOperadores[pilaOperadores.length - 1]] >= this.PRECEDENCIA[token]
        ) {
          salida.push(pilaOperadores.pop()!);
        }
        pilaOperadores.push(token);
      } else if (token === '(') {
        pilaOperadores.push(token);
      } else if (token === ')') {
        while (pilaOperadores.length > 0 && pilaOperadores[pilaOperadores.length - 1] !== '(') {
          salida.push(pilaOperadores.pop()!);
        }
        pilaOperadores.pop(); // Sacar '('
      } else {
        // Variable literal
        salida.push(token);
      }
    }

    while (pilaOperadores.length > 0) {
      salida.push(pilaOperadores.pop()!);
    }

    return salida;
  }

  /**
   * Evalúa tokens RPN sustituyendo variables
   */
  public static evaluarRPN(
    rpn: string[],
    valores: Record<string, number>
  ): { valor: number | null; error?: string; divisionPorCero?: boolean } {
    const pila: number[] = [];

    for (const token of rpn) {
      if (!isNaN(Number(token))) {
        pila.push(Number(token));
      } else if (token in valores) {
        pila.push(valores[token]);
      } else if (['+', '-', '*', '/', '%', '^'].includes(token)) {
        if (pila.length < 2) {
          return { valor: null, error: `Expresión matemática incompleta cerca de "${token}".` };
        }
        const b = pila.pop()!;
        const a = pila.pop()!;

        switch (token) {
          case '+':
            pila.push(a + b);
            break;
          case '-':
            pila.push(a - b);
            break;
          case '*':
            pila.push(a * b);
            break;
          case '/':
            if (b === 0) {
              return { valor: null, divisionPorCero: true, error: 'División indeterminada por cero en la fórmula.' };
            }
            pila.push(a / b);
            break;
          case '%':
            if (b === 0) {
              return { valor: null, divisionPorCero: true, error: 'Módulo por cero.' };
            }
            pila.push(a % b);
            break;
          case '^':
            pila.push(Math.pow(a, b));
            break;
        }
      } else {
        return { valor: null, error: `Variable no reconocida en la fórmula: "${token}".` };
      }
    }

    if (pila.length !== 1) {
      return { valor: null, error: 'Fórmula mal estructurada o con operadores inconsistentes.' };
    }

    return { valor: pila[0] };
  }
}

/**
 * Función principal del Motor de Cálculo de Indicadores del SG-SST
 */
export function procesarCalculoIndicador(params: ParametrosCalculoIndicador): ResultadoEvaluacionMotor {
  const {
    numerador,
    denominador,
    factorMultiplicador = 100,
    meta,
    limiteAmarillo,
    sentido = 'Mayor es mejor',
    unidadMedida = '%',
    rangoMin,
    rangoMax,
    formulaTexto,
    variablesAdicionales = {},
    precisionDecimales = 2,
    permitirNegativos = false
  } = params;

  const advertencias: string[] = [];

  // 1. Normalización y verificación de existencia de Numerador
  const numParsed = (numerador !== null && numerador !== undefined && numerador !== '')
    ? Number(numerador)
    : null;

  if (numParsed === null || isNaN(numParsed)) {
    return {
      resultadoNumerico: null,
      resultadoFormateado: 'Información insuficiente (Falta numerador)',
      semaforo: 'NO_CALCULABLE',
      cumpleMeta: false,
      estadoCalculo: 'INFORMACION_INSUFICIENTE',
      razonTecnica: 'No se ha suministrado el valor del numerador para procesar el cálculo del indicador.',
      detallesCalculo: {
        formulaAplicada: formulaTexto || '(Numerador / Denominador) × Factor',
        variablesUtilizadas: { Numerador: null, Denominador: null },
        factorMultiplicador,
        precisionDecimales
      }
    };
  }

  // 2. Normalización y verificación de existencia de Denominador
  const denParsed = (denominador !== null && denominador !== undefined && denominador !== '')
    ? Number(denominador)
    : null;

  if (denParsed === null || isNaN(denParsed)) {
    return {
      resultadoNumerico: null,
      resultadoFormateado: 'Información insuficiente (Falta denominador)',
      semaforo: 'NO_CALCULABLE',
      cumpleMeta: false,
      estadoCalculo: 'INFORMACION_INSUFICIENTE',
      razonTecnica: 'No se ha suministrado el valor del denominador base para procesar el cálculo del indicador.',
      detallesCalculo: {
        formulaAplicada: formulaTexto || '(Numerador / Denominador) × Factor',
        variablesUtilizadas: { Numerador: numParsed, Denominador: null },
        factorMultiplicador,
        precisionDecimales
      }
    };
  }

  // 3. Regla crítica: Denominador igual a 0 NO genera 0% falso
  if (denParsed === 0) {
    return {
      resultadoNumerico: null,
      resultadoFormateado: 'No calculable (Denominador = 0)',
      semaforo: 'NO_CALCULABLE',
      cumpleMeta: false,
      estadoCalculo: 'DENOMINADOR_CERO',
      razonTecnica: 'División indeterminada por cero. No existe base o población expuesta registrada en este período para el cálculo.',
      detallesCalculo: {
        formulaAplicada: formulaTexto || '(Numerador / Denominador) × Factor',
        variablesUtilizadas: { Numerador: numParsed, Denominador: 0 },
        factorMultiplicador,
        precisionDecimales
      }
    };
  }

  // 4. Validaciones de coherencia y rangos
  if (!permitirNegativos && (numParsed < 0 || denParsed < 0)) {
    advertencias.push('Se detectaron valores negativos en las variables registradas.');
  }

  if (unidadMedida === '%' && factorMultiplicador === 100 && numParsed > denParsed) {
    advertencias.push('El numerador excede el denominador en un indicador porcentual (resultado superior al 100%). Verifique si se trata de un desfase de período.');
  }

  // 5. Cálculo dinámico del resultado
  let rawResultado: number;
  let formulaAplicada = formulaTexto || '(Numerador / Denominador) × Factor';

  // Si hay una fórmula parametrizable con operadores personalizados
  const tieneFormulaDinamica = Boolean(
    formulaTexto &&
    formulaTexto.trim().length > 0 &&
    (formulaTexto.includes('+') || formulaTexto.includes('-') || formulaTexto.includes('*') || formulaTexto.includes('/') || formulaTexto.includes('^'))
  );

  if (tieneFormulaDinamica && formulaTexto) {
    const mapaVariables: Record<string, number> = {
      NUMERADOR: numParsed,
      DENOMINADOR: denParsed,
      FACTOR: factorMultiplicador,
      A: numParsed,
      B: denParsed,
      K: factorMultiplicador,
      numerador: numParsed,
      denominador: denParsed,
      factor: factorMultiplicador,
      meta: meta
    };

    // Añadir variables adicionales si existen
    Object.entries(variablesAdicionales).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) {
        mapaVariables[k] = Number(v);
        mapaVariables[k.toUpperCase()] = Number(v);
        mapaVariables[k.toLowerCase()] = Number(v);
      }
    });

    try {
      const tokens = EvaluadorExpresionSeguro.tokenizar(formulaTexto);
      const rpn = EvaluadorExpresionSeguro.aRPN(tokens);
      const evalRes = EvaluadorExpresionSeguro.evaluarRPN(rpn, mapaVariables);

      if (evalRes.divisionPorCero) {
        return {
          resultadoNumerico: null,
          resultadoFormateado: 'No calculable (División por cero en fórmula)',
          semaforo: 'NO_CALCULABLE',
          cumpleMeta: false,
          estadoCalculo: 'DENOMINADOR_CERO',
          razonTecnica: 'La expresión dinámica configurada incurrió en una división por cero durante la evaluación.',
          detallesCalculo: {
            formulaAplicada: formulaTexto,
            variablesUtilizadas: mapaVariables,
            factorMultiplicador,
            precisionDecimales
          }
        };
      }

      if (evalRes.error || evalRes.valor === null) {
        // Fallback a cálculo estándar si la fórmula personalizada tiene error de sintaxis
        advertencias.push(`Error en fórmula dinámica: ${evalRes.error}. Se aplicó fórmula estándar de respaldo.`);
        rawResultado = (numParsed / denParsed) * factorMultiplicador;
      } else {
        rawResultado = evalRes.valor;
      }
    } catch (e: any) {
      advertencias.push(`Fallo al evaluar expresión matemática (${e?.message || 'sintaxis no válida'}). Se aplicó cálculo estándar.`);
      rawResultado = (numParsed / denParsed) * factorMultiplicador;
    }
  } else {
    // Cálculo aritmético estándar
    rawResultado = (numParsed / denParsed) * (factorMultiplicador || 1);
  }

  // Redondeo según precisión decimal configurada
  const resultadoNumerico = Number(rawResultado.toFixed(precisionDecimales));

  // 6. Evaluación de Semáforo según Sentido y Meta
  let cumpleMeta = false;
  let semaforo: SemaforoResultado = 'ROJO';

  if (sentido === 'Mayor es mejor') {
    if (resultadoNumerico >= meta) {
      semaforo = 'VERDE';
      cumpleMeta = true;
    } else if (resultadoNumerico >= limiteAmarillo) {
      semaforo = 'AMARILLO';
      cumpleMeta = false;
    } else {
      semaforo = 'ROJO';
      cumpleMeta = false;
    }
  } else if (sentido === 'Menor es mejor') {
    if (resultadoNumerico <= meta) {
      semaforo = 'VERDE';
      cumpleMeta = true;
    } else if (resultadoNumerico <= limiteAmarillo) {
      semaforo = 'AMARILLO';
      cumpleMeta = false;
    } else {
      semaforo = 'ROJO';
      cumpleMeta = false;
    }
  } else if (sentido === 'Dentro de rango') {
    const minVal = rangoMin !== undefined ? rangoMin : limiteAmarillo;
    const maxVal = rangoMax !== undefined ? rangoMax : meta;
    if (resultadoNumerico >= minVal && resultadoNumerico <= maxVal) {
      semaforo = 'VERDE';
      cumpleMeta = true;
    } else {
      semaforo = 'ROJO';
      cumpleMeta = false;
    }
  }

  // 7. Formateo de presentación
  let resultadoFormateado = '';
  if (unidadMedida === '%') {
    resultadoFormateado = `${resultadoNumerico}%`;
  } else if (unidadMedida === 'COP') {
    resultadoFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(resultadoNumerico);
  } else {
    resultadoFormateado = `${resultadoNumerico} ${unidadMedida}`.trim();
  }

  return {
    resultadoNumerico,
    resultadoFormateado,
    semaforo,
    cumpleMeta,
    estadoCalculo: 'EXITOSO',
    advertencias: advertencias.length > 0 ? advertencias : undefined,
    detallesCalculo: {
      formulaAplicada,
      variablesUtilizadas: {
        Numerador: numParsed,
        Denominador: denParsed,
        ...variablesAdicionales
      },
      factorMultiplicador,
      precisionDecimales
    }
  };
}

/**
 * Validador de sintaxis de fórmulas configuradas por el usuario
 */
export function validarSintaxisFormula(formula: string): { esValida: boolean; error?: string; variablesDetectadas: string[] } {
  if (!formula || !formula.trim()) {
    return { esValida: false, error: 'La fórmula no puede estar vacía.', variablesDetectadas: [] };
  }

  try {
    const tokens = EvaluadorExpresionSeguro.tokenizar(formula);
    const variablesDetectadas: string[] = [];

    tokens.forEach(t => {
      if (isNaN(Number(t)) && !['+', '-', '*', '/', '%', '^', '(', ')'].includes(t)) {
        if (!variablesDetectadas.includes(t)) variablesDetectadas.push(t);
      }
    });

    const rpn = EvaluadorExpresionSeguro.aRPN(tokens);
    // Simular evaluación con valores de prueba = 1
    const valoresPrueba: Record<string, number> = {};
    variablesDetectadas.forEach(v => { valoresPrueba[v] = 1; });

    const evalRes = EvaluadorExpresionSeguro.evaluarRPN(rpn, valoresPrueba);
    if (evalRes.error && !evalRes.divisionPorCero) {
      return { esValida: false, error: evalRes.error, variablesDetectadas };
    }

    return { esValida: true, variablesDetectadas };
  } catch (err: any) {
    return { esValida: false, error: err?.message || 'Error de sintaxis en la fórmula.', variablesDetectadas: [] };
  }
}
