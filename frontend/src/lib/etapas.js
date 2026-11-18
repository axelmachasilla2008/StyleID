// =====================================================
// Etapas de un pedido.
// Las usan el panel de administrador (para elegir la etapa) y «Mis pedidos»
// (para mostrar el seguimiento al cliente).
// Si cambias esta lista, cambia también ORDER_STAGES en backend/routes/admin.js.
// =====================================================

// En orden: el pedido avanza de arriba hacia abajo
export const STAGES = [
    { id: 'pendiente', label: 'Pedido recibido', icon: 'fa-receipt', desc: 'Recibimos tu pedido. Estamos esperando la confirmación del pago.' },
    { id: 'pagado', label: 'Pago confirmado', icon: 'fa-circle-check', desc: 'Confirmamos tu pago. Pronto empezamos a preparar tu pedido.' },
    { id: 'preparando', label: 'En preparación', icon: 'fa-box-open', desc: 'Estamos alistando y empacando tus prendas.' },
    { id: 'enviado', label: 'En camino', icon: 'fa-truck-fast', desc: 'Tu pedido ya salió con Servientrega.' },
    { id: 'entregado', label: 'Entregado', icon: 'fa-house-circle-check', desc: 'Tu pedido fue entregado. ¡Gracias por tu compra!' }
];

export const CANCELLED = { id: 'cancelado', label: 'Cancelado', icon: 'fa-ban', desc: 'Este pedido fue cancelado.' };

/** Posición de la etapa (0 = primera). Un estado desconocido cuenta como la primera. */
export function stageIndex(status) {
    const index = STAGES.findIndex((stage) => stage.id === status);
    return index === -1 ? 0 : index;
}

export function getStage(status) {
    return status === CANCELLED.id ? CANCELLED : STAGES[stageIndex(status)];
}

/** Fecha en que la orden entró a una etapa, según su historial (o null). */
export function stageDate(order, stageId) {
    // La primera etapa siempre es la fecha en que se creó la orden
    if (stageId === 'pendiente' && order.createdAt) return new Date(order.createdAt);
    const history = Array.isArray(order.history) ? order.history : [];
    // Se toma la última vez que pasó por esa etapa
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].status === stageId && history[i].at) return new Date(history[i].at);
    }
    return null;
}

export const isActiveOrder = (o) => o.status !== 'entregado' && o.status !== 'cancelado';
export const shortOrderId = (o) => String(o._id).slice(-6).toUpperCase();
