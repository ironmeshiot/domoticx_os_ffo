
@echo off
cd src\frontend
echo Compilando frontend...
npm run build
if %errorlevel% neq 0 (
	echo Error al compilar el frontend. Presiona una tecla para salir.
	pause
	exit /b %errorlevel%
)
cd ../..
echo Iniciando backend...
npm start
echo Si ves este mensaje, el backend terminó o falló. Presiona una tecla para salir.
pause
