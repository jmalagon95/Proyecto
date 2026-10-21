// Kami No Challenge · Kairakh ★1 · 30 fotogramas de ataque básico.
// Módulo integrado en battle-lanes.js; los retratos de selección no se usan en combate.
export const ATTACK_ATLAS='/assets/battle/kairakh_star1/attack_basic_30.webp';
export const FRAME_COUNT=30, FRAME_COLS=6, FRAME_ROWS=5;
export const ATTACK_DURATION_MS=900;
const animations=new WeakMap();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function frameAt(progress){return clamp(Math.floor(clamp(progress,0,1)*FRAME_COUNT),0,FRAME_COUNT-1)}
export function framePosition(index){const i=clamp(Math.floor(index),0,FRAME_COUNT-1);return {column:i%FRAME_COLS,row:Math.floor(i/FRAME_COLS)}}
export function isWoodSwordKairakh(unit){
 const c=unit?.character||unit?.ref||{};
 if(String(c.race||c.raceId||'').toLowerCase()!=='kairakh'||Number(c.currentStar??c.star??1)!==1)return false;
 const equip=c.equipment||{};
 const weaponKeys=Object.entries(equip).filter(([slot])=>/weapon|arma|main|hand|mano|espada/i.test(slot));
 const parts=[c.weapon,...weaponKeys.map(([,v])=>v)].filter(Boolean);
 const item=parts.map(v=>typeof v==='object'?[v.name,v.id,v.type,v.family,v.weaponFamilyId].filter(Boolean).join(' '):String(v)).join(' ').toLowerCase();
 return !item||/espada|sword|madera|wood|mandoble|blade/.test(item);
}
let atlasReady=false,atlasFailed=false;
const atlasImage=new Image();
atlasImage.onload=()=>{atlasReady=atlasImage.naturalWidth>0&&atlasImage.naturalHeight>0;atlasFailed=!atlasReady};
atlasImage.onerror=()=>{atlasFailed=true};
atlasImage.src=ATTACK_ATLAS;
function spriteHost(unit){
 const node=unit?.node;if(!node)return null;
 const host=node.querySelector('.unit-body')||node;
 let sprite=host.querySelector('.kami-star1-sword-attack');
 if(!sprite){sprite=document.createElement('div');sprite.className='kami-star1-sword-attack';sprite.setAttribute('aria-hidden','true');host.appendChild(sprite)}
 return sprite;
}
export function stopKairakhBasicAttack(unit){
 const state=animations.get(unit);
 if(state){cancelAnimationFrame(state.raf);if(state.fallback)clearTimeout(state.fallback)}
 animations.delete(unit);
 unit?.node?.classList.remove('kami-attack-sprite-playing');
}
export function playKairakhBasicAttack(unit,{onImpact,durationMs=ATTACK_DURATION_MS}={}){
 // Use the regular skeletal strike until the atlas is decoded. Never hide the rig for a missing asset.
 if(!isWoodSwordKairakh(unit)||!atlasReady||atlasFailed||!unit?.node?.isConnected)return false;
 const sprite=spriteHost(unit);if(!sprite)return false;
 stopKairakhBasicAttack(unit);
 const host=unit.node,start=performance.now(),duration=clamp(Number(durationMs)||ATTACK_DURATION_MS,300,2500);
 let impacted=false;
 sprite.style.backgroundImage='url("'+ATTACK_ATLAS+'")';
 sprite.style.backgroundSize=(FRAME_COLS*100)+'% '+(FRAME_ROWS*100)+'%';
 host.classList.add('kami-attack-sprite-playing');
 function impact(){if(!impacted){impacted=true;onImpact?.()}}
 function draw(now){
  if(!host.isConnected){stopKairakhBasicAttack(unit);return}
  const p=clamp((now-start)/duration,0,1),i=frameAt(p),pos=framePosition(i);
  sprite.style.backgroundPosition=(pos.column/(FRAME_COLS-1)*100)+'% '+(pos.row/(FRAME_ROWS-1)*100)+'%';
  sprite.dataset.frame=String(i+1);
  if(i>=20)impact();
  if(p>=1){impact();stopKairakhBasicAttack(unit);return}
  const state=animations.get(unit);if(state)state.raf=requestAnimationFrame(draw);
 }
 // First cell is explicitly painted before the first requestAnimationFrame.
 sprite.style.backgroundPosition='0% 0%';sprite.dataset.frame='1';
 animations.set(unit,{raf:requestAnimationFrame(draw)});
 return true;
}
const css=document.createElement('style');css.id='kami-star1-sword-attack-css';
css.textContent=`
#battleField .kami-star1-sword-attack{
 position:absolute;z-index:3;left:50%;bottom:0;transform:translateX(-50%);
 width:clamp(42px,7vw,70px);aspect-ratio:110/93;height:auto;display:none;
 pointer-events:none;background-repeat:no-repeat;background-size:600% 500%;
 image-rendering:auto;filter:drop-shadow(0 2px 2px #0008);
}
#battleField .kami-attack-sprite-playing .kami-star1-sword-attack{display:block}
#battleField .kami-attack-sprite-playing .kami-rig-svg{visibility:hidden!important}
#battleField .kami-attack-sprite-playing .unit-body{overflow:visible!important}
@media(max-width:480px){#battleField .kami-star1-sword-attack{width:clamp(38px,12vw,58px);bottom:0}}
@media(prefers-reduced-motion:reduce){#battleField .kami-star1-sword-attack{filter:none}}
`;
document.head.append(css);
