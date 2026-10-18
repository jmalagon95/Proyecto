import progression from '../../data/equipment/weapon_progression.json' with { type: 'json' };

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
  const p=progression.survival1Drop.rarityWithinWeaponDrop;
  if(r<(p['3']||0))return 3;
  if(r<(p['3']||0)+(p['2']||0))return 2;
  return 1;
}

function cloneDrop(template){
  return {
    ...structuredClone(template),
    instanceId:crypto.randomUUID(),
    enhancement:0,
    source:'survival1_enemy_drop'
  };
}

export async function rollSurvival1WeaponDrops(defeatedEnemies){
  const chance=progression.survival1Drop.weaponDropChancePerDefeatedEnemy;
  const rarities=[];
  for(let i=0;i<defeatedEnemies;i++){
    if(Math.random()<chance)rarities.push(rollRarity());
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
  return drops;
}
