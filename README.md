# Kami No Challenge — prototipo maestro

**Versión activa:** v0.16. **Fuente única:** `index.html` de `main`.

La versión jugable se sirve desde la raíz del proyecto mediante Vite. Todas las pantallas aprobadas se integran en **un único prototipo maestro**, no en minidemos separadas. Las imágenes principales están incluidas en la propia página, por lo que no hay que copiar el HTML al teléfono ni subirlo a otros servicios.

## Estructura

- `index.html` — prototipo maestro completo, portada y flujo de juego.
- `jugar.sh` — inicia Vite en Termux y sincroniza con GitHub cada 15 segundos.
- `actualizar.sh` — sincronización manual sin reiniciar el proyecto.
- `instalar_termux.sh` — configuración inicial para un Termux nuevo.
- `scripts/verify-master.mjs` — comprueba pantallas, recursos y sintaxis del maestro.
- `src/`, `data/`, `public/`, `Unity/` — código modular y recursos existentes **conservados** para integración futura; no sustituyen la página maestra.

## Uso diario desde Termux

```sh
cd ~/KamiNoChallenge
bash jugar.sh
```

Abre **http://127.0.0.1:5173** en el navegador del mismo teléfono. Mientras `jugar.sh` esté ejecutándose, los commits de `main` llegan automáticamente al entorno local en aproximadamente 15 segundos; Vite recarga la página al cambiar `index.html`. Si el servidor está cerrado, inicia `bash jugar.sh` para sincronizar antes de arrancar, o ejecuta `bash actualizar.sh` para actualizar sin iniciar Vite.

La carpeta local de Termux recibe un `git reset --hard origin/main`: **los cambios locales no confirmados en Git se descartan**. GitHub es la fuente de verdad. Las partidas se guardan con `localStorage` en el navegador del teléfono, **no en GitHub**. Mantén la misma dirección (127.0.0.1 frente a localhost son orígenes diferentes) para ver las mismas partidas. La versión maestra tiene compatibilidad con guardados de la versión v12; los datos del antiguo módulo v04 no se migran automáticamente.

## Desarrollo y comprobaciones

```sh
npm install
npm run check:master
npm run dev
npm run build
```

`npm run dev` ejecuta Vite sin regenerar los antiguos catálogos modulares; estos se conservan y se pueden reconstruir expresamente con `npm run prepare:modular`. Cada cambio aprobado debe modificar `index.html` y pasar `npm run check:master` antes de publicarse en `main`. No sustituir el maestro por una pantalla suelta.

> El servidor lo ejecuta Termux en el teléfono. GitHub almacena el proyecto y sus actualizaciones: publicar un commit no arranca por sí solo Termux cuando la aplicación está cerrada.
