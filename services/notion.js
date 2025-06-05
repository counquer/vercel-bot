const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.DB_MEMORIA_CURADA;

async function guardarMemoria({ clave, seccion, contenido, prioridad, estado, etiquetas, emocionalidad }) {
  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Clave: { title: [{ text: { content: clave } }] },
      Seccion: { rich_text: [{ text: { content: seccion } }] },
      Contenido: { rich_text: [{ text: { content: contenido } }] },
      Prioridad: { select: { name: prioridad } },
      Estado: { select: { name: estado } },
      Etiquetas: { multi_select: etiquetas.map(et = name: et })) },
      Timestamp: { date: { start: new Date().toISOString() } }
    }
  });
}

module.exports = { guardarMemoria };
