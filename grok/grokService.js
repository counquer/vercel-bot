// grok/grokService.js
import fetch from "node-fetch";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

const GROK_API_KEY = process.env.GROK_API_KEY;

/**
 * Envía un prompt a la API de Grok y devuelve la respuesta generada.
 * @param {string} prompt - El texto completo a enviar a Grok.
 * @returns {Promise<string>} - La respuesta generada.
 */
async function completar(prompt) {
  if (!GROK_API_KEY) {
    throw new Error("Falta la variable de entorno GROK_API_KEY");
  }

  const endpoint = "https://api.x.ai/v1/completions"; // Ajusta si usas proxy

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "grok-3", // Cambiado a grok-3, ya que grok-1 no es válido
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

// Crear servidor HTTP
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/selen') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { trigger } = JSON.parse(body);
        const respuesta = await completar(trigger);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ respuesta }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
  }
});

server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/api/selen');
});

export default {
  completar
};