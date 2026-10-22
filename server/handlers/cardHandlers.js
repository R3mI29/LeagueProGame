import { state as defaultState } from '../state/gameState.js';
import { ORDERED_ROLES } from '../../src/constants/roles.js';
import { PACK_TYPES, openPack, openStarterPack, getCardById } from '../services/cardService.js';
import { SELL_PRICES } from '../config/constants.js';
import { isBotCheck } from '../services/playerService.js';
import { startCardTournament } from '../services/tournamentService.js';

export function registerCardHandlers(io, socket, {
  state = defaultState,
} = {}) {
  socket.on('buy-pack', (packTypeId = 'standard') => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;
    
    if (!state.economy) state.economy = {};
    if (state.economy[id] === undefined) state.economy[id] = 0;

    const isStarter = !state.starterPackClaimed[id];
    const packConfig = PACK_TYPES[packTypeId] || PACK_TYPES.standard;
    const PACK_PRICE = packConfig.price;

    if (!isStarter) {
      if (state.economy[id] < PACK_PRICE) return; 
      state.economy[id] -= PACK_PRICE;
    }

    const cards = isStarter ? openStarterPack() : openPack(packTypeId);
    cards.sort((a, b) => (a.overall || a.rating || 0) - (b.overall || b.rating || 0));

    const openedCardsWithContracts = [];
    cards.forEach(c => {
      let contractToAdd = isStarter ? 'LIFETIME' : (Math.random() < 0.02 ? 'LIFETIME' : Math.floor(Math.random() * 9) + 1);
      openedCardsWithContracts.push({ id: c.id, contractAdded: contractToAdd });
    });

    state.starterPackClaimed[id] = true;
    if (!state.pendingPackResults) state.pendingPackResults = {};
    state.pendingPackResults[id] = openedCardsWithContracts;
    state.lastOpenedPack[id] = openedCardsWithContracts;
    io.emit('draft-update', state);
  });

  socket.on('close-pack', () => {
    if (state.phase === 'cards') {
      const id = socket.id;
      if (state.pendingPackResults && state.pendingPackResults[id]) {
        if (!state.cardCollections[id]) state.cardCollections[id] = {};
        state.pendingPackResults[id].forEach(item => {
          const cardId = item.id;
          const contractToAdd = item.contractAdded;
          let currentContract = state.cardCollections[id][cardId] || 0;
          if (currentContract === 'LIFETIME' || contractToAdd === 'LIFETIME') state.cardCollections[id][cardId] = 'LIFETIME';
          else state.cardCollections[id][cardId] = currentContract + contractToAdd;
        });
        delete state.pendingPackResults[id];
      }
      if (state.lastOpenedPack[id]) state.lastOpenedPack[id] = [];
      io.emit('draft-update', state);
    }
  });

  socket.on('toggle-lock-card', (cardId) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    
    if (!state.lockedCards) state.lockedCards = {};
    if (!state.lockedCards[id]) state.lockedCards[id] = [];

    const locked = state.lockedCards[id];
    if (locked.includes(cardId)) {
      state.lockedCards[id] = locked.filter(cId => cId !== cardId);
    } else {
      state.lockedCards[id].push(cardId);
    }
    
    io.emit('draft-update', state);
  });

  socket.on('sell-all-unlocked', () => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    const collection = state.cardCollections[id];
    const lineup = state.activeLineups[id] || {};
    const lockedCards = state.lockedCards?.[id] || [];
    
    if (!collection) return;

    let totalEarned = 0;

    Object.keys(collection).forEach(cardId => {
      // Vérifier si la carte est vendable
      if (
        collection[cardId] !== 0 && 
        collection[cardId] !== 'LIFETIME' && 
        !Object.values(lineup).includes(cardId) &&
        !lockedCards.includes(cardId)
      ) {
        const card = getCardById(cardId);
        if (card) {
          const price = SELL_PRICES[card.rarity] ?? 5;
          totalEarned += price;
          delete collection[cardId]; // Retirer la carte de la collection
        }
      }
    });

    if (totalEarned > 0) {
      if (state.economy[id] === undefined) state.economy[id] = 0;
      state.economy[id] += totalEarned;
    }

    io.emit('draft-update', state);
  });

  socket.on('sell-card', (cardId) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    const collection = state.cardCollections[id];
    if (!collection || collection[cardId] === undefined || collection[cardId] === 0 || collection[cardId] === 'LIFETIME') return;

    const lineup = state.activeLineups[id] || {};
    if (Object.values(lineup).includes(cardId)) return;

    const card = getCardById(cardId);
    if (!card) return;

    const price = SELL_PRICES[card.rarity] ?? 5;

    delete collection[cardId];
    if (state.economy[id] === undefined) state.economy[id] = 0;
    state.economy[id] += price;
    io.emit('draft-update', state);
  });

  socket.on('set-lineup-card', ({ role, cardId }) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!ORDERED_ROLES.includes(role)) return;
    const collection = state.cardCollections[id];
    const contract = collection?.[cardId];
    if (contract === undefined || contract === 0) return; 
    
    const card = getCardById(cardId);
    if (!card || card.role !== role) return;

    if (!state.activeLineups[id]) state.activeLineups[id] = {};
    state.activeLineups[id][role] = cardId;
    io.emit('draft-update', state);
  });

  socket.on('set-prelocked-champion', ({ role, champId }) => {
    const id = socket.id;
    if (!ORDERED_ROLES.includes(role)) return;
    if (!state.prelockedChampions) state.prelockedChampions = {};
    if (!state.prelockedChampions[id]) state.prelockedChampions[id] = {};
    state.prelockedChampions[id][role] = champId;
    io.emit('draft-update', state);
  });

  socket.on('toggle-lineup-ready', () => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    const lineup = state.activeLineups[id] || {};
    const complete = ORDERED_ROLES.every(role => lineup[role]);

    if (!state.readyPlayers.includes(id)) {
      if (!complete) return; 
      state.readyPlayers.push(id);
    } else {
      state.readyPlayers = state.readyPlayers.filter(x => x !== id);
    }

    const humanCount = state.participants.filter(p => !isBotCheck(p)).length;
    if (state.readyPlayers.length === humanCount && humanCount > 0) startCardTournament(io);
    io.emit('draft-update', state);
  });
}
