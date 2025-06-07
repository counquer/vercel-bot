// notionService.js
import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.DB_MEMORIA_CURADA;

function pageToMemoria(page) {
  return {
    id: page.id,
    respuesta: page.properties.Respuesta?.rich_text?.[0]?.plain_text || "",
    timestamp: page.properties.Timestamp?.date?.start || "",
  };
}

async function obtenerTodasMemoriasCuradas() {
  let results = [];
  let cursor = undefined;

  try {
    do {
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        start_cursor: cursor,
        page_size: 100,
      });
      results = results.concat(response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return results.map(pageToMemoria);
  } catch (error) {
    console.error("❌ Error consultando Notion:", error.message);
    return [];
  }
}

async function guardarMemoriaCurada(memoria) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        Respuesta: {
          rich_text: [{ text: { content: memoria.respuesta || "Sin respuesta" } }],
        },
        Timestamp: {
          date: { start: memoria.timestamp || new Date().toISOString() },
        },
        // Se pueden agregar campos extra aquí si los tienes en la DB de Notion
        // Emocionalidad, Trigger, Categoría, etc.
      },
    });

    if (!response || response.object !== "page") {
      throw new Error("Notion no devolvió una página válida");
    }

    return response;
  } catch (error) {
    console.error("❌ Error guardando en Notion:", error.message);
    throw error;
  }
}

export default {
  obtenerTodasMemoriasCuradas,
  guardarMemoriaCurada,
};
