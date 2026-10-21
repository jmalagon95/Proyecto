import assert from 'node:assert/strict';
import { simulateSurvivalMission, applyMissionResult } from '../src/systems/mission-simulator.js';

const hero=(id,stats)=>({
  id,name:'Héroe '+id,role:'Defensor',level:1,currentStar:1,
  stats:{FUE:12,AGI:12,CON:12,DEF:12,INT:12,VOL:12,...stats},
  equipment:{},experience:0,dead:false,missionsSurvived:0,totalKills:0
});
const mission={durationSeconds:16,waves:[2,2],enemyHp:8,enemyAttackMin:1,enemyAttackMax:2,enemyDefense:0,enemyPressure:0,fixedGoldReward:25,enemyLevel:1,baseXpPerKill:2};
const party=[hero('a'),hero('b')];
const result=simulateSurvivalMission(party,mission);
assert.equal(result.events.length>=1,true);
assert.ok(Array.isArray(result.frames));
assert.equal(result.frames.length,16);
assert.deepEqual(result.frames.map(f=>f.t),Array.from({length:16},(_,i)=>i));
for(const frame of result.frames){
  assert.ok(frame.enemiesAlive>=0);
  assert.equal(frame.allies.length,party.length);
  for(const ally of frame.allies){
    assert.ok(ally.hp>=0&&ally.hp<=ally.maxHp);
    assert.equal(ally.alive,ally.hp>0);
  }
}
assert.equal(result.frames.at(-1).enemiesDefeated,result.enemiesDefeated);
const state={characters:party,resources:{gold:0,wood:0,stone:0},missionProgress:{}};
applyMissionResult(state,result);
assert.equal(state.resources.gold,result.completed?result.rewards.gold:0);
const impossible=simulateSurvivalMission([hero('weak',{CON:1,DEF:1})],{...mission,enemyPressure:100,waves:[100],enemyFactory:()=>({name:'Goblin de prueba',star:1,currentStar:1,level:1,role:'Guerrero',stats:{FUE:500,AGI:500,CON:50,DEF:100,INT:10,VOL:10},equipment:{}})});
assert.equal(impossible.completed,false);
assert.equal(impossible.rewards.gold,0);
assert.equal(impossible.xpMetrics.reduce((t,x)=>t+x.xp,0),0);
console.log('✅ Combat tests: frames, HP, waves, defeat and rewards');
