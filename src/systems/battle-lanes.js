import {weaponRangeMeters,distanceMeters,isMelee,ARENA_METERS,skillRangeMeters} from './combat-reach.js';
import {attachRig,playRig,tickRig,rigState} from './mannequin-rig.js';
import {playKairakhBasicAttack} from './kairakh-sprite-attack.js';
// Kami No Challenge · Campo 2.5D por carriles.
// Renderer ligero: conserva la simulación existente y reacciona a eventos reales.
const visual=new WeakMap();
const engagements=new WeakMap();
const laneOffsets=[19,47,75]; // trasero, medio, frontal: profundidad creciente
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function getField(){return document.getElementById('battleField')}
function laneOf(unit){return clamp(Number(unit.lane)||0,0,2)}
function laneFor(character,index=0){
 // Los carriles son posiciones espaciales, no roles de frente/retaguardia.
 // La elección manual guardada tiene prioridad; la reserva es neutra.
 return Math.max(0,Number(index)||0)%3;
}
function position(unit){
 const depth=laneOf(unit);
 const ally=!unit.enemy;
 const index=Math.max(0,Number(unit.index)||0);
 const stagger=unit.enemy?index%5:Math.max(0,Math.min(4,Number.isInteger(unit.slot)?unit.slot:index%5));
 const x=ally?12+stagger*7.5:64+stagger*6.4;
 const y=laneOffsets[depth]+((index%2)?2:-1);
 const scale=[.77,.91,1.06][depth]*(unit.enemy?.91:1);
 return {x,y,scale,depth};
}
function createArena(field){
 if(field.dataset.kamiDepth==='1')return;
 field.dataset.kamiDepth='1';
 field.classList.add('kami-lane-arena');
 const floor=document.createElement('div');floor.className='kami-floor';
 const horizon=document.createElement('div');horizon.className='kami-horizon';
 field.prepend(floor);field.prepend(horizon);
 for(let i=0;i<3;i++){
  const lane=document.createElement('div');
  lane.className='kami-track kami-track-'+i;
  lane.style.top=laneOffsets[i]+'%';
  lane.setAttribute('aria-hidden','true');
  field.append(lane);
 }
 const legend=document.createElement('div');legend.className='kami-lane-legend';
 legend.innerHTML='<span>CARRIL 1</span><span>CARRIL 2</span><span>CARRIL 3</span>';
 field.append(legend);
}
function place(unit,node,field=getField()){
 if(!field||!node)return;
 createArena(field);
 const p=position(unit);
 const prior=visual.get(unit);
 // Formation changes reset the spatial anchor, but attacks never do.
 node.classList.add('kami-fighter');
 node.dataset.lane=String(p.depth);
 node.style.setProperty('--kami-scale',String(p.scale));
 node.style.left=p.x+'%';node.style.top='calc('+p.y+'% - 45px)';
 node.style.zIndex=String(20+p.depth*20+(unit.enemy?2:5)+p.x/20);
 node.style.transform='scale('+p.scale+')';
 visual.set(unit,{x:p.x,y:p.y,scale:p.scale,active:false});
 attachRig(unit);
 if(prior&&(Math.abs(prior.x-p.x)>.2||Math.abs(prior.y-p.y)>.2))
  playRig(unit,'run',{duration:.4});
 // Combat units are articulated models, never flat race portraits or enemy artwork.
 node.dataset.combatRenderer='skeletal';
}
function shake(field,strength){
 field?.style.setProperty('--kami-shake',Math.min(7,Math.max(0,strength))+'px');
 field?.classList.remove('kami-shake');void field?.offsetWidth;
 field?.classList.add('kami-shake');
 clearTimeout(field._kamiShakeTimer);
 field._kamiShakeTimer=setTimeout(()=>{field.classList.remove('kami-shake');field.style.setProperty('--kami-shake','0px')},250);
}
function flash(x,y,kind){
 const field=getField();if(!field)return;
 const burst=document.createElement('span');
 burst.className='kami-burst '+(kind==='magic'?'kami-burst-magic':'');
 burst.style.left=x+'%';burst.style.top=y+'%';
 field.append(burst);setTimeout(()=>burst.remove(),440);
}
// All weapon reach values are measured in actual arena metres.
const weaponReach=weaponRangeMeters;
const worldDistance=distanceMeters;
function onAttack(actor,target,onContact=null){
 if(!actor?.node||!target?.node||actor.hp<=0||target.hp<=0)return;
 const a=visual.get(actor)||position(actor),b=visual.get(target)||position(target);
 // Once units have advanced, their next attacks start from their new positions.
 const reach=weaponReach(actor),distance=worldDistance(a,b),melee=isMelee(actor);
 const node=actor.node,field=getField();
 // One movement sequence per actor; replacing it cancels pending impact safely.
 const previous=node._kamiReachSequence;
 if(previous&&!previous.cancelled)return; // No se reinicia una carrera por cada cooldown.
 const seq={cancelled:false,timers:[]};node._kamiReachSequence=seq;
 const after=(fn,ms)=>seq.timers.push(setTimeout(()=>{if(!seq.cancelled&&node.isConnected)fn()},ms));
 const impact=()=>{
  if(!target.node?.isConnected||target.hp<=0)return;
  if(typeof onContact==='function')onContact();
  playRig(target,'hit');
  target.node.classList.remove('kami-impact');void target.node.offsetWidth;
  target.node.classList.add('kami-impact');
  const p=melee?{x:b.x,y:b.y}:b;
  flash(p.x,p.y,reach>12?'magic':'hit');shake(field,2.5);
  after(()=>target.node?.classList.remove('kami-impact'),310);
 };
 node.dataset.weaponReach=String(reach);
 node.classList.remove('kami-lunge');
 // Ranged combat retains its firing position. Close combat closes the actual gap.
 if(!melee||distance<=reach+0.25){
  const illustrated=playKairakhBasicAttack(actor,{onImpact:impact});
  if(!illustrated){playRig(actor,'attack');after(impact,190)}
  after(()=>{if(node._kamiReachSequence===seq)node._kamiReachSequence=null},illustrated?950:480);
  return;
 }
 // Approach to the edge of the weapon reach, with correct x AND depth movement.
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.max(.001,Math.hypot(dx,dy));
 const stop=Math.max(.8,reach*.87);
 const lengthMeters=Math.max(.001,Math.hypot(dx*ARENA_METERS.width/100,dy*ARENA_METERS.height/100));
 const x=b.x-(dx/lengthMeters)*stop,y=b.y-(dy/lengthMeters)*stop;
 const moveMs=clamp(Math.round(Math.max(0,distance-reach)*125),280,1600),strikeMs=350;
 node.classList.add('kami-approaching');
 node.style.transition='left '+moveMs+'ms linear,top '+moveMs+'ms linear,transform .25s ease';
 node.style.left=x+'%';node.style.top='calc('+y+'% - 45px)';
 node.style.zIndex=String(85+laneOf(actor)*10);
 playRig(actor,'run',{duration:moveMs/1000});
 after(()=>{
  if(target.hp<=0){settle();return}
  visual.set(actor,{x,y,scale:a.scale,depth:a.depth,active:false});
  node.classList.remove('kami-approaching');node.classList.add('kami-in-range');
  // Remain on the contact spot until the hit animation reaches its strike frame.
  const illustrated=playKairakhBasicAttack(actor,{onImpact:impact});
  if(!illustrated){playRig(actor,'attack');after(impact,Math.round(strikeMs*.55))}
  after(settle,illustrated?950:strikeMs+170);
 },moveMs+35);
 function settle(){
  if(seq.cancelled)return;
  node.classList.remove('kami-in-range','kami-approaching');
  // Persist at the reached coordinates: no automatic trip back to formation.
  const depth=clamp(Math.round((y-laneOffsets[0])/(laneOffsets[2]-laneOffsets[0])*2),0,2);
  visual.set(actor,{x,y,scale:a.scale,depth,active:false});
  engagements.set(actor,target);
  node.style.zIndex=String(20+depth*20+(actor.enemy?2:5)+x/20);
  node.style.transition='left .38s ease,top .38s ease,transform .26s ease';
  if(node._kamiReachSequence===seq)node._kamiReachSequence=null;
 }

}

