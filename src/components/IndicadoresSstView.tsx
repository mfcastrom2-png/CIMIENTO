import React, { useState, useMemo, useEffect } from 'react';
import {
  IndicadorSST,
  MedicionIndicadorSST,
  AccionMejoraIndicadorSST,
  TipoIndicadorSST,
  CicloPHVAIndicador,
  PeriodicidadIndicadorSST,
  SentidoIndicadorSST,
  EstadoIndicadorSST,
  Cargo,
  AreaOrganizacion,
  ProcesoOrganizacion,
  Empleado,
  Role
} from '../types';
import {
  calcularResultadoMedicion,
  PLANTILLA_INDICADORES_NORMATIVOS_0312,
  generarAnalisisComparativo,
  AnalisisComparativoIndicador
} from '../lib/sstIndicadoresUtils';
import { useCompanySyncOptional } from '../context/SyncContext';
import {
  Target,
  BarChart3,
  Layers,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  Trash2,
  Edit3,
  Eye,
  Briefcase,
  Activity,
  X,
  Check,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileText,
  AlertOctagon,
  Sparkles,
  ClipboardList,
  Award,
  Stethoscope,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  FileSpreadsheet,
  TrendingDown
} from 'lucide-react';
import {
  getStoredIncapacidades,
  calcularAusentismoMes,
  ResumenAusentismoMes
} from '../data/incapacidadesData';

interface IndicadoresSstViewProps {
  cargos?: Cargo[];
  areas?: AreaOrganizacion[];
  procesos?: ProcesoOrganizacion[];
  empleados?: Empleado[];
  userRole?: Role;
  onNavigate?: (view: string) => void;
}

const STORAGE_KEY_INDICADORES = 'bgroup_sst_indicadores_v1';
const STORAGE_KEY_MEDICIONES = 'bgroup_sst_mediciones_v1';
const STORAGE_KEY_ACCIONES = 'bgroup_sst_acciones_v1';

