import React, { useState, useMemo } from 'react';
import {
  Cargo,
  Empleado,
  AreaOrganizacion,
  ProcesoOrganizacion,
  EvaluacionDesempeno,
  Solicitud,
  ItemInventarioEPP,
  SolicitudEntregaEPP,
  Role,
  UsuarioSistema,
  EstadoColaborador
} from '../types';
import {
  Users,
  Plus,
  ArrowUpDown,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  History,
  FileText,
  Power,
  Trash2,
  RefreshCw,
  HardHat,
  ShieldCheck,
  ChevronDown,
  Building,
  Briefcase,
  MapPin,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { ModalNuevoEmpleadoWizard } from './ModalNuevoEmpleadoWizard';
import { ModalGestionEstadoEmpleado } from './ModalGestionEstadoEmpleado';
import { ModalEliminarEmpleado } from './ModalEliminarEmpleado';
import { ExpedienteDigitalView } from './ExpedienteDigitalView';
import {
  ComprobanteNotificacionModal,
  ComprobanteNotificacionData
} from './ComprobanteNotificacionModal';
import {
  generarCartaBienvenida,
  generarAsuntoBienvenida
} from '../utils/notificacionesCorreo';

interface EmpleadosViewProps {
  empleados: Empleado[];
  cargos: Cargo[];
  areas?: AreaOrganizacion[];
  procesos?: ProcesoOrganizacion[];
  solicitudes: Solicitud[];
  evaluaciones: EvaluacionDesempeno[];
  onAddEmpleado: (
    nuevo: Empleado,
    opciones?: { crearUsuario?: boolean; passwordTemporal?: string }
  ) => Promise<{ usuarioCreado?: UsuarioSistema; passwordTemporal?: string; resultadoEnvio?: any } | void> | void;
  onOpenEvaluacionDetalle: (evaluacionId: string) => void;
  inventarioEpp?: ItemInventarioEPP[];
  solicitudesEpp?: SolicitudEntregaEPP[];
  onActualizarInventario?: (nuevo: ItemInventarioEPP[]) => void;
  onActualizarSolicitudes?: (nuevas: SolicitudEntregaEPP[]) => void;
  userRole?: Role;
  usuarios?: UsuarioSistema[];
  hayMasNube?: boolean;
  cargandoMasNube?: boolean;
  onCargarMasNube?: () => Promise<void>;
  cargandoNube?: boolean;
  onRefrescarNube?: () => Promise<void>;
  onUpdateEmpleado?: (empleado: Empleado) => Promise<void> | void;
  onDeleteEmpleado?: (id: string) => Promise<void> | void;
  isSuperAdmin?: boolean;
  currentUser?: UsuarioSistema | null;
}

export const EmpleadosView: React.FC<EmpleadosViewProps> = ({
  empleados,
  cargos,
  areas = [],
  procesos = [],
  solicitudes,
  evaluaciones,
  onAddEmpleado,
  onOpenEvaluacionDetalle,
  inventarioEpp,
  solicitudesEpp,
  onActualizarInventario,
  onActualizarSolicitudes,
  userRole = 'admin',
  usuarios = [],
  hayMasNube = false,
  cargandoMasNube = false,
  onCargarMasNube,
  cargandoNube = false,
  onRefrescarNube,
  onUpdateEmpleado,
  onDeleteEmpleado,
  isSuperAdmin = false,
  currentUser
}) => {
  // Estado de navegación y modales
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string | null>(null);
  const [initialExpedienteTab, setInitialExpedienteTab] = useState<string>('general');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<Empleado | null>(null);
  const [empleadoParaGestionarEstado, setEmpleadoParaGestionarEstado] = useState<Empleado | null>(null);
  const [empleadoParaEliminar, setEmpleadoParaEliminar] = useState<Empleado | null>(null);
  const [comprobanteData, setComprobanteData] = useState<ComprobanteNotificacionData | null>(null);

  // Filtros de búsqueda multi-criterio
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroArea, setFiltroArea] = useState<string>('TODAS');
  const [filtroCargo, setFiltroCargo] = useState<string>('TODOS');
  const [filtroContrato, setFiltroContrato] = useState<string>('TODOS');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('TODAS');
  const [filtroCiudad, setFiltroCiudad] = useState<string>('TODAS');

  // Ordenamiento y Paginación
  const [campoOrden, setCampoOrden] = useState<'nombre' | 'codigo' | 'documento' | 'cargo' | 'area' | 'fechaIngreso' | 'estado'>('nombre');
  const [ordenAsc, setOrdenAsc] = useState<boolean>(true);
  const [limiteVisible, setLimiteVisible] = useState(25);

  const canManageEmployees = Boolean(
    isSuperAdmin ||
    userRole === 'admin' ||
    currentUser?.rol === 'admin_gh' ||
    currentUser?.rol === 'superadmin'
  );

  const getCargoNombre = (id: string) => cargos.find(c => c.id === id)?.nombre || 'Cargo no definido';
  const getAreaNombre = (emp: Empleado) => {
    if (emp.laboral?.areaNombre) return emp.laboral.areaNombre;
    if (emp.areaId) {
      const a = areas.find(ar => ar.id === emp.areaId);
      if (a) return a.nombre;
    }
    return 'Operaciones';
  };

  const getEstadoNormalizado = (emp: Empleado): EstadoColaborador => {
    if (emp.laboral?.estado) return emp.laboral.estado;
    if (emp.estadoLaboral === 'retirado' || emp.estadoLaboral === 'Retirado') return 'Retirado';
    if (emp.estadoLaboral === 'inactivo' || emp.estadoLaboral === 'Inactivo') return 'Inactivo';
    if (emp.activo === false) return 'Inactivo';
    return 'Activo';
  };

  // Conteos para KPI cards
  const metricas = useMemo(() => {
    let activos = 0;
    let preingreso = 0;
    let novedades = 0;
    let inactivosRetirados = 0;

    empleados.forEach(e => {
      const st = getEstadoNormalizado(e);
      if (st === 'Activo') activos++;
      else if (st === 'Preingreso') preingreso++;
      else if (st === 'Vacaciones' || st === 'Licencia' || st === 'Suspensión') novedades++;
      else if (st === 'Inactivo' || st === 'Retirado') inactivosRetirados++;
    });

    return { total: empleados.length, activos, preingreso, novedades, inactivosRetirados };
  }, [empleados]);

  // Lista única de ciudades para el filtro
  const ciudadesDisponibles = useMemo(() => {
    const setC = new Set<string>();
    empleados.forEach(e => {
      const c = e.contacto?.ciudad || 'Bogotá D.C.';
      setC.add(c);
    });
    return Array.from(setC).sort();
  }, [empleados]);

  // Lista única de tipos de contrato
  const tiposContratoDisponibles = useMemo(() => {
    const setC = new Set<string>();
    empleados.forEach(e => {
      const t = e.laboral?.tipoContrato || e.contrato?.tipo;
      if (t) setC.add(t);
    });
    return Array.from(setC).sort();
  }, [empleados]);

  // Filtrado multi-criterio estricto
  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(e => {
      const st = getEstadoNormalizado(e);
      if (filtroEstado !== 'TODOS' && st !== filtroEstado) return false;

      const cargoIdEmp = e.cargoId || '';
      if (filtroCargo !== 'TODOS' && cargoIdEmp !== filtroCargo) return false;

      const areaEmp = getAreaNombre(e);
      if (filtroArea !== 'TODAS') {
        const areaObj = areas.find(a => a.id === filtroArea);
        if (areaObj && areaEmp !== areaObj.nombre && e.areaId !== filtroArea) return false;
      }

      const tipoContrato = e.laboral?.tipoContrato || e.contrato?.tipo || '';
      if (filtroContrato !== 'TODOS' && tipoContrato !== filtroContrato) return false;

      const modalidad = e.laboral?.modalidadTrabajo || 'Presencial';
      if (filtroModalidad !== 'TODAS' && modalidad !== filtroModalidad) return false;

      const ciudad = e.contacto?.ciudad || 'Bogotá D.C.';
      if (filtroCiudad !== 'TODAS' && ciudad !== filtroCiudad) return false;

      // Buscador unificado por: Documento, Nombre, Apellido, Código, Cargo
      if (filtroBusqueda.trim()) {
        const t = filtroBusqueda.toLowerCase();
        const numDoc = (e.documento || '').toLowerCase();
        const cod = (e.codigo || e.codigoInterno || '').toLowerCase();
        const nom = (e.nombre || '').toLowerCase();
        const pNom = (e.persona?.primerNombre || '').toLowerCase();
        const sNom = (e.persona?.segundoNombre || '').toLowerCase();
        const pApe = (e.persona?.primerApellido || '').toLowerCase();
        const sApe = (e.persona?.segundoApellido || '').toLowerCase();
        const cargoStr = getCargoNombre(e.cargoId).toLowerCase();

        const match =
          numDoc.includes(t) ||
          cod.includes(t) ||
          nom.includes(t) ||
          pNom.includes(t) ||
          sNom.includes(t) ||
          pApe.includes(t) ||
          sApe.includes(t) ||
          cargoStr.includes(t);

        if (!match) return false;
      }

      return true;
    });
  }, [
    empleados,
    filtroEstado,
    filtroCargo,
    filtroArea,
    filtroContrato,
    filtroModalidad,
    filtroCiudad,
    filtroBusqueda,
    areas,
    cargos
  ]);

  // Ordenamiento de tabla
  const empleadosOrdenados = useMemo(() => {
    return [...empleadosFiltrados].sort((a, b) => {
      let vA = '';
      let vB = '';

      if (campoOrden === 'nombre') {
        vA = a.nombre.toLowerCase();
        vB = b.nombre.toLowerCase();
      } else if (campoOrden === 'codigo') {
        vA = (a.codigo || a.codigoInterno || '').toLowerCase();
        vB = (b.codigo || b.codigoInterno || '').toLowerCase();
      } else if (campoOrden === 'documento') {
        vA = (a.documento || '').toLowerCase();
        vB = (b.documento || '').toLowerCase();
      } else if (campoOrden === 'cargo') {
        vA = getCargoNombre(a.cargoId).toLowerCase();
        vB = getCargoNombre(b.cargoId).toLowerCase();
      } else if (campoOrden === 'area') {
        vA = getAreaNombre(a).toLowerCase();
        vB = getAreaNombre(b).toLowerCase();
      } else if (campoOrden === 'fechaIngreso') {
        vA = a.laboral?.fechaIngreso || a.contrato?.inicio || '';
        vB = b.laboral?.fechaIngreso || b.contrato?.inicio || '';
      } else if (campoOrden === 'estado') {
        vA = getEstadoNormalizado(a);
        vB = getEstadoNormalizado(b);
      }

      if (vA < vB) return ordenAsc ? -1 : 1;
      if (vA > vB) return ordenAsc ? 1 : -1;
      return 0;
    });
  }, [empleadosFiltrados, campoOrden, ordenAsc]);

  const empleadosPaginados = useMemo(() => {
    return empleadosOrdenados.slice(0, limiteVisible);
  }, [empleadosOrdenados, limiteVisible]);

  const toggleOrden = (campo: typeof campoOrden) => {
    if (campoOrden === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setCampoOrden(campo);
      setOrdenAsc(true);
    }
  };

  // Exportar información filtrada a CSV con formato colombiano
  const handleExportarCSV = () => {
    const headers = [
      'Código',
      'Tipo Doc',
      'Documento',
      'Primer Nombre',
      'Segundo Nombre',
      'Primer Apellido',
      'Segundo Apellido',
      'Nombre Completo',
      'Cargo',
      'Área',
      'Tipo de Contrato',
      'Modalidad',
      'Salario Básico',
      'Fecha Ingreso',
      'Estado',
      'Ciudad',
      'Correo Corporativo',
      'Celular',
      'EPS',
      'ARL'
    ];

    const rows = empleadosOrdenados.map(e => [
      e.codigo || e.codigoInterno || '',
      e.persona?.tipoDocumento || e.tipoDocumento || 'CC',
      e.documento || '',
      e.persona?.primerNombre || '',
      e.persona?.segundoNombre || '',
      e.persona?.primerApellido || '',
      e.persona?.segundoApellido || '',
      e.nombre || '',
      getCargoNombre(e.cargoId),
      getAreaNombre(e),
      e.laboral?.tipoContrato || e.contrato?.tipo || '',
      e.laboral?.modalidadTrabajo || 'Presencial',
      e.compensacion?.salarioBasico || e.salarioBase || 0,
      e.laboral?.fechaIngreso || e.contrato?.inicio || '',
      getEstadoNormalizado(e),
      e.contacto?.ciudad || 'Bogotá D.C.',
      e.contacto?.correoCorporativo || e.email || '',
      e.contacto?.celular || e.telefono || '',
      e.seguridadSocial?.eps || 'SURA EPS',
      e.seguridadSocial?.arl || 'Positiva'
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Gestion_Empleados_BGroup_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLimpiarFiltros = () => {
    setFiltroBusqueda('');
    setFiltroEstado('TODOS');
    setFiltroArea('TODAS');
    setFiltroCargo('TODOS');
    setFiltroContrato('TODOS');
    setFiltroModalidad('TODAS');
    setFiltroCiudad('TODAS');
    setLimiteVisible(25);
  };

  const renderBadgeEstado = (st: EstadoColaborador) => {
    const colorMap: Record<string, string> = {
      Activo: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      Preingreso: 'bg-blue-50 text-blue-800 border-blue-300',
      Vacaciones: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      Licencia: 'bg-purple-50 text-purple-800 border-purple-300',
      Suspensión: 'bg-amber-50 text-amber-800 border-amber-300',
      Inactivo: 'bg-yellow-50 text-yellow-800 border-yellow-300',
      Retirado: 'bg-rose-50 text-rose-800 border-rose-300'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${colorMap[st] || 'bg-slate-100 text-slate-800 border-slate-300'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {st}
      </span>
    );
  };

  // Si hay un empleado seleccionado, mostramos su expediente digital completo
  const currentEmpleadoSeleccionado = empleados.find(e => e.id === selectedEmpleadoId);
  if (currentEmpleadoSeleccionado) {
    const usuarioVinculado = (usuarios || []).find(
      u => u.empleadoId === currentEmpleadoSeleccionado.id ||
           (u.email && currentEmpleadoSeleccionado.email && u.email.toLowerCase() === currentEmpleadoSeleccionado.email.toLowerCase()) ||
           (u.documento && currentEmpleadoSeleccionado.documento && u.documento === currentEmpleadoSeleccionado.documento)
    );

    return (
      <ExpedienteDigitalView
        empleado={currentEmpleadoSeleccionado}
        cargos={cargos}
        areas={areas}
        currentUser={currentUser}
        solicitudes={solicitudes.filter(s => s.empleadoId === currentEmpleadoSeleccionado.id)}
        evaluaciones={evaluaciones.filter(ev => ev.empleadoId === currentEmpleadoSeleccionado.id)}
        onVolver={() => setSelectedEmpleadoId(null)}
        onEditar={(emp) => {
          setEmpleadoAEditar(emp);
          setWizardOpen(true);
        }}
        onGestionarEstado={(emp) => setEmpleadoParaGestionarEstado(emp)}
        onEliminar={(emp) => setEmpleadoParaEliminar(emp)}
        onActualizarEmpleado={onUpdateEmpleado}
        usuarioVinculado={usuarioVinculado}
        initialTab={initialExpedienteTab}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]">
        <div>
          <h1 className="font-extrabold text-3xl text-[#18235C] tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-[#18235C]" />
            <span>Gestión de Empleados</span>
          </h1>
          <p className="text-xs text-[#282829] mt-1 max-w-2xl">
            Expediente digital único de talento humano · Trazabilidad relacional Persona → Empleado → Contrato → Cargo → Compensación → Seguridad Social → Documentos → Historial Laboral.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onRefrescarNube && (
            <button
              type="button"
              onClick={() => onRefrescarNube()}
              disabled={cargandoNube}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-[#18235C] border border-[#8FA7D6] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargandoNube ? 'animate-spin' : ''}`} />
              <span>{cargandoNube ? 'Consultando...' : 'Refrescar Nube'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportarCSV}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-[#18235C] border border-[#8FA7D6] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Exportar base de colaboradores a formato CSV compatible con Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#18235C]" />
            <span>Exportar (CSV / Excel)</span>
          </button>

          {canManageEmployees && (
            <button
              type="button"
              onClick={() => {
                setEmpleadoAEditar(null);
                setWizardOpen(true);
              }}
              className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-extrabold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#8FA7D6]" />
              <span>Nuevo empleado</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards de Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Total Registros</span>
            <Users className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="text-2xl font-black text-[#18235C]">{metricas.total}</div>
          <span className="text-[10px] text-slate-400">Expedientes creados</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
            <span className="font-semibold">Activos</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{metricas.activos}</div>
          <span className="text-[10px] text-emerald-600/80">En funciones</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
            <span className="font-semibold">Preingreso</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{metricas.preingreso}</div>
          <span className="text-[10px] text-blue-600/80">En contratación</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
            <span className="font-semibold">Novedades</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{metricas.novedades}</div>
          <span className="text-[10px] text-amber-600/80">Vacaciones / Licencias</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span className="font-semibold">Inactivos / Retiro</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{metricas.inactivosRetirados}</div>
          <span className="text-[10px] text-rose-600/80">Trazabilidad inmutable</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Multi-Criterio */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] p-4 shadow-xs space-y-3">
        {/* Buscador unificado */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filtroBusqueda}
              onChange={e => setFiltroBusqueda(e.target.value)}
              placeholder="Buscar por número de documento, nombre, apellido, código interno o cargo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs text-[#282829] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="px-3 py-2 text-xs font-semibold text-[#18235C] hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Filtros avanzados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Filtro Estado */}
          <div>
            <label className="block text-[11px] font-bold text-[#18235C] mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Preingreso">Preingreso</option>
              <option value="Vacaciones">Vacaciones</option>
              <option value="Licencia">Licencia</option>
              <option value="Suspensión">Suspensión</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Retirado">Retirado</option>
            </select>
          </div>

          {/* Filtro Área */}
          <div>
            <label className="block text-[11px] font-bold text-[#18235C] mb-1">Área</label>
            <select
              value={filtroArea}
              onChange={e => setFiltroArea(e.target.value)}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
            >
              <option value="TODAS">Todas las áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          {/* Filtro Cargo */}
          <div>
            <label className="block text-[11px] font-bold text-[#18235C] mb-1">Cargo</label>
            <select
              value={filtroCargo}
              onChange={e => setFiltroCargo(e.target.value)}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
            >
              <option value="TODOS">Todos los cargos</option>
              {cargos.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo Contrato */}
          <div>
            <label className="block text-[11px] font-bold text-[#18235C] mb-1">Tipo Contrato</label>
            <select
              value={filtroContrato}
              onChange={e => setFiltroContrato(e.target.value)}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
            >
              <option value="TODOS">Todos los contratos</option>
              {tiposContratoDisponibles.map(tc => (
                <option key={tc} value={tc}>{tc}</option>
              ))}
            </select>
          </div>

          {/* Filtro Modalidad */}
          <div>
            <label className="block text-[11px] font-bold text-[#18235C] mb-1">Modalidad</label>
            <select
              value={filtroModalidad}
              onChange={e => setFiltroModalidad(e.target.value)}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
            >
              <option value="TODAS">Todas las modalidades</option>
              <option value="Presencial">Presencial</option>
              <option value="Híbrida">Híbrida</option>
              <option value="Trabajo remoto">Trabajo remoto</option>
              <option value="Teletrabajo">Teletrabajo</option>
            </select>
          </div>

          {/* Filtro Ciudad */}
          <div>
            <label className="block text-[11px] font-bold text-[#18235C] mb-1">Ciudad</label>
            <select
              value={filtroCiudad}
              onChange={e => setFiltroCiudad(e.target.value)}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
            >
              <option value="TODAS">Todas las ciudades</option>
              {ciudadesDisponibles.map(cd => (
                <option key={cd} value={cd}>{cd}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Empleados */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#8FA7D6] bg-slate-50/80 text-[#18235C]">
                <th className="py-3 px-3 font-bold w-12 text-center">Foto</th>
                <th
                  onClick={() => toggleOrden('codigo')}
                  className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Código</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleOrden('nombre')}
                  className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Nombre Completo</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleOrden('documento')}
                  className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Documento</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleOrden('cargo')}
                  className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Cargo</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleOrden('area')}
                  className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Área</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 font-bold">Tipo Contrato</th>
                <th
                  onClick={() => toggleOrden('fechaIngreso')}
                  className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Fecha Ingreso</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleOrden('estado')}
                  className="py-3 px-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Estado</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {empleadosPaginados.map(emp => {
                const st = getEstadoNormalizado(emp);
                const iniciales = emp.nombre.split(' ').map(n => n[0]).slice(0, 2).join('');
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Foto/avatar */}
                    <td className="py-2.5 px-3 text-center">
                      {emp.persona?.fotoUrl ? (
                        <img
                          src={emp.persona.fotoUrl}
                          alt={emp.nombre}
                          className="w-8 h-8 rounded-full object-cover mx-auto border border-slate-300"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#18235C] text-[#8FA7D6] font-bold text-xs flex items-center justify-center mx-auto shadow-2xs">
                          {iniciales}
                        </div>
                      )}
                    </td>

                    {/* Código */}
                    <td className="py-2.5 px-3 font-mono font-bold text-[#18235C]">
                      {emp.codigo || emp.codigoInterno || '—'}
                    </td>

                    {/* Nombre completo */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => {
                          setSelectedEmpleadoId(emp.id);
                          setInitialExpedienteTab('general');
                        }}
                        className="text-left font-bold text-slate-900 hover:text-[#18235C] hover:underline cursor-pointer block"
                      >
                        {emp.nombre}
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {emp.contacto?.correoCorporativo || emp.email || '—'}
                      </span>
                    </td>

                    {/* Documento */}
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      <span className="font-semibold text-slate-500 mr-1">{emp.persona?.tipoDocumento || emp.tipoDocumento || 'CC'}</span>
                      {emp.documento}
                    </td>

                    {/* Cargo */}
                    <td className="py-2.5 px-3 text-[#18235C] font-semibold">
                      {getCargoNombre(emp.cargoId)}
                    </td>

                    {/* Área */}
                    <td className="py-2.5 px-3 text-slate-700">
                      {getAreaNombre(emp)}
                    </td>

                    {/* Tipo Contrato */}
                    <td className="py-2.5 px-3 text-slate-600">
                      {emp.laboral?.tipoContrato || emp.contrato?.tipo || '—'}
                    </td>

                    {/* Fecha Ingreso */}
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {emp.laboral?.fechaIngreso || emp.contrato?.inicio || '—'}
                    </td>

                    {/* Estado */}
                    <td className="py-2.5 px-3">
                      {renderBadgeEstado(st)}
                    </td>

                    {/* Acciones: Ver | Editar | Historial | Documentos | Inactivar */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {/* Ver */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmpleadoId(emp.id);
                            setInitialExpedienteTab('general');
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-[#18235C] bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                          title="Ver Expediente Digital Completo"
                        >
                          Ver
                        </button>

                        {/* Editar */}
                        {canManageEmployees && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmpleadoAEditar(emp);
                              setWizardOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                            title="Editar Expediente (10 Pestañas)"
                          >
                            Editar
                          </button>
                        )}

                        {/* Historial */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmpleadoId(emp.id);
                            setInitialExpedienteTab('historial');
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                          title="Consultar Historial Laboral / Bitácora"
                        >
                          Historial
                        </button>

                        {/* Documentos */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmpleadoId(emp.id);
                            setInitialExpedienteTab('documentos');
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                          title="Gestionar Documentos Digitales"
                        >
                          Documentos
                        </button>

                        {/* Inactivar / Estado */}
                        {canManageEmployees && (
                          <button
                            type="button"
                            onClick={() => setEmpleadoParaGestionarEstado(emp)}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors cursor-pointer"
                            title="Gestionar Novedad o Estado Laboral"
                          >
                            Inactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {empleadosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No se encontraron empleados con los filtros seleccionados.</p>
                    <button
                      type="button"
                      onClick={handleLimpiarFiltros}
                      className="mt-2 text-xs text-[#18235C] font-bold hover:underline"
                    >
                      Restablecer todos los filtros
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación y Contador */}
        <div className="p-3.5 bg-slate-50 border-t border-[#8FA7D6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>
              Mostrando <strong>{empleadosPaginados.length}</strong> de <strong>{empleadosFiltrados.length}</strong> registros
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hayMasNube && onCargarMasNube && (
              <button
                type="button"
                onClick={() => onCargarMasNube()}
                disabled={cargandoMasNube}
                className="px-3 py-1.5 bg-[#101740] hover:bg-[#18235C] text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{cargandoMasNube ? 'Consultando...' : 'Cargar más de la Nube (+25)'}</span>
              </button>
            )}

            {limiteVisible < empleadosFiltrados.length && (
              <button
                type="button"
                onClick={() => setLimiteVisible(prev => prev + 25)}
                className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Mostrar más (+25)
              </button>
            )}

            {limiteVisible < empleadosFiltrados.length ? (
              <button
                type="button"
                onClick={() => setLimiteVisible(empleadosFiltrados.length)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Ver todos ({empleadosFiltrados.length})
              </button>
            ) : empleadosFiltrados.length > 25 ? (
              <button
                type="button"
                onClick={() => setLimiteVisible(25)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Restablecer a 25
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal Wizard: Nuevo Empleado / Editar Empleado (10 Pestañas) */}
      {wizardOpen && (
        <ModalNuevoEmpleadoWizard
          cargos={cargos}
          empleados={empleados}
          areas={areas}
          procesos={procesos}
          currentUser={currentUser}
          empleadoAEditar={empleadoAEditar}
          onClose={() => {
            setWizardOpen(false);
            setEmpleadoAEditar(null);
          }}
          onVerExpediente={(id) => {
            setSelectedEmpleadoId(id);
            setWizardOpen(false);
            setEmpleadoAEditar(null);
          }}
          onGuardar={async (empleadoGuardado, opciones) => {
            if (empleadoAEditar) {
              if (onUpdateEmpleado) {
                await onUpdateEmpleado(empleadoGuardado);
              }
            } else {
              const res = await onAddEmpleado(empleadoGuardado, opciones);
              if (res && res.usuarioCreado) {
                setComprobanteData({
                  usuario: res.usuarioCreado,
                  passwordTemporal: res.passwordTemporal || opciones?.passwordTemporal || 'BGroup2026*',
                  asunto: generarAsuntoBienvenida(res.usuarioCreado),
                  cuerpo: generarCartaBienvenida(res.usuarioCreado, res.passwordTemporal || opciones?.passwordTemporal || 'BGroup2026*'),
                  fechaEnvio: new Date().toLocaleString('es-CO'),
                  resultadoFirebase: res.resultadoEnvio
                });
              }
            }
          }}
        />
      )}

      {/* Modal Gestión de Estado Laboral */}
      {empleadoParaGestionarEstado && (
        <ModalGestionEstadoEmpleado
          empleado={empleadoParaGestionarEstado}
          cargoNombre={getCargoNombre(empleadoParaGestionarEstado.cargoId)}
          currentUser={currentUser}
          onClose={() => setEmpleadoParaGestionarEstado(null)}
          onGuardar={async (empleadoActualizado) => {
            if (onUpdateEmpleado) {
              await onUpdateEmpleado(empleadoActualizado);
            }
          }}
        />
      )}

      {/* Modal Eliminación de Expediente */}
      {empleadoParaEliminar && (
        <ModalEliminarEmpleado
          empleado={empleadoParaEliminar}
          onClose={() => setEmpleadoParaEliminar(null)}
          onConfirmar={async (id) => {
            if (onDeleteEmpleado) {
              await onDeleteEmpleado(id);
              if (selectedEmpleadoId === id) {
                setSelectedEmpleadoId(null);
              }
            }
          }}
        />
      )}

      {/* Modal Comprobante y Envío de Bienvenida */}
      {comprobanteData && (
        <ComprobanteNotificacionModal
          data={comprobanteData}
          onClose={() => setComprobanteData(null)}
        />
      )}
    </div>
  );
};
