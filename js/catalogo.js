/* ==========================================
   LÓGICA JAVASCRIPT DEL CATÁLOGO DINÁMICO CON STOCK (catalogo.js)
   ========================================== */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let usuarioLogueadoEnCatalogo = null;

// Rastrear usuario activo
onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioLogueadoEnCatalogo = user;
    } else {
        usuarioLogueadoEnCatalogo = null;
    }
});

// Cargar catálogo y calcular disponibilidad en tiempo real
document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogoPublicoConStock();
});

async function cargarCatalogoPublicoConStock() {
    const contenedorGrid = document.querySelector('.catalogo-grid');
    if (!contenedorGrid) return;

    contenedorGrid.innerHTML = `<div style="text-align: center; padding: 2rem; grid-column: 1 / -1; color: #6b7280;">Calculando disponibilidad y stock en tiempo real...</div>`;

    try {
        const [snapshotMaquinaria, snapshotReservas] = await Promise.all([
            getDocs(collection(db, "maquinaria")),
            getDocs(collection(db, "reservas"))
        ]);

        if (snapshotMaquinaria.empty) {
            contenedorGrid.innerHTML = `<div style="text-align: center; padding: 2rem; grid-column: 1 / -1; color: #6b7280;">No hay maquinaria disponible en este momento.</div>`;
            return;
        }

        // Mapear unidades ocupadas normalizando los nombres a minúsculas y sin espacios extra
        const unidadesOcupadas = {};
        snapshotReservas.forEach((docRes) => {
            const dataRes = docRes.data();
            // Solo restamos del stock las que están activas en obra o esperando pago
            if (dataRes.estado === "Pendiente de Pago" || dataRes.estado === "Pagado y Confirmado") {
                const nombreKey = (dataRes.maquinaDetalle || "").trim().toLowerCase();
                const cant = parseInt(dataRes.cantidadUnidades) || 1;
                unidadesOcupadas[nombreKey] = (unidadesOcupadas[nombreKey] || 0) + cant;
            }
        });

        contenedorGrid.innerHTML = "";

        snapshotMaquinaria.forEach((documento) => {
            const data = documento.data();
            const stockTotal = parseInt(data.stockTotal) || 1;
            const nombreKey = (data.nombre || "").trim().toLowerCase();
            const ocupadas = unidadesOcupadas[nombreKey] || 0;
            const disponibles = Math.max(0, stockTotal - ocupadas);

            const esAgotado = disponibles === 0;
            const colorStock = esAgotado ? "#ef4444" : "#059669";
            const textoStock = esAgotado ? "Agotado temporalmente" : `${disponibles} unidad(es) disponible(s)`;

            const tarjetaHTML = `
                <div class="maquina-card" data-categoria="${data.categoria}" data-nombre="${nombreKey}">
                    <div class="maquina-img-container" style="position: relative;">
                        <img src="${data.imagenUrl}" alt="${data.nombre}" class="carousel-img active" style="width: 100%; height: 200px; object-fit: cover;">
                        <span style="position: absolute; top: 10px; right: 10px; background: ${colorStock}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
                            ${textoStock}
                        </span>
                    </div>
                    <div class="maquina-info" style="padding: 15px; display: flex; flex-direction: column; justify-content: space-between; flex: 1;">
                        <div>
                            <span style="font-size: 0.75rem; background: rgba(245, 158, 11, 0.15); color: var(--primary-color); padding: 3px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">${data.categoria}</span>
                            <h3 style="margin: 10px 0 5px 0; color: var(--secondary-color); font-size: 1.1rem;">${data.nombre}</h3>
                            <p style="font-size: 0.85rem; color: #4b5563; margin-bottom: 15px;">${data.descripcion}</p>
                        </div>
                        <div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: var(--secondary-color); margin-bottom: 10px;">
                                $${Number(data.precioDia).toFixed(2)} <span style="font-size: 0.8rem; font-weight: normal; color: #6b7280;">/ día</span>
                            </div>
                            ${esAgotado 
                                ? `<button disabled style="width: 100%; text-align: center; padding: 8px; font-size: 0.9rem; background: #d1d5db; color: #6b7280; border: none; border-radius: 4px; cursor: not-allowed;">Sin Stock</button>`
                                : `<button onclick="abrirModalUbicacion('${data.nombre}', ${data.precioDia}, ${disponibles})" class="btn" style="width: 100%; text-align: center; padding: 8px; font-size: 0.9rem;">Solicitar Alquiler</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
            contenedorGrid.innerHTML += tarjetaHTML;
        });

    } catch (error) {
        console.error("Error al cargar el catálogo con stock:", error);
        contenedorGrid.innerHTML = `<div style="text-align: center; padding: 2rem; grid-column: 1 / -1; color: red;">Error al sincronizar el inventario.</div>`;
    }
};

