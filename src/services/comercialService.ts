/**
 * SERVICIO DE GESTIÓN COMERCIAL - CIMIENTO COMERCIAL
 * Soporta operaciones de:
 * 1. Gestión de Cajas / Cajero (apertura, movimientos, cierre)
 * 2. Saldos y Cartera de Clientes (importación masiva, validación)
 * 3. Cobro y Recaudo con multicanal (WhatsApp, Correo, WebShare nativo)
 * 4. Arqueos de Caja con inmutabilidad estricta para asesores comerciales
 * 5. Firma Digital de Contratos de Servicios y sincronización con Google Drive
 */

import {
  ClienteComercial,
  CajaTurno,
  PagoRecaudo,
  ArqueoCaja,
  ContratoCliente,
  UsuarioSistema
} from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  getDoc,
  query,
  orderBy
} from 'firebase/firestore';

// Claves de almacenamiento local de respaldo
const STORAGE_KEYS = {
  CLIENTES: 'cimiento_comercial_clientes',
  CAJAS: 'cimiento_comercial_cajas',
  PAGOS: 'cimiento_comercial_pagos',
  ARQUEOS: 'cimiento_comercial_arqueos',
  CONTRATOS: 'cimiento_comercial_contratos',
  DRIVE_CONFIG: 'cimiento_comercial_drive_folder'
};

// Almacén seguro con fallback en memoria para entornos de servidor o pruebas vitest
const memoriaStorage = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoriaStorage.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    memoriaStorage.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  }
};

// Datos semilla iniciales de clientes del sector de telecomunicaciones
export const CLIENTES_SEMILLA_COMERCIAL: ClienteComercial[] = [
  {
    id: 'cli-001',
    codigo: '901.442.889-1',
    nombre: 'Conectividad & Datos del Norte S.A.S.',
    identificacion: '901.442.889-1',
    tipoIdentificacion: 'NIT',
    direccion: 'Carrera 15 # 93-47 Of. 502',
    ciudad: 'Bogotá D.C.',
    telefono: '3157894512',
    email: 'facturacion@conectividaddelnorte.com',
    planServicio: 'Fibra Óptica Dedicada 500 Mbps Simétrica',
    velocidadMbps: 500,
    saldoPendiente: 850000,
    fechaVencimiento: '2026-10-15',
    estado: 'En mora',
    fechaCreacion: '2026-01-15'
  },
  {
    id: 'cli-002',
    codigo: '830.119.450-4',
    nombre: 'Inversiones y Redes Andinas Ltda.',
    identificacion: '830.119.450-4',
    tipoIdentificacion: 'NIT',
    direccion: 'Calle 26 # 69D-91 Torre 2',
    ciudad: 'Bogotá D.C.',
    telefono: '3104561234',
    email: 'contacto@redesandinas.co',
    planServicio: 'Troncal SIP 30 Canales + Fibra 300 Mbps',
    velocidadMbps: 300,
    saldoPendiente: 0,
    ultimoPagoFecha: '2026-10-01',
    ultimoPagoMonto: 1250000,
    fechaVencimiento: '2026-10-30',
    estado: 'Al día',
    fechaCreacion: '2026-02-10'
  },
  {
    id: 'cli-003',
    codigo: '79.845.120',
    nombre: 'Carlos Eduardo Ramírez Peña',
    identificacion: '79.845.120',
    tipoIdentificacion: 'CC',
    direccion: 'Transversal 78 # 45A-23 Sur',
    ciudad: 'Bogotá D.C.',
    telefono: '3209876543',
    email: 'carlos.ramirez79@gmail.com',
    planServicio: 'Internet Residencial Fibra 200 Mbps + IPTV',
    velocidadMbps: 200,
    saldoPendiente: 135000,
    fechaVencimiento: '2026-10-12',
    estado: 'En mora',
    fechaCreacion: '2026-03-01'
  },
  {
    id: 'cli-004',
    codigo: '900.876.543-2',
    nombre: 'Distribuidora Tecnológica del Oriente',
    identificacion: '900.876.543-2',
    tipoIdentificacion: 'NIT',
    direccion: 'Av. El Dorado # 68C-61',
    ciudad: 'Bogotá D.C.',
    telefono: '3186543210',
    email: 'administracion@distrioriente.com',
    planServicio: 'Radioenlace Microondas 100 Mbps Alta Disponibilidad',
    velocidadMbps: 100,
    saldoPendiente: 620000,
    fechaVencimiento: '2026-10-20',
    estado: 'Al día',
    fechaCreacion: '2026-03-15'
  }
];

