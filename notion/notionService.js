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
}

async function guardarMemoriaCurada(memoria) {
  return await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      Respuesta: {
        rich_text: [{ text: { content: memoria.respuesta } }],
      },
      Timestamp: {
        date: { start: memoria.timestamp },
      },
    },
  });
}

export default {
  obtenerTodasMemoriasCuradas,
  guardarMemoriaCurada,
};