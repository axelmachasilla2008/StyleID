// =====================================================
// Detalle de una prenda: foto ampliable, tallas, opiniones con estrellas
// y formulario de pedido personalizado.
// =====================================================
import { Fragment, useEffect, useRef, useState } from 'react';
import Stars from './Stars.jsx';
import { useCart } from './Carrito.jsx';
import { api } from '../../lib/api.js';
import { refreshRatings } from '../../lib/opiniones.js';
import { money, shortDate, slug } from '../../lib/texto.js';

const DEFAULT_INFO = {
    desc: 'Pieza seleccionada de la colección StyleID. Elige tu talla y combínala a tu estilo.',
    sizes: ['S', 'M', 'L', 'XL']
};
const STAR_WORDS = ['', 'No me gustó', 'Regular', 'Está bien', 'Me gustó', '¡Me encantó!'];
const EMPTY_REQUEST = { name: '', contact: '', type: 'ropa', text: '' };

/** @param {object|null} product  { name, price, img, desc?, sizes? } */
export default function ProductModal({ product, onClose }) {
    const cart = useCart();
    const isOpen = Boolean(product);
    const last = useRef(null);            // la prenda sigue pintada mientras se cierra
    if (product) last.current = product;
    const shown = last.current;

    const dialogRef = useRef(null);
    const closeRef = useRef(null);
    const imgBtnRef = useRef(null);
    const reviewsRef = useRef(null);
    const sizesRef = useRef(null);
    const commentTextRef = useRef(null);
    const starRef = useRef(null);
    const contactRef = useRef(null);
    const requestTextRef = useRef(null);

    const [zoom, setZoom] = useState(false);
    const [origin, setOrigin] = useState('50% 50%');
    const [size, setSize] = useState('');
    const [sizeError, setSizeError] = useState(false);
    const [tab, setTab] = useState('comments');
    const [comments, setComments] = useState({ state: 'loading', list: [] });
    const [rating, setRating] = useState(0);
    const [hoverStar, setHoverStar] = useState(0);
    const [commentName, setCommentName] = useState('');
    const [commentText, setCommentText] = useState('');
    const [commentStatus, setCommentStatus] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [request, setRequest] = useState(EMPTY_REQUEST);
    const [requestStatus, setRequestStatus] = useState('');
    const [sendingRequest, setSendingRequest] = useState(false);

    const productId = shown ? slug(shown.name) : '';
    const info = {
        desc: shown?.desc || DEFAULT_INFO.desc,
        sizes: shown?.sizes?.length ? shown.sizes : DEFAULT_INFO.sizes
    };

    /** Carga desde MongoDB las opiniones públicas de la prenda. */
    async function loadComments(id, isCurrent = () => true) {
        setComments({ state: 'loading', list: [] });
        try {
            const list = await api(`/api/messages?productId=${encodeURIComponent(id)}`);
            if (isCurrent()) setComments({ state: 'ok', list: Array.isArray(list) ? list : [] });
        } catch (err) {
            if (isCurrent()) setComments({ state: 'error', list: [] });
        }
    }

    // Al abrir una prenda: todo vuelve a empezar y se cargan sus opiniones
    useEffect(() => {
        if (!product) return undefined;
        let current = true;
        setZoom(false);
        setOrigin('50% 50%');
        setSize('');
        setSizeError(false);
        setTab('comments');
        setRating(0);
        setHoverStar(0);
        setCommentName('');
        setCommentText('');
        setCommentStatus('');
        setRequest(EMPTY_REQUEST);
        setRequestStatus('');
        loadComments(slug(product.name), () => current);

        const lastFocused = document.activeElement;
        document.body.style.overflow = 'hidden';
        if (dialogRef.current) dialogRef.current.scrollTop = 0;
        syncClosePosition();
        const frame = requestAnimationFrame(() => requestAnimationFrame(() => dialogRef.current?.focus()));

        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            onClose();
        };
        document.addEventListener('keydown', onKey);

        return () => {
            current = false;
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
            lastFocused?.focus?.();
        };
    }, [product]);

    /** Mantiene el botón de cerrar visible mientras se desplaza el diálogo. */
    function syncClosePosition() {
        const dialog = dialogRef.current;
        if (!dialog || !closeRef.current) return;
        const base = window.matchMedia('(max-width: 860px)').matches ? 10 : 14;
        closeRef.current.style.top = `${dialog.scrollTop + base}px`;
    }

    // Mantiene el foco dentro del diálogo
    function trapFocus(e) {
        if (e.key !== 'Tab') return;
        const focusables = [...dialogRef.current.querySelectorAll('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])')]
            .filter((el) => !el.disabled && el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }

    // ---------- Zoom de la foto ----------
    function originFrom(clientX, clientY) {
        const rect = imgBtnRef.current.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
        setOrigin(`${x}% ${y}%`);
    }

    function onImageClick(e) {
        if (zoom) {
            setZoom(false);
            setOrigin('50% 50%');
            return;
        }
        if (e.detail === 0) setOrigin('50% 50%'); else originFrom(e.clientX, e.clientY);
        setZoom(true);
    }

    function onImageMove(e) {
        if (zoom && e.pointerType !== 'touch') originFrom(e.clientX, e.clientY);
    }

    // ---------- Carrito ----------
    function addToCart() {
        if (!size) {
            setSizeError(true);
            sizesRef.current?.querySelector('input')?.focus();
            return;
        }
        const item = { name: `${shown.name} · Talla ${size}`, price: Number(shown.price), img: shown.img };
        onClose();
        cart.add(item);
    }

    // ---------- Pestañas ----------
    function onTabKey(e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const next = tab === 'comments' ? 'request' : 'comments';
        setTab(next);
        document.getElementById(next === 'comments' ? 'pmTabComments' : 'pmTabRequest')?.focus();
    }

    function goToReviews(e) {
        e.preventDefault();
        setTab('comments');
        reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ---------- Opiniones ----------
    const rated = comments.list.filter((c) => c.rating >= 1 && c.rating <= 5);
    const count = rated.length;
    const avg = count ? rated.reduce((sum, c) => sum + c.rating, 0) / count : 0;
    const opinionsText = `${count} ${count === 1 ? 'opinión' : 'opiniones'}`;
    const shownStars = hoverStar || rating;

    async function submitComment(e) {
        e.preventDefault();
        const text = commentText.trim();
        if (!rating) {
            setCommentStatus('Elige de 1 a 5 estrellas para tu opinión.');
            starRef.current?.querySelector('input')?.focus();
            return;
        }
        if (!text) {
            setCommentStatus('Escribe un comentario antes de publicar.');
            commentTextRef.current?.focus();
            return;
        }
        setSendingComment(true);
        setCommentStatus('Publicando…');
        try {
            await api('/api/messages', {
                method: 'POST',
                body: { type: 'comentario', productId, productName: shown.name, name: commentName.trim() || 'Anónimo', rating, text }
            });
            setRating(0);
            setCommentName('');
            setCommentText('');
            await loadComments(productId);
            setCommentStatus('¡Gracias! Tu opinión ya está publicada.');
            refreshRatings();
        } catch (err) {
            setCommentStatus(err.message);
        } finally {
            setSendingComment(false);
        }
    }

    // ---------- Pedido personalizado ----------
    async function submitRequest(e) {
        e.preventDefault();
        if (!request.contact.trim()) {
            setRequestStatus('Deja un WhatsApp o correo para poder contactarte.');
            contactRef.current?.focus();
            return;
        }
        if (!request.text.trim()) {
            setRequestStatus('Cuéntanos qué prenda o estampado tienes en mente.');
            requestTextRef.current?.focus();
            return;
        }
        setSendingRequest(true);
        setRequestStatus('Enviando…');
        try {
            await api('/api/messages', {
                method: 'POST',
                body: {
                    type: 'pedido',
                    productId,
                    productName: shown.name,
                    name: request.name.trim() || 'Anónimo',
                    contact: request.contact.trim(),
                    requestType: request.type,
                    text: request.text.trim()
                }
            });
            setRequest(EMPTY_REQUEST);
            setRequestStatus('Pedido enviado. Te contactaremos pronto.');
        } catch (err) {
            setRequestStatus(err.message);
        } finally {
            setSendingRequest(false);
        }
    }

    const setReq = (field) => (e) => setRequest((r) => ({ ...r, [field]: e.target.value }));

    return (
        <div
            className={`product-modal${isOpen ? ' active' : ''}`} id="productModal" aria-hidden={!isOpen}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="pm-dialog" role="dialog" aria-modal="true" aria-labelledby="pmTitle" tabIndex={-1}
                ref={dialogRef} onScroll={syncClosePosition} onKeyDown={trapFocus}>
                <button className="pm-close" ref={closeRef} type="button" aria-label="Cerrar detalle del producto" onClick={onClose}>
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>

                {shown && (
                    <>
                        <div className="pm-grid">
                            <div className="pm-media">
                                <button
                                    className={`pm-img-btn${zoom ? ' zoomed' : ''}`} type="button" ref={imgBtnRef}
                                    aria-label={zoom ? 'Reducir imagen' : 'Ampliar imagen'} aria-pressed={zoom}
                                    onClick={onImageClick} onPointerMove={onImageMove}
                                >
                                    <img src={shown.img} alt={shown.name} draggable="false" style={{ transformOrigin: origin }} />
                                    <span className="pm-zoom-hint">
                                        <i className={`fa-solid ${zoom ? 'fa-magnifying-glass-minus' : 'fa-magnifying-glass-plus'}`} aria-hidden="true"></i>
                                        {zoom ? ' Toca para reducir' : ' Toca para ampliar'}
                                    </span>
                                </button>
                            </div>

                            <div className="pm-info">
                                <h2 id="pmTitle">{shown.name}</h2>
                                <a
                                    className="pm-rating-link" href="#pmReviews" onClick={goToReviews}
                                    aria-label={comments.state === 'ok' && count
                                        ? `${avg.toFixed(1)} de 5 estrellas, ${opinionsText}. Ver opiniones`
                                        : 'Sin opiniones. Ir a dejar una opinión'}
                                >
                                    <span className="stars"><Stars value={avg} /></span>
                                    <span>
                                        {comments.state === 'loading' && 'Cargando opiniones…'}
                                        {comments.state === 'error' && 'Ver opiniones'}
                                        {comments.state === 'ok' && (count ? `${avg.toFixed(1)} · ${opinionsText}` : 'Sé la primera persona en opinar')}
                                    </span>
                                </a>
                                <p className="pm-price">{money(shown.price)}</p>
                                <p className="pm-desc">{info.desc}</p>

                                <fieldset className="pm-fieldset">
                                    <legend>Talla</legend>
                                    <div className="pm-sizes" ref={sizesRef}>
                                        {info.sizes.map((s, index) => (
                                            <label className="pm-size" key={s}>
                                                <input
                                                    type="radio" name="pm-size" value={s} id={`pmSize${index}`}
                                                    checked={size === s} onChange={() => { setSize(s); setSizeError(false); }}
                                                />
                                                <span>{s}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <p className="pm-error" role="alert" hidden={!sizeError}>Elige una talla para continuar.</p>

                                <button className="pm-add" type="button" onClick={addToCart}>Agregar al carrito</button>
                            </div>
                        </div>

                        {/* Opiniones: debajo de la prenda, a todo el ancho */}
                        <section className="pm-reviews" id="pmReviews" aria-labelledby="pmCommentsTitle" ref={reviewsRef}>
                            <div className="pm-reviews-head">
                                <div>
                                    <p className="pm-reviews-eyebrow">Opiniones</p>
                                    <h3 id="pmCommentsTitle">Lo que dicen de esta prenda</h3>
                                </div>
                                <div className="pm-score">
                                    <strong className="pm-score-value">{count ? avg.toFixed(1) : '–'}</strong>
                                    <div>
                                        <span className="stars pm-score-stars" aria-hidden="true"><Stars value={avg} /></span>
                                        <span className="pm-comment-count">
                                            {comments.state === 'ok' ? (count ? opinionsText : 'Sin opiniones') : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pm-tabs" role="tablist" aria-label="Elige opiniones o pedido personalizado">
                                {[['comments', 'pmTabComments', 'pmCommentsPanel', 'Opiniones'], ['request', 'pmTabRequest', 'pmRequestPanel', 'Pedido personalizado']].map(([id, tabId, panel, label]) => (
                                    <button
                                        key={id} className={`pm-tab${tab === id ? ' active' : ''}`} id={tabId} type="button" role="tab"
                                        aria-selected={tab === id} aria-controls={panel} tabIndex={tab === id ? 0 : -1}
                                        onClick={() => setTab(id)} onKeyDown={onTabKey}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="pm-tabpanel pm-reviews-body" id="pmCommentsPanel" role="tabpanel" aria-labelledby="pmTabComments" hidden={tab !== 'comments'}>
                                <div className="pm-reviews-list">
                                    <p className="pm-comments-empty" hidden={comments.state === 'ok' && comments.list.length > 0}>
                                        {comments.state === 'loading' && 'Cargando opiniones…'}
                                        {comments.state === 'error' && 'No se pudieron cargar las opiniones. Inténtalo de nuevo.'}
                                        {comments.state === 'ok' && 'Todavía no hay opiniones. Sé la primera persona en puntuar esta prenda.'}
                                    </p>
                                    <ul className="pm-comment-list">
                                        {comments.list.map((c) => (
                                            <li className="pm-comment" key={c._id || `${c.createdAt}-${c.name}`}>
                                                <div className="pm-comment-head">
                                                    <span className="pm-comment-name">{c.name || 'Anónimo'}</span>
                                                    <time dateTime={new Date(c.createdAt).toISOString()}>{shortDate(c.createdAt)}</time>
                                                </div>
                                                {c.rating ? (
                                                    <span className="stars pm-comment-stars" role="img" aria-label={`${c.rating} de 5 estrellas`}>
                                                        <Stars value={c.rating} />
                                                    </span>
                                                ) : null}
                                                <p>{c.text}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pm-review-form-card">
                                    <h4 className="pm-review-form-title">Deja tu opinión</h4>
                                    <form className="pm-form" noValidate onSubmit={submitComment}>
                                        <fieldset className="pm-star-field">
                                            <legend className="pm-form-label">Tu puntuación</legend>
                                            <div className={`star-pick${rating ? ' has-value' : ''}`} ref={starRef} onMouseLeave={() => setHoverStar(0)}>
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <Fragment key={n}>
                                                        <input
                                                            type="radio" name="rating" id={`pmStar${n}`} value={n} checked={rating === n}
                                                            onChange={() => {
                                                                setRating(n);
                                                                if (commentStatus.includes('estrella')) setCommentStatus('');
                                                            }}
                                                        />
                                                        <label htmlFor={`pmStar${n}`} className={n <= shownStars ? 'on' : ''} onMouseEnter={() => setHoverStar(n)}>
                                                            <i className="fa-solid fa-star" aria-hidden="true"></i>
                                                            <span className="sr-only">{n} {n === 1 ? 'estrella' : 'estrellas'}</span>
                                                        </label>
                                                    </Fragment>
                                                ))}
                                                <span className="star-pick-text">{shownStars ? STAR_WORDS[shownStars] : 'Toca una estrella'}</span>
                                            </div>
                                        </fieldset>
                                        <label className="pm-form-label" htmlFor="pmCommentName">Tu nombre (opcional)</label>
                                        <input id="pmCommentName" type="text" maxLength={40} autoComplete="name" placeholder="Anónimo"
                                            value={commentName} onChange={(e) => setCommentName(e.target.value)} />
                                        <label className="pm-form-label" htmlFor="pmCommentText">Tu comentario</label>
                                        <textarea id="pmCommentText" maxLength={500} required placeholder="¿Cómo te quedó? ¿Qué te gustó?"
                                            ref={commentTextRef} value={commentText} onChange={(e) => setCommentText(e.target.value)}></textarea>
                                        <button type="submit" disabled={sendingComment}>Publicar opinión</button>
                                    </form>
                                    <p className="pm-comment-status" role="status" aria-live="polite">{commentStatus}</p>
                                </div>
                            </div>

                            <div className="pm-tabpanel" id="pmRequestPanel" role="tabpanel" aria-labelledby="pmTabRequest" hidden={tab !== 'request'}>
                                <p className="pm-request-note">
                                    ¿Tienes en mente una prenda a futuro o un estampado personalizado? Cuéntanos tu idea y te contactamos.
                                </p>
                                <p className="pm-request-ref">Sobre: {shown.name}</p>

                                <form className="pm-form" onSubmit={submitRequest} noValidate>
                                    <div className="pm-form-row">
                                        <div>
                                            <label className="pm-form-label" htmlFor="pmRequestName">Tu nombre</label>
                                            <input id="pmRequestName" type="text" maxLength={40} autoComplete="name" placeholder="Tu nombre"
                                                value={request.name} onChange={setReq('name')} />
                                        </div>
                                        <div>
                                            <label className="pm-form-label" htmlFor="pmRequestContact">WhatsApp o correo</label>
                                            <input id="pmRequestContact" type="text" maxLength={120} placeholder="0999999999 o correo@..."
                                                ref={contactRef} value={request.contact} onChange={setReq('contact')} />
                                        </div>
                                    </div>
                                    <label className="pm-form-label" htmlFor="pmRequestType">¿Qué necesitas?</label>
                                    <select id="pmRequestType" value={request.type} onChange={setReq('type')}>
                                        <option value="ropa">Una prenda a futuro</option>
                                        <option value="estampado">Un estampado personalizado</option>
                                        <option value="otro">Otra idea</option>
                                    </select>
                                    <label className="pm-form-label" htmlFor="pmRequestText">Cuéntanos tu idea</label>
                                    <textarea id="pmRequestText" maxLength={1000} placeholder="Prenda, colores, talla, referencias..."
                                        ref={requestTextRef} value={request.text} onChange={setReq('text')}></textarea>
                                    <button type="submit" disabled={sendingRequest}>Enviar pedido</button>
                                </form>
                                <p className="pm-comment-status" role="status" aria-live="polite">{requestStatus}</p>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
