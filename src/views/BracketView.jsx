import React from 'react';
import { socket } from '../api/socket';

export default function BracketView({ state, event }) {
  const { bracket, currentRound, roundComplete, readyPlayers } = state;
  const isWorlds = event?.isMajor;
  const tourneyColor = isWorlds ? '#D1B478' : (event?.color || '#00e5ff');
  const bgColor = isWorlds ? '#0A0A0C' : '#080A10';
  
  const myId = socket.id;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
  const isGlobalReady = readyPlayers?.includes(myId);
  const isRoundReady = state.roundReady?.includes(myId);
  const isContinueReady = state.continueSeasonVotes?.includes(myId);

  const finalMatch = bracket?.[bracket.length - 1]?.[0];
  const isTournamentOver = finalMatch?.status === 'finished';
  const actualChampion = isTournamentOver ? finalMatch.winner : null;

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
    const boxBg = isWorlds ? '#111114' : '#11141E';
    const borderCol = isMyTurn ? tourneyColor : (isWorlds ? '#2A251E' : '#222838');

    return (
      <div key={match.id} onClick={() => handleMatchClick(match)}
        style={{ 
          background: boxBg, border: `1px solid ${borderCol}`, borderRadius: '6px', 
          padding: '14px', marginBottom: '24px', minWidth: '240px', cursor: isMyTurn ? 'pointer' : 'default',
          boxShadow: isMyTurn ? `0 0 12px ${tourneyColor}20` : '0 4px 10px rgba(0,0,0,0.4)', transition: 'all 0.2s ease', position: 'relative'
        }}
      >
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: isWorlds ? '#8C7C61' : '#768196', marginBottom: '14px', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
          {title} {isSim && <span className="pulse-text" style={{ color: tourneyColor, marginLeft: '6px' }}>[EN COURS]</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '4px', background: isFin && match.winner?.id === match.teamA?.id ? (isWorlds ? 'linear-gradient(90deg, rgba(209, 180, 120, 0.08) 0%, transparent 100%)' : 'rgba(255,255,255,0.05)') : 'transparent' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: match.teamA?.id === myId ? 700 : 500, color: match.teamA?.id === myId ? tourneyColor : '#EAEAEA' }}>{match.teamA ? match.teamA.name : 'TBD'}</span>
          {isFin && <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: match.winner?.id === match.teamA?.id ? tourneyColor : '#768196' }}>{match.scoreA}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '4px', background: isFin && match.winner?.id === match.teamB?.id ? (isWorlds ? 'linear-gradient(90deg, rgba(209, 180, 120, 0.08) 0%, transparent 100%)' : 'rgba(255,255,255,0.05)') : 'transparent', marginTop: '4px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: match.teamB?.id === myId ? 700 : 500, color: match.teamB?.id === myId ? tourneyColor : '#EAEAEA' }}>{match.teamB ? match.teamB.name : 'TBD'}</span>
          {isFin && <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: match.winner?.id === match.teamB?.id ? tourneyColor : '#768196' }}>{match.scoreB}</span>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', paddingBottom: '40px', position: 'relative' }}>
      <style>
        {`
          .luxury-scroll { overflow-x: auto; padding-bottom: 20px; }
          .luxury-scroll::-webkit-scrollbar { height: 4px; }
          .luxury-scroll::-webkit-scrollbar-track { background: ${bgColor}; }
          .luxury-scroll::-webkit-scrollbar-thumb { background: ${isWorlds ? '#2A251E' : '#222838'}; border-radius: 10px; }
          .luxury-scroll::-webkit-scrollbar-thumb:hover { background: ${tourneyColor}; }
        `}
      </style>

      <div className="luxury-scroll" style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ minWidth: '900px', margin: '0 auto', padding: '20px 40px' }}>
          
          {isWorlds && (
            <div style={{ textAlign: 'center', marginBottom: '70px' }}>
              <p style={{ color: '#8C7C61', fontSize: '12px', letterSpacing: '4px', textTransform: 'uppercase', margin: '0 0 10px 0', fontWeight: 600 }}>Phase Finale Officielle</p>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", color: '#F0F0F2', fontSize: '42px', margin: '0', letterSpacing: '2px' }}>KNOCKOUT STAGE</h2>
              <div style={{ width: '60px', height: '2px', background: tourneyColor, margin: '20px auto 0' }}></div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '80px', justifyContent: 'center' }}>
            {bracket[0] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                {bracket[0].map(m => getMatchBox(m, "QUART DE FINALE"))}
              </div>
            )}
            {bracket[1] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '110px', justifyContent: 'center' }}>
                {bracket[1].map(m => getMatchBox(m, "DEMI-FINALE"))}
              </div>
            )}
            
            {/* LOGO PRÉCISÉMENT À GAUCHE DE LA FINALE */}
            {bracket[2] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '50px', position: 'relative' }}>
                {isWorlds && event?.logo && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 1s ease-out' }}>
                    <img src={event.logo} alt="Worlds Logo" style={{ width: '180px', opacity: 0.9, filter: 'drop-shadow(0 0 25px rgba(209, 180, 120, 0.4))' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ transform: 'scale(1.15)', zIndex: 2 }}>
                    {bracket[2].map(m => getMatchBox(m, isWorlds ? "GRANDE FINALE MONDIALE" : "GRANDE FINALE"))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', background: isWorlds ? '#0D0D10' : '#11141E', borderRadius: '8px', border: `1px solid ${isWorlds ? '#2A251E' : '#222838'}`, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '40px auto 0', position: 'relative', zIndex: 1, boxShadow: '0 15px 30px rgba(0,0,0,0.5)' }}>
        <div>
          <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#EAEAEA', margin: '0 0 6px 0', fontSize: '22px', letterSpacing: '1px' }}>
            {isTournamentOver ? "COMPÉTITION TERMINÉE" : `CONTRÔLE - ROUND ${currentRound + 1} / 3`}
          </h3>
          <span style={{ color: isWorlds ? '#8C7C61' : '#768196', fontSize: '14px' }}>
            {isTournamentOver ? `Victoire de ${actualChampion?.name}.` : roundComplete ? "Phase terminée. Préparez le round suivant." : "Validez pour déclencher les matchs."}
          </span>
        </div>
        
        {isTournamentOver ? (
          <button onClick={() => socket.emit('continue-season')} disabled={isContinueReady}
            style={{ backgroundColor: isContinueReady ? '#1A1814' : (actualChampion?.id === myId ? tourneyColor : '#2A251E'), color: isContinueReady ? '#555' : (actualChampion?.id === myId ? '#000' : '#EAEAEA'), border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 600, cursor: isContinueReady ? 'wait' : 'pointer', letterSpacing: '1px', transition: 'all 0.2s' }}>
            {isContinueReady ? `EN ATTENTE (${state.continueSeasonVotes?.length || 0}/${humanCount})` : (actualChampion?.id === myId ? 'SOULEVER LE TROPHÉE 🏆' : 'TERMINER LA SAISON')}
          </button>
        ) : roundComplete ? (
          <button onClick={advanceRound} disabled={isRoundReady} 
            style={{ backgroundColor: isRoundReady ? '#1A1814' : '#EAEAEA', color: isRoundReady ? '#555' : '#000', border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 600, cursor: isRoundReady ? 'wait' : 'pointer', letterSpacing: '1px', transition: 'all 0.2s' }}>
            {isRoundReady ? `EN ATTENTE (${state.roundReady?.length || 0}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button onClick={toggleReady} disabled={isGlobalReady} 
            style={{ backgroundColor: isGlobalReady ? '#1A1814' : tourneyColor, color: isGlobalReady ? '#555' : '#000', border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 600, cursor: isGlobalReady ? 'wait' : 'pointer', letterSpacing: '1px', transition: 'all 0.2s' }}>
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
          </button>
        )}
      </div>
    </div>
  );
}