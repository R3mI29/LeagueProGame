import React from 'react';
import { socket } from '../../api/socket';

export default function DoubleElimView({ state, event }) {
  const { bracket, currentRound, roundComplete, readyPlayers } = state;
  const myId = socket.id;

  // Ce composant est appelé spécifiquement pour le MSI, donc on force le thème MSI
  const msiRed = '#E6192B';
  const msiYellow = '#FFEA00';
  const bgDark = '#0B0D14';
  const boxBg = '#141824';
  const borderMuted = '#2A3042';
  const logoFilter = 'drop-shadow(0px 1px 4px rgba(255,255,255,0.25))';

  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-') && !p.isBot).length;
  const isGlobalReady = readyPlayers?.includes(myId);
  const isRoundReady = state.roundReady?.includes(myId);

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
        if (!team) return { color: '#7A8190', weight: 500 };
        if (!isFin) return { color: '#FFF', weight: 600 };
        if (winnerId === team.id) return { color: '#FFF', weight: 900 };
        return { color: '#7A8190', weight: 500 };
    };

    const teamAStyle = getTeamStyle(match.teamA);
    const teamBStyle = getTeamStyle(match.teamB);

    return (
      <div style={{ position: 'relative', marginBottom: '16px' }} key={match.id}>
        <div style={{ color: isMyTurn ? msiYellow : '#768196', fontSize: '11px', fontWeight: 900, position: 'absolute', top: '-14px', left: 0, letterSpacing: '0.5px', fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic' }}>
            {title} {isSim && <span className="pulse-text" style={{ color: msiRed, marginLeft: '4px' }}>• LIVE</span>}
        </div>
        
        <div onClick={() => handleMatchClick(match)}
            style={{
                background: boxBg, border: isMyTurn ? `3px solid ${msiYellow}` : `1px solid ${borderMuted}`,
                minWidth: '140px', cursor: isMyTurn ? 'pointer' : 'default',
                boxShadow: isMyTurn ? `4px 4px 0px ${msiRed}` : '2px 2px 0px rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif"
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${borderMuted}`, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? 'rgba(230, 25, 43, 0.15)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: logoFilter }} /> : <div style={{ width: '28px', height: '28px', background: '#2B3040' }} />}
                    <span style={{ fontSize: '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? 'rgba(230, 25, 43, 0.15)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: logoFilter }} /> : <div style={{ width: '28px', height: '28px', background: '#2B3040' }} />}
                    <span style={{ fontSize: '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight }}>{match.teamB ? match.teamB.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '')}</span>
            </div>
        </div>
      </div>
    );
  };

  const getMatchesByPrefix = (prefix) => bracket.flat().filter(m => m.id.startsWith(prefix));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, overflowY: 'auto', overflowX: 'hidden', padding: '40px 5vw', backgroundColor: bgDark }}>
      
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) fixed', width: '100vw', height: '100vh', background: `radial-gradient(circle, ${msiRed} 0%, transparent 40%)`, opacity: 0.08, pointerEvents: 'none', filter: 'blur(50px)', zIndex: 0 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, alignItems: 'center', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', paddingBottom: '20px' }}>
          
          <div style={{ position: 'relative', borderLeft: `4px solid ${msiRed}`, paddingLeft: '16px' }}>
            <h2 style={{ fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic', color: '#FFF', margin: '0 0 30px 0', fontSize: '18px', letterSpacing: '1px' }}>WINNER BRACKET</h2>
            <div style={{ display: 'flex', gap: '3vw' }}>
              <div style={{ flexShrink: 0 }}>{getMatchesByPrefix('ub1').map(m => getMatchBox(m, "ROUND 1"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub2').map(m => getMatchBox(m, "QUARTER"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub3').map(m => getMatchBox(m, "SEMI"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub4').map(m => getMatchBox(m, "FINAL"))}</div>
            </div>
          </div>

          <div style={{ position: 'relative', borderLeft: `4px solid #555`, paddingLeft: '16px' }}>
            <h2 style={{ fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic', color: '#888', margin: '0 0 30px 0', fontSize: '18px', letterSpacing: '1px' }}>LOSER BRACKET</h2>
            <div style={{ display: 'flex', gap: '2vw' }}>
              <div style={{ flexShrink: 0 }}>{getMatchesByPrefix('lb1').map(m => getMatchBox(m, "L-ROUND 1"))}</div>
              <div style={{ flexShrink: 0 }}>{getMatchesByPrefix('lb2').map(m => getMatchBox(m, "L-ROUND 2"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb3').map(m => getMatchBox(m, "L-ROUND 3"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb4').map(m => getMatchBox(m, "L-ROUND 4"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb5').map(m => getMatchBox(m, "L-SEMI"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb6').map(m => getMatchBox(m, "L-FINAL"))}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ background: boxBg, border: `2px solid ${msiRed}`, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: `inset 0 0 30px ${msiRed}20`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', background: msiYellow, color: '#000', padding: '4px 12px', fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic', fontSize: '12px', textTransform: 'uppercase', boxShadow: '2px 2px 0px #000' }}>
              PHASE ULTIME
            </div>
            <h2 style={{ fontFamily: "'Arial Black', sans-serif", color: '#FFF', margin: '10px 0 40px 0', fontSize: '24px', fontStyle: 'italic', textShadow: `2px 2px 0px ${msiRed}`, textAlign: 'center' }}>
              GRANDE FINALE
            </h2>
            <div style={{ width: '100%', transform: 'scale(1.2)', transformOrigin: 'top center' }}>
              {getMatchesByPrefix('gf').map(m => getMatchBox(m, "CHAMPIONSHIP"))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        margin: '50px auto 0', background: boxBg, border: `3px solid ${msiRed}`, width: '100%', maxWidth: '1600px',
        padding: '24px 32px', boxShadow: `6px 6px 0px ${msiYellow}`, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h3 style={{ fontFamily: "'Arial Black', sans-serif", color: '#FFF', margin: 0, fontSize: '20px', fontStyle: 'italic', textTransform: 'uppercase' }}>
          {state.champion ? "COMPÉTITION TERMINÉE" : `ROUND ${currentRound + 1} / 8`}
        </h3>
        
        {state.champion ? (
          <button onClick={() => socket.emit('continue-season')} style={{ backgroundColor: msiYellow, color: '#000', border: 'none', padding: '14px 28px', fontFamily: "'Arial Black', sans-serif", fontSize: '16px', fontStyle: 'italic', cursor: 'pointer' }}>
            TERMINER LA COMPÉTITION
          </button>
        ) : roundComplete ? (
          <button onClick={advanceRound} disabled={isRoundReady} style={{ backgroundColor: isRoundReady ? borderMuted : '#FFF', color: isRoundReady ? '#888' : '#000', border: 'none', padding: '14px 28px', fontFamily: "'Arial Black', sans-serif", fontSize: '16px', fontStyle: 'italic', cursor: isRoundReady ? 'wait' : 'pointer', boxShadow: isRoundReady ? 'none' : `3px 3px 0px ${msiRed}` }}>
            {isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button onClick={toggleReady} disabled={isGlobalReady} style={{ backgroundColor: isGlobalReady ? borderMuted : msiYellow, color: isGlobalReady ? '#888' : '#000', border: 'none', padding: '14px 28px', fontFamily: "'Arial Black', sans-serif", fontSize: '16px', fontStyle: 'italic', cursor: isGlobalReady ? 'wait' : 'pointer', boxShadow: isGlobalReady ? 'none' : `3px 3px 0px ${msiRed}` }}>
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
          </button>
        )}
      </div>

    </div>
  );
}