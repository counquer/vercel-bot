import { fileURLToPath } from 'url';
import { dirname } from 'path';

import validateEnvVars, { checkAutomationBypass } from "../config/envValidator.js";
import { normalize } from "../utils/triggerUtils.js";
import notionService from "../notion/notionService.js";
import grokService from "../grok/grokService.js";
import cacheService from "../cache/cacheService.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Validar variables de entorno al inicio
validateEnvVars();

// Ejecución directa desde CLI: node selen.js --trigger=cochinavenami
if (require.main === module) {
  const triggerArg = process.argv.find(arg => arg.startsWith('--trigger='));
  if (!triggerArg) {
    console.error("Debes especificar un trigger con --trigger=...");
    process.exit(1);
  }

  const triggerRaw = triggerArg.split("=")[1];
  ejecutarTrigger(triggerRaw)
    .then(res => {
      console.log("\n--- RESPUESTA SELEN CLI ---");
      console.log(JSON.stringify(res, null, 2));
    })
    .catch(err => {
      console.error("Error ejecutando trigger:", err.message);
      process.exit(1);
    });
}

// Handler para API POST
export default async function handler(req, res) {
  logger.info("selen", "Solicitud recibida en /api/selen:", req.method, req.url);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido, usa POST" });
  }

  const authHeader = req.headers["x-vercel-protection-bypass"];
  if (authHeader && !validateEnvVars.checkAutomationBypass(authHeader)) {
    return res.status(401).json({ error: "Acceso no autorizado: protección Vercel activa." });
  }

  try {
    const triggerRaw = req.body?.trigger || req.query?.trigger;
    if (!triggerRaw) {
      return res.status(400).json({ error: "Falta el campo 'trigger' en la solicitud" });
    }

    const resultado = await ejecutarTrigger(triggerRaw);
    return res.status(200).json({ ...resultado, savedToNotion: true });

  } catch (error) {
    logger.error("selen", "Error en la función /api/selen:", error.message);
    return res.status(500).json({ error: "Error interno del servidor: " + error.message });
  }
}

// Lógica compartida API / CLI
async function ejecutarTrigger(triggerRaw) {
  const trigger = normalize(triggerRaw);
  logger.info("selen", "Trigger recibido normalizado:", trigger);

  const cacheKey = cacheService.generateKey(trigger);
  const cached = cacheService.get(cacheKey);
  if (cached) {
    logger.info("selen", "Respondiendo desde caché");
    return { ...cached, fromCache: true };
  }

  const contenidos = await notionService.findTriggerContents(trigger);
  if (!contenidos || contenidos.length === 0) {
    throw new Error("No se encontraron memorias con la clave proporcionada.");
  }

  const promptFinal = `Selen, responde con toda tu simbiosis y contexto historico:\n\n${contenidos.join("\n---\n")}`;
  const respuestaGrok = await grokService.completar(promptFinal);

  await notionService.guardarMemoriaCurada({
    clave: trigger,
    seccion: "general",
    contenido: respuestaGrok,
    timestamp: new Date().toISOString(),
  });

  cacheService.set(cacheKey, { contenidos, timestamp: Date.now() });

  return {
    prompt: promptFinal,
    respuesta: respuestaGrok
  };
}
