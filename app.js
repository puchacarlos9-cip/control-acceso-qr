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
window.rolSeleccionado = "guardia";

// ==========================================
// 2. FUNCIONES DE INTERFAZ Y NAVEGACIÓN
// ==========================================

window.showToast = function(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');
  
  if(!toast) return;

  icon.innerText = type === 'success' ? '✅' : '⚠️';
  msg.innerText = message;
  
  toast.classList.remove('translate-y-[-150%]');
  toast.classList.add('translate-y-0');

  setTimeout(() => {
    toast.classList.remove('translate-y-0');
    toast.classList.add('translate-y-[-150%]');
  }, 3000);
};

window.seleccionarRol = function(rol) {
  window.rolSeleccionado = rol;
  document.getElementById('roleScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');

  const title = document.getElementById('loginTitle');
  const grupoPass = document.getElementById('grupoPassword');

  if(rol === 'guardia') {
    title.innerText = "Acceso Guardia";
    grupoPass.classList.remove('hidden');
  } else if(rol === 'estudiante') {
    title.innerText = "Consulta Estudiante";
    grupoPass.classList.add('hidden');
  } else {
    title.innerText = "Panel Administración";
    grupoPass.classList.remove('hidden');
  }
};

window.volverARoles = function() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('roleScreen').classList.remove('hidden');
};

window.openModal = function(id) {
  const modal = document.getElementById(id);
  if(modal) {
    modal.classList.remove('hidden');
    if(id === 'modalBuscarCedula') {
      const input = document.getElementById('inputCedulaBuscar');
      if(input) setTimeout(() => input.focus(), 100);
    }
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if(modal) modal.classList.add('hidden');
};

window.cerrarSesion = function() {
  location.reload();
};

// ==========================================
// 3. AUTENTICACIÓN Y LOGIN
// ==========================================

window.procesarLogin = async function(event) {
  if(event) event.preventDefault();
  
  const userInput = document.getElementById('inputUsuario').value.trim();
  const passInput = document.getElementById('inputPassword').value;

  if(!userInput) return window.showToast("Ingrese su identificación", "error");

  try {
    if(window.rolSeleccionado === 'guardia') {
      const q = query(collection(db, "usuarios"), where("usuario", "==", userInput.toLowerCase()), where("password", "==", passInput));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        window.showToast("Credenciales de guardia incorrectas", "error");
      } else {
        querySnapshot.forEach((doc) => {
          const usr = doc.data();
          window.guardiaConectado = usr.nombre || userInput;
          document.getElementById('loginScreen').classList.add('hidden');
          document.getElementById('guardScreen').classList.remove('hidden');
          
          const nameDisplay = document.getElementById('guardNameDisplay');
          if(nameDisplay) nameDisplay.innerText = window.guardiaConectado;
        });
      }
    } else if(window.rolSeleccionado === 'estudiante') {
      const q = query(collection(db, "estudiantes"), where("cedula", "==", userInput));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        window.showToast("Estudiante no encontrado", "error");
      } else {
        querySnapshot.forEach((doc) => {
          const est = doc.data();
          document.getElementById('loginScreen').classList.add('hidden');
          document.getElementById('studentScreen').classList.remove('hidden');
          document.getElementById('studentNameDisplay').innerText = `${est.nombre} ${est.apellidos}`;
          document.getElementById('studentCedulaDisplay').innerText = `Cédula: ${est.cedula}`;
          
          // Generar QR de credencial
          const qrContenedor = document.getElementById('qrcode');
          qrContenedor.innerHTML = "";
          new QRCode(qrContenedor, {
            text: est.qr_uuid || est.cedula,
            width: 180,
            height: 180
          });
        });
      }
    } else if(window.rolSeleccionado === 'admin') {
      const q = query(collection(db, "usuarios"), where("usuario", "==", userInput.toLowerCase()), where("password", "==", passInput));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        window.showToast("Credenciales administrativas incorrectas", "error");
      } else {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('adminScreen').classList.remove('hidden');
        window.cargarAccesosAdmin();
      }
    }
  } catch (error) {
    console.error(error);
    window.showToast("Error de conexión con la base de datos", "error");
  }
};

// ==========================================
// 4. BÚSQUEDA MANUAL POR CÉDULA
// ==========================================

window.buscarPorCedula = async function(event) {
  if(event) event.preventDefault();
  
  const cedulaInput = document.getElementById('inputCedulaBuscar');
  const cedula = cedulaInput ? cedulaInput.value.trim() : "";
  
  if(!cedula) return window.showToast("Ingrese una cédula válida", "error");

  try {
    const q = query(collection(db, "estudiantes"), where("cedula", "==", cedula));
    const querySnapshot = await getDocs(q);

    window.closeModal('modalBuscarCedula');
    if(cedulaInput) cedulaInput.value = '';

    if (querySnapshot.empty) {
      window.mostrarResultado(false, "No Registrado", "El estudiante no figura en el sistema.");
    } else {
      querySnapshot.forEach(async (documento) => {
        const est = documento.data();
        const nombreCompleto = `${est.nombre} ${est.apellidos}`;

        if(est.estado_pago === "Pagado") {
          window.mostrarResultado(true, nombreCompleto, "Estudiante al día. Puede ingresar.");
          await addDoc(collection(db, "accesos_registrados"), {
            nombre_estudiante: nombreCompleto,
            cedula: est.cedula,
            guardia_responsable: window.guardiaConectado,
            fecha_hora: serverTimestamp(),
            estado_ingreso: "Permitido",
            metodo: "Cédula"
          });
        } else {
          window.mostrarResultado(false, nombreCompleto, "Pensiones pendientes de pago.");
        }
      });
    }
  } catch (error) {
    window.showToast("Error al verificar la cédula", "error");
  }
};

