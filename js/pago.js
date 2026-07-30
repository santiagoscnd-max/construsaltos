/* ==========================================
   LÓGICA DE PASARELA DE PAGO PROFESIONAL (pago.js)
   ========================================== */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let usuarioActual = null;
let reservaActivaId = null;
let costoTotalReserva = 0;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioActual = user;
        await cargarResumenOrden(user.uid);
    } else {
        alert("Debe iniciar sesión para procesar un pago.");
        window.location.href = "login.html";
    }
});

// Cargar los datos de la reserva pendiente para mostrarlos como un "carrito" de compra
async function cargarResumenOrden(usuarioUid) {
    const contenedorResumen = document.getElementById('resumenDetallePago');
    
    try {
        const q = query(
            collection(db, "reservas"), 
            where("usuarioUid", "==", usuarioUid),
            where("estado", "==", "Pendiente de Pago")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            contenedorResumen.innerHTML = `<p style="color: #ef4444;">No hay ninguna orden pendiente de pago en este momento.</p>`;
            return;
        }

        querySnapshot.forEach((documento) => {
            reservaActivaId = documento.id;
            const data = documento.data();
            costoTotalReserva = Number(data.costoTotal) || 0;

            contenedorResumen.innerHTML = `
                <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong style="font-size: 1.05rem; color: var(--secondary-color);">${data.maquinaDetalle || 'Maquinaria Pesada'}</strong>
                </div>
                <p><strong>Unidades solicitadas:</strong> ${data.cantidadUnidades || 1}</p>
                <p><strong>Duración del contrato:</strong> ${data.dias || 1} día(s)</p>
                <p><strong>Zona de entrega:</strong> ${data.zona || 'N/A'}</p>
                <p><strong>Dirección / Obra:</strong> ${data.direccionObra || 'N/A'}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: bold; color: var(--secondary-color);">
                    <span>Total a Pagar:</span>
                    <span style="color: var(--primary-color);">$${costoTotalReserva.toFixed(2)}</span>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error al cargar orden:", error);
        contenedorResumen.innerHTML = `<p style="color: red;">Error al sincronizar el resumen de la orden.</p>`;
    }
}

// Alternar entre campos de tarjeta o transferencia
window.cambiarMetodoPago = function() {
    const metodo = document.getElementById('metodoPago').value;
    const secTarjeta = document.getElementById('seccionTarjeta');
    const secTransferencia = document.getElementById('seccionTransferencia');

    if (metodo === 'tarjeta') {
        secTarjeta.style.display = 'block';
        secTransferencia.style.display = 'none';
    } else {
        secTarjeta.style.display = 'none';
        secTransferencia.style.display = 'block';
    }
};

// Procesar el pago de forma realista
window.procesarPagoRealista = async function(event) {
    event.preventDefault();
    if (!usuarioActual || !reservaActivaId) {
        alert("No se encontró una orden activa para procesar.");
        return;
    }

    const metodo = document.getElementById('metodoPago').value;

    try {
        const reservaRef = doc(db, "reservas", reservaActivaId);
        await updateDoc(reservaRef, {
            estado: "Pagado y Confirmado",
            metodoPagoUtilizado: metodo,
            fechaPago: new Date().toISOString()
        });

        alert(`¡Pago autorizado con éxito!\n\nSe ha procesado el cobro de $${costoTotalReserva.toFixed(2)}.\nTu contrato de alquiler ha quedado confirmado.`);
        window.location.href = "alquileres.html";

    } catch (error) {
        console.error("Error al procesar el pago:", error);
        alert("Ocurrió un error al autorizar la transacción con la entidad bancaria.");
    }
};