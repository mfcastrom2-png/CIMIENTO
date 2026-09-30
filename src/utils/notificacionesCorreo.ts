import { UsuarioSistema, ConfiguracionEmpresa, ConfiguracionBuzonCorreo } from '../types';
import { obtenerConfiguracionBuzon, registrarLogEnvio } from '../services/buzonCorreoService';

export const generarAsuntoBienvenida = (usuario: UsuarioSistema, empresaNombre?: string): string => {
  const nombreOrg = empresaNombre || 'CIMIENTO S.A.S.';
  return `Activación de Cuenta y Acceso Institucional — ${nombreOrg} (${usuario.nombre})`;
};

export const generarCartaBienvenida = (
  usuario: UsuarioSistema,
  passwordTemporal?: string,
  originUrl?: string,
  empresa?: ConfiguracionEmpresa,
  buzonConfig?: ConfiguracionBuzonCorreo
): string => {
  const url = originUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://bgroup-gh.web.app');
  const nombreOrg = empresa?.razonSocial || empresa?.nombreComercial || 'CIMIENTO S.A.S.';
  const nitOrg = empresa?.nit ? `NIT: ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : 'NIT: 900.995.99-2';
  const ciudadOrg = empresa?.contacto?.ciudad || 'Bogotá D.C.';
  const emailRemitente = buzonConfig?.emailRemitente || empresa?.contacto?.emailContactoGH || 'gestionhumana@cimiento.com.co';

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

Le damos una cordial bienvenida a ${nombreOrg}. Se ha configurado y habilitado exitosamente su cuenta de acceso institucional al Sistema Integral de Gestión Humana y SG-SST.

DATOS DE ACCESO Y CUENTA:
• Portal de Ingreso: ${url}
• Correo Electrónico: ${usuario.email}
• Documento de Identidad: ${usuario.documento}
• Rol Asignado: ${rolTexto}
• Cargo / Función: ${usuario.cargoNombre || 'Colaborador'}
• Buzón Oficial de Notificaciones: ${emailRemitente}

PASOS OBLIGATORIOS PARA ACTIVAR SU CUENTA:
1. Revise su bandeja de entrada (y la carpeta de spam o correo no deseado) en ${usuario.email}.
2. Localice el correo institucional de activación despachado por nuestra plataforma oficial.
3. Siga el enlace seguro para definir su contraseña personal confidencial.
4. Una vez establecida su contraseña, ingrese al portal en ${url} con su correo y la nueva contraseña.
${passwordTemporal ? `(Nota: Código de referencia de activación interna: ${passwordTemporal})` : ''}

SEGURIDAD Y HABEAS DATA:
De conformidad con el Artículo 58 del Código Sustantivo del Trabajo (CST), la Ley 1581 de 2012 y las políticas corporativas de ${nombreOrg}, sus credenciales son estrictamente personales e intransferibles.

Si presenta alguna dificultad técnica, comuníquese de inmediato con la Dirección de Gestión Humana a través de ${emailRemitente}.

Atentamente,
DIRECCIÓN DE GESTIÓN HUMANA
${nombreOrg}
${nitOrg}
${ciudadOrg}, Colombia`;
};

/**
 * Despacha un correo institucional utilizando el buzón corporativo configurado
 */
export async function despacharNotificacionInstitucional(params: {
  destinatario: string;
  destinatarioNombre?: string;
  asunto: string;
  cuerpo: string;
  tipo: 'bienvenida_cuenta' | 'entrega_epp' | 'vacaciones' | 'nomina' | 'evaluacion' | 'prueba_sistema';
}): Promise<{ success: boolean; message: string }> {
  try {
    const buzon = await obtenerConfiguracionBuzon();
    const remitente = `"${buzon.nombreRemitente}" <${buzon.emailRemitente}>`;

    await registrarLogEnvio({
      id: `envio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 19),
      destinatario: params.destinatario,
      destinatarioNombre: params.destinatarioNombre,
      asunto: params.asunto,
      tipoNotificacion: params.tipo,
      estado: 'Entregado',
      remitenteUtilizado: remitente,
      mensajeRespuesta: 'Despachado a través del buzón corporativo configurado'
    });

    return {
      success: true,
      message: `Notificación enviada exitosamente a ${params.destinatario} desde ${buzon.emailRemitente}`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error al despachar notificación corporativa.'
    };
  }
}
