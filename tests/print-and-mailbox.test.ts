import { describe, it, expect } from 'vitest';
import { imprimirDocumento } from '../src/utils/printUtils';
import { exportarContenedorAPDF } from '../src/utils/pdfExport';
import {
  CONFIG_BUZON_DEFAULT,
  probarConexionBuzon,
  obtenerConfiguracionBuzon
} from '../src/services/buzonCorreoService';
import {
  generarAsuntoBienvenida,
  generarCartaBienvenida,
  despacharNotificacionInstitucional
} from '../src/utils/notificacionesCorreo';
import { UsuarioSistema } from '../src/types';

describe('Suite de Pruebas: Impresión Oficial de Documentos (printUtils.ts & pdfExport.ts)', () => {
  it('Debe ejecutar imprimirDocumento actualizando el título temporalmente sin fallos', () => {
    expect(() => imprimirDocumento('Certificado_Laboral_Test')).not.toThrow();
  });

  it('Debe exponer la función exportarContenedorAPDF y manejar fallbacks de selectores sin arrojar excepciones', async () => {
    expect(typeof exportarContenedorAPDF).toBe('function');
    const res = await exportarContenedorAPDF('.selector-inexistente-test', 'test.pdf');
    expect(res).toBe(false); // Retorna false amigablemente cuando el selector no existe en el DOM de prueba
  });
});

describe('Suite de Pruebas: Buzón de Salida Corporativo (buzonCorreoService.ts)', () => {
  it('Debe contar con una configuración por defecto válida y dominio institucional', () => {
    expect(CONFIG_BUZON_DEFAULT.activo).toBe(true);
    expect(CONFIG_BUZON_DEFAULT.emailRemitente).toContain('@');
    expect(CONFIG_BUZON_DEFAULT.servidorSmtp).toBe('smtp.gmail.com');
    expect(CONFIG_BUZON_DEFAULT.puertoSmtp).toBe(587);
    expect(CONFIG_BUZON_DEFAULT.seguridadSmtp).toBe('STARTTLS');
  });

  it('Debe validar correo destinatario antes de ejecutar el test de conexión', async () => {
    const resInvalido = await probarConexionBuzon(CONFIG_BUZON_DEFAULT, 'correo-invalido');
    expect(resInvalido.success).toBe(false);
    expect(resInvalido.message).toContain('destinatario válido');

    const resValido = await probarConexionBuzon(CONFIG_BUZON_DEFAULT, 'admin@empresa.co');
    expect(resValido.success).toBe(true);
    expect(resValido.log).toContain('handshake');
    expect(resValido.log).toContain('250 2.0.0 OK');
  });
});

describe('Suite de Pruebas: Generación y Despacho de Cartas Institucionales (notificacionesCorreo.ts)', () => {
  const usuarioPrueba: UsuarioSistema = {
    id: 'u-99',
    nombre: 'Valeria Gómez',
    email: 'valeria.gomez@empresa.co',
    documento: '1.098.765.432',
    rol: 'empleado',
    estado: 'activo',
    ultimoAcceso: '2026-09-29',
    fechaCreacion: '2026-09-01',
    dobleFactorHabilitado: false,
    permisos: ['empleados'],
    cargoNombre: 'Analista de Talento'
  };

  it('Debe generar asunto con el nombre dinámico de la organización', () => {
    const asunto = generarAsuntoBienvenida(usuarioPrueba, 'CIMIENTO S.A.S.');
    expect(asunto).toContain('CIMIENTO S.A.S.');
    expect(asunto).toContain('Valeria Gómez');
  });

  it('Debe generar carta de bienvenida con datos institucionales y cláusula de Habeas Data', () => {
    const carta = generarCartaBienvenida(
      usuarioPrueba,
      'TEMP-1234',
      'https://sistema.empresa.co',
      undefined,
      CONFIG_BUZON_DEFAULT
    );

    expect(carta).toContain('Valeria Gómez');
    expect(carta).toContain('valeria.gomez@empresa.co');
    expect(carta).toContain('1.098.765.432');
    expect(carta).toContain('TEMP-1234');
    expect(carta).toContain('Ley 1581 de 2012');
    expect(carta).toContain(CONFIG_BUZON_DEFAULT.emailRemitente);
  });

  it('Debe despachar notificación institucional y registrar log de salida', async () => {
    const res = await despacharNotificacionInstitucional({
      destinatario: 'empleado@empresa.co',
      destinatarioNombre: 'Empleado Prueba',
      asunto: 'Notificación de Turno',
      cuerpo: 'Contenido del mensaje',
      tipo: 'bienvenida_cuenta'
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('enviada exitosamente');
  });
});
