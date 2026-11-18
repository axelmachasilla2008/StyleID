// =====================================================
// «Mis favoritos»: las prendas que la persona marcó con el corazón.
// =====================================================
import { useEffect, useMemo, useState } from 'react';
import { CATALOG } from '../../data/catalogo.js';
import { NEW_ARRIVALS, TRENDING } from '../../data/destacados.js';
import { api } from '../../lib/api.js';
import { removeFav, useFavs } from '../../lib/favoritos.js';
import { money } from '../../lib/texto.js';
import { showToast } from '../../lib/toast.js';

// Datos de respaldo para favoritos guardados solo con el nombre o con una foto local antigua
const KNOWN = new Map([
    ...CATALOG.map((p) => [p.name, { price: money(p.price), img: p.img }]),
    ...[...TRENDING, ...NEW_ARRIVALS].map((p) => [p.name, { price: money(p.price), img: p.img, href: 'sala.html#tendencia' }])
]);
const isLocalImg = (img) => /^\.?\/?img\//.test(img || '');

function FavCard({ fav }) {
    const [broken, setBroken] = useState(false);
    const href = fav.href || `catalogo.html?q=${encodeURIComponent(fav.name)}`;
    const hasImg = fav.img && !broken;

    function remove() {
        removeFav(fav.name);
        showToast('Quitado de tus favoritos', 2400);
    }

    return (
        <article className="fav-card">
            <a className={`fav-media${hasImg ? '' : ' no-img'}`} href={href} aria-label={`Ver ${fav.name} en el catálogo`}>
                {hasImg && <img src={fav.img} alt="" loading="lazy" onError={() => setBroken(true)} />}
            </a>
            <div className="fav-body">
                <h4>{fav.name}</h4>
                {fav.price && <span className="fav-price">{fav.price}</span>}
                <div className="fav-actions">
                    <a className="fav-view" href={href}>Ver prenda</a>
                    <button type="button" className="fav-remove" aria-label={`Quitar ${fav.name} de favoritos`} title="Quitar de favoritos" onClick={remove}>
                        <i className="fa-solid fa-heart" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function Favoritos() {
    const favs = useFavs();
    const [serverKnown, setServerKnown] = useState(new Map());

    // Prendas agregadas desde el panel (por si falta su foto o precio)
    useEffect(() => {
        api('/api/products')
            .then((list) => {
                if (Array.isArray(list)) setServerKnown(new Map(list.map((p) => [p.name, { price: money(p.price), img: p.img }])));
            })
            .catch(() => { /* se muestran como están */ });
    }, []);

    const list = useMemo(() => favs
        .map((item) => {
            const extra = serverKnown.get(item.name) || KNOWN.get(item.name);
            if (!extra) return isLocalImg(item.img) ? { ...item, img: '' } : item;
            return {
                ...item,
                price: item.price || extra.price,
                img: (isLocalImg(item.img) ? extra.img : item.img) || extra.img,
                href: extra.href
            };
        })
        .sort((a, b) => (b.at || 0) - (a.at || 0)), [favs, serverKnown]);   // lo más reciente primero

    return (
        <section className="favs-section" id="favoritos" aria-labelledby="favsTitle">
            <div className="favs-head">
                <div>
                    <span className="favs-eyebrow"><i className="fa-solid fa-heart" aria-hidden="true"></i> Guardado por ti</span>
                    <h3 id="favsTitle">Mis favoritos</h3>
                </div>
                <span className="favs-count">{list.length ? `${list.length} ${list.length === 1 ? 'prenda' : 'prendas'}` : ''}</span>
            </div>
            <div className="favs-grid">
                {list.map((fav) => <FavCard key={fav.name} fav={fav} />)}
            </div>
            <div className="favs-empty" hidden={list.length > 0}>
                <i className="fa-regular fa-heart" aria-hidden="true"></i>
                <p>Todavía no guardas prendas. Toca el corazón de cualquier prenda y aparecerá aquí.</p>
                <a className="btn-ghost-sm" href="catalogo.html">Ir al catálogo</a>
            </div>
        </section>
    );
}
