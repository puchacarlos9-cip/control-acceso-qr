import React, { useState, useEffect, useCallback } from 'react';
import {
  Usuario,
  Estudiante,
  AccesoLog,
  ToastMessage,
  RolUsuario,
} from './types';
import {
  fetchEstudiantes,
  agregarEstudiante,
  borrarEstudiante,
  toggleEstadoPagoEstudiante,
  fetchUsuarios,
  agregarUsuario,
  borrarUsuario,
  fetchLogsAcceso,
  registrarAccesoLog,
  checkFirebaseConnection,
  isFirebaseOnline as isFbOnlineVal,
} from './firebase/config';
import { LoginScreen } from './components/LoginScreen';
import { GuardTerminal } from './components/GuardTerminal';
import { Navbar } from './components/Navbar';
import { StudentsPanel } from './components/StudentsPanel';
import { PaymentsPanel } from './components/PaymentsPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { UsersPanel } from './components/UsersPanel';
import { ToastContainer } from './components/ToastContainer';
import { ConfirmModal } from './components/ConfirmModal';
import { Shield, RefreshCw } from 'lucide-react';

export default function App() {
  // Authentication & session
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const saved = sessionStorage.getItem('acceso_seguro_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<
    'estudiantes' | 'pagos' | 'reportes' | 'usuarios'
  >('estudiantes');

  // Data State
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [logsAcceso, setLogsAcceso] = useState<AccesoLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState<boolean>(true);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load all data from Hybrid Firebase / Local Cache
  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingData(true);
    try {
      await checkFirebaseConnection();
      setIsFirebaseOnline(isFbOnlineVal);

      const [listaEst, listaUsr, listaLogs] = await Promise.all([
        fetchEstudiantes(),
        fetchUsuarios(),
        fetchLogsAcceso(),
      ]);

      setEstudiantes(listaEst);
      setUsuarios(listaUsr);
      setLogsAcceso(listaLogs);
    } catch (err) {
      console.warn('Error cargando datos:', err);
      showToast('Cargando en modo caché local responsive', 'info');
    } finally {
      setIsLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Login & Session
  const handleLoginSuccess = (usr: Usuario) => {
    setUser(usr);
    try {
      sessionStorage.setItem('acceso_seguro_user_session', JSON.stringify(usr));
    } catch {
      // ignore
    }
    showToast(`Bienvenido/a al sistema, ${usr.nombre}`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem('acceso_seguro_user_session');
    } catch {
      // ignore
    }
    showToast('Sesión finalizada exitosamente', 'info');
  };

  // ESTUDIANTES CRUD
  const handleAddEstudiante = async (nuevo: Omit<Estudiante, 'id'>) => {
    const agregado = await agregarEstudiante(nuevo);
    setEstudiantes((prev) => [agregado, ...prev]);
  };

  const handleDeleteEstudiante = (id: string) => {
    const est = estudiantes.find((item) => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar a este estudiante?',
      message: `El estudiante ${
        est ? `"${est.nombre} ${est.apellidos}"` : ''
      } y su código QR serán removidos del sistema permanentemente.`,
      confirmText: 'Sí, Eliminar Alumno',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await borrarEstudiante(id);
        setEstudiantes((prev) => prev.filter((e) => e.id !== id));
        showToast('Estudiante eliminado exitosamente', 'success');
      },
    });
  };

  const handleToggleEstadoPago = async (
    id: string,
    nuevoEstado: 'Pagado' | 'Pendiente'
  ) => {
    await toggleEstadoPagoEstudiante(id, nuevoEstado);
    setEstudiantes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, estado_pago: nuevoEstado } : e))
    );
    const msg =
      nuevoEstado === 'Pagado'
        ? '✅ Estado de pensión actualizado: Pagado (Acceso Libre)'
        : '⚠️ Estado de pensión actualizado: Pendiente (Acceso Bloqueado)';
    showToast(msg, nuevoEstado === 'Pagado' ? 'success' : 'info');
  };

  // USUARIOS CRUD (Súper Admin)
  const handleAddUsuario = async (nuevo: Omit<Usuario, 'id'>) => {
    const agregado = await agregarUsuario(nuevo);
    setUsuarios((prev) => [agregado, ...prev]);
  };

  const handleDeleteUsuario = (id: string) => {
    const usr = usuarios.find((item) => item.id === id);
    if (usr?.usuario === 'superadmin') {
      return showToast('No puedes eliminar al Súper Administrador principal', 'error');
    }
    setConfirmModal({
      isOpen: true,
      title: '¿Revocar acceso al personal?',
      message: `El usuario ${
        usr ? `"${usr.nombre} (@${usr.usuario})"` : ''
      } ya no podrá ingresar a la plataforma.`,
      confirmText: 'Sí, Revocar Acceso',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await borrarUsuario(id);
        setUsuarios((prev) => prev.filter((u) => u.id !== id));
        showToast('Acceso revocado correctamente', 'success');
      },
    });
  };

  // LOG ACCESO (Guardia)
  const handleRegistrarAcceso = async (
    est: Estudiante,
    metodo: 'QR' | 'Cédula',
    permitido: boolean,
    motivo?: string
  ) => {
    const gNombre = user ? user.nombre : 'Guardia de Seguridad';
    const log = await registrarAccesoLog({
      nombre_estudiante: `${est.nombre} ${est.apellidos}`,
      cedula: est.cedula,
      guardia_responsable: gNombre,
      fecha_hora: new Date().toLocaleString('es-EC'),
      estado_ingreso: permitido ? 'Permitido' : 'Denegado',
      metodo: metodo,
      motivo: motivo,
    });

    setLogsAcceso((prev) => [log, ...prev]);
  };

  // 1. Unauthenticated -> Show Responsive Login Screen
  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <LoginScreen
          usuarios={usuarios}
          onLoginSuccess={handleLoginSuccess}
          onShowToast={showToast}
        />
      </>
    );
  }

  // 2. Guard Role -> Show Responsive Security Guard Terminal ("Punto de Control")
  if (user.rol === 'guardia') {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <GuardTerminal
          guardia={user}
          estudiantes={estudiantes}
          accesosRecientes={logsAcceso}
          onRegistrarAcceso={handleRegistrarAcceso}
          onLogout={handleLogout}
          onShowToast={showToast}
        />
      </>
    );
  }

  // 3. Admin / Super Admin Role -> Show Responsive Admin Dashboard
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col lg:flex-row relative selection:bg-emerald-500 selection:text-black">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() =>
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Navigation - Sidebar on PC/Laptop, Sticky Topbar + Drawer on Cellphones */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onLogout={handleLogout}
        isFirebaseOnline={isFirebaseOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar header for Desktop / PC */}
        <header className="hidden lg:flex h-20 border-b border-zinc-800/80 px-8 items-center justify-between bg-[#121212]/50">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {activeTab === 'estudiantes' && 'Base de Estudiantes'}
              {activeTab === 'pagos' && 'Estado de Pensiones y Matrículas'}
              {activeTab === 'reportes' && 'Dashboard de Reportes y Accesos'}
              {activeTab === 'usuarios' && 'Gestión de Personal y Turnos'}
            </h1>
            <button
              onClick={() => loadAllData(false)}
              disabled={isLoadingData}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition disabled:opacity-50"
              title="Refrescar datos"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sesión Activa: {user.nombre}</span>
            </div>
          </div>
        </header>

        {/* View content responsive wrapper */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {activeTab === 'estudiantes' && (
            <StudentsPanel
              estudiantes={estudiantes}
              onAddEstudiante={handleAddEstudiante}
              onDeleteEstudiante={handleDeleteEstudiante}
              onToggleEstadoPago={handleToggleEstadoPago}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'pagos' && (
            <PaymentsPanel
              estudiantes={estudiantes}
              onToggleEstadoPago={handleToggleEstadoPago}
            />
          )}

          {activeTab === 'reportes' && (
            <ReportsPanel logs={logsAcceso} />
          )}

          {activeTab === 'usuarios' && (
            <UsersPanel
              usuarios={usuarios}
              onAddUsuario={handleAddUsuario}
              onDeleteUsuario={handleDeleteUsuario}
              onShowToast={showToast}
            />
          )}
        </div>
      </main>
    </div>
  );
}
