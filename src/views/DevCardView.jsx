import { useState } from 'react';
import { socket } from '../api/socket';
import { CARD_POOL } from '../constants/cardPlayers';
import { ORDERED_ROLES } from '../constants/roles';
import { EVENTS } from '../constants/seasonConfig';
import CardIllustration from '../components/CardIllustration';

const RARITY_ORDER = { 'Commune': 1, 'Rare': 2, 'Épique': 3, 'Légendaire': 4, 'WANTED': 5 };

export default function DevCardsView({ onClose, state }) {
  const [filterRole, setFilterRole] = useState('Tous');

  const displayedCards = CARD_POOL
    .filter(c => filterRole === 'Tous' || c.role === filterRole)
    .sort((a, b) => (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0));

  // Actions d'administration
  const handleGiveCard = (cardId) => {
    socket.emit('dev-give-card', cardId);
  };

  const handleSetEvent = (idx) => {
    socket.emit('dev-set-event', idx);
  };

  const handleGiveMoney = () => {
    socket.emit('dev-give-money', 1000);
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(8, 9, 13, 0.95)', backdropFilter: 'blur(10px)',
      zIndex: 10000, display: 'flex', flexDirection: 'column',
      padding: '20px', fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        <div style={{ flexShrink: 0, paddingBottom: '20px', borderBottom: '1px solid #1B2333', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 className="title-font text-pink" style={{ fontSize: '32px', margin: 0 }}>
                PANEL DÉVELOPPEUR ⚙️
              </h1>
              <p className="text-muted" style={{ margin: '5px 0 0 0', letterSpacing: '1px' }}>
                TRICHE ET OUTILS DE TEST
              </p>
            </div>
            <button className="btn btn-outline" onClick={onClose} style={{ borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}>
              FERMER LE MODE DEV
            </button>
          </div>

          {/* ZONE DE CONTRÔLES ADMINISTRATIFS (Grille pour un affichage propre) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            {/* CONTRÔLE DU CIRCUIT */}
            <div style={{ background: '#0C0E14', padding: '16px', borderRadius: '8px', border: '1px solid #ff336640' }}>
              <h3 className="title-font" style={{ color: '#FFF', margin: '0 0 12px 0', fontSize: '18px' }}>FORCER LE PROCHAIN TOURNOI</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {EVENTS.map((ev, idx) => (
                  <button 
                    key={ev.id} 
                    onClick={() => handleSetEvent(idx)}
                    style={{
                      background: state?.eventIndex === idx ? '#ff3366' : 'transparent',
                      color: state?.eventIndex === idx ? '#FFF' : '#768196',
                      border: `1px solid ${state?.eventIndex === idx ? '#ff3366' : '#222838'}`,
                      padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold', letterSpacing: '1px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {ev.shortName} {state?.eventIndex === idx && ' (ACTIF)'}
                  </button>
                ))}
              </div>
            </div>

            {/* TRICHE ÉCONOMIQUE */}
            <div style={{ background: '#0C0E14', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.25)' }}>
              <h3 className="title-font" style={{ color: '#FFF', margin: '0 0 12px 0', fontSize: '18px' }}>RESSOURCES</h3>
              <button 
                onClick={handleGiveMoney}
                style={{
                  backgroundColor: '#FFD700', 
                  color: '#000', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px',
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '1px',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              >
                💰 +1000 CRÉDITS
              </button>
            </div>

          </div>

          {/* FILTRES DES CARTES */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className={`btn ${filterRole === 'Tous' ? 'btn-pink' : 'btn-outline'}`} onClick={() => setFilterRole('Tous')} style={{ padding: '8px 16px', fontSize: '13px' }}>
              TOUTES LES CARTES
            </button>
            {ORDERED_ROLES.map(role => (
              <button key={role} className={`btn ${filterRole === role ? 'btn-pink' : 'btn-outline'}`} onClick={() => setFilterRole(role)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Zone de cartes cliquables */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', alignItems: 'flex-start', paddingBottom: '40px' }}>
            {displayedCards.map(card => {
              const myId = socket.id;
              const ownedContract = state?.cardCollections?.[myId]?.[card.id];
              const isLifetime = ownedContract === 'LIFETIME';
              const contractCount = typeof ownedContract === 'number' ? ownedContract : 0;

              return (
                <div 
                  key={card.id} 
                  onClick={() => handleGiveCard(card.id)}
                  style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    width: '160px', background: '#0D1219', padding: '12px 10px',
                    borderRadius: '8px', border: '1px solid #1B2333',
                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff3366'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1B2333'; e.currentTarget.style.transform = 'none'; }}
                >
                  {/* Badge du contrat (À vie ou nb tournois) */}
                  {(contractCount > 0 || isLifetime) && (
                    <div style={{ 
                      position: 'absolute', top: '-10px', right: '-10px', 
                      background: isLifetime ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : '#ff3366', 
                      color: isLifetime ? '#000' : '#FFF', 
                      fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', zIndex: 10, fontSize: '12px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                    }}>
                      {isLifetime ? '♾️' : `x${contractCount}`}
                    </div>
                  )}

                  <CardIllustration card={card} width={140} />
                  
                  <div style={{ marginTop: '14px', textAlign: 'center' }}>
                    <span className="title-font text-cyan" style={{ fontSize: '14px', display: 'block', fontWeight: 'bold' }}>{card.id}</span>
                    <span className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>{card.rarity}</span>
                    <span style={{ fontSize: '10px', color: '#ff3366', display: 'block', marginTop: '8px', letterSpacing: '1px' }}>CLIQUEZ POUR OBTENIR</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}