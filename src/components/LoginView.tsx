import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
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
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Escriba su correo para solicitar el restablecimiento.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await solicitarRestablecimientoClave(cleanEmail);
      setMessage('Si la cuenta existe, recibirá instrucciones para restablecer la contraseña.');
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
        <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full py-2.5 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C] disabled:opacity-50">Continuar con Google</button>
        <div className="my-5 border-t border-[#8FA7D6]/30" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-[#282829]">Correo electrónico
            <div className="relative mt-1"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#18235C]" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-[#8FA7D6] rounded-lg" autoComplete="email" /></div>
          </label>
          <label className="block text-sm font-semibold text-[#282829]">Contraseña
            <div className="relative mt-1"><Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#18235C]" /><input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 pr-10 py-2 border border-[#8FA7D6] rounded-lg" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-2.5"><Eye className="w-4 h-4" /></button></div>
          </label>
          <button type="button" onClick={handleReset} className="text-sm text-[#18235C] underline">¿Olvidó su contraseña?</button>
          <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-[#18235C] text-white rounded-lg font-bold flex justify-center gap-2 disabled:opacity-50">{isLoading ? 'Verificando…' : 'Iniciar sesión'}<ArrowRight className="w-4 h-4" /></button>
        </form>
      </section>
    </main>
  );
};
