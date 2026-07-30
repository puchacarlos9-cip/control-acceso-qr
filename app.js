import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAqNL5VISAk9vAlneeLZRqW-uUwLcZ70to",
  authDomain: "control-acceso-15da5.firebaseapp.com",
  projectId: "control-acceso-15da5",
  storageBucket: "control-acceso-15da5.firebasestorage.app",
  messagingSenderId: "833337928702",
  appId: "1:833337928702:web:8d086ed477cc5bb9852eaf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.guardiaConectado = "Desconocido";

// ==========================================
// 2. FUNCIONES DE INTERFAZ (UI)
// ==========================================

window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-500 text-zinc-950' : 'bg-red-500 text-white';
  toast.className = `${bg} px-6 py-4 rounded-2xl shadow-xl font-bold text-sm transform translate-y-5 opacity-0 transition-all duration-300 flex items-center gap-3`;
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-y-5', 'opacity-0'), 50);
  setTimeout(() => { toast.classList.add('opacity-0'); setTimeout(() => toast.remove(), 300); }, 3000);
}

window.switchTab = function(tabId) {
  document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active', 'border-l-4', 'active-purple'));
  const activeBtn = document.getElementById(`tab-${tabId}`);
  if(tabId === 'usuarios') { activeBtn.classList.add('active-purple'); } else { activeBtn.classList.add('active'); }
  const titles = { 'pagos': 'Estado de Pensiones', 'estudiantes': 'Base de Estudiantes', 'reportes': 'Dashboard de Reportes', 'usuarios': 'Gestión de Personal' };
  document.getElementById('topbarTitle').innerText = titles[tabId];
  document.querySelectorAll('main > div > div[id^="view-"]').forEach(view => view.classList.add('hidden'));
  document.getElementById(`view-${tabId}`).classList.remove('hidden');
}

window.openModal = function(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('hidden');
  setTimeout(() => modal.querySelector('.transform').classList.remove('scale-95'), 10);
  if(id === 'modalBuscarCedula') { setTimeout(() => document.getElementById('inputBusquedaCedula').focus(), 100); }
}

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  modal.querySelector('.transform').classList.add('scale-95');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

window.logout = function() { location.reload(); }

window.generarUUID = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

window.toggleTurno = function() {
  const rol = document.getElementById('usrRol').value;
  document.getElementById('turnoContainer').style.display = (rol === 'guardia') ? 'block' : 'none';
}

window.togglePasswordVisibility = function() {
  const passInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eyeIcon');
  
  if (passInput.type === 'password') {
    passInput.type = 'text';
    eyeIcon.classList.remove('fa-eye');
    eyeIcon.classList.add('fa-eye-slash'); 
  } else {
    passInput.type = 'password';
    eyeIcon.classList.remove('fa-eye-slash');
    eyeIcon.classList.add('fa-eye'); 
  }
};

// ==========================================
// NUEVO: SISTEMA DE CONFIRMACIÓN MODERNO
// ==========================================
let accionPendiente = null;

window.pedirConfirmacion = function(mensaje, accion) {
  document.getElementById('textoConfirmacion').innerText = mensaje;
  window.openModal('modalConfirmacion');
  accionPendiente = accion; 
}

window.ejecutarConfirmacion = function() {
  if (accionPendiente) {
    accionPendiente(); 
    accionPendiente = null; 
  }
  window.closeModal('modalConfirmacion');
}

window.cancelarConfirmacion = function() {
  accionPendiente = null;
  window.closeModal('modalConfirmacion');
}

// ==========================================
// 3. LÓGICA DEL SISTEMA Y FIREBASE
// ==========================================

window.loginSistema = async function() {
  const user = document.getElementById('username').value.toLowerCase().trim();
  const pass = document.getElementById('password').value;
  const btn = document.getElementById('btnLogin');
  if(!user || !pass) return window.showToast("Por favor, ingresa usuario y contraseña", "error");

  btn.innerText = "Verificando..."; btn.disabled = true;

  try {
    const q = query(collection(db, "usuarios"), where("usuario", "==", user), where("password", "==", pass));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) { window.showToast("Usuario o contraseña incorrectos", "error"); } 
    else {
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.rol === "super_admin") { window.iniciarDashboard(1, userData.nombre); } 
        else if (userData.rol === "admin") { window.iniciarDashboard(2, userData.nombre); } 
        else if (userData.rol === "guardia") { window.iniciarGuardia(userData.nombre, userData.turno || "Turno General"); } 
      });
    }
  } catch (error) { window.showToast("Error de conexión", "error"); } 
  finally { btn.innerText = "Ingresar"; btn.disabled = false; }
};

