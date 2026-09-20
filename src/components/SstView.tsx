import React, { useState, useMemo } from 'react';
import {
  ActaComiteSST,
  CicloPHVA,
  EstadisticaSiniestralidadSST,
  EstandarMinimoSST,
  EstadoEstandar,
  PeligroRiesgoGTC45
} from '../types';
import {
  ACTAS_COMITES_INICIALES,
  ESTADISTICAS_SINIESTRALIDAD_INICIALES,
  ESTANDARES_0312_2019_INICIALES,
  PELIGROS_GTC45_INICIALES
} from '../data/sstData';
import { VotacionesSstView } from './VotacionesSstView';
import { EppInventarioView } from './EppInventarioView';
import {
  Empleado,
  Role
} from '../types';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  HardHat,
  HeartPulse,
  HelpCircle,
  Layers,
  Percent,
  Plus,
  Printer,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Vote,
  Warehouse,
  XCircle
} from 'lucide-react';

interface SstViewProps {
  userRole?: Role;
  currentEmpleadoId?: string;
  empleados?: Empleado[];
}

export function SstView({
  userRole = 'admin',
  currentEmpleadoId = 'e6',
  empleados = []
}: SstViewProps) {
  const [estandares, setEstandares] = useState<EstandarMinimoSST[]>(ESTANDARES_0312_2019_INICIALES);
  const [peligros, setPeligros] = useState<PeligroRiesgoGTC45[]>(PELIGROS_GTC45_INICIALES);
  const [actas, setActas] = useState<ActaComiteSST[]>(ACTAS_COMITES_INICIALES);
  const [estadisticas] = useState<EstadisticaSiniestralidadSST[]>(ESTADISTICAS_SINIESTRALIDAD_INICIALES);

  const [activeTab, setActiveTab] = useState<'estandares' | 'gtc45' | 'comites' | 'epps' | 'votaciones' | 'indicadores' | 'planMejora'>(
    userRole === 'empleado' ? 'votaciones' : 'estandares'
  );
  const [filtroCiclo, setFiltroCiclo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [searchEstandar, setSearchEstandar] = useState<string>('');

  // Estándar seleccionado para editar evidencia o plan de mejora
  const [editingEstandarId, setEditingEstandarId] = useState<string | null>(null);

  // Cálculo del puntaje total obtenido según Res. 0312 de 2019:
  // - Si CUMPLE: suma el 100% de su pesoPorcentual.
  // - Si NO_APLICA_JUSTIFICADO: suma el 100% de su pesoPorcentual con justificación válida.
  // - Si NO_CUMPLE: 0%.
  const { puntajeTotal, estadoGlobal, colorGlobal, cumplidosCount, noCumplidosCount, noAplicaCount } = useMemo(() => {
    let score = 0;
    let cumplidos = 0;
    let noCumplidos = 0;
    let noAplica = 0;

    estandares.forEach(e => {
      if (e.estado === 'CUMPLE') {
        score += e.pesoPorcentual;
        cumplidos++;
      } else if (e.estado === 'NO_APLICA_JUSTIFICADO') {
        score += e.pesoPorcentual;
        noAplica++;
      } else {
        noCumplidos++;
      }
    });

    const roundedScore = Math.round(score * 10) / 10;
    let estado = 'ACEPTABLE';
    let color = 'text-[#18235C] bg-[#18235C]/10 border-[#18235C]/30';

    if (roundedScore < 60) {
      estado = 'CRÍTICO';
      color = 'text-[#8A2525] bg-[#E57373]/15 border-[#E57373]/30';
    } else if (roundedScore <= 85) {
      estado = 'MODERADAMENTE ACEPTABLE';
      color = 'text-[#B5842A] bg-[#F5EAD4] border-[#B5842A]/30';
    }

    return {
      puntajeTotal: roundedScore,
      estadoGlobal: estado,
      colorGlobal: color,
      cumplidosCount: cumplidos,
      noCumplidosCount: noCumplidos,
      noAplicaCount: noAplica
    };
  }, [estandares]);

  // Manejar cambio de estado de un estándar
  const handleChangeEstado = (id: string, nuevoEstado: EstadoEstandar) => {
    setEstandares(prev => prev.map(e => {
      if (e.id === id) {
        return {
          ...e,
          estado: nuevoEstado,
          fechaVerificacion: new Date().toISOString().slice(0, 10)
        };
      }
      return e;
    }));
  };

  // Manejar actualización de evidencia de un estándar
  const handleUpdateEvidencia = (id: string, evidencia: string, observaciones: string) => {
    setEstandares(prev => prev.map(e => {
      if (e.id === id) {
        return {
          ...e,
          evidenciaRegistrada: evidencia,
          observaciones,
          fechaVerificacion: new Date().toISOString().slice(0, 10)
        };
      }
      return e;
    }));
    setEditingEstandarId(null);
  };

  // Filtrado de estándares
  const estandaresFiltrados = useMemo(() => {
    return estandares.filter(e => {
      const matchCiclo = filtroCiclo === 'TODOS' || e.ciclo === filtroCiclo;
      const matchEstado = filtroEstado === 'TODOS' || e.estado === filtroEstado;
      const matchText = searchEstandar === '' ||
        e.itemEstandar.toLowerCase().includes(searchEstandar.toLowerCase()) ||
        e.numeral.includes(searchEstandar) ||
        e.criterioResolucion0312.toLowerCase().includes(searchEstandar.toLowerCase()) ||
        e.categoria.toLowerCase().includes(searchEstandar.toLowerCase());
      return matchCiclo && matchEstado && matchText;
    });
  }, [estandares, filtroCiclo, filtroEstado, searchEstandar]);

  // Estándares que no cumplen para el plan de mejora
  const estandaresNoCumplen = useMemo(() => {
    return estandares.filter(e => e.estado === 'NO_CUMPLE');
  }, [estandares]);

  return (
    <div className="space-y-6">
      {/* Header Principal del Módulo SG-SST */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5" />
                SG-SST Decreto 1072 de 2015
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F8FAFC] text-[#282829] border border-[#8FA7D6]">
                Resolución 0312 de 2019 — 21 Estándares Mínimos
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#18235C]">
              Seguridad y Salud en el Trabajo (SG-SST)
            </h1>
            <p className="text-xs sm:text-sm text-[#282829] mt-1 max-w-2xl">
              Sistema de Gestión de SST aplicable a empresas de 11 a 50 trabajadores con clasificación de riesgo I, II o III. Evaluación continua, matriz de riesgos GTC 45 y gestión de comités.
            </p>
          </div>

          {/* Puntaje y Calificación de Estándares Mínimos */}
          <div className="flex items-center gap-3 p-3 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6]">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-[#282829] tracking-wider">
                Autoevaluación Res. 0312
              </div>
              <div className="text-2xl font-bold font-serif text-[#18235C] leading-tight">
                {puntajeTotal}% <span className="text-xs font-normal text-[#282829]">/ 100%</span>
              </div>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${colorGlobal}`}>
                Nivel: {estadoGlobal}
              </div>
            </div>

            <div className="w-12 h-12 rounded-full border-2 border-[#18235C] flex items-center justify-center bg-[#18235C]/5 shrink-0">
              <ClipboardCheck className="w-6 h-6 text-[#18235C]" />
            </div>
          </div>
        </div>

        {/* Criterios de Calificación según Res. 0312 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#8FA7D6] text-xs">
          <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
            puntajeTotal < 60 ? 'bg-[#E57373]/10 border-[#E57373]/30 text-[#8A2525]' : 'bg-[#FFFFFF] border-[#8FA7D6]/60 text-[#282829]'
          }`}>
            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Crítico (&lt; 60%)</div>
              <div className="text-[11px] leading-tight mt-0.5">
                Plan de mejora inmediato a 3 meses con reporte y seguimiento obligatorio a la ARL.
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
            puntajeTotal >= 60 && puntajeTotal <= 85 ? 'bg-[#F5EAD4] border-[#B5842A]/30 text-[#B5842A]' : 'bg-[#FFFFFF] border-[#8FA7D6]/60 text-[#282829]'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Moderadamente Aceptable (61% - 85%)</div>
              <div className="text-[11px] leading-tight mt-0.5">
                Plan de mejoramiento con envío de reporte de avance a los 6 meses a la ARL.
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
            puntajeTotal > 85 ? 'bg-[#18235C]/10 border-[#18235C]/30 text-[#18235C]' : 'bg-[#FFFFFF] border-[#8FA7D6]/60 text-[#282829]'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Aceptable (&gt; 85%)</div>
              <div className="text-[11px] leading-tight mt-0.5">
                Mantener calificación e incluir las acciones de mantenimiento en el Plan Anual de Trabajo.
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas del módulo SST */}
        <div className="flex border-b border-[#8FA7D6] mt-6 gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('estandares')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'estandares'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Autoevaluación 21 Estándares Res. 0312 ({estandares.length})
          </button>
          <button
            onClick={() => setActiveTab('gtc45')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'gtc45'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Matriz de Peligros y Riesgos (GTC 45)
          </button>
          <button
            onClick={() => setActiveTab('comites')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'comites'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            COPASST & Comité Convivencia
          </button>
          <button
            onClick={() => setActiveTab('epps')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'epps'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5 text-[#B5842A]" />
            Inventario & Dotación EPPs
            <span className="px-1.5 py-0.2 bg-[#B5842A] text-white rounded-full text-[10px]">
              Almacén
            </span>
          </button>
          <button
            onClick={() => setActiveTab('votaciones')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'votaciones'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            Votaciones y Elecciones
            <span className="px-1.5 py-0.2 bg-[#18235C] text-white rounded-full text-[10px]">
              2026
            </span>
          </button>
          <button
            onClick={() => setActiveTab('indicadores')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'indicadores'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Indicadores de Siniestralidad
          </button>
          <button
            onClick={() => setActiveTab('planMejora')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'planMejora'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Plan de Mejoramiento Res. 0312
            {estandaresNoCumplen.length > 0 && (
              <span className="px-1.5 py-0.2 bg-[#E57373] text-white rounded-full text-[10px]">
                {estandaresNoCumplen.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: AUTOEVALUACIÓN 21 ESTÁNDARES RESOLUCIÓN 0312 */}
      {activeTab === 'estandares' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white rounded-xl border border-[#8FA7D6] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#282829] font-semibold">
                <Filter className="w-3.5 h-3.5" />
                Ciclo PHVA:
              </div>
              {['TODOS', 'Planear', 'Hacer', 'Verificar', 'Actuar'].map(ciclo => (
                <button
                  key={ciclo}
                  onClick={() => setFiltroCiclo(ciclo)}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                    filtroCiclo === ciclo
                      ? 'bg-[#18235C] text-white'
                      : 'bg-[#FFFFFF] text-[#282829] border border-[#8FA7D6] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {ciclo}
                </button>
              ))}

              <span className="mx-2 text-[#8FA7D6]">|</span>

              <div className="flex items-center gap-1.5 text-[#282829] font-semibold">
                Estado:
              </div>
              {['TODOS', 'CUMPLE', 'NO_CUMPLE', 'NO_APLICA_JUSTIFICADO'].map(st => (
                <button
                  key={st}
                  onClick={() => setFiltroEstado(st)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors font-medium ${
                    filtroEstado === st
                      ? 'bg-[#18235C] text-white'
                      : 'bg-[#FFFFFF] text-[#282829] border border-[#8FA7D6] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {st === 'CUMPLE' ? 'Cumple' : st === 'NO_CUMPLE' ? 'No Cumple' : st === 'NO_APLICA_JUSTIFICADO' ? 'No Aplica' : 'Todos'}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#282829]" />
              <input
                type="text"
                value={searchEstandar}
                onChange={e => setSearchEstandar(e.target.value)}
                placeholder="Buscar estándar, numeral..."
                className="pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg text-xs text-[#18235C] w-full md:w-56"
              />
            </div>
          </div>

          {/* Tabla de Estándares Mínimos */}
          <div className="bg-white rounded-xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#282829] border-b border-[#8FA7D6] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Numeral / Ciclo</th>
                    <th className="py-3 px-3">Categoría & Criterio de la Norma</th>
                    <th className="py-3 px-2 text-center">Peso</th>
                    <th className="py-3 px-3">Evidencia Soporte Documental</th>
                    <th className="py-3 px-3 text-center">Calificación</th>
                    <th className="py-3 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]">
                  {estandaresFiltrados.map(est => (
                    <tr key={est.id} className="hover:bg-[#FFFFFF]/80 transition-colors">
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className="font-bold text-[#18235C]">{est.numeral}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          est.ciclo === 'Planear' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          est.ciclo === 'Hacer' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          est.ciclo === 'Verificar' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {est.ciclo}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 align-top max-w-md">
                        <div className="text-[10px] font-bold text-[#18235C] uppercase tracking-wider mb-0.5">
                          {est.categoria}
                        </div>
                        <div className="font-semibold text-[#18235C] text-xs">
                          {est.itemEstandar}
                        </div>
                        <div className="text-[11px] text-[#282829] mt-1 leading-relaxed">
                          {est.criterioResolucion0312}
                        </div>
                        <div className="text-[10px] text-[#282829] italic mt-1 bg-[#FFFFFF] p-1.5 rounded border border-[#8FA7D6]/60">
                          <strong>Modo de verificación:</strong> {est.modoVerificacion}
                        </div>
                      </td>

                      <td className="py-3.5 px-2 align-top text-center whitespace-nowrap font-bold text-[#18235C]">
                        {est.pesoPorcentual}%
                      </td>

                      <td className="py-3.5 px-3 align-top max-w-xs">
                        <div className="text-xs text-[#18235C] font-medium leading-tight">
                          {est.evidenciaRegistrada || <span className="text-[#E57373] italic">Sin evidencia registrada</span>}
                        </div>
                        <div className="text-[10px] text-[#282829] mt-1 flex items-center gap-1.5">
                          <span>Verificado: {est.fechaVerificacion}</span>
                          <span>•</span>
                          <span>{est.responsableVerificacion}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                        <div className="inline-flex flex-col gap-1">
                          <button
                            onClick={() => handleChangeEstado(est.id, 'CUMPLE')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center justify-center gap-1 border transition-colors ${
                              est.estado === 'CUMPLE'
                                ? 'bg-[#18235C] text-white border-[#18235C]'
                                : 'bg-[#FFFFFF] text-[#282829] border-[#8FA7D6] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            Cumple ({est.pesoPorcentual}%)
                          </button>

                          <button
                            onClick={() => handleChangeEstado(est.id, 'NO_CUMPLE')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center justify-center gap-1 border transition-colors ${
                              est.estado === 'NO_CUMPLE'
                                ? 'bg-[#E57373] text-white border-[#E57373]'
                                : 'bg-[#FFFFFF] text-[#282829] border-[#8FA7D6] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <XCircle className="w-3 h-3" />
                            No Cumple (0%)
                          </button>

                          <button
                            onClick={() => handleChangeEstado(est.id, 'NO_APLICA_JUSTIFICADO')}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                              est.estado === 'NO_APLICA_JUSTIFICADO'
                                ? 'bg-[#B5842A] text-white border-[#B5842A]'
                                : 'bg-[#FFFFFF] text-[#282829] border-[#8FA7D6] hover:bg-[#F8FAFC]'
                            }`}
                            title="No aplica con justificación válida legal según Res. 0312"
                          >
                            No Aplica
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingEstandarId(est.id)}
                          className="px-2.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#18235C] border border-[#8FA7D6] rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Evidencia
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal para Editar Evidencia */}
          {editingEstandarId && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl border border-[#8FA7D6] max-w-lg w-full p-6 shadow-xl">
                {(() => {
                  const est = estandares.find(e => e.id === editingEstandarId);
                  if (!est) return null;

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start border-b border-[#8FA7D6] pb-3">
                        <div>
                          <div className="text-[10px] font-bold text-[#18235C] uppercase">
                            Numeral {est.numeral} • Peso: {est.pesoPorcentual}%
                          </div>
                          <h3 className="font-bold text-sm text-[#18235C]">
                            {est.itemEstandar}
                          </h3>
                        </div>
                        <button
                          onClick={() => setEditingEstandarId(null)}
                          className="text-[#282829] hover:text-[#18235C] font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="text-xs text-[#282829] bg-[#FFFFFF] p-3 rounded border border-[#8FA7D6]">
                        <strong>Criterio legal:</strong> {est.criterioResolucion0312}
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block font-semibold text-[#18235C] mb-1">
                            Soporte o Evidencia Registrada:
                          </label>
                          <textarea
                            id="modal-evidencia-input"
                            defaultValue={est.evidenciaRegistrada}
                            rows={3}
                            className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
                            placeholder="Describa el documento, acta, certificación o código del soporte digital..."
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-[#18235C] mb-1">
                            Observaciones de Verificación:
                          </label>
                          <input
                            id="modal-obs-input"
                            type="text"
                            defaultValue={est.observaciones}
                            className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
                            placeholder="Vigencias, entidad certificadora o notas..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]">
                        <button
                          onClick={() => setEditingEstandarId(null)}
                          className="px-3 py-1.5 text-xs text-[#282829] hover:text-[#18235C]"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            const ev = (document.getElementById('modal-evidencia-input') as HTMLTextAreaElement)?.value || '';
                            const obs = (document.getElementById('modal-obs-input') as HTMLInputElement)?.value || '';
                            handleUpdateEvidencia(est.id, ev, obs);
                          }}
                          className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Guardar Soporte
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATRIZ DE PELIGROS Y RIESGOS (GTC 45) */}
      {activeTab === 'gtc45' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#8FA7D6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#18235C]" />
                Matriz de Identificación de Peligros, Evaluación y Valoración de Riesgos
              </h3>
              <p className="text-xs text-[#282829] mt-0.5">
                Metodología Guía Técnica Colombiana GTC 45 (Segunda Actualización) adaptada a operaciones ISP y actividades de oficina.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20">
              {peligros.length} Peligros Priorizados Evaluados
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {peligros.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8FA7D6] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#18235C] text-white uppercase tracking-wider">
                        {p.proceso}
                      </span>
                      <span className="text-xs font-semibold text-[#18235C]">{p.zonaLugar}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#18235C] mt-1">
                      {p.actividad} {p.rutinaria ? '(Rutinaria)' : '(No rutinaria)'}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      p.interpretacionRiesgo === 'I' ? 'bg-[#E57373]/15 text-[#8A2525] border-[#E57373]/30' :
                      p.interpretacionRiesgo === 'II' ? 'bg-[#F5EAD4] text-[#B5842A] border-[#B5842A]/30' :
                      'bg-[#18235C]/10 text-[#18235C] border-[#18235C]/30'
                    }`}>
                      Nivel de Riesgo {p.interpretacionRiesgo} • {p.aceptabilidadRiesgo}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#FFFFFF] rounded border border-[#8FA7D6]">
                    <div className="text-[10px] font-bold text-[#282829] uppercase mb-1">
                      Clasificación: {p.clasificacionPeligro}
                    </div>
                    <div className="font-medium text-[#18235C]">{p.descripcionPeligro}</div>
                    <div className="text-[11px] text-[#E57373] font-semibold mt-1">
                      Efectos: {p.efectosPosibles}
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFFFFF] rounded border border-[#8FA7D6]">
                    <div className="text-[10px] font-bold text-[#282829] uppercase mb-1">
                      Controles Existentes
                    </div>
                    <ul className="space-y-1 text-[#282829] text-[11px]">
                      <li>• <strong>Fuente:</strong> {p.controlesExistentes.fuente}</li>
                      <li>• <strong>Medio:</strong> {p.controlesExistentes.medio}</li>
                      <li>• <strong>Individuo:</strong> {p.controlesExistentes.individuo}</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-[#FFFFFF] rounded border border-[#8FA7D6]">
                    <div className="text-[10px] font-bold text-[#282829] uppercase mb-1">
                      Evaluación Cuantitativa GTC 45
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-[#282829]">
                      <div>ND (Deficiencia): <strong>{p.nivelDeficiencia}</strong></div>
                      <div>NE (Exposición): <strong>{p.nivelExposicion}</strong></div>
                      <div>NP (Probabilidad): <strong>{p.nivelProbabilidad} ({p.interpretacionProbabilidad})</strong></div>
                      <div>NC (Consecuencia): <strong>{p.nivelConsecuencia}</strong></div>
                    </div>
                    <div className="text-xs font-bold text-[#18235C] mt-1 pt-1 border-t border-[#8FA7D6]">
                      NR = NP × NC = {p.nivelRiesgo}
                    </div>
                  </div>
                </div>

                {/* Medidas de intervención jerárquica */}
                <div className="p-3 bg-[#18235C]/5 rounded-lg border border-[#18235C]/20 text-xs">
                  <div className="font-bold text-[#18235C] mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Medidas de Intervención por Jerarquía de Controles:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-[#282829]">
                    <div>
                      <strong className="text-[#18235C]">Controles de Ingeniería:</strong> {p.medidasIntervencion.controlesIngenieria}
                    </div>
                    <div>
                      <strong className="text-[#18235C]">Controles Administrativos:</strong> {p.medidasIntervencion.controlesAdministrativos}
                    </div>
                    <div>
                      <strong className="text-[#18235C]">EPP Específicos:</strong> {p.medidasIntervencion.epp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COPASST & COMITÉ DE CONVIVENCIA */}
      {activeTab === 'comites' && (
        <div className="space-y-6">
          {/* Banner de Acceso a Votaciones */}
          <div className="p-4 bg-gradient-to-r from-[#18235C]/10 to-[#FFFFFF] border border-[#18235C]/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#18235C] text-white flex items-center justify-center shrink-0">
                <Vote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#18235C]">
                  Proceso de Elecciones Electrónicas COPASST y Convivencia en Curso
                </h4>
                <p className="text-[11px] text-[#282829]">
                  Sufragio secreto digital para los representantes de los trabajadores (Periodo 2026-2028).
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('votaciones')}
              className="px-3.5 py-1.5 bg-[#18235C] hover:bg-[#24493F] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
            >
              <span>Ingresar a Votaciones & Tarjetón</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {actas.map(acta => (
              <div key={acta.id} className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-[#8FA7D6] pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C]/10 text-[#18235C]">
                      {acta.tipo}
                    </span>
                    <h3 className="font-bold text-sm text-[#18235C] mt-1">
                      {acta.numeroActa}
                    </h3>
                    <div className="text-xs text-[#282829]">
                      Fecha: {acta.fecha} • {acta.lugar}
                    </div>
                  </div>
                </div>

                <div className="text-xs">
                  <div className="font-semibold text-[#18235C] mb-1">Integrantes Asistentes:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {acta.asistentes.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#FFFFFF] border border-[#8FA7D6] rounded text-[11px] text-[#282829]">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs">
                  <div className="font-semibold text-[#18235C] mb-1">Temas Tratados:</div>
                  <p className="text-[#282829] bg-[#FFFFFF] p-2.5 rounded border border-[#8FA7D6] leading-relaxed">
                    {acta.temasTratados}
                  </p>
                </div>

                <div className="text-xs">
                  <div className="font-semibold text-[#18235C] mb-1.5">Compromisos y Seguimiento:</div>
                  <div className="space-y-1.5">
                    {acta.compromisos.map((c, i) => (
                      <div key={i} className="p-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium text-[#18235C]">{c.tarea}</div>
                          <div className="text-[10px] text-[#282829]">
                            Responsable: {c.responsable} • Límite: {c.fechaLimite}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.estado === 'Cumplido' ? 'bg-[#18235C]/15 text-[#18235C]' : 'bg-[#B5842A]/15 text-[#B5842A]'
                        }`}>
                          {c.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3.5: VOTACIONES COPASST & CONVIVENCIA */}
      {activeTab === 'votaciones' && (
        <VotacionesSstView
          userRole={userRole}
          currentEmpleadoId={currentEmpleadoId}
          empleados={empleados}
        />
      )}

      {/* TAB 3.6: INVENTARIO Y DOTACIÓN DE EPPS */}
      {activeTab === 'epps' && (
        <EppInventarioView
          userRole={userRole}
          currentEmpleadoId={currentEmpleadoId}
          empleados={empleados}
        />
      )}

      {/* TAB 4: INDICADORES DE SINIESTRALIDAD */}
      {activeTab === 'indicadores' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-sm">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-[#18235C]" />
              Indicadores Mínimos de Seguridad y Salud en el Trabajo (Resolución 0312 Art. 30)
            </h3>
            <p className="text-xs text-[#282829] mb-5">
              Registro histórico de frecuencia de accidentalidad (IF), severidad (IS), proporción de accidentes mortales y prevalencia de enfermedad laboral.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#282829] border-b border-[#8FA7D6] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-2.5 px-3">Período</th>
                    <th className="py-2.5 px-3">HHT (Horas)</th>
                    <th className="py-2.5 px-3">Trabajadores</th>
                    <th className="py-2.5 px-3 text-center">Accidentes (AT)</th>
                    <th className="py-2.5 px-3 text-center">Días Incapacidad</th>
                    <th className="py-2.5 px-3 text-center">Índice Frecuencia (IF)</th>
                    <th className="py-2.5 px-3 text-center">Índice Severidad (IS)</th>
                    <th className="py-2.5 px-3 text-center">Ausentismo (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]">
                  {estadisticas.map((s, idx) => (
                    <tr key={idx} className="hover:bg-[#FFFFFF]/80">
                      <td className="py-2.5 px-3 font-semibold text-[#18235C]">{s.mesAno}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{s.horasHombreTrabajadas.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{s.numeroTrabajadores}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-[#18235C]">{s.accidentesTrabajo}</td>
                      <td className="py-2.5 px-3 text-center text-[#282829]">{s.diasIncapacidadAT}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#18235C]">{s.indiceFrecuenciaAT.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#18235C]">{s.indiceSeveridadAT.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center text-[#282829]">{s.tasaAusentismoPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PLAN DE MEJORAMIENTO RES. 0312 */}
      {activeTab === 'planMejora' && (
        <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8FA7D6] pb-4">
            <div>
              <h3 className="font-bold text-base text-[#18235C] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#18235C]" />
                Plan de Mejoramiento Derivado de la Autoevaluación
              </h3>
              <p className="text-xs text-[#282829] mt-0.5">
                Conforme al artículo 28 de la Resolución 0312 de 2019, para los estándares calificados con "No Cumple" se formula automáticamente el plan de mejora con acciones, fechas y responsables.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Plan de Mejora
            </button>
          </div>

          {estandaresNoCumplen.length === 0 ? (
            <div className="p-8 text-center bg-[#18235C]/5 rounded-xl border border-[#18235C]/20">
              <CheckCircle2 className="w-10 h-10 text-[#18235C] mx-auto mb-2" />
              <h4 className="font-bold text-sm text-[#18235C]">
                ¡Excelente Desempeño en Seguridad y Salud en el Trabajo!
              </h4>
              <p className="text-xs text-[#282829] max-w-md mx-auto mt-1">
                Todos los 21 estándares de la Resolución 0312 de 2019 se encuentran actualmente en estado <strong>CUMPLE</strong> o <strong>NO APLICA CON JUSTIFICACIÓN VÁLIDA</strong>.
                La organización califica en nivel <strong>ACEPTABLE ({puntajeTotal}%)</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-[#E57373]/10 border border-[#E57373]/30 rounded-lg text-xs text-[#8A2525]">
                Se identificaron <strong>{estandaresNoCumplen.length} estándares en estado "No Cumple"</strong> que requieren acciones correctivas para cumplir la normatividad del Ministerio del Trabajo.
              </div>

              <div className="divide-y divide-[#8FA7D6] border border-[#8FA7D6] rounded-xl overflow-hidden">
                {estandaresNoCumplen.map(nc => (
                  <div key={nc.id} className="p-4 bg-white space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-[#E57373] mr-2">Numeral {nc.numeral}</span>
                        <strong className="text-[#18235C]">{nc.itemEstandar}</strong>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E57373]/15 text-[#8A2525]">
                        Peso: {nc.pesoPorcentual}%
                      </span>
                    </div>
                    <div className="text-[11px] text-[#282829]">
                      <strong>Criterio no satisfecho:</strong> {nc.criterioResolucion0312}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                      <div className="p-2 bg-[#FFFFFF] rounded border border-[#8FA7D6]">
                        <span className="text-[#282829] block font-semibold">Acción correctiva propuesta:</span>
                        <span className="text-[#18235C]">{nc.planMejoraAccion || 'Elaborar soporte documental y socializar con el personal.'}</span>
                      </div>
                      <div className="p-2 bg-[#FFFFFF] rounded border border-[#8FA7D6]">
                        <span className="text-[#282829] block font-semibold">Fecha límite de cierre:</span>
                        <span className="text-[#18235C]">{nc.planMejoraFecha || 'A 60 días calendario'}</span>
                      </div>
                      <div className="p-2 bg-[#FFFFFF] rounded border border-[#8FA7D6]">
                        <span className="text-[#282829] block font-semibold">Responsable:</span>
                        <span className="text-[#18235C]">{nc.planMejoraResponsable || 'Responsable del SG-SST & Gerencia'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
