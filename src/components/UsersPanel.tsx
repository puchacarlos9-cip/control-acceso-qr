import React, { useState } from 'react';
import { Usuario, RolUsuario, TurnoGuardia } from '../types';
import {
  UserPlus,
  Shield,
  Trash2,
  Crown,
  UserCheck,
  Search,
  X,
  Lock,
  Clock,
} from 'lucide-react';

interface UsersPanelProps {
  usuarios: Usuario[];
  onAddUsuario: (nuevo: Omit<Usuario, 'id'>) => Promise<void>;
  onDeleteUsuario: (id: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UsersPanel: React.FC<UsersPanelProps> = ({
  usuarios,
  onAddUsuario,
  onDeleteUsuario,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<RolUsuario>('guardia');
  const [turno, setTurno] = useState<TurnoGuardia>('Matutino');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const cleanUser = usuario.toLowerCase().trim();

    if (!cleanNombre || !cleanUser || !password) {
      return onShowToast('Llena todos los campos del usuario', 'error');
    }

    if (usuarios.some((u) => u.usuario.toLowerCase() === cleanUser)) {
      return onShowToast('Ese nombre de usuario ya está registrado', 'error');
    }

    setIsSubmitting(true);
    try {
      await onAddUsuario({
        nombre: cleanNombre,
        usuario: cleanUser,
        password: password,
        rol: rol,
        turno: rol === 'guardia' ? turno : undefined,
      });
      setIsModalOpen(false);
      setNombre('');
      setUsuario('');
      setPassword('');
      setRol('guardia');
      setTurno('Matutino');
      onShowToast('Personal creado exitosamente en el sistema', 'success');
    } catch (err) {
      onShowToast('Error al crear usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = usuarios.filter((usr) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      usr.nombre.toLowerCase().includes(term) ||
      usr.usuario.toLowerCase().includes(term) ||
      usr.rol.includes(term)
    );
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212]/80 p-5 rounded-3xl border border-purple-900/30">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <span>Gestión de Personal y Roles (Súper Admin)</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Control de acceso administrativo, guardias de seguridad y turnos asignados al campus.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/20 whitespace-nowrap text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Personal</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, usuario (@) o rol..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 transition placeholder:text-zinc-600"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table & Responsive Mobile Cards */}
      <div className="bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Personal</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Turno (Guardia)</th>
                <th className="px-6 py-4 font-semibold text-center">Rol Asignado</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-500">
                    No se encontró personal que coincida.
                  </td>
                </tr>
              ) : (
                filtered.map((usr) => {
                  let badge = '';
                  let icon = <Shield className="w-3.5 h-3.5" />;
                  if (usr.rol === 'super_admin') {
                    badge =
                      'bg-purple-900/40 text-purple-300 border border-purple-700/60';
                    icon = <Crown className="w-3.5 h-3.5 text-purple-400" />;
                  } else if (usr.rol === 'admin') {
                    badge =
                      'bg-blue-900/40 text-blue-300 border border-blue-700/60';
                    icon = <UserCheck className="w-3.5 h-3.5 text-blue-400" />;
                  } else {
                    badge =
                      'bg-emerald-900/40 text-emerald-300 border border-emerald-700/60';
                    icon = <Shield className="w-3.5 h-3.5 text-emerald-400" />;
                  }

                  return (
                    <tr key={usr.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        {usr.nombre}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-400">
                        @{usr.usuario}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {usr.turno ? (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{usr.turno}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge}`}
                        >
                          {icon}
                          <span className="capitalize">
                            {usr.rol === 'super_admin'
                              ? 'Súper Admin'
                              : usr.rol === 'admin'
                              ? 'Administrador'
                              : 'Guardia'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {usr.rol === 'super_admin' && usr.usuario === 'superadmin' ? (
                          <span className="text-xs text-zinc-600 italic">
                            Sistema
                          </span>
                        ) : (
                          <button
                            onClick={() => onDeleteUsuario(usr.id)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-zinc-800/50">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No se encontró personal.
            </div>
          ) : (
            filtered.map((usr) => {
              let badge = '';
              let label = '';
              if (usr.rol === 'super_admin') {
                badge = 'bg-purple-900/40 text-purple-300 border border-purple-700/60';
                label = 'Súper Admin';
              } else if (usr.rol === 'admin') {
                badge = 'bg-blue-900/40 text-blue-300 border border-blue-700/60';
                label = 'Admin';
              } else {
                badge =
                  'bg-emerald-900/40 text-emerald-300 border border-emerald-700/60';
                label = 'Guardia';
              }

              return (
                <div key={usr.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-white text-base">
                        {usr.nombre}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        @{usr.usuario}
                      </div>
                      {usr.turno && (
                        <div className="text-xs text-emerald-400 mt-1">
                          Turno: {usr.turno}
                        </div>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${badge}`}
                    >
                      {label}
                    </span>
                  </div>

                  <div className="flex justify-end pt-1">
                    {usr.rol === 'super_admin' && usr.usuario === 'superadmin' ? (
                      <span className="text-xs text-zinc-600 italic">
                        Cuenta base del sistema
                      </span>
                    ) : (
                      <button
                        onClick={() => onDeleteUsuario(usr.id)}
                        className="text-xs bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revocar Acceso</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: REGISTRAR NUEVO PERSONAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-md p-6 sm:p-7 rounded-3xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Registrar Personal</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Marco Gómez"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Usuario (@ login) *
                </label>
                <input
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej: mgomez"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Rol Asignado
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as RolUsuario)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="guardia">👮 Guardia de Seguridad (Terminal QR / Cédula)</option>
                  <option value="admin">🛡️ Administrador (Alumnos, Pagos, Reportes)</option>
                  <option value="super_admin">👑 Súper Administrador (Control Total)</option>
                </select>
              </div>

              {rol === 'guardia' && (
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Turno Asignado
                  </label>
                  <select
                    value={turno}
                    onChange={(e) =>
                      setTurno(e.target.value as TurnoGuardia)
                    }
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Matutino">Matutino (06:00 - 14:00)</option>
                    <option value="Vespertino">Vespertino (14:00 - 22:00)</option>
                    <option value="Nocturno">Nocturno (22:00 - 06:00)</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl transition font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl transition font-bold shadow-lg shadow-purple-600/20 text-sm"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
