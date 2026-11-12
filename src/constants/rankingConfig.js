import { CARD_POOL } from './cardPlayers.js';
import { ORDERED_ROLES } from './roles.js';

/**
 * Valeurs et métriques attribuées aux placements des tournois récents.
 */
export const PLACEMENT_CONFIG = {
  'TOP1': { points: 100, label: '1er', short: 'TOP 1', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' },
  'TOP2': { points: 75, label: 'Finaliste', short: 'TOP 2', color: '#E2E8F0', bg: 'rgba(226, 232, 240, 0.15)', border: 'rgba(226, 232, 240, 0.4)' },
  'TOP4': { points: 50, label: 'Demi-finaliste', short: 'TOP 4', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)' },
  'TOP8': { points: 30, label: 'Quart de finale', short: 'TOP 8', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
  'N/A':  { points: 10, label: 'Éliminé', short: 'ÉLIM', color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)', border: 'rgba(100, 116, 139, 0.3)' }
};

// Coefficients d'atténuation temporelle pour les 4 derniers tournois (du plus récent au plus ancien)
const RECENCY_WEIGHTS = [1.0, 0.6, 0.35, 0.2];

/**
 * Récupère les 5 cartes de l'alignement d'une équipe (humain ou bot).
 */
export function getTeamRosterCards(team, state = {}) {
  if (!team) return [];

  // 1. Si c'est un joueur humain et qu'il a un lineup actif dans state
  const lineup = state.activeLineups?.[team.id];
  if (lineup) {
    const cards = ORDERED_ROLES.map(role => {
      const cardId = lineup[role];
      return cardId ? CARD_POOL.find(c => c.id === cardId) : null;
    }).filter(Boolean);
    if (cards.length > 0) return cards;
  }

  // 2. Si le participant a déjà un tableau roster
  if (Array.isArray(team.roster) && team.roster.length > 0) {
    return team.roster.map(entry => {
      if (typeof entry === 'string') return CARD_POOL.find(c => c.id === entry);
      return entry;
    }).filter(Boolean);
  }

  return [];
}

/**
 * Calcule la note moyenne globale du 5 majeur d'une équipe.
 */
export function calculateTeamRosterPower(team, state = {}) {
  const cards = getTeamRosterCards(team, state);
  if (cards.length === 0) return 75;
  const sum = cards.reduce((acc, c) => acc + (c.rating || c.overall || 75), 0);
  return Math.round((sum / cards.length) * 10) / 10;
}

/**
 * Calcule le score du Power Ranking d'une équipe (entre 10 et 99)
 * basé principalement sur les résultats des tournois récents.
 */
export function calculatePowerRankingScore(teamId, recentPlacements = {}, participants = [], state = {}) {
  const history = recentPlacements?.[teamId] || [];
  const team = participants.find(p => p.id === teamId);
  const rosterPower = team ? calculateTeamRosterPower(team, state) : 75;

  if (!Array.isArray(history) || history.length === 0) {
    // Si aucun tournoi n'a encore été joué, la forme se base sur la puissance brute de départ
    return Math.min(99, Math.max(10, Math.round(rosterPower)));
  }

  // Calcul de la moyenne pondérée des résultats récents (inversé pour avoir le plus récent en premier)
  const reversedHistory = [...history].reverse().slice(0, 4);
  let totalWeightedScore = 0;
  let totalWeights = 0;

  reversedHistory.forEach((placement, idx) => {
    const weight = RECENCY_WEIGHTS[idx] || 0.1;
    const value = PLACEMENT_CONFIG[placement]?.points ?? 10;
    totalWeightedScore += value * weight;
    totalWeights += weight;
  });

  const placementScore = totalWeights > 0 ? (totalWeightedScore / totalWeights) : 50;

  // Forme finale : 80% historique récent + 20% qualité du roster
  const finalScore = Math.round((placementScore * 0.8) + (rosterPower * 0.2));
  return Math.min(99, Math.max(10, finalScore));
}

/**
 * Attribue le chapeau de tirage au sort (Seeding Pot 1 à 4) selon le rang.
 */
export function getSeedingPot(rank) {
  if (rank <= 4) return { pot: 1, label: 'Chapeau 1', tier: 'Favori Majeur', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' };
  if (rank <= 8) return { pot: 2, label: 'Chapeau 2', tier: 'Prétendant', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' };
  if (rank <= 12) return { pot: 3, label: 'Chapeau 3', tier: 'Outsider', color: '#A855F7', bg: 'rgba(168,85,247,0.1)' };
  return { pot: 4, label: 'Chapeau 4', tier: 'Non Protégé', color: '#64748B', bg: 'rgba(100,116,139,0.1)' };
}

/**
 * Génère le classement complet enrichi de la saison et du Power Ranking.
 */
export function calculateFullRankings(participants = [], seasonScores = {}, recentPlacements = {}, state = {}) {
  if (!Array.isArray(participants) || participants.length === 0) return [];

  // 1. Calcul des scores individuels
  const rawList = participants.map(team => {
    const scoreData = seasonScores?.[team.id] || { points: 0, titles: 0 };
    const prScore = calculatePowerRankingScore(team.id, recentPlacements, participants, state);
    const rosterCards = getTeamRosterCards(team, state);
    const rosterPower = calculateTeamRosterPower(team, state);
    const placements = recentPlacements?.[team.id] || [];

    return {
      team,
      points: scoreData.points || 0,
      titles: scoreData.titles || 0,
      prScore,
      rosterCards,
      rosterPower,
      placements,
    };
  });

  // 2. Classement Championnat (Points de Circuit)
  const sortedByPoints = [...rawList].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.titles !== a.titles) return b.titles - a.titles;
    return b.prScore - a.prScore;
  });

  // 3. Classement Power Ranking (Forme Récente)
  const sortedByPR = [...rawList].sort((a, b) => {
    if (b.prScore !== a.prScore) return b.prScore - a.prScore;
    if (b.points !== a.points) return b.points - a.points;
    return b.rosterPower - a.rosterPower;
  });

  const prRanksMap = {};
  sortedByPR.forEach((item, index) => {
    prRanksMap[item.team.id] = index + 1;
  });

  // 4. Fusion des métriques
  return sortedByPoints.map((item, index) => {
    const championshipRank = index + 1;
    const powerRank = prRanksMap[item.team.id] || championshipRank;
    const trend = championshipRank - powerRank; // Positif si le PR est meilleur que les points de saison

    let qualifStatus = 'QUALIFIÉ WORLDS (POT 1)';
    let qualifColor = '#10B981';
    if (championshipRank > 12) {
      qualifStatus = 'ZONE D\'ÉLIMINATION';
      qualifColor = '#EF4444';
    } else if (championshipRank > 8) {
      qualifStatus = 'BALLOTAGE (POT 3)';
      qualifColor = '#F59E0B';
    } else if (championshipRank > 4) {
      qualifStatus = 'EN POSITION (POT 2)';
      qualifColor = '#3B82F6';
    }

    return {
      ...item,
      championshipRank,
      powerRank,
      trend,
      qualifStatus,
      qualifColor,
      seeding: getSeedingPot(powerRank),
    };
  });
}
