import React, { useState, useMemo } from 'react';
import { AccesoLog } from '../types';
import {
  PieChart as PieChartIcon,
  CheckCircle2,
  XCircle,
  Search,
  History,
  QrCode,
  CreditCard,
  Download,
  Activity,
  BarChart3,
  ShieldAlert,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface ReportsPanelProps {
  logs: AccesoLog[];
  onClearLogs?: () => void;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'Permitido' | 'Denegado'>('todos');
  const [filterMetodo, setFilterMetodo] = useState<'todos' | 'QR' | 'Cédula'>('todos');
  const [activeTab, setActiveTab] = useState<'tablero' | 'historial'>('tablero');

  const total = logs.length;
  const permitidos = logs.filter((l) => l.estado_ingreso === 'Permitido').length;
  const denegados = logs.filter((l) => l.estado_ingreso === 'Denegado').length;
  const porQr = logs.filter((l) => l.metodo === 'QR').length;
  const porCedula = logs.filter((l) => l.metodo === 'Cédula').length;

  const tasaPermitido = total > 0 ? Math.round((permitidos / total) * 100) : 0;

  // Filtered logs list
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        l.nombre_estudiante.toLowerCase().includes(term) ||
        l.cedula.includes(term) ||
        (l.disciplina && l.disciplina.toLowerCase().includes(term)) ||
        l.guardia_responsable.toLowerCase().includes(term);

      const matchEstado =
        filterEstado === 'todos' ? true : l.estado_ingreso === filterEstado;
      const matchMetodo =
        filterMetodo === 'todos' ? true : l.metodo === filterMetodo;

      return matchSearch && matchEstado && matchMetodo;
    });
  }, [logs, searchTerm, filterEstado, filterMetodo]);

  // Data for Hourly Distribution Chart (Horas Pico)
  const hourlyData = useMemo(() => {
    const hoursMap: { [hour: string]: { permitidos: number; denegados: number } } = {};
    for (let h = 6; h <= 22; h++) {
      const key = `${h.toString().padStart(2, '0')}:00`;
      hoursMap[key] = { permitidos: 0, denegados: 0 };
    }

    logs.forEach((log) => {
      const timeMatch = log.fecha_hora.match(/(\d{2}):\d{2}/);
      if (timeMatch) {
        const hourStr = `${timeMatch[1]}:00`;
        if (!hoursMap[hourStr]) {
          hoursMap[hourStr] = { permitidos: 0, denegados: 0 };
        }
        if (log.estado_ingreso === 'Permitido') {
          hoursMap[hourStr].permitidos += 1;
        } else {
          hoursMap[hourStr].denegados += 1;
        }
      }
    });

    return Object.keys(hoursMap).map((h) => ({
      hora: h,
      Permitidos: hoursMap[h].permitidos,
      Denegados: hoursMap[h].denegados,
      Total: hoursMap[h].permitidos + hoursMap[h].denegados,
    }));
  }, [logs]);

  // Data for Disciplines Chart
  const disciplineData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    logs.forEach((log) => {
      const disc = log.disciplina || 'General / Socios';
      counts[disc] = (counts[disc] || 0) + 1;
    });

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

    return Object.keys(counts).map((key, i) => ({
      name: key,
      value: counts[key],
      color: COLORS[i % COLORS.length],
    }));
  }, [logs]);

  // Export CSV function
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID,Fecha y Hora,Atleta / Socio,Cédula,Disciplina,Método,Estado Ingreso,Motivo,Operador Guard'];
    const rows = logs.map((l) =>
      [
        l.id,
        `"${l.fecha_hora}"`,
        `"${l.nombre_estudiante}"`,
        `"${l.cedula}"`,
        `"${l.disciplina || 'N/A'}"`,
        `"${l.metodo}"`,
        `"${l.estado_ingreso}"`,
        `"${l.motivo || ''}"`,
        `"${l.guardia_responsable}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_complejo_deportivo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Header Banner */}
      <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChartIcon className="w-6 h-6 text-emerald-400" />
            <span>Aforo & Auditoría de Accesos</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Panel estadístico e historial de torniquetes QR para tesis de grado. Monitoreo de aforo, horas pico y control de solvencia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV Auditoría</span>
          </button>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('tablero')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'tablero'
              ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analíticas & Horas Pico</span>
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'historial'
              ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial Detallado ({logs.length})</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
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
            {total > 0 ? 100 - tasaPermitido : 0}% retenidos
          </div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Vía Torniquete QR</span>
            <QrCode className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{porQr}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Carnet digital escaneado</div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Vía Manual Cédula</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{porCedula}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Búsqueda rápida en garita</div>
        </div>
      </div>

      {activeTab === 'tablero' ? (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Access Distribution Chart (2 Cols) */}
            <div className="lg:col-span-2 bg-[#121212] border border-zinc-800/80 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Flujo de Aforo e Ingresos por Hora (Horas Pico)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Distribución horaria de entradas permitidas vs denegadas en el complejo.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="hora" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="Permitidos" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="Denegados" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Disciplines Pie Breakdown */}
            <div className="bg-[#121212] border border-zinc-800/80 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  <span>Aforo por Disciplina Deportiva</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Proporción de asistencia según disciplina.
                </p>
              </div>

              <div className="h-44 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={disciplineData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={40}
                      paddingAngle={4}
                    >
                      {disciplineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 text-xs">
                {disciplineData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </span>
                    <span className="font-bold text-white">{d.value} accesos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Historial Table section (visible when on 'historial' or bottom section of dashboard) */}
      {(activeTab === 'historial' || activeTab === 'tablero') && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por deportista, cédula, disciplina u operador..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-zinc-600"
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
                    <th className="px-6 py-4 font-semibold">Atleta / Socio</th>
                    <th className="px-6 py-4 font-semibold">Cédula</th>
                    <th className="px-6 py-4 font-semibold">Disciplina</th>
                    <th className="px-6 py-4 font-semibold">Operador Guard</th>
                    <th className="px-6 py-4 font-semibold text-center">Método</th>
                    <th className="px-6 py-4 font-semibold text-center">Estado Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-zinc-500">
                        No se encontraron registros en el historial de auditoría.
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
                                🚫 {log.motivo}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-zinc-300">
                            {log.cedula}
                          </td>
                          <td className="px-6 py-4 text-emerald-400 text-xs font-semibold">
                            {log.disciplina || 'General'}
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
                          {log.disciplina && (
                            <div className="text-xs text-emerald-400 font-semibold">
                              {log.disciplina}
                            </div>
                          )}
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
                          🚫 {log.motivo}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                        <span>Operador: {log.guardia_responsable}</span>
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
      )}
    </div>
  );
};
