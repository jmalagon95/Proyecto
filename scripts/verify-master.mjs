import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Script } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.env.KAMI_MASTER_FILE || join(root, 'index.html');
const html = readFileSync(target, 'utf8');
const screens = ['cover', 'world', 'race', 'class', 'reveal', 'lobby', 'battle', 'battleResults'];
const errors = [];

if (!/<title>Kami No Challenge v[0-9.]+ · Prototipo maestro<\/title>/.test(html)) errors.push('Título del maestro no encontrado.');
if (!/const SAVE_KEY = 'kami_v[0-9]+_master'/.test(html)) errors.push('Clave de guardado del maestro no encontrada.');
if (!html.includes("const LEGACY_KEY = 'kami_v12_master'")) errors.push('No se encuentra el mecanismo de compatibilidad v12.');
if (!html.includes('<style>')) errors.push('Faltan los estilos integrados.');
if (!html.includes('const ASSETS=')) errors.push('Faltan los recursos visuales integrados.');
for (const id of screens) {
  if (!html.includes('<section id="' + id + '" class="screen')) errors.push('Falta pantalla: ' + id);
}

const inline = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
if (!inline) errors.push('Falta el JavaScript del maestro.');
else {
  try { new Script(inline[1], { filename: 'index.html:inline.js' }); }
  catch (err) { errors.push('JavaScript inválido: ' + err.message); }
}
if (statSync(target).size < 500000) errors.push('Tamaño inesperadamente pequeño; posible pérdida de recursos.');

if (errors.length) {
  console.error('❌ Error al verificar Kami No Challenge:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('✅ Maestro v0.16 verificado: ' + screens.length + ' pantallas, recursos y sintaxis válidos.');
