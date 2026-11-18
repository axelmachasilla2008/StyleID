// =====================================================
// Arranque común de cada página: tema, vigilancia de errores y React.
// Cada archivo de esta carpeta importa los estilos de su página y llama a montar().
// =====================================================
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installErrorWatchers } from '../lib/avisos.js';
import { installTheme } from '../lib/tema.js';

export function montar(Page) {
    installTheme();
    installErrorWatchers();
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <Page />
        </StrictMode>
    );
}
