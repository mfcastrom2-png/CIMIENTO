import React, { useState } from 'react';
import { Empleado, ItemInventarioEPP, SolicitudEntregaEPP } from '../types';
import {
  HardHat,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Package,
  Info
} from 'lucide-react';

interface SolicitarEppModalProps {
  empleado: Empleado;
  inventarioEpp: ItemInventarioEPP[];
  onClose: () => void;
  onCrearSolicitud: (nueva: SolicitudEntregaEPP) => void;
}

export const SolicitarEppModal: React.FC<SolicitarEppModalProps> = ({
  empleado,
  inventarioEpp,
  onClose,
  onCrearSolicitud
}) => {
  const [selectedEppId, setSelectedEppId] = useState<string>(inventarioEpp[0]?.id || '');
  const [motivo, setMotivo] = useState<SolicitudEntregaEPP['motivo']>('Dotación Periódica Obligatoria');
  const [talla, setTalla] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [observaciones, setObservaciones] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const selectedEpp = inventarioEpp.find(item => item.id === selectedEppId);

  // Set default size when EPP changes
  const handleEppChange = (eppId: string) => {
    setSelectedEppId(eppId);
    const item = inventarioEpp.find(i => i.id === eppId);
    if (item && item.tallasDisponibles && item.tallasDisponibles.length > 0) {
      setTalla(item.tallasDisponibles[0]);
    } else {
      setTalla('Única');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEpp) {
      setError('Por favor seleccione un elemento de protección del catálogo.');
      return;
    }

    const nuevaSolicitud: SolicitudEntregaEPP = {
      id: `sol-epp-${Date.now()}`,
      empleadoId: empleado.id,
      empleadoNombre: empleado.nombre,
      cargoNombre: 'Colaborador / Operaciones',
      eppId: selectedEpp.id,
      eppCodigo: selectedEpp.codigo,
      eppNombre: selectedEpp.nombre,
      eppCategoria: selectedEpp.categoria,
      talla: talla || (selectedEpp.tallasDisponibles?.[0] || 'Única'),
      cantidad: cantidad > 0 ? cantidad : 1,
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      motivo,
      observacionesEmpleado: observaciones.trim() || 'Solicitud tramitada vía portal del colaborador.',
      estado: 'Pendiente',
      firmaConformidadTrabajador: false
    };

    onCrearSolicitud(nuevaSolicitud);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#DCD6C8] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#FAF8F5] border-b border-[#DCD6C8] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2F5D50] text-white flex items-center justify-center">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-sm text-[#1E2A24]">
                Solicitar Elemento de Protección Personal (EPP)
              </h3>
              <p className="text-[10px] text-[#5B6A62]">
                Colaborador: {empleado.nombre} • C.C. {empleado.documento}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5B6A62] hover:text-[#1E2A24] rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#F3E3DE] border border-[#A8503E]/30 rounded-lg text-[#A8503E] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select EPP */}
          <div>
            <label className="block font-semibold text-[#1E2A24] mb-1">
              Elemento Requerido (Catálogo de Inventario SST) *
            </label>
            <select
              value={selectedEppId}
              onChange={e => handleEppChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24] focus:outline-none focus:ring-2 focus:ring-[#2F5D50]"
            >
              {inventarioEpp.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.codigo}] {item.nombre} — {item.categoria} (Stock: {item.stockActual} {item.unidad})
                </option>
              ))}
            </select>
          </div>

          {/* Selected EPP Card Info */}
          {selectedEpp && (
            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8] space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2F5D50]">{selectedEpp.categoria}</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  selectedEpp.stockActual > selectedEpp.stockMinimo
                    ? 'bg-[#E4EDE9] text-[#2F5D50]'
                    : 'bg-[#F5EAD4] text-[#B5842A]'
                }`}>
                  Disponibles en Almacén: {selectedEpp.stockActual} {selectedEpp.unidad}
                </span>
              </div>
              <p className="text-[#5B6A62]">{selectedEpp.descripcion}</p>
              <div className="text-[10px] text-[#8DA096]">
                Normativa técnica: <span className="font-mono text-[#1E2A24]">{selectedEpp.normaTecnica}</span>
              </div>
            </div>
          )}

          {/* Talla y Cantidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1E2A24] mb-1">
                Talla o Especificación *
              </label>
              {selectedEpp && selectedEpp.tallasDisponibles && selectedEpp.tallasDisponibles.length > 1 ? (
                <select
                  value={talla || selectedEpp.tallasDisponibles[0]}
                  onChange={e => setTalla(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24] focus:outline-none focus:ring-2 focus:ring-[#2F5D50]"
                >
                  {selectedEpp.tallasDisponibles.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={talla || selectedEpp?.tallasDisponibles?.[0] || 'Ajustable'}
                  onChange={e => setTalla(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24]"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-[#1E2A24] mb-1">
                Cantidad Solicitada *
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={cantidad}
                onChange={e => setCantidad(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24] focus:outline-none focus:ring-2 focus:ring-[#2F5D50]"
              />
            </div>
          </div>

          {/* Motivo de la Solicitud */}
          <div>
            <label className="block font-semibold text-[#1E2A24] mb-1">
              Motivo de la Solicitud *
            </label>
            <select
              value={motivo}
              onChange={e => setMotivo(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24] focus:outline-none focus:ring-2 focus:ring-[#2F5D50]"
            >
              <option value="Dotación Periódica Obligatoria">Dotación Periódica Obligatoria (CST Art. 230)</option>
              <option value="Desgaste Normal / Fin Vida Útil">Desgaste Normal / Fin de Vida Útil Recomendada</option>
              <option value="Deterioro / Accidente Operativo">Deterioro / Daño Ocurrido en Operación</option>
              <option value="Pérdida o Extravío Reportado">Pérdida o Extravío Justificado</option>
              <option value="Nuevo Ingreso o Cambio de Cargo">Nuevo Requerimiento por Actividad / Riesgo</option>
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block font-semibold text-[#1E2A24] mb-1">
              Observaciones o Justificación Detallada
            </label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Describa el estado actual del equipo anterior o la necesidad específica de campo..."
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24] focus:outline-none focus:ring-2 focus:ring-[#2F5D50]"
            />
          </div>

          {/* Compliance Notice */}
          <div className="flex items-start gap-2 p-2.5 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8] text-[11px] text-[#5B6A62]">
            <Info className="w-3.5 h-3.5 text-[#2F5D50] shrink-0 mt-0.5" />
            <span>
              Su solicitud será radicada en el módulo de SG-SST para alistamiento en almacén y citación para entrega oficial.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCD6C8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#DCD6C8] rounded-lg text-xs font-semibold text-[#5B6A62] hover:bg-[#FAF8F5]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2F5D50] hover:bg-[#223F37] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Radicar Solicitud de EPP</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
