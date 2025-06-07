import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.DB_MEMORIA_CURADA;

/**
 * Limpia texto: remueve caracteres invisibles y codifica como UTF-8 seguro.
 */
function sanitizarYCodificar(texto) {
  if (typeof texto !== "string") return "";
  const limpio = texto.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  return unescape(encodeURIComponent(limpio));
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
      parent: { database_id: DATABASE_ID },
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
  guardarMemoriaCurada
};
