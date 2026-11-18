const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products — prendas visibles en la tienda (las agregadas desde el panel)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({ active: true })
            .sort({ createdAt: -1 })
            .select('name genero categoria price sizes desc color estilo img createdAt');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'No se pudieron cargar los productos' });
    }
});

module.exports = router;
