// =====================================================
// Avisos cortos abajo de la pantalla («Guardado en tus favoritos»…).
// Se muestran con showToast() y los pinta el componente <Toast />.
// =====================================================
import { crearStore } from './crearStore.js';

export const toastStore = crearStore({ text: '', visible: false });
let timer = null;

export function showToast(text, ms = 2300) {
    toastStore.set({ text, visible: true });
    clearTimeout(timer);
    timer = setTimeout(() => toastStore.set((t) => ({ ...t, visible: false })), ms);
}
