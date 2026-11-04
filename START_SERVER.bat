@echo off
title Noise Store & 3D Watch Teardown Server
echo ======================================================
echo   NOISE STORE - 3D WATCH TEARDOWN LOCAL SERVER
echo ======================================================
echo.
echo Opening http://localhost:3001 in your default browser...
start "" "http://localhost:3001"
node "%~dp0server.js"
pause
