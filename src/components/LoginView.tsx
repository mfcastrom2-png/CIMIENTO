import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Clock } from 'lucide-react';
import { UsuarioSistema } from '../types';
import {
  loginConEmail,
  loginConGoogle,
  obtenerPerfilUsuario,
  solicitarRestablecimientoClave,
} from '../lib/firebase';

interface LoginViewProps {
  usuarios?: UsuarioSistema[];
  onLoginSuccess: (usuario: UsuarioSistema) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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

  const finishLogin = async (uid: string) => {
    const profile = await obtenerPerfilUsuario(uid);
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
      setError('Ingrese correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const credential = await loginConEmail(cleanEmail, password);
      await finishLogin(credential.user.uid);
    } catch (err: any) {
      setError(err?.code === 'auth/invalid-credential'
        ? 'Credenciales inválidas.'
        : (err?.message || 'No fue posible iniciar sesión.'));
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
      await finishLogin(user.uid);
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
      setError('Escriba su correo para solicitar el restablecimiento.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await solicitarRestablecimientoClave(cleanEmail);
      localStorage.setItem('cimiento_last_pwd_reset', Date.now().toString());
      setResetCooldown(60);
      setMessage('Si la cuenta existe, recibirá instrucciones para restablecer la contraseña en su bandeja de entrada.');
    } catch {
      setError('No fue posible procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-[#8FA7D6]/50 shadow-md p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#18235C]">CIMIENTO</h1>
          <p className="text-sm text-[#282829] mt-1">Portal corporativo de Gestión Humana y SG-SST</p>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        {message && <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{message}</div>}
        <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full py-2.5 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C] disabled:opacity-50 hover:bg-[#8FA7D6]/10 transition-colors">Continuar con Google</button>
        <div className="my-5 border-t border-[#8FA7D6]/30" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-[#282829]">Correo electrónico
            <div className="relative mt-1"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#18235C]" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-[#8FA7D6] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#18235C]" autoComplete="email" /></div>
          </label>
          <label className="block text-sm font-semibold text-[#282829]">Contraseña
            <div className="relative mt-1"><Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#18235C]" /><input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 pr-10 py-2 border border-[#8FA7D6] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#18235C]" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
          </label>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading || resetCooldown > 0}
              className="text-sm text-[#18235C] underline disabled:opacity-50 disabled:no-underline flex items-center gap-1.5"
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
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-[#18235C] text-white rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50 hover:bg-[#101740] transition-colors">{isLoading ? 'Verificando…' : 'Iniciar sesión'}<ArrowRight className="w-4 h-4" /></button>
        </form>
      </section>
    </main>
  );
};
