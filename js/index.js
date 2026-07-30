/* ==========================================
   LÓGICA DINÁMICA DE MAQUINARIA DESTACADA (index.js)
   ========================================== */

import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    cargarMaquinariaDestacadaInicio();
});

async function cargarMaquinariaDestacadaInicio() {
    const contenedor = document.getElementById('gridMaquinariaDestacada');
    if (!contenedor) return;

    try {
        const querySnapshot = await getDocs(collection(db, "maquinaria"));

        if (querySnapshot.empty) {
            contenedor.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 2rem;">No hay maquinaria registrada en el sistema actualmente.</div>`;
            return;
        }

        contenedor.innerHTML = "";
        let contador = 0;

        // Recorremos los equipos (mostramos máximo 2 o 3 para la sección destacada)
        querySnapshot.forEach((documento) => {
            if (contador >= 2) return; // Limitar a los primeros 2 equipos destacados
            const data = documento.data();

            const tarjetaHTML = `
                <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <img src="${data.imagenUrl}" alt="${data.nombre}" style="width: 100%; height: 200px; object-fit: cover;">
                        <div style="padding: 20px;">
                            <span style="font-size: 0.75rem; background: rgba(245, 158, 11, 0.15); color: var(--primary-color); padding: 3px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">${data.categoria}</span>
                            <h3 style="margin: 10px 0 5px 0; color: var(--secondary-color); font-size: 1.2rem;">${data.nombre}</h3>
                            <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 15px; line-height: 1.4;">${data.descripcion}</p>
                        </div>
                    </div>
                    <div style="padding: 0 20px 20px 20px;">
                        <div style="font-size: 1.1rem; font-weight: bold; color: var(--secondary-color); margin-bottom: 15px;">
                            $${Number(data.precioDia).toFixed(2)} <span style="font-size: 0.8rem; font-weight: normal; color: #6b7280;">/ día</span>
                        </div>
                        <a href="catalogo.html" class="btn" style="display: block; text-align: center; text-decoration: none; padding: 10px; font-size: 0.9rem;">Ver en Catálogo</a>
                    </div>
                </div>
            `;
            contenedor.innerHTML += tarjetaHTML;
            contador++;
        });

    } catch (error) {
        console.error("Error al cargar maquinaria destacada:", error);
        contenedor.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: red; padding: 2rem;">Error al conectar con la base de datos.</div>`;
    }
}