import React, { useState, useMemo } from 'react';
import { Scale } from 'lucide-react';
import { Empleado } from '../types';
import { formatMonedaCOP, simularLiquidacionDefinitiva } from '../services/payrollEngine';

interface SimuladorLiquidacionContratoViewProps {
  empleados: Empleado[];
}

export const SimuladorLiquidacionContratoView: React.FC<SimuladorLiquidacionContratoViewProps> = ({
  empleados
}) => {
  const [simulacionParams, setSimulacionParams] = useState<{
    empleadoId: string;
    motivo: 'Renuncia voluntaria' | 'Despido con justa causa' | 'Despido sin justa causa' | 'Terminación contrato término fijo' | 'Mutuo acuerdo';
    fechaRetiro: string;
    diasVacacionesPendientes: number;
  }>({
    empleadoId: empleados[0]?.id || '',
    motivo: 'Despido sin justa causa',
    fechaRetiro: new Date().toISOString().slice(0, 10),
    diasVacacionesPendientes: 12
  });

  const simulacionLiquidacion = useMemo(() => {
    const emp = empleados.find(e => e.id === simulacionParams.empleadoId) || empleados[0];
    if (!emp) return null;
    return simularLiquidacionDefinitiva(
      emp,
      simulacionParams.motivo,
      simulacionParams.fechaRetiro,
      simulacionParams.diasVacacionesPendientes
    );
  }, [empleados, simulacionParams]);

  if (empleados.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#8FA7D6] p-8 text-center shadow-xs">
        <Scale className="w-10 h-10 text-[#8FA7D6] mx-auto mb-2 opacity-60" />
        <h4 className="font-bold text-sm text-[#18235C]">No hay colaboradores registrados</h4>
        <p className="text-xs text-[#282829]/70 mt-1 max-w-md mx-auto">
          Registre empleados en el sistema para poder simular sus liquidaciones definitivas de contrato laboral conforme al Art. 64 CST.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-6 shadow-xs">
        <h3 className="text-base font-black text-[#18235C] flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5 text-[#18235C]" />
          Simulador de Liquidación Definitiva de Contrato Laboral
        </h3>
        <p className="text-xs text-[#282829] mb-5">
          Cálculo formal de prestaciones sociales pendientes e indemnización por despido injustificado con base en el <strong>Artículo 64 del Código Sustantivo del Trabajo (CST)</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[#8FA7D6]/10 rounded-xl border border-[#8FA7D6] text-xs">
          <div>
            <label className="block font-bold text-[#18235C] mb-1">Colaborador:</label>
            <select
              value={simulacionParams.empleadoId || empleados[0]?.id}
              onChange={e => setSimulacionParams(p => ({ ...p, empleadoId: e.target.value }))}
              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
            >
              {empleados.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nombre} ({e.contrato.tipo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#18235C] mb-1">Motivo de Retiro:</label>
            <select
              value={simulacionParams.motivo}
              onChange={e => setSimulacionParams(p => ({ ...p, motivo: e.target.value as any }))}
              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
            >
              <option value="Renuncia voluntaria">Renuncia voluntaria</option>
              <option value="Despido sin justa causa">Despido sin justa causa (con indemnización Art. 64)</option>
              <option value="Despido con justa causa">Despido con justa causa (sin indemnización)</option>
              <option value="Terminación contrato término fijo">Vencimiento término fijo pactado</option>
              <option value="Mutuo acuerdo">Mutuo acuerdo transaccional</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#18235C] mb-1">Fecha Efectiva de Retiro:</label>
            <input
              type="date"
              value={simulacionParams.fechaRetiro}
              onChange={e => setSimulacionParams(p => ({ ...p, fechaRetiro: e.target.value }))}
              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#18235C] mb-1">Días Vacaciones Pendientes:</label>
            <input
              type="number"
              min={0}
              max={60}
              value={simulacionParams.diasVacacionesPendientes}
              onChange={e => setSimulacionParams(p => ({ ...p, diasVacacionesPendientes: parseInt(e.target.value, 10) || 0 }))}
              className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
            />
          </div>
        </div>

        {/* Resultado de la simulación */}
        {simulacionLiquidacion && (
          <div className="mt-6 border border-[#8FA7D6] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#18235C] text-white flex justify-between items-center flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-white">
                  Liquidación de Prestaciones e Indemnización — {empleados.find(e => e.id === simulacionParams.empleadoId)?.nombre || empleados[0]?.nombre}
                </h4>
                <div className="text-[11px] text-[#8FA7D6] font-medium">
                  Ingreso: {simulacionLiquidacion.fechaIngreso} • Retiro: {simulacionLiquidacion.fechaRetiro} • Días totales laborados: {simulacionLiquidacion.diasTotalesLaborados}
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-white/10 text-[#00FF00] text-xs font-bold border border-white/20">
                Salario base: {formatMonedaCOP(simulacionLiquidacion.salarioBase)}
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white">
              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-[#8FA7D6]/20">
                  <span className="text-[#282829]">Cesantías definitivas año en curso ({simulacionLiquidacion.diasTrabajadosPeriodoActual} días):</span>
                  <span className="font-bold text-[#18235C]">{formatMonedaCOP(simulacionLiquidacion.cesantiasPendientes)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#8FA7D6]/20">
                  <span className="text-[#282829]">Intereses sobre cesantías (12% anual proporcional):</span>
                  <span className="font-bold text-[#18235C]">{formatMonedaCOP(simulacionLiquidacion.interesesCesantiasPendientes)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#8FA7D6]/20">
                  <span className="text-[#282829]">Prima de servicios proporcional semestre:</span>
                  <span className="font-bold text-[#18235C]">{formatMonedaCOP(simulacionLiquidacion.primaServiciosPendiente)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#8FA7D6]/20">
                  <span className="text-[#282829]">Vacaciones compensadas en dinero ({simulacionLiquidacion.vacacionesPendientesDias} días):</span>
                  <span className="font-bold text-[#18235C]">{formatMonedaCOP(simulacionLiquidacion.valorVacacionesPendientes)}</span>
                </div>
              </div>

              <div className="space-y-2.5 bg-[#8FA7D6]/10 p-4 rounded-xl border border-[#8FA7D6]">
                <div className="font-bold text-xs text-[#18235C] mb-1">
                  Indemnización Legal por Despido (Art. 64 CST):
                </div>
                <div className="flex justify-between py-1 border-b border-[#8FA7D6]/30">
                  <span className="text-[#282829]">Causal:</span>
                  <span className="font-bold text-[#18235C]">{simulacionParams.motivo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#8FA7D6]/30">
                  <span className="text-[#282829]">Valor indemnización legal:</span>
                  <span className={`font-bold ${simulacionLiquidacion.indemnizacionDespidoInjusto > 0 ? 'text-rose-700' : 'text-[#282829]'}`}>
                    {formatMonedaCOP(simulacionLiquidacion.indemnizacionDespidoInjusto)}
                  </span>
                </div>
                {simulacionLiquidacion.indemnizacionDespidoInjusto > 0 && (
                  <p className="text-[10px] text-[#282829]/80 leading-tight mt-1">
                    Calculada a razón de 30 días de salario por el primer año laborado y 20 días por cada año subsiguiente o fracción proporcional (para salarios menores a 10 SMMLV).
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#18235C] text-white p-4 flex justify-between items-center text-sm font-bold border-t border-[#101740]">
              <span>GRAN TOTAL LIQUIDACIÓN DEFINITIVA A PAGAR:</span>
              <span className="text-xl font-black text-[#00FF00]">{formatMonedaCOP(simulacionLiquidacion.totalLiquidacionDefinitiva)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
