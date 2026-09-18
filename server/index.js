import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PRO_PLAYERS } from '../src/constants/players.js';
import { ORDERED_ROLES } from '../src/constants/roles.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Bypass-Tunnel-Reminder"]
  }
});

// --- Réglages du mode "Draft aux enchères" ---
const STARTING_BUDGET = 1000;
const MIN_BID = 10;
const MIN_INCREMENT = 5;
const BID_TIMER_MS = 15000; // délai avant adjudication après la dernière enchère

let auctionTimer = null;

let state = {
  phase: 'lobby', gameMode: null, participants: [], availablePlayers: [], turnIndex: 0,
  currentOptions: [], bracket: [], readyPlayers: [], resetPlayers: [], champion: null,
  currentRound: 0, roundComplete: false, roundReady: [],
  auction: null, budgets: {},
  // Joueurs "passés" (skip) durant les enchères : ils ne sont plus jamais
  // reproposés aux humains, mais restent piochables par les bots en fin de draft.
  skippedPlayers: []
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

function getTeamRating(team) {
  if (!team || !team.roster || team.roster.length === 0) return 0;
  return Math.round(team.roster.reduce((acc, p) => acc + p.rating, 0) / team.roster.length);
}

function resolveMatchMath(teamA, teamB) {
  const ratingA = getTeamRating(teamA);
  const ratingB = getTeamRating(teamB);
  const probA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 20));
  return Math.random() < probA ? teamA : teamB;
}

function advanceTeam(team, nextId, nextSlot) {
  if (!nextId) { state.champion = team; return; }
  const nextMatch = state.bracket.flat().find(m => m.id === nextId);
  if (nextMatch) nextMatch[nextSlot] = team;
}

function tryStartMatch(match) {
  if (!match || match.status !== 'pending' || !match.teamA || !match.teamB) return;

  if (match.teamA.id.startsWith('bot-') && !match.ready.includes(match.teamA.id)) match.ready.push(match.teamA.id);
  if (match.teamB.id.startsWith('bot-') && !match.ready.includes(match.teamB.id)) match.ready.push(match.teamB.id);

  if (match.ready.length === 2) {
    match.status = 'simulating';
    io.emit('draft-update', state);

    setTimeout(() => {
      match.winner = resolveMatchMath(match.teamA, match.teamB);
      match.status = 'finished';
      advanceTeam(match.winner, match.nextId, match.nextSlot);

      const allFinished = state.bracket[state.currentRound].every(m => m.status === 'finished');
      if (allFinished && !state.champion) {
        state.roundComplete = true;
      }

      io.emit('draft-update', state);
    }, 10000);
  }
}

/**
 * Une fois que tous les commandants humains ont un roster complet (5/5),
 * complète les places restantes avec des bots et met en place le tournoi.
 * Utilisé à la fois par la draft classique/aveugle et par la draft aux enchères.
 */
