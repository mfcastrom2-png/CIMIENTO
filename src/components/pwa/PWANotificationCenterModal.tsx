import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  FileText,
  Briefcase,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { pwaNotificationService } from '../../services/pwaNotificationService';
import { NotificacionPWAColaborador, TipoNotificacionPWA, UsuarioSistema } from '../../types';

interface PWANotificationCenterModalProps {
  currentUser?: UsuarioSistema | null;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const PWANotificationCenterModal: React.FC<PWANotificationCenterModalProps> = ({
  currentUser,
  onClose,
  onNavigate
}) => {
  const [notificaciones, setNotificaciones] = useState<NotificacionPWAColaborador[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | TipoNotificacionPWA | 'no_leidas'>('todas');
  const [permisoEstado, setPermisoEstado] = useState<NotificationPermission>(() => {
    return pwaNotificationService.obtenerEstadoPermiso();
  });
  const [solicitandoPermiso, setSolicitandoPermiso] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  const cargarNotificaciones = () => {
    const list = pwaNotificationService.obtenerNotificaciones(currentUser?.empleadoId);
    setNotificaciones(list);
    setPermisoEstado(pwaNotificationService.obtenerEstadoPermiso());
  };

  useEffect(() => {
    cargarNotificaciones();

    const handleActualizacion = () => {
      cargarNotificaciones();
    };

    window.addEventListener('pwa:notificaciones-actualizadas', handleActualizacion);
    return () => {
      window.removeEventListener('pwa:notificaciones-actualizadas', handleActualizacion);
    };
  }, [currentUser]);

  const showToast = (msg: string) => {
    setMensajeToast(msg);
    setTimeout(() => setMensajeToast(null), 3500);
  };

  const handleSolicitarPermiso = async () => {
    setSolicitandoPermiso(true);
    try {
      const res = await pwaNotificationService.solicitarPermiso();
      setPermisoEstado(res);
      if (res === 'granted') {
        showToast('¡Notificaciones Push activadas con éxito!');
      } else {
        showToast('Permiso de notificaciones no concedido.');
      }
    } finally {
      setSolicitandoPermiso(false);
    }
  };

  const handleMarcarLeida = (id: string) => {
    pwaNotificationService.marcarComoLeida(id);
    cargarNotificaciones();
  };

  const handleMarcarTodasLeidas = () => {
    pwaNotificationService.marcarTodasComoLeidas(currentUser?.empleadoId);
    cargarNotificaciones();
    showToast('Todas las alertas marcadas como leídas');
  };

  const handleEliminar = (id: string) => {
    pwaNotificationService.eliminarNotificacion(id);
    cargarNotificaciones();
  };

  const handleAccionEnlace = (notif: NotificacionPWAColaborador) => {
    handleMarcarLeida(notif.id);
    onClose();
    if (onNavigate && notif.enlaceAccion) {
      onNavigate(notif.enlaceAccion);
    }
  };

  // Simulación rápida para pruebas inmediatas del usuario
  const handleSimularAlertaNomina = async () => {
    await pwaNotificationService.registrarNotificacion({
      tipo: 'nomina_desprendible',
      titulo: '💰 Volante de Nómina Disponible',
      mensaje: 'Su desprendible de pago de nómina correspondiente al período actual ya se encuentra liquidado y firmado. Ingrese a revisarlo.',
      enlaceAccion: '/nomina',
      periodoNomina: 'Período Activo',
      empleadoId: currentUser?.empleadoId || 'e1',
      dispararPush: true
    });
    cargarNotificaciones();
    showToast('Alerta push de nómina despachada');
  };

  const handleSimularAlertaManual = async () => {
    await pwaNotificationService.registrarNotificacion({
      tipo: 'manual_funciones',
      titulo: '📋 Actualización en Manual de Funciones',
      mensaje: 'Se han formalizado modificaciones en el manual de funciones y responsabilidades SG-SST asociadas a su cargo.',
      enlaceAccion: '/cargos',
      cargoNombre: 'Técnico de Operaciones',
      versionManual: 'V.2026.3',
      empleadoId: currentUser?.empleadoId || 'e1',
      dispararPush: true
    });
    cargarNotificaciones();
    showToast('Alerta push de manual de funciones despachada');
  };

  // Filtrado
  const notificacionesFiltradas = notificaciones.filter(n => {
    if (filtroTipo === 'todas') return true;
    if (filtroTipo === 'no_leidas') return !n.leido;
    return n.tipo === filtroTipo;
  });

  const conteoNoLeidas = notificaciones.filter(n => !n.leido).length;
  const conteoNomina = notificaciones.filter(n => n.tipo === 'nomina_desprendible').length;
  const conteoManual = notificaciones.filter(n => n.tipo === 'manual_funciones').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn my-6 max-h-[92vh] flex flex-col text-slate-800">
        {/* Cabecera del Centro de Notificaciones */}
        <div className="bg-[#18235C] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F59E0B] border border-white/10 relative">
              <Bell className="w-5 h-5" />
              {conteoNoLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-[#18235C]">
                  {conteoNoLeidas}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Centro de Notificaciones PWA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B] text-[#18235C]">
                  Colaboradores
                </span>
              </div>
              <p className="text-xs text-[#8FA7D6] mt-0.5">
                Alertas push de nómina, desprendibles y manuales de funciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Estado del Permiso Push */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#18235C] shrink-0" />
            <div>
              <span className="font-semibold text-slate-700">Estado Alertas Push en este dispositivo: </span>
              {permisoEstado === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Habilitadas
                </span>
              ) : permisoEstado === 'denied' ? (
                <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertTriangle className="w-3 h-3" /> Bloqueadas en navegador
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Pendiente de activación
                </span>
              )}
            </div>
          </div>

          {permisoEstado !== 'granted' && (
            <button
              onClick={handleSolicitarPermiso}
              disabled={solicitandoPermiso}
              className="px-3 py-1.5 rounded-lg bg-[#18235C] hover:bg-[#101740] text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{solicitandoPermiso ? 'Solicitando...' : 'Activar Push Móvil'}</span>
            </button>
          )}
        </div>

        {/* Toast temporal de retroalimentación */}
        {mensajeToast && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{mensajeToast}</span>
          </div>
        )}

        {/* Barra de Filtros y Acciones */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFiltroTipo('todas')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filtroTipo === 'todas'
                  ? 'bg-[#18235C] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({notificaciones.length})
            </button>
            <button
              onClick={() => setFiltroTipo('nomina_desprendible')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                filtroTipo === 'nomina_desprendible'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Nómina ({conteoNomina})</span>
            </button>
            <button
              onClick={() => setFiltroTipo('manual_funciones')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                filtroTipo === 'manual_funciones'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Briefcase className="w-3 h-3" />
              <span>Manual ({conteoManual})</span>
            </button>
            <button
              onClick={() => setFiltroTipo('no_leidas')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filtroTipo === 'no_leidas'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              No leídas ({conteoNoLeidas})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {conteoNoLeidas > 0 && (
              <button
                onClick={handleMarcarTodasLeidas}
                className="text-[11px] font-bold text-[#18235C] hover:underline flex items-center gap-1 cursor-pointer"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
          {notificacionesFiltradas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No hay notificaciones en este filtro</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Aquí aparecerán las alertas push de comprobantes de pago de nómina y actualizaciones de manuales de funciones.
              </p>
            </div>
          ) : (
            notificacionesFiltradas.map(notif => {
              const isNomina = notif.tipo === 'nomina_desprendible';
              const isManual = notif.tipo === 'manual_funciones';

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all shadow-xs ${
                    notif.leido
                      ? 'bg-white border-slate-200 opacity-90'
                      : 'bg-white border-indigo-200 ring-1 ring-indigo-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isNomina
                            ? 'bg-emerald-100 text-emerald-800'
                            : isManual
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isNomina ? (
                          <FileText className="w-5 h-5" />
                        ) : isManual ? (
                          <Briefcase className="w-5 h-5" />
                        ) : (
                          <Bell className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isNomina
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isManual
                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {isNomina
                              ? 'Nómina & Desprendibles'
                              : isManual
                              ? 'Manual de Funciones'
                              : 'Institucional'}
                          </span>

                          {!notif.leido && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" title="No leída" />
                          )}

                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(notif.fechaCreacion).toLocaleString('es-CO', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {notif.titulo}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {notif.mensaje}
                        </p>

                        {/* Metadatos adicionales */}
                        {(notif.periodoNomina || notif.cargoNombre || notif.versionManual) && (
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                            {notif.periodoNomina && (
                              <span>Periodo: <strong className="text-slate-700">{notif.periodoNomina}</strong></span>
                            )}
                            {notif.cargoNombre && (
                              <span>Cargo: <strong className="text-slate-700">{notif.cargoNombre}</strong></span>
                            )}
                            {notif.versionManual && (
                              <span>Versión: <strong className="text-slate-700">{notif.versionManual}</strong></span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEliminar(notif.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Eliminar notificación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Acciones al pie de la notificación */}
                  {notif.enlaceAccion && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleAccionEnlace(notif)}
                        className="px-3 py-1.5 rounded-lg bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>
                          {isNomina
                            ? 'Consultar Desprendible Oficial'
                            : isManual
                            ? 'Ver Manual de Funciones del Cargo'
                            : 'Ver Detalle'}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#F59E0B]" />
                      </button>

                      {!notif.leido && (
                        <button
                          onClick={() => handleMarcarLeida(notif.id)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pie con herramientas de simulación / prueba para administradores y revisores */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="font-semibold">Simular despacho Push (Pruebas PWA):</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimularAlertaNomina}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
              title="Disparar notificación push de nuevo desprendible de nómina"
            >
              <FileText className="w-3 h-3 text-emerald-600" />
              <span>+ Push Nómina</span>
            </button>

            <button
              onClick={handleSimularAlertaManual}
              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 font-bold rounded-lg text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
              title="Disparar notificación push de actualización en manual de funciones"
            >
              <Briefcase className="w-3 h-3 text-purple-600" />
              <span>+ Push Manual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
