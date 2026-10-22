// Anatomías raciales independientes de las 39 clases.
// Todos usan el mismo esqueleto y sockets del maniquí base.
export const RACE_RIGS=Object.freeze({
  Kairakh:{id:'kairakh',tone:'#c7a7a5',shadow:'#896475',accent:'#e95467',build:1.18,headScale:1.03,traits:['single_center_horn','pointed_ears','fangs','war_eyes','energy_veins']},
  Elfos:{id:'elfos',tone:'#e5ded5',shadow:'#b8b9c9',accent:'#88d5ab',build:.91,headScale:.98,traits:['long_pointed_ears','refined_eyes']},
  Kijins:{id:'kijins',tone:'#e4d8df',shadow:'#b6a7bd',accent:'#d55369',build:1.03,headScale:1.02,traits:['paired_horns','tear_marks','oni_eyes']},
  Vampiros:{id:'vampiros',tone:'#dedbe8',shadow:'#9e9cb7',accent:'#b9456e',build:.96,headScale:1.00,traits:['pale_skin','fangs','predator_eyes']},
  Insectoides:{id:'insectoides',tone:'#8ba9a3',shadow:'#526b74',accent:'#8fd3b1',build:1.04,headScale:.96,traits:['chitin','antennae','insect_mandibles','segmented_joints']},
  // Enemigo común: piel verde, orejas grandes, complexión baja y nervuda.
  Goblin:{id:'goblin',tone:'#7f9a52',shadow:'#4d6435',accent:'#e8c35a',build:.92,headScale:1.12,traits:['long_ears','hooked_nose','loincloth','club']},
  Reptro:{id:'reptro',tone:'#7f9b83',shadow:'#47695b',accent:'#63caff',build:.98,headScale:1.05,traits:['scales','reptilian_eyes','ear_openings','electric_hair','electric_tail','retractile_claws']}
});
const aliases=Object.freeze({goblin:'Goblin',kairakh:'Kairakh',elfos:'Elfos',kijins:'Kijins',vampiros:'Vampiros',insectoides:'Insectoides',reptro:'Reptro'});
export function racialRigFor(value){
 const key=typeof value==='string'?value:value?.race||value?.character?.race||value?.ref?.race;
 return RACE_RIGS[aliases[String(key||'').toLowerCase()]]||null;
}
