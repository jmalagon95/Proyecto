import fs from 'node:fs';
import vm from 'node:vm';
let html=fs.readFileSync('index.html','utf8');
const marker='/* KAMI_MISSION_EXPERIENCE_V1 */';
const inject=(anchor,code)=>{const n=html.split(anchor).length-1;if(n!==1)throw Error('Ancla '+anchor.slice(0,25)+': '+n);html=html.replace(anchor,code+anchor)};
const replace=(old,now)=>{const n=html.split(old).length-1;if(n!==1)throw Error('Patrón '+old.slice(0,25)+': '+n);html=html.replace(old,now)};
if(!html.includes(marker)){
const code=String.raw`
/* KAMI_MISSION_EXPERIENCE_V1 */
function missionSquads(){if(!Array.isArray(state.missionPresets))state.missionPresets=[];while(state.missionPresets.length<5)state.missionPresets.push(null);return state.missionPresets}
function availableSquad(ids){return [...new Set((ids||[]).filter(id=>state.characters.some(c=>c.id===id&&!c.dead)))].slice(0,5)}
const presetBox=document.createElement('section');presetBox.id='kamiPresetBox';
presetBox.innerHTML='<strong>⚔ EQUIPOS GUARDADOS (5)</strong><div id="kamiPresetRows"></div>';
$('teamSlots').before(presetBox);
const css=document.createElement('style');css.textContent='#kamiPresetBox{margin:10px 0;padding:12px;background:#101a2b;border:1px solid #d9b57455;border-radius:14px}.kami-preset{display:flex;align-items:center;gap:5px;padding:8px 0;border-bottom:1px solid #ffffff1b}.kami-preset span{flex:1;font-size:11px;min-width:0}.kami-preset small{display:block;opacity:.7}.kami-preset button,.kami-res-tab{font-size:11px;padding:7px;color:#f0d3a2;background:#ffffff0c;border:1px solid #d7b87966;border-radius:8px}.kami-preset button:disabled{opacity:.3}#kamiChronicle{margin:10px 0;padding:10px;border:1px solid #d7b87966;border-radius:13px;background:#091321;max-height:280px;overflow:auto;font-size:11px}#kamiChronicle .entry{padding:5px 0;border-bottom:1px solid #ffffff14}#kamiChronicle b{color:#e6c186}.kami-result-tabs{display:flex;gap:8px;margin:12px 0}.kami-damagebar{height:7px;background:#ffffff18;border-radius:9px;overflow:hidden;margin-bottom:9px}.kami-damagebar i{display:block;height:100%;background:linear-gradient(90deg,#ab8241,#f0c984)}.kami-mvp{border:1px solid #d8b370;padding:15px;border-radius:14px;background:#201d23}';document.head.append(css);
function drawSquads(){
 $('kamiPresetRows').innerHTML=missionSquads().slice(0,5).map((p,i)=>{
  const ids=p?availableSquad(p.ids):[];
  const names=ids.map(id=>state.characters.find(c=>c.id===id)?.name).filter(Boolean);
  return '<div class="kami-preset"><span><b>'+esc(p?.name||'Equipo '+(i+1))+'</b><small>'+
   esc(p?names.join(' · '):'Sin guardar')+' · '+ids.length+'/5</small></span>'+
   '<button data-load="'+i+'" '+(!ids.length?'disabled':'')+'>Usar</button>'+
   '<button data-save="'+i+'">Guardar</button>'+
   '<button data-clear="'+i+'" '+(!p?'disabled':'')+'>×</button></div>';
 }).join('');
 $('kamiPresetRows').querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{
  const p=missionSquads()[Number(b.dataset.load)];if(p){state.team=availableSquad(p.ids);save();renderTeam()}
 });
 $('kamiPresetRows').querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{
  const i=Number(b.dataset.save),ids=availableSquad(state.team);
  if(!ids.length){toast('Elige al menos un personaje.');return}
  const p=missionSquads()[i];if(p&&!confirm('¿Sobrescribir '+p.name+'?'))return;
  const name=prompt('Nombre de la formación',p?.name||'Equipo '+(i+1));if(name===null)return;
  missionSquads()[i]={name:(name.trim()||'Equipo '+(i+1)).slice(0,30),ids};save();drawSquads();
 });
 $('kamiPresetRows').querySelectorAll('[data-clear]').forEach(b=>b.onclick=()=>{
  if(!confirm('¿Eliminar formación?'))return;
  missionSquads()[Number(b.dataset.clear)]=null;save();drawSquads();
 });
}
const oldTeamRender=renderTeam;
renderTeam=function(){oldTeamRender();drawSquads()};
const chronicle=document.createElement('div');chronicle.id='kamiChronicle';
chronicle.setAttribute('role','log');chronicle.setAttribute('aria-live','off');
chronicle.innerHTML='<b>CRÓNICA DEL COMBATE · TIEMPO REAL</b><div id="kamiChronicleEntries"></div>';
$('battleLog').after(chronicle);
function narrateMissionSecond(b,sec){
 if(!b||b.ended)return;
 const entries=b.pendingChronicle.splice(0);
 if(!entries.length){
  const alive=b.allies.filter(u=>u.hp>0).length,enemies=b.enemies.filter(u=>u.hp>0).length;
  entries.push(enemies?alive+' combatientes mantienen la posición ante '+enemies+' goblins.':
   'El escuadrón vigila el campo y espera a sus próximos adversarios.');
 }
 const msg=entries.join(' ').slice(0,700);
 const stamp=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 b.chronicle.push({sec,text:msg});
 const el=document.createElement('div');el.className='entry';
 const time=document.createElement('b');time.textContent='['+stamp+'] ';
 el.append(time,document.createTextNode(msg));$('kamiChronicleEntries').append(el);
 chronicle.scrollTop=chronicle.scrollHeight;
 $('battleLog').textContent='['+stamp+'] '+msg;
}
const summary=document.createElement('section');summary.id='kamiResultSummary';$('resultRows').after(summary);
function displayMissionStats(b){
 const units=[...b.allies].sort((a,z)=>(z.damage||0)-(a.damage||0)||(z.kills||0)-(a.kills||0));
 const total=units.reduce((n,u)=>n+Math.max(0,u.damage||0),0);
 summary.innerHTML='<div class="kami-result-tabs"><button class="kami-res-tab" data-stats="damage">Daño</button><button class="kami-res-tab" data-stats="mvp">MVP</button></div><div id="kamiStatsBody"></div>';
 const render=page=>{
  summary.querySelectorAll('[data-stats]').forEach(x=>x.style.background=x.dataset.stats===page?'#775a30':'#ffffff0c');
  if(page==='mvp'){
   const u=units[0];$('kamiStatsBody').innerHTML=u?'<div class="kami-mvp"><b>✦ MVP DE LA EXPEDICIÓN</b><h3>'+esc(u.name)+'</h3><p>'+
    Math.round(u.damage||0).toLocaleString('es-ES')+' daño · '+(u.kills||0)+' bajas · '+(total?(u.damage/total*100).toFixed(1):'0')+'% del equipo</p></div>':'Sin miembros';
  }else{
   $('kamiStatsBody').innerHTML=units.map((u,i)=>{
    const pct=total?Math.max(0,u.damage||0)/total*100:0;
    return '<div class="result-row"><span>#'+(i+1)+' '+esc(u.name)+'</span><b>'+Math.round(u.damage||0).toLocaleString('es-ES')+
     ' daño · '+pct.toFixed(1)+'%</b><span>'+(u.kills||0)+' bajas · '+(u.hp>0?'En pie':'Caído')+'</span></div>'+
     '<div class="kami-damagebar"><i style="width:'+pct+'%"></i></div>';
   }).join('');
  }
 };
 summary.querySelectorAll('[data-stats]').forEach(btn=>btn.onclick=()=>render(btn.dataset.stats));render('damage');
}
`;
inject("  $('startMission').onclick=",code);
replace("function logBattle(msg){if($('battleLog'))$('battleLog').textContent=msg}","function logBattle(msg){if(battle&&Array.isArray(battle.pendingChronicle)&&!battle.ended)battle.pendingChronicle.push(String(msg));if($('battleLog'))$('battleLog').textContent=msg}");
inject("team.forEach((c,index)=>",String.raw`
     battle.speed=1;battle.auto=true;
     battle.pendingChronicle=[];battle.chronicle=[];battle.lastNarratedSecond=0;
     $('kamiChronicleEntries').replaceChildren();
     $('simulateBattle').hidden=true;$('simulateBattle').disabled=true;
     $('speedBtn').hidden=true;$('speedBtn').disabled=true;
     $('autoBtn').hidden=true;$('autoBtn').disabled=true;
`);
inject("if(battle.allies.every(a=>a.hp<=0)){finishBattle(false,false);return}",String.raw`
     const reached=Math.min(180,Math.floor(battle.elapsed));
     while(battle.lastNarratedSecond<reached){battle.lastNarratedSecond++;narrateMissionSecond(battle,battle.lastNarratedSecond)}
`);
inject("let rewards=[];","     displayMissionStats(end);\n");
replace("$('simulateBattle').onclick=()=>{","$('simulateBattle').onclick=()=>{return;");
replace("Math.min(.09,(timestamp-battler.last)/1000)*battle.speed","Math.min(.09,(timestamp-battler.last)/1000)");
}
if(!html.includes(marker)||!html.includes('displayMissionStats(end)')||!html.includes('narrateMissionSecond(battle,battle.lastNarratedSecond)'))throw Error('Parche incompleto');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
if(process.argv.includes('--write'))fs.writeFileSync('index.html',html);
console.log('✅ Cinco presets; 180 segundos reales; crónica segundo a segundo; tabla de daño y MVP.');
