import React, { useState, useMemo, useEffect } from 'react';
import {
  Cargo,
  ControlVacacionesEmpleado,
  Empleado,
  Role,
  Solicitud,
  SolicitudVacacionDetalle,
  UsuarioSistema
} from '../types';
import {
  INITIAL_CONTROL_VACACIONES,
  INITIAL_SOLICITUDES_VACACIONES
} from '../data/usuariosYVotacionesData';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarDays,
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
  Info,
  Layers,
  Palmtree,
  Plus,
  Printer,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
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
  currentUser?: UsuarioSistema | null;
  isSuperAdmin?: boolean;
  onAddSolicitudGeneral?: (solicitud: Solicitud) => void;
}

/**
 * Parsea salario a número para provisión contable
 */
const parseSalarioNumerico = (salario: number | string | undefined): number => {
  if (typeof salario === 'number') return salario;
  if (!salario) return 1300000;
  const limpio = String(salario).replace(/[^0-9.-]+/g, '');
  const num = Number(limpio);
  return isNaN(num) || num <= 0 ? 1300000 : num;
};

/**
 * Calcula días laborados contables entre fecha de inicio y fecha de corte
 */
export const calcularDiasLaborados = (fechaIngresoStr: string, fechaCorteStr?: string): number => {
  if (!fechaIngresoStr) return 0;
  const partes = fechaIngresoStr.split('-');
  if (partes.length < 3) return 0;
  const y = parseInt(partes[0], 10);
  const m = parseInt(partes[1], 10) - 1;
  const d = parseInt(partes[2], 10);
  const inicio = new Date(y, m, d);

  let corte = new Date();
  if (fechaCorteStr) {
    const partesCorte = fechaCorteStr.split('-');
    if (partesCorte.length === 3) {
      corte = new Date(parseInt(partesCorte[0], 10), parseInt(partesCorte[1], 10) - 1, parseInt(partesCorte[2], 10));
    }
  }

  inicio.setHours(0, 0, 0, 0);
  corte.setHours(0, 0, 0, 0);

  if (corte.getTime() < inicio.getTime()) return 0;

  const diffMs = corte.getTime() - inicio.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return diffDias;
};

/**
 * Genera el registro de control de vacaciones dinámico y proporcional conforme al Art. 186 CST
 */
export const calcularRegistroVacaciones = (
  empleado: Empleado,
  cargoNombre: string,
  diasDisfrutadosHistoricos: number = 0,
  diasEnSolicitud: number = 0,
  ultimoPeriodo?: string
): ControlVacacionesEmpleado => {
  const fechaIngreso = empleado.contrato?.inicio || '2026-01-01';
  const diasLaborados = calcularDiasLaborados(fechaIngreso);

  // Fórmula legal Art. 186 CST: (Días laborados * 15) / 360
  const diasCausados = Math.round(((diasLaborados * 15) / 360) * 100) / 100;
  const diasDisfrutados = Math.min(diasCausados, Math.max(0, diasDisfrutadosHistoricos));
  const diasPendientes = Math.max(0, Math.round((diasCausados - diasDisfrutados) * 100) / 100);
  const periodosAcumulados = Math.round((diasPendientes / 15) * 100) / 100;

  let estadoAlerta: ControlVacacionesEmpleado['estadoAlerta'] = 'Al día';
  if (diasPendientes >= 30) {
    estadoAlerta = 'Crítico (≥ 2 periodos)';
  } else if (diasPendientes >= 15) {
    estadoAlerta = '1 periodo';
  }

  const salario = parseSalarioNumerico(empleado.contrato?.salario);
  const salarioDiario = salario / 30;
  const provisionCOP = Math.round(salarioDiario * diasPendientes);

  return {
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    documento: empleado.documento,
    cargoNombre,
    fechaIngreso,
    diasLaboradosTotal: diasLaborados,
    diasVacacionesCausados: diasCausados,
    diasDisfrutadosAcumulados: diasDisfrutados,
    diasEnSolicitud,
    diasPendientesDisfrute: diasPendientes,
    periodosAcumulados,
    estadoAlerta,
    provisionAcumuladaCOP: provisionCOP,
    ultimoPeriodoDisfrutado: ultimoPeriodo || (diasDisfrutados > 0 ? `${Math.floor(diasDisfrutados / 15)} periodo(s)` : 'Ninguno')
  };
};

