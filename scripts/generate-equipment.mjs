import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const source=JSON.parse(fs.readFileSync(path.join(root,'data/equipment/weapon_families_star1.json'),'utf8'));
const progression=JSON.parse(fs.readFileSync(path.join(root,'data/equipment/weapon_progression.json'),'utf8'));
const outDir=path.join(root,'data/generated/equipment');
fs.mkdirSync(outDir,{recursive:true});

const prefixes=['Oxidado','Mellado','Astillado','Gastado','Remendado','Rudimentario','Viejo','Mal Forjado','Deslucido','Improvisado'];
const nouns={
  sword_1h:['Espada de recluta','Espada de milicia','Hoja corta','Espada de hierro pobre','Espada de guardia','Espada de campaña','Espada de frontera','Espada vulgar','Espada de soldado','Espada de viaje'],
  greatsword_2h:['Mandoble tosco','Gran espada de hierro','Mandoble de milicia','Espada pesada','Hoja de dos manos','Gran hoja de campaña','Mandoble de frontera','Espadón basto','Gran espada de recluta','Mandoble de hierro pobre'],
  rapier_1h:['Estoque simple','Sable estrecho','Estoque de recluta','Espada de duelo pobre','Sable ligero','Estoque de milicia','Hoja de duelo','Estoque desgastado','Sable de campaña','Estoque ordinario'],
  dagger_1h:['Daga común','Cuchillo de combate','Daga de recluta','Puñal corto','Daga mellada','Cuchillo de milicia','Daga de frontera','Puñal ordinario','Daga ligera','Cuchillo de campaña'],
  axe_1h:['Hacha de mano','Hacha de leñador','Hacha de recluta','Hacha de milicia','Hacha de frontera','Hacha de hierro pobre','Hacha corta','Hacha de campaña','Hacha vulgar','Hacha de soldado'],
  throwing_axe:['Hacha arrojadiza ligera','Hacha arrojadiza de milicia','Hacha arrojadiza tosca','Hacha de lanzamiento pobre','Hacha de vuelo corta','Hacha de lanzamiento simple','Hacha arrojadiza ordinaria','Hacha de cazador pobre','Hacha de vuelo mellada','Hacha de lanzamiento gastada'],
  mace_1h:['Maza simple','Maza de hierro pobre','Maza de milicia','Maza de recluta','Maza corta','Maza de campaña','Maza vulgar','Maza de frontera','Maza pesada de mano','Maza remachada'],
  heavy_club_2h:['Kanabō tosco','Garrote pesado reforzado','Maza pesada de dos manos','Kanabō de hierro pobre','Garrote de guerra','Kanabō de recluta','Maza de castigo','Garrote de frontera','Kanabō ordinario','Maza pesada remendada'],
  hammer_2h:['Gran martillo tosco','Martillo de guerra pobre','Martillo de cantera','Martillo pesado de milicia','Gran martillo gastado','Martillo de asedio ligero','Martillo de recluta','Gran martillo ordinario','Martillo de frontera','Martillo pesado remachado'],
  spear_1h:['Lanza corta','Lanza de milicia','Lanza de recluta','Lanza de hierro pobre','Lanza de campaña','Lanza vulgar','Lanza de frontera','Lanza simple','Lanza de guardia','Lanza remachada'],
  spear_2h:['Lanza larga simple','Lanza larga de milicia','Lanza larga de recluta','Lanza larga gastada','Lanza de asta pobre','Lanza larga de campaña','Lanza larga vulgar','Lanza larga de frontera','Lanza larga ordinaria','Lanza larga remendada'],
  halberd_2h:['Alabarda simple','Alabarda de milicia','Alabarda de recluta','Alabarda pobre','Alabarda de campaña','Alabarda gastada','Alabarda vulgar','Alabarda de frontera','Alabarda remendada','Alabarda ordinaria'],
  javelin:['Jabalina simple','Jabalina de caza','Jabalina de milicia','Jabalina de recluta','Jabalina pobre','Jabalina de frontera','Jabalina ordinaria','Jabalina de campaña','Jabalina ligera','Jabalina gastada'],
  scythe_2h:['Guadaña de guerra simple','Guadaña larga pobre','Guadaña de milicia','Guadaña de recluta','Guadaña de campaña','Guadaña gastada','Guadaña ordinaria','Guadaña de frontera','Guadaña reforzada pobre','Guadaña mellada'],
  bow_2h:['Arco corto simple','Arco de caza pobre','Arco de milicia','Arco de recluta','Arco de campaña','Arco gastado','Arco de frontera','Arco ordinario','Arco de madera verde','Arco reforzado pobre'],
  crossbow_2h:['Ballesta ligera simple','Ballesta de milicia','Ballesta de recluta','Ballesta pobre','Ballesta gastada','Ballesta de campaña','Ballesta ordinaria','Ballesta de frontera','Ballesta remendada','Ballesta de madera dura'],
  staff_2h:['Bastón simple','Bastón ritual pobre','Bastón de aprendiz','Bastón de madera vieja','Báculo de recluta','Bastón de canalización básico','Bastón ordinario','Bastón de frontera','Bastón gastado','Bastón de práctica'],
  wand_1h:['Varita simple','Varita de aprendiz','Varita pobre','Varita gastada','Varita ordinaria','Varita de madera seca','Varita de recluta','Varita de práctica','Varita de frontera','Varita remendada'],
  tome_1h:['Tomo simple','Tomo de aprendiz','Tomo desgastado','Tomo ordinario','Tomo de tapas pobres','Tomo de práctica','Tomo de recluta','Tomo de frontera','Tomo remendado','Tomo de notas arcanas'],
  scepter_1h:['Cetro simple','Cetro de aprendiz','Cetro pobre','Cetro gastado','Cetro ordinario','Cetro de recluta','Cetro de práctica','Cetro de frontera','Cetro remendado','Cetro de madera y hierro'],
  catalyst_1h:['Catalizador simple','Catalizador de aprendiz','Catalizador pobre','Catalizador gastado','Catalizador ordinario','Catalizador de práctica','Catalizador de recluta','Catalizador de frontera','Catalizador remendado','Catalizador de cristal opaco'],
  gauntlets_pair:['Guanteletes simples','Guanteletes de recluta','Guanteletes de cuero reforzado','Guanteletes de milicia','Guanteletes pobres','Guanteletes de campaña','Guanteletes ordinarios','Guanteletes de frontera','Guanteletes gastados','Guanteletes remendados'],
  chakrams_pair:['Chakrams simples','Chakrams de recluta','Chakrams pobres','Chakrams gastados','Chakrams ordinarios','Chakrams de milicia','Chakrams de frontera','Chakrams de campaña','Chakrams mellados','Chakrams remendados'],
  cannon_2h:['Cañón simple','Cañón de recluta','Cañón pobre','Cañón gastado','Cañón ordinario','Cañón de campaña','Cañón de frontera','Cañón remachado','Cañón de hierro pobre','Cañón rudimentario'],
  fan_1h:['Abanico ritual simple','Abanico de aprendiz','Abanico ritual pobre','Abanico gastado','Abanico ordinario','Abanico de recluta','Abanico de práctica','Abanico de frontera','Abanico remendado','Abanico ceremonial pobre'],
  spike_launcher:['Lanzador de espinas simple','Lanzador orgánico joven','Lanzador de espinas pobre','Lanzador orgánico gastado','Lanzador de espinas ordinario','Lanzador orgánico de recluta','Lanzador de frontera','Lanzador orgánico de campaña','Lanzador de espinas débil','Lanzador orgánico básico'],
  arm_blades_pair:['Cuchillas de antebrazo simples','Cuchillas de recluta','Cuchillas pobres','Cuchillas gastadas','Cuchillas ordinarias','Cuchillas de milicia','Cuchillas de frontera','Cuchillas de campaña','Cuchillas melladas','Cuchillas remendadas'],
  bio_weapon_pair:['Arma biológica joven','Arma biológica simple','Arma biológica pobre','Arma biológica inestable','Arma biológica ordinaria','Arma biológica de recluta','Arma biológica menor','Arma biológica de frontera','Arma biológica básica','Arma biológica rudimentaria']
};

