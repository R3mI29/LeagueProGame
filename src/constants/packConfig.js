/**
 * Configuration des packs, probabilités et Trade-Up.
 * Raretés représentées par les étoiles officielles (/assets/rarity/*.png).
 */

export const RARITY_STAR_ICONS = {
  'Commune': '/assets/rarity/commune.png',
  'Rare': '/assets/rarity/rare.png',
  'Épique': '/assets/rarity/epique.png',
  'Légendaire': '/assets/rarity/legendaire.png',
  'WANTED': '/assets/rarity/WANTED.png',
};

export const DUPLICATE_SALVAGE = {
  'Commune': 10,
  'Rare': 25,
  'Épique': 75,
  'Légendaire': 200,
  'WANTED': 500,
  'SECRET': 800,
};

// Probabilité identique d'avoir un contrat À VIE pour tous les packs achetables (très faible : 1%)
export const PURCHASABLE_PACK_LIFETIME_CHANCE = 0.01;

export const PACK_TYPES = {
  starter: {
    id: 'starter',
    name: "Pack de Départ",
    price: 0,
    size: 6,
    description: "6 cartes de base avec contrat À VIE.",
    badge: "GRATUIT",
    color: '#10B981',
    accentColor: '#34D399',
    pattern: '/assets/booster/grey_stars.jpg',
    logo: '/logo/others/League_of_legend.svg',
    weights: { Commune: 1000 },
    lifetimeChance: 1.0,
  },
  standard: {
    id: 'standard',
    name: "Pack Standard",
    price: 100,
    size: 5,
    description: "Booster équilibré.",
    badge: "Standard",
    color: '#64748B',
    accentColor: '#94A3B8',
    pattern: '/assets/booster/grey_stars.jpg',
    logo: '/logo/others/League_of_legend.svg',
    weights: { Commune: 620, Rare: 320, 'Épique': 48, 'Légendaire': 10, WANTED: 2 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  elite: {
    id: 'elite',
    name: "Pack Élite",
    price: 220,
    size: 5,
    description: "1 Rare minimum garantie.",
    badge: "Élite",
    color: '#0284C7',
    accentColor: '#00E5FF',
    pattern: '/assets/booster/blue_stars.jpg',
    logo: '/logo/others/League_of_legend.svg',
    weights: { Commune: 380, Rare: 470, 'Épique': 110, 'Légendaire': 35, WANTED: 5 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  legendary: {
    id: 'legendary',
    name: "Pack Légende",
    price: 500,
    size: 5,
    description: "Forte présence d'Épiques et Légendaires.",
    badge: "Légende",
    color: '#B45309',
    accentColor: '#F59E0B',
    pattern: '/assets/booster/yellow_stars.jpg',
    logo: '/logo/others/League_of_legend.svg',
    weights: { Commune: 100, Rare: 480, 'Épique': 300, 'Légendaire': 100, WANTED: 20 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  wanted: {
    id: 'wanted',
    name: "Pack WANTED",
    price: 1200,
    size: 5,
    description: "100% Épiques, Légendaires et WANTED.",
    badge: "WANTED",
    color: '#BE123C',
    accentColor: '#F43F5E',
    pattern: '/assets/booster/wanted_stars.jpg',
    logo: '/logo/others/League_of_legend.svg',
    weights: { Commune: 0, Rare: 0, 'Épique': 650, 'Légendaire': 250, WANTED: 100 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  all_stars: {
    id: 'all_stars',
    name: "Pack All-Stars",
    price: 900,
    size: 4,
    description: "4 cartes 100% Épiques, Légendaires et WANTED.",
    badge: "All-Stars",
    color: '#7C3AED',
    accentColor: '#A78BFA',
    pattern: '/assets/booster/blue_stars.jpg',
    logo: '/logo/tournament/world-championship.webp',
    weights: { Commune: 0, Rare: 0, 'Épique': 680, 'Légendaire': 250, WANTED: 70 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  jumbo: {
    id: 'jumbo',
    name: "Jumbo Booster",
    price: 450,
    size: 8,
    description: "Booster XXL de 8 cartes pour compléter vos albums.",
    badge: "Jumbo",
    color: '#059669',
    accentColor: '#34D399',
    pattern: '/assets/booster/yellow_stars.jpg',
    logo: '/logo/others/League_of_legend.svg',
    weights: { Commune: 450, Rare: 420, 'Épique': 105, 'Légendaire': 23, WANTED: 2 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  lck_pack: {
    id: 'lck_pack',
    name: "Booster LCK",
    price: 350,
    size: 5,
    description: "5 cartes 100% issues de la ligue coréenne LCK.",
    badge: "LCK",
    color: '#1E3A8A',
    accentColor: '#3B82F6',
    pattern: '/assets/booster/blue_stars.jpg',
    logo: '/leagues/lck.webp',
    filter: c => (c.league || '').toUpperCase() === 'LCK',
    weights: { Commune: 320, Rare: 480, 'Épique': 150, 'Légendaire': 42, WANTED: 8 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  lpl_pack: {
    id: 'lpl_pack',
    name: "Booster LPL",
    price: 350,
    size: 5,
    description: "5 cartes 100% issues de la ligue chinoise LPL.",
    badge: "LPL",
    color: '#991B1B',
    accentColor: '#EF4444',
    pattern: '/assets/booster/white stars_red_background.jpg',
    logo: '/leagues/lpl.webp',
    filter: c => (c.league || '').toUpperCase() === 'LPL',
    weights: { Commune: 320, Rare: 480, 'Épique': 150, 'Légendaire': 42, WANTED: 8 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  lec_pack: {
    id: 'lec_pack',
    name: "Booster LEC",
    price: 300,
    size: 5,
    description: "5 cartes 100% issues du championnat européen LEC.",
    badge: "LEC",
    color: '#065F46',
    accentColor: '#10B981',
    pattern: '/assets/booster/blue_stars.jpg',
    logo: '/leagues/lec.webp',
    filter: c => (c.league || '').toUpperCase() === 'LEC',
    weights: { Commune: 380, Rare: 460, 'Épique': 125, 'Légendaire': 30, WANTED: 5 },
    lifetimeChance: PURCHASABLE_PACK_LIFETIME_CHANCE,
  },
  skin_pack: {
    id: 'skin_pack',
    name: "Booster de Skins",
    price: 600,
    size: 1,
    description: "1 skin officiel d'équipe parmi les modèles droppables (ou compensation).",
    badge: "SKIN",
    color: '#A855F7',
    accentColor: '#C084FC',
    pattern: '/assets/booster/blue_stars.jpg',
    logo: '/logo/others/League_of_legend.svg',
    weights: { Rare: 600, 'Épique': 300, 'Légendaire': 100 },
  }
};

/**
 * Paliers de Trade-Up :
 * - Commune → Rare : 24 ans
 * - Rare → Épique : 20 ans
 * - Épique → Légendaire : 18 ans
 * - Légendaire → WANTED : 15 ans
 */
export const TRADE_UP_TIERS = [
  {
    id: 'commune_to_rare',
    fromRarity: 'Commune',
    toRarity: 'Rare',
    requiredYears: 24,
    rewardYears: 4,
    label: 'Commune → Rare',
    fromColor: '#8b9bb4',
    toColor: '#00e5ff',
    animate: false,
  },
  {
    id: 'rare_to_epic',
    fromRarity: 'Rare',
    toRarity: 'Épique',
    requiredYears: 20,
    rewardYears: 4,
    label: 'Rare → Épique',
    fromColor: '#00e5ff',
    toColor: 'rgb(255, 51, 102)',
    animate: true,
  },
  {
    id: 'epic_to_legendary',
    fromRarity: 'Épique',
    toRarity: 'Légendaire',
    requiredYears: 18,
    rewardYears: 4,
    label: 'Épique → Légendaire',
    fromColor: '#ff3366',
    toColor: 'rgb(255, 215, 0)',
    animate: true,
  },
  {
    id: 'legendary_to_wanted',
    fromRarity: 'Légendaire',
    toRarity: 'WANTED',
    requiredYears: 15,
    rewardYears: 4,
    label: 'Légendaire → WANTED',
    fromColor: '#ffd700',
    toColor: '#ffffff',
    animate: true,
  },
];

export function calculatePackProbabilities(weights = {}) {
  const total = Object.values(weights).reduce((sum, w) => sum + (Number(w) || 0), 0);
  if (total === 0) return {};
  const probs = {};
  for (const [rarity, weight] of Object.entries(weights)) {
    probs[rarity] = Math.round(((weight / total) * 100) * 10) / 10;
  }
  return probs;
}