window.iniciarDashboard = function(rol, nombre) {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboardScreen').classList.remove('hidden');
  const badge = document.getElementById('userBadge');
  if (rol === 1) {
    document.getElementById('tab-usuarios').classList.remove('hidden');
    badge.innerHTML = `<i class="fa-solid fa-crown"></i> <span>${nombre}</span>`;
    window.cargarUsuarios(); 
  }
  window.cargarEstudiantes();
}

window.iniciarGuardia = function(nombre, turno) {
  window.guardiaConectado = nombre; 
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboardScreen').classList.add('hidden');
  document.getElementById('guardScreen').classList.remove('hidden');
  document.getElementById('guardName').innerText = nombre;
  document.getElementById('guardShift').innerText = `Guardia de Seguridad • ${turno}`;
}

// === FUNCIONES DEL GUARDIA ===
window.verificarAccesoCedula = async function() {
  const cedula = document.getElementById('inputBusquedaCedula').value.trim();
  const btn = document.getElementById('btnVerificarCedula');
  
  if(!cedula) return window.showToast("Debes ingresar una cédula", "error");
  btn.innerText = "Buscando..."; btn.disabled = true;

  try {
    const q = query(collection(db, "estudiantes"), where("cedula", "==", cedula));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      window.showToast("Estudiante NO registrado en el sistema", "error");
    } else {
      querySnapshot.forEach(async (documento) => {
        const est = documento.data();
        window.closeModal('modalBuscarCedula');
        const nombreCompleto = `${est.nombre} ${est.apellidos}`;

        if(est.estado_pago === "Pagado") {
          window.mostrarResultado(true, nombreCompleto);
          await addDoc(collection(db, "accesos_registrados"), {
            nombre_estudiante: nombreCompleto, cedula: est.cedula, guardia_responsable: window.guardiaConectado,
            fecha_hora: serverTimestamp(), estado_ingreso: "Permitido", metodo: "Cedula"
          });
        } else {
          window.mostrarResultado(false, nombreCompleto, "Este estudiante tiene pagos pendientes.");
        }
      });
    }
  } catch (error) { window.showToast("Error al conectar con la base de datos", "error"); } 
  finally { btn.innerText = "Verificar"; btn.disabled = false; document.getElementById('inputBusquedaCedula').value = ''; }
};

window.mostrarResultado = function(accesoPermitido, nombreAlumno, motivo = "") {
  const icono = document.getElementById('resultadoIcono');
  const titulo = document.getElementById('resultadoTitulo');
  const desc = document.getElementById('resultadoDesc');

  if(accesoPermitido) {
    icono.innerHTML = '<i class="fa-solid fa-circle-check text-[5rem] text-emerald-500 shadow-emerald-500/50 drop-shadow-2xl"></i>';
    titulo.innerText = "ACCESO PERMITIDO";
    titulo.className = "text-3xl font-black text-emerald-500 mb-2 mt-4 tracking-wider";
    desc.innerHTML = `<span class="font-bold text-white text-xl uppercase">${nombreAlumno}</span><br><span class="text-emerald-400/80 mt-2 block">Puede ingresar a las instalaciones.</span>`;
  } else {
    icono.innerHTML = '<i class="fa-solid fa-circle-xmark text-[5rem] text-red-500 shadow-red-500/50 drop-shadow-2xl"></i>';
    titulo.innerText = "ACCESO DENEGADO";
    titulo.className = "text-3xl font-black text-red-500 mb-2 mt-4 tracking-wider";
    desc.innerHTML = `<span class="font-bold text-white text-xl uppercase">${nombreAlumno}</span><br><span class="text-red-400/80 mt-2 block font-medium">${motivo}</span>`;
  }
  window.openModal('modalResultado');
}

// === FUNCIONES DE ESTUDIANTES ===
window.guardarEstudiante = async function() {
  const nombre = document.getElementById('estNombre').value.trim();
  const apellidos = document.getElementById('estApellidos').value.trim();
  const cedula = document.getElementById('estCedula').value.trim();
  const estado = document.getElementById('estEstado').value;
  const btn = document.getElementById('btnGuardarEst');

  if(!nombre || !apellidos || !cedula) return window.showToast("Llena todos los campos", "error");
  btn.innerText = "Guardando..."; btn.disabled = true;

  try {
    const uuidSecreto = window.generarUUID();
    await addDoc(collection(db, "estudiantes"), {
      nombre: nombre, apellidos: apellidos, cedula: cedula, estado_pago: estado, qr_uuid: uuidSecreto, fecha_registro: serverTimestamp()
    });
    window.showToast("Estudiante agregado", "success");
    window.closeModal('modalEstudiante');
    document.getElementById('estNombre').value = ''; document.getElementById('estApellidos').value = ''; document.getElementById('estCedula').value = '';
    window.cargarEstudiantes();
  } catch (error) { window.showToast("Error", "error"); } 
  finally { btn.innerText = "Guardar"; btn.disabled = false; }
};

