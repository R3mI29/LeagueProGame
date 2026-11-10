import React, { useState, useMemo, useEffect } from 'react';
import { socket } from '../../../api/socket';
import { PACK_TYPES, TRADE_UP_TIERS, RARITY_STAR_ICONS, calculatePackProbabilities } from '../../../constants/packConfig';
import { SPONSOR_CONTRACTS } from '../../../constants/sponsorContracts';
import { CARD_POOL, RARITY_COLORS } from '../../../constants/cardPlayers';
import { SKINS, SKIN_BY_ID } from '../../../constants/teamSkins';
import CardIllustration from '../../../components/CardIllustration';

// =========================================================================
// COMPOSANT ÉTOILE DE RARETÉ AVEC HALO LUMINEUX PUR CODE
// =========================================================================
export function RarityStar({ rarity, size = 32, glow = true, className = '' }) {
  const starSrc = RARITY_STAR_ICONS[rarity];

  const glowFilters = {
    'Commune': 'drop-shadow(0 0 8px rgba(148, 163, 184, 0.6))',
    'Rare': 'drop-shadow(0 0 12px rgba(0, 229, 255, 0.8))',
    'Épique': 'drop-shadow(0 0 14px rgba(255, 51, 102, 0.85))',
    'Légendaire': 'drop-shadow(0 0 16px rgba(255, 215, 0, 0.9))',
    'WANTED': 'drop-shadow(0 0 18px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 25px rgba(244, 63, 94, 0.7))',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {starSrc ? (
        <img
          src={starSrc}
          alt={rarity}
          className="w-full h-full object-contain select-none transition-transform duration-200"
          style={{
            filter: glow ? (glowFilters[rarity] || 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))') : 'none',
          }}
        />
      ) : (
        <span className="text-xs font-mono font-bold text-white/50">★</span>
      )}
    </div>
  );
}

