/* ==========================================
   CONTROL VISUAL DE AUTENTICACIÓN Y MENÚ DESPLEGABLE (navbar-auth.js)
   ========================================== */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    if (user) {
        // Intentar obtener el nombre guardado en Firestore si ya completó su perfil
        let nombreMostrado = user.email.split('@')[0]; // Por defecto usamos la parte inicial del correo
        try {
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().nombres) {
                nombreMostrado = docSnap.data().nombres;
            }
        } catch (e) {
            console.log("No se pudo cargar el nombre adicional, usando correo.");
        }

        let contenedorUsuario = document.getElementById('menuUsuarioActivo');
        
        if (!contenedorUsuario) {
            contenedorUsuario = document.createElement('div');
            contenedorUsuario.id = 'menuUsuarioActivo';
            contenedorUsuario.style.position = 'relative';
            contenedorUsuario.style.display = 'inline-block';
            contenedorUsuario.style.marginLeft = '15px';
            
            contenedorUsuario.innerHTML = `
                <button id="btnDropdownToggle" style="background-color: rgba(245, 158, 11, 0.15); color: var(--primary-color); padding: 7px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <span>👤 ${nombreMostrado} ▾</span>
                </button>
                
                <div id="dropdownMenuContent" style="display: none; position: absolute; right: 0; top: 115%; background: var(--white); min-width: 200px; box-shadow: 0 8px 16px rgba(0,0,0,0.15); border-radius: 8px; overflow: hidden; z-index: 1000; border: 1px solid #e5e7eb;">
                    <a href="perfil.html" style="display: block; padding: 12px 16px; color: var(--secondary-color); text-decoration: none; font-size: 0.9rem; border-bottom: 1px solid #f3f4f6; transition: background 0.2s;">⚙️ Mi Perfil y Datos</a>
                    <a href="alquileres.html" style="display: block; padding: 12px 16px; color: var(--secondary-color); text-decoration: none; font-size: 0.9rem; border-bottom: 1px solid #f3f4f6; transition: background 0.2s;">📋 Mis Alquileres</a>
                    <button id="btnCerrarSesionCliente" style="width: 100%; text-align: left; background: none; border: none; padding: 12px 16px; color: #ef4444; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: background 0.2s;">🚪 Cerrar Sesión</button>
                </div>
            `;
            
            navMenu.appendChild(contenedorUsuario);

            // Ocultar botones estáticos de login/registro
            const botonesLogin = document.querySelectorAll('a[href="login.html"], a[href="registro.html"]');
            botonesLogin.forEach(btn => btn.style.display = 'none');

            // Lógica para mostrar/ocultar el menú desplegable al hacer clic
            const btnToggle = document.getElementById('btnDropdownToggle');
            const menuContent = document.getElementById('dropdownMenuContent');

            btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menuContent.style.display = menuContent.style.display === 'block' ? 'none' : 'block';
            });

            // Cerrar menú al hacer clic fuera
            window.addEventListener('click', () => {
                if (menuContent) menuContent.style.display = 'none';
            });

            // Evento para cerrar sesión
            document.getElementById('btnCerrarSesionCliente').addEventListener('click', () => {
                signOut(auth).then(() => {
                    alert("Sesión cerrada exitosamente.");
                    window.location.href = "index.html";
                });
            });
        }
    }
});