import { el } from './components.js';

export function renderCover({ app, onNew, onContinue, hasSave }) {
  app.innerHTML = '';
  const screen = el('section', 'screen cover-screen cover-stage-intro');
  screen.innerHTML = `
    <div class="cover-bg"></div>
    <div class="cover-wind wind-a"></div>
    <div class="cover-wind wind-b"></div>
    <div class="cover-vignette"></div>
    <div class="cover-title-wrap">
      <div class="cover-logo">KAMI NO CHALLENGE</div>
      <div class="cover-start blink" role="button" tabindex="0">PULSA PARA EMPEZAR</div>
    </div>
    <div class="cover-choice hidden" aria-live="polite">
      <div class="cover-choice-logo">KAMI NO CHALLENGE</div>
      <div class="cover-choice-grid">
        <button type="button" class="cover-choice-card new-game">
          <div class="choice-art"></div>
          <div class="choice-copy"><b>Nueva partida</b><span>Comienza un nuevo mundo.<br>Cada decisión importa.</span></div>
        </button>
        <button type="button" class="cover-choice-card continue-game" ${hasSave ? '' : 'disabled'}>
          <div class="choice-art dark"></div>
          <div class="choice-copy"><b>Continuar</b><span>${hasSave ? 'Vuelve a tu mundo.' : 'Aún no existe una partida.'}</span></div>
        </button>
      </div>
      <div class="permadeath-warning">
        <div class="danger-icon">!</div>
        <div><b>MUERTE PERMANENTE</b><p>Si un personaje muere, se pierde para siempre. No hay segunda oportunidad. Tu protagonista inicial está sujeto a la misma regla.</p></div>
      </div>
    </div>
    <div class="vortex-transition hidden"><div class="vortex-core"></div></div>
    <div class="screen-flash"></div>`;
  app.append(screen);

  const start = screen.querySelector('.cover-start');
  const choice = screen.querySelector('.cover-choice');
  const vortex = screen.querySelector('.vortex-transition');

  const openMenu = () => {
    screen.classList.add('power-off');
    setTimeout(() => {
      screen.classList.remove('cover-stage-intro');
      screen.classList.add('cover-stage-menu');
      start.classList.add('hidden');
      choice.classList.remove('hidden');
      screen.classList.add('power-on');
      setTimeout(() => screen.classList.remove('power-off','power-on'), 520);
    }, 360);
  };

  start.addEventListener('click', openMenu);
  start.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openMenu(); });

  screen.querySelector('.new-game').onclick = () => {
    vortex.classList.remove('hidden');
    screen.classList.add('vortex-active');
    setTimeout(() => onNew(), 950);
  };

  const cont = screen.querySelector('.continue-game');
  if (hasSave) cont.onclick = onContinue;
}
