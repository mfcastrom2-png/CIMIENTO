import React, { useState } from 'react';
import { Empleado, EstadoColaborador, EventoHistorialLaboral, UsuarioSistema } from '../types';
import {
  X,
  UserCheck,
  UserMinus,
  UserX,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Palmtree,
  FileText
} from 'lucide-react';
import { uid } from '../data/initialData';

interface ModalGestionEstadoEmpleadoProps {
  empleado: Empleado;
  cargoNombre?: string;
  currentUser?: UsuarioSistema | null;
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
  currentUser,
  onClose,
  onGuardar
}) => {
  const getEstadoInicial = (): EstadoColaborador => {
    if (empleado.laboral?.estado) return empleado.laboral.estado;
    if (empleado.estadoLaboral === 'retirado' || empleado.estadoLaboral === 'Retirado') return 'Retirado';
    if (empleado.estadoLaboral === 'inactivo' || empleado.estadoLaboral === 'Inactivo') return 'Inactivo';
    if (empleado.activo === false) return 'Inactivo';
    return 'Activo';
  };

  const estadoActualInicial = getEstadoInicial();

  const [nuevoEstado, setNuevoEstado] = useState<EstadoColaborador>(estadoActualInicial);
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

    if (nuevoEstado === 'Retirado' && !fechaRetiro) {
      setError('Debe indicar la fecha de retiro o desvinculación laboral.');
      return;
    }

    setGuardando(true);
    try {
      const motivoFinal =
        nuevoEstado === 'Retirado'
          ? motivoRetiro
          : nuevoEstado === 'Inactivo' || nuevoEstado === 'Suspensión' || nuevoEstado === 'Licencia'
          ? motivoInactivacion
          : observaciones.trim() || `Transición a estado ${nuevoEstado}`;

      let accionHistorial: EventoHistorialLaboral['accion'] = 'CAMBIO_DATOS';
      if (nuevoEstado === 'Retirado') accionHistorial = 'RETIRO';
      else if (nuevoEstado === 'Inactivo') accionHistorial = 'INACTIVACION';
      else if (nuevoEstado === 'Suspensión') accionHistorial = 'SUSPENSION';
      else if (nuevoEstado === 'Vacaciones') accionHistorial = 'VACACIONES';
      else if (nuevoEstado === 'Licencia') accionHistorial = 'LICENCIA';
      else if (nuevoEstado === 'Activo' && estadoActualInicial !== 'Activo') accionHistorial = 'REINTEGRO';

      const nuevoEvento: EventoHistorialLaboral = {
        id: uid(),
        fechaHora: new Date().toLocaleString('es-CO'),
        usuario: currentUser?.nombre || 'Administrador de Talento Humano',
        accion: accionHistorial,
        titulo: `Cambio de Estado Laboral a ${nuevoEstado}`,
        motivo: motivoFinal,
        valorAnterior: `Estado: ${estadoActualInicial}`,
        valorNuevo: `Estado: ${nuevoEstado}${nuevoEstado === 'Retirado' ? ` (Fecha: ${fechaRetiro})` : ''}`
      };

      const empleadoActualizado: Empleado = {
        ...empleado,
        activo: nuevoEstado === 'Activo' || nuevoEstado === 'Vacaciones' || nuevoEstado === 'Licencia',
        estadoLaboral: (nuevoEstado === 'Activo' ? 'activo' : nuevoEstado === 'Retirado' ? 'retirado' : 'inactivo') as any,
        fechaRetiro: nuevoEstado === 'Retirado' ? fechaRetiro : undefined,
        motivoRetiro: nuevoEstado === 'Retirado' ? motivoRetiro : (nuevoEstado === 'Inactivo' || nuevoEstado === 'Suspensión' ? motivoInactivacion : undefined),
        observacionesRetiro: observaciones.trim() || undefined,
        laboral: empleado.laboral
          ? {
              ...empleado.laboral,
              estado: nuevoEstado
            }
          : undefined,
        historialLaboral: [...(empleado.historialLaboral || []), nuevoEvento]
      };

      await onGuardar(empleadoActualizado);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el estado del colaborador.');
    } finally {
      setGuardando(false);
    }
  };

  const estadosDisponibles: { valor: EstadoColaborador; label: string; desc: string; icon: any; color: string }[] = [
    { valor: 'Activo', label: 'Activo', desc: 'En funciones ordinarias de su cargo.', icon: UserCheck, color: 'emerald' },
    { valor: 'Preingreso', label: 'Preingreso', desc: 'En trámites de contratación o examen médico.', icon: Clock, color: 'blue' },
    { valor: 'Vacaciones', label: 'Vacaciones', desc: 'Disfrutando período legal de descanso.', icon: Palmtree, color: 'indigo' },
    { valor: 'Licencia', label: 'Licencia', desc: 'Licencia remunerada o no remunerada de ley.', icon: FileText, color: 'purple' },
    { valor: 'Suspensión', label: 'Suspensión', desc: 'Medida disciplinaria reglamentaria temporal.', icon: AlertTriangle, color: 'amber' },
    { valor: 'Inactivo', label: 'Inactivo', desc: 'Temporalmente inactivo o sin funciones asignadas.', icon: UserMinus, color: 'yellow' },
    { valor: 'Retirado', label: 'Retirado', desc: 'Terminación formal y liquidación de contrato.', icon: UserX, color: 'rose' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-[#8FA7D6] shadow-xl max-w-xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#18235C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#8FA7D6]">
              {nuevoEstado === 'Activo' && <UserCheck className="w-4 h-4 text-emerald-400" />}
              {nuevoEstado === 'Retirado' && <UserX className="w-4 h-4 text-rose-400" />}
              {nuevoEstado !== 'Activo' && nuevoEstado !== 'Retirado' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Gestión de Estado Laboral y Novedades
              </h3>
              <p className="text-[11px] text-[#8FA7D6] leading-tight">
                {empleado.nombre} · {cargoNombre} (Actual: {estadoActualInicial})
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
              Seleccionar Nuevo Estado Laboral del Colaborador *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {estadosDisponibles.map(st => {
                const IconComponent = st.icon;
                const isSelected = nuevoEstado === st.valor;
                return (
                  <button
                    key={st.valor}
                    type="button"
                    onClick={() => setNuevoEstado(st.valor)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#18235C] bg-[#F8FAFC] ring-2 ring-[#18235C]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <IconComponent className="w-3.5 h-3.5 text-[#18235C]" />
                        {st.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#18235C]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                      {st.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulario condicional según el estado seleccionado */}
          {nuevoEstado === 'Retirado' && (
            <div className="p-3.5 bg-rose-50/70 rounded-lg border border-rose-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Datos de Retiro y Desvinculación Laboral (CST)</span>
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
                  Causa / Motivo Legal de Terminación *
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
                  Observaciones de Liquidación / Paz y Salvo
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre entrega de activos, liquidación de prestaciones, examen de egreso, etc."
                  rows={2}
                  className="w-full p-2 bg-white border border-rose-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="text-[11px] text-rose-800 bg-white p-2.5 rounded border border-rose-200">
                <strong>Regla de negocio:</strong> El expediente no se eliminará físicamente. Se conservará la bitácora inmutable en su historial laboral para fines de auditoría ante el Ministerio de Trabajo y UGPP.
              </div>
            </div>
          )}

          {(nuevoEstado === 'Inactivo' || nuevoEstado === 'Suspensión' || nuevoEstado === 'Licencia') && (
            <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Datos de la Novedad Laboral ({nuevoEstado})</span>
              </div>

              <div>
                <label className="block font-semibold text-amber-950 mb-1">
                  Motivo de la Novedad *
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
                  Detalle / Justificación de la Novedad
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Ej: Radicado de incapacidad médica EPS No. 129384, período autorizado, o sanción..."
                  rows={2}
                  className="w-full p-2 bg-white border border-amber-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {nuevoEstado === 'Activo' && estadoActualInicial !== 'Activo' && (
            <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reincorporación a Estado Activo</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                El colaborador será habilitado como personal plenamente activo en la organización y podrá participar en nómina, dotaciones, capacitaciones y evaluaciones técnicas.
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
