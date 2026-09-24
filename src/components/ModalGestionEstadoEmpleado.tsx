import React, { useState } from 'react';
import { Empleado } from '../types';
import {
  X,
  UserCheck,
  UserMinus,
  UserX,
  AlertTriangle,
  Calendar,
  FileText,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

interface ModalGestionEstadoEmpleadoProps {
  empleado: Empleado;
  cargoNombre?: string;
  onClose: () => void;
  onGuardar: (empleadoActualizado: Empleado) => Promise<void> | void;
}

const MOTIVOS_RETIRO_CST = [
  'Renuncia voluntaria del trabajador',
  'Terminación de contrato por justa causa del empleador (Art. 62 CST)',
  'Terminación de contrato sin justa causa / Despido unilateral (Art. 64 CST)',
  'Vencimiento del término pactado (Contrato a término fijo / Obra o labor)',
  'Mutuo acuerdo entre las partes (Conciliación laboral)',
  'Reconocimiento de pensión de vejez o invalidez',
  'No superación del período de prueba (Art. 80 CST)',
  'Liquidación o clausura definitiva de la empresa',
  'Fallecimiento del trabajador',
  'Otro motivo de desvinculación'
];

const MOTIVOS_INACTIVACION = [
  'Licencia no remunerada (Art. 51 CST)',
  'Incapacidad médica prolongada (EPS / ARL)',
  'Suspensión disciplinaria reglamentaria',
  'Licencia de maternidad / paternidad',
  'Licencia de luto / calamidad doméstica',
  'Permiso especial de capacitación / estudio',
  'Fuerza mayor o suspensión temporal de labores',
  'Otro motivo de suspensión temporal'
];

export const ModalGestionEstadoEmpleado: React.FC<ModalGestionEstadoEmpleadoProps> = ({
  empleado,
  cargoNombre = 'Colaborador',
  onClose,
  onGuardar
}) => {
  const estadoActualInicial: 'activo' | 'inactivo' | 'retirado' =
    empleado.estadoLaboral || (empleado.activo === false ? 'inactivo' : 'activo');

  const [nuevoEstado, setNuevoEstado] = useState<'activo' | 'inactivo' | 'retirado'>(estadoActualInicial);
  const [fechaRetiro, setFechaRetiro] = useState(
    empleado.fechaRetiro || new Date().toISOString().slice(0, 10)
  );
  const [motivoRetiro, setMotivoRetiro] = useState(
    empleado.motivoRetiro && MOTIVOS_RETIRO_CST.includes(empleado.motivoRetiro)
      ? empleado.motivoRetiro
      : MOTIVOS_RETIRO_CST[0]
  );
  const [motivoInactivacion, setMotivoInactivacion] = useState(
    empleado.motivoRetiro && MOTIVOS_INACTIVACION.includes(empleado.motivoRetiro)
      ? empleado.motivoRetiro
      : MOTIVOS_INACTIVACION[0]
  );
  const [observaciones, setObservaciones] = useState(empleado.observacionesRetiro || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nuevoEstado === 'retirado' && !fechaRetiro) {
      setError('Debe indicar la fecha de retiro o desvinculación laboral.');
      return;
    }

    setGuardando(true);
    try {
      const empleadoActualizado: Empleado = {
        ...empleado,
        activo: nuevoEstado === 'activo',
        estadoLaboral: nuevoEstado,
        fechaRetiro: nuevoEstado === 'retirado' ? fechaRetiro : (nuevoEstado === 'activo' ? undefined : empleado.fechaRetiro),
        motivoRetiro:
          nuevoEstado === 'retirado'
            ? motivoRetiro
            : nuevoEstado === 'inactivo'
            ? motivoInactivacion
            : undefined,
        observacionesRetiro: observaciones.trim() || undefined
      };

      await onGuardar(empleadoActualizado);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el estado del colaborador.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-[#8FA7D6] shadow-xl max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#18235C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#8FA7D6]">
              {nuevoEstado === 'activo' && <UserCheck className="w-4 h-4 text-emerald-400" />}
              {nuevoEstado === 'inactivo' && <UserMinus className="w-4 h-4 text-amber-400" />}
              {nuevoEstado === 'retirado' && <UserX className="w-4 h-4 text-rose-400" />}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Gestión de Estado Laboral y Novedades
              </h3>
              <p className="text-[11px] text-[#8FA7D6] leading-tight">
                {empleado.nombre} · {cargoNombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Estado */}
          <div>
            <label className="block font-bold text-[#18235C] mb-2">
              Seleccionar Estado Laboral del Colaborador *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Opción 1: Activo */}
              <button
                type="button"
                onClick={() => setNuevoEstado('activo')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  nuevoEstado === 'activo'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Activo
                  </span>
                  {nuevoEstado === 'activo' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Colaborador en funciones ordinarias de su cargo.
                </p>
              </button>

              {/* Opción 2: Inactivo */}
              <button
                type="button"
                onClick={() => setNuevoEstado('inactivo')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  nuevoEstado === 'inactivo'
                    ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-800 text-xs flex items-center gap-1.5">
                    <UserMinus className="w-3.5 h-3.5 text-amber-600" />
                    Inactivo
                  </span>
                  {nuevoEstado === 'inactivo' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Suspensión temporal o licencia. Mantiene contrato.
                </p>
              </button>

              {/* Opción 3: Retirado */}
              <button
                type="button"
                onClick={() => setNuevoEstado('retirado')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  nuevoEstado === 'retirado'
                    ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    Retirado
                  </span>
                  {nuevoEstado === 'retirado' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Terminación y liquidación definitiva del contrato.
                </p>
              </button>
            </div>
          </div>

          {/* Formulario condicional según el estado seleccionado */}
          {nuevoEstado === 'retirado' && (
            <div className="p-3.5 bg-rose-50/60 rounded-lg border border-rose-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Datos de Retiro y Desvinculación Laboral</span>
              </div>

              <div>
                <label className="block font-semibold text-rose-950 mb-1">
                  Fecha de Retiro / Finiquito de Labores *
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={fechaRetiro}
                    onChange={e => setFechaRetiro(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-rose-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-rose-950 mb-1">
                  Causa / Motivo Legal de Terminación (CST) *
                </label>
                <select
                  value={motivoRetiro}
                  onChange={e => setMotivoRetiro(e.target.value)}
                  className="w-full p-2 bg-white border border-rose-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  {MOTIVOS_RETIRO_CST.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-rose-950 mb-1">
                  Observaciones de Liquidación / Paz y Salvo (Opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre entrega de activos, liquidación final de cesantías, examen médico de egreso, etc."
                  rows={2}
                  className="w-full p-2 bg-white border border-rose-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="text-[11px] text-rose-800 bg-white p-2.5 rounded border border-rose-200">
                <strong>Efecto en el sistema:</strong> El colaborador no figurará en las listas de personal activo ni en procesos de nómina corriente. Su historial laboral, dotaciones y evaluaciones se conservarán de forma inmutable.
              </div>
            </div>
          )}

          {nuevoEstado === 'inactivo' && (
            <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Datos de la Novedad de Suspensión Temporal</span>
              </div>

              <div>
                <label className="block font-semibold text-amber-950 mb-1">
                  Motivo de la Suspensión o Inactivación *
                </label>
                <select
                  value={motivoInactivacion}
                  onChange={e => setMotivoInactivacion(e.target.value)}
                  className="w-full p-2 bg-white border border-amber-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {MOTIVOS_INACTIVACION.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-amber-950 mb-1">
                  Detalle / Justificación de la Novedad (Opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Ej: Radicado de incapacidad EPS No. 89234 o período autorizado de licencia..."
                  rows={2}
                  className="w-full p-2 bg-white border border-amber-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="text-[11px] text-amber-800 bg-white p-2.5 rounded border border-amber-200">
                <strong>Efecto en el sistema:</strong> El colaborador mantiene su contrato vigente pero se marca en suspensión temporal de actividades. Podrá reactivarse en cualquier momento cuando retome labores.
              </div>
            </div>
          )}

          {nuevoEstado === 'activo' && estadoActualInicial !== 'activo' && (
            <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reincorporación a Estado Activo</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                El colaborador será habilitado nuevamente como personal plenamente activo en la organización y podrá participar en solicitudes, dotaciones y evaluaciones periódicas.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-1.5 rounded bg-[#18235C] hover:bg-[#101740] text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{guardando ? 'Guardando...' : 'Aplicar Cambio de Estado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
