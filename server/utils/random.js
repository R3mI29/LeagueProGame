// server/utils/random.js
import { calculatePowerRankingScore } from '../../src/constants/rankingConfig.js';

/**
 * Algorithme Fisher-Yates — shuffle uniforme.
 * Retourne un NOUVEAU tableau, ne mute pas l'original.
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Trie les équipes pour le seeding des tournois.
 * Si des résultats récents existent, le seeding est basé sur le Power Ranking (forme récente).
 * Sinon, il s'appuie sur les points de saison acquis ou la force initiale d'équipe.
 * En cas d'égalité, l'ordre est départagé avec un tiebreak aléatoire uniforme.
 * Retourne un NOUVEAU tableau.
 */
export function seedTeams(participants, seasonScores = {}, recentPlacements = {}, state = {}) {
  const hasRecentResults = Object.values(recentPlacements || {}).some(arr => Array.isArray(arr) && arr.length > 0);

  const withMeta = participants.map(p => {
    let prScore = 0;
    if (hasRecentResults) {
      prScore = calculatePowerRankingScore(p.id, recentPlacements, participants, state);
    }
    const points = seasonScores?.[p.id]?.points ?? 0;
    return {
      team: p,
      prScore,
      points,
      tiebreak: Math.random(),
    };
  });

  if (hasRecentResults) {
    withMeta.sort((a, b) => b.prScore - a.prScore || b.points - a.points || b.tiebreak - a.tiebreak);
  } else {
    withMeta.sort((a, b) => b.points - a.points || b.tiebreak - a.tiebreak);
  }

  return withMeta.map(x => x.team);
}
