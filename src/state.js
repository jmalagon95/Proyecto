const KEY = 'kami_no_challenge_v02_state';

export const defaultState = {
  screen: 'cover',
  world: null,
  inhabitantsRemaining: null,
  selectedRace: 'kairakh',
  selectedClass: null,
  heroName: '',
  playerName: 'Jugador',
  lobbyLevel: 1,
  resources: { crystals: 15, gold: 100, essence: 0, wood: 24, stone: 16 },
  inventory: [],
  characters: [],
  activeCharacterId: null,
  summon: {
    freeMultiUsed: false,
    history: []
  }
};

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return {
      ...structuredClone(defaultState),
      ...(saved || {}),
      resources: {
        ...structuredClone(defaultState.resources),
        ...((saved && saved.resources) || {})
      },
      summon: {
        ...structuredClone(defaultState.summon),
        ...((saved && saved.summon) || {})
      }
    };
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
