import { CARD_POOL, getCardTeamTags } from './cardPlayers.js';
import { TEAMS_DB } from './teams.js';

// Normalisation des tags d'équipe secondaires vers leur franchise principale
export const TEAM_TAG_ALIASES = {
  'FRX': 'FOX',
  'MDK': 'MKOI',
  'DK.C': 'DK',
  'GENG': 'GEN',
  '100': '100T',
  'SHR': 'RYL',
  'LOUD': 'LLL',
  'TW': 'TSW',
};

// Équipes ayant remporté les Worlds de League of Legends
export const WORLDS_CHAMPION_TAGS = ['FNC', 'T1', 'SKT', 'SSG', 'IG', 'FPX', 'DWG', 'EDG', 'DRX'];

// Coût d'insertion des cartes dans la collection permanente : 0 contrat (gratuit et automatique)
export const COLLECTION_INSERT_COSTS = {
  'WANTED': 0,
  'Légendaire': 0,
  'Épique': 0,
  'Rare': 0,
  'Commune': 0,
  'SECRET': 0,
};

export function resolveTeamTag(tag) {
  if (!tag) return 'AUTRE';
  if (Array.isArray(tag)) {
    return tag.map(t => resolveTeamTag(t));
  }
  const clean = String(tag).trim();
  if (!clean) return 'AUTRE';
  const upper = clean.toUpperCase();
  return TEAM_TAG_ALIASES[upper] || upper;
}

/**
 * Calcule la difficulté et la prime d'une page d'album de façon équilibrée.
 * Basé à la fois sur le nombre de cartes à réunir et sur leur rareté.
 * Plafond à 1 200 $ pour l'équipe la plus difficile (T1).
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
      rewardCredits: 75,
      rewardDescription: '75 $'
    };
  }

  const RARITY_POINTS = {
    'Commune': 5,
    'Rare': 15,
    'Épique': 30,
    'Légendaire': 55,
    'WANTED': 90,
    'SECRET': 90,
  };

  let rarityScore = 0;
  cards.forEach(c => {
    rarityScore += RARITY_POINTS[c.rarity] || 5;
  });

  // Mélange volume (nombre de cartes) + rareté des cartes
  const volumeWeight = n * 25;
  const rarityWeight = rarityScore * 1.1;
  const rawReward = volumeWeight + rarityWeight;

  // Arrondi propre par tranche de 25 $, plafonné à 1 200 $
  let rewardCredits = Math.round(rawReward / 25) * 25;
  rewardCredits = Math.max(75, Math.min(1200, rewardCredits));

  let tier = 'ACCESSIBLE';
  let label = 'Accessible';
  let stars = 1;
  let color = '#34D399';

  if (rewardCredits >= 775) {
    tier = 'MYTHIQUE';
    label = 'Mythique';
    stars = 4;
    color = '#A855F7';
  } else if (rewardCredits >= 375) {
    tier = 'ELITE';
    label = 'Élite';
    stars = 3;
    color = '#EAB308';
  } else if (rewardCredits >= 175) {
    tier = 'INTERMEDIAIRE';
    label = 'Intermédiaire';
    stars = 2;
    color = '#38BDF8';
  }

  return {
    tier,
    label,
    stars,
    score: Math.round(rawReward),
    color,
    rewardCredits,
    rewardDescription: `${rewardCredits.toLocaleString('fr-FR')} $`
  };
}

/**
 * Récupère les cartes d'une équipe ou d'une catégorie secrète triées par rareté décroissante.
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
      if (c.rarity === 'SECRET') return false;
      const cardTags = getCardTeamTags(c);
      const normalizedCardTags = cardTags.flatMap(t => {
        const resolved = resolveTeamTag(t);
        return Array.isArray(resolved) ? resolved : [resolved];
      });
      return normalizedCardTags.includes(normalizedTarget);
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
      const cardTags = getCardTeamTags(card);
      cardTags.forEach(rawTag => {
        const resolved = resolveTeamTag(rawTag);
        const resolvedList = Array.isArray(resolved) ? resolved : [resolved];
        resolvedList.forEach(tag => {
          if (!teamCardsMap[tag]) teamCardsMap[tag] = [];
          if (!teamCardsMap[tag].some(c => c.id === card.id)) {
            teamCardsMap[tag].push(card);
          }
        });
      });
    }
  });

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

  const tierWeight = { 'MYTHIQUE': 4, 'ELITE': 3, 'INTERMEDIAIRE': 2, 'ACCESSIBLE': 1 };
  return teams.sort((a, b) => {
    const diff = (tierWeight[b.difficulty.tier] || 0) - (tierWeight[a.difficulty.tier] || 0);
    if (diff !== 0) return diff;
    return b.cardCount - a.cardCount;
  });
}

/**
 * Vérifie si une carte est enregistrée dans l'album permanent de collection
 * ou présente dans l'inventaire du joueur (auto-inclus).
 */
