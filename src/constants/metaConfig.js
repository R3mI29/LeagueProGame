import { CARD_POOL } from './cardPlayers.js';
import { ALL_CHAMPIONS, getChampionsByRole, getChampionById } from './championsData.js';
import { getPlayerChampionPool } from './playerChampionPools.js';

export { ALL_CHAMPIONS, getChampionsByRole, getChampionById };

export const AVAILABLE_LEAGUES = ['LCK', 'LPL', 'LEC', 'LCS'];
export const META_TARGET_POINTS = 100;
export const CHAMPION_META_TARGET_POINTS = 10;

/**
 * 7 Paliers de Méta des Champions avec Bonus / Malus
 */
export const CHAMPION_META_TIERS = {
  BROKEN: {
    id: 'BROKEN',
    label: 'BROKEN',
    bonus: 3,
    color: '#FF0055',
    badgeBg: 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/50',
    description: 'Surpuissant sur le patch (+3 Note)',
  },
  TRES_BON: {
    id: 'TRES_BON',
    label: 'Très bon',
    bonus: 2,
    color: '#00E676',
    badgeBg: 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]/50',
    description: 'Dominant dans la méta (+2 Note)',
  },
  BON: {
    id: 'BON',
    label: 'Bon',
    bonus: 1,
    color: '#38BDF8',
    badgeBg: 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/50',
    description: 'Choix solide (+1 Note)',
  },
  EQUILIBRE: {
    id: 'EQUILIBRE',
    label: 'Équilibré',
    bonus: 0,
    color: '#94A3B8',
    badgeBg: 'bg-[#94A3B8]/20 text-[#94A3B8] border-[#94A3B8]/50',
    description: 'Neutre / Équilibré (0 Note)',
  },
  MAUVAIS: {
    id: 'MAUVAIS',
    label: 'Mauvais',
    bonus: -1,
    color: '#F59E0B',
    badgeBg: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50',
    description: 'En retrait sur le patch (-1 Note)',
  },
  TRES_MAUVAIS: {
    id: 'TRES_MAUVAIS',
    label: 'Très mauvais',
    bonus: -2,
    color: '#EF4444',
    badgeBg: 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50',
    description: 'Inadapté à la méta (-2 Note)',
  },
  HORRIBLE: {
    id: 'HORRIBLE',
    label: 'HORRIBLE',
    bonus: -3,
    color: '#7F1D1D',
    badgeBg: 'bg-[#7F1D1D]/30 text-[#F87171] border-[#EF4444]/60',
    description: 'Pire choix possible du patch (-3 Note)',
  },
};

export const CHAMPION_META_TIER_ORDER = [
  'BROKEN',
  'TRES_BON',
  'BON',
  'EQUILIBRE',
  'MAUVAIS',
  'TRES_MAUVAIS',
  'HORRIBLE',
];

