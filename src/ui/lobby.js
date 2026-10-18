import { el } from './components.js';

export function renderLobby({app,state,activeHero,onOpen}){
  app.innerHTML='';
  const stars=activeHero?'★'.repeat(activeHero.currentStar):'—';
  const screen=el('section','screen lobby-premium');
  screen.innerHTML=`
    <div class="lobby-sky"></div>
    <div class="lobby-world-glow"></div>

    <header class="lobby-topbar">
      <div class="lobby-player">
        <div class="lobby-avatar" style="background-image:url('${activeHero?.wallpaper||''}')"></div>
        <div><strong>${activeHero?.name||state.playerName}</strong><span>Nv. ${activeHero?.level||1}</span></div>
      </div>
      <div class="lobby-resources">
        <div><i>●</i><b>${state.resources.gold.toLocaleString('es-ES')}</b><small>Oro</small></div>
        <div><i>▥</i><b>${state.resources.wood.toLocaleString('es-ES')}</b><small>Madera</small></div>
        <div><i>⬢</i><b>${state.resources.stone.toLocaleString('es-ES')}</b><small>Piedra</small></div>
      </div>
    </header>

    <section class="lobby-title">
      <small>Nv. ${state.lobbyLevel}</small>
      <h1>PRADERA DEL AMANECER</h1>
    </section>

    <main class="lobby-map">
      <button class="lobby-landmark dorm" data-building="dorms">
        <span class="landmark-icon">⌂</span><b>Dormitorios</b><i></i>
      </button>
      <button class="lobby-landmark sanctuary" data-building="sanctuary">
        <span class="landmark-icon">✦</span><b>Santuario de invocación</b><i></i>
      </button>
      <button class="lobby-landmark portal" data-building="missions">
        <span class="landmark-icon">⚔</span><b>Portal de misiones</b><i></i>
      </button>
      <button class="lobby-landmark store" data-building="storage">
        <span class="landmark-icon">▣</span><b>Almacén</b><i></i>
      </button>

      <button class="lobby-hero-strip" data-building="profile" type="button">
        <div class="hero-strip-avatar" style="background-image:url('${activeHero?.wallpaper||''}')"></div>
        <div><strong>${activeHero?.name||'Sin protagonista'}</strong><span>${activeHero?stars+' · '+activeHero.raceName+' · '+activeHero.className+' · Nv.'+activeHero.level:'Crea un personaje para comenzar.'}</span></div>
      </button>
    </main>

    <nav class="lobby-bottom-nav">
      <button class="active"><span>♜</span><b>Lobby</b></button>
      <button data-building="dorms"><span>♙</span><b>Personajes</b></button>
      <button data-building="storage"><span>▣</span><b>Mochila</b></button>
      <button data-building="missions"><span>▤</span><b>Misiones</b></button>
      <button data-building="menu"><span>☷</span><b>Menú</b></button>
    </nav>`;
  app.append(screen);
  screen.querySelectorAll('[data-building]').forEach(btn=>btn.onclick=()=>onOpen(btn.dataset.building));
}