export function ControlVacacionesView({
  empleados,
  cargos,
  userRole = 'admin',
  currentEmpleadoId,
  currentUser,
  isSuperAdmin,
  onAddSolicitudGeneral
}: ControlVacacionesViewProps) {
  const [controles, setControles] = useState<ControlVacacionesEmpleado[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bgroup_vacaciones_controles');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      const empIds = new Set(empleados.map(e => e.id));
      return INITIAL_CONTROL_VACACIONES.filter(c => empIds.has(c.empleadoId));
    }
    return INITIAL_CONTROL_VACACIONES;
  });

  const [solicitudes, setSolicitudes] = useState<SolicitudVacacionDetalle[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bgroup_vacaciones_solicitudes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      const empIds = new Set(empleados.map(e => e.id));
      return INITIAL_SOLICITUDES_VACACIONES.filter(s => empIds.has(s.empleadoId));
    }
    return INITIAL_SOLICITUDES_VACACIONES;
  });

  // Detección del modo Colaborador
  const isEmployeeMode = userRole === 'empleado' || currentUser?.rol === 'empleado';

  // Buscar el empleado actual en base a currentUser / currentEmpleadoId
  const myEmpleado = useMemo(() => {
    return empleados.find(e =>
      (currentUser?.empleadoId && e.id === currentUser.empleadoId) ||
      (currentEmpleadoId && e.id === currentEmpleadoId) ||
      (currentUser?.email && e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
      (currentUser?.documento && e.documento === currentUser.documento)
    );
  }, [empleados, currentEmpleadoId, currentUser]);

  const [simulatedEmpleadoId, setSimulatedEmpleadoId] = useState<string>(() => {
    return myEmpleado?.id || currentEmpleadoId || currentUser?.empleadoId || empleados[0]?.id || '';
  });

  useEffect(() => {
    if (myEmpleado?.id) {
      setSimulatedEmpleadoId(myEmpleado.id);
    } else if (currentEmpleadoId) {
      setSimulatedEmpleadoId(currentEmpleadoId);
    } else if (empleados.length > 0 && !simulatedEmpleadoId) {
      setSimulatedEmpleadoId(empleados[0].id);
    }
  }, [myEmpleado?.id, currentEmpleadoId, empleados]);

  const effectiveEmpleado = (isEmployeeMode && myEmpleado && !isSuperAdmin)
    ? myEmpleado
    : (empleados.find(e => e.id === simulatedEmpleadoId) || myEmpleado || empleados[0]);

  const miControl = useMemo(() => {
    if (!effectiveEmpleado) return null;
    return controles.find(c => c.empleadoId === effectiveEmpleado.id) || null;
  }, [controles, effectiveEmpleado]);

  const misSolicitudes = useMemo(() => {
    if (!effectiveEmpleado) return [];
    return solicitudes.filter(s => s.empleadoId === effectiveEmpleado.id);
  }, [solicitudes, effectiveEmpleado]);

  // Modo de vista: 'admin' (Cuadro General de la Empresa) o 'empleado' (Mi Portal de Vacaciones)
  const [viewMode, setViewMode] = useState<'admin' | 'empleado'>(isEmployeeMode ? 'empleado' : 'admin');

  useEffect(() => {
    if (isEmployeeMode) {
      setViewMode('empleado');
    }
  }, [isEmployeeMode]);

  const [employeeTab, setEmployeeTab] = useState<'solicitudes' | 'periodos' | 'normativa'>('solicitudes');

  // Sincronizar automáticamente controles y solicitudes calculando causación proporcional exacta (Art. 186 CST)
  useEffect(() => {
    if (empleados.length === 0) {
      setControles([]);
      setSolicitudes([]);
      return;
    }

    setControles(prev => {
      const prevMap = new Map(prev.map(c => [c.empleadoId, c]));
      const initMap = new Map(INITIAL_CONTROL_VACACIONES.map(c => [c.empleadoId, c]));

      return empleados.map(emp => {
        const cargo = cargos.find(cg => cg.id === emp.cargoId);
        const existing = prevMap.get(emp.id) || initMap.get(emp.id);

        const diasDisfrutados = existing?.diasDisfrutadosAcumulados || 0;
        const diasEnSolicitud = existing?.diasEnSolicitud || 0;
        const ultimoPeriodo = existing?.ultimoPeriodoDisfrutado;

        return calcularRegistroVacaciones(
          emp,
          cargo?.nombre || existing?.cargoNombre || 'Colaborador',
          diasDisfrutados,
          diasEnSolicitud,
          ultimoPeriodo
        );
      });
    });

    const empIds = new Set(empleados.map(e => e.id));
    setSolicitudes(prev => prev.filter(s => empIds.has(s.empleadoId)));
  }, [empleados, cargos]);

  // Persistir cambios en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && controles.length > 0) {
      try {
        localStorage.setItem('bgroup_vacaciones_controles', JSON.stringify(controles));
        localStorage.setItem('bgroup_vacaciones_solicitudes', JSON.stringify(solicitudes));
      } catch (err) {
        console.warn('Error al guardar vacaciones en localStorage', err);
      }
    }
  }, [controles, solicitudes]);

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
            const empObj = empleados.find(e => e.id === c.empleadoId);
            const salarioNum = parseSalarioNumerico(empObj?.contrato?.salario);
            const nuevaProvision = Math.round((salarioNum / 30) * nuevosPendientes);

            return {
              ...c,
              diasPendientesDisfrute: Math.round(nuevosPendientes * 100) / 100,
              diasDisfrutadosAcumulados: Math.round(nuevosDisfrutados * 100) / 100,
              diasEnSolicitud: 0,
              periodosAcumulados: Math.round((nuevosPendientes / 15) * 100) / 100,
              provisionAcumuladaCOP: nuevaProvision,
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

  // Abrir modal con colaborador y días sugeridos
  const handleAbrirModalSolicitud = (targetEmpleadoId?: string) => {
    const empId = targetEmpleadoId || (viewMode === 'empleado' ? effectiveEmpleado?.id : formSolicitud.empleadoId) || empleados[0]?.id || '';
    const ctrl = controles.find(c => c.empleadoId === empId);
    const saldo = ctrl ? Math.floor(ctrl.diasPendientesDisfrute) : 6;
    const diasSugeridos = Math.min(15, Math.max(1, saldo > 0 ? saldo : 6));

    // Sugerir fecha con 15 días hábiles de anticipación (Art. 187 CST)
    const fechaMin = new Date();
    fechaMin.setDate(fechaMin.getDate() + 15);
    const fechaMinStr = fechaMin.toISOString().split('T')[0];

    setFormSolicitud({
      empleadoId: empId,
      fechaInicio: fechaMinStr,
      diasHabiles: diasSugeridos,
      periodoCorrespondiente: ctrl?.ultimoPeriodoDisfrutado && ctrl.ultimoPeriodoDisfrutado !== 'Ninguno' ? '2025 - 2026' : '2024 - 2025',
      reemplazoCargo: '',
      reemplazoEmpleadoId: empleados.find(e => e.id !== empId)?.id || '',
      observaciones: ''
    });
    setModalNuevaSolicitudOpen(true);
  };

  // Acción: Crear nueva solicitud
  const handleCrearSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = empleados.find(e => e.id === formSolicitud.empleadoId);
    if (!emp) return;

    const controlEmp = controles.find(c => c.empleadoId === emp.id);
    const diasPedir = Number(formSolicitud.diasHabiles);

    if (controlEmp && diasPedir > controlEmp.diasPendientesDisfrute) {
      const confirmarAnticipadas = window.confirm(
        `Atención: El saldo actual causado es de ${controlEmp.diasPendientesDisfrute} días. ¿Deseas solicitar ${diasPedir} días programando la diferencia como vacaciones anticipadas conforme al Art. 187 del CST?`
      );
      if (!confirmarAnticipadas) return;
    }

    // Calcular fecha retorno estimada (sumando días hábiles)
    const fechaSalida = new Date(formSolicitud.fechaInicio);
    let fechaRetorno = new Date(fechaSalida);
    let diasContados = 0;
    while (diasContados < diasPedir) {
      fechaRetorno.setDate(fechaRetorno.getDate() + 1);
      if (fechaRetorno.getDay() !== 0) { // Omitir domingos
        diasContados++;
      }
    }

    const esAdminDirecto = userRole === 'admin' && viewMode === 'admin';

    const nuevaSol: SolicitudVacacionDetalle = {
      id: `vac-sol-${Date.now().toString().slice(-4)}`,
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaInicio: formSolicitud.fechaInicio,
      fechaFin: fechaRetorno.toISOString().split('T')[0],
      fechaReintegro: fechaRetorno.toISOString().split('T')[0],
      diasHabiles: diasPedir,
      diasCalendario: Math.ceil((fechaRetorno.getTime() - fechaSalida.getTime()) / (1000 * 60 * 60 * 24)),
      periodoCorrespondiente: formSolicitud.periodoCorrespondiente,
      estado: esAdminDirecto ? 'Aprobada' : 'Pendiente',
      reemplazoCargo: formSolicitud.reemplazoCargo,
      reemplazoEmpleadoId: formSolicitud.reemplazoEmpleadoId,
      liquidadoEnNomina: false,
      aprobadoPor: esAdminDirecto ? 'Administrador GH' : undefined,
      fechaAprobacion: esAdminDirecto ? new Date().toISOString().split('T')[0] : undefined
    };

    setSolicitudes(prev => [nuevaSol, ...prev]);

    // Actualizar control
    setControles(prev =>
      prev.map(c => {
        if (c.empleadoId === emp.id) {
          if (esAdminDirecto) {
            const nuevosPendientes = Math.max(0, c.diasPendientesDisfrute - nuevaSol.diasHabiles);
            const salarioNum = parseSalarioNumerico(emp.contrato?.salario);
            const nuevaProvision = Math.round((salarioNum / 30) * nuevosPendientes);

            return {
              ...c,
              diasDisfrutadosAcumulados: c.diasDisfrutadosAcumulados + nuevaSol.diasHabiles,
              diasPendientesDisfrute: Math.round(nuevosPendientes * 100) / 100,
              periodosAcumulados: Math.round((nuevosPendientes / 15) * 100) / 100,
              provisionAcumuladaCOP: nuevaProvision,
              estadoAlerta: nuevosPendientes >= 30 ? 'Crítico (≥ 2 periodos)' : nuevosPendientes >= 15 ? '1 periodo' : 'Al día'
            };
          } else {
            return {
              ...c,
              diasEnSolicitud: (c.diasEnSolicitud || 0) + nuevaSol.diasHabiles
            };
          }
        }
        return c;
      })
    );

    // Sincronizar con el gestor general de permisos y solicitudes
    if (onAddSolicitudGeneral) {
      onAddSolicitudGeneral({
        id: nuevaSol.id,
        empresaId: currentUser?.empresaId || 'empresa-a',
        empleadoId: emp.id,
        empleadoNombre: emp.nombre,
        empleadoEmail: emp.email || '',
        tipo: 'Vacaciones',
        inicio: formSolicitud.fechaInicio,
        fin: fechaRetorno.toISOString().split('T')[0],
        motivo: `Solicitud de vacaciones (${diasPedir} días hábiles) - Periodo ${formSolicitud.periodoCorrespondiente}. ${formSolicitud.observaciones || ''}`.trim(),
        estado: esAdminDirecto ? 'Aprobada' : 'Pendiente',
        decisorId: esAdminDirecto ? (currentUser?.id || 'admin') : null,
        fechaDecision: esAdminDirecto ? new Date().toISOString().split('T')[0] : null,
        comentario: formSolicitud.observaciones || '',
        fechaCreacion: new Date().toISOString().split('T')[0]
      });
    }

    setModalNuevaSolicitudOpen(false);
    showToast(
      esAdminDirecto
        ? `Vacaciones de ${emp.nombre} registradas y aprobadas exitosamente.`
        : `¡Tu solicitud de vacaciones (${diasPedir} días) ha sido radicada exitosamente y enviada a Gestión Humana!`
    );
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

      {/* Barra de alternancia de vista para Administradores / Gestión Humana */}
      {!isEmployeeMode && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#8FA7D6]/30 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#18235C] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Modo de Gestión:
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-[#8FA7D6]/30">
              <button
                onClick={() => setViewMode('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'admin'
                    ? 'bg-[#18235C] text-white shadow-xs'
                    : 'text-[#282829]/70 hover:text-[#18235C]'
                }`}
              >
                Cuadro General GH (Matriz de Saldos)
              </button>
              <button
                onClick={() => setViewMode('empleado')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'empleado'
                    ? 'bg-[#18235C] text-white shadow-xs'
                    : 'text-[#282829]/70 hover:text-[#18235C]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Vista "Mis Vacaciones" (Portal Colaborador)
              </button>
            </div>
          </div>

          {viewMode === 'empleado' && (
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-[#282829]/70 whitespace-nowrap font-medium">Ver como:</span>
              <select
                value={simulatedEmpleadoId}
                onChange={e => setSimulatedEmpleadoId(e.target.value)}
                className="bg-slate-50 border border-[#8FA7D6]/40 rounded-lg px-2.5 py-1 font-semibold text-[#18235C] focus:outline-none focus:border-[#18235C] text-xs"
              >
                {empleados.map(emp => {
                  const ctrl = controles.find(c => c.empleadoId === emp.id);
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} ({ctrl?.diasPendientesDisfrute ?? 0} d disponibles)
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA MODO COLABORADOR: "MIS VACACIONES"                */}
      {/* ======================================================== */}
      {viewMode === 'empleado' && (
        <div className="space-y-5">
          {/* Header Principal del Colaborador */}
          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
                    <Palmtree className="w-3.5 h-3.5 text-[#18235C]" />
                    Portal de Autoservicio
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8FA7D6]/15 text-[#18235C] border border-[#8FA7D6]/30">
                    Artículos 186 al 192 del CST
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    B GROUP INGENIERIA S.A.S.
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#18235C]">
                  Mis Vacaciones Remuneradas
                </h2>
                <p className="text-xs sm:text-sm text-[#282829]/70 mt-0.5 max-w-2xl">
                  Consulta en tiempo real tus días acumulados por tiempo de servicio laboral, tu saldo pendiente y radica tus solicitudes de descanso para revisión de Gestión Humana.
                </p>
              </div>

              {/* Botón Principal para Radicar Solicitud */}
              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                <button
                  id="btn-solicitar-mis-vacaciones"
                  onClick={() => handleAbrirModalSolicitud(effectiveEmpleado?.id)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer transform active:scale-95"
                >
                  <Palmtree className="w-4 h-4 text-[#00FF00]" />
                  <span>Solicitar Mis Vacaciones</span>
                </button>
              </div>
            </div>

            {/* Ficha del Titular */}
            <div className="mt-5 pt-4 border-t border-[#8FA7D6]/20 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-[#8FA7D6]/10 p-4 rounded-xl border border-[#8FA7D6]/30">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#18235C] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                  {effectiveEmpleado?.nombre?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'CO'}
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-[#18235C] flex items-center gap-2 flex-wrap">
                    {effectiveEmpleado?.nombre}
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold border border-emerald-200">
                      Contrato Activo
                    </span>
                  </div>
                  <div className="text-xs text-[#282829]/70 flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Briefcase className="w-3 h-3 text-[#18235C]" />
                      {miControl?.cargoNombre || 'Colaborador'}
                    </span>
                    <span>•</span>
                    <span><strong>CC:</strong> {effectiveEmpleado?.documento}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#18235C]" />
                      <strong>Fecha de Ingreso:</strong> {miControl?.fechaIngreso || '2026-01-01'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 divide-x divide-[#8FA7D6]/30 pt-2 md:pt-0 border-t md:border-t-0 border-[#8FA7D6]/20">
                <div className="text-left md:text-right">
                  <div className="text-[10px] text-[#282829]/60 font-semibold uppercase tracking-wider">Antigüedad Contable</div>
                  <div className="text-xs font-bold text-[#18235C]">
                    {miControl?.diasLaboradosTotal || 0} días laborados
                  </div>
                  <div className="text-[10px] text-[#282829]/60">
                    Aprox. {((miControl?.diasLaboradosTotal || 0) / 30).toFixed(1)} meses continuos
                  </div>
                </div>
                <div className="pl-4 text-left md:text-right">
                  <div className="text-[10px] text-[#282829]/60 font-semibold uppercase tracking-wider">Causación Mensual</div>
                  <div className="text-xs font-bold text-emerald-700">1.25 días / mes</div>
                  <div className="text-[10px] text-[#282829]/60">15 días hábiles / año</div>
                </div>
              </div>
            </div>

            {/* 4 Métricas Principales del Colaborador */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
              {/* Días Causados Acumulados */}
              <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-xl border border-[#8FA7D6]/30 shadow-xs">
                <div className="text-[10px] font-semibold text-[#282829]/70 uppercase tracking-wider flex items-center justify-between">
                  Días Causados Acumulados
                  <Palmtree className="w-4 h-4 text-[#18235C]" />
                </div>
                <div className="text-2xl font-black text-[#18235C] mt-1">
                  {miControl?.diasVacacionesCausados ?? 0} <span className="text-xs font-medium text-[#282829]/60">días hábiles</span>
                </div>
                <div className="text-[10px] text-[#282829]/60 mt-1">
                  Causación Art. 186 CST (15 d / 360 d)
                </div>
              </div>

              {/* Días Disfrutados */}
              <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-xl border border-[#8FA7D6]/30 shadow-xs">
                <div className="text-[10px] font-semibold text-[#282829]/70 uppercase tracking-wider flex items-center justify-between">
                  Días Disfrutados
                  <Sun className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-[#18235C] mt-1">
                  {miControl?.diasDisfrutadosAcumulados ?? 0} <span className="text-xs font-medium text-[#282829]/60">días gozados</span>
                </div>
                <div className="text-[10px] text-[#282829]/60 mt-1">
                  Último periodo: {miControl?.ultimoPeriodoDisfrutado || 'Ninguno'}
                </div>
              </div>

              {/* Saldo Pendiente Disponible */}
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-xl border border-emerald-300 shadow-xs">
                <div className="text-[10px] font-semibold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                  Saldo Disponible para Goce
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  {miControl?.diasPendientesDisfrute ?? 0} <span className="text-xs font-medium text-emerald-700">días hábiles</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[10px] text-emerald-700 font-semibold">Saldo a tu favor</span>
                  {getAlertaBadge(miControl?.estadoAlerta || 'Al día')}
                </div>
              </div>

              {/* Días en Trámite / Solicitud */}
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-300 shadow-xs">
                <div className="text-[10px] font-semibold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                  Días en Trámite
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-800 mt-1">
                  {misSolicitudes.filter(s => s.estado === 'Pendiente').reduce((acc, s) => acc + s.diasHabiles, 0)} <span className="text-xs font-medium text-amber-700">días</span>
                </div>
                <div className="text-[10px] text-amber-700 mt-1">
                  {misSolicitudes.filter(s => s.estado === 'Pendiente').length} solicitud(es) en revisión por Gestión Humana
                </div>
              </div>
            </div>

            {/* Banner de Explicación Legal y Fórmula Exacta (Art. 186 CST) */}
            <div className="mt-4 p-4 bg-blue-50/70 rounded-xl border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#18235C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-[#18235C]">
                    ¿Cómo se calcula tu saldo de vacaciones acumuladas?
                  </div>
                  <p className="text-[#282829]/80 leading-relaxed text-[11px]">
                    Conforme al <strong>Art. 186 del Código Sustantivo del Trabajo (CST)</strong>, acumulas 15 días hábiles remunerados por cada 360 días laborados.
                    Desde tu fecha de ingreso (<strong>{miControl?.fechaIngreso}</strong>), has acumulado exactamente{' '}
                    <strong className="text-[#18235C]">{miControl?.diasVacacionesCausados} días hábiles</strong>.
                    Habiendo disfrutado <strong className="text-[#18235C]">{miControl?.diasDisfrutadosAcumulados} días</strong>, tu saldo disponible actual es de{' '}
                    <strong className="text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                      {miControl?.diasPendientesDisfrute} días hábiles
                    </strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAbrirModalSolicitud(effectiveEmpleado?.id)}
                className="shrink-0 px-3.5 py-1.5 bg-[#18235C] text-white rounded-lg text-xs font-semibold hover:bg-[#18235C]/90 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Programar Descanso</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00FF00]" />
              </button>
            </div>

            {/* Pestañas de Navegación del Colaborador */}
            <div className="flex border-b border-[#8FA7D6]/20 mt-6 gap-6 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setEmployeeTab('solicitudes')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  employeeTab === 'solicitudes'
                    ? 'border-[#18235C] text-[#18235C] font-bold'
                    : 'border-transparent text-[#282829]/60 hover:text-[#18235C]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Mis Solicitudes y Descansos ({misSolicitudes.length})
                {misSolicitudes.filter(s => s.estado === 'Pendiente').length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                    {misSolicitudes.filter(s => s.estado === 'Pendiente').length} en trámite
                  </span>
                )}
              </button>
              <button
                onClick={() => setEmployeeTab('periodos')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  employeeTab === 'periodos'
                    ? 'border-[#18235C] text-[#18235C] font-bold'
                    : 'border-transparent text-[#282829]/60 hover:text-[#18235C]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Mi Estado de Cuenta y Periodos
              </button>
              <button
                onClick={() => setEmployeeTab('normativa')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  employeeTab === 'normativa'
                    ? 'border-[#18235C] text-[#18235C] font-bold'
                    : 'border-transparent text-[#282829]/60 hover:text-[#18235C]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Guía Laboral del Colaborador (CST)
              </button>
            </div>
          </div>

          {/* TAB 1 EMPLEADO: MIS SOLICITUDES */}
          {employeeTab === 'solicitudes' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#8FA7D6]/30 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#8FA7D6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#18235C]">
                      Historial de Solicitudes Radicadas
                    </h3>
                    <p className="text-[11px] text-[#282829]/70">
                      Registro de tus peticiones de descanso, estado de visto bueno por Gestión Humana y fechas autorizadas.
                    </p>
                  </div>
                  <button
                    onClick={() => handleAbrirModalSolicitud(effectiveEmpleado?.id)}
                    className="px-3.5 py-1.5 bg-[#18235C] text-white text-xs font-semibold rounded-lg hover:bg-[#18235C]/90 flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                    <span>Nueva Solicitud</span>
                  </button>
                </div>

                {misSolicitudes.length === 0 ? (
                  <div className="p-12 text-center text-[#282829]/60 space-y-3">
                    <div className="w-16 h-16 bg-[#8FA7D6]/15 rounded-full flex items-center justify-center mx-auto text-[#18235C]">
                      <Palmtree className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#18235C]">
                        No tienes solicitudes de vacaciones registradas
                      </h4>
                      <p className="text-xs text-[#282829]/70 max-w-md mx-auto mt-1">
                        Cuentas con <strong className="text-emerald-700">{miControl?.diasPendientesDisfrute ?? 0} días hábiles disponibles</strong>.
                        Cuando desees programar tu descanso remunerado, haz clic en el botón a continuación.
                      </p>
                    </div>
                    <button
                      onClick={() => handleAbrirModalSolicitud(effectiveEmpleado?.id)}
                      className="px-4 py-2 bg-[#18235C] text-white text-xs font-bold rounded-lg hover:bg-[#18235C]/90 inline-flex items-center gap-2 shadow-xs mt-2"
                    >
                      <Plus className="w-4 h-4 text-[#00FF00]" />
                      <span>Radicar mi Primera Solicitud</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#18235C] text-white font-semibold uppercase tracking-wider text-[10px]">
                          <th className="p-3.5">Radicado & Periodo</th>
                          <th className="p-3.5">Fechas del Descanso</th>
                          <th className="p-3.5 text-center">Días Hábiles</th>
                          <th className="p-3.5">Compañero de Cobertura</th>
                          <th className="p-3.5">Estado de la Solicitud</th>
                          <th className="p-3.5 text-center">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8FA7D6]/20">
                        {misSolicitudes.map(sol => (
                          <tr key={sol.id} className="hover:bg-[#8FA7D6]/10 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-[#18235C]">{sol.id}</div>
                              <div className="text-[11px] text-[#282829]/70 font-medium">
                                Periodo: {sol.periodoCorrespondiente}
                              </div>
                              <div className="text-[10px] text-[#282829]/50">
                                Radicada el: {sol.fechaSolicitud}
                              </div>
                            </td>

                            <td className="p-3.5">
                              <div className="font-medium text-[#282829]">
                                Salida: <strong>{sol.fechaInicio}</strong> → Fin: {sol.fechaFin}
                              </div>
                              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                Reintegro a labores: {sol.fechaReintegro}
                              </div>
                            </td>

                            <td className="p-3.5 text-center">
                              <span className="px-2.5 py-1 rounded-md bg-[#18235C]/10 border border-[#18235C]/20 font-bold text-xs text-[#18235C]">
                                {sol.diasHabiles} días hábiles
                              </span>
                              <div className="text-[10px] text-[#282829]/50 mt-1">
                                {sol.diasCalendario} d. calendario
                              </div>
                            </td>

                            <td className="p-3.5 text-[#282829]/70">
                              <div className="font-medium text-[#282829]">
                                {sol.reemplazoCargo || 'Sin cobertura requerida'}
                              </div>
                            </td>

                            <td className="p-3.5">
                              {getEstadoSolicitudBadge(sol.estado)}
                              {sol.aprobadoPor && (
                                <div className="text-[10px] text-[#282829]/50 mt-1">
                                  Aprobó: {sol.aprobadoPor} ({sol.fechaAprobacion || ''})
                                </div>
                              )}
                              {sol.motivoRechazo && (
                                <div className="text-[10px] text-rose-700 mt-1 italic">
                                  Observación GH: {sol.motivoRechazo}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => setSolicitudSeleccionada(sol)}
                                className="p-1.5 text-[#18235C] hover:bg-[#8FA7D6]/20 rounded border border-[#8FA7D6]/40 transition-colors"
                                title="Ver comprobante de solicitud"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2 EMPLEADO: ESTADO DE CUENTA Y PERIODOS */}
          {employeeTab === 'periodos' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-[#8FA7D6]/30 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-[#8FA7D6]/20 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#18235C]">
                      Estado de Cuenta Individual de Vacaciones
                    </h3>
                    <p className="text-[11px] text-[#282829]/70">
                      Detalle técnico de causación continua conforme al Código Sustantivo del Trabajo de Colombia.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#282829]/60 block uppercase font-semibold">Vigencia Actual</span>
                    <span className="font-bold text-[#18235C]">Año 2026</span>
                  </div>
                </div>

                {/* Fórmula explicativa */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-[#8FA7D6]/30 space-y-1">
                    <div className="text-[10px] text-[#282829]/60 uppercase font-semibold">1. Tiempo de Servicio</div>
                    <div className="text-base font-bold text-[#18235C]">{miControl?.diasLaboradosTotal || 0} días</div>
                    <div className="text-[10px] text-[#282829]/70">Desde su ingreso ({miControl?.fechaIngreso})</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-[#8FA7D6]/30 space-y-1">
                    <div className="text-[10px] text-[#282829]/60 uppercase font-semibold">2. Tasa de Causación Legal</div>
                    <div className="text-base font-bold text-[#18235C]">15 días / 360 días</div>
                    <div className="text-[10px] text-[#282829]/70">Art. 186 CST (1.25 días por cada mes completo)</div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-300 space-y-1">
                    <div className="text-[10px] text-emerald-800 uppercase font-semibold">3. Saldo Disponible</div>
                    <div className="text-base font-bold text-emerald-800">{miControl?.diasPendientesDisfrute || 0} días hábiles</div>
                    <div className="text-[10px] text-emerald-700">Listos para solicitar</div>
                  </div>
                </div>

                {/* Tabla de desglose por periodos */}
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#18235C] text-white font-semibold text-[10px] uppercase">
                        <th className="p-2.5">Periodo Laboral</th>
                        <th className="p-2.5 text-center">Días Causados</th>
                        <th className="p-2.5 text-center">Días Disfrutados</th>
                        <th className="p-2.5 text-center">En Solicitud</th>
                        <th className="p-2.5 text-center font-bold">Saldo Pendiente</th>
                        <th className="p-2.5">Estado del Periodo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8FA7D6]/20">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-[#18235C]">
                          Periodo Histórico Previo (2024 - 2025)
                        </td>
                        <td className="p-2.5 text-center">
                          {Math.min(15, (miControl?.diasDisfrutadosAcumulados || 0))} días
                        </td>
                        <td className="p-2.5 text-center">
                          {Math.min(15, (miControl?.diasDisfrutadosAcumulados || 0))} días
                        </td>
                        <td className="p-2.5 text-center">0 días</td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">0 días</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Disfrutado y Cerrado
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-emerald-50/30 font-medium">
                        <td className="p-2.5 font-bold text-[#18235C]">
                          Periodo Actual en Causación (2025 - 2026)
                        </td>
                        <td className="p-2.5 text-center font-bold text-[#18235C]">
                          {miControl?.diasVacacionesCausados || 0} días
                        </td>
                        <td className="p-2.5 text-center">
                          {Math.max(0, (miControl?.diasDisfrutadosAcumulados || 0) - 15)} días
                        </td>
                        <td className="p-2.5 text-center text-amber-700">
                          {misSolicitudes.filter(s => s.estado === 'Pendiente').reduce((acc, s) => acc + s.diasHabiles, 0)} días
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-800 text-sm">
                          {miControl?.diasPendientesDisfrute || 0} días
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FF00]/20 text-[#18235C] border border-[#00FF00]/40">
                            En causación activa
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-[#8FA7D6]/15 rounded-lg border border-[#8FA7D6]/40 text-[#18235C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px]">
                    <strong>Semáforo de Acumulación:</strong> Conforme al Art. 190 del CST, se recomienda disfrutar al menos 6 días continuos al año para prevenir acumulación legal.
                  </div>
                  <button
                    onClick={() => handleAbrirModalSolicitud(effectiveEmpleado?.id)}
                    className="px-3 py-1 bg-[#18235C] text-white font-semibold rounded text-xs whitespace-nowrap self-start sm:self-auto"
                  >
                    Solicitar Vacaciones
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3 EMPLEADO: GUÍA LEGAL CST */}
          {employeeTab === 'normativa' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-[#8FA7D6]/30 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-[#18235C] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#18235C]" />
                  Preguntas Frecuentes sobre Vacaciones para Colaboradores (CST)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 space-y-2">
                    <div className="font-bold text-[#18235C] text-sm flex items-center gap-1.5">
                      <Palmtree className="w-4 h-4 text-[#18235C]" />
                      ¿Cuántos días de vacaciones me corresponden?
                    </div>
                    <p className="text-[#282829]/75 leading-relaxed text-[11px]">
                      Por cada año continuo laborado (360 días contables), tienes derecho a <strong>15 días hábiles remunerados</strong> de descanso (Art. 186 CST). Si llevas menos tiempo, acumulas proporcionalmente a razón de <strong>1.25 días hábiles por mes laborado</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 space-y-2">
                    <div className="font-bold text-[#18235C] text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      ¿Con cuánta anticipación debo solicitar mis vacaciones?
                    </div>
                    <p className="text-[#282829]/75 leading-relaxed text-[11px]">
                      El Código Sustantivo del Trabajo (Art. 187 CST) establece que la época de vacaciones debe programarse con al menos <strong>15 días calendario de anticipación</strong>. Esto permite coordinar los reemplazos y no afectar las operaciones de la empresa.
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 space-y-2">
                    <div className="font-bold text-[#18235C] text-sm flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-600" />
                      ¿Puedo solicitar vacaciones si no he cumplido el año?
                    </div>
                    <p className="text-[#282829]/75 leading-relaxed text-[11px]">
                      Sí. Puedes solicitar los <strong>días causados proporcionalmente</strong> que tengas acumulados a la fecha. Si deseas tomar más días, la empresa puede concederte <strong>vacaciones anticipadas</strong> previo acuerdo entre las partes (Art. 187 CST).
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 space-y-2">
                    <div className="font-bold text-[#18235C] text-sm flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      ¿Cómo se pagan mis vacaciones?
                    </div>
                    <p className="text-[#282829]/75 leading-relaxed text-[11px]">
                      Conforme al Art. 192 del CST, se liquidan y pagan con base en el <strong>último salario ordinario devengado</strong> al momento de iniciar el descanso. No se computa el auxilio de transporte ni horas extras. Se pagan antes del inicio del descanso.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA MODO GESTIÓN HUMANA / ADMINISTRADOR                */}
      {/* ======================================================== */}
      {viewMode === 'admin' && (
        <div className="space-y-6">
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
                  onClick={() => handleAbrirModalSolicitud()}
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
                    {viewMode === 'empleado' ? 'Radicar Solicitud de Vacaciones' : 'Programar Solicitud de Vacaciones'}
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
                {viewMode === 'empleado' && !isSuperAdmin ? (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-[#8FA7D6]/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#18235C]">{effectiveEmpleado?.nombre}</div>
                      <div className="text-[10px] text-[#282829]/60">
                        {miControl?.cargoNombre || 'Colaborador'} • CC: {effectiveEmpleado?.documento}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 block font-semibold">Saldo Disponible:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                        {miControl?.diasPendientesDisfrute ?? 0} días hábiles
                      </span>
                    </div>
                  </div>
                ) : (
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
                )}
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
