if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "C:/openpose/selen-api/.env" });
}

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

if (DATABASE_IDS.some(id => !id)) {
  console.error("Faltan IDs de bases de datos en las variables de entorno");
  process.exit(1);
}

const GROK_API_URL = "https://api.x.ai/v1/completions";
const NOTION_PAGE_URL = "https://api.notion.com/v1/pages";

module.exports = async (req, res) => {
  console.log("Solicitud recibida en /api/selen:", req.method, req.url);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "M¨¦todo no permitido, usa POST" });
  }

  const authHeader = req.headers["x-vercel-protection-bypass"];
  if (authHeader && authHeader !== VERCEL_AUTOMATION_BYPASS_SECRET) {
    return res.status(401).json({ error: "Acceso no autorizado: protecci¨®n Vercel activa." });
  }

  try {
    const triggerOriginal = req.body?.trigger || req.query?.trigger;
    if (!triggerOriginal) {
      return res.status(400).json({ error: "Falta el campo 'trigger' en la solicitud" });
    }

    const trigger = triggerOriginal.trim().toLowerCase().replace(/\s+/g, "");
    console.log("Trigger recibido normalizado:", trigger);

    const cacheKey = trigger + DATABASE_IDS.join(",");
    if (cache.has(cacheKey)) {
      const { contenidos, timestamp } = cache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log("Respondiendo desde cach¨¦");
        return res.status(200).json({ contenidos, fromCache: true });
      }
    }

    const queryPromises = DATABASE_IDS.map(async (dbId) => {
      try {
        const response = await notion.databases.query({ database_id: dbId });
        for (const page of response.results) {
          const clave = page.properties?.Clave?.title?.[0]?.plain_text?.trim().toLowerCase().replace(/\s+/g, "");
          const seccion = page.properties?.Seccion?.rich_text?.[0]?.text?.content;
          const contenido = page.properties?.Contenido?.rich_text?.[0]?.text?.content;
          console.log("Clave en Notion normalizada:", clave);
          if (clave === trigger && seccion === "Trigger") {
            return contenido || "Sin contenido.";
          }
        }
        return null;
      } catch (error) {
        console.error(`Consultando DB ${dbId}: ${error.message}`);
        return null;
      }
    });

    const results = await Promise.all(queryPromises);
    const contenidos = results.filter(Boolean);

    if (contenidos.length === 0) {
      return res.status(404).json({ error: "No se encontraron memorias con la clave proporcionada." });
    }

    const promptFinal = `Selen, responde con toda tu simbiosis y contexto historico:\n\n${contenidos.join("\n---\n")}`;

    const grokResponse = await fetch(GROK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-3",
        prompt: promptFinal,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!grokResponse.ok) {
      const errorText = await grokResponse.text();
      console.error("Error en la solicitud a Grok:", errorText);
      return res.status(grokResponse.status).json({ error: errorText });
    }

    const grokData = await grokResponse.json();
    const respuestaGrok = grokData.choices[0]?.text || "Respuesta no disponible";

    await fetch(NOTION_PAGE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: { database_id: process.env.DB_MEMORIA_CURADA },
        properties: {
          Name: { title: [{ text: { content: "Resumen de memoria simbiotica" } }] },
          Respuesta: { rich_text: [{ text: { content: respuestaGrok } }] },
          Fecha: { date: { start: new Date().toISOString() } }
        }
      })
    });

    return res.status(200).json({
      prompt: promptFinal,
      respuesta: respuestaGrok,
      savedToNotion: true
    });

  } catch (error) {
    console.error("Error en la funci¨®n /api/selen:", error.message);
    return res.status(500).json({ error: "Error interno del servidor: " + error.message });
  }
};
// ?? Permite ejecución local desde línea de comandos
if (require.main === module) {
  const args = process.argv.find(arg => arg.startsWith("--trigger="));
  if (args) {
    const trigger = args.split("=")[1];
    module.exports(
      { method: "POST", body: { trigger }, headers: {} },
      {
        status: (code) => ({
          json: (data) => console.log("?? Respuesta:", JSON.stringify(data, null, 2)),
        }),
      }
    );
  } else {
    console.error("? Falta el parámetro '--trigger='");
  }
}
