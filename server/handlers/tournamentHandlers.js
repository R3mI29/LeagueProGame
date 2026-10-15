import {
  state as defaultState,
  clearGameTimeout,
  clearMatchTimeout,
  resetTournamentState,
  scheduleGameTimeout,
} from '../state/gameState.js';
import { EVENTS } from '../../src/constants/seasonConfig.js';
import { GAMES_TO_WIN } from '../config/constants.js';
import { advanceTeam, findMatchById, getAliveHumans, isBotCheck } from '../services/playerService.js';
import {
  awardSeasonRewards,
  buildPlayoffsFromGroups,
  buildPlayoffsFromSwiss,
  startCurrentEvent,
} from '../services/tournamentService.js';
import {
  finalizeMatch,
  recordCompletedGame,
  simulateGame,
  startAllBotMatchesInCurrentRound,
  tryStartMatch,
} from '../services/matchService.js';

export function registerTournamentHandlers(io, socket, {
  state = defaultState,
} = {}) {
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

  socket.on('start-next-event', () => { if (state.phase === 'season_hub') startCurrentEvent(io); });
}
