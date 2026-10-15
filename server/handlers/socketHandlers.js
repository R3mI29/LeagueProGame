import { state } from '../state/gameState.js';
import { registerLobbyHandlers } from './lobbyHandlers.js';
import { registerCardHandlers } from './cardHandlers.js';
import { registerTournamentHandlers } from './tournamentHandlers.js';
import { registerSaveHandlers } from './saveHandlers.js';
import { registerDevHandlers } from './devHandlers.js';

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

  const context = {
    state,
    gameManager,
    getCurrentPlayer,
    isCurrentPlayerHost,
  };

  registerLobbyHandlers(io, socket, context);
  registerCardHandlers(io, socket, context);
  registerTournamentHandlers(io, socket, context);
  registerSaveHandlers(io, socket, context);
  registerDevHandlers(io, socket, context);
}