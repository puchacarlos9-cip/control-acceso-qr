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
  Trophy,
  Activity,
  Phone,
  ShieldCheck,
  UserCheck,
  Printer,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentsPanelProps {
  estudiantes: Estudiante[];
  onAddEstudiante: (est: Omit<Estudiante, 'id'>) => Promise<void>;
  onDeleteEstudiante: (id: string) => void;
  onToggleEstadoPago: (id: string, nuevo: 'Pagado' | 'Pendiente') => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const DISCIPLINAS = [
  'Natación',
  'Fútbol',
  'Baloncesto',
  'Atletismo',
  'Tenis de Campo',
  'Gimnasia Olímpica',
  'Voleibol',
  'Taekwondo',
  'Acondicionamiento Físico',
];

const CATEGORIAS = ['Infantil (Sub-12)', 'Juvenil (Sub-18)', 'Selección Mayor', 'Máster', 'Libre / Socio General'];

export const StudentsPanel: React.FC<StudentsPanelProps> = ({
  estudiantes,
  onAddEstudiante,
  onDeleteEstudiante,
  onToggleEstadoPago,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'Pagado' | 'Pendiente'>('todos');
  const [filterDisciplina, setFilterDisciplina] = useState<string>('todas');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [disciplina, setDisciplina] = useState('Natación');
  const [categoria, setCategoria] = useState('Selección Mayor');
  const [entrenador, setEntrenador] = useState('');
  const [aptoMedico, setAptoMedico] = useState<'Apto' | 'Pendiente' | 'Vencido'>('Apto');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
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
      return onShowToast('Por favor completa el nombre, apellidos y cédula del atleta', 'error');
    }

    if (cleanCedula.length < 6) {
      return onShowToast('El número de cédula debe tener al menos 6 dígitos', 'error');
    }

    // Check duplicate cedula
    if (estudiantes.some((e) => e.cedula === cleanCedula)) {
      return onShowToast('Ya existe un socio/atleta registrado con esa cédula', 'error');
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
        curso: disciplina,
        disciplina: disciplina,
        categoria: categoria,
        entrenador: entrenador.trim() || 'Por Asignar',
        apto_medico: aptoMedico,
        contacto_emergencia: contactoEmergencia.trim() || 'No Registrado',
        estado_pago: estadoPago,
        qr_uuid: secretUUID,
      });
      setIsAddModalOpen(false);
      setNombre('');
      setApellidos('');
      setCedula('');
      setEntrenador('');
      setContactoEmergencia('');
      onShowToast('Atleta registrado y credencial QR generada con éxito', 'success');
    } catch (err) {
      onShowToast('Error al registrar atleta', 'error');
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
    const disc = (est.disciplina || est.curso || '').toLowerCase();
    const matchSearch =
      full.includes(term) || est.cedula.includes(term) || disc.includes(term);

    const matchEstado = filterEstado === 'todos' || est.estado_pago === filterEstado;
    const matchDisciplina =
      filterDisciplina === 'todas' || est.disciplina === filterDisciplina || est.curso === filterDisciplina;

    return matchSearch && matchEstado && matchDisciplina;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212]/80 p-5 rounded-3xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span>Atletas y Socios del Complejo</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              {filtered.length} registrados
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gestión de deportistas, asignación de disciplinas, verificación médica y credenciales QR.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Atleta / Socio</span>
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
            placeholder="Buscar por nombre, cédula o disciplina deportiva..."
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

        {/* Disciplina Filter */}
        <select
          value={filterDisciplina}
          onChange={(e) => setFilterDisciplina(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="todas">Todas las Disciplinas</option>
          {DISCIPLINAS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

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
      <div className="hidden md:block bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Cédula</th>
                <th className="px-6 py-4 font-semibold">Deportista</th>
                <th className="px-6 py-4 font-semibold">Disciplina & Categoría</th>
                <th className="px-6 py-4 font-semibold">Ficha Médica</th>
                <th className="px-6 py-4 font-semibold text-center">Cuota / Membresía</th>
                <th className="px-6 py-4 font-semibold text-center">Credencial QR</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    No se encontraron deportistas con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((est) => {
                  const isPagado = est.estado_pago === 'Pagado';
                  const apto = est.apto_medico || 'Apto';
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
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Entrenador: {est.entrenador || 'Asignado'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-400 block">
                          {est.disciplina || est.curso}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {est.categoria || 'Socio General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            apto === 'Apto'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{apto}</span>
                        </span>
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
                        <button
                          onClick={() => onDeleteEstudiante(est.id)}
                          className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Eliminar Registro"
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

      {/* VIEW 2: MOBILE CARDS */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-500 text-sm">
            No hay deportistas que coincidan con la búsqueda.
          </div>
        ) : (
          filtered.map((est) => {
            const isPagado = est.estado_pago === 'Pagado';
            const apto = est.apto_medico || 'Apto';
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
                    <p className="text-xs text-emerald-400 font-semibold mt-1">
                      {est.disciplina || est.curso} ({est.categoria || 'Libre'})
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

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/50">
                  <span>Médico: <strong className="text-emerald-400">{apto}</strong></span>
                  <span>Entrenador: {est.entrenador || 'Asignado'}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <button
                    onClick={() => setSelectedQrEstudiante(est)}
                    className="flex-1 mr-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition text-xs font-bold"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Ver Carnet QR</span>
                  </button>

                  <button
                    onClick={() => onDeleteEstudiante(est.id)}
                    className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: REGISTRAR ATLETA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-lg p-6 sm:p-7 rounded-3xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Nuevo Registro de Atleta / Socio</span>
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
                    placeholder="Ej: Pucha"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Disciplina Deportiva *
                  </label>
                  <select
                    value={disciplina}
                    onChange={(e) => setDisciplina(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DISCIPLINAS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Entrenador Responsable
                  </label>
                  <input
                    type="text"
                    value={entrenador}
                    onChange={(e) => setEntrenador(e.target.value)}
                    placeholder="Ej: Prof. Carlos Vaca"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Aptitud Médica (Ficha)
                  </label>
                  <select
                    value={aptoMedico}
                    onChange={(e) =>
                      setAptoMedico(e.target.value as 'Apto' | 'Pendiente' | 'Vencido')
                    }
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Apto">🟢 Apto para entrenamiento</option>
                    <option value="Pendiente">🟡 Ficha Médica Pendiente</option>
                    <option value="Vencido">🔴 Certificado Vencido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                    Contacto de Emergencia
                  </label>
                  <input
                    type="text"
                    value={contactoEmergencia}
                    onChange={(e) => setContactoEmergencia(e.target.value)}
                    placeholder="Ej: Mamá 0987654321"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
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

      {/* MODAL: CARNET Y CREDENCIAL DEPORTIVA QR */}
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
                COMPLEJO DEPORTIVO • CARNET OFICIAL
              </span>
              <h3 className="text-base font-black text-white truncate">
                {selectedQrEstudiante.nombre} {selectedQrEstudiante.apellidos}
              </h3>
              <div className="flex justify-between items-center text-xs text-emerald-100 font-mono mt-0.5">
                <span>Céd: {selectedQrEstudiante.cedula}</span>
                <span className="font-bold bg-zinc-950/40 px-2 py-0.5 rounded text-[10px] text-white">
                  {selectedQrEstudiante.disciplina || selectedQrEstudiante.curso}
                </span>
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
                <span className="text-zinc-500">Categoría:</span>
                <span className="text-zinc-200 font-semibold">{selectedQrEstudiante.categoria || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Membresía:</span>
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
                <span className="text-zinc-500">Ficha Médica:</span>
                <span className="text-emerald-400 font-bold">{selectedQrEstudiante.apto_medico || 'Apto'}</span>
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
