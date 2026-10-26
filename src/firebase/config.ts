import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import { Estudiante, Usuario, AccesoLog, Pago, RolUsuario } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase with the configured databaseId
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Error Handling conformant to Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initial Seed / Fallback Students
export const DEFAULT_ESTUDIANTES: Estudiante[] = [];

// Initial Seed / Fallback Users
export const DEFAULT_USUARIOS: Usuario[] = [
  {
    id: 'usr-1',
    nombre: 'Director General (Tesis)',
    usuario: 'superadmin',
    password: '123',
    rol: 'super_admin',
    fecha_registro: '2026-08-01',
  },
  {
    id: 'usr-2',
    nombre: 'Coordinador Deportivo',
    usuario: 'admin',
    password: '123',
    rol: 'admin',
    fecha_registro: '2026-08-01',
  },
  {
    id: 'usr-3',
    nombre: 'Operador Torniquete 1',
    usuario: 'guardia',
    password: '123',
    rol: 'guardia',
    turno: 'Matutino',
    fecha_registro: '2026-08-01',
  },
  {
    id: 'usr-4',
    nombre: 'Operador Garita 2',
    usuario: 'guardia2',
    password: '123',
    rol: 'guardia',
    turno: 'Vespertino',
    fecha_registro: '2026-08-01',
  },
];

// Initial Seed Payments
export const DEFAULT_PAGOS: Pago[] = [];

