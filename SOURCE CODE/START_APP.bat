@echo off
cd /d "%~dp0"
title Potato Stock & Cold Storage Management Server
echo ========================================================
echo Starting Potato Stock ^& Cold Storage Management Server...
echo ========================================================
echo Open in browser: http://localhost:3000
echo.
node server.js
pause
