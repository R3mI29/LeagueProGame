// server/handlers/metaHandlers.js
// Handlers Socket pour le système de méta régionale et scrims.

import { state as defaultState } from '../state/gameState.js';
import {
  calculatePointsGain,
  countMetaLeaguePlayers,
  evaluateTeamMetaSynergy,
  addMetaProgress,
  generateYearlyMeta,
  classifyTeamTiers,
  addChampionDecryptionPoints,
  getChampionMetaTier,
  evaluateTeamChampionPicks,
  selectBotTeamChampions,
} from '../../src/constants/metaConfig.js';
import { getCardById, generateBotRosterFromCards } from '../services/cardService.js';
import { ORDERED_ROLES } from '../../src/constants/roles.js';
import { getPlayerChampionPool, getMasteryInfoByXp } from '../../src/constants/playerChampionPools.js';
import { getChampionById } from '../../src/constants/championsData.js';

/**
 * Simule une manche individuelle avec durée, dominance et événement narratif axé sur le focus.
 */
export function simulateGame(userPower, oppPower, focus = 'laning') {
  const noiseUser = (Math.random() * 4) - 2;
  const noiseOpp = (Math.random() * 4) - 2;
  const diff = (oppPower + noiseOpp) - (userPower + noiseUser);
  const prob = 1 / (1 + Math.pow(10, diff / 12));
  const isUserWin = Math.random() < prob;
  const winner = isUserWin ? 'user' : 'opp';

  const powerGap = Math.abs(userPower - oppPower);
  const dominant = Math.random() < Math.min(0.65, 0.2 + (powerGap * 0.04));

  // Durée en minutes (20-45)
  let duration;
  if (dominant) {
    duration = Math.floor(20 + Math.random() * 9); // 20 à 28 min
  } else {
    duration = Math.floor(28 + Math.random() * 18); // 28 à 45 min
  }
  duration = Math.max(20, Math.min(45, duration));

  const events = {
    laning: {
      user: {
        dominant: 'Écrasement total sur les sololanes dès les premières minutes, avance de 5k golds à 14 min.',
        normal: 'Prise de priorité en laning phase et dive coordonné réussi sur la botlane.',
      },
      opp: {
        dominant: 'Sololanes submergées par l’agression adverse, déficit critique de CS.',
        normal: 'Avantage concédé aux escarmouches de début de partie sur les voies extérieures.',
      },
    },
    teamfight: {
      user: {
        dominant: 'Teamfight parfait au Dragon Ancestral avec un combo d’ultimes dévastateur !',
        normal: 'Excellente engage au Baron Nashor permettant un ace décisif.',
      },
      opp: {
        dominant: 'L’équipe adverse a totalement disloqué vos rangs sur le premier regroupement 5v5.',
        normal: 'Mauvais ciblage en combat de fin de partie entraînant la perte du Nashor.',
      },
    },
    vision: {
      user: {
        dominant: 'Contrôle absolu de la rivière adverse, 4 catchs successifs dans le brouillard.',
        normal: 'Balises profondes posées à temps pour intercepter la rotation adverse.',
      },
      opp: {
        dominant: 'Blackout total : l’adversaire a nettoyé toutes les balises sans contestation possible.',
        normal: 'Manque de vision autour des objectifs majeurs concédant le contrôle du terrain.',
      },
    },
    drafting: {
      user: {
        dominant: 'Draft magistrale neutralisant complètement la composition adverse dès le niveau 1.',
        normal: 'Synergie de champions idéale exploitant les faiblesses adverses en milieu de partie.',
      },
      opp: {
        dominant: 'Composition ennemie trop punitive avec des compteurs directs sur vos choix clés.',
        normal: 'Conditions de victoire difficiles à exécuter face à la flexibilité adverse.',
      },
    },
    meta_study: {
      user: {
        dominant: 'Lecture limpide du tempo adverse : confirmation éclatante des priorités du patch.',
        normal: 'Phase de test réussie : plusieurs interactions clés du patch ont été cartographiées.',
      },
      opp: {
        dominant: 'Démonstration de force adverse qui révèle les forces cachées du patch actuel.',
        normal: 'Échec dans le jeu mais collecte de données analytiques précieuses sur les tendances.',
      },
    },
  };

  const focusCategory = events[focus] || events.laning;
  const winnerSide = winner === 'user' ? focusCategory.user : focusCategory.opp;
  const focusEvent = dominant ? winnerSide.dominant : winnerSide.normal;

  return {
    winner,
    duration,
    gameDuration: duration,
    dominant,
    focusEvent,
  };
}

