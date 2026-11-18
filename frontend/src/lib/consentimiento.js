// =====================================================
// Consentimiento de cookies.
//  - necesarias: sesión, carrito y número de invitado (siempre activas)
//  - preferencias: recordar el tema claro u oscuro entre visitas
// =====================================================
import { leerJSON, guardarJSON } from './almacenamiento.js';
import { crearStore } from './crearStore.js';

const KEY = 'styleid_consent';
const VERSION = 1;

export function getConsent() {
    const value = leerJSON(KEY, null);
    return value && value.v === VERSION ? value : null;
}

export function prefsAllowed() {
    return !!getConsent()?.preferencias;
}

export function saveConsent(preferencias) {
    const consent = { v: VERSION, necesarias: true, preferencias: !!preferencias, fecha: new Date().toISOString() };
    guardarJSON(KEY, consent);
    return consent;
}

/** true mientras la ventana de «Configurar cookies» está abierta. */
export const cookieSettingsStore = crearStore(false);

/** Para los enlaces «Configurar cookies» del pie de página. */
export function openCookieSettings(e) {
    e?.preventDefault();
    cookieSettingsStore.set(true);
}
