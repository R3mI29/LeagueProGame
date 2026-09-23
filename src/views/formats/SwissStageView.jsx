import React from 'react';
import { socket } from '../../api/socket';

export default function SwissStageView({ state, event }) {
  // Application de l'Or Champagne pour le format Worlds !
  const tourneyColor = event?.isMajor ? '#D1B478' : (event?.color || '#FF3D81');
  
  const myId = socket.id;
  const { bracket, currentRound, readyPlayers, roundComplete } = state;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
  const isGlobalReady = readyPlayers?.includes(myId);
  const isRoundReady = state.roundReady?.includes(myId);

  const COLUMNS = [
    ['0-0'],
    ['1-0', '0-1'],
    ['2-0', '1-1', '0-2'],
    ['2-1', '1-2'],
    ['2-2']
  ];

  const getPoolHeaderColor = (pool) => {
    if (['2-0', '2-1'].includes(pool)) return '#2d7a46'; 
    if (['0-2', '1-2'].includes(pool)) return '#d64545'; 
    return '#2B3245'; 
  };

  const handleMatchClick = (match) => {
    if (match && match.waveActive && match.status === 'pending' && (match.teamA?.id === myId || match.teamB?.id === myId)) {
      socket.emit('match-ready', match.id);
    }
  };

  const allMatches = bracket ? bracket.flat() : [];

  const SwissMatchBox = ({ match }) => {
    if (!match) return null;
    const teamAName = match.teamA ? match.teamA.name : '?';
    const teamBName = match.teamB ? match.teamB.name : '?';

    const isSim = match.status === 'simulating';
    const isFin = match.status === 'finished';
    const involvesMe = match.teamA?.id === myId || match.teamB?.id === myId;
    const isMyTurn = match.waveActive && match.status === 'pending' && involvesMe;
    const isActiveRound = bracket[currentRound]?.some(m => m.id === match.id);

    return (
      <div
        onClick={() => handleMatchClick(match)}
        style={{
          display: 'flex', flexDirection: 'column', gap: '4px',
          background: '#1A1E29', padding: '10px', borderRadius: '6px',
          border: isMyTurn ? `1px solid ${tourneyColor}` : '1px solid transparent',
          cursor: isMyTurn ? 'pointer' : 'default',
          opacity: isActiveRound || isFin ? 1 : 0.4,
          boxShadow: isMyTurn ? `0 0 10px ${tourneyColor}60` : 'none',
          transition: 'all 0.2s'
        }}
      >
        {isSim && <div className="pulse-text" style={{ fontSize: '9px', color: tourneyColor, textAlign: 'center', marginBottom: '4px', letterSpacing: '1px' }}>FIGHTING...</div>}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', color: isFin && match.winner?.id === match.teamA?.id ? tourneyColor : '#FFF', fontSize: '12px', fontWeight: 600 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{teamAName}</span>
          {isFin && <span>{match.scoreA}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: isFin && match.winner?.id === match.teamB?.id ? tourneyColor : '#FFF', fontSize: '12px', fontWeight: 600 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{teamBName}</span>
          {isFin && <span>{match.scoreB}</span>}
        </div>
      </div>
    );
  };

  const SwissPoolBlock = ({ pool }) => {
    const poolMatches = allMatches.filter(m => m.pool === pool);
    if (poolMatches.length === 0) return null;

    return (
      <div style={{ background: '#202534', borderRadius: '8px', overflow: 'hidden', minWidth: '170px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
        <div style={{ background: getPoolHeaderColor(pool), padding: '8px', textAlign: 'center', color: '#FFF', fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>
          {pool}
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {poolMatches.map(m => <SwissMatchBox key={m.id} match={m} />)}
        </div>
      </div>
    );
  };

  if (!bracket || bracket.length === 0) return <div style={{ color: '#FFF', padding: '40px', textAlign: 'center' }}>Génération en cours...</div>;

  return (
    <div style={{ width: '100%', paddingBottom: '40px', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '36px', color: '#FFF', margin: '0 0 8px 0', textTransform: 'uppercase', textShadow: `0 0 20px ${tourneyColor}40` }}>
          TOURNAMENT STAGES : SWISS STAGE
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '20px' }}>
        {COLUMNS.map((col, colIdx) => (
          <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {col.map(pool => (
              <SwissPoolBlock key={pool} pool={pool} />
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', background: '#11141E', borderRadius: '12px', border: `1px solid #222838`, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '30px auto 0' }}>
        <div>
          <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', margin: '0 0 8px 0', fontSize: '20px' }}>
            {roundComplete ? "GÉNÉRATION DU TIRAGE SUIVANT" : `CONTRÔLE - ROUND ${currentRound + 1} / 5`}
          </h3>
          <span style={{ color: '#768196', fontSize: '14px' }}>
            {roundComplete ? "L'algorithme de seeding prépare le prochain tour." : "Validez pour déclencher les matchs de ce round."}
          </span>
        </div>
        
        <button 
          onClick={roundComplete ? () => socket.emit('advance-round') : () => socket.emit('toggle-ready')}
          disabled={roundComplete ? isRoundReady : isGlobalReady}
          style={{ 
            backgroundColor: (roundComplete ? isRoundReady : isGlobalReady) ? '#222838' : (roundComplete ? '#FFF' : tourneyColor), 
            color: (roundComplete ? isRoundReady : isGlobalReady) ? '#768196' : '#000', 
            border: 'none', padding: '16px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: (roundComplete ? isRoundReady : isGlobalReady) ? 'none' : `0 4px 15px ${(roundComplete ? '#FFF' : tourneyColor)}60`
          }}
        >
          {roundComplete 
            ? (isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TIRAGE SUIVANT")
            : (isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER')
          }
        </button>
      </div>
    </div>
  );
}