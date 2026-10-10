import { describe, expect, it } from 'vitest';
import { getVisiblePortalModules } from './portalModules';

describe('getVisiblePortalModules', () => {
  it('muestra módulos de SST para administradores y SST', () => {
    expect(getVisiblePortalModules('admin').sst.length).toBeGreaterThan(0);
    expect(getVisiblePortalModules('superadmin').sst.length).toBeGreaterThan(0);
    expect(getVisiblePortalModules('responsable_sst').sst.length).toBeGreaterThan(0);
  });

  it('oculta módulos de SST para colaboradores', () => {
    expect(getVisiblePortalModules('empleado').sst).toHaveLength(0);
  });

  it('mantiene los módulos base de gestión humana para todos', () => {
    expect(getVisiblePortalModules('empleado').gestionHumana.length).toBeGreaterThan(0);
    expect(getVisiblePortalModules('admin').gestionHumana.length).toBeGreaterThan(0);
  });
});
