const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.DB_MEMORIA_CURADA;

async function ensureProperties() {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  console.log("Propiedades actuales:", Object.keys(db.properties));
  // Aquí puedes agregar lógica para agregar propiedades si faltan.
}

ensureProperties();
