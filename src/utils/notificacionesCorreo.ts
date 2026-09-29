import { UsuarioSistema } from '../types';

export const generarAsuntoBienvenida = (usuario: UsuarioSistema): string => {
  return `Activación de Cuenta y Acceso Institucional — B GROUP INGENIERIA S.A.S. (${usuario.nombre})`;
};

export const generarCartaBienvenida = (
  usuario: UsuarioSistema,
  passwordTemporal?: string,
  originUrl?: string
): string => {
  const url = originUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://bgroup-gh.web.app');
  const rolTexto =
    usuario.rol === 'empleado'
      ? 'Colaborador / Empleado'
      : usuario.rol === 'admin_gh'
      ? 'Administrador Gestión Humana'
      : usuario.rol === 'lider_area'
      ? 'Líder de Área'
      : usuario.rol === 'responsable_sst'
      ? 'Responsable SG-SST'
      : 'Super Administrador';

  return `Apreciado(a) ${usuario.nombre},

Le damos una cordial bienvenida a B GROUP INGENIERIA S.A.S. Se ha configurado y habilitado exitosamente su cuenta de acceso institucional al Sistema Integral de Gestión Humana y SG-SST.

DATOS DE ACCESO Y CUENTA:
• Portal de Ingreso: ${url}
• Correo Electrónico: ${usuario.email}
• Documento de Identidad: ${usuario.documento}
• Rol Asignado: ${rolTexto}
• Cargo / Función: ${usuario.cargoNombre || 'Colaborador'}

PASOS OBLIGATORIOS PARA ACTIVAR SU CUENTA:
1. Revise la bandeja de entrada (y la carpeta de spam o correo no deseado) de su correo ${usuario.email}.
2. Localice el correo de activación/restablecimiento de contraseña despachado automáticamente por el servicio de identidad de Firebase Auth.
3. Haga clic en el enlace seguro contenido en dicho correo para definir su contraseña personal confidencial.
4. Una vez establecida su contraseña, ingrese al portal en ${url} con su correo y la nueva contraseña.
${passwordTemporal ? `(Nota: Código de referencia de activación interna: ${passwordTemporal})` : ''}

SEGURIDAD Y HABEAS DATA:
De conformidad con el Artículo 58 del Código Sustantivo del Trabajo (CST), la Ley 1581 de 2012 y las políticas corporativas de B GROUP INGENIERIA S.A.S., sus credenciales son estrictamente personales e intransferibles.

Si presenta alguna dificultad técnica, comuníquese de inmediato con la Dirección de Gestión Humana.

Atentamente,
DIRECCIÓN DE GESTIÓN HUMANA
B GROUP INGENIERIA S.A.S.
NIT: 900.995.99-2
Bogotá D.C., Colombia`;
};
