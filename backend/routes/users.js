const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { asText, userToken, rateLimit } = require('../seguridad');

const router = express.Router();

// Frena los intentos de adivinar contraseñas: 10 intentos cada 10 minutos por IP
const authLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
});

// Compara sin distinguir mayúsculas ni tildes ("Axel M" = "axel m")
const SAME_NAME = { locale: 'es', strength: 1 };

// POST /api/users/register — crear una cuenta
router.post('/register', authLimit, async (req, res) => {
    try {
        const user = asText(req.body.user, 40);
        const email = asText(req.body.email, 120).toLowerCase();
        const pass = typeof req.body.pass === 'string' ? req.body.pass : '';

        if (!user || !email || !pass) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        if (user.toLowerCase().startsWith('invitado_')) {
            return res.status(400).json({ error: 'Ese nombre de usuario no está permitido' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Escribe un correo válido' });
        }
        if (pass.length < 6 || pass.length > 100) {
            return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 100 caracteres' });
        }

        const existing = await User.findOne({ $or: [{ user }, { email }] }).collation(SAME_NAME);
        if (existing) {
            return res.status(409).json({ error: 'El usuario o el correo ya está en uso' });
        }

        const hashed = await bcrypt.hash(pass, 10);
        const newUser = await User.create({ user, email, pass: hashed });
        res.status(201).json({ user: newUser.user, email: newUser.email, token: userToken(newUser.user) });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

// POST /api/users/login — iniciar sesión con usuario o correo
router.post('/login', authLimit, async (req, res) => {
    try {
        const id = asText(req.body.id, 120);
        const pass = typeof req.body.pass === 'string' ? req.body.pass : '';
        if (!id || !pass) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const found = await User.findOne({ $or: [{ user: id }, { email: id.toLowerCase() }] }).collation(SAME_NAME);
        if (!found) {
            return res.status(404).json({ error: 'No existe una cuenta con ese usuario o correo' });
        }

        const ok = await bcrypt.compare(pass, found.pass);
        if (!ok) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // El token prueba ante el carrito y los pedidos que la persona es quien dice ser
        res.json({ user: found.user, email: found.email, token: userToken(found.user) });
    } catch (err) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

module.exports = router;
