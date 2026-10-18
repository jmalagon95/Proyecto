#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/KamiNoChallenge"

echo "🔄 Actualizando Kami No Challenge..."
git fetch origin main --quiet
git reset --hard origin/main

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vite ]; then
  npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund --silent
fi

echo "✅ Juego actualizado."
