import { LOGO } from '../../data/destacados.js';

/**
 * Barra de navegación de la tienda.
 * @param {Array<{href: string, label: string, current?: boolean}>} links
 * @param {string} [icon]  ícono antes del logo (p. ej. 'fa-hanger')
 * @param {React.ReactNode} [children]  lo que va a la derecha (buscador, botones)
 */
export default function Navbar({ links, icon, children }) {
    return (
        <header className="navbar">
            <div className="logo">
                {icon && <i className={`fa-solid ${icon}`}></i>}
                <img id="logoimagen" src={LOGO} alt="Logo StyleID" width="40" height="40" />
                <span className="logo-text">StyleID</span>
            </div>
            <nav>
                <ul className="nav-links">
                    {links.map((link) => (
                        <li key={link.label}>
                            <a href={link.href} aria-current={link.current ? 'page' : undefined}>{link.label}</a>
                        </li>
                    ))}
                </ul>
            </nav>
            {children}
        </header>
    );
}
