import React, { useState } from 'react';
import { CARD_POOL } from '../constants/cardPlayers'; 
import CardIllustration from './CardIllustration';

export default function PackOpener({ cardIds, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

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
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px' }}>
            {cardIds.map((item, index) => {
              const id = item.id || item;
              const contract = item.contractAdded || '1';
              const c = CARD_POOL.find(card => card.id === id);
              
              return (
                // MODIFICATION ICI : Colonne flexible pour placer le badge sous la carte proprement
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', animation: `popIn 0.4s ${index * 0.1}s both` }}>
                  {c && <CardIllustration card={c} width={130} />}
                  
                  {/* MINI BADGE POUR LE RÉCAPITULATIF EN DESSOUS */}
                  <div style={{
                    background: contract === 'LIFETIME' ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : '#11141E',
                    border: `1px solid ${contract === 'LIFETIME' ? '#FFF' : '#D4AF37'}`,
                    color: contract === 'LIFETIME' ? '#000' : '#D4AF37',
                    padding: '4px 10px', borderRadius: '12px',
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold', fontSize: '11px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.8)', whiteSpace: 'nowrap'
                  }}>
                    {contract === 'LIFETIME' ? '♾️ À VIE' : `+${contract} TRN`}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleClose}
            style={{
              marginTop: '60px', background: '#4CE0D2', color: '#0A0E14',
              border: 'none', padding: '14px 28px', borderRadius: '4px',
              fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px',
              transition: 'transform 0.1s', boxShadow: '0 4px 15px rgba(76, 224, 210, 0.3)'
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
              const currentItem = cardIds[currentIndex];
              const currentCardId = currentItem.id || currentItem;
              const currentContract = currentItem.contractAdded || '1';
              const currentCard = CARD_POOL.find(c => c.id === currentCardId);
              
              return currentCard ? (
                // MODIFICATION ICI : Colonne flexible pour placer le grand badge sous la carte proprement
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <CardIllustration card={currentCard} width={200} />
                  
                  {/* GRAND BADGE SOUS LA CARTE ANIMÉE EN DESSOUS */}
                  <div style={{
                    background: currentContract === 'LIFETIME' ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : '#11141E',
                    border: `2px solid ${currentContract === 'LIFETIME' ? '#FFF' : '#D4AF37'}`,
                    color: currentContract === 'LIFETIME' ? '#000' : '#D4AF37',
                    padding: '6px 16px', borderRadius: '20px',
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold', fontSize: '15px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.8)', whiteSpace: 'nowrap',
                    letterSpacing: '1px'
                  }}>
                    {currentContract === 'LIFETIME' ? '♾️ CONTRAT À VIE' : `+ ${currentContract} TOURNOIS`}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'white' }}>Carte introuvable</div>
              );
            })()}
          </div>

          <div style={{
            marginTop: '50px', color: '#8892A6', fontSize: '13px',
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