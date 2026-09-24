import {
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, registrarUsuarioEnAuth } from './firebase';
import { UsuarioSistema, Empleado, Solicitud } from '../types';
import { CUENTAS_PRUEBA_OFICIALES } from '../data/usuariosYVotacionesData';
export { CUENTAS_PRUEBA_OFICIALES };

export interface ResultadoMigracion {
  documentosActualizados: number;
  coleccionesProcesadas: string[];
  usuariosCreados: string[];
  detalles: string[];
}

/**
 * Recorre todas las colecciones principales de Firestore y garantiza que todo
 * registro existente contenga el atributo 'empresaId' para soportar el aislamiento multi-tenant.
 */
export async function migrarDocumentosConEmpresaId(
  empresaPorDefecto = 'empresa-a'
): Promise<ResultadoMigracion> {
  const colecciones = [
    'usuarios',
    'empleados',
    'cargos',
    'areas',
    'procesos',
    'inventario_epp',
    'solicitudes_epp',
    'solicitudes',
    'evaluaciones',
    'nominas',
    'capacitaciones',
    'vacaciones',
    'votaciones_sst'
  ];

  let totalActualizados = 0;
  const coleccionesOk: string[] = [];
  const detalles: string[] = [];

  for (const nombreColeccion of colecciones) {
    try {
      const snap = await getDocs(collection(db, nombreColeccion));
      if (snap.empty) {
        coleccionesOk.push(nombreColeccion);
        continue;
      }

      const batch = writeBatch(db);
      let updatesInBatch = 0;

      snap.forEach((d) => {
        const data = d.data();
        if (!data.empresaId) {
          batch.update(d.ref, { empresaId: empresaPorDefecto });
          updatesInBatch++;
          totalActualizados++;
        }
      });

      if (updatesInBatch > 0) {
        await batch.commit();
        detalles.push(`${nombreColeccion}: ${updatesInBatch} docs actualizados con empresaId="${empresaPorDefecto}"`);
      }
      coleccionesOk.push(nombreColeccion);
    } catch (err: any) {
      detalles.push(`Aviso en ${nombreColeccion}: ${err?.message || err}`);
    }
  }

  // Asegurar empleados de prueba para validar aislamiento multi-tenant
  try {
    const empARef = doc(db, 'empleados', 'empleado-a-001');
    const empASnap = await getDoc(empARef);
    if (!empASnap.exists()) {
      const empAData: Partial<Empleado> = {
        id: 'empleado-a-001',
        empresaId: 'empresa-a',
        nombre: 'Carlos Mendoza',
        documento: '10.000.004',
        email: 'empleado-a@test-cimiento.com',
        telefono: '3001234567',
        cargoId: 'CARGO-001',
        formacion: 'Profesional en Ingeniería',
        experiencia: '4 años',
        salarioBase: 3500000,
        activo: true,
        contrato: {
          tipo: 'Término Indefinido',
          inicio: '2024-01-15',
          fin: '',
          salario: '3500000'
        },
        familia: []
      };
      await setDoc(empARef, empAData, { merge: true });
    }

    const empBRef = doc(db, 'empleados', 'empleado-b-001');
    const empBSnap = await getDoc(empBRef);
    if (!empBSnap.exists()) {
      const empBData: Partial<Empleado> = {
        id: 'empleado-b-001',
        empresaId: 'empresa-b',
        nombre: 'Laura Restrepo',
        documento: '20.000.001',
        email: 'empleado-b@test-cimiento.com',
        telefono: '3109876543',
        cargoId: 'CARGO-002',
        formacion: 'Especialista en Logística',
        experiencia: '6 años',
        salarioBase: 4200000,
        activo: true,
        contrato: {
          tipo: 'Término Indefinido',
          inicio: '2023-08-01',
          fin: '',
          salario: '4200000'
        },
        familia: []
      };
      await setDoc(empBRef, empBData, { merge: true });
    }

    // Crear solicitud de prueba para empleado A
    const solARef = doc(db, 'solicitudes', 'SOL-TEST-A-001');
    const solASnap = await getDoc(solARef);
    if (!solASnap.exists()) {
      const solA: Solicitud = {
        id: 'SOL-TEST-A-001',
        empresaId: 'empresa-a',
        empleadoId: 'empleado-a-001',
        tipo: 'Permiso',
        inicio: '2026-09-25',
        fin: '2026-09-25',
        motivo: 'Cita médica especialista',
        estado: 'Pendiente',
        decisorId: null,
        fechaDecision: null,
        comentario: 'Solicitud institucional empresa A'
      };
      await setDoc(solARef, solA);
    }
  } catch (err: any) {
    detalles.push(`Aviso al sembrar empleados/solicitudes de prueba: ${err?.message}`);
  }

  // Aprovisionar los 5 usuarios de prueba oficiales en Firebase Auth y Firestore
  const usuariosCreados: string[] = [];
  for (const c of CUENTAS_PRUEBA_OFICIALES) {
    try {
      const authRes = await registrarUsuarioEnAuth(c.email, c.pass, c.nombre);
      const uid = authRes.uid || `uid-mock-${c.email.split('@')[0]}`;

      const userProfile: Record<string, any> = {
        id: uid,
        nombre: c.nombre,
        email: c.email,
        documento: c.documento,
        rol: c.rol,
        empresaId: c.empresaId,
        estado: 'activo',
        ultimoAcceso: new Date().toISOString(),
        fechaCreacion: new Date().toISOString(),
        dobleFactorHabilitado: false,
        permisos: c.permisos
      };
      if ((c as any).empleadoId) {
        userProfile.empleadoId = (c as any).empleadoId;
      }

      await setDoc(doc(db, 'usuarios', uid), userProfile as UsuarioSistema, { merge: true });
      usuariosCreados.push(c.email);
    } catch (err: any) {
      detalles.push(`Usuario ${c.email}: ${err?.message}`);
    }
  }

  return {
    documentosActualizados: totalActualizados,
    coleccionesProcesadas: coleccionesOk,
    usuariosCreados,
    detalles
  };
}
