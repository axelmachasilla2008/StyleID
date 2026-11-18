// =====================================================
// Panel de administrador (admin.html): resumen, órdenes, prendas y mensajes.
// El token del panel se guarda solo en esta pestaña y caduca a las 12 horas.
// =====================================================
import { useEffect, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell.jsx';
import AdminOrders from '../components/admin/AdminOrders.jsx';
import AdminProducts from '../components/admin/AdminProducts.jsx';
import AdminMessages from '../components/admin/AdminMessages.jsx';
import { api } from '../lib/api.js';
import { borrar, guardar, leer } from '../lib/almacenamiento.js';
import { money } from '../lib/texto.js';

const TOKEN_KEY = 'styleid_admin_token';

function Stats({ stats }) {
    const tiles = [
        [stats.totalOrders ?? 0, 'Órdenes'],
        [money(stats.revenue), 'Ingresos'],
        [stats.users ?? 0, 'Usuarios'],
        [stats.pendingRequests ?? 0, 'Pedidos nuevos']
    ];
    return (
        <div className="stats">
            {tiles.map(([value, label]) => (
                <div className="stat" key={label}><span className="stat-num">{value}</span><span className="stat-label">{label}</span></div>
            ))}
        </div>
    );
}

export default function Admin() {
    const [token, setToken] = useState(() => leer(TOKEN_KEY, 'session') || '');
    const [data, setData] = useState(null);          // { stats, orders, products, messages }
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const passRef = useRef(null);

    /** Vuelve a la pantalla de ingreso con un mensaje (sesión caducada o error). */
    function backToLogin(text = '') {
        borrar(TOKEN_KEY, 'session');
        setToken('');
        setData(null);
        setMsg(text);
    }

    // Con token: se carga todo el panel (la primera llamada comprueba que siga vigente)
    useEffect(() => {
        if (!token) return;
        let current = true;
        (async () => {
            try {
                const stats = await api('/api/admin/stats', { admin: token });
                const [orders, products, messages] = await Promise.all([
                    api('/api/admin/orders', { admin: token }),
                    api('/api/admin/products', { admin: token }).catch(() => []),
                    api('/api/admin/messages', { admin: token })
                ]);
                if (!current) return;
                setData({
                    stats,
                    orders: Array.isArray(orders) ? orders : [],
                    products: Array.isArray(products) ? products : [],
                    messages: Array.isArray(messages) ? messages : []
                });
            } catch (err) {
                if (current) {
                    backToLogin(err.status === 401
                        ? 'Tu sesión de administrador caducó. Ingresa de nuevo.'
                        : 'No se pudo cargar el panel. Revisa que el servidor esté encendido.');
                }
            }
        })();
        return () => { current = false; };
    }, [token]);

    async function login(e) {
        e.preventDefault();
        setMsg('');
        try {
            const res = await api('/api/admin/login', { method: 'POST', body: { password } });
            guardar(TOKEN_KEY, res.token, 'session');
            setPassword('');
            setToken(res.token);
        } catch (err) {
            setMsg(err.message);
            passRef.current?.focus();
        }
    }

    const update = (key) => (value) => setData((d) => ({ ...d, [key]: value }));

    return (
        <PageShell cookies={false}>
            <header className="navbar">
                <div className="logo">
                    <i className="fa-solid fa-shield-halved"></i>
                    <span className="logo-text">StyleID Admin</span>
                </div>
                <nav>
                    <ul className="nav-links">
                        <li><a href="sala.html">Tienda</a></li>
                        <li><a href="ordenes.html">Mis pedidos</a></li>
                    </ul>
                </nav>
                {token && (
                    <button className="cart-btn" aria-label="Cerrar sesión de administrador" onClick={() => backToLogin()}>
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </button>
                )}
            </header>

            <main>
                {!data ? (
                    <section className="admin-login">
                        <h1><i className="fa-solid fa-lock"></i> Panel de administrador</h1>
                        {token ? (
                            <p>Cargando el panel…</p>
                        ) : (
                            <form onSubmit={login} style={{ display: 'contents' }}>
                                <p>Ingresa la contraseña de administrador</p>
                                <input type="password" placeholder="Contraseña" autoComplete="current-password" ref={passRef}
                                    value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Contraseña de administrador" />
                                <button className="btn-shop" type="submit">Entrar</button>
                            </form>
                        )}
                        <p className={`form-msg${msg ? ' error' : ''}`} role="alert">{msg}</p>
                    </section>
                ) : (
                    <section>
                        <div className="page-hero">
                            <h1>Panel de administrador</h1>
                            <p>Resumen de la tienda y todas las órdenes</p>
                        </div>
                        <Stats stats={data.stats} />
                        <AdminOrders orders={data.orders} token={token} onChange={update('orders')} />
                        <AdminProducts products={data.products} token={token} onChange={update('products')} />
                        <AdminMessages messages={data.messages} token={token} />
                    </section>
                )}
            </main>
        </PageShell>
    );
}
