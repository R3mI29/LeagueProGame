import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PRO_PLAYERS } from '../src/constants.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// Stockage de toutes les parties en cours
const games = {};
// Suivi de quel joueur est dans quelle partie
const socketToRoom = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  } while (games[code]);
  return code;
}

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

function advanceTeam(state, team, nextId, nextSlot) {
  if (!nextId) { state.champion = team; return; }
  const nextMatch = state.bracket.flat().find(m => m.id === nextId);
  if (nextMatch) nextMatch[nextSlot] = team;
}

function tryStartMatch(state, match, roomCode) {
  if (!match || match.status !== 'pending' || !match.teamA || !match.teamB) return;
  if (match.teamA.id.startsWith('bot-') && !match.ready.includes(match.teamA.id)) match.ready.push(match.teamA.id);
  if (match.teamB.id.startsWith('bot-') && !match.ready.includes(match.teamB.id)) match.ready.push(match.teamB.id);

  if (match.ready.length === 2) {
    match.status = 'simulating';
    io.to(roomCode).emit('draft-update', state);
    
    setTimeout(() => {
      match.winner = resolveMatchMath(match.teamA, match.teamB);
      match.status = 'finished';
      advanceTeam(state, match.winner, match.nextId, match.nextSlot);
      io.to(roomCode).emit('draft-update', state);
      
      if (match.nextId) {
        const nextMatch = state.bracket.flat().find(m => m.id === match.nextId);
        tryStartMatch(state, nextMatch, roomCode);
      }
    }, 10000);
  }
}

io.on('connection', (socket) => {
  
  socket.on('create-room', (name) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const roomCode = generateRoomCode();
    
    games[roomCode] = {
      roomCode, phase: 'lobby', participants: [{ id: socket.id, name: cleanName, roster: [] }],
      availablePlayers: [], turnIndex: 0, currentOptions: [], bracket: [], readyPlayers: [], champion: null
    };
    
    socketToRoom[socket.id] = roomCode;
    socket.join(roomCode);
    io.to(roomCode).emit('draft-update', games[roomCode]);
  });

  socket.on('join-room', ({ name, code }) => {
    const cleanName = name.trim();
    const cleanCode = code.toUpperCase().trim();
    const state = games[cleanCode];

    if (!state) return socket.emit('error', 'Code invalide ou partie introuvable.');
    if (state.phase !== 'lobby') return socket.emit('error', 'Partie déjà en cours.');
    if (state.participants.length >= 8) return socket.emit('error', 'Salon plein.');
    if (state.participants.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) return socket.emit('error', 'Ce pseudo est déjà pris dans ce salon.');

    state.participants.push({ id: socket.id, name: cleanName, roster: [] });
    socketToRoom[socket.id] = cleanCode;
    socket.join(cleanCode);
    io.to(cleanCode).emit('draft-update', state);
  });

  socket.on('start-draft', () => {
    const roomCode = socketToRoom[socket.id];
    const state = games[roomCode];
    if (state && state.phase === 'lobby' && state.participants.length >= 2) {
      state.phase = 'draft';
      state.availablePlayers = [...PRO_PLAYERS];
      state.turnIndex = 0;
      state.currentOptions = getOptionsForParticipant(state.participants[0], state.availablePlayers);
      io.to(roomCode).emit('draft-update', state);
    }
  });

  socket.on('pick-player', (playerId) => {
    const roomCode = socketToRoom[socket.id];
    const state = games[roomCode];
    if (!state || state.phase !== 'draft') return;
    
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
      io.to(roomCode).emit('draft-update', state);
    }
  });

  socket.on('toggle-ready', () => {
    const roomCode = socketToRoom[socket.id];
    const state = games[roomCode];
    if (state && state.phase === 'tournament') {
      if (state.readyPlayers.includes(socket.id)) state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      else state.readyPlayers.push(socket.id);
      
      const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
      
      if (state.readyPlayers.length === humanCount && humanCount > 0) {
        state.phase = 'simulation';
        state.bracket[0].forEach(match => tryStartMatch(state, match, roomCode));
      }
      io.to(roomCode).emit('draft-update', state);
    }
  });

  socket.on('match-ready', (matchId) => {
    const roomCode = socketToRoom[socket.id];
    const state = games[roomCode];
    if (!state) return;
    
    const match = state.bracket.flat().find(m => m.id === matchId);
    if (!match || match.status !== 'pending') return;
    if (!match.ready.includes(socket.id)) match.ready.push(socket.id);
    tryStartMatch(state, match, roomCode);
  });

  socket.on('dismiss-match', (matchId) => {
    const roomCode = socketToRoom[socket.id];
    const state = games[roomCode];
    if (!state) return;

    const match = state.bracket.flat().find(m => m.id === matchId);
    if (match && !match.dismissedBy.includes(socket.id)) {
      match.dismissedBy.push(socket.id);
      io.to(roomCode).emit('draft-update', state);
    }
  });

  socket.on('disconnect', () => {
    const roomCode = socketToRoom[socket.id];
    if (!roomCode) return;
    
    const state = games[roomCode];
    if (state && !socket.id.startsWith('bot-')) {
      const humansBefore = state.participants.filter(p => !p.id.startsWith('bot-')).length;
      state.participants = state.participants.filter(p => p.id !== socket.id);
      const humansAfter = state.participants.filter(p => !p.id.startsWith('bot-')).length;
      
      if (humansAfter === 0 && humansBefore > 0) {
        delete games[roomCode]; // Détruit la partie si le salon est vide
      } else {
        io.to(roomCode).emit('draft-update', state);
      }
    }
    delete socketToRoom[socket.id];
  });
});

server.listen(3001, () => console.log('Serveur Esport actif sur le port 3001'));