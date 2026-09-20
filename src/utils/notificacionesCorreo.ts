import { UsuarioSistema } from '../types';

export const generarAsuntoBienvenida = (usuario: UsuarioSistema): string => {
  return `Bienvenido a B GROUP INGENIERIA S.A.S. — Activación de Cuenta y Credenciales de Acceso`;
};

export const generarCartaBienvenida = (
  usuario: UsuarioSistema,
  passwordTemporal: string,
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

Le damos una cordial bienvenida a B GROUP INGENIERIA S.A.S. Se ha configurado y activado exitosamente su cuenta de acceso institucional al Sistema Integral de Gestión Humana y SG-SST.

DATOS Y CREDENCIALES DE ACCESO:
• Enlace de Ingreso: ${url}
• Correo Electrónico: ${usuario.email}
• Documento de Identidad: ${usuario.documento}
• Contraseña Provisoria: ${passwordTemporal}
• Rol Asignado: ${rolTexto}
• Cargo / Función: ${usuario.cargoNombre || 'Colaborador'}

INSTRUCCIONES DE ACCESO Y SEGURIDAD:
1. Ingrese a la plataforma haciendo clic en el enlace de ingreso: ${url}
2. Inicie sesión utilizando su correo electrónico y la contraseña provisoria indicada anteriormente.
3. Desde su portal institucional podrá gestionar sus solicitudes de permisos, consultar el manual de su cargo, revisar dotaciones y EPPs, participar en comités y elecciones del SG-SST, y acceder a sus constancias.
4. De conformidad con el Artículo 58 del Código Sustantivo del Trabajo (CST) y las directrices de seguridad de la información de B GROUP INGENIERIA S.A.S., las credenciales de acceso son estrictamente personales e intransferibles.

Si presenta dudas o dificultades técnicas durante el ingreso, comuníquese con la Dirección de Gestión Humana.

Atentamente,
DIRECCIÓN DE GESTIÓN HUMANA
B GROUP INGENIERIA S.A.S.
NIT: 900.995.99-2
Bogotá D.C., Colombia`;
};
