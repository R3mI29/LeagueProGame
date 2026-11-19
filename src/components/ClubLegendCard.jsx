// src/components/ClubLegendCard.jsx
import { useId, useState } from 'react';
import { getCardTeamTags } from '../constants/cardPlayers';
import { getTeamInfo } from '../constants/teams';
import { getClubLegendTheme } from '../constants/clubLegends';
import './ClubLegendCard.css';

/* Rameaux de laurier sculptés partant de sous le médaillon */
function LaurelWing({ flip = false, fill }) {
  return (
    <g
      transform={flip ? 'translate(200, 0) scale(-1, 1)' : undefined}
      style={{ filter: 'drop-shadow(0 1.5px 2.5px rgba(0,0,0,0.85))' }}
    >
      <path
        d="M 82,200 Q 64,203 43,194.5"
        fill="none"
        stroke={fill}
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      {/* Feuilles supérieures */}
      <ellipse cx="75" cy="196.2" rx="4.2" ry="1.6" transform="rotate(-28 75 196.2)" fill={fill} />
      <ellipse cx="66" cy="195.8" rx="3.9" ry="1.5" transform="rotate(-19 66 195.8)" fill={fill} />
      <ellipse cx="57" cy="194.8" rx="3.5" ry="1.4" transform="rotate(-9 57 194.8)" fill={fill} />
      <ellipse cx="48.5" cy="193.3" rx="3" ry="1.25" transform="rotate(5 48.5 193.3)" fill={fill} />
      {/* Feuilles inférieures */}
      <ellipse cx="73" cy="203.2" rx="3.8" ry="1.5" transform="rotate(20 73 203.2)" fill={fill} />
      <ellipse cx="63.5" cy="202.8" rx="3.5" ry="1.4" transform="rotate(25 63.5 202.8)" fill={fill} />
      <ellipse cx="54.5" cy="201" rx="3" ry="1.25" transform="rotate(30 54.5 201)" fill={fill} />
      {/* Pointe */}
      <ellipse cx="42" cy="194" rx="2.7" ry="1.15" transform="rotate(18 42 194)" fill={fill} />
    </g>
  );
}

