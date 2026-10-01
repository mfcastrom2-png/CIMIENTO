import React, { useState, useMemo, useEffect } from 'react';
import {
  PeligroRiesgoGTC45,
  Cargo,
  AreaOrganizacion,
  ProcesoOrganizacion,
  Empleado,
  Role
} from '../types';
import { useCompanySyncOptional } from '../context/SyncContext';
import {
  Layers,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  Trash2,
  Edit3,
  Eye,
  BarChart3,
  Users,
  Building2,
  Briefcase,
  Activity,
  X,
  Check,
  Info,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Copy
} from 'lucide-react';

const CLASIFICACIONES_GTC45 = [
  'Biológico',
  'Físico',
  'Químico',
  'Psicosocial',
  'Biomecánico',
  'Condiciones de Seguridad',
  'Fenómenos Naturales'
] as const;

export function calcularGtc45(nd: number, ne: number, nc: number) {
  const np = nd * ne;
  let interpProb: 'Muy Alta' | 'Alta' | 'Media' | 'Baja' = 'Baja';
  if (np >= 24) interpProb = 'Muy Alta';
  else if (np >= 10) interpProb = 'Alta';
  else if (np >= 6) interpProb = 'Media';
  else interpProb = 'Baja';

  const nr = np * nc;
  let interpRiesgo: 'I' | 'II' | 'III' | 'IV' = 'IV';
  let aceptabilidad: 'No Aceptable' | 'No Aceptable o Aceptable con Control Específico' | 'Mejorable' | 'Aceptable' = 'Aceptable';

  if (nr >= 600) {
    interpRiesgo = 'I';
    aceptabilidad = 'No Aceptable';
  } else if (nr >= 150) {
    interpRiesgo = 'II';
    aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
  } else if (nr >= 40) {
    interpRiesgo = 'III';
    aceptabilidad = 'Mejorable';
  } else {
    interpRiesgo = 'IV';
    aceptabilidad = 'Aceptable';
  }

  return { np, interpProb, nr, interpRiesgo, aceptabilidad };
}

interface MatrizRiesgosGTC45ViewProps {
  cargos?: Cargo[];
  areas?: AreaOrganizacion[];
  procesos?: ProcesoOrganizacion[];
  empleados?: Empleado[];
  userRole?: Role;
  onNavigate?: (view: string) => void;
}

const STORAGE_KEY = 'bgroup_matriz_gtc45_v2';

