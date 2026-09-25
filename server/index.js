import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';

import { PRO_PLAYERS } from '../src/constants/players.js';
import { ORDERED_ROLES } from '../src/constants/roles.js';
import { EVENTS } from '../src/constants/seasonConfig.js';
import { CUSTOM_CARD_EVENTS } from '../src/constants/cardEvents.js'; 
import {
  openStandardPack, openStarterPack, addCardsToCollection,
  hasCompleteLineup, getCardById, cardToRosterEntry, 
  generateBotRosterFromCards, upgradeBotRoster
} from './cardMode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, '../dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Bypass-Tunnel-Reminder"]
  }
});

const STARTING_BUDGET = 1000;
const MIN_BID = 10;
const MIN_INCREMENT = 5;
const BID_TIMER_MS = 15000; 
const matchTimeouts = {};

const teamNames = [
  "JD Gaming", "GenG", "T1", "Karmine Corp", "FearX", "Team WE", 
  "Edward Gaming", "Royal Never Give Up", "Samsung White", "Samsung Blue", 
  "Griffin", "Royal Club", "Hanwha Life Esport", "Movistar KOI", "GiantX", 
  "KT Rolster", "SKT T1", "Damwon Gaming", "Bilibili Gaming", "Nongshim Redforce", 
  "Lyon", "Flyquest", "Top Esport", "Invictus Gaming", "Anyone's Legend", "ZYB", 
  "Solary", "Fnatic"
];

function getUniqueBotName(pendingBots = []) {
  const usedNames = state.participants.map(p => p.name.toLowerCase());
  const pendingNames = pendingBots.map(b => b.name.toLowerCase());
  const allUsed = [...usedNames, ...pendingNames];
  
  const availableNames = teamNames.filter(name => !allUsed.includes(name.toLowerCase()));
  if (availableNames.length === 0) return `Bot Squad ${Math.floor(Math.random() * 1000)}`;
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

let auctionTimer = null;

let state = {
  phase: 'lobby', gameMode: null, participants: [], availablePlayers: [], turnIndex: 0,
  currentOptions: [], bracket: [], readyPlayers: [], resetPlayers: [], champion: null,
  currentRound: 0, roundComplete: false, roundReady: [],
  auction: null, budgets: {},
  skippedPlayers: [],
  cardCollections: {}, 
  activeLineups: {}, 
  economy: {}, 
  lastOpenedPack: {}, 
  starterPackClaimed: {}, 
  seasonRound: 0,
  continueSeasonVotes: [],
  year: 1,
  eventIndex: 0, 
  history: []    
};

function getOptionsForParticipant(participant, availablePool) {
  const missingRoles = ORDERED_ROLES.filter(role => !participant.roster.some(p => p.role === role));
  const options = [];
  for (const role of missingRoles) {
    const playersInRole = availablePool.filter(p => p.role === role);
    if (playersInRole.length > 0) options.push(playersInRole[Math.floor(Math.random() * playersInRole.length)]);
  }
  return options;
}

function advanceTeam(team, nextId, nextSlot) {
  if (!nextId) { state.champion = team; return; }
  const nextMatch = state.bracket.flat().find(m => m.id === nextId);
  if (nextMatch) nextMatch[nextSlot] = team;
}

function findMatchById(matchId) {
  let match = state.bracket.flat().find(m => m.id === matchId);
  if (match) return match;
  
  if (state.groups) {
    for (const g of state.groups) {
      match = g.matches.find(m => m.id === matchId);
      if (match) return match;
    }
  }
  return null;
}

function getTeamRating(team) {
  if (!team || !team.roster || team.roster.length === 0) return 0;
  return Math.round(team.roster.reduce((acc, p) => acc + p.rating, 0) / team.roster.length);
}

const GAMES_TO_WIN = 3;
const GAME_SIMULATE_MS = 6000; 
const GAME_GAP_MS = 3500; 

function simulateGame(match, state) {
  const teamA = match.teamA;
  const teamB = match.teamB;
  
  let ratingA = getTeamRating(teamA) + (match.boBuffA || 0);
  let ratingB = getTeamRating(teamB) + (match.boBuffB || 0);
  const triggeredEvents = [];

  const ALL_EVENTS = [...CUSTOM_CARD_EVENTS];

  for (const event of ALL_EVENTS) {
    if (event.uniquePerBO && match.triggeredUniqueEvents.includes(event.id)) continue;

    const results = event.apply(match, teamA, teamB, match.scoreA, match.scoreB, state);
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
        label: result.label, 
        side: result.side, 
        ratingDelta: result.ratingDelta,
        targetRoles: result.targetRoles,
        persistentBO: result.persistentBO 
      });
    }
  }

  if (triggeredEvents.length === 0) {
    triggeredEvents.push({
      label: "Phase de lane très tactique, les deux équipes s'observent...",
      side: null, 
      ratingDelta: 0
    });
  }

  const probA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 20));
  const winnerSide = Math.random() < probA ? 'A' : 'B';
  return { winnerSide, events: triggeredEvents };
}

function tryStartMatch(match) {
  if (!match || match.status !== 'pending' || !match.teamA || !match.teamB) return;

  if (match.teamA.id.startsWith('bot-') && !match.ready.includes(match.teamA.id)) match.ready.push(match.teamA.id);
  if (match.teamB.id.startsWith('bot-') && !match.ready.includes(match.teamB.id)) match.ready.push(match.teamB.id);

  if (match.ready.length === 2) {
    match.scoreA = 0;
    match.scoreB = 0;
    match.games = [];
    match.lastGameEvents = [];
    match.triggeredUniqueEvents = [];
    match.boBuffA = 0; 
    match.boBuffB = 0; 
    playNextGame(match);
  }
}

