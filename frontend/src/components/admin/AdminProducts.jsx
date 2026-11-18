// =====================================================
// Catálogo desde el panel: agregar, ocultar y borrar prendas.
// =====================================================
import { useState } from 'react';
import useDosToques from '../../hooks/useDosToques.js';
import { CATEGORIES, COLORS, STYLES } from '../../data/catalogo.js';
import { api } from '../../lib/api.js';
import { money } from '../../lib/texto.js';

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

// Tallas sugeridas según la categoría (se pueden activar o quitar)
const SIZE_PRESETS = {
    ropa: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    pantalones: ['24', '26', '28', '30', '32', '34', '36'],
    zapatos: ['35', '36', '37', '38', '39', '40', '41', '42', '43'],
    unica: ['Única']
};
const presetFor = (cat) => (cat === 'pantalones' ? 'pantalones'
    : cat === 'zapatos' ? 'zapatos'
    : cat === 'accesorios' || cat === 'bolsos' ? 'unica'
    : 'ropa');

const emptyForm = () => ({
    name: '', genero: 'mujer', categoria: 'camisas', price: '', desc: '',
    color: COLORS[0].id, estilo: STYLES[0].id, sizes: SIZE_PRESETS.ropa
});

/** Reduce la foto a máximo 1000 px y la pasa a JPG para que pese poco. */
function shrinkImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';           // las PNG transparentes quedan con fondo blanco
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la foto')); };
        img.src = url;
    });
}

