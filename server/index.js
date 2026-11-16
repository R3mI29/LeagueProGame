import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// On importe notre gestionnaire d'événements externe
import { registerSocketHandlers } from './handlers/socketHandlers.js';
import { state } from './state/gameState.js';
import {
  archiveGameSnapshot,
  createPersistentIo,
  flushGameSnapshot,
  listGameSnapshots,
  loadArchivedGame,
  loadGameSnapshot,
  overwriteGameSnapshot,
} from './services/gamePersistenceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Servir les fichiers statiques de l'application React
app.use(express.static(path.join(__dirname, '../dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Bypass-Tunnel-Reminder"]
  }
});

const restoreResult = await loadGameSnapshot(state);
if (restoreResult.restored) {
  console.log(`Partie restaurée depuis ${restoreResult.filePath} (${restoreResult.savedAt})`);
}
const persistentIo = createPersistentIo(io, state);
const gameManager = {
  archive: label => archiveGameSnapshot(state, { label }),
  overwrite: saveId => overwriteGameSnapshot(state, saveId),
  list: () => listGameSnapshots(),
  load: saveId => loadArchivedGame(state, saveId),
};

// Écoute des connexions et délégation des routes websockets
io.on('connection', (socket) => {
  registerSocketHandlers(persistentIo, socket, { gameManager });
});

// Redirection pour le routeur React (SPA)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const port = Number(process.env.PORT || 3001);
server.listen(port, '0.0.0.0', () => {
  console.log(`Serveur Esport actif sur le port ${port}`);
});

const shutdown = async (signal) => {
  console.log(`${signal} reçu, sauvegarde de la partie…`);
  if (state.phase !== 'lobby') {
    try {
      await archiveGameSnapshot(state, {
        label: `[AutoSave] Coupure serveur (${signal}) - Saison ${state.year || 1}`,
      });
      console.log('[AUTOSAVE] Sauvegarde automatique de coupure créée dans saves/');
    } catch (err) {
      console.error('[AUTOSAVE] Erreur lors de la sauvegarde de coupure:', err);
    }
  }
  await flushGameSnapshot(state);
  server.close(() => process.exit(0));
};

const handleCrash = async (error, type) => {
  console.error(`[CRASH] ${type}:`, error);
  if (state.phase !== 'lobby') {
    try {
      await archiveGameSnapshot(state, {
        label: `[AutoSave] Crash (${type}) - Saison ${state.year || 1}`,
      });
      await flushGameSnapshot(state);
      console.log('[AUTOSAVE] Sauvegarde automatique d\'urgence créée dans saves/');
    } catch (err) {
      console.error('[AUTOSAVE] Erreur lors de la sauvegarde de crash:', err);
    }
  }
  process.exit(1);
};

process.on('uncaughtException', (err) => handleCrash(err, 'uncaughtException'));
process.on('unhandledRejection', (err) => handleCrash(err, 'unhandledRejection'));
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGBREAK', () => shutdown('SIGBREAK'));
