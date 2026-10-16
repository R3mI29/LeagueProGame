import { socket } from '../../../api/socket';
import { SKINS, canUseSkin, getEquippedSkinId } from '../../../constants/teamSkins';
import { RARITY_COLORS } from '../../../constants/cardPlayers';
import TeamSkinFrame from '../../../components/TeamSkinFrame';

export default function SkinsTab({ state, myId }) {
  const me = state.participants?.find(p => p.id === myId);
  const equipped = getEquippedSkinId(state, myId);

  const ownedSkins = SKINS.filter(skin => canUseSkin(state, myId, skin.id));
  const lockedSkins = SKINS.filter(skin => !canUseSkin(state, myId, skin.id));
  const orderedSkins = [...ownedSkins, ...lockedSkins];

  const equip = (skinId) => socket.emit('equip-skin', skinId);

  return (
    <div className="animate-[fadeIn_0.3s]">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="m-0 font-['Oswald'] text-[24px] tracking-[0.5px] text-white">CASIER DE SKINS</h2>
        <div className="text-sm text-text-faint">
          {ownedSkins.length} / {SKINS.length} skin{ownedSkins.length > 1 ? 's' : ''} débloqué{ownedSkins.length > 1 ? 's' : ''} · Personnalise le cadre de ton équipe en match
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
        {orderedSkins.map(skin => {
          const isUnlocked = canUseSkin(state, myId, skin.id);

          // --- RENDU CACHE MYSTÈRE (SKIN VERROUILLÉ) ---
          if (!isUnlocked) {
            return (
              <div key={skin.id} className="flex flex-col gap-3 select-none">
                <div 
                  className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-[#262D40] bg-[#0C0E14] p-5 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.85)]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 10px, transparent 10px, transparent 20px)'
                  }}
                >
                  <div className="flex flex-col items-center justify-center gap-2.5 py-2 min-h-[132px] text-center">
                    <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[#222838] bg-[#131722] text-xl shadow-md">
                      🔒
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-faint">
                      Indice d'obtention
                    </div>
                    <div className="max-w-[210px] rounded bg-[#141824] border border-[#222838] px-3 py-1.5 text-xs font-medium text-[#D4AF37]">
                      « {skin.hint || 'Condition secrète à découvrir'} »
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 opacity-60">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text-faint">???</div>
                    <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#4A5265]">
                      MYSTÈRE
                    </div>
                  </div>

                  <span className="shrink-0 rounded border border-[#222838] bg-[#11141E] px-3 py-1.5 text-xs font-bold text-text-faint">
                    VERROUILLÉ
                  </span>
                </div>
              </div>
            );
          }

          // --- RENDU NORMAL (SKIN DÉBLOQUÉ) ---
          const isEquipped = equipped === skin.id;
          const rarityColor = RARITY_COLORS[skin.rarity] || '#8b9bb4';

          return (
            <div key={skin.id} className="flex flex-col gap-3">
              <TeamSkinFrame skinId={skin.id} className="p-5">
                <div className="flex flex-col items-center gap-2 py-2">
                  {me?.logo ? (
                    <img src={me.logo} alt="" className="h-[48px] w-[48px] object-contain" />
                  ) : (
                    <div className="h-[48px] w-[48px] rounded-xl bg-border" />
                  )}
                  <div className="font-rajdhani text-lg uppercase text-white">{me?.name || 'Mon équipe'}</div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="h-9 w-6 rounded-sm border border-white/15 bg-white/5" />
                    ))}
                  </div>
                </div>
              </TeamSkinFrame>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{skin.name}</div>
                  <div className="text-[11px] font-bold uppercase tracking-[1px]" style={{ color: rarityColor }}>
                    {skin.rarity}
                  </div>
                </div>

                {isEquipped ? (
                  <span className="shrink-0 rounded bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-black">
                    ÉQUIPÉ ✓
                  </span>
                ) : (
                  <button
                    onClick={() => equip(skin.id)}
                    className="shrink-0 cursor-pointer rounded border border-[#D4AF37] bg-transparent px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition-colors hover:bg-[#D4AF37] hover:text-black"
                  >
                    ÉQUIPER
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}