@echo off
REM Script para crear carpetas y archivos base para selen-api

REM Crear carpetas necesarias
mkdir cache
mkdir grok
mkdir config

REM Crear archivos base vacíos con contenido ESM mínimo
REM cache/cacheService.js
echo // Servicio de cache básico (ESM) > cache\cacheService.js
echo export default {^>^>^>^> get: (key) => null,^>^>^>^> set: (key, value) => {},^>^>^>^> clear: () => {} ^>^>^>^>}; >> cache\cacheService.js

REM grok/grokService.js
echo // Servicio grok básico (ESM) > grok\grokService.js
echo export default {^>^>^>^> analyze: (input) => ({ result: "ok", input }) ^>^>^>^>}; >> grok\grokService.js

REM config/envValidator.js
echo // Validador de variables de entorno (ESM) > config\envValidator.js
echo export function validateEnv(requiredVars = []) { >> config\envValidator.js
echo.    for (const v of requiredVars) { >> config\envValidator.js
echo.        if (!process.env[v]) throw new Error(`Falta variable de entorno: ${v}`); >> config\envValidator.js
echo.    } >> config\envValidator.js
echo.    return true; >> config\envValidator.js
echo } >> config\envValidator.js

echo --------------------------------------
echo Estructura base creada correctamente.
echo --------------------------------------
pause