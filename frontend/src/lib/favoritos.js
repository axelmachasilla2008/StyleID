// =====================================================
// Favoritos (el corazón de las prendas).
// Se guardan solo en este navegador (styleid_favs) como
// [{ name, price, img, at }] y «Mis pedidos» los muestra.
// =====================================================
import { leerJSON, guardarJSON } from './almacenamiento.js';
import { crearStore, useStore } from './crearStore.js';

const KEY = 'styleid_favs';

function read() {
    const list = leerJSON(KEY, []);
    if (!Array.isArray(list)) return [];
    // Versiones antiguas guardaban solo el nombre
    return list
        .map((item) => (typeof item === 'string' ? { name: item } : item))
        .filter((item) => item && item.name);
}

export const favsStore = crearStore(read());

// Si se marca un corazón en otra pestaña, esta también se entera
window.addEventListener('storage', (e) => {
    if (e.key === KEY) favsStore.set(read());
});

function write(list) {
    guardarJSON(KEY, list);
    favsStore.set(list);
}

export function isFav(name) {
    return favsStore.get().some((f) => f.name === name);
}

/** Agrega o quita una prenda. Devuelve true si quedó guardada. */
export function toggleFav({ name, price, img }) {
    const list = favsStore.get();
    if (list.some((f) => f.name === name)) {
        write(list.filter((f) => f.name !== name));
        return false;
    }
    write(list.concat({ name, price, img, at: Date.now() }));
    return true;
}

export function removeFav(name) {
    write(favsStore.get().filter((f) => f.name !== name));
}

/** Lista de favoritos que se actualiza sola. */
export function useFavs() {
    return useStore(favsStore);
}
