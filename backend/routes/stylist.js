// =====================================================
// StyleID — Asistente de estilo («Escoge tu estilo»)
// POST /api/stylist  { messages: [{ role: 'user'|'assistant', content }] }
//
// Con ANTHROPIC_API_KEY en el .env conversa usando Claude y recomienda
// prendas reales del catálogo. Sin clave, responde un asistente local
// sencillo (preguntas guiadas + filtros) para que la página siga funcionando.
// =====================================================
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const Product = require('../models/Product');
const { rateLimit } = require('../seguridad');
const { CATEGORIES, GENDERS, CATALOG, COLORS, STYLES } = require('../catalogo');
const colorLabel = Object.fromEntries(COLORS.map((c) => [c.id, c.label]));
const styleLabel = Object.fromEntries(STYLES.map((s) => [s.id, s.label]));

const router = express.Router();

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 20;          // mensajes que se envían como historial
const MAX_CHARS = 800;         // por mensaje de la persona
const MAX_PICKS = 4;

// El cliente solo se crea si hay clave; si no, se usa el asistente local.
// Se limpian espacios o comillas por si la clave se pegó con ellos.
const API_KEY = String(process.env.ANTHROPIC_API_KEY || '').trim().replace(/^["']|["']$/g, '');
const client = API_KEY ? new Anthropic({ apiKey: API_KEY }) : null;

console.log(client
    ? '  - Asistente de estilo: IA activada (Claude)'
    : '  - Asistente de estilo: modo básico (agrega ANTHROPIC_API_KEY en .env para activar la IA)');

const categoryLabel = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

/** Prendas de ejemplo + prendas activas creadas desde el panel. */
async function loadCatalog() {
    let extra = [];
    try {
        extra = await Product.find({ active: true }).lean();
    } catch (err) {
        extra = [];
    }
    const fromDb = extra.map((p) => ({
        genero: p.genero,
        categoria: p.categoria,
        name: p.name,
        price: p.price,
        img: p.img,
        sizes: p.sizes || [],
        desc: p.desc || '',
        color: p.color || '',
        estilo: p.estilo || '',
        tags: ''
    }));
    // Si una prenda del panel repite nombre, gana la del panel
    const names = new Set(fromDb.map((p) => p.name.toLowerCase()));
    return fromDb.concat(CATALOG.filter((p) => !names.has(p.name.toLowerCase())));
}

/** Lista compacta para el prompt (una línea por prenda). */
function catalogText(catalog) {
    return catalog
        .map((p) => `- ${p.name} | ${GENDERS[p.genero]?.label || p.genero} | ${categoryLabel[p.categoria] || p.categoria} | color: ${colorLabel[p.color] || '-'} | estilo: ${styleLabel[p.estilo] || '-'} | $${Number(p.price).toFixed(2)} | tallas: ${(p.sizes || []).join(', ')} | ${p.desc}`)
        .join('\n');
}

const SYSTEM_PROMPT = `Eres la asesora de estilo de StyleID, una tienda de ropa online de Ecuador. Conversas en español, con un tono cercano, alegre y breve (como una vendedora amable que sabe de moda), y ayudas a cada persona a escoger su prenda ideal.

Cómo conversar:
- Averigua lo necesario con preguntas cortas, una o dos a la vez: para quién es (mujer u hombre), la ocasión (diario, salida, trabajo, fiesta, deporte, regalo), el estilo que le gusta (urbano, clásico, elegante, deportivo, romántico), colores, presupuesto y, si hace falta, la talla.
- Si la persona ya dio suficiente información, recomienda de inmediato sin hacer más preguntas.
- Cuando recomiendes, elige de 1 a 4 prendas y explica en una frase por qué le queda bien cada una. Puedes armar un outfit combinando categorías.
- Mantén "reply" en 1 a 3 frases cortas. No uses markdown, listas ni emojis en exceso (máximo uno).
- Las prendas recomendadas se muestran como tarjetas con foto, precio y tu motivo: en "reply" no repitas sus precios ni las describas una por una; da una idea general del look y, si quieres, una pregunta para afinar.
- En "suggestions" ofrece de 2 a 4 respuestas rápidas cortas (máximo 5 palabras cada una) que la persona podría tocar para seguir la conversación.

Reglas:
- Recomienda solo prendas de la lista del catálogo, escribiendo el nombre exactamente igual. Nunca inventes prendas, precios, descuentos, tallas ni plazos de envío.
- Si no hay nada que encaje (por ejemplo, un color o prenda que no existe), dilo con honestidad y propone lo más parecido del catálogo.
- Para pagos, envíos o cambios, indica que los detalles están en la página Información.
- Si te piden algo que no tiene que ver con moda o con la tienda, redirige con amabilidad a escoger su estilo.
- "picks" va vacío mientras sigas haciendo preguntas.`;

const OUTPUT_SCHEMA = {
    type: 'object',
    properties: {
        reply: { type: 'string', description: 'Mensaje para la persona, en español.' },
        picks: {
            type: 'array',
            description: 'Prendas recomendadas (vacío si aún estás preguntando).',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nombre exacto de la prenda del catálogo.' },
                    reason: { type: 'string', description: 'Por qué le queda bien, en una frase.' }
                },
                required: ['name', 'reason'],
                additionalProperties: false
            }
        },
        suggestions: {
            type: 'array',
            description: 'Respuestas rápidas cortas para seguir la conversación.',
            items: { type: 'string' }
        }
    },
    required: ['reply', 'picks', 'suggestions'],
    additionalProperties: false
};

