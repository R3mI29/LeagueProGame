
import { EVENTS } from './seasonConfig.js';
import { MSI_ART, MSI_PAPER } from './skinArt.js';
// frame : styles appliqués au rectangle de l'équipe (fond, bordure, ombre)
// effect : { type: 'sweep' | 'pulse', color } réutilise les keyframes su-sweep / su-pulse de theme.css
// free : possédé d'office. Sinon il faut un grantSkin() côté serveur.
const MSI_LOGO = EVENTS.find(e => e.id === 'msi')?.logo;

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
    hint: 'Remporter 2x le MSI',
    frame: {
      background: `${MSI_ART} center top / 420px auto no-repeat, ${MSI_PAPER}`,
      borderWidth: '3px',
      borderColor: '#0a0a0a',
      borderRadius: '0px',
      boxShadow: '7px 7px 0px #E6192B',
      color: '#0a0a0a',
      '--sk-muted': '#2a2a2a',
      '--sk-good': '#0a6b3c',
      '--sk-track': 'rgba(0,0,0,0.16)',
      // Étiquettes de synergie : plaque noire, traits clairs, bonus jaune
      '--sk-plate': '#0a0a0a',
      '--sk-pip': 'rgba(255,255,255,0.2)',
      '--sk-dim': '#9aa3b2',
      '--sk-chip-lit': '#FFEA00',
      '--sk-logo-filter':
        'drop-shadow(1.5px 0 0 #0a0a0a) drop-shadow(-1.5px 0 0 #0a0a0a) drop-shadow(0 1.5px 0 #0a0a0a) drop-shadow(0 -1.5px 0 #0a0a0a)',
    },
    effect: null,
    decor: {
      tags: [
        { src: MSI_LOGO, pos: 'tl', bg: '#0a0a0a', accent: '#FFEA00', mono: 'light' },
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

/** Côté serveur : offre un skin à un joueur (ou un bot). Retourne true si nouveau. */
export function grantSkin(state, playerId, skinId) {
  if (!SKIN_BY_ID[skinId]) return false;
  if (!state.teamSkins) state.teamSkins = {};
  const entry = state.teamSkins[playerId] || (state.teamSkins[playerId] = {});
  if (!entry.owned) entry.owned = [];
  if (entry.owned.includes(skinId)) return false;
  entry.owned.push(skinId);
  return true;
}

export function revokeSkin(state, playerId, skinId) {
  const entry = state.teamSkins?.[playerId];
  if (!entry?.owned) return false;
  const i = entry.owned.indexOf(skinId);
  if (i === -1) return false;
  entry.owned.splice(i, 1);
  return true;
}