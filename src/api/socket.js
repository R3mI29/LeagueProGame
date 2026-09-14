import { io } from 'socket.io-client';

// Récupère dynamiquement l'IP locale ou localhost
const SERVER_IP = window.location.hostname;
const URL = `http://${SERVER_IP}:3001`;

export const socket = io(URL, {
  autoConnect: true
});