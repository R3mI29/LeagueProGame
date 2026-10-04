// server/state/gameState.js

export const state = {
  phase: 'lobby', 
  participants: [], 
  bracket: [], 
  readyPlayers: [], 
  resetPlayers: [], 
  champion: null,
  currentRound: 0, 
  roundComplete: false, 
  roundReady: [],
  cardCollections: {}, 
  activeLineups: {}, 
  economy: {}, 
  cardStats: {}, 
  globalSecrets: {}, 
  lastOpenedPack: {}, 
  starterPackClaimed: {}, 
  seasonRound: 0, 
  continueSeasonVotes: [],
  year: 1, 
  eventIndex: 0, 
  history: []    
};

export const matchTimeouts = {};