import React, { useState, useMemo } from 'react';
import { Cargo, Empleado, NovedadNominaEmpleado } from '../types';
import { PARAMETROS_COLOMBIA_2026, parseSalarioNumerico } from '../services/payrollEngine';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  Download,
  Edit2,
  FileSpreadsheet,
  HelpCircle,
  Percent,
  Plus,
  RotateCcw,
  Search,
  Sliders,
  TrendingUp,
  UserCheck,
  Users,
  X
} from 'lucide-react';

interface GestionNovedadesViewProps {
  empleados: Empleado[];
  cargos: Cargo[];
  novedadesMap?: Record<string, NovedadNominaEmpleado>;
  onUpdateNovedades?: (empleadoId: string, novedades: NovedadNominaEmpleado) => void;
  onActualizarNovedad?: (empleadoId: string, novedades: NovedadNominaEmpleado) => void;
  periodoActivo?: import('../types').PeriodoNomina;
  periodos?: import('../types').PeriodoNomina[];
  onSelectPeriodo?: (periodoCodigo: string) => void;
  onCrearPeriodo?: () => void;
}

export function GestionNovedadesView({
  empleados,
  cargos,
  novedadesMap: propNovedadesMap,
  onUpdateNovedades,
  onActualizarNovedad,
  periodoActivo,
  periodos,
  onSelectPeriodo,
  onCrearPeriodo
}: GestionNovedadesViewProps) {
  const [localNovedadesMap, setLocalNovedadesMap] = useState<Record<string, NovedadNominaEmpleado>>(() => {
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      return {};
    }
    return {
      e6: {
        diasTrabajados: 30,
        horasExtrasDiurnas: 6,
        horasExtrasNocturnas: 4,
        horasFestivasDiurnas: 0,
        horasFestivasNocturnas: 0,
        recargoNocturnoOrdinario: 12,
        bonificacionesSalariales: 0,
        bonificacionesNoSalariales: 50000,
        comisiones: 0,
        incapacidadDias: 0,
        licenciaRemuneradaDias: 0,
        prestamosYDeducciones: 0,
        otrasDeduccionesTexto: ''
      }
    };
  });

  const novedadesMap = propNovedadesMap || localNovedadesMap;
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2026-03');
  const [searchTerm, setSearchTerm] = useState('');
  const [cargoFilter, setCargoFilter] = useState('TODOS');
  const [editingEmpleadoId, setEditingEmpleadoId] = useState<string | null>(null);

  // Formulario temporal para edición de novedades
  const [tempNovedad, setTempNovedad] = useState<NovedadNominaEmpleado>({
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
    prestamosYDeducciones: 0,
    otrasDeduccionesTexto: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Abrir modal de edición
  const handleOpenEdit = (empleadoId: string) => {
    const current = novedadesMap[empleadoId] || {
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
      prestamosYDeducciones: 0,
      otrasDeduccionesTexto: ''
    };
    setTempNovedad({ ...current });
    setEditingEmpleadoId(empleadoId);
  };

  // Guardar novedades
  const handleSaveNovedad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpleadoId) return;

    if (onUpdateNovedades) {
      onUpdateNovedades(editingEmpleadoId, tempNovedad);
    }
    if (onActualizarNovedad) {
      onActualizarNovedad(editingEmpleadoId, tempNovedad);
    }
    setLocalNovedadesMap(prev => ({
      ...prev,
      [editingEmpleadoId]: tempNovedad
    }));

    const emp = empleados.find(e => e.id === editingEmpleadoId);
    showToast(`Novedades de ${emp?.nombre || 'empleado'} actualizadas con éxito.`);
    setEditingEmpleadoId(null);
  };

  // Empleados filtrados
  const filteredEmpleados = useMemo(() => {
    return empleados.filter(emp => {
      const matchSearch =
        emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.documento.includes(searchTerm);
      const matchCargo = cargoFilter === 'TODOS' || emp.cargoId === cargoFilter;
      return matchSearch && matchCargo;
    });
  }, [empleados, searchTerm, cargoFilter]);

  // Cálculos consolidados para el resumen de novedades
  const metricasNovedades = useMemo(() => {
    let totalHED = 0;
    let totalHEN = 0;
    let totalRN = 0;
    let totalComisiones = 0;
    let totalBonos = 0;
    let totalDeducciones = 0;
    let empleadosConNovedad = 0;

    empleados.forEach(emp => {
      const nov = novedadesMap[emp.id];
      if (nov) {
        const tieneNovedad =
          nov.horasExtrasDiurnas > 0 ||
          nov.horasExtrasNocturnas > 0 ||
          nov.horasFestivasDiurnas > 0 ||
          nov.horasFestivasNocturnas > 0 ||
          nov.recargoNocturnoOrdinario > 0 ||
          nov.bonificacionesSalariales > 0 ||
          nov.bonificacionesNoSalariales > 0 ||
          nov.comisiones > 0 ||
          nov.prestamosYDeducciones > 0 ||
          nov.incapacidadDias > 0;

        if (tieneNovedad) empleadosConNovedad++;

        totalHED += nov.horasExtrasDiurnas || 0;
        totalHEN += (nov.horasExtrasNocturnas || 0) + (nov.horasFestivasDiurnas || 0) + (nov.horasFestivasNocturnas || 0);
        totalRN += nov.recargoNocturnoOrdinario || 0;
        totalComisiones += nov.comisiones || 0;
        totalBonos += (nov.bonificacionesSalariales || 0) + (nov.bonificacionesNoSalariales || 0);
        totalDeducciones += nov.prestamosYDeducciones || 0;
      }
    });

    return {
      empleadosConNovedad,
      totalHED,
      totalHEN,
      totalRN,
      totalComisiones,
      totalBonos,
      totalDeducciones
    };
  }, [empleados, novedadesMap]);

  // Cálculo del valor estimado de horas para el empleado en edición
  const empleadoEnEdicion = useMemo(() => {
    return empleados.find(e => e.id === editingEmpleadoId);
  }, [empleados, editingEmpleadoId]);

  const calculoValoresHorasEdicion = useMemo(() => {
    if (!empleadoEnEdicion) return null;
    const salarioNumerico = parseSalarioNumerico(empleadoEnEdicion.contrato.salario);
    const divisorHoras = PARAMETROS_COLOMBIA_2026.horasMensualesJornada || 210;
    const valorHoraOrdinaria = salarioNumerico / divisorHoras; // 210 horas mensuales en 2026 (Ley 2101/2021)
    const valHED = valorHoraOrdinaria * 1.25; // 25% recargo extra diurna
    const valHEN = valorHoraOrdinaria * 1.75; // 75% recargo extra nocturna
    const valHEFD = valorHoraOrdinaria * 1.75; // 75% recargo festiva/dominical diurna
    const valHEFN = valorHoraOrdinaria * 2.10; // 110% recargo festiva nocturna
    const valRN = valorHoraOrdinaria * 0.35; // 35% recargo nocturno ordinario

    const subtotalHoras =
      (tempNovedad.horasExtrasDiurnas * valHED) +
      (tempNovedad.horasExtrasNocturnas * valHEN) +
      (tempNovedad.horasFestivasDiurnas * valHEFD) +
      (tempNovedad.horasFestivasNocturnas * valHEFN) +
      (tempNovedad.recargoNocturnoOrdinario * valRN);

    const subtotalAdicionales =
      tempNovedad.comisiones +
      tempNovedad.bonificacionesSalariales +
      tempNovedad.bonificacionesNoSalariales;

    const subtotalDeducciones = tempNovedad.prestamosYDeducciones;

    return {
      valorHoraOrdinaria,
      valHED,
      valHEN,
      valRN,
      subtotalHoras,
      subtotalAdicionales,
      subtotalDeducciones,
      impactoNetoEstimado: subtotalHoras + subtotalAdicionales - subtotalDeducciones
    };
  }, [empleadoEnEdicion, tempNovedad]);

  return (
    <div className="space-y-5">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#18235C] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg border border-[#8FA7D6]/30 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#E2B765]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header del Submódulo */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Nómina Electrónica & Pre-Nómina
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F8FAFC] text-[#282829] border border-[#8FA7D6]">
                CST Arts. 127, 128, 159-168
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif text-[#18235C]">
              Gestión de Novedades de Nómina
            </h2>
            <p className="text-xs sm:text-sm text-[#282829] mt-0.5 max-w-2xl">
              Reporte mensual de tiempo suplementario (horas extras, dominicales y recargos según jornada ordinaria legal de 42h semanales / 210h mensuales), comisiones, bonificaciones salariales/no salariales, licencias e incapacidades para la liquidación periódica.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#8FA7D6]">
              <Calendar className="w-4 h-4 text-[#18235C]" />
              <div className="text-xs">
                <span className="text-[10px] block text-[#282829]">Periodo a Liquidar:</span>
                <select
                  value={periodoActivo ? periodoActivo.codigoPeriodo : periodoSeleccionado}
                  onChange={e => {
                    setPeriodoSeleccionado(e.target.value);
                    if (onSelectPeriodo) onSelectPeriodo(e.target.value);
                  }}
                  className="bg-transparent font-bold text-[#18235C] focus:outline-none cursor-pointer"
                >
                  {periodos && periodos.length > 0 ? (
                    periodos.map(p => (
                      <option key={p.codigoPeriodo} value={p.codigoPeriodo}>
                        {p.nombre} ({p.tipo}) - [{p.estado}]
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="2026-03">Marzo 2026 (Mes Completo)</option>
                      <option value="2026-03-Q2">Marzo 2026 (Segunda Quincena)</option>
                      <option value="2026-02">Febrero 2026</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            {onCrearPeriodo && (
              <button
                type="button"
                onClick={onCrearPeriodo}
                className="px-2.5 py-1.5 bg-[#18235C] text-white rounded-lg text-xs font-bold hover:bg-[#101740] transition-colors"
                title="Aperturar nuevo período de nómina"
              >
                + Período
              </button>
            )}
          </div>
        </div>

        {/* Resumen de Métricas Consolidadas del Mes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-[#8FA7D6]">
          <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#8FA7D6]/70">
            <div className="text-[10px] font-semibold text-[#282829] uppercase tracking-wider flex items-center justify-between">
              Colaboradores con Novedad
              <UserCheck className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-lg font-bold text-[#18235C] mt-0.5">
              {metricasNovedades.empleadosConNovedad} <span className="text-xs font-normal text-[#282829]">/ {empleados.length}</span>
            </div>
            <div className="text-[10px] text-[#282829]">Reportados en este ciclo</div>
          </div>

          <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#8FA7D6]/70">
            <div className="text-[10px] font-semibold text-[#282829] uppercase tracking-wider flex items-center justify-between">
              Total Horas Extras
              <Clock className="w-3.5 h-3.5 text-[#B5842A]" />
            </div>
            <div className="text-lg font-bold text-[#18235C] mt-0.5">
              {metricasNovedades.totalHED + metricasNovedades.totalHEN}h
            </div>
            <div className="text-[10px] text-[#282829]">
              {metricasNovedades.totalHED}h Diurnas • {metricasNovedades.totalHEN}h Noct./Fest.
            </div>
          </div>

          <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#8FA7D6]/70">
            <div className="text-[10px] font-semibold text-[#282829] uppercase tracking-wider flex items-center justify-between">
              Comisiones y Bonos
              <TrendingUp className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-lg font-bold text-[#18235C] mt-0.5">
              {formatCOP(metricasNovedades.totalComisiones + metricasNovedades.totalBonos)}
            </div>
            <div className="text-[10px] text-[#282829]">Adicionales devengados</div>
          </div>

          <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#8FA7D6]/70">
            <div className="text-[10px] font-semibold text-[#282829] uppercase tracking-wider flex items-center justify-between">
              Deducciones Voluntarias
              <Coins className="w-3.5 h-3.5 text-[#8A2525]" />
            </div>
            <div className="text-lg font-bold text-[#8A2525] mt-0.5">
              {formatCOP(metricasNovedades.totalDeducciones)}
            </div>
            <div className="text-[10px] text-[#282829]">Préstamos / Fondo empleados</div>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="bg-white p-4 rounded-xl border border-[#8FA7D6] flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#282829] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar colaborador por nombre o cédula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#18235C]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#282829]">
            <span className="text-[11px] font-semibold">Filtrar por Cargo:</span>
            <select
              value={cargoFilter}
              onChange={e => setCargoFilter(e.target.value)}
              className="bg-[#FFFFFF] border border-[#8FA7D6] rounded-md px-2.5 py-1 text-xs text-[#18235C]"
            >
              <option value="TODOS">Todos los cargos</option>
              {cargos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Central de Novedades */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FFFFFF] text-[#282829] font-semibold uppercase tracking-wider text-[10px] border-b border-[#8FA7D6]">
                <th className="p-3.5">Colaborador</th>
                <th className="p-3.5 text-center">Días Lab.</th>
                <th className="p-3.5 text-center">H. Extras Diurnas (25%)</th>
                <th className="p-3.5 text-center">H. Extras Noct. (75%)</th>
                <th className="p-3.5 text-center">Recargo Noct. (35%)</th>
                <th className="p-3.5 text-right">Comisiones</th>
                <th className="p-3.5 text-right">Bonificaciones</th>
                <th className="p-3.5 text-right">Deducciones Vol.</th>
                <th className="p-3.5 text-center">Incap./Lic.</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8FA7D6]/60">
              {filteredEmpleados.map(emp => {
                const cargo = cargos.find(c => c.id === emp.cargoId);
                const nov = novedadesMap[emp.id] || {
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

                const tieneNovedad =
                  nov.horasExtrasDiurnas > 0 ||
                  nov.horasExtrasNocturnas > 0 ||
                  nov.recargoNocturnoOrdinario > 0 ||
                  nov.comisiones > 0 ||
                  nov.bonificacionesSalariales > 0 ||
                  nov.bonificacionesNoSalariales > 0 ||
                  nov.prestamosYDeducciones > 0 ||
                  nov.incapacidadDias > 0 ||
                  nov.diasTrabajados !== 30;

                return (
                  <tr key={emp.id} className="hover:bg-[#FFFFFF]/60 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-[#18235C]">{emp.nombre}</div>
                      <div className="text-[11px] text-[#282829]">{cargo?.nombre}</div>
                      <div className="text-[10px] text-[#8DA096]">
                        Salario: {formatCOP(emp.salarioBase)}
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-semibold text-xs ${
                        nov.diasTrabajados === 30 ? 'bg-[#FFFFFF] text-[#18235C]' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {nov.diasTrabajados} d
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      {nov.horasExtrasDiurnas > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                          {nov.horasExtrasDiurnas}h
                        </span>
                      ) : (
                        <span className="text-[#8DA096]">—</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {nov.horasExtrasNocturnas > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">
                          {nov.horasExtrasNocturnas}h
                        </span>
                      ) : (
                        <span className="text-[#8DA096]">—</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {nov.recargoNocturnoOrdinario > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold">
                          {nov.recargoNocturnoOrdinario}h
                        </span>
                      ) : (
                        <span className="text-[#8DA096]">—</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right font-medium text-[#18235C]">
                      {nov.comisiones > 0 ? (
                        <span className="text-[#18235C] font-bold">
                          {formatCOP(nov.comisiones)}
                        </span>
                      ) : (
                        <span className="text-[#8DA096]">$0</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right font-medium text-[#18235C]">
                      {(nov.bonificacionesSalariales + nov.bonificacionesNoSalariales) > 0 ? (
                        <span className="text-[#B5842A] font-bold">
                          {formatCOP(nov.bonificacionesSalariales + nov.bonificacionesNoSalariales)}
                        </span>
                      ) : (
                        <span className="text-[#8DA096]">$0</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right font-medium">
                      {nov.prestamosYDeducciones > 0 ? (
                        <span className="text-[#8A2525] font-bold">
                          -{formatCOP(nov.prestamosYDeducciones)}
                        </span>
                      ) : (
                        <span className="text-[#8DA096]">$0</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {nov.incapacidadDias > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[11px] font-bold">
                          {nov.incapacidadDias}d Incap.
                        </span>
                      ) : nov.licenciaRemuneradaDias > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[11px] font-bold">
                          {nov.licenciaRemuneradaDias}d Lic.
                        </span>
                      ) : (
                        <span className="text-[#8DA096]">0</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleOpenEdit(emp.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#18235C]/10 text-[#18235C] hover:bg-[#18235C] hover:text-white transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{tieneNovedad ? 'Editar' : 'Registrar'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredEmpleados.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[#282829]">
                    <Clock className="w-8 h-8 text-[#18235C] mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-[#18235C]">
                      {empleados.length === 0
                        ? 'Base de datos limpia: No hay colaboradores registrados'
                        : 'No se encontraron colaboradores con los filtros seleccionados'}
                    </p>
                    <p className="text-xs text-[#282829] max-w-md mx-auto mt-1">
                      {empleados.length === 0
                        ? 'Registre o importe los colaboradores de su empresa para comenzar a reportar horas extras, recargos y novedades de nómina.'
                        : 'Verifique los términos de búsqueda o cambie el filtro de cargo.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE NOVEDADES DEL EMPLEADO */}
      {editingEmpleadoId && empleadoEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#8FA7D6] max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#8FA7D6] pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C]/10 text-[#18235C]">
                  Periodo: {periodoSeleccionado}
                </span>
                <h3 className="font-bold text-base text-[#18235C] mt-0.5">
                  Novedades de Nómina: {empleadoEnEdicion.nombre}
                </h3>
                <div className="text-xs text-[#282829]">
                  CC: {empleadoEnEdicion.documento} • Salario Base: {formatCOP(empleadoEnEdicion.salarioBase)}
                </div>
              </div>
              <button
                onClick={() => setEditingEmpleadoId(null)}
                className="text-[#282829] hover:text-[#18235C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNovedad} className="space-y-4 text-xs">
              {/* Sección 1: Días Laborados y Ausentismos */}
              <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6]">
                <h4 className="font-bold text-[#18235C] mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#18235C]" />
                  1. Días Laborados y Ausencias
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      Días a Liquidar (Base 30):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={tempNovedad.diasTrabajados}
                      onChange={e => setTempNovedad({ ...tempNovedad, diasTrabajados: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5 font-bold text-[#18235C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      Incapacidad General (Días):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={tempNovedad.incapacidadDias}
                      onChange={e => setTempNovedad({ ...tempNovedad, incapacidadDias: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5"
                    />
                    <span className="text-[10px] text-[#282829]">Primeros 2 días 66.67%</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      Licencia Remunerada (Días):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={tempNovedad.licenciaRemuneradaDias}
                      onChange={e => setTempNovedad({ ...tempNovedad, licenciaRemuneradaDias: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5"
                    />
                    <span className="text-[10px] text-[#282829]">Luto, paternidad, etc.</span>
                  </div>
                </div>
              </div>

              {/* Sección 2: Horas Extras y Recargos */}
              <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6]">
                <h4 className="font-bold text-[#18235C] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#B5842A]" />
                  2. Horas Extras y Recargos Nocturnos / Festivos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      H. Extras Diurnas (25%):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={tempNovedad.horasExtrasDiurnas}
                      onChange={e => setTempNovedad({ ...tempNovedad, horasExtrasDiurnas: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5"
                    />
                    {calculoValoresHorasEdicion && (
                      <span className="text-[10px] text-[#282829]">
                        ~ {formatCOP(tempNovedad.horasExtrasDiurnas * calculoValoresHorasEdicion.valHED)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      H. Extras Nocturnas (75%):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={tempNovedad.horasExtrasNocturnas}
                      onChange={e => setTempNovedad({ ...tempNovedad, horasExtrasNocturnas: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5"
                    />
                    {calculoValoresHorasEdicion && (
                      <span className="text-[10px] text-[#282829]">
                        ~ {formatCOP(tempNovedad.horasExtrasNocturnas * calculoValoresHorasEdicion.valHEN)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      Recargo Nocturno (35%):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={tempNovedad.recargoNocturnoOrdinario}
                      onChange={e => setTempNovedad({ ...tempNovedad, recargoNocturnoOrdinario: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5"
                    />
                    {calculoValoresHorasEdicion && (
                      <span className="text-[10px] text-[#282829]">
                        ~ {formatCOP(tempNovedad.recargoNocturnoOrdinario * calculoValoresHorasEdicion.valRN)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      H. Festiva Diurna (75%):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={tempNovedad.horasFestivasDiurnas}
                      onChange={e => setTempNovedad({ ...tempNovedad, horasFestivasDiurnas: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      H. Festiva Nocturna (110%):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={tempNovedad.horasFestivasNocturnas}
                      onChange={e => setTempNovedad({ ...tempNovedad, horasFestivasNocturnas: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Pagos Adicionales y Deducciones */}
              <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6]">
                <h4 className="font-bold text-[#18235C] mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#18235C]" />
                  3. Comisiones, Bonos y Deducciones
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      Comisiones por Ventas ($):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="10000"
                      value={tempNovedad.comisiones}
                      onChange={e => setTempNovedad({ ...tempNovedad, comisiones: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5 font-medium"
                    />
                    <span className="text-[10px] text-[#282829]">Constitutivo de salario</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      Bono Salarial ($):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="10000"
                      value={tempNovedad.bonificacionesSalariales}
                      onChange={e => setTempNovedad({ ...tempNovedad, bonificacionesSalariales: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5"
                    />
                    <span className="text-[10px] text-[#282829]">Hace base de cotización</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#18235C] mb-1">
                      Deducción Préstamo / Fondo ($):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="5000"
                      value={tempNovedad.prestamosYDeducciones}
                      onChange={e => setTempNovedad({ ...tempNovedad, prestamosYDeducciones: Number(e.target.value) })}
                      className="w-full bg-white border border-[#8FA7D6] rounded px-2.5 py-1.5 text-rose-800 font-medium"
                    />
                    <span className="text-[10px] text-[#282829]">Descuento autorizado</span>
                  </div>
                </div>
              </div>

              {/* Resumen del Impacto en el Neto */}
              {calculoValoresHorasEdicion && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-emerald-800 font-semibold">
                      Impacto Neto Estimado de estas Novedades:
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      Horas: +{formatCOP(calculoValoresHorasEdicion.subtotalHoras)} • Adicionales: +{formatCOP(calculoValoresHorasEdicion.subtotalAdicionales)} • Deducciones: -{formatCOP(calculoValoresHorasEdicion.subtotalDeducciones)}
                    </div>
                  </div>
                  <div className="text-base font-bold text-emerald-900">
                    +{formatCOP(calculoValoresHorasEdicion.impactoNetoEstimado)}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]">
                <button
                  type="button"
                  onClick={() => setEditingEmpleadoId(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#8FA7D6] text-[#282829] hover:bg-[#FFFFFF]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#18235C] text-white font-semibold hover:bg-[#24493F]"
                >
                  Guardar Novedades
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