/** Limpia el historial que llega del navegador. */
function cleanMessages(raw) {
    if (!Array.isArray(raw)) return [];
    const list = raw
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.trim().slice(0, m.role === 'user' ? MAX_CHARS : 2000) }))
        .filter((m) => m.content)
        .slice(-MAX_TURNS);
    // La conversación debe empezar con la persona
    while (list.length && list[0].role !== 'user') list.shift();
    return list;
}

/** Une cada recomendación con los datos reales de la prenda. */
function attachProducts(picks, catalog) {
    const byName = new Map(catalog.map((p) => [p.name.toLowerCase(), p]));
    const seen = new Set();
    const out = [];
    (picks || []).forEach((pick) => {
        const product = byName.get(String(pick.name || '').trim().toLowerCase());
        if (!product || seen.has(product.name)) return;
        seen.add(product.name);
        out.push({
            name: product.name,
            reason: String(pick.reason || '').slice(0, 240),
            price: product.price,
            img: product.img,
            genero: product.genero,
            categoria: product.categoria,
            categoriaLabel: categoryLabel[product.categoria] || product.categoria
        });
    });
    return out.slice(0, MAX_PICKS);
}

// ---------------------------------------------------------------
// Asistente local (sin clave de Claude)
// ---------------------------------------------------------------
function normalize(text) {
    return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const OCCASION_WORDS = {
    fiesta: ['fiesta', 'noche', 'boda', 'gala', 'evento', 'salir', 'cita'],
    trabajo: ['trabajo', 'oficina', 'formal', 'reunion', 'entrevista'],
    deporte: ['deporte', 'gym', 'gimnasio', 'correr', 'entrenar', 'futbol'],
    diario: ['diario', 'casual', 'universidad', 'colegio', 'comodo', 'dia a dia']
};

const OCCASION_HINTS = {
    fiesta: ['satinado', 'gala', 'tacon', 'traje', 'vestido', 'cartera', 'aretes', 'reloj', 'noche', 'elegante'],
    trabajo: ['blazer', 'chino', 'traje', 'camisa', 'reloj', 'bolso', 'clasico', 'formal'],
    deporte: ['running', 'deportiv', 'jersey', 'mochila', 'sneaker', 'zapatilla'],
    diario: ['jean', 'camiseta', 'zapatilla', 'tote', 'mochila', 'urbano', 'casual', 'cargo', 'sobrecamisa']
};

function localStylist(messages, catalog) {
    const userText = normalize(messages.filter((m) => m.role === 'user').map((m) => m.content).join(' '));

    // Para quién: gana lo último que dijo la persona
    let genero = null;
    const userTurns = messages.filter((m) => m.role === 'user').map((m) => normalize(m.content)).reverse();
    for (const turn of userTurns) {
        const woman = /\b(mujer|dama|chica|ella|novia|mama|hermana|amiga|femenin\w*)\b/.test(turn);
        const man = /\b(hombre|caballero|chico|novio|papa|hermano|amigo|masculin\w*)\b/.test(turn);
        if (woman !== man) {
            genero = woman ? 'mujer' : 'hombre';
            break;
        }
    }

    const categoria = CATEGORIES.find((c) =>
        [c.id, c.label, ...c.words.split(' ')].some((w) => w.length > 3 && userText.includes(normalize(w).replace(/s$/, '')))
    )?.id || null;

    const occasion = Object.keys(OCCASION_WORDS).find((k) => OCCASION_WORDS[k].some((w) => userText.includes(w))) || null;

    const budgetMatch = userText.match(/\$?\s?(\d{2,3})\s?(dolares|usd|\$)?/);
    const budget = budgetMatch ? Number(budgetMatch[1]) : null;

    if (!genero) {
        return {
            reply: '¡Hola! Te ayudo a encontrar tu prenda ideal. Para empezar, ¿buscas algo para mujer o para hombre?',
            picks: [],
            suggestions: ['Para mujer', 'Para hombre']
        };
    }
    if (!occasion && !categoria) {
        return {
            reply: '¡Perfecto! ¿Para qué ocasión la quieres? Así te recomiendo lo que mejor te va.',
            picks: [],
            suggestions: ['Para el día a día', 'Para una fiesta', 'Para el trabajo', 'Para hacer deporte']
        };
    }

    let pool = catalog.filter((p) => p.genero === genero);
    if (categoria) pool = pool.filter((p) => p.categoria === categoria);

    // Color y estilo mencionados («algo negro», «estilo deportivo»): se usan si hay prendas que encajen
    const color = COLORS.find((c) => new RegExp(`\\b${normalize(c.label)}[oa]?s?\\b`).test(userText));
    const style = STYLES.find((s) => [s.label, ...s.words.split(' ')].some((w) => w.length > 3 && userText.includes(normalize(w))));
    if (color) {
        const byColor = pool.filter((p) => p.color === color.id);
        if (byColor.length) pool = byColor;
    }
    if (style) {
        const byStyle = pool.filter((p) => p.estilo === style.id);
        if (byStyle.length) pool = byStyle;
    }
    if (budget) {
        const inBudget = pool.filter((p) => p.price <= budget);
        if (!inBudget.length) {
            const cheapest = pool.slice().sort((a, b) => a.price - b.price)[0];
            return {
                reply: cheapest
                    ? `Con $${budget} no encontré nada en esa búsqueda: lo más económico es ${cheapest.name} a $${cheapest.price.toFixed(2)}. ¿Subimos un poco el presupuesto o miramos otra categoría?`
                    : 'No encontré prendas para esa búsqueda. ¿Probamos con otra categoría?',
                picks: cheapest ? [{ name: cheapest.name, reason: cheapest.desc }] : [],
                suggestions: ['Subir el presupuesto', 'Ver accesorios', 'Otra categoría']
            };
        }
        pool = inBudget;
    }

    const hints = occasion ? OCCASION_HINTS[occasion] : [];
    const scored = pool
        .map((p) => {
            const text = normalize(`${p.name} ${p.tags || ''} ${p.desc}`);
            const score = hints.reduce((s, h) => s + (text.includes(h) ? 1 : 0), 0);
            return { p, score };
        })
        .sort((a, b) => b.score - a.score || a.p.price - b.p.price);

    // Variedad: una prenda por categoría si no pidió una categoría concreta
    const picks = [];
    const usedCats = new Set();
    scored.forEach(({ p }) => {
        if (picks.length >= 3) return;
        if (!categoria && usedCats.has(p.categoria)) return;
        usedCats.add(p.categoria);
        picks.push({ name: p.name, reason: p.desc });
    });

    if (!picks.length) {
        return {
            reply: 'No encontré algo que encaje con eso. ¿Probamos con otra categoría o un presupuesto distinto?',
            picks: [],
            suggestions: ['Ver camisas', 'Ver zapatos', 'Ver conjuntos']
        };
    }

    return {
        reply: 'Mira estas opciones que creo que te van a encantar. Si quieres, dime tu presupuesto o un color y afino la búsqueda.',
        picks,
        suggestions: ['Algo más económico', 'Ver accesorios', 'Otra ocasión']
    };
}

// ---------------------------------------------------------------
// Proveedor 1: Claude (Anthropic)
// ---------------------------------------------------------------
// Si Claude falla por la cuenta (sin saldo, clave inválida, límite), se deja
// de intentar un rato para no hacer esperar a la persona en cada mensaje.
const CLAUDE_PAUSE_MS = 10 * 60 * 1000;
let claudePausedUntil = 0;

async function askClaude(messages, catalog) {
    const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        // Si Claude declina por seguridad, el servidor reintenta con otro modelo
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        // Chat de tienda: poco razonamiento = respuestas rápidas
        output_config: {
            effort: 'low',
            format: { type: 'json_schema', schema: OUTPUT_SCHEMA }
        },
        // El catálogo es estable: va en el system y se cachea
        system: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'text', text: `Catálogo disponible (nombre | para | categoría | precio | tallas | descripción):\n${catalogText(catalog)}`, cache_control: { type: 'ephemeral' } }
        ],
        messages
    });

    if (response.stop_reason === 'refusal') {
        return {
            reply: 'Prefiero ayudarte solo con temas de moda y de la tienda. ¿Qué prenda estás buscando?',
            picks: [],
            suggestions: ['Para mujer', 'Para hombre']
        };
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    const data = parseJson(textBlock ? textBlock.text : '');
    if (!data) throw new Error(`Respuesta sin formato (stop_reason: ${response.stop_reason})`);
    return data;
}

