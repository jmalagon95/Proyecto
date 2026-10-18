const KEY = 'kami_no_challenge_v02_state';

export const defaultState = {
  screen: 'cover',
  world: null,\n  inhabitantsRemaining: null,
  selectedRace: 'kairakh',
  selectedClass: null,
  heroName: '',
  playerName: 'Jugador',
  lobbyLevel: 1,
  resources: { crystals: 15, gold: 100, essence: 0, wood: 24, stone: 16 },
  inventory: [],
  characters: [],
  activeCharacterId: null,
};

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return { ...structuredClone(defaultState), ...(saved || {}) };
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(KEY);
  return structuredClone(defaultState);
}
