// =====================================================
// Pequeño "store" compartido: guarda un valor, avisa a los componentes que
// lo usan cuando cambia y se lee en React con useStore().
// =====================================================
import { useSyncExternalStore } from 'react';

export function crearStore(initial) {
    let value = initial;
    const listeners = new Set();

    return {
        get: () => value,
        set(next) {
            value = typeof next === 'function' ? next(value) : next;
            listeners.forEach((fn) => fn());
        },
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }
    };
}

/** Lee un store y vuelve a pintar el componente cuando cambia. */
export function useStore(store) {
    return useSyncExternalStore(store.subscribe, store.get, store.get);
}
