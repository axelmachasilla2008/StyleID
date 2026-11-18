const express = require('express');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const Order = require('../models/Order');
const User = require('../models/User');
const Message = require('../models/Message');
const Product = require('../models/Product');
const cloudinary = require('../cloudinary');
const { safeEqual, rateLimit } = require('../seguridad');
const { CATALOG, COLORS, STYLES } = require('../catalogo');

const COLOR_IDS = COLORS.map((c) => c.id);
const STYLE_IDS = STYLES.map((s) => s.id);

const router = express.Router();

// server.js no arranca si faltan estas dos variables (no hay valores por defecto)
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '');
const ADMIN_SECRET = String(process.env.ADMIN_SECRET || '');
const TOKEN_HOURS = 12;

/** Firma una fecha de caducidad con el secreto (HMAC, sin dependencias). */
function signExpiry(expires) {
    return crypto.createHmac('sha256', ADMIN_SECRET).update(`styleid-admin:${expires}`).digest('hex');
}

/** Token de administrador «caducidad.firma»: deja de servir a las 12 horas. */
function makeToken() {
    const expires = Date.now() + TOKEN_HOURS * 60 * 60 * 1000;
    return `${expires}.${signExpiry(expires)}`;
}

/** Verifica que la petición traiga un token de administrador válido y vigente. */
function isAdmin(req) {
    const [expires, signature] = String(req.header('x-admin-token') || '').split('.');
    if (!expires || !signature || !/^\d+$/.test(expires)) return false;
    if (Number(expires) < Date.now()) return false;
    return safeEqual(signature, signExpiry(expires));
}

// Frena los intentos de adivinar la contraseña: 8 intentos cada 15 minutos por IP
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, message: 'Demasiados intentos. Espera 15 minutos.' });

// POST /api/admin/login — ingreso del administrador { password }
router.post('/login', loginLimit, (req, res) => {
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!password || !safeEqual(password, ADMIN_PASSWORD)) {
        return res.status(401).json({ error: 'Contraseña de administrador incorrecta' });
    }
    res.json({ token: makeToken(), expiraEnHoras: TOKEN_HOURS });
});

// GET /api/admin/orders — todas las órdenes (requiere token)
router.get('/orders', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
});

// GET /api/admin/stats — resumen para el panel (requiere token)
router.get('/stats', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try {
        const totalOrders = await Order.countDocuments();
        const users = await User.countDocuments();
        const pendingRequests = await Message.countDocuments({ type: 'pedido', status: 'nuevo' });
        const revenueAgg = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        res.json({
            totalOrders,
            users,
            pendingRequests,
            revenue: revenueAgg.length ? revenueAgg[0].total : 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener las estadísticas' });
    }
});

const ORDER_STAGES = ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'];

// PUT /api/admin/orders/:id — cambiar la etapa, la guía o la nota { status, guia, note }
router.put('/orders/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { status, guia, note } = req.body;
        if (status !== undefined && !ORDER_STAGES.includes(status)) {
            return res.status(400).json({ error: 'Etapa no válida' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

        // Solo se anota en el historial cuando la etapa cambia de verdad
        if (status !== undefined && status !== order.status) {
            order.status = status;
            order.history.push({ status });
        }
        if (guia !== undefined) order.guia = String(guia).trim().slice(0, 40);
        if (note !== undefined) order.note = String(note).trim().slice(0, 300);

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar la orden' });
    }
});

// GET /api/admin/messages — comentarios y pedidos personalizados (requiere token)
router.get('/messages', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try {
        const messages = await Message.find().sort({ createdAt: -1 }).limit(200);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los mensajes' });
    }
});

// PUT /api/admin/messages/:id — marcar como nuevo o atendido { status }
router.put('/messages/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const status = req.body.status === 'atendido' ? 'atendido' : 'nuevo';
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!message) return res.status(404).json({ error: 'Mensaje no encontrado' });
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el mensaje' });
    }
});

// DELETE /api/admin/messages/:id — eliminar un mensaje (requiere token)
router.delete('/messages/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try {
        const message = await Message.findByIdAndDelete(req.params.id);
        if (!message) return res.status(404).json({ error: 'Mensaje no encontrado' });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el mensaje' });
    }
});

// =====================================================
// Productos del catálogo (agregados desde el panel)
// =====================================================

// Sin Cloudinary, las fotos se guardan en backend/uploads/productos/ y
// server.js las sirve en /sala/img/productos/ (la misma ruta de siempre)
const PRODUCT_IMG_DIR = path.join(__dirname, '..', 'uploads', 'productos');
const PRODUCT_IMG_URL = './img/productos/';
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const GENEROS = ['mujer', 'hombre'];
const CATEGORIAS = ['camisas', 'pantalones', 'zapatos', 'accesorios', 'bolsos', 'conjuntos'];

