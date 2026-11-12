import { io } from 'socket.io-client';

// En mode dev Vite local (port 5173), on cible le serveur sur le port 3001.
// En production, via un tunnel (ex: Cloudflare, ngrok) ou sur le même port,
// io() sans URL se connecte automatiquement à l'origine courante (bon protocole http/https -> ws/wss et même port).
const SERVER_URL = window.location.port === '5173'
  ? `http://${window.location.hostname}:3001`
  : undefined;

export const socket = io(SERVER_URL, {
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true"
  }
});
