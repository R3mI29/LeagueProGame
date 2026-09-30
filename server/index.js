import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';

import { ORDERED_ROLES } from '../src/constants/roles.js';
import { EVENTS } from '../src/constants/seasonConfig.js';
import { SECRET_UNLOCKS } from '../src/constants/secretUnlocks.js';
import { CUSTOM_CARD_EVENTS } from '../src/constants/cardEvents.js'; 
import {
  openPack, openStarterPack, getCardById, cardToRosterEntry, 
  generateBotRosterFromCards, upgradeBotRoster, PACK_TYPES
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

const matchTimeouts = {};

const TEAMS_DB = [
  { name: "Anyone's Legend", tag: "AL", logo: "/equipes/anyone-legend.webp" },
  { name: "Bilibili Gaming", tag: "BLG", logo: "/equipes/bilibili-gaming.webp" },
  { name: "BRION", tag: "BRO", logo: "/equipes/brion.webp" },
  { name: "Cloud9", tag: "C9", logo: "/equipes/cloud9.webp" },
  { name: "Dignitas", tag: "DIG", logo: "/equipes/dignitas.webp" },
  { name: "Disguised", tag: "DSG", logo: "/equipes/disguised.webp" },
  { name: "Dplus KIA", tag: "DK", logo: "/equipes/dplus.webp" },
  { name: "DRX", tag: "DRX", logo: "/equipes/drx.webp" },
  { name: "Edward Gaming", tag: "EDG", logo: "/equipes/edward-gaming.webp" },
  { name: "FearX", tag: "FOX", logo: "/equipes/fearx.webp" },
  { name: "FlyQuest", tag: "FLY", logo: "/equipes/flyquest.webp" },
  { name: "Fnatic", tag: "FNC", logo: "/equipes/fnatic.webp" },
  { name: "G2 Esports", tag: "G2", logo: "/equipes/g2.webp" },
  { name: "Gen.G", tag: "GEN", logo: "/equipes/geng.webp" },
  { name: "GiantX", tag: "GX", logo: "/equipes/giantx.webp" },
  { name: "Hanwha Life Esports", tag: "HLE", logo: "/equipes/hle.webp" },
  { name: "Invictus Gaming", tag: "IG", logo: "/equipes/invictus-gaming.webp" },
  { name: "JD Gaming", tag: "JDG", logo: "/equipes/jd-gaming.webp" },
  { name: "Karmine Corp", tag: "KC", logo: "/equipes/kc.webp" },
  { name: "KT Rolster", tag: "KT", logo: "/equipes/kt-rolster.webp" },
  { name: "LGD Gaming", tag: "LGD", logo: "/equipes/lgd-gaming.webp" },
  { name: "LNG Esports", tag: "LNG", logo: "/equipes/lng.webp" },
  { name: "Lunary", tag: "LNY", logo: "/equipes/lunary.webp" },
  { name: "Lyon Gaming", tag: "LYN", logo: "/equipes/lyon.webp" },
  { name: "Movistar KOI", tag: "MKOI", logo: "/equipes/mkoi.webp" },
  { name: "NAVI", tag: "NAVI", logo: "/equipes/navi.webp" },
  { name: "Ninjas in Pyjamas", tag: "NIP", logo: "/equipes/nip.webp" },
  { name: "Nongshim RedForce", tag: "NS", logo: "/equipes/nongshim.webp" },
  { name: "OMG", tag: "OMG", logo: "/equipes/omg.webp" },
  { name: "RNG", tag: "RNG", logo: "/equipes/royal-never-give-up.webp" },
  { name: "Sentinels", tag: "SEN", logo: "/equipes/sentinels.webp" },
  { name: "Shifters", tag: "SHF", logo: "/equipes/shifters.webp" },
  { name: "Shopify Rebellion", tag: "SR", logo: "/equipes/shopify-rebellion.webp" },
  { name: "SK Gaming", tag: "SK", logo: "/equipes/sk.webp" },
  { name: "Solary", tag: "SLY", logo: "/equipes/solary.webp" },
  { name: "Soopers", tag: "SPR", logo: "/equipes/soopers.webp" },
  { name: "T1", tag: "T1", logo: "/equipes/t1.webp" },
  { name: "Team Heretics", tag: "TH", logo: "/equipes/team-heretics.webp" },
  { name: "Team Liquid", tag: "TL", logo: "/equipes/team-liquid.webp" },
  { name: "ThunderTalk Gaming", tag: "TT", logo: "/equipes/thundertalk.webp" },
  { name: "Top Esports", tag: "TES", logo: "/equipes/top-esports.webp" },
  { name: "Team Vitality", tag: "VIT", logo: "/equipes/vitality.webp" },
  { name: "Team WE", tag: "WE", logo: "/equipes/we.webp" },
  { name: "Weibo Gaming", tag: "WBG", logo: "/equipes/weibo.webp" },
  { name: "ZyB", tag: "ZYB", logo: "/equipes/zyb.webp" }
];

function getUniqueBotTeam(pendingBots = []) {
  const usedLogos = state.participants.map(p => p.logo).filter(Boolean);
  const pendingLogos = pendingBots.map(b => b.logo).filter(Boolean);
  const allUsed = [...usedLogos, ...pendingLogos];
  
  const available = TEAMS_DB.filter(t => !allUsed.includes(t.logo));
  if (available.length === 0) return { name: `Bot Squad ${Math.floor(Math.random() * 1000)}`, tag: "BOT", logo: null };
  return available[Math.floor(Math.random() * available.length)];
}

const isBotCheck = (p) => p.id.startsWith('bot-') || p.isBot;

let state = {
  phase: 'lobby', participants: [], bracket: [], readyPlayers: [], resetPlayers: [], champion: null,
  currentRound: 0, roundComplete: false, roundReady: [],
  cardCollections: {}, activeLineups: {}, economy: {}, cardStats: {}, globalSecrets: {}, 
  lastOpenedPack: {}, starterPackClaimed: {}, seasonRound: 0, continueSeasonVotes: [],
  year: 1, eventIndex: 0, history: []    
};

function getAliveHumans() {
  const allHumans = state.participants.filter(p => !isBotCheck(p)).map(p => p.id);
  if (allHumans.length === 0) return [];
  
  let alive = new Set();
  
  if (state.tournamentPhase === 'swiss') {
    if (state.swissTeams) {
        state.swissTeams.forEach(t => {
          if (!isBotCheck(t.team) && t.losses < 3) alive.add(t.team.id);
        });
    }
  } else if (state.tournamentPhase === 'groups') {
    if (state.groups) {
        state.groups.forEach(g => {
          if (g.qualified.length === 2) {
            g.qualified.forEach(q => { if (!isBotCheck(q)) alive.add(q.id); });
          } else {
            g.teams.forEach(t => { if (!isBotCheck(t)) alive.add(t.id); });
          }
        });
    }
  } else if (state.tournamentPhase === 'bracket') {
    if (state.bracket) {
        state.bracket.flat().forEach(m => {
          if (m.status !== 'finished') {
            if (m.teamA && !isBotCheck(m.teamA)) alive.add(m.teamA.id);
            if (m.teamB && !isBotCheck(m.teamB)) alive.add(m.teamB.id);
          }
        });
    }
  }
  
  const aliveArr = Array.from(alive);
  return aliveArr.length > 0 ? aliveArr : allHumans;
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

function simulateGame(match, state) {
  const teamA = match.teamA;
  const teamB = match.teamB;
  
  let ratingA = getTeamRating(teamA) + (match.boBuffA || 0);
  let ratingB = getTeamRating(teamB) + (match.boBuffB || 0);
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
        label: result.label, 
        side: result.side, 
        ratingDelta: result.ratingDelta,
        targetRoles: result.targetRoles,
        persistentBO: result.persistentBO,
        image: result.image
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

  const probA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 11));
  const winnerSide = Math.random() < probA ? 'A' : 'B';
  return { winnerSide, events: triggeredEvents };
}

