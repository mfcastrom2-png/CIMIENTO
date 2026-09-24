import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Capacitacion,
  Cargo,
  Empleado,
  ExamenConocimientoCapacitacion,
  PreguntaExamen,
  RegistroParticipanteCapacitacion,
  Role,
  RolSistema,
  UsuarioSistema
} from '../types';
import { CAPACITACIONES_INICIALES } from '../data/capacitacionesData';
import {
  limpiarCapacitacionesFB,
  guardarCapacitacionFB,
  obtenerCapacitacionesFB,
  eliminarCapacitacionFB
} from '../lib/firebase';
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
  XCircle,
  FileCheck,
  FileText,
  Filter,
  Check,
  Building,
  Timer,
  Edit,
  Download,
  FileSpreadsheet,
  CheckSquare,
  BarChart3,
  PieChart,
  Sliders,
  Settings,
  Tag,
  TrendingUp,
  Target,
  Layers,
  Eye
} from 'lucide-react';

interface CapacitacionesViewProps {
  cargos: Cargo[];
  empleados: Empleado[];
  userRole: Role;
  rolSistema?: RolSistema;
  currentEmpleadoId?: string;
  currentUser?: UsuarioSistema;
}

export function CapacitacionesView({
  cargos,
  empleados,
  userRole,
  rolSistema,
  currentEmpleadoId,
  currentUser
}: CapacitacionesViewProps) {
  const isSuperAdmin = rolSistema === 'superadmin';
  const esAdmin = userRole !== 'empleado' && (rolSistema === 'superadmin' || rolSistema === 'admin_gh' || userRole === 'admin');

  // Cargar capacitaciones con persistencia local y en Firestore
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>(() => {
    try {
      const saved = localStorage.getItem('bgroup_capacitaciones_catalogo');
      if (saved) {
        const parsed: Capacitacion[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => {
            if (c.codigo && c.codigo.startsWith('CAP-2026-')) {
              return { ...c, codigo: c.codigo.replace('CAP-2026-', '') };
            }
            return c;
          });
        }
      }
    } catch {
      // fallback
    }

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

  // Cargar de Firestore al montar
  useEffect(() => {
    let montado = true;
    obtenerCapacitacionesFB().then(datos => {
      if (montado && datos && datos.length > 0) {
        const normalizados = datos.map(c => {
          if (c.codigo && c.codigo.startsWith('CAP-2026-')) {
            return { ...c, codigo: c.codigo.replace('CAP-2026-', '') };
          }
          return c;
        });
        setCapacitaciones(normalizados);
        localStorage.setItem('bgroup_capacitaciones_catalogo', JSON.stringify(normalizados));
      }
    }).catch(err => {
      console.warn('Usando catálogo local de capacitaciones:', err);
    });
    return () => {
      montado = false;
    };
  }, []);

  // Guardar y persistir cambios
  const persistirCapacitaciones = (nuevas: Capacitacion[]) => {
    setCapacitaciones(nuevas);
    try {
      localStorage.setItem('bgroup_capacitaciones_catalogo', JSON.stringify(nuevas));
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
    }
  };

  // Toast de confirmación
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modal para restablecer registros (Superadmin)
  const [modalDepurarOpen, setModalDepurarOpen] = useState(false);
  const [depurando, setDepurando] = useState(false);

  const handleEjecutarDepuracionCapacitaciones = async () => {
    setDepurando(true);
    try {
      await limpiarCapacitacionesFB();
      const reseteadas = capacitaciones.map(c => ({ ...c, participantes: [] }));
      persistirCapacitaciones(reseteadas);
      setModalDepurarOpen(false);
      showToast('Historial de capacitaciones restablecido con éxito.');
    } catch (e: any) {
      alert('Error al depurar capacitaciones: ' + e.message);
    } finally {
      setDepurando(false);
    }
  };

  // Sincronizar participantes si cambian los empleados
  useEffect(() => {
    if (empleados.length > 0) {
      setCapacitaciones(prev => {
        let huboCambios = false;
        const actualizadas = prev.map(cap => {
          const empAsignados = empleados.filter(emp =>
            cap.cargosAsignados.includes('TODOS') || cap.cargosAsignados.includes(emp.cargoId)
          );
          const existentesIds = new Set(cap.participantes.map(p => p.empleadoId));
          const nuevosParticipantes = [...cap.participantes];

          empAsignados.forEach(emp => {
            if (!existentesIds.has(emp.id)) {
              huboCambios = true;
              nuevosParticipantes.push({
                empleadoId: emp.id,
                cargoId: emp.cargoId,
                asistenciaConfirmada: false,
                evaluacionPresentada: false
              });
            }
          });

          if (huboCambios) {
            return { ...cap, participantes: nuevosParticipantes };
          }
          return cap;
        });

        if (huboCambios) {
          try {
            localStorage.setItem('bgroup_capacitaciones_catalogo', JSON.stringify(actualizadas));
          } catch {}
          return actualizadas;
        }
        return prev;
      });
    }
  }, [empleados]);

  // Generador de código secuencial que inicia estrictamente en 001
  const generarSiguienteCodigo = (lista: Capacitacion[]) => {
    if (!lista || lista.length === 0) return '001';
    let maxNum = 0;
    lista.forEach(c => {
      if (!c.codigo) return;
      const match = c.codigo.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const siguiente = maxNum + 1;
    return String(siguiente).padStart(3, '0');
  };

  // Catálogo dinámico y configurable de Tipos / Ejes Temáticos de Capacitación
  const TIPOS_CAPACITACION_INICIALES: string[] = [
    'SST (Seguridad y Salud en el Trabajo)',
    'Técnica y Operativa',
    'Normativa y Cumplimiento Legal',
    'Habilidades Blandas y Liderazgo',
    'Gestión Operativa y Calidad',
    'Medio Ambiente y Sostenibilidad'
  ];

  const [tiposCapacitacion, setTiposCapacitacion] = useState<string[]>(() => {
    try {
      const guardados = localStorage.getItem('bgroup_catalogo_tipos_capacitacion');
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return TIPOS_CAPACITACION_INICIALES;
  });

  const persistirTipos = (nuevos: string[]) => {
    setTiposCapacitacion(nuevos);
    try {
      localStorage.setItem('bgroup_catalogo_tipos_capacitacion', JSON.stringify(nuevos));
    } catch {}
  };

  const [modalConfigTiposOpen, setModalConfigTiposOpen] = useState(false);
  const [nuevoTipoInput, setNuevoTipoInput] = useState('');
  const [tipoEnEdicion, setTipoEnEdicion] = useState<{ index: number; valor: string } | null>(null);

  const handleAgregarTipo = () => {
    if (!nuevoTipoInput.trim()) return;
    const nombreLimpio = nuevoTipoInput.trim();
    if (tiposCapacitacion.includes(nombreLimpio)) {
      alert('Este tipo de capacitación ya existe.');
      return;
    }
    const actualizados = [...tiposCapacitacion, nombreLimpio];
    persistirTipos(actualizados);
    setNuevoTipoInput('');
    showToast(`Tipo "${nombreLimpio}" añadido correctamente.`);
  };

  const handleGuardarEdicionTipo = () => {
    if (!tipoEnEdicion || !tipoEnEdicion.valor.trim()) return;
    const nuevoNombre = tipoEnEdicion.valor.trim();
    const anteriorNombre = tiposCapacitacion[tipoEnEdicion.index];
    const actualizados = [...tiposCapacitacion];
    actualizados[tipoEnEdicion.index] = nuevoNombre;
    persistirTipos(actualizados);

    // Actualizar capacitaciones que tenían el nombre anterior
    const capsActualizadas = capacitaciones.map(c => {
      if (c.tipo === anteriorNombre) {
        return { ...c, tipo: nuevoNombre };
      }
      return c;
    });
    persistirCapacitaciones(capsActualizadas);
    setTipoEnEdicion(null);
    showToast(`Tipo actualizado a "${nuevoNombre}".`);
  };

  const handleEliminarTipo = (tipoABorrar: string) => {
    if (tiposCapacitacion.length <= 1) {
      alert('Debe permanecer al menos un tipo de capacitación configurado.');
      return;
    }
    const actualizados = tiposCapacitacion.filter(t => t !== tipoABorrar);
    persistirTipos(actualizados);
    showToast(`Tipo "${tipoABorrar}" eliminado.`);
  };

  const handleRestablecerTiposDefault = () => {
    persistirTipos(TIPOS_CAPACITACION_INICIALES);
    showToast('Tipos de capacitación restablecidos a valores estándar.');
  };

  // Pestañas activas: 'misCapacitaciones' | 'catalogo' | 'indicadores' | 'crear'
  const [activeTab, setActiveTab] = useState<'catalogo' | 'misCapacitaciones' | 'indicadores' | 'crear'>(
    userRole === 'empleado' ? 'misCapacitaciones' : 'catalogo'
  );

  // Asegurar que si el rol cambia, la pestaña y el empleado se sincronicen
  useEffect(() => {
    if (userRole === 'empleado') {
      setActiveTab('misCapacitaciones');
    }
  }, [userRole]);

  // ID del empleado actualmente en sesión o seleccionado para seguimiento
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>(
    currentEmpleadoId || empleados[0]?.id || 'e1'
  );

  useEffect(() => {
    if (currentEmpleadoId) {
      setSelectedEmpleadoId(currentEmpleadoId);
    }
  }, [currentEmpleadoId]);

  // Empleado actual verificado con soporte estricto para cuenta autenticada
  const empleadoActual = useMemo(() => {
    if (userRole === 'empleado' && currentUser) {
      const matchUsuario = empleados.find(e =>
        (currentUser.empleadoId && e.id === currentUser.empleadoId) ||
        (currentUser.email && e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
        (currentUser.documento && e.documento === currentUser.documento)
      );
      if (matchUsuario) return matchUsuario;
    }

    const defaultEmpleado: Empleado = {
      id: selectedEmpleadoId || currentEmpleadoId || 'e1',
      nombre: 'Colaborador Acreditado',
      documento: '—',
      email: '',
      telefono: '',
      cargoId: cargos[0]?.id || 'c1',
      formacion: '',
      experiencia: '',
      salarioBase: 0,
      contrato: { tipo: 'Término Indefinido', inicio: '', fin: '', salario: '0' },
      familia: [],
      activo: true
    };

    return (
      empleados.find(e => e.id === selectedEmpleadoId) ||
      empleados.find(e => e.id === currentEmpleadoId) ||
      empleados[0] ||
      defaultEmpleado
    );
  }, [empleados, selectedEmpleadoId, currentEmpleadoId, userRole, currentUser, cargos]);

  // Filtro de estado para el portal de colaborador
  const [filtroEstadoEmpleado, setFiltroEstadoEmpleado] = useState<'TODOS' | 'PENDIENTES_ASISTENCIA' | 'PENDIENTES_EXAMEN' | 'APROBADAS'>('TODOS');

  // Filtrar capacitaciones que corresponden al colaborador actual
  const misCapacitacionesAsignadas = useMemo(() => {
    if (!empleadoActual) return [];
    return capacitaciones.filter(cap => {
      const asignado = cap.cargosAsignados.includes('TODOS') || cap.cargosAsignados.includes(empleadoActual.cargoId);
      if (!asignado) return false;

      const reg = cap.participantes.find(p => p.empleadoId === empleadoActual.id);
      if (filtroEstadoEmpleado === 'PENDIENTES_ASISTENCIA') {
        return !reg?.asistenciaConfirmada;
      }
      if (filtroEstadoEmpleado === 'PENDIENTES_EXAMEN') {
        return reg?.asistenciaConfirmada && (!reg?.evaluacionPresentada || !reg?.aprobada);
      }
      if (filtroEstadoEmpleado === 'APROBADAS') {
        return reg?.aprobada;
      }
      return true;
    });
  }, [capacitaciones, empleadoActual, filtroEstadoEmpleado]);

  // Filtros de búsqueda en Catálogo
  const [searchCatalogo, setSearchCatalogo] = useState('');
  const [filterTipoCatalogo, setFilterTipoCatalogo] = useState<string>('TODOS');

  const capacitacionesFiltradas = useMemo(() => {
    return capacitaciones.filter(c => {
      const matchTipo = filterTipoCatalogo === 'TODOS' || c.tipo === filterTipoCatalogo;
      const matchSearch =
        c.titulo.toLowerCase().includes(searchCatalogo.toLowerCase()) ||
        c.codigo.toLowerCase().includes(searchCatalogo.toLowerCase()) ||
        c.facilitador.toLowerCase().includes(searchCatalogo.toLowerCase()) ||
        c.objetivo.toLowerCase().includes(searchCatalogo.toLowerCase());
      return matchTipo && matchSearch;
    });
  }, [capacitaciones, searchCatalogo, filterTipoCatalogo]);

  // Modal para ver certificado / constancia individual
  const [certificadoModal, setCertificadoModal] = useState<{
    capacitacion: Capacitacion;
    empleado: Empleado;
    participante: RegistroParticipanteCapacitacion;
  } | null>(null);

  // Modal para ver Acta de Asistencia y Acreditación del curso (SG-SST)
  const [actaAsistenciaCap, setActaAsistenciaCap] = useState<Capacitacion | null>(null);

  // Estado del Examen Interactivo
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

  // Temporizador interactivo del examen
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeExamCapacitacion && !examResult) {
      const tiempoMin = activeExamCapacitacion.examenConocimiento?.tiempoLimiteMinutos || 20;
      setSegundosRestantes(tiempoMin * 60);

      timerRef.current = setInterval(() => {
        setSegundosRestantes(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeExamCapacitacion, examResult]);

  // Auto-envío cuando el tiempo se agota
  useEffect(() => {
    if (activeExamCapacitacion && !examResult && segundosRestantes === 0 && Object.keys(examAnswers).length > 0) {
      handleSubmitExamen();
      showToast('Tiempo límite alcanzado. Evaluación calificada automáticamente.');
    }
  }, [segundosRestantes]);

  // Confirmar Asistencia
  const handleConfirmarAsistencia = (capacitacionId: string, empId: string) => {
    const fechaHora = new Date().toLocaleString('es-CO');
    let capActualizada: Capacitacion | null = null;

    const actualizadas = capacitaciones.map(cap => {
      if (cap.id !== capacitacionId) return cap;

      const participantesActuales = [...cap.participantes];
      const idx = participantesActuales.findIndex(p => p.empleadoId === empId);

      if (idx >= 0) {
        participantesActuales[idx] = {
          ...participantesActuales[idx],
          asistenciaConfirmada: true,
          fechaAsistencia: fechaHora
        };
      } else {
        const emp = empleados.find(e => e.id === empId);
        participantesActuales.push({
          empleadoId: empId,
          cargoId: emp?.cargoId || '',
          asistenciaConfirmada: true,
          fechaAsistencia: fechaHora,
          evaluacionPresentada: false
        });
      }

      capActualizada = { ...cap, participantes: participantesActuales };
      return capActualizada;
    });

    persistirCapacitaciones(actualizadas);
    if (capActualizada) {
      guardarCapacitacionFB(capActualizada).catch(console.warn);
    }
    showToast('¡Asistencia confirmada exitosamente! Examen habilitado.');
  };

  // Iniciar Examen
  const handleIniciarExamen = (cap: Capacitacion) => {
    setActiveExamCapacitacion(cap);
    setExamAnswers({});
    setExamResult(null);
  };

  // Enviar y calificar examen
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
        opcionSeleccionada: respUsuarioIndice !== undefined ? p.opciones[respUsuarioIndice] : 'Sin responder',
        opcionCorrecta: p.opciones[p.opcionCorrectaIndice],
        esCorrecta,
        explicacion: p.explicacionRespuesta
      };
    });

    const puntaje = Math.round((correctas / total) * 100);
    const aprobado = puntaje >= examen.notaMinimaAprobatoria;
    const fechaHora = new Date().toLocaleString('es-CO');
    const codigoCertificadoGenerado = aprobado ? `CERT-${activeExamCapacitacion.codigo}-${empleadoActual.documento}` : undefined;

    setExamResult({
      presentado: true,
      puntaje,
      aprobado,
      totalPreguntas: total,
      correctas,
      retroalimentaciones
    });

    let capActualizada: Capacitacion | null = null;
    const actualizadas = capacitaciones.map(c => {
      if (c.id !== activeExamCapacitacion.id) return c;
      const participantes = [...c.participantes];
      const pIdx = participantes.findIndex(p => p.empleadoId === empleadoActual.id);
      if (pIdx >= 0) {
        participantes[pIdx] = {
          ...participantes[pIdx],
          asistenciaConfirmada: true,
          fechaAsistencia: participantes[pIdx].fechaAsistencia || fechaHora,
          evaluacionPresentada: true,
          fechaEvaluacion: fechaHora,
          calificacionObtenida: puntaje,
          aprobada: aprobado,
          intentosRealizados: (participantes[pIdx].intentosRealizados || 0) + 1,
          codigoCertificado: codigoCertificadoGenerado
        };
      } else {
        participantes.push({
          empleadoId: empleadoActual.id,
          cargoId: empleadoActual.cargoId,
          asistenciaConfirmada: true,
          fechaAsistencia: fechaHora,
          evaluacionPresentada: true,
          fechaEvaluacion: fechaHora,
          calificacionObtenida: puntaje,
          aprobada: aprobado,
          intentosRealizados: 1,
          codigoCertificado: codigoCertificadoGenerado
        });
      }
      capActualizada = { ...c, participantes };
      return capActualizada;
    });

    if (capActualizada) {
      setActiveExamCapacitacion(capActualizada);
    }
    persistirCapacitaciones(actualizadas);
    if (capActualizada) {
      guardarCapacitacionFB(capActualizada).catch(console.warn);
    }
  };

  // Formulario Dinámico para Formular Nueva Capacitación
  const [nuevaCap, setNuevaCap] = useState<{
    codigo: string;
    titulo: string;
    objetivo: string;
    tipo: string;
    facilitador: string;
    entidadFacilitadora: string;
    duracionHoras: number;
    modalidad: 'Presencial' | 'Virtual sincrónica' | 'Asincrónica' | 'Mixta';
    fechaProgramada: string;
    horaInicio: string;
    lugarOEnlace: string;
    cargosAsignados: string[];
    notaMinima: number;
    tiempoLimite: number;
    preguntas: PreguntaExamen[];
  }>({
    codigo: generarSiguienteCodigo(capacitaciones),
    titulo: '',
    objetivo: '',
    tipo: tiposCapacitacion[0] || 'SST (Seguridad y Salud en el Trabajo)',
    facilitador: '',
    entidadFacilitadora: 'B GROUP INGENIERIA S.A.S. / Asesor Especializado',
    duracionHoras: 4,
    modalidad: 'Presencial',
    fechaProgramada: new Date().toISOString().slice(0, 10),
    horaInicio: '08:00 AM',
    lugarOEnlace: 'Sala de Capacitación Principal o Google Meet',
    cargosAsignados: ['TODOS'],
    notaMinima: 80,
    tiempoLimite: 20,
    preguntas: [
      {
        id: `p_1_${Date.now()}`,
        enunciado: '¿Cuál es la norma o directriz principal abordada en este estándar técnico de operación?',
        opciones: [
          'Un trámite meramente administrativo sin impacto en campo.',
          'Garantizar la integridad de los colaboradores y la confiabilidad del servicio.',
          'Ignorar los controles de ingeniería cuando haya premura en la entrega.',
          'Delegar la seguridad en el cliente final.'
        ],
        opcionCorrectaIndice: 1,
        explicacionRespuesta: 'El cumplimiento riguroso de los procedimientos garantiza la salud de los trabajadores y la excelencia en el servicio.',
        puntos: 50
      },
      {
        id: `p_2_${Date.now()}`,
        enunciado: 'Ante cualquier anomalía, riesgo no controlado o incidente en el proyecto, ¿cuál es la conducta debida?',
        opciones: [
          'Ocultar el evento para evitar demoras en el reporte del turno.',
          'Suspender de inmediato la labor y notificar al Coordinador y al Responsable de SST.',
          'Continuar la labor asumiendo el riesgo individualmente.',
          'Esperar a la reunión anual de evaluación.'
        ],
        opcionCorrectaIndice: 1,
        explicacionRespuesta: 'El reporte y suspensión oportuna ante condiciones inseguras previene accidentes y protege la vida de todo el equipo.',
        puntos: 50
      }
    ]
  });

  // Funciones dinámicas del creador de preguntas de examen
  const handleAgregarPregunta = () => {
    const nuevaPregunta: PreguntaExamen = {
      id: `preg_${Date.now()}`,
      enunciado: '',
      opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
      opcionCorrectaIndice: 0,
      explicacionRespuesta: 'Explicación técnica de soporte.',
      puntos: 25
    };
    setNuevaCap(prev => ({
      ...prev,
      preguntas: [...prev.preguntas, nuevaPregunta]
    }));
  };

  const handleEliminarPregunta = (pIdx: number) => {
    if (nuevaCap.preguntas.length <= 1) {
      alert('La capacitación debe contar con al menos una (1) pregunta en su examen.');
      return;
    }
    setNuevaCap(prev => ({
      ...prev,
      preguntas: prev.preguntas.filter((_, idx) => idx !== pIdx)
    }));
  };

  const handleActualizarPregunta = (pIdx: number, campo: keyof PreguntaExamen, valor: any) => {
    setNuevaCap(prev => {
      const preguntas = [...prev.preguntas];
      preguntas[pIdx] = { ...preguntas[pIdx], [campo]: valor };
      return { ...prev, preguntas };
    });
  };

  const handleActualizarOpcion = (pIdx: number, oIdx: number, texto: string) => {
    setNuevaCap(prev => {
      const preguntas = [...prev.preguntas];
      const opciones = [...preguntas[pIdx].opciones];
      opciones[oIdx] = texto;
      preguntas[pIdx] = { ...preguntas[pIdx], opciones };
      return { ...prev, preguntas };
    });
  };

  // Guardar nueva capacitación
  const handleGuardarNuevaCapacitacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCap.titulo.trim() || !nuevaCap.objetivo.trim() || nuevaCap.cargosAsignados.length === 0) {
      alert('Por favor complete el título, objetivo y asigne al menos un cargo destinatario.');
      return;
    }

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
      codigo: nuevaCap.codigo.trim(),
      titulo: nuevaCap.titulo.trim(),
      objetivo: nuevaCap.objetivo.trim(),
      tipo: nuevaCap.tipo,
      facilitador: nuevaCap.facilitador.trim(),
      entidadFacilitadora: nuevaCap.entidadFacilitadora.trim(),
      duracionHoras: nuevaCap.duracionHoras,
      modalidad: nuevaCap.modalidad,
      fechaProgramada: nuevaCap.fechaProgramada,
      horaInicio: nuevaCap.horaInicio.trim(),
      lugarOEnlace: nuevaCap.lugarOEnlace.trim(),
      cargosAsignados: nuevaCap.cargosAsignados,
      estado: 'Programada',
      examenConocimiento: {
        id: `ex_${Date.now()}`,
        titulo: `Evaluación de Conocimiento: ${nuevaCap.titulo}`,
        instrucciones: `Evaluación técnica obligatoria. Nota mínima de aprobación: ${nuevaCap.notaMinima}%.`,
        notaMinimaAprobatoria: nuevaCap.notaMinima,
        tiempoLimiteMinutos: nuevaCap.tiempoLimite,
        preguntas: nuevaCap.preguntas
      },
      participantes: participantesIniciales
    };

    const actualizadas = [nuevoRegistro, ...capacitaciones];
    persistirCapacitaciones(actualizadas);
    guardarCapacitacionFB(nuevoRegistro).catch(console.warn);
    showToast('¡Capacitación y examen programados con éxito!');
    setActiveTab('catalogo');
  };

  // Modales y estados de administración
  const [capacitacionAEditar, setCapacitacionAEditar] = useState<Capacitacion | null>(null);
  const [capacitacionAEliminar, setCapacitacionAEliminar] = useState<Capacitacion | null>(null);
  const [gestionParticipantesCap, setGestionParticipantesCap] = useState<Capacitacion | null>(null);
  const [eliminandoCap, setEliminandoCap] = useState(false);

  // Guardar edición de capacitación existente
  const handleGuardarEdicionCapacitacion = (capEditada: Capacitacion) => {
    const actualizadas = capacitaciones.map(c => c.id === capEditada.id ? capEditada : c);
    persistirCapacitaciones(actualizadas);
    guardarCapacitacionFB(capEditada).catch(console.warn);
    setCapacitacionAEditar(null);
    showToast('¡Capacitación actualizada exitosamente!');
  };

  // Eliminar capacitación
  const handleConfirmarEliminacion = async () => {
    if (!capacitacionAEliminar) return;
    setEliminandoCap(true);
    try {
      await eliminarCapacitacionFB(capacitacionAEliminar.id);
      const actualizadas = capacitaciones.filter(c => c.id !== capacitacionAEliminar.id);
      persistirCapacitaciones(actualizadas);
      setCapacitacionAEliminar(null);
      showToast('Capacitación eliminada del catálogo.');
    } catch (e: any) {
      alert('Error al eliminar la capacitación: ' + (e?.message || e));
    } finally {
      setEliminandoCap(false);
    }
  };

  // Cambiar estado de ciclo de vida (Programada, En ejecución, Finalizada, Cancelada)
  const handleCambiarEstado = (capId: string, nuevoEstado: 'Programada' | 'En ejecución' | 'Finalizada' | 'Cancelada') => {
    let capActualizada: Capacitacion | null = null;
    const actualizadas = capacitaciones.map(c => {
      if (c.id === capId) {
        capActualizada = { ...c, estado: nuevoEstado };
        return capActualizada;
      }
      return c;
    });
    persistirCapacitaciones(actualizadas);
    if (capActualizada) {
      guardarCapacitacionFB(capActualizada).catch(console.warn);
      showToast(`Estado actualizado a: ${nuevoEstado}`);
    }
  };

  // Toggle de asistencia manual por parte de Administrador / SST
  const handleToggleAsistenciaAdmin = (capId: string, empId: string) => {
    const fechaHora = new Date().toLocaleString('es-CO');
    let capModificada: Capacitacion | null = null;
    const actualizadas = capacitaciones.map(c => {
      if (c.id !== capId) return c;
      const participantes = [...c.participantes];
      const pIdx = participantes.findIndex(p => p.empleadoId === empId);
      if (pIdx >= 0) {
        const nuevoEstadoAsistencia = !participantes[pIdx].asistenciaConfirmada;
        participantes[pIdx] = {
          ...participantes[pIdx],
          asistenciaConfirmada: nuevoEstadoAsistencia,
          fechaAsistencia: nuevoEstadoAsistencia ? fechaHora : undefined
        };
      } else {
        const emp = empleados.find(e => e.id === empId);
        participantes.push({
          empleadoId: empId,
          cargoId: emp?.cargoId || '',
          asistenciaConfirmada: true,
          fechaAsistencia: fechaHora,
          evaluacionPresentada: false
        });
      }
      capModificada = { ...c, participantes };
      return capModificada;
    });

    persistirCapacitaciones(actualizadas);
    if (capModificada) {
      setGestionParticipantesCap(capModificada);
      if (actaAsistenciaCap?.id === capId) setActaAsistenciaCap(capModificada);
      guardarCapacitacionFB(capModificada).catch(console.warn);
      showToast('Registro de asistencia actualizado.');
    }
  };

  // Actualizar calificación manual por parte del Administrador (Evaluación física/en campo)
  const handleActualizarCalificacionAdmin = (capId: string, empId: string, calificacion: number) => {
    let capModificada: Capacitacion | null = null;
    const fechaHora = new Date().toLocaleString('es-CO');
    const actualizadas = capacitaciones.map(c => {
      if (c.id !== capId) return c;
      const participantes = [...c.participantes];
      const pIdx = participantes.findIndex(p => p.empleadoId === empId);
      const notaMinima = c.examenConocimiento?.notaMinimaAprobatoria || 80;
      const aprobada = calificacion >= notaMinima;
      const emp = empleados.find(e => e.id === empId);
      const codigoCertificado = aprobada ? `CERT-${c.codigo}-${emp?.documento || empId}` : undefined;

      if (pIdx >= 0) {
        participantes[pIdx] = {
          ...participantes[pIdx],
          asistenciaConfirmada: true,
          evaluacionPresentada: true,
          fechaEvaluacion: participantes[pIdx].fechaEvaluacion || fechaHora,
          calificacionObtenida: calificacion,
          aprobada,
          codigoCertificado
        };
      } else {
        participantes.push({
          empleadoId: empId,
          cargoId: emp?.cargoId || '',
          asistenciaConfirmada: true,
          fechaAsistencia: fechaHora,
          evaluacionPresentada: true,
          fechaEvaluacion: fechaHora,
          calificacionObtenida: calificacion,
          aprobada,
          codigoCertificado
        });
      }
      capModificada = { ...c, participantes };
      return capModificada;
    });

    persistirCapacitaciones(actualizadas);
    if (capModificada) {
      setGestionParticipantesCap(capModificada);
      if (actaAsistenciaCap?.id === capId) setActaAsistenciaCap(capModificada);
      guardarCapacitacionFB(capModificada).catch(console.warn);
      showToast('Calificación y acreditación registradas.');
    }
  };

  // Exportar Matriz Consolidada de Capacitaciones a CSV (Cumplimiento Estándar 2.4.1 Res. 0312 / SG-SST)
  const handleExportarPlanCapacitacionesCSV = () => {
    const encabezados = [
      'Código',
      'Título de la Capacitación',
      'Tipo / Eje Temático',
      'Facilitador',
      'Entidad Capacitadora',
      'Fecha Programada',
      'Hora',
      'Duración (Horas)',
      'Modalidad',
      'Estado',
      'Población Asignada',
      'Total Asignados',
      'Total Asistentes',
      '% Cobertura Asistencia',
      'Total Evaluados',
      'Total Aprobados',
      '% Aprobación'
    ];

    const filas = capacitaciones.map(c => {
      const totalAsignados = c.participantes.length;
      const totalAsistentes = c.participantes.filter(p => p.asistenciaConfirmada).length;
      const totalEvaluados = c.participantes.filter(p => p.evaluacionPresentada).length;
      const totalAprobados = c.participantes.filter(p => p.aprobada).length;
      const pctAsist = totalAsignados > 0 ? Math.round((totalAsistentes / totalAsignados) * 100) : 0;
      const pctAprob = totalEvaluados > 0 ? Math.round((totalAprobados / totalEvaluados) * 100) : 0;
      const cargosTexto = c.cargosAsignados.includes('TODOS')
        ? 'Todos los Cargos'
        : c.cargosAsignados.map(cid => cargos.find(cg => cg.id === cid)?.nombre || cid).join(' - ');

      return [
        `"${c.codigo}"`,
        `"${c.titulo.replace(/"/g, '""')}"`,
        `"${c.tipo}"`,
        `"${c.facilitador.replace(/"/g, '""')}"`,
        `"${(c.entidadFacilitadora || 'B GROUP').replace(/"/g, '""')}"`,
        `"${c.fechaProgramada}"`,
        `"${c.horaInicio}"`,
        c.duracionHoras,
        `"${c.modalidad}"`,
        `"${c.estado}"`,
        `"${cargosTexto.replace(/"/g, '""')}"`,
        totalAsignados,
        totalAsistentes,
        `"${pctAsist}%"`,
        totalEvaluados,
        totalAprobados,
        `"${pctAprob}%"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [encabezados.join(';'), ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Matriz_Plan_Capacitaciones_BGROUP_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Matriz de capacitaciones exportada exitosamente a Excel/CSV.');
  };

  // Estadísticas globales consolidadas
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

  // Helper para clasificar capacitación por Trimestre (T1, T2, T3, T4)
  const obtenerTrimestre = (fecha: string): 'T1' | 'T2' | 'T3' | 'T4' => {
    if (!fecha) return 'T1';
    const parts = fecha.split('-');
    const mes = parseInt(parts[1], 10);
    if (mes >= 1 && mes <= 3) return 'T1';
    if (mes >= 4 && mes <= 6) return 'T2';
    if (mes >= 7 && mes <= 9) return 'T3';
    return 'T4';
  };

  // Estado para el tablero de Indicadores
  const [periodoIndicadores, setPeriodoIndicadores] = useState<'ANUAL' | 'T1' | 'T2' | 'T3' | 'T4'>('ANUAL');
  const [filtroTipoIndicador, setFiltroTipoIndicador] = useState<string>('TODOS');
  const [busquedaIndicador, setBusquedaIndicador] = useState<string>('');

  // Métricas trimestrales comparativas (T1, T2, T3, T4)
  const metricasTrimestrales = useMemo(() => {
    const trimestres = ['T1', 'T2', 'T3', 'T4'] as const;
    const resultados: Record<'T1' | 'T2' | 'T3' | 'T4', {
      nombre: string;
      meses: string;
      programadas: number;
      ejecutadas: number;
      pctCumplimiento: number;
      convocados: number;
      asistentes: number;
      pctCobertura: number;
      evaluados: number;
      aprobados: number;
      pctAprobacion: number;
      horasHombre: number;
    }> = {
      T1: { nombre: 'Trimestre 1', meses: 'Ene - Mar', programadas: 0, ejecutadas: 0, pctCumplimiento: 0, convocados: 0, asistentes: 0, pctCobertura: 0, evaluados: 0, aprobados: 0, pctAprobacion: 0, horasHombre: 0 },
      T2: { nombre: 'Trimestre 2', meses: 'Abr - Jun', programadas: 0, ejecutadas: 0, pctCumplimiento: 0, convocados: 0, asistentes: 0, pctCobertura: 0, evaluados: 0, aprobados: 0, pctAprobacion: 0, horasHombre: 0 },
      T3: { nombre: 'Trimestre 3', meses: 'Jul - Sep', programadas: 0, ejecutadas: 0, pctCumplimiento: 0, convocados: 0, asistentes: 0, pctCobertura: 0, evaluados: 0, aprobados: 0, pctAprobacion: 0, horasHombre: 0 },
      T4: { nombre: 'Trimestre 4', meses: 'Oct - Dic', programadas: 0, ejecutadas: 0, pctCumplimiento: 0, convocados: 0, asistentes: 0, pctCobertura: 0, evaluados: 0, aprobados: 0, pctAprobacion: 0, horasHombre: 0 }
    };

    capacitaciones.forEach(c => {
      const t = obtenerTrimestre(c.fechaProgramada);
      const data = resultados[t];
      data.programadas++;
      const totalAsignados = c.participantes.length;
      const totalAsistentes = c.participantes.filter(p => p.asistenciaConfirmada).length;
      const totalEvaluados = c.participantes.filter(p => p.evaluacionPresentada).length;
      const totalAprobados = c.participantes.filter(p => p.aprobada).length;

      if (c.estado === 'Finalizada' || totalAsistentes > 0) {
        data.ejecutadas++;
      }
      data.convocados += totalAsignados;
      data.asistentes += totalAsistentes;
      data.evaluados += totalEvaluados;
      data.aprobados += totalAprobados;
      data.horasHombre += (c.duracionHoras * totalAsistentes);
    });

    trimestres.forEach(t => {
      const d = resultados[t];
      d.pctCumplimiento = d.programadas > 0 ? Math.round((d.ejecutadas / d.programadas) * 100) : 0;
      d.pctCobertura = d.convocados > 0 ? Math.round((d.asistentes / d.convocados) * 100) : 0;
      d.pctAprobacion = d.evaluados > 0 ? Math.round((d.aprobados / d.evaluados) * 100) : 0;
    });

    return resultados;
  }, [capacitaciones]);

  // Métricas para el período seleccionado (Anual o Trimestre específico)
  const metricasPeriodo = useMemo(() => {
    const cursosPeriodo = capacitaciones.filter(c => {
      if (periodoIndicadores === 'ANUAL') return true;
      return obtenerTrimestre(c.fechaProgramada) === periodoIndicadores;
    });

    const programadas = cursosPeriodo.length;
    let ejecutadas = 0;
    let convocados = 0;
    let asistentes = 0;
    let evaluados = 0;
    let aprobados = 0;
    let horasHombre = 0;

    cursosPeriodo.forEach(c => {
      const totalAsig = c.participantes.length;
      const totalAsist = c.participantes.filter(p => p.asistenciaConfirmada).length;
      const totalEval = c.participantes.filter(p => p.evaluacionPresentada).length;
      const totalAprob = c.participantes.filter(p => p.aprobada).length;

      if (c.estado === 'Finalizada' || totalAsist > 0) ejecutadas++;
      convocados += totalAsig;
      asistentes += totalAsist;
      evaluados += totalEval;
      aprobados += totalAprob;
      horasHombre += (c.duracionHoras * totalAsist);
    });

    const pctCumplimiento = programadas > 0 ? Math.round((ejecutadas / programadas) * 100) : 0;
    const pctCobertura = convocados > 0 ? Math.round((asistentes / convocados) * 100) : 0;
    const pctAprobacion = evaluados > 0 ? Math.round((aprobados / evaluados) * 100) : 0;

    return {
      cursosPeriodo,
      programadas,
      ejecutadas,
      pctCumplimiento,
      convocados,
      asistentes,
      pctCobertura,
      evaluados,
      aprobados,
      pctAprobacion,
      horasHombre
    };
  }, [capacitaciones, periodoIndicadores]);

  // Lista detallada de capacitaciones con indicadores individuales calculados
  const capacitacionesConIndicadores = useMemo(() => {
    return metricasPeriodo.cursosPeriodo.filter(c => {
      const matchTipo = filtroTipoIndicador === 'TODOS' || c.tipo === filtroTipoIndicador;
      const matchBusqueda =
        c.titulo.toLowerCase().includes(busquedaIndicador.toLowerCase()) ||
        c.codigo.toLowerCase().includes(busquedaIndicador.toLowerCase()) ||
        c.facilitador.toLowerCase().includes(busquedaIndicador.toLowerCase());
      return matchTipo && matchBusqueda;
    }).map(c => {
      const trimestre = obtenerTrimestre(c.fechaProgramada);
      const convocados = c.participantes.length;
      const asistentes = c.participantes.filter(p => p.asistenciaConfirmada).length;
      const evaluados = c.participantes.filter(p => p.evaluacionPresentada).length;
      const aprobados = c.participantes.filter(p => p.aprobada).length;
      const pctCobertura = convocados > 0 ? Math.round((asistentes / convocados) * 100) : 0;
      const pctAprobacion = evaluados > 0 ? Math.round((aprobados / evaluados) * 100) : 0;
      
      const sumaNotas = c.participantes
        .filter(p => p.evaluacionPresentada && typeof p.calificacionObtenida === 'number')
        .reduce((acc, p) => acc + (p.calificacionObtenida || 0), 0);
      const calificacionPromedio = evaluados > 0 ? Math.round(sumaNotas / evaluados) : 0;

      return {
        ...c,
        trimestre,
        convocados,
        asistentes,
        pctCobertura,
        evaluados,
        aprobados,
        pctAprobacion,
        calificacionPromedio
      };
    });
  }, [metricasPeriodo.cursosPeriodo, filtroTipoIndicador, busquedaIndicador]);

  // Formato minutos:segundos para el examen
  const formatearTiempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#18235C] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg border border-[#8FA7D6]/30 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#00FF00]" />
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
              Diseño de planes formativos por cargos, registro de asistencia, aplicación de evaluaciones de conocimiento con retroalimentación y certificación automática con validez legal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {isSuperAdmin && esAdmin && (
              <button
                id="btn-depurar-capacitaciones"
                onClick={() => setModalDepurarOpen(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-rose-300 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                title="Restablecer historial de asistencias y participantes (Exclusivo Superadministrador)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Restablecer Registros</span>
              </button>
            )}

            {/* Ficha del Colaborador o Selector Administrativo */}
            {userRole === 'empleado' ? (
              <div className="p-3 bg-white rounded-xl border border-[#8FA7D6]/40 text-xs min-w-[220px] shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-[#282829]/60 flex items-center justify-between">
                  <span>Colaborador Acreditado:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    En Sesión
                  </span>
                </div>
                <div className="font-bold text-[#18235C] text-xs mt-1">
                  {empleadoActual?.nombre || 'Colaborador'}
                </div>
                <div className="text-[10px] text-[#282829]/70 mt-0.5">
                  {cargos.find(c => c.id === empleadoActual?.cargoId)?.nombre || 'Cargo'} • CC: {empleadoActual?.documento}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] text-xs space-y-1 min-w-[240px]">
                <div className="text-[10px] uppercase font-bold text-[#282829] flex items-center justify-between">
                  <span>Colaborador Seleccionado:</span>
                  <span className="text-[#18235C] font-semibold">Auditoría Individual</span>
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
            )}
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
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'misCapacitaciones'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mis Capacitaciones & Evaluaciones ({misCapacitacionesAsignadas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalogo')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalogo'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Catálogo General ({capacitaciones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('indicadores')}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'indicadores'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829] hover:text-[#18235C]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#18235C]" />
            <span>Tablero de Indicadores SST (Anual / Trimestral)</span>
          </button>

          {esAdmin && (
            <button
              onClick={() => {
                setNuevaCap(p => ({ ...p, codigo: generarSiguienteCodigo(capacitaciones) }));
                setActiveTab('crear');
              }}
              className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'crear'
                  ? 'border-[#18235C] text-[#18235C]'
                  : 'border-transparent text-[#282829] hover:text-[#18235C]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Crear Capacitación & Examen Previo</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: MIS CAPACITACIONES (PORTAL DEL COLABORADOR: ASISTENCIA Y EVALUACIÓN) */}
      {activeTab === 'misCapacitaciones' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#18235C]">
                Capacitaciones Obligatorias de tu Cargo: {empleadoActual?.nombre}
              </h3>
              <div className="text-xs text-[#282829] mt-0.5">
                Cargo vinculado: <strong>{cargos.find(c => c.id === empleadoActual?.cargoId)?.nombre || 'General'}</strong> • Confirma tu asistencia y aprueba el examen técnico para obtener tu constancia oficial.
              </div>
            </div>

            {/* Filtros de estado para el colaborador */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFiltroEstadoEmpleado('TODOS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filtroEstadoEmpleado === 'TODOS'
                    ? 'bg-[#18235C] text-white shadow-2xs'
                    : 'bg-slate-100 text-[#282829] hover:bg-slate-200'
                }`}
              >
                Todas ({capacitaciones.filter(cap => cap.cargosAsignados.includes('TODOS') || cap.cargosAsignados.includes(empleadoActual?.cargoId)).length})
              </button>
              <button
                onClick={() => setFiltroEstadoEmpleado('PENDIENTES_ASISTENCIA')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filtroEstadoEmpleado === 'PENDIENTES_ASISTENCIA'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Por Asistir
              </button>
              <button
                onClick={() => setFiltroEstadoEmpleado('PENDIENTES_EXAMEN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filtroEstadoEmpleado === 'PENDIENTES_EXAMEN'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                Examen Pendiente
              </button>
              <button
                onClick={() => setFiltroEstadoEmpleado('APROBADAS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filtroEstadoEmpleado === 'APROBADAS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Aprobadas & Certificadas
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {misCapacitacionesAsignadas.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#8FA7D6] space-y-2">
                <GraduationCap className="w-10 h-10 text-[#18235C] mx-auto opacity-40" />
                <h4 className="font-bold text-sm text-[#18235C]">No tienes capacitaciones pendientes en este filtro</h4>
                <p className="text-xs text-[#282829] max-w-md mx-auto">
                  {filtroEstadoEmpleado !== 'TODOS'
                    ? 'No se registran capacitaciones con el filtro seleccionado. Prueba seleccionando "Todas".'
                    : 'Tu cargo no tiene sesiones formativas programadas en este momento. La Dirección de SST y Gestión Humana te notificará cuando se programe un nuevo ciclo.'}
                </p>
              </div>
            ) : (
              misCapacitacionesAsignadas.map(cap => {
                const miRegistro = cap.participantes.find(p => p.empleadoId === empleadoActual?.id);
                const asistenciaConfirmada = miRegistro?.asistenciaConfirmada || false;
                const evaluacionPresentada = miRegistro?.evaluacionPresentada || false;
                const aprobada = miRegistro?.aprobada || false;
                const calificacion = miRegistro?.calificacionObtenida;
                const esEnlace = cap.lugarOEnlace.startsWith('http') || cap.lugarOEnlace.includes('meet.google.com') || cap.lugarOEnlace.includes('zoom.us') || cap.lugarOEnlace.includes('teams.microsoft.com');

                return (
                  <div
                    key={cap.id}
                    className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-sm space-y-4 hover:border-[#18235C]/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8FA7D6]/40 pb-3">
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

                    <div className="text-xs text-[#282829] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>Facilitador: <strong>{cap.facilitador}</strong> ({cap.entidadFacilitadora})</span>
                      {esEnlace && (
                        <a
                          href={cap.lugarOEnlace.startsWith('http') ? cap.lugarOEnlace : `https://${cap.lugarOEnlace}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-2xs"
                        >
                          <Video className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ingresar al Aula / Sesión Virtual</span>
                          <ExternalLink className="w-3 h-3 text-blue-500" />
                        </a>
                      )}
                    </div>

                    {/* Pasos secuenciales de Acreditación */}
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-[#8FA7D6]/60 space-y-3">
                      <div className="text-xs font-bold text-[#18235C] uppercase tracking-wider">
                        Ruta de Acreditación Legal:
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {/* Paso 1: Asistencia */}
                        <div className={`p-3.5 rounded-xl border ${
                          asistenciaConfirmada
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-[#8FA7D6] text-[#18235C]'
                        }`}>
                          <div className="font-bold flex items-center justify-between mb-1">
                            <span>1. Asistencia</span>
                            {asistenciaConfirmada ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-[#282829]" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#282829]">
                            {asistenciaConfirmada ? (
                              <span className="text-emerald-800 font-semibold">
                                Registrada: {miRegistro?.fechaAsistencia}
                              </span>
                            ) : (
                              'Pendiente por confirmar asistencia'
                            )}
                          </div>

                          {!asistenciaConfirmada && (
                            <button
                              onClick={() => handleConfirmarAsistencia(cap.id, empleadoActual.id)}
                              className="mt-2.5 w-full py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#00FF00]" />
                              <span>Confirmar Mi Asistencia</span>
                            </button>
                          )}
                        </div>

                        {/* Paso 2: Evaluación de Conocimiento */}
                        <div className={`p-3.5 rounded-xl border ${
                          !asistenciaConfirmada
                            ? 'bg-slate-100 border-slate-300 text-[#282829] opacity-75'
                            : evaluacionPresentada
                            ? aprobada
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                            : 'bg-white border-[#8FA7D6] text-[#18235C]'
                        }`}>
                          <div className="font-bold flex items-center justify-between mb-1">
                            <span>2. Examen de Conocimiento</span>
                            {evaluacionPresentada ? (
                              aprobada ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600" />
                              )
                            ) : (
                              <HelpCircle className="w-4 h-4 text-[#282829]" />
                            )}
                          </div>

                          <div className="text-[11px]">
                            {!asistenciaConfirmada ? (
                              <span className="text-[#282829]/70 italic">
                                Confirma tu asistencia para habilitar el examen.
                              </span>
                            ) : evaluacionPresentada ? (
                              <div>
                                <span className="font-extrabold text-sm">Puntaje: {calificacion}%</span> —{' '}
                                <span className="font-bold">{aprobada ? 'Aprobado' : 'No aprobado (requiere reintento)'}</span>
                              </div>
                            ) : (
                              <span className="text-[#18235C] font-semibold">
                                ¡Examen habilitado! ({cap.examenConocimiento?.preguntas.length} preguntas)
                              </span>
                            )}
                          </div>

                          {asistenciaConfirmada && (!evaluacionPresentada || !aprobada) && (
                            <button
                              onClick={() => handleIniciarExamen(cap)}
                              className="mt-2.5 w-full py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <PenTool className="w-3.5 h-3.5 text-[#00FF00]" />
                              <span>{evaluacionPresentada ? 'Reintentar Evaluación' : 'Presentar Evaluación'}</span>
                            </button>
                          )}
                        </div>

                        {/* Paso 3: Certificado y Acreditación */}
                        <div className={`p-3.5 rounded-xl border ${
                          aprobada
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-slate-100 border-slate-300 text-[#282829] opacity-75'
                        }`}>
                          <div className="font-bold flex items-center justify-between mb-1">
                            <span>3. Certificación SST</span>
                            <Award className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="text-[11px]">
                            {aprobada ? (
                              <div>
                                <span className="font-bold text-emerald-900">Certificado Oficial Emitido</span>
                                <div className="text-[10px] font-mono text-[#18235C] mt-0.5">{miRegistro?.codigoCertificado}</div>
                              </div>
                            ) : (
                              <span>Aprobación con {cap.examenConocimiento?.notaMinimaAprobatoria}% mínimo para certificar.</span>
                            )}
                          </div>

                          {aprobada && miRegistro && (
                            <button
                              onClick={() => setCertificadoModal({ capacitacion: cap, empleado: empleadoActual, participante: miRegistro })}
                              className="mt-2.5 w-full py-1.5 bg-white hover:bg-slate-50 text-[#18235C] border border-[#18235C] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Award className="w-3.5 h-3.5 text-[#00FF00]" />
                              <span>Ver Constancia Oficial</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CATÁLOGO Y MATRIZ DE SEGUIMIENTO */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Filtros en Catálogo */}
          <div className="bg-white p-4 rounded-xl border border-[#8FA7D6] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#282829]" />
              <input
                type="text"
                placeholder="Buscar por título, código o facilitador..."
                value={searchCatalogo}
                onChange={e => setSearchCatalogo(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#8FA7D6] bg-slate-50 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Filter className="w-4 h-4 text-[#282829] shrink-0" />
              <span className="text-xs text-[#282829] font-bold">Tipo:</span>
              <select
                value={filterTipoCatalogo}
                onChange={e => setFilterTipoCatalogo(e.target.value)}
                className="text-xs p-2 rounded-lg border border-[#8FA7D6] bg-slate-50 font-bold text-[#18235C]"
              >
                <option value="TODOS">Todos los tipos ({tiposCapacitacion.length})</option>
                {tiposCapacitacion.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {esAdmin && (
                <button
                  type="button"
                  onClick={() => setModalConfigTiposOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#8FA7D6] bg-white hover:bg-slate-50 text-[#18235C] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Configurar, agregar, editar o eliminar los tipos de capacitación"
                >
                  <Settings className="w-3.5 h-3.5 text-[#18235C]" />
                  <span>Configurar Tipos</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-[#8FA7D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-[#18235C]">
                  Catálogo General del Plan Anual de Capacitación
                </h3>
                <p className="text-xs text-[#282829]">
                  Cargos destinatarios, cobertura de asistencia, porcentaje de aprobación y actas oficiales de sesión.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportarPlanCapacitacionesCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#18235C] border border-[#8FA7D6] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Descargar matriz en formato CSV compatible con Excel para auditorías ARL y MinTrabajo"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exportar Matriz (Res. 0312)</span>
                </button>

                {esAdmin && (
                  <button
                    onClick={() => setActiveTab('crear')}
                    className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                    <span>Nueva Capacitación</span>
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-[#8FA7D6]/60">
              {capacitacionesFiltradas.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#282829]">
                  No se encontraron capacitaciones que coincidan con la búsqueda.
                </div>
              ) : (
                capacitacionesFiltradas.map(cap => {
                  const asistencias = cap.participantes.filter(p => p.asistenciaConfirmada).length;
                  const evaluados = cap.participantes.filter(p => p.evaluacionPresentada).length;
                  const aprobados = cap.participantes.filter(p => p.aprobada).length;
                  const totalAsignados = cap.participantes.length;

                  return (
                    <div key={cap.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#18235C]">{cap.codigo}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#18235C]/10 text-[#18235C]">
                              {cap.tipo}
                            </span>
                            <span className="text-xs text-[#282829]">
                              {cap.duracionHoras} horas • {cap.modalidad}
                            </span>

                            {/* Selector de Estado del Curso */}
                            {esAdmin ? (
                              <select
                                value={cap.estado || 'Programada'}
                                onChange={e => handleCambiarEstado(cap.id, e.target.value as any)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer ${
                                  cap.estado === 'Finalizada'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : cap.estado === 'En ejecución'
                                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                                    : cap.estado === 'Cancelada'
                                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="Programada">● Programada</option>
                                <option value="En ejecución">● En ejecución</option>
                                <option value="Finalizada">● Finalizada</option>
                                <option value="Cancelada">● Cancelada</option>
                              </select>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#18235C] border border-[#8FA7D6]">
                                {cap.estado || 'Programada'}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-[#18235C] mt-1">{cap.titulo}</h4>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                          <button
                            onClick={() => setActaAsistenciaCap(cap)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#8FA7D6] bg-white hover:bg-slate-100 text-[#18235C] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            title="Ver e imprimir Acta de Asistencia y Acreditación Oficial"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#18235C]" />
                            <span>Acta Oficial</span>
                          </button>

                          {esAdmin && (
                            <>
                              <button
                                onClick={() => setGestionParticipantesCap(cap)}
                                className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                title="Marcar asistencias y notas manuales del personal"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-indigo-700" />
                                <span>Asistencias & Notas</span>
                              </button>

                              <button
                                onClick={() => setCapacitacionAEditar(cap)}
                                className="p-1.5 rounded-lg border border-[#8FA7D6] bg-white hover:bg-slate-100 text-[#18235C] text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Editar detalles, horario, cargos y preguntas de esta capacitación"
                              >
                                <Edit className="w-3.5 h-3.5 text-[#18235C]" />
                              </button>

                              <button
                                onClick={() => setCapacitacionAEliminar(cap)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Eliminar capacitación del catálogo"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-[#8FA7D6]/60">
                        <div>
                          <span className="text-[10px] text-[#282829] block uppercase font-bold">Cargos Destinatarios:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cap.cargosAsignados.includes('TODOS') ? (
                              <span className="px-2 py-0.5 bg-white border border-[#8FA7D6] rounded text-[10px] font-bold text-[#18235C]">
                                Todos los colaboradores de la empresa
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
                          <span className="text-[10px] text-[#282829] block uppercase font-bold">Asistencia & Cobertura:</span>
                          <div className="text-xs font-bold text-[#18235C] mt-1">
                            {asistencias} de {totalAsignados} asistentes ({totalAsignados > 0 ? Math.round((asistencias / totalAsignados) * 100) : 0}%)
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#282829] block uppercase font-bold">Evaluación y Aprobación:</span>
                          <div className="text-xs font-bold text-[#18235C] mt-1">
                            {aprobados} de {evaluados} aprobados ({evaluados > 0 ? Math.round((aprobados / evaluados) * 100) : 0}%)
                          </div>
                          <div className="text-[10px] text-[#282829]">Nota mínima exigida: {cap.examenConocimiento?.notaMinimaAprobatoria}%</div>
                        </div>
                      </div>

                      {/* Lista detallada de participantes */}
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-[#18235C] mb-1.5 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#18235C]" />
                          <span>Participantes Asignados ({cap.participantes.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {cap.participantes.map(p => {
                            const emp = empleados.find(e => e.id === p.empleadoId);
                            return (
                              <div
                                key={p.empleadoId}
                                className={`p-2 rounded-lg border flex items-center gap-2 text-[11px] ${
                                  p.aprobada
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                    : p.asistenciaConfirmada
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-white border-[#8FA7D6] text-[#282829]'
                                }`}
                              >
                                <User className="w-3 h-3 text-[#18235C]" />
                                <span>{emp?.nombre || 'Colaborador'}</span>
                                <span className="text-[10px] font-mono">
                                  {p.aprobada ? `✓ Aprobó (${p.calificacionObtenida}%)` : p.asistenciaConfirmada ? 'Asistió (eval. pendiente)' : 'Sin asistir'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB DE INDICADORES SST Y DESEMPEÑO TRIMESTRAL/ANUAL */}
      {activeTab === 'indicadores' && (
        <div className="space-y-6">
          {/* Header del Tablero de Indicadores */}
          <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-[#18235C]" />
                    Estándar 2.4.1 Res. 0312 / Decreto 1072
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Auditoría SST 2026
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif text-[#18235C]">
                  Indicadores de Gestión y Cumplimiento del Plan de Capacitación
                </h3>
                <p className="text-xs text-[#282829] max-w-2xl mt-0.5">
                  Seguimiento cuantitativo obligatorio de metas institucionales: Cumplimiento del cronograma, cobertura de asistencia por población convocada y tasa de aprobación de conocimientos técnicos.
                </p>
              </div>

              {/* Selector de Período (Anual vs Trimestral) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-[#8FA7D6]/60 flex-wrap self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setPeriodoIndicadores('ANUAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    periodoIndicadores === 'ANUAL'
                      ? 'bg-[#18235C] text-white shadow-2xs'
                      : 'text-[#282829] hover:bg-white/60'
                  }`}
                >
                  Consolidado Anual
                </button>
                {(['T1', 'T2', 'T3', 'T4'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPeriodoIndicadores(t)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      periodoIndicadores === t
                        ? 'bg-[#18235C] text-white shadow-2xs'
                        : 'text-[#282829] hover:bg-white/60'
                    }`}
                  >
                    {t} ({metricasTrimestrales[t].meses})
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Tarjetas de Indicadores Principales para el Período Seleccionado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-[#8FA7D6]/40">
              {/* Indicador 1: Cumplimiento del Plan */}
              <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6]/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#18235C]">
                  <span>Cumplimiento del Plan</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    metricasPeriodo.pctCumplimiento >= 90
                      ? 'bg-emerald-100 text-emerald-800'
                      : metricasPeriodo.pctCumplimiento >= 70
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    Meta: ≥ 90%
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#18235C]">
                  {metricasPeriodo.pctCumplimiento}%
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      metricasPeriodo.pctCumplimiento >= 90
                        ? 'bg-emerald-600'
                        : metricasPeriodo.pctCumplimiento >= 70
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(metricasPeriodo.pctCumplimiento, 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#282829] flex justify-between">
                  <span>Ejecutadas: <strong>{metricasPeriodo.ejecutadas}</strong></span>
                  <span>Programadas: <strong>{metricasPeriodo.programadas}</strong></span>
                </div>
              </div>

              {/* Indicador 2: Cobertura de Asistencia */}
              <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6]/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#18235C]">
                  <span>Cobertura de Asistencia</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    metricasPeriodo.pctCobertura >= 85
                      ? 'bg-emerald-100 text-emerald-800'
                      : metricasPeriodo.pctCobertura >= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    Meta: ≥ 85%
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#18235C]">
                  {metricasPeriodo.pctCobertura}%
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      metricasPeriodo.pctCobertura >= 85
                        ? 'bg-emerald-600'
                        : metricasPeriodo.pctCobertura >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(metricasPeriodo.pctCobertura, 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#282829] flex justify-between">
                  <span>Asistentes: <strong>{metricasPeriodo.asistentes}</strong></span>
                  <span>Convocados: <strong>{metricasPeriodo.convocados}</strong></span>
                </div>
              </div>

              {/* Indicador 3: Tasa de Aprobación */}
              <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6]/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#18235C]">
                  <span>Tasa de Aprobación</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    metricasPeriodo.pctAprobacion >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : metricasPeriodo.pctAprobacion >= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    Meta: ≥ 80%
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#18235C]">
                  {metricasPeriodo.pctAprobacion}%
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      metricasPeriodo.pctAprobacion >= 80
                        ? 'bg-emerald-600'
                        : metricasPeriodo.pctAprobacion >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(metricasPeriodo.pctAprobacion, 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#282829] flex justify-between">
                  <span>Aprobados: <strong>{metricasPeriodo.aprobados}</strong></span>
                  <span>Evaluados: <strong>{metricasPeriodo.evaluados}</strong></span>
                </div>
              </div>

              {/* Indicador 4: Horas Hombre Capacitación */}
              <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6]/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#18235C]">
                  <span>Horas Hombre (HHC)</span>
                  <Clock className="w-4 h-4 text-[#18235C]" />
                </div>
                <div className="text-2xl font-extrabold text-[#18235C]">
                  {metricasPeriodo.horasHombre} <span className="text-sm font-semibold">hrs</span>
                </div>
                <div className="text-[11px] text-[#282829] mt-2">
                  Tiempo efectivo de transferencia técnica transferido al equipo humano de la organización.
                </div>
              </div>
            </div>
          </div>

          {/* Desglose Comparativo Trimestral (T1, T2, T3, T4) */}
          <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8FA7D6]/40 pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#18235C] flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#18235C]" />
                  Desglose y Comparativa Trimestral del Plan 2026
                </h4>
                <p className="text-xs text-[#282829]">
                  Evaluación periódica para el comité paritario (COPASST) y Gerencia General.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-[#18235C]">
                {capacitaciones.length} Cursos Distribuidos en el Año
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              {(['T1', 'T2', 'T3', 'T4'] as const).map(t => {
                const met = metricasTrimestrales[t];
                const estaSeleccionado = periodoIndicadores === t;

                return (
                  <div
                    key={t}
                    onClick={() => setPeriodoIndicadores(t)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      estaSeleccionado
                        ? 'bg-[#18235C]/5 border-[#18235C] ring-2 ring-[#18235C]/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-[#8FA7D6]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#18235C]">{met.nombre}</span>
                      <span className="text-[10px] font-semibold text-[#282829] bg-white px-2 py-0.5 rounded border border-[#8FA7D6]/60">
                        {met.meses}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#282829]">Cumplimiento:</span>
                          <strong className="text-[#18235C]">{met.pctCumplimiento}%</strong>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="bg-[#18235C] h-full"
                            style={{ width: `${Math.min(met.pctCumplimiento, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#282829]">Cobertura:</span>
                          <strong className="text-emerald-700">{met.pctCobertura}%</strong>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="bg-emerald-600 h-full"
                            style={{ width: `${Math.min(met.pctCobertura, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#282829]">Aprobación:</span>
                          <strong className="text-blue-700">{met.pctAprobacion}%</strong>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="bg-blue-600 h-full"
                            style={{ width: `${Math.min(met.pctAprobacion, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#8FA7D6]/30 flex justify-between text-[10px] text-[#282829]">
                        <span>Cursos: <strong>{met.ejecutadas}/{met.programadas}</strong></span>
                        <span>HHC: <strong>{met.horasHombre}h</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLA DETALLADA: COBERTURA Y TASA DE APROBACIÓN DE CADA CAPACITACIÓN PLANIFICADA */}
          <div className="bg-white rounded-xl border border-[#8FA7D6] shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#8FA7D6]/40 pb-3">
              <div>
                <h4 className="text-base font-bold text-[#18235C] font-serif flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Cobertura y Tasa de Aprobación por Capacitación Planificada
                </h4>
                <p className="text-xs text-[#282829] mt-0.5">
                  Consulta de indicadores individuales por cada estándar formativo programado en el período: <strong>{periodoIndicadores === 'ANUAL' ? 'Año Completo 2026' : `Trimestre ${periodoIndicadores}`}</strong>.
                </p>
              </div>

              {/* Filtros de búsqueda para la tabla */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#282829]" />
                  <input
                    type="text"
                    placeholder="Filtrar por curso..."
                    value={busquedaIndicador}
                    onChange={e => setBusquedaIndicador(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#8FA7D6] bg-slate-50 w-44 font-medium"
                  />
                </div>

                <select
                  value={filtroTipoIndicador}
                  onChange={e => setFiltroTipoIndicador(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-[#8FA7D6] bg-slate-50 font-bold text-[#18235C]"
                >
                  <option value="TODOS">Todos los tipos</option>
                  {tiposCapacitacion.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabla de Cursos con Indicadores de Cobertura y Aprobación */}
            <div className="overflow-x-auto border border-[#8FA7D6] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18235C] text-white text-[11px]">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Capacitación Planificada</th>
                    <th className="p-3 text-center">Trimestre / Fecha</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center">Convocados</th>
                    <th className="p-3 text-center">Cobertura Asistencia</th>
                    <th className="p-3 text-center">Tasa de Aprobación</th>
                    <th className="p-3 text-center">Nota Promedio</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/40">
                  {capacitacionesConIndicadores.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-xs text-[#282829]">
                        No hay capacitaciones programadas en este período o filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    capacitacionesConIndicadores.map(c => {
                      const coberturaSemaforo =
                        c.pctCobertura >= 85 ? 'text-emerald-700 bg-emerald-50 border-emerald-300' :
                        c.pctCobertura >= 60 ? 'text-amber-700 bg-amber-50 border-amber-300' :
                        'text-rose-700 bg-rose-50 border-rose-300';

                      const aprobacionSemaforo =
                        c.pctAprobacion >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-300' :
                        c.pctAprobacion >= 60 ? 'text-amber-700 bg-amber-50 border-amber-300' :
                        'text-rose-700 bg-rose-50 border-rose-300';

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-mono font-bold text-[#18235C] whitespace-nowrap">
                            {c.codigo}
                          </td>
                          <td className="p-3 max-w-xs">
                            <div className="font-bold text-[#18235C]">{c.titulo}</div>
                            <div className="text-[11px] text-[#282829] mt-0.5">
                              {c.tipo} • {c.facilitador} ({c.duracionHoras}h)
                            </div>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C]/10 text-[#18235C] block w-fit mx-auto mb-1">
                              {c.trimestre}
                            </span>
                            <span className="text-[11px] text-[#282829]">{c.fechaProgramada}</span>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              c.estado === 'Finalizada' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              c.estado === 'En ejecución' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                              c.estado === 'Cancelada' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                              'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {c.estado || 'Programada'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-[#18235C]">
                            {c.convocados}
                          </td>
                          <td className="p-3 text-center min-w-[130px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${coberturaSemaforo}`}>
                                {c.pctCobertura}%
                              </span>
                            </div>
                            <div className="text-[10px] text-[#282829] mt-0.5">
                              {c.asistentes} de {c.convocados} asistentes
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1 max-w-[100px] mx-auto">
                              <div
                                className={`h-full ${c.pctCobertura >= 85 ? 'bg-emerald-600' : c.pctCobertura >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(c.pctCobertura, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-3 text-center min-w-[130px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${aprobacionSemaforo}`}>
                                {c.pctAprobacion}%
                              </span>
                            </div>
                            <div className="text-[10px] text-[#282829] mt-0.5">
                              {c.aprobados} de {c.evaluados} evaluados
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1 max-w-[100px] mx-auto">
                              <div
                                className={`h-full ${c.pctAprobacion >= 80 ? 'bg-emerald-600' : c.pctAprobacion >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(c.pctAprobacion, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-[#18235C]">
                            {c.calificacionPromedio > 0 ? `${c.calificacionPromedio}%` : '—'}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setActaAsistenciaCap(c)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[#18235C] text-[11px] font-bold border border-[#8FA7D6] transition-colors cursor-pointer"
                                title="Ver Acta Oficial con constancias de asistencia y calificaciones"
                              >
                                Acta
                              </button>
                              {esAdmin && (
                                <button
                                  onClick={() => setGestionParticipantesCap(c)}
                                  className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-[11px] font-bold border border-indigo-200 transition-colors cursor-pointer"
                                  title="Gestionar asistencias y calificaciones"
                                >
                                  Detalle
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'crear' && esAdmin && (
        <form onSubmit={handleGuardarNuevaCapacitacion} className="bg-white rounded-xl border border-[#8FA7D6] p-6 shadow-sm space-y-6">
          <div className="border-b border-[#8FA7D6] pb-4">
            <h3 className="font-bold text-base text-[#18235C] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#00FF00]" />
              Formular Nueva Capacitación & Diseñar Examen Previo
            </h3>
            <p className="text-xs text-[#282829] mt-0.5">
              Define los objetivos formativos, selecciona los cargos asignados y diseña el banco de preguntas para calificar y certificar automáticamente al personal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#18235C] mb-1">Código Oficial:</label>
              <input
                type="text"
                value={nuevaCap.codigo}
                onChange={e => setNuevaCap(p => ({ ...p, codigo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C] font-mono"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#18235C]">Tipo de Capacitación *</label>
                <button
                  type="button"
                  onClick={() => setModalConfigTiposOpen(true)}
                  className="text-[11px] font-bold text-[#18235C] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Modificar o agregar tipos de capacitación"
                >
                  <Settings className="w-3 h-3 text-[#18235C]" />
                  <span>Modificar Tipos</span>
                </button>
              </div>
              <select
                value={nuevaCap.tipo}
                onChange={e => setNuevaCap(p => ({ ...p, tipo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C] font-bold"
              >
                {tiposCapacitacion.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#18235C] mb-1">Título de la Capacitación *</label>
              <input
                type="text"
                value={nuevaCap.titulo}
                onChange={e => setNuevaCap(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ejemplo: Protocolo de Fibra Óptica y Seguridad Eléctrica en Postería"
                className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C] font-medium"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#18235C] mb-1">Objetivo de Aprendizaje *</label>
              <textarea
                rows={2}
                value={nuevaCap.objetivo}
                onChange={e => setNuevaCap(p => ({ ...p, objetivo: e.target.value }))}
                placeholder="Describe las competencias, conocimientos y habilidades que adquirirá el colaborador..."
                className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Facilitador / Instructor *</label>
              <input
                type="text"
                value={nuevaCap.facilitador}
                onChange={e => setNuevaCap(p => ({ ...p, facilitador: e.target.value }))}
                placeholder="Nombre del facilitador o especialista..."
                className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Entidad Facilitadora:</label>
              <input
                type="text"
                value={nuevaCap.entidadFacilitadora}
                onChange={e => setNuevaCap(p => ({ ...p, entidadFacilitadora: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Fecha Programada:</label>
              <input
                type="date"
                value={nuevaCap.fechaProgramada}
                onChange={e => setNuevaCap(p => ({ ...p, fechaProgramada: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#18235C] mb-1">Hora y Duración (Horas):</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={nuevaCap.horaInicio}
                  onChange={e => setNuevaCap(p => ({ ...p, horaInicio: e.target.value }))}
                  placeholder="08:00 AM"
                  className="px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C]"
                />
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={nuevaCap.duracionHoras}
                  onChange={e => setNuevaCap(p => ({ ...p, duracionHoras: parseInt(e.target.value) || 1 }))}
                  className="px-3 py-2 bg-slate-50 rounded-lg border border-[#8FA7D6] text-[#18235C]"
                />
              </div>
            </div>

            {/* Asignación según Cargos */}
            <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-[#8FA7D6]">
              <label className="block font-bold text-[#18235C] mb-1">
                Asignación de Cargos Obligados:
              </label>
              <p className="text-[11px] text-[#282829] mb-3">
                Selecciona los cargos que deben realizar esta capacitación. Los colaboradores vinculados recibirán la asignación en su portal automáticamente.
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        seleccionado
                          ? 'bg-[#18235C] text-white border-[#18235C]'
                          : 'bg-white text-[#282829] border-[#8FA7D6] hover:bg-slate-100'
                      }`}
                    >
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuración Dinámica del Examen Previo */}
            <div className="md:col-span-2 p-5 bg-[#18235C]/5 rounded-xl border border-[#18235C]/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#18235C]/20 pb-3">
                <div>
                  <h4 className="font-bold text-xs text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5" />
                    Diseño Dinámico del Examen de Conocimiento Previo
                  </h4>
                  <p className="text-[11px] text-[#282829]">
                    Agrega preguntas, opciones y define la respuesta correcta para calificación automatizada.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#18235C]">Nota Mínima:</span>
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

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#18235C]">Tiempo:</span>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={nuevaCap.tiempoLimite}
                      onChange={e => setNuevaCap(p => ({ ...p, tiempoLimite: parseInt(e.target.value) || 20 }))}
                      className="w-16 px-2 py-1 bg-white border border-[#8FA7D6] rounded text-xs font-bold text-center"
                    />
                    <span className="text-xs text-[#282829]">min</span>
                  </div>
                </div>
              </div>

              {/* Lista editable de preguntas */}
              <div className="space-y-4">
                {nuevaCap.preguntas.map((preg, pIdx) => (
                  <div key={preg.id} className="p-4 bg-white rounded-xl border border-[#8FA7D6] space-y-3 shadow-2xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs text-[#18235C]">
                        Pregunta #{pIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEliminarPregunta(pIdx)}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Eliminar pregunta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#18235C] mb-1">Enunciado de la Pregunta:</label>
                      <input
                        type="text"
                        value={preg.enunciado}
                        onChange={e => handleActualizarPregunta(pIdx, 'enunciado', e.target.value)}
                        placeholder="Escribe la pregunta técnica o normativa..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-[#18235C]">
                        Opciones de Respuesta (Marca el selector de la opción correcta):
                      </label>
                      <div className="space-y-2">
                        {preg.opciones.map((opc, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correcta_${pIdx}`}
                              checked={preg.opcionCorrectaIndice === oIdx}
                              onChange={() => handleActualizarPregunta(pIdx, 'opcionCorrectaIndice', oIdx)}
                              className="text-[#18235C] cursor-pointer"
                              title="Marcar como respuesta correcta"
                            />
                            <input
                              type="text"
                              value={opc}
                              onChange={e => handleActualizarOpcion(pIdx, oIdx, e.target.value)}
                              placeholder={`Opción ${String.fromCharCode(65 + oIdx)}`}
                              className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${
                                preg.opcionCorrectaIndice === oIdx
                                  ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900'
                                  : 'bg-white border-[#8FA7D6]'
                              }`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#18235C] mb-1">Explicación Técnica / Justificación:</label>
                      <input
                        type="text"
                        value={preg.explicacionRespuesta}
                        onChange={e => handleActualizarPregunta(pIdx, 'explicacionRespuesta', e.target.value)}
                        placeholder="Justificación técnica que verá el colaborador en caso de error..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAgregarPregunta}
                  className="w-full py-2 border-2 border-dashed border-[#18235C]/40 hover:border-[#18235C] text-[#18235C] rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-white/80 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#00FF00]" />
                  <span>+ Agregar Otra Pregunta al Examen</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#8FA7D6]">
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className="px-4 py-2 text-xs font-semibold text-[#282829] hover:text-[#18235C] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
              <span>Guardar y Publicar Capacitación</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL DEL EXAMEN INTERACTIVO DE CONOCIMIENTO */}
      {activeExamCapacitacion && activeExamCapacitacion.examenConocimiento && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header del Examen con Temporizador */}
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
                <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-2xs ${
                  segundosRestantes < 120
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    : 'bg-slate-50 text-[#18235C] border-[#8FA7D6]'
                }`}>
                  <Timer className="w-4 h-4 text-[#18235C]" />
                  <span>{formatearTiempo(segundosRestantes)}</span>
                </div>
              )}
            </div>

            {/* Preguntas interactivas */}
            {!examResult ? (
              <div className="space-y-5">
                <p className="text-xs text-[#282829] bg-slate-50 p-3 rounded-lg border border-[#8FA7D6]/60">
                  {activeExamCapacitacion.examenConocimiento.instrucciones}
                </p>

                <div className="space-y-4">
                  {activeExamCapacitacion.examenConocimiento.preguntas.map((preg, idx) => (
                    <div key={preg.id} className="p-4 bg-white rounded-xl border border-[#8FA7D6] space-y-3">
                      <div className="font-bold text-xs text-[#18235C] flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#18235C] text-white text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{preg.enunciado}</span>
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
                                  ? 'bg-[#18235C]/10 border-[#18235C] text-[#18235C] font-semibold'
                                  : 'bg-slate-50 border-[#8FA7D6]/60 text-[#282829] hover:bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`preg_${preg.id}`}
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-0.5 text-[#18235C]"
                              />
                              <span className="leading-snug">{opc}</span>
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
                    className="px-4 py-2 text-xs font-semibold text-[#282829] hover:text-[#18235C] cursor-pointer"
                  >
                    Salir sin Guardar
                  </button>

                  <button
                    onClick={handleSubmitExamen}
                    disabled={Object.keys(examAnswers).length < activeExamCapacitacion.examenConocimiento.preguntas.length}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      Object.keys(examAnswers).length === activeExamCapacitacion.examenConocimiento.preguntas.length
                        ? 'bg-[#18235C] hover:bg-[#101740] text-white shadow-sm'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-[#00FF00]" />
                    <span>Calificar Examen ({Object.keys(examAnswers).length} / {activeExamCapacitacion.examenConocimiento.preguntas.length})</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Resultado y retroalimentación pedagógica */
              <div className="space-y-5">
                <div className={`p-6 rounded-2xl border text-center ${
                  examResult.aprobado
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  {examResult.aprobado ? (
                    <Award className="w-14 h-14 mx-auto mb-2 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-14 h-14 mx-auto mb-2 text-rose-600" />
                  )}
                  <h4 className="text-xl font-bold font-serif">
                    {examResult.aprobado ? '¡Felicitaciones! Has Aprobado la Evaluación' : 'Evaluación No Aprobada'}
                  </h4>
                  <div className="text-3xl font-extrabold font-serif my-1">
                    {examResult.puntaje}%
                  </div>
                  <div className="text-xs font-medium">
                    {examResult.correctas} de {examResult.totalPreguntas} respuestas correctas (Nota mínima requerida: {activeExamCapacitacion.examenConocimiento.notaMinimaAprobatoria}%)
                  </div>
                </div>

                {/* Retroalimentación técnica pregunta a pregunta */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#18235C] uppercase tracking-wider">
                    Retroalimentación Técnica de Respuestas:
                  </div>

                  {examResult.retroalimentaciones.map((item, i) => (
                    <div key={i} className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      item.esCorrecta ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}>
                      <div className="font-bold flex items-center justify-between">
                        <span className="text-[#18235C]">{i + 1}. {item.pregunta}</span>
                        {item.esCorrecta ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correcta
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Incorrecta
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#282829]">
                        Tu respuesta: <strong>{item.opcionSeleccionada}</strong>
                      </div>
                      {!item.esCorrecta && (
                        <div className="text-[11px] text-emerald-800">
                          Respuesta correcta: <strong>{item.opcionCorrecta}</strong>
                        </div>
                      )}
                      <div className="text-[11px] text-[#282829] bg-white p-2 rounded-lg border border-[#8FA7D6]/40 mt-1">
                        <strong>Fundamento normativo:</strong> {item.explicacion}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#8FA7D6]">
                  {examResult.aprobado ? (
                    <button
                      onClick={() => {
                        const miRegistro = activeExamCapacitacion.participantes.find(p => p.empleadoId === empleadoActual.id);
                        if (miRegistro) {
                          setCertificadoModal({
                            capacitacion: activeExamCapacitacion,
                            empleado: empleadoActual,
                            participante: {
                              ...miRegistro,
                              calificacionObtenida: examResult.puntaje,
                              aprobada: true,
                              codigoCertificado: `CERT-${activeExamCapacitacion.codigo}-${empleadoActual.documento}`
                            }
                          });
                        }
                        setActiveExamCapacitacion(null);
                        setExamResult(null);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-[#00FF00]" />
                      <span>Ver Mi Certificado Oficial</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setExamAnswers({});
                        setExamResult(null);
                        setSegundosRestantes((activeExamCapacitacion.examenConocimiento?.tiempoLimiteMinutos || 20) * 60);
                      }}
                      className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-[#00FF00]" />
                      <span>Reintentar Examen Ahora</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveExamCapacitacion(null);
                      setExamResult(null);
                    }}
                    className="px-4 py-2 border border-[#8FA7D6] hover:bg-slate-50 text-[#282829] rounded-lg text-xs font-semibold cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border-2 border-[#18235C] max-w-2xl w-full p-8 shadow-2xl relative my-8 print:border-none print:shadow-none">
            <button
              onClick={() => setCertificadoModal(null)}
              className="absolute top-4 right-4 text-[#282829] hover:text-[#18235C] font-bold p-1 print:hidden cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-12 h-12 rounded-full bg-[#18235C] flex items-center justify-center text-white">
                  <ShieldCheck className="w-7 h-7 text-[#00FF00]" />
                </div>
              </div>
              <div className="text-xs uppercase tracking-widest text-[#18235C] font-bold">
                B GROUP INGENIERIA S.A.S. • SISTEMA DE GESTIÓN SST
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#18235C] tracking-tight uppercase">
                Constancia Oficial de Capacitación y Competencias
              </h2>

              <p className="text-xs text-[#282829] max-w-lg mx-auto">
                En cumplimiento del Decreto 1072 de 2015 y la Resolución 0312 de 2019 (Estándar 2.4.1), se certifica que:
              </p>

              <div className="py-2">
                <div className="text-xl font-bold font-serif text-[#18235C] underline decoration-[#18235C] decoration-2 underline-offset-4">
                  {certificadoModal.empleado.nombre}
                </div>
                <div className="text-xs text-[#282829] mt-1">
                  Cédula de Ciudadanía N° <strong>{certificadoModal.empleado.documento}</strong> • Cargo: {cargos.find(c => c.id === certificadoModal.empleado.cargoId)?.nombre || 'Colaborador'}
                </div>
              </div>

              <p className="text-xs text-[#282829] max-w-lg mx-auto leading-relaxed">
                Asistió y aprobó satisfactoriamente la capacitación técnica y evaluación de conocimientos:
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6] max-w-lg mx-auto text-left space-y-1">
                <div className="text-sm font-bold text-[#18235C]">
                  {certificadoModal.capacitacion.titulo}
                </div>
                <div className="text-xs text-[#18235C] font-semibold">
                  Código: {certificadoModal.capacitacion.codigo} • Duración: {certificadoModal.capacitacion.duracionHoras} Horas • Modalidad: {certificadoModal.capacitacion.modalidad}
                </div>
                <div className="text-xs text-[#282829]">
                  Calificación obtenida: <strong className="text-emerald-700">{certificadoModal.participante.calificacionObtenida}%</strong> • Facilitador: {certificadoModal.capacitacion.facilitador}
                </div>
                <div className="text-[10px] text-[#8FA7D6] font-mono pt-1">
                  Radicado: {certificadoModal.participante.codigoCertificado || `CERT-${certificadoModal.capacitacion.codigo}-${certificadoModal.empleado.documento}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#8FA7D6] text-center text-xs">
                <div>
                  <div className="h-10 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-sm text-[#282829]">{certificadoModal.capacitacion.facilitador}</span>
                  </div>
                  <div className="border-t border-[#18235C] pt-1 font-bold text-[#18235C]">
                    Instructor / Facilitador SST
                  </div>
                  <div className="text-[10px] text-[#282829]">{certificadoModal.capacitacion.entidadFacilitadora}</div>
                </div>

                <div>
                  <div className="h-10 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-sm text-[#282829]">Dirección de Gestión Humana</span>
                  </div>
                  <div className="border-t border-[#18235C] pt-1 font-bold text-[#18235C]">
                    Gestión del Talento & SG-SST
                  </div>
                  <div className="text-[10px] text-[#282829]">B GROUP INGENIERIA S.A.S. — NIT 900.995.99-2</div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-[#00FF00]" />
                  <span>Imprimir Constancia</span>
                </button>
                <button
                  onClick={() => setCertificadoModal(null)}
                  className="px-4 py-2.5 border border-[#8FA7D6] text-[#282829] hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ACTA DE ASISTENCIA Y ACREDITACIÓN DEL CURSO (SG-SST) */}
      {actaAsistenciaCap && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 print:border-none print:shadow-none space-y-5">
            <button
              onClick={() => setActaAsistenciaCap(null)}
              className="absolute top-4 right-4 text-[#282829] hover:text-[#18235C] font-bold p-1 print:hidden cursor-pointer"
            >
              ✕
            </button>

            {/* Encabezado Institucional del Acta */}
            <div className="border-b border-[#8FA7D6] pb-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#282829]">
                <span className="font-bold text-[#18235C]">B GROUP INGENIERIA S.A.S. • NIT 900.995.99-2</span>
                <span className="font-mono">Código: {actaAsistenciaCap.codigo}</span>
              </div>
              <h3 className="text-lg font-bold font-serif text-[#18235C]">
                ACTA OFICIAL DE ASISTENCIA Y EVALUACIÓN DE CAPACITACIÓN (SG-SST)
              </h3>
              <p className="text-xs text-[#282829]">
                Evidencia formal de cumplimiento del Estándar 2.4.1 de la Resolución 0312 de 2019 y Decreto 1072 de 2015.
              </p>
            </div>

            {/* Datos de la sesión */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-[#8FA7D6]/60 text-xs">
              <div>
                <span className="text-[10px] text-[#282829] uppercase font-bold block">Tema:</span>
                <span className="font-bold text-[#18235C]">{actaAsistenciaCap.titulo}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#282829] uppercase font-bold block">Facilitador:</span>
                <span className="font-semibold text-[#18235C]">{actaAsistenciaCap.facilitador}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#282829] uppercase font-bold block">Fecha / Duración:</span>
                <span>{actaAsistenciaCap.fechaProgramada} ({actaAsistenciaCap.duracionHoras} hrs)</span>
              </div>
              <div>
                <span className="text-[10px] text-[#282829] uppercase font-bold block">Modalidad:</span>
                <span>{actaAsistenciaCap.modalidad}</span>
              </div>
            </div>

            {/* Tabla de Asistentes y Calificaciones */}
            <div className="overflow-x-auto border border-[#8FA7D6] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white text-[11px]">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Colaborador</th>
                    <th className="p-2.5">Documento</th>
                    <th className="p-2.5">Cargo</th>
                    <th className="p-2.5 text-center">Asistencia</th>
                    <th className="p-2.5 text-center">Calificación</th>
                    <th className="p-2.5 text-right">Acreditación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/40">
                  {actaAsistenciaCap.participantes.map((p, idx) => {
                    const emp = empleados.find(e => e.id === p.empleadoId);
                    const cargo = cargos.find(c => c.id === p.cargoId);
                    return (
                      <tr key={p.empleadoId} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-[#18235C]">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-[#18235C]">{emp?.nombre || 'Colaborador'}</td>
                        <td className="p-2.5 font-mono">{emp?.documento || '—'}</td>
                        <td className="p-2.5">{cargo?.nombre || '—'}</td>
                        <td className="p-2.5 text-center">
                          {p.asistenciaConfirmada ? (
                            <span className="text-emerald-700 font-bold">✓ Confirmada</span>
                          ) : (
                            <span className="text-amber-700">Pendiente</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          {p.evaluacionPresentada ? `${p.calificacionObtenida}%` : '—'}
                        </td>
                        <td className="p-2.5 text-right">
                          {p.aprobada ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              APROBADO
                            </span>
                          ) : p.evaluacionPresentada ? (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                              NO APROBÓ
                            </span>
                          ) : (
                            <span className="text-[#282829]/60 text-[10px]">Sin evaluar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Firmas Institucionales */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#8FA7D6] text-center text-xs">
              <div>
                <div className="h-10 flex items-end justify-center pb-1">
                  <span className="font-serif italic text-sm text-[#282829]">{actaAsistenciaCap.facilitador}</span>
                </div>
                <div className="border-t border-[#18235C] pt-1 font-bold text-[#18235C]">
                  Firma Facilitador / Instructor SST
                </div>
              </div>

              <div>
                <div className="h-10 flex items-end justify-center pb-1">
                  <span className="font-serif italic text-sm text-[#282829]">Responsable SG-SST</span>
                </div>
                <div className="border-t border-[#18235C] pt-1 font-bold text-[#18235C]">
                  Dirección de Gestión Humana / SG-SST
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#18235C] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>Imprimir Acta Oficial</span>
              </button>
              <button
                onClick={() => setActaAsistenciaCap(null)}
                className="px-4 py-2 border border-[#8FA7D6] text-[#282829] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
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
                  ¿Confirmas restablecer registros de capacitaciones?
                </h3>
                <p className="text-xs text-rose-700">
                  Restablecer participantes y asistencias
                </p>
              </div>
            </div>

            <p className="text-xs text-[#282829]/80 leading-relaxed">
              Esta acción restablecerá las asistencias, calificaciones y certificados asociados a todos los cursos, dejando el plan anual preparado para registrar las sesiones del personal.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setModalDepurarOpen(false)}
                disabled={depurando}
                className="px-3.5 py-2 text-xs font-bold text-[#282829] hover:bg-slate-100 rounded-lg border border-[#8FA7D6] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarDepuracionCapacitaciones}
                disabled={depurando}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {depurando ? 'Depurando...' : 'Sí, Depurar Ahora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: GESTIÓN DIRECTA DE ASISTENCIAS Y NOTAS MANUALES (ADMINISTRADOR) */}
      {gestionParticipantesCap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#8FA7D6] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#18235C] text-white text-[10px] font-bold">
                    {gestionParticipantesCap.codigo}
                  </span>
                  <span className="text-xs font-semibold text-[#282829]">
                    Gestión de Asistencia & Calificaciones en Campo
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#18235C] mt-1 font-serif">
                  {gestionParticipantesCap.titulo}
                </h3>
              </div>
              <button
                onClick={() => setGestionParticipantesCap(null)}
                className="p-1 rounded-lg text-[#282829] hover:text-[#18235C] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#282829]">
              Como Administrador o Responsable de SST, puedes registrar la asistencia presencial o validar calificaciones tomadas en formatos físicos en campo.
            </p>

            <div className="border border-[#8FA7D6] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18235C] text-white text-[11px]">
                  <tr>
                    <th className="p-2.5">Colaborador</th>
                    <th className="p-2.5">Cargo</th>
                    <th className="p-2.5 text-center">Asistencia</th>
                    <th className="p-2.5 text-center">Nota (%)</th>
                    <th className="p-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/40">
                  {gestionParticipantesCap.participantes.map(p => {
                    const emp = empleados.find(e => e.id === p.empleadoId);
                    const cargo = cargos.find(c => c.id === p.cargoId);
                    return (
                      <tr key={p.empleadoId} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <div className="font-bold text-[#18235C]">{emp?.nombre || 'Colaborador'}</div>
                          <div className="text-[10px] text-[#282829]">CC: {emp?.documento || '—'}</div>
                        </td>
                        <td className="p-2.5 text-[#282829]">{cargo?.nombre || '—'}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAsistenciaAdmin(gestionParticipantesCap.id, p.empleadoId)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              p.asistenciaConfirmada
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {p.asistenciaConfirmada ? '✓ Asistió' : '✕ Ausente'}
                          </button>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={p.calificacionObtenida ?? ''}
                              placeholder="0-100"
                              onBlur={e => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 0 && val <= 100) {
                                  handleActualizarCalificacionAdmin(gestionParticipantesCap.id, p.empleadoId, val);
                                }
                              }}
                              className="w-14 px-1.5 py-1 border border-[#8FA7D6] rounded text-center text-xs font-bold"
                            />
                            <span className="text-[10px] text-[#282829]">%</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-right">
                          {p.aprobada ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Acreditado
                            </span>
                          ) : p.evaluacionPresentada ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                              No Aprobó
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#282829]/60">Sin Calificar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#8FA7D6]">
              <button
                type="button"
                onClick={() => setGestionParticipantesCap(null)}
                className="px-4 py-2 bg-[#18235C] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#101740]"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CAPACITACIÓN EXISTENTE (ADMINISTRADOR) */}
      {capacitacionAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#8FA7D6] pb-3">
              <h3 className="text-base font-bold text-[#18235C] font-serif flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#18235C]" />
                Editar Capacitación: {capacitacionAEditar.codigo}
              </h3>
              <button
                onClick={() => setCapacitacionAEditar(null)}
                className="p-1 rounded-lg text-[#282829] hover:text-[#18235C] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleGuardarEdicionCapacitacion(capacitacionAEditar);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#18235C] mb-1">Título del Curso *</label>
                <input
                  type="text"
                  value={capacitacionAEditar.titulo}
                  onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Objetivo de Aprendizaje *</label>
                <textarea
                  rows={2}
                  value={capacitacionAEditar.objetivo}
                  onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, objetivo: e.target.value })}
                  className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Facilitador / Instructor *</label>
                  <input
                    type="text"
                    value={capacitacionAEditar.facilitador}
                    onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, facilitador: e.target.value })}
                    className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Entidad Facilitadora</label>
                  <input
                    type="text"
                    value={capacitacionAEditar.entidadFacilitadora || ''}
                    onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, entidadFacilitadora: e.target.value })}
                    className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    value={capacitacionAEditar.fechaProgramada}
                    onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, fechaProgramada: e.target.value })}
                    className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Hora y Duración (Horas)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={capacitacionAEditar.horaInicio}
                      onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, horaInicio: e.target.value })}
                      placeholder="08:00 AM"
                      className="px-3 py-2 border border-[#8FA7D6] rounded-lg"
                    />
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={capacitacionAEditar.duracionHoras}
                      onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, duracionHoras: parseInt(e.target.value) || 1 })}
                      className="px-3 py-2 border border-[#8FA7D6] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#18235C]">Tipo de Capacitación:</label>
                    <button
                      type="button"
                      onClick={() => setModalConfigTiposOpen(true)}
                      className="text-[10px] text-[#18235C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-3 h-3 text-[#18235C]" />
                      <span>Modificar Tipos</span>
                    </button>
                  </div>
                  <select
                    value={capacitacionAEditar.tipo}
                    onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    {tiposCapacitacion.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Modalidad</label>
                  <select
                    value={capacitacionAEditar.modalidad}
                    onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, modalidad: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual sincrónica">Virtual sincrónica</option>
                    <option value="Asincrónica">Asincrónica</option>
                    <option value="Mixta">Mixta</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Ubicación / Enlace de Sesión</label>
                  <input
                    type="text"
                    value={capacitacionAEditar.lugarOEnlace}
                    onChange={e => setCapacitacionAEditar({ ...capacitacionAEditar, lugarOEnlace: e.target.value })}
                    placeholder="Lugar o URL de Google Meet..."
                    className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Nota Mínima Aprobatoria (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={capacitacionAEditar.examenConocimiento?.notaMinimaAprobatoria || 80}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 80;
                      setCapacitacionAEditar({
                        ...capacitacionAEditar,
                        examenConocimiento: {
                          ...capacitacionAEditar.examenConocimiento,
                          notaMinimaAprobatoria: val
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tiempo Límite Examen (Minutos)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={capacitacionAEditar.examenConocimiento?.tiempoLimiteMinutos || 20}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 20;
                      setCapacitacionAEditar({
                        ...capacitacionAEditar,
                        examenConocimiento: {
                          ...capacitacionAEditar.examenConocimiento,
                          tiempoLimiteMinutos: val
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]">
                <button
                  type="button"
                  onClick={() => setCapacitacionAEditar(null)}
                  className="px-4 py-2 border border-[#8FA7D6] text-[#282829] rounded-lg font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAR ELIMINACIÓN DE CAPACITACIÓN */}
      {capacitacionAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  ¿Eliminar capacitación?
                </h3>
                <p className="text-xs text-rose-700 font-mono">
                  {capacitacionAEliminar.codigo} — {capacitacionAEliminar.titulo}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#282829]/80 leading-relaxed">
              Esta capacitación y todos sus registros de asistencia y certificados asociados serán eliminados del catálogo. ¿Deseas continuar?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setCapacitacionAEliminar(null)}
                disabled={eliminandoCap}
                className="px-3.5 py-2 text-xs font-bold text-[#282829] hover:bg-slate-100 rounded-lg border border-[#8FA7D6] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacion}
                disabled={eliminandoCap}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {eliminandoCap ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIGURAR TIPOS / EJES TEMÁTICOS DE CAPACITACIÓN */}
      {modalConfigTiposOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#8FA7D6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#18235C] font-serif flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#18235C]" />
                  Gestión de Tipos de Capacitación
                </h3>
                <p className="text-xs text-[#282829]">
                  Personaliza los ejes temáticos y clasificaciones del Plan Anual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalConfigTiposOpen(false);
                  setTipoEnEdicion(null);
                }}
                className="p-1 text-[#282829] hover:text-[#18235C] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario para agregar nuevo tipo */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre del nuevo tipo de capacitación..."
                value={nuevoTipoInput}
                onChange={e => setNuevoTipoInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAgregarTipo();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-[#8FA7D6] rounded-lg text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleAgregarTipo}
                className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Lista interactiva de tipos existentes con edición y eliminación */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {tiposCapacitacion.map((tipo, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-[#8FA7D6]/60 bg-slate-50 flex items-center justify-between gap-2 text-xs"
                >
                  {tipoEnEdicion?.index === idx ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={tipoEnEdicion.valor}
                        onChange={e => setTipoEnEdicion({ ...tipoEnEdicion, valor: e.target.value })}
                        className="flex-1 px-2 py-1 bg-white border border-[#18235C] rounded text-xs font-bold text-[#18235C]"
                      />
                      <button
                        type="button"
                        onClick={handleGuardarEdicionTipo}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoEnEdicion(null)}
                        className="px-2 py-1 bg-slate-200 text-[#282829] rounded text-[11px] font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#18235C]" />
                        <span className="font-bold text-[#18235C]">{tipo}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setTipoEnEdicion({ index: idx, valor: tipo })}
                          className="p-1 text-[#18235C] hover:bg-slate-200 rounded cursor-pointer"
                          title="Renombrar tipo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarTipo(tipo)}
                          className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                          title="Eliminar tipo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#8FA7D6]/40 text-xs">
              <button
                type="button"
                onClick={handleRestablecerTiposDefault}
                className="text-slate-600 hover:text-[#18235C] font-semibold underline cursor-pointer text-[11px]"
              >
                Restablecer Predeterminados
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalConfigTiposOpen(false);
                  setTipoEnEdicion(null);
                }}
                className="px-4 py-1.5 bg-[#18235C] text-white rounded-lg font-bold cursor-pointer hover:bg-[#101740]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
