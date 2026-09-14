import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PRO_PLAYERS } from '../src/constants.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

let state = {
  phase: 'lobby', participants: [], availablePlayers: [], turnIndex: 0,
  currentOptions: [], bracket: [], readyPlayers: [], resetPlayers: [], champion: null
};

function getOptionsForParticipant(participant, availablePool) {
  const allRoles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  const missingRoles = allRoles.filter(role => !participant.roster.some(p => p.role === role));
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
      io.emit('draft-update', state);
      
      if (match.nextId) {
        const nextMatch = state.bracket.flat().find(m => m.id === match.nextId);
        tryStartMatch(nextMatch);
      }
    }, 10000);
  }
}

io.on('connection', (socket) => {
  socket.emit('draft-update', state);

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
      state.phase = 'draft';
      state.availablePlayers = [...PRO_PLAYERS];
      state.turnIndex = 0;
      state.currentOptions = getOptionsForParticipant(state.participants[0], state.availablePlayers);
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
        const numBots = 8 - state.participants.length;
        for (let i = 1; i <= numBots; i++) {
          const bot = { id: `bot-${i}`, name: `Bot ${i}`, roster: [] };
          ['Top', 'Jungle', 'Mid', 'ADC', 'Support'].forEach(role => {
            const pool = state.availablePlayers.filter(p => p.role === role);
            const pick = pool[Math.floor(Math.random() * pool.length)];
            bot.roster.push(pick);
            state.availablePlayers = state.availablePlayers.filter(p => p.id !== pick.id);
          });
          state.participants.push(bot);
        }

        state.phase = 'tournament';
        state.currentOptions = [];
        state.readyPlayers = [];
        const shuffled = [...state.participants].sort(() => 0.5 - Math.random());
        const qf = [];
        for (let i = 0; i < 4; i++) {
          qf.push({ 
            id: `qf-${i}`, teamA: shuffled[i], teamB: shuffled[i + 4], 
            status: 'pending', ready: [], dismissedBy: [], winner: null, 
            nextId: `sf-${Math.floor(i/2)}`, nextSlot: i % 2 === 0 ? 'teamA' : 'teamB' 
          });
        }
        const sf = [
          { id: 'sf-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, nextId: 'f-0', nextSlot: 'teamA' },
          { id: 'sf-1', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, nextId: 'f-0', nextSlot: 'teamB' }
        ];
        state.bracket = [qf, sf, [{ id: 'f-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, nextId: null, nextSlot: null }]];
      } else {
        state.turnIndex = (state.turnIndex + 1) % state.participants.length;
        state.currentOptions = getOptionsForParticipant(state.participants[state.turnIndex], state.availablePlayers);
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('toggle-ready', () => {
    if (state.phase === 'tournament') {
      if (state.readyPlayers.includes(socket.id)) state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      else state.readyPlayers.push(socket.id);
      
      const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
      
      if (state.readyPlayers.length === humanCount && humanCount > 0) {
        state.phase = 'simulation';
        state.bracket[0].forEach(match => tryStartMatch(match));
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

  socket.on('toggle-reset', () => {
    if (state.phase === 'simulation' && state.champion) {
      if (state.resetPlayers.includes(socket.id)) {
        state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
      } else {
        state.resetPlayers.push(socket.id);
      }

      const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      if (state.resetPlayers.length === humanCount && humanCount > 0) {
        // Purge les bots et réinitialise les rosters humains
        state.participants = state.participants.filter(p => !p.id.startsWith('bot-'));
        state.participants.forEach(p => p.roster = []);
        state.phase = 'lobby';
        state.bracket = [];
        state.champion = null;
        state.readyPlayers = [];
        state.resetPlayers = [];
        state.turnIndex = 0;
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
        state.champion = null;
        state.participants = []; 
        state.resetPlayers = [];
      }
      io.emit('draft-update', state);
    }
  });
});

server.listen(3001, () => console.log('Serveur Esport actif sur le port 3001'));