/**
 * Contrats de sponsoring officiels (6 marques partenaires).
 * Équilibrage progressif : Facile (crédits modestes, sans risque lourd),
 * Moyen (bonnes récompenses & Booster de Skin),
 * Difficile (très gros gains, Booster de Skin, pénalité sévère).
 */

import { SKIN_BY_ID } from './teamSkins.js';

export const SKIN_COMPENSATION_BY_RARITY = {
  'Commune': 50,
  'Rare': 100,
  'Épique': 200,
  'Légendaire': 500,
};

export const NON_QUEST_SKIN_IDS = [
  'gold-circuit',
  'glacier',
  'neon-protocol',
  'silver-fluid',
];

export const SPONSOR_CONTRACTS = [
  // ==========================================
  // CONTRATS FACILES (Démarrage, faibles risques)
  // ==========================================
  {
    id: 'intel_test',
    difficulty: 'easy',
    brandName: 'Intel Core',
    logo: '/logo/marque/intel.svg',
    title: 'Benchmark Système',
    conditionText: 'Aligner au moins 1 joueur de rareté Épique ou plus titulaire.',
    type: 'has_epic_lineup',
    deadlineEvents: 1,
    reward: {
      credits: 350,
      description: '+350 💲',
    },
    malus: 150,
  },
  {
    id: 'secretlab_starter',
    difficulty: 'easy',
    brandName: 'Secretlab',
    logo: '/logo/marque/secretlab.png',
    title: 'Siège d\'Entraînement',
    conditionText: 'Aligner au moins 3 titulaires avec 6+ ans de contrat (ou À VIE).',
    type: 'has_contract_years',
    targetValue: 6,
    targetCount: 3,
    deadlineEvents: 1,
    reward: {
      credits: 350,
      description: '+350 💲',
    },
    malus: 180,
  },
  {
    id: 'mastercard_presence',
    difficulty: 'easy',
    brandName: 'Mastercard',
    logo: '/logo/marque/mastercard.svg',
    title: 'Entrée en Scène',
    conditionText: 'Participer et atteindre le Top 8 d\'un tournoi officiel.',
    type: 'tournament_top8',
    deadlineEvents: 1,
    reward: {
      credits: 300,
      description: '+300 💲',
    },
    malus: 150,
  },
  {
    id: 'razer_gear',
    difficulty: 'easy',
    brandName: 'Razer',
    logo: '/logo/marque/razer.svg',
    title: 'Setup Vérifié',
    conditionText: 'Aligner un cinq avec au moins 355 de note d\'équipe moyenne.',
    type: 'team_power_reach',
    targetValue: 355,
    deadlineEvents: 1,
    reward: {
      credits: 400,
      description: '+400 💲',
    },
    malus: 180,
  },

  // ==========================================
  // CONTRATS MOYENS (Objectifs équilibrés & Booster de Skin)
  // ==========================================
  {
    id: 'intel_overclock',
    difficulty: 'medium',
    brandName: 'Intel Core',
    logo: '/logo/marque/intel.svg',
    title: 'Surfréquençage',
    conditionText: 'Aligner un cinq titulaire avec plus de 395 de note moyenne.',
    type: 'team_power_reach',
    targetValue: 395,
    deadlineEvents: 2,
    reward: {
      credits: 650,
      bonusPack: 'skin_pack',
      description: '+650 💲 & 1 Booster de Skin',
    },
    malus: 350,
  },
  {
    id: 'secretlab_throne',
    difficulty: 'medium',
    brandName: 'Secretlab',
    logo: '/logo/marque/secretlab.png',
    title: 'Trône Impérial',
    conditionText: 'Insérer 2 cartes de rareté Légendaire ou plus dans la Collection.',
    type: 'album_insert_legendary',
    targetCount: 2,
    deadlineEvents: 2,
    reward: {
      credits: 850,
      bonusPack: 'skin_pack',
      description: '+850 💲 & 1 Booster de Skin',
    },
    malus: 400,
  },
  {
    id: 'razer_chroma',
    difficulty: 'medium',
    brandName: 'Razer',
    logo: '/logo/marque/razer.svg',
    title: 'Spectre Chroma',
    conditionText: 'Finir Top 4 avec 5 titulaires issus de 5 équipes distinctes.',
    type: 'multi_team_top4',
    deadlineEvents: 2,
    reward: {
      credits: 800,
      bonusPack: 'skin_pack',
      description: '+800 💲 & 1 Booster de Skin',
    },
    malus: 400,
  },
  {
    id: 'mastercard_priceless',
    difficulty: 'medium',
    brandName: 'Mastercard',
    logo: '/logo/marque/mastercard.svg',
    title: 'Roster sans Prix',
    conditionText: 'Finir Top 4 d\'un tournoi avec au moins 2 cartes Communes titulaires.',
    type: 'common_top4',
    deadlineEvents: 2,
    reward: {
      credits: 800,
      bonusPack: 'skin_pack',
      description: '+800 💲 & 1 Booster de Skin',
    },
    malus: 420,
  },
  {
    id: 'mercedes_silver_arrow',
    difficulty: 'medium',
    brandName: 'Mercedes-Benz',
    logo: '/logo/marque/mercedes.svg',
    title: 'Flèche d\'Argent',
    conditionText: 'Aligner un cinq titulaire de 400+ de note sans Commune et finir dans le Top 4.',
    type: 'team_power_no_common_top4',
    targetValue: 400,
    deadlineEvents: 2,
    reward: {
      credits: 900,
      bonusPack: 'skin_pack',
      description: '+900 💲 & 1 Booster de Skin',
    },
    malus: 480,
  },
  {
    id: 'redbull_wings',
    difficulty: 'medium',
    brandName: 'Red Bull',
    logo: '/logo/marque/redbull.svg',
    title: 'Donne des Ailes',
    conditionText: 'Finir dans le Top 4 d\'un tournoi avec au moins 1 carte WANTED titulaire.',
    type: 'wanted_top4',
    deadlineEvents: 2,
    reward: {
      credits: 900,
      bonusPack: 'skin_pack',
      description: '+900 💲 & 1 Booster de Skin',
    },
    malus: 480,
  },

  // ==========================================
  // CONTRATS DIFFICILES (Haut niveau, gros gains, gros malus)
  // ==========================================
  {
    id: 'mercedes_precision',
    difficulty: 'hard',
    brandName: 'Mercedes-Benz',
    logo: '/logo/marque/mercedes.svg',
    title: 'Précision Allemande',
    conditionText: 'Gagner un tournoi officiel (TOP 1) avec au moins 3 joueurs LCK.',
    type: 'lck_tournament_win',
    deadlineEvents: 2,
    reward: {
      credits: 1300,
      bonusPack: 'skin_pack',
      description: '+1 300 💲 & 1 Booster de Skin',
    },
    malus: 800,
  },
  {
    id: 'redbull_rush',
    difficulty: 'hard',
    brandName: 'Red Bull',
    logo: '/logo/marque/redbull.svg',
    title: 'Offensive Totale',
    conditionText: 'Gagner un tournoi officiel (TOP 1) avec au moins 1 joueur WANTED titulaire.',
    type: 'wanted_tournament_win',
    deadlineEvents: 3,
    reward: {
      credits: 1600,
      bonusPack: 'skin_pack',
      description: '+1 600 💲 & 1 Booster de Skin',
    },
    malus: 950,
  },
  {
    id: 'razer_perfection',
    difficulty: 'hard',
    brandName: 'Razer',
    logo: '/logo/marque/razer.svg',
    title: 'For Gamers by Gamers',
    conditionText: 'Remporter un tournoi officiel (TOP 1).',
    type: 'tournament_win',
    deadlineEvents: 3,
    reward: {
      credits: 1400,
      bonusPack: 'skin_pack',
      description: '+1 400 💲 & 1 Booster de Skin',
    },
    malus: 850,
  },
  {
    id: 'mastercard_gold',
    difficulty: 'hard',
    brandName: 'Mastercard',
    logo: '/logo/marque/mastercard.svg',
    title: 'Réserve d\'Or',
    conditionText: 'Avoir au moins 2 000 💲 en trésorerie et finir dans le Top 2 d\'un tournoi.',
    type: 'economy_top2',
    targetValue: 2000,
    deadlineEvents: 2,
    reward: {
      credits: 1250,
      bonusPack: 'skin_pack',
      description: '+1 250 💲 & 1 Booster de Skin',
    },
    malus: 750,
  },
];

