/* ==========================================
   ANIMACIÓN PROGRESIVA AL HACER SCROLL (scroll-reveal.js)
   ========================================== */

document.addEventListener("DOMContentLoaded", function() {
    // Seleccionamos todos los elementos que tengan la clase reveal
    const elementosReveal = document.querySelectorAll('.reveal');

    const opcionesObservador = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Se activa cuando el 15% del elemento es visible en pantalla
    };

    const callbackObservador = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Opcional: si quieres que la animación ocurra solo la primera vez, descomenta la siguiente línea:
                // observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(callbackObservador, opcionesObservador);

    elementosReveal.forEach(el => {
        observer.observe(el);
    });
});