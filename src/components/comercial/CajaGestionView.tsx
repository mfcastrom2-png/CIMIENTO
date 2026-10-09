import React, { useState, useEffect } from 'react';
import {
  Wallet,
  PlusCircle,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  DollarSign,
  FileText,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { CajaTurno, UsuarioSistema } from '../../types';
import {
  obtenerCajasTurnos,
  abrirTurnoCaja,
  cerrarTurnoCaja
} from '../../services/comercialService';

interface CajaGestionViewProps {
  currentUser: UsuarioSistema;
  onActualizar?: () => void;
}

export const CajaGestionView: React.FC<CajaGestionViewProps> = ({
  currentUser,
  onActualizar
}) => {
  const [cajas, setCajas] = useState<CajaTurno[]>([]);
  const [cajaActiva, setCajaActiva] = useState<CajaTurno | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);

  // Formulario Apertura
  const [montoApertura, setMontoApertura] = useState<number>(200000);
  const [observacionesApertura, setObservacionesApertura] = useState('');

  // Formulario Cierre
  const [saldoRealEfectivo, setSaldoRealEfectivo] = useState<number>(0);
  const [observacionesCierre, setObservacionesCierre] = useState('');

  const cargarCajas = async () => {
    setCargando(true);
    const lista = await obtenerCajasTurnos();
    setCajas(lista);
    const abierta = lista.find(c => c.estado === 'Abierta');
    setCajaActiva(abierta || null);
    if (abierta) {
      setSaldoRealEfectivo(abierta.saldoEsperadoEfectivo);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarCajas();
  }, []);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaCaja: CajaTurno = {
      id: 'caja-' + Date.now(),
      codigo: `CAJA-${new Date().getFullYear()}-${String(cajas.length + 1).padStart(3, '0')}`,
      cajeroId: currentUser.id,
      cajeroNombre: currentUser.nombre || currentUser.email,
      fechaApertura: new Date().toISOString(),
      montoApertura: Number(montoApertura),
      totalRecaudadoEfectivo: 0,
      totalRecaudadoDigital: 0,
      totalEgresos: 0,
      saldoEsperadoEfectivo: Number(montoApertura),
      estado: 'Abierta',
      observaciones: observacionesApertura
    };

    await abrirTurnoCaja(nuevaCaja);
    setModalApertura(false);
    await cargarCajas();
    if (onActualizar) onActualizar();
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaActiva) return;

    const diferencia = Number(saldoRealEfectivo) - cajaActiva.saldoEsperadoEfectivo;

    await cerrarTurnoCaja(cajaActiva.id, {
      fechaCierre: new Date().toISOString(),
      saldoRealEfectivo: Number(saldoRealEfectivo),
      diferencia,
      observaciones: observacionesCierre
    });

    setModalCierre(false);
    await cargarCajas();
    if (onActualizar) onActualizar();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Estado de Caja */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cajaActiva ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800">Terminal de Cajero</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cajaActiva ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {cajaActiva ? 'Caja Abierta' : 'Caja Cerrada'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de turnos, base en efectivo, recaudos en tiempo real y balance de caja.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {cajaActiva ? (
            <button
              onClick={() => setModalCierre(true)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Cerrar Turno de Caja</span>
            </button>
          ) : (
            <button
              onClick={() => setModalApertura(true)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4 text-[#38BDF8]" />
              <span>Abrir Nuevo Turno de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* Tarjeta de Resumen en Vivo si la caja está abierta */}
      {cajaActiva && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#18235C] to-[#0F172A] text-white p-5 rounded-2xl shadow-md border border-slate-700">
            <span className="text-[11px] font-bold text-[#8FA7D6] uppercase tracking-wider block">
              Base Inicial de Caja
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              ${cajaActiva.montoApertura.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-slate-300 mt-1 block font-mono">
              Código: {cajaActiva.codigo}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Recaudo en Efectivo
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              +${cajaActiva.totalRecaudadoEfectivo.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Ingresos del turno actual
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Recaudo Digital (Bancos/Nequi)
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              +${cajaActiva.totalRecaudadoDigital.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Transferencias / PSE / Datafono
            </span>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 rounded-2xl shadow-md">
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
              Efectivo Esperado en Gaveta
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              ${cajaActiva.saldoEsperadoEfectivo.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-emerald-100 mt-1 block">
              Base + Recaudo Efectivo - Egresos
            </span>
          </div>
        </div>
      )}

      {/* Historial de Turnos de Caja */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Historial de Turnos y Cierres de Caja
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Total registros: {cajas.length}
          </span>
        </div>

        {cajas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No se han registrado turnos de caja en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cajero</th>
                  <th className="py-3 px-4">Apertura</th>
                  <th className="py-3 px-4">Base Inicial</th>
                  <th className="py-3 px-4">Efectivo</th>
                  <th className="py-3 px-4">Digital</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {cajas.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.codigo}</td>
                    <td className="py-3 px-4 text-slate-700">{c.cajeroNombre}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(c.fechaApertura).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">${c.montoApertura.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 text-emerald-600 font-mono font-bold">${c.totalRecaudadoEfectivo.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 text-blue-600 font-mono font-bold">${c.totalRecaudadoDigital.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {c.diferencia !== undefined ? (
                        <span className={c.diferencia === 0 ? 'text-emerald-600 font-bold' : c.diferencia < 0 ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold'}>
                          ${c.diferencia.toLocaleString('es-CO')}
                        </span>
                      ) : (
                        <span className="text-slate-400">En curso</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL APERTURA DE CAJA */}
      {modalApertura && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4 text-[#18235C]">
              <div className="p-2.5 rounded-xl bg-[#18235C]/10 text-[#18235C]">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Apertura de Turno de Caja</h3>
                <p className="text-xs text-slate-500">Ingrese la base en efectivo asignada</p>
              </div>
            </div>

            <form onSubmit={handleAbrirCaja} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cajero Responsable
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.nombre || currentUser.email}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto Base de Caja (Efectivo COP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={montoApertura}
                    onChange={e => setMontoApertura(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones de Apertura
                </label>
                <textarea
                  rows={2}
                  value={observacionesApertura}
                  onChange={e => setObservacionesApertura(e.target.value)}
                  placeholder="Detalles sobre billetes o novedades iniciales..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalApertura(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CIERRE DE CAJA */}
      {modalCierre && cajaActiva && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4 text-rose-700">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cierre de Turno de Caja</h3>
                <p className="text-xs text-slate-500">Cuadre de efectivo de la terminal</p>
              </div>
            </div>

            <form onSubmit={handleCerrarCaja} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700 border border-slate-200">
                <div className="flex justify-between">
                  <span>Base Inicial:</span>
                  <span className="font-mono font-bold">${cajaActiva.montoApertura.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recaudo Efectivo:</span>
                  <span className="font-mono font-bold text-emerald-600">+${cajaActiva.totalRecaudadoEfectivo.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                  <span>Efectivo Esperado en Caja:</span>
                  <span className="font-mono">${cajaActiva.saldoEsperadoEfectivo.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Efectivo Físico Real Contado en Gaveta *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={saldoRealEfectivo}
                    onChange={e => setSaldoRealEfectivo(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#18235C]"
                  />
                </div>
                <div className="mt-1 text-xs">
                  {saldoRealEfectivo - cajaActiva.saldoEsperadoEfectivo === 0 ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Caja cuadrada exactamente ($0 diferencia)
                    </span>
                  ) : saldoRealEfectivo - cajaActiva.saldoEsperadoEfectivo < 0 ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Faltante de ${Math.abs(saldoRealEfectivo - cajaActiva.saldoEsperadoEfectivo).toLocaleString('es-CO')}
                    </span>
                  ) : (
                    <span className="text-blue-600 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Sobrante de ${(saldoRealEfectivo - cajaActiva.saldoEsperadoEfectivo).toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones de Cierre
                </label>
                <textarea
                  rows={2}
                  value={observacionesCierre}
                  onChange={e => setObservacionesCierre(e.target.value)}
                  placeholder="Justificación de novedades o arqueo..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCierre(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirmar Cierre de Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