// Filtros por Categoría y Búsqueda
window.filtrarCategoria = function(categoria) {
    const tarjetas = document.querySelectorAll('.maquina-card');
    const botonesFiltro = document.querySelectorAll('.btn-filtro');

    botonesFiltro.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    tarjetas.forEach(tarjeta => {
        const catTarjeta = tarjeta.getAttribute('data-categoria');
        if (categoria === 'todos' || catTarjeta === categoria) {
            tarjeta.style.display = 'flex';
        } else {
            tarjeta.style.display = 'none';
        }
    });
};

window.filtrarMaquinaria = function() {
    const input = document.getElementById('inputBuscar').value.toLowerCase();
    const tarjetas = document.querySelectorAll('.maquina-card');

    tarjetas.forEach(tarjeta => {
        const nombre = tarjeta.getAttribute('data-nombre');
        if (nombre.includes(input)) {
            tarjeta.style.display = 'flex';
        } else {
            tarjeta.style.display = 'none';
        }
    });
};

let nombreMaquinaGlobal = "";
let precioActualMaquina = 0;
let stockMaximoPermitido = 1;

window.abrirModalUbicacion = function(nombreMaquina, precioDia, stockDisponibles) {
    if (!usuarioLogueadoEnCatalogo) {
        alert("¡Atención! Debe iniciar sesión o registrarse para solicitar el alquiler de esta maquinaria.");
        window.location.href = "login.html";
        return;
    }

    nombreMaquinaGlobal = nombreMaquina;
    precioActualMaquina = precioDia;
    stockMaximoPermitido = stockDisponibles;

    const modal = document.getElementById('modalUbicacion');
    const textoInfo = document.getElementById('infoMaquinaSeleccionada');
    const inputUnidades = document.getElementById('cantidadUnidades');
    const inputDias = document.getElementById('diasAlquiler');
    
    textoInfo.textContent = `Equipo: ${nombreMaquina} ($${precioDia.toFixed(2)} / día)`;
    
    inputUnidades.max = stockDisponibles;
    inputUnidades.value = 1;
    inputDias.value = 1;

    actualizarCalculoTotal();
    modal.style.display = 'flex';
};

function actualizarCalculoTotal() {
    const unidades = parseInt(document.getElementById('cantidadUnidades').value) || 1;
    const dias = parseInt(document.getElementById('diasAlquiler').value) || 1;
    const total = precioActualMaquina * dias * unidades;
    document.getElementById('totalEstimado').textContent = `$${total.toFixed(2)}`;
}

// Escuchar cambios en los inputs del modal para recalcular en tiempo real
document.addEventListener('DOMContentLoaded', () => {
    const inputDias = document.getElementById('diasAlquiler');
    const inputUnidades = document.getElementById('cantidadUnidades');

    if (inputDias) inputDias.addEventListener('input', actualizarCalculoTotal);
    if (inputUnidades) inputUnidades.addEventListener('input', actualizarCalculoTotal);
});

// Procesar y guardar la reserva de forma correcta en Firestore
// Procesar y guardar la reserva unificada en Firestore
window.procesarSimulacion = async function(event) {
    event.preventDefault();

    if (!usuarioLogueadoEnCatalogo) {
        alert("Debe iniciar sesión para alquilar maquinaria.");
        window.location.href = "login.html";
        return;
    }

    const zona = document.getElementById('zonaEntrega').value;
    const direccionObra = document.getElementById('direccionObra').value;
    const unidades = parseInt(document.getElementById('cantidadUnidades').value) || 1;
    const dias = parseInt(document.getElementById('diasAlquiler').value) || 1;
    
    if (unidades > stockMaximoPermitido) {
        alert(`No puedes solicitar ${unidades} unidades. Solo hay ${stockMaximoPermitido} disponibles.`);
        return;
    }

    // Forzamos números puros para que el panel admin pueda sumar los ingresos correctamente
    const costoTotal = Number(precioActualMaquina) * Number(dias) * Number(unidades);

    try {
        await addDoc(collection(db, "reservas"), {
            usuarioUid: usuarioLogueadoEnCatalogo.uid,
            usuarioEmail: usuarioLogueadoEnCatalogo.email || "Cliente web",
            maquinaDetalle: nombreMaquinaGlobal, // Nombre limpio de la máquina
            cantidadUnidades: unidades,
            dias: dias,
            zona: zona,
            direccionObra: direccionObra,
            costoTotal: costoTotal,
            estado: "Pendiente de Pago",
            fechaCreacion: new Date().toISOString()
        });

        alert("¡Reserva registrada con éxito! Redirigiendo a pasarela de pago...");
        cerrarModalUbicacion();
        window.location.href = "pago.html";
    } catch (error) {
        console.error("Error al registrar la reserva:", error);
        alert("Hubo un error al guardar la reserva en la base de datos.");
    }
};

window.cerrarModalUbicacion = function() {
    const modal = document.getElementById('modalUbicacion');
    modal.style.display = 'none';
};

