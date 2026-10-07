import { RARITY_COLORS } from '../constants/cardPlayers';

export default function CardIllustration({ card, width = 140 }) {
  const height = width * 1.4;

  const isWanted = card.rarity === 'WANTED';
  const isSecret = card.rarity === 'SECRET';
  const isLegendary = card.rarity === 'Légendaire';
  const isEpic = card.rarity === 'Épique';

  const rarityColor = RARITY_COLORS[card.rarity] || (isWanted ? '#ffffff' : '#8b9bb4');

  const bgGradients = {
    'Commune': ['#2a3546', '#141b27'],
    'Rare': ['#007a8c', '#003344'],
    'Épique': ['#99143a', '#3d0817'],
    'Légendaire': ['#3d2f00', '#1a1400'],
    'WANTED': ['#050505', '#11111a'],
    'SECRET': ['#080C16', '#141824']
  };

  const [bgTop, bgBot] = bgGradients[card.rarity] || bgGradients['Commune'];
  const hasFullIllustration = isWanted || isLegendary || isSecret || isEpic;
  const themeColor = card.themeColor || '#E5142E';

  let secretLogo = null;
  if (isSecret) {
    if (card.id === 'ruler-missing-redemption') secretLogo = '/equipes/jd-gaming.webp';
    else if (card.secretLogo) secretLogo = card.secretLogo;
  }

  let borderColor = rarityColor;
  let nameFont = "Rajdhani, sans-serif";
  let customBoxShadow = '';

  if (isWanted) borderColor = '#ffffff';
  else if (isLegendary) borderColor = '#ffd700';

  if (isSecret) {
    borderColor = themeColor;
    nameFont = "'Inter', sans-serif";
    customBoxShadow = '0 15px 35px rgba(0,0,0,0.95), 0 0 35px var(--theme-color)';
  }

  if (!customBoxShadow) {
    if (isLegendary) customBoxShadow = '0 8px 24px rgba(0,0,0,0.85), 0 0 15px rgba(255, 215, 0, 0.3)';
    else if (isEpic) customBoxShadow = `0 6px 20px rgba(0,0,0,0.8), 0 0 15px ${borderColor}44`;
    else customBoxShadow = `0 6px 16px rgba(0,0,0,0.6), 0 0 8px ${borderColor}22`;
  }

  const nameLength = card.baseName.length;
  let dynamicFontSize = "26";
  if (nameLength > 14) dynamicFontSize = "18";
  else if (nameLength > 10) dynamicFontSize = "22";

  const sparkles = isLegendary ? [
    { top: '-6%', left: '8%', size: 14, delay: '0s' },
    { top: '4%', left: '-8%', size: 10, delay: '0.4s' },
    { top: '78%', left: '-6%', size: 12, delay: '0.9s' },
    { top: '90%', left: '85%', size: 16, delay: '0.2s' },
    { top: '15%', left: '96%', size: 10, delay: '1.3s' },
    { top: '55%', left: '102%', size: 12, delay: '0.7s' },
  ] : [];

  const cardNode = (
    <div
      className={`relative rounded-xl overflow-hidden inline-block cursor-pointer z-10 box-border transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] will-change-transform hover:-translate-y-2 hover:scale-[1.03] ${isWanted ? 'wanted-card-container' : ''} ${isSecret ? 'secret-card-container' : ''} ${isLegendary ? 'legendary-card-container' : ''}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        boxShadow: isWanted ? 'none' : customBoxShadow,
        border: isWanted ? 'none' : `3px solid ${borderColor}`,
        '--theme-color': themeColor,
        '--rarity-color': rarityColor,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 200 280" className="block bg-[#0d1323] select-none">
        <defs>
          <linearGradient id={`bg-${card.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bgTop} />
            <stop offset="100%" stopColor={bgBot} />
          </linearGradient>

          <radialGradient id={`glow-${card.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isSecret ? themeColor : rarityColor} stopOpacity={isWanted || isSecret ? "0.3" : "0.5"} />
            <stop offset="100%" stopColor={isSecret ? themeColor : rarityColor} stopOpacity="0" />
          </radialGradient>

          {(isLegendary || isSecret || isWanted) && (
            <pattern id="rays" width="200" height="280" patternUnits="userSpaceOnUse">
              <g 
                stroke={isSecret ? themeColor : (isWanted ? "#ffffff" : "#ffd700")} 
                // 1. On augmente fortement l'épaisseur pour WANTED (passé de 1 à 4)
                strokeWidth={isWanted ? "4" : (isLegendary ? "2.5" : "2")} 
                strokeOpacity={isSecret ? "0.15" : (isWanted ? "0.1" : (isLegendary ? "0.3" : "0.2"))}
              >
                <animateTransform attributeName="transform" type="rotate" from="0 100 140" to="360 100 140" dur={isLegendary ? "14s" : "25s"} repeatCount="indefinite" />
                {[...Array(12)].map((_, i) => (
                  // 2. On allonge drastiquement la ligne (* 500 au lieu de * 200) pour qu'elle ne soit jamais coupée dans les angles lors de la rotation
                  <line 
                    key={i} 
                    x1="100" 
                    y1="140" 
                    x2={100 + Math.cos(i * 30 * Math.PI / 180) * 500} 
                    y2={140 + Math.sin(i * 30 * Math.PI / 180) * 500} 
                  />
                ))}
              </g>
            </pattern>
          )}

          <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="15%" stopColor="rgba(10, 14, 20, 0)" />
            <stop offset="85%" stopColor="rgba(10, 14, 20, 0.95)" />
            <stop offset="100%" stopColor="rgba(10, 14, 20, 1)" />
          </linearGradient>

          {(isWanted || isSecret) && (
            <radialGradient id="wantedVignette" cx="50%" cy="40%" r="70%">
              <stop offset="40%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.8)" />
            </radialGradient>
          )}

          {isLegendary && (
            <linearGradient id={`legendtext-${card.id}`} x1="-40%" y1="0%" x2="60%" y2="0%">
              <stop offset="0%" stopColor="#fff6c8" />
              <stop offset="45%" stopColor="#ffd700" />
              <stop offset="55%" stopColor="#fffbe0" />
              <stop offset="100%" stopColor="#ffd700" />
              <animate attributeName="x1" values="-120%;120%" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="x2" values="-20%;220%" dur="2.2s" repeatCount="indefinite" />
            </linearGradient>
          )}
        </defs>

        <rect x="-2" y="-2" width="204" height="284" fill={`url(#bg-${card.id})`} />
        <rect x="-2" y="-2" width="204" height="284" fill={`url(#glow-${card.id})`} />

        {(isLegendary || isSecret || isWanted) && <rect x="-2" y="-2" width="204" height="284" fill="url(#rays)" />}

        {card.image && (
          <image
            href={card.image}
            x="0" y={hasFullIllustration ? "-2" : "25"}
            width="200" height={hasFullIllustration ? "282" : "260"}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {secretLogo && (
          <image
            href={secretLogo}
            x="30" y="45" width="140" height="140"
            className="secret-neon-logo"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {(isWanted || isSecret) && <rect x="0" y="0" width="200" height="280" fill="url(#wantedVignette)" />}

        {card.image ? (
          <rect x="-2" y="150" width="204" height="140" fill="url(#bottomFade)" />
        ) : (
          <g>
            <rect x="0" y="200" width="200" height="80" fill="rgba(0,0,0,0.75)" />
            <path d="M0,200 L200,180 L200,200 Z" fill="rgba(0,0,0,0.75)" />
          </g>
        )}

        {isSecret || isWanted ? (
          <rect x="10" y="10" width="45" height="40" rx="4" fill="rgba(0,0,0,0.8)" stroke={isWanted ? "#fff" : themeColor} strokeWidth={isWanted ? "1" : "2"} />
        ) : (
          <rect x="10" y="10" width="45" height="40" rx="6" fill="rgba(0,0,0,0.85)" />
        )}
        <text x="32" y="38" textAnchor="middle" fontSize="24" fontWeight="800" fill={isSecret ? themeColor : (isLegendary ? `url(#legendtext-${card.id})` : rarityColor)} fontFamily="Rajdhani, sans-serif" filter={(isWanted || isSecret || isLegendary) ? `drop-shadow(0px 0px 4px ${isSecret ? themeColor : (isLegendary ? 'rgba(255,215,0,0.6)' : rarityColor)})` : "none"}>
          {card.rating}
        </text>

        {isSecret || isWanted ? (
          <rect x="115" y="10" width="75" height="30" rx="4" fill="rgba(0,0,0,0.8)" stroke={isWanted ? "#fff" : themeColor} strokeWidth={isWanted ? "1" : "2"} />
        ) : (
          <rect x="110" y="10" width="80" height="30" rx="6" fill="rgba(0,0,0,0.85)" />
        )}
        <text x={isSecret || isWanted ? "152.5" : "150"} y="31" textAnchor="middle" fontSize={isSecret || isWanted ? "14" : "16"} fontWeight="700" fill="#fff" fontFamily="Rajdhani, sans-serif" letterSpacing="1">
          {card.role.toUpperCase()}
        </text>

        {(isSecret || isWanted) && (
          <text x="102" y="237" textAnchor="middle" fontSize={dynamicFontSize} fontWeight="900" fill={isWanted ? "rgba(255,255,255,0.4)" : `${themeColor}99`} fontFamily={nameFont} letterSpacing="1">
            {card.baseName.toUpperCase()}
          </text>
        )}
        <text
          x="100" y="235" textAnchor="middle" fontSize={dynamicFontSize} fontWeight="900"
          fill={isLegendary ? `url(#legendtext-${card.id})` : "white"}
          fontFamily={nameFont} letterSpacing="1"
          filter={isLegendary ? "drop-shadow(0px 0px 6px rgba(255,215,0,0.6))" : (isWanted || isSecret) ? `drop-shadow(0px 0px 6px ${isSecret ? themeColor : 'rgba(255,255,255,0.6)'})` : "none"}
        >
          {card.baseName.toUpperCase()}
        </text>

        <text x="100" y="258" textAnchor="middle" fontSize="14" fontWeight="700" fill={isSecret ? themeColor : (isLegendary ? '#ffe066' : rarityColor)} fontFamily="Inter, sans-serif" letterSpacing={isSecret || isWanted ? "1" : "0"}>
          {card.variant.toUpperCase()}
        </text>

        {isWanted && <rect x="2" y="2" width="196" height="276" rx="10" fill="none" stroke="#ffffff" strokeWidth="4" className="wanted-svg-border" />}
      </svg>

      {hasFullIllustration && !isWanted && !isSecret && <div className="card-foil-overlay" />}
      {isLegendary && <div className="legendary-glint-sweep" />}
      {isLegendary && <div className="legendary-glint-sweep legendary-glint-sweep-2" />}

      <style>{`
        .legendary-glint-sweep { position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: glintSweep 5s ease-in-out infinite; pointer-events: none; mix-blend-mode: overlay; }
        .legendary-glint-sweep-2 { animation-delay: 2.5s; opacity: 0.5; }
        @keyframes glintSweep { 0%, 15% { left: -100%; } 85%, 100% { left: 200%; } }
        .wanted-card-container { animation: cardLevitate 4s ease-in-out infinite; }
        @keyframes cardLevitate { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .wanted-svg-border { stroke-dasharray: 60 400; animation: borderRun 4s linear infinite; filter: drop-shadow(0 0 8px #fff); }
        @keyframes borderRun { 0% { stroke-dashoffset: 460; } 100% { stroke-dashoffset: 0; } }
        .secret-card-container { animation: secretAura 3s ease-in-out infinite alternate; }
        @keyframes secretAura { 0% { box-shadow: 0 15px 35px rgba(0,0,0,0.95), 0 0 10px var(--theme-color); } 100% { box-shadow: 0 15px 35px rgba(0,0,0,0.95), 0 0 35px var(--theme-color); } }
        .secret-neon-logo { mix-blend-mode: screen; animation: logoSmoothFade 6s ease-in-out infinite; }
        @keyframes logoSmoothFade { 0%, 40%, 100% { opacity: 0.03; filter: drop-shadow(0 0 1px var(--theme-color)) brightness(0.5); } 70%, 80% { opacity: 0.65; filter: drop-shadow(0 0 18px var(--theme-color)) brightness(1.3); } }
      `}</style>
    </div>
  );

  if (!isLegendary) return cardNode;

  return (
    <div className="relative inline-block animate-[legendaryReveal_0.7s_cubic-bezier(0.175,0.885,0.32,1.4)_both]" style={{ width: `${width}px`, height: `${height}px` }}>
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="absolute text-[#fff6c8] drop-shadow-[0_0_6px_#ffd700] z-20 pointer-events-none animate-[legendarySparkle_1.6s_ease-in-out_infinite]"
          style={{ top: s.top, left: s.left, fontSize: `${s.size}px`, animationDelay: s.delay }}
        >
          ✦
        </span>
      ))}
      {cardNode}

      <style>{`
        @keyframes legendaryReveal { 0% { transform: scale(0.4) rotate(-10deg); opacity: 0; } 55% { transform: scale(1.12) rotate(3deg); opacity: 1; } 75% { transform: scale(0.96) rotate(-1deg); } 100% { transform: scale(1) rotate(0deg); } }
        .legendary-card-container { animation: legendaryPulse 3.5s ease-in-out infinite; }
        @keyframes legendaryPulse { 0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,0.85), 0 0 12px rgba(255, 215, 0, 0.2); } 50% { box-shadow: 0 8px 24px rgba(0,0,0,0.85), 0 0 20px rgba(255, 215, 0, 0.4); } }
        @keyframes legendarySparkle { 0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); } 50% { opacity: 1; transform: scale(1.1) rotate(90deg); } }
      `}</style>
    </div>
  );
}