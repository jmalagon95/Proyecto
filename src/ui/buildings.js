import { el, button, stars, escapeHtml } from './components.js';
import { createHero } from './reveal.js';

const rarityColors={1:'#b9c0ca',2:'#69d173',3:'#62aaff',4:'#a875ff',5:'#f2ca65',6:'#ff8056',7:'#ff57cf',8:'#ffffff'};
const namePools={kairakh:['Kael','Varik','Nayra'],elfos:['Aerin','Naelis','Sylwen'],kijins:['Akane','Raizen','Shuren'],vampiros:['Veyra','Khael','Serah'],insectoides:['Lirien','Thrya','Irixa'],reptro:['Rhek','Sarka','Thess']};

function living(state){return (state.characters||[]).filter(c=>!c.dead)}
function capacity(state){return 11+Math.max(0,(state.lobbyLevel||1)-1)*2}
function combinedClasses(data,raceId){return [...(data.classes.generic||[]),...(data.classes[raceId]||[])]}
function random(arr){return arr[Math.floor(Math.random()*arr.length)]}
function summonOne(data){
  const race=random(data.races),cls=random(combinedClasses(data,race.id));
  const hero=createHero(race,cls,random(namePools[race.id]||['Aspirante']));
  hero.wallpaper=race.image; hero.renameRemaining=1; return hero;
}

function frameTitle(kicker,title,sub=''){
  return `<header class="premium-page-title"><small>${kicker}</small><h1>${title}</h1><div><i></i><b>✦</b><i></i></div>${sub?`<p>${sub}</p>`:''}</header>`;
}
function backButton(onBack,body){const b=button('← Volver al Lobby','premium-back-button');b.onclick=onBack;body.append(b)}
function rarityLegend(){return Object.entries(rarityColors).map(([s,c])=>`<div class="rarity-chip" style="--rarity:${c}"><i></i><b>${'★'.repeat(+s)}</b></div>`).join('')}

function roomSlot(char,i,selected){
  return `<button class="dorm-card ${char?'occupied':'empty'} ${selected?'selected':''}" type="button" ${char?`data-char="${char.id}"`:''}>
    <div class="dorm-card-art" style="${char?`background-image:url('${char.wallpaper||''}')`:''}"></div>
    <div class="dorm-card-shade"></div>
    ${char?`<span class="residence-tag">${i===0?'✦ En residencia':'Compañero'}</span>`:''}
    <div class="dorm-card-copy">${char?`<b>${escapeHtml(char.name)}</b><span style="color:${rarityColors[char.currentStar]}">${stars(char.currentStar)}</span><small>${escapeHtml(char.raceName)} · ${escapeHtml(char.className)}</small>`:`<b class="plus">＋</b><span>Vacío</span>`}</div>
  </button>`;
}

function renderDorms(body,state,save,rerender,onBack){
  const chars=living(state),cap=capacity(state),active=chars.find(c=>c.id===state.activeCharacterId)||chars[0]||null;
  body.innerHTML=`
    <div class="page-scene dorm-scene"></div>
    <div class="premium-content">
      ${frameTitle('KAMI NO CHALLENGE','Dormitorios','Aquí residen los aliados que te acompañan en tu travesía.')}
      <div class="dorm-capacity">
        <div><span>♟</span><b>${chars.length} / ${cap}</b><small>ocupados</small></div>
        <div><span>▤</span><b>${Math.max(0,cap-chars.length)}</b><small>espacios libres</small></div>
      </div>
      <div class="dorm-grid">${Array.from({length:cap},(_,i)=>roomSlot(chars[i],i,chars[i]?.id===active?.id)).join('')}</div>
      <p class="dorm-note">ⓘ El nombre de un personaje invocado <b>puede cambiarse una vez.</b></p>
      <div class="dorm-actions">
        <button id="viewCharacter" class="premium-gold-button" ${active?'':'disabled'}>♙ <span>Ver personaje</span> ›</button>
        <button class="premium-blue-button">↕ <span>Ordenar</span></button>
        <button class="premium-blue-button">▤ <span>Gestionar habitaciones</span></button>
      </div>
    </div>`;
  body.querySelectorAll('[data-char]').forEach(x=>x.onclick=()=>{state.activeCharacterId=x.dataset.char;save();rerender('dorms')});
  body.querySelector('#viewCharacter')?.addEventListener('click',()=>rerender('profile'));
  backButton(onBack,body.querySelector('.premium-content'));
}

