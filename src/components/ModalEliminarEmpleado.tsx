import React, { useState } from 'react';
import { Empleado } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ModalEliminarEmpleadoProps {
  empleado: Empleado;
  onClose: () => void;
  onConfirmar: (id: string) => Promise<void> | void;
}

export const ModalEliminarEmpleado: React.FC<ModalEliminarEmpleadoProps> = ({
  empleado,
  onClose,
  onConfirmar
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEliminar = async () => {
    if (confirmText.trim().toUpperCase() !== 'ELIMINAR') {
      setError('Escriba la palabra ELIMINAR para confirmar.');
      return;
    }

    setEliminando(true);
    try {
      await onConfirmar(empleado.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar el expediente del colaborador.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-rose-300 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <h3 className="font-bold text-sm">Eliminar Expediente de Colaborador</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
              {error}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Atención:</strong> Si el colaborador terminó contrato o se retiró de la empresa, se recomienda usar la opción de <strong>Retirar</strong> en lugar de eliminar, para conservar su historial laboral. Use la eliminación únicamente si el registro fue creado por error o está duplicado.
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-bold text-slate-800 text-sm">{empleado.nombre}</div>
            <div className="text-slate-600 text-xs">Documento: {empleado.documento}</div>
            <div className="text-slate-500 text-[11px]">ID: {empleado.id}</div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Para confirmar, escriba <strong>ELIMINAR</strong> en el siguiente campo:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full p-2 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleEliminar}
              disabled={confirmText.trim().toUpperCase() !== 'ELIMINAR' || eliminando}
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{eliminando ? 'Eliminando...' : 'Eliminar Definitivamente'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
