import { AnuncioSlide } from '../types';

export const PLANTILLAS_IMAGENES_ANUNCIOS = [
  {
    categoria: 'Seguridad & SG-SST',
    nombre: 'Seguridad Operativa y EPPs en Obra',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    categoria: 'Democracia & Votaciones',
    nombre: 'Elecciones Democráticas COPASST / Convivencia',
    url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    categoria: 'Bienestar & Salud',
    nombre: 'Jornadas de Salud, Ergonomía y Pausas Activas',
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    categoria: 'Capacitación & Desarrollo',
    nombre: 'Formación Técnica y Desarrollo Profesional',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
  },
  {
    categoria: 'Logros & Reconocimientos',
    nombre: 'Reconocimiento y Excelencia Laboral',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    categoria: 'Comunicado Oficial',
    nombre: 'Reunión Directiva y Políticas Corporativas',
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80'
  }
];

export const INITIAL_ANUNCIOS_SLIDES: AnuncioSlide[] = [
  {
    id: 'slide-1',
    titulo: 'Campaña SG-SST 2026: Tu Seguridad es Prioridad en Cada Proyecto',
    subtitulo: 'Uso obligatorio y verificación diaria de Elementos de Protección Personal (Res. 2400 de 1979)',
    categoria: 'Seguridad & SG-SST',
    imagenUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Recordamos a todo el personal técnico, operativo y de interventoría la obligatoriedad del porte adecuado de casco tipo II, botas dieléctricas y arnés certificado para trabajo en alturas. Solicita o reporta reposición oportuna de dotación a través del módulo de EPPs.',
    fechaPublicacion: '2026-09-01',
    vigenciaHasta: '2026-12-31',
    activo: true,
    orden: 1,
    destacado: true,
    autorNombre: 'Dirección SG-SST & Gestión Humana',
    linkAccion: 'epps',
    textoBoton: 'Gestionar Mis EPPs'
  },
  {
    id: 'slide-2',
    titulo: 'Votaciones Oficiales COPASST y Comité de Convivencia Laboral',
    subtitulo: 'Periodo Estatutario 2026 - 2028: Ejerce tu derecho democrático y secreto',
    categoria: 'Democracia & Votaciones',
    imagenUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'La mesa de votación digital se encuentra habilitada para que todos los colaboradores con contrato activo elijan a sus representantes. Recuerda que al depositar tu voto recibirás de inmediato el Certificado Electoral oficial para tus constancias laborales.',
    fechaPublicacion: '2026-09-10',
    vigenciaHasta: '2026-10-31',
    activo: true,
    orden: 2,
    destacado: true,
    autorNombre: 'Comisión Electoral B GROUP',
    linkAccion: 'votaciones-sst',
    textoBoton: 'Ir a Votar Ahora'
  },
  {
    id: 'slide-3',
    titulo: 'Apertura del Ciclo de Evaluación Técnica de Desempeño 2026',
    subtitulo: 'Modelo transparente de 100 puntos derivado de tu manual de funciones',
    categoria: 'Capacitación & Desarrollo',
    imagenUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Ya puedes consultar el estado de tu evaluación técnica por competencias, resultados y cumplimiento normativo. El proceso promueve acuerdos mutuos de mejora y planes de desarrollo profesional concertados con tu líder de área.',
    fechaPublicacion: '2026-09-15',
    vigenciaHasta: '2026-11-30',
    activo: true,
    orden: 3,
    destacado: false,
    autorNombre: 'Dirección de Gestión Humana',
    linkAccion: 'evaluaciones',
    textoBoton: 'Ver Mi Evaluación'
  },
  {
    id: 'slide-4',
    titulo: 'Semana de Bienestar Integral, Salud Visual y Ergonomía en Puesto',
    subtitulo: 'Jornadas de pausas activas dirigidas y chequeos preventivos en sedes',
    categoria: 'Bienestar & Salud',
    imagenUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    descripcion: 'Acompáñanos todos los martes y jueves a las 10:00 a.m. y 3:00 p.m. en las sesiones guiadas de calistenia postural y desconexión visual para prevenir lesiones osteomusculares y fatiga laboral.',
    fechaPublicacion: '2026-09-18',
    vigenciaHasta: '2026-12-15',
    activo: true,
    orden: 4,
    destacado: false,
    autorNombre: 'Bienestar Laboral & Talento',
    linkAccion: 'capacitaciones',
    textoBoton: 'Ver Cronograma'
  }
];
