import { useEffect, useState } from 'react';
import { socket } from '../api/socket';
import { clearPlayerSessionToken, getPlayerSessionToken } from '../api/playerSession';

const INITIAL_STATE = {
  phase: 'lobby', participants: [], bracket: [], groups: null, swissTeams: null,
  tournamentPhase: null, readyPlayers: [], resetPlayers: [], champion: null,
  currentRound: 0, roundComplete: false, roundReady: [],
  cardCollections: {}, activeLineups: {}, pendingPacks: {}, pendingPackResults: {},
  lastOpenedPack: {}, starterPackClaimed: {}, economy: {}, lockedCards: {},
  cardStats: {}, globalSecrets: {}, teamSkins: {}, seasonScores: null,
  seasonRound: 0, continueSeasonVotes: [], year: 1, eventIndex: 0, history: [],
  endOfYearRecap: null,
};

/**
 * Encapsule la connexion socket et expose l'état du jeu ainsi que
 * tous les émetteurs d'événements utilisés par les vues.
 */
export function useDraftSocket() {
  const [state, setState] = useState(INITIAL_STATE);

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
    if (socket.connected) reconnectPlayer();

    return () => {
      socket.off('draft-update', handleUpdate);
      socket.off('connect', reconnectPlayer);
    };
  }, []);

  return {
    state,
    matchReady: (id) => socket.emit('match-ready', id),
    dismissMatch: (id) => socket.emit('dismiss-match', id),
    setLineupCard: (role, cardId) => socket.emit('set-lineup-card', { role, cardId }),
    toggleLineupReady: () => socket.emit('toggle-lineup-ready'),
  };
}
