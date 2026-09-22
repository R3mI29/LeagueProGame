import React from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import CardIllustration from '../components/CardIllustration';

export default function ArenaView({ match, matchReady, dismissMatch, state }) {
  const isReady = match.ready.includes(socket.id);
  const isFinished = match.status === 'finished';
  const isSimulating = match.status === 'simulating';
  
  // On vérifie le mode de jeu pour changer l'affichage
  const isCardMode = state.gameMode === 'draft_cartes';
  const getCardById = (id) => CARD_POOL.find(c => c.id === id);

  const handleSkip = () => {
    socket.emit('skip-match', match.id);
  };

  const renderRoster = (team) => {
    // AFFICHAGE MODE CARTES
    if (isCardMode) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
          {ORDERED_ROLES.map(role => {
            const p = team.roster.find(pro => pro.role === role);
            if (!p) return null;
            const card = getCardById(p.id);
            return (
              <div key={role} style={{ textAlign: 'center' }}>
                {card ? <CardIllustration card={card} width={90} /> : <div className="player-slot">{p.name}</div>}
              </div>
            );
          })}
        </div>
      );
    }

    // AFFICHAGE MODE CLASSIQUE (Lignes)
    return (
      <div>
        {ORDERED_ROLES.map(role => {
          const p = team.roster.find(pro => pro.role === role);
          return p ? (
            <div key={role} className="player-slot">
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              <span className="title-font text-muted" style={{ fontSize: '14px' }}>{p.role}</span>
            </div>
          ) : null;
        })}
      </div>
    );
  };

  return (
    <div className="container">
      <h1 className="title-font text-cyan" style={{ fontSize: '32px' }}>CONFRONTATION PROTOCOLE</h1>
      <p className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '4px' }}>
        {match.id.includes('qf') ? 'QUART DE FINALE' : match.id.includes('sf') ? 'DEMI-FINALE' : 'GRANDE FINALE'}
      </p>
      
      {/* On élargit la boîte si on affiche les cartes pour éviter que ça se superpose */}
      <div className="arena-box" style={{ maxWidth: isCardMode ? '1300px' : '1000px', alignItems: 'stretch' }}>
        
        {/* EQUIPE A */}
        <div className="panel arena-team" style={{ borderTop: isFinished && match.winner?.id === match.teamA.id ? '3px solid var(--accent-cyan)' : '' }}>
          <h2 className="title-font" style={{ marginBottom: '24px', textAlign: isCardMode ? 'center' : 'left' }}>
            {match.teamA.name}
            {isCardMode && <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>MOYENNE : {Math.round(match.teamA.roster.reduce((a,b)=>a+b.rating,0)/5)}</div>}
          </h2>
          {renderRoster(match.teamA)}
        </div>

        {/* CENTRE (Boutons et Scores) */}
        <div style={{ textAlign: 'center', width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`title-font arena-vs ${isSimulating ? 'simulating' : ''}`} style={{ fontSize: '64px', color: 'var(--text-main)' }}>
            {match.scoreA} - {match.scoreB}
          </div>
          
          <div style={{ marginTop: '30px' }}>
            {match.status === 'pending' && (
              <button 
                className={`btn ${isReady ? 'btn-outline' : 'btn-pink'}`} 
                style={{ background: !isReady ? 'var(--accent-pink)' : '', boxShadow: !isReady ? '0 0 15px rgba(255, 51, 102, 0.3)' : '' }} 
                onClick={() => matchReady(match.id)} 
                disabled={isReady}
              >
                {isReady ? 'SYSTÈME ARMÉ...' : 'ARMER LA SÉQUENCE'}
              </button>
            )}

            {isSimulating && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <div className="title-font text-pink pulse-text" style={{ fontSize: '20px' }}>CALCUL DE L'ISSUE...</div>
                {/* Le fameux bouton pour skip */}
                <button className="btn btn-outline" style={{ fontSize: '12px', padding: '8px 16px', borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }} onClick={handleSkip}>
                  PASSER L'ANIMATION ⏭
                </button>
              </div>
            )}

            {isFinished && (
              <div>
                <div className="title-font text-cyan" style={{ fontSize: '28px', marginBottom: '20px' }}>
                  VICTOIRE<br/>{match.winner.name}
                </div>
                <button className="btn btn-cyan" onClick={() => dismissMatch(match.id)}>Poursuivre</button>
              </div>
            )}
          </div>
        </div>

        {/* EQUIPE B */}
        <div className="panel arena-team" style={{ borderTop: isFinished && match.winner?.id === match.teamB.id ? '3px solid var(--accent-cyan)' : '' }}>
          <h2 className="title-font" style={{ marginBottom: '24px', textAlign: isCardMode ? 'center' : 'left' }}>
            {match.teamB.name}
            {isCardMode && <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>MOYENNE : {Math.round(match.teamB.roster.reduce((a,b)=>a+b.rating,0)/5)}</div>}
          </h2>
          {renderRoster(match.teamB)}
        </div>

      </div>
    </div>
  );
}