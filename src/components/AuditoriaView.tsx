import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { EventoAuditoria, UsuarioSistema } from '../types';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuditoriaViewProps {
  currentUser: UsuarioSistema | null;
}

export const AuditoriaView: React.FC<AuditoriaViewProps> = ({ currentUser }) => {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoMas, setCargandoMas] = useState<boolean>(false);
  const [ultimoDoc, setUltimoDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hayMas, setHayMas] = useState<boolean>(false);
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroAccion, setFiltroAccion] = useState<string>('TODAS');
  const [filtroEntidad, setFiltroEntidad] = useState<string>('TODAS');

  const cargarAuditoria = async () => {
    setCargando(true);
    try {
      const q = query(
        collection(db, 'auditoria_sistema'),
        orderBy('timestamp', 'desc'),
        limit(25)
      );
      const snap = await getDocs(q);
      const items: EventoAuditoria[] = [];
      snap.forEach(docSnap => {
        items.push({ ...(docSnap.data() as EventoAuditoria), id: docSnap.id });
      });
      setEventos(items);
      setUltimoDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHayMas(snap.docs.length === 25);
    } catch (err) {
      console.warn('Error al cargar logs de auditoría:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarMasAuditoria = async () => {
    if (!ultimoDoc || cargandoMas) return;
    setCargandoMas(true);
    try {
      const q = query(
        collection(db, 'auditoria_sistema'),
        orderBy('timestamp', 'desc'),
        startAfter(ultimoDoc),
        limit(25)
      );
      const snap = await getDocs(q);
      const items: EventoAuditoria[] = [];
      snap.forEach(docSnap => {
        items.push({ ...(docSnap.data() as EventoAuditoria), id: docSnap.id });
      });
      setEventos(prev => [...prev, ...items]);
      setUltimoDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHayMas(snap.docs.length === 25);
    } catch (err) {
      console.warn('Error al cargar más logs de auditoría:', err);
    } finally {
      setCargandoMas(false);
    }
  };

  useEffect(() => {
    cargarAuditoria();
  }, []);

  const eventosFiltrados = eventos.filter(ev => {
    const coincideTexto =
      ev.detalle.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      ev.entidad.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (ev.usuario?.email || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (ev.usuario?.nombre || '').toLowerCase().includes(filtroTexto.toLowerCase());

    const coincideAccion = filtroAccion === 'TODAS' || ev.accion === filtroAccion;
    const coincideEntidad = filtroEntidad === 'TODAS' || ev.entidad === filtroEntidad;

    return coincideTexto && coincideAccion && coincideEntidad;
  });

  const getBadgeAccion = (accion: string) => {
    switch (accion) {
      case 'CREACION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ACTUALIZACION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ELIMINACION':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'CIERRE_PERIODO':
      case 'APERTURA_PERIODO':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PURGA_DATOS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Institucional */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#18235C] text-white">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#18235C]">
                Libro Mayor de Auditoría y Trazabilidad (Audit Trail)
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Registro inmutable de acciones críticas (CST, DIAN, UGPP, ISO 27001). Solo adición (append-only).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarAuditoria}
              disabled={cargando}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              Refrescar Logs
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por usuario, colaborador o detalle..."
              value={filtroTexto}
              onChange={e => setFiltroTexto(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18235C] focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              Acción:
            </div>
            <select
              value={filtroAccion}
              onChange={e => setFiltroAccion(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#18235C]"
            >
              <option value="TODAS">Todas las acciones</option>
              <option value="CREACION">CREACIÓN</option>
              <option value="ACTUALIZACION">ACTUALIZACIÓN</option>
              <option value="ELIMINACION">ELIMINACIÓN</option>
              <option value="CIERRE_PERIODO">CIERRE PERÍODO</option>
              <option value="PURGA_DATOS">PURGA DATOS</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              Entidad:
            </div>
            <select
              value={filtroEntidad}
              onChange={e => setFiltroEntidad(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#18235C]"
            >
              <option value="TODAS">Todas las entidades</option>
              <option value="empleados">Empleados</option>
              <option value="nominas">Nómina</option>
              <option value="cargos">Cargos</option>
              <option value="configuracion_nomina">Parámetros Nómina</option>
              <option value="inventario_epp">Inventario EPP</option>
              <option value="usuarios">Usuarios</option>
            </select>
          </div>
        </div>

        {/* Tabla de Eventos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Acción</th>
                  <th className="py-3.5 px-4">Entidad</th>
                  <th className="py-3.5 px-4">Descripción del Evento</th>
                  <th className="py-3.5 px-4">Responsable</th>
                  <th className="py-3.5 px-4 text-center">Inmutabilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#18235C]" />
                      Cargando libro de auditoría desde Firestore...
                    </td>
                  </tr>
                ) : eventosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No se encontraron registros de auditoría que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  eventosFiltrados.map((ev, idx) => (
                    <tr key={ev.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(ev.timestamp).toLocaleString('es-CO')}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeAccion(ev.accion)}`}>
                          {ev.accion}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-slate-700 capitalize">
                        {ev.entidad}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 font-medium max-w-md">
                        {ev.detalle}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <span className="font-medium text-slate-700">{ev.usuario?.nombre || 'Sistema'}</span>
                            <span className="block text-[11px] text-slate-400">{ev.usuario?.email || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          title="Protegido por reglas de Firestore: Imposible modificar o borrar (allow update, delete: if false)"
                        >
                          <Lock className="w-3 h-3 text-emerald-600" />
                          Append-Only
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Total de eventos cargados: <strong>{eventosFiltrados.length}</strong></span>
              {hayMas && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Más eventos disponibles en Firestore
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hayMas && (
                <button
                  type="button"
                  onClick={cargarMasAuditoria}
                  disabled={cargandoMas}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                >
                  {cargandoMas ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  <span>{cargandoMas ? 'Consultando...' : 'Cargar más eventos (+25 con cursor)'}</span>
                </button>
              )}

              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Auditoría activa y sincronizada con Firestore
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
