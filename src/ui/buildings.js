import { el, button, stars, escapeHtml } from './components.js';
import { createHero } from './reveal.js';
import { EQUIPMENT_SLOTS, normalizeEquipment, canEquip, equipItem, unequipSlot } from '../systems/equipment.js';
import { ascensionRequirement, levelCap } from '../systems/progression.js';
import { simulateSurvivalMission, applyMissionResult } from '../systems/mission-simulator.js';
import { rollSurvival1WeaponDrops, applyWeaponDrops } from '../systems/loot.js';
import { upgradeWeapon, weaponUpgradeCost } from '../systems/weapon-upgrade.js';

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

function characterPower(char){
  return Object.values(char.stats||{}).reduce((a,b)=>a+Number(b||0),0)*100+(char.level||1)*25+(char.currentStar||1)*250;
}

function roomSlot(char,i,selected){
  return `<button class="dorm-card ${char?'occupied':'empty'} ${selected?'selected':''}" type="button" ${char?`data-char="${char.id}"`:''}>
    <div class="dorm-card-art" style="${char?`background-image:url('${char.wallpaper||''}')`:''}"></div>
    <div class="dorm-card-shade"></div>
    ${char&&char.dead?'<span class="residence-tag dead">CAÍDO</span>':char?`<span class="residence-tag">Poder ${characterPower(char).toLocaleString('es-ES')}</span>`:''}
    <div class="dorm-card-copy">${char?`<b>${escapeHtml(char.name)}</b><span style="color:${rarityColors[char.currentStar]}">${stars(char.currentStar)}</span><small>${escapeHtml(char.raceName)} · ${escapeHtml(char.className)} · Nv.${char.level}</small><small>🛡 ${char.missionsSurvived||0} misiones sobrevividas · ⚔ ${char.totalKills||0} bajas</small>`:`<b class="plus">＋</b><span>Vacío</span>`}</div>
  </button>`;
}

