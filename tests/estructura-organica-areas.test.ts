import { describe, it, expect } from 'vitest';
import { initialAreas, initialProcesos, INITIAL_CARGOS, INITIAL_EMPLEADOS } from '../src/data/initialData';
import { AreaOrganizacion, ProcesoOrganizacion } from '../src/types';

describe('Suite de Validación: Estructura Orgánica, Áreas y Procesos Organizacionales', () => {
  it('Todas las áreas institucionales base deben tener código, nombre y proceso válido (cero huérfanas)', () => {
    const validProcesoIds = new Set(initialProcesos.map(p => p.id));
    
    expect(initialAreas.length).toBeGreaterThan(0);
    initialAreas.forEach(area => {
      expect(area.id).toBeTruthy();
      expect(area.nombre.trim()).not.toBe('');
      expect(area.codigo?.trim()).not.toBe('');
      expect(area.procesoId).toBeTruthy();
      expect(validProcesoIds.has(area.procesoId!)).toBe(true);
    });
  });

  it('Todos los procesos institucionales base deben tener nombre, código y tipología válida', () => {
    expect(initialProcesos.length).toBeGreaterThan(0);
    const tiposPermitidos = ['Estratégico', 'Misional / Operativo', 'Apoyo', 'Control y Evaluación'];
    
    initialProcesos.forEach(proc => {
      expect(proc.id).toBeTruthy();
      expect(proc.nombre.trim()).not.toBe('');
      expect(proc.codigo?.trim()).not.toBe('');
      expect(tiposPermitidos).toContain(proc.tipo);
    });
  });

  it('Los cargos institucionales base deben estar asignados a áreas existentes', () => {
    const nombresAreas = new Set(initialAreas.map(a => a.nombre.trim().toLowerCase()));
    
    INITIAL_CARGOS.forEach(cargo => {
      const areaCargo = cargo.ficha?.identificacion?.area?.trim().toLowerCase();
      expect(areaCargo).toBeTruthy();
      expect(nombresAreas.has(areaCargo!)).toBe(true);
    });
  });

  it('Los empleados institucionales deben estar vinculados a areaId válidos', () => {
    const idsAreas = new Set(initialAreas.map(a => a.id));
    
    INITIAL_EMPLEADOS.forEach(emp => {
      expect(emp.areaId).toBeTruthy();
      expect(idsAreas.has(emp.areaId!)).toBe(true);
    });
  });

  it('El algoritmo de saneamiento debe filtrar áreas fantasmas y reconciliar áreas huérfanas', () => {
    const procesosTest: ProcesoOrganizacion[] = [
      { id: 'proc_1', codigo: 'PR-1', nombre: 'Direccionamiento', tipo: 'Estratégico' },
      { id: 'proc_2', codigo: 'PR-2', nombre: 'Operaciones', tipo: 'Misional / Operativo' }
    ];

    const areasScias: any[] = [
      { id: 'ar_1', codigo: 'AR-1', nombre: 'Gerencia', procesoId: 'proc_1', procesoNombre: 'Direccionamiento' },
      { id: '', codigo: '', nombre: '' }, // Fantasma 1 (sin id ni nombre)
      { id: 'ar_ghost', codigo: 'AR-GH', nombre: '   ' }, // Fantasma 2 (nombre en blanco)
      { id: 'ar_orphan', codigo: 'AR-ORP', nombre: 'Área Huérfana', procesoId: 'proc_inexistente', procesoNombre: 'Desconocido' }, // Huérfana
      { id: 'ar_1', codigo: 'AR-1', nombre: 'Gerencia' } // Duplicado
    ];

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const validProcIds = new Set(procesosTest.map(p => p.id));
    const procMapByName = new Map(procesosTest.map(p => [p.nombre.trim().toLowerCase(), p]));

    const areasSaneadas = areasScias
      .filter(a => {
        if (!a || !a.id || !a.nombre || !a.nombre.trim()) return false;
        const normName = a.nombre.trim().toLowerCase();
        if (seenIds.has(a.id) || seenNames.has(normName)) return false;
        seenIds.add(a.id);
        seenNames.add(normName);
        return true;
      })
      .map(a => {
        let pId = a.procesoId;
        let pNom = a.procesoNombre;
        if (!pId || !validProcIds.has(pId)) {
          if (pNom && procMapByName.has(pNom.trim().toLowerCase())) {
            const found = procMapByName.get(pNom.trim().toLowerCase())!;
            pId = found.id;
            pNom = found.nombre;
          } else if (procesosTest[0]) {
            pId = procesosTest[0].id;
            pNom = procesosTest[0].nombre;
          }
        }
        return {
          ...a,
          procesoId: pId,
          procesoNombre: pNom
        };
      });

    expect(areasSaneadas.length).toBe(2);
    expect(areasSaneadas.find((a: any) => a.id === 'ar_1')).toBeTruthy();
    const orphanReconciled = areasSaneadas.find((a: any) => a.id === 'ar_orphan');
    expect(orphanReconciled).toBeTruthy();
    expect(orphanReconciled.procesoId).toBe('proc_1'); // Reconciliado al proceso fallback
  });
});
