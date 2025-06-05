@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0api"

if not exist "selen.js" (
    echo [ERROR] No se encontró selen.js en %CD%
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado o no está en el PATH.
    pause
    exit /b 1
)

echo -----------------------------------------------
echo Escribe el trigger a invocar (ej: cochinavenami)
echo -----------------------------------------------
set /p TRIGGER=Trigger: 

if "!TRIGGER!"=="" (
    echo [ERROR] Debes ingresar un trigger.
    pause
    exit /b 1
)

echo.
echo Ejecutando selen.js localmente con trigger: !TRIGGER!
echo -----------------------------------------------

node selen.js --trigger="!TRIGGER!"
set ERRLVL=%ERRORLEVEL%

echo.
if "%ERRLVL%"=="0" (
    echo [OK] Finalizado correctamente.
) else (
    echo [ERROR] El script terminó con error (código %ERRLVL%).
)
pause
endlocal