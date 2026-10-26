import React, { useState, useRef } from 'react';
import { Estudiante } from '../types';
import {
  UserPlus,
  Search,
  QrCode,
  Pencil,
  Trash2,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentsPanelProps {
  estudiantes: Estudiante[];
  onAddEstudiante: (est: Omit<Estudiante, 'id'>) => Promise<void>;
  onUpdateEstudiante: (id: string, datos: Partial<Omit<Estudiante, 'id'>>) => Promise<void>;
  onDeleteEstudiante: (id: string) => void;
  onToggleEstadoPago: (id: string, nuevo: 'Pagado' | 'Pendiente') => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const StudentsPanel: React.FC<StudentsPanelProps> = ({
  estudiantes,
  onAddEstudiante,
  onUpdateEstudiante,
  onDeleteEstudiante,
  onToggleEstadoPago,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'Pagado' | 'Pendiente'>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state (Crear)
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [estadoPago, setEstadoPago] = useState<'Pagado' | 'Pendiente'>('Pagado');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cedulaAvisoExceso, setCedulaAvisoExceso] = useState(false);
  const [cedulaAvisoLetra, setCedulaAvisoLetra] = useState(false);

  // Form state (Editar)
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editCedula, setEditCedula] = useState('');
  const [editEstadoPago, setEditEstadoPago] = useState<'Pagado' | 'Pendiente'>('Pagado');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editCedulaAvisoExceso, setEditCedulaAvisoExceso] = useState(false);
  const [editCedulaAvisoLetra, setEditCedulaAvisoLetra] = useState(false);

  // QR modal state
  const [selectedQrEstudiante, setSelectedQrEstudiante] = useState<Estudiante | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Handlers for Cedula input validation, non-numeric alert and overflow warning
  const handleCedulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Enter' ||
      e.key === 'Escape'
    ) {
      setCedulaAvisoLetra(false);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (e.key.length === 1) {
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setCedulaAvisoLetra(true);
        setCedulaAvisoExceso(false);
        onShowToast('⚠️ Solo se aceptan números', 'error');
        return;
      }
      setCedulaAvisoLetra(false);
      const target = e.currentTarget;
      const hasSelection = (target.selectionEnd ?? 0) - (target.selectionStart ?? 0) > 0;
      if (cedula.length >= 10 && !hasSelection) {
        e.preventDefault();
        setCedulaAvisoExceso(true);
        onShowToast('⚠️ Está poniendo números de más de lo que contiene una cédula (máximo 10 dígitos)', 'error');
      } else {
        setCedulaAvisoExceso(false);
      }
    }
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (/[^0-9]/.test(rawVal)) {
      setCedulaAvisoLetra(true);
      onShowToast('⚠️ Solo se aceptan números', 'error');
    } else {
      setCedulaAvisoLetra(false);
    }

    const numsOnly = rawVal.replace(/\D/g, '');
    if (numsOnly.length > 10) {
      setCedulaAvisoExceso(true);
      onShowToast('⚠️ Está poniendo números de más de lo que contiene una cédula (máximo 10 dígitos)', 'error');
      setCedula(numsOnly.slice(0, 10));
    } else {
      setCedula(numsOnly);
      if (numsOnly.length < 10) {
        setCedulaAvisoExceso(false);
      }
    }
  };

  const handleCedulaPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (/[^0-9]/.test(pasted)) {
      setCedulaAvisoLetra(true);
      onShowToast('⚠️ Solo se aceptan números', 'error');
    }
    const numsOnly = pasted.replace(/\D/g, '');
    const target = e.currentTarget;
    const selectionLength = (target.selectionEnd ?? 0) - (target.selectionStart ?? 0);
    const currentLength = cedula.length - selectionLength;
    if (currentLength + numsOnly.length > 10) {
      setCedulaAvisoExceso(true);
      onShowToast('⚠️ Está poniendo números de más de lo que contiene una cédula (máximo 10 dígitos)', 'error');
    }
  };

  const handleEditCedulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Enter' ||
      e.key === 'Escape'
    ) {
      setEditCedulaAvisoLetra(false);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (e.key.length === 1) {
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setEditCedulaAvisoLetra(true);
        setEditCedulaAvisoExceso(false);
        onShowToast('⚠️ Solo se aceptan números', 'error');
        return;
      }
      setEditCedulaAvisoLetra(false);
      const target = e.currentTarget;
      const hasSelection = (target.selectionEnd ?? 0) - (target.selectionStart ?? 0) > 0;
      if (editCedula.length >= 10 && !hasSelection) {
        e.preventDefault();
        setEditCedulaAvisoExceso(true);
        onShowToast('⚠️ Está poniendo números de más de lo que contiene una cédula (máximo 10 dígitos)', 'error');
      } else {
        setEditCedulaAvisoExceso(false);
      }
    }
  };

  const handleEditCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (/[^0-9]/.test(rawVal)) {
      setEditCedulaAvisoLetra(true);
      onShowToast('⚠️ Solo se aceptan números', 'error');
    } else {
      setEditCedulaAvisoLetra(false);
    }

    const numsOnly = rawVal.replace(/\D/g, '');
    if (numsOnly.length > 10) {
      setEditCedulaAvisoExceso(true);
      onShowToast('⚠️ Está poniendo números de más de lo que contiene una cédula (máximo 10 dígitos)', 'error');
      setEditCedula(numsOnly.slice(0, 10));
    } else {
      setEditCedula(numsOnly);
      if (numsOnly.length < 10) {
        setEditCedulaAvisoExceso(false);
      }
    }
  };

  const handleEditCedulaPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (/[^0-9]/.test(pasted)) {
      setEditCedulaAvisoLetra(true);
      onShowToast('⚠️ Solo se aceptan números', 'error');
    }
    const numsOnly = pasted.replace(/\D/g, '');
    const target = e.currentTarget;
    const selectionLength = (target.selectionEnd ?? 0) - (target.selectionStart ?? 0);
    const currentLength = editCedula.length - selectionLength;
    if (currentLength + numsOnly.length > 10) {
      setEditCedulaAvisoExceso(true);
      onShowToast('⚠️ Está poniendo números de más de lo que contiene una cédula (máximo 10 dígitos)', 'error');
    }
  };

  const handleOpenEditModal = (est: Estudiante) => {
    setEditingEstudiante(est);
    setEditNombre(est.nombre);
    setEditApellidos(est.apellidos);
    setEditCedula(est.cedula);
    setEditEstadoPago(est.estado_pago);
    setEditCedulaAvisoExceso(false);
    setEditCedulaAvisoLetra(false);
  };

  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEstudiante) return;

    const cleanNombre = editNombre.trim();
    const cleanApellidos = editApellidos.trim();
    const cleanCedula = editCedula.replace(/\D/g, '').slice(0, 10);

    if (!cleanNombre || !cleanApellidos || !cleanCedula) {
      return onShowToast('Por favor completa el nombre, apellidos y cédula del estudiante', 'error');
    }

    if (cleanCedula.length !== 10) {
      return onShowToast('La cédula debe contener exactamente 10 dígitos numéricos', 'error');
    }

    // Check duplicate cédula in other students
    const duplicate = estudiantes.some(
      (item) => item.id !== editingEstudiante.id && item.cedula === cleanCedula
    );
    if (duplicate) {
      return onShowToast('Ya existe otro estudiante registrado con esa cédula', 'error');
    }

    setIsEditSubmitting(true);
    try {
      await onUpdateEstudiante(editingEstudiante.id, {
        nombre: cleanNombre,
        apellidos: cleanApellidos,
        cedula: cleanCedula,
        estado_pago: editEstadoPago,
      });
      setEditingEstudiante(null);
    } catch (err) {
      onShowToast('Error al actualizar estudiante', 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const cleanApellidos = apellidos.trim();
    const cleanCedula = cedula.replace(/\D/g, '').slice(0, 10);

    if (!cleanNombre || !cleanApellidos || !cleanCedula) {
      return onShowToast('Por favor completa el nombre, apellidos y cédula del estudiante', 'error');
    }

    if (cleanCedula.length !== 10) {
      return onShowToast('La cédula debe contener exactamente 10 dígitos numéricos', 'error');
    }

    // Check duplicate cedula
    if (estudiantes.some((e) => e.cedula === cleanCedula)) {
      return onShowToast('Ya existe un estudiante registrado con esa cédula', 'error');
    }

    setIsSubmitting(true);
    const secretUUID =
      'qr-' +
      Math.random().toString(36).substring(2, 8) +
      '-' +
      cleanCedula +
      '-' +
      Date.now().toString(36);

    try {
      await onAddEstudiante({
        nombre: cleanNombre,
        apellidos: cleanApellidos,
        cedula: cleanCedula,
        estado_pago: estadoPago,
        qr_uuid: secretUUID,
      });
      setIsAddModalOpen(false);
      setNombre('');
      setApellidos('');
      setCedula('');
      onShowToast('Estudiante registrado y credencial QR generada con éxito', 'success');
    } catch (err) {
      onShowToast('Error al registrar estudiante', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQr = () => {
    if (!selectedQrEstudiante || !qrRef.current) return;
    const svgElem = qrRef.current.querySelector('svg');
    if (!svgElem) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgElem);
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 450;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 45, 45, 360, 360);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Carnet_QR_${selectedQrEstudiante.nombre}_${selectedQrEstudiante.apellidos}.png`.replace(
          /\s+/g,
          '_'
        );
        downloadLink.href = pngUrl;
        downloadLink.click();
        URL.revokeObjectURL(url);
        onShowToast('Credencial QR descargada como PNG', 'success');
      }
    };
    img.src = url;
  };

  const filtered = estudiantes.filter((est) => {
    const term = searchTerm.toLowerCase().trim();
    const full = `${est.nombre} ${est.apellidos}`.toLowerCase();
    const matchSearch = full.includes(term) || est.cedula.includes(term);
    const matchEstado = filterEstado === 'todos' || est.estado_pago === filterEstado;

    return matchSearch && matchEstado;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212]/80 p-5 rounded-3xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <span>Estudiantes</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              {filtered.length} registrados
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Visualiza y administra los registros de la base de datos de estudiantes.
          </p>
        </div>

        <button
          onClick={() => {
            setCedulaAvisoExceso(false);
            setCedulaAvisoLetra(false);
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Estudiante</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-zinc-600"
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

        {/* Estado Filter */}
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
            onClick={() => setFilterEstado('Pagado')}
            className={`px-3 py-2 rounded-xl transition font-semibold ${
              filterEstado === 'Pagado'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cuota Al Día
          </button>
          <button
            onClick={() => setFilterEstado('Pendiente')}
            className={`px-3 py-2 rounded-xl transition font-semibold ${
              filterEstado === 'Pendiente'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            En Mora
          </button>
        </div>
      </div>

      {/* VIEW 1: DESKTOP TABLE */}
      <div className="bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Cédula</th>
                <th className="px-6 py-4 font-semibold">Estudiante</th>
                <th className="px-6 py-4 font-semibold text-center">Cuota / Membresía</th>
                <th className="px-6 py-4 font-semibold text-center">Credencial QR</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-500">
                    No se encontraron estudiantes con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((est) => {
                  const isPagado = est.estado_pago === 'Pagado';
                  return (
                    <tr
                      key={est.id}
                      className="hover:bg-zinc-800/40 transition group"
                    >
                      <td className="px-6 py-4 font-mono text-white">{est.cedula}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">
                          {est.nombre} {est.apellidos}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            onToggleEstadoPago(
                              est.id,
                              isPagado ? 'Pendiente' : 'Pagado'
                            )
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                            isPagado
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                          }`}
                          title="Clic para actualizar estado de pago"
                        >
                          {isPagado ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{est.estado_pago}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedQrEstudiante(est)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition text-xs font-bold"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Carnet QR</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(est)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10 transition"
                            title="Modificar datos del estudiante"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteEstudiante(est.id)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Eliminar Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW 2: MOBILE CARDS */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-500 text-sm">
            No hay estudiantes que coincidan con la búsqueda.
          </div>
        ) : (
          filtered.map((est) => {
            const isPagado = est.estado_pago === 'Pagado';
            return (
              <div
                key={est.id}
                className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {est.nombre} {est.apellidos}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Cédula: {est.cedula}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onToggleEstadoPago(est.id, isPagado ? 'Pendiente' : 'Pagado')
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition whitespace-nowrap flex items-center gap-1 ${
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
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 gap-2">
                  <button
                    onClick={() => setSelectedQrEstudiante(est)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition text-xs font-bold"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Ver Carnet QR</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(est)}
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10 border border-zinc-800 transition"
                    title="Modificar Datos"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteEstudiante(est.id)}
                    className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 transition"
                    title="Eliminar Estudiante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: REGISTRAR ESTUDIANTE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-lg p-6 sm:p-7 rounded-3xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setCedulaAvisoExceso(false);
                setCedulaAvisoLetra(false);
              }}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Nuevo Registro de Estudiante</span>
            </h3>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Mateo"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Ej: Castillo"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-zinc-400 text-xs font-medium">
                    Cédula / Identificación *
                  </label>
                  <span
                    className={`text-[11px] font-mono transition-colors ${
                      cedulaAvisoLetra || cedulaAvisoExceso
                        ? 'text-amber-400 font-bold'
                        : cedula.length === 10
                        ? 'text-emerald-400 font-semibold'
                        : 'text-zinc-500'
                    }`}
                  >
                    {cedula.length}/10 dígitos
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={cedula}
                  onKeyDown={handleCedulaKeyDown}
                  onChange={handleCedulaChange}
                  onPaste={handleCedulaPaste}
                  placeholder="Ej: 1105432190"
                  className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-3 text-sm font-mono text-white focus:outline-none tracking-wider transition ${
                    cedulaAvisoLetra
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : cedulaAvisoExceso
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : 'border-zinc-700/80 focus:border-emerald-500'
                  }`}
                />

                {cedulaAvisoLetra ? (
                  <div className="flex items-start gap-2.5 p-3 mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400 block text-xs">
                        Solo se aceptan números
                      </span>
                      <span className="text-zinc-300 text-[11px] leading-tight block mt-0.5">
                        El número de cédula solo debe contener dígitos numéricos (0-9). No se permiten letras ni símbolos.
                      </span>
                    </div>
                  </div>
                ) : cedulaAvisoExceso ? (
                  <div className="flex items-start gap-2.5 p-3 mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-shake">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400 block">
                        ¡Límite de dígitos alcanzado!
                      </span>
                      <span className="text-zinc-300 text-[11px] leading-tight block mt-0.5">
                        Está poniendo números de más de lo que contiene una cédula. La cédula ecuatoriana contiene exactamente 10 dígitos.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Solo números (exactamente 10 dígitos)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Estado de Cuota Mensual
                </label>
                <select
                  value={estadoPago}
                  onChange={(e) =>
                    setEstadoPago(e.target.value as 'Pagado' | 'Pendiente')
                  }
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Pagado">✅ Cuota Al Día (Ingreso Habilitado)</option>
                  <option value="Pendiente">❌ En Mora (Acceso Bloqueado)</option>
                </select>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl transition font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl transition font-bold shadow-lg shadow-emerald-500/20 text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Generar Credencial y Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DATOS DEL ESTUDIANTE */}
      {editingEstudiante && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-lg p-6 sm:p-7 rounded-3xl shadow-2xl relative">
            <button
              onClick={() => {
                setEditingEstudiante(null);
                setEditCedulaAvisoExceso(false);
                setEditCedulaAvisoLetra(false);
              }}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                <Pencil className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Modificar Estudiante
                </h3>
                <p className="text-xs text-zinc-400">
                  Edita los datos personales, cédula o estado de cuota
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    placeholder="Ej: Juan Carlos"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={editApellidos}
                    onChange={(e) => setEditApellidos(e.target.value)}
                    placeholder="Ej: Castillo"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-zinc-400 text-xs font-medium">
                    Cédula / Identificación *
                  </label>
                  <span
                    className={`text-[11px] font-mono transition-colors ${
                      editCedulaAvisoLetra || editCedulaAvisoExceso
                        ? 'text-amber-400 font-bold'
                        : editCedula.length === 10
                        ? 'text-amber-400 font-semibold'
                        : 'text-zinc-500'
                    }`}
                  >
                    {editCedula.length}/10 dígitos
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={editCedula}
                  onKeyDown={handleEditCedulaKeyDown}
                  onChange={handleEditCedulaChange}
                  onPaste={handleEditCedulaPaste}
                  placeholder="Ej: 1105432190"
                  className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-3 text-sm font-mono text-white focus:outline-none tracking-wider transition ${
                    editCedulaAvisoLetra
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : editCedulaAvisoExceso
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : 'border-zinc-700/80 focus:border-amber-500'
                  }`}
                />

                {editCedulaAvisoLetra ? (
                  <div className="flex items-start gap-2.5 p-3 mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400 block text-xs">
                        Solo se aceptan números
                      </span>
                      <span className="text-zinc-300 text-[11px] leading-tight block mt-0.5">
                        El número de cédula solo debe contener dígitos numéricos (0-9). No se permiten letras ni símbolos.
                      </span>
                    </div>
                  </div>
                ) : editCedulaAvisoExceso ? (
                  <div className="flex items-start gap-2.5 p-3 mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-shake">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400 block">
                        ¡Límite de dígitos alcanzado!
                      </span>
                      <span className="text-zinc-300 text-[11px] leading-tight block mt-0.5">
                        Está poniendo números de más de lo que contiene una cédula. La cédula ecuatoriana contiene exactamente 10 dígitos.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Solo números (exactamente 10 dígitos)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Estado de Cuota Mensual
                </label>
                <select
                  value={editEstadoPago}
                  onChange={(e) =>
                    setEditEstadoPago(e.target.value as 'Pagado' | 'Pendiente')
                  }
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Pagado">✅ Cuota Al Día (Ingreso Habilitado)</option>
                  <option value="Pendiente">❌ En Mora (Acceso Bloqueado)</option>
                </select>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEstudiante(null)}
                  className="w-full sm:flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl transition font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 py-3 rounded-xl transition font-bold shadow-lg shadow-amber-500/20 text-sm disabled:opacity-50"
                >
                  {isEditSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARNET Y CREDENCIAL QR */}
      {selectedQrEstudiante && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm p-6 sm:p-7 rounded-3xl shadow-2xl text-center relative">
            <button
              onClick={() => setSelectedQrEstudiante(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Carnet Header */}
            <div className="mb-3 bg-gradient-to-r from-emerald-600 to-teal-700 p-3 rounded-2xl text-zinc-950 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">
                CONTROL DE ACCESO • CARNET OFICIAL
              </span>
              <h3 className="text-base font-black text-white truncate">
                {selectedQrEstudiante.nombre} {selectedQrEstudiante.apellidos}
              </h3>
              <div className="text-xs text-emerald-100 font-mono mt-0.5">
                <span>Cédula: {selectedQrEstudiante.cedula}</span>
              </div>
            </div>

            {/* QR display box */}
            <div
              ref={qrRef}
              className="bg-white p-4 rounded-2xl inline-block my-2 shadow-2xl border-4 border-emerald-500/30"
            >
              <QRCodeSVG
                value={selectedQrEstudiante.qr_uuid}
                size={190}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="text-left bg-zinc-900/90 rounded-2xl p-3 my-3 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Estado de Cuota:</span>
                <span
                  className={`font-bold ${
                    selectedQrEstudiante.estado_pago === 'Pagado'
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {selectedQrEstudiante.estado_pago}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadQr}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-2xl transition font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Credencial PNG</span>
              </button>

              <button
                onClick={() => setSelectedQrEstudiante(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-2xl transition font-medium text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
