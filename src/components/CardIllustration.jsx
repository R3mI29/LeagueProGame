import { RARITY_COLORS } from '../constants/cardPlayers';

export default function CardIllustration({ card, width = 140 }) {
  const height = width * 1.4; 
  
  const rarityColor = RARITY_COLORS[card.rarity] || (card.rarity === 'WANTED' ? '#00e5ff' : '#8b9bb4');

  const bgGradients = {
    'Commune': ['#2a3546', '#141b27'],
    'Rare': ['#007a8c', '#003344'],
    'Épique': ['#99143a', '#3d0817'],
    'Légendaire': ['#b89400', '#4a3b00'],
    'WANTED': ['#0a0a0a', '#1a1a2e']
  };

  const [bgTop, bgBot] = bgGradients[card.rarity] || bgGradients['Commune'];
  const hasFullIllustration = card.rarity === 'WANTED' || card.rarity === 'Légendaire' || Boolean(card.isFullArt);

  let borderColor = rarityColor;
  let customBoxShadow = `0 8px 20px ${borderColor}66`;

  if (card.isFullArt) {
    borderColor = '#ff3399';
    customBoxShadow = '0 0 15px rgba(255, 51, 153, 0.6), 0 0 30px rgba(0, 229, 255, 0.4)';
  } else if (card.rarity === 'WANTED') {
    borderColor = '#ffffff';
    customBoxShadow = '0 8px 25px rgba(255, 255, 255, 0.4)';
  } else if (card.rarity === 'Légendaire') {
    borderColor = '#ffd700';
    customBoxShadow = '0 8px 25px rgba(255, 215, 0, 0.5)';
  }

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: `${width}px`, 
        height: `${height}px`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: customBoxShadow,
        border: `3px solid ${borderColor}`,
        boxSizing: 'border-box',
        display: 'inline-block'
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
            <stop offset="0%" stopColor={rarityColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={rarityColor} stopOpacity="0" />
          </radialGradient>

          {card.rarity === 'Légendaire' && (
            <pattern id="rays" width="200" height="280" patternUnits="userSpaceOnUse">
              <g stroke="#ffd700" strokeWidth="2" strokeOpacity="0.3">
                {[...Array(12)].map((_, i) => (
                  <line key={i} x1="100" y1="140" x2={100 + Math.cos(i * 30 * Math.PI / 180) * 200} y2={140 + Math.sin(i * 30 * Math.PI / 180) * 200} />
                ))}
              </g>
            </pattern>
          )}

          {card.rarity === 'Épique' && !card.isFullArt && (
            <pattern id="triangles" width="40" height="40" patternUnits="userSpaceOnUse">
              <polygon points="20,0 40,40 0,40" fill="rgba(255, 255, 255, 0.05)" />
            </pattern>
          )}

          <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="15%" stopColor="rgba(10, 14, 20, 0)" />
            <stop offset="85%" stopColor="rgba(10, 14, 20, 0.95)" />
            <stop offset="100%" stopColor="rgba(10, 14, 20, 1)" />
          </linearGradient>
        </defs>

        <rect x="-2" y="-2" width="204" height="284" fill={`url(#bg-${card.id})`} />
        <rect x="-2" y="-2" width="204" height="284" fill={`url(#glow-${card.id})`} />
        
        {card.rarity === 'Légendaire' && <rect x="-2" y="-2" width="204" height="284" fill="url(#rays)" />}
        {card.rarity === 'Épique' && !card.isFullArt && <rect x="-2" y="-2" width="204" height="284" fill="url(#triangles)" />}
        {card.rarity === 'Rare' && <circle cx="100" cy="140" r="80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />}

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

        {/* Note */}
        <rect x="10" y="10" width="45" height="40" rx="8" fill="rgba(0,0,0,0.6)" />
        <text x="32" y="38" textAnchor="middle" fontSize="24" fontWeight="800" fill={card.isFullArt ? '#ff3399' : rarityColor} fontFamily="Rajdhani, sans-serif">
          {card.rating}
        </text>

        {/* Rôle */}
        <rect x="110" y="10" width="80" height="30" rx="8" fill="rgba(0,0,0,0.6)" />
        <text x="150" y="31" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" fontFamily="Rajdhani, sans-serif" letterSpacing="1">
          {card.role.toUpperCase()}
        </text>

        {/* Nom & Variante */}
        <text x="100" y="235" textAnchor="middle" fontSize="26" fontWeight="800" fill="white" fontFamily="Rajdhani, sans-serif" letterSpacing="1">
          {card.baseName.toUpperCase()}
        </text>
        
        <text x="100" y="258" textAnchor="middle" fontSize="14" fontWeight="600" fill={card.isFullArt ? '#ff99cc' : rarityColor} fontFamily="Inter, sans-serif">
          {card.variant}
        </text>
      </svg>

      {/* EFFET HOLOGRAPHIQUE UNIQUE */}
      {card.isFullArt && <div className="card-foil-overlay" />}

      <style>{`
        .card-foil-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 30%,
            rgba(255, 0, 128, 0.25) 45%,
            rgba(0, 229, 255, 0.35) 50%,
            rgba(255, 230, 0, 0.3) 55%,
            transparent 70%,
            transparent 100%
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
      `}</style>
    </div>
  );
}