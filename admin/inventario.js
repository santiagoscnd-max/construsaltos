/* ==========================================
   LÓGICA DEL MÓDULO DE INVENTARIO CON EDICIÓN (inventario.js)
   ========================================== */

import { auth, db } from "../js/firebase-config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const CORREOS_ADMINISTRADORES = [
    "admin@construsaltos.com",
    "santiagosc.nd@gmail.com"
];

onAuthStateChanged(auth, (user) => {
    if (!user || !CORREOS_ADMINISTRADORES.includes(user.email)) {
        alert("Acceso denegado. Se requieren privilegios de administrador.");
        window.location.href = "login-admin.html";
    } else {
        cargarInventarioAdmin();
    }
});

// 1. Guardar Maquinaria (Funciona tanto para Crear nuevo como para Actualizar)
window.guardarMaquinaria = async function(event) {
    event.preventDefault();

    const idEditando = document.getElementById('idMaquinaEditando').value;
    const nombre = document.getElementById('nombreMaquina').value;
    const categoria = document.getElementById('categoriaMaquina').value;
    const stockTotal = parseInt(document.getElementById('stockMaquina').value) || 1;
    const precio = parseFloat(document.getElementById('precioMaquina').value);
    const imagen = document.getElementById('imagenMaquina').value;
    const descripcion = document.getElementById('descripcionMaquina').value;

    try {
        if (idEditando) {
            // Actualizar registro existente
            const maquinaRef = doc(db, "maquinaria", idEditando);
            await updateDoc(maquinaRef, {
                nombre: nombre,
                categoria: categoria,
                stockTotal: stockTotal,
                precioDia: precio,
                imagenUrl: imagen,
                descripcion: descripcion
            });
            alert("¡Maquinaria actualizada exitosamente!");
            cancelarEdicion();
        } else {
            // Crear nuevo registro
            await addDoc(collection(db, "maquinaria"), {
                nombre: nombre,
                categoria: categoria,
                stockTotal: stockTotal,
                precioDia: precio,
                imagenUrl: imagen,
                descripcion: descripcion,
                fechaCreacion: new Date().toISOString()
            });
            alert("¡Maquinaria agregada exitosamente al catálogo!");
            document.getElementById('formNuevaMaquina').reset();
        }

        cargarInventarioAdmin();
    } catch (error) {
        console.error("Error al guardar maquinaria:", error);
        alert("Hubo un error al procesar la solicitud en la base de datos.");
    }
};

// 2. Cargar listado en la tabla del panel admin con botones de Editar y Eliminar
async function cargarInventarioAdmin() {
    const tbody = document.getElementById('tablaInventarioBody');
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">Cargando inventario desde la nube...</td></tr>`;

    try {
        const querySnapshot = await getDocs(collection(db, "maquinaria"));
        
        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">No hay maquinaria registrada todavía.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        querySnapshot.forEach((documento) => {
            const data = documento.data();
            const idDoc = documento.id;
            // Escapamos los datos para pasarlos de forma segura a la función de edición
            const dataJson = encodeURIComponent(JSON.stringify(data));

            const fila = `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; display: flex; align-items: center; gap: 10px;">
                        <img src="${data.imagenUrl}" alt="${data.nombre}" style="width: 45px; height: 35px; object-fit: cover; border-radius: 4px;">
                        <strong>${data.nombre}</strong>
                    </td>
                    <td style="padding: 12px; text-transform: capitalize;">${data.categoria}</td>
                    <td style="padding: 12px; font-weight: bold; color: var(--secondary-color);">${data.stockTotal || 1} unidades</td>
                    <td style="padding: 12px;">$${data.precioDia.toFixed(2)} / día</td>
                    <td style="padding: 12px; display: flex; gap: 8px;">
                        <button onclick="prepararEdicion('${idDoc}', '${dataJson}')" style="background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Editar</button>
                        <button onclick="eliminarMaquinaria('${idDoc}')" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Eliminar</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += fila;
        });

    } catch (error) {
        console.error("Error al cargar inventario:", error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: red;">Error al conectar con la base de datos.</td></tr>`;
    }
}

// 3. Rellenar formulario con los datos para editar
window.prepararEdicion = function(idDoc, dataJson) {
    const data = JSON.parse(decodeURIComponent(dataJson));

    document.getElementById('idMaquinaEditando').value = idDoc;
    document.getElementById('nombreMaquina').value = data.nombre;
    document.getElementById('categoriaMaquina').value = data.categoria;
    document.getElementById('stockMaquina').value = data.stockTotal || 1;
    document.getElementById('precioMaquina').value = data.precioDia;
    document.getElementById('imagenMaquina').value = data.imagenUrl;
    document.getElementById('descripcionMaquina').value = data.descripcion;

    document.getElementById('tituloFormulario').textContent = "Editar Maquinaria Existente";
    document.getElementById('btnSubmitForm').textContent = "Actualizar Cambios";
    document.getElementById('btnCancelarEdicion').style.display = "inline-block";

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 4. Cancelar modo edición y limpiar formulario
window.cancelarEdicion = function() {
    document.getElementById('formNuevaMaquina').reset();
    document.getElementById('idMaquinaEditando').value = "";
    document.getElementById('tituloFormulario').textContent = "Registrar Nueva Maquinaria y Stock";
    document.getElementById('btnSubmitForm').textContent = "Guardar y Publicar en Catálogo";
    document.getElementById('btnCancelarEdicion').style.display = "none";
};

// 5. Eliminar maquinaria del inventario
window.eliminarMaquinaria = async function(idDoc) {
    const confirmar = confirm("¿Está seguro de eliminar este equipo del catálogo? Esta acción no se puede deshacer.");
    if (!confirmar) return;

    try {
        await deleteDoc(doc(db, "maquinaria", idDoc));
        alert("Equipo eliminado exitosamente.");
        cargarInventarioAdmin();
    } catch (error) {
        console.error("Error al eliminar equipo:", error);
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