function equipSlot(label,value='Vacío'){return `<div class="profile-equip"><span>✦</span><b>${escapeHtml(value)}</b><small>${label}</small></div>`}

function renderProfile(body,state,save,rerender,onBack){
  const chars=living(state),hero=chars.find(c=>c.id===state.activeCharacterId)||chars[0];
  if(!hero){renderDorms(body,state,save,rerender,onBack);return}
  const color=rarityColors[hero.currentStar];
  body.innerHTML=`
    <div class="profile-scene" style="background-image:url('${hero.wallpaper||''}')"></div>
    <div class="profile-layout" style="--rarity:${color}">
      <section class="profile-art" style="background-image:url('${hero.wallpaper||''}')">
        <div class="profile-art-fade"></div>
        <div class="profile-power"><small>⚔ PODER DE COMBATE</small><b>${Object.values(hero.stats||{}).reduce((a,b)=>a+b,0)*100}</b></div>
      </section>
      <section class="profile-panel">
        <div class="profile-topline"><button id="profileBack">←</button><div>◆ ${state.resources.crystals}</div><div>● ${state.resources.gold}</div></div>
        <h1>${escapeHtml(hero.name)}</h1>
        <div class="profile-stars">${stars(hero.currentStar)}</div>
        <p class="profile-meta">${escapeHtml(hero.raceName)} · ${escapeHtml(hero.className)} · DPS / Rol</p>
        <div class="profile-level"><b>Nv. ${hero.level}</b><span>de ${hero.currentStar*10}</span><i><u style="width:${Math.min(100,hero.level/(hero.currentStar*10)*100)}%"></u></i></div>
        <h2>Atributos principales</h2>
        <div class="profile-stats">${Object.entries(hero.stats).map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
        <h2>Equipamiento</h2>
        <div class="profile-equipment">
          ${equipSlot('Arma',hero.weapon)}${equipSlot('Cabeza')}${equipSlot('Pecho')}${equipSlot('Brazos')}${equipSlot('Piernas')}${equipSlot('Botas')}${equipSlot('Accesorio I')}${equipSlot('Accesorio II')}
        </div>
        <h2>Descripción</h2>
        <p class="profile-description">${escapeHtml(hero.classDescription||'Un aventurero cuyo destino aún está por escribirse.')}</p>
        <div class="profile-rename">
          <input id="renameInput" maxlength="28" value="${escapeHtml(hero.name)}" ${(hero.renameRemaining??1)<1?'disabled':''}>
          <button id="renameBtn" ${(hero.renameRemaining??1)<1?'disabled':''}>Renombrar</button>
        </div>
        <div class="profile-actions"><button>Mejorar</button><button>Ascender</button></div>
      </section>
    </div>`;
  body.querySelector('#profileBack').onclick=()=>rerender('dorms');
  body.querySelector('#renameBtn')?.addEventListener('click',()=>{
    const v=body.querySelector('#renameInput').value.trim();
    if(!v||(hero.renameRemaining??1)<1)return;
    hero.name=v;hero.renameRemaining=0;save();rerender('profile');
  });
}

