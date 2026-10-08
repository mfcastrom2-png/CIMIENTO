import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Empleado,
  Cargo,
  AreaOrganizacion,
  ProcesoOrganizacion,
  ParametrosLegalesNomina,
  ItemInventarioEPP,
  SolicitudEntregaEPP,
  Solicitud,
  EvaluacionDesempeno,
  UsuarioSistema,
  RolSistema,
  PeriodoNomina,
  LiquidacionEmpleadoNomina,
  EventoAuditoria,
  AccionAuditoria,
  AnuncioSlide,
  DocumentoMuroPDF,
  Capacitacion,
  ConfiguracionEmpresa,
  SaldoInicialEmpleadoNomina
} from '../types';
import { obtenerPermisosPorDefecto } from '../data/usuariosYVotacionesData';
import { initialAreas, initialProcesos, INITIAL_CARGOS } from '../data/initialData';

// 1. Inicialización de Firebase con soporte de Long Polling para proxies y contenedores
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 1.1 Configuración de Firebase App Check (reCAPTCHA Enterprise)
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (typeof window !== 'undefined') {
  if (recaptchaSiteKey) {
    try {
      if (import.meta.env.DEV) {
        // @ts-expect-error Firebase App Check debug token setup
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
      }
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.info('[Security] Firebase App Check activado con reCAPTCHA Enterprise.');
    } catch (appCheckError) {
      console.warn('[Security] Advertencia al inicializar App Check:', appCheckError);
    }
  } else if (import.meta.env.PROD) {
    console.warn('[Security] ADVERTENCIA: VITE_RECAPTCHA_SITE_KEY no está configurado en producción. Firebase App Check permanece inactivo.');
  }
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Inicialización de Firestore según directriz de la habilidad firebase-integration con AutoDetectLongPolling para máxima resiliencia en red
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

// Estructuras de Error y Diagnóstico según directriz SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Diagnóstico Firestore: ', JSON.stringify(errInfo));
}

// Validación de conectividad con timeout y tolerancia a modo offline/caché
export async function testConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 4000)
    );
    const docPromise = getDocFromServer(doc(db, 'test', 'connection')).then(() => true);
    return await Promise.race([docPromise, timeoutPromise]);
  } catch (error) {
    console.info('[Firestore] Cliente operando en modo offline / caché local.');
    return false;
  }
}

// 2. Servicios de Autenticación
export const loginConEmail = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email.trim(), pass);
};

export const solicitarRestablecimientoClave = async (email: string) => {
  return await sendPasswordResetEmail(auth, email.trim());
};

export const registrarConEmail = async (
  email: string,
  pass: string,
  nombre: string,
  rol: RolSistema | string = 'empleado',
  documento: string = ''
) => {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  await updateProfile(credential.user, { displayName: nombre });

  const rolValido = (rol as RolSistema) || 'empleado';
  // Crear perfil inicial seguro en la colección `usuarios` con los permisos correspondientes a su rol
  const userProfile: UsuarioSistema = {
    id: credential.user.uid,
    nombre,
    email: email.trim().toLowerCase(),
    documento: documento || '—',
    rol: rolValido,
    estado: 'activo',
    ultimoAcceso: new Date().toISOString(),
    fechaCreacion: new Date().toISOString(),
    dobleFactorHabilitado: false,
    permisos: obtenerPermisosPorDefecto(rolValido)
  };

  await setDoc(doc(db, 'usuarios', credential.user.uid), userProfile);
  return { user: credential.user, profile: userProfile };
};

export const loginConGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Obtener o inicializar perfil seguro con rol empleado
  const profile = await obtenerPerfilUsuario(user.uid, user.email || '');

  return { user, profile: profile || {
    id: user.uid,
    nombre: user.displayName || 'Usuario Corporativo',
    email: (user.email || '').toLowerCase(),
    documento: '—',
    rol: 'empleado',
    estado: 'activo',
    ultimoAcceso: new Date().toISOString(),
    fechaCreacion: new Date().toISOString(),
    dobleFactorHabilitado: false,
    permisos: obtenerPermisosPorDefecto('empleado')
  }};
};

export const cerrarSesion = async () => {
  return await signOut(auth);
};

