import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Clock,
  Radio,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Sparkles
} from 'lucide-react';
import { UsuarioSistema, ConfiguracionEmpresa } from '../types';
import {
  loginConEmail,
  loginConGoogle,
  obtenerPerfilUsuario,
  solicitarRestablecimientoClave,
} from '../lib/firebase';

interface LoginViewProps {
  empresa?: ConfiguracionEmpresa;
  usuarios?: UsuarioSistema[];
  onLoginSuccess: (usuario: UsuarioSistema) => void;
  onIrAVerificacion?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  empresa,
  onLoginSuccess,
  onIrAVerificacion
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const [resetCooldown, setResetCooldown] = useState<number>(() => {
    const lastReset = localStorage.getItem('cimiento_last_pwd_reset');
    if (lastReset) {
      const elapsed = Math.floor((Date.now() - parseInt(lastReset, 10)) / 1000);
      return elapsed < 60 ? 60 - elapsed : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  const finishLogin = async (uid: string, emailStr?: string) => {
    const profile = await obtenerPerfilUsuario(uid, emailStr);
    if (!profile || profile.estado !== 'activo') {
      throw new Error('La cuenta no tiene un perfil activo autorizado. Contacte al administrador.');
    }
    onLoginSuccess(profile);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Por favor ingrese su correo corporativo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const credential = await loginConEmail(cleanEmail, password);
      await finishLogin(credential.user.uid, cleanEmail);
    } catch (err: any) {
      setError(
        err?.code === 'auth/invalid-credential'
          ? 'Credenciales inválidas. Verifique su correo y contraseña.'
          : (err?.message || 'No fue posible iniciar sesión.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const { user } = await loginConGoogle();
      await finishLogin(user.uid, user.email || undefined);
    } catch (err: any) {
      setError(err?.message || 'No fue posible iniciar sesión con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (resetCooldown > 0) {
      setError(`Espere ${resetCooldown} segundos antes de solicitar otro enlace de restablecimiento.`);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Escriba su correo corporativo para solicitar el restablecimiento.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await solicitarRestablecimientoClave(cleanEmail);
      localStorage.setItem('cimiento_last_pwd_reset', Date.now().toString());
      setResetCooldown(60);
      setMessage('Si la cuenta existe, recibirá instrucciones para restablecer la contraseña en su correo corporativo.');
    } catch {
      setError('No fue posible procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  const nombreComercial = empresa?.nombreComercial || 'B GROUP INGENIERIA';
  const razonSocial = empresa?.razonSocial || 'B GROUP INGENIERIA S.A.S.';
  const logoUrl = empresa?.identidadVisual?.logoUrl;
  const lema = empresa?.identidadVisual?.lemaInstitucional || 'Ingeniería y Conectividad con Excelencia Humana';

  return (
    <div className="min-h-screen bg-[#0A0F26] text-slate-100 flex flex-col justify-between selection:bg-[#38BDF8]/30 selection:text-white relative overflow-hidden font-sans">
      {/* Luces y ambientación de telecomunicaciones de fondo (nodos de fibra y radio) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Malla de cuadrícula de ingeniería */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E2958_1px,transparent_1px),linear-gradient(to_bottom,#1E2958_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-35" />

        {/* Gradientes luminosos de conectividad óptica */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#18235C] rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#06B6D4]/15 to-[#3B82F6]/10 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#18235C]/80 rounded-full blur-3xl opacity-50" />
      </div>

      {/* HEADER SUPERIOR INSTITUCIONAL */}
      <header className="relative z-10 w-full border-b border-white/10 bg-[#0A0F26]/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo y Nombre Institucional */}
          <div className="flex items-center gap-3">
            {logoUrl && !imgError ? (
              <div className="bg-white p-1.5 sm:p-2 rounded-xl border border-slate-200/90 shadow-md flex items-center justify-center max-h-12 overflow-hidden">
                <img
                  src={logoUrl}
                  alt={nombreComercial}
                  className="max-h-8 sm:max-h-9 w-auto max-w-full object-contain"
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#18235C] to-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-lg border border-white/20 relative">
                <span className="font-extrabold text-lg text-white font-mono">B</span>
                <span className="w-2 h-2 rounded-full bg-[#06B6D4] absolute -top-0.5 -right-0.5 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-[#06B6D4] absolute -top-0.5 -right-0.5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-white tracking-wide leading-tight">
                  {nombreComercial}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#06B6D4]/15 text-[#38BDF8] border border-[#06B6D4]/30">
                  <Radio className="w-2.5 h-2.5" /> Telecomunicaciones
                </span>
              </div>
              <span className="text-[11px] text-[#8FA7D6] font-medium tracking-wider block leading-tight">
                {razonSocial}
              </span>
            </div>
          </div>

          {/* Acciones y enlace de validación pública de certificados */}
          <div className="flex items-center gap-3">
            {onIrAVerificacion && (
              <button
                type="button"
                onClick={onIrAVerificacion}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                title="Validar autenticidad de diplomas SST y certificados laborales oficiales"
              >
                <QrCode className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="hidden sm:inline">Verificar Diploma / Certificado</span>
                <span className="sm:hidden">Verificar QR</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL: PORTADA + ACCESO CORPORATIVO */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* COLUMNA IZQUIERDA: PORTADA ESTÉTICA */}
          <section className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            {/* Tag institucional */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18235C]/80 border border-[#8FA7D6]/40 text-[#8FA7D6] text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="tracking-wide">PORTAL CORPORATIVO CIMIENTO · GESTIÓN HUMANA & SG-SST</span>
            </div>

            {/* Titular de la Portada */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Somos un equipo, una misma red y <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#A78BFA]">una sola conexión</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Plataforma integrada para la gestión del talento humano, intermente estamos conectado en una misma red
              </p>
            </div>

            {/* Lema institucional destacado */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#18235C]/70 via-[#131B45]/70 to-[#0A0F26]/70 border border-[#8FA7D6]/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-10 rounded-full bg-[#38BDF8]" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8FA7D6] block">
                    Lema Institucional
                  </span>
                  <p className="text-sm font-semibold text-white italic">
                    "{lema}"
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* COLUMNA DERECHA: TARJETA DE LOGIN CON EL LOGO INSTITUCIONAL */}
          <section className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-6 sm:p-8 text-[#282829] relative overflow-hidden">
              
              {/* Barra superior de acento con colores institucionales */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#18235C] via-[#2563EB] to-[#06B6D4]" />

              {/* ENCABEZADO DE LA TARJETA CON EL LOGO USADO EN TODO EL SISTEMA */}
              <div className="text-center pb-5 mb-5 border-b border-slate-100">
                {/* Contenedor del Logo Institucional con fondo blanco puro y marco elegante */}
                <div className="flex justify-center mb-3">
                  {logoUrl && !imgError ? (
                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center max-h-20 min-h-[56px] w-auto max-w-[240px] transition-transform hover:scale-105">
                      <img
                        src={logoUrl}
                        alt={nombreComercial}
                        className="max-h-14 w-auto max-w-full object-contain"
                        onError={() => setImgError(true)}
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 px-4 py-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#18235C] to-[#0D153B] text-white flex items-center justify-center shrink-0 shadow-md">
                        <span className="font-extrabold text-xl text-white font-mono">B</span>
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-[#18235C] tracking-tight block leading-tight">
                          {nombreComercial}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold tracking-wider block leading-tight uppercase">
                          Telecomunicaciones & TIC
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-extrabold text-[#18235C] tracking-tight">
                  Acceso al Sistema
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ingrese con sus credenciales autorizadas
                </p>
              </div>

              {/* ALERTAS DE ERROR O CONFIRMACIÓN */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {message && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              {/* BOTÓN DE GOOGLE SSO */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>

              {/* SEPARADOR */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                    O con correo institucional
                  </span>
                </div>
              </div>

              {/* FORMULARIO DE ACCESO */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#18235C]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="usuario@bgroup.com.co"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#18235C] focus:border-transparent transition-all"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#18235C]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#18235C] focus:border-transparent transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(val => !val)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* OLVIDÓ CONTRASEÑA */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading || resetCooldown > 0}
                    className="text-[#18235C] hover:text-[#2563EB] font-semibold underline underline-offset-2 disabled:opacity-50 disabled:no-underline flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {resetCooldown > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Reintentar en {resetCooldown}s
                      </>
                    ) : (
                      '¿Olvidó su contraseña?'
                    )}
                  </button>
                  <span className="text-[11px] text-slate-400">Portal Seguro</span>
                </div>

                {/* BOTÓN SUBMIT */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 bg-[#18235C] hover:bg-[#101740] text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verificando credenciales…</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* FOOTER INTERNO DE LA TARJETA */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Cifrado TLS de punto a punto · Habeas Data Ley 1581</span>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER INFERIOR INSTITUCIONAL */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#0A0F26]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-300">{razonSocial}</span> · Sector Telecomunicaciones
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Resolución 0312 de 2019 (SG-SST)</span>
            <span>·</span>
            <span>Código Sustantivo del Trabajo (CST)</span>
            <span>·</span>
            <span>Ley 527 de 1999</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
