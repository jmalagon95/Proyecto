import { SURVIVAL1_WEAPON_DROP } from './weapon-config.js';

function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}

export function rollFloor1WeaponDrops(kills,catalogs){
  const drops=[];
  const dropChance=SURVIVAL1_WEAPON_DROP.chancePerDefeatedEnemy;
  const weights=SURVIVAL1_WEAPON_DROP.rarityWeights;

  for(let i=0;i<kills;i++){
    if(Math.random()>=dropChance)continue;

    const roll=Math.random();
    let rarity=1;
    if(roll<weights[3])rarity=3;
    else if(roll<weights[3]+weights[2])rarity=2;

    const catalog=catalogs?.[rarity]||[];
    if(!catalog.length)continue;

    const weapon=structuredClone(pick(catalog));
    weapon.instanceId=crypto.randomUUID();
    weapon.enhancement=0;
    drops.push(weapon);
  }

  return drops;
}
