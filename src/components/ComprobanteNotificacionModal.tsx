import React, { useState } from 'react';
import { UsuarioSistema } from '../types';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  Send,
  ShieldCheck,
  AlertTriangle,
  X,
  Share2
} from 'lucide-react';
import { enviarNotificacionCorreoNuevoUsuario } from '../lib/firebase';

export interface ComprobanteNotificacionData {
  usuario: UsuarioSistema;
  passwordTemporal: string;
  asunto: string;
  cuerpo: string;
  fechaEnvio: string;
  resultadoFirebase?: {
    success: boolean;
    message: string;
    method?: string;
    errorDetalle?: string;
  };
}

interface ComprobanteNotificacionModalProps {
  data: ComprobanteNotificacionData;
  onClose: () => void;
  tituloAdicional?: string;
}

export function ComprobanteNotificacionModal({
  data,
  onClose,
  tituloAdicional
}: ComprobanteNotificacionModalProps) {
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);
  const [copiadoClaveFeedback, setCopiadoClaveFeedback] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [mensajeReenvio, setMensajeReenvio] = useState<string | null>(null);

  const { usuario, passwordTemporal, asunto, cuerpo, fechaEnvio, resultadoFirebase } = data;

  const handleCopiarTodo = () => {
    navigator.clipboard.writeText(cuerpo);
    setCopiadoFeedback(true);
    setTimeout(() => setCopiadoFeedback(false), 3000);
  };

  const handleCopiarClave = () => {
    navigator.clipboard.writeText(passwordTemporal);
    setCopiadoClaveFeedback(true);
    setTimeout(() => setCopiadoClaveFeedback(false), 3000);
  };

  const handleReenviar = async () => {
    setReenviando(true);
    setMensajeReenvio(null);
    try {
      const res = await enviarNotificacionCorreoNuevoUsuario(
        usuario.email,
        usuario.nombre,
        usuario.rol,
        passwordTemporal
      );
      setMensajeReenvio(res.message);
    } catch (err: any) {
      setMensajeReenvio(`Error en el reenvío: ${err?.message || 'Fallo general'}`);
    } finally {
      setReenviando(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: asunto,
          text: cuerpo
        });
      } catch {
        // usuario canceló o no soportado
      }
    } else {
      handleCopiarTodo();
    }
  };

  // Enlaces directos a proveedores de correo web
  const encodedEmail = encodeURIComponent(usuario.email);
  const encodedAsunto = encodeURIComponent(asunto);
  const encodedCuerpo = encodeURIComponent(cuerpo);

  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmail}&su=${encodedAsunto}&body=${encodedCuerpo}`;
  const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodedEmail}&subject=${encodedAsunto}&body=${encodedCuerpo}`;
  const hotmailWebUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedEmail}&subject=${encodedAsunto}&body=${encodedCuerpo}`;
  const mailtoUrl = `mailto:${encodedEmail}?subject=${encodedAsunto}&body=${encodedCuerpo}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] shadow-2xl max-w-2xl w-full overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="bg-[#18235C] text-white px-6 py-4 flex items-center justify-between border-b border-[#101740]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {tituloAdicional || 'Credenciales y Notificación de Acceso'}
              </h3>
              <p className="text-[11px] text-[#8FA7D6]">
                B GROUP INGENIERIA S.A.S. · Entrega de cuenta institucional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8FA7D6] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1 bg-[#FFFFFF]">
          {/* Banner de Estado de Envío Firebase Auth */}
          {resultadoFirebase?.success ? (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                  <span>Enlace Oficial Despachado por Firebase</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Firebase Cloud Auth
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Se ha generado la cuenta y enviado el correo de activación oficial a:{' '}
                  <strong className="underline">{usuario.email}</strong>.
                </p>
                <p className="text-[10px] text-emerald-700 mt-1 font-medium">
                  Nota: Dependiendo del proveedor de correo (Gmail, Outlook o empresarial), el correo puede tardar 1-2 minutos o llegar a la carpeta de <strong>Spam / Correo no deseado</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>Despacho Directo Recomendado</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    Atención
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  {resultadoFirebase?.message || 'Por políticas del servidor de correo, use los accesos directos de Gmail Web, Outlook o Copiar para entregar las credenciales.'}
                </p>
              </div>
            </div>
          )}

          {mensajeReenvio && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px]">
              {mensajeReenvio}
            </div>
          )}

          {/* Resumen de credenciales de acceso rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
            <div>
              <span className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                Usuario / Correo Registrado:
              </span>
              <p className="text-xs font-bold text-[#18235C] break-all mt-0.5">{usuario.email}</p>
              <p className="text-[10px] text-[#282829]/70 mt-0.5">Doc: {usuario.documento} · Rol: {usuario.rol}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                Contraseña Temporal Provisoria:
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold font-mono text-[#18235C] bg-white px-2 py-1 rounded border border-blue-300 select-all">
                  {passwordTemporal}
                </span>
                <button
                  type="button"
                  onClick={handleCopiarClave}
                  className="px-2 py-1 rounded bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium text-[10px] flex items-center gap-1 transition-colors"
                  title="Copiar contraseña al portapapeles"
                >
                  {copiadoClaveFeedback ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiadoClaveFeedback ? 'Copiada' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Opciones directas de Despacho 1-Clic */}
          <div className="p-3 bg-slate-50 rounded-xl border border-[#8FA7D6]/40 space-y-2">
            <span className="text-[11px] font-bold text-[#18235C] flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-[#18235C]" />
              Enviar credenciales directamente al correo del colaborador (1 Clic):
            </span>
            <p className="text-[10px] text-[#282829]/70 leading-normal">
              Haga clic en su proveedor habitual para abrir la ventana de redacción con el destinatario, asunto y carta corporativa completamente listos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <a
                href={gmailWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors flex items-center justify-center gap-1.5 text-[11px] shadow-2xs"
                title="Abrir en Gmail Web con el mensaje listo para enviar"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Gmail Web</span>
              </a>

              <a
                href={outlookWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold transition-colors flex items-center justify-center gap-1.5 text-[11px] shadow-2xs"
                title="Abrir en Outlook Web / Office 365"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Outlook Web</span>
              </a>

              <a
                href={mailtoUrl}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold transition-colors flex items-center justify-center gap-1.5 text-[11px] shadow-2xs"
                title="Abrir en su aplicación de correo del sistema (Outlook Desktop, Mail, etc.)"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>App Correo (Mailto)</span>
              </a>
            </div>
          </div>

          {/* Vista previa del correo formal */}
          <div className="rounded-xl border border-[#8FA7D6] bg-slate-50 overflow-hidden shadow-2xs">
            <div className="bg-[#18235C]/5 px-4 py-2.5 border-b border-[#8FA7D6]/40 flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[#282829]/70">De:</span>
                <span className="font-semibold text-[#18235C]">
                  B GROUP INGENIERIA S.A.S. &lt;gestionhumana@bgroupingenieria.com&gt;
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#282829]/70">Para:</span>
                <span className="font-semibold text-[#18235C]">
                  {usuario.nombre} &lt;{usuario.email}&gt;
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#282829]/70">Asunto:</span>
                <span className="font-bold text-[#18235C]">{asunto}</span>
              </div>
            </div>

            <div className="p-4 bg-white">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto select-all">
                {cuerpo}
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="bg-slate-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#8FA7D6]/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarTodo}
              className="px-3 py-1.5 rounded-lg border border-[#8FA7D6] bg-white hover:bg-[#8FA7D6]/15 text-[#18235C] font-bold transition-colors flex items-center gap-1.5 text-xs"
            >
              {copiadoFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Mensaje Completo</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-1.5 rounded-lg border border-[#8FA7D6] bg-white hover:bg-[#8FA7D6]/15 text-[#18235C] font-bold transition-colors flex items-center gap-1.5 text-xs"
                title="Compartir mediante WhatsApp u otras aplicaciones"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartir</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReenviar}
              disabled={reenviando}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#8FA7D6] hover:bg-[#8FA7D6]/15 text-[#18235C] font-bold transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
              title="Reenviar enlace de activación oficial por Firebase"
            >
              <Send className={`w-3.5 h-3.5 ${reenviando ? 'animate-spin' : ''}`} />
              <span>{reenviando ? 'Reenviando...' : 'Reenviar Firebase'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-[#18235C] text-white font-bold hover:bg-[#101740] transition-colors text-xs ml-auto"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
