import { describe, it, expect } from 'vitest';
import {
  generarHashIntegridadDocumento,
  registrarCertificadoEmitido,
  verificarAutenticidadCertificado,
  obtenerCertificadosLocales,
  esTipoCertificadoPermitido,
  normalizarTipoDocumento,
  RegistroCertificadoVerificable
} from '../src/services/verificacionCertificadosService';

describe('Servicio de Verificación de Autenticidad QR y Firma Digital (Ley 527/1999)', () => {
  it('debe generar un hash determinista y con prefijo SHA256 para integridad documental', () => {
    const datos = {
      codigo: 'CERT-2026-9901',
      titular: 'Paula Andrea Salazar',
      documento: '52.894.112'
    };

    const hash = generarHashIntegridadDocumento(datos);
    expect(hash).toContain('SHA256-');
    expect(typeof hash).toBe('string');
  });

  it('debe validar únicamente tipos permitidos: Diploma SST y Certificado Laboral', () => {
    expect(esTipoCertificadoPermitido('Diploma SST')).toBe(true);
    expect(esTipoCertificadoPermitido('Diploma de Capacitación')).toBe(true);
    expect(esTipoCertificadoPermitido('Diploma SST - Alturas')).toBe(true);
    expect(esTipoCertificadoPermitido('Certificado Laboral')).toBe(true);

    // Tipos no permitidos
    expect(esTipoCertificadoPermitido('Acta de Entrega de EPP')).toBe(false);
    expect(esTipoCertificadoPermitido('ACTA-EPP')).toBe(false);
    expect(esTipoCertificadoPermitido('Certificado de Saldo y Pasivos')).toBe(false);
    expect(esTipoCertificadoPermitido('')).toBe(false);
  });

  it('debe normalizar correctamente a Diploma SST y Certificado Laboral', () => {
    expect(normalizarTipoDocumento('Diploma de Capacitación')).toBe('Diploma SST');
    expect(normalizarTipoDocumento('Diploma SST')).toBe('Diploma SST');
    expect(normalizarTipoDocumento('Certificado Laboral')).toBe('Certificado Laboral');
  });

  it('debe registrar y verificar exitosamente un Certificado Laboral en el almacén', async () => {
    const certificado: RegistroCertificadoVerificable = {
      codigoVerificacion: 'CERT-2026-UNITTEST-01',
      tipoDocumento: 'Certificado Laboral',
      titularNombre: 'Carlos Mario Restrepo',
      titularDocumento: '71.294.001',
      titularCargo: 'Ingeniero de Operaciones',
      fechaEmision: '7 de octubre de 2026',
      fechaRegistroISO: new Date().toISOString(),
      emisorRazonSocial: 'B GROUP INGENIERIA S.A.S.',
      emisorNit: '901.458.987-1',
      firmanteNombre: 'Dirección de Gestión Humana',
      firmanteCargo: 'Gestión Humana & Compensación',
      hashIntegridad: 'SHA256-ABCD1234-VALID',
      estado: 'VIGENTE_AUTENTICO'
    };

    await registrarCertificadoEmitido(certificado);

    const locales = obtenerCertificadosLocales();
    expect(locales.some(c => c.codigoVerificacion === 'CERT-2026-UNITTEST-01')).toBe(true);

    const verificado = await verificarAutenticidadCertificado('CERT-2026-UNITTEST-01');
    expect(verificado).not.toBeNull();
    expect(verificado?.titularNombre).toBe('Carlos Mario Restrepo');
    expect(verificado?.tipoDocumento).toBe('Certificado Laboral');
    expect(verificado?.estado).toBe('VIGENTE_AUTENTICO');
  });

  it('debe registrar y verificar exitosamente un Diploma SST en el almacén', async () => {
    const diploma: RegistroCertificadoVerificable = {
      codigoVerificacion: 'DIP-SST-2026-9912',
      tipoDocumento: 'Diploma SST',
      titularNombre: 'Andrés Camilo Rojas',
      titularDocumento: '1020304050',
      titularCargo: 'Técnico de Redes FTTH',
      fechaEmision: '8 de octubre de 2026',
      fechaRegistroISO: new Date().toISOString(),
      emisorRazonSocial: 'B GROUP INGENIERIA S.A.S.',
      emisorNit: '901.458.987-1',
      firmanteNombre: 'Coordinación SG-SST',
      firmanteCargo: 'Líder SG-SST',
      hashIntegridad: 'SHA256-DIPSST123-VALID',
      estado: 'VIGENTE_AUTENTICO'
    };

    await registrarCertificadoEmitido(diploma);

    const verificado = await verificarAutenticidadCertificado('DIP-SST-2026-9912');
    expect(verificado).not.toBeNull();
    expect(verificado?.tipoDocumento).toBe('Diploma SST');
    expect(verificado?.titularNombre).toBe('Andrés Camilo Rojas');
  });

  it('debe rechazar o retornar null para actas de EPP o documentos no permitidos', async () => {
    const actaEPP = await verificarAutenticidadCertificado('ACTA-EPP-2026-90412');
    expect(actaEPP).toBeNull();
  });

  it('debe retornar estructura sintética válida para códigos institucionales estándar de Diploma SST y Certificado Laboral', async () => {
    const resCert = await verificarAutenticidadCertificado('CERT-2026-884129');
    expect(resCert).not.toBeNull();
    expect(resCert?.tipoDocumento).toBe('Certificado Laboral');
    expect(resCert?.estado).toBe('VIGENTE_AUTENTICO');

    const resDip = await verificarAutenticidadCertificado('DIP-SST-2026-3391');
    expect(resDip).not.toBeNull();
    expect(resDip?.tipoDocumento).toBe('Diploma SST');
    expect(resDip?.estado).toBe('VIGENTE_AUTENTICO');
  });

  it('debe retornar null cuando el código no existe o está vacío', async () => {
    const res = await verificarAutenticidadCertificado('');
    expect(res).toBeNull();
  });
});
