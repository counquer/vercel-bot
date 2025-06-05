import validateEnvVars from "./config/envValidator.js";
import notionService from "./notion/notionService.js";
import grokService from "./grok/grokService.js";
import cacheService from "./cache/cacheService.js";
import triggerUtils from "./utils/triggerUtils.js";
import logger from "../utils/logger.js";

validateEnvVars();

export default async function handler(req, res) {
  logger.info("selen", "Solicitud recibida en /api/selen:", req.method, req.url);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido, usa POST" });
  }

  // Protección por header
  const authHeader = req.headers["x-vercel-protection-bypass"];
  if (authHeader && !validateEnvVars.checkAutomationBypass(authHeader)) {
    return res.status(401).json({ error: "Acceso no autorizado: protección Vercel activa." });
  }

  try {
    // Validación y normalización del trigger
    const triggerRaw = req.body?.trigger || req.query?.trigger;
    if (!triggerRaw) {
      return res.status(400).json({ error: "Falta el campo 'trigger' en la solicitud" });
    }
    const trigger = triggerUtils.normalize(triggerRaw);
    logger.info("selen", "Trigger recibido normalizado:", trigger);

    // Respuesta desde caché si aplica
    const cacheKey = cacheService.generateKey(trigger);
    const cached = cacheService.get(cacheKey);
    if (cached) {
      logger.info("selen", "Respondiendo desde caché");
      return res.status(200).json({ ...cached, fromCache: true });
    }

    // Consulta de memorias desde Notion
    const contenidos = await notionService.findTriggerContents(trigger);
    if (!contenidos || contenidos.length === 0) {
      return res.status(404).json({ error: "No se encontraron memorias con la clave proporcionada." });
    }

    // Construye prompt y llama a Grok
    const promptFinal = `Selen, responde con toda tu simbiosis y contexto historico:\n\n${contenidos.join("\n---\n")}`;
    const respuestaGrok = await grokService.completar(promptFinal);

    // Guarda resultado en Notion (memoria curada)
    await notionService.guardarMemoriaCurada({
      respuesta: respuestaGrok,
      emocionalidad: "neutro",
      timestamp: new Date().toISOString(),
    });

    // Actualiza caché
    cacheService.set(cacheKey, { contenidos, timestamp: Date.now() });

    return res.status(200).json({
      prompt: promptFinal,
      respuesta: respuestaGrok,
      savedToNotion: true
    });

  } catch (error) {
    logger.error("selen", "Error en la función /api/selen:", error.message);
    return res.status(500).json({ error: "Error interno del servidor: " + error.message });
  }
}