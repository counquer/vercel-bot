// grok/grokService.js

import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const GROK_API_KEY = process.env.GROK_API_KEY;

/**
 * Envía un prompt a la API de Grok y devuelve la respuesta generada.
 * @param {string} prompt - El texto completo a enviar a Grok.
 * @returns {Promise<string>} - La respuesta generada.
 */
export async function completar(prompt) {
  if (!GROK_API_KEY) {
    throw new Error("Falta la variable de entorno GROK_API_KEY");
  }

  const endpoint = "https://api.grok.x.ai/completions"; // Ajusta si usas proxy

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "grok-1",              // o el modelo que estés usando
      prompt: prompt,
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.text?.trim() || "(sin respuesta)";
}
