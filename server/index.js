import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PRO_PLAYERS } from '../src/constants.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] } });

let state = {
  phase: 'lobby',
  participants: [],
  availablePlayers: [],
  turnIndex: 0,
  currentOptions: [],
  bracket: [],
  readyPlayers: [] // Stocke les ID des joueurs ayant cliqué sur "Prêt"
};

function getOptionsForParticipant(participant, availablePool) {
  const allRoles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  const missingRoles = allRoles.filter(role => !participant.roster.some(p => p.role === role));
  const options = [];
  for (const role of missingRoles) {
    const playersInRole = availablePool.filter(p => p.role === role);
    if (playersInRole.length > 0) {
      options.push(playersInRole[Math.floor(Math.random() * playersInRole.length)]);
    }
  }
  return options;
}

io.on('connection', (socket) => {
  socket.emit('draft-update', state);

  socket.on('join-lobby', (name) => {
    if (state.phase !== 'lobby' || state.participants.length >= 8) return;
    if (!state.participants.find(p => p.id === socket.id)) {
      state.participants.push({ id: socket.id, name, roster: [] });
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
      const pickedPlayer = state.currentOptions.find(p => p.id === playerId);
      activeParticipant.roster.push(pickedPlayer);
      state.availablePlayers = state.availablePlayers.filter(p => p.id !== playerId);
      
      const isFinished = state.participants.every(p => p.roster.length === 5);
      if (isFinished) {
        state.phase = 'finished';
        state.currentOptions = [];
      } else {
        state.turnIndex = (state.turnIndex + 1) % state.participants.length;
        state.currentOptions = getOptionsForParticipant(state.participants[state.turnIndex], state.availablePlayers);
      }
      io.emit('draft-update', state);
    }
  });

  // Nouveau : Création de l'arbre
  socket.on('generate-bracket', () => {
    if (state.phase === 'finished') {
      state.phase = 'tournament';
      state.readyPlayers = [];
      
      // Mélange aléatoire des participants
      const shuffled = [...state.participants].sort(() => 0.5 - Math.random());
      
      // Création de 4 matchs de Quarts de finale
      const qf = [];
      for (let i = 0; i < 4; i++) {
        qf.push({
          id: `qf-${i}`,
          teamA: shuffled[i] || null,        // Joueurs 1 à 4
          teamB: shuffled[i + 4] || null     // Joueurs 5 à 8
        });
      }
      
      const sf = [ { id: 'sf-0', teamA: null, teamB: null }, { id: 'sf-1', teamA: null, teamB: null } ];
      const final = [ { id: 'f-0', teamA: null, teamB: null } ];
      
      state.bracket = [qf, sf, final];
      io.emit('draft-update', state);
    }
  });

  // Nouveau : Gestion du bouton Prêt
  socket.on('toggle-ready', () => {
    if (state.phase === 'tournament') {
      if (state.readyPlayers.includes(socket.id)) {
        state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      } else {
        state.readyPlayers.push(socket.id);
      }

      // Si tout le monde est prêt, on passe à l'étape suivante (Simulation)
      if (state.readyPlayers.length === state.participants.length && state.participants.length > 0) {
        state.phase = 'simulation'; 
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('disconnect', () => {
    state.participants = state.participants.filter(p => p.id !== socket.id);
    if (state.participants.length === 0) state.phase = 'lobby'; 
    io.emit('draft-update', state);
  });
});

server.listen(3001, () => console.log('Serveur Esport actif sur le port 3001'));