// Helper to check/load LocalStorage as fallback cache
export const getLocalPagos = (): Pago[] => {
  try {
    const data = localStorage.getItem('qr_pagos_cache');
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveLocalPagos = (list: Pago[]) => {
  try {
    localStorage.setItem('qr_pagos_cache', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

export const getLocalEstudiantes = (): Estudiante[] => {
  try {
    const data = localStorage.getItem('qr_estudiantes_cache');
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveLocalEstudiantes = (list: Estudiante[]) => {
  try {
    localStorage.setItem('qr_estudiantes_cache', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

export const getLocalUsuarios = (): Usuario[] => {
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

export const saveLocalUsuarios = (list: Usuario[]) => {
  try {
    localStorage.setItem('qr_usuarios_cache', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

export const getLocalLogs = (): AccesoLog[] => {
  try {
    const data = localStorage.getItem('qr_accesos_cache');
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveLocalLogs = (list: AccesoLog[]) => {
  try {
    localStorage.setItem('qr_accesos_cache', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

export let isFirebaseOnline = true;

// Connection test
export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isFirebaseOnline = true;
    return true;
  } catch {
    try {
      await getDocs(collection(db, 'usuarios'));
      isFirebaseOnline = true;
      return true;
    } catch (err) {
      console.warn('Firebase no respondió directamente. Modo local activo:', err);
      isFirebaseOnline = false;
      return false;
    }
  }
}

// Seed remote Firestore default users if empty (so admin can log in)
let isSeeding = false;
export async function seedFirestoreIfEmpty(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const userSnap = await getDocs(collection(db, 'usuarios'));
    if (userSnap.empty) {
      for (const u of DEFAULT_USUARIOS) {
        await setDoc(doc(db, 'usuarios', u.id), {
          nombre: u.nombre,
          usuario: u.usuario,
          password: u.password,
          rol: u.rol,
          turno: u.turno || 'Matutino',
          fecha_registro: u.fecha_registro,
        });
      }
    }
  } catch (err) {
    console.warn('Verificación inicial de usuarios en Firestore:', err);
  } finally {
    isSeeding = false;
  }
}

// REALTIME SUBSCRIBERS (onSnapshot)
export function subscribeEstudiantes(
  callback: (estudiantes: Estudiante[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'estudiantes'),
    (snapshot) => {
      isFirebaseOnline = true;
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
          fecha_registro: data.fecha_registro
            ? typeof data.fecha_registro.toDate === 'function'
              ? data.fecha_registro.toDate().toLocaleString('es-EC')
              : String(data.fecha_registro)
            : 'Reciente',
          fecha_ultimo_pago: data.fecha_ultimo_pago,
          fecha_vencimiento_pago: data.fecha_vencimiento_pago,
          monto_ultimo_pago: data.monto_ultimo_pago,
        });
      });
      // Sort students alphabetically
      lista.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      saveLocalEstudiantes(lista);
      callback(lista);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'estudiantes');
      isFirebaseOnline = false;
      if (onError) onError(err);
      callback(getLocalEstudiantes());
    }
  );
}

export function subscribeUsuarios(
  callback: (usuarios: Usuario[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'usuarios'),
    (snapshot) => {
      isFirebaseOnline = true;
      if (snapshot.empty) {
        seedFirestoreIfEmpty();
      }
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
          fecha_registro: data.fecha_registro ? String(data.fecha_registro) : 'Reciente',
        });
      });
      if (lista.length > 0) {
        saveLocalUsuarios(lista);
        callback(lista);
      } else {
        callback(getLocalUsuarios());
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'usuarios');
      isFirebaseOnline = false;
      if (onError) onError(err);
      callback(getLocalUsuarios());
    }
  );
}

export function subscribeLogsAcceso(
  callback: (logs: AccesoLog[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'accesos_registrados'),
    (snapshot) => {
      isFirebaseOnline = true;
      const lista: AccesoLog[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lista.push({
          id: d.id,
          nombre_estudiante: data.nombre_estudiante || 'Desconocido',
          cedula: data.cedula || '',
          guardia_responsable: data.guardia_responsable || 'Guardia Activo',
          fecha_hora:
            data.fecha_hora && typeof data.fecha_hora.toDate === 'function'
              ? data.fecha_hora.toDate().toLocaleString('es-EC')
              : String(data.fecha_hora || new Date().toLocaleString('es-EC')),
          estado_ingreso: data.estado_ingreso || 'Permitido',
          metodo: data.metodo || 'QR',
          motivo: data.motivo,
          zona_acceso: data.zona_acceso || 'Ingreso Principal',
        });
      });
      lista.sort((a, b) => b.id.localeCompare(a.id));
      saveLocalLogs(lista);
      callback(lista);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'accesos_registrados');
      isFirebaseOnline = false;
      if (onError) onError(err);
      callback(getLocalLogs());
    }
  );
}

export function subscribePagos(
  callback: (pagos: Pago[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'pagos'),
    (snapshot) => {
      isFirebaseOnline = true;
      const lista: Pago[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lista.push({
          id: d.id,
          estudiante_id: data.estudiante_id || '',
          estudiante_nombre: data.estudiante_nombre || 'Estudiante',
          cedula: data.cedula || '',
          mes_pagado: data.mes_pagado || 'Mes Actual',
          monto: Number(data.monto) || 0,
          metodo_pago: data.metodo_pago || 'Efectivo',
          fecha_pago: data.fecha_pago || new Date().toISOString().split('T')[0],
          fecha_vencimiento: data.fecha_vencimiento || new Date().toISOString().split('T')[0],
          registrado_por: data.registrado_por || 'Sistema',
          comprobante: data.comprobante || '',
        });
      });
      lista.sort((a, b) => b.fecha_pago.localeCompare(a.fecha_pago));
      saveLocalPagos(lista);
      callback(lista);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'pagos');
      isFirebaseOnline = false;
      if (onError) onError(err);
      callback(getLocalPagos());
    }
  );
}

// ESTUDIANTES MUTATIONS
export async function agregarEstudiante(nuevo: Omit<Estudiante, 'id'>): Promise<Estudiante> {
  try {
    const docRef = await addDoc(collection(db, 'estudiantes'), {
      ...nuevo,
      fecha_registro: serverTimestamp(),
    });
    const est: Estudiante = { ...nuevo, id: docRef.id };
    const lista = getLocalEstudiantes();
    saveLocalEstudiantes([est, ...lista]);
    return est;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'estudiantes');
    const est: Estudiante = {
      ...nuevo,
      id: 'est-' + Date.now(),
      fecha_registro: new Date().toLocaleString('es-EC'),
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
    handleFirestoreError(error, OperationType.DELETE, `estudiantes/${id}`);
  }
  const lista = getLocalEstudiantes().filter((e) => e.id !== id);
  saveLocalEstudiantes(lista);
}

export async function toggleEstadoPagoEstudiante(
  id: string,
  nuevoEstado: 'Pagado' | 'Pendiente'
): Promise<void> {
  try {
    const ref = doc(db, 'estudiantes', id);
    await updateDoc(ref, { estado_pago: nuevoEstado });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `estudiantes/${id}`);
  }
  const lista = getLocalEstudiantes().map((e) =>
    e.id === id ? { ...e, estado_pago: nuevoEstado } : e
  );
  saveLocalEstudiantes(lista);
}

export async function actualizarEstudiante(
  id: string,
  datos: Partial<Omit<Estudiante, 'id'>>
): Promise<void> {
  try {
    const ref = doc(db, 'estudiantes', id);
    await updateDoc(ref, datos);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `estudiantes/${id}`);
  }
  const lista = getLocalEstudiantes().map((e) =>
    e.id === id ? { ...e, ...datos } : e
  );
  saveLocalEstudiantes(lista);
}

// USUARIOS MUTATIONS
export async function agregarUsuario(nuevo: Omit<Usuario, 'id'>): Promise<Usuario> {
  try {
    const docRef = await addDoc(collection(db, 'usuarios'), {
      ...nuevo,
      fecha_registro: serverTimestamp(),
    });
    const usr: Usuario = { ...nuevo, id: docRef.id };
    const lista = getLocalUsuarios();
    saveLocalUsuarios([usr, ...lista]);
    return usr;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'usuarios');
    const usr: Usuario = {
      ...nuevo,
      id: 'usr-' + Date.now(),
      fecha_registro: new Date().toLocaleDateString('es-EC'),
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
    handleFirestoreError(error, OperationType.DELETE, `usuarios/${id}`);
  }
  const lista = getLocalUsuarios().filter((u) => u.id !== id);
  saveLocalUsuarios(lista);
}

// ACCESOS REGISTRADOS MUTATIONS
export async function registrarAccesoLog(nuevo: Omit<AccesoLog, 'id'>): Promise<AccesoLog> {
  let docId = 'log-' + Date.now();
  const fechaStr = new Date().toLocaleString('es-EC');
  try {
    const docRef = await addDoc(collection(db, 'accesos_registrados'), {
      nombre_estudiante: nuevo.nombre_estudiante,
      cedula: nuevo.cedula,
      guardia_responsable: nuevo.guardia_responsable,
      fecha_hora: serverTimestamp(),
      estado_ingreso: nuevo.estado_ingreso,
      metodo: nuevo.metodo,
      motivo: nuevo.motivo || null,
      zona_acceso: nuevo.zona_acceso || 'Ingreso Principal',
    });
    docId = docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'accesos_registrados');
  }

  const item: AccesoLog = {
    ...nuevo,
    id: docId,
    fecha_hora: fechaStr,
  };
  const lista = getLocalLogs();
  saveLocalLogs([item, ...lista].slice(0, 100));
  return item;
}

