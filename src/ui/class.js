import { el, escapeHtml } from './components.js';

const GLYPHS=['⚔','⬡','✦','◇','✧','✣','◈','☩'];
const NAME_POOLS={
  kairakh:['Kael','Varik','Nayra','Rhaz','Seyra'],
  elfos:['Aerin','Naelis','Sylwen','Elaris','Vael'],
  kijins:['Akane','Raizen','Shuren','Kaede','Renji'],
  vampiros:['Veyra','Khael','Serah','Valen','Nyra'],
  insectoides:['Lirien','Thrya','Irixa','Vekri','Syth'],
  reptro:['Rhek','Sarka','Thess','Kher','Zaira']
};

function poolsFor(data,raceId){
  return{
    generic:(data.classes.generic||[]).map(c=>({...c,source:'Genérica'})),
    racial:(data.classes[raceId]||[]).map(c=>({...c,source:'Racial'}))
  };
}

export function renderClass({app,data,state,save,onBack,onConfirm}){
  app.innerHTML='';
  const race=data.races.find(r=>r.id===state.selectedRace)||data.races[0];
  const pools=poolsFor(data,race.id);
  const all=[...pools.generic,...pools.racial];
  if(!state.selectedClass||!all.some(c=>c.name===state.selectedClass))state.selectedClass=pools.generic[0]?.name||pools.racial[0]?.name;
  let activeTab=all.find(c=>c.name===state.selectedClass)?.source==='Racial'?'racial':'generic';

  const screen=el('section','screen class-screen-premium');
  screen.innerHTML=`
    <div class="class-bg"></div>
    <div class="class-shell">
      <header class="class-header">
        <small>KAMI NO CHALLENGE</small>
        <h1>Escoge tu clase</h1>
        <div class="class-divider"><i></i><b>◇</b><i></i></div>
        <p>Tu raza define tu origen. Tu clase define cómo lucharás por sobrevivir.</p>
      </header>

      <section class="chosen-race-banner">
        <div class="chosen-race-art" style="background-image:url('${race.image}')"></div>
        <div class="chosen-race-shade"></div>
        <div class="chosen-race-copy"><small>RAZA ELEGIDA</small><h2>${escapeHtml(race.name)}</h2><p>${escapeHtml(race.description)}</p></div>
        <button id="changeRace" type="button">Cambiar raza</button>
      </section>

      <div class="class-tabs">
        <button type="button" data-tab="generic"><b>Clases genéricas</b><small>Disponibles para todas las razas</small></button>
        <button type="button" data-tab="racial"><b>Clases raciales</b><small>Exclusivas de ${escapeHtml(race.name)}</small></button>
      </div>

      <div class="class-grid" id="classGrid"></div>

      <section class="class-detail" id="classDetail"></section>

      <section class="hero-sex-box" aria-label="Sexo del protagonista">
        <div><small>SEXO DEL PROTAGONISTA</small><p>Elige cómo será tu personaje. No altera su rareza ni sus atributos.</p></div>
        <div class="hero-sex-options" role="group" aria-label="Sexo">
          <button type="button" data-hero-sex="masculino" aria-pressed="${state.heroSex!=='femenino'}">Hombre</button>
          <button type="button" data-hero-sex="femenino" aria-pressed="${state.heroSex==='femenino'}">Mujer</button>
        </div>
      </section>
      <section class="hero-name-box">
        <div><small>NOMBRE DEL PROTAGONISTA</small><p>Podrás cambiarlo una vez más desde los Dormitorios.</p></div>
        <div class="hero-name-control"><input id="heroName" maxlength="28" value="${escapeHtml(state.heroName||'')}" placeholder="Escribe un nombre"><button id="randomName" type="button">⚄</button></div>
      </section>

      <footer class="class-actions">
        <button class="class-back" id="classBack" type="button">←</button>
        <button class="class-confirm" id="classConfirm" type="button"><span>CONFIRMAR CLASE</span><i>›</i></button>
      </footer>
    </div>`;
  app.append(screen);

  const grid=screen.querySelector('#classGrid');
  const detail=screen.querySelector('#classDetail');
  const nameInput=screen.querySelector('#heroName');

  function current(){return all.find(c=>c.name===state.selectedClass)||all[0]}

  function renderTab(){
    const list=pools[activeTab];
    if(!list.some(c=>c.name===state.selectedClass))state.selectedClass=list[0]?.name||state.selectedClass;
    screen.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
    grid.innerHTML=list.map((cls,i)=>`
      <button class="class-card ${cls.name===state.selectedClass?'selected':''}" type="button" data-name="${escapeHtml(cls.name)}">
        <div class="class-card-art" style="--class-race:url('${race.image}');--pos:${18+i*13}%"></div>
        <div class="class-card-overlay"></div>
        <div class="class-card-glyph">${GLYPHS[i%GLYPHS.length]}</div>
        <div class="class-card-copy"><h3>${escapeHtml(cls.name)}</h3><span>${escapeHtml(cls.role)}</span></div>
      </button>`).join('');
    grid.querySelectorAll('[data-name]').forEach(btn=>btn.onclick=()=>{state.selectedClass=btn.dataset.name;save();renderTab()});
    renderDetail();
  }

  function renderDetail(){
    const cls=current();
    detail.innerHTML=`
      <div class="class-detail-main"><small>${cls.source==='Racial'?'CLASE RACIAL':'CLASE GENÉRICA'}</small><h2>${escapeHtml(cls.name)}</h2><span>${escapeHtml(cls.role)}</span><p>${escapeHtml(cls.description)}</p></div>
      <div class="class-weapons"><small>ARMAS COMPATIBLES</small>${cls.weapons.map(w=>`<b>◆ ${escapeHtml(w)}</b>`).join('')}</div>
      <div class="class-gacha-note"><strong>El destino aún no está decidido</strong><p>Al confirmar se sortearán la rareza ★1–★8 y los seis atributos iniciales. Aquí no se muestran habilidades porque solo existirán si el personaje realmente las obtiene.</p></div>`;
  }

  screen.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{activeTab=btn.dataset.tab;renderTab()});
  screen.querySelectorAll('[data-hero-sex]').forEach(btn=>btn.onclick=()=>{
    state.heroSex=btn.dataset.heroSex;
    screen.querySelectorAll('[data-hero-sex]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
    save();
  });
  nameInput.oninput=e=>{state.heroName=e.target.value.trimStart();save()};
  screen.querySelector('#randomName').onclick=()=>{const p=NAME_POOLS[race.id]||['Aspirante'];state.heroName=p[Math.floor(Math.random()*p.length)];nameInput.value=state.heroName;save()};
  screen.querySelector('#changeRace').onclick=onBack;
  screen.querySelector('#classBack').onclick=onBack;
  screen.querySelector('#classConfirm').onclick=()=>onConfirm(current());
  renderTab();
}
