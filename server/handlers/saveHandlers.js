import { rm } from 'node:fs/promises';
import path from 'node:path';
import { state as defaultState, resetGameState } from '../state/gameState.js';
import { DEFAULT_SAVES_DIRECTORY } from '../services/gamePersistenceService.js';
import {
  assignHost,
  clearPlayerSessions,
  reconnectPlayer,
} from '../services/playerSessionService.js';

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

export function registerSaveHandlers(io, socket, {
  state = defaultState,
  gameManager = defaultGameManager,
  getCurrentPlayer = () => state.participants.find(p => p.id === socket.id),
  isCurrentPlayerHost = () => Boolean(getCurrentPlayer()?.isHost),
} = {}) {
  socket.on('list-game-saves', async (acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut consulter les sauvegardes." });
    try {
      acknowledge({ ok: true, saves: await gameManager.list() });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on('save-game', async (label, acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut sauvegarder la partie." });
    try {
      const save = await gameManager.archive(label || `Saison ${state.year}`);
      acknowledge({ ok: true, save });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });
  
  socket.on('delete-game-save', async (saveId, callback) => {
    if (!isCurrentPlayerHost()) {
      if (callback) callback({ ok: false, error: "Seul l'hôte peut supprimer les sauvegardes." });
      return;
    }
    try {
      // Vérification de sécurité simple pour éviter de supprimer n'importe quoi
      if (!/^[a-zA-Z0-9._-]+\.json$/.test(saveId)) {
        throw new Error('ID de sauvegarde invalide');
      }
      const filePath = path.join(DEFAULT_SAVES_DIRECTORY, saveId);
      await rm(filePath, { force: true });
      if (callback) callback({ ok: true });
    } catch (error) {
      console.error('Erreur lors de la suppression de la sauvegarde:', error);
      if (callback) callback({ ok: false, error: 'Impossible de supprimer la sauvegarde.' });
    }
  });

  socket.on('new-game', async (acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut créer une nouvelle partie." });
    try {
      await gameManager.archive(`Archive saison ${state.year}`);
      clearPlayerSessions();
      resetGameState();
      io.emit('game-reset');
      io.emit('draft-update', state);
      acknowledge({ ok: true });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on('load-game', async ({ saveId, playerToken } = {}, acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut charger une partie." });
    try {
      const result = await gameManager.load(saveId);
      const reconnectResult = reconnectPlayer(state, playerToken, socket.id);
      if (reconnectResult.ok) {
        assignHost(state, socket.id);
      }
      state.awaitingResumeDecision = false;
      io.emit('game-loaded');
      io.emit('draft-update', state);
      acknowledge({
        ok: true,
        result,
        reconnected: reconnectResult.ok,
      });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });
}
