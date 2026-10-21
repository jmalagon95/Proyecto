import assert from 'node:assert/strict';
import {isWoodSwordKairakh} from '../src/systems/kairakh-wood-sword-skin.js';
import {createRigSvg,playRig,tickRig,rigState,attachRig} from '../src/systems/mannequin-rig.js';
const hero={race:'Kairakh',star:1,currentStar:1,className:'Monarca de la Espada Indómita',equipment:{}};
assert.ok(isWoodSwordKairakh(hero));
assert.ok(!isWoodSwordKairakh({...hero,star:3,currentStar:3}));
assert.ok(!isWoodSwordKairakh({...hero,race:'Elfos'}));
assert.ok(!isWoodSwordKairakh({...hero,equipment:{weapon:'Maza de madera'}}));
class Node{
 constructor(name){this.tagName=name;this.attrs={};this.style={};this.children=[];this.classList={add(){}};this.parentNode=null;}
 setAttribute(k,v){this.attrs[k]=String(v)}
 getAttribute(k){return this.attrs[k]??null}
 hasAttribute(k){return k in this.attrs}
 appendChild(n){this.children.push(n);n.parentNode=this;return n}
 insertBefore(n,ref){if(!ref)return this.appendChild(n);const i=this.children.indexOf(ref);this.children.splice(i,0,n);n.parentNode=this;return n}
 remove(){this.parentNode?.children.splice(this.parentNode.children.indexOf(this),1)}
 querySelectorAll(selector){let out=[];for(const c of this.children){out.push(c,...c.querySelectorAll(selector))}
 if(selector==='[data-bone]')return out.filter(x=>x.hasAttribute('data-bone'));
 if(selector==='[data-equipped-item]')return out.filter(x=>x.hasAttribute('data-equipped-item'));
 if(selector==='[data-wood-strike-arc]')return out.filter(x=>x.hasAttribute('data-wood-strike-arc'));
 if(selector.startsWith(':scope > '))return this.children.filter(x=>['path','ellipse','rect'].includes(x.tagName));
 return [];}
 querySelector(selector){if(selector==='.unit-body')return null;return this.querySelectorAll(selector)[0]??null}
}
globalThis.document={createElementNS:(ns,n)=>new Node(n)};
const {svg,nodes}=createRigSvg({character:hero});
assert.equal(svg.getAttribute('data-combat-skin'),'kairakh-star1-wood-sword');
assert.equal(Object.keys(nodes).length,19);
assert.equal(svg.querySelectorAll('[data-equipped-item]').length,1);
assert.equal(svg.querySelectorAll('[data-wood-strike-arc]').length,1);
const unit={id:'pilot',character:hero,hp:35,maxHp:35,node:new Node('div')};
attachRig(unit);assert.equal(rigState(unit),'idle');
playRig(unit,'attack',{duration:.5});
for(let i=0;i<9;i++)tickRig(unit,1/60);
assert.equal(rigState(unit),'attack');
const before=unit.node.querySelector('[data-wood-strike-arc]')?.getAttribute('opacity');
for(let i=0;i<8;i++)tickRig(unit,1/60);
const during=unit.node.querySelector('[data-wood-strike-arc]')?.getAttribute('opacity');
assert.ok(Number(during)>0,'El destello de contacto debe aparecer en el golpe');
for(let i=0;i<28;i++)tickRig(unit,1/60);
assert.equal(rigState(unit),'idle');
assert.equal(unit.node.querySelector('[data-wood-strike-arc]').getAttribute('opacity'),'0');
console.log('✅ Kairakh ★1: 19 huesos, arma de madera, piezas articuladas y golpe básico de tres fases');
