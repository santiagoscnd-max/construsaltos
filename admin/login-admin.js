/* ==========================================
   LÓGICA DE LOGIN ADMINISTRATIVO (login-admin.js)
   ========================================== */

import { auth } from "../js/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Lista de correos electrónicos autorizados para acceder al panel administrativo
const CORREOS_ADMINISTRADORES = [
    "admin@construsaltos.com",
    "santiagosc.nd@gmail.com" // <-- Correo autorizado
];

window.iniciarSesionAdmin = function(event) {
    event.preventDefault();
    const email = document.getElementById('emailAdmin').value;
    const password = document.getElementById('passwordAdmin').value;

    if (!CORREOS_ADMINISTRADORES.includes(email)) {
        alert("Error: Este correo no está autorizado para acceder al panel de administración.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("¡Bienvenido al Panel Administrativo!");
            window.location.href = "index.html"; // Redirigir al panel principal de admin
        })
        .catch((error) => {
            alert("Error al iniciar sesión: Verifique sus credenciales.");
        });
};