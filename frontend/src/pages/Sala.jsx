// =====================================================
// Página principal de la tienda (sala.html)
// Hero con logo 3D, categorías, tendencias, novedades y comentarios.
// =====================================================
import { useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import NavSearch from '../components/layout/NavSearch.jsx';
import Footer from '../components/layout/Footer.jsx';
import Carousel from '../components/tienda/Carousel.jsx';
import ProductCard from '../components/tienda/ProductCard.jsx';
import ProductModal from '../components/tienda/ProductModal.jsx';
import { CartProvider, CartButton, CartDrawer } from '../components/tienda/Carrito.jsx';
import Logo3D from '../components/sala/Logo3D.jsx';
import SiteComments from '../components/sala/SiteComments.jsx';
import { CATEGORIES } from '../data/catalogo.js';
import { NEW_ARRIVALS, TRENDING } from '../data/destacados.js';
import { revealOnScroll } from '../lib/animaciones.js';

const LINKS = [
    { href: '#', label: 'Inicio' },
    { href: 'catalogo.html', label: 'Catálogo' },
    { href: '#tendencia', label: 'Tendencias' },
    { href: '#novedades', label: 'Novedades' },
    { href: '#temas', label: 'Comentarios' },
    { href: 'estilo.html', label: 'Escoge tu estilo' },
    { href: 'ordenes.html', label: 'Mis pedidos' }
];

function SectionTitle({ bg, eyebrow, children, sub }) {
    return (
        <div className="section-title" data-bg={bg}>
            <span className="section-eyebrow">{eyebrow}</span>
            <h2>{children}</h2>
            <p>{sub}</p>
        </div>
    );
}

export default function Sala() {
    const [product, setProduct] = useState(null);

    // Títulos y carruseles aparecen suavemente al hacer scroll
    useEffect(() => revealOnScroll(
        '.section-title, .carousel, .comments-layout',
        (el) => (el.matches('.section-title') ? '' : '120ms')
    ), []);

    const productCards = (item, clone) => (
        <ProductCard key={`${item.name}${clone ? '-copia' : ''}`} product={item} clone={clone} onOpen={setProduct} />
    );

    return (
        <PageShell>
            <CartProvider>
                <Navbar links={LINKS} icon="fa-hanger">
                    <NavSearch />
                </Navbar>

                {/* ===== Hero ===== */}
                <section className="hero-section" aria-labelledby="heroTitle">
                    <div className="hero-content">
                        <span className="subtitle"><span className="hero-dot" aria-hidden="true"></span> Nueva colección</span>
                        <h1 id="heroTitle">Hecho para ti, <em>pensado en ti</em></h1>
                        <p className="hero-lead">Ropa con identidad para mujer y hombre. Elige tu estilo, combínalo a tu manera y hazlo tuyo.</p>
                        <div className="hero-actions">
                            <a href="catalogo.html" className="btn-shop">Comprar ahora</a>
                            <a href="#tendencia" className="btn-ghost">Ver tendencias</a>
                        </div>
                        <div className="hero-gender">
                            <span>Compra por sección:</span>
                            <a href="catalogo.html?genero=mujer"><i className="fa-solid fa-person-dress" aria-hidden="true"></i> Mujer</a>
                            <a href="catalogo.html?genero=hombre"><i className="fa-solid fa-person" aria-hidden="true"></i> Hombre</a>
                        </div>
                    </div>
                    <div className="hero-3d">
                        <div className="cube-glow" aria-hidden="true"></div>
                        <div className="cube-orbit" aria-hidden="true"><span></span></div>
                        <div className="scene"><Logo3D /></div>
                    </div>

                    {/* Cinta de categorías en movimiento */}
                    <div className="hero-marquee" aria-hidden="true">
                        <div className="hero-marquee-track">
                            {[...CATEGORIES, ...CATEGORIES].map((c, i) => <span key={i}>{c.label}</span>)}
                        </div>
                    </div>
                </section>

                {/* ===== Categorías ===== */}
                <section className="section categories-section" id="catalogo" aria-label="Categorías de productos">
                    <SectionTitle bg="Estilo" eyebrow="Explora" sub="Elige una categoría y descubre la ropa para mujer y para hombre">
                        Nuestro <em>catálogo</em>
                    </SectionTitle>
                    <Carousel
                        items={CATEGORIES}
                        renderItem={(c, clone) => (
                            <div className="card category-card" key={`${c.id}${clone ? '-copia' : ''}`} aria-hidden={clone || undefined} data-clone={clone || undefined}>
                                <div className="img-wrapper">
                                    <h3>{c.label}</h3>
                                    <img src={c.fallback} alt={c.label} />
                                    <a className="btn-shop" href={`catalogo.html?genero=mujer&categoria=${c.id}`} tabIndex={clone ? -1 : undefined}>Mujer</a>
                                    <a className="btn-shop" href={`catalogo.html?genero=hombre&categoria=${c.id}`} tabIndex={clone ? -1 : undefined}>Hombre</a>
                                </div>
                            </div>
                        )}
                    />
                </section>

                {/* ===== En tendencia ===== */}
                <section className="section trending-section" id="tendencia" aria-label="Productos en tendencia">
                    <SectionTitle bg="Trend" eyebrow="Lo más buscado" sub="Los productos más populares del momento">
                        En <em>tendencia</em>
                    </SectionTitle>
                    <Carousel items={TRENDING} className="trending-carousel" trackClassName="trending-track" renderItem={productCards} />
                </section>

                {/* ===== Novedades ===== */}
                <section className="section novedades-section" id="novedades" aria-label="Novedades">
                    <SectionTitle bg="New" eyebrow="Recién llegado" sub="Las últimas incorporaciones a la colección">
                        <em>Novedades</em> de la semana
                    </SectionTitle>
                    <Carousel items={NEW_ARRIVALS} className="novedades-carousel" trackClassName="novedades-track" renderItem={productCards} />
                </section>

                <SiteComments />

                <Footer adminLink />

                <CartButton />
                <CartDrawer />
                <ProductModal product={product} onClose={() => setProduct(null)} />
            </CartProvider>
        </PageShell>
    );
}