function tryStartMatch(match) {
  if (!match || match.status !== 'pending' || !match.teamA || !match.teamB) return;

  if (isBotCheck(match.teamA) && !match.ready.includes(match.teamA.id)) match.ready.push(match.teamA.id);
  if (isBotCheck(match.teamB) && !match.ready.includes(match.teamB.id)) match.ready.push(match.teamB.id);

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
  match.lastGameEvents = []; 
  
  const { winnerSide, events } = simulateGame(match, state);
  match.pendingEvents = events; 
  match.winnerSidePending = winnerSide;
  
  io.emit('draft-update', state);

  const isBotOnly = isBotCheck(match.teamA) && isBotCheck(match.teamB);
  
  const INIT_DELAY = isBotOnly ? 350 : 1200; 
  const EVENT_READ_DELAY = isBotOnly ? 50 : 4500; 
  const NO_EVENT_DELAY = isBotOnly ? 250 : 1500; 

  const processNextEvent = () => {
    if (match.pendingEvents && match.pendingEvents.length > 0) {
      const evsToPush = [];
      let isGenericEvent = false;
      
      while (match.pendingEvents.length > 0) {
        const ev = match.pendingEvents.shift();
        evsToPush.push(ev);
        
        if (ev.label) {
          if (ev.label === "Phase de lane très tactique, les deux équipes s'observent...") {
            isGenericEvent = true;
          }
          while (match.pendingEvents.length > 0 && !match.pendingEvents[0].label) {
            evsToPush.push(match.pendingEvents.shift());
          }
          break; 
        }
      }

      match.currentEvents.push(...evsToPush);
      io.emit('draft-update', state);
      
      const delay = isBotOnly ? 50 : (isGenericEvent ? NO_EVENT_DELAY : EVENT_READ_DELAY);
      matchTimeouts[match.id] = setTimeout(processNextEvent, delay);
      
    } else {
      match.status = 'simulating_result';
      io.emit('draft-update', state);
      
      const hasAnyRealEvent = match.currentEvents.some(e => e.label && e.label !== "Phase de lane très tactique, les deux équipes s'observent...");
      const RESULT_DELAY = isBotOnly ? 100 : (hasAnyRealEvent ? 4000 : 2000); 

      matchTimeouts[match.id] = setTimeout(() => {
        if (match.winnerSidePending === 'A') match.scoreA++; else match.scoreB++;
        match.games.push({ gameNumber: match.games.length + 1, winnerSide: match.winnerSidePending, events: match.currentEvents });
        match.lastGameEvents = match.currentEvents;
        
        match.currentEvents = [];
        match.pendingEvents = [];
        
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
          const GAME_GAP_MS = isBotOnly ? 100 : 2500; 
          matchTimeouts[match.id] = setTimeout(() => playNextGame(match), GAME_GAP_MS);
        }
      }, RESULT_DELAY);
    }
  };
  
  matchTimeouts[match.id] = setTimeout(processNextEvent, INIT_DELAY);
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

