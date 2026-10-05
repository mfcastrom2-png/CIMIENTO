import { describe, it, expect } from 'vitest';
import {
  calcularNivelResultado,
  getNivelLabel,
  getClasificacion,
  calcularSubtotalResultados,
  calcularSubtotalCompetencias,
  calcularSubtotalCumplimiento,
  calcularSubtotalDesarrollo,
  detectarSesgosYAlertas,
  generarPlanDesarrolloSugerido
} from '../src/services/evaluationEngine';
import {
  PARAMETROS_COLOMBIA_2026,
  calcularLiquidacionEmpleado,
  simularLiquidacionDefinitiva,
  calcularReservasProvisionesEmpleado,
  calcularPrimaServiciosSemestral,
  calcularCesantiasEInteresesEmpleado,
  calcularVacacionesEmpleado,
  calcularConsolidadoReservas,
  parseSalarioNumerico,
  determinarClaseRiesgoARL,
  esContratoSinNominaLaboral,
  crearPeriodoNomina,
  obtenerFechaIngresoEmpleado,
  obtenerFechaRetiroEmpleado,
  estaEmpleadoDisponibleEnPeriodo,
  calcularDiasDefectoPeriodoEmpleado,
  filtrarEmpleadosDisponiblesEnPeriodo
} from '../src/services/payrollEngine';
import {
  FESTIVOS_COLOMBIA_2026_2027,
  obtenerNombreFestivoColombia,
  esFinDeSemanaOFestivo,
  calcularFechaFinalPermisoRemunerado
} from '../src/utils/festivosColombia';
import {
  calcularProvisionMensualVacaciones,
  calcularPasivosLaboralesCompletos,
  esContratoSinNomina
} from '../src/services/saldosInicialesService';
import {
  Empleado,
  NovedadNominaEmpleado,
  ItemResultadoEvaluacion,
  ItemCompetenciaEvaluacion,
  ComponenteCumplimientoEvaluacion,
  ComponenteDesarrolloEvaluacion
} from '../src/types';
import { calcularGtc45 } from '../src/components/MatrizRiesgosGTC45View';

