@echo off
REM Crear carpetas si no existen
if not exist "services" mkdir services
if not exist "scripts" mkdir scripts
if not exist "data" mkdir data

REM Crear data\memorias.json solo si no existe
if not exist "data\memorias.json" (
  (
    echo [
    echo   {
    echo     "respuesta": "Ejemplo de memoria curada.",
    echo     "emocionalidad": "neutro",
    echo     "timestamp": "2025-06-05T05:00:00.000Z"
    echo   }
    echo ]
  ) > data\memorias.json
  echo data\memorias.json creado.
) else (
  echo data\memorias.json ya existe, omitiendo.
)

REM Crear services\syncService.js solo si no existe
if not exist "services\syncService.js" (
  (
    echo import fs from "fs/promises";
    echo import path from "path";
    echo import { fileURLToPath } from "url";
    echo import notionService from "../notion/notionService.js";
    echo import logger from "../utils/logger.js";
    echo.
    echo const __dirname = path.dirname(fileURLToPath(import.meta.url));
    echo const DATA_DIR = path.resolve(__dirname, "../data");
    echo const MEMORIAS_PATH = path.join(DATA_DIR, "memorias.json");
    echo.
    echo export async function syncMemoriasWithNotion() {
    echo   logger.info("syncService", "Iniciando sincronizaci^on de memorias locales a Notion...");
    echo   let memoriasLocal;
    echo   try {
    echo     const contenido = await fs.readFile(MEMORIAS_PATH, "utf-8");
    echo     memoriasLocal = JSON.parse(contenido);
    echo     if ^(!Array.isArray(memoriasLocal)^) {
    echo       logger.error("syncService", "memorias.json no es un array v^alido.");
    echo       return;
    echo     }
    echo   } catch (e) {
    echo     logger.error("syncService", `No se pudo leer ${MEMORIAS_PATH}: ${e.message}`);
    echo     return;
    echo   }
    echo   let memoriasNotion;
    echo   try {
    echo     memoriasNotion = await notionService.obtenerTodasMemoriasCuradas();
    echo   } catch (e) {
    echo     logger.error("syncService", "Error al obtener memorias de Notion:", e.message);
    echo     return;
    echo   }
    echo   const clavesNotion = new Set((memoriasNotion || []).map(m => `${m.respuesta}|${m.timestamp}`));
    echo   let nuevas = 0;
    echo   for (const memoria of memoriasLocal) {
    echo     const clave = `${memoria.respuesta}|${memoria.timestamp}`;
    echo     if ^(!clavesNotion.has(clave)^) {
    echo       try {
    echo         await notionService.guardarMemoriaCurada(memoria);
    echo         clavesNotion.add(clave);
    echo         nuevas++;
    echo         logger.info("syncService", `Memoria subida a Notion: ${clave}`);
    echo       } catch (e) {
    echo         logger.error("syncService", "Error al subir memoria:", e.message);
    echo       }
    echo     }
    echo   }
    echo   logger.info("syncService", `Sincronizaci^on completada. Memor^ias nuevas subidas: ${nuevas}`);
    echo }
    echo.
    echo if (import.meta.url === `file://${process.argv[1]}`) {
    echo   syncMemoriasWithNotion();
    echo }
  ) > services\syncService.js
  echo services\syncService.js creado.
) else (
  echo services\syncService.js ya existe, omitiendo.
)

REM Crear services\cronSync.js solo si no existe
if not exist "services\cronSync.js" (
  (
    echo import cron from "node-cron";
    echo import { syncMemoriasWithNotion } from "./syncService.js";
    echo import logger from "../utils/logger.js";
    echo.
    echo cron.schedule("*/10 * * * *", async () ^> {
    echo   logger.info("cronSync", "Ejecutando sincronizaci^on programada...");
    echo   await syncMemoriasWithNotion();
    echo });
    echo.
    echo logger.info("cronSync", "Sincronizaci^on autom^atica inicializada (cada 10 minutos).");
  ) > services\cronSync.js
  echo services\cronSync.js creado.
) else (
  echo services\cronSync.js ya existe, omitiendo.
)

echo.
echo Todo listo. Puedes ejecutar la sincronizaci^on manual con:
echo node services\syncService.js
echo O dejar la sincronizaci^on automatica con:
echo node services\cronSync.js
pause