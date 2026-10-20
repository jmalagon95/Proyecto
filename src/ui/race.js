import { el, escapeHtml } from './components.js';

export function renderRace({app,data,state,save,onBack,onNext}){
  app.innerHTML='';
  if(!data.races.some(r=>r.id===state.selectedRace)) state.selectedRace=data.races[0]?.id||'kairakh';
  state.heroSex=state.heroSex==='femenino'?'femenino':'masculino';
  const screen=el('section','screen race-screen-premium');
  screen.innerHTML=`
    <div class="race-cathedral-bg"></div>
    <div class="race-frame">
      <header class="race-header">
        <div class="race-logo">KAMI NO CHALLENGE</div>
        <h1>Escoge tu raza</h1>
        <div class="race-divider"><i></i><b>◇</b><i></i></div>
        <p>Cada raza tiene su propia historia e identidad.<br>Tu elección define el origen de tu protagonista.</p>
      </header>
      <div class="race-gender-choice" role="group" aria-label="Sexo del personaje">
        <button type="button" data-select-sex="masculino" aria-pressed="${state.heroSex==='masculino'}">♂ Hombre</button>
        <button type="button" data-select-sex="femenino" aria-pressed="${state.heroSex==='femenino'}">♀ Mujer</button>
      </div>
      <div class="race-card-grid"></div>
      <footer class="race-actions">
        <div class="race-back-wrap"><button class="race-back" type="button">←</button><span>Volver</span></div>
        <button class="race-confirm" type="button"><span>Elegir raza</span><i>›</i></button>
      </footer>
    </div>`;
  app.append(screen);

  const grid=screen.querySelector('.race-card-grid');
  screen.querySelectorAll('[data-select-sex]').forEach(btn=>btn.onclick=()=>{
    state.heroSex=btn.dataset.selectSex;
    screen.querySelectorAll('[data-select-sex]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
    save();
  });
  data.races.forEach(race=>{
    const card=el('button',`race-card ${race.id===state.selectedRace?'selected':''}`);
    card.type='button';
    card.dataset.race=race.id;
    card.innerHTML=`
      <div class="race-wallpaper" style="background-image:url('${race.image}')"></div>
      <div class="race-card-shade"></div>
      <div class="race-card-copy">
        <div class="race-emblem">${race.emblem}</div>
        <div class="race-text"><h2>${escapeHtml(race.name)}</h2><p>${escapeHtml(race.description)}</p></div>
      </div>`;
    card.onclick=()=>{
      state.selectedRace=race.id;
      state.selectedClass=null;
      save();
      grid.querySelectorAll('.race-card').forEach(x=>x.classList.toggle('selected',x.dataset.race===race.id));
    };
    grid.append(card);
  });

  screen.querySelector('.race-back').onclick=onBack;
  screen.querySelector('.race-confirm').onclick=onNext;
}