// ==========================================
// 5. ESCÁNER QR
// ==========================================

window.escanerQR = null;

window.abrirEscanerQR = function() {
  window.openModal('modalEscanerQR');
  
  // Margen de tiempo para asegurar renderizado en pantallas móviles
  setTimeout(() => {
    const contenedor = document.getElementById('lectorQR');
    if (!contenedor) return;
    
    contenedor.innerHTML = "";

    if (window.escanerQR) {
      try { window.escanerQR.clear(); } catch(e) {}
    }

    window.escanerQR = new Html5Qrcode("lectorQR");
    const config = { fps: 10, qrbox: { width: 200, height: 200 } };
    
    window.escanerQR.start(
      { facingMode: "environment" }, 
      config,
      window.onEscaneoExitoso,
      window.onEscaneoFallido
    ).catch((error) => {
      console.error("Error al activar cámara:", error);
      window.showToast("Permiso de cámara denegado o no disponible", "error");
    });
  }, 300);
};

window.cerrarEscanerQR = function() {
  if (window.escanerQR) {
    window.escanerQR.stop().then(() => {
      window.escanerQR.clear();
      window.closeModal('modalEscanerQR');
    }).catch(() => {
      window.closeModal('modalEscanerQR');
    });
  } else {
    window.closeModal('modalEscanerQR');
  }
};

window.onEscaneoFallido = function(error) {};

window.onEscaneoExitoso = async function(uuidDecodificado) {
  window.cerrarEscanerQR();
  
  try {
    const q = query(collection(db, "estudiantes"), where("qr_uuid", "==", uuidDecodificado));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      window.mostrarResultado(false, "Código Inválido", "El código QR no coincide con ningún estudiante.");
    } else {
      querySnapshot.forEach(async (documento) => {
        const est = documento.data();
        const nombreCompleto = `${est.nombre} ${est.apellidos}`;

        if(est.estado_pago === "Pagado") {
          window.mostrarResultado(true, nombreCompleto, "Acceso verificado correctamente.");
          await addDoc(collection(db, "accesos_registrados"), {
            nombre_estudiante: nombreCompleto,
            cedula: est.cedula,
            guardia_responsable: window.guardiaConectado,
            fecha_hora: serverTimestamp(),
            estado_ingreso: "Permitido",
            metodo: "QR"
          });
        } else {
          window.mostrarResultado(false, nombreCompleto, "El estudiante tiene valores pendientes.");
        }
      });
    }
  } catch (error) { 
    window.showToast("Error al procesar la lectura QR", "error"); 
  }
};

// ==========================================
// 6. VENTANA DE RESULTADOS Y REPORTES
// ==========================================

window.mostrarResultado = function(permitido, nombre, mensaje) {
  const icono = document.getElementById('resultadoIcono');
  const titulo = document.getElementById('resultadoTitulo');
  const nombreEl = document.getElementById('resultadoNombre');
  const msgEl = document.getElementById('resultadoMensaje');

  if(permitido) {
    icono.className = "w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
    icono.innerText = "✓";
    titulo.className = "text-2xl font-black text-emerald-400";
    titulo.innerText = "ACCESO PERMITIDO";
  } else {
    icono.className = "w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto bg-rose-500/20 text-rose-400 border border-rose-500/40";
    icono.innerText = "✕";
    titulo.className = "text-2xl font-black text-rose-500";
    titulo.innerText = "ACCESO DENEGADO";
  }

  nombreEl.innerText = nombre;
  msgEl.innerText = mensaje;
  window.openModal('modalResultado');
};

window.cargarAccesosAdmin = async function() {
  const tbody = document.getElementById('tablaAccesos');
  if(!tbody) return;

  try {
    const querySnapshot = await getDocs(collection(db, "accesos_registrados"));
    tbody.innerHTML = '';
    
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">No hay registros de ingresos hoy.</td></tr>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const reg = doc.data();
      const fecha = reg.fecha_hora ? new Date(reg.fecha_hora.seconds * 1000).toLocaleString() : 'Reciente';
      const badge = reg.estado_ingreso === 'Permitido' 
        ? '<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Permitido</span>'
        : '<span class="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">Denegado</span>';

      tbody.innerHTML += `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="p-3 font-semibold text-white">${reg.nombre_estudiante}</td>
          <td class="p-3 text-slate-400">${reg.cedula}</td>
          <td class="p-3 text-slate-300">${reg.metodo}</td>
          <td class="p-3">${badge}</td>
          <td class="p-3 text-slate-400">${fecha}</td>
        </tr>`;
    });
  } catch (e) {
    console.error(e);
  }
};