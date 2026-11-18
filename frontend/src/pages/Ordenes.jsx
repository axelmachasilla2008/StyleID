// =====================================================
// Mis pedidos (ordenes.html): historial, seguimiento y favoritos.
// =====================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import { CookieLink } from '../components/layout/Footer.jsx';
import OrderCard from '../components/ordenes/OrderCard.jsx';
import Favoritos from '../components/ordenes/Favoritos.jsx';
import { api } from '../lib/api.js';
import { isActiveOrder, shortOrderId } from '../lib/etapas.js';
import { endSession, getGuestId, getSession } from '../lib/sesion.js';
import { copyText, money } from '../lib/texto.js';
import { showToast } from '../lib/toast.js';

const LINKS = [
    { href: 'sala.html', label: 'Inicio' },
    { href: 'catalogo.html', label: 'Catálogo' },
    { href: 'informacion.html', label: 'Información' },
    { href: 'estilo.html', label: 'Escoge tu estilo' },
    { href: 'ordenes.html', label: 'Mis pedidos', current: true }
];

const FILTERS = [['todos', 'Todos'], ['curso', 'En curso'], ['entregado', 'Entregados'], ['cancelado', 'Cancelados']];

function EmptyState({ icon, title, text, children }) {
    return (
        <div className="empty">
            <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
            <h3>{title}</h3>
            <p>{text}</p>
            {children && <div className="btn-row">{children}</div>}
        </div>
    );
}

