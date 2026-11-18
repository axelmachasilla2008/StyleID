// =====================================================
// Llamadas a la API de Express.
// Siempre al mismo origen: en producción Express sirve la tienda y la API;
// en desarrollo Vite reenvía /api al puerto 3002 (vite.config.js).
// =====================================================
import { getToken, endSession } from './sesion.js';
import { reportApiResponse, reportNetworkError } from './avisos.js';

/**
 * Hace una petición y devuelve el JSON de la respuesta.
 * Si falla, lanza un Error con el mensaje del servidor (err.status trae el código).
 *
 * @param {string} path              p. ej. '/api/cart?userId=...'
 * @param {object} [options]
 * @param {string} [options.method]  GET, POST, PUT o DELETE
 * @param {object} [options.body]    se envía como JSON
 * @param {string} [options.admin]   token del panel de administrador
 */
export async function api(path, { method = 'GET', body, admin } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers['x-user-token'] = token;
    if (admin) headers['x-admin-token'] = admin;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let res;
    try {
        res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (err) {
        reportNetworkError(method, path, err);
        throw Object.assign(new Error('No se pudo conectar con la tienda. Inténtalo de nuevo.'), { status: 0 });
    }

    const data = await res.json().catch(() => null);
    reportApiResponse(method, path, res, data);

    if (!res.ok) {
        // Sesión antigua o caducada: se borra para que la persona entre de nuevo
        if (res.status === 401 && data?.codigo === 'SESION_REQUERIDA') endSession();
        throw Object.assign(new Error(data?.error || 'Algo salió mal. Inténtalo de nuevo.'), { status: res.status, data });
    }
    return data;
}
