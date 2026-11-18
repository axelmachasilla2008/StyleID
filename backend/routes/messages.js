const express = require('express');
const Message = require('../models/Message');
const { rateLimit } = require('../seguridad');

const router = express.Router();

const REQUEST_TYPES = ['ropa', 'estampado', 'otro'];

/** Limpia y recorta un texto recibido del cliente (ignora lo que no sea texto o número). */
function clean(value, max) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    return String(value).trim().slice(0, max);
}

// Evita que se llene la base de mensajes: 12 envíos cada 10 minutos por IP
const postLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 12, message: 'Enviaste muchos mensajes seguidos. Espera unos minutos.' });

// GET /api/messages/recent — últimos comentarios sobre la página (sección «Comentarios»).
// Las opiniones de cada prenda solo se ven en el detalle de esa prenda.
router.get('/recent', async (req, res) => {
    try {
        const messages = await Message.find({ type: 'comentario', productId: { $in: ['general', ''] } })
            .sort({ createdAt: -1 })
            .limit(12)
            .select('name text rating productName createdAt');

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'No se pudieron cargar los comentarios' });
    }
});

// GET /api/messages/ratings — promedio de estrellas y cantidad de opiniones por producto
router.get('/ratings', async (req, res) => {
    try {
        const rows = await Message.aggregate([
            { $match: { type: 'comentario', rating: { $gte: 1, $lte: 5 }, productId: { $ne: '' } } },
            { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const ratings = {};
        rows.forEach((row) => {
            ratings[row._id] = { avg: Math.round(row.avg * 10) / 10, count: row.count };
        });
        res.json(ratings);
    } catch (err) {
        res.status(500).json({ error: 'No se pudieron cargar las puntuaciones' });
    }
});

// GET /api/messages?productId=... — comentarios públicos de un producto
router.get('/', async (req, res) => {
    const productId = clean(req.query.productId, 100);
    if (!productId) return res.status(400).json({ error: 'Falta el producto' });

    try {
        const messages = await Message.find({ productId, type: 'comentario' })
            .sort({ createdAt: -1 })
            .limit(300)
            .select('name text rating createdAt');

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'No se pudieron cargar los comentarios' });
    }
});

// POST /api/messages — nuevo comentario o pedido personalizado
router.post('/', postLimit, async (req, res) => {
    const type = req.body.type === 'pedido' ? 'pedido' : 'comentario';
    const name = clean(req.body.name, 60) || 'Anónimo';
    const text = clean(req.body.text, 1000);
    const contact = clean(req.body.contact, 120);
    const productId = clean(req.body.productId, 100);
    const productName = clean(req.body.productName, 120);
    const requestType = REQUEST_TYPES.includes(req.body.requestType)
        ? req.body.requestType
        : 'ropa';

    if (!text) {
        return res.status(400).json({ error: 'Escribe tu mensaje' });
    }
    if (type === 'pedido' && !contact) {
        return res.status(400).json({ error: 'Deja un WhatsApp o correo para contactarte' });
    }

    // Los comentarios de un producto llevan estrellas (1 a 5).
    // Los comentarios generales de la página principal ('general') no.
    const rating = Number.parseInt(req.body.rating, 10);
    const hasRating = Number.isInteger(rating) && rating >= 1 && rating <= 5;
    const isProductComment = type === 'comentario' && productId && productId !== 'general';
    if (isProductComment && !hasRating) {
        return res.status(400).json({ error: 'Elige de 1 a 5 estrellas' });
    }

    try {
        const message = await Message.create({
            type,
            productId,
            productName,
            name,
            contact,
            requestType,
            text,
            ...(isProductComment ? { rating } : {})
        });

        res.status(201).json({ ok: true, id: message._id });
    } catch (err) {
        res.status(500).json({ error: 'No se pudo enviar el mensaje' });
    }
});

module.exports = router;