function completeDraftAndStartTournament() {
  const numBots = 8 - state.participants.length;
  const teamNames = ["JD Gaming", "GenG", "T1", "Karmine Corp", "FearX", "Team WE", "Edward Gaming", "Royal Never Give Up", "Samsung White", "Samsung Blue", "Griffin", "Royal Club", "Hanwha Life Esport", "Movistar KOI", "GiantX", "KT Rolster", "SKT T1", "Damwon Gaming", "Bilibili Gaming", "Nongshim Redforce", "Lyon", "Flyquest", "Top Esport", "Invictus Gaming", "Anyone's Legend", "ZYB", "Solary", "Fnatic"];
  for (let i = 1; i <= numBots; i++) {
    const bot = { id: `bot-${i}`, name: teamNames[Math.floor(Math.random() * teamNames.length)], roster: [] };
    ORDERED_ROLES.forEach(role => {
      // Pool des bots = joueurs disponibles + joueurs passés durant les enchères
      const pool = [...state.availablePlayers, ...state.skippedPlayers].filter(p => p.role === role);
      if (pool.length === 0) return; // sécurité, ne devrait pas arriver
      const pick = pool[Math.floor(Math.random() * pool.length)];
      bot.roster.push(pick);
      state.availablePlayers = state.availablePlayers.filter(p => p.id !== pick.id);
      state.skippedPlayers = state.skippedPlayers.filter(p => p.id !== pick.id);
    });
    state.participants.push(bot);
  }

  state.phase = 'tournament';
  state.currentOptions = [];
  state.readyPlayers = [];
  state.auction = null;

  const shuffled = [...state.participants].sort(() => 0.5 - Math.random());
  const qf = [];
  for (let i = 0; i < 4; i++) {
    qf.push({
      id: `qf-${i}`, teamA: shuffled[i], teamB: shuffled[i + 4],
      status: 'pending', ready: [], dismissedBy: [], winner: null,
      nextId: `sf-${Math.floor(i / 2)}`, nextSlot: i % 2 === 0 ? 'teamA' : 'teamB'
    });
  }
  const sf = [
    { id: 'sf-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, nextId: 'f-0', nextSlot: 'teamA' },
    { id: 'sf-1', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, nextId: 'f-0', nextSlot: 'teamB' }
  ];
  state.bracket = [qf, sf, [{ id: 'f-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, nextId: null, nextSlot: null }]];
}

// --- Logique de la draft aux enchères ---

function clearAuctionTimer() {
  if (auctionTimer) {
    clearTimeout(auctionTimer);
    auctionTimer = null;
  }
}

function getRoleNeeders(role) {
  return state.participants.filter(
    p => !p.id.startsWith('bot-') && !p.roster.some(pro => pro.role === role)
  );
}

/**
 * Fait apparaître le prochain joueur pro aux enchères, pour le premier rôle
 * (dans l'ordre ORDERED_ROLES) encore recherché par au moins un humain.
 * - S'il ne reste qu'1 seul humain à avoir besoin de ce rôle : acquisition
 *   obligatoire au prix minimum (pas d'enchère, pas de skip possible).
 * - S'il en reste 2 ou plus : enchère classique + possibilité de voter à
 *   l'unanimité pour "passer" ce joueur, seulement si le stock restant du
 *   rôle suffit encore à satisfaire tout le monde.
 * Si plus personne n'a besoin d'aucun rôle, la draft est terminée.
 */
function startAuctionRound() {
  clearAuctionTimer();

  for (const role of ORDERED_ROLES) {
    const needers = getRoleNeeders(role);
    if (needers.length === 0) continue;

    let pool = state.availablePlayers.filter(p => p.role === role);
    if (pool.length === 0) {
      // Filet de sécurité : si tous les joueurs de ce rôle ont été passés,
      // on repioche exceptionnellement dans la réserve "skip" plutôt que
      // de bloquer un humain qui a encore besoin de ce rôle.
      pool = state.skippedPlayers.filter(p => p.role === role);
    }
    if (pool.length === 0) continue; // vraiment plus aucun joueur de ce rôle

    const player = pool[Math.floor(Math.random() * pool.length)];
    const contenders = needers.map(p => p.id);
    const forced = contenders.length === 1;

    state.auction = {
      player,
      role,
      contenders,
      highestBid: 0,
      highestBidderId: null,
      minBid: MIN_BID,
      increment: MIN_INCREMENT,
      forced,
      skipVotes: [],
      // Un joueur passé n'est pas perdu (il reste disponible pour une
      // prochaine enchère ou pour les bots), donc le skip est toujours
      // possible dès qu'il y a au moins 2 prétendants.
      skipEligible: !forced,
      deadline: null
    };
    return;
  }

  // Plus aucun rôle recherché : fin de la phase d'enchères
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

function discardAuctionPlayer() {
  const auction = state.auction;
  if (!auction) return;
  // Le joueur "passé" est retiré des enchères pour de bon : il ne sera plus
  // jamais reproposé aux humains, mais reste disponible pour les bots
  // générés en fin de draft.
  state.availablePlayers = state.availablePlayers.filter(p => p.id !== auction.player.id);
  if (!state.skippedPlayers.some(p => p.id === auction.player.id)) {
    state.skippedPlayers.push(auction.player);
  }
  state.auction = null;
  startAuctionRound();
}

/**
 * Recalcule l'enchère en cours après la déconnexion d'un commandant
 * (retire sa mise éventuelle, met à jour les prétendants restants).
 */
function refreshAuctionAfterDisconnect() {
  if (state.phase !== 'auction' || !state.auction) return;

  const needers = getRoleNeeders(state.auction.role);
  if (needers.length === 0) {
    clearAuctionTimer();
    discardAuctionPlayer();
    return;
  }

  const auction = state.auction;
  auction.contenders = needers.map(p => p.id);
  auction.skipVotes = auction.skipVotes.filter(id => auction.contenders.includes(id));

  if (!auction.contenders.includes(auction.highestBidderId)) {
    auction.highestBid = 0;
    auction.highestBidderId = null;
    auction.deadline = null;
    clearAuctionTimer();
  }

  auction.forced = auction.contenders.length === 1;
  auction.skipEligible = !auction.forced;
}

io.on('connection', (socket) => {
  socket.emit('draft-update', state);

  socket.on('select-mode', (modeId) => {
    if (state.phase === 'lobby' && state.gameMode === null) {
      state.gameMode = modeId;
      io.emit('draft-update', state);
    }
  });

  socket.on('join-lobby', (name) => {
    if (state.phase !== 'lobby' || state.participants.length >= 8) return;
    const cleanName = name.trim();
    if (state.participants.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) return;
    if (!state.participants.find(p => p.id === socket.id)) {
      state.participants.push({ id: socket.id, name: cleanName, roster: [] });
      io.emit('draft-update', state);
    }
  });

  socket.on('start-draft', () => {
    if (state.phase === 'lobby' && state.participants.length >= 2) {
      state.availablePlayers = [...PRO_PLAYERS];

      if (state.gameMode === 'draft_encheres') {
        state.budgets = {};
        state.skippedPlayers = [];
        state.participants.forEach(p => { state.budgets[p.id] = STARTING_BUDGET; });
        state.phase = 'auction';
        startAuctionRound();
      } else {
        state.phase = 'draft';
        state.turnIndex = 0;
        state.currentOptions = getOptionsForParticipant(state.participants[0], state.availablePlayers);
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('pick-player', (playerId) => {
    if (state.phase !== 'draft') return;
    const activeParticipant = state.participants[state.turnIndex];

    if (activeParticipant.id === socket.id && state.currentOptions.find(p => p.id === playerId)) {
      activeParticipant.roster.push(state.currentOptions.find(p => p.id === playerId));
      state.availablePlayers = state.availablePlayers.filter(p => p.id !== playerId);

      if (state.participants.every(p => p.roster.length === 5)) {
        completeDraftAndStartTournament();
      } else {
        state.turnIndex = (state.turnIndex + 1) % state.participants.length;
        state.currentOptions = getOptionsForParticipant(state.participants[state.turnIndex], state.availablePlayers);
      }
      io.emit('draft-update', state);
    }
  });

  // --- Événements de la draft aux enchères ---

  socket.on('place-bid', (amount) => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.contenders.includes(socket.id)) return;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return;

    const minRequired = auction.highestBid === 0 ? auction.minBid : auction.highestBid + auction.increment;
    if (numericAmount < minRequired) return;

    const budget = state.budgets[socket.id] ?? STARTING_BUDGET;
    if (numericAmount > budget) return;

    auction.highestBid = numericAmount;
    auction.highestBidderId = socket.id;
    auction.skipVotes = []; // une nouvelle enchère annule les votes de passage en cours

    clearAuctionTimer();
    auction.deadline = Date.now() + BID_TIMER_MS;
    auctionTimer = setTimeout(() => {
      if (state.auction === auction && auction.highestBidderId) {
        assignAuctionPlayer(auction.highestBidderId, auction.highestBid);
        io.emit('draft-update', state);
      }
    }, BID_TIMER_MS);

    io.emit('draft-update', state);
  });

  socket.on('acquire-forced', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || !auction.forced) return;
    if (!auction.contenders.includes(socket.id)) return;

    assignAuctionPlayer(socket.id, auction.minBid);
    io.emit('draft-update', state);
  });

  socket.on('toggle-skip-vote', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced || !auction.skipEligible) return;
    if (!auction.contenders.includes(socket.id)) return;

    if (auction.skipVotes.includes(socket.id)) {
      auction.skipVotes = auction.skipVotes.filter(id => id !== socket.id);
    } else {
      auction.skipVotes.push(socket.id);
    }

    if (auction.skipVotes.length === auction.contenders.length) {
      clearAuctionTimer();
      discardAuctionPlayer();
    }
    io.emit('draft-update', state);
  });

  socket.on('toggle-ready', () => {
    if (state.phase === 'tournament') {
      if (state.readyPlayers.includes(socket.id)) state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      else state.readyPlayers.push(socket.id);

      const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      if (state.readyPlayers.length === humanCount && humanCount > 0) {
        state.phase = 'simulation';
        state.currentRound = 0;
        state.roundComplete = false;
        state.roundReady = [];

        state.bracket[0].forEach(match => {
          if (match.teamA && !match.teamB) { match.status = 'finished'; match.winner = match.teamA; advanceTeam(match.winner, match.nextId, match.nextSlot); }
          else if (!match.teamA && !match.teamB) { match.status = 'finished'; match.winner = null; }
        });

        const allFinished = state.bracket[0].every(m => m.status === 'finished');
        if (allFinished && !state.champion) state.roundComplete = true;
        else state.bracket[0].forEach(match => tryStartMatch(match));
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('match-ready', (matchId) => {
    const match = state.bracket.flat().find(m => m.id === matchId);
    if (!match || match.status !== 'pending') return;
    if (!match.ready.includes(socket.id)) match.ready.push(socket.id);
    tryStartMatch(match);
  });

  socket.on('dismiss-match', (matchId) => {
    const match = state.bracket.flat().find(m => m.id === matchId);
    if (match && !match.dismissedBy.includes(socket.id)) {
      match.dismissedBy.push(socket.id);
      io.emit('draft-update', state);
    }
  });

  socket.on('advance-round', () => {
    if (state.phase === 'simulation' && state.roundComplete) {

      const nextRoundMatches = state.bracket[state.currentRound + 1];
      const activeHumanIds = [];
      if (nextRoundMatches) {
        nextRoundMatches.forEach(match => {
          if (match.teamA && !match.teamA.id.startsWith('bot-')) activeHumanIds.push(match.teamA.id);
          if (match.teamB && !match.teamB.id.startsWith('bot-')) activeHumanIds.push(match.teamB.id);
        });
      }

      const allHumans = state.participants.filter(p => !p.id.startsWith('bot-')).map(p => p.id);
      const requiredVoters = activeHumanIds.length > 0 ? activeHumanIds : allHumans;

      if (requiredVoters.includes(socket.id)) {
        if (!state.roundReady.includes(socket.id)) state.roundReady.push(socket.id);
      }

      if (state.roundReady.length === requiredVoters.length) {
        state.currentRound++;
        state.roundComplete = false;
        state.roundReady = [];

        state.bracket[state.currentRound].forEach(match => {
          if (match.teamA && !match.teamB) { match.status = 'finished'; match.winner = match.teamA; advanceTeam(match.winner, match.nextId, match.nextSlot); }
          else if (!match.teamA && !match.teamB) { match.status = 'finished'; match.winner = null; }
        });

        const allFinished = state.bracket[state.currentRound].every(m => m.status === 'finished');
        if (allFinished && !state.champion) state.roundComplete = true;
        else state.bracket[state.currentRound].forEach(match => tryStartMatch(match));
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('toggle-reset', () => {
    if (state.phase === 'simulation' && state.champion) {
      if (state.resetPlayers.includes(socket.id)) state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
      else state.resetPlayers.push(socket.id);

      const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      if (state.resetPlayers.length === humanCount && humanCount > 0) {
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
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('disconnect', () => {
    if (!socket.id.startsWith('bot-')) {
      const humansBefore = state.participants.filter(p => !p.id.startsWith('bot-')).length;
      state.participants = state.participants.filter(p => p.id !== socket.id);
      const humansAfter = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      if (humansAfter === 0 && humansBefore > 0) {
        state.phase = 'lobby';
        state.gameMode = null;
        state.champion = null;
        state.participants = [];
        state.resetPlayers = [];
        state.auction = null;
        state.budgets = {};
        state.skippedPlayers = [];
        clearAuctionTimer();
      } else {
        refreshAuctionAfterDisconnect();
      }
      io.emit('draft-update', state);
    }
  });
});

server.listen(3001, () => console.log('Serveur Esport actif sur le port 3001'));