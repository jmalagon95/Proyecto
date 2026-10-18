import { el, button } from './components.js';

export function renderBuilding({ app, type, state, activeHero, onBack }) {
  app.innerHTML = '';
  const screen = el('section','screen building-screen');
  const configs = {
    dorms:['Dormitorios','Personajes, estadísticas, skills, pasivas, equipo, invocaciones vinculadas e historial.'],
    sanctuary:['Santuario de Invocación','Invocar · Ascender · Sacrificar'],
    missions:['Portal de Misiones','Selecciona misión y prepara un equipo de hasta 5 personajes.'],
    storage:['Almacén','Solo objetos. Capacidad inicial: 50 espacios. Materiales apilados y equipo individual.'],
    menu:['Menú','Ajustes, guardado y opciones generales del juego.']
  };
  const [title, sub] = configs[type] ?? configs.menu;
  screen.innerHTML = `<div class="building-shell"><header><div><small>KAMI NO CHALLENGE</small><h1>${title}</h1><p>${sub}</p></div></header><div class="building-body"></div></div>`;
  const body = screen.querySelector('.building-body');
  if (type === 'dorms') body.innerHTML = `
    <div class="premium-roster"><aside><h2>Personajes vivos</h2>${state.characters.map(c=>`<div class="roster-row"><div class="roster-dot"></div><div><b>${c.name}</b><span>★${c.currentStar} · ${c.raceName} · ${c.className}</span></div></div>`).join('')}</aside>
    <main><h2>${activeHero?.name ?? 'Sin personaje'}</h2><div class="stat-grid">${activeHero ? Object.entries(activeHero.stats).map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('') : ''}</div><div class="info-card"><b>Skills</b><p>${activeHero?.skills.length ? activeHero.skills.map(s=>s.name).join(', ') : 'Sin skills aprendidas: solo ataque básico.'}</p></div><div class="info-card"><b>Pasivas</b><p>${activeHero?.passives.length ? activeHero.passives.map(s=>s.name).join(', ') : 'Sin pasivas.'}</p></div></main></div>`;
  else if (type === 'sanctuary') body.innerHTML = `<div class="sanctuary-tabs"><button>Invocar</button><button>Ascender</button><button>Sacrificar</button></div><div class="summon-orb"><div></div><span>Cámara de invocación</span></div><div class="sanctuary-note">Las reglas definitivas de ascensión consumen 10 personajes del rango correspondiente para crear una piedra de ascensión.</div>`;
  else if (type === 'missions') body.innerHTML = `<div class="mission-premium"><h2>Supervivencia I</h2><p>Resiste 3:00 minutos frente a oleadas de Goblins ★1. Muerte permanente de personajes. Campo rectangular con 3 carriles invisibles y ataques diagonales.</p><div class="team-slots">${[0,1,2,3,4].map((i)=>`<div>${state.characters[i] ? `<b>${state.characters[i].name}</b><span>★${state.characters[i].currentStar}</span>` : '<b>Vacío</b><span>Añadir</span>'}</div>`).join('')}</div><button class="game-button gold wide">Preparar misión</button></div>`;
  else if (type === 'storage') body.innerHTML = `<div class="storage-tabs"><button class="active">Materiales</button><button>Equipo</button><button>Consumibles</button><button>Especiales</button></div><div class="inventory-grid"><div><b>Madera vieja</b><span>x${state.resources.wood}</span></div><div><b>Piedra común</b><span>x${state.resources.stone}</span></div><div><b>Espacio usado</b><span>${state.inventory.length}/50</span></div></div>`;
  else body.innerHTML = `<div class="info-card"><b>Versión</b><p>Proyecto móvil modular v0.2.</p></div>`;

  const back = button('Volver al Lobby','game-button dark'); back.onclick = onBack; body.append(back);
  app.append(screen);
}
