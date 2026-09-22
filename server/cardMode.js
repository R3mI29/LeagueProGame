import { CARD_POOL, RARITY_WEIGHTS } from '../src/constants/cardPlayers.js';
import { ORDERED_ROLES } from '../src/constants/roles.js';

export const PACK_SIZE = 5;

function weightedRarity() {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return Object.keys(RARITY_WEIGHTS)[0];
}

function drawCardOfRarity(rarity) {
  const pool = CARD_POOL.filter(c => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

function drawCardOfRole(role) {
  const pool = CARD_POOL.filter(c => c.role === role);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pack standard : PACK_SIZE cartes tirées selon les probabilités de rareté.
 * "Pity rule" : si les 4 premières sont Communes, la dernière est garantie
 * Rare ou mieux (pour éviter les packs 100% ternes).
 */
export function openStandardPack() {
  const cards = [];
  for (let i = 0; i < PACK_SIZE; i++) {
    let rarity = weightedRarity();
    if (i === PACK_SIZE - 1 && cards.length > 0 && cards.every(c => c.rarity === 'Commune')) {
      while (rarity === 'Commune') rarity = weightedRarity();
    }
    const card = drawCardOfRarity(rarity);
    if (card) cards.push(card);
  }
  return cards;
}

/** Pack de départ : garantit exactement 1 carte de chaque rôle (évite de rester bloqué sans un poste). */
export function openStarterPack() {
  return ORDERED_ROLES.map(role => {
    // 1. On tire au sort une rareté en respectant tes pourcentages (ex: 3% Légendaire)
    const rarity = weightedRarity();
    
    // 2. On filtre les joueurs qui ont ce rôle ET cette rareté
    let pool = CARD_POOL.filter(c => c.role === role && c.rarity === rarity);
    
    // Sécurité : si tu n'as pas créé de carte de cette rareté pour ce rôle, on prend n'importe quelle carte du rôle
    if (pool.length === 0) {
      pool = CARD_POOL.filter(c => c.role === role);
    }
    
    // 3. On pioche la carte finale
    return pool[Math.floor(Math.random() * pool.length)];
  });
}

export function addCardsToCollection(collection, cards) {
  cards.forEach(card => {
    collection[card.id] = (collection[card.id] || 0) + 1;
  });
}

export function ownedCardsByRole(collection, role) {
  if (!collection) return [];
  return CARD_POOL.filter(c => c.role === role && (collection[c.id] || 0) > 0);
}

export function hasCompleteLineup(collection) {
  return ORDERED_ROLES.every(role => ownedCardsByRole(collection, role).length > 0);
}

export function getCardById(id) {
  return CARD_POOL.find(c => c.id === id);
}

/** Convertit une carte en entrée de roster compatible avec le reste du jeu (bracket, simulation...). */
/** Convertit une carte en entrée de roster compatible avec le reste du jeu. */
export function cardToRosterEntry(card) {
  // On utilise uniquement le champ 'variant' comme nom pour l'équipe
  return { 
    id: card.id, 
    name: card.variant, 
    role: card.role, 
    rating: card.rating 
  };
}

/** Roster de bot généré directement depuis le pool de cartes (1 carte aléatoire par rôle). */
export function generateBotRosterFromCards() {
  return ORDERED_ROLES.map(role => cardToRosterEntry(drawCardOfRole(role)));
}