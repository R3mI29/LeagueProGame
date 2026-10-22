import React, { useState } from 'react';
import { socket } from '../../../api/socket';
import { ORDERED_ROLES } from '../../../constants/roles';
import { CARD_POOL } from '../../../constants/cardPlayers';
import CardIllustration from '../../../components/CardIllustration';
import SynergyGauges from '../../../components/SynergyGauges';
import CardDetailModal from '../../../components/CardDetailModal';
import ChampionPickerModal from '../../../components/ChampionPickerModal';
import { computeSynergy } from '../../../constants/synergy';
import { evaluateTeamMetaSynergy } from '../../../constants/metaConfig';
import { getChampionById } from '../../../constants/championsData';
import { getPlayerChampionPool } from '../../../constants/playerChampionPools';

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
  setPrelockedChampion
}) {
  const [activeRole, setActiveRole] = useState(ORDERED_ROLES[0]);
  const [inspectCard, setInspectCard] = useState(null);
  const [championModalRole, setChampionModalRole] = useState(null);

  const ownedCardsForRole = (role) => CARD_POOL.filter(c => c.role === role && myCollection[c.id] !== undefined);
  const synergy = computeSynergy(ORDERED_ROLES.map(r => myLineup[r]).filter(Boolean));

  const myKnowledge = state?.metaKnowledge?.[myId];
  const isMetaDiscovered = (myKnowledge?.points >= 100) || myKnowledge?.discoveredClues?.some(c => c.threshold === 100);
  const myCurrentRoster = ORDERED_ROLES.map(role => getDynamicCard(myLineup[role])).filter(Boolean);
  const metaSynergy = evaluateTeamMetaSynergy(myCurrentRoster, state?.yearlyMeta);

  // Récupération sécurisée de l'historique des 4 derniers tournois
  const myHistory = state?.recentPlacements?.[myId] || [];
  const currentCatchupBonus = myHistory.reduce((total, res) => total + (CATCHUP_VALUES[res] || 0), 0);

  return (
    <>
      {inspectCard && (
        <CardDetailModal 
          card={inspectCard} 
          onClose={() => setInspectCard(null)} 
          yearlyMeta={state?.yearlyMeta}
          championMasteryState={state?.championMastery}
          currentKnowledge={state?.metaKnowledge?.[myId]}
        />
      )}

      {championModalRole && myLineup[championModalRole] && (
        <ChampionPickerModal
          isOpen={true}
          onClose={() => setChampionModalRole(null)}
          card={getDynamicCard(myLineup[championModalRole])}
          role={championModalRole}
          currentChampionId={
            state.prelockedChampions?.[myId]?.[championModalRole] ||
            getPlayerChampionPool(getDynamicCard(myLineup[championModalRole]), state?.championMastery)?.[0]?.champId
          }
          onSelectChampion={(champId) => {
            if (setPrelockedChampion) {
              setPrelockedChampion(championModalRole, champId);
            } else {
              socket.emit('set-prelocked-champion', { role: championModalRole, champId });
            }
          }}
          yearlyMeta={state?.yearlyMeta}
          championMasteryState={state?.championMastery}
          mode="prelock"
        />
      )}

      <div className="grid grid-cols-[1fr_360px] gap-8 animate-[fadeIn_0.3s]">
        {/* Zone Principale : Draft et Cartes */}
        <div className="bg-[#11141E] border border-[#222838] rounded-xl p-7 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-rajdhani font-bold m-0 text-white text-[24px] tracking-[0.5px]">DRAFT D'ÉQUIPE</h2>
            <div className="text-xs text-text-faint uppercase tracking-wider">Sélectionnez vos 5 titulaires & pré-lockez vos champions</div>
          </div>
          
          {/* Barre de sélection des 5 Titulaires & Champions Pré-lockés */}
          <div className="grid grid-cols-5 gap-2 mb-7">
            {ORDERED_ROLES.map(role => {
              const selectedCard = getDynamicCard(myLineup[role]);
              const isRoleActive = activeRole === role;

              const pool = selectedCard ? getPlayerChampionPool(selectedCard, state?.championMastery) : [];
              const prelockedChampId = state.prelockedChampions?.[myId]?.[role] || pool[0]?.champId;
              const prelockedChamp = prelockedChampId ? getChampionById(prelockedChampId) : null;
              const poolEntry = pool.find(p => p.champId === prelockedChampId);
              const mastery = poolEntry?.mastery;

              // Couleurs de rareté pour la bordure de la carte
              const rarityBorder = selectedCard?.rarity === 'Légendaire' ? '#ffd700'
                : selectedCard?.rarity === 'Épique' ? '#99143a'
                : selectedCard?.rarity === 'Rare' ? '#007a8c'
                : selectedCard?.rarity === 'WANTED' ? '#ffffff'
                : '#2a3546';

              return (
                <div
                  key={role}
                  onClick={() => !isReady && setActiveRole(role)}
                  className={`relative rounded-xl overflow-hidden transition-all cursor-pointer flex flex-col group ${
                    isRoleActive
                      ? 'ring-2 ring-[#D4AF37] ring-offset-1 ring-offset-[#090B11]'
                      : 'hover:ring-1 hover:ring-white/20 hover:ring-offset-1 hover:ring-offset-[#090B11]'
                  }`}
                  style={{ minHeight: '200px' }}
                >
                  {/* === ZONE CARTE JOUEUR (art de la carte en fond plein) === */}
                  <div className="relative flex-1 overflow-hidden" style={{ minHeight: '140px' }}>
                    {selectedCard ? (
                      <>
                        {/* Art de la carte en background plein format */}
                        <div className="absolute inset-0 flex items-start justify-center overflow-hidden">
                          <CardIllustration card={selectedCard} width={120} />
                        </div>
                        {/* Overlay dégradé du bas pour lisibilité */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/60 to-transparent" />
                      </>
                    ) : (
                      /* Placeholder vide */
                      <div className="absolute inset-0 bg-[#090C15] flex items-center justify-center border-2 border-dashed border-white/8 rounded-t-xl">
                        <span className="text-slate-600 text-xs font-medium italic">Poste vacant</span>
                      </div>
                    )}

                    {/* Badge rôle (haut gauche) */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-[1.5px] uppercase font-rajdhani shadow-md ${
                        isRoleActive
                          ? 'bg-[#D4AF37] text-black'
                          : 'bg-black/70 text-slate-300 border border-white/15 backdrop-blur-sm'
                      }`}>
                        {role}
                      </span>
                    </div>

                    {/* Bouton inspect (haut droit) */}
                    {selectedCard && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setInspectCard(selectedCard); }}
                        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-black/60 hover:bg-[#D4AF37] text-slate-300 hover:text-black flex items-center justify-center text-[11px] transition-all border border-white/15 backdrop-blur-sm cursor-pointer"
                        title={`Inspecter ${selectedCard.baseName}`}
                      >
                        ⓘ
                      </button>
                    )}
                  </div>

                  {/* === ZONE INFO CHAMPION + JOUEUR (bas de la carte) === */}
                  <div
                    className="relative z-10 px-2 pt-1 pb-2 flex flex-col gap-1"
                    style={{
                      background: selectedCard
                        ? `linear-gradient(to bottom, #060913, #0D1020)`
                        : '#090C15',
                      borderTop: selectedCard ? `2px solid ${rarityBorder}40` : '2px solid transparent',
                    }}
                  >
                    {/* Champion info row */}
                    {prelockedChamp ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setChampionModalRole(role); }}
                        className="flex items-center gap-1.5 w-full group/champ rounded-md hover:bg-white/5 px-1 py-0.5 transition-all cursor-pointer"
                        title="Changer le champion"
                      >
                        <img
                          src={prelockedChamp.icon}
                          alt={prelockedChamp.name}
                          className="w-5 h-5 rounded object-cover border border-white/20 shrink-0"
                        />
                        <span className="font-rajdhani text-[12px] font-bold text-white truncate flex-1 leading-none">
                          {prelockedChamp.name}
                        </span>
                        {mastery && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded leading-none"
                            style={{ color: '#00E676', background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.25)' }}>
                            {mastery.tier}
                          </span>
                        )}
                        <span className="text-slate-500 group-hover/champ:text-[#D4AF37] text-[10px] shrink-0 transition-colors">⇄</span>
                      </button>
                    ) : selectedCard ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setChampionModalRole(role); }}
                        className="flex items-center gap-1.5 w-full rounded-md bg-white/5 hover:bg-white/8 px-2 py-1 transition-all cursor-pointer border border-dashed border-white/10"
                      >
                        <span className="text-xs text-slate-500 italic flex-1 text-center">Choisir champion</span>
                      </button>
                    ) : null}

                    {/* Nom du joueur */}
                    <div className="text-center">
                      <span className={`font-rajdhani font-bold leading-none ${
                        selectedCard ? 'text-[15px] text-white' : 'text-[12px] text-slate-600 italic'
                      }`}>
                        {selectedCard ? selectedCard.baseName : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grille des cartes possédées pour le rôle sélectionné */}
          <div className="flex gap-4 flex-wrap min-h-[300px]">
            {ownedCardsForRole(activeRole).length === 0 ? (
              <div className="w-full flex items-center justify-center text-text-faint italic text-sm">
                Aucun joueur disponible pour le poste de {activeRole}.
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
                    
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold flex items-center gap-1"
                        style={{ 
                          background: isLifetime ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : (isExpired ? 'linear-gradient(135deg, #ff3366 0%, #88001b 100%)' : 'rgba(8, 10, 16, 0.95)'), 
                          border: `1px solid ${isLifetime ? '#FFF' : (isExpired ? '#FFB3C6' : '#D4AF37')}`, 
                          color: isLifetime || isExpired ? '#FFF' : '#D4AF37', 
                        }}
                      >
                        {isLifetime ? '♾ À VIE' : isExpired ? 'EXPIRÉ' : <>{contract} TRN</>}
                      </div>

                      <button
                        onClick={() => setInspectCard(card)}
                        className="w-6 h-6 rounded-full bg-[#182136] hover:bg-accent-blue text-white text-xs flex items-center justify-center border border-[#2E3C5D] cursor-pointer transition-colors"
                        title="Inspecter les Traits & la Tier-List"
                      >
                        🔍
                      </button>
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
              {!isMetaDiscovered ? (
                <span className="text-xs font-bold text-text-faint bg-[#141A28] px-2 py-0.5 rounded border border-[#222B3F]" title="Bonus méta régional actif dans les calculs mais non encore décrypté">
                  +? méta
                </span>
              ) : metaSynergy?.bonus > 0 ? (
                <span className="text-xs font-bold text-accent-green bg-accent-green/15 px-2 py-0.5 rounded border border-accent-green/30" title={`Bonus Méta Ligue ${state?.yearlyMeta?.metaLeague}`}>
                  +{metaSynergy.bonus} méta
                </span>
              ) : null}
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
    </>
  );
}