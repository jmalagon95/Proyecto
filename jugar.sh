#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/KamiNoChallenge"

sync_game() {
  git fetch origin main --quiet
  git reset --hard origin/main >/dev/null
}

echo "🔄 Sincronizando Kami No Challenge..."
sync_game

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vite ]; then
  echo "📦 Instalando dependencias..."
  npm install --no-audit --no-fund
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
      git reset --hard origin/main >/dev/null
      npm install --no-audit --no-fund --silent
      LAST_COMMIT="$(git rev-parse HEAD)"
      echo "✅ Actualizado. Vite recargará el juego."
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
echo "Chrome: http://127.0.0.1:5173"
echo "Actualizaciones automáticas: cada 15 segundos."

npm run dev -- --host 0.0.0.0
