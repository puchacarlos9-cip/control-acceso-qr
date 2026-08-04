import React, { useState } from 'react';
import { Usuario } from '../types';
import {
  Users,
  CreditCard,
  PieChart,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Shield,
  Crown,
  UserCheck,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface NavbarProps {
  user: Usuario;
  activeTab: 'estudiantes' | 'pagos' | 'reportes' | 'usuarios';
  onChangeTab: (tab: 'estudiantes' | 'pagos' | 'reportes' | 'usuarios') => void;
  onLogout: () => void;
  isFirebaseOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onChangeTab,
  onLogout,
  isFirebaseOnline,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  interface NavItem {
    id: 'estudiantes' | 'pagos' | 'reportes' | 'usuarios';
    label: string;
    icon: React.ElementType;
    badge: string;
    color: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'estudiantes',
      label: 'Atletas & Socios',
      icon: Users,
      badge: 'QR & Credenciales',
      color: 'emerald',
    },
    {
      id: 'pagos',
      label: 'Membresías & Cuotas',
      icon: CreditCard,
      badge: 'Aptitud & Pagos',
      color: 'teal',
    },
    {
      id: 'reportes',
      label: 'Aforo & Auditoría',
      icon: PieChart,
      badge: 'Accesos en Vivo',
      color: 'blue',
    },
  ];

  if (user.rol === 'super_admin') {
    navItems.push({
      id: 'usuarios',
      label: 'Personal & Roles',
      icon: ShieldAlert,
      badge: 'Súper Admin',
      color: 'purple',
    });
  }

  const titlesMap: Record<string, string> = {
    estudiantes: 'Gestión de Atletas & Socios',
    pagos: 'Membresías & Cuotas Deportivas',
    reportes: 'Dashboard de Aforo y Auditoría',
    usuarios: 'Gestión de Personal del Complejo',
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on lg+) */}
      <aside className="hidden lg:flex w-64 bg-[#121212] border-r border-zinc-800/80 flex-col justify-between flex-shrink-0 min-h-screen">
        <div>
          {/* Logo & Brand */}
          <div className="p-6 flex items-center gap-3 border-b border-zinc-800/60">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-wide text-white">
                COMPLEJO DEPORTIVO
              </h2>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                Control de Acceso QR (Tesis)
              </span>
            </div>
          </div>

          {/* User info box */}
          <div className="m-4 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400">
              {user.rol === 'super_admin' ? (
                <Crown className="w-5 h-5 text-purple-400" />
              ) : (
                <UserCheck className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-white truncate">
                {user.nombre}
              </div>
              <div className="text-[11px] text-zinc-400 capitalize">
                {user.rol === 'super_admin' ? 'Súper Administrador' : 'Administrador'}
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5 px-3 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isPurple = item.id === 'usuarios';

              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition font-semibold text-sm ${
                    isActive
                      ? isPurple
                        ? 'bg-purple-900/30 text-purple-300 border-l-4 border-purple-500 shadow-md'
                        : 'bg-zinc-800/90 text-white border-l-4 border-emerald-500 shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? isPurple
                            ? 'text-purple-400'
                            : 'text-emerald-400'
                          : 'text-zinc-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'usuarios' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom bar & Firebase indicator */}
        <div className="p-4 border-t border-zinc-800/60 space-y-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              {isFirebaseOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="text-zinc-300 font-medium">
                {isFirebaseOnline ? 'Firebase Activo' : 'Modo Local / Demo'}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-zinc-900 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 transition font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOPBAR (Visible on < lg screens) - Perfectly responsive for smartphones! */}
      <div className="lg:hidden w-full bg-[#121212] border-b border-zinc-800/80 sticky top-0 z-[80] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-zinc-950 font-black">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-black text-sm tracking-wide text-white leading-tight">
                  ACCESO SEGURO
                </h1>
                <p className="text-[10px] text-emerald-400 font-semibold leading-tight truncate max-w-[170px]">
                  {titlesMap[activeTab]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{user.nombre.split(' ')[0]}</span>
            </span>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-zinc-800 text-red-400 hover:bg-red-500/20 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER (Slide out menu for cellphones) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-72 max-w-[85vw] bg-[#121212] border-r border-zinc-800 p-5 flex flex-col justify-between z-10 shadow-2xl animate-slide-right">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-zinc-950 font-black">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-white">
                      ACCESO SEGURO
                    </h2>
                    <span className="text-[11px] text-emerald-400 block">
                      Menú Responsivo
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User badge */}
              <div className="my-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400">
                  {user.rol === 'super_admin' ? (
                    <Crown className="w-4 h-4 text-purple-400" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-sm text-white truncate">
                    {user.nombre}
                  </div>
                  <div className="text-[11px] text-zinc-400 capitalize">
                    {user.rol === 'super_admin' ? 'Súper Administrador' : 'Administrador'}
                  </div>
                </div>
              </div>

              {/* Drawer Nav links */}
              <nav className="space-y-2 mt-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isPurple = item.id === 'usuarios';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChangeTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition font-semibold text-sm ${
                        isActive
                          ? isPurple
                            ? 'bg-purple-900/30 text-purple-300 border-l-4 border-purple-500'
                            : 'bg-zinc-800 text-white border-l-4 border-emerald-500'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-5 h-5 ${
                            isActive
                              ? isPurple
                                ? 'text-purple-400'
                                : 'text-emerald-400'
                              : 'text-zinc-500'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.id === 'usuarios' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                          ADMIN
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 text-xs text-zinc-300">
                <span>{isFirebaseOnline ? '🟢 Firebase Online' : '🟡 Modo Local'}</span>
                <span className="text-zinc-500 text-[10px]">v2.5 Responsive</span>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