function renderSanctuary(body,state,data,save,rerender,onBack){
  const chars=living(state),cap=capacity(state),free=Math.max(0,cap-chars.length),remaining=state.inhabitantsRemaining??state.world?.population??0;
  body.innerHTML=`
    <div class="page-scene sanctuary-scene"></div>
    <div class="premium-content sanctuary-content">
      <div class="sanctuary-brand">KAMI NO CHALLENGE</div>
      <div class="sanctuary-tabs"><button class="active" data-tab="summon">◉<b>Invocar</b></button><button data-tab="ascend">⇈<b>Ascender</b></button><button data-tab="sacrifice">♨<b>Sacrificar</b></button></div>
      <section class="sanctuary-panel active" data-panel="summon">
        <div class="sanctuary-chamber"><div class="celestial-ring r1"></div><div class="celestial-ring r2"></div><div class="celestial-core">✦</div></div>
        <div class="sanctuary-info">
          <div><span>♟</span><small>Espacios libres</small><b>${free} / ${cap}</b></div>
          <div><span>◉</span><small>Habitantes restantes</small><b>${remaining.toLocaleString('es-ES')}</b></div>
        </div>
        <div class="rarity-row">${rarityLegend()}</div>
        <div class="sanctuary-actions">
          <button id="summon1" class="summon-one" ${free<1||remaining<1?'disabled':''}><b>Invocar x1</b><span>◆ 1</span></button>
          <button id="summon10" class="summon-ten" ${free<1||remaining<1?'disabled':''}><small>PRIMERA MULTI x10</small><b>${state.summon?.freeMultiUsed?'Invocar x10':'GRATIS'}</b><span>${state.summon?.freeMultiUsed?'◆ 10':'◆ 0'}</span></button>
        </div>
        <div id="summonResult" class="summon-results"></div>
      </section>
      <section class="sanctuary-panel" data-panel="ascend">
        ${frameTitle('ASCENSIÓN','Eleva su destino','Consume 10 personajes del mismo rango para crear una Piedra de Ascensión. El personaje sube una estrella y regresa a Nv.1.')}
        <div class="ritual-placeholder">⇈</div>
      </section>
      <section class="sanctuary-panel" data-panel="sacrifice">
        ${frameTitle('SACRIFICIO','Nada regresa','El sacrificio es irreversible y nunca devuelve habitantes a la población del mundo.')}
        <div class="ritual-placeholder danger">♨</div>
      </section>
    </div>`;
  body.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{
    body.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));
    body.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===btn.dataset.tab));
  });
  const summon=wanted=>{
    const slots=Math.max(0,capacity(state)-living(state).length),rem=state.inhabitantsRemaining??0;
    const count=Math.min(wanted,slots,rem);if(count<1)return;
    state.summon=state.summon||{freeMultiUsed:false,history:[]};
    const freeMulti=wanted===10&&!state.summon.freeMultiUsed;
    const cost=freeMulti?0:(wanted===10?10:1);
    if((state.resources.crystals||0)<cost){body.querySelector('#summonResult').innerHTML='<p class="summon-message">No tienes suficientes cristales.</p>';return}
    state.resources.crystals-=cost;if(freeMulti)state.summon.freeMultiUsed=true;
    const results=Array.from({length:count},()=>summonOne(data));
    state.characters.push(...results);state.inhabitantsRemaining=Math.max(0,rem-count);
    state.summon.history=results.map(x=>({id:x.id,star:x.currentStar}));save();
    body.querySelector('#summonResult').innerHTML=`<div class="summon-result-grid">${results.map(x=>`<div style="--rarity:${rarityColors[x.currentStar]}"><figure style="background-image:url('${x.wallpaper}')"></figure><b>${stars(x.currentStar)}</b><small>${escapeHtml(x.name)}</small></div>`).join('')}</div>`;
    setTimeout(()=>rerender('sanctuary'),1800);
  };
  body.querySelector('#summon1')?.addEventListener('click',()=>summon(1));
  body.querySelector('#summon10')?.addEventListener('click',()=>summon(10));
  backButton(onBack,body.querySelector('.premium-content'));
}

