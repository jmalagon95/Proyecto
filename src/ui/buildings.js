import { el, button, stars, escapeHtml } from './components.js';
import { createHero } from './reveal.js';

const rarityColors={1:'#aab2c2',2:'#67c86f',3:'#5aa4ff',4:'#a777ff',5:'#f1c965',6:'#ff855e',7:'#ff56cf',8:'#f7f7ff'};
const namePools={kairakh:['Kael','Varik','Nayra'],humanos:['Kai','Aren','Mira'],elfos:['Aerin','Naelis','Sylwen'],kijins:['Akane','Raizen','Shuren'],bestias:['Fenra','Rogar','Lyka'],vampiros:['Veyra','Khael','Serah'],insectoides:['Lirien','Thrya','Irixa'],huecos:['Astra','Nohr','Eidra']};

function living(state){return state.characters.filter(c=>!c.dead)}
function capacity(state){return 11+Math.max(0,state.lobbyLevel-1)*2}
function combinedClasses(data,raceId){return [...(data.classes.generic||[]),...(data.classes[raceId]||[])]}
function random(arr){return arr[Math.floor(Math.random()*arr.length)]}
function summonOne(data){
  const race=random(data.races),cls=random(combinedClasses(data,race.id));
  const hero=createHero(race,cls,random(namePools[race.id]||['Aspirante']));
  hero.wallpaper=race.image; hero.renameRemaining=1; return hero;
}

function rarityLegend(){
  return Object.entries(rarityColors).map(([s,c])=>`<div class="rarity-key"><i style="--r:${c}"></i><b style="color:${c}">${'★'.repeat(Number(s))}</b></div>`).join('');
}

function slotHtml(char,i){
  return `<button type="button" class="room-slot-pro ${char?'occupied':'free'}" ${char?`data-char="${char.id}"`:''}>
    <div class="room-bg" style="${char?`background-image:url('${char.wallpaper||''}')`:''}"></div>
    <div class="room-shade"></div>
    <span class="room-index">${String(i+1).padStart(2,'0')}</span>
    <div class="room-copy">${char?`<b>${escapeHtml(char.name)}</b><span style="color:${rarityColors[char.currentStar]}">${stars(char.currentStar)}</span><small>${escapeHtml(char.className)}</small>`:`<b>+</b><small>Espacio libre</small>`}</div>
  </button>`;
}

function equipment(label,value='Vacío'){return `<div class="equip-slot-pro"><small>${label}</small><b>${escapeHtml(value)}</b></div>`}

