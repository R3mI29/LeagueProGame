import React, { useState } from 'react';
import { CARD_POOL } from '../constants/cardPlayers'; 
import CardIllustration from './CardIllustration';

export default function PackOpener({ cardIds, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const showSummary = currentIndex >= cardIds.length;

  if (!cardIds || cardIds.length === 0 || isClosing) return null;

  const handleNext = () => {
    if (!showSummary) setCurrentIndex(currentIndex + 1); 
  };

  const handleClose = () => {
    setIsClosing(true); 
    onClose(); 
  };

  return (
    <div
      onClick={showSummary ? undefined : handleNext}
      className={`fixed inset-0 bg-[#08090d]/95 z-[10000] flex flex-col items-center justify-center font-sans ${showSummary ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <style>{`
        @keyframes popIn { 0% { transform: scale(0.6) translateY(40px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {showSummary ? (
        <div className="flex flex-col items-center animate-[fadeIn_0.4s]">
          <div className="text-[26px] text-[#FFB020] mb-10 font-rajdhani font-bold tracking-[2px]">
            RÉCAPITULATIF DU PACK
          </div>
          
          <div className="flex gap-5 flex-wrap justify-center max-w-[1000px]">
            {cardIds.map((item, index) => {
              const id = item.id || item;
              const contract = item.contractAdded || '1';
              const c = CARD_POOL.find(card => card.id === id);
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center gap-2.5"
                  style={{ animation: `popIn 0.4s ${index * 0.1}s both` }}
                >
                  {c && <CardIllustration card={c} width={130} />}
                  
                  <div 
                    className="px-2.5 py-1 rounded-xl font-rajdhani font-bold text-[11px] shadow-[0_4px_8px_rgba(0,0,0,0.8)] whitespace-nowrap"
                    style={{
                      background: contract === 'LIFETIME' ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : '#11141E',
                      border: `1px solid ${contract === 'LIFETIME' ? '#FFF' : '#D4AF37'}`,
                      color: contract === 'LIFETIME' ? '#000' : '#D4AF37'
                    }}
                  >
                    {contract === 'LIFETIME' ? '♾️ À VIE' : `+${contract} TRN`}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleClose}
            className="mt-[60px] bg-[#4CE0D2] text-[#0A0E14] border-none py-3.5 px-7 rounded text-[15px] font-bold cursor-pointer font-rajdhani tracking-wider transition-transform active:scale-95 shadow-[0_4px_15px_rgba(76,224,210,0.3)]"
          >
            AJOUTER À LA COLLECTION
          </button>
        </div>
      ) : (
        <>
          <div className="text-lg text-[#4CE0D2] mb-6 font-rajdhani tracking-[2px] font-bold">
            CARTE {currentIndex + 1} SUR {cardIds.length}
          </div>

          <div key={currentIndex} className="animate-[popIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
            {(() => {
              const currentItem = cardIds[currentIndex];
              const currentCardId = currentItem.id || currentItem;
              const currentContract = currentItem.contractAdded || '1';
              const currentCard = CARD_POOL.find(c => c.id === currentCardId);
              
              return currentCard ? (
                <div className="flex flex-col items-center gap-5">
                  <CardIllustration card={currentCard} width={200} />
                  
                  <div 
                    className="px-4 py-1.5 rounded-full font-rajdhani font-bold text-[15px] shadow-[0_10px_20px_rgba(0,0,0,0.8)] whitespace-nowrap tracking-wider"
                    style={{
                      background: currentContract === 'LIFETIME' ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : '#11141E',
                      border: `2px solid ${currentContract === 'LIFETIME' ? '#FFF' : '#D4AF37'}`,
                      color: currentContract === 'LIFETIME' ? '#000' : '#D4AF37'
                    }}
                  >
                    {currentContract === 'LIFETIME' ? '♾️ CONTRAT À VIE' : `+ ${currentContract} TOURNOIS`}
                  </div>
                </div>
              ) : (
                <div className="text-white">Carte introuvable</div>
              );
            })()}
          </div>

          <div className="mt-[50px] text-[#8892A6] text-[13px] animate-pulse-fast tracking-wider">
            Cliquez n'importe où pour continuer...
          </div>
        </>
      )}
    </div>
  );
}