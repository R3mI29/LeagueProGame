import React from 'react';
import { socket } from '../../api/socket';

export default function SwissStageView({ state, event }) {
  const myId = socket.id;
  const { bracket, currentRound, readyPlayers, roundComplete } = state;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-') && !p.isBot).length;
  const isGlobalReady = readyPlayers?.includes(myId);
  const isRoundReady = state.roundReady?.includes(myId);

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
          main: '#FFFFFF', accent: '#0066FF', bg: '#02050D', 
          boxBg: 'linear-gradient(180deg, rgba(12, 18, 38, 0.85) 0%, rgba(6, 10, 22, 0.95) 100%)', 
          border: 'rgba(255, 255, 255, 0.15)', font: "'Oswald', sans-serif", textMain: '#FFFFFF', textMuted: '#8A9CCC',
          headerBg: 'linear-gradient(90deg, rgba(0, 51, 153, 0.15), rgba(0, 102, 255, 0.3), rgba(0, 51, 153, 0.15))', 
          headerText: '#FFFFFF', logoPlaceholder: 'rgba(255,255,255,0.05)',
          logoFilter: 'drop-shadow(0px 2px 8px rgba(0, 102, 255, 0.5))', 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
          bgStyle: { 
              backgroundImage: `radial-gradient(circle at 50% -10%, rgba(0, 102, 255, 0.35) 0%, transparent 60%), radial-gradient(circle at 10% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 40%), radial-gradient(circle at 90% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 40%), linear-gradient(to bottom, #010308, #040A17)` 
          }
      };
  } else if (isEWC) {
      theme = { ...theme,
          main: '#D4AF37', accent: '#E5C158', bg: '#050505', boxBg: '#0A0A0A', 
          border: '#3A2E12', font: "'Montserrat', 'Inter', sans-serif", textMain: '#FFFFFF', textMuted: '#666666',
          headerBg: '#111111', headerText: '#D4AF37', logoPlaceholder: 'rgba(255,255,255,0.02)',
          logoFilter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.9))', boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
          bgStyle: { background: '#050505' }
      };
  } else if (isFirstStand) {
      theme = { ...theme,
          main: '#FF5C00', bg: '#F4F5F8', boxBg: '#FFFFFF', border: '#E5E7EB',
          font: "'Rajdhani', sans-serif", textMain: '#25092C', textMuted: '#71717A', logoPlaceholder: '#F0F1F5',
          headerBg: '#25092C', headerText: '#FFFFFF',
          logoFilter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.12))', boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
          bgStyle: { backgroundImage: `repeating-linear-gradient(115deg, transparent, transparent 100px, rgba(0,0,0,0.02) 100px, rgba(0,0,0,0.02) 102px), repeating-linear-gradient(-65deg, transparent, transparent 150px, rgba(0,0,0,0.015) 150px, rgba(0,0,0,0.015) 152px)` }
      };
  }

  const allMatches = bracket ? bracket.flat() : [];

  const getTeamsByResult = (pool, isWinner) => {
    return allMatches
        .filter(m => m.pool === pool && m.status === 'finished')
        .map(m => {
            const winnerIsA = m.winner?.id === m.teamA?.id;
            if (isWinner) return winnerIsA ? m.teamA : m.teamB;
            return winnerIsA ? m.teamB : m.teamA;
        })
        .filter(Boolean);
  };

  const COLUMNS = [
    ['0-0'], ['1-0', '0-1'], ['2-0', '1-1', '0-2'], ['Q3-0', '2-1', '1-2', 'E0-3'], ['Q3-1', '2-2', 'E1-3'], ['Q3-2', 'E2-3']
  ];

  const hasContent = (item) => {
    if (item.startsWith('Q') || item.startsWith('E')) {
         const mapping = {
             'Q3-0': {p: '2-0', w: true}, 'E0-3': {p: '0-2', w: false},
             'Q3-1': {p: '2-1', w: true}, 'E1-3': {p: '1-2', w: false},
             'Q3-2': {p: '2-2', w: true}, 'E2-3': {p: '2-2', w: false}
         };
         const config = mapping[item];
         return getTeamsByResult(config.p, config.w).length > 0;
    }
    return allMatches.some(m => m.pool === item);
  };

  const handleMatchClick = (match) => {
    if (match && match.waveActive && match.status === 'pending' && (match.teamA?.id === myId || match.teamB?.id === myId)) socket.emit('match-ready', match.id);
  };

  const StatusBlock = ({ type }) => {
    let teams = [];
    let title = '';
    let headerStyle = {};
    
    if (type.startsWith('Q')) {
        if (type === 'Q3-0') { teams = getTeamsByResult('2-0', true); title = 'QUALIFIED (3-0)'; }
        if (type === 'Q3-1') { teams = getTeamsByResult('2-1', true); title = 'QUALIFIED (3-1)'; }
        if (type === 'Q3-2') { teams = getTeamsByResult('2-2', true); title = 'QUALIFIED (3-2)'; }
        headerStyle = {
            background: 'linear-gradient(90deg, rgba(0, 51, 153, 0.7), rgba(0, 102, 255, 0.9))',
            borderTop: '2px solid #FFFFFF',
            color: '#FFFFFF',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        };
    } else {
        if (type === 'E0-3') { teams = getTeamsByResult('0-2', false); title = 'ELIMINATED (0-3)'; }
        if (type === 'E1-3') { teams = getTeamsByResult('1-2', false); title = 'ELIMINATED (1-3)'; }
        if (type === 'E2-3') { teams = getTeamsByResult('2-2', false); title = 'ELIMINATED (2-3)'; }
        headerStyle = {
            background: 'linear-gradient(90deg, rgba(60, 15, 15, 0.8), rgba(120, 25, 25, 0.9))',
            borderTop: '2px solid #FF4D4D',
            color: '#FFFFFF',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        };
    }

    return (
        <div className="rounded-md overflow-hidden border" style={{ background: theme.boxBg, backdropFilter: isWorlds ? 'blur(12px)' : 'none', borderColor: theme.border, boxShadow: theme.boxShadow }}>
            <div className="p-2 text-center font-extrabold text-xs tracking-[1px] uppercase" style={headerStyle}>
                {title}
            </div>
            <div className="flex flex-col">
                {teams.map((team, idx) => (
                    <div key={team.id || idx} className="flex items-center gap-2 p-2.5 bg-white/5" style={{ borderBottom: idx < teams.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                        {team.logo ? <img src={team.logo} alt="" className="w-[22px] h-[22px] object-contain" style={{ filter: theme.logoFilter }} /> : <div className="w-[22px] h-[22px] rounded" style={{ background: theme.logoPlaceholder }} />}
                        <span className="text-sm font-bold" style={{ color: theme.textMain }}>{team.tag || team.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const SwissMatchBox = ({ match }) => {
    if (!match) return null;
    const isSim = match.status === 'simulating_events' || match.status === 'simulating_result';
    const isFin = match.status === 'finished';
    const involvesMe = match.teamA?.id === myId || match.teamB?.id === myId;
    const isMyTurn = match.waveActive && match.status === 'pending' && involvesMe;
    const winnerId = isFin ? match.winner?.id : null;
    const isActiveRound = bracket[currentRound]?.some(m => m.id === match.id);

    const getTeamStyle = (team) => {
        if (!team) return { color: theme.textMuted, weight: 500 };
        if (!isFin) return { color: theme.textMain, weight: 600 };
        if (winnerId === team.id) return { color: isWorlds ? '#FFFFFF' : theme.main, weight: 800 }; 
        return { color: theme.textMuted, weight: 500 };
    };

    const teamAStyle = getTeamStyle(match.teamA);
    const teamBStyle = getTeamStyle(match.teamB);
    const boxGlow = isMyTurn ? `0 0 20px rgba(0, 102, 255, 0.5)` : 'none';
    const borderStyle = isMyTurn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`;

    return (
      <div className={`relative mb-2.5 transition-all duration-300 ${isActiveRound || isFin ? 'opacity-100' : 'opacity-40'}`} key={match.id}>
        {isSim && <div className="animate-pulse-fast absolute -top-3.5 right-0 text-[10px] font-bold tracking-[1px]" style={{ color: theme.accent, textShadow: `0 0 5px rgba(0, 102, 255, 0.5)` }}>• LIVE</div>}
        
        <div 
            onClick={() => handleMatchClick(match)}
            className="flex flex-col rounded-md transition-all duration-200 font-sans"
            style={{
                background: theme.boxBg, 
                backdropFilter: isWorlds ? 'blur(12px)' : 'none',
                border: borderStyle,
                borderLeft: isWorlds && involvesMe ? `3px solid ${theme.accent}` : borderStyle,
                cursor: isMyTurn ? 'pointer' : 'default',
                boxShadow: isMyTurn ? boxGlow : theme.boxShadow,
            }}
        >
            <div 
              className="flex justify-between items-center p-[8px_10px] border-b rounded-t-md" 
              style={{ borderColor: theme.border, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? (isWorlds ? 'rgba(0, 102, 255, 0.15)' : `${theme.main}15`) : 'transparent' }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" className="w-[22px] h-[22px] shrink-0 object-contain" style={{ filter: theme.logoFilter }} /> : <div className="w-[22px] h-[22px] shrink-0 rounded" style={{ background: theme.logoPlaceholder }} />}
                    <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span className="text-[15px] shrink-0 ml-1.5" style={{ color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '-')}</span>
            </div>

            <div 
              className="flex justify-between items-center p-[8px_10px] rounded-b-md" 
              style={{ opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? (isWorlds ? 'rgba(0, 102, 255, 0.15)' : `${theme.main}15`) : 'transparent' }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" className="w-[22px] h-[22px] shrink-0 object-contain" style={{ filter: theme.logoFilter }} /> : <div className="w-[22px] h-[22px] shrink-0 rounded" style={{ background: theme.logoPlaceholder }} />}
                    <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: teamBStyle.color, fontWeight: teamBStyle.weight }}>{match.teamB ? match.teamB.tag : 'TBD'}</span>
                </div>
                <span className="text-[15px] shrink-0 ml-1.5" style={{ color: teamBStyle.color, fontWeight: teamBStyle.weight }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '-')}</span>
            </div>
        </div>
      </div>
    );
  };

  const SwissPoolBlock = ({ pool }) => {
    const poolMatches = allMatches.filter(m => m.pool === pool);
    return (
      <div className="rounded-md overflow-hidden border" style={{ background: theme.boxBg, backdropFilter: isWorlds ? 'blur(12px)' : 'none', borderColor: theme.border, boxShadow: theme.boxShadow }}>
        <div 
          className="p-2 text-center font-extrabold text-[13px] tracking-[1px] border-b"
          style={{ background: theme.headerBg, borderTop: isWorlds ? `2px solid ${theme.accent}` : 'none', color: theme.headerText, borderColor: theme.border }}
        >
          {pool}
        </div>
        <div className="p-3 flex flex-col gap-2">
          {poolMatches.map(m => <SwissMatchBox key={m.id} match={m} />)}
        </div>
      </div>
    );
  };

  if (!bracket || bracket.length === 0) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen z-[100] overflow-y-auto overflow-x-hidden p-[40px_2vw]" style={{ backgroundColor: theme.bg, ...theme.bgStyle }}>
      
      <div className="text-center mb-10 flex flex-col items-center">
        {event?.logo && <img src={event.logo} alt="" className="h-[75px] object-contain mb-[15px]" style={{ filter: theme.logoFilter }} />}
        
        <h2 className="text-[36px] m-0 uppercase tracking-[6px]" style={{ fontFamily: theme.font, color: theme.textMain, textShadow: isWorlds ? `0 0 20px rgba(0, 102, 255, 0.6)` : 'none' }}>SWISS STAGE</h2>
        {isWorlds && <div className="w-[60px] h-[3px] mt-[15px]" style={{ background: 'linear-gradient(90deg, transparent, #0066FF, transparent)' }}></div>}
      </div>

      <div className="flex w-full gap-[1.5vw] justify-center items-center pb-[120px]">
        {COLUMNS.map((col, colIdx) => {
          const columnHasContent = col.some(hasContent);
          if (!columnHasContent) return null;

          return (
            <div key={colIdx} className="flex flex-col gap-6 flex-1 max-w-[210px]">
              {col.map(item => {
                if (!hasContent(item)) return null;
                if (item.startsWith('Q') || item.startsWith('E')) return <StatusBlock key={item} type={item} />;
                return <SwissPoolBlock key={item} pool={item} />;
              })}
            </div>
          );
        })}
      </div>

      {/* BARRE DE CONTRÔLE FLOTTANTE */}
      <div 
        className="fixed bottom-[30px] left-1/2 -translate-x-1/2 p-[12px_32px] flex gap-10 items-center z-[1000] border rounded-full"
        style={{ 
          background: isWorlds ? 'rgba(5, 10, 22, 0.95)' : theme.boxBg, 
          backdropFilter: 'blur(16px)',
          borderColor: isWorlds ? 'rgba(255, 255, 255, 0.2)' : theme.border, 
          boxShadow: isWorlds ? '0 10px 40px rgba(0,0,0,0.9), 0 0 20px rgba(0, 102, 255, 0.2)' : theme.boxShadow,
      }}>
        <h3 className="m-0 text-[16px] font-bold whitespace-nowrap uppercase" style={{ fontFamily: theme.font, color: theme.textMain }}>
          {roundComplete ? "GÉNÉRATION DU TIRAGE" : `CONTRÔLE - ROUND ${currentRound + 1} / 5`}
        </h3>
        
        <button 
          onClick={roundComplete ? () => socket.emit('advance-round') : () => socket.emit('toggle-ready')} 
          disabled={roundComplete ? isRoundReady : isGlobalReady}
          className="border-none p-[12px_28px] rounded-[30px] text-[14px] font-extrabold uppercase tracking-[1px] transition-all duration-200"
          style={{ 
              backgroundColor: (roundComplete ? isRoundReady : isGlobalReady) ? theme.border : (roundComplete ? (isFirstStand || isWorlds ? (isWorlds ? '#FFFFFF' : theme.headerBg) : '#FFF') : theme.main), 
              color: (roundComplete ? isRoundReady : isGlobalReady) ? theme.textMuted : (isFirstStand || isEWC || isWorlds ? '#000' : '#000'), 
              cursor: 'pointer',
              boxShadow: (roundComplete ? isRoundReady : isGlobalReady) || !isWorlds ? 'none' : `0 0 15px rgba(255, 255, 255, 0.4)`
          }}
        >
          {roundComplete ? (isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TIRAGE SUIVANT") : (isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER LE ROUND')}
        </button>
      </div>
    </div>
  );
}