import { SURVIVAL1_WEAPON_DROP } from './weapon-config.js';
import { setWeaponLevel } from './weapon-upgrade.js';

const cache=new Map();

async function loadCatalog(rarity){
  if(cache.has(rarity))return cache.get(rarity);
  const data=await fetch('/data/generated/equipment/weapons-star'+rarity+'.json').then(r=>{
    if(!r.ok)throw new Error('No se pudo cargar el catálogo de armas ★'+rarity);
    return r.json();
  });
  cache.set(rarity,data.items||[]);
  return data.items||[];
}

function rollRarity(){
  const r=Math.random();
  const p=SURVIVAL1_WEAPON_DROP.rarityWeights;
  if(r<(p[3]||0))return 3;
  if(r<(p[3]||0)+(p[2]||0))return 2;
  return 1;
}

function cloneDrop(template){
  const drop={
    ...structuredClone(template),
    instanceId:crypto.randomUUID(),
    enhancement:0,
    level:SURVIVAL1_WEAPON_DROP.weaponLevel||1,
    source:'survival1_enemy_drop'
  };
  return setWeaponLevel(drop,drop.level);
}

export async function rollSurvival1WeaponDrops(defeatedEnemies){
  const rarities=[];
  for(let i=0;i<defeatedEnemies;i++){
    if(Math.random()<SURVIVAL1_WEAPON_DROP.chancePerDefeatedEnemy)rarities.push(rollRarity());
  }
  const results=[];
  for(const rarity of rarities){
    const catalog=await loadCatalog(rarity);
    if(!catalog.length)continue;
    results.push(cloneDrop(catalog[Math.floor(Math.random()*catalog.length)]));
  }
  return results;
}

export function applyWeaponDrops(state,drops,missionCompleted){
  if(!missionCompleted)return [];
  state.inventory=state.inventory||[];
  state.inventory.push(...drops);
  state.ui=state.ui||{};
  state.ui.newItemIds=state.ui.newItemIds||[];
  for(const item of drops){const id=item.instanceId||item.id;if(id&&!state.ui.newItemIds.includes(id))state.ui.newItemIds.push(id);}
  return drops;
}
