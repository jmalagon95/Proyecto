import { loadState, saveState, resetState } from './state.js';
import { loadGameData, raceById } from './data.js';
import { renderCover } from './ui/cover.js';
import { renderWorld } from './ui/world.js';
import { renderRace } from './ui/race.js';
import { renderClass } from './ui/class.js';
import { renderReveal, createHero } from './ui/reveal.js';
import { renderLobby } from './ui/lobby.js';
import { renderBuilding } from './ui/buildings.js';

export async function startGame(app) {
  const data = await loadGameData();
  let state = loadState();
  const save = () => saveState(state);
  const hasSave = () => Boolean(state.world || state.characters.length);
  const activeHero = () => state.characters.find(c => c.id === state.activeCharacterId && !c.dead) ?? state.characters.find(c => !c.dead) ?? null;

  const routes = {
    cover: () => renderCover({ app, hasSave:hasSave(), onNew:()=>{state=resetState();save();routes.world();}, onContinue:()=>routes.lobby() }),
    world: () => renderWorld({ app,state,save,onBack:()=>routes.cover(),onComplete:()=>routes.race() }),
    race: () => renderRace({ app,data,state,save,onBack:()=>routes.world(),onNext:()=>routes.class() }),
    class: () => renderClass({ app,data,state,save,onBack:()=>routes.race(),onConfirm:(cls)=>{
      const race = raceById(data,state.selectedRace); const hero=createHero(race,cls,state.heroName); state.characters=[hero];state.activeCharacterId=hero.id;if(state.inhabitantsRemaining!=null)state.inhabitantsRemaining=Math.max(0,state.inhabitantsRemaining-1);save();routes.reveal(hero);
    }}),
    reveal: (hero=activeHero()) => renderReveal({ app,race:raceById(data,hero.raceId),hero,onEnter:()=>routes.lobby() }),
    lobby: () => renderLobby({ app,state,activeHero:activeHero(),onOpen:(type)=>routes.building(type) }),
    building: (type) => renderBuilding({ app,type,state,activeHero:activeHero(),onBack:()=>routes.lobby() })
  };

  routes.cover();
}
