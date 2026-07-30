/* ==========================================
   CONFIGURACIÓN CENTRALIZADA DE FIREBASE (firebase-config.js)
   ========================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBODpwMjFoZefosl4c30584WLOSMY4D4ok",
  authDomain: "construsaltos-db.firebaseapp.com",
  projectId: "construsaltos-db",
  storageBucket: "construsaltos-db.firebasestorage.app",
  messagingSenderId: "885068423403",
  appId: "1:885068423403:web:161cded40d7a38a26adeae"
};

// Inicializar y exportar instancias globales para todo el proyecto
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("¡Firebase conectado exitosamente a ConstruSaltos S.A.!");