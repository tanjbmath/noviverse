@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo NoviVerse needs Node.js 22.12 or newer. Install Node.js LTS from https://nodejs.org and try again.
  pause
  exit /b 1
)
if exist "dist\index.html" goto play
echo Preparing NoviVerse for the first time. This downloads the project dependencies and builds the game.
call npm ci
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
:play
node "%~dp0public\launch.mjs" --root "%~dp0dist"
if errorlevel 1 goto failed
exit /b 0
:failed
echo NoviVerse could not start. Please keep the message above when asking for help.
pause
exit /b 1
