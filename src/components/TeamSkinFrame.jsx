import { getSkin } from '../constants/teamSkins';

const MONO = { dark: 'brightness(0)', light: 'brightness(0) invert(1)' };
const hideOnError = (e) => { e.currentTarget.style.display = 'none'; };

const TAG_POS = {
  tl: { box: 'left-0 top-0 pl-4 pr-11', clip: 'polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%)', line: 'bottom-0' },
  br: { box: 'right-0 bottom-0 pl-11 pr-4', clip: 'polygon(18px 0, 100% 0, 100% 100%, 0 100%)', line: 'top-0' },
};

export default function TeamSkinFrame({ skinId, highlight = false, className = '', children }) {
  const skin = getSkin(skinId);
  const fx = skin.effect;
  const decor = skin.decor;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/15 bg-bg-panel shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${className}`}
      style={skin.frame || undefined}
    >
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

      {/* Étiquettes à coin biseauté (logo + soulignement) */}
      {decor?.tags?.map((tag, i) => {
        const pos = TAG_POS[tag.pos || 'tl'];
        return (
          <div
            key={i}
            className={`pointer-events-none absolute z-[3] flex h-[46px] items-center ${pos.box}`}
            style={{ background: tag.bg ?? '#0a0a0a', clipPath: pos.clip }}
          >
            <img
              src={tag.src}
              alt=""
              onError={hideOnError}
              className="h-7 w-auto object-contain"
              style={{ filter: MONO[tag.mono] }}
            />
            {tag.accent && (
              <span className={`absolute inset-x-0 h-[3px] ${pos.line}`} style={{ background: tag.accent }} />
            )}
          </div>
        );
      })}

      {highlight && <div className="absolute inset-x-0 top-0 z-[2] h-[3px] bg-accent-cyan" />}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}