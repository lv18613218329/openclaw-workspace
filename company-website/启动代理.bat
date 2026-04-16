@echo off
title Coze Proxy Service
echo ========================================
echo   Coze Proxy Service Starting...
echo ========================================
echo.
echo Keep this window open while using the plugin
echo Service: http://localhost:8888
echo.
echo If plugin doesn't work, make sure this window is open
echo.

cd /d "%~dp0"

if not exist node.exe (
    echo [ERROR] node.exe not found
    pause
    exit /b 1
)

node.exe server.js

pause