function startCardTournament() {
  const TOTAL_TEAMS = 16;
  const humanParticipants = state.participants.filter(p => !isBotCheck(p));
  const existingBots = state.participants.filter(p => isBotCheck(p));

  humanParticipants.forEach(p => {
    const lineup = state.activeLineups[p.id] || {};
    p.roster = ORDERED_ROLES.map(role => {
      const cardId = lineup[role];
      const baseCard = getCardById(cardId);
      const rosterEntry = cardToRosterEntry(baseCard);

      if (baseCard && baseCard.id.toLowerCase().includes('caliste') && baseCard.rarity === 'WANTED') {
        const played = state.cardStats?.[p.id]?.[cardId] || 0;
        rosterEntry.rating += played; 
      }
      return rosterEntry;
    });
  });

  if (existingBots.length === 0) {
    const numBots = TOTAL_TEAMS - humanParticipants.length;
    const bots = [];
    for (let i = 1; i <= numBots; i++) {
      const botId = `bot-${i}`;
      const botRoster = generateBotRosterFromCards();
      const botTeam = getUniqueBotTeam(bots);
      
      if (!state.cardCollections[botId]) state.cardCollections[botId] = {};
      if (!state.activeLineups[botId]) state.activeLineups[botId] = {};
      
      botRoster.forEach(card => {
          card.contract = 'LIFETIME';
          state.cardCollections[botId][card.id] = 'LIFETIME';
          state.activeLineups[botId][card.role] = card.id;
      });

      bots.push({ id: botId, name: botTeam.name, tag: botTeam.tag, logo: botTeam.logo, roster: botRoster, isBot: true });
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
    const sortedPlayers = [...state.participants].sort((a, b) => {
      const ptsA = state.seasonScores[a.id]?.points || 0;
      const ptsB = state.seasonScores[b.id]?.points || 0;
      if (ptsA !== ptsB) return ptsB - ptsA;
      const titlesA = state.seasonScores[a.id]?.titles || 0;
      const titlesB = state.seasonScores[b.id]?.titles || 0;
      return titlesB - titlesA;
    });

    const baseRewards = sortedPlayers.map((_, index) => {
      const reverseRank = sortedPlayers.length - 1 - index; 
      if (reverseRank === 0) return 400; 
      if (reverseRank === 1) return 300; 
      if (reverseRank === 2) return 200; 
      if (reverseRank === 3) return 100; 
      return 0; 
    });

    let currentRank = 0;
    while (currentRank < sortedPlayers.length) {
      let tieCount = 1;
      const areTied = (p1, p2) => {
        const s1 = state.seasonScores[p1.id];
        const s2 = state.seasonScores[p2.id];
        return s1.points === s2.points && s1.titles === s2.titles;
      };

      while (currentRank + tieCount < sortedPlayers.length && areTied(sortedPlayers[currentRank], sortedPlayers[currentRank + tieCount])) {
        tieCount++;
      }

      let totalPool = 0;
      for (let i = 0; i < tieCount; i++) totalPool += baseRewards[currentRank + i];
      const sharedReward = Math.floor(totalPool / tieCount);

      for (let i = 0; i < tieCount; i++) {
        catchupBonuses[sortedPlayers[currentRank + i].id] = sharedReward;
      }
      currentRank += tieCount;
    }
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

    moneyEarned += (catchupBonuses[p.id] || 0);
    state.seasonScores[p.id].points += pointsEarned;

    if (!isBotCheck(p)) {
      state.economy[p.id] += moneyEarned;
    } else {
      p.roster = p.roster.map(pro => {
        if (pro.id.toLowerCase().includes('caliste') && pro.rarity === 'WANTED') {
          pro.rating = (pro.rating || 89) + 1;
          pro.overall = (pro.overall || 89) + 1;
        }

        if (pro.contract === 'LIFETIME') return pro; 
        let currentContract = pro.contract !== undefined ? pro.contract : 3;
        currentContract -= 1;
        
        if (currentContract <= 0) {
          const collection = state.cardCollections[p.id] || {};
          const lifetimeIds = Object.keys(collection).filter(id => collection[id] === 'LIFETIME');
          
          let bestLifetime = null;
          lifetimeIds.forEach(id => {
              const card = getCardById(id);
              if (card && card.role === pro.role) {
                  if (!bestLifetime || (card.rating || card.overall || 0) > (bestLifetime.rating || bestLifetime.overall || 0)) {
                      bestLifetime = card;
                  }
              }
          });

          if (bestLifetime) {
              const newPro = cardToRosterEntry(bestLifetime);
              newPro.contract = 'LIFETIME'; 
              if (!state.activeLineups[p.id]) state.activeLineups[p.id] = {};
              state.activeLineups[p.id][pro.role] = newPro.id;
              return newPro;
          } else {
              let replacement = null;
              while(!replacement) replacement = openPack('standard').find(c => c.role === pro.role);
              const newPro = cardToRosterEntry(replacement);
              newPro.contract = 3; 
              if (!state.activeLineups[p.id]) state.activeLineups[p.id] = {};
              state.activeLineups[p.id][pro.role] = newPro.id;
              return newPro;
          }
        } else {
          pro.contract = currentContract;
          return pro;
        }
      });
      p.roster = upgradeBotRoster(p.roster, Math.floor(moneyEarned / 100));
      p.roster.forEach(c => {
          if (!state.activeLineups[p.id]) state.activeLineups[p.id] = {};
          state.activeLineups[p.id][c.role] = c.id;
      });
    }
  });
}

