import { killXpForLevels, grantExperience } from './experience.js';
import { levelCap } from './progression.js';
import { attackProfile, characterMaxHp, damageAfterDefense } from './combat-stats.js';
import { createEnemyCharacter } from './stat-gacha.js';
import { executeRacialTechnique } from './racial-techniques.js';
import { resolveSkill } from './effects.js';
import {racialTechniqueFor} from './racial-techniques.js';
import {newActionState,advanceActionState,startAction,selectCombatSkill} from './combat-cooldowns.js';

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
      bias:roleBias(c),attack,attackAccumulator:0,shield:0,nextSkillAt:0,nextRacialAt:0,actionState:newActionState()
    };
  });

  // No existen HP, DEF ni ataque fijos en enemigos: cada goblin nace del gacha ★1.
  const enemyStar=Math.max(1,Number(mission.enemyStar||1));
  const enemyLevel=Math.max(1,Number(mission.enemyLevel||1));
  const enemyFactory=mission.enemyFactory||(()=>createEnemyCharacter({name:'Goblin',star:enemyStar,level:enemyLevel}));
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
      for(let e=0;e<waves[wi];e++){
        const char=enemyFactory();
        const hp=characterMaxHp(char);
        activeEnemies.push({ref:char,hp,maxHp:hp,attack:attackProfile(char),attackAccumulator:0});
      }
      lines.push('Oleada '+(wi+1)+': aparecen '+waves[wi]+' goblins Nv.'+(mission.enemyLevel||1)+'.');
      type='wave';
    }

    const living=chars.filter(x=>x.alive);
    let killsThisSecond=0;
    let damageThisSecond=0;

    // Scheduler común: cada segundo descuenta GCD, preparación y CD propios.
    for(const actor of living){
      if(!actor.alive)continue;
      const st=actor.actionState;
      const completed=advanceActionState(st,1);
      if(completed&&activeEnemies.length){
        if(completed.skill._racial){
          const racial=executeRacialTechnique(actor,chars,activeEnemies,sec);
          if(racial){
            actor.damage+=racial.damage;actor.kills+=racial.kills;
            enemiesDefeated+=racial.kills;killsThisSecond+=racial.kills;damageThisSecond+=racial.damage;
            activeEnemies.splice(0,activeEnemies.length,...activeEnemies.filter(e=>e.hp>0));
            lines.push(actor.name+' ejecuta '+racial.skill+'.');type='combat';
          }
        }else{
          const learned=completed.skill;
          const action=resolveSkill(learned,actor.ref,activeEnemies[0]);
          if(action.ok){
            const penetration=action.results.find(e=>e.op==='penetration_pct')?.value||0;
          for(const e of action.results){
            if(e.op==='damage'||e.op==='bonus_damage_pct_max_hp'){
              const targets=e.target==='area'?activeEnemies.slice(0,3):activeEnemies.slice(0,1);
              for(const target of targets){
                const hits=e.op==='damage'?Math.min(25,Math.max(1,e.hits||1)):1;
                for(let hit=0;hit<hits&&target.hp>0;hit++){
                  let amount;
                  if(e.op==='bonus_damage_pct_max_hp'){
                    amount=Math.round((target.maxHp||target.hp)*Math.max(0,e.value||0)/100);
                  }else{
                    amount=e.amount*(1+penetration/100);
                    amount*=Math.max(1,e.critMultiplier||1);
                    if(e.executeBelowHpPct&&target.hp/target.maxHp*100<=e.executeBelowHpPct)
                      amount*=Math.max(1,e.executeBonusMultiplier||1);
                    const mitigation=(target.ref?.stats?.DEF||0)*(1-Math.min(100,e.ignoreDefensePct||0)/100);
                    amount=damageAfterDefense(amount,mitigation);
                    if(target.vulnerableUntil>sec)amount=Math.round(amount*(1+(target.vulnerablePct||0)/100));
                  }
                  const dealt=Math.min(target.hp,Math.max(1,amount));
                  target.hp-=dealt;actor.damage+=dealt;damageThisSecond+=dealt;
                  if(target.hp<=0){actor.kills++;enemiesDefeated++;killsThisSecond++;}
                }
              }
            }else if(e.op==='heal'||e.op==='shield'||e.op==='haste'){
              const target=chars.filter(x=>x.alive).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
              if(target){
                if(e.op==='heal')target.hp=Math.min(target.maxHp,target.hp+e.amount);
                if(e.op==='shield')target.shield+=e.amount;
                if(e.op==='haste')target.attackAccumulator=Math.min(2,target.attackAccumulator+e.value);
              }
            }else if(e.op==='vulnerability'){
              for(const target of (e.target==='area'?activeEnemies.slice(0,3):activeEnemies.slice(0,1))){
                target.vulnerablePct=Math.max(target.vulnerablePct||0,e.value);
                target.vulnerableUntil=sec+Math.max(1,e.durationSeconds||1);
              }
            }
          }
            activeEnemies.splice(0,activeEnemies.length,...activeEnemies.filter(e=>e.hp>0));
            lines.push(actor.name+' ejecuta '+learned.name+'.');type='combat';
          }
        }
      }
      if(!activeEnemies.length||st.pending||st.global>0)continue;
      const rawSkills=(actor.ref.skills||[]).filter(sk=>sk?.functional&&sk?.mechanics?.effects?.length);
      const descriptor=racialTechniqueFor(actor.ref);
      const racial=descriptor&&st.racialRemaining<=0?{
        ...descriptor,_racial:true,functional:true,
        mechanics:{cooldownSeconds:descriptor.cooldownSeconds,timeCostSeconds:.75,
          effects:[{op:descriptor.kind==='heal'?'heal':descriptor.kind==='guard'||descriptor.kind==='shield'||descriptor.kind==='evade'?'shield':'damage',multiplier:1}]}
      }:null;
      const skill=selectCombatSkill([...rawSkills,...(racial?[racial]:[])],
        st,actor.ref,chars.filter(x=>x.alive),activeEnemies);
      if(skill&&startAction(st,skill,actor.ref)){
        lines.push(actor.name+' prepara '+skill.name+'.');type='combat';
      }
    }
    for(const a of living){
      if(!activeEnemies.length)break;
      if(a.actionState.pending)continue; // Ejecutando una habilidad: no ataca a la vez.
      a.attackAccumulator+=Math.max(.01,a.attack.attacksPerFiveSeconds/5);
      while(a.attackAccumulator>=1&&activeEnemies.length){
        a.attackAccumulator-=1;
        const variance=.88+Math.random()*.24;
        const target=activeEnemies[0];
        let dmg=damageAfterDefense(a.attack.averageHit*a.bias.damage*variance,target.ref.stats.DEF);
        if(target.vulnerableUntil>sec)dmg=Math.round(dmg*(1+(target.vulnerablePct||0)/100));
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
      // Cada goblin ataca según AGI, FUE y arma, igual que los personajes del grupo.
      for(const enemy of activeEnemies){
        enemy.attackAccumulator+=Math.max(.01,enemy.attack.attacksPerFiveSeconds/5)*enemyPressure;
        while(enemy.attackAccumulator>=1){
          enemy.attackAccumulator-=1;
          const candidates=chars.filter(x=>x.alive);
          if(!candidates.length)break;
          const target=candidates[Math.floor(Math.random()*candidates.length)];
          const raw=enemy.attack.averageHit*(.88+Math.random()*.24);
          const incoming=damageAfterDefense(raw,target.ref.stats?.DEF||0);
          const absorbed=Math.min(target.shield||0,incoming);
          target.shield=Math.max(0,(target.shield||0)-absorbed);
          target.hp=Math.max(0,target.hp-incoming+absorbed);
          if(target.hp<=0&&target.alive){target.alive=false;lines.push(target.name+' cae en combate.');type='death';}
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