function slug(text) {
    return String(text)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'producto';
}

/**
 * Guarda una imagen enviada como data URL y devuelve { img, imgId }.
 * Con Cloudinary configurado se sube a la nube (solo se guarda el link);
 * si no, se guarda en backend/uploads/productos/.
 */
async function saveProductImage(dataUrl, name) {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
    if (!match) throw Object.assign(new Error('La foto debe ser JPG, PNG o WEBP'), { status: 400 });

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_IMAGE_BYTES) {
        throw Object.assign(new Error('La foto pesa más de 2 MB'), { status: 400 });
    }

    if (cloudinary.enabled) {
        try {
            const { url, id } = await cloudinary.uploadImage(dataUrl, slug(name));
            return { img: url, imgId: id };
        } catch (err) {
            console.error('Subida a Cloudinary fallida:', err.message);
            throw Object.assign(new Error('No se pudo subir la foto a la nube. Inténtalo de nuevo.'), { status: 502 });
        }
    }

    const fileName = `${slug(name)}-${Date.now()}.${IMAGE_TYPES[match[1]]}`;
    await fs.mkdir(PRODUCT_IMG_DIR, { recursive: true });
    await fs.writeFile(path.join(PRODUCT_IMG_DIR, fileName), buffer);
    return { img: PRODUCT_IMG_URL + fileName, imgId: '' };
}

/** Borra la foto de un producto: en Cloudinary o en la carpeta de productos. */
async function removeProductImage(product) {
    if (product.imgId) {
        await cloudinary.deleteImage(product.imgId);
        return;
    }
    const img = product.img;
    if (!img || !img.startsWith(PRODUCT_IMG_URL)) return;
    const fileName = path.basename(img);
    await fs.unlink(path.join(PRODUCT_IMG_DIR, fileName)).catch(() => {});
}

// GET /api/admin/products — todos los productos, también los ocultos
router.get('/products', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try {
        res.json(await Product.find().sort({ createdAt: -1 }));
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

// POST /api/admin/products — nuevo producto { name, genero, categoria, price, sizes, desc, image }
router.post('/products', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });

    const name = String(req.body.name || '').trim().slice(0, 60);
    const genero = req.body.genero;
    const categoria = req.body.categoria;
    const price = Math.round(Number(req.body.price) * 100) / 100;
    const desc = String(req.body.desc || '').trim().slice(0, 400);
    const color = COLOR_IDS.includes(req.body.color) ? req.body.color : '';
    const estilo = STYLE_IDS.includes(req.body.estilo) ? req.body.estilo : '';
    const sizes = (Array.isArray(req.body.sizes) ? req.body.sizes : [])
        .map((s) => String(s).trim().slice(0, 10))
        .filter(Boolean)
        .slice(0, 12);

    if (!name) return res.status(400).json({ error: 'Escribe el nombre de la prenda' });
    if (!GENEROS.includes(genero)) return res.status(400).json({ error: 'Elige mujer u hombre' });
    if (!CATEGORIAS.includes(categoria)) return res.status(400).json({ error: 'Elige una categoría' });
    if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Escribe un precio válido' });
    if (!sizes.length) return res.status(400).json({ error: 'Agrega al menos una talla' });

    try {
        // Los comentarios se guardan por nombre: no se permiten dos prendas iguales
        const exists = await Product.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
        const inCatalog = CATALOG.some((p) => p.name.toLowerCase() === name.toLowerCase());
        if (exists || inCatalog) return res.status(409).json({ error: 'Ya existe una prenda con ese nombre' });

        const { img, imgId } = await saveProductImage(req.body.image, name);
        const product = await Product.create({ name, genero, categoria, price, sizes, desc, color, estilo, img, imgId });
        res.status(201).json(product);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.status ? err.message : 'Error al guardar el producto' });
    }
});

// PUT /api/admin/products/:id — mostrar u ocultar, o cambiar precio { active, price }
router.put('/products/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const changes = {};
    if (typeof req.body.active === 'boolean') changes.active = req.body.active;
    if (req.body.price !== undefined) {
        const price = Math.round(Number(req.body.price) * 100) / 100;
        if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Escribe un precio válido' });
        changes.price = price;
    }
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, changes, { new: true });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// DELETE /api/admin/products/:id — borra el producto y su foto
router.delete('/products/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        await removeProductImage(product);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

module.exports = router;
