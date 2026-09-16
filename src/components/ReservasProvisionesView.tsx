import React, { useState, useMemo } from 'react';
import { Cargo, Empleado, LiquidacionEmpleadoNomina, ParametrosLegalesNomina, PeriodoNomina, ReservaProvisionEmpleado } from '../types';
import {
  calcularConsolidadoReservas,
  calcularReservasProvisionesEmpleado,
  formatMonedaCOP,
  obtenerNombreMes
} from '../services/payrollEngine';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  PiggyBank,
  Printer,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
  Users
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
  const [subTab, setSubTab] = useState<'detalle' | 'calendario' | 'contabilidad'>('detalle');
  const [searchTerm, setSearchTerm] = useState('');
  const [cargoFilter, setCargoFilter] = useState('TODOS');

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

  // 2. Consolidado corporativo total de reservas
  const consolidado = useMemo(() => {
    return calcularConsolidadoReservas(reservasEmpleados);
  }, [reservasEmpleados]);

  // Filtrado de la tabla
  const reservasFiltradas = useMemo(() => {
    return reservasEmpleados.filter(item => {
      const matchSearch =
        item.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cargoNombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCargo = cargoFilter === 'TODOS' || item.cargoNombre === cargoFilter;
      return matchSearch && matchCargo;
    });
  }, [reservasEmpleados, searchTerm, cargoFilter]);

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
