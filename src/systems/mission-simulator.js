import { killXpForLevels, grantExperience } from './experience.js';
import { levelCap } from './progression.js';
import { attackProfile, characterMaxHp } from './combat-stats.js';
import { executeRacialTechnique } from './racial-techniques.js';
import { resolveSkill } from './effects.js';

function roleBias(c){
  const role=(c.role||'').toLowerCase();
  return {
    damage:/dps|daño|ranger|asesino|duelista|segador|mago/.test(role)?1.10:/defensor|tanque/.test(role)?.88:1,
    defense:/defensor|tanque|protección|bastión/.test(role)?1.35:/apoyo|sanación/.test(role)?1.08:1,
    support:/apoyo|sanación|invocador/.test(role)?1.18:1
  };
}
function ev(t,text,type='normal'){return {t,text,type}}
function fmtSec(sec){return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}

export function simulateSurvivalMission(team,mission){
  const duration=Math.max(1,Number(mission.durationSeconds||180));
  const waves=mission.waves||[5,6,7,8,9,10];
  const waveTimes=waves.map((_,i)=>Math.floor(i*duration/waves.length));
  const chars=team.map(c=>{
    const attack=attackProfile(c),hp=characterMaxHp(c);
    return {
      ref:c,id:c.id,name:c.name,hp,maxHp:hp,damage:0,kills:0,alive:true,
      bias:roleBias(c),attack,attackAccumulator:0,shield:0,nextSkillAt:0,nextRacialAt:0
    };
  });

  const enemyHp=Math.max(1,Number(mission.enemyHp||36));
  const enemyDefense=Math.max(0,Number(mission.enemyDefense||1));
  const enemyAttackMin=Math.max(1,Number(mission.enemyAttackMin||7));
  const enemyAttackMax=Math.max(enemyAttackMin,Number(mission.enemyAttackMax||11));
  const enemyPressure=Math.max(0,Number(mission.enemyPressure||.47));
  const activeEnemies=[];
  let enemiesDefeated=0;
  const totalEnemies=waves.reduce((a,b)=>a+b,0);
  const events=[];
  const frames=[];

  for(let sec=0;sec<duration;sec++){
    if(!chars.some(x=>x.alive))break;
    const lines=[];
    let type='normal';

    const wi=waveTimes.indexOf(sec);
    if(wi>=0){
      for(let e=0;e<waves[wi];e++)activeEnemies.push({hp:enemyHp,maxHp:enemyHp});
      lines.push('Oleada '+(wi+1)+': aparecen '+waves[wi]+' goblins Nv.'+(mission.enemyLevel||1)+'.');
      type='wave';
    }

    const living=chars.filter(x=>x.alive);
    let killsThisSecond=0;
    let damageThisSecond=0;

    // Ejecuta las técnicas raciales y habilidades realmente aprendidas.
    for(const actor of living){
      if(!activeEnemies.length)break;
      const racial=executeRacialTechnique(actor,chars,activeEnemies,sec);
      if(racial){
        actor.damage+=racial.damage;actor.kills+=racial.kills;
        enemiesDefeated+=racial.kills;killsThisSecond+=racial.kills;damageThisSecond+=racial.damage;
        activeEnemies.splice(0,activeEnemies.length,...activeEnemies.filter(e=>e.hp>0));
        lines.push(actor.name+' usa '+racial.skill+'.');
        type='combat';
      }
      if(!activeEnemies.length)break;
      const learned=(actor.ref.skills||[]).find(sk=>sk?.functional&&sk?.mechanics?.effects?.length);
      if(learned&&sec>=actor.nextSkillAt){
        const action=resolveSkill(learned,actor.ref,activeEnemies[0]);
        if(action.ok){
          actor.nextSkillAt=sec+Math.max(1,Number(action.cooldownSeconds||6));
          const penetration=action.results.find(e=>e.op==='penetration_pct')?.value||0;
          for(const e of action.results){
            if(e.op==='damage'){
              for(const target of (e.target==='area'?activeEnemies.slice(0,3):activeEnemies.slice(0,1))){
                const dealt=Math.min(target.hp,Math.max(1,Math.round(e.amount*(1+penetration/100))));
                target.hp-=dealt;actor.damage+=dealt;damageThisSecond+=dealt;
                if(target.hp<=0){actor.kills++;enemiesDefeated++;killsThisSecond++;}
              }
            }else if(e.op==='heal'){
              const target=chars.filter(x=>x.alive).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
              if(target)target.hp=Math.min(target.maxHp,target.hp+e.amount);
            }else if(e.op==='shield')actor.shield+=e.amount;
          }
          activeEnemies.splice(0,activeEnemies.length,...activeEnemies.filter(e=>e.hp>0));
          lines.push(actor.name+' ejecuta '+learned.name+'.');
          type='combat';
        }
      }
    }
    for(const a of living){
      if(!activeEnemies.length)break;
      a.attackAccumulator+=Math.max(.01,a.attack.attacksPerFiveSeconds/5);
      while(a.attackAccumulator>=1&&activeEnemies.length){
        a.attackAccumulator-=1;
        const variance=.88+Math.random()*.24;
        const dmg=Math.max(1,Math.round(a.attack.averageHit*a.bias.damage*variance-enemyDefense*.7));
        const target=activeEnemies[0];
        const applied=Math.min(dmg,target.hp);
        target.hp-=dmg;
        a.damage+=applied;
        damageThisSecond+=applied;
        if(target.hp<=0){
          activeEnemies.shift();
          enemiesDefeated++;
          killsThisSecond++;
          a.kills++;
          lines.push(a.name+' elimina a un goblin ('+applied+' daño).');
          type='combat';
        }else if(Math.random()<.10){
          lines.push(a.name+' hiere a un goblin ('+applied+' daño).');
          type='combat';
        }
      }
    }

    if(activeEnemies.length){
      const aliveNow=chars.filter(x=>x.alive);
      let attacks=0;
      for(let i=0;i<activeEnemies.length;i++){
        if(Math.random()<enemyPressure/5)attacks++;
      }
      for(let i=0;i<attacks&&aliveNow.length;i++){
        const candidates=chars.filter(x=>x.alive);
        if(!candidates.length)break;
        const target=candidates[Math.floor(Math.random()*candidates.length)];
        const s=target.ref.stats||{};
        const mitigation=1+((s.DEF||0)*.025)+((s.CON||0)*.012);
        const incoming=Math.max(1,Math.round((enemyAttackMin+Math.random()*(enemyAttackMax-enemyAttackMin))/mitigation/target.bias.defense));
        const absorbed=Math.min(target.shield||0,incoming);
        target.shield=Math.max(0,(target.shield||0)-absorbed);
        target.hp-=incoming-absorbed;
        if(target.hp<=0&&target.alive){
          target.alive=false;
          target.hp=0;
          lines.push(target.name+' cae en combate.');
          type='death';
        }
      }
    }

    const supports=chars.filter(x=>x.alive&&x.bias.support>1);
    for(const s of supports){
      const injured=chars.filter(x=>x.alive&&x.hp<x.maxHp*.65).sort((a,b)=>a.hp-b.hp)[0];
      if(injured&&Math.random()<.05){
        const heal=Math.max(1,Math.round(4*s.bias.support+(s.ref.stats?.VOL||0)*.15));
        injured.hp=Math.min(injured.maxHp,injured.hp+heal);
        lines.push(s.name+' estabiliza a '+injured.name+' (+'+heal+' HP).');
        if(type==='normal')type='support';
      }
    }

    if(!lines.length){
      if(activeEnemies.length){
        const aliveCount=chars.filter(x=>x.alive).length;
        lines.push('El combate continúa: '+activeEnemies.length+' goblins activos, '+aliveCount+' aliados en pie.');
      }else{
        lines.push('El grupo mantiene la formación mientras espera la siguiente oleada.');
      }
    }

    events.push(ev(sec,lines.join(' '),type));
    // Instantánea autoritativa por segundo para animaciones sincronizadas.
    frames.push({
      t:sec,
      wave:Math.max(1,waveTimes.filter(t=>t<=sec).length),
      enemiesAlive:activeEnemies.length,
      enemiesDefeated,
      allies:chars.map(x=>({id:x.id,hp:x.hp,maxHp:x.maxHp,shield:x.shield||0,alive:x.alive,damage:x.damage,kills:x.kills})),
      kind:type
    });
  }

  const survivors=chars.filter(x=>x.alive);
  const completed=survivors.length>0 && events.length>=duration;
  if(completed){
    events.push(ev(duration,'El contador alcanza '+fmtSec(duration)+'. El portal de extracción se abre: misión completada.','success'));
  }else{
    const t=Math.min(duration,events.length);
    events.push(ev(t,'La formación ha sido destruida antes de completar el tiempo de supervivencia. Misión fallida.','failure'));
  }

  const damageMetrics=chars.map(x=>({
    id:x.id,name:x.name,damage:x.damage,kills:x.kills,survived:x.alive,
    dps:Math.round((x.damage/Math.max(1,Math.min(duration,events.length)))*10)/10,damagePct:0
  }));
  const xpMetrics=chars.map(x=>({
    id:x.id,name:x.name,kills:x.kills,
    xp:completed?x.kills*killXpForLevels(x.ref.level,mission.enemyLevel||1,mission.baseXpPerKill||0):0
  }));
  const totalDamage=damageMetrics.reduce((a,b)=>a+b.damage,0)||1;
  damageMetrics.forEach(x=>x.damagePct=Math.round(x.damage/totalDamage*1000)/10);

  const rewards={gold:0,wood:0,stone:0,bonusGold:0};
  if(completed){
    rewards.bonusGold=Math.random()<.45?Math.floor(Math.random()*101):0;
    rewards.gold=(mission.fixedGoldReward||0)+rewards.bonusGold;
    rewards.wood=Math.floor(Math.random()*6);
    rewards.stone=Math.floor(Math.random()*5);
  }

  return {
    completed,
    duration:completed?duration:Math.min(duration,events.length),
    enemiesDefeated,totalEnemies,enemyRemaining:activeEnemies.length,
    events,frames,
    survivors:survivors.map(x=>x.id),
    fallen:chars.filter(x=>!x.alive).map(x=>x.id),
    damageMetrics,xpMetrics,rewards
  };
}

export function applyMissionResult(state,result){
  for(const metric of result.damageMetrics||[]){
    const char=(state.characters||[]).find(c=>c.id===metric.id);
    if(!char)continue;
    char.totalKills=(char.totalKills||0)+(metric.kills||0);
    if(metric.survived)char.missionsSurvived=(char.missionsSurvived||0)+1;
  }
  for(const id of result.fallen){
    const char=(state.characters||[]).find(c=>c.id===id);
    if(char)char.dead=true;
  }
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
