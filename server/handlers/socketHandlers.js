import {
  clearGameTimeout,
  clearMatchTimeout,
  prepareNewGame,
  resetGameState,
  resetTournamentState,
  scheduleGameTimeout,
  state,
} from '../state/gameState.js';
import { EVENTS } from '../../src/constants/seasonConfig.js';
import { ORDERED_ROLES } from '../../src/constants/roles.js';
import { PACK_TYPES, openPack, openStarterPack, getCardById } from '../services/cardService.js';
import { GAMES_TO_WIN } from '../config/constants.js';
import { isBotCheck, findMatchById, advanceTeam, getAliveHumans } from '../services/playerService.js';
import {
  assignHost,
  clearPlayerSessions,
  createPlayerSession,
  ensureConnectedHost,
  getConnectedPlayers,
  invalidatePlayerSession,
  reconnectPlayer,
  transferPlayerIdentity,
} from '../services/playerSessionService.js';
import { startCardTournament, startCurrentEvent, awardSeasonRewards, buildPlayoffsFromGroups, buildPlayoffsFromSwiss } from '../services/tournamentService.js';
import {
  finalizeMatch,
  recordCompletedGame,
  simulateGame,
  startAllBotMatchesInCurrentRound,
  tryStartMatch,
} from '../services/matchService.js';
import { SKINS, SKIN_BY_ID, canUseSkin, grantSkin, revokeSkin } from '../../src/constants/teamSkins.js';

import { rm } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_SAVES_DIRECTORY } from '../services/gamePersistenceService.js';

const defaultGameManager = {
  async archive() {
    return { saveId: null };
  },
  async list() {
    return [];
  },
  async load() {
    return { restored: false };
  },
};

