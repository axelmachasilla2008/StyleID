// =====================================================
// Catálogo (catalogo.html): filtros por género, categoría, color, estilo,
// talla, orden y búsqueda. Los filtros quedan en la URL.
// =====================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import NavSearch from '../components/layout/NavSearch.jsx';
import Footer from '../components/layout/Footer.jsx';
import ProductCard from '../components/tienda/ProductCard.jsx';
import ProductModal from '../components/tienda/ProductModal.jsx';
import { CartProvider, CartButton, CartDrawer } from '../components/tienda/Carrito.jsx';
import {
    categoryById, colorById, styleById, extraCount, matches, sizeGroups,
    sortEntries, stateFromUrl, syncUrl, toEntry, tokensOf
} from '../components/catalogo/filtros.js';
import { CATALOG, CATEGORIES, COLORS, GENDERS, STYLES } from '../data/catalogo.js';
import { api } from '../lib/api.js';
import { revealOnScroll } from '../lib/animaciones.js';
import { plural } from '../lib/texto.js';

const LINKS = [
    { href: 'sala.html', label: 'Inicio' },
    { href: 'catalogo.html', label: 'Catálogo', current: true },
    { href: 'sala.html#tendencia', label: 'Tendencias' },
    { href: 'sala.html#novedades', label: 'Novedades' },
    { href: 'estilo.html', label: 'Escoge tu estilo' },
    { href: 'ordenes.html', label: 'Mis pedidos' }
];

const BASE_ENTRIES = CATALOG.map((p, i) => toEntry(p, i)).filter(Boolean);
const NO_EXTRA = { color: '', estilo: '', talla: '', orden: '' };

