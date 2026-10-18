import { el, button } from './components.js';

const WORLD_NAMES=['Velmora','Astreon','Myrhalis','Eryndor','Kaelthar','Lumyra','Neravia','Aetheris','Solvaris','Nymoria','Theryn','Ilyr'];
const CLIMATES=[
  {name:'Templado',icon:'✤',desc:'Grandes praderas, bosques, cordilleras y costas fértiles.'},
  {name:'Continental',icon:'△',desc:'Continentes extensos, estaciones marcadas y enormes cadenas montañosas.'},
  {name:'Archipiélago',icon:'≋',desc:'Mares dominantes, islas gigantes y rutas oceánicas entre civilizaciones.'},
  {name:'Árido',icon:'☀',desc:'Mesetas, desiertos de roca, cañones y oasis escasos.'},
  {name:'Frío',icon:'✧',desc:'Tundras, bosques helados, glaciares y cumbres nevadas.'},
  {name:'Volcánico',icon:'♨',desc:'Cordilleras ígneas, tierras de ceniza y regiones minerales fértiles.'}
];
const SHAPES=['Continentes gemelos','Supercontinente fracturado','Cuatro grandes masas','Anillo continental','Mares interiores'];

function randomOf(arr){return arr[Math.floor(Math.random()*arr.length)]}
function makeWorld(){
  const population=Math.floor(6_000_000_000+Math.random()*4_000_000_001);
  return{
    name:randomOf(WORLD_NAMES),
    population,
    invocablePopulation:population,
    civilizations:6,
    climate:randomOf(CLIMATES),
    geography:randomOf(SHAPES),
    seed:Math.random().toString(36).slice(2,10).toUpperCase()
  };
}

export function renderWorld({app,state,save,onBack,onComplete}){
  app.innerHTML='';
  let preview=state.world||makeWorld();
  const screen=el('section','screen world-screen');
  screen.innerHTML=`
  <div class="world-shell">
    <div class="world-stars"></div>
    <header class="world-header">
      <small>KAMI NO CHALLENGE</small>
      <h1>Creación del mundo</h1>
      <div class="world-divider"><i></i><b>✦</b><i></i></div>
      <p>Tu historia existirá en un único mundo. Su población será la reserva real de vidas que podrán llegar a tu expedición.</p>
    </header>

    <div class="world-celestial-stage">
      <div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="orbit orbit-c"></div>
      <div class="world-gem g1"></div><div class="world-gem g2"></div><div class="world-gem g3"></div><div class="world-gem g4"></div>
      <div class="world-planet" id="worldPlanet">
        <div class="planet-ocean"></div><div class="planet-land land-a"></div><div class="planet-land land-b"></div>
        <div class="planet-clouds"></div><div class="planet-night"></div><div class="planet-glow"></div>
      </div>
      <div class="world-nameplate"><small>MUNDO ASIGNADO</small><strong id="worldName">${preview.name}</strong><span>Semilla <b id="worldSeed">${preview.seed}</b></span></div>
    </div>

    <section class="world-dossier">
      <article class="world-stat population"><small>POBLACIÓN TOTAL</small><strong id="worldPopulation">${preview.population.toLocaleString('es-ES')}</strong><span>habitantes</span><p>Entre 6.000 y 10.000 millones. Cada personaje que entre en tu expedición reduce este total.</p></article>
      <article class="world-stat"><small>CLIMA DOMINANTE</small><div class="world-stat-icon" id="climateIcon">${preview.climate.icon}</div><strong id="climateName">${preview.climate.name}</strong><p id="climateDesc">${preview.climate.desc}</p></article>
      <article class="world-stat"><small>GEOGRAFÍA</small><strong id="worldGeography">${preview.geography}</strong><p>El mapa completo se descubrirá conforme avances.</p></article>
      <article class="world-stat"><small>CIVILIZACIONES FUNDACIONALES</small><strong>6</strong><p>Kairakh · Elfos · Kijins · Vampiros · Insectoides · Reptro</p></article>
    </section>

    <div class="world-generation">
      <div class="generation-copy"><span id="worldStep">Destino preparado</span><b id="worldPct">0%</b></div>
      <div class="generation-track"><i id="worldFill"></i></div>
    </div>

    <div class="world-result hidden" id="worldResult"></div>

    <footer class="world-footer">
      <button class="world-back" id="worldBack" type="button">←</button>
      <button class="world-reroll" id="worldReroll" type="button">↻ <span>Asignar otro mundo</span></button>
      <button class="world-create" id="worldCreate" type="button"><span>CREAR MUNDO</span><i>›</i></button>
    </footer>
  </div>`;
  app.append(screen);

  const $=s=>screen.querySelector(s);
  const paint=()=>{
    $('#worldName').textContent=preview.name;
    $('#worldSeed').textContent=preview.seed;
    $('#worldPopulation').textContent=preview.population.toLocaleString('es-ES');
    $('#climateIcon').textContent=preview.climate.icon;
    $('#climateName').textContent=preview.climate.name;
    $('#climateDesc').textContent=preview.climate.desc;
    $('#worldGeography').textContent=preview.geography;
  };

  $('#worldBack').onclick=onBack;
  $('#worldReroll').onclick=()=>{preview=makeWorld();paint();$('#worldPlanet').classList.remove('forming');void $('#worldPlanet').offsetWidth;$('#worldPlanet').classList.add('forming')};

  $('#worldCreate').onclick=()=>{
    $('#worldCreate').disabled=true;$('#worldReroll').disabled=true;$('#worldBack').disabled=true;
    const world=structuredClone(preview);
    state.world=world;state.inhabitantsRemaining=world.population;save();
    $('#worldPlanet').classList.add('forming');
    const steps=[[12,'Encendiendo el núcleo'],[29,'Formando continentes'],[46,'Trazando océanos'],[63,'Estabilizando el clima'],[79,'Fundando seis civilizaciones'],[92,'Inscribiendo destinos'],[100,'Mundo completado']];
    let i=0;
    const tick=()=>{
      const [pct,label]=steps[i++];
      $('#worldFill').style.width=pct+'%';$('#worldPct').textContent=pct+'%';$('#worldStep').textContent=label;
      if(i<steps.length)setTimeout(tick,390);else setTimeout(()=>finish(world),420);
    };tick();
  };

  function finish(world){
    const result=$('#worldResult');result.classList.remove('hidden');
    result.innerHTML=`<small>DESTINO SELLADO</small><h2>${world.name}</h2><p><b>${world.population.toLocaleString('es-ES')}</b> habitantes forman la población inicial de este mundo.</p>`;
    const next=button('Entrar en este mundo','game-button gold wide');next.onclick=onComplete;result.append(next);
    $('#worldCreate').classList.add('hidden');$('#worldReroll').classList.add('hidden');$('#worldBack').disabled=false;
  }
}
