#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="$HOME/KamiNoChallenge"
if [ ! -d "$ROOT/.git" ]; then
  echo "❌ No existe el repositorio $ROOT."
  exit 1
fi
cd "$ROOT"
case "$(git remote get-url origin 2>/dev/null || true)" in
  *jmalagon95/Proyecto*) ;;
  *) echo "❌ origin no apunta al repositorio correcto."; exit 1 ;;
esac

echo "🔄 Actualizando Kami No Challenge desde GitHub main..."
old_lock="$(git rev-parse HEAD:package-lock.json 2>/dev/null || true)"
git fetch origin main --quiet
git reset --hard origin/main
new_lock="$(git rev-parse HEAD:package-lock.json 2>/dev/null || true)"
if [ ! -x node_modules/.bin/vite ] || [ "$old_lock" != "$new_lock" ]; then
  npm install --no-audit --no-fund
fi
npm run check:master --silent
touch index.html
echo "✅ Actualizado a $(git rev-parse --short HEAD). Abre http://127.0.0.1:5173 con jugar.sh activo."
