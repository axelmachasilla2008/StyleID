// =====================================================
// Prendas de los carruseles de la página principal (sala.html):
// «En tendencia» y «Novedades de la semana».
// Los nombres se mantienen tal cual porque los favoritos y las opiniones
// ya guardadas usan el nombre como identificador.
// =====================================================
const CDN = 'https://res.cloudinary.com/i7u5kw04/image/upload';
const ROPA = ['S', 'M', 'L', 'XL'];
const ROPA_XS = ['XS', 'S', 'M', 'L'];

export const TRENDING = [
    { name: 'Conjunto oversize', alt: 'Conjunto oversize', price: 120, sizes: ROPA,
        img: `${CDN}/f_auto,q_auto,w_900/v1794897428/styleid/productos-catalogo/s01-conjunto-oversize.jpg`,
        desc: 'Conjunto de silueta amplia y caída fluida. Una pieza fácil de combinar con zapatillas y accesorios sencillos.' },
    { name: 'Premium T-shirt', alt: 'Camiseta premium', price: 120, sizes: ROPA,
        img: `${CDN}/f_auto,q_auto,w_900/v1794897429/styleid/productos-catalogo/s02-premium-t-shirt.jpg`,
        desc: 'Camiseta de corte relajado y cuello redondo. Funciona sola o como base para capas.' },
    { name: 'Classic Jeans', alt: 'Jeans clásicos', price: 120, sizes: ['28', '30', '32', '34'],
        img: `${CDN}/f_auto,q_auto/v1794798288/styleid/sitio/jeans-baggy.jpg`,
        desc: 'Jean de tiro alto y pierna ancha. Combina con camisetas básicas, blazers y chaquetas ligeras.' },
    { name: 'Urban Hoodie', alt: 'Hoodie urbana', price: 95, sizes: ROPA,
        img: `${CDN}/f_auto,q_auto,w_900/v1794897430/styleid/productos-catalogo/s04-urban-hoodie.jpg`,
        desc: 'Hoodie de corte urbano con capucha y bolsillo frontal. Pensado para días frescos y looks de calle.' },
    { name: 'Elegant Dress', alt: 'Vestido elegante', price: 140, sizes: ROPA_XS,
        img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=400',
        desc: 'Vestido de línea limpia y movimiento suave. Una pieza sobria para ocasiones especiales.' }
];

export const NEW_ARRIVALS = [
    { name: 'Vestido floral', alt: 'Vestido floral', price: 85, sizes: ROPA_XS,
        img: `${CDN}/f_auto,q_auto,w_900/v1794897431/styleid/productos-catalogo/s06-vestido-floral.jpg`,
        desc: 'Vestido con estampado floral y silueta ligera. Ideal para días cálidos y salidas informales.' },
    { name: 'Chaqueta de cuero', alt: 'Chaqueta de cuero', price: 150, sizes: ROPA,
        img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400',
        desc: 'Chaqueta de corte estructurado y acabado liso. Un clásico que aporta carácter a cualquier look.' },
    { name: 'Falda plisada', alt: 'Falda plisada', price: 65, sizes: ROPA_XS,
        img: `${CDN}/f_auto,q_auto,w_900/v1794897432/styleid/productos-catalogo/s08-falda-plisada.jpg`,
        desc: 'Falda de pliegues suaves y caída fluida. Combina con tops sencillos, botas o zapatillas.' },
    { name: 'Blazer oversize', alt: 'Blazer oversize', price: 110, sizes: ROPA,
        img: `${CDN}/f_auto,q_auto,w_900/v1794897433/styleid/productos-catalogo/s09-blazer-oversize.jpg`,
        desc: 'Blazer de hombros amplios y corte recto. Da estructura a looks casuales y formales.' },
    { name: 'Crop top', alt: 'Crop top', price: 45, sizes: ROPA_XS,
        img: `${CDN}/f_auto,q_auto,w_900/v1794897434/styleid/productos-catalogo/s10-crop-top.jpg`,
        desc: 'Top corto de corte ajustado. Fácil de combinar con jeans de tiro alto y faldas.' }
];

// Imágenes de la marca
export const LOGO = `${CDN}/f_auto,q_auto/v1794798291/styleid/sitio/logo.jpg`;
export const LOGO_CLARO = `${CDN}/f_auto,q_auto/v1794798290/styleid/sitio/logo-claro.png`;
