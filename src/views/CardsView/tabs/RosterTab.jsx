import React, { useState } from 'react';
import { ORDERED_ROLES } from '../../../constants/roles';
import { CARD_POOL } from '../../../constants/cardPlayers';
import CardIllustration from '../../../components/CardIllustration';
import SynergyGauges from '../../../components/SynergyGauges';
import { computeSynergy } from '../../../constants/synergy';

const CATCHUP_VALUES = {
  'N/A': 100,
  'TOP8': 50,
  'TOP4': 25,
  'TOP2': 0,
  'TOP1': 0
};

export default function RosterTab({ 
  state, 
  myId, 
  isReady, 
  myLineup, 
  myCollection, 
  myEconomy, 
  getDynamicCard, 
  setActiveTab, 
  setLineupCard, 
  toggleLineupReady, 
  lineupComplete, 
  teamPower,
}) {
  const [activeRole, setActiveRole] = useState(ORDERED_ROLES[0]);

  const ownedCardsForRole = (role) => CARD_POOL.filter(c => c.role === role && myCollection[c.id] !== undefined);
  const synergy = computeSynergy(ORDERED_ROLES.map(r => myLineup[r]).filter(Boolean));

  // Récupération sécurisée de l'historique des 4 derniers tournois
  const myHistory = state?.recentPlacements?.[myId] || [];
  const currentCatchupBonus = myHistory.reduce((total, res) => total + (CATCHUP_VALUES[res] || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 animate-[fadeIn_0.3s]">
        {/* Zone Principale : Alignement Titulaire et Cartes */}
        <div className="bg-[#11141E] border border-[#222838] rounded-xl p-4 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-rajdhani font-bold m-0 text-white text-[24px] tracking-[0.5px]">ALIGNEMENT TITULAIRE</h2>
              <div className="text-xs text-text-faint uppercase tracking-wider mt-0.5">Cliquez sur un rôle pour lui assigner un joueur</div>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-[#1A2030] text-[#D4AF37] border border-[#D4AF37]/30">
              {ORDERED_ROLES.filter(r => myLineup[r]).length} / 5 assignés
            </div>
          </div>
          
          {/* Barre des 5 Titulaires */}
          <div className="flex gap-2 sm:gap-2.5 mb-6 sm:mb-8 overflow-x-auto sm:overflow-visible pb-2 justify-start sm:justify-center sm:grid sm:grid-cols-5 justify-items-center no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {ORDERED_ROLES.map(role => {
              const selectedCard = getDynamicCard(myLineup[role]);
              const isRoleActive = activeRole === role;

              return (
                <div
                  key={role}
                  onClick={() => !isReady && setActiveRole(role)}
                  className={`flex flex-col items-center cursor-pointer transition-all duration-200 select-none shrink-0 ${
                    isRoleActive ? '-translate-y-1.5' : 'hover:-translate-y-0.5'
                  }`}
                >
                  {selectedCard ? (
                    <div className={`p-1 rounded-xl transition-all ${
                      isRoleActive 
                        ? 'border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-[#D4AF37]/5' 
                        : 'border-2 border-transparent'
                    }`}>
                      <CardIllustration card={selectedCard} width={128} />
                    </div>
                  ) : (
                    <div
                      className={`rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
                        isRoleActive
                          ? 'border-2 border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                          : 'border border-dashed border-[#242C3D] bg-[#0A0D15] hover:border-[#36425C]'
                      }`}
                      style={{ width: '136px', height: `${128 * 1.4 + 8}px` }}
                    >
                      <span className={`font-rajdhani font-black text-lg tracking-[2px] uppercase ${
                        isRoleActive ? 'text-[#D4AF37]' : 'text-[#5A657C]'
                      }`}>
                        {role}
                      </span>
                      <span className="text-[10px] font-semibold tracking-[1.5px] text-[#3D4758] uppercase">
                        VACANT
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* En-tête de la réserve */}
          <div className="flex justify-between items-center mb-4 pt-4 border-t border-[#1F2537]">
            <div className="flex items-center gap-2.5">
              <h3 className="font-rajdhani font-bold text-white text-[18px] tracking-[0.5px] m-0">
                CARTES DISPONIBLES
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 uppercase font-rajdhani">
                POSTE : {activeRole}
              </span>
            </div>
            <div className="text-xs text-text-faint">
              {ownedCardsForRole(activeRole).length} carte{ownedCardsForRole(activeRole).length > 1 ? 's' : ''} — Cliquez pour titulariser
            </div>
          </div>

          {/* Grille des cartes possédées pour le rôle sélectionné */}
          <div className="flex gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start min-h-[220px] sm:min-h-[280px]">
            {ownedCardsForRole(activeRole).length === 0 ? (
              <div className="w-full py-12 flex flex-col items-center justify-center text-text-faint gap-3 bg-[#0A0D15]/50 rounded-xl border border-dashed border-white/5">
                <span className="text-3xl opacity-30">📭</span>
                <span className="italic text-sm">Aucun joueur disponible pour le poste de {activeRole}.</span>
                <button
                  onClick={() => !isReady && setActiveTab('shop')}
                  disabled={isReady}
                  className="mt-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black transition-colors cursor-pointer"
                >
                  Acheter un Pack en Boutique
                </button>
              </div>
            ) : (
              ownedCardsForRole(activeRole).map(baseCard => {
                const card = getDynamicCard(baseCard.id); 
                const selected = myLineup[activeRole] === card.id;
                const contract = myCollection[card.id] || 0;
                const isLifetime = contract === 'LIFETIME';
                const isExpired = contract === 0;
                
                return (
                  <div 
                    key={card.id} 
                    className={`flex flex-col items-center gap-2 transition-transform duration-200 relative ${selected ? '-translate-y-[6px]' : ''}`}
                  >
                    <div 
                      onClick={() => (!isExpired && !isReady) && setLineupCard(activeRole, card.id)} 
                      className={`p-1 rounded-xl transition-all ${(isExpired || isReady) ? 'cursor-not-allowed' : 'cursor-pointer'} ${selected ? 'border-2 border-[#D4AF37] shadow-[0_12px_24px_rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.05)]' : 'border-2 border-transparent'} ${isExpired ? 'grayscale opacity-50' : ''}`}
                    >
                      <CardIllustration card={card} width={150} />
                    </div>
                    
                    <div 
                      className="rounded-full px-3 py-1 text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-sm select-none"
                      style={{ 
                        background: isLifetime ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : (isExpired ? 'linear-gradient(135deg, #ff3366 0%, #88001b 100%)' : 'rgba(8, 10, 16, 0.95)'), 
                        border: `1px solid ${isLifetime ? '#FFF' : (isExpired ? '#FFB3C6' : '#D4AF37')}`, 
                        color: isLifetime || isExpired ? '#FFF' : '#D4AF37', 
                      }}
                    >
                      {isLifetime ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.98l-2.83-2.83A5.32 5.32 0 0 0 5.4 6.62C2.42 6.62 0 9.04 0 12.02s2.42 5.4 5.4 5.4c1.44 0 2.8-.56 3.77-1.53L12 13.06l2.83 2.83c.97.97 2.33 1.53 3.77 1.53 2.98 0 5.4-2.42 5.4-5.4s-2.42-5.4-5.4-5.4zm-13.2 8.8c-1.87 0-3.4-1.53-3.4-3.4s1.53-3.4 3.4-3.4c.91 0 1.77.35 2.41.99l2.45 2.41-2.45 2.41c-.64.64-1.5.99-2.41.99zm13.2 0c-.91 0-1.77-.35-2.41-.99l-2.45-2.41 2.45-2.41c.64-.64 1.5-.99 2.41-.99 1.87 0 3.4 1.53 3.4 3.4s-1.53 3.4-3.4 3.4z"/>
                          </svg>
                          <span>À VIE</span>
                        </span>
                      ) : isExpired ? 'EXPIRÉ' : <>{contract} TRN</>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Barre Latérale : Statistiques et Trésorerie */}
        <div className="flex flex-col gap-5">
          <div className="bg-[#11141E] border border-[#222838] rounded-xl p-6 text-center">
            <div className="text-[11px] text-text-faint tracking-[2px] uppercase mb-1">Moyenne d'Équipe</div>
            <div className={`text-[52px] font-rajdhani font-bold leading-tight ${teamPower > 0 ? 'text-[#D4AF37]' : 'text-text-faint'}`}>
              {teamPower > 0 ? Math.round(teamPower) : '-'}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              {synergy.bonus > 0 && (
                <span className="text-xs font-bold text-[#00e676]">+{synergy.bonus} synergie</span>
              )}
            </div>
          </div>

          <SynergyGauges synergy={synergy} />

          <div className="bg-[#131621] border border-[#222838] rounded-xl p-5 text-center">
            <h3 className="m-0 mb-3 font-rajdhani font-bold text-white text-[16px] tracking-[0.5px]">TRÉSORERIE</h3>
            <div className="text-[22px] font-bold text-[#00e676] mb-4">
              {myEconomy} 💲 CRÉDITS
            </div>

            {/* Historique des 4 derniers tournois */}
            <div className="mb-4 bg-[#0C0E14] p-3 rounded-lg border border-[#1F2433]">
              <div className="text-[10px] text-text-faint uppercase tracking-[1px] mb-2">
                4 Derniers Tournois (Rattrapage)
              </div>
              <div className="flex justify-center gap-2 mb-2">
                {[0, 1, 2, 3].map(idx => {
                  const res = myHistory[idx] || '-';
                  const isNA = res === 'N/A';
                  return (
                    <span 
                      key={idx} 
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isNA ? 'bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366]/40' 
                        : res === '-' ? 'bg-[#1A1E2C] text-text-faint' 
                        : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                      }`}
                    >
                      {res}
                    </span>
                  );
                })}
              </div>
              <div className="text-[11px] text-text-faint">
                Bonus actuel : <span className="text-[#00e676] font-bold">+{currentCatchupBonus} 💲</span>
              </div>
            </div>

            <button 
              onClick={() => !isReady && setActiveTab('shop')} 
              disabled={isReady}
              className={`w-full border-none p-3.5 rounded-lg text-xs font-bold uppercase tracking-wider ${isReady ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#D4AF37] text-black cursor-pointer hover:brightness-105'}`}
            >
              Aller à la Boutique
            </button>
          </div>

          <button 
            onClick={toggleLineupReady} 
            disabled={!lineupComplete && !isReady} 
            className={`border-none p-4 rounded-xl text-sm font-bold transition-all uppercase tracking-[1px] ${(!lineupComplete && !isReady) ? 'cursor-not-allowed' : 'cursor-pointer'} ${isReady ? 'bg-[#D4AF37] text-black' : lineupComplete ? 'bg-white text-black hover:bg-gray-100' : 'bg-[#1F2433] text-text-faint'}`}
          >
            {isReady ? 'ROSTER VERROUILLÉ ✓' : lineupComplete ? 'VALIDER LE ROSTER' : 'ROSTER INCOMPLET'}
          </button>
        </div>
      </div>
  );
}
