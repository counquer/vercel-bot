// config/envValidator.js

import dotenv from "dotenv";
dotenv.config();

/**
 * Valida que todas las variables de entorno requeridas estén presentes.
 * Si falta alguna, se detiene la ejecución con un error claro.
 */
export default function validateEnvVars() {
  const requiredVars = [
    "NOTION_API_KEY",
    "GROK_API_KEY",
    "VERCEL_AUTOMATION_BYPASS_SECRET"
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error("❌ Faltan variables de entorno:", missing.join(", "));
    process.exit(1);
  }
}

/**
 * Verifica si el header recibido coincide con el secreto de Vercel
 * para permitir automatizaciones autenticadas.
 * @param {string} headerValue
 * @returns {boolean}
 */
export function checkAutomationBypass(headerValue) {
  return headerValue === process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

/**
 * Helpers para detección de entorno centralizado
 */
export const isLocal = process.env.VERCEL !== "1";
export const isVercel = process.env.VERCEL === "1";
