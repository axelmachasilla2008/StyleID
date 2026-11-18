const mongoose = require('mongoose');

// Prendas agregadas al catálogo desde el panel de administrador.
// (Las prendas de ejemplo están en frontend/src/data/catalogo.js.)
const productSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    genero: { type: String, enum: ['mujer', 'hombre'], required: true },
    categoria: {
        type: String,
        enum: ['camisas', 'pantalones', 'zapatos', 'accesorios', 'bolsos', 'conjuntos'],
        required: true
    },
    price: { type: Number, required: true, min: 0 },
    sizes: { type: [String], default: [] },
    desc: { type: String, default: '' },
    color: { type: String, default: '' },        // id de COLORS en frontend/src/data/catalogo.js (negro, azul…)
    estilo: { type: String, default: '' },       // id de STYLES (urbano, clasico, elegante…)
    img: { type: String, required: true },     // link de Cloudinary o ruta local, p. ej. ./img/productos/x.jpg
    imgId: { type: String, default: '' },       // id de la foto en Cloudinary (para borrarla)
    active: { type: Boolean, default: true },   // false = oculto en la tienda
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
