/* ==========================================
   LÓGICA DEL MÓDULO CRM DE CLIENTES (clientes.js)
   ========================================== */

import { auth, db } from "../js/firebase-config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const CORREOS_ADMINISTRADORES = [
    "admin@construsaltos.com",
    "santiagosc.nd@gmail.com"
];

// Validación de seguridad de rol admin
onAuthStateChanged(auth, (user) => {
    if (!user || !CORREOS_ADMINISTRADORES.includes(user.email)) {
        alert("Acceso denegado. Se requieren privilegios de administrador.");
        window.location.href = "login-admin.html";
    } else {
        cargarClientesCRM();
    }
});

// Cargar listado de clientes desde Firestore (Colección 'usuarios' o 'perfiles')
async function cargarClientesCRM() {
    const tbody = document.getElementById('tablaClientesBody');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem;">Sincronizando base de datos de clientes...</td></tr>`;

    try {
        // Consultamos la colección donde se guardan los perfiles de usuario (ajustada a 'perfiles' o 'usuarios' según tu estructura)
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        
        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">No hay perfiles de clientes registrados todavía.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        querySnapshot.forEach((documento) => {
            const data = documento.data();

            // Unimos nombres y apellidos que vienen de perfil.js
            const nombreCompleto = `${data.nombres || ''} ${data.apellidos || ''}`.trim() || 'Usuario sin nombre';

            const fila = `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold; color: var(--secondary-color);">
                        ${nombreCompleto}
                    </td>
                    <td style="padding: 12px; color: #4b5563;">
                        ${data.email || 'No registrado'}
                    </td>
                    <td style="padding: 12px;">
                        ${data.telefono || 'No especificado'}
                    </td>
                    <td style="padding: 12px;">
                        ${data.ruc || 'N/A'}
                    </td>
                </tr>
            `;
            tbody.innerHTML += fila;
        });

    } catch (error) {
        console.error("Error al cargar el CRM de clientes:", error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: red;">Error al conectar con la base de datos de clientes.</td></tr>`;
    }
}

window.cerrarSesionAdmin = function() {
    signOut(auth).then(() => {
        window.location.href = "../login.html";
    }).catch((error) => {
        console.error("Error al cerrar sesión", error);
    });
};