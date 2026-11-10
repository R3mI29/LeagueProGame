import { CARD_POOL } from './cardPlayers.js';
import { TEAMS_DB } from './teams.js';

// Normalisation des tags d'équipe secondaires vers leur franchise principale
export const TEAM_TAG_ALIASES = {
  'FRX': 'FOX',
  'MDK': 'MKOI',
  'MAD': 'MKOI',
  'DK.C': 'DK',
};

// Équipes ayant remporté les Worlds de League of Legends
export const WORLDS_CHAMPION_TAGS = ['FNC', 'T1', 'SKT', 'SSG', 'IG', 'FPX', 'DWG', 'EDG', 'DRX'];

// Coût d'insertion des cartes dans la collection permanente (en contrats TRN)
// - Cartes À VIE : 0 TRN (ne consomme rien)
// - Cartes SECRÈTES : 0 TRN (s'insèrent automatiquement)
export const COLLECTION_INSERT_COSTS = {
  'WANTED': 2,
  'Légendaire': 3,
  'Épique': 4,
  'Rare': 5,
  'Commune': 6,
  'SECRET': 0,
};

export function resolveTeamTag(tag) {
  if (!tag) return 'AUTRE';
  const upper = tag.toUpperCase();
  return TEAM_TAG_ALIASES[upper] || upper;
}

const RARITY_BASE_VALUE = {
  'Commune': 40,
  'Rare': 80,
  'Épique': 180,
  'Légendaire': 380,
  'WANTED': 750,
  'SECRET': 900,
};

/**
 * Calcule la difficulté et la prime d'une page d'album de façon non-linéaire
 */
export function calculateTeamDifficulty(cards = []) {
  const n = cards.length;
  if (n === 0) {
    return {
      tier: 'ACCESSIBLE',
      label: 'Accessible',
      stars: 1,
      score: 0,
      color: '#34D399',
      rewardCredits: 100,
      rewardDescription: '100 💲 Crédits de Collectionneur'
    };
  }

  let baseSum = 0;
  cards.forEach(c => {
    baseSum += RARITY_BASE_VALUE[c.rarity] || 40;
  });

  // Multiplicateur non linéaire basé sur la difficulté exponentielle de compléter un album complet (Coupon Collector)
  const countMult = 1 + (Math.pow(Math.max(1, n) - 1, 1.05) * 0.028);
  const rawReward = baseSum * countMult;
  
  // Arrondi au 50 le plus proche, minimum 100
  const rewardCredits = Math.max(100, Math.round(rawReward / 50) * 50);

  let tier = 'ACCESSIBLE';
  let label = 'Accessible';
  let stars = 1;
  let color = '#34D399';

  if (rewardCredits >= 3000) {
    tier = 'MYTHIQUE';
    label = 'Mythique';
    stars = 4;
    color = '#A855F7';
  } else if (rewardCredits >= 1200) {
    tier = 'ELITE';
    label = 'Élite';
    stars = 3;
    color = '#EAB308';
  } else if (rewardCredits >= 300) {
    tier = 'INTERMEDIAIRE';
    label = 'Intermédiaire';
    stars = 2;
    color = '#38BDF8';
  }

  return {
    tier,
    label,
    stars,
    score: Math.round(baseSum),
    color,
    rewardCredits,
    rewardDescription: `${rewardCredits.toLocaleString('fr-FR')} 💲 Crédits de Collectionneur`
  };
}

/**
 * Récupère les cartes d'une équipe ou d'une catégorie secrète triées par rareté décroissante.
 * Les cartes SECRETE sont exclues des albums d'équipe et regroupées par ligue (SECRET_LPL, SECRET_LCK...)
 */
