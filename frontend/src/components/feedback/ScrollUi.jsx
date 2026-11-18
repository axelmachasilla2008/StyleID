import { useEffect, useRef, useState } from 'react';

/** Barra de progreso de lectura y botón «volver arriba». */
export default function ScrollUi() {
    const barRef = useRef(null);
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        let ticking = false;
        const update = () => {
            ticking = false;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const y = window.scrollY;
            if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
            setShowTop(y > 700);
        };
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    function toTop() {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }

    return (
        <>
            <div className="scroll-progress" aria-hidden="true" ref={barRef}></div>
            <button type="button" className={`to-top${showTop ? ' is-on' : ''}`} aria-label="Volver arriba" title="Volver arriba" onClick={toTop}>
                <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
            </button>
        </>
    );
}
