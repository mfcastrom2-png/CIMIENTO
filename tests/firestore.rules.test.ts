import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Suite de Pruebas Unitarias de Seguridad para Firestore Security Rules
 * Valida la lógica de negocio, aislamiento multi-tenant y reglas de control de acceso RBAC.
 */
describe('Firestore Security Rules - Multi-Tenant, RBAC & Anti-Spoofing Suite', () => {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  // Helper para simular la evaluación semántica de la función sameCompany
  function evaluarSameCompany(
    auth: { uid: string; token?: { role?: string; superadmin?: boolean } } | null,
    userDoc: { rol: string; empresaId: string } | null,
    resourceData: { empresaId?: string }
  ): boolean {
    if (!auth) return false;
    if (auth.token?.superadmin === true || auth.token?.role === 'superadmin' || userDoc?.rol === 'superadmin') {
      return true;
    }
    if (!userDoc || !userDoc.empresaId || userDoc.empresaId === '') {
      return false; // Previene vulnerabilidad de coincidencia '' == ''
    }
    if (!resourceData.empresaId || resourceData.empresaId === '') {
      return false;
    }
    return userDoc.empresaId === resourceData.empresaId;
  }

  // Helper para simular la regla de creación de usuarios
  function evaluarCrearUsuario(
    auth: { uid: string; token?: { role?: string; superadmin?: boolean; admin_gh?: boolean } } | null,
    targetUid: string,
    requestedData: { rol?: string; empresaId?: string }
  ): boolean {
    if (!auth) return false;
    const isAdmin = auth.token?.superadmin === true || auth.token?.admin_gh === true || auth.token?.role === 'superadmin' || auth.token?.role === 'admin_gh';
    if (isAdmin) return true;

    if (auth.uid !== targetUid) return false;
    if (requestedData.rol && requestedData.rol !== 'empleado') return false;
    if (requestedData.empresaId && requestedData.empresaId !== '') return false;
    return true;
  }

  // Helper para simular la regla de actualización de capacitaciones
  function evaluarUpdateCapacitacion(
    auth: { uid: string; token?: { role?: string } } | null,
    userDoc: { rol: string; empresaId: string } | null,
    resourceData: { empresaId: string; titulo: string; participantes: any[] },
    requestedData: { empresaId: string; titulo: string; participantes: any[]; updatedAt?: string }
  ): boolean {
    if (!auth || !userDoc) return false;
    const sameCo = evaluarSameCompany(auth, userDoc, resourceData);
    if (!sameCo) return false;

    const isSSTorAdmin = ['superadmin', 'admin_gh', 'responsable_sst'].includes(userDoc.rol);
    if (isSSTorAdmin) return true;

    // Empleado solo puede modificar participantes o updatedAt
    const keysModificadas = Object.keys(requestedData).filter(
      k => JSON.stringify((requestedData as any)[k]) !== JSON.stringify((resourceData as any)[k])
    );
    return keysModificadas.every(k => k === 'participantes' || k === 'updatedAt');
  }

  // Helper para simular la creación de log de auditoría
  function evaluarCrearLogAuditoria(
    auth: { uid: string } | null,
    requestedData: { usuarioId?: string; usuario?: { uid?: string } }
  ): boolean {
    if (!auth) return false;
    const uidCoincide =
      requestedData.usuarioId === auth.uid ||
      requestedData.usuario?.uid === auth.uid;
    return Boolean(uidCoincide);
  }

  describe('1. Aislamiento Multi-Tenant (sameCompany)', () => {
    it('Debe impedir que un empleado de la Empresa B acceda a cargos de la Empresa A', () => {
      const authUser = { uid: 'user-emp-b' };
      const userDoc = { rol: 'empleado', empresaId: 'empresa-b' };
      const cargoEmpresaA = { empresaId: 'empresa-a' };

      const permitido = evaluarSameCompany(authUser, userDoc, cargoEmpresaA);
      expect(permitido).toBe(false);
    });

    it('Debe permitir que un empleado de la Empresa A acceda a cargos de la Empresa A', () => {
      const authUser = { uid: 'user-emp-a' };
      const userDoc = { rol: 'empleado', empresaId: 'empresa-a' };
      const cargoEmpresaA = { empresaId: 'empresa-a' };

      const permitido = evaluarSameCompany(authUser, userDoc, cargoEmpresaA);
      expect(permitido).toBe(true);
    });

    it('Debe prevenir la vulnerabilidad de coincidencia de empresaId vacía ("" == "")', () => {
      const authUser = { uid: 'user-sin-empresa' };
      const userDoc = { rol: 'empleado', empresaId: '' };
      const docHuerfano = { empresaId: '' };

      const permitido = evaluarSameCompany(authUser, userDoc, docHuerfano);
      expect(permitido).toBe(false);
    });

    it('Las reglas en firestore.rules deben validar explícitamente data.empresaId != "" y currentUser().data.empresaId != ""', () => {
      expect(rulesContent).toContain('data.empresaId != null');
      expect(rulesContent).toContain("data.empresaId != ''");
      expect(rulesContent).toContain('currentUser().data.empresaId != null');
      expect(rulesContent).toContain("currentUser().data.empresaId != ''");
    });
  });

  describe('2. Registro de Usuario y Prevención de Escalación de Privilegios', () => {
    it('Debe denegar que un usuario nuevo se auto-asigne rol: "admin_gh" o "superadmin"', () => {
      const authUser = { uid: 'nuevo-uid' };
      const dataInvalida = { rol: 'admin_gh', empresaId: '' };

      const permitido = evaluarCrearUsuario(authUser, 'nuevo-uid', dataInvalida);
      expect(permitido).toBe(false);
    });

    it('Debe denegar que un usuario nuevo se auto-asigne una empresaId fija en auto-registro', () => {
      const authUser = { uid: 'nuevo-uid' };
      const dataInvalida = { rol: 'empleado', empresaId: 'empresa-a' };

      const permitido = evaluarCrearUsuario(authUser, 'nuevo-uid', dataInvalida);
      expect(permitido).toBe(false);
    });

    it('Debe permitir que un usuario nuevo se cree con rol: "empleado" y empresaId vacía', () => {
      const authUser = { uid: 'nuevo-uid' };
      const dataValida = { rol: 'empleado', empresaId: '' };

      const permitido = evaluarCrearUsuario(authUser, 'nuevo-uid', dataValida);
      expect(permitido).toBe(true);
    });

    it('Las reglas en firestore.rules deben restringir el auto-create a rol empleado y empresaId vacía', () => {
      expect(rulesContent).toContain("request.resource.data.rol == 'empleado'");
      expect(rulesContent).toContain("request.resource.data.empresaId == ''");
    });
  });

  describe('3. Capacitaciones - Actualización de Asistencia y Exámenes por Empleados', () => {
    it('Debe permitir que un empleado de la misma empresa registre su asistencia/examen sin tocar el título del curso', () => {
      const authUser = { uid: 'emp-1' };
      const userDoc = { rol: 'empleado', empresaId: 'empresa-a' };
      const cursoOriginal = {
        empresaId: 'empresa-a',
        titulo: 'Curso de Alturas Res. 4272',
        participantes: []
      };
      const cursoConAsistencia = {
        empresaId: 'empresa-a',
        titulo: 'Curso de Alturas Res. 4272',
        participantes: [{ empleadoId: 'emp-1', asistenciaConfirmada: true }],
        updatedAt: '2026-09-28T12:00:00Z'
      };

      const permitido = evaluarUpdateCapacitacion(authUser, userDoc, cursoOriginal, cursoConAsistencia);
      expect(permitido).toBe(true);
    });

    it('Debe denegar que un empleado modifique el título o contenido del curso de capacitación', () => {
      const authUser = { uid: 'emp-1' };
      const userDoc = { rol: 'empleado', empresaId: 'empresa-a' };
      const cursoOriginal = {
        empresaId: 'empresa-a',
        titulo: 'Curso de Alturas Res. 4272',
        participantes: []
      };
      const cursoAlterado = {
        empresaId: 'empresa-a',
        titulo: 'Título Modificado Ilegalmente',
        participantes: [{ empleadoId: 'emp-1', asistenciaConfirmada: true }]
      };

      const permitido = evaluarUpdateCapacitacion(authUser, userDoc, cursoOriginal, cursoAlterado);
      expect(permitido).toBe(false);
    });

    it('Las reglas en firestore.rules deben usar affectedKeys().hasOnly(["participantes", "updatedAt"])', () => {
      expect(rulesContent).toContain("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['participantes', 'updatedAt'])");
    });
  });

  describe('4. Logs de Auditoría y Prevención de Falsificación (Anti-Spoofing)', () => {
    it('Debe permitir que un usuario autenticado inserte un log donde usuarioId coincide con su auth.uid', () => {
      const authUser = { uid: 'mi-uid-real' };
      const logValido = { usuarioId: 'mi-uid-real' };

      const permitido = evaluarCrearLogAuditoria(authUser, logValido);
      expect(permitido).toBe(true);
    });

    it('Debe denegar que un usuario suplante a otro insertando un log con usuarioId de otra persona', () => {
      const authUser = { uid: 'atacante-uid' };
      const logSuplantado = { usuarioId: 'victima-uid' };

      const permitido = evaluarCrearLogAuditoria(authUser, logSuplantado);
      expect(permitido).toBe(false);
    });

    it('Las reglas de auditoria en firestore.rules deben ser append-only con inmutabilidad estricta', () => {
      expect(rulesContent).toContain('match /auditoria_sistema/{logId}');
      expect(rulesContent).toContain('allow update, delete: if false;');
      expect(rulesContent).toContain('match /logs_auditoria/{logId}');
      expect(rulesContent).toContain('request.resource.data.usuarioId == request.auth.uid');
    });
  });

  describe('5. Parámetros de Configuración y Verificación de Correo', () => {
    it('Las reglas de firestore.rules deben restringir configuracion_empresa y configuracion_nomina', () => {
      expect(rulesContent).toContain('match /configuracion_empresa/{docId}');
      expect(rulesContent).toContain('sameCompany(resource.data)');
      expect(rulesContent).toContain('match /configuracion_nomina/{docId}');
      expect(rulesContent).toContain('allow read, write: if isAdmin()');
    });

    it('Las reglas deben incluir isEmailVerified() para acceso condicional por correo', () => {
      expect(rulesContent).toContain('function isEmailVerified()');
      expect(rulesContent).toContain('request.auth.token.email_verified == true');
    });

    it('Debe tener una regla catch-all Deny-by-Default (Zero Trust)', () => {
      expect(rulesContent).toContain('match /{document=**}');
      expect(rulesContent).toContain('allow read, write: if false;');
    });
  });
});
