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
bash scripts/sync-safe.sh
echo "✅ Abre http://127.0.0.1:5173 con jugar.sh activo."
