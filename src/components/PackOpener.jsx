import React, { useState } from 'react';
import { CARD_POOL } from '../constants/cardPlayers'; 
import CardIllustration from './CardIllustration';

export default function PackOpener({ cardIds, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Si on a passé la dernière carte, on affiche le récapitulatif
  const showSummary = currentIndex >= cardIds.length;

  if (!cardIds || cardIds.length === 0 || isClosing) return null;

  const handleNext = () => {
    if (!showSummary) {
      setCurrentIndex(currentIndex + 1); 
    }
  };

  const handleClose = () => {
    setIsClosing(true); 
    onClose(); 
  };

  return (
    <div
      onClick={showSummary ? undefined : handleNext}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(8, 9, 13, 0.95)', 
        zIndex: 10000, 
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: showSummary ? 'default' : 'pointer',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {showSummary ? (
        /* --- ÉCRAN DE RÉCAPITULATIF --- */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.4s' }}>
          <div style={{ 
            fontSize: '26px', color: '#FFB020', marginBottom: '40px', 
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold', letterSpacing: '2px' 
          }}>
            RÉCAPITULATIF DU PACK
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '900px' }}>
            {cardIds.map((id, index) => {
              const c = CARD_POOL.find(card => card.id === id);
              return (
                <div key={index} style={{ animation: `popIn 0.4s ${index * 0.1}s both` }}>
                  {/* Cartes en petit pour le récapitulatif */}
                  {c && <CardIllustration card={c} width={130} />}
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleClose}
            style={{
              marginTop: '50px', background: '#4CE0D2', color: '#0A0E14',
              border: 'none', padding: '12px 24px', borderRadius: '4px',
              fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            AJOUTER À LA COLLECTION
          </button>
        </div>
      ) : (
        /* --- LECTURE CARTE PAR CARTE --- */
        <>
          <div style={{
            fontSize: '18px', color: '#4CE0D2', marginBottom: '24px',
            fontFamily: "'Rajdhani', sans-serif", letterSpacing: '2px',
            fontWeight: 'bold'
          }}>
            CARTE {currentIndex + 1} SUR {cardIds.length}
          </div>

          <div key={currentIndex} style={{ animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            {(() => {
              const currentCardId = cardIds[currentIndex];
              const currentCard = CARD_POOL.find(c => c.id === currentCardId);
              return currentCard ? (
                /* Taille réduite à 200 au lieu de 260 */
                <CardIllustration card={currentCard} width={200} />
              ) : (
                <div style={{ color: 'white' }}>Carte introuvable</div>
              );
            })()}
          </div>

          <div style={{
            marginTop: '40px', color: '#8892A6', fontSize: '13px',
            animation: 'pulse 2s infinite', letterSpacing: '1px'
          }}>
            Cliquez n'importe où pour continuer...
          </div>
        </>
      )}

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.6) translateY(40px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}