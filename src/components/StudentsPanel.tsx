import React, { useState, useRef } from 'react';
import { Estudiante } from '../types';
import {
  UserPlus,
  Search,
  QrCode,
  Trash2,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
  CreditCard,
  Printer,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentsPanelProps {
  estudiantes: Estudiante[];
  onAddEstudiante: (est: Omit<Estudiante, 'id'>) => Promise<void>;
  onDeleteEstudiante: (id: string) => void;
  onToggleEstadoPago: (id: string, nuevo: 'Pagado' | 'Pendiente') => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const StudentsPanel: React.FC<StudentsPanelProps> = ({
  estudiantes,
  onAddEstudiante,
  onDeleteEstudiante,
  onToggleEstadoPago,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'Pagado' | 'Pendiente'>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [curso, setCurso] = useState('Ingeniería / Carrera General');
  const [estadoPago, setEstadoPago] = useState<'Pagado' | 'Pendiente'>('Pagado');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR modal state
  const [selectedQrEstudiante, setSelectedQrEstudiante] = useState<Estudiante | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const cleanApellidos = apellidos.trim();
    const cleanCedula = cedula.trim();

    if (!cleanNombre || !cleanApellidos || !cleanCedula) {
      return onShowToast('Por favor completa todos los campos del alumno', 'error');
    }

    if (cleanCedula.length < 6) {
      return onShowToast('El número de cédula debe tener al menos 6 dígitos', 'error');
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
        curso: curso.trim() || 'Carrera General',
        estado_pago: estadoPago,
        qr_uuid: secretUUID,
      });
      setIsAddModalOpen(false);
      setNombre('');
      setApellidos('');
      setCedula('');
      setCurso('Ingeniería / Carrera General');
      onShowToast('Estudiante agregado y código QR generado con éxito', 'success');
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
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw SVG centered
        ctx.drawImage(img, 40, 40, 320, 320);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_Acceso_${selectedQrEstudiante.nombre}_${selectedQrEstudiante.apellidos}.png`.replace(
          /\s+/g,
          '_'
        );
        downloadLink.href = pngUrl;
        downloadLink.click();
        URL.revokeObjectURL(url);
        onShowToast('Código QR descargado como PNG', 'success');
      }
    };
    img.src = url;
  };

  const handlePrintBadge = () => {
    if (!selectedQrEstudiante) return;
    window.print();
  };

  const filtered = estudiantes.filter((est) => {
    const term = searchTerm.toLowerCase().trim();
    const full = `${est.nombre} ${est.apellidos}`.toLowerCase();
    const matchSearch =
      full.includes(term) || est.cedula.includes(term) || (est.curso || '').toLowerCase().includes(term);
    if (filterEstado === 'todos') return matchSearch;
    return matchSearch && est.estado_pago === filterEstado;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top action bar - Responsive stacking */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212]/80 p-5 rounded-3xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100">Base de Estudiantes</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono">
              {filtered.length} alumnos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Administra los registros, genera sus accesos QR y verifica el estado de sus pensiones.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Estudiante</span>
        </button>
      </div>

      {/* Search & Filter bar - Responsive */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, apellidos, cédula o carrera..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition placeholder:text-zinc-600"
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

        <div className="flex items-center gap-2">
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
              Pagados
            </button>
            <button
              onClick={() => setFilterEstado('Pendiente')}
              className={`px-3 py-2 rounded-xl transition font-semibold ${
                filterEstado === 'Pendiente'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pendientes
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: DESKTOP TABLE (Hidden on small mobile screens, visible on md+) */}
      <div className="hidden md:block bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Cédula</th>
                <th className="px-6 py-4 font-semibold">Estudiante</th>
                <th className="px-6 py-4 font-semibold">Curso / Carrera</th>
                <th className="px-6 py-4 font-semibold text-center">Estado de Pago</th>
                <th className="px-6 py-4 font-semibold text-center">Código QR</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-500">
                    No se encontraron estudiantes que coincidan con la búsqueda.
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
                        <div className="text-[11px] text-zinc-500">
                          Reg: {est.fecha_registro}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{est.curso}</td>
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
                          title="Clic para cambiar estado de pago"
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
                          <span>Ver QR</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => onDeleteEstudiante(est.id)}
                          className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Eliminar Alumno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW 2: MOBILE RESPONSIVE CARDS (Visible on < md screens) - Perfect for Cellphones! */}
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
                    <p className="text-xs text-zinc-500 mt-1">{est.curso}</p>
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

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <button
                    onClick={() => setSelectedQrEstudiante(est)}
                    className="flex-1 mr-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition text-xs font-bold"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Ver y Descargar QR</span>
                  </button>

                  <button
                    onClick={() => onDeleteEstudiante(est.id)}
                    className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Eliminar Alumno"
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
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-md p-6 sm:p-7 rounded-3xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Registrar Alumno</span>
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
                    placeholder="Ej: Carlos"
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
                    placeholder="Ej: Pucha"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Cédula / Identificación *
                </label>
                <input
                  type="text"
                  required
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej: 1105432190"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Curso / Carrera
                </label>
                <input
                  type="text"
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Ej: Ingeniería en Sistemas - 6to"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Estado de Pago de Pensiones
                </label>
                <select
                  value={estadoPago}
                  onChange={(e) =>
                    setEstadoPago(e.target.value as 'Pagado' | 'Pendiente')
                  }
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Pagado">✅ Pagado (Acceso Libre al Campus)</option>
                  <option value="Pendiente">❌ Pendiente (Acceso Bloqueado)</option>
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
                  {isSubmitting ? 'Guardando...' : 'Generar QR y Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER Y DESCARGAR QR DE ALUMNO */}
      {selectedQrEstudiante && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm p-6 sm:p-7 rounded-3xl shadow-2xl text-center relative">
            <button
              onClick={() => setSelectedQrEstudiante(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Credencial Digital QR
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {selectedQrEstudiante.nombre} {selectedQrEstudiante.apellidos}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Cédula: {selectedQrEstudiante.cedula}
              </p>
            </div>

            {/* QR display box */}
            <div
              ref={qrRef}
              className="bg-white p-5 rounded-3xl inline-block my-4 shadow-2xl border-4 border-emerald-500/20"
            >
              <QRCodeSVG
                value={selectedQrEstudiante.qr_uuid}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="text-left bg-zinc-900/80 rounded-2xl p-3 mb-5 border border-zinc-800/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Estatus:</span>
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
              <div className="flex justify-between">
                <span className="text-zinc-500">Curso:</span>
                <span className="text-zinc-300 truncate max-w-[180px]">
                  {selectedQrEstudiante.curso}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleDownloadQr}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white py-3.5 rounded-2xl transition font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Código QR (PNG)</span>
              </button>

              <button
                onClick={() => setSelectedQrEstudiante(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-2xl transition font-medium text-sm"
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
