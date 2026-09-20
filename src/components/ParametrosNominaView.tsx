import React, { useState } from 'react';
import { ParametrosLegalesNomina, ClaseRiesgoARL } from '../types';
import {
  PARAMETROS_COLOMBIA_2026,
  formatMonedaCOP,
  obtenerParametrosConfigurados,
  guardarParametrosConfigurados
} from '../services/payrollEngine';
import { guardarParametrosNominaFB } from '../lib/firebase';
import {
  Settings,
  Scale,
  ShieldCheck,
  Coins,
  Clock,
  RotateCcw,
  Check,
  AlertCircle,
  Calculator,
  Percent,
  CheckCircle2,
  HelpCircle,
  Building2,
  FileCheck
} from 'lucide-react';

interface ParametrosNominaViewProps {
  parametros?: ParametrosLegalesNomina;
  onSaveParametros?: (parametros: ParametrosLegalesNomina) => void;
  isSuperAdmin?: boolean;
}

export const ParametrosNominaView: React.FC<ParametrosNominaViewProps> = ({
  parametros,
  onSaveParametros,
  isSuperAdmin = true
}) => {
  const parametrosIniciales = parametros || obtenerParametrosConfigurados();
  const [form, setForm] = useState<ParametrosLegalesNomina>({
    ...PARAMETROS_COLOMBIA_2026,
    ...parametrosIniciales,
    tarifasARL: {
      ...PARAMETROS_COLOMBIA_2026.tarifasARL,
      ...(parametrosIniciales.tarifasARL || {})
    }
  });

  const [activeTab, setActiveTab] = useState<'generales' | 'seguridad_social' | 'prestaciones' | 'recargos' | 'simulador'>('generales');
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  // Estado del simulador interactivo
  const [simSalario, setSimSalario] = useState<number>(form.smmlv);
  const [simDias, setSimDias] = useState<number>(30);
  const [simHed, setSimHed] = useState<number>(0);
  const [simHen, setSimHen] = useState<number>(0);
  const [simRn, setSimRn] = useState<number>(0);
  const [simArlClase, setSimArlClase] = useState<ClaseRiesgoARL>('I');

  const handleGuardar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    guardarParametrosConfigurados(form);
    guardarParametrosNominaFB(form).catch(() => {});
    if (onSaveParametros) {
      onSaveParametros(form);
    }
    setMensajeGuardado('Parámetros legales de nómina guardados y aplicados exitosamente en todos los módulos.');
    setTimeout(() => setMensajeGuardado(null), 4000);
  };

  const handleCargarPreset2026 = () => {
    setForm(PARAMETROS_COLOMBIA_2026);
    setMensajeGuardado('Se han cargado los parámetros oficiales proyectados para 2026 (Ley 2101 / 42 horas). Recuerde guardar.');
    setTimeout(() => setMensajeGuardado(null), 4000);
  };

  const handleCargarPreset2025 = () => {
    setForm({
      ...PARAMETROS_COLOMBIA_2026,
      anoVigencia: 2025,
      smmlv: 1423500,
      auxilioTransporte: 200000,
      uvt: 49799,
      horasSemanalesJornada: 44,
      horasMensualesJornada: 220
    });
    setMensajeGuardado('Se han cargado los parámetros vigentes del periodo 2025 (44 horas). Recuerde guardar.');
    setTimeout(() => setMensajeGuardado(null), 4000);
  };

  // Cálculo en vivo del simulador
  const valorHoraOrd = simSalario / (form.horasMensualesJornada || 210);
  const subtotalSalarial = Math.round((simSalario / 30) * simDias);
  const tieneAuxilio = simSalario <= (form.smmlv * form.topeSmmlvAuxilioTransporte);
  const subtotalAuxilio = tieneAuxilio ? Math.round((form.auxilioTransporte / 30) * simDias) : 0;
  
  const factorHED = form.factorExtraDiurna ?? 1.25;
  const factorHEN = form.factorExtraNocturna ?? 1.75;
  const factorRN = form.factorRecargoNocturno ?? 0.35;

  const totalHed = Math.round(valorHoraOrd * factorHED * simHed);
  const totalHen = Math.round(valorHoraOrd * factorHEN * simHen);
  const totalRn = Math.round(valorHoraOrd * factorRN * simRn);
  const totalRecargos = totalHed + totalHen + totalRn;

  const simDevengado = subtotalSalarial + subtotalAuxilio + totalRecargos;
  const simIbc = Math.max(form.smmlv, subtotalSalarial + totalRecargos);

  const simSaludEmp = Math.round(simIbc * form.pctSaludEmpleado);
  const simPensionEmp = Math.round(simIbc * form.pctPensionEmpleado);
  const simDeducciones = simSaludEmp + simPensionEmp;
  const simNeto = simDevengado - simDeducciones;

  // Aportes patronales
  const esExonerado = simSalario < (form.smmlv * form.topeSmmlvExoneracionParafiscales);
  const simSaludPatron = esExonerado ? 0 : Math.round(simIbc * form.pctSaludEmpleador);
  const simPensionPatron = Math.round(simIbc * form.pctPensionEmpleador);
  const simArl = Math.round(simIbc * (form.tarifasARL[simArlClase] || 0.00522));
  const simCaja = Math.round(simIbc * form.pctCajaCompensacion);
  const simSena = esExonerado ? 0 : Math.round(simIbc * form.pctSena);
  const simIcbf = esExonerado ? 0 : Math.round(simIbc * form.pctIcbf);
  const totalAportesEmpresa = simSaludPatron + simPensionPatron + simArl + simCaja + simSena + simIcbf;

  // Provisiones
  const basePrestaciones = simDevengado;
  const baseVacaciones = simDevengado - subtotalAuxilio;
  const simCesantias = Math.round(basePrestaciones * form.pctCesantias);
  const simIntereses = Math.round(simCesantias * form.pctInteresesCesantias);
  const simPrima = Math.round(basePrestaciones * form.pctPrimaServicios);
  const simVacaciones = Math.round(baseVacaciones * form.pctVacaciones);
  const totalProvisiones = simCesantias + simIntereses + simPrima + simVacaciones;

  const costoTotalEmpresa = simDevengado + totalAportesEmpresa + totalProvisiones;

  return (
    <div className="space-y-6">
      {/* Notificación de Guardado */}
      {mensajeGuardado && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{mensajeGuardado}</span>
          </div>
          <button
            onClick={() => setMensajeGuardado(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Institucional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#8FA7D6]/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#18235C] text-white rounded-xl shadow-xs">
              <Scale className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#18235C] tracking-tight">
                  Parámetros Legales de Nómina
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#18235C] text-[#00FF00] border border-[#18235C]/30">
                  Año {form.anoVigencia}
                </span>
              </div>
              <p className="text-xs text-[#282829]/70 mt-0.5">
                Configuración de bases salariales, auxilio de transporte, porcentajes de seguridad social, parafiscales y recargos laborales (CST y Ley 2101).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCargarPreset2026}
            className="px-3 py-2 bg-white hover:bg-[#8FA7D6]/15 text-[#18235C] text-xs font-bold rounded-xl border border-[#8FA7D6] transition-colors flex items-center gap-1.5"
            title="Cargar valores oficiales con jornada de 42 horas (Ley 2101)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Preset Ley 2026</span>
          </button>

          <button
            type="button"
            onClick={handleCargarPreset2025}
            className="px-3 py-2 bg-white hover:bg-[#8FA7D6]/15 text-[#282829] text-xs font-bold rounded-xl border border-[#8FA7D6] transition-colors"
            title="Cargar valores del periodo 2025"
          >
            <span>Preset 2025</span>
          </button>

          <button
            type="button"
            onClick={() => handleGuardar()}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-[#00FF00]" />
            <span>Guardar Parámetros</span>
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#8FA7D6]/40 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('generales')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'generales'
              ? 'bg-[#18235C] text-white shadow-xs'
              : 'bg-white text-[#282829] border border-[#8FA7D6]/60 hover:bg-[#8FA7D6]/15'
          }`}
        >
          <Coins className="w-4 h-4 text-[#00FF00]" />
          <span>Salario Mínimo & Jornada</span>
        </button>

        <button
          onClick={() => setActiveTab('seguridad_social')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'seguridad_social'
              ? 'bg-[#18235C] text-white shadow-xs'
              : 'bg-white text-[#282829] border border-[#8FA7D6]/60 hover:bg-[#8FA7D6]/15'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#00FF00]" />
          <span>Seguridad Social & ARL</span>
        </button>

        <button
          onClick={() => setActiveTab('prestaciones')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'prestaciones'
              ? 'bg-[#18235C] text-white shadow-xs'
              : 'bg-white text-[#282829] border border-[#8FA7D6]/60 hover:bg-[#8FA7D6]/15'
          }`}
        >
          <FileCheck className="w-4 h-4 text-[#00FF00]" />
          <span>Prestaciones Sociales (CST)</span>
        </button>

        <button
          onClick={() => setActiveTab('recargos')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'recargos'
              ? 'bg-[#18235C] text-white shadow-xs'
              : 'bg-white text-[#282829] border border-[#8FA7D6]/60 hover:bg-[#8FA7D6]/15'
          }`}
        >
          <Clock className="w-4 h-4 text-[#00FF00]" />
          <span>Horas Extras & Recargos</span>
        </button>

        <button
          onClick={() => setActiveTab('simulador')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'simulador'
              ? 'bg-[#18235C] text-white shadow-xs'
              : 'bg-white text-[#282829] border border-[#8FA7D6]/60 hover:bg-[#8FA7D6]/15'
          }`}
        >
          <Calculator className="w-4 h-4 text-[#00FF00]" />
          <span>Simulador en Tiempo Real</span>
        </button>
      </div>

      {/* TAB 1: GENERALES, SALARIO MÍNIMO Y JORNADA */}
      {activeTab === 'generales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/40 pb-2">
              <Coins className="w-4 h-4 text-[#18235C]" />
              <span>Valores Salariales Legales</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Salario Mínimo Legal Mensual Vigente (SMMLV):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-[#18235C]">$</span>
                  <input
                    type="number"
                    value={form.smmlv}
                    onChange={e => setForm(p => ({ ...p, smmlv: Number(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C] focus:bg-white focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#282829]/70 mt-1">
                  <span>Formateado: {formatMonedaCOP(form.smmlv)}</span>
                  <span>Decreto Nacional Anual</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Auxilio Legal de Transporte:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-[#18235C]">$</span>
                  <input
                    type="number"
                    value={form.auxilioTransporte}
                    onChange={e => setForm(p => ({ ...p, auxilioTransporte: Number(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C] focus:bg-white focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#282829]/70 mt-1">
                  <span>Formateado: {formatMonedaCOP(form.auxilioTransporte)}</span>
                  <span>Ley 15 de 1959</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Tope Auxilio Transporte:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      value={form.topeSmmlvAuxilioTransporte}
                      onChange={e => setForm(p => ({ ...p, topeSmmlvAuxilioTransporte: Number(e.target.value) || 2 }))}
                      className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                    />
                    <span className="text-[11px] font-bold text-[#18235C]">SMMLV</span>
                  </div>
                  <span className="text-[10px] text-[#282829]/70 mt-1 block">Hasta {formatMonedaCOP(form.smmlv * form.topeSmmlvAuxilioTransporte)}</span>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Unidad Valor Tributario (UVT):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-[#18235C]">$</span>
                    <input
                      type="number"
                      value={form.uvt}
                      onChange={e => setForm(p => ({ ...p, uvt: Number(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                    />
                  </div>
                  <span className="text-[10px] text-[#282829]/70 mt-1 block">Para retención en la fuente DIAN</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/40 pb-2">
              <Clock className="w-4 h-4 text-[#18235C]" />
              <span>Jornada Laboral y Divisores (Ley 2101 de 2021)</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Jornada Semanal Máxima:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={form.horasSemanalesJornada || 42}
                      onChange={e => {
                        const sem = Number(e.target.value) || 42;
                        const mensual = Math.round(sem * 5); // 42h * 5 = 210h
                        setForm(p => ({ ...p, horasSemanalesJornada: sem, horasMensualesJornada: mensual }));
                      }}
                      className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                    />
                    <span className="text-[11px] font-bold text-[#18235C]">Horas</span>
                  </div>
                  <span className="text-[10px] text-[#282829]/70 mt-1 block">Reducción gradual Ley 2101</span>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Divisor Comercial Mensual:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={form.horasMensualesJornada || 210}
                      onChange={e => setForm(p => ({ ...p, horasMensualesJornada: Number(e.target.value) || 210 }))}
                      className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                    />
                    <span className="text-[11px] font-bold text-[#18235C]">Horas</span>
                  </div>
                  <span className="text-[10px] text-[#282829]/70 mt-1 block">Base para valor hora ordinaria</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#8FA7D6]/10 rounded-xl border border-[#8FA7D6]/30 space-y-1.5">
                <div className="font-bold text-[#18235C] text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#18235C]" />
                  <span>Fórmula Oficial del Valor Hora Ordinaria:</span>
                </div>
                <p className="text-[11px] text-[#282829]/80 font-mono bg-white p-2 rounded-lg border border-[#8FA7D6]/30">
                  Valor Hora = Salario Básico Mensual / {form.horasMensualesJornada || 210} horas
                </p>
                <p className="text-[11px] text-[#282829]/70">
                  Para un salario de {formatMonedaCOP(form.smmlv)}, el valor hora ordinaria calculado es de{' '}
                  <strong className="text-[#18235C]">{formatMonedaCOP(form.smmlv / (form.horasMensualesJornada || 210))}</strong>.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Tope Exoneración Parafiscales (Art. 114-1 E.T.):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.topeSmmlvExoneracionParafiscales}
                    onChange={e => setForm(p => ({ ...p, topeSmmlvExoneracionParafiscales: Number(e.target.value) || 10 }))}
                    className="w-28 px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                  <span className="text-xs text-[#282829]">
                    SMMLV (Empleados que devenguen menos de {formatMonedaCOP(form.smmlv * form.topeSmmlvExoneracionParafiscales)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEGURIDAD SOCIAL Y PARAFISCALES */}
      {activeTab === 'seguridad_social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deducciones del Trabajador */}
          <div className="bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/40 pb-2">
              <ShieldCheck className="w-4 h-4 text-[#18235C]" />
              <span>Deducciones Obligatorias del Trabajador</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">Aporte Salud Empleado:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={form.pctSaludEmpleado * 100}
                    onChange={e => setForm(p => ({ ...p, pctSaludEmpleado: (Number(e.target.value) || 0) / 100 }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                  <span className="font-bold text-[#18235C]">%</span>
                </div>
                <span className="text-[10px] text-[#282829]/70 mt-1 block">Ley 100/93: 4.0%</span>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Aporte Pensión Empleado:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={form.pctPensionEmpleado * 100}
                    onChange={e => setForm(p => ({ ...p, pctPensionEmpleado: (Number(e.target.value) || 0) / 100 }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                  <span className="font-bold text-[#18235C]">%</span>
                </div>
                <span className="text-[10px] text-[#282829]/70 mt-1 block">Ley 100/93: 4.0%</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/50 text-xs space-y-1">
              <span className="font-bold text-[#18235C]">Fondo de Solidaridad Pensional (FSP):</span>
              <p className="text-[11px] text-[#282829]/70">
                Aplica a partir de 4 SMMLV ({formatMonedaCOP(form.smmlv * 4)}) en adelante: del 1.0% al 2.0% según tabla legal del Art. 27 Ley 100 de 1993.
              </p>
            </div>
          </div>

          {/* Aportes de la Empresa y Parafiscales */}
          <div className="bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/40 pb-2">
              <Building2 className="w-4 h-4 text-[#18235C]" />
              <span>Aportes Patronales y Parafiscales</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">Pensión Patronal:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={form.pctPensionEmpleador * 100}
                    onChange={e => setForm(p => ({ ...p, pctPensionEmpleador: (Number(e.target.value) || 0) / 100 }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                  <span className="font-bold text-[#18235C]">%</span>
                </div>
                <span className="text-[10px] text-[#282829]/70 mt-0.5 block">12.0% a cargo del empleador</span>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Salud Patronal:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={form.pctSaludEmpleador * 100}
                    onChange={e => setForm(p => ({ ...p, pctSaludEmpleador: (Number(e.target.value) || 0) / 100 }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                  <span className="font-bold text-[#18235C]">%</span>
                </div>
                <span className="text-[10px] text-[#282829]/70 mt-0.5 block">8.5% (Exonerado Art 114-1 ET)</span>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Caja Compensación:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={form.pctCajaCompensacion * 100}
                    onChange={e => setForm(p => ({ ...p, pctCajaCompensacion: (Number(e.target.value) || 0) / 100 }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                  <span className="font-bold text-[#18235C]">%</span>
                </div>
                <span className="text-[10px] text-[#282829]/70 mt-0.5 block">4.0% sin exoneración</span>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">SENA:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={form.pctSena * 100}
                    onChange={e => setForm(p => ({ ...p, pctSena: (Number(e.target.value) || 0) / 100 }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                  <span className="font-bold text-[#18235C]">%</span>
                </div>
                <span className="text-[10px] text-[#282829]/70 mt-0.5 block">2.0% (Exonerado Art 114-1 ET)</span>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">ICBF:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={form.pctIcbf * 100}
                    onChange={e => setForm(p => ({ ...p, pctIcbf: (Number(e.target.value) || 0) / 100 }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                  <span className="font-bold text-[#18235C]">%</span>
                </div>
                <span className="text-[10px] text-[#282829]/70 mt-0.5 block">3.0% (Exonerado Art 114-1 ET)</span>
              </div>
            </div>
          </div>

          {/* Tarifas de Riesgos Laborales ARL */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/40 pb-2">
              <ShieldCheck className="w-4 h-4 text-[#18235C]" />
              <span>Tarifas Oficiales de Riesgos Laborales (ARL Decreto 1295/94)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              {(['I', 'II', 'III', 'IV', 'V'] as ClaseRiesgoARL[]).map(clase => (
                <div key={clase} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-[#18235C]">Clase {clase}:</span>
                    <span className="text-[10px] text-[#282829]/70">
                      {clase === 'I' ? 'Oficina' : clase === 'II' ? 'Comercio' : clase === 'III' ? 'Brigada' : clase === 'IV' ? 'Técnico/Redes' : 'Construcción'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.001"
                      value={((form.tarifasARL[clase] || 0) * 100).toFixed(3)}
                      onChange={e => {
                        const val = (Number(e.target.value) || 0) / 100;
                        setForm(p => ({
                          ...p,
                          tarifasARL: {
                            ...p.tarifasARL,
                            [clase]: val
                          }
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#8FA7D6] font-bold text-[#18235C]"
                    />
                    <span className="font-bold text-[#18235C]">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRESTACIONES SOCIALES (CST) */}
      {activeTab === 'prestaciones' && (
        <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/40 pb-2">
              <FileCheck className="w-4 h-4 text-[#18235C]" />
              <span>Porcentajes de Provisiones para Prestaciones Sociales y Descansos</span>
            </h3>
            <p className="text-xs text-[#282829]/70 mt-1">
              Factores mensuales acumulativos para las reservas de pasivo laboral según el Código Sustantivo del Trabajo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[#18235C]">Cesantías:</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Art. 249 CST</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  value={(form.pctCesantias * 100).toFixed(2)}
                  onChange={e => setForm(p => ({ ...p, pctCesantias: (Number(e.target.value) || 0) / 100 }))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">%</span>
              </div>
              <p className="text-[11px] text-[#282829]/70">
                Equivale a un mes de salario completo con auxilio de transporte por cada año de servicios laborado.
              </p>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[#18235C]">Intereses a Cesantías:</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Ley 52/1975</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  value={(form.pctInteresesCesantias * 100).toFixed(2)}
                  onChange={e => setForm(p => ({ ...p, pctInteresesCesantias: (Number(e.target.value) || 0) / 100 }))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">%</span>
              </div>
              <p className="text-[11px] text-[#282829]/70">
                12% anual sobre el saldo de las cesantías (equivalente al 1.0% mensual sobre el valor provisionado de cesantías).
              </p>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[#18235C]">Prima de Servicios:</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Art. 306 CST</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  value={(form.pctPrimaServicios * 100).toFixed(2)}
                  onChange={e => setForm(p => ({ ...p, pctPrimaServicios: (Number(e.target.value) || 0) / 100 }))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">%</span>
              </div>
              <p className="text-[11px] text-[#282829]/70">
                Equivale a 30 días de salario por año, pagaderos 15 días en junio y 15 días en los primeros 20 días de diciembre.
              </p>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[#18235C]">Vacaciones Remuneradas:</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Art. 186 CST</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  value={(form.pctVacaciones * 100).toFixed(2)}
                  onChange={e => setForm(p => ({ ...p, pctVacaciones: (Number(e.target.value) || 0) / 100 }))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">%</span>
              </div>
              <p className="text-[11px] text-[#282829]/70">
                15 días hábiles remunerados por año laborado (15/360 = 4.17%). La base legal NO incluye auxilio de transporte.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HORAS EXTRAS Y RECARGOS */}
      {activeTab === 'recargos' && (
        <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/40 pb-2">
              <Clock className="w-4 h-4 text-[#18235C]" />
              <span>Factores Multiplicadores de Horas Extras y Recargos (CST)</span>
            </h3>
            <p className="text-xs text-[#282829]/70 mt-1">
              Configuración de los porcentajes de recargo que se multiplican por el valor de la hora ordinaria del trabajador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#18235C]">Recargo Nocturno Ordinario:</span>
                <span className="text-[11px] font-bold text-[#18235C]">Art. 168 CST</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={((form.factorRecargoNocturno ?? 0.35) * 100).toFixed(0)}
                  onChange={e => setForm(p => ({ ...p, factorRecargoNocturno: (Number(e.target.value) || 0) / 100 }))}
                  className="w-24 px-3 py-1.5 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">% recargo</span>
              </div>
              <span className="text-[11px] text-[#282829]/70 block">Legal CST: 35% de recargo sobre hora ordinaria</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#18235C]">Hora Extra Diurna (HED):</span>
                <span className="text-[11px] font-bold text-[#18235C]">Art. 168 CST</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={(form.factorExtraDiurna ?? 1.25).toFixed(2)}
                  onChange={e => setForm(p => ({ ...p, factorExtraDiurna: Number(e.target.value) || 1.25 }))}
                  className="w-24 px-3 py-1.5 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">Factor (x1.25)</span>
              </div>
              <span className="text-[11px] text-[#282829]/70 block">Recargo del 25% (1.00 base + 0.25)</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#18235C]">Hora Extra Nocturna (HEN):</span>
                <span className="text-[11px] font-bold text-[#18235C]">Art. 168 CST</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={(form.factorExtraNocturna ?? 1.75).toFixed(2)}
                  onChange={e => setForm(p => ({ ...p, factorExtraNocturna: Number(e.target.value) || 1.75 }))}
                  className="w-24 px-3 py-1.5 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">Factor (x1.75)</span>
              </div>
              <span className="text-[11px] text-[#282829]/70 block">Recargo del 75% (1.00 base + 0.75)</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#18235C]">Festivo / Dominical Diurno:</span>
                <span className="text-[11px] font-bold text-[#18235C]">Art. 179 CST</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={(form.factorDominicalFestivoDiurno ?? 1.75).toFixed(2)}
                  onChange={e => setForm(p => ({ ...p, factorDominicalFestivoDiurno: Number(e.target.value) || 1.75 }))}
                  className="w-24 px-3 py-1.5 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">Factor (x1.75)</span>
              </div>
              <span className="text-[11px] text-[#282829]/70 block">Recargo del 75% por labor dominical</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#18235C]">Festivo / Dominical Nocturno:</span>
                <span className="text-[11px] font-bold text-[#18235C]">Art. 179 CST</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={(form.factorDominicalFestivoNocturno ?? 2.10).toFixed(2)}
                  onChange={e => setForm(p => ({ ...p, factorDominicalFestivoNocturno: Number(e.target.value) || 2.10 }))}
                  className="w-24 px-3 py-1.5 bg-white rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                />
                <span className="font-bold text-[#18235C]">Factor (x2.10)</span>
              </div>
              <span className="text-[11px] text-[#282829]/70 block">Recargo del 110% (75% festivo + 35% nocturno)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SIMULADOR INTERACTIVO EN VIVO */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parámetros de Entrada de la Simulación */}
          <div className="bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/40 pb-2">
              <Calculator className="w-4 h-4 text-[#18235C]" />
              <span>Datos del Trabajador de Prueba</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">Salario Básico Mensual:</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-[#18235C]">$</span>
                  <input
                    type="number"
                    value={simSalario}
                    onChange={e => setSimSalario(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setSimSalario(form.smmlv)}
                    className="px-2 py-0.5 bg-[#8FA7D6]/20 text-[#18235C] rounded text-[10px] font-bold hover:bg-[#8FA7D6]/40"
                  >
                    1 SMMLV
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimSalario(form.smmlv * 2)}
                    className="px-2 py-0.5 bg-[#8FA7D6]/20 text-[#18235C] rounded text-[10px] font-bold hover:bg-[#8FA7D6]/40"
                  >
                    2 SMMLV (Tope Aux)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimSalario(3000000)}
                    className="px-2 py-0.5 bg-[#8FA7D6]/20 text-[#18235C] rounded text-[10px] font-bold hover:bg-[#8FA7D6]/40"
                  >
                    $3.000.000
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Días Laborados:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={simDias}
                    onChange={e => setSimDias(Math.min(30, Math.max(1, Number(e.target.value) || 30)))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Clase de Riesgo ARL:</label>
                  <select
                    value={simArlClase}
                    onChange={e => setSimArlClase(e.target.value as ClaseRiesgoARL)}
                    className="w-full px-2.5 py-2 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] font-bold text-[#18235C]"
                  >
                    <option value="I">Clase I (0.522%)</option>
                    <option value="II">Clase II (1.044%)</option>
                    <option value="III">Clase III (2.436%)</option>
                    <option value="IV">Clase IV (4.350%)</option>
                    <option value="V">Clase V (6.960%)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#8FA7D6]/30 pt-3 space-y-2">
                <span className="font-bold text-[#18235C] block">Horas Extras Reportadas:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[#282829]">HED (x1.25):</label>
                    <input
                      type="number"
                      value={simHed}
                      onChange={e => setSimHed(Number(e.target.value) || 0)}
                      className="w-full p-1.5 bg-[#F8FAFC] rounded-lg border border-[#8FA7D6] font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#282829]">HEN (x1.75):</label>
                    <input
                      type="number"
                      value={simHen}
                      onChange={e => setSimHen(Number(e.target.value) || 0)}
                      className="w-full p-1.5 bg-[#F8FAFC] rounded-lg border border-[#8FA7D6] font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#282829]">Rec. Noct (35%):</label>
                    <input
                      type="number"
                      value={simRn}
                      onChange={e => setSimRn(Number(e.target.value) || 0)}
                      className="w-full p-1.5 bg-[#F8FAFC] rounded-lg border border-[#8FA7D6] font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resultado de la Liquidación del Empleado */}
          <div className="bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center justify-between border-b border-[#8FA7D6]/40 pb-2">
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#18235C]" />
                Desprendible del Trabajador
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Neto: {formatMonedaCOP(simNeto)}
              </span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#8FA7D6]/20">
                <span className="text-[#282829]">Salario proporcional ({simDias} días):</span>
                <span className="font-bold text-[#18235C]">{formatMonedaCOP(subtotalSalarial)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#8FA7D6]/20">
                <span className="text-[#282829]">Auxilio de transporte legal:</span>
                <span className={`font-bold ${subtotalAuxilio > 0 ? 'text-emerald-700' : 'text-[#282829]/60'}`}>
                  {subtotalAuxilio > 0 ? formatMonedaCOP(subtotalAuxilio) : '$0 (Supera tope)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#8FA7D6]/20">
                <span className="text-[#282829]">Recargos y horas extras:</span>
                <span className="font-bold text-[#18235C]">{formatMonedaCOP(totalRecargos)}</span>
              </div>
              <div className="flex justify-between py-1.5 bg-[#8FA7D6]/10 px-2.5 rounded-lg font-extrabold text-[#18235C]">
                <span>Total Devengado:</span>
                <span>{formatMonedaCOP(simDevengado)}</span>
              </div>

              <div className="pt-2 text-[11px] space-y-1.5">
                <div className="flex justify-between text-rose-700">
                  <span>- Salud (4% de IBC):</span>
                  <span className="font-bold">-{formatMonedaCOP(simSaludEmp)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>- Pensión (4% de IBC):</span>
                  <span className="font-bold">-{formatMonedaCOP(simPensionEmp)}</span>
                </div>
                <div className="flex justify-between py-1.5 bg-rose-50 px-2.5 rounded-lg font-bold text-rose-900">
                  <span>Total Deducciones:</span>
                  <span>-{formatMonedaCOP(simDeducciones)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Costo Corporativo de la Empresa */}
          <div className="bg-[#18235C] text-white p-5 rounded-2xl shadow-md space-y-4">
            <h3 className="font-bold text-sm text-[#00FF00] flex items-center justify-between border-b border-white/20 pb-2">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00FF00]" />
                Costo Total Empresa
              </span>
              <span className="text-xs font-mono font-bold text-white bg-white/15 px-2 py-0.5 rounded-md">
                {formatMonedaCOP(costoTotalEmpresa)}
              </span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/80">Devengado total:</span>
                <span className="font-bold">{formatMonedaCOP(simDevengado)}</span>
              </div>

              <div className="space-y-1 text-[11px] text-white/90">
                <span className="font-bold text-[#8FA7D6] block">Aportes Patronales & ARL:</span>
                <div className="flex justify-between pl-2">
                  <span>Pensión (12%):</span>
                  <span>{formatMonedaCOP(simPensionPatron)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>Salud ({esExonerado ? 'Exonerado Art 114-1' : '8.5%'}):</span>
                  <span>{formatMonedaCOP(simSaludPatron)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>ARL Clase {simArlClase}:</span>
                  <span>{formatMonedaCOP(simArl)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>Caja de Compensación (4%):</span>
                  <span>{formatMonedaCOP(simCaja)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>SENA & ICBF ({esExonerado ? 'Exonerado' : '5%'}):</span>
                  <span>{formatMonedaCOP(simSena + simIcbf)}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-white/90 pt-2 border-t border-white/10">
                <span className="font-bold text-[#8FA7D6] block">Provisiones Prestacionales:</span>
                <div className="flex justify-between pl-2">
                  <span>Cesantías (8.33%):</span>
                  <span>{formatMonedaCOP(simCesantias)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>Intereses a cesantías (1%):</span>
                  <span>{formatMonedaCOP(simIntereses)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>Prima de servicios (8.33%):</span>
                  <span>{formatMonedaCOP(simPrima)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>Vacaciones (4.17%):</span>
                  <span>{formatMonedaCOP(simVacaciones)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
