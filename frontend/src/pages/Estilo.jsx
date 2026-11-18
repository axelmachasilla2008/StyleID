// =====================================================
// Escoge tu estilo (estilo.html): chat con la asesora (IA).
// Habla con POST /api/stylist. La conversación se guarda en la pestaña
// (sessionStorage) para no perderla al ir al catálogo y volver.
// =====================================================
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import { CookieLink } from '../components/layout/Footer.jsx';
import { api } from '../lib/api.js';
import { leerJSON, guardarJSON } from '../lib/almacenamiento.js';
import { toggleFav, useFavs } from '../lib/favoritos.js';
import { money } from '../lib/texto.js';
import { showToast } from '../lib/toast.js';

const CHAT_KEY = 'styleid_stylist_chat';
const LINKS = [
    { href: 'sala.html', label: 'Inicio' },
    { href: 'catalogo.html', label: 'Catálogo' },
    { href: 'estilo.html', label: 'Escoge tu estilo', current: true },
    { href: 'ordenes.html', label: 'Mis pedidos' }
];
const GREETING = {
    role: 'assistant',
    content: '¡Hola! Soy tu asesora de estilo de StyleID. Cuéntame qué buscas y te ayudo a encontrar tu prenda ideal. ¿Es para mujer o para hombre?',
    picks: [],
    suggestions: ['Para mujer', 'Para hombre', 'Es un regalo']
};

function loadHistory() {
    const saved = leerJSON(CHAT_KEY, null, 'session');
    return Array.isArray(saved) && saved.length ? saved : [GREETING];
}

