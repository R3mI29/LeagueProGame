import { io } from 'socket.io-client';


const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';


const SERVER_URL = isLocalhost ? 'http://localhost:3001' : ''; 


export const socket = io(SERVER_URL, {
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true"
  }
});