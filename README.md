# StyleID — Tienda de ropa online

🌐 **Ver la tienda en línea:** <https://styleid.onrender.com>

> Está en el plan gratuito de Render: si nadie la visitó en un rato, la primera carga tarda unos 50 segundos.

Tienda web de ropa para mujer y hombre hecha en Ecuador. Incluye catálogo de
100 prendas con filtros, carrito, pedidos con seguimiento, opiniones con
estrellas, favoritos, asesora de estilo con IA y panel de administrador.

**Tecnologías:** React 19 + Vite (frontend) · Express 4 + MongoDB Atlas (backend) · Cloudinary (fotos)

## Estructura

```
StyleID/
├── package.json            # Atajos: npm run dev / build / start
├── scripts/dev.js          # Enciende la API y la tienda a la vez
├── frontend/               # Tienda en React (Vite, varias páginas)
│   ├── *.html              # Una página por archivo (sala, catálogo, pedidos…)
│   ├── vite.config.js
│   └── src/
│       ├── main/           # Arranque de cada página (estilos + componente)
│       ├── pages/          # Un componente por página
│       ├── components/
│       │   ├── layout/     # Menú, buscador, pie de página, envoltura común
│       │   ├── feedback/   # Avisos de error, cookies, toast, barra de progreso
│       │   ├── tienda/     # Tarjeta de prenda, carrusel, carrito, detalle
│       │   ├── catalogo/   # Lógica de filtros
│       │   ├── ordenes/    # Pedido y favoritos
│       │   ├── admin/      # Órdenes, prendas y mensajes del panel
│       │   └── …
│       ├── hooks/          # Hooks reutilizables
│       ├── lib/            # API, sesión, tema, favoritos, etapas, textos
│       ├── data/           # Catálogo, prendas destacadas y datos de contacto
│       └── styles/         # CSS de cada página
└── backend/                # API con Express + MongoDB Atlas
    ├── server.js           # Sirve frontend/dist en /sala y la API en /api
    ├── catalogo.js         # Lee el catálogo de frontend/src/data
    ├── seguridad.js        # Tokens, dueño del carrito y límite de peticiones
    ├── cloudinary.js       # Subida de fotos a Cloudinary
    ├── models/             # Usuarios, carritos, pedidos, mensajes, prendas
    ├── routes/             # Endpoints de la API
    └── scripts/            # Prueba de extremo a extremo de la API
```

## Páginas

| Página | Qué hace |
|---|---|
| `inicio.html` | Portada, historia de la marca, registro e inicio de sesión, tema claro/oscuro |
| `sala.html` | Tienda principal: logo 3D, categorías, tendencias, novedades y comentarios |
| `catalogo.html` | 100 prendas con filtros por género, categoría, color, estilo, talla y precio |
| `estilo.html` | «Escoge tu estilo»: chat con la asesora de IA |
| `ordenes.html` | Mis pedidos (seguimiento por etapas) y mis favoritos |
| `informacion.html` | Pagos, envíos, cambios, tallas, contacto y cookies |
| `admin.html` | Panel de administrador: órdenes, prendas y mensajes |
| `404.html`, `500.html` | Páginas de error claras para personas y programadores |

## Puesta en marcha

