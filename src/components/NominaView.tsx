import React, { useState, useMemo, useEffect } from 'react';
import {
  Cargo,
  Empleado,
  LiquidacionEmpleadoNomina,
  NovedadNominaEmpleado,
  ParametrosLegalesNomina,
  PeriodoNomina,
  Role,
  SimulacionLiquidacionDefinitiva
} from '../types';
import {
  PARAMETROS_COLOMBIA_2026,
  calcularLiquidacionEmpleado,
  crearPeriodoNomina,
  formatMonedaCOP,
  guardarParametrosConfigurados,
  obtenerNombreMes,
  obtenerParametrosConfigurados,
  parseSalarioNumerico,
  restablecerParametrosLegales,
  simularLiquidacionDefinitiva
} from '../services/payrollEngine';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Download,
  Edit3,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Lock,
  Percent,
  PiggyBank,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  User,
  Users,
  Palmtree,
  Database,
  X,
  Search,
  ChevronDown
} from 'lucide-react';
import { guardarPeriodoNominaLoteFB } from '../lib/firebase';
import { GestionNovedadesView } from './GestionNovedadesView';
import { ControlVacacionesView } from './ControlVacacionesView';
import { ReservasProvisionesView } from './ReservasProvisionesView';
import { ParametrosNominaView } from './ParametrosNominaView';
import { NominaAperturaPeriodoModal } from './NominaAperturaPeriodoModal';
import { SimuladorLiquidacionContratoView } from './SimuladorLiquidacionContratoView';

interface NominaViewProps {
  empleados: Empleado[];
  cargos: Cargo[];
  userRole: Role;
  currentEmpleadoId?: string;
}