function variants(f,rarity){
  const mult=progression.weaponRarity.damageMultipliers[String(rarity)]||1;
  const magicMult=progression.weaponRarity.magicPowerMultipliers[String(rarity)]||mult;
  const names=nouns[f.id]||Array.from({length:10},(_,i)=>`${f.name} ★${rarity} ${i+1}`);
  return names.map((baseName,i)=>{
    const shift=(i%3)-1;
    const baseMin=Math.max(1,f.damage[0]+(shift>0?1:0));
    const baseMax=Math.max(baseMin,f.damage[1]+(shift<0?-1:0));
    const min=Math.max(1,Math.round(baseMin*mult));
    const max=Math.max(min,Math.round(baseMax*mult));
    const name=rarity===1?baseName:`${baseName} ★${rarity}`;
    const item={
      id:`W${rarity}-${f.id.toUpperCase()}-${String(i+1).padStart(2,'0')}`,
      name,
      rarity,
      enhancement:0,
      level:1,
      category:'weapon',
      familyId:f.id,
      familyName:f.name,
      hands:f.hands,
      baseDamage:{min,max},
      damage:{min,max},
      speed:f.speed,
      scalingStat:f.stat,
      compatibleKeywords:f.compatibleKeywords,
      sellValueGold:Math.max(8,Math.round((12+i*2)*mult))
    };
    if(f.range)item.range=f.range;
    if(f.magicPower){
      const mpMin=Math.max(1,Math.round(f.magicPower[0]*magicMult));
      const mpMax=Math.max(mpMin,Math.round(f.magicPower[1]*magicMult));
      item.baseMagicPower={min:mpMin,max:mpMax};
      item.magicPower={min:mpMin,max:mpMax};
    }
    return item;
  });
}

const allByRarity={};
for(let rarity=1;rarity<=8;rarity++){
  const items=source.families.flatMap(f=>variants(f,rarity));
  allByRarity[rarity]=items;
  fs.writeFileSync(path.join(outDir,`weapons-star${rarity}.json`),JSON.stringify({schemaVersion:1,rarity,total:items.length,variantsPerFamily:10,items},null,2));
}
const allItems=Object.values(allByRarity).flat();
fs.writeFileSync(path.join(outDir,'weapons-all.json'),JSON.stringify({schemaVersion:1,total:allItems.length,items:allItems},null,2));
console.log(`Generated ${allItems.length} weapons: ${source.families.length} families × 10 variants × 8 rarities.`);
