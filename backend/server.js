// =====================================================
// StyleID — Backend con Express + MongoDB Atlas
// Sirve la tienda de React ya compilada (frontend/dist) en /sala
// y expone la API en /api.
// =====================================================
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Sin estas variables el servidor no arranca: no hay contraseñas ni secretos por defecto
const PLACEHOLDERS = /^(admin123|cambia|tu_|pon_aqui|xxxx)/i;
const missing = ['MONGODB_URI', 'ADMIN_PASSWORD', 'ADMIN_SECRET'].filter((name) => {
    const value = String(process.env[name] || '').trim();
    return !value || PLACEHOLDERS.test(value);
});
if (missing.length) {
    console.error(`Faltan valores reales en el archivo .env: ${missing.join(', ')}`);
    console.error('Copia .env.example como .env y complétalo (ver README.md).');
    process.exit(1);
}
if (String(process.env.ADMIN_SECRET).trim().length < 16) {
    console.error('ADMIN_SECRET debe tener al menos 16 caracteres (texto largo y aleatorio).');
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// En un hosting (Render, Railway…) la IP real del visitante llega por el proxy;
// hace falta para que el límite de peticiones cuente por persona.
app.set('trust proxy', 1);

// Middlewares
app.use(cors());
// Límite más alto para recibir las fotos de productos desde el panel (se envían en base64)
app.use(express.json({ limit: '4mb' }));

// La tienda compilada (`npm run build` en la carpeta del proyecto)
const DIST = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (!fs.existsSync(path.join(DIST, 'sala.html'))) {
    console.warn('Aviso: no existe frontend/dist. Ejecuta `npm run build` para compilar la tienda (la API funciona igual).');
}

app.get('/', (req, res) => res.redirect('/sala/inicio.html'));
app.get('/inicio', (req, res) => res.redirect('/sala/inicio.html'));
app.get('/sala', (req, res) => res.redirect('/sala/sala.html'));
app.get('/sala/', (req, res) => res.redirect('/sala/sala.html'));

// Fotos de prendas guardadas sin Cloudinary (ver routes/admin.js)
app.use('/sala/img/productos', express.static(path.join(__dirname, 'uploads', 'productos')));
app.use('/sala', express.static(DIST));

// Rutas de la API
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stylist', require('./routes/stylist'));

// Ruta de salud (para comprobar que el servidor responde)
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------
// Errores: respuestas claras para personas (páginas) y programadores (JSON)
// ---------------------------------------------------------------
const crypto = require('crypto');

/** Devuelve la página de error de la tienda (404.html o 500.html) con el id del error. */
function sendErrorPage(res, status, file, errorId) {
    fs.readFile(path.join(DIST, file), 'utf8', (readErr, html) => {
        if (readErr) {
            return res.status(status).type('text/plain').send(status === 404 ? 'Página no encontrada' : 'Error interno del servidor');
        }
        res.status(status).type('html').send(html.replace('data-id=""', `data-id="${errorId || ''}"`));
    });
}

// Ruta de la API que no existe → JSON con el detalle
app.use('/api', (req, res) => {
    res.status(404).json({
        error: 'Esa ruta de la API no existe',
        codigo: 'RUTA_NO_ENCONTRADA',
        metodo: req.method,
        ruta: req.originalUrl
    });
});

// Cualquier otra dirección que no existe → página 404 de la tienda
app.use((req, res) => sendErrorPage(res, 404, '404.html'));

// Manejador de errores global
app.use((err, req, res, next) => {
    const isApi = req.originalUrl.startsWith('/api');

    // Errores de la petición (no del servidor): cuerpo mal formado o demasiado grande
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Los datos enviados no son JSON válido', codigo: 'JSON_INVALIDO' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Lo que enviaste pesa demasiado (máximo 4 MB)', codigo: 'DEMASIADO_GRANDE' });
    }

    // Error interno: se registra con un ID para poder encontrarlo en la consola
    const id = crypto.randomBytes(4).toString('hex');
    console.error(`[error ${id}] ${req.method} ${req.originalUrl}`);
    console.error(err);

    if (res.headersSent) return next(err);
    if (isApi) {
        return res.status(500).json({
            error: 'La tienda tuvo un problema. Inténtalo de nuevo en un momento.',
            codigo: 'ERROR_INTERNO',
            id
        });
    }
    sendErrorPage(res, 500, '500.html', id);
});

// 3002 por defecto: en desarrollo, Vite (puerto 5173) reenvía /api a este puerto
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log('Conectado a MongoDB Atlas');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log(`  - Inicio:  http://localhost:${PORT}/inicio`);
            console.log(`  - Tienda:  http://localhost:${PORT}/sala`);
        });
    })
    .catch((err) => {
        console.error('No se pudo conectar a MongoDB Atlas:', err.message);
        process.exit(1);
    });
