#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="$HOME/KamiNoChallenge"
if [ ! -d "$ROOT/.git" ]; then
  echo "❌ No existe $ROOT como repositorio Git. Sigue las instrucciones de README_TERMUX.txt."
  exit 1
fi
cd "$ROOT"

for command_name in git node npm; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "❌ Falta $command_name. Instala Git y Node.js con: pkg install git nodejs"
    exit 1
  fi
done

case "$(git remote get-url origin 2>/dev/null || true)" in
  *jmalagon95/Proyecto*) ;;
  *) echo "❌ El remoto origin no corresponde a jmalagon95/Proyecto."; exit 1 ;;
esac

sync_game() {
  if ! git fetch origin main --quiet; then return 1; fi
  local old_head new_head old_lock new_lock
  old_head="$(git rev-parse HEAD)"
  new_head="$(git rev-parse origin/main)"
  [ "$old_head" = "$new_head" ] && return 0

  old_lock="$(git rev-parse HEAD:package-lock.json 2>/dev/null || true)"
  git reset --hard origin/main >/dev/null || return 1
  new_lock="$(git rev-parse HEAD:package-lock.json 2>/dev/null || true)"

  if [ ! -x node_modules/.bin/vite ] || [ "$old_lock" != "$new_lock" ]; then
    echo "📦 Actualizando dependencias..."
    npm install --no-audit --no-fund || return 1
  fi
  npm run check:master --silent || return 1
  touch index.html
  echo "✅ Nueva versión sincronizada: $(git rev-parse --short HEAD)"
}

echo "🔄 Comprobando GitHub (rama main)..."
sync_game || { echo "❌ No se pudo sincronizar el juego."; exit 1; }

if [ ! -x node_modules/.bin/vite ]; then
  echo "📦 Instalando dependencias por primera vez..."
  npm install --no-audit --no-fund
fi
npm run check:master --silent

watch_updates() {
  while sleep 15; do
    if ! sync_game; then
      echo "⚠️ No se ha podido comprobar la actualización; se reintentará."
    fi
  done
}

watch_updates &
UPDATER_PID=$!
trap 'kill "$UPDATER_PID" 2>/dev/null || true' EXIT

echo "🎮 Kami No Challenge: http://127.0.0.1:5173"
echo "🔁 Sincronización GitHub cada 15 segundos mientras Termux esté abierto."
npm run dev -- --host 0.0.0.0
