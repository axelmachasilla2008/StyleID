// =====================================================
// StyleID — Utilidades de seguridad compartidas por las rutas
//  - Sesión de usuario: token firmado (HMAC) que prueba quién es
//  - Validación de identificadores (evita operadores de MongoDB)
//  - Límite de peticiones en memoria (sin dependencias)
// =====================================================
const crypto = require('crypto');

const SECRET = String(process.env.ADMIN_SECRET || '');

/** Compara en tiempo constante. */
function safeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/** Token de sesión de un usuario registrado (no caduca; cambia si cambia ADMIN_SECRET). */
function userToken(user) {
    return crypto.createHmac('sha256', SECRET).update(`usuario:${String(user).toLowerCase()}`).digest('hex');
}

const GUEST_RE = /^invitado_[a-z0-9]{6,20}$/;

/** Devuelve el valor solo si es un texto corto; si no, cadena vacía (bloquea objetos tipo {$ne:null}). */
function asText(value, max = 120) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Middleware: comprueba que quien llama es el dueño del userId.
 *  - Invitados: su id aleatorio (invitado_xxxxxxxx) es el propio secreto.
 *  - Usuarios registrados: deben enviar el token que recibieron al iniciar sesión.
 * Deja el id validado en req.userId.
 */
function requireOwner(req, res, next) {
    const userId = asText((req.body && req.body.userId) || req.query.userId, 60);
    if (!userId) return res.status(400).json({ error: 'Falta userId', codigo: 'FALTA_USUARIO' });

    if (userId.startsWith('invitado_')) {
        if (!GUEST_RE.test(userId)) return res.status(400).json({ error: 'Identificador de invitado no válido', codigo: 'USUARIO_INVALIDO' });
    } else {
        const token = req.header('x-user-token') || '';
        if (!token || !safeEqual(token, userToken(userId))) {
            return res.status(401).json({
                error: 'Tu sesión caducó. Inicia sesión de nuevo.',
                codigo: 'SESION_REQUERIDA'
            });
        }
    }
    req.userId = userId;
    next();
}

/**
 * Límite de peticiones por IP: como mucho `max` en `windowMs` milisegundos.
 * Suficiente para un solo servidor; se reinicia al reiniciar el backend.
 */
function rateLimit({ windowMs, max, message }) {
    const hits = new Map();
    const timer = setInterval(() => {
        const now = Date.now();
        hits.forEach((entry, key) => { if (entry.reset <= now) hits.delete(key); });
    }, windowMs);
    timer.unref();

    return (req, res, next) => {
        const key = req.ip || 'desconocido';
        const now = Date.now();
        let entry = hits.get(key);
        if (!entry || entry.reset <= now) {
            entry = { count: 0, reset: now + windowMs };
            hits.set(key, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            const seconds = Math.ceil((entry.reset - now) / 1000);
            res.set('Retry-After', String(seconds));
            return res.status(429).json({
                error: message || 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
                codigo: 'DEMASIADAS_PETICIONES',
                esperaSegundos: seconds
            });
        }
        next();
    };
}

module.exports = { safeEqual, userToken, asText, requireOwner, rateLimit };
