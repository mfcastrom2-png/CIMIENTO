import { describe, expect, it } from 'vitest';
import { getVisiblePortalModules, MODULOS_GESTION_HUMANA } from './portalModules';

describe('getVisiblePortalModules', () => {
  it('muestra módulos básicos para empleados', () => {
    const result = getVisiblePortalModules('empleado', []);
    expect(result.gestionHumana.length).toBeGreaterThan(0);
  });

  it('muestra módulos de SST para responsable_sst', () => {
    const result = getVisiblePortalModules('responsable_sst', []);
    expect(result.sst.length).toBeGreaterThan(0);
  });

  it('muestra todos los módulos administrativos para admin_gh', () => {
    const result = getVisiblePortalModules('admin_gh', []);
    expect(result.administracion.length).toBeGreaterThan(0);
    expect(result.finanzas.length).toBeGreaterThan(0);
    expect(result.documentos.length).toBeGreaterThan(0);
  });

  it('respeta permisos específicos', () => {
    const result = getVisiblePortalModules('lider_area', ['empleados', 'solicitudes']);
    expect(result.gestionHumana.length).toBeGreaterThan(0);
  });

  it('oculta módulos administrativos para empleados', () => {
    const result = getVisiblePortalModules('empleado', []);
    expect(result.administracion.length).toBe(0);
    expect(result.finanzas.length).toBe(0);
  });

  it('gestión humana siempre es visible', () => {
    const resultEmpleado = getVisiblePortalModules('empleado', []);
    const resultAdmin = getVisiblePortalModules('superadmin', []);
    expect(resultEmpleado.gestionHumana.length).toBeGreaterThan(0);
    expect(resultAdmin.gestionHumana.length).toBeGreaterThan(0);
  });
});
