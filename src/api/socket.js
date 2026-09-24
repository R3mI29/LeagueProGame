import { io } from 'socket.io-client';


export const socket = io({
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true"
  }
});