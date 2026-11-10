import React, { useState, useEffect, useMemo } from 'react';
import { socket } from '../../../api/socket';
import { RARITY_COLORS } from '../../../constants/cardPlayers';
import CardIllustration from '../../../components/CardIllustration';
import {
  getAllCollectionTeams,
  getTeamProgress,
  getOverallCollectionStats,
  isCardInAlbum,
  getCardInsertionStatus,
  COLLECTION_INSERT_COSTS,
} from '../../../constants/collectionConfig';

const LEAGUES = ['Toutes', 'LCK', 'LPL', 'LEC', 'LCS'];

/**
 * Son mécanique d'insertion d'une carte dans l'album (clic net de reliure magnétique)
 */
function playInsertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {
    // Audio silencieux si indisponible
  }
}

/**
 * Fanfare d'encaissement de prime d'album
 */
function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  } catch (e) {
    // Audio silencieux si indisponible
  }
}

export default function CollectionTab({
  state,
  myId,
  myCollection = {},
  myAlbum = {},
  myEconomy = 0,
  getDynamicCard,
}) {
  const [selectedTeamTag, setSelectedTeamTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('Toutes');
  const [filterClaimableOnly, setFilterClaimableOnly] = useState(false);
  const [inspectedCard, setInspectedCard] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [toast, setToast] = useState(null);

  const allTeams = useMemo(() => getAllCollectionTeams(), []);
  const overallStats = useMemo(() => getOverallCollectionStats(myAlbum, state, myId, myCollection), [myAlbum, state, myId, myCollection]);
  const claimedRewardsMap = state?.collectionRewardsClaimed?.[myId] || {};

  // Écoute des événements socket de l'album et des primes
  useEffect(() => {
    const onCardEntered = () => {
      playInsertSound();
      setToast({ type: 'success', text: 'Carte insérée dans la collection permanente !' });
      setTimeout(() => setToast(null), 3000);
    };

    const onBatchEntered = (data) => {
      playInsertSound();
      setToast({ type: 'success', text: `${data.count} carte${data.count > 1 ? 's' : ''} insérée${data.count > 1 ? 's' : ''} dans la collection !` });
      setTimeout(() => setToast(null), 3000);
    };

    const onRewardClaimed = (data) => {
      playCelebrationSound();
      setToast({ type: 'success', text: `+${data.rewardAmount} 💲 crédits ajoutés à votre solde !` });
      setTimeout(() => setToast(null), 3500);
    };

    const onRewardError = (data) => {
      setToast({ type: 'error', text: data.message });
      setTimeout(() => setToast(null), 3500);
    };

    const onCollectionError = (data) => {
      setToast({ type: 'error', text: data.message });
      setTimeout(() => setToast(null), 3500);
    };

    socket.on('card-entered-collection', onCardEntered);
    socket.on('cards-batch-entered', onBatchEntered);
    socket.on('collection-reward-claimed', onRewardClaimed);
    socket.on('collection-reward-error', onRewardError);
    socket.on('collection-error', onCollectionError);

    return () => {
      socket.off('card-entered-collection', onCardEntered);
      socket.off('cards-batch-entered', onBatchEntered);
      socket.off('collection-reward-claimed', onRewardClaimed);
      socket.off('collection-reward-error', onRewardError);
      socket.off('collection-error', onCollectionError);
    };
  }, []);

  const selectedTeam = useMemo(() => {
    if (!selectedTeamTag) return null;
    return allTeams.find(t => t.tag === selectedTeamTag) || null;
  }, [selectedTeamTag, allTeams]);

  // Navigation Équipe Précédente / Suivante
  const currentTeamIndex = useMemo(() => {
    if (!selectedTeamTag) return -1;
    return allTeams.findIndex(t => t.tag === selectedTeamTag);
  }, [selectedTeamTag, allTeams]);

  const handlePrevTeam = () => {
    if (currentTeamIndex > 0) {
      setSelectedTeamTag(allTeams[currentTeamIndex - 1].tag);
    } else {
      setSelectedTeamTag(allTeams[allTeams.length - 1].tag);
    }
  };

  const handleNextTeam = () => {
    if (currentTeamIndex !== -1 && currentTeamIndex < allTeams.length - 1) {
      setSelectedTeamTag(allTeams[currentTeamIndex + 1].tag);
    } else {
      setSelectedTeamTag(allTeams[0].tag);
    }
  };

  // Raccourcis clavier (Flèches Gauche/Droite, Echap)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedTeamTag) return;
      if (inspectedCard || showInfoModal) return;
      if (e.key === 'ArrowLeft') handlePrevTeam();
      else if (e.key === 'ArrowRight') handleNextTeam();
      else if (e.key === 'Escape') setSelectedTeamTag(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTeamTag, currentTeamIndex, inspectedCard, showInfoModal]);

  // Filtrage et tri des équipes : primes prêtes en premier
  const sortedAndFilteredTeams = useMemo(() => {
    return allTeams
      .filter(team => {
        if (selectedLeague !== 'Toutes' && team.league !== selectedLeague) {
          return false;
        }

        const progress = getTeamProgress(team.tag, myAlbum);
        const isClaimed = Boolean(claimedRewardsMap[team.tag]);

        if (filterClaimableOnly && (!progress.isComplete || isClaimed)) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = team.name.toLowerCase().includes(q);
          const matchPlayer = team.cards.some(c => c.baseName.toLowerCase().includes(q));
          if (!matchName && !matchPlayer) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const progA = getTeamProgress(a.tag, myAlbum);
        const progB = getTeamProgress(b.tag, myAlbum);
        const claimedA = Boolean(claimedRewardsMap[a.tag]);
        const claimedB = Boolean(claimedRewardsMap[b.tag]);

        const claimableA = progA.isComplete && !claimedA ? 1 : 0;
        const claimableB = progB.isComplete && !claimedB ? 1 : 0;
        if (claimableB !== claimableA) return claimableB - claimableA;

        if (progB.percentage !== progA.percentage) return progB.percentage - progA.percentage;
        return b.cardCount - a.cardCount;
      });
  }, [allTeams, selectedLeague, filterClaimableOnly, searchQuery, myAlbum, claimedRewardsMap]);

  // Actions
  const handleEnterCard = (cardId, e) => {
    if (e) e.stopPropagation();
    socket.emit('enter-card-collection', cardId);
  };

  const handleEnterAllTeamCards = (teamTag, e) => {
    if (e) e.stopPropagation();
    socket.emit('enter-all-cards-collection', teamTag);
  };

  const handleClaimReward = (teamTag, e) => {
    if (e) e.stopPropagation();
    socket.emit('claim-collection-reward', teamTag);
  };

  return (
    <div className="text-white select-none">
      {/* Toast sobre */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md transition-all animate-[bounceIn_0.2s] ${
          toast.type === 'success' 
            ? 'bg-[#0B1A12]/95 border-emerald-500/60 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)]' 
            : 'bg-[#1C0D11]/95 border-rose-500/60 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
        }`}>
          {toast.text}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 1 : PAGE D'ALBUM D'UNE ÉQUIPE */}
      {/* ========================================================================= */}
      {selectedTeam ? (
        <div className="space-y-6 animate-[fadeIn_0.2s]">
          {/* Navigation haute sobre */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedTeamTag(null)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#111522] hover:bg-[#181F32] border border-[#222B40] text-xs font-semibold text-text-faint hover:text-white transition-all cursor-pointer"
            >
              <span>←</span>
              <span>Retour</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-text-faint">
              <button
                onClick={handlePrevTeam}
                className="px-3 py-1.5 rounded-lg bg-[#111522] hover:bg-[#181F32] border border-[#222B40] text-xs font-semibold text-white transition-all cursor-pointer"
                title="Équipe précédente (Flèche Gauche)"
              >
                ‹ Précédente
              </button>
              <span className="font-mono text-white/40 px-1">{currentTeamIndex + 1} / {allTeams.length}</span>
              <button
                onClick={handleNextTeam}
                className="px-3 py-1.5 rounded-lg bg-[#111522] hover:bg-[#181F32] border border-[#222B40] text-xs font-semibold text-white transition-all cursor-pointer"
                title="Équipe suivante (Flèche Droite)"
              >
                Suivante ›
              </button>
            </div>
          </div>

          {/* En-tête sobre de l'équipe (AUCUN filigrane en arrière-plan, AUCUN tag) */}
          {(() => {
            const progress = getTeamProgress(selectedTeam.tag, myAlbum);
            const isClaimed = Boolean(claimedRewardsMap[selectedTeam.tag]);
            const diff = selectedTeam.difficulty;
            const isClaimable = progress.isComplete && !isClaimed;

            // Nombre de cartes pouvant être insérées dans cette équipe
            const cardsCanEnterCount = selectedTeam.cards.filter(c => {
              const status = getCardInsertionStatus(c, myCollection, myAlbum);
              return status.canEnter;
            }).length;

            return (
              <div className="rounded-2xl bg-gradient-to-r from-[#111624] via-[#0E121E] to-[#0A0D15] border border-[#20293D] p-6 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Logo officiel & Nom officiel de l'équipe (AUCUN TAG AFFICHÉ) */}
                  <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#141926] border border-white/10 p-3 shadow-xl shrink-0">
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)'
                        }}
                      />
                      <img
                        src={selectedTeam.logo}
                        alt=""
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                        onError={(e) => { e.currentTarget.src = '/logo/lol.webp'; }}
                      />
                    </div>

                    <div>
                      <h1 className="font-rajdhani text-2xl sm:text-4xl font-extrabold uppercase tracking-wide text-white m-0">
                        {selectedTeam.name}
                      </h1>
                    </div>
                  </div>

                  {/* Progression & Actions (Insérer / Réclamer) */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 min-w-[240px]">
                    <div className="w-full">
                      <div className="flex justify-between md:justify-end items-baseline gap-3 mb-1.5">
                        <span className="font-rajdhani font-bold text-xl sm:text-2xl text-white">
                          {progress.ownedCount} <span className="text-white/40 text-sm">/ {progress.totalCount} Cartes</span>
                        </span>
                        <span className="font-mono text-sm font-bold text-[#D4AF37]">
                          {progress.percentage}%
                        </span>
                      </div>

                      {/* Jauge lumineuse de progression de l'album */}
                      <div className="w-full md:w-56 bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress.percentage}%`,
                            background: progress.isComplete 
                              ? 'linear-gradient(90deg, #10B981, #34D399)' 
                              : 'linear-gradient(90deg, #3B82F6, #D4AF37)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions : Réclamer prime OU insérer cartes prêtes */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {cardsCanEnterCount > 0 && !isClaimable && (
                        <button
                          onClick={(e) => handleEnterAllTeamCards(selectedTeam.tag, e)}
                          className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/20"
                        >
                          Insérer les cartes prêtes ({cardsCanEnterCount})
                        </button>
                      )}

                      {isClaimable ? (
                        <button
                          onClick={(e) => handleClaimReward(selectedTeam.tag, e)}
                          className="px-5 py-2.5 rounded-xl font-rajdhani font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer animate-pulse"
                        >
                          🎁 RÉCLAMER LA PRIME (+{diff.rewardCredits} 💲)
                        </button>
                      ) : isClaimed ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg">
                          <span>✓</span>
                          <span>Prime de {diff.rewardCredits} 💲 perçue</span>
                        </div>
                      ) : (
                        <div className="text-xs font-mono font-semibold text-text-faint">
                          Prime : <span className="text-emerald-400 font-bold font-rajdhani text-sm">+{diff.rewardCredits} 💲</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Grille des cartes triées par rareté */}
          <div className="rounded-2xl bg-[#090C14] border border-[#1B2234] p-5 sm:p-7 shadow-[inset_0_0_50px_rgba(0,0,0,0.85)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
              {selectedTeam.cards.map(card => {
                const inAlbum = isCardInAlbum(card.id, myAlbum);
                const status = getCardInsertionStatus(card, myCollection, myAlbum);
                const dynamicCard = getDynamicCard ? getDynamicCard(card.id) : card;
                const rarityColor = RARITY_COLORS[card.rarity] || '#8b9bb4';

                // --- 1. CARTE INSCRITE DANS L'ALBUM (SANS CHECKMARK VERT) ---
                if (inAlbum) {
                  return (
                    <div
                      key={card.id}
                      onClick={() => setInspectedCard(dynamicCard)}
                      className="group relative flex flex-col items-center cursor-pointer transition-all duration-200 hover:-translate-y-2 select-none"
                    >
                      <CardIllustration card={dynamicCard} width={140} />
                    </div>
                  );
                }

                // --- 2. CARTE PRÊTE À ÊTRE INSÉRÉE (CONTRATS TRN SUFFISANTS OU À VIE) ---
                if (status.canEnter) {
                  return (
                    <div
                      key={card.id}
                      onClick={(e) => handleEnterCard(card.id, e)}
                      className="group relative flex flex-col items-center cursor-pointer transition-all duration-200 hover:-translate-y-2 select-none"
                    >
                      <div className="relative rounded-xl overflow-hidden ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                        <CardIllustration card={dynamicCard} width={140} />
                        {/* Voile d'action avec affichage clair du coût en TRN */}
                        <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 flex flex-col items-center justify-end p-2.5 transition-all">
                          <button
                            onClick={(e) => handleEnterCard(card.id, e)}
                            className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 text-black font-rajdhani font-bold text-xs uppercase tracking-wider shadow-lg transition-transform group-hover:scale-105 cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>📥</span>
                            <span>Insérer ({status.cost === 0 ? 'Gratuit' : `${status.cost} TRN`})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // --- 2 BIS. CARTE EN POSSESSION MAIS PAS ASSEZ DE CONTRATS TRN ---
                if (status.notEnough) {
                  return (
                    <div
                      key={card.id}
                      className="group relative flex flex-col items-center select-none opacity-80"
                      title={`Nécessite ${status.cost} contrats TRN pour être insérée (vous en avez ${status.currentContract})`}
                    >
                      <div className="relative rounded-xl overflow-hidden border border-white/20">
                        <CardIllustration card={dynamicCard} width={140} />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 text-center">
                          <span className="text-xl mb-1">🔒</span>
                          <span className="font-rajdhani font-bold text-xs text-amber-400 uppercase">
                            {status.cost} TRN requis
                          </span>
                          <span className="font-mono text-[10px] text-text-faint mt-0.5">
                            ({status.currentContract}/{status.cost} TRN)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // --- 3. CARTE NON DÉCOUVERTE : STRICTEMENT LE ? ET L'INDICATION DE LA RARETÉ ---
                return (
                  <div
                    key={card.id}
                    className="relative rounded-xl border-2 border-dashed bg-gradient-to-b from-[#101422]/90 to-[#0A0D15]/95 flex flex-col items-center justify-between p-4 transition-all duration-200 select-none group"
                    style={{
                      width: '140px',
                      height: `${140 * 1.4}px`,
                      borderColor: `${rarityColor}55`,
                      boxShadow: `inset 0 0 25px rgba(0,0,0,0.9), 0 0 15px ${rarityColor}18`,
                    }}
                  >
                    <div className="h-4" />

                    <span 
                      className="font-rajdhani font-black text-5xl transition-transform duration-200 group-hover:scale-110 drop-shadow-md select-none"
                      style={{ color: `${rarityColor}99` }}
                    >
                      ?
                    </span>

                    <span
                      className="font-rajdhani font-extrabold text-[12px] uppercase tracking-[2px] transition-colors"
                      style={{ 
                        color: rarityColor,
                        textShadow: `0 0 10px ${rarityColor}66`
                      }}
                    >
                      {card.rarity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VUE 2 : CATALOGUE PRINCIPAL DES ÉQUIPES */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* En-tête : Titre & Compteurs épurés & Bouton (?) d'info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1A2234]">
            <div className="flex items-center gap-3">
              <h2 className="font-rajdhani text-3xl font-extrabold tracking-wide text-white m-0">
                COLLECTION
              </h2>

              {/* Bouton "?" rond pour ouvrir le mini menu d'info rapide */}
              <button
                onClick={() => setShowInfoModal(true)}
                className="w-7 h-7 rounded-full bg-[#141926] hover:bg-[#1E2638] border border-[#2B354C] hover:border-[#D4AF37] text-xs font-bold text-white/80 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
                title="Comment fonctionne la collection ?"
              >
                ?
              </button>
            </div>

            {/* Statistiques clés : NOTIFS UNIQUEMENT QUAND UNE ÉQUIPE EST COMPLÈTE */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-faint">
              <div>
                Cartes : <span className="text-white font-bold font-mono text-sm">{overallStats.uniqueOwnedCount}</span>
                <span className="text-white/40 font-mono"> / {overallStats.totalCards}</span>
              </div>
              <div className="h-3 w-[1px] bg-[#222B40]" />
              <div>
                Équipes : <span className="text-white font-bold font-mono text-sm">{overallStats.completedTeams}</span>
                <span className="text-white/40 font-mono"> / {overallStats.totalTeams}</span>
              </div>
              <div className="h-3 w-[1px] bg-[#222B40]" />
              <div className="text-emerald-400 font-mono font-bold">
                💲 {myEconomy}
              </div>

              {/* NOTIFICATION CONSERVÉE UNIQUEMENT POUR RÉCLAMER UNE ÉQUIPE COMPLÈTE */}
              {overallStats.unclaimedCount > 0 && (
                <>
                  <div className="h-3 w-[1px] bg-[#222B40]" />
                  <button
                    onClick={() => setFilterClaimableOnly(!filterClaimableOnly)}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-rajdhani font-bold text-xs uppercase tracking-wider animate-pulse hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    🎁 {overallStats.unclaimedCount} Prime{overallStats.unclaimedCount > 1 ? 's' : ''} Prête{overallStats.unclaimedCount > 1 ? 's' : ''}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filtres de ligues & Champ de recherche sobre */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {LEAGUES.map(league => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedLeague === league
                      ? 'bg-white/15 text-white border border-white/25 shadow-sm'
                      : 'bg-[#111522] text-text-faint hover:text-white border border-transparent'
                  }`}
                >
                  {league}
                </button>
              ))}

              {overallStats.unclaimedCount > 0 && (
                <button
                  onClick={() => setFilterClaimableOnly(!filterClaimableOnly)}
                  className={`ml-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterClaimableOnly
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'text-amber-400 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20'
                  }`}
                >
                  À réclamer
                </button>
              )}
            </div>

            {/* Champ de recherche */}
            <div className="relative min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-faint">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une franchise..."
                className="w-full bg-[#0E121C] border border-[#1E2538] focus:border-[#D4AF37] rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-text-faint/50 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Grille des Équipes avec notification d'insertion directement sur chaque cadran */}
          {sortedAndFilteredTeams.length === 0 ? (
            <div className="p-16 text-center text-text-faint text-sm bg-[#0E121C] rounded-2xl border border-white/5">
              Aucune franchise ne correspond aux filtres.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
              {sortedAndFilteredTeams.map(team => {
                const progress = getTeamProgress(team.tag, myAlbum);
                const isClaimed = Boolean(claimedRewardsMap[team.tag]);
                const diff = team.difficulty;
                const isClaimable = progress.isComplete && !isClaimed;
                const cardsCanEnterCount = (team.cards || []).filter(c => {
                  const status = getCardInsertionStatus(c, myCollection, myAlbum);
                  return status.canEnter;
                }).length;

                return (
                  <div
                    key={team.tag}
                    onClick={() => setSelectedTeamTag(team.tag)}
                    className={`group relative flex flex-col items-center justify-between rounded-2xl bg-gradient-to-b from-[#111624] via-[#0E121E] to-[#0A0D15] border p-4 sm:p-5 transition-all duration-200 cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.7)] select-none min-h-[200px] ${
                      isClaimable
                        ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50'
                        : progress.isComplete
                          ? 'border-emerald-500/40 hover:border-emerald-400'
                          : cardsCanEnterCount > 0
                            ? 'border-blue-500/50 hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.18)] ring-1 ring-blue-500/30'
                            : 'border-[#1C2436] hover:border-[#303D58]'
                    }`}
                  >
                    {/* Indicateur de notification en haut du cadran d'équipe */}
                    <div className="w-full flex justify-end items-center h-4">
                      {cardsCanEnterCount > 0 && !progress.isComplete ? (
                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-400 font-rajdhani text-[10px] sm:text-[11px] font-bold uppercase tracking-wider animate-pulse shadow-sm whitespace-nowrap">
                          +{cardsCanEnterCount} à insérer
                        </span>
                      ) : progress.isComplete ? (
                        <span className="text-emerald-400 text-xs font-bold">✓</span>
                      ) : null}
                    </div>

                    {/* Logo de la franchise */}
                    <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 my-2">
                      <div 
                        className="absolute inset-0 rounded-full opacity-10 pointer-events-none group-hover:opacity-25 transition-opacity"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)'
                        }}
                      />
                      <img
                        src={team.logo}
                        alt=""
                        className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => { e.currentTarget.src = '/logo/lol.webp'; }}
                      />
                    </div>

                    {/* Nom officiel de l'équipe (AUCUN TAG AFFICHÉ) */}
                    <div className="w-full text-center my-1">
                      <div className="font-rajdhani text-sm sm:text-base font-bold text-white uppercase truncate tracking-wide group-hover:text-[#D4AF37] transition-colors">
                        {team.name}
                      </div>
                    </div>

                    {/* Progression dans l'album */}
                    <div className="w-full mt-2">
                      <div className="flex justify-between items-center text-[11px] font-mono font-semibold text-text-faint mb-1">
                        <span>{progress.ownedCount}/{progress.totalCount}</span>
                        <span>{progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: progress.isComplete ? '#10B981' : '#D4AF37'
                          }}
                        />
                      </div>
                    </div>

                    {/* Prime ou Réclamation */}
                    <div className="w-full pt-2.5 mt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="font-rajdhani font-bold text-emerald-400">
                        +{diff.rewardCredits} 💲
                      </span>

                      {isClaimable ? (
                        <button
                          onClick={(e) => handleClaimReward(team.tag, e)}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 text-black font-rajdhani font-bold text-xs uppercase transition-all cursor-pointer shadow-md"
                        >
                          Réclamer
                        </button>
                      ) : isClaimed ? (
                        <span className="text-emerald-400 text-xs font-semibold">
                          Réclamé
                        </span>
                      ) : cardsCanEnterCount > 0 ? (
                        <span className="text-blue-400 group-hover:text-blue-300 font-semibold transition-colors text-xs flex items-center gap-1">
                          Insérer →
                        </span>
                      ) : (
                        <span className="text-text-faint group-hover:text-white transition-colors text-xs">
                          Ouvrir →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE D'INFO RAPIDE : COMMENT ÇA MARCHE (?) */}
      {/* ========================================================================= */}
      {showInfoModal && (
        <div
          onClick={() => setShowInfoModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-white/15 bg-gradient-to-b from-[#111524] to-[#0A0D15] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📖</span>
                <h3 className="font-rajdhani text-xl font-bold uppercase tracking-wide text-white m-0">
                  Guide de la Collection
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-text-faint hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-text-faint">
              <div>
                <h4 className="font-rajdhani font-bold text-sm text-[#D4AF37] uppercase m-0 mb-1">
                  1. Coût d'insertion des cartes
                </h4>
                <p className="m-0 mb-2">
                  Sceller une carte dans l'album consomme des contrats de tournoi (TRN) selon sa rareté :
                </p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-white bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <div>• WANTED : <strong className="text-white">2 TRN</strong></div>
                  <div>• Légendaire : <strong className="text-amber-400">3 TRN</strong></div>
                  <div>• Épique : <strong className="text-pink-400">4 TRN</strong></div>
                  <div>• Rare : <strong className="text-cyan-400">5 TRN</strong></div>
                  <div>• Commune : <strong className="text-slate-300">6 TRN</strong></div>
                  <div>• Cartes À VIE : <strong className="text-emerald-400">Gratuit</strong></div>
                </div>
              </div>

              <div>
                <h4 className="font-rajdhani font-bold text-sm text-purple-400 uppercase m-0 mb-1">
                  2. Cartes Secrètes
                </h4>
                <p className="m-0">
                  Les cartes <strong className="text-white">SECRÈTES</strong> s'insèrent <strong>automatiquement</strong> (0 TRN) dès l'ouverture d'un pack et sont regroupées dans leur propre catégorie de ligue (ex: <em>SECRÈTES LPL</em>).
                </p>
              </div>

              <div>
                <h4 className="font-rajdhani font-bold text-sm text-emerald-400 uppercase m-0 mb-1">
                  3. Conservation Permanente
                </h4>
                <p className="m-0">
                  Une fois insérée, la carte reste <strong>scellée pour toujours</strong> dans votre collection. Même si vous la revendez sur le marché des transferts ou si ses contrats expirent, elle ne partira jamais !
                </p>
              </div>

              <div>
                <h4 className="font-rajdhani font-bold text-sm text-[#D4AF37] uppercase m-0 mb-1">
                  4. Primes d'Album
                </h4>
                <p className="m-0">
                  Chaque équipe complétée à 100% rapporte une prime en crédits (💲), calculée de façon non-linéaire selon la rareté et l'effort de complétion requis.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-rajdhani font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE D'INSPECTION D'UNE CARTE DE L'ALBUM */}
      {/* ========================================================================= */}
      {inspectedCard && (
        <div
          onClick={() => setInspectedCard(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-2xl border border-white/15 bg-[#0E121E] p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs"
          >
            <button
              onClick={() => setInspectedCard(null)}
              className="absolute top-3 right-3 text-text-faint hover:text-white text-base font-bold cursor-pointer"
            >
              ✕
            </button>

            <CardIllustration card={inspectedCard} width={180} />

            <div className="text-center w-full">
              <div className="text-xs font-semibold text-emerald-400">
                Inscrite à vie dans votre collection
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}