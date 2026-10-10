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
  await flushGameSnapshot(state);
  server.close(() => process.exit(0));
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
