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
          headerBg: '#25092C', headerText: '#FFFFFF', // <-- RESTAURÉ : Les vraies couleurs First Stand !
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
      <div style={{ position: 'relative', marginBottom: '12px', width: '100%' }} key={match.id}>
        <div style={{ color: theme.main, fontSize: '11px', fontWeight: 800, position: 'absolute', top: '-16px', left: 0, letterSpacing: '0.5px', fontFamily: theme.font, textTransform: 'uppercase' }}>
            {title} {isSim && <span className="pulse-text" style={{ color: theme.main, marginLeft: '4px' }}>• LIVE</span>}
        </div>
        
        <div onClick={() => handleMatchClick(match)}
            style={{
                background: theme.boxBg, 
                backdropFilter: isWorlds ? 'blur(12px)' : 'none',
                border: borderStyle,
                borderLeft: (isWorlds || isEWC) && involvesMe ? `3px solid ${theme.accent}` : borderStyle,
                borderRadius: isWorlds || isEWC ? '0px' : '6px', 
                minWidth: '160px', cursor: isMyTurn ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif",
                boxShadow: isWorlds || isEWC ? theme.boxShadow : (isMyTurn ? `0 0 12px ${theme.main}50` : theme.boxShadow),
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${theme.border}`, opacity: match.teamA ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamA?.id ? winnerBg : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    {match.teamA?.logo ? <img src={match.teamA.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '24px', height: '24px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '14px', color: teamAStyle.color, fontWeight: teamAStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA ? match.teamA.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: teamAStyle.color, fontWeight: teamAStyle.weight, flexShrink: 0, marginLeft: '6px' }}>{isFin ? match.scoreA : (isSim ? match.scoreA : '-')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', opacity: match.teamB ? 1 : 0.5, backgroundColor: isFin && match.winner?.id === match.teamB?.id ? winnerBg : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    {match.teamB?.logo ? <img src={match.teamB.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: theme.logoFilter, flexShrink: 0 }} /> : <div style={{ width: '24px', height: '24px', background: theme.logoPlaceholder, borderRadius: '4px', flexShrink: 0 }} />}
                    <span style={{ fontSize: '14px', color: teamBStyle.color, fontWeight: teamBStyle.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB ? match.teamB.tag : 'TBD'}</span>
                </div>
                <span style={{ fontSize: '15px', color: teamBStyle.color, fontWeight: teamBStyle.weight, flexShrink: 0, marginLeft: '6px' }}>{isFin ? match.scoreB : (isSim ? match.scoreB : '-')}</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, overflowY: 'auto', overflowX: 'hidden', padding: '40px 2vw', backgroundColor: theme.bg, ...theme.bgStyle }}>
      
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto 40px auto', background: theme.headerBg, borderRadius: isEWC ? '0px' : '8px', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `4px solid ${theme.main}`, borderBottom: isEWC ? `1px solid ${theme.border}` : 'none', boxShadow: theme.boxShadow }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vw', width: '100%', maxWidth: '1600px', margin: '0 auto', paddingBottom: '140px' }}>
        {groups?.map((group) => (
          <div key={group.id} style={{ background: theme.boxBg, borderRadius: isEWC ? '0px' : '8px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.boxShadow }}>
            <div style={{ background: theme.headerBg, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isEWC ? `1px solid ${theme.border}` : 'none' }}>
              <h2 style={{ fontFamily: theme.font, margin: 0, color: theme.headerText, fontSize: '20px', fontWeight: 800, letterSpacing: '1px' }}>GROUP {group.id}</h2>
              <div style={{ fontSize: '13px', color: isFirstStand ? '#FFFFFF' : theme.textMuted, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                QUALIFIED: <span style={{ color: theme.main }}>{group.qualified?.length || 0}/2</span>
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

      {/* PANNEAU DE CONTRÔLE FLOTTANT UNIFIÉ ET CORRIGÉ */}
      <div style={{ 
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          background: isWorlds ? 'rgba(5, 10, 25, 0.95)' : (isEWC ? '#0D0D0D' : theme.boxBg), 
          backdropFilter: isWorlds ? 'blur(16px)' : 'none', 
          borderRadius: isEWC ? '0px' : '50px',
          border: `1px solid ${isWorlds ? 'rgba(255, 255, 255, 0.15)' : theme.border}`, 
          padding: '12px 32px', display: 'flex', gap: '40px', alignItems: 'center', 
          boxShadow: isWorlds ? '0 10px 40px rgba(0,0,0,0.9)' : (isEWC ? '0 10px 30px rgba(0,0,0,0.9)' : theme.boxShadow),
          zIndex: 1000 
      }}>
        <h3 style={{ fontFamily: theme.font, color: theme.textMain, margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
           CONTRÔLE DU TOURNOI
        </h3>
        <button onClick={toggleReady} disabled={isGlobalReady}
          style={{ 
              backgroundColor: isGlobalReady ? theme.border : (isWorlds ? '#FFFFFF' : theme.main), 
              color: isGlobalReady ? theme.textMuted : (isWorlds || isEWC ? '#000' : '#FFF'), 
              border: 'none', padding: '12px 28px', borderRadius: isEWC ? '0px' : '30px', fontSize: '14px', fontWeight: 800, cursor: isGlobalReady ? 'wait' : 'pointer',
              textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.2s ease',
              boxShadow: isGlobalReady || isFirstStand ? 'none' : (isWorlds ? '0 0 15px rgba(255, 255, 255, 0.2)' : 'none')
          }}>
          {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
        </button>
      </div>

    </div>
  );
}