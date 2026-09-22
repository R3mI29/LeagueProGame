import { useState } from 'react';
import { CARD_POOL } from '../constants/cardPlayers';
import { ORDERED_ROLES } from '../constants/roles';
import CardIllustration from '../components/CardIllustration';

// Ordre de rareté pour le tri
const RARITY_ORDER = { 'Commune': 1, 'Rare': 2, 'Épique': 3, 'Légendaire': 4, 'WANTED': 5 };

export default function DevCardsView({ onClose }) {
  const [filterRole, setFilterRole] = useState('Tous');

  const displayedCards = CARD_POOL
    .filter(c => filterRole === 'Tous' || c.role === filterRole)
    .sort((a, b) => (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0));

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#08090D', // Fond opaque pour cacher le jeu en dessous
      zIndex: 10000,
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px', 
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* En-tête et Filtres FIXES en haut */}
        <div style={{ flexShrink: 0, paddingBottom: '20px', borderBottom: '1px solid #1B2333', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 className="title-font text-pink" style={{ fontSize: '32px', margin: 0 }}>
                DATABASE CARTES
              </h1>
              <p className="text-muted" style={{ margin: '5px 0 0 0', letterSpacing: '1px' }}>
                {displayedCards.length} CARTES AFFICHÉES (SUR {CARD_POOL.length})
              </p>
            </div>
            <button className="btn btn-outline" onClick={onClose} style={{ borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}>
              FERMER LE MODE DEV
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${filterRole === 'Tous' ? 'btn-pink' : 'btn-outline'}`}
              onClick={() => setFilterRole('Tous')}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              TOUS LES RÔLES
            </button>
            {ORDERED_ROLES.map(role => (
              <button
                key={role}
                className={`btn ${filterRole === role ? 'btn-pink' : 'btn-outline'}`}
                onClick={() => setFilterRole(role)}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Zone de cartes DÉFILANTE (Scroll) */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', // Permet le défilement vertical ici seulement
          paddingRight: '10px'
        }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', // Force les cartes à aller à la ligne proprement
            gap: '24px', 
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingBottom: '40px'
          }}>
            {displayedCards.map(card => (
              <div key={card.id} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                width: '160px', // Largeur fixe stricte pour éviter l'empilement
                background: '#0D1219',
                padding: '12px 10px',
                borderRadius: '8px',
                border: '1px solid #1B2333'
              }}>
                <CardIllustration card={card} width={140} />
                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <span className="title-font text-cyan" style={{ fontSize: '14px', display: 'block', fontWeight: 'bold' }}>{card.id}</span>
                  <span className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>{card.rarity}</span>
                </div>
              </div>
            ))}
          </div>
          
          {displayedCards.length === 0 && (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: '50px' }}>
              Aucune carte trouvée pour cette sélection.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}