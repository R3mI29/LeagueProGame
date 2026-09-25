import { useState } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import { EVENTS } from '../constants/seasonConfig';
import CardIllustration from '../components/CardIllustration';

function getCard(id) {
  return CARD_POOL.find(c => c.id === id);
}

const THEME = {
  bgApp: '#080A10',        
  bgPanel: '#11141E',      
  border: '#222838',       
  accentGold: '#D4AF37',   
  accentSilver: '#C0C0C0', 
  accentBronze: '#CD7F32', 
  textMain: '#F0F2F5',     
  textMuted: '#768196',    
};

export default function CardsView({ state, setLineupCard, toggleLineupReady }) {
  const myId = socket.id;
  const [activeTab, setActiveTab] = useState('roster'); 
  const [activeRole, setActiveRole] = useState(ORDERED_ROLES[0]);

  const rawCollection = state.cardCollections?.[myId] || {};
  const myLineup = state.activeLineups?.[myId] || {};
  
  const myCollection = { ...rawCollection };
  const isReady = state.readyPlayers.includes(myId);
  const lineupComplete = ORDERED_ROLES.every(role => myLineup[role]);
  
  const ownedCardsForRole = (role) => CARD_POOL.filter(c => c.role === role && myCollection[c.id] !== undefined);

  const teamPower = ORDERED_ROLES.reduce((total, role) => {
    const card = getCard(myLineup[role]);
    return total + (card ? (card.overall || card.rating || 80) : 0);
  }, 0) / 5;

  const sortedLeaderboard = [...state.participants].sort((a, b) => {
    const ptsA = state.seasonScores?.[a.id]?.points || 0;
    const ptsB = state.seasonScores?.[b.id]?.points || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const titlesA = state.seasonScores?.[a.id]?.titles || 0;
    const titlesB = state.seasonScores?.[b.id]?.titles || 0;
    return titlesB - titlesA;
  });

  const currentEventIndex = state.eventIndex || 0;
  const myEconomy = state.economy?.[myId] || 0;
  const hasStarter = state.starterPackClaimed?.[myId];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: THEME.bgApp, color: THEME.textMain, fontFamily: "'Inter', sans-serif", padding: '40px 20px' }}>
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
              { id: 'shop', label: 'Boutique' },
              { id: 'sell', label: 'Revente' },
              { id: 'circuit', label: 'Compétitions' },
              { id: 'halloffame', label: 'Classement' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? THEME.accentGold : THEME.textMuted,
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `2px solid ${THEME.accentGold}` : '2px solid transparent',
                  padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '1px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ONGLET 1 : ROSTER */}
        {activeTab === 'roster' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', animation: 'fadeIn 0.3s' }}>
            
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
                        color: activeRole === role ? '#FFF' : THEME.textMuted, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'background-color 0.2s'
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
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textMuted, fontStyle: 'italic' }}>Aucun joueur disponible pour le poste de {activeRole}.</div>
                ) : (
                  ownedCardsForRole(activeRole).map(card => {
                    const selected = myLineup[activeRole] === card.id;
                    const contract = myCollection[card.id] || 0;
                    const isLifetime = contract === 'LIFETIME';
                    const isExpired = contract === 0;
                    
                    return (
                      <div key={card.id} 
                        onClick={() => !isExpired && setLineupCard(activeRole, card.id)} 
                        style={{ cursor: isExpired ? 'not-allowed' : 'pointer', transition: 'transform 0.2s ease', transform: selected ? 'translateY(-6px)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
                      >
                        <div style={{ 
                          padding: '4px', borderRadius: '12px', 
                          border: selected ? `2px solid ${THEME.accentGold}` : `2px solid transparent`, 
                          boxShadow: selected ? `0 12px 24px rgba(212, 175, 55, 0.15)` : 'none', 
                          backgroundColor: selected ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                          filter: isExpired ? 'grayscale(100%) opacity(50%)' : 'none'
                        }}>
                          <CardIllustration card={card} width={155} />
                        </div>
                        
                        <div style={{ 
                          background: isLifetime 
                            ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' 
                            : (isExpired ? 'linear-gradient(135deg, #ff3366 0%, #88001b 100%)' : 'rgba(8, 10, 16, 0.95)'), 
                          border: `1px solid ${isLifetime ? '#FFF' : (isExpired ? '#FFB3C6' : THEME.accentGold)}`, 
                          color: isLifetime || isExpired ? '#FFF' : THEME.accentGold, 
                          borderRadius: '20px', padding: '4px 12px', 
                          fontSize: '12px', fontWeight: 800, 
                          boxShadow: `0 4px 15px ${isLifetime ? 'rgba(212, 175, 55, 0.4)' : 'rgba(0,0,0,0.6)'}`,
                          display: 'flex', alignItems: 'center', gap: '6px',
                          letterSpacing: '0.5px'
                        }}>
                          {isLifetime ? '♾️ À VIE' : isExpired ? '⚠️ EXPIRÉ' : <><span style={{fontSize: '11px', opacity: 0.8}}>✍️</span> {contract} TRN</>}
                        </div>
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
                <div style={{ fontSize: '56px', fontFamily: "'Oswald', sans-serif", fontWeight: 600, color: teamPower > 0 ? THEME.accentGold : THEME.textMuted }}>{teamPower > 0 ? Math.round(teamPower) : '-'}</div>
              </div>

              {/* Raccourci vers la boutique */}
              <div style={{ backgroundColor: '#131621', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 16px 0', fontFamily: "'Oswald', sans-serif", color: '#FFF', fontSize: '18px', fontWeight: 500, letterSpacing: '0.5px' }}>TRÉSORERIE</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00e676', marginBottom: '20px' }}>
                  {myEconomy} 💲 CRÉDITS
                </div>
                <button onClick={() => setActiveTab('shop')} style={{ width: '100%', backgroundColor: THEME.accentGold, color: '#000', border: 'none', padding: '16px', borderRadius: '4px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  ALLER À LA BOUTIQUE
                </button>
              </div>

              <button onClick={toggleLineupReady} disabled={!lineupComplete && !isReady} style={{ backgroundColor: isReady ? THEME.accentGold : lineupComplete ? '#FFFFFF' : '#1F2433', color: isReady ? '#000' : lineupComplete ? '#000' : THEME.textMuted, border: 'none', padding: '20px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: (!lineupComplete && !isReady) ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isReady ? 'ROSTER VERROUILLÉ ✓' : lineupComplete ? 'VALIDER LE ROSTER' : 'ROSTER INCOMPLET'}
              </button>
            </div>
          </div>
        )}

        {/* ONGLET 2 : NOUVELLE BOUTIQUE */}
        {activeTab === 'shop' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '36px', margin: '0 0 10px 0', color: '#FFF' }}>
                BOUTIQUE DU CIRCUIT
              </h2>
              <p style={{ color: THEME.textMuted, fontSize: '16px' }}>
                Recrutez de nouveaux talents. Les packs supérieurs offrent de meilleures chances d'obtenir des joueurs d'élite.
              </p>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00e676', marginTop: '20px' }}>
                SOLDE : 💲 {myEconomy} CRÉDITS
              </div>
            </div>

            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
              
              {!hasStarter && (
                <div style={{ background: THEME.bgPanel, border: `2px solid #00e676`, borderRadius: '12px', padding: '30px', width: '300px', textAlign: 'center', boxShadow: '0 0 30px rgba(0,230,118,0.2)' }}>
                  <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎁</div>
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#00e676', fontSize: '24px', margin: '0 0 10px 0' }}>PACK DE DÉPART</h3>
                  <p style={{ color: THEME.textMuted, fontSize: '14px', marginBottom: '20px', minHeight: '60px' }}>Une base solide pour débuter votre saison. Contient 10 cartes de contrat À VIE.</p>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFF', marginBottom: '20px' }}>GRATUIT</div>
                  <button onClick={() => socket.emit('buy-pack', 'standard')} style={{ width: '100%', backgroundColor: '#00e676', color: '#000', border: 'none', padding: '14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                    OUVRIR
                  </button>
                </div>
              )}

              {hasStarter && (
                <>
                  {/* PACK STANDARD */}
                  <div style={{ background: THEME.bgPanel, border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '30px', width: '300px', textAlign: 'center', transition: 'transform 0.2s', cursor: 'default' }}>
                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>📦</div>
                    <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', fontSize: '24px', margin: '0 0 10px 0' }}>PACK STANDARD</h3>
                    <p style={{ color: THEME.textMuted, fontSize: '14px', marginBottom: '20px', minHeight: '60px' }}>Idéal pour commencer. Probabilités classiques (5 cartes).</p>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00e676', marginBottom: '20px' }}>100 💲</div>
                    <button 
                      onClick={() => socket.emit('buy-pack', 'standard')} 
                      disabled={myEconomy < 100}
                      style={{ width: '100%', backgroundColor: myEconomy >= 100 ? '#FFF' : '#333', color: myEconomy >= 100 ? '#000' : '#888', border: 'none', padding: '14px', borderRadius: '4px', fontWeight: 'bold', cursor: myEconomy >= 100 ? 'pointer' : 'not-allowed', fontSize: '16px' }}
                    >ACHETER</button>
                  </div>

                  {/* PACK ELITE */}
                  <div style={{ background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.1) 0%, #11141E 100%)', border: `1px solid #00e5ff`, borderRadius: '12px', padding: '30px', width: '300px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 229, 255, 0.1)' }}>
                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>💎</div>
                    <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#00e5ff', fontSize: '24px', margin: '0 0 10px 0' }}>PACK ÉLITE</h3>
                    <p style={{ color: THEME.textMuted, fontSize: '14px', marginBottom: '20px', minHeight: '60px' }}>Chances doublées d'obtenir des cartes Rares, Épiques, Légendaires et WANTED.</p>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00e676', marginBottom: '20px' }}>250 💲</div>
                    <button 
                      onClick={() => socket.emit('buy-pack', 'elite')} 
                      disabled={myEconomy < 200}
                      style={{ width: '100%', backgroundColor: myEconomy >= 200 ? '#00e5ff' : '#333', color: myEconomy >= 200 ? '#000' : '#888', border: 'none', padding: '14px', borderRadius: '4px', fontWeight: 'bold', cursor: myEconomy >= 200 ? 'pointer' : 'not-allowed', fontSize: '16px' }}
                    >ACHETER</button>
                  </div>

                  {/* PACK LEGENDE */}
                  <div style={{ background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, #11141E 100%)', border: `1px solid ${THEME.accentGold}`, borderRadius: '12px', padding: '30px', width: '300px', textAlign: 'center', boxShadow: '0 10px 30px rgba(212, 175, 55, 0.15)' }}>
                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>👑</div>
                    <h3 style={{ fontFamily: "'Oswald', sans-serif", color: THEME.accentGold, fontSize: '24px', margin: '0 0 10px 0' }}>PACK LÉGENDE</h3>
                    <p style={{ color: THEME.textMuted, fontSize: '14px', marginBottom: '20px', minHeight: '60px' }}>Chances multipliées par 5 pour les cartes de niveau Épique, Légendaire et WANTED.</p>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00e676', marginBottom: '20px' }}> 500 💲</div>
                    <button 
                      onClick={() => socket.emit('buy-pack', 'legendary')} 
                      disabled={myEconomy < 400}
                      style={{ width: '100%', backgroundColor: myEconomy >= 400 ? THEME.accentGold : '#333', color: myEconomy >= 400 ? '#000' : '#888', border: 'none', padding: '14px', borderRadius: '4px', fontWeight: 'bold', cursor: myEconomy >= 400 ? 'pointer' : 'not-allowed', fontSize: '16px' }}
                    >ACHETER</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 3 : REVENTE */}
        {activeTab === 'sell' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '36px', margin: '0 0 10px 0', color: '#FFF' }}>
                MARCHÉ DES TRANSFERTS
              </h2>
              <p style={{ color: THEME.textMuted, fontSize: '16px' }}>
                Revendez définitivement des joueurs qui ne figurent pas dans votre équipe titulaire pour récupérer des crédits.
              </p>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00e676', marginTop: '20px' }}>
                SOLDE : 💲 {myEconomy} CRÉDITS
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.keys(myCollection)
                // INTERDICTION COTE CLIENT DE VENDRE DES LIFETIME OU DES TITULAIRES
                .filter(cardId => myCollection[cardId] !== 0 && myCollection[cardId] !== 'LIFETIME' && !Object.values(myLineup).includes(cardId))
                .map(cardId => {
                  const card = getCard(cardId);
                  if (!card) return null;
                  
                  const contract = myCollection[cardId];
                  const isLifetime = contract === 'LIFETIME';
                  
                  let price = 10;
                  if (card.rarity === 'Rare') price = 25;
                  else if (card.rarity === 'Épique') price = 50;
                  else if (card.rarity === 'Légendaire' || card.rarity === 'WANTED') price = 100;

                  return (
                    <div key={cardId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: THEME.bgPanel, padding: '20px', borderRadius: '12px', border: `1px solid ${THEME.border}`, transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      <CardIllustration card={card} width={140} />
                      
                      <div style={{ fontSize: '12px', color: THEME.textMuted, fontWeight: 'bold', marginTop: '8px' }}>
                        {isLifetime ? '♾️ CONTRAT À VIE' : `CONTRAT: ${contract} TRN`}
                      </div>
                      
                      <button 
                        onClick={() => socket.emit('sell-card', cardId)}
                        style={{ 
                          width: '100%', backgroundColor: '#e63946', color: '#FFF', 
                          border: 'none', padding: '10px', borderRadius: '4px', 
                          fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#d62828'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#e63946'}
                      >
                        VENDRE LE JOUEUR ( 💲 {price} )
                      </button>
                    </div>
                  );
              })}
              
              {Object.keys(myCollection).filter(cardId => myCollection[cardId] !== 0 && myCollection[cardId] !== 'LIFETIME' && !Object.values(myLineup).includes(cardId)).length === 0 && (
                <div style={{ width: '100%', textAlign: 'center', color: THEME.textMuted, padding: '40px', fontStyle: 'italic', background: THEME.bgPanel, borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                  Aucun joueur disponible à la vente.<br/>
                  (Les joueurs de votre équipe titulaire et ceux sous contrat À VIE sont protégés et ne peuvent pas être vendus).
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 4 : CALENDRIER & COMPÉTITIONS */}
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
                const pastWinners = state.history?.filter(h => h.eventId === tourney.id) || [];
                const latestWinner = pastWinners[pastWinners.length - 1]?.winnerName;

                return (
                  <div 
                    key={tourney.id}
                    style={{
                      backgroundColor: THEME.bgPanel,
                      border: isActive ? `1px solid ${tourney.color}` : `1px solid ${THEME.border}`,
                      borderRadius: '12px', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
                      boxShadow: isActive ? `0 0 25px ${tourney.color}15` : 'none',
                      transform: isActive ? 'translateY(-4px)' : 'none', transition: 'all 0.3s ease',
                      opacity: isCompleted ? 0.7 : (isActive ? 1 : 0.8),
                    }}
                  >
                    {isActive && (
                      <div style={{ position: 'absolute', top: '-12px', background: tourney.color, color: '#000', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' }}>
                        EN COURS
                      </div>
                    )}
                    {isCompleted && (
                      <div style={{ position: 'absolute', top: '-12px', background: '#3B4154', color: '#FFF', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' }}>
                        TERMINÉ
                      </div>
                    )}

                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', width: '100%' }}>
                      <img src={tourney.logo} alt={tourney.shortName} style={{ maxHeight: '100%', maxWidth: '80px', objectFit: 'contain', filter: isActive ? `drop-shadow(0 0 8px ${tourney.color}40)` : 'grayscale(30%)' }} />
                    </div>

                    <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: tourney.isMajor ? '22px' : '18px', margin: '0 0 8px 0', color: '#FFF', textAlign: 'center' }}>
                      {tourney.name}
                    </h3>

                    <div style={{ fontSize: '12px', color: THEME.textMuted, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {tourney.format === 'gsl_to_single' ? 'Groupes GSL' : tourney.format === 'swiss_to_single' ? 'Ronde Suisse' : 'Double Élimination'}
                    </div>

                    <div style={{ marginTop: 'auto', width: '100%', textAlign: 'center', paddingTop: '16px', borderTop: `1px solid ${THEME.border}` }}>
                      {latestWinner ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: THEME.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>Dernier Vainqueur</span>
                          <span style={{ fontSize: '14px', color: THEME.accentGold, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>👑 {latestWinner}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: isActive ? tourney.color : THEME.textMuted, fontWeight: 500 }}>
                          {isActive ? 'Compétition en ligne' : 'Trophée vacant'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ONGLET 5 : LE PANTHÉON */}
        {activeTab === 'halloffame' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '32px', margin: '0 0 10px 0', color: '#FFF' }}>
                CLASSEMENT GLOBAL
              </h2>
              <p style={{ color: THEME.textMuted, fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
                Le classement mondial officiel basé sur les performances accumulées lors des compétitions du Circuit Pro. Seuls les plus grands laissent leur empreinte.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', marginBottom: '60px', height: '200px' }}>
              {/* TOP 2 */}
              {sortedLeaderboard[1] && (
                <div style={{ width: '220px', background: 'linear-gradient(180deg, rgba(192, 192, 192, 0.1) 0%, #11141E 100%)', borderTop: `4px solid ${THEME.accentSilver}`, borderRadius: '12px 12px 0 0', padding: '20px', textAlign: 'center', position: 'relative', height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', background: THEME.accentSilver, color: '#000', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', border: '4px solid #080A10' }}>2</div>
                  <h3 style={{ color: '#FFF', margin: '15px 0 5px 0', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sortedLeaderboard[1].name}</h3>
                  <span style={{ color: THEME.accentSilver, fontWeight: 'bold' }}>{state.seasonScores?.[sortedLeaderboard[1].id]?.points || 0} PTS</span>
                </div>
              )}

              {/* TOP 1 */}
              {sortedLeaderboard[0] && (
                <div style={{ width: '260px', background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, #11141E 100%)', borderTop: `6px solid ${THEME.accentGold}`, borderRadius: '12px 12px 0 0', padding: '30px 20px', textAlign: 'center', position: 'relative', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', boxShadow: '0 -10px 40px rgba(212, 175, 55, 0.15)' }}>
                  <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', fontSize: '40px', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))' }}>👑</div>
                  <h3 style={{ color: THEME.accentGold, margin: '5px 0 5px 0', fontSize: '24px', fontFamily: "'Oswald', sans-serif", letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sortedLeaderboard[0].name}</h3>
                  <span style={{ color: '#FFF', fontWeight: 'bold', fontSize: '18px' }}>{state.seasonScores?.[sortedLeaderboard[0].id]?.points || 0} PTS</span>
                  {(state.seasonScores?.[sortedLeaderboard[0].id]?.titles || 0) > 0 && <span style={{ fontSize: '12px', color: THEME.textMuted, marginTop: '10px' }}>{state.seasonScores[sortedLeaderboard[0].id].titles} Trophée(s)</span>}
                </div>
              )}

              {/* TOP 3 */}
              {sortedLeaderboard[2] && (
                <div style={{ width: '220px', background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.1) 0%, #11141E 100%)', borderTop: `4px solid ${THEME.accentBronze}`, borderRadius: '12px 12px 0 0', padding: '20px', textAlign: 'center', position: 'relative', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', background: THEME.accentBronze, color: '#000', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', border: '4px solid #080A10' }}>3</div>
                  <h3 style={{ color: '#FFF', margin: '15px 0 5px 0', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sortedLeaderboard[2].name}</h3>
                  <span style={{ color: THEME.accentBronze, fontWeight: 'bold' }}>{state.seasonScores?.[sortedLeaderboard[2].id]?.points || 0} PTS</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div style={{ backgroundColor: THEME.bgPanel, borderRadius: '8px', padding: '32px', border: `1px solid ${THEME.border}` }}>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', margin: '0 0 20px 0', fontSize: '20px', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '16px' }}>CHALLENGERS (TOP 4 - 16)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sortedLeaderboard.slice(3, 16).map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#0C0E14', borderRadius: '6px' }}>
                      <span style={{ color: '#EAEAEA' }}>
                        <span style={{ color: THEME.textMuted, marginRight: '16px', display: 'inline-block', width: '20px' }}>#{i + 4}</span> 
                        {p.name}
                      </span>
                      <span style={{ color: '#FFF', fontWeight: 600 }}>{state.seasonScores?.[p.id]?.points || 0} PTS</span>
                    </div>
                  ))}
                  {sortedLeaderboard.length <= 3 && <div style={{ color: THEME.textMuted, fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>En attente de plus d'équipes.</div>}
                </div>
              </div>

              <div style={{ backgroundColor: THEME.bgPanel, borderRadius: '8px', padding: '32px', border: `1px solid ${THEME.border}` }}>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', margin: '0 0 20px 0', fontSize: '20px', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '16px' }}>LIVRE DES ARCHIVES</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {state.history && state.history.length > 0 ? (
                    state.history.map((h, i) => {
                      const eventDetails = EVENTS.find(e => e.id === h.eventId);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                          <img src={eventDetails?.logo} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: THEME.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>Année {h.year} - {eventDetails?.name || h.eventId}</div>
                            <div style={{ color: THEME.accentGold, fontWeight: 700, fontSize: '16px' }}>{h.winnerName}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: THEME.textMuted, fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
                      L'histoire reste à écrire. Remportez le prochain tournoi pour marquer votre nom ici.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}