import { el, button, stars } from './components.js';

const ranges = {1:[1,5],2:[2,8],3:[4,13],4:[8,25],5:[18,40],6:[30,65],7:[50,95],8:[80,140]};
const probs = [[1,70],[2,26],[3,3.5],[4,.45],[5,.045],[6,.0045],[7,.0005],[8,.0000005]];
function rollStar(){let x=Math.random()*100,a=0;for(const [s,p] of probs){a+=p;if(x<a)return s}return 1}
function stat(star){const [a,b]=ranges[star];return Math.floor(a+Math.random()*(b-a+1))}

export function createHero(race, cls, name='') {
  const starLevel = rollStar();
  const stats = Object.fromEntries(['FUE','AGI','CON','DEF','INT','VOL'].map(k => [k, stat(starLevel)]));
  return {
    id: crypto.randomUUID(), name: name || 'Aspirante', raceId: race.id, raceName: race.name,
    className: cls.name, role: cls.role, weapons: cls.weapons, weapon: cls.weapons[0],
    birthStar: starLevel, currentStar: starLevel, level: 1, stats,
    skills: starLevel >= 3 ? [{name:'Skill inicial pendiente de catálogo', rank:'D'}] : [],
    passives: [], dead:false,
  };
}

export function renderReveal({ app, race, hero, onEnter }) {
  app.innerHTML = '';
  const screen = el('section','screen reveal-screen');
  screen.innerHTML = `
    <div class="reveal-card glass-panel">
      <div class="eyebrow">Invocación completada</div>
      <div class="reveal-stars">${stars(hero.currentStar)}</div>
      <div class="reveal-grid">
        <div class="reveal-art" style="--reveal:url('${race.image}')"></div>
        <div class="reveal-info">
          <h1>${hero.name}</h1>
          <div class="reveal-line">${hero.raceName} · ${hero.className} · ★${hero.currentStar} · Nv.1</div>
          <div class="stat-grid">${Object.entries(hero.stats).map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
          <div class="reveal-skill"><b>Skill inicial</b><span>${hero.skills.length ? hero.skills[0].name : 'NINGUNA — solo ataque básico'}</span></div>
          <div class="reveal-skill"><b>Pasiva inicial</b><span>${hero.passives.length ? hero.passives[0].name : 'NINGUNA'}</span></div>
          <div class="visual-request"><small>DESCRIPCIÓN PARA GENERAR SU IMAGEN FINAL</small><textarea readonly>${`KAMI NO CHALLENGE — SOLICITUD VISUAL\nID ESTABLE: ${hero.id}\nPERSONAJE: ${hero.name}\nRAZA: ${hero.raceName}\nRAREZA: ★${hero.currentStar}\nCLASE: ${hero.className}\nARMA EQUIPADA OBLIGATORIA: ${hero.weapon}\nFUE ${hero.stats.FUE} · AGI ${hero.stats.AGI} · CON ${hero.stats.CON} · DEF ${hero.stats.DEF} · INT ${hero.stats.INT} · VOL ${hero.stats.VOL}\nUna sola figura, cuerpo completo, frontal estricto, estilo manga/anime aprobado para Kami No Challenge.`}</textarea></div>
        </div>
      </div>
    </div>`;
  const enter = button('Entrar al Lobby Nv.1','game-button gold wide'); enter.onclick = onEnter;
  screen.querySelector('.reveal-info').append(enter);
  app.append(screen);
}
