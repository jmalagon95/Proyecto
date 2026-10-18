import { el, escapeHtml } from './components.js';

function poolsFor(data, raceId) {
  return {
    generic: (data.classes.generic || []).map(c => ({ ...c, source:'Genérica' })),
    racial: (data.classes[raceId] || []).map(c => ({ ...c, source:'Racial' }))
  };
}

export function renderClass({ app, data, state, save, onBack, onConfirm }) {
  app.innerHTML = '';
  const race = data.races.find(r => r.id === state.selectedRace) ?? data.races[0];
  const pools = poolsFor(data, race.id);
  const all = [...pools.generic, ...pools.racial];
  if (!state.selectedClass || !all.some(c => c.name === state.selectedClass)) state.selectedClass = pools.generic[0]?.name || pools.racial[0]?.name;
  let activeTab = all.find(c => c.name === state.selectedClass)?.source === 'Racial' ? 'racial' : 'generic';

  const screen = el('section','screen class-screen-premium');
  screen.innerHTML = `
    <div class="class-page-pro">
      <header class="class-head-pro">
        <div class="class-brand-pro">KAMI NO CHALLENGE</div>
        <h1>Selección de clase</h1>
        <div class="ornament-line"><span>◇</span></div>
        <p>Tu raza define tu origen. La clase define el camino que recorrerás.</p>
      </header>

      <div class="class-main-pro">
        <aside class="class-race-panel">
          <div class="class-race-art" style="background-image:url('${race.image}')"></div>
          <div class="class-race-copy"><h2>${escapeHtml(race.name)}</h2><span>${escapeHtml(race.tag)}</span><p>${escapeHtml(race.description)}</p></div>
          <button type="button" id="backRaceInline" class="class-change-race">↻ Cambiar raza</button>
        </aside>

        <section class="class-browser-pro">
          <div class="class-tabs-pro">
            <button type="button" data-class-tab="generic">Clases genéricas<small>Disponibles para todas las razas</small></button>
            <button type="button" data-class-tab="racial">Clases raciales<small>Exclusivas de ${escapeHtml(race.name)}</small></button>
          </div>
          <div class="class-card-grid-pro" id="classCardGrid"></div>
          <div class="class-detail-pro" id="classDetail"></div>
          <div class="class-name-row-pro">
            <label>Nombre del protagonista</label>
            <div><input id="heroName" maxlength="28" value="${escapeHtml(state.heroName)}" placeholder="Nombre del protagonista"><button id="randomName" type="button">⚄</button></div>
          </div>
          <div class="class-info-note">La rareza ★1–★8, estadísticas, afinidades, sexo, edad, profesión, skills y pasivas se resolverán después mediante el gacha inicial.</div>
          <div class="class-copydesc-pro"><small>DESCRIPCIÓN PARA PASÁRMELA</small><textarea id="selectionDesc" readonly></textarea><button type="button" id="copyDesc" class="game-button dark">Copiar descripción</button></div>
        </section>
      </div>

      <footer class="class-footer-pro">
        <button id="classBack" type="button" class="world-back-pro">← <span>Volver</span></button>
        <button id="confirmClass" type="button" class="world-confirm-pro"><span>Confirmar clase</span><i>›</i></button>
      </footer>
    </div>`;
  app.append(screen);

  const grid = screen.querySelector('#classCardGrid');
  const detail = screen.querySelector('#classDetail');
  const desc = screen.querySelector('#selectionDesc');
  const nameInput = screen.querySelector('#heroName');

  const current = () => all.find(c => c.name === state.selectedClass) || all[0];

  function renderTab(){
    screen.querySelectorAll('[data-class-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.classTab === activeTab));
    const list = pools[activeTab];
    if (!list.some(c => c.name === state.selectedClass)) state.selectedClass = list[0]?.name || state.selectedClass;
    grid.innerHTML = list.map((cls,i)=>`<button type="button" class="class-card-pro ${cls.name===state.selectedClass?'selected':''}" data-class-name="${escapeHtml(cls.name)}"><div class="class-glyph">${['✦','◆','✧','✥','◈','✣','✠','◉'][i%8]}</div><h3>${escapeHtml(cls.name)}</h3><span>${escapeHtml(cls.role)}</span></button>`).join('');
    grid.querySelectorAll('[data-class-name]').forEach(btn=>btn.onclick=()=>{state.selectedClass=btn.dataset.className;save();renderTab();});
    renderDetail();
  }

  function renderDetail(){
    const cls=current();
    detail.innerHTML=`<div><small>${cls.source==='Racial'?'CLASE RACIAL':'CLASE GENÉRICA'}</small><h2>${escapeHtml(cls.name)}</h2><span class="detail-role">${escapeHtml(cls.role)}</span><p>${escapeHtml(cls.description)}</p></div><div class="detail-weapons"><small>ARMAS COMPATIBLES</small><b>${cls.weapons.map(escapeHtml).join(' · ')}</b></div>`;
    updateDescription();
  }

  function updateDescription(){
    const cls=current();
    desc.value=`KAMI NO CHALLENGE — SELECCIÓN INICIAL\nNombre provisional: ${state.heroName || 'Sin nombre'}\nRaza: ${race.name}\nIdentidad racial: ${race.description}\nHistoria racial: ${race.history}\nOrigen: ${race.origin}\nClase elegida: ${cls.name}\nTipo de clase: ${cls.source}\nRol: ${cls.role}\nDescripción de clase: ${cls.description}\nArmas permitidas: ${cls.weapons.join(', ')}\nLa rareza ★1–★8, FUE, AGI, CON, DEF, INT, VOL, sexo, edad, profesión, afinidades, skills y pasivas se tirarán con el gacha al confirmar.`;
  }

  screen.querySelectorAll('[data-class-tab]').forEach(btn=>btn.onclick=()=>{activeTab=btn.dataset.classTab;renderTab();});
  nameInput.oninput=e=>{state.heroName=e.target.value;save();updateDescription();};
  screen.querySelector('#randomName').onclick=()=>{const pool={kairakh:['Kael','Varik','Nayra'],humanos:['Kai','Aren','Mira'],elfos:['Aerin','Naelis','Sylwen'],kijins:['Akane','Raizen','Shuren'],bestias:['Fenra','Rogar','Lyka'],vampiros:['Veyra','Khael','Serah'],insectoides:['Lirien','Thrya','Irixa'],huecos:['Astra','Nohr','Eidra']}[race.id];state.heroName=pool[Math.floor(Math.random()*pool.length)];nameInput.value=state.heroName;save();updateDescription();};
  screen.querySelector('#copyDesc').onclick=()=>navigator.clipboard?.writeText(desc.value);
  screen.querySelector('#classBack').onclick=onBack;
  screen.querySelector('#backRaceInline').onclick=onBack;
  screen.querySelector('#confirmClass').onclick=()=>onConfirm(current());
  renderTab();
}
