import React, { useState } from 'react';
import { Empleado, Solicitud, Role, UsuarioSistema } from '../types';
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
  MessageSquare,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { uid } from '../data/initialData';

interface SolicitudesViewProps {
  solicitudes: Solicitud[];
  empleados: Empleado[];
  onAddSolicitud: (nueva: Solicitud) => void;
  onUpdateEstado: (id: string, nuevoEstado: 'Aprobada' | 'Rechazada', comentario: string) => void;
  userRole?: Role;
  currentUser?: UsuarioSistema | null;
  isSuperAdmin?: boolean;
}

export const SolicitudesView: React.FC<SolicitudesViewProps> = ({
  solicitudes,
  empleados,
  onAddSolicitud,
  onUpdateEstado,
  userRole,
  currentUser,
  isSuperAdmin = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{ id: string; accion: 'Aprobada' | 'Rechazada' } | null>(null);
  const [decisionComentario, setDecisionComentario] = useState('');

  // Identificar el colaborador vinculado al usuario autenticado
  const myEmpleado = empleados.find(e =>
    (currentUser?.empleadoId && e.id === currentUser.empleadoId) ||
    (currentUser?.email && e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
    (currentUser?.documento && e.documento === currentUser.documento)
  );

  // Modo empleado: usuario con rol colaborador o administrador en modo simulación
  const isEmployeeMode = userRole === 'empleado' || currentUser?.rol === 'empleado';
  const isSimulation = (isSuperAdmin || currentUser?.rol === 'admin_gh' || currentUser?.rol === 'superadmin') && userRole === 'empleado';

  // Selección de colaborador simulado para administradores en pruebas de experiencia
  const [simulatedEmpleadoId, setSimulatedEmpleadoId] = useState<string>(() => {
    return myEmpleado?.id || (empleados.length > 0 ? empleados[0].id : '');
  });

  React.useEffect(() => {
    if (myEmpleado) {
      setSimulatedEmpleadoId(myEmpleado.id);
    } else if (!simulatedEmpleadoId && empleados.length > 0) {
      setSimulatedEmpleadoId(empleados[0].id);
    }
  }, [myEmpleado, empleados, simulatedEmpleadoId]);

  const effectiveEmpleado = myEmpleado || empleados.find(e => e.id === simulatedEmpleadoId) || empleados[0];

  // Solo administradores legítimos tienen autorización para aprobar o rechazar solicitudes
  const canApprove =
    !isEmployeeMode &&
    Boolean(
      isSuperAdmin ||
      currentUser?.rol === 'superadmin' ||
      currentUser?.rol === 'admin_gh' ||
      currentUser?.permisos?.includes('solicitudes')
    );

  // Filter state
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [search, setSearch] = useState('');

  // Form state
  const [empleadoId, setEmpleadoId] = useState(
    isEmployeeMode
      ? (effectiveEmpleado?.id || currentUser?.empleadoId || currentUser?.id || '')
      : (empleados[0]?.id || '')
  );
  const [tipo, setTipo] = useState<Solicitud['tipo']>('Permiso');
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fin, setFin] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState('');

  // Sincronizar identificador del colaborador ante cambio de rol o perfil simulado
  React.useEffect(() => {
    if (isEmployeeMode) {
      setEmpleadoId(effectiveEmpleado?.id || currentUser?.empleadoId || currentUser?.id || '');
    } else if (empleados.length > 0 && !empleadoId) {
      setEmpleadoId(empleados[0].id);
    }
  }, [isEmployeeMode, effectiveEmpleado?.id, currentUser?.empleadoId, currentUser?.id, empleados, empleadoId]);

  const getEmpleadoNombre = (id: string) => {
    const emp = empleados.find(e => e.id === id);
    if (emp) return emp.nombre;
    const sol = solicitudes.find(s => s.empleadoId === id);
    if (sol?.empleadoNombre) return sol.empleadoNombre;
    if (currentUser && (currentUser.id === id || currentUser.empleadoId === id)) {
      return currentUser.nombre || 'Colaborador';
    }
    if (id === 'usr-superadmin') {
      return 'Superadministrador';
    }
    return 'Colaborador';
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;

    // En modo empleado, se asigna el colaborador efectivo
    const targetEmp = isEmployeeMode ? effectiveEmpleado : empleados.find(e => e.id === empleadoId) || empleados[0];
    const finalEmpleadoId = isEmployeeMode
      ? (effectiveEmpleado?.id || myEmpleado?.id || currentUser?.empleadoId || currentUser?.id || '')
      : (empleadoId || empleados[0]?.id || '');

    if (!finalEmpleadoId) {
      alert('No se pudo determinar el registro del colaborador para radicar la solicitud.');
      return;
    }

    const nueva: Solicitud = {
      id: uid('sol'),
      empresaId: currentUser?.empresaId || 'empresa-a',
      empleadoId: finalEmpleadoId,
      empleadoNombre: targetEmp?.nombre || currentUser?.nombre || 'Colaborador',
      empleadoEmail: targetEmp?.email || currentUser?.email || '',
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
    if (!canApprove) {
      setDecisionModal(null);
      return;
    }
    if (!decisionModal) return;
    onUpdateEstado(decisionModal.id, decisionModal.accion, decisionComentario.trim());
    setDecisionModal(null);
    setDecisionComentario('');
  };

  const filtered = solicitudes.filter(s => {
    // Si el usuario es un colaborador, únicamente puede ver sus propias solicitudes
    if (isEmployeeMode) {
      const targetId = effectiveEmpleado?.id;
      const isMine =
        (targetId && s.empleadoId === targetId) ||
        (myEmpleado && s.empleadoId === myEmpleado.id) ||
        (currentUser?.empleadoId && s.empleadoId === currentUser.empleadoId) ||
        (currentUser?.id && s.empleadoId === currentUser.id) ||
        (currentUser?.email && s.empleadoEmail && s.empleadoEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        // En simulación: incluir solicitudes creadas por o para la simulación del administrador
        (isSimulation && (s.empleadoId === currentUser?.id || s.empleadoId === 'usr-superadmin' || (targetId && s.empleadoId === targetId)));
      if (!isMine) return false;
    }

    const empNombre = getEmpleadoNombre(s.empleadoId).toLowerCase();
    const matchSearch = empNombre.includes(search.toLowerCase()) || s.motivo.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'TODOS' || s.estado === filterEstado;
    const matchTipo = filterTipo === 'TODOS' || s.tipo === filterTipo;
    return matchSearch && matchEstado && matchTipo;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-bold tracking-tight text-3xl font-medium text-[#18235C]">
              {isEmployeeMode ? 'Mis Solicitudes y Novedades' : 'Gestión de Solicitudes y Novedades'}
            </h1>
            {isEmployeeMode && (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Perfil Colaborador
              </span>
            )}
          </div>
          <p className="text-sm text-[#282829] mt-1 max-w-2xl">
            {isEmployeeMode
              ? 'Radica tus permisos, vacaciones, incapacidades y certificaciones para revisión por la jefatura y Gestión Humana.'
              : 'Permisos, vacaciones, incapacidades y solicitudes administrativas con flujo de aprobación formal.'}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Radicar solicitud</span>
        </button>
      </div>

      {/* Banner de Consulta para Administradores en Modo Portal */}
      {isSimulation && (
        <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#18235C] text-[#8FA7D6] flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-[#18235C] flex items-center gap-1.5">
                <span>Portal del Colaborador (Supervisión GH)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200/80 text-blue-900 font-semibold">
                  Vista Previa
                </span>
              </div>
              <p className="text-slate-600 mt-0.5">
                Visualizando solicitudes personales como: <strong className="text-slate-900">{effectiveEmpleado?.nombre || 'Colaborador'}</strong> {effectiveEmpleado?.documento ? `(C.C. ${effectiveEmpleado.documento})` : ''}.
              </p>
            </div>
          </div>
          {empleados.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="sim-emp-select" className="text-[#18235C] font-semibold text-[11px]">
                Consultar como:
              </label>
              <select
                id="sim-emp-select"
                value={effectiveEmpleado?.id || ''}
                onChange={e => setSimulatedEmpleadoId(e.target.value)}
                className="bg-white border border-blue-300 rounded px-2.5 py-1 text-xs font-semibold text-[#18235C] focus:ring-1 focus:ring-[#18235C] shadow-2xs"
              >
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} ({emp.documento})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded border border-[#8FA7D6] shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#282829]" />
          <input
            type="text"
            placeholder="Buscar por empleado o motivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#282829] font-semibold">Estado:</span>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="p-1.5 rounded border border-[#8FA7D6] bg-[#F8FAFC] text-[#18235C]"
            >
              <option value="TODOS">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#282829] font-semibold">Tipo:</span>
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="p-1.5 rounded border border-[#8FA7D6] bg-[#F8FAFC] text-[#18235C]"
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
      <div className="bg-white rounded border border-[#8FA7D6] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#8FA7D6] text-[#282829] bg-[#F8FAFC]/60">
                <th className="py-3 px-4 font-semibold">Empleado</th>
                <th className="py-3 px-4 font-semibold">Tipo de Solicitud</th>
                <th className="py-3 px-4 font-semibold">Vigencia / Fechas</th>
                <th className="py-3 px-4 font-semibold">Motivo / Justificación</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold">Resolución</th>
                <th className="py-3 px-4 font-semibold text-right">{canApprove ? 'Acciones' : 'Estado de Trámite'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8FA7D6]/60">
              {filtered.map(sol => (
                <tr key={sol.id} className="hover:bg-[#F8FAFC]/50">
                  <td className="py-3 px-4 font-medium text-[#18235C]">
                    {getEmpleadoNombre(sol.empleadoId)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#18235C]">
                    {sol.tipo}
                  </td>
                  <td className="py-3 px-4 text-[#282829]">
                    {sol.inicio} al {sol.fin}
                  </td>
                  <td className="py-3 px-4 text-[#282829] max-w-xs truncate" title={sol.motivo}>
                    {sol.motivo}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sol.estado === 'Aprobada' ? 'bg-[#8FA7D6/20] text-[#18235C]' :
                      sol.estado === 'Rechazada' ? 'bg-[#F3E3DE] text-[#A8503E]' : 'bg-[#F5EAD4] text-[#B5842A]'
                    }`}>
                      {sol.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#282829]">
                    {sol.fechaDecision ? `${sol.fechaDecision}: ${sol.comentario || 'Aprobado sin observaciones'}` : 'En espera de revisión'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canApprove ? (
                      sol.estado === 'Pendiente' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDecisionModal({ id: sol.id, accion: 'Aprobada' })}
                            className="px-2.5 py-1 rounded bg-[#18235C] hover:bg-[#101740] text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprobar</span>
                          </button>
                          <button
                            onClick={() => setDecisionModal({ id: sol.id, accion: 'Rechazada' })}
                            className="px-2.5 py-1 rounded bg-[#A8503E] hover:bg-[#863b2c] text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#282829] italic text-[11px]">Trámite completado</span>
                      )
                    ) : (
                      /* En perfil de colaborador, se despliega únicamente el estado del trámite sin controles de decisión */
                      sol.estado === 'Pendiente' ? (
                        <span className="inline-flex items-center gap-1 text-amber-800 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          En revisión por GH
                        </span>
                      ) : sol.estado === 'Aprobada' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Aprobada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-800 font-medium text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Rechazada
                        </span>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#282829]">
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
          <div className="bg-white rounded border border-[#8FA7D6] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold tracking-tight text-xl font-medium text-[#18235C]">
              Radicar Novedad o Solicitud
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#282829] mb-1">Colaborador Solicitante *</label>
                {isEmployeeMode ? (
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#18235C] text-[#8FA7D6] flex items-center justify-center font-bold text-xs shrink-0">
                        {(effectiveEmpleado?.nombre || currentUser?.nombre || 'CO').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#18235C] text-xs leading-tight">
                          {effectiveEmpleado?.nombre || currentUser?.nombre}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight">
                          {effectiveEmpleado ? `C.C. ${effectiveEmpleado.documento}` : (currentUser?.cargoNombre || 'Colaborador Registrado')}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold border border-emerald-200">
                      {isSimulation ? 'Vista Previa' : 'Titular'}
                    </span>
                  </div>
                ) : empleados.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    No hay colaboradores registrados. Agregue primero el personal en el módulo de Empleados.
                  </p>
                ) : (
                  <select
                    value={empleadoId || empleados[0]?.id}
                    onChange={e => setEmpleadoId(e.target.value)}
                    className="w-full p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  >
                    {empleados.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre} ({e.documento})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#282829] mb-1">Tipo de Trámite</label>
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value as any)}
                  className="w-full p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
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
                  <label className="block font-semibold text-[#282829] mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={inicio}
                    onChange={e => setInicio(e.target.value)}
                    className="w-full p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={fin}
                    onChange={e => setFin(e.target.value)}
                    className="w-full p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#282829] mb-1">Motivo / Justificación *</label>
                <textarea
                  rows={3}
                  required
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Detalle el motivo del trámite..."
                  className="w-full p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-[#282829] hover:bg-[#F8FAFC] rounded border border-[#8FA7D6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white font-semibold rounded"
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
          <div className="bg-white rounded border border-[#8FA7D6] max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold tracking-tight text-lg font-medium text-[#18235C]">
              Confirmar Decisión: {decisionModal.accion}
            </h3>
            <p className="text-xs text-[#282829]">
              Ingresa una observación o motivo que quedará registrado en el historial del colaborador.
            </p>

            <textarea
              rows={3}
              value={decisionComentario}
              onChange={e => setDecisionComentario(e.target.value)}
              placeholder="Observaciones de Gestión Humana..."
              className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDecisionModal(null)}
                className="px-3 py-1.5 text-xs text-[#282829] rounded border border-[#8FA7D6]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-3 py-1.5 text-xs font-semibold text-white rounded ${
                  decisionModal.accion === 'Aprobada' ? 'bg-[#18235C] hover:bg-[#101740]' : 'bg-[#A8503E] hover:bg-[#863b2c]'
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
