import { io } from 'socket.io-client';

const SERVER_IP = window.location.hostname;
const serverUrl = window.location.hostname.includes('loca.lt') 
  ? 'https://nasty-buses-show.loca.lt'
  : `http://${SERVER_IP}:3001`;

export const socket = io(serverUrl, {
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true"
  }
});
