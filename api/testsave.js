// api/testsave.js

import notionService from "../notion/notionService.js";
import logger from "../utils/logger.js";

export default async function handler(req, res) {
  try {
    const testMemoria = {
      clave: "test-save-endpoint",
      seccion: "debug",
      contenido: "Esta es una prueba directa desde el endpoint /api/testsave.",
      emocionalidad: "neutral",
      enlace: "https://chat.openai.com/",
    };

    const response = await notionService.guardarMemoriaCurada(testMemoria);
    logger.info("testsave", `Memoria de prueba guardada con ID: ${response.id}`);
    res.status(200).json({ ok: true, id: response.id });
  } catch (error) {
    logger.error("testsave", `Error al guardar memoria de prueba: ${error.message}`);
    res.status(500).json({ error: "Error al guardar memoria de prueba." });
  }
}
