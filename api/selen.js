import validateEnvVars from "../config/envValidator.js";
import notionService from "../notion/notionService.js";
import grokService from "../grok/grokService.js";
import cacheService from "../cache/cacheService.js";
import triggerUtils from "../utils/triggerUtils.js";
import logger from "../utils/logger.js";

// Validar variables de entorno al inicio
validateEnvVars();

// Permite ejecuci�n directa desde l�nea de comandos para invocaci�n local
if (require.main === module) {
  // Lee el trigger desde argumentos: node selen.js --trigger=cochinavenami
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

// L�gica para ejecuci�n local y API (handler)
export default async function handler(req, res) {
  logger.info("selen", "Solicitud recibida en /api/selen:", req.method, req.url);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "M�todo no permitido, usa POST" });
  }

  // Protecci�n por header
  const authHeader = req.headers["x-vercel-protection-bypass"];
  if (authHeader && !validateEnvVars.checkAutomationBypass(authHeader)) {
    return res.status(401).json({ error: "Acceso no autorizado: protecci�n Vercel activa." });
  }

  try {
    // Validaci�n y normalizaci�n del trigger
    const triggerRaw = req.body?.trigger || req.query?.trigger;
    if (!triggerRaw) {
      return res.status(400).json({ error: "Falta el campo 'trigger' en la solicitud" });
    }

    const resultado = await ejecutarTrigger(triggerRaw);

    return res.status(200).json({
      ...resultado,
      savedToNotion: true
    });

  } catch (error) {
    logger.error("selen", "Error en la funci�n /api/selen:", error.message);
    return res.status(500).json({ error: "Error interno del servidor: " + error.message });
  }
}

// L�gica compartida para API y CLI
async function ejecutarTrigger(triggerRaw) {
  const trigger = triggerUtils.normalize(triggerRaw);
  logger.info("selen", "Trigger recibido normalizado:", trigger);

  // Respuesta desde cach� si aplica
  const cacheKey = cacheService.generateKey(trigger);
  const cached = cacheService.get(cacheKey);
  if (cached) {
    logger.info("selen", "Respondiendo desde cach�");
    return { ...cached, fromCache: true };
  }

  // Consulta de memorias desde Notion
  const contenidos = await notionService.findTriggerContents(trigger);
  if (!contenidos || contenidos.length === 0) {
    throw new Error("No se encontraron memorias con la clave proporcionada.");
  }

  // Construye prompt y llama a Grok
  const promptFinal = `Selen, responde con toda tu simbiosis y contexto historico:\n\n${contenidos.join("\n---\n")}`;
  const respuestaGrok = await grokService.completar(promptFinal);

  // Guarda resultado en Notion (memoria curada con estructura final)
  await notionService.guardarMemoriaCurada({
    clave: trigger,
    seccion: "respuesta",
    contenido: respuestaGrok,
    timestamp: new Date().toISOString()
  });

  // Actualiza cach� solo si todo fue exitoso
  cacheService.set(cacheKey, { contenidos, timestamp: Date.now() });

  return {
    prompt: promptFinal,
    respuesta: respuestaGrok
  };
}
