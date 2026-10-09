import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Share2,
  Mail,
  Printer,
  Smartphone,
  Send,
  User,
  QrCode,
  FileText,
  Clock,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';
import { ClienteComercial, PagoRecaudo, CajaTurno, UsuarioSistema, ConfiguracionEmpresa } from '../../types';
import {
  obtenerClientesComerciales,
  obtenerCajasTurnos,
  registrarPagoRecaudo,
  obtenerPagosRecaudos
} from '../../services/comercialService';
import { CorporateLogo } from '../CorporateLogo';

interface CobroRecaudoViewProps {
  currentUser: UsuarioSistema;
  empresa?: ConfiguracionEmpresa;
  onPagoRegistrado?: () => void;
}

export const CobroRecaudoView: React.FC<CobroRecaudoViewProps> = ({
  currentUser,
  empresa,
  onPagoRegistrado
}) => {
  const [clientes, setClientes] = useState<ClienteComercial[]>([]);
  const [cajas, setCajas] = useState<CajaTurno[]>([]);
  const [pagosRecientes, setPagosRecientes] = useState<PagoRecaudo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteComercial | null>(null);

  // Formulario de pago
  const [monto, setMonto] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<PagoRecaudo['metodoPago']>('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [concepto, setConcepto] = useState('Pago mensualidad servicio internet');
  const [observaciones, setObservaciones] = useState('');
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [emailCliente, setEmailCliente] = useState('');

  // Modal de Comprobante emitido
  const [comprobanteEmitido, setComprobanteEmitido] = useState<PagoRecaudo | null>(null);
  const [mensajeEnvio, setMensajeEnvio] = useState<string | null>(null);

  const cargarDatos = async () => {
    const [cls, cjs, pgs] = await Promise.all([
      obtenerClientesComerciales(),
      obtenerCajasTurnos(),
      obtenerPagosRecaudos()
    ]);
    setClientes(cls);
    setCajas(cjs);
    setPagosRecientes(pgs);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cajaAbierta = cajas.find(c => c.estado === 'Abierta');

  const handleSeleccionarCliente = (cli: ClienteComercial) => {
    setClienteSeleccionado(cli);
    setMonto(cli.saldoPendiente);
    setTelefonoWhatsapp(cli.telefono || '');
    setEmailCliente(cli.email || '');
    setConcepto(`Pago servicio ${cli.planServicio} - Periodo Actual`);
  };

  const handleRegistrarCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSeleccionado || monto <= 0) return;

    const fechaHoy = new Date().toISOString();
    const codigoRecibo = `REC-${new Date().getFullYear()}-${String(pagosRecientes.length + 1).padStart(5, '0')}`;
    const saldoAnterior = clienteSeleccionado.saldoPendiente;
    const saldoActual = Math.max(0, saldoAnterior - monto);

    const nuevoPago: PagoRecaudo = {
      id: 'pago-' + Date.now(),
      codigoRecibo,
      clienteId: clienteSeleccionado.id,
      clienteNombre: clienteSeleccionado.nombre,
      clienteIdentificacion: clienteSeleccionado.identificacion,
      monto,
      fecha: fechaHoy,
      metodoPago,
      referenciaTransaccion: referencia,
      cajaTurnoId: cajaAbierta ? cajaAbierta.id : undefined,
      cajeroNombre: currentUser.nombre || currentUser.email,
      saldoAnterior,
      saldoActual,
      concepto,
      telefonoDestinoWhatsapp: telefonoWhatsapp,
      emailDestino: emailCliente,
      observaciones
    };

    await registrarPagoRecaudo(nuevoPago);
    setComprobanteEmitido(nuevoPago);
    await cargarDatos();
    setClienteSeleccionado(null);
    setMonto(0);
    setReferencia('');
    if (onPagoRegistrado) onPagoRegistrado();
  };

  // Construir texto formateado del comprobante
  const generarTextoComprobante = (p: PagoRecaudo): string => {
    const nombreEmp = empresa?.nombreComercial || 'B GROUP INGENIERIA S.A.S.';
    const nitEmp = empresa?.nit ? `NIT ${empresa.nit}-${empresa.digitoVerificacion || '1'}` : 'NIT 900.995.99-2';
    const fechaFmt = new Date(p.fecha).toLocaleString('es-CO');

    return `🧾 *COMPROBANTE OFICIAL DE PAGO*\n` +
      `🏢 *${nombreEmp}*\n` +
      `📋 ${nitEmp}\n` +
      `--------------------------------\n` +
      `🔹 *Recibo N°:* ${p.codigoRecibo}\n` +
      `📅 *Fecha:* ${fechaFmt}\n` +
      `👤 *Cliente:* ${p.clienteNombre}\n` +
      `🆔 *Documento:* ${p.clienteIdentificacion}\n` +
      `💡 *Concepto:* ${p.concepto}\n` +
      `💳 *Método de Pago:* ${p.metodoPago}\n` +
      (p.referenciaTransaccion ? `🔢 *Ref/Transacción:* ${p.referenciaTransaccion}\n` : '') +
      `💰 *Monto Pagado:* $${p.monto.toLocaleString('es-CO')} COP\n` +
      `📉 *Saldo Restante:* $${p.saldoActual.toLocaleString('es-CO')} COP\n` +
      `👨‍💼 *Atendido por:* ${p.cajeroNombre}\n` +
      `--------------------------------\n` +
      `🌐 *Estado del Servicio:* ${p.saldoActual === 0 ? 'AL DÍA' : 'ABONO REGISTRADO'}\n` +
      `¡Gracias por confiar en nuestra red de conectividad! ✨`;
  };

  // Enviar por WhatsApp
  const handleEnviarWhatsapp = (p: PagoRecaudo) => {
    const texto = encodeURIComponent(generarTextoComprobante(p));
    const tel = p.telefonoDestinoWhatsapp?.replace(/[^0-9]/g, '') || '';
    const enlace = tel.length >= 10 ? `https://wa.me/57${tel}?text=${texto}` : `https://wa.me/?text=${texto}`;
    const link = document.createElement('a');
    link.href = enlace;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMensajeEnvio('Comprobante despachado vía WhatsApp.');
  };

  // Enviar por Correo Electrónico
  const handleEnviarCorreo = (p: PagoRecaudo) => {
    const asunto = encodeURIComponent(`Comprobante de Pago ${p.codigoRecibo} - ${empresa?.nombreComercial || 'B GROUP INGENIERIA'}`);
    const cuerpo = encodeURIComponent(generarTextoComprobante(p));
    const destino = p.emailDestino || '';
    const enlace = `mailto:${destino}?subject=${asunto}&body=${cuerpo}`;
    window.location.href = enlace;
    setMensajeEnvio('Cliente de correo abierto con la plantilla oficial.');
  };

  // Compartir por medios nativos del dispositivo (navigator.share)
  const handleCompartirDispositivo = async (p: PagoRecaudo) => {
    const texto = generarTextoComprobante(p);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Comprobante de Pago ${p.codigoRecibo}`,
          text: texto
        });
        setMensajeEnvio('Comprobante compartido exitosamente con las apps del dispositivo.');
      } catch (err) {
        console.debug('Compartir cancelado por el usuario.');
      }
    } else {
      // Fallback: Copiar al portapapeles
      navigator.clipboard.writeText(texto);
      setMensajeEnvio('Texto del comprobante copiado al portapapeles para pegar en cualquier aplicación.');
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.toLowerCase();
    return c.nombre.toLowerCase().includes(q) ||
      c.identificacion.toLowerCase().includes(q) ||
      c.codigo.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Módulo de Cobro & Recaudo</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestione abonos y cancelaciones con emisión y despacho multicanal de comprobantes.
            </p>
          </div>
        </div>

        {cajaAbierta ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Turno Activo: {cajaAbierta.codigo} ({cajaAbierta.cajeroNombre})</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Atención: No hay turno de caja abierto en este momento</span>
          </div>
        )}
      </div>

      {/* Grid Principal: Búsqueda de Cliente y Formulario de Cobro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: BUSCADOR Y LISTA DE CLIENTES */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500" />
              Seleccionar Cliente
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">{clientes.length} clientes</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, cédula, NIT o código..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#18235C]"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {clientesFiltrados.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No se encontraron clientes.</p>
            ) : (
              clientesFiltrados.map(c => {
                const seleccionado = clienteSeleccionado?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSeleccionarCliente(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${seleccionado ? 'bg-[#18235C]/5 border-[#18235C] shadow-xs' : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">{c.nombre}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{c.tipoIdentificacion}: {c.identificacion} · {c.codigo}</span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 truncate">{c.planServicio}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Saldo</span>
                        <span className={`text-xs font-black font-mono ${c.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ${c.saldoPendiente.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: REGISTRO DE PAGO */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {clienteSeleccionado ? (
            <form onSubmit={handleRegistrarCobro} className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cliente Seleccionado</span>
                  <h4 className="text-sm font-extrabold text-[#18235C]">{clienteSeleccionado.nombre}</h4>
                  <p className="text-xs text-slate-500 font-mono">{clienteSeleccionado.tipoIdentificacion}: {clienteSeleccionado.identificacion}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saldo Pendiente</span>
                  <p className="text-lg font-black text-rose-600 font-mono">
                    ${clienteSeleccionado.saldoPendiente.toLocaleString('es-CO')} COP
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monto a Recaudar (COP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={100}
                      value={monto}
                      onChange={e => setMonto(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-800 focus:ring-2 focus:ring-[#18235C]"
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setMonto(clienteSeleccionado.saldoPendiente)}
                      className="text-[10px] font-bold text-[#18235C] hover:underline"
                    >
                      Pagar Total (${clienteSeleccionado.saldoPendiente.toLocaleString('es-CO')})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={metodoPago}
                    onChange={e => setMetodoPago(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Efectivo">Efectivo (Gaveta)</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Bancolombia">Transferencia Bancolombia</option>
                    <option value="Transferencia">Otra Transferencia / PSE</option>
                    <option value="Tarjeta">Tarjeta Débito / Crédito</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Transacción / Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    placeholder="Ej: M12345678 o Nro Aprobación"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Concepto del Recaudo
                  </label>
                  <input
                    type="text"
                    value={concepto}
                    onChange={e => setConcepto(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Canales de Notificación del Comprobante */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                  Destinos para Enviar Comprobante Digital al Cliente:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">WhatsApp / Móvil</label>
                    <input
                      type="tel"
                      value={telefonoWhatsapp}
                      onChange={e => setTelefonoWhatsapp(e.target.value)}
                      placeholder="Ej: 3151234567"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">Correo Electrónico</label>
                    <input
                      type="email"
                      value={emailCliente}
                      onChange={e => setEmailCliente(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClienteSeleccionado(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Procesar Pago & Generar Comprobante</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <User className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">Seleccione un cliente en la lista</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Elija un suscriptor para cargar su estado de cuenta, monto de mora y procesar el recaudo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE COMPROBANTE DE PAGO CON MULTICANALES */}
      {comprobanteEmitido && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-5">
            
            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800">¡Pago Registrado Exitosamente!</h3>
              <p className="text-xs text-slate-500 font-mono">Recibo oficial: {comprobanteEmitido.codigoRecibo}</p>
            </div>

            {/* Vista previa del recibo */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Cliente:</span>
                <span className="truncate max-w-[200px]">{comprobanteEmitido.clienteNombre}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Documento:</span>
                <span>{comprobanteEmitido.clienteIdentificacion}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Método de Pago:</span>
                <span>{comprobanteEmitido.metodoPago}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monto Recaudado:</span>
                <span className="font-bold text-emerald-600">${comprobanteEmitido.monto.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1 font-bold">
                <span>Nuevo Saldo:</span>
                <span className={comprobanteEmitido.saldoActual === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ${comprobanteEmitido.saldoActual.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

            {mensajeEnvio && (
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{mensajeEnvio}</span>
              </div>
            )}

            {/* BOTONES DE ENVÍO DE COMPROBANTE MULTICANAL */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                Despachar Comprobante al Cliente:
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Botón WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleEnviarWhatsapp(comprobanteEmitido)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* 2. Botón Correo */}
                <button
                  type="button"
                  onClick={() => handleEnviarCorreo(comprobanteEmitido)}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Correo</span>
                </button>

                {/* 3. Botón Apps del Dispositivo (Web Share API) */}
                <button
                  type="button"
                  onClick={() => handleCompartirDispositivo(comprobanteEmitido)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dispositivo</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setComprobanteEmitido(null);
                  setMensajeEnvio(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
