// =====================================================
// Configuración de Vite
// La tienda tiene varias páginas (una por archivo .html); cada una monta
// su propio componente de React. Todo se publica bajo /sala/, que es la
// ruta donde Express sirve la tienda.
// =====================================================
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const PAGES = ['inicio', 'sala', 'catalogo', 'estilo', 'ordenes', 'informacion', 'admin', '404', '500'];
const here = (file) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
    base: '/sala/',
    plugins: [react()],
    server: {
        port: 5173,
        // En desarrollo, las llamadas a /api van al servidor Express
        proxy: { '/api': 'http://localhost:3002' }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: Object.fromEntries(PAGES.map((page) => [page, here(`./${page}.html`)]))
        }
    }
});
