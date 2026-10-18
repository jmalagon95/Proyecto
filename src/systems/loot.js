import { SURVIVAL1_WEAPON_DROP } from './weapon-config.js';
import { setWeaponLevel } from './weapon-upgrade.js';
import { allowedClassesForWeaponFamily } from './weapon-classes.js';

const cache=new Map();

const FALLBACK_FAMILIES=[
  ['Espada',1,3,5],['Mandoble',2,5,8],['Estoque',1,2,5],['Daga',1,2,4],
  ['Hacha',1,3,6],['Maza',1,3,6],['Lanza',1,3,6],['Alabarda',2,5,8],
  ['Arco',2,3,6],['Ballesta',2,4,7],['Bastón',2,2,4],['Varita',1,1,3]
];
const RARITY_MULT={1:1,2:5,3:15,4:50,5:150,6:450,7:1100,8:2700};

function fallbackCatalog(rarity){
  const mult=RARITY_MULT[rarity]||1;
  return FALLBACK_FAMILIES.flatMap(([name,hands,min,max],fi)=>
    Array.from({length:10},(_,i)=>({
      id:`W${rarity}-FALLBACK-${fi+1}-${i+1}`,
      name:`${name} ${String(i+1).padStart(2,'0')}${rarity>1?' ★'+rarity:''}`,
      rarity,level:1,enhancement:0,category:'weapon',familyName:name,hands,
      baseDamage:{min:Math.max(1,Math.round(min*mult)),max:Math.max(1,Math.round(max*mult))},
      damage:{min:Math.max(1,Math.round(min*mult)),max:Math.max(1,Math.round(max*mult))},
      allowedClasses:allowedClassesForWeaponFamily(name)
    }))
  );
}

async function loadCatalog(rarity){
  if(cache.has(rarity))return cache.get(rarity);
  try{
    const data=await fetch('/data/generated/equipment/weapons-star'+rarity+'.json').then(r=>{
      if(!r.ok)throw new Error('No se pudo cargar el catálogo de armas ★'+rarity);
      return r.json();
    });
    const items=data.items||[];
    cache.set(rarity,items);
    return items;
  }catch{
    const items=fallbackCatalog(rarity);
    cache.set(rarity,items);
    return items;
  }
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
