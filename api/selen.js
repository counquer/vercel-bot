const { Client } = require('@notionhq/client');
const axios = require('axios');

const cache = new Map();

module.exports = async (req, res) => {
  console.log("Endpoint /api/selen alcanzado");
  try {
    const cacheKey = 'cochina ven a mi';
    if (cache.has(cacheKey) && req.method !== 'POST') {
      const { contenido, timestamp } = cache.get(cacheKey);
      if (Date.now() - timestamp < 60000) {
        return res.status(200).json({ memoria: contenido, fromCache: true });
      }
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const databaseId = process.env.DB_TRIGGERS;

    console.log("Consultando base de datos Triggers con ID:", databaseId); // Log adicional para depurar

    let contenido;
    if (req.method === 'POST') {
      const { properties } = req.body;
      if (properties.Clave?.rich_text[0]?.text.content !== 'cochina ven a mi') {
        return res.status(200).json({ message: 'No action needed' });
      }
      contenido = properties.Contenido.rich_text[0]?.text.content;
    } else {
      const query = await notion.databases.query({
        database_id: databaseId,
        filter: {
          and: [
            {
              property: 'Clave',
              rich_text: { equals: 'cochina ven a mi' }
            },
            {
              property: 'seccion',
              rich_text: { equals: 'Trigger' }
            }
          ]
        }
      });
      console.log('Resultados de Notion:', JSON.stringify(query.results, null, 2));
      contenido = query.results[0]?.properties.Contenido.rich_text[0]?.text.content;
      if (!contenido) {
        return res.status(404).json({ error: 'No se encontró "cochina ven a mi"', results: query.results });
      }
    }

    cache.set(cacheKey, { contenido, timestamp: Date.now() });

    const grokResponse = await axios.post(
      'https://api.grok.xai.com/v1/completions',
      {
        model: 'grok-beta',
        prompt: `Responde como Selen, con tono cálido y emojis 🪷🍑: ${contenido}`,
        max_tokens: 100
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({
      memoria: contenido,
      respuesta: grokResponse.data.choices[0].text,
      tokensUsed: grokResponse.data.usage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};