Requisitos: **Node.js 22.12 o superior** y una base de datos gratuita en
[MongoDB Atlas](https://cloud.mongodb.com).

```bash
npm run install:all
```

Copia `backend/.env.example` como `backend/.env` y complétalo (ver la tabla de abajo).

**Para programar** (recarga al guardar):

```bash
npm run dev
```

Abre <http://localhost:5173/sala/inicio.html>. Vite reenvía las llamadas a `/api` al servidor Express (puerto 3002).

**Para publicar** (un solo servidor):

```bash
npm run build
npm start
```

Abre <http://localhost:3002>. Express sirve la tienda compilada (`frontend/dist`) y la API.

**Probar la API** (con el servidor encendido; crea datos de prueba y los borra):

```bash
npm run test:api
```

## Publicar en internet (Render)

El archivo `render.yaml` deja lista la tienda para [Render](https://render.com) (plan gratuito):

1. En Render: **New → Blueprint** y elige este repositorio.
2. Completa las claves que pide (`MONGODB_URI`, `ADMIN_PASSWORD` y las de Cloudinary). `ADMIN_SECRET` se genera solo.
3. En MongoDB Atlas → *Network Access*, permite la conexión desde Render (`0.0.0.0/0`).

Render instala, compila (`npm run build`) y arranca Express (`npm start`). La tienda queda en
`https://<nombre-del-servicio>.onrender.com`. En el plan gratuito el servidor se duerme si nadie
lo usa, y la primera visita tarda unos segundos en despertar.

## Variables de entorno (`backend/.env`)

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `MONGODB_URI` | Sí | Cadena de conexión de MongoDB Atlas |
| `PORT` | No | Puerto del servidor (por defecto 3002; los servicios de hosting lo ponen solos) |
| `ADMIN_PASSWORD` | Sí | Contraseña del panel de administrador |
| `ADMIN_SECRET` | Sí | Texto largo y aleatorio (16+ caracteres) para firmar las sesiones |
| `CLOUDINARY_URL` o `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | No | Subir las fotos de las prendas a Cloudinary. Sin ellas se guardan en `backend/uploads/productos/` |
| `ANTHROPIC_API_KEY` | No | Asesora de estilo con Claude |
| `FREELLMAPI_API_KEY`, `FREELLMAPI_BASE_URL`, `FREELLMAPI_MODEL` | No | Asesora de estilo con FreeLLMAPI (se usa si Claude no está disponible) |

Sin ninguna clave de IA, la asesora funciona en modo básico (preguntas guiadas y filtros).

> ⚠️ El archivo `.env` está en `.gitignore`. Nunca lo subas a GitHub ni lo compartas.
> Si MongoDB Atlas rechaza la conexión, agrega tu IP en Atlas → *Network Access*.

## Endpoints principales de la API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/users/register`, `/api/users/login` | Cuenta de usuario (devuelve un token) |
| GET/POST/PUT/DELETE | `/api/cart` | Carrito (exige `x-user-token` con sesión) |
| GET/POST | `/api/orders` | Pedidos del usuario |
| GET/POST | `/api/messages` | Opiniones de prendas y comentarios de la web |
| GET | `/api/messages/ratings` | Promedio de estrellas por prenda |
| GET | `/api/products` | Prendas agregadas desde el panel |
| POST | `/api/stylist` | Asesora de estilo |
| — | `/api/admin/*` | Panel de administrador (requiere `x-admin-token`) |

## Seguridad

- **Sin valores por defecto:** el servidor no arranca si faltan `MONGODB_URI`, `ADMIN_PASSWORD` o `ADMIN_SECRET`.
- **Sesión de usuario:** al entrar, la API devuelve un token firmado; `frontend/src/lib/api.js` lo envía en cada llamada. Los invitados usan un id aleatorio `invitado_xxxxxxxx`.
- **Panel de administrador:** el token caduca a las 12 horas y se guarda solo en la pestaña.
- **Precios:** el servidor usa el precio del catálogo, no el que envía el navegador.
- **Límite de peticiones** por IP en inicio de sesión, mensajes, pedidos y asesora.
- Las contraseñas se guardan cifradas con bcrypt.

## Errores

| Caso | Qué ve la persona | Qué ve el programador |
|---|---|---|
| Página que no existe | Página 404 | Dirección, hora y origen en «Detalles técnicos» |
| Fallo interno en una página | Página 500 | ID del error (el mismo que sale en la consola del servidor) |
| Ruta de la API que no existe | — | JSON `{ error, codigo: "RUTA_NO_ENCONTRADA", metodo, ruta }` |
| Fallo interno de la API | Aviso «La tienda tuvo un problema» | JSON `{ error, codigo: "ERROR_INTERNO", id }` |
| Servidor apagado o sin internet | Aviso con botón «Reintentar» | Petición, error y pista para arrancar el backend |

Los avisos los controla `frontend/src/lib/avisos.js` y los pinta `components/feedback/ErrorBanner.jsx`.

## Notas para programar

- Las etapas de los pedidos están en `frontend/src/lib/etapas.js` y en `backend/routes/admin.js`: si cambias una, cambia la otra.
- El catálogo de ejemplo está en `frontend/src/data/catalogo.js` y lo usan la tienda y el servidor.
- Datos de contacto, banco y redes: `frontend/src/data/contacto.js`.
