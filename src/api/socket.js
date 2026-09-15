import { io } from 'socket.io-client';

const serverUrl = window.location.hostname.includes('loca.lt') 
  ? 'https://all-baboons-lose.loca.lt' // <--- Mets ton URL actuelle du tunnel ici
  : 'http://${SERVER_IP}:3001';

export const socket = io(serverUrl, {
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true"
  }
});