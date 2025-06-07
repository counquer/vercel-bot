// config/envValidator.js

import dotenv from "dotenv";
dotenv.config();

/**
 * Variables requeridas mínimas para la operación base
 */
const requiredVars = [
  "NOTION_API_KEY",
  "GROK_API_KEY",
  "VERCEL_AUTOMATION_BYPASS_SECRET",
  "DB_MEMORIA",
  "DB_MEMORIA_CURADA"
];

/**
 * Valida las variables críticas del sistema
 */
function validateEnvVars() {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error("❌ Faltan variables de entorno:", missing.join(", "));
    process.exit(1);
  }

  if (isLocal) {
    console.log("🧪 Ejecutando en modo LOCAL");
  } else if (isVercel) {
    console.log("🚀 Ejecutando en entorno VERCEL");
  }
}

/**
 * Validación del header de automatización (bypass Vercel)
 */
function checkAutomationBypass(headerValue) {
  return headerValue === process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

/**
 * Detección de entorno actual
 */
const isLocal = process.env.VERCEL !== "1";
const isVercel = !isLocal;

export default {
  validateEnvVars,
  checkAutomationBypass,
  isLocal,
  isVercel
};
