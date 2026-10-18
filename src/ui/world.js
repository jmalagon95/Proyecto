import { el, button } from './components.js';

const WORLD_NAMES = ['Velmora','Astreon','Myrhalis','Eryndor','Kaelthar','Lumyra','Neravia','Aetheris'];

function makeWorld() {
  return {
    name: WORLD_NAMES[Math.floor(Math.random() * WORLD_NAMES.length)],
    population: Math.floor(6_000_000_000_000 + Math.random() * 4_000_000_000_000),
    civilizations: 8,
  };
}

export function renderWorld({ app, state, save, onBack, onComplete }) {
  app.innerHTML = '';
  const screen = el('section', 'screen world-screen');
  screen.innerHTML = `
    <div class="world-premium-shell">
      <aside class="world-copy-card glass-panel">
        <div class="eyebrow">Generación planetaria</div>
        <h1>Forjando tu mundo</h1>
        <p class="lead">Un único planeta fija población, reinos, ciudades, regiones y los orígenes de todos los habitantes que podrán ser invocados en esta partida.</p>
        <div class="genesis-points">
          <div><b>01</b><span>Núcleo, atmósfera y océanos</span></div>
          <div><b>02</b><span>Continentes y regiones</span></div>
          <div><b>03</b><span>Civilizaciones y destinos</span></div>
        </div>
        <div class="genesis-console">
          <small>CONSOLA DE GÉNESIS</small>
          <strong id="worldStatus">Esperando inicio...</strong>
        </div>
        <div class="world-buttons"></div>
      </aside>
      <main class="planet-chamber glass-panel">
        <div class="planet-chamber-top">
          <div><small>CÁMARA ASTRAL</small><strong id="worldNamePreview">Mundo sin formar</strong></div>
          <span>Génesis persistente</span>
        </div>
        <div class="planet-stage-pro">
          <div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div>
          <div class="planet-pro" id="planetPro">
            <div class="p-ocean"></div><div class="p-land l1"></div><div class="p-land l2"></div><div class="p-clouds"></div><div class="p-shade"></div><div class="p-atmo"></div><div class="p-shine"></div>
          </div>
        </div>
        <div class="world-progress"><div id="worldFill"></div></div>
        <div class="world-progress-meta"><b id="worldPct">0%</b><span id="worldStep">Preparado para comenzar</span></div>
        <div class="world-result hidden" id="worldResult"></div>
      </main>
    </div>`;
  app.append(screen);

  const buttons = screen.querySelector('.world-buttons');
  const forge = button('Comenzar creación', 'game-button gold');
  const back = button('Volver', 'game-button dark');
  buttons.append(forge, back);
  back.onclick = onBack;

  forge.onclick = () => {
    forge.disabled = true;
    const world = makeWorld();
    state.world = world;
    save();
    screen.querySelector('#worldNamePreview').textContent = world.name;
    screen.querySelector('#planetPro').classList.add('forming');
    const steps = [
      [12,'Comprimiendo núcleo'],[27,'Vertiendo océanos'],[43,'Elevando continentes'],
      [58,'Modelando atmósfera'],[74,'Fundando civilizaciones'],[89,'Inscribiendo destinos'],[100,'Mundo completado']
    ];
    let i = 0;
    const tick = () => {
      const [pct, text] = steps[i++];
      screen.querySelector('#worldFill').style.width = pct + '%';
      screen.querySelector('#worldPct').textContent = pct + '%';
      screen.querySelector('#worldStep').textContent = text;
      screen.querySelector('#worldStatus').textContent = text;
      if (i < steps.length) setTimeout(tick, 520);
      else setTimeout(() => showResult(world), 500);
    };
    tick();
  };

  function showResult(world) {
    const result = screen.querySelector('#worldResult');
    result.classList.remove('hidden');
    result.innerHTML = `
      <div class="world-result-title">${world.name}</div>
      <div class="world-result-grid">
        <div><small>Población potencial</small><b>${world.population.toLocaleString('es-ES')}</b></div>
        <div><small>Civilizaciones</small><b>${world.civilizations} fundacionales</b></div>
      </div>`;
    const next = button('Elegir mi raza', 'game-button gold wide');
    next.onclick = onComplete;
    result.append(next);
  }
}
