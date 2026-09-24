import React, { useState } from 'react';
import { EvaluacionDesempeno, Empleado, Cargo, EstadoEvaluacion, Role, UsuarioSistema } from '../types';
import {
  Award,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';
import { EvaluacionFormModal } from './EvaluacionFormModal';
import { EvaluacionDetalleModal } from './EvaluacionDetalleModal';

interface EvaluacionesAdminViewProps {
  evaluaciones: EvaluacionDesempeno[];
  empleados: Empleado[];
  cargos: Cargo[];
  userRole?: Role;
  currentEmpleadoId?: string;
  currentUser?: UsuarioSistema | null;
  onSaveEvaluacion: (evaluacion: EvaluacionDesempeno) => void;
  onDeleteEvaluacion: (evaluacionId: string) => void;
}

export const EvaluacionesAdminView: React.FC<EvaluacionesAdminViewProps> = ({
  evaluaciones,
  empleados,
  cargos,
  userRole = 'admin',
  currentEmpleadoId,
  currentUser,
  onSaveEvaluacion,
  onDeleteEvaluacion,
}) => {
  const [selectedEvaluacionForDetail, setSelectedEvaluacionForDetail] = useState<EvaluacionDesempeno | null>(null);
  const [selectedEvaluacionForEdit, setSelectedEvaluacionForEdit] = useState<EvaluacionDesempeno | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const esEmpleado = userRole === 'empleado';
  const effectiveEmpleadoId = currentEmpleadoId || currentUser?.empleadoId || '';

  // Filters
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  const getEmpleado = (id: string) => empleados.find(e => e.id === id);
  const getCargo = (id: string) => cargos.find(c => c.id === id);

  // Filtered evaluations: if employee, filter to own evaluations
  const baseEvaluaciones = esEmpleado && effectiveEmpleadoId
    ? evaluaciones.filter(ev => {
        if (ev.empleadoId === effectiveEmpleadoId) return true;
        const emp = getEmpleado(ev.empleadoId);
        if (currentUser?.email && emp?.email === currentUser.email) return true;
        return false;
      })
    : evaluaciones;

  const filtered = baseEvaluaciones.filter(ev => {
    const emp = getEmpleado(ev.empleadoId);
    const cg = getCargo(ev.cargoId);
    const matchesEstado = filterEstado === 'TODOS' || ev.estado === filterEstado;
    const matchesSearch =
      (emp?.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (cg?.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      ev.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.periodo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEstado && matchesSearch;
  });

  // Calculate high-level stats
  const totalEvals = baseEvaluaciones.length;
  const promedioPuntaje = totalEvals > 0
    ? Math.round((baseEvaluaciones.reduce((acc, curr) => acc + curr.puntajeFinal, 0) / totalEvals) * 10) / 10
    : 0;
  const totalSesgos = baseEvaluaciones.reduce((acc, curr) => acc + (curr.sesgosYAlertas?.length || 0), 0);
  const planesActivos = baseEvaluaciones.reduce((acc, curr) => acc + (curr.planDesarrollo?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8FA7D6/20] text-[#18235C] border border-[#18235C]/20">
              {esEmpleado ? 'Portal del Colaborador' : 'Metodología Técnica Documentada'}
            </span>
          </div>
          <h1 className="font-bold tracking-tight text-3xl font-medium text-[#18235C]">
            {esEmpleado ? 'Mi Evaluación Técnica de Desempeño' : 'Evaluación Técnica de Desempeño'}
          </h1>
          <p className="text-sm text-[#282829] mt-1 max-w-3xl">
            {esEmpleado
              ? 'Consulta tu expediente oficial de desempeño laboral, resultados por metas (50%), competencias observables (25%), SG-SST y procedimientos (15%) y plan de desarrollo concertado (10%).'
              : 'Modelo objetivo de 100 puntos derivado de la ficha del cargo: Resultados (50%) + Competencias (25%) + SG-SST y Procedimientos (15%) + Desarrollo y Mejora (10%).'}
          </p>
        </div>

        {!esEmpleado && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Evaluación Técnica</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-[#8FA7D6] shadow-xs">
          <div className="flex items-center justify-between text-[#282829] mb-1">
            <span className="text-xs font-semibold">{esEmpleado ? 'Mis Evaluaciones' : 'Total Evaluaciones'}</span>
            <Layers className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="font-bold tracking-tight text-2xl font-bold text-[#18235C]">{totalEvals}</div>
          <span className="text-[11px] text-[#282829]">{esEmpleado ? 'Periodos evaluados' : 'Ciclos en curso y cerrados'}</span>
        </div>

        <div className="bg-white p-4 rounded border border-[#8FA7D6] shadow-xs">
          <div className="flex items-center justify-between text-[#282829] mb-1">
            <span className="text-xs font-semibold">{esEmpleado ? 'Mi Calificación Actual' : 'Promedio Consolidado'}</span>
            <TrendingUp className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="font-bold tracking-tight text-2xl font-bold text-[#18235C]">{promedioPuntaje} / 100</div>
          <span className="text-[11px] text-[#282829]">{esEmpleado ? 'Calificación ponderada' : 'Nivel medio de la organización'}</span>
        </div>

        <div className="bg-white p-4 rounded border border-[#8FA7D6] shadow-xs">
          <div className="flex items-center justify-between text-[#282829] mb-1">
            <span className="text-xs font-semibold">{esEmpleado ? 'Estado del Expediente' : 'Alertas de Auditoría'}</span>
            <ShieldAlert className="w-4 h-4 text-[#B5842A]" />
          </div>
          <div className={`font-bold tracking-tight text-2xl font-bold ${totalSesgos > 0 ? 'text-[#B5842A]' : 'text-[#18235C]'}`}>
            {esEmpleado ? (totalEvals > 0 ? 'Vigente' : 'Pendiente') : totalSesgos}
          </div>
          <span className="text-[11px] text-[#282829]">{esEmpleado ? 'Certificación institucional' : 'Falta evidencia / Sesgo detectado'}</span>
        </div>

        <div className="bg-white p-4 rounded border border-[#8FA7D6] shadow-xs">
          <div className="flex items-center justify-between text-[#282829] mb-1">
            <span className="text-xs font-semibold">{esEmpleado ? 'Compromisos de Mejora' : 'Planes de Desarrollo'}</span>
            <CheckCircle2 className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="font-bold tracking-tight text-2xl font-bold text-[#18235C]">{planesActivos}</div>
          <span className="text-[11px] text-[#282829]">{esEmpleado ? 'Metas acordadas' : 'Planes concertados'}</span>
        </div>
      </div>

      {/* Model Blueprint Helper Card */}
      <div className="bg-[#F8FAFC] p-4 rounded border border-[#8FA7D6] text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#18235C]">
          <Award className="w-4 h-4 text-[#18235C]" />
          <span>Desglose Ponderado de los 100 Puntos (Documento de Referencia Técnica):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="bg-white p-2.5 rounded border border-[#8FA7D6]">
            <strong className="text-[#18235C] block">1. Resultados del Cargo (50%)</strong>
            <span className="text-[11px] text-[#282829]">Indicadores de gestión de la ficha técnica con meta, real y evidencia de soporte.</span>
          </div>
          <div className="bg-white p-2.5 rounded border border-[#8FA7D6]">
            <strong className="text-[#18235C] block">2. Competencias (25%)</strong>
            <span className="text-[11px] text-[#282829]">Conductas observables (Nivel 1 al 5) con evidencias de casos, PQRs o actas.</span>
          </div>
          <div className="bg-white p-2.5 rounded border border-[#8FA7D6]">
            <strong className="text-[#18235C] block">3. Responsabilidades (15%)</strong>
            <span className="text-[11px] text-[#282829]">SG-SST (4%), Procedimientos (4%), Información (3%), Admin (2%), Convivencia (2%).</span>
          </div>
          <div className="bg-white p-2.5 rounded border border-[#8FA7D6]">
            <strong className="text-[#18235C] block">4. Desarrollo y Mejora (10%)</strong>
            <span className="text-[11px] text-[#282829]">Cumplimiento plan previo (4%), Aprendizaje (3%), Iniciativas proactivas de mejora (3%).</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded border border-[#8FA7D6] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#282829]" />
          <input
            type="text"
            placeholder="Buscar por colaborador, cargo, periodo..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#282829] shrink-0" />
          <span className="text-xs text-[#282829] font-semibold whitespace-nowrap">Estado:</span>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC] font-medium text-[#18235C]"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="AUTOEVALUACION">Autoevaluación</option>
            <option value="EVALUACION_JEFE">Evaluación del Jefe</option>
            <option value="VALIDACION">Validación</option>
            <option value="RETROALIMENTACION">Retroalimentación</option>
            <option value="PLAN_DESARROLLO">Plan de Desarrollo</option>
            <option value="APROBADA">Aprobada</option>
            <option value="CERRADA">Cerrada</option>
          </select>
        </div>
      </div>

      {/* Table of Evaluations */}
      <div className="bg-white rounded border border-[#8FA7D6] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#8FA7D6] text-[#282829] bg-[#F8FAFC]/60">
                <th className="py-3 px-4 font-semibold">Colaborador / Cargo</th>
                <th className="py-3 px-4 font-semibold">Periodo</th>
                <th className="py-3 px-4 font-semibold">Resultados (50%)</th>
                <th className="py-3 px-4 font-semibold">Competencias (25%)</th>
                <th className="py-3 px-4 font-semibold">SG-SST (15%)</th>
                <th className="py-3 px-4 font-semibold">Desarrollo (10%)</th>
                <th className="py-3 px-4 font-semibold">Total / 100</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold">Alertas</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8FA7D6]/60">
              {filtered.map(ev => {
                const emp = getEmpleado(ev.empleadoId);
                const cg = getCargo(ev.cargoId);
                const tieneSesgos = ev.sesgosYAlertas && ev.sesgosYAlertas.length > 0;

                return (
                  <tr key={ev.id} className="hover:bg-[#F8FAFC]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm text-[#18235C]">{emp?.nombre || 'Colaborador'}</div>
                      <div className="text-[11px] text-[#282829]">{cg?.nombre} ({cg?.ficha.identificacion.codigo || 'S/C'})</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#18235C]">
                      {ev.periodo}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#282829]">
                      <span className="font-semibold text-[#18235C]">{ev.subtotalResultados}</span> / 50
                    </td>
                    <td className="py-3 px-4 font-mono text-[#282829]">
                      <span className="font-semibold text-[#18235C]">{ev.subtotalCompetencias}</span> / 25
                    </td>
                    <td className="py-3 px-4 font-mono text-[#282829]">
                      <span className="font-semibold text-[#18235C]">{ev.subtotalCumplimiento}</span> / 15
                    </td>
                    <td className="py-3 px-4 font-mono text-[#282829]">
                      <span className="font-semibold text-[#18235C]">{ev.subtotalDesarrollo}</span> / 10
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold tracking-tight font-bold text-sm text-[#18235C]">
                          {ev.puntajeFinal}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8FA7D6/20] text-[#18235C]">
                          {ev.clasificacion}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.estado === 'CERRADA' ? 'bg-[#8FA7D6/20] text-[#18235C]' :
                        ev.estado === 'APROBADA' ? 'bg-[#8FA7D6/20] text-[#18235C]' :
                        ev.estado === 'BORRADOR' ? 'bg-[#F8FAFC] text-[#282829] border border-[#8FA7D6]' :
                        'bg-[#F5EAD4] text-[#B5842A]'
                      }`}>
                        {ev.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {tieneSesgos ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3E3DE] text-[#A8503E]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{ev.sesgosYAlertas?.length} alerta(s)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#18235C]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Auditada</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedEvaluacionForDetail(ev)}
                          className="px-2.5 py-1 rounded bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
                        >
                          <span>{esEmpleado ? 'Ver Mi Expediente' : 'Expediente'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        {!esEmpleado && (
                          <button
                            onClick={() => setSelectedEvaluacionForEdit(ev)}
                            className="px-2 py-1 rounded border border-[#8FA7D6] hover:bg-[#F8FAFC] text-[#282829] text-xs font-semibold"
                          >
                            Calificar / Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#282829]">
                    {esEmpleado ? (
                      <div className="max-w-md mx-auto space-y-1">
                        <Award className="w-8 h-8 text-[#18235C] mx-auto opacity-40 mb-2" />
                        <div className="font-bold text-sm text-[#18235C]">No tienes evaluaciones registradas</div>
                        <p className="text-xs text-[#282829]">
                          Tu líder de área o la Dirección de Gestión Humana te notificarán formalmente cuando se aperture el ciclo de concertación de metas y evaluación de competencias de tu cargo.
                        </p>
                      </div>
                    ) : (
                      'No se encontraron evaluaciones con los filtros seleccionados.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating New */}
      {isCreating && (
        <EvaluacionFormModal
          cargos={cargos}
          empleados={empleados}
          evaluacionToEdit={null}
          onClose={() => setIsCreating(false)}
          onSave={nueva => {
            onSaveEvaluacion(nueva);
            setIsCreating(false);
          }}
        />
      )}

      {/* Modal for Editing Existing */}
      {selectedEvaluacionForEdit && (
        <EvaluacionFormModal
          cargos={cargos}
          empleados={empleados}
          evaluacionToEdit={selectedEvaluacionForEdit}
          onClose={() => setSelectedEvaluacionForEdit(null)}
          onSave={actualizada => {
            onSaveEvaluacion(actualizada);
            setSelectedEvaluacionForEdit(null);
          }}
        />
      )}

      {/* Modal for Detailed Audit / Print */}
      {selectedEvaluacionForDetail && (
        <EvaluacionDetalleModal
          evaluacion={selectedEvaluacionForDetail}
          empleados={empleados}
          cargos={cargos}
          onClose={() => setSelectedEvaluacionForDetail(null)}
        />
      )}
    </div>
  );
};
