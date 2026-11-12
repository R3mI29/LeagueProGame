import { useState, useMemo } from 'react';
import { calculatePowerRankingScore, PLACEMENT_CONFIG } from '../../../constants/rankingConfig';

export default function HallOfFameTab({ state = {}, myId = '', sortedLeaderboard = [], seasonScores = {} }) {
  const [mobileTab, setMobileTab] = useState('both'); // 'both' | 'points' | 'power'

  const currentYear = state?.year || 1;
  const participants = state?.participants || sortedLeaderboard || [];

  // 1. Classement par Points (basé sur les résultats accumulés)
  const pointsRanking = useMemo(() => {
    return [...participants].sort((a, b) => {
      const ptsA = seasonScores?.[a.id]?.points || 0;
      const ptsB = seasonScores?.[b.id]?.points || 0;
      if (ptsB !== ptsA) return ptsB - ptsA;
      const titlesA = seasonScores?.[a.id]?.titles || 0;
      const titlesB = seasonScores?.[b.id]?.titles || 0;
      if (titlesB !== titlesA) return titlesB - titlesA;
      return a.name.localeCompare(b.name);
    });
  }, [participants, seasonScores]);

  // 2. Power Ranking (basé sur les résultats récents uniquement)
  const powerRanking = useMemo(() => {
    const list = participants.map(p => {
      const prScore = calculatePowerRankingScore(p.id, state?.recentPlacements, participants, state);
      return {
        ...p,
        prScore,
      };
    });
    return list.sort((a, b) => {
      if (b.prScore !== a.prScore) return b.prScore - a.prScore;
      const ptsA = seasonScores?.[a.id]?.points || 0;
      const ptsB = seasonScores?.[b.id]?.points || 0;
      if (ptsB !== ptsA) return ptsB - ptsA;
      return a.name.localeCompare(b.name);
    });
  }, [participants, state, seasonScores]);

  return (
    <div className="w-full space-y-6 animate-[fadeIn_0.2s] text-white select-none">
      {/* Barre supérieure sobre */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="font-rajdhani font-black text-2xl sm:text-3xl uppercase tracking-wider text-white">
            Classements
          </span>
          <span className="text-xs font-mono text-white/40 uppercase">
            Saison • Année {currentYear}
          </span>
        </div>

        {/* Toggle mobile si écran étroit */}
        <div className="flex sm:hidden items-center gap-1 bg-[#0E121E] p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setMobileTab('both')}
            className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold uppercase transition-all ${
              mobileTab === 'both' ? 'bg-white/15 text-white' : 'text-white/40'
            }`}
          >
            Tous
          </button>
          <button 
            onClick={() => setMobileTab('points')}
            className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold uppercase transition-all ${
              mobileTab === 'points' ? 'bg-amber-400 text-black' : 'text-white/40'
            }`}
          >
            Points
          </button>
          <button 
            onClick={() => setMobileTab('power')}
            className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold uppercase transition-all ${
              mobileTab === 'power' ? 'bg-sky-400 text-black' : 'text-white/40'
            }`}
          >
            Power
          </button>
        </div>
      </div>

      {/* Grille pleine largeur : 2 colonnes spacieuses */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* ========================================================================= */}
        {/* COLONNE 1 : CLASSEMENT PAR POINTS */}
        {/* ========================================================================= */}
        {(mobileTab === 'both' || mobileTab === 'points') && (
          <div className="w-full space-y-3">
            <div className="flex items-baseline justify-between px-2 pb-2 border-b border-white/10">
              <span className="font-rajdhani font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                Classement Général
              </span>
              <span className="font-mono text-xs font-bold text-amber-400 uppercase">
                Points de Saison
              </span>
            </div>

            <div className="space-y-2">
              {pointsRanking.map((item, index) => {
                const rank = index + 1;
                const isMyTeam = item.id === myId;
                const points = seasonScores?.[item.id]?.points || 0;
                const titles = seasonScores?.[item.id]?.titles || 0;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                      isMyTeam
                        ? 'bg-amber-500/10 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)] text-amber-200'
                        : rank === 1
                        ? 'bg-gradient-to-r from-amber-500/10 via-[#101420] to-[#0C0F17] border border-amber-400/30'
                        : rank === 2
                        ? 'bg-gradient-to-r from-slate-400/10 via-[#101420] to-[#0C0F17] border border-slate-400/20'
                        : rank === 3
                        ? 'bg-gradient-to-r from-orange-500/10 via-[#101420] to-[#0C0F17] border border-orange-500/20'
                        : 'bg-[#0E121E] hover:bg-[#131928] border border-white/5'
                    }`}
                  >
                    {/* Rang & Équipe */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`w-8 text-center font-rajdhani font-black text-lg sm:text-xl ${
                        rank === 1 ? 'text-amber-400' :
                        rank === 2 ? 'text-slate-300' :
                        rank === 3 ? 'text-orange-400' :
                        'text-white/40'
                      }`}>
                        #{rank}
                      </span>

                      <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 p-1 bg-white/5 rounded-lg border border-white/10">
                        <img 
                          src={item.logo} 
                          alt={item.name} 
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                          onError={(e) => { e.currentTarget.src = '/logo/others/League_of_legend.svg'; }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-rajdhani font-black text-base sm:text-lg text-white uppercase tracking-wide truncate">
                            {item.name}
                          </span>
                          {isMyTeam && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-mono font-black uppercase tracking-wider shrink-0">
                              Vous
                            </span>
                          )}
                        </div>
                        {titles > 0 && (
                          <span className="text-[11px] font-mono font-bold text-amber-400 block">
                            {titles} titre{titles > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right shrink-0 pl-3">
                      <span className="font-mono font-black text-xl sm:text-2xl text-amber-400 block">
                        {points} <span className="text-xs font-bold text-white/40">PTS</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COLONNE 2 : POWER RANKING */}
        {/* ========================================================================= */}
        {(mobileTab === 'both' || mobileTab === 'power') && (
          <div className="w-full space-y-3">
            <div className="flex items-baseline justify-between px-2 pb-2 border-b border-white/10">
              <span className="font-rajdhani font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                Power Ranking
              </span>
              <span className="font-mono text-xs font-bold text-sky-400 uppercase">
                Forme Récente
              </span>
            </div>

            <div className="space-y-2">
              {powerRanking.map((item, index) => {
                const rank = index + 1;
                const isMyTeam = item.id === myId;
                const recent = (state?.recentPlacements?.[item.id] || []).slice(-4).reverse();

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                      isMyTeam
                        ? 'bg-sky-500/10 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.15)] text-sky-200'
                        : rank === 1
                        ? 'bg-gradient-to-r from-sky-500/10 via-[#101420] to-[#0C0F17] border border-sky-400/30'
                        : rank === 2
                        ? 'bg-gradient-to-r from-sky-400/5 via-[#101420] to-[#0C0F17] border border-sky-400/20'
                        : rank === 3
                        ? 'bg-gradient-to-r from-sky-400/5 via-[#101420] to-[#0C0F17] border border-sky-400/20'
                        : 'bg-[#0E121E] hover:bg-[#131928] border border-white/5'
                    }`}
                  >
                    {/* Rang & Équipe */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`w-8 text-center font-rajdhani font-black text-lg sm:text-xl ${
                        rank === 1 ? 'text-sky-400' :
                        rank === 2 ? 'text-sky-300' :
                        rank === 3 ? 'text-sky-200' :
                        'text-white/40'
                      }`}>
                        #{rank}
                      </span>

                      <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 p-1 bg-white/5 rounded-lg border border-white/10">
                        <img 
                          src={item.logo} 
                          alt={item.name} 
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                          onError={(e) => { e.currentTarget.src = '/logo/others/League_of_legend.svg'; }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-rajdhani font-black text-base sm:text-lg text-white uppercase tracking-wide truncate">
                            {item.name}
                          </span>
                          {isMyTeam && (
                            <span className="px-1.5 py-0.2 rounded bg-sky-400 text-black text-[9px] font-mono font-black uppercase tracking-wider shrink-0">
                              Vous
                            </span>
                          )}
                        </div>

                        {/* Pilules des derniers résultats */}
                        <div className="flex items-center gap-1 mt-0.5">
                          {recent.length > 0 ? (
                            recent.map((p, i) => {
                              const cfg = PLACEMENT_CONFIG[p] || PLACEMENT_CONFIG['N/A'];
                              return (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase"
                                  style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                                >
                                  {cfg.short}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] font-mono text-white/30 uppercase">
                              Aucun tournoi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score de Forme */}
                    <div className="text-right shrink-0 pl-3">
                      <span className="font-mono font-black text-xl sm:text-2xl text-sky-400 block">
                        {item.prScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
