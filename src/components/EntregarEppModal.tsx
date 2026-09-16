import React, { useState } from 'react';
import { ItemInventarioEPP, SolicitudEntregaEPP } from '../types';
import {
  HardHat,
  X,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ShieldCheck,
  Calendar,
  FileCheck
} from 'lucide-react';

interface EntregarEppModalProps {
  solicitud: SolicitudEntregaEPP;
  inventarioEpp: ItemInventarioEPP[];
  onClose: () => void;
  onConfirmarEntrega: (
    solicitudId: string,
    datosEntrega: {
      fechaEntrega: string;
      responsableEntrega: string;
      loteOSerie: string;
      observacionesEntrega: string;
      actaNumero: string;
      proximaReposicionSugerida: string;
    }
  ) => void;
}

export const EntregarEppModal: React.FC<EntregarEppModalProps> = ({
  solicitud,
  inventarioEpp,
  onClose,
  onConfirmarEntrega
}) => {
  const itemInventario = inventarioEpp.find(i => i.id === solicitud.eppId || i.codigo === solicitud.eppCodigo);

  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().slice(0, 10));
  const [responsableEntrega, setResponsableEntrega] = useState('Julián Castro (Vigía SST / Almacén)');
  const [loteOSerie, setLoteOSerie] = useState(`LT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [actaNumero, setActaNumero] = useState(`ACT-EPP-${new Date().getFullYear()}-${String(Math.floor(10 + Math.random() * 90)).padStart(3, '0')}`);
  const [observacionesEntrega, setObservacionesEntrega] = useState(
    'Elemento verificado físicamente, libre de defectos de fábrica y entregado con instrucciones de uso y mantenimiento preventivo.'
  );
  const [confirmoFirma, setConfirmoFirma] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcular próxima reposición sugerida según vida útil
  const vidaDias = itemInventario?.vidaUtilDias || 180;
  const fechaRep = new Date();
  fechaRep.setDate(fechaRep.getDate() + vidaDias);
  const proximaReposicionSugerida = fechaRep.toISOString().slice(0, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmoFirma) {
      setError('Debe registrar la confirmación de conformidad de recepción del trabajador.');
      return;
    }

    if (itemInventario && itemInventario.stockActual < solicitud.cantidad) {
      setError(`Stock insuficiente en almacén (Disponible: ${itemInventario.stockActual} ${itemInventario.unidad}). Ajuste el inventario primero.`);
      return;
    }

    onConfirmarEntrega(solicitud.id, {
      fechaEntrega,
      responsableEntrega,
      loteOSerie,
      observacionesEntrega,
      actaNumero,
      proximaReposicionSugerida
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#DCD6C8] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#FAF8F5] border-b border-[#DCD6C8] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2F5D50] text-white flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-sm text-[#1E2A24]">
                Efectuar Entrega Oficial de EPP
              </h3>
              <p className="text-[10px] text-[#5B6A62]">
                Registro conforme a Resolución 2400 de 1979 y Decreto 1072 de 2015
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

          {/* Solicitud Summary Banner */}
          <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8] space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#5B6A62] block font-semibold">
                  Colaborador Beneficiario
                </span>
                <span className="font-bold text-[#1E2A24] text-xs">
                  {solicitud.empleadoNombre}
                </span>
                <div className="text-[11px] text-[#5B6A62]">{solicitud.cargoNombre}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#5B6A62] block">Fecha de Solicitud</span>
                <span className="font-bold text-[#1E2A24]">{solicitud.fechaSolicitud}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCD6C8] flex justify-between items-center text-[11px]">
              <div>
                <span className="font-semibold text-[#1E2A24]">[{solicitud.eppCodigo}] {solicitud.eppNombre}</span>
                <div className="text-[#5B6A62]">
                  Talla: <strong>{solicitud.talla}</strong> • Cantidad: <strong>{solicitud.cantidad}</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#5B6A62] block">Stock Almacén</span>
                <span className="font-bold text-[#2F5D50]">
                  {itemInventario ? `${itemInventario.stockActual} ${itemInventario.unidad}` : 'Disponible'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields for Delivery */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1E2A24] mb-1">
                Fecha Efectiva de Entrega *
              </label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={e => setFechaEntrega(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24] focus:ring-2 focus:ring-[#2F5D50]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E2A24] mb-1">
                Lote o Serie del Fabricante *
              </label>
              <input
                type="text"
                value={loteOSerie}
                onChange={e => setLoteOSerie(e.target.value)}
                placeholder="ej. LT-2026-902 o SN-33821"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs font-mono text-[#1E2A24] focus:ring-2 focus:ring-[#2F5D50]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1E2A24] mb-1">
                Responsable de Entrega (SST) *
              </label>
              <input
                type="text"
                value={responsableEntrega}
                onChange={e => setResponsableEntrega(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E2A24] mb-1">
                N° de Acta Oficial Generada
              </label>
              <input
                type="text"
                value={actaNumero}
                onChange={e => setActaNumero(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs font-mono text-[#1E2A24]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1E2A24] mb-1">
              Observaciones de Almacén / Instrucciones Dadas
            </label>
            <textarea
              rows={2}
              value={observacionesEntrega}
              onChange={e => setObservacionesEntrega(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DCD6C8] rounded-lg text-xs text-[#1E2A24]"
            />
          </div>

          {/* Worker Acceptance Confirmation Checkbox */}
          <div className="p-3 bg-[#E4EDE9]/50 border border-[#2F5D50]/30 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmoFirma}
                onChange={e => setConfirmoFirma(e.target.checked)}
                className="w-4 h-4 text-[#2F5D50] rounded border-[#DCD6C8] focus:ring-[#2F5D50] mt-0.5"
              />
              <div className="text-[11px] text-[#1E2A24]">
                <strong className="block text-[#2F5D50]">
                  Confirmación de Entrega y Firma de Conformidad
                </strong>
                El colaborador recibió el elemento en perfecto estado, conoció sus especificaciones técnicas y firmó el acta oficial conforme a la Resolución 2400/1979.
              </div>
            </label>
          </div>

          {/* Action Buttons */}
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
              <FileCheck className="w-4 h-4" />
              <span>Registrar Entrega Oficial y Descontar Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
