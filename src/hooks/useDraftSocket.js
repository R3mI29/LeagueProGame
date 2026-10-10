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
  endOfYearRecap: null, awaitingResumeDecision: false,
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
    matchReady: (id) => socket.emit('match-ready', id),
    dismissMatch: (id) => socket.emit('dismiss-match', id),
    setLineupCard: (role, cardId) => socket.emit('set-lineup-card', { role, cardId }),
    toggleLineupReady: () => socket.emit('toggle-lineup-ready'),
  };
}
