import { useEffect, useRef } from 'react';

const SPEED = 28;   // px por segundo, igual en pantallas de 60 o 144 Hz

/**
 * Carrusel con bucle infinito y avance lento automático.
 * Las tarjetas se pintan dos veces: la copia cierra el bucle sin saltos
 * y queda oculta para lectores de pantalla.
 *
 * @param {Array}    items
 * @param {Function} renderItem (item, clone) => JSX
 */
export default function Carousel({ items, renderItem, className = '', trackClassName = '' }) {
    const trackRef = useRef(null);
    const pause = useRef({ hovering: false, resumeAt: 0 });

    useEffect(() => {
        const track = trackRef.current;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let position = 0;          // con decimales (scrollLeft se redondea)
        let lastTime = null;
        let onScreen = true;
        let frame = 0;

        /** Distancia exacta entre una tarjeta y su copia: ahí se cierra el bucle. */
        const loopWidth = () => {
            const firstCopy = track.children[items.length];
            return firstCopy ? firstCopy.offsetLeft - track.children[0].offsetLeft : 0;
        };
        const wrap = (value) => {
            const loop = loopWidth();
            return loop ? ((value % loop) + loop) % loop : value;
        };
        const isPaused = (now) => reduceMotion || pause.current.hovering || !onScreen || document.hidden || now < pause.current.resumeAt;

        function animate(now) {
            if (lastTime === null) lastTime = now;
            const dt = Math.min(now - lastTime, 60) / 1000;
            lastTime = now;
            if (isPaused(now)) {
                position = track.scrollLeft;   // respeta lo que la persona desplazó
            } else {
                position = wrap(position + SPEED * dt);
                track.scrollLeft = position;
            }
            frame = requestAnimationFrame(animate);
        }
        frame = requestAnimationFrame(animate);

        // Solo se anima cuando el carrusel está a la vista (ahorra batería)
        const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
        observer.observe(track);

        // Si se desplaza a mano hasta un extremo, salta a la copia equivalente sin que se note
        const onScroll = () => {
            const loop = loopWidth();
            if (!loop || !isPaused(performance.now())) return;
            if (track.scrollLeft >= loop * 1.5) track.scrollLeft -= loop;
        };
        track.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            track.removeEventListener('scroll', onScroll);
        };
    }, [items.length]);

    const pauseFor = (ms) => { pause.current.resumeAt = performance.now() + ms; };

    /** Ancho de una tarjeta más el espacio entre tarjetas. */
    function step() {
        const track = trackRef.current;
        const card = track.children[0];
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return card ? card.offsetWidth + gap : track.clientWidth;
    }

    const behavior = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

    function next() {
        pauseFor(3500);
        trackRef.current.scrollBy({ left: step(), behavior: behavior() });
    }

    function prev() {
        const track = trackRef.current;
        pauseFor(3500);
        // Al inicio no hay nada a la izquierda: se salta a la copia primero
        if (track.scrollLeft < step()) {
            const firstCopy = track.children[items.length];
            track.scrollLeft += firstCopy ? firstCopy.offsetLeft - track.children[0].offsetLeft : 0;
        }
        track.scrollBy({ left: -step(), behavior: behavior() });
    }

    return (
        <div className={`carousel ${className}`.trim()}>
            <button className="carousel-btn prev" aria-label="Anterior" onClick={prev}>
                <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div
                className={`carousel-track ${trackClassName}`.trim()}
                ref={trackRef}
                onMouseEnter={() => { pause.current.hovering = true; }}
                onMouseLeave={() => { pause.current.hovering = false; }}
                onTouchStart={() => pauseFor(4000)}
                onFocus={() => pauseFor(6000)}
            >
                {items.map((item) => renderItem(item, false))}
                {items.map((item) => renderItem(item, true))}
            </div>
            <button className="carousel-btn next" aria-label="Siguiente" onClick={next}>
                <i className="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    );
}
