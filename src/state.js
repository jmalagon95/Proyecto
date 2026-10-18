const KEY = 'kami_no_challenge_v04_state';

export const defaultState = {
  screen: 'cover',
  world: null,
  inhabitantsRemaining: null,
  permadeathAccepted: false,
  selectedRace: 'kairakh',
  selectedClass: null,
  heroName: '',
  playerName: 'Jugador',
  lobbyLevel: 1,

  // Recursos visibles del asentamiento inicial.
  resources: { gold: 1000, wood: 0, stone: 0 },

  // Materiales especiales de progresión. No forman parte del HUD básico.
  progression: {
    ascensionStones: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0 }
  },

  inventory: [],
  characters: [],
  activeCharacterId: null,

  summon: {
    freeMultiUsed: false,
    history: [],
    costs: { singleGold: 1000, multiGold: 10000 }
  },

  missionProgress: {
    survival1Completions: 0
  }
};

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    const state = {
      ...structuredClone(defaultState),
      ...(saved || {}),
      resources:{...structuredClone(defaultState.resources),...((saved&&saved.resources)||{})},
      progression:{
        ...structuredClone(defaultState.progression),
        ...((saved&&saved.progression)||{}),
        ascensionStones:{
          ...structuredClone(defaultState.progression.ascensionStones),
          ...((saved&&saved.progression&&saved.progression.ascensionStones)||{})
        }
      },
      summon:{
        ...structuredClone(defaultState.summon),
        ...((saved&&saved.summon)||{}),
        costs:{
          ...structuredClone(defaultState.summon.costs),
          ...((saved&&saved.summon&&saved.summon.costs)||{})
        }
      },
      missionProgress:{...structuredClone(defaultState.missionProgress),...((saved&&saved.missionProgress)||{})}
    };
    return state;
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state){ localStorage.setItem(KEY, JSON.stringify(state)); }
export function resetState(){ localStorage.removeItem(KEY); return structuredClone(defaultState); }
