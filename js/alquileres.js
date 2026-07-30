/* ==========================================
   LÓGICA JAVASCRIPT DE MIS ALQUILERES (alquileres.js)
   ========================================== */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let listaReservasGlobal = [];

// Vigilar sesión activa usando el UID del usuario actual
onAuthStateChanged(auth, (user) => {
    if (user) {
        cargarAlquileresUsuario(user.uid);
    } else {
        alert("Debe iniciar sesión para ver sus alquileres.");
        window.location.href = "login.html";
    }
});

// Cargar alquileres de Firestore filtrados por el UID del usuario actual
async function cargarAlquileresUsuario(usuarioUid) {
    const contenedor = document.getElementById('contenedorAlquileres');
    contenedor.innerHTML = `<div style="text-align: center; padding: 2rem; color: #6b7280;">Buscando tus registros en la nube...</div>`;

    try {
        // Consultamos usando usuarioUid que es el campo unificado en el catálogo
        const q = query(collection(db, "reservas"), where("usuarioUid", "==", usuarioUid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            contenedor.innerHTML = `<div style="text-align: center; padding: 2rem; color: #6b7280; background: var(--white); border-radius: 8px;">Aún no has realizado ninguna solicitud de alquiler. ¡Explora nuestro catálogo para empezar!</div>`;
            return;
        }

        listaReservasGlobal = [];
        querySnapshot.forEach((documento) => {
            listaReservasGlobal.push({ id: documento.id, ...documento.data() });
        });

        mostrarTarjetasAlquileres(listaReservasGlobal);

    } catch (error) {
        console.error("Error al cargar alquileres:", error);
        contenedor.innerHTML = `<div style="text-align: center; padding: 2rem; color: red;">Error al conectar con la base de datos.</div>`;
    }
}

// Renderizar el listado de tarjetas en pantalla
function mostrarTarjetasAlquileres(reservas) {
    const contenedor = document.getElementById('contenedorAlquileres');
    contenedor.innerHTML = "";

    reservas.forEach((data) => {
        const esPagado = data.estado === "Pagado y Confirmado";
        const esFinalizado = data.estado === "Finalizado";
        
        let claseCard = "";
        let claseBadge = "pendiente";

        if (esPagado) {
            claseCard = "pagado";
            claseBadge = "pagado";
        } else if (esFinalizado) {
            claseBadge = "finalizado";
        }

        let botonAccion = "";
        if (esPagado) {
            botonAccion = `<span style="color: #059669; font-weight: bold; font-size: 0.9rem; background: #ecfdf5; padding: 6px 12px; border-radius: 6px;">✔ Pago Completado</span>`;
        } else if (esFinalizado) {
            botonAccion = `<span style="color: #4b5563; font-weight: bold; font-size: 0.9rem; background: #f3f4f6; padding: 6px 12px; border-radius: 6px;">🏁 Contrato Finalizado</span>`;
        } else {
            botonAccion = `<a href="pago.html" class="btn" style="text-decoration: none; padding: 8px 16px; font-size: 0.85rem;">Proceder al Pago</a>`;
        }

        // Manejo de nombres de campos adaptados (zona o zonaEntrega, dias o diasAlquiler)
        const zonaTexto = data.zona || data.zonaEntrega || 'No especificada';
        const diasTexto = data.dias || data.diasAlquiler || 1;
        const unidadesTexto = data.cantidadUnidades || 1;

        const tarjetaHTML = `
            <div class="alquiler-card ${claseCard}">
                <div class="alquiler-info" style="flex: 1; min-width: 250px;">
                    <h4>🚜 ${data.maquinaDetalle || 'Maquinaria'}</h4>
                    <p><strong>Unidades:</strong> ${unidadesTexto}</p>
                    <p><strong>Zona de Entrega:</strong> ${zonaTexto}</p>
                    <p><strong>Dirección / Coordenadas:</strong> ${data.direccionObra || 'N/A'}</p>
                    <p><strong>Duración:</strong> ${diasTexto} día(s)</p>
                    <p><strong>Costo Total:</strong> $${(data.costoTotal || 0).toFixed(2)}</p>
                    <p style="margin-top: 8px;"><span class="badge-estado ${claseBadge}">${data.estado}</span></p>
                </div>
                <div style="display: flex; align-items: center;">
                    ${botonAccion}
                </div>
            </div>
        `;
        contenedor.innerHTML += tarjetaHTML;
    });
}

// Filtrar los alquileres por estado mediante los botones superiores
window.filtrarAlquileres = function(estadoFiltro) {
    const botones = document.querySelectorAll('.btn-filtro-estado');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (estadoFiltro === 'todos') {
        mostrarTarjetasAlquileres(listaReservasGlobal);
    } else {
        const filtradas = listaReservasGlobal.filter(item => item.estado === estadoFiltro);
        const contenedor = document.getElementById('contenedorAlquileres');
        
        if (filtradas.length === 0) {
            contenedor.innerHTML = `<div style="text-align: center; padding: 2rem; color: #6b7280; background: var(--white); border-radius: 8px;">No hay registros con el estado "${estadoFiltro}".</div>`;
            return;
        }
        mostrarTarjetasAlquileres(filtradas);
    }
};

// Control de impresión
window.addEventListener('beforeprint', () => {
    const printHeader = document.querySelector('.print-header');
    if (printHeader) printHeader.style.display = 'block';
});

window.addEventListener('afterprint', () => {
    const printHeader = document.querySelector('.print-header');
    if (printHeader) printHeader.style.display = 'none';
});