// =========================================================================
// DESIGN DU BOOSTER AVEC RAYURES & LOGO LEAGUE OF LEGENDS BLANC SANS FOND
// =========================================================================
function BoosterPackPouch({ pack }) {
  const themes = {
    starter: {
      patternBg: "url('/assets/booster/grey_stars.jpg')",
      overlay: 'linear-gradient(180deg, rgba(6,78,59,0.80) 0%, rgba(2,44,34,0.90) 50%, rgba(1,20,14,0.96) 100%)',
      accent: '#10b981',
      border: 'rgba(16, 185, 129, 0.6)',
      glow: 'rgba(16, 185, 129, 0.45)',
      primaryRarity: 'Commune',
      foilText: 'STARTER PACK',
    },
    standard: {
      patternBg: "url('/assets/booster/grey_stars.jpg')",
      overlay: 'linear-gradient(180deg, rgba(30,41,59,0.78) 0%, rgba(15,23,42,0.88) 50%, rgba(2,6,23,0.95) 100%)',
      accent: '#94a3b8',
      border: 'rgba(148, 163, 184, 0.5)',
      glow: 'rgba(148, 163, 184, 0.35)',
      primaryRarity: 'Commune',
      foilText: 'STANDARD BOOSTER',
    },
    elite: {
      patternBg: "url('/assets/booster/blue_stars.jpg')",
      overlay: 'linear-gradient(180deg, rgba(7,89,133,0.72) 0%, rgba(12,74,110,0.85) 50%, rgba(3,30,51,0.94) 100%)',
      accent: '#00e5ff',
      border: 'rgba(0, 229, 255, 0.75)',
      glow: 'rgba(0, 229, 255, 0.5)',
      primaryRarity: 'Rare',
      foilText: 'ÉLITE BOOSTER',
    },
    legendary: {
      patternBg: "url('/assets/booster/yellow_stars.jpg')",
      overlay: 'linear-gradient(180deg, rgba(145,68,16,0.55) 0%, rgba(95,38,4,0.70) 50%, rgba(42,16,2,0.84) 100%)',
      accent: '#fbbf24',
      border: 'rgba(251, 191, 36, 0.8)',
      glow: 'rgba(251, 191, 36, 0.55)',
      primaryRarity: 'Légendaire',
      foilText: 'LÉGENDE BOOSTER',
    },
    wanted: {
      patternBg: "url('/assets/booster/wanted_stars.jpg')",
      overlay: 'linear-gradient(180deg, rgba(145,22,60,0.62) 0%, rgba(88,8,30,0.76) 50%, rgba(32,2,8,0.88) 100%)',
      accent: '#f43f5e',
      border: 'rgba(244, 63, 94, 0.85)',
      glow: 'rgba(244, 63, 94, 0.65)',
      primaryRarity: 'WANTED',
      foilText: 'WANTED SUPRÊME',
    },
    skin_pack: {
      patternBg: "url('/assets/booster/blue_stars.jpg')",
      overlay: 'linear-gradient(180deg, rgba(88,28,135,0.78) 0%, rgba(59,7,100,0.88) 50%, rgba(20,2,40,0.96) 100%)',
      accent: '#c084fc',
      border: 'rgba(192, 132, 252, 0.85)',
      glow: 'rgba(192, 132, 252, 0.65)',
      primaryRarity: 'Épique',
      foilText: 'BOOSTER DE SKIN',
    },
  };

  const packId = pack?.id || 'standard';
  const theme = themes[packId] || themes.standard;
  const packTitle = (pack?.name || 'BOOSTER').replace('Pack ', '');
  const packCardCount = packId === 'skin_pack' ? '1 SKIN' : `${pack?.size || 5} CARTES`;

  return (
    <div
      className="relative w-full max-w-[240px] aspect-[5/7.8] mx-auto rounded-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-2 select-none shadow-2xl"
      style={{
        boxShadow: `0 20px 45px rgba(0,0,0,0.9), 0 0 35px ${theme.glow}, inset 0 0 25px rgba(255,255,255,0.08)`,
        border: `1.5px solid ${theme.border}`,
      }}
    >
      {/* Texture officielle étoiles */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{
          backgroundImage: theme.patternBg,
        }}
      />

      {/* Vignette et filtre de dégradé */}
      <div
        className="absolute inset-0"
        style={{
          background: theme.overlay,
        }}
      />

      {/* Reflet métallisé diagonal foil */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
        style={{
          background: 'linear-gradient(115deg, transparent 15%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.3) 55%, transparent 80%)',
        }}
      />

      {/* Corps central du booster */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-5 text-center">
        {/* En-tête avec foil text */}
        <div className="flex flex-col items-center space-y-1 pt-1">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/90 font-black">
            {theme.foilText}
          </div>
          <div
            className="h-0.5 w-12 mx-auto rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
        </div>

        {/* Emblème central officiel League of Legends blanc sans fond */}
        <div className="relative my-3 flex items-center justify-center">
          <div
            className="absolute w-24 h-24 rounded-full blur-2xl opacity-60 pointer-events-none"
            style={{ backgroundColor: theme.accent }}
          />
          <img
            src="/logo/others/League_of_legend.svg"
            alt="League of Legends"
            className="relative z-10 w-24 h-24 object-contain filter drop-shadow-[0_0_16px_rgba(255,255,255,0.45)] transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Nom du pack & badge du nombre de cartes */}
        <div className="space-y-1.5 pb-1">
          <div
            className="font-rajdhani font-black text-2xl uppercase tracking-wider text-white leading-tight drop-shadow-lg"
            style={{ textShadow: `0 2px 12px ${theme.glow}` }}
          >
            {packTitle}
          </div>
          <div
            className="inline-block px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest text-black uppercase shadow"
            style={{ backgroundColor: theme.accent }}
          >
            {packCardCount}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// CINÉMATIQUE MODALE DU REVEAL DE BOOSTER DE SKIN
// =========================================================================
function SkinRevealModal({ data, onClose, onEquip, myTeam }) {
  if (!data) return null;
  const isCompensation = data.compensation;
  const skin = SKIN_BY_ID[data.skinId] || SKINS.find(s => s.id === data.skinId);

  const teamLogo = myTeam?.logo ? (myTeam.logo.startsWith('/') ? myTeam.logo : `/${myTeam.logo}`) : null;
  const teamName = myTeam?.name || 'Votre Équipe';
  const teamTag = myTeam?.tag || 'TAG';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.25s_ease-out]">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0D0B18] border border-purple-500/50 p-8 shadow-[0_0_80px_rgba(168,85,247,0.35)] flex flex-col items-center text-center space-y-6">
        {/* Glow cosmique */}
        <div className="absolute -top-24 w-72 h-72 rounded-full bg-purple-600/30 blur-3xl pointer-events-none" />

        {skin && (
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-white/80 uppercase">
              <RarityStar rarity={skin.rarity} size={18} glow={true} />
              <span>Skin {skin.rarity}</span>
            </div>
            <h3 className="font-rajdhani font-black text-3xl sm:text-4xl uppercase tracking-wider text-white pt-2 drop-shadow-md">
              {skin.name}
            </h3>
          </div>
        )}

        {/* Aperçu interactif du skin avec l'identité réelle de l'équipe du joueur */}
        {skin && (
          <div
            className="w-full max-w-xs p-6 rounded-2xl flex flex-col items-center justify-center space-y-3 relative overflow-hidden transition-all shadow-2xl"
            style={skin.frame || { background: '#111827', borderColor: '#374151' }}
          >
            {teamLogo ? (
              <img
                src={teamLogo}
                alt={teamName}
                className="w-20 h-20 object-contain filter drop-shadow-[0_0_14px_rgba(255,255,255,0.6)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-rajdhani font-black text-2xl text-white">
                {teamTag}
              </div>
            )}
            <div className="text-center">
              <div className="font-rajdhani font-black text-xl text-white uppercase tracking-wider drop-shadow">
                {teamName}
              </div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-white/70 font-bold">
                [{teamTag}]
              </div>
            </div>
          </div>
        )}

        {/* Bannière d'état : Nouveau skin débloqué OU Doublon avec compensation */}
        {isCompensation ? (
          <div className="space-y-3 w-full">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 space-y-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Doublon déjà possédé
              </div>
              <div className="text-xs text-white/80">
                Vous possédez déjà ce skin. Compensation financière accordée :
              </div>
              <div className="font-mono text-3xl font-black text-emerald-400 pt-1">
                +{data.credits} 💲
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-rajdhani font-black text-base uppercase tracking-wider hover:bg-emerald-400 transition-all cursor-pointer shadow-lg"
            >
              Récupérer la Récompense
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                if (skin) onEquip(skin.id);
                onClose();
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-rajdhani font-black text-base uppercase tracking-wider cursor-pointer shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02]"
            >
              Équiper Maintenant
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-rajdhani font-black text-base uppercase tracking-wider cursor-pointer transition-all"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// COMPOSANT PRINCIPAL DE L'ONGLET BOUTIQUE
// =========================================================================
export default function ShopTab({
  state = {},
  myId = '',
  myEconomy = 0,
  isReady = false,
  hasStarter = true,
  myCollection = {},
  myLineup = {},
}) {
  const [subTab, setSubTab] = useState('boosters');
  const [selectedTradeTierId, setSelectedTradeTierId] = useState('commune_to_rare');
  const [tradeAllocations, setTradeAllocations] = useState({});
  const [showConfirmAbandon, setShowConfirmAbandon] = useState(false);
  const [openedSkinData, setOpenedSkinData] = useState(null);

  useEffect(() => {
    const handleSkinOpened = (data) => {
      setOpenedSkinData(data);
    };
    socket.on('skin-pack-opened', handleSkinOpened);
    return () => {
      socket.off('skin-pack-opened', handleSkinOpened);
    };
  }, []);

  const handleEquipSkin = (skinId) => {
    socket.emit('equip-skin', skinId);
  };

  const activeContract = state.activeContracts?.[myId] || null;

  // Boosters disponibles dans la boutique
  const boosters = useMemo(() => {
    return Object.values(PACK_TYPES).filter(p => p.id !== 'starter');
  }, []);

  const starterPack = PACK_TYPES.starter;

  // Boosters débloqués en réserve (sponsors, récompenses)
  const myBonusPacks = useMemo(() => {
    const packs = state.bonusPacks?.[myId] || {};
    return Object.entries(packs).filter(([, count]) => count > 0);
  }, [state.bonusPacks, myId]);

  // --- ACTIONS BOUTIQUE ---
  const handleBuyPack = (packId, price) => {
    if (isReady || myEconomy < price) return;
    socket.emit('buy-pack', packId);
  };

  const handleOpenBonusPack = (packKey) => {
    if (isReady) return;
    socket.emit('open-bonus-pack', packKey);
  };

  // --- LOGIQUE TRADE-UP ---
  const currentTier = useMemo(() => {
    return TRADE_UP_TIERS.find(t => t.id === selectedTradeTierId) || TRADE_UP_TIERS[0];
  }, [selectedTradeTierId]);

  const bankYears = useMemo(() => {
    return state.tradeUpBank?.[myId]?.[currentTier.fromRarity] || 0;
  }, [state.tradeUpBank, myId, currentTier.fromRarity]);

  const eligibleTradeCards = useMemo(() => {
    const lineupIds = Object.values(myLineup || {});
    return CARD_POOL.filter(card => {
      if (card.rarity !== currentTier.fromRarity) return false;
      const contract = myCollection[card.id];
      if (typeof contract !== 'number' || contract <= 0) return false;
      if (lineupIds.includes(card.id)) return false;
      return true;
    }).map(card => ({
      ...card,
      availableYears: myCollection[card.id],
      allocatedYears: tradeAllocations[card.id] || 0,
    }));
  }, [currentTier, myCollection, myLineup, tradeAllocations]);

  const allocatedFromCards = useMemo(() => {
    return Object.values(tradeAllocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [tradeAllocations]);

  const totalContributed = bankYears + allocatedFromCards;
  const remainingNeeded = Math.max(0, currentTier.requiredYears - totalContributed);

  const handleStepAllocation = (cardId, availableYears, delta) => {
    setTradeAllocations(prev => {
      const current = prev[cardId] || 0;
      const target = current + delta;
      if (target <= 0) {
        const next = { ...prev };
        delete next[cardId];
        return next;
      }
      if (target > availableYears) return prev;
      return { ...prev, [cardId]: target };
    });
  };

  const handleMaxAllocation = (cardId, availableYears) => {
    setTradeAllocations(prev => ({
      ...prev,
      [cardId]: availableYears,
    }));
  };

  const handleAutoFillTrade = () => {
    let needed = Math.max(0, currentTier.requiredYears - bankYears);
    const newAlloc = {};
    for (const card of eligibleTradeCards) {
      if (needed <= 0) break;
      const take = Math.min(card.availableYears, needed);
      newAlloc[card.id] = take;
      needed -= take;
    }
    setTradeAllocations(newAlloc);
  };

  const handleClearTradeAllocations = () => {
    setTradeAllocations({});
  };

  const handleDepositToGauge = () => {
    if (allocatedFromCards <= 0 || isReady) return;
    socket.emit('deposit-trade-up', {
      rarity: currentTier.fromRarity,
      cardAllocations: tradeAllocations,
    });
    setTradeAllocations({});
  };

  const handleExecuteTradeUp = () => {
    // Interdiction d'échanger si des cartes sont en cours d'allocation :
    // L'utilisateur doit obligatoirement les déposer dans la jauge au préalable.
    if (allocatedFromCards > 0 || bankYears < currentTier.requiredYears || isReady) return;
    socket.emit('trade-up', {
      tierId: currentTier.id,
      cardAllocations: {},
    });
    setTradeAllocations({});
  };

  // --- ACTIONS SPONSORS ---
  const offeringsData = state.sponsorOfferings?.[myId] || null;
  const offeringsList = useMemo(() => {
    if (offeringsData?.contractIds && Array.isArray(offeringsData.contractIds)) {
      return offeringsData.contractIds
        .map(id => SPONSOR_CONTRACTS.find(c => c.id === id))
        .filter(Boolean);
    }
    return SPONSOR_CONTRACTS.slice(0, 3);
  }, [offeringsData]);

  const remainingTournamentsUntilRefresh = useMemo(() => {
    const currentEvent = state.eventIndex || 0;
    const refreshEvent = offeringsData?.refreshAtEvent ?? (currentEvent + 3);
    return Math.max(1, refreshEvent - currentEvent);
  }, [offeringsData, state.eventIndex]);

  const handleSignContract = (contractId) => {
    if (isReady) return;
    socket.emit('sign-sponsor-contract', contractId);
  };

  const handleAbandonContract = () => {
    if (isReady || !activeContract) return;
    socket.emit('abandon-sponsor-contract');
    setShowConfirmAbandon(false);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.2s]">
      {/* ========================================================================= */}
      {/* NAVIGATION PRINCIPALE & TRÉSORERIE */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2538]">
        <div className="flex items-center gap-2 bg-[#0C0F17] p-1.5 rounded-2xl border border-[#1A2234]">
          {[
            { id: 'boosters', label: 'Boosters' },
            { id: 'tradeup', label: 'Trade-Up' },
            { id: 'sponsors', label: 'Sponsors' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSubTab(tab.id);
                setTradeAllocations({});
              }}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                subTab === tab.id
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-text-faint hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-[#0F1422] border border-[#222C44] px-6 py-2.5 rounded-2xl">
          <span className="text-text-faint text-xs font-bold uppercase tracking-wider">Trésorerie</span>
          <span className="font-mono text-xl font-black text-emerald-400">
            💲 {myEconomy.toLocaleString('fr-FR')}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1 : BOOSTERS */}
      {/* ========================================================================= */}
      {subTab === 'boosters' && (
        <div className="space-y-8">
          {/* Starter Pack si non réclamé */}
          {!hasStarter && starterPack && (
            <div className="p-8 rounded-3xl border border-emerald-500/50 bg-[#0C121D] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <BoosterPackPouch pack={starterPack} />
                <div>
                  <h3 className="font-rajdhani font-black text-3xl text-white uppercase tracking-wide">
                    {starterPack.name}
                  </h3>
                  <div className="text-emerald-400 text-sm font-bold mt-1">
                    Gratuit • 6 cartes avec contrat À VIE
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleBuyPack('starter', 0)}
                disabled={isReady}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-400 text-black font-rajdhani font-black text-base uppercase tracking-wider hover:bg-emerald-300 transition-all cursor-pointer shadow-lg shadow-emerald-400/20 whitespace-nowrap"
              >
                Ouvrir le Starter →
              </button>
            </div>
          )}

          {/* Boosters Débloqués en Réserve (Sponsors & Récompenses) */}
          {myBonusPacks.length > 0 && (
            <div className="space-y-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/40 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-purple-400 animate-ping" />
                  <h3 className="font-rajdhani font-black text-2xl text-white uppercase tracking-wider">
                    Boosters Débloqués en Réserve
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-300/80 uppercase font-bold">
                  {myBonusPacks.reduce((s, [, c]) => s + c, 0)} disponible(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {myBonusPacks.map(([packKey, count]) => {
                  const isSkinPack = packKey === 'skin_pack';
                  const packDef = isSkinPack
                    ? {
                        id: 'skin_pack',
                        name: 'Pack Skin Sponsor',
                        size: 1,
                        badge: 'EXCLUSIF',
                        color: '#c084fc',
                        accentColor: '#e9d5ff',
                      }
                    : PACK_TYPES[packKey] || PACK_TYPES.standard;

                  return (
                    <div
                      key={packKey}
                      className="relative flex flex-col justify-between rounded-3xl bg-[#0d0918] border border-purple-500/30 p-5 shadow-xl group hover:border-purple-400/70 transition-all duration-300"
                    >
                      {/* Badge du multiple si > 1 */}
                      {count > 1 && (
                        <div className="absolute top-3 right-3 z-30 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono font-black text-sm shadow-lg border border-white/20">
                          x{count}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {isSkinPack ? 'SPONSOR REWARD' : packDef.badge}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-white/50">
                            {isSkinPack ? '1 Skin' : `${packDef.size} Cartes`}
                          </span>
                        </div>

                        <div className="py-2 flex items-center justify-center">
                          <BoosterPackPouch pack={packDef} />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-purple-500/20 mt-3 flex flex-col gap-2">
                        <div className="text-center text-xs font-medium text-white/70">
                          {isSkinPack ? 'Débloque 1 skin aléatoire' : 'Booster offert'}
                        </div>
                        <button
                          onClick={() => handleOpenBonusPack(packKey)}
                          disabled={isReady}
                          className="w-full py-3 rounded-xl font-rajdhani font-black text-sm uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-lg shadow-purple-500/30 cursor-pointer transition-all hover:scale-[1.02]"
                        >
                          Ouvrir le Booster →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grille des 4 Boosters Disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {boosters.map(pack => {
              const canAfford = myEconomy >= pack.price;
              const probs = calculatePackProbabilities(pack.weights);

              return (
                <div
                  key={pack.id}
                  className="flex flex-col justify-between rounded-3xl bg-[#0B0F19] border border-[#1A233A] hover:border-[#38486F] p-6 transition-all duration-300 select-none shadow-2xl group"
                >
                  <div>
                    {/* Badge & Nom */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider"
                        style={{
                          backgroundColor: `${pack.color}20`,
                          color: pack.accentColor || pack.color,
                          border: `1px solid ${pack.color}40`,
                        }}
                      >
                        {pack.badge}
                      </span>
                      <span className="text-xs font-mono font-bold text-white/50">
                        {pack.size} Cartes
                      </span>
                    </div>

                    {/* Visuel du Pack */}
                    <div className="py-2 flex items-center justify-center">
                      <BoosterPackPouch pack={pack} />
                    </div>
                  </div>

                  {/* Probabilités par carte & Bouton d'achat */}
                  <div className="pt-5 border-t border-white/10 space-y-4">
                    {/* Mini précision demandée par l'utilisateur */}
                    <div className="text-[10px] font-mono text-white/50 text-center uppercase tracking-wider">
                      Chances par carte
                    </div>

                    {/* Probabilités avec étoiles grand format et halo */}
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(probs).map(([rarity, pct]) => {
                        if (pct <= 0) return null;
                        return (
                          <div
                            key={rarity}
                            className="flex items-center justify-between gap-2 bg-black/50 px-3 py-1.5 rounded-xl border border-white/5"
                          >
                            <RarityStar rarity={rarity} size={22} glow={true} />
                            <span className="text-xs font-mono text-white/90 font-bold">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Barre de répartition */}
                    <div className="flex h-2 w-full rounded-full overflow-hidden bg-black/80">
                      {probs.Commune > 0 && (
                        <div style={{ width: `${probs.Commune}%`, backgroundColor: RARITY_COLORS.Commune }} />
                      )}
                      {probs.Rare > 0 && (
                        <div style={{ width: `${probs.Rare}%`, backgroundColor: RARITY_COLORS.Rare }} />
                      )}
                      {probs['Épique'] > 0 && (
                        <div style={{ width: `${probs['Épique']}%`, backgroundColor: RARITY_COLORS['Épique'] }} />
                      )}
                      {probs['Légendaire'] > 0 && (
                        <div style={{ width: `${probs['Légendaire']}%`, backgroundColor: RARITY_COLORS['Légendaire'] }} />
                      )}
                      {probs.WANTED > 0 && (
                        <div style={{ width: `${probs.WANTED}%`, backgroundColor: RARITY_COLORS.WANTED }} />
                      )}
                    </div>

                    {/* Prix & Bouton Achat */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <span className="font-mono text-2xl font-black text-emerald-400">
                        {pack.price} 💲
                      </span>

                      <button
                        onClick={() => handleBuyPack(pack.id, pack.price)}
                        disabled={!canAfford || isReady}
                        className={`px-6 py-3 rounded-xl font-rajdhani font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
                          canAfford && !isReady
                            ? 'bg-white text-black hover:bg-emerald-400 hover:shadow-lg'
                            : 'bg-white/5 text-text-faint/30 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {canAfford ? 'Acheter' : `Manque ${pack.price - myEconomy} 💲`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2 : TRADE-UP */}
      {/* ========================================================================= */}
      {subTab === 'tradeup' && (
        <div className="space-y-8">
          {/* Paliers Trade-Up : rareté -> rareté+1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRADE_UP_TIERS.map(tier => {
              const isSelected = tier.id === currentTier.id;

              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    setSelectedTradeTierId(tier.id);
                    setTradeAllocations({});
                  }}
                  className={`p-5 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#141A28] border-white text-white shadow-2xl shadow-white/5'
                      : 'bg-[#0B0F19] border-[#1A233A] text-text-faint hover:text-white hover:border-[#2D3958]'
                  }`}
                >
                  <div className="font-rajdhani font-black text-xl text-white uppercase tracking-wide">
                    {tier.fromRarity} → {tier.toRarity}
                  </div>
                  <div className="text-sm font-mono font-bold mt-2" style={{ color: tier.toColor }}>
                    {tier.requiredYears} ans requis
                  </div>
                </button>
              );
            })}
          </div>

          {/* Jauge Centrale & Actions */}
          <div className="p-8 rounded-3xl bg-[#0B0F19] border border-[#1A233A] space-y-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Barre de Progression */}
              <div className="w-full lg:w-3/5 space-y-3">
                <div className="flex items-center justify-between text-base font-bold text-white">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="uppercase tracking-wider">Jauge {currentTier.toRarity}</span>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                      Déposé : {bankYears} / {currentTier.requiredYears} ans
                    </span>
                    {allocatedFromCards > 0 && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30 animate-pulse">
                        À déposer : +{allocatedFromCards} ans
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-lg font-black">
                    {bankYears} / {currentTier.requiredYears} ans
                  </span>
                </div>

                <div className="w-full bg-black/70 h-4 rounded-full overflow-hidden border border-white/10 flex">
                  {/* Part réserve */}
                  {bankYears > 0 && (
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (bankYears / currentTier.requiredYears) * 100)}%`,
                      }}
                    />
                  )}
                  {/* Part sélectionnée à déposer */}
                  {allocatedFromCards > 0 && (
                    <div
                      className="h-full bg-amber-400/80 border-l border-amber-300 transition-all duration-300"
                      style={{
                        width: `${Math.min(100 - (bankYears / currentTier.requiredYears) * 100, (allocatedFromCards / currentTier.requiredYears) * 100)}%`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Boutons d'Action */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                {allocatedFromCards > 0 && (
                  <button
                    onClick={handleClearTradeAllocations}
                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Effacer
                  </button>
                )}

                <button
                  onClick={handleAutoFillTrade}
                  disabled={eligibleTradeCards.length === 0 || remainingNeeded <= 0}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Remplissage auto
                </button>

                {/* Bouton pour ajouter les cartes même si la barre n'est pas remplie */}
                <button
                  onClick={handleDepositToGauge}
                  disabled={allocatedFromCards <= 0 || isReady}
                  className={`px-5 py-3 rounded-xl font-rajdhani font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    allocatedFromCards > 0 && !isReady
                      ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-300/50'
                      : 'bg-white/5 text-text-faint/30 cursor-not-allowed'
                  }`}
                >
                  Ajouter à la jauge (+{allocatedFromCards} ans)
                </button>

                {/* Bouton Échanger : strictement actif seulement si aucune carte en cours et jauge pleine */}
                <button
                  onClick={handleExecuteTradeUp}
                  disabled={allocatedFromCards > 0 || bankYears < currentTier.requiredYears || isReady}
                  className={`px-6 py-3 rounded-xl font-rajdhani font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
                    allocatedFromCards === 0 && bankYears >= currentTier.requiredYears && !isReady
                      ? 'bg-emerald-400 text-black hover:bg-emerald-300 shadow-xl shadow-emerald-400/30'
                      : 'bg-white/5 text-text-faint/30 cursor-not-allowed border border-white/5'
                  }`}
                  title={
                    allocatedFromCards > 0
                      ? 'Cliquez d\'abord sur "Ajouter à la jauge" avant de pouvoir échanger'
                      : bankYears < currentTier.requiredYears
                      ? `Il manque ${currentTier.requiredYears - bankYears} ans déposés dans la jauge`
                      : 'Lancer l\'échange'
                  }
                >
                  Échanger → 1 {currentTier.toRarity}
                </button>
              </div>
            </div>
          </div>

          {/* Grille des Cartes Éligibles (Cartes en grand) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wide m-0">
                Cartes {currentTier.fromRarity} ({eligibleTradeCards.length})
              </h3>
            </div>

            {eligibleTradeCards.length === 0 ? (
              <div className="p-16 text-center text-text-faint text-base bg-[#0B0F19] rounded-3xl border border-white/5">
                Aucune carte {currentTier.fromRarity} disponible.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {eligibleTradeCards.map(card => {
                  const isAllocated = card.allocatedYears > 0;
                  return (
                    <div
                      key={card.id}
                      className={`flex flex-col items-center p-4 rounded-3xl border transition-all duration-200 select-none ${
                        isAllocated
                          ? 'border-emerald-400 bg-emerald-950/20 shadow-2xl shadow-emerald-500/10'
                          : 'border-[#1A233A] bg-[#0B0F19] hover:border-[#2D3958]'
                      }`}
                    >
                      <div className="relative">
                        <CardIllustration card={card} width={150} />
                        {isAllocated && (
                          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-400 text-black font-mono font-black text-xs shadow-lg">
                            +{card.allocatedYears}
                          </div>
                        )}
                      </div>

                      <div className="w-full mt-4 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span className="text-text-faint">Disponible :</span>
                          <span className="text-white">{card.availableYears} ans</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStepAllocation(card.id, card.availableYears, -1)}
                            disabled={card.allocatedYears <= 0}
                            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white font-bold text-sm flex items-center justify-center cursor-pointer transition-all"
                          >
                            -
                          </button>

                          <div className="flex-1 text-center font-mono text-sm font-black text-white bg-black/50 py-1 rounded-xl border border-white/5">
                            {card.allocatedYears}
                          </div>

                          <button
                            onClick={() => handleStepAllocation(card.id, card.availableYears, 1)}
                            disabled={card.allocatedYears >= card.availableYears}
                            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white font-bold text-sm flex items-center justify-center cursor-pointer transition-all"
                          >
                            +
                          </button>

                          <button
                            onClick={() => handleMaxAllocation(card.id, card.availableYears)}
                            disabled={card.allocatedYears >= card.availableYears}
                            className="px-2.5 h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-mono font-bold text-xs uppercase flex items-center justify-center cursor-pointer transition-all border border-emerald-500/30 disabled:opacity-20"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3 : SPONSORS */}
      {/* ========================================================================= */}
      {subTab === 'sponsors' && (
        <div className="space-y-8">
          {/* CAS A : CONTRAT ACTIF (PLEINE PAGE, LOGO SANS CADRE) */}
          {activeContract ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#0C101C] border border-[#232F4C] shadow-2xl space-y-8 animate-[fadeIn_0.3s]">
              {/* Logo en grand SANS cadre */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-8">
                  <img
                    src={activeContract.logo}
                    alt={activeContract.brandName}
                    className="h-20 sm:h-24 w-auto max-w-[240px] object-contain filter drop-shadow-xl"
                  />
                  <div>
                    <span className="px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-black uppercase tracking-wider inline-block mb-2">
                      Contrat Actif
                    </span>
                    <h2 className="font-rajdhani font-black text-3xl sm:text-4xl text-white uppercase tracking-wide m-0">
                      {activeContract.title}
                    </h2>
                  </div>
                </div>

                <div className="bg-[#13192B] border border-[#2A3758] px-6 py-3 rounded-2xl">
                  <span className="font-mono text-lg font-black text-amber-400">
                    {activeContract.remainingEvents} tournoi{activeContract.remainingEvents > 1 ? 's' : ''} restant{activeContract.remainingEvents > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Objectif */}
              <div className="p-8 rounded-2xl bg-[#111726] border border-white/5 space-y-2">
                <div className="text-xs font-mono uppercase tracking-widest text-text-faint font-bold">
                  Mission
                </div>
                <p className="text-xl sm:text-2xl text-white font-bold leading-relaxed m-0">
                  {activeContract.conditionText}
                </p>
              </div>

              {/* Enjeux */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-1">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Récompense
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-white">
                    {activeContract.reward?.description || `+${activeContract.reward?.credits} 💲`}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/40 space-y-1">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                    Pénalité échec
                  </div>
                  <div className="font-mono text-3xl font-black text-red-400">
                    -{activeContract.malus} 💲
                  </div>
                </div>
              </div>

              {/* Résiliation */}
              <div className="pt-4 flex items-center justify-end border-t border-white/5">
                {!showConfirmAbandon ? (
                  <button
                    onClick={() => setShowConfirmAbandon(true)}
                    disabled={isReady}
                    className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-rajdhani font-bold text-sm uppercase cursor-pointer transition-all"
                  >
                    Résilier le contrat
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-red-400 font-mono font-bold">
                      Confirmer (-{activeContract.malus} 💲) ?
                    </span>
                    <button
                      onClick={handleAbandonContract}
                      className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-rajdhani font-bold text-sm uppercase cursor-pointer"
                    >
                      Oui, résilier
                    </button>
                    <button
                      onClick={() => setShowConfirmAbandon(false)}
                      className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-bold cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CAS B : 3 PROPOSITIONS (LOGOS EN GRAND SANS CADRE, SANS BLABLA) */
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0B0F19] border border-[#1A233A]">
                <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wide m-0">
                  Offres de Sponsoring
                </h3>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white/80">
                  Renouvellement dans : <strong className="text-amber-400">{remainingTournamentsUntilRefresh}</strong> tournoi{remainingTournamentsUntilRefresh > 1 ? 's' : ''}
                </div>
              </div>

              {/* Grille des 3 Offres */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {offeringsList.map(contract => (
                  <div
                    key={contract.id}
                    className="flex flex-col justify-between p-8 rounded-3xl bg-[#0B0F19] border border-[#1A233A] hover:border-[#38486F] transition-all duration-300 shadow-2xl space-y-6"
                  >
                    <div>
                      {/* Logo en grand direct SANS cadre */}
                      <div className="h-16 flex items-center mb-4">
                        <img
                          src={contract.logo}
                          alt={contract.brandName}
                          className="h-14 w-auto max-w-[180px] object-contain filter drop-shadow"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-rajdhani font-black text-2xl text-white uppercase tracking-wide m-0">
                          {contract.title}
                        </h4>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                          contract.difficulty === 'easy'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : contract.difficulty === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {contract.difficulty === 'easy' ? 'Facile' : contract.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                        </span>
                      </div>

                      {/* Condition directe sans blabla */}
                      <p className="text-white/90 text-sm leading-relaxed font-medium min-h-[48px]">
                        {contract.conditionText}
                      </p>
                    </div>

                    {/* Enjeux & Signature */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-emerald-400 font-bold text-sm">
                          {contract.reward?.description || `+${contract.reward?.credits} 💲`}
                        </span>
                        <span className="text-red-400 font-bold text-sm">
                          -{contract.malus} 💲
                        </span>
                      </div>

                      <button
                        onClick={() => handleSignContract(contract.id)}
                        disabled={isReady}
                        className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-emerald-400 font-rajdhani font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md"
                      >
                        Signer le contrat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Révélation cinématique du Booster de Skin */}
      {openedSkinData && (
        <SkinRevealModal
          data={openedSkinData}
          onClose={() => setOpenedSkinData(null)}
          onEquip={handleEquipSkin}
          myTeam={state.participants?.find(p => p.id === myId)}
        />
      )}
    </div>
  );
}
