// =====================================================
// Tarjeta de un pedido en «Mis pedidos»: seguimiento, próximos pasos y detalle.
// =====================================================
import { useState } from 'react';
import { BANK, whatsappLink } from '../../data/contacto.js';
import { STAGES, getStage, isActiveOrder, shortOrderId, stageDate, stageIndex } from '../../lib/etapas.js';
import { money } from '../../lib/texto.js';

/** Seguimiento: en qué etapa va el pedido (la elige el administrador). */
function Tracker({ order }) {
    const stage = getStage(order.status);

    if (order.status === 'cancelado') {
        return (
            <div className="track track-cancelled">
                <i className={`fa-solid ${stage.icon}`} aria-hidden="true"></i>
                <div><strong>{stage.label}</strong><p>{stage.desc}</p></div>
            </div>
        );
    }

    const current = stageIndex(order.status);
    return (
        <div className="track" style={{ '--progress': current / (STAGES.length - 1) }}>
            <ol className="track-steps">
                {STAGES.map((s, index) => {
                    const state = index < current ? 'done' : index === current ? 'current' : '';
                    const date = index <= current ? stageDate(order, s.id) : null;
                    return (
                        <li key={s.id} className={`track-step ${state}`} aria-current={index === current ? 'step' : undefined}>
                            <span className="track-dot"><i className={`fa-solid ${s.icon}`} aria-hidden="true"></i></span>
                            <span className="track-label">{s.label}</span>
                            <span className="track-date">{date ? date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }) : ''}</span>
                        </li>
                    );
                })}
            </ol>
            <p className="track-desc">{stage.desc}</p>
        </div>
    );
}

/** Avisos con lo que la persona tiene que hacer según la etapa. */
function NextSteps({ order, onCopy }) {
    const id = shortOrderId(order);
    const parts = [];

    if (order.status === 'pendiente') {
        parts.push(
            <div className="next-step pay" key="pay">
                <i className="fa-solid fa-credit-card" aria-hidden="true"></i>
                <div>
                    <strong>Falta confirmar tu pago</strong>
                    <p>Transfiere a <b>{BANK.bank} · {BANK.type} {BANK.number}</b> ({BANK.owner}) y envía el comprobante con tu número de pedido <b>#{id}</b>.</p>
                    <a href={whatsappLink(`Hola StyleID, te envío el comprobante de mi pedido #${id}`)} target="_blank" rel="noopener">
                        <i className="fa-brands fa-whatsapp" aria-hidden="true"></i> Enviar comprobante por WhatsApp
                    </a>
                    <a href="informacion.html#pagos">Ver formas de pago <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                </div>
            </div>
        );
    }

    if (order.guia) {
        parts.push(
            <div className="next-step" key="guia">
                <i className="fa-solid fa-barcode" aria-hidden="true"></i>
                <div>
                    <strong>Guía de Servientrega</strong>
                    <p className="guia">{order.guia}{' '}
                        <button type="button" className="mini-btn" onClick={() => onCopy(order.guia)}>
                            <i className="fa-regular fa-copy" aria-hidden="true"></i> Copiar
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    if (order.note) {
        parts.push(
            <div className="next-step" key="note">
                <i className="fa-solid fa-message" aria-hidden="true"></i>
                <div><strong>Mensaje de StyleID</strong><p>{order.note}</p></div>
            </div>
        );
    }

    if (order.status === 'entregado') {
        parts.push(
            <div className="next-step" key="cambios">
                <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                <div>
                    <strong>¿Algo no te quedó bien?</strong>
                    <p>Tienes 1 día desde que lo recibes para pedir un cambio. Las prendas personalizadas no tienen cambio.</p>
                    <a href="informacion.html#cambios">Ver condiciones <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                </div>
            </div>
        );
    }

    return parts.length ? <div className="next-steps">{parts}</div> : null;
}

export default function OrderCard({ order, onCopy, onBuyAgain }) {
    const stage = getStage(order.status);
    const units = order.items.reduce((sum, i) => sum + i.qty, 0);
    const id = shortOrderId(order);
    const [buying, setBuying] = useState('idle');     // 'idle' | 'busy' | 'done'

    async function buyAgain() {
        setBuying('busy');
        const ok = await onBuyAgain(order);
        setBuying(ok ? 'done' : 'idle');
        if (ok) setTimeout(() => setBuying('idle'), 3000);
    }

    return (
        <article className={`order-card status-${stage.id}`}>
            <header className="order-head">
                <div>
                    <div className="oid">
                        Pedido <strong>#{id}</strong>
                        <button type="button" className="mini-btn" aria-label="Copiar número de pedido" onClick={() => onCopy(`#${id}`)}>
                            <i className="fa-regular fa-copy" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div className="date">
                        {new Date(order.createdAt).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
                <div className="order-status">
                    <div className="order-total">{money(order.total)}</div>
                    <span className={`badge ${stage.id}`}>{stage.label}</span>
                </div>
            </header>

            <Tracker order={order} />
            <NextSteps order={order} onCopy={onCopy} />

            <details className="order-details" open={isActiveOrder(order)}>
                <summary>{units} {units === 1 ? 'prenda' : 'prendas'} · ver detalle</summary>
                <ul className="order-items">
                    {order.items.map((item) => (
                        <li className="order-item" key={item.name}>
                            <img src={item.img || ''} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                            <div>
                                <div className="name">{item.name}</div>
                                <div className="qty">{item.qty} × {money(item.price)}</div>
                            </div>
                            <span className="sub">{money(item.price * item.qty)}</span>
                        </li>
                    ))}
                </ul>
                <dl className="order-totals">
                    <div><dt>Subtotal</dt><dd>{money(order.total)}</dd></div>
                    <div><dt>Envío (Servientrega)</dt><dd>Según tu ciudad</dd></div>
                    <div className="grand"><dt>Total de las prendas</dt><dd>{money(order.total)}</dd></div>
                </dl>
            </details>

            <footer className="order-actions">
                <button type="button" className="btn-ghost-sm" disabled={buying !== 'idle'} onClick={buyAgain}>
                    {buying === 'busy' && <><i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Agregando…</>}
                    {buying === 'done' && <><i className="fa-solid fa-check" aria-hidden="true"></i> En tu carrito</>}
                    {buying === 'idle' && <><i className="fa-solid fa-cart-plus" aria-hidden="true"></i> Comprar de nuevo</>}
                </button>
                <a className="btn-ghost-sm" href="informacion.html#contacto">
                    <i className="fa-solid fa-circle-question" aria-hidden="true"></i> Ayuda con este pedido
                </a>
            </footer>
        </article>
    );
}
