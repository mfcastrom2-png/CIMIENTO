import React, { useState, useMemo, useEffect } from 'react';
import { Empleado, Solicitud, Role, UsuarioSistema, TipoSolicitud, EstadoSolicitud } from '../types';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  Calendar,
  User,
  MessageSquare,
  Lock,
  ShieldCheck,
  Building2,
  HardDrive,
  ExternalLink,
  Printer,
  AlertTriangle,
  Send,
  Inbox,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Eye,
  FileCheck,
  Award
} from 'lucide-react';
import { uid, initialEmpresa } from '../data/initialData';
import { DriveLinkField } from './common/DriveLinkField';
import { isGoogleDriveUrl, formatDriveViewUrl } from '../utils/driveUtils';
import {
  calcularFechaFinalPermisoRemunerado,
  obtenerNombreFestivoColombia
} from '../utils/festivosColombia';
import {
  generarDatosCertificadoLaboral,
  CertificadoLaboralData,
  formatMonedaCOPCertificado
} from '../utils/generadorCertificados';
import { VerCertificadoLaboralModal } from './VerCertificadoLaboralModal';

interface SolicitudesViewProps {
  solicitudes: Solicitud[];
  empleados: Empleado[];
  onAddSolicitud: (nueva: Solicitud) => void;
  onUpdateEstado: (id: string, nuevoEstado: EstadoSolicitud, comentario: string) => void;
  userRole?: Role;
  currentUser?: UsuarioSistema | null;
  isSuperAdmin?: boolean;
  cargos?: any[];
}

