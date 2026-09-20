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
  onSnapshot,
  writeBatch,
  getDocFromServer,
  Firestore
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
  RolSistema
} from '../types';

// 1. Inicialización de Firebase con soporte de Long Polling para proxies y contenedores
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 1.1 Configuración de Firebase App Check (reCAPTCHA Enterprise)
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (typeof window !== 'undefined' && recaptchaSiteKey) {
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
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch {
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;

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

// Validación de conectividad (no bloqueante y tolerante a reconexión)
export async function testConnection(): Promise<boolean> {
  try {
    await getDoc(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
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
  rol: RolSistema | string = 'admin_gh',
  documento: string = ''
) => {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  await updateProfile(credential.user, { displayName: nombre });

  // Crear perfil en la colección `usuarios`
  const userProfile: UsuarioSistema = {
    id: credential.user.uid,
    nombre,
    email: email.trim().toLowerCase(),
    documento: documento || '—',
    rol: (rol as any) || 'admin_gh',
    empresaId: 'empresa-a',
    estado: 'activo',
    ultimoAcceso: new Date().toISOString(),
    fechaCreacion: new Date().toISOString(),
    dobleFactorHabilitado: false,
    permisos: ['dashboard', 'empleados', 'cargos', 'estructura', 'evaluaciones', 'solicitudes', 'nomina', 'sst', 'capacitaciones', 'vacaciones', 'usuarios']
  };

  await setDoc(doc(db, 'usuarios', credential.user.uid), userProfile);
  return { user: credential.user, profile: userProfile };
};

export const loginConGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Verificar si existe el perfil en Firestore
  const userDocRef = doc(db, 'usuarios', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Si es el primer usuario, se le asigna rol de Administrador
    const userProfile: UsuarioSistema = {
      id: user.uid,
      nombre: user.displayName || 'Usuario Corporativo',
      email: (user.email || '').toLowerCase(),
      documento: '—',
      rol: 'admin_gh',
      empresaId: 'empresa-a',
      estado: 'activo',
      ultimoAcceso: new Date().toISOString(),
      fechaCreacion: new Date().toISOString(),
      dobleFactorHabilitado: false,
      permisos: ['dashboard', 'empleados', 'cargos', 'estructura', 'evaluaciones', 'solicitudes', 'nomina', 'sst', 'capacitaciones', 'vacaciones', 'usuarios']
    };
    await setDoc(userDocRef, userProfile);
    return { user, profile: userProfile };
  }

  return { user, profile: userDoc.data() as UsuarioSistema };
};

export const cerrarSesion = async () => {
  return await signOut(auth);
};

export const obtenerPerfilUsuario = async (uid: string): Promise<UsuarioSistema | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UsuarioSistema;
    }
    return null;
  } catch (err) {
    console.warn('Error al obtener perfil de usuario:', err);
    return null;
  }
};

// 3. Sincronización en Tiempo Real de Colecciones
export const suscribirColeccion = <T>(
  nombreColeccion: string,
  onData: (data: T[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const colRef = collection(db, nombreColeccion);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ ...(docSnap.data() as T), id: docSnap.id });
        });
        onData(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, nombreColeccion);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, nombreColeccion);
    return () => {};
  }
};

// 4. Operaciones de Escritura y Actualización
export const guardarEmpleadoFB = async (empleado: Empleado) => {
  const docRef = doc(db, 'empleados', empleado.id);
  const data = { ...empleado, empresaId: empleado.empresaId || 'empresa-a' };
  await setDoc(docRef, data, { merge: true });
};

export const eliminarEmpleadoFB = async (id: string) => {
  await deleteDoc(doc(db, 'empleados', id));
};

export const guardarCargoFB = async (cargo: Cargo) => {
  const docRef = doc(db, 'cargos', cargo.id);
  const data = { ...cargo, empresaId: cargo.empresaId || 'empresa-a' };
  await setDoc(docRef, data, { merge: true });
};

export const eliminarCargoFB = async (id: string) => {
  await deleteDoc(doc(db, 'cargos', id));
};

export const guardarAreaFB = async (area: AreaOrganizacion) => {
  const docRef = doc(db, 'areas', area.id);
  const data = { ...area, empresaId: area.empresaId || 'empresa-a' };
  await setDoc(docRef, data, { merge: true });
};

export const eliminarAreaFB = async (id: string) => {
  await deleteDoc(doc(db, 'areas', id));
};

export const guardarProcesoFB = async (proceso: ProcesoOrganizacion) => {
  const docRef = doc(db, 'procesos', proceso.id);
  const data = { ...proceso, empresaId: proceso.empresaId || 'empresa-a' };
  await setDoc(docRef, data, { merge: true });
};

export const eliminarProcesoFB = async (id: string) => {
  await deleteDoc(doc(db, 'procesos', id));
};

export const guardarParametrosNominaFB = async (parametros: ParametrosLegalesNomina) => {
  const docRef = doc(db, 'configuracion_nomina', 'parametros_legales');
  await setDoc(docRef, parametros, { merge: true });
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

export const guardarInventarioEppFB = async (item: ItemInventarioEPP) => {
  const docRef = doc(db, 'inventario_epp', item.id);
  const data = { ...item, empresaId: item.empresaId || 'empresa-a' };
  await setDoc(docRef, data, { merge: true });
};

export const guardarSolicitudEppFB = async (solicitud: SolicitudEntregaEPP) => {
  const docRef = doc(db, 'solicitudes_epp', solicitud.id);
  const data = { ...solicitud, empresaId: solicitud.empresaId || 'empresa-a' };
  await setDoc(docRef, data, { merge: true });
};

export const guardarSolicitudGeneralFB = async (solicitud: Solicitud) => {
  const docRef = doc(db, 'solicitudes', solicitud.id);
  const data = { ...solicitud, empresaId: solicitud.empresaId || 'empresa-a' };
  await setDoc(docRef, data, { merge: true });
};

export const guardarEvaluacionFB = async (evaluacion: EvaluacionDesempeno) => {
  const docRef = doc(db, 'evaluaciones', evaluacion.id);
  const data = { ...evaluacion, empresaId: evaluacion.empresaId || 'empresa-a' };
  await setDoc(docRef, data, { merge: true });
};

export const eliminarEvaluacionFB = async (id: string) => {
  await deleteDoc(doc(db, 'evaluaciones', id));
};

export const guardarUsuarioFB = async (usuario: UsuarioSistema) => {
  const docRef = doc(db, 'usuarios', usuario.id);
  // CRÍTICO PARA SEGURIDAD: NUNCA persistir contraseñas en texto plano en la base de datos Firestore
  const { password, ...usuarioSinPassword } = usuario;
  const data = { ...usuarioSinPassword, empresaId: usuario.empresaId || 'empresa-a' };
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

// Limpieza modular y dedicada para la Estructura Orgánica y Cargos
export const limpiarEstructuraOrganicaFB = async (cargosBaseIds: string[] = ['c1', 'c2', 'c3', 'c4', 'c5']) => {
  const batch = writeBatch(db);

  try {
    const cargosSnapshot = await getDocs(collection(db, 'cargos'));
    cargosSnapshot.forEach(docSnap => {
      // Eliminar cargos adicionales que hayan sido creados como pruebas no corporativas
      if (!cargosBaseIds.includes(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });
    await batch.commit();
  } catch (e) {
    console.warn('Error al depurar cargos en Firebase:', e);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('bgroup_estructura_limpia', 'true');
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

export { migrarDocumentosConEmpresaId, CUENTAS_PRUEBA_OFICIALES } from './migracionEmpresa';

