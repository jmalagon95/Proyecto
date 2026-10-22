import {weaponRangeMeters,distanceMeters,isMelee,ARENA_METERS,skillRangeMeters} from './combat-reach.js';
import {attachRig,playRig,tickRig,rigState} from './mannequin-rig.js';
import {playKairakhBasicAttack} from './kairakh-sprite-attack.js';
// Kami No Challenge · Campo 2.5D por carriles.
// Renderer ligero: conserva la simulación existente y reacciona a eventos reales.
const visual=new WeakMap();
const engagements=new WeakMap();
// Altura de los PIES de cada carril, en % del campo: trasero, medio, frontal.
// El horizonte del mapa está al 40 %; los tres carriles van sobre la pradera.
const laneOffsets=[55,71,88];
const GROUND_MIN=50,GROUND_MAX=92;
const topFor=y=>'calc('+y+'% - var(--kami-unit-h))';
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
 const y=laneOffsets[depth]+((index%2)?1.2:-.8);
 // Perspectiva: el carril del fondo se ve más pequeño.
 const scale=[.74,.87,1][depth]*(unit.enemy?.94:1);
 return {x,y,scale,depth};
}
function createArena(field){
 if(field.dataset.kamiDepth==='2')return;
 field.dataset.kamiDepth='2';
 field.classList.add('kami-lane-arena');
 // Mapa pintado: cielo, montañas, bosque, pradera y tres caminos de tierra en profundidad.
 const map=document.createElement('div');map.className='kami-arena-map';map.setAttribute('aria-hidden','true');
 map.innerHTML=ARENA_SKY+ARENA_GROUND;
 field.prepend(map);
 laneOffsets.forEach((y,i)=>{
  const tag=document.createElement('span');tag.className='kami-lane-tag';tag.style.top=y+'%';
  tag.textContent=['I','II','III'][i];tag.title='Carril '+(i+1);tag.setAttribute('aria-hidden','true');
  field.append(tag);
 });
}
// Fondo lejano: se recorta por los lados pero siempre apoyado en el horizonte.
const ARENA_SKY=`<svg class="kami-arena-sky" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice">
<defs><linearGradient id="kaSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f78a8"/><stop offset=".55" stop-color="#a7c3d6"/><stop offset=".9" stop-color="#f3dcb2"/><stop offset="1" stop-color="#f7e3bd"/></linearGradient>
<radialGradient id="kaSun" cx=".72" cy=".78" r=".35"><stop offset="0" stop-color="#fff4d6" stop-opacity=".95"/><stop offset="1" stop-color="#fff4d6" stop-opacity="0"/></radialGradient>
<linearGradient id="kaFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ea7c4"/><stop offset="1" stop-color="#b9c8d3"/></linearGradient>
<linearGradient id="kaMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f8a77"/><stop offset="1" stop-color="#7c9c7a"/></linearGradient></defs>
<rect width="1200" height="400" fill="url(#kaSky)"/><rect width="1200" height="400" fill="url(#kaSun)"/>
<g fill="#fff" opacity=".55"><ellipse cx="220" cy="90" rx="90" ry="16"/><ellipse cx="280" cy="78" rx="60" ry="14"/><ellipse cx="860" cy="120" rx="110" ry="14"/><ellipse cx="930" cy="108" rx="55" ry="12"/></g>
<path d="M0 300 L90 228 L160 262 L260 170 L360 250 L430 214 L520 268 L640 182 L740 246 L820 206 L930 262 L1040 196 L1200 280 L1200 400 L0 400Z" fill="url(#kaFar)" opacity=".85"/>

<path d="M0 330 Q120 286 240 318 T480 312 T720 322 T960 306 T1200 322 L1200 400 L0 400Z" fill="url(#kaMid)"/>
<path d="M0 372 q10-34 22-6 q8-40 20-4 q12-46 24-2 q10-38 22 0 q12-44 26-2 q8-30 18 2 q14-48 26-4 q10-34 22 0 q12-40 24-2 q10-30 20 0 q14-46 26-2 q10-36 22 2 q12-42 24-2 q10-30 20 2 q14-44 26-4 q8-32 20 0 q12-38 24-2 q10-34 22 2 q14-46 26-2 q10-30 20 0 q12-42 24-2 q10-36 22 0 q12-40 24 0 q10-32 20 0 q14-44 26-2 q10-34 22 2 q12-40 24-2 q10-30 20 2 q14-46 26-4 q8-30 20 0 q12-40 24-2 q10-36 22 2 q12-38 24-2 q10-34 22 0 q14-46 26-2 q10-30 20 2 q12-42 24-2 q10-36 22 0 q12-40 24-2 q10-30 20 2 q14-44 26-2 q10-36 22 0 q12-42 24-2 q10-30 20 2 q14-46 26-2 q10-34 22 0 q12-40 24-2 q10-30 20 0 L1200 400 L0 400Z" fill="#2f5544"/>
</svg>`;
// Pradera: se estira a todo el ancho para que los carriles coincidan siempre con laneOffsets.
const ARENA_GROUND=`<svg class="kami-arena-ground" viewBox="0 0 1000 600" preserveAspectRatio="none">
<defs><linearGradient id="kaGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ea65a"/><stop offset=".35" stop-color="#5f8f45"/><stop offset="1" stop-color="#3d6a33"/></linearGradient>
<linearGradient id="kaPath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9ad7c" stop-opacity="0"/><stop offset=".25" stop-color="#bb9d6b" stop-opacity=".62"/><stop offset=".75" stop-color="#a7895a" stop-opacity=".62"/><stop offset="1" stop-color="#9a7d50" stop-opacity="0"/></linearGradient>
<filter id="kaNoise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .35" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .12  0 0 0 0 .22  0 0 0 0 .08  0 0 0 1.4 -.55"/></filter>
<filter id="kaSoft"><feGaussianBlur stdDeviation="2.4"/></filter></defs>
<rect width="1000" height="600" fill="url(#kaGrass)"/>
<rect width="1000" height="600" filter="url(#kaNoise)" opacity=".55"/>
<g filter="url(#kaSoft)"><rect x="-20" y="${(laneOffsets[0]-40)/60*600-14}" width="1040" height="30" fill="url(#kaPath)"/>
<rect x="-20" y="${(laneOffsets[1]-40)/60*600-20}" width="1040" height="42" fill="url(#kaPath)"/>
<rect x="-20" y="${(laneOffsets[2]-40)/60*600-27}" width="1040" height="56" fill="url(#kaPath)"/></g>
<g fill="#f6e7a6" opacity=".8"><circle cx="70" cy="70" r="2"/><circle cx="420" cy="120" r="2.4"/><circle cx="770" cy="58" r="2"/><circle cx="905" cy="330" r="3"/><circle cx="160" cy="455" r="3.2"/><circle cx="610" cy="290" r="2.6"/></g>
<g fill="#e9a3b5" opacity=".7"><circle cx="300" cy="40" r="1.8"/><circle cx="520" cy="215" r="2.4"/><circle cx="860" cy="170" r="2.2"/><circle cx="60" cy="300" r="2.8"/></g>
<g fill="#7d7b70" opacity=".75"><ellipse cx="560" cy="105" rx="9" ry="4"/><ellipse cx="240" cy="210" rx="7" ry="3"/><ellipse cx="830" cy="430" rx="11" ry="5"/></g>
<rect width="1000" height="70" fill="#f3dfb2" opacity=".18"/>
</svg>`;
function place(unit,node,field=getField()){
 if(!field||!node)return;
 createArena(field);
 const p=position(unit);
 const prior=visual.get(unit);
 // Formation changes reset the spatial anchor, but attacks never do.
 node.classList.add('kami-fighter');
 node.dataset.lane=String(p.depth);
 node.style.setProperty('--kami-scale',String(p.scale));
 node.style.left=p.x+'%';node.style.top=topFor(p.y);node.classList.toggle('kami-faces-left',Boolean(unit.enemy));
 node.style.zIndex=String(20+p.depth*20+(unit.enemy?2:5)+p.x/20);
 node.style.transform='scale('+p.scale+')';
 visual.set(unit,{x:p.x,y:p.y,scale:p.scale,depth:p.depth,active:false});
 slots.delete(unit);
 attachRig(unit);
 if(prior&&(Math.abs(prior.x-p.x)>.2||Math.abs(prior.y-p.y)>.2))
  playRig(unit,'run',{duration:.4});
 // Combat units are articulated models, never flat race portraits or enemy artwork.
 node.dataset.combatRenderer='skeletal';
}
function slash(node){
 if(!node?.isConnected||!isMeleeNode(node))return;
 const fx=document.createElement('span');fx.className='kami-slash';fx.setAttribute('aria-hidden','true');
 node.append(fx);setTimeout(()=>fx.remove(),360);
}
function isMeleeNode(node){return Number(node.dataset.weaponReach||0)<=3}
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

