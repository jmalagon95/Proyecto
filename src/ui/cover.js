import { el } from './components.js';

export function renderCover({ app, onNew, onContinue, hasSave }) {
  app.innerHTML = '';
  const screen = el('section','screen cover-screen');
  const leaves = Array.from({length:16},(_,i)=>`<i class="wind-leaf leaf-${i+1}"></i>`).join('');
  screen.innerHTML = `
    <div class="cover-bg"></div>
    <div class="cover-breath-layer"></div>
    <div class="cover-light"></div>
    <div class="leaf-field">${leaves}</div>
    <button class="cover-tap-zone" type="button" aria-label="Pulsa para empezar"></button>

    <div class="cover-choice hidden">
      <div class="cover-choice-frame">
        <div class="cover-choice-title">KAMI NO CHALLENGE</div>
        <div class="cover-choice-ornament"><span>✦</span></div>
        <button class="cover-menu-button new-game" type="button"><small>NUEVO DESTINO</small><b>Nueva partida</b><i>›</i></button>
        <button class="cover-menu-button continue-game" type="button" ${hasSave?'':'disabled'}><small>REGRESAR AL MUNDO</small><b>Continuar</b><i>›</i></button>
        <p class="cover-choice-note">${hasSave?'Tu mundo te espera.':'Aún no existe una partida guardada.'}</p>
      </div>
    </div>

    <div class="vortex-transition hidden"><div class="vortex-ring r1"></div><div class="vortex-ring r2"></div><div class="vortex-core"></div></div>
    <div class="screen-flash"></div>`;
  app.append(screen);

  const tap=screen.querySelector('.cover-tap-zone');
  const choice=screen.querySelector('.cover-choice');
  const vortex=screen.querySelector('.vortex-transition');

  tap.onclick=()=>{
    tap.classList.add('hidden');
    screen.classList.add('cover-menu-open');
    choice.classList.remove('hidden');
  };

  screen.querySelector('.new-game').onclick=()=>{
    vortex.classList.remove('hidden');
    setTimeout(onNew,900);
  };

  const cont=screen.querySelector('.continue-game');
  if(hasSave) cont.onclick=onContinue;
}
