import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../lib/crearStore.js';
import { cookieSettingsStore, getConsent, saveConsent } from '../../lib/consentimiento.js';
import { syncThemeConsent } from '../../lib/tema.js';

function CookieIcon() {
    return (
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M21.6 11.2a3 3 0 0 1-3.5-3.3 3 3 0 0 1-3.9-3.9 3.1 3.1 0 0 1-1.1-1.8A10 10 0 1 0 22 12c0-.3 0-.5-.4-.8ZM7.5 10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm6 1.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1.5-5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
        </svg>
    );
}

/**
 * Aviso de cookies: aparece la primera vez y guarda la elección.
 * Los enlaces «Configurar cookies» abren la ventana de configuración.
 */
export default function CookieBanner() {
    const [banner, setBanner] = useState('off');           // 'off' | 'closed' | 'open'
    const settingsOpen = useStore(cookieSettingsStore);
    const [prefs, setPrefs] = useState(true);
    const dialogRef = useRef(null);
    const lastFocused = useRef(null);

    // La primera visita muestra el aviso después de un momento
    useEffect(() => {
        if (getConsent()) return undefined;
        const timer = setTimeout(() => {
            setBanner('closed');
            requestAnimationFrame(() => setBanner('open'));
        }, 700);
        return () => clearTimeout(timer);
    }, []);

    // Al abrir la configuración se marca la elección actual y se enfoca la ventana
    useEffect(() => {
        if (!settingsOpen) return;
        const consent = getConsent();
        setPrefs(consent ? consent.preferencias : true);
        lastFocused.current = document.activeElement;
        requestAnimationFrame(() => dialogRef.current?.focus());
    }, [settingsOpen]);

    function choose(preferencias) {
        saveConsent(preferencias);
        syncThemeConsent();
        closeSettings();
        if (banner !== 'off') {
            setBanner('closed');
            setTimeout(() => setBanner('off'), 400);
        }
    }

    function closeSettings() {
        if (!cookieSettingsStore.get()) return;
        cookieSettingsStore.set(false);
        lastFocused.current?.focus?.();
    }

    function onDialogKey(e) {
        if (e.key === 'Escape') { e.stopPropagation(); closeSettings(); return; }
        if (e.key !== 'Tab') return;
        // Mantiene el foco dentro de la ventana
        const items = [...dialogRef.current.querySelectorAll('button, input')];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    return (
        <>
            {banner !== 'off' && (
                <section className={`cookie-banner${banner === 'open' ? ' is-open' : ''}`} role="region" aria-label="Aviso de cookies">
                    <div className="cookie-banner-head">
                        <span className="cookie-icon"><CookieIcon /></span>
                        <h2>Usamos cookies</h2>
                    </div>
                    <p>
                        Guardamos algunos datos en tu navegador para que funcionen tu sesión y tu carrito, y para recordar si prefieres el tema claro u oscuro. No usamos publicidad ni rastreo.{' '}
                        <a href="informacion.html#cookies">Más información</a>
                    </p>
                    <div className="cookie-actions">
                        <button type="button" className="cookie-btn primary" onClick={() => choose(true)}>Aceptar todas</button>
                        <button type="button" className="cookie-btn" onClick={() => choose(false)}>Solo necesarias</button>
                        <button type="button" className="cookie-btn link" onClick={() => cookieSettingsStore.set(true)}>Configurar</button>
                    </div>
                </section>
            )}

            <div
                className={`cookie-modal${settingsOpen ? ' is-open' : ''}`}
                onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}
            >
                <div className="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="cookieDialogTitle" tabIndex={-1} ref={dialogRef} onKeyDown={onDialogKey}>
                    <div className="cookie-banner-head">
                        <span className="cookie-icon"><CookieIcon /></span>
                        <h2 id="cookieDialogTitle">Configurar cookies</h2>
                    </div>
                    <p>Elige qué datos podemos guardar en tu navegador. Puedes cambiarlo cuando quieras desde el pie de página.</p>

                    <div className="cookie-option">
                        <div>
                            <h3>Necesarias</h3>
                            <p>Mantienen tu sesión iniciada, tu carrito, tus favoritos y tus pedidos. Sin ellas la tienda no funciona.</p>
                        </div>
                        <span className="cookie-always">Siempre activas</span>
                    </div>

                    <label className="cookie-option">
                        <div>
                            <h3>Preferencias</h3>
                            <p>Recuerdan si elegiste el tema claro u oscuro la próxima vez que entres.</p>
                        </div>
                        <span className="cookie-switch">
                            <input type="checkbox" id="cookiePrefs" checked={prefs} onChange={(e) => setPrefs(e.target.checked)} />
                            <span aria-hidden="true"></span>
                            <span className="sr-only">Permitir cookies de preferencias</span>
                        </span>
                    </label>

                    <div className="cookie-actions">
                        <button type="button" className="cookie-btn primary" onClick={() => choose(prefs)}>Guardar mi elección</button>
                        <button type="button" className="cookie-btn" onClick={() => choose(true)}>Aceptar todas</button>
                    </div>
                </div>
            </div>
        </>
    );
}