describe('Suite de Pruebas: Motor de Evaluación de Desempeño (evaluationEngine)', () => {
  describe('Ponderación y Componentes de Evaluación (Total 100%)', () => {
    it('Debe calcular correctamente el Componente 1: Resultados del cargo (50% max)', () => {
      // 2 items con pesos 25 y 25 (suman 50)
      const items: ItemResultadoEvaluacion[] = [
        {
          id: 'res-1',
          indicadorNombre: 'Disponibilidad de plataforma',
          formula: 'Uptime / Total',
          meta: 100,
          resultadoReal: 110, // Nivel 5 -> factor 1.0 -> 25 puntos
          unidad: '%',
          evidencia: 'Reporte OT-2026-01',
          peso: 25,
          nivelCalculado: 5,
          puntajePonderado: 25
        },
        {
          id: 'res-2',
          indicadorNombre: 'Tiempo de respuesta a incidentes',
          formula: 'Suma tiempos / N',
          meta: 100,
          resultadoReal: 95, // Nivel 3 -> factor 3/5 = 0.6 -> 15 puntos
          unidad: 'min',
          evidencia: 'Reporte OT-2026-02',
          peso: 25,
          nivelCalculado: 3,
          puntajePonderado: 15
        }
      ];

      const subtotal = calcularSubtotalResultados(items);
      // Esperado: 25 * (5/5) + 25 * (3/5) = 25 + 15 = 40.0
      expect(subtotal).toBe(40.0);
    });

    it('Debe normalizar a 50 puntos si los pesos no suman exactamente 50', () => {
      const items: ItemResultadoEvaluacion[] = [
        {
          id: 'res-1',
          indicadorNombre: 'Métrica A',
          formula: 'A / B',
          meta: 10,
          resultadoReal: 10,
          unidad: 'und',
          evidencia: 'Doc 1',
          peso: 50,
          nivelCalculado: 4,
          puntajePonderado: 40
        },
        {
          id: 'res-2',
          indicadorNombre: 'Métrica B',
          formula: 'C / D',
          meta: 10,
          resultadoReal: 10,
          unidad: 'und',
          evidencia: 'Doc 2',
          peso: 50,
          nivelCalculado: 4,
          puntajePonderado: 40
        }
      ];
      // Total peso = 100, puntos = 80, normalizado: (80/100)*50 = 40
      const subtotal = calcularSubtotalResultados(items);
      expect(subtotal).toBe(40.0);
    });

    it('Debe retornar 0 si no hay items de resultados o peso total es 0', () => {
      expect(calcularSubtotalResultados([])).toBe(0);
      expect(calcularSubtotalResultados([{
        id: '1',
        indicadorNombre: 'x',
        formula: 'x',
        meta: 1,
        resultadoReal: 1,
        unidad: 'u',
        evidencia: 'e',
        peso: 0,
        nivelCalculado: 5,
        puntajePonderado: 0
      }])).toBe(0);
    });

    it('Debe calcular correctamente el Componente 2: Competencias (25% max)', () => {
      const competencias: ItemCompetenciaEvaluacion[] = [
        {
          id: 'comp-1',
          competenciaNombre: 'Liderazgo',
          tipo: 'Corporativa',
          nivelRequerido: 'Alto',
          calificacionNivel: 5,
          conductaObservable: 'Liderazgo visible',
          evidencia: 'Lideró 3 proyectos exitosos',
          observacion: 'Excelente'
        },
        {
          id: 'comp-2',
          competenciaNombre: 'Trabajo en equipo',
          tipo: 'Corporativa',
          nivelRequerido: 'Intermedio',
          calificacionNivel: 4,
          conductaObservable: 'Colaboración efectiva',
          evidencia: 'Excelente colaboración',
          observacion: 'Muy bueno'
        },
        {
          id: 'comp-3',
          competenciaNombre: 'Orientación al resultado',
          tipo: 'Técnica',
          nivelRequerido: 'Alto',
          calificacionNivel: 3,
          conductaObservable: 'Cumplimiento de tareas',
          evidencia: 'Cumplió metas',
          observacion: 'Aceptable'
        }
      ];
      // Promedio = (5 + 4 + 3) / 3 = 4.0
      // Puntaje = (4.0 / 5) * 25 = 20.0
      const subtotal = calcularSubtotalCompetencias(competencias);
      expect(subtotal).toBe(20.0);
    });

    it('Debe calcular correctamente el Componente 3: Responsabilidades y Cumplimiento (15% max)', () => {
      const compCumplimiento: ComponenteCumplimientoEvaluacion = {
        cumplimientoProcedimientos: { nivel: 5, evidencia: 'OK', peso: 4 }, // (5/5)*4 = 4
        sgSst: {
          nivel: 5,
          evidencia: 'OK',
          peso: 4,
          usaEpp: true,
          reportaCondiciones: true,
          cumpleTrabajoSeguro: true,
          participaCapacitaciones: true
        }, // (5/5)*4 = 4
        gestionInformacion: { nivel: 5, evidencia: 'OK', peso: 3 }, // (5/5)*3 = 3
        cumplimientoAdministrativo: { nivel: 5, evidencia: 'OK', peso: 2 }, // (5/5)*2 = 2
        convivenciaConducta: { nivel: 5, evidencia: 'OK', peso: 2 }, // (5/5)*2 = 2
        totalObtenido: 15
      };
      // Total = 4 + 4 + 3 + 2 + 2 = 15.0
      expect(calcularSubtotalCumplimiento(compCumplimiento)).toBe(15.0);

      // Caso mínimo: nivel 1 en todo
      const compMin: ComponenteCumplimientoEvaluacion = {
        cumplimientoProcedimientos: { nivel: 1, evidencia: 'Bajo', peso: 4 }, // (1/5)*4 = 0.8
        sgSst: {
          nivel: 1,
          evidencia: 'Bajo',
          peso: 4,
          usaEpp: false,
          reportaCondiciones: false,
          cumpleTrabajoSeguro: false,
          participaCapacitaciones: false
        }, // (1/5)*4 = 0.8
        gestionInformacion: { nivel: 1, evidencia: 'Bajo', peso: 3 }, // (1/5)*3 = 0.6
        cumplimientoAdministrativo: { nivel: 1, evidencia: 'Bajo', peso: 2 }, // (1/5)*2 = 0.4
        convivenciaConducta: { nivel: 1, evidencia: 'Bajo', peso: 2 }, // (1/5)*2 = 0.4
        totalObtenido: 3
      };
      expect(calcularSubtotalCumplimiento(compMin)).toBe(3.0);
    });

    it('Debe calcular correctamente el Componente 4: Desarrollo y Mejora (10% max)', () => {
      const compDesarrollo: ComponenteDesarrolloEvaluacion = {
        cumplimientoPlanAnterior: { nivel: 5, detalle: 'Cumplido', peso: 4 }, // (5/5)*4 = 4
        aprendizajeCapacitacion: { nivel: 5, detalle: 'Completado', peso: 3 }, // (5/5)*3 = 3
        iniciativasMejora: { nivel: 5, detalle: 'Implementada', peso: 3 }, // (5/5)*3 = 3
        totalObtenido: 10
      };
      // Total = 4 + 3 + 3 = 10.0
      expect(calcularSubtotalDesarrollo(compDesarrollo)).toBe(10.0);
    });

    it('La sumatoria máxima de los 4 componentes debe ser exactamente 100 puntos', () => {
      const maxResultados = 50.0;
      const maxCompetencias = 25.0;
      const maxCumplimiento = 15.0;
      const maxDesarrollo = 10.0;
      expect(maxResultados + maxCompetencias + maxCumplimiento + maxDesarrollo).toBe(100.0);
    });
  });

  describe('Escalas de Cumplimiento y Clasificación Cualitativa', () => {
    it('Debe categorizar los niveles según porcentajes de meta', () => {
      expect(calcularNivelResultado(100, 120)).toBe(5); // >= 110%
      expect(calcularNivelResultado(100, 110)).toBe(5);
      expect(calcularNivelResultado(100, 105)).toBe(4); // 100 - 109%
      expect(calcularNivelResultado(100, 100)).toBe(4);
      expect(calcularNivelResultado(100, 95)).toBe(3); // 90 - 99%
      expect(calcularNivelResultado(100, 90)).toBe(3);
      expect(calcularNivelResultado(100, 85)).toBe(2); // 70 - 89%
      expect(calcularNivelResultado(100, 70)).toBe(2);
      expect(calcularNivelResultado(100, 69)).toBe(1); // < 70%
      expect(calcularNivelResultado(100, 0)).toBe(1);
    });

    it('Debe clasificar el desempeño cualitativo según puntaje total obtenido', () => {
      expect(getClasificacion(95)).toBe('Excepcional');
      expect(getClasificacion(90)).toBe('Excepcional');
      expect(getClasificacion(85)).toBe('Sobresaliente');
      expect(getClasificacion(80)).toBe('Sobresaliente');
      expect(getClasificacion(75)).toBe('Satisfactorio');
      expect(getClasificacion(70)).toBe('Satisfactorio');
      expect(getClasificacion(65)).toBe('En desarrollo');
      expect(getClasificacion(60)).toBe('En desarrollo');
      expect(getClasificacion(59)).toBe('Crítico');
      expect(getClasificacion(0)).toBe('Crítico');
    });
  });

  describe('Detección de Sesgos, Alertas y Planes de Mejora', () => {
    const compCumplimientoBase: ComponenteCumplimientoEvaluacion = {
      cumplimientoProcedimientos: { nivel: 5, evidencia: 'Evidencia', peso: 4 },
      sgSst: {
        nivel: 5,
        evidencia: 'Evidencia',
        peso: 4,
        usaEpp: true,
        reportaCondiciones: true,
        cumpleTrabajoSeguro: true,
        participaCapacitaciones: true
      },
      gestionInformacion: { nivel: 5, evidencia: 'Evidencia', peso: 3 },
      cumplimientoAdministrativo: { nivel: 5, evidencia: 'Evidencia', peso: 2 },
      convivenciaConducta: { nivel: 5, evidencia: 'Evidencia', peso: 2 },
      totalObtenido: 15
    };

    it('Debe detectar Efecto Halo cuando todas las competencias tienen calificación perfecta (5)', () => {
      const competencias: ItemCompetenciaEvaluacion[] = [
        { id: '1', competenciaNombre: 'C1', tipo: 'Corporativa', nivelRequerido: 'Alto', calificacionNivel: 5, conductaObservable: 'Obs', evidencia: 'Evidencia suficiente 1', observacion: 'Obs' },
        { id: '2', competenciaNombre: 'C2', tipo: 'Corporativa', nivelRequerido: 'Alto', calificacionNivel: 5, conductaObservable: 'Obs', evidencia: 'Evidencia suficiente 2', observacion: 'Obs' },
        { id: '3', competenciaNombre: 'C3', tipo: 'Corporativa', nivelRequerido: 'Alto', calificacionNivel: 5, conductaObservable: 'Obs', evidencia: 'Evidencia suficiente 3', observacion: 'Obs' }
      ];
      const sesgos = detectarSesgosYAlertas([], competencias, compCumplimientoBase);
      expect(sesgos.some(s => s.tipo === 'EfectoHalo')).toBe(true);
    });

    it('Debe alertar cuando hay calificaciones altas (>=4) sin soporte de evidencia', () => {
      const competencias: ItemCompetenciaEvaluacion[] = [
        { id: '1', competenciaNombre: 'Liderazgo', tipo: 'Corporativa', nivelRequerido: 'Alto', calificacionNivel: 5, conductaObservable: 'Obs', evidencia: '', observacion: 'Obs' }
      ];
      const sesgos = detectarSesgosYAlertas([], competencias, compCumplimientoBase);
      expect(sesgos.some(s => s.tipo === 'FaltaEvidencia')).toBe(true);
    });

    it('Debe generar automáticamente plan de desarrollo para brechas en competencias o resultados', () => {
      const competencias: ItemCompetenciaEvaluacion[] = [
        { id: '1', competenciaNombre: 'Comunicación y atención al cliente', tipo: 'Corporativa', nivelRequerido: 'Alto', calificacionNivel: 2, conductaObservable: 'Obs', evidencia: '', observacion: 'Obs' }
      ];
      const resultados: ItemResultadoEvaluacion[] = [
        { id: 'r1', indicadorNombre: 'Cumplimiento de bitácora', formula: 'F', meta: 100, resultadoReal: 60, unidad: '%', evidencia: 'E', peso: 50, nivelCalculado: 1, puntajePonderado: 10 }
      ];

      const plan = generarPlanDesarrolloSugerido(resultados, competencias);
      expect(plan.length).toBe(2);
      expect(plan[0].competenciaOIndicador).toContain('Comunicación');
      expect(plan[0].accionPropuesta).toContain('Coaching individual');
      expect(plan[1].competenciaOIndicador).toContain('Cumplimiento de bitácora');
    });
  });
});

