import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Plus,
  Edit3,
  Calendar,
  Clock,
  Sparkles,
  Info,
  Layers,
  History
} from 'lucide-react';
import { ArqueoCaja, CajaTurno, UsuarioSistema, ConfiguracionEmpresa } from '../../types';
import {
  obtenerArqueosCaja,
  registrarArqueoCaja,
  modificarArqueoPorAdmin,
  obtenerCajasTurnos,
  generarHashSHA256
} from '../../services/comercialService';

interface ArqueoCajaViewProps {
  currentUser: UsuarioSistema;
  empresa?: ConfiguracionEmpresa;
}

export const ArqueoCajaView: React.FC<ArqueoCajaViewProps> = ({
  currentUser,
  empresa
}) => {
  const [arqueos, setArqueos] = useState<ArqueoCaja[]>([]);
  const [cajas, setCajas] = useState<CajaTurno[]>([]);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalAjusteAdmin, setModalAjusteAdmin] = useState<ArqueoCaja | null>(null);

  // Rol del usuario: Solo superadmin o admin_gh son administradores
  const rol = currentUser.rol || 'empleado';
  const esAdmin = rol === 'superadmin' || rol === 'admin_gh';

  // Formulario de Conteo de Arqueo
  const [cajaTurnoId, setCajaTurnoId] = useState('');
  const [billetes100k, setBilletes100k] = useState<number>(0);
  const [billetes50k, setBilletes50k] = useState<number>(0);
  const [billetes20k, setBilletes20k] = useState<number>(0);
  const [billetes10k, setBilletes10k] = useState<number>(0);
  const [billetes5k, setBilletes5k] = useState<number>(0);
  const [billetes2k, setBilletes2k] = useState<number>(0);
  const [monedasTotal, setMonedasTotal] = useState<number>(0);
  const [digitalTotal, setDigitalTotal] = useState<number>(0);
  const [observacionesAsesor, setObservacionesAsesor] = useState('');

  // Formulario Ajuste Administrador
  const [ajusteFisico, setAjusteFisico] = useState<number>(0);
  const [ajusteSistema, setAjusteSistema] = useState<number>(0);
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [observacionesAdmin, setObservacionesAdmin] = useState('');

  const cargarDatos = async () => {
    const [arqs, cjs] = await Promise.all([
      obtenerArqueosCaja(),
      obtenerCajasTurnos()
    ]);
    setArqueos(arqs);
    setCajas(cjs);
    if (cjs.length > 0 && !cajaTurnoId) {
      const abierta = cjs.find(c => c.estado === 'Abierta');
      setCajaTurnoId(abierta ? abierta.id : cjs[0].id);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cálculo en vivo del efectivo contado
  const efectivoTotalFisico =
    billetes100k * 100000 +
    billetes50k * 50000 +
    billetes20k * 20000 +
    billetes10k * 10000 +
    billetes5k * 5000 +
    billetes2k * 2000 +
    monedasTotal;

  const totalFisico = efectivoTotalFisico + digitalTotal;

  const cajaSeleccionada = cajas.find(c => c.id === cajaTurnoId);
  const totalSistema = cajaSeleccionada
    ? cajaSeleccionada.saldoEsperadoEfectivo + cajaSeleccionada.totalRecaudadoDigital
    : 0;

  const diferencia = totalFisico - totalSistema;

  const handleCrearArqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    const fechaHoy = new Date().toISOString();
    const codigo = `ARQ-${new Date().getFullYear()}-${String(arqueos.length + 1).padStart(4, '0')}`;
    
    // Hash criptográfico de seguridad
    const cadena = `${codigo}|${currentUser.id}|${totalFisico}|${totalSistema}|${diferencia}|${fechaHoy}`;
    const hash = await generarHashSHA256(cadena);

    const nuevoArqueo: ArqueoCaja = {
      id: 'arq-' + Date.now(),
      codigo,
      fecha: fechaHoy,
      cajaTurnoId,
      asesorId: currentUser.id,
      asesorNombre: currentUser.nombre || currentUser.email,
      billetes100k,
      billetes50k,
      billetes20k,
      billetes10k,
      billetes5k,
      billetes2k,
      monedasTotal,
      efectivoTotalFisico,
      digitalTotal,
      totalFisico,
      totalSistema,
      diferencia,
      estado: diferencia === 0 ? 'Cuadrado' : diferencia < 0 ? 'Faltante' : 'Sobrante',
      inmutable: true, // Sellado inmutable para asesores
      creadoPor: currentUser.nombre || currentUser.email,
      fechaCreacion: fechaHoy,
      hashAuditoria: hash,
      observacionesAsesor
    };

    await registrarArqueoCaja(nuevoArqueo);
    setModalNuevo(false);
    resetFormulario();
    await cargarDatos();
  };

  const resetFormulario = () => {
    setBilletes100k(0);
    setBilletes50k(0);
    setBilletes20k(0);
    setBilletes10k(0);
    setBilletes5k(0);
    setBilletes2k(0);
    setMonedasTotal(0);
    setDigitalTotal(0);
    setObservacionesAsesor('');
  };

  const abrirModalAjuste = (arq: ArqueoCaja) => {
    setModalAjusteAdmin(arq);
    setAjusteFisico(arq.totalFisico);
    setAjusteSistema(arq.totalSistema);
    setMotivoAjuste('');
    setObservacionesAdmin(arq.observacionesAsesor || '');
  };

  const handleGuardarAjusteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAjusteAdmin || !motivoAjuste) return;

    const dif = ajusteFisico - ajusteSistema;

    await modificarArqueoPorAdmin(modalAjusteAdmin.id, currentUser, {
      totalFisico: ajusteFisico,
      totalSistema: ajusteSistema,
      diferencia: dif,
      motivoAjuste,
      observaciones: observacionesAdmin
    });

    setModalAjusteAdmin(null);
    await cargarDatos();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800">Arqueos de Caja Inmutables</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Control Blindado
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro inmutable para asesores comerciales. Modificaciones reservadas exclusivamente a administradores.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNuevo(true)}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#38BDF8]" />
          <span>Registrar Nuevo Arqueo</span>
        </button>
      </div>

      {/* Regla de Negocio Informativa */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 block">Política de Inmutabilidad de Arqueos:</span>
          <p className="text-slate-600 leading-relaxed">
            Una vez que un asesor comercial registra un arqueo físico, el sistema genera un sello criptográfico SHA-256 e inhabilita cualquier modificación o eliminación por parte del asesor. Si se requiere una corrección justificada, únicamente los usuarios con rol de <strong>Super Administrador</strong> o <strong>Administrador GH</strong> tienen el privilegio de registrar una rectificación auditada.
          </p>
        </div>
      </div>

      {/* Tabla de Arqueos */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Historial de Arqueos Realizados
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Total registros: {arqueos.length}
          </span>
        </div>

        {arqueos.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No se han registrado arqueos de caja aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Asesor</th>
                  <th className="py-3 px-4">Efectivo Físico</th>
                  <th className="py-3 px-4">Digital</th>
                  <th className="py-3 px-4">Total Físico</th>
                  <th className="py-3 px-4">Total Sistema</th>
                  <th className="py-3 px-4">Diferencia</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Privilegio Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {arqueos.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{a.codigo}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(a.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{a.asesorNombre}</td>
                    <td className="py-3 px-4 font-mono">${a.efectivoTotalFisico.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 font-mono">${a.digitalTotal.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">${a.totalFisico.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">${a.totalSistema.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 font-mono">
                      {a.diferencia === 0 ? (
                        <span className="text-emerald-600 font-bold">$0 (Exacto)</span>
                      ) : a.diferencia < 0 ? (
                        <span className="text-rose-600 font-bold">-${Math.abs(a.diferencia).toLocaleString('es-CO')}</span>
                      ) : (
                        <span className="text-blue-600 font-bold">+${a.diferencia.toLocaleString('es-CO')}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${a.estado === 'Cuadrado' ? 'bg-emerald-100 text-emerald-800' : a.estado === 'Faltante' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                          {a.estado}
                        </span>
                        {a.modificadoPorAdmin && (
                          <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 block font-semibold" title={`Ajustado por ${a.modificadoPorAdmin.adminNombre}: ${a.modificadoPorAdmin.motivoAjuste}`}>
                            Ajuste Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {esAdmin ? (
                        <button
                          onClick={() => abrirModalAjuste(a)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          title="Exclusivo para Administrador"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Ajustar</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1" title="Inmutable para asesores comerciales">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Inmutable</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REGISTRO DE ARQUEO FÍSICO */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3 text-[#18235C]">
                <Lock className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold">Registro de Arqueo de Caja</h3>
                  <p className="text-xs text-slate-500">Conteo detallado de efectivo y terminales</p>
                </div>
              </div>
              <button onClick={() => setModalNuevo(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleCrearArqueo} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Turno de Caja Relacionado</label>
                <select
                  value={cajaTurnoId}
                  onChange={e => setCajaTurnoId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
                >
                  {cajas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - Cajero: {c.cajeroNombre} ({c.estado})
                    </option>
                  ))}
                </select>
              </div>

              {/* Conteo de Billetes */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Conteo Físico de Billetes en Gaveta (COP):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono">$100.000 COP</label>
                    <input
                      type="number"
                      min={0}
                      value={billetes100k}
                      onChange={e => setBilletes100k(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono">$50.000 COP</label>
                    <input
                      type="number"
                      min={0}
                      value={billetes50k}
                      onChange={e => setBilletes50k(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono">$20.000 COP</label>
                    <input
                      type="number"
                      min={0}
                      value={billetes20k}
                      onChange={e => setBilletes20k(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono">$10.000 COP</label>
                    <input
                      type="number"
                      min={0}
                      value={billetes10k}
                      onChange={e => setBilletes10k(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono">$5.000 COP</label>
                    <input
                      type="number"
                      min={0}
                      value={billetes5k}
                      onChange={e => setBilletes5k(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono">$2.000 COP</label>
                    <input
                      type="number"
                      min={0}
                      value={billetes2k}
                      onChange={e => setBilletes2k(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Total Monedas Físicas (COP)</label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={monedasTotal}
                      onChange={e => setMonedasTotal(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Total Vouchers / Datáfono / Bancos</label>
                    <input
                      type="number"
                      min={0}
                      value={digitalTotal}
                      onChange={e => setDigitalTotal(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen del Arqueo */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Físico Contado:</span>
                  <span className="font-mono font-bold text-slate-900">${totalFisico.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Registrado en Sistema:</span>
                  <span className="font-mono font-bold text-slate-900">${totalSistema.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between border-t border-indigo-200 pt-1 font-bold">
                  <span>Diferencia:</span>
                  <span className={diferencia === 0 ? 'text-emerald-600 font-mono' : diferencia < 0 ? 'text-rose-600 font-mono' : 'text-blue-600 font-mono'}>
                    ${diferencia.toLocaleString('es-CO')} ({diferencia === 0 ? 'Cuadrado' : diferencia < 0 ? 'Faltante' : 'Sobrante'})
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones del Asesor</label>
                <textarea
                  rows={2}
                  value={observacionesAsesor}
                  onChange={e => setObservacionesAsesor(e.target.value)}
                  placeholder="Comentarios adicionales sobre el conteo..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold shadow-md cursor-pointer transition-all"
                >
                  Guardar Arqueo Inmutable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE DE ARQUEO EXCLUSIVO PARA ADMINISTRADOR */}
      {modalAjusteAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3 text-amber-700">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold">Ajuste Administrativo de Arqueo</h3>
                  <p className="text-xs text-slate-500 font-mono">Arqueo: {modalAjusteAdmin.codigo}</p>
                </div>
              </div>
              <button onClick={() => setModalAjusteAdmin(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleGuardarAjusteAdmin} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-tight">
                <strong>Privilegio de Administrador:</strong> Esta acción modificará el registro original del asesor ({modalAjusteAdmin.asesorNombre}) y registrará en la bitácora su nombre de usuario como responsable del ajuste.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Físico Corregido (COP) *</label>
                <input
                  type="number"
                  required
                  value={ajusteFisico}
                  onChange={e => setAjusteFisico(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Sistema Corregido (COP) *</label>
                <input
                  type="number"
                  required
                  value={ajusteSistema}
                  onChange={e => setAjusteSistema(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo Justificado del Ajuste *</label>
                <textarea
                  rows={2}
                  required
                  value={motivoAjuste}
                  onChange={e => setMotivoAjuste(e.target.value)}
                  placeholder="Ej: Corrección por voucher omitido en el reporte inicial..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAjusteAdmin(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md cursor-pointer transition-all"
                >
                  Confirmar Ajuste Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
