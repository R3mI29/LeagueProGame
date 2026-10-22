// src/constants/initialState.js
// Source unique de l'état initial du jeu.
// Importé par useDraftSocket (client) ET par gameState.js (serveur)
// → toute nouvelle clé d'état n'est à ajouter qu'ici.

export function createInitialClientState() {
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
    recentPlacements: {},
    endOfYearRecap: null,
    awaitingResumeDecision: false,
    yearlyMeta: null,
    teamTactics: {},
    metaKnowledge: {},
    prelockedChampions: {},
    championMastery: {},
  };
}
