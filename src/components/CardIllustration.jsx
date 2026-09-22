import { RARITY_COLORS } from '../constants/cardPlayers';

export default function CardIllustration({ card, width = 140 }) {
  const height = width * 1.4; // Ratio classique des cartes à collectionner
  const rarityColor = RARITY_COLORS[card.rarity] || '#8b9bb4';

  // Couleurs de fond basées sur la rareté
  const bgGradients = {
    'Commune': ['#2a3546', '#141b27'],
    'Rare': ['#007a8c', '#003344'],
    'Épique': ['#99143a', '#3d0817'],
    'Légendaire': ['#b89400', '#4a3b00']
  };

  const [bgTop, bgBot] = bgGradients[card.rarity] || bgGradients['Commune'];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 280"
      style={{ 
        borderRadius: '12px', 
        border: `3px solid ${rarityColor}`, 
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

        {/* NOUVEAU : Dégradé pour le fondu au noir en bas */}
        <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="15%" stopColor="rgba(10, 14, 20, 0)" />
          <stop offset="85%" stopColor="rgba(10, 14, 20, 0.95)" />
          <stop offset="100%" stopColor="rgba(10, 14, 20, 1)" />
        </linearGradient>
      </defs>

      {/* 1. FOND ET LUMIÈRE (Fix: Agrandis à 204x284 pour glisser sous la bordure) */}
      <rect x="-2" y="-2" width="204" height="284" fill={`url(#bg-${card.id})`} />
      <rect x="-2" y="-2" width="204" height="284" fill={`url(#glow-${card.id})`} />
      
      {/* 2. EFFETS GÉOMÉTRIQUES */}
      {card.rarity === 'Légendaire' && <rect x="-2" y="-2" width="204" height="284" fill="url(#rays)" />}
      {card.rarity === 'Épique' && <rect x="-2" y="-2" width="204" height="284" fill="url(#triangles)" />}
      {card.rarity === 'Rare' && <circle cx="100" cy="140" r="80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />}

      {/* 3. IMAGE DU JOUEUR (Au milieu) */}
      {card.image && (
        <image 
          href={card.image} 
          x="0" 
          y="25" 
          width="200" 
          height="260" 
          preserveAspectRatio="xMidYMin slice" 
        />
      )}

      {/* 4. ZONE DU BAS (Fondu doux si image, Bande géométrique si pas d'image) */}
      {card.image ? (
        /* Le fondu pour intégrer proprement la photo */
        <rect x="0" y="130" width="200" height="150" fill="url(#bottomFade)" />
      ) : (
        /* La bande diagonale d'origine pour structurer la carte vide */
        <g>
          <rect x="0" y="200" width="200" height="80" fill="rgba(0,0,0,0.75)" />
          <path d="M0,200 L200,180 L200,200 Z" fill="rgba(0,0,0,0.75)" />
        </g>
      )}

      {/* 4. FONDU NOIR (Remplace les anciens rectangles durs) */}
      {/* Crée une ombre douce sur le torse du joueur pour y écrire le texte par-dessus */}
      <rect x="0" y="130" width="200" height="150" fill="url(#bottomFade)" />

      {/* 5. EN-TÊTE : Note et Rôle (Premier plan) */}
      <rect x="10" y="10" width="45" height="40" rx="8" fill="rgba(0,0,0,0.6)" />
      <text x="32" y="38" textAnchor="middle" fontSize="24" fontWeight="800" fill={rarityColor} fontFamily="Rajdhani, sans-serif">
        {card.rating}
      </text>

      <rect x="110" y="10" width="80" height="30" rx="8" fill="rgba(0,0,0,0.6)" />
      <text x="150" y="31" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" fontFamily="Rajdhani, sans-serif" letterSpacing="1">
        {card.role.toUpperCase()}
      </text>

      {/* 6. TEXTE : Nom et variante (Premier plan) */}
      <text x="100" y="235" textAnchor="middle" fontSize="26" fontWeight="800" fill="white" fontFamily="Rajdhani, sans-serif" letterSpacing="1">
        {card.baseName.toUpperCase()}
      </text>
      
      <text x="100" y="258" textAnchor="middle" fontSize="14" fontWeight="500" fill={rarityColor} fontFamily="Inter, sans-serif">
        {card.variant}
      </text>
    </svg>
  );
}