export const SolicitudesView: React.FC<SolicitudesViewProps> = ({
  solicitudes,
  empleados,
  onAddSolicitud,
  onUpdateEstado,
  userRole,
  currentUser,
  isSuperAdmin = false,
  cargos = []
}) => {
  // Pestaña principal en vista del colaborador / administrador
  const [tabPortal, setTabPortal] = useState<'centro' | 'buzon'>('centro');

  // Modales
  const [modalRadicarOpen, setModalRadicarOpen] = useState(false);
  const [modalCertificadoVer, setModalCertificadoVer] = useState<CertificadoLaboralData | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    id: string;
    accion: 'Aprobada' | 'Rechazada' | 'Requiere Corrección' | 'En Revisión';
    solicitudObj: Solicitud;
  } | null>(null);
  const [decisionComentario, setDecisionComentario] = useState('');

  // Identificar el colaborador vinculado al usuario autenticado
  const myEmpleado = empleados.find(e =>
    (currentUser?.empleadoId && e.id === currentUser.empleadoId) ||
    (currentUser?.email && e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
    (currentUser?.documento && e.documento === currentUser.documento)
  );

  // Modo empleado
  const isEmployeeMode = userRole === 'empleado' || currentUser?.rol === 'empleado';

  // Selección de colaborador simulado para administradores en pruebas de experiencia
  const [simulatedEmpleadoId, setSimulatedEmpleadoId] = useState<string>(() => {
    return myEmpleado?.id || (empleados.length > 0 ? empleados[0].id : '');
  });

  useEffect(() => {
    if (myEmpleado) {
      setSimulatedEmpleadoId(myEmpleado.id);
    } else if (!simulatedEmpleadoId && empleados.length > 0) {
      setSimulatedEmpleadoId(empleados[0].id);
    }
  }, [myEmpleado, empleados, simulatedEmpleadoId]);

  const effectiveEmpleado = myEmpleado || empleados.find(e => e.id === simulatedEmpleadoId) || empleados[0];

  // Permisos para moderación de RRHH
  const canApprove =
    !isEmployeeMode &&
    Boolean(
      isSuperAdmin ||
      currentUser?.rol === 'superadmin' ||
      currentUser?.rol === 'admin_gh' ||
      currentUser?.permisos?.includes('solicitudes')
    );

  // Filtros de tabla
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [search, setSearch] = useState('');

  // ESTADOS DEL FORMULARIO DE SOLICITUDES
  const [tipoSolicitud, setTipoSolicitud] = useState<TipoSolicitud>('Permiso');

  // Campos Cesantías
  const [subtipoCesantias, setSubtipoCesantias] = useState<Solicitud['subtipoCesantias']>('Vivienda - Compra / Lote');
  const [montoCesantiasCOP, setMontoCesantiasCOP] = useState<number>(1500000);

  // Campos Licencias
  const [subtipoLicencia, setSubtipoLicencia] = useState<Solicitud['subtipoLicencia']>('Luto (5 días hábiles - Ley 1280)');

  // Campos Permisos
  const [permisoCantidadDias, setPermisoCantidadDias] = useState<number>(2);
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().slice(0, 10));

  // Campos Certificados
  const [subtipoCertificado, setSubtipoCertificado] = useState<Solicitud['subtipoCertificado']>('Bancario');
  const [entidadDestino, setEntidadDestino] = useState<string>('');

  // Motivo general / Textarea
  const [motivoGeneral, setMotivoGeneral] = useState<string>('');
  const [soporteUrlDrive, setSoporteUrlDrive] = useState<string>('');

  // Autocalcular fecha final para Permisos Remunerados según festivos de Colombia
  const calculoPermiso = useMemo(() => {
    if (tipoSolicitud === 'Permiso') {
      return calcularFechaFinalPermisoRemunerado(fechaInicio, permisoCantidadDias);
    }
    return {
      fechaFinStr: fechaInicio,
      fechaReintegroStr: fechaInicio,
      diasCalendarioTranscurridos: permisoCantidadDias,
      diasFestivosInvolucrados: []
    };
  }, [tipoSolicitud, fechaInicio, permisoCantidadDias]);

  // Handler para radicar nueva solicitud
  const handleRadicarSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveEmpleado) {
      alert('Error: Debe asociar o seleccionar un colaborador para radicar la solicitud.');
      return;
    }

    // Validación de soporte obligatorio para Cesantías y Licencias
    if ((tipoSolicitud === 'Cesantías' || tipoSolicitud === 'Licencia') && !soporteUrlDrive.trim()) {
      alert('Atención: Para solicitudes de Cesantías y Licencias de Ley es obligatorio adjuntar el enlace del archivo PDF de soporte en Google Drive.');
      return;
    }

    let estadoFinal: EstadoSolicitud = 'Radicada';
    let certificadoData: any = null;
    let codigoVerif: string | undefined = undefined;

    // REGLA DE NEGOCIO: Los certificados laborales evaden la aprobación humana y se autogeneran de inmediato
    if (tipoSolicitud === 'Certificado') {
      estadoFinal = 'Autogenerada';
      const certObj = generarDatosCertificadoLaboral(
        effectiveEmpleado,
        cargos,
        subtipoCertificado || 'Trámite Personal',
        entidadDestino
      );
      certificadoData = certObj;
      codigoVerif = certObj.codigoVerificacion;
    }

    let fechaFinFinal = fechaInicio;
    if (tipoSolicitud === 'Permiso') {
      fechaFinFinal = calculoPermiso.fechaFinStr;
    } else if (tipoSolicitud === 'Licencia') {
      if (subtipoLicencia?.includes('Maternidad')) {
        const d = new Date(fechaInicio);
        d.setDate(d.getDate() + 126); // 18 semanas
        fechaFinFinal = d.toISOString().slice(0, 10);
      } else if (subtipoLicencia?.includes('Paternidad')) {
        const d = new Date(fechaInicio);
        d.setDate(d.getDate() + 14); // 2 semanas
        fechaFinFinal = d.toISOString().slice(0, 10);
      } else if (subtipoLicencia?.includes('Luto')) {
        const c = calcularFechaFinalPermisoRemunerado(fechaInicio, 5);
        fechaFinFinal = c.fechaFinStr;
      }
    }

    const nueva: Solicitud = {
      id: uid(),
      empleadoId: effectiveEmpleado.id,
      empleadoNombre: effectiveEmpleado.nombre,
      empleadoDocumento: effectiveEmpleado.documento,
      empleadoEmail: effectiveEmpleado.email,
      cargoNombre: effectiveEmpleado.laboral?.cargoNombre || 'Colaborador',
      tipo: tipoSolicitud,
      inicio: fechaInicio,
      fin: fechaFinFinal,
      motivo: motivoGeneral.trim() || `Solicitud de ${tipoSolicitud} (${subtipoCesantias || subtipoLicencia || subtipoCertificado || 'General'})`,
      estado: estadoFinal,
      decisorId: tipoSolicitud === 'Certificado' ? 'SISTEMA_AUTO' : null,
      fechaDecision: tipoSolicitud === 'Certificado' ? new Date().toISOString().slice(0, 10) : null,
      comentario: tipoSolicitud === 'Certificado' ? 'Certificado laboral autogenerado y firmado digitalmente de forma instantánea.' : '',
      fechaCreacion: new Date().toISOString().slice(0, 10),
      subtipoCesantias: tipoSolicitud === 'Cesantías' ? subtipoCesantias : undefined,
      montoSolicitadoCOP: tipoSolicitud === 'Cesantías' ? montoCesantiasCOP : undefined,
      subtipoLicencia: tipoSolicitud === 'Licencia' ? subtipoLicencia : undefined,
      diasCantidad: tipoSolicitud === 'Permiso' ? permisoCantidadDias : undefined,
      diasFestivosInvolucrados: tipoSolicitud === 'Permiso' ? calculoPermiso.diasFestivosInvolucrados.map(f => `${f.fecha}: ${f.nombre}`) : undefined,
      subtipoCertificado: tipoSolicitud === 'Certificado' ? subtipoCertificado : undefined,
      entidadDestino: tipoSolicitud === 'Certificado' ? entidadDestino : undefined,
      codigoVerificacionCertificado: codigoVerif,
      certificadoGeneradoData: certificadoData,
      soporteUrlDrive: soporteUrlDrive.trim() || undefined,
      historialRespuestas: [
        {
          fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
          usuarioNombre: effectiveEmpleado.nombre,
          estadoAnterior: 'Nuevo',
          estadoNuevo: estadoFinal,
          comentario: tipoSolicitud === 'Certificado'
            ? 'Certificado autogenerado sin requerir aprobación humana.'
            : 'Solicitud radicada formalmente por el colaborador.'
        }
      ]
    };

    onAddSolicitud(nueva);
    setModalRadicarOpen(false);

    // Si fue certificado, ofrecer previsualización inmediata
    if (tipoSolicitud === 'Certificado' && certificadoData) {
      setModalCertificadoVer(certificadoData);
    } else {
      alert(`¡Solicitud radicada con éxito! Estado actual: ${estadoFinal}. Podrá hacer seguimiento en su Centro de Estados.`);
    }

    // Limpiar formulario
    setMotivoGeneral('');
    setSoporteUrlDrive('');
  };

  // Handler para la moderación de RRHH
  const handleConfirmarDecisionRRHH = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal) return;
    if (!decisionComentario.trim()) {
      alert('Atención: Es obligatorio ingresar una observación justificativa antes de actualizar la solicitud.');
      return;
    }

    onUpdateEstado(decisionModal.id, decisionModal.accion, decisionComentario.trim());
    setDecisionModal(null);
    setDecisionComentario('');
  };

  // Filtrado de solicitudes para la tabla
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(s => {
      // Si está en modo empleado, mostrar solo las solicitudes del colaborador activo
      if (isEmployeeMode) {
        if (s.empleadoId !== effectiveEmpleado?.id && s.empleadoEmail?.toLowerCase() !== effectiveEmpleado?.email?.toLowerCase()) {
          return false;
        }
      }

      if (filterEstado !== 'TODOS') {
        if (filterEstado === 'Pendiente' && (s.estado === 'Radicada' || s.estado === 'En Revisión' || s.estado === 'Pendiente')) {
          // OK
        } else if (s.estado !== filterEstado) {
          return false;
        }
      }

      if (filterTipo !== 'TODOS' && s.tipo !== filterTipo) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const empNombre = (s.empleadoNombre || '').toLowerCase();
        const mot = (s.motivo || '').toLowerCase();
        const subt = (s.subtipoCesantias || s.subtipoLicencia || s.subtipoCertificado || '').toLowerCase();
        return empNombre.includes(q) || mot.includes(q) || subt.includes(q);
      }

      return true;
    });
  }, [solicitudes, isEmployeeMode, effectiveEmpleado, filterEstado, filterTipo, search]);

  // Lista de solicitudes con mensajes o certificados para el Buzón
  const solicitudesBuzon = useMemo(() => {
    if (!effectiveEmpleado) return [];
    return solicitudes.filter(s =>
      s.empleadoId === effectiveEmpleado.id ||
      s.empleadoEmail?.toLowerCase() === effectiveEmpleado.email?.toLowerCase()
    ).sort((a, b) => (b.fechaCreacion || '').localeCompare(a.fechaCreacion || ''));
  }, [solicitudes, effectiveEmpleado]);

  // Semáforo de Estado Badge Component
  const renderSemaforoEstado = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'Radicada':
      case 'Pendiente':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Radicada</span>
          </span>
        );
      case 'En Revisión':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-300 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 shrink-0">
            <RefreshCw className="w-3 h-3 text-purple-600 animate-spin" />
            <span>En Revisión</span>
          </span>
        );
      case 'Aprobada':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Aprobada</span>
          </span>
        );
      case 'Autogenerada':
        return (
          <span className="px-2.5 py-1 bg-emerald-800 text-[#00FF00] border border-emerald-600 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 shrink-0 shadow-xs">
            <Award className="w-3 h-3 text-[#00FF00]" />
            <span>Autogenerada</span>
          </span>
        );
      case 'Rechazada':
        return (
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 shrink-0">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Rechazada</span>
          </span>
        );
      case 'Requiere Corrección':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Corrección Req.</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full font-bold text-[10px] uppercase">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Principal del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#8FA7D6]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Módulo Oficial de Solicitudes & Novedades CST</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18235C]">
            {isEmployeeMode ? 'Portal de Permisos & Trámites Laborales' : 'Consola RRHH - Gestión de Solicitudes'}
          </h1>
          <p className="text-xs sm:text-sm text-[#282829] mt-1 max-w-2xl font-normal">
            {isEmployeeMode
              ? 'Radique solicitudes de cesantías, licencias, permisos remunerados autocalculados y certificados laborales autogenerados al instante.'
              : 'Panel de revisión y moderación de solicitudes con trazabilidad legal en Google Drive y observaciones obligatorias.'}
          </p>
        </div>

        {/* Acciones e Indicadores */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Selector de colaborador simulado para administradores */}
          {!isEmployeeMode && (
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-[#18235C]">Consola Gestión Humana</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setModalRadicarOpen(true)}
            className="px-4 py-2.5 bg-[#18235C] hover:bg-[#101740] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#00FF00]" />
            <span>+ Radicar Nueva Solicitud</span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas en Vista Colaborador */}
      {isEmployeeMode && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setTabPortal('centro')}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              tabPortal === 'centro'
                ? 'bg-[#18235C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#00FF00]" />
            <span>Centro de Estados ({solicitudesFiltradas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabPortal('buzon')}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              tabPortal === 'buzon'
                ? 'bg-[#18235C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4 text-[#00FF00]" />
            <span>Buzón Interno & Certificados ({solicitudesBuzon.length})</span>
          </button>
        </div>
      )}

      {/* VISTA 1: CENTRO DE ESTADOS Y CONSOLA DE REGISTROS */}
      {(tabPortal === 'centro' || !isEmployeeMode) && (
        <div className="space-y-4">
          {/* Tarjetas KPI de Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-[#8FA7D6] rounded-xl shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Solicitudes</span>
              <span className="text-xl font-bold text-[#18235C]">{solicitudesFiltradas.length}</span>
            </div>
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Radicadas / En Revisión</span>
              <span className="text-xl font-bold text-blue-900">
                {solicitudesFiltradas.filter(s => s.estado === 'Radicada' || s.estado === 'En Revisión' || s.estado === 'Pendiente').length}
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Aprobadas / Emitidas</span>
              <span className="text-xl font-bold text-emerald-900">
                {solicitudesFiltradas.filter(s => s.estado === 'Aprobada' || s.estado === 'Autogenerada').length}
              </span>
            </div>
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Correcciones / Rechazos</span>
              <span className="text-xl font-bold text-amber-900">
                {solicitudesFiltradas.filter(s => s.estado === 'Requiere Corrección' || s.estado === 'Rechazada').length}
              </span>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-3 rounded-xl border border-[#8FA7D6] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-[#18235C] flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                <span>Filtrar por:</span>
              </span>

              <select
                value={filterEstado}
                onChange={e => setFilterEstado(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="Pendiente">Radicadas / En Revisión</option>
                <option value="Aprobada">Aprobadas</option>
                <option value="Autogenerada">Autogeneradas</option>
                <option value="Requiere Corrección">Requieren Corrección</option>
                <option value="Rechazada">Rechazadas</option>
              </select>

              <select
                value={filterTipo}
                onChange={e => setFilterTipo(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="Cesantías">Cesantías</option>
                <option value="Licencia">Licencias de Ley</option>
                <option value="Permiso">Permisos Remunerados</option>
                <option value="Certificado">Certificados Laborales</option>
                <option value="Vacaciones">Vacaciones</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o motivo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          {/* Tabla de Centro de Estados y Solicitudes */}
          <div className="bg-white rounded-xl border border-[#8FA7D6] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5">Colaborador & Fecha</th>
                    <th className="p-3.5">Tipo & Motivo Legal</th>
                    <th className="p-3.5">Detalles / Fechas / Monto</th>
                    <th className="p-3.5">Soporte Drive</th>
                    <th className="p-3.5 text-center">Estado (Semáforo)</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {solicitudesFiltradas.map(s => {
                    const emp = empleados.find(e => e.id === s.empleadoId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <strong className="block text-[#18235C] font-bold">
                            {s.empleadoNombre || emp?.nombre || 'Colaborador'}
                          </strong>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            C.C. {s.empleadoDocumento || emp?.documento || '—'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Radicado: {s.fechaCreacion || s.inicio}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-[#18235C] font-bold rounded text-[10px] uppercase inline-block mb-1 border border-slate-300">
                            {s.tipo}
                          </span>
                          <p className="font-bold text-slate-800 text-[11px] leading-tight">
                            {s.subtipoCesantias || s.subtipoLicencia || s.subtipoCertificado || s.motivo}
                          </p>
                          {s.motivo && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 italic">
                              "{s.motivo}"
                            </p>
                          )}
                        </td>

                        <td className="p-3.5 space-y-1">
                          {s.tipo === 'Cesantías' && s.montoSolicitadoCOP && (
                            <div className="font-bold text-emerald-800 text-xs">
                              Monto: {formatMonedaCOPCertificado(s.montoSolicitadoCOP)}
                            </div>
                          )}

                          {s.tipo === 'Permiso' && (
                            <div>
                              <span className="font-bold text-slate-700 block text-[11px]">
                                {s.diasCantidad || 1} día(s) hábil(es)
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Desde: {s.inicio} | Reintegro: {s.fin}
                              </span>
                            </div>
                          )}

                          {s.tipo === 'Licencia' && (
                            <div className="text-[11px] text-slate-700 font-semibold">
                              Periodo: {s.inicio} al {s.fin}
                            </div>
                          )}

                          {s.tipo === 'Certificado' && (
                            <div className="text-[10px] text-slate-600">
                              Destino: <strong>{s.entidadDestino || 'A quien corresponda'}</strong>
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          {s.soporteUrlDrive ? (
                            <a
                              href={formatDriveViewUrl(s.soporteUrlDrive)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-100 transition-colors w-max"
                            >
                              <HardDrive className="w-3 h-3 text-emerald-700" />
                              <span>Ver PDF Soporte</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin archivo adjunto</span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          {renderSemaforoEstado(s.estado)}
                        </td>

                        <td className="p-3.5 text-right space-y-1">
                          {/* Acciones según el rol */}
                          {canApprove && (s.estado === 'Radicada' || s.estado === 'En Revisión' || s.estado === 'Pendiente') && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDecisionModal({ id: s.id, accion: 'Aprobada', solicitudObj: s })}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Aprobar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDecisionModal({ id: s.id, accion: 'Requiere Corrección', solicitudObj: s })}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <span>Corrección</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDecisionModal({ id: s.id, accion: 'Rechazada', solicitudObj: s })}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <span>Rechazar</span>
                              </button>
                            </div>
                          )}

                          {s.tipo === 'Certificado' && s.certificadoGeneradoData && (
                            <button
                              type="button"
                              onClick={() => setModalCertificadoVer(s.certificadoGeneradoData)}
                              className="px-2.5 py-1 bg-[#18235C] text-white hover:bg-[#101740] rounded font-bold text-[10px] flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-[#00FF00]" />
                              <span>Ver Certificado PDF</span>
                            </button>
                          )}

                          {s.comentario && (
                            <div className="text-[10px] text-slate-500 italic max-w-xs text-right line-clamp-2">
                              Obs: "{s.comentario}"
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {solicitudesFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 space-y-2">
                        <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-bold text-xs">No se encontraron solicitudes registradas.</p>
                        <p className="text-[11px]">Haga clic en "+ Radicar Nueva Solicitud" para iniciar un trámite formal.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: BUZÓN INTERNO Y CASILLERO DIGITAL DEL EMPLEADO */}
      {isEmployeeMode && tabPortal === 'buzon' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <Inbox className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-emerald-950 text-sm">
                Casillero Digital & Respuestas Oficiales de Gestión Humana:
              </strong>
              <span>
                En este buzón privado recibirá los pronunciamientos oficiales de RRHH, observaciones para corrección de trámites y sus <strong>Certificados Laborales autogenerados listos para imprimir con firma digital y código QR</strong>.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {solicitudesBuzon.map(s => (
              <div
                key={s.id}
                className="p-4 bg-white border border-[#8FA7D6] rounded-xl shadow-2xs space-y-3 relative hover:border-[#18235C] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block">Radicado #{s.id.slice(-6)}</span>
                    <h4 className="font-bold text-[#18235C] text-sm">
                      {s.tipo}: {s.subtipoCesantias || s.subtipoLicencia || s.subtipoCertificado || s.motivo}
                    </h4>
                  </div>
                  {renderSemaforoEstado(s.estado)}
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Fecha de Trámite:</span>
                    <strong className="font-mono">{s.fechaCreacion || s.inicio}</strong>
                  </div>

                  {s.montoSolicitadoCOP && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Monto Aprobado/Solicitado:</span>
                      <strong className="text-emerald-800 font-bold">{formatMonedaCOPCertificado(s.montoSolicitadoCOP)}</strong>
                    </div>
                  )}

                  {s.comentario && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 space-y-0.5">
                      <span className="font-bold text-[#18235C] block">Respuesta / Observación de RRHH:</span>
                      <p className="italic">"{s.comentario}"</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {s.soporteUrlDrive ? (
                    <a
                      href={formatDriveViewUrl(s.soporteUrlDrive)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Sporte PDF</span>
                    </a>
                  ) : <span />}

                  {s.tipo === 'Certificado' && s.certificadoGeneradoData && (
                    <button
                      type="button"
                      onClick={() => setModalCertificadoVer(s.certificadoGeneradoData)}
                      className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>Imprimir / Descargar Certificado</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {solicitudesBuzon.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 space-y-2">
                <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-xs">Su buzón interno se encuentra vacío.</p>
                <p className="text-[11px]">Cualquier respuesta de RRHH o certificado generado aparecerá en esta bandeja.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: RADICAR NUEVA SOLICITUD (FORMULARIO DINÁMICO CST) */}
      {modalRadicarOpen && (
        <div className="fixed inset-0 z-50 bg-[#18235C]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#8FA7D6] space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#18235C]">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base">Radicar Nueva Solicitud o Trámite CST</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRadicarOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRadicarSolicitud} className="space-y-4 text-xs">
              {/* Información del Colaborador */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Colaborador Solicitante</span>
                  <strong className="text-[#18235C] text-sm">{effectiveEmpleado?.nombre}</strong>
                  <span className="text-[11px] text-slate-600 block">
                    C.C. {effectiveEmpleado?.documento} — {effectiveEmpleado?.laboral?.cargoNombre || 'Colaborador'}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                  Activo CST
                </span>
              </div>

              {/* Selector Tipo de Solicitud */}
              <div>
                <label className="block font-bold text-[#18235C] mb-1">Tipo de Trámite / Solicitud *</label>
                <select
                  value={tipoSolicitud}
                  onChange={e => setTipoSolicitud(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl font-bold text-sm text-[#18235C]"
                >
                  <option value="Permiso">Permiso Remunerado (Autocalculado con Festivos)</option>
                  <option value="Cesantías">Retiro Parcial / Avance de Cesantías (Ley 50/90)</option>
                  <option value="Licencia">Licencia de Ley (Maternidad / Paternidad / Luto / Voto)</option>
                  <option value="Certificado">Certificado Laboral (Autogeneración Instantánea)</option>
                </select>
              </div>

              {/* FORMULARIO ESPECÍFICO 1: CESANTÍAS */}
              {tipoSolicitud === 'Cesantías' && (
                <div className="space-y-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl animate-fade-in">
                  <span className="text-xs font-bold text-emerald-950 block">
                    Normativa de Cesantías (Ley 50/90 & Decreto 1072/15)
                  </span>

                  <div>
                    <label className="block font-bold text-[#18235C] mb-1">Motivo / Destino Permitido por Ley *</label>
                    <select
                      value={subtipoCesantias}
                      onChange={e => setSubtipoCesantias(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg font-bold"
                    >
                      <option value="Vivienda - Compra / Lote">Vivienda — Adquisición de compraventa o lote</option>
                      <option value="Vivienda - Construcción / Mejora">Vivienda — Construcción, remodelación o mejora</option>
                      <option value="Liberación de Gravámenes / Hipoteca">Vivienda — Liberación de gravámenes o pago de hipoteca</option>
                      <option value="Educación Superior / Técnica / Tecnológica">Educación — Matrícula superior/técnica (Trabajador/Familia)</option>
                      <option value="Acciones del Estado">Inversión — Adquisición de acciones del Estado (Ley 226/95)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#18235C] mb-1">Monto Solicitado (COP) *</label>
                    <input
                      type="number"
                      required
                      min={100000}
                      step={50000}
                      value={montoCesantiasCOP}
                      onChange={e => setMontoCesantiasCOP(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Equivalente: {formatMonedaCOPCertificado(montoCesantiasCOP)}
                    </span>
                  </div>

                  {/* Carga Obligatoria Soporte Drive */}
                  <DriveLinkField
                    value={soporteUrlDrive}
                    onChange={setSoporteUrlDrive}
                    label="Enlace del Archivo Soporte Legal en Google Drive (PDF Obligatorio) *"
                    required
                    placeholder="https://drive.google.com/file/d/.../view"
                    helpText="Adjunte promesa de compraventa, recibo de matrícula o paz y salvo de hipoteca guardado en su Drive."
                  />
                </div>
              )}

              {/* FORMULARIO ESPECÍFICO 2: LICENCIAS */}
              {tipoSolicitud === 'Licencia' && (
                <div className="space-y-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl animate-fade-in">
                  <span className="text-xs font-bold text-blue-950 block">
                    Licencias de Ley en Colombia (CST)
                  </span>

                  <div>
                    <label className="block font-bold text-[#18235C] mb-1">Tipo de Licencia de Ley *</label>
                    <select
                      value={subtipoLicencia}
                      onChange={e => setSubtipoLicencia(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg font-bold"
                    >
                      <option value="Maternidad (18 semanas - Ley 2114)">Licencia de Maternidad (18 semanas - Ley 2114 de 2021)</option>
                      <option value="Paternidad (2 semanas - Ley 2114)">Licencia de Paternidad (2 semanas remuneradas)</option>
                      <option value="Luto (5 días hábiles - Ley 1280)">Licencia por Luto (5 días hábiles remunerados - Ley 1280/09)</option>
                      <option value="Calamidad Doméstica (Remunerada)">Calamidad Doméstica (Grave hecho sobre intervinientes familiares)</option>
                      <option value="Sufragio / Voto (Media jornada - Ley 403)">Licencia por Voto / Sufragio (Media jornada remunerada - Ley 403)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#18235C] mb-1">Fecha Inicial *</label>
                    <input
                      type="date"
                      required
                      value={fechaInicio}
                      onChange={e => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg font-bold"
                    />
                  </div>

                  {/* Carga Obligatoria Soporte Drive */}
                  <DriveLinkField
                    value={soporteUrlDrive}
                    onChange={setSoporteUrlDrive}
                    label="Soporte Médico / Registro en Google Drive (PDF Obligatorio) *"
                    required
                    placeholder="https://drive.google.com/file/d/.../view"
                    helpText="Adjunte registro civil de nacimiento, incapacidad médica EPS o certificado de defunción según corresponda."
                  />
                </div>
              )}

              {/* FORMULARIO ESPECÍFICO 3: PERMISOS REMUNERADOS */}
              {tipoSolicitud === 'Permiso' && (
                <div className="space-y-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl animate-fade-in">
                  <span className="text-xs font-bold text-amber-950 block">
                    Permiso Remunerado con Autocálculo de Días Hábiles (Festivos Colombia)
                  </span>

                  <div>
                    <label className="block font-bold text-[#18235C] mb-1">Motivo Justificado del Permiso *</label>
                    <textarea
                      required
                      rows={2}
                      value={motivoGeneral}
                      onChange={e => setMotivoGeneral(e.target.value)}
                      placeholder="Describa detalladamente las razones personales, académicas o médicas del permiso..."
                      className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#18235C] mb-1">Cantidad de Días *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={15}
                        value={permisoCantidadDias}
                        onChange={e => setPermisoCantidadDias(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#18235C] mb-1">Fecha Inicial *</label>
                      <input
                        type="date"
                        required
                        value={fechaInicio}
                        onChange={e => setFechaInicio(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  {/* FECHA FINAL AUTOCALCULADA (SOLO LECTURA EXCLUYENDO FESTIVOS Y FINES DE SEMANA) */}
                  <div className="p-3 bg-white border border-amber-300 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-bold">Fecha Final Autocalculada (Solo Lectura):</span>
                      <strong className="text-emerald-800 font-mono text-sm font-bold">{calculoPermiso.fechaFinStr}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-1">
                      <span>Fecha de Reintegro a Labores:</span>
                      <strong className="text-[#18235C] font-mono">{calculoPermiso.fechaReintegroStr}</strong>
                    </div>

                    {calculoPermiso.diasFestivosInvolucrados.length > 0 && (
                      <div className="text-[10px] text-amber-800 bg-amber-100/80 p-2 rounded border border-amber-200 mt-1">
                        <strong>Festivos oficiales excluidos del conteo:</strong>
                        <ul className="list-disc pl-4 mt-0.5">
                          {calculoPermiso.diasFestivosInvolucrados.map((f, i) => (
                            <li key={i}>{f.fecha}: {f.nombre}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Soporte Opcional para Permisos */}
                  <DriveLinkField
                    value={soporteUrlDrive}
                    onChange={setSoporteUrlDrive}
                    label="Soporte Opcional en Google Drive"
                    placeholder="https://drive.google.com/file/d/.../view"
                  />
                </div>
              )}

              {/* FORMULARIO ESPECÍFICO 4: CERTIFICADOS LABORALES */}
              {tipoSolicitud === 'Certificado' && (
                <div className="space-y-3 p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Autogeneración Inmediata de Certificado Laboral (Evasión de aprobación humana)</span>
                  </div>

                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Esta solicitud genera e imprime automáticamente un <strong>Certificado Laboral Oficial firmado digitalmente</strong> con salario, tipo de contrato, cargo y código de verificación QR, enviando la copia a su Buzón Interno sin requerir revisión manual.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#18235C] mb-1">Motivo del Certificado *</label>
                      <select
                        value={subtipoCertificado}
                        onChange={e => setSubtipoCertificado(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg font-bold"
                      >
                        <option value="Bancario">Bancario / Trámite Financiero</option>
                        <option value="Arrendamiento">Estudio Inmobiliario / Arrendamiento</option>
                        <option value="Trámite Personal">Trámite Personal / General</option>
                        <option value="Entidad Específica">Entidad Específica / Dirigido A</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#18235C] mb-1">Dirigido A / Entidad (Opcional)</label>
                      <input
                        type="text"
                        value={entidadDestino}
                        onChange={e => setEntidadDestino(e.target.value)}
                        placeholder="Ej: Banco de Bogotá / Embajada USA"
                        className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Acción Modal */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalRadicarOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#18235C] hover:bg-[#101740] text-white font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#00FF00]" />
                  <span>
                    {tipoSolicitud === 'Certificado' ? 'Generar Certificado Inmediato' : 'Radicar Solicitud Oficial'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DECISIÓN Y MODERACIÓN DE RRHH (OBSERVACIÓN OBLIGATORIA) */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 bg-[#18235C]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#8FA7D6] space-y-4">
            <div className="flex items-center gap-3 text-[#18235C]">
              <MessageSquare className="w-6 h-6 text-emerald-700 shrink-0" />
              <h3 className="font-bold text-base">
                Moderación RRHH: {decisionModal.accion} Solicitud
              </h3>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Solicitud de <strong>{decisionModal.solicitudObj.tipo}</strong> radicada por{' '}
              <strong>{decisionModal.solicitudObj.empleadoNombre}</strong>.
            </p>

            <form onSubmit={handleConfirmarDecisionRRHH} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Observación Obligatoria para el Colaborador *
                </label>
                <textarea
                  required
                  rows={3}
                  value={decisionComentario}
                  onChange={e => setDecisionComentario(e.target.value)}
                  placeholder="Escriba la justificación, recomendación o instrucción clara para el trabajador..."
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDecisionModal(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={`px-5 py-2 font-bold text-white rounded-xl shadow-sm cursor-pointer ${
                    decisionModal.accion === 'Aprobada'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : decisionModal.accion === 'Rechazada'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirmar {decisionModal.accion}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVISUALIZADOR E IMPRESOR DE CERTIFICADO LABORAL */}
      {modalCertificadoVer && (
        <VerCertificadoLaboralModal
          certificado={modalCertificadoVer}
          onClose={() => setModalCertificadoVer(null)}
        />
      )}
    </div>
  );
};