function Summary({ orders }) {
    const active = orders.filter(isActiveOrder).length;
    const delivered = orders.filter((o) => o.status === 'entregado').length;
    const spent = orders.filter((o) => o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const tiles = [
        ['fa-receipt', orders.length, orders.length === 1 ? 'Pedido' : 'Pedidos'],
        ['fa-truck-fast', active, 'En curso'],
        ['fa-house-circle-check', delivered, delivered === 1 ? 'Entregado' : 'Entregados'],
        ['fa-wallet', money(spent), 'Total comprado']
    ];
    return (
        <div className="orders-summary">
            {tiles.map(([icon, value, label]) => (
                <div className="summary-tile" key={label}>
                    <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
                    <strong>{value}</strong>
                    <span>{label}</span>
                </div>
            ))}
        </div>
    );
}

/** Botón de cerrar sesión: el primer toque pregunta y el segundo confirma. */
function LogoutButton() {
    const [armed, setArmed] = useState(false);
    const timer = useRef(null);

    function onClick() {
        if (!armed) {
            setArmed(true);
            showToast('Toca otra vez para cerrar sesión', 2600);
            timer.current = setTimeout(() => setArmed(false), 4000);
            return;
        }
        clearTimeout(timer.current);
        endSession();
        location.href = 'inicio.html';
    }

    return (
        <button className={`cart-btn${armed ? ' is-armed' : ''}`} type="button" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={onClick}>
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
        </button>
    );
}

export default function Ordenes() {
    const session = getSession();
    // Sin sesión se muestran los pedidos hechos como invitado en este navegador
    const userId = session || getGuestId();

    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState('loading');     // 'loading' | 'ok' | 'error'
    const [loading, setLoading] = useState(false);
    const [updatedAt, setUpdatedAt] = useState('');
    const [filter, setFilter] = useState('todos');
    const [query, setQuery] = useState('');
    const hasOrders = useRef(false);

    const load = useCallback(async (silent) => {
        if (!userId) return;
        setLoading(true);
        try {
            const list = await api(`/api/orders?userId=${encodeURIComponent(userId)}`);
            const next = Array.isArray(list) ? list : [];
            hasOrders.current = next.length > 0;
            setOrders(next);
            setStatus('ok');
            setUpdatedAt(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
            if (!hasOrders.current) setStatus('error');
            else if (!silent) showToast('No se pudo actualizar. Inténtalo de nuevo.', 2600);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Carga al entrar y se actualiza sola cada minuto mientras la pestaña está a la vista
    useEffect(() => {
        load(false);
        const interval = setInterval(() => { if (!document.hidden) load(true); }, 60000);
        const onVisible = () => { if (!document.hidden) load(true); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [load]);

    async function copy(text) {
        showToast((await copyText(text)) ? `Copiado: ${text}` : text, 2600);
    }

    /** Vuelve a poner en el carrito las prendas de un pedido. */
    async function buyAgain(order) {
        try {
            for (const item of order.items) {
                const cart = await api('/api/cart', { method: 'POST', body: { userId, name: item.name, price: item.price, img: item.img } });
                // El carrito suma de a 1: se ajusta la cantidad si el pedido tenía más
                if (item.qty > 1) {
                    const inCart = cart.items.find((i) => i.name === item.name);
                    await api('/api/cart/item', { method: 'PUT', body: { userId, name: item.name, qty: (inCart ? inCart.qty : 1) + item.qty - 1 } });
                }
            }
            showToast('Listo. Abre el carrito en la tienda para finalizar la compra.', 2600);
            return true;
        } catch (err) {
            showToast('No se pudo agregar al carrito', 2600);
            return false;
        }
    }

    const q = query.trim().toLowerCase().replace(/^#/, '');
    const visible = orders.filter((o) => {
        if (filter === 'curso' && !isActiveOrder(o)) return false;
        if ((filter === 'entregado' || filter === 'cancelado') && o.status !== filter) return false;
        if (!q) return true;
        return shortOrderId(o).toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q));
    });

    let content;
    if (!userId) {
        content = (
            <EmptyState icon="fa-lock" title="Inicia sesión para ver tus pedidos" text="Así podrás seguir cada pedido desde que lo haces hasta que llega a tu casa.">
                <a className="btn-shop" href="inicio.html">Iniciar sesión</a>
            </EmptyState>
        );
    } else if (status === 'loading' && !orders.length) {
        content = (
            <>
                <div className="order-card is-skeleton" aria-hidden="true"></div>
                <div className="order-card is-skeleton" aria-hidden="true"></div>
                <p className="sr-only">Cargando pedidos…</p>
            </>
        );
    } else if (status === 'error') {
        content = (
            <EmptyState icon="fa-triangle-exclamation" title="No se pudieron cargar tus pedidos" text="Revisa tu conexión e inténtalo de nuevo.">
                <button type="button" className="btn-shop" onClick={() => load(false)}>Reintentar</button>
            </EmptyState>
        );
    } else if (!orders.length) {
        content = (
            <EmptyState icon="fa-bag-shopping" title="Aún no tienes pedidos" text="Cuando compres algo, aquí verás en qué parte va tu pedido.">
                <a className="btn-shop" href="catalogo.html">Ver el catálogo</a>
            </EmptyState>
        );
    } else if (!visible.length) {
        content = <EmptyState icon="fa-filter" title="No hay pedidos con este filtro" text="Prueba con otro filtro o búsqueda." />;
    } else {
        content = visible.map((o) => <OrderCard key={o._id} order={o} onCopy={copy} onBuyAgain={buyAgain} />);
    }

    const showTools = userId && status === 'ok' && orders.length > 0;

    return (
        <PageShell>
            <Navbar links={LINKS}>
                {session && <LogoutButton />}
            </Navbar>

            <main className="orders-page">
                <section className="section orders-head">
                    <div className="section-title" data-bg="Pedidos">
                        <span className="section-eyebrow">Tu cuenta</span>
                        <h2>Mis <em>pedidos</em></h2>
                        <p>
                            {!userId && 'No has iniciado sesión'}
                            {userId && (session ? `Pedidos de ${session}` : 'Estás comprando como invitado. Inicia sesión para guardar tus pedidos en tu cuenta.')}
                        </p>
                    </div>
                </section>

                <div className="orders-wrap">
                    {showTools && <Summary orders={orders} />}

                    {showTools && (
                        <div className="orders-toolbar">
                            <div className="orders-filters" role="group" aria-label="Filtrar pedidos">
                                {FILTERS.map(([id, label]) => (
                                    <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
                                ))}
                            </div>
                            <div className="orders-tools">
                                <label className="orders-search">
                                    <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                                    <span className="sr-only">Buscar por número de pedido o prenda</span>
                                    <input type="search" placeholder="Buscar pedido o prenda" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
                                </label>
                                <button type="button" className={`orders-refresh${loading ? ' is-loading' : ''}`} title="Actualizar" disabled={loading} onClick={() => load(false)}>
                                    <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                                    <span>{updatedAt ? `Actualizado ${updatedAt}` : 'Actualizar'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="orders-list" aria-live="polite">{content}</div>

                    <Favoritos />
                </div>
            </main>

            <footer className="footer">
                <p className="orders-footer-note">
                    <a href="informacion.html#envios">Envíos</a> ·{' '}
                    <a href="informacion.html#cambios">Cambios y devoluciones</a> ·{' '}
                    <a href="informacion.html#contacto">Contacto</a> ·{' '}
                    <CookieLink />
                </p>
            </footer>
        </PageShell>
    );
}
