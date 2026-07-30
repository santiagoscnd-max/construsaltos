/* ==========================================
   CONTROL DE SESIÓN PARA RESERVAS (reserva.js)
   ========================================== */

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

let usuarioActual = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioActual = user;
    } else {
        usuarioActual = null;
    }
});