import { describe, it, expect } from 'vitest';
import {
  imprimirDocumento,
  imprimirDocumentoConSecciones,
  exportarAPdfConSecciones,
  aplicarExclusionSecciones
} from '../src/utils/printUtils';
import {
  exportarContenedorAPDF,
  generarEstilosImpresionInyectados,
  sanearTextoCssSinOklab,
  inyectarEstilosImpresionEnClon
} from '../src/utils/pdfExport';
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

  it('Debe generar estilos CSS de impresión inyectados con protección de fondos grises y reglas de src/index.css', () => {
    const css = generarEstilosImpresionInyectados();
    expect(css).toContain('.documento-imprimible');
    expect(css).toContain('bg-slate-50');
    expect(css).toContain('#F8FAFC');
    expect(css).toContain('#F1F5F9');
    expect(css).toContain('#FFFFFF');
    expect(css).toContain('print-color-adjust: exact');
    expect(css).toContain('display: none !important');
    expect(css).toContain('.margen-personalizado-cst');
    expect(css).toContain('.tipo-carta');
    expect(css).toContain('.tipo-contrato');
  });

  it('Debe sanear funciones oklab/oklch sin forzar fondos al azul institucional', () => {
    const cssConOklab = 'background-color: oklab(0.9 0 0); color: oklch(0.2 0.05 240);';
    const saneado = sanearTextoCssSinOklab(cssConOklab);
    expect(saneado).not.toContain('oklab(');
    expect(saneado).not.toContain('oklch(');
    expect(saneado).not.toContain('#18235C');
  });

  it('Debe inyectar correctamente el elemento style en el documento clonado', () => {
    const elementos: any[] = [];
    const fakeDoc = {
      getElementById: () => null,
      createElement: () => {
        const el: any = {
          id: '',
          setAttribute: (k: string, v: string) => { el[k] = v; },
          style: { setProperty: (k: string, v: string) => { el.style[k] = v; } },
          textContent: ''
        };
        return el;
      },
      querySelectorAll: () => [],
      head: {
        appendChild: (child: any) => { elementos.push(child); }
      }
    } as unknown as Document;

    const target: any = {
      style: {
        setProperty: () => {}
      }
    };

    inyectarEstilosImpresionEnClon(fakeDoc, target);
    expect(elementos.length).toBeGreaterThan(0);
    expect(elementos[0].id).toBe('pdf-export-dynamic-print-styles');
    expect(elementos[0].textContent).toContain('.documento-imprimible');
    expect(elementos[0].textContent).toContain('bg-slate-50');
  });

  it('Debe manejar aplicarExclusionSecciones y retornar función de restauración sin errores en entornos seguros', () => {
    const restoreFn = aplicarExclusionSecciones('contenedor-inexistente', ['sec-1']);
    expect(typeof restoreFn).toBe('function');
    expect(() => restoreFn()).not.toThrow();
  });

  it('Debe ejecutar imprimirDocumentoConSecciones y exportarAPdfConSecciones amigablemente', async () => {
    expect(() => imprimirDocumentoConSecciones('Doc_Test', 'elem-id', ['sec-1'])).not.toThrow();
    const res = await exportarAPdfConSecciones('elem-id', 'test.pdf', ['sec-1']);
    expect(res).toBe(false);
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
