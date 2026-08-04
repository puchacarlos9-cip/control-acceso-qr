import React, { useState } from 'react';
import { Usuario } from '../types';
import { Shield, Eye, EyeOff, Crown, Lock, UserCheck, AlertCircle, Trophy, Activity } from 'lucide-react';

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

  const handleQuickDemo = (role: 'super_admin' | 'admin' | 'guardia') => {
    const demoUser = usuarios.find((u) => u.rol === role);
    if (demoUser) {
      onShowToast(`Ingresando en modo sustentación de tesis: ${demoUser.nombre}`, 'info');
      onLoginSuccess(demoUser);
    } else {
      onShowToast('No se encontró usuario de prueba', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-950 text-white relative overflow-hidden">
      {/* Left / Hero Column - Sports Complex Theme */}
      <div className="lg:w-1/2 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1400')] bg-cover bg-center relative min-h-[260px] sm:min-h-[320px] lg:min-h-screen flex flex-col justify-end p-6 sm:p-10 lg:p-16 border-b lg:border-b-0 lg:border-r border-zinc-800/80">
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-zinc-950 via-zinc-950/75 to-transparent"></div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs sm:text-sm font-bold tracking-wide">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>PROYECTO DE TESIS DE GRADO • COMPLEJO DEPORTIVO</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500">
            CONTROL DE ACCESO DEPORTIVO
          </h1>
          <p className="text-sm sm:text-lg text-zinc-300 font-light max-w-lg leading-relaxed">
            Plataforma integral de gestión de aforo, verificación médica y validación de mensualidades de estudiantes-atletas mediante código QR y cédula.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-400">
            <span className="px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Validación Dual Médica & Cuotas
            </span>
            <span className="px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
              ⚡ Firestore Sync & Torniquetes
            </span>
          </div>
        </div>
      </div>

      {/* Right / Login Card Column */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-zinc-900/40">
        <div className="w-full max-w-md bg-zinc-900/90 p-6 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-xl">
          <div className="mb-7 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 mx-auto sm:mx-0 text-zinc-950">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">Iniciar Sesión</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Acceso a la plataforma de gestión e ingreso del Complejo Deportivo
            </p>
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
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 py-4 rounded-2xl text-base sm:text-lg font-bold text-zinc-950 hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-emerald-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              <span>{isLoading ? 'Autenticando...' : 'Ingresar al Complejo'}</span>
            </button>
          </form>

          {/* Quick Demo Role Selector - Perfect for Cellphones & Computadoras test */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulador de Defensa de Tesis</span>
              </span>
              <span className="text-[11px] text-zinc-500">Acceso rápido</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('super_admin')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/40 hover:border-purple-500 transition text-center group"
                title="Director General del Complejo Deportivo"
              >
                <Crown className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-purple-300">Director</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 hover:bg-blue-900/40 hover:border-blue-500 transition text-center group"
                title="Coordinador Deportivo & Atletas"
              >
                <UserCheck className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-blue-300">Coordinador</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('guardia')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 hover:bg-emerald-900/40 hover:border-emerald-500 transition text-center group"
                title="Operador de Torniquetes y Punto de Control"
              >
                <Shield className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-emerald-300">Torniquete</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 text-center mt-3">
              Credenciales por defecto: <span className="text-zinc-400 font-mono">superadmin / 123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