function ProductRow({ product, token, onUpdated, onDeleted, onError }) {
    const [deleteArmed, tapDelete] = useDosToques();
    const [busy, setBusy] = useState(false);

    async function toggle() {
        setBusy(true);
        try {
            onUpdated(await api(`/api/admin/products/${encodeURIComponent(product._id)}`, { method: 'PUT', body: { active: !product.active }, admin: token }));
        } catch (err) {
            onError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function remove() {
        if (!tapDelete()) return;
        setBusy(true);
        try {
            await api(`/api/admin/products/${encodeURIComponent(product._id)}`, { method: 'DELETE', admin: token });
            onDeleted(product._id);
        } catch (err) {
            onError(err.message);
            setBusy(false);
        }
    }

    return (
        <article className={`product-row${product.active ? '' : ' is-hidden'}`}>
            <img src={product.img} alt="" loading="lazy" />
            <div className="product-row-info">
                <strong>{product.name}</strong>
                <span>{product.genero === 'mujer' ? 'Mujer' : 'Hombre'} · {CATEGORY_LABELS[product.categoria] || ''} · {money(product.price)}</span>
                <small>Tallas: {product.sizes.join(', ')}{!product.active && <> · <em>Oculta en la tienda</em></>}</small>
            </div>
            <div className="product-row-actions">
                <button type="button" className="btn-toggle" disabled={busy} onClick={toggle}>{product.active ? 'Ocultar' : 'Mostrar'}</button>
                <button type="button" className={`btn-delete${deleteArmed ? ' is-armed' : ''}`} disabled={busy} onClick={remove}>{deleteArmed ? '¿Borrar?' : 'Borrar'}</button>
            </div>
        </article>
    );
}

export default function AdminProducts({ products, token, onChange }) {
    const [form, setForm] = useState(emptyForm);
    const [image, setImage] = useState('');         // foto ya reducida, lista para enviar
    const [dragOver, setDragOver] = useState(false);
    const [status, setStatus] = useState({ text: '', kind: '' });
    const [sending, setSending] = useState(false);

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    const preset = SIZE_PRESETS[presetFor(form.categoria)];

    function onCategory(e) {
        const categoria = e.target.value;
        setForm((f) => ({ ...f, categoria, sizes: SIZE_PRESETS[presetFor(categoria)] }));
    }

    function toggleSize(size) {
        setForm((f) => ({ ...f, sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size] }));
    }

    async function loadImageFile(file) {
        if (!file) return;
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
            setStatus({ text: 'La foto debe ser JPG, PNG o WEBP', kind: 'error' });
            return;
        }
        try {
            setImage(await shrinkImage(file));
            setStatus({ text: '', kind: '' });
        } catch (err) {
            setStatus({ text: err.message, kind: 'error' });
        }
    }

    async function onSubmit(e) {
        e.preventDefault();
        // Las tallas se envían en el orden de la lista sugerida
        const sizes = preset.filter((s) => form.sizes.includes(s));
        if (!image) return setStatus({ text: 'Elige una foto de la prenda', kind: 'error' });
        if (!form.name.trim()) return setStatus({ text: 'Escribe el nombre de la prenda', kind: 'error' });
        if (!(Number(form.price) > 0)) return setStatus({ text: 'Escribe un precio válido', kind: 'error' });
        if (!sizes.length) return setStatus({ text: 'Marca al menos una talla', kind: 'error' });

        setSending(true);
        setStatus({ text: 'Subiendo la prenda…', kind: '' });
        try {
            const data = await api('/api/admin/products', {
                method: 'POST',
                admin: token,
                body: {
                    name: form.name.trim(), genero: form.genero, categoria: form.categoria, price: Number(form.price),
                    sizes, desc: form.desc.trim(), color: form.color, estilo: form.estilo, image
                }
            });
            onChange([data, ...products]);
            setForm(emptyForm());
            setImage('');
            setStatus({ text: `«${data.name}» ya está en el catálogo`, kind: 'ok' });
        } catch (err) {
            setStatus({ text: err.message, kind: 'error' });
        } finally {
            setSending(false);
        }
    }

    return (
        <>
            <h2 className="admin-section-title" id="productos">Catálogo: agregar prendas</h2>
            <p className="admin-section-note">Las prendas que agregues aparecen al momento en el catálogo, en la sección de mujer u hombre que elijas.</p>

            <div className="product-admin">
                <form className="product-form" noValidate onSubmit={onSubmit}>
                    <div className="pf-photo">
                        {/* También se puede arrastrar la foto encima del recuadro */}
                        <label
                            className={`pf-drop${dragOver ? ' is-over' : ''}`} htmlFor="pfImage"
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setDragOver(false); loadImageFile(e.dataTransfer.files[0]); }}
                        >
                            {image && <img src={image} alt="" />}
                            <span className="pf-drop-hint" hidden={Boolean(image)}>
                                <i className="fa-solid fa-camera" aria-hidden="true"></i>
                                Toca para elegir la foto
                                <small>JPG, PNG o WEBP</small>
                            </span>
                        </label>
                        <input type="file" id="pfImage" accept="image/jpeg,image/png,image/webp" className="sr-only"
                            onChange={(e) => { loadImageFile(e.target.files[0]); e.target.value = ''; }} />
                    </div>

                    <div className="pf-fields">
                        <label className="pf-field pf-wide">Nombre de la prenda
                            <input type="text" maxLength={60} placeholder="Ej. Camisa de lino blanca" value={form.name} onChange={set('name')} />
                        </label>

                        <fieldset className="pf-field">
                            <legend>Sección</legend>
                            <div className="pf-segment">
                                {[['mujer', 'Mujer'], ['hombre', 'Hombre']].map(([id, label]) => (
                                    <label key={id}>
                                        <input type="radio" name="pfGenero" value={id} checked={form.genero === id} onChange={set('genero')} /> <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <label className="pf-field">Categoría
                            <select value={form.categoria} onChange={onCategory}>
                                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </label>

                        <label className="pf-field">Precio (USD)
                            <input type="number" min="0.01" step="0.01" placeholder="25.00" value={form.price} onChange={set('price')} />
                        </label>

                        <label className="pf-field">Color
                            <select value={form.color} onChange={set('color')}>
                                {COLORS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </label>

                        <label className="pf-field">Estilo
                            <select value={form.estilo} onChange={set('estilo')}>
                                {STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        </label>

                        <fieldset className="pf-field pf-wide">
                            <legend>Tallas disponibles</legend>
                            <div className="pf-sizes">
                                {preset.map((size) => (
                                    <label className="pf-size" key={size}>
                                        <input type="checkbox" value={size} checked={form.sizes.includes(size)} onChange={() => toggleSize(size)} /><span>{size}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <label className="pf-field pf-wide">Descripción
                            <textarea maxLength={400} rows={3} placeholder="Material, corte, con qué combinarla..." value={form.desc} onChange={set('desc')}></textarea>
                        </label>

                        <div className="pf-actions pf-wide">
                            <button type="submit" className="btn-save" disabled={sending}>Agregar al catálogo</button>
                            <p className={`order-admin-status ${status.kind}`} role="status" aria-live="polite">{status.text}</p>
                        </div>
                    </div>
                </form>

                <div className="product-list-wrap">
                    <h3 className="product-list-title">Prendas agregadas <span>{products.length ? `(${products.length})` : ''}</span></h3>
                    <div className="product-list">
                        {products.length ? products.map((p) => (
                            <ProductRow
                                key={p._id} product={p} token={token}
                                onUpdated={(data) => onChange(products.map((x) => (x._id === data._id ? { ...x, ...data } : x)))}
                                onDeleted={(id) => onChange(products.filter((x) => x._id !== id))}
                                onError={(text) => setStatus({ text, kind: 'error' })}
                            />
                        )) : <p className="empty-cell">Todavía no agregaste prendas. Las que agregues aparecerán aquí.</p>}
                    </div>
                </div>
            </div>
        </>
    );
}
