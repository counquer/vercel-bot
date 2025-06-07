// utils/triggerUtils.js

/**
 * Normaliza un trigger eliminando espacios, acentos y mayúsculas.
 * Esto ayuda a que la búsqueda sea consistente.
 */
export function normalize(trigger) {
  if (!trigger || typeof trigger !== "string") return "";

  return trigger
    .normalize("NFD")                    // separa acentos
    .replace(/[\u0300-\u036f]/g, "")    // elimina acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");              // reemplaza espacios por guiones
}
