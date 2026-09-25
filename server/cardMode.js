import { CARD_POOL, RARITY_WEIGHTS } from '../src/constants/cardPlayers.js';
import { ORDERED_ROLES } from '../src/constants/roles.js';

export const PACK_SIZE = 5;

// Définition des types de packs et de leurs probabilités ajustées
export const PACK_TYPES = {
  standard: {
    name: "Pack Standard",
    price: 100,
    size: 5,
    // Base ~1000 total (Epique: 4%, Leg: 1%, Wanted: 0.3%)
    weights: { Commune: 633, Rare: 290, 'Épique': 40, 'Légendaire': 10, WANTED: 3 }
  },
  elite: {
    name: "Pack Élite",
    price: 250,
    size: 5,
    // Chances x2 sur les cartes Rares et supérieures
    weights: { Commune: 459, Rare: 435, 'Épique': 80, 'Légendaire': 20, WANTED: 6 }
  },
  legendary: {
    name: "Pack Légende",
    price: 500,
    size: 5,
    // Chances x5 sur les cartes Épiques, Légendaires et WANTED
    weights: { Commune: 155, Rare: 580, 'Épique': 200, 'Légendaire': 50, WANTED: 15 }
  }
};

function weightedRarity(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights)) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return Object.keys(weights)[0];
}

function drawCardOfRarity(rarity) {
  const pool = CARD_POOL.filter(c => c.rarity === rarity);
  if (pool.length === 0) return null;

  // RATIO 1/7 : Une carte normale pèse "7", une Full Art pèse "1"
  // Les Full Arts sont donc 7 fois plus rares à tirage équivalent
  const getCardWeight = (c) => c.isFullArt ? 1 : 7;

  // On calcule la taille totale de la pile virtuelle
  const totalWeight = pool.reduce((sum, c) => sum + getCardWeight(c), 0);
  let roll = Math.random() * totalWeight;

  // On pioche en soustrayant le VRAI poids de la carte
  for (const card of pool) {
    const weight = getCardWeight(card); 
    if (roll < weight) return card;
    roll -= weight;
  }

  // Sécurité ultime pour ne jamais avoir d'erreur
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openPack(packTypeId = 'standard') {
  const packConfig = PACK_TYPES[packTypeId] || PACK_TYPES.standard;
  const cards = [];
  
  for (let i = 0; i < packConfig.size; i++) {
    let rarity = weightedRarity(packConfig.weights);
    
    // Pity rule uniquement pour le pack standard (évite les 5 communes)
    if (packTypeId === 'standard' && i === packConfig.size - 1 && cards.length > 0 && cards.every(c => c.rarity === 'Commune')) {
      while (rarity === 'Commune') rarity = weightedRarity(packConfig.weights);
    }
    
    const card = drawCardOfRarity(rarity);
    if (card) cards.push(card);
  }
  return cards;
}

export function openStarterPack() {
  const pack = [];
  for (const role of ORDERED_ROLES) {
    const pool = CARD_POOL.filter(c => c.role === role && c.rarity === 'Commune');
    const safePool = pool.length > 0 ? pool : CARD_POOL.filter(c => c.role === role);
    pack.push(safePool[Math.floor(Math.random() * safePool.length)]);
  }
  const allCommons = CARD_POOL.filter(c => c.rarity === 'Commune');
  const safeAllCommons = allCommons.length > 0 ? allCommons : CARD_POOL;
  for (let i = 0; i < 1; i++) {
    pack.push(safeAllCommons[Math.floor(Math.random() * safeAllCommons.length)]);
  }
  return pack;
}

export function ownedCardsByRole(collection, role) {
  if (!collection) return [];
  return CARD_POOL.filter(c => c.role === role && (collection[c.id] || 0) > 0);
}

export function getCardById(id) {
  return CARD_POOL.find(c => c.id === id);
}

export function cardToRosterEntry(card) {
  if (!card) return null;
  return { 
    id: card.id, 
    name: card.variant || card.baseName || card.name, 
    role: card.role, 
    rating: card.rating || card.overall || 80,
    isFullArt: Boolean(card.isFullArt)
  };
}

export function generateBotRosterFromCards() {
  const roster = [];
  for (const role of ORDERED_ROLES) {
    const pool = CARD_POOL.filter(c => c.role === role && c.rarity === 'Commune');
    const safePool = pool.length > 0 ? pool : CARD_POOL.filter(c => c.role === role);
    const selectedCard = safePool[Math.floor(Math.random() * safePool.length)];
    roster.push(cardToRosterEntry(selectedCard));
  }
  return roster;
}

export function upgradeBotRoster(currentRoster, packsWon) {
  const newRoster = [...currentRoster];
  
  for (let i = 0; i < packsWon; i++) {
    const pack = openPack('standard'); 
    
    for (const card of pack) {
      const roleIndex = newRoster.findIndex(p => p.role === card.role);
      if (roleIndex !== -1) {
        const currentCard = newRoster[roleIndex];
        const newRating = card.rating || card.overall || 0;
        const oldRating = currentCard.rating || currentCard.overall || 0;
        
        if (newRating > oldRating && Math.random() < 0.75) {
          const newEntry = cardToRosterEntry(card);
          newEntry.contract = card.rarity === 'Légendaire' ? 'LIFETIME' : 3; 
          newRoster[roleIndex] = newEntry;
        }
      }
    }
  }
  return newRoster;
}