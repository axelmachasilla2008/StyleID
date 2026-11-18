// =====================================================
// Portada (inicio.html): presentación, historia de la marca,
// inicio de sesión y cambio de tema claro/oscuro.
// =====================================================
import { useEffect, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell.jsx';
import { CookieLink, Payments, Socials } from '../components/layout/Footer.jsx';
import LoginModal from '../components/inicio/LoginModal.jsx';
import { LOGO, LOGO_CLARO } from '../data/destacados.js';
import { revealOnScroll } from '../lib/animaciones.js';
import { useStore } from '../lib/crearStore.js';
import { endSession, getSession } from '../lib/sesion.js';
import { setTheme, themeStore } from '../lib/tema.js';

const CDN = 'https://res.cloudinary.com/i7u5kw04/image/upload/f_auto,q_auto';
const SECTIONS = ['inicio', 'acerca', 'historia'];

const STORIES = [
    {
        img: `${CDN}/v1794798294/styleid/sitio/whatsapp-image-2026-10-04-at-21-41-03.jpg`,
        alt: 'Nueva colección Dior',
        title: 'El "New Look" de Dior',
        paragraphs: [
            'Tras el fin de la Segunda Guerra Mundial, Europa estaba devastada y el textil escaseaba. La moda durante la guerra se había vuelto utilitaria, austera y reglamentada por el racionamiento de telas.',
            'En febrero de 1947, Christian Dior presentó su primera colección de alta costura. La periodista Carmel Snow la bautizó inmediatamente como el "New Look". Dior propuso una silueta de hombros suaves, cintura hiperdefinida y faldas opulentas que usaban hasta 20 metros de tela por prenda.',
            'Aunque al principio generó protestas por el "desperdicio" de material en época de escasez, la colección reactivó la industria textil francesa y la alta costura golpeada por la guerra. Además, devolvió la fantasía y el glamour a una sociedad hambrienta de optimismo, definiendo la estética global de los años 50.'
        ]
    },
    {
        img: `${CDN}/v1794798293/styleid/sitio/whatsapp-image-2026-10-04-at-21-12-57.jpg`,
        alt: 'Desfile de Martin Margiela en París 1989',
        title: 'Martin Margiela y el desfile en el descampado de París 1989',
        paragraphs: [
            'A finales de los años 80, la moda estaba dominada por el exceso, los logos gigantes y los desfiles ultraglamurosos para élites financieras. El diseñador belga Martin Margiela decidió hacer todo lo contrario para su colección Primavera/Verano 1990.',
            'Margiela rechazó los salones de lujo y organizó su desfile en un terreno baldío y abandonado en las afueras de París. No hubo asientos asignados ni zona VIP: los niños del barrio humilde jugaban libremente entre las modelos, y los transeúntes locales se sentaron junto a los editores de moda más influyentes del mundo. Las invitaciones habían sido dibujadas a mano por los propios niños de la comunidad.',
            'Este desfile dio origen al movimiento "deconstructivista" y la anti-moda. Margiela demostró que el diseño de alto nivel no necesita la exclusividad clasista ni la ostentación para ser relevante, cuestionando las jerarquías impuestas por la industria del consumo.'
        ]
    },
    {
        img: `${CDN}/v1794798293/styleid/sitio/whatsapp-image-2026-10-04-at-20-54-50.jpg`,
        alt: 'Marcha Silenciosa de 1917 en Nueva York',
        title: 'La Marcha Silenciosa de 1917 en Nueva York',
        paragraphs: [
            'En East St. Louis habían matado a más de 100 personas negras en una masacre y en el país los linchamientos no paraban. Nadie hacía nada. La NAACP dijo: vamos a protestar pero no como nos quieren ver — enojados y desordenados. Vamos a ir como nunca nos han visto.',
            'El 28 de julio de 1917, casi 10,000 personas afro salieron en silencio por la Quinta Avenida.',
            'Los hombres con traje, corbata y zapatos brillados. Las mujeres y niños todos de blanco, impecables. Sin gritar. Sin carteles de odio. Solo carteles que decían "Mamá, ¿por qué nos linchan?" y "Danos el derecho a vivir".',
            'Fue la primera protesta negra masiva en EE.UU. Usaron la elegancia como arma. El mensaje era: "Somos respetables, educados y ciudadanos, y aún así nos matan". Obligó a toda la América blanca elegante a mirarlos.',
            'De ahí nació la estrategia de protestar en traje y corbata que luego usó Martin Luther King en los 60.'
        ]
    }
];

const ABOUT = [
    'Todo comenzó en un encuentro llamado "Jóvenes Creativos", donde dos chicos de apenas 17 años cruzaron caminos entre risas, sueños y muchas ideas por escribir. No se conocían antes, pero bastó una conversación para darse cuenta de que compartían algo más que la edad: el deseo de crear algo propio, algo que hablara de quiénes son.',
    'Un día común, entre cuadernos llenos de bocetos y sueños que parecían enormes, decidieron: "¿Y si juntamos todo lo que llevamos dentro? ¿La creatividad, las ganas, todo?". Y así, sin saber exactamente cómo terminaría, nació StyleID.',
    'No fue fácil. Había mucho que no sabían: códigos que no entendían, diseños que no salían a la primera, caminos que se veían oscuros. Pero en lugar de rendirse, aprendieron. Aprendieron mientras caminaban, paso a paso, tropezando y levantándose, probando, equivocándose y volviendo a intentar. Cada dificultad se convirtió en una lección, cada error en una pieza más de este sueño.',
    'Porque StyleID no nació perfecta: nació auténtica. Hecha con manos jóvenes, con corazones valientes y con la convicción de que la ropa no es solo tela: es quién eres. Es tu voz, tu huella, tu identidad puesta en cada prenda.',
    'Hoy lo que ves no es solo una marca. Es el resultado de dos que se atrevieron a empezar sin saberlo todo, confiando en que el camino se hace al andar. Y esto es solo el comienzo.'
];

/** Botón de sesión: con sesión, el primer toque pregunta y el segundo la cierra. */
function SessionButton({ user, onOpen, onLogout }) {
    const [armed, setArmed] = useState(false);
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    function onClick() {
        if (!user) { onOpen(); return; }
        if (armed) {
            clearTimeout(timer.current);
            setArmed(false);
            onLogout();
            return;
        }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 4000);
    }

    const label = !user ? 'INICIAR SESIÓN' : armed ? '¿CERRAR SESIÓN?' : `HOLA, ${user.toUpperCase()}`;
    return <button className="btn-login" type="button" onClick={onClick}>{label}</button>;
}

