import React, { useState, useMemo } from 'react';
import { Cargo, Empleado, LiquidacionEmpleadoNomina, ParametrosLegalesNomina, PeriodoNomina, ReservaProvisionEmpleado, CalculoPrimaSemestralResult, CalculoCesantiasResult, CalculoVacacionesResult } from '../types';
import {
  calcularConsolidadoReservas,
  calcularReservasProvisionesEmpleado,
  calcularPrimaServiciosSemestral,
  calcularCesantiasEInteresesEmpleado,
  calcularVacacionesEmpleado,
  formatMonedaCOP,
  obtenerNombreMes
} from '../services/payrollEngine';
import {
  AlertCircle,
  Building2,
  Calendar,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Layers,
  Palmtree,
  PiggyBank,
  Printer,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  X
} from 'lucide-react';

interface ReservasProvisionesViewProps {
  periodoActivo: PeriodoNomina;
  empleados: Empleado[];
  cargos: Cargo[];
  liquidaciones: LiquidacionEmpleadoNomina[];
  parametros: ParametrosLegalesNomina;
}

export function ReservasProvisionesView({
  periodoActivo,
  empleados,
  cargos,
  liquidaciones,
  parametros
}: ReservasProvisionesViewProps) {
  const [subTab, setSubTab] = useState<'detalle' | 'cesantias' | 'prima' | 'vacaciones' | 'calendario' | 'contabilidad'>('detalle');
  const [searchTerm, setSearchTerm] = useState('');
  const [cargoFilter, setCargoFilter] = useState('TODOS');
  const [modalPrimaEmpleado, setModalPrimaEmpleado] = useState<CalculoPrimaSemestralResult | null>(null);
  const [modalCesantiasEmpleado, setModalCesantiasEmpleado] = useState<CalculoCesantiasResult | null>(null);
  const [modalVacacionesEmpleado, setModalVacacionesEmpleado] = useState<CalculoVacacionesResult | null>(null);

  const mesActual = periodoActivo.mes;
  const anoActual = periodoActivo.ano;
  const nombreMes = obtenerNombreMes(mesActual);

  // 1. Cálculo individual de reservas y provisiones para cada empleado
  const reservasEmpleados: ReservaProvisionEmpleado[] = useMemo(() => {
    return liquidaciones.map(liq => {
      const emp = empleados.find(e => e.id === liq.empleadoId) || {
        id: liq.empleadoId,
        nombre: liq.empleadoNombre,
        documento: liq.empleadoDocumento,
        cargoId: '',
        area: 'Operaciones',
        correo: '',
        telefono: '',
        fechaIngreso: '2025-01-01',
        contrato: {
          tipo: liq.tipoContrato,
          salario: `$${liq.salarioBasicoPactado}`,
          inicio: '2025-01-01'
        },
        documentosFirmados: true,
        evaluacionesPendientes: 0
      } as unknown as Empleado;

      return calcularReservasProvisionesEmpleado(emp, liq, mesActual, anoActual, parametros);
    });
  }, [liquidaciones, empleados, mesActual, anoActual, parametros]);

  // 2. Cálculo mensual y acumulado de Cesantías e Intereses (Art. 249 CST y Ley 50/1990)
  const calculosCesantias: CalculoCesantiasResult[] = useMemo(() => {
    return liquidaciones.map(liq => {
      const emp = empleados.find(e => e.id === liq.empleadoId) || {
        id: liq.empleadoId,
        nombre: liq.empleadoNombre,
        documento: liq.empleadoDocumento,
        cargoId: '',
        area: 'Operaciones',
        correo: '',
        telefono: '',
        fechaIngreso: '2025-01-01',
        contrato: {
          tipo: liq.tipoContrato,
          salario: `$${liq.salarioBasicoPactado}`,
          inicio: '2025-01-01'
        },
        documentosFirmados: true,
        evaluacionesPendientes: 0
      } as unknown as Empleado;

      return calcularCesantiasEInteresesEmpleado(emp, liq, mesActual, anoActual, parametros);
    });
  }, [liquidaciones, empleados, mesActual, anoActual, parametros]);

  // Consolidado de Cesantías
  const consolidadoCesantias = useMemo(() => {
    const totalCesantiasAcumuladas = calculosCesantias.reduce((acc, c) => acc + c.cesantiasAcumuladasYTD, 0);
    const totalInteresesAcumulados = calculosCesantias.reduce((acc, c) => acc + c.interesesCesantiasAcumuladosYTD, 0);
    const totalProvisionMensualCesantias = calculosCesantias.reduce((acc, c) => acc + c.provisionMensualCesantias, 0);
    const totalProvisionMensualIntereses = calculosCesantias.reduce((acc, c) => acc + c.provisionMensualIntereses, 0);
    const conDerechoCount = calculosCesantias.filter(c => !c.esSalarioIntegral && c.baseSalarioCesantias > 0).length;
    return {
      totalCesantiasAcumuladas,
      totalInteresesAcumulados,
      totalProvisionMensualCesantias,
      totalProvisionMensualIntereses,
      conDerechoCount
    };
  }, [calculosCesantias]);

  // 3. Cálculo semestral de Prima de Servicios (Art. 306 CST) por empleado
  const calculosPrimaSemestral: CalculoPrimaSemestralResult[] = useMemo(() => {
    return liquidaciones.map(liq => {
      const emp = empleados.find(e => e.id === liq.empleadoId) || {
        id: liq.empleadoId,
        nombre: liq.empleadoNombre,
        documento: liq.empleadoDocumento,
        cargoId: '',
        area: 'Operaciones',
        correo: '',
        telefono: '',
        fechaIngreso: '2025-01-01',
        contrato: {
          tipo: liq.tipoContrato,
          salario: `$${liq.salarioBasicoPactado}`,
          inicio: '2025-01-01'
        },
        documentosFirmados: true,
        evaluacionesPendientes: 0
      } as unknown as Empleado;

      return calcularPrimaServiciosSemestral(emp, liq, mesActual, anoActual, parametros);
    });
  }, [liquidaciones, empleados, mesActual, anoActual, parametros]);

  // Consolidado de Prima Semestral
  const consolidadoPrima = useMemo(() => {
    const totalSemestralCausada = calculosPrimaSemestral.reduce((acc, c) => acc + c.primaSemestralCausada, 0);
    const totalProvisionMensual = calculosPrimaSemestral.reduce((acc, c) => acc + c.primaMensualProvision, 0);
    const conDerechoCount = calculosPrimaSemestral.filter(c => !c.esSalarioIntegral && c.baseSalarioPromedio > 0).length;
    return {
      totalSemestralCausada,
      totalProvisionMensual,
      conDerechoCount
    };
  }, [calculosPrimaSemestral]);

  // 4. Cálculo mensual y pasivo acumulado de Vacaciones (Art. 186 CST - 4.17%) por empleado
  const calculosVacaciones: CalculoVacacionesResult[] = useMemo(() => {
    return liquidaciones.map(liq => {
      const emp = empleados.find(e => e.id === liq.empleadoId) || {
        id: liq.empleadoId,
        nombre: liq.empleadoNombre,
        documento: liq.empleadoDocumento,
        cargoId: '',
        area: 'Operaciones',
        correo: '',
        telefono: '',
        fechaIngreso: '2025-01-01',
        contrato: {
          tipo: liq.tipoContrato,
          salario: `$${liq.salarioBasicoPactado}`,
          inicio: '2025-01-01'
        },
        documentosFirmados: true,
        evaluacionesPendientes: 0
      } as unknown as Empleado;

      return calcularVacacionesEmpleado(emp, liq, mesActual, anoActual, parametros);
    });
  }, [liquidaciones, empleados, mesActual, anoActual, parametros]);

  // Consolidado de Vacaciones
  const consolidadoVacaciones = useMemo(() => {
    const totalVacacionesAcumuladas = calculosVacaciones.reduce((acc, v) => acc + v.vacacionesAcumuladasYTD, 0);
    const totalProvisionMensualVacaciones = calculosVacaciones.reduce((acc, v) => acc + v.provisionMensualVacaciones, 0);
    const totalDiasPendientes = calculosVacaciones.reduce((acc, v) => acc + v.diasPendientesDisfrute, 0);
    const conDerechoCount = calculosVacaciones.filter(v => v.baseSalarioVacaciones > 0).length;
    return {
      totalVacacionesAcumuladas,
      totalProvisionMensualVacaciones,
      totalDiasPendientes,
      conDerechoCount
    };
  }, [calculosVacaciones]);

  // 5. Consolidado corporativo total de reservas
  const consolidado = useMemo(() => {
    return calcularConsolidadoReservas(reservasEmpleados);
  }, [reservasEmpleados]);

  // Filtrado de la tabla de reservas
  const reservasFiltradas = useMemo(() => {
    return reservasEmpleados.filter(item => {
      const matchSearch =
        item.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cargoNombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCargo = cargoFilter === 'TODOS' || item.cargoNombre === cargoFilter;
      return matchSearch && matchCargo;
    });
  }, [reservasEmpleados, searchTerm, cargoFilter]);

  // Filtrado de Cesantías
  const cesantiasFiltradas = useMemo(() => {
    return calculosCesantias.filter(item => {
      const matchSearch =
        item.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cargoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fondoCesantias.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCargo = cargoFilter === 'TODOS' || item.cargoNombre === cargoFilter;
      return matchSearch && matchCargo;
    });
  }, [calculosCesantias, searchTerm, cargoFilter]);

  // Filtrado de Prima Semestral
  const primasFiltradas = useMemo(() => {
    return calculosPrimaSemestral.filter(item => {
      const matchSearch =
        item.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cargoNombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCargo = cargoFilter === 'TODOS' || item.cargoNombre === cargoFilter;
      return matchSearch && matchCargo;
    });
  }, [calculosPrimaSemestral, searchTerm, cargoFilter]);

  // Filtrado de Vacaciones
  const vacacionesFiltradas = useMemo(() => {
    return calculosVacaciones.filter(item => {
      const matchSearch =
        item.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cargoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.documento.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCargo = cargoFilter === 'TODOS' || item.cargoNombre === cargoFilter;
      return matchSearch && matchCargo;
    });
  }, [calculosVacaciones, searchTerm, cargoFilter]);

  // Factor porcentual de carga prestacional corporativa
  const factorCargaPrestacionalPct = consolidado.totalSalarioBasico > 0
    ? ((consolidado.totalProvisionesMes + consolidado.totalCargaPatronalMes) / consolidado.totalSalarioBasico) * 100
    : 52.8;

  // Exportar reporte de reservas a CSV
  const handleExportarCSV = () => {
    const headers = [
      'Empleado',
      'Cargo',
      'Salario Básico',
      'Base Prestaciones',
      'Días Acumulados Año',
      'Provisión Cesantías Mes (8.33%)',
      'Provisión Intereses Mes (1%)',
      'Provisión Prima Mes (8.33%)',
      'Provisión Vacaciones Mes (4.17%)',
      'Total Provisiones Mes',
      'Cesantías Acumuladas YTD',
      'Intereses Acumulados YTD',
      'Prima Acumulada Semestre',
      'Vacaciones Acumuladas YTD',
      'Pasivo Prestacional Acumulado',
      'Pensión Empleador (12%)',
      'ARL',
      'Caja Compensación (4%)',
      'Total Carga Patronal',
      'Costo Total Empresa'
    ];

    const rows = reservasEmpleados.map(r => [
      `"${r.empleadoNombre}"`,
      `"${r.cargoNombre}"`,
      r.salarioBasico,
      r.basePrestaciones,
      r.diasAcumuladosAno,
      r.cesantiasMes,
      r.interesesCesantiasMes,
      r.primaServiciosMes,
      r.vacacionesMes,
      r.totalProvisionesMes,
      r.cesantiasAcumuladas,
      r.interesesCesantiasAcumulados,
      r.primaServiciosAcumulada,
      r.vacacionesAcumuladas,
      r.totalPasivoAcumulado,
      r.pensionPatronalMes,
      r.arlMes,
      r.cajaCompensacionMes,
      r.totalCargaPatronalMes,
      r.totalCostoEmpresaMes
    ]);

    const csvContent = [
      `# B GROUP INGENIERIA S.A.S. - REPORTE CONSOLIDADO DE RESERVAS Y PROVISIONES`,
      `# Período: ${periodoActivo.nombre} (${nombreMes} ${anoActual})`,
      `# Generado: ${new Date().toLocaleString('es-CO')}`,
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reservas_Provisiones_${periodoActivo.codigoPeriodo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header del Submódulo de Reservas y Provisiones */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8FA7D6]/20 text-[#18235C] border border-[#8FA7D6] flex items-center gap-1">
                <PiggyBank className="w-3.5 h-3.5 text-[#18235C]" />
                Carga Prestacional & Pasivos Laborales CST
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8FA7D6]/10 text-[#282829] border border-[#8FA7D6]">
                Ley 50/1990 • Art. 186, 249, 306 CST
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#18235C]">
              Cálculo y Reservas de Provisiones de Nómina
            </h2>
            <p className="text-xs sm:text-sm text-[#282829] mt-0.5 max-w-2xl">
              Monitoreo y causación periódica de prestaciones sociales legales (Cesantías 8.33%, Intereses 1%, Prima 8.33%, Vacaciones 4.17%) y pasivos acumulados proyectados para garantizar la solvencia contable y el flujo de caja de <strong>B GROUP INGENIERIA S.A.S.</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={handleExportarCSV}
              className="px-3.5 py-2 text-xs font-bold bg-[#FFFFFF] hover:bg-[#8FA7D6]/10 text-[#18235C] rounded-xl border border-[#8FA7D6] flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Descargar cálculo de provisiones en formato Excel/CSV"
            >
              <Download className="w-4 h-4 text-[#18235C]" />
              <span>Exportar Reservas (CSV)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold bg-[#18235C] hover:bg-[#101740] text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Imprimir informe contable de provisiones"
            >
              <Printer className="w-4 h-4 text-[#00FF00]" />
              <span>Imprimir Reporte</span>
            </button>
          </div>
        </div>

        {/* 4 Tarjetas de Métricas de Provisiones */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-[#8FA7D6]">
          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Provisión Mensual Prestaciones
              <TrendingUp className="w-4 h-4 text-[#18235C]" />
            </div>
            <div className="text-lg font-black text-[#18235C]">
              {formatMonedaCOP(consolidado.totalProvisionesMes)}
            </div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
              Causado en {nombreMes} {anoActual} (8.33% + 1% + 8.33% + 4.17%)
            </div>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Pasivo Prestacional Acumulado
              <PiggyBank className="w-4 h-4 text-[#18235C]" />
            </div>
            <div className="text-lg font-black text-[#18235C]">
              {formatMonedaCOP(consolidado.totalPasivoAcumulado)}
            </div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
              Reserva acumulada en {anoActual} ({mesActual} meses de causación)
            </div>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Aportes Patronales Mes
              <Building2 className="w-4 h-4 text-[#18235C]" />
            </div>
            <div className="text-lg font-black text-[#18235C]">
              {formatMonedaCOP(consolidado.totalCargaPatronalMes)}
            </div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
              Pensión (12%), ARL y Caja de Compensación (4%)
            </div>
          </div>

          <div className="p-4 bg-[#18235C] rounded-xl border border-[#101740] shadow-sm text-white">
            <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider mb-1 flex items-center justify-between">
              Carga Prestacional Total
              <Scale className="w-4 h-4 text-[#00FF00]" />
            </div>
            <div className="text-lg font-black text-[#00FF00]">
              {factorCargaPrestacionalPct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-white/80 mt-0.5 font-medium">
              Sobrecosto legal patronal sobre el básico nominal
            </div>
          </div>
        </div>

        {/* Selector de subpestañas */}
        <div className="flex border-b border-[#8FA7D6] mt-6 gap-4 text-xs font-bold overflow-x-auto pb-0.5">
          <button
            onClick={() => setSubTab('detalle')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              subTab === 'detalle'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Detalle de Provisiones por Colaborador
          </button>
          <button
            onClick={() => setSubTab('cesantias')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              subTab === 'cesantias'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5 text-blue-700" />
            Provisión Cesantías e Intereses (Ley 50/1990)
          </button>
          <button
            onClick={() => setSubTab('prima')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              subTab === 'prima'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            Provisión Prima Semestral (Art. 306 CST)
          </button>
          <button
            onClick={() => setSubTab('vacaciones')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              subTab === 'vacaciones'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5 text-emerald-600" />
            Provisión Vacaciones (4.17% - Art. 186 CST)
          </button>
          <button
            onClick={() => setSubTab('calendario')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              subTab === 'calendario'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendario de Desembolsos y Vencimientos Legales
          </button>
          <button
            onClick={() => setSubTab('contabilidad')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              subTab === 'contabilidad'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Comprobante Contable de Causación (PUC / NIIF)
          </button>
        </div>
      </div>

      {/* SUBTAB 1: DETALLE DE PROVISIONES POR COLABORADOR */}
      {subTab === 'detalle' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8FA7D6]" />
              <input
                type="text"
                placeholder="Buscar por colaborador o cargo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-[#282829] placeholder-[#282829]/50 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#18235C] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Cargo:
              </span>
              <select
                value={cargoFilter}
                onChange={e => setCargoFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#8FA7D6] rounded-xl text-xs text-[#282829] font-medium focus:outline-none"
              >
                <option value="TODOS">Todos los Cargos ({reservasEmpleados.length})</option>
                {Array.from(new Set(reservasEmpleados.map(r => r.cargoNombre))).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Reservas y Provisiones */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Colaborador / Cargo</th>
                    <th className="py-3 px-3">Base Salarial</th>
                    <th className="py-3 px-3">Días YTD</th>
                    <th className="py-3 px-3 bg-[#101740]">Cesantías (8.33%)</th>
                    <th className="py-3 px-3 bg-[#101740]">Intereses (1%)</th>
                    <th className="py-3 px-3 bg-[#101740]">Prima Serv. (8.33%)</th>
                    <th className="py-3 px-3 bg-[#101740]">Vacaciones (4.17%)</th>
                    <th className="py-3 px-3 font-bold text-[#00FF00]">Provisión Mes</th>
                    <th className="py-3 px-3 font-bold text-amber-300">Pasivo Acumulado</th>
                    <th className="py-3 px-3">Aportes Patronales</th>
                    <th className="py-3 px-3">Costo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20 bg-white">
                  {reservasFiltradas.map(item => (
                    <tr key={item.empleadoId} className="hover:bg-[#8FA7D6]/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#18235C]">{item.empleadoNombre}</div>
                        <div className="text-[10px] text-[#282829]/70">{item.cargoNombre}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#282829]">{formatMonedaCOP(item.salarioBasico)}</div>
                        <div className="text-[10px] text-[#282829]/60">Base: {formatMonedaCOP(item.basePrestaciones)}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#282829]">
                        {item.diasAcumuladosAno} d <span className="text-[10px] text-[#282829]/60">({item.mesesAcumuladosAno}m)</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#18235C]">
                        <div>{formatMonedaCOP(item.cesantiasMes)}</div>
                        <div className="text-[10px] text-[#282829]/60">YTD: {formatMonedaCOP(item.cesantiasAcumuladas)}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#18235C]">
                        <div>{formatMonedaCOP(item.interesesCesantiasMes)}</div>
                        <div className="text-[10px] text-[#282829]/60">YTD: {formatMonedaCOP(item.interesesCesantiasAcumulados)}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#18235C]">
                        <div>{formatMonedaCOP(item.primaServiciosMes)}</div>
                        <div className="text-[10px] text-[#282829]/60">Sem: {formatMonedaCOP(item.primaServiciosAcumulada)}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#18235C]">
                        <div>{formatMonedaCOP(item.vacacionesMes)}</div>
                        <div className="text-[10px] text-[#282829]/60">YTD: {formatMonedaCOP(item.vacacionesAcumuladas)}</div>
                      </td>
                      <td className="py-3 px-3 font-black text-[#18235C] bg-[#8FA7D6]/10">
                        {formatMonedaCOP(item.totalProvisionesMes)}
                      </td>
                      <td className="py-3 px-3 font-black text-amber-800 bg-amber-50">
                        {formatMonedaCOP(item.totalPasivoAcumulado)}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#282829]">
                        <div>{formatMonedaCOP(item.totalCargaPatronalMes)}</div>
                        <div className="text-[10px] text-[#282829]/60">Pensión, ARL, Caja</div>
                      </td>
                      <td className="py-3 px-3 font-black text-[#18235C]">
                        {formatMonedaCOP(item.totalCostoEmpresaMes)}
                      </td>
                    </tr>
                  ))}
                  {reservasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-[#282829]/70">
                        <Users className="w-8 h-8 text-[#8FA7D6] mx-auto mb-2 opacity-60" />
                        No se encontraron colaboradores con los criterios seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#8FA7D6]/20 font-bold text-xs text-[#18235C] border-t-2 border-[#8FA7D6]">
                    <td className="py-3.5 px-3">TOTALES PROVISIONES ({reservasFiltradas.length})</td>
                    <td className="py-3.5 px-3">{formatMonedaCOP(consolidado.totalSalarioBasico)}</td>
                    <td className="py-3.5 px-3">—</td>
                    <td className="py-3.5 px-3 font-black">{formatMonedaCOP(consolidado.totalCesantiasMes)}</td>
                    <td className="py-3.5 px-3 font-black">{formatMonedaCOP(consolidado.totalInteresesCesantiasMes)}</td>
                    <td className="py-3.5 px-3 font-black">{formatMonedaCOP(consolidado.totalPrimaServiciosMes)}</td>
                    <td className="py-3.5 px-3 font-black">{formatMonedaCOP(consolidado.totalVacacionesMes)}</td>
                    <td className="py-3.5 px-3 font-black text-[#18235C] text-sm bg-[#8FA7D6]/30">
                      {formatMonedaCOP(consolidado.totalProvisionesMes)}
                    </td>
                    <td className="py-3.5 px-3 font-black text-amber-900 bg-amber-100">
                      {formatMonedaCOP(consolidado.totalPasivoAcumulado)}
                    </td>
                    <td className="py-3.5 px-3 font-bold">{formatMonedaCOP(consolidado.totalCargaPatronalMes)}</td>
                    <td className="py-3.5 px-3 font-black text-[#18235C]">{formatMonedaCOP(consolidado.totalCostoEmpresaMes)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PROVISIÓN MENSUAL Y ACUMULADA DE CESANTÍAS E INTERESES (LEY 50/1990) */}
      {subTab === 'cesantias' && (
        <div className="space-y-4">
          {/* Banner Normativo Legal Cesantías */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-blue-300 p-5 shadow-sm bg-gradient-to-r from-blue-50/50 to-white">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl font-bold border border-blue-200 shrink-0">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-[#18235C] flex items-center gap-2">
                  Motor de Provisión Mensual de Cesantías (8.33%) e Intereses a Cesantías (Ley 50/1990 • Art. 249 CST)
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-200 text-blue-900 border border-blue-300 font-bold">
                    Causación Mensual Obligatoria
                  </span>
                </h3>
                <p className="text-xs text-[#282829] leading-relaxed">
                  Las cesantías constituyen un auxilio legal monetario equivalente a <strong>un (1) mes de salario por cada año de servicios prestados</strong> (o proporcional). La empresa debe causar mensualmente el <strong>8.33%</strong> de la base computable (Salario Básico + Auxilio de Transporte en &le; 2 SMMLV + Recargos salariales) y el <strong>1% mensual</strong> de intereses sobre cesantías (12% anual - Ley 52/1975).
                </p>
                <div className="pt-2 text-[11px] text-[#18235C] font-semibold flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong>Fórmula Provisión Mes:</strong> Base Computable × 8.33% (Cesantías) + Base × 1% (Intereses)</span>
                  <span><strong>Tope Auxilio Transporte:</strong> 2 SMMLV (${formatMonedaCOP(parametros.smmlv * 2)})</span>
                  <span><strong>Consignación Fondos:</strong> Límite 14 de Febrero</span>
                  <span><strong>Pago Intereses:</strong> Límite 31 de Enero (Directo a nómina)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Tarjetas de Métricas de Cesantías */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Cesantías Acumuladas YTD
                <Building2 className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-xl font-black text-blue-900">
                {formatMonedaCOP(consolidadoCesantias.totalCesantiasAcumuladas)}
              </div>
              <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
                Pasivo acumulado para consignar a Fondos (14 Feb)
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Intereses Cesantías YTD (12%)
                <Coins className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-900">
                {formatMonedaCOP(consolidadoCesantias.totalInteresesAcumulados)}
              </div>
              <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
                Para pago directo en nómina (31 Ene)
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Provisión Mensual Mes (8.33%)
                <TrendingUp className="w-4 h-4 text-[#18235C]" />
              </div>
              <div className="text-xl font-black text-[#18235C]">
                {formatMonedaCOP(consolidadoCesantias.totalProvisionMensualCesantias)}
              </div>
              <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
                Gasto causado en {nombreMes} {anoActual} (+ {formatMonedaCOP(consolidadoCesantias.totalProvisionMensualIntereses)} intereses)
              </div>
            </div>

            <div className="p-4 bg-[#18235C] rounded-xl border border-[#101740] text-white shadow-sm">
              <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider mb-1 flex items-center justify-between">
                Colaboradores con Derecho
                <Users className="w-4 h-4 text-[#00FF00]" />
              </div>
              <div className="text-xl font-black text-[#00FF00]">
                {consolidadoCesantias.conDerechoCount} <span className="text-xs text-white/70 font-normal">/ {calculosCesantias.length} colaboradores</span>
              </div>
              <div className="text-[10px] text-white/80 mt-0.5 font-medium">
                Excluye Salario Integral y Prestación de Servicios
              </div>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8FA7D6]" />
              <input
                type="text"
                placeholder="Buscar colaborador, cargo o fondo de cesantías..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-[#282829] placeholder-[#282829]/50 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#18235C] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Cargo:
              </span>
              <select
                value={cargoFilter}
                onChange={e => setCargoFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#8FA7D6] rounded-xl text-xs text-[#282829] font-medium focus:outline-none"
              >
                <option value="TODOS">Todos los Cargos ({calculosCesantias.length})</option>
                {Array.from(new Set(calculosCesantias.map(r => r.cargoNombre))).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla Desagregada de Cesantías e Intereses */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Colaborador / Fondo</th>
                    <th className="py-3 px-3">Salario Básico</th>
                    <th className="py-3 px-3">Derecho Aux. Transp</th>
                    <th className="py-3 px-3">Recargos / Comisiones</th>
                    <th className="py-3 px-3 bg-[#101740]">Base Computable</th>
                    <th className="py-3 px-3">Días YTD</th>
                    <th className="py-3 px-3 bg-[#101740]">Provisión Cesantías (8.33%)</th>
                    <th className="py-3 px-3 bg-[#101740]">Provisión Intereses (1%)</th>
                    <th className="py-3 px-3 font-bold text-blue-300 bg-blue-950">Cesantías Acumuladas</th>
                    <th className="py-3 px-3 font-bold text-amber-300 bg-amber-950">Intereses Acumulados</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20 bg-white">
                  {cesantiasFiltradas.map(item => (
                    <tr key={item.empleadoId} className="hover:bg-[#8FA7D6]/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#18235C]">{item.empleadoNombre}</div>
                        <div className="text-[10px] text-[#282829]/70">{item.cargoNombre}</div>
                        <div className="text-[9px] text-blue-700 font-semibold mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Fondo: {item.fondoCesantias}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#282829]">
                        {formatMonedaCOP(item.salarioBasico)}
                        {item.esSalarioIntegral && (
                          <span className="block text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-0.5">
                            Salario Integral
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.tieneDerechoAuxilioTransporte ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3 text-emerald-700" />
                            Aplica ({formatMonedaCOP(item.auxilioTransporte)})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 w-fit" title="No aplica: Salario superior a 2 SMMLV ($3.501.810) o Salario Integral">
                            <X className="w-3 h-3 text-slate-500" />
                            No Aplica (&gt;2 SMMLV)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#282829]">
                        {formatMonedaCOP(item.promedioComisionesYRecargos)}
                      </td>
                      <td className="py-3 px-3 font-black text-[#18235C] bg-[#8FA7D6]/10">
                        {formatMonedaCOP(item.baseSalarioCesantias)}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#282829]">
                        <div className="font-bold text-[#18235C]">{item.diasLaboradosAno} d</div>
                        <div className="text-[10px] text-[#282829]/60">({Number((item.diasLaboradosAno / 30).toFixed(1))} meses)</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#18235C]">
                        {formatMonedaCOP(item.provisionMensualCesantias)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#18235C]">
                        {formatMonedaCOP(item.provisionMensualIntereses)}
                      </td>
                      <td className="py-3 px-3 font-black text-blue-900 bg-blue-50">
                        {formatMonedaCOP(item.cesantiasAcumuladasYTD)}
                      </td>
                      <td className="py-3 px-3 font-black text-amber-900 bg-amber-50">
                        {formatMonedaCOP(item.interesesCesantiasAcumuladosYTD)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setModalCesantiasEmpleado(item)}
                          className="px-2.5 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto transition-colors shadow-2xs"
                          title="Ver fórmulas, desglose paso a paso e historial del colaborador"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-300" />
                          Auditar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cesantiasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-[#282829]/70">
                        <Users className="w-8 h-8 text-[#8FA7D6] mx-auto mb-2 opacity-60" />
                        No se encontraron colaboradores con los criterios seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-100 font-bold text-xs text-blue-950 border-t-2 border-blue-300">
                    <td className="py-3.5 px-3" colSpan={4}>TOTAL CESANTÍAS E INTERESES PROVISIONADOS ({cesantiasFiltradas.length} Empleados)</td>
                    <td className="py-3.5 px-3 font-black">{formatMonedaCOP(cesantiasFiltradas.reduce((a, b) => a + b.baseSalarioCesantias, 0))}</td>
                    <td className="py-3.5 px-3">—</td>
                    <td className="py-3.5 px-3 font-black text-[#18235C]">{formatMonedaCOP(cesantiasFiltradas.reduce((a, b) => a + b.provisionMensualCesantias, 0))}</td>
                    <td className="py-3.5 px-3 font-black text-[#18235C]">{formatMonedaCOP(cesantiasFiltradas.reduce((a, b) => a + b.provisionMensualIntereses, 0))}</td>
                    <td className="py-3.5 px-3 font-black text-blue-950 text-sm bg-blue-200 border-x border-blue-400">
                      {formatMonedaCOP(cesantiasFiltradas.reduce((a, b) => a + b.cesantiasAcumuladasYTD, 0))}
                    </td>
                    <td className="py-3.5 px-3 font-black text-amber-950 text-sm bg-amber-200 border-r border-amber-400">
                      {formatMonedaCOP(cesantiasFiltradas.reduce((a, b) => a + b.interesesCesantiasAcumuladosYTD, 0))}
                    </td>
                    <td className="py-3.5 px-3 text-center text-[10px] text-[#18235C]">Fondo / Ene 31</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORÍA Y DESGLOSE DE CESANTÍAS E INTERESES */}
      {modalCesantiasEmpleado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#8FA7D6] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-[#18235C] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-300 border border-blue-400/30">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Auditoría de Provisión de Cesantías e Intereses — Ley 50/1990
                  </h3>
                  <p className="text-xs text-white/80">
                    {modalCesantiasEmpleado.empleadoNombre} • {modalCesantiasEmpleado.cargoNombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCesantiasEmpleado(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Resumen del Resultado */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 uppercase">
                    Cesantías Acumuladas YTD
                  </div>
                  <div className="text-2xl font-black text-blue-900 mt-0.5">
                    {formatMonedaCOP(modalCesantiasEmpleado.cesantiasAcumuladasYTD)}
                  </div>
                  <div className="text-[11px] text-blue-800 mt-1 font-medium">
                    Fondo: <strong>{modalCesantiasEmpleado.fondoCesantias}</strong> • Consignación límite: {modalCesantiasEmpleado.fechaLimiteConsignacionFondo}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-xs font-bold text-amber-900 uppercase">
                    Intereses sobre Cesantías (12%)
                  </div>
                  <div className="text-2xl font-black text-amber-900 mt-0.5">
                    {formatMonedaCOP(modalCesantiasEmpleado.interesesCesantiasAcumuladosYTD)}
                  </div>
                  <div className="text-[11px] text-amber-800 mt-1 font-medium">
                    Pago directo a nómina límite: {modalCesantiasEmpleado.fechaLimitePagoIntereses}
                  </div>
                </div>
              </div>

              {/* Paso 1: Salario Básico y Verificación Auxilio de Transporte */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#18235C]" />
                  Paso 1: Salario Básico y Regla de Auxilio de Transporte (Art. 249 CST)
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-semibold block">Salario Básico Pactado:</span>
                    <span className="font-bold text-slate-800 text-sm">{formatMonedaCOP(modalCesantiasEmpleado.salarioBasico)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Auxilio de Transporte Computable:</span>
                    <span className="font-bold text-slate-800 text-sm">{formatMonedaCOP(modalCesantiasEmpleado.auxilioTransporte)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-semibold block">Regulación de Auxilio de Transporte en Prestaciones Sociales:</span>
                    <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                      {modalCesantiasEmpleado.tieneDerechoAuxilioTransporte ? (
                        <span className="text-emerald-800 font-semibold">
                          ✔ Aplica Auxilio de Transporte (${formatMonedaCOP(parametros.auxilioTransporte)}). Dado que el salario (${formatMonedaCOP(modalCesantiasEmpleado.salarioBasico)}) no supera 2 SMMLV (${formatMonedaCOP(parametros.smmlv * 2)}), se incorpora por mandato legal a la base de cálculo de cesantías.
                        </span>
                      ) : (
                        <span className="text-slate-700 font-semibold">
                          ✖ No aplica Auxilio de Transporte ($0 COP). El salario (${formatMonedaCOP(modalCesantiasEmpleado.salarioBasico)}) supera el tope legal de 2 SMMLV (${formatMonedaCOP(parametros.smmlv * 2)}) o es Salario Integral.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 2: Base Computable y Provisión Mensual */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#18235C]" />
                  Paso 2: Base Salarial Computable y Causación Mensual (8.33%)
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Salario Básico + Auxilio de Transporte + Comisiones/Recargos:</span>
                    <span className="font-bold text-[#18235C] text-sm">{formatMonedaCOP(modalCesantiasEmpleado.baseSalarioCesantias)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Provisión Mes Cesantías (8.33%):</span>
                      <span className="font-black text-blue-900 text-sm">{formatMonedaCOP(modalCesantiasEmpleado.provisionMensualCesantias)}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Provisión Mes Intereses (1%):</span>
                      <span className="font-black text-amber-900 text-sm">{formatMonedaCOP(modalCesantiasEmpleado.provisionMensualIntereses)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 3: Fórmula Legal y Acumulado */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#18235C]" />
                  Paso 3: Proyección Acumulada Anual y Obligación Patronal
                </h4>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs font-mono space-y-2 text-blue-950">
                  <div className="text-[11px] font-sans text-blue-900 font-bold">
                    Fórmula Ley 50/1990: Cesantías = (Base Salarial Computable × Días Laborados Año) ÷ 360
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-200 text-xs font-bold">
                    Cesantías = ({formatMonedaCOP(modalCesantiasEmpleado.baseSalarioCesantias)} × {modalCesantiasEmpleado.diasLaboradosAno}) ÷ 360 = <span className="text-blue-900 text-sm font-black">{formatMonedaCOP(modalCesantiasEmpleado.cesantiasAcumuladasYTD)}</span>
                  </div>
                  <div className="text-[11px] font-sans text-amber-900 font-bold pt-1">
                    Fórmula Ley 52/1975: Intereses = (Cesantías Acumuladas × Días Laborados × 0.12) ÷ 360 = <span className="text-amber-900 font-black">{formatMonedaCOP(modalCesantiasEmpleado.interesesCesantiasAcumuladosYTD)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-[#18235C] border border-[#8FA7D6] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir Comprobante
              </button>
              <button
                onClick={() => setModalCesantiasEmpleado(null)}
                className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold transition-colors"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PROVISIÓN Y LIQUIDACIÓN DE PRIMA DE SERVICIOS SEMESTRAL (ART. 306 CST) */}
      {subTab === 'prima' && (
        <div className="space-y-4">
          {/* Banner Normativo Legal Prima */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-amber-300 p-5 shadow-sm bg-gradient-to-r from-amber-50/50 to-white">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl font-bold border border-amber-200 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-[#18235C] flex items-center gap-2">
                  Motor de Cálculo y Causación de Prima de Servicios Semestral (Art. 306 CST - Ley 1788/2016)
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 border border-amber-300 font-bold">
                    Causación Semestral
                  </span>
                </h3>
                <p className="text-xs text-[#282829] leading-relaxed">
                  La prima de servicios equivale a un (1) mes de salario por cada año laborado (o proporcional por fracción) pagadero en dos cuotas: la primera a más tardar el <strong>30 de junio</strong> (1er semestre) y la segunda en los primeros 20 días de <strong>diciembre</strong> (2do semestre).
                </p>
                <div className="pt-2 text-[11px] text-[#18235C] font-semibold flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong>Fórmula Legal:</strong> Prima Semestral = (Base Salarial Computable × Días Laborados Semestre) ÷ 360</span>
                  <span><strong>Tope Auxilio Transporte:</strong> 2 SMMLV (${formatMonedaCOP(parametros.smmlv * 2)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjetas de Métricas Resumen Prima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Prima Semestral Acumulada
                <Coins className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-800">
                {formatMonedaCOP(consolidadoPrima.totalSemestralCausada)}
              </div>
              <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
                Pasivo causado en el semestre {mesActual <= 6 ? '1 (Ene - Jun)' : '2 (Jul - Dic)'}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Provisión Mensual Global (8.33%)
                <TrendingUp className="w-4 h-4 text-[#18235C]" />
              </div>
              <div className="text-xl font-black text-[#18235C]">
                {formatMonedaCOP(consolidadoPrima.totalProvisionMensual)}
              </div>
              <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
                Gasto mensual causado en {nombreMes} {anoActual}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Colaboradores con Derecho
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-xl font-black text-[#18235C]">
                {consolidadoPrima.conDerechoCount} <span className="text-xs text-[#282829]/60 font-normal">/ {calculosPrimaSemestral.length} activos</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">
                Excluye Salario Integral y Prestación de Servicios
              </div>
            </div>

            <div className="p-4 bg-[#18235C] rounded-xl border border-[#101740] text-white shadow-sm">
              <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider mb-1 flex items-center justify-between">
                Próximo Pago Límite Legal
                <Clock className="w-4 h-4 text-[#00FF00]" />
              </div>
              <div className="text-lg font-black text-[#00FF00]">
                {mesActual <= 6 ? `30 de Junio de ${anoActual}` : `20 de Diciembre de ${anoActual}`}
              </div>
              <div className="text-[10px] text-white/80 mt-0.5 font-medium">
                Semestre {mesActual <= 6 ? '1' : '2'} en curso
              </div>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8FA7D6]" />
              <input
                type="text"
                placeholder="Buscar colaborador o cargo para consultar prima..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-[#282829] placeholder-[#282829]/50 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#18235C] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Cargo:
              </span>
              <select
                value={cargoFilter}
                onChange={e => setCargoFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#8FA7D6] rounded-xl text-xs text-[#282829] font-medium focus:outline-none"
              >
                <option value="TODOS">Todos los Cargos ({calculosPrimaSemestral.length})</option>
                {Array.from(new Set(calculosPrimaSemestral.map(r => r.cargoNombre))).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla Desagregada de Prima Semestral por Empleado */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Colaborador / Cargo</th>
                    <th className="py-3 px-3">Salario Básico</th>
                    <th className="py-3 px-3">Derecho Aux. Transp</th>
                    <th className="py-3 px-3">Recargos / Comisiones</th>
                    <th className="py-3 px-3 bg-[#101740]">Base Computable Prima</th>
                    <th className="py-3 px-3">Días Semestre</th>
                    <th className="py-3 px-3 bg-[#101740]">Provisión Mes (8.33%)</th>
                    <th className="py-3 px-3 font-bold text-amber-300 bg-amber-950">Prima Acumulada Semestre</th>
                    <th className="py-3 px-3">Fecha Límite</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20 bg-white">
                  {primasFiltradas.map(item => (
                    <tr key={item.empleadoId} className="hover:bg-[#8FA7D6]/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#18235C]">{item.empleadoNombre}</div>
                        <div className="text-[10px] text-[#282829]/70">{item.cargoNombre}</div>
                        <div className="text-[9px] text-[#282829]/50 font-mono">Doc: {item.documento}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#282829]">
                        {formatMonedaCOP(item.salarioBasico)}
                        {item.esSalarioIntegral && (
                          <span className="block text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-0.5">
                            Salario Integral
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.tieneDerechoAuxilioTransporte ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3 text-emerald-700" />
                            Aplica ({formatMonedaCOP(item.auxilioTransporte)})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 w-fit" title="No aplica: Salario superior a 2 SMMLV ($3.501.810) o Salario Integral">
                            <X className="w-3 h-3 text-slate-500" />
                            No Aplica (&gt;2 SMMLV)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#282829]">
                        {formatMonedaCOP(item.promedioComisionesYRecargos)}
                      </td>
                      <td className="py-3 px-3 font-black text-[#18235C] bg-[#8FA7D6]/10">
                        {formatMonedaCOP(item.baseSalarioPromedio)}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#282829]">
                        <div className="font-bold text-[#18235C]">{item.diasLaboradosSemestre} / 180 días</div>
                        <div className="text-[10px] text-[#282829]/60">({item.diasEquivalentesPrima} días salario)</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#18235C]">
                        {formatMonedaCOP(item.primaMensualProvision)}
                      </td>
                      <td className="py-3 px-3 font-black text-amber-900 bg-amber-50">
                        {formatMonedaCOP(item.primaSemestralCausada)}
                      </td>
                      <td className="py-3 px-3 font-medium text-[11px] text-[#282829]">
                        {item.fechaPagoLimite}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setModalPrimaEmpleado(item)}
                          className="px-2.5 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto transition-colors shadow-2xs"
                          title="Ver fórmulas, desglose paso a paso e historial del colaborador"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          Auditar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {primasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-[#282829]/70">
                        <Users className="w-8 h-8 text-[#8FA7D6] mx-auto mb-2 opacity-60" />
                        No se encontraron colaboradores con los criterios seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-100 font-bold text-xs text-amber-950 border-t-2 border-amber-300">
                    <td className="py-3.5 px-3" colSpan={4}>TOTAL PRIMA SEMESTRAL PROVISIONADA ({primasFiltradas.length} Empleados)</td>
                    <td className="py-3.5 px-3 font-black">{formatMonedaCOP(primasFiltradas.reduce((a, b) => a + b.baseSalarioPromedio, 0))}</td>
                    <td className="py-3.5 px-3">—</td>
                    <td className="py-3.5 px-3 font-black text-[#18235C]">{formatMonedaCOP(primasFiltradas.reduce((a, b) => a + b.primaMensualProvision, 0))}</td>
                    <td className="py-3.5 px-3 font-black text-amber-950 text-sm bg-amber-200 border-x border-amber-400">
                      {formatMonedaCOP(primasFiltradas.reduce((a, b) => a + b.primaSemestralCausada, 0))}
                    </td>
                    <td className="py-3.5 px-3" colSpan={2}>Pago Límite {mesActual <= 6 ? 'Jun 30' : 'Dic 20'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORÍA Y DESGROSE DE PRIMA SEMESTRAL DE EMPLEADO */}
      {modalPrimaEmpleado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#8FA7D6] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-[#18235C] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-300 border border-amber-400/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Auditoría de Prima de Servicios — CST Art. 306
                  </h3>
                  <p className="text-xs text-white/80">
                    {modalPrimaEmpleado.empleadoNombre} • {modalPrimaEmpleado.cargoNombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalPrimaEmpleado(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Resumen del Resultado */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900 uppercase">
                    Prima Semestral Acumulada Causada
                  </div>
                  <div className="text-2xl font-black text-amber-900 mt-0.5">
                    {formatMonedaCOP(modalPrimaEmpleado.primaSemestralCausada)}
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5 font-medium">
                    Semestre {modalPrimaEmpleado.semestre} {modalPrimaEmpleado.ano} • Días laborados: {modalPrimaEmpleado.diasLaboradosSemestre} / 180 días ({modalPrimaEmpleado.diasEquivalentesPrima} días salario)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-900">
                    Provisión Mensual (8.33%)
                  </div>
                  <div className="text-lg font-black text-[#18235C]">
                    {formatMonedaCOP(modalPrimaEmpleado.primaMensualProvision)}
                  </div>
                  <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                    Pago Límite: {modalPrimaEmpleado.fechaPagoLimite}
                  </div>
                </div>
              </div>

              {/* Paso 1: Salario Básico y Verificación Auxilio de Transporte */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#18235C]" />
                  Paso 1: Análisis de Base Salarial y Auxilio de Transporte
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-semibold block">Salario Básico Pactado:</span>
                    <span className="font-bold text-slate-800 text-sm">{formatMonedaCOP(modalPrimaEmpleado.salarioBasico)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Auxilio de Transporte Computable:</span>
                    <span className="font-bold text-slate-800 text-sm">{formatMonedaCOP(modalPrimaEmpleado.auxilioTransporte)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-semibold block">Justificación Legal Auxilio de Transporte (Art. 306 CST):</span>
                    <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                      {modalPrimaEmpleado.tieneDerechoAuxilioTransporte ? (
                        <span className="text-emerald-800 font-semibold">
                          ✔ Aplica Auxilio de Transporte (${formatMonedaCOP(parametros.auxilioTransporte)}). El salario básico (${formatMonedaCOP(modalPrimaEmpleado.salarioBasico)}) no supera 2 SMMLV (${formatMonedaCOP(parametros.smmlv * 2)}). Se suma de forma legal a la base de prima.
                        </span>
                      ) : (
                        <span className="text-slate-700 font-semibold">
                          ✖ No aplica Auxilio de Transporte ($0 COP). El salario básico (${formatMonedaCOP(modalPrimaEmpleado.salarioBasico)}) supera el tope legal de 2 SMMLV (${formatMonedaCOP(parametros.smmlv * 2)}) o es Salario Integral. Conforme al Código Sustantivo del Trabajo, no integra la base prestacional.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 2: Recargos y Comisiones */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#18235C]" />
                  Paso 2: Promedio de Comisiones, Horas Extras y Recargos Salariales
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Promedio Recargos Nocturnos / Dominicales y Horas Extras:</span>
                    <span className="font-bold text-slate-800">{formatMonedaCOP(modalPrimaEmpleado.promedioComisionesYRecargos)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-[#18235C] text-sm">
                    <span>Base Salarial Computable Prima:</span>
                    <span>{formatMonedaCOP(modalPrimaEmpleado.baseSalarioPromedio)}</span>
                  </div>
                </div>
              </div>

              {/* Paso 3: Aplicación de la Fórmula Oficial CST */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#18235C]" />
                  Paso 3: Aplicación de la Fórmula Legal CST
                </h4>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-xs font-mono space-y-2 text-indigo-950">
                  <div className="text-[11px] font-sans text-indigo-900 font-bold">
                    Fórmula: Prima = (Base Salarial Computable × Días Laborados) ÷ 360
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-200 text-xs font-bold">
                    Prima = ({formatMonedaCOP(modalPrimaEmpleado.baseSalarioPromedio)} × {modalPrimaEmpleado.diasLaboradosSemestre}) ÷ 360 = <span className="text-amber-700 text-sm font-black">{formatMonedaCOP(modalPrimaEmpleado.primaSemestralCausada)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-[#18235C] border border-[#8FA7D6] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir Liquidación
              </button>
              <button
                onClick={() => setModalPrimaEmpleado(null)}
                className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold transition-colors"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PROVISIÓN Y PASIVO DE VACACIONES REMUNERADAS (ART. 186 A 192 CST - 4.17%) */}
      {subTab === 'vacaciones' && (
        <div className="space-y-4">
          {/* Banner Normativo Legal de Vacaciones */}
          <div className="bg-[#FFFFFF] rounded-2xl border-2 border-emerald-300 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <Palmtree className="w-3.5 h-3.5 text-emerald-700" />
                  Descanso Anual Remunerado • Artículos 186 a 192 del CST
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-[#18235C] border border-[#8FA7D6]">
                  Provisión: 4.17% (15 días / 360)
                </span>
              </div>
              <h3 className="text-xl font-black text-[#18235C]">
                Provisión Mensual y Pasivo Consolidado de Vacaciones
              </h3>
              <p className="text-xs text-[#282829] max-w-3xl leading-relaxed">
                Por cada año de servicios continuos (360 días comerciales), el trabajador adquiere el derecho a <strong>15 días hábiles continuos de vacaciones remuneradas</strong> (equivalente a <strong>1.25 días por mes laborado</strong>). La provisión mensual equivale al <strong>4.17% del salario básico</strong>. Conforme al <em>Artículo 192 del CST</em>, la base <strong>NO incluye el Auxilio de Transporte</strong> dado que durante el descanso no se incurre en gastos de desplazamiento.
              </p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs shrink-0 md:text-right space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 uppercase block">Base Legal Computable</span>
              <span className="font-bold text-emerald-900 text-sm">Salario Básico Exclusivo</span>
              <span className="text-[10px] text-emerald-800 block">Excluye Auxilio de Transporte (Art. 192 CST)</span>
            </div>
          </div>

          {/* 4 Tarjetas de Métricas de Vacaciones */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Pasivo Acumulado Vacaciones
                <PiggyBank className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-xl font-black text-[#18235C]">
                {formatMonedaCOP(consolidadoVacaciones.totalVacacionesAcumuladas)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                Causado a {nombreMes} {anoActual}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Provisión Mensual Total
                <TrendingUp className="w-4 h-4 text-[#18235C]" />
              </div>
              <div className="text-xl font-black text-[#18235C]">
                {formatMonedaCOP(consolidadoVacaciones.totalProvisionMensualVacaciones)}
              </div>
              <div className="text-[10px] text-[#282829]/70 mt-0.5 font-medium">
                4.17% sobre nómina básica de {nombreMes}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs">
              <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
                Días Pendientes de Disfrute
                <Palmtree className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-xl font-black text-[#18235C]">
                {consolidadoVacaciones.totalDiasPendientes.toFixed(1)} <span className="text-xs text-[#282829]/60 font-normal">días acumulados</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">
                1.25 días causados por colaborador / mes
              </div>
            </div>

            <div className="p-4 bg-[#18235C] rounded-xl border border-[#101740] text-white shadow-sm">
              <div className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider mb-1 flex items-center justify-between">
                Colaboradores Habilitados
                <Users className="w-4 h-4 text-[#00FF00]" />
              </div>
              <div className="text-xl font-black text-[#00FF00]">
                {consolidadoVacaciones.conDerechoCount} <span className="text-xs text-white/70 font-normal">/ {calculosVacaciones.length} activos</span>
              </div>
              <div className="text-[10px] text-white/80 mt-0.5 font-medium">
                Incluye Salario Integral y Ordinario
              </div>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8FA7D6]" />
              <input
                type="text"
                placeholder="Buscar colaborador o cargo para consultar pasivo de vacaciones..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-[#282829] placeholder-[#282829]/50 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#18235C] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Cargo:
              </span>
              <select
                value={cargoFilter}
                onChange={e => setCargoFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#8FA7D6] rounded-xl text-xs text-[#282829] font-medium focus:outline-none"
              >
                <option value="TODOS">Todos los Cargos ({calculosVacaciones.length})</option>
                {Array.from(new Set(calculosVacaciones.map(r => r.cargoNombre))).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla Desagregada de Vacaciones por Empleado */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Colaborador / Cargo</th>
                    <th className="py-3 px-3">Salario Básico</th>
                    <th className="py-3 px-3">Aux. Transporte</th>
                    <th className="py-3 px-3 bg-[#101740]">Base Vacaciones (Art. 192)</th>
                    <th className="py-3 px-3">Días Causados Mes</th>
                    <th className="py-3 px-3">Días Pendientes</th>
                    <th className="py-3 px-3 bg-[#101740]">Provisión Mes (4.17%)</th>
                    <th className="py-3 px-3 font-bold text-emerald-300 bg-emerald-950">Pasivo Acumulado Vacaciones</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20 bg-white">
                  {vacacionesFiltradas.map(item => (
                    <tr key={item.empleadoId} className="hover:bg-[#8FA7D6]/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#18235C]">{item.empleadoNombre}</div>
                        <div className="text-[10px] text-[#282829]/70">{item.cargoNombre}</div>
                        <div className="text-[9px] text-[#282829]/50 font-mono">
                          Doc: {item.documento} {item.fechaIngreso ? `• Ingreso: ${item.fechaIngreso}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#282829]">
                        {formatMonedaCOP(item.salarioBasico)}
                        {item.esSalarioIntegral && (
                          <span className="block text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-0.5">
                            Salario Integral (Causa Vacaciones)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 w-fit" title="No se incluye por ley (Art. 192 CST)">
                          <X className="w-3 h-3 text-slate-500" />
                          Excluido por Ley
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black text-[#18235C] bg-[#8FA7D6]/10">
                        {formatMonedaCOP(item.baseSalarioVacaciones)}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#282829]">
                        <span className="font-bold text-[#18235C]">{item.diasCausadosMes} días</span>
                        <span className="text-[10px] text-[#282829]/60 block">(1.25d / mes)</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#282829]">
                        <div className="font-bold text-emerald-800">{item.diasPendientesDisfrute} días</div>
                        <div className="text-[10px] text-[#282829]/60">({item.diasLaboradosAno} días año)</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#18235C]">
                        {formatMonedaCOP(item.provisionMensualVacaciones)}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-900 bg-emerald-50">
                        {formatMonedaCOP(item.vacacionesAcumuladasYTD)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setModalVacacionesEmpleado(item)}
                          className="px-2.5 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto transition-colors shadow-2xs"
                          title="Ver fórmulas, desglose paso a paso de vacaciones e historial del colaborador"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          Auditar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vacacionesFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#282829]/70">
                        <Users className="w-8 h-8 text-[#8FA7D6] mx-auto mb-2 opacity-60" />
                        No se encontraron colaboradores con los criterios seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-100 font-bold text-xs text-emerald-950 border-t-2 border-emerald-300">
                    <td className="py-3.5 px-3" colSpan={3}>TOTAL VACACIONES PROVISIONADAS ({vacacionesFiltradas.length} Empleados)</td>
                    <td className="py-3.5 px-3 font-black">{formatMonedaCOP(vacacionesFiltradas.reduce((a, b) => a + b.baseSalarioVacaciones, 0))}</td>
                    <td className="py-3.5 px-3">—</td>
                    <td className="py-3.5 px-3 font-black text-emerald-900">{vacacionesFiltradas.reduce((a, b) => a + b.diasPendientesDisfrute, 0).toFixed(1)} días</td>
                    <td className="py-3.5 px-3 font-black text-[#18235C]">{formatMonedaCOP(vacacionesFiltradas.reduce((a, b) => a + b.provisionMensualVacaciones, 0))}</td>
                    <td className="py-3.5 px-3 font-black text-emerald-950 text-sm bg-emerald-200 border-x border-emerald-400">
                      {formatMonedaCOP(vacacionesFiltradas.reduce((a, b) => a + b.vacacionesAcumuladasYTD, 0))}
                    </td>
                    <td className="py-3.5 px-3 text-center text-[10px] text-emerald-900 font-bold">Art. 186 CST</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORÍA Y DESGLOSE DE VACACIONES DE EMPLEADO */}
      {modalVacacionesEmpleado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#8FA7D6] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-[#18235C] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300 border border-emerald-400/30">
                  <Palmtree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Auditoría de Vacaciones Remuneradas — CST Art. 186 a 192
                  </h3>
                  <p className="text-xs text-white/80">
                    {modalVacacionesEmpleado.empleadoNombre} • {modalVacacionesEmpleado.cargoNombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalVacacionesEmpleado(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Resumen del Resultado */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900 uppercase">
                    Pasivo Consolidado Acumulado de Vacaciones
                  </div>
                  <div className="text-2xl font-black text-emerald-900 mt-0.5">
                    {formatMonedaCOP(modalVacacionesEmpleado.vacacionesAcumuladasYTD)}
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5 font-medium">
                    {modalVacacionesEmpleado.diasPendientesDisfrute} días acumulados pendientes • Base: {formatMonedaCOP(modalVacacionesEmpleado.baseSalarioVacaciones)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-900">
                    Provisión Mensual (4.17%)
                  </div>
                  <div className="text-lg font-black text-[#18235C]">
                    {formatMonedaCOP(modalVacacionesEmpleado.provisionMensualVacaciones)}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                    {modalVacacionesEmpleado.diasCausadosMes} días causados en {nombreMes}
                  </div>
                </div>
              </div>

              {/* Paso 1: Salario Básico y Exclusión Auxilio de Transporte */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#18235C]" />
                  Paso 1: Salario Base Computable y Exclusión Legal del Auxilio de Transporte
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-semibold block">Salario Básico Pactado:</span>
                    <span className="font-bold text-slate-800 text-sm">{formatMonedaCOP(modalVacacionesEmpleado.salarioBasico)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Auxilio de Transporte:</span>
                    <span className="font-bold text-slate-800 text-sm">$0 COP (Excluido)</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-semibold block">Fundamento Legal (Art. 192 CST):</span>
                    <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                      El <strong>Artículo 192 del Código Sustantivo del Trabajo</strong> y la reiterada jurisprudencia de la Sala de Casación Laboral de la Corte Suprema de Justicia establecen que la remuneración de las vacaciones corresponde al salario ordinario básico. El <strong>Auxilio de Transporte NO forma parte de la base</strong> porque su propósito exclusivo es subsidiar la movilización al puesto de trabajo, gasto inexistente durante el período de descanso remunerado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 2: Días Laborados y Causación */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#18235C]" />
                  Paso 2: Días de Descanso Causados (Art. 186 CST)
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-semibold block">Días Laborados en el Año ({modalVacacionesEmpleado.ano}):</span>
                    <span className="font-bold text-slate-800 text-sm">{modalVacacionesEmpleado.diasLaboradosAno} días</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Días de Vacaciones Causados:</span>
                    <span className="font-bold text-slate-800 text-sm">{modalVacacionesEmpleado.diasPendientesDisfrute} días hábiles</span>
                  </div>
                  <div className="col-span-2 text-[11px] text-slate-600">
                    Proporción: (15 días ÷ 360 días anuales) × {modalVacacionesEmpleado.diasLaboradosAno} días = {modalVacacionesEmpleado.diasCausadosAno} días (o 1.25 días por mes de 30 días).
                  </div>
                </div>
              </div>

              {/* Paso 3: Fórmulas Matemáticas */}
              <div className="space-y-2 border-t border-[#8FA7D6]/30 pt-4">
                <h4 className="text-xs font-bold text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#18235C]" />
                  Paso 3: Fórmulas y Sustitución de Valores
                </h4>
                <div className="space-y-2 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 font-mono text-xs">
                  <div className="text-[11px] font-sans text-indigo-900 font-bold">
                    1. Provisión Mensual = Salario Básico × 4.17%
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-200 text-xs font-bold">
                    Provisión Mes = {formatMonedaCOP(modalVacacionesEmpleado.baseSalarioVacaciones)} × 0.0417 = <span className="text-[#18235C] font-black">{formatMonedaCOP(modalVacacionesEmpleado.provisionMensualVacaciones)}</span>
                  </div>
                  <div className="text-[11px] font-sans text-indigo-900 font-bold pt-1">
                    2. Pasivo Acumulado = (Salario Básico × Días Pendientes) ÷ 30
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-200 text-xs font-bold">
                    Pasivo = ({formatMonedaCOP(modalVacacionesEmpleado.baseSalarioVacaciones)} × {modalVacacionesEmpleado.diasPendientesDisfrute}) ÷ 30 = <span className="text-emerald-800 font-black">{formatMonedaCOP(modalVacacionesEmpleado.vacacionesAcumuladasYTD)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-[#18235C] border border-[#8FA7D6] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir Liquidación
              </button>
              <button
                onClick={() => setModalVacacionesEmpleado(null)}
                className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold transition-colors"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CALENDARIO DE DESEMBOLSOS Y VENCIMIENTOS LEGALES */}
      {subTab === 'calendario' && (
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#18235C] mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#18235C]" />
              Cronograma Legal de Liquidación y Desembolso de Prestaciones Sociales (Colombia)
            </h3>
            <p className="text-xs text-[#282829] mb-6">
              Las reservas calculadas por el sistema permiten anticipar con exactitud las fechas perentorias de pago según la normatividad laboral colombiana para evitar intereses de mora o sanciones por el Código Sustantivo del Trabajo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta 1: Intereses de Cesantías */}
              <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#18235C] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#18235C]" />
                    Intereses sobre Cesantías (12% anual)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C] text-white">
                    Límite: 31 de Enero
                  </span>
                </div>
                <div className="text-xs text-[#282829] leading-relaxed">
                  <strong>Forma de pago:</strong> Se paga directamente al colaborador en su cuenta de nómina en la última nómina de enero o a más tardar el 31 de enero.
                </div>
                <div className="p-2.5 bg-[#8FA7D6]/10 rounded-lg text-[11px] text-[#18235C] font-semibold flex justify-between">
                  <span>Reserva acumulada para desembolso en enero:</span>
                  <span className="font-black">{formatMonedaCOP(consolidado.totalInteresesCesantiasAcumulados)}</span>
                </div>
                <div className="text-[10px] text-[#282829]/70">
                  Fundamento legal: Ley 52 de 1975 y Decreto 116 de 1976. Sanción: Pago del doble de los intereses si no se cancelan oportunamente.
                </div>
              </div>

              {/* Tarjeta 2: Consignación de Cesantías */}
              <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#18235C] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#18235C]" />
                    Consignación de Cesantías a Fondos
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white">
                    Límite: 14 de Febrero
                  </span>
                </div>
                <div className="text-xs text-[#282829] leading-relaxed">
                  <strong>Forma de pago:</strong> No se entrega en efectivo al trabajador. Debe consignarse en el fondo administrador elegido por el colaborador (Porvenir, Protección, Colfondos, FNA).
                </div>
                <div className="p-2.5 bg-[#8FA7D6]/10 rounded-lg text-[11px] text-[#18235C] font-semibold flex justify-between">
                  <span>Reserva acumulada para consignación:</span>
                  <span className="font-black">{formatMonedaCOP(consolidado.totalCesantiasAcumuladas)}</span>
                </div>
                <div className="text-[10px] text-rose-700 font-medium">
                  Sanción moratoria estricta: Un (1) día de salario por cada día de retardo a favor del trabajador (Art. 99 Ley 50/1990).
                </div>
              </div>

              {/* Tarjeta 3: Prima de Servicios 1er Semestre */}
              <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#18235C] flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-[#18235C]" />
                    Prima de Servicios — Primer Semestre
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C] text-white">
                    Límite: 30 de Junio
                  </span>
                </div>
                <div className="text-xs text-[#282829] leading-relaxed">
                  <strong>Forma de pago:</strong> Pago directo al empleado correspondiente a 15 días de salario por el período trabajado entre el 1 de enero y el 30 de junio.
                </div>
                <div className="p-2.5 bg-[#8FA7D6]/10 rounded-lg text-[11px] text-[#18235C] font-semibold flex justify-between">
                  <span>Proyección de desembolso a junio:</span>
                  <span className="font-black">{formatMonedaCOP(consolidado.totalPrimaServiciosAcumulada)}</span>
                </div>
                <div className="text-[10px] text-[#282829]/70">
                  Fundamento legal: Artículo 306 del Código Sustantivo del Trabajo (CST).
                </div>
              </div>

              {/* Tarjeta 4: Prima de Servicios 2do Semestre */}
              <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#18235C] flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-[#18235C]" />
                    Prima de Servicios — Segundo Semestre
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C] text-white">
                    Límite: 20 de Diciembre
                  </span>
                </div>
                <div className="text-xs text-[#282829] leading-relaxed">
                  <strong>Forma de pago:</strong> Pago directo al empleado correspondiente a 15 días de salario por el período trabajado entre el 1 de julio y el 31 de diciembre.
                </div>
                <div className="p-2.5 bg-[#8FA7D6]/10 rounded-lg text-[11px] text-[#18235C] font-semibold flex justify-between">
                  <span>Cálculo mensual de provisión semestral:</span>
                  <span className="font-black">{formatMonedaCOP(consolidado.totalPrimaServiciosMes * 6)} (estimado semestre)</span>
                </div>
                <div className="text-[10px] text-[#282829]/70">
                  Debe pagarse a más tardar en los primeros veinte (20) días del mes de diciembre.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: COMPROBANTE CONTABLE DE CAUSACIÓN PUC / NIIF */}
      {subTab === 'contabilidad' && (
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-4 border-b border-[#8FA7D6]">
              <div>
                <h3 className="text-base font-bold text-[#18235C] flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#18235C]" />
                  Comprobante Contable de Causación de Provisiones y Carga Laboral
                </h3>
                <p className="text-xs text-[#282829]">
                  Asiento contable bajo NIIF / PUC para contabilizar el gasto de personal vs pasivos estimados en el período {nombreMes} {anoActual}.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Partida Doble Cuadrada (Débito = Crédito)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#8FA7D6] rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-[#18235C] text-white uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Cuenta PUC</th>
                    <th className="py-2.5 px-3">Descripción de la Cuenta</th>
                    <th className="py-2.5 px-3">Naturaleza</th>
                    <th className="py-2.5 px-3 text-right">Débito ($)</th>
                    <th className="py-2.5 px-3 text-right">Crédito ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20 bg-white">
                  {/* Gastos de Personal (Débitos) */}
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">510530</td>
                    <td className="py-2 px-3 text-[#282829]">Gasto Cesantías (Beneficio a empleados)</td>
                    <td className="py-2 px-3 font-semibold text-blue-700">Débito (Gasto)</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalCesantiasMes)}</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">510533</td>
                    <td className="py-2 px-3 text-[#282829]">Gasto Intereses sobre cesantías</td>
                    <td className="py-2 px-3 font-semibold text-blue-700">Débito (Gasto)</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalInteresesCesantiasMes)}</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">510536</td>
                    <td className="py-2 px-3 text-[#282829]">Gasto Prima de servicios</td>
                    <td className="py-2 px-3 font-semibold text-blue-700">Débito (Gasto)</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalPrimaServiciosMes)}</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">510539</td>
                    <td className="py-2 px-3 text-[#282829]">Gasto Vacaciones (Causación legal)</td>
                    <td className="py-2 px-3 font-semibold text-blue-700">Débito (Gasto)</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalVacacionesMes)}</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">510570</td>
                    <td className="py-2 px-3 text-[#282829]">Gasto Aportes Pensión Empleador (12%)</td>
                    <td className="py-2 px-3 font-semibold text-blue-700">Débito (Gasto)</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalPensionPatronalMes)}</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">510568</td>
                    <td className="py-2 px-3 text-[#282829]">Gasto Aportes ARL Riesgos Laborales</td>
                    <td className="py-2 px-3 font-semibold text-blue-700">Débito (Gasto)</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalArlMes)}</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">510572</td>
                    <td className="py-2 px-3 text-[#282829]">Gasto Caja de Compensación Familiar (4%)</td>
                    <td className="py-2 px-3 font-semibold text-blue-700">Débito (Gasto)</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalCajaCompensacionMes)}</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                  </tr>

                  {/* Pasivos y Provisiones (Créditos) */}
                  <tr className="bg-[#8FA7D6]/10">
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">251005</td>
                    <td className="py-2 px-3 text-[#282829]">Cesantías consolidadas por pagar</td>
                    <td className="py-2 px-3 font-semibold text-amber-800">Crédito (Pasivo)</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalCesantiasMes)}</td>
                  </tr>
                  <tr className="bg-[#8FA7D6]/10">
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">251505</td>
                    <td className="py-2 px-3 text-[#282829]">Intereses sobre cesantías por pagar</td>
                    <td className="py-2 px-3 font-semibold text-amber-800">Crédito (Pasivo)</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalInteresesCesantiasMes)}</td>
                  </tr>
                  <tr className="bg-[#8FA7D6]/10">
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">252005</td>
                    <td className="py-2 px-3 text-[#282829]">Prima de servicios por pagar</td>
                    <td className="py-2 px-3 font-semibold text-amber-800">Crédito (Pasivo)</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalPrimaServiciosMes)}</td>
                  </tr>
                  <tr className="bg-[#8FA7D6]/10">
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">252505</td>
                    <td className="py-2 px-3 text-[#282829]">Vacaciones consolidadas por pagar</td>
                    <td className="py-2 px-3 font-semibold text-amber-800">Crédito (Pasivo)</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalVacacionesMes)}</td>
                  </tr>
                  <tr className="bg-[#8FA7D6]/10">
                    <td className="py-2 px-3 font-mono font-bold text-[#18235C]">237005</td>
                    <td className="py-2 px-3 text-[#282829]">Aportes a Entidades de Seguridad Social & Parafiscales</td>
                    <td className="py-2 px-3 font-semibold text-amber-800">Crédito (Pasivo)</td>
                    <td className="py-2 px-3 text-right text-[#282829]/40">—</td>
                    <td className="py-2 px-3 text-right font-medium text-[#282829]">{formatMonedaCOP(consolidado.totalCargaPatronalMes)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-[#18235C] text-white font-black text-xs">
                    <td colSpan={3} className="py-3 px-3">SUMAS IGUALES DEL COMPROBANTE:</td>
                    <td className="py-3 px-3 text-right text-[#00FF00]">
                      {formatMonedaCOP(consolidado.totalProvisionesMes + consolidado.totalCargaPatronalMes)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#00FF00]">
                      {formatMonedaCOP(consolidado.totalProvisionesMes + consolidado.totalCargaPatronalMes)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
