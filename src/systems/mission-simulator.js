import { killXpForLevels, grantExperience } from './experience.js';
import { levelCap } from './progression.js';
import { attackProfile, characterMaxHp } from './combat-stats.js';
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function roleBias(c){
  const role=(c.role||'').toLowerCase();
  return {
    damage:/dps|daño|ranger|asesino|duelista|segador|mago/.test(role)?1.18:/defensor|tanque/.test(role)?.82:1,
    defense:/defensor|tanque|protección|bastión/.test(role)?1.35:/apoyo|sanación/.test(role)?1.08:1,
    support:/apoyo|sanación|invocador/.test(role)?1.18:1
  };
}
function ev(t,text,type='normal'){return {t,text,type}}

export function simulateSurvivalMission(team,mission){
  const duration=mission.durationSeconds||180;
  const waves=mission.waves||[5,6,7,8,9,10];
  const chars=team.map(c=>{
    const profile=attackProfile(c),hp=characterMaxHp(c);
    return {ref:c,id:c.id,name:c.name,hp,maxHp:hp,damage:0,kills:0,alive:true,bias:roleBias(c),attack:profile};
  });
  const events=[ev(0,'El grupo cruza el portal. El aire cambia y los primeros chillidos goblin resuenan en la distancia.','system')];
  let enemyRemaining=0,enemiesDefeated=0,time=0;
  const enemyHp=Number(mission.enemyHp||28);
  const enemyDefense=Number(mission.enemyDefense||1);
  const enemyAttackMin=Number(mission.enemyAttackMin||5);
  const enemyAttackMax=Number(mission.enemyAttackMax||9);
  const enemyPressure=Number(mission.enemyPressure||.38);
  const activeEnemies=[];
  const totalEnemies=waves.reduce((a,b)=>a+b,0);
  for(let wi=0;wi<waves.length;wi++){
    time=wi*30;enemyRemaining+=waves[wi];
    for(let e=0;e<waves[wi];e++)activeEnemies.push({hp:enemyHp});
    events.push(ev(time,'Oleada '+(wi+1)+': aparecen '+waves[wi]+' goblins Nv.'+(mission.enemyLevel||1)+'. Enemigos activos: '+enemyRemaining+'.','wave'));
    for(let tick=0;tick<6&&time<duration;tick++){
      const now=time+tick*5;
      const living=chars.filter(x=>x.alive);
      if(!living.length)break;
      for(const a of living){
        if(enemyRemaining<=0||!activeEnemies.length)break;
        let attacks=Math.max(1,Math.floor(a.attack.attacksPerFiveSeconds));
        if(Math.random()<(a.attack.attacksPerFiveSeconds-attacks))attacks++;
        for(let hit=0;hit<attacks&&activeEnemies.length;hit++){
          const variance=.88+Math.random()*.24;
          const raw=a.attack.averageHit*variance;
          const dmg=Math.max(1,Math.round(raw-enemyDefense*.7));
          const target=activeEnemies[0];
          target.hp-=dmg;
          a.damage+=dmg;
          if(target.hp<=0){
            activeEnemies.shift();enemyRemaining--;enemiesDefeated++;a.kills++;
            if(Math.random()<.55)events.push(ev(now,a.name+' elimina a un goblin con '+dmg+' de daño.','combat'));
          }else if(Math.random()<.18){
            events.push(ev(now,a.name+' hiere a un goblin por '+dmg+' de daño.','combat'));
          }
        }
      }
      if(enemyRemaining>0){
        const targets=chars.filter(x=>x.alive);
        const attacks=Math.min(enemyRemaining,Math.max(1,Math.ceil(enemyRemaining*enemyPressure)));
        for(let i=0;i<attacks&&targets.length;i++){
          const target=targets[Math.floor(Math.random()*targets.length)];
          const s=target.ref.stats||{};
          const mitigation=1+((s.DEF||0)*.025)+((s.CON||0)*.012);
          const incoming=Math.max(1,Math.round((enemyAttackMin+Math.random()*(enemyAttackMax-enemyAttackMin))/mitigation/target.bias.defense));
          target.hp-=incoming;
          if(target.hp<=0&&target.alive){target.alive=false;target.hp=0;events.push(ev(now,target.name+' cae en combate. La expedición continúa sin '+target.name+'.','death'));}
        }
      }
      const supports=chars.filter(x=>x.alive&&x.bias.support>1);
      for(const s of supports){
        const injured=chars.filter(x=>x.alive&&x.hp<x.maxHp*.7).sort((a,b)=>a.hp-b.hp)[0];
        if(injured&&Math.random()<.25){const heal=Math.round(4*s.bias.support+(s.ref.stats?.VOL||0)*.15);injured.hp=Math.min(injured.maxHp,injured.hp+heal);events.push(ev(now,s.name+' estabiliza a '+injured.name+', evitando que la línea se derrumbe.','support'));}
      }
    }
    if(!chars.some(x=>x.alive))break;
  }
  const survivors=chars.filter(x=>x.alive);
  const completed=survivors.length>0;
  events.push(ev(completed?duration:Math.min(duration,time+30),completed?'El contador alcanza 180 segundos. El portal de extracción se abre: misión completada.':'La formación ha sido destruida antes de completar el tiempo de supervivencia. Misión fallida.',completed?'success':'failure'));
  const damageMetrics=chars.map(x=>({id:x.id,name:x.name,damage:x.damage,kills:x.kills,survived:x.alive,dps:Math.round(x.attack.dps*10)/10,damagePct:0}));
  const xpMetrics=chars.map(x=>({id:x.id,name:x.name,kills:x.kills,xp:completed?x.kills*killXpForLevels(x.ref.level,mission.enemyLevel||1,mission.baseXpPerKill||0):0}));
  const totalDamage=damageMetrics.reduce((a,b)=>a+b.damage,0)||1;
  damageMetrics.forEach(x=>x.damagePct=Math.round(x.damage/totalDamage*1000)/10);
  const rewards={gold:0,wood:0,stone:0,bonusGold:0};
  if(completed){rewards.bonusGold=Math.random()<.45?Math.floor(Math.random()*101):0;rewards.gold=(mission.fixedGoldReward||0)+rewards.bonusGold;rewards.wood=Math.floor(Math.random()*6);rewards.stone=Math.floor(Math.random()*5);}
  return {completed,duration:completed?duration:Math.min(duration,time+30),enemiesDefeated,totalEnemies,enemyRemaining,events:events.sort((a,b)=>a.t-b.t),survivors:survivors.map(x=>x.id),fallen:chars.filter(x=>!x.alive).map(x=>x.id),damageMetrics,xpMetrics,rewards};
}

export function applyMissionResult(state,result){
  for(const metric of result.damageMetrics||[]){
    const char=(state.characters||[]).find(c=>c.id===metric.id);
    if(!char)continue;
    char.totalKills=(char.totalKills||0)+(metric.kills||0);
    if(metric.survived)char.missionsSurvived=(char.missionsSurvived||0)+1;
  }
  for(const id of result.fallen){const char=(state.characters||[]).find(c=>c.id===id);if(char)char.dead=true;}
  if(result.completed){
    state.resources.gold=(state.resources.gold||0)+result.rewards.gold;
    state.resources.wood=(state.resources.wood||0)+result.rewards.wood;
    state.resources.stone=(state.resources.stone||0)+result.rewards.stone;
    state.missionProgress=state.missionProgress||{};
    state.missionProgress.survival1Completions=(state.missionProgress.survival1Completions||0)+1;
    for(const metric of result.xpMetrics||[]){
      const char=(state.characters||[]).find(c=>c.id===metric.id);
      if(char&&!char.dead&&metric.xp>0)grantExperience(char,metric.xp,levelCap(char));
    }
  }
}