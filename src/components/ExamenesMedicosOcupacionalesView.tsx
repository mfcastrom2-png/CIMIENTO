import React, { useState, useMemo } from 'react';
import {
  Empleado,
  Cargo,
  AreaOrganizacion,
  Role,
  ExamenOcupacionalEmpleado
} from '../types';
import { uid } from '../data/initialData';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  Building2,
  Printer,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Check,
  HardHat,
  HeartPulse,
  UserX,
  FileCheck
} from 'lucide-react';

interface ExamenesMedicosOcupacionalesViewProps {
  empleados: Empleado[];
  cargos: Cargo[];
  areas?: AreaOrganizacion[];
  userRole?: Role;
  onUpdateEmpleado?: (empleado: Empleado) => Promise<void> | void;
}

export const ExamenesMedicosOcupacionalesView: React.FC<ExamenesMedicosOcupacionalesViewProps> = ({
  empleados,
  cargos,
  areas = [],
  userRole = 'admin',
  onUpdateEmpleado
}) => {
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroEstadoVigencia, setFiltroEstadoVigencia] = useState<string>('TODOS');
  const [filtroConcepto, setFiltroConcepto] = useState<string>('TODOS');

  // Modales
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalRemisionOpen, setModalRemisionOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Examen seleccionado para detalle o remisión
  const [examenSeleccionado, setExamenSeleccionado] = useState<{
    examen: ExamenOcupacionalEmpleado;
    empleado: Empleado;
    cargo?: Cargo;
    areaNombre?: string;
  } | null>(null);

  // Formulario de Nuevo / Editar Examen
  const [formEmpleadoId, setFormEmpleadoId] = useState<string>(empleados[0]?.id || '');
  const [formExamenId, setFormExamenId] = useState<string | null>(null);
  const [formTipoExamen, setFormTipoExamen] = useState<string>('Periódico');
  const [formFecha, setFormFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formIps, setFormIps] = useState<string>('');
  const [formConcepto, setFormConcepto] = useState<string>('Apto');
  const [formRecomendaciones, setFormRecomendaciones] = useState<string>('');
  const [formRestricciones, setFormRestricciones] = useState<string>('');
  const [formFechaProximo, setFormFechaProximo] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [formMedico, setFormMedico] = useState<string>('');
  const [formLicenciaSst, setFormLicenciaSst] = useState<string>('');
  const [formEnfasis, setFormEnfasis] = useState<string>('Énfasis Osteomuscular y Visual');
  const [formEstado, setFormEstado] = useState<'Programado' | 'Realizado' | 'Pendiente' | 'Cancelado'>('Realizado');
  const [formObservaciones, setFormObservaciones] = useState<string>('');
  const [formPromoverAActivo, setFormPromoverAActivo] = useState<boolean>(true);

  // Sugerencias de IPS para agilizar
  const ipsSugeridas = [
    'IPS Médica Laboral del Oriente SAS',
    'Colsanitas Medicina Ocupacional',
    'Sinergia Salud Laboral',
    'Previsora Ocupacional SAS',
    'IPS Sanitas Ocupacional',
    'Centro Médico Laboral & SST'
  ];

  // Candidatos en etapa de Preingreso
  const candidatosPreingreso = useMemo(() => {
    return empleados.filter(e => e.estadoLaboral === 'Preingreso' || e.laboral?.estado === 'Preingreso');
  }, [empleados]);

  // Aplanar todos los exámenes de todos los empleados
  const todosLosExamenes = useMemo(() => {
    const lista: Array<{
      examen: ExamenOcupacionalEmpleado;
      empleado: Empleado;
      cargo?: Cargo;
      areaNombre: string;
      estadoVigencia: 'Vigente' | 'ProximoVencer' | 'Vencido' | 'Programado' | 'NoAplica';
      diasParaVencer: number | null;
    }> = [];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    empleados.forEach(emp => {
      const cargo = cargos.find(c => c.id === emp.cargoId);
      const area = areas.find(a => a.id === emp.areaId || a.id === emp.laboral?.areaId);
      const areaNombre = emp.laboral?.areaNombre || area?.nombre || 'Operaciones';

      const examenesEmp = emp.sst?.examenesOcupacionales || [];

      // Si el colaborador está en Preingreso y aún no tiene examen en su lista, sintetizar uno programado
      if (examenesEmp.length === 0 && (emp.estadoLaboral === 'Preingreso' || emp.laboral?.estado === 'Preingreso')) {
        lista.push({
          examen: {
            id: `pre-${emp.id}`,
            fecha: emp.laboral?.fechaIngreso || emp.contrato?.inicio || new Date().toISOString().slice(0, 10),
            tipoExamen: 'Ingreso',
            entidadIps: 'IPS Médica Laboral (Por definir)',
            conceptoAptitud: 'Pendiente',
            estado: 'Programado',
            recomendaciones: 'Examen preocupacional requerido para culminar vinculación y contratación.',
            confidencialMedico: true,
            empleadoId: emp.id,
            empleadoNombre: emp.nombre
          },
          empleado: emp,
          cargo,
          areaNombre,
          estadoVigencia: 'Programado',
          diasParaVencer: null
        });
      }

      examenesEmp.forEach(ex => {
        let estadoVigencia: 'Vigente' | 'ProximoVencer' | 'Vencido' | 'Programado' | 'NoAplica' = 'Vigente';
        let diasParaVencer: number | null = null;

        if (ex.estado === 'Programado' || ex.conceptoAptitud === 'Pendiente') {
          estadoVigencia = 'Programado';
        } else if (ex.tipoExamen === 'Egreso' || ex.tipoExamen === 'Retiro') {
          estadoVigencia = 'NoAplica';
        } else if (ex.fechaProximoExamen) {
          const prox = new Date(ex.fechaProximoExamen);
          prox.setHours(0, 0, 0, 0);
          const diffMs = prox.getTime() - hoy.getTime();
          diasParaVencer = Math.round(diffMs / (1000 * 60 * 60 * 24));

          if (diasParaVencer < 0) {
            estadoVigencia = 'Vencido';
          } else if (diasParaVencer <= 60) {
            estadoVigencia = 'ProximoVencer';
          } else {
            estadoVigencia = 'Vigente';
          }
        }

        lista.push({
          examen: ex,
          empleado: emp,
          cargo,
          areaNombre,
          estadoVigencia,
          diasParaVencer
        });
      });
    });

    // Ordenar: primero los programados y próximos a vencer, luego los más recientes
    return lista.sort((a, b) => {
      if (a.estadoVigencia === 'Vencido' && b.estadoVigencia !== 'Vencido') return -1;
      if (b.estadoVigencia === 'Vencido' && a.estadoVigencia !== 'Vencido') return 1;
      if (a.estadoVigencia === 'ProximoVencer' && b.estadoVigencia !== 'ProximoVencer') return -1;
      if (b.estadoVigencia === 'ProximoVencer' && a.estadoVigencia !== 'ProximoVencer') return 1;
      return new Date(b.examen.fecha).getTime() - new Date(a.examen.fecha).getTime();
    });
  }, [empleados, cargos, areas]);

  // Métricas del Dashboard
  const metricas = useMemo(() => {
    let total = todosLosExamenes.length;
    let periodicos = 0;
    let ingresos = 0;
    let retiros = 0;
    let vigentes = 0;
    let proximosVencer = 0;
    let vencidos = 0;
    let programados = 0;

    todosLosExamenes.forEach(item => {
      const tipo = (item.examen.tipoExamen || '').toLowerCase();
      if (tipo.includes('perió') || tipo.includes('perio')) periodicos++;
      if (tipo.includes('ingreso') || tipo.includes('preocup')) ingresos++;
      if (tipo.includes('retiro') || tipo.includes('egreso')) retiros++;

      if (item.estadoVigencia === 'Vigente') vigentes++;
      if (item.estadoVigencia === 'ProximoVencer') proximosVencer++;
      if (item.estadoVigencia === 'Vencido') vencidos++;
      if (item.estadoVigencia === 'Programado') programados++;
    });

    return {
      total,
      periodicos,
      ingresos,
      retiros,
      vigentes,
      proximosVencer,
      vencidos,
      programados
    };
  }, [todosLosExamenes]);

  // Filtrado de la tabla
  const examenesFiltrados = useMemo(() => {
    return todosLosExamenes.filter(item => {
      // Búsqueda libre
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincideNombre = item.empleado.nombre.toLowerCase().includes(q);
        const coincideDoc = item.empleado.documento.includes(q);
        const coincideCargo = (item.cargo?.nombre || '').toLowerCase().includes(q);
        const coincideIps = (item.examen.entidadIps || '').toLowerCase().includes(q);
        const coincideTipo = (item.examen.tipoExamen || '').toLowerCase().includes(q);
        if (!coincideNombre && !coincideDoc && !coincideCargo && !coincideIps && !coincideTipo) {
          return false;
        }
      }

      // Filtro Tipo
      if (filtroTipo !== 'TODOS') {
        const tipoEx = (item.examen.tipoExamen || '').toLowerCase();
        if (filtroTipo === 'Ingreso' && !tipoEx.includes('ingreso')) return false;
        if (filtroTipo === 'Periódico' && !tipoEx.includes('perió') && !tipoEx.includes('perio')) return false;
        if (filtroTipo === 'Retiro' && !tipoEx.includes('retiro') && !tipoEx.includes('egreso')) return false;
        if (filtroTipo === 'Posincapacidad' && !tipoEx.includes('pos') && !tipoEx.includes('reint')) return false;
      }

      // Filtro Vigencia
      if (filtroEstadoVigencia !== 'TODOS') {
        if (filtroEstadoVigencia === 'Vigente' && item.estadoVigencia !== 'Vigente') return false;
        if (filtroEstadoVigencia === 'ProximoVencer' && item.estadoVigencia !== 'ProximoVencer') return false;
        if (filtroEstadoVigencia === 'Vencido' && item.estadoVigencia !== 'Vencido') return false;
        if (filtroEstadoVigencia === 'Programado' && item.estadoVigencia !== 'Programado') return false;
      }

      // Filtro Concepto
      if (filtroConcepto !== 'TODOS') {
        const c = (item.examen.conceptoAptitud || '').toLowerCase();
        if (filtroConcepto === 'Apto' && c !== 'apto') return false;
        if (filtroConcepto === 'Restricciones' && !c.includes('restric')) return false;
        if (filtroConcepto === 'Recomendaciones' && !c.includes('recomenda')) return false;
        if (filtroConcepto === 'NoApto' && !c.includes('no apto')) return false;
      }

      return true;
    });
  }, [todosLosExamenes, busqueda, filtroTipo, filtroEstadoVigencia, filtroConcepto]);

  // Abrir modal de nuevo examen
  const handleAbrirNuevo = (tipoDefault = 'Periódico', empIdDefault?: string) => {
    setFormExamenId(null);
    const empTarget = empIdDefault ? empleados.find(x => x.id === empIdDefault) : (empleados[0] || null);
    setFormEmpleadoId(empTarget?.id || empleados[0]?.id || '');
    setFormTipoExamen(tipoDefault);
    setFormFecha(new Date().toISOString().slice(0, 10));
    setFormIps(ipsSugeridas[0]);
    const esPreingreso = empTarget?.estadoLaboral === 'Preingreso' || empTarget?.laboral?.estado === 'Preingreso';
    setFormConcepto('Apto');
    setFormPromoverAActivo(esPreingreso && tipoDefault === 'Ingreso');
    setFormRecomendaciones('Mantener hábitos posturales saludables, pausas activas cada 2 horas y uso continuo de EPP.');
    setFormRestricciones('');
    const d = new Date();
    d.setFullYear(d.getFullYear() + (tipoDefault === 'Retiro' || tipoDefault === 'Egreso' ? 0 : 1));
    setFormFechaProximo(tipoDefault === 'Retiro' || tipoDefault === 'Egreso' ? '' : d.toISOString().slice(0, 10));
    setFormMedico('Dra. Claudia Marcela Gómez - Esp. SST');
    setFormLicenciaSst('Lic. SST-98234-Bogotá');
    setFormEnfasis('Evaluación osteomuscular, agudeza visual y aptitud física general');
    setFormEstado(tipoDefault === 'Retiro' ? 'Programado' : 'Realizado');
    setFormObservaciones('');
    setModalRegistroOpen(true);
  };

  // Abrir modal para editar
  const handleEditarExamen = (item: { examen: ExamenOcupacionalEmpleado; empleado: Empleado }) => {
    setFormExamenId(item.examen.id.startsWith('pre-') ? null : item.examen.id);
    setFormEmpleadoId(item.empleado.id);
    setFormTipoExamen(item.examen.tipoExamen);
    setFormFecha(item.examen.fecha);
    setFormIps(item.examen.entidadIps || ipsSugeridas[0]);
    setFormConcepto(item.examen.conceptoAptitud === 'Pendiente' ? 'Apto' : (item.examen.conceptoAptitud || 'Apto'));
    setFormRecomendaciones(item.examen.recomendaciones || 'Mantener hábitos posturales saludables y pausas activas cada 2 horas.');
    setFormRestricciones(item.examen.restricciones || '');
    setFormFechaProximo(item.examen.fechaProximoExamen || '');
    setFormMedico(item.examen.medicoEvaluador || 'Dra. Claudia Marcela Gómez - Esp. SST');
    setFormLicenciaSst(item.examen.licenciaSst || 'Lic. SST-98234-Bogotá');
    setFormEnfasis(item.examen.enfasisExamen || 'Énfasis Osteomuscular y Visual');
    setFormEstado(item.examen.estado === 'Programado' ? 'Realizado' : (item.examen.estado || 'Realizado'));
    setFormObservaciones(item.examen.observaciones || '');
    const esPreingreso = item.empleado.estadoLaboral === 'Preingreso' || item.empleado.laboral?.estado === 'Preingreso';
    setFormPromoverAActivo(esPreingreso && item.examen.tipoExamen === 'Ingreso');
    setModalRegistroOpen(true);
  };

  // Guardar Examen
  const handleGuardarExamen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpleadoId) return;

    setGuardando(true);
    try {
      const emp = empleados.find(x => x.id === formEmpleadoId);
      if (!emp) return;

      const examenIdFinal = formExamenId || uid();
      const nuevoExamen: ExamenOcupacionalEmpleado = {
        id: examenIdFinal,
        fecha: formFecha,
        tipoExamen: formTipoExamen,
        entidadIps: formIps.trim() || 'IPS Médica Laboral',
        conceptoAptitud: formConcepto as any,
        recomendaciones: formRecomendaciones.trim(),
        restricciones: formRestricciones.trim() || undefined,
        fechaProximoExamen: formFechaProximo || undefined,
        confidencialMedico: true,
        medicoEvaluador: formMedico.trim() || undefined,
        licenciaSst: formLicenciaSst.trim() || undefined,
        enfasisExamen: formEnfasis.trim() || undefined,
        estado: formEstado,
        observaciones: formObservaciones.trim() || undefined,
        empleadoId: emp.id,
        empleadoNombre: emp.nombre
      };

      const examenesActuales = emp.sst?.examenesOcupacionales || [];
      const existeIdx = examenesActuales.findIndex(ex => ex.id === examenIdFinal);

      let nuevaListaExamenes: ExamenOcupacionalEmpleado[];
      if (existeIdx >= 0) {
        nuevaListaExamenes = examenesActuales.map(ex => ex.id === examenIdFinal ? nuevoExamen : ex);
      } else {
        nuevaListaExamenes = [nuevoExamen, ...examenesActuales];
      }

      // Ordenar por fecha descendente
      nuevaListaExamenes.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      // Actualizar concepto vigente y restricciones activas del empleado
      const ultimoRealizado = nuevaListaExamenes.find(ex => ex.estado !== 'Programado') || nuevoExamen;

      // Verificar si el colaborador en Preingreso pasa a Activo al recibir concepto favorable
      const esPreingreso = emp.estadoLaboral === 'Preingreso' || emp.laboral?.estado === 'Preingreso';
      const esConceptoFavorable = formConcepto === 'Apto' || formConcepto.includes('recomenda') || formConcepto.includes('restric');
      const pasaAActivo = esPreingreso && formTipoExamen === 'Ingreso' && formEstado === 'Realizado' && formPromoverAActivo && esConceptoFavorable;

      const historialEventos = [...(emp.historialLaboral || [])];
      if (pasaAActivo) {
        historialEventos.push({
          id: uid(),
          fechaHora: new Date().toLocaleString('es-CO'),
          usuario: 'SG-SST & Gestión Humana',
          accion: 'CAMBIO_DATOS',
          titulo: 'Aprobación Médica de Ingreso y Pase a Activo',
          motivo: `Certificado médico de aptitud ocupacional emitido por ${formIps.trim() || 'IPS Médica Laboral'}. Concepto: ${formConcepto}.`,
          valorAnterior: 'Estado: Preingreso',
          valorNuevo: 'Estado: Activo'
        });
      }

      const empleadoActualizado: Empleado = {
        ...emp,
        activo: pasaAActivo ? true : emp.activo,
        estadoLaboral: pasaAActivo ? 'Activo' : emp.estadoLaboral,
        laboral: emp.laboral ? {
          ...emp.laboral,
          estado: pasaAActivo ? 'Activo' : emp.laboral.estado
        } : undefined,
        historialLaboral: historialEventos,
        sst: {
          ...emp.sst,
          examenesOcupacionales: nuevaListaExamenes,
          conceptoAptitudVigente: (ultimoRealizado.conceptoAptitud as any) || 'Apto',
          restriccionesActivas: ultimoRealizado.restricciones || 'Ninguna'
        }
      };

      if (onUpdateEmpleado) {
        await onUpdateEmpleado(empleadoActualizado);
      }

      setMensajeExito(
        pasaAActivo
          ? `¡Concepto de ingreso asentado! ${emp.nombre} obtuvo concepto médico favorable (${formConcepto}) y su expediente ha sido promovido de Preingreso a ACTIVO en Gestión Humana y SG-SST.`
          : formExamenId
          ? `Examen de ${emp.nombre} actualizado correctamente.`
          : `Examen de ${formTipoExamen} para ${emp.nombre} registrado con éxito.`
      );
      setTimeout(() => setMensajeExito(null), 5000);
      setModalRegistroOpen(false);
    } catch (err) {
      console.error('Error al guardar examen médico:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar Examen
  const handleEliminarExamen = async (empleadoId: string, examenId: string) => {
    if (!window.confirm('¿Confirma que desea eliminar este registro de examen ocupacional?')) return;
    try {
      const emp = empleados.find(x => x.id === empleadoId);
      if (!emp) return;

      const examenesActuales = emp.sst?.examenesOcupacionales || [];
      const nuevaLista = examenesActuales.filter(ex => ex.id !== examenId);

      const empleadoActualizado: Empleado = {
        ...emp,
        sst: {
          ...emp.sst,
          examenesOcupacionales: nuevaLista
        }
      };

      if (onUpdateEmpleado) {
        await onUpdateEmpleado(empleadoActualizado);
      }

      setMensajeExito('Examen eliminado del expediente.');
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err) {
      console.error('Error al eliminar examen:', err);
    }
  };

  // Marcar como Realizado rápidamente
  const handleMarcarRealizado = async (item: { examen: ExamenOcupacionalEmpleado; empleado: Empleado }) => {
    try {
      const emp = item.empleado;
      const ex = item.examen;
      const examenActualizado: ExamenOcupacionalEmpleado = {
        ...ex,
        estado: 'Realizado',
        fecha: new Date().toISOString().slice(0, 10),
        fechaProximoExamen: ex.tipoExamen === 'Retiro' || ex.tipoExamen === 'Egreso' ? undefined : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10)
      };

      const examenesActuales = emp.sst?.examenesOcupacionales || [];
      const nuevaLista = examenesActuales.map(x => x.id === ex.id ? examenActualizado : x);

      const empleadoActualizado: Empleado = {
        ...emp,
        sst: {
          ...emp.sst,
          examenesOcupacionales: nuevaLista,
          conceptoAptitudVigente: (examenActualizado.conceptoAptitud as any) || 'Apto'
        }
      };

      if (onUpdateEmpleado) {
        await onUpdateEmpleado(empleadoActualizado);
      }

      setMensajeExito(`Examen de ${emp.nombre} marcado como Realizado.`);
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err) {
      console.error('Error al actualizar examen:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alerta de notificación */}
      {mensajeExito && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#18235C] text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-[#18235C]">
                Exámenes Médicos Ocupacionales (SG-SST)
              </h2>
              <p className="text-xs text-[#282829]">
                Monitoreo, trazabilidad y programación periódica de evaluaciones de ingreso, periódicas, reintegro y retiro laboral (Res. 2346 / 2007).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleAbrirNuevo('Ingreso')}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>+ Examen Ingreso</span>
          </button>

          <button
            onClick={() => handleAbrirNuevo('Retiro')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserX className="w-3.5 h-3.5 text-rose-700" />
            <span>+ Examen Retiro</span>
          </button>

          <button
            onClick={() => handleAbrirNuevo('Periódico')}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#00FF00]" />
            <span>Programar Examen Periódico</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de Monitoreo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-[#8FA7D6] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#282829] tracking-wider">Total Registrados</div>
          <div className="text-xl font-bold font-serif text-[#18235C] mt-1">{metricas.total}</div>
          <div className="text-[10px] text-[#282829] mt-0.5">En historial SST</div>
        </div>

        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">Periódicos Vigentes</div>
          <div className="text-xl font-bold font-serif text-emerald-700 mt-1">{metricas.vigentes}</div>
          <div className="text-[10px] text-emerald-800 mt-0.5">Con concepto al día</div>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">Próximos a Vencer</div>
          <div className="text-xl font-bold font-serif text-amber-700 mt-1">{metricas.proximosVencer}</div>
          <div className="text-[10px] text-amber-800 mt-0.5">Menor a 60 días</div>
        </div>

        <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-rose-900 tracking-wider">Vencidos / Requeridos</div>
          <div className="text-xl font-bold font-serif text-rose-700 mt-1">{metricas.vencidos}</div>
          <div className="text-[10px] text-rose-800 mt-0.5">Requieren renovación</div>
        </div>

        <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">De Ingreso</div>
          <div className="text-xl font-bold font-serif text-blue-700 mt-1">{metricas.ingresos}</div>
          <div className="text-[10px] text-blue-800 mt-0.5">Preocupacionales</div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-800 tracking-wider">De Retiro / Egreso</div>
          <div className="text-xl font-bold font-serif text-slate-800 mt-1">{metricas.retiros}</div>
          <div className="text-[10px] text-slate-600 mt-0.5">Al desvincularse</div>
        </div>
      </div>

      {/* Sección Especial: Colaboradores en Preingreso Pendientes de Examen de Ingreso */}
      {candidatosPreingreso.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-200 text-amber-900 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-700" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-2">
                  <span>Colaboradores en Etapa de Preingreso — Gestión de Examen Preocupacional</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white">
                    {candidatosPreingreso.length} en proceso
                  </span>
                </h4>
                <p className="text-[11px] text-amber-900">
                  De acuerdo con la Resolución 2346 de 2007, es requisito obligatorio practicar y asentar el examen médico de ingreso antes del inicio de labores para certificar aptitud psicofísica y habilitar el paso a <strong>Activo</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidatosPreingreso.map(cand => {
              const cCargo = cargos.find(c => c.id === cand.cargoId);
              const examenesIngreso = (cand.sst?.examenesOcupacionales || []).filter(ex =>
                (ex.tipoExamen || '').toLowerCase().includes('ingreso')
              );
              const examenPendiente = examenesIngreso[0];
              const cArea = areas.find(a => a.id === cand.areaId || a.id === cand.laboral?.areaId);

              return (
                <div key={cand.id} className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-[#18235C] block">{cand.nombre}</span>
                      <span className="text-[11px] text-slate-500 font-mono">CC {cand.documento}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Preingreso
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded-lg">
                    <div><strong>Cargo:</strong> {cCargo?.nombre || 'Cargo Asignado'}</div>
                    <div><strong>Área:</strong> {cand.laboral?.areaNombre || cArea?.nombre || 'Operaciones'}</div>
                    <div><strong>Fecha Ingreso Prevista:</strong> {cand.laboral?.fechaIngreso || cand.contrato?.inicio || 'Próxima'}</div>
                    <div className="text-amber-800 font-medium">
                      <strong>Examen:</strong> {examenPendiente ? `${examenPendiente.estado || 'Programado'} (${examenPendiente.entidadIps})` : 'Sin orden registrada'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (examenPendiente) {
                          handleEditarExamen({ examen: examenPendiente, empleado: cand });
                        } else {
                          handleAbrirNuevo('Ingreso', cand.id);
                        }
                      }}
                      className="flex-1 py-1.5 px-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>{examenPendiente?.estado === 'Realizado' ? 'Ver / Modificar Concepto' : 'Asentar Concepto IPS'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const exTarget: ExamenOcupacionalEmpleado = examenPendiente || {
                          id: `pre-${cand.id}`,
                          fecha: new Date().toISOString().slice(0, 10),
                          tipoExamen: 'Ingreso',
                          entidadIps: ipsSugeridas[0],
                          conceptoAptitud: 'Pendiente',
                          confidencialMedico: true,
                          enfasisExamen: 'Énfasis Osteomuscular, Visual y Trabajo en Alturas'
                        };
                        setExamenSeleccionado({
                          examen: exTarget,
                          empleado: cand,
                          cargo: cCargo,
                          areaNombre: cand.laboral?.areaNombre || cArea?.nombre || 'Operaciones'
                        });
                        setModalRemisionOpen(true);
                      }}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs cursor-pointer"
                      title="Imprimir Orden de Remisión Preocupacional"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar colaborador, cédula, cargo o IPS..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs"
            />
          </div>

          <div>
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
            >
              <option value="TODOS">Todos los tipos de examen</option>
              <option value="Ingreso">Exámenes de Ingreso</option>
              <option value="Periódico">Exámenes Periódicos</option>
              <option value="Retiro">Exámenes de Retiro / Egreso</option>
              <option value="Posincapacidad">Posincapacidad / Reintegro</option>
            </select>
          </div>

          <div>
            <select
              value={filtroEstadoVigencia}
              onChange={e => setFiltroEstadoVigencia(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
            >
              <option value="TODOS">Todos los estados de vigencia</option>
              <option value="Vigente">Vigente (Al día)</option>
              <option value="ProximoVencer">Próximo a Vencer (&le; 60 días)</option>
              <option value="Vencido">Vencido (Atención urgente)</option>
              <option value="Programado">Programado</option>
            </select>
          </div>

          <div>
            <select
              value={filtroConcepto}
              onChange={e => setFiltroConcepto(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
            >
              <option value="TODOS">Todos los conceptos médicos</option>
              <option value="Apto">Apto (Sin restricciones)</option>
              <option value="Recomendaciones">Apto con recomendaciones</option>
              <option value="Restricciones">Apto con restricciones</option>
              <option value="NoApto">No Apto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Exámenes */}
      <div className="bg-white rounded-2xl border border-[#8FA7D6] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#8FA7D6]/40 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2">
            <ClipboardCheckIcon className="w-4 h-4 text-[#18235C]" />
            <span>Monitoreo y Trazabilidad de Exámenes Médicos Ocupacionales</span>
            <span className="text-xs font-normal text-[#282829]">({examenesFiltrados.length} registros)</span>
          </h3>
          <span className="text-[11px] text-[#282829] italic">
            Resolución 2346 de 2007 (Ministerio de la Protección Social)
          </span>
        </div>

        {examenesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-[#282829] space-y-3">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold">No se encontraron exámenes médicos con los filtros seleccionados.</p>
            <p className="text-xs text-slate-400">Puede registrar un examen de ingreso, programar uno periódico o de retiro.</p>
            <button
              onClick={() => handleAbrirNuevo('Periódico')}
              className="px-4 py-2 bg-[#18235C] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Programar Nuevo Examen</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#18235C] border-b border-[#8FA7D6]/60 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Colaborador / Documento</th>
                  <th className="p-3">Cargo & Área</th>
                  <th className="p-3">Tipo de Examen</th>
                  <th className="p-3">Fecha Realización</th>
                  <th className="p-3">Entidad IPS</th>
                  <th className="p-3">Concepto Médico</th>
                  <th className="p-3">Vigencia / Próximo</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8FA7D6]/30">
                {examenesFiltrados.map((item, idx) => {
                  const { examen, empleado, cargo, areaNombre, estadoVigencia, diasParaVencer } = item;

                  // Badges de concepto
                  const conceptoStr = examen.conceptoAptitud || 'Apto';
                  let conceptoBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  if (conceptoStr.includes('restric')) {
                    conceptoBadge = 'bg-amber-100 text-amber-900 border-amber-300';
                  } else if (conceptoStr.includes('recomen')) {
                    conceptoBadge = 'bg-blue-100 text-blue-800 border-blue-300';
                  } else if (conceptoStr.includes('No apto')) {
                    conceptoBadge = 'bg-rose-100 text-rose-900 border-rose-300';
                  }

                  // Badge de tipo
                  let tipoBadge = 'bg-purple-100 text-purple-900 border-purple-300';
                  if (examen.tipoExamen === 'Ingreso') tipoBadge = 'bg-blue-100 text-blue-900 border-blue-300';
                  if (examen.tipoExamen === 'Retiro' || examen.tipoExamen === 'Egreso') tipoBadge = 'bg-rose-100 text-rose-900 border-rose-300';
                  if (examen.tipoExamen === 'Posincapacidad') tipoBadge = 'bg-teal-100 text-teal-900 border-teal-300';

                  return (
                    <tr key={examen.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-[#18235C]">{empleado.nombre}</div>
                        <div className="text-[11px] font-mono text-[#282829]">CC {empleado.documento}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{cargo?.nombre || 'Cargo'}</div>
                        <div className="text-[10px] text-[#282829]">{areaNombre}</div>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold inline-block ${tipoBadge}`}>
                          {examen.tipoExamen}
                        </span>
                        {examen.estado === 'Programado' && (
                          <span className="block mt-0.5 text-[10px] text-amber-600 font-bold">
                            (Programado)
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-mono">
                        {examen.fecha}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-[#18235C]">{examen.entidadIps || 'IPS Médica Laboral'}</div>
                        {examen.medicoEvaluador && (
                          <div className="text-[10px] text-[#282829]">{examen.medicoEvaluador}</div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${conceptoBadge}`}>
                          {conceptoStr}
                        </span>
                        {examen.restricciones && (
                          <div className="text-[10px] text-amber-700 truncate max-w-[180px] mt-0.5 font-medium" title={examen.restricciones}>
                            Restr: {examen.restricciones}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        {examen.estado === 'Programado' ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-300 text-[10px] font-bold">
                            Programado para {examen.fecha}
                          </span>
                        ) : estadoVigencia === 'NoAplica' ? (
                          <span className="text-[11px] text-slate-400">Examen finalizado</span>
                        ) : estadoVigencia === 'Vencido' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Vencido ({diasParaVencer !== null ? Math.abs(diasParaVencer) : ''} días)
                            </span>
                            <div className="text-[10px] font-mono text-rose-700">Venció: {examen.fechaProximoExamen}</div>
                          </div>
                        ) : estadoVigencia === 'ProximoVencer' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Vence en {diasParaVencer} días
                            </span>
                            <div className="text-[10px] font-mono text-amber-800">Fecha: {examen.fechaProximoExamen}</div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Vigente
                            </span>
                            <div className="text-[10px] font-mono text-[#282829]">Hasta: {examen.fechaProximoExamen}</div>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Ver detalles completos"
                            onClick={() => {
                              setExamenSeleccionado(item);
                              setModalDetalleOpen(true);
                            }}
                            className="p-1.5 text-[#18235C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            title="Generar Orden de Remisión a IPS para Impresión"
                            onClick={() => {
                              setExamenSeleccionado(item);
                              setModalRemisionOpen(true);
                            }}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            title="Editar examen"
                            onClick={() => handleEditarExamen(item)}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {examen.estado === 'Programado' && (
                            <button
                              title="Marcar como realizado"
                              onClick={() => handleMarcarRealizado(item)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Realizado
                            </button>
                          )}

                          <button
                            title="Eliminar examen"
                            onClick={() => handleEliminarExamen(empleado.id, examen.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL PROGRAMAR / REGISTRAR EXAMEN (MANUAL Y DETALLADO) */}
      {/* ========================================================================= */}
      {modalRegistroOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#18235C] text-white flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-[#00FF00]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-serif text-[#18235C]">
                    {formExamenId ? 'Editar Examen Médico Ocupacional' : 'Programar / Registrar Examen Médico Ocupacional'}
                  </h3>
                  <p className="text-[11px] text-[#282829]">
                    Ingreso manual de IPS, concepto de aptitud psicofísica y recomendaciones laborales.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalRegistroOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarExamen} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Seleccionar Colaborador */}
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Colaborador / Trabajador *</label>
                  <select
                    required
                    value={formEmpleadoId}
                    onChange={e => setFormEmpleadoId(e.target.value)}
                    disabled={Boolean(formExamenId)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  >
                    {empleados.map(emp => {
                      const cNombre = cargos.find(c => c.id === emp.cargoId)?.nombre || 'Cargo';
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre} — CC {emp.documento} ({cNombre})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Tipo de Examen */}
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Examen Médico *</label>
                  <select
                    required
                    value={formTipoExamen}
                    onChange={e => {
                      const tipo = e.target.value;
                      setFormTipoExamen(tipo);
                      if (tipo === 'Retiro' || tipo === 'Egreso') {
                        setFormFechaProximo('');
                      } else {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        setFormFechaProximo(d.toISOString().slice(0, 10));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    <option value="Ingreso">Examen Médico de Ingreso (Preocupacional)</option>
                    <option value="Periódico">Examen Médico Periódico Ocupacional</option>
                    <option value="Retiro">Examen Médico de Egreso / Retiro</option>
                    <option value="Posincapacidad">Examen Posincapacidad / Reintegro</option>
                    <option value="Reubicación">Examen por Reubicación Laboral</option>
                  </select>
                </div>

                {/* Estado del Examen */}
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Estado de la Evaluación *</label>
                  <select
                    value={formEstado}
                    onChange={e => setFormEstado(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    <option value="Realizado">Realizado (Concepto emitido por la IPS)</option>
                    <option value="Programado">Programado (Cita asignada en IPS)</option>
                    <option value="Pendiente">Pendiente (Por autorizar / en trámite)</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    {formEstado === 'Programado' ? 'Fecha Programada *' : 'Fecha de Realización *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formFecha}
                    onChange={e => setFormFecha(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold"
                  />
                </div>

                {/* Nombre de la IPS (Ingreso Manual Libre) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-[#18235C]">
                      Entidad IPS Evaluadora (Nombre de la IPS) *
                    </label>
                    <span className="text-[10px] text-[#282829]">Campo editable libremente</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej: IPS Médica Laboral del Oriente SAS, Colsanitas Ocupacional..."
                    value={formIps}
                    onChange={e => setFormIps(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  />
                  {/* Sugerencias rápidas */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] text-slate-400">Sugerencias:</span>
                    {ipsSugeridas.slice(0, 3).map(ips => (
                      <button
                        key={ips}
                        type="button"
                        onClick={() => setFormIps(ips)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[#18235C] rounded text-[10px] cursor-pointer"
                      >
                        {ips}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Concepto de Aptitud */}
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Concepto de Aptitud Psicofísica *</label>
                  <select
                    value={formConcepto}
                    onChange={e => setFormConcepto(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    <option value="Apto">Apto (Sin restricciones para el cargo)</option>
                    <option value="Apto con recomendaciones">Apto con Recomendaciones (Preventivas)</option>
                    <option value="Apto con restricciones">Apto con Restricciones (Limitaciones funcionales)</option>
                    <option value="No apto">No Apto (Incompatible con riesgos del cargo)</option>
                    <option value="Pendiente">Pendiente de Valoración Complementaria</option>
                  </select>
                </div>

                {/* Fecha Próximo Examen Periódico */}
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha Próximo Examen Periódico</label>
                  <input
                    type="date"
                    value={formFechaProximo}
                    onChange={e => setFormFechaProximo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-[#282829] block mt-0.5">Vacío si es retiro</span>
                </div>

                {/* Opciones de Integración y Pase a Activo para Colaboradores en Preingreso */}
                {(() => {
                  const empTarget = empleados.find(x => x.id === formEmpleadoId);
                  const esPreingreso = empTarget?.estadoLaboral === 'Preingreso' || empTarget?.laboral?.estado === 'Preingreso';
                  if (esPreingreso && formTipoExamen === 'Ingreso') {
                    return (
                      <div className="sm:col-span-2 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Interacción con Gestión Humana & Expediente Digital (Módulo 9 SST)</span>
                        </div>
                        <p className="text-[11px] text-amber-900 leading-relaxed">
                          El colaborador <strong>{empTarget?.nombre}</strong> está en etapa de <strong>Preingreso</strong>. Al registrar el concepto emitido por la IPS, se actualizará automáticamente la información de SST en su expediente digital.
                        </p>
                        <label className="flex items-center gap-2.5 pt-1 cursor-pointer bg-white p-2.5 rounded-lg border border-amber-200">
                          <input
                            type="checkbox"
                            checked={formPromoverAActivo}
                            onChange={e => setFormPromoverAActivo(e.target.checked)}
                            className="w-4 h-4 text-[#18235C] rounded"
                          />
                          <span className="text-xs font-bold text-[#18235C]">
                            Promover automáticamente el estado laboral de "Preingreso" a "Activo" al asentar concepto médico favorable.
                          </span>
                        </label>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Recomendaciones Ocupacionales */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">
                    Recomendaciones Médicas Ocupacionales emitidas por la IPS *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Escriba aquí las recomendaciones preventivas, ergonómicas, pausas activas, hábitos de vida saludable o cuidados posturales..."
                    value={formRecomendaciones}
                    onChange={e => setFormRecomendaciones(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                {/* Restricciones Médicas / Laborales */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">
                    Restricciones Laborales (si aplican)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: No realizar levantamiento de cargas mayores a 15 kg, evitar posturas forzadas de rodilla, uso de lentes correctivos durante conducción..."
                    value={formRestricciones}
                    onChange={e => setFormRestricciones(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                {/* Médico Evaluador */}
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Médico Especialista SST</label>
                  <input
                    type="text"
                    placeholder="Dra. Claudia Marcela Gómez"
                    value={formMedico}
                    onChange={e => setFormMedico(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                {/* Licencia SST */}
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Licencia de Salud Ocupacional / SST</label>
                  <input
                    type="text"
                    placeholder="Lic. SST-98234-Bogotá"
                    value={formLicenciaSst}
                    onChange={e => setFormLicenciaSst(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>

                {/* Énfasis del examen */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">Énfasis del Examen Médico</label>
                  <input
                    type="text"
                    placeholder="Énfasis osteomuscular, agudeza visual, audiometría tonal, trabajo en alturas..."
                    value={formEnfasis}
                    onChange={e => setFormEnfasis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#8FA7D6]/40">
                <button
                  type="button"
                  onClick={() => setModalRegistroOpen(false)}
                  className="px-4 py-2 border border-[#8FA7D6] text-slate-700 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00FF00]" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#00FF00]" />
                      <span>{formExamenId ? 'Actualizar Examen' : 'Guardar y Registrar Examen'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DETALLE COMPLETO DEL EXAMEN */}
      {/* ========================================================================= */}
      {modalDetalleOpen && examenSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-xl w-full p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#18235C] text-white flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#00FF00]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-serif text-[#18235C]">
                    Ficha de Examen Médico Ocupacional
                  </h3>
                  <p className="text-[11px] text-[#282829]">
                    {examenSeleccionado.empleado.nombre} — {examenSeleccionado.examen.tipoExamen}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalDetalleOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Colaborador</span>
                  <span className="font-bold text-[#18235C]">{examenSeleccionado.empleado.nombre}</span>
                  <span className="text-[11px] text-slate-500 block font-mono">CC {examenSeleccionado.empleado.documento}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Cargo & Área</span>
                  <span className="font-bold text-slate-800">{examenSeleccionado.cargo?.nombre || 'Cargo'}</span>
                  <span className="text-[11px] text-slate-500 block">{examenSeleccionado.areaNombre}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Fecha Evaluación</span>
                  <span className="font-mono font-bold text-slate-800">{examenSeleccionado.examen.fecha}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Concepto de Aptitud</span>
                  <span className="font-bold text-emerald-700">{examenSeleccionado.examen.conceptoAptitud}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#18235C] block mb-1">Entidad IPS y Evaluador:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                  <strong>{examenSeleccionado.examen.entidadIps}</strong>
                  {examenSeleccionado.examen.medicoEvaluador && ` • ${examenSeleccionado.examen.medicoEvaluador}`}
                  {examenSeleccionado.examen.licenciaSst && ` (${examenSeleccionado.examen.licenciaSst})`}
                </p>
              </div>

              <div>
                <span className="font-bold text-[#18235C] block mb-1">Recomendaciones Ocupacionales:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap">
                  {examenSeleccionado.examen.recomendaciones || 'Sin recomendaciones particulares registradas.'}
                </p>
              </div>

              {examenSeleccionado.examen.restricciones && (
                <div>
                  <span className="font-bold text-amber-900 block mb-1">Restricciones Laborales Activas:</span>
                  <p className="p-2.5 bg-amber-50 rounded-lg border border-amber-300 text-amber-900 whitespace-pre-wrap font-medium">
                    {examenSeleccionado.examen.restricciones}
                  </p>
                </div>
              )}

              {examenSeleccionado.examen.fechaProximoExamen && (
                <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                  <span className="font-bold">Fecha programada para próximo examen:</span>
                  <span className="font-mono font-bold">{examenSeleccionado.examen.fechaProximoExamen}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#8FA7D6]/40">
              <button
                type="button"
                onClick={() => {
                  setModalDetalleOpen(false);
                  setModalRemisionOpen(true);
                }}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-900 border border-blue-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Orden de Remisión</span>
              </button>

              <button
                type="button"
                onClick={() => setModalDetalleOpen(false)}
                className="px-4 py-1.5 bg-[#18235C] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ORDEN DE REMISIÓN PARA IMPRESIÓN OFICIAL */}
      {/* ========================================================================= */}
      {modalRemisionOpen && examenSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in my-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-[#18235C] uppercase tracking-wider">
                Vista Previa de Orden de Remisión a IPS
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>Imprimir Orden</span>
                </button>
                <button
                  onClick={() => setModalRemisionOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hoja de Impresión */}
            <div className="p-6 border-2 border-slate-300 rounded-xl space-y-4 text-xs bg-slate-50/40">
              <div className="flex items-center justify-between border-b-2 border-slate-300 pb-3">
                <div>
                  <h2 className="font-bold text-base font-serif text-[#18235C]">B GROUP INGENIERIA S.A.S.</h2>
                  <p className="text-[11px] text-slate-600">NIT: 901.458.789-2 • Sistema de Gestión SG-SST</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Orden Médica Ocupacional</div>
                  <div className="font-mono font-bold text-xs text-[#18235C]">ORD-SST-{examenSeleccionado.examen.id.slice(-6).toUpperCase()}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{examenSeleccionado.examen.fecha}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Trabajador / Evaluado</span>
                  <span className="font-bold text-sm text-[#18235C]">{examenSeleccionado.empleado.nombre}</span>
                  <span className="text-xs text-slate-600 block font-mono">CC {examenSeleccionado.empleado.documento}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Cargo & Dependencia</span>
                  <span className="font-bold text-sm text-slate-800">{examenSeleccionado.cargo?.nombre || 'Cargo'}</span>
                  <span className="text-xs text-slate-600 block">{examenSeleccionado.areaNombre}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#18235C]">Tipo de Evaluación Requerida:</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-[#18235C] text-white text-[11px]">
                    Examen Médico de {examenSeleccionado.examen.tipoExamen}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Entidad IPS Solicitada:</span>
                  <span className="ml-2 font-semibold text-slate-900">{examenSeleccionado.examen.entidadIps}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Énfasis Clínico Solicitado:</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {examenSeleccionado.examen.enfasisExamen || 'Evaluación osteomuscular, visual y aptitud física laboral general.'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                <strong>Nota de Confidencialidad y Cumplimiento Legal:</strong> Esta orden se emite de acuerdo con la Resolución 2346 de 2007. La IPS evaluadora debe remitir únicamente el <em>Certificado Médico de Aptitud Ocupacional</em> con las recomendaciones y restricciones pertinentes, salvaguardando la confidencialidad de la historia clínica ocupacional.
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="border-t border-slate-400 text-center pt-1">
                  <span className="font-bold text-slate-800 block text-xs">Responsable de SG-SST</span>
                  <span className="text-[10px] text-slate-500">Gestión Humana y Salud en el Trabajo</span>
                </div>
                <div className="border-t border-slate-400 text-center pt-1">
                  <span className="font-bold text-slate-800 block text-xs">Firma del Colaborador</span>
                  <span className="text-[10px] text-slate-500">CC {examenSeleccionado.empleado.documento}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalRemisionOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon
function ClipboardCheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}