export function registerMetaHandlers(io, socket, {
  state = defaultState,
} = {}) {
  // Scrim d'Entraînement Inter-Tournoi (Choix de l'adversaire, focus d'entraînement, durée, simulation détaillée)
  socket.on('run-scrim', (payload = {}) => {
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    // Autorisé uniquement pendant la phase inter-tournoi
    if (state.phase !== 'cards' && state.phase !== 'season_hub') return;

    if (!state.yearlyMeta) {
      state.yearlyMeta = generateYearlyMeta(state.year || 1);
    }

    if (!state.metaKnowledge) state.metaKnowledge = {};
    if (!state.metaKnowledge[id]) {
      state.metaKnowledge[id] = {
        points: 0,
        scrimsAvailable: 3,
        scrimsUsed: 0,
        discoveredClues: [],
        observations: [],
        championKnowledge: {},
        lastScrimResult: null,
      };
    }

    const knowledge = state.metaKnowledge[id];

    // Nouveaux paramètres de scrim
    const rawFocus = payload?.focus;
    const validFocuses = ['laning', 'teamfight', 'vision', 'drafting', 'meta_study'];
    const focus = validFocuses.includes(rawFocus) ? rawFocus : 'laning';

    const rawDuration = payload?.duration;
    const duration = rawDuration === 'quick' ? 'quick' : 'full';
    const scrimCost = duration === 'quick' ? 0.5 : 1;

    if ((knowledge.scrimsAvailable ?? 3) < scrimCost) return;

    // Vérification du roster complet du joueur
    const lineup = state.activeLineups?.[id] || {};
    const complete = ORDERED_ROLES.every(role => lineup[role]);
    if (!complete) return;

    const playerRoster = ORDERED_ROLES.map(role => getCardById(lineup[role])).filter(Boolean);

    // Sélection de l'adversaire choisi
    const opponentId = payload?.opponentId;
    let opponent = state.participants.find(p => p.id === opponentId && p.id !== id);
    if (!opponent) {
      opponent = state.participants.find(p => p.id !== id);
    }
    if (!opponent) return;

    // Roster et note globale de l'adversaire
    let opponentRoster = opponent.roster || [];
    if (!opponentRoster || opponentRoster.length === 0) {
      const oppLineup = state.activeLineups?.[opponent.id];
      if (oppLineup) {
        opponentRoster = ORDERED_ROLES.map(role => getCardById(oppLineup[role])).filter(Boolean);
      }
    }
    if (!opponentRoster || opponentRoster.length === 0) {
      opponentRoster = generateBotRosterFromCards();
    }

    const userRating = Math.round(playerRoster.reduce((sum, c) => sum + (c.rating || c.overall || 80), 0) / 5);
    const opponentRating = Math.round(opponentRoster.reduce((sum, c) => sum + (c.rating || c.overall || 80), 0) / 5);

    // Classification en 4 tiers dynamiques (TOP, solide, moyenne, mauvaise)
    const allTiers = classifyTeamTiers(state.participants);
    const oppTierInfo = allTiers[opponent.id] || { tier: 'moyenne' };
    const tier = oppTierInfo.tier;

    // Puissance globale des équipes (incluant la synergie régionale ET l'impact des champions choisis)
    const userSynergy = evaluateTeamMetaSynergy(playerRoster, state.yearlyMeta);
    const oppSynergy = evaluateTeamMetaSynergy(opponentRoster, state.yearlyMeta);

    const userTrainingPicks = payload?.trainingPicks || {};
    const userChampSynergy = evaluateTeamChampionPicks(playerRoster, userTrainingPicks, state.yearlyMeta, state.championMastery);

    const oppPrelocked = state.prelockedChampions?.[opponent.id] || {};
    const oppPicks = Object.keys(oppPrelocked).length > 0
      ? oppPrelocked
      : selectBotTeamChampions(opponentRoster, state.yearlyMeta, state.championMastery);
    const oppChampSynergy = evaluateTeamChampionPicks(opponentRoster, oppPicks, state.yearlyMeta, state.championMastery);

    const userPower = userRating + (userSynergy.bonus * 2) + userChampSynergy.totalChampionMetaBonus + (userChampSynergy.totalMasteryBonus / 5);
    const oppPower = opponentRating + (oppSynergy.bonus * 2) + oppChampSynergy.totalChampionMetaBonus + (oppChampSynergy.totalMasteryBonus / 5);

    // Simulation de la série (1 partie pour 'quick', 5 parties pour 'full')
    const numGames = duration === 'quick' ? 1 : 5;
    const games = [];
    let userWins = 0;
    let oppWins = 0;

    for (let g = 0; g < numGames; g++) {
      const game = simulateGame(userPower, oppPower, focus);
      games.push({
        winner: game.winner,
        duration: game.duration,
        gameDuration: game.duration,
        dominant: game.dominant,
        focusEvent: game.focusEvent,
      });
      if (game.winner === 'user') {
        userWins++;
      } else {
        oppWins++;
      }
    }

    const won = userWins > oppWins;
    const seriesScore = `${userWins} - ${oppWins}`;

    // Multiplicateur de durée : full (5) = 1.0, quick (1) = 0.5
    const durationMult = duration === 'quick' ? 0.5 : 1.0;

    // Efficacité axée sur le ratio ou nombre de victoires
    let winMult = 1.0;
    if (duration === 'quick') {
      winMult = userWins === 1 ? 1.3 : 0.5;
    } else {
      const winMultipliers = {
        5: 1.6,
        4: 1.3,
        3: 1.0,
        2: 0.7,
        1: 0.5,
        0: 0.35,
      };
      winMult = winMultipliers[userWins] ?? 1.0;
    }

    const tierMultipliers = {
      top: 1.3,
      solide: 1.15,
      moyenne: 1.0,
      mauvaise: 0.85,
    };
    const tierMult = tierMultipliers[tier] ?? 1.0;

    // Bonus selon le focus pour la Ligue Méta :
    // - vision : +20% points méta ligue + +40% décryptage méta
    // - meta_study : +150% points méta ligue (observation passive)
    let leagueMetaMult = 1.0;
    if (focus === 'vision') leagueMetaMult = 1.2;
    if (focus === 'meta_study') leagueMetaMult = 2.5;

    // Calcul des points méta régionaux avec efficacité indexée
    const metaCount = countMetaLeaguePlayers(playerRoster, state.yearlyMeta.metaLeague);
    const basePoints = calculatePointsGain(playerRoster, state.yearlyMeta.metaLeague, true);
    const finalPoints = Math.max(0, Math.round(basePoints * winMult * tierMult * durationMult * leagueMetaMult));

    // Décrémentation des scrims disponibles (3 disponibles par inter-tournoi)
    knowledge.scrimsAvailable = Math.max(0, (knowledge.scrimsAvailable ?? 3) - scrimCost);
    knowledge.scrimsUsed = (knowledge.scrimsUsed || 0) + (duration === 'quick' ? 0.5 : 1);

    const { newClue } = addMetaProgress(knowledge, finalPoints, state.yearlyMeta, 'Scrim', {
      metaCount,
      opponentName: opponent.name,
      opponentTag: opponent.tag,
      tier,
      won,
      seriesScore,
    });

    // Progression de décryptage des champions entraînés
    // Bonus selon focus :
    // - teamfight : +20% décryptage méta
    // - vision : +40% décryptage méta
    // - drafting : +80% décryptage méta champions
    let champDecryptionMult = 1.0;
    if (focus === 'teamfight') champDecryptionMult = 1.2;
    if (focus === 'vision') champDecryptionMult = 1.4;
    if (focus === 'drafting') champDecryptionMult = 1.8;

    let baseChampPoints = 4;
    if (duration === 'quick') {
      baseChampPoints = userWins === 1 ? 8 : 4;
    } else {
      const champDecryptionMap = { 5: 10, 4: 8, 3: 6, 2: 4, 1: 3, 0: 2 };
      baseChampPoints = champDecryptionMap[userWins] ?? 4;
    }
    const gainedChampPoints = Math.max(1, Math.round(baseChampPoints * durationMult * champDecryptionMult));

    // Entraînement et progression de maîtrise des champions en scrim
    if (!state.championMastery) state.championMastery = {};
    const trainedChampions = [];
    const tierXpMult = tier === 'top' ? 1.4 : tier === 'solide' ? 1.2 : tier === 'moyenne' ? 1.0 : 0.8;

    let baseGainedXp;
    if (duration === 'quick') {
      baseGainedXp = userWins === 1 ? 160 : 90;
    } else {
      baseGainedXp = 80 + (userWins * 25); // De 80 XP (0 win) à 205 XP (5 wins)
    }

    ORDERED_ROLES.forEach(role => {
      const card = getCardById(lineup[role]);
      if (!card) return;

      const cardId = card.id;
      // Clé primaire basée sur baseName pour la persistance entre versions/cartes du joueur
      const masteryKey = card.baseName || card.id;
      if (!state.championMastery[masteryKey]) state.championMastery[masteryKey] = {};

      let trainedChampId = payload?.trainingPicks?.[role] || state.prelockedChampions?.[id]?.[role];
      const pool = getPlayerChampionPool(card, state.championMastery);

      if (!trainedChampId && pool.length > 0) {
        trainedChampId = pool[0].champId;
      }
      if (!trainedChampId) return;

      // Bonus XP selon focus :
      // - laning : +50% XP champion pour les roles individuels (Top, Mid, ADC)
      // - teamfight : +30% XP pour tous
      let roleFocusXpMult = 1.0;
      if (focus === 'teamfight') {
        roleFocusXpMult = 1.3;
      } else if (focus === 'laning' && (role === 'Top' || role === 'Mid' || role === 'ADC')) {
        roleFocusXpMult = 1.5;
      }

      const gainedXp = Math.round(baseGainedXp * tierXpMult * durationMult * roleFocusXpMult);

      const existingEntry = pool.find(p => p.champId === trainedChampId);
      const isNewlyLearned = !existingEntry;
      const oldXp = state.championMastery[masteryKey][trainedChampId]?.xp ?? (existingEntry?.xp || 0);
      const oldMastery = getMasteryInfoByXp(oldXp);

      const newXp = oldXp + gainedXp;
      const newMastery = getMasteryInfoByXp(newXp);

      state.championMastery[masteryKey][trainedChampId] = { xp: newXp };

      // Décryptage du champion (jusqu'à 10 points)
      const totalDecryptionPoints = addChampionDecryptionPoints(knowledge, trainedChampId, gainedChampPoints);
      const isDecrypted = totalDecryptionPoints >= 10;
      const metaTier = getChampionMetaTier(trainedChampId, role, state.yearlyMeta);

      const champData = getChampionById(trainedChampId);
      trainedChampions.push({
        role,
        cardId,
        cardName: card.baseName || card.name,
        champId: trainedChampId,
        champName: champData?.name || trainedChampId,
        champIcon: champData?.icon || null,
        gainedXp,
        oldLevel: oldMastery.level,
        newLevel: newMastery.level,
        levelUp: newMastery.level > oldMastery.level,
        newLevelName: newMastery.name,
        isNewlyLearned,
        gainedChampPoints,
        totalDecryptionPoints,
        isDecrypted,
        metaTier: isDecrypted ? metaTier : null,
      });
    });

    knowledge.lastScrimResult = {
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentTag: opponent.tag,
      opponentLogo: opponent.logo,
      seriesScore,
      userWins,
      oppWins,
      won,
      newClue,
      trainedChampions,
      focus,
      duration: duration === 'quick' ? 1 : 5,
      games,
    };

    io.emit('draft-update', state);
  });
}
