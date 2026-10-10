import {
  Briefcase,
  BookOpen,
  ClipboardList,
  Shield,
  BarChart3,
  Users,
  Building2,
  FileCheck2,
  Palmtree,
  FileText,
  Mail,
  UserCog,
  Database,
  QrCode,
  PenTool,
  Receipt,
  Scale,
  Lock,
  Vote,
  HardHat,
  Award,
  GraduationCap,
  LucideIcon
} from 'lucide-react';
import type { RolSistema } from '../../types';

export interface PortalModule {
  id: string;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  enlace: string;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  requierePermiso?: string;
  rolesAutorizados?: RolSistema[];
  badge?: string;
  esAdmin?: boolean;
}

export const MODULOS_GESTION_HUMANA: PortalModule[] = [
  {
    id: 'expedientes',
    titulo: 'Expedientes Digitales',
    descripcion: 'Gestión 360° de colaboradores.',
    icono: Users,
    enlace: 'empleados',
    color: 'primary',
    requierePermiso: 'empleados'
  },
  {
    id: 'manual-cargos',
    titulo: 'Manual de Cargos',
    descripcion: 'Fichas y perfiles por competencias.',
    icono: BookOpen,
    enlace: 'cargos',
    color: 'primary',
    requierePermiso: 'cargos'
  },
  {
    id: 'estructura',
    titulo: 'Estructura Organizacional',
    descripcion: 'Diseño y análisis jerárquico.',
    icono: Briefcase,
    enlace: 'estructura',
    color: 'secondary',
    requierePermiso: 'estructura'
  },
  {
    id: 'evaluaciones',
    titulo: 'Evaluaciones & Desempeño',
    descripcion: 'Gestión de competencias y rendimiento.',
    icono: ClipboardList,
    enlace: 'evaluaciones',
    color: 'accent',
    requierePermiso: 'evaluaciones'
  }
];

export const MODULOS_SST: PortalModule[] = [
  {
    id: 'sg-sst',
    titulo: 'Sistema SG-SST',
    descripcion: 'Conformidad Res. 0312 (21 Estándares).',
    icono: Shield,
    enlace: 'sst',
    color: 'primary',
    requierePermiso: 'sst',
    badge: '21'
  },
  {
    id: 'indicadores-sst',
    titulo: 'Indicadores SG-SST',
    descripcion: 'Seguimiento PHVA y métricas.',
    icono: BarChart3,
    enlace: 'indicadores-sst',
    color: 'secondary',
    requierePermiso: 'indicadores-sst',
    badge: 'PHVA'
  },
  {
    id: 'matriz-riesgos',
    titulo: 'Matriz de Riesgos',
    descripcion: 'Mapeo GTC 45 y control.',
    icono: Building2,
    enlace: 'matriz-gtc45',
    color: 'accent',
    requierePermiso: 'matriz-gtc45',
    badge: 'GTC 45'
  },
  {
    id: 'examenes',
    titulo: 'Exámenes Médicos',
    descripcion: 'Seguimiento ocupacional y salud.',
    icono: FileCheck2,
    enlace: 'sst-examenes',
    color: 'success',
    requierePermiso: 'sst-examenes'
  },
  {
    id: 'epps',
    titulo: 'Inventario de EPPs',
    descripcion: 'Gestión de equipos de protección.',
    icono: HardHat,
    enlace: 'epps',
    color: 'warning',
    requierePermiso: 'epps',
    badge: 'Almacén'
  },
  {
    id: 'votaciones-sst',
    titulo: 'Votaciones & Comités',
    descripcion: 'COPASST y participación SST.',
    icono: Vote,
    enlace: 'votaciones-sst',
    color: 'primary',
    requierePermiso: 'votaciones-sst',
    badge: 'COPASST'
  }
];

export const MODULOS_FINANZAS_COMPENSACION: PortalModule[] = [
  {
    id: 'nomina',
    titulo: 'Nómina y Prestaciones',
    descripcion: 'Gestión de liquidación y pagos.',
    icono: Receipt,
    enlace: 'nomina',
    color: 'primary',
    requierePermiso: 'nomina',
    esAdmin: true
  },
  {
    id: 'parametros-nomina',
    titulo: 'Parámetros de Nómina',
    descripcion: 'Configuración SMMLV y variables.',
    icono: Scale,
    enlace: 'parametros-nomina',
    color: 'secondary',
    requierePermiso: 'parametros-nomina',
    esAdmin: true,
    badge: 'SMMLV'
  },
  {
    id: 'saldos-iniciales',
    titulo: 'Saldos Iniciales',
    descripcion: 'Carga masiva de datos iniciales.',
    icono: Database,
    enlace: 'saldos-iniciales',
    color: 'accent',
    requierePermiso: 'saldos-iniciales',
    esAdmin: true,
    badge: 'Carga'
  },
  {
    id: 'vacaciones',
    titulo: 'Control de Vacaciones',
    descripcion: 'Gestión de descansos y derechos.',
    icono: Palmtree,
    enlace: 'vacaciones',
    color: 'success',
    requierePermiso: 'vacaciones',
    badge: 'Art. 186'
  }
];