/** Prenda recomendada dentro del chat. */
function PickCard({ pick }) {
    const favs = useFavs();
    const [broken, setBroken] = useState(false);
    const on = favs.some((f) => f.name === pick.name);
    const link = `catalogo.html?q=${encodeURIComponent(pick.name)}`;

    function onFav() {
        const saved = toggleFav({ name: pick.name, price: money(pick.price), img: pick.img });
        showToast(saved ? 'Guardado en tus favoritos' : 'Quitado de tus favoritos');
    }

    return (
        <article className="pick-card">
            <a className={`pick-media${broken ? ' no-img' : ''}`} href={link} aria-label={`Ver ${pick.name} en el catálogo`}>
                <img src={pick.img} alt="" loading="lazy" onError={() => setBroken(true)} />
            </a>
            <div className="pick-body">
                <span className="pick-tag">{pick.genero === 'mujer' ? 'Mujer' : 'Hombre'} · {pick.categoriaLabel}</span>
                <h4>{pick.name}</h4>
                <p>{pick.reason}</p>
                <div className="pick-foot">
                    <span className="pick-price">{money(pick.price)}</span>
                    <div className="pick-actions">
                        <button type="button" className={`pick-fav${on ? ' on' : ''}`} aria-pressed={on}
                            aria-label={on ? `Quitar ${pick.name} de favoritos` : `Guardar ${pick.name} en favoritos`} onClick={onFav}>
                            <i className={`${on ? 'fa-solid' : 'fa-regular'} fa-heart`} aria-hidden="true"></i>
                        </button>
                        <a className="pick-view" href={link}>Ver prenda</a>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function Estilo() {
    const [history, setHistory] = useState(loadHistory);
    const [busy, setBusy] = useState(false);
    const [input, setInput] = useState('');
    const logRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { guardarJSON(CHAT_KEY, history.slice(-40), 'session'); }, [history]);

    // Siempre se ve el último mensaje
    useLayoutEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [history, busy]);

    // El cuadro de texto crece con el mensaje (hasta 140 px)
    useLayoutEffect(() => {
        const el = inputRef.current;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, [input]);

    async function send(text) {
        const content = String(text || '').trim();
        if (!content || busy) return;

        const userMsg = { role: 'user', content: content.slice(0, 800) };
        const next = [...history, userMsg];
        setHistory(next);
        setInput('');
        setBusy(true);

        try {
            // Al servidor solo va el texto (sin tarjetas ni sugerencias)
            const data = await api('/api/stylist', {
                method: 'POST',
                body: { messages: next.map((m) => ({ role: m.role, content: m.content })) }
            });
            setHistory([...next, {
                role: 'assistant',
                content: data.reply,
                picks: Array.isArray(data.picks) ? data.picks : [],
                suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
            }]);
        } catch (err) {
            // El mensaje de la persona se quita para que pueda reintentar
            setHistory(history);
            setInput(content);
            showToast(err.message);
        } finally {
            setBusy(false);
            inputRef.current?.focus();
        }
    }

    function reset() {
        if (busy) return;
        setHistory([GREETING]);
        inputRef.current.focus();
    }

    const last = history[history.length - 1];
    const chips = !busy && last?.role === 'assistant' ? last.suggestions || [] : [];

    return (
        <PageShell>
            <Navbar links={LINKS} />

            <main className="stylist-page">
                <section className="stylist-intro">
                    <span className="stylist-eyebrow"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Asesora con inteligencia artificial</span>
                    <h1>Escoge tu <em>estilo</em></h1>
                    <p className="stylist-lead">Cuéntale a nuestra asesora para quién es, la ocasión y lo que te gusta. Te hace un par de preguntas y te recomienda prendas reales de la tienda.</p>

                    <ol className="stylist-steps">
                        <li><span>1</span><div><strong>Cuéntale qué buscas</strong><p>Una salida, el trabajo, un regalo o tu día a día.</p></div></li>
                        <li><span>2</span><div><strong>Responde sus preguntas</strong><p>Estilo, colores, presupuesto y talla.</p></div></li>
                        <li><span>3</span><div><strong>Recibe tus prendas ideales</strong><p>Guárdalas con el corazón o ábrelas en el catálogo.</p></div></li>
                    </ol>
                </section>

                <section className="chat-card" aria-label="Conversación con la asesora de estilo">
                    <header className="chat-head">
                        <div className="chat-avatar" aria-hidden="true"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                        <div className="chat-who">
                            <strong>Asesora StyleID</strong>
                            <span className="chat-status"><i aria-hidden="true"></i> {busy ? 'Escribiendo…' : 'En línea'}</span>
                        </div>
                        <button type="button" className="chat-reset" title="Empezar de nuevo" onClick={reset}>
                            <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
                            <span>Empezar de nuevo</span>
                        </button>
                    </header>

                    <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions" ref={logRef}>
                        {history.map((msg, i) => (
                            <div key={i} className={`msg msg-${msg.role === 'user' ? 'user' : 'bot'}`}>
                                <div className="msg-bubble">{msg.content}</div>
                                {msg.picks?.length > 0 && (
                                    <div className="msg-picks">
                                        {msg.picks.map((p) => <PickCard key={p.name} pick={p} />)}
                                    </div>
                                )}
                            </div>
                        ))}
                        {busy && (
                            <div className="msg msg-bot">
                                <div className="msg-bubble typing" aria-label="La asesora está escribiendo"><span></span><span></span><span></span></div>
                            </div>
                        )}
                    </div>

                    <div className="chat-chips" aria-label="Respuestas rápidas" hidden={!chips.length}>
                        {chips.map((text) => (
                            <button key={text} type="button" onClick={() => send(text)}>{text}</button>
                        ))}
                    </div>

                    <form className="chat-form" autoComplete="off" onSubmit={(e) => { e.preventDefault(); send(input); }}>
                        <label className="sr-only" htmlFor="chatInput">Escribe tu mensaje</label>
                        <textarea
                            id="chatInput" rows={1} maxLength={800} placeholder="Ej.: busco un look para una fiesta, soy mujer"
                            ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                // Enter envía; Shift+Enter hace salto de línea
                                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    send(input);
                                }
                            }}
                        ></textarea>
                        <button type="submit" aria-label="Enviar mensaje" disabled={busy}>
                            <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                        </button>
                    </form>
                    <p className="chat-note">Las recomendaciones las genera una IA con base en nuestro catálogo. Revisa tallas y detalles antes de comprar.</p>
                </section>
            </main>

            <footer className="footer">
                <p className="stylist-footer">
                    <a href="informacion.html#envios">Envíos</a> ·{' '}
                    <a href="informacion.html#tallas">Guía de tallas</a> ·{' '}
                    <CookieLink />
                </p>
            </footer>
        </PageShell>
    );
}