describe('Suite de Pruebas: Motor de Nómina y Liquidaciones (payrollEngine)', () => {
  const empleadoBase: Empleado = {
    id: 'emp-001',
    documento: '1020304050',
    nombre: 'JUAN PÉREZ TESTING',
    email: 'juan.perez@test.com',
    telefono: '3001234567',
    cargoId: 'c2',
    areaId: 'a1',
    formacion: 'Profesional',
    experiencia: '3 años',
    familia: [],
    activo: true,
    empresaId: 'empresa-a',
    contrato: {
      tipo: 'Término indefinido',
      inicio: '2025-01-01',
      fin: '—',
      salario: '$ 1.750.905'
    }
  };

  const novedadesVacias: NovedadNominaEmpleado = {
    diasTrabajados: 30,
    horasExtrasDiurnas: 0,
    horasExtrasNocturnas: 0,
    horasFestivasDiurnas: 0,
    horasFestivasNocturnas: 0,
    recargoNocturnoOrdinario: 0,
    bonificacionesSalariales: 0,
    bonificacionesNoSalariales: 0,
    comisiones: 0,
    incapacidadDias: 0,
    licenciaRemuneradaDias: 0,
    prestamosYDeducciones: 0
  };

  describe('Cálculo de Nómina Ordinaria con Salario Mínimo (1 SMMLV 2026)', () => {
    it('Debe liquidar correctamente un empleado con 1 SMMLV ($1.750.905) y Auxilio de Transporte ($249.095)', () => {
      const liq = calcularLiquidacionEmpleado(
        empleadoBase,
        'Auxiliar Administrativo',
        'ADM-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      // Devengados
      expect(liq.devengados.salarioBasico).toBe(1750905);
      expect(liq.devengados.salarioProporcional).toBe(1750905);
      expect(liq.devengados.auxilioTransporte).toBe(249095);
      expect(liq.devengados.totalDevengado).toBe(2000000);

      // Deducciones (4% salud y 4% pensión sobre IBC de $1.750.905)
      // 1.750.905 * 0.04 = 70.036
      expect(liq.deducciones.saludEmpleado).toBe(70036);
      expect(liq.deducciones.pensionEmpleado).toBe(70036);
      expect(liq.deducciones.fondoSolidaridadPensional).toBe(0);
      expect(liq.deducciones.retencionFuente).toBe(0);
      expect(liq.deducciones.totalDeducciones).toBe(140072);

      // Neto a pagar: 2.000.000 - 140.072 = 1.859.928
      expect(liq.netoAPagar).toBe(1859928);

      // Aportes patronales: Exonerado de Salud (Art 114-1), Sena (0), ICBF (0) por devengar < 10 SMMLV
      expect(liq.aportesEmpresa.exoneradoArt114_1).toBe(true);
      expect(liq.aportesEmpresa.saludEmpleador).toBe(0);
      expect(liq.aportesEmpresa.pensionEmpleador).toBe(210109); // 12% de 1.750.905
      expect(liq.aportesEmpresa.cajaCompensacion).toBe(70036); // 4% de 1.750.905
      expect(liq.aportesEmpresa.sena).toBe(0);
      expect(liq.aportesEmpresa.icbf).toBe(0);

      // Provisiones de ley sobre total devengado ($2.000.000)
      // Cesantías: 2.000.000 * 0.0833 = 166.600
      expect(liq.provisiones.cesantias).toBe(Math.round(2000000 * 0.0833));
      // Intereses sobre cesantías: Cesantías * 0.12 (Ley 52 de 1975: 12% anual sobre cesantías)
      expect(liq.provisiones.interesesCesantias).toBe(Math.round(Math.round(2000000 * 0.0833) * 0.12));
      // Prima de servicios: 2.000.000 * 0.0833 = 166.600
      expect(liq.provisiones.primaServicios).toBe(Math.round(2000000 * 0.0833));
      // Vacaciones (sin auxilio de transporte): 1.750.905 * 0.0417 = 73.013
      expect(liq.provisiones.vacaciones).toBe(Math.round(1750905 * 0.0417));
    });

    it('Debe calcular correctamente el ingreso a mitad de mes (15 días laborados)', () => {
      const novedades15Dias: NovedadNominaEmpleado = {
        ...novedadesVacias,
        diasTrabajados: 15
      };

      const liq = calcularLiquidacionEmpleado(
        empleadoBase,
        'Auxiliar Administrativo',
        'ADM-001',
        novedades15Dias,
        PARAMETROS_COLOMBIA_2026
      );

      // Salario proporcional: 1.750.905 / 30 * 15 = 875.453
      expect(liq.devengados.salarioProporcional).toBe(Math.round((1750905 / 30) * 15));
      // Auxilio proporcional: 249.095 / 30 * 15 = 124.548
      expect(liq.devengados.auxilioTransporte).toBe(Math.round((249095 / 30) * 15));
      expect(liq.devengados.totalDevengado).toBe(Math.round((1750905 / 30) * 15) + Math.round((249095 / 30) * 15));

      // IBC mínimo legal para seguridad social es 1 SMMLV ($1.750.905)
      expect(liq.deducciones.saludEmpleado).toBe(70036);
      expect(liq.deducciones.pensionEmpleado).toBe(70036);
    });
  });

  describe('Cálculo de Empleados con Salarios Superiores y Topes de Ley', () => {
    it('No debe otorgar auxilio de transporte a salarios mayores a 2 SMMLV ($3.501.810)', () => {
      const empSalarioAlto: Empleado = {
        ...empleadoBase,
        contrato: {
          ...empleadoBase.contrato,
          salario: '$ 4.500.000'
        }
      };

      const liq = calcularLiquidacionEmpleado(
        empSalarioAlto,
        'Ingeniero de Software',
        'TEC-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      expect(liq.tieneDerechoAuxilioTransporte).toBe(false);
      expect(liq.devengados.auxilioTransporte).toBe(0);
      expect(liq.devengados.totalDevengado).toBe(4500000);
    });

    it('Debe aplicar Fondo de Solidaridad Pensional (FSP 1%) cuando el salario es >= 4 SMMLV ($7.003.620)', () => {
      const empSalarioFSP: Empleado = {
        ...empleadoBase,
        contrato: {
          ...empleadoBase.contrato,
          salario: '$ 8.000.000'
        }
      };

      const liq = calcularLiquidacionEmpleado(
        empSalarioFSP,
        'Director de Operaciones',
        'DIR-002',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      // FSP = 8.000.000 * 0.01 = 80.000
      expect(liq.deducciones.fondoSolidaridadPensional).toBe(80000);
    });

    it('Debe cobrar aportes patronales plenos (Salud 8.5%, Sena 2%, ICBF 3%) si el salario es >= 10 SMMLV', () => {
      const empSalarioIntegral: Empleado = {
        ...empleadoBase,
        contrato: {
          ...empleadoBase.contrato,
          salario: '$ 18.000.000'
        }
      };

      const liq = calcularLiquidacionEmpleado(
        empSalarioIntegral,
        'Presidente Ejecutivo',
        'DIR-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      expect(liq.aportesEmpresa.exoneradoArt114_1).toBe(false);
      // Salud empleador 8.5% sobre 18.000.000 = 1.530.000
      expect(liq.aportesEmpresa.saludEmpleador).toBe(1530000);
      // Sena 2% = 360.000
      expect(liq.aportesEmpresa.sena).toBe(360000);
      // ICBF 3% = 540.000
      expect(liq.aportesEmpresa.icbf).toBe(540000);
    });
  });

  describe('Cálculo de Horas Extras y Recargos (Ley 2101 / CST con divisor 210h)', () => {
    it('Debe calcular con precisión horas extras diurnas (1.25) y nocturnas (1.75)', () => {
      const novedadesExtras: NovedadNominaEmpleado = {
        ...novedadesVacias,
        horasExtrasDiurnas: 10,
        horasExtrasNocturnas: 5,
        recargoNocturnoOrdinario: 20
      };

      const liq = calcularLiquidacionEmpleado(
        empleadoBase,
        'Técnico Operativo',
        'TEC-002',
        novedadesExtras,
        PARAMETROS_COLOMBIA_2026
      );

      // Valor hora ordinaria con jornada 2026 (210 horas): 1.750.905 / 210 = 8337.6428
      const valorHora = 1750905 / 210;
      const expectedHED = Math.round(valorHora * 1.25 * 10);
      const expectedHEN = Math.round(valorHora * 1.75 * 5);
      const expectedRN = Math.round(valorHora * 0.35 * 20);

      expect(liq.devengados.valorHorasExtrasYRecargos).toBe(expectedHED + expectedHEN + expectedRN);
    });
  });

  describe('Contratos Especiales Sin Nómina Patronal', () => {
    it('No debe generar deducciones ni provisiones patronales para contratos de prestación de servicios', () => {
      const empServicios: Empleado = {
        ...empleadoBase,
        contrato: {
          ...empleadoBase.contrato,
          tipo: 'Prestación de servicios',
          salario: '$ 3.500.000'
        }
      };

      const liq = calcularLiquidacionEmpleado(
        empServicios,
        'Consultor Externo',
        'EXT-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      expect(esContratoSinNominaLaboral('Prestación de servicios')).toBe(true);
      expect(liq.deducciones.saludEmpleado).toBe(0);
      expect(liq.deducciones.pensionEmpleado).toBe(0);
      expect(liq.devengados.auxilioTransporte).toBe(0);
      expect(liq.provisiones.cesantias).toBe(0);
      expect(liq.provisiones.primaServicios).toBe(0);
      expect(liq.provisiones.vacaciones).toBe(0);
      expect(liq.netoAPagar).toBe(3500000);
    });
  });

  describe('Simulador de Liquidación Definitiva (CST Art. 64 / Art. 249)', () => {
    it('Debe calcular correctamente la liquidación por renuncia voluntaria', () => {
      const sim = simularLiquidacionDefinitiva(
        empleadoBase,
        'Renuncia voluntaria',
        '2025-12-31',
        15, // 15 días pendientes
        PARAMETROS_COLOMBIA_2026
      );

      expect(sim.motivoRetiro).toBe('Renuncia voluntaria');
      expect(sim.indemnizacionDespidoInjusto).toBe(0);
      expect(sim.cesantiasPendientes).toBeGreaterThan(0);
      expect(sim.interesesCesantiasPendientes).toBeGreaterThan(0);
      expect(sim.primaServiciosPendiente).toBeGreaterThan(0);
      expect(sim.valorVacacionesPendientes).toBe(Math.round((1750905 * 15) / 30));
    });

    it('Debe calcular la indemnización por despido sin justa causa', () => {
      const sim = simularLiquidacionDefinitiva(
        empleadoBase,
        'Despido sin justa causa',
        '2025-12-31',
        15,
        PARAMETROS_COLOMBIA_2026
      );

      expect(sim.indemnizacionDespidoInjusto).toBeGreaterThanOrEqual(1750905);
      expect(sim.totalLiquidacionDefinitiva).toBe(
        sim.cesantiasPendientes +
        sim.interesesCesantiasPendientes +
        sim.primaServiciosPendiente +
        sim.valorVacacionesPendientes +
        sim.indemnizacionDespidoInjusto
      );
    });
  });

  describe('Cálculo Semestral de Prima de Servicios (Art. 306 CST - Director Administrativo y Empleados Operativos)', () => {
    it('Debe calcular la prima de servicios del Director Administrativo sin auxilio de transporte (> 2 SMMLV)', () => {
      const directorAdmin: Empleado = {
        ...empleadoBase,
        id: 'e2',
        nombre: 'Andrés Pinilla (Director Administrativo)',
        salarioBase: 4800000,
        contrato: {
          tipo: 'Término indefinido',
          salario: '$ 4.800.000',
          inicio: '2022-01-10',
          fin: '—'
        }
      };

      const liqDirector = calcularLiquidacionEmpleado(
        directorAdmin,
        'Director Administrativo',
        'ADM-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      // Calcular prima semestral en junio (mes 6) para 180 días laborados
      const primaDirector = calcularPrimaServiciosSemestral(
        directorAdmin,
        liqDirector,
        6, // Junio
        2026,
        PARAMETROS_COLOMBIA_2026
      );

      expect(primaDirector.salarioBasico).toBe(4800000);
      expect(primaDirector.tieneDerechoAuxilioTransporte).toBe(false);
      expect(primaDirector.auxilioTransporte).toBe(0);
      expect(primaDirector.baseSalarioPromedio).toBe(4800000);
      expect(primaDirector.diasLaboradosSemestre).toBe(180);
      // Prima semestral = (4.800.000 * 180) / 360 = 2.400.000
      expect(primaDirector.primaSemestralCausada).toBe(2400000);
      expect(primaDirector.fechaPagoLimite).toContain('30 de Junio');
    });

    it('Debe calcular la prima del Director General con Salario $9.500.000 (sin auxilio de transporte)', () => {
      const directorGeneral: Empleado = {
        ...empleadoBase,
        id: 'e1',
        nombre: 'Marcela Rueda (Gerente General)',
        salarioBase: 9500000,
        contrato: {
          tipo: 'Término indefinido',
          salario: '$ 9.500.000',
          inicio: '2019-03-01',
          fin: '—'
        }
      };

      const liqGeneral = calcularLiquidacionEmpleado(
        directorGeneral,
        'Gerencia General',
        'DIR-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      const primaGeneral = calcularPrimaServiciosSemestral(
        directorGeneral,
        liqGeneral,
        6,
        2026,
        PARAMETROS_COLOMBIA_2026
      );

      expect(primaGeneral.tieneDerechoAuxilioTransporte).toBe(false);
      expect(primaGeneral.baseSalarioPromedio).toBe(9500000);
      // Prima = (9.500.000 * 180) / 360 = 4.750.000
      expect(primaGeneral.primaSemestralCausada).toBe(4750000);
    });

    it('Debe calcular la prima de un colaborador operativo (<= 2 SMMLV) incluyendo Auxilio de Transporte', () => {
      const tecnicoOperativo: Empleado = {
        ...empleadoBase,
        id: 'e6',
        nombre: 'Carlos Restrepo',
        salarioBase: 2800000,
        contrato: {
          tipo: 'Término indefinido',
          salario: '$ 2.800.000',
          inicio: '2024-01-15',
          fin: '—'
        }
      };

      const liqTecnico = calcularLiquidacionEmpleado(
        tecnicoOperativo,
        'Técnico de Redes',
        'TEC-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      const primaTecnico = calcularPrimaServiciosSemestral(
        tecnicoOperativo,
        liqTecnico,
        6,
        2026,
        PARAMETROS_COLOMBIA_2026
      );

      expect(primaTecnico.tieneDerechoAuxilioTransporte).toBe(true);
      expect(primaTecnico.auxilioTransporte).toBe(249095);
      // Base = 2.800.000 + 249.095 = 3.049.095
      expect(primaTecnico.baseSalarioPromedio).toBe(3049095);
      // Prima = (3.049.095 * 180) / 360 = 1.524.548
      expect(primaTecnico.primaSemestralCausada).toBe(1524548);
    });

    it('Debe calcular la prima proporcional para un empleado ingresado a mitad de semestre (60 días)', () => {
      const empleadoNuevo: Empleado = {
        ...empleadoBase,
        id: 'e7',
        nombre: 'Mateo Cárdenas',
        salarioBase: 2600000,
        contrato: {
          tipo: 'Término fijo',
          salario: '$ 2.600.000',
          inicio: '2026-05-01', // Ingresó el 1 de mayo (60 días trabajados en semestre 1 a junio)
          fin: '2027-04-30'
        }
      };

      const liqNuevo = calcularLiquidacionEmpleado(
        empleadoNuevo,
        'Técnico de Instalaciones',
        'TEC-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      const prima60Dias = calcularPrimaServiciosSemestral(
        empleadoNuevo,
        liqNuevo,
        6, // Junio
        2026,
        PARAMETROS_COLOMBIA_2026
      );

      expect(prima60Dias.diasLaboradosSemestre).toBe(60);
      // Base = 2.600.000 + 249.095 = 2.849.095
      // Prima = (2.849.095 * 60) / 360 = 474.849
      expect(prima60Dias.primaSemestralCausada).toBe(Math.round((2849095 * 60) / 360));
    });
  });

  describe('Cálculo de Provisión Mensual de Cesantías e Intereses (Art. 249 CST y Ley 50 de 1990)', () => {
    it('Debe calcular la provisión mensual (8.33%) y acumulada para un colaborador operativo con auxilio de transporte', () => {
      const tecnico: Empleado = {
        ...empleadoBase,
        id: 'e6',
        nombre: 'Carlos Restrepo',
        salarioBase: 2800000,
        contrato: {
          tipo: 'Término indefinido',
          salario: '$ 2.800.000',
          inicio: '2024-01-15',
          fin: '—'
        }
      };

      const liqTecnico = calcularLiquidacionEmpleado(
        tecnico,
        'Técnico de Redes',
        'TEC-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      const res = calcularCesantiasEInteresesEmpleado(
        tecnico,
        liqTecnico,
        12, // Diciembre (360 días)
        2026,
        PARAMETROS_COLOMBIA_2026
      );

      // Auxilio de Transporte aplica por devengar <= 2 SMMLV
      expect(res.tieneDerechoAuxilioTransporte).toBe(true);
      expect(res.auxilioTransporte).toBe(249095);
      expect(res.baseSalarioCesantias).toBe(3049095); // 2.800.000 + 249.095

      // Provisión mensual: 8.33% de 3.049.095 = 253.990
      expect(res.provisionMensualCesantias).toBe(Math.round(3049095 * 0.0833));
      // Intereses mensuales: 1% mensual (12% anual) = 30.479
      expect(res.provisionMensualIntereses).toBe(Math.round(Math.round(3049095 * 0.0833) * 0.12));

      // Acumulado anual: 360 días = 100% de la base = 3.049.095
      expect(res.cesantiasAcumuladasYTD).toBe(3049095);
      // Intereses anuales: 3.049.095 * 12% = 365.891
      expect(res.interesesCesantiasAcumuladosYTD).toBe(Math.round(3049095 * 0.12));

      // Fechas legales de corte
      expect(res.fechaLimiteConsignacionFondo).toContain('14 de Febrero');
      expect(res.fechaLimitePagoIntereses).toContain('31 de Enero');
    });

    it('Debe calcular la provisión de cesantías para Director Administrativo excluyendo Auxilio de Transporte (> 2 SMMLV)', () => {
      const director: Empleado = {
        ...empleadoBase,
        id: 'e2',
        nombre: 'Andrés Pinilla',
        salarioBase: 4800000,
        contrato: {
          tipo: 'Término indefinido',
          salario: '$ 4.800.000',
          inicio: '2022-01-10',
          fin: '—'
        }
      };

      const liqDirector = calcularLiquidacionEmpleado(
        director,
        'Director Administrativo',
        'ADM-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      const res = calcularCesantiasEInteresesEmpleado(
        director,
        liqDirector,
        12,
        2026,
        PARAMETROS_COLOMBIA_2026
      );

      expect(res.tieneDerechoAuxilioTransporte).toBe(false);
      expect(res.auxilioTransporte).toBe(0);
      expect(res.baseSalarioCesantias).toBe(4800000);
      expect(res.provisionMensualCesantias).toBe(Math.round(4800000 * 0.0833));
      expect(res.cesantiasAcumuladasYTD).toBe(4800000);
      expect(res.interesesCesantiasAcumuladosYTD).toBe(Math.round(4800000 * 0.12));
    });

    it('Debe retornar 0 COP de provisión de cesantías para empleados con Salario Integral', () => {
      const gerenteIntegral: Empleado = {
        ...empleadoBase,
        id: 'e-integral',
        nombre: 'Gerente Integral',
        salarioBase: 25000000,
        compensacion: {
          tipoSalario: 'Integral',
          salarioBasico: 25000000,
          periodicidadPago: 'Mensual',
          auxilioTransporte: false,
          formaPago: 'Transferencia bancaria',
          banco: 'Bancolombia',
          tipoCuenta: 'Ahorros',
          numeroCuenta: '1234',
          historialVigencias: []
        },
        contrato: {
          tipo: 'Término indefinido',
          salario: '$ 25.000.000 Integral',
          inicio: '2020-01-01',
          fin: '—'
        }
      };

      const liq = calcularLiquidacionEmpleado(
        gerenteIntegral,
        'Gerente General',
        'DIR-001',
        novedadesVacias,
        PARAMETROS_COLOMBIA_2026
      );

      const res = calcularCesantiasEInteresesEmpleado(
        gerenteIntegral,
        liq,
        12,
        2026,
        PARAMETROS_COLOMBIA_2026
      );

      expect(res.esSalarioIntegral).toBe(true);
      expect(res.provisionMensualCesantias).toBe(0);
      expect(res.provisionMensualIntereses).toBe(0);
      expect(res.cesantiasAcumuladasYTD).toBe(0);
      expect(res.interesesCesantiasAcumuladosYTD).toBe(0);
    });
  });
});

describe('Suite de Pruebas: Días Festivos y Calendario Laboral Colombiano (festivosColombia)', () => {
  it('Debe reconocer los festivos oficiales en Colombia para 2026', () => {
    expect(obtenerNombreFestivoColombia('2026-01-01')).toBe('Año Nuevo');
    expect(obtenerNombreFestivoColombia('2026-05-01')).toBe('Día del Trabajo');
    expect(obtenerNombreFestivoColombia('2026-07-20')).toBe('Día de la Independencia');
    expect(obtenerNombreFestivoColombia('2026-08-07')).toBe('Batalla de Boyacá');
    expect(obtenerNombreFestivoColombia('2026-12-25')).toBe('Navidad');
  });

  it('Debe contener el listado completo de festivos de ley colombiana', () => {
    expect(FESTIVOS_COLOMBIA_2026_2027.length).toBeGreaterThanOrEqual(18);
  });

  it('Debe calcular la fecha final de permiso remunerado excluyendo fines de semana y festivos', () => {
    const permiso = calcularFechaFinalPermisoRemunerado('2026-01-08', 5);
    expect(permiso.fechaFinStr).toBe('2026-01-15');
    expect(permiso.fechaReintegroStr).toBe('2026-01-16');
    expect(permiso.diasFestivosInvolucrados.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Suite de Pruebas: Exámenes Médicos Ocupacionales (SG-SST)', () => {
  const empleadoConExamenes: Empleado = {
    id: 'emp-sst-1',
    nombre: 'Juan Pérez SST',
    documento: '1.234.567.890',
    email: 'juan.perez@empresa.com',
    telefono: '3001234567',
    cargoId: 'c1',
    areaId: 'a1',
    formacion: 'Profesional en Ingeniería',
    experiencia: '5 años en el sector',
    activo: true,
    estadoLaboral: 'Activo',
    familia: [],
    contrato: {
      tipo: 'Término Indefinido',
      salario: '$3.500.000',
      inicio: '2025-01-10',
      fin: 'Indefinido'
    },
    sst: {
      examenesOcupacionales: [
        {
          id: 'ex-1',
          fecha: '2025-01-10',
          tipoExamen: 'Ingreso',
          entidadIps: 'IPS Médica Laboral',
          conceptoAptitud: 'Apto',
          estado: 'Realizado',
          fechaProximoExamen: '2026-01-10',
          recomendaciones: 'Uso de protección auditiva',
          confidencialMedico: true,
          empleadoId: 'emp-sst-1',
          empleadoNombre: 'Juan Pérez SST'
        },
        {
          id: 'ex-2',
          fecha: '2026-01-15',
          tipoExamen: 'Periódico',
          entidadIps: 'IPS Sanitas Ocupacional',
          conceptoAptitud: 'Apto con Recomendaciones',
          estado: 'Realizado',
          fechaProximoExamen: '2027-01-15',
          recomendaciones: 'Pausas activas y corrección postural',
          confidencialMedico: true,
          empleadoId: 'emp-sst-1',
          empleadoNombre: 'Juan Pérez SST'
        }
      ]
    }
  };

  it('Debe estructurar y consultar el historial ocupacional de un colaborador', () => {
    const examenes = empleadoConExamenes.sst?.examenesOcupacionales || [];
    expect(examenes.length).toBe(2);
    expect(examenes[0].tipoExamen).toBe('Ingreso');
    expect(examenes[0].conceptoAptitud).toBe('Apto');
    expect(examenes[1].tipoExamen).toBe('Periódico');
    expect(examenes[1].conceptoAptitud).toBe('Apto con Recomendaciones');
  });

  it('Debe validar cálculo de vigencia y fechas de próximo examen', () => {
    const exVigente = empleadoConExamenes.sst?.examenesOcupacionales![1]!;
    expect(new Date(exVigente.fechaProximoExamen!).getTime()).toBeGreaterThan(new Date(exVigente.fecha).getTime());
  });

  it('Debe clasificar correctamente alertas proactivas: vencido (< 0 días) vs próximo a vencer (<= 30 días)', () => {
    const evaluarAlerta = (fechaProximo: string, fechaBaseRef: Date = new Date('2026-09-30')) => {
      const prox = new Date(fechaProximo);
      prox.setHours(0, 0, 0, 0);
      const hoy = new Date(fechaBaseRef);
      hoy.setHours(0, 0, 0, 0);
      const diffMs = prox.getTime() - hoy.getTime();
      const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (dias < 0) return { estado: 'Vencido', dias, tieneAlerta: true };
      if (dias <= 30) return { estado: 'ProximoVencer', dias, tieneAlerta: true };
      return { estado: 'Vigente', dias, tieneAlerta: false };
    };

    // Caso 1: Vencido
    const alertaVencido = evaluarAlerta('2026-09-15');
    expect(alertaVencido.estado).toBe('Vencido');
    expect(alertaVencido.tieneAlerta).toBe(true);
    expect(alertaVencido.dias).toBeLessThan(0);

    // Caso 2: Próximo a vencer en 15 días (dentro del umbral de 30 días)
    const alertaProximo = evaluarAlerta('2026-10-15');
    expect(alertaProximo.estado).toBe('ProximoVencer');
    expect(alertaProximo.tieneAlerta).toBe(true);
    expect(alertaProximo.dias).toBeGreaterThanOrEqual(0);
    expect(alertaProximo.dias).toBeLessThanOrEqual(30);

    // Caso 3: Vigente a largo plazo (> 30 días)
    const alertaVigente = evaluarAlerta('2027-04-30');
    expect(alertaVigente.estado).toBe('Vigente');
    expect(alertaVigente.tieneAlerta).toBe(false);
  });
});

describe('Suite de Pruebas: Matriz de Peligros y Riesgos GTC 45', () => {
  it('Debe calcular correctamente el Nivel de Riesgo I (Crítico / No Aceptable)', () => {
    // ND: 10 (Muy Alto), NE: 4 (Continua), NC: 100 (Mortal)
    const res = calcularGtc45(10, 4, 100);
    expect(res.np).toBe(40);
    expect(res.interpProb).toBe('Muy Alta');
    expect(res.nr).toBe(4000);
    expect(res.interpRiesgo).toBe('I');
    expect(res.aceptabilidad).toBe('No Aceptable');
  });

  it('Debe calcular correctamente el Nivel de Riesgo II (Alto / Control Específico)', () => {
    // ND: 6 (Alto), NE: 2 (Ocasional) => NP = 12, NC: 25 (Grave) => NR = 300
    const res = calcularGtc45(6, 2, 25);
    expect(res.np).toBe(12);
    expect(res.interpProb).toBe('Alta');
    expect(res.nr).toBe(300);
    expect(res.interpRiesgo).toBe('II');
    expect(res.aceptabilidad).toBe('No Aceptable o Aceptable con Control Específico');
  });

  it('Debe calcular correctamente el Nivel de Riesgo III (Medio / Mejorable)', () => {
    // ND: 2 (Medio), NE: 2 (Ocasional) => NP = 4, NC: 25 => NR = 100
    const res = calcularGtc45(2, 2, 25);
    expect(res.np).toBe(4);
    expect(res.interpProb).toBe('Baja');
    expect(res.nr).toBe(100);
    expect(res.interpRiesgo).toBe('III');
    expect(res.aceptabilidad).toBe('Mejorable');
  });

  it('Debe calcular correctamente el Nivel de Riesgo IV (Bajo / Aceptable)', () => {
    // ND: 2 (Medio), NE: 1 (Esporádica) => NP = 2, NC: 10 (Leve) => NR = 20
    const res = calcularGtc45(2, 1, 10);
    expect(res.np).toBe(2);
    expect(res.interpProb).toBe('Baja');
    expect(res.nr).toBe(20);
    expect(res.interpRiesgo).toBe('IV');
    expect(res.aceptabilidad).toBe('Aceptable');
  });
});

describe('Suite de Pruebas: Disponibilidad de Empleados por Fecha de Ingreso en Nómina Mensual', () => {
  const empleadoAntiguo: Empleado = {
    id: 'emp-antiguo',
    nombre: 'Carlos Antiguo',
    documento: '1010101',
    email: 'carlos@empresa.com',
    telefono: '3001112233',
    cargoId: 'c1',
    formacion: 'Ingeniero',
    experiencia: '5 años',
    salarioBase: 3000000,
    contrato: { tipo: 'Término indefinido', inicio: '2024-01-15', fin: '—', salario: '$3.000.000' },
    familia: [],
    activo: true
  };

  const empleadoIngresoMarzo: Empleado = {
    id: 'emp-marzo',
    nombre: 'Mariana Ingreso Marzo',
    documento: '2020202',
    email: 'mariana@empresa.com',
    telefono: '3002223344',
    cargoId: 'c2',
    formacion: 'Contadora',
    experiencia: '3 años',
    salarioBase: 2500000,
    contrato: { tipo: 'Término indefinido', inicio: '2026-03-10', fin: '—', salario: '$2.500.000' },
    familia: [],
    activo: true
  };

  const empleadoIngresoJunio: Empleado = {
    id: 'emp-junio',
    nombre: 'Felipe Ingreso Junio',
    documento: '3030303',
    email: 'felipe@empresa.com',
    telefono: '3003334455',
    cargoId: 'c3',
    formacion: 'Técnico',
    experiencia: '2 años',
    salarioBase: 1800000,
    contrato: { tipo: 'Término fijo', inicio: '2026-06-01', fin: '2027-06-01', salario: '$1.800.000' },
    familia: [],
    activo: true
  };

  const empleadoRetiradoFebrero: Empleado = {
    id: 'emp-retirado',
    nombre: 'Pedro Retirado',
    documento: '4040404',
    email: 'pedro@empresa.com',
    telefono: '3004445566',
    cargoId: 'c4',
    formacion: 'Operario',
    experiencia: '1 año',
    salarioBase: 1750905,
    contrato: { tipo: 'Término indefinido', inicio: '2024-05-01', fin: '2026-02-15', salario: '$1.750.905' },
    fechaRetiro: '2026-02-15',
    familia: [],
    activo: false
  };

  const empleadosLista = [empleadoAntiguo, empleadoIngresoMarzo, empleadoIngresoJunio, empleadoRetiradoFebrero];

  it('Debe extraer correctamente la fecha de ingreso desde el contrato o expediente laboral', () => {
    expect(obtenerFechaIngresoEmpleado(empleadoAntiguo)).toBe('2024-01-15');
    expect(obtenerFechaIngresoEmpleado(empleadoIngresoMarzo)).toBe('2026-03-10');
    expect(obtenerFechaIngresoEmpleado(empleadoIngresoJunio)).toBe('2026-06-01');
  });

  it('En Enero 2026 (2026-01): NO deben estar disponibles los empleados que ingresan en Marzo o Junio', () => {
    const periodoEnero = crearPeriodoNomina(2026, 1, 'Mensual');

    expect(estaEmpleadoDisponibleEnPeriodo(empleadoAntiguo, periodoEnero)).toBe(true);
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoRetiradoFebrero, periodoEnero)).toBe(true);
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoIngresoMarzo, periodoEnero)).toBe(false);
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoIngresoJunio, periodoEnero)).toBe(false);

    const disponiblesEnero = filtrarEmpleadosDisponiblesEnPeriodo(empleadosLista, periodoEnero);
    expect(disponiblesEnero.map(e => e.id)).toEqual(['emp-antiguo', 'emp-retirado']);
  });

  it('En Marzo 2026 (2026-03): Debe aparecer disponible el empleado con fecha de ingreso en Marzo 2026', () => {
    const periodoMarzo = crearPeriodoNomina(2026, 3, 'Mensual');

    expect(estaEmpleadoDisponibleEnPeriodo(empleadoAntiguo, periodoMarzo)).toBe(true);
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoIngresoMarzo, periodoMarzo)).toBe(true);
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoIngresoJunio, periodoMarzo)).toBe(false);
    // El retirado en febrero NO debe aparecer en marzo
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoRetiradoFebrero, periodoMarzo)).toBe(false);

    const disponiblesMarzo = filtrarEmpleadosDisponiblesEnPeriodo(empleadosLista, periodoMarzo);
    expect(disponiblesMarzo.map(e => e.id)).toEqual(['emp-antiguo', 'emp-marzo']);
  });

  it('En Junio 2026 (2026-06): Deben aparecer disponibles los empleados de Marzo y Junio', () => {
    const periodoJunio = crearPeriodoNomina(2026, 6, 'Mensual');

    expect(estaEmpleadoDisponibleEnPeriodo(empleadoAntiguo, periodoJunio)).toBe(true);
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoIngresoMarzo, periodoJunio)).toBe(true);
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoIngresoJunio, periodoJunio)).toBe(true);
    expect(estaEmpleadoDisponibleEnPeriodo(empleadoRetiradoFebrero, periodoJunio)).toBe(false);

    const disponiblesJunio = filtrarEmpleadosDisponiblesEnPeriodo(empleadosLista, periodoJunio);
    expect(disponiblesJunio.map(e => e.id)).toEqual(['emp-antiguo', 'emp-marzo', 'emp-junio']);
  });

  it('Debe calcular días laborados proporcionales en el mes de ingreso (mes comercial 30 días CST)', () => {
    const periodoMarzo = crearPeriodoNomina(2026, 3, 'Mensual');
    const periodoAbril = crearPeriodoNomina(2026, 4, 'Mensual');

    // Mariana ingresó el 10 de Marzo: 30 - 10 + 1 = 21 días en marzo
    const diasMarzo = calcularDiasDefectoPeriodoEmpleado(empleadoIngresoMarzo, periodoMarzo);
    expect(diasMarzo).toBe(21);

    // En abril (mes siguiente a su ingreso): 30 días completos
    const diasAbril = calcularDiasDefectoPeriodoEmpleado(empleadoIngresoMarzo, periodoAbril);
    expect(diasAbril).toBe(30);

    // Empleado antiguo en marzo: 30 días completos
    const diasAntiguo = calcularDiasDefectoPeriodoEmpleado(empleadoAntiguo, periodoMarzo);
    expect(diasAntiguo).toBe(30);
  });
});

