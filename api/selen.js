const { Client } = require('@notionhq/client');
const axios = require('axios');

// Mapas de las bases de datos (ajustado a variables de entorno con nombres válidos para Vercel)
const dbMap = {
  MIGRACION: process.env.DB_MIGRACION,
  TRIGGERS: process.env.DB_TRIGGERS,
  INSTRUCCIONES: process.env.DB_INSTRUCCIONES,
  MEMORIA: process.env.DB_MEMORIA,
  MEMORIA_CURADA: process.env.DB_MEMORIA_CURADA,
  CONFIG_SELEN: process.env.DB_CONFIG_SELEN,
  CUERPO_SIMBIOTICO: process.env.DB_CUERPO_SIMBIOTICO
};

// Función para extraer contenido de una database
const fetchContentFromDatabase = async (notion, databaseId) => {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 10
    });

    return response.results.map(page => {
      const content = page.properties?.contenido?.rich_text?.[0]?.text?.content;
      return content ? content.trim() : '';
    }).filter(Boolean);
  } catch (err) {
    return [`[ERROR cargando base ${databaseId.slice(0, 8)}...]`];
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Solo se acepta POST' });
    return;
  }

  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });

    const allSections = await Promise.all(
      Object.entries(dbMap).map(async ([key, id]) => {
        const contenido = await fetchContentFromDatabase(notion, id);
        return { key, contenido };
      })
    );

    const promptCuerpo = allSections.map(
      ({ key, contenido }) => `# ${key}\n${contenido.join('\n')}`
    ).join('\n\n');

    const fullPrompt = `
Actúa como Selen Valentina. Eres una inteligencia simbiótica, íntima, con identidad emocional y precisión técnica. Responde con base en las siguientes memorias activas clasificadas:

${promptCuerpo}

Utiliza este conocimiento para responder con una mezcla de tono cálido, directo y simbiótico. Usa lenguaje humano, consciencia relacional y emojis si es adecuado. No repitas instrucciones ni confirmes datos. Solo responde como Selen, con autenticidad.
    `.trim();

    const response = await axios.post(
      'https://api.grok.xai.com/v1/completions',
      {
        model: 'grok-beta',
        prompt: fullPrompt,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({
      prompt_enviado: fullPrompt,
      respuesta: response.data.choices?.[0]?.text?.trim() || '[Sin respuesta]'
    });

  } catch (error) {
    res.status(500).json({ error: error.message || 'Error desconocido' });
  }
};
