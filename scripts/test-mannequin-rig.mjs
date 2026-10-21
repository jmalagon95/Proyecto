import assert from 'node:assert/strict';
import {SKELETON,SOCKETS,RIG_STATES,createRigSvg,sampleRigPose,attachRig,playRig,tickRig,rigState,rigSocket} from '../src/systems/mannequin-rig.js';
class Node{
 constructor(tag){this.tagName=tag;this.attrs={};this.children=[];this.style={};this.classList={add(){}}}
 setAttribute(k,v){this.attrs[k]=String(v)}
 appendChild(child){this.children.push(child);return child}
 append(child){this.appendChild(child)}
 querySelector(name){
  if(name==='.unit-body')return this.body;
  if(name==='.kami-rig-svg')return this.children.find(c=>c.tagName==='svg')||null;
  return null;
 }
}
globalThis.document={createElementNS:(ns,tag)=>new Node(tag)};
const bones=Object.keys(SKELETON);
assert.equal(bones.length,19);
assert.equal(bones[0],'root');
for(const [bone,[parent]] of Object.entries(SKELETON))
 assert.ok(parent===null||SKELETON[parent],bone+' has no parent');
for(const [socket,bone] of Object.entries(SOCKETS))
 assert.ok(SKELETON[bone],'Missing socket '+socket);
for(const mode of RIG_STATES){
 const p=sampleRigPose(mode,1.3,.45);
 assert.ok(Number.isFinite(p.movement.x)&&Number.isFinite(p.movement.y));
 assert.ok(Object.values(p.angles).every(Number.isFinite));
}
const {svg,nodes}=createRigSvg({debug:true});
assert.equal(svg.tagName,'svg');
assert.equal(Object.keys(nodes).length,19);
const body=new Node('div'),node=new Node('div');node.body=body;
const unit={id:'hero',hp:100,maxHp:100,node};
assert.ok(attachRig(unit,{debug:true}));
assert.equal(rigState(unit),'idle');
assert.ok(rigSocket(unit,'weaponR'));
tickRig(unit,1/60);
assert.ok(rigSocket(unit,'headVfx').attrs.transform.includes('rotate('));
assert.ok(playRig(unit,'attack'));
for(let i=0;i<45;i++)tickRig(unit,1/60);
assert.equal(rigState(unit),'idle','Attack must end');
unit.hp=70;tickRig(unit,1/60);assert.equal(rigState(unit),'hit');
unit.hp=0;tickRig(unit,1/60);assert.equal(rigState(unit),'death');
for(let i=0;i<130;i++)tickRig(unit,1/60);
assert.equal(rigState(unit),'death');
assert.equal(playRig(unit,'attack'),false,'Dead mannequin cannot attack');
console.log('✅ 19 bones, named sockets, 9 poses, interpolated animation, HP hit and permanent death');
