export function createInitialGameState(overrides = {}) {
  return {
    phase: 'lobby',
    participants: [],
    bracket: [],
    groups: null,
    swissTeams: null,
    tournamentPhase: null,
    readyPlayers: [],
    resetPlayers: [],
    champion: null,
    currentRound: 0,
    roundComplete: false,
    roundReady: [],
    cardCollections: {},
    activeLineups: {},
    economy: {},
    lockedCards: {},
    cardStats: {},
    globalSecrets: {},
    pendingPacks: {},
    pendingPackResults: {},
    lastOpenedPack: {},
    starterPackClaimed: {},
    teamSkins: {},
    seasonRound: 0,
    continueSeasonVotes: [],
    year: 1,
    eventIndex: 0,
    history: [],
    seasonScores: null,
    endOfYearRecap: null,
    ...overrides,
  };
}

export const state = createInitialGameState();

const gameTimeouts = new Map();

export function scheduleGameTimeout(key, callback, delay) {
  clearGameTimeout(key);

  const timeout = setTimeout(() => {
    gameTimeouts.delete(key);
    callback();
  }, delay);

  gameTimeouts.set(key, timeout);
  return timeout;
}

export function clearGameTimeout(key) {
  const timeout = gameTimeouts.get(key);
  if (!timeout) return false;
  clearTimeout(timeout);
  gameTimeouts.delete(key);
  return true;
}

export function clearAllGameTimeouts() {
  gameTimeouts.forEach(clearTimeout);
  gameTimeouts.clear();
}

export function scheduleMatchTimeout(matchId, callback, delay) {
  return scheduleGameTimeout(`match:${matchId}`, callback, delay);
}

export function clearMatchTimeout(matchId) {
  return clearGameTimeout(`match:${matchId}`);
}

export function resetTournamentState(target = state) {
  target.bracket = [];
  target.groups = null;
  target.swissTeams = null;
  target.tournamentPhase = null;
  target.readyPlayers = [];
  target.champion = null;
  target.currentRound = 0;
  target.roundComplete = false;
  target.roundReady = [];
  target.continueSeasonVotes = [];
}

export function resetGameState({ participants = [] } = {}) {
  clearAllGameTimeouts();
  const nextState = createInitialGameState({ participants });

  Object.keys(state).forEach(key => delete state[key]);
  Object.assign(state, nextState);
  return state;
}

export function prepareNewGame(participants = state.participants) {
  const activeParticipants = participants.map(participant => ({
    ...participant,
    roster: [],
    isBot: Boolean(participant.isBot),
  }));

  resetGameState({ participants: activeParticipants });
  state.phase = 'cards';
  state.seasonRound = 1;

  activeParticipants.forEach(participant => {
    const { id } = participant;
    state.cardCollections[id] = {};
    state.activeLineups[id] = {};
    state.pendingPacks[id] = 1;
    state.lastOpenedPack[id] = [];
    state.starterPackClaimed[id] = false;
    state.economy[id] = 100;
    state.lockedCards[id] = [];
  });

  return state;
}
