const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    img: { type: String, default: '' },
    qty: { type: Number, default: 1, min: 1 }
});

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
