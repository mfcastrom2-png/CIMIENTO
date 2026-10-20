import React, { useState } from 'react';
import { Empleado, NotificacionVinculacion } from '../../types';
import {
  Bell,
  Mail,
  Smartphone,
  Copy,
  Check,
  X,
  ExternalLink,
  Clock,
  Send,
  UserCheck
} from 'lucide-react';
import { despacharNotificacionVinculacion } from '../../services/vinculacionService';

interface ModalVerNotificacionesVinculacionProps {
  empleado: Empleado;
  onClose: () => void;
}

export const ModalVerNotificacionesVinculacion: React.FC<ModalVerNotificacionesVinculacionProps> = ({
  empleado,
  onClose
}) => {
  const notificaciones = empleado.vinculacion?.notificaciones || [];
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const handleCopiarMensaje = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleReenviarCorreo = async (notif: NotificacionVinculacion) => {
    setReenviandoId(notif.id);
    try {
      await despacharNotificacionVinculacion({
        destinatarioEmail: notif.destinatarioEmail,
        destinatarioNombre: notif.destinatarioNombre,
        asunto: notif.asunto,
        cuerpo: notif.mensaje,
        tipo: notif.tipo
      });
      setMensajeExito(`Notificación reenviada exitosamente a ${notif.destinatarioEmail}`);
      setTimeout(() => setMensajeExito(null), 4000);
    } finally {
      setReenviandoId(null);
    }
  };

  const handleEnviarWhatsapp = (notif: NotificacionVinculacion) => {
    const tel = (notif.destinatarioTelefono || empleado.telefono || '').replace(/\D/g, '');
    const num = tel.startsWith('57') ? tel : tel ? `57${tel}` : '';
    const url = `https://wa.me/${num}?text=${encodeURIComponent(notif.mensaje)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-fadeIn">
        {/* Cabecera */}
        <div className="bg-[#18235C] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F59E0B] border border-white/10">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Buzón de Notificaciones & Comunicaciones del Flujo de Vinculación
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Candidato / Colaborador: <strong className="text-white">{empleado.nombre}</strong> · C.C. {empleado.documento}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de éxito al reenviar */}
        {mensajeExito && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 px-6">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Lista de Notificaciones */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {notificaciones.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No hay registros de notificaciones emitidas aún para este colaborador.
            </div>
          ) : (
            notificaciones.map(n => {
              const esCandidato = n.destinatario === 'candidato';
              return (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          esCandidato
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {esCandidato ? 'Para Candidato / Colaborador' : 'Para Administración GH'}
                      </span>
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.fecha).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopiarMensaje(n.id, n.mensaje)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Copiar texto del mensaje"
                      >
                        {copiadoId === n.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      {esCandidato && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEnviarWhatsapp(n)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title="Despachar mensaje por WhatsApp al candidato"
                          >
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            disabled={reenviandoId === n.id}
                            onClick={() => handleReenviarCorreo(n)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 font-bold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Reenviar correo electrónico formal"
                          >
                            <Mail className="w-3 h-3 text-indigo-600" />
                            <span>{reenviandoId === n.id ? 'Reenviando...' : 'Reenviar Email'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{n.asunto}</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Destinatario: {n.destinatarioNombre} &lt;{n.destinatarioEmail}&gt;
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 whitespace-pre-line leading-relaxed font-sans max-h-48 overflow-y-auto">
                    {n.mensaje}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#18235C] text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
