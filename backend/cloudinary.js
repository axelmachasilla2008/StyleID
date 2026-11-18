// =====================================================
// StyleID — Subida de fotos a Cloudinary (sin librerías extra)
//
// Con CLOUDINARY_URL en el .env (cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
// las fotos de las prendas se suben a la nube y se guarda solo su link.
// Sin esa variable, admin.js guarda las fotos en backend/uploads/productos/.
// =====================================================
const crypto = require('crypto');

const FOLDER = 'styleid/productos';

const clean = (value) => String(value || '').trim().replace(/^["']|["']$/g, '');

/**
 * Acepta la línea completa (CLOUDINARY_URL=cloudinary://KEY:SECRET@CLOUD)
 * o los tres datos por separado (CLOUD_NAME, API_KEY, API_SECRET).
 */
function readConfig() {
    const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(clean(process.env.CLOUDINARY_URL));
    if (match) return { apiKey: match[1], apiSecret: match[2], cloudName: match[3].replace(/\/+$/, '') };

    const cloudName = clean(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = clean(process.env.CLOUDINARY_API_KEY);
    const apiSecret = clean(process.env.CLOUDINARY_API_SECRET);
    if (cloudName && apiKey && apiSecret) return { apiKey, apiSecret, cloudName };
    return null;
}

const config = readConfig();
const partial = !config && ['CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .some((name) => clean(process.env[name]));

if (partial) {
    console.error('  - Fotos: faltan datos de Cloudinary (Cloud name, API Key y API Secret); se guardan en el PC');
} else {
    console.log(config
        ? `  - Fotos: se suben a Cloudinary (${config.cloudName})`
        : '  - Fotos: se guardan en backend/uploads/productos (agrega CLOUDINARY_URL en .env para subirlas a la nube)');
}

/**
 * Firma de Cloudinary: parámetros ordenados + secreto, en SHA-1.
 * No se firman file, api_key, cloud_name ni resource_type.
 */
const UNSIGNED = ['file', 'api_key', 'cloud_name', 'resource_type'];
function sign(params) {
    const toSign = Object.keys(params)
        .filter((key) => !UNSIGNED.includes(key))
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');
    return crypto.createHash('sha1').update(toSign + config.apiSecret).digest('hex');
}

async function call(action, params) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = { ...params, timestamp };
    const form = new FormData();
    Object.entries(signed).forEach(([key, value]) => form.append(key, String(value)));
    form.append('api_key', config.apiKey);
    form.append('signature', sign(signed));

    const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/${action}`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(30000)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = (body.error && body.error.message) || res.statusText;
        throw new Error(`Cloudinary ${res.status}: ${message}`);
    }
    return body;
}

/**
 * Sube una foto (data URL) y devuelve { url, id }.
 * La URL pide a Cloudinary formato y calidad automáticos (WebP/AVIF, ligera).
 */
async function uploadImage(dataUrl, baseName) {
    const result = await call('upload', {
        file: dataUrl,
        folder: FOLDER,
        public_id: `${baseName}-${Date.now()}`
    });
    const url = String(result.secure_url).replace('/image/upload/', '/image/upload/f_auto,q_auto,w_1000,c_limit/');
    return { url, id: result.public_id };
}

/** Borra una foto de Cloudinary por su id (no falla si ya no existe). */
async function deleteImage(id) {
    if (!id) return;
    try {
        await call('destroy', { public_id: id, invalidate: 'true' });
    } catch (err) {
        console.error('No se pudo borrar la foto en Cloudinary:', err.message);
    }
}

module.exports = {
    enabled: Boolean(config),
    uploadImage,
    deleteImage
};