window.cargarEstudiantes = async function() {
  const tbody = document.getElementById('tablaEstudiantesBody');
  try {
    const querySnapshot = await getDocs(collection(db, "estudiantes"));
    tbody.innerHTML = '';
    if (querySnapshot.empty) return tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-zinc-500">No hay estudiantes.</td></tr>';
    querySnapshot.forEach((doc) => {
      const est = doc.data();
      let badgeEstado = est.estado_pago === 'Pagado' ? '<span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">Pagado</span>' : '<span class="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-bold border border-red-500/20">Pendiente</span>';
      
      tbody.innerHTML += `
        <tr class="hover:bg-zinc-800/30 transition group">
          <td class="px-6 py-4 text-white">${est.cedula}</td>
          <td class="px-6 py-4 font-medium text-white">${est.nombre} ${est.apellidos}</td>
          <td class="px-6 py-4 text-center">${badgeEstado}</td>
          <td class="px-6 py-4 text-center">
            <button onclick="window.verQR('${est.nombre} ${est.apellidos}', '${est.qr_uuid}')" class="text-blue-400 hover:text-blue-300 transition mr-4" title="Ver Código QR">
              <i class="fa-solid fa-qrcode text-lg"></i>
            </button>
            <button onclick="window.eliminarEstudiante('${doc.id}')" class="text-zinc-500 hover:text-red-500 transition" title="Eliminar Alumno">
              <i class="fa-solid fa-trash text-lg"></i>
            </button>
          </td>
        </tr>`;
    });
  } catch (error) {}
}

window.eliminarEstudiante = function(docId) {
  window.pedirConfirmacion("¿Eliminar a este estudiante definitivamente?", async () => {
    try { 
      await deleteDoc(doc(db, "estudiantes", docId)); 
      window.showToast("Estudiante eliminado", "success"); 
      window.cargarEstudiantes(); 
    } 
    catch (error) { window.showToast("Error", "error"); }
  });
};

