import React, { useState, useEffect, useMemo } from 'react';
import { socket } from '../../../api/socket';
import { RARITY_COLORS, getCardTeamTags } from '../../../constants/cardPlayers';
import CardIllustration from '../../../components/CardIllustration';
import {
  getAllCollectionTeams,
  getTeamProgress,
  getOverallCollectionStats,
  isCardInAlbum,
  isTeamMilestoneClaimed,
  getClaimableTeamMilestones,
} from '../../../constants/collectionConfig';

const LEAGUES = ['Toutes', 'LCK', 'LPL', 'LEC', 'LCS'];

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
  const [inspectedCard, setInspectedCard] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [toast, setToast] = useState(null);

  const allTeams = useMemo(() => getAllCollectionTeams(), []);
  const overallStats = useMemo(
    () => getOverallCollectionStats(myAlbum, state, myId, myCollection),
    [myAlbum, state, myId, myCollection]
  );
  const claimedRewardsMap = state?.collectionRewardsClaimed?.[myId] || {};

  useEffect(() => {
    const onRewardClaimed = (data) => {
      playCelebrationSound();
      setToast({
        type: 'success',
        text: `+${data.rewardAmount} $ crédits ajoutés !`,
      });
      setTimeout(() => setToast(null), 3000);
    };

    const onRewardError = (data) => {
      setToast({ type: 'error', text: data.message });
      setTimeout(() => setToast(null), 3500);
    };

    socket.on('collection-reward-claimed', onRewardClaimed);
    socket.on('collection-reward-error', onRewardError);

    return () => {
      socket.off('collection-reward-claimed', onRewardClaimed);
      socket.off('collection-reward-error', onRewardError);
    };
  }, []);

  const selectedTeam = useMemo(() => {
    if (!selectedTeamTag) return null;
    return allTeams.find((t) => t.tag === selectedTeamTag) || null;
  }, [selectedTeamTag, allTeams]);

  // Navigation Équipe Précédente / Suivante
  const currentTeamIndex = useMemo(() => {
    if (!selectedTeamTag) return -1;
    return allTeams.findIndex((t) => t.tag === selectedTeamTag);
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

  // Filtrage et tri des équipes (les équipes complétées prêtes à réclamer en premier)
  const sortedAndFilteredTeams = useMemo(() => {
    return allTeams
      .filter((team) => {
        if (selectedLeague !== 'Toutes' && team.league !== selectedLeague) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = team.name.toLowerCase().includes(q);
          const matchTag = team.tag.toLowerCase().includes(q);
          const matchPlayer = team.cards.some((c) => c.baseName.toLowerCase().includes(q));
          if (!matchName && !matchTag && !matchPlayer) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const claimableA = getClaimableTeamMilestones(a.tag, myAlbum, claimedRewardsMap, myCollection).length > 0 ? 1 : 0;
        const claimableB = getClaimableTeamMilestones(b.tag, myAlbum, claimedRewardsMap, myCollection).length > 0 ? 1 : 0;
        if (claimableB !== claimableA) return claimableB - claimableA;

        const progA = getTeamProgress(a.tag, myAlbum, myCollection);
        const progB = getTeamProgress(b.tag, myAlbum, myCollection);
        if (progB.percentage !== progA.percentage) return progB.percentage - progA.percentage;
        return b.cardCount - a.cardCount;
      });
  }, [allTeams, selectedLeague, searchQuery, myAlbum, claimedRewardsMap, myCollection]);

  const handleClaimTeamReward = (teamTag, e) => {
    if (e) e.stopPropagation();
    socket.emit('claim-collection-reward', { teamTag, percent: 100 });
  };

  return (
    <div className="text-white select-none">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md transition-all animate-[bounceIn_0.2s] ${
            toast.type === 'success'
              ? 'bg-[#0B1A12]/95 border-emerald-500/60 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
              : 'bg-[#1C0D11]/95 border-rose-500/60 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
          }`}
        >
          {toast.text}
        </div>
      )}

      {selectedTeam ? (
        /* ========================================================================= */
        /* VUE 1 : DÉTAIL D'UNE ÉQUIPE */
        /* ========================================================================= */
        <div className="space-y-6 animate-[fadeIn_0.2s]">
          {/* Barre d'outils de navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2234]">
            <button
              onClick={() => setSelectedTeamTag(null)}
              className="flex items-center gap-2 text-text-faint hover:text-white transition-colors text-xs font-bold font-rajdhani uppercase tracking-wider cursor-pointer group"
            >
              <span className="transition-transform group-hover:-translate-x-1">‹</span>
              <span>Retour à la collection</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevTeam}
                className="px-3 py-1 rounded-lg bg-[#141926] hover:bg-[#1E2638] text-white/70 hover:text-white text-xs font-bold transition-all border border-[#222B40] cursor-pointer"
                title="Équipe précédente (Flèche gauche)"
              >
                ‹ Précédente
              </button>
              <button
                onClick={handleNextTeam}
                className="px-3 py-1 rounded-lg bg-[#141926] hover:bg-[#1E2638] text-white/70 hover:text-white text-xs font-bold transition-all border border-[#222B40] cursor-pointer"
                title="Équipe suivante (Flèche droite)"
              >
                Suivante ›
              </button>
            </div>
          </div>

          {/* En-tête sobre de l'équipe */}
          {(() => {
            const progress = getTeamProgress(selectedTeam.tag, myAlbum, myCollection);
            const diff = selectedTeam.difficulty;
            const isClaimed = isTeamMilestoneClaimed(selectedTeam.tag, 100, claimedRewardsMap);
            const isClaimable = progress.isComplete && !isClaimed;

            return (
              <div className="rounded-2xl bg-gradient-to-r from-[#111624] via-[#0E121E] to-[#0A0D15] border border-[#20293D] p-6 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Logo & Nom */}
                  <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#141926] border border-white/10 p-3 shadow-xl shrink-0">
                      <div
                        className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, ${diff.color}55 0%, transparent 70%)`,
                        }}
                      />
                      <img
                        src={selectedTeam.logo}
                        alt=""
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                        onError={(e) => {
                          e.currentTarget.src = '/logo/lol.webp';
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="font-rajdhani text-2xl sm:text-4xl font-extrabold uppercase tracking-wide text-white m-0">
                          {selectedTeam.name}
                        </h1>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-rajdhani font-black tracking-wider uppercase border"
                          style={{
                            color: diff.color,
                            backgroundColor: `${diff.color}15`,
                            borderColor: `${diff.color}40`,
                          }}
                        >
                          {diff.label}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs font-mono font-bold text-white/50 uppercase">
                          Ligue : {selectedTeam.league}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progression & Réclamation unique */}
                  <div className="flex flex-col items-start md:items-end justify-between gap-3 min-w-[280px]">
                    <div className="w-full">
                      <div className="flex justify-between md:justify-end items-baseline gap-3 mb-1.5">
                        <span className="font-rajdhani font-bold text-xl sm:text-2xl text-white">
                          {progress.ownedCount}{' '}
                          <span className="text-white/40 text-sm">/ {progress.totalCount} Cartes</span>
                        </span>
                        <span className="font-mono text-sm font-bold" style={{ color: diff.color }}>
                          {progress.percentage}%
                        </span>
                      </div>

                      {/* Jauge de progression */}
                      <div className="w-full md:w-64 bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress.percentage}%`,
                            background: progress.isComplete
                              ? 'linear-gradient(90deg, #10B981, #34D399)'
                              : 'linear-gradient(90deg, #3B82F6, #D4AF37)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Action de récompense */}
                    <div>
                      {isClaimed ? (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                          ✓ Réclamé (+{diff.rewardCredits} $)
                        </div>
                      ) : isClaimable ? (
                        <button
                          onClick={(e) => handleClaimTeamReward(selectedTeam.tag, e)}
                          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-rajdhani font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all"
                        >
                          Réclamer (+{diff.rewardCredits} $)
                        </button>
                      ) : (
                        <div className="text-right text-xs text-white/50 font-mono">
                          +{diff.rewardCredits} $ à 100%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Grille des cartes de l'équipe */}
          <div className="rounded-2xl bg-[#090C14] border border-[#1B2234] p-5 sm:p-7 shadow-[inset_0_0_50px_rgba(0,0,0,0.85)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
              {selectedTeam.cards.map((card) => {
                const inAlbum = isCardInAlbum(card.id, myAlbum, myCollection);
                const dynamicCard = getDynamicCard ? getDynamicCard(card.id) : card;
                const rarityColor = RARITY_COLORS[card.rarity] || '#8b9bb4';
                const cardTeams = getCardTeamTags(card);
                const isMultiTeam = cardTeams.length > 1;

                // 1. CARTE ENREGISTRÉE DANS LA COLLECTION
                if (inAlbum) {
                  return (
                    <div
                      key={card.id}
                      onClick={() => setInspectedCard(dynamicCard)}
                      className="group relative flex flex-col items-center cursor-pointer transition-all duration-200 hover:-translate-y-2 select-none"
                    >
                      {isMultiTeam && (
                        <div
                          className="absolute -top-2 -left-2 z-30 px-2 py-0.5 rounded-md bg-[#0F1422]/95 border border-[#4CE0D2]/70 text-[#4CE0D2] font-rajdhani font-black text-[10px] tracking-wider shadow-md backdrop-blur-sm"
                          title={`Appartient à : ${cardTeams.join(' & ')} (Inscrite dans toutes ses équipes)`}
                        >
                          {cardTeams.join(' & ')}
                        </div>
                      )}
                      <CardIllustration card={dynamicCard} width={140} />
                    </div>
                  );
                }

                // 2. CARTE NON POSSÉDÉE
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
                        textShadow: `0 0 10px ${rarityColor}66`,
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
        /* VUE 2 : CATALOGUE DES FRANCHISES */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* En-tête : Titre & Compteurs épurés */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1A2234]">
            <div className="flex items-center gap-3">
              <h2 className="font-rajdhani text-3xl font-extrabold tracking-wide text-white m-0">
                COLLECTION
              </h2>

              <button
                onClick={() => setShowInfoModal(true)}
                className="w-7 h-7 rounded-full bg-[#141926] hover:bg-[#1E2638] border border-[#2B354C] hover:border-[#D4AF37] text-xs font-bold text-white/80 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
                title="Comment fonctionne la collection ?"
              >
                ?
              </button>
            </div>

            {/* Statistiques clés */}
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
                $ {myEconomy}
              </div>
            </div>
          </div>

          {/* Filtres de ligues & Champ de recherche */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {LEAGUES.map((league) => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-3 py-1.5 rounded-xl font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                    selectedLeague === league
                      ? 'bg-[#182030] text-white border-white/30 shadow-sm'
                      : 'bg-transparent text-text-faint border-transparent hover:text-white'
                  }`}
                >
                  {league}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une franchise..."
                className="w-full bg-[#0E121C] border border-[#1E2538] focus:border-[#D4AF37] rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-faint/50 outline-none transition-colors"
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

          {/* Grille des Équipes */}
          {sortedAndFilteredTeams.length === 0 ? (
            <div className="p-16 text-center text-text-faint text-sm bg-[#0E121C] rounded-2xl border border-white/5">
              Aucune franchise ne correspond aux filtres.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
              {sortedAndFilteredTeams.map((team) => {
                const progress = getTeamProgress(team.tag, myAlbum, myCollection);
                const diff = team.difficulty;
                const claimableMilestones = getClaimableTeamMilestones(team.tag, myAlbum, claimedRewardsMap, myCollection);
                const hasClaimableReward = claimableMilestones.length > 0;
                const isFullyClaimed = isTeamMilestoneClaimed(team.tag, 100, claimedRewardsMap);

                return (
                  <div
                    key={team.tag}
                    onClick={() => setSelectedTeamTag(team.tag)}
                    className={`group relative flex flex-col items-center justify-between rounded-2xl bg-gradient-to-b from-[#111624] via-[#0E121E] to-[#0A0D15] border p-4 sm:p-5 transition-all duration-200 cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.7)] select-none min-h-[200px] ${
                      hasClaimableReward
                        ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50'
                        : progress.isComplete
                        ? 'border-emerald-500/40 hover:border-emerald-400'
                        : 'border-[#1C2436] hover:border-[#303D58]'
                    }`}
                  >
                    {/* Indicateur de statut subtil en haut */}
                    <div className="w-full flex justify-end items-center h-4">
                      {isFullyClaimed ? (
                        <span className="text-emerald-400 text-xs font-bold">✓</span>
                      ) : null}
                    </div>

                    {/* Logo de la franchise */}
                    <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 my-2">
                      <div
                        className="absolute inset-0 rounded-full opacity-10 pointer-events-none group-hover:opacity-25 transition-opacity"
                        style={{
                          background: `radial-gradient(circle, ${diff.color} 0%, transparent 70%)`,
                        }}
                      />
                      <img
                        src={team.logo}
                        alt=""
                        className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.src = '/logo/lol.webp';
                        }}
                      />
                    </div>

                    {/* Nom officiel de l'équipe */}
                    <div className="w-full text-center my-1">
                      <div className="font-rajdhani text-sm sm:text-base font-bold text-white uppercase truncate tracking-wide group-hover:text-[#D4AF37] transition-colors">
                        {team.name}
                      </div>
                    </div>

                    {/* Progression dans l'album */}
                    <div className="w-full mt-2">
                      <div className="flex justify-between items-center text-[11px] font-mono font-semibold text-text-faint mb-1">
                        <span>
                          {progress.ownedCount}/{progress.totalCount}
                        </span>
                        <span>{progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress.percentage}%`,
                            background: progress.isComplete
                              ? '#10B981'
                              : 'linear-gradient(90deg, #3B82F6, #D4AF37)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Récompense : affichée une seule fois */}
                    <div className="w-full pt-2.5 mt-2 border-t border-white/10 flex items-center justify-center text-xs">
                      {hasClaimableReward ? (
                        <button
                          onClick={(e) => handleClaimTeamReward(team.tag, e)}
                          className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-rajdhani font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Réclamer (+{diff.rewardCredits} $)
                        </button>
                      ) : isFullyClaimed ? (
                        <span className="text-emerald-400/80 font-mono text-xs">
                          ✓ Complétée
                        </span>
                      ) : (
                        <span className="font-mono text-white/50 text-xs">
                          +{diff.rewardCredits} $
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
              <h3 className="font-rajdhani text-xl font-bold uppercase tracking-wide text-white m-0">
                Guide de la Collection
              </h3>
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
                  1. Rangement Automatique & Gratuit
                </h4>
                <p className="m-0">
                  Chaque nouvelle carte obtenue rejoint <strong>automatiquement</strong> votre collection permanente sans déduire aucune année de contrat.
                </p>
              </div>

              <div>
                <h4 className="font-rajdhani font-bold text-sm text-emerald-400 uppercase m-0 mb-1">
                  2. Conservation Définitive
                </h4>
                <p className="m-0">
                  Une carte découverte reste <strong>scellée pour toujours</strong> dans l'album, même si ses contrats actifs expirent.
                </p>
              </div>

              <div>
                <h4 className="font-rajdhani font-bold text-sm text-[#38BDF8] uppercase m-0 mb-1">
                  3. Récompense de Finition (100%)
                </h4>
                <p className="m-0">
                  Réunissez tous les joueurs d'une franchise pour débloquer sa récompense (jusqu'à 1 200 $ pour les plus grandes équipes), calculée selon le nombre de cartes et leur rareté.
                </p>
              </div>

              <div>
                <h4 className="font-rajdhani font-bold text-sm text-[#4CE0D2] uppercase m-0 mb-1">
                  4. Cartes Multi-Équipes
                </h4>
                <p className="m-0">
                  Une carte représentant plusieurs équipes s'enregistre simultanément dans toutes ses franchises associées.
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
              {getCardTeamTags(inspectedCard).length > 1 && (
                <div className="mt-2 text-xs font-rajdhani font-bold text-[#4CE0D2] bg-[#4CE0D2]/10 border border-[#4CE0D2]/30 px-3 py-1.5 rounded-lg">
                  Franchises : {getCardTeamTags(inspectedCard).join(' & ')}<br />
                  <span className="text-[11px] text-white/60 font-normal">
                    Inscrite automatiquement dans toutes ses équipes
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
