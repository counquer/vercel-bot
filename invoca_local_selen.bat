@echo off@echo off
setlocal

:: Cambiar a la carpeta donde está selen.js
cd /d C:\openpose\selen-api\api

:: Solicitar trigger
echo Escribe el trigger a invocar (ej: cochinavenami):
set /p TRIGGER=

:: Ejecutar el archivo Node.js con las variables de entorno cargadas
echo Ejecutando selen.js localmente con trigger: %TRIGGER%
node selen.js --trigger=%TRIGGER%

pause
