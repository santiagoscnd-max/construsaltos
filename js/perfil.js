/* ==========================================
   LÓGICA JAVASCRIPT DE CONFIGURACIÓN DE PERFIL (perfil.js)
   ========================================== */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, updatePassword, deleteUser } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let usuarioActivoGlobal = null;

// Vigilar sesión activa
onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioActivoGlobal = user;
        await cargarDatosPerfil(user.uid);
    } else {
        alert("Debe iniciar sesión para ver su perfil.");
        window.location.href = "login.html";
    }
});

// Cargar información del usuario desde Firestore
async function cargarDatosPerfil(uid) {
    try {
        const docRef = doc(db, "usuarios", uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('inputNombres').value = data.nombres || '';
            document.getElementById('inputApellidos').value = data.apellidos || '';
            document.getElementById('inputRuc').value = data.ruc || '';
            document.getElementById('inputTelefono').value = data.telefono || '';
            document.getElementById('inputDireccion').value = data.direccion || '';
        }
    } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
    }
}

// Guardar o actualizar datos personales y fiscales
window.guardarDatosPerfil = async function(event) {
    event.preventDefault();
    if (!usuarioActivoGlobal) return;

    const nombres = document.getElementById('inputNombres').value;
    const apellidos = document.getElementById('inputApellidos').value;
    const ruc = document.getElementById('inputRuc').value;
    const telefono = document.getElementById('inputTelefono').value;
    const direccion = document.getElementById('inputDireccion').value;

    try {
        await setDoc(doc(db, "usuarios", usuarioActivoGlobal.uid), {
            email: usuarioActivoGlobal.email,
            nombres: nombres,
            apellidos: apellidos,
            ruc: ruc,
            telefono: telefono,
            direccion: direccion,
            actualizadoEn: new Date().toISOString()
        }, { merge: true });

        alert("¡Datos de perfil guardados exitosamente!");
        window.location.reload();
    } catch (error) {
        console.error("Error al guardar perfil:", error);
        alert("Hubo un error al guardar los datos en la base de datos.");
    }
};

// Cambiar contraseña del usuario
window.cambiarContrasenaUsuario = async function(event) {
    event.preventDefault();
    if (!usuarioActivoGlobal) return;

    const nuevaPassword = document.getElementById('nuevaPassword').value;

    try {
        await updatePassword(usuarioActivoGlobal, nuevaPassword);
        alert("¡Contraseña actualizada con éxito!");
        document.getElementById('nuevaPassword').value = "";
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        alert("Error de seguridad: Por favor, cierre sesión, vuelva a iniciar e intente cambiar la contraseña de nuevo.");
    }
};

// Eliminar cuenta permanentemente
window.eliminarCuentaUsuario = async function() {
    if (!usuarioActivoGlobal) return;

    const confirmacion = confirm("¿Está seguro de eliminar su cuenta de forma permanente? Esta acción no se puede deshacer.");
    if (!confirmacion) return;

    try {
        const uid = usuarioActivoGlobal.uid;
        await deleteDoc(doc(db, "usuarios", uid));
        await deleteUser(usuarioActivoGlobal);

        alert("Su cuenta ha sido eliminada permanentemente.");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        alert("Por seguridad, Firebase requiere una sesión reciente para eliminar la cuenta. Cierre sesión, vuelva a entrar e inténtelo otra vez.");
    }
};