export const obtenerPerfilUsuario = async (uid: string, emailOpcional?: string): Promise<UsuarioSistema | null> => {
  try {
    const userDocRef = doc(db, 'usuarios', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const rawData = userDoc.data() as UsuarioSistema;
      const rolNormalizado = (rawData.rol as RolSistema) || 'empleado';
      const permisosRaw = (Array.isArray(rawData.permisos) && rawData.permisos.length > 0)
        ? rawData.permisos
        : obtenerPermisosPorDefecto(rolNormalizado);
      const permisosNormalizados = rolNormalizado === 'empleado'
        ? permisosRaw.filter(p => p !== 'documentos')
        : permisosRaw;
      const data: UsuarioSistema = {
        ...rawData,
        rol: rolNormalizado,
        permisos: permisosNormalizados
      };

      // Auto-enlace con expediente de empleado si aún no tiene empleadoId asignado
      if (!data.empleadoId && data.email) {
        try {
          const empQuery = query(collection(db, 'empleados'), where('email', '==', data.email.toLowerCase()));
          const empSnap = await getDocs(empQuery);
          if (!empSnap.empty) {
            const empDoc = empSnap.docs[0];
            const empData = empDoc.data();
            const cargoNombre = empData?.laboral?.cargoNombre || empData?.cargoId || data.cargoNombre;
            const docNum = empData?.documento || data.documento;
            await updateDoc(userDocRef, {
              empleadoId: empDoc.id,
              cargoNombre,
              documento: docNum
            });
            return {
              ...data,
              empleadoId: empDoc.id,
              cargoNombre,
              documento: docNum
            };
          }
        } catch {}
      }
      return data;
    }

    const currentFbUser = auth.currentUser;
    const userEmail = (emailOpcional || currentFbUser?.email || '').trim().toLowerCase();

    if (userEmail) {
      // 1. Buscar si ya existe un expediente de empleado para asociarlo automáticamente (SEC-B02)
      let vinculadoEmpleadoId: string | undefined;
      let cargoVinculado = 'Colaborador';
      let docVinculado = '—';
      let nombreVinculado = currentFbUser?.displayName || userEmail.split('@')[0].replace('.', ' ').toUpperCase();

      try {
        const empQuery = query(collection(db, 'empleados'), where('email', '==', userEmail));
        const empSnap = await getDocs(empQuery);
        if (!empSnap.empty) {
          const empDoc = empSnap.docs[0];
          const empData = empDoc.data();
          vinculadoEmpleadoId = empDoc.id;
          cargoVinculado = empData?.laboral?.cargoNombre || empData?.cargoId || 'Colaborador';
          docVinculado = empData?.documento || '—';
          if (empData?.nombre) {
            nombreVinculado = empData.nombre;
          }
        }
      } catch {}

      // Usuario nuevo (Google o Email): Siempre rol: 'empleado' por defecto
      const perfilColaboradorDefault: UsuarioSistema = {
        id: uid,
        nombre: nombreVinculado,
        email: userEmail,
        documento: docVinculado,
        rol: 'empleado',
        cargoNombre: cargoVinculado,
        ...(vinculadoEmpleadoId ? { empleadoId: vinculadoEmpleadoId } : {}),
        estado: 'activo',
        ultimoAcceso: new Date().toISOString(),
        fechaCreacion: new Date().toISOString().split('T')[0],
        dobleFactorHabilitado: false,
        permisos: obtenerPermisosPorDefecto('empleado')
      };
      await setDoc(userDocRef, perfilColaboradorDefault);
      return perfilColaboradorDefault;
    }

    return null;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Error al obtener o aprovisionar perfil de usuario:', err);
    }
    return null;
  }
};

// 3.0 Registro de Auditoría Inmutable del Sistema (Append-only)
export const registrarEventoAuditoria = async (
  accion: AccionAuditoria | string,
  entidad: string,
  detalle: string,
  usuario?: UsuarioSistema | { uid?: string; email?: string; nombre?: string; rol?: string } | null,
  entidadId?: string,
  metadatos?: Record<string, any>
): Promise<void> => {
  try {
    const logId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userLog = usuario || {
      uid: auth.currentUser?.uid || 'anonimo',
      email: auth.currentUser?.email || 'desconocido',
      nombre: auth.currentUser?.displayName || 'Usuario Sistema',
      rol: 'usuario'
    };

    const evento: EventoAuditoria = {
      id: logId,
      timestamp: new Date().toISOString(),
      accion,
      entidad,
      entidadId: entidadId || '—',
      detalle,
      usuario: {
        uid: (userLog as any).uid || (userLog as any).id || 'anonimo',
        email: userLog.email || 'desconocido@bgroup.com',
        nombre: (userLog as any).nombre || userLog.email || 'Usuario',
        rol: (userLog as any).rol || 'usuario'
      },
      metadatos: metadatos || {}
    };

    await setDoc(doc(db, 'auditoria_sistema', logId), evento);
  } catch (err) {
    console.warn('[Auditoría] Advertencia al registrar evento de auditoría:', err);
  }
};

// 3.1 Consultas Paginadas Bajo Demanda con Cursores
export interface ResultadoPaginado<T> {
  items: T[];
  ultimoDoc: QueryDocumentSnapshot<DocumentData> | null;
  hayMas: boolean;
}

export const obtenerColeccionPaginada = async <T>(
  nombreColeccion: string,
  tamanoPagina: number = 25,
  cursorUltimoDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  campoOrden?: string
): Promise<ResultadoPaginado<T>> => {
  try {
    const colRef = collection(db, nombreColeccion);
    let q;
    if (campoOrden && campoOrden !== 'id' && campoOrden !== '__name__') {
      q = cursorUltimoDoc
        ? query(colRef, orderBy(campoOrden), startAfter(cursorUltimoDoc), limit(tamanoPagina))
        : query(colRef, orderBy(campoOrden), limit(tamanoPagina));
    } else {
      q = cursorUltimoDoc
        ? query(colRef, startAfter(cursorUltimoDoc), limit(tamanoPagina))
        : query(colRef, limit(tamanoPagina));
    }
    const snap = await getDocs(q);
    const items: T[] = [];
    snap.forEach((docSnap) => {
      items.push({ ...(docSnap.data() as T), id: docSnap.id });
    });
    const ultimoDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return {
      items,
      ultimoDoc,
      hayMas: snap.docs.length === tamanoPagina
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, nombreColeccion);
    return { items: [], ultimoDoc: null, hayMas: false };
  }
};

