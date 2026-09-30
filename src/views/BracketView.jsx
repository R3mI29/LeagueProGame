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
      main: '#00e5ff', bg: '#0A0D14', boxBg: '#15171E', border: '#2B3040',
      font: "'Inter', sans-serif", textMain: '#FFFFFF', textMuted: '#7A8190',
      headerBg: '#1C212E', headerText: '#8C9AD6', logoPlaceholder: '#2B3040',
      logoFilter: 'drop-shadow(0px 1px 4px rgba(255,255,255,0.25))',
      boxShadow: 'none', bgStyle: {}
  };

  if (isWorlds) {
      theme = { ...theme,
          main: '#0033CC', bg: '#F0F1F5', boxBg: '#FFFFFF', border: '#D0D4E0',
          font: "'Oswald', sans-serif", textMain: '#000000', textMuted: '#666666',
          headerBg: '#0033CC', headerText: '#FFFFFF', logoPlaceholder: '#E0E3EB',
          logoFilter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          bgStyle: { backgroundImage: 'radial-gradient(circle at top right, rgba(0,51,204,0.05) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(0,51,204,0.05) 0%, transparent 40%)' }
      };
  } else if (isEWC) {
      theme = { ...theme,
          main: '#FF5900', bg: '#0D0B0A', boxBg: '#171413', border: '#332B28',
          font: "'Rajdhani', sans-serif", textMain: '#FFFFFF', textMuted: '#A39893',
          headerBg: '#1E1A18', headerText: '#FF5900', logoPlaceholder: '#2A2422',
          logoFilter: 'drop-shadow(0px 1px 5px rgba(255,255,255,0.3))', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          bgStyle: { backgroundImage: 'linear-gradient(135deg, rgba(255,89,0,0.03) 0%, transparent 100%)' }
      };
  } else if (isFirstStand) {
      // LE VRAI THÈME FIRST STAND (Clair & Lumineux)
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

  const getMatchBox = (match, title) => {
    if (!match) return null;
    const isSim = match.status === 'simulating_events' || match.status === 'simulating_result';
    const isFin = match.status === 'finished';
    const involvesMe = match.teamA?.id === myId || match.teamB?.id === myId;
    const isMyTurn = match.waveActive && match.status === 'pending' && involvesMe;
    const winnerId = isFin ? match.winner?.id : null;
    
    const getTeamStyle = (team) => {
        if (!team) return { color: theme.textMuted, weight: 500 };
        if (!isFin) return { color: theme.textMain, weight: 600 };
        if (winnerId === team.id) return { color: theme.textMain, weight: 800 };
        return { color: theme.textMuted, weight: 500 };
    };

    const teamAStyle = getTeamStyle(match.teamA);
    const teamBStyle = getTeamStyle(match.teamB);

    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: '340px', margin: '0 auto' }} key={match.id}>
        <div style={{ color: isFirstStand || isEWC ? theme.main : theme.headerText, fontSize: '11px', fontWeight: 800, position: 'absolute', top: '-18px', left: 0, letterSpacing: '1px', fontFamily: theme.font, textTransform: 'uppercase' }}>
            {title} {isSim && <span className="pulse-text" style={{ color: theme.main, marginLeft: '4px' }}>• LIVE</span>}
        </div>
        
        <div onClick={() => handleMatchClick(match)}
            style={{
                background: theme.boxBg, border: isMyTurn ? `2px solid ${theme.main}` : `1px solid ${theme.border}`,
                borderRadius: isWorlds ? '0px' : '6px', cursor: isMyTurn ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif",
                boxShadow: isMyTurn ? `0 0 15px ${theme.main}60` : theme.boxShadow
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${theme.border}`, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? `${theme.main}15` : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '32px', height: '32px', background: theme.logoPlaceholder, borderRadius: '6px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA ? match.teamA.name : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '18px', color: isWorlds ? theme.main : teamAStyle.color, fontWeight: teamAStyle.weight, marginLeft: '10px', flexShrink: 0 }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '-')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? `${theme.main}15` : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '32px', height: '32px', background: theme.logoPlaceholder, borderRadius: '6px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB ? match.teamB.name : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '18px', color: isWorlds ? theme.main : teamBStyle.color, fontWeight: teamBStyle.weight, marginLeft: '10px', flexShrink: 0 }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '-')}</span>
            </div>
        </div>
      </div>
    );
  };

  const renderHeader = () => {
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
          <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: '28px', fontWeight: 900, color: theme.main, fontStyle: 'italic', letterSpacing: '1px', marginTop: '5px', textShadow: 'none' }}>YOURS FOR THE TAKING</div>
        </div>
      );
    }
    if (isWorlds) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '80px', paddingTop: '40px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {event?.logo ? (
                  <img src={event.logo} alt="Worlds" style={{ height: '90px', objectFit: 'contain', filter: theme.logoFilter }} />
              ) : (
                  <div style={{ background: theme.main, padding: '10px 20px', borderRadius: '4px' }}>
                      <span style={{ color: '#FFF', fontSize: '40px', fontWeight: 'bold' }}>W</span>
                  </div>
              )}
              <h2 style={{ fontFamily: theme.font, fontSize: '72px', margin: 0, color: theme.textMain, textTransform: 'uppercase', transform: 'scaleY(1.1)' }}>KNOCKOUT STAGE</h2>
           </div>
           <div style={{ background: theme.main, color: '#FFF', padding: '6px 24px', marginTop: '15px', fontWeight: 'bold', letterSpacing: '3px', fontSize: '14px', borderRadius: '20px' }}>
              EARN YOUR LEGACY
           </div>
        </div>
      );
    }
    if (isEWC) {
      return (
        <div style={{ textAlign: 'center', marginBottom: '80px', paddingTop: '20px' }}>
           {event?.logo && <img src={event.logo} alt="EWC" style={{ height: '90px', objectFit: 'contain', marginBottom: '20px', filter: theme.logoFilter }} />}
           <h2 style={{ fontFamily: theme.font, fontSize: '56px', color: theme.textMain, margin: 0, textTransform: 'uppercase', letterSpacing: '4px' }}>ESPORTS WORLD CUP</h2>
           <div style={{ display: 'inline-block', background: `linear-gradient(90deg, transparent, ${theme.main}, transparent)`, height: '2px', width: '300px', margin: '20px auto' }}></div>
           <p style={{ color: theme.main, fontSize: '18px', letterSpacing: '8px', fontWeight: 'bold', margin: 0 }}>CHAMPIONSHIP BRACKET</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '40px', backgroundColor: theme.bg, ...theme.bgStyle }}>
      
      <div style={{ width: '100%', position: 'relative', zIndex: 1, padding: '20px 5vw', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {renderHeader()}

        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: '40px', flex: 1 }}>
          {bracket[0] && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px', justifyContent: 'space-around' }}>
              {bracket[0].map(m => getMatchBox(m, "QUARTERFINALS"))}
            </div>
          )}
          {bracket[1] && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px', justifyContent: 'space-around' }}>
              {bracket[1].map(m => getMatchBox(m, "SEMIFINALS"))}
            </div>
          )}
          {bracket[2] && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px', justifyContent: 'space-around' }}>
              <div style={{ transform: 'scale(1.1)', zIndex: 2 }}>
                {bracket[2].map(m => getMatchBox(m, "GRAND FINAL"))}
              </div>
            </div>
          )}
        </div>

      </div>

      <div style={{ width: '100%', maxWidth: '1200px', margin: '20px auto 0', background: theme.boxBg, borderRadius: '8px', border: `1px solid ${theme.border}`, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: theme.boxShadow }}>
        <h3 style={{ fontFamily: theme.font, color: theme.textMain, margin: 0, fontSize: '20px', fontWeight: 800 }}>
          {isTournamentOver ? "COMPÉTITION TERMINÉE" : `CONTRÔLE - ROUND ${currentRound + 1} / 3`}
        </h3>
        
        {isTournamentOver ? (
          <button onClick={() => socket.emit('continue-season')} disabled={isContinueReady}
            style={{ backgroundColor: isContinueReady ? theme.border : theme.main, color: isContinueReady ? theme.textMuted : (isFirstStand || isWorlds || isEWC ? '#FFF' : '#000'), border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 700, cursor: isContinueReady ? 'wait' : 'pointer' }}>
            {isContinueReady ? `EN ATTENTE (${state.continueSeasonVotes?.length || 0}/${humanCount})` : 'TERMINER LA SAISON'}
          </button>
        ) : roundComplete ? (
          <button onClick={advanceRound} disabled={isRoundReady} 
            style={{ backgroundColor: isRoundReady ? theme.border : (isFirstStand || isWorlds ? theme.headerBg : '#FFF'), color: isRoundReady ? theme.textMuted : (isFirstStand || isWorlds ? '#FFF' : '#000'), border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 700, cursor: isRoundReady ? 'wait' : 'pointer' }}>
            {isRoundReady ? `EN ATTENTE (${state.roundReady?.length || 0}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button onClick={toggleReady} disabled={isGlobalReady} 
            style={{ backgroundColor: isGlobalReady ? theme.border : theme.main, color: isGlobalReady ? theme.textMuted : (isFirstStand || isWorlds || isEWC ? '#FFF' : '#000'), border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 700, cursor: isGlobalReady ? 'wait' : 'pointer' }}>
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
          </button>
        )}
      </div>

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