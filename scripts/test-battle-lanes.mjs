import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
let attachedStyle=null;
globalThis.window={};
globalThis.document={
  createElement(tag){return {tag,style:{},classList:{add(){},remove(){}},setAttribute(){},append(){},dataset:{},textContent:''};},
  head:{append(el){attachedStyle=el;}},
  getElementById(){return null;}
};
await import('../src/systems/battle-lanes.js');
const lanes=window.KamiBattleLanes;
assert.ok(lanes,'No hay controlador de campo');
assert.ok(attachedStyle?.textContent?.includes('kami-lane-arena'));
assert.ok(!/TRASERO|FRONTAL/.test(readFileSync('src/systems/battle-lanes.js','utf8')));
assert.equal(lanes.laneFor({role:'Tanque / protección'},0),0);
assert.equal(lanes.laneFor({role:'Sanador / apoyo'},1),1);
assert.equal(lanes.laneFor({role:'DPS / duelista'},2),2);
const front={lane:2,hp:25,maxHp:30,enemy:true,ref:{role:'Guerrero'}};
const rear={lane:0,hp:20,maxHp:30,enemy:true,ref:{role:'Mago'}};
const warrior={lane:2,character:{role:'DPS'}};
assert.equal(lanes.chooseTarget(warrior,[front,rear]),front,'El luchador debe priorizar su carril');
const mage={lane:0,character:{role:'DPS mágico'}};
assert.equal(lanes.chooseTarget(mage,[front,rear]),rear,'El mago debe valorar su carril');
const html=readFileSync('index.html','utf8');
for(const symbol of ['KAMI_BATTLE_25D_LANES_V1','KAMI_BATTLE_ROLE_LANES_V1','KamiBattleLanes?.place','KamiBattleLanes?.laneFor','KamiBattleLanes.chooseTarget']){
 assert.ok(html.includes(symbol),'Falta la conexión '+symbol);
}
const js=readFileSync('src/systems/battle-lanes.js','utf8');
const sanitized=js.replace(/^export\s/gm,'');
new Script(sanitized);
console.log('✅ Tres carriles, roles, prioridades de objetivos, estilos y cableado al maestro validados');
