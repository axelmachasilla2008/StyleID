// =====================================================
// Información (informacion.html): pagos, envíos, tallas, cambios y contacto.
// =====================================================
import { useState } from 'react';
import PageShell from '../components/layout/PageShell.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import { CookieLink, Payments, Socials } from '../components/layout/Footer.jsx';
import TablasTallas from '../components/informacion/TablasTallas.jsx';
import FormAfiliados from '../components/informacion/FormAfiliados.jsx';
import { BANK, CONTACTS, whatsappLink } from '../data/contacto.js';
import { STAGES } from '../lib/etapas.js';
import { copyText } from '../lib/texto.js';

const LINKS = [
    { href: 'sala.html', label: 'Inicio' },
    { href: 'catalogo.html', label: 'Catálogo' },
    { href: 'sala.html#tendencia', label: 'Tendencias' },
    { href: 'informacion.html', label: 'Información', current: true },
    { href: 'estilo.html', label: 'Escoge tu estilo' },
    { href: 'ordenes.html', label: 'Mis pedidos' }
];

const INDEX = [
    ['creadores', 'Acerca de los creadores'],
    ['pagos', 'Opciones de pago'],
    ['envios', 'Envíos y seguimiento'],
    ['cambios', 'Cambios y devoluciones'],
    ['tallas', 'Tablas de tallas'],
    ['personalizados', 'Pedidos personalizados'],
    ['ofertas', 'Ofertas'],
    ['marcas', 'Marcas'],
    ['afiliados', 'Afiliados'],
    ['contacto', 'Contacto'],
    ['cookies', 'Cookies y privacidad']
];

const CREATORS = [
    { name: 'Axel Julián Machacilla Pinohargote', alt: 'Axel Machacilla', role: 'Diseño', city: 'Pedro Vicente Maldonado',
      photo: 'https://res.cloudinary.com/i7u5kw04/image/upload/c_fill,g_face,w_240,h_240,f_auto,q_auto/v1794803904/styleid/sitio/creador-axel.jpg' },
    { name: 'Domenica Mishelle Rosero Suárez', alt: 'Domenica Rosero', role: 'Redes sociales', city: 'Quito, Calderón',
      photo: 'https://res.cloudinary.com/i7u5kw04/image/upload/c_fill,g_face,w_240,h_240,f_auto,q_auto/v1794803905/styleid/sitio/creador-domenica.png' }
];

/** Tarjeta de una sección de la página. */
function InfoCard({ id, icon, title, children }) {
    return (
        <section className="info-card" id={id} aria-labelledby={`t-${id}`}>
            <h3 id={`t-${id}`}><i className={`fa-solid ${icon}`} aria-hidden="true"></i> {title}</h3>
            {children}
        </section>
    );
}

/** Botón «Copiar» del número de cuenta. */
function CopyButton({ text, label }) {
    const [state, setState] = useState('');      // '' | 'ok' | 'fail'

    async function onClick() {
        const ok = await copyText(text);
        setState(ok ? 'ok' : 'fail');
        setTimeout(() => setState(''), 2000);
    }

    return (
        <button type="button" className={`copy-btn${state === 'ok' ? ' is-done' : ''}`} aria-label={label} onClick={onClick}>
            <i className="fa-regular fa-copy" aria-hidden="true"></i>{' '}
            <span>{state === 'ok' ? '¡Copiado!' : state === 'fail' ? 'Cópialo a mano' : 'Copiar'}</span>
        </button>
    );
}

