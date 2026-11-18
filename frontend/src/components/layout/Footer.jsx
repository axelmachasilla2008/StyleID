import { CATEGORIES } from '../../data/catalogo.js';
import { PAYMENTS, SOCIALS } from '../../data/contacto.js';
import { openCookieSettings } from '../../lib/consentimiento.js';

/** Enlace que abre la ventana «Configurar cookies». */
export function CookieLink({ children = 'Configurar cookies', ...props }) {
    return <a href="informacion.html#cookies" onClick={openCookieSettings} {...props}>{children}</a>;
}

/** Redes sociales. */
export function Socials({ className = 'socials', only }) {
    const list = only ? SOCIALS.filter((s) => only.includes(s.id)) : SOCIALS;
    return (
        <ul className={className}>
            {list.map((s) => (
                <li key={s.id}>
                    <a href={s.href} className={`social ${s.id}`} title={s.label} target="_blank" rel="noopener">{s.label}</a>
                </li>
            ))}
        </ul>
    );
}

/** Formas de pago. */
export function Payments({ className = 'pagos' }) {
    return (
        <ul className={className}>
            {PAYMENTS.map((p) => <li key={p.id} className={`pago ${p.id}`}>{p.label}</li>)}
        </ul>
    );
}

const INFO_LINKS = [
    ['creadores', 'Acerca de los creadores'],
    ['pagos', 'Opciones de pago'],
    ['envios', 'Envíos y seguimiento'],
    ['cambios', 'Cambios y devoluciones'],
    ['tallas', 'Tablas de tallas'],
    ['ofertas', 'Ofertas'],
    ['marcas', 'Marcas'],
    ['afiliados', 'Afiliados'],
    ['contacto', 'Contacto']
];

/** Pie de página completo de la tienda (sala y catálogo). */
export default function Footer({ adminLink = false }) {
    return (
        <footer className="footer">
            <div className="footer-columns">
                <div className="footer-col">
                    <h4>Productos</h4>
                    <ul>
                        <li><a href="catalogo.html?genero=hombre">Hombre</a></li>
                        <li><a href="catalogo.html?genero=mujer">Mujer</a></li>
                        <li><a href="catalogo.html">Todo el catálogo</a></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Categorías</h4>
                    <ul>
                        {CATEGORIES.map((c) => (
                            <li key={c.id}><a href={`catalogo.html?categoria=${c.id}`}>{c.label}</a></li>
                        ))}
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Información</h4>
                    <ul>
                        {INFO_LINKS.map(([id, label]) => (
                            <li key={id}><a href={`informacion.html#${id}`}>{label}</a></li>
                        ))}
                        <li><CookieLink /></li>
                    </ul>
                </div>
            </div>

            <section aria-labelledby="social-title">
                <h2 id="social-title">Síguenos</h2>
                <Socials />
            </section>

            <section aria-labelledby="payments-title">
                <h2 id="payments-title">Formas de pago</h2>
                <Payments />
            </section>

            {adminLink && (
                <p className="admin-access">
                    <a href="admin.html"><i className="fa-solid fa-lock"></i> Panel de administración</a>
                </p>
            )}
        </footer>
    );
}
