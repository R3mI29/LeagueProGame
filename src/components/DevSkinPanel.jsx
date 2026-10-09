import { socket } from '../api/socket';
import { SKINS } from '../constants/teamSkins';
import { RARITY_COLORS } from '../constants/cardPlayers';

export default function DevSkinPanel({ state }) {
  const owned = state.teamSkins?.[socket.id]?.owned || [];
  const send = (action, skinId) => socket.emit('dev-skin', { action, skinId });

  return (
    <div className="rounded-lg border border-[#222838] bg-[#11141E] p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="m-0 font-['Oswald'] text-[18px] tracking-[0.5px] text-white">SKINS D'ÉQUIPE</h3>
        <div className="flex gap-2">
          <button
            onClick={() => send('unlock-all')}
            className="cursor-pointer rounded border border-[#00e676] bg-transparent px-3 py-1.5 text-xs font-bold text-[#00e676] transition-colors hover:bg-[#00e676] hover:text-black"
          >
            TOUT DÉBLOQUER
          </button>
          <button
            onClick={() => send('lock-all')}
            className="cursor-pointer rounded border border-[#ff3366] bg-transparent px-3 py-1.5 text-xs font-bold text-[#ff3366] transition-colors hover:bg-[#ff3366] hover:text-white"
          >
            TOUT VERROUILLER
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {SKINS.map(skin => {
          const isOwned = owned.includes(skin.id);
          const color = RARITY_COLORS[skin.rarity] || '#8b9bb4';

          return (
            <div key={skin.id} className="flex items-center justify-between gap-3 rounded-md bg-[#0C0E14] px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{skin.name}</div>
                <div className="text-[11px] font-bold uppercase tracking-[1px]" style={{ color }}>
                  {skin.rarity} · {skin.id}
                </div>
              </div>

              {skin.free ? (
                <span className="shrink-0 text-[11px] text-[#768196]">Offert à tous (free: true)</span>
              ) : (
                <button
                  onClick={() => send(isOwned ? 'lock' : 'unlock', skin.id)}
                  className={`shrink-0 cursor-pointer rounded border px-3 py-1.5 text-xs font-bold transition-colors ${
                    isOwned
                      ? 'border-[#00e676] bg-[#00e676] text-black'
                      : 'border-[#D4AF37] bg-transparent text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black'
                  }`}
                >
                  {isOwned ? 'DÉBLOQUÉ ✓' : 'DÉBLOQUER'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}