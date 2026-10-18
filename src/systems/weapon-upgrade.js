import { WEAPON_ENHANCEMENT, WEAPON_LEVEL } from './weapon-config.js';

export const MAX_WEAPON_ENHANCEMENT=WEAPON_ENHANCEMENT.max;
export const MAX_WEAPON_LEVEL=WEAPON_LEVEL.max;

export function weaponLevelMultiplier(level){
  const lv=Math.max(WEAPON_LEVEL.min,Math.min(MAX_WEAPON_LEVEL,Number(level)||WEAPON_LEVEL.min));
  return 1+((lv-1)*WEAPON_LEVEL.damagePerLevelPct/100);
}

export function enhancementMultiplier(level){
  const lv=Math.max(0,Math.min(MAX_WEAPON_ENHANCEMENT,Number(level)||0));
  return 1+(lv*WEAPON_ENHANCEMENT.damagePerLevelPct/100);
}

export function weaponUpgradeCost(weapon){
  const rarity=Number(weapon.rarity)||1;
  const current=Math.max(0,Number(weapon.enhancement)||0);
  if(current>=MAX_WEAPON_ENHANCEMENT)return 0;
  const base=WEAPON_ENHANCEMENT.goldBaseByRarity[rarity]||100;
  const weaponLevel=Math.max(1,Number(weapon.level)||1);
  return Math.round(base*(1+current*WEAPON_ENHANCEMENT.goldLevelFactor)*(1+(weaponLevel-1)*WEAPON_ENHANCEMENT.levelCostFactor));
}

export function recalculateWeapon(weapon){
  weapon.level=Math.max(1,Math.min(MAX_WEAPON_LEVEL,Number(weapon.level)||1));
  const mult=weaponLevelMultiplier(weapon.level)*enhancementMultiplier(weapon.enhancement||0);
  const base=weapon.baseDamage||weapon.damage||{min:0,max:0};
  weapon.damage={
    min:Math.max(0,Math.round(base.min*mult)),
    max:Math.max(0,Math.round(base.max*mult))
  };
  if(weapon.baseMagicPower||weapon.magicPower){
    const mp=weapon.baseMagicPower||weapon.magicPower;
    weapon.magicPower={
      min:Math.max(0,Math.round(mp.min*mult)),
      max:Math.max(0,Math.round(mp.max*mult))
    };
  }
  return weapon;
}

export function setWeaponLevel(weapon,level){
  weapon.level=Math.max(1,Math.min(MAX_WEAPON_LEVEL,Number(level)||1));
  return recalculateWeapon(weapon);
}

export function upgradeWeapon(state,weapon){
  const current=Math.max(0,Number(weapon.enhancement)||0);
  if(current>=MAX_WEAPON_ENHANCEMENT)return {ok:false,reason:'El arma ya está en +15.'};
  const cost=weaponUpgradeCost(weapon);
  if((state.resources?.gold||0)<cost)return {ok:false,reason:'No tienes suficiente oro.',cost};
  state.resources.gold-=cost;
  weapon.enhancement=current+1;
  recalculateWeapon(weapon);
  return {ok:true,cost,newLevel:weapon.enhancement,weapon};
}
