import { describe, it, expect } from 'vitest';
import {
  formatMonedaCOP,
  parseSalarioNumerico,
  formatPorcentaje,
  getErrorMessage
} from '../src/utils/formatters';
import {
  numeroALetrasPesos,
  generarDatosCertificadoLaboral
} from '../src/utils/generadorCertificados';
import {
  calcularFechaFinalPermisoRemunerado,
  esFinDeSemanaOFestivo
} from '../src/utils/festivosColombia';
import { Empleado, Cargo } from '../src/types';

describe('Suite de Pruebas: Utilidades Centralizadas (formatters.ts)', () => {
  it('Debe formatear valores a Pesos Colombianos (COP)', () => {
    expect(formatMonedaCOP(1750905)).toContain('1.750.905');
    expect(formatMonedaCOP(0)).toContain('0');
    expect(formatMonedaCOP(null)).toBe('$ 0');
    expect(formatMonedaCOP(undefined)).toBe('$ 0');
  });

  it('Debe parsear salarios con caracteres especiales a número entero', () => {
    expect(parseSalarioNumerico('$ 2.500.000')).toBe(2500000);
    expect(parseSalarioNumerico('4800000')).toBe(4800000);
    expect(parseSalarioNumerico(3200000)).toBe(3200000);
    // Fallback a valor predeterminado si es nulo o vacío
    expect(parseSalarioNumerico('')).toBe(1750905);
    expect(parseSalarioNumerico(null, 2000000)).toBe(2000000);
  });

  it('Debe formatear porcentajes con decimales', () => {
    expect(formatPorcentaje(0.12)).toBe('12.0%');
    expect(formatPorcentaje(8.33, 2)).toBe('8.33%');
    expect(formatPorcentaje(0)).toBe('0.0%');
  });

  it('Debe extraer mensajes de error seguros desde cualquier tipo (unknown)', () => {
    expect(getErrorMessage(new Error('Fallo de red'))).toBe('Fallo de red');
    expect(getErrorMessage('Error directo')).toBe('Error directo');
    expect(getErrorMessage({ message: 'Token expirado' })).toBe('Token expirado');
    expect(getErrorMessage(null)).toBe('Ocurrió un error inesperado en la operación.');
  });
});

describe('Suite de Pruebas: Generación de Certificados Laborales (CST Art. 57 #7)', () => {
  it('Debe convertir números a texto formal en letras para moneda legal colombiana', () => {
    expect(numeroALetrasPesos(0)).toBe('CERO PESOS M/CTE');
    expect(numeroALetrasPesos(1000000)).toBe('UN MILLÓN PESOS M/CTE');
    expect(numeroALetrasPesos(2500000)).toBe('DOS MILLONES QUINIENTOS MIL PESOS M/CTE');
    expect(numeroALetrasPesos(1750905)).toBe('UN MILLÓN SETECIENTOS CINCUENTA MIL NOVECIENTOS CINCO PESOS M/CTE');
  });

  it('Debe autogenerar los datos del certificado con código de verificación único', () => {
    const empleadoPrueba: Empleado = {
      id: 'emp-test-01',
      nombre: 'Catalina Suárez',
      documento: '1.020.304.506',
      email: 'catalina.suarez@empresa.com',
      telefono: '3109876543',
      cargoId: 'cargo-01',
      formacion: 'Ingeniera Civil',
      experiencia: '5 años',
      salarioBase: 3800000,
      activo: true,
      contrato: {
        tipo: 'Término Indefinido',
        inicio: '2023-02-01',
        fin: '—',
        salario: '$ 3.800.000'
      },
      familia: []
    };

    const cargos: Cargo[] = [
      {
        id: 'cargo-01',
        nombre: 'Ingeniera de Proyectos Especiales',
        reportaA: null,
        ficha: {} as any
      }
    ];

    const certData = generarDatosCertificadoLaboral(empleadoPrueba, cargos, 'Trámite Bancario', 'Banco de Bogotá');

    expect(certData.empleado.nombre).toBe('Catalina Suárez');
    expect(certData.cargoNombre).toBe('Ingeniera de Proyectos Especiales');
    expect(certData.salarioBasicoCOP).toBe(3800000);
    expect(certData.salarioBasicoTexto).toBe('TRES MILLONES OCHOCIENTOS MIL PESOS M/CTE');
    expect(certData.entidadDestino).toBe('Banco de Bogotá');
    expect(certData.codigoVerificacion).toContain('CERT-');
  });
});

describe('Suite de Pruebas: Cálculo de Festivos y Permisos Laborales (Ley Emiliani)', () => {
  it('Debe detectar festivos oficiales y fines de semana', () => {
    // 1 de Mayo 2026 (Día del Trabajo - Viernes)
    const diaTrabajo = new Date(2026, 4, 1);
    expect(esFinDeSemanaOFestivo(diaTrabajo)).toBe(true);

    // Domingo 3 de Mayo 2026
    const domingo = new Date(2026, 4, 3);
    expect(esFinDeSemanaOFestivo(domingo)).toBe(true);
  });

  it('Debe calcular la fecha de retorno de un permiso excluyendo fines de semana y festivos', () => {
    // Permiso de 3 días hábiles iniciando el jueves 30 de abril de 2026
    // Jueves 30 abr (Día 1 hábil)
    // Viernes 1 may (Festivo Día Trabajo - NO cuenta)
    // Sábado 2 may y Domingo 3 may (Fin de semana - NO cuenta)
    // Lunes 4 may (Día 2 hábil)
    // Martes 5 may (Día 3 hábil - Fin de permiso)
    // Miércoles 6 may (Reintegro)
    const calculo = calcularFechaFinalPermisoRemunerado('2026-04-30', 3);
    expect(calculo.fechaFinStr).toBe('2026-05-05');
    expect(calculo.fechaReintegroStr).toBe('2026-05-06');
    expect(calculo.diasFestivosInvolucrados.some(f => f.nombre === 'Día del Trabajo')).toBe(true);
  });
});
