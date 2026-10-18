#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/KamiNoChallenge"

echo "🔄 Buscando actualizaciones de Kami No Challenge..."
git pull --ff-only origin main

if [ ! -d node_modules ]; then
  echo "📦 Instalando dependencias..."
  npm install
fi

echo "🎮 Iniciando Kami No Challenge..."
echo "Abre en Chrome: http://localhost:5173"
npm run dev -- --host 0.0.0.0
