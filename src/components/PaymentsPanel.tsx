import React, { useState, useEffect } from 'react';
import { Estudiante, Pago } from '../types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Plus,
  History,
  Clock,
  Receipt,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface PaymentsPanelProps {
  estudiantes: Estudiante[];
  pagos: Pago[];
  userNombre?: string;
  onRegistrarPago: (nuevoPago: Omit<Pago, 'id'>) => Promise<void>;
  onToggleEstadoPago: (id: string, nuevo: 'Pagado' | 'Pendiente') => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const PaymentsPanel: React.FC<PaymentsPanelProps> = ({
  estudiantes,
  pagos,
  userNombre = 'Administrador',
  onRegistrarPago,
  onToggleEstadoPago,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'estudiantes' | 'historial'>('estudiantes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'todos' | 'Pagado' | 'Pendiente'>('todos');

  // Modal State for Registering Payment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [mesPagado, setMesPagado] = useState('');
  const [monto, setMonto] = useState('25.00');
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'>('Efectivo');
  const [fechaPago, setFechaPago] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: Format current date YYYY-MM-DD
  const getTodayStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: Compute 1 month after given YYYY-MM-DD string
  const computeExpirationDate = (pagoDateStr: string) => {
    if (!pagoDateStr) return '';
    const date = new Date(pagoDateStr + 'T00:00:00');
    date.setMonth(date.getMonth() + 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Default month name (e.g. "Agosto 2026")
  const getCurrentMonthName = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Open modal pre-selected with student
  const openPaymentModalForStudent = (studentId?: string) => {
    const today = getTodayStr();
    const defaultExp = computeExpirationDate(today);

    setFechaPago(today);
    setFechaVencimiento(defaultExp);
    setMesPagado(getCurrentMonthName());
    setMonto('25.00');
    setMetodoPago('Efectivo');
    setComprobante('');

    if (studentId) {
      setSelectedStudentId(studentId);
    } else if (estudiantes.length > 0) {
      setSelectedStudentId(estudiantes[0].id);
    }

    setIsModalOpen(true);
  };

  // Automatically update expiration date when payment date changes
  const handleFechaPagoChange = (newDateStr: string) => {
    setFechaPago(newDateStr);
    const autoExp = computeExpirationDate(newDateStr);
    setFechaVencimiento(autoExp);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = estudiantes.find((s) => s.id === selectedStudentId);
    if (!student) {
      return onShowToast('Selecciona un estudiante válido', 'error');
    }

    if (!fechaPago || !fechaVencimiento) {
      return onShowToast('Por favor completa las fechas de pago y vencimiento', 'error');
    }

    setIsSubmitting(true);
    try {
      await onRegistrarPago({
        estudiante_id: student.id,
        estudiante_nombre: `${student.nombre} ${student.apellidos}`,
        cedula: student.cedula,
        mes_pagado: mesPagado || getCurrentMonthName(),
        monto: parseFloat(monto) || 25,
        metodo_pago: metodoPago,
        fecha_pago: fechaPago,
        fecha_vencimiento: fechaVencimiento,
        registrado_por: userNombre,
        comprobante: comprobante.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      });

      onShowToast(
        `✅ Pago registrado para ${student.nombre}. Acceso QR activado hasta ${fechaVencimiento}`,
        'success'
      );
      setIsModalOpen(false);
    } catch (error) {
      onShowToast('Error al registrar pago en Firebase', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const totalEstudiantes = estudiantes.length;
  const pagados = estudiantes.filter((e) => e.estado_pago === 'Pagado').length;
  const pendientes = estudiantes.filter((e) => e.estado_pago === 'Pendiente').length;
  const percent = totalEstudiantes > 0 ? Math.round((pagados / totalEstudiantes) * 100) : 0;

  const totalRecaudado = pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

  const filteredEstudiantes = estudiantes.filter((est) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      est.nombre.toLowerCase().includes(term) ||
      est.apellidos.toLowerCase().includes(term) ||
      est.cedula.includes(term);
    if (filter === 'todos') return matchSearch;
    return matchSearch && est.estado_pago === filter;
  });

  const filteredPagos = pagos.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      p.estudiante_nombre.toLowerCase().includes(term) ||
      p.cedula.includes(term) ||
      p.mes_pagado.toLowerCase().includes(term) ||
      (p.comprobante && p.comprobante.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-[#121212]/90 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Control Automatizado de Pensiones Firebase</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              <span>Estado de Pensiones y Pagos</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Los pagos registrados programan automáticamente la fecha de emisión y la fecha de vencimiento (1 mes). Al llegar la fecha de vencimiento, el sistema cambia automáticamente el estado a <span className="text-red-400 font-bold">En Mora</span>.
            </p>
          </div>

          <button
            onClick={() => openPaymentModalForStudent()}
            className="w-full lg:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-zinc-950 font-extrabold px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition shadow-lg shadow-emerald-500/20 text-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Nuevo Pago</span>
          </button>
        </div>

        {/* Solvencia Progress Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/60">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Porcentaje de Solvencia Estudiantil</span>
            </span>
            <span className="text-emerald-400 text-sm font-black">{percent}% Al Día</span>
          </div>
          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold uppercase">Total Estudiantes</span>
            <div className="text-2xl font-black text-white mt-0.5">{totalEstudiantes}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-semibold uppercase">Al Día (QR Habilitado)</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{pagados}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-red-400 font-semibold uppercase">En Mora (Bloqueados)</span>
            <div className="text-2xl font-black text-red-400 mt-0.5">{pendientes}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121212]/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-400 font-semibold uppercase">Total Recaudado</span>
            <div className="text-2xl font-black text-amber-400 mt-0.5">${totalRecaudado.toFixed(2)}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Sub-Tabs Switch */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
          <button
            onClick={() => setActiveSubTab('estudiantes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'estudiantes'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Estado por Estudiante ({totalEstudiantes})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('historial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'historial'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Pagos Firebase ({pagos.length})</span>
          </button>
        </div>

        {/* Filter Pill buttons for Estudiantes Tab */}
        {activeSubTab === 'estudiantes' && (
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setFilter('todos')}
              className={`px-3 py-1.5 rounded-xl transition font-semibold ${
                filter === 'todos' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('Pagado')}
              className={`px-3 py-1.5 rounded-xl transition font-semibold ${
                filter === 'Pagado'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Al Día ({pagados})
            </button>
            <button
              onClick={() => setFilter('Pendiente')}
              className={`px-3 py-1.5 rounded-xl transition font-semibold ${
                filter === 'Pendiente'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              En Mora ({pendientes})
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            activeSubTab === 'estudiantes'
              ? 'Buscar estudiante por nombre, cédula o disciplina...'
              : 'Buscar en historial por estudiante, cédula, mes o nro de recibo...'
          }
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-zinc-600"
        />
      </div>

      {/* TAB 1: ESTUDIANTES PENSIONES TABLE */}
      {activeSubTab === 'estudiantes' && (
        <div className="bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
          {/* DESKTOP TABLE */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Estudiante</th>
                  <th className="px-6 py-4 font-semibold">Cédula</th>
                  <th className="px-6 py-4 font-semibold">Último Pago</th>
                  <th className="px-6 py-4 font-semibold">Vencimiento Automático</th>
                  <th className="px-6 py-4 font-semibold text-center">Estado Pensión</th>
                  <th className="px-6 py-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredEstudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500">
                      No se encontraron estudiantes registrados.
                    </td>
                  </tr>
                ) : (
                  filteredEstudiantes.map((est) => {
                    const isPagado = est.estado_pago === 'Pagado';
                    const expDate = est.fecha_vencimiento_pago || 'No registrada';
                    const lastPay = est.fecha_ultimo_pago || 'Sin registros';

                    return (
                      <tr key={est.id} className="hover:bg-zinc-800/40 transition">
                        <td className="px-6 py-4 font-bold text-white">
                          <div>
                            <span>{est.nombre} {est.apellidos}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-400">{est.cedula}</td>
                        <td className="px-6 py-4 text-xs font-mono text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{lastPay}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                              isPagado
                                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                                : 'bg-red-950/30 border-red-800/40 text-red-300'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{expDate}</span>
                          </div>
                        </td>
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
                            <span>{isPagado ? 'Al Día' : 'En Mora'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openPaymentModalForStudent(est.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 ml-auto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Registrar Pago</span>
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
            {filteredEstudiantes.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No se encontraron estudiantes.
              </div>
            ) : (
              filteredEstudiantes.map((est) => {
                const isPagado = est.estado_pago === 'Pagado';
                return (
                  <div key={est.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-white text-base">
                          {est.nombre} {est.apellidos}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">
                          Cédula: {est.cedula}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          isPagado
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {isPagado ? 'Al Día' : 'En Mora'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/60 font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Último Pago</span>
                        <span className="text-zinc-300">{est.fecha_ultimo_pago || 'S/R'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Vencimiento</span>
                        <span className={isPagado ? 'text-emerald-400' : 'text-red-400'}>
                          {est.fecha_vencimiento_pago || 'S/R'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openPaymentModalForStudent(est.id)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Registrar Pago de Mes</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE PAGOS FIREBASE */}
      {activeSubTab === 'historial' && (
        <div className="bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Comprobante</th>
                  <th className="px-6 py-4 font-semibold">Estudiante</th>
                  <th className="px-6 py-4 font-semibold">Cédula</th>
                  <th className="px-6 py-4 font-semibold">Mes Pagado</th>
                  <th className="px-6 py-4 font-semibold">Fecha Pago</th>
                  <th className="px-6 py-4 font-semibold">Fecha Vencimiento</th>
                  <th className="px-6 py-4 font-semibold">Método</th>
                  <th className="px-6 py-4 font-semibold text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredPagos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-zinc-500">
                      No hay registros de pagos guardados en Firebase todavía.
                    </td>
                  </tr>
                ) : (
                  filteredPagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-6 py-4 font-mono text-emerald-400 font-bold text-xs">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{pago.comprobante || 'REC-001'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{pago.estudiante_nombre}</td>
                      <td className="px-6 py-4 font-mono text-zinc-400">{pago.cedula}</td>
                      <td className="px-6 py-4 font-medium text-white">{pago.mes_pagado}</td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-300">{pago.fecha_pago}</td>
                      <td className="px-6 py-4 font-mono text-xs text-amber-400 font-bold">
                        {pago.fecha_vencimiento}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700/60">
                          {pago.metodo_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-400 text-base">
                        ${pago.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO (Programado automáticamente +1 mes) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-[#18181b] border border-zinc-800 w-full max-w-lg p-6 sm:p-8 rounded-3xl shadow-2xl transform transition-transform overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Registrar Pago de Mensualidad</h3>
                  <p className="text-xs text-zinc-400">Guarda el pago en Firebase y activa el acceso QR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-2 rounded-xl transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              {/* Estudiante Selection */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1 ml-1 font-semibold">
                  Estudiante a Registrar
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  {estudiantes.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} {e.apellidos} — C.I: {e.cedula} ({e.estado_pago === 'Pagado' ? 'Al Día' : 'En Mora'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mes Pagado */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1 ml-1 font-semibold">
                  Mes / Periodo de Pensión
                </label>
                <input
                  type="text"
                  value={mesPagado}
                  onChange={(e) => setMesPagado(e.target.value)}
                  placeholder="Ej: Agosto 2026"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  required
                />
              </div>

              {/* Automatic Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <label className="block text-xs text-emerald-400 mb-1 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fecha de Pago (Emisión)</span>
                  </label>
                  <input
                    type="date"
                    value={fechaPago}
                    onChange={(e) => handleFechaPagoChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-amber-400 mb-1 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Vencimiento (Automático +1 Mes)</span>
                  </label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-amber-300 focus:outline-none focus:border-amber-500 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 px-1 italic">
                * Al llegar el día <strong className="text-amber-400">{fechaVencimiento || 'de vencimiento'}</strong>, el sistema cambiará automáticamente el estado del alumno de <span className="text-emerald-400">Pagado</span> a <span className="text-red-400">En Mora</span>.
              </p>

              {/* Monto & Método */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 ml-1 font-semibold">
                    Monto ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1 ml-1 font-semibold">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta de Débito/Crédito</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Comprobante Opcional */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1 ml-1 font-semibold">
                  Nro. Comprobante / Recibo (Opcional)
                </label>
                <input
                  type="text"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Ej: REC-2026-089 o TRF-0012938"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="mt-6 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl transition font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 hover:brightness-110 font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Pago Firebase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
