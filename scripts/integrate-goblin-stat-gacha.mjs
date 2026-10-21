import fs from 'node:fs';
import vm from 'node:vm';
const file='index.html';
let html=fs.readFileSync(file,'utf8');
const marker='/* KAMI_GOBLIN_SHARED_STAR_GACHA_V1 */';
const once=(oldText,newText,label)=>{
 const n=html.split(oldText).length-1;
 if(n!==1)throw new Error(label+': '+n+' coincidencias (esperada 1). No se modifica el maestro.');
 html=html.replace(oldText,newText);
};
if(!html.includes(marker)){
 const shared=marker+\`
  // Misma tirada de atributos que los PJ: STAR_RANGES y rollStat.
  function rollEnemyStats(star=1){
    const stats={};
    for(const name of ['FUE','AGI','CON','DEF','INT','VOL'])stats[name]=rollStat(star);
    return stats;
  }
  const combatStatHp=(stats,level=1)=>Math.max(1,20+Math.max(0,stats.CON||0)*3+(Math.max(1,level)-1)*2);
  const combatStatDamage=(stats,level=1,star=1)=>11+Math.max(0,stats.FUE||0)*1.55+Math.max(0,stats.INT||0)*.18;
  const combatStatDefense=stats=>Math.max(0,Number(stats.DEF)||0);
  const combatMitigation=(raw,def)=>Math.max(1,Math.round(Math.max(0,raw)*100/(100+Math.max(0,def))));
  \`;
 once('function makeHero(){',shared+'function makeHero(){','Gacha compartido: makeHero');
 once('const maxHP = c => 160+Math.max(1,Number(c?.stats?.CON)||1)*14+(Math.max(1,Number(c?.level)||1)-1)*16;',
   'const maxHP = c => combatStatHp(c?.stats||{CON:1},c?.level||1);','HP CON');
 once("attack:11+(c.stats.FUE||1)*1.55+(c.stats.INT||1)*.18,defense:(c.stats.DEF||1)*.33",
   "attack:combatStatDamage(c.stats,c.level,c.star),defense:combatStatDefense(c.stats)",'Poder de aliados');
 const start=html.indexOf('  function addGoblin(){');
 const end=html.indexOf('     e.maxHp=e.hp;battle.enemies.push(e);',start);
 if(start<0||end<0||end-start>1200)throw new Error('No se reconoce el constructor de goblins');
 const replacement=\`  function addGoblin(){
     const m=battle.mission,index=battle.enemies.length;
     const star=1,level=1;
     const stats=rollEnemyStats(star);
     const e={id:'E'+uid(),name:m.difficulty===3?'Goblin blindado':'Goblin',enemy:true,
       star,level,stats,hp:combatStatHp(stats,level),maxHp:0,
       attack:combatStatDamage(stats,level,star),defense:combatStatDefense(stats),
       index,lane:index%3,cooldown:1.1+Math.random()*2.2,kills:0,damage:0};
\`;
 html=html.slice(0,start)+replacement+html.slice(end);
 once('let damage=Math.max(1,Math.round(a.attack*(.78+Math.random()*.45)-(target.defense||0)));',
   'let damage=combatMitigation(a.attack*(.78+Math.random()*.45),target.defense||0);','DEF solo mitiga');
 once("e.cooldown+=2.4+Math.random()*.6",
   "e.cooldown+=Math.max(.65,1.38-(e.stats.AGI||1)*.011)",'AGI enemigo');
 // Detecta si las mismas fórmulas están presentes.
}
if(!html.includes(marker)||!html.includes('rollEnemyStats(star)')||!html.includes('combatMitigation('))
 throw new Error('Integración incompleta');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
for(const script of scripts)new vm.Script(script);
if(process.argv.includes('--write'))fs.writeFileSync(file,html);
console.log('✅ Goblins ★1: 6 atributos del gacha de PJ; HP por CON, defensa por DEF, daño derivado, JS válido.');
