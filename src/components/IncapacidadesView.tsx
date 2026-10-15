import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  X,
  Stethoscope,
  Activity,
  Layers,
  HeartPulse,
  Info,
  BadgeAlert,
  FileSpreadsheet,
  TrendingUp,
  FileCheck2,
  Trash2,
  Edit,
  Eye,
  Link2
} from 'lucide-react';
import {
  Incapacidad,
  Empleado,
  Cargo,
  ConfiguracionEmpresa,
  UsuarioSistema,
  RolSistema,
  OrigenIncapacidad,
  SubtipoIncapacidad,
  TipoContingenciaIncapacidad,
  EstadoIncapacidad,
  EstadoCobroIncapacidad
} from '../types';
import {
  CATALOGO_CIE10,
  CatalogoCIE10Item,
  calcularDiasEntreFechas,
  calcularDesgloseDiasYCostos,
  getStoredIncapacidades,
  saveStoredIncapacidades,
  calcularAcumuladosPorEmpleado,
  obtenerAlertasIncapacidades,
  AlertaIncapacidadItem
} from '../data/incapacidadesData';
import { DriveLinkField } from './common/DriveLinkField';
import { formatDriveViewUrl, isGoogleDriveUrl } from '../utils/driveUtils';

interface IncapacidadesViewProps {
  empleados: Empleado[];
  cargos?: Cargo[];
  empresa?: ConfiguracionEmpresa;
  userRole?: string;
  currentUser?: UsuarioSistema | null;
  onNavigate?: (view: string) => void;
}