function logClaudeError(err) {
    if (err instanceof Anthropic.AuthenticationError) {
        console.error('Asistente de estilo (Claude): la ANTHROPIC_API_KEY no es válida');
    } else if (err instanceof Anthropic.RateLimitError) {
        console.error('Asistente de estilo (Claude): límite de uso alcanzado');
    } else if (err instanceof Anthropic.APIError) {
        console.error(`Asistente de estilo (Claude): error ${err.status}:`, err.message);
    } else {
        console.error('Asistente de estilo (Claude):', err.message);
    }
    // Errores de cuenta (sin saldo = 400, clave = 401, permisos = 403, límite = 429): pausar Claude
    if (err instanceof Anthropic.APIError && [400, 401, 403, 429].includes(err.status)) {
        claudePausedUntil = Date.now() + CLAUDE_PAUSE_MS;
        console.error('Asistente de estilo: Claude en pausa 10 minutos; se usa el siguiente proveedor.');
    }
}

// ---------------------------------------------------------------
// Proveedor 2: FreeLLMAPI (app de escritorio, compatible con OpenAI)
// ---------------------------------------------------------------
const FREE_KEY = String(process.env.FREELLMAPI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
const FREE_BASE = String(process.env.FREELLMAPI_BASE_URL || 'http://127.0.0.1:31415/v1').trim().replace(/\/+$/, '');
// Uno o varios modelos separados por coma: se prueban en orden hasta que uno responda
const FREE_MODELS = String(process.env.FREELLMAPI_MODEL || 'auto')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
const FREE_TIMEOUT_MS = 20000;   // por modelo; si tarda más, se pasa al siguiente

console.log(FREE_KEY
    ? `  - Asistente de estilo: FreeLLMAPI activado (${FREE_BASE}, modelos: ${FREE_MODELS.join(' → ')})`
    : '  - Asistente de estilo: FreeLLMAPI sin clave (agrega FREELLMAPI_API_KEY en .env)');

/** Saca el primer objeto JSON de un texto (algunos modelos lo envuelven en ```json). */
function parseJson(text) {
    const raw = String(text || '').trim();
    const attempts = [raw];
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) attempts.push(fenced[1]);
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) attempts.push(raw.slice(start, end + 1));
    for (const candidate of attempts) {
        try {
            const data = JSON.parse(candidate);
            if (data && typeof data.reply === 'string') return data;
        } catch (err) { /* siguiente intento */ }
    }
    return null;
}

