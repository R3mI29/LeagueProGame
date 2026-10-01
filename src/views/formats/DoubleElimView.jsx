import React from 'react';
import { socket } from '../../api/socket';

export default function DoubleElimView({ state, event }) {
  const { bracket, currentRound, roundComplete, readyPlayers } = state;
  const myId = socket.id;

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

  const getMatchBox = (match, title, isFinal = false) => {
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
      <div style={{ position: 'relative', width: '100%', minWidth: isFinal ? '240px' : '150px' }} key={match.id}>
        <div style={{ color: isMyTurn ? msiYellow : '#768196', fontSize: isFinal ? '12px' : '11px', fontWeight: 900, position: 'absolute', top: isFinal ? '-16px' : '-14px', left: 0, letterSpacing: '0.5px', fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic' }}>
            {title} {isSim && <span className="pulse-text" style={{ color: msiRed, marginLeft: '4px' }}>• LIVE</span>}
        </div>
        
        <div onClick={() => handleMatchClick(match)}
            style={{
                background: boxBg, border: isMyTurn ? `3px solid ${msiYellow}` : `1px solid ${borderMuted}`,
                cursor: isMyTurn ? 'pointer' : 'default',
                boxShadow: isMyTurn ? `4px 4px 0px ${msiRed}` : '2px 2px 0px rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif"
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isFinal ? '12px 14px' : '6px 10px', borderBottom: `1px solid ${borderMuted}`, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? 'rgba(230, 25, 43, 0.15)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', objectFit: 'contain', filter: logoFilter }} /> : <div style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', background: '#2B3040' }} />}
                    <span style={{ fontSize: isFinal ? '18px' : '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: isFinal ? '20px' : '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isFinal ? '12px 14px' : '6px 10px', opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? 'rgba(230, 25, 43, 0.15)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', objectFit: 'contain', filter: logoFilter }} /> : <div style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', background: '#2B3040' }} />}
                    <span style={{ fontSize: isFinal ? '18px' : '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight }}>{match.teamB ? match.teamB.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: isFinal ? '20px' : '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '')}</span>
            </div>
        </div>
      </div>
    );
  };

  const getMatchesByPrefix = (prefix) => bracket.flat().filter(m => m.id.startsWith(prefix));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, overflowY: 'auto', overflowX: 'auto', padding: '40px 5vw', backgroundColor: bgDark }}>
      
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '100vh', background: `radial-gradient(circle, ${msiRed} 0%, transparent 40%)`, opacity: 0.08, pointerEvents: 'none', filter: 'blur(50px)', zIndex: 0 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', position: 'relative', zIndex: 1, maxWidth: '1800px', margin: '0 auto', paddingBottom: '120px' }}>
        
        {/* WINNER BRACKET + GRANDE FINALE */}
        <div style={{ position: 'relative', borderLeft: `4px solid ${msiRed}`, paddingLeft: '24px' }}>
          <h2 style={{ fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic', color: '#FFF', margin: '0 0 40px 0', fontSize: '20px', letterSpacing: '2px' }}>WINNER BRACKET</h2>
          
          <div style={{ display: 'flex', gap: '6vw', alignItems: 'stretch' }}>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '30px' }}>
                {getMatchesByPrefix('ub1').map(m => getMatchBox(m, "ROUND 1"))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '40px' }}>
                {getMatchesByPrefix('ub2').map(m => getMatchBox(m, "QUARTER"))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '60px' }}>
                {getMatchesByPrefix('ub3').map(m => getMatchBox(m, "SEMI"))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {getMatchesByPrefix('ub4').map(m => getMatchBox(m, "FINAL"))}
            </div>
            
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '5vw' }}>
              <div style={{ background: boxBg, border: `2px solid ${msiRed}`, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: `inset 0 0 30px ${msiRed}20`, position: 'relative', width: '100%', minWidth: '280px' }}>
                <div style={{ position: 'absolute', top: '-14px', background: msiYellow, color: '#000', padding: '6px 16px', fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic', fontSize: '13px', textTransform: 'uppercase', boxShadow: '3px 3px 0px #000' }}>
                  PHASE ULTIME
                </div>
                <h2 style={{ fontFamily: "'Arial Black', sans-serif", color: '#FFF', margin: '10px 0 40px 0', fontSize: '26px', fontStyle: 'italic', textShadow: `2px 2px 0px ${msiRed}`, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  GRANDE FINALE
                </h2>
                <div style={{ width: '100%' }}>
                  {getMatchesByPrefix('gf').map(m => getMatchBox(m, "CHAMPIONSHIP", true))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* LOSER BRACKET */}
        <div style={{ position: 'relative', borderLeft: `4px solid #555`, paddingLeft: '24px' }}>
          <h2 style={{ fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic', color: '#888', margin: '0 0 40px 0', fontSize: '20px', letterSpacing: '2px' }}>LOSER BRACKET</h2>
          
          <div style={{ display: 'flex', gap: '4vw', alignItems: 'stretch' }}>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '30px' }}>
                {getMatchesByPrefix('lb1').map(m => getMatchBox(m, "L-ROUND 1"))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '30px' }}>
                {getMatchesByPrefix('lb2').map(m => getMatchBox(m, "L-ROUND 2"))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '40px' }}>
                {getMatchesByPrefix('lb3').map(m => getMatchBox(m, "L-ROUND 3"))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '40px' }}>
                {getMatchesByPrefix('lb4').map(m => getMatchBox(m, "L-ROUND 4"))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '60px' }}>
                {getMatchesByPrefix('lb5').map(m => getMatchBox(m, "L-SEMI"))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {getMatchesByPrefix('lb6').map(m => getMatchBox(m, "L-FINAL"))}
            </div>
          </div>
        </div>

      </div>

      {/* ENCART DE CONTRÔLE DÉPLACÉ EN BAS À DROITE */}
      <div style={{ 
        position: 'fixed', bottom: '40px', right: '40px',
        background: boxBg, border: `3px solid ${msiRed}`, width: '320px',
        padding: '20px', boxShadow: `6px 6px 0px ${msiYellow}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 1000
      }}>
        <h3 style={{ fontFamily: "'Arial Black', sans-serif", color: '#FFF', margin: 0, fontSize: '16px', fontStyle: 'italic', textTransform: 'uppercase', textAlign: 'center' }}>
          {state.champion ? "COMPÉTITION TERMINÉE" : `ROUND ${currentRound + 1} / 8`}
        </h3>
        
        {state.champion ? (
          <button onClick={() => socket.emit('continue-season')} style={{ width: '100%', backgroundColor: msiYellow, color: '#000', border: 'none', padding: '12px', fontFamily: "'Arial Black', sans-serif", fontSize: '14px', fontStyle: 'italic', cursor: 'pointer' }}>
            TERMINER SAISON
          </button>
        ) : roundComplete ? (
          <button onClick={advanceRound} disabled={isRoundReady} style={{ width: '100%', backgroundColor: isRoundReady ? borderMuted : '#FFF', color: isRoundReady ? '#888' : '#000', border: 'none', padding: '12px', fontFamily: "'Arial Black', sans-serif", fontSize: '14px', fontStyle: 'italic', cursor: isRoundReady ? 'wait' : 'pointer', boxShadow: isRoundReady ? 'none' : `3px 3px 0px ${msiRed}` }}>
            {isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button onClick={toggleReady} disabled={isGlobalReady} style={{ width: '100%', backgroundColor: isGlobalReady ? borderMuted : msiYellow, color: isGlobalReady ? '#888' : '#000', border: 'none', padding: '12px', fontFamily: "'Arial Black', sans-serif", fontSize: '14px', fontStyle: 'italic', cursor: isGlobalReady ? 'wait' : 'pointer', boxShadow: isGlobalReady ? 'none' : `3px 3px 0px ${msiRed}` }}>
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER MATCH'}
          </button>
        )}
      </div>

    </div>
  );
}