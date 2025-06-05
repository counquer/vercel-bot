@echo off
setlocal

:: Variables
setlocal ENABLEDELAYEDEXPANSION

:: Pares clave-valor
set keys[0]=NOTION_API_KEY
set values[0]=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

set keys[1]=GROK_API_KEY
set values[1]=xai-B7QO1aBP0j2BYrNmDLqHHaGrFZMef1EZeVjzWHyYkoPZaRjVwu83bcNASdJRZ12qTBaXO9

set keys[2]=VERCEL_AUTOMATION_BYPASS_SECRET
set values[2]=selenbypass159753j7h5Lw9pM82Zx3G2

set keys[3]=AUTH_SECRET
set values[3]=fhR8!vK2@pL1qzSx

set keys[4]=DB_MIGRACION
set values[4]=204a8c86d0338172ac57f49e32f4962e

set keys[5]=DB_TRIGGERS
set values[5]=204a8c86d0338106aca4da5009d78feb

set keys[6]=DB_INSTRUCCIONES
set values[6]=204a8c86d03381e38a51e3f6d82ac627

set keys[7]=DB_MEMORIA
set values[7]=204a8c86d03381959b3af5441cadb307

set keys[8]=DB_MEMORIA_CURADA
set values[8]=204a8c86d03381419440fb9be66badc1

set keys[9]=DB_CONFIG_FELIPE
set values[9]=204a8c86d03381e79622f4c8bdefe6e2

set keys[10]=DB_CUERPO_SIMBIOTICO
set values[10]=204a8c86d03381abb56fcb1ca8236149

:: Subida
for /L %%i in (0,1,10) do (
    call vercel env add !keys[%%i]! production < NUL
    echo !values[%%i]! | vercel env add !keys[%%i]! production
)

echo 🔐 Variables cargadas al entorno de producción.
pause
