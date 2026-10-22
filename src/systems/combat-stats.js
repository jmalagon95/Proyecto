function speedMultiplier(speed='media'){
  const s=String(speed).toLowerCase();
  if(s.includes('muy rápida')||s.includes('muy rapida'))return 1.45;
  if(s.includes('rápida')||s.includes('rapida'))return 1.25;
  if(s.includes('muy lenta'))return .58;
  if(s.includes('media-lenta')||s.includes('media lenta'))return .82;
  if(s.includes('lenta'))return .70;
  return 1;
}

function weaponEntries(character){
  const eq=character?.equipment||{};
  const list=[];
  const left=eq.leftHand;
  const right=eq.rightHand;
  if(left&&!left.twoHandedMirror)list.push(left);
  if(right&&!right.twoHandedMirror&&right!==left)list.push(right);
  return list.filter(x=>x?.category==='weapon');
}

export function primaryCombatStat(character){
  const s=character?.stats||{};
  const role=String(character?.role||'').toLowerCase();
  if(/mago|mágico|magico|invocador|sanación|sanacion|apoyo/.test(role))return Number(s.INT||0);
  if(/ranger|distancia|móvil|movil|asesino|duelista|pícaro|picaro/.test(role))return Number(s.AGI||0);
  return Number(s.FUE||0);
}

export function characterMaxHp(character){
  const s=character?.stats||{};
  return Math.max(1,20+Number(s.CON||0)*3+(Number(character?.level||1)-1)*2);
}

export function attackProfile(character){
  const weapons=weaponEntries(character);
  const primary=primaryCombatStat(character);
  const level=Number(character?.level||1);
  const star=Number(character?.currentStar||1);

  let weaponDamage=1;
  let speed=1;
  if(weapons.length){
    const main=weapons[0];
    const mainAvg=((main.damage?.min??main.baseDamage?.min??1)+(main.damage?.max??main.baseDamage?.max??1))/2;
    weaponDamage=mainAvg;
    speed=speedMultiplier(main.speed);
    if(weapons.length>1){
      const off=weapons[1];
      const offAvg=((off.damage?.min??off.baseDamage?.min??1)+(off.damage?.max??off.baseDamage?.max??1))/2;
      weaponDamage+=offAvg*.6;
      speed=(speed+speedMultiplier(off.speed))/2;
    }
  }

  const averageHit=Math.max(1,(primary*1.25+weaponDamage+level*.7+star*.5));
  const attacksPerFiveSeconds=speed;
  const dps=averageHit*attacksPerFiveSeconds/5;
  return {averageHit,attacksPerFiveSeconds,dps,weaponDamage,primary};
}

export function estimatedDps(character){
  return Math.round(attackProfile(character).dps*10)/10;
}

// DEF es exclusivamente mitigación de daño. La CON no interviene aquí.
export function damageAfterDefense(rawDamage,defense=0){
  const d=Math.max(0,Number(defense)||0);
  return Math.max(1,Math.round(Math.max(0,rawDamage)*100/(100+d)));
}

// ───────────────────────────────────────────────────────────────
// REGLAS DE COMBATE v0.18 · fuente única
// El maestro (index.html, KAMI_COMBAT_RULES_V18), las técnicas raciales
// y la Torre usan exactamente estas fórmulas:
//   VIDA     = 20 + CON·3 + 2 por nivel
//   ATAQUE   = 10 + atributo principal·1,6 + 1,2 por nivel + 1,5 por estrella
//              principal: FUE tanques; INT magia/apoyo/sanación/invocación/control;
//              AGI tiradores/duelistas/precisión; FUE el resto (y goblins)
//   DEFENSA  = daño × 100 / (100 + DEF·6)      (DEF 5 → −23 %, DEF 10 → −38 %)
//   VELOCIDAD= un ataque cada máx(0,6 s, 1,45 − AGI·0,035)
//   ESQUIVA/PARADA/BLOQUEO: combat-defense.js (AGI y equipo)
// ───────────────────────────────────────────────────────────────
export function rulePrimaryStat(stats={},role=''){
  const r=String(role||'').toLowerCase();
  if(/tanque|defens|protector/.test(r))return Math.max(0,Number(stats.FUE)||0);
  if(/m[aá]gic|mago|invoca|sana|apoyo|support|control|especialista/.test(r))return Math.max(0,Number(stats.INT)||0);
  if(/ranger|tirador|distancia|duelista|asesino|precisi/.test(r))return Math.max(0,Number(stats.AGI)||0);
  return Math.max(0,Number(stats.FUE)||0);
}
export function ruleMaxHp(stats={},level=1){return Math.max(1,20+Math.max(0,Number(stats.CON)||0)*3+(Math.max(1,level)-1)*2)}
export function ruleAttack(stats={},level=1,star=1,role=''){
  return 10+rulePrimaryStat(stats,role)*1.6+(Math.max(1,level)-1)*1.2+(Math.max(1,star)-1)*1.5;
}
export function ruleMitigate(raw,defense=0){return Math.max(1,Math.round(Math.max(0,raw)*100/(100+Math.max(0,Number(defense)||0)*6)))}
export function ruleAttackInterval(stats={}){return Math.max(.6,1.45-Math.max(0,Number(stats.AGI)||0)*.035)}
