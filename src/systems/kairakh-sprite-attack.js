// Kairakh ★1 combat-only sprite animation. 30-cell original illustrated atlas.
export const ATTACK_ATLAS='/assets/battle/kairakh_star1/attack_basic_30.webp';
export const FRAME_COUNT=30,FRAME_COLS=6,FRAME_ROWS=5;
export const ATTACK_DURATION_MS=720;
const animations=new WeakMap();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function frameAt(progress){return clamp(Math.floor(clamp(progress,0,1)*FRAME_COUNT),0,FRAME_COUNT-1)}
export function framePosition(index){const i=clamp(Math.floor(index),0,29);return {column:i%6,row:Math.floor(i/6)}}
export function isWoodSwordKairakh(unit){
 const c=unit?.character||unit?.ref||{};
 if(String(c.race||c.raceId||'').toLowerCase()!=='kairakh'||Number(c.currentStar??c.star??1)!==1)return false;
 const equip=c.equipment||{};
 const weaponKeys=Object.entries(equip).filter(([slot])=>/weapon|arma|main|hand|mano|espada/i.test(slot));
 const parts=[c.weapon,...weaponKeys.map(([,v])=>v)].filter(Boolean);
 const item=parts.map(v=>typeof v==='object'?[v.name,v.id,v.type,v.family,v.weaponFamilyId].filter(Boolean).join(' '):String(v)).join(' ').toLowerCase();
 if(!item)return true;
 return /espada|sword|madera|wood|mandoble|blade/.test(item);
}
function spriteHost(unit){
 const node=unit?.node;if(!node)return null;
 const host=node.querySelector('.unit-body')||node;
 let sprite=host.querySelector('.kami-star1-sword-attack');
 if(!sprite){sprite=document.createElement('div');sprite.className='kami-star1-sword-attack';sprite.setAttribute('aria-hidden','true');host.appendChild(sprite)}
 return sprite;
}
export function playKairakhBasicAttack(unit,{onImpact,durationMs=ATTACK_DURATION_MS}={}){
 if(!isWoodSwordKairakh(unit))return false;
 const sprite=spriteHost(unit);if(!sprite)return false;
 const previous=animations.get(unit);if(previous)cancelAnimationFrame(previous.raf);
 const start=performance.now();let impacted=false;
 const host=unit.node;host.classList.add('kami-attack-sprite-playing');
 sprite.style.backgroundImage='url("'+ATTACK_ATLAS+'")';sprite.style.backgroundSize='600% 500%';
 function animate(now){
  if(!host.isConnected){host.classList.remove('kami-attack-sprite-playing');animations.delete(unit);return}
  const progress=clamp((now-start)/durationMs,0,1),i=frameAt(progress),pos=framePosition(i);
  sprite.style.backgroundPosition=(pos.column*20)+'% '+(pos.row*25)+'%';sprite.dataset.frame=String(i+1);
  if(!impacted&&i>=20){impacted=true;onImpact?.()}
  if(progress>=1){host.classList.remove('kami-attack-sprite-playing');animations.delete(unit);return}
  const state=animations.get(unit);if(state)state.raf=requestAnimationFrame(animate);
 }
 animations.set(unit,{raf:requestAnimationFrame(animate)});return true;
}
export function stopKairakhBasicAttack(unit){
 const a=animations.get(unit);if(a)cancelAnimationFrame(a.raf);animations.delete(unit);
 unit?.node?.classList.remove('kami-attack-sprite-playing');
}
const css=document.createElement('style');css.id='kami-star1-sword-attack-css';
css.textContent=[
 '#battleField .kami-star1-sword-attack{position:absolute;z-index:3;left:50%;bottom:-9px;transform:translateX(-50%);width:110px;height:93px;display:none;pointer-events:none;background-repeat:no-repeat;background-size:600% 500%;image-rendering:auto;filter:drop-shadow(0 3px 3px #0007)}',
 '#battleField .kami-attack-sprite-playing .kami-star1-sword-attack{display:block}',
 '#battleField .kami-attack-sprite-playing .kami-rig-svg{visibility:hidden!important}',
 '#battleField .kami-attack-sprite-playing .unit-body{overflow:visible!important}',
 '@media(max-width:480px){#battleField .kami-star1-sword-attack{width:99px;height:84px;bottom:-5px}}'
].join('\n');document.head.append(css);
