import React from 'react';
import { socket } from '../../api/socket';

export default function DoubleElimView({ state, event }) {
  const { bracket, currentRound, roundComplete, readyPlayers } = state;
  const tourneyColor = event?.color || '#FFB020';
  const myId = socket.id;

  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
  const isGlobalReady = readyPlayers?.includes(myId);
  const isRoundReady = state.roundReady?.includes(myId);

  const toggleReady = () => socket.emit('toggle-ready');
  const advanceRound = () => socket.emit('advance-round');

  const handleMatchClick = (match) => {
    if (match && match.waveActive && match.status === 'pending' && (match.teamA?.id === myId || match.teamB?.id === myId)) {
      socket.emit('match-ready', match.id);
    }
  };

  const getMatchBox = (match, title) => {
    if (!match) return null;
    const isSim = match.status === 'simulating';
    const isFin = match.status === 'finished';
    const involvesMe = match.teamA?.id === myId || match.teamB?.id === myId;
    const isMyTurn = match.waveActive && match.status === 'pending' && involvesMe;

    return (
      <div 
        onClick={() => handleMatchClick(match)}
        style={{ 
          background: '#11141E',
          border: isMyTurn ? `2px solid ${tourneyColor}` : `1px solid #222838`,
          borderRadius: '8px', padding: '10px', marginBottom: '16px', minWidth: '220px',
          cursor: isMyTurn ? 'pointer' : 'default',
          boxShadow: isMyTurn ? `0 0 15px ${tourneyColor}40` : '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'all 0.2s', position: 'relative'
        }}
      >
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '10px', color: '#768196', marginBottom: '8px', textAlign: 'center', letterSpacing: '1px' }}>
          {title} {isSim && <span className="pulse-text" style={{ color: tourneyColor }}>[EN COURS]</span>}
        </div>

        {/* TEAM A */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: isFin && match.winner?.id === match.teamA?.id ? 'rgba(255,255,255,0.05)' : 'transparent', opacity: !match.teamA ? 0.3 : 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: match.teamA?.id === myId ? tourneyColor : '#F0F2F5' }}>{match.teamA ? match.teamA.name : 'TBD'}</span>
          {isFin && <span style={{ fontWeight: 700, color: match.winner?.id === match.teamA?.id ? tourneyColor : '#768196' }}>{match.scoreA}</span>}
        </div>

        {/* TEAM B */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: isFin && match.winner?.id === match.teamB?.id ? 'rgba(255,255,255,0.05)' : 'transparent', opacity: !match.teamB ? 0.3 : 1, marginTop: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: match.teamB?.id === myId ? tourneyColor : '#F0F2F5' }}>{match.teamB ? match.teamB.name : 'TBD'}</span>
          {isFin && <span style={{ fontWeight: 700, color: match.winner?.id === match.teamB?.id ? tourneyColor : '#768196' }}>{match.scoreB}</span>}
        </div>
      </div>
    );
  };

  const getMatchesByPrefix = (prefix) => {
    return bracket.flat().filter(m => m.id.startsWith(prefix));
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '40px' }}>
      
      {/* SECTION WINNER BRACKET */}
      <div style={{ background: '#080A10', borderRadius: '12px', border: `1px solid #222838`, padding: '24px', marginBottom: '30px' }}>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", color: tourneyColor, margin: '0 0 20px 0', fontSize: '24px' }}>WINNER BRACKET</h2>
        <div style={{ display: 'flex', gap: '30px' }}>
          <div>{getMatchesByPrefix('ub1').map(m => getMatchBox(m, "1/8 FINALE"))}</div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub2').map(m => getMatchBox(m, "QUARTS"))}</div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub3').map(m => getMatchBox(m, "DEMIES"))}</div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub4').map(m => getMatchBox(m, "FINALE WB"))}</div>
        </div>
      </div>

      {/* SECTION LOSER BRACKET */}
      <div style={{ background: '#080A10', borderRadius: '12px', border: `1px solid #222838`, padding: '24px', marginBottom: '30px' }}>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", color: '#ff3366', margin: '0 0 20px 0', fontSize: '24px' }}>LOSER BRACKET (SURVIE)</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>{getMatchesByPrefix('lb1').map(m => getMatchBox(m, "ROUND 1"))}</div>
          <div>{getMatchesByPrefix('lb2').map(m => getMatchBox(m, "ROUND 2"))}</div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb3').map(m => getMatchBox(m, "ROUND 3"))}</div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb4').map(m => getMatchBox(m, "ROUND 4"))}</div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb5').map(m => getMatchBox(m, "DEMI LB"))}</div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb6').map(m => getMatchBox(m, "FINALE LB"))}</div>
        </div>
      </div>

      {/* GRANDE FINALE */}
      <div style={{ background: '#080A10', borderRadius: '12px', border: `2px solid ${tourneyColor}`, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', margin: '0 0 20px 0', fontSize: '28px' }}>GRANDE FINALE</h2>
        <div style={{ transform: 'scale(1.2)' }}>
          {getMatchesByPrefix('gf').map(m => getMatchBox(m, "LE CHOC ULTIME"))}
        </div>
      </div>

      {/* BARRE DE CONTRÔLE (Ronde par ronde) */}
      {/* BARRE DE CONTRÔLE (Ronde par ronde) */}
      <div style={{ marginTop: '40px', background: '#11141E', borderRadius: '12px', border: `1px solid #222838`, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', margin: '0 0 8px 0', fontSize: '20px' }}>
            {state.champion ? "TOURNOI TERMINÉ" : `CONTRÔLE - ROUND ${currentRound + 1} / 8`}
          </h3>
          <span style={{ color: '#768196', fontSize: '14px' }}>
            {state.champion ? `Victoire de ${state.champion.name} !` : roundComplete ? "Phase terminée. Passez au round suivant." : "Validez pour déclencher les matchs de ce round."}
          </span>
        </div>
        
        {state.champion ? (
          <button 
            onClick={() => socket.emit('continue-season')}
            style={{ backgroundColor: '#ff3366', color: '#FFF', border: 'none', padding: '16px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(255, 51, 102, 0.4)' }}
          >
            TERMINER LA COMPÉTITION 🏆
          </button>
        ) : roundComplete ? (
          <button 
            onClick={advanceRound}
            disabled={isRoundReady}
            style={{ 
              backgroundColor: isRoundReady ? '#222838' : '#FFF', 
              color: isRoundReady ? '#768196' : '#000', 
              border: 'none', padding: '16px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, 
              cursor: isRoundReady ? 'wait' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button 
            onClick={toggleReady}
            disabled={isGlobalReady}
            style={{ 
              backgroundColor: isGlobalReady ? '#222838' : tourneyColor, 
              color: isGlobalReady ? '#768196' : '#000', 
              border: 'none', padding: '16px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, 
              cursor: isGlobalReady ? 'wait' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
          </button>
        )}
      </div>

    </div>
  );
}