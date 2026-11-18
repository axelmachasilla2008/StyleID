// =====================================================
// Avisos de error de la tienda.
// Vigila las llamadas a la API, la conexión a internet y los errores de
// JavaScript. El componente <ErrorBanner /> muestra un aviso claro para
// cualquier persona y, en «Detalles técnicos», lo que necesita un programador.
// =====================================================
import { crearStore } from './crearStore.js';

/**
 * Aviso visible (o null):
 * { kind: 'red'|'servidor'|'offline'|'script'|'ok', title, text, details: [[nombre, valor]], hint, action: { label, href } }
 */
export const avisoStore = crearStore(null);
let hideTimer = null;
let scriptShown = false;
let failedRequest = '';

export function showAviso(kind, title, text, details = [], hint = '', action = null) {
    clearTimeout(hideTimer);
    avisoStore.set({
        kind,
        title,
        text,
        hint,
        action,
        details: details.concat([['Página', location.href], ['Hora', new Date().toISOString()]])
    });
    if (kind === 'ok') hideTimer = setTimeout(hideAviso, 3200);
}

export function hideAviso() {
    failedRequest = '';
    avisoStore.set(null);
}

const currentKind = () => avisoStore.get()?.kind || '';

// ---------- Llamadas a la API (las informa lib/api.js) ----------

export function reportApiResponse(method, url, res, data) {
    if (res.status === 401 && data?.codigo === 'SESION_REQUERIDA') {
        failedRequest = `${method} ${url}`;
        showAviso(
            'servidor',
            'Tu sesión caducó',
            'Por seguridad, inicia sesión otra vez para ver tu carrito y tus pedidos.',
            [['Petición', `${method} ${url}`], ['Respuesta', '401 SESION_REQUERIDA']],
            'El backend exige la cabecera <code>x-user-token</code>, que se obtiene en <code>/api/users/login</code>.',
            { label: 'Iniciar sesión', href: 'inicio.html' }
        );
        return;
    }
    if (res.status >= 500) {
        failedRequest = `${method} ${url}`;
        showAviso(
            'servidor',
            'La tienda tuvo un problema',
            'No es culpa tuya. Espera unos segundos y vuelve a intentarlo; lo que ya tenías guardado sigue ahí.',
            [
                ['Petición', `${method} ${url}`],
                ['Respuesta', `${res.status} ${res.statusText}`],
                ['ID del error', data?.id || '(sin id)'],
                ['Mensaje', data?.error || '(sin mensaje)']
            ],
            'El backend respondió con un error interno. Busca el <strong>ID del error</strong> en la consola del servidor para ver la traza completa.'
        );
        return;
    }
    // Un éxito de otra ruta no resuelve el fallo ni una sesión caducada
    if (res.ok && (currentKind() === 'red' || (currentKind() === 'servidor' && failedRequest === `${method} ${url}`))) hideAviso();
}

export function reportNetworkError(method, url, err) {
    if (err?.name === 'AbortError') return;
    if (!navigator.onLine) {
        showOffline();
        return;
    }
    showAviso(
        'red',
        'No pudimos conectar con la tienda',
        'Puede ser un corte momentáneo. Revisa tu internet y toca «Reintentar».',
        [['Petición', `${method} ${url}`], ['Error', `${err?.name}: ${err?.message}`]],
        'El servidor no respondió (caído, apagado o bloqueado). En desarrollo: ejecuta <code>npm run dev</code> en la carpeta del proyecto y abre la tienda desde <code>http://localhost:5173/sala/</code>.'
    );
}

// ---------- Conexión a internet y errores de JavaScript ----------

function showOffline() {
    showAviso(
        'offline',
        'Estás sin conexión a internet',
        'Puedes seguir viendo la página, pero no podrás comprar ni ver tus pedidos hasta que vuelva la conexión.',
        [['navigator.onLine', 'false']],
        'El navegador informa que no hay red. Las llamadas a <code>/api</code> fallarán hasta que vuelva.'
    );
}

function scriptError(message, where, stack) {
    // Una sola vez por página, y sin tapar un aviso más importante
    if (scriptShown || currentKind()) return;
    scriptShown = true;
    showAviso(
        'script',
        'Algo no funcionó como debía',
        'Una parte de la página falló. Recarga para volver a intentarlo; si se repite, avísanos.',
        [['Error', message], ['Dónde', where || '(desconocido)'], ['Traza', stack || '(sin traza)']],
        'Error de JavaScript no controlado. Abre la consola del navegador (F12) para ver el detalle completo.'
    );
}

let installed = false;

/** Se llama una vez al cargar cada página (main/montar.jsx). */
export function installErrorWatchers() {
    if (installed) return;
    installed = true;

    window.addEventListener('offline', showOffline);
    window.addEventListener('online', () => {
        if (currentKind() === 'offline' || currentKind() === 'red') {
            showAviso('ok', 'Conexión recuperada', 'Ya puedes seguir comprando con normalidad.');
        }
    });

    window.addEventListener('error', (e) => {
        // Ignora recursos que no cargan (imágenes) y errores de scripts de otros sitios
        if (!e.message || e.message === 'Script error.' || /ResizeObserver/.test(e.message)) return;
        scriptError(e.message, e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : '', e.error?.stack);
    });

    window.addEventListener('unhandledrejection', (e) => {
        const reason = e.reason;
        // Una cancelación no es un fallo; los TypeError sí pueden ser errores de código
        if (!reason || reason.name === 'AbortError') return;
        // Animación de cambio de página cancelada por el navegador (no es un fallo de la tienda)
        if (reason.name === 'InvalidStateError' || /transition/i.test(String(reason.message || ''))) {
            e.preventDefault();   // tampoco se muestra como error en la consola
            return;
        }
        scriptError(reason.message || String(reason), 'Promesa sin controlar', reason.stack);
    });
}