export const MODULOS_DOCUMENTOS_GOBERNANZA: PortalModule[] = [
  {
    id: 'documentos',
    titulo: 'Documentos Institucionales',
    descripcion: 'Repositorio y generador de documentos.',
    icono: FileText,
    enlace: 'documentos',
    color: 'primary',
    requierePermiso: 'documentos',
    esAdmin: true
  },
  {
    id: 'verificar-certificados',
    titulo: 'Verificar Certificados',
    descripcion: 'Auditoría de autenticidad documental.',
    icono: QrCode,
    enlace: 'verificar-certificados',
    color: 'warning',
    requierePermiso: 'documentos',
    esAdmin: true,
    badge: 'QR'
  },
  {
    id: 'firma-digital',
    titulo: 'Estudio de Firma Digital',
    descripcion: 'Herramienta institucional de firmas.',
    icono: PenTool,
    enlace: 'firma-digital',
    color: 'accent',
    requierePermiso: 'documentos',
    esAdmin: true,
    badge: 'Ley 527'
  }
];

export const MODULOS_ADMINISTRACION: PortalModule[] = [
  {
    id: 'usuarios',
    titulo: 'Gestión de Usuarios',
    descripcion: 'Control de acceso y permisos.',
    icono: UserCog,
    enlace: 'usuarios',
    color: 'primary',
    requierePermiso: 'usuarios',
    esAdmin: true,
    badge: 'RBAC'
  },
  {
    id: 'buzon-correo',
    titulo: 'Buzón de Notificaciones',
    descripcion: 'Configuración SMTP y envíos.',
    icono: Mail,
    enlace: 'buzon-correo',
    color: 'secondary',
    requierePermiso: 'buzon-correo',
    esAdmin: true,
    badge: 'SMTP'
  },
  {
    id: 'auditoria',
    titulo: 'Auditoría & Trazabilidad',
    descripcion: 'Libro Mayor Inmutable (DIAN/CST).',
    icono: Lock,
    enlace: 'auditoria',
    color: 'danger',
    requierePermiso: 'auditoria',
    esAdmin: true,
    badge: 'Audit'
  },
  {
    id: 'empresa',
    titulo: 'Configuración Empresa',
    descripcion: 'Datos corporativos e identidad visual.',
    icono: Building2,
    enlace: 'empresa',
    color: 'primary',
    requierePermiso: 'empresa',
    esAdmin: true,
    badge: 'Empresa'
  }
];

export const MODULOS_CAPACITACION: PortalModule[] = [
  {
    id: 'capacitaciones',
    titulo: 'Capacitaciones',
    descripcion: 'Programa de formación y desarrollo.',
    icono: GraduationCap,
    enlace: 'capacitaciones',
    color: 'primary',
    requierePermiso: 'capacitaciones',
    badge: '2026'
  }
];

export const MODULOS_SOLICITUDES: PortalModule[] = [
  {
    id: 'solicitudes',
    titulo: 'Solicitudes',
    descripcion: 'Permisos, licencias y certificados.',
    icono: ClipboardList,
    enlace: 'solicitudes',
    color: 'primary',
    requierePermiso: 'solicitudes'
  }
];

export interface PortalModulosPorRol {
  gestionHumana: PortalModule[];
  sst: PortalModule[];
  finanzas: PortalModule[];
  documentos: PortalModule[];
  administracion: PortalModule[];
  capacitacion: PortalModule[];
  solicitudes: PortalModule[];
}

export function getVisiblePortalModules(
  role: RolSistema = 'empleado',
  permisos: string[] = []
): PortalModulosPorRol {
  const safeRole = typeof role === 'string' ? role : 'empleado';
  const esAdmin = ['admin', 'superadmin', 'admin_gh'].includes(safeRole);
  const esSST = safeRole === 'responsable_sst' || esAdmin;
  const esLider = safeRole === 'lider_area' || esAdmin;
  const esEmpleado = safeRole === 'empleado';

  // Filtrar módulos por rol y permisos
  const filtrarModulos = (modulos: PortalModule[]): PortalModule[] => {
    if (!Array.isArray(modulos)) return [];
    return modulos.filter((mod) => {
      // Si requiere admin y no lo es
      if (mod.esAdmin && !esAdmin) return false;

      // Si tiene roles autorizados específicos
      if (mod.rolesAutorizados && !mod.rolesAutorizados.includes(safeRole as RolSistema)) return false;

      // Si requiere permiso específico
      if (mod.requierePermiso && !esAdmin) {
        if (['empleado', 'responsable_sst', 'lider_area'].includes(safeRole)) {
          return true;
        }
        return Array.isArray(permisos) && permisos.includes(mod.requierePermiso);
      }

      return true;
    });
  };

  return {
    gestionHumana: filtrarModulos(MODULOS_GESTION_HUMANA),
    sst: esSST ? filtrarModulos(MODULOS_SST) : [],
    finanzas: esAdmin ? filtrarModulos(MODULOS_FINANZAS_COMPENSACION) : [],
    documentos: esAdmin || esLider ? filtrarModulos(MODULOS_DOCUMENTOS_GOBERNANZA) : [],
    administracion: esAdmin ? filtrarModulos(MODULOS_ADMINISTRACION) : [],
    capacitacion: filtrarModulos(MODULOS_CAPACITACION),
    solicitudes: filtrarModulos(MODULOS_SOLICITUDES)
  };
}
