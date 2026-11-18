// =====================================================
// Lógica de filtros del catálogo (sin React, fácil de probar).
// =====================================================
import { CATEGORIES, COLORS, GENDERS, STYLES } from '../../data/catalogo.js';
import { normalizeText } from '../../lib/texto.js';

export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
export const colorById = Object.fromEntries(COLORS.map((c) => [c.id, c]));
export const styleById = Object.fromEntries(STYLES.map((s) => [s.id, s]));
export const SORTS = ['precio-asc', 'precio-desc', 'nombre'];

/** Filtros iniciales desde la URL (?genero=mujer&categoria=camisas&color=negro&...). */
export function stateFromUrl(search = location.search) {
    const params = new URLSearchParams(search);
    return {
        genero: GENDERS[params.get('genero')] ? params.get('genero') : 'todo',
        categoria: categoryById[params.get('categoria')] ? params.get('categoria') : 'todas',
        color: colorById[params.get('color')] ? params.get('color') : '',
        estilo: styleById[params.get('estilo')] ? params.get('estilo') : '',
        talla: (params.get('talla') || '').slice(0, 10),
        orden: SORTS.includes(params.get('orden')) ? params.get('orden') : '',
        q: params.get('q') || ''
    };
}

/** Guarda los filtros en la URL para poder recargar o compartir el enlace. */
export function syncUrl(state) {
    const next = new URLSearchParams();
    if (state.genero !== 'todo') next.set('genero', state.genero);
    if (state.categoria !== 'todas') next.set('categoria', state.categoria);
    if (state.color) next.set('color', state.color);
    if (state.estilo) next.set('estilo', state.estilo);
    if (state.talla) next.set('talla', state.talla);
    if (state.orden) next.set('orden', state.orden);
    if (state.q.trim()) next.set('q', state.q.trim());
    const query = next.toString();
    history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

/**
 * Prepara una prenda para el catálogo: etiqueta, foto de respaldo y el texto
 * en el que se busca (también encuentra el color y el estilo: «negro», «elegante»…).
 */
export function toEntry(product, order, isNew = false) {
    const category = categoryById[product.categoria];
    const gender = GENDERS[product.genero];
    if (!category || !gender) return null;
    const color = colorById[product.color];
    const style = styleById[product.estilo];
    return {
        key: product._id || product.name,
        isNew,
        order,
        product: { ...product, price: Number(product.price), fallback: category.fallback },
        tag: `${gender.label} · ${category.label}`,
        index: normalizeText([
            product.name, product.tags || '', category.label, category.words, gender.label, gender.words,
            color ? color.label : '', style ? `${style.label} ${style.words}` : ''
        ].join(' '))
    };
}

export const tokensOf = (q) => normalizeText(q).split(/\s+/).filter(Boolean);

/** Cada palabra buscada debe aparecer; tolera plurales (camisas → camisa). */
function matchesQuery(entry, tokens) {
    return tokens.every((token) => {
        const stem = token.length > 4 ? token.replace(/(es|s)$/, '') : token;
        return entry.index.includes(token) || entry.index.includes(stem);
    });
}

/**
 * ¿La prenda pasa los filtros?
 * @param {boolean} extra  también color, estilo y talla
 */
export function matches(entry, state, tokens, { genero = state.genero, categoria = state.categoria, extra = true } = {}) {
    const p = entry.product;
    if (genero !== 'todo' && p.genero !== genero) return false;
    if (categoria !== 'todas' && p.categoria !== categoria) return false;
    if (extra) {
        if (state.color && p.color !== state.color) return false;
        if (state.estilo && p.estilo !== state.estilo) return false;
        if (state.talla && !(p.sizes || []).map(String).includes(state.talla)) return false;
    }
    return matchesQuery(entry, tokens);
}

const SORTERS = {
    'precio-asc': (a, b) => a.product.price - b.product.price || a.order - b.order,
    'precio-desc': (a, b) => b.product.price - a.product.price || a.order - b.order,
    nombre: (a, b) => a.product.name.localeCompare(b.product.name, 'es')
};

export const sortEntries = (list, orden) => list.slice().sort(SORTERS[orden] || ((a, b) => a.order - b.order));

/** Cuántos filtros de «Más filtros» están activos. */
export const extraCount = (s) => [s.color, s.estilo, s.talla, s.orden].filter(Boolean).length;

/** Tallas agrupadas para el selector: ropa, pantalón, calzado, anillos y talla única. */
export function sizeGroups(entries) {
    const all = new Set();
    entries.forEach((e) => (e.product.sizes || []).forEach((s) => all.add(String(s))));
    const nums = [...all].filter((s) => /^\d+$/.test(s)).map(Number);
    const between = (min, max, even) => nums.filter((n) => n >= min && n <= max && (!even || n % 2 === 0)).sort((a, b) => a - b).map(String);

    const groups = [
        ['Ropa', ['XS', 'S', 'M', 'L', 'XL', 'XXL'].filter((s) => all.has(s))],
        ['Pantalón (cintura)', between(24, 36, true)],
        ['Calzado', between(35, 46, false)],
        ['Anillos', nums.filter((n) => n < 24).sort((a, b) => a - b).map(String)],
        ['Otros', [...all].filter((s) => s === 'Única')]
    ];
    // Una talla aparece en un solo grupo (la primera vez)
    const seen = new Set();
    return groups
        .map(([label, sizes]) => [label, sizes.filter((s) => !seen.has(s) && seen.add(s))])
        .filter(([, sizes]) => sizes.length);
}
