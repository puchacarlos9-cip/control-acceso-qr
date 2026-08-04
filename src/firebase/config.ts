import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { Estudiante, Usuario, AccesoLog, RolUsuario } from '../types';

// Exact Firebase Config from user's original documents
const firebaseConfig = {
  apiKey: "AIzaSyAqNL5VISAk9vAlneeLZRqW-uUwLcZ70to",
  authDomain: "control-acceso-15da5.firebaseapp.com",
  projectId: "control-acceso-15da5",
  storageBucket: "control-acceso-15da5.firebasestorage.app",
  messagingSenderId: "833337928702",
  appId: "1:833337928702:web:8d086ed477cc5bb9852eaf"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initial Demo/Fallback Students (Complejo Deportivo - Atletas Estudiantes)
const DEFAULT_ESTUDIANTES: Estudiante[] = [
  {
    id: 'est-1',
    nombre: 'Carlos',
    apellidos: 'Pucha',
    cedula: '1105432190',
    estado_pago: 'Pagado',
    qr_uuid: 'a1b2c3d4-e5f6-4a11-b222-110543219000',
    fecha_registro: '2026-08-01 10:00:00',
    curso: 'Natación - Sub-18',
    disciplina: 'Natación',
    categoria: 'Sub-18',
    entrenador: 'Prof. Roberto Silva',
    apto_medico: 'Apto',
    contacto_emergencia: '0991234567 (Madre)'
  },
  {
    id: 'est-2',
    nombre: 'Valeria',
    apellidos: 'Mendoza',
    cedula: '1723456789',
    estado_pago: 'Pagado',
    qr_uuid: 'b2c3d4e5-f6a1-4b22-c333-172345678900',
    fecha_registro: '2026-08-01 10:15:00',
    curso: 'Gimnasia Artística - Sub-14',
    disciplina: 'Gimnasia Artística',
    categoria: 'Sub-14',
    entrenador: 'Dra. Elena Paz',
    apto_medico: 'Apto',
    contacto_emergencia: '0987654321 (Padre)'
  },
  {
    id: 'est-3',
    nombre: 'Fernando',
    apellidos: 'Rodríguez',
    cedula: '0912345678',
    estado_pago: 'Pendiente',
    qr_uuid: 'c3d4e5f6-a1b2-4c33-d444-091234567800',
    fecha_registro: '2026-08-02 14:20:00',
    curso: 'Fútbol Formativo - Sub-16',
    disciplina: 'Fútbol',
    categoria: 'Sub-16',
    entrenador: 'Prof. Marco Torres',
    apto_medico: 'Pendiente',
    contacto_emergencia: '0995554433 (Tutor)'
  },
  {
    id: 'est-4',
    nombre: 'Sofía',
    apellidos: 'Torres',
    cedula: '1104567890',
    estado_pago: 'Pagado',
    qr_uuid: 'd4e5f6a1-b2c3-4d44-e555-110456789000',
    fecha_registro: '2026-08-03 08:30:00',
    curso: 'Atletismo - Selección',
    disciplina: 'Atletismo',
    categoria: 'Selección',
    entrenador: 'Prof. Luis Vega',
    apto_medico: 'Apto',
    contacto_emergencia: '0998887766 (Madre)'
  },
  {
    id: 'est-5',
    nombre: 'Mateo',
    apellidos: 'Alvear',
    cedula: '1755443322',
    estado_pago: 'Pendiente',
    qr_uuid: 'e5f6a1b2-c3d4-4e55-f666-175544332200',
    fecha_registro: '2026-08-03 09:10:00',
    curso: 'Baloncesto - Sub-15',
    disciplina: 'Baloncesto',
    categoria: 'Sub-15',
    entrenador: 'Prof. Diego Morales',
    apto_medico: 'Vencido',
    contacto_emergencia: '0994443322 (Padre)'
  }
];

// Initial Demo/Fallback Users
const DEFAULT_USUARIOS: Usuario[] = [
  {
    id: 'usr-1',
    nombre: 'Director General (Tesis)',
    usuario: 'superadmin',
    password: '123',
    rol: 'super_admin',
    fecha_registro: '2026-08-01'
  },
  {
    id: 'usr-2',
    nombre: 'Coordinador Deportivo',
    usuario: 'admin',
    password: '123',
    rol: 'admin',
    fecha_registro: '2026-08-01'
  },
  {
    id: 'usr-3',
    nombre: 'Operador Torniquete 1',
    usuario: 'guardia',
    password: '123',
    rol: 'guardia',
    turno: 'Matutino',
    fecha_registro: '2026-08-01'
  },
  {
    id: 'usr-4',
    nombre: 'Operador Piscina & Coliseo',
    usuario: 'guardia2',
    password: '123',
    rol: 'guardia',
    turno: 'Vespertino',
    fecha_registro: '2026-08-01'
  }
];

// Initial Demo Access Logs
const DEFAULT_LOGS: AccesoLog[] = [
  {
    id: 'log-1',
    nombre_estudiante: 'Carlos Pucha',
    cedula: '1105432190',
    guardia_responsable: 'Operador Torniquete 1',
    fecha_hora: new Date(Date.now() - 3600 * 1000 * 2).toLocaleString('es-EC'),
    estado_ingreso: 'Permitido',
    metodo: 'QR',
    disciplina: 'Natación',
    zona_acceso: 'Piscina Olímpica'
  },
  {
    id: 'log-2',
    nombre_estudiante: 'Valeria Mendoza',
    cedula: '1723456789',
    guardia_responsable: 'Operador Torniquete 1',
    fecha_hora: new Date(Date.now() - 3600 * 1000 * 1.5).toLocaleString('es-EC'),
    estado_ingreso: 'Permitido',
    metodo: 'Cédula',
    disciplina: 'Gimnasia Artística',
    zona_acceso: 'Ingreso Principal'
  },
  {
    id: 'log-3',
    nombre_estudiante: 'Fernando Rodríguez',
    cedula: '0912345678',
    guardia_responsable: 'Operador Torniquete 1',
    fecha_hora: new Date(Date.now() - 3600 * 1000 * 0.5).toLocaleString('es-EC'),
    estado_ingreso: 'Denegado',
    metodo: 'QR',
    motivo: 'Pensión de disciplina en mora / Ficha médica pendiente.',
    disciplina: 'Fútbol',
    zona_acceso: 'Canchas Sintéticas'
  }
];

// Helper to check/load LocalStorage
const getLocalEstudiantes = (): Estudiante[] => {
  try {
    const data = localStorage.getItem('qr_estudiantes_cache');
    if (!data) {
      localStorage.setItem('qr_estudiantes_cache', JSON.stringify(DEFAULT_ESTUDIANTES));
      return DEFAULT_ESTUDIANTES;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_ESTUDIANTES;
  }
};

const saveLocalEstudiantes = (list: Estudiante[]) => {
  try {
    localStorage.setItem('qr_estudiantes_cache', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

const getLocalUsuarios = (): Usuario[] => {
  try {
    const data = localStorage.getItem('qr_usuarios_cache');
    if (!data) {
      localStorage.setItem('qr_usuarios_cache', JSON.stringify(DEFAULT_USUARIOS));
      return DEFAULT_USUARIOS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_USUARIOS;
  }
};

const saveLocalUsuarios = (list: Usuario[]) => {
  try {
    localStorage.setItem('qr_usuarios_cache', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

const getLocalLogs = (): AccesoLog[] => {
  try {
    const data = localStorage.getItem('qr_accesos_cache');
    if (!data) {
      localStorage.setItem('qr_accesos_cache', JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_LOGS;
  }
};

const saveLocalLogs = (list: AccesoLog[]) => {
  try {
    localStorage.setItem('qr_accesos_cache', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

// ========================================================
// HYBRID DATA LAYER (Tries Firebase first, fallback Local)
// ========================================================

export let isFirebaseOnline = true;

export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    const snapshot = await getDocs(query(collection(db, 'usuarios')));
    isFirebaseOnline = true;
    return true;
  } catch (err) {
    console.warn('Firebase no disponible o sin permisos. Usando caché local de alta fidelidad:', err);
    isFirebaseOnline = false;
    return false;
  }
}

// ESTUDIANTES CRUD
export async function fetchEstudiantes(): Promise<Estudiante[]> {
  try {
    const snapshot = await getDocs(collection(db, 'estudiantes'));
    const lista: Estudiante[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      lista.push({
        id: d.id,
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        cedula: data.cedula || '',
        estado_pago: data.estado_pago || 'Pendiente',
        qr_uuid: data.qr_uuid || '',
        fecha_registro: data.fecha_registro ? (typeof data.fecha_registro.toDate === 'function' ? data.fecha_registro.toDate().toLocaleString('es-EC') : String(data.fecha_registro)) : 'Reciente',
        curso: data.curso || data.disciplina || 'Formación Deportiva',
        disciplina: data.disciplina || 'General',
        categoria: data.categoria || 'Sub-16',
        entrenador: data.entrenador || 'Por Asignar',
        apto_medico: data.apto_medico || 'Apto',
        contacto_emergencia: data.contacto_emergencia || 'Sin registrar'
      });
    });
    if (lista.length > 0) {
      isFirebaseOnline = true;
      saveLocalEstudiantes(lista);
      return lista;
    }
  } catch (error) {
    isFirebaseOnline = false;
  }
  return getLocalEstudiantes();
}

export async function agregarEstudiante(nuevo: Omit<Estudiante, 'id'>): Promise<Estudiante> {
  try {
    const docRef = await addDoc(collection(db, 'estudiantes'), {
      ...nuevo,
      fecha_registro: serverTimestamp()
    });
    const est: Estudiante = { ...nuevo, id: docRef.id };
    const lista = getLocalEstudiantes();
    saveLocalEstudiantes([est, ...lista]);
    return est;
  } catch (error) {
    const est: Estudiante = {
      ...nuevo,
      id: 'est-' + Date.now(),
      fecha_registro: new Date().toLocaleString('es-EC')
    };
    const lista = getLocalEstudiantes();
    saveLocalEstudiantes([est, ...lista]);
    return est;
  }
}

export async function borrarEstudiante(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'estudiantes', id));
  } catch (error) {
    // ignore offline
  }
  const lista = getLocalEstudiantes().filter((e) => e.id !== id);
  saveLocalEstudiantes(lista);
}

export async function toggleEstadoPagoEstudiante(id: string, nuevoEstado: 'Pagado' | 'Pendiente'): Promise<void> {
  try {
    const ref = doc(db, 'estudiantes', id);
    await updateDoc(ref, { estado_pago: nuevoEstado });
  } catch (error) {
    // ignore offline
  }
  const lista = getLocalEstudiantes().map((e) =>
    e.id === id ? { ...e, estado_pago: nuevoEstado } : e
  );
  saveLocalEstudiantes(lista);
}

// USUARIOS / PERSONAL CRUD
export async function fetchUsuarios(): Promise<Usuario[]> {
  try {
    const snapshot = await getDocs(collection(db, 'usuarios'));
    const lista: Usuario[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      lista.push({
        id: d.id,
        nombre: data.nombre || '',
        usuario: data.usuario || '',
        password: data.password || '',
        rol: (data.rol as RolUsuario) || 'guardia',
        turno: data.turno || 'Matutino',
        fecha_registro: data.fecha_registro ? String(data.fecha_registro) : 'Reciente'
      });
    });
    if (lista.length > 0) {
      isFirebaseOnline = true;
      saveLocalUsuarios(lista);
      return lista;
    }
  } catch (error) {
    isFirebaseOnline = false;
  }
  return getLocalUsuarios();
}

export async function agregarUsuario(nuevo: Omit<Usuario, 'id'>): Promise<Usuario> {
  try {
    const docRef = await addDoc(collection(db, 'usuarios'), {
      ...nuevo,
      fecha_registro: serverTimestamp()
    });
    const usr: Usuario = { ...nuevo, id: docRef.id };
    const lista = getLocalUsuarios();
    saveLocalUsuarios([usr, ...lista]);
    return usr;
  } catch (error) {
    const usr: Usuario = {
      ...nuevo,
      id: 'usr-' + Date.now(),
      fecha_registro: new Date().toLocaleDateString('es-EC')
    };
    const lista = getLocalUsuarios();
    saveLocalUsuarios([usr, ...lista]);
    return usr;
  }
}

export async function borrarUsuario(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'usuarios', id));
  } catch (error) {
    // ignore offline
  }
  const lista = getLocalUsuarios().filter((u) => u.id !== id);
  saveLocalUsuarios(lista);
}

// ACCESOS REGISTRADOS CRUD
export async function fetchLogsAcceso(): Promise<AccesoLog[]> {
  try {
    const snapshot = await getDocs(collection(db, 'accesos_registrados'));
    const lista: AccesoLog[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      lista.push({
        id: d.id,
        nombre_estudiante: data.nombre_estudiante || 'Desconocido',
        cedula: data.cedula || '',
        guardia_responsable: data.guardia_responsable || 'Guardia Activo',
        fecha_hora: data.fecha_hora && typeof data.fecha_hora.toDate === 'function' ? data.fecha_hora.toDate().toLocaleString('es-EC') : String(data.fecha_hora || new Date().toLocaleString('es-EC')),
        estado_ingreso: data.estado_ingreso || 'Permitido',
        metodo: data.metodo || 'QR',
        motivo: data.motivo,
        disciplina: data.disciplina || 'General',
        zona_acceso: data.zona_acceso || 'Ingreso Principal'
      });
    });
    if (lista.length > 0) {
      isFirebaseOnline = true;
      // Sort newest first
      lista.sort((a, b) => b.id.localeCompare(a.id));
      saveLocalLogs(lista);
      return lista;
    }
  } catch (error) {
    isFirebaseOnline = false;
  }
  return getLocalLogs();
}

export async function registrarAccesoLog(nuevo: Omit<AccesoLog, 'id'>): Promise<AccesoLog> {
  const item: AccesoLog = {
    ...nuevo,
    id: 'log-' + Date.now(),
    fecha_hora: new Date().toLocaleString('es-EC')
  };
  try {
    await addDoc(collection(db, 'accesos_registrados'), {
      nombre_estudiante: nuevo.nombre_estudiante,
      cedula: nuevo.cedula,
      guardia_responsable: nuevo.guardia_responsable,
      fecha_hora: serverTimestamp(),
      estado_ingreso: nuevo.estado_ingreso,
      metodo: nuevo.metodo,
      motivo: nuevo.motivo || null,
      disciplina: nuevo.disciplina || null,
      zona_acceso: nuevo.zona_acceso || null
    });
  } catch (e) {
    // ignore offline
  }
  const lista = getLocalLogs();
  const actualizada = [item, ...lista].slice(0, 100);
  saveLocalLogs(actualizada);
  return item;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
