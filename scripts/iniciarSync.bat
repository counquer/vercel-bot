@echo off
REM Crear carpetas si no existen
if not exist "services" mkdir services
if not exist "scripts" mkdir scripts
if not exist "data" mkdir data

REM Crear data\memorias.json solo si no existe
if not exist "data\memorias.json" (
  echo [^
  {^
    "respuesta": "Ejemplo de memoria curada.",^
    "emocionalidad": "neutro",^
    "timestamp": "2025-06-05T05:00:00.000Z"^
  }^
  ] > data\memorias.json
  echo data\memorias.json creado.
) else (
  echo data\memorias.json ya existe, omitiendo.
)

REM Crear services\syncService.js solo si no existe
if not exist "services\syncService.js" (
  echo import fs from "fs/promises";> services\syncService.js
  echo import path from "path";>> services\syncService.js
  echo import { fileURLToPath } from "url";>> services\syncService.js
  echo import notionService from "../notion/notionService.js";>> services\syncService.js
  echo import logger from "../utils/logger.js";>> services\syncService.js
  echo.>> services\syncService.js
  echo const __dirname = path.dirname(fileURLToPath(import.meta.url));>> services\syncService.js
  echo const DATA_DIR = path.resolve(__dirname, "../data");>> services\syncService.js
  echo const MEMORIAS_PATH = path.join(DATA_DIR, "memorias.json");>> services\syncService.js
  echo.>> services\syncService.js
  echo export async function syncMemoriasWithNotion() {>> services\syncService.js
  echo   logger.info("syncService", "Iniciando sincronizaci^on de memorias locales a Notion...");>> services\syncService.js
  echo   let memoriasLocal;>> services\syncService.js
  echo   try {>> services\syncService.js
  echo     const contenido = await fs.readFile(MEMORIAS_PATH, "utf-8");>> services\syncService.js
  echo     memoriasLocal = JSON.parse(contenido);>> services\syncService.js
  echo     if (!Array.isArray(memoriasLocal)) {>> services\syncService.js
  echo       logger.error("syncService", "memorias.json no es un array v^alido.");>> services\syncService.js
  echo       return;>> services\syncService.js
  echo     }>> services\syncService.js
  echo   } catch (e) {>> services\syncService.js
  echo     logger.error("syncService", `No se pudo leer ${MEMORIAS_PATH}: ${e.message}`);>> services\syncService.js
  echo     return;>> services\syncService.js
  echo   }>> services\syncService.js
  echo   let memoriasNotion;>> services\syncService.js
  echo   try {>> services\syncService.js
  echo     memoriasNotion = await notionService.obtenerTodasMemoriasCuradas();>> services\syncService.js
  echo   } catch (e) {>> services\syncService.js
  echo     logger.error("syncService", "Error al obtener memorias de Notion:", e.message);>> services\syncService.js
  echo     return;>> services\syncService.js
  echo   }>> services\syncService.js
  echo   const clavesNotion = new Set((memoriasNotion || []).map(m => `${m.respuesta}|${m.timestamp}`));>> services\syncService.js
  echo   let nuevas = 0;>> services\syncService.js
  echo   for (const memoria of memoriasLocal) {>> services\syncService.js
  echo     const clave = `${memoria.respuesta}|${memoria.timestamp}`;>> services\syncService.js
  echo     if (!clavesNotion.has(clave)) {>> services\syncService.js
  echo       try {>> services\syncService.js
  echo         await notionService.guardarMemoriaCurada(memoria);>> services\syncService.js
  echo         clavesNotion.add(clave);>> services\syncService.js
  echo         nuevas++;>> services\syncService.js
  echo         logger.info("syncService", `Memoria subida a Notion: ${clave}`);>> services\syncService.js
  echo       } catch (e) {>> services\syncService.js
  echo         logger.error("syncService", "Error al subir memoria:", e.message);>> services\syncService.js
  echo       }>> services\syncService.js
  echo     }>> services\syncService.js
  echo   }>> services\syncService.js
  echo   logger.info("syncService", `Sincronizaci^on completada. Memor^ias nuevas subidas: ${nuevas}`);>> services\syncService.js
  echo }>> services\syncService.js
  echo.>> services\syncService.js
  echo if (import.meta.url === `file://${process.argv[1]}`) {>> services\syncService.js
  echo   syncMemoriasWithNotion();>> services\syncService.js
  echo }>> services\syncService.js

  echo services\syncService.js creado.
) else (
  echo services\syncService.js ya existe, omitiendo.
)

REM Crear services\cronSync.js solo si no existe
if not exist "services\cronSync.js" (
  echo import cron from "node-cron";> services\cronSync.js
  echo import { syncMemoriasWithNotion } from "./syncService.js";>> services\cronSync.js
  echo import logger from "../utils/logger.js";>> services\cronSync.js
  echo.>> services\cronSync.js
  echo cron.schedule("*/10 * * * *", async () ^> {>> services\cronSync.js
  echo   logger.info("cronSync", "Ejecutando sincronizaci^on programada...");>> services\cronSync.js
  echo   await syncMemoriasWithNotion();>> services\cronSync.js
  echo });>> services\cronSync.js
  echo.>> services\cronSync.js
  echo logger.info("cronSync", "Sincronizaci^on autom^atica inicializada (cada 10 minutos).");>> services\cronSync.js
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