// 3.2 Obtener colección completa bajo demanda (sin listener continuo para optimización de cuota)
export const obtenerColeccionDirecta = async <T>(
  nombreColeccion: string
): Promise<T[]> => {
  try {
    const colRef = collection(db, nombreColeccion);
    const snap = await getDocs(colRef);
    const items: T[] = [];
    snap.forEach((docSnap) => {
      items.push({ ...(docSnap.data() as T), id: docSnap.id });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, nombreColeccion);
    return [];
  }
};

// 3.3 Consulta bajo demanda compatible (Reemplaza definitivamente las lecturas continuas onSnapshot)
export const suscribirColeccion = <T>(
  nombreColeccion: string,
  onData: (data: T[]) => void,
  onError?: (error: Error) => void
) => {
  obtenerColeccionDirecta<T>(nombreColeccion)
    .then(items => {
      onData(items);
    })
    .catch(err => {
      if (onError) onError(err);
    });
  return () => {};
};

// Función utilitaria para sanitizar objetos antes de persistir en Cloud Firestore
// Elimina propiedades undefined recursivamente para evitar excepciones "Unsupported field value: undefined"
export const limpiarParaFirestore = <T>(obj: T): T => {
  if (obj === undefined) return null as any;
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString() as any;
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => limpiarParaFirestore(item)) as any;
  }
  const limpio: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      limpio[key] = limpiarParaFirestore(value);
    }
  }
  return limpio as T;
};

// 4. Operaciones de Escritura y Actualización
export const guardarEmpleadoFB = async (empleado: Empleado, autor?: UsuarioSistema | null) => {
  const docRef = doc(db, 'empleados', empleado.id);
  const data = limpiarParaFirestore(empleado);
  await setDoc(docRef, data, { merge: true });
  await registrarEventoAuditoria(
    'ACTUALIZACION',
    'empleados',
    `Guardado expediente del colaborador ${empleado.nombre} (C.C. ${empleado.documento})`,
    autor,
    empleado.id
  );
};

export const eliminarEmpleadoFB = async (id: string, nombreColaborador?: string, autor?: UsuarioSistema | null) => {
  await deleteDoc(doc(db, 'empleados', id));
  await registrarEventoAuditoria(
    'ELIMINACION',
    'empleados',
    `Eliminado expediente del colaborador ${nombreColaborador || id}`,
    autor,
    id
  );
};

export const guardarCargoFB = async (cargo: Cargo, autor?: UsuarioSistema | null) => {
  const docRef = doc(db, 'cargos', cargo.id);
  const data = limpiarParaFirestore(cargo);
  await setDoc(docRef, data, { merge: true });
  await registrarEventoAuditoria(
    'ACTUALIZACION',
    'cargos',
    `Guardado cargo ${cargo.nombre} (ID: ${cargo.id})`,
    autor,
    cargo.id
  );
};

export const eliminarCargoFB = async (id: string, nombre?: string, autor?: UsuarioSistema | null) => {
  await deleteDoc(doc(db, 'cargos', id));
  await registrarEventoAuditoria(
    'ELIMINACION',
    'cargos',
    `Eliminado cargo ${nombre || id}`,
    autor,
    id
  );
};

export const guardarAreaFB = async (area: AreaOrganizacion, autor?: UsuarioSistema | null) => {
  const docRef = doc(db, 'areas', area.id);
  const data = limpiarParaFirestore(area);
  await setDoc(docRef, data, { merge: true });
  await registrarEventoAuditoria(
    'ACTUALIZACION',
    'estructura',
    `Guardada área organizacional: ${area.nombre} (${area.codigo || area.id})`,
    autor,
    area.id
  );
};

export const eliminarAreaFB = async (id: string, nombre?: string, autor?: UsuarioSistema | null) => {
  await deleteDoc(doc(db, 'areas', id));
  await registrarEventoAuditoria(
    'ELIMINACION',
    'estructura',
    `Eliminada área organizacional: ${nombre || id}`,
    autor,
    id
  );
};

export const guardarProcesoFB = async (proceso: ProcesoOrganizacion, autor?: UsuarioSistema | null) => {
  const docRef = doc(db, 'procesos', proceso.id);
  const data = limpiarParaFirestore(proceso);
  await setDoc(docRef, data, { merge: true });
  await registrarEventoAuditoria(
    'ACTUALIZACION',
    'estructura',
    `Guardado proceso organizacional: ${proceso.nombre} (${proceso.codigo || proceso.id})`,
    autor,
    proceso.id
  );
};

export const eliminarProcesoFB = async (id: string, nombre?: string, autor?: UsuarioSistema | null) => {
  await deleteDoc(doc(db, 'procesos', id));
  await registrarEventoAuditoria(
    'ELIMINACION',
    'estructura',
    `Eliminado proceso organizacional: ${nombre || id}`,
    autor,
    id
  );
};

export const guardarParametrosNominaFB = async (parametros: ParametrosLegalesNomina, autor?: UsuarioSistema | null) => {
  const docRef = doc(db, 'configuracion_nomina', 'parametros_legales');
  await setDoc(docRef, parametros, { merge: true });
  await registrarEventoAuditoria(
    'ACTUALIZACION',
    'configuracion_nomina',
    `Actualizados parámetros de ley vigentes (${parametros.anoVigencia}): SMMLV $${parametros.smmlv}, Aux. Transporte $${parametros.auxilioTransporte}`,
    autor,
    'parametros_legales'
  );
};

