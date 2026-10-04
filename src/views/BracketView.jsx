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
      theme = { ...theme,
          main: '#D4AF37', accent: '#E5C158', bg: '#0A0705', boxBg: '#0A0A0A', border: '#3A2E12', 
          font: "'Montserrat', 'Inter', sans-serif", textMain: '#FFFFFF', textMuted: '#777777',
          headerBg: 'transparent', headerText: '#D4AF37', logoPlaceholder: 'rgba(255,255,255,0.02)',
          logoFilter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.9))', boxShadow: '0 8px 24px rgba(0,0,0,0.9)',
          bgStyle: { 
              backgroundImage: `radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(255, 89, 0, 0.08) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
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
      <div className={`relative w-full mx-auto z-10 ${isFinal ? 'max-w-[420px]' : 'max-w-[340px]'}`} key={match.id}>
        <div 
          className={`absolute left-0 w-full font-extrabold uppercase tracking-[2px] ${isFinal ? '-top-7' : '-top-5'} ${isFinal && (isWorlds || isEWC) ? 'text-center' : 'text-left'}`}
          style={{ color: theme.main, fontSize: isFinal ? '14px' : '11px', fontFamily: theme.font }}
        >
            {title} {isSim && <span className="animate-pulse-fast ml-1.5" style={{ color: theme.textMain }}>• LIVE</span>}
        </div>
        
        <div 
            onClick={() => handleMatchClick(match)}
            className="flex flex-col font-sans transition-all duration-200"
            style={{
                background: isFinal ? finalBoxBg : theme.boxBg, 
                backdropFilter: isWorlds ? 'blur(12px)' : 'none',
                border: isMyTurn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                borderRadius: isWorlds || isEWC ? '0px' : '6px', 
                cursor: isMyTurn ? 'pointer' : 'default',
                boxShadow: boxGlow
            }}
        >
            <div 
              className={`flex justify-between items-center ${isFinal ? 'p-[16px_20px]' : 'p-[12px_16px]'} border-b`}
              style={{ borderColor: theme.border, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? winnerBg : 'transparent' }}
            >
                <div className="flex items-center gap-3.5 min-w-0">
                    {match.teamA?.logo ? (
                      <img src={match.teamA.logo} alt="" className="shrink-0 object-contain" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', filter: theme.logoFilter }} />
                    ) : (
                      <div className="shrink-0 rounded" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', background: theme.logoPlaceholder }} />
                    )}
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: isFinal ? '18px' : '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight }}>
                      {match.teamA ? match.teamA.name : 'TBD'}
                    </span>
                </div>
                <span className="shrink-0 ml-2.5" style={{ fontSize: isFinal ? '22px' : '16px', color: teamAStyle.color, fontWeight: teamAStyle.weight }}>
                  {isFin ? match.scoreA : (isSim ? match.scoreA : '-')}
                </span>
            </div>
            
            <div 
              className={`flex justify-between items-center ${isFinal ? 'p-[16px_20px]' : 'p-[12px_16px]'}`}
              style={{ opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? winnerBg : 'transparent' }}
            >
                <div className="flex items-center gap-3.5 min-w-0">
                    {match.teamB?.logo ? (
                      <img src={match.teamB.logo} alt="" className="shrink-0 object-contain" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', filter: theme.logoFilter }} />
                    ) : (
                      <div className="shrink-0 rounded" style={{ width: isFinal ? '36px' : '28px', height: isFinal ? '36px' : '28px', background: theme.logoPlaceholder }} />
                    )}
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: isFinal ? '18px' : '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight }}>
                      {match.teamB ? match.teamB.name : 'TBD'}
                    </span>
                </div>
                <span className="shrink-0 ml-2.5" style={{ fontSize: isFinal ? '22px' : '16px', color: teamBStyle.color, fontWeight: teamBStyle.weight }}>
                  {isFin ? match.scoreB : (isSim ? match.scoreB : '-')}
                </span>
            </div>
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    if (isWorlds) {
      return (
        <div className="flex flex-col items-center mb-20 pt-5">
           {event?.logo ? (
               <img src={event.logo} alt="Worlds" className="h-20 object-contain mb-5" style={{ filter: theme.logoFilter }} />
           ) : (
               <div className="bg-white px-4 py-2 mb-5 rounded-sm">
                   <span className="text-black text-2xl font-bold" style={{ fontFamily: theme.font }}>W</span>
               </div>
           )}
           <h2 className="text-5xl m-0 uppercase tracking-[4px]" style={{ fontFamily: theme.font, color: theme.textMain }}>THE FINAL BRACKET</h2>
           <div className="flex items-center gap-4 mt-1.5">
               <div className="h-px w-10 bg-white/20" />
               <div className="font-bold tracking-[4px] text-xs uppercase" style={{ color: theme.accent }}>MAKE THEM BELIEVE</div>
               <div className="h-px w-10 bg-white/20" />
           </div>
        </div>
      );
    }
    if (isEWC) {
      return (
        <div className="text-center mb-20 pt-5">
           {event?.logo && <img src={event.logo} alt="EWC" className="h-[70px] object-contain mb-2.5" style={{ filter: theme.logoFilter }} />}
           <h3 className="text-[32px] m-0 mb-2.5 uppercase tracking-[4px] font-extrabold" style={{ fontFamily: theme.font, color: theme.main }}>
              CHAMPIONSHIP BRACKET
           </h3>
           <h2 className="text-[64px] text-white m-0 uppercase tracking-[2px] font-black" style={{ fontFamily: theme.font }}>
              PLAYOFFS PHASE
           </h2>
        </div>
      );
    }
    if (isFirstStand) {
      return (
        <div className="relative text-center mb-20 pt-5">
          <div className="absolute top-5 left-5 font-extrabold text-xs tracking-[2px]" style={{ color: theme.main }}>LOL ESPORTS</div>
          <div className="absolute top-5 right-5 font-extrabold text-xs tracking-[2px]" style={{ color: theme.main }}>[20——25]</div>
          <h2 className="flex justify-center items-center gap-5 font-['Arial_Black'] text-[72px] font-black m-0 italic tracking-[-2px] scale-x-110" style={{ color: theme.textMain }}>
            <span>FIRST</span>
            {event?.logo ? ( 
              <img src={event.logo} alt="FS" className="h-[70px] object-contain" style={{ filter: theme.logoFilter }} /> 
            ) : ( 
              <span style={{ color: theme.main }}>♦</span> 
            )}
            <span>STAND</span>
          </h2>
          <div className="font-['Arial_Black'] text-[20px] font-black italic tracking-[4px] -mt-1" style={{ color: theme.textMain }}>TOURNAMENT</div>
        </div>
      );
    }
    return null;
  };

  const renderFooter = () => {
    if (isWorlds || isEWC) {
        return (
          <div 
            className={`fixed bottom-[30px] left-1/2 -translate-x-1/2 backdrop-blur-md p-[12px_32px] flex gap-10 items-center z-[1000] border ${isEWC ? 'rounded-none' : 'rounded-full'}`}
            style={{ 
              background: isWorlds ? 'rgba(5, 10, 25, 0.95)' : 'rgba(10, 10, 10, 0.95)', 
              borderColor: isWorlds ? 'rgba(255, 255, 255, 0.15)' : 'rgba(212, 175, 55, 0.4)',
              boxShadow: isWorlds ? '0 10px 40px rgba(0,0,0,0.9)' : '0 10px 40px rgba(0,0,0,0.9), 0 0 15px rgba(212, 175, 55, 0.1)',
            }}
          >
            <h3 className="m-0 text-base font-bold uppercase whitespace-nowrap" style={{ fontFamily: theme.font, color: theme.textMain }}>
              {isTournamentOver ? "COMPÉTITION TERMINÉE" : `CONTRÔLE - ROUND ${currentRound + 1} / 3`}
            </h3>
            {isTournamentOver ? (
              <button 
                onClick={() => socket.emit('continue-season')} 
                disabled={isContinueReady}
                className={`border-none p-[12px_28px] text-sm font-extrabold uppercase tracking-[1px] ${isEWC ? 'rounded-none' : 'rounded-full'}`}
                style={{ 
                  backgroundColor: isContinueReady ? theme.border : (isEWC ? theme.main : '#FFFFFF'), 
                  color: isContinueReady ? theme.textMuted : '#000', 
                  cursor: isContinueReady ? 'wait' : 'pointer',
                  boxShadow: !isContinueReady && isWorlds ? `0 0 15px rgba(255,255,255,0.2)` : 'none' 
                }}
              >
                {isContinueReady ? `EN ATTENTE (${state.continueSeasonVotes?.length || 0}/${humanCount})` : 'TERMINER LA SAISON'}
              </button>
            ) : roundComplete ? (
              <button 
                onClick={advanceRound} 
                disabled={isRoundReady} 
                className={`border-none p-[12px_28px] text-sm font-extrabold uppercase tracking-[1px] ${isEWC ? 'rounded-none' : 'rounded-full'}`}
                style={{ 
                  backgroundColor: isRoundReady ? theme.border : (isEWC ? theme.main : '#FFFFFF'), 
                  color: isRoundReady ? theme.textMuted : '#000', 
                  cursor: isRoundReady ? 'wait' : 'pointer',
                  boxShadow: !isRoundReady && isWorlds ? `0 0 15px rgba(255,255,255,0.2)` : 'none' 
                }}
              >
                {isRoundReady ? `EN ATTENTE (${state.roundReady?.length || 0}/${humanCount})` : "TOUR SUIVANT"}
              </button>
            ) : (
              <button 
                onClick={toggleReady} 
                disabled={isGlobalReady} 
                className={`border-none p-[12px_28px] text-sm font-extrabold uppercase tracking-[1px] ${isEWC ? 'rounded-none' : 'rounded-full'}`}
                style={{ 
                  backgroundColor: isGlobalReady ? theme.border : (isEWC ? theme.main : '#FFFFFF'), 
                  color: isGlobalReady ? theme.textMuted : '#000', 
                  cursor: isGlobalReady ? 'wait' : 'pointer',
                  boxShadow: !isGlobalReady && isWorlds ? `0 0 15px rgba(255,255,255,0.2)` : 'none' 
                }}
              >
                {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER LE MATCH'}
              </button>
            )}
          </div>
        );
    }

    return (
      <div 
        className="w-full max-w-[1200px] mt-5 mx-auto rounded-lg border p-[24px_32px] flex justify-between items-center"
        style={{ background: theme.boxBg, borderColor: theme.border, boxShadow: theme.boxShadow }}
      >
        <h3 className="m-0 text-[20px] font-extrabold" style={{ fontFamily: theme.font, color: theme.textMain }}>
          {isTournamentOver ? "COMPÉTITION TERMINÉE" : `CONTRÔLE - ROUND ${currentRound + 1} / 3`}
        </h3>
        {isTournamentOver ? (
          <button 
            onClick={() => socket.emit('continue-season')} 
            disabled={isContinueReady}
            className="border-none p-[14px_28px] rounded text-[15px] font-bold"
            style={{ backgroundColor: isContinueReady ? theme.border : theme.main, color: isContinueReady ? theme.textMuted : '#FFF', cursor: isContinueReady ? 'wait' : 'pointer' }}
          >
            {isContinueReady ? `EN ATTENTE (${state.continueSeasonVotes?.length || 0}/${humanCount})` : 'TERMINER LA SAISON'}
          </button>
        ) : roundComplete ? (
          <button 
            onClick={advanceRound} 
            disabled={isRoundReady} 
            className="border-none p-[14px_28px] rounded text-[15px] font-bold"
            style={{ backgroundColor: isRoundReady ? theme.border : theme.headerBg, color: isRoundReady ? theme.textMuted : '#FFF', cursor: isRoundReady ? 'wait' : 'pointer' }}
          >
            {isRoundReady ? `EN ATTENTE (${state.roundReady?.length || 0}/${humanCount})` : "TOUR SUIVANT"}
          </button>
        ) : (
          <button 
            onClick={toggleReady} 
            disabled={isGlobalReady} 
            className="border-none p-[14px_28px] rounded text-[15px] font-bold"
            style={{ backgroundColor: isGlobalReady ? theme.border : theme.main, color: isGlobalReady ? theme.textMuted : '#FFF', cursor: isGlobalReady ? 'wait' : 'pointer' }}
          >
            {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen z-[100] overflow-y-auto overflow-x-hidden"
      style={{ backgroundColor: theme.bg, ...theme.bgStyle }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div 
        className="w-full relative z-[1] p-[20px_4vw] flex flex-col min-h-screen"
        style={{ paddingBottom: isWorlds || isEWC ? '140px' : '40px' }}
      >
        
        {renderHeader()}

        <div className="flex w-full max-w-[1400px] mx-auto flex-1" style={{ justifyContent: isWorlds || isEWC ? 'space-between' : 'space-around', gap: isWorlds || isEWC ? '3vw' : '40px' }}>
          
          {bracket[0] && (
            <div className="flex-1 flex flex-col justify-around z-[2]" style={{ gap: isWorlds || isEWC ? '50px' : '40px' }}>
              {bracket[0].map(m => getMatchBox(m, "QUARTERFINALS"))}
            </div>
          )}
          
          {bracket[1] && (
            <div className="flex-1 flex flex-col justify-around z-[2]" style={{ gap: isWorlds || isEWC ? '100px' : '40px' }}>
              {bracket[1].map(m => getMatchBox(m, "SEMIFINALS"))}
            </div>
          )}
          
          {bracket[2] && (
            <div className="flex flex-col gap-10 justify-center z-[3]" style={{ flex: isWorlds || isEWC ? 1.1 : 1 }}>
              {isWorlds || isEWC ? (
                  bracket[2].map(m => getMatchBox(m, "GRAND FINAL", true))
              ) : (
                  <div className="scale-110 z-[2]">
                    {bracket[2].map(m => getMatchBox(m, "GRAND FINAL"))}
                  </div>
              )}
            </div>
          )}
        </div>

      </div>

      {renderFooter()}

      {secretUnlock && (
        <div className="fixed inset-0 w-screen h-screen bg-[#050508] z-[9999] flex flex-col justify-center items-center animate-[fadeIn_2s_forwards]">
          <div className="relative z-[2] shadow-[0_0_50px_rgba(255,61,129,0.3)] border border-[#332918]">
            <img src={secretUnlock.image} alt="" className="max-h-[60vh] block rounded" />
          </div>
        </div>
      )}
    </div>
  );
}