import { describe, it, expect } from 'vitest';
import {
  parsearTextoCsvOClipboard,
  generarPlantillaCsvSaldos,
  generarLotePruebaSaldos,
  limpiarNumeroMoneda,
  validarFechaYMD,
  generarNovedadesDesdeSaldosIniciales
} from '../src/services/saldosInicialesService';
import { SaldoInicialEmpleadoNomina, Empleado } from '../src/types';

describe('Suite de Pruebas: Módulo de Carga Masiva de Saldos Iniciales en Nómina y Empleados', () => {
  it('Debe limpiar y parsear correctamente números con formato de moneda colombiano y latino', () => {
    expect(limpiarNumeroMoneda('$ 1.250.000')).toBe(1250000);
    expect(limpiarNumeroMoneda('1,500,000.50')).toBe(1500000.5);
    expect(limpiarNumeroMoneda('—')).toBe(0);
    expect(limpiarNumeroMoneda('-')).toBe(0);
    expect(limpiarNumeroMoneda(2850000)).toBe(2850000);
  });

  it('Debe validar formatos de fecha AAAA-MM-DD', () => {
    expect(validarFechaYMD('2026-02-28')).toBe(true);
    expect(validarFechaYMD('2024-12-31')).toBe(true);
    expect(validarFechaYMD('fecha-invalida')).toBe(false);
    expect(validarFechaYMD('31/12/2024')).toBe(false);
  });

  it('Debe generar la plantilla oficial descargable en CSV con encabezados esperados', () => {
    const csv = generarPlantillaCsvSaldos();
    expect(csv).toContain('documento,nombreCompleto');
    expect(csv).toContain('vacacionesDiasPendientes');
    expect(csv).toContain('cesantiasSaldoAcumuladoCOP');
    expect(csv).toContain('1020892411');
  });

  it('Debe parsear contenido CSV / Excel copy-paste y realizar validación semántica y cruce con censo', () => {
    const empleadosPrueba = [
      {
        id: 'emp-101',
        nombre: 'Carlos Andrés Restrepo',
        documento: '1020892411',
        cargoId: 'c1',
        email: 'carlos@empresa.com'
      }
    ] as unknown as Empleado[];

    const textoCsv = `documento,nombreCompleto,cargoNombre,fechaIngreso,fechaCorteSaldos,vacacionesDiasPendientes,vacacionesValorAcumuladoCOP,cesantiasSaldoAcumuladoCOP,interesesCesantiasAcumuladoCOP,primaServiciosBaseSemestreCOP,diasTrabajadosSemestrePrima,ingresosLaboralesAcumuladosAnoCOP,saludAportesAcumuladosAnoCOP,pensionAportesAcumuladosAnoCOP,fspAportesAcumuladosAnoCOP,retencionFuenteAcumuladaAnoCOP,cesantiasPagadasAnoCOP,prestamoEmpresaSaldoCOP,prestamoEmpresaCuotaMensualCOP,libranzaSaldoCOP,libranzaCuotaMensualCOP,embargoJudicialSaldoCOP,otrasDeduccionesFijasMensualCOP,observaciones
1020892411,Carlos Andres Restrepo,Tecnico,2024-03-15,2026-02-28,18.5,1285000,1750905,210108,875452,60,42500000,1700000,1700000,0,250000,1600000,1200000,150000,0,0,0,50000,Observacion prueba`;

    const resultado = parsearTextoCsvOClipboard(textoCsv, empleadosPrueba);

    expect(resultado.items.length).toBe(1);
    expect(resultado.errores.length).toBe(0);
    expect(resultado.items[0].empleadoId).toBe('emp-101');
    expect(resultado.items[0].documento).toBe('1020892411');
    expect(resultado.items[0].vacacionesDiasPendientes).toBe(18.5);
    expect(resultado.items[0].prestamoEmpresaCuotaMensualCOP).toBe(150000);
    expect(resultado.resumen.totalPasivosCOP).toBeGreaterThan(0);
  });

  it('Debe generar novedades automáticas de deducción en nómina desde cuotas iniciales', () => {
    const saldos: SaldoInicialEmpleadoNomina[] = [
      {
        id: 'saldo-1',
        empleadoId: 'emp-101',
        documento: '1020892411',
        nombreCompleto: 'Carlos Restrepo',
        fechaCorteSaldos: '2026-02-28',
        vacacionesDiasPendientes: 10,
        vacacionesValorAcumuladoCOP: 800000,
        cesantiasSaldoAcumuladoCOP: 1000000,
        interesesCesantiasAcumuladoCOP: 120000,
        primaServiciosBaseSemestreCOP: 500000,
        diasTrabajadosSemestrePrima: 60,
        ingresosLaboralesAcumuladosAnoCOP: 10000000,
        saludAportesAcumuladosAnoCOP: 400000,
        pensionAportesAcumuladosAnoCOP: 400000,
        fspAportesAcumuladosAnoCOP: 0,
        retencionFuenteAcumuladaAnoCOP: 0,
        cesantiasPagadasAnoCOP: 0,
        prestamoEmpresaSaldoCOP: 1200000,
        prestamoEmpresaCuotaMensualCOP: 150000,
        libranzaSaldoCOP: 2000000,
        libranzaCuotaMensualCOP: 200000,
        embargoJudicialSaldoCOP: 0,
        otrasDeduccionesFijasMensualCOP: 50000,
        fechaRegistro: new Date().toISOString()
      }
    ];

    const novedades = generarNovedadesDesdeSaldosIniciales(saldos);
    expect(novedades['emp-101']).toBeDefined();
    expect(novedades['emp-101'].prestamosYDeducciones).toBe(400000); // 150k + 200k + 50k
    expect(novedades['emp-101'].otrasDeduccionesTexto).toContain('Préstamo');
    expect(novedades['emp-101'].otrasDeduccionesTexto).toContain('Libranza');
  });

  it('Debe generar un dataset de prueba representativo con colaboradores', () => {
    const empleadosPrueba = [
      { id: 'emp-1', nombre: 'Juan Pérez', documento: '10101010', cargoId: 'c1' },
      { id: 'emp-2', nombre: 'Ana Gómez', documento: '20202020', cargoId: 'c2' }
    ] as unknown as Empleado[];

    const lote = generarLotePruebaSaldos(empleadosPrueba);
    expect(lote.length).toBe(2);
    expect(lote[0].empleadoId).toBe('emp-1');
    expect(lote[1].empleadoId).toBe('emp-2');
  });

  it('Debe generar y validar la plantilla oficial CSV de Datos de Empleados', async () => {
    const { generarPlantillaCsvEmpleados, parsearTextoCsvEmpleados } = await import('../src/services/importacionEmpleadosService');
    const csvEmpleados = generarPlantillaCsvEmpleados();
    expect(csvEmpleados).toContain('tipoDocumento,documento,primerNombre,segundoNombre');
    expect(csvEmpleados).toContain('1019034789');
    expect(csvEmpleados).toContain('Carlos');

    const resultado = parsearTextoCsvEmpleados(csvEmpleados, [], []);
    expect(resultado.items.length).toBeGreaterThan(0);
    expect(resultado.items[0].documento).toBe('1019034789');
    expect(resultado.items[0].persona?.primerNombre).toBe('Carlos');
  });
});
