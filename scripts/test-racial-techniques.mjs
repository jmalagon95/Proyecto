import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RACIAL_TECHNIQUES,executeRacialTechnique,racialTechniqueFor} from '../src/systems/racial-techniques.js';
import {simulateSurvivalMission} from '../src/systems/mission-simulator.js';
const classes=JSON.parse(readFileSync(new URL('../data/classes.json',import.meta.url),'utf8'));
const racial=Object.entries(classes).filter(([k])=>k!=='generic').flatMap(([,list])=>list);
assert.equal(racial.length,31);
assert.equal(Object.keys(RACIAL_TECHNIQUES).length,31);
for(const cls of racial){
  const char={id:cls.name,name:cls.name,className:cls.name,role:cls.role,
    stats:{FUE:12,AGI:12,CON:12,DEF:12,INT:12,VOL:12},
    level:1,currentStar:1,skills:[],equipment:{}};
  assert.ok(racialTechniqueFor(char),cls.name+' sin técnica');
  const unit={id:char.id,ref:char,name:char.name,hp:180,maxHp:180,shield:0,alive:true,
    attack:{dps:4},attackAccumulator:0,nextRacialAt:0};
  const enemy=[{hp:150,maxHp:150},{hp:150,maxHp:150},{hp:150,maxHp:150}];
  const action=executeRacialTechnique(unit,[unit],enemy,0);
  if(action?.kind==='heal'){
    unit.hp=100;unit.nextRacialAt=0;
    assert.ok(executeRacialTechnique(unit,[unit],enemy,0)?.healing>0);
  }else assert.ok(action,cls.name+' no ejecutó técnica');
  for(const e of enemy)assert.ok(e.hp>=0&&e.hp<=e.maxHp);
  assert.ok(unit.hp>=0&&unit.hp<=unit.maxHp);
}
const hero={id:'m',name:'Test',className:'Taumaturgo Bélico',role:'DPS mágico',stats:{FUE:12,AGI:12,CON:12,DEF:12,INT:12,VOL:12},level:1,currentStar:1,skills:[{
  id:'LEARNED',name:'Golpe arcano',functional:true,mechanics:{cooldownSeconds:5,effects:[{op:'damage',target:'single',scalingStat:'INT',multiplier:1}]}
}],equipment:{}};
const result=simulateSurvivalMission([hero],{durationSeconds:9,waves:[5],enemyHp:100,enemyDefense:0,enemyAttackMin:1,enemyAttackMax:1,enemyPressure:0,enemyLevel:1,baseXpPerKill:2,fixedGoldReward:10});
assert.ok(result.events.some(x=>x.text.includes('Explosión del Primer Combate')));
assert.ok(result.events.some(x=>x.text.includes('Golpe arcano')));
assert.ok(result.frames.every(x=>x.allies.every(y=>y.hp>=0&&y.hp<=y.maxHp)));
console.log('✅ 31 técnicas raciales + habilidades aprendidas y cronología comprobadas');
