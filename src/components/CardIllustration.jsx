import { RARITY_COLORS } from '../constants/cardPlayers';

export default function CardIllustration({ card, width = 140 }) {
  const height = width * 1.4; // Ratio classique des cartes à collectionner
  
  // On ajoute un fallback cyan clair spécifique au cas où WANTED ne serait pas dans RARITY_COLORS
  const rarityColor = RARITY_COLORS[card.rarity] || (card.rarity === 'WANTED' ? '#00e5ff' : '#8b9bb4');

  // Couleurs de fond basées sur la rareté (fallback sombre pour WANTED)
  const bgGradients = {
    'Commune': ['#2a3546', '#141b27'],
    'Rare': ['#007a8c', '#003344'],
    'Épique': ['#99143a', '#3d0817'],
    'Légendaire': ['#b89400', '#4a3b00'],
    'WANTED': ['#0a0a0a', '#1a1a2e']
  };

  const [bgTop, bgBot] = bgGradients[card.rarity] || bgGradients['Commune'];

  // Condition pour le plein format (Full Art)
  const isWanted = card.rarity === 'WANTED';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 280"
      style={{ 
        borderRadius: '12px', 
        border: `3px solid ${isWanted ? '#ffffff' : rarityColor}`, // Bordure blanche pour les WANTED
        boxShadow: `0 8px 20px ${rarityColor}66`, 
        display: 'block',
        background: '#0d1323',
        userSelect: 'none'
      }}
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

        {/* Rayons pour les Légendaires */}
        {card.rarity === 'Légendaire' && (
          <pattern id="rays" width="200" height="280" patternUnits="userSpaceOnUse">
            <g stroke="#ffd700" strokeWidth="2" strokeOpacity="0.3">
              {[...Array(12)].map((_, i) => (
                <line key={i} x1="100" y1="140" x2={100 + Math.cos(i * 30 * Math.PI / 180) * 200} y2={140 + Math.sin(i * 30 * Math.PI / 180) * 200} />
              ))}
            </g>
          </pattern>
        )}

        {/* Triangles pour les Épiques */}
        {card.rarity === 'Épique' && (
          <pattern id="triangles" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon points="20,0 40,40 0,40" fill="rgba(255, 255, 255, 0.05)" />
          </pattern>
        )}

        {/* Dégradé pour le fondu au noir en bas */}
        <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="15%" stopColor="rgba(10, 14, 20, 0)" />
          <stop offset="85%" stopColor="rgba(10, 14, 20, 0.95)" />
          <stop offset="100%" stopColor="rgba(10, 14, 20, 1)" />
        </linearGradient>
      </defs>

      {/* 1. FOND ET LUMIÈRE */}
      <rect x="-2" y="-2" width="204" height="284" fill={`url(#bg-${card.id})`} />
      <rect x="-2" y="-2" width="204" height="284" fill={`url(#glow-${card.id})`} />
      
      {/* 2. EFFETS GÉOMÉTRIQUES */}
      {card.rarity === 'Légendaire' && <rect x="-2" y="-2" width="204" height="284" fill="url(#rays)" />}
      {card.rarity === 'Épique' && <rect x="-2" y="-2" width="204" height="284" fill="url(#triangles)" />}
      {card.rarity === 'Rare' && <circle cx="100" cy="140" r="80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />}

      {/* 3. IMAGE DU JOUEUR */}
      {card.image && (
        <image 
          href={card.image} 
          x="0" 
          y={isWanted ? "-2" : "25"}        // Si WANTED : commence en haut (0). Sinon 25.
          width="200" 
          height={isWanted ? "282" : "260"}  // Si WANTED : prend toute la hauteur.
          preserveAspectRatio="xMidYMid slice" // "xMidYMid slice" est souvent meilleur pour centrer l'image
        />
      )}

      {/* 4. ZONE DU BAS (Fondu doux si image, Bande géométrique si pas d'image) */}
      {card.image ? (
        <g>
          {/* 1. Le fondu d'origine, à sa place parfaite pour garder un contraste fort sur le texte */}
          <rect x="0" y="130" width="200" height="150" fill="url(#bottomFade)" />
          
          {/* 2. Le cache solide qui prend le relais exactement là où le fondu s'arrête (y=279) */}
          {/* Remplace "rgba(0,0,0,1)" par la vraie couleur sombre de ta carte si besoin (ex: "#08090D") */}
          <rect x="0" y="279" width="200" height="50" fill="rgba(0,0,0,1)" />
        </g>
      ) : (
        /* La bande diagonale d'origine pour structurer la carte vide */
        <g>
          <rect x="0" y="200" width="200" height="80" fill="rgba(0,0,0,0.75)" />
          <path d="M0,200 L200,180 L200,200 Z" fill="rgba(0,0,0,0.75)" />
        </g>
      )}

      {/* 5. EN-TÊTE : Note et Rôle */}
      <rect x="10" y="10" width="45" height="40" rx="8" fill="rgba(0,0,0,0.6)" />
      <text x="32" y="38" textAnchor="middle" fontSize="24" fontWeight="800" fill={rarityColor} fontFamily="Rajdhani, sans-serif">
        {card.rating}
      </text>

      <rect x="110" y="10" width="80" height="30" rx="8" fill="rgba(0,0,0,0.6)" />
      <text x="150" y="31" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" fontFamily="Rajdhani, sans-serif" letterSpacing="1">
        {card.role.toUpperCase()}
      </text>

      {/* 6. TEXTE : Nom et variante */}
      <text x="100" y="235" textAnchor="middle" fontSize="26" fontWeight="800" fill="white" fontFamily="Rajdhani, sans-serif" letterSpacing="1">
        {card.baseName.toUpperCase()}
      </text>
      
      <text x="100" y="258" textAnchor="middle" fontSize="14" fontWeight="500" fill={rarityColor} fontFamily="Inter, sans-serif">
        {card.variant}
      </text>
    </svg>
  );
}