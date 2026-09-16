import React, { useState, useMemo, useEffect } from 'react';
import {
  Cargo,
  ControlVacacionesEmpleado,
  Empleado,
  Role,
  SolicitudVacacionDetalle
} from '../types';
import {
  INITIAL_CONTROL_VACACIONES,
  INITIAL_SOLICITUDES_VACACIONES
} from '../data/usuariosYVotacionesData';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Palmtree,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  Users,
  X,
  XCircle
} from 'lucide-react';

interface ControlVacacionesViewProps {
  empleados: Empleado[];
  cargos: Cargo[];
  userRole?: Role;
  currentEmpleadoId?: string;
}

export function ControlVacacionesView({
  empleados,
  cargos,
  userRole = 'admin',
  currentEmpleadoId
}: ControlVacacionesViewProps) {
  const [controles, setControles] = useState<ControlVacacionesEmpleado[]>(() => {
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      const empIds = new Set(empleados.map(e => e.id));
      return INITIAL_CONTROL_VACACIONES.filter(c => empIds.has(c.empleadoId));
    }
    return INITIAL_CONTROL_VACACIONES;
  });

  const [solicitudes, setSolicitudes] = useState<SolicitudVacacionDetalle[]>(() => {
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      const empIds = new Set(empleados.map(e => e.id));
      return INITIAL_SOLICITUDES_VACACIONES.filter(s => empIds.has(s.empleadoId));
    }
    return INITIAL_SOLICITUDES_VACACIONES;
  });

  // Sincronizar automáticamente controles y solicitudes cuando la lista de empleados cambie
  useEffect(() => {
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      const empIds = new Set(empleados.map(e => e.id));
      setControles(prev => {
        const existentesFiltrados = prev.filter(c => empIds.has(c.empleadoId));
        const existentesIds = new Set(existentesFiltrados.map(c => c.empleadoId));
        const nuevos: ControlVacacionesEmpleado[] = empleados.filter(e => !existentesIds.has(e.id)).map(e => {
          const cargo = cargos.find(cg => cg.id === e.cargoId);
          const diasCausados = 15;
          return {
            empleadoId: e.id,
            empleadoNombre: e.nombre,
            documento: e.documento,
            cargoNombre: cargo?.nombre || 'Colaborador',
            fechaIngreso: e.contrato.inicio || '2026-01-01',
            diasLaboradosTotal: 360,
            diasVacacionesCausados: diasCausados,
            diasDisfrutadosAcumulados: 0,
            diasEnSolicitud: 0,
            diasPendientesDisfrute: diasCausados,
            periodosAcumulados: 1,
            estadoAlerta: 'Al día',
            provisionAcumuladaCOP: 800000,
            ultimoPeriodoDisfrutado: 'Ninguno'
          };
        });
        return [...existentesFiltrados, ...nuevos];
      });

      setSolicitudes(prev => prev.filter(s => empIds.has(s.empleadoId)));
    }
  }, [empleados, cargos]);

  const [activeTab, setActiveTab] = useState<'matriz' | 'solicitudes' | 'normativa'>('matriz');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAlerta, setFiltroAlerta] = useState<string>('TODOS');
  const [filtroEstadoSolicitud, setFiltroEstadoSolicitud] = useState<string>('TODOS');

  // Modales
  const [modalNuevaSolicitudOpen, setModalNuevaSolicitudOpen] = useState(false);
  const [modalPlanillaOpen, setModalPlanillaOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudVacacionDetalle | null>(null);

  // Formulario nueva solicitud
  const [formSolicitud, setFormSolicitud] = useState({
    empleadoId: empleados[0]?.id || '',
    fechaInicio: '2026-10-15',
    diasHabiles: 10,
    periodoCorrespondiente: '2025 - 2026',
    reemplazoCargo: 'Colaborador de Apoyo',
    reemplazoEmpleadoId: empleados[1]?.id || '',
    observaciones: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Resumen métrico del cuadro de control
  const resumenVacaciones = useMemo(() => {
    let totalCausados = 0;
    let totalDisfrutados = 0;
    let totalPendientes = 0;
    let totalProvision = 0;
    let alertasCriticas = 0;

    controles.forEach(c => {
      totalCausados += c.diasVacacionesCausados;
      totalDisfrutados += c.diasDisfrutadosAcumulados;
      totalPendientes += c.diasPendientesDisfrute;
      totalProvision += c.provisionAcumuladaCOP;
      if (c.estadoAlerta === 'Crítico (≥ 2 periodos)') alertasCriticas++;
    });

    const pendientesAprobacion = solicitudes.filter(s => s.estado === 'Pendiente').length;

    return {
      totalCausados: Math.round(totalCausados * 10) / 10,
      totalDisfrutados: Math.round(totalDisfrutados * 10) / 10,
      totalPendientes: Math.round(totalPendientes * 10) / 10,
      totalProvision,
      alertasCriticas,
      pendientesAprobacion
    };
  }, [controles, solicitudes]);

  // Filtrado de la matriz de saldos
  const filteredControles = useMemo(() => {
    return controles.filter(c => {
      const matchSearch =
        c.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documento.includes(searchTerm) ||
        c.cargoNombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAlerta = filtroAlerta === 'TODOS' || c.estadoAlerta === filtroAlerta;

      return matchSearch && matchAlerta;
    });
  }, [controles, searchTerm, filtroAlerta]);

  // Filtrado de solicitudes
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter(s => {
      const matchSearch = s.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = filtroEstadoSolicitud === 'TODOS' || s.estado === filtroEstadoSolicitud;
      return matchSearch && matchEstado;
    });
  }, [solicitudes, searchTerm, filtroEstadoSolicitud]);

  // Acción: Aprobar Solicitud
  const handleAprobarSolicitud = (solicitudId: string) => {
    setSolicitudes(prev =>
      prev.map(s => {
        if (s.id === solicitudId) {
          return {
            ...s,
            estado: 'Aprobada',
            aprobadoPor: 'Dirección de Gestión Humana',
            fechaAprobacion: new Date().toISOString().split('T')[0]
          };
        }
        return s;
      })
    );

    // Actualizar control del empleado
    const sol = solicitudes.find(s => s.id === solicitudId);
    if (sol) {
      setControles(prev =>
        prev.map(c => {
          if (c.empleadoId === sol.empleadoId) {
            const nuevosPendientes = Math.max(0, c.diasPendientesDisfrute - sol.diasHabiles);
            const nuevosDisfrutados = c.diasDisfrutadosAcumulados + sol.diasHabiles;
            return {
              ...c,
              diasPendientesDisfrute: Math.round(nuevosPendientes * 100) / 100,
              diasDisfrutadosAcumulados: Math.round(nuevosDisfrutados * 100) / 100,
              diasEnSolicitud: 0,
              estadoAlerta: nuevosPendientes >= 30 ? 'Crítico (≥ 2 periodos)' : nuevosPendientes >= 15 ? '1 periodo' : 'Al día'
            };
          }
          return c;
        })
      );
    }

    showToast('Solicitud de vacaciones aprobada satisfactoriamente.');
  };

  // Acción: Rechazar Solicitud
  const handleRechazarSolicitud = (solicitudId: string) => {
    const motivo = prompt('Por favor ingrese el motivo del aplazamiento o rechazo:', 'Necesidades operativas del servicio / Traslape de cuadrilla');
    if (!motivo) return;

    setSolicitudes(prev =>
      prev.map(s => {
        if (s.id === solicitudId) {
          return {
            ...s,
            estado: 'Rechazada',
            motivoRechazo: motivo
          };
        }
        return s;
      })
    );

    // Liberar días en solicitud
    const sol = solicitudes.find(s => s.id === solicitudId);
    if (sol) {
      setControles(prev =>
        prev.map(c => {
          if (c.empleadoId === sol.empleadoId) {
            return { ...c, diasEnSolicitud: 0 };
          }
          return c;
        })
      );
    }

    showToast('Solicitud actualizada como rechazada / aplazada.');
  };

  // Acción: Crear nueva solicitud
  const handleCrearSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = empleados.find(e => e.id === formSolicitud.empleadoId);
    if (!emp) return;

    // Calcular fecha retorno estimada (sumando días hábiles)
    const fechaSalida = new Date(formSolicitud.fechaInicio);
    const fechaRetorno = new Date(fechaSalida);
    fechaRetorno.setDate(fechaRetorno.getDate() + formSolicitud.diasHabiles + 3); // estimación básica sin domingos

    const nuevaSol: SolicitudVacacionDetalle = {
      id: `vac-sol-${Date.now().toString().slice(-4)}`,
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaInicio: formSolicitud.fechaInicio,
      fechaFin: fechaSalida.toISOString().split('T')[0],
      fechaReintegro: fechaRetorno.toISOString().split('T')[0],
      diasHabiles: Number(formSolicitud.diasHabiles),
      diasCalendario: Number(formSolicitud.diasHabiles) + 2,
      periodoCorrespondiente: formSolicitud.periodoCorrespondiente,
      estado: userRole === 'admin' ? 'Aprobada' : 'Pendiente',
      reemplazoCargo: formSolicitud.reemplazoCargo,
      reemplazoEmpleadoId: formSolicitud.reemplazoEmpleadoId,
      liquidadoEnNomina: false,
      aprobadoPor: userRole === 'admin' ? 'Administrador GH' : undefined,
      fechaAprobacion: userRole === 'admin' ? new Date().toISOString().split('T')[0] : undefined
    };

    setSolicitudes(prev => [nuevaSol, ...prev]);

    // Actualizar control
    setControles(prev =>
      prev.map(c => {
        if (c.empleadoId === emp.id) {
          if (userRole === 'admin') {
            const nuevosPendientes = Math.max(0, c.diasPendientesDisfrute - nuevaSol.diasHabiles);
            return {
              ...c,
              diasDisfrutadosAcumulados: c.diasDisfrutadosAcumulados + nuevaSol.diasHabiles,
              diasPendientesDisfrute: Math.round(nuevosPendientes * 100) / 100,
              estadoAlerta: nuevosPendientes >= 30 ? 'Crítico (≥ 2 periodos)' : nuevosPendientes >= 15 ? '1 periodo' : 'Al día'
            };
          } else {
            return {
              ...c,
              diasEnSolicitud: nuevaSol.diasHabiles
            };
          }
        }
        return c;
      })
    );

    setModalNuevaSolicitudOpen(false);
    showToast(`Solicitud de ${emp.nombre} registrada correctamente.`);
  };

  const getAlertaBadge = (alerta: string) => {
    switch (alerta) {
      case 'Crítico (≥ 2 periodos)':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3 text-rose-700" />
            Crítico (≥ 2 periodos)
          </span>
        );
      case '1 periodo':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-amber-700" />
            1 periodo pendiente
          </span>
        );
      case 'Al día':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Al día (&lt; 1 periodo)
          </span>
        );
    }
  };

  const getEstadoSolicitudBadge = (estado: string) => {
    switch (estado) {
      case 'Aprobada':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            Aprobada
          </span>
        );
      case 'Disfrutada':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#8FA7D6]/15 text-[#18235C] border border-[#8FA7D6]/40 flex items-center gap-1">
            <Sun className="w-3 h-3 text-[#18235C]" />
            Disfrutada
          </span>
        );
      case 'Rechazada':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rechazada / Aplazada
          </span>
        );
      case 'Pendiente':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Pendiente de Aprobación
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#18235C] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-[#8FA7D6]/30 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-white rounded-xl border border-[#8FA7D6]/30 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
                <Palmtree className="w-3.5 h-3.5 text-[#18235C]" />
                Control de Descansos Remunerados
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8FA7D6]/15 text-[#18235C] border border-[#8FA7D6]/30">
                Artículos 186 al 192 del CST
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                B GROUP INGENIERIA S.A.S.
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#18235C]">
              Cuadro de Control de Solicitudes y Saldos de Vacaciones
            </h2>
            <p className="text-xs sm:text-sm text-[#282829]/70 mt-0.5 max-w-2xl">
              Seguimiento exacto de causación (15 días hábiles por año continuo de servicios), semáforo de acumulación legal para prevención de contingencias (Art. 190 CST) y registro contable de provisiones en libros.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              id="btn-ver-planilla-vacaciones"
              onClick={() => setModalPlanillaOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-[#8FA7D6]/15 hover:bg-[#8FA7D6]/25 text-[#18235C] rounded-lg border border-[#8FA7D6]/40 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#18235C]" />
              <span>Planilla Oficial Imprimible</span>
            </button>

            <button
              id="btn-nueva-solicitud-vacaciones"
              onClick={() => setModalNuevaSolicitudOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#00FF00]" />
              <span>Nueva Solicitud</span>
            </button>
          </div>
        </div>

        {/* Métricas Consolidadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-[#8FA7D6]/20">
          <div className="p-3.5 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30">
            <div className="text-[10px] font-semibold text-[#282829]/70 uppercase tracking-wider flex items-center justify-between">
              Días Pendientes Totales
              <Palmtree className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-xl font-bold text-[#18235C] mt-0.5">
              {resumenVacaciones.totalPendientes} <span className="text-xs font-normal text-[#282829]/60">días hábiles</span>
            </div>
            <div className="text-[10px] text-[#282829]/60">Por disfrutar en la plantilla</div>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30">
            <div className="text-[10px] font-semibold text-[#282829]/70 uppercase tracking-wider flex items-center justify-between">
              Alertas de Acumulación
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className={`text-xl font-bold mt-0.5 ${resumenVacaciones.alertasCriticas > 0 ? 'text-rose-700' : 'text-[#18235C]'}`}>
              {resumenVacaciones.alertasCriticas} <span className="text-xs font-normal text-[#282829]/60">casos críticos</span>
            </div>
            <div className="text-[10px] text-[#282829]/60">Riesgo legal Art. 190 CST</div>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30">
            <div className="text-[10px] font-semibold text-[#282829]/70 uppercase tracking-wider flex items-center justify-between">
              Solicitudes Pendientes
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-[#18235C] mt-0.5">
              {resumenVacaciones.pendientesAprobacion}
            </div>
            <div className="text-[10px] text-[#282829]/60">Por autorizar por GH</div>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30">
            <div className="text-[10px] font-semibold text-[#282829]/70 uppercase tracking-wider flex items-center justify-between">
              Provisión en Libros
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-bold text-[#18235C] mt-0.5">
              {formatCOP(resumenVacaciones.totalProvision)}
            </div>
            <div className="text-[10px] text-[#282829]/60">Pasivo laboral consolidado</div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-[#8FA7D6]/20 mt-6 gap-6 text-xs font-semibold overflow-x-auto">
          <button
            id="tab-vacaciones-matriz"
            onClick={() => setActiveTab('matriz')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'matriz'
                ? 'border-[#18235C] text-[#18235C] font-bold'
                : 'border-transparent text-[#282829]/60 hover:text-[#18235C]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Matriz de Saldos por Colaborador ({filteredControles.length})
          </button>
          <button
            id="tab-vacaciones-solicitudes"
            onClick={() => setActiveTab('solicitudes')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'solicitudes'
                ? 'border-[#18235C] text-[#18235C] font-bold'
                : 'border-transparent text-[#282829]/60 hover:text-[#18235C]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Historial de Solicitudes y Aprobaciones ({solicitudes.length})
            {resumenVacaciones.pendientesAprobacion > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                {resumenVacaciones.pendientesAprobacion}
              </span>
            )}
          </button>
          <button
            id="tab-vacaciones-normativa"
            onClick={() => setActiveTab('normativa')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'normativa'
                ? 'border-[#18235C] text-[#18235C] font-bold'
                : 'border-transparent text-[#282829]/60 hover:text-[#18235C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Guía Legal & Normativa CST
          </button>
        </div>
      </div>

      {/* TAB 1: MATRIZ DE SALDOS POR COLABORADOR */}
      {activeTab === 'matriz' && (
        <div className="space-y-4">
          {/* Controles de filtro */}
          <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/30 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#282829]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-colaborador-vacaciones"
                type="text"
                placeholder="Buscar colaborador, documento o cargo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-[#8FA7D6]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18235C]/20 focus:border-[#18235C]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#282829]">
              <Filter className="w-3.5 h-3.5 text-[#18235C]" />
              <span className="text-[11px] font-semibold text-[#18235C]">Semáforo de Acumulación:</span>
              <select
                id="filter-semaforo-vacaciones"
                value={filtroAlerta}
                onChange={e => setFiltroAlerta(e.target.value)}
                className="bg-slate-50 border border-[#8FA7D6]/40 rounded-md px-2.5 py-1 text-xs text-[#282829] focus:outline-none focus:border-[#18235C]"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="Al día">Al día (&lt; 1 periodo)</option>
                <option value="1 periodo">1 periodo pendiente</option>
                <option value="Crítico (≥ 2 periodos)">Crítico (≥ 2 periodos)</option>
              </select>
            </div>
          </div>

          {/* Tabla de la Matriz de Control */}
          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Colaborador & Cargo</th>
                    <th className="p-3.5">Fecha Ingreso</th>
                    <th className="p-3.5 text-center">Días Causados</th>
                    <th className="p-3.5 text-center">Días Disfrutados</th>
                    <th className="p-3.5 text-center">En Solicitud</th>
                    <th className="p-3.5 text-center font-bold">Saldo Pendiente</th>
                    <th className="p-3.5">Semáforo Legal</th>
                    <th className="p-3.5 text-right">Provisión en Libros</th>
                    <th className="p-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {filteredControles.map(c => (
                    <tr key={c.empleadoId} className="hover:bg-[#8FA7D6]/10 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#18235C]">{c.empleadoNombre}</div>
                        <div className="text-[11px] text-[#282829]/70">{c.cargoNombre}</div>
                        <div className="text-[10px] text-[#282829]/50">CC: {c.documento}</div>
                      </td>

                      <td className="p-3.5 text-[#282829]">
                        <div className="font-medium text-[#282829]">{c.fechaIngreso}</div>
                        <div className="text-[10px] text-[#282829]/50">{c.diasLaboradosTotal} días lab.</div>
                      </td>

                      <td className="p-3.5 text-center font-medium text-[#282829]">
                        {c.diasVacacionesCausados} d
                      </td>

                      <td className="p-3.5 text-center font-semibold text-[#18235C]">
                        {c.diasDisfrutadosAcumulados} d
                      </td>

                      <td className="p-3.5 text-center">
                        {c.diasEnSolicitud > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">
                            {c.diasEnSolicitud} d
                          </span>
                        ) : (
                          <span className="text-[#282829]/40">0</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-md bg-[#18235C]/10 text-[#18235C] font-bold text-xs border border-[#18235C]/20">
                          {c.diasPendientesDisfrute} días
                        </span>
                      </td>

                      <td className="p-3.5">
                        {getAlertaBadge(c.estadoAlerta)}
                      </td>

                      <td className="p-3.5 text-right font-medium text-[#18235C]">
                        {formatCOP(c.provisionAcumuladaCOP)}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setFormSolicitud({
                              ...formSolicitud,
                              empleadoId: c.empleadoId
                            });
                            setModalNuevaSolicitudOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#18235C]/10 text-[#18235C] hover:bg-[#18235C] hover:text-white transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Programar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredControles.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#282829]/60">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Palmtree className="w-8 h-8 text-[#8FA7D6]" />
                          <p className="font-semibold text-sm text-[#18235C]">
                            {empleados.length === 0
                              ? 'Base de datos limpia: No hay colaboradores registrados'
                              : 'No se encontraron registros de vacaciones con los filtros actuales'}
                          </p>
                          <p className="text-xs text-[#282829]/60 max-w-md">
                            {empleados.length === 0
                              ? 'Los datos de prueba han sido limpiados. Diríjase al módulo de Empleados para registrar o importar el personal real de su organización.'
                              : 'Intente buscar con otro nombre o cambie el filtro de acumulación.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE SOLICITUDES Y APROBACIONES */}
      {activeTab === 'solicitudes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/30 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#282829]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-solicitudes-vacaciones"
                type="text"
                placeholder="Buscar solicitud por colaborador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-[#8FA7D6]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18235C]/20"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#282829]">
              <Filter className="w-3.5 h-3.5 text-[#18235C]" />
              <span className="text-[11px] font-semibold text-[#18235C]">Estado Solicitud:</span>
              <select
                id="filter-estado-solicitud-vacaciones"
                value={filtroEstadoSolicitud}
                onChange={e => setFiltroEstadoSolicitud(e.target.value)}
                className="bg-slate-50 border border-[#8FA7D6]/40 rounded-md px-2.5 py-1 text-xs text-[#282829] focus:outline-none focus:border-[#18235C]"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="Pendiente">Pendientes de Aprobación</option>
                <option value="Aprobada">Aprobadas</option>
                <option value="Disfrutada">Disfrutadas</option>
                <option value="Rechazada">Rechazadas / Aplazadas</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Radicado & Colaborador</th>
                    <th className="p-3.5">Periodo Causado</th>
                    <th className="p-3.5">Fechas Salida y Retorno</th>
                    <th className="p-3.5 text-center">Días Hábiles</th>
                    <th className="p-3.5">Reemplazo Asignado</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {filteredSolicitudes.map(sol => (
                    <tr key={sol.id} className="hover:bg-[#8FA7D6]/10 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#18235C]">{sol.empleadoNombre}</div>
                        <div className="text-[10px] text-[#282829]/50">Radicado: {sol.id} • Solicitado: {sol.fechaSolicitud}</div>
                      </td>

                      <td className="p-3.5 text-[#282829]">
                        <span className="font-semibold text-[#18235C]">{sol.periodoCorrespondiente}</span>
                      </td>

                      <td className="p-3.5 text-[#282829]">
                        <div className="font-medium">
                          Salida: <strong>{sol.fechaInicio}</strong> → Fin: {sol.fechaFin}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          Reintegro a labores: {sol.fechaReintegro}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-[#8FA7D6]/40 font-bold text-xs text-[#18235C]">
                          {sol.diasHabiles} d
                        </span>
                        <div className="text-[10px] text-[#282829]/50 mt-0.5">{sol.diasCalendario} d cal.</div>
                      </td>

                      <td className="p-3.5 text-[#282829]/70">
                        {sol.reemplazoCargo || 'Sin reemplazo requerido'}
                      </td>

                      <td className="p-3.5">
                        {getEstadoSolicitudBadge(sol.estado)}
                        {sol.aprobadoPor && (
                          <div className="text-[10px] text-[#282829]/50 mt-0.5">
                            Por: {sol.aprobadoPor}
                          </div>
                        )}
                        {sol.motivoRechazo && (
                          <div className="text-[10px] text-rose-700 mt-0.5 italic">
                            Motivo: {sol.motivoRechazo}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        {sol.estado === 'Pendiente' && userRole === 'admin' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAprobarSolicitud(sol.id)}
                              className="px-2.5 py-1 bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                              title="Aprobar vacaciones"
                            >
                              <Check className="w-3 h-3 text-[#00FF00]" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => handleRechazarSolicitud(sol.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-xs border border-rose-200 transition-colors"
                              title="Rechazar o aplazar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSolicitudSeleccionada(sol)}
                            className="p-1.5 text-[#18235C] hover:text-[#18235C] hover:bg-[#8FA7D6]/20 rounded border border-[#8FA7D6]/40"
                            title="Ver detalle completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredSolicitudes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#282829]/60">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Calendar className="w-8 h-8 text-[#8FA7D6]" />
                          <p className="font-semibold text-sm text-[#18235C]">
                            No hay solicitudes de vacaciones registradas
                          </p>
                          <p className="text-xs text-[#282829]/60 max-w-md">
                            Las solicitudes que tramiten los colaboradores o que programe el área de Gestión Humana aparecerán aquí para su respectiva aprobación y resolución.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GUÍA LEGAL & NORMATIVA CST */}
      {activeTab === 'normativa' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-[#8FA7D6]/30 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#18235C] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#18235C]" />
              Compendio Normativo de Vacaciones Laborales en Colombia (CST)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 space-y-2">
                <div className="font-bold text-[#18235C] text-sm">
                  1. Derecho al Descanso Remunerado (Art. 186 CST)
                </div>
                <p className="text-[#282829]/75 leading-relaxed">
                  Los trabajadores que hubieren prestado sus servicios durante un (1) año continuo tienen derecho a <strong>quince (15) días hábiles consecutivos de vacaciones remuneradas</strong>. Para su cómputo los sábados se computan según la jornada pactada de la empresa (si la jornada habitual no incluye sábados, no se contabilizan).
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 space-y-2">
                <div className="font-bold text-[#18235C] text-sm">
                  2. Época de las Vacaciones (Art. 187 CST)
                </div>
                <p className="text-[#282829]/75 leading-relaxed">
                  La época de las vacaciones debe ser señalada por el empleador a más tardar dentro del año subsiguiente a la causación. El empleador debe dar a conocer al trabajador con quince (15) días de anticipación la fecha en que le concederá el goce del descanso.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 space-y-2">
                <div className="font-bold text-[#18235C] text-sm">
                  3. Acumulación de Vacaciones (Art. 190 CST)
                </div>
                <p className="text-[#282829]/75 leading-relaxed">
                  El trabajador debe gozar anualmente por lo menos de seis (6) días continuos de vacaciones, los cuales no son acumulables. Las partes pueden convenir en acumular los días restantes hasta por <strong>dos (2) años</strong> (o hasta por 4 años en el caso de trabajadores técnicos o de confianza).
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 space-y-2">
                <div className="font-bold text-[#18235C] text-sm">
                  4. Compensación en Dinero (Art. 189 CST)
                </div>
                <p className="text-[#282829]/75 leading-relaxed">
                  El empleador y el trabajador pueden acordar por escrito, previa solicitud del colaborador, compensar en dinero hasta la <strong>mitad (50%) de las vacaciones causadas</strong> sin necesidad de disfrutarlas físicamente. El 50% restante debe disfrutarse obligatoriamente en tiempo de descanso.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVA SOLICITUD */}
      {modalNuevaSolicitudOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#8FA7D6] max-w-lg w-full overflow-hidden shadow-2xl space-y-0 max-h-[90vh] flex flex-col">
            <div className="bg-[#18235C] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-[#00FF00]" />
                <div>
                  <h3 className="font-bold text-base text-white">
                    Programar Solicitud de Vacaciones
                  </h3>
                  <div className="text-[11px] text-[#8FA7D6]">B GROUP INGENIERIA S.A.S.</div>
                </div>
              </div>
              <button
                onClick={() => setModalNuevaSolicitudOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearSolicitud} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-[#18235C] mb-1">
                  Colaborador Solicitante *
                </label>
                <select
                  value={formSolicitud.empleadoId}
                  onChange={e => setFormSolicitud({ ...formSolicitud, empleadoId: e.target.value })}
                  className="w-full bg-slate-50 border border-[#8FA7D6]/40 rounded-lg px-2.5 py-1.5 font-medium text-[#282829] focus:outline-none focus:border-[#18235C]"
                >
                  {empleados.map(emp => {
                    const ctrl = controles.find(c => c.empleadoId === emp.id);
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} — Saldo: {ctrl?.diasPendientesDisfrute || 15} días hábiles
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#18235C] mb-1">
                    Fecha de Inicio del Descanso *
                  </label>
                  <input
                    type="date"
                    required
                    value={formSolicitud.fechaInicio}
                    onChange={e => setFormSolicitud({ ...formSolicitud, fechaInicio: e.target.value })}
                    className="w-full bg-slate-50 border border-[#8FA7D6]/40 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#18235C] mb-1">
                    Días Hábiles a Disfrutar *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={formSolicitud.diasHabiles}
                    onChange={e => setFormSolicitud({ ...formSolicitud, diasHabiles: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-[#8FA7D6]/40 rounded-lg px-2.5 py-1.5 font-bold text-[#18235C] focus:outline-none focus:border-[#18235C]"
                  />
                  <span className="text-[10px] text-[#282829]/60">Mínimo legal 6 días continuos</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#18235C] mb-1">
                  Periodo Causado al que se Imputa
                </label>
                <select
                  value={formSolicitud.periodoCorrespondiente}
                  onChange={e => setFormSolicitud({ ...formSolicitud, periodoCorrespondiente: e.target.value })}
                  className="w-full bg-slate-50 border border-[#8FA7D6]/40 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#18235C]"
                >
                  <option value="2023 - 2024">Periodo 2023 - 2024 (Acumulado)</option>
                  <option value="2024 - 2025">Periodo 2024 - 2025 (Periodo Actual)</option>
                  <option value="2025 - 2026">Periodo 2025 - 2026 (En causación)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#18235C] mb-1">
                  Cobertura / Cargo de Reemplazo
                </label>
                <input
                  type="text"
                  value={formSolicitud.reemplazoCargo}
                  onChange={e => setFormSolicitud({ ...formSolicitud, reemplazoCargo: e.target.value })}
                  className="w-full bg-slate-50 border border-[#8FA7D6]/40 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#18235C]"
                  placeholder="Ej. Técnico de guardia o Coordinador alterno"
                />
              </div>

              <div className="p-3 bg-[#8FA7D6]/15 rounded-lg border border-[#8FA7D6]/40 text-[#18235C]">
                <strong>Nota de Ley (Art. 192 CST):</strong> Las vacaciones se remuneran con base en el último salario ordinario devengado al momento de iniciar el descanso, excluyendo auxilio de transporte y horas extras.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]/20">
                <button
                  type="button"
                  onClick={() => setModalNuevaSolicitudOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#8FA7D6]/40 text-[#282829] hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#18235C] text-white font-semibold hover:bg-[#18235C]/90 transition-colors shadow-xs"
                >
                  Registrar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE SOLICITUD */}
      {solicitudSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#8FA7D6] max-w-md w-full overflow-hidden shadow-2xl space-y-0">
            <div className="bg-[#18235C] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#00FF00]" />
                <div>
                  <h3 className="font-bold text-sm text-white">Detalle de Solicitud de Vacaciones</h3>
                  <div className="text-[10px] text-[#8FA7D6]">Radicado: {solicitudSeleccionada.id}</div>
                </div>
              </div>
              <button
                onClick={() => setSolicitudSeleccionada(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="bg-[#8FA7D6]/10 p-3 rounded-lg border border-[#8FA7D6]/30">
                <div className="font-bold text-[#18235C] text-sm">{solicitudSeleccionada.empleadoNombre}</div>
                <div className="text-[11px] text-[#282829]/70">Periodo imputado: {solicitudSeleccionada.periodoCorrespondiente}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded border border-[#8FA7D6]/20">
                  <div className="text-[#282829]/60">Fecha de salida:</div>
                  <div className="font-bold text-[#18235C]">{solicitudSeleccionada.fechaInicio}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-[#8FA7D6]/20">
                  <div className="text-[#282829]/60">Fecha de reintegro:</div>
                  <div className="font-bold text-emerald-700">{solicitudSeleccionada.fechaReintegro}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-[#8FA7D6]/20">
                  <div className="text-[#282829]/60">Días hábiles:</div>
                  <div className="font-bold text-[#18235C]">{solicitudSeleccionada.diasHabiles} días</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-[#8FA7D6]/20">
                  <div className="text-[#282829]/60">Estado:</div>
                  <div className="font-bold">{solicitudSeleccionada.estado}</div>
                </div>
              </div>
              {solicitudSeleccionada.reemplazoCargo && (
                <div className="text-[11px] text-[#282829]">
                  <strong>Cargo de reemplazo:</strong> {solicitudSeleccionada.reemplazoCargo}
                </div>
              )}
              <div className="flex justify-end pt-2 border-t border-[#8FA7D6]/20">
                <button
                  onClick={() => setSolicitudSeleccionada(null)}
                  className="px-4 py-1.5 bg-[#18235C] text-white rounded-lg text-xs font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANILLA ANUAL IMPRIMIBLE */}
      {modalPlanillaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#8FA7D6] max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/30 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#18235C]" />
                <h3 className="font-bold text-base text-[#18235C]">
                  Planilla Oficial de Control Anual de Vacaciones (Art. 187 CST)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-[#18235C] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#00FF00]" />
                  Imprimir Planilla
                </button>
                <button
                  onClick={() => setModalPlanillaOpen(false)}
                  className="text-[#282829]/70 hover:text-[#18235C]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 border border-[#8FA7D6]/40 rounded-lg space-y-4 bg-white text-xs">
              <div className="flex justify-between items-start border-b border-[#8FA7D6]/20 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-[#18235C]">B GROUP INGENIERIA S.A.S. - NIT 900.995.99-2</h4>
                  <div className="text-[11px] text-[#282829]/70">Libro de Registro y Control de Vacaciones del Personal</div>
                </div>
                <div className="text-right text-[10px] text-[#282829]/70">
                  <div>Vigencia: 2026</div>
                  <div>Generado: {new Date().toLocaleDateString('es-CO')}</div>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#18235C] text-white font-semibold">
                    <th className="p-2">Colaborador</th>
                    <th className="p-2">Cédula</th>
                    <th className="p-2">Ingreso</th>
                    <th className="p-2 text-center">Causados</th>
                    <th className="p-2 text-center">Disfrutados</th>
                    <th className="p-2 text-center">Saldo</th>
                    <th className="p-2">Estado</th>
                    <th className="p-2 text-right">Provisión COP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {controles.map(c => (
                    <tr key={c.empleadoId} className="hover:bg-[#8FA7D6]/10">
                      <td className="p-2 font-medium text-[#18235C]">{c.empleadoNombre}</td>
                      <td className="p-2 text-[#282829]/70">{c.documento}</td>
                      <td className="p-2 text-[#282829]/70">{c.fechaIngreso}</td>
                      <td className="p-2 text-center">{c.diasVacacionesCausados}</td>
                      <td className="p-2 text-center">{c.diasDisfrutadosAcumulados}</td>
                      <td className="p-2 text-center font-bold text-[#18235C]">{c.diasPendientesDisfrute}</td>
                      <td className="p-2">{c.estadoAlerta}</td>
                      <td className="p-2 text-right">{formatCOP(c.provisionAcumuladaCOP)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[10px] text-[#282829]/70">
                <div className="border-t border-[#8FA7D6]/30 pt-2">
                  <div className="font-bold text-[#18235C]">Marcela Rueda</div>
                  <div>Directora de Gestión Humana</div>
                </div>
                <div className="border-t border-[#8FA7D6]/30 pt-2">
                  <div className="font-bold text-[#18235C]">Andrés Pinilla</div>
                  <div>Representante Legal / Gerente General</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