export function isCardInAlbum(cardId, album = {}, collection = {}) {
  if (album && album[cardId]) return true;
  if (collection && collection[cardId] !== undefined && collection[cardId] !== 0) return true;
  return false;
}

export function getCardInsertionStatus(card, myCollection = {}, album = {}) {
  const inAlbum = isCardInAlbum(card?.id, album, myCollection);
  return { canEnter: false, inAlbum, cost: 0, currentContract: 0 };
}

export function canEnterCard(cardId, myCollection = {}, album = {}) {
  return false;
}

/**
 * Calcule la progression dans l'album permanent
 */
export function getTeamProgress(teamTag, album = {}, collection = {}) {
  const cards = getTeamCollectionCards(teamTag);
  const total = cards.length;
  if (total === 0) return { ownedCount: 0, totalCount: 0, percentage: 0, isComplete: false, missingCount: 0 };

  const ownedCount = cards.filter(c => isCardInAlbum(c.id, album, collection)).length;
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

export function getPendingEnterCount() {
  return 0;
}

export function getOverallCollectionStats(album = {}, state = {}, myId = '', myCollection = {}) {
  const allTeams = getAllCollectionTeams();
  const totalCards = CARD_POOL.length;
  const uniqueOwnedCount = CARD_POOL.filter(c => isCardInAlbum(c.id, album, myCollection)).length;
  const overallPercentage = totalCards > 0 ? Math.round((uniqueOwnedCount / totalCards) * 100) : 0;

  const claimedMap = state?.collectionRewardsClaimed?.[myId] || {};

  let completedTeams = 0;
  let unclaimedCount = 0;
  let totalCreditsEarned = 0;

  allTeams.forEach(team => {
    const { isComplete } = getTeamProgress(team.tag, album, myCollection);
    if (isComplete) {
      completedTeams += 1;
      if (!isTeamMilestoneClaimed(team.tag, 100, claimedMap)) {
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
    unclaimedTeamMilestones: unclaimedCount,
    unclaimedGlobalMilestones: 0,
    unclaimedCount,
    totalCreditsEarned,
  };
}

/**
 * Récompense unique à 100% de complétion de l'équipe
 */
export function getTeamMilestones(teamTag, cards = null) {
  const teamCards = cards || getTeamCollectionCards(teamTag);
  const total = teamCards.length;
  if (total === 0) return [];

  const difficulty = calculateTeamDifficulty(teamCards);

  return [
    {
      percent: 100,
      requiredCount: total,
      label: '100%',
      credits: difficulty.rewardCredits,
      description: `Compléter l'équipe (${total}/${total})`
    }
  ];
}

export function isTeamMilestoneClaimed(teamTag, percent = 100, claimedRewardsMap = {}) {
  if (!claimedRewardsMap) return false;
  return Boolean(
    claimedRewardsMap[teamTag] ||
    claimedRewardsMap[`${teamTag}_100`] ||
    claimedRewardsMap[`${teamTag}_${percent}`]
  );
}

export function getClaimableTeamMilestones(teamTag, album = {}, claimedRewardsMap = {}, collection = {}) {
  const cards = getTeamCollectionCards(teamTag);
  const ownedCount = cards.filter(c => isCardInAlbum(c.id, album, collection)).length;
  const isComplete = ownedCount === cards.length && cards.length > 0;
  const isClaimed = isTeamMilestoneClaimed(teamTag, 100, claimedRewardsMap);

  if (isComplete && !isClaimed) {
    return getTeamMilestones(teamTag, cards);
  }
  return [];
}

// Stubs de compatibilité pour les anciennes références éventuelles
export const COLLECTION_GLOBAL_MILESTONES = [];
export function getMilestoneProgress() {
  return { current: 0, target: 0, percentage: 0, isCompleted: false };
}
export function getClaimableGlobalMilestones() {
  return [];
}
