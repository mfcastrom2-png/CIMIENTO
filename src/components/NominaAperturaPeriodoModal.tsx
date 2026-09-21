import React from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { obtenerNombreMes } from '../services/payrollEngine';

interface NominaAperturaPeriodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  nuevoPeriodoAno: number;
  setNuevoPeriodoAno: (ano: number) => void;
  nuevoPeriodoMes: number;
  setNuevoPeriodoMes: (mes: number) => void;
  nuevoPeriodoTipo: 'Mensual' | 'Primera Quincena' | 'Segunda Quincena';
  setNuevoPeriodoTipo: (tipo: 'Mensual' | 'Primera Quincena' | 'Segunda Quincena') => void;
  copiarNovedadesDeActual: boolean;
  setCopiarNovedadesDeActual: (copiar: boolean) => void;
  onAperturarPeriodo: (e: React.FormEvent) => void;
  onGenerarAnoCompleto: (ano: number) => void;
}

export const NominaAperturaPeriodoModal: React.FC<NominaAperturaPeriodoModalProps> = ({
  isOpen,
  onClose,
  nuevoPeriodoAno,
  setNuevoPeriodoAno,
  nuevoPeriodoMes,
  setNuevoPeriodoMes,
  nuevoPeriodoTipo,
  setNuevoPeriodoTipo,
  copiarNovedadesDeActual,
  setCopiarNovedadesDeActual,
  onAperturarPeriodo,
  onGenerarAnoCompleto
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border-2 border-[#8FA7D6] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-[#18235C] text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00FF00]" />
              Aperturar Período de Nómina
            </h3>
            <p className="text-xs text-[#8FA7D6] mt-0.5">
              Genere y configure la nómina para cualquier mes y año
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onAperturarPeriodo} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-[#18235C] mb-1">Año de Nómina:</label>
              <select
                value={nuevoPeriodoAno}
                onChange={e => setNuevoPeriodoAno(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>
                    {y} {y === 2026 ? '(Vigente)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Mes del Año:</label>
              <select
                value={nuevoPeriodoMes}
                onChange={e => setNuevoPeriodoMes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white rounded-xl border border-[#8FA7D6] text-[#282829] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    Mes {m.toString().padStart(2, '0')} — {obtenerNombreMes(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#18235C] mb-1">Tipo de Liquidación:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Mensual', 'Primera Quincena', 'Segunda Quincena'] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setNuevoPeriodoTipo(tipo)}
                  className={`px-2.5 py-2 rounded-xl text-center border font-bold text-xs transition-colors ${
                    nuevoPeriodoTipo === tipo
                      ? 'bg-[#18235C] text-white border-[#18235C]'
                      : 'bg-white text-[#282829] border-[#8FA7D6] hover:bg-[#8FA7D6]/10'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={copiarNovedadesDeActual}
                onChange={e => setCopiarNovedadesDeActual(e.target.checked)}
                className="rounded border-[#8FA7D6] text-[#18235C] focus:ring-[#18235C] w-4 h-4"
              />
              <span className="font-semibold text-[#18235C]">
                Copiar bonificaciones fijas y deducciones del período actual
              </span>
            </label>
            <p className="text-[11px] text-[#282829]/70 pl-6">
              Copia los valores recurrentes (bonos fijos, comisiones base y préstamos) para agilizar la liquidación.
            </p>
          </div>

          {/* Botón rápido para generar el año completo */}
          <div className="pt-2 border-t border-[#8FA7D6]/30 flex items-center justify-between">
            <span className="text-[#282829] text-[11px]">¿Desea aperturar todo el año?</span>
            <button
              type="button"
              onClick={() => onGenerarAnoCompleto(nuevoPeriodoAno)}
              className="text-xs font-bold text-[#18235C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              Generar los 12 meses de {nuevoPeriodoAno}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#8FA7D6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#8FA7D6]/10 text-[#282829] border border-[#8FA7D6] rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#00FF00]" />
              Aperturar Período
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
