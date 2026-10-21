import assert from 'node:assert/strict';
import {RACE_RIGS,racialRigFor} from '../src/systems/racial-rig-profiles.js';
import {SKELETON,SOCKETS,createRigSvg,attachRig,playRig,tickRig,rigState} from '../src/systems/mannequin-rig.js';
class Node {
 constructor(tag){this.tagName=tag;this.attrs={};this.children=[];this.style={};this.classList={add(){}};}
 setAttribute(k,v){this.attrs[k]=String(v)}
 appendChild(child){this.children.push(child);return child}
 append(child){return this.appendChild(child)}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
 querySelectorAll(selector){
  let all=[];const visit=node=>{for(const child of node.children){all.push(child);visit(child)}};visit(this);
  if(selector.startsWith(':scope > ')){const kinds=selector.slice(9).split(',').map(v=>v.trim());return this.children.filter(x=>kinds.includes(x.tagName))}
  if(selector==='[data-race-ornament]')return all.filter(x=>x.attrs['data-race-ornament']);
  if(selector==='[data-feature]')return all.filter(x=>x.attrs['data-feature']);
  if(selector.startsWith('[data-feature="')){const name=selector.slice(15,-2);return all.filter(x=>x.attrs['data-feature']===name)}
  if(selector==='[data-bone]')return all.filter(x=>x.attrs['data-bone']);
  if(selector==='.kami-rig-svg')return all.filter(x=>x.tagName==='svg');
  return [];
 }
}
globalThis.document={createElementNS:(ns,tag)=>new Node(tag)};
const names=Object.keys(RACE_RIGS);
assert.deepEqual(names,['Kairakh','Elfos','Kijins','Vampiros','Insectoides','Reptro']);
assert.equal(Object.keys(SKELETON).length,19);
for(const race of names){
 const rig=createRigSvg({character:{race}});
 assert.equal(rig.svg.attrs['data-rig-race'],RACE_RIGS[race].id,race);
 assert.equal(Object.keys(rig.nodes).length,19);
 assert.equal(rig.nodes.chest.children[0].attrs['data-anatomy-shape'],RACE_RIGS[race].id);
 assert.ok(rig.nodes.chest.children[0].attrs.transform.startsWith('scale('));
 assert.equal(rig.nodes.chest.attrs.transform,'translate(0 -28)','Visual morph must not move bone pivots');
 assert.ok(rig.svg.querySelectorAll('[data-feature]').length>0,race+' no tiene anatomía propia');
 for(const bone of Object.values(SOCKETS))assert.ok(rig.nodes[bone],race+' perdió socket '+bone);
 const unit={character:{race},hp:100,maxHp:100,node:new Node('div')};
 const animated=attachRig(unit,{debug:true});
 assert.ok(animated);assert.equal(animated.racial.race,RACE_RIGS[race].id);
 assert.ok(playRig(unit,'attack'));for(let i=0;i<60;i++)tickRig(unit,1/60);
 assert.equal(rigState(unit),'idle',race+' animación de ataque atascada');
}
const k=createRigSvg({character:{race:'Kairakh'}}).svg.querySelectorAll('[data-feature="single_center_horn"]');
const kj=createRigSvg({character:{race:'Kijins'}}).svg.querySelectorAll('[data-feature="paired_horns"]');
assert.equal(k.length,1);
assert.equal(kj.length,1); // Una pieza SVG con dos cuernos claramente separados.
const re=createRigSvg({character:{race:'Reptro'}}).svg;
assert.equal(re.querySelectorAll('[data-feature="electric_hair"]').length,1);
assert.equal(re.querySelectorAll('[data-feature="electric_tail"]').length,1);
assert.equal(re.querySelectorAll('[data-feature="ear_openings"]').length,1);
const ins=createRigSvg({character:{race:'Insectoides'}}).svg;
assert.ok(ins.querySelectorAll('[data-feature="chitin"]').length>=6);
assert.ok(ins.querySelectorAll('[data-feature="antennae"]').length===1);
assert.equal(racialRigFor('Hombres Bestia'),null);
assert.equal(racialRigFor('Humanos'),null);
console.log('✅ Seis rigs raciales animables · 19 huesos intactos · rasgos Kairakh/Kijin/Reptro/Insectoides');