export const IncapacidadesView: React.FC<IncapacidadesViewProps> = ({
  empleados,
  cargos = [],
  empresa,
  userRole = 'admin',
  currentUser,
  onNavigate
}) => {
  // Lista de incapacidades persistente
  const [incapacidades, setIncapacidades] = useState<Incapacidad[]>(() => getStoredIncapacidades());

  // Pestaña activa: 'gestion' | 'acumulados' | 'reporte-nomina'
  const [activeTab, setActiveTab] = useState<'gestion' | 'acumulados' | 'reporte-nomina'>('gestion');

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState<'TODOS' | 'Comun' | 'Laboral'>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'Activa' | 'Por Vencer' | 'Finalizada' | 'Pendiente Cobro'>('TODOS');
  const [filtroContingencia, setFiltroContingencia] = useState<'TODOS' | 'Inicial' | 'Prorroga'>('TODOS');

  // Filtro de período para Reporte de Nómina
  const [mesReporte, setMesReporte] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modales
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalImprimirReporteOpen, setModalImprimirReporteOpen] = useState(false);
  const [incapacidadSeleccionada, setIncapacidadSeleccionada] = useState<Incapacidad | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Alerta informativa
  const [alertaBannerVisible, setAlertaBannerVisible] = useState(true);

  // Formulario de registro / edición
  const hoyStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<Partial<Incapacidad>>({
    empleadoId: '',
    origen: 'Comun',
    subtipo: 'Enfermedad General',
    tipoContingencia: 'Inicial',
    fechaInicio: hoyStr,
    fechaFin: hoyStr,
    fechaExpedicion: hoyStr,
    codigoCIE10: 'M54.5',
    diagnostico: 'Lumbago no especificado',
    entidadEmisora: '',
    numeroRadicado: '',
    medicoTratante: '',
    registroMedico: '',
    ipsAtencion: '',
    estado: 'Activa',
    estadoCobro: 'Pendiente Radicación',
    observaciones: '',
    requiereExamenReintegro: false,
    documentoSoporteUrl: ''
  });

  // Buscador de CIE-10 dentro del modal
  const [cieSearchTerm, setCieSearchTerm] = useState('');

  // Persistir en localStorage
  useEffect(() => {
    saveStoredIncapacidades(incapacidades);
  }, [incapacidades]);

  // Alertas automáticas calculadas
  const alertas = useMemo(() => obtenerAlertasIncapacidades(incapacidades), [incapacidades]);

  // Acumulados por empleado
  const acumuladosEmpleados = useMemo(() => {
    return calcularAcumuladosPorEmpleado(empleados, incapacidades);
  }, [empleados, incapacidades]);

  // Cálculos reactivos de días y costos en el formulario
  const calculoFormulario = useMemo(() => {
    const dias = calcularDiasEntreFechas(formData.fechaInicio || '', formData.fechaFin || '');
    const emp = empleados.find(e => e.id === formData.empleadoId);
    const salario = emp?.salarioBase || 1423500;
    const desglose = calcularDesgloseDiasYCostos(
      formData.origen || 'Comun',
      formData.subtipo || 'Enfermedad General',
      dias,
      salario
    );
    return {
      dias,
      salario,
      ...desglose
    };
  }, [formData.fechaInicio, formData.fechaFin, formData.origen, formData.subtipo, formData.empleadoId, empleados]);

  // KPIs superiores
  const kpis = useMemo(() => {
    const total = incapacidades.length;
    const activas = incapacidades.filter(i => i.fechaInicio <= hoyStr && i.fechaFin >= hoyStr).length;
    const porVencer = incapacidades.filter(i => {
      const diff = calcularDiasEntreFechas(hoyStr, i.fechaFin) - 1;
      return diff >= 0 && diff <= 5;
    }).length;

    const anoRef = parseInt(hoyStr.split('-')[0]) || 2026;
    const diasAno = incapacidades
      .filter(i => (parseInt(i.fechaInicio.split('-')[0]) || 2026) === anoRef)
      .reduce((acc, curr) => acc + (curr.diasIncapacidad || 0), 0);

    const valorPorRecobrar = incapacidades
      .filter(i => i.estadoCobro === 'Pendiente Radicación' || i.estadoCobro === 'Radicado ante Entidad')
      .reduce((acc, curr) => acc + (curr.valorEstimadoEntidad || 0), 0);

    return { total, activas, porVencer, diasAno, valorPorRecobrar };
  }, [incapacidades, hoyStr]);

  // Filtrado de la tabla principal
  const incapacidadesFiltradas = useMemo(() => {
    return incapacidades.filter(inc => {
      // Búsqueda
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchEmp = inc.empleadoNombre.toLowerCase().includes(term);
        const matchDoc = inc.empleadoNumeroDocumento.toLowerCase().includes(term);
        const matchCie = inc.codigoCIE10.toLowerCase().includes(term);
        const matchDiag = inc.diagnostico.toLowerCase().includes(term);
        const matchRad = inc.numeroRadicado.toLowerCase().includes(term);
        if (!matchEmp && !matchDoc && !matchCie && !matchDiag && !matchRad) return false;
      }

      // Filtro de origen
      if (filtroOrigen !== 'TODOS' && inc.origen !== filtroOrigen) return false;

      // Filtro de contingencia
      if (filtroContingencia !== 'TODOS' && inc.tipoContingencia !== filtroContingencia) return false;

      // Filtro de estado
      if (filtroEstado !== 'TODOS') {
        if (filtroEstado === 'Activa') {
          if (!(inc.fechaInicio <= hoyStr && inc.fechaFin >= hoyStr)) return false;
        } else if (filtroEstado === 'Por Vencer') {
          const diff = calcularDiasEntreFechas(hoyStr, inc.fechaFin) - 1;
          if (!(diff >= 0 && diff <= 5)) return false;
        } else if (filtroEstado === 'Finalizada') {
          if (inc.fechaFin >= hoyStr) return false;
        } else if (filtroEstado === 'Pendiente Cobro') {
          if (inc.estadoCobro !== 'Pendiente Radicación') return false;
        }
      }

      return true;
    });
  }, [incapacidades, searchTerm, filtroOrigen, filtroEstado, filtroContingencia, hoyStr]);

  // Datos filtrados para el Reporte de Nómina según el mes seleccionado
  const incapacidadesReporteNomina = useMemo(() => {
    return incapacidades.filter(inc => {
      // Si la incapacidad toca el mes seleccionado (YYYY-MM)
      const mesIni = inc.fechaInicio.slice(0, 7);
      const mesFin = inc.fechaFin.slice(0, 7);
      return mesIni === mesReporte || mesFin === mesReporte;
    });
  }, [incapacidades, mesReporte]);

  // Totales de nómina para el mes
  const resumenNomina = useMemo(() => {
    const totalDias = incapacidadesReporteNomina.reduce((acc, curr) => acc + curr.diasIncapacidad, 0);
    const diasEmpresa = incapacidadesReporteNomina.reduce((acc, curr) => acc + curr.diasEmpresa, 0);
    const diasEntidad = incapacidadesReporteNomina.reduce((acc, curr) => acc + curr.diasEntidad, 0);
    const valorEmpresa = incapacidadesReporteNomina.reduce((acc, curr) => acc + curr.valorEstimadoEmpresa, 0);
    const valorEntidad = incapacidadesReporteNomina.reduce((acc, curr) => acc + curr.valorEstimadoEntidad, 0);
    const totalEmpleadosAfectados = new Set(incapacidadesReporteNomina.map(i => i.empleadoId)).size;

    return {
      totalDias,
      diasEmpresa,
      diasEntidad,
      valorEmpresa,
      valorEntidad,
      totalEmpleadosAfectados
    };
  }, [incapacidadesReporteNomina]);

  // Abrir modal para crear nueva incapacidad
  const handleNuevaIncapacidad = (empleadoIdPrefijado?: string) => {
    const emp = empleados.find(e => e.id === (empleadoIdPrefijado || empleados[0]?.id));
    setModoEdicion(false);
    setIncapacidadSeleccionada(null);
    setFormData({
      empleadoId: emp?.id || '',
      origen: 'Comun',
      subtipo: 'Enfermedad General',
      tipoContingencia: 'Inicial',
      fechaInicio: hoyStr,
      fechaFin: hoyStr,
      fechaExpedicion: hoyStr,
      codigoCIE10: 'M54.5',
      diagnostico: 'Lumbago no especificado',
      entidadEmisora: emp?.seguridadSocial?.eps || 'EPS Sanitas',
      numeroRadicado: `RAD-${Date.now().toString().slice(-6)}`,
      medicoTratante: '',
      registroMedico: '',
      ipsAtencion: '',
      estado: 'Activa',
      estadoCobro: 'Pendiente Radicación',
      observaciones: '',
      requiereExamenReintegro: false,
      documentoSoporteUrl: ''
    });
    setModalRegistroOpen(true);
  };

  // Abrir modal para registrar prórroga con referencia previa
  const handleCrearProrroga = (incPrev: Incapacidad) => {
    setModoEdicion(false);
    setIncapacidadSeleccionada(null);
    // Fecha inicio es el día siguiente a la fecha fin previa
    const fechaFinPrev = new Date(incPrev.fechaFin + 'T00:00:00');
    fechaFinPrev.setDate(fechaFinPrev.getDate() + 1);
    const nuevaFechaInicio = fechaFinPrev.toISOString().split('T')[0];

    // Por defecto 5 días de prórroga
    fechaFinPrev.setDate(fechaFinPrev.getDate() + 4);
    const nuevaFechaFin = fechaFinPrev.toISOString().split('T')[0];

    setFormData({
      empleadoId: incPrev.empleadoId,
      origen: incPrev.origen,
      subtipo: incPrev.subtipo,
      tipoContingencia: 'Prorroga',
      incapacidadAnteriorId: incPrev.id,
      fechaInicio: nuevaFechaInicio,
      fechaFin: nuevaFechaFin,
      fechaExpedicion: hoyStr,
      codigoCIE10: incPrev.codigoCIE10,
      diagnostico: `Prórroga de ${incPrev.diagnostico}`,
      entidadEmisora: incPrev.entidadEmisora,
      numeroRadicado: `PRORR-${Date.now().toString().slice(-6)}`,
      medicoTratante: incPrev.medicoTratante || '',
      registroMedico: incPrev.registroMedico || '',
      ipsAtencion: incPrev.ipsAtencion || '',
      estado: 'Activa',
      estadoCobro: 'Pendiente Radicación',
      observaciones: `Prórroga consecutiva a la incapacidad previa radicado ${incPrev.numeroRadicado}.`,
      requiereExamenReintegro: incPrev.origen === 'Laboral' || (incPrev.diasIncapacidad + 5) >= 20,
      documentoSoporteUrl: ''
    });
    setModalRegistroOpen(true);
  };

  // Editar incapacidad existente
  const handleEditarIncapacidad = (inc: Incapacidad) => {
    setModoEdicion(true);
    setIncapacidadSeleccionada(inc);
    setFormData({ ...inc });
    setModalRegistroOpen(true);
  };

  // Guardar formulario
  const handleGuardarIncapacidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empleadoId) {
      alert('Seleccione un empleado.');
      return;
    }

    const emp = empleados.find(e => e.id === formData.empleadoId);
    if (!emp) return;

    const dias = calcularDiasEntreFechas(formData.fechaInicio || '', formData.fechaFin || '');
    if (dias <= 0) {
      alert('La fecha final debe ser igual o posterior a la fecha inicial.');
      return;
    }

    const salario = emp.salarioBase || 1423500;
    const desglose = calcularDesgloseDiasYCostos(
      formData.origen || 'Comun',
      formData.subtipo || 'Enfermedad General',
      dias,
      salario
    );

    // Determinar estado si no se especificó
    let estadoAuto: EstadoIncapacidad = formData.estado || 'Activa';
    if (formData.fechaFin && formData.fechaFin < hoyStr) {
      estadoAuto = 'Finalizada';
    } else if (formData.fechaFin) {
      const diff = calcularDiasEntreFechas(hoyStr, formData.fechaFin) - 1;
      if (diff >= 0 && diff <= 5) {
        estadoAuto = 'Por Vencer';
      }
    }

    if (modoEdicion && incapacidadSeleccionada) {
      // Actualizar
      const updatedList = incapacidades.map(item => {
        if (item.id === incapacidadSeleccionada.id) {
          return {
            ...item,
            ...formData,
            empleadoNombre: emp.nombre,
            empleadoNumeroDocumento: emp.documento,
            cargoId: emp.laboral?.cargoId || emp.cargoId,
            cargoNombre: emp.laboral?.cargoNombre || 'Colaborador',
            areaNombre: emp.laboral?.areaNombre || 'Área General',
            diasIncapacidad: dias,
            diasEmpresa: desglose.diasEmpresa,
            diasEntidad: desglose.diasEntidad,
            salarioBase: salario,
            valorEstimadoEmpresa: desglose.valorEstimadoEmpresa,
            valorEstimadoEntidad: desglose.valorEstimadoEntidad,
            estado: estadoAuto
          } as Incapacidad;
        }
        return item;
      });
      setIncapacidades(updatedList);
    } else {
      // Crear nueva
      const nueva: Incapacidad = {
        id: `inc-${Date.now().toString().slice(-6)}`,
        empleadoId: emp.id,
        empleadoNombre: emp.nombre,
        empleadoNumeroDocumento: emp.documento,
        cargoId: emp.laboral?.cargoId || emp.cargoId,
        cargoNombre: emp.laboral?.cargoNombre || 'Colaborador',
        areaNombre: emp.laboral?.areaNombre || 'Área General',
        origen: formData.origen || 'Comun',
        subtipo: formData.subtipo || 'Enfermedad General',
        tipoContingencia: formData.tipoContingencia || 'Inicial',
        incapacidadAnteriorId: formData.incapacidadAnteriorId,
        fechaInicio: formData.fechaInicio || hoyStr,
        fechaFin: formData.fechaFin || hoyStr,
        fechaExpedicion: formData.fechaExpedicion || hoyStr,
        diasIncapacidad: dias,
        diasEmpresa: desglose.diasEmpresa,
        diasEntidad: desglose.diasEntidad,
        salarioBase: salario,
        valorEstimadoEmpresa: desglose.valorEstimadoEmpresa,
        valorEstimadoEntidad: desglose.valorEstimadoEntidad,
        codigoCIE10: formData.codigoCIE10 || 'M54.5',
        diagnostico: formData.diagnostico || 'Diagnóstico médico',
        entidadEmisora: formData.entidadEmisora || emp.seguridadSocial?.eps || 'EPS',
        numeroRadicado: formData.numeroRadicado || `RAD-${Date.now()}`,
        medicoTratante: formData.medicoTratante,
        registroMedico: formData.registroMedico,
        ipsAtencion: formData.ipsAtencion,
        estado: estadoAuto,
        estadoCobro: formData.estadoCobro || 'Pendiente Radicación',
        observaciones: formData.observaciones,
        documentoSoporteUrl: formData.documentoSoporteUrl,
        requiereExamenReintegro: formData.requiereExamenReintegro || (dias >= 20 || formData.origen === 'Laboral'),
        examenReintegroAgendado: false,
        fechaRegistro: hoyStr,
        registradoPor: currentUser?.nombre || 'Gestión Humana'
      };

      setIncapacidades([nueva, ...incapacidades]);
    }

    setModalRegistroOpen(false);
  };

  // Eliminar incapacidad
  const handleEliminarIncapacidad = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro de incapacidad médica? Esta acción no se puede deshacer.')) {
      setIncapacidades(incapacidades.filter(i => i.id !== id));
      if (modalDetalleOpen && incapacidadSeleccionada?.id === id) {
        setModalDetalleOpen(false);
      }
    }
  };

  // Cambiar estado de cobro rápido
  const handleCambiarEstadoCobro = (incId: string, nuevoEstado: EstadoCobroIncapacidad) => {
    const updated = incapacidades.map(i => {
      if (i.id === incId) {
        return { ...i, estadoCobro: nuevoEstado };
      }
      return i;
    });
    setIncapacidades(updated);
    if (incapacidadSeleccionada?.id === incId) {
      setIncapacidadSeleccionada({ ...incapacidadSeleccionada, estadoCobro: nuevoEstado });
    }
  };

  // Exportar a Excel (CSV con formato UTF-8)
  const handleExportarExcelNomina = () => {
    const encabezados = [
      'Cédula',
      'Colaborador',
      'Cargo',
      'Área',
      'Origen',
      'Subtipo',
      'Tipo Contingencia',
      'CIE-10',
      'Diagnóstico',
      'Fecha Inicio',
      'Fecha Fin',
      'Días Totales',
      'Días Empresa (1-2)',
      'Días EPS/ARL (3+)',
      'Salario Base',
      'Auxilio Empresa ($)',
      'Auxilio EPS/ARL ($)',
      'Entidad Emisora',
      'No. Radicado',
      'Estado Cobro'
    ];

    const filas = incapacidadesReporteNomina.map(i => [
      `"${i.empleadoNumeroDocumento}"`,
      `"${i.empleadoNombre}"`,
      `"${i.cargoNombre || ''}"`,
      `"${i.areaNombre || ''}"`,
      `"${i.origen}"`,
      `"${i.subtipo}"`,
      `"${i.tipoContingencia}"`,
      `"${i.codigoCIE10}"`,
      `"${i.diagnostico.replace(/"/g, '""')}"`,
      `"${i.fechaInicio}"`,
      `"${i.fechaFin}"`,
      i.diasIncapacidad,
      i.diasEmpresa,
      i.diasEntidad,
      i.salarioBase,
      i.valorEstimadoEmpresa,
      i.valorEstimadoEntidad,
      `"${i.entidadEmisora}"`,
      `"${i.numeroRadicado}"`,
      `"${i.estadoCobro}"`
    ]);

    const csvContent = '\uFEFF' + [encabezados.join(';'), ...filas.map(f => f.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Incapacidades_Nomina_${mesReporte}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#18235C] text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5 text-[#8FA7D6]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#18235C] tracking-tight">
                Control de Incapacidades Médicas
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Gestión de ausentismo, acumulación de días, alertas de vencimiento y reporte oficial a Nómina (CST / Res. 0312)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('portal')}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Portal de Módulos</span>
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('indicadores-sst')}
              className="px-3.5 py-2 rounded-xl border border-indigo-200 text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              title="Consultar indicador oficial de Ausentismo Laboral por Causa Médica en SG-SST (Res. 0312)"
            >
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Indicador SST Ausentismo</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('reporte-nomina')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'reporte-nomina'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Reporte para Nómina</span>
          </button>

          <button
            id="btn-nueva-incapacidad"
            onClick={() => handleNuevaIncapacidad()}
            className="px-4 py-2 rounded-xl bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#8FA7D6]" />
            <span>Registrar Incapacidad</span>
          </button>
        </div>
      </div>

      {/* BANNER DE ALERTAS AUTOMÁTICAS (SI HAY ALERTAS) */}
      {alertas.length > 0 && alertaBannerVisible && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <BadgeAlert className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-900">
                    Alertas Tempranas del Sistema ({alertas.length} avisos activos)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                    Tiempo Real
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {alertas.slice(0, 4).map(alerta => (
                    <div
                      key={alerta.id}
                      className="text-xs bg-white/80 p-2.5 rounded-lg border border-amber-200/60 flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{alerta.titulo}</span>
                        <span className="text-slate-600 text-[11px] leading-tight block mt-0.5">
                          {alerta.descripcion}
                        </span>
                      </div>
                      {alerta.incapacidadId && (
                        <button
                          onClick={() => {
                            const target = incapacidades.find(i => i.id === alerta.incapacidadId);
                            if (target) {
                              setIncapacidadSeleccionada(target);
                              setModalDetalleOpen(true);
                            }
                          }}
                          className="shrink-0 text-[11px] font-bold text-[#18235C] hover:underline"
                        >
                          Ver
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setAlertaBannerVisible(false)}
              className="text-amber-600 hover:text-amber-800 p-1"
              title="Ocultar avisos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5 KPIS SUPERIORES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Incapacidades</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-[#18235C]">{kpis.total}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Expedientes en histórico</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-semibold text-blue-800">Activas Hoy</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{kpis.activas}</div>
          <span className="text-[10px] text-blue-700 font-medium block mt-1">Colaboradores ausentes</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold text-amber-800">Vencen en ≤ 5 días</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{kpis.porVencer}</div>
          <span className="text-[10px] text-amber-700 font-medium block mt-1">Reintegro o prórroga</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">Días Acumulados 2026</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{kpis.diasAno} días</div>
          <span className="text-[10px] text-slate-500 block mt-1">Ausentismo acumulado año</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold text-emerald-800">Recobro EPS / ARL</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-900">
            ${kpis.valorPorRecobrar.toLocaleString('es-CO')}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block mt-1">Cartera estimada pendiente</span>
        </div>
      </div>

      {/* TABS DE SECCIÓN */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('gestion')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'gestion'
              ? 'border-[#18235C] text-[#18235C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Gestión de Incapacidades ({incapacidades.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('acumulados')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'acumulados'
              ? 'border-[#18235C] text-[#18235C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Días Acumulados por Empleado & Fuero de Salud</span>
        </button>

        <button
          onClick={() => setActiveTab('reporte-nomina')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'reporte-nomina'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Reporte para el Área de Nómina</span>
        </button>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE INCAPACIDADES */}
      {activeTab === 'gestion' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por empleado, cédula, CIE-10 o radicado..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#18235C]/20 focus:border-[#18235C]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filtro Origen */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 px-1 uppercase">Origen:</span>
                {(['TODOS', 'Comun', 'Laboral'] as const).map(orig => (
                  <button
                    key={orig}
                    onClick={() => setFiltroOrigen(orig)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                      filtroOrigen === orig
                        ? 'bg-white text-[#18235C] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {orig === 'TODOS' ? 'Todos' : orig === 'Comun' ? 'Común' : 'Laboral (AT/EL)'}
                  </button>
                ))}
              </div>

              {/* Filtro Estado */}
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="Activa">Activas Hoy</option>
                <option value="Por Vencer">Vencen en ≤ 5 días</option>
                <option value="Finalizada">Finalizadas</option>
                <option value="Pendiente Cobro">Pendiente Recobro EPS</option>
              </select>

              {/* Filtro Prórroga */}
              <select
                value={filtroContingencia}
                onChange={e => setFiltroContingencia(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
              >
                <option value="TODOS">Inicial / Prórroga</option>
                <option value="Inicial">Solo Iniciales</option>
                <option value="Prorroga">Solo Prórrogas</option>
              </select>
            </div>
          </div>

          {/* TABLA DE INCAPACIDADES */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Colaborador / Cargo</th>
                    <th className="py-3 px-3">Origen / Contingencia</th>
                    <th className="py-3 px-3">Diagnóstico (CIE-10)</th>
                    <th className="py-3 px-3">Período & Días</th>
                    <th className="py-3 px-3">Desglose Nómina</th>
                    <th className="py-3 px-3">Entidad & Radicado</th>
                    <th className="py-3 px-3">Estado / Alerta</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incapacidadesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No se encontraron incapacidades con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    incapacidadesFiltradas.map(inc => {
                      const diffVenc = calcularDiasEntreFechas(hoyStr, inc.fechaFin) - 1;
                      const esActiva = inc.fechaInicio <= hoyStr && inc.fechaFin >= hoyStr;

                      return (
                        <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#18235C] leading-snug">
                              {inc.empleadoNombre}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              C.C. {inc.empleadoNumeroDocumento}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {inc.cargoNombre}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inc.origen === 'Laboral'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              }`}
                            >
                              {inc.origen === 'Laboral' ? 'Laboral (AT/EL)' : 'Origen Común'}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              {inc.tipoContingencia === 'Prorroga' ? (
                                <span className="text-purple-700 font-bold bg-purple-50 px-1 rounded">
                                  Prórroga
                                </span>
                              ) : (
                                <span>Inicial</span>
                              )}
                              <span>• {inc.subtipo}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 max-w-[220px]">
                            <div className="flex items-center gap-1 font-mono font-bold text-[#18235C] text-[11px]">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {inc.codigoCIE10}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-700 truncate mt-0.5" title={inc.diagnostico}>
                              {inc.diagnostico}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              {inc.diasIncapacidad} días
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {inc.fechaInicio} al {inc.fechaFin}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="text-[11px]">
                              <span className="text-slate-500">Empresa: </span>
                              <span className="font-bold text-slate-800">{inc.diasEmpresa}d</span>
                              {inc.valorEstimadoEmpresa > 0 && (
                                <span className="text-slate-500 text-[10px]"> (${inc.valorEstimadoEmpresa.toLocaleString('es-CO')})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-emerald-700">
                              <span className="text-slate-500">EPS/ARL: </span>
                              <span className="font-bold">{inc.diasEntidad}d</span>
                              {inc.valorEstimadoEntidad > 0 && (
                                <span className="text-[10px]"> (${inc.valorEstimadoEntidad.toLocaleString('es-CO')})</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-medium text-slate-800 text-[11px] truncate max-w-[150px]">
                              {inc.entidadEmisora}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Rad: {inc.numeroRadicado}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {esActiva ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Activa Hoy
                              </span>
                            ) : inc.fechaFin < hoyStr ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                                Finalizada
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                Por Vencer ({diffVenc}d)
                              </span>
                            )}

                            {/* Alerta de examen posincapacidad si aplica */}
                            {inc.requiereExamenReintegro && (
                              <div className="mt-1">
                                {inc.examenReintegroAgendado ? (
                                  <span className="text-[9px] text-teal-700 font-bold flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                    Examen SST Agendado
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-amber-800 font-bold flex items-center gap-0.5 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    Req. Examen Reintegro
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setIncapacidadSeleccionada(inc);
                                  setModalDetalleOpen(true);
                                }}
                                className="p-1.5 text-slate-600 hover:text-[#18235C] hover:bg-slate-100 rounded-lg transition-colors"
                                title="Ver detalle y trazabilidad"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleCrearProrroga(inc)}
                                className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Registrar prórroga continua"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleEditarIncapacidad(inc)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar incapacidad"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleEliminarIncapacidad(inc.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: DÍAS ACUMULADOS POR EMPLEADO & FUERO DE SALUD */}
      {activeTab === 'acumulados' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <h2 className="text-base font-bold text-[#18235C] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#8FA7D6]" />
              Monitoreo Normativo de Días Acumulados y Ausentismo (Decreto 19/2012)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              El seguimiento periódico de días acumulados permite prevenir contingencias laborales y activar oportunamente los trámites de ley:
              <strong className="text-slate-800"> 90 días</strong> (emisión temprana de concepto de rehabilitación EPS),
              <strong className="text-slate-800"> 120-150 días</strong> (remisión obligatoria de concepto al Fondo de Pensiones), y
              <strong className="text-slate-800"> 180 días</strong> (traspaso de subsidio a AFP y protección de estabilidad laboral reforzada / fuero de salud).
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Colaborador / Cargo</th>
                    <th className="py-3 px-3 text-center">Incapacidades Registradas</th>
                    <th className="py-3 px-3 text-center">Días Año 2026</th>
                    <th className="py-3 px-3 text-center">Origen Común</th>
                    <th className="py-3 px-3 text-center">Origen Laboral (AT/EL)</th>
                    <th className="py-3 px-3 text-center">Episodio Continuo Máximo</th>
                    <th className="py-3 px-3">Semáforo de Ley</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acumuladosEmpleados.map(item => {
                    let semaforoBadge = (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Normal (&lt; 90d)
                      </span>
                    );

                    if (item.alertaNivel === 'critica_180' || item.alertaNivel === 'fuero_salud') {
                      semaforoBadge = (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                          ⚠️ Crítico (&ge; 180d) - Fuero de Salud
                        </span>
                      );
                    } else if (item.alertaNivel === 'alerta_120') {
                      semaforoBadge = (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
                          Alerta EPS (&ge; 120d) - Trámite AFP
                        </span>
                      );
                    } else if (item.alertaNivel === 'preventiva_90') {
                      semaforoBadge = (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Preventivo (&ge; 90d) - Concepto EPS
                        </span>
                      );
                    }

                    return (
                      <tr key={item.empleadoId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#18235C]">{item.empleadoNombre}</div>
                          <div className="text-[11px] text-slate-500 font-mono">C.C. {item.empleadoNumeroDocumento}</div>
                          <div className="text-[10px] text-slate-400">{item.cargoNombre} • {item.areaNombre}</div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-slate-800 text-sm">
                            {item.totalIncapacidades}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`font-black text-sm ${item.diasAcumuladosAno > 0 ? 'text-[#18235C]' : 'text-slate-400'}`}>
                            {item.diasAcumuladosAno} días
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-indigo-900">
                            {item.diasOrigenComun}d
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-amber-800">
                            {item.diasOrigenLaboral}d
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {item.diasEpisodioContinuoActual} días
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {semaforoBadge}
                          {item.mensajeAlerta && (
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-tight">
                              {item.mensajeAlerta}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleNuevaIncapacidad(item.empleadoId)}
                            className="px-2.5 py-1.5 text-[11px] font-bold bg-[#18235C] text-white rounded-lg hover:bg-[#101740] transition-colors cursor-pointer"
                          >
                            + Nueva
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: REPORTE PARA EL ÁREA DE NÓMINA */}
      {activeTab === 'reporte-nomina' && (
        <div className="space-y-4">
          {/* HEADER DEL REPORTE */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Consolidado Oficial de Incapacidades para Liquidación Periódica</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo de días a descontar/pagar por la empresa y auxilio económico liquidable ante EPS / ARL
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-600">Período Nómina:</label>
                <input
                  type="month"
                  value={mesReporte}
                  onChange={e => setMesReporte(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-[#18235C]"
                />
              </div>

              <button
                onClick={handleExportarExcelNomina}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar a Excel (CSV)</span>
              </button>

              <button
                onClick={() => setModalImprimirReporteOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Vista Previa / Imprimir</span>
              </button>
            </div>
          </div>

          {/* TARJETAS RESUMEN DE IMPACTO EN NÓMINA */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Días en el Período</span>
              <span className="text-2xl font-black text-[#18235C] mt-1 block">
                {resumenNomina.totalDias} días
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {resumenNomina.totalEmpleadosAfectados} colaboradores afectados
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-indigo-700 block">Días a Cargo Empresa (1 y 2)</span>
              <span className="text-2xl font-black text-indigo-950 mt-1 block">
                {resumenNomina.diasEmpresa} días
              </span>
              <span className="text-[10px] text-indigo-600 mt-0.5 block">
                Costo estimado: ${resumenNomina.valorEmpresa.toLocaleString('es-CO')}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-800 block">Días Cubiertos EPS / ARL</span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">
                {resumenNomina.diasEntidad} días
              </span>
              <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                Auxilio por recobrar: ${resumenNomina.valorEntidad.toLocaleString('es-CO')}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Enlace a Nómina CST</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Los días registrados aquí alimentan automáticamente el campo <strong>incapacidadDias</strong> en Nómina.
              </p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('nomina')}
                  className="mt-2 text-xs font-bold text-[#18235C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ir a Liquidación de Nómina</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* TABLA FORMAL DE NÓMINA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-[#18235C]">
                Detalle para Nómina de {mesReporte} ({incapacidadesReporteNomina.length} registros)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Cédula</th>
                    <th className="py-2.5 px-3">Empleado</th>
                    <th className="py-2.5 px-3">Cargo</th>
                    <th className="py-2.5 px-2">Origen</th>
                    <th className="py-2.5 px-2">CIE-10</th>
                    <th className="py-2.5 px-2">Fechas</th>
                    <th className="py-2.5 px-2 text-center">Días Total</th>
                    <th className="py-2.5 px-2 text-center">Días Empresa</th>
                    <th className="py-2.5 px-2 text-center">Días Entidad</th>
                    <th className="py-2.5 px-3 text-right">Salario Base</th>
                    <th className="py-2.5 px-3 text-right">Auxilio Empresa</th>
                    <th className="py-2.5 px-3 text-right">Valor Recobro EPS/ARL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incapacidadesReporteNomina.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        No hay incapacidades registradas para el período {mesReporte}.
                      </td>
                    </tr>
                  ) : (
                    incapacidadesReporteNomina.map(inc => (
                      <tr key={inc.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono">{inc.empleadoNumeroDocumento}</td>
                        <td className="py-2.5 px-3 font-bold text-[#18235C]">{inc.empleadoNombre}</td>
                        <td className="py-2.5 px-3 text-slate-500">{inc.cargoNombre}</td>
                        <td className="py-2.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            inc.origen === 'Laboral' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {inc.origen}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono">{inc.codigoCIE10}</td>
                        <td className="py-2.5 px-2 text-[10px] whitespace-nowrap">
                          {inc.fechaInicio} / {inc.fechaFin}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">{inc.diasIncapacidad}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-indigo-900">{inc.diasEmpresa}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-emerald-800">{inc.diasEntidad}</td>
                        <td className="py-2.5 px-3 text-right font-mono">${inc.salarioBase.toLocaleString('es-CO')}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-950 font-bold">
                          ${inc.valorEstimadoEmpresa.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800 font-bold">
                          ${inc.valorEstimadoEntidad.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {incapacidadesReporteNomina.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                      <td colSpan={6} className="py-3 px-3 uppercase text-[10px]">
                        Totales para Nómina {mesReporte}
                      </td>
                      <td className="py-3 px-2 text-center text-sm">{resumenNomina.totalDias}d</td>
                      <td className="py-3 px-2 text-center text-sm text-indigo-900">{resumenNomina.diasEmpresa}d</td>
                      <td className="py-3 px-2 text-center text-sm text-emerald-800">{resumenNomina.diasEntidad}d</td>
                      <td></td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-950">
                        ${resumenNomina.valorEmpresa.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800">
                        ${resumenNomina.valorEntidad.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR / EDITAR INCAPACIDAD */}
      {modalRegistroOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden">
            <div className="p-5 bg-[#18235C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-5 h-5 text-[#8FA7D6]" />
                <h3 className="font-bold text-base">
                  {modoEdicion ? 'Editar Incapacidad Médica' : 'Registrar Nueva Incapacidad Médica'}
                </h3>
              </div>
              <button
                onClick={() => setModalRegistroOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarIncapacidad} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* SELECCIÓN DE EMPLEADO */}
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Colaborador Titular <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.empleadoId}
                  onChange={e => {
                    const emp = empleados.find(x => x.id === e.target.value);
                    setFormData({
                      ...formData,
                      empleadoId: e.target.value,
                      entidadEmisora: formData.origen === 'Laboral'
                        ? emp?.seguridadSocial?.arl || 'Positiva ARL'
                        : emp?.seguridadSocial?.eps || 'EPS Sanitas'
                    });
                  }}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-medium"
                >
                  <option value="">-- Seleccionar colaborador --</option>
                  {empleados.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} — C.C. {emp.documento} ({emp.laboral?.cargoNombre || 'Colaborador'})
                    </option>
                  ))}
                </select>
              </div>

              {/* ORIGEN Y CONTINGENCIA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Origen de la Contingencia <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.origen}
                    onChange={e => {
                      const origen = e.target.value as OrigenIncapacidad;
                      const subtipo = origen === 'Laboral' ? 'Accidente de Trabajo' : 'Enfermedad General';
                      const emp = empleados.find(x => x.id === formData.empleadoId);
                      setFormData({
                        ...formData,
                        origen,
                        subtipo,
                        entidadEmisora: origen === 'Laboral'
                          ? emp?.seguridadSocial?.arl || 'Positiva ARL'
                          : emp?.seguridadSocial?.eps || 'EPS Sanitas'
                      });
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="Comun">Origen Común</option>
                    <option value="Laboral">Origen Laboral (AT / EL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Subtipo Específico
                  </label>
                  <select
                    value={formData.subtipo}
                    onChange={e => setFormData({ ...formData, subtipo: e.target.value as SubtipoIncapacidad })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    {formData.origen === 'Laboral' ? (
                      <>
                        <option value="Accidente de Trabajo">Accidente de Trabajo (AT)</option>
                        <option value="Enfermedad Laboral">Enfermedad Laboral (EL)</option>
                      </>
                    ) : (
                      <>
                        <option value="Enfermedad General">Enfermedad General</option>
                        <option value="Licencia de Maternidad">Licencia de Maternidad (Ley 1822)</option>
                        <option value="Licencia de Paternidad">Licencia de Paternidad (Ley 2114)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={formData.tipoContingencia}
                    onChange={e => setFormData({ ...formData, tipoContingencia: e.target.value as TipoContingenciaIncapacidad })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="Inicial">Incapacidad Inicial</option>
                    <option value="Prorroga">Prórroga de Evento Previo</option>
                  </select>
                </div>
              </div>

              {/* SI ES PRÓRROGA: SELECCIONAR INCAPACIDAD PREVIA */}
              {formData.tipoContingencia === 'Prorroga' && (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                  <label className="block font-bold text-purple-950 mb-1">
                    Incapacidad Anterior a Prorrogar (del mismo empleado)
                  </label>
                  <select
                    value={formData.incapacidadAnteriorId || ''}
                    onChange={e => setFormData({ ...formData, incapacidadAnteriorId: e.target.value })}
                    className="w-full border border-purple-300 rounded-lg p-2 bg-white text-xs"
                  >
                    <option value="">-- Seleccionar incapacidad anterior --</option>
                    {incapacidades
                      .filter(i => i.empleadoId === formData.empleadoId && i.id !== incapacidadSeleccionada?.id)
                      .map(prev => (
                        <option key={prev.id} value={prev.id}>
                          Radicado: {prev.numeroRadicado} ({prev.fechaInicio} al {prev.fechaFin} - {prev.diasIncapacidad}d) — {prev.diagnostico.slice(0, 40)}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-purple-800 mt-1">
                    Vincular la prórroga permite acumular automáticamente los días continuos para el cómputo de los 90 y 180 días de ley.
                  </p>
                </div>
              )}

              {/* FECHAS Y DÍAS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Fecha de Inicio <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fechaInicio}
                    onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Fecha de Finalización <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fechaFin}
                    onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Fecha de Expedición Médica
                  </label>
                  <input
                    type="date"
                    value={formData.fechaExpedicion}
                    onChange={e => setFormData({ ...formData, fechaExpedicion: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              {/* RESUMEN REACTIVO DE DÍAS Y COSTOS */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-slate-500 text-[11px] block">Días Calendario Calculados:</span>
                  <span className="text-lg font-black text-[#18235C]">
                    {calculoFormulario.dias} días
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">A Cargo Empleador (Días 1-2):</span>
                  <span className="text-sm font-bold text-indigo-900">
                    {calculoFormulario.diasEmpresa} días
                    <span className="text-xs text-slate-500"> (~${calculoFormulario.valorEstimadoEmpresa.toLocaleString('es-CO')})</span>
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Subsidio EPS / ARL (Días 3+ o 100%):</span>
                  <span className="text-sm font-bold text-emerald-800">
                    {calculoFormulario.diasEntidad} días
                    <span className="text-xs text-slate-500"> (~${calculoFormulario.valorEstimadoEntidad.toLocaleString('es-CO')})</span>
                  </span>
                </div>
              </div>

              {/* DIAGNÓSTICO Y CÓDIGO CIE-10 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-[#18235C]">
                    Código CIE-10 y Diagnóstico Clínico <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Catálogo oficial OMS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      placeholder="Ej. M54.5"
                      value={formData.codigoCIE10}
                      onChange={e => setFormData({ ...formData, codigoCIE10: e.target.value.toUpperCase() })}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold uppercase"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Descripción del diagnóstico médico..."
                      value={formData.diagnostico}
                      onChange={e => setFormData({ ...formData, diagnostico: e.target.value })}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                {/* SELECTOR RÁPIDO DESDE CATÁLOGO CIE-10 */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                    <span>Sugerencias rápidas CIE-10 frecuentes:</span>
                    <input
                      type="text"
                      placeholder="Filtrar catálogo..."
                      value={cieSearchTerm}
                      onChange={e => setCieSearchTerm(e.target.value)}
                      className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {CATALOGO_CIE10
                      .filter(item => {
                        if (!cieSearchTerm) return true;
                        const t = cieSearchTerm.toLowerCase();
                        return item.codigo.toLowerCase().includes(t) || item.descripcion.toLowerCase().includes(t);
                      })
                      .slice(0, 10)
                      .map(item => (
                        <button
                          type="button"
                          key={item.codigo}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              codigoCIE10: item.codigo,
                              diagnostico: item.descripcion
                            });
                          }}
                          className="px-2 py-1 text-[10px] bg-white hover:bg-[#18235C] hover:text-white border border-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                        >
                          <strong>{item.codigo}</strong>: {item.descripcion.slice(0, 32)}...
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* DATOS DE LA ENTIDAD Y CERTIFICADO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Entidad Emisora (EPS / ARL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. EPS Sanitas, Sura, Positiva ARL"
                    value={formData.entidadEmisora}
                    onChange={e => setFormData({ ...formData, entidadEmisora: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    No. Certificado / Radicado <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CERT-19284-EPS"
                    value={formData.numeroRadicado}
                    onChange={e => setFormData({ ...formData, numeroRadicado: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Estado de Radicación / Cobro
                  </label>
                  <select
                    value={formData.estadoCobro}
                    onChange={e => setFormData({ ...formData, estadoCobro: e.target.value as EstadoCobroIncapacidad })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Pendiente Radicación">Pendiente Radicación</option>
                    <option value="Radicado ante Entidad">Radicado ante EPS/ARL</option>
                    <option value="Reconocido">Reconocido / Autorizado</option>
                    <option value="Pagado">Pagado / Compensado</option>
                    <option value="Glosado / Objetado">Glosado / Objetado</option>
                  </select>
                </div>
              </div>

              {/* MÉDICO TRATANTE E IPS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Médico Tratante
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Dr. Andrés Vargas"
                    value={formData.medicoTratante || ''}
                    onChange={e => setFormData({ ...formData, medicoTratante: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Registro Médico / TP
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. RM-48201-BOG"
                    value={formData.registroMedico || ''}
                    onChange={e => setFormData({ ...formData, registroMedico: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    IPS de Atención
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Clínica del Country"
                    value={formData.ipsAtencion || ''}
                    onChange={e => setFormData({ ...formData, ipsAtencion: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* SOPORTE DIGITAL EN GOOGLE DRIVE */}
              <div>
                <DriveLinkField
                  label="Enlace a Soporte Digital / Certificado Médico (Google Drive o Nube)"
                  value={formData.documentoSoporteUrl || ''}
                  onChange={val => setFormData({ ...formData, documentoSoporteUrl: val })}
                  placeholder="https://drive.google.com/file/d/.../view"
                  helpText="Adjunte el enlace al certificado médico expedido o radicado oficial para auditoría interna y recobro."
                />
              </div>

              {/* CHECKBOX EXAMEN POSINCAPACIDAD */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#18235C] block">
                    Requiere Examen Médico de Posincapacidad / Reintegro
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Obligatorio según Res. 2346/2007 para incapacidades laborales o de origen común superiores a 20-30 días.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.requiereExamenReintegro || false}
                  onChange={e => setFormData({ ...formData, requiereExamenReintegro: e.target.checked })}
                  className="w-4 h-4 text-[#18235C] rounded"
                />
              </div>

              {/* OBSERVACIONES */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Observaciones Clínicas o Administrativas
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotaciones sobre recomendaciones médicas, prórrogas o trámite de pago..."
                  value={formData.observaciones || ''}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* BOTONES MODAL */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalRegistroOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Incapacidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE Y TRAZABILIDAD */}
      {modalDetalleOpen && incapacidadSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden">
            <div className="p-5 bg-[#18235C] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8FA7D6] font-bold uppercase tracking-wider block">
                  Expediente de Ausentismo Médico
                </span>
                <h3 className="font-bold text-base mt-0.5">
                  Incapacidad No. {incapacidadSeleccionada.numeroRadicado}
                </h3>
              </div>
              <button
                onClick={() => setModalDetalleOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* FICHA RESUMEN */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">Colaborador:</span>
                  <span className="font-bold text-[#18235C] text-sm block">
                    {incapacidadSeleccionada.empleadoNombre}
                  </span>
                  <span className="text-slate-600 block text-[11px]">
                    C.C. {incapacidadSeleccionada.empleadoNumeroDocumento} • {incapacidadSeleccionada.cargoNombre}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">Origen y Categoría:</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    incapacidadSeleccionada.origen === 'Laboral'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                  }`}>
                    {incapacidadSeleccionada.origen === 'Laboral' ? 'Laboral (AT/EL)' : 'Origen Común'}
                  </span>
                  <span className="text-slate-600 block text-[11px] mt-1">
                    {incapacidadSeleccionada.subtipo} • {incapacidadSeleccionada.tipoContingencia}
                  </span>
                </div>
              </div>

              {/* DIAGNÓSTICO Y FECHAS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Diagnóstico Clínico</span>
                  <span className="font-mono font-bold text-[#18235C] text-xs block mt-0.5">
                    {incapacidadSeleccionada.codigoCIE10}
                  </span>
                  <p className="text-slate-700 text-xs mt-1 leading-snug">
                    {incapacidadSeleccionada.diagnostico}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Período de Ausencia</span>
                  <span className="text-slate-800 font-bold text-xs block mt-0.5">
                    {incapacidadSeleccionada.fechaInicio} al {incapacidadSeleccionada.fechaFin}
                  </span>
                  <span className="text-[#18235C] font-black text-sm block mt-1">
                    {incapacidadSeleccionada.diasIncapacidad} días calendario
                  </span>
                </div>
              </div>

              {/* DESGLOSE ECONÓMICO */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-900 uppercase block mb-2">
                  Impacto Económico y Recuperación (Nómina CST)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Días Empresa:</span>
                    <span className="font-bold text-slate-800 block">
                      {incapacidadSeleccionada.diasEmpresa} días
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ${incapacidadSeleccionada.valorEstimadoEmpresa.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Días EPS / ARL:</span>
                    <span className="font-bold text-emerald-800 block">
                      {incapacidadSeleccionada.diasEntidad} días
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      ${incapacidadSeleccionada.valorEstimadoEntidad.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Estado de Cobro:</span>
                    <select
                      value={incapacidadSeleccionada.estadoCobro}
                      onChange={e => handleCambiarEstadoCobro(incapacidadSeleccionada.id, e.target.value as EstadoCobroIncapacidad)}
                      className="mt-0.5 p-1 text-[11px] font-bold border border-emerald-300 rounded bg-white text-emerald-900"
                    >
                      <option value="Pendiente Radicación">Pendiente Radicación</option>
                      <option value="Radicado ante Entidad">Radicado ante Entidad</option>
                      <option value="Reconocido">Reconocido</option>
                      <option value="Pagado">Pagado / Reembolsado</option>
                      <option value="Glosado / Objetado">Glosado / Objetado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* MÉDICO Y RADICADO */}
              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Entidad Emisora:</span>
                  <span className="font-medium text-slate-800">{incapacidadSeleccionada.entidadEmisora}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Médico Tratante / RM:</span>
                  <span className="font-medium text-slate-800">
                    {incapacidadSeleccionada.medicoTratante || 'No registrado'} {incapacidadSeleccionada.registroMedico ? `(${incapacidadSeleccionada.registroMedico})` : ''}
                  </span>
                </div>
              </div>

              {/* SOPORTE ADJUNTO */}
              {incapacidadSeleccionada.documentoSoporteUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-blue-700" />
                    <div>
                      <span className="font-bold text-blue-900 text-xs block">Soporte Médico Digitalizado</span>
                      <span className="text-[10px] text-blue-700 truncate max-w-sm block">
                        {incapacidadSeleccionada.documentoSoporteUrl}
                      </span>
                    </div>
                  </div>
                  <a
                    href={formatDriveViewUrl(incapacidadSeleccionada.documentoSoporteUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 flex items-center gap-1 transition-colors"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* ACCIONES DEL MODAL */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    setModalDetalleOpen(false);
                    handleEditarIncapacidad(incapacidadSeleccionada);
                  }}
                  className="px-3 py-1.5 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Modificar Datos</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setModalDetalleOpen(false);
                      handleCrearProrroga(incapacidadSeleccionada);
                    }}
                    className="px-3.5 py-1.5 bg-purple-700 text-white rounded-lg font-bold hover:bg-purple-800 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generar Prórroga</span>
                  </button>

                  <button
                    onClick={() => setModalDetalleOpen(false)}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPRIMIR REPORTE DE NÓMINA */}
      {modalImprimirReporteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 p-8 space-y-6 text-slate-800">
            {/* MEMBRETE */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black text-[#18235C] tracking-tight">
                  {empresa?.razonSocial || 'CIMIENTO S.A.S.'}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  NIT: {empresa?.nit || '901.849.201-3'} • Dirección de Gestión Humana y Nómina
                </p>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  REPORTE OFICIAL DE INCAPACIDADES Y NOVEDADES LABORALES — {mesReporte}
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold block">Fecha de Emisión:</span>
                <span className="text-slate-600 font-mono">{hoyStr}</span>
                <button
                  onClick={() => window.print()}
                  className="mt-2 px-3 py-1.5 bg-[#18235C] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto hover:bg-[#101740] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Documento</span>
                </button>
              </div>
            </div>

            {/* RESUMEN EJECUTIVO */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Total Días Ausentismo:</span>
                <span className="font-black text-sm text-[#18235C]">{resumenNomina.totalDias} días</span>
              </div>
              <div>
                <span className="text-slate-500 block">Días a Cargo Empresa:</span>
                <span className="font-bold text-sm text-indigo-950">{resumenNomina.diasEmpresa} días</span>
              </div>
              <div>
                <span className="text-slate-500 block">Días Cubiertos EPS/ARL:</span>
                <span className="font-bold text-sm text-emerald-800">{resumenNomina.diasEntidad} días</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Recobro Entidades:</span>
                <span className="font-bold text-sm text-emerald-900">
                  ${resumenNomina.valorEntidad.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* TABLA FORMAL IMPRESIÓN */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300 text-[10px]">
                    <th className="p-2">Cédula</th>
                    <th className="p-2">Colaborador</th>
                    <th className="p-2">Cargo</th>
                    <th className="p-2">Origen</th>
                    <th className="p-2">CIE-10</th>
                    <th className="p-2">Período</th>
                    <th className="p-2 text-center">Días</th>
                    <th className="p-2 text-right">Aux. Empresa</th>
                    <th className="p-2 text-right">Recobro EPS/ARL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {incapacidadesReporteNomina.map(i => (
                    <tr key={i.id}>
                      <td className="p-2 font-mono">{i.empleadoNumeroDocumento}</td>
                      <td className="p-2 font-bold">{i.empleadoNombre}</td>
                      <td className="p-2 text-slate-600">{i.cargoNombre}</td>
                      <td className="p-2">{i.origen}</td>
                      <td className="p-2 font-mono">{i.codigoCIE10}</td>
                      <td className="p-2 text-[10px]">{i.fechaInicio} al {i.fechaFin}</td>
                      <td className="p-2 text-center font-bold">{i.diasIncapacidad}</td>
                      <td className="p-2 text-right font-mono">${i.valorEstimadoEmpresa.toLocaleString('es-CO')}</td>
                      <td className="p-2 text-right font-mono text-emerald-800 font-bold">
                        ${i.valorEstimadoEntidad.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FIRMAS DE RESPONSABILIDAD */}
            <div className="pt-8 grid grid-cols-2 gap-12 text-xs">
              <div className="border-t border-slate-400 pt-2 text-center">
                <span className="font-bold block text-slate-800">
                  {currentUser?.nombre || 'Director(a) de Gestión Humana'}
                </span>
                <span className="text-slate-500 block">Gestión Humana & Compensación</span>
              </div>

              <div className="border-t border-slate-400 pt-2 text-center">
                <span className="font-bold block text-slate-800">Revisión de Nómina & Auditoría</span>
                <span className="text-slate-500 block">Responsable de Liquidación CST</span>
              </div>
            </div>

            <div className="text-right pt-4 border-t border-slate-200">
              <button
                onClick={() => setModalImprimirReporteOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
