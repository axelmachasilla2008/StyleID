const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    pass: { type: String, required: true }, // contraseña hasheada con bcrypt
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
