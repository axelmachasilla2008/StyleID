// =====================================================
// Órdenes y seguimiento: el administrador elige la etapa de cada pedido,
// escribe la guía de Servientrega y una nota para el cliente.
// =====================================================
import { useState } from 'react';
import useDosToques from '../../hooks/useDosToques.js';
import { api } from '../../lib/api.js';
import { STAGES, getStage, isActiveOrder, shortOrderId, stageDate, stageIndex } from '../../lib/etapas.js';
import { money } from '../../lib/texto.js';

const FILTERS = [['todas', 'Todas'], ['curso', 'En curso'], ['entregado', 'Entregadas'], ['cancelado', 'Canceladas']];

function OrderAdminCard({ order, token, onSaved }) {
    const cancelled = order.status === 'cancelado';
    const current = stageIndex(order.status);
    const units = order.items.reduce((sum, i) => sum + i.qty, 0);
    const [guia, setGuia] = useState(order.guia || '');
    const [note, setNote] = useState(order.note || '');
    const [status, setStatus] = useState({ text: '', kind: '' });
    const [cancelArmed, tapCancel] = useDosToques();

    async function save(changes, okMessage) {
        setStatus({ text: 'Guardando…', kind: '' });
        try {
            const data = await api(`/api/admin/orders/${encodeURIComponent(order._id)}`, { method: 'PUT', body: changes, admin: token });
            onSaved(data);
            setStatus({ text: okMessage, kind: 'ok' });
        } catch (err) {
            setStatus({ text: err.message, kind: 'error' });
        }
    }

    function setStage(stageId) {
        save({ status: stageId }, `Etapa actualizada: ${getStage(stageId).label}`);
    }

    function onCancelButton() {
        if (cancelled) { setStage('pendiente'); return; }
        // Cancelar pide un segundo toque
        if (tapCancel()) setStage('cancelado');
    }

    return (
        <article className={`order-admin${cancelled ? ' is-cancelled' : ''}`}>
            <header className="order-admin-head">
                <div>
                    <strong>#{shortOrderId(order)}</strong>
                    <span className="order-admin-date">{new Date(order.createdAt).toLocaleDateString('es-EC')}</span>
                </div>
                <div className="order-admin-client">{order.customer}<small>{order.email || ''}</small></div>
                <div className="order-admin-total">{money(order.total)}<small>{units} {units === 1 ? 'prenda' : 'prendas'}</small></div>
            </header>

            <ul className="order-admin-items">
                {order.items.map((i) => <li key={i.name}>{i.name} <span>× {i.qty}</span></li>)}
            </ul>

            <div className="stage-track" role="group" aria-label="Etapa del pedido">
                {STAGES.map((stage, index) => {
                    const state = cancelled ? '' : index < current ? 'done' : index === current ? 'current' : '';
                    const date = stageDate(order, stage.id);
                    const when = date && !cancelled && index <= current ? date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }) : '';
                    return (
                        <button key={stage.id} type="button" className={`stage-btn ${state}`} aria-pressed={state === 'current'} title={stage.desc} onClick={() => setStage(stage.id)}>
                            <i className={`fa-solid ${stage.icon}`} aria-hidden="true"></i>
                            <span>{stage.label}</span>
                            <small>{when}</small>
                        </button>
                    );
                })}
            </div>

            <form className="order-admin-form" onSubmit={(e) => { e.preventDefault(); save({ guia: guia.trim(), note: note.trim() }, 'Guía y nota guardadas'); }}>
                <label>Guía de Servientrega
                    <input type="text" maxLength={40} placeholder="Ej. 1234567890" value={guia} onChange={(e) => setGuia(e.target.value)} />
                </label>
                <label className="grow">Nota para el cliente
                    <input type="text" maxLength={300} placeholder="Ej. Llega el viernes por la tarde" value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                <button type="submit" className="btn-save">Guardar</button>
                <button type="button" className={`btn-cancel-order${cancelArmed ? ' is-armed' : ''}`} onClick={onCancelButton}>
                    {cancelled ? 'Reactivar pedido' : cancelArmed ? '¿Seguro? Toca otra vez' : 'Cancelar pedido'}
                </button>
            </form>
            <p className={`order-admin-status ${status.kind}`} role="status" aria-live="polite">{status.text}</p>
        </article>
    );
}

export default function AdminOrders({ orders, token, onChange }) {
    const [filter, setFilter] = useState('todas');

    const visible = orders.filter((o) => {
        if (filter === 'todas') return true;
        if (filter === 'curso') return isActiveOrder(o);
        return o.status === filter;
    });

    function onSaved(updated) {
        onChange(orders.map((o) => (o._id === updated._id ? updated : o)));
    }

    return (
        <>
            <h2 className="admin-section-title">Órdenes y seguimiento</h2>
            <p className="admin-section-note">Toca una etapa para indicar en qué parte va el pedido. El cliente lo ve al instante en «Mis pedidos».</p>
            <div className="order-filters" role="group" aria-label="Filtrar órdenes">
                {FILTERS.map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
                ))}
            </div>
            <div className="admin-orders">
                {visible.length
                    ? visible.map((o) => <OrderAdminCard key={o._id} order={o} token={token} onSaved={onSaved} />)
                    : <p className="empty-cell">{orders.length ? 'No hay órdenes con este filtro' : 'No hay órdenes todavía'}</p>}
            </div>
        </>
    );
}
