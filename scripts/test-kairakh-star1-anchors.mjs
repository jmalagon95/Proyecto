import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SKELETON,SOCKETS} from '../src/systems/mannequin-rig.js';
const data=JSON.parse(readFileSync('data/rigs/kairakh_star1_anchors.json','utf8'));
assert.equal(data.race,'Kairakh');assert.equal(data.rarity,1);
assert.equal(Object.keys(data.characters).length,5);
for(const [name,item] of Object.entries(data.characters)){
 assert.deepEqual(Object.keys(item.joints),Object.keys(SKELETON),name+' order/identity mismatch');
 for(const [joint,point] of Object.entries(item.joints)){
  assert.ok(point.length===2&&point.every(n=>typeof n==='number'&&n>=0&&n<=1),name+': '+joint);
 }
 for(const bone of Object.values(SOCKETS))assert.ok(item.joints[bone],name+' socket '+bone);
}
console.log('✅ Five Kairakh ★1 originals have 19 registered joints and compatible sockets');
