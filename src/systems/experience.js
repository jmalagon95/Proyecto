export const XP_CURVE={base:150,exponent:1.585};
export const XP_LEVEL_SCALING={
  sameLevel:1,
  oneLevelAboveEnemy:.5,
  twoOrMoreLevelsAboveEnemy:0,
  higherLevelEnemyBonusPerLevel:.25,
  maxHigherLevelBonus:2
};

export function xpToNext(level){
  const lv=Math.max(1,Number(level)||1);
  return Math.round(XP_CURVE.base*Math.pow(lv,XP_CURVE.exponent));
}

export function killXpForLevels(characterLevel,enemyLevel,baseXp){
  const c=Math.max(1,Number(characterLevel)||1);
  const e=Math.max(1,Number(enemyLevel)||1);
  const diff=c-e;
  if(diff>=2)return 0;
  if(diff===1)return Math.max(0,Math.floor(baseXp*XP_LEVEL_SCALING.oneLevelAboveEnemy));
  if(diff===0)return Math.max(0,Math.floor(baseXp*XP_LEVEL_SCALING.sameLevel));
  const bonus=Math.min(XP_LEVEL_SCALING.maxHigherLevelBonus,1+Math.abs(diff)*XP_LEVEL_SCALING.higherLevelEnemyBonusPerLevel);
  return Math.max(1,Math.floor(baseXp*bonus));
}

export function normalizeExperience(character){
  if(!Number.isFinite(character.experience))character.experience=0;
  return character.experience;
}

export function grantExperience(character,amount,levelCap){
  normalizeExperience(character);
  let gained=Math.max(0,Number(amount)||0);
  let levelsGained=0;
  const cap=Number(levelCap)||Infinity;
  character.experience+=gained;

  while(character.level<cap){
    const needed=xpToNext(character.level);
    if(character.experience<needed)break;
    character.experience-=needed;
    character.level+=1;
    levelsGained+=1;
  }

  if(character.level>=cap){
    character.level=cap;
    const maxStored=Math.max(0,xpToNext(cap)-1);
    character.experience=Math.min(character.experience,maxStored);
  }

  return {gained,levelsGained,level:character.level,experience:character.experience,next:xpToNext(character.level)};
}
