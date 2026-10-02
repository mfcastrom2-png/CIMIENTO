import { describe, it, expect } from 'vitest';
import {
  validarCedulaDocumentoDian,
  validarCorreoElectronicoDian,
  validarSalarioDianCst,
  validarFormularioEmpleadoDian
} from '../src/utils/validadorDianEmpleado';
import { Empleado } from '../src/types';

describe('Suite de Pruebas: Utilidad de Validación DIAN y CST para Formularios de Empleados', () => {
  const empleadosExistentes = [
    { id: 'emp-1', nombre: 'Carlos Restrepo', documento: '1020892411', email: 'carlos@empresa.com' },
    { id: 'emp-2', nombre: 'María Gómez', documento: '52987456', email: 'maria@empresa.com' }
  ] as unknown as Empleado[];

  describe('1. Validación de Cédula y Documento de Identificación (DIAN)', () => {
    it('Debe aceptar Cédulas de Ciudadanía válidas entre 6 y 10 dígitos numéricos', () => {
      const res = validarCedulaDocumentoDian('1020892415', 'CC', empleadosExistentes);
      expect(res.esValido).toBe(true);
      expect(res.nivel).toBe('success');
      expect(res.detalles?.formatoLimpio).toBe('1020892415');
    });

    it('Debe rechazar Cédulas con letras o símbolos especiales', () => {
      const res = validarCedulaDocumentoDian('102089A415', 'CC', empleadosExistentes);
      expect(res.esValido).toBe(false);
      expect(res.nivel).toBe('error');
      expect(res.mensaje).toContain('sólo debe contener dígitos numéricos');
    });

    it('Debe rechazar Cédulas con longitud fuera de rango (<6 o >10 dígitos)', () => {
      const resCorta = validarCedulaDocumentoDian('12345', 'CC', empleadosExistentes);
      expect(resCorta.esValido).toBe(false);

      const resLarga = validarCedulaDocumentoDian('12345678901', 'CC', empleadosExistentes);
      expect(resLarga.esValido).toBe(false);
    });

    it('Debe rechazar documentos duplicados en el censo activo de colaboradores', () => {
      const res = validarCedulaDocumentoDian('1020892411', 'CC', empleadosExistentes);
      expect(res.esValido).toBe(false);
      expect(res.mensaje).toContain('ya está registrado');
    });

    it('Debe permitir el mismo documento si se está editando el mismo colaborador', () => {
      const res = validarCedulaDocumentoDian('1020892411', 'CC', empleadosExistentes, 'emp-1');
      expect(res.esValido).toBe(true);
    });
  });

  describe('2. Validación de Correo Electrónico (RFC 5322 & DIAN Nómina Electrónica)', () => {
    it('Debe aceptar correos corporativos y personales en formato RFC 5322 válido', () => {
      const res = validarCorreoElectronicoDian('colaborador.nuevo@empresa.com.co', 'correo corporativo', true, empleadosExistentes);
      expect(res.esValido).toBe(true);
    });

    it('Debe rechazar correos con formatos inválidos o dominios incompletos', () => {
      const resSinArroba = validarCorreoElectronicoDian('usuarioempresa.com', 'correo corporativo', true, empleadosExistentes);
      expect(resSinArroba.esValido).toBe(false);

      const resSinTld = validarCorreoElectronicoDian('usuario@empresa', 'correo corporativo', true, empleadosExistentes);
      expect(resSinTld.esValido).toBe(false);
    });

    it('Debe rechazar correos duplicados en el censo activo', () => {
      const res = validarCorreoElectronicoDian('carlos@empresa.com', 'correo corporativo', true, empleadosExistentes);
      expect(res.esValido).toBe(false);
      expect(res.mensaje).toContain('ya pertenece a');
    });
  });

  describe('3. Validación de Salario Básico (CST & SMMLV 2026)', () => {
    const smmlv = 1750905;

    it('Debe rechazar salarios por debajo del SMMLV vigente para contratos ordinarios', () => {
      const res = validarSalarioDianCst(1200000, 'Indefinido', smmlv);
      expect(res.esValido).toBe(false);
      expect(res.mensaje).toContain('está por debajo del SMMLV');
    });

    it('Debe aceptar salarios iguales o superiores al SMMLV vigente', () => {
      const res = validarSalarioDianCst(2500000, 'Indefinido', smmlv);
      expect(res.esValido).toBe(true);
      expect(res.detalles?.tieneAuxilioTransporte).toBe(true); // <= 2 SMMLV
    });

    it('Debe permitir apoyo de sostenimiento del 50% SMMLV para contrato de aprendizaje Sena', () => {
      const res = validarSalarioDianCst(900000, 'Contrato de aprendizaje Sena', smmlv);
      expect(res.esValido).toBe(true);
    });

    it('Debe identificar correctamente el Salario Integral (>= 13 SMMLV)', () => {
      const res = validarSalarioDianCst(25000000, 'Indefinido', smmlv);
      expect(res.esValido).toBe(true);
      expect(res.detalles?.esSalarioIntegral).toBe(true);
    });
  });

  describe('4. Validador Consolidado de Formulario', () => {
    it('Debe retornar esFormularioValido=true si todos los datos cumplen los estándares', () => {
      const res = validarFormularioEmpleadoDian(
        {
          documento: '1098765432',
          tipoDocumento: 'CC',
          correoCorporativo: 'nuevo.colaborador@empresa.co',
          correoPersonal: 'personal@gmail.com',
          salarioBasico: 2800000,
          tipoContrato: 'Término indefinido'
        },
        empleadosExistentes,
        1750905
      );

      expect(res.esFormularioValido).toBe(true);
      expect(res.resumenErrores.length).toBe(0);
    });

    it('Debe consolidar la lista de errores si algún campo incumple las normas', () => {
      const res = validarFormularioEmpleadoDian(
        {
          documento: '123', // Demasiado corto
          tipoDocumento: 'CC',
          correoCorporativo: 'correo-invalido',
          correoPersonal: 'personal@gmail.com',
          salarioBasico: 500000, // Debajo de SMMLV
          tipoContrato: 'Término indefinido'
        },
        empleadosExistentes,
        1750905
      );

      expect(res.esFormularioValido).toBe(false);
      expect(res.resumenErrores.length).toBe(3);
    });
  });
});
