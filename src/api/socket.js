import { io } from 'socket.io-client';

// 1. On détecte si vous êtes en train de tester en local
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 2. Si c'est en local, on pointe vers le port 3001. 
// Sinon, on laisse vide (ou on met l'URL de votre serveur de production)
const SERVER_URL = isLocalhost ? 'http://localhost:3001' : ''; 

// 3. On initialise le socket avec cette URL
export const socket = io(SERVER_URL, {
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true"
  }
});