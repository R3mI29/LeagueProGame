import { CARD_POOL, RARITY_WEIGHTS, getCardTeamTags } from '../../src/constants/cardPlayers.js';
import { ORDERED_ROLES } from '../../src/constants/roles.js';
import { PACK_TYPES } from '../../src/constants/packConfig.js';

export { PACK_TYPES };
export const PACK_SIZE = 5;

function weightedRarity(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights)) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return Object.keys(weights)[0];
}

function drawCardOfRarity(rarity, filterFn = null) {
  let pool = CARD_POOL.filter(c => c.rarity === rarity);
  if (filterFn) {
    const filteredPool = pool.filter(filterFn);
    if (filteredPool.length > 0) {
      pool = filteredPool;
    }
  }
  if (pool.length === 0) {
    pool = CARD_POOL.filter(c => c.rarity === rarity);
  }
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
  const filterFn = packConfig.filter || null;
  
  for (let i = 0; i < packConfig.size; i++) {
    let rarity = weightedRarity(packConfig.weights);
    
    // Pity rule uniquement pour le pack standard (évite les 5 communes)
    if (packTypeId === 'standard' && i === packConfig.size - 1 && cards.length > 0 && cards.every(c => c.rarity === 'Commune')) {
      while (rarity === 'Commune') rarity = weightedRarity(packConfig.weights);
    }
    
    const card = drawCardOfRarity(rarity, filterFn);
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
    baseName: card.baseName,
    role: card.role, 
    league: card.league,
    teamTag: card.teamTag,
    teamTags: card.teamTags || getCardTeamTags(card),
    rating: card.rating || card.overall || 80,
    rarity: card.rarity,
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
