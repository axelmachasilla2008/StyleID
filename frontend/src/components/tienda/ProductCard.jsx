import { useState } from 'react';
import Stars from './Stars.jsx';
import { money, slug } from '../../lib/texto.js';
import { toggleFav, useFavs } from '../../lib/favoritos.js';
import { useRatings } from '../../lib/opiniones.js';
import { showToast } from '../../lib/toast.js';

/**
 * Tarjeta de una prenda (carruseles y catálogo).
 * Al tocarla, o su botón «Comprar», se abre el detalle con onOpen(product).
 *
 * @param {object}  product  { name, price, img, alt?, fallback?, desc?, sizes? }
 * @param {string}  [tag]    etiqueta bajo el nombre («Mujer · Camisas»)
 * @param {boolean} [isNew]  muestra la etiqueta «Nuevo»
 * @param {boolean} [clone]  copia del carrusel: oculta para lectores de pantalla
 */
export default function ProductCard({ product, tag, isNew = false, clone = false, lazy = false, onOpen }) {
    const favs = useFavs();
    const ratings = useRatings();
    const [src, setSrc] = useState(product.img);

    const liked = favs.some((f) => f.name === product.name);
    const rating = ratings[slug(product.name)];
    const skipTab = clone ? -1 : undefined;

    function open() {
        onOpen?.({ ...product, img: src });
    }

    function onCardClick(e) {
        if (e.target.closest('.like-btn, .btn-buy, a')) return;
        open();
    }

    function onKeyDown(e) {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
        }
    }

    function onLike() {
        const saved = toggleFav({ name: product.name, price: money(product.price), img: src });
        showToast(saved ? 'Guardado en tus favoritos' : 'Quitado de tus favoritos', 2200);
    }

    // Si la foto no carga, se usa la foto de su categoría
    function onImgError() {
        if (product.fallback && src !== product.fallback) setSrc(product.fallback);
    }

    return (
        <div
            className={`card product-card${isNew ? ' is-new' : ''}`}
            tabIndex={clone ? undefined : 0}
            aria-haspopup={clone ? undefined : 'dialog'}
            aria-hidden={clone || undefined}
            data-clone={clone || undefined}
            onClick={onCardClick}
            onKeyDown={onKeyDown}
        >
            <button
                className={`like-btn${liked ? ' liked' : ''}`} type="button" tabIndex={skipTab}
                aria-label={liked ? 'Quitar de favoritos' : 'Guardar en favoritos'} aria-pressed={liked}
                onClick={onLike}
            >
                <i className={`${liked ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
            </button>
            {isNew && <span className="new-badge">Nuevo</span>}
            <div className="product-img">
                <img src={src} alt={product.alt || product.name} loading={lazy ? 'lazy' : undefined} onError={onImgError} />
            </div>
            <h4>{product.name}</h4>
            {tag && <span className="product-tag">{tag}</span>}
            <CardRating rating={rating} />
            <div className="product-footer">
                <span className="price">{money(product.price)}</span>
                <button className="btn-buy" tabIndex={skipTab} onClick={open}>Comprar</button>
            </div>
        </div>
    );
}

/** Promedio de estrellas de la tarjeta. */
function CardRating({ rating }) {
    if (rating && rating.count) {
        const opinions = rating.count === 1 ? 'opinión' : 'opiniones';
        return (
            <div className="card-rating" role="img" aria-label={`${rating.avg.toFixed(1)} de 5 estrellas, ${rating.count} ${opinions}`}>
                <span className="card-stars"><Stars value={rating.avg} /></span>
                <span className="card-rating-num">{rating.avg.toFixed(1)}</span>
                <span className="card-rating-count">({rating.count})</span>
            </div>
        );
    }
    return (
        <div className="card-rating is-empty" role="img" aria-label="Sin opiniones todavía">
            <span className="card-stars"><Stars value={0} /></span>
            <span className="card-rating-count">Sin opiniones</span>
        </div>
    );
}
