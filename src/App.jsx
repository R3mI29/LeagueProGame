import { socket } from './api/socket';
import { useDraftSocket } from './hooks/useDraftSocket';
import { isTournamentPhase, getMyActiveMatch } from './utils/bracketHelpers';
import LobbyView from './views/LobbyView';
import DraftView from './views/DraftView';
import ArenaView from './views/ArenaView';
import BracketView from './views/BracketView';
import './styles/theme.css';

export default function App() {
  const draft = useDraftSocket();
  const { state, showBracket } = draft;

  if (state.phase === 'lobby') {
    return <LobbyView {...draft} />;
  }

  const tournamentPhase = isTournamentPhase(state);
  const myActiveMatch = getMyActiveMatch(state, socket.id);

  if (myActiveMatch) {
    return (
      <ArenaView
        match={myActiveMatch}
        matchReady={draft.matchReady}
        dismissMatch={draft.dismissMatch}
      />
    );
  }

  if (tournamentPhase && showBracket) {
    return (
      <BracketView
        state={state}
        toggleReady={draft.toggleReady}
        toggleReset={draft.toggleReset}
        advanceRound={draft.advanceRound}
      />
    );
  }

  return (
    <DraftView
      state={state}
      tournamentPhase={tournamentPhase}
      pickPlayer={draft.pickPlayer}
      setShowBracket={draft.setShowBracket}
    />
  );
}
