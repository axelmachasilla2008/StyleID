const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asText, requireOwner } = require('../seguridad');
const { CATALOG } = require('../catalogo');

const router = express.Router();

const MAX_QTY = 20;        // unidades de una misma prenda
const MAX_ITEMS = 40;      // prendas distintas en un carrito
const MAX_PRICE = 10000;

// Todas las rutas del carrito exigen ser el dueño (token de sesión o id de invitado)
router.use(requireOwner);

/**
 * Precio real de una prenda. El nombre llega como «Prenda · Talla M».
 * Si la prenda está en el catálogo o en la base, manda el precio del servidor;
 * si no (prendas de la portada), se acepta el del navegador dentro de límites.
 */
async function resolvePrice(name, clientPrice) {
    const base = name.split(' · Talla ')[0].trim().toLowerCase();
    const fromDb = await Product.findOne({ name: base, active: true }).collation({ locale: 'es', strength: 2 }).lean();
    if (fromDb) return fromDb.price;
    const fromCatalog = CATALOG.find((p) => p.name.toLowerCase() === base);
    if (fromCatalog) return fromCatalog.price;

    const price = Number(clientPrice);
    if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE) return null;
    return Math.round(price * 100) / 100;
}

// GET /api/cart?userId=... — obtener el carrito del usuario
router.get('/', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.userId });
        res.json(cart || { userId: req.userId, items: [] });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});

// POST /api/cart — agregar un producto { userId, name, price, img }
router.post('/', async (req, res) => {
    try {
        const name = asText(req.body.name, 120);
        const img = asText(req.body.img, 500);
        if (!name) return res.status(400).json({ error: 'Faltan campos obligatorios' });
        if (img && !/^(https:\/\/|\.?\/?img\/)/.test(img)) {
            return res.status(400).json({ error: 'La imagen del producto no es válida' });
        }

        const price = await resolvePrice(name, req.body.price);
        if (price === null) return res.status(400).json({ error: 'El precio del producto no es válido' });

        let cart = await Cart.findOne({ userId: req.userId });
        if (!cart) cart = new Cart({ userId: req.userId, items: [] });

        const item = cart.items.find((i) => i.name === name);
        if (item) {
            if (item.qty >= MAX_QTY) return res.status(400).json({ error: `Máximo ${MAX_QTY} unidades por prenda` });
            item.qty += 1;
            item.price = price;
        } else {
            if (cart.items.length >= MAX_ITEMS) return res.status(400).json({ error: 'El carrito está lleno' });
            cart.items.push({ name, price, img, qty: 1 });
        }
        cart.updatedAt = new Date();
        await cart.save();
        res.status(201).json(cart);
    } catch (err) {
        res.status(500).json({ error: 'Error al agregar al carrito' });
    }
});

// PUT /api/cart/item — cambiar cantidad { userId, name, qty }
router.put('/item', async (req, res) => {
    try {
        const name = asText(req.body.name, 120);
        const qty = Number(req.body.qty);
        if (!name || !Number.isInteger(qty) || qty > MAX_QTY) {
            return res.status(400).json({ error: `La cantidad debe ser un número entero de 0 a ${MAX_QTY}` });
        }

        const cart = await Cart.findOne({ userId: req.userId });
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        const item = cart.items.find((i) => i.name === name);
        if (!item) return res.status(404).json({ error: 'Producto no encontrado' });

        if (qty <= 0) {
            cart.items = cart.items.filter((i) => i.name !== name);
        } else {
            item.qty = qty;
        }
        cart.updatedAt = new Date();
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// DELETE /api/cart/item — eliminar un producto { userId, name }
router.delete('/item', async (req, res) => {
    try {
        const name = asText(req.body.name, 120);
        if (!name) return res.status(400).json({ error: 'Faltan campos obligatorios' });

        const cart = await Cart.findOne({ userId: req.userId });
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        cart.items = cart.items.filter((i) => i.name !== name);
        cart.updatedAt = new Date();
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

// DELETE /api/cart — vaciar el carrito { userId }
router.delete('/', async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.userId });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al vaciar el carrito' });
    }
});

module.exports = router;
