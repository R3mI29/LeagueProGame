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
      main: '#00e5ff', accent: '#00e5ff', bg: '#0A0D14', boxBg: '#15171E', border: '#2B3040',
      font: "'Inter', sans-serif", textMain: '#FFFFFF', textMuted: '#7A8190',
      headerBg: '#1C212E', headerText: '#8C9AD6', logoPlaceholder: '#2B3040',
      logoFilter: 'drop-shadow(0px 1px 4px rgba(255,255,255,0.25))',
      boxShadow: 'none', bgStyle: {}
  };

  if (isWorlds) {
      theme = { ...theme,
          main: '#FFFFFF', // Blanc pur
          accent: '#0066FF', // Vrai Bleu Worlds (fini le cyan/vert)
          bg: '#02050D', // Bleu nuit quasi noir
          boxBg: 'linear-gradient(180deg, rgba(12, 18, 38, 0.85) 0%, rgba(6, 10, 22, 0.95) 100%)', 
          border: 'rgba(255, 255, 255, 0.15)', 
          font: "'Oswald', sans-serif", 
          textMain: '#FFFFFF', 
          textMuted: '#8A9CCC',
          headerBg: 'linear-gradient(90deg, rgba(0, 51, 153, 0.15), rgba(0, 102, 255, 0.3), rgba(0, 51, 153, 0.15))', 
          headerText: '#FFFFFF', 
          logoPlaceholder: 'rgba(255,255,255,0.05)',
          logoFilter: 'drop-shadow(0px 2px 8px rgba(0, 102, 255, 0.5))', 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
          bgStyle: { 
              backgroundImage: `
                radial-gradient(circle at 50% -10%, rgba(0, 102, 255, 0.35) 0%, transparent 60%),
                radial-gradient(circle at 10% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
                radial-gradient(circle at 90% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
                linear-gradient(to bottom, #010308, #040A17)
              ` 
          }
      };
  }
  // ... (EWC et First Stand restent identiques)

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
    ['0-0'], 
    ['1-0', '0-1'], 
    ['2-0', '1-1', '0-2'], 
    ['Q3-0', '2-1', '1-2', 'E0-3'], 
    ['Q3-1', '2-2', 'E1-3'], 
    ['Q3-2', 'E2-3']
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
    
    // Qualification : Bleu profond & Blanc (sans doré)
    if (type.startsWith('Q')) {
        if (type === 'Q3-0') { teams = getTeamsByResult('2-0', true); title = 'QUALIFIED (3-0)'; }
        if (type === 'Q3-1') { teams = getTeamsByResult('2-1', true); title = 'QUALIFIED (3-1)'; }
        if (type === 'Q3-2') { teams = getTeamsByResult('2-2', true); title = 'QUALIFIED (3-2)'; }
        headerStyle = {
            background: 'linear-gradient(90deg, rgba(0, 51, 153, 0.7), rgba(0, 102, 255, 0.9))',
            borderTop: '2px solid #FFFFFF', // Liseré blanc éclatant
            color: '#FFFFFF',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        };
    } else {
        // Élimination : Rouge sombre et élégant
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
        <div style={{ background: theme.boxBg, backdropFilter: isWorlds ? 'blur(12px)' : 'none', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${theme.border}`, boxShadow: theme.boxShadow }}>
            <div style={{ ...headerStyle, padding: '8px', textAlign: 'center', fontWeight: 800, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {teams.map((team, idx) => (
                    <div key={team.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderBottom: idx < teams.length - 1 ? `1px solid ${theme.border}` : 'none', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        {team.logo ? <img src={team.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: theme.logoFilter }} /> : <div style={{ width: '22px', height: '22px', background: theme.logoPlaceholder, borderRadius: '4px' }} />}
                        <span style={{ fontSize: '14px', color: theme.textMain, fontWeight: 700 }}>{team.tag || team.name}</span>
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
        if (winnerId === team.id) return { color: isWorlds ? '#FFFFFF' : theme.main, weight: 800 }; // Le gagnant est en blanc pur
        return { color: theme.textMuted, weight: 500 };
    };

    const teamAStyle = getTeamStyle(match.teamA);
    const teamBStyle = getTeamStyle(match.teamB);
    const boxGlow = isMyTurn ? `0 0 20px rgba(0, 102, 255, 0.5)` : 'none';
    const borderStyle = isMyTurn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`;

    return (
      <div style={{ position: 'relative', marginBottom: '10px', opacity: isActiveRound || isFin ? 1 : 0.4, transition: 'all 0.3s' }} key={match.id}>
        {isSim && <div className="pulse-text" style={{ fontSize: '10px', color: theme.accent, position: 'absolute', top: '-14px', right: 0, fontWeight: 700, letterSpacing: '1px', textShadow: `0 0 5px rgba(0, 102, 255, 0.5)` }}>• LIVE</div>}
        
        <div onClick={() => handleMatchClick(match)}
            style={{
                background: theme.boxBg, 
                backdropFilter: isWorlds ? 'blur(12px)' : 'none',
                border: borderStyle,
                borderLeft: isWorlds && involvesMe ? `3px solid ${theme.accent}` : borderStyle,
                borderRadius: '6px', cursor: isMyTurn ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif",
                boxShadow: isMyTurn ? boxGlow : theme.boxShadow,
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? (isWorlds ? 'rgba(0, 102, 255, 0.15)' : `${theme.main}15`) : 'transparent', borderRadius: '6px 6px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '22px', height: '22px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '14px', color: teamAStyle.color, fontWeight: teamAStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight, flexShrink: 0, marginLeft: '6px' }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '-')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? (isWorlds ? 'rgba(0, 102, 255, 0.15)' : `${theme.main}15`) : 'transparent', borderRadius: '0 0 6px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '22px', height: '22px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '14px', color: teamBStyle.color, fontWeight: teamBStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB ? match.teamB.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight, flexShrink: 0, marginLeft: '6px' }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '-')}</span>
            </div>
        </div>
      </div>
    );
  };

  const SwissPoolBlock = ({ pool }) => {
    const poolMatches = allMatches.filter(m => m.pool === pool);
    return (
      <div style={{ background: theme.boxBg, backdropFilter: isWorlds ? 'blur(12px)' : 'none', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${theme.border}`, boxShadow: theme.boxShadow }}>
        <div style={{ 
            background: theme.headerBg, 
            borderTop: isWorlds ? `2px solid ${theme.accent}` : 'none', 
            padding: '8px', textAlign: 'center', color: theme.headerText, fontWeight: 800, fontSize: '13px', letterSpacing: '1px', borderBottom: `1px solid ${theme.border}` 
        }}>
          {pool}
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {poolMatches.map(m => <SwissMatchBox key={m.id} match={m} />)}
        </div>
      </div>
    );
  };

  if (!bracket || bracket.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, overflowY: 'auto', overflowX: 'hidden', padding: '40px 2vw', backgroundColor: theme.bg, ...theme.bgStyle }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {event?.logo && <img src={event.logo} alt="" style={{ height: '75px', objectFit: 'contain', marginBottom: '15px', filter: theme.logoFilter }} />}
        
        <h2 style={{ fontFamily: theme.font, fontSize: '36px', color: theme.textMain, margin: '0', textTransform: 'uppercase', letterSpacing: '6px', textShadow: isWorlds ? `0 0 20px rgba(0, 102, 255, 0.6)` : 'none' }}>SWISS STAGE</h2>
        {isWorlds && <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, transparent, #0066FF, transparent)', margin: '15px auto 0' }}></div>}
      </div>

      <div style={{ display: 'flex', width: '100%', gap: '1.5vw', justifyContent: 'center', alignItems: 'center', paddingBottom: '120px' }}>
        {COLUMNS.map((col, colIdx) => {
          const columnHasContent = col.some(hasContent);
          if (!columnHasContent) return null;

          return (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, maxWidth: '210px' }}>
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
      <div style={{ 
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          background: isWorlds ? 'rgba(5, 10, 22, 0.95)' : theme.boxBg, 
          backdropFilter: 'blur(16px)', borderRadius: '50px',
          border: `1px solid ${isWorlds ? 'rgba(255, 255, 255, 0.2)' : theme.border}`, 
          padding: '12px 32px', display: 'flex', gap: '40px', alignItems: 'center', 
          boxShadow: isWorlds ? '0 10px 40px rgba(0,0,0,0.9), 0 0 20px rgba(0, 102, 255, 0.2)' : theme.boxShadow,
          zIndex: 1000 
      }}>
        <h3 style={{ fontFamily: theme.font, color: theme.textMain, margin: 0, fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          {roundComplete ? "GÉNÉRATION DU TIRAGE" : `CONTRÔLE - ROUND ${currentRound + 1} / 5`}
        </h3>
        
        <button onClick={roundComplete ? () => socket.emit('advance-round') : () => socket.emit('toggle-ready')} disabled={roundComplete ? isRoundReady : isGlobalReady}
          style={{ 
              backgroundColor: (roundComplete ? isRoundReady : isGlobalReady) ? theme.border : (roundComplete ? (isFirstStand || isWorlds ? (isWorlds ? '#FFFFFF' : theme.headerBg) : '#FFF') : theme.main), 
              color: (roundComplete ? isRoundReady : isGlobalReady) ? theme.textMuted : (isFirstStand || isEWC || isWorlds ? '#000' : '#000'), 
              border: 'none', padding: '12px 28px', borderRadius: '30px', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.2s ease',
              boxShadow: (roundComplete ? isRoundReady : isGlobalReady) || !isWorlds ? 'none' : `0 0 15px rgba(255, 255, 255, 0.4)`
          }}>
          {roundComplete ? (isRoundReady ? `EN ATTENTE (${state.roundReady.length}/${humanCount})` : "TIRAGE SUIVANT") : (isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER LE ROUND')}
        </button>
      </div>
    </div>
  );
}