import { describe, it, expect } from 'vitest';
import {
  procesarCalculoIndicador,
  validarSintaxisFormula
} from '../src/utils/motorCalculoIndicadores';

describe('Motor de Cálculo de Indicadores (motorCalculoIndicadores.ts)', () => {
  it('procesa fórmula aritmética estándar (Numerador / Denominador) * Factor', () => {
    const res = procesarCalculoIndicador({
      numerador: 18,
      denominador: 20,
      factorMultiplicador: 100,
      meta: 85,
      limiteAmarillo: 70,
      sentido: 'Mayor es mejor',
      unidadMedida: '%'
    });

    expect(res.estadoCalculo).toBe('EXITOSO');
    expect(res.resultadoNumerico).toBe(90);
    expect(res.resultadoFormateado).toBe('90%');
    expect(res.semaforo).toBe('VERDE');
    expect(res.cumpleMeta).toBe(true);
  });

  it('evalúa dinámicamente fórmulas complejas configuradas por el usuario', () => {
    // Ejemplo de fórmula personalizada: ((A + B) / DENOMINADOR) * FACTOR
    const res = procesarCalculoIndicador({
      numerador: 10,
      denominador: 50,
      factorMultiplicador: 100,
      meta: 80,
      limiteAmarillo: 60,
      sentido: 'Mayor es mejor',
      unidadMedida: '%',
      formulaTexto: '((NUMERADOR * 2) / DENOMINADOR) * FACTOR'
    });

    // ((10 * 2) / 50) * 100 = (20 / 50) * 100 = 40%
    expect(res.estadoCalculo).toBe('EXITOSO');
    expect(res.resultadoNumerico).toBe(40);
    expect(res.resultadoFormateado).toBe('40%');
    expect(res.semaforo).toBe('ROJO');
    expect(res.cumpleMeta).toBe(false);
  });

  it('soporta constantes ARL con factor K = 240000', () => {
    const res = procesarCalculoIndicador({
      numerador: 1,
      denominador: 120000,
      factorMultiplicador: 240000,
      meta: 2.5,
      limiteAmarillo: 5.0,
      sentido: 'Menor es mejor',
      unidadMedida: 'Tasa'
    });

    // (1 / 120000) * 240000 = 2.0
    expect(res.resultadoNumerico).toBe(2);
    expect(res.resultadoFormateado).toBe('2 Tasa');
    expect(res.semaforo).toBe('VERDE');
    expect(res.cumpleMeta).toBe(true);
  });

  it('aplica la regla crítica: denominador cero devuelve NO_CALCULABLE y no 0%', () => {
    const res = procesarCalculoIndicador({
      numerador: 5,
      denominador: 0,
      factorMultiplicador: 100,
      meta: 90,
      limiteAmarillo: 75
    });

    expect(res.resultadoNumerico).toBeNull();
    expect(res.semaforo).toBe('NO_CALCULABLE');
    expect(res.estadoCalculo).toBe('DENOMINADOR_CERO');
    expect(res.cumpleMeta).toBe(false);
    expect(res.resultadoFormateado).toContain('No calculable');
  });

  it('maneja información insuficiente cuando faltan variables requeridas', () => {
    const res = procesarCalculoIndicador({
      numerador: '',
      denominador: 100,
      meta: 80,
      limiteAmarillo: 60
    });

    expect(res.resultadoNumerico).toBeNull();
    expect(res.semaforo).toBe('NO_CALCULABLE');
    expect(res.estadoCalculo).toBe('INFORMACION_INSUFICIENTE');
    expect(res.resultadoFormateado).toContain('Información insuficiente');
  });

  it('valida la sintaxis de fórmulas configuradas', () => {
    const valida = validarSintaxisFormula('(A / B) * 100');
    expect(valida.esValida).toBe(true);
    expect(valida.variablesDetectadas).toContain('A');
    expect(valida.variablesDetectadas).toContain('B');

    const invalida = validarSintaxisFormula('(A / + * 100');
    expect(invalida.esValida).toBe(false);
    expect(invalida.error).toBeDefined();
  });
});
