import React from 'react';
import { socket } from '../../api/socket';

export default function GslGroupView({ state, event }) {
  const { groups, readyPlayers } = state;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-') && !p.isBot).length;
  const isGlobalReady = readyPlayers?.includes(socket.id);
  const myId = socket.id;

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
          // FIX : Ombre double teintée
          logoFilter: 'drop-shadow(0px 2px 6px rgba(37, 9, 44, 0.12)) drop-shadow(0px 0px 1px rgba(37, 9, 44, 0.3))', 
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
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
        if (winnerId === team.id) return { color: theme.textMain, weight: 800 };
        return { color: theme.textMuted, weight: 500 };
    };

    const teamAStyle = getTeamStyle(match.teamA);
    const teamBStyle = getTeamStyle(match.teamB);

    return (
      <div style={{ position: 'relative', marginBottom: '12px', width: '100%' }} key={match.id}>
        <div style={{ color: isFirstStand || isEWC ? theme.main : theme.headerText, fontSize: '11px', fontWeight: 800, position: 'absolute', top: '-16px', left: 0, letterSpacing: '0.5px', fontFamily: theme.font, textTransform: 'uppercase' }}>
            {title} {isSim && <span className="pulse-text" style={{ color: theme.main, marginLeft: '4px' }}>• LIVE</span>}
        </div>
        
        <div onClick={() => handleMatchClick(match)}
            style={{
                background: theme.boxBg, border: isMyTurn ? `1px solid ${theme.main}` : `1px solid ${theme.border}`,
                borderRadius: isWorlds ? '0px' : '4px', minWidth: '160px', cursor: isMyTurn ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif",
                boxShadow: isMyTurn ? `0 0 12px ${theme.main}50` : theme.boxShadow
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${theme.border}`, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? `${theme.main}15` : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '24px', height: '24px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '14px', color: teamAStyle.color, fontWeight: teamAStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: isWorlds ? theme.main : teamAStyle.color, fontWeight: teamAStyle.weight, flexShrink: 0, marginLeft: '6px' }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '-')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? `${theme.main}15` : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '24px', height: '24px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '14px', color: teamBStyle.color, fontWeight: teamBStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB ? match.teamB.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: isWorlds ? theme.main : teamBStyle.color, fontWeight: teamBStyle.weight, flexShrink: 0, marginLeft: '6px' }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '-')}</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, overflowY: 'auto', overflowX: 'hidden', padding: '40px 2vw', backgroundColor: theme.bg, ...theme.bgStyle }}>
      
      {/* LA BANDE TITRE MAJESTUEUSE AVEC LOGO INCRUSTÉ */}
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto 40px auto', background: theme.headerBg, borderRadius: '8px', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `4px solid ${theme.main}`, boxShadow: theme.boxShadow }}>
        <h2 style={{ fontFamily: theme.font, fontSize: '28px', color: theme.headerText, margin: 0, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {isFirstStand ? 'PHASE DE QUALIFICATION' : 'GROUP STAGE'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {event?.logo && <img src={event.logo} alt="" style={{ height: '40px', objectFit: 'contain', filter: theme.logoFilter }} />}
          <span style={{ fontFamily: theme.font, fontSize: '24px', color: theme.headerText, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            {event?.name || 'TOURNAMENT'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vw', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        {groups?.map((group) => (
          <div key={group.id} style={{ background: theme.boxBg, borderRadius: '8px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.boxShadow }}>
            <div style={{ background: theme.headerBg, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: theme.font, margin: 0, color: theme.headerText, fontSize: '20px', fontWeight: 800, letterSpacing: '1px' }}>GROUP {group.id}</h2>
              <div style={{ fontSize: '13px', color: isFirstStand ? '#FFF' : theme.textMuted, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                QUALIFIED: <span style={{ color: isFirstStand ? theme.main : '#FFF' }}>{group.qualified?.length || 0}/2</span>
              </div>
            </div>
            
            <div style={{ padding: '40px 2vw', display: 'flex', gap: '3vw' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {getMatchBox(group.matches[0], "OPENING 1")}
                {getMatchBox(group.matches[1], "OPENING 2")}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {getMatchBox(group.matches[2], "WINNERS")}
                {getMatchBox(group.matches[3], "ELIMINATION")}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {getMatchBox(group.matches[4], "DECIDER")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PANNEAU DE CONTROLE NON FLOTTANT */}
      <div style={{ margin: '40px auto 0', background: theme.boxBg, borderRadius: '8px', border: `1px solid ${theme.border}`, width: '100%', maxWidth: '1600px', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: theme.boxShadow }}>
        <div>
          <h3 style={{ fontFamily: theme.font, color: theme.textMain, margin: '0 0 8px 0', fontSize: '22px', fontWeight: 800 }}>CONTRÔLE DU TOURNOI</h3>
        </div>
        <button onClick={toggleReady} disabled={isGlobalReady}
          style={{ backgroundColor: isGlobalReady ? theme.border : theme.main, color: isGlobalReady ? theme.textMuted : (isFirstStand || isWorlds || isEWC ? '#FFF' : '#000'), border: 'none', padding: '14px 32px', borderRadius: '6px', fontSize: '15px', fontWeight: 700, cursor: isGlobalReady ? 'wait' : 'pointer', letterSpacing: '1px' }}>
          {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
        </button>
      </div>

    </div>
  );
}