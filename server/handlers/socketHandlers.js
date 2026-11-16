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
  const isCurrentPlayerHost = () => {
    const player = getCurrentPlayer();
    if (!player) return false;
    if (player.isHost) return true;
    const humanParticipants = state.participants.filter(p => !p.id.startsWith('bot-') && !p.isPermanentBot && !p.isBot);
    if (humanParticipants.length <= 1) {
      player.isHost = true;
      return true;
    }
    const currentHost = state.participants.find(p => p.isHost && !p.isBot);
    if (!currentHost && humanParticipants[0]?.id === player.id) {
      player.isHost = true;
      return true;
    }
    return false;
  };

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
