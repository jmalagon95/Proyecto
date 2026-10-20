#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="$HOME/KamiNoChallenge"
for command_name in git node npm; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "📦 Instalando Git y Node.js..."
    pkg install -y git nodejs
    break
  fi
done

if [ ! -d "$ROOT/.git" ]; then
  git clone https://github.com/jmalagon95/Proyecto.git "$ROOT"
fi
cd "$ROOT"
case "$(git remote get-url origin 2>/dev/null || true)" in
  *jmalagon95/Proyecto*) ;;
  *) echo "❌ La carpeta existente pertenece a otro repositorio."; exit 1 ;;
esac

bash jugar.sh
