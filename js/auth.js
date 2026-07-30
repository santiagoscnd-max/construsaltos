/* ==========================================
   LÓGICA DE AUTENTICACIÓN DE USUARIOS (auth.js)
   ========================================== */

import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// 1. Función para Registrar Usuario
window.registrarUsuario = function(event) {
    event.preventDefault();
    const email = document.getElementById('emailRegistro').value;
    const password = document.getElementById('passwordRegistro').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("¡Cuenta creada exitosamente! Bienvenido a ConstruSaltos S.A.");
            window.location.href = "catalogo.html"; // Redirigir al catálogo al registrarse
        })
        .catch((error) => {
            alert("Error al registrarse: " + error.message);
        });
};

// 2. Función para Iniciar Sesión
window.iniciarSesion = function(event) {
    event.preventDefault();
    const email = document.getElementById('emailLogin').value;
    const password = document.getElementById('passwordLogin').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("¡Inicio de sesión exitoso!");
            window.location.href = "catalogo.html"; // Redirigir al catálogo al entrar
        })
        .catch((error) => {
            alert("Error al iniciar sesión: Verifique sus credenciales.");
        });
};

// 3. Opcional: Detectar si hay un usuario conectado para cambiar la interfaz si se desea
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuario activo:", user.email);
    } else {
        console.log("No hay ningún usuario con sesión activa.");
    }
});