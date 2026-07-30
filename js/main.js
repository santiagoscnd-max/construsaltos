/* ==========================================
   LÓGICA JAVASCRIPT GLOBAL (Menú Responsivo)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.querySelector('.nav-container');
    const navMenu = document.querySelector('.nav-menu');

    // Crear de forma dinámica el botón de menú hamburguesa para pantallas móviles
    if (navContainer && navMenu) {
        const menuToggle = document.createElement('div');
        menuToggle.classList.add('menu-toggle');
        menuToggle.innerHTML = '&#9776;'; // Símbolo de barras (hamburguesa)
        
        // Insertar el botón antes del menú de navegación
        navContainer.insertBefore(menuToggle, navMenu);

        // Evento para abrir y cerrar el menú en dispositivos móviles
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Cerrar el menú automáticamente al hacer clic en cualquier enlace
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
});