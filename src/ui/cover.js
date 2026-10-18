import { el, button } from './components.js';

export function renderCover({ app, onNew, onContinue, hasSave }) {
  app.innerHTML = '';
  const screen = el('section', 'screen cover-screen');
  screen.innerHTML = `
    <div class="cover-bg"></div>
    <div class="cover-vignette"></div>
    <div class="cover-title-wrap">
      <div class="cover-logo">KAMI NO CHALLENGE</div>
      <div class="cover-sub">La prueba de los dioses</div>
      <div class="cover-start blink">✦ PULSA PARA EMPEZAR ✦</div>
      <div class="cover-menu hidden"></div>
    </div>`;
  app.append(screen);

  const start = screen.querySelector('.cover-start');
  const menu = screen.querySelector('.cover-menu');
  start.addEventListener('click', () => {
    start.classList.add('hidden');
    menu.classList.remove('hidden');
    menu.append(button('Nueva partida', 'game-button gold'));
    if (hasSave) menu.append(button('Continuar', 'game-button dark'));
    menu.children[0].onclick = onNew;
    if (hasSave && menu.children[1]) menu.children[1].onclick = onContinue;
  });
}