export const obtenerParametrosNominaFB = async (): Promise<ParametrosLegalesNomina | null> => {
  try {
    const docRef = doc(db, 'configuracion_nomina', 'parametros_legales');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as ParametrosLegalesNomina;
    }
    return null;
  } catch (err) {
    console.warn('Error al obtener parámetros de nómina desde Firestore:', err);
    return null;
  }
};

export const guardarEmpresaFB = async (empresa: ConfiguracionEmpresa, autor?: UsuarioSistema | null) => {
  const docRef = doc(db, 'configuracion_empresa', 'principal');
  const data = limpiarParaFirestore(empresa);
  await setDoc(docRef, data, { merge: true });
  await registrarEventoAuditoria(
    'ACTUALIZACION',
    'configuracion_empresa',
    `Actualizados datos institucionales de la empresa: ${empresa.razonSocial} (NIT: ${empresa.nit}-${empresa.digitoVerificacion})`,
    autor,
    'principal'
  );
};

export const obtenerEmpresaFB = async (): Promise<ConfiguracionEmpresa | null> => {
  try {
    const docRef = doc(db, 'configuracion_empresa', 'principal');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as ConfiguracionEmpresa;
    }
    return null;
  } catch (err) {
    console.warn('Error al obtener configuración de empresa desde Firestore:', err);
    return null;
  }
};


export const guardarInventarioEppFB = async (item: ItemInventarioEPP) => {
  const docRef = doc(db, 'inventario_epp', item.id);
  const data = limpiarParaFirestore(item);
  await setDoc(docRef, data, { merge: true });
};

/**
 * Persistencia atómica de inventario de EPPs en lote (writeBatch)
 */
export const guardarInventarioEppLoteFB = async (
  items: ItemInventarioEPP[]
): Promise<void> => {
  if (!items || items.length === 0) return;
  const batch = writeBatch(db);
  items.forEach(item => {
    const docRef = doc(db, 'inventario_epp', item.id);
    batch.set(docRef, limpiarParaFirestore(item), { merge: true });
  });
  await batch.commit();
};

export const guardarSolicitudEppFB = async (solicitud: SolicitudEntregaEPP) => {
  const docRef = doc(db, 'solicitudes_epp', solicitud.id);
  const data = limpiarParaFirestore(solicitud);
  await setDoc(docRef, data, { merge: true });
};

/**
 * Persistencia atómica de solicitudes de entrega de EPPs en lote (writeBatch)
 */
export const guardarSolicitudesEppLoteFB = async (
  solicitudes: SolicitudEntregaEPP[]
): Promise<void> => {
  if (!solicitudes || solicitudes.length === 0) return;
  const batch = writeBatch(db);
  solicitudes.forEach(sol => {
    const docRef = doc(db, 'solicitudes_epp', sol.id);
    batch.set(docRef, limpiarParaFirestore(sol), { merge: true });
  });
  await batch.commit();
};

/**
 * Persistencia atómica de colaboradores en lote (writeBatch)
 */
export const guardarEmpleadosLoteFB = async (
  empleados: Empleado[]
): Promise<void> => {
  if (!empleados || empleados.length === 0) return;
  const batch = writeBatch(db);
  empleados.forEach(emp => {
    const docRef = doc(db, 'empleados', emp.id);
    batch.set(docRef, limpiarParaFirestore(emp), { merge: true });
  });
  await batch.commit();
};

/**
 * Persistencia 100% ATÓMICA de Nómina mediante writeBatch.
 * Guarda el consolidado del período y todos los desprendibles individuales simultáneamente.
 */
export const guardarPeriodoNominaLoteFB = async (
  periodo: PeriodoNomina,
  liquidaciones: LiquidacionEmpleadoNomina[]
): Promise<{ success: boolean; guardadosCount: number; error?: string }> => {
  try {
    const batch = writeBatch(db);
    const codigoPeriodo = periodo.codigoPeriodo;

    // 1. Guardar consolidado del período en /periodos_nomina/{codigoPeriodo}
    const periodoRef = doc(db, 'periodos_nomina', codigoPeriodo);
    batch.set(
      periodoRef,
      {
        ...periodo,
        fechaActualizacion: new Date().toISOString(),
        totalesCalculados: {
          totalDevengado: liquidaciones.reduce((acc, l) => acc + l.devengados.totalDevengado, 0),
          totalDeducciones: liquidaciones.reduce((acc, l) => acc + l.deducciones.totalDeducciones, 0),
          netoAPagar: liquidaciones.reduce((acc, l) => acc + l.netoAPagar, 0),
          costoTotalEmpresa: liquidaciones.reduce((acc, l) => acc + l.costoTotalEmpresa, 0),
          empleadosCount: liquidaciones.length
        }
      },
      { merge: true }
    );

    // 2. Guardar cada recibo individual de nómina en /nominas/{codigoPeriodo}_{empleadoId}
    liquidaciones.forEach(liq => {
      const docId = `${codigoPeriodo}_${liq.empleadoId}`;
      const nominaRef = doc(db, 'nominas', docId);
      batch.set(
        nominaRef,
        {
          ...liq,
          id: docId,
          codigoPeriodo,
          fechaLiquidacion: new Date().toISOString()
        },
        { merge: true }
      );
    });

    await batch.commit();
    await registrarEventoAuditoria(
      'CIERRE_PERIODO',
      'nominas',
      `Liquidado y guardado período ${codigoPeriodo} con ${liquidaciones.length} desprendibles individuales (Neto: $${liquidaciones.reduce((acc, l) => acc + l.netoAPagar, 0).toLocaleString('es-CO')})`,
      null,
      codigoPeriodo
    );
    return { success: true, guardadosCount: liquidaciones.length };
  } catch (err: any) {
    console.error('Fallo en transacción atómica de nómina writeBatch:', err);
    return {
      success: false,
      guardadosCount: 0,
      error: err?.message || 'Error al persistir lote atómico en Firestore'
    };
  }
};