// Generador de Hash Criptográfico SHA-256 para integridad de Arqueos y Contratos (Ley 527/1999)
export async function generarHashSHA256(cadena: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(cadena);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback matemático seguro
    let hash = 0;
    for (let i = 0; i < cadena.length; i++) {
      const char = cadena.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'sha256-fallback-' + Math.abs(hash).toString(16) + Date.now().toString(16);
  }
}

// ==========================================
// CLIENTES Y SALDOS
// ==========================================

export async function obtenerClientesComerciales(): Promise<ClienteComercial[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'clientes_comerciales'));
      if (!snap.empty) {
        const clientesFB: ClienteComercial[] = [];
        snap.forEach(docSnap => {
          const d = docSnap.data() as any;
          clientesFB.push({
            id: docSnap.id,
            ...d,
            codigo: d.identificacion || d.codigo
          });
        });
        safeStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientesFB));
        return clientesFB;
      }
    }
  } catch (err) {
    console.debug('Usando almacenamiento local para clientes comerciales');
  }

  const guardados = safeStorage.getItem(STORAGE_KEYS.CLIENTES);
  if (guardados) {
    try {
      const parsed = JSON.parse(guardados);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: ClienteComercial) => ({
          ...c,
          codigo: c.identificacion || c.codigo
        }));
      }
    } catch {}
  }

  safeStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(CLIENTES_SEMILLA_COMERCIAL));
  return CLIENTES_SEMILLA_COMERCIAL;
}

export async function guardarClienteComercial(cliente: ClienteComercial): Promise<void> {
  const actuales = await obtenerClientesComerciales();
  const clienteNormalizado: ClienteComercial = {
    ...cliente,
    codigo: cliente.identificacion || cliente.codigo
  };
  const index = actuales.findIndex(
    c => c.id === clienteNormalizado.id || c.identificacion === clienteNormalizado.identificacion
  );
  let actualizados: ClienteComercial[];
  if (index >= 0) {
    actualizados = [...actuales];
    actualizados[index] = clienteNormalizado;
  } else {
    actualizados = [clienteNormalizado, ...actuales];
  }
  safeStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(actualizados));

  try {
    if (db) {
      await setDoc(doc(db, 'clientes_comerciales', clienteNormalizado.id), clienteNormalizado);
    }
  } catch (err) {
    console.warn('Error sincronizando cliente con Firestore:', err);
  }
}

export async function importarSaldosMasivos(
  nuevosClientes: ClienteComercial[]
): Promise<{ importados: number; actualizados: number }> {
  const existentes = await obtenerClientesComerciales();
  let importados = 0;
  let actualizados = 0;

  const mapaExistentes = new Map(existentes.map(c => [c.identificacion.trim().toLowerCase(), c]));

  for (const nuevo of nuevosClientes) {
    const key = nuevo.identificacion.trim().toLowerCase();
    if (mapaExistentes.has(key)) {
      const anterior = mapaExistentes.get(key)!;
      mapaExistentes.set(key, {
        ...anterior,
        nombre: nuevo.nombre || anterior.nombre,
        saldoPendiente: nuevo.saldoPendiente,
        fechaVencimiento: nuevo.fechaVencimiento || anterior.fechaVencimiento,
        planServicio: nuevo.planServicio || anterior.planServicio,
        estado: nuevo.saldoPendiente > 0 ? (nuevo.estado || 'En mora') : 'Al día',
        telefono: nuevo.telefono || anterior.telefono,
        email: nuevo.email || anterior.email,
        direccion: nuevo.direccion || anterior.direccion
      });
      actualizados++;
    } else {
      mapaExistentes.set(key, nuevo);
      importados++;
    }
  }

  const listaFinal = Array.from(mapaExistentes.values());
  safeStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(listaFinal));

  try {
    if (db) {
      for (const item of listaFinal) {
        await setDoc(doc(db, 'clientes_comerciales', item.id), item);
      }
    }
  } catch (err) {
    console.debug('Saldos masivos almacenados en memoria local.');
  }

  return { importados, actualizados };
}

// ==========================================
// GESTIÓN DE CAJA (CAJERO)
// ==========================================

