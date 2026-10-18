import { el, button } from './components.js';

const WORLD_NAMES = ['Velmora','Astreon','Myrhalis','Eryndor','Kaelthar','Lumyra','Neravia','Aetheris'];
const BIOMES = [
  {name:'Templado', desc:'Praderas, bosques, montañas y costas equilibradas.', icon:'🌿'},
  {name:'Continental', desc:'Grandes masas de tierra y estaciones marcadas.', icon:'⛰️'},
  {name:'Archipiélago', desc:'Mares extensos, islas y civilizaciones costeras.', icon:'🌊'},
  {name:'Frío', desc:'Cordilleras nevadas, tundras y regiones glaciares.', icon:'❄️'},
  {name:'Volcánico', desc:'Zonas fértiles, cordilleras ígneas y tierras de ceniza.', icon:'🌋'}
];

function makeWorld(nameOverride='') {
  const population = Math.floor(6_000_000_000_000 + Math.random() * 4_000_000_000_000);
  return {
    name: nameOverride.trim() || WORLD_NAMES[Math.floor(Math.random() * WORLD_NAMES.length)],
    population,
    invocablePopulation: population,
    civilizations: 8,
    biome: BIOMES[Math.floor(Math.random() * BIOMES.length)],
  };
}

export function renderWorld({ app, state, save, onBack, onComplete }) {
  app.innerHTML = '';
  const draft = state.world || makeWorld();
  const screen = el('section', 'screen world-screen');
  screen.innerHTML = `
    <div class="world-ornate-frame">
      <div class="world-corner tl"></div><div class="world-corner tr"></div><div class="world-corner bl"></div><div class="world-corner br"></div>

      <header class="world-title-block">
        <div class="world-logo-mini">KAMI NO CHALLENGE</div>
        <h1>CREACIÓN DEL MUNDO</h1>
        <div class="gold-divider"><span>✦</span></div>
        <p>Un nuevo destino comienza aquí.</p>
      </header>

      <section class="world-orbital-chamber">
        <div class="world-rune-ring ring-a"></div>
        <div class="world-rune-ring ring-b"></div>
        <div class="world-rune-ring ring-c"></div>
        <div class="world-crystal c1"></div><div class="world-crystal c2"></div><div class="world-crystal c3"></div><div class="world-crystal c4"></div>
        <div class="planet-pro" id="planetPro">
          <div class="p-ocean"></div><div class="p-land l1"></div><div class="p-land l2"></div><div class="p-clouds"></div><div class="p-shade"></div><div class="p-atmo"></div><div class="p-shine"></div>
        </div>
      </section>

      <section class="world-controls-card">
        <div class="world-control full">
          <label>NOMBRE DEL MUNDO</label>
          <div class="world-name-row"><input id="worldName" maxlength="24" value="${draft.name}"><button id="randomWorld" type="button" aria-label="Nombre aleatorio">⚄</button></div>
        </div>

        <div class="world-control biome-card">
          <label>BIOMA / CLIMA PRINCIPAL</label>
          <div class="biome-visual"><span id="biomeIcon">${draft.biome.icon}</span><strong id="biomeName">${draft.biome.name}</strong></div>
          <p id="biomeDesc">${draft.biome.desc}</p>
        </div>

        <div class="world-control number-card">
          <label>POBLACIÓN TOTAL</label>
          <strong id="populationPreview">${draft.population.toLocaleString('es-ES')}</strong>
          <p>Generación aleatoria entre 6 y 10 billones.</p>
        </div>

        <div class="world-control number-card">
          <label>CIVILIZACIONES PRESENTES</label>
          <strong>8</strong>
          <p>Las 8 razas fundacionales forman parte de este planeta.</p>
        </div>

        <div class="world-control number-card">
          <label>HABITANTES INVOCABLES</label>
          <strong id="invocablePreview">${draft.invocablePopulation.toLocaleString('es-ES')}</strong>
          <p>Tu protagonista y cada invocación restan 1.</p>
        </div>

        <div class="world-genesis-bar full">
          <div class="genesis-head"><span id="worldStep">Preparado para comenzar</span><b id="worldPct">0%</b></div>
          <div class="genesis-track"><div id="worldFill"></div></div>
        </div>
      </section>

      <div class="world-result-pro hidden" id="worldResult"></div>

      <footer class="world-actions-pro">
        <button id="worldBack" class="world-back-round" type="button">←</button>
        <button id="forge" class="world-create-button" type="button"><span>CREAR MUNDO</span><i>›</i></button>
      </footer>
    </div>`;
  app.append(screen);

  const back = screen.querySelector('#worldBack');
  const forge = screen.querySelector('#forge');
  const nameInput = screen.querySelector('#worldName');
  let preview = draft;

  back.onclick = onBack;
  screen.querySelector('#randomWorld').onclick = () => {
    preview = makeWorld();
    nameInput.value = preview.name;
    updatePreview();
  };

  function updatePreview(){
    screen.querySelector('#biomeIcon').textContent = preview.biome.icon;
    screen.querySelector('#biomeName').textContent = preview.biome.name;
    screen.querySelector('#biomeDesc').textContent = preview.biome.desc;
    screen.querySelector('#populationPreview').textContent = preview.population.toLocaleString('es-ES');
    screen.querySelector('#invocablePreview').textContent = preview.invocablePopulation.toLocaleString('es-ES');
  }

  forge.onclick = () => {
    forge.disabled = true;
    back.disabled = true;
    const world = { ...preview, name: nameInput.value.trim() || preview.name };
    state.world = world;
    state.inhabitantsRemaining = world.population;
    save();
    screen.querySelector('#planetPro').classList.add('forming');
    const steps = [
      [10,'Encendiendo el núcleo'],
      [24,'Formando océanos'],
      [40,'Elevando continentes'],
      [57,'Definiendo biomas'],
      [72,'Fundando civilizaciones'],
      [88,'Inscribiendo destinos'],
      [100,'Mundo completado']
    ];
    let i=0;
    const tick=()=>{
      const [pct,label]=steps[i++];
      screen.querySelector('#worldFill').style.width=pct+'%';
      screen.querySelector('#worldPct').textContent=pct+'%';
      screen.querySelector('#worldStep').textContent=label;
      if(i<steps.length) setTimeout(tick,520); else setTimeout(()=>showResult(world),450);
    };
    tick();
  };

  function showResult(world){
    const result=screen.querySelector('#worldResult');
    result.classList.remove('hidden');
    result.innerHTML=`
      <div class="world-created-card">
        <small>MUNDO CREADO</small>
        <h2>${world.name}</h2>
        <p>${world.population.toLocaleString('es-ES')} habitantes potenciales · 8 civilizaciones · ${world.biome.name}</p>
      </div>`;
    const next=button('Confirmar mundo','game-button gold wide');
    next.onclick=onComplete;
    result.append(next);
    forge.classList.add('hidden');
    back.disabled=false;
  }
}
