import { el, escapeHtml } from './components.js';

export function renderClass({ app, data, state, save, onBack, onConfirm }) {
  app.innerHTML = '';
  const race = data.races.find(r => r.id === state.selectedRace) ?? data.races[0];
  const classes = data.classes[race.id];
  if (!state.selectedClass) state.selectedClass = classes[0].name;
  const selected = classes.find(c => c.name === state.selectedClass) ?? classes[0];

  const screen = el('section', 'screen class-screen-premium');
  screen.innerHTML = `
    <div class="class-page">
      <div class="class-hero-premium" style="--class-bg:url('${race.image}')">
        <div class="class-hero-overlay"></div>
        <img src="${race.image}" alt="${race.name}" class="class-race-character" />
        <div class="class-hero-copy">
          <div class="class-brand">KAMI NO CHALLENGE</div>
          <h1>Especialización inicial</h1>
          <div class="class-selected-race">Raza seleccionada: <b>${race.name}</b></div>
          <p>Elige una clase para tu personaje. Luego la rareza se determinará mediante el gacha.</p>
        </div>
      </div>
      <div class="name-premium-row">
        <label>Nombre del personaje</label>
        <input id="heroName" maxlength="28" value="${escapeHtml(state.heroName)}" placeholder="Nombre del protagonista" />
        <button id="randomName" type="button">⚄ Aleatorio</button>
      </div>
      <div class="class-content-grid">
        <div class="class-option-list"></div>
        <aside class="class-detail-premium">
          <div class="detail-label">Descripción</div>
          <h2>${escapeHtml(selected.name)}</h2>
          <div class="detail-role">${escapeHtml(selected.role)}</div>
          <p>${escapeHtml(selected.description)}</p>
          <div class="detail-block"><small>ARMAS</small><b>${selected.weapons.map(escapeHtml).join(' · ')}</b></div>
          <div class="detail-block"><small>ORIGEN RACIAL</small><b>${escapeHtml(race.origin)}</b></div>
          <div class="detail-block"><small>DESCRIPCIÓN PARA PASÁRMELA</small><textarea id="selectionDesc" readonly></textarea></div>
          <button id="copyDesc" class="game-button dark wide" type="button">Copiar descripción</button>
        </aside>
      </div>
      <div class="class-footer-actions">
        <div class="back-stack"><button class="round-back" id="backRace">←</button><span>Volver</span></div>
        <button class="race-confirm-button" id="confirmClass"><span>Confirmar clase</span><i>›</i></button>
        <div></div>
      </div>
    </div>`;
  app.append(screen);

  const list = screen.querySelector('.class-option-list');
  classes.forEach((cls, index) => {
    const row = el('button', `class-premium-option ${cls.name === state.selectedClass ? 'selected' : ''}`);
    row.type = 'button';
    row.innerHTML = `
      <div class="class-thumb" style="--thumb:url('${race.image}')"></div>
      <div class="class-rune">${['✦','◆','✧','✥','◈'][index]}</div>
      <div class="class-option-copy"><h3>${escapeHtml(cls.name)}</h3><div><b>Armas:</b> ${cls.weapons.map(escapeHtml).join(', ')}</div><p>${escapeHtml(cls.description)}</p></div>`;
    row.onclick = () => {
      state.selectedClass = cls.name;
      save();
      renderClass({ app, data, state, save, onBack, onConfirm });
    };
    list.append(row);
  });

  const nameInput = screen.querySelector('#heroName');
  nameInput.oninput = e => { state.heroName = e.target.value; save(); updateDescription(); };
  screen.querySelector('#randomName').onclick = () => {
    const pool = { kairakh:['Kael','Varik','Nayra'], humanos:['Kai','Aren','Mira'], elfos:['Aerin','Naelis','Sylwen'], kijins:['Akane','Raizen','Shuren'], bestias:['Fenra','Rogar','Lyka'], vampiros:['Veyra','Khael','Serah'], insectoides:['Lirien','Thrya','Irixa'], huecos:['Astra','Nohr','Eidra'] }[race.id];
    state.heroName = pool[Math.floor(Math.random()*pool.length)];
    nameInput.value = state.heroName;
    save(); updateDescription();
  };
  screen.querySelector('#backRace').onclick = onBack;
  screen.querySelector('#confirmClass').onclick = () => onConfirm(selected);
  screen.querySelector('#copyDesc').onclick = () => navigator.clipboard?.writeText(screen.querySelector('#selectionDesc').value);
  updateDescription();

  function updateDescription() {
    screen.querySelector('#selectionDesc').value = `KAMI NO CHALLENGE — SELECCIÓN INICIAL\nNombre provisional: ${state.heroName || 'Sin nombre'}\nRaza: ${race.name}\nIdentidad racial: ${race.description}\nHistoria racial: ${race.history}\nOrigen: ${race.origin}\nClase exclusiva: ${selected.name}\nRol: ${selected.role}\nDescripción de clase: ${selected.description}\nArmas permitidas: ${selected.weapons.join(', ')}\nLa rareza ★1–★8, FUE, AGI, CON, DEF, INT, VOL, sexo, edad, profesión, afinidades, skills y pasivas se tirarán con el gacha al confirmar.`;
  }
}
