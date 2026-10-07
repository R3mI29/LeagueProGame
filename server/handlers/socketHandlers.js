import { state, matchTimeouts } from '../state/gameState.js';
import { EVENTS } from '../../src/constants/seasonConfig.js';
import { SECRET_UNLOCKS } from '../../src/constants/secretUnlocks.js';
import { ORDERED_ROLES } from '../../src/constants/roles.js';
import { PACK_TYPES, openPack, openStarterPack, getCardById } from '../services/cardService.js';
import { GAMES_TO_WIN } from '../config/constants.js';
import { isBotCheck, findMatchById, advanceTeam, getAliveHumans } from '../services/playerService.js';
import { startCardTournament, startCurrentEvent, awardSeasonRewards, buildPlayoffsFromGroups, buildPlayoffsFromSwiss } from '../services/tournamentService.js';
import { simulateGame, tryStartMatch, startAllBotMatchesInCurrentRound } from '../services/matchService.js';

export function registerSocketHandlers(io, socket) {
  
  socket.on('takeover-bot', (botId, newName, newTag, newLogo) => {
    const bot = state.participants.find(p => p.id === botId);
    if (!bot) return;

    const oldId = bot.id;
    const newId = socket.id;

    bot.id = newId; bot.name = newName.trim() || bot.name; bot.tag = newTag ? newTag.trim().toUpperCase() : bot.tag; bot.logo = newLogo || bot.logo; bot.isBot = false; 

    const transferMap = (mapObj) => {
        if (mapObj && mapObj[oldId] !== undefined) { mapObj[newId] = mapObj[oldId]; delete mapObj[oldId]; }
    };

    transferMap(state.cardCollections); transferMap(state.activeLineups); transferMap(state.economy); transferMap(state.cardStats); transferMap(state.lastOpenedPack); transferMap(state.starterPackClaimed); transferMap(state.lockedCards);
    if (state.seasonScores) transferMap(state.seasonScores);

    const replaceIdInMatch = (match) => {
        if (!match) return;
        if (match.ready && match.ready.includes(oldId)) match.ready = match.ready.map(id => id === oldId ? newId : id);
        if (match.dismissedBy && match.dismissedBy.includes(oldId)) match.dismissedBy = match.dismissedBy.map(id => id === oldId ? newId : id);
    };

    if (state.bracket) state.bracket.flat().forEach(replaceIdInMatch);
    if (state.groups) state.groups.forEach(g => g.matches.forEach(replaceIdInMatch));

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

  socket.on('join-lobby', (name, tag, logo) => {
    if (state.phase !== 'lobby' || state.participants.length >= 16) return;
    const cleanName = name.trim();
    const cleanTag = tag.trim().toUpperCase();
    if (state.participants.some(p => p.logo === logo && p.id !== socket.id)) return;
    
    if (!state.participants.find(p => p.id === socket.id)) {
      state.participants.push({ id: socket.id, name: cleanName, tag: cleanTag, logo: logo, roster: [] });
      io.emit('draft-update', state);
    }
  });

  socket.on('start-draft', () => {
    if (state.phase === 'lobby' && state.participants.length >= 1) {
        state.cardCollections = {}; state.activeLineups = {}; state.pendingPacks = {}; state.lastOpenedPack = {}; state.starterPackClaimed = {}; state.seasonRound = 1; state.continueSeasonVotes = []; state.seasonScores = null; state.economy = {}; state.cardStats = {}; state.globalSecrets = {}; state.readyPlayers = []; state.history = []; state.eventIndex = 0; state.year = 1; state.lockedCards = {};
        state.participants.forEach(p => {
          state.cardCollections[p.id] = {}; state.activeLineups[p.id] = {}; state.pendingPacks[p.id] = 1; state.lastOpenedPack[p.id] = []; state.starterPackClaimed[p.id] = false; state.economy[p.id] = 100; state.lockedCards[p.id] = [];
        });
        state.phase = 'cards';
        io.emit('draft-update', state);
    }
  });

  socket.on('skip-match', (matchId) => {
    const match = findMatchById(matchId);
    if (!match || (match.status !== 'simulating_events' && match.status !== 'simulating_result')) return;

    if (matchTimeouts[match.id]) {
      clearTimeout(matchTimeouts[match.id]); delete matchTimeouts[match.id];
    }

    if (match.winnerSidePending === 'A') match.scoreA++; else match.scoreB++;
    match.games.push({ gameNumber: match.games.length + 1, winnerSide: match.winnerSidePending, events: (match.currentEvents || []).concat(match.pendingEvents || []) });

    while (match.scoreA < GAMES_TO_WIN && match.scoreB < GAMES_TO_WIN) {
      const { winnerSide, events } = simulateGame(match, state);
      if (winnerSide === 'A') match.scoreA++; else match.scoreB++;
      match.games.push({ gameNumber: match.games.length + 1, winnerSide, events });
    }

    match.winner = match.scoreA === GAMES_TO_WIN ? match.teamA : match.teamB;
    match.status = 'finished';
    SECRET_UNLOCKS.forEach(secret => { secret.checkAndApply(match, state, io); });
    match.currentEvents = []; match.pendingEvents = [];
    
    if (state.tournamentPhase === 'swiss') {
      const wTeam = state.swissTeams.find(t => t.team.id === match.winner.id);
      const loser = match.winner.id === match.teamA.id ? match.teamB : match.teamA;
      const lTeam = state.swissTeams.find(t => t.team.id === loser.id);
      if (wTeam) wTeam.wins += 1; if (lTeam) lTeam.losses += 1;
      if (state.bracket[state.currentRound].every(m => m.status === 'finished')) state.roundComplete = true;
    } 
    else if (state.tournamentPhase === 'groups') {
      const loser = match.winner.id === match.teamA.id ? match.teamB : match.teamA;
      const groupIndex = match.id.match(/g(\d)/)[1];
      const group = state.groups[groupIndex];
      if (match.id.endsWith('m1')) { group.matches[2].teamA = match.winner; group.matches[3].teamA = loser; } 
      else if (match.id.endsWith('m2')) { group.matches[2].teamB = match.winner; group.matches[3].teamB = loser; } 
      else if (match.id.endsWith('winner')) { group.qualified.push(match.winner); group.matches[4].teamA = loser; } 
      else if (match.id.endsWith('loser')) { group.matches[4].teamB = match.winner; } 
      else if (match.id.endsWith('decider')) { group.qualified.push(match.winner); }
      if (state.groups.every(g => g.qualified.length === 2)) state.roundComplete = true;
    } 
    else {
      advanceTeam(match.winner, match.nextId, match.nextSlot);
      const loser = match.winner.id === match.teamA.id ? match.teamB : match.teamA;
      if (match.loserNextId) advanceTeam(loser, match.loserNextId, match.loserNextSlot);
      if (state.bracket[state.currentRound]?.every(m => m.status === 'finished') && !state.champion) state.roundComplete = true;
    }
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

      state.continueSeasonVotes = []; state.readyPlayers = []; state.champion = null; state.bracket = []; state.currentRound = 0; state.roundComplete = false; state.roundReady = []; state.seasonRound += 1; state.phase = 'cards';

      if (endOfYearRecap) {
         state.endOfYearRecap = endOfYearRecap;
         setTimeout(() => { state.endOfYearRecap = null; io.emit('draft-update', state); }, 16000);
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
    if (state.resetPlayers.includes(socket.id)) state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
    else state.resetPlayers.push(socket.id);

    const humanCount = state.participants.filter(p => !isBotCheck(p)).length;

    if (humanCount === 0 || state.resetPlayers.length >= humanCount) {
      state.participants = state.participants.filter(p => !isBotCheck(p)); state.participants.forEach(p => p.roster = []);
      state.phase = 'lobby'; state.bracket = []; state.champion = null; state.readyPlayers = []; state.resetPlayers = []; state.turnIndex = 0; state.currentRound = 0; state.roundComplete = false; state.roundReady = []; state.cardCollections = {}; state.activeLineups = {}; state.economy = {}; state.cardStats = {}; state.globalSecrets = {}; state.pendingPacks = {}; state.lastOpenedPack = {}; state.starterPackClaimed = {}; state.lockedCards = {}; state.seasonRound = 0; state.continueSeasonVotes = []; state.history = []; state.eventIndex = 0; state.year = 1; state.seasonScores = null; state.groups = null; state.swissTeams = null;
    }
    io.emit('draft-update', state);
  });

  socket.on('start-next-event', () => { if (state.phase === 'season_hub') startCurrentEvent(io); });

  socket.on('disconnect', () => {
    const player = state.participants.find(p => p.id === socket.id);
    const humansBefore = state.participants.filter(p => !isBotCheck(p)).length;

    if (player) {
        if (state.phase === 'lobby') {
            state.participants = state.participants.filter(p => p.id !== socket.id);
            delete state.cardCollections[socket.id]; delete state.activeLineups[socket.id]; delete state.economy[socket.id]; delete state.cardStats?.[socket.id]; delete state.lastOpenedPack[socket.id]; delete state.starterPackClaimed[socket.id];
        } else {
            player.isBot = true; 
            state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id); state.roundReady = state.roundReady.filter(id => id !== socket.id); state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id); state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);
        }
    }

    const humansAfter = state.participants.filter(p => !isBotCheck(p)).length;

    if (humansAfter === 0 && humansBefore > 0 && state.phase !== 'lobby') {
        state.phase = 'lobby'; state.champion = null; state.participants = []; state.resetPlayers = []; state.readyPlayers = []; state.roundReady = []; state.cardCollections = {}; state.activeLineups = {}; state.economy = {}; state.cardStats = {}; state.globalSecrets = {}; state.pendingPacks = {}; state.lastOpenedPack = {}; state.starterPackClaimed = {}; state.seasonRound = 0; state.continueSeasonVotes = []; state.history = []; state.eventIndex = 0; state.year = 1; state.seasonScores = null; state.bracket = []; state.groups = null; state.swissTeams = null;
    }
    io.emit('draft-update', state);
  });
}