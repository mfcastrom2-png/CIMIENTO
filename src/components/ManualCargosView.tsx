import React, { useState } from 'react';
import { Cargo, FichaCargo } from '../types';
import {
  FileText,
  Shield,
  Award,
  CheckCircle,
  Clock,
  History,
  Trash2,
  Plus,
  Save,
  Check
} from 'lucide-react';
import { uid, fichaVacia } from '../data/initialData';
import { generarSiguienteCodigo } from '../lib/codigoUtils';

interface ManualCargosViewProps {
  cargos: Cargo[];
  selectedCargoId?: string;
  onSelectCargo?: (id: string) => void;
  onUpdateCargoFicha?: (cargoId: string, updatedFicha: FichaCargo) => void;
  onUpdateCargo?: (cargo: Cargo) => void;
  onAddCargo?: (cargo: Cargo) => void;
}

export const ManualCargosView: React.FC<ManualCargosViewProps> = ({
  cargos,
  selectedCargoId,
  onSelectCargo,
  onUpdateCargoFicha,
  onUpdateCargo,
  onAddCargo,
}) => {
  const [internalId, setInternalId] = useState<string>(cargos[0]?.id || "");
  const activeId = selectedCargoId || internalId;
  const currentCargo = cargos.find(c => c.id === activeId) || cargos[0];
  const handleSelect = (id: string) => {
    setInternalId(id);
    if (onSelectCargo) onSelectCargo(id);
  };
  const [activeTab, setActiveTab] = useState<string>('ident');
  const [saveToast, setSaveToast] = useState(false);

  // Form states for adding items
  const [fnTexto, setFnTexto] = useState('');
  const [fnCondicion, setFnCondicion] = useState('');
  const [fnResultado, setFnResultado] = useState('');
  const [fnCriticidad, setFnCriticidad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');

  const [rsCategoria, setRsCategoria] = useState<any>('Operativa');
  const [rsDescripcion, setRsDescripcion] = useState('');

  const [inNombre, setInNombre] = useState('');
  const [inFormula, setInFormula] = useState('');
  const [inUnidad, setInUnidad] = useState('%');
  const [inFrecuencia, setInFrecuencia] = useState<'Mensual' | 'Trimestral' | 'Semestral' | 'Anual'>('Mensual');
  const [inPeso, setInPeso] = useState<number>(15);

  const [cpNombre, setCpNombre] = useState('');
  const [cpTipo, setCpTipo] = useState<'Corporativa' | 'Técnica'>('Técnica');
  const [cpNivel, setCpNivel] = useState<'Básico' | 'Intermedio' | 'Alto'>('Alto');
  const [cpConductas, setCpConductas] = useState('');

  const [noNorma, setNoNorma] = useState('');
  const [noTema, setNoTema] = useState('');

  const [docNombre, setDocNombre] = useState('');

  // Version modal state
  const [versionModal, setVersionModal] = useState(false);
  const [vMotivo, setVMotivo] = useState('');
  const [vResponsable, setVResponsable] = useState('Gestión Humana');
  const [vAprobador, setVAprobador] = useState('Gerencia General');

  // Modal Nuevo Cargo
  const [modalNuevoCargo, setModalNuevoCargo] = useState(false);
  const [nuevoNombreCargo, setNuevoNombreCargo] = useState('');
  const [nuevoCodigoCargo, setNuevoCodigoCargo] = useState('');
  const [nuevoAreaCargo, setNuevoAreaCargo] = useState('Operaciones');
  const [nuevoProcesoCargo, setNuevoProcesoCargo] = useState('Gestión Integral');
  const [nuevoReportaA, setNuevoReportaA] = useState('');

  const abrirModalNuevoCargo = () => {
    const codigosExistentes = cargos.map(c => c.ficha?.identificacion?.codigo);
    setNuevoCodigoCargo(generarSiguienteCodigo('CAR', codigosExistentes));
    setNuevoNombreCargo('');
    setNuevoAreaCargo('Operaciones');
    setNuevoProcesoCargo('Gestión Integral');
    setNuevoReportaA('');
    setModalNuevoCargo(true);
  };

  const handleCrearCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreCargo.trim()) return;
    const codigosExistentes = cargos.map(c => c.ficha?.identificacion?.codigo);
    const codigoFinal = nuevoCodigoCargo.trim() || generarSiguienteCodigo('CAR', codigosExistentes);

    const nuevaFicha = fichaVacia({
      identificacion: {
        codigo: codigoFinal,
        familia: 'General',
        area: nuevoAreaCargo.trim() || 'Operaciones',
        proceso: nuevoProcesoCargo.trim() || 'Gestión Integral',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Presencial',
        ubicacion: 'Sede principal Bogotá',
        personalACargo: '0',
        estado: 'Vigente',
        version: '1.0'
      },
      proposito: `Garantizar el cumplimiento eficiente y seguro de las actividades correspondientes al cargo de ${nuevoNombreCargo.trim()}.`,
      historial: [{
        id: uid('h'),
        version: '1.0',
        fecha: new Date().toISOString().slice(0, 10),
        motivo: 'Creación de ficha técnica de cargo',
        responsable: 'Gestión Humana B GROUP',
        aprobador: 'Gerencia General'
      }]
    });

    const nuevo: Cargo = {
      id: uid('c'),
      nombre: nuevoNombreCargo.trim(),
      reportaA: nuevoReportaA || null,
      ficha: nuevaFicha
    };

    if (onAddCargo) onAddCargo(nuevo);
    setInternalId(nuevo.id);
    if (onSelectCargo) onSelectCargo(nuevo.id);
    setModalNuevoCargo(false);
  };

  if (!currentCargo) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#8FA7D6] space-y-4">
        <p className="text-sm text-[#282829]">No hay ningún cargo registrado en la estructura.</p>
        {onAddCargo && (
          <button
            onClick={abrirModalNuevoCargo}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-[#00FF00]" />
            <span>Crear Primer Cargo (CAR-001)</span>
          </button>
        )}
      </div>
    );
  }

  const f = currentCargo.ficha;

  const triggerSavedToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2200);
  };

  const handleUpdateFicha = (partial: Partial<FichaCargo>) => {
    const updated = {
      ...f,
      ...partial
    };
    onUpdateCargoFicha(currentCargo.id, updated);
    triggerSavedToast();
  };

  // Add sub-items
  const addFuncion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fnTexto.trim()) return;
    const item = {
      id: uid('fn'),
      texto: fnTexto.trim(),
      condicion: fnCondicion.trim(),
      resultado: fnResultado.trim(),
      criticidad: fnCriticidad,
      estado: 'Vigente'
    };
    handleUpdateFicha({ funciones: [...f.funciones, item] });
    setFnTexto('');
    setFnCondicion('');
    setFnResultado('');
  };

  const deleteFuncion = (id: string) => {
    handleUpdateFicha({ funciones: f.funciones.filter(x => x.id !== id) });
  };

  const addResponsabilidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsDescripcion.trim()) return;
    const item = {
      id: uid('rs'),
      categoria: rsCategoria,
      descripcion: rsDescripcion.trim()
    };
    handleUpdateFicha({ responsabilidades: [...f.responsabilidades, item] });
    setRsDescripcion('');
  };

  const deleteResponsabilidad = (id: string) => {
    handleUpdateFicha({ responsabilidades: f.responsabilidades.filter(x => x.id !== id) });
  };

  const addIndicador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inNombre.trim()) return;
    const item = {
      id: uid('in'),
      nombre: inNombre.trim(),
      formula: inFormula.trim(),
      unidad: inUnidad.trim(),
      frecuencia: inFrecuencia,
      pesoSugerido: inPeso
    };
    handleUpdateFicha({ indicadores: [...f.indicadores, item] });
    setInNombre('');
    setInFormula('');
  };

  const deleteIndicador = (id: string) => {
    handleUpdateFicha({ indicadores: f.indicadores.filter(x => x.id !== id) });
  };

  const addCompetencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpNombre.trim()) return;
    const item = {
      id: uid('cp'),
      nombre: cpNombre.trim(),
      tipo: cpTipo,
      nivel: cpNivel,
      conductas: cpConductas.trim()
    };
    handleUpdateFicha({ competencias: [...f.competencias, item] });
    setCpNombre('');
    setCpConductas('');
  };

  const deleteCompetencia = (id: string) => {
    handleUpdateFicha({ competencias: f.competencias.filter(x => x.id !== id) });
  };

  const addNormativa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noNorma.trim()) return;
    const item = {
      id: uid('nm'),
      norma: noNorma.trim(),
      tema: noTema.trim(),
      vigencia: 'Vigente'
    };
    handleUpdateFicha({
      cumplimiento: {
        ...f.cumplimiento,
        normativa: [...f.cumplimiento.normativa, item]
      }
    });
    setNoNorma('');
    setNoTema('');
  };

  const deleteNormativa = (id: string) => {
    handleUpdateFicha({
      cumplimiento: {
        ...f.cumplimiento,
        normativa: f.cumplimiento.normativa.filter(x => x.id !== id)
      }
    });
  };

  const addDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNombre.trim()) return;
    const item = { id: uid('doc'), nombre: docNombre.trim() };
    handleUpdateFicha({ documentos: [...f.documentos, item] });
    setDocNombre('');
  };

  const deleteDocumento = (id: string) => {
    handleUpdateFicha({ documentos: f.documentos.filter(x => x.id !== id) });
  };

  const registrarNuevaVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vMotivo.trim() || !vAprobador.trim()) return;

    const actual = f.identificacion.version;
    const parts = actual.split('.');
    const nueva = `${parts[0]}.${Number(parts[1] || 0) + 1}`;

    const itemHist = {
      id: uid('h'),
      version: nueva,
      fecha: new Date().toISOString().slice(0, 10),
      motivo: vMotivo.trim(),
      responsable: vResponsable.trim(),
      aprobador: vAprobador.trim()
    };

    handleUpdateFicha({
      identificacion: {
        ...f.identificacion,
        version: nueva,
        estado: 'Vigente'
      },
      historial: [...f.historial, itemHist]
    });

    setVMotivo('');
    setVersionModal(false);
  };

  const tabs = [
    { id: 'ident', label: 'Identificación' },
    { id: 'proposito', label: 'Propósito' },
    { id: 'funciones', label: `Funciones (${f?.funciones?.length || 0})` },
    { id: 'resp', label: `Responsabilidades (${f?.responsabilidades?.length || 0})` },
    { id: 'indic', label: `Indicadores (${f?.indicadores?.length || 0})` },
    { id: 'autoridad', label: 'Autoridad & Relaciones' },
    { id: 'comp', label: `Competencias (${f?.competencias?.length || 0})` },
    { id: 'cump', label: 'Cumplimiento & SST' },
    { id: 'hist', label: `Versiones (${f?.historial?.length || 0})` },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Save */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#18235C] text-white text-xs px-4 py-2.5 rounded shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>Cambios guardados con éxito en la ficha del cargo.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]">
        <div>
          <h1 className="font-bold tracking-tight text-3xl font-medium text-[#18235C]">
            Manual de Cargos
          </h1>
          <p className="text-sm text-[#282829] mt-1 max-w-2xl">
            Ficha técnica digital por cargo: base estructural para la evaluación de desempeño, funciones críticas, indicadores verificables y competencias conductuales.
          </p>
        </div>

        {/* Cargo Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#282829]">Seleccionar cargo:</label>
          <select
            value={currentCargo.id}
            onChange={e => handleSelect(e.target.value)}
            className="text-xs font-semibold p-2 rounded border border-[#8FA7D6] bg-white text-[#18235C] focus:outline-none focus:border-[#18235C]"
          >
            {cargos.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.ficha.identificacion.codigo || 'S/C'})
              </option>
            ))}
          </select>
          {onAddCargo && (
            <button
              onClick={abrirModalNuevoCargo}
              className="text-xs font-semibold px-3 py-2 rounded bg-[#18235C] hover:bg-[#101740] text-white flex items-center gap-1.5 transition-colors shadow-xs"
              title="Crear nuevo cargo con código institucional secuencial"
            >
              <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>Nuevo Cargo</span>
            </button>
          )}
        </div>
      </div>

      {/* Ficha Card */}
      <div className="bg-white rounded border border-[#8FA7D6] p-5 shadow-xs">
        {/* Ficha Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#8FA7D6] mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold tracking-tight text-2xl font-medium text-[#18235C]">
                {currentCargo.nombre}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#8FA7D6/20] text-[#18235C] border border-[#18235C]/20">
                {f.identificacion.estado}
              </span>
            </div>
            <p className="text-xs text-[#282829] mt-0.5">
              Código: <strong className="text-[#18235C]">{f.identificacion.codigo || 'S/C'}</strong> · Área: <strong>{f.identificacion.area || '—'}</strong> · Proceso: <strong>{f.identificacion.proceso || '—'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#282829] font-mono bg-[#F8FAFC] px-2.5 py-1 rounded border border-[#8FA7D6]">
              Versión {f.identificacion.version}
            </span>
            <button
              onClick={() => setVersionModal(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded bg-[#B5842A] hover:bg-[#966b1e] text-white transition-colors"
            >
              Nueva versión
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-2 border-b border-[#8FA7D6] overflow-x-auto pb-1 mb-5 text-xs">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 whitespace-nowrap rounded-t font-semibold transition-colors ${
                activeTab === t.id
                  ? 'text-[#18235C] border-b-2 border-[#18235C] bg-[#F8FAFC]/50'
                  : 'text-[#282829] hover:text-[#18235C]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: IDENTIFICACIÓN */}
        {activeTab === 'ident' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">Código</label>
                <input
                  type="text"
                  value={f.identificacion.codigo}
                  onChange={e => handleUpdateFicha({ identificacion: { ...f.identificacion, codigo: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">Familia</label>
                <input
                  type="text"
                  value={f.identificacion.familia}
                  onChange={e => handleUpdateFicha({ identificacion: { ...f.identificacion, familia: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">Área</label>
                <input
                  type="text"
                  value={f.identificacion.area}
                  onChange={e => handleUpdateFicha({ identificacion: { ...f.identificacion, area: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">Proceso</label>
                <input
                  type="text"
                  value={f.identificacion.proceso}
                  onChange={e => handleUpdateFicha({ identificacion: { ...f.identificacion, proceso: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">Tipo Vinculación</label>
                <input
                  type="text"
                  value={f.identificacion.tipoVinculacion}
                  onChange={e => handleUpdateFicha({ identificacion: { ...f.identificacion, tipoVinculacion: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">Modalidad</label>
                <select
                  value={f.identificacion.modalidad}
                  onChange={e => handleUpdateFicha({ identificacion: { ...f.identificacion, modalidad: e.target.value as any } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                >
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">Ubicación</label>
                <input
                  type="text"
                  value={f.identificacion.ubicacion}
                  onChange={e => handleUpdateFicha({ identificacion: { ...f.identificacion, ubicacion: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">Personal a Cargo</label>
                <input
                  type="text"
                  value={f.identificacion.personalACargo}
                  onChange={e => handleUpdateFicha({ identificacion: { ...f.identificacion, personalACargo: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6] text-xs text-[#282829]">
              Jefe Inmediato: <strong className="text-[#18235C]">{currentCargo.reportaA ? cargos.find(c => c.id === currentCargo.reportaA)?.nombre : 'Cargo Raíz (Sin superior)'}</strong>. La jerarquía se gestiona desde el módulo de Estructura Organizacional.
            </div>
          </div>
        )}

        {/* TAB: PROPÓSITO */}
        {activeTab === 'proposito' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#282829] mb-1">
                Propósito Fundamental del Cargo
              </label>
              <p className="text-xs text-[#282829] mb-2">
                Razón de ser del cargo en la organización: qué hace, para qué lo hace y cuál es el impacto esperado.
              </p>
              <textarea
                rows={5}
                value={f.proposito}
                onChange={e => handleUpdateFicha({ proposito: e.target.value })}
                className="w-full text-xs p-3 rounded border border-[#8FA7D6] bg-[#F8FAFC] focus:outline-none focus:border-[#18235C]"
                placeholder="Describa el propósito principal del cargo..."
              />
            </div>
          </div>
        )}

        {/* TAB: FUNCIONES */}
        {activeTab === 'funciones' && (
          <div className="space-y-5">
            <form onSubmit={addFuncion} className="bg-[#F8FAFC] p-3.5 rounded border border-[#8FA7D6] space-y-3">
              <div className="text-xs font-semibold text-[#18235C]">Agregar Función Esencial</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Acción (Verbo + Objeto)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Realizar empalmes de fibra óptica en cajas NAP"
                    value={fnTexto}
                    onChange={e => setFnTexto(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Condición</label>
                  <input
                    type="text"
                    placeholder="Bajo norma técnica y protocolo de SST"
                    value={fnCondicion}
                    onChange={e => setFnCondicion(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Resultado Esperado</label>
                  <input
                    type="text"
                    placeholder="Atenuación < 0.2 dB"
                    value={fnResultado}
                    onChange={e => setFnResultado(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-xs">
                  <label className="font-semibold text-[#282829]">Criticidad:</label>
                  <select
                    value={fnCriticidad}
                    onChange={e => setFnCriticidad(e.target.value as any)}
                    className="text-xs p-1.5 rounded border border-[#8FA7D6] bg-white"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar función</span>
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#8FA7D6] text-[#282829]">
                    <th className="py-2 px-3 font-semibold">Función</th>
                    <th className="py-2 px-3 font-semibold">Condición</th>
                    <th className="py-2 px-3 font-semibold">Resultado Esperado</th>
                    <th className="py-2 px-3 font-semibold">Criticidad</th>
                    <th className="py-2 px-3 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/60">
                  {f.funciones.map(fn => (
                    <tr key={fn.id} className="hover:bg-[#F8FAFC]/50">
                      <td className="py-2.5 px-3 font-medium text-[#18235C]">{fn.texto}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{fn.condicion || '—'}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{fn.resultado || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          fn.criticidad === 'Alta' ? 'bg-[#F3E3DE] text-[#A8503E]' :
                          fn.criticidad === 'Media' ? 'bg-[#F5EAD4] text-[#B5842A]' : 'bg-[#8FA7D6/20] text-[#18235C]'
                        }`}>
                          {fn.criticidad}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => deleteFuncion(fn.id)}
                          className="text-[#A8503E] hover:text-red-700 p-1"
                          title="Eliminar función"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(f.funciones?.length || 0) === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#282829]">
                        No hay funciones registradas para este cargo. Se recomiendan entre 6 y 10 funciones esenciales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: RESPONSABILIDADES */}
        {activeTab === 'resp' && (
          <div className="space-y-5">
            <form onSubmit={addResponsabilidad} className="bg-[#F8FAFC] p-3.5 rounded border border-[#8FA7D6] flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#282829] mb-1">Categoría</label>
                <select
                  value={rsCategoria}
                  onChange={e => setRsCategoria(e.target.value as any)}
                  className="text-xs p-2 rounded border border-[#8FA7D6] bg-white min-w-[130px]"
                >
                  <option value="Operativa">Operativa</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Recursos">Recursos</option>
                  <option value="Información">Información</option>
                  <option value="Cumplimiento">Cumplimiento</option>
                  <option value="Calidad">Calidad</option>
                  <option value="SST">SST</option>
                  <option value="Seguridad">Seguridad</option>
                  <option value="Ambiental">Ambiental</option>
                </select>
              </div>
              <div className="flex-1 min-w-[240px]">
                <label className="block text-[11px] font-semibold text-[#282829] mb-1">Descripción de la Responsabilidad</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Asegurar uso permanente de EPP y reporte de condiciones inseguras"
                  value={rsDescripcion}
                  onChange={e => setRsDescripcion(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </form>

            <div className="space-y-2">
              {f.responsabilidades.map(rs => (
                <div key={rs.id} className="flex items-center justify-between p-3 rounded border border-[#8FA7D6] bg-white text-xs">
                  <div>
                    <span className="font-bold text-[#18235C] mr-2">[{rs.categoria}]</span>
                    <span className="text-[#18235C]">{rs.descripcion}</span>
                  </div>
                  <button
                    onClick={() => deleteResponsabilidad(rs.id)}
                    className="text-[#A8503E] hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(f.responsabilidades?.length || 0) === 0 && (
                <div className="py-6 text-center text-xs text-[#282829]">
                  Sin responsabilidades registradas.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: INDICADORES (CONEXIÓN DIRECTA AL MODELO TÉCNICO DE EVALUACIÓN) */}
        {activeTab === 'indic' && (
          <div className="space-y-5">
            <div className="p-3 bg-[#8FA7D6/20] text-[#18235C] rounded border border-[#18235C]/20 text-xs">
              <strong>Nota técnica de alineación:</strong> Estos indicadores son tomados de forma automática al generar la evaluación de desempeño de quien ocupe este cargo (Componente 1: Resultados del cargo - 50% de la nota final).
            </div>

            <form onSubmit={addIndicador} className="bg-[#F8FAFC] p-3.5 rounded border border-[#8FA7D6] space-y-3">
              <div className="text-xs font-semibold text-[#18235C]">Nuevo Indicador de Desempeño</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Nombre del Indicador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. % órdenes sin reproceso"
                    value={inNombre}
                    onChange={e => setInNombre(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Fórmula de Cálculo</label>
                  <input
                    type="text"
                    placeholder="Órdenes OK / Total * 100"
                    value={inFormula}
                    onChange={e => setInFormula(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Unidad & Frecuencia</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="%"
                      value={inUnidad}
                      onChange={e => setInUnidad(e.target.value)}
                      className="w-14 text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                    />
                    <select
                      value={inFrecuencia}
                      onChange={e => setInFrecuencia(e.target.value as any)}
                      className="text-xs p-2 rounded border border-[#8FA7D6] bg-white flex-1"
                    >
                      <option value="Mensual">Mensual</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Anual">Anual</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Peso Sugerido (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={inPeso}
                    onChange={e => setInPeso(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar indicador</span>
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#8FA7D6] text-[#282829]">
                    <th className="py-2 px-3 font-semibold">Indicador</th>
                    <th className="py-2 px-3 font-semibold">Fórmula</th>
                    <th className="py-2 px-3 font-semibold">Unidad</th>
                    <th className="py-2 px-3 font-semibold">Frecuencia</th>
                    <th className="py-2 px-3 font-semibold">Peso Evaluación</th>
                    <th className="py-2 px-3 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/60">
                  {f.indicadores.map(ind => (
                    <tr key={ind.id} className="hover:bg-[#F8FAFC]/50">
                      <td className="py-2.5 px-3 font-medium text-[#18235C]">{ind.nombre}</td>
                      <td className="py-2.5 px-3 text-[#282829] font-mono text-[11px]">{ind.formula || '—'}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{ind.unidad}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{ind.frecuencia}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#18235C] bg-[#8FA7D6/20] px-2 py-0.5 rounded text-[11px]">
                          {ind.pesoSugerido || 10}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => deleteIndicador(ind.id)}
                          className="text-[#A8503E] hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(f.indicadores?.length || 0) === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#282829]">
                        Sin indicadores registrados. En la evaluación de desempeño este cargo no tendrá métricas objetivas directas hasta que se configuren.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: AUTORIDAD & RELACIONES */}
        {activeTab === 'autoridad' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#282829] mb-3">
                Niveles de Autoridad y Facultades
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Puede Decidir</label>
                  <textarea
                    rows={2}
                    value={f.autoridad.decide}
                    onChange={e => handleUpdateFicha({ autoridad: { ...f.autoridad, decide: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Puede Aprobar</label>
                  <textarea
                    rows={2}
                    value={f.autoridad.aprueba}
                    onChange={e => handleUpdateFicha({ autoridad: { ...f.autoridad, aprueba: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Puede Modificar</label>
                  <textarea
                    rows={2}
                    value={f.autoridad.modifica}
                    onChange={e => handleUpdateFicha({ autoridad: { ...f.autoridad, modifica: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Debe Consultar</label>
                  <textarea
                    rows={2}
                    value={f.autoridad.consulta}
                    onChange={e => handleUpdateFicha({ autoridad: { ...f.autoridad, consulta: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Debe Escalar</label>
                  <textarea
                    rows={2}
                    value={f.autoridad.escala}
                    onChange={e => handleUpdateFicha({ autoridad: { ...f.autoridad, escala: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#282829] mb-3">
                Relaciones Organizacionales e Interacción
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Supervisa A</label>
                  <input
                    type="text"
                    value={f.relaciones.supervisaA}
                    onChange={e => handleUpdateFicha({ relaciones: { ...f.relaciones, supervisaA: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Coordina Con</label>
                  <input
                    type="text"
                    value={f.relaciones.coordinaCon}
                    onChange={e => handleUpdateFicha({ relaciones: { ...f.relaciones, coordinaCon: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Soporta A</label>
                  <input
                    type="text"
                    value={f.relaciones.soportaA}
                    onChange={e => handleUpdateFicha({ relaciones: { ...f.relaciones, soportaA: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Recibe De</label>
                  <input
                    type="text"
                    value={f.relaciones.recibeDe}
                    onChange={e => handleUpdateFicha({ relaciones: { ...f.relaciones, recibeDe: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Entrega A</label>
                  <input
                    type="text"
                    value={f.relaciones.entregaA}
                    onChange={e => handleUpdateFicha({ relaciones: { ...f.relaciones, entregaA: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Consulta A</label>
                  <input
                    type="text"
                    value={f.relaciones.consultaA}
                    onChange={e => handleUpdateFicha({ relaciones: { ...f.relaciones, consultaA: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: COMPETENCIAS & REQUISITOS (CONEXIÓN DIRECTA AL MODELO TÉCNICO) */}
        {activeTab === 'comp' && (
          <div className="space-y-6">
            <div className="p-3 bg-[#8FA7D6/20] text-[#18235C] rounded border border-[#18235C]/20 text-xs">
              <strong>Evaluación por conductas observables:</strong> Las competencias aquí definidas alimentan el Componente 2 de la evaluación de desempeño (25% de la calificación). Se evitan preguntas subjetivas y se califican comportamientos con evidencias reales.
            </div>

            <form onSubmit={addCompetencia} className="bg-[#F8FAFC] p-3.5 rounded border border-[#8FA7D6] space-y-3">
              <div className="text-xs font-semibold text-[#18235C]">Agregar Competencia Requerida</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Nombre de la Competencia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Diagnóstico de fallas en redes"
                    value={cpNombre}
                    onChange={e => setCpNombre(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Tipo</label>
                  <select
                    value={cpTipo}
                    onChange={e => setCpTipo(e.target.value as any)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  >
                    <option value="Técnica">Técnica</option>
                    <option value="Corporativa">Corporativa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Nivel Esperado</label>
                  <select
                    value={cpNivel}
                    onChange={e => setCpNivel(e.target.value as any)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  >
                    <option value="Alto">Alto</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Básico">Básico</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#282829] mb-1">Conductas Observables Esperadas</label>
                <input
                  type="text"
                  placeholder="Ej. Aísla la causa raíz con instrumental óptico y no reemplaza equipos sin comprobar fallas"
                  value={cpConductas}
                  onChange={e => setCpConductas(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar competencia</span>
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#8FA7D6] text-[#282829]">
                    <th className="py-2 px-3 font-semibold">Competencia</th>
                    <th className="py-2 px-3 font-semibold">Tipo</th>
                    <th className="py-2 px-3 font-semibold">Nivel</th>
                    <th className="py-2 px-3 font-semibold">Conductas Observables</th>
                    <th className="py-2 px-3 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/60">
                  {f.competencias.map(cp => (
                    <tr key={cp.id} className="hover:bg-[#F8FAFC]/50">
                      <td className="py-2.5 px-3 font-medium text-[#18235C]">{cp.nombre}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cp.tipo === 'Técnica' ? 'bg-[#F5EAD4] text-[#B5842A]' : 'bg-[#8FA7D6/20] text-[#18235C]'
                        }`}>
                          {cp.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#282829] font-semibold">{cp.nivel}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{cp.conductas}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => deleteCompetencia(cp.id)}
                          className="text-[#A8503E] hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Requisitos del Cargo */}
            <div className="pt-4 border-t border-[#8FA7D6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#282829] mb-3">
                Requisitos del Perfil de Cargo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Formación Académica</label>
                  <textarea
                    rows={2}
                    value={f.requisitos.formacion}
                    onChange={e => handleUpdateFicha({ requisitos: { ...f.requisitos, formacion: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Experiencia Laboral</label>
                  <textarea
                    rows={2}
                    value={f.requisitos.experiencia}
                    onChange={e => handleUpdateFicha({ requisitos: { ...f.requisitos, experiencia: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Conocimientos Específicos</label>
                  <textarea
                    rows={2}
                    value={f.requisitos.conocimientos}
                    onChange={e => handleUpdateFicha({ requisitos: { ...f.requisitos, conocimientos: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Certificaciones / Licencias Obligatorias</label>
                  <textarea
                    rows={2}
                    value={f.requisitos.certificaciones}
                    onChange={e => handleUpdateFicha({ requisitos: { ...f.requisitos, certificaciones: e.target.value } })}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CUMPLIMIENTO & SST */}
        {activeTab === 'cump' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">
                  Seguridad y Salud en el Trabajo (SG-SST)
                </label>
                <textarea
                  rows={4}
                  value={f.cumplimiento.sst}
                  onChange={e => handleUpdateFicha({ cumplimiento: { ...f.cumplimiento, sst: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  placeholder="Responsabilidades de EPP, autocuidado y reporte de condiciones..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#282829] mb-1">
                  Protección de Datos & Confidencialidad
                </label>
                <textarea
                  rows={4}
                  value={f.cumplimiento.datos}
                  onChange={e => handleUpdateFicha({ cumplimiento: { ...f.cumplimiento, datos: e.target.value } })}
                  className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  placeholder="Custodia de información sensible, claves de acceso o credenciales..."
                />
              </div>
            </div>

            {/* Normativa */}
            <div className="pt-2 border-t border-[#8FA7D6]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#282829]">
                  Normativa Externa e Interna Aplicable
                </h3>
              </div>

              <form onSubmit={addNormativa} className="bg-[#F8FAFC] p-3 rounded border border-[#8FA7D6] flex flex-wrap gap-2 items-end mb-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Norma o Decreto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Resolución 4272 de 2021"
                    value={noNorma}
                    onChange={e => setNoNorma(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[11px] font-semibold text-[#282829] mb-1">Tema / Objeto</label>
                  <input
                    type="text"
                    placeholder="Trabajo seguro en alturas"
                    value={noTema}
                    onChange={e => setNoTema(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-[#8FA7D6] bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar norma</span>
                </button>
              </form>

              <div className="space-y-1.5">
                {f.cumplimiento.normativa.map(nm => (
                  <div key={nm.id} className="flex items-center justify-between p-2 rounded border border-[#8FA7D6] bg-white text-xs">
                    <div>
                      <strong className="text-[#18235C]">{nm.norma}</strong> — <span className="text-[#282829]">{nm.tema}</span>
                    </div>
                    <button
                      onClick={() => deleteNormativa(nm.id)}
                      className="text-[#A8503E] hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Documentos Relacionados */}
            <div className="pt-2 border-t border-[#8FA7D6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#282829] mb-2">
                Documentos y Procedimientos Asociados
              </h3>
              <form onSubmit={addDocumento} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nombre de formato, protocolo o manual..."
                  value={docNombre}
                  onChange={e => setDocNombre(e.target.value)}
                  className="flex-1 text-xs p-2 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vincular</span>
                </button>
              </form>

              <div className="space-y-1">
                {f.documentos.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-white border border-[#8FA7D6] text-xs">
                    <span className="text-[#18235C] font-medium">{doc.nombre}</span>
                    <button
                      onClick={() => deleteDocumento(doc.id)}
                      className="text-[#A8503E] hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CONTROL DE CAMBIOS Y VERSIONES */}
        {activeTab === 'hist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#282829] max-w-xl">
                Toda modificación de funciones, responsabilidades o competencias críticas debe formalizarse como una nueva versión con revisión y aprobación humana explícita.
              </p>
              <button
                onClick={() => setVersionModal(true)}
                className="px-3.5 py-2 bg-[#B5842A] hover:bg-[#966b1e] text-white text-xs font-semibold rounded flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>Registrar nueva versión</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#8FA7D6] text-[#282829]">
                    <th className="py-2 px-3 font-semibold">Versión</th>
                    <th className="py-2 px-3 font-semibold">Fecha</th>
                    <th className="py-2 px-3 font-semibold">Motivo del Ajuste</th>
                    <th className="py-2 px-3 font-semibold">Elaboró</th>
                    <th className="py-2 px-3 font-semibold">Aprobó</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/60">
                  {f.historial.slice().reverse().map(h => (
                    <tr key={h.id} className="hover:bg-[#F8FAFC]/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#18235C]">{h.version}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{h.fecha}</td>
                      <td className="py-2.5 px-3 text-[#18235C] font-medium">{h.motivo}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{h.responsable}</td>
                      <td className="py-2.5 px-3 text-[#282829] font-semibold">{h.aprobador}</td>
                    </tr>
                  ))}
                  {(f.historial?.length || 0) === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#282829]">
                        Sin historial de versiones registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nueva Versión */}
      {versionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-[#8FA7D6] max-w-md w-full p-6 shadow-xl">
            <h3 className="font-bold tracking-tight text-xl font-medium text-[#18235C] mb-1">
              Registrar y Aprobar Versión
            </h3>
            <p className="text-xs text-[#282829] mb-4">
              Formaliza los cambios en la ficha técnica del cargo {currentCargo.nombre}.
            </p>

            <form onSubmit={registrarNuevaVersion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#282829] mb-1">Motivo de la actualización *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ajuste de indicadores para alineación con modelo de evaluación"
                  value={vMotivo}
                  onChange={e => setVMotivo(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#282829] mb-1">Responsable del cambio</label>
                <input
                  type="text"
                  value={vResponsable}
                  onChange={e => setVResponsable(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#282829] mb-1">Aprobador formal *</label>
                <input
                  type="text"
                  required
                  value={vAprobador}
                  onChange={e => setVAprobador(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]">
                <button
                  type="button"
                  onClick={() => setVersionModal(false)}
                  className="px-3.5 py-2 text-[#282829] hover:bg-[#F8FAFC] rounded border border-[#8FA7D6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#B5842A] hover:bg-[#966b1e] rounded font-semibold transition-colors"
                >
                  Formalizar Versión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Nuevo Cargo */}
      {modalNuevoCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#8FA7D6]/40">
              <div>
                <h3 className="text-base font-bold text-[#18235C]">
                  Crear Nuevo Cargo Orgánico
                </h3>
                <p className="text-xs text-[#282829]/70">
                  Crea una nueva ficha de cargo con código institucional secuencial (CAR-001).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoCargo(false)}
                className="text-[#282829] hover:text-[#18235C] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearCargo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">Nombre del Cargo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Técnico de Planta Externa / Analista de Calidad"
                  value={nuevoNombreCargo}
                  onChange={e => setNuevoNombreCargo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código de Cargo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CAR-001"
                    value={nuevoCodigoCargo}
                    onChange={e => setNuevoCodigoCargo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Jefe Inmediato (Reporta a):</label>
                  <select
                    value={nuevoReportaA}
                    onChange={e => setNuevoReportaA(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                  >
                    <option value="">— Ninguno (Nivel Directivo) —</option>
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.ficha?.identificacion?.codigo || 'S/C'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Área Perteneciente</label>
                  <input
                    type="text"
                    placeholder="Ej. Operaciones"
                    value={nuevoAreaCargo}
                    onChange={e => setNuevoAreaCargo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Proceso Perteneciente</label>
                  <input
                    type="text"
                    placeholder="Ej. Operaciones de Montaje"
                    value={nuevoProcesoCargo}
                    onChange={e => setNuevoProcesoCargo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]/30">
                <button
                  type="button"
                  onClick={() => setModalNuevoCargo(false)}
                  className="px-4 py-2 font-bold text-[#282829] hover:bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#18235C] hover:bg-[#101740] rounded-xl shadow-xs"
                >
                  Crear Ficha de Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
