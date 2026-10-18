function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}

export function rollFloor1WeaponDrops(kills,catalogs,config){
  const drops=[];
  const dropChance=config?.rollPerDefeatedEnemy??0.10;
  const rarityWeights=config?.rarityWithinSuccessfulWeaponDrop||{1:.94,2:.05,3:.01};
  for(let i=0;i<kills;i++){
    if(Math.random()>=dropChance)continue;
    const r=Math.random();
    let rarity=1;
    if(r<rarityWeights[3])rarity=3;
    else if(r<rarityWeights[3]+rarityWeights[2])rarity=2;
    const catalog=catalogs?.[rarity]||[];
    if(!catalog.length)continue;
    const template=structuredClone(pick(catalog));
    template.instanceId=crypto.randomUUID();
    template.enhancement=0;
    drops.push(template);
  }
  return drops;
}
