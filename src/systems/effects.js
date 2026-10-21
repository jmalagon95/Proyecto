export function conditionMet(trigger,ctx={}){
  switch(trigger){
    case 'always': return true;
    case 'hp_below_50': return (ctx.hpRatio??1)<.5;
    case 'hp_above_80': return (ctx.hpRatio??1)>.8;
    case 'on_hit': return ctx.event==='hit';
    case 'on_crit': return ctx.event==='crit';
    case 'on_dodge': return ctx.event==='dodge';
    case 'on_kill': return ctx.event==='kill';
    case 'after_skill': return ctx.event==='after_skill';
    case 'near_ally': return (ctx.nearbyAllies??0)>0;
    case 'when_outnumbered': return (ctx.enemies??0)>(ctx.allies??0);
    default:return false;
  }
}

export function applyPassiveEffects(base,passive,ctx={}){
  const out={...base};
  if(!passive?.functional||!conditionMet(passive.mechanics?.trigger||'always',ctx))return out;
  for(const e of passive.mechanics?.effects||[]){
    if(e.op==='stat_pct'&&e.stat)out[e.stat]=(out[e.stat]||0)*(1+e.value/100);
    else if(e.op==='weapon_damage_pct')out.weaponDamagePct=(out.weaponDamagePct||0)+e.value;
    else if(e.op==='class_damage_pct')out.classDamagePct=(out.classDamagePct||0)+e.value;
    else if(e.op==='skill_tag_damage_pct')out.skillTagDamagePct=(out.skillTagDamagePct||0)+e.value;
    else if(e.op==='accuracy_pct')out.accuracyPct=(out.accuracyPct||0)+e.value;
    else if(e.op==='cooldown_pct')out.cooldownPct=(out.cooldownPct||0)+e.value;
    else if(e.op==='resistance_pct'){
      out.resistances={...(out.resistances||{})};
      out.resistances[e.element]=(out.resistances[e.element]||0)+e.value;
    }
  }
  return out;
}

export function resolveSkill(skill,actor,target,ctx={}){
  if(!skill?.functional)return {ok:false,reason:'Habilidad no funcional'};
  const results=[];
  for(const e of skill.mechanics?.effects||[]){
    if(e.op==='damage'){
      const stat=Number(actor.stats?.[e.scalingStat]||0);
      let amount=Math.max(1,Math.round(stat*e.multiplier));
      amount=Math.round(amount*(1+(ctx.classDamagePct||0)/100)*(1+(ctx.skillTagDamagePct||0)/100));
      results.push({op:'damage',amount,hits:Math.min(25,Math.max(1,e.hits||1)),ignoreDefensePct:Math.max(0,Math.min(100,e.ignoreDefensePct||0)),critMultiplier:Math.max(1,e.critMultiplier||1),executeBelowHpPct:e.executeBelowHpPct||0,executeBonusMultiplier:e.executeBonusMultiplier||1,target:e.target||skill.mechanics.target});
    }else if(e.op==='summon_strike'){
      const stat=Math.max(0,Number(actor.stats?.[e.scalingStat]||0));
      results.push({op:'damage',amount:Math.max(1,Math.round(stat*e.multiplier)),hits:Math.min(25,Math.max(1,e.hits||1)),target:e.target||'single',source:'avatar'});
    }else if(e.op==='bonus_damage_pct_max_hp'){
      results.push({op:'bonus_damage_pct_max_hp',value:Math.max(0,e.value||0),target:e.target||'single'});
    }else if(e.op==='vulnerability'){
      results.push({op:'vulnerability',value:Math.max(0,e.value||0),durationSeconds:Math.max(1,e.durationSeconds||1),target:e.target||'single'});
    }else if(e.op==='haste'){
      results.push({op:'haste',value:Math.max(0,e.value||0),target:e.target||'ally'});
    }else if(e.op==='heal'){
      const stat=Number(actor.stats?.[e.scalingStat]||0);
      results.push({op:'heal',amount:Math.max(1,Math.round(stat*e.multiplier)),target:e.target||'ally'});
    }else if(e.op==='shield'){
      const stat=Number(actor.stats?.[e.scalingStat]||0);
      results.push({op:'shield',amount:Math.max(1,Math.round(stat*e.multiplier)),target:e.target||'self'});
    }else if(e.op==='penetration_pct')results.push({op:'penetration_pct',value:e.value});
    else if(e.op==='summon_boost_pct')results.push({op:'summon_boost_pct',value:e.value});
  }
  return {ok:true,skillId:skill.id,cooldownSeconds:skill.mechanics.cooldownSeconds,timeCostSeconds:skill.mechanics.timeCostSeconds,results};
}
