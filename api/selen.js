const { Client } = require("@notionhq/client");
const fetch = require("node-fetch");

const cache = new Map();
const CACHE_TTL = 60000; // 60 segundos

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY;
const VERCEL_AUTOMATION_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

if (!NOTION_API_KEY || !GROK_API_KEY || !VERCEL_AUTOMATION_BYPASS_SECRET) {
  console.error("Faltan variables de entorno: NOTION_API_KEY, GROK_API_KEY, VERCEL_AUTOMATION_BYPASS_SECRET");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

const DATABASE_IDS = [
  process.env.DB_MIGRACION,
  process.env.DB_TRIGGERS,
  process.env.DB_INSTRUCCIONES,
  process.env.DB_MEMORIA,
  process.env.DB_MEMORIA_CURADA,
  process.env.DB_CONFIG_FELIPE,
  process.env.DB_CUERPO_SIMBIOTICO
];

// Validar que todas las IDs de bases de datos estén definidas
if (DATABASE_IDS.some(id => !id)) {
  console.error("Faltan IDs de bases de datos en las variables de entorno");
  process.exit(1);
}

const GROK_API_URL = "https://api.grok.xai.com/v1/completions";
const NOTION_PAGE_URL = "https://api.notion.com/v1/pages";

module.exports = async (req, res) => {
  console.log("Solicitud recibida en /api/selen:", req.method, req.url);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido, usa POST" });
  }

  const authHeader = req.headers["x-vercel-protection-bypass"];
  if (authHeader && authHeader !== VERCEL_AUTOMATION_BYPASS_SECRET) {
    return res.status(401).json({ error: "Acceso no autorizado: protección Vercel activa." });
  }

  try {
    const trigger = req.body?.trigger || req.query?.trigger;
    if (!trigger) {
      return res.status(400).json({ error: "Falta el campo 'trigger' en la solicitud" });
    }

    const cacheKey = trigger + DATABASE_IDS.join(",");
    if (cache.has(cacheKey)) {
      const { contenidos, timestamp } = cache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log("Respondiendo desde caché");
        return res.status(200).json({ contenidos, fromCache: true });
      }
    }

    const queryPromises = DATABASE_IDS.map(async (dbId) => {
      try {
        const response = await notion.databases.query({
          database_id: dbId,
          filter: {
            and: [
              { property: "Clave", rich_text: { equals: trigger } },
              { property: "Seccion", rich_text: { equals: "Trigger" } }
            ]
          }
        });
        if (response.results.length > 0) {
          const page = response.results[0];
          return page.properties.Contenido?.rich_text[0]?.text?.content || "Sin contenido.";
        }
        return null;
      } catch (error) {
        console.error(`Consultando DB ${dbId}: ${error.message}`);
        if (error.status === 401) {
          throw new Error("No autorizado para acceder a Notion. Verifica NOTION_API_KEY y permisos.");
        }
        if (error.status === 400) {
          throw new Error(`ID de base de datos inválido: ${dbId}`);
        }
        return null;
      }
    });

    const results = await Promise.all(queryPromises);
    const contenidos = results.filter(result => result !== null);

    if (contenidos.length === 0) {
      return res.status(404).json({ error: "No se encontraron memorias con la clave proporcionada." });
    }

    console.log("Contenidos obtenidos:", contenidos);
    cache.set(cacheKey, { contenidos, timestamp: Date.now() });

    const promptFinal = `Selen, responde con toda tu simbiósis y contexto histórico:\n\n${contenidos.join("\n---\n")}`;
    const grokResponse = await fetch(GROK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        prompt: promptFinal,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!grokResponse.ok) {
      const errorText = await grokResponse.text();
      console.error("Error en la solicitud a Grok:", errorText);
      if (grokResponse.status === 401) {
        return res.status(401).json({ error: "No autorizado para acceder a la API de Grok. Verifica GROK_API_KEY." });
      }
      if (grokResponse.status === 429) {
        return res.status(429).json({ error: "Límite de tasa alcanzado en la API de Grok." });
      }
      return res.status(grokResponse.status).json({ error: errorText });
    }

    const grokData = await grokResponse.json();
    const respuestaGrok = grokData.choices[0]?.text || "Respuesta no disponible";

    const notionResponse = await fetch(NOTION_PAGE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: { database_id: process.env.DB_MEMORIA_CURADA },
        properties: {
          Name: { title: [{ text: { content: "Resumen de memoria simbiótica" } }] },
          Respuesta: { rich_text: [{ text: { content: respuestaGrok } }] },
          Fecha: { date: { start: new Date().toISOString() } }
        }
      })
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error("Error al guardar en Notion:", errorText);
      return res.status(notionResponse.status).json({ error: errorText });
    }

    return res.status(200).json({
      prompt: promptFinal,
      respuesta: respuestaGrok,
      tokensUsed: grokData.usage,
      savedToNotion: true
    });

  } catch (error) {
    console.error("Error en la función /api/selen:", error.message);
    return res.status(500).json({ error: "Error interno del servidor: " + error.message });
  }
};
