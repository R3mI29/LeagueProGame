import { useState } from 'react';
import { socket } from '../api/socket';

const PACK_OPTIONS = [
  {
    id: 'wanted',
    name: 'WANTED Suprême',
    size: 3,
    color: '#f43f5e',
    accentColor: '#fb7185',
    badge: 'WANTED',
    description: '3 cartes prestigieuses avec chance maximale de cartes WANTED.',
  },
  {
    id: 'skin_pack',
    name: 'Booster de Skins',
    size: 1,
    color: '#a855f7',
    accentColor: '#c084fc',
    badge: 'EXCLUSIF',
    description: 'Débloque un skin d’équipe aléatoire hors quête (ou 600 💲).',
  },
  {
    id: 'legendary',
    name: 'Booster Légendaire',
    size: 5,
    color: '#fbbf24',
    accentColor: '#fde047',
    badge: 'LÉGENDAIRE',
    description: '5 cartes avec forte probabilité de Légendaire et Épique.',
  },
  {
    id: 'elite',
    name: 'Booster Élite',
    size: 5,
    color: '#00e5ff',
    accentColor: '#67e8f9',
    badge: 'ÉLITE',
    description: '5 cartes avec au moins une carte Rare garantie.',
  },
  {
    id: 'standard',
    name: 'Booster Standard',
    size: 5,
    color: '#94a3b8',
    accentColor: '#cbd5e1',
    badge: 'STANDARD',
    description: '5 cartes pour alimenter la collection et le Trade-Up.',
  },
  {
    id: 'starter',
    name: 'Starter Pack',
    size: 6,
    color: '#10b981',
    accentColor: '#34d399',
    badge: 'DÉPART',
    description: '6 cartes de départ avec contrat garanti À VIE.',
  },
];

export default function DevPackPanel({ state }) {
  const [feedback, setFeedback] = useState(null);
  const myId = socket.id;
  const myBonusPacks = state?.bonusPacks?.[myId] || {};
  const totalReserved = Object.values(myBonusPacks).reduce((sum, count) => sum + (Number(count) || 0), 0);

  const showToast = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleGive = (packType, count = 1) => {
    socket.emit('dev-give-pack', { packType, count });
    const p = PACK_OPTIONS.find(x => x.id === packType);
    showToast(`+${count} ${p?.name || packType} ajouté(s) à la réserve !`);
  };

  const handleGiveAll = () => {
    PACK_OPTIONS.forEach(p => {
      socket.emit('dev-give-pack', { packType: p.id, count: 1 });
    });
    showToast('+1 de chaque pack ajouté en réserve (6 packs au total) !');
  };

  const handleGiveTopTier = () => {
    socket.emit('dev-give-pack', { packType: 'wanted', count: 3 });
    socket.emit('dev-give-pack', { packType: 'skin_pack', count: 3 });
    showToast('+3 Wanted & +3 Skins ajoutés en réserve !');
  };

  const handleClear = () => {
    socket.emit('dev-clear-bonus-packs');
    showToast('Réserve de packs réinitialisée.');
  };

  return (
    <div className="rounded-2xl border border-[#222838] bg-[#11141E] p-6 space-y-6">
      {/* En-tête avec compteur et actions globales */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1A2234]">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="m-0 font-rajdhani font-black text-2xl tracking-wide text-white uppercase">
              RÉCOMPENSES DE PACKS (RÉSERVE)
            </h3>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {totalReserved} pack(s) en réserve
            </span>
          </div>
          <p className="text-text-muted text-xs mt-1 m-0">
            Les packs givés apparaissent dans l'onglet <strong className="text-white">Boutique → Boosters</strong> prêts à être ouverts avec leurs animations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGiveAll}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-rajdhani font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
          >
            🎁 +1 DE CHAQUE PACK
          </button>
          <button
            onClick={handleGiveTopTier}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-rajdhani font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
          >
            👑 +3 WANTED & +3 SKINS
          </button>
          <button
            onClick={() => socket.emit('dev-open-guaranteed-wanted')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-black font-rajdhani font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
          >
            👑 OUVRIR 5 WANTED
          </button>
          {totalReserved > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-rajdhani font-bold text-xs uppercase cursor-pointer transition-all"
            >
              🧹 VIDER
            </button>
          )}
        </div>
      </div>

      {/* Message de confirmation rapide */}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center justify-between animate-[fadeIn_0.2s]">
          <span>✓ {feedback}</span>
          <span className="text-[10px] text-emerald-400/70">Visible dans Boutique</span>
        </div>
      )}

      {/* Grille des 6 types de packs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PACK_OPTIONS.map(pack => {
          const currentCount = myBonusPacks[pack.id] || 0;

          return (
            <div
              key={pack.id}
              className="flex flex-col justify-between p-5 rounded-2xl bg-[#0C0E14] border border-[#1E2538] hover:border-[#38486F] transition-all space-y-4 shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider"
                    style={{
                      backgroundColor: `${pack.color}20`,
                      color: pack.accentColor,
                      border: `1px solid ${pack.color}50`,
                    }}
                  >
                    {pack.badge}
                  </span>
                  <span className="font-mono text-xs font-bold text-white/50">
                    {pack.id === 'skin_pack' ? '1 Skin' : `${pack.size} Cartes`}
                  </span>
                </div>

                <h4 className="font-rajdhani font-black text-xl text-white uppercase tracking-wide m-0">
                  {pack.name}
                </h4>

                <p className="text-text-muted text-xs leading-relaxed mt-1 mb-0 min-h-[36px]">
                  {pack.description}
                </p>
              </div>

              {/* État de la réserve & Boutons d'ajout */}
              <div className="pt-3 border-t border-white/5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted">En réserve :</span>
                  <span className={`font-black ${currentCount > 0 ? 'text-emerald-400' : 'text-white/40'}`}>
                    {currentCount > 0 ? `x${currentCount}` : '0'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleGive(pack.id, 1)}
                    className="py-2 rounded-lg bg-white/5 hover:bg-white/15 text-white font-rajdhani font-bold text-xs uppercase cursor-pointer border border-white/10 transition-all active:scale-95"
                  >
                    +1 PACK
                  </button>
                  <button
                    onClick={() => handleGive(pack.id, 3)}
                    className="py-2 rounded-lg bg-white/5 hover:bg-white/15 text-white font-rajdhani font-bold text-xs uppercase cursor-pointer border border-white/10 transition-all active:scale-95"
                  >
                    +3 PACKS
                  </button>
                  <button
                    onClick={() => handleGive(pack.id, 5)}
                    className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-rajdhani font-bold text-xs uppercase cursor-pointer border border-white/20 transition-all active:scale-95"
                  >
                    +5 PACKS
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
