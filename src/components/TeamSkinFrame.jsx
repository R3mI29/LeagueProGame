import { getSkin } from '../constants/teamSkins';

const CORNERS = [
  'top-2.5 left-2.5 border-t-2 border-l-2',
  'top-2.5 right-2.5 border-t-2 border-r-2',
  'bottom-2.5 left-2.5 border-b-2 border-l-2',
  'bottom-2.5 right-2.5 border-b-2 border-r-2',
];

export default function TeamSkinFrame({ skinId, highlight = false, className = '', children }) {
  const skin = getSkin(skinId);
  const fx = skin.effect;
  const decor = skin.decor;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/15 bg-bg-panel shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${className}`}
      style={skin.frame || undefined}
    >
      {/* Logo en filigrane, légèrement rogné en bas à droite */}
      {decor?.logo?.src && (
        <img
          src={decor.logo.src}
          alt=""
          aria-hidden="true"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          className="pointer-events-none absolute -bottom-6 -right-6 -rotate-6 select-none object-contain"
          style={{
            width: decor.logo.size ?? '65%',
            opacity: decor.logo.opacity ?? 0.12,
            filter: decor.logo.mono ? 'brightness(0) invert(1)' : undefined,
          }}
        />
      )}

      {/* Effets animés (keyframes dans theme.css) */}
      {fx?.type === 'sweep' && (
        <div
          className="pointer-events-none absolute -inset-x-1/2 inset-y-0 mix-blend-screen animate-[su-sweep_7s_ease-in-out_infinite_alternate]"
          style={{ background: `linear-gradient(105deg, transparent 40%, ${fx.color} 50%, transparent 60%)` }}
        />
      )}
      {fx?.type === 'pulse' && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-screen animate-[su-pulse_5s_ease-in-out_infinite]"
          style={{ background: `radial-gradient(circle at 50% 30%, ${fx.color}, transparent 65%)` }}
        />
      )}

      {/* Liseré dégradé en haut */}
      {decor?.topLine && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[3px]"
          style={{ background: `linear-gradient(90deg, ${decor.topLine[0]}, ${decor.topLine[1]}, ${decor.topLine[0]})` }}
        />
      )}

      {/* Équerres aux 4 coins */}
      {decor?.corners && CORNERS.map(pos => (
        <span
          key={pos}
          className={`pointer-events-none absolute z-[2] h-4 w-4 ${pos}`}
          style={{ borderColor: decor.corners }}
        />
      ))}

      {highlight && (
        <div className={`absolute inset-x-0 z-[2] h-[3px] bg-accent-cyan ${decor?.topLine ? 'top-[3px]' : 'top-0'}`} />
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}