@echo off
setlocal

:: Crear carpetas
mkdir scripts
mkdir services

:: Crear archivo ensureNotionProperties.js
echo const { Client } = require("@notionhq/client");> scripts\ensureNotionProperties.js
echo.>> scripts\ensureNotionProperties.js
echo const notion = new Client({ auth: process.env.NOTION_TOKEN });>> scripts\ensureNotionProperties.js
echo const databaseId = process.env.DB_MEMORIA_CURADA;>> scripts\ensureNotionProperties.js
echo.>> scripts\ensureNotionProperties.js
echo async function ensureProperties() {>> scripts\ensureNotionProperties.js
echo   const db = await notion.databases.retrieve({ database_id: databaseId });>> scripts\ensureNotionProperties.js
echo   console.log("Propiedades actuales:", Object.keys(db.properties));>> scripts\ensureNotionProperties.js
echo   // Aquí puedes agregar lógica para agregar propiedades si faltan.>> scripts\ensureNotionProperties.js
echo }>> scripts\ensureNotionProperties.js
echo.>> scripts\ensureNotionProperties.js
echo ensureProperties();>> scripts\ensureNotionProperties.js

:: Crear archivo notion.js
echo const { Client } = require("@notionhq/client");> services\notion.js
echo.>> services\notion.js
echo const notion = new Client({ auth: process.env.NOTION_TOKEN });>> services\notion.js
echo const databaseId = process.env.DB_MEMORIA_CURADA;>> services\notion.js
echo.>> services\notion.js
echo async function guardarMemoria({ clave, seccion, contenido, prioridad, estado, etiquetas, emocionalidad }) {>> services\notion.js
echo   await notion.pages.create({>> services\notion.js
echo     parent: { database_id: databaseId },>> services\notion.js
echo     properties: {>> services\notion.js
echo       Clave: { title: [{ text: { content: clave } }] },>> services\notion.js
echo       Seccion: { rich_text: [{ text: { content: seccion } }] },>> services\notion.js
echo       Contenido: { rich_text: [{ text: { content: contenido } }] },>> services\notion.js
echo       Prioridad: { select: { name: prioridad } },>> services\notion.js
echo       Estado: { select: { name: estado } },>> services\notion.js
echo       Etiquetas: { multi_select: etiquetas.map(et => ({ name: et })) },>> services\notion.js
echo       Emocionalidad: { select: { name: emocionalidad || "neutro" } },>> services\notion.js
echo       Timestamp: { date: { start: new Date().toISOString() } }>> services\notion.js
echo     }>> services\notion.js
echo   });>> services\notion.js
echo }>> services\notion.js
echo.>> services\notion.js
echo module.exports = { guardarMemoria };>> services\notion.js

echo Archivos creados exitosamente.

endlocal
pause
