import React from 'react';
import { socket } from '../../api/socket';

export default function SwissStageView({ state, event }) {
  const myId = socket.id;
  const { bracket, currentRound, readyPlayers, roundComplete } = state;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-') && !p.isBot).length;
  const isGlobalReady = readyPlayers?.includes(myId);
  const isRoundReady = state.roundReady?.includes(myId);

  // --- MOTEUR DE THEMES UNIFIÉ ---
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
          main: '#0033CC', bg: '#F0F1F5', boxBg: '#FFFFFF', border: '#D0D4E0',
          font: "'Oswald', sans-serif", textMain: '#000000', textMuted: '#666666',
          headerBg: '#0033CC', headerText: '#FFFFFF', logoPlaceholder: '#E0E3EB',
          logoFilter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          bgStyle: { backgroundImage: 'radial-gradient(circle at top right, rgba(0,51,204,0.05) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(0,51,204,0.05) 0%, transparent 40%)' }
      };
  } else if (isEWC) {
      theme = { ...theme,
          main: '#FF5900', bg: '#0D0B0A', boxBg: '#171413', border: '#332B28',
          font: "'Rajdhani', sans-serif", textMain: '#FFFFFF', textMuted: '#A39893',
          headerBg: '#1E1A18', headerText: '#FF5900', logoPlaceholder: '#2A2422',
          logoFilter: 'drop-shadow(0px 1px 5px rgba(255,255,255,0.3))', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          bgStyle: { backgroundImage: 'linear-gradient(135deg, rgba(255,89,0,0.03) 0%, transparent 100%)' }
      };
  } else if (isFirstStand) {
      theme = { ...theme,
          main: '#FF5C00', bg: '#F4F5F8', boxBg: '#FFFFFF', border: '#E5E7EB',
          font: "'Rajdhani', sans-serif", textMain: '#25092C', textMuted: '#8B8B99',
          headerBg: '#25092C', headerText: '#FFFFFF', logoPlaceholder: '#F0F1F5',
          logoFilter: 'drop-shadow(0px 2px 6px rgba(37, 9, 44, 0.12)) drop-shadow(0px 0px 1px rgba(37, 9, 44, 0.3))', 
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
          bgStyle: { backgroundImage: `repeating-linear-gradient(115deg, transparent, transparent 100px, rgba(0,0,0,0.02) 100px, rgba(0,0,0,0.02) 102px), repeating-linear-gradient(-65deg, transparent, transparent 150px, rgba(0,0,0,0.015) 150px, rgba(0,0,0,0.015) 152px)` }
      };
  }

  const COLUMNS = [['0-0'], ['1-0', '0-1'], ['2-0', '1-1', '0-2'], ['2-1', '1-2'], ['2-2']];

  const handleMatchClick = (match) => {
    if (match && match.waveActive && match.status === 'pending' && (match.teamA?.id === myId || match.teamB?.id === myId)) socket.emit('match-ready', match.id);
  };

  const allMatches = bracket ? bracket.flat() : [];

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
        if (winnerId === team.id) return { color: theme.textMain, weight: 800 };
        return { color: theme.textMuted, weight: 500 };
    };

    const teamAStyle = getTeamStyle(match.teamA);
    const teamBStyle = getTeamStyle(match.teamB);

    return (
      <div style={{ position: 'relative', marginBottom: '8px', opacity: isActiveRound || isFin ? 1 : 0.4 }} key={match.id}>
        {isSim && <div className="pulse-text" style={{ fontSize: '10px', color: theme.main, position: 'absolute', top: '-14px', right: 0, fontWeight: 700 }}>• LIVE</div>}
        
        <div onClick={() => handleMatchClick(match)}
            style={{
                background: theme.boxBg, border: isMyTurn ? `1px solid ${theme.main}` : `1px solid ${theme.border}`,
                borderRadius: isWorlds ? '0px' : '4px', minWidth: '140px', cursor: isMyTurn ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif",
                boxShadow: isMyTurn ? `0 0 10px ${theme.main}40` : 'none'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: `1px solid ${theme.border}`, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? `${theme.main}15` : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '24px', height: '24px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '14px', color: teamAStyle.color, fontWeight: teamAStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: isWorlds ? theme.main : teamAStyle.color, fontWeight: teamAStyle.weight, flexShrink: 0, marginLeft: '6px' }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '-')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? `${theme.main}15` : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '24px', height: '24px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '14px', color: teamBStyle.color, fontWeight: teamBStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB ? match.teamB.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: isWorlds ? theme.main : teamBStyle.color, fontWeight: teamBStyle.weight, flexShrink: 0, marginLeft: '6px' }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '-')}</span>
            </div>
        </div>
      </div>
    );
  };

  const SwissPoolBlock = ({ pool }) => {
    const poolMatches = allMatches.filter(m => m.pool === pool);
    if (poolMatches.length === 0) return null;

    return (
      <div style={{ background: theme.boxBg, borderRadius: '8px', overflow: 'hidden', minWidth: '160px', border: `1px solid ${theme.border}`, boxShadow: theme.boxShadow }}>
        <div style={{ background: theme.headerBg, padding: '8px', textAlign: 'center', color: theme.headerText, fontWeight: 700, fontSize: '13px' }}>
          GROUP {pool}
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {poolMatches.map(m => <SwissMatchBox key={m.id} match={m} />)}
        </div>
      </div>
    );
  };

  if (!bracket || bracket.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, overflowY: 'auto', overflowX: 'hidden', padding: '40px 2vw', backgroundColor: theme.bg, ...theme.bgStyle }}>
      
      <div style={{ textAlign: 'center', marginBottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* INCORPORATION DU LOGO EVENEMENT */}
        {event?.logo && <img src={event.logo} alt="" style={{ height: '70px', objectFit: 'contain', marginBottom: '20px', filter: theme.logoFilter }} />}
        
        <h2 style={{ fontFamily: theme.font, fontSize: '36px', color: theme.textMain, margin: '0', textTransform: 'uppercase', letterSpacing: '2px' }}>SWISS STAGE</h2>
        {isWorlds && <div style={{ width: '60px', height: '3px', background: theme.main, margin: '15px auto 0' }}></div>}
      </div>

      <div style={{ display: 'flex', gap: '4vw', justifyContent: 'center', alignItems: 'flex-start', paddingBottom: '20px' }}>
        {COLUMNS.map((col, colIdx) => (
          <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {col.map(pool => (
              <SwissPoolBlock key={pool} pool={pool} />
            ))}
          </div>
        ))}
      </div>

      <div style={{ margin: '40px auto 0', background: theme.boxBg, borderRadius: '8px', border: `1px solid ${theme.border}`, width: '100%', maxWidth: '1200px', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: theme.boxShadow }}>
        <div>
          <h3 style={{ fontFamily: theme.font, color: theme.textMain, margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>
            {roundComplete ? "GÉNÉRATION DU TIRAGE SUIVANT" : `CONTRÔLE - ROUND ${currentRound + 1} / 5`}
          </h3>
        </div>
        
        <button onClick={roundComplete ? () => socket.emit('advance-round') : () => socket.emit('toggle-ready')} disabled={roundComplete ? isRoundReady : isGlobalReady}
          style={{ backgroundColor: (roundComplete ? isRoundReady : isGlobalReady) ? theme.border : (roundComplete ? (isFirstStand || isWorlds ? theme.headerBg : '#FFF') : theme.main), color: (roundComplete ? isRoundReady : isGlobalReady) ? theme.textMuted : (isFirstStand || isWorlds || isEWC ? '#FFF' : '#000'), border: 'none', padding: '14px 28px', borderRadius: '4px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
          {roundComplete ? (isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TIRAGE SUIVANT") : (isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER')}
        </button>
      </div>
    </div>
  );
}