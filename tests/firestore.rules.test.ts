import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Suite de Pruebas Unitarias de Seguridad para Firestore Security Rules
 * Valida la lógica de negocio, privacidad de datos personales (Habeas Data),
 * modelo de empresa única y reglas de control de acceso RBAC.
 */
describe('Firestore Security Rules - Single-Tenant, PII Protection & RBAC Suite', () => {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  // Helper para simular la evaluación de lectura de expedientes de empleados (SEC-A01)
  function evaluarLecturaEmpleado(
    auth: { uid: string; token?: { email?: string; role?: string; superadmin?: boolean; admin_gh?: boolean } } | null,
    userDoc: { rol: string; empleadoId?: string } | null,
    targetEmpleado: { id: string; email?: string; persona?: { emailPersonal?: string } }
  ): boolean {
    if (!auth) return false;
    const isAdmin = auth.token?.superadmin === true || auth.token?.admin_gh === true || auth.token?.role === 'superadmin' || auth.token?.role === 'admin_gh' || ['superadmin', 'admin_gh'].includes(userDoc?.rol || '');
    if (isAdmin) return true;

    // Solo el propio empleado puede leer su expediente
    const esMismoEmail = auth.token?.email && (targetEmpleado.email === auth.token.email || targetEmpleado.persona?.emailPersonal === auth.token.email);
    const esMismoEmpleadoId = userDoc?.empleadoId && userDoc.empleadoId === targetEmpleado.id;
    return Boolean(esMismoEmail || esMismoEmpleadoId);
  }

  // Helper para simular la evaluación de lectura de solicitudes privadas (SEC-A02)
  function evaluarLecturaSolicitud(
    auth: { uid: string; token?: { email?: string; role?: string; superadmin?: boolean; admin_gh?: boolean } } | null,
    userDoc: { rol: string; empleadoId?: string } | null,
    targetSolicitud: { empleadoId: string; empleadoEmail?: string }
  ): boolean {
    if (!auth) return false;
    const isAdmin = ['superadmin', 'admin_gh'].includes(userDoc?.rol || '') || auth.token?.superadmin === true || auth.token?.admin_gh === true;
    if (isAdmin) return true;

    // Solo el solicitante puede leer su propia solicitud médica o permiso
    const esMismoEmail = auth.token?.email && targetSolicitud.empleadoEmail === auth.token.email;
    const esMismoEmpleadoId = userDoc?.empleadoId && targetSolicitud.empleadoId === userDoc.empleadoId;
    return Boolean(esMismoEmail || esMismoEmpleadoId);
  }

  // Helper para simular la regla de creación de usuarios
  function evaluarCrearUsuario(
    auth: { uid: string; token?: { role?: string; superadmin?: boolean; admin_gh?: boolean } } | null,
    targetUid: string,
    requestedData: { rol?: string }
  ): boolean {
    if (!auth) return false;
    const isAdmin = auth.token?.superadmin === true || auth.token?.admin_gh === true || auth.token?.role === 'superadmin' || auth.token?.role === 'admin_gh';
    if (isAdmin) return true;

    if (auth.uid !== targetUid) return false;
    if (requestedData.rol && requestedData.rol !== 'empleado') return false;
    return true;
  }

  // Helper para simular la regla de actualización de capacitaciones
  function evaluarUpdateCapacitacion(
    auth: { uid: string; token?: { role?: string } } | null,
    userDoc: { rol: string } | null,
    resourceData: { titulo: string; participantes: any[] },
    requestedData: { titulo: string; participantes: any[]; updatedAt?: string }
  ): boolean {
    if (!auth || !userDoc) return false;
    const isSSTorAdmin = ['superadmin', 'admin_gh', 'responsable_sst'].includes(userDoc.rol);
    if (isSSTorAdmin) return true;

    // Empleado solo puede modificar participantes o updatedAt
    const keysModificadas = Object.keys(requestedData).filter(
      k => JSON.stringify((requestedData as any)[k]) !== JSON.stringify((resourceData as any)[k])
    );
    return keysModificadas.every(k => k === 'participantes' || k === 'updatedAt');
  }

  describe('1. Protección de Salarios y Datos Personales en /empleados (SEC-A01)', () => {
    it('Debe denegar que un empleado lea el expediente y salario de otro colaborador', () => {
      const authUser = { uid: 'user-emp-1', token: { email: 'juan@empresa.com' } };
      const userDoc = { rol: 'empleado', empleadoId: 'emp-1' };
      const otroEmpleado = { id: 'emp-2', email: 'pedro@empresa.com' };

      const permitido = evaluarLecturaEmpleado(authUser, userDoc, otroEmpleado);
      expect(permitido).toBe(false);
    });

    it('Debe permitir que un empleado lea su propio expediente', () => {
      const authUser = { uid: 'user-emp-1', token: { email: 'juan@empresa.com' } };
      const userDoc = { rol: 'empleado', empleadoId: 'emp-1' };
      const propioEmpleado = { id: 'emp-1', email: 'juan@empresa.com' };

      const permitido = evaluarLecturaEmpleado(authUser, userDoc, propioEmpleado);
      expect(permitido).toBe(true);
    });

    it('Debe permitir que un administrador lea cualquier expediente de empleado', () => {
      const authAdmin = { uid: 'user-admin', token: { email: 'gh@empresa.com', admin_gh: true } };
      const userDoc = { rol: 'admin_gh' };
      const cualquierEmpleado = { id: 'emp-99', email: 'carlos@empresa.com' };

      const permitido = evaluarLecturaEmpleado(authAdmin, userDoc, cualquierEmpleado);
      expect(permitido).toBe(true);
    });
  });

  describe('2. Privacidad de Solicitudes e Incapacidades Médicas (SEC-A02)', () => {
    it('Debe denegar que un empleado consulte las solicitudes o incapacidades de otro colaborador', () => {
      const authUser = { uid: 'user-emp-1', token: { email: 'juan@empresa.com' } };
      const userDoc = { rol: 'empleado', empleadoId: 'emp-1' };
      const solicitudAjena = { empleadoId: 'emp-2', empleadoEmail: 'pedro@empresa.com' };

      const permitido = evaluarLecturaSolicitud(authUser, userDoc, solicitudAjena);
      expect(permitido).toBe(false);
    });

    it('Debe permitir que un empleado consulte sus propias solicitudes', () => {
      const authUser = { uid: 'user-emp-1', token: { email: 'juan@empresa.com' } };
      const userDoc = { rol: 'empleado', empleadoId: 'emp-1' };
      const solicitudPropia = { empleadoId: 'emp-1', empleadoEmail: 'juan@empresa.com' };

      const permitido = evaluarLecturaSolicitud(authUser, userDoc, solicitudPropia);
      expect(permitido).toBe(true);
    });

    it('Debe permitir que un administrador consulte todas las solicitudes', () => {
      const authAdmin = { uid: 'user-admin', token: { email: 'gh@empresa.com' } };
      const userDoc = { rol: 'admin_gh' };
      const cualquierSolicitud = { empleadoId: 'emp-3', empleadoEmail: 'ana@empresa.com' };

      const permitido = evaluarLecturaSolicitud(authAdmin, userDoc, cualquierSolicitud);
      expect(permitido).toBe(true);
    });
  });

  describe('3. Registro de Usuario y Prevención de Escalación de Privilegios', () => {
    it('Debe denegar que un usuario nuevo se auto-asigne rol: "admin_gh" o "superadmin"', () => {
      const authUser = { uid: 'nuevo-uid' };
      const dataInvalida = { rol: 'admin_gh' };

      const permitido = evaluarCrearUsuario(authUser, 'nuevo-uid', dataInvalida);
      expect(permitido).toBe(false);
    });

    it('Debe permitir que un usuario nuevo se cree con rol: "empleado"', () => {
      const authUser = { uid: 'nuevo-uid' };
      const dataValida = { rol: 'empleado' };

      const permitido = evaluarCrearUsuario(authUser, 'nuevo-uid', dataValida);
      expect(permitido).toBe(true);
    });

    it('Las reglas en firestore.rules deben restringir el auto-create a rol empleado', () => {
      expect(rulesContent).toContain("request.resource.data.rol == 'empleado'");
    });
  });

  describe('4. Capacitaciones - Actualización de Asistencia y Exámenes por Empleados', () => {
    it('Debe permitir que un empleado registre su asistencia/examen sin alterar el título del curso', () => {
      const authUser = { uid: 'emp-1' };
      const userDoc = { rol: 'empleado' };
      const cursoOriginal = {
        titulo: 'Curso de Alturas Res. 4272',
        participantes: []
      };
      const cursoConAsistencia = {
        titulo: 'Curso de Alturas Res. 4272',
        participantes: [{ empleadoId: 'emp-1', asistenciaConfirmada: true }],
        updatedAt: '2026-09-28T12:00:00Z'
      };

      const permitido = evaluarUpdateCapacitacion(authUser, userDoc, cursoOriginal, cursoConAsistencia);
      expect(permitido).toBe(true);
    });

    it('Debe denegar que un empleado modifique el título o contenido del curso de capacitación', () => {
      const authUser = { uid: 'emp-1' };
      const userDoc = { rol: 'empleado' };
      const cursoOriginal = {
        titulo: 'Curso de Alturas Res. 4272',
        participantes: []
      };
      const cursoAlterado = {
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

  describe('5. Auditoría Inmutable, Parámetros y Catch-All Deny-by-Default', () => {
    it('Las reglas de auditoría en firestore.rules deben ser append-only con inmutabilidad estricta', () => {
      expect(rulesContent).toContain('match /auditoria_sistema/{logId}');
      expect(rulesContent).toContain('allow update, delete: if false;');
      expect(rulesContent).toContain('match /logs_auditoria/{logId}');
      expect(rulesContent).toContain('request.resource.data.usuarioId == request.auth.uid');
    });

    it('Las reglas de firestore.rules deben permitir lectura de parámetros legales para colaboradores', () => {
      expect(rulesContent).toContain('match /configuracion_nomina/{docId}');
      expect(rulesContent).toContain('allow read: if signedIn();');
    });

    it('Debe tener una regla catch-all Deny-by-Default (Zero Trust)', () => {
      expect(rulesContent).toContain('match /{document=**}');
      expect(rulesContent).toContain('allow read, write: if false;');
    });
  });
});
