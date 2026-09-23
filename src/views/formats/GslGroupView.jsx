import React from 'react';
import { socket } from '../../api/socket';

export default function GslGroupView({ state, event }) {
  const { groups, readyPlayers } = state;
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
  const isGlobalReady = readyPlayers?.includes(socket.id);
  const tourneyColor = event?.color || '#00e5ff';
  const myId = socket.id;

  const toggleReady = () => {
    socket.emit('toggle-ready');
  };

  const handleMatchClick = (match) => {
    // AJOUT : Vérification du waveActive pour être cohérent avec le nouveau système de vagues
    if (match && match.waveActive && match.status === 'pending' && (match.teamA?.id === myId || match.teamB?.id === myId)) {
      socket.emit('match-ready', match.id);
    }
  };

  const getMatchBox = (match, title) => {
    if (!match) return null;
    const isSim = match.status === 'simulating';
    const isFin = match.status === 'finished';
    const involvesMe = match.teamA?.id === myId || match.teamB?.id === myId;
    
    // Si c'est mon match, qu'il a le feu vert (waveActive) et qu'il est en attente
    const isMyTurn = match.waveActive && match.status === 'pending' && involvesMe;

    return (
      <div 
        onClick={() => handleMatchClick(match)}
        style={{ 
          background: '#11141E',
          border: isMyTurn ? `2px solid ${tourneyColor}` : `1px solid #222838`,
          borderRadius: '8px',
          padding: '12px 16px', // PLUS D'ESPACE
          marginBottom: '16px',
          minWidth: '260px', // LARGEUR MINIMALE FIXÉE
          cursor: isMyTurn ? 'pointer' : 'default',
          boxShadow: isMyTurn ? `0 0 15px ${tourneyColor}40` : '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'all 0.2s',
          position: 'relative'
        }}
      >
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '11px', letterSpacing: '1px', color: '#768196', marginBottom: '10px', textTransform: 'uppercase', textAlign: 'center' }}>
          {title} {isSim && <span className="pulse-text" style={{ color: tourneyColor }}>[EN COURS]</span>}
        </div>

        {/* TEAM A */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: isFin && match.winner?.id === match.teamA?.id ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '4px', opacity: !match.teamA ? 0.3 : 1 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: match.teamA?.id === myId ? tourneyColor : '#F0F2F5', textWrap: 'wrap', paddingRight: '10px' }}>
            {match.teamA ? match.teamA.name : 'TBD'}
          </span>
          {isFin && <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: match.winner?.id === match.teamA?.id ? tourneyColor : '#768196' }}>{match.scoreA}</span>}
        </div>

        {/* TEAM B */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: isFin && match.winner?.id === match.teamB?.id ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '4px', opacity: !match.teamB ? 0.3 : 1, marginTop: '4px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: match.teamB?.id === myId ? tourneyColor : '#F0F2F5', textWrap: 'wrap', paddingRight: '10px' }}>
            {match.teamB ? match.teamB.name : 'TBD'}
          </span>
          {isFin && <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: match.winner?.id === match.teamB?.id ? tourneyColor : '#768196' }}>{match.scoreB}</span>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '40px' }}>
      
      {/* NOUVELLE GRILLE : Les groupes s'afficheront sur 1 ou 2 colonnes selon la largeur de l'écran pour éviter d'écraser les matchs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(650px, 1fr))', gap: '40px', width: '100%' }}>
        {groups?.map((group, i) => (
          <div key={group.id} style={{ background: '#080A10', borderRadius: '12px', border: `1px solid #222838`, overflow: 'hidden' }}>
            
            {/* Header du Groupe */}
            <div style={{ background: `linear-gradient(90deg, ${tourneyColor}20 0%, transparent 100%)`, borderBottom: `2px solid ${tourneyColor}`, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", margin: 0, color: '#FFF', fontSize: '24px', letterSpacing: '1px' }}>GROUPE {group.id}</h2>
              <div style={{ fontSize: '12px', color: '#768196', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px' }}>
                QUALIFIÉS: <span style={{ color: tourneyColor, fontWeight: 'bold' }}>{group.qualified?.length || 0}/2</span>
              </div>
            </div>
            
            {/* L'arbre GSL qui respire */}
            <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
              
              {/* Colonne 1 : Ouverture */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {getMatchBox(group.matches[0], "Ouverture 1")}
                <div style={{ height: '40px' }} /> {/* Espace pur */}
                {getMatchBox(group.matches[1], "Ouverture 2")}
              </div>
              
              {/* Colonne 2 : Winner & Loser */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px' }}>
                {getMatchBox(group.matches[2], "Match des Gagnants")}
                {getMatchBox(group.matches[3], "Match Éliminatoire")}
              </div>

              {/* Colonne 3 : Decider */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {getMatchBox(group.matches[4], "Match Décisif")}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Bouton de progression Global avec UX améliorée */}
      <div style={{ marginTop: '50px', background: '#11141E', borderRadius: '12px', border: `1px solid #222838`, width: '100%', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', margin: '0 0 8px 0', fontSize: '20px' }}>CONTRÔLE DU TOURNOI</h3>
          <span style={{ fontFamily: "'Inter', sans-serif", color: '#768196', fontSize: '14px' }}>
            {state.roundComplete ? 'Tous les matchs du groupe sont terminés. Prêt pour les Playoffs.' : 'Les matchs en attente nécessitent votre validation pour se lancer.'}
          </span>
        </div>
        <button 
          onClick={toggleReady}
          disabled={isGlobalReady}
          style={{ 
            backgroundColor: isGlobalReady ? '#222838' : tourneyColor, 
            color: isGlobalReady ? '#768196' : '#000', 
            border: 'none', padding: '16px 32px', borderRadius: '8px', 
            fontFamily: "'Oswald', sans-serif", fontSize: '16px', fontWeight: 600, letterSpacing: '1px', 
            cursor: isGlobalReady ? 'wait' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: isGlobalReady ? 'none' : `0 4px 15px ${tourneyColor}60`
          }}
        >
          {isGlobalReady ? `EN ATTENTE (${readyPlayers?.length || 0}/${humanCount})` : 'LANCER / AVANCER'}
        </button>
      </div>

    </div>
  );
}