function renderDorms(body,state,save,rerender,onBack){
  state.ui=state.ui||{};
  state.ui.characterFilter=state.ui.characterFilter||{rarity:'all',race:'all',className:'all',status:'alive'};
  const filter=state.ui.characterFilter;
  const all=[...(state.characters||[])];
  const races=[...new Set(all.map(c=>c.raceName).filter(Boolean))].sort();
  const classes=[...new Set(all.map(c=>c.className).filter(Boolean))].sort();
  let chars=all.filter(c=>{
    if(filter.status==='alive'&&c.dead)return false;
    if(filter.status==='dead'&&!c.dead)return false;
    if(filter.rarity!=='all'&&String(c.currentStar)!==String(filter.rarity))return false;
    if(filter.race!=='all'&&c.raceName!==filter.race)return false;
    if(filter.className!=='all'&&c.className!==filter.className)return false;
    return true;
  });
  const sort=state.ui.characterSort||'power';
  chars.sort((a,b)=>{
    if(sort==='level')return (b.level||1)-(a.level||1);
    if(sort==='rarity')return (b.currentStar||1)-(a.currentStar||1);
    if(sort==='name')return String(a.name).localeCompare(String(b.name),'es');
    return characterPower(b)-characterPower(a);
  });
  const cap=capacity(state);
  const active=all.find(c=>c.id===state.activeCharacterId)||all[0]||null;
  body.innerHTML=`
    <div class="page-scene dorm-scene"></div>
    <div class="premium-content">
      ${frameTitle('GESTOR DE ROSTER','Personajes','Dormitorios determina la capacidad; aquí gestionas realmente a todos tus personajes.')}
      <div class="dorm-capacity">
        <div><span>♟</span><b>${all.filter(c=>!c.dead).length} / ${cap}</b><small>vivos / capacidad</small></div>
        <div><span>☠</span><b>${all.filter(c=>c.dead).length}</b><small>caídos</small></div>
      </div>
      <div class="character-manager-controls">
        <select id="charStatus">
          <option value="alive" ${filter.status==='alive'?'selected':''}>Vivos</option>
          <option value="all" ${filter.status==='all'?'selected':''}>Todos</option>
          <option value="dead" ${filter.status==='dead'?'selected':''}>Caídos</option>
        </select>
        <select id="charRarity"><option value="all">Todas las ★</option>${[1,2,3,4,5,6,7,8].map(x=>`<option value="${x}" ${String(filter.rarity)===String(x)?'selected':''}>${'★'.repeat(x)}</option>`).join('')}</select>
        <select id="charRace"><option value="all">Todas las razas</option>${races.map(x=>`<option ${filter.race===x?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select>
        <select id="charClass"><option value="all">Todas las clases</option>${classes.map(x=>`<option ${filter.className===x?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select>
        <select id="charSort">
          <option value="power" ${sort==='power'?'selected':''}>Poder</option>
          <option value="level" ${sort==='level'?'selected':''}>Nivel</option>
          <option value="rarity" ${sort==='rarity'?'selected':''}>Rareza</option>
          <option value="name" ${sort==='name'?'selected':''}>Nombre</option>
        </select>
      </div>
      <div class="roster-summary"><b>${chars.length}</b><span>personaje(s) mostrados</span></div>
      <div class="dorm-grid character-roster-grid">${chars.length?chars.map((char,i)=>roomSlot(char,i,char.id===active?.id)).join(''):'<p class="empty-roster">No hay personajes que coincidan con estos filtros.</p>'}</div>
      <p class="dorm-note">Pulsa cualquier personaje para abrir directamente su ficha en <b>Equipamiento</b>.</p>
    </div>`;

  const refresh=()=>{
    state.ui.characterFilter.status=body.querySelector('#charStatus').value;
    state.ui.characterFilter.rarity=body.querySelector('#charRarity').value;
    state.ui.characterFilter.race=body.querySelector('#charRace').value;
    state.ui.characterFilter.className=body.querySelector('#charClass').value;
    state.ui.characterSort=body.querySelector('#charSort').value;
    save();rerender('characters');
  };
  body.querySelectorAll('.character-manager-controls select').forEach(x=>x.onchange=refresh);
  body.querySelectorAll('[data-char]').forEach(x=>x.onclick=()=>{
    state.activeCharacterId=x.dataset.char;
    state.ui.profileTab='equipment';
    save();
    rerender('profile');
  });
  backButton(onBack,body.querySelector('.premium-content'));
}

function itemKey(item){return item?.instanceId||item?.id||item?.linkedTo||null}

function syncInventoryEquippedBy(state){
  for(const item of state.inventory||[]) if(item&&typeof item==='object') item.equippedBy=null;
  for(const char of state.characters||[]){
    const eq=normalizeEquipment(char);
    for(const item of Object.values(eq)){
      if(!item||item.twoHandedMirror)continue;
      const key=itemKey(item);
      const stored=(state.inventory||[]).find(x=>itemKey(x)===key);
      if(stored)stored.equippedBy=char.id;
    }
  }
}

function equipSlot(slot,item){
  const value=item?.twoHandedMirror?'Ocupado por arma a dos manos':(item?.name||item||'Vacío');
  const extra=item?.armorGroup?` · ${item.armorGroup}`:'';
  const detail=item&&!item.twoHandedMirror
    ? `${item.rarity?'★'.repeat(item.rarity)+' · ':''}${item.level?'Nv.'+item.level+' · ':''}${item.enhancement!=null?'+'+item.enhancement:''}`
    : '';
  return `<button class="profile-equip" data-equip-slot="${slot.id}" type="button">
    <span>✦</span><b>${escapeHtml(value)}</b><small>${slot.label}${extra}</small>
    ${detail?`<em>${detail}</em>`:''}
  </button>`;
}

function compatibleStoredItems(state,hero,slotId){
  syncInventoryEquippedBy(state);
  return (state.inventory||[])
    .filter(item=>canEquip(item,slotId,hero))
    .filter(item=>!item.equippedBy || item.equippedBy===hero.id)
    .sort((a,b)=>(b.rarity||1)-(a.rarity||1)||(b.level||1)-(a.level||1)||(b.enhancement||0)-(a.enhancement||0));
}

function renderEquipmentPicker(body,state,hero,slotId,save,rerender){
  const slot=EQUIPMENT_SLOTS.find(s=>s.id===slotId);
  if(!slot)return;
  const equipment=normalizeEquipment(hero);
  const current=equipment[slotId];
  const choices=compatibleStoredItems(state,hero,slotId);
  let overlay=body.querySelector('.equipment-picker-overlay');
  if(overlay)overlay.remove();
  overlay=document.createElement('div');
  overlay.className='equipment-picker-overlay';
  overlay.innerHTML=`
    <div class="equipment-picker">
      <header>
        <div><small>EQUIPAMIENTO</small><h3>${escapeHtml(slot.label)}</h3></div>
        <button data-close-equip>×</button>
      </header>
      ${current?`<div class="equipped-current"><span>Equipado</span><b>${escapeHtml(current.twoHandedMirror?'Arma a dos manos':current.name||'Objeto')}</b><button data-unequip-slot>Quitar</button></div>`:''}
      <div class="equipment-picker-list">
        ${choices.length?choices.map(item=>`
          <button class="equipment-choice" data-equip-item="${itemKey(item)}">
            <div>
              <b>${escapeHtml(item.name||'Objeto')}</b>
              <span>${'★'.repeat(item.rarity||1)} · Nv.${item.level||1}${item.enhancement!=null?' · +'+item.enhancement:''}</span>
              <small>${item.damage?item.damage.min+'–'+item.damage.max+' daño · ':''}${item.hands?item.hands+' mano(s)':''}</small>
            </div>
            <strong>Equipar</strong>
          </button>`).join(''):`
          <div class="equipment-picker-empty">
            <b>No tienes objetos compatibles en el almacén.</b>
            <small>Solo aparecen piezas válidas para este hueco y, en armas, para la clase ${escapeHtml(hero.className||hero.classId||'actual')}.</small>
          </div>`}
      </div>
    </div>`;
  body.append(overlay);

  const close=()=>overlay.remove();
  overlay.querySelector('[data-close-equip]').onclick=close;
  overlay.onclick=e=>{if(e.target===overlay)close()};
  overlay.querySelector('[data-unequip-slot]')?.addEventListener('click',()=>{
    unequipSlot(hero,slotId);
    syncInventoryEquippedBy(state);
    save();rerender('profile');
  });
  overlay.querySelectorAll('[data-equip-item]').forEach(btn=>btn.onclick=()=>{
    const item=(state.inventory||[]).find(x=>itemKey(x)===btn.dataset.equipItem);
    if(!item)return;
    const result=equipItem(hero,item,slotId);
    if(!result.ok){
      const empty=overlay.querySelector('.equipment-picker-empty')||document.createElement('div');
      empty.className='equipment-picker-empty error';
      empty.textContent=result.reason||'No se puede equipar este objeto.';
      if(!empty.parentNode)overlay.querySelector('.equipment-picker-list').prepend(empty);
      return;
    }
    syncInventoryEquippedBy(state);
    item.equippedBy=hero.id;
    state.ui=state.ui||{};
    state.ui.newItemIds=(state.ui.newItemIds||[]).filter(id=>id!==itemKey(item));
    save();rerender('profile');
  });
}

function renderProfile(body,state,save,rerender,onBack){
  const chars=(state.characters||[]),hero=chars.find(c=>c.id===state.activeCharacterId)||chars.find(c=>!c.dead)||chars[0];
  if(!hero){renderDorms(body,state,save,rerender,onBack);return}
  state.ui=state.ui||{};
  const activeTab=state.ui.profileTab||'equipment';
  const color=rarityColors[hero.currentStar];
  const equipment=normalizeEquipment(hero);
  const req=ascensionRequirement(hero,state);
  const tabs=[
    ['summary','Resumen'],['equipment','Equipo'],['skills','Skills'],['passives','Pasivas'],['progression','Progresión']
  ];
  const summary=`
    <section class="profile-tab-panel">
      <h2>Atributos principales</h2>
      <div class="profile-stats">${Object.entries(hero.stats||{}).map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
      <h2>Descripción</h2>
      <p class="profile-description">${escapeHtml(hero.classDescription||'Un aventurero cuyo destino aún está por escribirse.')}</p>
      <div class="profile-summary-grid">
        <div><small>Rareza de nacimiento</small><b>${stars(hero.birthStar||hero.currentStar)}</b></div>
        <div><small>Rareza actual</small><b>${stars(hero.currentStar)}</b></div>
        <div><small>Poder</small><b>${characterPower(hero).toLocaleString('es-ES')}</b></div>
        <div><small>Estado</small><b>${hero.dead?'Caído':'Activo'}</b></div>
        <div><small>Misiones sobrevividas</small><b>${hero.missionsSurvived||0}</b></div>
        <div><small>Enemigos eliminados</small><b>${hero.totalKills||0}</b></div>
      </div>
    </section>`;
  const equipmentPanel=`
    <section class="profile-tab-panel">
      <h2>Equipamiento</h2>
      <div class="profile-equipment">${EQUIPMENT_SLOTS.map(slot=>equipSlot(slot,equipment[slot.id])).join('')}</div>
      <p class="equipment-rule">Cada pieza pertenece a un hueco concreto. Las armas a dos manos ocupan Mano izquierda y Mano derecha simultáneamente.</p>
      <button class="premium-blue-button wide" id="openStorageFromProfile">Abrir Almacén</button>
    </section>`;
  const skillsPanel=`
    <section class="profile-tab-panel">
      <h2>Skills</h2>
      <div class="profile-list">
        ${(hero.skills||[]).length?(hero.skills||[]).map(s=>`<article><b>${escapeHtml(s.name||s.Habilidad||'Habilidad')}</b><span>${escapeHtml(s.rank||s.Rango||'')}</span><p>${escapeHtml(s.description||s['Descripción mecánica']||'')}</p></article>`).join(''):'<p>No tiene habilidades aprendidas todavía.</p>'}
      </div>
    </section>`;
  const passivesPanel=`
    <section class="profile-tab-panel">
      <h2>Pasivas</h2>
      <div class="profile-list">
        ${(hero.passives||[]).length?(hero.passives||[]).map(p=>`<article><b>${escapeHtml(p.name||p.Pasiva||'Pasiva')}</b><span>${escapeHtml(p.rank||p.Rango||'')}</span><p>${escapeHtml(p.positive||p['Efecto positivo']||p.description||'')}</p></article>`).join(''):'<p>No tiene pasivas asignadas todavía.</p>'}
      </div>
    </section>`;
  const progressionPanel=`
    <section class="profile-tab-panel">
      <h2>Progresión</h2>
      <div class="upgrade-level"><b>Nv. ${hero.level}</b><span>Límite actual: Nv. ${levelCap(hero)}</span></div>
      <section class="ascension-material">
        <small>MATERIAL DE ASCENSIÓN</small>
        <strong>${req.rank>=8?'Rango máximo':req.stoneName}</strong>
        <p>${req.rank>=8?'No existe una ascensión superior.':`Tienes ${req.owned} / ${req.needed}. Para fabricar una piedra ★${req.rank} necesitas sacrificar 10 personajes ★${req.rank}.`}</p>
      </section>
      <div class="profile-actions"><button id="upgradeBtn">Mejorar</button><button id="ascendBtn" ${req.possible?'':'disabled'}>Ascender</button></div>
      <div class="profile-rename">
        <input id="renameInput" maxlength="28" value="${escapeHtml(hero.name)}" ${(hero.renameRemaining??1)<1?'disabled':''}>
        <button id="renameBtn" ${(hero.renameRemaining??1)<1?'disabled':''}>Renombrar</button>
      </div>
    </section>`;
  const panels={summary,equipment:equipmentPanel,skills:skillsPanel,passives:passivesPanel,progression:progressionPanel};

  body.innerHTML=`
    <div class="profile-scene" style="background-image:url('${hero.wallpaper||''}')"></div>
    <div class="profile-layout" style="--rarity:${color}">
      <section class="profile-art" style="background-image:url('${hero.wallpaper||''}')">
        <div class="profile-art-fade"></div>
        <div class="profile-power"><small>⚔ PODER DE COMBATE</small><b>${characterPower(hero).toLocaleString('es-ES')}</b></div>
      </section>
      <section class="profile-panel">
        <div class="profile-topline"><button id="profileBack">←</button><div>● ${state.resources.gold}</div><div>▥ ${state.resources.wood}</div><div>⬢ ${state.resources.stone}</div></div>
        <h1>${escapeHtml(hero.name)}</h1>
        <div class="profile-stars">${stars(hero.currentStar)}</div>
        <p class="profile-meta">${escapeHtml(hero.raceName)} · ${escapeHtml(hero.className)} · Nv.${hero.level}</p>
        <div class="profile-level"><b>Nv. ${hero.level}</b><span>de ${levelCap(hero)}</span><i><u style="width:${Math.min(100,hero.level/levelCap(hero)*100)}%"></u></i></div>
        <nav class="profile-tabs">${tabs.map(([id,label])=>`<button data-profile-tab="${id}" class="${activeTab===id?'active':''}">${label}</button>`).join('')}</nav>
        ${panels[activeTab]||equipmentPanel}
      </section>
    </div>`;

  body.querySelector('#profileBack').onclick=()=>rerender('characters');
  body.querySelectorAll('[data-profile-tab]').forEach(btn=>btn.onclick=()=>{
    state.ui.profileTab=btn.dataset.profileTab;
    save();rerender('profile');
  });
  body.querySelectorAll('[data-equip-slot]').forEach(btn=>btn.onclick=()=>{
    renderEquipmentPicker(body,state,hero,btn.dataset.equipSlot,save,rerender);
  });
  body.querySelector('#upgradeBtn')?.addEventListener('click',()=>rerender('upgrade'));
  body.querySelector('#openStorageFromProfile')?.addEventListener('click',()=>rerender('storage'));
  body.querySelector('#renameBtn')?.addEventListener('click',()=>{
    const v=body.querySelector('#renameInput').value.trim();
    if(!v||(hero.renameRemaining??1)<1)return;
    hero.name=v;hero.renameRemaining=0;save();rerender('profile');
  });
}

function renderUpgrade(body,state,save,rerender,onBack){
  const hero=living(state).find(c=>c.id===state.activeCharacterId)||living(state)[0];
  if(!hero){rerender('dorms');return}
  const req=ascensionRequirement(hero,state);
  body.innerHTML=`
    <div class="page-scene dorm-scene"></div>
    <div class="premium-content">
      ${frameTitle('PROGRESIÓN','Mejorar personaje','Consulta el límite actual y los materiales necesarios para ascender.')}
      <div class="upgrade-character-card">
        <div class="upgrade-character-art" style="background-image:url('${hero.wallpaper||''}')"></div>
        <div class="upgrade-character-info">
          <h2>${escapeHtml(hero.name)}</h2>
          <p>${stars(hero.currentStar)} · ${escapeHtml(hero.raceName)} · ${escapeHtml(hero.className)}</p>
          <div class="upgrade-level"><b>Nv. ${hero.level}</b><span>Límite actual: Nv. ${levelCap(hero)}</span></div>
          <section class="ascension-material">
            <small>MATERIAL DE ASCENSIÓN</small>
            <strong>${req.rank>=8?'Rango máximo':req.stoneName}</strong>
            <p>${req.rank>=8?'No existe una ascensión superior.':`Tienes ${req.owned} / ${req.needed}. Para fabricar una piedra ★${req.rank} debes sacrificar 10 personajes ★${req.rank}.`}</p>
          </section>
        </div>
      </div>
      <button class="premium-blue-button wide" id="upgradeBack">← Volver al equipamiento</button>
    </div>`;
  body.querySelector('#upgradeBack').onclick=()=>rerender('profile');
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
          <button id="summon1" class="summon-one" ${free<1||remaining<1?'disabled':''}><b>Invocar x1</b><span>● ${state.summon?.costs?.singleGold||1000}</span></button>
          <button id="summon10" class="summon-ten" ${free<1||remaining<1?'disabled':''}><small>PRIMERA MULTI x10</small><b>${state.summon?.freeMultiUsed?'Invocar x10':'GRATIS'}</b><span>${state.summon?.freeMultiUsed?'● '+(state.summon?.costs?.multiGold||10000):'● 0'}</span></button>
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
    const cost=freeMulti?0:(wanted===10?(state.summon?.costs?.multiGold||10000):(state.summon?.costs?.singleGold||1000));
    if((state.resources.gold||0)<cost){body.querySelector('#summonResult').innerHTML='<p class="summon-message">No tienes suficiente oro.</p>';return}
    state.resources.gold-=cost;if(freeMulti)state.summon.freeMultiUsed=true;
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

function renderStorage(body,state,save,rerender,onBack){
  state.ui=state.ui||{};
  const tab=state.ui.storageTab||'weapons';
  const all=state.inventory||[];
  const newIds=new Set(state.ui.newItemIds||[]);
  const weapons=all.filter(x=>x.category==='weapon');
  const armor=all.filter(x=>['armor','helmet','legs','hands','feet'].includes(x.category));
  const accessories=all.filter(x=>['neck','ring'].includes(x.category));
  const materials=[
    {name:'Oro',value:state.resources.gold,icon:'●',category:'material'},
    {name:'Madera',value:state.resources.wood,icon:'▥',category:'material'},
    {name:'Piedra',value:state.resources.stone,icon:'⬢',category:'material'}
  ];
  const tabs=[
    ['weapons','Armas',weapons.length],
    ['armor','Armaduras',armor.length],
    ['accessories','Accesorios',accessories.length],
    ['materials','Materiales',3]
  ];
  const renderEquipItem=item=>{
    const id=item.instanceId||item.id;
    const equipped=(state.characters||[]).find(ch=>Object.values(ch.equipment||{}).some(eq=>(eq?.instanceId||eq?.id)===id));
    const isNew=newIds.has(id);
    return `<article class="inventory-equip-row ${isNew?'is-new':''}">
      <div>
        <span class="inventory-rarity">${'★'.repeat(item.rarity||1)}</span>
        <b>${escapeHtml(item.name||'Objeto')}</b>
        <small>${item.level?'Nv.'+item.level+' · ':''}${item.enhancement!=null?'+'+item.enhancement+' · ':''}${item.damage?item.damage.min+'–'+item.damage.max+' daño · ':''}${item.hands?item.hands+' mano(s) · ':''}${equipped?'Equipado por '+escapeHtml(equipped.name):'Sin equipar'}</small>${item.category==='weapon'?`<small class="weapon-classes"><b>Clases:</b> ${(item.allowedClasses||[]).map(x=>escapeHtml(typeof x==='string'?x:x.name)).join(', ')||'Sin clase asignada'}</small>`:''}
      </div>
      <div class="inventory-row-actions">
        ${isNew?'<em>NUEVO</em>':''}
        ${item.category==='weapon'? `<button data-upgrade-weapon="${id}" ${(item.enhancement||0)>=15?'disabled':''}>${(item.enhancement||0)>=15?'Máximo +15':'Mejorar · '+weaponUpgradeCost(item)+' oro'}</button>`:''}
        <button data-mark-seen="${id}">Inspeccionar</button>
      </div>
    </article>`;
  };
  let panel='';
  if(tab==='materials'){
    panel=`<div class="material-cards">${materials.map(m=>`<div><span>${m.icon}</span><b>${m.value.toLocaleString('es-ES')}</b><small>${m.name}</small></div>`).join('')}</div>`;
  }else{
    const list=tab==='weapons'?weapons:tab==='armor'?armor:accessories;
    panel=list.length?list.map(renderEquipItem).join(''):`<p class="empty-equipment">No tienes objetos en esta categoría.</p>`;
  }

  body.innerHTML=`
    <div class="page-scene storage-scene"></div>
    <div class="premium-content storage-content">
      ${frameTitle('KAMI NO CHALLENGE','Almacén','Gestiona armas, armaduras, accesorios y materiales por separado.')}
      <div class="storage-tabs-premium functional-tabs">
        ${tabs.map(([id,label,count])=>`<button data-storage-tab="${id}" class="${tab===id?'active':''}"><b>${label}</b><small>${count}</small></button>`).join('')}
      </div>
      <div class="storage-toolbar">
        <span>▣ ${all.length} / 300</span>
        <span class="storage-new-count">${newIds.size?newIds.size+' nuevo(s)':'Sin novedades'}</span>
      </div>
      <section class="storage-category-panel">${panel}</section>
    </div>`;

  body.querySelectorAll('[data-storage-tab]').forEach(btn=>btn.onclick=()=>{
    state.ui.storageTab=btn.dataset.storageTab;save();rerender('storage');
  });
  body.querySelectorAll('[data-mark-seen]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.markSeen;
    state.ui.newItemIds=(state.ui.newItemIds||[]).filter(x=>x!==id);
    save();rerender('storage');
  });
  body.querySelectorAll('[data-upgrade-weapon]').forEach(btn=>btn.onclick=()=>{
    const weapon=(state.inventory||[]).find(w=>(w.instanceId||w.id)===btn.dataset.upgradeWeapon);
    if(!weapon)return;
    const result=upgradeWeapon(state,weapon);
    if(result.ok){save();rerender('storage');}
    else btn.textContent=result.reason||'No se puede mejorar';
  });
  backButton(onBack,body.querySelector('.premium-content'));
}

function renderMissions(body,state,data,save,onBack){
  const chars=living(state);
  const mission=data.missions?.survival1;
  state.missionTeams=state.missionTeams||{lastUsed:[],presets:[[],[],[]]};
  const validIds=new Set(chars.map(c=>c.id));
  let selectedIds=(state.missionTeams.lastUsed||[]).filter(id=>validIds.has(id)).slice(0,5);
  if(!selectedIds.length)selectedIds=chars.slice(0,5).map(c=>c.id);
  const getTeam=()=>selectedIds.map(id=>chars.find(c=>c.id===id)).filter(Boolean);

  body.innerHTML=`
    <div class="page-scene mission-scene"></div>
    <div class="premium-content">
      ${frameTitle('PORTAL DE MISIONES','Supervivencia I','Selecciona hasta 5 personajes. La batalla se resuelve en código mientras el narrador relata lo ocurrido.')}
      <div class="mission-card">
        <div class="mission-portal-art"><span>✦</span></div>
        <div>
          <small>TORRE · PISO 1</small>
          <h2>Supervivencia I</h2>
          <p>Duración: ${mission?.durationSeconds||180}s · Goblins ★1 · ${mission?.totalEnemies||45} enemigos en 6 oleadas.</p>
          <p><b>Victoria: ${mission?.fixedGoldReward||250} de oro fijo + loot.</b> Derrota: 0 recompensas.</p>
        </div>
      </div>

      <section class="team-builder">
        <header><b>Equipo</b><span id="teamCount"></span></header>
        <div class="team-preset-actions">
          <button data-load-team="last">Último equipo</button>
          ${[0,1,2].map(i=>`<button data-load-team="${i}">Equipo ${i+1}</button>`).join('')}
          ${[0,1,2].map(i=>`<button data-save-team="${i}">Guardar E${i+1}</button>`).join('')}
        </div>
        <div class="team-premium" id="missionTeamSlots"></div>
        <h3>Personajes disponibles</h3>
        <div class="mission-character-picker">
          ${chars.map(ch=>`<button data-mission-char="${ch.id}"><b>${escapeHtml(ch.name)}</b><span>${stars(ch.currentStar)} · Nv.${ch.level}</span><small>${escapeHtml(ch.className)}</small></button>`).join('')}
        </div>
      </section>

      <button id="startSurvival" class="premium-gold-button wide">Enviar equipo</button>
      <section class="battle-console hidden" id="battleConsole">
        <header><b>Narrador de batalla</b><span id="battleClock">00:00</span></header>
        <div class="battle-log" id="battleLog"></div>
      </section>
      <section class="mission-results hidden" id="missionResults"></section>
    </div>`;
  backButton(onBack,body.querySelector('.premium-content'));

  const renderTeam=()=>{
    const team=getTeam();
    body.querySelector('#teamCount').textContent=team.length+'/5';
    body.querySelector('#missionTeamSlots').innerHTML=[0,1,2,3,4].map(i=>`<div class="${team[i]?'filled':''}">${team[i]?`<figure style="background-image:url('${team[i].wallpaper}')"></figure><b>${escapeHtml(team[i].name)}</b><span>${stars(team[i].currentStar)}</span>`:'<b>＋</b><small>Vacío</small>'}</div>`).join('');
    body.querySelectorAll('[data-mission-char]').forEach(btn=>btn.classList.toggle('selected',selectedIds.includes(btn.dataset.missionChar)));
    body.querySelector('#startSurvival').disabled=team.length===0;
  };
  renderTeam();

  body.querySelectorAll('[data-mission-char]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.missionChar;
    if(selectedIds.includes(id))selectedIds=selectedIds.filter(x=>x!==id);
    else if(selectedIds.length<5)selectedIds.push(id);
    renderTeam();
  });
  body.querySelectorAll('[data-load-team]').forEach(btn=>btn.onclick=()=>{
    const key=btn.dataset.loadTeam;
    const source=key==='last'?state.missionTeams.lastUsed:(state.missionTeams.presets?.[Number(key)]||[]);
    selectedIds=source.filter(id=>validIds.has(id)).slice(0,5);
    renderTeam();
  });
  body.querySelectorAll('[data-save-team]').forEach(btn=>btn.onclick=()=>{
    const i=Number(btn.dataset.saveTeam);
    state.missionTeams.presets=state.missionTeams.presets||[[],[],[]];
    state.missionTeams.presets[i]=[...selectedIds];
    save();
    btn.textContent='Guardado ✓';
  });

  const startBtn=body.querySelector('#startSurvival');
  if(!startBtn||!mission)return;
  startBtn.onclick=async()=>{
    const team=getTeam();
    if(!team.length)return;
    state.missionTeams.lastUsed=[...selectedIds];
    save();
    startBtn.disabled=true;
    const consoleEl=body.querySelector('#battleConsole');
    const log=body.querySelector('#battleLog');
    const clock=body.querySelector('#battleClock');
    const results=body.querySelector('#missionResults');
    consoleEl.classList.remove('hidden');
    log.innerHTML='<p class="battle-line system">[00:00] El equipo cruza el portal...</p>';
    const result=simulateSurvivalMission(team,mission);
    try{
      result.weaponDrops=result.completed?await rollSurvival1WeaponDrops(result.enemiesDefeated):[];
    }catch(err){
      console.warn('Loot fallback error',err);
      result.weaponDrops=[];
    }
    let i=0;
    const showNext=()=>{
      if(i>=result.events.length){
        applyMissionResult(state,result);
        applyWeaponDrops(state,result.weaponDrops||[],result.completed);
        save();
        results.classList.remove('hidden');
        results.innerHTML=`
          <div class="mission-result-head ${result.completed?'success':'failure'}">
            <small>RESULTADO</small>
            <h2>${result.completed?'MISIÓN COMPLETADA':'MISIÓN FALLIDA'}</h2>
            <p>${result.completed?'El equipo resistió hasta la apertura del portal.':'El grupo cayó antes de completar la supervivencia.'}</p>
          </div>
          <div class="mission-rewards">
            <h3>Recompensas</h3>
            ${result.completed?`
              <div><b>Oro</b><span>+${result.rewards.gold}</span></div>
              <div><b>Madera</b><span>+${result.rewards.wood}</span></div>
              <div><b>Piedra</b><span>+${result.rewards.stone}</span></div>
              ${result.rewards.bonusGold?'<small>Incluye +'+result.rewards.bonusGold+' de oro procedente del loot.</small>':''}
              <div class="weapon-drop-summary"><b>Armas encontradas</b><span>${(result.weaponDrops||[]).length}</span></div>
              ${(result.weaponDrops||[]).map(w=>'<div class="weapon-drop-line"><b>'+escapeHtml(w.name)+'</b><span>'+'★'.repeat(w.rarity)+' · Nv.'+(w.level||1)+' · '+w.damage.min+'–'+w.damage.max+' daño · +'+(w.enhancement||0)+'</span><small>Clases: '+((w.allowedClasses||[]).map(x=>escapeHtml(typeof x==='string'?x:x.name)).join(', ')||'Sin clase asignada')+'</small></div>').join('')}
            `:'<p class="no-rewards">Sin recompensas por derrota.</p>'}
          </div>
          <div class="damage-report">
            <h3>Experiencia</h3>
            ${(result.xpMetrics||[]).map(x=>`<div class="damage-row"><div><b>${escapeHtml(x.name)}</b><small>${x.kills} bajas</small></div><span>+${x.xp} XP</span></div>`).join('')}
            <h3>Métrica de daño</h3>
            ${result.damageMetrics.sort((a,b)=>b.damage-a.damage).map(m=>`
              <div class="damage-row">
                <div><b>${escapeHtml(m.name)}</b><small>${m.survived?'Superviviente':'Caído'} · ${m.kills} bajas</small></div>
                <span>${m.damage} daño</span>
                <i><u style="width:${m.damagePct}%"></u></i>
                <em>${m.damagePct}%</em>
              </div>`).join('')}
          </div>
          <div class="mission-summary"><b>Enemigos derrotados:</b> ${result.enemiesDefeated}/${result.totalEnemies}</div>`;
        return;
      }
      const e=result.events[i++];
      clock.textContent=String(Math.floor(e.t/60)).padStart(2,'0')+':'+String(e.t%60).padStart(2,'0');
      const p=document.createElement('p');p.className='battle-line '+e.type;p.textContent='['+clock.textContent+'] '+e.text;log.append(p);log.scrollTop=log.scrollHeight;
      setTimeout(showNext,500);
    };
    showNext();
  };
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
  if(type==='dorms'||type==='characters')renderDorms(body,state,save,rerender,onBack);
  else if(type==='profile')renderProfile(body,state,save,rerender,onBack);
  else if(type==='upgrade')renderUpgrade(body,state,save,rerender,onBack);
  else if(type==='sanctuary')renderSanctuary(body,state,data,save,rerender,onBack);
  else if(type==='storage')renderStorage(body,state,save,rerender,onBack);
  else if(type==='missions')renderMissions(body,state,data,save,onBack);
  else renderMenu(body,onBack);
}
