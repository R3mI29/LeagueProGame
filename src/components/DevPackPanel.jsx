import { useState, useMemo } from 'react';
import { socket } from '../api/socket';
import { PACK_TYPES, calculatePackProbabilities } from '../constants/packConfig';

const ALL_DEV_PACKS = [
  { ...PACK_TYPES.wanted, category: 'shop' },
  { ...PACK_TYPES.legendary, category: 'shop' },
  { ...PACK_TYPES.elite, category: 'shop' },
  { ...PACK_TYPES.standard, category: 'shop' },
  { ...PACK_TYPES.all_stars, category: 'milestones' },
  { ...PACK_TYPES.jumbo, category: 'milestones' },
  { ...PACK_TYPES.starter, category: 'milestones' },
  { ...PACK_TYPES.lck_pack, category: 'leagues' },
  { ...PACK_TYPES.lpl_pack, category: 'leagues' },
  { ...PACK_TYPES.lec_pack, category: 'leagues' },
  { ...PACK_TYPES.skin_pack, category: 'special' },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'Tous', filter: () => true },
  { id: 'shop', label: 'Boutique', filter: p => p.category === 'shop' },
  { id: 'milestones', label: 'Paliers', filter: p => p.category === 'milestones' },
  { id: 'leagues', label: 'Ligues', filter: p => p.category === 'leagues' },
  { id: 'special', label: 'Skins', filter: p => p.category === 'special' },
];

export default function DevPackPanel({ state }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [feedback, setFeedback] = useState(null);

  const myId = socket.id;
  const myBonusPacks = state?.bonusPacks?.[myId] || {};
  const totalReserved = Object.values(myBonusPacks).reduce((sum, count) => sum + (Number(count) || 0), 0);

  const showToast = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleGive = (packType, count = 1) => {
    socket.emit('dev-give-pack', { packType, count });
    showToast(`+${count} ${packType}`);
  };

  const handleOpenDirect = (packType) => {
    socket.emit('dev-open-pack', packType);
    showToast(`Ouverture directe : ${packType}`);
  };

  const handleGiveAll = () => {
    ALL_DEV_PACKS.forEach(p => socket.emit('dev-give-pack', { packType: p.id, count: 1 }));
    showToast(`+1 de chaque (${ALL_DEV_PACKS.length})`);
  };

  const handleGiveTopTier = () => {
    socket.emit('dev-give-pack', { packType: 'wanted', count: 3 });
    socket.emit('dev-give-pack', { packType: 'all_stars', count: 3 });
    showToast('+3 Wanted & +3 All-Stars');
  };

  const handleClear = () => {
    socket.emit('dev-clear-bonus-packs');
    showToast('Réserve vidée');
  };

  const filteredPacks = useMemo(() => {
    const tab = CATEGORY_TABS.find(t => t.id === activeCategory);
    return ALL_DEV_PACKS.filter(tab ? tab.filter : () => true);
  }, [activeCategory]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0D14] p-5 space-y-4">
      {/* En-tête compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h3 className="m-0 font-rajdhani font-black text-xl text-white uppercase tracking-wider">
            BOOSTERS DEV
          </h3>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {totalReserved} en réserve
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGiveAll}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-rajdhani font-bold text-xs uppercase cursor-pointer"
          >
            +1 TOUT
          </button>
          <button
            onClick={handleGiveTopTier}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-rajdhani font-bold text-xs uppercase cursor-pointer"
          >
            TOP TIER
          </button>
          <button
            onClick={() => socket.emit('dev-open-guaranteed-wanted')}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-rajdhani font-bold text-xs uppercase cursor-pointer"
          >
            5 WANTED
          </button>
          {totalReserved > 0 && (
            <button
              onClick={handleClear}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-rajdhani font-bold text-xs uppercase cursor-pointer"
            >
              VIDER
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="py-1.5 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
          {feedback}
        </div>
      )}

      {/* Filtres par onglets */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORY_TABS.map(tab => {
          const isActive = activeCategory === tab.id;
          const count = ALL_DEV_PACKS.filter(tab.filter).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold uppercase transition-all cursor-pointer border ${
                isActive
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-black/30 text-white/50 border-white/5 hover:text-white'
              }`}
            >
              {tab.label} <span className="opacity-50">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grille des boosters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredPacks.map(pack => {
          const currentCount = myBonusPacks[pack.id] || 0;
          const probs = pack.weights ? calculatePackProbabilities(pack.weights) : null;

          return (
            <div
              key={pack.id}
              className="flex flex-col justify-between p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all space-y-3"
            >
              <div>
                {/* Ligne En-tête */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 p-1 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <img
                        src={pack.logo || '/logo/others/League_of_legend.svg'}
                        alt=""
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-rajdhani font-black text-sm text-white uppercase truncate m-0">
                        {pack.name}
                      </h4>
                      <span className="text-[11px] font-mono text-white/40">
                        {pack.id === 'skin_pack' ? '1 Skin' : `${pack.size} Cartes`}
                      </span>
                    </div>
                  </div>

                  <span className={`font-mono text-xs font-bold shrink-0 ${currentCount > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                    {currentCount > 0 ? `x${currentCount}` : '0'}
                  </span>
                </div>

                {/* Probabilités synthétiques */}
                {probs && (
                  <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px] py-1 px-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <div><span className="text-white/40 block text-[9px]">C</span>{probs.Commune || 0}%</div>
                    <div><span className="text-sky-400/70 block text-[9px]">R</span>{probs.Rare || 0}%</div>
                    <div><span className="text-pink-400/70 block text-[9px]">E</span>{probs['Épique'] || 0}%</div>
                    <div><span className="text-amber-400/70 block text-[9px]">L</span>{probs['Légendaire'] || 0}%</div>
                    <div><span className="text-rose-400/70 block text-[9px]">W</span>{probs.WANTED || 0}%</div>
                  </div>
                )}
                {pack.id === 'skin_pack' && (
                  <div className="text-[10px] font-mono text-purple-300/80 py-1 text-center">
                    100% Skin Garanti
                  </div>
                )}
              </div>

              {/* Boutons d'action compacts */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => handleGive(pack.id, 1)}
                    className="py-1 rounded bg-white/5 hover:bg-white/10 text-white font-rajdhani font-bold text-xs uppercase cursor-pointer border border-white/10"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleGive(pack.id, 3)}
                    className="py-1 rounded bg-white/5 hover:bg-white/10 text-white font-rajdhani font-bold text-xs uppercase cursor-pointer border border-white/10"
                  >
                    +3
                  </button>
                  <button
                    onClick={() => handleGive(pack.id, 5)}
                    className="py-1 rounded bg-white/5 hover:bg-white/10 text-white font-rajdhani font-bold text-xs uppercase cursor-pointer border border-white/10"
                  >
                    +5
                  </button>
                </div>

                <button
                  onClick={() => handleOpenDirect(pack.id)}
                  className="w-full py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-rajdhani font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  Ouvrir (Test)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
