import { useEffect, useState } from 'react';
import { socket } from '../api/socket';
import { clearPlayerSessionToken, getPlayerSessionToken } from '../api/playerSession';
import { createInitialClientState } from '../constants/initialState';

/**
 * Encapsule la connexion socket et expose l'état du jeu ainsi que
 * tous les émetteurs d'événements utilisés par les vues.
 */
export function useDraftSocket() {
  const [state, setState] = useState(createInitialClientState);

  useEffect(() => {
    const handleUpdate = (newState) => {
      setState(newState);
    };
    const reconnectPlayer = () => {
      const token = getPlayerSessionToken();
      if (!token) return;

      socket.timeout(5000).emit('reconnect-player', token, (error, response) => {
        if (error) return;
        if (!response?.ok && response?.error === 'Cette ancienne session n’existe plus.') {
          clearPlayerSessionToken();
        }
      });
    };

    socket.on('draft-update', handleUpdate);
    socket.on('connect', reconnectPlayer);
    socket.on('game-loaded', reconnectPlayer);
    socket.on('game-reset', clearPlayerSessionToken);
    socket.on('player-session-cleared', clearPlayerSessionToken);
    if (socket.connected) reconnectPlayer();

    return () => {
      socket.off('draft-update', handleUpdate);
      socket.off('connect', reconnectPlayer);
      socket.off('game-loaded', reconnectPlayer);
      socket.off('game-reset', clearPlayerSessionToken);
      socket.off('player-session-cleared', clearPlayerSessionToken);
    };
  }, []);

  return {
    state,
    matchReady: (id, selectedChampions) => socket.emit('match-ready', id, selectedChampions),
    dismissMatch: (id) => socket.emit('dismiss-match', id),
    setLineupCard: (role, cardId) => socket.emit('set-lineup-card', { role, cardId }),
    setPrelockedChampion: (role, champId) => socket.emit('set-prelocked-champion', { role, champId }),
    toggleLineupReady: () => socket.emit('toggle-lineup-ready'),
  };
}