export function registerSocketHandlers(io, socket, { gameManager = defaultGameManager } = {}) {
  socket.emit('draft-update', state);

  const getCurrentPlayer = () => state.participants.find(participant => participant.id === socket.id);
  const isCurrentPlayerHost = () => Boolean(getCurrentPlayer()?.isHost);

  socket.on('reconnect-player', (token, acknowledge = () => {}) => {
    const hadConnectedPlayers = getConnectedPlayers(state).length > 0;
    const result = reconnectPlayer(state, token, socket.id);
    if (result.ok) {
      if (!hadConnectedPlayers) assignHost(state, socket.id);
      else ensureConnectedHost(state, socket.id);
    }
    acknowledge(result);
    if (result.ok) io.emit('draft-update', state);
  });
  
  socket.on('takeover-bot', (botId, newName, newTag, newLogo, acknowledge = () => {}) => {
    const bot = state.participants.find(p => p.id === botId);
    if (!bot || !isBotCheck(bot)) return acknowledge({ ok: false, error: "Cette équipe n'est pas disponible." });
    if (state.participants.some(participant => participant.id === socket.id)) {
      return acknowledge({ ok: false, error: "Vous contrôlez déjà une équipe." });
    }

    const oldId = bot.id;
    const newId = socket.id;

    transferPlayerIdentity(state, oldId, newId);
    bot.id = newId;
    bot.name = typeof newName === 'string' && newName.trim() ? newName.trim() : bot.name;
    bot.tag = typeof newTag === 'string' && newTag.trim() ? newTag.trim().toUpperCase() : bot.tag;
    bot.logo = typeof newLogo === 'string' && newLogo ? newLogo : bot.logo;
    bot.isBot = false;
    bot.isDisconnected = false;

    const playerToken = createPlayerSession(newId);
    ensureConnectedHost(state, newId);
    acknowledge({ ok: true, playerToken });
    io.emit('draft-update', state);
  });

  socket.on('equip-skin', (skinId) => {
    if (!SKIN_BY_ID[skinId] || !canUseSkin(state, socket.id, skinId)) return;
    if (!state.teamSkins) state.teamSkins = {};
    state.teamSkins[socket.id] = { ...(state.teamSkins[socket.id] || {}), equipped: skinId };
    io.emit('draft-update', state);
  });

  socket.on('dev-skin', ({ action, skinId } = {}) => {
    const valid = SKIN_BY_ID[skinId];

    if (action === 'unlock' && valid) grantSkin(state, socket.id, skinId);
    else if (action === 'lock' && valid) revokeSkin(state, socket.id, skinId);
    else if (action === 'unlock-all') SKINS.forEach(s => grantSkin(state, socket.id, s.id));
    else if (action === 'lock-all') SKINS.forEach(s => revokeSkin(state, socket.id, s.id));
    else return;

    io.emit('draft-update', state);
  });

  socket.on('dev-give-card', (cardId) => {
    const id = socket.id;
    if (!state.cardCollections[id]) state.cardCollections[id] = {};
    let currentContract = state.cardCollections[id][cardId] || 0;
    if (currentContract !== 'LIFETIME') state.cardCollections[id][cardId] = currentContract + 5; 
    io.emit('draft-update', state);
  });

  socket.on('dev-give-money', (amount) => {
    const id = socket.id;
    if (!state.economy) state.economy = {};
    if (state.economy[id] === undefined) state.economy[id] = 0;
    state.economy[id] += amount;
    io.emit('draft-update', state);
  });

  socket.on('dev-set-event', (eventIndex) => {
    if (eventIndex >= 0 && eventIndex < EVENTS.length) { state.eventIndex = eventIndex; io.emit('draft-update', state); }
  });

  socket.on('join-lobby', (name, tag, logo, acknowledge = () => {}) => {
    if (state.phase !== 'lobby') return acknowledge({ ok: false, error: "La saison a déjà commencé." });
    if (state.participants.length >= 16) return acknowledge({ ok: false, error: "Le lobby est complet." });
    if (typeof name !== 'string' || typeof tag !== 'string' || typeof logo !== 'string') {
      return acknowledge({ ok: false, error: "Les informations de l'équipe sont invalides." });
    }
    const cleanName = name.trim();
    const cleanTag = tag.trim().toUpperCase();
    if (!cleanName || cleanName.length > 40) return acknowledge({ ok: false, error: "Le nom doit contenir entre 1 et 40 caractères." });
    if (cleanTag.length < 2 || cleanTag.length > 4) return acknowledge({ ok: false, error: "Le TAG doit contenir entre 2 et 4 caractères." });
    if (!/^\/?equipes\/[a-zA-Z0-9._-]+$/.test(logo)) {
      return acknowledge({ ok: false, error: "Cette identité visuelle n'existe pas." });
    }
    if (state.participants.some(p => p.logo === logo && p.id !== socket.id)) {
      return acknowledge({ ok: false, error: "Cette équipe est déjà utilisée." });
    }
    
    let playerToken = null;
    if (!state.participants.find(p => p.id === socket.id)) {
      state.participants.push({
        id: socket.id,
        name: cleanName,
        tag: cleanTag,
        logo: logo,
        roster: [],
        isHost: false,
        isDisconnected: false,
      });
      playerToken = createPlayerSession(socket.id);
      ensureConnectedHost(state, socket.id);
      io.emit('draft-update', state);
    }
    acknowledge({ ok: true, playerToken });
  });

  socket.on('resume-game', (acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut reprendre la partie." });
    state.awaitingResumeDecision = false;
    io.emit('draft-update', state);
    acknowledge({ ok: true });
  });

  socket.on('list-game-saves', async (acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut consulter les sauvegardes." });
    try {
      acknowledge({ ok: true, saves: await gameManager.list() });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on('save-game', async (label, acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut sauvegarder la partie." });
    try {
      const save = await gameManager.archive(label || `Saison ${state.year}`);
      acknowledge({ ok: true, save });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });
  
  socket.on('delete-game-save', async (saveId, callback) => {
    if (!isCurrentPlayerHost()) {
      if (callback) callback({ ok: false, error: "Seul l'hôte peut supprimer les sauvegardes." });
      return;
    }
    try {
      // Vérification de sécurité simple pour éviter de supprimer n'importe quoi
      if (!/^[a-zA-Z0-9._-]+\.json$/.test(saveId)) {
        throw new Error('ID de sauvegarde invalide');
      }
      const filePath = path.join(DEFAULT_SAVES_DIRECTORY, saveId);
      await rm(filePath, { force: true });
      if (callback) callback({ ok: true });
    } catch (error) {
      console.error('Erreur lors de la suppression de la sauvegarde:', error);
      if (callback) callback({ ok: false, error: 'Impossible de supprimer la sauvegarde.' });
    }
  });

  socket.on('new-game', async (acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut créer une nouvelle partie." });
    try {
      await gameManager.archive(`Archive saison ${state.year}`);
      clearPlayerSessions();
      resetGameState();
      io.emit('game-reset');
      io.emit('draft-update', state);
      acknowledge({ ok: true });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on('load-game', async ({ saveId, playerToken } = {}, acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut charger une partie." });
    try {
      const result = await gameManager.load(saveId);
      const reconnectResult = reconnectPlayer(state, playerToken, socket.id);
      if (reconnectResult.ok) {
        assignHost(state, socket.id);
      }
      state.awaitingResumeDecision = false;
      io.emit('game-loaded');
      io.emit('draft-update', state);
      acknowledge({
        ok: true,
        result,
        reconnected: reconnectResult.ok,
      });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on('leave-game', (acknowledge = () => {}) => {
    const player = getCurrentPlayer();
    if (!player) return acknowledge({ ok: false, error: "Vous ne contrôlez aucune équipe." });

    invalidatePlayerSession(player.id);
    player.isHost = false;

    if (state.phase === 'lobby') {
      state.participants = state.participants.filter(participant => participant.id !== player.id);
      [
        state.cardCollections,
        state.activeLineups,
        state.economy,
        state.cardStats,
        state.lastOpenedPack,
        state.starterPackClaimed,
        state.lockedCards,
        state.pendingPacks,
        state.pendingPackResults,
        state.teamSkins,
        state.seasonScores,
      ].forEach(map => {
        if (map) delete map[player.id];
      });
    } else {
      player.isBot = true;
      player.isDisconnected = false;
      player.isPermanentBot = true;
    }

    const nextHost = ensureConnectedHost(state);
    if (!nextHost) state.awaitingResumeDecision = true;
    socket.emit('player-session-cleared');
    io.emit('draft-update', state);
    acknowledge({ ok: true });
  });

  socket.on('start-draft', () => {
    if (state.phase === 'lobby' && state.participants.length >= 1) {
      prepareNewGame(state.participants);
      io.emit('draft-update', state);
    }
  });

  socket.on('skip-match', (matchId) => {
    const match = findMatchById(matchId);
    if (!match || (match.status !== 'simulating_events' && match.status !== 'simulating_result')) return;

    clearMatchTimeout(match.id);

    const currentGameEvents = (match.currentEvents || []).concat(match.pendingEvents || []);
    recordCompletedGame(match, match.winnerSidePending, currentGameEvents);

    while (match.scoreA < GAMES_TO_WIN && match.scoreB < GAMES_TO_WIN) {
      const { winnerSide, events } = simulateGame(match, state);
      recordCompletedGame(match, winnerSide, events);
    }

    finalizeMatch(match, io);
    io.emit('draft-update', state);
  });

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
          let price = 5; 
          if (card.rarity === 'Rare') price = 15;
          else if (card.rarity === 'Épique') price = 100;
          else if (card.rarity === 'Légendaire') price = 500;
          else if (card.rarity === 'WANTED') price = 1400;

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

    let price = 5; 
    if (card.rarity === 'Rare') price = 15;
    else if (card.rarity === 'Épique') price = 100;
    else if (card.rarity === 'Légendaire') price = 500;
    else if (card.rarity === 'WANTED') price = 1400;

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

  socket.on('continue-season', () => {
    if (state.phase !== 'simulation' || !state.champion) return;

    if (state.continueSeasonVotes.includes(socket.id)) state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);
    else state.continueSeasonVotes.push(socket.id);

    const allHumans = state.participants.filter(p => !isBotCheck(p));
    
    if (state.continueSeasonVotes.length === allHumans.length && allHumans.length > 0) {
      if (!state.cardStats) state.cardStats = {};
      allHumans.forEach(p => {
        if (!state.cardStats[p.id]) state.cardStats[p.id] = {};
        const lineup = state.activeLineups[p.id];
        if (lineup) {
          Object.values(lineup).forEach(cardId => {
            if (cardId) state.cardStats[p.id][cardId] = (state.cardStats[p.id][cardId] || 0) + 1;
          });
        }
      });

      awardSeasonRewards(); 
      state.history.push({ year: state.year, eventId: EVENTS[state.eventIndex]?.id || `Event ${state.eventIndex}`, winnerName: state.champion.name });
      
      allHumans.forEach(p => {
        const lineup = state.activeLineups[p.id];
        if (lineup) {
          Object.keys(lineup).forEach(role => {
            const cardId = lineup[role];
            let currentContract = state.cardCollections[p.id][cardId];
            if (currentContract !== 'LIFETIME' && typeof currentContract === 'number') {
              state.cardCollections[p.id][cardId] = Math.max(0, currentContract - 1);
              if (state.cardCollections[p.id][cardId] === 0) delete lineup[role];
            }
          });
        }
      });

      let endOfYearRecap = null;
      state.eventIndex += 1;

      if (state.eventIndex >= EVENTS.length) { 
         const currentYearHistory = state.history.filter(h => h.year === state.year);
         const wonAll = currentYearHistory.length === EVENTS.length && currentYearHistory.every(h => h.winnerName === currentYearHistory[0].winnerName);
         let goldenRoadData = null;
         if (wonAll) {
            const winnerName = currentYearHistory[0].winnerName;
            if (!state.globalSecrets) state.globalSecrets = {};
            if (!state.globalSecrets['golden-road-achieved']) {
                state.globalSecrets['golden-road-achieved'] = true; 
                const winnerTeam = state.participants.find(p => p.name === winnerName);
                let texteRecompense = "";
                if (winnerTeam && !isBotCheck(winnerTeam)) {
                    if (!state.cardCollections[winnerTeam.id]) state.cardCollections[winnerTeam.id] = {};
                    state.cardCollections[winnerTeam.id]['golden-road'] = 1; 
                    texteRecompense = " \nRÉCOMPENSE ABSOLUE DÉBLOQUÉE.";
                } else texteRecompense = " \nUN BOT A VOLÉ CE SUCCÈS UNIQUE !";

                goldenRoadData = { title: "THE GOLDEN ROAD", description: `L'exploit parfait. ${winnerName} a remporté tous les trophées de l'année ${state.year} sans en laisser un seul.${texteRecompense}`, image: '/cardsImg/others/golden_road.jpg' };
            }
         }
         endOfYearRecap = { year: state.year, history: currentYearHistory, goldenRoadSecret: goldenRoadData };
         state.eventIndex = 0; state.year += 1; 
      }

      resetTournamentState();
      state.seasonRound += 1;
      state.phase = 'cards';

      if (endOfYearRecap) {
        clearGameTimeout('season-recap');
        state.endOfYearRecap = endOfYearRecap;
        scheduleGameTimeout('season-recap', () => {
          state.endOfYearRecap = null;
          io.emit('draft-update', state);
        }, 16000);
      }
    }
    io.emit('draft-update', state);
  });

  socket.on('toggle-ready', () => {
    if (state.phase === 'tournament' || state.phase === 'simulation') {
      if (state.readyPlayers.includes(socket.id)) state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      else state.readyPlayers.push(socket.id);

      const requiredHumans = getAliveHumans();
      if (requiredHumans.length > 0 && requiredHumans.every(id => state.readyPlayers.includes(id))) {
        state.readyPlayers = []; 
        let hasHumanInWave = false; 

        if (state.tournamentPhase === 'groups') {
          if (state.roundComplete) {
            buildPlayoffsFromGroups();
            state.tournamentPhase = 'bracket'; state.roundComplete = false; state.phase = 'tournament'; 
          } else {
            state.phase = 'simulation'; 
            let allFinished = true;
            state.groups.forEach(group => {
              group.matches.forEach(match => {
                if (match.status === 'pending' && match.teamA && match.teamB) {
                  match.waveActive = true; allFinished = false;
                  if (!isBotCheck(match.teamA) || !isBotCheck(match.teamB)) hasHumanInWave = true;
                } else if (match.status.startsWith('simulating') || (match.status === 'pending' && match.waveActive)) allFinished = false;
              });
            });
            if (allFinished && !state.champion) state.roundComplete = true;
            if (!hasHumanInWave && !state.roundComplete) startAllBotMatchesInCurrentRound(io);
          }
        } 
        else {
          state.phase = 'simulation'; state.currentRound = state.currentRound || 0;
          let allFinished = true;
          state.bracket[state.currentRound].forEach(match => {
             if (match.status === 'pending' && match.teamA && match.teamB) {
              match.waveActive = true; allFinished = false;
              if (!isBotCheck(match.teamA) || !isBotCheck(match.teamB)) hasHumanInWave = true;
            } else if (match.status.startsWith('simulating') || (match.status === 'pending' && match.waveActive)) allFinished = false;
          });
          if (allFinished && !state.champion) state.roundComplete = true;
          if (!hasHumanInWave && !state.roundComplete) startAllBotMatchesInCurrentRound(io);
        }
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('match-ready', (matchId) => {
    const match = findMatchById(matchId);
    if (!match || match.status !== 'pending') return;
    if (!match.ready.includes(socket.id)) match.ready.push(socket.id);
    
    tryStartMatch(match, io);
    if (match.status.startsWith('simulating')) startAllBotMatchesInCurrentRound(io);
  });

  socket.on('dismiss-match', (matchId) => {
    const match = findMatchById(matchId);
    if (match && !match.dismissedBy.includes(socket.id)) {
      match.dismissedBy.push(socket.id); io.emit('draft-update', state);
    }
  });

  socket.on('advance-round', () => {
    if (state.phase === 'simulation' && state.roundComplete) {
      const allHumans = state.participants.filter(p => !isBotCheck(p)).map(p => p.id);
      if (allHumans.includes(socket.id)) {
        if (!state.roundReady.includes(socket.id)) state.roundReady.push(socket.id);
      }

      const requiredHumans = getAliveHumans();
      if (requiredHumans.length > 0 && requiredHumans.every(id => state.roundReady.includes(id))) {
        state.roundComplete = false; state.roundReady = []; state.phase = 'tournament'; 

        if (state.tournamentPhase === 'swiss') {
          state.currentRound++;
          if (state.currentRound >= 5) {
            state.champion = null; buildPlayoffsFromSwiss(); state.tournamentPhase = 'bracket';
          } else {
            const nextMatches = state.bracket[state.currentRound];
            const activeTeams = state.swissTeams.filter(t => t.wins < 3 && t.losses < 3);
            const pools = {};
            activeTeams.forEach(t => { const key = `${t.wins}-${t.losses}`; if (!pools[key]) pools[key] = []; pools[key].push(t); });
            for (const poolKey in pools) {
              const poolMatches = nextMatches.filter(m => m.pool === poolKey);
              const teamsInPool = pools[poolKey].sort(() => 0.5 - Math.random());
              for (let i = 0; i < poolMatches.length; i++) { poolMatches[i].teamA = teamsInPool[i*2].team; poolMatches[i].teamB = teamsInPool[i*2+1].team; }
            }
          }
        } 
        else {
          state.currentRound++;
          state.bracket[state.currentRound].forEach(match => {
            if (match.teamA && !match.teamB) { match.status = 'finished'; match.winner = match.teamA; match.scoreA = GAMES_TO_WIN; match.scoreB = 0; advanceTeam(match.winner, match.nextId, match.nextSlot); }
            else if (!match.teamA && !match.teamB) { match.status = 'finished'; match.winner = null; }
          });
          const allFinished = state.bracket[state.currentRound].every(m => m.status === 'finished');
          if (allFinished && !state.champion) state.roundComplete = true;
        }
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('toggle-reset', () => {
    if (!state.participants.some(participant => participant.id === socket.id && !isBotCheck(participant))) return;

    if (state.resetPlayers.includes(socket.id)) state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
    else state.resetPlayers.push(socket.id);

    const humanCount = state.participants.filter(p => !isBotCheck(p)).length;

    if (humanCount === 0 || state.resetPlayers.length >= humanCount) {
      const participants = state.participants
        .filter(participant => !participant.id.startsWith('bot-'))
        .map(participant => ({
          ...participant,
          roster: [],
          isBot: Boolean(participant.isDisconnected),
        }));
      resetGameState({ participants });
    }
    io.emit('draft-update', state);
  });

  socket.on('start-next-event', () => { if (state.phase === 'season_hub') startCurrentEvent(io); });

  socket.on('disconnect', () => {
    const player = state.participants.find(p => p.id === socket.id);

    if (player) {
      player.isBot = true;
      player.isDisconnected = true;
      state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      state.roundReady = state.roundReady.filter(id => id !== socket.id);
      state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
      state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);
    }
    const nextHost = ensureConnectedHost(state);
    if (!nextHost && state.participants.length > 0) {
      state.awaitingResumeDecision = true;
    }
    if (state.phase === 'simulation') startAllBotMatchesInCurrentRound(io);
    io.emit('draft-update', state);
  });
}