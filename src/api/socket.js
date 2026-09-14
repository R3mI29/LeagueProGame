import { io } from 'socket.io-client';

export const socket = io('https://brown-snakes-smile.loca.lt', {
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true"
  },
  transports: ["websocket"] // <-- LA SOLUTION EST ICI
});