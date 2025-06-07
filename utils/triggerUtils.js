// utils/triggerUtils.js

/**
 * Normaliza un trigger:
 * - Elimina acentos
 * - Convierte a minúsculas
 * - Reemplaza símbolos y espacios por guiones
 * - Limpia guiones duplicados o extremos
 */
export function normalize(trigger) {
  if (!trigger || typeof trigger !== "string") return "sin-trigger";

  return trigger
    .normalize("NFD")                    // separa tildes
    .replace(/[\u0300-\u036f]/g, "")    // elimina tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "-")         // todo lo que no es letra o número => guión
    .replace(/-+/g, "-")                // múltiples guiones => uno solo
    .replace(/^-|-$/g, "");             // elimina guiones al inicio o final
}
