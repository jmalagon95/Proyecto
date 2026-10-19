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
  return Math.max(35,55+Number(s.CON||0)*7+Number(s.DEF||0)*3+(Number(character?.level||1)-1)*5);
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

  const role=String(character?.role||'').toLowerCase();
  const roleDamage=/dps|daño|ranger|asesino|duelista|segador|mago/.test(role)?1.10:/defensor|tanque/.test(role)?.88:1;
  const averageHit=Math.max(1,(primary*1.25+weaponDamage+level*.7+star*.5)*roleDamage);
  const attacksPerFiveSeconds=speed;
  const dps=averageHit*attacksPerFiveSeconds/5;
  return {averageHit,attacksPerFiveSeconds,dps,weaponDamage,primary};
}

export function estimatedDps(character){
  return Math.round(attackProfile(character).dps*10)/10;
}
