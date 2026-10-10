import { useEffect, useState } from 'react';
import { socket } from '../api/socket';

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

    socket.on('draft-update', handleUpdate);
    return () => socket.off('draft-update', handleUpdate);
  }, []);

  return {
    state,
    matchReady: (id) => socket.emit('match-ready', id),
    dismissMatch: (id) => socket.emit('dismiss-match', id),
    setLineupCard: (role, cardId) => socket.emit('set-lineup-card', { role, cardId }),
    toggleLineupReady: () => socket.emit('toggle-lineup-ready'),
  };
}