// PAGOS MUTATIONS
export async function registrarPago(
  nuevo: Omit<Pago, 'id'>
): Promise<{ pago: Pago; estudianteActualizado?: Estudiante }> {
  let docId = 'pago-' + Date.now();
  try {
    const docRef = await addDoc(collection(db, 'pagos'), {
      ...nuevo,
      fecha_creacion: serverTimestamp(),
    });
    docId = docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'pagos');
  }

  const pagoItem: Pago = { ...nuevo, id: docId };
  const localPagos = getLocalPagos();
  saveLocalPagos([pagoItem, ...localPagos]);

  let estudianteActualizado: Estudiante | undefined;
  try {
    const ref = doc(db, 'estudiantes', nuevo.estudiante_id);
    await updateDoc(ref, {
      estado_pago: 'Pagado',
      fecha_ultimo_pago: nuevo.fecha_pago,
      fecha_vencimiento_pago: nuevo.fecha_vencimiento,
      monto_ultimo_pago: nuevo.monto,
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `estudiantes/${nuevo.estudiante_id}`);
  }

  const estudiantes = getLocalEstudiantes();
  const idx = estudiantes.findIndex(
    (e) => e.id === nuevo.estudiante_id || e.cedula === nuevo.cedula
  );
  if (idx !== -1) {
    estudiantes[idx] = {
      ...estudiantes[idx],
      estado_pago: 'Pagado',
      fecha_ultimo_pago: nuevo.fecha_pago,
      fecha_vencimiento_pago: nuevo.fecha_vencimiento,
      monto_ultimo_pago: nuevo.monto,
    };
    saveLocalEstudiantes(estudiantes);
    estudianteActualizado = estudiantes[idx];
  }

  return { pago: pagoItem, estudianteActualizado };
}