export default function ClubLegendCard({ card, width = 140 }) {
  const uid = useId().replace(/:/g, '');
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 30, gy: 20, active: false });
  const [logoError, setLogoError] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  if (!card) return null;

  const height = width * 1.4;
  const cardTeamTags = getCardTeamTags(card);
  const legendTeamTag = (
    card.legendTeam ||
    (cardTeamTags && cardTeamTags.length > 0 ? cardTeamTags[0] : card.teamTag) ||
    'T1'
  ).toUpperCase();

  const legendTeamInfo = getTeamInfo(legendTeamTag) || {
    name: legendTeamTag,
    tag: legendTeamTag,
    logo: `/equipes/${legendTeamTag.toLowerCase()}.webp`,
  };

  const theme = getClubLegendTheme(legendTeamTag, card.themeColor);
  const metal = theme.metalFinish || {
    light: '#FFF4C7',
    mid: '#D4AF37',
    dark: '#7C5A10',
    text: '#F7DF8D',
  };

  const baseName = (card.baseName || 'LÉGENDE').toUpperCase();
  const rating = card.rating ?? 90;
  const ratingStr = String(rating);
  const subtitle = (card.variant || theme.tagLine || `${legendTeamTag} LEGEND`).toUpperCase();

  let nameFontSize = 22.5;
  if (baseName.length > 13) nameFontSize = 14;
  else if (baseName.length > 10) nameFontSize = 16.5;
  else if (baseName.length > 7) nameFontSize = 19.5;

  let subFontSize = 9.2;
  let subTracking = 1.9;
  if (subtitle.length > 18) {
    subFontSize = 7.4;
    subTracking = 1.1;
  } else if (subtitle.length > 14) {
    subFontSize = 8.3;
    subTracking = 1.4;
  }

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - y) * 13,
      ry: (x - 0.5) * 13,
      gx: x * 100,
      gy: y * 100,
      active: true,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 30, gy: 20, active: false });
  };

  // Silhouette classique Panthéon : coins arrondis fluides + légère arche au sommet, sans cadre autour
  const cardPath =
    'M 3.5,22 C 3.5,11 10.5,6.5 22,6.5 L 74,6.5 C 86,6.5 91.5,2.5 100,2.5 C 108.5,2.5 114,6.5 126,6.5 L 178,6.5 C 189.5,6.5 196.5,11 196.5,22 L 196.5,260 C 196.5,270 189.5,276 178.5,276 L 21.5,276 C 10.5,276 3.5,270 3.5,260 Z';

  // Arête spéculaire intérieure pour le relief 3D du cadre métallique
  const innerRimPath =
    'M 6.5,23 C 6.5,13.5 12.5,9.5 23,9.5 L 74.5,9.5 C 86,9.5 91.5,5.8 100,5.8 C 108.5,5.8 114,9.5 125.5,9.5 L 177,9.5 C 187.5,9.5 193.5,13.5 193.5,23 L 193.5,259 C 193.5,267.5 187.5,273 177.5,273 L 22.5,273 C 12.5,273 6.5,267.5 6.5,259 Z';

  const ids = {
    clip: `cl-clip-${uid}`,
    metalMain: `cl-mmain-${uid}`,
    metalHighlight: `cl-mhi-${uid}`,
    metalBezel: `cl-mbez-${uid}`,
    pedestalBg: `cl-ped-${uid}`,
    pedestalAura: `cl-aura-${uid}`,
    ratingScrim: `cl-rscrim-${uid}`,
    glassTop: `cl-gtop-${uid}`,
    photoRim: `cl-rim-${uid}`,
    wellBg: `cl-well-${uid}`,
    nameGrad: `cl-name-${uid}`,
    sheen: `cl-sheen-${uid}`,
    sweep: `cl-sweep-${uid}`,
  };

  const metalShift = tilt.active ? (tilt.gx - 50) * 0.45 : 0;

  return (
    <div
      className="cl-pantheon-stage"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        '--club-primary': theme.primary,
        '--club-glow': theme.glow,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className={`cl-pantheon-tilt ${tilt.active ? 'is-active' : ''}`}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(0)`,
        }}
      >
        <svg
          viewBox="0 0 200 280"
          className="cl-pantheon-svg"
          aria-label={`${baseName} ${rating} ${legendTeamTag}`}
        >
          <defs>
            <clipPath id={ids.clip}>
              <path d={cardPath} />
            </clipPath>

            {/* Métal forgé réactif à l'inclinaison */}
            <linearGradient
              id={ids.metalMain}
              x1={`${0 + metalShift}%`}
              y1="0%"
              x2={`${100 + metalShift}%`}
              y2="100%"
            >
              <stop offset="0%" stopColor={metal.mid} />
              <stop offset="24%" stopColor={metal.light} />
              <stop offset="50%" stopColor={metal.dark} />
              <stop offset="76%" stopColor={metal.light} />
              <stop offset="100%" stopColor={metal.mid} />
            </linearGradient>

            <linearGradient id={ids.metalHighlight} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="40%" stopColor={metal.light} stopOpacity="0.4" />
              <stop offset="75%" stopColor={metal.dark} stopOpacity="0.25" />
              <stop offset="100%" stopColor={metal.light} stopOpacity="0.65" />
            </linearGradient>

            <linearGradient id={ids.metalBezel} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={metal.dark} />
              <stop offset="40%" stopColor={metal.mid} />
              <stop offset="78%" stopColor={metal.light} />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>

            {/* Socle émaillé du bas */}
            <linearGradient id={ids.pedestalBg} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.bgMid} />
              <stop offset="52%" stopColor={theme.bgDark} />
              <stop offset="100%" stopColor="#040508" />
            </linearGradient>

            {/* Aura subtile du club sous le médaillon */}
            <radialGradient id={ids.pedestalAura} cx="50%" cy="72%" r="44%">
              <stop offset="0%" stopColor={theme.primary} stopOpacity="0.4" />
              <stop offset="55%" stopColor={theme.primary} stopOpacity="0.1" />
              <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
            </radialGradient>

            {/* Voile discret en haut à gauche pour la lisibilité de la note sans boîte */}
            <radialGradient id={ids.ratingScrim} cx="15%" cy="12%" r="27%">
              <stop offset="0%" stopColor="#05060A" stopOpacity="0.74" />
              <stop offset="58%" stopColor="#05060A" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#05060A" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={ids.glassTop} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Micro-ombre de 20px seulement juste au-dessus de la corniche */}
            <linearGradient id={ids.photoRim} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.52" />
            </linearGradient>

            <radialGradient id={ids.wellBg} cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor={theme.bgMid} />
              <stop offset="68%" stopColor="#090B12" />
              <stop offset="100%" stopColor="#030407" />
            </radialGradient>

            <linearGradient id={ids.nameGrad} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor={theme.accent} />
            </linearGradient>

            <radialGradient id={ids.sheen} cx={`${tilt.gx}%`} cy={`${tilt.gy}%`} r="58%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
              <stop offset="32%" stopColor={metal.light} stopOpacity="0.16" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={ids.sweep} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* === CONTENU STRICTEMENT CLIPPÉ DANS LA CARTE (ZÉRO DÉBORDEMENT) === */}
          <g clipPath={`url(#${ids.clip})`}>
            {/* 1. Portrait plein-cadre et lumineux */}
            <rect x="0" y="0" width="200" height="202" fill={theme.bgDark} />
            {card.image && !photoError && (
              <image
                href={card.image}
                x="3"
                y="2"
                width="194"
                height="198"
                preserveAspectRatio="xMidYMid slice"
                onError={() => setPhotoError(true)}
              />
            )}

            <rect x="0" y="0" width="200" height="26" fill={`url(#${ids.glassTop})`} />
            <rect x="0" y="0" width="115" height="96" fill={`url(#${ids.ratingScrim})`} />
            <rect x="0" y="176" width="200" height="24" fill={`url(#${ids.photoRim})`} />

            {/* 2. Socle classique du Panthéon */}
            <rect x="0" y="198" width="200" height="82" fill={`url(#${ids.pedestalBg})`} />
            {theme.patternImage && (
              <image
                href={theme.patternImage}
                x="0"
                y="198"
                width="200"
                height="82"
                preserveAspectRatio="xMidYMid slice"
                opacity="0.88"
                style={{ mixBlendMode: 'screen' }}
              />
            )}
            <rect x="0" y="198" width="200" height="82" fill={`url(#${ids.pedestalAura})`} />

            {/* Filet intérieur façon plaque de musée */}
            <path
              d="M 10,204 L 10,257 C 10,264 15,268.5 22,268.5 L 178,268.5 C 185,268.5 190,264 190,257 L 190,204"
              fill="none"
              stroke={`url(#${ids.metalMain})`}
              strokeWidth="0.75"
              strokeOpacity="0.42"
            />

            {/* Corniche horizontale forgée + liseré d'émail couleur club */}
            <line x1="0" y1="201" x2="200" y2="201" stroke={theme.primary} strokeWidth="1.6" strokeOpacity="0.88" />
            <line x1="0" y1="198" x2="200" y2="198" stroke={metal.dark} strokeWidth="3.2" />
            <line x1="0" y1="198" x2="200" y2="198" stroke={`url(#${ids.metalMain})`} strokeWidth="2" />

            {/* 3. Note sculptée sans boîte dans l'angle supérieur gauche */}
            <g>
              <text
                x="30"
                y="37.5"
                textAnchor="middle"
                fontSize={ratingStr.length >= 3 ? '20' : '24.5'}
                fontWeight="800"
                fill={`url(#${ids.nameGrad})`}
                fontFamily="'Cinzel', Georgia, serif"
                style={{
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(0,0,0,0.75))',
                }}
              >
                {rating}
              </text>
              <path
                d="M 17,43 Q 30,47 43,43"
                fill="none"
                stroke={`url(#${ids.metalMain})`}
                strokeWidth="1.15"
                strokeLinecap="round"
                opacity="0.9"
              />
              <circle cx="30" cy="45.8" r="1.7" fill={theme.primary} stroke={metal.light} strokeWidth="0.5" />
            </g>

            {/* 4. Lauriers sculptés + Sceau du club posés sur la corniche */}
            <LaurelWing fill={`url(#${ids.metalMain})`} />
            <LaurelWing flip fill={`url(#${ids.metalMain})`} />

            <g>
              <circle cx="100" cy="200" r="18.6" fill="rgba(0,0,0,0.62)" />
              <circle
                cx="100"
                cy="198"
                r="18.4"
                fill={`url(#${ids.wellBg})`}
                stroke={`url(#${ids.metalMain})`}
                strokeWidth="2.4"
              />
              <circle
                cx="100"
                cy="198"
                r="15.8"
                fill="none"
                stroke={`url(#${ids.metalBezel})`}
                strokeWidth="0.8"
                strokeOpacity="0.65"
              />
              <circle
                cx="100"
                cy="198"
                r="14.2"
                fill="none"
                stroke={theme.primary}
                strokeWidth="1.05"
                strokeOpacity="0.9"
              />
              {legendTeamInfo.logo && !logoError ? (
                <image
                  href={legendTeamInfo.logo}
                  x="88"
                  y="186"
                  width="24"
                  height="24"
                  preserveAspectRatio="xMidYMid meet"
                  onError={() => setLogoError(true)}
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
                />
              ) : (
                <text
                  x="100"
                  y="202"
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="800"
                  fill={metal.light}
                  fontFamily="'Cinzel', Georgia, serif"
                >
                  {legendTeamTag.slice(0, 4)}
                </text>
              )}
            </g>

            {/* 5. Typographie monumentale */}
            <text
              x="100"
              y="243.5"
              textAnchor="middle"
              fontSize={nameFontSize}
              fontWeight="800"
              fill={`url(#${ids.nameGrad})`}
              fontFamily="'Cinzel', Georgia, serif"
              letterSpacing="1.2"
              style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.95))' }}
            >
              {baseName}
            </text>

            <text
              x="100"
              y="260.5"
              textAnchor="middle"
              fontSize={subFontSize}
              fontWeight="700"
              fill={metal.text}
              fontFamily="'Inter', sans-serif"
              letterSpacing={subTracking}
            >
              {subtitle}
            </text>

            {/* 6. Reflet de vitrine au curseur + balayage lumineux */}
            <rect
              x="0"
              y="0"
              width="200"
              height="280"
              fill={`url(#${ids.sheen})`}
              style={{
                opacity: tilt.active ? 1 : 0,
                mixBlendMode: 'soft-light',
                transition: 'opacity 0.25s ease',
              }}
            />
            <polygon
              points="0,0 76,0 16,280 -60,280"
              fill={`url(#${ids.sweep})`}
              className="cl-pantheon-sweep"
              style={{ mixBlendMode: 'soft-light' }}
            />
          </g>

          {/* === BORDURE FORGÉE 3D (3 COUCHES DE RELIEF) === */}
          <path d={cardPath} fill="none" stroke={metal.dark} strokeWidth="4.4" />
          <path d={cardPath} fill="none" stroke={`url(#${ids.metalMain})`} strokeWidth="2.6" />
          <path d={innerRimPath} fill="none" stroke={`url(#${ids.metalHighlight})`} strokeWidth="0.85" />

          {/* Clé de voûte discrète au sommet de l'arche */}
          <polygon
            points="100,2.2 104.2,6.4 100,10.6 95.8,6.4"
            fill={theme.primary}
            stroke={metal.light}
            strokeWidth="0.85"
          />
        </svg>
      </div>
    </div>
  );
}