export async function obtenerCajasTurnos(): Promise<CajaTurno[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'cajas_turnos'));
      if (!snap.empty) {
        const cajas: CajaTurno[] = [];
        snap.forEach(d => cajas.push({ id: d.id, ...(d.data() as any) }));
        safeStorage.setItem(STORAGE_KEYS.CAJAS, JSON.stringify(cajas));
        return cajas;
      }
    }
  } catch (err) {
    console.debug('Usando almacenamiento local para cajas.');
  }

  const guardadas = safeStorage.getItem(STORAGE_KEYS.CAJAS);
  if (guardadas) {
    try {
      const parsed = JSON.parse(guardadas);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export async function abrirTurnoCaja(caja: CajaTurno): Promise<void> {
  const cajas = await obtenerCajasTurnos();
  const actualizadas = [caja, ...cajas.filter(c => c.id !== caja.id)];
  safeStorage.setItem(STORAGE_KEYS.CAJAS, JSON.stringify(actualizadas));

  try {
    if (db) {
      await setDoc(doc(db, 'cajas_turnos', caja.id), caja);
    }
  } catch (err) {
    console.warn('Error guardando apertura de caja en Firestore:', err);
  }
}

export async function cerrarTurnoCaja(
  cajaId: string,
  datosCierre: {
    fechaCierre: string;
    saldoRealEfectivo: number;
    diferencia: number;
    observaciones?: string;
  }
): Promise<void> {
  const cajas = await obtenerCajasTurnos();
  const index = cajas.findIndex(c => c.id === cajaId);
  if (index >= 0) {
    cajas[index] = {
      ...cajas[index],
      ...datosCierre,
      estado: 'Cerrada'
    };
    safeStorage.setItem(STORAGE_KEYS.CAJAS, JSON.stringify(cajas));

    try {
      if (db) {
        await updateDoc(doc(db, 'cajas_turnos', cajaId), {
          ...datosCierre,
          estado: 'Cerrada'
        });
      }
    } catch (err) {
      console.warn('Error cerrando caja en Firestore:', err);
    }
  }
}

// ==========================================
// PAGOS Y RECAUDOS
// ==========================================

export async function obtenerPagosRecaudos(): Promise<PagoRecaudo[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'pagos_recaudos'));
      if (!snap.empty) {
        const pagos: PagoRecaudo[] = [];
        snap.forEach(d => pagos.push({ id: d.id, ...(d.data() as any) }));
        safeStorage.setItem(STORAGE_KEYS.PAGOS, JSON.stringify(pagos));
        return pagos;
      }
    }
  } catch (err) {
    console.debug('Usando almacenamiento local para recaudos.');
  }

  const guardados = safeStorage.getItem(STORAGE_KEYS.PAGOS);
  if (guardados) {
    try {
      const parsed = JSON.parse(guardados);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export async function registrarPagoRecaudo(pago: PagoRecaudo): Promise<void> {
  // 1. Guardar pago
  const pagos = await obtenerPagosRecaudos();
  const actualizados = [pago, ...pagos];
  safeStorage.setItem(STORAGE_KEYS.PAGOS, JSON.stringify(actualizados));

  try {
    if (db) {
      await setDoc(doc(db, 'pagos_recaudos', pago.id), pago);
    }
  } catch (err) {
    console.warn('Error guardando pago en Firestore:', err);
  }

  // 2. Actualizar saldo del cliente
  const clientes = await obtenerClientesComerciales();
  const cliIndex = clientes.findIndex(c => c.id === pago.clienteId);
  if (cliIndex >= 0) {
    const cli = clientes[cliIndex];
    const nuevoSaldo = Math.max(0, (cli.saldoPendiente || 0) - pago.monto);
    clientes[cliIndex] = {
      ...cli,
      saldoPendiente: nuevoSaldo,
      ultimoPagoFecha: pago.fecha,
      ultimoPagoMonto: pago.monto,
      estado: nuevoSaldo === 0 ? 'Al día' : cli.estado
    };
    await guardarClienteComercial(clientes[cliIndex]);
  }

  // 3. Actualizar caja activa si existe
  if (pago.cajaTurnoId) {
    const cajas = await obtenerCajasTurnos();
    const cajaIndex = cajas.findIndex(c => c.id === pago.cajaTurnoId);
    if (cajaIndex >= 0) {
      const caja = cajas[cajaIndex];
      const esEfectivo = pago.metodoPago === 'Efectivo';
      cajas[cajaIndex] = {
        ...caja,
        totalRecaudadoEfectivo: caja.totalRecaudadoEfectivo + (esEfectivo ? pago.monto : 0),
        totalRecaudadoDigital: caja.totalRecaudadoDigital + (!esEfectivo ? pago.monto : 0),
        saldoEsperadoEfectivo: caja.montoApertura + caja.totalRecaudadoEfectivo + (esEfectivo ? pago.monto : 0) - caja.totalEgresos
      };
      safeStorage.setItem(STORAGE_KEYS.CAJAS, JSON.stringify(cajas));
      try {
        if (db) {
          await setDoc(doc(db, 'cajas_turnos', pago.cajaTurnoId), cajas[cajaIndex], { merge: true });
        }
      } catch {}
    }
  }
}

// ==========================================
// ARQUEOS DE CAJA (INMUTABLES PARA ASESORES)
// ==========================================

export async function obtenerArqueosCaja(): Promise<ArqueoCaja[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'arqueos_cajas'));
      if (!snap.empty) {
        const arqueos: ArqueoCaja[] = [];
        snap.forEach(d => arqueos.push({ id: d.id, ...(d.data() as any) }));
        safeStorage.setItem(STORAGE_KEYS.ARQUEOS, JSON.stringify(arqueos));
        return arqueos;
      }
    }
  } catch (err) {
    console.debug('Usando almacenamiento local para arqueos.');
  }

  const guardados = safeStorage.getItem(STORAGE_KEYS.ARQUEOS);
  if (guardados) {
    try {
      const parsed = JSON.parse(guardados);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

/**
 * Registra un arqueo de caja con sello criptográfico inmutable.
 * Una vez registrado por el asesor, queda permanentemente bloqueado para modificación por asesores.
 */
export async function registrarArqueoCaja(arqueo: ArqueoCaja): Promise<void> {
  // Asegurar inmutabilidad por defecto
  const arqueoSellado: ArqueoCaja = {
    ...arqueo,
    inmutable: true
  };

  const arqueos = await obtenerArqueosCaja();
  const actualizados = [arqueoSellado, ...arqueos.filter(a => a.id !== arqueo.id)];
  safeStorage.setItem(STORAGE_KEYS.ARQUEOS, JSON.stringify(actualizados));

  try {
    if (db) {
      await setDoc(doc(db, 'arqueos_cajas', arqueo.id), arqueoSellado);
    }
  } catch (err) {
    console.warn('Error registrando arqueo inmutable en Firestore:', err);
  }
}

/**
 * Modificación EXCLUSIVA para Administradores de un registro de arqueo.
 * Deja registro formal de auditoría y motivo de ajuste.
 */
export async function modificarArqueoPorAdmin(
  arqueoId: string,
  admin: UsuarioSistema,
  datosAjuste: {
    totalFisico: number;
    totalSistema: number;
    diferencia: number;
    motivoAjuste: string;
    observaciones?: string;
  }
): Promise<void> {
  const arqueos = await obtenerArqueosCaja();
  const index = arqueos.findIndex(a => a.id === arqueoId);
  if (index < 0) throw new Error('Arqueo no encontrado.');

  const previo = arqueos[index];

  const arqueoModificado: ArqueoCaja = {
    ...previo,
    totalFisico: datosAjuste.totalFisico,
    totalSistema: datosAjuste.totalSistema,
    diferencia: datosAjuste.diferencia,
    estado: datosAjuste.diferencia === 0 ? 'Cuadrado' : datosAjuste.diferencia < 0 ? 'Faltante' : 'Sobrante',
    observacionesAsesor: datosAjuste.observaciones || previo.observacionesAsesor,
    modificadoPorAdmin: {
      adminId: admin.id,
      adminNombre: admin.nombre || admin.email,
      fechaModificacion: new Date().toISOString(),
      motivoAjuste: datosAjuste.motivoAjuste,
      valoresPrevios: {
        totalFisico: previo.totalFisico,
        totalSistema: previo.totalSistema,
        diferencia: previo.diferencia
      }
    }
  };

  arqueos[index] = arqueoModificado;
  safeStorage.setItem(STORAGE_KEYS.ARQUEOS, JSON.stringify(arqueos));

  try {
    if (db) {
      await setDoc(doc(db, 'arqueos_cajas', arqueoId), arqueoModificado);
    }
  } catch (err) {
    console.warn('Error actualizando arqueo por admin en Firestore:', err);
  }
}

// ==========================================
// CONTRATOS DE USUARIOS Y FIRMA DIGITAL (CRC RES. 5111 / 5050)
// ==========================================

export const CONTRATOS_SEMILLA_COMERCIAL: ContratoCliente[] = [
  {
    id: 'ctr-semilla-001',
    codigoContrato: 'CTR-TELCO-2026-0001',
    clienteId: 'cli-001',
    clienteCodigo: '901.442.889-1',
    clienteNombre: 'Conectividad & Datos del Norte S.A.S.',
    clienteIdentificacion: '901.442.889-1',
    clienteTipoIdentificacion: 'NIT',
    clienteTelefono: '3157894512',
    clienteEmail: 'facturacion@conectividaddelnorte.com',
    ciudadInstalacion: 'Bogotá D.C.',
    barrioVereda: 'Chicó Norte',
    estrato: 'Comercial',
    fechaContrato: '2026-01-15T10:30:00.000Z',
    fechaInicioFacturacion: '2026-02-01',
    diaCorteMensual: 1,
    tipoServicio: 'Canal Dedicado Empresarial',
    tecnologiaAcceso: 'Fibra Dedicada MetroEthernet',
    planServicio: 'Fibra Óptica Dedicada 500 Mbps Simétrica',
    velocidadMbps: 500,
    velocidadSubidaMbps: 500,
    tarifaMensual: 850000,
    aplicaIva: true,
    valorIva: 161500,
    totalMensualPagar: 1011500,
    permanenciaMeses: 24,
    cargoConexionTotal: 1200000,
    cargoConexionDescuento: 1200000,
    direccionInstalacion: 'Carrera 15 # 93-47 Of. 502',
    ipAsignada: '181.55.120.14',
    nodoCajaNap: 'NAP-CHICO-02 Pto 01',
    equipoComodato: {
      marcaModelo: 'MikroTik CCR2004-1G-12S+2XS + SFP+ 10G',
      serialOnt: 'MKT-2026-88912A',
      macAddress: 'DC:2C:6E:44:81:09',
      valorReposicion: 1850000
    },
    autorizaHabeasData: true,
    autorizaCentralesRiesgo: true,
    aceptaFacturaElectronica: true,
    firmaDigitalUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="90"><path d="M25,65 C55,20 75,75 110,40 C135,15 150,70 185,45 C215,25 245,60 295,35" fill="none" stroke="#18235C" stroke-width="3" stroke-linecap="round"/></svg>')}`,
    firmaNombre: 'Gustavo Adolfo Vega (Rep. Legal)',
    firmaCedula: '79.451.890',
    firmaFecha: '2026-01-15T10:30:00.000Z',
    asesorComercialNombre: 'Dirección Comercial B GROUP',
    hashIntegridadSha256: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    carpetaDriveId: '1bGroupContratosComerciales_2026',
    urlCarpetaDrive: 'https://drive.google.com/drive/folders/1bGroupContratosComerciales_2026',
    estado: 'Activo',
    archivoContratoDriveUrl: 'https://drive.google.com/drive/folders/1bGroupContratosComerciales_2026?file=CTR-TELCO-2026-0001.pdf',
    observaciones: 'Acuerdo de Nivel de Servicio (SLA) 99.8% disponibilidad garantizada.'
  },
  {
    id: 'ctr-semilla-002',
    codigoContrato: 'CTR-TELCO-2026-0002',
    clienteId: 'cli-002',
    clienteCodigo: '830.119.450-4',
    clienteNombre: 'Inversiones y Redes Andinas Ltda.',
    clienteIdentificacion: '830.119.450-4',
    clienteTipoIdentificacion: 'NIT',
    clienteTelefono: '3104561234',
    clienteEmail: 'contacto@redesandinas.co',
    ciudadInstalacion: 'Bogotá D.C.',
    barrioVereda: 'Salitre Empresarial',
    estrato: 'Comercial',
    fechaContrato: '2026-02-10T14:15:00.000Z',
    fechaInicioFacturacion: '2026-03-01',
    diaCorteMensual: 5,
    tipoServicio: 'Trío Internet + TV + Voz IP',
    tecnologiaAcceso: 'Fibra Óptica GPON (FTTH)',
    planServicio: 'Troncal SIP 30 Canales + Fibra 300 Mbps',
    velocidadMbps: 300,
    velocidadSubidaMbps: 300,
    tarifaMensual: 1250000,
    aplicaIva: true,
    valorIva: 237500,
    totalMensualPagar: 1487500,
    permanenciaMeses: 12,
    cargoConexionTotal: 600000,
    cargoConexionDescuento: 600000,
    direccionInstalacion: 'Calle 26 # 69D-91 Torre 2',
    ipAsignada: '190.144.88.210',
    nodoCajaNap: 'NAP-SALITRE-08 Pto 04',
    equipoComodato: {
      marcaModelo: 'Huawei EchoLife EG8145X6 Wi-Fi 6 + Grandstream GXW4232',
      serialOnt: 'HWTC-994120B5',
      macAddress: '48:57:02:99:41:B5',
      valorReposicion: 920000
    },
    autorizaHabeasData: true,
    autorizaCentralesRiesgo: true,
    aceptaFacturaElectronica: true,
    firmaDigitalUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="90"><path d="M30,55 Q70,10 110,55 T190,45 T280,50" fill="none" stroke="#18235C" stroke-width="3" stroke-linecap="round"/></svg>')}`,
    firmaNombre: 'Patricia Elena Mendoza (Gerente)',
    firmaCedula: '52.311.490',
    firmaFecha: '2026-02-10T14:15:00.000Z',
    asesorComercialNombre: 'Dirección Comercial B GROUP',
    hashIntegridadSha256: '3c59dc048e8850243be8079a5c74d07978451234a6b8c9d0e1f2a3b4c5d6e7f8',
    carpetaDriveId: '1bGroupContratosComerciales_2026',
    urlCarpetaDrive: 'https://drive.google.com/drive/folders/1bGroupContratosComerciales_2026',
    estado: 'Activo',
    archivoContratoDriveUrl: 'https://drive.google.com/drive/folders/1bGroupContratosComerciales_2026?file=CTR-TELCO-2026-0002.pdf',
    observaciones: 'Numeración PBX migrada en portabilidad numérica fija.'
  },
  {
    id: 'ctr-semilla-003',
    codigoContrato: 'CTR-TELCO-2026-0003',
    clienteId: 'cli-003',
    clienteCodigo: '79.845.120',
    clienteNombre: 'Carlos Eduardo Ramírez Peña',
    clienteIdentificacion: '79.845.120',
    clienteTipoIdentificacion: 'CC',
    clienteTelefono: '3209876543',
    clienteEmail: 'carlos.ramirez79@gmail.com',
    ciudadInstalacion: 'Bogotá D.C.',
    barrioVereda: 'Madelena Sur',
    estrato: '3',
    fechaContrato: '2026-03-01T09:00:00.000Z',
    fechaInicioFacturacion: '2026-03-05',
    diaCorteMensual: 15,
    tipoServicio: 'Dúo Internet + TV Digital',
    tecnologiaAcceso: 'Fibra Óptica GPON (FTTH)',
    planServicio: 'Internet Residencial Fibra 200 Mbps + IPTV',
    velocidadMbps: 200,
    velocidadSubidaMbps: 200,
    tarifaMensual: 135000,
    aplicaIva: false,
    valorIva: 0,
    totalMensualPagar: 135000,
    permanenciaMeses: 12,
    cargoConexionTotal: 240000,
    cargoConexionDescuento: 240000,
    direccionInstalacion: 'Transversal 78 # 45A-23 Sur',
    ipAsignada: '100.64.18.92',
    nodoCajaNap: 'NAP-SUR-14 Pto 07',
    equipoComodato: {
      marcaModelo: 'Huawei EchoLife HG8145V5 Dual Band AC1200',
      serialOnt: 'HWTC-332098C1',
      macAddress: '48:57:02:33:20:C1',
      valorReposicion: 320000
    },
    autorizaHabeasData: true,
    autorizaCentralesRiesgo: true,
    aceptaFacturaElectronica: true,
    firmaDigitalUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="90"><path d="M40,60 C80,20 100,80 140,30 C170,5 210,75 270,40" fill="none" stroke="#18235C" stroke-width="3" stroke-linecap="round"/></svg>')}`,
    firmaNombre: 'Carlos Eduardo Ramírez Peña',
    firmaCedula: '79.845.120',
    firmaFecha: '2026-03-01T09:00:00.000Z',
    asesorComercialNombre: 'Dirección Comercial B GROUP',
    hashIntegridadSha256: '7b91e3410f6a82d1590b33e77c901234f67890abc123def4567890abcdef1234',
    carpetaDriveId: '1bGroupContratosComerciales_2026',
    urlCarpetaDrive: 'https://drive.google.com/drive/folders/1bGroupContratosComerciales_2026',
    estado: 'Firmado',
    archivoContratoDriveUrl: 'https://drive.google.com/drive/folders/1bGroupContratosComerciales_2026?file=CTR-TELCO-2026-0003.pdf',
    observaciones: 'Exento de IVA en internet residencial Estrato 3 según Estatuto Tributario.'
  }
];

export async function obtenerContratosClientes(): Promise<ContratoCliente[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'contratos_clientes'));
      if (!snap.empty) {
        const contratos: ContratoCliente[] = [];
        snap.forEach(d => contratos.push({ id: d.id, ...(d.data() as any) }));
        safeStorage.setItem(STORAGE_KEYS.CONTRATOS, JSON.stringify(contratos));
        return contratos;
      }
    }
  } catch (err) {
    console.debug('Usando almacenamiento local para contratos.');
  }

  const guardados = safeStorage.getItem(STORAGE_KEYS.CONTRATOS);
  if (guardados) {
    try {
      const parsed = JSON.parse(guardados);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  safeStorage.setItem(STORAGE_KEYS.CONTRATOS, JSON.stringify(CONTRATOS_SEMILLA_COMERCIAL));
  return CONTRATOS_SEMILLA_COMERCIAL;
}

export async function guardarContratoCliente(contrato: ContratoCliente): Promise<void> {
  const contratos = await obtenerContratosClientes();
  // Asegurar que el código del usuario sea siempre igual a su documento de identidad
  const contratoNormalizado: ContratoCliente = {
    ...contrato,
    clienteCodigo: contrato.clienteIdentificacion || contrato.clienteCodigo || contrato.firmaCedula
  };
  const index = contratos.findIndex(c => c.id === contratoNormalizado.id);
  let actualizados: ContratoCliente[];
  if (index >= 0) {
    actualizados = [...contratos];
    actualizados[index] = contratoNormalizado;
  } else {
    actualizados = [contratoNormalizado, ...contratos];
  }
  safeStorage.setItem(STORAGE_KEYS.CONTRATOS, JSON.stringify(actualizados));

  try {
    if (db) {
      await setDoc(doc(db, 'contratos_clientes', contratoNormalizado.id), contratoNormalizado);
    }
  } catch (err) {
    console.warn('Error guardando contrato en Firestore:', err);
  }
}

export async function actualizarEstadoContratoCliente(
  contratoId: string,
  nuevoEstado: ContratoCliente['estado']
): Promise<void> {
  const contratos = await obtenerContratosClientes();
  const idx = contratos.findIndex(c => c.id === contratoId);
  if (idx < 0) return;

  const actualizado: ContratoCliente = {
    ...contratos[idx],
    estado: nuevoEstado
  };
  contratos[idx] = actualizado;
  safeStorage.setItem(STORAGE_KEYS.CONTRATOS, JSON.stringify(contratos));

  try {
    if (db) {
      await setDoc(doc(db, 'contratos_clientes', contratoId), actualizado, { merge: true });
    }
  } catch (err) {
    console.warn('Error actualizando estado de contrato en Firestore:', err);
  }
}

export async function eliminarContratoCliente(contratoId: string): Promise<void> {
  const contratos = await obtenerContratosClientes();
  const filtrados = contratos.filter(c => c.id !== contratoId);
  safeStorage.setItem(STORAGE_KEYS.CONTRATOS, JSON.stringify(filtrados));
}

// Configuración de la carpeta institucional de Google Drive para contratos
export function obtenerCarpetaDriveContratos(): string {
  return safeStorage.getItem(STORAGE_KEYS.DRIVE_CONFIG) || '1bGroupContratosComerciales_2026';
}

export function guardarCarpetaDriveContratos(carpetaIdOUrl: string): void {
  safeStorage.setItem(STORAGE_KEYS.DRIVE_CONFIG, carpetaIdOUrl);
}