// Occupancy is measured in arena metres. Reservation happens when movement starts,
// so simultaneous attackers cannot all select the same spot.
const slots=new WeakMap();
const COLLISION_RADIUS_M=0.72;
function meters(p){return {x:p.x*ARENA_METERS.width/100,y:p.y*ARENA_METERS.height/100}}
function percent(p){return {x:p.x/ARENA_METERS.width*100,y:p.y/ARENA_METERS.height*100}}
function allOccupants(actor){
 const b=window.KamiCurrentBattle||null;
 // The arena roster is cached by tick and includes both teams.
 return (arenaUnits||[]).filter(u=>u!==actor&&u.hp>0&&u.node?.isConnected);
}
let arenaUnits=[];
function occupied(point,actor,target){
 const pos=meters(point);
 return allOccupants(actor).reduce((penalty,other)=>{
  const known=slots.get(other)||unitPosition(other),p=meters(known);
  const separation=Math.hypot(pos.x-p.x,pos.y-p.y);
  const radius=other===target?0.68:COLLISION_RADIUS_M*2;
  return penalty+Math.max(0,radius-separation)*120;
 },0);
}
function approachSlot(actor,target,reach){
 const from=unitPosition(actor),to=unitPosition(target),a=meters(from),b=meters(to);
 const heading=Math.atan2(a.y-b.y,a.x-b.x);
 const radius=Math.max(.8,Math.min(reach*.82,2.8));
 let best=null;
 // Search around the enemy, not just on a single straight line.
 for(const offset of [0,.45,-.45,.9,-.9,1.35,-1.35,Math.PI,2.15,-2.15]){
  const angle=heading+offset,raw={x:b.x+Math.cos(angle)*radius,y:b.y+Math.sin(angle)*radius};
  const p={x:clamp(raw.x,1,ARENA_METERS.width-1),y:clamp(raw.y,GROUND_MIN*ARENA_METERS.height/100,GROUND_MAX*ARENA_METERS.height/100)};
  const percentPoint=percent(p);
  const travel=Math.hypot(a.x-p.x,a.y-p.y);
  const collision=occupied(percentPoint,actor,target);
  const reachError=Math.max(0,Math.hypot(p.x-b.x,p.y-b.y)-reach+.15)*200;
  const score=travel+collision+reachError+Math.abs(offset)*.35;
  if(!best||score<best.score)best={...percentPoint,score};
 }
 return best||from;
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
  if(!illustrated){playRig(actor,'attack');slash(node);after(impact,190)}
  after(()=>{if(node._kamiReachSequence===seq)node._kamiReachSequence=null},illustrated?950:480);
  return;
 }
 // Approach to the edge of the weapon reach, with correct x AND depth movement.
 const destination=approachSlot(actor,target,reach);
 const {x,y}=destination;
 slots.set(actor,{x,y});
 const moveMs=clamp(Math.round(Math.max(0,distance-reach)*125),280,1600),strikeMs=350;
 node.classList.add('kami-approaching');
 node.style.transition='left '+moveMs+'ms linear,top '+moveMs+'ms linear,transform .25s ease';
 node.style.left=x+'%';node.style.top=topFor(y);
 node.style.zIndex=String(85+laneOf(actor)*10);
 playRig(actor,'run',{duration:moveMs/1000});
 after(()=>{
  if(target.hp<=0){settle();return}
  visual.set(actor,{x,y,scale:a.scale,depth:a.depth,active:false});
  node.classList.remove('kami-approaching');node.classList.add('kami-in-range');
  // Remain on the contact spot until the hit animation reaches its strike frame.
  const illustrated=playKairakhBasicAttack(actor,{onImpact:impact});
  if(!illustrated){playRig(actor,'attack');slash(node);after(impact,Math.round(strikeMs*.55))}
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
  slots.delete(actor);
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
 arenaUnits=[...b.allies,...b.enemies];
 coordinateEnemyFocus(b,dt);
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
// Enemy tactical focus: stable squad targets, threat assessment and finishing pressure.
const enemyFocus=new WeakMap();
const targetPressure=new WeakMap();
let focusClock=0;
function unitPosition(u){return visual.get(u)||position(u)}
function threatScore(attacker,target){
 const life=target.hp/Math.max(1,target.maxHp);
 const distance=worldDistance(unitPosition(attacker),unitPosition(target));
 const role=String(target.character?.role||target.ref?.role||'').toLowerCase();
 const heal=/sanador|curador|apoyo|healer|hierofante|custodio/.test(role);
 const ranged=/mago|magia|ranger|tirador|arquero|invoc|dps/.test(role);
 const tank=/tanque|defens|protector/.test(role);
 const pressure=targetPressure.get(target)||0;
 // Same scale for every enemy: weak targets, support units, reachable victims.
 return (1-life)*35+(heal?19:0)+(ranged?11:0)-(tank?9:0)
  -Math.min(26,distance*1.2)+Math.min(17,pressure*6);
}
function chooseTarget(attacker,candidates){
 const alive=candidates.filter(e=>e.hp>0);
 if(!alive.length)return null;
 if(!attacker.enemy){
  const lane=laneOf(attacker);
  const role=String(attacker.character?.role||attacker.ref?.role||'').toLowerCase();
  const threat=e=>{
   const dist=Math.abs(lane-laneOf(e)),life=e.hp/Math.max(1,e.maxHp);
   let score=30-dist*19+(1-life)*15;
   if(/tanque|defens|prote/.test(role))score+=dist===0?7:0;
   if(/ranger|tirador|mag|dps|duelista/.test(role))score+=(1-life)*16;
   return score;
  };
  return alive.sort((a,b)=>threat(b)-threat(a)||a.hp-b.hp)[0];
 }
 // Focus survives attack cooldowns. A dead/removed target is invalid immediately.
 const old=enemyFocus.get(attacker),current=old&&alive.find(u=>u===old.target);
 const ranked=[...alive].sort((a,b)=>threatScore(attacker,b)-threatScore(attacker,a)||a.hp-b.hp);
 const best=ranked[0],bestScore=threatScore(attacker,best);
 if(current){
  const currentScore=threatScore(attacker,current);
  // Switch only for a considerably better opportunity and after a commitment window.
  if(focusClock<old.lockUntil||best===current||bestScore<currentScore+22)return current;
 }
 enemyFocus.set(attacker,{target:best,lockUntil:focusClock+4});
 return best;
}
function coordinateEnemyFocus(b,dt){
 focusClock+=Math.max(0,Number(dt)||0);
 if(!b?.enemies||!b?.allies)return;
 const foes=b.enemies.filter(u=>u.hp>0),heroes=b.allies.filter(u=>u.hp>0);
 if(!foes.length||!heroes.length)return;
 // Actual squad-wide focus groups: max 3 attackers per target before spreading,
 // unless there is only one surviving hero.
 const counts=new Map(heroes.map(u=>[u,0]));
 for(const foe of foes){
  const locked=enemyFocus.get(foe);
  if(locked&&heroes.includes(locked.target))counts.set(locked.target,counts.get(locked.target)+1);
 }
 for(const foe of foes){
  const old=enemyFocus.get(foe);
  if(old&&heroes.includes(old.target))continue;
  const ordered=[...heroes].sort((a,c)=>{
   const sa=threatScore(foe,a)-(counts.get(a)>=3&&heroes.length>1?28:0);
   const sc=threatScore(foe,c)-(counts.get(c)>=3&&heroes.length>1?28:0);
   return sc-sa||a.hp-c.hp;
  });
  const target=ordered[0];
  enemyFocus.set(foe,{target,lockUntil:focusClock+4});
  counts.set(target,counts.get(target)+1);
 }
 for(const h of heroes)targetPressure.set(h,counts.get(h));
}

// El rig es ahora el único cuerpo visible en combate: no hay modo de
// sustituirlo por imágenes estáticas. Los retratos del lobby no se alteran.
const css=document.createElement('style');css.id='kami-lanes-style';
css.textContent=`
/* ── Campo de batalla v0.18: mapa pintado con tres carriles en profundidad ── */
#battleField.kami-lane-arena{container-type:size;isolation:isolate;overflow:hidden;background:#3d6a33!important;
 border:1px solid #d9bd8655!important;box-shadow:0 18px 50px #000b!important}
#battleField.kami-lane-arena::before,#battleField.kami-lane-arena::after{content:none!important}
#battleField.kami-lane-arena>.battle-foreground,#battleField.kami-lane-arena>.lane-label,#battleField.kami-lane-arena>.attackline,
#battleField.kami-lane-arena>.kami-horizon,#battleField.kami-lane-arena>.kami-floor,#battleField.kami-lane-arena>.kami-track,
#battleField.kami-lane-arena>.kami-lane-legend{display:none!important}
.kami-arena-map{position:absolute;inset:0;z-index:0;pointer-events:none}
.kami-arena-sky{position:absolute;left:0;top:0;width:100%;height:41%;display:block}
.kami-arena-ground{position:absolute;left:0;top:40%;width:100%;height:60%;display:block}
.kami-arena-map::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 62%,transparent 55%,#0a140f99 100%),linear-gradient(180deg,transparent 80%,#13241a66)}
.kami-lane-tag{position:absolute;left:8px;z-index:1;transform:translateY(-70%);min-width:22px;padding:2px 6px;text-align:center;border-radius:6px;
 background:#0b1520b0;border:1px solid #f1d59a55;color:#f3dfb6;font:600 10px/1.4 Georgia,serif;pointer-events:none}
/* Combatientes: tamaño relativo a la altura del campo, apoyados por los pies en su carril */
#battleField.kami-lane-arena .kami-fighter{--kami-unit-h:clamp(96px,32cqh,220px);
 width:calc(var(--kami-unit-h)*.62)!important;height:var(--kami-unit-h)!important;margin-left:calc(var(--kami-unit-h)*-.31);
 transform-origin:50% 100%;animation:none!important;background:none!important;border:0!important;box-shadow:none!important;
 will-change:left,top,transform;transition:left .38s ease,top .38s ease,transform .26s ease;filter:none}
#battleField.kami-lane-arena .kami-fighter::before{content:'';position:absolute;left:12%;right:12%;bottom:-3%;height:9%;border-radius:50%;
 background:radial-gradient(ellipse,#0b1a0fa6,transparent 70%);z-index:0}
#battleField.kami-lane-arena .kami-rig-host{position:absolute!important;inset:0!important;background:none!important;border:0!important;
 border-radius:0!important;box-shadow:none!important;filter:none!important;outline:none}
#battleField.kami-lane-arena .kami-rig-host > svg:not(.kami-rig-svg){display:none!important}
#battleField.kami-lane-arena .kami-rig-svg{display:block!important;position:absolute;left:50%;bottom:-6.5%;height:112%;width:auto;aspect-ratio:140/224;
 transform:translateX(-50%);pointer-events:none;overflow:visible;filter:drop-shadow(0 2px 1.5px #0b120d99)}
#battleField.kami-lane-arena .kami-faces-left .kami-rig-svg{transform:translateX(-50%) scaleX(-1)}
#battleField.kami-lane-arena .kami-fighter .unit-life{top:-7%!important;left:14%!important;right:14%!important;height:5px!important;z-index:3;
 border:1px solid #0009!important;background:#1b1416d9!important;box-shadow:0 1px 3px #0008}
#battleField.kami-lane-arena .kami-fighter .unit-name{bottom:auto!important;top:-17%;z-index:3;font:600 9px/1.3 system-ui,sans-serif!important;
 background:#0b1520c4!important;color:#f8ecd2!important;padding:1px 6px!important;border-radius:5px!important}
#battleField.kami-lane-arena .kami-fighter.enemy .unit-name{color:#ffd7c4!important}
#battleField.kami-lane-arena .kami-fighter.kami-low-hp .unit-life{box-shadow:0 0 8px #ff4a4a}
#battleField.kami-lane-arena .kami-fighter.kami-fallen,#battleField.kami-lane-arena .kami-fighter.ko{opacity:.55;filter:grayscale(.85) brightness(.75)!important;transform:scale(var(--kami-scale))!important}
#battleField.kami-lane-arena .kami-fighter.kami-fallen .unit-life,#battleField.kami-lane-arena .kami-fighter.kami-fallen .unit-name,
#battleField.kami-lane-arena .kami-fighter.kami-fallen .kami-action-status{display:none}
#battleField.kami-lane-arena .kami-fighter.kami-impact .kami-rig-svg{animation:kami-impact .3s ease-out}
#battleField.kami-lane-arena .kami-fighter.kami-cast .kami-rig-svg{animation:kami-cast .5s ease-in-out}
/* Estela del arma al atacar */
.kami-lane-arena .kami-slash{position:absolute;z-index:4;left:40%;top:6%;width:120%;height:85%;pointer-events:none;border-radius:50%;
 border-top:3px solid #fffbe8;border-right:2px solid #ffe7a6aa;filter:drop-shadow(0 0 6px #ffd27a);opacity:0;transform-origin:20% 80%;
 animation:kami-slash .32s ease-out forwards}
.kami-faces-left .kami-slash{left:auto;right:40%;transform:scaleX(-1);transform-origin:80% 80%}
@keyframes kami-slash{0%{opacity:0;rotate:-70deg;scale:.7}35%{opacity:1}100%{opacity:0;rotate:35deg;scale:1.05}}
.kami-lane-arena.kami-shake{animation:kami-camera .22s ease-in-out}
.kami-lane-arena .kami-burst{position:absolute;z-index:95;width:70px;height:70px;border-radius:50%;pointer-events:none;transform:translate(-50%,-120%);
 background:radial-gradient(circle,#fffad0 0%,#ffbd73cc 22%,#fb6a2144 50%,transparent 70%);animation:kami-burst .42s ease-out forwards}
.kami-lane-arena .kami-burst-magic{background:radial-gradient(circle,#f8f0ff 0%,#8f8cffcc 24%,#5a2ce14a 54%,transparent 72%)}
/* Estado de técnica: solo mientras se prepara una habilidad */
.kami-lane-arena .kami-action-status{position:absolute;bottom:-20%;left:50%;transform:translateX(-50%);z-index:4;max-width:170px;
 border:1px solid #ffd37c;background:#0b1424eb;color:#ffdf99;font:600 9px/1.3 system-ui,sans-serif;padding:2px 6px;border-radius:5px;
 white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;box-shadow:0 0 12px #e5ab6d55}
.kami-lane-arena .kami-action-status:not([data-preparing=true]){display:none}
.kami-lane-arena .kami-ultimate-title{position:absolute;z-index:110;left:50%;top:30%;transform:translate(-50%,-50%);pointer-events:none;max-width:85%;
 text-align:center;font:700 clamp(14px,4cqw,30px)/1.3 Georgia,serif;color:#ffe4b4;text-shadow:0 2px 5px #000,0 0 12px #f13e43;animation:kami-ult 1.2s ease-out forwards;
 background:#140e24cf;padding:10px 20px;border:1px solid #cfad7d;border-radius:8px}
@keyframes kami-ult{0%{opacity:0;filter:blur(5px);transform:translate(-50%,-50%) scale(.6)}20%,70%{opacity:1;filter:blur(0)}100%{opacity:0;transform:translate(-50%,-52%) scale(1.1)}}
@keyframes kami-impact{0%{filter:brightness(3) drop-shadow(0 0 10px #fff)}100%{filter:drop-shadow(0 2px 1.5px #0b120d99)}}
@keyframes kami-cast{45%{filter:brightness(1.6) drop-shadow(0 0 16px #9a97ff)}}
@keyframes kami-camera{0%,100%{transform:none}30%{transform:translate(2px,-1px)}65%{transform:translate(-2px,1px)}}
@keyframes kami-burst{from{opacity:1;transform:translate(-50%,-120%) scale(.28)}to{opacity:0;transform:translate(-50%,-120%) scale(2.2)}}
@media(max-width:570px){.kami-lane-arena .kami-burst{width:46px;height:46px}.kami-lane-tag{font-size:9px;left:5px}}
@media(prefers-reduced-motion:reduce){.kami-lane-arena .kami-fighter,.kami-lane-arena .kami-burst,.kami-lane-arena .kami-slash{animation:none!important;transition:none!important}}
`;
document.head.append(css);
window.KamiBattleLanes={place,tick,onAttack,onSkill,chooseTarget,laneFor,showAction,weaponReach,skillRangeMeters,worldDistance,rigState,version:10};
