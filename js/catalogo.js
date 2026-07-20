/* ==========================================
   LÓGICA JAVASCRIPT DEL CATÁLOGO (Carrusel y Modal)
   ========================================== */

// Control del Carrusel de imágenes por tarjeta
const indicesImagenes = { 1: 0, 2: 0, 3: 0 };

function cambiarImagen(idMaquina, direccion) {
    const contenedor = document.getElementById(`carousel-${idMaquina}`);
    const imagenes = contenedor.querySelectorAll('.carousel-img');
    
    indicesImagenes[idMaquina] += direccion;
    
    if (indicesImagenes[idMaquina] >= imagenes.length) {
        indicesImagenes[idMaquina] = 0;
    } else if (indicesImagenes[idMaquina] < 0) {
        indicesImagenes[idMaquina] = imagenes.length - 1;
    }
    
    imagenes.forEach((img, index) => {
        img.classList.remove('active');
        if (index === indicesImagenes[idMaquina]) {
            img.classList.add('active');
        }
    });
}

// Variables temporales para el cálculo simulado
let precioActualMaquina = 0;

function abrirModalUbicacion(nombreMaquina, precioDia) {
    precioActualMaquina = precioDia;
    const modal = document.getElementById('modalUbicacion');
    const textoInfo = document.getElementById('infoMaquinaSeleccionada');
    
    textoInfo.textContent = `Equipo: ${nombreMaquina} ($${precioDia.toFixed(2)} por día)`;
    document.getElementById('totalEstimado').textContent = `$${precioDia.toFixed(2)}`;
    document.getElementById('diasAlquiler').value = 1;
    
    modal.style.display = 'flex';
}

function cerrarModalUbicacion() {
    const modal = document.getElementById('modalUbicacion');
    modal.style.display = 'none';
}

// Actualizar costo estimado al cambiar los días
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

// Simular el envío final de la solicitud con ubicación
function procesarSimulacion(event) {
    event.preventDefault();
    const zona = document.getElementById('zonaEntrega').value;
    const direccion = document.getElementById('direccionObra').value;
    const dias = document.getElementById('diasAlquiler').value;
    
    alert(`¡Solicitud simulada con éxito!\n\nZona de Entrega: ${zona}\nDirección: ${direccion}\nDuración: ${dias} día(s)\n\nSe ha registrado la ubicación para el contrato de alquiler.`);
    cerrarModalUbicacion();
}