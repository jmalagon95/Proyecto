import fs from 'node:fs';
import vm from 'node:vm';
let html=fs.readFileSync('index.html','utf8');
const marker='/* KAMI_CHRONICLE_COMBAT_EVENTS_V1 */';
if(!html.includes(marker)){
 const old='target.hp=Math.max(0,target.hp-damage);a.damage+=damage;';
 const hits=html.split(old).length-1;
 if(hits!==1)throw Error('Aplicación del daño: '+hits+' coincidencias');
 const replacement=[
  marker,
  'const effectiveDamage=Math.min(Math.max(0,target.hp),Math.max(0,damage));',
  'target.hp=Math.max(0,target.hp-effectiveDamage);a.damage+=effectiveDamage;',
  'if(battle&&Array.isArray(battle.pendingChronicle)&&effectiveDamage>0&&battle.pendingChronicle.length<16){',
  "battle.pendingChronicle.push(a.name+' golpea a '+target.name+' e inflige '+Math.round(effectiveDamage)+' de daño ('+",
  "Math.ceil(target.hp)+'/'+Math.ceil(target.maxHp)+' PV restantes).');",
  '}'
 ].join('\n');
 html=html.replace(old,replacement);
 const spawned='e.maxHp=e.hp;battle.enemies.push(e);unitDom(e);';
 if(html.split(spawned).length-1!==1)throw Error('Generación de goblins no reconocida');
 html=html.replace(spawned,spawned+
  "if(battle&&Array.isArray(battle.pendingChronicle)&&battle.pendingChronicle.length<16)"+
  "battle.pendingChronicle.push('Aparece '+e.name+' ★'+(e.star||1)+' con '+Math.ceil(e.hp)+' PV.');");
}
if(!html.includes(marker))throw Error('Parche de golpes incompleto');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 if(m[1].trim())new vm.Script(m[1]);
if(process.argv.includes('--write'))fs.writeFileSync('index.html',html);
console.log('✅ Crónica incluye ataques reales, daños efectivos y aparición de goblins.');
