// =====================================================
// Páginas de error 404 y 500 (las devuelve Express).
// Explican qué pasó con palabras simples y, en «Detalles técnicos»,
// dan la información que necesita un programador.
// =====================================================
import { Fragment, useEffect, useState } from 'react';
import { LOGO } from '../data/destacados.js';

// Enlaces absolutos: la página de error puede salir en cualquier dirección
const BASE = import.meta.env.BASE_URL;

const TEXTS = {
    404: {
        title: 'Página no encontrada',
        icon: 'fa-shirt',
        heading: 'No encontramos esta página',
        lead: 'Puede que el enlace esté mal escrito o que la página ya no exista. Tu carrito y tus pedidos siguen a salvo.',
        hint: <>El servidor no encontró ningún archivo ni ruta para esta dirección. La tienda vive en <code>/sala/</code> (React, carpeta <code>frontend/</code>) y la API en <code>/api/*</code> (ver <code>backend/server.js</code>).</>
    },
    500: {
        title: 'Error interno del servidor',
        icon: 'fa-screwdriver-wrench',
        heading: 'Algo salió mal de nuestro lado',
        lead: 'No es culpa tuya: la tienda tuvo un problema al preparar esta página. Normalmente se arregla al intentarlo de nuevo en unos segundos.',
        hint: <>El servidor respondió con un error interno. Busca el <strong>ID del error</strong> en la consola del backend para ver el mensaje completo y la traza. Causas habituales: la base de datos no responde (<code>MONGODB_URI</code>) o falta una variable en <code>backend/.env</code>.</>
    }
};

export default function PaginaError({ codigo }) {
    const t = TEXTS[codigo];
    const [copyLabel, setCopyLabel] = useState('Copiar detalles');

    useEffect(() => { document.body.classList.add('error-page'); }, []);

    // El servidor escribe el id del error en <body data-id="...">
    const errorId = document.body.dataset.id || '';
    const details = [
        ['Código', `${codigo} · ${t.title}`],
        ...(errorId ? [['ID del error', errorId]] : []),
        ['Dirección', location.href],
        ['Fecha y hora', new Date().toISOString()],
        ['Venías de', document.referrer || '(entrada directa)'],
        ['Navegador', navigator.userAgent]
    ];

    async function copy() {
        const text = details.map(([name, value]) => `${name}: ${value}`).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopyLabel('¡Copiado!');
        } catch (err) {
            setCopyLabel('Selecciona el texto y cópialo');
        }
        setTimeout(() => setCopyLabel('Copiar detalles'), 2200);
    }

    function back() {
        if (history.length > 1) history.back(); else location.href = `${BASE}sala.html`;
    }

    const [first, last] = String(codigo).split('').filter((_, i) => i !== 1);

    return (
        <main className="error-card">
            <a className="error-brand" href={`${BASE}sala.html`}>
                <img src={LOGO} alt="" width="44" height="44" />
                <span>StyleID</span>
            </a>

            <p className="error-code" aria-hidden="true">{first}<i className={`fa-solid ${t.icon}`}></i>{last}</p>
            <h1>{t.heading}</h1>
            <p className="error-lead">{t.lead}</p>

            <div className="error-actions">
                {codigo === '500' ? (
                    <>
                        <button className="error-btn primary" type="button" onClick={() => location.reload()}>
                            <i className="fa-solid fa-rotate-right" aria-hidden="true"></i> Intentar de nuevo
                        </button>
                        <a className="error-btn" href={`${BASE}sala.html`}><i className="fa-solid fa-house" aria-hidden="true"></i> Ir a la tienda</a>
                        <a className="error-btn" href={`${BASE}informacion.html#contacto`}><i className="fa-brands fa-whatsapp" aria-hidden="true"></i> Pedir ayuda</a>
                    </>
                ) : (
                    <>
                        <a className="error-btn primary" href={`${BASE}sala.html`}><i className="fa-solid fa-house" aria-hidden="true"></i> Ir a la tienda</a>
                        <a className="error-btn" href={`${BASE}catalogo.html`}><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Ver el catálogo</a>
                        <button className="error-btn" type="button" onClick={back}><i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver atrás</button>
                    </>
                )}
            </div>

            <ul className="error-tips">
                {codigo === '500' ? (
                    <>
                        <li>Espera un momento y vuelve a intentarlo.</li>
                        <li>Si estabas pagando o haciendo un pedido, revisa <a href={`${BASE}ordenes.html`}>Mis pedidos</a> antes de repetirlo.</li>
                        <li>Si sigue fallando, escríbenos y cuéntanos qué estabas haciendo.</li>
                    </>
                ) : (
                    <>
                        <li>Revisa que la dirección esté bien escrita.</li>
                        <li>Busca la prenda por su nombre en el <a href={`${BASE}catalogo.html`}>catálogo</a>.</li>
                        <li>Si llegaste aquí desde un botón de la tienda, <a href={`${BASE}informacion.html#contacto`}>avísanos</a> para arreglarlo.</li>
                    </>
                )}
            </ul>

            <details className="error-tech">
                <summary><i className="fa-solid fa-code" aria-hidden="true"></i> Detalles técnicos (para programadores)</summary>
                <dl>
                    {details.map(([name, value]) => (
                        <Fragment key={name}><dt>{name}</dt><dd>{value}</dd></Fragment>
                    ))}
                </dl>
                <p className="error-hint">{t.hint}</p>
                <button className="error-copy" type="button" onClick={copy}>
                    <i className="fa-regular fa-copy" aria-hidden="true"></i> <span>{copyLabel}</span>
                </button>
            </details>
        </main>
    );
}