function renderDorms(body,state,save,rerender){
  const chars=living(state),cap=capacity(state),active=chars.find(c=>c.id===state.activeCharacterId)||chars[0]||null;
  body.innerHTML=`
    <div class="dorms-pro">
      <div class="dorms-banner"><div><small>DORMITORIOS</small><h2>Habitaciones y gestión</h2><p>Aquí descansan tus compañeros. Las imágenes de cada plaza son los wallpapers de los personajes.</p></div><div class="capacity-box"><b>${chars.length}/${cap}</b><span>ocupadas</span></div></div>
      <div class="rooms-grid-pro">${Array.from({length:cap},(_,i)=>slotHtml(chars[i],i)).join('')}</div>
      ${active?`
      <div class="character-sheet-pro">
        <div class="character-wallpaper" style="background-image:url('${active.wallpaper||''}')"><div class="wallpaper-fade"></div><div class="wallpaper-name"><h2>${escapeHtml(active.name)}</h2><span style="color:${rarityColors[active.currentStar]}">${stars(active.currentStar)}</span><small>${escapeHtml(active.raceName)} · ${escapeHtml(active.className)} · Nv.${active.level}</small></div></div>
        <div class="character-data-pro">
          <div class="char-toolbar">
            <div><h2>${escapeHtml(active.name)}</h2><p>${escapeHtml(active.raceName)} · ${escapeHtml(active.className)}</p></div>
            <div class="rename-once"><input id="renameInput" maxlength="28" value="${escapeHtml(active.name)}" ${(active.renameRemaining??1)<1?'disabled':''}><button id="renameBtn" class="game-button dark" ${(active.renameRemaining??1)<1?'disabled':''}>Renombrar</button><small>${(active.renameRemaining??1)>0?'Puedes cambiar el nombre una vez.':'Nombre definitivo.'}</small></div>
          </div>
          <section class="sheet-section"><h3>Estadísticas</h3><div class="stat-grid">${Object.entries(active.stats).map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div></section>
          <section class="sheet-section"><h3>Equipamiento</h3><div class="equipment-grid-pro">${equipment('Arma principal',active.weapon)}${equipment('Cabeza')}${equipment('Pecho')}${equipment('Brazos')}${equipment('Piernas')}${equipment('Botas')}${equipment('Accesorio I')}${equipment('Accesorio II')}</div></section>
          <section class="sheet-double"><div class="info-card"><b>Skills</b><p>${active.skills.length?active.skills.map(s=>s.name).join(', '):'Sin skills aprendidas: usa ataque básico.'}</p></div><div class="info-card"><b>Pasivas</b><p>${active.passives.length?active.passives.map(p=>p.name).join(', '):'Sin pasivas.'}</p></div></section>
        </div>
      </div>`:''}
    </div>`;
  body.querySelectorAll('[data-char]').forEach(x=>x.onclick=()=>{state.activeCharacterId=x.dataset.char;save();rerender()});
  const rename=body.querySelector('#renameBtn');
  if(rename&&active)rename.onclick=()=>{const v=body.querySelector('#renameInput').value.trim();if(!v||(active.renameRemaining??1)<1)return;active.name=v;active.renameRemaining=0;save();rerender()};
}

function renderSanctuary(body,state,data,save,rerender){
  const chars=living(state),cap=capacity(state),free=Math.max(0,cap-chars.length),remaining=state.inhabitantsRemaining??state.world?.population??0;
  body.innerHTML=`
    <div class="sanctuary-pro">
      <div class="sanctuary-banner"><div><small>SANTUARIO DE INVOCACIÓN</small><h2>Aquí convergen los destinos</h2><p>Invoca nuevos aliados, asciende personajes o sacrifica los que ya no necesites.</p></div><div class="inhabitants-box"><small>Habitantes restantes</small><b>${remaining.toLocaleString('es-ES')}</b></div></div>
      <div class="sanctuary-tabs-pro"><button class="active" data-tab="summon">Invocar</button><button data-tab="ascend">Ascender</button><button data-tab="sacrifice">Sacrificar</button></div>
      <div class="sanctuary-panel active" data-panel="summon">
        <div class="summon-chamber-pro"><div class="summon-rings"></div><div class="summon-core"></div><span>Cámara de invocación</span></div>
        <div class="summon-info-row"><div><small>ESPACIOS LIBRES</small><b>${free}</b></div><div><small>PRIMERA MULTI x10</small><b>${state.summon?.freeMultiUsed?'Usada':'GRATIS'}</b></div></div>
        <div class="rarity-legend-pro"><span>Índice de rareza</span><div>${rarityLegend()}</div></div>
        <div class="summon-actions-pro"><button id="summon1" class="game-button dark" ${free<1||remaining<1?'disabled':''}>Invocar x1 · 1 cristal</button><button id="summon10" class="game-button gold" ${free<1||remaining<1?'disabled':''}>${state.summon?.freeMultiUsed?'Invocar x10 · 10 cristales':'Primera multi x10 GRATIS'}</button></div>
        <div id="summonResult" class="summon-result-pro"></div>
      </div>
      <div class="sanctuary-panel" data-panel="ascend"><div class="info-card"><b>Ascensión</b><p>Consume 10 personajes del mismo rango para crear una Piedra de Ascensión de ese rango. Al ascender, el personaje sube una estrella y vuelve a Nv.1.</p></div></div>
      <div class="sanctuary-panel" data-panel="sacrifice"><div class="info-card"><b>Sacrificio</b><p>El sacrificio es irreversible. Los personajes consumidos no regresan a la población del planeta.</p></div></div>
    </div>`;
  body.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{body.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));body.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===btn.dataset.tab))});
  const summon=(wanted)=>{
    const current=living(state),slots=Math.max(0,capacity(state)-current.length),rem=state.inhabitantsRemaining??state.world?.population??0;
    const count=Math.min(wanted,slots,rem); if(count<1)return;
    const freeMulti=wanted===10&&!state.summon?.freeMultiUsed;
    const cost=freeMulti?0:(wanted===10?10:1);
    if(state.resources.crystals<cost){body.querySelector('#summonResult').innerHTML='<p>No tienes suficientes cristales.</p>';return}
    state.resources.crystals-=cost;
    state.summon=state.summon||{freeMultiUsed:false,history:[]};
    if(freeMulti)state.summon.freeMultiUsed=true;
    const results=Array.from({length:count},()=>summonOne(data));
    state.characters.push(...results);state.inhabitantsRemaining=Math.max(0,rem-count);state.summon.history=results.map(r=>({id:r.id,star:r.currentStar}));
    save();
    body.querySelector('#summonResult').innerHTML=`<div class="summon-cards-pro">${results.map(r=>`<div class="summon-card-pro" style="--rarity:${rarityColors[r.currentStar]}"><div style="background-image:url('${r.wallpaper||''}')"></div><span style="color:${rarityColors[r.currentStar]}">${stars(r.currentStar)}</span></div>`).join('')}</div><p>${count} invocado(s). Habitantes restantes: ${state.inhabitantsRemaining.toLocaleString('es-ES')}</p>`;
    setTimeout(rerender,1400);
  };
  body.querySelector('#summon1')?.addEventListener('click',()=>summon(1));
  body.querySelector('#summon10')?.addEventListener('click',()=>summon(10));
}

