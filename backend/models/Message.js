const mongoose = require('mongoose');

// Comentarios públicos y pedidos personalizados enviados desde la tienda.
const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['comentario', 'pedido'],
        default: 'comentario',
        index: true
    },
    productId: { type: String, default: '', index: true },
    productName: { type: String, default: '' },
    name: { type: String, default: 'Anónimo' },
    contact: { type: String, default: '' },
    requestType: {
        type: String,
        enum: ['ropa', 'estampado', 'otro'],
        default: 'ropa'
    },
    text: { type: String, required: true },
    // Puntuación de 1 a 5 estrellas (solo comentarios; los antiguos no la tienen)
    rating: { type: Number, min: 1, max: 5 },
    status: {
        type: String,
        enum: ['nuevo', 'atendido'],
        default: 'nuevo',
        index: true
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
