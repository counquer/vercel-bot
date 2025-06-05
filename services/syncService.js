console.log("INICIO DE SYNC SERVICE.JS");
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import notionService from "../notion/notionService.js";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const MEMORIAS_PATH = path.join(DATA_DIR, "memorias.json");

export async function syncMemoriasWithNotion() {
  console.log("✅ Selen está corriendo en modo local...");
  logger.info("syncService", "Iniciando sincronización de memorias locales a Notion...");

  let memoriasLocal;
  try {
    logger.info("syncService", `Leyendo archivo: ${MEMORIAS_PATH}`);
    console.log(`[syncService] Leyendo archivo: ${MEMORIAS_PATH}`);
    const contenido = await fs.readFile(MEMORIAS_PATH, "utf-8");
    memoriasLocal = JSON.parse(contenido);
    if (!Array.isArray(memoriasLocal)) {
      logger.error("syncService", "memorias.json no es un array válido.");
      console.error("[syncService] memorias.json no es un array válido.");
      return;
    }
    logger.info("syncService", `Cantidad de memorias locales cargadas: ${memoriasLocal.length}`);
    console.log(`[syncService] Cantidad de memorias locales cargadas: ${memoriasLocal.length}`);
  } catch (e) {
    logger.error("syncService", `No se pudo leer ${MEMORIAS_PATH}: ${e.message}`);
    console.error(`[syncService] No se pudo leer ${MEMORIAS_PATH}: ${e.message}`);
    return;
  }

  let memoriasNotion;
  try {
    logger.info("syncService", "Obteniendo todas las memorias curadas de Notion...");
    console.log("[syncService] Obteniendo todas las memorias curadas de Notion...");
    memoriasNotion = await notionService.obtenerTodasMemoriasCuradas();
    logger.info("syncService", `Cantidad de memorias en Notion: ${memoriasNotion ? memoriasNotion.length : 0}`);
    console.log(`[syncService] Cantidad de memorias en Notion: ${memoriasNotion ? memoriasNotion.length : 0}`);
  } catch (e) {
    logger.error("syncService", "Error al obtener memorias de Notion: " + e.message);
    console.error("[syncService] Error al obtener memorias de Notion: " + e.message);
    return;
  }

  // Usamos 'Clave' como identificador único real, si no existe, lo marcamos.
  const clavesNotion = new Set((memoriasNotion || []).map(m => m.Clave));
  let nuevas = 0;
  for (const memoria of memoriasLocal) {
    if (!memoria.Clave) {
      logger.error("syncService", `Memoria sin 'Clave', ignorando: ${JSON.stringify(memoria)}`);
      console.error(`[syncService] Memoria sin 'Clave', ignorando: ${JSON.stringify(memoria)}`);
      continue;
    }
    if (!clavesNotion.has(memoria.Clave)) {
      try {
        await notionService.guardarMemoriaCurada(memoria);
        clavesNotion.add(memoria.Clave);
        nuevas++;
        logger.info("syncService", `Memoria subida a Notion: ${memoria.Clave}`);
        console.log(`[syncService] Memoria subida a Notion: ${memoria.Clave}`);
      } catch (e) {
        logger.error("syncService", `Error al subir memoria (${memoria.Clave}): ${e.message}`);
        console.error(`[syncService] Error al subir memoria (${memoria.Clave}): ${e.message}`);
      }
    } else {
      logger.info("syncService", `Memoria ya existe en Notion (Clave: ${memoria.Clave}), saltando...`);
      console.log(`[syncService] Memoria ya existe en Notion (Clave: ${memoria.Clave}), saltando...`);
    }
  }
  logger.info("syncService", `Sincronización completada. Memorias nuevas subidas: ${nuevas}`);
  console.log(`Sincronización completada. Memorias nuevas subidas: ${nuevas}`);
}

// Permite correr el script directamente con node services/syncService.js
if (import.meta.url === `file://${process.argv[1]}`) {
  syncMemoriasWithNotion();
}