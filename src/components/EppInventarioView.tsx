import React, { useState, useMemo } from 'react';
import {
  CategoriaEPP,
  Empleado,
  ItemInventarioEPP,
  Role,
  RolSistema,
  SolicitudEntregaEPP
} from '../types';
import {
  HardHat,
  Trash2,
  Search,
  Filter,
  Plus,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Eye,
  Shield,
  Send,
  Warehouse,
  Layers,
  Calendar,
  UserCheck
} from 'lucide-react';
import { limpiarBaseEppFB } from '../lib/firebase';
import { SolicitarEppModal } from './SolicitarEppModal';
import { EntregarEppModal } from './EntregarEppModal';
import { ActaEntregaEppModal } from './ActaEntregaEppModal';

interface EppInventarioViewProps {
  userRole: Role;
  rolSistema?: RolSistema;
  currentEmpleadoId?: string;
  empleados: Empleado[];
  inventarioEpp?: ItemInventarioEPP[];
  solicitudesEpp?: SolicitudEntregaEPP[];
  onActualizarInventario?: (nuevoInventario: ItemInventarioEPP[]) => void;
  onActualizarSolicitudes?: (nuevasSolicitudes: SolicitudEntregaEPP[]) => void;
}

export const EppInventarioView: React.FC<EppInventarioViewProps> = ({
  userRole,
  rolSistema,
  currentEmpleadoId = 'e6',
  empleados,
  inventarioEpp = [],
  solicitudesEpp = [],
  onActualizarInventario = () => {},
  onActualizarSolicitudes = () => {}
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventario' | 'solicitudes'>('inventario');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  
  // Modals state
  const [modalSolicitarOpen, setModalSolicitarOpen] = useState(false);
  const [modalDepurarEppOpen, setModalDepurarEppOpen] = useState(false);
  const [depurandoEpp, setDepurandoEpp] = useState(false);
  const [mensajeDepurarEpp, setMensajeDepurarEpp] = useState<string | null>(null);

  const handleEjecutarDepuracionEpp = async () => {
    setDepurandoEpp(true);
    try {
      await limpiarBaseEppFB();
      onActualizarSolicitudes([]);
      onActualizarInventario(inventarioEpp.map(i => ({ ...i, stockActual: 0 })));
      setMensajeDepurarEpp("Base de datos de EPPs depurada exitosamente: se eliminaron solicitudes/actas y el stock quedó en 0.");
      setModalDepurarEppOpen(false);
      setTimeout(() => setMensajeDepurarEpp(null), 5000);
    } catch (e: any) {
      alert("Error al depurar EPPs: " + e.message);
    } finally {
      setDepurandoEpp(false);
    }
  };
  const [solicitudParaEntrega, setSolicitudParaEntrega] = useState<SolicitudEntregaEPP | null>(null);
  const [solicitudParaActa, setSolicitudParaActa] = useState<SolicitudEntregaEPP | null>(null);

  // Modal para agregar stock a una referencia existente
  const [stockItemEnEdicion, setStockItemEnEdicion] = useState<ItemInventarioEPP | null>(null);
  const [cantidadAjusteStock, setCantidadAjusteStock] = useState<number>(5);

  const currentEmpleado = empleados.find(e => e.id === currentEmpleadoId) || empleados[0];

  const esAdminOSst = userRole === 'admin' || rolSistema === 'superadmin' || rolSistema === 'admin_gh' || rolSistema === 'responsable_sst';
  const esSuperAdmin = rolSistema === 'superadmin';

  // KPIs
  const { totalReferencias, totalUnidadesStock, stockBajoCount, totalEntregados, pendientesCount } = useMemo(() => {
    let unidades = 0;
    let bajo = 0;
    inventarioEpp.forEach(item => {
      unidades += item.stockActual;
      if (item.stockActual <= item.stockMinimo) bajo++;
    });

    const entregados = solicitudesEpp.filter(s => s.estado === 'Entregada').length;
    const pendientes = solicitudesEpp.filter(s => s.estado === 'Pendiente' || s.estado === 'Aprobada').length;

    return {
      totalReferencias: inventarioEpp.length,
      totalUnidadesStock: unidades,
      stockBajoCount: bajo,
      totalEntregados: entregados,
      pendientesCount: pendientes
    };
  }, [inventarioEpp, solicitudesEpp]);

  // Filtered inventory
  const inventarioFiltrado = useMemo(() => {
    return inventarioEpp.filter(item => {
      const matchCat = categoriaFiltro === 'TODAS' || item.categoria === categoriaFiltro;
      const q = busqueda.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.nombre.toLowerCase().includes(q) ||
        item.codigo.toLowerCase().includes(q) ||
        item.normaTecnica.toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [inventarioEpp, categoriaFiltro, busqueda]);

  // Filtered requests
  const solicitudesFiltradas = useMemo(() => {
    return solicitudesEpp.filter(s => {
      // If employee, can see their own or all if admin
      if (!esAdminOSst && s.empleadoId !== currentEmpleadoId) {
        return false;
      }
      const q = busqueda.toLowerCase().trim();
      if (!q) return true;
      return (
        s.empleadoNombre.toLowerCase().includes(q) ||
        s.eppNombre.toLowerCase().includes(q) ||
        s.eppCodigo.toLowerCase().includes(q) ||
        s.motivo.toLowerCase().includes(q) ||
        (s.actaEntregaNumero && s.actaEntregaNumero.toLowerCase().includes(q))
      );
    });
  }, [solicitudesEpp, esAdminOSst, currentEmpleadoId, busqueda]);

  // Handler: Crear nueva solicitud
  const handleCrearSolicitud = (nueva: SolicitudEntregaEPP) => {
    onActualizarSolicitudes([nueva, ...solicitudesEpp]);
  };

  // Handler: Confirmar entrega
  const handleConfirmarEntrega = (
    solicitudId: string,
    datosEntrega: {
      fechaEntrega: string;
      responsableEntrega: string;
      loteOSerie: string;
      observacionesEntrega: string;
      actaNumero: string;
      proximaReposicionSugerida: string;
    }
  ) => {
    const solicitud = solicitudesEpp.find(s => s.id === solicitudId);
    if (!solicitud) return;

    // 1. Descontar stock del inventario
    const nuevoInventario = inventarioEpp.map(item => {
      if (item.id === solicitud.eppId || item.codigo === solicitud.eppCodigo) {
        return {
          ...item,
          stockActual: Math.max(0, item.stockActual - solicitud.cantidad)
        };
      }
      return item;
    });
    onActualizarInventario(nuevoInventario);

    // 2. Actualizar solicitud a Entregada con acta y fechas
    const nuevasSolicitudes = solicitudesEpp.map(s => {
      if (s.id === solicitudId) {
        return {
          ...s,
          estado: 'Entregada' as const,
          fechaEntrega: datosEntrega.fechaEntrega,
          responsableEntrega: datosEntrega.responsableEntrega,
          loteOSerie: datosEntrega.loteOSerie,
          observacionesEntrega: datosEntrega.observacionesEntrega,
          actaEntregaNumero: datosEntrega.actaNumero,
          firmaConformidadTrabajador: true,
          proximaReposicionSugerida: datosEntrega.proximaReposicionSugerida
        };
      }
      return s;
    });
    onActualizarSolicitudes(nuevasSolicitudes);
  };

  // Handler: Agregar stock a inventario
  const handleGuardarAjusteStock = () => {
    if (!stockItemEnEdicion) return;
    const nuevoInventario = inventarioEpp.map(item => {
      if (item.id === stockItemEnEdicion.id) {
        return {
          ...item,
          stockActual: item.stockActual + Number(cantidadAjusteStock)
        };
      }
      return item;
    });
    onActualizarInventario(nuevoInventario);
    setStockItemEnEdicion(null);
  };

  const categoriasDisponibles: (CategoriaEPP | 'TODAS')[] = [
    'TODAS',
    'Protección Cabeza',
    'Protección Visual y Facial',
    'Protección Auditiva',
    'Protección Respiratoria',
    'Protección Manos',
    'Protección Pies',
    'Trabajo Seguro en Alturas',
    'Protección Corporal / Ropa de Trabajo'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18235C]/10 text-[#18235C] uppercase tracking-wider flex items-center gap-1 border border-[#18235C]/20">
              <Shield className="w-3 h-3 text-[#18235C]" />
              Seguridad & Salud en el Trabajo · B GROUP
            </span>
            <span className="text-xs text-[#282829]/70">
              Res. 2400/1979 • Dec. 1072/2015 Art. 2.2.4.6.24
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#18235C]">
            Inventario, Dotación & Control de EPPs
          </h2>
          <p className="text-xs text-[#282829]/70 mt-0.5">
            Gestión técnica de elementos de protección personal, stock de almacén, solicitudes de colaboradores y actas formales de entrega.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {esSuperAdmin && (
            <button
              id="btn-depurar-epp"
              onClick={() => setModalDepurarEppOpen(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-300 shadow-2xs"
              title="Depurar solicitudes/actas de prueba y reiniciar existencias a 0 (Exclusivo Superadministrador)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Depurar EPPs</span>
            </button>
          )}
          <button
            id="btn-solicitar-epp"
            onClick={() => setModalSolicitarOpen(true)}
            className="px-3.5 py-2 bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>Solicitar EPP</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/30 shadow-xs">
          <div className="flex items-center justify-between text-[#282829]/70 mb-1">
            <span className="text-[11px] font-semibold uppercase">Referencias EPP</span>
            <HardHat className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="text-2xl font-bold text-[#18235C]">{totalReferencias}</div>
          <div className="text-[10px] text-[#282829]/70 mt-0.5">Catálogo homologado</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/30 shadow-xs">
          <div className="flex items-center justify-between text-[#282829]/70 mb-1">
            <span className="text-[11px] font-semibold uppercase">Stock Total Unidades</span>
            <Package className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="text-2xl font-bold text-[#18235C]">{totalUnidadesStock}</div>
          <div className="text-[10px] text-[#282829]/70 mt-0.5">Disponible en almacén</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/30 shadow-xs">
          <div className="flex items-center justify-between text-[#282829]/70 mb-1">
            <span className="text-[11px] font-semibold uppercase">Stock Bajo / Crítico</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold ${stockBajoCount > 0 ? 'text-amber-600' : 'text-[#18235C]'}`}>
            {stockBajoCount}
          </div>
          <div className="text-[10px] text-[#282829]/70 mt-0.5">Requiere orden de compra</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/30 shadow-xs">
          <div className="flex items-center justify-between text-[#282829]/70 mb-1">
            <span className="text-[11px] font-semibold uppercase">Actas de Entrega</span>
            <CheckCircle2 className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="text-2xl font-bold text-[#18235C]">{totalEntregados}</div>
          <div className="text-[10px] text-[#282829]/70 mt-0.5">
            {pendientesCount > 0 ? (
              <span className="text-amber-600 font-semibold">{pendientesCount} por entregar</span>
            ) : (
              'Al día en dotaciones'
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-[#8FA7D6]/30">
        <div className="flex gap-2">
          <button
            id="tab-epp-inventario"
            onClick={() => setActiveSubTab('inventario')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              activeSubTab === 'inventario'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            <span>Catálogo e Inventario de EPPs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 border border-[#8FA7D6]/30 text-[#18235C] font-semibold">
              {inventarioEpp.length}
            </span>
          </button>

          <button
            id="tab-epp-solicitudes"
            onClick={() => setActiveSubTab('solicitudes')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              activeSubTab === 'solicitudes'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Solicitudes & Historial de Entregas</span>
            {pendientesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                {pendientesCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="pb-2 flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#282829]" />
            <input
              type="text"
              placeholder="Buscar EPP o colaborador..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-[#8FA7D6] rounded-lg text-xs text-[#18235C] focus:outline-none focus:ring-1 focus:ring-[#18235C] w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* SUBTAB 1: Inventario y Catálogo de EPPs */}
      {activeSubTab === 'inventario' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[#282829]/70 font-semibold text-[11px] mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#18235C]" /> Categoría:
            </span>
            {categoriasDisponibles.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors font-medium ${
                  categoriaFiltro === cat
                    ? 'bg-[#18235C] text-white shadow-xs font-semibold'
                    : 'bg-white border border-[#8FA7D6]/40 text-[#282829]/70 hover:bg-[#8FA7D6]/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Table of Inventory */}
          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18235C] text-white">
                  <tr>
                    <th className="py-3 px-3.5 font-bold">Código</th>
                    <th className="py-3 px-3.5 font-bold">Elemento de Protección Personal</th>
                    <th className="py-3 px-3.5 font-bold">Categoría & Norma Técnica</th>
                    <th className="py-3 px-3.5 text-center font-bold">Stock Actual</th>
                    <th className="py-3 px-3.5 text-center font-bold">Stock Mínimo</th>
                    <th className="py-3 px-3.5 font-bold">Vida Útil Est.</th>
                    <th className="py-3 px-3.5 font-bold">Ubicación Almacén</th>
                    <th className="py-3 px-3.5 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {inventarioFiltrado.map(item => {
                    const esStockBajo = item.stockActual <= item.stockMinimo;
                    return (
                      <tr key={item.id} className="hover:bg-[#8FA7D6]/10 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-[#18235C]">
                          {item.codigo}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-[#18235C]">{item.nombre}</div>
                          <div className="text-[10px] text-[#282829]/70 line-clamp-1">{item.descripcion}</div>
                          <div className="text-[10px] text-[#282829]/50 mt-0.5">
                            Tallas: {item.tallasDisponibles.join(', ')}
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-medium text-[#18235C] block">{item.categoria}</span>
                          <span className="text-[10px] font-mono text-[#282829]/70 bg-slate-100 px-1.5 py-0.5 rounded border border-[#8FA7D6]/30">
                            {item.normaTecnica}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold inline-block ${
                              esStockBajo
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20'
                            }`}
                          >
                            {item.stockActual} {item.unidad}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center text-[#282829]/70 font-mono">
                          {item.stockMinimo} {item.unidad}
                        </td>
                        <td className="py-3 px-3.5 text-[#282829]/70">
                          {item.vidaUtilDias} días
                          <span className="text-[10px] text-[#282829]/50 block">
                            (~{Math.round(item.vidaUtilDias / 30)} meses)
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-[#282829]/70 text-[11px]">
                          {item.ubicacionAlmacen}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {esAdminOSst && (
                              <button
                                onClick={() => {
                                  setStockItemEnEdicion(item);
                                  setCantidadAjusteStock(5);
                                }}
                                className="px-2 py-1 bg-white border border-[#8FA7D6]/40 hover:bg-[#8FA7D6]/10 text-[#18235C] rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                                title="Ingresar nuevas unidades a almacén"
                              >
                                <Plus className="w-3 h-3 text-[#18235C]" />
                                <span>Entrada</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setModalSolicitarOpen(true);
                              }}
                              className="px-2.5 py-1 bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <Send className="w-3 h-3 text-[#00FF00]" />
                              <span>Pedir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {inventarioFiltrado.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#282829]/70">
                        No se encontraron elementos de protección con los filtros especificados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Solicitudes y Entregas Oficiales de EPP */}
      {activeSubTab === 'solicitudes' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-[#8FA7D6]/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#18235C]" />
              <span className="font-bold text-[#18235C]">
                Trazabilidad de Solicitudes y Registro de Entregas con Firma (Res. 2400/79) · B GROUP
              </span>
            </div>
            <div className="text-[11px] text-[#282829]/70">
              Cada entrega confirmada descuenta el stock de almacén y genera el acta individual legal.
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#8FA7D6]/30 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18235C] text-white">
                  <tr>
                    <th className="py-3 px-3.5 font-bold">Estado</th>
                    <th className="py-3 px-3.5 font-bold">Colaborador</th>
                    <th className="py-3 px-3.5 font-bold">EPP Solicitado</th>
                    <th className="py-3 px-3.5 font-bold">Talla & Cant.</th>
                    <th className="py-3 px-3.5 font-bold">Fecha Solicitud</th>
                    <th className="py-3 px-3.5 font-bold">Fecha Entrega</th>
                    <th className="py-3 px-3.5 font-bold">Lote / Serie</th>
                    <th className="py-3 px-3.5 font-bold">Acta Oficial</th>
                    <th className="py-3 px-3.5 text-right font-bold">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {solicitudesFiltradas.map(s => {
                    const esEntregada = s.estado === 'Entregada';
                    return (
                      <tr key={s.id} className="hover:bg-[#8FA7D6]/10 transition-colors">
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              esEntregada
                                ? 'bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20'
                                : s.estado === 'Aprobada'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 border border-[#8FA7D6]/30 text-[#282829]/70'
                            }`}
                          >
                            {esEntregada ? <CheckCircle2 className="w-3 h-3 text-[#18235C]" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            {s.estado}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-[#18235C]">{s.empleadoNombre}</div>
                          <div className="text-[10px] text-[#282829]/70">{s.cargoNombre}</div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-medium text-[#18235C]">
                            <span className="font-mono text-[#18235C] font-bold mr-1">[{s.eppCodigo}]</span>
                            {s.eppNombre}
                          </div>
                          <div className="text-[10px] text-[#282829]/70">{s.motivo}</div>
                        </td>
                        <td className="py-3 px-3.5 text-[#282829]/70">
                          <div>Talla: <strong className="text-[#18235C]">{s.talla}</strong></div>
                          <div className="text-[10px]">Cant: <strong className="text-[#18235C]">{s.cantidad}</strong></div>
                        </td>
                        <td className="py-3 px-3.5 text-[#282829]/70 font-mono">
                          {s.fechaSolicitud}
                        </td>
                        <td className="py-3 px-3.5 font-mono">
                          {s.fechaEntrega ? (
                            <span className="text-[#18235C] font-semibold">{s.fechaEntrega}</span>
                          ) : (
                            <span className="text-amber-600 italic">Pendiente entrega</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-[#282829]/70">
                          {s.loteOSerie || '—'}
                        </td>
                        <td className="py-3 px-3.5">
                          {s.actaEntregaNumero ? (
                            <button
                              onClick={() => setSolicitudParaActa(s)}
                              className="text-[11px] font-mono text-[#18235C] font-bold hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>{s.actaEntregaNumero}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#282829]/40">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!esEntregada && esAdminOSst && (
                              <button
                                onClick={() => setSolicitudParaEntrega(s)}
                                className="px-2.5 py-1 bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                              >
                                <CheckCircle2 className="w-3 h-3 text-[#00FF00]" />
                                <span>Hacer Entrega</span>
                              </button>
                            )}
                            {esEntregada && (
                              <button
                                onClick={() => setSolicitudParaActa(s)}
                                className="px-2 py-1 bg-white border border-[#8FA7D6]/40 hover:bg-[#8FA7D6]/10 text-[#18235C] rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                              >
                                <Printer className="w-3 h-3 text-[#18235C]" />
                                <span>Ver Acta</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {solicitudesFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#282829]/70">
                        No hay solicitudes de EPP registradas para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Solicitar EPP */}
      {modalSolicitarOpen && (
        <SolicitarEppModal
          empleado={currentEmpleado}
          inventarioEpp={inventarioEpp}
          onClose={() => setModalSolicitarOpen(false)}
          onCrearSolicitud={handleCrearSolicitud}
        />
      )}

      {/* Modal: Efectuar Entrega Oficial */}
      {solicitudParaEntrega && (
        <EntregarEppModal
          solicitud={solicitudParaEntrega}
          inventarioEpp={inventarioEpp}
          onClose={() => setSolicitudParaEntrega(null)}
          onConfirmarEntrega={handleConfirmarEntrega}
        />
      )}

      {/* Modal: Ver e Imprimir Acta Oficial de Entrega */}
      {solicitudParaActa && (
        <ActaEntregaEppModal
          solicitud={solicitudParaActa}
          onClose={() => setSolicitudParaActa(null)}
        />
      )}

      {/* Modal: Entrada / Reposición de Stock en Almacén */}
      {stockItemEnEdicion && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#8FA7D6]/40 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#8FA7D6]/30">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-[#18235C]" />
                <h4 className="font-bold text-xs text-[#18235C]">
                  Ingreso de Stock a Almacén · B GROUP
                </h4>
              </div>
              <button
                onClick={() => setStockItemEnEdicion(null)}
                className="text-[#282829]/50 hover:text-[#18235C]"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-bold text-[#18235C]">{stockItemEnEdicion.nombre}</div>
              <div className="text-[#282829]/70">
                Stock actual: <strong className="text-[#18235C]">{stockItemEnEdicion.stockActual} {stockItemEnEdicion.unidad}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18235C] mb-1">
                Cantidad a Ingresar ({stockItemEnEdicion.unidad}):
              </label>
              <input
                type="number"
                min="1"
                value={cantidadAjusteStock}
                onChange={e => setCantidadAjusteStock(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6]/40 rounded-lg text-xs text-[#18235C] focus:outline-none focus:ring-1 focus:ring-[#18235C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#8FA7D6]/30">
              <button
                type="button"
                onClick={() => setStockItemEnEdicion(null)}
                className="px-3 py-1.5 bg-white border border-[#8FA7D6]/40 rounded-lg text-xs text-[#282829]/70 hover:bg-[#8FA7D6]/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarAjusteStock}
                className="px-3 py-1.5 bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Modal de confirmación para depuración de EPPs (Exclusivo Superadministrador) */}
      {esSuperAdmin && modalDepurarEppOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  ¿Confirmas depurar la base de datos de EPP?
                </h3>
                <p className="text-xs text-rose-700">
                  Vaciar actas de entrega y reiniciar existencias
                </p>
              </div>
            </div>

            <p className="text-xs text-[#282829]/80 leading-relaxed">
              Esta acción eliminará todas las solicitudes y actas de entrega registradas en pruebas, y ajustará las existencias de todos los EPPs a 0 unidades en almacén para ingreso de bodega real.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setModalDepurarEppOpen(false)}
                disabled={depurandoEpp}
                className="px-3.5 py-2 text-xs font-bold text-[#282829] hover:bg-slate-100 rounded-lg border border-[#8FA7D6]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarDepuracionEpp}
                disabled={depurandoEpp}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors"
              >
                {depurandoEpp ? "Depurando..." : "Sí, Depurar Ahora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};