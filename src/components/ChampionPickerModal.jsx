import React, { useEffect } from 'react';
import { getPlayerChampionPool } from '../constants/playerChampionPools';
import { isMetaChampion } from '../constants/metaConfig';
import ChampionTierList from './ChampionTierList';

export default function ChampionPickerModal({
  isOpen,
  onClose,
  card,
  role,
  currentChampionId,
  onSelectChampion,
  yearlyMeta,
  championMasteryState = {},
  mode = 'prelock',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  const pool = getPlayerChampionPool(card, championMasteryState);
  const targetRole = role || card.role || 'Mid';

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div 
        className="bg-[#0C0F17] border border-[#232B3E] rounded-2xl max-w-[680px] w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex justify-between items-start border-b border-[#1E2538] pb-4 mb-4">
          <div>
            <div className="text-[11px] font-bold text-accent-blue-light uppercase tracking-wider flex items-center gap-2">
              <span>{mode === 'prelock' ? '🎯 PRÉ-LOCK TOURNOI' : '⚔️ CHOIX DU CHAMPION DE COMBAT'}</span>
              <span>•</span>
              <span className="text-[#D4AF37]">{targetRole}</span>
            </div>
            <h2 className="text-2xl font-black text-white m-0 mt-1 font-rajdhani flex items-center gap-3">
              <span>{card.baseName || card.name}</span>
              <span className="text-sm font-normal text-text-faint font-sans">
                ({pool.length} champions maîtrisés)
              </span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#181F30] hover:bg-[#252E44] text-text-faint hover:text-white flex items-center justify-center text-sm transition-colors border border-border cursor-pointer"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Liste des champions que le joueur sait jouer */}
        <div className="flex-1 overflow-y-auto pr-1">
          <ChampionTierList
            card={card}
            championMasteryState={championMasteryState}
            yearlyMeta={yearlyMeta}
            selectedChampId={currentChampionId}
            hideEmptyTiers={false}
            onSelectChampion={(champId) => {
              onSelectChampion(champId);
              onClose();
            }}
          />
        </div>
        
      </div>
    </div>
  );
}