function onSkill(actor,target,skill,kind){
 if(!actor?.node)return;
 playRig(actor,kind==='block'?'block':'cast');
 if(target&&target.hp>0)playRig(target,'hit');
 const cls=actor.character?.className||'';
 const magic=/taumaturgo|mago|arconte|chispa|rayo|confe|hierofante|invoc/i.test(cls);
 actor.node.classList.remove('kami-cast');void actor.node.offsetWidth;actor.node.classList.add('kami-cast');
 const enemy=target?.enemy?target:null;
 const p=visual.get(enemy)||visual.get(actor)||{x:50,y:48};
 flash(p.x,p.y,magic||kind==='heal'?'magic':'hit');
 if(skill?.rank==='U'||skill?.rank==='SSS+'||skill?.rank==='SSS'){
  shake(getField(),6);
  const field=getField();
  if(field){const banner=document.createElement('div');banner.className='kami-ultimate-title';
   banner.textContent=(skill.rank||'')+' · '+String(skill.name||'Técnica definitiva');
   field.append(banner);setTimeout(()=>banner.remove(),1250)}
 }
 setTimeout(()=>actor.node?.classList.remove('kami-cast'),520);
}
function showAction(unit,state){
 if(!unit?.node||!state)return;
 let text='';
 if(state.pending)text='✦ '+String(state.pending.skill?.name||'Preparando').slice(0,23)+' · '+state.castRemaining.toFixed(1)+'s';
 else if(state.global>.05)text='Preparado en '+state.global.toFixed(1)+'s';
 else if(state.racialRemaining>0)text='Racial '+Math.ceil(state.racialRemaining)+'s';
 else text='✦ Lista';
 let tag=unit.node.querySelector('.kami-action-status');
 if(!tag){tag=document.createElement('div');tag.className='kami-action-status';unit.node.append(tag)}
 if(tag.textContent!==text)tag.textContent=text;
 tag.dataset.preparing=String(Boolean(state.pending));
}
function tick(b,dt){
 if(!b||b.ended)return;
 const field=getField();if(!field)return;
 createArena(field);
 // Solamente posiciones visuales: no se teletransportan durante un ataque.
 for(const unit of [...b.allies,...b.enemies]){
  if(!unit.node)continue;
  const last=visual.get(unit);
  if(!last||unit.node.dataset.lane!==String(laneOf(unit)))place(unit,unit.node,field);
  tickRig(unit,dt);
  unit.node.classList.toggle('kami-fallen',unit.hp<=0);
  if(unit.hp>0)unit.node.classList.toggle('kami-low-hp',unit.hp/unit.maxHp<.25);
 }
}
function chooseTarget(attacker,candidates){
 const alive=candidates.filter(e=>e.hp>0);
 if(!alive.length)return null;
 const lane=laneOf(attacker);
 const role=String(attacker.character?.role||attacker.ref?.role||'').toLowerCase();
 // La proximidad entre carriles es espacial; ninguno es una línea defensiva obligatoria.
 const threat=e=>{
  const dist=Math.abs(lane-laneOf(e));
  const life=e.hp/Math.max(1,e.maxHp);
  const enemyRole=String(e.character?.role||e.ref?.role||'').toLowerCase();
  let score=30-dist*19+(1-life)*15;
  if(/tanque|defens|prote/.test(role))score+=dist===0?7:0;
  if(/ranger|tirador|mag|dps|duelista/.test(role))score+=(1-life)*16;
  if(attacker.enemy&&/sanador|apoyo|healer/.test(enemyRole))score+=dist===0?13:0;
  if(attacker.enemy&&/tanque|defens/.test(enemyRole))score+=dist===0?14:0;
  return score;
 };
 return alive.sort((a,b)=>threat(b)-threat(a)||a.hp-b.hp)[0];
}
// El rig es ahora el único cuerpo visible en combate: no hay modo de
// sustituirlo por imágenes estáticas. Los retratos del lobby no se alteran.
const css=document.createElement('style');css.id='kami-lanes-style';
css.textContent=`
#battleField.kami-lane-arena .kami-rig-host{background-image:none!important;background-color:transparent!important;position:relative}
#battleField.kami-lane-arena .kami-rig-host > svg:not(.kami-rig-svg){display:none!important}
#battleField.kami-lane-arena .kami-rig-svg{display:block!important;position:absolute;inset:-20% -22% -9%;width:144%;height:138%;pointer-events:none;overflow:visible;filter:drop-shadow(0 3px 2px #060b1299)}
#battleField.kami-lane-arena .kami-fighter[data-combat-renderer=skeletal] .unit-body{background-image:none!important}
#battleField.kami-lane-arena .kami-fighter .unit-body::before,#battleField.kami-lane-arena .kami-fighter .unit-body::after{display:none!important}
#battleField.kami-lane-arena{isolation:isolate;perspective:950px;overflow:hidden;background:radial-gradient(ellipse at 61% 18%,#bc4e4640,transparent 47%),linear-gradient(180deg,#101b30 0%,#24334a 27%,#293446 33%,#191923 90%,#0e101b 100%)!important}
.kami-lane-arena .kami-horizon{pointer-events:none;position:absolute;inset:0 0 41%;background:linear-gradient(180deg,#7b253f22,#0d172300 75%),repeating-linear-gradient(90deg,#0b142e00 0 8%,#060d1d88 8.2% 8.8%,#0b142e00 9% 17%);filter:drop-shadow(0 3px 7px #0007)}
.kami-lane-arena .kami-floor{pointer-events:none;position:absolute;inset:13% -18% -25%;transform:perspective(600px) rotateX(51deg) scale(1.24);transform-origin:center 50%;background:repeating-linear-gradient(0deg,#a3927922 0 2px,transparent 2px 65px),repeating-linear-gradient(90deg,#9d816022 0 2px,transparent 2px 93px),linear-gradient(#273447,#1b202e);border-top:4px solid #b5776760}
.kami-lane-arena .kami-track{pointer-events:none;position:absolute;left:1%;right:1%;height:2px;background:linear-gradient(90deg,transparent,#caa16b33 20%,#caa16b33 80%,transparent);box-shadow:0 4px 20px #d49a5750}
.kami-lane-arena .kami-lane-legend{position:absolute;right:5px;top:12px;color:#d7c7a5;font:9px/1.9 sans-serif;display:flex;flex-direction:column;background:#07111fb8;border-radius:8px;padding:4px 7px;opacity:.72;pointer-events:none}
.kami-lane-arena .kami-fighter{transform-origin:center 85%;will-change:transform,filter;transition:left .38s ease,top .38s ease,transform .26s ease;filter:drop-shadow(0 12px 9px #0007)}
.kami-lane-arena .kami-fighter.kami-low-hp .unit-life{filter:drop-shadow(0 0 6px #ff3737)}
.kami-lane-arena .kami-fighter.kami-fallen{filter:grayscale(1);opacity:.35;transform:scale(var(--kami-scale)) translateY(17px) rotate(-12deg)!important}
.kami-lane-arena .kami-fighter.kami-lunge{animation:kami-lunge .36s ease-out both}
.kami-lane-arena .kami-fighter.kami-impact{animation:kami-impact .32s ease-out}
.kami-lane-arena .kami-fighter.kami-cast{animation:kami-cast .48s ease-in-out}
.kami-lane-arena.kami-shake{animation:kami-camera .2s ease-in-out}
.kami-lane-arena .kami-burst{position:absolute;z-index:95;width:70px;height:70px;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);background:radial-gradient(circle,#fffad0 0%,#e77c53aa 20%,#fb4d2133 48%,transparent 68%);animation:kami-burst .42s ease-out forwards}
.kami-lane-arena .kami-action-status{position:absolute;bottom:-37px;left:-18px;min-width:95px;max-width:160px;z-index:100;border:1px solid #a59ad96b;background:#081223eb;color:#d6e6ff;font:9px/1.3 sans-serif;padding:3px 5px;border-radius:5px;text-align:center;pointer-events:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kami-lane-arena .kami-action-status[data-preparing=true]{border-color:#ffd37c;color:#ffdf99;box-shadow:0 0 14px #e5ab6d60}.kami-lane-arena .kami-ultimate-title{position:absolute;z-index:110;left:50%;top:38%;transform:translate(-50%,-50%);pointer-events:none;max-width:85%;white-space:normal;text-align:center;font:700 clamp(13px,2.4vw,29px)/1.3 Georgia,serif;color:#ffe4b4;text-shadow:0 2px 5px #000,0 0 12px #f13e43;animation:kami-ult 1.2s ease-out forwards;background:#140e24cf;padding:10px 20px;border:1px solid #cfad7d;border-radius:7px}@keyframes kami-ult{0%{opacity:0;filter:blur(5px);transform:translate(-50%,-50%) scale(.6)}20%,70%{opacity:1;filter:blur(0)}100%{opacity:0;transform:translate(-50%,-52%) scale(1.1)}}
.kami-lane-arena .kami-burst-magic{background:radial-gradient(circle,#f8f0ff 0%,#706ef6bb 22%,#4421d146 52%,transparent 70%)}
@keyframes kami-lunge{0%,100%{transform:scale(var(--kami-scale))}45%{transform:scale(var(--kami-scale)) translateX(var(--kami-step-x))}}
@keyframes kami-impact{30%{filter:brightness(2.2) drop-shadow(0 0 12px #ff7246)}}
@keyframes kami-cast{40%{filter:brightness(1.7) drop-shadow(0 0 19px #8d8aff)}}
@keyframes kami-camera{0%,100%{filter:none}35%{filter:brightness(1.1)}}
@keyframes kami-burst{from{opacity:1;transform:translate(-50%,-50%) scale(.28)}to{opacity:0;transform:translate(-50%,-50%) scale(2.4)}}
@media(max-width:570px){.kami-lane-arena .kami-lane-legend{font-size:7px}.kami-lane-arena .kami-burst{width:45px;height:45px}}
@media(prefers-reduced-motion:reduce){.kami-lane-arena .kami-fighter,.kami-lane-arena .kami-burst{animation:none!important;transition:none!important}}
`;
document.head.append(css);
window.KamiBattleLanes={place,tick,onAttack,onSkill,chooseTarget,laneFor,showAction,weaponReach,skillRangeMeters,worldDistance,rigState,version:8};
