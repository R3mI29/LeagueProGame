import React from 'react';
import { socket } from '../../api/socket';

export default function DoubleElimView({ state, event }) {
  const { bracket, currentRound, roundComplete, readyPlayers } = state;
  
  // Palette de couleurs "Brutaliste" inspirée du MSI
  const msiRed = '#E6192B';
  const msiYellow = '#FFEA00';
  const bgDark = '#0B0D14';
  const boxBg = '#141824';
  const borderMuted = '#2A3042';

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
          background: boxBg,
          border: isMyTurn ? `2px solid ${msiYellow}` : `1px solid ${borderMuted}`,
          borderRadius: '2px', // Bords tranchants pour la DA Brutaliste
          padding: '12px', marginBottom: '16px', minWidth: '200px',
          cursor: isMyTurn ? 'pointer' : 'default',
          boxShadow: isMyTurn ? `4px 4px 0px ${msiRed}` : '2px 2px 0px rgba(0,0,0,0.5)',
          transition: 'all 0.1s', position: 'relative',
          transform: isMyTurn ? 'translate(-2px, -2px)' : 'none'
        }}
      >
        <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: '10px', color: isMyTurn ? msiYellow : '#768196', marginBottom: '10px', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase', fontStyle: 'italic' }}>
          {title} {isSim && <span className="pulse-text" style={{ color: msiRed }}>[FIGHT]</span>}
        </div>

        {/* TEAM A */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: isFin && match.winner?.id === match.teamA?.id ? `${msiRed}20` : 'transparent', opacity: !match.teamA ? 0.3 : 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: match.teamA?.id === myId ? msiYellow : '#F0F2F5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
            {match.teamA ? match.teamA.name : 'TBD'}
          </span>
          {isFin && <span style={{ fontWeight: 900, color: match.winner?.id === match.teamA?.id ? msiRed : '#768196' }}>{match.scoreA}</span>}
        </div>

        {/* TEAM B */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: isFin && match.winner?.id === match.teamB?.id ? `${msiRed}20` : 'transparent', opacity: !match.teamB ? 0.3 : 1, marginTop: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: match.teamB?.id === myId ? msiYellow : '#F0F2F5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
            {match.teamB ? match.teamB.name : 'TBD'}
          </span>
          {isFin && <span style={{ fontWeight: 900, color: match.winner?.id === match.teamB?.id ? msiRed : '#768196' }}>{match.scoreB}</span>}
        </div>
      </div>
    );
  };

  const getMatchesByPrefix = (prefix) => {
    return bracket.flat().filter(m => m.id.startsWith(prefix));
  };

  return (
    <div style={{ width: '100%', position: 'relative', paddingBottom: '120px' }}>
      
      {/* EFFET DE FOND "SANG / ENCRE" */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100vw', height: '100vw', background: `radial-gradient(circle, ${msiRed} 0%, transparent 40%)`,
        opacity: 0.08, pointerEvents: 'none', filter: 'blur(50px)', zIndex: 0
      }} />

      {/* LE NOUVEAU LAYOUT EN GRILLE (Brackets à gauche, Finale à droite) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '40px', position: 'relative', zIndex: 1, alignItems: 'center' }}>
        
        {/* COLONNE GAUCHE : WINNER & LOSER BRACKETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', overflowX: 'auto', paddingBottom: '20px' }}>
          
          {/* SECTION WINNER BRACKET */}
          <div style={{ background: bgDark, border: `2px solid ${borderMuted}`, borderLeft: `8px solid ${msiRed}`, padding: '24px', position: 'relative' }}>
            <h2 style={{ fontFamily: "'Arial Black', sans-serif", color: '#FFF', margin: '0 0 20px 0', fontSize: '22px', fontStyle: 'italic', textTransform: 'uppercase' }}>
              WINNER BRACKET
            </h2>
            <div style={{ display: 'flex', gap: '30px' }}>
              <div style={{ flexShrink: 0 }}>{getMatchesByPrefix('ub1').map(m => getMatchBox(m, "1/8 FINALE"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub2').map(m => getMatchBox(m, "QUARTS"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub3').map(m => getMatchBox(m, "DEMIES"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('ub4').map(m => getMatchBox(m, "FINALE WB"))}</div>
            </div>
          </div>

          {/* SECTION LOSER BRACKET */}
          <div style={{ background: bgDark, border: `2px solid ${borderMuted}`, borderLeft: `8px solid #555`, padding: '24px', position: 'relative' }}>
            <h2 style={{ fontFamily: "'Arial Black', sans-serif", color: '#888', margin: '0 0 20px 0', fontSize: '18px', fontStyle: 'italic', textTransform: 'uppercase' }}>
              LOSER BRACKET (SURVIE)
            </h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flexShrink: 0 }}>{getMatchesByPrefix('lb1').map(m => getMatchBox(m, "ROUND 1"))}</div>
              <div style={{ flexShrink: 0 }}>{getMatchesByPrefix('lb2').map(m => getMatchBox(m, "ROUND 2"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb3').map(m => getMatchBox(m, "ROUND 3"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb4').map(m => getMatchBox(m, "ROUND 4"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb5').map(m => getMatchBox(m, "DEMI LB"))}</div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{getMatchesByPrefix('lb6').map(m => getMatchBox(m, "FINALE LB"))}</div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : GRANDE FINALE */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ background: bgDark, border: `4px solid ${msiRed}`, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: `inset 0 0 40px ${msiRed}30`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-15px', background: msiYellow, color: '#000', padding: '4px 16px', fontFamily: "'Arial Black', sans-serif", fontStyle: 'italic', fontSize: '14px', textTransform: 'uppercase', boxShadow: '2px 2px 0px #000' }}>
              PHASE ULTIME
            </div>
            <h2 style={{ fontFamily: "'Arial Black', sans-serif", color: '#FFF', margin: '20px 0 30px 0', fontSize: '28px', fontStyle: 'italic', textShadow: `3px 3px 0px ${msiRed}`, textAlign: 'center' }}>
              GRANDE FINALE
            </h2>
            <div style={{ width: '100%', transform: 'scale(1.15)', transformOrigin: 'top center' }}>
              {getMatchesByPrefix('gf').map(m => getMatchBox(m, "LE CHOC ULTIME"))}
            </div>
          </div>
        </div>

      </div>

      {/* PANNEAU DE CONTRÔLE FIXÉ EN BAS À DROITE */}
      <div style={{ 
        position: 'fixed', bottom: '40px', right: '40px', 
        background: bgDark, border: `3px solid ${msiRed}`, padding: '24px', 
        boxShadow: `8px 8px 0px ${msiYellow}`, zIndex: 1000, 
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '340px' 
      }}>
        <h3 style={{ fontFamily: "'Arial Black', sans-serif", color: '#FFF', margin: '0 0 8px 0', fontSize: '20px', fontStyle: 'italic', textTransform: 'uppercase' }}>
          {state.champion ? "COMPÉTITION TERMINÉE" : `ROUND ${currentRound + 1} / 8`}
        </h3>
        <span style={{ color: '#888', fontSize: '12px', marginBottom: '20px', textAlign: 'right', fontFamily: "'Inter', sans-serif" }}>
          {state.champion ? `Le trophée appartient à ${state.champion.name} !` : roundComplete ? "Tous les matchs sont terminés. Passez au round suivant." : "Validez pour déclencher la simulation."}
        </span>
        
        {state.champion ? (
          <button 
            onClick={() => socket.emit('continue-season')}
            style={{ 
              width: '100%', backgroundColor: msiYellow, color: '#000', border: 'none', padding: '16px', 
              fontFamily: "'Arial Black', sans-serif", fontSize: '16px', fontStyle: 'italic', cursor: 'pointer', transition: 'all 0.1s' 
            }}
            onMouseDown={(e) => { e.target.style.transform = 'translate(2px, 2px)'; e.target.style.boxShadow = 'none'; }}
            onMouseUp={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = `4px 4px 0px ${msiRed}`; }}
            onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = 'none'; }}
          >
            TERMINER LA COMPÉTITION
          </button>
        ) : roundComplete ? (
          <button 
            onClick={advanceRound} disabled={isRoundReady}
            style={{ 
              width: '100%', backgroundColor: isRoundReady ? borderMuted : '#FFF', color: isRoundReady ? '#888' : '#000', 
              border: 'none', padding: '16px', fontFamily: "'Arial Black', sans-serif", fontSize: '16px', fontStyle: 'italic', 
              cursor: isRoundReady ? 'wait' : 'pointer', boxShadow: isRoundReady ? 'none' : `4px 4px 0px ${msiRed}`, transition: 'all 0.1s' 
            }}
          >
            {isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button 
            onClick={toggleReady} disabled={isGlobalReady}
            style={{ 
              width: '100%', backgroundColor: isGlobalReady ? borderMuted : msiYellow, color: isGlobalReady ? '#888' : '#000', 
              border: 'none', padding: '16px', fontFamily: "'Arial Black', sans-serif", fontSize: '16px', fontStyle: 'italic', 
              cursor: isGlobalReady ? 'wait' : 'pointer', boxShadow: isGlobalReady ? 'none' : `4px 4px 0px ${msiRed}`, transition: 'all 0.1s' 
            }}
          >
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
          </button>
        )}
      </div>

    </div>
  );
}