const FREE_FORMAT_RULES = `Responde SIEMPRE y SOLO con un objeto JSON válido, sin texto antes ni después y sin \`\`\`, con esta forma exacta:
{"reply": "mensaje para la persona", "picks": [{"name": "nombre exacto de la prenda", "reason": "por qué le queda bien"}], "suggestions": ["respuesta rápida 1", "respuesta rápida 2"]}`;

async function askFreeLLM(messages, catalog) {
    let lastError = null;
    for (const model of FREE_MODELS) {
        try {
            return await askFreeModel(model, messages, catalog);
        } catch (err) {
            lastError = err;
            console.error(`Asistente de estilo (FreeLLMAPI ${model}):`, err.message);
        }
    }
    throw lastError || new Error('Sin modelos configurados');
}

async function askFreeModel(model, messages, catalog) {
    const res = await fetch(`${FREE_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${FREE_KEY}`
        },
        body: JSON.stringify({
            model,
            temperature: 0.7,
            max_tokens: 1200,
            messages: [
                {
                    role: 'system',
                    content: `${SYSTEM_PROMPT}\n\n${FREE_FORMAT_RULES}\n\nCatálogo disponible (nombre | para | categoría | precio | tallas | descripción):\n${catalogText(catalog)}`
                },
                ...messages
            ]
        }),
        signal: AbortSignal.timeout(FREE_TIMEOUT_MS)
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        const detail = (body && body.error && (body.error.message || body.error)) || res.statusText;
        throw new Error(`HTTP ${res.status}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
    }

    const text = body && body.choices && body.choices[0] && body.choices[0].message
        ? body.choices[0].message.content
        : '';
    const data = parseJson(text);
    if (data) return data;

    // Si el modelo respondió texto normal, se usa como mensaje sin prendas
    if (String(text || '').trim()) {
        return { reply: String(text).trim().slice(0, 800), picks: [], suggestions: [] };
    }
    throw new Error('Respuesta vacía');
}

// ---------------------------------------------------------------
// Ruta: prueba Claude → FreeLLMAPI → asistente local
// ---------------------------------------------------------------
function cleanSuggestions(list) {
    return (Array.isArray(list) ? list : []).map((s) => String(s).slice(0, 40)).filter(Boolean).slice(0, 4);
}

// La IA cuesta (o tiene cupo): como mucho 25 mensajes cada 5 minutos por IP
const chatLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 25, message: 'Vas muy rápido. Espera un momento antes de seguir conversando.' });

router.post('/', chatLimit, async (req, res, next) => {
  try {
    const messages = cleanMessages(req.body && req.body.messages);
    if (!messages.length) {
        return res.status(400).json({ error: 'Escribe un mensaje para empezar' });
    }

    const catalog = await loadCatalog();
    const send = (mode, data) => res.json({
        mode,
        reply: String(data.reply || '').slice(0, 1500),
        picks: attachProducts(data.picks, catalog),
        suggestions: cleanSuggestions(data.suggestions)
    });

    if (client && Date.now() >= claudePausedUntil) {
        try {
            return send('claude', await askClaude(messages, catalog));
        } catch (err) {
            logClaudeError(err);
        }
    }

    if (FREE_KEY) {
        try {
            return send('freellmapi', await askFreeLLM(messages, catalog));
        } catch (err) {
            console.error('Asistente de estilo (FreeLLMAPI): ningún modelo respondió:', err.message);
        }
    }

    // Sin IA disponible: el asistente local responde para no dejar a la persona sin ayuda
    send('local', localStylist(messages, catalog));
  } catch (err) {
    next(err);   // lo recoge el manejador de errores de server.js
  }
});

module.exports = router;
