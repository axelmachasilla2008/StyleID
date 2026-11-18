import { useStore } from '../../lib/crearStore.js';
import { toastStore } from '../../lib/toast.js';

/** Aviso corto abajo de la pantalla. Se muestra con showToast() de lib/toast.js. */
export default function Toast() {
    const { text, visible } = useStore(toastStore);
    return (
        <div className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
            {text}
        </div>
    );
}
