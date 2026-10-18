import { el, button } from './components.js';

const WORLD_NAMES = ['Velmora','Astreon','Myrhalis','Eryndor','Kaelthar','Lumyra','Neravia','Aetheris'];
const BIOMES = [
  {name:'Templado', desc:'Praderas, bosques, montañas y costas equilibradas.'},
  {name:'Continental', desc:'Grandes masas de tierra y estaciones marcadas.'},
  {name:'Archipiélago', desc:'Mares extensos, islas y civilizaciones costeras.'},
  {name:'Frío', desc:'Cordilleras nevadas, tundras y regiones glaciares.'},
  {name:'Volcánico', desc:'Zonas fértiles, cordilleras ígneas y tierras de ceniza.'}
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
    <div class="world-page-pro">
      <header class="world-head-pro">
        <div class="world-brand-pro">KAMI NO CHALLENGE</div>
        <h1>Creación del mundo</h1>
        <div class="ornament-line"><span>◇</span></div>
        <p>Un nuevo destino comienza aquí. El planeta fija población, civilizaciones y el origen de todos los personajes de esta partida.</p>
      </header>

      <div class="world-stage-pro">
        <div class="world-astral-bg"></div>
        <div class="world-orbits"><i></i><i></i><i></i></div>
        <div class="planet-pro" id="planetPro">
          <div class="p-ocean"></div><div class="p-land l1"></div><div class="p-land l2"></div><div class="p-clouds"></div><div class="p-shade"></div><div class="p-atmo"></div><div class="p-shine"></div>
        </div>
      </div>

      <div class="world-config-pro">
        <div class="world-field world-name-field">
          <small>NOMBRE DEL MUNDO</small>
          <div class="world-name-row"><input id="worldName" maxlength="24" value="${draft.name}"><button id="randomWorld" type="button">⚄</button></div>
        </div>
        <div class="world-field">
          <small>BIOMA / CLIMA PRINCIPAL</small>
          <b id="biomeName">${draft.biome.name}</b><span id="biomeDesc">${draft.biome.desc}</span>
        </div>
        <div class="world-field">
          <small>POBLACIÓN TOTAL</small>
          <b id="populationPreview">${draft.population.toLocaleString('es-ES')}</b><span>Generación aleatoria entre 6 y 10 billones</span>
        </div>
        <div class="world-field">
          <small>CIVILIZACIONES FUNDACIONALES</small>
          <b>8</b><span>Una base cultural para cada raza oficial</span>
        </div>
        <div class="world-field">
          <small>HABITANTES INVOCABLES</small>
          <b id="invocablePreview">${draft.invocablePopulation.toLocaleString('es-ES')}</b><span>Cada invocación resta 1 de este total</span>
        </div>
      </div>

      <div class="world-genesis-pro">
        <div class="world-genesis-label"><span id="worldStep">Preparado para comenzar</span><b id="worldPct">0%</b></div>
        <div class="world-progress"><div id="worldFill"></div></div>
      </div>

      <div class="world-result-pro hidden" id="worldResult"></div>

      <footer class="world-footer-pro">
        <button id="worldBack" class="world-back-pro" type="button">← <span>Volver</span></button>
        <button id="forge" class="world-confirm-pro" type="button"><span>Crear mundo</span><i>›</i></button>
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
      [9,'Encendiendo el núcleo'],[23,'Formando océanos'],[39,'Elevando continentes'],
      [55,'Definiendo biomas'],[70,'Fundando civilizaciones'],[85,'Inscribiendo destinos'],[100,'Mundo completado']
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
    result.innerHTML=`<div><small>MUNDO CREADO</small><h2>${world.name}</h2><p>${world.population.toLocaleString('es-ES')} habitantes potenciales · ${world.civilizations} civilizaciones fundacionales · Clima ${world.biome.name}</p></div>`;
    const next=button('Confirmar mundo','game-button gold wide');
    next.onclick=onComplete;
    result.append(next);
    forge.classList.add('hidden');
    back.disabled=false;
  }
}
