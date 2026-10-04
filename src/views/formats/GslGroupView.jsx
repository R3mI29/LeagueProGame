import React from 'react';
import { socket } from '../../api/socket';

export default function GslGroupView({ state, event }) {
  const { groups, readyPlayers } = state;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-') && !p.isBot).length;
  const isGlobalReady = readyPlayers?.includes(socket.id);
  const myId = socket.id;

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
          main: '#FFFFFF', accent: '#004DE6', bg: '#01040A', boxBg: 'rgba(10, 14, 25, 0.9)', 
          border: 'rgba(255, 255, 255, 0.1)', font: "'Oswald', sans-serif", textMain: '#FFFFFF', textMuted: '#8A9CCC',
          headerBg: 'transparent', headerText: '#FFFFFF', logoPlaceholder: 'rgba(255,255,255,0.05)',
          logoFilter: 'drop-shadow(0px 1px 3px rgba(255, 255, 255, 0.2))', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          bgStyle: { backgroundImage: `radial-gradient(circle at 50% 0%, rgba(0, 102, 255, 0.15) 0%, transparent 70%)` }
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

  const toggleReady = () => socket.emit('toggle-ready');
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
        if (winnerId === team.id) return { color: isWorlds || isEWC ? (isEWC ? '#D4AF37' : '#FFFFFF') : theme.main, weight: 800 };
        return { color: theme.textMuted, weight: 500 };
    };

    const teamAStyle = getTeamStyle(match.teamA);
    const teamBStyle = getTeamStyle(match.teamB);
    
    const boxGlow = isMyTurn && isWorlds ? `0 0 15px rgba(255, 255, 255, 0.15)` : 'none';
    const borderStyle = isMyTurn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`;
    
    let winnerBg = 'transparent';
    if (isFin) {
        if (isWorlds) winnerBg = 'rgba(255, 255, 255, 0.05)';
        else if (isEWC) winnerBg = '#141414'; 
        else winnerBg = `${theme.main}15`;
    }

    return (
      <div className="relative mb-3 w-full" key={match.id}>
        <div 
          className="absolute -top-4 left-0 text-[11px] font-extrabold tracking-[0.5px] uppercase"
          style={{ color: theme.main, fontFamily: theme.font }}
        >
            {title} {isSim && <span className="animate-pulse-fast ml-1" style={{ color: theme.main }}>• LIVE</span>}
        </div>
        
        <div 
            onClick={() => handleMatchClick(match)}
            className="flex flex-col min-w-[160px] font-sans transition-all duration-200"
            style={{
                background: theme.boxBg, 
                backdropFilter: isWorlds ? 'blur(12px)' : 'none',
                border: borderStyle,
                borderLeft: (isWorlds || isEWC) && involvesMe ? `3px solid ${theme.accent}` : borderStyle,
                borderRadius: isWorlds || isEWC ? '0px' : '6px', 
                cursor: isMyTurn ? 'pointer' : 'default',
                boxShadow: isWorlds || isEWC ? theme.boxShadow : (isMyTurn ? `0 0 12px ${theme.main}50` : theme.boxShadow),
            }}
        >
            <div 
              className="flex justify-between items-center p-[6px_10px] border-b" 
              style={{ borderColor: theme.border, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? winnerBg : 'transparent' }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    {match.teamA?.logo ? (
                      <img src={match.teamA.logo} alt="" className="w-6 h-6 shrink-0 object-contain" style={{ filter: theme.logoFilter }} />
                    ) : (
                      <div className="w-6 h-6 shrink-0 rounded" style={{ background: theme.logoPlaceholder }} />
                    )}
                    <span className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span className="text-[15px] shrink-0 ml-1.5" style={{ color: teamAStyle.color, fontWeight: teamAStyle.weight }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '-')}</span>
            </div>

            <div 
              className="flex justify-between items-center p-[6px_10px]" 
              style={{ opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? winnerBg : 'transparent' }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    {match.teamB?.logo ? (
                      <img src={match.teamB.logo} alt="" className="w-6 h-6 shrink-0 object-contain" style={{ filter: theme.logoFilter }} />
                    ) : (
                      <div className="w-6 h-6 shrink-0 rounded" style={{ background: theme.logoPlaceholder }} />
                    )}
                    <span className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: teamBStyle.color, fontWeight: teamBStyle.weight }}>{match.teamB ? match.teamB.tag : 'TBD'}</span>
                </div>
                <span className="text-[15px] shrink-0 ml-1.5" style={{ color: teamBStyle.color, fontWeight: teamBStyle.weight }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '-')}</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[100] overflow-y-auto overflow-x-hidden p-[40px_2vw]" style={{ backgroundColor: theme.bg, ...theme.bgStyle }}>
      
      <div 
        className="w-full max-w-[1600px] mx-auto mb-10 p-[24px_40px] flex justify-between items-center border-t-[4px]"
        style={{ background: theme.headerBg, borderRadius: isEWC ? '0px' : '8px', borderTopColor: theme.main, borderBottom: isEWC ? `1px solid ${theme.border}` : 'none', boxShadow: theme.boxShadow }}
      >
        <h2 className="m-0 text-[28px] font-extrabold tracking-[1px] uppercase" style={{ fontFamily: theme.font, color: theme.headerText }}>
          {isFirstStand ? 'PHASE DE QUALIFICATION' : 'GROUP STAGE'}
        </h2>
        <div className="flex items-center gap-5">
          {event?.logo && <img src={event.logo} alt="" className="h-10 object-contain" style={{ filter: theme.logoFilter }} />}
          <span className="text-[24px] font-extrabold tracking-[2px] uppercase" style={{ fontFamily: theme.font, color: theme.headerText }}>
            {event?.name || 'TOURNAMENT'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[2vw] w-full max-w-[1600px] mx-auto pb-[140px]">
        {groups?.map((group) => (
          <div key={group.id} className="overflow-hidden border" style={{ background: theme.boxBg, borderRadius: isEWC ? '0px' : '8px', borderColor: theme.border, boxShadow: theme.boxShadow }}>
            <div className="p-[16px_24px] flex justify-between items-center" style={{ background: theme.headerBg, borderBottom: isEWC ? `1px solid ${theme.border}` : 'none' }}>
              <h2 className="m-0 text-[20px] font-extrabold tracking-[1px]" style={{ fontFamily: theme.font, color: theme.headerText }}>GROUP {group.id}</h2>
              <div className="text-[13px] font-semibold font-sans" style={{ color: isFirstStand ? '#FFFFFF' : theme.textMuted }}>
                QUALIFIED: <span style={{ color: theme.main }}>{group.qualified?.length || 0}/2</span>
              </div>
            </div>
            
            <div className="p-[40px_2vw] flex gap-[3vw]">
              <div className="flex-1 flex flex-col gap-[30px]">
                {getMatchBox(group.matches[0], "OPENING 1")}
                {getMatchBox(group.matches[1], "OPENING 2")}
              </div>
              <div className="flex-1 flex flex-col gap-[30px]">
                {getMatchBox(group.matches[2], "WINNERS")}
                {getMatchBox(group.matches[3], "ELIMINATION")}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {getMatchBox(group.matches[4], "DECIDER")}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div 
        className="fixed bottom-[30px] left-1/2 -translate-x-1/2 p-[12px_32px] flex gap-10 items-center z-[1000] border"
        style={{ 
          background: isWorlds ? 'rgba(5, 10, 25, 0.95)' : (isEWC ? '#0D0D0D' : theme.boxBg), 
          backdropFilter: isWorlds ? 'blur(16px)' : 'none', 
          borderRadius: isEWC ? '0px' : '50px',
          borderColor: isWorlds ? 'rgba(255, 255, 255, 0.15)' : theme.border, 
          boxShadow: isWorlds ? '0 10px 40px rgba(0,0,0,0.9)' : (isEWC ? '0 10px 30px rgba(0,0,0,0.9)' : theme.boxShadow),
      }}>
        <h3 className="m-0 text-base font-bold uppercase whitespace-nowrap" style={{ fontFamily: theme.font, color: theme.textMain }}>
           CONTRÔLE DU TOURNOI
        </h3>
        <button 
          onClick={toggleReady} 
          disabled={isGlobalReady}
          className="border-none p-[12px_28px] text-sm font-extrabold uppercase tracking-[1px] transition-all duration-200"
          style={{ 
              backgroundColor: isGlobalReady ? theme.border : (isWorlds ? '#FFFFFF' : theme.main), 
              color: isGlobalReady ? theme.textMuted : (isWorlds || isEWC ? '#000' : '#FFF'), 
              borderRadius: isEWC ? '0px' : '30px', cursor: isGlobalReady ? 'wait' : 'pointer',
              boxShadow: isGlobalReady || isFirstStand ? 'none' : (isWorlds ? '0 0 15px rgba(255, 255, 255, 0.2)' : 'none')
          }}
        >
          {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
        </button>
      </div>

    </div>
  );
}