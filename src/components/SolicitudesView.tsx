import React, { useState } from 'react';
import { Empleado, Solicitud } from '../types';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import { uid } from '../data/initialData';

interface SolicitudesViewProps {
  solicitudes: Solicitud[];
  empleados: Empleado[];
  onAddSolicitud: (nueva: Solicitud) => void;
  onUpdateEstado: (id: string, nuevoEstado: 'Aprobada' | 'Rechazada', comentario: string) => void;
}

export const SolicitudesView: React.FC<SolicitudesViewProps> = ({
  solicitudes,
  empleados,
  onAddSolicitud,
  onUpdateEstado,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{ id: string; accion: 'Aprobada' | 'Rechazada' } | null>(null);
  const [decisionComentario, setDecisionComentario] = useState('');

  // Filter state
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [search, setSearch] = useState('');

  // Form state
  const [empleadoId, setEmpleadoId] = useState(empleados[0]?.id || '');
  const [tipo, setTipo] = useState<Solicitud['tipo']>('Permiso');
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fin, setFin] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState('');

  const getEmpleadoNombre = (id: string) => empleados.find(e => e.id === id)?.nombre || 'Empleado no encontrado';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;

    const nueva: Solicitud = {
      id: uid('sol'),
      empleadoId,
      tipo,
      inicio,
      fin,
      motivo: motivo.trim(),
      estado: 'Pendiente',
      decisorId: null,
      fechaDecision: null,
      comentario: '',
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };

    onAddSolicitud(nueva);
    setMotivo('');
    setModalOpen(false);
  };

  const handleConfirmDecision = () => {
    if (!decisionModal) return;
    onUpdateEstado(decisionModal.id, decisionModal.accion, decisionComentario.trim());
    setDecisionModal(null);
    setDecisionComentario('');
  };

  const filtered = solicitudes.filter(s => {
    const empNombre = getEmpleadoNombre(s.empleadoId).toLowerCase();
    const matchSearch = empNombre.includes(search.toLowerCase()) || s.motivo.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'TODOS' || s.estado === filterEstado;
    const matchTipo = filterTipo === 'TODOS' || s.tipo === filterTipo;
    return matchSearch && matchEstado && matchTipo;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#DCD6C8]">
        <div>
          <h1 className="font-serif-title text-3xl font-medium text-[#1E2A24]">
            Gestión de Solicitudes y Novedades
          </h1>
          <p className="text-sm text-[#5B6A62] mt-1 max-w-2xl">
            Permisos, vacaciones, incapacidades y solicitudes administrativas con flujo de aprobación formal.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[#2F5D50] hover:bg-[#223F37] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Radicar solicitud</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded border border-[#DCD6C8] shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6A62]" />
          <input
            type="text"
            placeholder="Buscar por empleado o motivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#5B6A62] font-semibold">Estado:</span>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="p-1.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#1E2A24]"
            >
              <option value="TODOS">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#5B6A62] font-semibold">Tipo:</span>
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="p-1.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] text-[#1E2A24]"
            >
              <option value="TODOS">Todos</option>
              <option value="Permiso">Permiso</option>
              <option value="Vacaciones">Vacaciones</option>
              <option value="Incapacidad">Incapacidad</option>
              <option value="Cesantías">Cesantías</option>
              <option value="Certificado">Certificado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-[#DCD6C8] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCD6C8] text-[#5B6A62] bg-[#F6F4EF]/60">
                <th className="py-3 px-4 font-semibold">Empleado</th>
                <th className="py-3 px-4 font-semibold">Tipo de Solicitud</th>
                <th className="py-3 px-4 font-semibold">Vigencia / Fechas</th>
                <th className="py-3 px-4 font-semibold">Motivo / Justificación</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold">Resolución</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCD6C8]/60">
              {filtered.map(sol => (
                <tr key={sol.id} className="hover:bg-[#F6F4EF]/50">
                  <td className="py-3 px-4 font-medium text-[#1E2A24]">
                    {getEmpleadoNombre(sol.empleadoId)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#1E2A24]">
                    {sol.tipo}
                  </td>
                  <td className="py-3 px-4 text-[#5B6A62]">
                    {sol.inicio} al {sol.fin}
                  </td>
                  <td className="py-3 px-4 text-[#5B6A62] max-w-xs truncate" title={sol.motivo}>
                    {sol.motivo}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sol.estado === 'Aprobada' ? 'bg-[#E4EDE9] text-[#2F5D50]' :
                      sol.estado === 'Rechazada' ? 'bg-[#F3E3DE] text-[#A8503E]' : 'bg-[#F5EAD4] text-[#B5842A]'
                    }`}>
                      {sol.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#5B6A62]">
                    {sol.fechaDecision ? `${sol.fechaDecision}: ${sol.comentario || 'Aprobado sin observaciones'}` : 'En espera de revisión'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {sol.estado === 'Pendiente' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDecisionModal({ id: sol.id, accion: 'Aprobada' })}
                          className="px-2.5 py-1 rounded bg-[#2F5D50] hover:bg-[#223F37] text-white font-semibold transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => setDecisionModal({ id: sol.id, accion: 'Rechazada' })}
                          className="px-2.5 py-1 rounded bg-[#A8503E] hover:bg-[#863b2c] text-white font-semibold transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[#5B6A62] italic text-[11px]">Trámite completado</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5B6A62]">
                    No se encontraron solicitudes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Solicitud */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-[#DCD6C8] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif-title text-xl font-medium text-[#1E2A24]">
              Radicar Novedad o Solicitud
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#5B6A62] mb-1">Colaborador *</label>
                {empleados.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    No hay colaboradores registrados. Agregue primero el personal en el módulo de Empleados.
                  </p>
                ) : (
                  <select
                    value={empleadoId || empleados[0]?.id}
                    onChange={e => setEmpleadoId(e.target.value)}
                    className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  >
                    {empleados.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#5B6A62] mb-1">Tipo de Trámite</label>
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value as any)}
                  className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                >
                  <option value="Permiso">Permiso laboral / personal</option>
                  <option value="Vacaciones">Vacaciones reglamentarias</option>
                  <option value="Incapacidad">Incapacidad médica EPS / ARL</option>
                  <option value="Cesantías">Anticipo / retiro de cesantías</option>
                  <option value="Certificado">Certificación laboral</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5B6A62] mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={inicio}
                    onChange={e => setInicio(e.target.value)}
                    className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5B6A62] mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={fin}
                    onChange={e => setFin(e.target.value)}
                    className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#5B6A62] mb-1">Motivo / Justificación *</label>
                <textarea
                  rows={3}
                  required
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Detalle el motivo del trámite..."
                  className="w-full p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#DCD6C8]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-[#5B6A62] hover:bg-[#F6F4EF] rounded border border-[#DCD6C8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2F5D50] hover:bg-[#223F37] text-white font-semibold rounded"
                >
                  Radicar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-[#DCD6C8] max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif-title text-lg font-medium text-[#1E2A24]">
              Confirmar Decisión: {decisionModal.accion}
            </h3>
            <p className="text-xs text-[#5B6A62]">
              Ingresa una observación o motivo que quedará registrado en el historial del colaborador.
            </p>

            <textarea
              rows={3}
              value={decisionComentario}
              onChange={e => setDecisionComentario(e.target.value)}
              placeholder="Observaciones de Gestión Humana..."
              className="w-full text-xs p-2 rounded border border-[#DCD6C8] bg-[#F6F4EF]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDecisionModal(null)}
                className="px-3 py-1.5 text-xs text-[#5B6A62] rounded border border-[#DCD6C8]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-3 py-1.5 text-xs font-semibold text-white rounded ${
                  decisionModal.accion === 'Aprobada' ? 'bg-[#2F5D50] hover:bg-[#223F37]' : 'bg-[#A8503E] hover:bg-[#863b2c]'
                }`}
              >
                Confirmar {decisionModal.accion}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
