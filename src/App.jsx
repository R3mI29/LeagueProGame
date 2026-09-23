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
import PackOpener from './components/PackOpener'; 
import SeasonHub from './components/SeasonHub';
import TournamentWrapper from './views/TournamentWrapper';

import './styles/theme.css';

export default function App() {
  const draft = useDraftSocket();
  const { state, showBracket } = draft;
  
  const [showDevMode, setShowDevMode] = useState(false);

  // SUPPRESSION DE L'ANCIEN BLOC if(showDevMode) QUI FAISAIT PLANTER L'APPLICATION ICI

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

    // --- On vérifie l'arène AVANT l'arbre de tournoi ---
    const myActiveMatch = getMyActiveMatch(state, socket.id);

    // Si on a un match qui nous concerne (en attente, en cours ou à valider à la fin)
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

    // SI nous n'avons pas de match actif, on affiche tranquillement l'arbre ou les groupes
    if (state.phase === 'tournament' || state.phase === 'simulation') {
      return (
        <TournamentWrapper 
          state={state} 
          toggleReady={draft.toggleReady}
          toggleReset={draft.toggleReset}
          advanceRound={draft.advanceRound}
          continueSeason={draft.continueSeason}
        />
      ); 
    }

    // (Code de secours au cas où)
    const tournamentPhase = isTournamentPhase(state);
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

  // VÉRIFICATION DU PSEUDO POUR AFFICHER LE BOUTON DEV
  const myPlayerInfo = state.participants?.find(p => p.id === socket.id);
  const isDevModeUnlocked = myPlayerInfo?.name?.toLowerCase() === 'dev';

  return (
    <>
      {myLastOpened.length > 0 && (
        <PackOpener 
          cardIds={myLastOpened} 
          onClose={() => socket.emit('close-pack')} 
        />
      )}

      {/* Affichage du jeu normal en dessous */}
      {renderMainContent()}

      {/* Bouton secret DEV conditionné au pseudo "dev" */}
      {isDevModeUnlocked && !showDevMode && (
        <button
          onClick={() => setShowDevMode(true)}
          style={{
            position: 'fixed', bottom: 20, right: 20,
            background: '#0D1219', border: '2px solid #ff3366', color: '#ff3366',
            zIndex: 9999, cursor: 'pointer', padding: '10px 20px', borderRadius: '8px',
            fontSize: '14px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '2px', fontWeight: 'bold',
            boxShadow: '0 0 15px rgba(255, 51, 102, 0.4)', transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => { e.target.style.background = '#ff3366'; e.target.style.color = '#FFF'; }}
          onMouseLeave={(e) => { e.target.style.background = '#0D1219'; e.target.style.color = '#ff3366'; }}
        >
          ⚙️ MODE DEV
        </button>
      )}

      {/* Affichage de la vue DEV si active (Ici state={state} est bien passé !) */}
      {showDevMode && <DevCardsView onClose={() => setShowDevMode(false)} state={state} />}
    </>
  );
}