export function MatrizRiesgosGTC45View({
  cargos = [],
  areas = [],
  procesos = [],
  empleados = [],
  userRole = 'admin'
}: MatrizRiesgosGTC45ViewProps) {
  const syncContext = useCompanySyncOptional();
  const empresa = syncContext?.empresa;
  const razonSocial = empresa?.razonSocial || empresa?.nombreComercial || 'Empresa';
  const nitCompleto = empresa?.nit ? `NIT ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : '';

  // Áreas reales deduplicadas
  const areasDisponibles = useMemo(() => {
    const seenId = new Set<string>();
    const seenNombre = new Set<string>();
    const list: AreaOrganizacion[] = [];
    (areas || []).forEach(a => {
      if (!a || !a.nombre?.trim()) return;
      const idKey = a.id;
      const nomKey = a.nombre.trim().toLowerCase();
      if (seenId.has(idKey) || seenNombre.has(nomKey)) return;
      seenId.add(idKey);
      seenNombre.add(nomKey);
      list.push(a);
    });
    return list;
  }, [areas]);

  // Cargos reales deduplicados por ID y nombre normalizado (resuelve duplicados como doble 'Supervisor Operativo')
  const cargosDisponibles = useMemo(() => {
    const seenId = new Set<string>();
    const seenNombre = new Set<string>();
    const list: Cargo[] = [];
    (cargos || []).forEach(c => {
      if (!c || !c.nombre?.trim()) return;
      const idKey = c.id;
      const nomKey = c.nombre.trim().toLowerCase();
      if (seenId.has(idKey) || seenNombre.has(nomKey)) return;
      seenId.add(idKey);
      seenNombre.add(nomKey);
      list.push(c);
    });
    return list;
  }, [cargos]);

  // Procesos organizacionales derivados EXCLUSIVAMENTE de la estructura orgánica real
  const listaProcesosDisponibles = useMemo(() => {
    const set = new Set<string>();
    (procesos || []).forEach(p => {
      if (p?.nombre?.trim()) set.add(p.nombre.trim());
    });
    (areas || []).forEach(a => {
      if (a?.procesoNombre?.trim()) set.add(a.procesoNombre.trim());
    });
    return Array.from(set);
  }, [procesos, areas]);

  // Estado de lista de peligros (SOLO RIESGOS DEL USUARIO - ELIMINANDO RIESGOS DE PRUEBA)
  const [peligros, setPeligros] = useState<PeligroRiesgoGTC45[]>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed)) {
          // Filtrar estrictamente cualquier riesgo de prueba previo
          return parsed.filter(p => {
            if (!p || !p.id) return false;
            if (['pel_1', 'pel_2', 'pel_3', 'pel_4'].includes(p.id)) return false;
            if (p.id.startsWith('pel_init_') || p.id.startsWith('pel_test_')) return false;
            if (typeof p.descripcionPeligro === 'string') {
              if (p.descripcionPeligro.includes('Trabajo en alturas por encima de 2.0')) return false;
              if (p.descripcionPeligro.includes('Contacto accidental indirecto')) return false;
              if (p.descripcionPeligro.includes('Postura prolongada sedente')) return false;
              if (p.descripcionPeligro.includes('Carga mental, atención de usuarios')) return false;
            }
            if (p.proceso === 'Operaciones Técnicas ISP') return false;
            return true;
          });
        }
      }
    } catch {
      // Ignorar error de parseo
    }
    // Retornar arreglo vacío: NUNCA inyectar riesgos de prueba
    return [];
  });

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(peligros));
    } catch (e) {
      console.warn('No se pudo guardar la matriz GTC45 en localStorage', e);
    }
  }, [peligros]);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroProceso, setFiltroProceso] = useState<string>('TODOS');
  const [filtroArea, setFiltroArea] = useState<string>('TODOS');
  const [filtroClasificacion, setFiltroClasificacion] = useState<string>('TODOS');
  const [filtroNivelRiesgo, setFiltroNivelRiesgo] = useState<string>('TODOS');
  const [filtroAceptabilidad, setFiltroAceptabilidad] = useState<string>('TODOS');

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalAnalisisOpen, setModalAnalisisOpen] = useState(false);
  const [peligroSeleccionado, setPeligroSeleccionado] = useState<PeligroRiesgoGTC45 | null>(null);
  const [peligroEnEdicionId, setPeligroEnEdicionId] = useState<string | null>(null);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form State
  const [formProceso, setFormProceso] = useState('');
  const [modoNuevoProceso, setModoNuevoProceso] = useState(false);
  const [formAreaId, setFormAreaId] = useState('');
  const [formAreaNombre, setFormAreaNombre] = useState('');
  const [formCargosIds, setFormCargosIds] = useState<string[]>([]);
  const [formZonaLugar, setFormZonaLugar] = useState('');
  const [formActividad, setFormActividad] = useState('');
  const [formRutinaria, setFormRutinaria] = useState(true);
  const [formClasificacion, setFormClasificacion] = useState<string>('Condiciones de Seguridad');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formEfectos, setFormEfectos] = useState('');
  const [formPeorConsecuencia, setFormPeorConsecuencia] = useState('');
  const [formRequisitoLegal, setFormRequisitoLegal] = useState(true);
  const [formRequisitoLegalDetalle, setFormRequisitoLegalDetalle] = useState('');

  // Controles existentes
  const [formCtrlFuente, setFormCtrlFuente] = useState('');
  const [formCtrlMedio, setFormCtrlMedio] = useState('');
  const [formCtrlIndividuo, setFormCtrlIndividuo] = useState('');

  // Cuantitativo GTC 45
  const [formND, setFormND] = useState<number>(6);
  const [formNE, setFormNE] = useState<number>(3);
  const [formNC, setFormNC] = useState<number>(25);

  // Medidas de intervención
  const [formMedEliminacion, setFormMedEliminacion] = useState('');
  const [formMedSustitucion, setFormMedSustitucion] = useState('');
  const [formMedIngenieria, setFormMedIngenieria] = useState('');
  const [formMedAdministrativos, setFormMedAdministrativos] = useState('');
  const [formMedEpp, setFormMedEpp] = useState('');
  const [formResponsable, setFormResponsable] = useState('Responsable SG-SST');

  // Cálculos reactivos de GTC 45 para el modal
  const calculoEnVivo = useMemo(() => {
    return calcularGtc45(formND, formNE, formNC);
  }, [formND, formNE, formNC]);

  // Contar número estimado de expuestos en base a cargos seleccionados
  const expuestosEstimados = useMemo(() => {
    if (formCargosIds.length === 0) return 1;
    const count = empleados.filter(e => formCargosIds.includes(e.cargoId)).length;
    return Math.max(1, count);
  }, [formCargosIds, empleados]);

  // Abrir modal de creación (limpio, sin datos ficticios)
  const handleAbrirCrear = () => {
    setPeligroEnEdicionId(null);
    setModoNuevoProceso(false);
    const primerProceso = listaProcesosDisponibles[0] || '';
    const primerArea = areasDisponibles[0] || null;

    setFormProceso(primerProceso);
    setFormAreaId(primerArea?.id || '');
    setFormAreaNombre(primerArea?.nombre || '');
    setFormCargosIds([]);
    setFormZonaLugar('');
    setFormActividad('');
    setFormRutinaria(true);
    setFormClasificacion('Condiciones de Seguridad');
    setFormDescripcion('');
    setFormEfectos('');
    setFormPeorConsecuencia('');
    setFormRequisitoLegal(true);
    setFormRequisitoLegalDetalle('');
    setFormCtrlFuente('');
    setFormCtrlMedio('');
    setFormCtrlIndividuo('');
    setFormND(6);
    setFormNE(3);
    setFormNC(25);
    setFormMedEliminacion('');
    setFormMedSustitucion('');
    setFormMedIngenieria('');
    setFormMedAdministrativos('');
    setFormMedEpp('');
    setFormResponsable('Responsable SG-SST');
    setModalFormOpen(true);
  };

  // Abrir modal de edición
  const handleAbrirEditar = (item: PeligroRiesgoGTC45) => {
    setPeligroEnEdicionId(item.id);
    const esProcesoEnLista = listaProcesosDisponibles.includes(item.proceso);
    setModoNuevoProceso(!esProcesoEnLista);
    setFormProceso(item.proceso);
    setFormAreaId(item.areaId || '');
    setFormAreaNombre(item.areaNombre || '');
    setFormCargosIds(item.cargosExpuestosIds && item.cargosExpuestosIds.length > 0 ? item.cargosExpuestosIds : (item.cargoId ? [item.cargoId] : []));
    setFormZonaLugar(item.zonaLugar);
    setFormActividad(item.actividad);
    setFormRutinaria(item.rutinaria);
    setFormClasificacion(item.clasificacionPeligro);
    setFormDescripcion(item.descripcionPeligro);
    setFormEfectos(item.efectosPosibles);
    setFormPeorConsecuencia(item.peorConsecuencia || '');
    setFormRequisitoLegal(item.requisitoLegal !== false);
    setFormRequisitoLegalDetalle(item.requisitoLegalDetalle || '');
    setFormCtrlFuente(item.controlesExistentes?.fuente || '');
    setFormCtrlMedio(item.controlesExistentes?.medio || '');
    setFormCtrlIndividuo(item.controlesExistentes?.individuo || '');
    setFormND(item.nivelDeficiencia || 6);
    setFormNE(item.nivelExposicion || 3);
    setFormNC(item.nivelConsecuencia || 25);
    setFormMedEliminacion(item.medidasIntervencion?.eliminacion || '');
    setFormMedSustitucion(item.medidasIntervencion?.sustitucion || '');
    setFormMedIngenieria(item.medidasIntervencion?.controlesIngenieria || '');
    setFormMedAdministrativos(item.medidasIntervencion?.controlesAdministrativos || '');
    setFormMedEpp(item.medidasIntervencion?.epp || '');
    setFormResponsable(item.responsableEvaluacion || 'Responsable SG-SST');
    setModalFormOpen(true);
  };

  // Duplicar peligro como plantilla
  const handleDuplicar = (item: PeligroRiesgoGTC45) => {
    handleAbrirEditar({
      ...item,
      id: `pel_${Date.now()}`,
      actividad: `${item.actividad} (Copia)`
    });
    setPeligroEnEdicionId(null); // Marcar como nuevo
    showToast('Plantilla cargada. Ajuste los parámetros y guarde para registrar.');
  };

  // Guardar creación o edición
  const handleGuardarPeligro = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formProceso.trim()) {
      alert('Por favor ingrese o seleccione el proceso.');
      return;
    }
    if (!formDescripcion.trim()) {
      alert('Por favor describa el peligro identificado.');
      return;
    }

    const { np, interpProb, nr, interpRiesgo, aceptabilidad } = calculoEnVivo;
    const nombresCargos = cargosDisponibles
      .filter(c => formCargosIds.includes(c.id))
      .map(c => c.nombre);

    const peligroGuardado: PeligroRiesgoGTC45 = {
      id: peligroEnEdicionId || `pel_${Date.now()}`,
      proceso: formProceso.trim(),
      areaId: formAreaId || undefined,
      areaNombre: formAreaNombre || (areasDisponibles.find(a => a.id === formAreaId)?.nombre || ''),
      cargosExpuestosIds: formCargosIds,
      cargosExpuestosNombres: nombresCargos,
      cargoId: formCargosIds[0] || undefined,
      cargoNombre: nombresCargos[0] || undefined,
      numeroExpuestos: expuestosEstimados,
      zonaLugar: formZonaLugar.trim() || 'Sede Principal',
      actividad: formActividad.trim() || 'Actividad Operacional',
      rutinaria: formRutinaria,
      clasificacionPeligro: formClasificacion,
      descripcionPeligro: formDescripcion.trim(),
      efectosPosibles: formEfectos.trim() || 'Lesiones o afectaciones a la salud laboral',
      peorConsecuencia: formPeorConsecuencia.trim(),
      requisitoLegal: formRequisitoLegal,
      requisitoLegalDetalle: formRequisitoLegalDetalle.trim(),
      controlesExistentes: {
        fuente: formCtrlFuente.trim() || 'Sin control específico en la fuente',
        medio: formCtrlMedio.trim() || 'Señalización básica',
        individuo: formCtrlIndividuo.trim() || 'Uso de EPP estándar'
      },
      nivelDeficiencia: formND,
      nivelExposicion: formNE,
      nivelProbabilidad: np,
      interpretacionProbabilidad: interpProb,
      nivelConsecuencia: formNC,
      nivelRiesgo: nr,
      interpretacionRiesgo: interpRiesgo,
      aceptabilidadRiesgo: aceptabilidad,
      medidasIntervencion: {
        eliminacion: formMedEliminacion.trim() || 'No aplica',
        sustitucion: formMedSustitucion.trim() || 'No aplica',
        controlesIngenieria: formMedIngenieria.trim() || 'No aplica',
        controlesAdministrativos: formMedAdministrativos.trim() || 'Capacitación y sensibilización',
        epp: formMedEpp.trim() || 'Uso continuo de EPP'
      },
      fechaEvaluacion: new Date().toISOString().slice(0, 10),
      responsableEvaluacion: formResponsable.trim()
    };

    if (peligroEnEdicionId) {
      setPeligros(prev => prev.map(p => (p.id === peligroEnEdicionId ? peligroGuardado : p)));
      showToast('Evaluación de peligro actualizada con éxito.');
    } else {
      setPeligros(prev => [peligroGuardado, ...prev]);
      showToast('Nuevo peligro evaluado e integrado a la Matriz GTC 45.');
    }

    setModalFormOpen(false);
  };

  // Eliminar peligro
  const handleEliminarPeligro = (id: string) => {
    setPeligros(prev => prev.filter(p => p.id !== id));
    setConfirmarEliminarId(null);
    showToast('Peligro eliminado de la matriz.');
  };

  // Vaciar matriz / eliminar riesgos
  const handleVaciarMatriz = () => {
    if (confirm('¿Desea vaciar la matriz y eliminar todas las evaluaciones registradas? Esta acción no se puede deshacer.')) {
      setPeligros([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      showToast('Matriz de riesgos vaciada correctamente.');
    }
  };

  // Filtrado de la matriz
  const peligrosFiltrados = useMemo(() => {
    return peligros.filter(item => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincideDesc = item.descripcionPeligro.toLowerCase().includes(q);
        const coincideAct = item.actividad.toLowerCase().includes(q);
        const coincideProc = item.proceso.toLowerCase().includes(q);
        const coincideArea = (item.areaNombre || '').toLowerCase().includes(q);
        const coincideLugar = item.zonaLugar.toLowerCase().includes(q);
        const coincideCargo = (item.cargosExpuestosNombres || []).some(c => c.toLowerCase().includes(q));
        if (!coincideDesc && !coincideAct && !coincideProc && !coincideArea && !coincideLugar && !coincideCargo) {
          return false;
        }
      }

      if (filtroProceso !== 'TODOS' && item.proceso !== filtroProceso) {
        return false;
      }

      if (filtroArea !== 'TODOS') {
        if (item.areaId !== filtroArea && item.areaNombre !== filtroArea) {
          return false;
        }
      }

      if (filtroClasificacion !== 'TODOS' && item.clasificacionPeligro !== filtroClasificacion) {
        return false;
      }

      if (filtroNivelRiesgo !== 'TODOS' && item.interpretacionRiesgo !== filtroNivelRiesgo) {
        return false;
      }

      if (filtroAceptabilidad !== 'TODOS' && item.aceptabilidadRiesgo !== filtroAceptabilidad) {
        return false;
      }

      return true;
    });
  }, [peligros, busqueda, filtroProceso, filtroArea, filtroClasificacion, filtroNivelRiesgo, filtroAceptabilidad]);

  // Métricas y Diagnóstico GTC 45
  const metricas = useMemo(() => {
    let riesgoI = 0;
    let riesgoII = 0;
    let riesgoIII = 0;
    let riesgoIV = 0;
    let noAceptables = 0;
    const porClasificacion: Record<string, number> = {};
    const porProceso: Record<string, number> = {};

    peligros.forEach(p => {
      if (p.interpretacionRiesgo === 'I') riesgoI++;
      else if (p.interpretacionRiesgo === 'II') riesgoII++;
      else if (p.interpretacionRiesgo === 'III') riesgoIII++;
      else if (p.interpretacionRiesgo === 'IV') riesgoIV++;

      if (p.aceptabilidadRiesgo.includes('No Aceptable')) noAceptables++;

      porClasificacion[p.clasificacionPeligro] = (porClasificacion[p.clasificacionPeligro] || 0) + 1;
      porProceso[p.proceso] = (porProceso[p.proceso] || 0) + 1;
    });

    return {
      total: peligros.length,
      riesgoI,
      riesgoII,
      riesgoIII,
      riesgoIV,
      noAceptables,
      porClasificacion,
      porProceso
    };
  }, [peligros]);

  // Exportar a CSV
  const handleExportarCSV = () => {
    const headers = [
      'ID',
      'Proceso',
      'Área',
      'Zona/Lugar',
      'Actividad',
      'Rutinaria',
      'Clasificación',
      'Descripción del Peligro',
      'Efectos Posibles',
      'Control Fuente',
      'Control Medio',
      'Control Individuo',
      'ND',
      'NE',
      'NP',
      'Interpr Probabilidad',
      'NC',
      'NR',
      'Nivel de Riesgo',
      'Aceptabilidad',
      'Medida Eliminación',
      'Medida Sustitución',
      'Controles Ingeniería',
      'Controles Administrativos',
      'EPP'
    ];

    const rows = peligros.map(p => [
      `"${p.id}"`,
      `"${p.proceso.replace(/"/g, '""')}"`,
      `"${(p.areaNombre || '').replace(/"/g, '""')}"`,
      `"${p.zonaLugar.replace(/"/g, '""')}"`,
      `"${p.actividad.replace(/"/g, '""')}"`,
      p.rutinaria ? 'SÍ' : 'NO',
      `"${p.clasificacionPeligro}"`,
      `"${p.descripcionPeligro.replace(/"/g, '""')}"`,
      `"${p.efectosPosibles.replace(/"/g, '""')}"`,
      `"${p.controlesExistentes.fuente.replace(/"/g, '""')}"`,
      `"${p.controlesExistentes.medio.replace(/"/g, '""')}"`,
      `"${p.controlesExistentes.individuo.replace(/"/g, '""')}"`,
      p.nivelDeficiencia,
      p.nivelExposicion,
      p.nivelProbabilidad,
      `"${p.interpretacionProbabilidad}"`,
      p.nivelConsecuencia,
      p.nivelRiesgo,
      `"${p.interpretacionRiesgo}"`,
      `"${p.aceptabilidadRiesgo}"`,
      `"${p.medidasIntervencion.eliminacion.replace(/"/g, '""')}"`,
      `"${p.medidasIntervencion.sustitucion.replace(/"/g, '""')}"`,
      `"${p.medidasIntervencion.controlesIngenieria.replace(/"/g, '""')}"`,
      `"${p.medidasIntervencion.controlesAdministrativos.replace(/"/g, '""')}"`,
      `"${p.medidasIntervencion.epp.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Matriz_Peligros_Riesgos_GTC45_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#8FA7D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#18235C] text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-[#18235C]">
                Matriz de Identificación de Peligros, Evaluación y Valoración de Riesgos (GTC 45)
              </h2>
              <p className="text-xs text-[#282829]">
                Metodología Guía Técnica Colombiana GTC 45 (Segunda Actualización) integrada con procesos misionales, áreas organizacionales y cargos expuestos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setModalAnalisisOpen(true)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-blue-700" />
            <span>Diagnóstico & Análisis GTC 45</span>
          </button>

          <button
            type="button"
            onClick={handleExportarCSV}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exportar matriz completa a archivo CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Imprimir matriz oficial GTC 45"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Matriz</span>
          </button>

          <button
            type="button"
            onClick={handleAbrirCrear}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#00FF00]" />
            <span>Nuevo Peligro / Evaluación</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de Estado de Riesgo GTC 45 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-[#8FA7D6] shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#282829] tracking-wider">Total Peligros</div>
          <div className="text-xl font-bold font-serif text-[#18235C] mt-1">{metricas.total}</div>
          <div className="text-[10px] text-[#282829] mt-0.5">En la matriz activa</div>
        </div>

        <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-rose-900 tracking-wider">Nivel I (Crítico)</div>
          <div className="text-xl font-bold font-serif text-rose-700 mt-1">{metricas.riesgoI}</div>
          <div className="text-[10px] text-rose-800 mt-0.5">Intervención urgente</div>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">Nivel II (Alto)</div>
          <div className="text-xl font-bold font-serif text-amber-700 mt-1">{metricas.riesgoII}</div>
          <div className="text-[10px] text-amber-800 mt-0.5">Control específico</div>
        </div>

        <div className="p-3.5 bg-yellow-50 rounded-xl border border-yellow-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-yellow-900 tracking-wider">Nivel III (Medio)</div>
          <div className="text-xl font-bold font-serif text-yellow-800 mt-1">{metricas.riesgoIII}</div>
          <div className="text-[10px] text-yellow-800 mt-0.5">Riesgo mejorable</div>
        </div>

        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">Nivel IV (Bajo)</div>
          <div className="text-xl font-bold font-serif text-emerald-700 mt-1">{metricas.riesgoIV}</div>
          <div className="text-[10px] text-emerald-800 mt-0.5">Riesgo aceptable</div>
        </div>

        <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-300 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-purple-900 tracking-wider">Áreas / Procesos</div>
          <div className="text-xl font-bold font-serif text-purple-700 mt-1">
            {Object.keys(metricas.porProceso).length}
          </div>
          <div className="text-[10px] text-purple-800 mt-0.5">Bajo cobertura SST</div>
        </div>
      </div>

      {/* Alerta de Riesgos Críticos No Aceptables */}
      {metricas.riesgoI > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 rounded-2xl border-2 border-rose-300 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-2">
                <span>Alerta GTC 45: Se identificaron {metricas.riesgoI} peligros en Nivel I (No Aceptable)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                  Crítico
                </span>
              </h4>
              <p className="text-xs text-[#282829] mt-0.5">
                La norma GTC 45 exige suspender o no iniciar actividades asociadas a estos peligros hasta implementar controles efectivos de ingeniería y procedimientos estrictos de protección.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFiltroNivelRiesgo('I');
              setFiltroAceptabilidad('TODOS');
            }}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Filtrar Nivel I ({metricas.riesgoI})
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 bg-white rounded-xl border border-[#8FA7D6] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por peligro, actividad, proceso, área o cargo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs"
            />
          </div>

          <div>
            <select
              value={filtroProceso}
              onChange={e => setFiltroProceso(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
            >
              <option value="TODOS">Todos los Procesos</option>
              {listaProcesosDisponibles.map(pr => (
                <option key={pr} value={pr}>{pr}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filtroArea}
              onChange={e => setFiltroArea(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
            >
              <option value="TODOS">Todas las Áreas</option>
              {areasDisponibles.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filtroNivelRiesgo}
              onChange={e => setFiltroNivelRiesgo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
            >
              <option value="TODOS">Todos los Niveles (NR)</option>
              <option value="I">Nivel I (4000 - 600 Crítico)</option>
              <option value="II">Nivel II (500 - 150 Alto)</option>
              <option value="III">Nivel III (120 - 40 Medio)</option>
              <option value="IV">Nivel IV (20 Bajo)</option>
            </select>
          </div>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#8FA7D6]/30 flex-wrap text-xs">
          <span className="font-bold text-[11px] text-[#18235C] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtros por Clasificación:
          </span>
          <button
            type="button"
            onClick={() => setFiltroClasificacion('TODOS')}
            className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
              filtroClasificacion === 'TODOS'
                ? 'bg-[#18235C] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas ({peligros.length})
          </button>
          {CLASIFICACIONES_GTC45.map(c => {
            const qty = metricas.porClasificacion[c] || 0;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFiltroClasificacion(c)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border ${
                  filtroClasificacion === c
                    ? 'bg-[#18235C] text-white border-[#18235C]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c} ({qty})
              </button>
            );
          })}
        </div>
      </div>

      {/* Matriz y Listado de Peligros */}
      <div className="bg-white rounded-2xl border border-[#8FA7D6] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#8FA7D6]/40 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#18235C]" />
            <h3 className="font-bold text-sm text-[#18235C]">
              Evaluación y Valoración de Riesgos Ocupacionales
            </h3>
            <span className="text-xs text-[#282829]">({peligrosFiltrados.length} registros)</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {peligros.length > 0 && (
              <button
                type="button"
                onClick={handleVaciarMatriz}
                className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer font-semibold"
                title="Eliminar todos los registros de la matriz"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Matriz</span>
              </button>
            )}
          </div>
        </div>

        {peligrosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-[#282829] space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-[#18235C] rounded-full flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6 text-[#18235C]" />
            </div>
            <h4 className="font-bold text-sm text-[#18235C]">Matriz de Peligros y Riesgos GTC 45</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No hay evaluaciones registradas con los filtros actuales. Puede registrar una nueva evaluación utilizando los procesos, áreas y cargos creados en la estructura orgánica.
            </p>
            <button
              type="button"
              onClick={handleAbrirCrear}
              className="px-4 py-2 bg-[#18235C] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Evaluar Nuevo Peligro</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#8FA7D6]/40">
            {peligrosFiltrados.map((item, idx) => {
              const esCritico = item.interpretacionRiesgo === 'I';
              const esAlto = item.interpretacionRiesgo === 'II';

              return (
                <div
                  key={item.id || idx}
                  className={`p-5 transition-colors space-y-3 ${
                    esCritico ? 'bg-rose-50/30 hover:bg-rose-50/50' :
                    esAlto ? 'bg-amber-50/20 hover:bg-amber-50/40' :
                    'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#8FA7D6]/30 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#18235C] text-white uppercase tracking-wider">
                          {item.proceso}
                        </span>
                        {item.areaNombre && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                            Área: {item.areaNombre}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-700">
                          {item.zonaLugar}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.rutinaria ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-900 border border-orange-200'
                        }`}>
                          {item.rutinaria ? 'Rutinaria' : 'No Rutinaria'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#18235C] flex items-center gap-2">
                        <span>{item.actividad}</span>
                      </h4>

                      {/* Cargos Expuestos */}
                      {item.cargosExpuestosNombres && item.cargosExpuestosNombres.length > 0 && (
                        <div className="text-[11px] text-[#282829] flex items-center gap-1.5 flex-wrap pt-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                          <strong className="text-[#18235C]">Cargos Expuestos ({item.numeroExpuestos || 1} colaboradores):</strong>
                          <span>{item.cargosExpuestosNombres.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                        item.interpretacionRiesgo === 'I'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : item.interpretacionRiesgo === 'II'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : item.interpretacionRiesgo === 'III'
                          ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}>
                        Nivel {item.interpretacionRiesgo} (NR = {item.nivelRiesgo}) • {item.aceptabilidadRiesgo}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPeligroSeleccionado(item);
                            setModalDetalleOpen(true);
                          }}
                          className="p-1.5 text-[#18235C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Ver detalle completo de la evaluación"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicar(item)}
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Duplicar como plantilla para nueva evaluación"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAbrirEditar(item)}
                          className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar parámetros y controles"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {confirmarEliminarId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                            <button
                              type="button"
                              onClick={() => handleEliminarPeligro(item.id)}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmarEliminarId(null)}
                              className="p-0.5 text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmarEliminarId(item.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar de la matriz"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Tarjeta Identificación */}
                    <div className="p-3 bg-white rounded-xl border border-[#8FA7D6]/60 space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        Clasificación: <span className="text-[#18235C] font-extrabold">{item.clasificacionPeligro}</span>
                      </div>
                      <div className="font-semibold text-slate-800 text-[11px] leading-snug">
                        {item.descripcionPeligro}
                      </div>
                      <div className="text-[11px] text-rose-700 pt-1 border-t border-slate-100">
                        <strong>Efectos:</strong> {item.efectosPosibles}
                      </div>
                    </div>

                    {/* Tarjeta Controles Existentes */}
                    <div className="p-3 bg-white rounded-xl border border-[#8FA7D6]/60 space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        Controles Existentes
                      </div>
                      <ul className="space-y-1 text-[#282829] text-[11px]">
                        <li>• <strong>Fuente:</strong> {item.controlesExistentes.fuente || 'Sin control'}</li>
                        <li>• <strong>Medio:</strong> {item.controlesExistentes.medio || 'Sin control'}</li>
                        <li>• <strong>Individuo:</strong> {item.controlesExistentes.individuo || 'Sin control'}</li>
                      </ul>
                    </div>

                    {/* Tarjeta Valoración Cuantitativa */}
                    <div className="p-3 bg-white rounded-xl border border-[#8FA7D6]/60 space-y-1 font-mono text-[11px]">
                      <div className="text-[10px] font-bold text-slate-500 uppercase font-sans">
                        Parámetros GTC 45
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[#282829]">
                        <div>ND (Deficiencia): <strong>{item.nivelDeficiencia}</strong></div>
                        <div>NE (Exposición): <strong>{item.nivelExposicion}</strong></div>
                        <div>NP (Probabilidad): <strong>{item.nivelProbabilidad} ({item.interpretacionProbabilidad})</strong></div>
                        <div>NC (Consecuencia): <strong>{item.nivelConsecuencia}</strong></div>
                      </div>
                      <div className="text-xs font-bold text-[#18235C] pt-1 border-t border-slate-100 flex justify-between font-sans">
                        <span>NR = NP × NC = {item.nivelRiesgo}</span>
                        <span className="font-bold text-[10px] uppercase">Nivel {item.interpretacionRiesgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Medidas de intervención jerárquicas */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-[#18235C] mb-1 flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Medidas de Intervención (Jerarquía de Controles):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[10px] text-[#282829]">
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <strong className="block text-slate-600">1. Eliminación:</strong>
                        <span className="text-slate-800">{item.medidasIntervencion.eliminacion || 'No viable'}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <strong className="block text-slate-600">2. Sustitución:</strong>
                        <span className="text-slate-800">{item.medidasIntervencion.sustitucion || 'No aplica'}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <strong className="block text-slate-600">3. Control Ingeniería:</strong>
                        <span className="text-slate-800">{item.medidasIntervencion.controlesIngenieria || 'No aplica'}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <strong className="block text-slate-600">4. Administrativo:</strong>
                        <span className="text-slate-800">{item.medidasIntervencion.controlesAdministrativos || 'PTS'}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <strong className="block text-slate-600">5. EPP:</strong>
                        <span className="text-slate-800">{item.medidasIntervencion.epp || 'EPP certificado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {modalFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-[#8FA7D6] shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-[#18235C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#00FF00]" />
                <div>
                  <h3 className="font-bold text-sm">
                    {peligroEnEdicionId ? 'Modificar Evaluación de Peligro (GTC 45)' : 'Registrar Nuevo Peligro y Análisis GTC 45'}
                  </h3>
                  <p className="text-[11px] text-[#8FA7D6]">
                    Integración operacional con procesos, áreas organizacionales y cargos expuestos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalFormOpen(false)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarPeligro} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Sección 1: Contexto Operacional & Estructura Organizacional */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#18235C] border-b pb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  1. Contexto Operacional, Procesos y Cargos Expuestos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Proceso Organizacional *
                    </label>
                    {listaProcesosDisponibles.length > 0 ? (
                      <div className="space-y-1.5">
                        <select
                          value={modoNuevoProceso ? '__NUEVO__' : formProceso}
                          onChange={e => {
                            if (e.target.value === '__NUEVO__') {
                              setModoNuevoProceso(true);
                              setFormProceso('');
                            } else {
                              setModoNuevoProceso(false);
                              setFormProceso(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                          required={!modoNuevoProceso}
                        >
                          <option value="">Seleccionar Proceso Creado...</option>
                          {listaProcesosDisponibles.map(pr => (
                            <option key={pr} value={pr}>{pr}</option>
                          ))}
                          <option value="__NUEVO__">+ Ingresar otro proceso específico...</option>
                        </select>
                        {modoNuevoProceso && (
                          <input
                            type="text"
                            placeholder="Escriba el nombre del proceso..."
                            value={formProceso}
                            onChange={e => setFormProceso(e.target.value)}
                            className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                            required
                            autoFocus
                          />
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Ej. Operaciones, Gestión Humana, etc."
                        value={formProceso}
                        onChange={e => setFormProceso(e.target.value)}
                        className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Área Organizacional Creada
                    </label>
                    <select
                      value={formAreaId}
                      onChange={e => {
                        const aId = e.target.value;
                        setFormAreaId(aId);
                        const encontrada = areasDisponibles.find(a => a.id === aId);
                        if (encontrada) {
                          setFormAreaNombre(encontrada.nombre);
                          if (encontrada.procesoNombre && listaProcesosDisponibles.includes(encontrada.procesoNombre)) {
                            setFormProceso(encontrada.procesoNombre);
                          }
                        } else {
                          setFormAreaNombre('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    >
                      <option value="">
                        {areasDisponibles.length > 0 ? 'Seleccionar Área Creada...' : 'No hay áreas creadas aún'}
                      </option>
                      {areasDisponibles.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.nombre} {a.procesoNombre ? `(${a.procesoNombre})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Zona / Lugar de Trabajo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Sede Administrativa / Postería / Cuarto Eléctrico"
                      value={formZonaLugar}
                      onChange={e => setFormZonaLugar(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Actividad o Labor Evaluada *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Mantenimiento y empalme de cable de fibra óptica aérea"
                      value={formActividad}
                      onChange={e => setFormActividad(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formRutinaria}
                        onChange={e => setFormRutinaria(e.target.checked)}
                        className="rounded text-[#18235C]"
                      />
                      <span>¿Es una actividad rutinaria?</span>
                    </label>
                  </div>
                </div>

                {/* Selección de Cargos Expuestos */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[11px] text-[#18235C] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Cargos Creados Expuestos al Peligro:
                    </label>
                    <span className="text-[10px] text-slate-600 font-semibold">
                      {formCargosIds.length} seleccionados • Aprox. {expuestosEstimados} colaboradores
                    </span>
                  </div>

                  {cargosDisponibles.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-[11px]">
                      No hay cargos creados en la estructura orgánica.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                      {cargosDisponibles.map(cargo => {
                        const seleccionado = formCargosIds.includes(cargo.id);
                        return (
                          <button
                            key={cargo.id}
                            type="button"
                            onClick={() => {
                              if (seleccionado) {
                                setFormCargosIds(prev => prev.filter(id => id !== cargo.id));
                              } else {
                                setFormCargosIds(prev => [...prev, cargo.id]);
                              }
                            }}
                            className={`p-2 rounded-lg text-left text-[11px] border transition-all cursor-pointer flex items-center justify-between ${
                              seleccionado
                                ? 'bg-[#18235C] text-white border-[#18235C] font-bold shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <span className="truncate">{cargo.nombre}</span>
                            {seleccionado && <Check className="w-3 h-3 text-[#00FF00] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 2: Identificación del Peligro */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#18235C] border-b pb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  2. Identificación y Clasificación del Peligro (GTC 45)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Clasificación del Peligro *
                    </label>
                    <select
                      value={formClasificacion}
                      onChange={e => setFormClasificacion(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs font-semibold text-[#18235C]"
                      required
                    >
                      {CLASIFICACIONES_GTC45.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Peor Consecuencia Potencial
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Muerte por electrocución o caída fatal de altura"
                      value={formPeorConsecuencia}
                      onChange={e => setFormPeorConsecuencia(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Descripción Específica del Peligro y Fuente Generadora *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describa la condición subestándar, agente físico/químico o peligro específico..."
                      value={formDescripcion}
                      onChange={e => setFormDescripcion(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Efectos Posibles en la Salud o Integridad de los Trabajadores
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Fracturas, contusiones, hipoacusia neurosensorial, síndrome de túnel carpiano"
                      value={formEfectos}
                      onChange={e => setFormEfectos(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Controles Existentes */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#18235C] border-b pb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  3. Controles Existentes en la Organización
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      En la Fuente
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Mantenimiento, anclajes fijos"
                      value={formCtrlFuente}
                      onChange={e => setFormCtrlFuente(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      En el Medio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Señalización, conos, barandas"
                      value={formCtrlMedio}
                      onChange={e => setFormCtrlMedio(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      En el Individuo / Trabajador
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. EPP dieléctrico, capacitación"
                      value={formCtrlIndividuo}
                      onChange={e => setFormCtrlIndividuo(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Evaluación Cuantitativa del Riesgo (GTC 45) */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border border-blue-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#18235C] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-700" />
                    4. Evaluación Cuantitativa GTC 45 (Cálculo Automático)
                  </h4>
                  <span className="text-[10px] text-blue-900 bg-blue-100 px-2 py-0.5 rounded font-mono font-bold">
                    NR = (ND × NE) × NC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Selector ND */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Nivel de Deficiencia (ND)
                    </label>
                    <select
                      value={formND}
                      onChange={e => setFormND(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold"
                    >
                      <option value={10}>10 - Muy Alto (Peligros graves, sin controles)</option>
                      <option value={6}>6 - Alto (Peligros significativos, controles bajos)</option>
                      <option value={2}>2 - Medio (Peligros menores o controles moderados)</option>
                      <option value={0}>0 - Bajo / Sin Deficiencia</option>
                    </select>
                    <p className="text-[10px] text-slate-500">
                      Eficacia de las medidas preventivas existentes frente al peligro.
                    </p>
                  </div>

                  {/* Selector NE */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Nivel de Exposición (NE)
                    </label>
                    <select
                      value={formNE}
                      onChange={e => setFormNE(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold"
                    >
                      <option value={4}>4 - Continua (Sin interrupción en la jornada)</option>
                      <option value={3}>3 - Frecuente (Varias veces por tiempos cortos)</option>
                      <option value={2}>2 - Ocasional (Alguna vez por período corto)</option>
                      <option value={1}>1 - Esporádica (Irregularmente en el mes)</option>
                    </select>
                    <p className="text-[10px] text-slate-500">
                      Frecuencia y permanencia con que se presenta la exposición.
                    </p>
                  </div>

                  {/* Selector NC */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Nivel de Consecuencia (NC)
                    </label>
                    <select
                      value={formNC}
                      onChange={e => setFormNC(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold"
                    >
                      <option value={100}>100 - Mortal o Catastrófico (Muerte)</option>
                      <option value={60}>60 - Muy Grave (Invalidez o daño irreparable)</option>
                      <option value={25}>25 - Grave (Incapacidad temporal severa)</option>
                      <option value={10}>10 - Leve (Lesiones sin incapacidad médica)</option>
                    </select>
                    <p className="text-[10px] text-slate-500">
                      Severidad de las consecuencias sobre salud o vida.
                    </p>
                  </div>
                </div>

                {/* Banner de Resultado Cuantitativo en Tiempo Real */}
                <div className="p-3.5 bg-white rounded-xl border-2 border-blue-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs font-mono">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-900 font-bold text-center leading-tight">
                      <div className="text-[9px] uppercase font-sans">Probabilidad (NP)</div>
                      <div className="text-sm font-extrabold">{calculoEnVivo.np}</div>
                      <div className="text-[9px] font-sans font-semibold">({calculoEnVivo.interpProb})</div>
                    </div>

                    <div className="text-xl font-bold text-slate-400">×</div>

                    <div className="p-2 bg-slate-100 rounded-lg text-slate-800 font-bold text-center leading-tight">
                      <div className="text-[9px] uppercase font-sans">Consecuencia (NC)</div>
                      <div className="text-sm font-extrabold">{formNC}</div>
                    </div>

                    <div className="text-xl font-bold text-slate-400">=</div>

                    <div className="p-2 bg-[#18235C] rounded-lg text-white font-bold text-center leading-tight">
                      <div className="text-[9px] uppercase text-[#00FF00] font-sans">Nivel Riesgo (NR)</div>
                      <div className="text-base font-extrabold text-[#00FF00]">{calculoEnVivo.nr}</div>
                    </div>
                  </div>

                  <div className="text-right font-sans">
                    <div className="text-[11px] text-slate-500 uppercase font-bold">Interpretación & Aceptabilidad:</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block mt-0.5 border ${
                      calculoEnVivo.interpRiesgo === 'I'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : calculoEnVivo.interpRiesgo === 'II'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : calculoEnVivo.interpRiesgo === 'III'
                        ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      Nivel {calculoEnVivo.interpRiesgo} • {calculoEnVivo.aceptabilidad}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección 5: Medidas de Intervención por Jerarquía de Controles */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#18235C] border-b pb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  5. Formulación de Medidas de Intervención (Jerarquía de Controles)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Eliminación
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. No viable técnicamente o rediseño de tarea"
                      value={formMedEliminacion}
                      onChange={e => setFormMedEliminacion(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Sustitución
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cambio de químico por producto ecológico"
                      value={formMedSustitucion}
                      onChange={e => setFormMedSustitucion(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Controles de Ingeniería
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Líneas de vida certificadas, plataformas"
                      value={formMedIngenieria}
                      onChange={e => setFormMedIngenieria(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      4. Controles Administrativos, Señalización y Procedimientos
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. ATS, permiso de trabajo en alturas, inspecciones preoperacionales"
                      value={formMedAdministrativos}
                      onChange={e => setFormMedAdministrativos(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      5. Equipos y Elementos de Protección Personal (EPP)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Arnés ANSI Z359, casco dieléctrico clase E"
                      value={formMedEpp}
                      onChange={e => setFormMedEpp(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Responsable del Seguimiento y Control
                    </label>
                    <input
                      type="text"
                      value={formResponsable}
                      onChange={e => setFormResponsable(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Requisito Legal Vinculado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Res. 4272/2021 (Alturas), RETIE (Eléctrico)"
                      value={formRequisitoLegalDetalle}
                      onChange={e => setFormRequisitoLegalDetalle(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8FA7D6] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#8FA7D6]/40">
                <button
                  type="button"
                  onClick={() => setModalFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {peligroEnEdicionId ? 'Guardar Cambios de Evaluación' : 'Asentar Peligro en la Matriz GTC 45'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE COMPLETO */}
      {modalDetalleOpen && peligroSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#8FA7D6] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#18235C]" />
                <h3 className="font-bold text-sm text-[#18235C]">
                  Ficha Técnica de Evaluación GTC 45
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalleOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Proceso & Área</div>
                <div className="text-sm font-bold text-[#18235C]">{peligroSeleccionado.proceso}</div>
                <div className="text-slate-600">
                  {peligroSeleccionado.areaNombre && <strong>Área: {peligroSeleccionado.areaNombre} • </strong>}
                  Lugar: {peligroSeleccionado.zonaLugar}
                </div>
              </div>

              <div>
                <strong>Actividad:</strong> {peligroSeleccionado.actividad} ({peligroSeleccionado.rutinaria ? 'Rutinaria' : 'No Rutinaria'})
              </div>

              {peligroSeleccionado.cargosExpuestosNombres && (
                <div>
                  <strong>Cargos Expuestos ({peligroSeleccionado.numeroExpuestos || 1}):</strong> {peligroSeleccionado.cargosExpuestosNombres.join(', ')}
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="font-bold text-amber-900">
                  Clasificación: {peligroSeleccionado.clasificacionPeligro}
                </div>
                <div className="text-slate-800 mt-1">{peligroSeleccionado.descripcionPeligro}</div>
                <div className="text-rose-700 font-semibold mt-1">Efectos: {peligroSeleccionado.efectosPosibles}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200 font-mono">
                <div>ND: {peligroSeleccionado.nivelDeficiencia}</div>
                <div>NE: {peligroSeleccionado.nivelExposicion}</div>
                <div>NP: {peligroSeleccionado.nivelProbabilidad} ({peligroSeleccionado.interpretacionProbabilidad})</div>
                <div>NC: {peligroSeleccionado.nivelConsecuencia}</div>
                <div className="col-span-2 text-sm font-bold text-[#18235C] pt-1 border-t border-blue-300 font-sans">
                  NR = {peligroSeleccionado.nivelRiesgo} (Nivel {peligroSeleccionado.interpretacionRiesgo}) • {peligroSeleccionado.aceptabilidadRiesgo}
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
                <div className="font-bold text-[#18235C]">Medidas de Intervención:</div>
                <div>• Eliminación: {peligroSeleccionado.medidasIntervencion.eliminacion}</div>
                <div>• Sustitución: {peligroSeleccionado.medidasIntervencion.sustitucion}</div>
                <div>• Control Ingeniería: {peligroSeleccionado.medidasIntervencion.controlesIngenieria}</div>
                <div>• Controles Administrativos: {peligroSeleccionado.medidasIntervencion.controlesAdministrativos}</div>
                <div>• EPP: {peligroSeleccionado.medidasIntervencion.epp}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalDetalleOpen(false)}
                className="px-4 py-2 bg-[#18235C] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DIAGNÓSTICO & ANÁLISIS GTC 45 */}
      {modalAnalisisOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#8FA7D6] shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-700" />
                <div>
                  <h3 className="font-bold text-sm text-[#18235C]">
                    Diagnóstico Integral de Riesgos GTC 45 — {razonSocial}
                  </h3>
                  <p className="text-[11px] text-slate-500">{nitCompleto}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAnalisisOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matriz de Resumen de Aceptabilidad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl">
                <div className="text-[10px] font-bold text-rose-800 uppercase">Nivel I (No Aceptable)</div>
                <div className="text-2xl font-bold font-serif text-rose-700 mt-1">{metricas.riesgoI}</div>
                <div className="text-[10px] text-rose-700 mt-0.5">Parada inmediata</div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl">
                <div className="text-[10px] font-bold text-amber-800 uppercase">Nivel II (Específico)</div>
                <div className="text-2xl font-bold font-serif text-amber-700 mt-1">{metricas.riesgoII}</div>
                <div className="text-[10px] text-amber-700 mt-0.5">Control preventivo</div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-xl">
                <div className="text-[10px] font-bold text-yellow-800 uppercase">Nivel III (Mejorable)</div>
                <div className="text-2xl font-bold font-serif text-yellow-700 mt-1">{metricas.riesgoIII}</div>
                <div className="text-[10px] text-yellow-700 mt-0.5">Optimizar controles</div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                <div className="text-[10px] font-bold text-emerald-800 uppercase">Nivel IV (Aceptable)</div>
                <div className="text-2xl font-bold font-serif text-emerald-700 mt-1">{metricas.riesgoIV}</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Mantener medidas</div>
              </div>
            </div>

            {/* Distribución por Clasificación de Peligros */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#18235C]">
                Distribución de Peligros por Tipología GTC 45:
              </h4>

              <div className="space-y-1.5">
                {Object.entries(metricas.porClasificacion).map(([clasif, count]) => {
                  const pct = Math.round((count / (metricas.total || 1)) * 100);
                  return (
                    <div key={clasif} className="space-y-0.5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>{clasif}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#18235C] h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribución por Proceso */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#18235C]">
                Carga de Peligros por Proceso Evaluado:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(metricas.porProceso).map(([proc, count]) => (
                  <div key={proc} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{proc}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-[#18235C] text-white text-[10px]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setModalAnalisisOpen(false)}
                className="px-4 py-2 bg-[#18235C] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
