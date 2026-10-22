import React from 'react';
import { getPlayerChampionPool } from '../constants/playerChampionPools';

const TIER_CONFIG = [
  {
    level: 5,
    tier: 'S',
    stubBg: 'bg-gradient-to-br from-[#FDE047] via-[#EAB308] to-[#A16207] text-black border-[#FEF08A]',
    rowBorder: 'border-[#EAB308]/40 bg-gradient-to-r from-[#EAB308]/10 via-[#0E121D] to-[#0A0D15]',
    chipBorder: 'border-[#EAB308]/50 hover:border-[#FDE047]',
  },
  {
    level: 4,
    tier: 'A',
    stubBg: 'bg-gradient-to-br from-[#C084FC] via-[#9333EA] to-[#581C87] text-white border-[#E9D5FF]',
    rowBorder: 'border-[#A855F7]/35 bg-gradient-to-r from-[#A855F7]/10 via-[#0E121D] to-[#0A0D15]',
    chipBorder: 'border-[#A855F7]/45 hover:border-[#C084FC]',
  },
  {
    level: 3,
    tier: 'B',
    stubBg: 'bg-gradient-to-br from-[#38BDF8] via-[#0284C7] to-[#075985] text-white border-[#BAE6FD]',
    rowBorder: 'border-[#38BDF8]/30 bg-gradient-to-r from-[#38BDF8]/10 via-[#0E121D] to-[#0A0D15]',
    chipBorder: 'border-[#38BDF8]/40 hover:border-[#7DD3FC]',
  },
  {
    level: 2,
    tier: 'C',
    stubBg: 'bg-gradient-to-br from-[#34D399] via-[#059669] to-[#065F46] text-black border-[#A7F3D0]',
    rowBorder: 'border-[#10B981]/25 bg-gradient-to-r from-[#10B981]/8 via-[#0E121D] to-[#0A0D15]',
    chipBorder: 'border-[#10B981]/30 hover:border-[#34D399]',
  },
  {
    level: 1,
    tier: 'D',
    stubBg: 'bg-gradient-to-br from-[#334155] to-[#1E293B] text-slate-200 border-slate-500/50',
    rowBorder: 'border-[#1E2638] bg-[#0A0D15]',
    chipBorder: 'border-[#242E42] hover:border-slate-400',
  },
];

export default function ChampionTierList({
  card,
  championMasteryState = {},
  selectedChampId = null,
  onSelectChampion = null,
  hideEmptyTiers = false,
}) {
  if (!card) return null;

  const pool = getPlayerChampionPool(card, championMasteryState);

  const tiersToRender = hideEmptyTiers
    ? TIER_CONFIG.filter(t => pool.some(entry => entry.mastery?.level === t.level))
    : TIER_CONFIG;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {tiersToRender.map((tierInfo) => {
        const champsInTier = pool.filter(entry => entry.mastery?.level === tierInfo.level);
        const isEmpty = champsInTier.length === 0;

        return (
          <div
            key={tierInfo.tier}
            className={`flex items-stretch rounded-xl border transition-all overflow-hidden ${tierInfo.rowBorder} ${
              isEmpty ? 'min-h-[48px] opacity-45' : 'min-h-[64px]'
            }`}
          >
            {/* Talon de Tier (Gauche) : uniquement la lettre dans son badge coloré */}
            <div className="w-14 sm:w-16 shrink-0 flex items-center justify-center border-r border-white/5 bg-black/40 select-none p-2">
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center font-rajdhani text-xl font-black shadow-md ${tierInfo.stubBg}`}
              >
                {tierInfo.tier}
              </div>
            </div>

            {/* Grille Horizontale des Champions : format iconique TierMaker */}
            <div className="flex-1 px-3 py-2 flex flex-wrap items-center gap-2">
              {isEmpty ? (
                <span className="text-[11px] text-slate-600 italic select-none">
                  — Aucun champion —
                </span>
              ) : (
                champsInTier.map(({ champId, champion }) => {
                  const isSelected = selectedChampId === champId;
                  const Tag = onSelectChampion ? 'button' : 'div';
                  const championName = champion?.name || champId;

                  return (
                    <Tag
                      key={champId}
                      type={onSelectChampion ? 'button' : undefined}
                      onClick={onSelectChampion ? () => onSelectChampion(champId) : undefined}
                      title={championName}
                      className={`group relative w-12 h-12 rounded-lg overflow-hidden border transition-all duration-200 select-none bg-[#070A10] ${
                        isSelected
                          ? 'ring-2 ring-[#D4AF37] border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.55)] scale-105 z-10'
                          : `${tierInfo.chipBorder} hover:scale-108 hover:z-20 hover:border-white/70 shadow-sm`
                      } ${onSelectChampion ? 'cursor-pointer active:scale-95' : ''}`}
                    >
                      {champion?.icon ? (
                        <img
                          src={champion.icon}
                          alt={championName}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-base">🛡️</div>
                      )}

                      {/* Badge doré de sélection active */}
                      {isSelected && (
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#D4AF37] text-black text-[9px] font-black flex items-center justify-center shadow-md border border-black/40">
                          ✓
                        </span>
                      )}
                    </Tag>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
