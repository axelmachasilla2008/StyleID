import { useEffect } from 'react';
import Toast from '../feedback/Toast.jsx';
import ErrorBanner from '../feedback/ErrorBanner.jsx';
import CookieBanner from '../feedback/CookieBanner.jsx';
import ScrollUi from '../feedback/ScrollUi.jsx';
import { startBlockAnimations } from '../../lib/animaciones.js';

/**
 * Envoltura común de todas las páginas: avisos, cookies, barra de
 * progreso y animaciones al hacer scroll.
 */
export default function PageShell({ children, cookies = true }) {
    useEffect(() => { startBlockAnimations(); }, []);

    return (
        <>
            {children}
            <Toast />
            <ErrorBanner />
            {cookies && <CookieBanner />}
            <ScrollUi />
        </>
    );
}
