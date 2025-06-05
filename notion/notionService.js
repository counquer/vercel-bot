import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.DB_MEMORIA_CURADA;

// Guarda una memoria curada en la base de Notion
export async function guardarMemoriaCurada(memoria) {
  return notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Respuesta: { title: [{ text: { content: memoria.respuesta } }] },
      Emocionalidad: { rich_text: [{ text: { content: memoria.emocionalidad || "" } }] },
      Timestamp: { date: { start: memoria.timestamp || new Date().toISOString() } }
    }
  });
}

// Obtiene todas las memorias curadas (hasta 100, puedes paginar si necesitas más)
export async function obtenerTodasMemoriasCuradas() {
  const pages = [];
  let cursor = undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100
    });
    for (const page of response.results) {
      pages.push({
        respuesta: page.properties.Respuesta?.title?.[0]?.plain_text || "",
        emocionalidad: page.properties.Emocionalidad?.rich_text?.[0]?.plain_text || "",
        timestamp: page.properties.Timestamp?.date?.start || ""
      });
    }
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages;
}