// =====================================================
// Utilidades de texto, números y fechas.
// =====================================================

/** Quita tildes y pasa a minúsculas para comparar sin errores de escritura. */
export function normalizeText(text) {
    return String(text ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
}

/** Convierte el nombre de una prenda en su id (el mismo que usan las opiniones). */
export function slug(text) {
    return normalizeText(text)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/** $12.50 */
export function money(value) {
    return '$' + Number(value || 0).toFixed(2);
}

/** «1 prenda», «3 prendas» */
export function plural(n, one, many) {
    return `${n} ${n === 1 ? one : many}`;
}

/** 4 nov 2026 */
export function shortDate(value) {
    try {
        return new Date(value).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (err) {
        return '';
    }
}

/** Copia texto al portapapeles (con respaldo para navegadores sin permiso). */
export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.setAttribute('readonly', '');
        temp.style.cssText = 'position:fixed;opacity:0';
        document.body.append(temp);
        temp.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err2) { ok = false; }
        temp.remove();
        return ok;
    }
}
