// =====================================================
// Comentarios y pedidos personalizados de la página principal (#temas).
// =====================================================
import { useEffect, useRef, useState } from 'react';
import Stars from '../tienda/Stars.jsx';
import { api } from '../../lib/api.js';
import { shortDate } from '../../lib/texto.js';
import { getSession } from '../../lib/sesion.js';

const EMPTY = { type: 'comentario', name: '', contact: '', requestType: 'ropa', product: '', text: '' };

export default function SiteComments() {
    const [form, setForm] = useState(EMPTY);
    const [status, setStatus] = useState('');
    const [sending, setSending] = useState(false);
    const [feed, setFeed] = useState({ state: 'loading', list: [] });
    const textRef = useRef(null);
    const contactRef = useRef(null);
    const isRequest = form.type === 'pedido';

    async function loadFeed() {
        setFeed((f) => ({ ...f, state: 'loading' }));
        try {
            const list = await api('/api/messages/recent');
            setFeed({ state: 'ok', list: Array.isArray(list) ? list : [] });
        } catch (err) {
            setFeed({ state: 'error', list: [] });
        }
    }

    useEffect(() => { loadFeed(); }, []);

    const set = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        if (field === 'type') setStatus('');
    };

    async function onSubmit(e) {
        e.preventDefault();
        const text = form.text.trim();
        const contact = form.contact.trim();
        if (!text) {
            setStatus(isRequest ? 'Cuéntanos qué prenda o estampado tienes en mente.' : 'Escribe tu comentario antes de enviarlo.');
            textRef.current.focus();
            return;
        }
        if (isRequest && !contact) {
            setStatus('Deja un WhatsApp o correo para poder contactarte.');
            contactRef.current.focus();
            return;
        }

        setSending(true);
        setStatus('Enviando…');
        try {
            await api('/api/messages', {
                method: 'POST',
                body: {
                    type: isRequest ? 'pedido' : 'comentario',
                    name: form.name.trim() || getSession() || 'Anónimo',
                    contact: isRequest ? contact : '',
                    requestType: form.requestType,
                    productId: 'general',
                    productName: form.product.trim(),
                    text
                }
            });
            setForm(EMPTY);
            setStatus(isRequest ? 'Pedido enviado. Te contactaremos pronto.' : 'Comentario publicado.');
            if (!isRequest) loadFeed();
        } catch (err) {
            setStatus(err.message);
        } finally {
            setSending(false);
        }
    }

    const emptyText = {
        loading: 'Cargando comentarios…',
        error: 'No se pudieron cargar los comentarios. Inténtalo de nuevo.',
        ok: 'Todavía no hay comentarios. Sé la primera persona en escribir.'
    }[feed.state];

    return (
        <section className="section comments-section" id="temas" aria-labelledby="siteCommentsTitle">
            <div className="section-title" data-bg="Voz">
                <span className="section-eyebrow">Tu opinión cuenta</span>
                <h2 id="siteCommentsTitle">Comentarios y <em>pedidos</em></h2>
                <p>Déjanos tu opinión o cuéntanos qué prenda o estampado personalizado tienes en mente.</p>
            </div>

            <div className="comments-layout">
                <div className="comments-form-card">
                    <form className="comment-form" onSubmit={onSubmit} noValidate>
                        <div className="comment-form-row">
                            <div className="field">
                                <label htmlFor="siteMsgType">¿Qué quieres enviar?</label>
                                <select id="siteMsgType" value={form.type} onChange={set('type')}>
                                    <option value="comentario">Un comentario</option>
                                    <option value="pedido">Un pedido personalizado</option>
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="siteMsgName">Tu nombre (opcional)</label>
                                <input id="siteMsgName" type="text" maxLength={60} autoComplete="name" placeholder="Anónimo" value={form.name} onChange={set('name')} />
                            </div>
                        </div>

                        <div className="field" hidden={!isRequest}>
                            <label htmlFor="siteMsgContact">WhatsApp o correo</label>
                            <input id="siteMsgContact" type="text" maxLength={120} placeholder="0999999999 o correo@..." ref={contactRef} value={form.contact} onChange={set('contact')} />
                        </div>

                        <div className="field" hidden={!isRequest}>
                            <label htmlFor="siteMsgRequestType">¿Qué necesitas?</label>
                            <select id="siteMsgRequestType" value={form.requestType} onChange={set('requestType')}>
                                <option value="ropa">Una prenda a futuro</option>
                                <option value="estampado">Un estampado personalizado</option>
                                <option value="otro">Otra idea</option>
                            </select>
                        </div>

                        <div className="field" hidden={!isRequest}>
                            <label htmlFor="siteMsgProduct">Producto o referencia (opcional)</label>
                            <input id="siteMsgProduct" type="text" maxLength={120} placeholder="Ej. chaqueta de cuero, camiseta negra..." value={form.product} onChange={set('product')} />
                        </div>

                        <div className="field">
                            <label htmlFor="siteMsgText">{isRequest ? 'Cuéntanos tu idea' : 'Tu comentario'}</label>
                            <textarea
                                id="siteMsgText" maxLength={1000} ref={textRef} value={form.text} onChange={set('text')}
                                placeholder={isRequest ? 'Prenda, colores, talla, referencias...' : '¿Cómo te quedó? ¿Qué te gustó?'}
                            ></textarea>
                        </div>

                        <div className="comment-form-foot">
                            <button type="submit" className="btn-shop" disabled={sending}>
                                {isRequest ? 'Enviar pedido' : 'Publicar comentario'}
                            </button>
                            <p className="comment-form-status" role="status" aria-live="polite">{status}</p>
                        </div>
                    </form>
                </div>

                <div className="comments-feed">
                    <h3>Lo que dicen de StyleID</h3>
                    <p className="comments-feed-empty" hidden={feed.state === 'ok' && feed.list.length > 0}>{emptyText}</p>
                    <ul className="comments-feed-list">
                        {feed.list.map((c) => (
                            <li className="site-comment" key={c._id || `${c.createdAt}-${c.name}`}>
                                <div className="site-comment-head">
                                    <span className="site-comment-name">{c.name || 'Anónimo'}</span>
                                    <time dateTime={new Date(c.createdAt).toISOString()}>{shortDate(c.createdAt)}</time>
                                </div>
                                {c.rating ? (
                                    <span className="stars site-comment-stars" role="img" aria-label={`${c.rating} de 5 estrellas`}>
                                        <Stars value={c.rating} />
                                    </span>
                                ) : null}
                                <p>{c.text}</p>
                                {c.productName && <span className="site-comment-product">{c.productName}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