function startAllBotMatchesInCurrentRound() {
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
    tryStartMatch(m);
  });
}

// ==========================================
// DEBUT DES SOCKETS
// ==========================================
io.on('connection', (socket) => {
  
  socket.emit('draft-update', state);

  socket.on('takeover-bot', (botId, newName, newTag, newLogo) => {
    const bot = state.participants.find(p => p.id === botId);
    if (!bot) return;

    const oldId = bot.id;
    const newId = socket.id;

    bot.id = newId;
    bot.name = newName.trim() || bot.name;
    bot.tag = newTag ? newTag.trim().toUpperCase() : bot.tag;
    bot.logo = newLogo || bot.logo;
    bot.isBot = false; 

    const transferMap = (mapObj) => {
        if (mapObj && mapObj[oldId] !== undefined) {
            mapObj[newId] = mapObj[oldId];
            delete mapObj[oldId];
        }
    };

    transferMap(state.cardCollections);
    transferMap(state.activeLineups);
    transferMap(state.economy);
    transferMap(state.cardStats);
    transferMap(state.lastOpenedPack);
    transferMap(state.starterPackClaimed);
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
    if (currentContract !== 'LIFETIME') {
      state.cardCollections[id][cardId] = currentContract + 5; 
    }
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
        state.cardCollections = {};
        state.activeLineups = {};
        state.pendingPacks = {};
        state.lastOpenedPack = {};
        state.starterPackClaimed = {};
        state.seasonRound = 1;
        state.continueSeasonVotes = [];
        state.seasonScores = null; 
        state.economy = {}; 
        state.cardStats = {}; 
        state.globalSecrets = {};
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
          state.economy[p.id] = 100; 
        });
        state.phase = 'cards';
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
    
    SECRET_UNLOCKS.forEach(secret => {
      secret.checkAndApply(match, state, io);
    });

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
          if (currentContract === 'LIFETIME' || contractToAdd === 'LIFETIME') {
            state.cardCollections[id][cardId] = 'LIFETIME';
          } else {
            state.cardCollections[id][cardId] = currentContract + contractToAdd;
          }
        });
        delete state.pendingPackResults[id];
      }
      if (state.lastOpenedPack[id]) state.lastOpenedPack[id] = [];
      io.emit('draft-update', state);
    }
  });

  socket.on('sell-card', (cardId) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    const collection = state.cardCollections[id];
    if (!collection || collection[cardId] === undefined || collection[cardId] === 0) return;
    if (collection[cardId] === 'LIFETIME') return;

    const lineup = state.activeLineups[id] || {};
    if (Object.values(lineup).includes(cardId)) return;

    const card = getCardById(cardId);
    if (!card) return;

    let price = 10; 
    if (card.rarity === 'Rare') price = 25;
    else if (card.rarity === 'Épique') price = 50;
    else if (card.rarity === 'Légendaire' || card.rarity === 'WANTED') price = 100;

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
    if (state.readyPlayers.length === humanCount && humanCount > 0) startCardTournament();
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
                } else {
                    texteRecompense = " \nUN BOT A VOLÉ CE SUCCÈS UNIQUE !";
                }

                goldenRoadData = {
                    title: "THE GOLDEN ROAD",
                    description: `L'exploit parfait. ${winnerName} a remporté tous les trophées de l'année ${state.year} sans en laisser un seul.${texteRecompense}`,
                    image: '/cardsImg/others/golden_road.jpg'
                };
            }
         }

         endOfYearRecap = { year: state.year, history: currentYearHistory, goldenRoadSecret: goldenRoadData };
         state.eventIndex = 0; 
         state.year += 1; 
      }

      state.continueSeasonVotes = []; state.readyPlayers = []; state.champion = null; state.bracket = []; state.currentRound = 0; state.roundComplete = false; state.roundReady = []; state.seasonRound += 1; state.phase = 'cards';

      if (endOfYearRecap) {
         state.endOfYearRecap = endOfYearRecap;
         setTimeout(() => {
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
                  if (!isBotCheck(match.teamA) || !isBotCheck(match.teamB)) hasHumanInWave = true;
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
              if (!isBotCheck(match.teamA) || !isBotCheck(match.teamB)) hasHumanInWave = true;
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
      
      const allHumans = state.participants.filter(p => !isBotCheck(p)).map(p => p.id);
      if (allHumans.includes(socket.id)) {
        if (!state.roundReady.includes(socket.id)) state.roundReady.push(socket.id);
      }

      const requiredHumans = getAliveHumans();

      if (requiredHumans.length > 0 && requiredHumans.every(id => state.roundReady.includes(id))) {
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

    const humanCount = state.participants.filter(p => !isBotCheck(p)).length;

    if (humanCount === 0 || state.resetPlayers.length >= humanCount) {
      state.participants = state.participants.filter(p => !isBotCheck(p));
      state.participants.forEach(p => p.roster = []);
      state.phase = 'lobby';
      state.bracket = [];
      state.champion = null;
      state.readyPlayers = [];
      state.resetPlayers = [];
      state.turnIndex = 0;
      state.currentRound = 0;
      state.roundComplete = false;
      state.roundReady = [];
      state.cardCollections = {};
      state.activeLineups = {};
      state.economy = {};
      state.cardStats = {}; 
      state.globalSecrets = {}; 
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
    const player = state.participants.find(p => p.id === socket.id);
    const humansBefore = state.participants.filter(p => !isBotCheck(p)).length;

    if (player) {
        if (state.phase === 'lobby') {
            state.participants = state.participants.filter(p => p.id !== socket.id);
            delete state.cardCollections[socket.id]; 
            delete state.activeLineups[socket.id]; 
            delete state.economy[socket.id]; 
            delete state.cardStats?.[socket.id]; 
            delete state.lastOpenedPack[socket.id]; 
            delete state.starterPackClaimed[socket.id];
        } else {
            player.isBot = true; 
            state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
            state.roundReady = state.roundReady.filter(id => id !== socket.id);
            state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
            state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);
        }
    }

    const humansAfter = state.participants.filter(p => !isBotCheck(p)).length;

    if (humansAfter === 0 && humansBefore > 0 && state.phase !== 'lobby') {
        state.phase = 'lobby';
        state.champion = null;
        state.participants = [];
        state.resetPlayers = [];
        state.readyPlayers = []; 
        state.roundReady = [];   
        state.cardCollections = {};
        state.activeLineups = {};
        state.economy = {}; 
        state.cardStats = {}; 
        state.globalSecrets = {}; 
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
    }
    
    io.emit('draft-update', state);
  });
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(3001, '0.0.0.0', () => console.log('Serveur Esport actif sur le port 3001'));