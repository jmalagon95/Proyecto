#!/data/data/com.termux/files/usr/bin/bash
# Sincroniza el maestro sin reemplazar una versión válida por una candidata rota.
set -euo pipefail
cd "$HOME/KamiNoChallenge"
git fetch origin main --quiet || { echo "⚠️ Sin conexión con GitHub; se conserva la versión actual."; exit 1; }
old_head="$(git rev-parse HEAD)"
new_head="$(git rev-parse origin/main)"
if [ "$old_head" = "$new_head" ]; then
  npm run check:master --silent
  exit 0
fi
candidate="$(mktemp "$HOME/KamiNoChallenge/.kami-candidate-XXXXXX.html")"
checker="$(mktemp "$HOME/KamiNoChallenge/scripts/.kami-checker-XXXXXX.mjs")"
trap 'rm -f "$candidate" "$checker"' EXIT
git show "origin/main:index.html" > "$candidate" || { echo "❌ Falta index.html en la actualización."; exit 1; }
git show "origin/main:scripts/verify-master.mjs" > "$checker" || { echo "❌ Falta el verificador nuevo."; exit 1; }
# Se valida contra el verificador que ya funciona en el teléfono.
KAMI_MASTER_FILE="$candidate" node "$checker" || {
  echo "❌ Nueva versión rechazada: la partida actual no se modifica."
  exit 1
}
# Guarda el commit anterior para recuperación sin crear duplicados del juego.
git update-ref refs/kami/last-working "$old_head"
old_lock="$(git rev-parse HEAD:package-lock.json 2>/dev/null || true)"
git reset --hard origin/main >/dev/null
new_lock="$(git rev-parse HEAD:package-lock.json 2>/dev/null || true)"
if [ ! -x node_modules/.bin/vite ] || [ "$old_lock" != "$new_lock" ]; then
  npm install --no-audit --no-fund
fi
npm run check:master --silent || {
  echo "⚠️ Falló la comprobación final. Restaurando última versión funcional..."
  git reset --hard "$old_head" >/dev/null
  exit 1
}
touch index.html
echo "✅ Kami actualizado a $(git rev-parse --short HEAD)"