// Keep one-time fetch helpers for backwards compatibility
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
        fecha_registro: data.fecha_registro
          ? typeof data.fecha_registro.toDate === 'function'
            ? data.fecha_registro.toDate().toLocaleString('es-EC')
            : String(data.fecha_registro)
          : 'Reciente',
        fecha_ultimo_pago: data.fecha_ultimo_pago,
        fecha_vencimiento_pago: data.fecha_vencimiento_pago,
        monto_ultimo_pago: data.monto_ultimo_pago,
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
        fecha_registro: data.fecha_registro ? String(data.fecha_registro) : 'Reciente',
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
        fecha_hora:
          data.fecha_hora && typeof data.fecha_hora.toDate === 'function'
            ? data.fecha_hora.toDate().toLocaleString('es-EC')
            : String(data.fecha_hora || new Date().toLocaleString('es-EC')),
        estado_ingreso: data.estado_ingreso || 'Permitido',
        metodo: data.metodo || 'QR',
        motivo: data.motivo,
        zona_acceso: data.zona_acceso || 'Ingreso Principal',
      });
    });
    if (lista.length > 0) {
      isFirebaseOnline = true;
      lista.sort((a, b) => b.id.localeCompare(a.id));
      saveLocalLogs(lista);
      return lista;
    }
  } catch (error) {
    isFirebaseOnline = false;
  }
  return getLocalLogs();
}

export async function fetchPagos(): Promise<Pago[]> {
  try {
    const snapshot = await getDocs(collection(db, 'pagos'));
    const lista: Pago[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      lista.push({
        id: d.id,
        estudiante_id: data.estudiante_id || '',
        estudiante_nombre: data.estudiante_nombre || 'Estudiante',
        cedula: data.cedula || '',
        mes_pagado: data.mes_pagado || 'Mes Actual',
        monto: Number(data.monto) || 0,
        metodo_pago: data.metodo_pago || 'Efectivo',
        fecha_pago: data.fecha_pago || new Date().toISOString().split('T')[0],
        fecha_vencimiento: data.fecha_vencimiento || new Date().toISOString().split('T')[0],
        registrado_por: data.registrado_por || 'Sistema',
        comprobante: data.comprobante || '',
      });
    });
    if (lista.length > 0) {
      isFirebaseOnline = true;
      lista.sort((a, b) => b.fecha_pago.localeCompare(a.fecha_pago));
      saveLocalPagos(lista);
      return lista;
    }
  } catch (error) {
    isFirebaseOnline = false;
  }
  return getLocalPagos();
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
