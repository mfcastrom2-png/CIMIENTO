import { describe, it, expect } from 'vitest';
import {
  CLIENTES_SEMILLA_COMERCIAL,
  generarHashSHA256,
  importarSaldosMasivos,
  obtenerClientesComerciales,
  guardarClienteComercial,
  obtenerCajasTurnos,
  abrirTurnoCaja,
  registrarPagoRecaudo,
  obtenerPagosRecaudos,
  obtenerArqueosCaja,
  registrarArqueoCaja,
  modificarArqueoPorAdmin,
  obtenerContratosClientes,
  guardarContratoCliente
} from '../src/services/comercialService';
import {
  extractDriveFileId,
  formatDriveDirectUrl,
  getDriveImageCandidates,
  isGoogleDriveUrl
} from '../src/utils/driveUtils';
import { ClienteComercial, CajaTurno, PagoRecaudo, ArqueoCaja, ContratoCliente, UsuarioSistema } from '../src/types';
import { procesarFilasMatrizSaldos } from '../src/utils/excelTemplateUtils';

describe('Suite de Pruebas: Módulo Cimiento Comercial & Integraciones', () => {

  describe('1. Verificación de URLs de Google Drive para Logo Institucional', () => {
    it('debe extraer el File ID de diversos formatos de enlace de Google Drive', () => {
      const url1 = 'https://drive.google.com/file/d/1XyZ9AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing';
      const url2 = 'https://drive.google.com/open?id=1XyZ9AbCdEfGhIjKlMnOpQrStUvWxYz';
      const url3 = 'https://drive.google.com/uc?id=1XyZ9AbCdEfGhIjKlMnOpQrStUvWxYz';
      const url4 = 'https://lh3.googleusercontent.com/d/1XyZ9AbCdEfGhIjKlMnOpQrStUvWxYz';

      expect(extractDriveFileId(url1)).toBe('1XyZ9AbCdEfGhIjKlMnOpQrStUvWxYz');
      expect(extractDriveFileId(url2)).toBe('1XyZ9AbCdEfGhIjKlMnOpQrStUvWxYz');
      expect(extractDriveFileId(url3)).toBe('1XyZ9AbCdEfGhIjKlMnOpQrStUvWxYz');
      expect(extractDriveFileId(url4)).toBe('1XyZ9AbCdEfGhIjKlMnOpQrStUvWxYz');
    });

    it('debe generar la URL directa al CDN público lh3.googleusercontent.com sin requerir sesión activa', () => {
      const url = 'https://drive.google.com/file/d/1ABC123XYZ456/view';
      const direct = formatDriveDirectUrl(url);
      expect(direct).toBe('https://lh3.googleusercontent.com/d/1ABC123XYZ456');
    });

    it('debe entregar lista ordenada de candidatos para failover automático de imagen', () => {
      const url = 'https://drive.google.com/file/d/1ABC123XYZ456/view';
      const candidates = getDriveImageCandidates(url);
      expect(candidates.length).toBeGreaterThanOrEqual(3);
      expect(candidates[0]).toContain('lh3.googleusercontent.com/d/1ABC123XYZ456');
      expect(candidates[1]).toContain('drive.google.com/thumbnail');
    });
  });

  describe('2. Arqueo de Caja Inmutable para Asesores y Modificable solo por Administradores', () => {
    it('debe crear un arqueo con sello inmutable y hash criptográfico SHA-256', async () => {
      const fecha = new Date().toISOString();
      const codigo = 'ARQ-2026-TEST-001';
      const hash = await generarHashSHA256(`${codigo}|asesor-1|500000|500000|0|${fecha}`);

      const arqueo: ArqueoCaja = {
        id: 'arq-test-1',
        codigo,
        fecha,
        cajaTurnoId: 'caja-01',
        asesorId: 'asesor-1',
        asesorNombre: 'Juan Asesor Comercial',
        billetes100k: 5,
        billetes50k: 0,
        billetes20k: 0,
        billetes10k: 0,
        billetes5k: 0,
        billetes2k: 0,
        monedasTotal: 0,
        efectivoTotalFisico: 500000,
        digitalTotal: 0,
        totalFisico: 500000,
        totalSistema: 500000,
        diferencia: 0,
        estado: 'Cuadrado',
        inmutable: true,
        creadoPor: 'Juan Asesor Comercial',
        fechaCreacion: fecha,
        hashAuditoria: hash
      };

      await registrarArqueoCaja(arqueo);
      const lista = await obtenerArqueosCaja();
      const encontrado = lista.find(a => a.id === 'arq-test-1');
      expect(encontrado).toBeDefined();
      expect(encontrado?.inmutable).toBe(true);
      expect(encontrado?.hashAuditoria).toBe(hash);
    });

    it('debe permitir la rectificación y ajuste auditado EXCLUSIVAMENTE por un Administrador', async () => {
      const admin: UsuarioSistema = {
        id: 'admin-super-1',
        email: 'superadmin@bgroup.com.co',
        nombre: 'Super Administrador Principal',
        documento: '1098765432',
        rol: 'superadmin',
        permisos: ['*'],
        estado: 'activo',
        fechaCreacion: '2026-01-01',
        ultimoAcceso: '2026-01-01',
        dobleFactorHabilitado: false
      };

      await modificarArqueoPorAdmin('arq-test-1', admin, {
        totalFisico: 480000,
        totalSistema: 500000,
        diferencia: -20000,
        motivoAjuste: 'Corrección por faltante físico tras reconteo con auditoría',
        observaciones: 'Ajuste aprobado por gerencia administrativa'
      });

      const lista = await obtenerArqueosCaja();
      const ajustado = lista.find(a => a.id === 'arq-test-1');
      expect(ajustado).toBeDefined();
      expect(ajustado?.diferencia).toBe(-20000);
      expect(ajustado?.estado).toBe('Faltante');
      expect(ajustado?.modificadoPorAdmin).toBeDefined();
      expect(ajustado?.modificadoPorAdmin?.adminId).toBe(admin.id);
      expect(ajustado?.modificadoPorAdmin?.motivoAjuste).toContain('Corrección por faltante físico');
    });
  });

  describe('3. Subida Masiva de Saldos e Importación de Cartera', () => {
    it('debe importar y actualizar saldos de clientes masivamente', async () => {
      const clientesParaImportar: ClienteComercial[] = [
        {
          id: 'cli-masivo-1',
          codigo: 'CLI-IMP-01',
          nombre: 'Comunicaciones del Futuro S.A.S.',
          identificacion: '900999888-2',
          tipoIdentificacion: 'NIT',
          direccion: 'Av 68 # 20-10',
          ciudad: 'Bogotá',
          telefono: '3123456789',
          email: 'contacto@futuro.co',
          planServicio: 'Fibra 400 Mbps Dedicado',
          saldoPendiente: 650000,
          fechaVencimiento: '2026-10-28',
          estado: 'En mora',
          fechaCreacion: new Date().toISOString()
        }
      ];

      const res = await importarSaldosMasivos(clientesParaImportar);
      expect(res.importados + res.actualizados).toBeGreaterThanOrEqual(1);

      const clientes = await obtenerClientesComerciales();
      const importado = clientes.find(c => c.identificacion === '900999888-2');
      expect(importado).toBeDefined();
      expect(importado?.saldoPendiente).toBe(650000);
    });
  });

  describe('4. Módulo de Cobro, Recaudo y Actualización de Saldos', () => {
    it('debe registrar un pago, reducir el saldo del cliente y generar código de recibo', async () => {
      const clienteInicial: ClienteComercial = {
        id: 'cli-pago-test-1',
        codigo: 'CLI-PAG-01',
        nombre: 'Empresa Test Pago',
        identificacion: '900111222-3',
        tipoIdentificacion: 'NIT',
        direccion: 'Calle 10 # 5-20',
        ciudad: 'Bogotá',
        telefono: '3109998877',
        email: 'test@pago.com',
        planServicio: 'Internet 100 Mbps',
        saldoPendiente: 300000,
        fechaVencimiento: '2026-10-20',
        estado: 'En mora',
        fechaCreacion: '2026-01-01'
      };
      await guardarClienteComercial(clienteInicial);

      const pago: PagoRecaudo = {
        id: 'pago-test-01',
        codigoRecibo: 'REC-2026-00001',
        clienteId: clienteInicial.id,
        clienteNombre: clienteInicial.nombre,
        clienteIdentificacion: clienteInicial.identificacion,
        monto: 300000,
        fecha: new Date().toISOString(),
        metodoPago: 'Efectivo',
        cajeroNombre: 'Cajero Principal',
        saldoAnterior: 300000,
        saldoActual: 0,
        concepto: 'Pago total del mes',
        telefonoDestinoWhatsapp: '3109998877',
        emailDestino: 'test@pago.com'
      };

      await registrarPagoRecaudo(pago);

      const pagos = await obtenerPagosRecaudos();
      expect(pagos.some(p => p.codigoRecibo === 'REC-2026-00001')).toBe(true);

      const clientes = await obtenerClientesComerciales();
      const clienteActualizado = clientes.find(c => c.id === clienteInicial.id);
      expect(clienteActualizado?.saldoPendiente).toBe(0);
      expect(clienteActualizado?.estado).toBe('Al día');
    });
  });

  describe('5. Contratos de Clientes con Firma Digital y Carpeta de Google Drive', () => {
    it('debe registrar un contrato con firma digital, hash criptográfico y enlace a Google Drive', async () => {
      const codigoContrato = 'CTR-TELCO-2026-9999';
      const fecha = new Date().toISOString();
      const hash = await generarHashSHA256(`${codigoContrato}|900111222-3|250000|${fecha}|1018222333`);

      const contrato: ContratoCliente = {
        id: 'ctr-test-01',
        codigoContrato,
        clienteId: 'cli-001',
        clienteNombre: 'Cliente Conectado S.A.S.',
        clienteIdentificacion: '900111222-3',
        fechaContrato: fecha,
        planServicio: 'Fibra Óptica 500 Mbps Simétrica',
        velocidadMbps: 500,
        tarifaMensual: 250000,
        permanenciaMeses: 12,
        direccionInstalacion: 'Zona Industrial Montevideo',
        firmaDigitalUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        firmaNombre: 'Representante Legal',
        firmaCedula: '1018222333',
        firmaFecha: fecha,
        hashIntegridadSha256: hash,
        carpetaDriveId: '1bGroupContratosComerciales_2026',
        urlCarpetaDrive: 'https://drive.google.com/drive/folders/1bGroupContratosComerciales_2026',
        estado: 'Firmado',
        archivoContratoDriveUrl: 'https://drive.google.com/drive/folders/1bGroupContratosComerciales_2026?file=CTR-TELCO-2026-9999.pdf'
      };

      await guardarContratoCliente(contrato);
      const lista = await obtenerContratosClientes();
      const encontrado = lista.find(c => c.codigoContrato === codigoContrato);

      expect(encontrado).toBeDefined();
      expect(encontrado?.firmaDigitalUrl).toContain('data:image/png;base64');
      expect(encontrado?.hashIntegridadSha256).toBe(hash);
      expect(encontrado?.urlCarpetaDrive).toContain('drive.google.com/drive/folders');
    });
  });

  describe('6. Procesamiento y Validación de Plantilla Excel (.xlsx)', () => {
    it('debe procesar filas de una matriz Excel con encabezados y mapear clientes correctamente', () => {
      const matrizExcel = [
        ['codigo', 'identificacion', 'tipo_documento', 'nombre', 'direccion', 'ciudad', 'telefono', 'email', 'plan_servicio', 'saldo_pendiente', 'fecha_vencimiento'],
        ['CLI-EXCEL-01', '900555444-1', 'NIT', 'Servicios Globales SAS', 'Calle 26 # 69-76', 'Bogotá D.C.', '3109876543', 'info@globales.co', 'Canal Dedicado 1Gbps', 1500000, '2026-11-15'],
        ['CLI-EXCEL-02', '1032456789', 'CC', 'Andrés Felipe Castro', 'Carrera 15 # 85-30', 'Bogotá D.C.', '3151234567', 'andres.castro@correo.com', 'Plan Fibra Plus 400', 95000, '2026-11-10']
      ];

      const { clientes, errores } = procesarFilasMatrizSaldos(matrizExcel);
      expect(errores.length).toBe(0);
      expect(clientes.length).toBe(2);

      const cliente1 = clientes[0];
      expect(cliente1.codigo).toBe('CLI-EXCEL-01');
      expect(cliente1.identificacion).toBe('900555444-1');
      expect(cliente1.tipoIdentificacion).toBe('NIT');
      expect(cliente1.nombre).toBe('Servicios Globales SAS');
      expect(cliente1.saldoPendiente).toBe(1500000);
      expect(cliente1.estado).toBe('En mora');

      const cliente2 = clientes[1];
      expect(cliente2.tipoIdentificacion).toBe('CC');
      expect(cliente2.saldoPendiente).toBe(95000);
    });

    it('debe advertir si una fila de Excel carece de identificación o nombre', () => {
      const matrizInvalida = [
        ['codigo', 'identificacion', 'tipo_documento', 'nombre', 'direccion', 'ciudad', 'telefono', 'email', 'plan_servicio', 'saldo_pendiente', 'fecha_vencimiento'],
        ['CLI-INV-01', '', 'CC', 'Sin Documento', 'Calle 1', 'Bogotá', '', '', 'Plan', 50000, '2026-11-10'],
        ['CLI-INV-02', '10102020', 'CC', '', 'Calle 2', 'Bogotá', '', '', 'Plan', 50000, '2026-11-10']
      ];

      const { clientes, errores } = procesarFilasMatrizSaldos(matrizInvalida);
      expect(clientes.length).toBe(0);
      expect(errores.length).toBe(2);
      expect(errores[0]).toContain('identificación o NIT');
      expect(errores[1]).toContain('nombre o razón social');
    });
  });

});
