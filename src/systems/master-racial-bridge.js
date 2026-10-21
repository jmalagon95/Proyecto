import {racialTechniqueFor} from './racial-techniques.js';
import {resolveSkill} from './effects.js';
import {loadSkillsForClass} from './content-loader.js';

// Puente para el index.html MONOLÍTICO de Kami No Challenge.
// No modifica las partidas guardadas, no concede automáticamente habilidades U,
// y solo actúa sobre el battle actual mediante su bucle stepLogic.
const cache=new Map();
const wait=new Map();
const runtime=new WeakMap();
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const round=n=>Math.max(0,Math.round(Math.min(Number.MAX_SAFE_INTEGER,Number.isFinite(n)?n:0)));
function getCatalog(name){
  if(cache.has(name))return cache.get(name);
  if(!wait.has(name))wait.set(name,loadSkillsForClass(name)
    .then(items=>{const map=new Map(items.map(x=>[x.id,x]));cache.set(name,map);return map;})
    .catch(error=>{console.warn('[Kami] Catálogo racial no disponible:',name,error);return null})
    .finally(()=>wait.delete(name)));
  return null;
}
function learnedFor(char){
  const learned=Array.isArray(char?.skills)?char.skills:[];
  if(!learned.length)return [];
  const catalog=getCatalog(char.className);
  return learned.map(x=>typeof x==='string'?catalog?.get(x):x&&typeof x==='object'?
    (x.mechanics?.effects?.length?x:catalog?.get(x.id)):null)
    .filter(x=>x&&x.functional&&x.mechanics?.effects?.length);
}
function currentState(u){let st=runtime.get(u);if(!st){st={racialTimer:2,skillTimers:new Map(),shield:0,temporaryHaste:0};runtime.set(u,st)}return st}
function active(b){return (b?.enemies||[]).filter(e=>e.hp>0)}
function companions(b){return (b?.allies||[]).filter(x=>x.hp>0)}
function primaryTarget(b){return active(b).sort((a,c)=>a.hp-c.hp)[0]||null}
function targetUnits(b,type){const enemies=active(b);return type==='area'?enemies.slice(0,3):enemies.slice(0,1)}
function notify(hooks,a,t,title,amount,kind){
  if(!hooks?.animate)return;
  try{hooks.announce?.(a,t,title,round(amount),kind)}catch(error){console.warn('[Kami] Efecto visual:',error)}
}
function hit(b,a,e,amount,hooks,title){
  if(!e||e.hp<=0)return 0;
  const actual=Math.min(round(amount),e.hp);
  e.hp=Math.max(0,e.hp-actual);
  a.damage=(a.damage||0)+actual;
  if(e.hp===0){b.kills=(b.kills||0)+1;a.kills=(a.kills||0)+1}
  notify(hooks,a,e,title,actual,'damage');
  return actual;
}
function applyResults(b,a,skill,results,hooks){
  let spent=0;const enemies=active(b), allies=companions(b);
  const penetration=results.find(e=>e.op==='penetration_pct')?.value||0;
  for(const effect of results){
    if(effect.op==='damage'||effect.op==='bonus_damage_pct_max_hp'){
      for(const enemy of targetUnits(b,effect.target)){
        for(let i=0;i<Math.min(25,Math.max(1,effect.hits||1))&&enemy.hp>0;i++){
          const base=effect.op==='bonus_damage_pct_max_hp'?
            (enemy.maxHp||enemy.hp)*effect.value/100:
            effect.amount*(1+penetration/100)*Math.max(1,effect.critMultiplier||1);
          const execution=effect.executeBelowHpPct&&enemy.hp/enemy.maxHp*100<=effect.executeBelowHpPct?
            Math.max(1,effect.executeBonusMultiplier||1):1;
          const defense=effect.op==='damage'?(enemy.defense||0)*(1-clamp(effect.ignoreDefensePct||0,0,100)/100):0;
          const vuln=enemy.kamiVulnerableUntil>b.elapsed?1+(enemy.kamiVulnerabilityPct||0)/100:1;
          spent+=hit(b,a,enemy,Math.max(1,(base*execution-defense)*vuln),hooks,skill.name);
        }
      }
    }else if(effect.op==='heal'||effect.op==='shield'||effect.op==='haste'){
      const unit=effect.target==='self'?a:allies.sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
      if(!unit)continue;
      const amount=round(effect.amount||0);
      if(effect.op==='heal'){const healed=Math.min(unit.maxHp-unit.hp,amount);unit.hp+=healed;notify(hooks,a,unit,skill.name,healed,'heal')}
      if(effect.op==='shield'){currentState(unit).shield+=amount;notify(hooks,a,unit,skill.name,amount,'shield')}
      if(effect.op==='haste'){unit.cooldown=Math.max(0,unit.cooldown-(effect.value||0));notify(hooks,a,unit,skill.name,0,'haste')}
    }else if(effect.op==='vulnerability'){
      for(const enemy of targetUnits(b,effect.target)){
        enemy.kamiVulnerabilityPct=Math.max(0,effect.value||0);
        enemy.kamiVulnerableUntil=b.elapsed+Math.max(1,effect.durationSeconds||1);
      }
    }
  }
  return spent;
}
function castRacial(b,u,hooks){
  const descriptor=racialTechniqueFor(u.character);
  if(!descriptor)return false;
  const r=currentState(u);
  if(r.racialTimer>0)return false;
  const enemies=active(b), allies=companions(b);
  const skill=descriptor, stat=Math.max(1,Number(u.character.stats?.[skill.stat]||1));
  const base=round(stat*.65+Number(u.character.level||1)*.45);
  if(skill.kind==='heal'&&!allies.some(x=>x.hp<x.maxHp))return false;
  r.racialTimer=Math.max(1,skill.cooldownSeconds);
  const foe=primaryTarget(b);
  const weak=allies.sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];
  if(skill.kind==='heal'){
    const healed=Math.min(weak.maxHp-weak.hp,base*2);weak.hp+=healed;notify(hooks,u,weak,skill.name,healed,'heal');
  }else if(['shield','guard','evade'].includes(skill.kind)){
    currentState(weak).shield+=base*2;notify(hooks,u,weak,skill.name,base*2,'shield');
  }else if(skill.kind==='haste'){
    const fastest=[...allies].sort((a,c)=>c.attack-a.attack)[0];if(fastest)fastest.cooldown=Math.max(0,fastest.cooldown-.5);
    hit(b,u,foe,base,hooks,skill.name);
  }else if(['chain','multi'].includes(skill.kind)){
    for(const e of active(b).slice(0,3))hit(b,u,e,base*(skill.kind==='chain'?.8:.55),hooks,skill.name);
  }else{
    const factor=skill.kind==='colossus'?2.15:skill.kind==='pierce'||skill.kind==='guardbreak'?1.75:
      skill.kind==='execute'&&foe.hp/foe.maxHp<.45?2.3:skill.kind==='mark'?.8:1.3;
    hit(b,u,foe,base*factor,hooks,skill.name);
    if(skill.kind==='mark'){foe.kamiVulnerableUntil=b.elapsed+2;foe.kamiVulnerabilityPct=12}
  }
  return true;
}
function tick(b,dt,hooks={}){
  if(!b||b.ended||!Array.isArray(b.allies)||!Array.isArray(b.enemies)||!Number.isFinite(dt)||dt<=0)return;
  for(const u of b.allies){
    if(!u?.character||u.hp<=0)continue;
    const s=currentState(u);
    s.racialTimer-=dt;
    for(const [id,remaining] of s.skillTimers)s.skillTimers.set(id,remaining-dt);
    if(active(b).length&&castRacial(b,u,hooks))hooks.log?.(u.name+' activa una técnica racial.');
    for(const skill of learnedFor(u.character)){
      if(!active(b).length)break;
      if((s.skillTimers.get(skill.id)||0)>0)continue;
      const cast=resolveSkill(skill,u.character,primaryTarget(b));
      if(!cast.ok)continue;
      s.skillTimers.set(skill.id,Math.max(1,Number(cast.cooldownSeconds)||6));
      applyResults(b,u,skill,cast.results,hooks);
      hooks.log?.(u.name+' ejecuta '+skill.name+' ['+skill.rank+'].');
      break; // Máximo una habilidad equipada por personaje y pulso.
    }
  }
}
function absorb(u,amount){
  const r=currentState(u),damage=Math.max(0,Number(amount)||0);
  const absorbed=Math.min(r.shield,damage);
  r.shield-=absorbed;
  return {absorbed,remaining:Math.max(0,damage-absorbed)};
}
window.KamiRacialSkills={tick,absorb,getCatalog,version:4};
console.info('[Kami] Puente racial v4 listo para el combate maestro');