export function getTeamCollectionCards(targetTeamTag) {
  if (!targetTeamTag) return [];

  let cards = [];
  if (targetTeamTag.startsWith('SECRET_')) {
    const targetLeague = targetTeamTag.replace('SECRET_', '').toUpperCase();
    cards = CARD_POOL.filter(c => c.rarity === 'SECRET' && (c.league || 'LPL').toUpperCase() === targetLeague);
  } else {
    const normalizedTarget = resolveTeamTag(targetTeamTag);
    cards = CARD_POOL.filter(c => {
      if (c.rarity === 'SECRET') return false; // Les secrètes ont leur propre catégorie hors équipe
      const cardTag = resolveTeamTag(c.teamTag);
      return cardTag === normalizedTarget;
    });
  }

  const rarityWeight = {
    'SECRET': 6,
    'WANTED': 5,
    'Légendaire': 4,
    'Épique': 3,
    'Rare': 2,
    'Commune': 1,
  };

  return cards.sort((a, b) => {
    const diff = (rarityWeight[b.rarity] || 0) - (rarityWeight[a.rarity] || 0);
    if (diff !== 0) return diff;
    return (b.rating || b.overall || 0) - (a.rating || a.overall || 0);
  });
}

/**
 * Récupère toutes les équipes et catégories d'album
 */
