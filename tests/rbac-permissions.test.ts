import { describe, it, expect } from 'vitest';
import {
  MODULOS_SISTEMA,
  PERMISOS_POR_DEFECTO_POR_ROL,
  obtenerPermisosPorDefecto
} from '../src/data/usuariosYVotacionesData';
import { RolSistema, UsuarioSistema } from '../src/types';

describe('Suite de Pruebas: Matriz de Roles y Asignación de Permisos RBAC', () => {

  it('Debe tener registrados los 22 módulos del sistema con categorías válidas', () => {
    expect(MODULOS_SISTEMA.length).toBe(22);
    
    const categoriasEsperadas = ['General', 'Organización', 'Talento Humano', 'SG-SST', 'Finanzas', 'Sistema'];
    MODULOS_SISTEMA.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(m.nombre).toBeTruthy();
      expect(categoriasEsperadas).toContain(m.categoria);
    });

    const ids = MODULOS_SISTEMA.map(m => m.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('empresa');
    expect(ids).toContain('estructura');
    expect(ids).toContain('cargos');
    expect(ids).toContain('empleados');
    expect(ids).toContain('evaluaciones');
    expect(ids).toContain('solicitudes');
    expect(ids).toContain('vacaciones');
    expect(ids).toContain('capacitaciones');
    expect(ids).toContain('sst');
    expect(ids).toContain('matriz-gtc45');
    expect(ids).toContain('indicadores-sst');
    expect(ids).toContain('sst-examenes');
    expect(ids).toContain('epps');
    expect(ids).toContain('votaciones-sst');
    expect(ids).toContain('nomina');
    expect(ids).toContain('parametros-nomina');
    expect(ids).toContain('saldos-iniciales');
    expect(ids).toContain('documentos');
    expect(ids).toContain('usuarios');
    expect(ids).toContain('buzon-correo');
    expect(ids).toContain('auditoria');
  });

  describe('Matriz Oficial de Permisos por Rol', () => {
    it('Superadministrador debe tener acceso irrestricto a todos los módulos del sistema', () => {
      const perms = obtenerPermisosPorDefecto('superadmin');
      expect(perms.length).toBe(MODULOS_SISTEMA.length);
      MODULOS_SISTEMA.forEach(m => {
        expect(perms).toContain(m.id);
      });
    });

    it('Administrador de Gestión Humana (admin_gh) debe tener acceso a gestión de GH, SG-SST, nómina y gobernanza', () => {
      const perms = obtenerPermisosPorDefecto('admin_gh');
      expect(perms).toContain('nomina');
      expect(perms).toContain('parametros-nomina');
      expect(perms).toContain('empleados');
      expect(perms).toContain('vacaciones');
      expect(perms).toContain('solicitudes');
      expect(perms).toContain('evaluaciones');
      expect(perms).toContain('sst');
      expect(perms).toContain('matriz-gtc45');
      expect(perms).toContain('indicadores-sst');
      expect(perms).toContain('sst-examenes');
      expect(perms).toContain('epps');
      expect(perms).toContain('votaciones-sst');
      expect(perms).toContain('usuarios');
      expect(perms).toContain('auditoria');
      expect(perms).toContain('buzon-correo');
    });

    it('Líder de Área debe tener acceso a gestión de su equipo y evaluaciones, sin acceso a nómina confidencial', () => {
      const perms = obtenerPermisosPorDefecto('lider_area');
      // Acceso autorizado
      expect(perms).toContain('dashboard');
      expect(perms).toContain('empleados');
      expect(perms).toContain('evaluaciones');
      expect(perms).toContain('solicitudes');
      expect(perms).toContain('vacaciones');
      expect(perms).toContain('capacitaciones');
      expect(perms).toContain('epps');
      expect(perms).toContain('votaciones-sst');
      expect(perms).toContain('documentos');

      // Restricciones de menor privilegio / reserva salarial
      expect(perms).not.toContain('nomina');
      expect(perms).not.toContain('parametros-nomina');
      expect(perms).not.toContain('usuarios');
      expect(perms).not.toContain('auditoria');
      expect(perms).not.toContain('buzon-correo');
    });

    it('Responsable SG-SST debe tener suite completa de SST y seguimiento de ausentismo médico sin nómina', () => {
      const perms = obtenerPermisosPorDefecto('responsable_sst');
      // Módulos especializados de SST
      expect(perms).toContain('sst');
      expect(perms).toContain('matriz-gtc45');
      expect(perms).toContain('indicadores-sst');
      expect(perms).toContain('sst-examenes');
      expect(perms).toContain('epps');
      expect(perms).toContain('votaciones-sst');
      expect(perms).toContain('solicitudes'); // Para seguimiento a incapacidades médicas
      expect(perms).toContain('cargos');      // Para profesiogramas
      expect(perms).toContain('empleados');   // Para población trabajadora

      // Restricción salarial estricta
      expect(perms).not.toContain('nomina');
      expect(perms).not.toContain('parametros-nomina');
      expect(perms).not.toContain('usuarios');
    });

    it('Empleado/Colaborador debe tener autoservicio personal y reserva salarial', () => {
      const perms = obtenerPermisosPorDefecto('empleado');
      expect(perms).toContain('dashboard');
      expect(perms).toContain('solicitudes');
      expect(perms).toContain('vacaciones');
      expect(perms).toContain('capacitaciones');
      expect(perms).toContain('evaluaciones');
      expect(perms).toContain('epps');
      expect(perms).toContain('votaciones-sst');
      expect(perms).toContain('nomina');      // Consulta exclusiva de su propio desprendible

      // No debe tener acceso al repositorio y generador institucional de documentos ni administración
      expect(perms).not.toContain('documentos');
      expect(perms).not.toContain('empresa');
      expect(perms).not.toContain('estructura');
      expect(perms).not.toContain('cargos');
      expect(perms).not.toContain('usuarios');
      expect(perms).not.toContain('parametros-nomina');
      expect(perms).not.toContain('auditoria');
    });

    it('Rol desconocido debe responder con los permisos seguros de empleado por defecto', () => {
      const perms = obtenerPermisosPorDefecto('desconocido' as any);
      expect(perms).toEqual(PERMISOS_POR_DEFECTO_POR_ROL.empleado);
    });
  });

  describe('Lógica de Creación y Modificación de Usuarios', () => {
    it('Al cambiar de rol en la creación, debe asignar automáticamente los permisos del rol seleccionado', () => {
      let nuevoUsuario: Partial<UsuarioSistema> = {
        nombre: 'Nuevo Funcionario',
        email: 'nuevo@empresa.com',
        rol: 'empleado',
        permisos: obtenerPermisosPorDefecto('empleado')
      };

      // Simular cambio de rol a responsable_sst
      const nuevoRol: RolSistema = 'responsable_sst';
      nuevoUsuario = {
        ...nuevoUsuario,
        rol: nuevoRol,
        permisos: obtenerPermisosPorDefecto(nuevoRol)
      };

      expect(nuevoUsuario.rol).toBe('responsable_sst');
      expect(nuevoUsuario.permisos).toContain('matriz-gtc45');
      expect(nuevoUsuario.permisos).toContain('indicadores-sst');
      expect(nuevoUsuario.permisos).toContain('sst-examenes');
      expect(nuevoUsuario.permisos).not.toContain('parametros-nomina');
    });

    it('Al modificar el rol de un usuario existente, debe actualizar los permisos acordes al nuevo rol', () => {
      const usuarioExistente: UsuarioSistema = {
        id: 'usr-100',
        nombre: 'Maria López',
        documento: '1098765432',
        email: 'maria@empresa.com',
        rol: 'empleado',
        estado: 'activo',
        ultimoAcceso: 'Nunca',
        fechaCreacion: '2026-02-01',
        dobleFactorHabilitado: false,
        permisos: obtenerPermisosPorDefecto('empleado')
      };

      expect(usuarioExistente.permisos).not.toContain('sst');
      expect(usuarioExistente.permisos).not.toContain('matriz-gtc45');

      // Administrador asciende a María a Responsable SG-SST
      const rolActualizado: RolSistema = 'responsable_sst';
      const usuarioEditado: UsuarioSistema = {
        ...usuarioExistente,
        rol: rolActualizado,
        permisos: obtenerPermisosPorDefecto(rolActualizado)
      };

      expect(usuarioEditado.rol).toBe('responsable_sst');
      expect(usuarioEditado.permisos).toContain('sst');
      expect(usuarioEditado.permisos).toContain('matriz-gtc45');
      expect(usuarioEditado.permisos).toContain('indicadores-sst');
      expect(usuarioEditado.permisos).toContain('sst-examenes');
      expect(usuarioEditado.permisos).toContain('solicitudes');
    });

    it('Al degradar un usuario administrativo a colaborador, debe revocar permisos administrativos', () => {
      const adminPrevio: UsuarioSistema = {
        id: 'usr-admin-test',
        nombre: 'Usuario Temporal',
        documento: '12345678',
        email: 'temp@empresa.com',
        rol: 'admin_gh',
        estado: 'activo',
        ultimoAcceso: 'Ayer',
        fechaCreacion: '2026-01-01',
        dobleFactorHabilitado: true,
        permisos: obtenerPermisosPorDefecto('admin_gh')
      };

      expect(adminPrevio.permisos).toContain('usuarios');
      expect(adminPrevio.permisos).toContain('auditoria');

      // Se cambia rol a colaborador
      const rolNuevo: RolSistema = 'empleado';
      const degradado: UsuarioSistema = {
        ...adminPrevio,
        rol: rolNuevo,
        permisos: obtenerPermisosPorDefecto(rolNuevo)
      };

      expect(degradado.rol).toBe('empleado');
      expect(degradado.permisos).not.toContain('usuarios');
      expect(degradado.permisos).not.toContain('auditoria');
      expect(degradado.permisos).not.toContain('parametros-nomina');
      expect(degradado.permisos).not.toContain('empresa');
    });

    it('Debe permitir personalizaciones puntuales sin perder la coherencia del rol', () => {
      const liderConPermisoExtra: UsuarioSistema = {
        id: 'usr-lider-1',
        nombre: 'Jefe de Operaciones',
        documento: '98765432',
        email: 'jefe@empresa.com',
        rol: 'lider_area',
        estado: 'activo',
        ultimoAcceso: 'Hoy',
        fechaCreacion: '2026-01-10',
        dobleFactorHabilitado: false,
        permisos: [...obtenerPermisosPorDefecto('lider_area'), 'cargos']
      };

      expect(liderConPermisoExtra.permisos).toContain('cargos');
      expect(liderConPermisoExtra.permisos).toContain('evaluaciones');
      expect(liderConPermisoExtra.permisos).not.toContain('nomina');
    });
  });
});
