
import { EVENTS } from './seasonConfig.js';

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
    hint: 'Remporter le MSI',
    frame: {
      background:
        // lueur rouge, coin haut-gauche
        'radial-gradient(120% 80% at 0% 0%, rgba(230,25,43,0.38) 0%, transparent 55%), ' +
        // lueur dorée discrète, coin bas-droit
        'radial-gradient(90% 70% at 100% 100%, rgba(255,234,0,0.12) 0%, transparent 60%), ' +
        // grille fine type HUD
        'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px) 0 0 / 36px 36px, ' +
        'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px) 0 0 / 36px 36px, ' +
        // fond de base
        'linear-gradient(160deg, #14070c 0%, #090a12 55%, #0a0a0f 100%)',
      borderWidth: '2px',
      borderColor: 'rgba(230,25,43,0.9)',
      borderRadius: '6px',
      boxShadow: '6px 6px 0px #FFEA00, 0 0 40px rgba(230,25,43,0.25)',
    },
    effect: { type: 'sweep', color: 'rgba(255,234,0,0.10)' },
    decor: {
      logo: { src: MSI_LOGO, opacity: 0.14, size: '65%' },
      topLine: ['#E6192B', '#FFEA00'],
      corners: '#FFEA00',
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