// === FUNCIONES PARA GENERAR Y DESCARGAR QR ===
window.verQR = function(nombreCompleto, uuid) {
  document.getElementById('qrNombreAlumno').innerText = nombreCompleto;
  const qrContenedor = document.getElementById('qrContenedor');
  
  qrContenedor.innerHTML = ""; 
  
  new QRCode(qrContenedor, {
    text: uuid,
    width: 200,
    height: 200,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  window.openModal('modalVerQR');
}

window.descargarQR = function() {
  const qrContenedor = document.getElementById('qrContenedor');
  const canvas = qrContenedor.querySelector('canvas');
  const img = qrContenedor.querySelector('img');
  
  const nombre = document.getElementById('qrNombreAlumno').innerText.replace(/\s+/g, '_');
  const enlace = document.createElement('a');
  enlace.download = `QR_Acceso_${nombre}.png`;

  if (canvas) {
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
  } else if (img && img.src) {
    enlace.href = img.src;
    enlace.click();
  } else {
    window.showToast("Error al descargar el QR", "error");
  }
}

// === FUNCIONES DE PERSONAL (SUPER ADMIN) ===
window.guardarUsuario = async function() {
  const nombre = document.getElementById('usrNombre').value.trim();
  const usuario = document.getElementById('usrUsuario').value.trim().toLowerCase();
  const password = document.getElementById('usrPassword').value;
  const rol = document.getElementById('usrRol').value;
  const turno = document.getElementById('usrTurno').value;
  const btn = document.getElementById('btnGuardarUsr');

  if(!nombre || !usuario || !password) return window.showToast("Llena todos los campos", "error");
  btn.innerText = "Guardando..."; btn.disabled = true;

  try {
    const nuevoUsuario = { nombre: nombre, usuario: usuario, password: password, rol: rol, fecha_registro: serverTimestamp() };
    if (rol === "guardia") { nuevoUsuario.turno = turno; }
    await addDoc(collection(db, "usuarios"), nuevoUsuario);
    window.showToast("Personal agregado exitosamente", "success");
    window.closeModal('modalUsuario');
    document.getElementById('usrNombre').value = ''; document.getElementById('usrUsuario').value = ''; document.getElementById('usrPassword').value = '';
    window.cargarUsuarios(); 
  } catch (error) { window.showToast("Error al crear usuario", "error"); } 
  finally { btn.innerText = "Crear Cuenta"; btn.disabled = false; }
};

window.cargarUsuarios = async function() {
  const tbody = document.getElementById('tablaUsuariosBody');
  try {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    tbody.innerHTML = '';
    if (querySnapshot.empty) return tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-zinc-500">No hay personal registrado.</td></tr>';
    
    querySnapshot.forEach((doc) => {
      const usr = doc.data();
      let badgeColor = "", rolText = "";
      if(usr.rol === 'super_admin') { badgeColor = "bg-purple-900/50 text-purple-400 border border-purple-800"; rolText = "Súper Admin"; }
      if(usr.rol === 'admin') { badgeColor = "bg-blue-900/50 text-blue-400 border border-blue-800"; rolText = "Admin"; }
      if(usr.rol === 'guardia') { badgeColor = "bg-emerald-900/50 text-emerald-400 border border-emerald-800"; rolText = "Guardia"; }

      tbody.innerHTML += `
        <tr class="hover:bg-zinc-800/30 transition group">
          <td class="px-6 py-4 font-medium text-white">${usr.nombre} ${usr.turno ? `<span class="text-xs text-zinc-500 block">Turno: ${usr.turno}</span>` : ''}</td>
          <td class="px-6 py-4 text-zinc-400">@${usr.usuario}</td>
          <td class="px-6 py-4 text-center"><span class="px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}">${rolText}</span></td>
          <td class="px-6 py-4 text-center">
            <button onclick="window.eliminarUsuario('${doc.id}')" class="text-zinc-500 hover:text-red-500 transition"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`;
    });
  } catch (error) {}
}

window.eliminarUsuario = function(docId) {
  window.pedirConfirmacion("¿Revocar el acceso a este usuario del sistema?", async () => {
    try { 
      await deleteDoc(doc(db, "usuarios", docId)); 
      window.showToast("Usuario eliminado", "success"); 
      window.cargarUsuarios(); 
    } 
    catch (error) { window.showToast("Error al eliminar", "error"); }
  });
};

// ==========================================
// 4. LÓGICA DEL ESCÁNER QR
// ==========================================

window.escanerQR = null;

window.abrirEscanerQR = function() {
  window.openModal('modalEscanerQR');
  
  window.escanerQR = new Html5Qrcode("lectorQR");
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  
  window.escanerQR.start(
    { facingMode: "environment" }, 
    config,
    window.onEscaneoExitoso,
    window.onEscaneoFallido
  ).catch((error) => {
    window.showToast("No se pudo acceder a la cámara o no hay permisos", "error");
  });
};

window.cerrarEscanerQR = function() {
  if (window.escanerQR) {
    window.escanerQR.stop().then(() => {
      window.escanerQR.clear();
    }).catch(err => console.log("Error apagando cámara", err));
  }
  window.closeModal('modalEscanerQR');
};

window.onEscaneoFallido = function(error) {};

window.onEscaneoExitoso = async function(uuidDecodificado) {
  if (window.escanerQR) {
    await window.escanerQR.stop();
    window.escanerQR.clear();
  }
  window.closeModal('modalEscanerQR');
  
  try {
    const q = query(collection(db, "estudiantes"), where("qr_uuid", "==", uuidDecodificado));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      window.showToast("Código QR Inválido o Estudiante no encontrado", "error");
    } else {
      querySnapshot.forEach(async (documento) => {
        const est = documento.data();
        const nombreCompleto = `${est.nombre} ${est.apellidos}`;

        if(est.estado_pago === "Pagado") {
          window.mostrarResultado(true, nombreCompleto);
          await addDoc(collection(db, "accesos_registrados"), {
            nombre_estudiante: nombreCompleto, cedula: est.cedula, guardia_responsable: window.guardiaConectado,
            fecha_hora: serverTimestamp(), estado_ingreso: "Permitido", metodo: "QR"
          });
        } else {
          window.mostrarResultado(false, nombreCompleto, "Este estudiante tiene pagos pendientes.");
        }
      });
    }
  } catch (error) { 
    window.showToast("Error al verificar el QR", "error"); 
  }
};