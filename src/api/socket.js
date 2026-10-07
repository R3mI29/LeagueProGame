import { io } from 'socket.io-client';



// On récupère dynamiquement l'IP tapée dans le navigateur et on force le port 3001
const SERVER_URL = `http://${window.location.hostname}:3001`;
export const socket = io(SERVER_URL, {
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true"
  }
});