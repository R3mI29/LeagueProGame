import React, { useState, useEffect } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import CardIllustration from '../components/CardIllustration';

export default function ArenaView({ match, matchReady, dismissMatch, state, isSpectator = false }) {
  
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
  
  const getCardById = (id) => CARD_POOL.find(c => c.id === id);
  const handleSkip = () => socket.emit('skip-match', match.id);

  const getPersistentBuffs = (teamSide, role = null) => {
    let total = 0;
    if (match.games) {
      match.games.forEach(game => {
        game.events?.forEach(ev => {
          if (ev.persistentBO && ev.side === teamSide) {
            if (role && ev.targetRoles?.includes(role)) total += ev.ratingDelta;
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
    let buff = getPersistentBuffs(teamSide, role); 
    if (isSimulating && match.currentEvents) {
      buff += match.currentEvents.reduce((acc, ev) => {
        if (ev.side === teamSide && ev.targetRoles?.includes(role)) return acc + (ev.ratingDelta || 0); 
        return acc;
      }, 0);
    }
    return buff;
  };

  const getTeamAvg = (team, teamSide) => {
    const baseAvg = team.roster.reduce((a, b) => a + (b.rating || b.overall || 0), 0) / 5;
    let totalBuffsForTeam = getPersistentBuffs(teamSide); 
    if (isSimulating && match.currentEvents) {
      totalBuffsForTeam += match.currentEvents.filter(e => e.side === teamSide).reduce((acc, ev) => {
        const multiplier = ev.targetRoles ? ev.targetRoles.length : 5;
        return acc + (ev.ratingDelta * multiplier);
      }, 0);
    }
    return Math.round(baseAvg + (totalBuffsForTeam / 5));
  };

  const renderRoster = (team, teamSide) => {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
        {ORDERED_ROLES.map(role => {
          const p = team.roster.find(pro => pro.role === role);
          if (!p) return null;
          const baseCard = getCardById(p.id);
          const dynamicCard = baseCard ? { ...baseCard, rating: p.rating, overall: p.rating } : null;
          const buff = getPlayerBuff(teamSide, role);
          
          return (
            <div key={role} style={{ textAlign: 'center', position: 'relative', display: 'inline-block', zIndex: 1 }}>
              {dynamicCard ? <CardIllustration card={dynamicCard} width={90} /> : <div className="player-slot" style={{color: 'white'}}>{p.name}</div>}
              {buff > 0 && <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#00e676', color: '#000', fontWeight: '800', padding: '4px 8px', borderRadius: '12px', fontSize: '14px', boxShadow: '0 0 10px #00e676', animation: 'skillPopIn 0.3s forwards', zIndex: 999 }}>+{buff}</div>}
              {buff < 0 && <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#f74242', color: '#000', fontWeight: '800', padding: '4px 8px', borderRadius: '12px', fontSize: '14px', boxShadow: '0 0 10px #f04646', animation: 'skillPopIn 0.3s forwards', zIndex: 999 }}>{buff}</div>}
            </div>
          );
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
      
      <h1 className="title-font text-cyan" style={{ fontSize: '32px' }}>CONFRONTATION PROTOCOLE</h1>
      <p className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '4px' }}>
        {getMatchTitle(match.id)} {isSpectator && "- MODE SPECTATEUR"}
      </p>
      
      <div className="arena-box" style={{ maxWidth: '1300px', alignItems: 'stretch' }}>
        
        {/* EQUIPE A (NOM COMPLET + LOGO GÉANT) */}
        <div className="panel arena-team" style={{ borderTop: isFinished && match.winner?.id === match.teamA.id ? '3px solid var(--accent-cyan)' : '' }}>
          <h2 className="title-font" style={{ marginBottom: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {match.teamA?.logo ? <img src={match.teamA.logo} style={{width: '60px', height: '60px', objectFit: 'contain'}} /> : <div style={{width:'60px', height:'60px', background:'#2B3040', borderRadius:'12px'}}/>}
                <span style={{ fontSize: '26px' }}>{match.teamA.name}</span>
            </div>
            <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
              MOYENNE : <span style={{ color: getTeamAvg(match.teamA, 'A') > (match.teamA.roster.reduce((a,b)=>a+(b.rating||b.overall||0),0)/5) ? '#00e676' : 'inherit' }}>
                {getTeamAvg(match.teamA, 'A')}
              </span>
            </div>
          </h2>
          {renderRoster(match.teamA, 'A')}
        </div>

        {/* SIMULATION AU CENTRE */}
        <div style={{ textAlign: 'center', width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', position: 'relative' }}>
          
          {isSimulating && !isSpectator && (
            <div style={{ marginBottom: '20px' }}>
                <button className="btn btn-outline" style={{ fontSize: '12px', padding: '8px 16px', borderColor: 'var(--border)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }} onClick={handleSkip}>
                    PASSER L'ANIMATION ⏭
                </button>
            </div>
          )}

          <div className="title-font arena-vs" style={{ fontSize: '72px', color: 'var(--text-main)', margin: '0' }}>
            {match.scoreA} - {match.scoreB}
          </div>
          
          <div style={{ marginTop: '30px', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {match.status === 'pending' && !isSpectator && (
              <button className={`btn ${isReady ? 'btn-outline' : 'btn-pink'}`} style={{ width: '100%' }} onClick={() => matchReady(match.id)} disabled={isReady}>
                {isReady ? 'SYSTÈME ARMÉ...' : 'ARMER LA SÉQUENCE'}
              </button>
            )}
            
            {match.status === 'pending' && isSpectator && (
              <div className="title-font text-pink pulse-text" style={{ fontSize: '18px', letterSpacing: '2px' }}>EN ATTENTE DES JOUEURS...</div>
            )}

           {match.status === 'simulating_events' && (
            <div style={{ width: '100%' }}>
              {match.currentEvents?.filter(ev => ev.label).length > 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {match.currentEvents.filter(ev => ev.label).map((ev, index) => {
                    const eventColor = ev.side === 'A' ? '#00e5ff' : ev.side === 'B' ? '#ff3366' : '#8b9bb4';
                    return (
                      <div key={`${match.currentEvents.length}-${index}`} style={{ animation: 'skillPopIn 0.4s forwards', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {/* TEXTE PUR SANS FOND */}
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 600, color: eventColor, textAlign: 'center', lineHeight: '1.5', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          {ev.label}
                        </div>

                        {ev.image && (
                          <div style={{ width: '100%', borderRadius: '4px', overflow: 'hidden', border: `1px solid #2A2C36`, backgroundColor: '#0A0A0C', display: 'flex', justifyContent: 'center' }}>
                            <img src={ev.image} alt="Illustration" style={{ width: '100%', height: 'auto', maxHeight: '180px', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div className="title-font text-cyan pulse-text" style={{ fontSize: '16px', letterSpacing: '2px' }}>LANCEMENT DE LA PARTIE...</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Les équipes entrent dans la Faille</div>
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
                <button className="btn btn-cyan" style={{ width: '100%' }} onClick={() => dismissMatch(match.id)}>
                    {isSpectator ? "Quitter le mode spectateur" : "Poursuivre"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* EQUIPE B */}
        <div className="panel arena-team" style={{ borderTop: isFinished && match.winner?.id === match.teamB.id ? '3px solid var(--accent-cyan)' : '' }}>
          <h2 className="title-font" style={{ marginBottom: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {match.teamB?.logo ? <img src={match.teamB.logo} style={{width: '60px', height: '60px', objectFit: 'contain'}} /> : <div style={{width:'60px', height:'60px', background:'#2B3040', borderRadius:'12px'}}/>}
                <span style={{ fontSize: '26px' }}>{match.teamB.name}</span>
            </div>
            <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
              MOYENNE : <span style={{ color: getTeamAvg(match.teamB, 'B') > (match.teamB.roster.reduce((a,b)=>a+(b.rating||b.overall||0),0)/5) ? '#00e676' : 'inherit' }}>
                {getTeamAvg(match.teamB, 'B')}
              </span>
            </div>
          </h2>
          {renderRoster(match.teamB, 'B')}
        </div>

      </div>
    </div>
  );
}