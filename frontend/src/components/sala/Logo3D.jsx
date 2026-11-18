import { useEffect, useRef } from 'react';
import { LOGO_CLARO } from '../../data/destacados.js';

const LAYERS = 14;     // más capas = canto más sólido
const STEP = 1.6;      // px entre capas (grosor total ≈ 22px)
const LIMIT_Y = 70;    // no se gira tanto como para verlo al revés
const LIMIT_X = 35;
const clamp = (v, max) => Math.max(-max, Math.min(max, v));

/**
 * Logo 3D del hero: capas del logo apiladas para darle volumen.
 * Se mece suave como una percha colgada y se puede arrastrar o girar con el teclado.
 */
export default function Logo3D() {
    const cubeRef = useRef(null);
    const motion = useRef({ rotX: 8, rotY: 0, velX: 0, velY: 0, dragging: false, swaying: true, lastX: 0, lastY: 0 });

    const half = ((LAYERS - 1) * STEP) / 2;

    useEffect(() => {
        const cube = cubeRef.current;
        const m = motion.current;
        m.swaying = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let frame = 0;

        const render = () => { cube.style.transform = `rotateX(${m.rotX}deg) rotateY(${m.rotY}deg)`; };

        function animate(now) {
            if (!document.hidden && !m.dragging) {
                if (Math.abs(m.velX) > 0.05 || Math.abs(m.velY) > 0.05) {
                    // Inercia al soltar, se va frenando
                    m.rotY = clamp(m.rotY + m.velY, LIMIT_Y);
                    m.rotX = clamp(m.rotX + m.velX, LIMIT_X);
                    m.velY *= 0.92;
                    m.velX *= 0.92;
                } else if (m.swaying) {
                    // Vaivén suave: vuelve poco a poco a la posición de reposo
                    m.rotY += (Math.sin(now / 1900) * 26 - m.rotY) * 0.035;
                    m.rotX += (8 + Math.sin(now / 2600) * 6 - m.rotX) * 0.035;
                }
            }
            render();
            frame = requestAnimationFrame(animate);
        }
        render();
        frame = requestAnimationFrame(animate);

        // Soltar también fuera del logo (con setPointerCapture el arrastre sigue afuera)
        const stop = () => { m.dragging = false; };
        window.addEventListener('pointerup', stop);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('pointerup', stop);
        };
    }, []);

    function onPointerDown(e) {
        const m = motion.current;
        m.dragging = true;
        m.velX = m.velY = 0;
        m.lastX = e.clientX;
        m.lastY = e.clientY;
        try { cubeRef.current.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
    }

    function onPointerMove(e) {
        const m = motion.current;
        if (!m.dragging) return;
        const dx = e.clientX - m.lastX;
        const dy = e.clientY - m.lastY;
        m.rotY = clamp(m.rotY + dx * 0.5, LIMIT_Y);
        m.rotX = clamp(m.rotX - dy * 0.5, LIMIT_X);
        m.velY = dx * 0.4;
        m.velX = -dy * 0.4;
        m.lastX = e.clientX;
        m.lastY = e.clientY;
    }

    function onKeyDown(e) {
        const m = motion.current;
        const step = e.shiftKey ? 12 : 4;
        const keys = {
            ArrowLeft: () => { m.rotY = clamp(m.rotY - step, LIMIT_Y); m.swaying = false; },
            ArrowRight: () => { m.rotY = clamp(m.rotY + step, LIMIT_Y); m.swaying = false; },
            ArrowUp: () => { m.rotX = clamp(m.rotX - step, LIMIT_X); m.swaying = false; },
            ArrowDown: () => { m.rotX = clamp(m.rotX + step, LIMIT_X); m.swaying = false; },
            ' ': () => { m.swaying = !m.swaying; }
        };
        if (!keys[e.key]) return;
        e.preventDefault();
        keys[e.key]();
        m.velX = m.velY = 0;
    }

    const stopDrag = () => { motion.current.dragging = false; };

    return (
        <div
            className="logo3d" id="logoCube" ref={cubeRef} title="Arrastra para girar" tabIndex={0} role="img"
            aria-label="Logo 3D de StyleID. Arrástralo o usa las flechas del teclado para girarlo."
            style={{ '--logo': `url("${LOGO_CLARO}")` }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag}
            onKeyDown={onKeyDown}
        >
            <div className="layer shadow" style={{ transform: `translateZ(${-half - 26}px)` }}></div>
            {Array.from({ length: LAYERS - 1 }, (_, i) => (
                <div key={i} className="layer edge" style={{ transform: `translateZ(${-half + i * STEP}px)` }}></div>
            ))}
            <div className="layer front" style={{ transform: `translateZ(${half}px)` }}></div>
        </div>
    );
}
