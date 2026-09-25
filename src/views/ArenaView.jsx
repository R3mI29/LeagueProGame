import React, { useState, useEffect } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import CardIllustration from '../components/CardIllustration';

export default function ArenaView({ match, matchReady, dismissMatch, state }) {
  

  const [secretUnlock, setSecretUnlock] = useState(null);

  useEffect(() => {
    socket.on('secret-unlocked', (data) => {
      setSecretUnlock(data);
      setTimeout(() => setSecretUnlock(null), 10000); 
    });
    return () => socket.off('secret-unlocked');
  }, []);


  const isReady = match.ready.includes(socket.id);
  const isFinished = match.status === 'finished';
  const isSimulating = match.status === 'simulating_events' || match.status === 'simulating_result';
  
  const isCardMode = state.gameMode === 'draft_cartes';
  const getCardById = (id) => CARD_POOL.find(c => c.id === id);

  const handleSkip = () => socket.emit('skip-match', match.id);

  // Calcule les buffs persistants des manches précédentes (ex: Uzi)
  const getPersistentBuffs = (teamSide, role = null) => {
    let total = 0;
    if (match.games) {
      match.games.forEach(game => {
        game.events?.forEach(ev => {
          if (ev.persistentBO && ev.side === teamSide) {
            // Si on cherche pour un joueur précis
            if (role && ev.targetRoles?.includes(role)) {
              total += ev.ratingDelta;
            } 
            // Si on cherche pour la moyenne d'équipe globale
            else if (!role) {
              const multiplier = ev.targetRoles ? ev.targetRoles.length : 5;
              total += (ev.ratingDelta * multiplier);
            }
          }
        });
      });
    }
    return total;
  };

  const getPlayerBuff = (teamSide, role) => {
    let buff = getPersistentBuffs(teamSide, role); // On ajoute l'historique
    if (isSimulating && match.currentEvents) {
      buff += match.currentEvents.reduce((acc, ev) => {
        if (ev.side === teamSide && ev.targetRoles?.includes(role)) {
          return acc + (ev.ratingDelta || 0); // Le joueur prend 100% du buff
        }
        return acc;
      }, 0);
    }
    return buff;
  };

  const getTeamAvg = (team, teamSide) => {
    const baseAvg = team.roster.reduce((a, b) => a + (b.rating || b.overall || 0), 0) / 5;
    let totalBuffsForTeam = getPersistentBuffs(teamSide); // Historique

    if (isSimulating && match.currentEvents) {
      totalBuffsForTeam += match.currentEvents.filter(e => e.side === teamSide).reduce((acc, ev) => {
        const multiplier = ev.targetRoles ? ev.targetRoles.length : 5;
        return acc + (ev.ratingDelta * multiplier);
      }, 0);
    }
    
    // On divise la masse totale des buffs par 5 pour obtenir l'impact réel sur la moyenne
    return Math.round(baseAvg + (totalBuffsForTeam / 5));
  };

  const renderRoster = (team, teamSide) => {
    if (isCardMode) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
          {ORDERED_ROLES.map(role => {
            const p = team.roster.find(pro => pro.role === role);
            if (!p) return null;
            
            // MAGIE : On remplace la note de la carte statique par la note calculée par le backend (avec l'XP Prodige !)
            const baseCard = getCardById(p.id);
            const dynamicCard = baseCard ? { ...baseCard, rating: p.rating, overall: p.rating } : null;
            
            const buff = getPlayerBuff(teamSide, role);
            
            return (
              <div key={role} style={{ textAlign: 'center', position: 'relative' }}>
                {dynamicCard ? <CardIllustration card={dynamicCard} width={90} /> : <div className="player-slot">{p.name}</div>}
                
                {/* Pastille dynamique de Buff de GAME sur la carte */}
                {buff > 0 && (
                  <div style={{
                    position: 'absolute', top: '-10px', right: '-10px',
                    background: '#00e676', color: '#000', fontWeight: '800',
                    padding: '4px 8px', borderRadius: '12px', fontSize: '14px',
                    boxShadow: '0 0 10px #00e676', animation: 'skillPopIn 0.3s forwards'
                  }}>
                    +{buff}
                  </div>
                )}
                {buff < 0 && (
                  <div style={{
                    position: 'absolute', top: '-10px', right: '-10px',
                    background: '#f74242', color: '#000', fontWeight: '800',
                    padding: '4px 8px', borderRadius: '12px', fontSize: '14px',
                    boxShadow: '0 0 10px #f04646', animation: 'skillPopIn 0.3s forwards'
                  }}>
                    {buff}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Affichage Draft Classique
    return (
      <div>
        {ORDERED_ROLES.map(role => {
          const p = team.roster.find(pro => pro.role === role);
          const buff = getPlayerBuff(teamSide, role);
          return p ? (
            <div key={role} className="player-slot" style={{ border: buff > 0 ? '1px solid #00e676' : 'none' }}>
              <span style={{ fontWeight: 500 }}>
                {p.name} {buff > 0 && <span style={{ color: '#00e676', fontWeight: 'bold' }}>+{buff}</span>}
              </span>
              <span className="title-font text-muted" style={{ fontSize: '14px' }}>{p.role}</span>
            </div>
          ) : null;
        })}
      </div>
    );
  };

  const getMatchTitle = (id) => {
    if (id.includes('gf')) return 'GRANDE FINALE';
    if (id.includes('sw')) return "SWISS STAGE";
    if (id.includes('qf')) return 'QUART DE FINALE';
    if (id.includes('sf')) return 'DEMI-FINALE';
    if (id.includes('f-')) return 'GRANDE FINALE';
    if (id.match(/m1|m2/)) return "MATCH D'OUVERTURE";
    if (id.includes('winner')) return "MATCH DES GAGNANTS";
    if (id.includes('loser')) return "MATCH ÉLIMINATOIRE";
    if (id.includes('decider')) return "MATCH DÉCISIF";
    return "AFFRONTEMENT OFFICIEL";
  };

  return (
    <div className="container" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {isSimulating && (
        <div style={{ position: 'absolute', bottom: '30px', left: '30px' }}>
          <button className="btn btn-outline" style={{ fontSize: '12px', padding: '10px 20px', borderColor: 'var(--border)', color: 'var(--text-muted)' }} onClick={handleSkip}>
            PASSER L'ANIMATION ⏭
          </button>
        </div>
      )}

      <h1 className="title-font text-cyan" style={{ fontSize: '32px' }}>CONFRONTATION PROTOCOLE</h1>
      <p className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '4px' }}>{getMatchTitle(match.id)}</p>
      
      <div className="arena-box" style={{ maxWidth: isCardMode ? '1300px' : '1000px', alignItems: 'stretch' }}>
        
        {/* EQUIPE A */}
        <div className="panel arena-team" style={{ borderTop: isFinished && match.winner?.id === match.teamA.id ? '3px solid var(--accent-cyan)' : '' }}>
          <h2 className="title-font" style={{ marginBottom: '24px', textAlign: isCardMode ? 'center' : 'left' }}>
            {match.teamA.name}
            {isCardMode && (
              <div style={{ fontSize: '16px', color: 'var(--text-muted)', marginTop: '4px' }}>
                MOYENNE : <span style={{ color: getTeamAvg(match.teamA, 'A') > (match.teamA.roster.reduce((a,b)=>a+(b.rating||b.overall||0),0)/5) ? '#00e676' : 'inherit', transition: 'color 0.3s' }}>
                  {getTeamAvg(match.teamA, 'A')}
                </span>
              </div>
            )}
          </h2>
          {renderRoster(match.teamA, 'A')}
        </div>

        {/* CENTRE (Événements Un par Un) */}
        <div style={{ textAlign: 'center', width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
          
          <div className="title-font arena-vs" style={{ fontSize: '72px', color: 'var(--text-main)', margin: '0' }}>
            {match.scoreA} - {match.scoreB}
          </div>
          
          <div style={{ marginTop: '30px', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            
            {match.status === 'pending' && (
              <button className={`btn ${isReady ? 'btn-outline' : 'btn-pink'}`} style={{ width: '100%' }} onClick={() => matchReady(match.id)} disabled={isReady}>
                {isReady ? 'SYSTÈME ARMÉ...' : 'ARMER LA SÉQUENCE'}
              </button>
            )}

           {match.status === 'simulating_events' && (
            <div style={{ width: '100%' }}>
              {match.currentEvents?.filter(ev => ev.label).length > 0 ? (
                
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {match.currentEvents.filter(ev => ev.label).map((ev, index) => {
                    const eventColor = ev.side === 'A' ? '#00e5ff' : ev.side === 'B' ? '#ff3366' : '#8b9bb4';
                    
                    // Une couleur sobre pour la bordure de l'image (gris très foncé)
                    const soberBorder = '#2A2C36';

                    return (
                      <div key={`${match.currentEvents.length}-${index}`} style={{ 
                        animation: 'skillPopIn 0.4s forwards', 
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px' // Petit espace entre le texte et l'image
                      }}>
                        
                        {/* 1. LE TEXTE CLASSIQUE EXACTEMENT COMME AVANT */}
                        <div style={{ 
                          fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 600, 
                          color: eventColor,
                          background: 'rgba(0,0,0,0.6)', padding: '12px 16px', borderRadius: '6px',
                          borderTop: `2px solid ${eventColor}`,
                          textAlign: 'center', lineHeight: '1.4'
                        }}>
                          {ev.label}
                        </div>

                        {/* 2. L'IMAGE EN DESSOUS (Sobre, sans néon) */}
                        {ev.image && (
                          <div style={{ 
                            width: '100%', 
                            borderRadius: '4px', 
                            overflow: 'hidden',
                            border: `1px solid ${soberBorder}`,
                            backgroundColor: '#0A0A0C', // Fond très sombre
                            display: 'flex',
                            justifyContent: 'center',
                            opacity: 0.95 // Adoucit légèrement l'image
                          }}>
                            <img 
                              src={ev.image} 
                              alt="Illustration de l'événement" 
                              style={{ 
                                width: '100%', 
                                height: 'auto', 
                                maxHeight: '160px', // Garde une taille raisonnable
                                objectFit: 'cover' // Remplit le cadre proprement
                              }} 
                            />
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div className="title-font text-cyan pulse-text" style={{ fontSize: '16px', letterSpacing: '2px' }}>
                    LANCEMENT DE LA PARTIE...
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Les équipes entrent dans la Faille
                  </div>
                </div>
              )}
            </div>
          )}
            
            {match.status === 'simulating_result' && (
               <div className="title-font text-pink pulse-text" style={{ fontSize: '20px', letterSpacing: '2px' }}>CALCUL DE L'ISSUE...</div>
            )}

            {isFinished && (
              <div style={{ width: '100%', animation: 'fadeIn 0.5s' }}>
                <div className="title-font text-cyan" style={{ fontSize: '24px', marginBottom: '20px' }}>
                  VICTOIRE DE<br/><span style={{ fontSize: '32px', color: '#FFF' }}>{match.winner.name}</span>
                </div>
                <button className="btn btn-cyan" style={{ width: '100%' }} onClick={() => dismissMatch(match.id)}>Poursuivre</button>
              </div>
            )}
          </div>
        </div>

        {/* EQUIPE B */}
        <div className="panel arena-team" style={{ borderTop: isFinished && match.winner?.id === match.teamB.id ? '3px solid var(--accent-cyan)' : '' }}>
          <h2 className="title-font" style={{ marginBottom: '24px', textAlign: isCardMode ? 'center' : 'left' }}>
            {match.teamB.name}
            {isCardMode && (
              <div style={{ fontSize: '16px', color: 'var(--text-muted)', marginTop: '4px' }}>
                MOYENNE : <span style={{ color: getTeamAvg(match.teamB, 'B') > (match.teamB.roster.reduce((a,b)=>a+(b.rating||b.overall||0),0)/5) ? '#00e676' : 'inherit', transition: 'color 0.3s' }}>
                  {getTeamAvg(match.teamB, 'B')}
                </span>
              </div>
            )}
          </h2>
          {renderRoster(match.teamB, 'B')}
        </div>

        {secretUnlock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#050508', zIndex: 9999, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          animation: 'fadeIn 2s forwards', overflow: 'hidden'
        }}>
          
          {/* Les bandes noires façon cinéma */}
          <div style={{ position: 'absolute', top: 0, width: '100%', height: '12%', backgroundColor: 'black', zIndex: 1, animation: 'slideDown 1.5s forwards' }}></div>
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '12%', backgroundColor: 'black', zIndex: 1, animation: 'slideUp 1.5s forwards' }}></div>

          {/* L'image dramatique */}
          <div style={{ 
            position: 'relative', zIndex: 2, 
            boxShadow: '0 0 50px rgba(255, 61, 129, 0.3)', border: '1px solid #332918',
            animation: 'scaleUpSlow 10s forwards' // Lent zoom sur l'image
          }}>
            <img 
              src={secretUnlock.image} 
              alt="Ruler x Missing" 
              style={{ maxHeight: '60vh', width: 'auto', display: 'block', borderRadius: '4px' }} 
            />
          </div>

          {/* Le texte */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: '40px', animation: 'fadeInDelay 3s forwards', opacity: 0 }}>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '48px', color: '#ff3366', margin: '0 0 10px 0', textShadow: '0 0 20px rgba(255,51,102,0.8)' }}>
              {secretUnlock.title}
            </h1>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '24px', color: '#F0F2F5', letterSpacing: '2px', maxWidth: '800px' }}>
              {secretUnlock.description} <br/>
              <span style={{ color: '#D4AF37' }}>CARTE SECRÈTE DÉBLOQUÉE DANS VOTRE COLLECTION.</span>
            </p>
          </div>

          {/* CLÉ CSS ANIMATIONS EN LIGNE POUR CET OVERLAY */}
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeInDelay { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
            @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes scaleUpSlow { from { transform: scale(0.95); } to { transform: scale(1.05); } }
          `}</style>
        </div>
      )}
      </div>
    </div>
  );
}