import React, { useState, useMemo } from 'react';
import {
  Capacitacion,
  Cargo,
  Empleado,
  ExamenConocimientoCapacitacion,
  PreguntaExamen,
  RegistroParticipanteCapacitacion,
  Role,
  RolSistema
} from '../types';
import { CAPACITACIONES_INICIALES } from '../data/capacitacionesData';
import { limpiarCapacitacionesFB } from '../lib/firebase';
import {
  AlertCircle,
  Award,
  Trash2,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  MapPin,
  PenTool,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  Video,
  X,
  XCircle
} from 'lucide-react';

interface CapacitacionesViewProps {
  cargos: Cargo[];
  empleados: Empleado[];
  userRole: Role;
  rolSistema?: RolSistema;
  currentEmpleadoId?: string;
}

export function CapacitacionesView({
  cargos,
  empleados,
  userRole,
  rolSistema,
  currentEmpleadoId
}: CapacitacionesViewProps) {
  const isSuperAdmin = rolSistema === 'superadmin';

  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>(() => {
    const limpio = typeof window !== 'undefined' && (
      localStorage.getItem('bgroup_datos_limpios') === 'true' ||
      localStorage.getItem('bgroup_capacitaciones_limpias') === 'true'
    );
    if (limpio || empleados.length === 0) {
      const empIds = new Set(empleados.map(e => e.id));
      return CAPACITACIONES_INICIALES.map(c => ({
        ...c,
        participantes: c.participantes.filter(p => empIds.has(p.empleadoId))
      }));
    }
    return CAPACITACIONES_INICIALES;
  });

  const [modalDepurarOpen, setModalDepurarOpen] = useState(false);
  const [depurando, setDepurando] = useState(false);
  const [mensajeDepuracion, setMensajeDepuracion] = useState<string | null>(null);

  const handleEjecutarDepuracionCapacitaciones = async () => {
    setDepurando(true);
    try {
      await limpiarCapacitacionesFB();
      setCapacitaciones(prev => prev.map(c => ({ ...c, participantes: [] })));
      setMensajeDepuracion("Base de datos de capacitaciones depurada: se eliminaron las asistencias, calificaciones y participantes de prueba.");
      setModalDepurarOpen(false);
      setTimeout(() => setMensajeDepuracion(null), 5000);
    } catch (e: any) {
      alert("Error al depurar capacitaciones: " + e.message);
    } finally {
      setDepurando(false);
    }
  };

  // Sincronizar participantes si cambian los empleados o se limpia la base de datos
  React.useEffect(() => {
    const checkLimpio = () => {
      const limpio = typeof window !== 'undefined' && (
        localStorage.getItem('bgroup_datos_limpios') === 'true' ||
        localStorage.getItem('bgroup_capacitaciones_limpias') === 'true'
      );
      if (limpio) {
        const empIds = new Set(empleados.map(e => e.id));
        setCapacitaciones(prev =>
          prev.map(c => ({
            ...c,
            participantes: c.participantes.filter(p => empIds.has(p.empleadoId))
          }))
        );
      }
    };
    window.addEventListener('storage', checkLimpio);
    return () => window.removeEventListener('storage', checkLimpio);
  }, [empleados]);

  React.useEffect(() => {
    const limpio = typeof window !== 'undefined' && (
      localStorage.getItem('bgroup_datos_limpios') === 'true' ||
      localStorage.getItem('bgroup_capacitaciones_limpias') === 'true'
    );
    if (limpio || empleados.length === 0) {
      const empIds = new Set(empleados.map(e => e.id));
      setCapacitaciones(prev =>
        prev.map(c => ({
          ...c,
          participantes: c.participantes.filter(p => empIds.has(p.empleadoId))
        }))
      );
    }
  }, [empleados]);

  const [activeTab, setActiveTab] = useState<'catalogo' | 'misCapacitaciones' | 'crear' | 'reportes'>(
    userRole === 'admin' ? 'catalogo' : 'misCapacitaciones'
  );

  // Empleado simulado activo para confirmar asistencia y presentar evaluación
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>(
    currentEmpleadoId || empleados[0]?.id || ''
  );

  // Modal de examen interactivo activo
  const [activeExamCapacitacion, setActiveExamCapacitacion] = useState<Capacitacion | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examResult, setExamResult] = useState<{
    presentado: boolean;
    puntaje: number;
    aprobado: boolean;
    totalPreguntas: number;
    correctas: number;
    retroalimentaciones: {
      pregunta: string;
      opcionSeleccionada: string;
      opcionCorrecta: string;
      esCorrecta: boolean;
      explicacion: string;
    }[];
  } | null>(null);

  // Modal para ver certificado / constancia
  const [certificadoModal, setCertificadoModal] = useState<{
    capacitacion: Capacitacion;
    empleado: Empleado;
    participante: RegistroParticipanteCapacitacion;
  } | null>(null);

  // Estado para el formulario de crear nueva capacitación
  const [nuevaCap, setNuevaCap] = useState<{
    codigo: string;
    titulo: string;
    objetivo: string;
    tipo: 'SST' | 'Técnica' | 'Habilidades Blandas' | 'Normativa y Cumplimiento' | 'Gestión Operativa';
    facilitador: string;
    entidadFacilitadora: string;
    duracionHoras: number;
    modalidad: 'Presencial' | 'Virtual sincrónica' | 'Asincrónica' | 'Mixta';
    fechaProgramada: string;
    horaInicio: string;
    lugarOEnlace: string;
    cargosAsignados: string[];
    // Preguntas del examen previo
    notaMinima: number;
    tiempoLimite: number;
    preguntas: PreguntaExamen[];
  }>({
    codigo: `CAP-2026-${String(capacitaciones.length + 1).padStart(3, '0')}`,
    titulo: '',
    objetivo: '',
    tipo: 'SST',
    facilitador: '',
    entidadFacilitadora: 'B GROUP INGENIERIA S.A.S. / Asesor Especializado',
    duracionHoras: 4,
    modalidad: 'Presencial',
    fechaProgramada: new Date().toISOString().slice(0, 10),
    horaInicio: '08:00 AM',
    lugarOEnlace: 'Sala de Capacitación o Google Meet',
    cargosAsignados: [],
    notaMinima: 80,
    tiempoLimite: 20,
    preguntas: [
      {
        id: 'p_nueva_1',
        enunciado: '¿Cuál es el objetivo principal del procedimiento abordado en esta sesión técnica?',
        opciones: [
          'Cumplir únicamente con un requerimiento administrativo sin aplicación práctica.',
          'Garantizar la seguridad de las personas y la continuidad óptima del servicio.',
          'Acelerar el trabajo prescindiendo de los elementos de seguridad obligatorios.',
          'Delegar la responsabilidad operativa en personal no certificado.'
        ],
        opcionCorrectaIndice: 1,
        explicacionRespuesta: 'El objetivo primordial siempre es la preservación de la vida, salud y excelencia operativa en el marco de la normatividad.',
        puntos: 50
      },
      {
        id: 'p_nueva_2',
        enunciado: '¿A qué canal oficial deben reportarse de forma inmediata los incidentes o desvíos detectados?',
        opciones: [
          'A las redes sociales personales de los compañeros.',
          'Al Coordinador de Operaciones y al área de Seguridad y Salud en el Trabajo.',
          'No es necesario reportar desvíos si no hubo daños visibles.',
          'Esperar a la reunión anual de gerencia.'
        ],
        opcionCorrectaIndice: 1,
        explicacionRespuesta: 'El reporte inmediato al coordinador y a SST previene la materialización de accidentes y asegura trazabilidad formal.',
        puntos: 50
      }
    ]
  });

  // Empleado actual seleccionado en vista
  const empleadoActual = useMemo(() => {
    return empleados.find(e => e.id === selectedEmpleadoId) || empleados[0];
  }, [empleados, selectedEmpleadoId]);

  // Filtrar capacitaciones que corresponden al empleado seleccionado (por su cargoId o 'TODOS')
  const misCapacitacionesAsignadas = useMemo(() => {
    if (!empleadoActual) return [];
    return capacitaciones.filter(cap => {
      return cap.cargosAsignados.includes('TODOS') || cap.cargosAsignados.includes(empleadoActual.cargoId);
    });
  }, [capacitaciones, empleadoActual]);

  // Función para confirmar asistencia de un empleado a una capacitación
  const handleConfirmarAsistencia = (capacitacionId: string, empId: string) => {
    setCapacitaciones(prev => prev.map(cap => {
      if (cap.id !== capacitacionId) return cap;

      const participantesActuales = [...cap.participantes];
      const idx = participantesActuales.findIndex(p => p.empleadoId === empId);

      if (idx >= 0) {
        participantesActuales[idx] = {
          ...participantesActuales[idx],
          asistenciaConfirmada: true,
          fechaAsistencia: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      } else {
        const emp = empleados.find(e => e.id === empId);
        participantesActuales.push({
          empleadoId: empId,
          cargoId: emp?.cargoId || '',
          asistenciaConfirmada: true,
          fechaAsistencia: new Date().toISOString().replace('T', ' ').slice(0, 16),
          evaluacionPresentada: false
        });
      }

      return {
        ...cap,
        participantes: participantesActuales
      };
    }));
  };

  // Iniciar examen
  const handleIniciarExamen = (cap: Capacitacion) => {
    setActiveExamCapacitacion(cap);
    setExamAnswers({});
    setExamResult(null);
  };

  // Enviar examen y calificar
  const handleSubmitExamen = () => {
    if (!activeExamCapacitacion || !activeExamCapacitacion.examenConocimiento) return;

    const examen = activeExamCapacitacion.examenConocimiento;
    let correctas = 0;
    const total = examen.preguntas.length;

    const retroalimentaciones = examen.preguntas.map(p => {
      const respUsuarioIndice = examAnswers[p.id];
      const esCorrecta = respUsuarioIndice === p.opcionCorrectaIndice;
      if (esCorrecta) correctas++;

      return {
        pregunta: p.enunciado,
        opcionSeleccionada: respUsuarioIndice !== undefined ? p.opciones[respUsuarioIndice] : 'No respondida',
        opcionCorrecta: p.opciones[p.opcionCorrectaIndice],
        esCorrecta,
        explicacion: p.explicacionRespuesta
      };
    });

    const puntaje = Math.round((correctas / total) * 100);
    const aprobado = puntaje >= examen.notaMinimaAprobatoria;

    setExamResult({
      presentado: true,
      puntaje,
      aprobado,
      totalPreguntas: total,
      correctas,
      retroalimentaciones
    });

    // Actualizar registro del participante en la capacitación
    setCapacitaciones(prev => prev.map(c => {
      if (c.id !== activeExamCapacitacion.id) return c;
      const participantes = [...c.participantes];
      const pIdx = participantes.findIndex(p => p.empleadoId === empleadoActual.id);
      if (pIdx >= 0) {
        participantes[pIdx] = {
          ...participantes[pIdx],
          evaluacionPresentada: true,
          fechaEvaluacion: new Date().toISOString().replace('T', ' ').slice(0, 16),
          calificacionObtenida: puntaje,
          aprobada: aprobado,
          intentosRealizados: (participantes[pIdx].intentosRealizados || 0) + 1,
          codigoCertificado: aprobado ? `CERT-${c.codigo}-${empleadoActual.documento}` : undefined
        };
      }
      return { ...c, participantes };
    }));
  };

  // Crear nueva capacitación con examen previo
  const handleGuardarNuevaCapacitacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCap.titulo || !nuevaCap.objetivo || nuevaCap.cargosAsignados.length === 0) {
      alert('Por favor complete el título, objetivo y asigne al menos un cargo.');
      return;
    }

    // Vincular automáticamente los empleados correspondientes a los cargos seleccionados
    const empleadosAsignados = empleados.filter(emp =>
      nuevaCap.cargosAsignados.includes('TODOS') || nuevaCap.cargosAsignados.includes(emp.cargoId)
    );

    const participantesIniciales: RegistroParticipanteCapacitacion[] = empleadosAsignados.map(emp => ({
      empleadoId: emp.id,
      cargoId: emp.cargoId,
      asistenciaConfirmada: false,
      evaluacionPresentada: false
    }));

    const nuevoRegistro: Capacitacion = {
      id: `cap_${Date.now()}`,
      codigo: nuevaCap.codigo,
      titulo: nuevaCap.titulo,
      objetivo: nuevaCap.objetivo,
      tipo: nuevaCap.tipo,
      facilitador: nuevaCap.facilitador,
      entidadFacilitadora: nuevaCap.entidadFacilitadora,
      duracionHoras: nuevaCap.duracionHoras,
      modalidad: nuevaCap.modalidad,
      fechaProgramada: nuevaCap.fechaProgramada,
      horaInicio: nuevaCap.horaInicio,
      lugarOEnlace: nuevaCap.lugarOEnlace,
      cargosAsignados: nuevaCap.cargosAsignados,
      estado: 'Programada',
      examenConocimiento: {
        id: `ex_${Date.now()}`,
        titulo: `Evaluación de Conocimiento: ${nuevaCap.titulo}`,
        instrucciones: `Evaluación de competencias requerida. Nota mínima de aprobación: ${nuevaCap.notaMinima}%.`,
        notaMinimaAprobatoria: nuevaCap.notaMinima,
        tiempoLimiteMinutos: nuevaCap.tiempoLimite,
        preguntas: nuevaCap.preguntas
      },
      participantes: participantesIniciales
    };

    setCapacitaciones(prev => [nuevoRegistro, ...prev]);
    setActiveTab('catalogo');
  };

  // Estadísticas globales de capacitación
  const stats = useMemo(() => {
    let totalAsignaciones = 0;
    let totalAsistencias = 0;
    let totalEvaluaciones = 0;
    let totalAprobados = 0;

    capacitaciones.forEach(c => {
      c.participantes.forEach(p => {
        totalAsignaciones++;
        if (p.asistenciaConfirmada) totalAsistencias++;
        if (p.evaluacionPresentada) {
          totalEvaluaciones++;
          if (p.aprobada) totalAprobados++;
        }
      });
    });

    const pctAsistencia = totalAsignaciones > 0 ? Math.round((totalAsistencias / totalAsignaciones) * 100) : 0;
    const pctAprobacion = totalEvaluaciones > 0 ? Math.round((totalAprobados / totalEvaluaciones) * 100) : 0;

    return {
      totalCapacitaciones: capacitaciones.length,
      totalAsignaciones,
      totalAsistencias,
      pctAsistencia,
      totalEvaluaciones,
      totalAprobados,
      pctAprobacion
    };
  }, [capacitaciones]);

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                Plan Anual de Capacitación
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F8FAFC] text-[#282829] border border-[#8FA7D6]">
                Estándar 2.4.1 Res. 0312 / CST
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#18235C]">
              Gestión de Capacitaciones y Competencias
            </h1>
            <p className="text-xs sm:text-sm text-[#282829] mt-1 max-w-2xl">
              Diseño y asignación de planes formativos por cargos, registro de asistencia y aplicación de evaluaciones de conocimiento con retroalimentación y certificación automática.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {isSuperAdmin && (
              <button
                id="btn-depurar-capacitaciones"
                onClick={() => setModalDepurarOpen(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-rose-300 transition-colors shadow-2xs self-start sm:self-auto"
                title="Depurar asistencias y calificaciones de prueba (Exclusivo Superadministrador)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Depurar Registros</span>
              </button>
            )}

            {/* Selector de empleado en simulación para probar el flujo */}
            <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-[#282829] flex items-center justify-between">
                <span>Colaborador en Sesión:</span>
                <span className="text-[#18235C] font-semibold">Simulación de Rol</span>
              </div>
              <select
                value={selectedEmpleadoId}
                onChange={e => setSelectedEmpleadoId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs text-[#18235C] font-medium"
              >
                {empleados.map(emp => {
                  const c = cargos.find(cg => cg.id === emp.cargoId);
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} — {c?.nombre || 'Cargo'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Métricas del Plan Formativo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-[#8FA7D6]">
          <div className="p-3.5 bg-[#FFFFFF] rounded-lg border border-[#8FA7D6]/70">
            <div className="text-[11px] font-semibold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Capacitaciones Activas
              <BookOpen className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-xl font-bold text-[#18235C]">{stats.totalCapacitaciones}</div>
            <div className="text-[10px] text-[#282829] mt-0.5">SST, técnicas y normativas</div>
          </div>

          <div className="p-3.5 bg-[#FFFFFF] rounded-lg border border-[#8FA7D6]/70">
            <div className="text-[11px] font-semibold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Cobertura de Asistencia
              <UserCheck className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-xl font-bold text-[#18235C]">
              {stats.pctAsistencia}%
            </div>
            <div className="text-[10px] text-[#282829] mt-0.5">{stats.totalAsistencias} de {stats.totalAsignaciones} asistencias registradas</div>
          </div>

          <div className="p-3.5 bg-[#FFFFFF] rounded-lg border border-[#8FA7D6]/70">
            <div className="text-[11px] font-semibold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Tasa de Aprobación
              <Award className="w-3.5 h-3.5 text-[#B5842A]" />
            </div>
            <div className="text-xl font-bold text-[#18235C]">
              {stats.pctAprobacion}%
            </div>
            <div className="text-[10px] text-[#282829] mt-0.5">{stats.totalAprobados} evaluaciones aprobadas</div>
          </div>

          <div className="p-3.5 bg-[#18235C]/5 rounded-lg border border-[#18235C]/20">
            <div className="text-[11px] font-semibold text-[#18235C] uppercase tracking-wider mb-1 flex items-center justify-between">
              Mis Asignadas
              <GraduationCap className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-xl font-bold text-[#18235C]">
              {misCapacitacionesAsignadas.length}
            </div>
            <div className="text-[10px] text-[#282829] mt-0.5">Para {empleadoActual?.nombre}</div>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex border-b border-[#8FA7D6] mt-6 gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('misCapacitaciones')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'misCapacitaciones'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Portal del Colaborador: Asistencia & Evaluaciones ({misCapacitacionesAsignadas.length})
          </button>

          <button
            onClick={() => setActiveTab('catalogo')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'catalogo'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Catálogo & Matriz de Seguimiento ({capacitaciones.length})
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('crear')}
              className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'crear'
                  ? 'border-[#18235C] text-[#18235C]'
                  : 'border-transparent text-[#282829] hover:text-[#18235C]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Plan & Examen Previo
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: PORTAL DEL COLABORADOR (CONFIRMACIÓN DE ASISTENCIA Y EVALUACIÓN) */}
      {activeTab === 'misCapacitaciones' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#18235C]">
                  Capacitaciones Programadas para: {empleadoActual?.nombre}
                </h3>
                <div className="text-xs text-[#282829] mt-0.5">
                  Cargo actual: <strong>{cargos.find(c => c.id === empleadoActual?.cargoId)?.nombre}</strong> • Flujo de acreditación obligatoria
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {misCapacitacionesAsignadas.map(cap => {
              const miRegistro = cap.participantes.find(p => p.empleadoId === empleadoActual?.id);
              const asistenciaConfirmada = miRegistro?.asistenciaConfirmada || false;
              const evaluacionPresentada = miRegistro?.evaluacionPresentada || false;
              const aprobada = miRegistro?.aprobada || false;
              const calificacion = miRegistro?.calificacionObtenida;

              return (
                <div
                  key={cap.id}
                  className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-sm space-y-4 hover:border-[#18235C]/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8FA7D6] pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C] text-white">
                          {cap.codigo}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20">
                          {cap.tipo}
                        </span>
                        <span className="text-xs text-[#282829]">
                          Duración: {cap.duracionHoras} horas
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#18235C] font-serif">
                        {cap.titulo}
                      </h4>
                    </div>

                    <div className="text-xs text-[#282829] sm:text-right">
                      <div className="font-semibold text-[#18235C] flex items-center sm:justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#18235C]" />
                        {cap.fechaProgramada} • {cap.horaInicio}
                      </div>
                      <div className="text-[11px] mt-0.5">{cap.modalidad} — {cap.lugarOEnlace}</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#282829] leading-relaxed">
                    {cap.objetivo}
                  </p>

                  <div className="text-xs text-[#282829] flex items-center gap-2">
                    <span>Facilitador: <strong>{cap.facilitador}</strong> ({cap.entidadFacilitadora})</span>
                  </div>

                  {/* Pasos secuenciales de Acreditación (Requisito clave del usuario) */}
                  <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] space-y-3">
                    <div className="text-xs font-bold text-[#18235C] uppercase tracking-wider">
                      Estado del Proceso Formativo:
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Paso 1: Asistencia */}
                      <div className={`p-3 rounded-lg border ${
                        asistenciaConfirmada
                          ? 'bg-[#18235C]/10 border-[#18235C]/30 text-[#18235C]'
                          : 'bg-white border-[#8FA7D6] text-[#18235C]'
                      }`}>
                        <div className="font-semibold flex items-center justify-between mb-1">
                          <span>1. Asistencia</span>
                          {asistenciaConfirmada ? (
                            <CheckCircle2 className="w-4 h-4 text-[#18235C]" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#282829]" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#282829]">
                          {asistenciaConfirmada ? (
                            <span className="text-[#18235C] font-medium">
                              Confirmada el {miRegistro?.fechaAsistencia}
                            </span>
                          ) : (
                            'Pendiente por confirmar asistencia'
                          )}
                        </div>

                        {!asistenciaConfirmada && (
                          <button
                            onClick={() => handleConfirmarAsistencia(cap.id, empleadoActual.id)}
                            className="mt-2.5 w-full py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Confirmar Mi Asistencia
                          </button>
                        )}
                      </div>

                      {/* Paso 2: Evaluación de Conocimiento */}
                      <div className={`p-3 rounded-lg border ${
                        !asistenciaConfirmada
                          ? 'bg-[#FFFFFF] border-[#8FA7D6]/60 text-[#282829] opacity-75'
                          : evaluacionPresentada
                          ? aprobada
                            ? 'bg-[#18235C]/10 border-[#18235C]/30 text-[#18235C]'
                            : 'bg-[#E57373]/10 border-[#E57373]/30 text-[#8A2525]'
                          : 'bg-white border-[#8FA7D6] text-[#18235C]'
                      }`}>
                        <div className="font-semibold flex items-center justify-between mb-1">
                          <span>2. Examen de Conocimiento</span>
                          {evaluacionPresentada ? (
                            aprobada ? (
                              <CheckCircle2 className="w-4 h-4 text-[#18235C]" />
                            ) : (
                              <XCircle className="w-4 h-4 text-[#E57373]" />
                            )
                          ) : (
                            <HelpCircle className="w-4 h-4 text-[#282829]" />
                          )}
                        </div>

                        <div className="text-[11px]">
                          {!asistenciaConfirmada ? (
                            <span className="text-[#282829] italic">
                              Requiere confirmar asistencia para habilitar el examen.
                            </span>
                          ) : evaluacionPresentada ? (
                            <div>
                              <span className="font-bold">Calificación: {calificacion}%</span> —{' '}
                              {aprobada ? 'Aprobado' : 'No aprobado (requiere reintento)'}
                            </div>
                          ) : (
                            <span className="text-[#18235C] font-medium">
                              ¡Examen habilitado! ({cap.examenConocimiento?.preguntas.length} preguntas)
                            </span>
                          )}
                        </div>

                        {asistenciaConfirmada && (!evaluacionPresentada || !aprobada) && (
                          <button
                            onClick={() => handleIniciarExamen(cap)}
                            className="mt-2.5 w-full py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            {evaluacionPresentada ? 'Reintentar Evaluación' : 'Presentar Evaluación'}
                          </button>
                        )}
                      </div>

                      {/* Paso 3: Certificado y Acreditación */}
                      <div className={`p-3 rounded-lg border ${
                        aprobada
                          ? 'bg-[#18235C]/10 border-[#18235C]/30 text-[#18235C]'
                          : 'bg-[#FFFFFF] border-[#8FA7D6]/60 text-[#282829] opacity-75'
                      }`}>
                        <div className="font-semibold flex items-center justify-between mb-1">
                          <span>3. Certificación SST</span>
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="text-[11px]">
                          {aprobada ? (
                            <div>
                              <span className="font-bold text-[#18235C]">Certificado Emitido</span>
                              <div className="text-[10px] text-[#282829] mt-0.5">{miRegistro?.codigoCertificado}</div>
                            </div>
                          ) : (
                            <span>Aprobación con {cap.examenConocimiento?.notaMinimaAprobatoria}% mínimo requerida.</span>
                          )}
                        </div>

                        {aprobada && miRegistro && (
                          <button
                            onClick={() => setCertificadoModal({ capacitacion: cap, empleado: empleadoActual, participante: miRegistro })}
                            className="mt-2.5 w-full py-1.5 bg-white hover:bg-[#FFFFFF] text-[#18235C] border border-[#18235C] rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Award className="w-3.5 h-3.5" />
                            Ver Constancia Oficial
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CATÁLOGO Y MATRIZ DE SEGUIMIENTO (VISTA ADMINISTRATIVA) */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="p-4 bg-[#FFFFFF] border-b border-[#8FA7D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm text-[#18235C]">
                  Catálogo General del Plan Anual de Capacitación
                </h3>
                <p className="text-xs text-[#282829]">
                  Cargos asignados, índice de asistencia y porcentaje de aprobación en evaluaciones de conocimiento.
                </p>
              </div>

              {userRole === 'admin' && (
                <button
                  onClick={() => setActiveTab('crear')}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Capacitación
                </button>
              )}
            </div>

            <div className="divide-y divide-[#8FA7D6]">
              {capacitaciones.map(cap => {
                const asistencias = cap.participantes.filter(p => p.asistenciaConfirmada).length;
                const evaluados = cap.participantes.filter(p => p.evaluacionPresentada).length;
                const aprobados = cap.participantes.filter(p => p.aprobada).length;

                return (
                  <div key={cap.id} className="p-5 hover:bg-[#FFFFFF]/60 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#18235C]">{cap.codigo}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#18235C]/10 text-[#18235C]">
                            {cap.tipo}
                          </span>
                          <span className="text-xs text-[#282829]">
                            {cap.duracionHoras} horas • {cap.modalidad}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#18235C] mt-1">{cap.titulo}</h4>
                      </div>

                      <div className="text-xs text-[#282829] sm:text-right">
                        <div>Fecha: <strong>{cap.fechaProgramada}</strong> ({cap.horaInicio})</div>
                        <div className="text-[11px]">{cap.facilitador}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FFFFFF] p-3 rounded-lg border border-[#8FA7D6]">
                      <div>
                        <span className="text-[10px] text-[#282829] block uppercase font-semibold">Cargos Destinatarios:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cap.cargosAsignados.includes('TODOS') ? (
                            <span className="px-2 py-0.5 bg-white border border-[#8FA7D6] rounded text-[10px] font-semibold text-[#18235C]">
                              Todos los cargos de la empresa
                            </span>
                          ) : (
                            cap.cargosAsignados.map(cid => {
                              const c = cargos.find(cg => cg.id === cid);
                              return (
                                <span key={cid} className="px-2 py-0.5 bg-white border border-[#8FA7D6] rounded text-[10px] font-semibold text-[#18235C]">
                                  {c?.nombre || cid}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#282829] block uppercase font-semibold">Asistencia & Cobertura:</span>
                        <div className="text-xs font-bold text-[#18235C] mt-1">
                          {asistencias} / {cap.participantes.length} asistentes ({cap.participantes.length > 0 ? Math.round((asistencias / cap.participantes.length) * 100) : 0}%)
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#282829] block uppercase font-semibold">Acreditación y Examen:</span>
                        <div className="text-xs font-bold text-[#18235C] mt-1">
                          {aprobados} de {evaluados} aprobados ({evaluados > 0 ? Math.round((aprobados / evaluados) * 100) : 0}%)
                        </div>
                        <div className="text-[10px] text-[#282829]">Mínimo para aprobar: {cap.examenConocimiento?.notaMinimaAprobatoria}%</div>
                      </div>
                    </div>

                    {/* Lista detallada de colaboradores asignados */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-[#18235C] mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#282829]" />
                        Participantes Vinculados:
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {cap.participantes.map(p => {
                          const emp = empleados.find(e => e.id === p.empleadoId);
                          return (
                            <div
                              key={p.empleadoId}
                              className={`p-2 rounded border flex items-center gap-2 text-[11px] ${
                                p.aprobada
                                  ? 'bg-[#18235C]/5 border-[#18235C]/30 text-[#18235C]'
                                  : p.asistenciaConfirmada
                                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                                  : 'bg-white border-[#8FA7D6] text-[#282829]'
                              }`}
                            >
                              <User className="w-3 h-3" />
                              <span className="font-semibold">{emp?.nombre}</span>
                              <span className="text-[10px]">
                                {p.aprobada ? `✓ Aprobó (${p.calificacionObtenida}%)` : p.asistenciaConfirmada ? 'Asistió (evaluación pendiente)' : 'Sin asistir'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CREAR CAPACITACIÓN Y EXAMEN PREVIO (ADMINISTRADOR) */}
      {activeTab === 'crear' && userRole === 'admin' && (
        <form onSubmit={handleGuardarNuevaCapacitacion} className="bg-white rounded-xl border border-[#8FA7D6] p-6 shadow-sm space-y-6">
          <div className="border-b border-[#8FA7D6] pb-4">
            <h3 className="font-bold text-base text-[#18235C] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#18235C]" />
              Formular Nueva Capacitación y Diseñar Examen de Conocimiento Previo
            </h3>
            <p className="text-xs text-[#282829] mt-0.5">
              Defina los objetivos de la capacitación, asigne los cargos obligados y configure previamente las preguntas de la evaluación para calificar automáticamente a los asistentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Código Oficial:</label>
              <input
                type="text"
                value={nuevaCap.codigo}
                onChange={e => setNuevaCap(p => ({ ...p, codigo: e.target.value }))}
                className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Tipo de Capacitación:</label>
              <select
                value={nuevaCap.tipo}
                onChange={e => setNuevaCap(p => ({ ...p, tipo: e.target.value as any }))}
                className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
              >
                <option value="SST">Seguridad y Salud en el Trabajo (SST)</option>
                <option value="Técnica">Técnica y Operativa ISP</option>
                <option value="Normativa y Cumplimiento">Normativa y Cumplimiento Legal</option>
                <option value="Habilidades Blandas">Habilidades Blandas y Liderazgo</option>
                <option value="Gestión Operativa">Gestión Operativa y Calidad</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-[#18235C] mb-1">Título de la Capacitación:</label>
              <input
                type="text"
                value={nuevaCap.titulo}
                onChange={e => setNuevaCap(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ejemplo: Protocolo de Fibra Óptica y Seguridad Eléctrica en Postería"
                className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-[#18235C] mb-1">Objetivo de Aprendizaje:</label>
              <textarea
                rows={2}
                value={nuevaCap.objetivo}
                onChange={e => setNuevaCap(p => ({ ...p, objetivo: e.target.value }))}
                placeholder="Describa las competencias y destrezas que adquirirá el colaborador..."
                className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Facilitador / Instructor:</label>
              <input
                type="text"
                value={nuevaCap.facilitador}
                onChange={e => setNuevaCap(p => ({ ...p, facilitador: e.target.value }))}
                placeholder="Nombre del facilitador o especialista..."
                className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Entidad Facilitadora:</label>
              <input
                type="text"
                value={nuevaCap.entidadFacilitadora}
                onChange={e => setNuevaCap(p => ({ ...p, entidadFacilitadora: e.target.value }))}
                className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Fecha Programada:</label>
              <input
                type="date"
                value={nuevaCap.fechaProgramada}
                onChange={e => setNuevaCap(p => ({ ...p, fechaProgramada: e.target.value }))}
                className="w-full px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Hora y Duración (Horas):</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={nuevaCap.horaInicio}
                  onChange={e => setNuevaCap(p => ({ ...p, horaInicio: e.target.value }))}
                  placeholder="08:00 AM"
                  className="px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
                />
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={nuevaCap.duracionHoras}
                  onChange={e => setNuevaCap(p => ({ ...p, duracionHoras: parseInt(e.target.value) || 1 }))}
                  className="px-3 py-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[#18235C]"
                />
              </div>
            </div>

            {/* Asignación según Cargos Creados */}
            <div className="md:col-span-2 p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6]">
              <label className="block font-bold text-[#18235C] mb-1">
                Asignación de Cargos Obligados (Según Ficha de Cargos):
              </label>
              <p className="text-[11px] text-[#282829] mb-3">
                Seleccione los cargos que deben realizar esta capacitación. Los colaboradores vinculados a estos cargos recibirán la asignación automáticamente.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (nuevaCap.cargosAsignados.includes('TODOS')) {
                      setNuevaCap(p => ({ ...p, cargosAsignados: [] }));
                    } else {
                      setNuevaCap(p => ({ ...p, cargosAsignados: ['TODOS'] }));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    nuevaCap.cargosAsignados.includes('TODOS')
                      ? 'bg-[#18235C] text-white border-[#18235C]'
                      : 'bg-white text-[#282829] border-[#8FA7D6]'
                  }`}
                >
                  ⚡ TODOS LOS CARGOS
                </button>

                {cargos.map(c => {
                  const seleccionado = nuevaCap.cargosAsignados.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={nuevaCap.cargosAsignados.includes('TODOS')}
                      onClick={() => {
                        setNuevaCap(p => {
                          const actual = p.cargosAsignados.filter(x => x !== 'TODOS');
                          if (actual.includes(c.id)) {
                            return { ...p, cargosAsignados: actual.filter(x => x !== c.id) };
                          } else {
                            return { ...p, cargosAsignados: [...actual, c.id] };
                          }
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        seleccionado
                          ? 'bg-[#18235C] text-white border-[#18235C]'
                          : 'bg-white text-[#282829] border-[#8FA7D6] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuración de Examen Previo */}
            <div className="md:col-span-2 p-4 bg-[#18235C]/5 rounded-xl border border-[#18235C]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5" />
                    Configuración del Examen de Conocimiento Previo
                  </h4>
                  <p className="text-[11px] text-[#282829]">
                    Los colaboradores responderán este test una vez confirmen su asistencia.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#18235C] font-semibold">Nota Mínima:</span>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={nuevaCap.notaMinima}
                    onChange={e => setNuevaCap(p => ({ ...p, notaMinima: parseInt(e.target.value) || 80 }))}
                    className="w-16 px-2 py-1 bg-white border border-[#8FA7D6] rounded text-xs font-bold text-center"
                  />
                  <span className="text-xs text-[#282829]">%</span>
                </div>
              </div>

              {/* Preguntas configuradas */}
              <div className="space-y-3">
                {nuevaCap.preguntas.map((preg, pIdx) => (
                  <div key={preg.id} className="p-3 bg-white rounded-lg border border-[#8FA7D6] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#18235C]">Pregunta {pIdx + 1}:</span>
                      <span className="text-[10px] text-[#18235C] font-semibold">Opción correcta: Opción {preg.opcionCorrectaIndice + 1}</span>
                    </div>
                    <div className="text-xs text-[#18235C] font-medium">{preg.enunciado}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#282829]">
                      {preg.opciones.map((opc, oIdx) => (
                        <div key={oIdx} className={`p-1.5 rounded border ${oIdx === preg.opcionCorrectaIndice ? 'bg-[#18235C]/10 border-[#18235C]/30 font-semibold text-[#18235C]' : 'border-[#8FA7D6]'}`}>
                          {oIdx + 1}. {opc}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#8FA7D6]">
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className="px-4 py-2 text-xs font-medium text-[#282829] hover:text-[#18235C]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Publicar Capacitación & Habilitar Plan
            </button>
          </div>
        </form>
      )}

      {/* MODAL DEL EXAMEN INTERACTIVO DE CONOCIMIENTO */}
      {activeExamCapacitacion && activeExamCapacitacion.examenConocimiento && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#8FA7D6] max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header del Examen */}
            <div className="flex justify-between items-start border-b border-[#8FA7D6] pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#18235C]/10 text-[#18235C] uppercase tracking-wider">
                  Evaluación de Conocimiento
                </span>
                <h3 className="font-bold text-base text-[#18235C] mt-1 font-serif">
                  {activeExamCapacitacion.examenConocimiento.titulo}
                </h3>
                <div className="text-xs text-[#282829]">
                  Colaborador: <strong>{empleadoActual.nombre}</strong> • Nota mínima: {activeExamCapacitacion.examenConocimiento.notaMinimaAprobatoria}%
                </div>
              </div>

              {!examResult && (
                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#8FA7D6] text-[#282829] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {activeExamCapacitacion.examenConocimiento.tiempoLimiteMinutos} min
                </div>
              )}
            </div>

            {/* Si no ha enviado el examen, muestra las preguntas interactivas */}
            {!examResult ? (
              <div className="space-y-5">
                <p className="text-xs text-[#282829] bg-[#FFFFFF] p-3 rounded-lg border border-[#8FA7D6]">
                  {activeExamCapacitacion.examenConocimiento.instrucciones}
                </p>

                <div className="space-y-4">
                  {activeExamCapacitacion.examenConocimiento.preguntas.map((preg, idx) => (
                    <div key={preg.id} className="p-4 bg-white rounded-xl border border-[#8FA7D6] space-y-3">
                      <div className="font-bold text-xs text-[#18235C] flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#18235C] text-white text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{preg.enunciado}</span>
                      </div>

                      <div className="space-y-2 pl-7">
                        {preg.opciones.map((opc, opcIdx) => {
                          const isChecked = examAnswers[preg.id] === opcIdx;
                          return (
                            <label
                              key={opcIdx}
                              onClick={() => setExamAnswers(prev => ({ ...prev, [preg.id]: opcIdx }))}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-[#18235C]/10 border-[#18235C] text-[#18235C] font-medium'
                                  : 'bg-[#FFFFFF]/60 border-[#8FA7D6] text-[#282829] hover:bg-[#FFFFFF]'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`preg_${preg.id}`}
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-0.5 text-[#18235C]"
                              />
                              <span>{opc}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#8FA7D6]">
                  <button
                    onClick={() => setActiveExamCapacitacion(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#282829] hover:text-[#18235C]"
                  >
                    Salir sin Guardar
                  </button>

                  <button
                    onClick={handleSubmitExamen}
                    disabled={Object.keys(examAnswers).length < activeExamCapacitacion.examenConocimiento.preguntas.length}
                    className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      Object.keys(examAnswers).length === activeExamCapacitacion.examenConocimiento.preguntas.length
                        ? 'bg-[#18235C] hover:bg-[#101740] text-white shadow-sm'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Examen y Calificar
                  </button>
                </div>
              </div>
            ) : (
              /* Resultado y retroalimentación pedagógica */
              <div className="space-y-5">
                <div className={`p-5 rounded-xl border text-center ${
                  examResult.aprobado
                    ? 'bg-[#18235C]/10 border-[#18235C]/30 text-[#18235C]'
                    : 'bg-[#E57373]/10 border-[#E57373]/30 text-[#8A2525]'
                }`}>
                  {examResult.aprobado ? (
                    <Award className="w-12 h-12 mx-auto mb-2 text-[#18235C]" />
                  ) : (
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-[#E57373]" />
                  )}
                  <h4 className="text-xl font-bold font-serif">
                    {examResult.aprobado ? '¡Felicitaciones! Has Aprobado la Evaluación' : 'Evaluación No Aprobada'}
                  </h4>
                  <div className="text-3xl font-bold font-serif my-1">
                    {examResult.puntaje}%
                  </div>
                  <div className="text-xs">
                    {examResult.correctas} de {examResult.totalPreguntas} respuestas correctas (Nota mínima: {activeExamCapacitacion.examenConocimiento.notaMinimaAprobatoria}%)
                  </div>
                </div>

                {/* Retroalimentación pregunta a pregunta */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#18235C] uppercase tracking-wider">
                    Retroalimentación Técnica de Respuestas:
                  </div>

                  {examResult.retroalimentaciones.map((item, i) => (
                    <div key={i} className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      item.esCorrecta ? 'bg-[#18235C]/5 border-[#18235C]/20' : 'bg-[#E57373]/5 border-[#E57373]/20'
                    }`}>
                      <div className="font-semibold flex items-center justify-between">
                        <span className="text-[#18235C]">{i + 1}. {item.pregunta}</span>
                        {item.esCorrecta ? (
                          <span className="text-[#18235C] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correcta
                          </span>
                        ) : (
                          <span className="text-[#E57373] font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Incorrecta
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#282829]">
                        Tu respuesta: <strong>{item.opcionSeleccionada}</strong>
                      </div>
                      {!item.esCorrecta && (
                        <div className="text-[11px] text-[#18235C]">
                          Respuesta correcta: <strong>{item.opcionCorrecta}</strong>
                        </div>
                      )}
                      <div className="text-[10px] text-[#282829] bg-white p-2 rounded border border-[#8FA7D6] mt-1">
                        <strong>Explicación técnica:</strong> {item.explicacion}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#8FA7D6]">
                  <button
                    onClick={() => {
                      setActiveExamCapacitacion(null);
                      setExamResult(null);
                    }}
                    className="px-4 py-2 bg-[#18235C] text-white rounded-lg text-xs font-semibold"
                  >
                    Finalizar y Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CERTIFICADO DE CONSTANCIA OFICIAL */}
      {certificadoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border-2 border-[#8FA7D6] max-w-2xl w-full p-8 shadow-2xl relative print:border-none print:shadow-none">
            <button
              onClick={() => setCertificadoModal(null)}
              className="absolute top-4 right-4 text-[#282829] hover:text-[#18235C] font-bold p-1 print:hidden"
            >
              ✕
            </button>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck className="w-8 h-8 text-[#18235C]" />
              </div>
              <div className="text-xs uppercase tracking-widest text-[#282829] font-semibold">
                B GROUP INGENIERIA S.A.S. • SISTEMA DE GESTIÓN SST
              </div>
              <h2 className="text-xl font-bold font-serif text-[#18235C] tracking-tight uppercase">
                Constancia Oficial de Capacitación y Competencias
              </h2>

              <p className="text-xs text-[#282829]">
                En cumplimiento del Decreto 1072 de 2015 y la Resolución 0312 de 2019 (Estándar 2.4.1), se hace constar que:
              </p>

              <div className="py-2">
                <div className="text-lg font-bold font-serif text-[#18235C] underline decoration-[#18235C] decoration-2 underline-offset-4">
                  {certificadoModal.empleado.nombre}
                </div>
                <div className="text-xs text-[#282829] mt-1">
                  Cédula de Ciudadanía N° {certificadoModal.empleado.documento} • Cargo: {cargos.find(c => c.id === certificadoModal.empleado.cargoId)?.nombre}
                </div>
              </div>

              <p className="text-xs text-[#282829] max-w-lg mx-auto leading-relaxed">
                Asistió y aprobó satisfactoriamente la capacitación técnica y evaluación de conocimientos:
              </p>

              <div className="p-3 bg-[#FFFFFF] rounded-lg border border-[#8FA7D6] max-w-lg mx-auto">
                <div className="text-sm font-bold text-[#18235C]">
                  {certificadoModal.capacitacion.titulo}
                </div>
                <div className="text-xs text-[#18235C] font-semibold mt-1">
                  Código: {certificadoModal.capacitacion.codigo} • Duración: {certificadoModal.capacitacion.duracionHoras} Horas
                </div>
                <div className="text-xs text-[#282829] mt-0.5">
                  Calificación obtenida: <strong>{certificadoModal.participante.calificacionObtenida}%</strong> • Facilitador: {certificadoModal.capacitacion.facilitador}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#8FA7D6] text-center text-xs">
                <div>
                  <div className="h-10 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-sm text-[#282829]">{certificadoModal.capacitacion.facilitador}</span>
                  </div>
                  <div className="border-t border-[#18235C] pt-1 font-semibold text-[#18235C]">
                    Instructor / Facilitador SST
                  </div>
                  <div className="text-[10px] text-[#282829]">{certificadoModal.capacitacion.entidadFacilitadora}</div>
                </div>

                <div>
                  <div className="h-10 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-sm text-[#282829]">Marcela Rueda C.</span>
                  </div>
                  <div className="border-t border-[#18235C] pt-1 font-semibold text-[#18235C]">
                    Dirección de Gestión Humana
                  </div>
                  <div className="text-[10px] text-[#282829]">B GROUP INGENIERIA S.A.S. — NIT 900.995.99-2</div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Constancia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* Modal de confirmación para depuración de capacitaciones (Exclusivo Superadministrador) */}
      {isSuperAdmin && modalDepurarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  ¿Confirmas depurar registros de capacitaciones?
                </h3>
                <p className="text-xs text-rose-700">
                  Restablecer participantes para producción
                </p>
              </div>
            </div>

            <p className="text-xs text-[#282829]/80 leading-relaxed">
              Esta acción eliminará las asistencias, calificaciones y certificados de prueba asociados a todos los cursos, dejando el plan anual listo para los colaboradores reales.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setModalDepurarOpen(false)}
                disabled={depurando}
                className="px-3.5 py-2 text-xs font-bold text-[#282829] hover:bg-slate-100 rounded-lg border border-[#8FA7D6]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarDepuracionCapacitaciones}
                disabled={depurando}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors"
              >
                {depurando ? "Depurando..." : "Sí, Depurar Ahora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}