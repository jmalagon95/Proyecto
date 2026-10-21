import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEnemyCharacter,rollStatsForStar,STAR_STAT_RANGES,PRIMARY_STATS} from '../src/systems/stat-gacha.js';
import {attackProfile,characterMaxHp,damageAfterDefense} from '../src/systems/combat-stats.js';
import {simulateSurvivalMission} from '../src/systems/mission-simulator.js';
const missions=JSON.parse(fs.readFileSync('data/missions.json','utf8'));
const mission=missions.survival1;
assert.equal(mission.enemyStar,1);assert.equal(mission.enemyLevel,1);
for(const key of ['enemyHp','enemyDefense','enemyAttackMin','enemyAttackMax'])assert.ok(!(key in mission),key+' sigue fijo');
assert.deepEqual(STAR_STAT_RANGES[1],[1,5]);
for(let i=0;i<100;i++){
 const c=createEnemyCharacter({name:'Goblin',star:1,level:1});
 assert.equal(c.currentStar,1);assert.equal(c.level,1);
 assert.deepEqual(Object.keys(c.stats),PRIMARY_STATS);
 for(const v of Object.values(c.stats))assert.ok(v>=1&&v<=5);
 assert.equal(characterMaxHp(c),20+c.stats.CON*3);
 assert.ok(attackProfile(c).averageHit>0);
}
const low=rollStatsForStar(1,()=>0),high=rollStatsForStar(1,()=>.999999);
for(const k of PRIMARY_STATS){assert.equal(low[k],1);assert.equal(high[k],5)}
const char={star:1,level:1,stats:{...low,CON:2,DEF:1},role:'Guerrero',equipment:{}};
assert.equal(characterMaxHp(char),26);
char.stats.DEF=5;assert.equal(characterMaxHp(char),26,'DEF no debe añadir vida');
assert.ok(damageAfterDefense(100,5)<damageAfterDefense(100,1));
const hero={id:'p',name:'PJ',role:'Guerrero',level:1,currentStar:1,stats:{...high},equipment:{},skills:[]};
const r=simulateSurvivalMission([hero],{...mission,durationSeconds:4,waves:[2],enemyPressure:0});
assert.equal(r.frames.length,4);
assert.ok(r.enemiesDefeated<=2);
console.log('✅ Goblins ★1 usan exactamente el mismo gacha de seis estadísticas y fórmulas de los PJ.');
