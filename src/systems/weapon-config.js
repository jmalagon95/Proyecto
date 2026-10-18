export const WEAPON_RARITY_DAMAGE_MULTIPLIERS={1:1,2:1.35,3:1.75,4:2.25,5:2.90,6:3.75,7:4.90,8:6.50};
export const WEAPON_LEVEL={
  min:1,max:100,damagePerLevelPct:1.8
};
export const WEAPON_ENHANCEMENT={
  min:0,max:15,damagePerLevelPct:4,successRatePct:100,canBreak:false,canDowngrade:false,
  goldBaseByRarity:{1:100,2:180,3:320,4:550,5:900,6:1500,7:2500,8:4000},
  goldLevelFactor:.28,
  levelCostFactor:.015
};
export const SURVIVAL1_WEAPON_DROP={
  chancePerDefeatedEnemy:.10,
  rarityWeights:{1:.94,2:.05,3:.01},
  weaponLevel:1,
  loseAllOnFailure:true
};
