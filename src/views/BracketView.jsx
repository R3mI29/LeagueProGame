import React, { useState, useEffect } from 'react';
import { socket } from '../api/socket';

export default function BracketView({ state, event }) {
  const { bracket, currentRound, roundComplete, readyPlayers } = state;
  const myId = socket.id;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-') && !p.isBot).length;
  const isGlobalReady = readyPlayers?.includes(myId);
  const isRoundReady = state.roundReady?.includes(myId);
  const isContinueReady = state.continueSeasonVotes?.includes(myId);

  const finalMatch = bracket?.[bracket.length - 1]?.[0];
  const isTournamentOver = finalMatch?.status === 'finished';

  // --- DÉTECTION DU THÈME & DA ---
  const eventName = event?.name?.toLowerCase() || '';
  const isWorlds = event?.isMajor || eventName.includes('worlds');
  const isEWC = eventName.includes('ewc') || eventName.includes('esports world cup');
  const isFirstStand = eventName.includes('first stand');

  let theme = {
      main: '#00e5ff', accent: '#00e5ff', bg: '#0A0D14', boxBg: '#15171E', border: '#2B3040',
      font: "'Inter', sans-serif", textMain: '#FFFFFF', textMuted: '#7A8190',
      headerBg: '#1C212E', headerText: '#8C9AD6', logoPlaceholder: '#2B3040',
      logoFilter: 'drop-shadow(0px 1px 4px rgba(255,255,255,0.25))',
      boxShadow: 'none', bgStyle: {}
  };

  if (isWorlds) {
      theme = { ...theme,
          main: '#FFFFFF', accent: '#004DE6', bg: '#01040A', boxBg: 'rgba(10, 14, 25, 0.9)', 
          border: 'rgba(255, 255, 255, 0.1)', font: "'Oswald', sans-serif", textMain: '#FFFFFF', textMuted: '#8A9CCC',
          headerBg: 'transparent', headerText: '#FFFFFF', logoPlaceholder: 'rgba(255,255,255,0.05)',
          logoFilter: 'drop-shadow(0px 1px 3px rgba(255, 255, 255, 0.2))', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          bgStyle: { backgroundImage: `radial-gradient(circle at 50% 0%, rgba(0, 77, 230, 0.15) 0%, transparent 70%)` }
      };
  } else if (isEWC) {
      // DA EWC : Plus vivante, premium et géométrique (Or et Noir chaud)
      theme = { ...theme,
          main: '#D4AF37', 
          accent: '#E5C158',
          bg: '#0A0705', // Un noir très légèrement chaud pour contraster avec le fond
          boxBg: '#0A0A0A', 
          border: '#3A2E12', 
          font: "'Montserrat', 'Inter', sans-serif", 
          textMain: '#FFFFFF', 
          textMuted: '#777777',
          headerBg: 'transparent', 
          headerText: '#D4AF37', 
          logoPlaceholder: 'rgba(255,255,255,0.02)',
          logoFilter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.9))', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.9)',
          bgStyle: { 
              // Effet d'éclairage de scène (Halo or en haut, orangé en bas + grille subtile)
              backgroundImage: `
                radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 50% 100%, rgba(255, 89, 0, 0.08) 0%, transparent 60%),
                linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px'
          }
      };
  } else if (isFirstStand) {
      theme = { ...theme,
          main: '#FF5C00', bg: '#F4F5F8', boxBg: '#FFFFFF', border: '#E5E7EB',
          font: "'Rajdhani', sans-serif", textMain: '#25092C', textMuted: '#71717A', logoPlaceholder: '#F0F1F5',
          logoFilter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.12))', boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
          bgStyle: { backgroundImage: `repeating-linear-gradient(115deg, transparent, transparent 100px, rgba(0,0,0,0.02) 100px, rgba(0,0,0,0.02) 102px), repeating-linear-gradient(-65deg, transparent, transparent 150px, rgba(0,0,0,0.015) 150px, rgba(0,0,0,0.015) 152px)` }
      };
  }

  const [secretUnlock, setSecretUnlock] = useState(null);
  useEffect(() => {
    socket.on('secret-unlocked', (data) => {
      setSecretUnlock(data); setTimeout(() => setSecretUnlock(null), 10000); 
    });
    return () => socket.off('secret-unlocked');
  }, []);

  const toggleReady = () => socket.emit('toggle-ready');
  const advanceRound = () => socket.emit('advance-round');
  const handleMatchClick = (match) => {
    if (match && match.waveActive && match.status === 'pending' && (match.teamA?.id === myId || match.teamB?.id === myId)) socket.emit('match-ready', match.id);
  };

  const getMatchBox = (match, title, isFinal = false) => {
    if (!match) return null;
    const isSim = match.status === 'simulating_events' || match.status === 'simulating_result';
    const isFin = match.status === 'finished';
    const involvesMe = match.teamA?.id === myId || match.teamB?.id === myId;
    const isMyTurn = match.waveActive && match.status === 'pending' && involvesMe;
    const winnerId = isFin ? match.winner?.id : null;
    
    const getTeamStyle = (team) => {
        if (!team) return { color: theme.textMuted, weight: 500 };
        if (!isFin) return { color: theme.textMain, weight: 600 };
        if (winnerId === team.id) return { color: isWorlds || isEWC ? (isEWC ? '#D4AF37' : '#FFFFFF') : theme.main, weight: 800 };
        return { color: theme.textMuted, weight: 500 };
    };

    const teamAStyle = getTeamStyle(match.teamA);
    const teamBStyle = getTeamStyle(match.teamB);
    
    const boxGlow = isMyTurn && isWorlds ? `0 0 15px rgba(255, 255, 255, 0.15)` : (isMyTurn && !isWorlds && !isEWC ? `0 0 15px ${theme.main}60` : theme.boxShadow);
    
    let winnerBg = 'transparent';
    if (isFin) {
        if (isWorlds) winnerBg = 'rgba(255, 255, 255, 0.05)';
        else if (isEWC) winnerBg = '#141414'; 
        else winnerBg = `${theme.main}15`;
    }
    
    let finalBoxBg = theme.boxBg;
    if (isFinal) {
        if (isWorlds) finalBoxBg = 'linear-gradient(135deg, rgba(10, 14, 25, 0.9), rgba(0, 102, 255, 0.2))';
        if (isEWC) finalBoxBg = '#111111';
    }

    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: isFinal ? '420px' : '340px', margin: '0 auto', zIndex: 2 }} key={match.id}>
        <div style={{ color: theme.main, fontSize: isFinal ? '14px' : '11px', fontWeight: 800, position: 'absolute', top: isFinal ? '-28px' : '-20px', left: '0', width: '100%', textAlign: isFinal && (isWorlds || isEWC) ? 'center' : 'left', letterSpacing: '2px', fontFamily: theme.font, textTransform: 'uppercase' }}>
            {title} {isSim && <span className="pulse-text" style={{ color: theme.textMain, marginLeft: '6px' }}>• LIVE</span>}
        </div>
        <div onClick={() => handleMatchClick(match)}
            style={{
                background: isFinal ? finalBoxBg : theme.boxBg, 
                backdropFilter: isWorlds ? 'blur(12px)' : 'none',
                border: isMyTurn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                borderRadius: isWorlds || isEWC ? '0px' : '6px', 
                cursor: isMyTurn ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif",
                boxShadow: boxGlow, transition: 'all 0.2s ease'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isFinal ? '16px 20px' : '12px 16px', borderBottom: `1px solid ${theme.border}`, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? winnerBg : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: isFinal ? '18px' : '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA ? match.teamA.name : 'TBD'}</span>
                </div>
                <span style={{ fontSize: isFinal ? '22px' : '16px', color: teamAStyle.color, fontWeight: teamAStyle.weight, marginLeft: '10px', flexShrink: 0 }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '-')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isFinal ? '16px 20px' : '12px 16px', opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? winnerBg : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: isFinal ? '18px' : '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB ? match.teamB.name : 'TBD'}</span>
                </div>
                <span style={{ fontSize: isFinal ? '22px' : '16px', color: teamBStyle.color, fontWeight: teamBStyle.weight, marginLeft: '10px', flexShrink: 0 }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '-')}</span>
            </div>
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    if (isWorlds) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '80px', paddingTop: '20px' }}>
           {event?.logo ? (
               <img src={event.logo} alt="Worlds" style={{ height: '80px', objectFit: 'contain', filter: theme.logoFilter, marginBottom: '20px' }} />
           ) : (
               <div style={{ background: '#FFF', padding: '8px 16px', marginBottom: '20px', borderRadius: '2px' }}>
                   <span style={{ color: '#000', fontSize: '24px', fontWeight: 'bold', fontFamily: theme.font }}>W</span>
               </div>
           )}
           <h2 style={{ fontFamily: theme.font, fontSize: '48px', margin: 0, color: theme.textMain, textTransform: 'uppercase', letterSpacing: '4px' }}>THE FINAL BRACKET</h2>
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
               <div style={{ height: '1px', width: '40px', background: 'rgba(255,255,255,0.2)' }}></div>
               <div style={{ color: theme.accent, fontWeight: 700, letterSpacing: '4px', fontSize: '12px', textTransform: 'uppercase' }}>MAKE THEM BELIEVE</div>
               <div style={{ height: '1px', width: '40px', background: 'rgba(255,255,255,0.2)' }}></div>
           </div>
        </div>
      );
    }
    if (isEWC) {
      return (
        <div style={{ textAlign: 'center', marginBottom: '80px', paddingTop: '20px' }}>
           {event?.logo && <img src={event.logo} alt="EWC" style={{ height: '70px', objectFit: 'contain', marginBottom: '10px', filter: theme.logoFilter }} />}
           <h3 style={{ fontFamily: theme.font, fontSize: '32px', color: theme.main, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 800 }}>
              CHAMPIONSHIP BRACKET
           </h3>
           <h2 style={{ fontFamily: theme.font, fontSize: '64px', color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900 }}>
              PLAYOFFS PHASE
           </h2>
        </div>
      );
    }
    if (isFirstStand) {
      return (
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '80px', paddingTop: '20px' }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px', color: theme.main, fontWeight: 800, fontSize: '12px', letterSpacing: '2px' }}>LOL ESPORTS</div>
          <div style={{ position: 'absolute', top: '20px', right: '20px', color: theme.main, fontWeight: 800, fontSize: '12px', letterSpacing: '2px' }}>[20——25]</div>
          <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', fontFamily: "'Arial Black', sans-serif", fontSize: '72px', fontWeight: 900, color: theme.textMain, margin: 0, fontStyle: 'italic', letterSpacing: '-2px', transform: 'scaleX(1.1)' }}>
            <span>FIRST</span>
            {event?.logo ? ( <img src={event.logo} alt="FS" style={{ height: '70px', objectFit: 'contain', filter: theme.logoFilter }} /> ) : ( <span style={{ color: theme.main }}>♦</span> )}
            <span>STAND</span>
          </h2>
          <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: '20px', fontWeight: 900, color: theme.textMain, fontStyle: 'italic', letterSpacing: '4px', marginTop: '-5px' }}>TOURNAMENT</div>
        </div>
      );
    }
    return null;
  };

  const renderFooter = () => {
    if (isWorlds || isEWC) {
        return (
          <div style={{ 
              position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
              background: isWorlds ? 'rgba(5, 10, 25, 0.95)' : 'rgba(10, 10, 10, 0.95)', 
              backdropFilter: 'blur(16px)', borderRadius: isEWC ? '0px' : '50px',
              border: `1px solid ${isWorlds ? 'rgba(255, 255, 255, 0.15)' : 'rgba(212, 175, 55, 0.4)'}`, 
              padding: '12px 32px', display: 'flex', gap: '40px', alignItems: 'center', 
              boxShadow: isWorlds ? '0 10px 40px rgba(0,0,0,0.9)' : '0 10px 40px rgba(0,0,0,0.9), 0 0 15px rgba(212, 175, 55, 0.1)',
              zIndex: 1000 
          }}>
            <h3 style={{ fontFamily: theme.font, color: theme.textMain, margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {isTournamentOver ? "COMPÉTITION TERMINÉE" : `CONTRÔLE - ROUND ${currentRound + 1} / 3`}
            </h3>
            {isTournamentOver ? (
              <button onClick={() => socket.emit('continue-season')} disabled={isContinueReady}
                style={{ backgroundColor: isContinueReady ? theme.border : (isEWC ? theme.main : '#FFFFFF'), color: isContinueReady ? theme.textMuted : '#000', border: 'none', padding: '12px 28px', borderRadius: isEWC ? '0px' : '30px', fontSize: '14px', fontWeight: 800, cursor: isContinueReady ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: !isContinueReady && isWorlds ? `0 0 15px rgba(255,255,255,0.2)` : 'none' }}>
                {isContinueReady ? `EN ATTENTE (${state.continueSeasonVotes?.length || 0}/${humanCount})` : 'TERMINER LA SAISON'}
              </button>
            ) : roundComplete ? (
              <button onClick={advanceRound} disabled={isRoundReady} 
                style={{ backgroundColor: isRoundReady ? theme.border : (isEWC ? theme.main : '#FFFFFF'), color: isRoundReady ? theme.textMuted : '#000', border: 'none', padding: '12px 28px', borderRadius: isEWC ? '0px' : '30px', fontSize: '14px', fontWeight: 800, cursor: isRoundReady ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: !isRoundReady && isWorlds ? `0 0 15px rgba(255,255,255,0.2)` : 'none' }}>
                {isRoundReady ? `EN ATTENTE (${state.roundReady?.length || 0}/${humanCount})` : "TOUR SUIVANT"}
              </button>
            ) : (
              <button onClick={toggleReady} disabled={isGlobalReady} 
                style={{ backgroundColor: isGlobalReady ? theme.border : (isEWC ? theme.main : '#FFFFFF'), color: isGlobalReady ? theme.textMuted : '#000', border: 'none', padding: '12px 28px', borderRadius: isEWC ? '0px' : '30px', fontSize: '14px', fontWeight: 800, cursor: isGlobalReady ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: !isGlobalReady && isWorlds ? `0 0 15px rgba(255,255,255,0.2)` : 'none' }}>
                {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER LE MATCH'}
              </button>
            )}
          </div>
        );
    }

    return (
      <div style={{ width: '100%', maxWidth: '1200px', margin: '20px auto 0', background: theme.boxBg, borderRadius: '8px', border: `1px solid ${theme.border}`, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: theme.boxShadow }}>
        <h3 style={{ fontFamily: theme.font, color: theme.textMain, margin: 0, fontSize: '20px', fontWeight: 800 }}>
          {isTournamentOver ? "COMPÉTITION TERMINÉE" : `CONTRÔLE - ROUND ${currentRound + 1} / 3`}
        </h3>
        {isTournamentOver ? (
          <button onClick={() => socket.emit('continue-season')} disabled={isContinueReady}
            style={{ backgroundColor: isContinueReady ? theme.border : theme.main, color: isContinueReady ? theme.textMuted : '#FFF', border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 700, cursor: isContinueReady ? 'wait' : 'pointer' }}>
            {isContinueReady ? `EN ATTENTE (${state.continueSeasonVotes?.length || 0}/${humanCount})` : 'TERMINER LA SAISON'}
          </button>
        ) : roundComplete ? (
          <button onClick={advanceRound} disabled={isRoundReady} 
            style={{ backgroundColor: isRoundReady ? theme.border : theme.headerBg, color: isRoundReady ? theme.textMuted : '#FFF', border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 700, cursor: isRoundReady ? 'wait' : 'pointer' }}>
            {isRoundReady ? `EN ATTENTE (${state.roundReady?.length || 0}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button onClick={toggleReady} disabled={isGlobalReady} 
            style={{ backgroundColor: isGlobalReady ? theme.border : theme.main, color: isGlobalReady ? theme.textMuted : '#FFF', border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 700, cursor: isGlobalReady ? 'wait' : 'pointer' }}>
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, overflowY: 'auto', overflowX: 'hidden', backgroundColor: theme.bg, ...theme.bgStyle }}>
      
      <div style={{ width: '100%', position: 'relative', zIndex: 1, padding: '20px 4vw', paddingBottom: isWorlds || isEWC ? '140px' : '40px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {renderHeader()}

        <div style={{ display: 'flex', justifyContent: isWorlds || isEWC ? 'space-between' : 'space-around', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: isWorlds || isEWC ? '3vw' : '40px', flex: 1 }}>
          
          {bracket[0] && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isWorlds || isEWC ? '50px' : '40px', justifyContent: 'space-around', zIndex: 2 }}>
              {bracket[0].map(m => getMatchBox(m, "QUARTERFINALS"))}
            </div>
          )}
          
          {bracket[1] && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isWorlds || isEWC ? '100px' : '40px', justifyContent: 'space-around', zIndex: 2 }}>
              {bracket[1].map(m => getMatchBox(m, "SEMIFINALS"))}
            </div>
          )}
          
          {bracket[2] && (
            <div style={{ flex: isWorlds || isEWC ? 1.1 : 1, display: 'flex', flexDirection: 'column', gap: '40px', justifyContent: 'center', zIndex: 3 }}>
              {isWorlds || isEWC ? (
                  bracket[2].map(m => getMatchBox(m, "GRAND FINAL", true))
              ) : (
                  <div style={{ transform: 'scale(1.1)', zIndex: 2 }}>
                    {bracket[2].map(m => getMatchBox(m, "GRAND FINAL"))}
                  </div>
              )}
            </div>
          )}
        </div>

      </div>

      {renderFooter()}

      {secretUnlock && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#050508', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 2s forwards' }}>
          <div style={{ position: 'relative', zIndex: 2, boxShadow: '0 0 50px rgba(255, 61, 129, 0.3)', border: '1px solid #332918' }}>
            <img src={secretUnlock.image} alt="" style={{ maxHeight: '60vh', display: 'block', borderRadius: '4px' }} />
          </div>
        </div>
      )}
    </div>
  );
}