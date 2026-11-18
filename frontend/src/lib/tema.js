// =====================================================
// Tema claro / oscuro compartido entre todas las páginas.
// Con las cookies de preferencias aceptadas se recuerda siempre;
// si no, solo mientras la pestaña esté abierta.
// (Cada .html aplica el tema antes de pintar con un script corto en <body>.)
// =====================================================
import { leer, guardar, borrar } from './almacenamiento.js';
import { prefsAllowed } from './consentimiento.js';
import { crearStore } from './crearStore.js';

const KEY = 'styleid_theme';

/** 'light' u 'dark' */
export function readTheme() {
    const saved = leer(KEY) || leer(KEY, 'session');
    return saved === 'light' ? 'light' : 'dark';
}

export const themeStore = crearStore(readTheme());

function apply(theme) {
    const light = theme === 'light';
    document.documentElement.classList.toggle('light-theme', light);
    document.body.classList.toggle('light-theme', light);
    themeStore.set(theme);
}

export function setTheme(theme) {
    const value = theme === 'light' ? 'light' : 'dark';
    if (prefsAllowed()) {
        guardar(KEY, value);
        borrar(KEY, 'session');
    } else {
        guardar(KEY, value, 'session');
        borrar(KEY);
    }
    apply(value);
}

/** Cuando cambia el consentimiento, el tema pasa al almacén correcto. */
export function syncThemeConsent() {
    setTheme(readTheme());
}

let installed = false;

export function installTheme() {
    if (installed) return;
    installed = true;
    apply(readTheme());
    // Si el tema cambia en otra pestaña abierta, esta también se actualiza
    window.addEventListener('storage', (e) => {
        if (e.key === KEY) apply(readTheme());
    });
}