export const guardarSolicitudGeneralFB = async (solicitud: Solicitud) => {
  const docRef = doc(db, 'solicitudes', solicitud.id);
  const data = limpiarParaFirestore(solicitud);
  await setDoc(docRef, data, { merge: true });
};

export const guardarEvaluacionFB = async (evaluacion: EvaluacionDesempeno) => {
  const docRef = doc(db, 'evaluaciones', evaluacion.id);
  const data = limpiarParaFirestore(evaluacion);
  await setDoc(docRef, data, { merge: true });
};

export const eliminarEvaluacionFB = async (id: string) => {
  await deleteDoc(doc(db, 'evaluaciones', id));
};

export const guardarUsuarioFB = async (usuario: UsuarioSistema) => {
  const docRef = doc(db, 'usuarios', usuario.id);
  // CRÍTICO PARA SEGURIDAD: NUNCA persistir contraseñas en texto plano en la base de datos Firestore
  const { password, ...usuarioSinPassword } = usuario;
  const data = limpiarParaFirestore(usuarioSinPassword);
  await setDoc(docRef, data, { merge: true });
};

export const eliminarUsuarioFB = async (usuarioId: string) => {
  await deleteDoc(doc(db, 'usuarios', usuarioId));
};

// Registrar cuenta de usuario en Firebase Authentication de manera aislada (sin cerrar sesión del administrador)
export const registrarUsuarioEnAuth = async (
  email: string,
  pass: string,
  nombre?: string
): Promise<{ success: boolean; uid?: string; code?: string; message?: string }> => {
  const emailLimpio = email.trim().toLowerCase();
  const tempAppName = `auth-worker-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  try {
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    const cred = await createUserWithEmailAndPassword(tempAuth, emailLimpio, pass);
    if (nombre && cred.user) {
      await updateProfile(cred.user, { displayName: nombre });
    }
    const uid = cred.user.uid;
    try {
      await deleteApp(tempApp);
    } catch {
      // Ignorar error al limpiar app temporal
    }
    return { success: true, uid };
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      return {
        success: true,
        code: 'auth/email-already-in-use',
        message: 'La cuenta ya existía en Firebase Auth. Se procederá a enviar el enlace de activación.'
      };
    }
    console.warn('Registro en Firebase Auth secundario:', err?.code, err?.message);
    return { success: false, code: err?.code, message: err?.message };
  }
};

export const enviarNotificacionCorreoNuevoUsuario = async (
  email: string,
  nombre: string,
  rol: string,
  passwordTemporal?: string
): Promise<{
  success: boolean;
  message: string;
  method: 'firebase_auth' | 'sistema_corporativo' | 'error_auth';
  errorDetalle?: string;
}> => {
  const emailLimpio = email.trim().toLowerCase();
  if (!emailLimpio || !emailLimpio.includes('@')) {
    return {
      success: false,
      message: `El correo "${email}" no tiene un formato válido.`,
      method: 'error_auth',
      errorDetalle: 'Formato inválido'
    };
  }

  const passAUsar = passwordTemporal?.trim() || 'BGroup2026*';

  // 1. Garantizar que el usuario exista primero en Firebase Authentication
  await registrarUsuarioEnAuth(emailLimpio, passAUsar, nombre);

  // 2. Despachar correo oficial de restablecimiento/activación vía Firebase Auth
  try {
    await sendPasswordResetEmail(auth, emailLimpio);
    return {
      success: true,
      message: `Enlace oficial de activación y restablecimiento de contraseña enviado a ${emailLimpio} a través de Firebase Authentication. Recuerde verificar la carpeta de Spam / Correo no deseado.`,
      method: 'firebase_auth'
    };
  } catch (err: any) {
    console.warn('Error al enviar correo vía Firebase Auth:', err?.code, err?.message);
    return {
      success: false,
      message: `Firebase no pudo despachar el correo automático (${err?.code || err?.message || 'Error'}). Utilice los accesos directos de Gmail Web, Outlook o Copiar Mensaje para entregar las credenciales al colaborador.`,
      method: 'error_auth',
      errorDetalle: err?.code || err?.message
    };
  }
};

// 5. Herramienta de Limpieza y Restablecimiento para Producción Institucional
export const esAmbienteLimpio = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('bgroup_datos_limpios') === 'true';
};

export const limpiarDatosDePruebaEnNube = async () => {
  const batch = writeBatch(db);

  // 1. Restablecer solicitudes
  try {
    const solSnapshot = await getDocs(collection(db, 'solicitudes'));
    solSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
  } catch (e) {
    console.warn('Error al vaciar solicitudes:', e);
  }

  // 2. Restablecer solicitudes de EPP
  try {
    const solEppSnapshot = await getDocs(collection(db, 'solicitudes_epp'));
    solEppSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
  } catch (e) {
    console.warn('Error al vaciar solicitudes_epp:', e);
  }

  // 3. Restablecer evaluaciones
  try {
    const evalSnapshot = await getDocs(collection(db, 'evaluaciones'));
    evalSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
  } catch (e) {
    console.warn('Error al vaciar evaluaciones:', e);
  }

  // 4. Restablecer registros de colaboradores
  try {
    const empSnapshot = await getDocs(collection(db, 'empleados'));
    empSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
  } catch (e) {
    console.warn('Error al vaciar empleados:', e);
  }

  // 5. Restablecer usuarios temporales en Firestore
  try {
    const usrSnapshot = await getDocs(collection(db, 'usuarios'));
    usrSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.email?.endsWith('@empresa.com') || data.email?.endsWith('@consultoria-sst.co') || (data.id?.startsWith('usr-') && data.id !== 'usr-admin-principal')) {
        batch.delete(docSnap.ref);
      }
    });
  } catch (e) {
    console.warn('Error al vaciar usuarios temporales:', e);
  }

  // 6. Limpiar vacaciones si existen en Firestore
  try {
    const vacSnapshot = await getDocs(collection(db, 'vacaciones'));
    vacSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
  } catch (e) {
    // collection might not exist
  }

  // 8. Limpiar registros de capacitaciones si existen en Firestore
  try {
    const capSnapshot = await getDocs(collection(db, 'capacitaciones'));
    capSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      // Resetear participantes y evaluaciones de prueba manteniendo la ficha de capacitación
      batch.update(docSnap.ref, { participantes: [] });
    });
  } catch (e) {
    console.warn('Error al limpiar participantes de capacitaciones:', e);
  }

  // 9. Registrar marca permanente de base de datos de producción limpia
  const configRef = doc(db, 'configuracion_empresa', 'general');
  batch.set(configRef, {
    ambiente: 'PRODUCCIÓN',
    datosLimpios: true,
    fechaLimpieza: new Date().toISOString(),
    empresa: 'B GROUP INGENIERIA S.A.S.',
    nit: '900.995.99-2'
  }, { merge: true });

  await batch.commit();

  // 10. Purgar llaves locales del navegador para sincronización inmediata
  if (typeof window !== 'undefined') {
    localStorage.setItem('bgroup_datos_limpios', 'true');
    localStorage.setItem('bgroup_capacitaciones_limpias', 'true');
    localStorage.setItem('bgroup_estructura_limpia', 'true');
    localStorage.removeItem('bgroup_vacaciones_controles');
    localStorage.removeItem('bgroup_vacaciones_solicitudes');
    localStorage.removeItem('bgroup_votaciones');
    localStorage.removeItem('bgroup_novedades_nomina');
  }
};

// Limpieza modular y dedicada para la base de datos de EPPs (inventario y actas)
export const limpiarBaseEppFB = async () => {
  const batch = writeBatch(db);

  // 1. Eliminar todas las solicitudes y actas de entrega de EPP
  try {
    const solEppSnapshot = await getDocs(collection(db, 'solicitudes_epp'));
    solEppSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
  } catch (e) {
    console.warn('Error al vaciar solicitudes_epp:', e);
  }

  // 2. Colocar todas las existencias de inventario en 0
  try {
    const invSnapshot = await getDocs(collection(db, 'inventario_epp'));
    invSnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { stockActual: 0 });
    });
  } catch (e) {
    console.warn('Error al resetear stockActual de inventario_epp:', e);
  }

  await batch.commit();
  if (typeof window !== 'undefined') {
    localStorage.setItem('bgroup_epp_limpio', 'true');
  }
};

// Limpieza modular y dedicada para la base de datos de Capacitaciones
export const limpiarCapacitacionesFB = async () => {
  const batch = writeBatch(db);

  try {
    const capSnapshot = await getDocs(collection(db, 'capacitaciones'));
    capSnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { participantes: [] });
    });
    await batch.commit();
  } catch (e) {
    console.warn('Error al resetear participantes de capacitaciones en Firebase:', e);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('bgroup_capacitaciones_limpias', 'true');
  }
};

// Limpieza modular y dedicada para la Estructura Orgánica, Áreas, Procesos y Cargos
export const limpiarEstructuraOrganicaFB = async (cargosBaseIds: string[] = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']) => {
  const batch = writeBatch(db);

  try {
    // 1. Depuración de Cargos
    const cargosSnapshot = await getDocs(collection(db, 'cargos'));
    cargosSnapshot.forEach(docSnap => {
      if (!cargosBaseIds.includes(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // 2. Depuración de Áreas huérfanas o fantasmas
    const baseAreaIds = initialAreas.map(a => a.id);
    const areasSnapshot = await getDocs(collection(db, 'areas'));
    areasSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      // Si el área no tiene nombre válido o es fantasma
      if (!data?.nombre || !baseAreaIds.includes(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // Restaurar/sincronizar áreas corporativas estándar
    for (const area of initialAreas) {
      batch.set(doc(db, 'areas', area.id), limpiarParaFirestore(area), { merge: true });
    }

    // 3. Depuración de Procesos huérfanos o fantasmas
    const baseProcIds = initialProcesos.map(p => p.id);
    const procesosSnapshot = await getDocs(collection(db, 'procesos'));
    procesosSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data?.nombre || !baseProcIds.includes(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // Restaurar/sincronizar procesos corporativos estándar
    for (const proc of initialProcesos) {
      batch.set(doc(db, 'procesos', proc.id), limpiarParaFirestore(proc), { merge: true });
    }

    await batch.commit();
  } catch (e) {
    console.warn('Error al depurar estructura orgánica en Firebase:', e);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('bgroup_estructura_limpia', 'true');
    localStorage.setItem('bgroup_areas', JSON.stringify(initialAreas));
    localStorage.setItem('bgroup_procesos', JSON.stringify(initialProcesos));
  }
};

// Catálogo base de EPP reglamentario colombiano (con stock en 0 para producción real)
export const cargarCatalogoBaseEppEnNube = async () => {
  const batch = writeBatch(db);
  const catalogoEppBase: ItemInventarioEPP[] = [
    {
      id: 'epp-casco-01',
      codigo: 'EPP-CAB-01',
      nombre: 'Casco de Seguridad Tipo I Clase E dieléctrico con barbuquejo de 3 puntos',
      categoria: 'Protección Cabeza',
      normaTecnica: 'ANSI/ISEA Z89.1 / NTC 1523',
      stockActual: 0,
      stockMinimo: 5,
      unidad: 'Unidad',
      vidaUtilDias: 720,
      precioUnitarioEstimadoCOP: 38500,
      descripcion: 'Casco de protección contra impactos de objetos en caída y choques eléctricos.',
      ubicacionAlmacen: 'Estante 1 - Bahía A',
      tallasDisponibles: ['Única']
    },
    {
      id: 'epp-gafas-01',
      codigo: 'EPP-VIS-01',
      nombre: 'Gafas de Seguridad Lente Claro con protección UV y antirrayaduras',
      categoria: 'Protección Visual y Facial',
      normaTecnica: 'ANSI Z87.1 / NTC 1825',
      stockActual: 0,
      stockMinimo: 10,
      unidad: 'Unidad',
      vidaUtilDias: 180,
      precioUnitarioEstimadoCOP: 14200,
      descripcion: 'Protección ocular contra partículas de alta velocidad y radiación solar UV.',
      ubicacionAlmacen: 'Estante 2 - Bahía A',
      tallasDisponibles: ['Estándar']
    },
    {
      id: 'epp-guantes-01',
      codigo: 'EPP-MAN-01',
      nombre: 'Guantes de Nitrilo y Poliuretano para manipulación y agarre fino',
      categoria: 'Protección Manos',
      normaTecnica: 'EN 388 / NTC 2190',
      stockActual: 0,
      stockMinimo: 15,
      unidad: 'Par',
      vidaUtilDias: 90,
      precioUnitarioEstimadoCOP: 12500,
      descripcion: 'Guante ergonómico de alta precisión táctil y resistencia a la abrasión.',
      ubicacionAlmacen: 'Estante 3 - Bahía B',
      tallasDisponibles: ['S', 'M', 'L']
    },
    {
      id: 'epp-botas-01',
      codigo: 'EPP-PIE-01',
      nombre: 'Botas de Seguridad en cuero con puntera composite no metálica dieléctrica',
      categoria: 'Protección Pies',
      normaTecnica: 'ASTM F2413 / NTC ISO 20345',
      stockActual: 0,
      stockMinimo: 6,
      unidad: 'Par',
      vidaUtilDias: 240,
      precioUnitarioEstimadoCOP: 145000,
      descripcion: 'Calzado ergonómico de seguridad industrial con suela antideslizante bidensidad.',
      ubicacionAlmacen: 'Estante 4 - Bahía C',
      tallasDisponibles: ['37', '38', '39', '40', '41', '42', '43']
    },
    {
      id: 'epp-auditivo-01',
      codigo: 'EPP-AUD-01',
      nombre: 'Protectores Auditivos de Inserción tipo tapón en silicona lavable NRR 27dB',
      categoria: 'Protección Auditiva',
      normaTecnica: 'ANSI S3.19 / NTC 2272',
      stockActual: 0,
      stockMinimo: 20,
      unidad: 'Par',
      vidaUtilDias: 90,
      precioUnitarioEstimadoCOP: 4800,
      descripcion: 'Protector auditivo reutilizable con cordón y estuche individual.',
      ubicacionAlmacen: 'Estante 2 - Bahía B',
      tallasDisponibles: ['Universal']
    },
    {
      id: 'epp-resp-01',
      codigo: 'EPP-RES-01',
      nombre: 'Respirador N95 para material particulado con válvula de exhalación',
      categoria: 'Protección Respiratoria',
      normaTecnica: 'NIOSH 42 CFR 84 / NTC 2561',
      stockActual: 0,
      stockMinimo: 25,
      unidad: 'Unidad',
      vidaUtilDias: 30,
      precioUnitarioEstimadoCOP: 6500,
      descripcion: 'Mascarilla libre de mantenimiento para filtrado eficiente de polvos y aerosoles.',
      ubicacionAlmacen: 'Estante 1 - Bahía B',
      tallasDisponibles: ['Estándar']
    }
  ];

  for (const item of catalogoEppBase) {
    batch.set(doc(db, 'inventario_epp', item.id), item, { merge: true });
  }

  await batch.commit();
};

export const guardarAnuncioFB = async (anuncio: AnuncioSlide): Promise<void> => {
  const path = 'anuncios_slides';
  try {
    const docRef = doc(db, path, anuncio.id);
    await setDoc(docRef, anuncio, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${anuncio.id}`);
  }
};

