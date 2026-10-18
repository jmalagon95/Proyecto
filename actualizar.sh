#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/KamiNoChallenge"

echo "🔄 Actualizando Kami No Challenge..."
git pull --ff-only origin main

if [ ! -d node_modules ]; then
  npm install
fi

echo "✅ Juego actualizado."
