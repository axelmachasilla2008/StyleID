// =====================================================
// Prueba de extremo a extremo de la API.
// Uso: con el servidor encendido, `npm run test:api` (carpeta backend).
// Crea un usuario, un carrito y un pedido de prueba y al final los borra.
// =====================================================
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert/strict');

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 3002}`;
const USER = `prueba_${Date.now().toString(36)}`;

async function call(method, path, body, headers = {}) {
    const res = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, body: await res.json().catch(() => null) };
}

const results = [];
async function step(name, fn) {
    try {
        await fn();
        results.push(['✔', name]);
    } catch (err) {
        results.push(['✘', `${name} → ${err.message}`]);
    }
}

async function main() {
    let token = '';
    let orderId = '';
    let adminToken = '';

    await step('El servidor responde', async () => {
        assert.equal((await call('GET', '/api/health')).status, 200);
    });

    await step('Registro de usuario devuelve token', async () => {
        const r = await call('POST', '/api/users/register', { user: USER, email: `${USER}@ejemplo.com`, pass: 'clave123' });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.ok(r.body.token);
        token = r.body.token;
    });

    await step('El carrito exige el token de la sesión', async () => {
        const r = await call('GET', `/api/cart?userId=${USER}`);
        assert.equal(r.status, 401);
    });

    await step('El servidor fija el precio real de la prenda', async () => {
        const r = await call('POST', '/api/cart', { userId: USER, name: 'Blusa bordada · Talla M', price: 1, img: '' }, { 'x-user-token': token });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.equal(r.body.items[0].price, 42);
    });

    await step('Crear pedido vacía el carrito', async () => {
        const r = await call('POST', '/api/orders', { userId: USER, customer: USER }, { 'x-user-token': token });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        orderId = r.body._id;
        const cart = await call('GET', `/api/cart?userId=${USER}`, null, { 'x-user-token': token });
        assert.equal(cart.body.items.length, 0);
    });

    await step('Contraseña de administrador incorrecta → 401', async () => {
        assert.equal((await call('POST', '/api/admin/login', { password: 'incorrecta' })).status, 401);
    });

    await step('El administrador entra y cambia la etapa del pedido', async () => {
        const login = await call('POST', '/api/admin/login', { password: process.env.ADMIN_PASSWORD });
        assert.equal(login.status, 200);
        adminToken = login.body.token;
        const r = await call('PUT', `/api/admin/orders/${orderId}`, { status: 'pagado' }, { 'x-admin-token': adminToken });
        assert.equal(r.body.status, 'pagado');
    });

    await step('Ruta de la API inexistente → 404 en JSON', async () => {
        const r = await call('GET', '/api/no-existe');
        assert.equal(r.status, 404);
        assert.equal(r.body.codigo, 'RUTA_NO_ENCONTRADA');
    });

    // Limpieza: se borra todo lo que creó la prueba
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    await require('../models/User').deleteOne({ user: USER });
    await require('../models/Order').deleteMany({ userId: USER });
    await require('../models/Cart').deleteOne({ userId: USER });
    await mongoose.disconnect();

    results.forEach(([mark, text]) => console.log(`${mark} ${text}`));
    const failed = results.filter(([mark]) => mark === '✘').length;
    console.log(failed ? `\n${failed} prueba(s) fallaron` : '\nTodas las pruebas pasaron (datos de prueba borrados)');
    process.exit(failed ? 1 : 0);
}

main().catch((err) => {
    console.error('ERROR en la prueba:', err.message);
    process.exit(1);
});
