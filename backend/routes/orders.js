const express = require('express');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { asText, requireOwner, rateLimit } = require('../seguridad');

const router = express.Router();

// Todas las rutas de pedidos exigen ser el dueño (token de sesión o id de invitado)
router.use(requireOwner);

const orderLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 15, message: 'Hiciste muchos pedidos seguidos. Espera unos minutos.' });

// POST /api/orders — crear una orden a partir del carrito { userId, customer, email }
router.post('/', orderLimit, async (req, res) => {
    const customer = asText(req.body.customer, 80);
    const email = asText(req.body.email, 120);
    if (!customer) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    let cart = null;
    try {
        // Se «toma» el carrito de una sola vez: si llegan dos pedidos a la vez,
        // solo uno lo encuentra y no se crean órdenes duplicadas.
        cart = await Cart.findOneAndDelete({ userId: req.userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        const items = cart.items.map((i) => ({ name: i.name, price: i.price, img: i.img, qty: i.qty }));
        const total = Math.round(items.reduce((sum, i) => sum + i.price * i.qty, 0) * 100) / 100;
        const order = await Order.create({ userId: req.userId, customer, email, items, total });

        res.status(201).json(order);
    } catch (err) {
        // Si la orden no se pudo crear, se devuelve el carrito para no perderlo
        if (cart && cart.items.length) {
            await Cart.updateOne(
                { userId: req.userId },
                { $setOnInsert: { items: cart.items.map((i) => ({ name: i.name, price: i.price, img: i.img, qty: i.qty })), updatedAt: new Date() } },
                { upsert: true }
            ).catch(() => {});
        }
        res.status(500).json({ error: 'Error al crear la orden' });
    }
});

// GET /api/orders?userId=... — listar las órdenes del usuario
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
});

module.exports = router;
