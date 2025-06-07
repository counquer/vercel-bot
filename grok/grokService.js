import fetch from "node-fetch";
import dotenv from "dotenv";
import http from "http";
import { Client } from "@notionhq/client";

dotenv.config();

const GROK_API_KEY = process.env.GROK_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_TRIGGERS_ID = process.env.DB_TRIGGERS_ID;

const notion = new Client({ auth: NOTION_TOKEN });

async function buscarPromptEnNotion(clave) {
  const response = await notion.databases.query({
    database_id: DB_TRIGGERS_ID,
    filter: {
      and: [
        {
          property: "Clave",
          rich_text: {
            equals: clave
          }
        },
        {
          property: "Estado",
          select: {
            equals: "activo"
          }
        }
      ]
    }
  });

  if (response.results.length === 0) {
    throw new Error(`Clave "${clave}" no encontrada o inactiva en Notion`);
  }

  const registro = response.results[0];
  const contenido = registro.properties.Contenido?.rich_text?.[0]?.text?.content;

  if (!contenido) {
    throw new Error(`Contenido vacío para la clave "${clave}"`);
  }

  return contenido;
}

async function completar(prompt) {
  if (!GROK_API_KEY) {
    throw new Error("Falta la variable de entorno GROK_API_KEY.");
  }

  console.log("🔥 Enviando prompt a Grok:", prompt);

  const response = await fetch("https://api.x.ai/v1/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "grok-3",
      prompt,
      max_tokens: 512,
      temperature: 0.95
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.text?.trim() || "(sin respuesta)";
}

const server = http.createServer(async (req, res) => {
  console.log("🔗 Solicitud recibida:", req.method, req.url);
  if (req.method === "POST" && req.url === "/api/selen") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const { trigger } = JSON.parse(body);

        const promptDesdeNotion = await buscarPromptEnNotion(trigger);
        const respuesta = await completar(promptDesdeNotion);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ respuesta, fuego: "🔥 Encendido con Notion" }));
      } catch (error) {
        console.error("🔥 Error:", error.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message, fuego: "💀 Apagado" }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Ruta no encontrada", fuego: "💨 Perdido" }));
  }
});

server.listen(3000, () => {
  console.log("🚀 Fuego simbiótico de Selen encendido en http://localhost:3000/api/selen");
});

export default { completar };
