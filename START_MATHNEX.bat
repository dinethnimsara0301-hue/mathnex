@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MATHNEX - Start

echo ========================================
echo          MATHNEX - PC STARTER
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js LTS first.
  echo https://nodejs.org/en/download
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Restart Windows after installing Node.js.
  pause
  exit /b 1
)
if not exist "package.json" (
  echo ERROR: package.json is not in this folder.
  echo Please extract this ZIP and run this file from the extracted folder.
  pause
  exit /b 1
)
echo [1/2] Installing required packages. This may take several minutes...
echo Please keep this window open.
echo.
npm install --legacy-peer-deps
if errorlevel 1 (
  echo.
  echo Package installation failed. Check your internet connection and send a screenshot of this window.
  pause
  exit /b 1
)
echo.
echo [2/2] Starting MATHNEX...
echo The browser will open at http://localhost:4173/
echo Keep this black window open while using MATHNEX.
echo To stop MATHNEX, press CTRL+C in this window.
start "" "http://localhost:4173/"
npm run dev
pause
