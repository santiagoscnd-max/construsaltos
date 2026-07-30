/* ==========================================
   LÓGICA DE ANALÍTICA Y BI (analitica.js)
   ========================================== */

import { auth, db } from "../js/firebase-config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const CORREOS_ADMINISTRADORES = [
    "admin@construsaltos.com",
    "santiagosc.nd@gmail.com"
];

onAuthStateChanged(auth, (user) => {
    if (!user || !CORREOS_ADMINISTRADORES.includes(user.email)) {
        alert("Acceso denegado. Se requieren privilegios de administrador.");
        window.location.href = "login-admin.html";
    } else {
        calcularAnaliticaAvanzada();
    }
});

async function calcularAnaliticaAvanzada() {
    try {
        const [snapshotReservas, snapshotMaquinaria] = await Promise.all([
            getDocs(collection(db, "reservas")),
            getDocs(collection(db, "maquinaria"))
        ]);

        let ingresosReales = 0;
        let totalContratos = snapshotReservas.size;
        let sumaCostos = 0;
        
        const conteoZonas = {};
        const conteoEstados = { "Pendiente de Pago": 0, "Pagado y Confirmado": 0, "Finalizado": 0 };

        // 1. Calcular stock total físico de la empresa
        let stockTotalEmpresa = 0;
        snapshotMaquinaria.forEach(docM => {
            stockTotalEmpresa += (parseInt(docM.data().stockTotal) || 1);
        });

        let unidadesActualmenteEnObra = 0;

        snapshotReservas.forEach(docR => {
            const data = docR.data();
            const costo = Number(data.costoTotal) || 0;
            const unidades = parseInt(data.cantidadUnidades) || 1;
            const estado = data.estado || "Pendiente de Pago";
            const zona = data.zona || "No especificada";

            // Contar estados
            if (conteoEstados[estado] !== undefined) {
                conteoEstados[estado]++;
            } else {
                conteoEstados[estado] = 1;
            }

            // Contar zonas
            conteoZonas[zona] = (conteoZonas[zona] || 0) + 1;

            // Ingresos y Ticket Promedio (solo pagados o pendientes válidos)
            if (estado === "Pagado y Confirmado") {
                ingresosReales += costo;
                sumaCostos += costo;
            }

            // Si está activo en obra, ocupa flota
            if (estado === "Pagado y Confirmado" || estado === "Pendiente de Pago") {
                unidadesActualmenteEnObra += unidades;
            }
        });

        // 2. Calcular KPIs finales
        const ticketPromedio = totalContratos > 0 ? (sumaCostos / totalContratos) : 0;
        const tasaOcupacion = stockTotalEmpresa > 0 ? Math.min(100, (unidadesActualmenteEnObra / stockTotalEmpresa) * 100) : 0;

        document.getElementById('biIngresosReales').textContent = `$${ingresosReales.toFixed(2)}`;
        document.getElementById('biTasaOcupacion').textContent = `${tasaOcupacion.toFixed(1)}%`;
        document.getElementById('biTicketPromedio').textContent = `$${ticketPromedio.toFixed(2)}`;

        // 3. Renderizar Zonas Geográficas
        const contenedorZonas = document.getElementById('contenedorZonasBI');
        contenedorZonas.innerHTML = "";
        if (Object.keys(conteoZonas).length === 0) {
            contenedorZonas.innerHTML = `<p style="color: #6b7280; font-size: 0.9rem;">Sin datos territoriales registrados.</p>`;
        } else {
            for (const [zona, cantidad] of Object.entries(conteoZonas)) {
                contenedorZonas.innerHTML += `
                    <div style="display: flex; justify-content: space-between; background: #f3f4f6; padding: 10px 15px; border-radius: 6px;">
                        <span style="font-weight: 600; color: var(--secondary-color);">${zona}</span>
                        <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">${cantidad} pedido(s)</span>
                    </div>
                `;
            }
        }

        // 4. Renderizar Estados Operativos
        const contenedorEstados = document.getElementById('contenedorEstadosBI');
        contenedorEstados.innerHTML = "";
        for (const [estado, cantidad] of Object.entries(conteoEstados)) {
            let colorBadge = "#f59e0b";
            if (estado === "Pagado y Confirmado") colorBadge = "#10b981";
            if (estado === "Finalizado") colorBadge = "#6b7280";

            contenedorEstados.innerHTML += `
                <div style="display: flex; justify-content: space-between; background: #f3f4f6; padding: 10px 15px; border-radius: 6px;">
                    <span style="font-weight: 600; color: var(--secondary-color);">${estado}</span>
                    <span style="background: ${colorBadge}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">${cantidad}</span>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error al calcular analítica BI:", error);
    }
}

window.cerrarSesionAdmin = function() {
    signOut(auth).then(() => {
        window.location.href = "../login.html";
    }).catch((error) => {
        console.error("Error al cerrar sesión", error);
    });
};