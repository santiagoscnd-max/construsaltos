/* ==========================================
   LÓGICA DEL PANEL PRINCIPAL ADMIN (admin.js)
   ========================================== */

import { auth, db } from "../js/firebase-config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
        cargarDashboardAdmin();
    }
});

// Cargar métricas y listado de reservas
async function cargarDashboardAdmin() {
    const tbody = document.getElementById('tablaReservasAdminBody');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">Sincronizando panel de control...</td></tr>`;

    try {
        const [snapshotReservas, snapshotClientes] = await Promise.all([
            getDocs(collection(db, "reservas")),
            getDocs(collection(db, "usuarios"))
        ]);

        // 1. Actualizar KPIs
        let totalIngresos = 0;
        let totalReservasCount = snapshotReservas.size;
        let totalClientesCount = snapshotClientes.size;

        snapshotReservas.forEach(docRes => {
            const data = docRes.data();
            if (data.estado === "Pagado y Confirmado" || data.estado === "Pendiente de Pago") {
                totalIngresos += (data.costoTotal || 0);
            }
        });

        document.getElementById('kpiTotalReservas').textContent = totalReservasCount;
        document.getElementById('kpiIngresos').textContent = `$${totalIngresos.toFixed(2)}`;
        document.getElementById('kpiClientes').textContent = totalClientesCount;

        if (snapshotReservas.empty) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">No hay solicitudes de alquiler registradas.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        snapshotReservas.forEach((documento) => {
            const data = documento.data();
            const idDoc = documento.id;
            let badgeColor = "#f59e0b"; // Pendiente
            if (data.estado === "Pagado y Confirmado") badgeColor = "#10b981";
            if (data.estado === "Finalizado") badgeColor = "#6b7280"; // Gris para cerrado

            const fila = `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold; color: var(--secondary-color);">
                        ${data.usuarioEmail || 'Cliente web'}
                    </td>
                    <td style="padding: 12px;">
                        <strong>${data.maquinaDetalle || 'Equipo'}</strong><br>
                        <span style="font-size: 0.8rem; color: #6b7280;">Unidades: ${data.cantidadUnidades || 1}</span>
                    </td>
                    <td style="padding: 12px; font-size: 0.85rem; color: #4b5563;">
                        ${data.zona || 'N/A'} - ${data.direccionObra || ''}
                    </td>
                    <td style="padding: 12px; font-weight: bold;">
                        $${(data.costoTotal || 0).toFixed(2)} <br><span style="font-size: 0.75rem; font-weight: normal; color: #6b7280;">(${data.dias || 1} días)</span>
                    </td>
                    <td style="padding: 12px;">
                        <span style="background: ${badgeColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
                            ${data.estado || 'Pendiente de Pago'}
                        </span>
                    </td>
                    <td style="padding: 12px; display: flex; gap: 6px; align-items: center;">
                        <button onclick="cambiarEstadoReserva('${idDoc}', 'Pagado y Confirmado')" style="background: #10b981; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Confirmar</button>
                        <button onclick="cambiarEstadoReserva('${idDoc}', 'Finalizado')" style="background: #3b82f6; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;" title="Devolver maquinaria y liberar stock">Finalizar</button>
                        <button onclick="eliminarReservaAdmin('${idDoc}')" style="background: #ef4444; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Eliminar</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += fila;
        });

    } catch (error) {
        console.error("Error al cargar el dashboard:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: red;">Error al conectar con la base de datos de reservas.</td></tr>`;
    }
}

// Cambiar estado de la reserva
window.cambiarEstadoReserva = async function(idDoc, nuevoEstado) {
    try {
        const reservaRef = doc(db, "reservas", idDoc);
        await updateDoc(reservaRef, { estado: nuevoEstado });
        alert("¡Estado de la reserva actualizado exitosamente!");
        cargarDashboardAdmin();
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        alert("No se pudo actualizar el estado de la reserva.");
    }
};

// Eliminar reserva
window.eliminarReservaAdmin = async function(idDoc) {
    const confirmar = confirm("¿Está seguro de eliminar esta solicitud del sistema?");
    if (!confirmar) return;

    try {
        await deleteDoc(doc(db, "reservas", idDoc));
        alert("Solicitud eliminada correctamente.");
        cargarDashboardAdmin();
    } catch (error) {
        console.error("Error al eliminar reserva:", error);
        alert("No se pudo eliminar el registro.");
    }
};

window.cerrarSesionAdmin = function() {
    signOut(auth).then(() => {
        window.location.href = "../login.html";
    }).catch((error) => {
        console.error("Error al cerrar sesión", error);
    });
};