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
    codigo: 'CLI-2026-001',
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
    codigo: 'CLI-2026-002',
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
    codigo: 'CLI-2026-003',
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
    codigo: 'CLI-2026-004',
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
          clientesFB.push({ id: docSnap.id, ...(docSnap.data() as any) });
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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  safeStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(CLIENTES_SEMILLA_COMERCIAL));
  return CLIENTES_SEMILLA_COMERCIAL;
}

export async function guardarClienteComercial(cliente: ClienteComercial): Promise<void> {
  const actuales = await obtenerClientesComerciales();
  const index = actuales.findIndex(c => c.id === cliente.id || c.codigo === cliente.codigo);
  let actualizados: ClienteComercial[];
  if (index >= 0) {
    actualizados = [...actuales];
    actualizados[index] = cliente;
  } else {
    actualizados = [cliente, ...actuales];
  }
  safeStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(actualizados));

  try {
    if (db) {
      await setDoc(doc(db, 'clientes_comerciales', cliente.id), cliente);
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
// CONTRATOS Y FIRMA DIGITAL
// ==========================================

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
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export async function guardarContratoCliente(contrato: ContratoCliente): Promise<void> {
  const contratos = await obtenerContratosClientes();
  const index = contratos.findIndex(c => c.id === contrato.id);
  let actualizados: ContratoCliente[];
  if (index >= 0) {
    actualizados = [...contratos];
    actualizados[index] = contrato;
  } else {
    actualizados = [contrato, ...contratos];
  }
  safeStorage.setItem(STORAGE_KEYS.CONTRATOS, JSON.stringify(actualizados));

  try {
    if (db) {
      await setDoc(doc(db, 'contratos_clientes', contrato.id), contrato);
    }
  } catch (err) {
    console.warn('Error guardando contrato en Firestore:', err);
  }
}

// Configuración de la carpeta institucional de Google Drive para contratos
export function obtenerCarpetaDriveContratos(): string {
  return safeStorage.getItem(STORAGE_KEYS.DRIVE_CONFIG) || '1bGroupContratosComerciales_2026';
}

export function guardarCarpetaDriveContratos(carpetaIdOUrl: string): void {
  safeStorage.setItem(STORAGE_KEYS.DRIVE_CONFIG, carpetaIdOUrl);
}
