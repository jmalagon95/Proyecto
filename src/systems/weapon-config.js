export const WEAPON_RARITY_DAMAGE_MULTIPLIERS={1:1,2:1.35,3:1.75,4:2.25,5:90,6:320,7:950,8:2700};
export const WEAPON_RARITY_BONUS_STAT_SLOTS={1:0,2:1,3:1,4:2,5:3,6:4,7:5,8:6};
export const WEAPON_RARITY_PASSIVE_SLOTS={1:0,2:0,3:1,4:1,5:2,6:3,7:4,8:5};
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
