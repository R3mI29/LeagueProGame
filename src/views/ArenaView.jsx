import React from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import CardIllustration from '../components/CardIllustration';

export default function ArenaView({ match, matchReady, dismissMatch, state }) {
  const isReady = match.ready.includes(socket.id);
  const isFinished = match.status === 'finished';
  const isSimulating = match.status === 'simulating';
  
  const isCardMode = state.gameMode === 'draft_cartes';
  const getCardById = (id) => CARD_POOL.find(c => c.id === id);

  const handleSkip = () => {
    socket.emit('skip-match', match.id);
  };

  const renderRoster = (team) => {
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

  const getMatchTitle = (id) => {
    if (id.includes('gf')) return 'GRANDE FINALE';
    if (id.includes('ub1')) return 'WINNER BRACKET - 1/8 DE FINALE';
    if (id.includes('ub2')) return 'WINNER BRACKET - QUARTS';
    if (id.includes('ub3')) return 'WINNER BRACKET - DEMIES';
    if (id.includes('ub4')) return 'WINNER BRACKET - FINALE';
    if (id.includes('lb1')) return 'LOSER BRACKET - ROUND 1';
    if (id.includes('lb2')) return 'LOSER BRACKET - ROUND 2';
    if (id.includes('lb3')) return 'LOSER BRACKET - ROUND 3';
    if (id.includes('lb4')) return 'LOSER BRACKET - ROUND 4';
    if (id.includes('lb5')) return 'LOSER BRACKET - DEMI-FINALE';
    if (id.includes('lb6')) return 'LOSER BRACKET - FINALE';
    if (id.includes('sw1')) return "SWISS STAGE - MATCHS D'OUVERTURE";
    if (id.includes('sw2')) return "SWISS STAGE - ROUND 2";
    if (id.includes('sw3')) return "SWISS STAGE - ROUND 3";
    if (id.includes('sw4')) return "SWISS STAGE - ROUND 4";
    if (id.includes('sw5')) return "SWISS STAGE - ROUND 5 (DÉCISIF)";
    if (id.includes('qf')) return 'QUART DE FINALE';
    if (id.includes('sf')) return 'DEMI-FINALE';
    if (id.includes('f-')) return 'GRANDE FINALE';
    if (id.includes('m1') || id.includes('m2')) return "MATCH D'OUVERTURE";
    if (id.includes('winner')) return "MATCH DES GAGNANTS";
    if (id.includes('loser')) return "MATCH ÉLIMINATOIRE";
    if (id.includes('decider')) return "MATCH DÉCISIF";
    
    return "AFFRONTEMENT OFFICIEL";
  };

  // Fonction pour calculer la moyenne de base + les bonus actifs de la manche en cours
  const getTeamStats = (team, side) => {
    if (!team || !team.roster || team.roster.length === 0) return { base: 0, bonus: 0 };
    const base = Math.round(team.roster.reduce((a, b) => a + b.rating, 0) / team.roster.length);
    let bonus = 0;
    
    // Si la manche est en train d'être simulée, on additionne les buffs
    if (isSimulating && match.lastGameEvents) {
      match.lastGameEvents.forEach(ev => {
        if (ev.side === side && ev.delta) bonus += ev.delta;
      });
    }
    return { base, bonus };
  };

  return (
    <div className="container" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* BOUTON PASSER L'ANIMATION RELÉGUÉ EN BAS À GAUCHE */}
      {isSimulating && (
        <div style={{ position: 'absolute', bottom: '30px', left: '30px' }}>
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '12px', padding: '10px 20px', borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} 
            onClick={handleSkip}
          >
            PASSER L'ANIMATION ⏭
          </button>
        </div>
      )}

      <h1 className="title-font text-cyan" style={{ fontSize: '32px' }}>CONFRONTATION PROTOCOLE</h1>
      <p className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '4px' }}>
        {getMatchTitle(match.id)}
      </p>
      
      <div className="arena-box" style={{ maxWidth: isCardMode ? '1300px' : '1000px', alignItems: 'stretch' }}>
        
        {/* EQUIPE A */}
        <div className="panel arena-team" style={{ borderTop: isFinished && match.winner?.id === match.teamA.id ? '3px solid var(--accent-cyan)' : '' }}>
          <h2 className="title-font" style={{ marginBottom: '24px', textAlign: isCardMode ? 'center' : 'left' }}>
            {match.teamA.name}
            {/* AFFICHAGE DYNAMIQUE AVEC LES BONUS */}
            {isCardMode && (() => {
              const stats = getTeamStats(match.teamA, 'A');
              return (
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  MOYENNE : {stats.base} 
                  {stats.bonus > 0 && <span style={{ color: '#00e5ff', fontWeight: 'bold', marginLeft: '6px', animation: 'pulse 1s infinite' }}>+{stats.bonus}</span>}
                </div>
              );
            })()}
          </h2>
          {renderRoster(match.teamA)}
        </div>

        {/* CENTRE (Boutons, Scores et NOUVEAU SYSTÈME D'ÉVÉNEMENTS) */}
        <div style={{ textAlign: 'center', width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
          
          <div className={`title-font arena-vs ${isSimulating ? 'simulating' : ''}`} style={{ fontSize: '72px', color: 'var(--text-main)', margin: '0' }}>
            {match.scoreA} - {match.scoreB}
          </div>
          
          <div style={{ marginTop: '30px', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* 1. ÉTAT : EN ATTENTE */}
            {match.status === 'pending' && (
              <button 
                className={`btn ${isReady ? 'btn-outline' : 'btn-pink'}`} 
                style={{ background: !isReady ? 'var(--accent-pink)' : '', boxShadow: !isReady ? '0 0 15px rgba(255, 51, 102, 0.3)' : '', width: '100%' }} 
                onClick={() => matchReady(match.id)} 
                disabled={isReady}
              >
                {isReady ? 'SYSTÈME ARMÉ...' : 'ARMER LA SÉQUENCE'}
              </button>
            )}

            {/* 2. ÉTAT : SIMULATION & AFFICHAGE DES ÉVÉNEMENTS (Remplaçant l'ancien overlay) */}
            {isSimulating && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', animation: 'fadeIn 0.3s' }}>
                
                {/* S'il y a eu des événements à la dernière manche simulée, on les affiche ! */}
                {match.lastGameEvents && match.lastGameEvents.length > 0 ? (
                  match.lastGameEvents.map((ev, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, 
                        color: ev.side === 'A' ? '#00e5ff' : '#ff3366', // Couleur de l'équipe qui a profité du buff
                        background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '6px',
                        borderLeft: `3px solid ${ev.side === 'A' ? '#00e5ff' : '#ff3366'}`,
                        textAlign: 'left', lineHeight: '1.4', animation: 'pulse 1.5s infinite alternate'
                      }}
                    >
                      {ev.label}
                    </div>
                  ))
                ) : (
                  <div className="title-font text-pink pulse-text" style={{ fontSize: '20px', letterSpacing: '2px' }}>
                    CALCUL DE L'ISSUE...
                  </div>
                )}
              </div>
            )}

            {/* 3. ÉTAT : FINI */}
            {isFinished && (
              <div style={{ width: '100%', animation: 'fadeIn 0.5s' }}>
                <div className="title-font text-cyan" style={{ fontSize: '24px', marginBottom: '20px', lineHeight: '1.2' }}>
                  VICTOIRE DE<br/>
                  <span style={{ fontSize: '32px', color: '#FFF' }}>{match.winner.name}</span>
                </div>
                <button className="btn btn-cyan" style={{ width: '100%' }} onClick={() => dismissMatch(match.id)}>
                  Poursuivre
                </button>
              </div>
            )}
          </div>
        </div>

        {/* EQUIPE B */}
        <div className="panel arena-team" style={{ borderTop: isFinished && match.winner?.id === match.teamB.id ? '3px solid var(--accent-cyan)' : '' }}>
          <h2 className="title-font" style={{ marginBottom: '24px', textAlign: isCardMode ? 'center' : 'left' }}>
            {match.teamB.name}
            {/* AFFICHAGE DYNAMIQUE AVEC LES BONUS */}
            {isCardMode && (() => {
              const stats = getTeamStats(match.teamB, 'B');
              return (
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  MOYENNE : {stats.base} 
                  {stats.bonus > 0 && <span style={{ color: '#ff3366', fontWeight: 'bold', marginLeft: '6px', animation: 'pulse 1s infinite' }}>+{stats.bonus}</span>}
                </div>
              );
            })()}
          </h2>
          {renderRoster(match.teamB)}
        </div>

      </div>
    </div>
  );
}