export default function Catalogo() {
    const [state, setState] = useState(stateFromUrl);
    const [serverEntries, setServerEntries] = useState([]);
    const [product, setProduct] = useState(null);
    const [moreOpen, setMoreOpen] = useState(() => extraCount(stateFromUrl()) > 0);
    const controlsRef = useRef(null);
    const searchRef = useRef(null);

    const update = (changes) => setState((s) => ({ ...s, ...changes }));

    // Prendas agregadas desde el panel: van primero en su grupo con la etiqueta «Nuevo»
    useEffect(() => {
        api('/api/products')
            .then((list) => {
                if (!Array.isArray(list)) return;
                setServerEntries(list.map((p, i) => toEntry(p, -list.length + i, true)).filter(Boolean));
            })
            .catch(() => { /* sin servidor: quedan las prendas de ejemplo */ });
    }, []);

    useEffect(() => revealOnScroll('.section-title, .catalog-controls', (el) => (el.matches('.section-title') ? '' : '120ms')), []);

    const entries = useMemo(() => [...serverEntries, ...BASE_ENTRIES], [serverEntries]);
    const groupsOfSizes = useMemo(() => sizeGroups(entries), [entries]);
    const usedColors = useMemo(() => new Set(entries.map((e) => e.product.color)), [entries]);
    const usedStyles = useMemo(() => new Set(entries.map((e) => e.product.estilo)), [entries]);

    // Una talla que ya no existe se ignora
    const validSize = groupsOfSizes.some(([, sizes]) => sizes.includes(state.talla));
    const filters = validSize ? state : { ...state, talla: '' };

    useEffect(() => { syncUrl(filters); }, [filters.genero, filters.categoria, filters.color, filters.estilo, filters.talla, filters.orden, filters.q]);

    const tokens = tokensOf(filters.q);
    const visible = sortEntries(entries.filter((e) => matches(e, filters, tokens)), filters.orden);
    const total = visible.length;
    const active = extraCount(filters);

    // ---------- Textos ----------
    const parts = [];
    if (filters.genero !== 'todo') parts.push(GENDERS[filters.genero].label);
    if (filters.categoria !== 'todas') parts.push(categoryById[filters.categoria].label);
    if (filters.color) parts.push(colorById[filters.color].label);
    if (filters.estilo) parts.push(styleById[filters.estilo].label);
    if (filters.talla) parts.push(`Talla ${filters.talla === 'Única' ? 'única' : filters.talla}`);
    const subtitle = parts.length ? parts.join(' · ') : 'Ropa para hombre y mujer, elige y combina a tu estilo';
    const q = filters.q.trim();
    const countText = q ? `${plural(total, 'resultado', 'resultados')} para “${q}”` : plural(total, 'prenda', 'prendas');

    // Sin resultados: ofrece buscar en todo el catálogo si allí sí hay
    let empty = null;
    if (total === 0) {
        const elsewhere = entries.filter((e) => matches(e, filters, tokens, { genero: 'todo', categoria: 'todas', extra: false })).length;
        if (!q && active && elsewhere > 0) {
            empty = { text: 'No hay prendas con esta combinación de filtros. Prueba quitando alguno.', button: 'Quitar filtros', all: true };
        } else if (q && elsewhere > 0) {
            empty = { text: `No hay “${q}” con estos filtros, pero encontramos ${plural(elsewhere, 'prenda', 'prendas')} en todo el catálogo.`, button: 'Ver en todo el catálogo', all: true };
        } else {
            empty = {
                text: q ? `No encontramos nada para “${q}”. Prueba con otra palabra, por ejemplo “jean” o “bolso”.` : 'Todavía no hay prendas en esta sección.',
                button: 'Limpiar filtros',
                all: false
            };
        }
    }

    function onEmptyButton() {
        update({ genero: 'todo', categoria: 'todas', ...NO_EXTRA, ...(empty.all ? {} : { q: '' }) });
    }

    // La lupa del menú filtra aquí mismo en lugar de recargar la página
    function onNavSearch(text) {
        update({ q: text });
        controlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return (
        <PageShell>
            <CartProvider>
                <Navbar links={LINKS} icon="fa-hanger">
                    <NavSearch query={filters.q} onSearch={onNavSearch} />
                </Navbar>

                <main className="catalog-page">
                    {/* ===== Encabezado y filtros ===== */}
                    <section className="section catalog-head" aria-labelledby="catalogTitle">
                        <div className="section-title" data-bg="Estilo">
                            <span className="section-eyebrow">Mujer y hombre</span>
                            <h2 id="catalogTitle">Nuestro <em>catálogo</em></h2>
                            <p>{subtitle}</p>
                        </div>

                        <div className="catalog-controls" id="catalogControls" ref={controlsRef}>
                            <div className="gender-switch" role="group" aria-label="Filtrar por género">
                                {[['todo', 'Todo', null], ['mujer', 'Mujer', 'fa-person-dress'], ['hombre', 'Hombre', 'fa-person']].map(([id, label, icon]) => (
                                    <button key={id} type="button" aria-pressed={filters.genero === id} onClick={() => update({ genero: id })}>
                                        {icon && <i className={`fa-solid ${icon}`} aria-hidden="true"></i>}{icon ? ` ${label}` : label}
                                    </button>
                                ))}
                            </div>

                            <form className="catalog-search" role="search" onSubmit={(e) => { e.preventDefault(); searchRef.current.blur(); }}>
                                <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                                <label className="sr-only" htmlFor="catalogSearch">Buscar en el catálogo</label>
                                <input
                                    type="search" id="catalogSearch" placeholder="Busca camisas, jeans, bolsos…" autoComplete="off"
                                    ref={searchRef} value={filters.q} onChange={(e) => update({ q: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Escape' && filters.q) { e.preventDefault(); update({ q: '' }); } }}
                                />
                                <button type="button" className="catalog-search-clear" aria-label="Borrar búsqueda" hidden={!filters.q}
                                    onClick={() => { update({ q: '' }); searchRef.current.focus(); }}>
                                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                                </button>
                            </form>

                            <div className="category-chips" role="group" aria-label="Filtrar por categoría">
                                {[{ id: 'todas', label: 'Todas' }, ...CATEGORIES].map((c) => (
                                    <button key={c.id} type="button" className="chip" aria-pressed={filters.categoria === c.id} onClick={() => update({ categoria: c.id })}>
                                        {c.label}
                                    </button>
                                ))}
                            </div>

                            {/* Más filtros: color, estilo, talla y orden */}
                            <details className="more-filters" open={moreOpen} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
                                <summary>
                                    <i className="fa-solid fa-sliders" aria-hidden="true"></i> Más filtros
                                    <span className="filters-badge" hidden={!active}>{active}</span>
                                    <i className="fa-solid fa-chevron-down more-filters-arrow" aria-hidden="true"></i>
                                </summary>
                                <div className="more-filters-body">
                                    <div className="filter-row">
                                        <span className="filter-label" id="lblColor">Color</span>
                                        <div className="color-chips" role="group" aria-labelledby="lblColor">
                                            {COLORS.filter((c) => usedColors.has(c.id)).map((c) => (
                                                // Un toque elige el color; otro toque sobre el mismo lo quita
                                                <button key={c.id} type="button" className="color-chip" title={c.label} aria-pressed={filters.color === c.id}
                                                    onClick={() => update({ color: filters.color === c.id ? '' : c.id })}>
                                                    <span className="swatch" aria-hidden="true" style={{ background: c.hex }}></span>
                                                    <span className="color-name">{c.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="filter-row">
                                        <span className="filter-label" id="lblEstilo">Estilo</span>
                                        <div className="category-chips style-chips" role="group" aria-labelledby="lblEstilo">
                                            {STYLES.filter((s) => usedStyles.has(s.id)).map((s) => (
                                                <button key={s.id} type="button" className="chip" aria-pressed={filters.estilo === s.id}
                                                    onClick={() => update({ estilo: filters.estilo === s.id ? '' : s.id })}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="filter-row filter-row-selects">
                                        <label className="filter-select">
                                            <span className="filter-label">Talla</span>
                                            <select value={filters.talla} onChange={(e) => update({ talla: e.target.value })}>
                                                <option value="">Todas las tallas</option>
                                                {groupsOfSizes.map(([label, sizes]) => (
                                                    <optgroup key={label} label={label}>
                                                        {sizes.map((s) => <option key={s} value={s}>{s === 'Única' ? 'Talla única' : s}</option>)}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="filter-select">
                                            <span className="filter-label">Ordenar</span>
                                            <select value={filters.orden} onChange={(e) => update({ orden: e.target.value })}>
                                                <option value="">Recomendado</option>
                                                <option value="precio-asc">Precio: menor a mayor</option>
                                                <option value="precio-desc">Precio: mayor a menor</option>
                                                <option value="nombre">Nombre (A–Z)</option>
                                            </select>
                                        </label>
                                        <button type="button" className="filters-reset" hidden={!active} onClick={() => update(NO_EXTRA)}>
                                            <i className="fa-solid fa-rotate-left" aria-hidden="true"></i> Quitar filtros
                                        </button>
                                    </div>
                                </div>
                            </details>

                            <p className="catalog-count" role="status" aria-live="polite">{countText}</p>
                        </div>
                    </section>

                    {/* ===== Ropa separada por género ===== */}
                    {['mujer', 'hombre'].map((genero) => {
                        const list = visible.filter((e) => e.product.genero === genero);
                        const allowed = filters.genero === 'todo' || filters.genero === genero;
                        const label = GENDERS[genero].label;
                        return (
                            <section key={genero} className="catalog-group" data-genero={genero} aria-labelledby={`group${label}`} hidden={!allowed || !list.length}>
                                <div className="catalog-group-head">
                                    <h3 id={`group${label}`}>{label}</h3>
                                    <span className="catalog-group-count">{plural(list.length, 'prenda', 'prendas')}</span>
                                </div>
                                <div className="catalog-grid">
                                    {list.map((e) => (
                                        <ProductCard key={e.key} product={e.product} tag={e.tag} isNew={e.isNew} lazy onOpen={setProduct} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {empty && (
                        <div className="catalog-empty">
                            <i className="fa-solid fa-shirt" aria-hidden="true"></i>
                            <p>{empty.text}</p>
                            <button type="button" className="btn-shop" onClick={onEmptyButton}>{empty.button}</button>
                        </div>
                    )}
                </main>

                <Footer />

                <CartButton />
                <CartDrawer />
                <ProductModal product={product} onClose={() => setProduct(null)} />
            </CartProvider>
        </PageShell>
    );
}
