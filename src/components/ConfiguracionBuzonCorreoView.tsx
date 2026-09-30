import React, { useState, useEffect } from 'react';
import {
  Mail,
  Server,
  ShieldCheck,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Terminal,
  FileText,
  Info,
  Building2,
  Sparkles,
  ExternalLink,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { ConfiguracionBuzonCorreo, RegistroEnvioCorreo, UsuarioSistema, ConfiguracionEmpresa } from '../types';
import {
  CONFIG_BUZON_DEFAULT,
  obtenerConfiguracionBuzon,
  guardarConfiguracionBuzon,
  probarConexionBuzon,
  obtenerHistorialEnvios
} from '../services/buzonCorreoService';

interface ConfiguracionBuzonCorreoViewProps {
  currentUser?: UsuarioSistema | null;
  empresa?: ConfiguracionEmpresa;
}

export const ConfiguracionBuzonCorreoView: React.FC<ConfiguracionBuzonCorreoViewProps> = ({
  currentUser,
  empresa
}) => {
  const [config, setConfig] = useState<ConfiguracionBuzonCorreo>(CONFIG_BUZON_DEFAULT);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Estados de prueba
  const [emailPrueba, setEmailPrueba] = useState<string>(
    currentUser?.email || empresa?.contacto?.emailContactoGH || 'admin@cimiento.com.co'
  );
  const [probando, setProbando] = useState<boolean>(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ success: boolean; message: string; log: string } | null>(null);

  // Historial de logs
  const [historialLogs, setHistorialLogs] = useState<RegistroEnvioCorreo[]>([]);
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const buzonData = await obtenerConfiguracionBuzon();
        setConfig(buzonData);
        const logsData = await obtenerHistorialEnvios();
        setHistorialLogs(logsData);
      } catch (err) {
        console.error('Error cargando configuración del buzón:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  const handleGuardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGuardando(true);
    setMensajeFeedback(null);
    try {
      await guardarConfiguracionBuzon(config);
      setMensajeFeedback({
        tipo: 'exito',
        texto: '¡Parámetros del buzón de correo institucional guardados y actualizados correctamente!'
      });
      setTimeout(() => setMensajeFeedback(null), 5000);
    } catch (err) {
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Ocurrió un error al guardar la configuración en la base de datos.'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleEjecutarPrueba = async () => {
    setProbando(true);
    setResultadoPrueba(null);
    try {
      const res = await probarConexionBuzon(config, emailPrueba);
      setResultadoPrueba(res);
      const updatedConfig = {
        ...config,
        fechaUltimaPrueba: new Date().toISOString().replace('T', ' ').slice(0, 19),
        estadoPrueba: res.success ? ('Exitosa' as const) : ('Fallida' as const),
        detalleUltimaPrueba: res.message
      };
      setConfig(updatedConfig);
      await guardarConfiguracionBuzon(updatedConfig);
      const logs = await obtenerHistorialEnvios();
      setHistorialLogs(logs);
    } catch (err: any) {
      setResultadoPrueba({
        success: false,
        message: err?.message || 'Error de conexión durante el test SMTP.',
        log: `[ERROR] ${err?.message || 'Fallo general'}`
      });
    } finally {
      setProbando(false);
    }
  };

  const handlePresets = (proveedor: ConfiguracionBuzonCorreo['proveedor']) => {
    if (proveedor === 'gmail_workspace') {
      setConfig(prev => ({
        ...prev,
        proveedor,
        servidorSmtp: 'smtp.gmail.com',
        puertoSmtp: 587,
        seguridadSmtp: 'STARTTLS'
      }));
    } else if (proveedor === 'microsoft_365') {
      setConfig(prev => ({
        ...prev,
        proveedor,
        servidorSmtp: 'smtp.office365.com',
        puertoSmtp: 587,
        seguridadSmtp: 'STARTTLS'
      }));
    } else if (proveedor === 'amazon_ses') {
      setConfig(prev => ({
        ...prev,
        proveedor,
        servidorSmtp: 'email-smtp.us-east-1.amazonaws.com',
        puertoSmtp: 587,
        seguridadSmtp: 'STARTTLS'
      }));
    } else if (proveedor === 'sendgrid') {
      setConfig(prev => ({
        ...prev,
        proveedor,
        servidorSmtp: 'smtp.sendgrid.net',
        puertoSmtp: 587,
        seguridadSmtp: 'STARTTLS',
        usuarioSmtp: 'apikey'
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        proveedor: 'smtp_personalizado'
      }));
    }
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl border border-[#8FA7D6] p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-[#18235C] animate-spin mx-auto mb-3" />
        <h3 className="font-bold text-sm text-[#18235C]">Cargando configuración del buzón corporativo...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Superior Exclusivo Administrador */}
      <div className="bg-white rounded-2xl border border-[#8FA7D6] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#18235C] text-[#00FF00] uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#00FF00]" />
              Módulo Exclusivo Administrador · CIMIENTO
            </span>
            <span className="text-xs text-[#282829]/70">
              Gateway de Notificaciones SMTP & Correo Corporativo
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#18235C]">
            Configuración de Buzón de Salida (Email Gateway)
          </h2>
          <p className="text-xs text-[#282829]/70 mt-1 max-w-2xl">
            Conecte y homologue el correo institucional de la empresa para que las cartas de bienvenida, constancias, desprendibles de nómina y solicitudes de EPP sean despachadas desde el dominio corporativo oficial de <strong>{empresa?.nombreComercial || 'CIMIENTO'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleGuardar()}
            disabled={guardando}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#18235C]/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#00FF00]" />
            <span>{guardando ? 'Guardando...' : 'Guardar Parámetros'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {mensajeFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            mensajeFeedback.tipo === 'exito'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {mensajeFeedback.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{mensajeFeedback.texto}</span>
          </div>
          <button onClick={() => setMensajeFeedback(null)} className="font-bold hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Grid Principal de Configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Parámetros del Servidor y Remitente (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Identidad del Remitente Institucional */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/30 pb-3">
              <Mail className="w-4 h-4 text-[#18235C]" />
              1. Identidad del Remitente Corporativo (Cabecera del Correo)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Nombre a Mostrar del Remitente: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={config.nombreRemitente}
                  onChange={e => setConfig(c => ({ ...c, nombreRemitente: e.target.value }))}
                  placeholder="Ej. Gestión Humana — CIMIENTO S.A.S."
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Nombre institucional que visualizará el empleado en su bandeja de entrada.
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Correo Electrónico de Salida (From): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={config.emailRemitente}
                  onChange={e => setConfig(c => ({ ...c, emailRemitente: e.target.value }))}
                  placeholder="gestionhumana@cimiento.com.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Dirección corporativa autenticada. Reemplaza el remitente genérico de Firebase.
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Correo de Respuesta (Reply-To):
                </label>
                <input
                  type="email"
                  value={config.emailRespuesta || ''}
                  onChange={e => setConfig(c => ({ ...c, emailRespuesta: e.target.value }))}
                  placeholder="talento@cimiento.com.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.activo}
                    onChange={e => setConfig(c => ({ ...c, activo: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#18235C] block">Buzón Corporativo Habilitado</span>
                    <span className="text-[10px] text-slate-500">
                      Despachar notificaciones vía este servidor en lugar de los correos automáticos
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Servidor SMTP y Proveedor */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/30 pb-3">
              <Server className="w-4 h-4 text-[#18235C]" />
              2. Conectividad del Servidor SMTP / Gateway
            </h3>

            {/* Selector Rápido de Proveedor */}
            <div>
              <label className="block font-bold text-[#18235C] mb-1.5 text-xs">
                Plantilla / Proveedor de Servicio:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'smtp_personalizado', label: 'SMTP Propio' },
                  { id: 'gmail_workspace', label: 'Google Workspace' },
                  { id: 'microsoft_365', label: 'Microsoft 365' },
                  { id: 'amazon_ses', label: 'Amazon SES' },
                  { id: 'sendgrid', label: 'SendGrid' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePresets(item.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      config.proveedor === item.id
                        ? 'bg-[#18235C] text-white border-[#18235C] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-[#18235C] mb-1">
                  Servidor Host SMTP: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={config.servidorSmtp}
                  onChange={e => setConfig(c => ({ ...c, servidorSmtp: e.target.value }))}
                  placeholder="ej. smtp.gmail.com o mail.cimiento.com.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Puerto: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={config.puertoSmtp}
                  onChange={e => setConfig(c => ({ ...c, puertoSmtp: parseInt(e.target.value, 10) || 587 }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Cifrado / Seguridad:
                </label>
                <select
                  value={config.seguridadSmtp}
                  onChange={e => setConfig(c => ({ ...c, seguridadSmtp: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                >
                  <option value="STARTTLS">STARTTLS (Recomendado 587)</option>
                  <option value="SSL">SSL / TLS (Puerto 465)</option>
                  <option value="TLS">TLS Directo</option>
                  <option value="NINGUNA">Sin cifrado (Puerto 25)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Usuario de Autenticación:
                </label>
                <input
                  type="text"
                  value={config.usuarioSmtp}
                  onChange={e => setConfig(c => ({ ...c, usuarioSmtp: e.target.value }))}
                  placeholder="notificaciones@cimiento.com.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Clave / App Password: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={config.passwordSmtp}
                    onChange={e => setConfig(c => ({ ...c, passwordSmtp: e.target.value }))}
                    placeholder="••••••••••••••••"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Guía de Ayuda para Gmail / Google Workspace / Office 365 */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                <span>¿Cómo obtener la Contraseña de Aplicación (App Password)?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-900/90">
                • <strong>Google Workspace / Gmail:</strong> Si la cuenta tiene verificación en 2 pasos (2FA), Google no permite la contraseña regular. Ingrese a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-bold text-blue-800">myaccount.google.com/apppasswords</a>, cree una clave llamada &ldquo;CIMIENTO GH&rdquo; y pegue los 16 caracteres generados (sin espacios).
              </p>
              <p className="text-[11px] leading-relaxed text-blue-900/90">
                • <strong>Microsoft 365 / Outlook:</strong> Requiere habilitar &ldquo;SMTP Autenticado&rdquo; en el Centro de Administración de M365 para el usuario, o usar una contraseña de aplicación / token OAuth2.
              </p>
            </div>
          </div>

          {/* Card 3: Firma Legal y Pie de Página Habeas Data */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18235C] flex items-center gap-2 border-b border-[#8FA7D6]/30 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              3. Pie de Página Institucional & Habeas Data (Ley 1581 / CST)
            </h3>

            <div>
              <label className="block font-bold text-[#18235C] mb-1 text-xs">
                Cláusula de Confidencialidad y Protección de Datos Personales:
              </label>
              <textarea
                rows={3}
                value={config.firmalegalHabeasData || ''}
                onChange={e => setConfig(c => ({ ...c, firmalegalHabeasData: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#282829] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Test en Vivo y Bitácora de Envíos (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card de Test en Vivo */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/30 pb-3">
              <h4 className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#18235C]" />
                Prueba en Vivo de Conexión
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  config.estadoPrueba === 'Exitosa'
                    ? 'bg-emerald-100 text-emerald-800'
                    : config.estadoPrueba === 'Fallida'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {config.estadoPrueba || 'Pendiente'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#18235C] mb-1">
                  Enviar Correo de Prueba a:
                </label>
                <input
                  type="email"
                  value={emailPrueba}
                  onChange={e => setEmailPrueba(e.target.value)}
                  placeholder="tu.correo@empresa.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-xl text-xs text-[#18235C] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
                />
              </div>

              <button
                type="button"
                onClick={handleEjecutarPrueba}
                disabled={probando}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${probando ? 'animate-spin' : ''}`} />
                <span>{probando ? 'Verificando SMTP...' : 'Ejecutar Prueba de Envío'}</span>
              </button>

              {resultadoPrueba && (
                <div
                  className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                    resultadoPrueba.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {resultadoPrueba.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{resultadoPrueba.success ? 'Conexión Validada' : 'Error de Conexión'}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed">{resultadoPrueba.message}</p>
                  <pre className="p-2 bg-slate-900 text-slate-100 rounded-lg font-mono text-[9px] overflow-x-auto whitespace-pre-wrap max-h-32">
                    {resultadoPrueba.log}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Card de Bitácora / Historial de Despachos */}
          <div className="bg-white rounded-2xl border border-[#8FA7D6] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#8FA7D6]/30 pb-2">
              <h4 className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#18235C]" />
                Bitácora de Salida Reciente
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                {historialLogs.length} envíos
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {historialLogs.map(log => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-[#18235C]">
                    <span className="truncate max-w-[170px]" title={log.destinatario}>
                      {log.destinatario}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        log.estado === 'Entregado' || log.estado === 'Enviado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.estado}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 truncate" title={log.asunto}>
                    {log.asunto}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">{log.fecha}</div>
                </div>
              ))}

              {historialLogs.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No hay registros de envío recientes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
