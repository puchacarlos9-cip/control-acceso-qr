import React, { useState } from 'react';
import { Usuario } from '../types';
import { Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  usuarios: Usuario[];
  onLoginSuccess: (user: Usuario) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  usuarios,
  onLoginSuccess,
  onShowToast,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const uClean = username.toLowerCase().trim();
    if (!uClean || !password) {
      return onShowToast('Por favor, ingresa usuario y contraseña', 'error');
    }

    setIsLoading(true);
    setTimeout(() => {
      const found = usuarios.find(
        (u) => u.usuario.toLowerCase() === uClean && u.password === password
      );
      setIsLoading(false);

      if (!found) {
        onShowToast('Usuario o contraseña incorrectos', 'error');
      } else {
        onLoginSuccess(found);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-950 text-white relative overflow-hidden">
      {/* Left / Hero Column - Original Image & Title */}
      <div className="hidden lg:flex w-1/2 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent"></div>
        <div className="absolute bottom-16 left-16 text-white z-10">
          <h1 className="text-6xl font-black tracking-wider mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
            ACCESO SEGURO
          </h1>
          <p className="text-2xl text-zinc-300 font-light">
            Gestión y control de ingresos escolar
          </p>
        </div>
      </div>

      {/* Right / Login Card Column */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-zinc-900/50">
        <div className="w-full max-w-md bg-zinc-900 p-6 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-2">Iniciar Sesión</h2>
            <p className="text-zinc-400 text-sm">Ingresa al sistema de control</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                Usuario del Sistema
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: superadmin, admin, guardia"
                className="w-full bg-zinc-800/80 border border-zinc-700/60 rounded-2xl px-4 py-3.5 text-sm sm:text-base text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-zinc-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800/80 border border-zinc-700/60 rounded-2xl px-4 py-3.5 pr-12 text-sm sm:text-base text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-emerald-400 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 py-4 rounded-2xl text-base sm:text-lg font-bold text-zinc-950 hover:brightness-110 active:scale-[0.99] transition shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verificando...' : 'Ingresar'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