function renderMissions(body,state){const chars=living(state);body.innerHTML=`<div class="mission-premium"><h2>Supervivencia I</h2><p>Resiste 3 minutos contra Goblins ★1. Muerte permanente. Campo rectangular con 3 carriles invisibles y ataques diagonales.</p><div class="team-slots">${[0,1,2,3,4].map(i=>`<div>${chars[i]?`<b>${escapeHtml(chars[i].name)}</b><span style="color:${rarityColors[chars[i].currentStar]}">${stars(chars[i].currentStar)}</span>`:'<b>Vacío</b><span>Añadir</span>'}</div>`).join('')}</div><button class="game-button gold wide">Preparar misión</button></div>`}
function renderStorage(body,state){body.innerHTML=`<div class="storage-tabs"><button class="active">Materiales</button><button>Equipo</button><button>Consumibles</button><button>Especiales</button></div><div class="inventory-grid"><div><b>Madera</b><span>x${state.resources.wood}</span></div><div><b>Piedra</b><span>x${state.resources.stone}</span></div><div><b>Espacios</b><span>${state.inventory.length}/50</span></div></div>`}
function renderMenu(body){body.innerHTML='<div class="info-card"><b>Versión UI</b><p>Interfaz premium integrada.</p></div>'}

export function renderBuilding({app,type,state,data,save,activeHero,onBack}){
  app.innerHTML='';const titles={dorms:['Dormitorios','Habitaciones, estadísticas y equipamiento.'],sanctuary:['Santuario de Invocación','Invocar · Ascender · Sacrificar'],missions:['Portal de Misiones','Forma un equipo y entra en la Torre.'],storage:['Almacén','Objetos y recursos.'],menu:['Menú','Opciones generales.']};const [title,sub]=titles[type]||titles.menu;
  const screen=el('section','screen building-screen');screen.innerHTML=`<div class="building-shell"><header><small>KAMI NO CHALLENGE</small><h1>${title}</h1><p>${sub}</p></header><div class="building-body"></div></div>`;const body=screen.querySelector('.building-body');const rerender=()=>renderBuilding({app,type,state,data,save,activeHero:state.characters.find(c=>c.id===state.activeCharacterId)||activeHero,onBack});
  if(type==='dorms')renderDorms(body,state,save,rerender);else if(type==='sanctuary')renderSanctuary(body,state,data,save,rerender);else if(type==='missions')renderMissions(body,state);else if(type==='storage')renderStorage(body,state);else renderMenu(body);
  const back=button('Volver al Lobby','game-button dark');back.onclick=onBack;body.append(back);app.append(screen);
}
