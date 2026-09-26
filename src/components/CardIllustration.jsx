import { RARITY_COLORS } from '../constants/cardPlayers';

export default function CardIllustration({ card, width = 140 }) {
  const height = width * 1.4; 
  
  const isWanted = card.rarity === 'WANTED';
  const isSecret = card.rarity === 'SECRET';
  const rarityColor = RARITY_COLORS[card.rarity] || (isWanted ? '#ffffff' : '#8b9bb4');

  const bgGradients = {
    'Commune': ['#2a3546', '#141b27'],
    'Rare': ['#007a8c', '#003344'],
    'Épique': ['#99143a', '#3d0817'],
    'Légendaire': ['#b89400', '#4a3b00'],
    'WANTED': ['#050505', '#11111a'],
    'SECRET': ['#080C16', '#141824']
  };

  const [bgTop, bgBot] = bgGradients[card.rarity] || bgGradients['Commune'];
  const hasFullIllustration = isWanted || card.rarity === 'Légendaire' || isSecret || Boolean(card.isFullArt);

  const themeColor = card.themeColor || '#E5142E';
  
  let secretLogo = null;
  if (isSecret) {
    if (card.id === 'ruler-missing-redemption') secretLogo = '/equipes/jd-gaming.webp';
    else if (card.secretLogo) secretLogo = card.secretLogo; 
  }

  let containerClass = "";
  if (isWanted) containerClass = "wanted-card-container";
  if (isSecret) containerClass = "secret-card-container"; 

  let borderColor = rarityColor;
  let nameFont = "Rajdhani, sans-serif"; 
  let customBoxShadow = '';

  if (!card.isFullArt) {
    if (isWanted) borderColor = '#ffffff';
    else if (card.rarity === 'Légendaire') borderColor = '#ffd700';
  }

  if (isSecret) {
    borderColor = themeColor; // Le rouge vif pour la bordure standard
    nameFont = "'Inter', sans-serif"; 
    customBoxShadow = '0 15px 35px rgba(0,0,0,0.95), 0 0 35px var(--theme-color)';
  }

  if (!customBoxShadow && !isSecret) {
      customBoxShadow = `0 8px 20px ${borderColor}66`;
      if (card.isFullArt && !isWanted) customBoxShadow = `0 0 15px ${borderColor}99, 0 0 30px ${borderColor}66`;
      else if (card.rarity === 'Légendaire') customBoxShadow = '0 8px 25px rgba(255, 215, 0, 0.5)';
  }

  const nameLength = card.baseName.length;
  let dynamicFontSize = "26";
  if (nameLength > 14) dynamicFontSize = "18"; 
  else if (nameLength > 10) dynamicFontSize = "22";

  return (
    <div 
      className={containerClass}
      style={{ 
        position: 'relative', 
        width: `${width}px`, 
        height: `${height}px`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isWanted ? 'none' : customBoxShadow,
        border: isWanted ? 'none' : `3px solid ${borderColor}`,
        boxSizing: 'border-box',
        display: 'inline-block',
        '--theme-color': themeColor
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 280"
        style={{ display: 'block', background: '#0d1323', userSelect: 'none' }}
      >
        <defs>
          <linearGradient id={`bg-${card.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bgTop} />
            <stop offset="100%" stopColor={bgBot} />
          </linearGradient>

          <radialGradient id={`glow-${card.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isSecret ? themeColor : rarityColor} stopOpacity={isWanted || isSecret ? "0.3" : "0.8"} />
            <stop offset="100%" stopColor={isSecret ? themeColor : rarityColor} stopOpacity="0" />
          </radialGradient>

          {(card.rarity === 'Légendaire' || isSecret || isWanted) && (
            <pattern id="rays" width="200" height="280" patternUnits="userSpaceOnUse">
              <g stroke={isSecret ? themeColor : (isWanted ? "#ffffff" : "#ffd700")} strokeWidth={isWanted ? "1" : "2"} strokeOpacity={isSecret ? "0.15" : (isWanted ? "0.1" : "0.3")}>
                {[...Array(12)].map((_, i) => (
                  <line key={i} x1="100" y1="140" x2={100 + Math.cos(i * 30 * Math.PI / 180) * 200} y2={140 + Math.sin(i * 30 * Math.PI / 180) * 200} />
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
        </defs>

        <rect x="-2" y="-2" width="204" height="284" fill={`url(#bg-${card.id})`} />
        <rect x="-2" y="-2" width="204" height="284" fill={`url(#glow-${card.id})`} />
        
        {(card.rarity === 'Légendaire' || isSecret || isWanted) && <rect x="-2" y="-2" width="204" height="284" fill="url(#rays)" />}

        {/* L'IMAGE DU JOUEUR */}
        {card.image && (
          <image 
            href={card.image} 
            x="0" 
            y={hasFullIllustration ? "-2" : "25"} 
            width="200" 
            height={hasFullIllustration ? "282" : "260"} 
            preserveAspectRatio="xMidYMid slice" 
          />
        )}

        {/* LOGO NÉON INCRUSTÉ */}
        {secretLogo && (
          <image 
            href={secretLogo}
            x="30" 
            y="45" 
            width="140" 
            height="140" 
            className="secret-neon-logo"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {(isWanted || isSecret) && <rect x="0" y="0" width="200" height="280" fill="url(#wantedVignette)" />}

        {/* LE FONDU DU BAS */}
        {card.image ? (
          <g>
            <rect x="0" y="130" width="200" height="150" fill="url(#bottomFade)" />
            <rect x="0" y="279" width="200" height="50" fill="rgba(0,0,0,1)" />
          </g>
        ) : (
          <g>
            <rect x="0" y="200" width="200" height="80" fill="rgba(0,0,0,0.75)" />
            <path d="M0,200 L200,180 L200,200 Z" fill="rgba(0,0,0,0.75)" />
          </g>
        )}

        {/* INTERFACE : NOTE */}
        {isSecret || isWanted ? (
          <rect x="10" y="10" width="45" height="40" rx="4" fill="rgba(0,0,0,0.8)" stroke={isWanted ? "#fff" : themeColor} strokeWidth={isWanted ? "1" : "2"} />
        ) : (
          <rect x="10" y="10" width="45" height="40" rx="8" fill="rgba(0,0,0,0.6)" />
        )}
        <text x="32" y="38" textAnchor="middle" fontSize="24" fontWeight="800" fill={isSecret ? themeColor : rarityColor} fontFamily="Rajdhani, sans-serif" filter={(isWanted || isSecret) ? `drop-shadow(0px 0px 6px ${isSecret ? themeColor : '#fff'})` : "none"}>
          {card.rating}
        </text>

        {/* INTERFACE : RÔLE */}
        {isSecret || isWanted ? (
          <rect x="115" y="10" width="75" height="30" rx="4" fill="rgba(0,0,0,0.8)" stroke={isWanted ? "#fff" : themeColor} strokeWidth={isWanted ? "1" : "2"} />
        ) : (
          <rect x="110" y="10" width="80" height="30" rx="8" fill="rgba(0,0,0,0.6)" />
        )}
        <text x={isSecret || isWanted ? "152.5" : "150"} y="31" textAnchor="middle" fontSize={isSecret || isWanted ? "14" : "16"} fontWeight="700" fill="#fff" fontFamily="Rajdhani, sans-serif" letterSpacing="1">
          {card.role.toUpperCase()}
        </text>

        {/* INTERFACE : NOM */}
        {(isSecret || isWanted) && (
          <text x="102" y="237" textAnchor="middle" fontSize={dynamicFontSize} fontWeight="900" fill={isWanted ? "rgba(255,255,255,0.4)" : `${themeColor}99`} fontFamily={nameFont} letterSpacing="1">
            {card.baseName.toUpperCase()}
          </text>
        )}
        <text x="100" y="235" textAnchor="middle" fontSize={dynamicFontSize} fontWeight="900" fill="white" fontFamily={nameFont} letterSpacing="1" filter={(isWanted || isSecret) ? `drop-shadow(0px 0px 8px ${isSecret ? themeColor : 'rgba(255,255,255,0.6)'})` : "none"}>
          {card.baseName.toUpperCase()}
        </text>
        
        {/* INTERFACE : VARIANTE */}
        <text x="100" y="258" textAnchor="middle" fontSize="14" fontWeight="700" fill={isSecret ? themeColor : rarityColor} fontFamily="Inter, sans-serif" letterSpacing={isSecret || isWanted ? "1" : "0"}>
          {card.variant.toUpperCase()}
        </text>

        {/* BORDURE WANTED (Animée) */}
        {isWanted && (
          <rect x="2" y="2" width="196" height="276" rx="10" fill="none" stroke="#ffffff" strokeWidth="4" className="wanted-svg-border" />
        )}
      </svg>

      {/* OVERLAY HOLOGRAPHIQUE POUR FULLART NORMAL */}
      {card.isFullArt && !isWanted && !isSecret && <div className="card-foil-overlay" />}

      <style>{`
        /* EFFET FOIL NORMAL */
        .card-foil-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            115deg, transparent 0%, transparent 30%,
            rgba(255, 0, 128, 0.25) 45%, rgba(0, 229, 255, 0.35) 50%, rgba(255, 230, 0, 0.3) 55%,
            transparent 70%, transparent 100%
          );
          background-size: 250% 250%;
          mix-blend-mode: screen;
          animation: foilSheen 3.5s ease-in-out infinite alternate;
        }

        @keyframes foilSheen {
          0% { background-position: 0% 0%; opacity: 0.3; }
          50% { opacity: 0.85; }
          100% { background-position: 100% 100%; opacity: 0.3; }
        }

        /* =========================================
           EFFETS "WANTED"
           ========================================= */
        .wanted-card-container {
          animation: cardLevitate 4s ease-in-out infinite;
        }

        @keyframes cardLevitate {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        .wanted-svg-border {
          stroke-dasharray: 60 400;
          animation: borderRun 4s linear infinite;
          filter: drop-shadow(0 0 8px #fff);
        }

        @keyframes borderRun {
          0% { stroke-dashoffset: 460; }
          100% { stroke-dashoffset: 0; }
        }

        /* =========================================
           EFFETS "SECRET" (Logo Transition Douce)
           ========================================= */

        .secret-card-container {
          animation: secretAura 3s ease-in-out infinite alternate;
        }

        @keyframes secretAura {
          0% { 
            box-shadow: 0 15px 35px rgba(0,0,0,0.95), 0 0 10px var(--theme-color); 
          }
          100% { 
            box-shadow: 0 15px 35px rgba(0,0,0,0.95), 0 0 35px var(--theme-color); 
          }
        }

        /* Logo JDG : Transition en fondu progressif et lent */
        .secret-neon-logo {
          mix-blend-mode: screen;
          animation: logoSmoothFade 6s ease-in-out infinite;
        }

        @keyframes logoSmoothFade {
          0%, 40% { 
            opacity: 0.03; 
            filter: drop-shadow(0 0 1px var(--theme-color)) brightness(0.5); 
          }
          70%, 80% { 
            opacity: 0.65; 
            filter: drop-shadow(0 0 18px var(--theme-color)) brightness(1.3); 
          }
          100% { 
            opacity: 0.03; 
            filter: drop-shadow(0 0 1px var(--theme-color)) brightness(0.5); 
          }
        }
      `}</style>
    </div>
  );
}