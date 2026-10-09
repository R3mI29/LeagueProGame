import { state, matchTimeouts } from '../state/gameState.js';
import { GAMES_TO_WIN, SIMULATION_DELAYS } from '../config/constants.js';
import { CUSTOM_CARD_EVENTS } from '../../src/constants/cardEvents.js';
import { SECRET_UNLOCKS } from '../../src/constants/secretUnlocks.js';
import { isBotCheck, advanceTeam } from './playerService.js';
import { getSynergy } from '../../src/constants/synergy.js';

export function getTeamRating(team) {
  if (!team || !team.roster || team.roster.length === 0) return 0;
  return Math.round(team.roster.reduce((acc, p) => acc + p.rating, 0) / team.roster.length);
}

export function simulateGame(match, state) {
  const teamA = match.teamA;
  const teamB = match.teamB;
  let ratingA = getTeamRating(teamA) + getSynergy(teamA.roster).bonus + (match.boBuffA || 0);
  let ratingB = getTeamRating(teamB) + getSynergy(teamB.roster).bonus + (match.boBuffB || 0);
  const triggeredEvents = [];
  const ALL_EVENTS = [...CUSTOM_CARD_EVENTS];

  for (const event of ALL_EVENTS) {
    if (event.uniquePerBO && match.triggeredUniqueEvents.includes(event.id)) continue;
    const results = event.apply(match, teamA, teamB, match.scoreA, match.scoreB, state, triggeredEvents);
    if (!results) continue;
    if (event.uniquePerBO) match.triggeredUniqueEvents.push(event.id);
    const resultsArray = Array.isArray(results) ? results : [results];

    for (const result of resultsArray) {
      if (result.persistentBO) {
        if (result.side === 'A') match.boBuffA = (match.boBuffA || 0) + result.ratingDelta;
        else match.boBuffB = (match.boBuffB || 0) + result.ratingDelta;
      }
      const multiplier = result.targetRoles ? result.targetRoles.length : 5;
      const trueImpact = (result.ratingDelta * multiplier) / 5;
      if (result.side === 'A') ratingA += trueImpact;
      else ratingB += trueImpact;
      
      triggeredEvents.push({ 
        label: result.label, side: result.side, ratingDelta: result.ratingDelta,
        targetRoles: result.targetRoles, persistentBO: result.persistentBO, image: result.image
      });
    }
  }

  if (triggeredEvents.length === 0) {
    triggeredEvents.push({ label: "Phase de lane très tactique, les deux équipes s'observent...", side: null, ratingDelta: 0 });
  }

  const probA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 11));
  const winnerSide = Math.random() < probA ? 'A' : 'B';
  return { winnerSide, events: triggeredEvents };
}

