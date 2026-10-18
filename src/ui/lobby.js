import { el } from './components.js';

export function renderLobby({ app, state, activeHero, onOpen }) {
  app.innerHTML = '';
  const screen = el('section','screen lobby-screen-premium');
  const heroStars = activeHero ? '★'.repeat(activeHero.currentStar) : '—';
  screen.innerHTML = `
    <header class="lobby-hud-premium">
      <div class="player-hud">
        <div class="player-avatar" style="background-image:url('${activeHero?.wallpaper || ''}')"></div>
        <div><b>${state.playerName}</b><small>${activeHero ? activeHero.name : 'Sin personaje activo'}</small></div>
      </div>
      <div class="lobby-level-hud"><small>ASENTAMIENTO</small><b>Lobby Nv.${state.lobbyLevel}</b><span>Pradera pobre</span></div>
      <div class="resource-strip">
        <div>◆ <b>${state.resources.crystals}</b></div>
        <div>● <b>${state.resources.gold}</b></div>
        <div>✦ <b>${state.resources.essence}</b></div>
        <div>🪵 <b>${state.resources.wood}</b></div>
        <div>🪨 <b>${state.resources.stone}</b></div>
      </div>
    </header>

    <div class="lobby-scene-premium">
      <div class="sky-haze"></div><div class="far-hills"></div><div class="meadow"></div>
      <div class="flower-field"></div><div class="dirt-road r1"></div><div class="dirt-road r2"></div><div class="stream"></div>
      <div class="lobby-object dorms" data-building="dorms"><div class="poor-house dorm-house"><i></i></div><div class="building-label"><span>⌂</span><b>Dormitorios</b><small>11 plazas iniciales</small></div></div>
      <div class="lobby-object shrine" data-building="sanctuary"><div class="poor-shrine"><i></i></div><div class="building-label"><span>✦</span><b>Santuario de invocación</b><small>Invocar · Ascender · Sacrificar</small></div></div>
      <div class="lobby-object mission" data-building="missions"><div class="poor-portal"><i></i></div><div class="building-label"><span>⚔</span><b>Portal de misiones</b><small>Desafíos y recompensas</small></div></div>
      <div class="lobby-object storage" data-building="storage"><div class="poor-house store-house"><i></i></div><div class="building-label"><span>▣</span><b>Almacén</b><small>Objetos y recursos</small></div></div>

      <div class="lobby-active-card">
        <div class="mini-portrait" style="background-image:url('${activeHero?.wallpaper || ''}')"></div>
        <div><b>${activeHero?.name ?? 'Sin personaje'}</b><div>${activeHero ? `${heroStars} · ${activeHero.raceName} · ${activeHero.className} · Nv.${activeHero.level}` : 'Crea o invoca un personaje para comenzar.'}</div></div>
      </div>
    </div>

    <nav class="bottom-game-nav">
      <button data-building="lobby" class="active"><span>⌂</span><b>Lobby</b></button>
      <button data-building="dorms"><span>♙</span><b>Personajes</b></button>
      <button data-building="storage"><span>▣</span><b>Mochila</b></button>
      <button data-building="missions"><span>▤</span><b>Misiones</b></button>
      <button data-building="menu"><span>☷</span><b>Menú</b></button>
    </nav>`;
  app.append(screen);
  screen.querySelectorAll('[data-building]').forEach(node => {
    if (node.dataset.building !== 'lobby') node.onclick = () => onOpen(node.dataset.building);
  });
}