export function IndicadoresSstView({
  cargos = [],
  areas = [],
  procesos = [],
  empleados = [],
  userRole = 'admin',
  onNavigate
}: IndicadoresSstViewProps) {
  const syncContext = useCompanySyncOptional();
  const empresa = syncContext?.empresa;
  const razonSocial = empresa?.razonSocial || empresa?.nombreComercial || 'Empresa';
  const nitCompleto = empresa?.nit ? `NIT ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : '';

  // Tab activo
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalogo' | 'ausentismo' | 'mediciones' | 'acciones' | 'normativa'>('dashboard');

  // Listas de datos principales
  const [indicadores, setIndicadores] = useState<IndicadorSST[]>(() => {
    let lista: IndicadorSST[] = [];
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_INDICADORES);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          lista = parsed;
        }
      }
    } catch {}

    if (lista.length === 0) {
      lista = PLANTILLA_INDICADORES_NORMATIVOS_0312.map((p, idx) => ({
        ...p,
        id: `ind_norm_${idx + 1}`
      }));
    } else {
      // Asegurar que IND-RES-04 (Ausentismo Laboral por Causa Médica) esté incluido
      const tieneAusentismo = lista.some(
        i => i.codigo === 'IND-RES-04' || i.nombre.toLowerCase().includes('ausentismo')
      );
      if (!tieneAusentismo) {
        const plantAus = PLANTILLA_INDICADORES_NORMATIVOS_0312.find(p => p.codigo === 'IND-RES-04');
        if (plantAus) {
          lista = [
            ...lista,
            {
              ...plantAus,
              id: `ind_norm_ausentismo_${Date.now()}`
            }
          ];
        }
      }
    }
    return lista;
  });

  const [mediciones, setMediciones] = useState<MedicionIndicadorSST[]>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_MEDICIONES);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [acciones, setAcciones] = useState<AccionMejoraIndicadorSST[]>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_ACCIONES);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Integración de Ausentismo con Módulo de Control de Incapacidades
  const [mesFiltroAusentismo, setMesFiltroAusentismo] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [diasLaborablesMesConfig, setDiasLaborablesMesConfig] = useState<number>(24);

  const [incapacidadesList, setIncapacidadesList] = useState(() => getStoredIncapacidades());

  useEffect(() => {
    const recargarIncap = () => setIncapacidadesList(getStoredIncapacidades());
    window.addEventListener('incapacidades_updated', recargarIncap);
    return () => window.removeEventListener('incapacidades_updated', recargarIncap);
  }, []);

  const numTrabajadoresActivos = useMemo(() => {
    return empleados.filter(e => e.activo !== false).length || 6;
  }, [empleados]);

  const indicadorAusentismoCatalogo = useMemo(() => {
    return indicadores.find(
      i => i.codigo === 'IND-RES-04' || i.nombre.toLowerCase().includes('ausentismo')
    );
  }, [indicadores]);

  const resumenAusentismoMesActual = useMemo(() => {
    return calcularAusentismoMes(
      incapacidadesList,
      mesFiltroAusentismo,
      numTrabajadoresActivos,
      diasLaborablesMesConfig
    );
  }, [incapacidadesList, mesFiltroAusentismo, numTrabajadoresActivos, diasLaborablesMesConfig]);

  const historialAusentismoReciente = useMemo(() => {
    const periodos = ['2026-01', '2026-02', '2026-03', '2026-04'];
    return periodos.map(per => {
      const res = calcularAusentismoMes(incapacidadesList, per, numTrabajadoresActivos, diasLaborablesMesConfig);
      const medOficial = mediciones.find(
        m => m.indicadorId === indicadorAusentismoCatalogo?.id && m.periodo === per
      );
      return {
        periodo: per,
        resumen: res,
        medicion: medOficial
      };
    });
  }, [incapacidadesList, numTrabajadoresActivos, diasLaborablesMesConfig, mediciones, indicadorAusentismoCatalogo]);

  // Persistencia local
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INDICADORES, JSON.stringify(indicadores));
    } catch {}
  }, [indicadores]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEDICIONES, JSON.stringify(mediciones));
    } catch {}
  }, [mediciones]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACCIONES, JSON.stringify(acciones));
    } catch {}
  }, [acciones]);

  // Auto-precargar mediciones históricas de ausentismo para 2026-02 y 2026-03 si no existen
  useEffect(() => {
    if (!indicadorAusentismoCatalogo) return;
    const tieneAlgunaMedicion = mediciones.some(m => m.indicadorId === indicadorAusentismoCatalogo.id);
    if (tieneAlgunaMedicion) return;

    const periodos = ['2026-02', '2026-03'];
    const nuevasMed: MedicionIndicadorSST[] = [];

    periodos.forEach((per, idx) => {
      const resAus = calcularAusentismoMes(incapacidadesList, per, numTrabajadoresActivos, 24);
      if (resAus.totalDiasIncapacidad > 0) {
        const calc = calcularResultadoMedicion(
          resAus.totalDiasIncapacidad,
          resAus.diasTrabajoProgramados,
          100,
          indicadorAusentismoCatalogo.meta,
          indicadorAusentismoCatalogo.limiteAmarillo,
          indicadorAusentismoCatalogo.sentido,
          indicadorAusentismoCatalogo.unidadMedida
        );

        nuevasMed.push({
          id: `med_aus_auto_${per}_${idx}`,
          indicadorId: indicadorAusentismoCatalogo.id,
          periodo: per,
          fechaMedicion: `${per}-28`,
          numeradorValor: resAus.totalDiasIncapacidad,
          denominadorValor: resAus.diasTrabajoProgramados,
          resultadoNumerico: calc.resultadoNumerico,
          resultadoFormateado: calc.resultadoFormateado,
          metaEsperada: indicadorAusentismoCatalogo.meta,
          semaforo: calc.semaforo,
          cumpleMeta: calc.cumpleMeta,
          fuenteDatos: 'Módulo de Control de Incapacidades (Validación EPS/ARL)',
          responsableMedicion: 'Responsable SG-SST / Gestión Humana',
          observaciones: `Ausentismo calculado desde Incapacidades: ${resAus.totalDiasIncapacidad} días (${resAus.diasIncapacidadComun}d común, ${resAus.diasIncapacidadLaboral}d laboral). Colaboradores: ${resAus.colaboradoresAfectados.join(', ')}.`,
          fechaRegistro: new Date().toISOString().slice(0, 10),
          usuarioRegistro: 'Sistema SG-SST Integrado'
        });
      }
    });

    if (nuevasMed.length > 0) {
      setMediciones(prev => [...nuevasMed, ...prev]);
    }
  }, [indicadorAusentismoCatalogo, incapacidadesList, numTrabajadoresActivos]);

  // Mensaje Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modales
  const [modalIndicadorOpen, setModalIndicadorOpen] = useState(false);
  const [indicadorEnEdicionId, setIndicadorEnEdicionId] = useState<string | null>(null);
  const [modalMedicionOpen, setModalMedicionOpen] = useState(false);
  const [modalAccionOpen, setModalAccionOpen] = useState(false);
  const [modalFichaCompletaOpen, setModalFichaCompletaOpen] = useState(false);
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState<IndicadorSST | null>(null);
  const [modalAnalisisHistoricoOpen, setModalAnalisisHistoricoOpen] = useState(false);
  const [indicadorParaAnalisis, setIndicadorParaAnalisis] = useState<IndicadorSST | null>(null);
  const [modalVerificarAccionOpen, setModalVerificarAccionOpen] = useState(false);
  const [accionParaVerificar, setAccionParaVerificar] = useState<AccionMejoraIndicadorSST | null>(null);

  // Estados de Registro de Causa en Análisis
  const [analisisCausaManual, setAnalisisCausaManual] = useState('');
  const [analisisSituacionManual, setAnalisisSituacionManual] = useState('');
  const [analisisRiesgoAsociado, setAnalisisRiesgoAsociado] = useState('');
  const [analisisDecisionTomada, setAnalisisDecisionTomada] = useState('');

  // Estados de Verificación de Acción
  const [verifFecha, setVerifFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [verifResponsable, setVerifResponsable] = useState('Responsable SG-SST / COPASST');
  const [verifResultado, setVerifResultado] = useState('');
  const [verifEsEficaz, setVerifEsEficaz] = useState(true);
  const [verifAvance, setVerifAvance] = useState<number>(100);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroCiclo, setFiltroCiclo] = useState<string>('TODOS');
  const [filtroProceso, setFiltroProceso] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Procesos, Áreas y Cargos reales deduplicados
  const procesosDisponibles = useMemo(() => {
    const set = new Set<string>();
    (procesos || []).forEach(p => { if (p?.nombre?.trim()) set.add(p.nombre.trim()); });
    (areas || []).forEach(a => { if (a?.procesoNombre?.trim()) set.add(a.procesoNombre.trim()); });
    return Array.from(set);
  }, [procesos, areas]);

  const areasDisponibles = useMemo(() => {
    const seen = new Set<string>();
    return (areas || []).filter(a => {
      if (!a || !a.nombre?.trim() || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }, [areas]);

  const cargosDisponibles = useMemo(() => {
    const seenNom = new Set<string>();
    return (cargos || []).filter(c => {
      if (!c || !c.nombre?.trim()) return false;
      const key = c.nombre.trim().toLowerCase();
      if (seenNom.has(key)) return false;
      seenNom.add(key);
      return true;
    });
  }, [cargos]);

  // Form State: Indicador
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formTipo, setFormTipo] = useState<TipoIndicadorSST>('Proceso');
  const [formCiclo, setFormCiclo] = useState<CicloPHVAIndicador>('Hacer');
  const [formProcesoRel, setFormProcesoRel] = useState('');
  const [formAreaId, setFormAreaId] = useState('');
  const [formEstandar, setFormEstandar] = useState('2.1.1');
  const [formNorma, setFormNorma] = useState('Resolución 0312 de 2019 Art. 30');
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formInterpretacion, setFormInterpretacion] = useState('');
  const [formUnidad, setFormUnidad] = useState<'%' | 'Tasa' | 'Días' | 'Número' | 'COP'>('%');
  const [formSentido, setFormSentido] = useState<SentidoIndicadorSST>('Mayor es mejor');
  const [formFormula, setFormFormula] = useState('');
  const [formVarNum, setFormVarNum] = useState('');
  const [formVarDen, setFormVarDen] = useState('');
  const [formFactor, setFormFactor] = useState<number>(100);
  const [formMeta, setFormMeta] = useState<number>(85);
  const [formLimiteAmarillo, setFormLimiteAmarillo] = useState<number>(70);
  const [formPeriodicidad, setFormPeriodicidad] = useState<PeriodicidadIndicadorSST>('Mensual');
  const [formRespMed, setFormRespMed] = useState('Responsable SG-SST');
  const [formRespAna, setFormRespAna] = useState('COPASST');

  // Form State: Medición
  const [medIndicadorId, setMedIndicadorId] = useState('');
  const [medPeriodo, setMedPeriodo] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [medFecha, setMedFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [medNum, setMedNum] = useState<number | ''>('');
  const [medDen, setMedDen] = useState<number | ''>('');
  const [medFuente, setMedFuente] = useState('');
  const [medResp, setMedResp] = useState('Responsable SG-SST');
  const [medObs, setMedObs] = useState('');

  // Form State: Acción de Mejora
  const [accIndicadorId, setAccIndicadorId] = useState('');
  const [accPeriodo, setAccPeriodo] = useState('');
  const [accTipo, setAccTipo] = useState<'Correctiva' | 'Preventiva' | 'Mejora' | 'Corrección Inmediata'>('Correctiva');
  const [accHallazgo, setAccHallazgo] = useState('');
  const [accCausa, setAccCausa] = useState('');
  const [accPropuesta, setAccPropuesta] = useState('');
  const [accResp, setAccResp] = useState('');
  const [accFechaFin, setAccFechaFin] = useState('');
  const [accPrioridad, setAccPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');

  // Métricas Consolidadas del Dashboard
  const metricas = useMemo(() => {
    const total = indicadores.length;
    const activos = indicadores.filter(i => i.estado === 'Activo').length;
    
    // Obtener la última medición de cada indicador
    let verdes = 0;
    let amarillos = 0;
    let rojos = 0;
    let noCalculables = 0;
    let pendientesMedicion = 0;

    indicadores.forEach(ind => {
      const medList = mediciones.filter(m => m.indicadorId === ind.id);
      if (medList.length === 0) {
        pendientesMedicion++;
      } else {
        const ult = medList[medList.length - 1];
        if (ult.semaforo === 'VERDE') verdes++;
        else if (ult.semaforo === 'AMARILLO') amarillos++;
        else if (ult.semaforo === 'ROJO') rojos++;
        else noCalculables++;
      }
    });

    const accAbiertas = acciones.filter(a => a.estado === 'Pendiente' || a.estado === 'En ejecución').length;
    const accPendVerif = acciones.filter(a => a.estado === 'Pendiente de verificación').length;
    const accEficaces = acciones.filter(a => a.estado === 'Cerrada Eficaz').length;
    const accNoEficaces = acciones.filter(a => a.estado === 'Cerrada No Eficaz').length;

    return {
      total,
      activos,
      verdes,
      amarillos,
      rojos,
      noCalculables,
      pendientesMedicion,
      accAbiertas,
      accPendVerif,
      accEficaces,
      accNoEficaces
    };
  }, [indicadores, mediciones, acciones]);

  // Cargar plantilla sugerida
  const handleCargarPlantillaSugerida = () => {
    const codigosExistentes = new Set(indicadores.map(i => i.codigo));
    const nuevos: IndicadorSST[] = PLANTILLA_INDICADORES_NORMATIVOS_0312
      .filter(p => !codigosExistentes.has(p.codigo))
      .map((p, idx) => ({
        ...p,
        id: `ind_norm_${Date.now()}_${idx}`,
        procesoRelacionado: procesosDisponibles[0] || p.procesoRelacionado
      }));

    if (nuevos.length === 0) {
      showToast('Los 10 indicadores normativos de la Res. 0312 ya se encuentran en el catálogo.');
      return;
    }

    setIndicadores(prev => [...nuevos, ...prev]);
    showToast(`Se cargaron exitosamente ${nuevos.length} indicadores normativos de la Resolución 0312.`);
    setActiveTab('catalogo');
  };

  // Abrir modal de creación de indicador
  const handleAbrirCrearIndicador = () => {
    setIndicadorEnEdicionId(null);
    setFormCodigo(`IND-${String(indicadores.length + 1).padStart(2, '0')}`);
    setFormNombre('');
    setFormDescripcion('');
    setFormTipo('Proceso');
    setFormCiclo('Hacer');
    setFormProcesoRel(procesosDisponibles[0] || 'Gestión Humana y SG-SST');
    setFormAreaId(areasDisponibles[0]?.id || '');
    setFormEstandar('2.1.1');
    setFormNorma('Resolución 0312 de 2019 Art. 30');
    setFormObjetivo('');
    setFormInterpretacion('');
    setFormUnidad('%');
    setFormSentido('Mayor es mejor');
    setFormFormula('(A / B) * 100');
    setFormVarNum('Actividades ejecutadas');
    setFormVarDen('Actividades programadas');
    setFormFactor(100);
    setFormMeta(85);
    setFormLimiteAmarillo(70);
    setFormPeriodicidad('Mensual');
    setFormRespMed('Responsable SG-SST');
    setFormRespAna('COPASST');
    setModalIndicadorOpen(true);
  };

  // Guardar Indicador
  const handleGuardarIndicador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      showToast('Por favor ingrese el nombre del indicador.');
      return;
    }

    const areaSel = areasDisponibles.find(a => a.id === formAreaId);

    const indGuardado: IndicadorSST = {
      id: indicadorEnEdicionId || `ind_${Date.now()}`,
      codigo: formCodigo.trim(),
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim(),
      tipo: formTipo,
      cicloPHVA: formCiclo,
      procesoRelacionado: formProcesoRel.trim(),
      areaId: formAreaId || undefined,
      areaNombre: areaSel?.nombre || undefined,
      estandar0312Relacionado: formEstandar.trim(),
      referenciaNormativa: formNorma.trim(),
      objetivoMedicion: formObjetivo.trim(),
      interpretacion: formInterpretacion.trim(),
      unidadMedida: formUnidad,
      sentido: formSentido,
      formulaTexto: formFormula.trim(),
      nombreVariableNumerador: formVarNum.trim(),
      nombreVariableDenominador: formVarDen.trim(),
      factorMultiplicador: Number(formFactor) || 100,
      meta: Number(formMeta),
      limiteAmarillo: Number(formLimiteAmarillo),
      periodicidad: formPeriodicidad,
      responsableMedicionCargo: formRespMed.trim(),
      responsableAnalisisCargo: formRespAna.trim(),
      estado: 'Activo',
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };

    if (indicadorEnEdicionId) {
      setIndicadores(prev => prev.map(i => i.id === indicadorEnEdicionId ? indGuardado : i));
      showToast('Ficha técnica del indicador actualizada.');
    } else {
      setIndicadores(prev => [indGuardado, ...prev]);
      showToast('Nuevo indicador registrado en el catálogo.');
    }

    setModalIndicadorOpen(false);
  };

  // Abrir Modal de Registro de Medición
  const handleAbrirRegistrarMedicion = (indId?: string) => {
    const idToUse = indId || indicadores[0]?.id || '';
    const ind = indicadores.find(i => i.id === idToUse);
    const per = new Date().toISOString().slice(0, 7);
    setMedIndicadorId(idToUse);
    setMedPeriodo(per);
    setMedFecha(new Date().toISOString().slice(0, 10));

    const esAus = ind && (ind.codigo === 'IND-RES-04' || ind.nombre.toLowerCase().includes('ausentismo'));
    if (esAus) {
      const resAus = calcularAusentismoMes(incapacidadesList, per, numTrabajadoresActivos, 24);
      setMedNum(resAus.totalDiasIncapacidad);
      setMedDen(resAus.diasTrabajoProgramados);
      setMedFuente('Módulo de Control de Incapacidades (Validación EPS/ARL)');
      setMedResp('Responsable SG-SST / Gestión Humana');
      setMedObs(
        `Ausentismo médico Res. 0312: ${resAus.totalDiasIncapacidad} días (${resAus.diasIncapacidadComun}d común, ${resAus.diasIncapacidadLaboral}d laboral) sobre ${resAus.diasTrabajoProgramados} días programados. Colaboradores: ${resAus.colaboradoresAfectados.join(', ') || 'Sin ausencias'}.`
      );
    } else {
      setMedNum('');
      setMedDen('');
      setMedFuente('Plan de Trabajo / Matriz de Registros SST');
      setMedResp('Responsable SG-SST');
      setMedObs('');
    }
    setModalMedicionOpen(true);
  };

  // Sincronizar o registrar medición oficial de ausentismo médico para el período
  const handleSincronizarMedicionAusentismo = (periodoTarget?: string) => {
    const per = periodoTarget || mesFiltroAusentismo;
    if (!indicadorAusentismoCatalogo) {
      showToast('No se encontró el indicador de Ausentismo en el catálogo.');
      return;
    }

    const resAus = calcularAusentismoMes(incapacidadesList, per, numTrabajadoresActivos, diasLaborablesMesConfig);
    const calc = calcularResultadoMedicion(
      resAus.totalDiasIncapacidad,
      resAus.diasTrabajoProgramados,
      100,
      indicadorAusentismoCatalogo.meta,
      indicadorAusentismoCatalogo.limiteAmarillo,
      indicadorAusentismoCatalogo.sentido,
      indicadorAusentismoCatalogo.unidadMedida
    );

    const medExistente = mediciones.find(
      m => m.indicadorId === indicadorAusentismoCatalogo.id && m.periodo === per
    );

    if (medExistente) {
      setMediciones(prev => prev.map(m => m.id === medExistente.id ? {
        ...m,
        fechaMedicion: new Date().toISOString().slice(0, 10),
        numeradorValor: resAus.totalDiasIncapacidad,
        denominadorValor: resAus.diasTrabajoProgramados,
        resultadoNumerico: calc.resultadoNumerico,
        resultadoFormateado: calc.resultadoFormateado,
        metaEsperada: indicadorAusentismoCatalogo.meta,
        semaforo: calc.semaforo,
        cumpleMeta: calc.cumpleMeta,
        fuenteDatos: 'Módulo de Control de Incapacidades (Validación EPS/ARL)',
        responsableMedicion: 'Responsable SG-SST / Gestión Humana',
        observaciones: `Ausentismo calculado desde Incapacidades: ${resAus.totalDiasIncapacidad} días (${resAus.diasIncapacidadComun}d común, ${resAus.diasIncapacidadLaboral}d laboral). Colaboradores: ${resAus.colaboradoresAfectados.join(', ') || 'Sin ausentismo'}.`
      } : m));
      showToast(`Medición de Ausentismo del período ${per} actualizada (${calc.resultadoFormateado}).`);
    } else {
      const nueva: MedicionIndicadorSST = {
        id: `med_aus_${per}_${Date.now()}`,
        indicadorId: indicadorAusentismoCatalogo.id,
        periodo: per,
        fechaMedicion: new Date().toISOString().slice(0, 10),
        numeradorValor: resAus.totalDiasIncapacidad,
        denominadorValor: resAus.diasTrabajoProgramados,
        resultadoNumerico: calc.resultadoNumerico,
        resultadoFormateado: calc.resultadoFormateado,
        metaEsperada: indicadorAusentismoCatalogo.meta,
        semaforo: calc.semaforo,
        cumpleMeta: calc.cumpleMeta,
        fuenteDatos: 'Módulo de Control de Incapacidades (Validación EPS/ARL)',
        responsableMedicion: 'Responsable SG-SST / Gestión Humana',
        observaciones: `Ausentismo calculado desde Incapacidades: ${resAus.totalDiasIncapacidad} días (${resAus.diasIncapacidadComun}d común, ${resAus.diasIncapacidadLaboral}d laboral). Colaboradores: ${resAus.colaboradoresAfectados.join(', ') || 'Sin ausentismo'}.`,
        fechaRegistro: new Date().toISOString().slice(0, 10),
        usuarioRegistro: 'Sistema SG-SST Integrado'
      };
      setMediciones(prev => [nueva, ...prev]);
      showToast(`Medición de Ausentismo del período ${per} registrada exitosamente (${calc.resultadoFormateado}).`);
    }
  };

  const handleCrearAccionParaAusentismo = () => {
    if (!indicadorAusentismoCatalogo) return;
    setAccIndicadorId(indicadorAusentismoCatalogo.id);
    setAccPeriodo(mesFiltroAusentismo);
    setAccTipo('Correctiva');
    setAccPrioridad('Alta');
    setAccHallazgo(
      `Para el período ${mesFiltroAusentismo}, se presentaron ${resumenAusentismoMesActual.totalDiasIncapacidad} días de incapacidad médica (${resumenAusentismoMesActual.diasIncapacidadComun}d común, ${resumenAusentismoMesActual.diasIncapacidadLaboral}d laboral) sobre ${resumenAusentismoMesActual.diasTrabajoProgramados} días programados, generando una tasa de ausentismo del ${resumenAusentismoMesActual.tasaAusentismoPct}%. Diagnósticos: ${resumenAusentismoMesActual.eventosDetalle.map(e => e.diagnostico).join('; ') || 'N/A'}.`
    );
    setAccCausa(
      resumenAusentismoMesActual.diasIncapacidadLaboral > 0
        ? 'Ocurrencia de contingencias de origen laboral (AT/EL) que requirieron reposo médico. Revisar controles operacionales y condiciones ergonómicas.'
        : 'Contingencias osteomusculares / respiratorias de origen común con tiempos de recuperación prolongados.'
    );
    setAccPropuesta(
      '1. Seguimiento médico laboral y reintegro con recomendaciones.\n2. Fortalecimiento de pausas activas e inspección ergonómica de puestos de trabajo.\n3. Coordinación con EPS/ARL para soporte preventivo.'
    );
    setAccResp('Responsable SG-SST / Gestión Humana');
    const dCompromiso = new Date();
    dCompromiso.setDate(dCompromiso.getDate() + 30);
    setAccFechaFin(dCompromiso.toISOString().slice(0, 10));
    setModalAccionOpen(true);
  };

  // Cálculo en vivo para modal de medición
  const calculoMedicionEnVivo = useMemo(() => {
    const ind = indicadores.find(i => i.id === medIndicadorId);
    if (!ind) return null;
    const num = medNum === '' ? null : Number(medNum);
    const den = medDen === '' ? null : Number(medDen);
    return calcularResultadoMedicion(
      num,
      den,
      ind.factorMultiplicador,
      ind.meta,
      ind.limiteAmarillo,
      ind.sentido,
      ind.unidadMedida,
      ind.rangoMin,
      ind.rangoMax,
      ind.formulaTexto
    );
  }, [medIndicadorId, medNum, medDen, indicadores]);

  const esIndicadorAusentismoEnModal = useMemo(() => {
    const ind = indicadores.find(i => i.id === medIndicadorId);
    return !!ind && (ind.codigo === 'IND-RES-04' || ind.nombre.toLowerCase().includes('ausentismo'));
  }, [indicadores, medIndicadorId]);

  const datosAusentismoPeriodoEnModal = useMemo(() => {
    if (!esIndicadorAusentismoEnModal) return null;
    return calcularAusentismoMes(incapacidadesList, medPeriodo, numTrabajadoresActivos, 24);
  }, [esIndicadorAusentismoEnModal, incapacidadesList, medPeriodo, numTrabajadoresActivos]);

  // Guardar Medición
  const handleGuardarMedicion = (e: React.FormEvent) => {
    e.preventDefault();
    const ind = indicadores.find(i => i.id === medIndicadorId);
    if (!ind || !calculoMedicionEnVivo) {
      showToast('Seleccione un indicador válido.');
      return;
    }

    const medExistente = mediciones.find(m => m.indicadorId === ind.id && m.periodo === medPeriodo);
    if (medExistente) {
      setMediciones(prev => prev.map(m => m.id === medExistente.id ? {
        ...m,
        fechaMedicion: medFecha,
        numeradorValor: medNum === '' ? undefined : Number(medNum),
        denominadorValor: medDen === '' ? undefined : Number(medDen),
        resultadoNumerico: calculoMedicionEnVivo.resultadoNumerico,
        resultadoFormateado: calculoMedicionEnVivo.resultadoFormateado,
        metaEsperada: ind.meta,
        semaforo: calculoMedicionEnVivo.semaforo,
        cumpleMeta: calculoMedicionEnVivo.cumpleMeta,
        fuenteDatos: medFuente.trim() || 'Registros del SG-SST',
        responsableMedicion: medResp.trim() || 'Responsable SG-SST',
        observaciones: medObs.trim()
      } : m));
      setModalMedicionOpen(false);
      showToast(`Medición del período ${medPeriodo} actualizada (${calculoMedicionEnVivo.resultadoFormateado}).`);
      return;
    }

    const nuevaMed: MedicionIndicadorSST = {
      id: `med_${Date.now()}`,
      indicadorId: ind.id,
      periodo: medPeriodo,
      fechaMedicion: medFecha,
      numeradorValor: medNum === '' ? undefined : Number(medNum),
      denominadorValor: medDen === '' ? undefined : Number(medDen),
      resultadoNumerico: calculoMedicionEnVivo.resultadoNumerico,
      resultadoFormateado: calculoMedicionEnVivo.resultadoFormateado,
      metaEsperada: ind.meta,
      semaforo: calculoMedicionEnVivo.semaforo,
      cumpleMeta: calculoMedicionEnVivo.cumpleMeta,
      fuenteDatos: medFuente.trim() || 'Registros del SG-SST',
      responsableMedicion: medResp.trim() || 'Responsable SG-SST',
      observaciones: medObs.trim(),
      fechaRegistro: new Date().toISOString().slice(0, 10),
      usuarioRegistro: 'Administrador SST'
    };

    setMediciones(prev => [nuevaMed, ...prev]);
    setModalMedicionOpen(false);
    showToast(`Medición del período ${medPeriodo} asentada (${nuevaMed.resultadoFormateado}).`);

    // Si está en alerta o crítico, sugerir acción
    if (calculoMedicionEnVivo.semaforo === 'ROJO' || calculoMedicionEnVivo.semaforo === 'AMARILLO') {
      showToast(`Medición registrada con desviación (${calculoMedicionEnVivo.semaforo}).`);
    }
  };

  // Eliminación o paso a Histórico según exigencia de trazabilidad Res. 0312
  const handleEliminarOArchivarIndicador = (ind: IndicadorSST) => {
    const tieneMediciones = mediciones.some(m => m.indicadorId === ind.id);
    if (tieneMediciones) {
      setIndicadores(prev => prev.map(i => i.id === ind.id ? { ...i, estado: 'Histórico' } : i));
      showToast(`Indicador ${ind.codigo} tiene mediciones registradas. Se cambió a estado Histórico.`);
    } else {
      setIndicadores(prev => prev.filter(i => i.id !== ind.id));
      showToast(`Indicador ${ind.codigo} eliminado.`);
    }
  };

  // Alternar estado Activo / Inactivo
  const handleToggleEstadoIndicador = (ind: IndicadorSST) => {
    const nuevoEstado: EstadoIndicadorSST = ind.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setIndicadores(prev => prev.map(i => i.id === ind.id ? { ...i, estado: nuevoEstado } : i));
    showToast(`Indicador ${ind.codigo} ahora está ${nuevoEstado}.`);
  };

  // Eliminar medición
  const handleEliminarMedicion = (medId: string) => {
    setMediciones(prev => prev.filter(m => m.id !== medId));
    showToast('Medición eliminada del registro histórico.');
  };

  // Abrir Análisis Histórico
  const handleAbrirAnalisisHistorico = (ind: IndicadorSST) => {
    setIndicadorParaAnalisis(ind);
    setAnalisisCausaManual('');
    setAnalisisSituacionManual('');
    setAnalisisRiesgoAsociado('');
    setAnalisisDecisionTomada('');
    setModalAnalisisHistoricoOpen(true);
  };

  // Abrir Verificación de Acción
  const handleAbrirVerificacionAccion = (acc: AccionMejoraIndicadorSST) => {
    setAccionParaVerificar(acc);
    setVerifFecha(new Date().toISOString().slice(0, 10));
    setVerifResponsable('Responsable SG-SST / COPASST');
    setVerifResultado(acc.resultadoVerificacion || '');
    setVerifEsEficaz(acc.esEficaz ?? true);
    setVerifAvance(acc.porcentajeAvance || 100);
    setModalVerificarAccionOpen(true);
  };

  // Guardar Verificación de Acción
  const handleGuardarVerificacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accionParaVerificar) return;
    if (!verifResultado.trim()) {
      showToast('Ingrese las conclusiones de la verificación de eficacia.');
      return;
    }

    const nuevoEstado = verifEsEficaz ? 'Cerrada Eficaz' : 'Cerrada No Eficaz';

    setAcciones(prev => prev.map(a => a.id === accionParaVerificar.id ? {
      ...a,
      estado: nuevoEstado,
      porcentajeAvance: verifAvance,
      fechaVerificacion: verifFecha,
      responsableVerificacion: verifResponsable.trim(),
      resultadoVerificacion: verifResultado.trim(),
      esEficaz: verifEsEficaz,
      justificacionEficacia: verifResultado.trim()
    } : a));

    setModalVerificarAccionOpen(false);
    showToast(`Acción dictaminada como "${nuevoEstado}".`);
  };

  // Reabrir Acción No Eficaz
  const handleReabrirAccion = (acc: AccionMejoraIndicadorSST) => {
    setAcciones(prev => prev.map(a => a.id === acc.id ? {
      ...a,
      estado: 'En ejecución',
      esEficaz: undefined,
      porcentajeAvance: Math.min(a.porcentajeAvance, 70)
    } : a));
    showToast('Acción reabierta y en ejecución para replanificación.');
  };

  // Generar nueva acción vinculada desde no eficaz
  const handleGenerarNuevaAccionDesdeNoEficaz = (acc: AccionMejoraIndicadorSST) => {
    setAccIndicadorId(acc.indicadorId);
    setAccPeriodo(new Date().toISOString().slice(0, 7));
    setAccHallazgo(`Replanificación de acción previa no eficaz: ${acc.hallazgoDesviacion}`);
    setAccCausa(`Causa recurrente tras verificación: ${acc.resultadoVerificacion || acc.causaRaiz}`);
    setAccPropuesta('');
    setAccResp(acc.responsableNombre);
    setAccFechaFin(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setAccPrioridad('Alta');
    setModalAccionOpen(true);
  };

  // Guardar Acción
  const handleGuardarAccion = (e: React.FormEvent) => {
    e.preventDefault();
    const ind = indicadores.find(i => i.id === accIndicadorId);
    if (!accHallazgo.trim() || !accPropuesta.trim()) {
      showToast('Diligencie la descripción del hallazgo y la acción propuesta.');
      return;
    }

    const nuevaAcc: AccionMejoraIndicadorSST = {
      id: `acc_${Date.now()}`,
      indicadorId: accIndicadorId,
      indicadorNombre: ind?.nombre || 'Indicador SG-SST',
      periodoOrigen: accPeriodo || new Date().toISOString().slice(0, 7),
      tipoAccion: accTipo,
      hallazgoDesviacion: accHallazgo.trim(),
      causaRaiz: accCausa.trim() || 'Causa por determinar en análisis con COPASST',
      accionPropuesta: accPropuesta.trim(),
      responsableNombre: accResp.trim() || 'Responsable SG-SST',
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaLimite: accFechaFin || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      prioridad: accPrioridad,
      estado: 'Pendiente',
      porcentajeAvance: 0
    };

    setAcciones(prev => [nuevaAcc, ...prev]);
    setModalAccionOpen(false);
    showToast('Acción de mejora registrada en el ciclo Actuar.');
  };

  // Filtrado de Indicadores
  const indicadoresFiltrados = useMemo(() => {
    return indicadores.filter(ind => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const mCod = ind.codigo.toLowerCase().includes(q);
        const mNom = ind.nombre.toLowerCase().includes(q);
        const mProc = ind.procesoRelacionado.toLowerCase().includes(q);
        if (!mCod && !mNom && !mProc) return false;
      }
      if (filtroTipo !== 'TODOS' && ind.tipo !== filtroTipo) return false;
      if (filtroCiclo !== 'TODOS' && ind.cicloPHVA !== filtroCiclo) return false;
      if (filtroProceso !== 'TODOS' && ind.procesoRelacionado !== filtroProceso) return false;
      if (filtroEstado !== 'TODOS' && ind.estado !== filtroEstado) return false;
      return true;
    });
  }, [indicadores, busqueda, filtroTipo, filtroCiclo, filtroProceso, filtroEstado]);

  // Exportar a CSV
  const handleExportarCSV = () => {
    const headers = [
      'Código',
      'Nombre',
      'Tipo',
      'Ciclo PHVA',
      'Proceso',
      'Fórmula',
      'Meta',
      'Sentido',
      'Periodicidad',
      'Última Medición',
      'Semáforo',
      'Estado'
    ];
    const rows = indicadores.map(i => {
      const medList = mediciones.filter(m => m.indicadorId === i.id);
      const ult = medList[medList.length - 1];
      return [
        `"${i.codigo}"`,
        `"${i.nombre.replace(/"/g, '""')}"`,
        `"${i.tipo}"`,
        `"${i.cicloPHVA}"`,
        `"${i.procesoRelacionado.replace(/"/g, '""')}"`,
        `"${i.formulaTexto.replace(/"/g, '""')}"`,
        `"${i.meta}${i.unidadMedida}"`,
        `"${i.sentido}"`,
        `"${i.periodicidad}"`,
        `"${ult ? ult.resultadoFormateado : 'Sin medición'}"`,
        `"${ult ? ult.semaforo : 'PENDIENTE'}"`,
        `"${i.estado}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Indicadores_SGSST_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Institucional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#18235C] text-white flex items-center justify-center shadow-xs">
            <Target className="w-6 h-6 text-[#00FF00]" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif text-[#18235C]">
              Gestión, Medición y Seguimiento de Indicadores SG-SST
            </h2>
            <p className="text-xs text-slate-600">
              Conforme a la Resolución 0312 de 2019 (Arts. 30-32) y Decreto 1072 de 2015 • Estructura, Proceso y Resultado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCargarPlantillaSugerida}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cargar los 10 indicadores normativos estándar según Resolución 0312 de 2019"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cargar Indicadores Normativos</span>
          </button>

          <button
            type="button"
            onClick={handleExportarCSV}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exportar matriz completa a archivo CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleAbrirRegistrarMedicion()}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-700" />
            <span>Registrar Medición</span>
          </button>

          <button
            type="button"
            onClick={handleAbrirCrearIndicador}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#00FF00]" />
            <span>Nuevo Indicador</span>
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-[#8FA7D6] gap-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-[#18235C] text-[#18235C] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard Ejecutivo & KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogo')}
          className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'catalogo'
              ? 'border-[#18235C] text-[#18235C] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Catálogo & Fichas Técnicas ({indicadores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ausentismo')}
          className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ausentismo'
              ? 'border-[#18235C] text-[#18235C] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-blue-600" />
          <span>Ausentismo por Causa Médica</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0)
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.limiteAmarillo || 3.5)
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}>
            {resumenAusentismoMesActual.tasaAusentismoPct}%
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mediciones')}
          className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'mediciones'
              ? 'border-[#18235C] text-[#18235C] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Registro de Mediciones ({mediciones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('acciones')}
          className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'acciones'
              ? 'border-[#18235C] text-[#18235C] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Acciones de Mejora PHVA ({acciones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('normativa')}
          className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'normativa'
              ? 'border-[#18235C] text-[#18235C] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Biblioteca Normativa</span>
        </button>
      </div>

      {/* PESTAÑA 1: DASHBOARD EJECUTIVO */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards de Semáforo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-[#8FA7D6] shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Indicadores</div>
              <div className="text-xl font-bold font-serif text-[#18235C] mt-1">{metricas.total}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{metricas.activos} activos</div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">Cumplen Meta</div>
              <div className="text-xl font-bold font-serif text-emerald-700 mt-1">{metricas.verdes}</div>
              <div className="text-[10px] text-emerald-800 mt-0.5">Semáforo Verde</div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">En Alerta</div>
              <div className="text-xl font-bold font-serif text-amber-700 mt-1">{metricas.amarillos}</div>
              <div className="text-[10px] text-amber-800 mt-0.5">Semáforo Amarillo</div>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-rose-900 tracking-wider">No Cumplen</div>
              <div className="text-xl font-bold font-serif text-rose-700 mt-1">{metricas.rojos}</div>
              <div className="text-[10px] text-rose-800 mt-0.5">Semáforo Rojo</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">Pendientes</div>
              <div className="text-xl font-bold font-serif text-slate-800 mt-1">{metricas.pendientesMedicion}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Sin medición en período</div>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-300 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">Acciones Abiertas</div>
              <div className="text-xl font-bold font-serif text-blue-700 mt-1">{metricas.accAbiertas}</div>
              <div className="text-[10px] text-blue-800 mt-0.5">{metricas.accEficaces} eficaces cerradas</div>
            </div>
          </div>

          {/* Banner si el catálogo está vacío */}
          {indicadores.length === 0 && (
            <div className="p-8 bg-blue-50/60 border border-blue-200 rounded-2xl text-center space-y-3">
              <Target className="w-10 h-10 text-blue-700 mx-auto" />
              <h3 className="font-bold text-base text-[#18235C]">No hay indicadores registrados actualmente</h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                Puede registrar indicadores institucionales personalizados vinculados a su estructura o cargar la plantilla con los 10 indicadores mínimos de la Resolución 0312 de 2019.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCargarPlantillaSugerida}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-blue-300 text-blue-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                  Cargar Indicadores Normativos (Res. 0312)
                </button>
                <button
                  type="button"
                  onClick={handleAbrirCrearIndicador}
                  className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1 text-[#00FF00]" />
                  Crear Indicador desde Cero
                </button>
              </div>
            </div>
          )}

          {/* Alertas Críticas */}
          {metricas.rojos > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-rose-900">
                    Atención: Hay {metricas.rojos} indicadores en Semáforo Rojo
                  </h4>
                  <p className="text-[11px] text-rose-800">
                    Se requiere formular acciones correctivas inmediatas con análisis de causas para no comprometer el cumplimiento normativo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('catalogo');
                  setFiltroTipo('TODOS');
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
              >
                Revisar Desviaciones
              </button>
            </div>
          )}

          {/* WIDGET DESTACADO: INDICADOR DE AUSENTISMO LABORAL POR CAUSA MÉDICA (RES. 0312 / IND-RES-04) */}
          <div className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/40 rounded-2xl border-2 border-indigo-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#18235C] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Stethoscope className="w-5 h-5 text-[#8FA7D6]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-[#18235C]">
                      Indicador de Ausentismo por Causa Médica
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#18235C] text-white">
                      IND-RES-04
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                      Res. 0312 Estándar 6.1.1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Calculado automáticamente en tiempo real a partir del Módulo de Control de Incapacidades
                  </p>
                </div>
              </div>

              {/* Selector de Período Rápido */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">Período:</span>
                <input
                  type="month"
                  value={mesFiltroAusentismo}
                  onChange={e => e.target.value && setMesFiltroAusentismo(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-[#8FA7D6] rounded-lg text-xs font-bold text-[#18235C] shadow-2xs"
                />
              </div>
            </div>

            {/* 4 Métricas del widget */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3.5 rounded-xl border shadow-2xs ${
                resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0)
                  ? 'bg-emerald-50/80 border-emerald-300'
                  : resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.limiteAmarillo || 3.5)
                  ? 'bg-amber-50/80 border-amber-300'
                  : 'bg-rose-50/80 border-rose-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Tasa Ausentismo</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0)
                      ? 'bg-emerald-600 text-white'
                      : resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.limiteAmarillo || 3.5)
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0) ? 'Cumple' : 'Alerta'}
                  </span>
                </div>
                <div className="text-2xl font-black font-serif text-[#18235C] mt-1">
                  {resumenAusentismoMesActual.tasaAusentismoPct}%
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Meta oficial: ≤ {indicadorAusentismoCatalogo?.meta || 2.0}%
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Días Incapacidad</span>
                <div className="text-2xl font-black font-serif text-[#18235C] mt-1">
                  {resumenAusentismoMesActual.totalDiasIncapacidad} <span className="text-xs font-normal text-slate-500">días</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mt-0.5">
                  <span className="text-blue-700 font-semibold">{resumenAusentismoMesActual.diasIncapacidadComun}d común</span>
                  <span>•</span>
                  <span className="text-amber-700 font-semibold">{resumenAusentismoMesActual.diasIncapacidadLaboral}d laboral</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Días Programados</span>
                <div className="text-2xl font-black font-serif text-slate-800 mt-1">
                  {resumenAusentismoMesActual.diasTrabajoProgramados} <span className="text-xs font-normal text-slate-500">días-h</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {resumenAusentismoMesActual.trabajadoresCensados} trab. × {resumenAusentismoMesActual.diasLaborablesMes} días lab.
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Colaboradores Afectados</span>
                <div className="text-2xl font-black font-serif text-slate-800 mt-1">
                  {resumenAusentismoMesActual.colaboradoresAfectados.length} <span className="text-xs font-normal text-slate-500">personas</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5 truncate" title={resumenAusentismoMesActual.colaboradoresAfectados.join(', ') || 'Sin ausencias'}>
                  {resumenAusentismoMesActual.colaboradoresAfectados.length > 0
                    ? resumenAusentismoMesActual.colaboradoresAfectados.slice(0, 2).join(', ') + (resumenAusentismoMesActual.colaboradoresAfectados.length > 2 ? '...' : '')
                    : 'Sin ausencias en el mes'}
                </div>
              </div>
            </div>

            {/* Acciones y enlace cruzado */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-indigo-100">
              <div className="flex items-center gap-2">
                {mediciones.some(m => m.indicadorId === indicadorAusentismoCatalogo?.id && m.periodo === mesFiltroAusentismo) ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Medición de {mesFiltroAusentismo} registrada en el histórico SST
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Medición de {mesFiltroAusentismo} pendiente de sincronizar en SST
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSincronizarMedicionAusentismo()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Guardar o actualizar la medición de ausentismo en la tabla histórica de SST"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sincronizar Medición Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ausentismo')}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>Ver Análisis Detallado</span>
                </button>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('incapacidades')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ir a Incapacidades</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desglose por Ciclo PHVA */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['Planear', 'Hacer', 'Verificar', 'Actuar'] as CicloPHVAIndicador[]).map(ciclo => {
              const listCiclo = indicadores.filter(i => i.cicloPHVA === ciclo);
              return (
                <div key={ciclo} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#18235C] uppercase tracking-wider">{ciclo}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {listCiclo.length} ind.
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {listCiclo.slice(0, 3).map(ind => (
                      <div key={ind.id} className="p-1.5 bg-slate-50 rounded text-[11px] truncate" title={ind.nombre}>
                        <strong>{ind.codigo}:</strong> {ind.nombre}
                      </div>
                    ))}
                    {listCiclo.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">Sin indicadores asignados</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CATÁLOGO DE INDICADORES */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre o proceso..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs"
                />
              </div>

              <div>
                <select
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
                >
                  <option value="TODOS">Todos los Tipos</option>
                  <option value="Estructura">Estructura</option>
                  <option value="Proceso">Proceso</option>
                  <option value="Resultado">Resultado</option>
                  <option value="Institucional">Institucional</option>
                </select>
              </div>

              <div>
                <select
                  value={filtroCiclo}
                  onChange={e => setFiltroCiclo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
                >
                  <option value="TODOS">Todos los Ciclos PHVA</option>
                  <option value="Planear">Planear</option>
                  <option value="Hacer">Hacer</option>
                  <option value="Verificar">Verificar</option>
                  <option value="Actuar">Actuar</option>
                </select>
              </div>

              <div>
                <select
                  value={filtroProceso}
                  onChange={e => setFiltroProceso(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
                >
                  <option value="TODOS">Todos los Procesos</option>
                  {procesosDisponibles.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Listado de Indicadores */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Código / Tipo</th>
                    <th className="py-3 px-3">Nombre del Indicador & Objetivo</th>
                    <th className="py-3 px-3">Proceso & Estándar</th>
                    <th className="py-3 px-3 text-center">Fórmula & Sentido</th>
                    <th className="py-3 px-3 text-center">Meta</th>
                    <th className="py-3 px-3 text-center">Última Medición</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {indicadoresFiltrados.map(ind => {
                    const medList = mediciones.filter(m => m.indicadorId === ind.id);
                    const ult = medList[medList.length - 1];

                    return (
                      <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="font-bold text-[#18235C]">{ind.codigo}</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ind.tipo === 'Estructura' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                            ind.tipo === 'Proceso' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                            ind.tipo === 'Resultado' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {ind.tipo}
                          </span>
                        </td>

                        <td className="py-3 px-3 align-top max-w-xs">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{ind.nombre}</span>
                            {(ind.codigo === 'IND-RES-04' || ind.nombre.toLowerCase().includes('ausentismo')) && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                ⚡ Conectado a Incapacidades
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{ind.objetivoMedicion}</div>
                        </td>

                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{ind.procesoRelacionado}</div>
                          <span className="text-[10px] text-slate-500">Est. {ind.estandar0312Relacionado || 'N/A'} • {ind.cicloPHVA}</span>
                        </td>

                        <td className="py-3 px-3 align-top text-center">
                          <div className="font-mono text-[10px] text-slate-700 truncate max-w-[180px]" title={ind.formulaTexto}>
                            {ind.formulaTexto}
                          </div>
                          <span className="text-[10px] text-slate-500 italic block mt-0.5">{ind.sentido}</span>
                        </td>

                        <td className="py-3 px-3 align-top text-center whitespace-nowrap font-bold text-[#18235C]">
                          {ind.meta}{ind.unidadMedida}
                        </td>

                        <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                          {ult ? (
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                ult.semaforo === 'VERDE' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                ult.semaforo === 'AMARILLO' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                ult.semaforo === 'ROJO' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {ult.resultadoFormateado}
                              </span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">{ult.periodo}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin medir</span>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {(ind.codigo === 'IND-RES-04' || ind.nombre.toLowerCase().includes('ausentismo')) && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('ausentismo')}
                                className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                                title="Ver Panel de Ausentismo por Causa Médica"
                              >
                                <Stethoscope className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAbrirAnalisisHistorico(ind)}
                              className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer"
                              title="Análisis Histórico y Tendencias"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIndicadorSeleccionado(ind);
                                setModalFichaCompletaOpen(true);
                              }}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Ver Ficha Técnica Oficial"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAbrirRegistrarMedicion(ind.id)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              title="Registrar medición para este indicador"
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIndicadorEnEdicionId(ind.id);
                                setFormCodigo(ind.codigo);
                                setFormNombre(ind.nombre);
                                setFormDescripcion(ind.descripcion);
                                setFormTipo(ind.tipo);
                                setFormCiclo(ind.cicloPHVA);
                                setFormProcesoRel(ind.procesoRelacionado);
                                setFormAreaId(ind.areaId || '');
                                setFormEstandar(ind.estandar0312Relacionado || '');
                                setFormNorma(ind.referenciaNormativa);
                                setFormObjetivo(ind.objetivoMedicion);
                                setFormInterpretacion(ind.interpretacion);
                                setFormUnidad(ind.unidadMedida);
                                setFormSentido(ind.sentido);
                                setFormFormula(ind.formulaTexto);
                                setFormVarNum(ind.nombreVariableNumerador);
                                setFormVarDen(ind.nombreVariableDenominador);
                                setFormFactor(ind.factorMultiplicador);
                                setFormMeta(ind.meta);
                                setFormLimiteAmarillo(ind.limiteAmarillo);
                                setFormPeriodicidad(ind.periodicidad);
                                setFormRespMed(ind.responsableMedicionCargo || '');
                                setFormRespAna(ind.responsableAnalisisCargo || '');
                                setModalIndicadorOpen(true);
                              }}
                              className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                              title="Editar Ficha Técnica"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarOArchivarIndicador(ind)}
                              className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title={mediciones.some(m => m.indicadorId === ind.id) ? 'Pasar a Histórico (con mediciones)' : 'Eliminar Indicador'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleEstadoIndicador(ind)}
                            className={`mt-1 text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                              ind.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' :
                              ind.estado === 'Histórico' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Haga clic para alternar estado Activo/Inactivo"
                          >
                            {ind.estado}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {indicadoresFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        <div className="space-y-3 max-w-md mx-auto">
                          <p className="text-xs">
                            {indicadores.length === 0
                              ? 'No hay indicadores en el catálogo actualmente.'
                              : 'No se encontraron indicadores con los criterios seleccionados.'}
                          </p>
                          {indicadores.length === 0 && (
                            <button
                              type="button"
                              onClick={handleCargarPlantillaSugerida}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#00FF00]" />
                              <span>Cargar 10 Indicadores Normativos (Res. 0312)</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: INDICADOR DE AUSENTISMO LABORAL POR CAUSA MÉDICA (RES. 0312 / IND-RES-04) */}
      {activeTab === 'ausentismo' && (
        <div className="space-y-6">
          {/* BANNER DE IDENTIFICACIÓN NORMATIVA */}
          <div className="bg-gradient-to-r from-[#18235C] via-[#101740] to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                    <Stethoscope className="w-6 h-6 text-[#00FF00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00FF00] text-[#18235C]">
                        IND-RES-04
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 border border-white/20">
                        Resolución 0312 de 2019 • Estándar 6.1.1
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-400/20 text-indigo-200 border border-indigo-300/30">
                        Decreto 1072 de 2015 Art. 2.2.4.6.21
                      </span>
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-white mt-1">
                      Indicador de Ausentismo Laboral por Causa Médica
                    </h2>
                    <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                      Monitorea los días de trabajo programados perdidos por contingencias de salud (origen común, accidentes de trabajo y enfermedad laboral) registradas y consolidadas en el Módulo de Control de Incapacidades.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('incapacidades')}
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>Ir a Control de Incapacidades</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ficha Resumida */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-white/15 text-xs">
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Ciclo PHVA</span>
                  <span className="font-bold text-white">Verificar</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tipo Indicador</span>
                  <span className="font-bold text-white">Resultado</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Sentido</span>
                  <span className="font-bold text-white">Menor es mejor</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Meta Oficial</span>
                  <span className="font-bold text-[#00FF00]">≤ {indicadorAusentismoCatalogo?.meta || 2.0}%</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Límite Alerta</span>
                  <span className="font-bold text-amber-300">≤ {indicadorAusentismoCatalogo?.limiteAmarillo || 3.5}%</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Periodicidad</span>
                  <span className="font-bold text-white">Mensual</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLES DE PARÁMETROS DEL PERÍODO Y FÓRMULA MATEMÁTICA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Panel de Configuración de Período */}
            <div className="p-4 bg-white rounded-2xl border border-[#8FA7D6] shadow-xs space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Parámetros de Medición</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIncapacidadesList(getStoredIncapacidades());
                    showToast('Datos de incapacidades actualizados desde almacenamiento local.');
                  }}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Recargar incapacidades"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mes a Evaluar (Período)
                  </label>
                  <input
                    type="month"
                    value={mesFiltroAusentismo}
                    onChange={e => e.target.value && setMesFiltroAusentismo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {['2026-01', '2026-02', '2026-03'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMesFiltroAusentismo(m)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          mesFiltroAusentismo === m
                            ? 'bg-[#18235C] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Trabajadores (N)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={numTrabajadoresActivos}
                      disabled
                      className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-700"
                      title="Calculado automáticamente desde la nómina activa de colaboradores"
                    />
                    <span className="text-[10px] text-slate-500">Activos en nómina</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Días Laborales (D)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={diasLaborablesMesConfig}
                      onChange={e => setDiasLaborablesMesConfig(Math.max(1, parseInt(e.target.value, 10) || 24))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-bold text-[#18235C]"
                    />
                    <div className="flex items-center gap-1 mt-1">
                      {[20, 22, 24, 26].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiasLaborablesMesConfig(d)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                            diasLaborablesMesConfig === d
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Días Programados Totales:</span>
                    <span className="font-mono text-indigo-700">{resumenAusentismoMesActual.diasTrabajoProgramados} d-h</span>
                  </div>
                  <p className="text-[10px] text-indigo-800">
                    Fórmula base: {resumenAusentismoMesActual.trabajadoresCensados} colaboradores × {resumenAusentismoMesActual.diasLaborablesMes} días hábiles.
                  </p>
                </div>
              </div>
            </div>

            {/* Ficha Explicativa Matemática en Vivo */}
            <div className="p-4 bg-white rounded-2xl border border-[#8FA7D6] shadow-xs space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Fórmula Matemática & Ejecución en Vivo ({mesFiltroAusentismo})</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                  K = 100 (%)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Desglose de la Fórmula */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-mono text-[11px] text-slate-800 text-center font-bold">
                    Tasa de Ausentismo = ( Días de Incapacidad Médica en el Mes / Días Programados de Trabajo en el Mes ) × 100
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-around gap-3 text-center">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Numerador (Días Incapacidad)</span>
                      <span className="text-base font-black font-mono text-[#18235C]">{resumenAusentismoMesActual.totalDiasIncapacidad} días</span>
                      <span className="block text-[9px] text-slate-500 font-semibold">
                        Común: {resumenAusentismoMesActual.diasIncapacidadComun}d • Laboral: {resumenAusentismoMesActual.diasIncapacidadLaboral}d
                      </span>
                    </div>

                    <span className="text-xl font-bold text-slate-400">÷</span>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Denominador (Días Programados)</span>
                      <span className="text-base font-black font-mono text-slate-800">{resumenAusentismoMesActual.diasTrabajoProgramados} días</span>
                      <span className="block text-[9px] text-slate-500 font-semibold">
                        {numTrabajadoresActivos} trab. × {diasLaborablesMesConfig} días
                      </span>
                    </div>

                    <span className="text-xl font-bold text-slate-400">× 100 =</span>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Resultado Calculado</span>
                      <span className={`text-xl font-black font-serif ${
                        resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0)
                          ? 'text-emerald-700'
                          : resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.limiteAmarillo || 3.5)
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}>
                        {resumenAusentismoMesActual.tasaAusentismoPct}%
                      </span>
                      <span className={`block text-[9px] font-bold uppercase ${
                        resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0)
                          ? 'text-emerald-800'
                          : resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.limiteAmarillo || 3.5)
                          ? 'text-amber-800'
                          : 'text-rose-800'
                      }`}>
                        {resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0) ? 'Cumple Meta' : 'Supera Meta'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interpretación Objetiva */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-blue-950 space-y-0.5">
                    <strong>Interpretación Técnica Oficial:</strong> En el período {mesFiltroAusentismo}, la organización perdió el <strong>{resumenAusentismoMesActual.tasaAusentismoPct}%</strong> de su capacidad laboral programada por concepto de incapacidades médicas ({resumenAusentismoMesActual.totalDiasIncapacidad} días acumulados).
                    {resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0) ? (
                      <span className="text-emerald-800 font-semibold block mt-0.5">
                        El ausentismo se encuentra dentro del rango de tolerancia institucional (Meta: ≤ {indicadorAusentismoCatalogo?.meta || 2.0}%). Proceso bajo control.
                      </span>
                    ) : (
                      <span className="text-rose-800 font-semibold block mt-0.5">
                        El ausentismo supera la meta oficial de {indicadorAusentismoCatalogo?.meta || 2.0}%. Se sugiere formular una acción de mejora PHVA y verificar las condiciones ergonómicas y médicas de los puestos involucrados.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 TARJETAS KPI DE IMPACTO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border shadow-xs space-y-1.5 ${
              resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0)
                ? 'bg-emerald-50 border-emerald-300'
                : resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.limiteAmarillo || 3.5)
                ? 'bg-amber-50 border-amber-300'
                : 'bg-rose-50 border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Tasa de Ausentismo
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0)
                    ? 'bg-emerald-600 text-white'
                    : resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.limiteAmarillo || 3.5)
                    ? 'bg-amber-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {resumenAusentismoMesActual.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0) ? 'Cumple' : 'Alerta'}
                </span>
              </div>
              <div className="text-3xl font-black font-serif text-[#18235C]">
                {resumenAusentismoMesActual.tasaAusentismoPct}%
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Meta: ≤ {indicadorAusentismoCatalogo?.meta || 2.0}% (Límite: {indicadorAusentismoCatalogo?.limiteAmarillo || 3.5}%)
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Días de Incapacidad Médica
              </span>
              <div className="text-3xl font-black font-serif text-[#18235C]">
                {resumenAusentismoMesActual.totalDiasIncapacidad} <span className="text-xs font-normal text-slate-500">días</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {resumenAusentismoMesActual.diasIncapacidadComun}d común
                </span>
                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                  {resumenAusentismoMesActual.diasIncapacidadLaboral}d laboral
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Días Programados Totales
              </span>
              <div className="text-3xl font-black font-serif text-slate-800">
                {resumenAusentismoMesActual.diasTrabajoProgramados} <span className="text-xs font-normal text-slate-500">días-h</span>
              </div>
              <div className="text-xs text-slate-600">
                {resumenAusentismoMesActual.trabajadoresCensados} colaboradores × {resumenAusentismoMesActual.diasLaborablesMes} días laborales
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Colaboradores Afectados
              </span>
              <div className="text-3xl font-black font-serif text-slate-800">
                {resumenAusentismoMesActual.colaboradoresAfectados.length} <span className="text-xs font-normal text-slate-500">personas</span>
              </div>
              <div className="text-xs text-slate-600 truncate" title={resumenAusentismoMesActual.colaboradoresAfectados.join(', ') || 'Sin ausencias'}>
                {resumenAusentismoMesActual.colaboradoresAfectados.length > 0
                  ? resumenAusentismoMesActual.colaboradoresAfectados.join(', ')
                  : 'Sin ausentismo en este período'}
              </div>
            </div>
          </div>

          {/* BARRA DE ACCIONES OFICIALES */}
          <div className="p-4 bg-white rounded-2xl border border-[#8FA7D6] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {mediciones.some(m => m.indicadorId === indicadorAusentismoCatalogo?.id && m.periodo === mesFiltroAusentismo) ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Medición de {mesFiltroAusentismo} guardada en el Registro Oficial SG-SST</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pendiente sincronizar medición en el histórico oficial de SG-SST</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSincronizarMedicionAusentismo(mesFiltroAusentismo)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  {mediciones.some(m => m.indicadorId === indicadorAusentismoCatalogo?.id && m.periodo === mesFiltroAusentismo)
                    ? 'Actualizar Medición Oficial en SG-SST'
                    : 'Sincronizar Medición Oficial en SG-SST'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCrearAccionParaAusentismo}
                className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#00FF00]" />
                <span>Formular Acción de Mejora PHVA</span>
              </button>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('incapacidades')}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Ir a Incapacidades</span>
                </button>
              )}
            </div>
          </div>

          {/* DESGLOSE DETALLADO DE INCAPACIDADES DEL PERÍODO */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] shadow-xs overflow-hidden space-y-0">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-[#18235C]">
                  Desglose de Contingencias Médicas que Afectaron el Período {mesFiltroAusentismo}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {resumenAusentismoMesActual.eventosDetalle.length} evento(s) de incapacidad médica con días hábiles o continuos en este mes
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Total: {resumenAusentismoMesActual.totalDiasIncapacidad} días
              </span>
            </div>

            {resumenAusentismoMesActual.eventosDetalle.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-[#18235C]">Excelente: Cero Ausentismo Médico en {mesFiltroAusentismo}</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No se registran certificados médicos de incapacidad en este período. La tasa de ausentismo es del 0.00%, cumpliendo plenamente con la meta del SG-SST.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2.5 px-3">Colaborador</th>
                      <th className="py-2.5 px-3 text-center">Origen</th>
                      <th className="py-2.5 px-3">Diagnóstico Médico (CIE-10)</th>
                      <th className="py-2.5 px-3">Entidad Emisora</th>
                      <th className="py-2.5 px-3 text-center">Días en este Mes</th>
                      <th className="py-2.5 px-3 text-center">Días Totales</th>
                      <th className="py-2.5 px-3 text-center">% Aporte al Ausentismo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {resumenAusentismoMesActual.eventosDetalle.map((evt, idx) => {
                      const aportePct = resumenAusentismoMesActual.totalDiasIncapacidad > 0
                        ? ((evt.diasEnMes / resumenAusentismoMesActual.totalDiasIncapacidad) * 100).toFixed(1)
                        : '0';

                      return (
                        <tr key={`${evt.incapacidadId}_${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{evt.empleadoNombre}</div>
                            {evt.empleadoNumeroDocumento && (
                              <span className="text-[10px] text-slate-500 font-mono">CC {evt.empleadoNumeroDocumento}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              evt.origen === 'Laboral'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}>
                              {evt.origen === 'Laboral' ? 'Origen Laboral (AT/EL)' : 'Origen Común'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 max-w-xs">
                            <div className="font-medium text-slate-800">{evt.diagnostico}</div>
                          </td>

                          <td className="py-2.5 px-3 text-slate-600">
                            {evt.entidadEmisora || 'EPS / ARL'}
                          </td>

                          <td className="py-2.5 px-3 text-center font-black font-mono text-[#18235C]">
                            {evt.diasEnMes} días
                          </td>

                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {evt.diasIncapacidadTotal ? `${evt.diasIncapacidadTotal} d` : '—'}
                          </td>

                          <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                            {aportePct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* HISTORIAL MULTI-MES Y COMPARATIVA DE TENDENCIA */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Historial y Evolución del Ausentismo Médico (Comparativa Multi-Mes)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Consolidado histórico de los períodos del año en curso frente a la meta (≤ 2.0%)
                </p>
              </div>

              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Base Normativa Res. 0312
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {historialAusentismoReciente.map(item => {
                const esPeriodoSeleccionado = item.periodo === mesFiltroAusentismo;
                const cumple = item.resumen.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.meta || 2.0);
                const alerta = item.resumen.tasaAusentismoPct <= (indicadorAusentismoCatalogo?.limiteAmarillo || 3.5);

                return (
                  <div
                    key={item.periodo}
                    onClick={() => setMesFiltroAusentismo(item.periodo)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      esPeriodoSeleccionado
                        ? 'border-[#18235C] bg-indigo-50/50 shadow-xs ring-1 ring-[#18235C]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#18235C]">{item.periodo}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cumple
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : alerta
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {item.resumen.tasaAusentismoPct}%
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Días Incapacidad:</span>
                        <span className="font-bold text-[#18235C]">{item.resumen.totalDiasIncapacidad} d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Días Programados:</span>
                        <span className="font-mono">{item.resumen.diasTrabajoProgramados} d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Registro SG-SST:</span>
                        <span className={`font-bold ${item.medicion ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {item.medicion ? 'Registrado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {cumple ? '✓ Cumple Meta' : '⚠ Desviación'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSincronizarMedicionAusentismo(item.periodo);
                        }}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                      >
                        Sincronizar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: REGISTRO DE MEDICIONES */}
      {activeTab === 'mediciones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#18235C]">
              Histórico Consolidado de Mediciones ({mediciones.length} registros)
            </h3>
            <button
              type="button"
              onClick={() => handleAbrirRegistrarMedicion()}
              className="px-3.5 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Registrar Nueva Medición</span>
            </button>
          </div>

          {/* BANNER DE ACCESO DIRECTO AL CÁLCULO DE AUSENTISMO MÉDICO */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 to-blue-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#18235C] text-white flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4 text-[#8FA7D6]" />
              </div>
              <div>
                <strong className="text-[#18235C] font-bold block">
                  Indicador IND-RES-04: Ausentismo Laboral por Causa Médica
                </strong>
                <span className="text-slate-600 text-[11px]">
                  Período {mesFiltroAusentismo}: {resumenAusentismoMesActual.totalDiasIncapacidad} días de incapacidad médica ({resumenAusentismoMesActual.diasIncapacidadComun}d común, {resumenAusentismoMesActual.diasIncapacidadLaboral}d laboral) sobre {resumenAusentismoMesActual.diasTrabajoProgramados} días programados = <strong>{resumenAusentismoMesActual.tasaAusentismoPct}%</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSincronizarMedicionAusentismo(mesFiltroAusentismo)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Sincronizar medición automáticamente desde Incapacidades"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sincronizar {mesFiltroAusentismo}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ausentismo')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#18235C] border border-[#8FA7D6] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Ver Análisis</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#8FA7D6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Periodo / Fecha</th>
                    <th className="py-3 px-3">Indicador</th>
                    <th className="py-3 px-3 text-center">Numerador</th>
                    <th className="py-3 px-3 text-center">Denominador</th>
                    <th className="py-3 px-3 text-center">Resultado</th>
                    <th className="py-3 px-3 text-center">Meta</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mediciones.map(med => {
                    const ind = indicadores.find(i => i.id === med.indicadorId);
                    return (
                      <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-[#18235C]">{med.periodo}</div>
                          <span className="text-[10px] text-slate-500">{med.fechaMedicion}</span>
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-semibold text-slate-900">{ind?.nombre || 'Indicador'}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{ind?.codigo}</span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono">{med.numeradorValor ?? '—'}</td>
                        <td className="py-3 px-3 text-center font-mono">{med.denominadorValor ?? '—'}</td>

                        <td className="py-3 px-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            med.semaforo === 'VERDE' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            med.semaforo === 'AMARILLO' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            med.semaforo === 'ROJO' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {med.resultadoFormateado}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {med.metaEsperada}{ind?.unidadMedida}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {med.cumpleMeta ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cumple
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Desviación
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                          {med.observaciones || '—'}
                        </td>
                      </tr>
                    );
                  })}

                  {mediciones.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No hay mediciones registradas aún. Haga clic en "Registrar Nueva Medición" para asentar un periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: PLAN DE ACCIONES DE MEJORA */}
      {activeTab === 'acciones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#18235C]">
              Plan de Acciones Correctivas, Preventivas y de Mejora ({acciones.length} registradas)
            </h3>
            <button
              type="button"
              onClick={() => {
                setAccIndicadorId(indicadores[0]?.id || '');
                setAccPeriodo(new Date().toISOString().slice(0, 7));
                setAccHallazgo('');
                setAccCausa('');
                setAccPropuesta('');
                setAccResp('Responsable SG-SST');
                setAccFechaFin(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
                setModalAccionOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Nueva Acción de Mejora</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#8FA7D6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Tipo / Prioridad</th>
                    <th className="py-3 px-3">Hallazgo & Causa Raíz</th>
                    <th className="py-3 px-3">Acción Propuesta</th>
                    <th className="py-3 px-3">Responsable & Fechas</th>
                    <th className="py-3 px-3 text-center">Avance</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-3 text-right">Eficacia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {acciones.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap align-top">
                        <div className="font-bold text-[#18235C]">{acc.tipoAccion}</div>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          acc.prioridad === 'Alta' ? 'bg-rose-100 text-rose-800' :
                          acc.prioridad === 'Media' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          Prioridad {acc.prioridad}
                        </span>
                      </td>

                      <td className="py-3 px-3 align-top max-w-xs">
                        <div className="font-semibold text-slate-900 text-xs">{acc.hallazgoDesviacion}</div>
                        <div className="text-[11px] text-slate-500 mt-1"><strong>Causa:</strong> {acc.causaRaiz}</div>
                      </td>

                      <td className="py-3 px-3 align-top max-w-xs">
                        <div className="text-slate-800 text-xs leading-relaxed">{acc.accionPropuesta}</div>
                      </td>

                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{acc.responsableNombre}</div>
                        <div className="text-[10px] text-slate-500">Límite: {acc.fechaLimite}</div>
                      </td>

                      <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                        <span className="font-bold text-[#18235C]">{acc.porcentajeAvance}%</span>
                      </td>

                      <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.estado === 'Cerrada Eficaz' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          acc.estado === 'En ejecución' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          acc.estado === 'Pendiente de verificación' ? 'bg-purple-100 text-purple-900' :
                          'bg-amber-100 text-amber-900'
                        }`}>
                          {acc.estado}
                        </span>
                      </td>

                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        {acc.estado === 'Cerrada Eficaz' ? (
                          <div className="text-right">
                            <span className="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Eficaz
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5" title={acc.resultadoVerificacion}>
                              Verificado: {acc.fechaVerificacion || 'Sí'}
                            </span>
                          </div>
                        ) : acc.estado === 'Cerrada No Eficaz' ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-rose-700 font-bold text-xs inline-flex items-center gap-1">
                              <AlertOctagon className="w-3.5 h-3.5" /> No Eficaz
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => handleReabrirAccion(acc)}
                                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold cursor-pointer"
                                title="Reabrir acción para replanificación PHVA"
                              >
                                Reabrir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGenerarNuevaAccionDesdeNoEficaz(acc)}
                                className="px-2 py-0.5 bg-[#18235C] hover:bg-[#101740] text-white rounded text-[10px] font-bold cursor-pointer"
                                title="Generar nueva acción vinculada"
                              >
                                Nueva Acción
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAbrirVerificacionAccion(acc)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer shadow-xs"
                          >
                            Evaluar Eficacia
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {acciones.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No hay acciones de mejora formuladas. Las desviaciones en las mediciones generarán propuestas automáticas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 5: BIBLIOTECA NORMATIVA */}
      {activeTab === 'normativa' && (
        <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6] shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-base text-[#18235C]">
              Marco Normativo Colombiano de Indicadores del SG-SST
            </h3>
            <p className="text-xs text-slate-500">
              Estructuración de indicadores según la Resolución 0312 de 2019 y el Decreto Único Reglamentario 1072 de 2015.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
              <h4 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-700" />
                1. Indicadores de Estructura
              </h4>
              <p className="text-slate-700">
                Miden el acceso y disponibilidad de los recursos humanos, técnicos y financieros, así como la definición de políticas, metas y planes del SG-SST (Dec. 1072 Art. 2.2.4.6.19).
              </p>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
              <h4 className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-700" />
                2. Indicadores de Proceso
              </h4>
              <p className="text-slate-700">
                Evalúan el grado de desarrollo, ejecución e implementación de las actividades planificadas, tales como capacitaciones, inspecciones y evaluaciones (Dec. 1072 Art. 2.2.4.6.20).
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
              <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                3. Indicadores de Resultado
              </h4>
              <p className="text-slate-700">
                Cuantifican el impacto directo de las intervenciones: frecuencia y severidad de accidentes de trabajo (K=240.000), prevalencia de enfermedad laboral y eficacia del cierre de acciones (Dec. 1072 Art. 2.2.4.6.21).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
            <div>
              <h5 className="font-bold text-slate-800 text-xs">Catálogo Normativo Preconfigurado (10 Indicadores Mínimos)</h5>
              <p className="text-[11px] text-slate-600">
                Incorpore al catálogo de su organización los indicadores reglamentarios de estructura, proceso y resultado con sus fórmulas y metas oficiales.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCargarPlantillaSugerida}
              className="px-4 py-2.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Cargar Indicadores Normativos (Res. 0312)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR INDICADOR (FICHA TÉCNICA) */}
      {modalIndicadorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#8FA7D6] shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-[#18235C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00FF00]" />
                <h3 className="font-bold text-sm">
                  {indicadorEnEdicionId ? 'Modificar Ficha Técnica de Indicador' : 'Registrar Nuevo Indicador Parametrizado'}
                </h3>
              </div>
              <button onClick={() => setModalIndicadorOpen(false)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarIndicador} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={e => setFormCodigo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Indicador *</label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={e => setFormNombre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej. Ejecución del Plan de Capacitaciones"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Indicador *</label>
                  <select
                    value={formTipo}
                    onChange={e => setFormTipo(e.target.value as TipoIndicadorSST)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  >
                    <option value="Estructura">Estructura</option>
                    <option value="Proceso">Proceso</option>
                    <option value="Resultado">Resultado</option>
                    <option value="Institucional">Institucional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciclo PHVA *</label>
                  <select
                    value={formCiclo}
                    onChange={e => setFormCiclo(e.target.value as CicloPHVAIndicador)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  >
                    <option value="Planear">Planear</option>
                    <option value="Hacer">Hacer</option>
                    <option value="Verificar">Verificar</option>
                    <option value="Actuar">Actuar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proceso Relacionado *</label>
                  <select
                    value={formProcesoRel}
                    onChange={e => setFormProcesoRel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    {procesosDisponibles.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    {procesosDisponibles.length === 0 && (
                      <option value="Gestión Humana y SG-SST">Gestión Humana y SG-SST</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Objetivo del Indicador *</label>
                <textarea
                  rows={2}
                  value={formObjetivo}
                  onChange={e => setFormObjetivo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="¿Qué pretende medir o evaluar este indicador?"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidad de Medida *</label>
                  <select
                    value={formUnidad}
                    onChange={e => setFormUnidad(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="%">% (Porcentaje)</option>
                    <option value="Tasa">Tasa (Por constante K)</option>
                    <option value="Días">Días</option>
                    <option value="Número">Número</option>
                    <option value="COP">COP ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sentido del Indicador *</label>
                  <select
                    value={formSentido}
                    onChange={e => setFormSentido(e.target.value as SentidoIndicadorSST)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  >
                    <option value="Mayor es mejor">Mayor es mejor (Cumple &ge; Meta)</option>
                    <option value="Menor es mejor">Menor es mejor (Cumple &le; Meta)</option>
                    <option value="Dentro de rango">Dentro de rango (Rango definido)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periodicidad *</label>
                  <select
                    value={formPeriodicidad}
                    onChange={e => setFormPeriodicidad(e.target.value as PeriodicidadIndicadorSST)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meta Deseada ({formUnidad}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMeta}
                    onChange={e => setFormMeta(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold text-[#18235C]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Límite Amarillo (Alerta) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formLimiteAmarillo}
                    onChange={e => setFormLimiteAmarillo(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold text-amber-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Factor Multiplicador *</label>
                  <input
                    type="number"
                    value={formFactor}
                    onChange={e => setFormFactor(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    placeholder="100 para %, 240000 para tasas"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Variable Numerador *</label>
                  <input
                    type="text"
                    value={formVarNum}
                    onChange={e => setFormVarNum(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej. Actividades ejecutadas"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Variable Denominador *</label>
                  <input
                    type="text"
                    value={formVarDen}
                    onChange={e => setFormVarDen(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej. Actividades programadas"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalIndicadorOpen(false)}
                  className="px-4 py-2 border text-slate-700 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18235C] text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar Ficha Técnica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR MEDICIÓN */}
      {modalMedicionOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#8FA7D6] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-[#18235C]">
                  Registrar Medición de Período
                </h3>
              </div>
              <button onClick={() => setModalMedicionOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarMedicion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seleccionar Indicador *</label>
                <select
                  value={medIndicadorId}
                  onChange={e => setMedIndicadorId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-semibold text-[#18235C]"
                  required
                >
                  {indicadores.map(i => (
                    <option key={i.id} value={i.id}>{i.codigo} - {i.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Período (YYYY-MM o YYYY-T) *</label>
                  <input
                    type="text"
                    value={medPeriodo}
                    onChange={e => setMedPeriodo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                    placeholder="Ej. 2026-03"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Medición *</label>
                  <input
                    type="date"
                    value={medFecha}
                    onChange={e => setMedFecha(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Sugerencia automática desde Módulo de Incapacidades */}
              {esIndicadorAusentismoEnModal && datosAusentismoPeriodoEnModal && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#18235C] flex items-center gap-1.5 text-xs">
                      <Stethoscope className="w-4 h-4 text-indigo-700" />
                      Datos en vivo del Módulo de Incapacidades ({medPeriodo}):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMedNum(datosAusentismoPeriodoEnModal.totalDiasIncapacidad);
                        setMedDen(datosAusentismoPeriodoEnModal.diasTrabajoProgramados);
                        setMedFuente('Módulo de Control de Incapacidades (Validación EPS/ARL)');
                        setMedResp('Responsable SG-SST / Gestión Humana');
                        setMedObs(
                          `Ausentismo médico Res. 0312: ${datosAusentismoPeriodoEnModal.totalDiasIncapacidad} días (${datosAusentismoPeriodoEnModal.diasIncapacidadComun}d común, ${datosAusentismoPeriodoEnModal.diasIncapacidadLaboral}d laboral) sobre ${datosAusentismoPeriodoEnModal.diasTrabajoProgramados} días programados. Colaboradores: ${datosAusentismoPeriodoEnModal.colaboradoresAfectados.join(', ') || 'Sin ausencias'}.`
                        );
                      }}
                      className="px-2.5 py-1 bg-[#18235C] hover:bg-[#101740] text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Autocompletar Valores
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-800">
                    <div><strong>Días Incapacidad:</strong> {datosAusentismoPeriodoEnModal.totalDiasIncapacidad} d</div>
                    <div><strong>Días Programados:</strong> {datosAusentismoPeriodoEnModal.diasTrabajoProgramados} d</div>
                    <div><strong>Tasa Estimada:</strong> {datosAusentismoPeriodoEnModal.tasaAusentismoPct}%</div>
                  </div>
                </div>
              )}

              {/* Variables del cálculo */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  Variables de la Fórmula: {indicadores.find(i => i.id === medIndicadorId)?.formulaTexto}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {indicadores.find(i => i.id === medIndicadorId)?.nombreVariableNumerador || 'Numerador'} *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={medNum}
                      onChange={e => setMedNum(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono"
                      placeholder="Valor numerador"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {indicadores.find(i => i.id === medIndicadorId)?.nombreVariableDenominador || 'Denominador'} *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={medDen}
                      onChange={e => setMedDen(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono"
                      placeholder="Valor denominador"
                      required
                    />
                  </div>
                </div>

                {/* Previsualización del cálculo reactivo */}
                {calculoMedicionEnVivo && (
                  <div className="p-2.5 rounded-lg border flex items-center justify-between text-xs" style={{
                    backgroundColor: calculoMedicionEnVivo.semaforo === 'VERDE' ? '#ecfdf5' :
                                     calculoMedicionEnVivo.semaforo === 'AMARILLO' ? '#fffbeb' :
                                     calculoMedicionEnVivo.semaforo === 'ROJO' ? '#fff1f2' : '#f8fafc'
                  }}>
                    <div>
                      <strong className="block text-slate-800">Resultado Calculado:</strong>
                      <span className="text-sm font-bold">{calculoMedicionEnVivo.resultadoFormateado}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      calculoMedicionEnVivo.semaforo === 'VERDE' ? 'bg-emerald-600 text-white' :
                      calculoMedicionEnVivo.semaforo === 'AMARILLO' ? 'bg-amber-600 text-white' :
                      calculoMedicionEnVivo.semaforo === 'ROJO' ? 'bg-rose-600 text-white' : 'bg-slate-500 text-white'
                    }`}>
                      {calculoMedicionEnVivo.semaforo}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones o Hallazgos</label>
                <textarea
                  rows={2}
                  value={medObs}
                  onChange={e => setMedObs(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  placeholder="Detalles sobre la recolección de los datos o justificación de resultados..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalMedicionOpen(false)}
                  className="px-4 py-2 border text-slate-700 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar Medición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACCIÓN DE MEJORA */}
      {modalAccionOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#8FA7D6] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#18235C]" />
                <h3 className="font-bold text-sm text-[#18235C]">
                  Formular Acción Derivada del Indicador (PHVA)
                </h3>
              </div>
              <button onClick={() => setModalAccionOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarAccion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Acción *</label>
                  <select
                    value={accTipo}
                    onChange={e => setAccTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  >
                    <option value="Correctiva">Correctiva</option>
                    <option value="Preventiva">Preventiva</option>
                    <option value="Mejora">Mejora</option>
                    <option value="Corrección Inmediata">Corrección Inmediata</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioridad *</label>
                  <select
                    value={accPrioridad}
                    onChange={e => setAccPrioridad(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hallazgo o Desviación Identificada *</label>
                <textarea
                  rows={2}
                  value={accHallazgo}
                  onChange={e => setAccHallazgo(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Análisis de Causa Raíz *</label>
                <textarea
                  rows={2}
                  value={accCausa}
                  onChange={e => setAccCausa(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  placeholder="Explique las razones por las que no se alcanzó la meta..."
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan de Acción Propuesto *</label>
                <textarea
                  rows={2}
                  value={accPropuesta}
                  onChange={e => setAccPropuesta(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  placeholder="Detalle de actividades, recursos y metas de cierre..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsable de Ejecución *</label>
                  <input
                    type="text"
                    value={accResp}
                    onChange={e => setAccResp(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    placeholder="Cargo o nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Límite de Cumplimiento *</label>
                  <input
                    type="date"
                    value={accFechaFin}
                    onChange={e => setAccFechaFin(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalAccionOpen(false)}
                  className="px-4 py-2 border text-slate-700 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18235C] text-white rounded-xl font-bold cursor-pointer"
                >
                  Asentar Acción en Plan PHVA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA TÉCNICA OFICIAL IMPRIMIBLE */}
      {modalFichaCompletaOpen && indicadorSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#8FA7D6] shadow-2xl p-6 space-y-4 my-6 print:border-none print:shadow-none print:m-0 print:p-2">
            {/* Membrete Institucional para Impresión */}
            <div className="border-b-2 border-[#18235C] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#18235C] uppercase tracking-wide">
                  {razonSocial}
                </h3>
                <p className="text-[11px] text-slate-600 font-semibold">{nitCompleto}</p>
                <p className="text-[10px] text-slate-500">Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST)</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-[#18235C] block">FT-SST-IND-{indicadorSeleccionado.codigo}</span>
                <span className="text-[10px] text-slate-500 block">Versión 01 • Res. 0312/2019</span>
                <button onClick={() => setModalFichaCompletaOpen(false)} className="print:hidden text-slate-400 hover:text-slate-700 cursor-pointer mt-1">
                  <X className="w-5 h-5 ml-auto" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-[#18235C] text-sm">{indicadorSeleccionado.codigo}</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-900 text-[10px]">
                    Indicador de {indicadorSeleccionado.tipo} • Ciclo {indicadorSeleccionado.cicloPHVA}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{indicadorSeleccionado.nombre}</h4>
                <p className="text-slate-600 text-[11px]">{indicadorSeleccionado.descripcion}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <div><strong className="text-slate-600 block text-[10px] uppercase">Proceso Asociado:</strong> {indicadorSeleccionado.procesoRelacionado}</div>
                <div><strong className="text-slate-600 block text-[10px] uppercase">Estándar Res. 0312:</strong> {indicadorSeleccionado.estandar0312Relacionado || 'N/A'}</div>
                <div><strong className="text-slate-600 block text-[10px] uppercase">Unidad de Medida:</strong> {indicadorSeleccionado.unidadMedida}</div>
                <div><strong className="text-slate-600 block text-[10px] uppercase">Sentido:</strong> {indicadorSeleccionado.sentido}</div>
                <div><strong className="text-slate-600 block text-[10px] uppercase">Meta Institucional:</strong> <span className="font-bold text-[#18235C]">{indicadorSeleccionado.meta}{indicadorSeleccionado.unidadMedida}</span></div>
                <div><strong className="text-slate-600 block text-[10px] uppercase">Periodicidad:</strong> {indicadorSeleccionado.periodicidad}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <strong className="block text-[10px] uppercase font-bold text-slate-600">Regla Matemática de Cálculo:</strong>
                <div className="p-2.5 bg-white rounded-lg border font-mono text-[#18235C] font-bold text-xs">
                  {indicadorSeleccionado.formulaTexto}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div><strong>Variable Numerador:</strong> {indicadorSeleccionado.nombreVariableNumerador}</div>
                  <div><strong>Variable Denominador:</strong> {indicadorSeleccionado.nombreVariableDenominador}</div>
                  <div><strong>Factor Multiplicador:</strong> ×{indicadorSeleccionado.factorMultiplicador}</div>
                  <div><strong>Límite Amarillo (Alerta):</strong> {indicadorSeleccionado.limiteAmarillo}{indicadorSeleccionado.unidadMedida}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <div><strong className="text-slate-600 block text-[10px] uppercase">Responsable de Medición:</strong> {indicadorSeleccionado.responsableMedicionCargo || 'Responsable SG-SST'}</div>
                <div><strong className="text-slate-600 block text-[10px] uppercase">Responsable de Análisis y Reporte:</strong> {indicadorSeleccionado.responsableAnalisisCargo || 'COPASST / Gerencia'}</div>
                <div><strong className="text-slate-600 block text-[10px] uppercase">Fuente Normativa:</strong> {indicadorSeleccionado.referenciaNormativa}</div>
                <div><strong className="text-slate-600 block text-[10px] uppercase">Estado Actual:</strong> <span className="font-semibold text-emerald-700">{indicadorSeleccionado.estado}</span></div>
              </div>

              {/* Cuadro de Firmas Formal */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center text-[10px]">
                <div className="space-y-4">
                  <div className="border-b border-slate-400 h-8"></div>
                  <div>
                    <strong className="block text-slate-800">Elaboró</strong>
                    <span className="text-slate-500">Responsable del SG-SST</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-b border-slate-400 h-8"></div>
                  <div>
                    <strong className="block text-slate-800">Revisó</strong>
                    <span className="text-slate-500">Presidente / Secretario COPASST</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-b border-slate-400 h-8"></div>
                  <div>
                    <strong className="block text-slate-800">Aprobó</strong>
                    <span className="text-slate-500">Representante Legal / Gerencia</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ficha Técnica</span>
              </button>
              <button
                type="button"
                onClick={() => setModalFichaCompletaOpen(false)}
                className="px-4 py-2 bg-[#18235C] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ANÁLISIS HISTÓRICO Y TENDENCIAS */}
      {modalAnalisisHistoricoOpen && indicadorParaAnalisis && (() => {
        const analisis = generarAnalisisComparativo(indicadorParaAnalisis, mediciones);
        const medList = mediciones
          .filter(m => m.indicadorId === indicadorParaAnalisis.id)
          .sort((a, b) => a.periodo.localeCompare(b.periodo));

        const maxVal = Math.max(
          indicadorParaAnalisis.meta,
          ...medList.map(m => m.resultadoNumerico || 0),
          1
        );

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#8FA7D6] shadow-2xl p-6 space-y-4 my-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-700" />
                  <div>
                    <h3 className="font-bold text-sm text-[#18235C]">
                      Análisis Histórico y Tendencias: {indicadorParaAnalisis.codigo}
                    </h3>
                    <p className="text-[11px] text-slate-500">{indicadorParaAnalisis.nombre}</p>
                  </div>
                </div>
                <button onClick={() => setModalAnalisisHistoricoOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tarjetas Comparativas (Período actual, anterior, año anterior, promedio) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Período Actual</span>
                  <div className="text-sm font-bold text-[#18235C] mt-1">
                    {analisis.medicionActual ? analisis.medicionActual.resultadoFormateado : 'Sin medición'}
                  </div>
                  <span className="text-[10px] text-slate-500">{analisis.medicionActual?.periodo || '—'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Período Anterior</span>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {analisis.medicionAnterior ? analisis.medicionAnterior.resultadoFormateado : 'N/A'}
                  </div>
                  <span className="text-[10px] text-slate-500">{analisis.medicionAnterior?.periodo || '—'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Variación vs Anterior</span>
                  <div className={`text-sm font-bold mt-1 ${
                    analisis.tendencia === 'Mejora' ? 'text-emerald-700' :
                    analisis.tendencia === 'Deterioro' ? 'text-rose-700' : 'text-slate-700'
                  }`}>
                    {analisis.variacionPeriodoAnterior !== null ? (
                      `${analisis.variacionPeriodoAnterior > 0 ? '+' : ''}${analisis.variacionPeriodoAnterior}${indicadorParaAnalisis.unidadMedida}`
                    ) : '—'}
                  </div>
                  <span className="text-[10px] font-semibold">{analisis.tendencia}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Promedio Histórico</span>
                  <div className="text-sm font-bold text-[#18235C] mt-1">
                    {analisis.promedioHistorico !== null ? `${analisis.promedioHistorico}${indicadorParaAnalisis.unidadMedida}` : '—'}
                  </div>
                  <span className="text-[10px] text-slate-500">{analisis.totalMedicionesValidas} mediciones</span>
                </div>
              </div>

              {/* Gráfico de Tendencia Histórica (SVG interactivo) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-[#18235C]">Evolución Cronológica de Mediciones vs Meta ({indicadorParaAnalisis.meta}{indicadorParaAnalisis.unidadMedida})</strong>
                  <span className="text-[10px] text-slate-500">Sentido: {indicadorParaAnalisis.sentido}</span>
                </div>

                {medList.length > 0 ? (
                  <div className="h-36 flex items-end gap-2 pt-6 pb-2 border-b border-slate-300 overflow-x-auto">
                    {medList.map(m => {
                      const num = m.resultadoNumerico ?? 0;
                      const pctHeight = Math.min(100, Math.max(12, Math.round((num / maxVal) * 100)));
                      const colorClass = m.semaforo === 'VERDE' ? 'bg-emerald-500' :
                                         m.semaforo === 'AMARILLO' ? 'bg-amber-500' :
                                         m.semaforo === 'ROJO' ? 'bg-rose-500' : 'bg-slate-400';

                      return (
                        <div key={m.id} className="flex-1 min-w-[50px] flex flex-col items-center gap-1 group relative">
                          <span className="text-[10px] font-bold text-slate-700">{m.resultadoFormateado}</span>
                          <div
                            style={{ height: `${pctHeight}%` }}
                            className={`w-full max-w-[36px] rounded-t-md transition-all ${colorClass} shadow-xs hover:brightness-90`}
                            title={`Período: ${m.periodo}\nResultado: ${m.resultadoFormateado}\nMeta: ${m.metaEsperada}${indicadorParaAnalisis.unidadMedida}`}
                          />
                          <span className="text-[9px] font-mono text-slate-600 mt-1 whitespace-nowrap">{m.periodo}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No hay suficientes datos para generar el gráfico de tendencia.</p>
                )}
              </div>

              {/* Interpretación Preliminar Objetiva del Sistema */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                  <span>Interpretación Preliminar del Comportamiento</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-200/60 text-blue-900 rounded font-normal">Objetiva / Sin especulaciones</span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {analisis.interpretacionObjetiva}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  Nota metodológica: Las causas de desviación no son inventadas por el sistema; deben ser identificadas, analizadas y concertadas por el Responsable SG-SST y el COPASST a partir de evidencias de campo.
                </p>
              </div>

              {/* Registro Manual de Causas y Plan Derivado */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                <h4 className="font-bold text-[#18235C] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#18235C]" />
                  <span>Registro Manual de Causas y Decisión del Análisis</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Causa Raíz Identificada *</label>
                    <input
                      type="text"
                      value={analisisCausaManual}
                      onChange={e => setAnalisisCausaManual(e.target.value)}
                      placeholder="Ej. Demoras en suministro de insumos por proveedor"
                      className="w-full px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Riesgo Asociado (Matriz GTC 45)</label>
                    <input
                      type="text"
                      value={analisisRiesgoAsociado}
                      onChange={e => setAnalisisRiesgoAsociado(e.target.value)}
                      placeholder="Ej. Mecánico / Biomecánico / Locativo"
                      className="w-full px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Situación Identificada / Análisis</label>
                  <textarea
                    rows={2}
                    value={analisisSituacionManual}
                    onChange={e => setAnalisisSituacionManual(e.target.value)}
                    placeholder="Descripción detallada de la situación observada..."
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Decisión Tomada / Estrategia</label>
                  <input
                    type="text"
                    value={analisisDecisionTomada}
                    onChange={e => setAnalisisDecisionTomada(e.target.value)}
                    placeholder="Ej. Establecer plan de contingencia y renegociar plazos"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!analisisCausaManual.trim()) {
                        showToast('Por favor registre al menos la causa identificada para formular la acción.');
                        return;
                      }
                      setAccIndicadorId(indicadorParaAnalisis.id);
                      setAccPeriodo(analisis.medicionActual?.periodo || new Date().toISOString().slice(0, 7));
                      setAccHallazgo(`Análisis histórico de desviación: ${analisisSituacionManual.trim() || `Resultado ${analisis.medicionActual?.resultadoFormateado} frente a meta de ${indicadorParaAnalisis.meta}${indicadorParaAnalisis.unidadMedida}`}`);
                      setAccCausa(analisisCausaManual.trim());
                      setAccPropuesta(analisisDecisionTomada.trim() || 'Ejecución del plan correctivo concertado con COPASST.');
                      setAccResp(indicadorParaAnalisis.responsableMedicionCargo || 'Responsable SG-SST');
                      setAccFechaFin(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
                      setModalAnalisisHistoricoOpen(false);
                      setModalAccionOpen(true);
                    }}
                    className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Award className="w-3.5 h-3.5 text-[#00FF00]" />
                    <span>Crear Acción de Mejora con este Análisis</span>
                  </button>
                </div>
              </div>

              {/* Historial de Mediciones del Indicador */}
              <div className="space-y-2 text-xs">
                <strong className="text-slate-800 block">Historial de Mediciones Registradas ({medList.length})</strong>
                <div className="border rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2">Periodo</th>
                        <th className="p-2">Fecha</th>
                        <th className="p-2 text-center">Num / Den</th>
                        <th className="p-2 text-center">Resultado</th>
                        <th className="p-2 text-center">Cumple</th>
                        <th className="p-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {medList.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-[#18235C]">{m.periodo}</td>
                          <td className="p-2 text-slate-500">{m.fechaMedicion}</td>
                          <td className="p-2 text-center font-mono">{m.numeradorValor ?? '—'} / {m.denominadorValor ?? '—'}</td>
                          <td className="p-2 text-center font-bold">{m.resultadoFormateado}</td>
                          <td className="p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              m.semaforo === 'VERDE' ? 'bg-emerald-100 text-emerald-800' :
                              m.semaforo === 'AMARILLO' ? 'bg-amber-100 text-amber-800' :
                              m.semaforo === 'ROJO' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {m.semaforo}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleEliminarMedicion(m.id)}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              title="Eliminar medición"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {medList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 italic">Sin registros</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalAnalisisHistoricoOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cerrar Análisis
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: VERIFICACIÓN Y EVALUACIÓN DE EFICACIA DE ACCIÓN */}
      {modalVerificarAccionOpen && accionParaVerificar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#8FA7D6] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-[#18235C]">
                  Evaluación de Eficacia (Ciclo Actuar - Res. 0312)
                </h3>
              </div>
              <button onClick={() => setModalVerificarAccionOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarVerificacion} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Acción Evaluada</span>
                <p className="font-bold text-slate-900">{accionParaVerificar.accionPropuesta}</p>
                <p className="text-[11px] text-slate-600"><strong>Hallazgo:</strong> {accionParaVerificar.hallazgoDesviacion}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Verificación *</label>
                  <input
                    type="date"
                    value={verifFecha}
                    onChange={e => setVerifFecha(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Porcentaje de Avance (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={verifAvance}
                    onChange={e => setVerifAvance(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Responsable de Verificación *</label>
                <input
                  type="text"
                  value={verifResponsable}
                  onChange={e => setVerifResponsable(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dictamen de Eficacia *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerifEsEficaz(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      verifEsEficaz ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Eficaz (Cierre Exitoso)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerifEsEficaz(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      !verifEsEficaz ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>No Eficaz (Replanificar)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Justificación y Evidencias de Verificación *</label>
                <textarea
                  rows={3}
                  value={verifResultado}
                  onChange={e => setVerifResultado(e.target.value)}
                  placeholder="Detalle los resultados alcanzados, constancias documentales y justificación del dictamen de eficacia..."
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalVerificarAccionOpen(false)}
                  className="px-4 py-2 border text-slate-700 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Registrar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
