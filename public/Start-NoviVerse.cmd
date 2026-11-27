@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo NoviVerse needs Node.js. Install the current LTS version from https://nodejs.org and try again.
  pause
  exit /b 1
)
node "%~dp0launch.mjs"
if errorlevel 1 pause
