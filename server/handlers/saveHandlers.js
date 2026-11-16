import { rm } from 'node:fs/promises';
import path from 'node:path';
import { state as defaultState, resetGameState } from '../state/gameState.js';
import { DEFAULT_SAVES_DIRECTORY, flushGameSnapshot } from '../services/gamePersistenceService.js';
import {
  assignHost,
  clearPlayerSessions,
  reconnectPlayer,
} from '../services/playerSessionService.js';

const defaultGameManager = {
  async archive() {
    return { saveId: null };
  },
  async overwrite() {
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

  socket.on('overwrite-game-save', async (saveId, acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut sauvegarder par-dessus une archive." });
    try {
      if (!/^[a-zA-Z0-9._-]+\.json$/.test(saveId)) {
        return acknowledge({ ok: false, error: 'ID de sauvegarde invalide.' });
      }
      const save = await gameManager.overwrite(saveId);
      acknowledge({ ok: true, save });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on('save-and-quit', async (label, acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut sauvegarder et quitter." });
    try {
      const cleanLabel = typeof label === 'string' && label.trim() ? label.trim() : `Saison ${state.year || 1} - Quitter`;
      const save = await gameManager.archive(cleanLabel);
      await flushGameSnapshot(state);
      clearPlayerSessions();
      resetGameState();
      io.emit('game-reset');
      io.emit('draft-update', state);
      acknowledge({ ok: true, save });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on('overwrite-and-quit', async (saveId, acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut sauvegarder et quitter." });
    try {
      if (!/^[a-zA-Z0-9._-]+\.json$/.test(saveId)) {
        return acknowledge({ ok: false, error: 'ID de sauvegarde invalide.' });
      }
      const save = await gameManager.overwrite(saveId);
      await flushGameSnapshot(state);
      clearPlayerSessions();
      resetGameState();
      io.emit('game-reset');
      io.emit('draft-update', state);
      acknowledge({ ok: true, save });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on('quit-to-menu', async (acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut quitter vers le menu." });
    try {
      await flushGameSnapshot(state);
      clearPlayerSessions();
      resetGameState();
      io.emit('game-reset');
      io.emit('draft-update', state);
      acknowledge({ ok: true });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });
  
  socket.on('delete-game-save', async (saveId, callback = () => {}) => {
    if (!isCurrentPlayerHost()) {
      return callback({ ok: false, error: "Seul l'hôte peut supprimer les sauvegardes." });
    }
    try {
      if (!/^[a-zA-Z0-9._-]+\.json$/.test(saveId)) {
        throw new Error('ID de sauvegarde invalide');
      }
      const filePath = path.join(DEFAULT_SAVES_DIRECTORY, saveId);
      await rm(filePath, { force: true });
      callback({ ok: true });
    } catch (error) {
      console.error('Erreur lors de la suppression de la sauvegarde:', error);
      callback({ ok: false, error: 'Impossible de supprimer la sauvegarde.' });
    }
  });

  socket.on('new-game', async (acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut réinitialiser la partie." });
    try {
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
