import React from 'react';
import { socket } from '../../api/socket';

export default function GslGroupView({ state, event, ...props }) {
  const { groups, readyPlayers } = state;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
  const isGlobalReady = readyPlayers?.includes(socket.id);
  const tourneyColor = event?.color || '#00e5ff';

  const toggleReady = () => {
    socket.emit('toggle-ready');
  };

  const handleMatchClick = (match) => {
    if (match && match.status === 'pending') {
      // Si le match est prêt à être joué, on déclenche l'arène
      socket.emit('match-ready', match.id);
    }
  };

  const getMatchBox = (match, title) => {
    if (!match) return null;
    const isSim = match.status === 'simulating';
    const isFin = match.status === 'finished';
    const isPending = match.status === 'pending';
    
    return (
      <div 
        className="bracket-match" 
        onClick={() => handleMatchClick(match)}
        style={{ 
          width: '100%', 
          marginBottom: '10px', 
          fontSize: '13px', 
          borderColor: isPending ? tourneyColor : '#2a3546',
          cursor: isPending ? 'pointer' : 'default'
        }}
      >
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>{title}</div>
        <div className={`bracket-row ${isFin && match.winner?.id === match.teamA?.id ? 'winner' : ''}`}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.teamA ? match.teamA.name : '---'} {isSim && <span className="pulse-text text-pink">⚔️</span>}
          </span>
          {isFin && <span className="text-muted">{match.scoreA ?? 0}</span>}
        </div>
        <div className={`bracket-row ${isFin && match.winner?.id === match.teamB?.id ? 'winner' : ''}`}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.teamB ? match.teamB.name : '---'} {isSim && <span className="pulse-text text-pink">⚔️</span>}
          </span>
          {isFin && <span className="text-muted">{match.scoreB ?? 0}</span>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', width: '100%' }}>
        {groups?.map((group) => (
          <div 
            key={group.id} 
            className="panel" 
            style={{ 
              padding: '20px', 
              background: 'rgba(20, 27, 39, 0.7)',
              borderTop: `4px solid ${tourneyColor}`,
              boxShadow: `0 5px 15px rgba(0,0,0,0.3)`
            }}
          >
            <h2 className="title-font" style={{ color: tourneyColor, borderBottom: '1px solid #2a3546', paddingBottom: '10px', marginBottom: '20px' }}>
              GROUPE {group.id}
            </h2>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                {getMatchBox(group.matches[0], "OPENING 1")}
                {getMatchBox(group.matches[1], "OPENING 2")}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {getMatchBox(group.matches[2], "WINNERS")}
                {getMatchBox(group.matches[3], "LOSERS")}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {getMatchBox(group.matches[4], "DECIDER")}
              </div>
            </div>
            
            <div style={{ marginTop: '20px', padding: '10px', background: '#0d1323', borderRadius: '8px', border: `1px solid ${tourneyColor}40` }}>
              <span className="text-muted" style={{ fontSize: '12px' }}>QUALIFIÉS : </span>
              <span style={{ fontWeight: 'bold', color: tourneyColor }}>
                {group.qualified?.length > 0 ? group.qualified.map(t => t.name).join(' | ') : 'En attente...'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: '40px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', borderLeft: `6px solid ${tourneyColor}` }}>
        <span className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '2px' }}>
          {state.roundComplete ? 'PHASE DE GROUPES TERMINÉE' : 'CLIQUEZ SUR UN MATCH POUR JOUER'}
        </span>
        <button 
          className="btn" 
          style={{ backgroundColor: isGlobalReady ? '#4caf50' : tourneyColor, color: '#000', fontWeight: 'bold' }}
          onClick={toggleReady}
        >
          {isGlobalReady ? `PRÊT (${readyPlayers?.length || 0}/${humanCount})` : 'VALIDER LA SÉQUENCE'}
        </button>
      </div>

    </div>
  );
}