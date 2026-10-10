import { Briefcase, BookOpen, ClipboardList, Shield, BarChart3, Users, Building2, FileCheck2 } from 'lucide-react';
import type { PortalModule } from './ModulosPortalCard';

export const MODULOS_GESTION_HUMANA: PortalModule[] = [
  {
    id: 'expedientes',
    titulo: 'Expedientes Digitales',
    descripcion: 'Gestión 360° de colaboradores.',
    icono: Users,
    enlace: 'empleados',
    color: 'primary'
  },
  {
    id: 'manual-cargos',
    titulo: 'Manual de Cargos',
    descripcion: 'Fichas y perfiles por competencias.',
    icono: BookOpen,
    enlace: 'cargos',
    color: 'primary'
  },
  {
    id: 'estructura',
    titulo: 'Estructura Organizacional',
    descripcion: 'Diseño y análisis jerárquico.',
    icono: Briefcase,
    enlace: 'estructura',
    color: 'secondary'
  },
  {
    id: 'evaluaciones',
    titulo: 'Evaluaciones & Desempeño',
    descripcion: 'Gestión de competencias y rendimiento.',
    icono: ClipboardList,
    enlace: 'evaluaciones',
    color: 'accent'
  }
];

export const MODULOS_SST: PortalModule[] = [
  {
    id: 'sg-sst',
    titulo: 'Sistema SG-SST',
    descripcion: 'Conformidad Res. 0312.',
    icono: Shield,
    enlace: 'sst',
    color: 'primary'
  },
  {
    id: 'indicadores-sst',
    titulo: 'Indicadores SG-SST',
    descripcion: 'Seguimiento PHVA y métricas.',
    icono: BarChart3,
    enlace: 'indicadores-sst',
    color: 'secondary'
  },
  {
    id: 'matriz-riesgos',
    titulo: 'Matriz de Riesgos',
    descripcion: 'Mapeo GTC 45 y control.',
    icono: Building2,
    enlace: 'matriz-gtc45',
    color: 'accent'
  },
  {
    id: 'examenes',
    titulo: 'Exámenes Médicos',
    descripcion: 'Seguimiento ocupacional y salud.',
    icono: FileCheck2,
    enlace: 'sst-examenes',
    color: 'primary'
  }
];

export function getVisiblePortalModules(role?: string) {
  const normalizedRole = role || 'admin';
  const adminRoles = ['admin', 'superadmin', 'admin_gh', 'lider_area', 'responsable_sst'];

  return {
    gestionHumana: MODULOS_GESTION_HUMANA,
    sst: adminRoles.includes(normalizedRole) ? MODULOS_SST : []
  };
}
