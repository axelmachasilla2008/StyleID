// =====================================================
// Carrito de compras (guardado en MongoDB Atlas por la API).
//  - <CartProvider> guarda el carrito y lo comparte con la página
//  - useCart() da { items, add, open, ... } a cualquier componente
//  - <CartButton> y <CartDrawer> son el botón flotante y el panel lateral
// =====================================================
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { getSession, getUserId } from '../../lib/sesion.js';
import { money } from '../../lib/texto.js';
import { showToast } from '../../lib/toast.js';

const CartContext = createContext(null);

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const userId = useMemo(() => getUserId(), []);

    // Cargar el carrito al entrar
    useEffect(() => {
        api(`/api/cart?userId=${encodeURIComponent(userId)}`)
            .then((data) => setItems(data.items || []))
            .catch(() => showToast('No se pudo conectar con la base de datos'));
    }, [userId]);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    // Sin scroll detrás del panel abierto; Escape lo cierra
    useEffect(() => {
        if (!isOpen) return undefined;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen]);

    /** Agrega una prenda ({ name, price, img }) y abre el carrito. */
    const add = useCallback(async (product) => {
        try {
            const data = await api('/api/cart', { method: 'POST', body: { userId, ...product } });
            setItems(data.items);
            showToast(`"${product.name}" agregado al carrito`);
            setIsOpen(true);
        } catch (err) {
            showToast(err.message);
        }
    }, [userId]);

    async function setQty(item, qty) {
        try {
            const data = await api('/api/cart/item', { method: 'PUT', body: { userId, name: item.name, qty } });
            setItems(data.items);
        } catch (err) {
            showToast(err.message);
        }
    }

    async function remove(item) {
        try {
            const data = await api('/api/cart/item', { method: 'DELETE', body: { userId, name: item.name } });
            setItems(data.items);
        } catch (err) {
            showToast(err.message);
        }
    }

    /** Finalizar compra: crea la orden en la base de datos. */
    async function checkout() {
        if (!items.length || busy) return;
        const total = money(items.reduce((sum, i) => sum + i.qty * i.price, 0));
        setBusy(true);
        try {
            await api('/api/orders', { method: 'POST', body: { userId, customer: getSession() || 'Invitado', email: '' } });
            setItems([]);
            setIsOpen(false);
            showToast(`Compra realizada con éxito · Total ${total}`);
        } catch (err) {
            showToast(err.message);
        } finally {
            setBusy(false);
        }
    }

    const value = { items, isOpen, busy, open, close, add, setQty, remove, checkout };
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Botón flotante con el número de prendas (salta cuando cambia). */
export function CartButton() {
    const { items, open } = useCart();
    const units = items.reduce((sum, i) => sum + i.qty, 0);
    const countRef = useRef(null);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) { first.current = false; return; }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const el = countRef.current;
        el.classList.remove('is-bump');
        void el.offsetWidth;          // reinicia la animación
        el.classList.add('is-bump');
    }, [units]);

    return (
        <button className="cart-btn cart-fab" id="cartBtn" aria-label="Abrir carrito de compras" onClick={open}>
            <i className="fa-solid fa-bag-shopping"></i>
            <span className="cart-count" id="cartCount" data-count={units} ref={countRef}>{units}</span>
        </button>
    );
}

/** Panel lateral con las prendas, cantidades y el total. */
export function CartDrawer() {
    const { items, isOpen, busy, close, setQty, remove, checkout } = useCart();
    const session = getSession();
    const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const empty = items.length === 0;

    return (
        <>
            <div className={`cart-overlay${isOpen ? ' active' : ''}`} id="cartOverlay" onClick={close}></div>

            <aside className={`cart-drawer${isOpen ? ' active' : ''}`} id="cartDrawer" aria-label="Carrito de compras" aria-hidden={!isOpen}>
                <div className="cart-header">
                    <div className="cart-header-text">
                        <h3><i className="fa-solid fa-bag-shopping"></i> Mi carrito</h3>
                        <span className="cart-user">{session ? `Hola, ${session}` : ''}</span>
                    </div>
                    <button className="cart-close" aria-label="Cerrar carrito" onClick={close}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="cart-items">
                    {empty ? (
                        <div className="cart-empty"><i className="fa-solid fa-bag-shopping"></i>Tu carrito está vacío</div>
                    ) : items.map((item) => (
                        <div className="cart-item" key={item.name}>
                            <div className="cart-item-img">
                                <img src={item.img} alt={item.name} />
                            </div>
                            <div className="cart-item-body">
                                <span className="cart-item-title">{item.name}</span>
                                <span className="cart-item-unit">{money(item.price)} c/u</span>
                                <div className="cart-item-row">
                                    <div className="qty-controls">
                                        <button className="qty-btn minus" aria-label="Disminuir cantidad" onClick={() => setQty(item, item.qty - 1)}>−</button>
                                        <span className="qty-value">{item.qty}</span>
                                        <button className="qty-btn plus" aria-label="Aumentar cantidad" onClick={() => setQty(item, item.qty + 1)}>+</button>
                                    </div>
                                    <span className="cart-item-subtotal">{money(item.qty * item.price)}</span>
                                    <button className="cart-item-remove" aria-label="Eliminar producto" onClick={() => remove(item)}>
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-footer">
                    <div className="cart-total">
                        <span>Total</span>
                        <span>{money(total)}</span>
                    </div>
                    <button
                        className="btn-shop checkout-btn" onClick={checkout} disabled={empty || busy}
                        style={{ opacity: empty ? 0.5 : 1, pointerEvents: empty ? 'none' : 'auto' }}
                    >
                        Finalizar compra
                    </button>
                </div>
            </aside>
        </>
    );
}
