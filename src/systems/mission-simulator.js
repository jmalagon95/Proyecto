import { killXpForLevels, grantExperience } from './experience.js';
import { levelCap } from './progression.js';
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function roleBias(c){
  const role=(c.role||'').toLowerCase();
  return {
    damage:/dps|daño|ranger|asesino|duelista|segador|mago/.test(role)?1.18:/defensor|tanque/.test(role)?.82:1,
    defense:/defensor|tanque|protección|bastión/.test(role)?1.35:/apoyo|sanación/.test(role)?1.08:1,
    support:/apoyo|sanación|invocador/.test(role)?1.18:1
  };
}
function actorPower(c){
  const s=c.stats||{};
  const base=(s.FUE||0)*1.15+(s.AGI||0)*1.05+(s.INT||0)*1.15+(s.VOL||0)*.7+(s.CON||0)*.9+(s.DEF||0)*.85;
  return Math.max(4,base*(1+(c.level-1)*.035)*(1+(c.currentStar-1)*.08));
}
function maxHp(c){const s=c.stats||{};return Math.max(35,55+(s.CON||0)*7+(s.DEF||0)*3+(c.level-1)*5)}
function ev(t,text,type='normal'){return {t,text,type}}

export function simulateSurvivalMission(team,mission){
  const duration=mission.durationSeconds||180;
  const waves=mission.waves||[5,6,7,8,9,10];
  const chars=team.map(c=>({ref:c,id:c.id,name:c.name,hp:maxHp(c),maxHp:maxHp(c),damage:0,kills:0,alive:true,bias:roleBias(c),power:actorPower(c)}));
  const events=[ev(0,'El grupo cruza el portal. El aire cambia y los primeros chillidos goblin resuenan en la distancia.','system')];
  let enemyRemaining=0,enemiesDefeated=0,time=0;
  const totalEnemies=waves.reduce((a,b)=>a+b,0);
  for(let wi=0;wi<waves.length;wi++){
    time=wi*30;enemyRemaining+=waves[wi];
    events.push(ev(time,'Oleada '+(wi+1)+': aparecen '+waves[wi]+' goblins ★1. Enemigos activos: '+enemyRemaining+'.','wave'));
    for(let tick=0;tick<6&&time<duration;tick++){
      const now=time+tick*5;
      const living=chars.filter(x=>x.alive);
      if(!living.length)break;
      for(const a of living){
        if(enemyRemaining<=0)break;
        const variance=.82+Math.random()*.36;
        const dmg=Math.max(1,Math.round(a.power*a.bias.damage*variance));
        a.damage+=dmg;
        const killChance=clamp(dmg/45,.05,.72);
        if(Math.random()<killChance){enemyRemaining--;enemiesDefeated++;a.kills++;if(Math.random()<.34)events.push(ev(now,a.name+' derriba a un goblin tras abrirse paso entre la formación enemiga.','combat'));}
        else if(Math.random()<.24)events.push(ev(now,a.name+' golpea con fuerza, pero el enemigo consigue mantenerse en pie.','combat'));
      }
      if(enemyRemaining>0){
        const targets=chars.filter(x=>x.alive);
        const attacks=Math.min(enemyRemaining,Math.max(1,Math.ceil(enemyRemaining*.45)));
        for(let i=0;i<attacks&&targets.length;i++){
          const target=targets[Math.floor(Math.random()*targets.length)];
          const s=target.ref.stats||{};
          const mitigation=1+((s.DEF||0)*.025)+((s.CON||0)*.012);
          const incoming=Math.max(1,Math.round((4+Math.random()*8)/mitigation/target.bias.defense));
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
  const damageMetrics=chars.map(x=>({id:x.id,name:x.name,damage:x.damage,kills:x.kills,survived:x.alive,damagePct:0}));
  const xpMetrics=chars.map(x=>({id:x.id,name:x.name,kills:x.kills,xp:completed?x.kills*killXpForLevels(x.ref.level,mission.enemyLevel||1,mission.baseXpPerKill||0):0}));
  const totalDamage=damageMetrics.reduce((a,b)=>a+b.damage,0)||1;
  damageMetrics.forEach(x=>x.damagePct=Math.round(x.damage/totalDamage*1000)/10);
  const rewards={gold:0,wood:0,stone:0,bonusGold:0};
  if(completed){rewards.bonusGold=Math.random()<.45?Math.floor(Math.random()*101):0;rewards.gold=(mission.fixedGoldReward||0)+rewards.bonusGold;rewards.wood=Math.floor(Math.random()*6);rewards.stone=Math.floor(Math.random()*5);}
  return {completed,duration:completed?duration:Math.min(duration,time+30),enemiesDefeated,totalEnemies,enemyRemaining,events:events.sort((a,b)=>a.t-b.t),survivors:survivors.map(x=>x.id),fallen:chars.filter(x=>!x.alive).map(x=>x.id),damageMetrics,xpMetrics,rewards};
}

export function applyMissionResult(state,result){
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