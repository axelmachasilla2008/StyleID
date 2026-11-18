// =====================================================
// Promedio de estrellas de cada prenda (GET /api/messages/ratings).
// El id de la prenda es el slug de su nombre: { 'blusa-bordada': { avg, count } }
// =====================================================
import { api } from './api.js';
import { crearStore, useStore } from './crearStore.js';

export const ratingsStore = crearStore({});
let loaded = false;

/** Vuelve a pedir los promedios (al cargar y después de opinar). */
export async function refreshRatings() {
    try {
        ratingsStore.set((await api('/api/messages/ratings')) || {});
    } catch (err) { /* sin servidor: las tarjetas quedan como «Sin opiniones» */ }
}

export function useRatings() {
    if (!loaded) {
        loaded = true;
        refreshRatings();
    }
    return useStore(ratingsStore);
}