export function openSkinPack(gameState, playerId) {
  if (!gameState.teamSkins) gameState.teamSkins = {};
  if (!gameState.teamSkins[playerId]) {
    gameState.teamSkins[playerId] = { owned: ['default'], equipped: 'default' };
  }
  const owned = gameState.teamSkins[playerId].owned || ['default'];

  // Tirage aléatoire parmi TOUS les skins du booster (pas seulement les non-obtenus)
  const rolledSkinId = NON_QUEST_SKIN_IDS[Math.floor(Math.random() * NON_QUEST_SKIN_IDS.length)];
  const skinObj = SKIN_BY_ID[rolledSkinId];
  const rarity = skinObj?.rarity || 'Rare';

  const isDuplicate = owned.includes(rolledSkinId);

  if (isDuplicate) {
    // Compensation uniquement si doublon : Commune: 50$, Rare: 100$, Épique: 200$, Légendaire: 500$
    const compensationCredits = SKIN_COMPENSATION_BY_RARITY[rarity] || 100;
    if (!gameState.economy) gameState.economy = {};
    gameState.economy[playerId] = (gameState.economy[playerId] || 0) + compensationCredits;
    return {
      type: 'duplicate_skin',
      skinId: rolledSkinId,
      compensation: true,
      credits: compensationCredits,
      rarity,
    };
  } else {
    // Nouveau skin débloqué dans la collection
    gameState.teamSkins[playerId].owned.push(rolledSkinId);
    return {
      type: 'skin',
      skinId: rolledSkinId,
      compensation: false,
      credits: 0,
      rarity,
    };
  }
}

