import React, { useState } from 'react';
import { CategoriaEPP, ItemInventarioEPP } from '../types';
import {
  PackagePlus,
  X,
  Warehouse,
  Calendar,
  Truck,
  Layers,
  ShieldCheck,
  Tag,
  Hash,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface IngresarEppModalProps {
  inventarioEpp: ItemInventarioEPP[];
  onClose: () => void;
  onGuardarIngreso: (nuevoInventario: ItemInventarioEPP[], mensajeExito: string) => void;
}

export const IngresarEppModal: React.FC<IngresarEppModalProps> = ({
  inventarioEpp,
  onClose,
  onGuardarIngreso
}) => {
  const [modoIngreso, setModoIngreso] = useState<'existente' | 'nuevo'>(
    inventarioEpp.length > 0 ? 'existente' : 'nuevo'
  );

  // Selector para item existente
  const [eppSeleccionadoId, setEppSeleccionadoId] = useState<string>(
    inventarioEpp[0]?.id || ''
  );

  // Campos específicos solicitados
  const [nombre, setNombre] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(10);
  const [fechaIngreso, setFechaIngreso] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [proveedor, setProveedor] = useState<string>('');
  const [lote, setLote] = useState<string>('');

  // Campos complementarios para nuevo elemento
  const [categoria, setCategoria] = useState<CategoriaEPP>('Protección Cabeza');
  const [codigo, setCodigo] = useState<string>('');
  const [normaTecnica, setNormaTecnica] = useState<string>('ANSI / OSHA');
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [unidad, setUnidad] = useState<'Unidad' | 'Par' | 'Juego / Kit' | 'Caja'>('Unidad');
  const [vidaUtilDias, setVidaUtilDias] = useState<number>(180);
  const [tallasTexto, setTallasTexto] = useState<string>('Única');
  const [descripcion, setDescripcion] = useState<string>('');
  const [ubicacionAlmacen, setUbicacionAlmacen] = useState<string>('Bodega Principal - Estante A');
  const [precioUnitarioCOP, setPrecioUnitarioCOP] = useState<number>(0);

  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const categoriasDisponibles: CategoriaEPP[] = [
    'Protección Cabeza',
    'Protección Visual y Facial',
    'Protección Auditiva',
    'Protección Respiratoria',
    'Protección Manos',
    'Protección Pies',
    'Trabajo Seguro en Alturas',
    'Protección Corporal / Ropa de Trabajo'
  ];

  const itemExistente = inventarioEpp.find(i => i.id === eppSeleccionadoId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (cantidad <= 0 || isNaN(cantidad)) {
      setErrorValidacion('La cantidad a ingresar debe ser un número entero mayor a 0.');
      return;
    }

    if (!fechaIngreso) {
      setErrorValidacion('Debe especificar la fecha de ingreso al inventario.');
      return;
    }

    if (!proveedor.trim()) {
      setErrorValidacion('Debe ingresar el nombre del proveedor o fabricante.');
      return;
    }

    if (!lote.trim()) {
      setErrorValidacion('Debe ingresar el número o código de lote de fabricación.');
      return;
    }

    if (modoIngreso === 'existente') {
      if (!itemExistente) {
        setErrorValidacion('Por favor seleccione un elemento de protección del catálogo.');
        return;
      }

      const nuevoInventario = inventarioEpp.map(item => {
        if (item.id === itemExistente.id) {
          return {
            ...item,
            stockActual: item.stockActual + Number(cantidad),
            proveedor: proveedor.trim(),
            lote: lote.trim(),
            fechaIngreso: fechaIngreso
          };
        }
        return item;
      });

      onGuardarIngreso(
        nuevoInventario,
        `Se ingresaron ${cantidad} ${itemExistente.unidad}(es) al stock de "${itemExistente.nombre}" (Lote: ${lote}).`
      );
      onClose();
    } else {
      // Modo Nuevo Elemento
      if (!nombre.trim()) {
        setErrorValidacion('Debe ingresar el nombre del nuevo elemento EPP.');
        return;
      }

      const codigoFinal = codigo.trim() || `EPP-${categoria.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const tallas = tallasTexto
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const nuevoItem: ItemInventarioEPP = {
        id: `epp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        codigo: codigoFinal,
        nombre: nombre.trim(),
        categoria,
        normaTecnica: normaTecnica.trim() || 'Norma Técnica Homologada',
        stockActual: Number(cantidad),
        stockMinimo: Number(stockMinimo) || 5,
        unidad,
        vidaUtilDias: Number(vidaUtilDias) || 180,
        tallasDisponibles: tallas.length > 0 ? tallas : ['Única'],
        descripcion: descripcion.trim() || `${nombre.trim()} para seguridad industrial y protección laboral.`,
        ubicacionAlmacen: ubicacionAlmacen.trim() || 'Bodega Principal',
        proveedor: proveedor.trim(),
        lote: lote.trim(),
        fechaIngreso: fechaIngreso,
        precioUnitarioEstimadoCOP: Number(precioUnitarioCOP) || 0
      };

      const nuevoInventario = [nuevoItem, ...inventarioEpp];
      onGuardarIngreso(
        nuevoInventario,
        `Se registró con éxito el nuevo EPP "${nuevoItem.nombre}" con ${cantidad} unidades iniciales (Lote: ${lote}).`
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#8FA7D6]/40 max-w-2xl w-full flex flex-col overflow-hidden my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#18235C] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <PackagePlus className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Ingreso de Elementos al Inventario (EPP)</h3>
              <span className="text-[11px] text-[#8FA7D6] block">
                Entrada formal a bodega, control de existencias, lotes y proveedores · B GROUP
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-lg font-bold transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Selector de modo: Existente vs Nuevo */}
          <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 border border-[#8FA7D6]/30">
            <button
              type="button"
              onClick={() => {
                setModoIngreso('existente');
                setErrorValidacion(null);
              }}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                modoIngreso === 'existente'
                  ? 'bg-white text-[#18235C] shadow-xs border border-[#8FA7D6]/40'
                  : 'text-[#282829]/70 hover:text-[#18235C]'
              }`}
            >
              <Warehouse className="w-4 h-4 text-[#18235C]" />
              <span>Añadir a Referencia Existente</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModoIngreso('nuevo');
                setErrorValidacion(null);
              }}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                modoIngreso === 'nuevo'
                  ? 'bg-white text-[#18235C] shadow-xs border border-[#8FA7D6]/40'
                  : 'text-[#282829]/70 hover:text-[#18235C]'
              }`}
            >
              <PackagePlus className="w-4 h-4 text-emerald-600" />
              <span>Registrar Nuevo Elemento EPP</span>
            </button>
          </div>

          {errorValidacion && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* MODO 1: Referencia Existente */}
          {modoIngreso === 'existente' && (
            <div className="p-4 bg-slate-50 border border-[#8FA7D6]/30 rounded-xl space-y-3">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Seleccionar EPP del Catálogo: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={eppSeleccionadoId}
                  onChange={e => setEppSeleccionadoId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  required
                >
                  {inventarioEpp.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.codigo}] {item.nombre} (Stock actual: {item.stockActual} {item.unidad})
                    </option>
                  ))}
                </select>
              </div>

              {itemExistente && (
                <div className="grid grid-cols-3 gap-2 text-[11px] p-2.5 bg-white rounded-lg border border-[#8FA7D6]/20">
                  <div>
                    <span className="text-slate-500 block">Categoría:</span>
                    <strong className="text-[#18235C]">{itemExistente.categoria}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Stock Actual:</span>
                    <strong className="text-emerald-700">{itemExistente.stockActual} {itemExistente.unidad}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ubicación Bodega:</span>
                    <strong className="text-[#18235C]">{itemExistente.ubicacionAlmacen}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO 2: Nuevo Elemento EPP */}
          {modoIngreso === 'nuevo' && (
            <div className="space-y-3 p-4 bg-slate-50 border border-[#8FA7D6]/30 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Nombre del EPP: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Casco Dieléctrico con Barbuquejo"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Categoría de Protección: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value as CategoriaEPP)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  >
                    {categoriasDisponibles.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Código Referencia:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. EPP-CAS-02 (Opcional)"
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Norma Técnica / Homologación:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. ANSI Z89.1 / NTC 1523"
                    value={normaTecnica}
                    onChange={e => setNormaTecnica(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Unidad de Medida:
                  </label>
                  <select
                    value={unidad}
                    onChange={e => setUnidad(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Par">Par</option>
                    <option value="Juego / Kit">Juego / Kit</option>
                    <option value="Caja">Caja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Stock Mínimo (Alerta):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockMinimo}
                    onChange={e => setStockMinimo(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Vida Útil Estimada (Días):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={vidaUtilDias}
                    onChange={e => setVidaUtilDias(parseInt(e.target.value) || 180)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Tallas Disponibles:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Única o S, M, L o 38, 39, 40"
                    value={tallasTexto}
                    onChange={e => setTallasTexto(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Ubicación en Almacén / Bodega:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Estante C - Gaveta 3"
                    value={ubicacionAlmacen}
                    onChange={e => setUbicacionAlmacen(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Descripción / Especificaciones:
                  </label>
                  <input
                    type="text"
                    placeholder="Breve descripción técnica"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS OBLIGATORIOS DEL INGRESO: Cantidad, Fecha de Ingreso, Proveedor y Lote */}
          <div className="border-t border-[#8FA7D6]/30 pt-4 space-y-3">
            <h4 className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#18235C]" />
              Datos del Lote e Ingreso a Almacén
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Cantidad a Ingresar: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cantidad}
                  onChange={e => setCantidad(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Fecha de Ingreso: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={fechaIngreso}
                  onChange={e => setFechaIngreso(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Proveedor / Distribuidor: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 3M Colombia SAS / Steelpro Safety"
                  value={proveedor}
                  onChange={e => setProveedor(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Número de Lote / Factura: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. LOT-2026-049 / FAC-8891"
                  value={lote}
                  onChange={e => setLote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#8FA7D6]/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#8FA7D6] rounded-xl text-xs font-semibold text-[#282829] hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
              <span>Registrar Ingreso de EPP</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