function seededRandom(seed) {
  let s = Math.abs(seed % 2147483647);
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Génère la méta de tous les champions pour l'année organisée par rôle :
 * Pour chaque rôle (Top, Jungle, Mid, ADC, Support) :
 * Tiers: BROKEN (1-3 par rôle), Très bon, Bon, Équilibré, Mauvais, Très mauvais, HORRIBLE (1-3 par rôle).
 */
export function generateChampionMetaTiers(year = 1) {
  const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  const tiersByRole = {};

  roles.forEach((role, rIdx) => {
    const rng = seededRandom(year * 4391 + rIdx * 1013 + 7919);
    const roleChamps = [...getChampionsByRole(role)];

    for (let i = roleChamps.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [roleChamps[i], roleChamps[j]] = [roleChamps[j], roleChamps[i]];
    }

    // 1 à 3 champions aléatoires dans BROKEN et HORRIBLE par rôle
    const maxExtreme = Math.max(1, Math.min(3, Math.floor(roleChamps.length / 10)));
    const brokenCount = 1 + Math.floor(rng() * maxExtreme);
    const horribleCount = 1 + Math.floor(rng() * maxExtreme);

    const brokenChamps = roleChamps.slice(0, brokenCount);
    const horribleChamps = roleChamps.slice(brokenCount, brokenCount + horribleCount);
    const remaining = roleChamps.slice(brokenCount + horribleCount);

    const remLen = remaining.length;
    const countTresBon = Math.max(1, Math.round(remLen * 0.16));
    const countBon = Math.max(1, Math.round(remLen * 0.24));
    const countEquilibre = Math.max(1, Math.round(remLen * 0.30));
    const countMauvais = Math.max(1, Math.round(remLen * 0.18));

    const roleTiers = {};

    brokenChamps.forEach(c => {
      roleTiers[c.id] = { tier: 'BROKEN', role, ...CHAMPION_META_TIERS.BROKEN };
    });

    let cursor = 0;
    remaining.slice(cursor, cursor + countTresBon).forEach(c => {
      roleTiers[c.id] = { tier: 'TRES_BON', role, ...CHAMPION_META_TIERS.TRES_BON };
    });
    cursor += countTresBon;

    remaining.slice(cursor, cursor + countBon).forEach(c => {
      roleTiers[c.id] = { tier: 'BON', role, ...CHAMPION_META_TIERS.BON };
    });
    cursor += countBon;

    remaining.slice(cursor, cursor + countEquilibre).forEach(c => {
      roleTiers[c.id] = { tier: 'EQUILIBRE', role, ...CHAMPION_META_TIERS.EQUILIBRE };
    });
    cursor += countEquilibre;

    remaining.slice(cursor, cursor + countMauvais).forEach(c => {
      roleTiers[c.id] = { tier: 'MAUVAIS', role, ...CHAMPION_META_TIERS.MAUVAIS };
    });
    cursor += countMauvais;

    remaining.slice(cursor).forEach(c => {
      roleTiers[c.id] = { tier: 'TRES_MAUVAIS', role, ...CHAMPION_META_TIERS.TRES_MAUVAIS };
    });

    horribleChamps.forEach(c => {
      roleTiers[c.id] = { tier: 'HORRIBLE', role, ...CHAMPION_META_TIERS.HORRIBLE };
    });

    tiersByRole[role] = roleTiers;
  });

  return tiersByRole;
}

/**
 * Calcule la note moyenne d'une équipe à partir de son effectif.
 */
export function calculateTeamRating(team) {
  if (!team) return 80;
  const roster = team.roster && team.roster.length > 0 ? team.roster : [];
  if (roster.length === 0) return 80;
  const sum = roster.reduce((acc, c) => acc + (c?.rating || c?.overall || 80), 0);
  return Math.round(sum / roster.length);
}

/**
 * Classe les équipes selon 4 tiers (TOP teams, solides, moyennes, mauvaises)
 * en divisant l'intervalle [pire note, meilleure note] en 4 parts égales.
 */
export function classifyTeamTiers(participants = []) {
  if (!participants || participants.length === 0) return {};

  const teamRatings = {};
  participants.forEach(p => {
    teamRatings[p.id] = calculateTeamRating(p);
  });

  const values = Object.values(teamRatings);
  const minRating = Math.min(...values);
  const maxRating = Math.max(...values);
  const range = maxRating - minRating;

  const tiers = {};

  if (range <= 0) {
    participants.forEach(p => {
      tiers[p.id] = { tier: 'moyenne', label: 'Moyenne', rating: teamRatings[p.id] };
    });
    return tiers;
  }

  const step = range / 4;
  const t1 = minRating + step;
  const t2 = minRating + 2 * step;
  const t3 = minRating + 3 * step;

  participants.forEach(p => {
    const r = teamRatings[p.id];
    let tier = 'mauvaise';
    let label = 'Mauvaise';

    if (r >= t3) {
      tier = 'top';
      label = 'TOP teams';
    } else if (r >= t2) {
      tier = 'solide';
      label = 'Solide';
    } else if (r >= t1) {
      tier = 'moyenne';
      label = 'Moyenne';
    }

    tiers[p.id] = { tier, label, rating: r };
  });

  return tiers;
}

/**
 * Génère les champions méta pour chaque rôle pour l'année en cours.
 * 3 champions dominants par rôle (Top, Jungle, Mid, ADC, Support).
 */
export function generateMetaChampions(year = 1) {
  const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  const metaChamps = {};

  roles.forEach((role, rIdx) => {
    const list = getChampionsByRole(role);
    if (!list || list.length === 0) {
      metaChamps[role] = [];
      return;
    }
    const picks = [];
    const count = Math.min(3, list.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.abs((year * 17 + rIdx * 11 + i * 7) % list.length);
      const champ = list[idx];
      if (!picks.includes(champ.id)) {
        picks.push(champ.id);
      }
    }
    let nextIdx = 0;
    while (picks.length < count && nextIdx < list.length) {
      const c = list[nextIdx];
      if (!picks.includes(c.id)) picks.push(c.id);
      nextIdx++;
    }
    metaChamps[role] = picks;
  });

  return metaChamps;
}

/**
 * Génère la méta secrète (ligue et champions dominants) pour l'année.
 */
export function generateYearlyMeta(year = 1) {
  const index = Math.abs((year * 7 + 1) % AVAILABLE_LEAGUES.length);
  const metaLeague = AVAILABLE_LEAGUES[index];
  const excludedLeagues = AVAILABLE_LEAGUES.filter(l => l !== metaLeague);
  const championMetaTiers = generateChampionMetaTiers(year);
  const metaChampions = generateMetaChampions(year);

  return {
    year,
    metaLeague,
    excludedLeagues,
    championMetaTiers,
    metaChampions,
    totalPointsTarget: META_TARGET_POINTS,
  };
}

/**
 * Récupère le tier méta complet d'un champion pour un rôle spécifique.
 * Signature flexible : (champId, role, yearlyMeta) ou (champId, yearlyMeta).
 */
export function getChampionMetaTier(champId, roleOrYearlyMeta, maybeYearlyMeta) {
  if (!champId) return CHAMPION_META_TIERS.EQUILIBRE;

  let role = roleOrYearlyMeta;
  let yearlyMeta = maybeYearlyMeta;

  if (maybeYearlyMeta === undefined && typeof roleOrYearlyMeta === 'object' && roleOrYearlyMeta !== null) {
    yearlyMeta = roleOrYearlyMeta;
    role = null;
  }

  if (!yearlyMeta?.championMetaTiers) return CHAMPION_META_TIERS.EQUILIBRE;

  // 1. Si un rôle est fourni et présent dans les tiers par rôle
  if (role && yearlyMeta.championMetaTiers[role]?.[champId]) {
    return yearlyMeta.championMetaTiers[role][champId];
  }

  // 2. Si un format plat (non compartimenté par rôle) est utilisé
  if (yearlyMeta.championMetaTiers[champId]?.bonus !== undefined) {
    return yearlyMeta.championMetaTiers[champId];
  }

  // 3. Chercher dans le rôle principal du champion
  const champData = getChampionById(champId);
  const primaryRole = champData?.primaryRole;
  if (primaryRole && yearlyMeta.championMetaTiers[primaryRole]?.[champId]) {
    return yearlyMeta.championMetaTiers[primaryRole][champId];
  }

  // 4. Chercher dans n'importe lequel des rôles du champion
  if (champData?.roles) {
    for (const r of champData.roles) {
      if (yearlyMeta.championMetaTiers[r]?.[champId]) {
        return yearlyMeta.championMetaTiers[r][champId];
      }
    }
  }

  // 5. Parcourir tous les 5 rôles
  const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  for (const r of roles) {
    if (yearlyMeta.championMetaTiers[r]?.[champId]) {
      return yearlyMeta.championMetaTiers[r][champId];
    }
  }

  return CHAMPION_META_TIERS.EQUILIBRE;
}

/**
 * Vérifie si le tier méta d'un champion a été formellement décrypté (10 points).
 */
export function isChampionDecrypted(champId, knowledge) {
  if (!champId || !knowledge?.championKnowledge) return false;
  return (knowledge.championKnowledge[champId] || 0) >= CHAMPION_META_TARGET_POINTS;
}

/**
 * Récupère les points actuels de décryptage d'un champion (0 à 10).
 */
export function getChampionDecryptionPoints(champId, knowledge) {
  if (!champId || !knowledge?.championKnowledge) return 0;
  return Math.min(CHAMPION_META_TARGET_POINTS, knowledge.championKnowledge[champId] || 0);
}

/**
 * Ajoute des points de décryptage à un champion.
 */
export function addChampionDecryptionPoints(knowledge, champId, points) {
  if (!knowledge) return 0;
  if (!knowledge.championKnowledge) knowledge.championKnowledge = {};
  const current = knowledge.championKnowledge[champId] || 0;
  const next = Math.min(CHAMPION_META_TARGET_POINTS, current + points);
  knowledge.championKnowledge[champId] = next;
  return next;
}

/**
 * Calcule le bonus de méta actuellement CONNU par l'utilisateur pour une équipe.
 * N'inclut que les ligues et les champions dont le décryptage est terminé.
 */
export function calculateKnownMetaBonus(roster = [], picks = {}, yearlyMeta, userKnowledge = {}) {
  let knownBonus = 0;
  let unknownCount = 0;

  const isLeagueDiscovered = (userKnowledge?.points >= META_TARGET_POINTS) ||
    userKnowledge?.discoveredClues?.some(c => c.threshold === 100);

  if (isLeagueDiscovered && yearlyMeta?.metaLeague) {
    const leagueCount = countMetaLeaguePlayers(roster, yearlyMeta.metaLeague);
    knownBonus += Math.round(leagueCount * 0.3 * 10) / 10;
  } else {
    unknownCount += 1;
  }

  for (const card of roster) {
    if (!card) continue;
    const role = card.role || 'Mid';
    const champId = picks[role];
    if (!champId) continue;

    const champPoints = userKnowledge?.championKnowledge?.[champId] || 0;
    const isChampDecrypted = champPoints >= CHAMPION_META_TARGET_POINTS;

    if (isChampDecrypted) {
      const metaTier = getChampionMetaTier(champId, role, yearlyMeta);
      if (metaTier) {
        knownBonus += metaTier.bonus;
      }
    } else {
      unknownCount += 1;
    }
  }

  knownBonus = Math.round(knownBonus * 10) / 10;

  return {
    knownBonus,
    hasUnknown: unknownCount > 0,
    unknownCount,
  };
}

/**
 * Vérifie si un champion fait partie des tiers méta favorables pour un rôle.
 */
export function isMetaChampion(champId, role, yearlyMeta) {
  if (!champId) return false;
  const tier = getChampionMetaTier(champId, role, yearlyMeta);
  return tier.bonus > 0;
}

/**
 * Calcule le bonus individuel de maîtrise (carte) et le bonus méta du champion au rôle joué.
 */
export function evaluateChampionSynergy(card, champId, yearlyMeta, championMasteryState = {}) {
  if (!card || !champId) {
    return {
      bonus: 0,
      masteryBonus: 0,
      metaBonus: 0,
      isMeta: false,
      mastery: null,
      metaTier: CHAMPION_META_TIERS.EQUILIBRE,
    };
  }

  const role = card?.role || 'Mid';
  const pool = getPlayerChampionPool(card, championMasteryState);
  const poolEntry = pool.find(p => p.champId === champId);
  const masteryBonus = poolEntry?.mastery?.bonus || 0;

  const metaTier = getChampionMetaTier(champId, role, yearlyMeta);
  const metaBonus = metaTier?.bonus ?? 0;
  const isMeta = metaBonus > 0;

  return {
    bonus: Math.round((masteryBonus + metaBonus) * 10) / 10,
    masteryBonus,
    metaBonus,
    isMeta,
    metaTier,
    mastery: poolEntry?.mastery || null,
  };
}

/**
 * Évalue l'ensemble des picks de champions pour une équipe :
 * Séparé en maîtrise individuelle (pour note des joueurs) et méta globale (bonus équipe).
 */
export function evaluateTeamChampionPicks(roster = [], picks = {}, yearlyMeta, championMasteryState = {}) {
  let totalBonus = 0;
  let totalMasteryBonus = 0;
  let totalChampionMetaBonus = 0;
  const details = {};

  for (const card of roster) {
    if (!card) continue;
    const role = card.role || 'Mid';
    const champId = picks[role];
    const evalResult = evaluateChampionSynergy(card, champId, yearlyMeta, championMasteryState);
    details[role] = evalResult;
    totalMasteryBonus += evalResult.masteryBonus;
    totalChampionMetaBonus += evalResult.metaBonus;
    totalBonus += evalResult.bonus;
  }

  return {
    totalBonus: Math.round(totalBonus * 10) / 10,
    totalMasteryBonus: Math.round(totalMasteryBonus * 10) / 10,
    totalChampionMetaBonus: Math.round(totalChampionMetaBonus * 10) / 10,
    details,
  };
}

/**
 * Sélectionne intelligemment les champions d'une équipe de Bot :
 * privilégie les champions à haute maîtrise et ceux qui sont dans la méta pour le rôle donné.
 */
export function selectBotTeamChampions(roster = [], yearlyMeta, championMasteryState = {}) {
  const chosenPicks = {};
  const usedChamps = new Set();

  for (const card of roster) {
    if (!card) continue;
    const role = card.role || 'Mid';
    const pool = getPlayerChampionPool(card, championMasteryState);

    const scored = pool.map(item => {
      const metaTier = getChampionMetaTier(item.champId, role, yearlyMeta);
      const metaBonus = metaTier?.bonus ?? 0;
      const isMeta = metaBonus > 0;
      const score = (item.mastery?.bonus || 0) * 2 + (metaBonus * 1.5) + Math.random() * 0.1;
      return { ...item, score, isMeta, metaTier };
    });

    scored.sort((a, b) => b.score - a.score);

    let picked = scored.find(s => !usedChamps.has(s.champId));
    if (!picked && scored.length > 0) picked = scored[0];

    if (picked) {
      chosenPicks[role] = picked.champId;
      usedChamps.add(picked.champId);
    }
  }

  return chosenPicks;
}

/**
 * Compte le nombre de joueurs d'une composition appartenant à la ligue méta.
 */
export function countMetaLeaguePlayers(roster = [], metaLeague) {
  if (!roster || !metaLeague) return 0;
  return roster.filter(c => {
    if (!c) return false;
    const league = c.league || CARD_POOL.find(p => p.id === c.id)?.league;
    return league === metaLeague;
  }).length;
}

/**
 * Calcule le gain de points de décryptage :
 * Match tournoi : 2 * nb joueurs de la ligue méta
 * Scrim : x2 (donc 4 * nb joueurs de la ligue méta)
 */
export function calculatePointsGain(roster = [], metaLeague, isScrim = false) {
  const metaCount = countMetaLeaguePlayers(roster, metaLeague);
  const base = 2 * metaCount;
  return isScrim ? base * 2 : base;
}

/**
 * Évalue le bonus de synergie en match si des joueurs de la ligue méta sont alignés.
 */
export function evaluateTeamMetaSynergy(roster = [], yearlyMeta) {
  if (!roster || !yearlyMeta) return { count: 0, bonus: 0 };
  const count = countMetaLeaguePlayers(roster, yearlyMeta.metaLeague);
  return {
    count,
    bonus: Math.round(count * 0.3 * 10) / 10,
  };
}

/**
 * Génère un retour descriptif et vague sur l'efficacité de la composition testée.
 * Les notes chiffrées sont strictement cachées pour préserver la déduction du joueur.
 */
function getObservationMessage(sourceLabel, metaCount, options = {}) {
  const isScrim = sourceLabel === 'Scrim';

  if (isScrim) {
    const { opponentName = 'Adversaire', tier = 'moyenne', won = false, seriesScore = null } = options;
    const resultLabel = seriesScore ? `Série ${seriesScore}` : (won ? 'Victoire' : 'Défaite');

    if (metaCount === 0) {
      if (won) {
        return `Scrim contre ${opponentName} (${resultLabel}) : Succès dans le jeu, mais vos analystes sont formels : la composition alignée passe totalement à côté des dynamiques maîtresses de la saison.`;
      }
      return `Scrim contre ${opponentName} (${resultLabel}) : Séance infructueuse. Vos choix de joueurs ne répondent à aucune priorité du patch actuel.`;
    }

    if (metaCount <= 2) {
      if (tier === 'top') {
        if (won) {
          return `Scrim contre ${opponentName} (${resultLabel}) : Très belle prestation face à un cador du circuit ! Plusieurs dynamiques encourageantes ont été identifiées.`;
        }
        return `Scrim contre ${opponentName} (${resultLabel}) : Face à une équipe du sommet, votre effectif a été bousculé. Les enseignements sur la méta restent encore imprécis.`;
      }
      if (tier === 'solide') {
        if (won) {
          return `Scrim contre ${opponentName} (${resultLabel}) : Victoire face à une équipe solide. Quelques pistes se dessinent dans le jeu sans certitude absolue.`;
        }
        return `Scrim contre ${opponentName} (${resultLabel}) : Défaite serrée contre une formation solide. Vos choix méritent d'être approfondis.`;
      }
      if (tier === 'mauvaise') {
        if (won) {
          return `Scrim contre ${opponentName} (${resultLabel}) : Victoire facile, mais la modeste adversité limite la portée des enseignements sur la méta.`;
        }
        return `Scrim contre ${opponentName} (${resultLabel}) : Défaite inattendue contre une formation en difficulté. Des doutes persistent sur cette configuration.`;
      }
      // tier moyenne
      if (won) {
        return `Scrim contre ${opponentName} (${resultLabel}) : Succès appliqué face à une équipe de milieu de tableau. De timides signaux méta sont relevés.`;
      }
      return `Scrim contre ${opponentName} (${resultLabel}) : Défaite décevante contre une équipe de milieu de tableau. L'alchimie générale manque de clarté.`;
    }

    // metaCount >= 3 (Efficace)
    if (tier === 'top') {
      if (won) {
        return `Scrim contre ${opponentName} (${resultLabel}) : Victoire magistrale ! S'imposer face à un cador du circuit valide avec un éclat maximal la puissance de votre lecture de la méta.`;
      }
      return `Scrim contre ${opponentName} (${resultLabel}) : Malgré la défaite contre une équipe d'élite, votre effectif a révélé des phases exceptionnelles en phase avec la méta.`;
    }
    if (tier === 'solide') {
      if (won) {
        return `Scrim contre ${opponentName} (${resultLabel}) : Victoire éclatante contre une équipe solide ! Votre composition exploite à merveille les dynamiques fortes.`;
      }
      return `Scrim contre ${opponentName} (${resultLabel}) : Même sans la victoire, le plan de jeu a montré une fluidité manifeste au diapason du patch.`;
    }
    if (won) {
      return `Scrim contre ${opponentName} (${resultLabel}) : Victoire écrasante ! L'équipe a totalement dominé son sujet et confirme une forte résonance avec la saison.`;
    }
    return `Scrim contre ${opponentName} (${resultLabel}) : De superbes séquences en phase avec la méta, bien que le résultat final n'ait pas récompensé les efforts.`;
  }

  // Tournoi officiel : Bilan portant EXCLUSIVEMENT sur l'apprentissage de la méta
  const { matchesPlayed = 1, wins = 0, losses = 0 } = options;

  if (metaCount === 0) {
    return `Analyse Méta — Tournoi (${matchesPlayed} matchs) : Concernant le décryptage de la méta (indépendamment de vos résultats sportifs de ${wins}V-${losses}D), l'expérimentation est infructueuse. Vos choix de joueurs n'ont apporté aucune donnée concluante sur les tendances fortes du patch.`;
  }
  if (metaCount <= 2) {
    return `Analyse Méta — Tournoi (${matchesPlayed} matchs) : Concernant le décryptage de la méta (au-delà du bilan sportif de ${wins}V-${losses}D), les enseignements restent partagés. Quelques bribes de synergies régionales ont été décelées sans débloquer une lecture limpide.`;
  }
  return `Analyse Méta — Tournoi (${matchesPlayed} matchs) : Percée analytique majeure sur la méta ! Indépendamment de vos résultats sportifs (${wins}V-${losses}D), votre effectif a parfaitement résonné avec les dynamiques dominantes, faisant bondir la compréhension de la saison.`;
}

/**
 * Applique les points de décryptage et débloque les indices aux paliers (50, 75, 100).
 * Chaque palier ajoute un message d'indice mis en valeur dans l'historique d'analyse.
 */
export function addMetaProgress(knowledge, pointsGained, yearlyMeta, sourceLabel = 'Match', options = {}) {
  if (!knowledge || !yearlyMeta) return { pointsGained: 0, newClue: null };

  if (!knowledge.discoveredClues) knowledge.discoveredClues = [];
  if (!knowledge.observations) knowledge.observations = [];

  const metaCount = options.metaCount || 0;
  const oldPoints = knowledge.points || 0;
  const newPoints = Math.min(META_TARGET_POINTS, oldPoints + pointsGained);
  knowledge.points = newPoints;

  let newClue = null;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Observation standard du tournoi entier ou du scrim (descriptive/vague)
  const desc = getObservationMessage(sourceLabel, metaCount, options);
  knowledge.observations.unshift({
    id: `obs-${Date.now()}-${Math.random()}`,
    isClue: false,
    source: sourceLabel,
    text: desc,
    timestamp: now,
  });

  // 2. Palier 50 pts : révélation d'une ligue exclue
  if (oldPoints < 50 && newPoints >= 50 && !knowledge.discoveredClues.some(c => c.threshold === 50)) {
    newClue = {
      threshold: 50,
      type: 'excluded',
      league: yearlyMeta.excludedLeagues[0],
      text: `Indice 50% : La ligue ${yearlyMeta.excludedLeagues[0]} n'est pas la ligue méta.`,
    };
    knowledge.discoveredClues.push(newClue);

    knowledge.observations.unshift({
      id: `clue-${Date.now()}-50`,
      isClue: true,
      clueLevel: 50,
      source: 'Indice',
      text: `🔎 Indice (50%) : Après analyse croisée, nos observateurs confirment que la ligue ${yearlyMeta.excludedLeagues[0]} n'est PAS la ligue méta.`,
      timestamp: now,
    });
  }

  // 3. Palier 75 pts : révélation d'une seconde ligue exclue
  if (oldPoints < 75 && newPoints >= 75 && !knowledge.discoveredClues.some(c => c.threshold === 75)) {
    newClue = {
      threshold: 75,
      type: 'excluded',
      league: yearlyMeta.excludedLeagues[1],
      text: `Indice 75% : La ligue ${yearlyMeta.excludedLeagues[1]} n'est pas la ligue méta.`,
    };
    knowledge.discoveredClues.push(newClue);

    knowledge.observations.unshift({
      id: `clue-${Date.now()}-75`,
      isClue: true,
      clueLevel: 75,
      source: 'Indice',
      text: `🔎 Indice (75%) : Seconde certitude établie : la ligue ${yearlyMeta.excludedLeagues[1]} est également exclue des tendances dominantes.`,
      timestamp: now,
    });
  }

  // 4. Palier 100 pts : révélation finale de la ligue méta
  if (oldPoints < 100 && newPoints >= 100 && !knowledge.discoveredClues.some(c => c.threshold === 100)) {
    newClue = {
      threshold: 100,
      type: 'meta',
      league: yearlyMeta.metaLeague,
      text: `MÉTA DÉCRYPTÉE (100%) : La ${yearlyMeta.metaLeague} est la ligue dominante !`,
    };
    knowledge.discoveredClues.push(newClue);

    knowledge.observations.unshift({
      id: `clue-${Date.now()}-100`,
      isClue: true,
      isMetaDiscovery: true,
      clueLevel: 100,
      source: 'Méta Résolue',
      text: `🏆 DÉCRYPTAGE TOTAL ACCOMPLI (100%) : La ligue ${yearlyMeta.metaLeague} est formellement identifiée comme la reine incontestée de la saison !`,
      timestamp: now,
    });
  }

  // Limite du journal d'observations à 15 entrées
  if (knowledge.observations.length > 15) {
    knowledge.observations.length = 15;
  }

  return { pointsGained, newClue };
}
