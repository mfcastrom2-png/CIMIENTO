import { UsuarioSistema, Role, RolSistema } from '../types';

/**
 * Valida si el usuario en sesión tiene permisos de edición, creación o eliminación
 * en los componentes de Seguridad y Salud en el Trabajo (SST), requiriendo
 * estrictamente el rol 'responsable_sst' o 'admin_gh' (o 'superadmin' en jerarquía de sistema).
 */
export function puedeEditarSST(currentUser?: UsuarioSistema | null, userRole?: Role): boolean {
  if (currentUser && currentUser.rol) {
    return (
      currentUser.rol === 'responsable_sst' ||
      currentUser.rol === 'admin_gh' ||
      currentUser.rol === 'superadmin'
    );
  }
  // En caso de que no haya un usuario autenticado cargado pero userRole sea admin
  return userRole === 'admin';
}

/**
 * Retorna la etiqueta legible del rol del usuario para mensajes institucionales
 */
export function obtenerEtiquetaRolSST(rol?: RolSistema): string {
  switch (rol) {
    case 'responsable_sst':
      return 'Responsable SG-SST';
    case 'admin_gh':
      return 'Administrador de Gestión Humana';
    case 'superadmin':
      return 'Superadministrador del Sistema';
    case 'lider_area':
      return 'Líder de Área / Proceso';
    case 'empleado':
      return 'Colaborador / Empleado';
    default:
      return rol || 'Usuario Invitado';
  }
}
