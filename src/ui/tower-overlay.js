import {TOWER_FLOORS,normalizeTowerProgress,clearTowerFloor,getTowerParty} from '../systems/tower-progression.js';
const KEY='kami_tower_progress_v2',SAVE='kami_v16_master';
const el=document.createElement('div');el.id='kamiTowerOverlay';
el.innerHTML='<div class="kt-head"><b>TORRE DE LOS 30 PISOS</b><button id="ktClose">✕</button></div><p id="ktStatus"></p><div id="ktFloorList"></div><div id="ktBattle" hidden><h3 id="ktName"></h3><div id="ktUnits"></div><p id="ktLog"></p><button id="ktRetreat">Retirarse</button></div>';
const css=document.createElement('style');css.textContent=`
#ktOpen{position:fixed;right:14px;bottom:18px;z-index:1999;padding:13px 20px;border:1px solid #c99c57;border-radius:12px;background:#122034;color:#f3d29b;box-shadow:0 4px 18px #000b}
#kamiTowerOverlay{display:none;position:fixed;inset:0;z-index:2000;overflow:auto;background:linear-gradient(165deg,#06101b,#182538);color:#f2e5cc;padding:18px;font-family:system-ui}
#kamiTowerOverlay.open{display:block}
.kt-head{display:flex;justify-content:space-between;align-items:center;font-size:19px}.kt-head button,#ktRetreat{padding:10px;background:#27364b;color:white;border:1px solid #8c795c;border-radius:8px}
#ktFloorList{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:9px}
.kt-floor{background:#142333;color:#f0e6d1;border:1px solid #806745;border-radius:10px;padding:12px;text-align:left}
.kt-floor:disabled{opacity:.35}.kt-floor strong{display:block;font-size:22px}
#ktBattle{margin-top:16px;background:#0e1722;border:1px solid #806745;padding:14px;border-radius:12px}
#ktUnits{position:relative;min-height:300px;background:repeating-linear-gradient(25deg,#1b2929,#1b2929 26px,#253632 27px,#253632 50px);border-radius:12px;overflow:hidden}
.kt-unit{position:absolute;transform:translate(-50%,-50%);width:95px;min-height:48px;padding:4px;border-radius:9px;background:#263d49;border:1px solid #7d99a8;text-align:center;font-size:11px;transition:left .08s linear,top .08s linear}
.kt-unit.enemy{background:#4b292b;border-color:#ae7570}.kt-unit progress{display:block;width:100%;height:8px}
`;
document.head.append(css);document.body.append(el);
const open=document.createElement('button');open.id='ktOpen';open.textContent='⚔ Torre';document.body.append(open);
const by=id=>document.getElementById(id);
let progress;try{progress=normalizeTowerProgress(JSON.parse(localStorage.getItem(KEY)))}catch{progress=normalizeTowerProgress(null)}
let fight=null, raf=0, last=0, currentFloor=1;
function persist(){localStorage.setItem(KEY,JSON.stringify(progress))}
function mainSave(){try{return JSON.parse(localStorage.getItem(SAVE))||{}}catch{return {}}}
function party(){
 const s=mainSave(),arr=getTowerParty(s.characters,s.team);
 const chosen=arr.slice(0,5);
 return chosen.map((c,i)=>{const st=c.stats||{}, hp=80+(st.CON||10)*8+(c.level||1)*6;return {
 id:c.id, name:c.name||'Aventurero', side:'ally', x:16,y:15+i*16,hp,max:hp,
 damage:8+(st.FUE||10)*1.5+(c.level||1)*2,range:c.role?.match(/mago|arquero|tirador|hechic/i)?27:12,speed:12+(st.AGI||10)*0.15,cd:0,
 dodge:Math.min(.3,(st.AGI||0)*.004),block:Math.min(.25,(st.DEF||0)*.003)
 }});
}
function enemies(f,w){const boss=!!f.boss&&w===f.waves,n=boss?1:Math.min(5,2+Math.floor((f.floor-1)/10));
return Array.from({length:n},(_,i)=>({id:'e'+i,name:boss?f.boss:f.enemies[i%f.enemies.length],side:'enemy',x:85,y:20+i*18,
 hp:(boss?360:65)*f.enemyHPPercent/100,max:(boss?360:65)*f.enemyHPPercent/100,
 damage:(boss?22:7)*f.enemyAttackPercent/100,range:boss?16:12,speed:boss?7:9,cd:0,dodge:0,block:boss?.15:0
 }))}
