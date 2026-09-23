import { useState } from 'react';
import { socket } from './api/socket';
import { useDraftSocket } from './hooks/useDraftSocket';
import { isTournamentPhase, getMyActiveMatch } from './utils/bracketHelpers';
import LobbyView from './views/LobbyView';
import DraftView from './views/DraftView';
import AuctionView from './views/AuctionView';
import CardsView from './views/CardsView';
import ArenaView from './views/ArenaView';
import BracketView from './views/BracketView';
import DevCardsView from './views/DevCardView'; 
import PackOpener from './components/PackOpener'; // <-- IMPORT DU NOUVEAU COMPOSANT
import SeasonHub from './components/SeasonHub';
import TournamentWrapper from './views/TournamentWrapper';

import './styles/theme.css';

export default function App() {
  const draft = useDraftSocket();
  const { state, showBracket } = draft;
  
  const [showDevMode, setShowDevMode] = useState(false);

  if (showDevMode) {
    return <DevCardsView onClose={() => setShowDevMode(false)} />;
  }

  const renderMainContent = () => {
    if (state.phase === 'lobby') {
      return <LobbyView {...draft} />;
    }

    if (state.phase === 'auction') {
      return (
        <AuctionView
          state={state}
          placeBid={draft.placeBid}
          toggleSkipVote={draft.toggleSkipVote}
          acquireForced={draft.acquireForced}
          withdrawFromAuction={draft.withdrawFromAuction}
          claimPlayer={draft.claimPlayer}
        />
      );
    }
    if (state.phase === 'season_hub') {
      return <SeasonHub state={state} />;
    }
    if (state.phase === 'tournament' || state.phase === 'simulation') {
      // On remplacera BracketView par TournamentWrapper plus tard
      return <TournamentWrapper state={state} />; 
    }

    if (state.phase === 'cards') {
      return (
        <CardsView
          state={state}
          openPack={draft.openPack}
          setLineupCard={draft.setLineupCard}
          toggleLineupReady={draft.toggleLineupReady}
        />
      );
    }

    const tournamentPhase = isTournamentPhase(state);
    const myActiveMatch = getMyActiveMatch(state, socket.id);

    if (myActiveMatch) {
      return (
        <ArenaView
          match={myActiveMatch}
          matchReady={draft.matchReady}
          dismissMatch={draft.dismissMatch}
          state={state} 
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
          continueSeason={draft.continueSeason}
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
  };

  // Récupération sécurisée du dernier pack ouvert par ce joueur
  const myLastOpened = state.lastOpenedPack?.[socket.id] || [];

  return (
    <>
      {/* 
        Le PackOpener apparaît uniquement si on a des cartes dans lastOpenedPack.
        Il se refermera en envoyant l'event 'close-pack' au serveur.
      */}
      {myLastOpened.length > 0 && (
        <PackOpener 
          cardIds={myLastOpened} 
          onClose={() => socket.emit('close-pack')} 
        />
      )}

      {/* Affichage du jeu normal en dessous */}
      {renderMainContent()}

      {/* Bouton secret DEV toujours flottant en bas à droite */}
      {/*
      <button
        onClick={() => setShowDevMode(true)}
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          opacity: 0.1,
          background: '#0D1219',
          border: '1px solid #4CE0D2',
          color: '#4CE0D2',
          zIndex: 9999,
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: "'Rajdhani', sans-serif",
          letterSpacing: '1px',
          fontWeight: 'bold',
          transition: 'opacity 0.2s ease-in-out'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.1'}
      >
        DEV
      </button>
      */}
    </>
  );
}