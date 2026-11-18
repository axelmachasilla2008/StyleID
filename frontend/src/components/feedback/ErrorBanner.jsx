import { Fragment, useEffect, useRef, useState } from 'react';
import { useStore } from '../../lib/crearStore.js';
import { avisoStore, hideAviso } from '../../lib/avisos.js';

const ICONS = {
    red: 'fa-plug-circle-xmark',
    servidor: 'fa-screwdriver-wrench',
    offline: 'fa-wifi',
    script: 'fa-bug',
    ok: 'fa-circle-check'
};

/**
 * Aviso de error de la tienda (sin conexión, servidor caído, sesión caducada…).
 * Lo controla lib/avisos.js.
 */
export default function ErrorBanner() {
    const aviso = useStore(avisoStore);
    const last = useRef(null);        // el último aviso sigue visible mientras se oculta
    const [open, setOpen] = useState(false);
    const [techOpen, setTechOpen] = useState(false);

    if (aviso) last.current = aviso;

    useEffect(() => {
        setTechOpen(false);
        if (!aviso) { setOpen(false); return undefined; }
        const frame = requestAnimationFrame(() => setOpen(true));
        return () => cancelAnimationFrame(frame);
    }, [aviso]);

    const shown = last.current;
    if (!shown) return null;
    const isOk = shown.kind === 'ok';

    function mainAction() {
        if (shown.action?.href) location.href = shown.action.href;
        else location.reload();
    }

    return (
        <div className={`app-error${open ? ' is-open' : ''}${isOk ? ' is-ok' : ''}`} role="alert">
            <div className="app-error-main">
                <span className="app-error-icon">
                    <i className={`fa-solid ${ICONS[shown.kind] || ICONS.script}`} aria-hidden="true"></i>
                </span>
                <div className="app-error-text">
                    <strong>{shown.title}</strong>
                    <p>{shown.text}</p>
                    <div className="app-error-actions" hidden={isOk}>
                        <button type="button" className="primary" onClick={mainAction}>
                            {shown.action?.label || 'Reintentar'}
                        </button>
                        <button type="button" aria-expanded={techOpen} onClick={() => setTechOpen((v) => !v)}>
                            Detalles técnicos
                        </button>
                    </div>
                </div>
                <button type="button" className="app-error-close" aria-label="Cerrar aviso" onClick={hideAviso}>
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>
            <div className="error-tech" hidden={!techOpen}>
                <dl>
                    {shown.details.map(([name, value]) => (
                        <Fragment key={name}>
                            <dt>{name}</dt>
                            <dd>{String(value)}</dd>
                        </Fragment>
                    ))}
                </dl>
                {/* La pista la escribimos nosotros (lib/avisos.js) y puede traer <code> */}
                <p className="error-hint" dangerouslySetInnerHTML={{ __html: shown.hint || '' }}></p>
            </div>
        </div>
    );
}
