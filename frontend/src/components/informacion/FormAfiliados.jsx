// =====================================================
// Formulario de interesados en el programa de afiliados.
// Se guarda como "pedido" para que aparezca en el panel de administrador.
// =====================================================
import { useRef, useState } from 'react';
import { api } from '../../lib/api.js';

const EMPTY = { name: '', contact: '', text: '' };

export default function FormAfiliados() {
    const [form, setForm] = useState(EMPTY);
    const [status, setStatus] = useState('');
    const [sending, setSending] = useState(false);
    const nameRef = useRef(null);
    const contactRef = useRef(null);

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    async function onSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) {
            setStatus('Escribe tu nombre.');
            nameRef.current.focus();
            return;
        }
        if (!form.contact.trim()) {
            setStatus('Deja un WhatsApp o correo para poder avisarte.');
            contactRef.current.focus();
            return;
        }
        setSending(true);
        setStatus('Enviando…');
        try {
            await api('/api/messages', {
                method: 'POST',
                body: {
                    type: 'pedido',
                    requestType: 'otro',
                    productId: 'afiliados',
                    productName: 'Interesado en afiliados',
                    name: form.name.trim(),
                    contact: form.contact.trim(),
                    text: form.text.trim() || 'Quiero que me avisen cuando empiece el programa de afiliados.'
                }
            });
            setForm(EMPTY);
            setStatus('¡Listo! Te avisaremos cuando empiece el programa.');
        } catch (err) {
            setStatus(err.message);
        } finally {
            setSending(false);
        }
    }

    return (
        <form className="comment-form" onSubmit={onSubmit} noValidate>
            <div className="comment-form-row">
                <div className="field">
                    <label htmlFor="affName">Tu nombre</label>
                    <input id="affName" type="text" maxLength={60} autoComplete="name" ref={nameRef} value={form.name} onChange={set('name')} />
                </div>
                <div className="field">
                    <label htmlFor="affContact">WhatsApp o correo</label>
                    <input id="affContact" type="text" maxLength={120} placeholder="0999999999 o correo@..." ref={contactRef} value={form.contact} onChange={set('contact')} />
                </div>
            </div>
            <div className="field">
                <label htmlFor="affText">¿Por qué te gustaría ser afiliado? (opcional)</label>
                <textarea id="affText" maxLength={600} value={form.text} onChange={set('text')}></textarea>
            </div>
            <div className="comment-form-foot">
                <button type="submit" className="btn-shop" disabled={sending}>Quiero que me avisen</button>
                <p className="comment-form-status" role="status" aria-live="polite">{status}</p>
            </div>
        </form>
    );
}