export function getAllCollectionTeams() {
  const teamCardsMap = {};
  const secretLeaguesMap = {};

  CARD_POOL.forEach(card => {
    if (card.rarity === 'SECRET') {
      const l = (card.league || 'LPL').toUpperCase();
      if (!secretLeaguesMap[l]) secretLeaguesMap[l] = [];
      secretLeaguesMap[l].push(card);
    } else {
      const tag = resolveTeamTag(card.teamTag);
      if (!teamCardsMap[tag]) teamCardsMap[tag] = [];
      teamCardsMap[tag].push(card);
    }
  });

  // Équipes normales
  const teams = Object.entries(teamCardsMap).map(([tag, cards]) => {
    const teamDbEntry = TEAMS_DB.find(t => t.tag === tag);
    const difficulty = calculateTeamDifficulty(cards);

    const leaguesCount = {};
    cards.forEach(c => {
      const l = c.league || 'INTERNATIONAL';
      leaguesCount[l] = (leaguesCount[l] || 0) + 1;
    });
    const mainLeague = Object.entries(leaguesCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'LCK';

    return {
      tag,
      name: teamDbEntry?.name || tag,
      logo: teamDbEntry?.logo || '/logo/others/League_of_legend.svg',
      league: mainLeague,
      cards: getTeamCollectionCards(tag),
      cardCount: cards.length,
      difficulty,
      isSecret: false
    };
  });

  // Catégories secrètes par ligue
  Object.entries(secretLeaguesMap).forEach(([league, secretCards]) => {
    const secretTag = `SECRET_${league}`;
    const difficulty = calculateTeamDifficulty(secretCards);
    const leagueLower = league.toLowerCase();

    teams.push({
      tag: secretTag,
      name: `SECRÈTES ${league}`,
      logo: `/leagues/${leagueLower}.webp`,
      league,
      cards: getTeamCollectionCards(secretTag),
      cardCount: secretCards.length,
      difficulty,
      isSecret: true
    });
  });

  // Tri par difficulté (Mythique -> Accessible) puis par nombre de cartes décroissant
  const tierWeight = { 'MYTHIQUE': 4, 'ELITE': 3, 'INTERMEDIAIRE': 2, 'ACCESSIBLE': 1 };
  return teams.sort((a, b) => {
    const diff = (tierWeight[b.difficulty.tier] || 0) - (tierWeight[a.difficulty.tier] || 0);
    if (diff !== 0) return diff;
    return b.cardCount - a.cardCount;
  });
}

/**
 * Vérifie si une carte est enregistrée dans l'album permanent de collection
 */
export function isCardInAlbum(cardId, album = {}) {
  return Boolean(album && album[cardId]);
}

/**
 * Vérifie si le joueur peut insérer la carte et calcule le coût en TRN
 */
export function getCardInsertionStatus(card, myCollection = {}, album = {}) {
  if (!card) return { canEnter: false, inAlbum: false, cost: 0, currentContract: 0 };
  const cardId = card.id;

  if (isCardInAlbum(cardId, album)) {
    return { canEnter: false, inAlbum: true, cost: 0, currentContract: 0 };
  }

  const currentContract = myCollection?.[cardId];
  const hasInInventory = currentContract !== undefined && currentContract !== 0;

  if (!hasInInventory) {
    return { canEnter: false, inAlbum: false, notOwned: true, cost: 0, currentContract: 0 };
  }

  // Si SECRETE : gratuit et automatique
  if (card.rarity === 'SECRET') {
    return { canEnter: true, inAlbum: false, cost: 0, isSecret: true, currentContract };
  }

  // Si À VIE : 0 TRN
  if (currentContract === 'LIFETIME') {
    return { canEnter: true, inAlbum: false, cost: 0, isLifetime: true, currentContract: 'LIFETIME' };
  }

  const cost = COLLECTION_INSERT_COSTS[card.rarity] || 0;
  const hasEnough = typeof currentContract === 'number' && currentContract >= cost;

  return {
    canEnter: hasEnough,
    inAlbum: false,
    cost,
    currentContract,
    notEnough: !hasEnough,
    missingContracts: cost - (typeof currentContract === 'number' ? currentContract : 0)
  };
}

export function canEnterCard(cardId, myCollection = {}, album = {}) {
  const card = CARD_POOL.find(c => c.id === cardId);
  if (!card) return false;
  const status = getCardInsertionStatus(card, myCollection, album);
  return status.canEnter;
}

/**
 * Calcule la progression dans l'album permanent
 */
export function getTeamProgress(teamTag, album = {}) {
  const cards = getTeamCollectionCards(teamTag);
  const total = cards.length;
  if (total === 0) return { ownedCount: 0, totalCount: 0, percentage: 0, isComplete: false, missingCount: 0 };

  const ownedCount = cards.filter(c => isCardInAlbum(c.id, album)).length;
  const percentage = Math.round((ownedCount / total) * 100);
  const isComplete = ownedCount === total;

  return {
    ownedCount,
    totalCount: total,
    percentage,
    isComplete,
    missingCount: total - ownedCount
  };
}

/**
 * Nombre de cartes insérées prêtes (pour affichage / badge)
 */
export function getPendingEnterCount(teamTag, myCollection = {}, album = {}) {
  const cards = teamTag ? getTeamCollectionCards(teamTag) : CARD_POOL;
  return cards.filter(c => canEnterCard(c.id, myCollection, album)).length;
}

/**
 * Calcule les statistiques globales de l'album
 */
export function getOverallCollectionStats(album = {}, state = {}, myId = '', myCollection = {}) {
  const allTeams = getAllCollectionTeams();
  const totalCards = CARD_POOL.length;
  const uniqueOwnedCount = CARD_POOL.filter(c => isCardInAlbum(c.id, album)).length;
  const overallPercentage = totalCards > 0 ? Math.round((uniqueOwnedCount / totalCards) * 100) : 0;

  const claimedMap = state?.collectionRewardsClaimed?.[myId] || {};
  let completedTeams = 0;
  let unclaimedCount = 0;
  let totalCreditsEarned = 0;

  allTeams.forEach(team => {
    const { isComplete } = getTeamProgress(team.tag, album);
    if (isComplete) {
      completedTeams += 1;
      if (!claimedMap[team.tag]) {
        unclaimedCount += 1;
      }
    }
  });

  Object.values(claimedMap).forEach(claim => {
    totalCreditsEarned += claim.amount || 0;
  });

  return {
    totalCards,
    uniqueOwnedCount,
    overallPercentage,
    totalTeams: allTeams.length,
    completedTeams,
    unclaimedCount,
    totalCreditsEarned,
  };
}
