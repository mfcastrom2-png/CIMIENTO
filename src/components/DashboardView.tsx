import React, { useState, useEffect, useMemo } from 'react';
import {
  Cargo,
  Empleado,
  Encuesta,
  EvaluacionDesempeno,
  Solicitud,
  AnuncioSlide,
  CategoriaAnuncio,
  Role,
  UsuarioSistema
} from '../types';
import {
  INITIAL_ANUNCIOS_SLIDES,
  PLANTILLAS_IMAGENES_ANUNCIOS
} from '../data/anunciosData';
import {
  guardarAnuncioFB,
  eliminarAnuncioFB,
  obtenerAnunciosFB
} from '../lib/firebase';
import {
  Briefcase,
  Users,
  Clock,
  Award,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Database,
  Cloud,
  Trash2,
  HardHat,
  Megaphone,
  Plus,
  Eye,
  EyeOff,
  Edit,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  ExternalLink,
  Sliders,
  Image as ImageIcon,
  Check,
  X,
  FileDown,
  Palmtree,
  Vote,
  ShieldCheck,
  Upload,
  BookOpen
} from 'lucide-react';

interface DashboardViewProps {
  cargos: Cargo[];
  empleados: Empleado[];
  solicitudes: Solicitud[];
  encuestas?: Encuesta[];
  evaluaciones: EvaluacionDesempeno[];
  userRole?: Role;
  currentUser?: UsuarioSistema | null;
  onNavigate: (view: string) => void;
  onOpenEvaluacionDetalle?: (evalId: string) => void;
  onOpenGestionDatos?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cargos = [],
  empleados = [],
  solicitudes = [],
  evaluaciones = [],
  userRole = 'admin',
  currentUser,
  onNavigate,
  onOpenEvaluacionDetalle: _onOpenEvaluacionDetalle,
  onOpenGestionDatos
}) => {
  const esAdmin = userRole !== 'empleado' && (currentUser?.rol === 'superadmin' || currentUser?.rol === 'admin_gh' || userRole === 'admin');

  // Estado de anuncios y slides
  const [anuncios, setAnuncios] = useState<AnuncioSlide[]>(() => {
    try {
      const saved = localStorage.getItem('bgroup_anuncios_slides');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_ANUNCIOS_SLIDES;
  });

  // Cargar anuncios de Firestore si están disponibles
  useEffect(() => {
    let montado = true;
    obtenerAnunciosFB().then(datos => {
      if (montado && datos && datos.length > 0) {
        setAnuncios(datos);
        localStorage.setItem('bgroup_anuncios_slides', JSON.stringify(datos));
      }
    }).catch(err => {
      console.warn('Cargando anuncios desde almacenamiento local:', err);
    });
    return () => {
      montado = false;
    };
  }, []);

  // Guardar en localStorage cada vez que cambien
  const persistirAnuncios = (nuevos: AnuncioSlide[]) => {
    setAnuncios(nuevos);
    try {
      localStorage.setItem('bgroup_anuncios_slides', JSON.stringify(nuevos));
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
    }
  };

  // Pestaña activa para administradores: 'anuncios' o 'metricas'
  const [tabAdmin, setTabAdmin] = useState<'anuncios' | 'metricas'>('anuncios');

  // Control del Carrusel de Slides
  const slidesVisibles = useMemo(() => {
    if (esAdmin) {
      // El administrador puede ver todos en el carrusel o solo activos
      return anuncios.filter(a => a.activo);
    }
    // El empleado solo ve los habilitados por el administrador
    return anuncios.filter(a => a.activo);
  }, [anuncios, esAdmin]);

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-avance del carrusel cada 6 segundos
  useEffect(() => {
    if (!autoPlay || slidesVisibles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx(prev => (prev + 1) % slidesVisibles.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPlay, slidesVisibles.length]);

  // Si cambia la lista de slides visibles, ajustar índice
  useEffect(() => {
    if (currentSlideIdx >= slidesVisibles.length && slidesVisibles.length > 0) {
      setCurrentSlideIdx(0);
    }
  }, [slidesVisibles.length, currentSlideIdx]);

  // Modal para Crear / Editar Anuncio (Exclusivo Administrador)
  const [modalAnuncioOpen, setModalAnuncioOpen] = useState(false);
  const [anuncioEnEdicion, setAnuncioEnEdicion] = useState<AnuncioSlide | null>(null);

  // Modal de Detalle para Lectura Completa de un Comunicado
  const [slideDetalle, setSlideDetalle] = useState<AnuncioSlide | null>(null);

  // Formulario del anuncio
  const [formTitulo, setFormTitulo] = useState('');
  const [formSubtitulo, setFormSubtitulo] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaAnuncio>('Comunicado Oficial');
  const [formImagenUrl, setFormImagenUrl] = useState(PLANTILLAS_IMAGENES_ANUNCIOS[0].url);
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formLinkAccion, setFormLinkAccion] = useState('');
  const [formTextoBoton, setFormTextoBoton] = useState('');
  const [formDestacado, setFormDestacado] = useState(true);

  const abrirCrearAnuncio = () => {
    setAnuncioEnEdicion(null);
    setFormTitulo('');
    setFormSubtitulo('');
    setFormCategoria('Comunicado Oficial');
    setFormImagenUrl(PLANTILLAS_IMAGENES_ANUNCIOS[0].url);
    setFormDescripcion('');
    setFormActivo(true);
    setFormLinkAccion('');
    setFormTextoBoton('');
    setFormDestacado(true);
    setModalAnuncioOpen(true);
  };

  const abrirEditarAnuncio = (anuncio: AnuncioSlide) => {
    setAnuncioEnEdicion(anuncio);
    setFormTitulo(anuncio.titulo);
    setFormSubtitulo(anuncio.subtitulo || '');
    setFormCategoria(anuncio.categoria);
    setFormImagenUrl(anuncio.imagenUrl);
    setFormDescripcion(anuncio.descripcion);
    setFormActivo(anuncio.activo);
    setFormLinkAccion(anuncio.linkAccion || '');
    setFormTextoBoton(anuncio.textoBoton || '');
    setFormDestacado(anuncio.destacado ?? true);
    setModalAnuncioOpen(true);
  };

  const handleGuardarAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formDescripcion.trim()) {
      alert('Por favor ingrese el título y la descripción del comunicado.');
      return;
    }

    const id = anuncioEnEdicion ? anuncioEnEdicion.id : `slide-${Date.now()}`;
    const fecha = anuncioEnEdicion ? anuncioEnEdicion.fechaPublicacion : new Date().toISOString().split('T')[0];

    const nuevoAnuncio: AnuncioSlide = {
      id,
      titulo: formTitulo.trim(),
      subtitulo: formSubtitulo.trim() || undefined,
      categoria: formCategoria,
      imagenUrl: formImagenUrl.trim() || PLANTILLAS_IMAGENES_ANUNCIOS[0].url,
      descripcion: formDescripcion.trim(),
      fechaPublicacion: fecha,
      activo: formActivo,
      orden: anuncioEnEdicion ? anuncioEnEdicion.orden : anuncios.length + 1,
      autorNombre: currentUser?.nombre || 'Dirección de Gestión Humana',
      linkAccion: formLinkAccion.trim() || undefined,
      textoBoton: formTextoBoton.trim() || undefined,
      destacado: formDestacado
    };

    let actualizados: AnuncioSlide[];
    if (anuncioEnEdicion) {
      actualizados = anuncios.map(a => (a.id === id ? nuevoAnuncio : a));
    } else {
      actualizados = [nuevoAnuncio, ...anuncios];
    }

    persistirAnuncios(actualizados);
    setModalAnuncioOpen(false);

    // Persistir en Firestore en segundo plano
    guardarAnuncioFB(nuevoAnuncio).catch(err => {
      console.warn('No se pudo sincronizar en Firestore, conservado localmente:', err);
    });
  };

  const handleToggleActivo = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const actualizados = anuncios.map(a => {
      if (a.id === id) {
        const mod = { ...a, activo: !a.activo };
        guardarAnuncioFB(mod).catch(console.warn);
        return mod;
      }
      return a;
    });
    persistirAnuncios(actualizados);
  };

  const handleEliminarAnuncio = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('¿Está seguro de eliminar este comunicado del muro de noticias?')) return;
    const actualizados = anuncios.filter(a => a.id !== id);
    persistirAnuncios(actualizados);
    eliminarAnuncioFB(id).catch(console.warn);
  };

  // Métricas operativas básicas
  const pendientes = (solicitudes || []).filter(s => s.estado === 'Pendiente');
  const totalEvals = (evaluaciones || []).length;
  const promedioDesempeno = totalEvals > 0
    ? Math.round(evaluaciones.reduce((acc, ev) => acc + (ev.puntajeFinal || 0), 0) / totalEvals)
    : 0;

  const currentSlide = slidesVisibles[currentSlideIdx] || slidesVisibles[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-[#00FF00]" />
              {esAdmin ? 'Tablero Institucional & Muro de Noticias' : 'Mi Tablero de Anuncios'}
            </span>
            <span className="text-xs text-[#282829] font-medium hidden sm:inline">
              B GROUP INGENIERIA S.A.S.
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18235C]">
            {esAdmin ? 'Tablero de Resumen & Comunicaciones' : 'Tablero de Anuncios y Novedades'}
          </h1>
          <p className="text-xs sm:text-sm text-[#282829] mt-0.5 max-w-2xl font-normal">
            {esAdmin
              ? 'Muro interactivo institucional con gestión de slides informativos para colaboradores y seguimiento ejecutivo de indicadores.'
              : 'Espacio informativo oficial. Mantente al día con comunicados de seguridad, bienestar, convocatorias y trámites laborales.'}
          </p>
        </div>

        {/* Acciones principales de cabecera */}
        <div className="flex flex-wrap items-center gap-2">
          {esAdmin && (
            <>
              {/* Botón publicar nuevo slide */}
              <button
                onClick={abrirCrearAnuncio}
                className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                title="Publicar una nueva imagen o slide con comunicado"
              >
                <Plus className="w-4 h-4 text-[#00FF00]" />
                <span>Publicar Anuncio / Slide</span>
              </button>

              {/* Selector de pestañas para administradores */}
              <div className="bg-slate-100 p-1 rounded-lg border border-[#8FA7D6] flex text-xs font-bold">
                <button
                  onClick={() => setTabAdmin('anuncios')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    tabAdmin === 'anuncios'
                      ? 'bg-[#18235C] text-white shadow-2xs'
                      : 'text-[#18235C] hover:bg-white'
                  }`}
                >
                  Muro de Noticias
                </button>
                <button
                  onClick={() => setTabAdmin('metricas')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    tabAdmin === 'metricas'
                      ? 'bg-[#18235C] text-white shadow-2xs'
                      : 'text-[#18235C] hover:bg-white'
                  }`}
                >
                  Métricas de Gestión
                </button>
              </div>
            </>
          )}

          {!esAdmin && (
            <button
              onClick={() => onNavigate('evaluaciones')}
              className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Mi Evaluación</span>
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: TABLERO DE ANUNCIOS & MURO DE NOTICIAS (Slides para Empleados y Administrador) */}
      {(!esAdmin || tabAdmin === 'anuncios') && (
        <div className="space-y-6">
          {/* CARRUSEL DE SLIDES DE ALTO IMPACTO */}
          {slidesVisibles.length > 0 ? (
            <div
              className="relative rounded-2xl overflow-hidden border border-[#8FA7D6] shadow-md bg-[#18235C] min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] flex flex-col justify-end text-white"
              onMouseEnter={() => setAutoPlay(false)}
              onMouseLeave={() => setAutoPlay(true)}
            >
              {/* Imagen de fondo del Slide */}
              <div className="absolute inset-0 z-0">
                <img
                  src={currentSlide.imagenUrl}
                  alt={currentSlide.titulo}
                  className="w-full h-full object-cover transition-opacity duration-700 brightness-[0.75]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101740] via-[#101740]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#101740]/80 via-transparent to-transparent" />
              </div>

              {/* Contenido superpuesto del Slide */}
              <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-3xl space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#00FF00] text-[#18235C] shadow-xs">
                    {currentSlide.categoria}
                  </span>
                  <span className="text-xs text-[#8FA7D6] font-medium bg-[#101740]/80 px-2.5 py-1 rounded-full border border-[#8FA7D6]/30 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Publicado: {currentSlide.fechaPublicacion}
                  </span>
                  {currentSlide.autorNombre && (
                    <span className="text-xs text-white/80 hidden sm:inline-block">
                      • {currentSlide.autorNombre}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif leading-tight text-white drop-shadow-sm">
                  {currentSlide.titulo}
                </h2>

                {currentSlide.subtitulo && (
                  <p className="text-sm sm:text-base text-[#8FA7D6] font-medium leading-snug drop-shadow-xs">
                    {currentSlide.subtitulo}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-2xl pt-1">
                  {currentSlide.descripcion}
                </p>

                {/* Botones de acción del slide */}
                <div className="flex items-center gap-3 pt-3 flex-wrap">
                  <button
                    onClick={() => setSlideDetalle(currentSlide)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-[#18235C] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Leer Noticia Completa</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#18235C]" />
                  </button>

                  {currentSlide.linkAccion && (
                    <button
                      onClick={() => onNavigate(currentSlide.linkAccion!)}
                      className="px-4 py-2 bg-[#00FF00] hover:bg-[#00e600] text-[#18235C] font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{currentSlide.textoBoton || 'Acceder al Módulo'}</span>
                    </button>
                  )}

                  {esAdmin && (
                    <button
                      onClick={() => abrirEditarAnuncio(currentSlide)}
                      className="px-3 py-2 bg-[#101740]/80 hover:bg-[#101740] text-white border border-[#8FA7D6]/40 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Editar este slide informativo"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#8FA7D6]" />
                      <span>Editar Slide</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Controles de Navegación del Carrusel */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <button
                  onClick={() => setCurrentSlideIdx(prev => (prev === 0 ? slidesVisibles.length - 1 : prev - 1))}
                  className="w-8 h-8 rounded-full bg-[#101740]/80 hover:bg-[#18235C] text-white flex items-center justify-center border border-[#8FA7D6]/40 transition-colors cursor-pointer shadow-xs"
                  title="Anuncio anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentSlideIdx(prev => (prev + 1) % slidesVisibles.length)}
                  className="w-8 h-8 rounded-full bg-[#101740]/80 hover:bg-[#18235C] text-white flex items-center justify-center border border-[#8FA7D6]/40 transition-colors cursor-pointer shadow-xs"
                  title="Siguiente anuncio"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Indicadores de Puntos */}
              <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
                {slidesVisibles.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIdx(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlideIdx === idx
                        ? 'w-6 bg-[#00FF00]'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    title={`Ver slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-[#8FA7D6] rounded-2xl space-y-3">
              <Megaphone className="w-12 h-12 text-[#18235C] mx-auto opacity-50" />
              <h3 className="font-bold text-base text-[#18235C]">
                No hay comunicados publicados en este momento
              </h3>
              <p className="text-xs text-[#282829] max-w-md mx-auto">
                {esAdmin
                  ? 'Como administrador, puedes hacer clic en "Publicar Anuncio / Slide" para crear y socializar imágenes y noticias con todos los colaboradores de la empresa.'
                  : 'La Dirección de Gestión Humana y SG-SST publicará los próximos avisos, capacitaciones y actividades en este espacio.'}
              </p>
              {esAdmin && (
                <button
                  onClick={abrirCrearAnuncio}
                  className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg inline-flex items-center gap-2 mt-2 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#00FF00]" />
                  <span>Crear Primer Slide</span>
                </button>
              )}
            </div>
          )}

          {/* ACCESOS RÁPIDOS DEL COLABORADOR (SOLO SI ES VISTA EMPLEADO O EMPLEADO AUDITANDO) */}
          {!esAdmin && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => onNavigate('nomina')}
                className="p-3.5 bg-white hover:bg-slate-50 border border-[#8FA7D6] rounded-xl text-left transition-all shadow-xs hover:shadow-sm flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#18235C]/10 group-hover:bg-[#18235C] text-[#18235C] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#18235C]">Mi Desprendible</div>
                  <div className="text-[11px] text-[#282829] leading-tight">Consulta de pagos y nómina</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('vacaciones')}
                className="p-3.5 bg-white hover:bg-slate-50 border border-[#8FA7D6] rounded-xl text-left transition-all shadow-xs hover:shadow-sm flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#18235C]/10 group-hover:bg-[#18235C] text-[#18235C] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Palmtree className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#18235C]">Mis Vacaciones</div>
                  <div className="text-[11px] text-[#282829] leading-tight">Días hábiles y solicitudes</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('epps')}
                className="p-3.5 bg-white hover:bg-slate-50 border border-[#8FA7D6] rounded-xl text-left transition-all shadow-xs hover:shadow-sm flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#18235C]/10 group-hover:bg-[#18235C] text-[#18235C] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <HardHat className="w-5 h-5 text-amber-600 group-hover:text-white" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#18235C]">Solicitar EPPs</div>
                  <div className="text-[11px] text-[#282829] leading-tight">Dotación y protección</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('votaciones-sst')}
                className="p-3.5 bg-white hover:bg-slate-50 border border-[#8FA7D6] rounded-xl text-left transition-all shadow-xs hover:shadow-sm flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#18235C]/10 group-hover:bg-[#18235C] text-[#18235C] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Vote className="w-5 h-5 text-blue-600 group-hover:text-white" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#18235C]">Votaciones SST</div>
                  <div className="text-[11px] text-[#282829] leading-tight">COPASST y Convivencia</div>
                </div>
              </button>
            </div>
          )}

          {/* PANEL DE GESTIÓN DE SLIDES (EXCLUSIVO ADMINISTRADOR) */}
          {esAdmin && (
            <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8FA7D6]/40 pb-3">
                <div>
                  <h3 className="font-bold text-base text-[#18235C] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#18235C]" />
                    Gestión y Control de Publicaciones en el Muro (Potestad del Administrador)
                  </h3>
                  <p className="text-xs text-[#282829] mt-0.5">
                    Activa, oculta, edita o elimina los slides que visualizan los colaboradores en su portal institucional.
                  </p>
                </div>

                <button
                  onClick={abrirCrearAnuncio}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>Nuevo Slide</span>
                </button>
              </div>

              {/* Lista de gestión de slides */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {anuncios.map(anuncio => (
                  <div
                    key={anuncio.id}
                    className={`rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                      anuncio.activo
                        ? 'bg-white border-[#8FA7D6] shadow-xs'
                        : 'bg-slate-50 border-slate-300 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Miniatura de imagen */}
                      <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                        <img
                          src={anuncio.imagenUrl}
                          alt={anuncio.titulo}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C] text-white shadow-2xs">
                            {anuncio.categoria}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs ${
                            anuncio.activo
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {anuncio.activo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {anuncio.activo ? 'Visible a Empleados' : 'Oculto'}
                          </span>
                        </div>
                      </div>

                      {/* Info del slide */}
                      <div className="p-3.5 space-y-1.5">
                        <h4 className="font-bold text-xs text-[#18235C] line-clamp-2 leading-snug">
                          {anuncio.titulo}
                        </h4>
                        <p className="text-[11px] text-[#282829] line-clamp-2 leading-relaxed">
                          {anuncio.descripcion}
                        </p>
                        <div className="text-[10px] text-[#8FA7D6] font-medium pt-1">
                          Fecha: {anuncio.fechaPublicacion}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción del administrador */}
                    <div className="p-3 bg-slate-50 border-t border-[#8FA7D6]/30 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => handleToggleActivo(anuncio.id, e)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          anuncio.activo
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                        }`}
                        title={anuncio.activo ? 'Ocultar a los empleados' : 'Hacer visible a los empleados'}
                      >
                        {anuncio.activo ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{anuncio.activo ? 'Desactivar' : 'Activar'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => abrirEditarAnuncio(anuncio)}
                          className="p-1.5 rounded hover:bg-slate-200 text-[#18235C] transition-colors cursor-pointer"
                          title="Editar contenido o imagen"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleEliminarAnuncio(anuncio.id, e)}
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MURO DE NOTICIAS Y SOCIALIZACIÓN (GRID COMPLETO DE COMUNICADOS ACTIVOS) */}
          <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/40 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#18235C] flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#18235C]" />
                  Muro de Comunicaciones y Novedades Institucionales
                </h3>
                <p className="text-xs text-[#282829] mt-0.5">
                  Consulta el historial de campañas de SST, circulares informativas y actividades de la compañía.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-[#18235C] border border-[#8FA7D6]/40">
                {slidesVisibles.length} publicaciones activas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {slidesVisibles.map(noticia => (
                <div
                  key={noticia.id}
                  onClick={() => setSlideDetalle(noticia)}
                  className="group rounded-xl border border-[#8FA7D6] bg-white hover:border-[#18235C] hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                      <img
                        src={noticia.imagenUrl}
                        alt={noticia.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18235C] text-[#00FF00] shadow-sm">
                          {noticia.categoria}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="text-[10px] text-[#8FA7D6] font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {noticia.fechaPublicacion}
                      </div>

                      <h4 className="font-bold text-sm text-[#18235C] leading-snug group-hover:text-[#101740] transition-colors">
                        {noticia.titulo}
                      </h4>

                      {noticia.subtitulo && (
                        <p className="text-xs text-[#282829] font-medium line-clamp-1">
                          {noticia.subtitulo}
                        </p>
                      )}

                      <p className="text-xs text-[#282829]/80 line-clamp-3 leading-relaxed">
                        {noticia.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between text-xs font-bold text-[#18235C] group-hover:text-[#101740]">
                    <span>Leer comunicado</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: MÉTRICAS & GESTIÓN OPERATIVA (EXCLUSIVO ADMINISTRADOR) */}
      {esAdmin && tabAdmin === 'metricas' && (
        <div className="space-y-6">
          {/* Production & Cloud Database Readiness Banner */}
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#8FA7D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#282829] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#18235C] text-[#00FF00] flex items-center justify-center shrink-0 border border-[#8FA7D6]">
                <Cloud className="w-5 h-5 text-[#00FF00]" />
              </div>
              <div>
                <div className="font-bold text-[#18235C] flex items-center gap-1.5">
                  <span>Base de Datos en la Nube Firebase Firestore: Activa & Sincronizada</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FF00] text-[#18235C]">PRODUCCIÓN</span>
                </div>
                <div className="text-[11px] text-[#282829]">
                  {empleados.length > 0
                    ? `${empleados.length} colaboradores en base de datos. Para iniciar en limpio para su empresa, use el asistente de limpieza.`
                    : 'La base de datos se encuentra limpia y lista para registrar su nómina y colaboradores reales.'}
                </div>
              </div>
            </div>

            {onOpenGestionDatos && (
              <button
                onClick={onOpenGestionDatos}
                className="shrink-0 px-3 py-1.5 bg-[#8FA7D6] hover:bg-[#18235C] hover:text-white text-[#18235C] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Gestión de Base de Datos</span>
              </button>
            )}
          </div>

          {/* Tarjetas de Estadísticas Operativas Básicas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6]/50 shadow-sm border-t-4 border-t-[#18235C]">
              <div className="flex items-center justify-between text-[#282829] mb-1">
                <span className="text-xs uppercase font-bold tracking-wider text-[#18235C]">Cargos Formalizados</span>
                <Briefcase className="w-4 h-4 text-[#8FA7D6]" />
              </div>
              <div className="text-3xl font-extrabold text-[#18235C]">{cargos.length}</div>
              <span className="text-[11px] text-[#282829] font-medium">Manual de funciones activo</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6]/50 shadow-sm border-t-4 border-t-[#18235C]">
              <div className="flex items-center justify-between text-[#282829] mb-1">
                <span className="text-xs uppercase font-bold tracking-wider text-[#18235C]">Empleados Activos</span>
                <Users className="w-4 h-4 text-[#8FA7D6]" />
              </div>
              <div className="text-3xl font-extrabold text-[#18235C]">{empleados.length}</div>
              <span className="text-[11px] text-[#282829] font-medium">Hojas de vida vinculadas</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6]/50 shadow-sm border-t-4 border-t-[#8FA7D6]">
              <div className="flex items-center justify-between text-[#282829] mb-1">
                <span className="text-xs uppercase font-bold tracking-wider text-[#18235C]">Solicitudes Pendientes</span>
                <Clock className="w-4 h-4 text-[#8FA7D6]" />
              </div>
              <div className="text-3xl font-extrabold text-[#18235C]">{pendientes.length}</div>
              <span className="text-[11px] text-[#282829] font-medium">Por aprobar o rechazar</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6]/50 shadow-sm border-t-4 border-t-[#18235C]">
              <div className="flex items-center justify-between text-[#282829] mb-1">
                <span className="text-xs uppercase font-bold tracking-wider text-[#18235C]">Evaluaciones Realizadas</span>
                <Award className="w-4 h-4 text-[#8FA7D6]" />
              </div>
              <div className="text-3xl font-extrabold text-[#18235C]">{totalEvals}</div>
              <span className="text-[11px] text-[#282829] font-medium">Modelo técnico de 100 pts</span>
            </div>
          </div>

          {/* Panel de Solicitudes Pendientes con Tabla Institucional */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#8FA7D6]/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#18235C]">
                Solicitudes pendientes por revisar
              </h2>
              <button
                onClick={() => onNavigate('solicitudes')}
                className="text-xs font-bold text-[#18235C] hover:text-[#8FA7D6] transition-colors"
              >
                Gestionar todas ({solicitudes.length})
              </button>
            </div>

            {pendientes.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[#8FA7D6]/40">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#18235C] text-white">
                      <th className="py-3 px-4 font-bold">Colaborador</th>
                      <th className="py-3 px-4 font-bold">Tipo</th>
                      <th className="py-3 px-4 font-bold">Periodo</th>
                      <th className="py-3 px-4 font-bold">Motivo</th>
                      <th className="py-3 px-4 font-bold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8FA7D6]/30">
                    {pendientes.map((s, i) => {
                      const emp = empleados.find(e => e.id === s.empleadoId);
                      return (
                        <tr key={s.id} className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#8FA7D6]/10'}>
                          <td className="py-3 px-4 font-semibold text-[#18235C]">
                            {emp ? emp.nombre : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8FA7D6]/20 text-[#18235C] border border-[#8FA7D6]/40">
                              {s.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#282829] font-medium">
                            {s.inicio} al {s.fin}
                          </td>
                          <td className="py-3 px-4 text-[#282829] max-w-xs truncate">
                            {s.motivo}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onNavigate('solicitudes')}
                              className="px-3 py-1 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-md transition-colors"
                            >
                              Resolver
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-[#282829]">
                No hay solicitudes pendientes en la bandeja de entrada.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR / EDITAR ANUNCIO SLIDE (ADMINISTRADOR) */}
      {modalAnuncioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/40 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#18235C]" />
                <h3 className="font-bold text-lg text-[#18235C]">
                  {anuncioEnEdicion ? 'Editar Comunicado / Slide' : 'Publicar Nuevo Comunicado en Muro'}
                </h3>
              </div>
              <button
                onClick={() => setModalAnuncioOpen(false)}
                className="text-[#282829] hover:text-[#18235C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarAnuncio} className="space-y-4 text-xs">
              {/* Título y Subtítulo */}
              <div className="space-y-1">
                <label className="font-bold text-[#18235C] block">
                  Título Principal del Comunicado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Campaña de Seguridad SG-SST: Uso obligatorio de EPPs"
                  value={formTitulo}
                  onChange={e => setFormTitulo(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Subtítulo o Bajada Informativa
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Resolución 2400 de 1979 - Todo el personal operativo"
                    value={formSubtitulo}
                    onChange={e => setFormSubtitulo(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Categoría Temática
                  </label>
                  <select
                    value={formCategoria}
                    onChange={e => setFormCategoria(e.target.value as CategoriaAnuncio)}
                    className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs font-semibold text-[#18235C]"
                  >
                    <option value="Comunicado Oficial">Comunicado Oficial</option>
                    <option value="Seguridad & SG-SST">Seguridad & SG-SST</option>
                    <option value="Bienestar & Salud">Bienestar & Salud</option>
                    <option value="Capacitación & Desarrollo">Capacitación & Desarrollo</option>
                    <option value="Logros & Reconocimientos">Logros & Reconocimientos</option>
                    <option value="Democracia & Votaciones">Democracia & Votaciones</option>
                    <option value="Beneficios & Nómina">Beneficios & Nómina</option>
                  </select>
                </div>
              </div>

              {/* Selección de Imagen (Plantillas rápidas o URL personalizada) */}
              <div className="space-y-2">
                <label className="font-bold text-[#18235C] flex items-center justify-between">
                  <span>Imagen del Slide / Banner *</span>
                  <span className="text-[10px] text-[#8FA7D6] font-normal">Elige una plantilla o ingresa una URL</span>
                </label>

                {/* Plantillas predefinidas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PLANTILLAS_IMAGENES_ANUNCIOS.map((plantilla, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormImagenUrl(plantilla.url)}
                      className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        formImagenUrl === plantilla.url
                          ? 'border-[#18235C] bg-[#18235C]/10 ring-2 ring-[#18235C]'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={plantilla.url}
                        alt={plantilla.nombre}
                        className="w-10 h-8 rounded object-cover shrink-0"
                      />
                      <span className="text-[10px] font-semibold text-[#18235C] line-clamp-1">
                        {plantilla.nombre}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <input
                    type="url"
                    placeholder="O pega aquí una URL directa de imagen (https://...)"
                    value={formImagenUrl}
                    onChange={e => setFormImagenUrl(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Descripción / Contenido */}
              <div className="space-y-1">
                <label className="font-bold text-[#18235C] block">
                  Descripción o Texto del Comunicado *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detalla la información que los colaboradores necesitan conocer..."
                  value={formDescripcion}
                  onChange={e => setFormDescripcion(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs leading-relaxed"
                />
              </div>

              {/* Módulo de acción rápida opcional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Enlace / Módulo Sugerido (Opcional)
                  </label>
                  <select
                    value={formLinkAccion}
                    onChange={e => setFormLinkAccion(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs"
                  >
                    <option value="">Sin botón de acción</option>
                    <option value="epps">Módulo de EPPs & Dotación</option>
                    <option value="votaciones-sst">Módulo de Votaciones SST</option>
                    <option value="capacitaciones">Módulo de Capacitaciones</option>
                    <option value="vacaciones">Módulo de Vacaciones</option>
                    <option value="nomina">Módulo de Nómina y Desprendibles</option>
                    <option value="evaluaciones">Módulo de Evaluación de Desempeño</option>
                    <option value="solicitudes">Módulo de Solicitudes y Permisos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Texto del Botón de Acción
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Ir a Votar, Solicitar EPP, Ver Detalle"
                    value={formTextoBoton}
                    onChange={e => setFormTextoBoton(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs"
                  />
                </div>
              </div>

              {/* Potestad de Administrador: Visibilidad para Empleados */}
              <div className="pt-2 p-3 bg-slate-50 rounded-xl border border-[#8FA7D6]/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Visibilidad en el Perfil de Empleado (Potestad de Administrador)</span>
                  </div>
                  <div className="text-[11px] text-[#282829]">
                    Si está marcado, el colaborador podrá ver este slide en su muro de noticias y carrusel.
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActivo}
                    onChange={e => setFormActivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18235C]"></div>
                </label>
              </div>

              {/* Botones del Formulario */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]/30">
                <button
                  type="button"
                  onClick={() => setModalAnuncioOpen(false)}
                  className="px-4 py-2 border border-[#8FA7D6] text-[#282829] hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#00FF00]" />
                  <span>{anuncioEnEdicion ? 'Guardar Cambios' : 'Publicar Inmediatamente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VER DETALLE COMPLETO DE UN COMUNICADO (PARA EMPLEADOS Y ADMIN) */}
      {slideDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 my-8 animate-fade-in">
            {/* Cabecera con imagen */}
            <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-[#18235C]">
              <img
                src={slideDetalle.imagenUrl}
                alt={slideDetalle.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <button
                onClick={() => setSlideDetalle(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00FF00] text-[#18235C]">
                  {slideDetalle.categoria}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
                  {slideDetalle.titulo}
                </h3>
                {slideDetalle.subtitulo && (
                  <p className="text-xs text-slate-200">{slideDetalle.subtitulo}</p>
                )}
              </div>
            </div>

            {/* Cuerpo del comunicado */}
            <div className="p-6 space-y-4 text-xs text-[#282829]">
              <div className="flex items-center justify-between text-[11px] text-[#8FA7D6] border-b border-[#8FA7D6]/30 pb-3">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#18235C]" />
                  Fecha de Publicación: {slideDetalle.fechaPublicacion}
                </span>
                {slideDetalle.autorNombre && (
                  <span className="font-semibold text-[#18235C]">
                    Emisor: {slideDetalle.autorNombre}
                  </span>
                )}
              </div>

              <div className="text-xs sm:text-sm leading-relaxed text-[#282829] whitespace-pre-line">
                {slideDetalle.descripcion}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-[#8FA7D6]/40 text-[11px] text-[#18235C] font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Comunicado oficial socializado por B GROUP INGENIERIA S.A.S. para toda la planta de personal.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#8FA7D6]/30">
                {slideDetalle.linkAccion && (
                  <button
                    onClick={() => {
                      const link = slideDetalle.linkAccion!;
                      setSlideDetalle(null);
                      onNavigate(link);
                    }}
                    className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>{slideDetalle.textoBoton || 'Acceder al Módulo'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#00FF00]" />
                  </button>
                )}
                <button
                  onClick={() => setSlideDetalle(null)}
                  className="px-4 py-2 border border-[#8FA7D6] text-[#282829] hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