export function getOrRefreshSponsorOfferings(gameState, playerId, forceRefresh = false) {
  if (!gameState.sponsorOfferings) gameState.sponsorOfferings = {};
  const currentEvent = gameState.eventIndex || 0;
  const current = gameState.sponsorOfferings[playerId];

  if (!forceRefresh && current && Array.isArray(current.contractIds) && current.contractIds.length === 3 && current.refreshAtEvent > currentEvent) {
    return current;
  }

  // Équilibrage : 1 facile, 1 moyen, 1 difficile si possible (ou panachage équilibré)
  const easies = SPONSOR_CONTRACTS.filter(c => c.difficulty === 'easy').sort(() => 0.5 - Math.random());
  const mediums = SPONSOR_CONTRACTS.filter(c => c.difficulty === 'medium').sort(() => 0.5 - Math.random());
  const hards = SPONSOR_CONTRACTS.filter(c => c.difficulty === 'hard').sort(() => 0.5 - Math.random());

  const selected = [];
  if (easies.length > 0) selected.push(easies[0].id);
  if (mediums.length > 0) selected.push(mediums[0].id);
  if (hards.length > 0) selected.push(hards[0].id);

  // Compléter à 3 si besoin
  for (const c of [...SPONSOR_CONTRACTS].sort(() => 0.5 - Math.random())) {
    if (selected.length < 3 && !selected.includes(c.id)) {
      selected.push(c.id);
    }
  }

  const offerings = {
    contractIds: selected,
    refreshAtEvent: currentEvent + 3,
  };
  gameState.sponsorOfferings[playerId] = offerings;
  return offerings;
}