describe('Suite de Pruebas: Motor de Provisión y Pasivo de Vacaciones (Art. 186-192 CST - 4.17%)', () => {
  const empleadoOrdinario: Empleado = {
    id: 'emp-vac-1',
    nombre: 'Laura Vacaciones',
    documento: '5555555',
    email: 'laura@empresa.com',
    telefono: '3110001122',
    cargoId: 'c1',
    formacion: 'Profesional',
    experiencia: '3 años',
    salarioBase: 2500000,
    contrato: { tipo: 'Término indefinido', inicio: '2025-01-01', fin: '—', salario: '$2.500.000' },
    familia: [],
    activo: true
  };

  const empleadoIntegral: Empleado = {
    id: 'emp-vac-2',
    nombre: 'Director Integral',
    documento: '7777777',
    email: 'director@empresa.com',
    telefono: '3159998877',
    cargoId: 'c2',
    formacion: 'Especialista',
    experiencia: '10 años',
    salarioBase: 25000000,
    contrato: { tipo: 'Término indefinido', inicio: '2024-01-01', fin: '—', salario: '$25.000.000' },
    compensacion: {
      salarioBasico: 25000000,
      tipoSalario: 'Integral',
      periodicidadPago: 'Mensual',
      auxilioTransporte: false,
      formaPago: 'Transferencia bancaria',
      banco: 'Bancolombia',
      tipoCuenta: 'Ahorros',
      numeroCuenta: '12345678',
      historialVigencias: []
    },
    familia: [],
    activo: true
  };

  const empleadoContratista: Empleado = {
    id: 'emp-vac-3',
    nombre: 'Asesor Honorarios',
    documento: '8888888',
    email: 'asesor@empresa.com',
    telefono: '3201112233',
    cargoId: 'c3',
    formacion: 'Abogado',
    experiencia: '7 años',
    salarioBase: 4000000,
    contrato: { tipo: 'Prestación de servicios', inicio: '2026-01-01', fin: '2026-12-31', salario: '$4.000.000' },
    familia: [],
    activo: true
  };

  const novedadBase: NovedadNominaEmpleado = {
    diasTrabajados: 30,
    horasExtrasDiurnas: 0,
    horasExtrasNocturnas: 0,
    horasFestivasDiurnas: 0,
    horasFestivasNocturnas: 0,
    recargoNocturnoOrdinario: 0,
    bonificacionesSalariales: 0,
    bonificacionesNoSalariales: 0,
    comisiones: 0,
    incapacidadDias: 0,
    licenciaRemuneradaDias: 0,
    prestamosYDeducciones: 0
  };

  it('Debe calcular la provisión mensual de vacaciones (4.17% = 15/360) sobre el salario básico sin Auxilio de Transporte', () => {
    const liqOrdinario = calcularLiquidacionEmpleado(
      empleadoOrdinario,
      'Analista',
      'ADM-01',
      novedadBase,
      PARAMETROS_COLOMBIA_2026
    );

    // Salario básico: $2.500.000 <= 2 SMMLV -> tiene derecho a Aux. Transporte ($249.095)
    expect(liqOrdinario.tieneDerechoAuxilioTransporte).toBe(true);

    const resVac = calcularVacacionesEmpleado(
      empleadoOrdinario,
      liqOrdinario,
      3, // Marzo (mes 3)
      2026,
      PARAMETROS_COLOMBIA_2026
    );

    // La base de vacaciones NO debe incluir el auxilio de transporte (Art. 192 CST)
    expect(resVac.baseSalarioVacaciones).toBe(2500000);
    // Provisión mensual: 2.500.000 * 0.0417 = $104.250
    expect(resVac.provisionMensualVacaciones).toBe(104250);
    // Días causados en el mes: 1.25 días
    expect(resVac.diasCausadosMes).toBe(1.25);
    // Días acumulados en 3 meses (90 días): (90 * 15) / 360 = 3.75 días
    expect(resVac.diasCausadosAno).toBe(3.75);
    // Pasivo acumulado a marzo: (2.500.000 * 3.75) / 30 = $312.500
    expect(resVac.vacacionesAcumuladasYTD).toBe(312500);
  });

  it('En Salario Integral: Las vacaciones SÍ se causan (15 días de descanso remunerado CST)', () => {
    const liqIntegral = calcularLiquidacionEmpleado(
      empleadoIntegral,
      'Director',
      'DIR-01',
      novedadBase,
      PARAMETROS_COLOMBIA_2026
    );

    const resVac = calcularVacacionesEmpleado(
      empleadoIntegral,
      liqIntegral,
      6, // Junio (mes 6)
      2026,
      PARAMETROS_COLOMBIA_2026
    );

    expect(resVac.esSalarioIntegral).toBe(true);
    expect(resVac.baseSalarioVacaciones).toBe(25000000);
    // Provisión mensual: 25.000.000 * 0.0417 = $1.042.500
    expect(resVac.provisionMensualVacaciones).toBe(1042500);
    // Días causados en 6 meses (180 días): (180 * 15) / 360 = 7.5 días
    expect(resVac.diasCausadosAno).toBe(7.5);
    // Pasivo acumulado: (25.000.000 * 7.5) / 30 = $6.250.000
    expect(resVac.vacacionesAcumuladasYTD).toBe(6250000);
  });

  it('En Contrato de Prestación de Servicios: Provisión y pasivo de vacaciones son 0 COP', () => {
    const liqContratista = calcularLiquidacionEmpleado(
      empleadoContratista,
      'Asesor',
      'LEG-01',
      novedadBase,
      PARAMETROS_COLOMBIA_2026
    );

    const resVac = calcularVacacionesEmpleado(
      empleadoContratista,
      liqContratista,
      3,
      2026,
      PARAMETROS_COLOMBIA_2026
    );

    expect(resVac.baseSalarioVacaciones).toBe(0);
    expect(resVac.provisionMensualVacaciones).toBe(0);
    expect(resVac.diasCausadosMes).toBe(0);
    expect(resVac.diasCausadosAno).toBe(0);
    expect(resVac.vacacionesAcumuladasYTD).toBe(0);
  });
});