// Cálculo dinámico del costo total según los días
document.addEventListener('DOMContentLoaded', () => {
    const inputDias = document.getElementById('diasAlquiler');
    if (inputDias) {
        inputDias.addEventListener('input', (e) => {
            const dias = parseInt(e.target.value) || 1;
            const total = precioActualMaquina * dias;
            document.getElementById('totalEstimado').textContent = `$${total.toFixed(2)}`;
        });
    }
});

let mapaLeaflet = null;
let marcadorPin = null;
let latitudSeleccionada = -2.2274;
let longitudSeleccionada = -80.9005;

// Modifica tu función abrirModalUbicacion para que inicialice el mapa
window.abrirModalUbicacion = function(nombreMaquina, precioDia, stockDisponibles) {
    if (!usuarioLogueadoEnCatalogo) {
        alert("¡Atención! Debe iniciar sesión o registrarse para solicitar el alquiler de esta maquinaria.");
        window.location.href = "login.html";
        return;
    }

    nombreMaquinaGlobal = nombreMaquina;
    precioActualMaquina = precioDia;
    stockMaximoPermitido = stockDisponibles;

    const modal = document.getElementById('modalUbicacion');
    const textoInfo = document.getElementById('infoMaquinaSeleccionada');
    const inputUnidades = document.getElementById('cantidadUnidades');
    const inputDias = document.getElementById('diasAlquiler');
    
    textoInfo.textContent = `Equipo: ${nombreMaquina} ($${precioDia.toFixed(2)} / día)`;
    
    inputUnidades.max = stockDisponibles;
    inputUnidades.value = 1;
    inputDias.value = 1;

    actualizarCalculoTotal();
    modal.style.display = 'flex';

    // Inicializar el mapa de Leaflet con un pequeño retardo para asegurar que el DOM del modal esté visible
    setTimeout(() => {
        if (!mapaLeaflet) {
            // Centrado predeterminado en Santa Elena, Ecuador
            mapaLeaflet = L.map('mapaUbicacionObra').setView([-2.2274, -80.9005], 11);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(mapaLeaflet);

            marcadorPin = L.marker([-2.2274, -80.9005], { draggable: true }).addTo(mapaLeaflet);

            // Al arrastrar el marcador
            marcadorPin.on('dragend', function(event) {
                const posicion = marcadorPin.getLatLng();
                latitudSeleccionada = posicion.lat;
                longitudSeleccionada = posicion.lng;
                document.getElementById('direccionObra').value = `Lat: ${latitudSeleccionada.toFixed(4)}, Lng: ${longitudSeleccionada.toFixed(4)}`;
            });

            // Al hacer clic en el mapa
            mapaLeaflet.on('click', function(e) {
                latitudSeleccionada = e.latlng.lat;
                longitudSeleccionada = e.latlng.lng;
                marcadorPin.setLatLng([latitudSeleccionada, longitudSeleccionada]);
                document.getElementById('direccionObra').value = `Lat: ${latitudSeleccionada.toFixed(4)}, Lng: ${longitudSeleccionada.toFixed(4)}`;
            });
        } else {
            mapaLeaflet.invalidateSize(); // Refresca el tamaño del mapa dentro del modal
        }
        
        // Valor por defecto inicial
        document.getElementById('direccionObra').value = `Lat: -2.2274, Lng: -80.9005`;
    }, 200);
};

// Asegúrate de guardar la latitud y longitud en la reserva dentro de procesarSimulacion:
window.procesarSimulacion = async function(event) {
    event.preventDefault();

    if (!usuarioLogueadoEnCatalogo) {
        alert("Debe iniciar sesión.");
        return;
    }

    const zona = document.getElementById('zonaEntrega').value;
    const direccionObra = document.getElementById('direccionObra').value;
    const unidades = parseInt(document.getElementById('cantidadUnidades').value) || 1;
    const dias = parseInt(document.getElementById('diasAlquiler').value) || 1;
    
    if (unidades > stockMaximoPermitido) {
        alert(`No puedes solicitar ${unidades} unidades. Solo hay ${stockMaximoPermitido} disponibles.`);
        return;
    }

    const costoTotal = Number(precioActualMaquina) * Number(dias) * Number(unidades);

    try {
        await addDoc(collection(db, "reservas"), {
            usuarioUid: usuarioLogueadoEnCatalogo.uid,
            usuarioEmail: usuarioLogueadoEnCatalogo.email || "Cliente web",
            maquinaDetalle: nombreMaquinaGlobal,
            cantidadUnidades: unidades,
            dias: dias,
            zona: zona,
            direccionObra: direccionObra,
            latitud: latitudSeleccionada,   // Coordenada exacta del mapa
            longitud: longitudSeleccionada, // Coordenada exacta del mapa
            costoTotal: costoTotal,
            estado: "Pendiente de Pago",
            fechaCreacion: new Date().toISOString()
        });

        alert("¡Reserva y ubicación geolocalizada registrada con éxito!");
        cerrarModalUbicacion();
        window.location.href = "contrato.html";
    } catch (error) {
        console.error("Error al registrar la reserva:", error);
        alert("Hubo un error al guardar la reserva en la base de datos.");
    }
};