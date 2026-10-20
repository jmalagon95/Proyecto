KAMI NO CHALLENGE — TERMUX + GITHUB (v0.16)

Repositorio: https://github.com/jmalagon95/Proyecto
Rama: main
Archivo principal: index.html
Dirección de juego: http://127.0.0.1:5173

USO NORMAL (instalación ya conectada)
--------------------------------------
1) Abre Termux.
2) cd ~/KamiNoChallenge
3) bash jugar.sh
4) Abre http://127.0.0.1:5173 en Chrome.

El script descarga los cambios de GitHub cada 15 segundos y Vite recarga
el juego. No hay que descargar ZIP, subir un HTML ni copiar archivos.
Si Termux está cerrado, no puede descargar actualizaciones hasta abrirlo.

ACTUALIZACIÓN MANUAL
---------------------
cd ~/KamiNoChallenge
bash actualizar.sh

INSTALACIÓN DESDE CERO EN UN TERMUX NUEVO
-----------------------------------------
pkg update
pkg install git nodejs
git clone https://github.com/jmalagon95/Proyecto.git ~/KamiNoChallenge
cd ~/KamiNoChallenge
bash jugar.sh

También puedes usar: bash instalar_termux.sh, si ya tienes el repositorio.

REGLAS IMPORTANTES
------------------
- GitHub main es la fuente de verdad, no las copias locales.
- La sincronización usa git reset --hard y descarta cambios locales en archivos
  versionados. Edita o confirma los cambios en GitHub.
- La partida se guarda en el navegador (localStorage), no en GitHub.
- Usa siempre el mismo dominio: 127.0.0.1 y localhost tienen guardados distintos.
- El maestro v16 intenta recuperar guardados v12. El antiguo estado modular v04
  no se transforma automáticamente.
- El código anterior src/, data/, public/ y Unity/ queda conservado.
- Verificación: npm run check:master.