function renderStorage(body,state,onBack){
  const items=[
    ['Cristales',state.resources.crystals,'◆','rare-blue'],
    ['Oro',state.resources.gold,'●','rare-gold'],
    ['Esencia',state.resources.essence,'✦','rare-purple'],
    ['Madera',state.resources.wood,'▥','rare-green'],
    ['Piedra',state.resources.stone,'⬢','rare-silver'],
    ['Inventario',state.inventory.length,'▣','rare-blue']
  ];
  body.innerHTML=`
    <div class="page-scene storage-scene"></div>
    <div class="premium-content storage-content">
      ${frameTitle('KAMI NO CHALLENGE','Almacén','Objetos y recursos de tu aventura')}
      <div class="storage-tabs-premium"><button class="active">◇<b>Materiales</b></button><button>⚔<b>Equipo</b></button><button>◉<b>Consumibles</b></button><button>✦<b>Especiales</b></button></div>
      <div class="storage-toolbar"><button>☷ Ordenar: Rareza</button><button>▽ Todos</button><span>▣ ${state.inventory.length} / 300</span></div>
      <div class="storage-layout">
        <div class="storage-grid-premium">${items.map(([n,v,icon,c])=>`<button class="storage-item ${c}"><span>${icon}</span><b>${v}</b><small>${n}</small><i>★★★</i></button>`).join('')}</div>
        <aside class="storage-detail"><div class="storage-big-icon">◆</div><h2>Cristales</h2><div class="storage-rarity">★★★★★</div><p>Recurso precioso utilizado por los sistemas de invocación y progresión. Los objetos reales obtenidos durante la aventura aparecerán aquí.</p><h3>Usos principales</h3><div>✦ Invocación</div><div>⚒ Mejora de equipo</div><div>⚖ Intercambio</div></aside>
      </div>
    </div>`;
  backButton(onBack,body.querySelector('.premium-content'));
}

function renderMissions(body,state,onBack){
  const chars=living(state);
  body.innerHTML=`
    <div class="page-scene mission-scene"></div>
    <div class="premium-content">
      ${frameTitle('PORTAL DE MISIONES','Supervivencia I','Resiste 180 segundos. La muerte permanente está activa.')}
      <div class="mission-card">
        <div class="mission-portal-art"><span>✦</span></div>
        <div><small>TORRE · PISO 1</small><h2>Supervivencia I</h2><p>Goblins ★1 · 3 carriles invisibles · ataques diagonales · sin jefe.</p></div>
      </div>
      <div class="team-premium">${[0,1,2,3,4].map(i=>`<div class="${chars[i]?'filled':''}">${chars[i]?`<figure style="background-image:url('${chars[i].wallpaper}')"></figure><b>${escapeHtml(chars[i].name)}</b><span>${stars(chars[i].currentStar)}</span>`:'<b>＋</b><small>Vacío</small>'}</div>`).join('')}</div>
      <button class="premium-gold-button wide">Preparar misión</button>
    </div>`;
  backButton(onBack,body.querySelector('.premium-content'));
}

function renderMenu(body,onBack){
  body.innerHTML=`<div class="page-scene menu-scene"></div><div class="premium-content">${frameTitle('KAMI NO CHALLENGE','Menú','Opciones del juego')}<div class="menu-grid-premium"><button>⚙ Ajustes</button><button>♢ Cuenta</button><button>♬ Audio</button><button>⌁ Ayuda</button></div></div>`;
  backButton(onBack,body.querySelector('.premium-content'));
}

export function renderBuilding({app,type,state,data,save,activeHero,onBack}){
  app.innerHTML='';
  const screen=el('section','screen premium-building-screen');
  screen.innerHTML='<div class="premium-building-body"></div>';
  const body=screen.querySelector('.premium-building-body');
  app.append(screen);
  const rerender=next=>renderBuilding({app,type:next||type,state,data,save,activeHero:state.characters.find(c=>c.id===state.activeCharacterId)||activeHero,onBack});
  if(type==='dorms')renderDorms(body,state,save,rerender,onBack);
  else if(type==='profile')renderProfile(body,state,save,rerender,onBack);
  else if(type==='sanctuary')renderSanctuary(body,state,data,save,rerender,onBack);
  else if(type==='storage')renderStorage(body,state,onBack);
  else if(type==='missions')renderMissions(body,state,onBack);
  else renderMenu(body,onBack);
}
