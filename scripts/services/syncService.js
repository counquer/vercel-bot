import notionService from "../../notion/notionService.js";
import cacheService from "../../cache/cacheService.js";
import logger from "../../utils/logger.js";

/**
 * Valida que la memoria tenga los campos necesarios.
 */
function esMemoriaValida(memoria) {
  return (
    memoria &&
    typeof memoria.id === "string" &&
    typeof memoria.respuesta === "string" &&
    typeof memoria.timestamp === "string"
  );
}

/**
 * Devuelve true si la memoria nueva es más reciente que la versión en caché.
 */
function debeActualizar(memoriaNueva, memoriaActual) {
  if (!memoriaActual) return true;
  return new Date(memoriaNueva.timestamp) > new Date(memoriaActual.timestamp);
}

/**
 * Sanitiza contenido de texto básico.
 */
function sanitizar(texto) {
  return texto?.trim().replace(/[^\x00-\x7F]/g, "") || "";
}

/**
 * Sincroniza memorias desde Notion hacia la caché local
 */
export async function syncMemoriasDesdeNotion() {
  logger.info("sync", "Iniciando sincronización avanzada desde Notion...");

  const resultado = {
    total: 0,
    sincronizadas: 0,
    omitidas: 0,
    invalidas: 0,
    errores: 0,
  };

  try {
    const memorias = await notionService.obtenerTodasMemoriasCuradas();
    resultado.total = memorias.length;

    for (const memoria of memorias) {
      const key = `memoria::${memoria.id}`;
      const actual = cacheService.get(key);

      if (!esMemoriaValida(memoria)) {
        logger.warn("sync", `Memoria inválida omitida (ID: ${memoria?.id})`);
        resultado.invalidas++;
        continue;
      }

      if (!debeActualizar(memoria, actual)) {
        resultado.omitidas++;
        continue;
      }

      try {
        const memoriaSanitizada = {
          ...memoria,
          respuesta: sanitizar(memoria.respuesta),
        };
        cacheService.set(key, memoriaSanitizada);
        logger.info("sync", `✔️ Memoria sincronizada: ${key}`);
        resultado.sincronizadas++;
      } catch (errInterno) {
        logger.error("sync", `❌ Error al sincronizar memoria ${key}:`, errInterno.message);
        resultado.errores++;
      }
    }

    logger.info(
      "sync",
      `Sincronización finalizada: ${resultado.sincronizadas} nuevas / ${resultado.omitidas} omitidas / ${resultado.invalidas} inválidas / ${resultado.errores} errores`
    );
    return resultado;
  } catch (err) {
    logger.error("sync", "🛑 Fallo general durante la sincronización:", err.message);
    throw err;
  }
}
