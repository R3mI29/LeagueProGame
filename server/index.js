import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// On importe notre gestionnaire d'événements externe
import { registerSocketHandlers } from './handlers/socketHandlers.js';

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

// Écoute des connexions et délégation des routes websockets
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// Redirection pour le routeur React (SPA)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Serveur Esport actif sur le port 3001');
});