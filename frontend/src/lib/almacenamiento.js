// =====================================================
// Lectura y escritura segura en el navegador (localStorage / sessionStorage).
// Si el navegador bloquea el almacenamiento (modo privado, permisos), la
// tienda sigue funcionando: solo no recuerda nada entre visitas.
// =====================================================

function pick(kind) {
    try {
        return kind === 'session' ? window.sessionStorage : window.localStorage;
    } catch (err) {
        return null;
    }
}

export function leer(key, kind = 'local') {
    try {
        return pick(kind)?.getItem(key) ?? null;
    } catch (err) {
        return null;
    }
}

export function guardar(key, value, kind = 'local') {
    try {
        pick(kind)?.setItem(key, value);
    } catch (err) { /* sin almacenamiento */ }
}

export function borrar(key, kind = 'local') {
    try {
        pick(kind)?.removeItem(key);
    } catch (err) { /* sin almacenamiento */ }
}

export function leerJSON(key, fallback, kind = 'local') {
    try {
        const value = JSON.parse(leer(key, kind) ?? 'null');
        return value ?? fallback;
    } catch (err) {
        return fallback;
    }
}

export function guardarJSON(key, value, kind = 'local') {
    guardar(key, JSON.stringify(value), kind);
}
