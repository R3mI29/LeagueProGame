import React, { useEffect } from 'react';
import CardIllustration from './CardIllustration';
import { getCardTraits } from '../constants/cardTraits';
import ChampionTierList from './ChampionTierList';

export default function CardDetailModal({
  card,
  onClose,
  yearlyMeta,
  championMasteryState = {},
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!card) return null;

  const traits = getCardTraits(card);

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-[#0B0E17] border border-[#252E44] rounded-2xl max-w-[820px] w-full p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermeture */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#181F30] hover:bg-[#252E44] text-text-faint hover:text-white flex items-center justify-center text-sm transition-colors border border-border cursor-pointer z-10"
          aria-label="Fermer"
        >
          ✕
        </button>

        {/* PARTIE HAUTE : Carte à gauche + Identité & 4 Traits à droite */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Visuel carte */}
          <div className="shrink-0">
            <CardIllustration card={card} width={175} />
          </div>

          {/* Informations & Traits */}
          <div className="flex-1 min-w-0 w-full pr-6">
            <div className="border-b border-[#222B3F] pb-3 mb-4">
              <div className="text-[11px] font-bold text-accent-blue-light uppercase tracking-wider">
                {card.variant || 'Carte Joueur'}
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <h2 className="text-3xl font-black text-white m-0 truncate font-['Oswald'] tracking-wide">
                  {card.baseName || card.name}
                </h2>
                <span className="text-4xl font-extrabold text-[#D4AF37] font-['Oswald'] shrink-0">
                  {card.rating || card.overall || 80}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#1A2234] text-white border border-[#2E3C5D]">
                  {card.role}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#1A2234] text-[#D4AF37] border border-[#D4AF37]/30">
                  {card.league || 'LEAGUE'}
                </span>
                {card.teamTag && (
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#1A2234] text-text-muted border border-border">
                    {card.teamTag}
                  </span>
                )}
              </div>
            </div>

            {/* Grille des 4 Traits (2x2 sur grand écran pour aérer la hauteur) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121724] border border-[#222E46] text-xs">
                <span className="text-text-muted flex items-center gap-1.5">
                  <span>{traits.roleStyle?.icon || '⚔️'}</span>
                  <span>Rôle</span>
                </span>
                <span className="font-bold text-white truncate ml-2">{traits.roleStyle?.name}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121724] border border-[#222E46] text-xs">
                <span className="text-text-muted flex items-center gap-1.5">
                  <span>{traits.tacticalStyle?.icon || '🛡️'}</span>
                  <span>Style</span>
                </span>
                <span className="font-bold text-white truncate ml-2">{traits.tacticalStyle?.name}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121724] border border-[#222E46] text-xs">
                <span className="text-text-muted flex items-center gap-1.5">
                  <span>{traits.regionalStyle?.icon || '🌍'}</span>
                  <span>Région</span>
                </span>
                <span className="font-bold text-white truncate ml-2">{traits.regionalStyle?.name}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121724] border border-[#222E46] text-xs">
                <span className="text-text-muted flex items-center gap-1.5">
                  <span>{traits.draftTrait?.icon || '⚡'}</span>
                  <span>Trait</span>
                </span>
                <span className="font-bold text-white truncate ml-2">{traits.draftTrait?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PARTIE BASSE PLEINE LARGEUR : Tier List des Champions Maîtrisés */}
        <div className="pt-4 border-t border-[#1C2436] w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-5 rounded-full bg-[#D4AF37]" />
              <h3 className="font-['Oswald'] text-base font-bold text-white uppercase tracking-[1.5px] m-0">
                Tier List des Champions Maîtrisés — Poste {card.role}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 bg-[#121724] px-2.5 py-1 rounded-full border border-[#1E273B]">
              Évolue en Scrim & Tournoi
            </span>
          </div>

          <ChampionTierList
            card={card}
            championMasteryState={championMasteryState}
            yearlyMeta={yearlyMeta}
          />
        </div>
      </div>
    </div>
  );
}