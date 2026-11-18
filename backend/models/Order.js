const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    img: { type: String, default: '' },
    qty: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    customer: { type: String, required: true },
    email: { type: String, default: '' },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true },
    // Etapa del pedido: pendiente → pagado → preparando → enviado → entregado (o cancelado)
    status: { type: String, default: 'pendiente' },
    guia: { type: String, default: '' },       // número de guía de Servientrega
    note: { type: String, default: '' },       // nota del administrador para el cliente
    // Fecha en que el pedido entró a cada etapa (para el seguimiento del cliente)
    history: {
        type: [{ _id: false, status: String, at: { type: Date, default: Date.now } }],
        default: () => [{ status: 'pendiente' }]
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
