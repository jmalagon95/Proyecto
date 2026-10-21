import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRacialSkills,RACIAL_SKILL_DESIGN_VERSION} from './racial-skill-design.mjs';
import {resolveSkill} from '../src/systems/effects.js';
import {simulateSurvivalMission} from '../src/systems/mission-simulator.js';
const classes=JSON.parse(fs.readFileSync('data/classes.json','utf8'));
const targets=JSON.parse(fs.readFileSync('data/content_targets.json','utf8'));
assert.equal(RACIAL_SKILL_DESIGN_VERSION,4);
const allIds=new Set();
let total=0,highPowered=0,evolutions=0,percent=0;
let sampleU;
for(const [race,pool] of Object.entries(classes)){
 if(race==='generic')continue;
 for(const cls of pool){
  const items=buildRacialSkills({...cls,group:race},targets);
  assert.equal(items.length,1000,cls.name);
  assert.equal(new Set(items.map(x=>x.name)).size,1000,cls.name+' tiene nombres repetidos');
  const localIds=new Set(items.map(x=>x.id));
  for(const skill of items){
   assert.ok(!allIds.has(skill.id),skill.id);allIds.add(skill.id);
   assert.equal(skill.className,cls.name);
   assert.ok(cls.weapons.includes(skill.weaponRequirement));
   assert.ok(skill.functional);
   assert.ok(['nativa','evolutiva'].includes(skill.origin));
   assert.ok(!/bleed|burn|poison|dot|damage_over_time/i.test(JSON.stringify(skill.mechanics)));
   if(skill.evolvesFrom){assert.ok(localIds.has(skill.evolvesFrom));evolutions++;}
   const effects=skill.mechanics.effects;
   assert.ok(effects.every(e=>['damage','heal','shield','vulnerability','haste','summon_strike','bonus_damage_pct_max_hp'].includes(e.op)));
   if(['S','SS','SSS','SSS+','U'].includes(skill.rank)&&effects.some(e=>e.multiplier>=35))highPowered++;
   if(effects.some(e=>e.op==='bonus_damage_pct_max_hp'))percent++;
  }
  for(const [rank,count] of Object.entries(targets.skills.rankCountsPerClass))
   assert.equal(items.filter(x=>x.rank===rank).length,count,cls.name+' '+rank);
  sampleU??=items.find(x=>x.rank==='U'&&x.mechanics.effects.some(e=>e.op==='damage'));
  total+=items.length;
 }
}
assert.equal(total,31000);
assert.ok(evolutions>=3000);
assert.ok(highPowered>=500);
assert.ok(percent>100);
const actor={stats:{FUE:50,CON:50,VOL:50,AGI:50,INT:50,DEF:50}};
const resolved=resolveSkill(sampleU,actor,{hp:100000,maxHp:100000});
assert.ok(resolved.ok&&resolved.results.some(x=>x.amount>500));
const hero={id:'ultimate',name:'Ultimate',className:'Monarca de la Espada Indómita',role:'DPS',level:1,currentStar:1,
 stats:actor.stats,equipment:{},skills:[buildRacialSkills({...classes.kairakh[5],group:'kairakh'},targets).find(x=>x.rank==='U')]};
const result=simulateSurvivalMission([hero],{durationSeconds:5,waves:[2],enemyHp:100000000,enemyAttackMin:1,enemyAttackMax:1,enemyPressure:0,enemyDefense:2});
assert.ok(result.events.some(e=>e.text.includes('ejecuta')));
assert.ok(result.damageMetrics[0].damage>0);
console.log('✅ '+total+' raciales, '+evolutions+' evoluciones, '+highPowered+' técnicas S+, '+percent+' porcentuales; U verificado');
