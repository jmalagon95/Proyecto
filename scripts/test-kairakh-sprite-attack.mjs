import assert from 'node:assert/strict';
globalThis.document={createElement(tag){return {tag,id:'',textContent:'',style:{},classList:{add(){}},setAttribute(){}}},head:{append(){}}};
const mod=await import('../src/systems/kairakh-sprite-attack.js');
assert.equal(mod.FRAME_COUNT,30);
assert.equal(mod.frameAt(0),0);
assert.equal(mod.frameAt(1),29);
for(let i=0;i<30;i++){const pos=mod.framePosition(i);assert.equal(pos.row*6+pos.column,i)}
const mk=(race,star,equipment={})=>({character:{race,currentStar:star,equipment}});
assert.equal(mod.isWoodSwordKairakh(mk('Kairakh',1)),true);
assert.equal(mod.isWoodSwordKairakh(mk('Kairakh',1,{weapon:'Espada de madera'})),true);
assert.equal(mod.isWoodSwordKairakh(mk('Kairakh',1,{weapon:'Hacha'})),false);
assert.equal(mod.isWoodSwordKairakh(mk('Kairakh',2)),false);
assert.equal(mod.isWoodSwordKairakh(mk('Elfos',1)),false);
console.log('✅ 30 fotogramas, 6×5, límites, equipo de espada y rareza Kairakh ★1');
