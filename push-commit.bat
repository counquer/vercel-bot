@echo off
setlocal

:: Ir a la carpeta donde está el script
cd /d %~dp0

:: Preguntar por mensaje de commit
set /p msg=Mensaje del commit (ej. feat: mejora Notion logger): 

:: Ejecutar comandos Git
echo.
echo Añadiendo archivos...
git add .

echo.
echo Haciendo commit...
git commit -m "%msg%"

echo.
echo Haciendo push a main...
git push origin main

echo.
echo ✅ Push completo. Presiona una tecla para salir.
pause >nul
