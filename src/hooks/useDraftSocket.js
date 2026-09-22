import { useEffect, useState } from 'react';
import { socket } from '../api/socket';

const INITIAL_STATE = {
  phase: 'lobby', gameMode: null, participants: [], turnIndex: 0, currentOptions: [],
  bracket: [], readyPlayers: [], resetPlayers: [], champion: null,
  currentRound: 0, roundComplete: false, roundReady: [],
  auction: null, budgets: {},
  cardCollections: {}, activeLineups: {}, pendingPacks: {}, lastOpenedPack: {},
  seasonRound: 0, continueSeasonVotes: []
};

/**
 * Encapsule la connexion socket et expose l'état du jeu ainsi que
 * tous les émetteurs d'événements utilisés par les vues.
 */
export function useDraftSocket() {
  const [state, setState] = useState(INITIAL_STATE);
  const [pseudo, setPseudo] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showBracket, setShowBracket] = useState(false);

  useEffect(() => {
    const handleUpdate = (newState) => {
      setState(newState);
      setHasJoined(newState.participants.some(p => p.id === socket.id));
      if (newState.phase === 'lobby') setShowBracket(false);
    };

    socket.on('draft-update', handleUpdate);
    return () => socket.off('draft-update', handleUpdate);
  }, []);

  return {
    state,
    pseudo,
    setPseudo,
    hasJoined,
    showBracket,
    setShowBracket,
    joinLobby: () => { if (pseudo.trim()) socket.emit('join-lobby', pseudo.trim()); },
    selectMode: (mode) => socket.emit('select-mode', mode),
    startDraft: () => socket.emit('start-draft'),
    pickPlayer: (id) => socket.emit('pick-player', id),
    toggleReady: () => socket.emit('toggle-ready'),
    matchReady: (id) => socket.emit('match-ready', id),
    dismissMatch: (id) => socket.emit('dismiss-match', id),
    toggleReset: () => socket.emit('toggle-reset'),
    advanceRound: () => socket.emit('advance-round'),
    placeBid: (amount) => socket.emit('place-bid', amount),
    toggleSkipVote: () => socket.emit('toggle-skip-vote'),
    acquireForced: () => socket.emit('acquire-forced'),
    withdrawFromAuction: () => socket.emit('withdraw-from-auction'),
    claimPlayer: () => socket.emit('claim-player'),
    openPack: () => socket.emit('open-pack'),
    setLineupCard: (role, cardId) => socket.emit('set-lineup-card', { role, cardId }),
    toggleLineupReady: () => socket.emit('toggle-lineup-ready'),
    continueSeason: () => socket.emit('continue-season'),
  };
}