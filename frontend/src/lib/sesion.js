// =====================================================
// Sesión de la persona que compra.
//  - styleid_session: nombre de usuario con sesión iniciada
//  - styleid_token:   token firmado que entrega el servidor al entrar
//  - styleid_guest_id: id aleatorio para comprar como invitado
// =====================================================
import { leer, guardar, borrar } from './almacenamiento.js';

const SESSION_KEY = 'styleid_session';
const TOKEN_KEY = 'styleid_token';
const GUEST_KEY = 'styleid_guest_id';

/** Nombre de la persona con sesión iniciada ('' si no hay). */
export function getSession() {
    return leer(SESSION_KEY) || '';
}

/** Token que prueba quién eres ante la API (solo con sesión iniciada). */
export function getToken() {
    return getSession() ? leer(TOKEN_KEY) || '' : '';
}

export function startSession(user, token) {
    guardar(SESSION_KEY, user);
    if (token) guardar(TOKEN_KEY, token);
}

export function endSession() {
    borrar(SESSION_KEY);
    borrar(TOKEN_KEY);
}

/** Id del invitado de este navegador ('' si nunca compró como invitado). */
export function getGuestId() {
    return leer(GUEST_KEY) || '';
}

/** Id para el carrito y los pedidos: la sesión o un invitado (lo crea si falta). */
export function getUserId() {
    const session = getSession();
    if (session) return session;
    let guest = getGuestId();
    if (!guest) {
        guest = 'invitado_' + Math.random().toString(36).slice(2, 10);
        guardar(GUEST_KEY, guest);
    }
    return guest;
}