export default function Informacion() {
    const mainEmail = CONTACTS[0].email;

    return (
        <PageShell>
            <Navbar links={LINKS} />

            <main>
                <section className="section info-head">
                    <div className="section-title" data-bg="Info">
                        <span className="section-eyebrow">Todo lo que necesitas saber</span>
                        <h2>Información de <em>StyleID</em></h2>
                        <p>Pagos, envíos, tallas, cambios y cómo contactarnos, en un solo lugar.</p>
                    </div>
                </section>

                <div className="info-layout">
                    <nav className="info-index" aria-label="Índice de la página">
                        <h3>Índice</h3>
                        <ol>
                            {INDEX.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
                        </ol>
                    </nav>

                    <div className="info-content">
                        <InfoCard id="creadores" icon="fa-users" title="Acerca de los creadores">
                            <p>StyleID nació en 2026 de la mano de dos jóvenes creativos que decidieron unir sus ideas para crear una marca con identidad propia.</p>
                            <div className="creators">
                                {CREATORS.map((c) => (
                                    <article className="creator" key={c.name}>
                                        <img className="creator-photo" src={c.photo} alt={c.alt} width="68" height="68" loading="lazy" />
                                        <div>
                                            <h4>{c.name}</h4>
                                            <p className="creator-role">{c.role}</p>
                                            <p className="creator-city"><i className="fa-solid fa-location-dot" aria-hidden="true"></i> {c.city}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <p className="info-more"><a href="inicio.html#acerca">Lee la historia completa de StyleID <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a></p>
                        </InfoCard>

                        <InfoCard id="pagos" icon="fa-credit-card" title="Opciones de pago">
                            <p>Aceptamos estas formas de pago:</p>
                            <Payments className="pagos info-pagos" />
                            <ul className="info-list">
                                <li><strong>El pago es por adelantado.</strong> Preparamos tu pedido en cuanto confirmamos el pago.</li>
                                <li><strong>Confirma tu pago por correo.</strong> Envíanos el comprobante con tu número de orden.</li>
                                <li>Cuando lo confirmemos, tu pedido pasará a «Pago confirmado» en <a href="ordenes.html">Mis pedidos</a>.</li>
                            </ul>
                            <div className="bank-card">
                                <div className="bank-card-head">
                                    <i className="fa-solid fa-building-columns" aria-hidden="true"></i>
                                    <div>
                                        <span className="bank-card-eyebrow">Datos para transferencia</span>
                                        <strong>{BANK.bank}</strong>
                                    </div>
                                </div>
                                <dl className="bank-data">
                                    <div><dt>Tipo de cuenta</dt><dd>{BANK.type}</dd></div>
                                    <div>
                                        <dt>Número de cuenta</dt>
                                        <dd>
                                            <span className="bank-number">{BANK.number}</span>
                                            <CopyButton text={BANK.number} label="Copiar número de cuenta" />
                                        </dd>
                                    </div>
                                    <div><dt>Titular</dt><dd>{BANK.owner}</dd></div>
                                </dl>
                                <p className="bank-note">
                                    Envía el comprobante con tu número de pedido por{' '}
                                    <a href={whatsappLink('Hola StyleID, te envío el comprobante de mi pedido')} target="_blank" rel="noopener">WhatsApp al {CONTACTS[0].phone}</a>
                                    {' '}o al correo{' '}
                                    <a href={`mailto:${mainEmail}?subject=${encodeURIComponent('Comprobante de pago StyleID')}`}>{mainEmail}</a>.
                                </p>
                            </div>
                        </InfoCard>

                        <InfoCard id="envios" icon="fa-truck-fast" title="Envíos y seguimiento">
                            <ul className="info-list">
                                <li>Hacemos envíos <strong>a todo el país</strong> con <strong>Servientrega</strong>.</li>
                                <li>El costo del envío <strong>depende de la distancia</strong> hasta tu ciudad.</li>
                                <li>No tenemos retiro en persona: todo se maneja desde esta página.</li>
                            </ul>
                            <p>Puedes seguir tu pedido en <a href="ordenes.html">Mis pedidos</a>. Ahí verás en qué etapa va:</p>
                            <ol className="info-stages">
                                {STAGES.map((s) => <li key={s.id}><i className={`fa-solid ${s.icon}`} aria-hidden="true"></i> {s.label}</li>)}
                            </ol>
                            <p>Cuando tu pedido salga, también verás ahí el número de guía de Servientrega.</p>
                        </InfoCard>

                        <InfoCard id="cambios" icon="fa-rotate" title="Cambios y devoluciones">
                            <ul className="info-list">
                                <li>Aceptamos cambios dentro de <strong>1 día</strong> después de recibir tu pedido.</li>
                                <li>Hacemos devoluciones de dinero <strong>solo con un justificativo válido</strong>.</li>
                                <li>Las prendas <strong>personalizadas o con estampado no tienen cambio</strong>.</li>
                            </ul>
                            <p>Para pedir un cambio, escríbenos por los medios de la sección <a href="#contacto">Contacto</a> con tu número de orden.</p>
                        </InfoCard>

                        <InfoCard id="tallas" icon="fa-ruler" title="Tablas de tallas">
                            <p>Manejamos tallas desde las más pequeñas hasta las más grandes. Las tablas sirven igual para mujer y hombre. Las medidas son de referencia, en centímetros.</p>
                            <p className="info-tip"><i className="fa-solid fa-lightbulb" aria-hidden="true"></i> Si dudas entre dos tallas, elige la más grande.</p>
                            <TablasTallas />
                            <p className="info-small">Cómo medirte: usa una cinta métrica sobre ropa ligera. Pecho y cadera se miden en la parte más ancha; la cintura, en la parte más angosta.</p>
                        </InfoCard>

                        <InfoCard id="personalizados" icon="fa-wand-magic-sparkles" title="Pedidos personalizados">
                            <ul className="info-list">
                                <li>Un estampado a máquina toma entre <strong>15 y 20 minutos</strong> de elaboración.</li>
                                <li>Los pedidos personalizados tienen un <strong>costo extra</strong> y se pide un <strong>anticipo</strong>.</li>
                                <li>Recuerda que las prendas personalizadas no tienen cambio.</li>
                            </ul>
                            <p className="info-more"><a href="sala.html#temas">Cuéntanos tu idea en el formulario de pedidos <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a></p>
                        </InfoCard>

                        <InfoCard id="ofertas" icon="fa-tags" title="Ofertas">
                            <div className="info-soon">
                                <span>Próximamente</span>
                                <p>Estamos preparando nuevas ofertas. Síguenos en redes para enterarte primero.</p>
                            </div>
                        </InfoCard>

                        <InfoCard id="marcas" icon="fa-star" title="Marcas">
                            <p>En StyleID vendemos <strong>lo que está en tendencia y lo más solicitado</strong>. Elegimos cada prenda pensando en lo que la gente realmente quiere usar.</p>
                            <p className="info-more"><a href="catalogo.html">Ver el catálogo <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a></p>
                        </InfoCard>

                        <InfoCard id="afiliados" icon="fa-handshake" title="Afiliados">
                            <p>Todavía no tenemos un programa de afiliados, pero lo estamos planeando. Si te interesa, déjanos tus datos y te avisamos cuando empiece.</p>
                            <FormAfiliados />
                        </InfoCard>

                        <InfoCard id="contacto" icon="fa-comments" title="Contacto">
                            <ul className="info-list">
                                <li>Atendemos las <strong>24 horas</strong>.</li>
                                <li>No tenemos local físico: somos una tienda en línea.</li>
                            </ul>
                            <div className="contact-cards">
                                {CONTACTS.map((c) => (
                                    <article className={`contact-card${c.main ? ' is-main' : ''}`} key={c.name}>
                                        <span className="contact-badge">{c.role}</span>
                                        <h4>{c.name}</h4>
                                        <a className="contact-line" href={whatsappLink(undefined, c.whatsapp)} target="_blank" rel="noopener">
                                            <i className="fa-brands fa-whatsapp" aria-hidden="true"></i> {c.phone}
                                        </a>
                                        <a className="contact-line" href={`mailto:${c.email}?subject=${encodeURIComponent('Consulta StyleID')}`}>
                                            <i className="fa-regular fa-envelope" aria-hidden="true"></i> {c.email}
                                        </a>
                                    </article>
                                ))}
                            </div>
                            <Socials className="socials info-socials" only={['instagram', 'facebook', 'tiktok']} />
                        </InfoCard>

                        <InfoCard id="cookies" icon="fa-cookie-bite" title="Cookies y privacidad">
                            <p>Guardamos algunos datos en tu navegador (almacenamiento local, que funciona como las cookies). No usamos publicidad, rastreo ni servicios de terceros para seguirte.</p>
                            <ul className="info-list">
                                <li><strong>Necesarias:</strong> tu sesión iniciada, tu carrito, las prendas que guardas con el corazón y un número de invitado si compras sin cuenta. Sin ellas la tienda no funciona.</li>
                                <li><strong>Preferencias:</strong> recordar si elegiste el tema claro u oscuro. Si no las aceptas, el tema solo se recuerda mientras tengas la pestaña abierta.</li>
                            </ul>
                            <p>Tus pedidos, comentarios y datos de la cuenta se guardan en nuestra base de datos para poder atenderte.</p>
                            <p className="info-more">
                                <CookieLink href="#cookies">Cambiar mi elección de cookies <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></CookieLink>
                            </p>
                        </InfoCard>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <p className="info-footer-note">StyleID · Hecho para ti, pensado en ti</p>
            </footer>
        </PageShell>
    );
}