export default function Inicio() {
    const theme = useStore(themeStore);
    const [user, setUser] = useState(getSession);
    const [loginOpen, setLoginOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('inicio');
    const heroBgRef = useRef(null);

    // Las tarjetas aparecen al hacer scroll (con un pequeño retardo entre las del mismo grupo)
    useEffect(() => revealOnScroll(
        '.info-section > .info-box, .info-section > .box-column, .section-text',
        (el) => (el.parentElement?.matches('.info-section') ? `${Math.min([...el.parentElement.children].indexOf(el), 3) * 70}ms` : ''),
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    ), []);

    // La foto queda fija y se oscurece mientras el contenido sube; el menú marca la sección visible
    useEffect(() => {
        const onScroll = () => {
            const dim = Math.min(window.scrollY / (window.innerHeight * 0.8), 0.9);
            heroBgRef.current?.style.setProperty('--hero-dim', dim);
            setScrolled(window.scrollY > 24);
            let current = 'inicio';
            SECTIONS.forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = id;
            });
            setActiveSection(current);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    function logout() {
        endSession();
        setUser('');
    }

    const navLinks = [['inicio', 'Inicio'], ['acerca', 'Acerca de'], ['historia', 'Historias']];

    return (
        <PageShell>
            <header className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
                <div className="logo">
                    <img src={LOGO} alt="Logo de StyleID" width="40" height="40" />
                    <span className="logo-text">StyleID</span>
                </div>

                <nav aria-label="Navegación principal">
                    <ul className="nav-links">
                        {navLinks.map(([id, label]) => (
                            <li key={id}>
                                <a href={`#${id}`} className={activeSection === id ? 'active' : undefined} aria-current={id === 'inicio' ? 'page' : undefined}>{label}</a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <SessionButton user={user} onOpen={() => setLoginOpen(true)} onLogout={logout} />

                <label className="switch">
                    <input type="checkbox" id="theme-toggle" aria-label="Cambiar tema claro/oscuro"
                        checked={theme !== 'light'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
                    <span className="slider round"></span>
                </label>
            </header>

            <main>
                {/* Portada */}
                <section id="inicio" aria-labelledby="hero-title">
                    <div className="top">
                        <div className="hero-bg" aria-hidden="true" ref={heroBgRef}></div>
                        <article className="hero">
                            <span className="hero-eyebrow"><span className="hero-dot" aria-hidden="true"></span> Moda con identidad</span>
                            <h1 id="hero-title" className="main-title">
                                <span className="hero-logo-glow" aria-hidden="true"></span>
                                <img className="hero-logo" src={LOGO_CLARO} alt="StyleID" width="640" height="813" />
                            </h1>
                            <p className="subtitle">Hecho para ti, <em>pensado en ti</em></p>
                            <p className="hero-lead">Una marca creada por jóvenes creativos para que la ropa hable de quién eres.</p>
                            <div className="hero-actions">
                                <button className="btn-primary" type="button" onClick={() => { location.href = 'sala.html'; }}>ENTRAR A LA TIENDA</button>
                                <a className="btn-ghost" href="#acerca">Nuestra historia</a>
                            </div>
                        </article>

                        {/* Cinta en movimiento al pie de la portada */}
                        <div className="hero-marquee" aria-hidden="true">
                            <div className="hero-marquee-track">
                                {[0, 1].map((n) => ['Hecho para ti', 'Pensado en ti', 'Tu estilo, tu identidad', 'Mujer y hombre']
                                    .map((text) => <span key={`${n}-${text}`}>{text}</span>))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Acerca de */}
                <section id="acerca" className="espacio" aria-labelledby="about-title">
                    <h2 id="about-title" className="sr-only">Acerca de StyleID</h2>
                    <div className="info-section">
                        <figure className="info-box info-image">
                            <img src={LOGO} alt="Imagen representativa de StyleID" />
                        </figure>
                        <article className="info-box info-text">
                            <h3>✨ StyleID: Tu Estilo, Tu Identidad ✨</h3>
                            {ABOUT.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
                            <blockquote>
                                <p>"No somos grandes porque empezamos grandes. Somos grandes porque empezamos pequeños y no nos detuvimos."</p>
                                <cite>— StyleID</cite>
                            </blockquote>
                        </article>
                    </div>
                    <p className="section-text">La historia de la moda no es solo ropa: es la historia de quiénes hemos sido.</p>
                </section>

                {/* Historias */}
                <section id="historia" className="espacio" aria-labelledby="history-title">
                    <h2 id="history-title" className="sr-only">Historia de la moda</h2>
                    <div className="info-section three-boxes">
                        {STORIES.map((story) => (
                            <article className="box-column" key={story.title}>
                                <figure className="info-box info-image">
                                    <img src={story.img} alt={story.alt} />
                                </figure>
                                <div className="info-box info-text">
                                    <h3>{story.title}</h3>
                                    {story.paragraphs.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <p className="section-text">Lo auténtico nunca pasa de moda</p>
                </section>
            </main>

            <footer className="footer">
                <section aria-labelledby="social-title">
                    <h2 id="social-title">Síguenos</h2>
                    <Socials />
                </section>
                <section aria-labelledby="payments-title">
                    <h2 id="payments-title">Formas de pago</h2>
                    <Payments />
                </section>
                <p className="footer-cookies"><CookieLink /></p>
            </footer>

            <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={setUser} />
        </PageShell>
    );
}
