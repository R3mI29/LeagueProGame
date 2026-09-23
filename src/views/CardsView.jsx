import { useState } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import { EVENTS } from '../constants/seasonConfig';
import CardIllustration from '../components/CardIllustration';

function getCard(id) {
  return CARD_POOL.find(c => c.id === id);
}

// Palette de couleurs "Pro Esport" (Élégant, Épique, Clean)
const THEME = {
  bgApp: '#080A10',        // Bleu nuit très profond (presque noir)
  bgPanel: '#11141E',      // Ardoise sombre
  border: '#222838',       // Bordure discrète
  accentGold: '#D4AF37',   // Or prestigieux (façon trophée Worlds)
  textMain: '#F0F2F5',     // Blanc cassé
  textMuted: '#768196',    // Gris élégant
};

export default function CardsView({ state, openPack, setLineupCard, toggleLineupReady }) {
  const myId = socket.id;
  const [activeTab, setActiveTab] = useState('roster'); 
  const [activeRole, setActiveRole] = useState(ORDERED_ROLES[0]);

  const rawCollection = state.cardCollections?.[myId] || {};
  const myLineup = state.activeLineups?.[myId] || {};
  const myPendingPacks = state.pendingPacks?.[myId] || 0;
  
  const myCollection = { ...rawCollection };
  (state.lastOpenedPack?.[myId] || []).forEach(cardId => {
    if (myCollection[cardId]) {
      myCollection[cardId] -= 1;
      if (myCollection[cardId] <= 0) delete myCollection[cardId];
    }
  });

  const isReady = state.readyPlayers.includes(myId);
  const lineupComplete = ORDERED_ROLES.every(role => myLineup[role]);
  const ownedCardsForRole = (role) => CARD_POOL.filter(c => c.role === role && (myCollection[c.id] || 0) > 0);

  const teamPower = ORDERED_ROLES.reduce((total, role) => {
    const card = getCard(myLineup[role]);
    return total + (card ? (card.overall || card.rating || 80) : 0);
  }, 0) / 5;

  // Tri du classement par points (et par titres en cas d'égalité)
  const sortedLeaderboard = [...state.participants].sort((a, b) => {
    const ptsA = state.seasonScores?.[a.id]?.points || 0;
    const ptsB = state.seasonScores?.[b.id]?.points || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    
    const titlesA = state.seasonScores?.[a.id]?.titles || 0;
    const titlesB = state.seasonScores?.[b.id]?.titles || 0;
    return titlesB - titlesA;
  });

  const currentEventIndex = state.eventIndex || 0;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: THEME.bgApp,
      color: THEME.textMain,
      fontFamily: "'Inter', sans-serif",
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* EN-TÊTE ÉLÉGANT */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '24px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '38px', margin: 0, fontWeight: 600, letterSpacing: '1px', color: '#FFFFFF' }}>
              CIRCUIT <span style={{ color: THEME.accentGold }}>PRO</span>
            </h1>
            <span style={{ color: THEME.textMuted, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500 }}>
              Gestion de Roster Officiel — Année {state.year || 1}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'roster', label: 'Gestion Équipe' },
              { id: 'circuit', label: 'Calendrier & Compétitions' },
              { id: 'halloffame', label: 'Classement Global' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? THEME.accentGold : THEME.textMuted,
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `2px solid ${THEME.accentGold}` : '2px solid transparent',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ONGLET 1 : ROSTER (Le cœur du jeu) */}
        {activeTab === 'roster' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
            
            <div style={{ backgroundColor: THEME.bgPanel, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: "'Oswald', sans-serif", margin: 0, color: '#FFF', fontSize: '24px', letterSpacing: '0.5px' }}>DRAFT D'ÉQUIPE</h2>
                <div style={{ fontSize: '14px', color: THEME.textMuted }}>SÉLECTIONNEZ VOS 5 TITULAIRES</div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: '#0C0E14', padding: '6px', borderRadius: '6px' }}>
                {ORDERED_ROLES.map(role => {
                  const selectedCard = getCard(myLineup[role]);
                  return (
                    <button key={role} onClick={() => setActiveRole(role)}
                      style={{
                        flex: 1, padding: '12px 8px', borderRadius: '4px', border: 'none',
                        backgroundColor: activeRole === role ? '#1A1E2C' : 'transparent',
                        color: activeRole === role ? '#FFF' : THEME.textMuted,
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                        transition: 'background-color 0.2s'
                      }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{role}</span>
                      <span style={{ fontSize: '13px', color: selectedCard ? THEME.accentGold : THEME.textMuted, fontWeight: selectedCard ? 600 : 400 }}>
                        {selectedCard ? selectedCard.baseName : 'Non assigné'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', minHeight: '300px' }}>
                {ownedCardsForRole(activeRole).length === 0 ? (
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textMuted, fontStyle: 'italic' }}>
                    Aucun joueur disponible pour le poste de {activeRole}.
                  </div>
                ) : (
                  ownedCardsForRole(activeRole).map(card => {
                    const selected = myLineup[activeRole] === card.id;
                    const quantity = myCollection[card.id] || 0;
                    
                    return (
                      <div key={card.id} onClick={() => setLineupCard(activeRole, card.id)}
                        style={{
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          transform: selected ? 'translateY(-6px)' : 'none',
                          position: 'relative'
                        }}>
                        <div style={{ 
                          padding: '4px', 
                          borderRadius: '12px', 
                          border: selected ? `2px solid ${THEME.accentGold}` : `2px solid transparent`,
                          boxShadow: selected ? `0 12px 24px rgba(212, 175, 55, 0.15)` : 'none',
                          backgroundColor: selected ? 'rgba(212, 175, 55, 0.05)' : 'transparent'
                        }}>
                          <CardIllustration card={card} width={155} />
                        </div>

                        {quantity > 1 && (
                          <div style={{ 
                            position: 'absolute', top: '-6px', right: '-6px', 
                            backgroundColor: '#2A3042', border: `1px solid ${THEME.border}`, color: '#FFF', 
                            borderRadius: '4px', padding: '2px 8px', 
                            fontSize: '11px', fontWeight: 600, zIndex: 10,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                          }}>
                            x{quantity}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* BARRE LATÉRALE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ backgroundColor: THEME.bgPanel, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: THEME.textMuted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Moyenne d'Équipe</div>
                <div style={{ fontSize: '56px', fontFamily: "'Oswald', sans-serif", fontWeight: 600, color: teamPower > 0 ? THEME.accentGold : THEME.textMuted }}>
                  {teamPower > 0 ? Math.round(teamPower) : '-'}
                </div>
              </div>

              <div style={{ backgroundColor: '#131621', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 16px 0', fontFamily: "'Oswald', sans-serif", color: '#FFF', fontSize: '18px', fontWeight: 500, letterSpacing: '0.5px' }}>
                  CENTRE DE RECRUTEMENT
                </h3>
                {myPendingPacks > 0 ? (
                  <button onClick={openPack} style={{ 
                    width: '100%', backgroundColor: '#FFF', color: '#000', border: 'none', 
                    padding: '16px', borderRadius: '4px', fontSize: '14px', fontWeight: 700, 
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
                    boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)' 
                  }}>
                    Ouvrir {myPendingPacks} Pack{myPendingPacks > 1 ? 's' : ''}
                  </button>
                ) : (
                  <p style={{ color: THEME.textMuted, fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                    Aucun contrat disponible. Terminez la saison actuelle pour obtenir des récompenses.
                  </p>
                )}
              </div>

              <button onClick={toggleLineupReady} disabled={!lineupComplete && !isReady}
                style={{
                  backgroundColor: isReady ? THEME.accentGold : lineupComplete ? '#FFFFFF' : '#1F2433',
                  color: isReady ? '#000' : lineupComplete ? '#000' : THEME.textMuted,
                  border: 'none', padding: '20px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, 
                  cursor: (!lineupComplete && !isReady) ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                {isReady ? 'ROSTER VERROUILLÉ ✓' : lineupComplete ? 'VALIDER LE ROSTER' : 'ROSTER INCOMPLET'}
              </button>
            </div>
          </div>
        )}

        {/* ONGLET 2 : CALENDRIER & COMPÉTITIONS (Le nouveau SeasonRoadmap élégant) */}
        {activeTab === 'circuit' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '32px', margin: '0 0 10px 0', color: '#FFF' }}>
                FEUILLE DE ROUTE OFFICIELLE
              </h2>
              <p style={{ color: THEME.textMuted, fontSize: '15px' }}>
                Le calendrier des tournois majeurs de la saison. Préparez votre roster pour chaque échéance.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {EVENTS.map((tourney, index) => {
                const isActive = index === currentEventIndex;
                const isCompleted = index < currentEventIndex;
                const winner = state.history?.find(h => h.year === (state.year || 1) && h.eventId === tourney.id)?.winnerName;

                return (
                  <div 
                    key={tourney.id}
                    style={{
                      backgroundColor: THEME.bgPanel,
                      border: `1px solid ${isActive ? tourney.color : THEME.border}`,
                      borderRadius: '12px',
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      boxShadow: isActive ? `0 0 25px ${tourney.color}25` : 'none',
                      transform: isActive ? 'translateY(-4px)' : 'none',
                      transition: 'all 0.3s ease',
                      opacity: isCompleted ? 0.6 : (isActive ? 1 : 0.8),
                    }}
                  >
                    {/* Badge de statut */}
                    {isActive && (
                      <div style={{ position: 'absolute', top: '-12px', background: tourney.color, color: '#000', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' }}>
                        EN COURS
                      </div>
                    )}
                    {isCompleted && (
                      <div style={{ position: 'absolute', top: '-12px', background: '#4caf50', color: '#000', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' }}>
                        TERMINÉ
                      </div>
                    )}

                    {/* Logo du tournoi */}
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', width: '100%' }}>
                      <img 
                        src={tourney.logo} 
                        alt={tourney.shortName} 
                        style={{ maxHeight: '100%', maxWidth: '80px', objectFit: 'contain', filter: isActive ? `drop-shadow(0 0 8px ${tourney.color}60)` : 'none' }} 
                      />
                    </div>

                    <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: tourney.isMajor ? '22px' : '18px', margin: '0 0 8px 0', color: '#FFF', textAlign: 'center' }}>
                      {tourney.name}
                    </h3>

                    <div style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {tourney.format === 'gsl_to_single' ? 'Groupes GSL' : tourney.format === 'swiss_to_single' ? 'Ronde Suisse' : 'Double Élimination'}
                    </div>

                    {/* Vainqueur ou Statut */}
                    <div style={{ marginTop: 'auto', width: '100%', textAlign: 'center', paddingTop: '16px', borderTop: `1px solid ${THEME.border}` }}>
                      {winner ? (
                        <div style={{ fontSize: '12px', color: THEME.accentGold, fontWeight: 600 }}>
                          🏆 Vainqueur : {winner}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: isActive ? tourney.color : THEME.textMuted, fontWeight: 500 }}>
                          {isActive ? 'Compétition active' : 'À venir'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ONGLET 3 : CLASSEMENT */}
        {activeTab === 'halloffame' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', animation: 'fadeIn 0.3s' }}>
            
            <div style={{ backgroundColor: THEME.bgPanel, borderRadius: '8px', padding: '32px', border: `1px solid ${THEME.border}` }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', margin: '0 0 24px 0', fontSize: '22px', letterSpacing: '0.5px' }}>
                CLASSEMENT DE LA SAISON
              </h2>
              {sortedLeaderboard.map((p, i) => (
                <div key={p.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', padding: '16px', 
                  backgroundColor: i === 0 ? 'rgba(212, 175, 55, 0.05)' : '#0C0E14', 
                  marginBottom: '8px', borderRadius: '6px', 
                  borderLeft: i === 0 ? `3px solid ${THEME.accentGold}` : '3px solid transparent' 
                }}>
                  <span style={{ color: i === 0 ? THEME.accentGold : '#FFF', fontWeight: i === 0 ? 600 : 400 }}>
                    <span style={{ color: THEME.textMuted, marginRight: '12px' }}>#{i+1}</span> 
                    {p.name}
                  </span>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {(state.seasonScores?.[p.id]?.titles || 0) > 0 && (
                      <span style={{ color: THEME.accentGold, fontSize: '14px' }}>🏆 x{state.seasonScores[p.id].titles}</span>
                    )}
                    <span style={{ color: '#FFF', fontWeight: 600 }}>{state.seasonScores?.[p.id]?.points || 0} PTS</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: THEME.bgPanel, borderRadius: '8px', padding: '32px', border: `1px solid ${THEME.border}` }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', margin: '0 0 24px 0', fontSize: '22px', letterSpacing: '0.5px' }}>
                ARCHIVES DES CHAMPIONS
              </h2>
              {state.history && state.history.length > 0 ? (
                state.history.map((h, i) => (
                  <div key={i} style={{ padding: '16px 0', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: THEME.textMuted, fontSize: '14px' }}>Saison {h.year} - {h.eventId.toUpperCase()}</span>
                    <span style={{ color: THEME.accentGold, fontWeight: 600 }}>{h.winnerName}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: THEME.textMuted, fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                  Aucun titre n'a encore été décerné.
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}