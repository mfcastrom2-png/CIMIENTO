import { describe, it, expect } from 'vitest';
import {
  calcularResultadoMedicion,
  generarAnalisisComparativo,
  PLANTILLA_INDICADORES_NORMATIVOS_0312
} from '../src/lib/sstIndicadoresUtils';
import { IndicadorSST, MedicionIndicadorSST } from '../src/types';

describe('Motor de Cálculo Paramétrico de Indicadores SG-SST', () => {
  it('no debe calcular 0% cuando el denominador es cero (muestra No calculable)', () => {
    const res = calcularResultadoMedicion(10, 0, 100, 85, 70, 'Mayor es mejor', '%');
    expect(res.resultadoNumerico).toBeNull();
    expect(res.semaforo).toBe('NO_CALCULABLE');
    expect(res.resultadoFormateado).toContain('No calculable');
    expect(res.cumpleMeta).toBe(false);
  });

  it('no debe calcular cuando falta información en numerador o denominador', () => {
    const res = calcularResultadoMedicion(null, 100, 100, 85, 70, 'Mayor es mejor', '%');
    expect(res.resultadoNumerico).toBeNull();
    expect(res.semaforo).toBe('NO_CALCULABLE');
    expect(res.resultadoFormateado).toContain('Información insuficiente');
  });

  it('evalúa correctamente el sentido "Mayor es mejor"', () => {
    // Cumple meta (>= 85) -> VERDE
    const verde = calcularResultadoMedicion(90, 100, 100, 85, 70, 'Mayor es mejor', '%');
    expect(verde.resultadoNumerico).toBe(90);
    expect(verde.semaforo).toBe('VERDE');
    expect(verde.cumpleMeta).toBe(true);

    // Alerta (entre 70 y 84.99) -> AMARILLO
    const amarillo = calcularResultadoMedicion(75, 100, 100, 85, 70, 'Mayor es mejor', '%');
    expect(amarillo.semaforo).toBe('AMARILLO');
    expect(amarillo.cumpleMeta).toBe(false);

    // Crítico (< 70) -> ROJO
    const rojo = calcularResultadoMedicion(60, 100, 100, 85, 70, 'Mayor es mejor', '%');
    expect(rojo.semaforo).toBe('ROJO');
    expect(rojo.cumpleMeta).toBe(false);
  });

  it('evalúa correctamente el sentido "Menor es mejor" (ej. tasa de accidentalidad)', () => {
    // Meta = 2.5, Alerta = 5.0. Si resultado es 2.0 -> VERDE
    const verde = calcularResultadoMedicion(2, 240000, 240000, 2.5, 5.0, 'Menor es mejor', 'Tasa');
    expect(verde.resultadoNumerico).toBe(2);
    expect(verde.semaforo).toBe('VERDE');
    expect(verde.cumpleMeta).toBe(true);

    // Si resultado es 3.5 -> AMARILLO
    const amarillo = calcularResultadoMedicion(3.5, 240000, 240000, 2.5, 5.0, 'Menor es mejor', 'Tasa');
    expect(amarillo.semaforo).toBe('AMARILLO');

    // Si resultado es 6.0 -> ROJO
    const rojo = calcularResultadoMedicion(6, 240000, 240000, 2.5, 5.0, 'Menor es mejor', 'Tasa');
    expect(rojo.semaforo).toBe('ROJO');
  });

  it('evalúa correctamente el sentido "Dentro de rango"', () => {
    const res = calcularResultadoMedicion(80, 100, 100, 95, 70, 'Dentro de rango', '%', 70, 90);
    expect(res.resultadoNumerico).toBe(80);
    expect(res.semaforo).toBe('VERDE');
    expect(res.cumpleMeta).toBe(true);
  });
});

