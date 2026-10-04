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
      <div className={`relative w-full z-10 ${isFinal ? 'min-w-[240px]' : 'min-w-[150px]'}`} key={match.id}>
        <div 
          className={`absolute left-0 font-['Arial_Black'] italic font-black tracking-[0.5px] ${isFinal ? '-top-4 text-xs' : '-top-3.5 text-[11px]'}`}
          style={{ color: isMyTurn ? msiYellow : '#768196' }}
        >
            {title} {isSim && <span className="animate-pulse-fast ml-1" style={{ color: msiRed }}>• LIVE</span>}
        </div>
        
        <div 
            onClick={() => handleMatchClick(match)}
            className={`flex flex-col font-sans transition-all duration-100 ${isMyTurn ? 'cursor-pointer' : 'cursor-default'}`}
            style={{
                background: boxBg, 
                border: isMyTurn ? `3px solid ${msiYellow}` : `1px solid ${borderMuted}`,
                boxShadow: isMyTurn ? `4px 4px 0px ${msiRed}` : '2px 2px 0px rgba(0,0,0,0.5)',
            }}
        >
            <div 
              className={`flex justify-between items-center border-b ${isFinal ? 'p-[12px_14px]' : 'p-[6px_10px]'}`} 
              style={{ borderColor: borderMuted, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? 'rgba(230, 25, 43, 0.15)' : 'transparent' }}
            >
                <div className="flex items-center gap-2">
                    {match.teamA?.logo ? (
                      <img src={match.teamA.logo} alt="" className="object-contain drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px' }} />
                    ) : (
                      <div className="bg-[#2B3040]" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px' }} />
                    )}
                    <span style={{ fontSize: isFinal ? '18px' : '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: isFinal ? '20px' : '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '')}</span>
            </div>

            <div 
              className={`flex justify-between items-center ${isFinal ? 'p-[12px_14px]' : 'p-[6px_10px]'}`} 
              style={{ opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? 'rgba(230, 25, 43, 0.15)' : 'transparent' }}
            >
                <div className="flex items-center gap-2">
                    {match.teamB?.logo ? (
                      <img src={match.teamB.logo} alt="" className="object-contain drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px' }} />
                    ) : (
                      <div className="bg-[#2B3040]" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px' }} />
                    )}
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
    <div className="fixed inset-0 w-screen h-screen z-[100] overflow-auto p-[40px_5vw]" style={{ backgroundColor: bgDark }}>
      
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen opacity-10 pointer-events-none blur-[50px] z-0" 
        style={{ background: `radial-gradient(circle, ${msiRed} 0%, transparent 40%)` }} 
      />

      <div className="flex flex-col gap-20 relative z-[1] max-w-[1800px] mx-auto pb-[120px]">
        
        {/* WINNER BRACKET + GRANDE FINALE */}
        <div className="relative pl-6" style={{ borderLeft: `4px solid ${msiRed}` }}>
          <h2 className="font-['Arial_Black'] italic text-white m-0 mb-10 text-xl tracking-[2px]">WINNER BRACKET</h2>
          
          <div className="flex gap-[6vw] items-stretch">
            <div className="shrink-0 flex flex-col justify-around gap-[30px]">{getMatchesByPrefix('ub1').map(m => getMatchBox(m, "ROUND 1"))}</div>
            <div className="shrink-0 flex flex-col justify-around gap-[40px]">{getMatchesByPrefix('ub2').map(m => getMatchBox(m, "QUARTER"))}</div>
            <div className="shrink-0 flex flex-col justify-around gap-[60px]">{getMatchesByPrefix('ub3').map(m => getMatchBox(m, "SEMI"))}</div>
            <div className="shrink-0 flex flex-col justify-around">{getMatchesByPrefix('ub4').map(m => getMatchBox(m, "FINAL"))}</div>
            
            <div className="shrink-0 flex flex-col justify-center pl-[5vw]">
              <div 
                className="p-[40px_24px] flex flex-col items-center relative w-full min-w-[280px]" 
                style={{ background: boxBg, border: `2px solid ${msiRed}`, boxShadow: `inset 0 0 30px ${msiRed}20` }}
              >
                <div 
                  className="absolute -top-[14px] text-black px-4 py-1.5 font-['Arial_Black'] italic text-[13px] uppercase" 
                  style={{ background: msiYellow, boxShadow: '3px 3px 0px #000' }}
                >
                  PHASE ULTIME
                </div>
                <h2 
                  className="font-['Arial_Black'] text-white mt-2.5 mb-10 text-[26px] italic text-center whitespace-nowrap" 
                  style={{ textShadow: `2px 2px 0px ${msiRed}` }}
                >
                  GRANDE FINALE
                </h2>
                <div className="w-full">
                  {getMatchesByPrefix('gf').map(m => getMatchBox(m, "CHAMPIONSHIP", true))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* LOSER BRACKET */}
        <div className="relative pl-6" style={{ borderLeft: `4px solid #555` }}>
          <h2 className="font-['Arial_Black'] italic text-[#888] m-0 mb-10 text-xl tracking-[2px]">LOSER BRACKET</h2>
          
          <div className="flex gap-[4vw] items-stretch">
            <div className="shrink-0 flex flex-col justify-around gap-[30px]">{getMatchesByPrefix('lb1').map(m => getMatchBox(m, "L-ROUND 1"))}</div>
            <div className="shrink-0 flex flex-col justify-around gap-[30px]">{getMatchesByPrefix('lb2').map(m => getMatchBox(m, "L-ROUND 2"))}</div>
            <div className="shrink-0 flex flex-col justify-around gap-[40px]">{getMatchesByPrefix('lb3').map(m => getMatchBox(m, "L-ROUND 3"))}</div>
            <div className="shrink-0 flex flex-col justify-around gap-[40px]">{getMatchesByPrefix('lb4').map(m => getMatchBox(m, "L-ROUND 4"))}</div>
            <div className="shrink-0 flex flex-col justify-around gap-[60px]">{getMatchesByPrefix('lb5').map(m => getMatchBox(m, "L-SEMI"))}</div>
            <div className="shrink-0 flex flex-col justify-around">{getMatchesByPrefix('lb6').map(m => getMatchBox(m, "L-FINAL"))}</div>
          </div>
        </div>

      </div>

      {/* ENCART DE CONTRÔLE DÉPLACÉ EN BAS À DROITE */}
      <div 
        className="fixed bottom-10 right-10 w-[320px] p-5 flex flex-col items-center gap-4 z-[1000]"
        style={{ background: boxBg, border: `3px solid ${msiRed}`, boxShadow: `6px 6px 0px ${msiYellow}` }}
      >
        <h3 className="font-['Arial_Black'] text-white m-0 text-base italic uppercase text-center">
          {state.champion ? "COMPÉTITION TERMINÉE" : `ROUND ${currentRound + 1} / 8`}
        </h3>
        
        {state.champion ? (
          <button 
            onClick={() => socket.emit('continue-season')} 
            className="w-full text-black border-none p-3 font-['Arial_Black'] text-sm italic cursor-pointer"
            style={{ backgroundColor: msiYellow }}
          >
            TERMINER SAISON
          </button>
        ) : roundComplete ? (
          <button 
            onClick={advanceRound} 
            disabled={isRoundReady} 
            className="w-full border-none p-3 font-['Arial_Black'] text-sm italic"
            style={{ backgroundColor: isRoundReady ? borderMuted : '#FFF', color: isRoundReady ? '#888' : '#000', cursor: isRoundReady ? 'wait' : 'pointer', boxShadow: isRoundReady ? 'none' : `3px 3px 0px ${msiRed}` }}
          >
            {isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button 
            onClick={toggleReady} 
            disabled={isGlobalReady} 
            className="w-full border-none p-3 font-['Arial_Black'] text-sm italic"
            style={{ backgroundColor: isGlobalReady ? borderMuted : msiYellow, color: isGlobalReady ? '#888' : '#000', cursor: isGlobalReady ? 'wait' : 'pointer', boxShadow: isGlobalReady ? 'none' : `3px 3px 0px ${msiRed}` }}
          >
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER MATCH'}
          </button>
        )}
      </div>

    </div>
  );
}