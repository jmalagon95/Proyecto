// Kami No Challenge — progression data for 30 tower floors.
// Standalone module; does not replace the active HTML master.
export const TOWER_ZONES = Object.freeze([
  { name:'Praderas fracturadas', enemies:['Merodeador','Explorador','Acechador'], boss:'Guardián de la llanura' },
  { name:'Bosque de espinas', enemies:['Arquero espinoso','Rastreador','Chamán silvestre'], boss:'Espíritu del espinar' },
  { name:'Ruinas cenicientas', enemies:['Guerrero de ceniza','Vigía espectral','Hechicero perdido'], boss:'Señor de las ruinas' },
  { name:'Pantano del eclipse', enemies:['Acechador del fango','Lancero umbrío','Oráculo oscuro'], boss:'Devorador del eclipse' },
  { name:'Bastión de obsidiana', enemies:['Centinela negro','Ballestero blindado','Custodio ígneo'], boss:'Titán de obsidiana' },
  { name:'Cumbres del trueno', enemies:['Guerrero de tormenta','Tirador del rayo','Canalizador'], boss:'Heraldo de las tormentas' }
]);
const clamp = (n,lo,hi)=>Math.min(hi,Math.max(lo,n));
export const TOWER_FLOORS = Object.freeze(Array.from({length:30},(_,i)=>{
  const floor=i+1, zone=TOWER_ZONES[Math.floor(i/5)], boss=floor%5===0;
  return Object.freeze({
    floor, zone:zone.name, enemies:zone.enemies, boss:boss?zone.boss:null,
    enemyHPPercent:Math.round(100*Math.pow(1.158,i)),
    enemyAttackPercent:Math.round(100*Math.pow(1.071,i)),
    enemyDefensePercent:Math.round(100*(1+0.095*i)),
    coins:70+Math.round(i*15.5), xp:100+i*20,
    waves:3+Math.floor(i/5), elite:floor%5===4,
    mechanic:boss?'Jefe con fase de presión':floor%5===4?'Oleada de élite':'Combate progresivo'
  });
}));
export function normalizeTowerProgress(saved) {
  const unlockedFloor=clamp(Number.isFinite(saved?.unlockedFloor)?Math.floor(saved.unlockedFloor):1,1,30);
  const completed=Array.isArray(saved?.completed)?saved.completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=30):[];
  return {unlockedFloor,completed:[...new Set(completed)].sort((a,b)=>a-b)};
}
export function canEnterTowerFloor(state, floor) {
  return Number.isInteger(floor)&&floor>=1&&floor<=normalizeTowerProgress(state).unlockedFloor;
}
// Return new state + first-clear rewards; the caller persists this alongside its existing save.
export function clearTowerFloor(state,floor) {
  const previous=normalizeTowerProgress(state);
  if(!canEnterTowerFloor(previous,floor)) return {ok:false,state:previous,rewards:null};
  const firstClear=!previous.completed.includes(floor);
  const completed=firstClear?[...previous.completed,floor].sort((a,b)=>a-b):previous.completed;
  const next={unlockedFloor:Math.max(previous.unlockedFloor,Math.min(30,floor+1)),completed};
  return {ok:true,state:next,rewards:firstClear?{coins:TOWER_FLOORS[floor-1].coins,xp:TOWER_FLOORS[floor-1].xp}:null};
}
// No fixed party stats: extract combat data from the character roster at runtime.
export function getTowerParty(characters,ids) {
  const roster=Array.isArray(characters)?characters:[];
  const selected=new Set(Array.isArray(ids)?ids:[]);
  return roster.filter(c=>c&&!c.dead&&(selected.size===0||selected.has(c.id))).map(c=>({
    id:c.id,name:c.name,level:c.level??1,stars:c.currentStar??c.stars??1,
    role:c.role??c.className??'Combatiente',stats:{...(c.stats||{})},
    equipment:{...(c.equipment||{})},skills:[...(c.skills||[])]
  }));
}
