import React, { useState } from 'react';
import { Estudiante } from '../types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Filter,
} from 'lucide-react';

interface PaymentsPanelProps {
  estudiantes: Estudiante[];
  onToggleEstadoPago: (id: string, nuevo: 'Pagado' | 'Pendiente') => void;
}

export const PaymentsPanel: React.FC<PaymentsPanelProps> = ({
  estudiantes,
  onToggleEstadoPago,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'todos' | 'Pagado' | 'Pendiente'>('todos');

  const total = estudiantes.length;
  const pagados = estudiantes.filter((e) => e.estado_pago === 'Pagado').length;
  const pendientes = estudiantes.filter((e) => e.estado_pago === 'Pendiente').length;
  const percent = total > 0 ? Math.round((pagados / total) * 100) : 0;

  const filtered = estudiantes.filter((est) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      est.nombre.toLowerCase().includes(term) ||
      est.apellidos.toLowerCase().includes(term) ||
      est.cedula.includes(term);
    if (filter === 'todos') return matchSearch;
    return matchSearch && est.estado_pago === filter;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              <span>Estado de Pensiones y Matrícula</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Control financiero en tiempo real. Los estudiantes en estado <span className="text-emerald-400 font-bold">Pagado</span> tienen acceso habilitado en los puntos QR.
            </p>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-zinc-400 font-semibold">Tasa de Pago</div>
              <div className="text-lg font-black text-white">{percent}%</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mt-5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Stats row - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold uppercase">Total Alumnos</span>
            <div className="text-2xl font-black text-white mt-0.5">{total}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-semibold uppercase">Al Día (Pagados)</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{pagados}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-red-400 font-semibold uppercase">Pendientes / Bloqueados</span>
            <div className="text-2xl font-black text-red-400 mt-0.5">{pendientes}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, apellido o cédula..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1 text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-2 rounded-xl transition font-semibold ${
              filter === 'todos' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('Pagado')}
            className={`px-3 py-2 rounded-xl transition font-semibold ${
              filter === 'Pagado'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pagados ({pagados})
          </button>
          <button
            onClick={() => setFilter('Pendiente')}
            className={`px-3 py-2 rounded-xl transition font-semibold ${
              filter === 'Pendiente'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pendientes ({pendientes})
          </button>
        </div>
      </div>

      {/* List / Table */}
      <div className="bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Estudiante</th>
                <th className="px-6 py-4 font-semibold">Cédula</th>
                <th className="px-6 py-4 font-semibold">Carrera</th>
                <th className="px-6 py-4 font-semibold text-center">Estado Actual</th>
                <th className="px-6 py-4 font-semibold text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-500">
                    No se encontraron estudiantes.
                  </td>
                </tr>
              ) : (
                filtered.map((est) => {
                  const isPagado = est.estado_pago === 'Pagado';
                  return (
                    <tr key={est.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        {est.nombre} {est.apellidos}
                      </td>
                      <td className="px-6 py-4 font-mono">{est.cedula}</td>
                      <td className="px-6 py-4 text-zinc-400">{est.curso}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            isPagado
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {isPagado ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{est.estado_pago}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            onToggleEstadoPago(est.id, isPagado ? 'Pendiente' : 'Pagado')
                          }
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
                            isPagado
                              ? 'bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border-zinc-700'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20'
                          }`}
                        >
                          {isPagado ? 'Marcar como Pendiente' : '✅ Marcar como Pagado'}
                        </button>
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
              No se encontraron estudiantes.
            </div>
          ) : (
            filtered.map((est) => {
              const isPagado = est.estado_pago === 'Pagado';
              return (
                <div key={est.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">
                        {est.nombre} {est.apellidos}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        Cédula: {est.cedula}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isPagado
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {est.estado_pago}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      onToggleEstadoPago(est.id, isPagado ? 'Pendiente' : 'Pagado')
                    }
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition border ${
                      isPagado
                        ? 'bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border-zinc-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {isPagado ? 'Marcar como Pendiente' : '✅ Marcar como Pagado'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
