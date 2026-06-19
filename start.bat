@echo off
title Undebrid
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js が見つかりません。https://nodejs.org からインストールしてください。
    pause
    exit /b 1
)

if not exist node_modules (
    echo [SETUP] 初回セットアップ中...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install に失敗しました。
        pause
        exit /b 1
    )
)

echo.
echo   ⚡ Undebrid 起動中...
echo.

start "" http://localhost:3000
npm run dev
