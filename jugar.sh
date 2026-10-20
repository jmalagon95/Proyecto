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
  bash scripts/sync-safe.sh
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
