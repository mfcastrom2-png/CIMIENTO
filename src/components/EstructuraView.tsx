import React, { useState } from 'react';
import {
  Cargo,
  Empleado,
  AreaOrganizacion,
  ProcesoOrganizacion,
  TipoProceso
} from '../types';
import {
  Plus,
  Users,
  GitFork,
  ChevronRight,
  ChevronDown,
  Check,
  Building2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Search,
  FileText,
  Edit3,
  Layers,
  Network,
  Briefcase,
  AlertTriangle,
  FolderPlus,
  Share2,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { fichaVacia, uid } from '../data/initialData';
import { limpiarEstructuraOrganicaFB } from '../lib/firebase';

interface EstructuraViewProps {
  cargos: Cargo[];
  empleados: Empleado[];
  areas?: AreaOrganizacion[];
  procesos?: ProcesoOrganizacion[];
  onAddCargo: (nuevoCargo: Cargo) => void;
  onUpdateCargo?: (cargoActualizado: Cargo) => void;
  onDeleteCargo?: (cargoId: string) => void;
  onAddArea?: (nuevaArea: AreaOrganizacion) => void;
  onUpdateArea?: (areaActualizada: AreaOrganizacion) => void;
  onDeleteArea?: (areaId: string) => void;
  onAddProceso?: (nuevoProceso: ProcesoOrganizacion) => void;
  onUpdateProceso?: (procesoActualizado: ProcesoOrganizacion) => void;
  onDeleteProceso?: (procesoId: string) => void;
  onSelectCargoForManual: (cargoId: string) => void;
  onDepurarEstructura?: () => void;
  isSuperAdmin?: boolean;
}

export const EstructuraView: React.FC<EstructuraViewProps> = ({
  cargos,
  empleados,
  areas = [],
  procesos = [],
  onAddCargo,
  onUpdateCargo,
  onDeleteCargo,
  onAddArea,
  onUpdateArea,
  onDeleteArea,
  onAddProceso,
  onUpdateProceso,
  onDeleteProceso,
  onSelectCargoForManual,
  onDepurarEstructura,
  isSuperAdmin = false
}) => {
  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'organigrama' | 'mapa_procesos' | 'gestion_areas_procesos'>('organigrama');

  // Modales de Cargos
  const [modalCargoOpen, setModalCargoOpen] = useState(false);
  const [modalEditarCargoOpen, setModalEditarCargoOpen] = useState(false);
  const [cargoAEditar, setCargoAEditar] = useState<Cargo | null>(null);
  const [modalEliminarCargoOpen, setModalEliminarCargoOpen] = useState(false);
  const [cargoAEliminar, setCargoAEliminar] = useState<Cargo | null>(null);

  // Modales de Áreas
  const [modalAreaOpen, setModalAreaOpen] = useState(false);
  const [areaAEditar, setAreaAEditar] = useState<AreaOrganizacion | null>(null);
  const [areaAEliminar, setAreaAEliminar] = useState<AreaOrganizacion | null>(null);

  // Modales de Procesos
  const [modalProcesoOpen, setModalProcesoOpen] = useState(false);
  const [procesoAEditar, setProcesoAEditar] = useState<ProcesoOrganizacion | null>(null);
  const [procesoAEliminar, setProcesoAEliminar] = useState<ProcesoOrganizacion | null>(null);

  // Depuración (Superadmin)
  const [modalDepurarOpen, setModalDepurarOpen] = useState(false);
  const [depurando, setDepurando] = useState(false);

  // Mensaje de éxito
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario Nuevo Cargo
  const [nombreCargo, setNombreCargo] = useState('');
  const [reportaACargo, setReportaACargo] = useState<string>('');
  const [codigoCargo, setCodigoCargo] = useState('');
  const [familiaCargo, setFamiliaCargo] = useState('');
  const [areaCargo, setAreaCargo] = useState('');
  const [procesoCargo, setProcesoCargo] = useState('');

  // Formulario Área
  const [areaFormCodigo, setAreaFormCodigo] = useState('');
  const [areaFormNombre, setAreaFormNombre] = useState('');
  const [areaFormProcesoId, setAreaFormProcesoId] = useState('');
  const [areaFormLider, setAreaFormLider] = useState('');
  const [areaFormDescripcion, setAreaFormDescripcion] = useState('');

  // Formulario Proceso
  const [procesoFormCodigo, setProcesoFormCodigo] = useState('');
  const [procesoFormNombre, setProcesoFormNombre] = useState('');
  const [procesoFormTipo, setProcesoFormTipo] = useState<TipoProceso>('Misional / Operativo');
  const [procesoFormObjetivo, setProcesoFormObjetivo] = useState('');
  const [procesoFormLider, setProcesoFormLider] = useState('');

  // -------------------------------------------------------------
  // ACCIONES DE CARGOS
  // -------------------------------------------------------------
  const handleCreateCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCargo.trim()) return;

    const nuevaFicha = fichaVacia({
      identificacion: {
        codigo: codigoCargo.trim() || `CAR-${Math.floor(100 + Math.random() * 900)}`,
        familia: familiaCargo.trim() || 'General',
        area: areaCargo.trim() || 'Operaciones',
        proceso: procesoCargo.trim() || 'Gestión Integral',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Presencial',
        ubicacion: 'Sede principal Bogotá',
        personalACargo: '0',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: `Garantizar el cumplimiento eficiente y seguro de las actividades correspondientes al cargo de ${nombreCargo}.`,
      historial: [{
        id: uid('h'),
        version: '1.0',
        fecha: new Date().toISOString().slice(0, 10),
        motivo: 'Creación de estructura orgánica de cargo',
        responsable: 'Gestión Humana B GROUP',
        aprobador: 'Gerencia General'
      }]
    });

    const nuevo: Cargo = {
      id: uid('c'),
      nombre: nombreCargo.trim(),
      reportaA: reportaACargo ? reportaACargo : null,
      ficha: nuevaFicha
    };

    onAddCargo(nuevo);
    setNombreCargo('');
    setReportaACargo('');
    setCodigoCargo('');
    setFamiliaCargo('');
    setAreaCargo('');
    setProcesoCargo('');
    setModalCargoOpen(false);
    setMensajeExito(`El cargo "${nuevo.nombre}" ha sido creado e integrado a la estructura organizacional.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const abrirModalEditarCargo = (cargo: Cargo) => {
    setCargoAEditar(cargo);
    setNombreCargo(cargo.nombre);
    setReportaACargo(cargo.reportaA || '');
    setCodigoCargo(cargo.ficha?.identificacion?.codigo || '');
    setFamiliaCargo(cargo.ficha?.identificacion?.familia || '');
    setAreaCargo(cargo.ficha?.identificacion?.area || '');
    setProcesoCargo(cargo.ficha?.identificacion?.proceso || '');
    setModalEditarCargoOpen(true);
  };

  const handleGuardarEdicionCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargoAEditar || !nombreCargo.trim()) return;

    const cargoActualizado: Cargo = {
      ...cargoAEditar,
      nombre: nombreCargo.trim(),
      reportaA: reportaACargo || null,
      ficha: {
        ...cargoAEditar.ficha,
        identificacion: {
          ...cargoAEditar.ficha.identificacion,
          codigo: codigoCargo.trim() || cargoAEditar.ficha.identificacion.codigo,
          familia: familiaCargo.trim() || cargoAEditar.ficha.identificacion.familia,
          area: areaCargo.trim() || cargoAEditar.ficha.identificacion.area,
          proceso: procesoCargo.trim() || cargoAEditar.ficha.identificacion.proceso
        }
      }
    };

    if (onUpdateCargo) {
      onUpdateCargo(cargoActualizado);
    }
    setModalEditarCargoOpen(false);
    setCargoAEditar(null);
    setMensajeExito(`El cargo "${cargoActualizado.nombre}" ha sido actualizado correctamente.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const abrirModalEliminarCargo = (cargo: Cargo) => {
    setCargoAEliminar(cargo);
    setModalEliminarCargoOpen(true);
  };

  const handleConfirmarEliminarCargo = () => {
    if (!cargoAEliminar) return;

    if (onDeleteCargo) {
      onDeleteCargo(cargoAEliminar.id);
    }
    setModalEliminarCargoOpen(false);
    setMensajeExito(`El cargo "${cargoAEliminar.nombre}" ha sido eliminado de la estructura.`);
    setCargoAEliminar(null);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // -------------------------------------------------------------
  // ACCIONES DE ÁREAS
  // -------------------------------------------------------------
  const abrirModalNuevaArea = () => {
    setAreaAEditar(null);
    setAreaFormCodigo(`AR-${Math.floor(100 + Math.random() * 900)}`);
    setAreaFormNombre('');
    setAreaFormProcesoId(procesos[0]?.id || '');
    setAreaFormLider('');
    setAreaFormDescripcion('');
    setModalAreaOpen(true);
  };

  const abrirModalEditarArea = (area: AreaOrganizacion) => {
    setAreaAEditar(area);
    setAreaFormCodigo(area.codigo || '');
    setAreaFormNombre(area.nombre);
    setAreaFormProcesoId(area.procesoId || '');
    setAreaFormLider(area.lider || '');
    setAreaFormDescripcion(area.descripcion || '');
    setModalAreaOpen(true);
  };

  const handleGuardarArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaFormNombre.trim()) return;

    const procesoRelacionado = procesos.find(p => p.id === areaFormProcesoId);

    if (areaAEditar) {
      const areaActualizada: AreaOrganizacion = {
        ...areaAEditar,
        codigo: areaFormCodigo.trim() || areaAEditar.codigo,
        nombre: areaFormNombre.trim(),
        procesoId: areaFormProcesoId || undefined,
        procesoNombre: procesoRelacionado?.nombre || undefined,
        lider: areaFormLider.trim() || undefined,
        descripcion: areaFormDescripcion.trim() || undefined
      };
      if (onUpdateArea) onUpdateArea(areaActualizada);
      setMensajeExito(`Área "${areaActualizada.nombre}" modificada con éxito.`);
    } else {
      const nuevaArea: AreaOrganizacion = {
        id: uid('ar'),
        codigo: areaFormCodigo.trim() || `AR-${Math.floor(100 + Math.random() * 900)}`,
        nombre: areaFormNombre.trim(),
        procesoId: areaFormProcesoId || undefined,
        procesoNombre: procesoRelacionado?.nombre || undefined,
        lider: areaFormLider.trim() || undefined,
        descripcion: areaFormDescripcion.trim() || undefined
      };
      if (onAddArea) onAddArea(nuevaArea);
      setMensajeExito(`Nueva área "${nuevaArea.nombre}" creada e integrada.`);
    }

    setModalAreaOpen(false);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleConfirmarEliminarArea = () => {
    if (!areaAEliminar) return;
    if (onDeleteArea) onDeleteArea(areaAEliminar.id);
    setMensajeExito(`Área "${areaAEliminar.nombre}" eliminada de la estructura orgánica.`);
    setAreaAEliminar(null);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // -------------------------------------------------------------
  // ACCIONES DE PROCESOS
  // -------------------------------------------------------------
  const abrirModalNuevoProceso = () => {
    setProcesoAEditar(null);
    setProcesoFormCodigo(`PR-${Math.floor(10 + Math.random() * 90)}`);
    setProcesoFormNombre('');
    setProcesoFormTipo('Misional / Operativo');
    setProcesoFormObjetivo('');
    setProcesoFormLider('');
    setModalProcesoOpen(true);
  };

  const abrirModalEditarProceso = (proc: ProcesoOrganizacion) => {
    setProcesoAEditar(proc);
    setProcesoFormCodigo(proc.codigo || '');
    setProcesoFormNombre(proc.nombre);
    setProcesoFormTipo(proc.tipo);
    setProcesoFormObjetivo(proc.objetivo || '');
    setProcesoFormLider(proc.liderNombre || '');
    setModalProcesoOpen(true);
  };

  const handleGuardarProceso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procesoFormNombre.trim()) return;

    if (procesoAEditar) {
      const procesoActualizado: ProcesoOrganizacion = {
        ...procesoAEditar,
        codigo: procesoFormCodigo.trim() || procesoAEditar.codigo,
        nombre: procesoFormNombre.trim(),
        tipo: procesoFormTipo,
        objetivo: procesoFormObjetivo.trim() || undefined,
        liderNombre: procesoFormLider.trim() || undefined
      };
      if (onUpdateProceso) onUpdateProceso(procesoActualizado);
      setMensajeExito(`Proceso "${procesoActualizado.nombre}" actualizado con éxito.`);
    } else {
      const nuevoProceso: ProcesoOrganizacion = {
        id: uid('proc'),
        codigo: procesoFormCodigo.trim() || `PR-${Math.floor(10 + Math.random() * 90)}`,
        nombre: procesoFormNombre.trim(),
        tipo: procesoFormTipo,
        objetivo: procesoFormObjetivo.trim() || undefined,
        liderNombre: procesoFormLider.trim() || undefined
      };
      if (onAddProceso) onAddProceso(nuevoProceso);
      setMensajeExito(`Proceso "${nuevoProceso.nombre}" creado e integrado.`);
    }

    setModalProcesoOpen(false);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleConfirmarEliminarProceso = () => {
    if (!procesoAEliminar) return;
    if (onDeleteProceso) onDeleteProceso(procesoAEliminar.id);
    setMensajeExito(`Proceso "${procesoAEliminar.nombre}" eliminado de la organización.`);
    setProcesoAEliminar(null);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Depuración (solo superadmin)
  const handleEjecutarDepuracion = async () => {
    setDepurando(true);
    try {
      await limpiarEstructuraOrganicaFB();
      if (onDepurarEstructura) {
        onDepurarEstructura();
      }
      setMensajeExito('Estructura orgánica restablecida al catálogo base de B GROUP INGENIERIA S.A.S.');
      setModalDepurarOpen(false);
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (e: any) {
      alert('Error al restablecer estructura: ' + e.message);
    } finally {
      setDepurando(false);
    }
  };

  // Filtrado de cargos
  const cargosFiltrados = searchTerm.trim()
    ? cargos.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ficha.identificacion.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ficha.identificacion.area?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : cargos;

  const roots = cargosFiltrados.filter(c => !c.reportaA);

  // Render del Nodo del Organigrama
  const renderNode = (cargo: Cargo, level: number = 0) => {
    const hijos = cargos.filter(c => c.reportaA === cargo.id);
    const personasEnCargo = empleados.filter(e => e.cargoId === cargo.id);

    return (
      <div key={cargo.id} className="relative mt-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#8FA7D6] border-l-4 border-l-[#18235C] p-3.5 rounded-xl shadow-xs hover:border-[#18235C] transition-all">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#18235C]">
                {cargo.nombre}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#8FA7D6]/20 text-[#18235C] font-mono font-bold border border-[#8FA7D6]/40">
                {cargo.ficha?.identificacion?.codigo || 'S/C'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#282829]/70 mt-1">
              <span className="font-semibold text-[#18235C]">{cargo.ficha?.identificacion?.area || 'Área no asignada'}</span>
              <span>•</span>
              <span>{cargo.ficha?.identificacion?.familia || 'Familia estándar'}</span>
              {cargo.ficha?.identificacion?.proceso && (
                <>
                  <span>•</span>
                  <span className="text-[#282829]/80">{cargo.ficha.identificacion.proceso}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-[#282829] bg-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#8FA7D6]">
              <Users className="w-3.5 h-3.5 text-[#18235C]" />
              <span className="font-extrabold text-[#18235C]">{personasEnCargo.length}</span>
              <span className="text-[11px] font-medium text-[#282829]/70">ocupante(s)</span>
            </div>

            <button
              onClick={() => onSelectCargoForManual(cargo.id)}
              className="text-xs font-bold text-[#18235C] hover:bg-[#8FA7D6]/20 px-2.5 py-1.5 rounded-lg border border-[#8FA7D6] transition-colors flex items-center gap-1 shadow-2xs"
              title="Ver Ficha Técnica del Cargo"
            >
              <FileText className="w-3.5 h-3.5 text-[#18235C]" />
              <span className="hidden sm:inline">Ficha</span>
            </button>

            <button
              onClick={() => abrirModalEditarCargo(cargo)}
              className="text-xs font-bold text-[#18235C] hover:bg-[#8FA7D6]/20 px-2.5 py-1.5 rounded-lg border border-[#8FA7D6] transition-colors flex items-center gap-1 shadow-2xs"
              title="Modificar Cargo"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#18235C]" />
              <span className="hidden sm:inline">Editar</span>
            </button>

            <button
              onClick={() => abrirModalEliminarCargo(cargo)}
              className="text-xs font-bold text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 shadow-2xs"
              title="Eliminar Cargo"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>
        </div>

        {hijos.length > 0 && (
          <div className="ml-5 sm:ml-8 pl-4 border-l-2 border-dashed border-[#8FA7D6] mt-2 space-y-2">
            {hijos.map(h => renderNode(h, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Notificación de Éxito */}
      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Institucional B GROUP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#8FA7D6]/50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#18235C] tracking-tight">
              Estructura Orgánica & Cargos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#18235C] text-[#00FF00] border border-[#18235C]/30">
              B GROUP INGENIERIA S.A.S.
            </span>
          </div>
          <p className="text-xs text-[#282829]/70 mt-1 max-w-2xl leading-relaxed">
            Gestión integral de la jerarquía organizacional, líneas de reporte, catálogo de procesos y áreas operativas institucionales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Depurar Estructura (Exclusivo Superadministrador) */}
          {isSuperAdmin && (
            <button
              onClick={() => setModalDepurarOpen(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-rose-300 transition-colors shadow-2xs"
              title="Restablecer a catálogo corporativo base (Exclusivo Superadministrador)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Restablecer Estructura</span>
            </button>
          )}

          {/* Botón Nuevo Cargo */}
          <button
            onClick={() => setModalCargoOpen(true)}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-[#00FF00]" />
            <span>Nuevo Cargo</span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#8FA7D6]/40 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('organigrama')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'organigrama'
              ? 'bg-[#18235C] text-white shadow-xs'
              : 'bg-white text-[#282829] border border-[#8FA7D6]/60 hover:bg-[#8FA7D6]/15'
          }`}
        >
          <GitFork className="w-4 h-4 text-[#00FF00]" />
          <span>Organigrama Jerárquico ({cargos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mapa_procesos')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'mapa_procesos'
              ? 'bg-[#18235C] text-white shadow-xs'
              : 'bg-white text-[#282829] border border-[#8FA7D6]/60 hover:bg-[#8FA7D6]/15'
          }`}
        >
          <Network className="w-4 h-4 text-[#00FF00]" />
          <span>Mapa Institucional de Procesos ({procesos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gestion_areas_procesos')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'gestion_areas_procesos'
              ? 'bg-[#18235C] text-white shadow-xs'
              : 'bg-white text-[#282829] border border-[#8FA7D6]/60 hover:bg-[#8FA7D6]/15'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#00FF00]" />
          <span>Gestión de Procesos & Áreas ({areas.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ORGANIGRAMA JERÁRQUICO */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'organigrama' && (
        <div className="bg-white rounded-2xl border border-[#8FA7D6] p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#8FA7D6]/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#18235C] text-white flex items-center justify-center">
                <GitFork className="w-4 h-4 text-[#00FF00]" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#18235C]">
                  Organigrama Jerárquico Corporativo
                </h2>
                <span className="text-[11px] text-[#282829]/70">
                  {cargos.length} cargos estructurados • {empleados.length} colaboradores activos
                </span>
              </div>
            </div>

            {/* Buscador de cargos */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#282829]/40" />
              <input
                type="text"
                placeholder="Buscar por cargo, área o código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC] focus:outline-none focus:border-[#18235C]"
              />
            </div>
          </div>

          {/* Nodos del Organigrama */}
          <div className="space-y-3">
            {roots.length > 0 ? (
              roots.map(root => renderNode(root))
            ) : (
              <div className="py-12 text-center text-xs text-[#282829]/60">
                No se encontraron cargos con el filtro aplicado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: MAPA INSTITUCIONAL DE PROCESOS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'mapa_procesos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/40 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#18235C] text-white flex items-center justify-center">
                  <Compass className="w-4 h-4 text-[#00FF00]" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#18235C]">
                    Mapa de Macroprocesos y Procesos Organizacionales
                  </h2>
                  <span className="text-[11px] text-[#282829]/70">
                    Estructura según lineamientos del Sistema de Gestión de Calidad e Ingeniería
                  </span>
                </div>
              </div>
              <button
                onClick={abrirModalNuevoProceso}
                className="px-3 py-1.5 bg-[#18235C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#101740]"
              >
                <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>Crear Proceso</span>
              </button>
            </div>

            {/* Clasificación por Macroproceso */}
            <div className="space-y-6">
              {(['Estratégico', 'Misional / Operativo', 'Apoyo', 'Control y Evaluación'] as TipoProceso[]).map(tipo => {
                const procesosTipo = procesos.filter(p => p.tipo === tipo);

                const getBadgeColor = (t: TipoProceso) => {
                  switch (t) {
                    case 'Estratégico': return 'bg-amber-100 text-amber-900 border-amber-300';
                    case 'Misional / Operativo': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
                    case 'Apoyo': return 'bg-blue-100 text-blue-900 border-blue-300';
                    case 'Control y Evaluación': return 'bg-purple-100 text-purple-900 border-purple-300';
                  }
                };

                return (
                  <div key={tipo} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-[#8FA7D6]/30">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getBadgeColor(tipo)}`}>
                        {tipo}
                      </span>
                      <span className="text-xs text-[#282829]/70 font-semibold">
                        ({procesosTipo.length} procesos vinculados)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {procesosTipo.map(proc => {
                        const areasVinculadas = areas.filter(a => a.procesoId === proc.id || a.procesoNombre === proc.nombre);
                        return (
                          <div key={proc.id} className="bg-[#F8FAFC] border border-[#8FA7D6] rounded-xl p-4 shadow-xs hover:border-[#18235C] transition-all space-y-3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 bg-white border border-[#8FA7D6] rounded text-[#18235C]">
                                  {proc.codigo || 'PR-00'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => abrirModalEditarProceso(proc)}
                                    className="p-1 hover:bg-[#8FA7D6]/20 text-[#18235C] rounded"
                                    title="Editar proceso"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setProcesoAEliminar(proc)}
                                    className="p-1 hover:bg-rose-100 text-rose-600 rounded"
                                    title="Eliminar proceso"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <h3 className="font-bold text-sm text-[#18235C] mt-1.5">
                                {proc.nombre}
                              </h3>
                              {proc.objetivo && (
                                <p className="text-[11px] text-[#282829]/80 mt-1 line-clamp-2">
                                  {proc.objetivo}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[#8FA7D6]/30 space-y-1.5 text-xs">
                              <div className="flex justify-between items-center text-[11px] text-[#282829]/70">
                                <span>Líder asignado:</span>
                                <strong className="text-[#18235C]">{proc.liderNombre || 'Por asignar'}</strong>
                              </div>
                              <div className="text-[11px]">
                                <span className="font-semibold text-[#18235C] block mb-1">
                                  Áreas operativas ({areasVinculadas.length}):
                                </span>
                                {areasVinculadas.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {areasVinculadas.map(ar => (
                                      <span key={ar.id} className="px-2 py-0.5 bg-white border border-[#8FA7D6]/50 rounded text-[10px] font-medium text-[#282829]">
                                        {ar.nombre}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-[#282829]/50 italic">Sin áreas vinculadas aún</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: GESTIÓN DE ÁREAS Y PROCESOS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'gestion_areas_procesos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECCIÓN ÁREAS */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/40 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#18235C]" />
                <h3 className="font-bold text-sm text-[#18235C]">
                  Áreas de la Estructura Orgánica ({areas.length})
                </h3>
              </div>
              <button
                onClick={abrirModalNuevaArea}
                className="px-3 py-1.5 bg-[#18235C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#101740]"
              >
                <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>Nueva Área</span>
              </button>
            </div>

            <div className="space-y-3">
              {areas.map(area => (
                <div key={area.id} className="p-3.5 bg-[#F8FAFC] border border-[#8FA7D6] rounded-xl flex items-center justify-between gap-3 hover:border-[#18235C] transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 bg-white border border-[#8FA7D6] rounded text-[#18235C]">
                        {area.codigo || 'AR-00'}
                      </span>
                      <h4 className="font-bold text-xs text-[#18235C]">
                        {area.nombre}
                      </h4>
                    </div>
                    <div className="text-[11px] text-[#282829]/70 mt-1 flex flex-wrap gap-2">
                      {area.procesoNombre && (
                        <span>Proceso: <strong className="text-[#18235C]">{area.procesoNombre}</strong></span>
                      )}
                      {area.lider && (
                        <span>• Líder: <strong>{area.lider}</strong></span>
                      )}
                    </div>
                    {area.descripcion && (
                      <p className="text-[10px] text-[#282829]/60 mt-0.5 line-clamp-1">
                        {area.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => abrirModalEditarArea(area)}
                      className="p-1.5 text-[#18235C] hover:bg-[#8FA7D6]/20 rounded-lg border border-[#8FA7D6]"
                      title="Editar área"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAreaAEliminar(area)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                      title="Eliminar área"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN PROCESOS */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/40 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#18235C]" />
                <h3 className="font-bold text-sm text-[#18235C]">
                  Procesos Organizacionales ({procesos.length})
                </h3>
              </div>
              <button
                onClick={abrirModalNuevoProceso}
                className="px-3 py-1.5 bg-[#18235C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#101740]"
              >
                <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>Nuevo Proceso</span>
              </button>
            </div>

            <div className="space-y-3">
              {procesos.map(proc => (
                <div key={proc.id} className="p-3.5 bg-[#F8FAFC] border border-[#8FA7D6] rounded-xl flex items-center justify-between gap-3 hover:border-[#18235C] transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 bg-white border border-[#8FA7D6] rounded text-[#18235C]">
                        {proc.codigo || 'PR-00'}
                      </span>
                      <h4 className="font-bold text-xs text-[#18235C]">
                        {proc.nombre}
                      </h4>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-[#8FA7D6]/20 text-[#18235C]">
                        {proc.tipo}
                      </span>
                    </div>
                    {proc.objetivo && (
                      <p className="text-[11px] text-[#282829]/70 mt-1 line-clamp-1">
                        {proc.objetivo}
                      </p>
                    )}
                    {proc.liderNombre && (
                      <span className="text-[10px] text-[#282829]/60 mt-0.5 block">
                        Líder: {proc.liderNombre}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => abrirModalEditarProceso(proc)}
                      className="p-1.5 text-[#18235C] hover:bg-[#8FA7D6]/20 rounded-lg border border-[#8FA7D6]"
                      title="Editar proceso"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProcesoAEliminar(proc)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                      title="Eliminar proceso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL CREAR / EDITAR CARGO */}
      {/* ------------------------------------------------------------- */}
      {(modalCargoOpen || modalEditarCargoOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#8FA7D6]/40">
              <div>
                <h3 className="text-lg font-bold text-[#18235C]">
                  {modalEditarCargoOpen ? 'Modificar Cargo Orgánico' : 'Crear Nuevo Cargo Orgánico'}
                </h3>
                <p className="text-xs text-[#282829]/70">
                  {modalEditarCargoOpen ? 'Actualice la información jerárquica y de pertenencia del cargo.' : 'Registra el nuevo rol en el organigrama y define su dependencia directa.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalCargoOpen(false);
                  setModalEditarCargoOpen(false);
                  setCargoAEditar(null);
                }}
                className="text-[#282829] hover:text-[#18235C] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={modalEditarCargoOpen ? handleGuardarEdicionCargo : handleCreateCargo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#18235C] mb-1">
                  Nombre del Cargo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Residente de Obra / Especialista de Fibra Óptica"
                  value={nombreCargo}
                  onChange={e => setNombreCargo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC] focus:outline-none focus:border-[#18235C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18235C] mb-1">
                  Jefe Inmediato (Reporta a):
                </label>
                <select
                  value={reportaACargo}
                  onChange={e => setReportaACargo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC] focus:outline-none focus:border-[#18235C]"
                >
                  <option value="">— Cargo Raíz / Máxima Autoridad (Sin superior directo) —</option>
                  {cargos
                    .filter(c => !cargoAEditar || c.id !== cargoAEditar.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.ficha?.identificacion?.codigo || 'S/C'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#18235C] mb-1">
                    Código de Cargo:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. OPR-002"
                    value={codigoCargo}
                    onChange={e => setCodigoCargo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC] focus:outline-none focus:border-[#18235C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#18235C] mb-1">
                    Familia de Cargos:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Operativa / Técnica"
                    value={familiaCargo}
                    onChange={e => setFamiliaCargo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC] focus:outline-none focus:border-[#18235C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#18235C] mb-1">
                    Área Orgánica:
                  </label>
                  <select
                    value={areaCargo}
                    onChange={e => setAreaCargo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC] focus:outline-none focus:border-[#18235C]"
                  >
                    <option value="">— Seleccione área —</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.nombre}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#18235C] mb-1">
                    Proceso Asociado:
                  </label>
                  <select
                    value={procesoCargo}
                    onChange={e => setProcesoCargo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC] focus:outline-none focus:border-[#18235C]"
                  >
                    <option value="">— Seleccione proceso —</option>
                    {procesos.map(p => (
                      <option key={p.id} value={p.nombre}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]/40">
                <button
                  type="button"
                  onClick={() => {
                    setModalCargoOpen(false);
                    setModalEditarCargoOpen(false);
                    setCargoAEditar(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#282829] hover:bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#18235C] hover:bg-[#101740] rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-[#00FF00]" />
                  <span>{modalEditarCargoOpen ? 'Guardar Cambios' : 'Crear Cargo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL ELIMINAR CARGO */}
      {/* ------------------------------------------------------------- */}
      {modalEliminarCargoOpen && cargoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  ¿Eliminar el cargo "{cargoAEliminar.nombre}"?
                </h3>
                <p className="text-xs text-rose-700">
                  Código: {cargoAEliminar.ficha?.identificacion?.codigo || 'S/C'}
                </p>
              </div>
            </div>

            {/* Verificación de ocupantes */}
            {(() => {
              const ocupantes = empleados.filter(e => e.cargoId === cargoAEliminar.id);
              const subordinados = cargos.filter(c => c.reportaA === cargoAEliminar.id);

              return (
                <div className="space-y-3 text-xs">
                  {ocupantes.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900">
                      <strong className="block mb-1">Advertencia de Colaboradores Asignados:</strong>
                      <span>Este cargo tiene actualmente {ocupantes.length} colaborador(es) asociado(s):</span>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        {ocupantes.map(o => (
                          <li key={o.id}>{o.nombre} ({o.documento})</li>
                        ))}
                      </ul>
                      <p className="mt-1 text-[11px]">
                        Al eliminarlo, estos colaboradores quedarán sin cargo asignado hasta que sean actualizados.
                      </p>
                    </div>
                  )}

                  {subordinados.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
                      <strong>Línea de Mando:</strong> Existen {subordinados.length} cargo(s) que reportan a este cargo. Serán automáticamente reasignados a la raíz o al nivel superior.
                    </div>
                  )}

                  <p className="text-[#282829]/80">
                    ¿Está seguro de continuar con la eliminación definitiva de este cargo de la estructura?
                  </p>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => {
                  setModalEliminarCargoOpen(false);
                  setCargoAEliminar(null);
                }}
                className="px-3.5 py-2 text-xs font-bold text-[#282829] hover:bg-slate-100 rounded-xl border border-[#8FA7D6]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarCargo}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL CREAR / EDITAR ÁREA */}
      {/* ------------------------------------------------------------- */}
      {modalAreaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#8FA7D6]/40">
              <div>
                <h3 className="text-base font-bold text-[#18235C]">
                  {areaAEditar ? 'Modificar Área Orgánica' : 'Crear Nueva Área Orgánica'}
                </h3>
                <p className="text-xs text-[#282829]/70">
                  Departamentos, sedes y frentes de trabajo de B GROUP INGENIERIA S.A.S.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAreaOpen(false)}
                className="text-[#282829] hover:text-[#18235C] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarArea} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={areaFormCodigo}
                    onChange={e => setAreaFormCodigo(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">Nombre del Área *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Redes y Fibra Óptica"
                    value={areaFormNombre}
                    onChange={e => setAreaFormNombre(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Proceso al que Pertenece:</label>
                <select
                  value={areaFormProcesoId}
                  onChange={e => setAreaFormProcesoId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                >
                  <option value="">— Ninguno / Independiente —</option>
                  {procesos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Líder o Responsable del Área:</label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Mendivelso"
                  value={areaFormLider}
                  onChange={e => setAreaFormLider(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Descripción / Alcance:</label>
                <textarea
                  rows={2}
                  placeholder="Funciones clave y actividades principales del área..."
                  value={areaFormDescripcion}
                  onChange={e => setAreaFormDescripcion(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#8FA7D6]/30">
                <button
                  type="button"
                  onClick={() => setModalAreaOpen(false)}
                  className="px-3.5 py-1.5 font-bold text-[#282829] hover:bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-[#18235C] hover:bg-[#101740] rounded-xl shadow-xs"
                >
                  {areaAEditar ? 'Guardar Cambios' : 'Crear Área'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL ELIMINAR ÁREA */}
      {/* ------------------------------------------------------------- */}
      {areaAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  ¿Eliminar el área "{areaAEliminar.nombre}"?
                </h3>
                <p className="text-xs text-rose-700">
                  Código: {areaAEliminar.codigo || 'S/C'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#282829]/80">
              Esta área será retirada de la estructura orgánica. Los cargos vinculados mantendrán su registro.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setAreaAEliminar(null)}
                className="px-3.5 py-2 text-xs font-bold text-[#282829] hover:bg-slate-100 rounded-xl border border-[#8FA7D6]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarArea}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs"
              >
                Eliminar Área
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL CREAR / EDITAR PROCESO */}
      {/* ------------------------------------------------------------- */}
      {modalProcesoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#8FA7D6]/40">
              <div>
                <h3 className="text-base font-bold text-[#18235C]">
                  {procesoAEditar ? 'Modificar Proceso' : 'Crear Nuevo Proceso'}
                </h3>
                <p className="text-xs text-[#282829]/70">
                  Mapa de procesos institucionales del Sistema de Gestión B GROUP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalProcesoOpen(false)}
                className="text-[#282829] hover:text-[#18235C] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarProceso} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={procesoFormCodigo}
                    onChange={e => setProcesoFormCodigo(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">Nombre del Proceso *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Operaciones de Montaje"
                    value={procesoFormNombre}
                    onChange={e => setProcesoFormNombre(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Tipo de Macroproceso:</label>
                <select
                  value={procesoFormTipo}
                  onChange={e => setProcesoFormTipo(e.target.value as TipoProceso)}
                  className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                >
                  <option value="Estratégico">Estratégico</option>
                  <option value="Misional / Operativo">Misional / Operativo</option>
                  <option value="Apoyo">Apoyo</option>
                  <option value="Control y Evaluación">Control y Evaluación</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Objetivo del Proceso:</label>
                <textarea
                  rows={2}
                  placeholder="Propósito del proceso para satisfacer al cliente y requisitos..."
                  value={procesoFormObjetivo}
                  onChange={e => setProcesoFormObjetivo(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Líder del Proceso:</label>
                <input
                  type="text"
                  placeholder="Ej. Andrés Pinilla / Carlos Mendivelso"
                  value={procesoFormLider}
                  onChange={e => setProcesoFormLider(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#8FA7D6]/30">
                <button
                  type="button"
                  onClick={() => setModalProcesoOpen(false)}
                  className="px-3.5 py-1.5 font-bold text-[#282829] hover:bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-[#18235C] hover:bg-[#101740] rounded-xl shadow-xs"
                >
                  {procesoAEditar ? 'Guardar Cambios' : 'Crear Proceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL ELIMINAR PROCESO */}
      {/* ------------------------------------------------------------- */}
      {procesoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  ¿Eliminar el proceso "{procesoAEliminar.nombre}"?
                </h3>
                <p className="text-xs text-rose-700">
                  Tipo: {procesoAEliminar.tipo} • Código: {procesoAEliminar.codigo || 'S/C'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#282829]/80">
              Esta acción eliminará el proceso del mapa institucional de B GROUP INGENIERIA S.A.S.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setProcesoAEliminar(null)}
                className="px-3.5 py-2 text-xs font-bold text-[#282829] hover:bg-slate-100 rounded-xl border border-[#8FA7D6]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarProceso}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs"
              >
                Eliminar Proceso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE CONFIRMACIÓN RESTABLECER ESTRUCTURA (SUPERADMIN) */}
      {/* ------------------------------------------------------------- */}
      {isSuperAdmin && modalDepurarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  ¿Restablecer estructura orgánica base?
                </h3>
                <p className="text-xs text-rose-700">
                  Restablecer a estructura base de producción
                </p>
              </div>
            </div>

            <p className="text-xs text-[#282829]/80 leading-relaxed">
              Esta acción sincronizará el organigrama con la estructura aprobada de B GROUP INGENIERIA S.A.S. (Gerencia General, Operaciones de Redes, Gestión Humana & SG-SST, Contabilidad, etc.).
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setModalDepurarOpen(false)}
                disabled={depurando}
                className="px-3.5 py-2 text-xs font-bold text-[#282829] hover:bg-slate-100 rounded-xl border border-[#8FA7D6]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarDepuracion}
                disabled={depurando}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors"
              >
                {depurando ? 'Restableciendo...' : 'Sí, Restablecer Ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