export function NominaView({
  empleados,
  cargos,
  userRole,
  currentEmpleadoId
}: NominaViewProps) {
  const [activeTab, setActiveTab] = useState<'periodo' | 'provisiones' | 'novedades' | 'vacaciones' | 'desprendible' | 'liquidacion' | 'parametros'>('periodo');

  // Parámetros legales configurados (con persistencia local y base 2026)
  const [parametrosLegales, setParametrosLegales] = useState<ParametrosLegalesNomina>(() => {
    return obtenerParametrosConfigurados();
  });

  // Modal para edición de parámetros legales
  const [modalParametrosAbierto, setModalParametrosAbierto] = useState(false);
  const [formParametros, setFormParametros] = useState<ParametrosLegalesNomina>(() => {
    return obtenerParametrosConfigurados();
  });

  // GESTIÓN DINÁMICA DE TODOS LOS PERÍODOS DE TODOS LOS MESES Y AÑOS
  const [periodos, setPeriodos] = useState<PeriodoNomina[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bgroup_nomina_periodos');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error('Error cargando períodos de nómina', e);
        }
      }
    }
    // Por defecto, inicializamos los 12 meses del año 2026
    const periodosIniciales: PeriodoNomina[] = [];
    for (let m = 1; m <= 12; m++) {
      const p = crearPeriodoNomina(2026, m, 'Mensual');
      if (m < 3) p.estado = 'Pagada';
      else if (m === 3) p.estado = 'Liquidada';
      else p.estado = 'Borrador';
      periodosIniciales.push(p);
    }
    return periodosIniciales;
  });

  // Código del período activo seleccionado
  const [selectedPeriodoCodigo, setSelectedPeriodoCodigo] = useState<string>('2026-03');

  // Período activo derivado
  const periodoActivo: PeriodoNomina = useMemo(() => {
    const encontrado = periodos.find(p => p.codigoPeriodo === selectedPeriodoCodigo);
    if (encontrado) return encontrado;
    return periodos[0] || crearPeriodoNomina(2026, 3, 'Mensual');
  }, [periodos, selectedPeriodoCodigo]);

  // Persistir períodos en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bgroup_nomina_periodos', JSON.stringify(periodos));
    }
  }, [periodos]);

  // Estado de novedades organizado POR PERÍODO: { [codigoPeriodo]: { [empleadoId]: NovedadNominaEmpleado } }
  const [novedadesPorPeriodo, setNovedadesPorPeriodo] = useState<Record<string, Record<string, NovedadNominaEmpleado>>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bgroup_novedades_por_periodo');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) {
          console.error('Error cargando novedades por período', e);
        }
      }
    }
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      return {};
    }
    return {
      '2026-03': {
        e6: {
          diasTrabajados: 30,
          horasExtrasDiurnas: 6,
          horasExtrasNocturnas: 4,
          horasFestivasDiurnas: 0,
          horasFestivasNocturnas: 0,
          recargoNocturnoOrdinario: 12,
          bonificacionesSalariales: 200000,
          bonificacionesNoSalariales: 0,
          comisiones: 0,
          incapacidadDias: 0,
          licenciaRemuneradaDias: 0,
          prestamosYDeducciones: 50000,
          otrasDeduccionesTexto: 'Fondo de empleados'
        },
        e5: {
          diasTrabajados: 30,
          horasExtrasDiurnas: 0,
          horasExtrasNocturnas: 0,
          horasFestivasDiurnas: 0,
          horasFestivasNocturnas: 0,
          recargoNocturnoOrdinario: 0,
          bonificacionesSalariales: 0,
          bonificacionesNoSalariales: 0,
          comisiones: 850000,
          incapacidadDias: 0,
          licenciaRemuneradaDias: 0,
          prestamosYDeducciones: 0
        }
      }
    };
  });

  // Persistir novedades por período
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bgroup_novedades_por_periodo', JSON.stringify(novedadesPorPeriodo));
    }
  }, [novedadesPorPeriodo]);

  // Novedades activas correspondientes al período seleccionado
  const novedadesMap = useMemo(() => {
    return novedadesPorPeriodo[selectedPeriodoCodigo] || {};
  }, [novedadesPorPeriodo, selectedPeriodoCodigo]);

  // Modal para aperturar un nuevo período (cualquier mes y año)
  const [modalAperturaPeriodoAbierto, setModalAperturaPeriodoAbierto] = useState(false);
  const [nuevoPeriodoAno, setNuevoPeriodoAno] = useState<number>(2026);
  const [nuevoPeriodoMes, setNuevoPeriodoMes] = useState<number>(new Date().getMonth() + 1);
  const [nuevoPeriodoTipo, setNuevoPeriodoTipo] = useState<'Mensual' | 'Primera Quincena' | 'Segunda Quincena'>('Mensual');
  const [copiarNovedadesDeActual, setCopiarNovedadesDeActual] = useState<boolean>(false);

  // Empleado seleccionado para editar novedades en modal o panel
  const [empleadoEditandoNovedad, setEmpleadoEditandoNovedad] = useState<string | null>(null);

  // Empleado seleccionado para ver desprendible
  const [empleadoDesprendibleId, setEmpleadoDesprendibleId] = useState<string>(empleados[0]?.id || 'e1');

  // Paginación y búsqueda para planilla de nómina (lotes de 25 colaboradores)
  const [filtroLiquidaciones, setFiltroLiquidaciones] = useState('');
  const [limiteLiquidaciones, setLimiteLiquidaciones] = useState(25);

  // Handler para crear/aperturar un nuevo período
  const handleAperturarPeriodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nuevo = crearPeriodoNomina(nuevoPeriodoAno, nuevoPeriodoMes, nuevoPeriodoTipo);

    // Verificar si ya existe
    const existe = periodos.some(p => p.codigoPeriodo === nuevo.codigoPeriodo);
    if (!existe) {
      setPeriodos(prev => {
        const ordenados = [...prev, nuevo].sort((a, b) => {
          if (a.ano !== b.ano) return a.ano - b.ano;
          if (a.mes !== b.mes) return a.mes - b.mes;
          return a.tipo.localeCompare(b.tipo);
        });
        return ordenados;
      });
    }

    // Copiar novedades si se solicitó
    if (copiarNovedadesDeActual && novedadesPorPeriodo[selectedPeriodoCodigo]) {
      setNovedadesPorPeriodo(prev => ({
        ...prev,
        [nuevo.codigoPeriodo]: { ...prev[selectedPeriodoCodigo] }
      }));
    }

    setSelectedPeriodoCodigo(nuevo.codigoPeriodo);
    setModalAperturaPeriodoAbierto(false);
  };

  // Handler para aperturar en lote los 12 meses de un año
  const handleGenerarAnoCompleto = (ano: number) => {
    const nuevos: PeriodoNomina[] = [];
    for (let m = 1; m <= 12; m++) {
      const p = crearPeriodoNomina(ano, m, 'Mensual');
      nuevos.push(p);
    }

    setPeriodos(prev => {
      const codigosExistentes = new Set(prev.map(p => p.codigoPeriodo));
      const aAgregar = nuevos.filter(n => !codigosExistentes.has(n.codigoPeriodo));
      const todos = [...prev, ...aAgregar].sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        if (a.mes !== b.mes) return a.mes - b.mes;
        return a.tipo.localeCompare(b.tipo);
      });
      return todos;
    });

    setSelectedPeriodoCodigo(`${ano}-01`);
    setModalAperturaPeriodoAbierto(false);
  };

  // Navegar al mes anterior o siguiente
  const handleNavegarPeriodo = (direccion: 'anterior' | 'siguiente') => {
    const indexActual = periodos.findIndex(p => p.codigoPeriodo === selectedPeriodoCodigo);
    if (indexActual === -1) return;

    if (direccion === 'anterior' && indexActual > 0) {
      setSelectedPeriodoCodigo(periodos[indexActual - 1].codigoPeriodo);
    } else if (direccion === 'siguiente' && indexActual < periodos.length - 1) {
      setSelectedPeriodoCodigo(periodos[indexActual + 1].codigoPeriodo);
    }
  };

  const [sincronizandoLote, setSincronizandoLote] = useState(false);
  const [mensajeSincronizacion, setMensajeSincronizacion] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // 1. Liquidaciones automáticas calculadas de todos los empleados
  const liquidaciones = useMemo(() => {
    return empleados.map(emp => {
      const cargo = cargos.find(c => c.id === emp.cargoId);
      const cargoNombre = cargo ? cargo.nombre : 'Sin cargo asignado';
      const cargoCodigo = cargo ? cargo.ficha.identificacion.codigo : '';
      const novedades = novedadesMap[emp.id] || {
        diasTrabajados: 30,
        horasExtrasDiurnas: 0,
        horasExtrasNocturnas: 0,
        horasFestivasDiurnas: 0,
        horasFestivasNocturnas: 0,
        recargoNocturnoOrdinario: 0,
        bonificacionesSalariales: 0,
        bonificacionesNoSalariales: 0,
        comisiones: 0,
        incapacidadDias: 0,
        licenciaRemuneradaDias: 0,
        prestamosYDeducciones: 0
      };

      return calcularLiquidacionEmpleado(emp, cargoNombre, cargoCodigo, novedades, parametrosLegales);
    });
  }, [empleados, cargos, novedadesMap, parametrosLegales]);

  // Persistencia atómica de nómina mediante writeBatch en Firestore
  const ejecutarGuardadoNominaLoteAtómico = async (estadoPeriodo?: 'Borrador' | 'Liquidada' | 'Pagada') => {
    if (!periodoActivo) return;
    setSincronizandoLote(true);
    setMensajeSincronizacion(null);
    try {
      const periodoFinal: PeriodoNomina = {
        ...periodoActivo,
        estado: estadoPeriodo || periodoActivo.estado,
        liquidaciones
      };
      const res = await guardarPeriodoNominaLoteFB(periodoFinal, liquidaciones);
      if (res.success) {
        setMensajeSincronizacion({
          tipo: 'success',
          texto: `Lote atómico consolidado (writeBatch): ${res.guardadosCount} colillas individuales y período ${periodoActivo.codigoPeriodo} sellados en Firestore sin inconsistencias.`
        });
        setTimeout(() => setMensajeSincronizacion(null), 6000);
      } else {
        setMensajeSincronizacion({
          tipo: 'error',
          texto: res.error || 'Error al persistir lote atómico en Firestore.'
        });
      }
    } catch (err: any) {
      setMensajeSincronizacion({
        tipo: 'error',
        texto: err?.message || 'Error de conexión al persistir nómina.'
      });
    } finally {
      setSincronizandoLote(false);
    }
  };

  // Handler para cambiar de estado el período actual (Borrador -> Liquidada -> Pagada) con commit atómico
  const handleCambiarEstadoPeriodo = async (nuevoEstado: 'Borrador' | 'Liquidada' | 'Pagada') => {
    setPeriodos(prev =>
      prev.map(p => {
        if (p.codigoPeriodo === selectedPeriodoCodigo) {
          return { ...p, estado: nuevoEstado };
        }
        return p;
      })
    );
    await ejecutarGuardadoNominaLoteAtómico(nuevoEstado);
  };

  // VISTA ESPECIALIZADA PARA EL ROL EMPLEADO: Consulta y descarga exclusiva de su propio desprendible
  if (userRole === 'empleado') {
    const miEmpleadoId = currentEmpleadoId || 'e6';
    const miLiquidacion = liquidaciones.find(l => l.empleadoId === miEmpleadoId) || liquidaciones[0];

    if (!miLiquidacion) {
      return (
        <div className="bg-white rounded-2xl border border-[#8FA7D6] p-10 text-center max-w-lg mx-auto space-y-3 shadow-xs">
          <Receipt className="w-12 h-12 text-[#8FA7D6] mx-auto opacity-70" />
          <h3 className="font-bold text-base text-[#18235C]">No hay liquidación de nómina activa</h3>
          <p className="text-xs text-[#282829]/70 leading-relaxed">
            La base de datos de nómina se encuentra en estado limpio para producción. En cuanto el área de Gestión Humana configure los colaboradores y cierre el período, aquí aparecerán sus colillas de pago oficiales.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Banner Superior del Colaborador */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8FA7D6]/20 text-[#18235C] border border-[#8FA7D6] flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-[#18235C]" />
                Portal del Colaborador • Código Sustantivo del Trabajo
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8FA7D6]/10 text-[#282829] border border-[#8FA7D6]">
                Artículo 139 CST
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#18235C]">
              Mi Desprendible de Pago de Nómina
            </h1>
            <p className="text-xs text-[#282829] mt-0.5">
              Consulte y descargue su colilla individual con el desglose oficial de devengados, horas extras, aportes a salud (4%), pensión (4%) y neto transferido a su cuenta.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#FFFFFF] px-3 py-1.5 rounded-xl border border-[#8FA7D6] text-xs">
              <span className="text-[#282829] font-bold">Período:</span>
              <select
                value={selectedPeriodoCodigo}
                onChange={e => setSelectedPeriodoCodigo(e.target.value)}
                className="bg-transparent font-bold text-[#18235C] focus:outline-none cursor-pointer"
              >
                {periodos.map(p => (
                  <option key={p.codigoPeriodo} value={p.codigoPeriodo}>
                    {p.nombre} ({p.tipo}) - [{p.estado}]
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-[#00FF00]" />
              <span>Imprimir / Descargar PDF</span>
            </button>
          </div>
        </div>

        {/* Formato Oficial de Colilla de Pago Colombiana */}
        {miLiquidacion && (
          <div className="bg-[#FFFFFF] rounded-2xl border-2 border-[#8FA7D6] p-6 sm:p-8 max-w-4xl mx-auto shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Encabezado Corporativo Legal */}
            <div className="border-b-2 border-[#18235C] pb-4 mb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-xl font-black text-[#18235C] tracking-tight">
                    B GROUP INGENIERIA S.A.S.
                  </h2>
                  <div className="text-xs text-[#282829] font-medium">
                    NIT: 900.995.99-2 | Actividad Económica: Ingeniería, Telecomunicaciones & Consultoría
                  </div>
                  <div className="text-xs text-[#282829]/70">
                    Dirección: Carrera 7 # 71-21 Torre A, Piso 9 • Bogotá D.C., Colombia
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs font-bold px-3 py-1 bg-[#18235C] rounded-lg text-white inline-block mb-1 shadow-xs">
                    COMPROBANTE OFICIAL DE PAGO DE NÓMINA
                  </div>
                  <div className="text-xs text-[#282829]">
                    Período: <strong className="text-[#18235C]">{periodoActivo.fechaInicio} al {periodoActivo.fechaFin} ({periodoActivo.nombre})</strong>
                  </div>
                  <div className="text-xs text-[#282829]">
                    Fecha de pago: <strong className="text-[#18235C]">{periodoActivo.fechaPago}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del Trabajador */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-white rounded-xl border border-[#8FA7D6] text-xs mb-5">
              <div>
                <span className="text-[#282829]/70 block text-[10px] uppercase font-bold">Colaborador</span>
                <span className="font-bold text-[#18235C]">{miLiquidacion.empleadoNombre}</span>
              </div>
              <div>
                <span className="text-[#282829]/70 block text-[10px] uppercase font-bold">Identificación</span>
                <span className="font-medium text-[#282829]">C.C. {miLiquidacion.empleadoDocumento}</span>
              </div>
              <div>
                <span className="text-[#282829]/70 block text-[10px] uppercase font-bold">Cargo</span>
                <span className="font-medium text-[#282829]">{miLiquidacion.cargoNombre}</span>
              </div>
              <div>
                <span className="text-[#282829]/70 block text-[10px] uppercase font-bold">Tipo Contrato</span>
                <span className="font-medium text-[#282829]">{miLiquidacion.tipoContrato}</span>
              </div>
              <div>
                <span className="text-[#282829]/70 block text-[10px] uppercase font-bold">Salario Básico</span>
                <span className="font-bold text-[#18235C]">{formatMonedaCOP(miLiquidacion.salarioBasicoPactado)}</span>
              </div>
              <div>
                <span className="text-[#282829]/70 block text-[10px] uppercase font-bold">Días Liquidados</span>
                <span className="font-medium text-[#282829]">{miLiquidacion.novedades.diasTrabajados} días</span>
              </div>
              <div>
                <span className="text-[#282829]/70 block text-[10px] uppercase font-bold">Clase Riesgo ARL</span>
                <span className="font-medium text-[#282829]">Clase {miLiquidacion.claseRiesgoARL} ({(miLiquidacion.aportesEmpresa.tarifaArlAplicada * 100).toFixed(3)}%)</span>
              </div>
              <div>
                <span className="text-[#282829]/70 block text-[10px] uppercase font-bold">Cuenta de Abono</span>
                <span className="font-medium text-[#282829]">Bancolombia Ahorros ***4410</span>
              </div>
            </div>

            {/* Tablas lado a lado: Devengados vs Deducciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Devengados */}
              <div className="border border-[#8FA7D6] rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-[#18235C] text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wider flex justify-between">
                  <span>Conceptos Devengados</span>
                  <span>Valor ($)</span>
                </div>
                <div className="p-3 space-y-2 text-xs divide-y divide-[#8FA7D6]/20 bg-white">
                  <div className="flex justify-between pt-1">
                    <span className="text-[#282829]">Sueldo básico proporcional ({miLiquidacion.novedades.diasTrabajados} días):</span>
                    <span className="font-bold text-[#18235C]">{formatMonedaCOP(miLiquidacion.devengados.salarioProporcional)}</span>
                  </div>
                  {miLiquidacion.tieneDerechoAuxilioTransporte && (
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Auxilio Legal de Transporte:</span>
                      <span className="font-bold text-[#18235C]">{formatMonedaCOP(miLiquidacion.devengados.auxilioTransporte)}</span>
                    </div>
                  )}
                  {miLiquidacion.devengados.valorHorasExtrasYRecargos > 0 && (
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Horas extras y recargos nocturnos:</span>
                      <span className="font-bold text-amber-700">+{formatMonedaCOP(miLiquidacion.devengados.valorHorasExtrasYRecargos)}</span>
                    </div>
                  )}
                  {miLiquidacion.devengados.bonificacionesYComisiones > 0 && (
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Comisiones y bonos salariales:</span>
                      <span className="font-bold text-emerald-700">+{formatMonedaCOP(miLiquidacion.devengados.bonificacionesYComisiones)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-[#8FA7D6]/15 p-3 border-t border-[#8FA7D6] flex justify-between text-xs font-bold text-[#18235C]">
                  <span>TOTAL DEVENGADO:</span>
                  <span>{formatMonedaCOP(miLiquidacion.devengados.totalDevengado)}</span>
                </div>
              </div>

              {/* Deducciones */}
              <div className="border border-[#8FA7D6] rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-rose-800 text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wider flex justify-between">
                  <span>Deducciones del Trabajador</span>
                  <span>Valor ($)</span>
                </div>
                <div className="p-3 space-y-2 text-xs divide-y divide-[#8FA7D6]/20 bg-white">
                  <div className="flex justify-between pt-1">
                    <span className="text-[#282829]">Aporte obligatorio Salud (4% IBC):</span>
                    <span className="font-bold text-rose-700">-{formatMonedaCOP(miLiquidacion.deducciones.saludEmpleado)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-[#282829]">Aporte obligatorio Pensión (4% IBC):</span>
                    <span className="font-bold text-rose-700">-{formatMonedaCOP(miLiquidacion.deducciones.pensionEmpleado)}</span>
                  </div>
                  {miLiquidacion.deducciones.fondoSolidaridadPensional > 0 && (
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Fondo de Solidaridad Pensional (FSP):</span>
                      <span className="font-bold text-rose-700">-{formatMonedaCOP(miLiquidacion.deducciones.fondoSolidaridadPensional)}</span>
                    </div>
                  )}
                  {miLiquidacion.deducciones.retencionFuente > 0 && (
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Retención en la fuente (Art. 383 E.T.):</span>
                      <span className="font-bold text-rose-700">-{formatMonedaCOP(miLiquidacion.deducciones.retencionFuente)}</span>
                    </div>
                  )}
                  {miLiquidacion.deducciones.prestamosOtrasDeducciones > 0 && (
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Préstamos / Fondo de Empleados:</span>
                      <span className="font-bold text-rose-700">-{formatMonedaCOP(miLiquidacion.deducciones.prestamosOtrasDeducciones)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-rose-50 p-3 border-t border-[#8FA7D6] flex justify-between text-xs font-bold text-rose-800">
                  <span>TOTAL DEDUCCIONES:</span>
                  <span>-{formatMonedaCOP(miLiquidacion.deducciones.totalDeducciones)}</span>
                </div>
              </div>
            </div>

            {/* Gran Total Neto a Pagar en Barra Destacada */}
            <div className="bg-[#18235C] text-white p-5 rounded-2xl flex items-center justify-between mb-6 shadow-md border border-[#101740]">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-[#8FA7D6]">
                  Neto Efectivo Transferido a su Cuenta
                </div>
                <div className="text-xs text-white/80">
                  Total Devengado menos Deducciones Legales
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#00FF00]">
                {formatMonedaCOP(miLiquidacion.netoAPagar)}
              </div>
            </div>

            {/* Sección Informativa: Aportes Empleador & Provisiones Sociales (Transparencia CST) */}
            <div className="p-3.5 bg-white rounded-xl border border-[#8FA7D6] text-[11px] mb-6">
              <div className="font-bold text-[#18235C] mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00FF00]" />
                Aportes y Provisiones Patronales asumidos por B GROUP INGENIERIA S.A.S. (Beneficio social, no deducible de su sueldo):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#282829]">
                <div>
                  Pensión Empleador (12%): <strong className="text-[#18235C]">{formatMonedaCOP(miLiquidacion.aportesEmpresa.pensionEmpleador)}</strong>
                </div>
                <div>
                  ARL Riesgo {miLiquidacion.claseRiesgoARL}: <strong className="text-[#18235C]">{formatMonedaCOP(miLiquidacion.aportesEmpresa.arl)}</strong>
                </div>
                <div>
                  Caja Compensación (4%): <strong className="text-[#18235C]">{formatMonedaCOP(miLiquidacion.aportesEmpresa.cajaCompensacion)}</strong>
                </div>
                <div>
                  Cesantías & Prima (16.66%): <strong className="text-[#18235C]">{formatMonedaCOP(miLiquidacion.provisiones.cesantias + miLiquidacion.provisiones.primaServicios)}</strong>
                </div>
              </div>
            </div>

            {/* Firmas de Constancia Legal */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#8FA7D6] text-xs">
              <div className="text-center">
                <div className="w-48 mx-auto border-b border-[#18235C] pb-1 mb-1 font-bold text-xs text-[#18235C]">
                  B GROUP INGENIERIA S.A.S.
                </div>
                <div className="text-[11px] text-[#282829]">Empleador / Dirección Gestión Humana</div>
                <div className="text-[10px] text-[#282829]/60">Comprobante generado electrónicamente</div>
              </div>
              <div className="text-center">
                <div className="w-48 mx-auto border-b border-[#18235C] pb-1 mb-1 font-bold text-xs text-[#18235C]">
                  {miLiquidacion.empleadoNombre}
                </div>
                <div className="text-[11px] text-[#282829]">Firma del Colaborador Receptor</div>
                <div className="text-[10px] text-[#18235C] font-bold">C.C. {miLiquidacion.empleadoDocumento} (Verificado)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. REGLA DE SEGURIDAD Y ACCESO: Solo Administrador para la suite general de liquidación
  if (userRole !== 'admin') {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#18235C] text-white flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-8 h-8 text-[#00FF00]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold mb-3 border border-rose-200">
          <ShieldAlert className="w-3.5 h-3.5" />
          Módulo de Acceso Restringido
        </div>
        <h2 className="text-xl font-black text-[#18235C] mb-2">
          Nómina y Prestaciones Sociales Confidenciales
        </h2>
        <p className="text-sm text-[#282829] max-w-lg mb-6 leading-relaxed">
          Este módulo de configuración y liquidación masiva está reservado exclusivamente para la Dirección de Gestión Humana de B GROUP INGENIERIA S.A.S.
        </p>
      </div>
    );
  }

  // Totales de la nómina
  const totales = useMemo(() => {
    return liquidaciones.reduce(
      (acc, liq) => {
        acc.totalDevengado += liq.devengados.totalDevengado;
        acc.totalDeducciones += liq.deducciones.totalDeducciones;
        acc.totalNetoPagar += liq.netoAPagar;
        acc.totalSeguridadSocialEmpresa += (liq.aportesEmpresa.saludEmpleador + liq.aportesEmpresa.pensionEmpleador + liq.aportesEmpresa.arl);
        acc.totalParafiscalesEmpresa += (liq.aportesEmpresa.cajaCompensacion + liq.aportesEmpresa.sena + liq.aportesEmpresa.icbf);
        acc.totalProvisionesPrestaciones += liq.provisiones.totalProvisiones;
        acc.costoGranTotalEmpresa += liq.costoTotalEmpresa;
        return acc;
      },
      {
        totalDevengado: 0,
        totalDeducciones: 0,
        totalNetoPagar: 0,
        totalSeguridadSocialEmpresa: 0,
        totalParafiscalesEmpresa: 0,
        totalProvisionesPrestaciones: 0,
        costoGranTotalEmpresa: 0
      }
    );
  }, [liquidaciones]);

  // Liquidación del empleado seleccionado para desprendible
  const liquidacionDesprendible = liquidaciones.find(l => l.empleadoId === empleadoDesprendibleId) || liquidaciones[0];

  // Filtrado y paginación para la planilla de liquidaciones (bloques de 25)
  const liquidacionesFiltradas = useMemo(() => {
    if (!filtroLiquidaciones.trim()) return liquidaciones;
    const term = filtroLiquidaciones.toLowerCase();
    return liquidaciones.filter(l =>
      l.empleadoNombre.toLowerCase().includes(term) ||
      (l.empleadoDocumento && l.empleadoDocumento.toLowerCase().includes(term)) ||
      (l.cargoNombre && l.cargoNombre.toLowerCase().includes(term))
    );
  }, [liquidaciones, filtroLiquidaciones]);

  const liquidacionesPaginadas = useMemo(() => {
    return liquidacionesFiltradas.slice(0, limiteLiquidaciones);
  }, [liquidacionesFiltradas, limiteLiquidaciones]);

  // Handler para actualizar novedades de un empleado en el período activo
  const handleUpdateNovedad = (empleadoId: string, campo: keyof NovedadNominaEmpleado, valor: any) => {
    setNovedadesPorPeriodo(prev => {
      const periodoNovs = prev[selectedPeriodoCodigo] || {};
      const actual = periodoNovs[empleadoId] || {
        diasTrabajados: 30,
        horasExtrasDiurnas: 0,
        horasExtrasNocturnas: 0,
        horasFestivasDiurnas: 0,
        horasFestivasNocturnas: 0,
        recargoNocturnoOrdinario: 0,
        bonificacionesSalariales: 0,
        bonificacionesNoSalariales: 0,
        comisiones: 0,
        incapacidadDias: 0,
        licenciaRemuneradaDias: 0,
        prestamosYDeducciones: 0
      };
      return {
        ...prev,
        [selectedPeriodoCodigo]: {
          ...periodoNovs,
          [empleadoId]: {
            ...actual,
            [campo]: valor
          }
        }
      };
    });
  };

  // Handler para actualizar la novedad completa de un empleado
  const handleUpdateNovedadCompleta = (empleadoId: string, nuevaNovedad: NovedadNominaEmpleado) => {
    setNovedadesPorPeriodo(prev => {
      const periodoNovs = prev[selectedPeriodoCodigo] || {};
      return {
        ...prev,
        [selectedPeriodoCodigo]: {
          ...periodoNovs,
          [empleadoId]: nuevaNovedad
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header del módulo con distintivo de seguridad */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8FA7D6]/20 text-[#18235C] border border-[#8FA7D6] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#18235C]" />
                Acceso Exclusivo: Administrador
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8FA7D6]/10 text-[#282829] border border-[#8FA7D6]">
                CST & Ley Colombiana 2026
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#18235C]">
              Nómina y Prestaciones Sociales
            </h1>
            <p className="text-xs sm:text-sm text-[#282829] mt-1 max-w-2xl">
              Liquidación integral mensual y quincenal de cualquier período anual: devengados, deducciones de ley (4% salud, 4% pensión, FSP), aportes patronales, parafiscales (exoneración Art. 114-1 E.T.) y reservas de provisiones de prestaciones sociales.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <button
              onClick={() => setModalAperturaPeriodoAbierto(true)}
              className="px-3.5 py-2 text-xs font-bold bg-[#18235C] hover:bg-[#101740] text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Aperturar cualquier mes y año"
            >
              <Plus className="w-4 h-4 text-[#00FF00]" />
              <span>+ Aperturar Período</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold bg-[#FFFFFF] hover:bg-[#8FA7D6]/10 text-[#18235C] rounded-xl border border-[#8FA7D6] flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Imprimir reporte de nómina"
            >
              <Printer className="w-4 h-4 text-[#18235C]" />
              <span className="hidden sm:inline">Imprimir Planilla</span>
            </button>
          </div>
        </div>

        {/* BARRA DE NAVEGACIÓN Y CONTROL DE PERÍODOS (TODOS LOS MESES Y AÑOS) */}
        <div className="bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] p-3 sm:p-4 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleNavegarPeriodo('anterior')}
              disabled={periodos.findIndex(p => p.codigoPeriodo === selectedPeriodoCodigo) === 0}
              className="p-2 bg-white rounded-lg border border-[#8FA7D6] text-[#18235C] hover:bg-[#8FA7D6]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Mes / Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#8FA7D6]">
              <Calendar className="w-4 h-4 text-[#18235C]" />
              <div className="text-xs">
                <span className="text-[10px] text-[#282829]/70 font-semibold block">Período de Nómina:</span>
                <select
                  value={selectedPeriodoCodigo}
                  onChange={e => setSelectedPeriodoCodigo(e.target.value)}
                  className="bg-transparent font-black text-[#18235C] focus:outline-none cursor-pointer pr-2"
                >
                  {periodos.map(p => (
                    <option key={p.codigoPeriodo} value={p.codigoPeriodo}>
                      {p.nombre} ({p.tipo}) — [{p.estado}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => handleNavegarPeriodo('siguiente')}
              disabled={periodos.findIndex(p => p.codigoPeriodo === selectedPeriodoCodigo) === periodos.length - 1}
              className="p-2 bg-white rounded-lg border border-[#8FA7D6] text-[#18235C] hover:bg-[#8FA7D6]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Mes / Período siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Chip de Estado y fechas */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                  periodoActivo.estado === 'Pagada'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : periodoActivo.estado === 'Liquidada'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {periodoActivo.estado === 'Pagada' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {periodoActivo.estado === 'Liquidada' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                {periodoActivo.estado === 'Borrador' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                {periodoActivo.estado}
              </span>
              <span className="text-[11px] text-[#282829]/80 hidden lg:inline font-medium">
                Vigencia: {periodoActivo.fechaInicio} al {periodoActivo.fechaFin} • Pago: {periodoActivo.fechaPago}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => ejecutarGuardadoNominaLoteAtómico()}
              disabled={sincronizandoLote}
              className="px-3 py-1.5 text-xs font-bold bg-[#18235C] hover:bg-[#101740] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="Guardar de forma 100% atómica el período y todas las colillas en Firestore (writeBatch)"
            >
              <Database className="w-3.5 h-3.5 text-[#8FA7D6]" />
              {sincronizandoLote ? 'Guardando Lote Atómico…' : 'Guardar Lote en Nube'}
            </button>

            {periodoActivo.estado === 'Borrador' && (
              <button
                onClick={() => handleCambiarEstadoPeriodo('Liquidada')}
                className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Aprobar y Cerrar Nómina
              </button>
            )}
            {periodoActivo.estado === 'Liquidada' && (
              <button
                onClick={() => handleCambiarEstadoPeriodo('Pagada')}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Marcar como Pagada
              </button>
            )}
            {periodoActivo.estado === 'Pagada' && (
              <button
                onClick={() => handleCambiarEstadoPeriodo('Borrador')}
                className="px-3 py-1.5 text-xs font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                title="Reabrir nómina para ajustes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reabrir a Borrador
              </button>
            )}
          </div>
        </div>

        {/* Notificación de resultado de transacción atómica writeBatch */}
        {mensajeSincronizacion && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border shadow-xs ${
              mensajeSincronizacion.tipo === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {mensajeSincronizacion.tipo === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{mensajeSincronizacion.texto}</span>
          </div>
        )}

        {/* Métricas consolidadas en tarjetas limpias */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-[#8FA7D6]">
          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Total Neto a Pagar
              <Coins className="w-4 h-4 text-[#18235C]" />
            </div>
            <div className="text-lg font-black text-[#18235C]">
              {formatMonedaCOP(totales.totalNetoPagar)}
            </div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
              {liquidaciones.length} colaboradores activos en nómina
            </div>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Seguridad Social & Parafiscales
              <Building2 className="w-4 h-4 text-[#18235C]" />
            </div>
            <div className="text-lg font-black text-[#18235C]">
              {formatMonedaCOP(totales.totalSeguridadSocialEmpresa + totales.totalParafiscalesEmpresa)}
            </div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
              Aportes a cargo de B GROUP INGENIERIA S.A.S.
            </div>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Provisiones Prestaciones
              <TrendingUp className="w-4 h-4 text-[#18235C]" />
            </div>
            <div className="text-lg font-black text-[#18235C]">
              {formatMonedaCOP(totales.totalProvisionesPrestaciones)}
            </div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
              Cesantías, Intereses, Prima y Vacaciones
            </div>
          </div>

          <div className="p-4 bg-[#18235C] rounded-xl border border-[#101740] shadow-sm text-white">
            <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider mb-1 flex items-center justify-between">
              Costo Gran Total Empresa
              <Scale className="w-4 h-4 text-[#00FF00]" />
            </div>
            <div className="text-lg font-black text-[#00FF00]">
              {formatMonedaCOP(totales.costoGranTotalEmpresa)}
            </div>
            <div className="text-[10px] text-white/80 mt-0.5 font-medium">
              Impacto financiero total mensual
            </div>
          </div>
        </div>

        {/* Pestañas de navegación interna */}
        <div className="flex border-b border-[#8FA7D6] mt-6 gap-5 text-xs font-bold overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab('periodo')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'periodo'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Liquidación Mensual Detallada
          </button>
          <button
            onClick={() => setActiveTab('provisiones')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'provisiones'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5 text-[#18235C]" />
            Reservas & Provisiones (CST)
            <span className="px-1.5 py-0.2 bg-[#00FF00]/20 text-[#18235C] rounded-full text-[10px] font-bold">
              2026
            </span>
          </button>
          <button
            onClick={() => setActiveTab('novedades')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'novedades'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Gestión de Novedades
            <span className="px-1.5 py-0.2 bg-[#8FA7D6]/20 text-[#18235C] rounded-full text-[10px] font-bold">
              Submenú
            </span>
          </button>
          <button
            onClick={() => setActiveTab('vacaciones')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'vacaciones'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5" />
            Control de Vacaciones
            <span className="px-1.5 py-0.2 bg-[#8FA7D6]/20 text-[#18235C] rounded-full text-[10px] font-bold">
              CST 186
            </span>
          </button>
          <button
            onClick={() => setActiveTab('desprendible')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'desprendible'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Colilla / Desprendible
          </button>
          <button
            onClick={() => setActiveTab('liquidacion')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'liquidacion'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Liquidación Contrato (Art. 64)
          </button>
          <button
            onClick={() => setActiveTab('parametros')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'parametros'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            Parámetros Legales 2026
          </button>
        </div>
      </div>

      {/* TAB 1: Liquidación Mensual Detallada */}
      {activeTab === 'periodo' && (
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="p-4 bg-[#FFFFFF] border-b border-[#8FA7D6] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2">
                  Planilla de Liquidación — {periodoActivo.nombre} ({periodoActivo.tipo})
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#8FA7D6]/20 text-[#18235C] border border-[#8FA7D6]">
                    Mes comercial (30 días)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#18235C] text-white">
                    Mostrando {liquidacionesPaginadas.length} de {liquidacionesFiltradas.length}
                  </span>
                </h3>
                <p className="text-xs text-[#282829] mt-0.5">
                  Haga clic en <strong>"Novedades"</strong> en cualquier fila para registrar horas extras, recargos o préstamos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#282829]/50" />
                  <input
                    type="text"
                    value={filtroLiquidaciones}
                    onChange={e => {
                      setFiltroLiquidaciones(e.target.value);
                      setLimiteLiquidaciones(25);
                    }}
                    placeholder="Filtrar por nombre, CC o cargo..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#8FA7D6] rounded text-xs text-[#282829] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>
                {filtroLiquidaciones && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroLiquidaciones('');
                      setLimiteLiquidaciones(25);
                    }}
                    className="text-xs text-[#18235C] hover:underline font-semibold cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
                <div className="text-xs text-[#282829] whitespace-nowrap">
                  SMMLV 2026: <strong className="text-[#18235C]">{formatMonedaCOP(parametrosLegales.smmlv)}</strong>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Colaborador / Cargo</th>
                    <th className="py-3 px-3">Salario Base</th>
                    <th className="py-3 px-3">Días</th>
                    <th className="py-3 px-3">Devengados</th>
                    <th className="py-3 px-3">Salud (4%)</th>
                    <th className="py-3 px-3">Pensión (4%)</th>
                    <th className="py-3 px-3">Otras Deduc.</th>
                    <th className="py-3 px-3 font-bold text-[#00FF00]">Neto a Pagar</th>
                    <th className="py-3 px-3">Aportes Empresa</th>
                    <th className="py-3 px-3">Provisiones</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/30">
                  {liquidacionesPaginadas.map(liq => (
                    <tr key={liq.empleadoId} className="hover:bg-[#8FA7D6]/10 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#18235C]">{liq.empleadoNombre}</div>
                        <div className="text-[10px] text-[#282829] flex items-center gap-1.5">
                          <span>CC: {liq.empleadoDocumento}</span>
                          <span>•</span>
                          <span className="text-[#18235C] font-semibold">{liq.cargoNombre}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-[#18235C]">
                        {formatMonedaCOP(liq.salarioBasicoPactado)}
                        {liq.tieneDerechoAuxilioTransporte && (
                          <div className="text-[9px] text-[#18235C] font-semibold">+ Aux. Transporte</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[#282829] font-medium">
                        {liq.novedades.diasTrabajados} días
                      </td>

                      <td className="py-3 px-3 font-bold text-[#18235C]">
                        {formatMonedaCOP(liq.devengados.totalDevengado)}
                        {liq.devengados.valorHorasExtrasYRecargos > 0 && (
                          <div className="text-[9px] text-amber-700 font-semibold">
                            Extras: +{formatMonedaCOP(liq.devengados.valorHorasExtrasYRecargos)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-rose-700 font-bold">
                        -{formatMonedaCOP(liq.deducciones.saludEmpleado)}
                      </td>

                      <td className="py-3 px-3 text-rose-700 font-bold">
                        -{formatMonedaCOP(liq.deducciones.pensionEmpleado)}
                        {liq.deducciones.fondoSolidaridadPensional > 0 && (
                          <div className="text-[9px] text-amber-700 font-semibold">
                            FSP: -{formatMonedaCOP(liq.deducciones.fondoSolidaridadPensional)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[#282829]">
                        {liq.deducciones.retencionFuente + liq.deducciones.prestamosOtrasDeducciones > 0 ? (
                          <span className="text-rose-700 font-bold">
                            -{formatMonedaCOP(liq.deducciones.retencionFuente + liq.deducciones.prestamosOtrasDeducciones)}
                          </span>
                        ) : (
                          <span className="text-[#282829]/60">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-black text-[#18235C] text-sm bg-[#8FA7D6]/15">
                        {formatMonedaCOP(liq.netoAPagar)}
                      </td>

                      <td className="py-3 px-3 text-[#282829]">
                        <div className="font-semibold text-[#18235C]">{formatMonedaCOP(liq.aportesEmpresa.totalSeguridadSocialYParafiscales)}</div>
                        <div className="text-[9px] text-[#282829]/70">
                          ARL: {liq.claseRiesgoARL} ({(liq.aportesEmpresa.tarifaArlAplicada * 100).toFixed(3)}%)
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#282829]">
                        <div className="font-semibold text-[#18235C]">{formatMonedaCOP(liq.provisiones.totalProvisiones)}</div>
                        <div className="text-[9px] text-[#282829]/70">Ces: 8.33% | Vac: 4.17%</div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEmpleadoEditandoNovedad(liq.empleadoId)}
                            className="px-2.5 py-1 bg-white hover:bg-[#8FA7D6]/10 text-[#18235C] border border-[#8FA7D6] rounded-lg text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                            title="Editar novedades"
                          >
                            Novedades
                          </button>
                          <button
                            onClick={() => {
                              setEmpleadoDesprendibleId(liq.empleadoId);
                              setActiveTab('desprendible');
                            }}
                            className="px-2.5 py-1 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                            title="Ver desprendible de pago"
                          >
                            Colilla
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {liquidacionesFiltradas.length === 0 && liquidaciones.length > 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 px-4 text-center text-[#282829]/70">
                        No se encontraron colaboradores en la planilla de nómina que coincidan con <strong>"{filtroLiquidaciones}"</strong>.
                      </td>
                    </tr>
                  )}
                  {liquidaciones.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 px-4 text-center text-[#282829]/70">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 text-[#8FA7D6]" />
                          <p className="font-bold text-sm text-[#18235C]">
                            Base de datos de nómina limpia para producción
                          </p>
                          <p className="text-xs text-[#282829]/60 max-w-md">
                            No hay colaboradores con liquidación en este período. Registre el personal de su empresa en el módulo de Empleados para que el motor de nómina genere automáticamente las liquidaciones, aportes y deducciones de ley.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#8FA7D6]/15 font-bold text-xs text-[#18235C] border-t-2 border-[#8FA7D6]">
                    <td className="py-3 px-3">TOTALES NÓMINA ({liquidaciones.length})</td>
                    <td className="py-3 px-3">—</td>
                    <td className="py-3 px-3">—</td>
                    <td className="py-3 px-3 text-[#18235C] font-black">{formatMonedaCOP(totales.totalDevengado)}</td>
                    <td className="py-3 px-3 text-rose-700 font-bold">-{formatMonedaCOP(liquidaciones.reduce((s, l) => s + l.deducciones.saludEmpleado, 0))}</td>
                    <td className="py-3 px-3 text-rose-700 font-bold">-{formatMonedaCOP(liquidaciones.reduce((s, l) => s + l.deducciones.pensionEmpleado + l.deducciones.fondoSolidaridadPensional, 0))}</td>
                    <td className="py-3 px-3 text-rose-700 font-bold">-{formatMonedaCOP(totales.totalDeducciones - liquidaciones.reduce((s, l) => s + l.deducciones.saludEmpleado + l.deducciones.pensionEmpleado + l.deducciones.fondoSolidaridadPensional, 0))}</td>
                    <td className="py-3 px-3 text-[#18235C] font-black text-sm bg-[#8FA7D6]/30">{formatMonedaCOP(totales.totalNetoPagar)}</td>
                    <td className="py-3 px-3">{formatMonedaCOP(totales.totalSeguridadSocialEmpresa + totales.totalParafiscalesEmpresa)}</td>
                    <td className="py-3 px-3">{formatMonedaCOP(totales.totalProvisionesPrestaciones)}</td>
                    <td className="py-3 px-3 text-right text-[10px] text-[#282829] font-medium">CST Ley 2101</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Paginación de Planilla de Nómina */}
            {liquidacionesFiltradas.length > 25 && (
              <div className="p-3.5 bg-[#F8FAFC] border-t border-[#8FA7D6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[#282829]/80 font-medium">
                  Mostrando {liquidacionesPaginadas.length} de {liquidacionesFiltradas.length} colaboradores en nómina
                </span>
                <div className="flex items-center gap-2">
                  {limiteLiquidaciones < liquidacionesFiltradas.length && (
                    <button
                      type="button"
                      onClick={() => setLimiteLiquidaciones(prev => prev + 25)}
                      className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Cargar más (+25 colaboradores)
                    </button>
                  )}
                  {limiteLiquidaciones < liquidacionesFiltradas.length ? (
                    <button
                      type="button"
                      onClick={() => setLimiteLiquidaciones(liquidacionesFiltradas.length)}
                      className="px-2.5 py-1.5 bg-white hover:bg-[#8FA7D6]/20 border border-[#8FA7D6] text-[#18235C] rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cargar todos ({liquidacionesFiltradas.length})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLimiteLiquidaciones(25)}
                      className="px-2.5 py-1.5 bg-white hover:bg-[#8FA7D6]/20 border border-[#8FA7D6] text-[#18235C] rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Restablecer a 25
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal / Panel de Novedades de Empleado */}
          {empleadoEditandoNovedad && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {(() => {
                  const emp = empleados.find(e => e.id === empleadoEditandoNovedad);
                  const cargo = cargos.find(c => c.id === emp?.cargoId);
                  const nov = novedadesMap[empleadoEditandoNovedad] || {
                    diasTrabajados: 30,
                    horasExtrasDiurnas: 0,
                    horasExtrasNocturnas: 0,
                    horasFestivasDiurnas: 0,
                    horasFestivasNocturnas: 0,
                    recargoNocturnoOrdinario: 0,
                    bonificacionesSalariales: 0,
                    bonificacionesNoSalariales: 0,
                    comisiones: 0,
                    incapacidadDias: 0,
                    licenciaRemuneradaDias: 0,
                    prestamosYDeducciones: 0
                  };

                  return (
                    <div className="flex flex-col h-full overflow-hidden">
                      {/* Cabecera Azul Naval */}
                      <div className="bg-[#18235C] text-white p-5 flex items-start justify-between border-b border-[#101740]">
                        <div>
                          <h3 className="font-black text-base text-white">
                            Registrar Novedades de Nómina — {emp?.nombre}
                          </h3>
                          <div className="text-xs text-[#8FA7D6] mt-0.5 font-medium">
                            Cargo: {cargo?.nombre} | Salario base: {emp?.contrato.salario}
                          </div>
                        </div>
                        <button
                          onClick={() => setEmpleadoEditandoNovedad(null)}
                          className="text-[#8FA7D6] hover:text-white text-lg font-bold p-1 transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="p-6 overflow-y-auto space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block font-bold text-[#18235C] mb-1">
                              Días laborados en el mes (Base 30):
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={nov.diasTrabajados}
                              onChange={e => handleUpdateNovedad(emp!.id, 'diasTrabajados', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
                            />
                            <span className="text-[10px] text-[#282829]/70">Salario proporcional: (Base / 30) * Días</span>
                          </div>

                          <div>
                            <label className="block font-bold text-[#18235C] mb-1">
                              Horas Extras Diurnas (Recargo 25%):
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={nov.horasExtrasDiurnas}
                              onChange={e => handleUpdateNovedad(emp!.id, 'horasExtrasDiurnas', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#18235C] mb-1">
                              Horas Extras Nocturnas (Recargo 75%):
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={nov.horasExtrasNocturnas}
                              onChange={e => handleUpdateNovedad(emp!.id, 'horasExtrasNocturnas', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#18235C] mb-1">
                              Recargo Nocturno Ordinario (35% - horas):
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={nov.recargoNocturnoOrdinario}
                              onChange={e => handleUpdateNovedad(emp!.id, 'recargoNocturnoOrdinario', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#18235C] mb-1">
                              Comisiones de Ventas ($ COP):
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={50000}
                              value={nov.comisiones}
                              onChange={e => handleUpdateNovedad(emp!.id, 'comisiones', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#18235C] mb-1">
                              Bonificaciones Salariales ($ COP):
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={50000}
                              value={nov.bonificacionesSalariales}
                              onChange={e => handleUpdateNovedad(emp!.id, 'bonificacionesSalariales', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#18235C] mb-1">
                              Deducción por Préstamos / Libranzas ($ COP):
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={10000}
                              value={nov.prestamosYDeducciones}
                              onChange={e => handleUpdateNovedad(emp!.id, 'prestamosYDeducciones', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#18235C] mb-1">
                              Días de Incapacidad Médica:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={nov.incapacidadDias}
                              onChange={e => handleUpdateNovedad(emp!.id, 'incapacidadDias', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-[#8FA7D6]/10 rounded-xl border border-[#8FA7D6] text-[11px] text-[#282829]">
                          <strong className="text-[#18235C]">Regla laboral colombiana 2026:</strong> La jornada ordinaria mensual de referencia se calcula en 210 horas (42 horas semanales vigentes, Ley 2101/2021). Las horas extras y recargos integran el Ingreso Base de Cotización (IBC) para seguridad social y prestaciones.
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 p-4 border-t border-[#8FA7D6] bg-white">
                        <button
                          onClick={() => setEmpleadoEditandoNovedad(null)}
                          className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#8FA7D6]/10 text-[#282829] border border-[#8FA7D6] rounded-xl text-xs font-bold transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => setEmpleadoEditandoNovedad(null)}
                          className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                        >
                          Aplicar y Recalcular
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBMÓDULO: RESERVAS Y PROVISIONES DE PRESTACIONES SOCIALES (CST) */}
      {activeTab === 'provisiones' && (
        <ReservasProvisionesView
          periodoActivo={periodoActivo}
          empleados={empleados}
          cargos={cargos}
          liquidaciones={liquidaciones}
          parametros={parametrosLegales}
        />
      )}

      {/* SUBMENÚ: GESTIÓN DE NOVEDADES DE NÓMINA */}
      {activeTab === 'novedades' && (
        <GestionNovedadesView
          empleados={empleados}
          cargos={cargos}
          periodoActivo={periodoActivo}
          periodos={periodos}
          onSelectPeriodo={codigo => setSelectedPeriodoCodigo(codigo)}
          onCrearPeriodo={() => setModalAperturaPeriodoAbierto(true)}
          novedadesMap={novedadesMap}
          onActualizarNovedad={(empId, nov) => {
            handleUpdateNovedadCompleta(empId, nov);
          }}
        />
      )}

      {/* CUADRO DE CONTROL DE SOLICITUDES DE VACACIONES */}
      {activeTab === 'vacaciones' && (
        <ControlVacacionesView
          empleados={empleados}
          cargos={cargos}
          userRole={userRole}
          currentEmpleadoId={currentEmpleadoId}
        />
      )}

      {/* TAB 2: Colilla / Desprendible de Pago Oficial */}
      {activeTab === 'desprendible' && (
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#18235C]">
                Seleccionar Colaborador:
              </label>
              <select
                value={empleadoDesprendibleId}
                onChange={e => setEmpleadoDesprendibleId(e.target.value)}
                className="px-3 py-2 bg-[#FFFFFF] border border-[#8FA7D6] rounded-xl text-xs text-[#282829] font-medium focus:outline-none focus:ring-2 focus:ring-[#18235C]"
              >
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} — CC: {emp.documento}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white border border-[#18235C] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-[#8FA7D6]" />
                Imprimir Desprendible
              </button>
            </div>
          </div>

          {/* Formato Oficial de Colilla de Pago Colombiana */}
          {liquidacionDesprendible && (
            <div className="bg-[#FFFFFF] rounded-2xl border-2 border-[#8FA7D6] p-6 sm:p-8 max-w-4xl mx-auto shadow-md print:border-none print:shadow-none print:p-0">
              {/* Encabezado Corporativo Legal */}
              <div className="border-b-2 border-[#18235C] pb-4 mb-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-xl font-black text-[#18235C] tracking-tight">
                      B GROUP INGENIERIA S.A.S.
                    </h2>
                    <div className="text-xs text-[#282829] font-medium">
                      NIT: 900.995.99-2 | Actividad Económica: Ingeniería, Telecomunicaciones & Consultoría
                    </div>
                    <div className="text-xs text-[#282829]/70">
                      Dirección: Carrera 7 # 71-21 Torre A, Piso 9 • Bogotá D.C., Colombia
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-bold px-3 py-1 bg-[#18235C] text-white rounded-lg inline-block mb-1 shadow-2xs">
                      COMPROBANTE OFICIAL DE PAGO DE NÓMINA
                    </div>
                    <div className="text-xs text-[#282829]">
                      Período: <strong className="text-[#18235C]">{periodoActivo.fechaInicio} al {periodoActivo.fechaFin} ({periodoActivo.nombre})</strong>
                    </div>
                    <div className="text-xs text-[#282829]">
                      Fecha de pago: <strong className="text-[#18235C]">{periodoActivo.fechaPago}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos del Trabajador */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#8FA7D6]/10 rounded-xl border border-[#8FA7D6] text-xs mb-5">
                <div>
                  <span className="text-[#18235C] block text-[10px] uppercase font-bold">Colaborador</span>
                  <span className="font-bold text-[#282829]">{liquidacionDesprendible.empleadoNombre}</span>
                </div>
                <div>
                  <span className="text-[#18235C] block text-[10px] uppercase font-bold">Identificación</span>
                  <span className="font-medium text-[#282829]">C.C. {liquidacionDesprendible.empleadoDocumento}</span>
                </div>
                <div>
                  <span className="text-[#18235C] block text-[10px] uppercase font-bold">Cargo</span>
                  <span className="font-semibold text-[#18235C]">{liquidacionDesprendible.cargoNombre}</span>
                </div>
                <div>
                  <span className="text-[#18235C] block text-[10px] uppercase font-bold">Tipo Contrato</span>
                  <span className="font-medium text-[#282829]">{liquidacionDesprendible.tipoContrato}</span>
                </div>
                <div>
                  <span className="text-[#18235C] block text-[10px] uppercase font-bold">Salario Básico</span>
                  <span className="font-bold text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.salarioBasicoPactado)}</span>
                </div>
                <div>
                  <span className="text-[#18235C] block text-[10px] uppercase font-bold">Días Liquidados</span>
                  <span className="font-medium text-[#282829]">{liquidacionDesprendible.novedades.diasTrabajados} días</span>
                </div>
                <div>
                  <span className="text-[#18235C] block text-[10px] uppercase font-bold">Clase Riesgo ARL</span>
                  <span className="font-medium text-[#282829]">Clase {liquidacionDesprendible.claseRiesgoARL} ({(liquidacionDesprendible.aportesEmpresa.tarifaArlAplicada * 100).toFixed(3)}%)</span>
                </div>
                <div>
                  <span className="text-[#18235C] block text-[10px] uppercase font-bold">Cuenta de Abono</span>
                  <span className="font-medium text-[#282829]">Bancolombia Ahorros ***4410</span>
                </div>
              </div>

              {/* Tablas lado a lado: Devengados vs Deducciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {/* Devengados */}
                <div className="border border-[#8FA7D6] rounded-xl overflow-hidden bg-white">
                  <div className="bg-[#18235C] text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wider flex justify-between">
                    <span>Conceptos Devengados</span>
                    <span>Valor ($)</span>
                  </div>
                  <div className="p-3.5 space-y-2 text-xs divide-y divide-[#8FA7D6]/20">
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Sueldo básico proporcional ({liquidacionDesprendible.novedades.diasTrabajados} días):</span>
                      <span className="font-bold text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.devengados.salarioProporcional)}</span>
                    </div>
                    {liquidacionDesprendible.tieneDerechoAuxilioTransporte && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#282829]">Auxilio Legal de Transporte:</span>
                        <span className="font-bold text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.devengados.auxilioTransporte)}</span>
                      </div>
                    )}
                    {liquidacionDesprendible.devengados.valorHorasExtrasYRecargos > 0 && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#282829]">Horas extras y recargos nocturnos:</span>
                        <span className="font-bold text-amber-700">+{formatMonedaCOP(liquidacionDesprendible.devengados.valorHorasExtrasYRecargos)}</span>
                      </div>
                    )}
                    {liquidacionDesprendible.devengados.bonificacionesYComisiones > 0 && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#282829]">Comisiones y bonos salariales:</span>
                        <span className="font-bold text-[#18235C]">+{formatMonedaCOP(liquidacionDesprendible.devengados.bonificacionesYComisiones)}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-[#8FA7D6]/15 p-3 border-t border-[#8FA7D6] flex justify-between text-xs font-black text-[#18235C]">
                    <span>TOTAL DEVENGADO:</span>
                    <span>{formatMonedaCOP(liquidacionDesprendible.devengados.totalDevengado)}</span>
                  </div>
                </div>

                {/* Deducciones */}
                <div className="border border-[#8FA7D6] rounded-xl overflow-hidden bg-white">
                  <div className="bg-[#8FA7D6]/30 text-[#18235C] px-3.5 py-2 font-bold text-xs uppercase tracking-wider border-b border-[#8FA7D6] flex justify-between">
                    <span>Deducciones del Trabajador</span>
                    <span>Valor ($)</span>
                  </div>
                  <div className="p-3.5 space-y-2 text-xs divide-y divide-[#8FA7D6]/20">
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Aporte obligatorio Salud (4% IBC):</span>
                      <span className="font-bold text-rose-700">-{formatMonedaCOP(liquidacionDesprendible.deducciones.saludEmpleado)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-[#282829]">Aporte obligatorio Pensión (4% IBC):</span>
                      <span className="font-bold text-rose-700">-{formatMonedaCOP(liquidacionDesprendible.deducciones.pensionEmpleado)}</span>
                    </div>
                    {liquidacionDesprendible.deducciones.fondoSolidaridadPensional > 0 && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#282829]">Fondo de Solidaridad Pensional (FSP):</span>
                        <span className="font-bold text-rose-700">-{formatMonedaCOP(liquidacionDesprendible.deducciones.fondoSolidaridadPensional)}</span>
                      </div>
                    )}
                    {liquidacionDesprendible.deducciones.retencionFuente > 0 && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#282829]">Retención en la fuente (Art. 383 E.T.):</span>
                        <span className="font-bold text-rose-700">-{formatMonedaCOP(liquidacionDesprendible.deducciones.retencionFuente)}</span>
                      </div>
                    )}
                    {liquidacionDesprendible.deducciones.prestamosOtrasDeducciones > 0 && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#282829]">Préstamos / Fondo de Empleados:</span>
                        <span className="font-bold text-rose-700">-{formatMonedaCOP(liquidacionDesprendible.deducciones.prestamosOtrasDeducciones)}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-rose-50 p-3 border-t border-[#8FA7D6] flex justify-between text-xs font-black text-rose-700">
                    <span>TOTAL DEDUCCIONES:</span>
                    <span>-{formatMonedaCOP(liquidacionDesprendible.deducciones.totalDeducciones)}</span>
                  </div>
                </div>
              </div>

              {/* Gran Total Neto a Pagar en Barra Destacada */}
              <div className="bg-[#18235C] text-white p-5 rounded-2xl flex items-center justify-between mb-6 shadow-md border border-[#101740]">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#8FA7D6]">
                    Neto Efectivo a Transferir
                  </div>
                  <div className="text-xs text-white/80">
                    Total Devengado menos Deducciones Legales
                  </div>
                </div>
                <div className="text-2xl font-black tracking-tight text-[#00FF00]">
                  {formatMonedaCOP(liquidacionDesprendible.netoAPagar)}
                </div>
              </div>

              {/* Sección Informativa: Aportes Empleador & Provisiones Sociales (Transparencia CST) */}
              <div className="p-4 bg-[#8FA7D6]/10 rounded-xl border border-[#8FA7D6] text-[11px] mb-6">
                <div className="font-bold text-[#18235C] mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#18235C]" />
                  Aportes y Provisiones Patronales asumidos por la empresa (No deducibles del trabajador):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#282829]">
                  <div>
                    Pensión Empleador (12%): <strong className="text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.aportesEmpresa.pensionEmpleador)}</strong>
                  </div>
                  <div>
                    ARL Riesgo {liquidacionDesprendible.claseRiesgoARL}: <strong className="text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.aportesEmpresa.arl)}</strong>
                  </div>
                  <div>
                    Caja Compensación (4%): <strong className="text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.aportesEmpresa.cajaCompensacion)}</strong>
                  </div>
                  <div>
                    Salud Patronal (8.5%): <strong className="text-[#18235C]">{liquidacionDesprendible.aportesEmpresa.exoneradoArt114_1 ? 'Exonerado Art 114-1' : formatMonedaCOP(liquidacionDesprendible.aportesEmpresa.saludEmpleador)}</strong>
                  </div>
                  <div>
                    Cesantías (8.33%): <strong className="text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.provisiones.cesantias)}</strong>
                  </div>
                  <div>
                    Intereses Cesantías (1%): <strong className="text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.provisiones.interesesCesantias)}</strong>
                  </div>
                  <div>
                    Prima Servicios (8.33%): <strong className="text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.provisiones.primaServicios)}</strong>
                  </div>
                  <div>
                    Vacaciones (4.17%): <strong className="text-[#18235C]">{formatMonedaCOP(liquidacionDesprendible.provisiones.vacaciones)}</strong>
                  </div>
                </div>
              </div>

              {/* Firmas Legales */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#8FA7D6] text-center text-xs">
                <div>
                  <div className="h-12 flex items-end justify-center pb-1">
                    <span className="italic text-sm text-[#18235C] font-semibold">Marcela Rueda C.</span>
                  </div>
                  <div className="border-t-2 border-[#18235C] pt-1 font-bold text-[#18235C]">
                    B GROUP INGENIERIA S.A.S. — Empleador
                  </div>
                  <div className="text-[10px] text-[#282829]">Dirección de Gestión Humana</div>
                </div>

                <div>
                  <div className="h-12 flex items-end justify-center pb-1">
                    <span className="text-[11px] text-[#8FA7D6] font-semibold">Firma o Confirmación Digital</span>
                  </div>
                  <div className="border-t-2 border-[#18235C] pt-1 font-bold text-[#18235C]">
                    {liquidacionDesprendible.empleadoNombre}
                  </div>
                  <div className="text-[10px] text-[#282829]">C.C. {liquidacionDesprendible.empleadoDocumento} — Trabajador</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Simulador de Liquidación Definitiva de Contrato (Art 64 CST - Componente Desacoplado) */}
      {activeTab === 'liquidacion' && (
        <SimuladorLiquidacionContratoView empleados={empleados} />
      )}

      {/* TAB 4: Parámetros y Normatividad Legal 2026 */}
      {activeTab === 'parametros' && (
        <ParametrosNominaView
          parametros={parametrosLegales}
          onSaveParametros={(nuevos) => {
            setParametrosLegales(nuevos);
            guardarParametrosConfigurados(nuevos);
          }}
          isSuperAdmin={true}
        />
      )}

      {/* MODAL 1: APERTURA DE NUEVO PERÍODO (COMPONENTE DESACOPLADO) */}
      <NominaAperturaPeriodoModal
        isOpen={modalAperturaPeriodoAbierto}
        onClose={() => setModalAperturaPeriodoAbierto(false)}
        nuevoPeriodoAno={nuevoPeriodoAno}
        setNuevoPeriodoAno={setNuevoPeriodoAno}
        nuevoPeriodoMes={nuevoPeriodoMes}
        setNuevoPeriodoMes={setNuevoPeriodoMes}
        nuevoPeriodoTipo={nuevoPeriodoTipo}
        setNuevoPeriodoTipo={setNuevoPeriodoTipo}
        copiarNovedadesDeActual={copiarNovedadesDeActual}
        setCopiarNovedadesDeActual={setCopiarNovedadesDeActual}
        onAperturarPeriodo={handleAperturarPeriodo}
        onGenerarAnoCompleto={handleGenerarAnoCompleto}
      />

      {/* MODAL 2: EDICIÓN DE PARÁMETROS LEGALES */}
      {modalParametrosAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border-2 border-[#8FA7D6] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-[#18235C] text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#00FF00]" />
                  Ajuste de Parámetros Legales Laborales
                </h3>
                <p className="text-xs text-[#8FA7D6] mt-0.5">
                  Actualice los valores base de nómina y recargos
                </p>
              </div>
              <button
                onClick={() => setModalParametrosAbierto(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                setParametrosLegales(formParametros);
                guardarParametrosConfigurados(formParametros);
                setModalParametrosAbierto(false);
              }}
              className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">SMMLV ($ COP):</label>
                  <input
                    type="number"
                    value={formParametros.smmlv}
                    onChange={e => setFormParametros(p => ({ ...p, smmlv: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C] focus:ring-2 focus:ring-[#18235C]"
                  />
                  <span className="text-[10px] text-[#282829]/70 mt-0.5 block">Oficial 2026: $1.560.000 COP</span>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Auxilio de Transporte ($ COP):</label>
                  <input
                    type="number"
                    value={formParametros.auxilioTransporte}
                    onChange={e => setFormParametros(p => ({ ...p, auxilioTransporte: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C] focus:ring-2 focus:ring-[#18235C]"
                  />
                  <span className="text-[10px] text-[#282829]/70 mt-0.5 block">Oficial 2026: $220.000 COP</span>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">UVT DIAN ($ COP):</label>
                  <input
                    type="number"
                    value={formParametros.uvt}
                    onChange={e => setFormParametros(p => ({ ...p, uvt: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C] focus:ring-2 focus:ring-[#18235C]"
                  />
                  <span className="text-[10px] text-[#282829]/70 mt-0.5 block">Oficial 2026: $52.374 COP</span>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Jornada Semanal (Horas):</label>
                  <input
                    type="number"
                    value={formParametros.horasSemanalesJornada}
                    onChange={e => {
                      const sem = Number(e.target.value) || 42;
                      const mensual = Math.round(sem * 5); // 42h -> 210h
                      setFormParametros(p => ({ ...p, horasSemanalesJornada: sem, horasMensualesJornada: mensual }));
                    }}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C] focus:ring-2 focus:ring-[#18235C]"
                  />
                  <span className="text-[10px] text-[#282829]/70 mt-0.5 block">Ley 2101/2021: 42h (divisor mensual: 210h)</span>
                </div>
              </div>

              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] space-y-1.5">
                <div className="font-bold text-[#18235C]">Porcentajes de Provisiones Prestacionales:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>Cesantías: <strong>{(formParametros.pctCesantias * 100).toFixed(2)}%</strong></div>
                  <div>Intereses: <strong>{(formParametros.pctInteresesCesantias * 100).toFixed(2)}%</strong></div>
                  <div>Prima: <strong>{(formParametros.pctPrimaServicios * 100).toFixed(2)}%</strong></div>
                  <div>Vacaciones: <strong>{(formParametros.pctVacaciones * 100).toFixed(2)}%</strong></div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[#8FA7D6]">
                <button
                  type="button"
                  onClick={() => {
                    setFormParametros(PARAMETROS_COLOMBIA_2026);
                  }}
                  className="px-3 py-2 text-xs font-bold text-[#18235C] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cargar Valores Ley 2026
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalParametrosAbierto(false)}
                    className="px-4 py-2 bg-white hover:bg-[#8FA7D6]/10 text-[#282829] border border-[#8FA7D6] rounded-xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl font-bold transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-[#00FF00]" />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
