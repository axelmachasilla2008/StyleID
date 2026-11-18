// =====================================================
// Comentarios y pedidos personalizados que llegan desde la tienda.
// =====================================================
import { api } from '../../lib/api.js';

const REQUEST_LABELS = { ropa: 'Prenda a futuro', estampado: 'Estampado personalizado', otro: 'Otra idea' };

export default function AdminMessages({ messages, token }) {
    async function setStatus(id, status) {
        try {
            await api(`/api/admin/messages/${encodeURIComponent(id)}`, { method: 'PUT', body: { status }, admin: token });
        } catch (err) { /* el aviso de error ya lo muestra la tienda */ }
    }

    return (
        <>
            <h2 className="admin-section-title">Comentarios y pedidos personalizados</h2>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Cliente</th>
                            <th>Producto</th>
                            <th>Mensaje</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!messages.length && (
                            <tr><td colSpan={6} className="empty-cell">Todavía no hay comentarios ni pedidos personalizados</td></tr>
                        )}
                        {messages.map((m) => {
                            const isRequest = m.type === 'pedido';
                            return (
                                <tr key={m._id}>
                                    <td>
                                        <span className={`msg-badge ${isRequest ? 'pedido' : 'comentario'}`}>{isRequest ? 'Pedido' : 'Comentario'}</span>
                                        {isRequest && <span className="msg-request">{REQUEST_LABELS[m.requestType] || 'Pedido personalizado'}</span>}
                                    </td>
                                    <td>{m.name}<span className="msg-contact">{m.contact || 'Sin contacto'}</span></td>
                                    <td>{m.productName || '—'}</td>
                                    <td className="msg-text">{m.text}</td>
                                    <td>{new Date(m.createdAt).toLocaleDateString('es-EC')}</td>
                                    <td>
                                        <select className="status-select msg-status" defaultValue={m.status} onChange={(e) => setStatus(m._id, e.target.value)}>
                                            <option value="nuevo">nuevo</option>
                                            <option value="atendido">atendido</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}
