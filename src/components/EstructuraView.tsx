import React, { useState } from 'react';
import { Cargo, Empleado } from '../types';
import { Plus, Users, GitFork, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { fichaVacia, uid } from '../data/initialData';

interface EstructuraViewProps {
  cargos: Cargo[];
  empleados: Empleado[];
  onAddCargo: (nuevoCargo: Cargo) => void;
  onSelectCargoForManual: (cargoId: string) => void;
}

export const EstructuraView: React.FC<EstructuraViewProps> = ({
  cargos,
  empleados,
  onAddCargo,
  onSelectCargoForManual,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [reportaA, setReportaA] = useState<string>('');
  const [codigo, setCodigo] = useState('');
  const [familia, setFamilia] = useState('');
  const [area, setArea] = useState('');
  const [proceso, setProceso] = useState('');

  const handleCreateCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const nuevaFicha = fichaVacia({
      identificacion: {
        codigo: codigo.trim() || `CAR-${Math.floor(100 + Math.random() * 900)}`,
        familia: familia.trim() || 'General',
        area: area.trim() || 'Operativa',
        proceso: proceso.trim() || 'Gestión Integral',
        tipoVinculacion: 'Término indefinido',
        modalidad: 'Presencial',
        ubicacion: 'Sede principal',
        personalACargo: '0',
        estado: 'Borrador',
        version: '0.1'
      },
      proposito: `Garantizar el cumplimiento de las metas y funciones del cargo de ${nombre}.`,
      historial: [{
        id: uid('h'),
        version: '0.1',
        fecha: new Date().toISOString().slice(0, 10),
        motivo: 'Creación de estructura de cargo',
        responsable: 'Gestión Humana',
        aprobador: 'Pendiente'
      }]
    });

    const nuevo: Cargo = {
      id: uid('c'),
      nombre: nombre.trim(),
      reportaA: reportaA ? reportaA : null,
      ficha: nuevaFicha
    };

    onAddCargo(nuevo);
    setNombre('');
    setReportaA('');
    setCodigo('');
    setFamilia('');
    setArea('');
    setProceso('');
    setModalOpen(false);
  };

  const roots = cargos.filter(c => !c.reportaA);

  const renderNode = (cargo: Cargo, level: number = 0) => {
    const hijos = cargos.filter(c => c.reportaA === cargo.id);
    const personasEnCargo = empleados.filter(e => e.cargoId === cargo.id);

    return (
      <div key={cargo.id} className="relative mt-2">
        <div className="flex flex-wrap items-center gap-3 bg-white border border-[#DCD6C8] border-l-4 border-l-[#2F5D50] p-3 rounded shadow-xs hover:border-[#2F5D50] transition-colors">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-serif-title font-medium text-sm text-[#1E2A24]">
                {cargo.nombre}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F6F4EF] text-[#5B6A62] font-mono border border-[#DCD6C8]">
                {cargo.ficha.identificacion.codigo || 'S/C'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#5B6A62] mt-0.5">
              <span>{cargo.ficha.identificacion.area || 'Área no asignada'}</span>
              <span>·</span>
              <span>{cargo.ficha.identificacion.familia || 'Familia estándar'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#5B6A62] bg-[#F6F4EF] px-2.5 py-1 rounded border border-[#DCD6C8]">
              <Users className="w-3.5 h-3.5 text-[#2F5D50]" />
              <span className="font-semibold text-[#1E2A24]">{personasEnCargo.length}</span>
              <span className="hidden sm:inline">ocupante(s)</span>
            </div>

            <button
              onClick={() => onSelectCargoForManual(cargo.id)}
              className="text-xs font-semibold text-[#2F5D50] hover:bg-[#2F5D50]/10 px-2.5 py-1 rounded border border-[#2F5D50]/30 transition-colors"
            >
              Ver ficha de cargo
            </button>
          </div>
        </div>

        {hijos.length > 0 && (
          <div className="ml-5 sm:ml-8 pl-4 border-l-2 border-dashed border-[#DCD6C8] mt-2 space-y-2">
            {hijos.map(h => renderNode(h, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#DCD6C8]">
        <div>
          <h1 className="font-serif-title text-3xl font-medium text-[#1E2A24]">
            Estructura Organizacional
          </h1>
          <p className="text-sm text-[#5B6A62] mt-1 max-w-2xl">
            Jerarquía y líneas de mando. Cada cargo define sus funciones, competencias e indicadores que alimentan el modelo de evaluación.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[#2F5D50] hover:bg-[#223F37] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo cargo</span>
        </button>
      </div>

      <div className="bg-white rounded border border-[#DCD6C8] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#DCD6C8]">
          <h2 className="font-serif-title text-lg font-medium text-[#1E2A24] flex items-center gap-2">
            <GitFork className="w-4 h-4 text-[#2F5D50]" />
            <span>Organigrama Jerárquico</span>
          </h2>
          <span className="text-xs text-[#5B6A62]">
            Total {cargos.length} cargos estructurados
          </span>
        </div>

        <div className="space-y-3">
          {roots.length > 0 ? (
            roots.map(root => renderNode(root))
          ) : (
            <div className="py-12 text-center text-sm text-[#5B6A62]">
              No hay cargos creados en la estructura organizacional.
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Cargo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-[#DCD6C8] max-w-lg w-full p-6 shadow-xl">
            <h3 className="font-serif-title text-xl font-medium text-[#1E2A24] mb-1">
              Crear Nuevo Cargo
            </h3>
            <p className="text-xs text-[#5B6A62] mb-4">
              Registra el nuevo rol en el organigrama y posteriormente completa su ficha técnica.
            </p>

            <form onSubmit={handleCreateCargo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B6A62] mb-1">
                  Nombre del Cargo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Líder de Soporte Técnico"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full text-xs p-2.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] focus:outline-none focus:border-[#2F5D50]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6A62] mb-1">
                  Jefe Inmediato (Reporta a)
                </label>
                <select
                  value={reportaA}
                  onChange={e => setReportaA(e.target.value)}
                  className="w-full text-xs p-2.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] focus:outline-none focus:border-[#2F5D50]"
                >
                  <option value="">— Es un cargo raíz (Máxima autoridad) —</option>
                  {cargos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.ficha.identificacion.codigo || 'S/C'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6A62] mb-1">
                    Código de Cargo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. TEC-002"
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] focus:outline-none focus:border-[#2F5D50]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6A62] mb-1">
                    Familia de Cargos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Operaciones"
                    value={familia}
                    onChange={e => setFamilia(e.target.value)}
                    className="w-full text-xs p-2.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] focus:outline-none focus:border-[#2F5D50]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6A62] mb-1">
                    Área
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Soporte y Redes"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full text-xs p-2.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] focus:outline-none focus:border-[#2F5D50]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6A62] mb-1">
                    Proceso
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mesa de Ayuda"
                    value={proceso}
                    onChange={e => setProceso(e.target.value)}
                    className="w-full text-xs p-2.5 rounded border border-[#DCD6C8] bg-[#F6F4EF] focus:outline-none focus:border-[#2F5D50]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#DCD6C8]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#5B6A62] hover:bg-[#F6F4EF] rounded border border-[#DCD6C8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2F5D50] hover:bg-[#223F37] rounded transition-colors"
                >
                  Crear cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
