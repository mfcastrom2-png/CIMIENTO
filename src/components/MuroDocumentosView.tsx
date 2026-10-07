import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Filter,
  ShieldCheck,
  Tag,
  Clock,
  Trash2,
  Edit3,
  X,
  FileCheck,
  Sparkles,
  Link as LinkIcon,
  Maximize2,
  Layers,
  HelpCircle,
  Lock
} from 'lucide-react';
import { DocumentoMuroPDF, CategoriaDocumentoMuro, UsuarioSistema } from '../types';
import { INITIAL_DOCUMENTOS_MURO, CATEGORIAS_DOCUMENTOS_MURO } from '../data/documentosMuroData';
import {
  esUrlGoogleDrive,
  convertirUrlGoogleDriveAPdf,
  extraerIdGoogleDrive
} from '../utils/googleDriveUtils';
import {
  guardarDocumentoMuroFB,
  eliminarDocumentoMuroFB,
  obtenerDocumentosMuroFB
} from '../lib/firebase';

interface MuroDocumentosViewProps {
  currentUser: UsuarioSistema | null;
  esAdmin: boolean;
}

export const MuroDocumentosView: React.FC<MuroDocumentosViewProps> = ({
  currentUser,
  esAdmin
}) => {
  // Estado de documentos
  const [documentos, setDocumentos] = useState<DocumentoMuroPDF[]>(() => {
    try {
      const guardados = localStorage.getItem('bgroup_documentos_muro');
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DOCUMENTOS_MURO;
  });

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODAS');
  const [soloObligatorios, setSoloObligatorios] = useState(false);

  // Modal de visualización de PDF
  const [docVisor, setDocVisor] = useState<DocumentoMuroPDF | null>(null);
  const [lecturasConfirmadas, setLecturasConfirmadas] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`bgroup_lecturas_${currentUser?.id || 'anon'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal Crear / Editar Documento (Administrador)
  const [modalDocOpen, setModalDocOpen] = useState(false);
  const [docEnEdicion, setDocEnEdicion] = useState<DocumentoMuroPDF | null>(null);

  // Formulario de documento
  const [formTitulo, setFormTitulo] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formCategoria, setFormCategoria] = useState<CategoriaDocumentoMuro>('Reglamentos & Políticas');
  const [formUrlPdf, setFormUrlPdf] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formNombreArchivo, setFormNombreArchivo] = useState('');
  const [formTamanoAprox, setFormTamanoAprox] = useState('');
  const [formNumPaginas, setFormNumPaginas] = useState<number | ''>('');
  const [formObligatorio, setFormObligatorio] = useState(false);
  const [formDestacado, setFormDestacado] = useState(false);
  const [formActivo, setFormActivo] = useState(true);
  const [formTags, setFormTags] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Sincronización inicial con Firestore
  useEffect(() => {
    let activo = true;
    obtenerDocumentosMuroFB()
      .then(fbDocs => {
        if (activo && fbDocs && fbDocs.length > 0) {
          setDocumentos(fbDocs);
          try {
            localStorage.setItem('bgroup_documentos_muro', JSON.stringify(fbDocs));
          } catch {}
        }
      })
      .catch(console.warn);

    return () => {
      activo = false;
    };
  }, []);

  const persistirDocumentos = (nuevos: DocumentoMuroPDF[]) => {
    setDocumentos(nuevos);
    try {
      localStorage.setItem('bgroup_documentos_muro', JSON.stringify(nuevos));
    } catch {}
  };

  // Filtrado de documentos según rol y parámetros de búsqueda
  const docsFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      // Si no es admin, solo ver documentos marcados como activos para empleados
      if (!esAdmin && !doc.activo) return false;

      // Filtro por categoría
      if (categoriaSeleccionada !== 'TODAS' && doc.categoria !== categoriaSeleccionada) {
        return false;
      }

      // Filtro de obligatorios
      if (soloObligatorios && !doc.obligatorioLectura) {
        return false;
      }

      // Filtro de texto libre
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideTitulo = doc.titulo.toLowerCase().includes(query);
        const coincideDesc = doc.descripcion.toLowerCase().includes(query);
        const coincideCodigo = doc.codigoDocumento?.toLowerCase().includes(query) || false;
        const coincideTags = doc.tags?.some(t => t.toLowerCase().includes(query)) || false;
        if (!coincideTitulo && !coincideDesc && !coincideCodigo && !coincideTags) {
          return false;
        }
      }

      return true;
    });
  }, [documentos, esAdmin, categoriaSeleccionada, soloObligatorios, busqueda]);

  // Contadores por categoría
  const conteoPorCategoria = useMemo(() => {
    const counts: Record<string, number> = { TODAS: 0 };
    documentos.forEach(doc => {
      if (!esAdmin && !doc.activo) return;
      counts.TODAS = (counts.TODAS || 0) + 1;
      counts[doc.categoria] = (counts[doc.categoria] || 0) + 1;
    });
    return counts;
  }, [documentos, esAdmin]);

  // Abrir Modal de Creación
  const abrirCrearDoc = () => {
    setErrorForm(null);
    setDocEnEdicion(null);
    setFormTitulo('');
    setFormCodigo('');
    setFormVersion('v1.0');
    setFormCategoria('Reglamentos & Políticas');
    setFormUrlPdf('');
    setFormDescripcion('');
    setFormNombreArchivo('');
    setFormTamanoAprox('1.2 MB');
    setFormNumPaginas('');
    setFormObligatorio(false);
    setFormDestacado(false);
    setFormActivo(true);
    setFormTags('');
    setModalDocOpen(true);
  };

  // Abrir Modal de Edición
  const abrirEditarDoc = (doc: DocumentoMuroPDF, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setErrorForm(null);
    setDocEnEdicion(doc);
    setFormTitulo(doc.titulo);
    setFormCodigo(doc.codigoDocumento || '');
    setFormVersion(doc.version || 'v1.0');
    setFormCategoria(doc.categoria);
    setFormUrlPdf(doc.urlPdf);
    setFormDescripcion(doc.descripcion);
    setFormNombreArchivo(doc.nombreArchivo || '');
    setFormTamanoAprox(doc.tamanoAprox || '');
    setFormNumPaginas(doc.numPaginas || '');
    setFormObligatorio(doc.obligatorioLectura || false);
    setFormDestacado(doc.destacado || false);
    setFormActivo(doc.activo);
    setFormTags((doc.tags || []).join(', '));
    setModalDocOpen(true);
  };

  // Guardar Documento
  const handleGuardarDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);

    if (!formTitulo.trim() || !formUrlPdf.trim() || !formDescripcion.trim()) {
      setErrorForm('Por favor completa el título, la URL del PDF y la descripción.');
      return;
    }

    const id = docEnEdicion ? docEnEdicion.id : `doc-muro-${Date.now()}`;
    const fechaPub = docEnEdicion ? docEnEdicion.fechaPublicacion : new Date().toISOString().split('T')[0];

    // Si es enlace de Google Drive, optimizarlo para visualización previa
    const urlFinal = esUrlGoogleDrive(formUrlPdf)
      ? convertirUrlGoogleDriveAPdf(formUrlPdf)
      : formUrlPdf.trim();

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const nuevoDoc: DocumentoMuroPDF = {
      id,
      titulo: formTitulo.trim(),
      descripcion: formDescripcion.trim(),
      categoria: formCategoria,
      urlPdf: urlFinal,
      nombreArchivo: formNombreArchivo.trim() || `${formTitulo.replace(/\s+/g, '_')}.pdf`,
      codigoDocumento: formCodigo.trim() || undefined,
      version: formVersion.trim() || 'v1.0',
      fechaPublicacion: fechaPub,
      fechaActualizacion: docEnEdicion ? new Date().toISOString().split('T')[0] : undefined,
      tamanoAprox: formTamanoAprox.trim() || undefined,
      numPaginas: typeof formNumPaginas === 'number' && formNumPaginas > 0 ? formNumPaginas : undefined,
      obligatorioLectura: formObligatorio,
      destacado: formDestacado,
      activo: formActivo,
      autorNombre: currentUser?.nombre || 'Gestión Humana & Jurídica',
      tags: tagsArray.length > 0 ? tagsArray : undefined
    };

    let actualizados: DocumentoMuroPDF[];
    if (docEnEdicion) {
      actualizados = documentos.map(d => (d.id === id ? nuevoDoc : d));
    } else {
      actualizados = [nuevoDoc, ...documentos];
    }

    persistirDocumentos(actualizados);
    setModalDocOpen(false);

    guardarDocumentoMuroFB(nuevoDoc).catch(err => {
      console.warn('No se pudo sincronizar en Firestore, guardado local:', err);
    });
  };

  // Alternar visibilidad activa para empleados
  const handleToggleActivo = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const actualizados = documentos.map(d => {
      if (d.id === id) {
        const mod = { ...d, activo: !d.activo };
        guardarDocumentoMuroFB(mod).catch(console.warn);
        return mod;
      }
      return d;
    });
    persistirDocumentos(actualizados);
  };

  // Eliminar documento
  const handleEliminarDoc = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('¿Está seguro de eliminar este documento del muro de consulta institucional?')) return;
    const actualizados = documentos.filter(d => d.id !== id);
    persistirDocumentos(actualizados);
    eliminarDocumentoMuroFB(id).catch(console.warn);
  };

  // Confirmar lectura
  const handleConfirmarLectura = (docId: string) => {
    const nuevo = { ...lecturasConfirmadas, [docId]: true };
    setLecturasConfirmadas(nuevo);
    try {
      localStorage.setItem(`bgroup_lecturas_${currentUser?.id || 'anon'}`, JSON.stringify(nuevo));
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner / Cabecera del Muro de Documentos */}
      <div className="bg-gradient-to-r from-[#18235C] via-[#101740] to-[#18235C] rounded-2xl p-6 sm:p-8 text-white border border-[#8FA7D6]/40 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8FA7D6]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/30 flex items-center gap-1.5 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5" />
                Muro Oficial de Documentos & Políticas
              </span>
              <span className="text-xs text-[#8FA7D6] font-medium hidden sm:inline">
                B GROUP INGENIERIA S.A.S.
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Repositorio de Documentos Institucionales en PDF
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              Acceso oficial e interactivo a Reglamentos Internos de Trabajo, Políticas de SG-SST, Manuales de Convivencia, Planes de Emergencia y Circulares Corporativas para todos los colaboradores de la organización.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {esAdmin && (
              <button
                onClick={abrirCrearDoc}
                className="px-4 py-2.5 bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
                title="Publicar un nuevo archivo PDF o enlace de Google Drive en el muro"
              >
                <Plus className="w-4 h-4 text-[#18235C]" />
                <span>Publicar Documento PDF</span>
              </button>
            )}

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#00FF00]" />
              <span><strong>{docsFiltrados.length}</strong> documentos disponibles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/40 shadow-xs space-y-4">
        {/* Barra de Búsqueda y Filtro de Obligatorios */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, código (RIT-001, POL-SST), palabras clave o descripción..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-[#8FA7D6]/60 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18235C] transition-colors"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSoloObligatorios(!soloObligatorios)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                soloObligatorios
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                  : 'bg-slate-50 text-[#282829]/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <AlertCircle className={`w-3.5 h-3.5 ${soloObligatorios ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Lectura Obligatoria</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-3">
          <button
            onClick={() => setCategoriaSeleccionada('TODAS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
              categoriaSeleccionada === 'TODAS'
                ? 'bg-[#18235C] text-white shadow-2xs'
                : 'bg-slate-100 text-[#282829]/70 hover:bg-[#8FA7D6]/20 hover:text-[#18235C]'
            }`}
          >
            Todas ({conteoPorCategoria.TODAS || 0})
          </button>
          {CATEGORIAS_DOCUMENTOS_MURO.map(cat => {
            const count = conteoPorCategoria[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  categoriaSeleccionada === cat.id
                    ? 'bg-[#18235C] text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-[#282829]/70 hover:bg-[#8FA7D6]/20 hover:text-[#18235C]'
                }`}
              >
                <span>{cat.nombre}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${categoriaSeleccionada === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Tarjetas de Documentos PDF */}
      {docsFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {docsFiltrados.map(doc => {
            const leido = !!lecturasConfirmadas[doc.id];
            const esDrive = esUrlGoogleDrive(doc.urlPdf);

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden group ${
                  doc.destacado
                    ? 'border-[#18235C]/60 shadow-sm ring-1 ring-[#18235C]/20'
                    : 'border-[#8FA7D6]/40 hover:border-[#18235C]/40'
                } ${!doc.activo ? 'opacity-70 bg-slate-50/80 border-dashed border-rose-300' : ''}`}
              >
                {/* Cabecera de la tarjeta con categoría y badges */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 block max-w-[200px] truncate">
                      {doc.categoria}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.obligatorioLectura && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1" title="Documento de lectura y cumplimiento obligatorio">
                          <AlertCircle className="w-3 h-3 text-amber-700" />
                          <span>Obligatorio</span>
                        </span>
                      )}

                      {esDrive && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1" title="Alojado en Google Drive Corporativo">
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Drive</span>
                        </span>
                      )}

                      {leido && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5" title="Has confirmado la lectura de este documento">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span className="hidden sm:inline">Leído</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título y Código */}
                  <div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono font-semibold mb-1">
                      {doc.codigoDocumento && <span>{doc.codigoDocumento}</span>}
                      {doc.version && <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">{doc.version}</span>}
                      {doc.numPaginas && <span>• {doc.numPaginas} pág.</span>}
                      {doc.tamanoAprox && <span>• {doc.tamanoAprox}</span>}
                    </div>
                    <h3
                      onClick={() => setDocVisor(doc)}
                      className="font-bold text-sm text-[#18235C] leading-snug hover:text-blue-700 cursor-pointer transition-colors line-clamp-2"
                      title={doc.titulo}
                    >
                      {doc.titulo}
                    </h3>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-[#282829]/75 leading-relaxed line-clamp-3">
                    {doc.descripcion}
                  </p>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {doc.tags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-[#282829]/70 rounded-full text-[10px] font-medium flex items-center gap-0.5"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer de la tarjeta con acciones */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-500 font-medium">
                    <span>Publicado: {doc.fechaPublicacion}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón de Visualizar PDF */}
                    <button
                      onClick={() => setDocVisor(doc)}
                      className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Abrir visor interactivo del documento PDF"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>Visualizar</span>
                    </button>

                    {/* Botón de Enlace Externo / Descarga */}
                    <a
                      href={doc.urlPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-600 hover:text-[#18235C] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                      title="Abrir PDF en pestaña independiente o descargar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {/* Acciones de administración */}
                    {esAdmin && (
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5 ml-0.5">
                        <button
                          onClick={e => abrirEditarDoc(doc, e)}
                          className="p-1.5 text-slate-600 hover:text-[#18235C] hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Editar documento"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleToggleActivo(doc.id, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            doc.activo ? 'text-emerald-700 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'
                          }`}
                          title={doc.activo ? 'Visible para empleados (Clic para ocultar)' : 'Oculto para empleados (Clic para publicar)'}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleEliminarDoc(doc.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Eliminar documento del muro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-[#8FA7D6]/40 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-[#18235C] rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No se encontraron documentos en esta sección</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {busqueda || soloObligatorios || categoriaSeleccionada !== 'TODAS'
              ? 'No hay archivos que coincidan con los filtros aplicados. Intenta restablecer los términos de búsqueda.'
              : 'Aún no se han cargado documentos en el muro. Como administrador puedes hacer clic en "Publicar Documento PDF" para agregar reglamentos o enlaces de Google Drive.'}
          </p>
          {(busqueda || soloObligatorios || categoriaSeleccionada !== 'TODAS') && (
            <button
              onClick={() => {
                setBusqueda('');
                setSoloObligatorios(false);
                setCategoriaSeleccionada('TODAS');
              }}
              className="px-3.5 py-1.5 bg-[#18235C] text-white text-xs font-semibold rounded-lg hover:bg-[#101740] transition-colors"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL VISOR INTERACTIVO DE PDF / GOOGLE DRIVE PREVIEW */}
      {/* ========================================================= */}
      {docVisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in my-auto">
            {/* Cabecera del Visor */}
            <div className="p-4 sm:px-6 bg-[#18235C] text-white flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] text-[#8FA7D6] font-mono">
                  {docVisor.codigoDocumento && <span>{docVisor.codigoDocumento}</span>}
                  {docVisor.version && <span>• {docVisor.version}</span>}
                  <span className="bg-white/10 px-2 py-0.2 rounded text-white">{docVisor.categoria}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5" title={docVisor.titulo}>
                  {docVisor.titulo}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={docVisor.urlPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Abrir en pestaña completa o descargar archivo"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span className="hidden sm:inline">Pestaña Completa</span>
                </a>

                <button
                  onClick={() => setDocVisor(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenedor del PDF Embebido / Google Drive Iframe */}
            <div className="flex-1 bg-slate-900 relative overflow-hidden flex items-center justify-center">
              <iframe
                src={convertirUrlGoogleDriveAPdf(docVisor.urlPdf)}
                title={docVisor.titulo}
                className="w-full h-full border-none bg-white"
                allow="autoplay"
              />
            </div>

            {/* Barra Inferior de Confirmación de Lectura */}
            <div className="p-3.5 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Publicado por <strong>{docVisor.autorNombre}</strong> el {docVisor.fechaPublicacion}.
                  {docVisor.obligatorioLectura && (
                    <strong className="text-amber-800 ml-1">Documento de lectura institucional requerida.</strong>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {lecturasConfirmadas[docVisor.id] ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lectura Confirmada</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConfirmarLectura(docVisor.id)}
                    className="px-4 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
                    <span>Marcar como Leído / Enterado</span>
                  </button>
                )}

                <button
                  onClick={() => setDocVisor(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CREAR / EDITAR DOCUMENTO EN PDF (ADMINISTRADOR) */}
      {/* ========================================================= */}
      {modalDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-2xl w-full p-6 space-y-4 my-8 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-[#8FA7D6]/30 pb-3">
              <div>
                <h3 className="font-bold text-[#18235C] text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#18235C]" />
                  <span>{docEnEdicion ? 'Editar Documento del Muro' : 'Publicar Nuevo Documento PDF'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Comparte archivos PDF corporativos o enlaces públicos de Google Drive con los colaboradores.
                </p>
              </div>
              <button
                onClick={() => setModalDocOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarDoc} className="space-y-4 text-xs">
              {errorForm && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              {/* Título */}
              <div className="space-y-1">
                <label className="font-bold text-[#18235C] block">
                  Título del Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Reglamento Interno de Trabajo 2026 / Política de SG-SST"
                  value={formTitulo}
                  onChange={e => setFormTitulo(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs font-medium focus:bg-white"
                />
              </div>

              {/* Código, Versión y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Código Oficial (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: RIT-001, POL-SST-002"
                    value={formCodigo}
                    onChange={e => setFormCodigo(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Versión
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: v2.0"
                    value={formVersion}
                    onChange={e => setFormVersion(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Categoría
                  </label>
                  <select
                    value={formCategoria}
                    onChange={e => setFormCategoria(e.target.value as CategoriaDocumentoMuro)}
                    className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs font-semibold text-[#18235C]"
                  >
                    {CATEGORIAS_DOCUMENTOS_MURO.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL del PDF con soporte nativo de Google Drive */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#18235C] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#18235C]" />
                    <span>URL del Archivo PDF (Google Drive o enlace directo) *</span>
                  </label>
                  {esUrlGoogleDrive(formUrlPdf) && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Google Drive detectado (Preview interactivo)
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  required
                  placeholder="Ej: https://drive.google.com/file/d/1a2b3c.../view?usp=sharing o https://mi-dominio.co/doc.pdf"
                  value={formUrlPdf}
                  onChange={e => setFormUrlPdf(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs font-mono focus:bg-white"
                />
                <p className="text-[10px] text-slate-500">
                  Tip: Puedes pegar el enlace de <strong>Google Drive</strong> con permiso de "Cualquier persona con el enlace puede ver". El sistema lo convertirá automáticamente en visor interactivo.
                </p>
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="font-bold text-[#18235C] block">
                  Descripción o Alcance del Documento *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Resumen del contenido, destinatarios y propósito institucional..."
                  value={formDescripcion}
                  onChange={e => setFormDescripcion(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs leading-relaxed focus:bg-white"
                />
              </div>

              {/* Parámetros Adicionales: Tamaño, Páginas y Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Tamaño aprox.
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 2.1 MB"
                    value={formTamanoAprox}
                    onChange={e => setFormTamanoAprox(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    N° Páginas
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 18"
                    value={formNumPaginas}
                    onChange={e => setFormNumPaginas(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full p-2 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#18235C] block">
                    Tags (separados por coma)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: SST, RIT, Obligatorio"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#8FA7D6] bg-slate-50 text-xs"
                  />
                </div>
              </div>

              {/* Checkboxes de Configuración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formObligatorio}
                    onChange={e => setFormObligatorio(e.target.checked)}
                    className="w-4 h-4 text-[#18235C] rounded"
                  />
                  <div>
                    <span className="font-bold text-[#18235C] block">Lectura Obligatoria</span>
                    <span className="text-[10px] text-slate-500">Exige constancia de lectura al colaborador</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActivo}
                    onChange={e => setFormActivo(e.target.checked)}
                    className="w-4 h-4 text-[#18235C] rounded"
                  />
                  <div>
                    <span className="font-bold text-[#18235C] block">Visible para Empleados</span>
                    <span className="text-[10px] text-slate-500">Publicar de inmediato en el portal</span>
                  </div>
                </label>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]/30">
                <button
                  type="button"
                  onClick={() => setModalDocOpen(false)}
                  className="px-4 py-2 border border-[#8FA7D6] text-[#282829] hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-[#00FF00]" />
                  <span>{docEnEdicion ? 'Guardar Cambios' : 'Publicar Documento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
