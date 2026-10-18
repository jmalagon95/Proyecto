import { el, escapeHtml } from './components.js';

export function renderRace({ app, data, state, save, onBack, onNext }) {
  app.innerHTML = '';
  const screen = el('section', 'screen race-screen-premium');
  screen.innerHTML = `
    <div class="race-ornate-frame">
      <div class="race-corner tl"></div><div class="race-corner tr"></div><div class="race-corner bl"></div><div class="race-corner br"></div>
      <header class="race-page-head">
        <div class="race-brand">KAMI NO CHALLENGE</div>
        <h1>ESCOGE TU RAZA</h1>
        <div class="ornament-line"><span>◇</span></div>
        <p>Cada raza tiene su propia historia y una identidad única.<br>Tú eliges la raza; la rareza, atributos y afinidades se sortearán después.</p>
      </header>
      <div class="race-card-grid"></div>
      <footer class="race-page-actions">
        <div class="back-stack"><button class="round-back" type="button">←</button><span>Volver</span></div>
        <button class="race-confirm-button" type="button"><span>Elegir raza</span><i>›</i></button>
        <div></div>
      </footer>
    </div>`;
  app.append(screen);

  const grid = screen.querySelector('.race-card-grid');
  data.races.forEach(race => {
    const card = el('button', `race-premium-card ${race.id === state.selectedRace ? 'selected' : ''}`);
    card.type = 'button';
    card.innerHTML = `
      <div class="race-premium-art" style="--race-img:url('${race.image}')">
        <div class="race-symbol">${race.emblem}</div>
      </div>
      <div class="race-premium-body">
        <h2>${escapeHtml(race.name)}</h2>
        <div class="race-pill">${escapeHtml(race.tag)}</div>
        <p>${escapeHtml(race.description)}</p>
      </div>`;
    card.onclick = () => {
      state.selectedRace = race.id;
      state.selectedClass = null;
      save();
      renderRace({ app, data, state, save, onBack, onNext });
    };
    grid.append(card);
  });

  screen.querySelector('.round-back').onclick = onBack;
  screen.querySelector('.race-confirm-button').onclick = onNext;
}
