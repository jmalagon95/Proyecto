// Motor de acciones compartido: tiempo real, GCD, lanzamiento y enfriamiento propio.
// Cooldowns independientes; AGI reduce el tiempo de ejecución con límite.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:lo));
export function cooldownReduction(character={}){
  let pct=Number(character.cooldownPct||0);
  for(const passive of character.passives||[]){
    if(passive?.functional===false)continue;
    for(const effect of passive?.mechanics?.effects||[]){
      if(effect.op==='cooldown_pct')pct+=Number(effect.value)||0;
    }
  }
  // En el catálogo anterior, la reducción aparecía como valor negativo.
  // Ambos signos se normalizan aquí para evitar que las pasivas aumenten el CD.
  return clamp(Math.abs(pct),0,40);
}
export function actionDuration(skill={},character={}){
  const base=Number(skill.mechanics?.timeCostSeconds??skill.timeCostSeconds??.85);
  const agility=Math.max(0,Number(character.stats?.AGI||0));
  const speedup=clamp(agility/400,0,.3);
  return clamp(base*(1-speedup),.25,15);
}
export function skillCooldown(skill={},character={}){
  const original=Math.max(1,Number(skill.mechanics?.cooldownSeconds??skill.cooldownSeconds??6));
  return Math.max(1,original*(1-cooldownReduction(character)/100));
}
export function newActionState(){
  return {global:0,castRemaining:0,pending:null,individual:new Map(),racialRemaining:2};
}
export function advanceActionState(s,dt){
  const t=Math.max(0,Number(dt)||0);
  s.global=Math.max(0,s.global-t);s.castRemaining=Math.max(0,s.castRemaining-t);
  s.racialRemaining=Math.max(0,s.racialRemaining-t);
  for(const [id,remaining] of s.individual){
    const next=remaining-t;
    if(next<=0)s.individual.delete(id);else s.individual.set(id,next);
  }
  if(s.pending&&s.castRemaining<=0){const completed=s.pending;s.pending=null;return completed;}
  return null;
}
export function canStartAction(s,skill){
  return !s.pending&&s.global<=0&&(s.individual.get(skill.id)||0)<=0;
}
export function startAction(s,skill,character,{racial=false}={}){
  if(!canStartAction(s,skill))return false;
  const time=actionDuration(skill,character);
  s.castRemaining=time;
  s.pending={skill,character};
  s.global=Math.max(.6,Math.min(1,time*.55));
  s.individual.set(skill.id,skillCooldown(skill,character));
  if(racial)s.racialRemaining=skillCooldown(skill,character);
  return true;
}
export function skillPriority(skill,actor={},allies=[],enemies=[]){
  const effects=skill.mechanics?.effects||[];
  if(!enemies.some(e=>e.hp>0))return -Infinity;
  const alive=allies.filter(a=>a.hp>0);
  const weak=alive.reduce((m,a)=>Math.min(m,a.hp/Math.max(1,a.maxHp)),1);
  const hostile=enemies.filter(e=>e.hp>0);
  const target=hostile.reduce((best,e)=>!best||e.hp/Math.max(1,e.maxHp)<best.hp/Math.max(1,best.maxHp)?e:best,null);
  const lost=1-weak;
  const heal=effects.some(e=>e.op==='heal');
  const guard=effects.some(e=>e.op==='shield');
  const haste=effects.some(e=>e.op==='haste');
  const attacks=effects.filter(e=>['damage','summon_strike','bonus_damage_pct_max_hp'].includes(e.op));
  if(heal&&lost<.04&&!attacks.length)return -Infinity;
  if(guard&&lost<.18&&!attacks.length&&hostile.length<3)return -Infinity;
  let score=15;
  if(heal)score+=lost*125;
  if(guard)score+=lost*35+hostile.length*4;
  if(haste)score+=alive.length*7;
  if(attacks.length){
    score+=Math.min(60,attacks.reduce((a,e)=>a+Math.log10(Math.max(1,e.multiplier||e.value||1))*12,0));
    if(effects.some(e=>e.target==='area'))score+=Math.min(5,hostile.length)*9;
    if(effects.some(e=>e.executeBelowHpPct))score+=target&&target.hp/target.maxHp<.5?35:-5;
    if(effects.some(e=>e.op==='bonus_damage_pct_max_hp'))score+=target&&target.maxHp>100?17:2;
  }
  // Favorece la decisión útil frente a lanzar sistemáticamente la habilidad U.
  score-=Math.max(0,actionDuration(skill,actor)-1)*3;
  return score;
}
export function selectCombatSkill(skills,state,actor,allies,enemies){
  return skills.filter(s=>s&&s.functional!==false&&s.mechanics?.effects?.length&&canStartAction(state,s))
    .map(s=>({s,score:skillPriority(s,actor,allies,enemies)}))
    .filter(x=>Number.isFinite(x.score))
    .sort((a,b)=>b.score-a.score||String(a.s.id).localeCompare(String(b.s.id)))[0]?.s||null;
}