export const eliminarAnuncioFB = async (anuncioId: string): Promise<void> => {
  const path = 'anuncios_slides';
  try {
    const docRef = doc(db, path, anuncioId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${anuncioId}`);
  }
};

export const obtenerAnunciosFB = async (): Promise<AnuncioSlide[]> => {
  const path = 'anuncios_slides';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ ...(d.data() as AnuncioSlide), id: d.id }));
  } catch (error) {
    console.warn('Error fetching anuncios from Firestore, using local fallback:', error);
    return [];
  }
};

export const guardarDocumentoMuroFB = async (documento: DocumentoMuroPDF): Promise<void> => {
  const path = 'documentos_muro';
  try {
    const docRef = doc(db, path, documento.id);
    await setDoc(docRef, documento, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${documento.id}`);
  }
};

export const eliminarDocumentoMuroFB = async (documentoId: string): Promise<void> => {
  const path = 'documentos_muro';
  try {
    const docRef = doc(db, path, documentoId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${documentoId}`);
  }
};

export const obtenerDocumentosMuroFB = async (): Promise<DocumentoMuroPDF[]> => {
  const path = 'documentos_muro';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ ...(d.data() as DocumentoMuroPDF), id: d.id }));
  } catch (error) {
    console.warn('Error fetching documentos muro from Firestore, using local fallback:', error);
    return [];
  }
};

export const guardarCapacitacionFB = async (capacitacion: Capacitacion): Promise<void> => {
  const path = 'capacitaciones';
  try {
    const docRef = doc(db, path, capacitacion.id);
    await setDoc(docRef, capacitacion, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${capacitacion.id}`);
  }
};

