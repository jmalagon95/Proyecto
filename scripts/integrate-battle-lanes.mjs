import fs from 'node:fs';
import vm from 'node:vm';
let html=fs.readFileSync('index.html','utf8');
const marker='/* KAMI_BATTLE_25D_LANES_V1 */';
const tag='<script type="module" src="/src/systems/battle-lanes.js"></script>';
const once=(a,b,label)=>{
 const count=html.split(a).length-1;
 if(count!==1)throw new Error(label+' - se esperaba una coincidencia y hay '+count);
 html=html.replace(a,b);
};
if(!html.includes(tag))once('</body>',tag+'</body>','Cargar campo de batalla');
if(!html.includes(marker)){
 once('field.append(node);u.node=node;return node;',
   'field.append(node);u.node=node;window.KamiBattleLanes?.place(u,node,field);return node;',
   'Unidades en sus carriles');
 once('function swipe(a,b){','function swipe(a,b){\n    window.KamiBattleLanes?.onAttack(a,b);',
   'Animación de ataques reales');
 once('function closestTarget(u,all){',
   'function closestTarget(u,all){\n    if(window.KamiBattleLanes)return window.KamiBattleLanes.chooseTarget(u,all);',
   'Selección táctica de objetivos');
 once('battle.elapsed+=dt;battle.timeLeft=',
   marker+'\n    window.KamiBattleLanes?.tick(battle,dt);\n    battle.elapsed+=dt;battle.timeLeft=',
   'Actualizar vista perspectiva');
 // El movimiento entre carriles no puede convertirse en teletransporte manual:
 // se mantiene el botón de recolocar pero ahora aplica también perspectiva.
 once("u.node.style.top=`calc(${[16,44,71][u.lane]}% - 45px)`",
   "window.KamiBattleLanes?.place(u,u.node,field)",
   'Recolocar en profundidad');
}
if(!html.includes(tag)||!html.includes(marker)||!html.includes('window.KamiBattleLanes?.chooseTarget'))
 throw Error('Integración visual incompleta');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
 if(m[1].trim())new vm.Script(m[1]);
}
html=html.replace(/^[ \t]+$/gm,'');
if(process.argv.includes('--write'))fs.writeFileSync('index.html',html);
console.log('✅ Combate original conectado al campo elevado con tres carriles, objetivos y animaciones.');
