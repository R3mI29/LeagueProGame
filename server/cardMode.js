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

/** 
 * Pack de départ : garantit 10 cartes 100% Communes. 
 * (1 de chaque rôle pour assurer un roster jouable + 5 autres cartes communes).
 */
export function openStarterPack() {
  const pack = [];
  
  // 1. On garantit exactement 1 carte Commune par Rôle
  for (const role of ORDERED_ROLES) {
    const pool = CARD_POOL.filter(c => c.role === role && c.rarity === 'Commune');
    // Sécurité au cas où aucune carte commune n'existerait pour un rôle spécifique
    const safePool = pool.length > 0 ? pool : CARD_POOL.filter(c => c.role === role);
    pack.push(safePool[Math.floor(Math.random() * safePool.length)]);
  }
  
  // 2. On ajoute 5 autres cartes Communes aléatoires (pour donner 10 cartes au départ)
  const allCommons = CARD_POOL.filter(c => c.rarity === 'Commune');
  const safeAllCommons = allCommons.length > 0 ? allCommons : CARD_POOL;
  for (let i = 0; i < 1; i++) {
    pack.push(safeAllCommons[Math.floor(Math.random() * safeAllCommons.length)]);
  }
  
  return pack;
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

/** Convertit une carte en entrée de roster compatible avec le reste du jeu. */
export function cardToRosterEntry(card) {
  if (!card) return null;
  return { 
    id: card.id, 
    name: card.variant || card.baseName || card.name, 
    role: card.role, 
    rating: card.rating || card.overall || 80 
  };
}

/** Roster de bot généré directement avec 100% de cartes Communes. */
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

/** Le Bot ouvre virtuellement ses packs de récompense et améliore son roster. */
export function upgradeBotRoster(currentRoster, packsWon) {
  const newRoster = [...currentRoster];
  
  for (let i = 0; i < packsWon; i++) {
    const pack = openStandardPack(); 
    
    for (const card of pack) {
      const roleIndex = newRoster.findIndex(p => p.role === card.role);
      if (roleIndex !== -1) {
        const currentCard = newRoster[roleIndex];
        const newRating = card.rating || card.overall || 0;
        const oldRating = currentCard.rating || currentCard.overall || 0;
        
        if (newRating > oldRating && Math.random() < 0.75) {
          const newEntry = cardToRosterEntry(card);
          
          // NOUVEAU : On assigne le contrat au joueur fraîchement recruté par le bot
          newEntry.contract = card.rarity === 'Légendaire' ? 'LIFETIME' : 3; 
          
          newRoster[roleIndex] = newEntry;
        }
      }
    }
  }
  return newRoster;
}