const { Client } = require('@notionhq/client');
const axios = require('axios');

const cache = new Map();

module.exports = async (req, res) => {
  try {
    const cacheKey = 'cochina_ven_a_mi';
    if (cache.has(cacheKey) && req.method !== 'POST') {
      const { contenido, timestamp } = cache.get(cacheKey);
      if (Date.now() - timestamp < 60000) {
        return res.status(200).json({ memoria: contenido, fromCache: true });
      }
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const databaseId = process.env.NOTION_DATABASE_ID;

    let contenido;
    if (req.method === 'POST') {
      const { properties } = req.body;
      if (properties.clave.rich_text[0]?.text.content !== 'cochina ven a mi') {
        return res.status(200).json({ message: 'No action needed' });
      }
      contenido = properties.contenido.rich_text[0]?.text.content;
    } else {
      const query = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: 'clave',
          rich_text: { equals: 'cochina ven a mi' }
        }
      });
      console.log('Resultados de Notion:', JSON.stringify(query.results, null, 2));
      contenido = query.results[0]?.properties.contenido.rich_text[0]?.text.content;
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