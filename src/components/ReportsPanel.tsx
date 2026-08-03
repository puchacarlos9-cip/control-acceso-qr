import React, { useState } from 'react';
import { AccesoLog } from '../types';
import {
  PieChart,
  CheckCircle2,
  XCircle,
  Search,
  History,
  QrCode,
  CreditCard,
  TrendingUp,
  ShieldAlert,
  Calendar,
  Filter,
} from 'lucide-react';

interface ReportsPanelProps {
  logs: AccesoLog[];
  onClearLogs?: () => void;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'Permitido' | 'Denegado'>('todos');
  const [filterMetodo, setFilterMetodo] = useState<'todos' | 'QR' | 'Cédula'>('todos');

  const total = logs.length;
  const permitidos = logs.filter((l) => l.estado_ingreso === 'Permitido').length;
  const denegados = logs.filter((l) => l.estado_ingreso === 'Denegado').length;
  const porQr = logs.filter((l) => l.metodo === 'QR').length;
  const porCedula = logs.filter((l) => l.metodo === 'Cédula').length;

  const tasaPermitido = total > 0 ? Math.round((permitidos / total) * 100) : 0;

  const filtered = logs.filter((l) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      l.nombre_estudiante.toLowerCase().includes(term) ||
      l.cedula.includes(term) ||
      l.guardia_responsable.toLowerCase().includes(term);

    const matchEstado =
      filterEstado === 'todos' ? true : l.estado_ingreso === filterEstado;
    const matchMetodo =
      filterMetodo === 'todos' ? true : l.metodo === filterMetodo;

    return matchSearch && matchEstado && matchMetodo;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Header Banner */}
      <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-400" />
            <span>Dashboard de Reportes y Accesos</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Auditoría en tiempo real de todos los ingresos por punto de control, guardia responsable y método de verificación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl">
            <span className="text-xs text-zinc-400">Total Ingresos</span>
            <div className="text-lg font-black text-white">{total}</div>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Permitidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{permitidos}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{tasaPermitido}% del total</div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Denegados</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{denegados}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {total > 0 ? 100 - tasaPermitido : 0}% bloqueados
          </div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Vía QR</span>
            <QrCode className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{porQr}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Escaneados por cámara</div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Vía Cédula</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{porCedula}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Ingresados por teclado</div>
        </div>
      </div>

      {/* Search & Filter Bar - Responsive stacking */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por alumno, cédula o nombre del guardia..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-zinc-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Estado filter */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setFilterEstado('todos')}
              className={`px-3 py-2 rounded-xl transition font-semibold ${
                filterEstado === 'todos'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterEstado('Permitido')}
              className={`px-3 py-2 rounded-xl transition font-semibold ${
                filterEstado === 'Permitido'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Permitidos
            </button>
            <button
              onClick={() => setFilterEstado('Denegado')}
              className={`px-3 py-2 rounded-xl transition font-semibold ${
                filterEstado === 'Denegado'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Denegados
            </button>
          </div>

          {/* Method filter */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setFilterMetodo('todos')}
              className={`px-3 py-2 rounded-xl transition font-semibold ${
                filterMetodo === 'todos'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cualquiera
            </button>
            <button
              onClick={() => setFilterMetodo('QR')}
              className={`px-3 py-2 rounded-xl transition font-semibold ${
                filterMetodo === 'QR'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              QR
            </button>
            <button
              onClick={() => setFilterMetodo('Cédula')}
              className={`px-3 py-2 rounded-xl transition font-semibold ${
                filterMetodo === 'Cédula'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cédula
            </button>
          </div>
        </div>
      </div>

      {/* Access Logs List / Table */}
      <div className="bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold">Estudiante</th>
                <th className="px-6 py-4 font-semibold">Cédula</th>
                <th className="px-6 py-4 font-semibold">Guardia Responsable</th>
                <th className="px-6 py-4 font-semibold text-center">Método</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-500">
                    No se encontraron registros en el historial.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const isPermitido = log.estado_ingreso === 'Permitido';
                  return (
                    <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-6 py-4 text-xs font-mono text-zinc-400 whitespace-nowrap">
                        {log.fecha_hora}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {log.nombre_estudiante}
                        {log.motivo && (
                          <div className="text-[11px] text-red-400 font-normal mt-0.5">
                            ⚠️ {log.motivo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-300">
                        {log.cedula}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {log.guardia_responsable}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-mono">
                          {log.metodo === 'QR' ? (
                            <QrCode className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          <span>{log.metodo}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            isPermitido
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {isPermitido ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{log.estado_ingreso}</span>
                        </span>
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
              No se encontraron registros de acceso.
            </div>
          ) : (
            filtered.map((log) => {
              const isPermitido = log.estado_ingreso === 'Permitido';
              return (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-white text-base">
                        {log.nombre_estudiante}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        Cédula: {log.cedula}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isPermitido
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {log.estado_ingreso}
                    </span>
                  </div>

                  {log.motivo && (
                    <div className="text-xs text-red-400 bg-red-950/20 p-2 rounded-xl border border-red-800/40">
                      ⚠️ {log.motivo}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                    <span>Guardia: {log.guardia_responsable}</span>
                    <span className="font-mono">{log.metodo}</span>
                  </div>
                  <div className="text-[11px] text-zinc-600 font-mono">
                    {log.fecha_hora}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
