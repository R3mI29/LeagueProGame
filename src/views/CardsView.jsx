import { useState } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import CardIllustration from '../components/CardIllustration';

function getCard(id) {
  return CARD_POOL.find(c => c.id === id);
}

export default function CardsView({ state, openPack, setLineupCard, toggleLineupReady }) {
  const myId = socket.id;
  
  // 1. On récupère les infos du serveur
  const rawCollection = state.cardCollections?.[myId] || {};
  const myLineup = state.activeLineups?.[myId] || {};
  const myPendingPacks = state.pendingPacks?.[myId] || 0;
  const lastOpened = state.lastOpenedPack?.[myId] || []; // On regarde ce qu'il y a dans le pack actuel
  
  const [activeRole, setActiveRole] = useState(ORDERED_ROLES[0]);

  // 2. ANTI-SPOIL : On déduit temporairement les cartes du pack en cours de la collection visible
  const myCollection = { ...rawCollection };
  lastOpened.forEach(cardId => {
    if (myCollection[cardId]) {
      myCollection[cardId] -= 1;
      if (myCollection[cardId] <= 0) {
        delete myCollection[cardId];
      }
    }
  });

  const isReady = state.readyPlayers.includes(myId);
  const humanParticipants = state.participants.filter(p => !p.id.startsWith('bot-'));
  const lineupComplete = ORDERED_ROLES.every(role => myLineup[role]);

  const ownedCardsForRole = (role) => CARD_POOL.filter(c => c.role === role && (myCollection[c.id] || 0) > 0);

  const scores = state.seasonScores || {};
  const leaderboard = state.participants.map(p => ({
    id: p.id,
    name: p.name,
    points: scores[p.id]?.points || 0,
    titles: scores[p.id]?.titles || 0
  })).sort((a, b) => b.points - a.points);

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1 className="title-font text-cyan" style={{ fontSize: '32px' }}>MODE CARTES</h1>
      <p className="title-font text-muted" style={{ letterSpacing: '3px', marginBottom: '20px' }}>
        SAISON {state.seasonRound || 1}
      </p>

      <div style={{ display: 'flex', gap: '30px', width: '100%', maxWidth: '1400px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: '1 1 350px', maxWidth: '500px' }}>
          
          <div className="panel" style={{ textAlign: 'center' }}>
            {myPendingPacks > 0 ? (
              <>
                <p className="title-font text-pink" style={{ fontSize: '20px', marginBottom: '16px' }}>
                  {myPendingPacks} PACK{myPendingPacks > 1 ? 'S' : ''} DISPONIBLE{myPendingPacks > 1 ? 'S' : ''}
                </p>
                <button className="btn btn-pink" onClick={openPack}>OUVRIR UN PACK</button>
              </>
            ) : (
              <p className="text-muted" style={{ margin: 0 }}>Aucun pack en attente. Gagnez le tournoi pour en obtenir d'autres.</p>
            )}
          </div>

          {state.seasonRound > 1 && (
            <div className="panel">
              <h3 className="title-font text-cyan" style={{ marginTop: 0, textAlign: 'center', marginBottom: '20px' }}>CLASSEMENT SAISON</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {leaderboard.map((player, index) => (
                  <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-card)', borderRadius: '6px', border: player.id === myId ? '1px solid var(--accent-cyan)' : 'none' }}>
                    <span style={{ fontWeight: player.id === myId ? 'bold' : 'normal' }}>
                      <span className="text-muted" style={{ marginRight: '10px' }}>#{index + 1}</span>
                      {player.name}
                    </span>
                    <span className="title-font text-pink">
                      {player.points} PTS {player.titles > 0 && `(🏆x${player.titles})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel" style={{ flex: '2 1 600px' }}>
          <h3 className="title-font" style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>COMPOSER VOTRE ÉQUIPE</h3>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
            {ORDERED_ROLES.map(role => {
              const selectedCard = myLineup[role] ? getCard(myLineup[role]) : null;
              return (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`btn ${activeRole === role ? 'btn-cyan' : 'btn-outline'}`}
                  style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: '1 1 100px' }}
                >
                  <span>{role}</span>
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>
                    {selectedCard ? selectedCard.baseName : 'Vide'}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', minHeight: '300px', alignContent: 'flex-start' }}>
            {ownedCardsForRole(activeRole).length === 0 && (
              <p className="text-muted" style={{ fontStyle: 'italic', marginTop: '40px' }}>Aucune carte {activeRole} dans votre collection.</p>
            )}
            
            {ownedCardsForRole(activeRole).map(card => {
              const selected = myLineup[activeRole] === card.id;
              const quantity = myCollection[card.id] || 0;
              
              return (
                <div
                  key={card.id}
                  onClick={() => setLineupCard(activeRole, card.id)}
                  style={{
                    cursor: 'pointer', 
                    position: 'relative',
                    transition: 'transform 0.2s',
                    transform: selected ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <div style={{ padding: '6px', borderRadius: '16px', background: selected ? 'var(--accent-cyan)' : 'transparent' }}>
                    <CardIllustration card={card} width={150} />
                  </div>
                  
                  {quantity > 1 && (
                    <div style={{ 
                      position: 'absolute', top: '-5px', right: '-5px', 
                      background: 'var(--accent-pink)', color: 'white', 
                      borderRadius: '50%', width: '28px', height: '28px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '12px', zIndex: 10,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}>
                      x{quantity}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p className="text-muted" style={{ marginBottom: '16px' }}>
              {state.readyPlayers.length}/{humanParticipants.length} commandants prêts
            </p>
            <button
              className={`btn ${isReady ? 'btn-green' : 'btn-cyan'}`}
              onClick={toggleLineupReady}
              disabled={!lineupComplete && !isReady}
              style={{ width: '100%', maxWidth: '300px', fontSize: '18px', padding: '16px' }}
            >
              {isReady ? 'PRÊT ✓' : lineupComplete ? 'VALIDER LA LINE-UP' : 'SÉLECTIONNEZ 5 CARTES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}