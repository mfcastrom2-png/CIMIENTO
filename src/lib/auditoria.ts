import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { LogAuditoriaUsuario, UsuarioSistema } from '../types';

export const registrarLogAuditoria = async (
  accion: string,
  modulo: string,
  tipo: 'SEGURIDAD' | 'INFO' | 'MODIFICACION' = 'INFO',
  usuarioActual?: UsuarioSistema | null,
  detallesExtra?: Record<string, any>
): Promise<void> => {
  try {
    const usuarioId = usuarioActual?.id || auth.currentUser?.uid || 'anonimo';
    const usuarioNombre = usuarioActual?.nombre || auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario';

    const nuevoLog: Partial<LogAuditoriaUsuario> & {
      tipo: string;
      detalles?: any;
      userAgent?: string;
    } = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      usuarioId,
      usuarioNombre,
      accion,
      modulo,
      tipo,
      fechaHora: new Date().toISOString(),
      ip: 'Cliente Web Seguro',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      ...(detallesExtra ? { detalles: detallesExtra } : {})
    };

    await addDoc(collection(db, 'logs_auditoria'), nuevoLog);
  } catch (err) {
    // Los logs no deben romper el flujo del usuario si hay intermitencia de red
    console.warn('Auditoría: no se pudo persistir el evento en Firestore:', err);
  }
};
