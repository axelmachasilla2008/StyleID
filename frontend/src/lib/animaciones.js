// =====================================================
// Animaciones al hacer scroll (todas las páginas).
//  - startBlockAnimations(): las tarjetas aparecen suavemente al entrar en
//    pantalla (clases .anim-in / .is-in de animaciones.css), también las que
//    React agrega después (pedidos, comentarios, prendas del servidor).
//  - revealOnScroll(): títulos y secciones con .reveal / .visible.
// Si algo falla aquí, la página se ve completa igual.
// =====================================================

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Bloques que se animan (las tarjetas de los carruseles no: ya aparece el carrusel entero)
const BLOCKS = [
    '.catalog-grid .product-card',
    '.info-card',
    '.order-card',
    '.summary-tile',
    '.fav-card',
    '.site-comment',
    '.comments-form-card',
    '.stylist-intro',
    '.chat-card',
    '.footer-col',
    '.stat',
    '.product-row'
].join(',');

let started = false;

export function startBlockAnimations() {
    if (started || reduceMotion() || !('IntersectionObserver' in window)) return;
    started = true;

    const observer = new IntersectionObserver((entries) => {
        // Los que entran juntos aparecen en cascada
        let order = 0;
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            observer.unobserve(el);
            el.style.setProperty('--anim-delay', `${Math.min(order++, 6) * 60}ms`);
            el.classList.add('is-in');
            // Al terminar se limpian las clases para no estorbar a hover y otros efectos
            const clean = () => {
                el.classList.remove('anim-in', 'is-in');
                el.style.removeProperty('--anim-delay');
            };
            el.addEventListener('transitionend', function done(e) {
                if (e.target !== el || e.propertyName !== 'transform') return;
                el.removeEventListener('transitionend', done);
                clean();
            });
            setTimeout(clean, 1600);   // por si la transición no llega a dispararse
        });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    const seen = new WeakSet();
    const watch = (root, initial) => {
        const list = [];
        if (root.matches?.(BLOCKS)) list.push(root);
        if (root.querySelectorAll) list.push(...root.querySelectorAll(BLOCKS));
        list.forEach((el) => {
            if (seen.has(el)) return;
            seen.add(el);
            // Lo que ya está arriba en pantalla al cargar no se esconde (evita parpadeos)
            if (initial) {
                const rect = el.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight * 0.6) return;
            }
            el.classList.add('anim-in');
            observer.observe(el);
        });
    };

    watch(document, true);
    new MutationObserver((mutations) => {
        mutations.forEach((m) => m.addedNodes.forEach((node) => {
            if (node.nodeType === 1) watch(node, false);
        }));
    }).observe(document.body, { childList: true, subtree: true });
}

/**
 * Agrega .reveal a los elementos y .visible cuando entran en pantalla.
 * @param {string} selector
 * @param {(el: Element, index: number) => string} [delayOf] retardo CSS de cada uno
 */
export function revealOnScroll(selector, delayOf, options = { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }) {
    if (!('IntersectionObserver' in window)) return () => {};
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, options);

    document.querySelectorAll(selector).forEach((el, index) => {
        const delay = delayOf ? delayOf(el, index) : '';
        if (delay) el.style.setProperty('--reveal-delay', delay);
        el.classList.add('reveal');
        observer.observe(el);
    });
    return () => observer.disconnect();
}
