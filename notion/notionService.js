// notion/notionService.js

import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_MEMORIA_CURADA = process.env.DB_MEMORIA_CURADA;
const DB_TRIGGERS = process.env.DB_TRIGGERS;

/**
 * Limpia texto: remueve caracteres invisibles y codifica como UTF-8 seguro.
 */
function sanitizarYCodificar(texto) {
  if (typeof texto !== "string") return "";
  const limpio = texto.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  return unescape(encodeURIComponent(limpio));
}

/**
 * Busca memorias por clave en la base DB_TRIGGERS (no en la curada).
 */
async function findTriggerContents(clave) {
  try {
    const response = await notion.databases.query({
      database_id: DB_TRIGGERS,
      filter: {
        property: "Clave",
        title: {
          equals: clave,
        },
      },
    });

    const contenidos = response.results.map((page) => {
      const contenido = page.properties?.Contenido?.rich_text?.[0]?.text?.content || "";
      return contenido;
    }).filter(Boolean);

    logger.info("notion", `Se encontraron ${contenidos.length} memorias para clave '${clave}'`);
    return contenidos;
  } catch (error) {
    logger.error("notion", "Error al consultar Notion:", error.message);
    throw error;
  }
}

/**
 * Guarda una memoria curada en Notion con clave, sección, contenido, emocionalidad, timestamp y enlace contextual.
 */
async function guardarMemoriaCurada(memoria) {
  try {
    const clave = memoria.clave?.trim() || "sin-clave";
    const seccion = memoria.seccion?.trim() || "general";
    const contenido = sanitizarYCodificar(memoria.contenido || "");
    const timestamp = memoria.timestamp || new Date().toISOString();
    const emocionalidad = memoria.emocionalidad || "neutro";
    const enlace = memoria.enlace || null;

    const propiedades = {
      Clave: {
        title: [{ text: { content: clave } }],
      },
      Sección: {
        select: { name: seccion },
      },
      Contenido: {
        rich_text: [{ text: { content: contenido } }],
      },
      Timestamp: {
        date: { start: timestamp },
      },
      Emocionalidad: {
        rich_text: [{ text: { content: emocionalidad } }],
      },
    };

    if (enlace) {
      propiedades.Enlace = { url: enlace };
    }

    const response = await notion.pages.create({
      parent: { database_id: DB_MEMORIA_CURADA },
      properties: propiedades,
    });

    if (!response || !response.id) {
      logger.error("notion", "Respuesta inválida al guardar en Notion.");
      throw new Error("No se pudo guardar la memoria.");
    }

    logger.info("notion", "Memoria curada guardada correctamente:", response.id);
    return response;
  } catch (err) {
    logger.error("notion", "Error al guardar memoria curada:", err.message);
    throw err;
  }
}

export default {
  guardarMemoriaCurada,
  findTriggerContents,
};
