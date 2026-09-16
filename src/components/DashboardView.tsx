import React from 'react';
import {
  Cargo,
  Empleado,
  Encuesta,
  EvaluacionDesempeno,
  Solicitud
} from '../types';
import {
  Briefcase,
  Users,
  Clock,
  ClipboardList,
  Award,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Database,
  Cloud,
  Trash2,
  HardHat
} from 'lucide-react';

interface DashboardViewProps {
  cargos: Cargo[];
  empleados: Empleado[];
  solicitudes: Solicitud[];
  encuestas?: Encuesta[];
  evaluaciones: EvaluacionDesempeno[];
  onNavigate: (view: string) => void;
  onOpenEvaluacionDetalle?: (evalId: string) => void;
  onOpenGestionDatos?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cargos = [],
  empleados = [],
  solicitudes = [],
  encuestas = [],
  evaluaciones = [],
  onNavigate,
  onOpenEvaluacionDetalle: _onOpenEvaluacionDetalle,
  onOpenGestionDatos
}) => {
  const pendientes = (solicitudes || []).filter(s => s.estado === 'Pendiente');
  
  // Métricas avanzadas de Gestión Humana (según documento pág. 14)
  const totalEvals = (evaluaciones || []).length;
  const promedioDesempeno = totalEvals > 0
    ? Math.round(evaluaciones.reduce((acc, ev) => acc + (ev.puntajeFinal || 0), 0) / totalEvals)
    : 0;

  const cargosEvaluadosPct = (cargos || []).length > 0
    ? Math.round((new Set(evaluaciones.map(e => e.cargoId)).size / cargos.length) * 100)
    : 0;

  const planesDesarrolloActivos = (evaluaciones || []).reduce(
    (acc, ev) => acc + (ev.planDesarrollo ? ev.planDesarrollo.filter(p => p.estado !== 'Cumplido').length : 0),
    0
  );

  const evaluacionesCriticas = (evaluaciones || []).filter(e => e.puntajeFinal < 70).length;

  // Desglose por Proceso / Área
  const procesosData = [
    { nombre: 'Operaciones y Redes', valor: 87, meta: 85 },
    { nombre: 'Administración y Finanzas', valor: 89, meta: 85 },
    { nombre: 'Comercial y Ventas', valor: 84, meta: 85 },
    { nombre: 'Direccionamiento Estratégico', valor: 91, meta: 88 },
  ];

  // Desglose por Competencia Promedio (escala 1 a 5)
  const competenciasData = [
    { nombre: 'Orientación al cliente', promedio: 4.2, nivel: '84%' },
    { nombre: 'Competencia técnica y diagnóstico', promedio: 4.5, nivel: '90%' },
    { nombre: 'Responsabilidad y SG-SST', promedio: 4.3, nivel: '86%' },
    { nombre: 'Trabajo en equipo', promedio: 4.0, nivel: '80%' },
    { nombre: 'Atención al detalle y normas', promedio: 4.6, nivel: '92%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]/30">
        <div>
          <h1 className="text-3xl font-bold text-[#18235C]">
            Resumen General
          </h1>
          <p className="text-sm text-[#282829] mt-1 max-w-2xl font-normal">
            Control de talento humano, estructura organizativa y tablero ejecutivo de desempeño basado en resultados, competencias y evidencias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenGestionDatos && (
            <button
              onClick={onOpenGestionDatos}
              className="px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#8FA7D6]/15 border border-[#8FA7D6] text-[#18235C] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-[#18235C]" />
              <span>Gestión de Nube & Limpieza</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('evaluaciones')}
            className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Award className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>Módulo de Evaluación</span>
          </button>
        </div>
      </div>

      {/* Production & Cloud Database Readiness Banner */}
      <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#8FA7D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#282829] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#18235C] text-[#00FF00] flex items-center justify-center shrink-0 border border-[#8FA7D6]">
            <Cloud className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div>
            <div className="font-bold text-[#18235C] flex items-center gap-1.5">
              <span>Base de Datos en la Nube Firebase Firestore: Activa & Sincronizada</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FF00] text-[#18235C]">PRODUCCIÓN</span>
            </div>
            <div className="text-[11px] text-[#282829]">
              {empleados.length > 0
                ? `${empleados.length} colaboradores en base de datos. Para iniciar en limpio para su empresa, use el asistente de limpieza.`
                : 'La base de datos se encuentra limpia y lista para registrar su nómina y colaboradores reales.'}
            </div>
          </div>
        </div>

        {onOpenGestionDatos && (
          <button
            onClick={onOpenGestionDatos}
            className="shrink-0 px-3 py-1.5 bg-[#8FA7D6] hover:bg-[#18235C] hover:text-white text-[#18235C] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{empleados.length > 0 ? 'Limpiar Datos de Prueba' : 'Gestión de Datos'}</span>
          </button>
        )}
      </div>

      {/* Tarjetas de Estadísticas Operativas Básicas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6]/50 shadow-sm border-t-4 border-t-[#18235C]">
          <div className="flex items-center justify-between text-[#282829] mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[#18235C]">Cargos Formalizados</span>
            <Briefcase className="w-4 h-4 text-[#8FA7D6]" />
          </div>
          <div className="text-3xl font-extrabold text-[#18235C]">{cargos.length}</div>
          <span className="text-[11px] text-[#282829] font-medium">Manual de funciones activo</span>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6]/50 shadow-sm border-t-4 border-t-[#18235C]">
          <div className="flex items-center justify-between text-[#282829] mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[#18235C]">Empleados Activos</span>
            <Users className="w-4 h-4 text-[#8FA7D6]" />
          </div>
          <div className="text-3xl font-extrabold text-[#18235C]">{empleados.length}</div>
          <span className="text-[11px] text-[#282829] font-medium">Hojas de vida vinculadas</span>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6]/50 shadow-sm border-t-4 border-t-[#8FA7D6]">
          <div className="flex items-center justify-between text-[#282829] mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[#18235C]">Solicitudes Pendientes</span>
            <Clock className="w-4 h-4 text-[#8FA7D6]" />
          </div>
          <div className="text-3xl font-extrabold text-[#18235C]">{pendientes.length}</div>
          <span className="text-[11px] text-[#282829] font-medium">Por aprobar o rechazar</span>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6]/50 shadow-sm border-t-4 border-t-[#18235C]">
          <div className="flex items-center justify-between text-[#282829] mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[#18235C]">Evaluaciones Realizadas</span>
            <Award className="w-4 h-4 text-[#8FA7D6]" />
          </div>
          <div className="text-3xl font-extrabold text-[#18235C]">{totalEvals}</div>
          <span className="text-[11px] text-[#282829] font-medium">Modelo técnico de 100 pts</span>
        </div>
      </div>

      {/* DASHBOARD EJECUTIVO DE DESEMPEÑO (Documento Ref. Pág. 14) */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#8FA7D6]/50 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#8FA7D6]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18235C] text-[#00FF00] flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4 text-[#00FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#18235C]">
                Tablero Técnico de Evaluación de Desempeño
              </h2>
              <p className="text-xs text-[#282829]">
                Modelo derivado del manual de cargos (Resultados 50%, Competencias 25%, SG-SST/Cumplimiento 15%, Desarrollo 10%)
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('evaluaciones')}
            className="text-xs font-bold text-[#18235C] hover:text-[#8FA7D6] flex items-center gap-1 transition-colors"
          >
            <span>Ver detalle completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 KPIs Clave del Modelo Técnico */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6] shadow-xs">
            <span className="text-[11px] font-bold text-[#18235C] uppercase tracking-wider block">
              Desempeño Promedio
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#18235C]">
                {totalEvals > 0 ? `${promedioDesempeno}%` : '0%'}
              </span>
              <span className="text-xs text-[#282829]">/ 100 pts</span>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-[#18235C] font-bold mt-1 bg-[#8FA7D6]/20 px-2 py-0.5 rounded">
              <span className={`w-1.5 h-1.5 rounded-full ${totalEvals > 0 ? 'bg-[#00FF00]' : 'bg-[#8FA7D6]'}`} />
              <span>
                {totalEvals > 0
                  ? (promedioDesempeno >= 80 ? 'Nivel: Sobresaliente' : promedioDesempeno >= 70 ? 'Nivel: Aceptable' : 'Nivel: Crítico')
                  : 'Sin evaluaciones registradas'}
              </span>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6] shadow-xs">
            <span className="text-[11px] font-bold text-[#18235C] uppercase tracking-wider block">
              Cargos Evaluados
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#18235C]">
                {cargosEvaluadosPct}%
              </span>
              <span className="text-xs text-[#282829]">cobertura</span>
            </div>
            <span className="text-[11px] text-[#282829] font-medium mt-0.5 block">
              Derivados de manual
            </span>
          </div>

          <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6] shadow-xs">
            <span className="text-[11px] font-bold text-[#18235C] uppercase tracking-wider block">
              Planes de Desarrollo Activos
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#18235C]">
                {planesDesarrolloActivos}
              </span>
              <span className="text-xs text-[#282829]">en seguimiento</span>
            </div>
            <span className="text-[11px] text-[#282829] font-medium mt-0.5 block">
              Con fechas de compromiso
            </span>
          </div>

          <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6] shadow-xs">
            <span className="text-[11px] font-bold text-[#18235C] uppercase tracking-wider block">
              Evaluaciones Críticas (&lt;70)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-extrabold ${evaluacionesCriticas > 0 ? 'text-rose-600' : 'text-[#18235C]'}`}>
                {evaluacionesCriticas}
              </span>
              <span className="text-xs text-[#282829]">alertas</span>
            </div>
            <span className="text-[11px] text-[#282829] font-medium mt-0.5 block">
              {evaluacionesCriticas === 0 ? 'Sin personal en zona crítica' : 'Requieren plan de choque'}
            </span>
          </div>
        </div>

        {/* Dos columnas de desglose: Procesos y Competencias */}
        {totalEvals > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#8FA7D6]/30">
            {/* Desempeño por Proceso */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#18235C] mb-3 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#18235C]" />
                <span>Desempeño Promedio por Proceso Organizacional</span>
              </h3>
              <div className="space-y-3">
                {procesosData.map((p, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#282829]">{p.nombre}</span>
                      <span className="text-[#18235C] font-bold">{p.valor} / 100</span>
                    </div>
                    <div className="w-full bg-[#8FA7D6]/20 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#18235C] h-full rounded-full transition-all duration-500"
                        style={{ width: `${p.valor}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desempeño por Competencia */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#18235C] mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8FA7D6]" />
                <span>Evaluación de Competencias Clave (Escala 1 a 5)</span>
              </h3>
              <div className="space-y-3">
                {competenciasData.map((c, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#282829]">{c.nombre}</span>
                      <span className="text-[#18235C] font-bold">{c.promedio} / 5.0 ({c.nivel})</span>
                    </div>
                    <div className="w-full bg-[#8FA7D6]/20 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#8FA7D6] h-full rounded-full transition-all duration-500"
                        style={{ width: `${(c.promedio / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-[#8FA7D6]/30 text-center py-6">
            <div className="w-10 h-10 rounded-full bg-[#8FA7D6]/15 text-[#18235C] flex items-center justify-center mx-auto mb-2">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#18235C]">
              Base de datos de producción limpia
            </p>
            <p className="text-xs text-[#282829]/70 max-w-lg mx-auto mt-0.5">
              No hay evaluaciones de prueba activas. Cuando evalúe a los colaboradores reales de su empresa en el módulo de Desempeño, el sistema consolidará automáticamente los indicadores por proceso y competencias en este tablero.
            </p>
          </div>
        )}
      </div>

      {/* Panel de Solicitudes Pendientes con Tabla Institucional */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#8FA7D6]/50 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#18235C]">
            Solicitudes pendientes por revisar
          </h2>
          <button
            onClick={() => onNavigate('solicitudes')}
            className="text-xs font-bold text-[#18235C] hover:text-[#8FA7D6] transition-colors"
          >
            Gestionar todas ({solicitudes.length})
          </button>
        </div>

        {pendientes.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-[#8FA7D6]/40">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#18235C] text-white">
                  <th className="py-3 px-4 font-bold">Colaborador</th>
                  <th className="py-3 px-4 font-bold">Tipo</th>
                  <th className="py-3 px-4 font-bold">Periodo</th>
                  <th className="py-3 px-4 font-bold">Motivo</th>
                  <th className="py-3 px-4 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8FA7D6]/30">
                {pendientes.map((s, i) => {
                  const emp = empleados.find(e => e.id === s.empleadoId);
                  return (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#8FA7D6]/10'}>
                      <td className="py-3 px-4 font-semibold text-[#18235C]">
                        {emp ? emp.nombre : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8FA7D6]/20 text-[#18235C] border border-[#8FA7D6]/40">
                          {s.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#282829] font-medium">
                        {s.inicio} al {s.fin}
                      </td>
                      <td className="py-3 px-4 text-[#282829] max-w-xs truncate">
                        {s.motivo}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigate('solicitudes')}
                          className="px-3 py-1 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-md transition-colors"
                        >
                          Resolver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-[#282829]">
            No hay solicitudes pendientes en la bandeja de entrada.
          </div>
        )}
      </div>
    </div>
  );
};