describe('Suite de Pruebas: Provisión Mensual de Vacaciones (4.17%) y Pasivos Laborales en Saldos Iniciales', () => {
  it('Debe calcular la provisión mensual de vacaciones como el 4.17% del salario básico ordinario', () => {
    // Salario básico: $3.000.000 -> 4.17% = $125.100
    const provVac = calcularProvisionMensualVacaciones(3000000);
    expect(provVac).toBe(125100);
  });

  it('Debe calcular la provisión mensual de vacaciones para salario mínimo 2026 ($1.750.905)', () => {
    // 1.750.905 * 0.0417 = 73012.7385 -> redondeado 73013
    const provVac = calcularProvisionMensualVacaciones(1750905);
    expect(provVac).toBe(73013);
  });

  it('Debe calcular la provisión mensual de vacaciones para Salario Integral (Art. 132 CST)', () => {
    // Salario integral: $22.761.765 -> 4.17% = $949.166
    const provVac = calcularProvisionMensualVacaciones(22761765, 0, 0.0417, 'Término indefinido', 'Integral');
    expect(provVac).toBe(949166);
  });

  it('Debe retornar 0 COP para contratos de prestación de servicios o contratistas independientes', () => {
    const provVac = calcularProvisionMensualVacaciones(5000000, 0, 0.0417, 'Prestación de servicios', 'Honorarios');
    expect(provVac).toBe(0);
  });

  it('Debe calcular el desglose integral de pasivos laborales (Cesantías 8.33%, Intereses 1%, Prima 8.33%, Vacaciones 4.17% = 21.83%)', () => {
    const itemSaldo = {
      salarioBasico: 3000000,
      tipoContrato: 'Término indefinido',
      tipoSalario: 'Ordinario',
      vacacionesDiasPendientes: 15,
      vacacionesValorAcumuladoCOP: 1500000,
      cesantiasSaldoAcumuladoCOP: 1500000,
      interesesCesantiasAcumuladoCOP: 180000,
      primaServiciosBaseSemestreCOP: 3000000,
      diasTrabajadosSemestrePrima: 60,
      primaServiciosValorAcumuladoCOP: 500000
    };

    const desglose = calcularPasivosLaboralesCompletos(itemSaldo);

    // Vacaciones: 4.17% de 3.000.000 = $125.100
    expect(desglose.provisionMensualVacaciones).toBe(125100);
    expect(desglose.pasivoVacacionesAcumulado).toBe(1500000);

    // Cesantías: 8.33% de 3.000.000 = $249.900
    expect(desglose.provisionMensualCesantias).toBe(249900);
    expect(desglose.pasivoCesantiasAcumulado).toBe(1500000);

    // Intereses a cesantías: 12% anual sobre cesantías mensuales = $29.988
    expect(desglose.provisionMensualIntereses).toBe(29988);
    expect(desglose.pasivoInteresesAcumulado).toBe(180000);

    // Prima de servicios: 8.33% de 3.000.000 = $249.900
    expect(desglose.provisionMensualPrima).toBe(249900);
    expect(desglose.pasivoPrimaAcumulado).toBe(500000);

    // Total Pasivos Acumulados: 1.500.000 + 1.500.000 + 180.000 + 500.000 = $3.680.000
    expect(desglose.totalPasivosAcumuladosCOP).toBe(3680000);

    // Carga Mensual Prestacional (21.83%): 125.100 + 249.900 + 29.988 + 249.900 = $654.888
    expect(desglose.totalProvisionMensualCOP).toBe(654888);
  });
});