function playNextGame(match) {
  match.status = 'simulating_events'; 
  match.currentEvents = []; 
  match.lastGameEvents = []; // Nettoyage de l'événement fantôme
  
  const { winnerSide, events } = simulateGame(match, state);
  match.pendingEvents = events; 
  match.winnerSidePending = winnerSide;
  
  io.emit('draft-update', state);

  const isBotOnly = match.teamA.id.startsWith('bot-') && match.teamB.id.startsWith('bot-');
  const EVENT_DELAY = isBotOnly ? 50 : 2500; 
  const RESULT_DELAY = isBotOnly ? 100 : 4000; 

  const processNextEvent = () => {
    if (match.pendingEvents && match.pendingEvents.length > 0) {
      const evsToPush = [];
      
      while (match.pendingEvents.length > 0) {
        const ev = match.pendingEvents.shift();
        evsToPush.push(ev);
        
        if (ev.label) {
          while (match.pendingEvents.length > 0 && !match.pendingEvents[0].label) {
            evsToPush.push(match.pendingEvents.shift());
          }
          break; 
        }
      }

      match.currentEvents.push(...evsToPush);
      io.emit('draft-update', state);
      
      const delay = evsToPush.some(e => e.label) ? EVENT_DELAY : 50;
      matchTimeouts[match.id] = setTimeout(processNextEvent, delay);
      
    } else {
      match.status = 'simulating_result';
      io.emit('draft-update', state);
      
      matchTimeouts[match.id] = setTimeout(() => {
        if (match.winnerSidePending === 'A') match.scoreA++; else match.scoreB++;
        match.games.push({ gameNumber: match.games.length + 1, winnerSide: match.winnerSidePending, events: match.currentEvents });
        match.lastGameEvents = match.currentEvents;
        
        match.currentEvents = [];
        match.pendingEvents = [];
        
        if (match.scoreA === GAMES_TO_WIN || match.scoreB === GAMES_TO_WIN) {
          match.winner = match.scoreA === GAMES_TO_WIN ? match.teamA : match.teamB;
          match.status = 'finished';
          
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
          matchTimeouts[match.id] = setTimeout(() => playNextGame(match), isBotOnly ? 100 : GAME_GAP_MS);
        }
      }, RESULT_DELAY);
    }
  };
  
  matchTimeouts[match.id] = setTimeout(processNextEvent, EVENT_DELAY);
}