export function playNextGame(match, io) {
  match.status = 'simulating_events'; 
  match.currentEvents = []; 
  match.lastGameEvents = []; 
  
  const { winnerSide, events } = simulateGame(match, state);
  match.pendingEvents = events; 
  match.winnerSidePending = winnerSide;
  
  io.emit('draft-update', state);

  const isBotOnly = isBotCheck(match.teamA) && isBotCheck(match.teamB);
  const INIT_DELAY = isBotOnly ? SIMULATION_DELAYS.INIT_BOT : SIMULATION_DELAYS.INIT_HUMAN; 
  const EVENT_READ_DELAY = isBotOnly ? SIMULATION_DELAYS.EVENT_BOT : SIMULATION_DELAYS.EVENT_HUMAN; 
  const NO_EVENT_DELAY = isBotOnly ? 250 : SIMULATION_DELAYS.EVENT_NO_ACTION; 

  const processNextEvent = () => {
    if (match.pendingEvents && match.pendingEvents.length > 0) {
      const evsToPush = [];
      let isGenericEvent = false;
      
      while (match.pendingEvents.length > 0) {
        const ev = match.pendingEvents.shift();
        evsToPush.push(ev);
        if (ev.label) {
          if (ev.label === "Phase de lane très tactique, les deux équipes s'observent...") isGenericEvent = true;
          while (match.pendingEvents.length > 0 && !match.pendingEvents[0].label) evsToPush.push(match.pendingEvents.shift());
          break; 
        }
      }

      match.currentEvents.push(...evsToPush);
      io.emit('draft-update', state);
      
      const delay = isBotOnly ? SIMULATION_DELAYS.EVENT_BOT : (isGenericEvent ? NO_EVENT_DELAY : EVENT_READ_DELAY);
      matchTimeouts[match.id] = setTimeout(processNextEvent, delay);
      
    } else {
      match.status = 'simulating_result';
      io.emit('draft-update', state);
      
      const hasAnyRealEvent = match.currentEvents.some(e => e.label && e.label !== "Phase de lane très tactique, les deux équipes s'observent...");
      const RESULT_DELAY = isBotOnly ? SIMULATION_DELAYS.RESULT_BOT : (hasAnyRealEvent ? SIMULATION_DELAYS.RESULT_HUMAN_ACTION : SIMULATION_DELAYS.RESULT_HUMAN_QUIET); 

      matchTimeouts[match.id] = setTimeout(() => {
        if (match.winnerSidePending === 'A') match.scoreA++; else match.scoreB++;
        match.games.push({ gameNumber: match.games.length + 1, winnerSide: match.winnerSidePending, events: match.currentEvents });
        match.lastGameEvents = match.currentEvents;
        match.currentEvents = []; match.pendingEvents = [];
        
        if (match.scoreA === GAMES_TO_WIN || match.scoreB === GAMES_TO_WIN) {
          match.winner = match.scoreA === GAMES_TO_WIN ? match.teamA : match.teamB;
          match.status = 'finished';
          
          SECRET_UNLOCKS.forEach(secret => secret.checkAndApply(match, state, io));
          
          if (state.tournamentPhase === 'swiss') {
            const wTeam = state.swissTeams.find(t => t.team.id === match.winner.id);
            const loser = match.winner.id === match.teamA.id ? match.teamB : match.teamA;
            const lTeam = state.swissTeams.find(t => t.team.id === loser.id);
            if (wTeam) wTeam.wins += 1;
            if (lTeam) lTeam.losses += 1;
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
        } else {
          io.emit('draft-update', state);
          const GAME_GAP_MS = isBotOnly ? SIMULATION_DELAYS.GAP_BOT : SIMULATION_DELAYS.GAP_HUMAN; 
          matchTimeouts[match.id] = setTimeout(() => playNextGame(match, io), GAME_GAP_MS);
        }
      }, RESULT_DELAY);
    }
  };
  
  matchTimeouts[match.id] = setTimeout(processNextEvent, INIT_DELAY);
}

export function tryStartMatch(match, io) {
  if (!match || match.status !== 'pending' || !match.teamA || !match.teamB) return;
  if (isBotCheck(match.teamA) && !match.ready.includes(match.teamA.id)) match.ready.push(match.teamA.id);
  if (isBotCheck(match.teamB) && !match.ready.includes(match.teamB.id)) match.ready.push(match.teamB.id);

  if (match.ready.length === 2) {
    match.scoreA = 0; match.scoreB = 0; match.games = []; match.lastGameEvents = []; match.triggeredUniqueEvents = []; match.boBuffA = 0; match.boBuffB = 0; 
    playNextGame(match, io);
  }
}

export function startAllBotMatchesInCurrentRound(io) {
  const matchesToStart = [];
  if (state.tournamentPhase === 'groups') {
    state.groups.forEach(g => {
      g.matches.forEach(m => {
        if (m.waveActive && m.status === 'pending' && m.teamA && m.teamB && isBotCheck(m.teamA) && isBotCheck(m.teamB)) matchesToStart.push(m);
      });
    });
  } else if (state.bracket && state.bracket[state.currentRound]) {
    state.bracket[state.currentRound].forEach(m => {
      if (m.waveActive && m.status === 'pending' && m.teamA && m.teamB && isBotCheck(m.teamA) && isBotCheck(m.teamB)) matchesToStart.push(m);
    });
  }
  matchesToStart.forEach(m => {
    if (!m.ready.includes(m.teamA.id)) m.ready.push(m.teamA.id);
    if (!m.ready.includes(m.teamB.id)) m.ready.push(m.teamB.id);
    tryStartMatch(m, io);
  });
}