export const guardarCapacitacionesLoteFB = async (capacitaciones: Capacitacion[]): Promise<void> => {
  if (!capacitaciones || capacitaciones.length === 0) return;
  const batch = writeBatch(db);
  capacitaciones.forEach(cap => {
    const docRef = doc(db, 'capacitaciones', cap.id);
    batch.set(docRef, cap, { merge: true });
  });
  await batch.commit();
};

export const obtenerCapacitacionesFB = async (): Promise<Capacitacion[]> => {
  const path = 'capacitaciones';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ ...(d.data() as Capacitacion), id: d.id }));
  } catch (error) {
    console.warn('Error fetching capacitaciones from Firestore, using local fallback:', error);
    return [];
  }
};

export const eliminarCapacitacionFB = async (capId: string): Promise<void> => {
  const path = 'capacitaciones';
  try {
    const docRef = doc(db, path, capId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${capId}`);
  }
};

/**
 * Operaciones para Saldos Iniciales de Nómina y Empleados (Corte Contable / Migración)
 */
export const guardarSaldosInicialesLoteFB = async (
  saldos: SaldoInicialEmpleadoNomina[]
): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!saldos || saldos.length === 0) return { success: true, count: 0 };
  const path = 'saldos_iniciales';
  try {
    const batch = writeBatch(db);
    saldos.forEach(saldo => {
      const docRef = doc(db, path, saldo.id);
      batch.set(docRef, limpiarParaFirestore(saldo), { merge: true });
    });
    await batch.commit();

    // Auditoría inmutable de la carga masiva
    await registrarEventoAuditoria(
      'CARGA_MASIVA_SALDOS',
      'saldos_iniciales',
      `Carga e integración masiva de saldos iniciales para ${saldos.length} colaborador(es).`,
      null,
      `lote-${Date.now()}`,
      { cantidad: saldos.length }
    );

    return { success: true, count: saldos.length };
  } catch (error: any) {
    console.error('Error al guardar saldos iniciales en lote:', error);
    return {
      success: false,
      count: 0,
      error: error?.message || 'Error en transacción atómica de saldos iniciales'
    };
  }
};

export const guardarSaldoInicialFB = async (
  saldo: SaldoInicialEmpleadoNomina
): Promise<void> => {
  const path = 'saldos_iniciales';
  try {
    const docRef = doc(db, path, saldo.id);
    await setDoc(docRef, limpiarParaFirestore(saldo), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${saldo.id}`);
  }
};

export const obtenerSaldosInicialesFB = async (): Promise<SaldoInicialEmpleadoNomina[]> => {
  const path = 'saldos_iniciales';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ ...(d.data() as SaldoInicialEmpleadoNomina), id: d.id }));
  } catch (error) {
    console.warn('Error al consultar saldos_iniciales en Firestore, usando fallback local:', error);
    return [];
  }
};

export const eliminarSaldoInicialFB = async (id: string): Promise<void> => {
  const path = 'saldos_iniciales';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
};

export { migrarDocumentosConEmpresaId } from './migracionEmpresa';