function buildPlayoffsFromSwiss() {
  const qualified = state.swissTeams.filter(t => t.wins === 3).sort((a, b) => a.losses - b.losses).map(t => t.team);
  
  const qf = [
    { id: 'qf-0', teamA: qualified[0], teamB: qualified[7], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamA' },
    { id: 'qf-1', teamA: qualified[3], teamB: qualified[4], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamB' },
    { id: 'qf-2', teamA: qualified[2], teamB: qualified[5], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamA' },
    { id: 'qf-3', teamA: qualified[1], teamB: qualified[6], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamB' }
  ];
  const sf = [
    { id: 'sf-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamA' },
    { id: 'sf-1', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamB' }
  ];
  const f = [
    { id: 'f-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: null, nextSlot: null }
  ];
  
  state.bracket = [qf, sf, f];
  state.currentRound = 0;
  state.swissTeams = null; 
  state.champion = null;
}

function buildPlayoffsFromGroups() {
  const qf = [
    { id: 'qf-0', teamA: state.groups[0].qualified[0], teamB: state.groups[1].qualified[1], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamA' },
    { id: 'qf-1', teamA: state.groups[2].qualified[0], teamB: state.groups[3].qualified[1], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamB' },
    { id: 'qf-2', teamA: state.groups[1].qualified[0], teamB: state.groups[0].qualified[1], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamA' },
    { id: 'qf-3', teamA: state.groups[3].qualified[0], teamB: state.groups[2].qualified[1], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamB' }
  ];
  const sf = [
    { id: 'sf-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamA' },
    { id: 'sf-1', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamB' }
  ];
  const f = [
    { id: 'f-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: null, nextSlot: null }
  ];

  state.bracket = [qf, sf, f];
  state.currentRound = 0;
  state.groups = null; 
  state.champion = null;
}

function completeDraftAndStartTournament() {
  const TOTAL_TEAMS = 16;
  const numBots = TOTAL_TEAMS - state.participants.length;
  for (let i = 1; i <= numBots; i++) {
    const bot = { id: `bot-${i}`, name: getUniqueBotName(), roster: [] };
    ORDERED_ROLES.forEach(role => {
      const pool = [...state.availablePlayers, ...state.skippedPlayers].filter(p => p.role === role);
      if (pool.length === 0) return; 
      const pick = pool[Math.floor(Math.random() * pool.length)];
      bot.roster.push(pick);
      state.availablePlayers = state.availablePlayers.filter(p => p.id !== pick.id);
      state.skippedPlayers = state.skippedPlayers.filter(p => p.id !== pick.id);
    });
    state.participants.push(bot);
  }
  state.phase = 'season_hub';
  state.eventIndex = 0;
  io.emit('draft-update', state);
}

function startCardTournament() {
  const TOTAL_TEAMS = 16;
  const humanParticipants = state.participants.filter(p => !p.id.startsWith('bot-'));
  const existingBots = state.participants.filter(p => p.id.startsWith('bot-'));

  humanParticipants.forEach(p => {
    const lineup = state.activeLineups[p.id] || {};
    p.roster = ORDERED_ROLES.map(role => cardToRosterEntry(getCardById(lineup[role])));
  });

  if (existingBots.length === 0) {
    const numBots = TOTAL_TEAMS - humanParticipants.length;
    const bots = [];
    for (let i = 1; i <= numBots; i++) {
      bots.push({ id: `bot-${i}`, name: getUniqueBotName(bots), roster: generateBotRosterFromCards() });
    }
    state.participants = [...humanParticipants, ...bots];
  } else {
    state.participants = [...humanParticipants, ...existingBots];
  }

  if (!state.seasonScores) {
    state.seasonScores = {};
    state.participants.forEach(p => { state.seasonScores[p.id] = { points: 0, titles: 0 }; });
  }

  state.phase = 'season_hub';
  if (state.eventIndex === undefined) state.eventIndex = 0;
  io.emit('draft-update', state);
}

function startCurrentEvent() {
  const currentEvent = EVENTS[state.eventIndex];
  state.phase = 'tournament';
  state.champion = null;
  state.currentRound = 0;
  state.readyPlayers = []; 
  state.roundComplete = false; 

  const shuffledTeams = [...state.participants].sort(() => 0.5 - Math.random());

  if (currentEvent.format === 'gsl_to_single') {
    state.tournamentPhase = 'groups';
    state.groups = [];
    for (let i = 0; i < 4; i++) {
      const groupTeams = shuffledTeams.slice(i * 4, i * 4 + 4);
      state.groups.push({
        id: String.fromCharCode(65 + i),
        teams: groupTeams, qualified: [],
        matches: [
          { id: `g${i}-m1`, type: 'open', teamA: groupTeams[0], teamB: groupTeams[3], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false },
          { id: `g${i}-m2`, type: 'open', teamA: groupTeams[1], teamB: groupTeams[2], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false },
          { id: `g${i}-winner`, type: 'winner', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false },
          { id: `g${i}-loser`, type: 'loser', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false },
          { id: `g${i}-decider`, type: 'decider', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false }
        ]
      });
    }
    state.bracket = [[]];
    state.groups.forEach(g => { state.bracket[0].push(g.matches[0], g.matches[1]); });
  } 
  else if (currentEvent.format === 'swiss_to_single') {
    state.tournamentPhase = 'swiss';
    state.swissTeams = state.participants.map(p => ({ team: p, wins: 0, losses: 0 }));
    
    const createMatch = (id, pool) => ({ id, pool, teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false });

    const r0 = Array(8).fill(null).map((_, i) => createMatch(`sw1-m${i+1}`, '0-0'));
    const r1 = [...Array(4).fill(null).map((_, i) => createMatch(`sw2-w${i+1}`, '1-0')), ...Array(4).fill(null).map((_, i) => createMatch(`sw2-l${i+1}`, '0-1'))];
    const r2 = [...Array(2).fill(null).map((_, i) => createMatch(`sw3-w${i+1}`, '2-0')), ...Array(4).fill(null).map((_, i) => createMatch(`sw3-m${i+1}`, '1-1')), ...Array(2).fill(null).map((_, i) => createMatch(`sw3-l${i+1}`, '0-2'))];
    const r3 = [...Array(3).fill(null).map((_, i) => createMatch(`sw4-w${i+1}`, '2-1')), ...Array(3).fill(null).map((_, i) => createMatch(`sw4-l${i+1}`, '1-2'))];
    const r4 = Array(3).fill(null).map((_, i) => createMatch(`sw5-m${i+1}`, '2-2'));

    const shuffled = [...state.participants].sort(() => 0.5 - Math.random());
    for (let i = 0; i < 8; i++) {
      r0[i].teamA = shuffled[i*2]; r0[i].teamB = shuffled[i*2+1];
    }
    state.bracket = [r0, r1, r2, r3, r4];
  }
  else if (currentEvent.format === 'double_elim') {
    state.tournamentPhase = 'bracket';
    const shuffledTeams = [...state.participants].sort(() => 0.5 - Math.random());
    
    const createMatch = (id, teamA, teamB, nextId, nextSlot, loserNextId = null, loserNextSlot = null) => ({
      id, teamA, teamB, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId, nextSlot, loserNextId, loserNextSlot
    });

    const r0 = [], r1 = [], r2 = [], r3 = [], r4 = [], r5 = [], r6 = [], r7 = [];

    for (let i = 0; i < 8; i++) {
      r0.push(createMatch(`ub1-${i+1}`, shuffledTeams[i*2], shuffledTeams[i*2+1], `ub2-${Math.floor(i/2)+1}`, i%2===0 ? 'teamA' : 'teamB', `lb1-${Math.floor(i/2)+1}`, i%2===0 ? 'teamA' : 'teamB'));
    }

    r1.push(createMatch(`ub2-1`, null, null, `ub3-1`, 'teamA', `lb2-4`, 'teamA'));
    r1.push(createMatch(`ub2-2`, null, null, `ub3-1`, 'teamB', `lb2-3`, 'teamA'));
    r1.push(createMatch(`ub2-3`, null, null, `ub3-2`, 'teamA', `lb2-2`, 'teamA'));
    r1.push(createMatch(`ub2-4`, null, null, `ub3-2`, 'teamB', `lb2-1`, 'teamA'));
    for (let i = 0; i < 4; i++) r1.push(createMatch(`lb1-${i+1}`, null, null, `lb2-${i+1}`, 'teamB'));

    r2.push(createMatch(`ub3-1`, null, null, `ub4-1`, 'teamA', `lb4-2`, 'teamA'));
    r2.push(createMatch(`ub3-2`, null, null, `ub4-1`, 'teamB', `lb4-1`, 'teamA'));
    for (let i = 0; i < 4; i++) r2.push(createMatch(`lb2-${i+1}`, null, null, `lb3-${Math.floor(i/2)+1}`, i%2===0 ? 'teamA' : 'teamB'));

    r3.push(createMatch(`ub4-1`, null, null, `gf-1`, 'teamA', `lb6-1`, 'teamA'));
    r3.push(createMatch(`lb3-1`, null, null, `lb4-1`, 'teamB'));
    r3.push(createMatch(`lb3-2`, null, null, `lb4-2`, 'teamB'));

    r4.push(createMatch(`lb4-1`, null, null, `lb5-1`, 'teamA'));
    r4.push(createMatch(`lb4-2`, null, null, `lb5-1`, 'teamB'));

    r5.push(createMatch(`lb5-1`, null, null, `lb6-1`, 'teamB'));
    r6.push(createMatch(`lb6-1`, null, null, `gf-1`, 'teamB'));
    r7.push(createMatch(`gf-1`, null, null, null, null));

    state.bracket = [r0, r1, r2, r3, r4, r5, r6, r7];
  }

  io.emit('draft-update', state);
}

// --- SYSTÈME ÉCONOMIQUE, RÉCOMPENSES ET CATCH-UP ---
function awardSeasonRewards() {
  const eventConfig = EVENTS[state.eventIndex];
  const getLoser = (match) => match?.winner?.id === match?.teamA?.id ? match?.teamB?.id : match?.teamA?.id;
  
  let championId = state.champion?.id;
  let finalistId = null;
  let top4Ids = [];
  let top8Ids = []; 
  
  if (eventConfig.format === 'double_elim') {
    const gf = state.bracket[7][0]; 
    finalistId = getLoser(gf);
    
    const lbFinal = state.bracket[6][0]; 
    const thirdPlaceId = getLoser(lbFinal);
    if (thirdPlaceId) top4Ids.push(thirdPlaceId);
    
    const lbSemi = state.bracket[5][0]; 
    const fourthPlaceId = getLoser(lbSemi);
    if (fourthPlaceId) top4Ids.push(fourthPlaceId);

    const lb4_1 = state.bracket[4][0];
    const lb4_2 = state.bracket[4][1];
    if (lb4_1) top8Ids.push(getLoser(lb4_1)); 
    if (lb4_2) top8Ids.push(getLoser(lb4_2)); 
  } 
  else {
    const finalMatch = state.bracket[state.bracket.length - 1]?.[0];
    finalistId = getLoser(finalMatch);
    
    const sfMatches = state.bracket[state.bracket.length - 2] || [];
    top4Ids = sfMatches.map(getLoser).filter(id => id);

    const qfMatches = state.bracket[state.bracket.length - 3] || [];
    top8Ids = qfMatches.map(getLoser).filter(id => id);
  }

  if (!state.economy) state.economy = {};
  if (!state.seasonScores) state.seasonScores = {};
  state.participants.forEach(p => {
    if (!state.seasonScores[p.id]) state.seasonScores[p.id] = { points: 0, titles: 0 };
    if (state.economy[p.id] === undefined) state.economy[p.id] = 0;
  });

  const catchupBonuses = {};
  const totalTournamentsPlayed = state.history.length;
  
  if (totalTournamentsPlayed >= 3) {
    const getScoreKey = (p) => `${state.seasonScores[p.id].points}-${state.seasonScores[p.id].titles}`;
    
    const uniqueScoreKeys = [...new Set(state.participants.map(getScoreKey))]
      .sort((a, b) => {
        const [ptsA, titlesA] = a.split('-').map(Number);
        const [ptsB, titlesB] = b.split('-').map(Number);
        if (ptsA !== ptsB) return ptsB - ptsA;
        return titlesB - titlesA;
      })
      .reverse(); 

    state.participants.forEach(p => {
      const scoreKey = getScoreKey(p);
      const worstIndex = uniqueScoreKeys.indexOf(scoreKey); 
      
      if (worstIndex === 0) catchupBonuses[p.id] = 150;      
      else if (worstIndex === 1) catchupBonuses[p.id] = 100; 
      else if (worstIndex === 2) catchupBonuses[p.id] = 50;  
    });
  }

  const rewards = eventConfig.rewards;
  state.participants.forEach(p => {
    let pointsEarned = rewards.points.base || 0;
    let moneyEarned = rewards.money.base || 0;

    if (p.id === championId) {
      pointsEarned = rewards.points.champion;
      moneyEarned = rewards.money.champion;
      state.seasonScores[p.id].titles += 1;
    } else if (p.id === finalistId) {
      pointsEarned = rewards.points.finalist;
      moneyEarned = rewards.money.finalist;
    } else if (top4Ids.includes(p.id)) {
      pointsEarned = rewards.points.top4;
      moneyEarned = rewards.money.top4;
    } else if (top8Ids.includes(p.id)) {
      pointsEarned = rewards.points.top8;
      moneyEarned = rewards.money.top8;
    }

    const catchUpBonus = catchupBonuses[p.id] || 0;
    moneyEarned += catchUpBonus;

    state.seasonScores[p.id].points += pointsEarned;

    if (!p.id.startsWith('bot-')) {
      state.economy[p.id] += moneyEarned;
    } else {
      p.roster = p.roster.map(pro => {
        if (pro.contract === 'LIFETIME') return pro; 
        let currentContract = pro.contract !== undefined ? pro.contract : 3;
        currentContract -= 1;
        
        if (currentContract <= 0) {
          let replacement = null;
          while(!replacement) {
            replacement = openStandardPack().find(c => c.role === pro.role);
          }
          const newPro = cardToRosterEntry(replacement);
          newPro.contract = 3; 
          return newPro;
        } else {
          pro.contract = currentContract;
          return pro;
        }
      });
      p.roster = upgradeBotRoster(p.roster, Math.floor(moneyEarned / 100));
    }
  });
}

function clearAuctionTimer() { if (auctionTimer) { clearTimeout(auctionTimer); auctionTimer = null; } }
function getRoleNeeders(role) { return state.participants.filter(p => !p.id.startsWith('bot-') && !p.roster.some(pro => pro.role === role)); }
function isBroke(participantId) { return (state.budgets[participantId] ?? STARTING_BUDGET) < MIN_BID; }
function getSkipVotingGroup(auction) { const solventActive = auction.activeIds.filter(id => !isBroke(id)); return solventActive.length > 0 ? solventActive : auction.activeIds; }
function computeSkipEligible(auction) { if (!auction || auction.forced || auction.activeIds.length < 2) return false; return getSkipVotingGroup(auction).length >= 2; }

function startAuctionRound() {
  clearAuctionTimer();
  const candidateRoles = ORDERED_ROLES.filter(role => getRoleNeeders(role).length > 0);
  if (candidateRoles.length === 0) { completeDraftAndStartTournament(); return; }

  const shuffledRoles = [...candidateRoles].sort(() => Math.random() - 0.5);
  for (const role of shuffledRoles) {
    const needers = getRoleNeeders(role);
    let pool = state.availablePlayers.filter(p => p.role === role);
    if (pool.length === 0) pool = state.skippedPlayers.filter(p => p.role === role);
    if (pool.length === 0) continue; 

    const player = pool[Math.floor(Math.random() * pool.length)];
    const contenders = needers.map(p => p.id);

    state.auction = { player, role, contenders, activeIds: [...contenders], highestBid: 0, highestBidderId: null, minBid: MIN_BID, increment: MIN_INCREMENT, forced: contenders.length === 1, skipVotes: [], skipEligible: false, deadline: null };
    state.auction.skipEligible = computeSkipEligible(state.auction);
    return;
  }
  completeDraftAndStartTournament();
}

function assignAuctionPlayer(participantId, price) {
  const auction = state.auction;
  if (!auction) return;
  const participant = state.participants.find(p => p.id === participantId);
  if (participant) {
    participant.roster.push(auction.player);
    state.availablePlayers = state.availablePlayers.filter(p => p.id !== auction.player.id);
    state.skippedPlayers = state.skippedPlayers.filter(p => p.id !== auction.player.id);
    state.budgets[participantId] = (state.budgets[participantId] ?? STARTING_BUDGET) - price;
  }
  state.auction = null;
  startAuctionRound();
}

function resolveAuctionWin(participantId) {
  const auction = state.auction;
  if (!auction) return;
  const askedPrice = auction.highestBid > 0 ? auction.highestBid : auction.minBid;
  assignAuctionPlayer(participantId, Math.min(state.budgets[participantId] ?? STARTING_BUDGET, askedPrice));
}

function resolveActiveIdsChange() {
  const auction = state.auction;
  if (!auction) return;
  if (auction.activeIds.length === 0) { clearAuctionTimer(); discardAuctionPlayer(); return; }
  if (auction.activeIds.length === 1) { auction.skipEligible = false; auction.skipVotes = []; clearAuctionTimer(); auction.deadline = null; return; }
  auction.forced = false;
  auction.skipEligible = computeSkipEligible(auction);
}

function discardAuctionPlayer() {
  const auction = state.auction;
  if (!auction) return;
  state.availablePlayers = state.availablePlayers.filter(p => p.id !== auction.player.id);
  if (!state.skippedPlayers.some(p => p.id === auction.player.id)) state.skippedPlayers.push(auction.player);
  state.auction = null;
  startAuctionRound();
}

function refreshAuctionAfterDisconnect() {
  if (state.phase !== 'auction' || !state.auction) return;
  const auction = state.auction;
  const stillHere = (id) => state.participants.some(p => p.id === id);
  auction.contenders = auction.contenders.filter(stillHere);
  auction.activeIds = auction.activeIds.filter(stillHere);
  auction.skipVotes = auction.skipVotes.filter(id => auction.activeIds.includes(id));

  if (auction.highestBidderId && !auction.activeIds.includes(auction.highestBidderId)) {
    auction.highestBid = 0; auction.highestBidderId = null; auction.deadline = null; clearAuctionTimer();
  }
  resolveActiveIdsChange();
}

function startAllBotMatchesInCurrentRound() {
  const matchesToStart = [];
  if (state.tournamentPhase === 'groups') {
    state.groups.forEach(g => {
      g.matches.forEach(m => {
        if (m.waveActive && m.status === 'pending' && m.teamA && m.teamB && m.teamA.id.startsWith('bot-') && m.teamB.id.startsWith('bot-')) matchesToStart.push(m);
      });
    });
  } else if (state.bracket && state.bracket[state.currentRound]) {
    state.bracket[state.currentRound].forEach(m => {
      if (m.waveActive && m.status === 'pending' && m.teamA && m.teamB && m.teamA.id.startsWith('bot-') && m.teamB.id.startsWith('bot-')) matchesToStart.push(m);
    });
  }
  matchesToStart.forEach(m => {
    if (!m.ready.includes(m.teamA.id)) m.ready.push(m.teamA.id);
    if (!m.ready.includes(m.teamB.id)) m.ready.push(m.teamB.id);
    tryStartMatch(m);
  });
}

// ==========================================
// DEBUT DES SOCKETS
// ==========================================
io.on('connection', (socket) => {
  socket.emit('draft-update', state);

  socket.on('select-mode', (modeId) => {
    if (state.phase === 'lobby' && state.gameMode === null) { state.gameMode = modeId; io.emit('draft-update', state); }
  });

  socket.on('dev-give-card', (cardId) => {
    if (state.gameMode !== 'draft_cartes') return;
    const id = socket.id;
    if (!state.cardCollections[id]) state.cardCollections[id] = {};
    
    let currentContract = state.cardCollections[id][cardId] || 0;
    if (currentContract !== 'LIFETIME') {
      state.cardCollections[id][cardId] = currentContract + 5; 
    }
    io.emit('draft-update', state);
  });

  socket.on('dev-set-event', (eventIndex) => {
    if (eventIndex >= 0 && eventIndex < EVENTS.length) { state.eventIndex = eventIndex; io.emit('draft-update', state); }
  });

  socket.on('join-lobby', (name) => {
    if (state.phase !== 'lobby' || state.participants.length >= 16) return;
    const cleanName = name.trim();
    if (state.participants.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) return;
    if (!state.participants.find(p => p.id === socket.id)) {
      state.participants.push({ id: socket.id, name: cleanName, roster: [] });
      io.emit('draft-update', state);
    }
  });

  socket.on('start-draft', () => {
    // CORRECTION : >= 1 permet de lancer la partie tout seul
    if (state.phase === 'lobby' && state.participants.length >= 1) {
      if (state.gameMode === 'draft_cartes') {
        state.cardCollections = {};
        state.activeLineups = {};
        state.pendingPacks = {};
        state.lastOpenedPack = {};
        state.starterPackClaimed = {};
        state.seasonRound = 1;
        state.continueSeasonVotes = [];
        state.seasonScores = null; 
        
        state.economy = {}; // Reset de l'économie
        state.readyPlayers = []; 
        state.history = [];
        state.eventIndex = 0;
        state.year = 1;
        
        state.participants.forEach(p => {
          state.cardCollections[p.id] = {};
          state.activeLineups[p.id] = {};
          state.pendingPacks[p.id] = 1; 
          state.lastOpenedPack[p.id] = [];
          state.starterPackClaimed[p.id] = false;
          state.economy[p.id] = 0; // Initialise l'argent à 0
        });
        state.phase = 'cards';
        io.emit('draft-update', state);
        return;
      }
      state.availablePlayers = [...PRO_PLAYERS];
      if (state.gameMode === 'draft_encheres') {
        state.budgets = {}; state.skippedPlayers = []; state.participants.forEach(p => { state.budgets[p.id] = STARTING_BUDGET; });
        state.phase = 'auction'; startAuctionRound();
      } else {
        state.phase = 'draft'; state.turnIndex = 0; state.currentOptions = getOptionsForParticipant(state.participants[0], state.availablePlayers);
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('skip-match', (matchId) => {
    const match = findMatchById(matchId);
    if (!match || (match.status !== 'simulating_events' && match.status !== 'simulating_result')) return;

    if (matchTimeouts[match.id]) {
      clearTimeout(matchTimeouts[match.id]);
      delete matchTimeouts[match.id];
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
    match.currentEvents = [];
    match.pendingEvents = [];
    
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
  });

  socket.on('buy-pack', () => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;
    
    if (!state.economy) state.economy = {};
    if (state.economy[id] === undefined) state.economy[id] = 0;

    const PACK_PRICE = 100;
    const isStarter = !state.starterPackClaimed[id];

    if (!isStarter) {
      if (state.economy[id] < PACK_PRICE) return; 
      state.economy[id] -= PACK_PRICE;
    }

    const cards = isStarter ? openStarterPack() : openStandardPack();
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

          if (currentContract === 'LIFETIME' || contractToAdd === 'LIFETIME') {
            state.cardCollections[id][cardId] = 'LIFETIME';
          } else {
            state.cardCollections[id][cardId] = currentContract + contractToAdd;
          }
        });
        
        delete state.pendingPackResults[id];
      }

      if (state.lastOpenedPack[id]) {
        state.lastOpenedPack[id] = [];
      }
      
      io.emit('draft-update', state);
    }
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

    const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
    if (state.readyPlayers.length === humanCount && humanCount > 0) startCardTournament();
    io.emit('draft-update', state);
  });

  socket.on('continue-season', () => {
    if (state.phase !== 'simulation' || !state.champion || state.gameMode !== 'draft_cartes') return;

    if (state.continueSeasonVotes.includes(socket.id)) state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);
    else state.continueSeasonVotes.push(socket.id);

    const humanParticipants = state.participants.filter(p => !p.id.startsWith('bot-'));
    
    if (state.continueSeasonVotes.length === humanParticipants.length && humanParticipants.length > 0) {
      
      awardSeasonRewards(); 
      
      state.history.push({ year: state.year, eventId: EVENTS[state.eventIndex]?.id || `Event ${state.eventIndex}`, winnerName: state.champion.name });
      
      humanParticipants.forEach(p => {
        const lineup = state.activeLineups[p.id];
        if (lineup) {
          Object.keys(lineup).forEach(role => {
            const cardId = lineup[role];
            let currentContract = state.cardCollections[p.id][cardId];
            
            if (currentContract !== 'LIFETIME' && typeof currentContract === 'number') {
              state.cardCollections[p.id][cardId] = Math.max(0, currentContract - 1);
              
              if (state.cardCollections[p.id][cardId] === 0) {
                delete lineup[role];
              }
            }
          });
        }
      });

      state.eventIndex += 1;
      if (state.eventIndex >= EVENTS.length) { state.eventIndex = 0; state.year += 1; }

      state.continueSeasonVotes = []; state.readyPlayers = []; state.champion = null; state.bracket = []; state.currentRound = 0; state.roundComplete = false; state.roundReady = []; state.seasonRound += 1; state.phase = 'cards';
    }
    io.emit('draft-update', state);
  });

  socket.on('place-bid', (amount) => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;
    if (isBroke(socket.id)) return; 

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return;

    const minRequired = auction.highestBid === 0 ? auction.minBid : auction.highestBid + auction.increment;
    if (numericAmount < minRequired) return;

    const budget = state.budgets[socket.id] ?? STARTING_BUDGET;
    if (numericAmount > budget) return;

    auction.highestBid = numericAmount; auction.highestBidderId = socket.id; auction.skipVotes = []; 

    clearAuctionTimer();
    auction.deadline = Date.now() + BID_TIMER_MS;
    auctionTimer = setTimeout(() => {
      if (state.auction === auction && auction.highestBidderId) {
        assignAuctionPlayer(auction.highestBidderId, auction.highestBid); io.emit('draft-update', state);
      }
    }, BID_TIMER_MS);
    io.emit('draft-update', state);
  });

  socket.on('acquire-forced', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || !auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;
    resolveAuctionWin(socket.id); io.emit('draft-update', state);
  });

  socket.on('withdraw-from-auction', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;

    if (auction.activeIds.length >= 2) {
      const solventActive = auction.activeIds.filter(id => !isBroke(id));
      if (solventActive.length === 0) return; 
    }

    auction.activeIds = auction.activeIds.filter(id => id !== socket.id);
    auction.skipVotes = auction.skipVotes.filter(id => id !== socket.id);

    if (auction.highestBidderId === socket.id) {
      auction.highestBid = 0; auction.highestBidderId = null; auction.deadline = null; clearAuctionTimer();
    }
    resolveActiveIdsChange(); io.emit('draft-update', state);
  });

  socket.on('claim-player', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;

    const isSoleSurvivor = auction.activeIds.length === 1 && auction.activeIds[0] === socket.id;
    if (!isSoleSurvivor) {
      if (!isBroke(socket.id)) return;
      if (auction.activeIds.filter(id => !isBroke(id)).length > 0) return; 
    }
    resolveAuctionWin(socket.id); io.emit('draft-update', state);
  });

  socket.on('toggle-skip-vote', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;
    if (auction.activeIds.length <= 1) return; 

    const solventActive = auction.activeIds.filter(id => !isBroke(id));
    const inRescuePhase = solventActive.length === 0;
    const amIBroke = isBroke(socket.id);

    if (inRescuePhase && !amIBroke) return;
    if (!inRescuePhase && amIBroke) return;
    if (!inRescuePhase && !auction.skipEligible) return;

    if (auction.skipVotes.includes(socket.id)) auction.skipVotes = auction.skipVotes.filter(id => id !== socket.id);
    else auction.skipVotes.push(socket.id);

    const votingGroup = inRescuePhase ? auction.activeIds.filter(id => isBroke(id)) : solventActive;

    if (votingGroup.length > 0 && auction.skipVotes.length === votingGroup.length) {
      if (inRescuePhase) { clearAuctionTimer(); discardAuctionPlayer(); io.emit('draft-update', state); return; }
      auction.activeIds = auction.activeIds.filter(id => isBroke(id)); auction.skipVotes = []; auction.highestBid = 0; auction.highestBidderId = null; auction.deadline = null; clearAuctionTimer(); resolveActiveIdsChange();
    }
    io.emit('draft-update', state);
  });

  socket.on('toggle-ready', () => {
    if (state.phase === 'tournament' || state.phase === 'simulation') {
      if (state.readyPlayers.includes(socket.id)) state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      else state.readyPlayers.push(socket.id);

      const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      if (state.readyPlayers.length >= humanCount && humanCount > 0) {
        state.readyPlayers = []; 
        let hasHumanInWave = false; 

        if (state.tournamentPhase === 'groups') {
          if (state.roundComplete) {
            buildPlayoffsFromGroups();
            state.tournamentPhase = 'bracket';
            state.roundComplete = false;
            state.phase = 'tournament'; 
          } else {
            state.phase = 'simulation'; 
            let allFinished = true;
            state.groups.forEach(group => {
              group.matches.forEach(match => {
                if (match.status === 'pending' && match.teamA && match.teamB) {
                  match.waveActive = true; 
                  allFinished = false;
                  if (!match.teamA.id.startsWith('bot-') || !match.teamB.id.startsWith('bot-')) hasHumanInWave = true;
                } else if (match.status.startsWith('simulating') || (match.status === 'pending' && match.waveActive)) {
                  allFinished = false;
                }
              });
            });
            if (allFinished && !state.champion) state.roundComplete = true;
            if (!hasHumanInWave && !state.roundComplete) startAllBotMatchesInCurrentRound();
          }
        } 
        else {
          state.phase = 'simulation'; 
          state.currentRound = state.currentRound || 0;
          let allFinished = true;
          
          state.bracket[state.currentRound].forEach(match => {
             if (match.status === 'pending' && match.teamA && match.teamB) {
              match.waveActive = true; 
              allFinished = false;
              if (!match.teamA.id.startsWith('bot-') || !match.teamB.id.startsWith('bot-')) hasHumanInWave = true;
            } else if (match.status.startsWith('simulating') || (match.status === 'pending' && match.waveActive)) {
              allFinished = false;
            }
          });

          if (allFinished && !state.champion) state.roundComplete = true;

          if (!hasHumanInWave && !state.roundComplete) {
            startAllBotMatchesInCurrentRound();
          }
        }
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('match-ready', (matchId) => {
    const match = findMatchById(matchId);
    if (!match || match.status !== 'pending') return;
    if (!match.ready.includes(socket.id)) match.ready.push(socket.id);
    
    tryStartMatch(match);
    if (match.status.startsWith('simulating')) startAllBotMatchesInCurrentRound();
  });

  socket.on('dismiss-match', (matchId) => {
    const match = findMatchById(matchId);
    if (match && !match.dismissedBy.includes(socket.id)) {
      match.dismissedBy.push(socket.id);
      io.emit('draft-update', state);
    }
  });

  socket.on('advance-round', () => {
    if (state.phase === 'simulation' && state.roundComplete) {
      
      const allHumans = state.participants.filter(p => !p.id.startsWith('bot-')).map(p => p.id);
      
      if (allHumans.includes(socket.id)) {
        if (!state.roundReady.includes(socket.id)) state.roundReady.push(socket.id);
      }

      if (state.roundReady.length >= allHumans.length) {
        state.roundComplete = false;
        state.roundReady = [];
        state.phase = 'tournament'; 

        if (state.tournamentPhase === 'swiss') {
          state.currentRound++;
          
          if (state.currentRound >= 5) {
            state.champion = null; 
            const qualified = state.swissTeams.filter(t => t.wins === 3).sort((a, b) => a.losses - b.losses).map(t => t.team);
            
            const qf = [
              { id: 'qf-0', teamA: qualified[0], teamB: qualified[7], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamA' },
              { id: 'qf-1', teamA: qualified[3], teamB: qualified[4], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamB' },
              { id: 'qf-2', teamA: qualified[2], teamB: qualified[5], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamA' },
              { id: 'qf-3', teamA: qualified[1], teamB: qualified[6], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamB' }
            ];
            const sf = [
              { id: 'sf-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamA' },
              { id: 'sf-1', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamB' }
            ];
            const f = [
              { id: 'f-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: null, nextSlot: null }
            ];
            
            state.bracket = [qf, sf, f];
            state.currentRound = 0;
            state.tournamentPhase = 'bracket';
          } else {
            const nextMatches = state.bracket[state.currentRound];
            const activeTeams = state.swissTeams.filter(t => t.wins < 3 && t.losses < 3);

            const pools = {};
            activeTeams.forEach(t => {
              const key = `${t.wins}-${t.losses}`;
              if (!pools[key]) pools[key] = [];
              pools[key].push(t);
            });

            for (const poolKey in pools) {
              const poolMatches = nextMatches.filter(m => m.pool === poolKey);
              const teamsInPool = pools[poolKey].sort(() => 0.5 - Math.random());
              for (let i = 0; i < poolMatches.length; i++) {
                poolMatches[i].teamA = teamsInPool[i*2].team;
                poolMatches[i].teamB = teamsInPool[i*2+1].team;
              }
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
    if (state.resetPlayers.includes(socket.id)) {
      state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
    } else {
      state.resetPlayers.push(socket.id);
    }

    const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;

    if (humanCount === 0 || state.resetPlayers.length >= humanCount) {
      state.participants = state.participants.filter(p => !p.id.startsWith('bot-'));
      state.participants.forEach(p => p.roster = []);
      state.phase = 'lobby';
      state.gameMode = null;
      state.bracket = [];
      state.champion = null;
      state.readyPlayers = [];
      state.resetPlayers = [];
      state.turnIndex = 0;
      state.currentRound = 0;
      state.roundComplete = false;
      state.roundReady = [];
      state.auction = null;
      state.budgets = {};
      state.skippedPlayers = [];
      state.cardCollections = {};
      state.activeLineups = {};
      state.economy = {};
      state.pendingPacks = {};
      state.lastOpenedPack = {};
      state.starterPackClaimed = {};
      state.seasonRound = 0;
      state.continueSeasonVotes = [];
      
      state.history = [];
      state.eventIndex = 0;
      state.year = 1;
      state.seasonScores = null;
      state.groups = null;
      state.swissTeams = null;
    }
    io.emit('draft-update', state);
  });

  socket.on('start-next-event', () => {
    if (state.phase === 'season_hub') startCurrentEvent();
  });

  socket.on('disconnect', () => {
    if (!socket.id.startsWith('bot-')) {
      const humansBefore = state.participants.filter(p => !p.id.startsWith('bot-')).length;
      state.participants = state.participants.filter(p => p.id !== socket.id);
      const humansAfter = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      delete state.cardCollections[socket.id]; 
      delete state.activeLineups[socket.id]; 
      delete state.economy[socket.id]; 
      delete state.lastOpenedPack[socket.id]; 
      delete state.starterPackClaimed[socket.id];
      
      state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);
      state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      state.roundReady = state.roundReady.filter(id => id !== socket.id);
      state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);

      if (humansAfter === 0 && humansBefore > 0) {
        state.phase = 'lobby';
        state.gameMode = null;
        state.champion = null;
        state.participants = [];
        state.resetPlayers = [];
        state.readyPlayers = []; 
        state.roundReady = [];   
        state.auction = null;
        state.budgets = {};
        state.skippedPlayers = [];
        state.cardCollections = {};
        state.activeLineups = {};
        state.economy = {}; 
        state.pendingPacks = {};
        state.lastOpenedPack = {};
        state.starterPackClaimed = {};
        state.seasonRound = 0;
        state.continueSeasonVotes = [];
        
        state.history = [];
        state.eventIndex = 0;
        state.year = 1;
        state.seasonScores = null;
        state.bracket = [];
        state.groups = null;
        state.swissTeams = null;
        
        clearAuctionTimer();
      } else {
        refreshAuctionAfterDisconnect();
      }
      
      io.emit('draft-update', state);
    }
  });
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(3001, '0.0.0.0', () => console.log('Serveur Esport actif sur le port 3001'));