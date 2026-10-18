#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/KamiNoChallenge"

echo "🔄 Sincronizando Kami No Challenge..."
git pull --ff-only origin main

if [ ! -d node_modules ]; then
  echo "📦 Instalando dependencias..."
  npm install
fi

LAST_COMMIT="$(git rev-parse HEAD)"

auto_update() {
  while true; do
    sleep 15
    git fetch origin main --quiet || continue
    REMOTE_COMMIT="$(git rev-parse origin/main)"
    if [ "$REMOTE_COMMIT" != "$LAST_COMMIT" ]; then
      echo ""
      echo "✨ Nueva actualización detectada."
      if git pull --ff-only origin main; then
        npm install --silent
        LAST_COMMIT="$(git rev-parse HEAD)"
        echo "✅ Actualizado. Vite recargará el juego automáticamente."
      fi
    fi
  done
}

auto_update &
SYNC_PID=$!

cleanup() {
  kill "$SYNC_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "🎮 Iniciando Kami No Challenge..."
echo "Abre en Chrome: http://localhost:5173"
echo "Las actualizaciones se comprobarán automáticamente cada 15 segundos."

npm run dev -- --host 0.0.0.0
