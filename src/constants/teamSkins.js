import { EVENTS } from './seasonConfig.js';

// frame : styles appliqués au rectangle de l'équipe (fond, bordure, ombre)
// effect : { type: 'sweep' | 'pulse', color } réutilise les keyframes su-sweep / su-pulse de theme.css
// free : possédé d'office. Sinon il faut un grantSkin() côté serveur.
const MSI_LOGO = EVENTS.find(e => e.id === 'msi')?.logo;
// Ajoute ceci en haut de src/constants/teamSkins.js (sous tes imports)
const WORLDS_LOGO = EVENTS.find(e => e.id === 'worlds')?.logo;

const RARITY_RANK = {
  'Commune': 1,
  'Rare': 2,
  'Épique': 3,
  'Légendaire': 4,
  'WANTED': 5,
  'SECRET': 6,
};

export const SKINS = [
  { id: 'default', name: 'Classique', rarity: 'Commune', free: true, frame: null, effect: null },
  {
    id: 'gold-circuit', name: 'Circuit Doré', rarity: 'Rare', free: true,
    frame: {
      background: 'linear-gradient(160deg, #1a1608 0%, #0d0b05 65%)',
      borderColor: 'rgba(212,175,55,0.7)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 28px rgba(212,175,55,0.18)',
    },
    effect: { type: 'sweep', color: 'rgba(255,215,0,0.14)' },
  },
  {
    id: 'neon-protocol', name: 'Néon Protocole', rarity: 'Épique', free: false,
    frame: {
      background: 'linear-gradient(160deg, #1a0a1f 0%, #0a0612 65%)',
      borderColor: 'rgba(255,51,102,0.7)',
      boxShadow: '0 0 30px rgba(255,51,102,0.25), 0 0 60px rgba(0,229,255,0.1)',
    },
    effect: { type: 'pulse', color: 'rgba(255,51,102,0.16)' },
  },
  {
    id: 'worlds-sovereign',
    name: 'World Champion',
    rarity: 'Légendaire',
    free: false,
    hint: 'Remporter les Worlds',
    frame: {
      // Uniquement un fondu noir en bas pour lire le texte, le haut de l'image reste 100% brut et net
      background: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(5,6,10,0.92) 100%), url('/assets/worlds_sober.png') center top / cover no-repeat",
      borderColor: 'rgba(226, 232, 240, 0.65)',
      boxShadow: '0 12px 35px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.12)',
      '--sk-plate': 'rgba(8, 10, 15, 0.9)',
      '--sk-good': '#ffffff',
      '--sk-chip-lit': '#e2e8f0',
    },
    effect: { type: 'sweep', color: 'rgba(255, 255, 255, 0.12)' },
    decor: {
      tags: [
        { src: EVENTS.find(e => e.id === 'worlds')?.logo, pos: 'tl', bg: '#050608', accent: '#ffffff', mono: 'light' },
      ],
    },
  },
  {
    id: 'glacier', name: 'Glacier', rarity: 'Rare', free: false,
    frame: {
      background: 'linear-gradient(160deg, #0b1a2b 0%, #08111c 65%)',
      borderColor: 'rgba(120,200,255,0.55)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 24px rgba(120,200,255,0.14)',
    },
    effect: { type: 'pulse', color: 'rgba(120,200,255,0.12)' },
  },
  {
    // Exemple de skin à image : dépose ton fichier dans public/skins/
    id: 'demon-curse', name: 'Malédiction Brisée', rarity: 'Légendaire', free: false,
    hint: 'Secret : brise la malédiction',
    frame: {
      background: "linear-gradient(rgba(10,4,8,0.78), rgba(10,4,8,0.92)), url('/skins/demon-curse.webp') center / cover",
      borderColor: 'rgba(229,20,46,0.8)',
      boxShadow: '0 0 40px rgba(229,20,46,0.3), 0 10px 30px rgba(0,0,0,0.6)',
    },
    effect: { type: 'sweep', color: 'rgba(255,90,120,0.14)' },
  },
  {
    id: 'msi-clash', name: 'MSI Clash', rarity: 'Légendaire', free: false,
    hint: 'Remporter le MSI',
    frame: {
      background: [
        'radial-gradient(circle at 50% 32%, rgba(8, 3, 15, 0.25) 0%, rgba(8, 3, 15, 0.72) 65%, rgba(6, 2, 12, 0.92) 100%)',
        'linear-gradient(180deg, rgba(255, 0, 55, 0.12) 0%, rgba(10, 4, 18, 0.85) 100%)',
        "url('/assets/msi-2024-league-of-legends.jpg') center 28% / cover no-repeat"
      ].join(', '),
      borderWidth: '2px',
      borderColor: '#ff0037',
      borderRadius: '10px',
      boxShadow: '0 14px 35px rgba(0, 0, 0, 0.85), -6px 0 24px rgba(255, 0, 55, 0.4), 6px 0 24px rgba(168, 85, 247, 0.35), inset 0 0 20px rgba(255, 0, 55, 0.25)',
      color: '#ffffff',
      '--sk-muted': '#fda4af',
      '--sk-good': '#d4ff00',
      '--sk-track': 'rgba(255, 0, 55, 0.22)',
      '--sk-plate': 'rgba(7, 3, 14, 0.86)',
      '--sk-pip': 'rgba(255, 255, 255, 0.22)',
      '--sk-dim': '#9ca3af',
      '--sk-chip-lit': '#d4ff00',
      '--sk-logo-filter': 'drop-shadow(0 0 10px rgba(255, 0, 55, 0.75))',
    },
    effect: { type: 'sweep', color: 'rgba(255, 0, 85, 0.20)' },
    decor: {
      tags: [
        { src: MSI_LOGO, pos: 'tl', bg: '#07030e', accent: '#ff0037', mono: 'light' },
      ],
    },
  },
];