describe('Análisis Comparativo e Histórico sin alucinaciones de causas', () => {
  const indicadorTest: IndicadorSST = {
    id: 'ind-01',
    codigo: 'IND-PRO-01',
    nombre: 'Ejecución del Plan Anual',
    descripcion: 'Medición de avance',
    tipo: 'Proceso',
    cicloPHVA: 'Hacer',
    procesoRelacionado: 'SST',
    referenciaNormativa: 'Res. 0312',
    objetivoMedicion: 'Control del plan',
    interpretacion: 'Avance %',
    unidadMedida: '%',
    sentido: 'Mayor es mejor',
    formulaTexto: '(A / B) * 100',
    nombreVariableNumerador: 'Ejecutadas',
    nombreVariableDenominador: 'Programadas',
    factorMultiplicador: 100,
    meta: 85,
    limiteAmarillo: 70,
    periodicidad: 'Mensual',
    estado: 'Activo',
    fechaCreacion: '2026-01-01'
  };

  it('retorna información insuficiente cuando no hay mediciones registradas', () => {
    const analisis = generarAnalisisComparativo(indicadorTest, []);
    expect(analisis.medicionActual).toBeNull();
    expect(analisis.totalMedicionesValidas).toBe(0);
    expect(analisis.interpretacionObjetiva).toContain('Información insuficiente');
  });

  it('calcula comparativo de variación, promedio y tendencia con mediciones reales', () => {
    const medicionesTest: MedicionIndicadorSST[] = [
      {
        id: 'm1',
        indicadorId: 'ind-01',
        periodo: '2026-01',
        fechaMedicion: '2026-01-31',
        numeradorValor: 70,
        denominadorValor: 100,
        resultadoNumerico: 70,
        resultadoFormateado: '70%',
        metaEsperada: 85,
        semaforo: 'AMARILLO',
        cumpleMeta: false,
        fuenteDatos: 'Cronograma',
        responsableMedicion: 'Responsable SST',
        fechaRegistro: '2026-01-31',
        usuarioRegistro: 'Admin'
      },
      {
        id: 'm2',
        indicadorId: 'ind-01',
        periodo: '2026-02',
        fechaMedicion: '2026-02-28',
        numeradorValor: 90,
        denominadorValor: 100,
        resultadoNumerico: 90,
        resultadoFormateado: '90%',
        metaEsperada: 85,
        semaforo: 'VERDE',
        cumpleMeta: true,
        fuenteDatos: 'Cronograma',
        responsableMedicion: 'Responsable SST',
        fechaRegistro: '2026-02-28',
        usuarioRegistro: 'Admin'
      }
    ];

    const analisis = generarAnalisisComparativo(indicadorTest, medicionesTest);
    expect(analisis.medicionActual?.periodo).toBe('2026-02');
    expect(analisis.medicionAnterior?.periodo).toBe('2026-01');
    expect(analisis.variacionPeriodoAnterior).toBe(20);
    expect(analisis.tendencia).toBe('Mejora');
    expect(analisis.promedioHistorico).toBe(80);
    expect(analisis.interpretacionObjetiva).toContain('cumple la meta');
  });

  it('detecta condición crítica reiterada cuando 2 períodos consecutivos son ROJO', () => {
    const medicionesCriticas: MedicionIndicadorSST[] = [
      {
        id: 'c1',
        indicadorId: 'ind-01',
        periodo: '2026-01',
        fechaMedicion: '2026-01-31',
        numeradorValor: 50,
        denominadorValor: 100,
        resultadoNumerico: 50,
        resultadoFormateado: '50%',
        metaEsperada: 85,
        semaforo: 'ROJO',
        cumpleMeta: false,
        fuenteDatos: 'Actas',
        responsableMedicion: 'SST',
        fechaRegistro: '2026-01-31',
        usuarioRegistro: 'Admin'
      },
      {
        id: 'c2',
        indicadorId: 'ind-01',
        periodo: '2026-02',
        fechaMedicion: '2026-02-28',
        numeradorValor: 45,
        denominadorValor: 100,
        resultadoNumerico: 45,
        resultadoFormateado: '45%',
        metaEsperada: 85,
        semaforo: 'ROJO',
        cumpleMeta: false,
        fuenteDatos: 'Actas',
        responsableMedicion: 'SST',
        fechaRegistro: '2026-02-28',
        usuarioRegistro: 'Admin'
      }
    ];

    const analisis = generarAnalisisComparativo(indicadorTest, medicionesCriticas);
    expect(analisis.alertasDetectadas.some(a => a.includes('Condición crítica reiterada'))).toBe(true);
  });
});