function draw(){if(!fight)return;by('ktUnits').innerHTML=[...fight.allies,...fight.enemies].filter(u=>u.hp>0).map(u=>`<div class="kt-unit ${u.side}" style="left:${u.x}%;top:${u.y}%"><div>${escapeText(u.name)}</div><progress max="${u.max}" value="${u.hp}"></progress></div>`).join('');
by('ktName').textContent=`Piso ${fight.f.floor} · ${fight.f.zone} · Oleada ${fight.wave}/${fight.f.waves}`}
function escapeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function win(){const result=clearTowerFloor(progress,fight.f.floor);progress=result.state;persist();if(result.rewards){
 // Reward grant to the actual save only when successfully parsed and matching an existing resource object.
 const s=mainSave();if(s.resources&&Number.isFinite(s.resources.gold)){s.resources.gold+=result.rewards.coins;
 try{localStorage.setItem(SAVE,JSON.stringify(s))}catch{}}
 }
 by('ktLog').textContent='¡Victoria! '+(result.rewards?'Primera recompensa: '+result.rewards.coins+' monedas / '+result.rewards.xp+' XP (XP pendiente de conexión a personajes).':'Piso ya completado.');
 stop(false);render();}
function stop(hide=true){cancelAnimationFrame(raf);raf=0;last=0;if(fight)fight.active=false;if(hide)by('ktBattle').hidden=true;}
function tick(t){if(!fight?.active)return;let dt=Math.min(.05,(t-last)/1000||.016);last=t;
const allies=fight.allies.filter(u=>u.hp>0),foes=fight.enemies.filter(u=>u.hp>0);
for(const u of [...allies,...foes]){const enemy=(u.side==='ally'?foes:allies).filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-u.x,(a.y-u.y)*1.4)-Math.hypot(b.x-u.x,(b.y-u.y)*1.4))[0];if(!enemy)continue;
const dx=enemy.x-u.x,dy=(enemy.y-u.y)*1.4,dist=Math.hypot(dx,dy);u.cd-=dt;
if(dist>u.range){const mv=Math.min(dist-u.range,u.speed*dt);u.x+=dx/dist*mv;u.y+=dy/dist*mv/1.4}
else if(u.cd<=0){u.cd=1.1;if(Math.random()>=enemy.dodge){let dmg=u.damage;if(Math.random()<enemy.block)dmg*=.55;enemy.hp=Math.max(0,enemy.hp-dmg)}}}
if(fight.allies.every(u=>u.hp<=0)){by('ktLog').textContent='Derrota: mejora tus héroes antes de reintentar.';stop(false);return}
if(fight.enemies.every(u=>u.hp<=0)){if(fight.wave<fight.f.waves){fight.wave++;fight.enemies=enemies(fight.f,fight.wave);
by('ktLog').textContent='¡Oleada superada!'}else{win();return}}
draw();raf=requestAnimationFrame(tick)}
function start(n){stop();const f=TOWER_FLOORS[n-1],allies=party();by('ktBattle').hidden=false;if(!allies.length){by('ktLog').textContent='Necesitas invocar personajes vivos para entrar.';return}
fight={f,wave:1,allies,enemies:enemies(f,1),active:true};by('ktLog').textContent='Combate automático en progreso';last=0;draw();raf=requestAnimationFrame(tick)}
function render(){by('ktStatus').textContent='Desbloqueado hasta el piso '+progress.unlockedFloor;
by('ktFloorList').innerHTML=TOWER_FLOORS.map(f=>`<button class="kt-floor" data-floor="${f.floor}" ${f.floor>progress.unlockedFloor?'disabled':''}><strong>${f.floor} ${progress.completed.includes(f.floor)?'✓':''}</strong>${escapeText(f.zone)}<small style="display:block">${f.boss?'JEFE: '+escapeText(f.boss):f.elite?'ÉLITE · ':'Normal · '} ${f.waves} oleadas</small></button>`).join('')}
open.addEventListener('click',()=>{el.classList.add('open');render()});by('ktClose').addEventListener('click',()=>{stop();el.classList.remove('open')});
by('ktRetreat').addEventListener('click',()=>{stop();by('ktLog').textContent='Retirada'});
by('ktFloorList').addEventListener('click',e=>{const b=e.target.closest('[data-floor]');if(b&&!b.disabled)start(Number(b.dataset.floor))});