export const SKIN_BY_ID = Object.fromEntries(SKINS.map(s => [s.id, s]));
export const getSkin = (id) => SKIN_BY_ID[id] || SKIN_BY_ID.default;

export function canUseSkin(state, playerId, skinId) {
  const skin = SKIN_BY_ID[skinId];
  if (!skin) return false;
  return !!skin.free || !!state?.teamSkins?.[playerId]?.owned?.includes(skinId);
}

export function getEquippedSkinId(state, playerId) {
  const id = state?.teamSkins?.[playerId]?.equipped;
  return id && canUseSkin(state, playerId, id) ? id : 'default';
}

/** Équipe automatiquement le skin le plus rare possédé par un joueur/bot. */
export function equipRarestSkin(state, playerId) {
  const owned = state?.teamSkins?.[playerId]?.owned;
  if (!owned || owned.length === 0) return null;

  let bestSkinId = null;
  let bestRank = -1;

  owned.forEach(skinId => {
    const skin = SKIN_BY_ID[skinId];
    if (!skin) return;
    const rank = RARITY_RANK[skin.rarity] ?? 0;
    if (rank >= bestRank) {
      bestRank = rank;
      bestSkinId = skin.id;
    }
  });

  if (bestSkinId) {
    state.teamSkins[playerId].equipped = bestSkinId;
  }
  return bestSkinId;
}

/** Côté serveur : offre un skin à un joueur (ou un bot). Retourne true si nouveau. */
export function grantSkin(state, playerId, skinId) {
  if (!SKIN_BY_ID[skinId]) return false;
  if (!state.teamSkins) state.teamSkins = {};
  const entry = state.teamSkins[playerId] || (state.teamSkins[playerId] = {});
  if (!entry.owned) entry.owned = [];

  const isNew = !entry.owned.includes(skinId);
  if (isNew) {
    entry.owned.push(skinId);
  }

  // Si c'est un bot, il équipe immédiatement le skin le plus rare en sa possession
  const participant = state.participants?.find(p => p.id === playerId);
  if (playerId.startsWith('bot-') || participant?.isBot || participant?.isPermanentBot) {
    equipRarestSkin(state, playerId);
  }

  return isNew;
}

export function revokeSkin(state, playerId, skinId) {
  const entry = state.teamSkins?.[playerId];
  if (!entry?.owned) return false;
  const i = entry.owned.indexOf(skinId);
  if (i === -1) return false;
  entry.owned.splice(i, 1);
  return true;
}