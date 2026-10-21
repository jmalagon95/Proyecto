import fs from 'node:fs';
import vm from 'node:vm';
let html=fs.readFileSync('index.html','utf8');
const tag='<script type="module" src="/src/systems/battle-focus.js"></script>';
const marker='/* KAMI_PLAYER_FOCUS_V1 */';
if(!html.includes(tag))html=html.replace('</body>',tag+'\n</body>');
if(!html.includes(marker)){
 const old='if(window.KamiBattleLanes)return window.KamiBattleLanes.chooseTarget(u,all);';
 if(html.split(old).length-1!==1)throw Error('Selector de objetivos del combate no encontrado');
 html=html.replace(old,marker+'\n    const forced=window.KamiBattleFocus?.targetFor(u,all);if(forced)return forced;\n    '+old);
 const clock='window.KamiBattleLanes?.tick(battle,dt);';
 if(html.split(clock).length-1!==1)throw Error('Actualización de batalla no encontrada');
 html=html.replace(clock,clock+'\n    window.KamiBattleFocus?.tick(battle);');
}
if(!html.includes(marker)||!html.includes('window.KamiBattleFocus?.targetFor'))throw Error('Focus incompleto');
for(const chunk of html.split('<script').slice(1)){
 const header=chunk.slice(0,chunk.indexOf('>'));if(header.includes('src='))continue;
 const js=chunk.slice(chunk.indexOf('>')+1).split('</script>')[0];
 if(js.trim())new vm.Script(js);
}
if(process.argv.includes('--write'))fs.writeFileSync('index.html',html);
console.log('✅ Focus individual conectado a selección de objetivo y refresco de batalla.');
