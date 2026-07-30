/* ==========================================
   LÓGICA DE VALIDACIÓN DE CONTRATO (contrato.js)
   ========================================== */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let usuarioActual = null;
let reservaActivaId = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioActual = user;
        await cargarDatosClienteYReserva(user.uid, user.email);
    } else {
        alert("Debe iniciar sesión para validar su contrato.");
        window.location.href = "login.html";
    }
});

async function cargarDatosClienteYReserva(usuarioUid, usuarioEmail) {
    const contenedorResumen = document.getElementById('resumenContrato');
    const txtNombre = document.getElementById('txtNombreCliente');
    const txtIdentificacion = document.getElementById('txtIdentificacionCliente');
    const txtFirma = document.getElementById('txtFirmaCliente');
    const txtCedulaFirma = document.getElementById('txtCedulaFirma');

    try {
        // 1. Buscar información del perfil del cliente en la colección 'usuarios'
        // Intentamos buscar por UID del documento o por campo email si varía tu estructura
        let nombreClienteFinal = usuarioEmail;
        let identificacionFinal = "No registrada";

        try {
            const usuarioDocRef = doc(db, "usuarios", usuarioUid);
            const usuarioDocSnap = await getDoc(usuarioDocRef);
            
            if (usuarioDocSnap.exists()) {
                const uData = usuarioDocSnap.data();
                const nombres = `${uData.nombres || ''} ${uData.apellidos || ''}`.trim();
                if (nombres) nombreClienteFinal = nombres;
                if (uData.ruc || uData.cedula) identificacionFinal = uData.ruc || uData.cedula;
            } else {
                // Si el documento usa un ID aleatorio, buscamos por campo email o uid
                const qUser = query(collection(db, "usuarios"), where("email", "==", usuarioEmail));
                const snapUser = await getDocs(qUser);
                snapUser.forEach(docU => {
                    const uData = docU.data();
                    const nombres = `${uData.nombres || ''} ${uData.apellidos || ''}`.trim();
                    if (nombres) nombreClienteFinal = nombres;
                    if (uData.ruc || uData.cedula) identificacionFinal = uData.ruc || uData.cedula;
                });
            }
        } catch (err) {
            console.warn("No se pudo obtener el perfil detallado del usuario, usando correo.", err);
        }

        // Inyectar datos del cliente en el contrato
        txtNombre.textContent = nombreClienteFinal;
        txtIdentificacion.textContent = identificacionFinal;
        txtFirma.textContent = nombreClienteFinal;
        txtCedulaFirma.textContent = `C.I. / RUC: ${identificacionFinal}`;

        // 2. Buscar la reserva pendiente del usuario
        const qReserva = query(
            collection(db, "reservas"), 
            where("usuarioUid", "==", usuarioUid),
            where("estado", "==", "Pendiente de Pago")
        );

        const querySnapshot = await getDocs(qReserva);

        if (querySnapshot.empty) {
            contenedorResumen.innerHTML = `<p style="color: red;">No se encontró ninguna reserva pendiente asociada a su cuenta.</p>`;
            return;
        }

        querySnapshot.forEach((documento) => {
            reservaActivaId = documento.id;
            const data = documento.data();

            contenedorResumen.innerHTML = `
                <p style="margin-bottom: 5px; font-weight: bold; color: var(--secondary-color);">Detalles Especificos del Arrendamiento:</p>
                <p><strong>Equipo Solicitado:</strong> ${data.maquinaDetalle || 'Maquinaria'}</p>
                <p><strong>Unidades:</strong> ${data.cantidadUnidades || 1}</p>
                <p><strong>Duración:</strong> ${data.dias || 1} día(s)</p>
                <p><strong>Zona de Destino:</strong> ${data.zona || 'N/A'}</p>
                <p><strong>Dirección de Obra:</strong> ${data.direccionObra || 'N/A'}</p>
                <p><strong>Inversión Total Estimada:</strong> $${(data.costoTotal || 0).toFixed(2)}</p>
            `;
        });

    } catch (error) {
        console.error("Error al cargar contrato y cliente:", error);
        contenedorResumen.innerHTML = `<p style="color: red;">Error al sincronizar los datos de la reserva.</p>`;
    }
}

window.subirContratoFirmado = async function(event) {
    event.preventDefault();

    const archivoInput = document.getElementById('inputArchivoContrato');
    if (!archivoInput.files || archivoInput.files.length === 0) {
        alert("Por favor, adjunte el documento firmado.");
        return;
    }

    if (!reservaActivaId) {
        alert("Error crítico: No hay una reserva activa identificada.");
        return;
    }

    try {
        const archivo = archivoInput.files[0];
        
        const reservaRef = doc(db, "reservas", reservaActivaId);
        await updateDoc(reservaRef, {
            contratoFirmado: true,
            nombreArchivoContrato: archivo.name,
            fechaFirmaContrato: new Date().toISOString()
        });

        alert("¡Contrato verificado y adjuntado con éxito! Redirigiendo a pasarela de pago segura...");
        window.location.href = "pago.html";

    } catch (error) {
        console.error("Error al subir el contrato:", error);
        alert("Ocurrió un error al procesar el archivo del contrato.");
    }
};