import React, { useState, useEffect, useRef } from 'react';
import { Usuario, Estudiante, AccesoLog } from '../types';
import {
  Shield,
  LogOut,
  QrCode,
  CreditCard,
  CheckCircle2,
  XCircle,
  Camera,
  X,
  History,
  AlertCircle,
  Trophy,
  Activity,
  MapPin,
  Phone,
  UserCheck,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface GuardTerminalProps {
  guardia: Usuario;
  estudiantes: Estudiante[];
  accesosRecientes: AccesoLog[];
  onRegistrarAcceso: (
    est: Estudiante,
    metodo: 'QR' | 'Cédula',
    permitido: boolean,
    motivo?: string
  ) => void;
  onLogout: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const GuardTerminal: React.FC<GuardTerminalProps> = ({
  guardia,
  estudiantes,
  accesosRecientes,
  onRegistrarAcceso,
  onLogout,
  onShowToast,
}) => {
  // Modals state
  const [showCedulaModal, setShowCedulaModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [inputCedula, setInputCedula] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedZone, setSelectedZone] = useState('Ingreso Principal');

  // Result Modal State
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    permitido: boolean;
    nombre: string;
    cedula: string;
    disciplina?: string;
    categoria?: string;
    entrenador?: string;
    apto_medico?: string;
    estado_pago?: string;
    contacto_emergencia?: string;
    motivo?: string;
  }>({
    isOpen: false,
    permitido: false,
    nombre: '',
    cedula: '',
  });

  // Scanner ref
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop camera when closing modal or unmounting
  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error deteniendo cámara:', err);
      }
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const openQrScanner = async () => {
    setShowQrModal(true);
    setCameraError(null);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('lector-qr-box');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
          },
          (decodedText) => {
            // Successful QR Scan
            stopCamera();
            setShowQrModal(false);
            handleVerifyQrUUID(decodedText);
          },
          () => {
            // Ignore scan frames without QR code
          }
        );
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Error iniciando cámara QR:', err);
        setCameraError(
          'No se pudo acceder a la cámara. Revisa los permisos de tu navegador o usa la lista de Simulación de Prueba QR en pantalla.'
        );
      }
    }, 150);
  };

  const verifyStudentEntry = (est: Estudiante, metodo: 'QR' | 'Cédula') => {
    const pagoOk = est.estado_pago === 'Pagado';
    const medicoOk = est.apto_medico === 'Apto' || !est.apto_medico;

    let motivo: string | undefined = undefined;
    if (!pagoOk && !medicoOk) {
      motivo = 'Membresía en mora y certificado médico vencido/pendiente.';
    } else if (!pagoOk) {
      motivo = 'Membresía mensual en mora. Requiere actualizar cuota.';
    } else if (!medicoOk) {
      motivo = `Certificado médico en estado: ${est.apto_medico}. Inhabilitado para entrenar.`;
    }

    const permitido = pagoOk && medicoOk;

    onRegistrarAcceso(est, metodo, permitido, motivo);
    setResultModal({
      isOpen: true,
      permitido,
      nombre: `${est.nombre} ${est.apellidos}`,
      cedula: est.cedula,
      disciplina: est.disciplina || est.curso,
      categoria: est.categoria,
      entrenador: est.entrenador,
      apto_medico: est.apto_medico || 'Apto',
      estado_pago: est.estado_pago,
      contacto_emergencia: est.contacto_emergencia,
      motivo,
    });
  };

  const handleVerifyCedula = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputCedula.trim();
    if (!clean) {
      return onShowToast('Por favor ingresa un número de cédula', 'error');
    }

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      const est = estudiantes.find((item) => item.cedula === clean);
      if (!est) {
        onShowToast('Socio/Atleta NO registrado en el Complejo Deportivo', 'error');
      } else {
        setShowCedulaModal(false);
        setInputCedula('');
        verifyStudentEntry(est, 'Cédula');
      }
    }, 300);
  };

  const handleVerifyQrUUID = (uuid: string) => {
    const est = estudiantes.find((item) => item.qr_uuid === uuid);
    if (!est) {
      onShowToast('Código QR no válido o Socio no registrado en el Complejo', 'error');
    } else {
      verifyStudentEntry(est, 'QR');
    }
  };

  // Simulate instant QR scan for testing
  const handleSimulateQr = (est: Estudiante) => {
    stopCamera();
    setShowQrModal(false);
    handleVerifyQrUUID(est.qr_uuid);
  };

  const accesosPermitidosHoy = accesosRecientes.filter(
    (l) => l.estado_ingreso === 'Permitido'
  ).length;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center p-4 sm:p-6 md:p-8 relative selection:bg-emerald-500 selection:text-black">
      {/* Top Bar / Guard Session Banner */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8 bg-[#18181b] border border-zinc-800/80 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center text-2xl shadow-lg text-zinc-950 font-bold flex-shrink-0">
            🏆
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide truncate">
                {guardia.nombre}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold whitespace-nowrap">
                {guardia.turno || 'Operador de Turno'}
              </span>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Torniquetes Complejo Deportivo</span>
            </p>
          </div>
        </div>

        {/* Live Zone Selector & Capacity metric */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-zinc-400 text-[10px] uppercase font-bold">Aforo Deportivo</div>
              <div className="font-mono text-emerald-400 font-bold">{accesosPermitidosHoy} Atletas</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700/50 hover:border-red-500/30 transition-all font-medium text-xs sm:text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Title & Zone Selector */}
      <div className="text-center mb-6 sm:mb-8 px-2 max-w-2xl">
        <h1 className="text-3xl sm:text-5xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
          Control de Acceso e Ingreso
        </h1>
        <p className="text-zinc-400 text-xs sm:text-base">
          Verificación dual de mensualidades y aptitud médica para atletas y estudiantes socios
        </p>

        {/* Zone Selector Pills */}
        <div className="mt-4 inline-flex flex-wrap items-center justify-center bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1 gap-1 text-xs">
          {['Ingreso Principal', 'Piscina Olímpica', 'Canchas Sintéticas', 'Coliseo', 'Gimnasio'].map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 rounded-xl transition font-semibold ${
                selectedZone === zone
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* 2 Big Action Buttons (Responsive: 1 col mobile, 2 col PC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl mb-8">
        <button
          onClick={() => {
            setShowCedulaModal(true);
            setInputCedula('');
          }}
          className="bg-[#18181b] border border-zinc-800/80 hover:border-blue-500/60 hover:bg-zinc-800/90 transition-all duration-300 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center w-full shadow-lg group active:scale-[0.98]"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-3xl flex items-center justify-center text-3xl sm:text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <CreditCard className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-wide text-white">
            Ingreso por Cédula
          </span>
          <span className="text-xs text-zinc-400 mt-1">
            Búsqueda manual para atletas o visitantes
          </span>
        </button>

        <button
          onClick={openQrScanner}
          className="bg-[#18181b] border border-zinc-800/80 hover:border-emerald-500/60 hover:bg-zinc-800/90 transition-all duration-300 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center w-full shadow-lg group active:scale-[0.98]"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-3xl flex items-center justify-center text-3xl sm:text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <QrCode className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-wide text-white">
            Escanear Código QR
          </span>
          <span className="text-xs text-zinc-400 mt-1">
            Lectura rápida desde carnet o celular
          </span>
        </button>
      </div>

      {/* Live Recent Access Feed */}
      <div className="w-full max-w-3xl bg-[#18181b] border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base sm:text-lg text-white">
              Historial del Torniquete ({selectedZone})
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            En tiempo real
          </span>
        </div>

        {accesosRecientes.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No hay registros de ingreso en este punto de control.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {accesosRecientes.slice(0, 8).map((log) => {
              const isPermitido = log.estado_ingreso === 'Permitido';
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isPermitido
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {isPermitido ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-sm text-white truncate">
                        {log.nombre_estudiante}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Céd: {log.cedula} • {log.disciplina || 'Atleta'} • {log.metodo}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPermitido
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {log.estado_ingreso}
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-1">{log.fecha_hora}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: VERIFICACIÓN POR CÉDULA */}
      {showCedulaModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm p-6 sm:p-8 rounded-3xl shadow-2xl relative">
            <button
              onClick={() => setShowCedulaModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Ingresar Cédula de Atleta
              </h3>
              <p className="text-zinc-400 text-xs mt-1">
                Escribe la identificación para consultar derecho de ingreso
              </p>
            </div>

            <form onSubmit={handleVerifyCedula}>
              <input
                type="text"
                autoFocus
                value={inputCedula}
                onChange={(e) => setInputCedula(e.target.value)}
                placeholder="Ej: 1105432190"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-center text-xl tracking-widest text-white focus:outline-none focus:border-blue-500 mb-6 font-mono"
              />
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowCedulaModal(false)}
                  className="w-full sm:flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3.5 rounded-xl transition font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full sm:flex-1 bg-blue-500 hover:bg-blue-400 text-white py-3.5 rounded-xl transition font-bold shadow-lg shadow-blue-500/20 text-sm"
                >
                  {isSearching ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ESCÁNER QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-md p-5 sm:p-7 rounded-3xl shadow-2xl relative flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <span>Escanear Código QR</span>
              </h3>
              <button
                onClick={() => {
                  stopCamera();
                  setShowQrModal(false);
                }}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera viewport container */}
            <div className="w-full bg-black rounded-2xl overflow-hidden border-2 border-zinc-700/60 mb-4 min-h-[260px] sm:min-h-[280px] flex items-center justify-center relative">
              <div id="lector-qr-box" className="w-full h-full"></div>
              {!isCameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center">
                  <Camera className="w-8 h-8 animate-pulse text-emerald-400" />
                  <span className="text-xs">Iniciando cámara de torniquete...</span>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 p-6 text-center bg-zinc-900/90 gap-3">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-xs leading-relaxed">{cameraError}</p>
                </div>
              )}
            </div>

            {/* QUICK TEST QR SIMULATION LIST */}
            <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-4">
              <p className="text-xs text-zinc-400 font-semibold mb-2.5 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulación directa para sustentación en PC:</span>
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {estudiantes.map((est) => (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => handleSimulateQr(est)}
                    className={`p-2 rounded-xl text-left border transition text-xs ${
                      est.estado_pago === 'Pagado' && (est.apto_medico === 'Apto' || !est.apto_medico)
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                        : 'bg-red-950/30 border-red-500/30 text-red-300 hover:bg-red-900/40'
                    }`}
                  >
                    <div className="font-bold truncate">{est.nombre} {est.apellidos.charAt(0)}.</div>
                    <div className="text-[10px] opacity-80 truncate">
                      {est.disciplina || est.curso} • {est.estado_pago}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                stopCamera();
                setShowQrModal(false);
              }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold text-sm transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: RESULTADO DEL ACCESO (VERIFICACIÓN DUAL DEPORTIVA) */}
      {resultModal.isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl text-center relative">
            <div className="mb-4 flex justify-center">
              {resultModal.permitido ? (
                <CheckCircle2 className="w-20 h-20 sm:w-24 sm:h-24 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-bounce" />
              ) : (
                <XCircle className="w-20 h-20 sm:w-24 sm:h-24 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce" />
              )}
            </div>

            <h3
              className={`text-2xl sm:text-3xl font-black mb-1 tracking-wider ${
                resultModal.permitido ? 'text-emerald-400' : 'text-red-500'
              }`}
            >
              {resultModal.permitido ? 'ACCESO AUTORIZADO' : 'INGRESO BLOQUEADO'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">{selectedZone}</p>

            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-left">
              <div>
                <span className="font-bold text-white text-lg block uppercase truncate">
                  {resultModal.nombre}
                </span>
                <span className="text-zinc-400 text-xs font-mono">
                  Cédula: {resultModal.cedula}
                </span>
              </div>

              {/* Sports details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Disciplina & Categoría</span>
                  <span className="font-semibold text-emerald-300">
                    {resultModal.disciplina} {resultModal.categoria ? `(${resultModal.categoria})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Entrenador Responsable</span>
                  <span className="font-semibold text-zinc-200">
                    {resultModal.entrenador || 'Asignado'}
                  </span>
                </div>
              </div>

              {/* Status Badges Dual */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-xs">
                <div className="p-2 rounded-xl bg-zinc-800/60 flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">Cuota Mensual</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                      resultModal.estado_pago === 'Pagado'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {resultModal.estado_pago}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-zinc-800/60 flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">Ficha Médica</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                      resultModal.apto_medico === 'Apto'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {resultModal.apto_medico}
                  </span>
                </div>
              </div>

              {resultModal.contacto_emergencia && (
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Emergencia: {resultModal.contacto_emergencia}</span>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800">
                {resultModal.permitido ? (
                  <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Torniquete desbloqueado. Bienvenido a su entrenamiento.
                  </span>
                ) : (
                  <span className="text-red-400 font-semibold text-xs flex items-center gap-1">
                    ⚠️ {resultModal.motivo || 'No autorizado para el ingreso.'}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setResultModal({ ...resultModal, isOpen: false })}
              className="mt-5 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3.5 rounded-2xl font-bold text-base transition shadow-lg"
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
