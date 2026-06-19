#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node &>/dev/null; then
    echo "[ERROR] Node.js が見つかりません。https://nodejs.org からインストールしてください。"
    exit 1
fi

if [ ! -d node_modules ]; then
    echo "[SETUP] 初回セットアップ中..."
    npm install
fi

echo ""
echo "  ⚡ Undebrid 起動中..."
echo ""

open_browser() {
    sleep 3
    if command -v xdg-open &>/dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &>/dev/null; then
        open http://localhost:3000
    fi
}
open_browser &

npm run dev
