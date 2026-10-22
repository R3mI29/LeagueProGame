// src/constants/cardTraits.js
// Système de Traits des Cartes Joueurs pour le système de Méta et d'Analyse.

export const ROLE_STYLES = {
  Top: {
    duelist: {
      id: 'duelist',
      name: 'Duelliste Splitpush',
      icon: '⚔️',
      description: 'Pression 1v1 continue et menace constante d’enfoncement des sidelanes.',
    },
    tank_weakside: {
      id: 'tank_weakside',
      name: 'Roc Weakside / Tank',
      icon: '🛡️',
      description: 'Absorbe la pression sans ressources et sécurise la frontline en combat groupé.',
    },
    carry_flank: {
      id: 'carry_flank',
      name: 'Flanker / Initiateur AP',
      icon: '⚡',
      description: 'Cherche l’angle de flanc dévastateur pour décimer les lignes arrières adverses.',
    },
  },
  Jungle: {
    early_ganker: {
      id: 'early_ganker',
      name: 'Ganker Agressif',
      icon: '🔥',
      description: 'Tempo d’invasion élevé, ganks répétés et dives chirurgicaux dès les premières minutes.',
    },
    carry_farmer: {
      id: 'carry_farmer',
      name: 'Carry Farmer',
      icon: '📈',
      description: 'Maximise l’optimisation de ses camps pour s’imposer comme source de dégâts majeure.',
    },
    control_vision: {
      id: 'control_vision',
      name: 'Contrôleur de Carte',
      icon: '👁️',
      description: 'Neutralise le jungler adverse par un quadrillage de vision et le contrôle des neutres.',
    },
  },
  Mid: {
    control_mage: {
      id: 'control_mage',
      name: 'Mage de Contrôle',
      icon: '🧙‍♂️',
      description: 'Gestion parfaite des vagues, temporisation et verrouillage des zones en 5v5.',
    },
    assassin_roamer: {
      id: 'assassin_roamer',
      name: 'Assassin & Roamer',
      icon: '🗡️',
      description: 'Mobilité éclair, burst ciblé et décalages constants pour débloquer les autres lanes.',
    },
    playmaker: {
      id: 'playmaker',
      name: 'Playmaker Décisif',
      icon: '✨',
      description: 'Créateur de retournements de situation spectaculaires par des initiations audacieuses.',
    },
  },
  ADC: {
    hypercarry: {
      id: 'hypercarry',
      name: 'Hypercarry Late-Game',
      icon: '🏹',
      description: 'Positionnement millimétré et dégâts continus surpuissants lors des phases décisives.',
    },
    lane_bully: {
      id: 'lane_bully',
      name: 'Lane Bully / Pression',
      icon: '💥',
      description: 'Pression de ligne impitoyable, prise rapide des plaques et tempo de tour précoce.',
    },
    utility_sniper: {
      id: 'utility_sniper',
      name: 'Utilitaire & Sniping',
      icon: '🎯',
      description: 'Supporte l’équipe à distance par des contrôles, engages globales et de l’utilité.',
    },
  },
  Support: {
    hard_engage: {
      id: 'hard_engage',
      name: 'Hard Engage / Initiateur',
      icon: '🥊',
      description: 'Amorces franches, verrouillage instantané de la cible prioritaire et sacrifice héroïque.',
    },
    enchanter_protect: {
      id: 'enchanter_protect',
      name: 'Enchanteur / Protecteur',
      icon: '🌿',
      description: 'Peel infranchissable, boucliers et soins pour maintenir ses carrys en vie.',
    },
    roam_shotcall: {
      id: 'roam_shotcall',
      name: 'Roamer & Stratège',
      icon: '🗺️',
      description: 'Quitte la botlane dès que possible pour dynamiser le mid/jungle et diriger le jeu.',
    },
  },
};

export const TACTICAL_STYLES = {
  teamfight_5v5: {
    id: 'teamfight_5v5',
    name: 'Teamfight 5v5 & Scaling',
    icon: '🛡️',
    description: 'Patience et cohésion collective maximale lors des grands affrontements de fin de partie.',
  },
  early_dive: {
    id: 'early_dive',
    name: 'Early Dive & Snowball',
    icon: '🔥',
    description: 'Agressivité brutale dès le début de match pour asphyxier et écraser l’adversaire.',
  },
  splitpush_131: {
    id: 'splitpush_131',
    name: '1-3-1 Splitpush & Pression',
    icon: '⚡',
    description: 'Écarte les lignes et force l’équipe adverse à des rotations défensives épuisantes.',
  },
  pick_skirmish: {
    id: 'pick_skirmish',
    name: 'Pick & Escarmouches',
    icon: '🗡️',
    description: 'Pièges dans le brouillard de guerre et recherche constante de combats en supériorité numérique.',
  },
  fast_tempo: {
    id: 'fast_tempo',
    name: 'Fast Tempo & Objectifs',
    icon: '⏱️',
    description: 'Exécution rythmée autour des timers de Dragons, Héralds et Barons pour dicter la cadence.',
  },
};

export const REGIONAL_STYLES = {
  LCK: {
    id: 'LCK',
    name: 'Discipline Macro LCK',
    icon: '🇰🇷',
    description: 'Rigueur absolue des rotations, contrôle de vision millimétré et limitation des erreurs.',
  },
  LPL: {
    id: 'LPL',
    name: 'Hyper-Agressivité LPL',
    icon: '🇨🇳',
    description: 'Combats mécaniques constants, prise de risque maximale et escarmouches chaotiques.',
  },
  LEC: {
    id: 'LEC',
    name: 'Créativité & Chaos LEC',
    icon: '🇪🇺',
    description: 'Picks déstabilisants, drafts inattendues et tempo audacieux surprenant les adversaires.',
  },
  LCS: {
    id: 'LCS',
    name: 'Structure & Économie LCS',
    icon: '🇺🇸',
    description: 'Jeu ordonné, respect scrupuleux des fenêtres d’objets et prise de décisions mesurée.',
  },
  WILD: {
    id: 'WILD',
    name: 'Wildcard Sans Peur',
    icon: '🌍',
    description: 'Combativité sans complexe et audace tactique pour bousculer les favoris mondiaux.',
  },
};

export const DRAFT_TRAITS = {
  high_mechanics: {
    id: 'high_mechanics',
    name: 'Mécaniques d’Élite',
    icon: '⚡',
    description: 'Surclasse ses adversaires en micro-décisions lors des moments sous très haute tension.',
  },
  blind_pick_safe: {
    id: 'blind_pick_safe',
    name: 'Blind Pick Fiable',
    icon: '🔒',
    description: 'Polyvalence exemplaire : très difficile à counter-pick ou neutraliser en draft.',
  },
  comfort_pick: {
    id: 'comfort_pick',
    name: 'Confort Inégalé',
    icon: '👑',
    description: 'Garantit une constance irréprochable et un niveau de jeu plancher très élevé.',
  },
  shotcaller: {
    id: 'shotcaller',
    name: 'Leader Stratégique',
    icon: '📢',
    description: 'Stabilise les communications d’équipe et optimise les prises de décision critiques.',
  },
};

// Profils de traits pour les joueurs emblématiques (insensible à la casse)
const KNOWN_PLAYER_PROFILES = {
  faker: {
    roleStyle: 'control_mage',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LCK',
    draftTrait: 'shotcaller',
  },
  chovy: {
    roleStyle: 'control_mage',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LCK',
    draftTrait: 'high_mechanics',
  },
  zeus: {
    roleStyle: 'duelist',
    tacticalStyle: 'early_dive',
    regionalStyle: 'LCK',
    draftTrait: 'high_mechanics',
  },
  bin: {
    roleStyle: 'duelist',
    tacticalStyle: 'splitpush_131',
    regionalStyle: 'LPL',
    draftTrait: 'high_mechanics',
  },
  '369': {
    roleStyle: 'tank_weakside',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LPL',
    draftTrait: 'blind_pick_safe',
  },
  kiin: {
    roleStyle: 'carry_flank',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LCK',
    draftTrait: 'comfort_pick',
  },
  canyon: {
    roleStyle: 'carry_farmer',
    tacticalStyle: 'fast_tempo',
    regionalStyle: 'LCK',
    draftTrait: 'high_mechanics',
  },
  oner: {
    roleStyle: 'early_ganker',
    tacticalStyle: 'early_dive',
    regionalStyle: 'LCK',
    draftTrait: 'playmaker',
  },
  tarzan: {
    roleStyle: 'control_vision',
    tacticalStyle: 'fast_tempo',
    regionalStyle: 'LPL',
    draftTrait: 'shotcaller',
  },
  kanavi: {
    roleStyle: 'carry_farmer',
    tacticalStyle: 'early_dive',
    regionalStyle: 'LPL',
    draftTrait: 'high_mechanics',
  },
  tian: {
    roleStyle: 'early_ganker',
    tacticalStyle: 'pick_skirmish',
    regionalStyle: 'LPL',
    draftTrait: 'high_mechanics',
  },
  caps: {
    roleStyle: 'playmaker',
    tacticalStyle: 'pick_skirmish',
    regionalStyle: 'LEC',
    draftTrait: 'high_mechanics',
  },
  rookie: {
    roleStyle: 'assassin_roamer',
    tacticalStyle: 'early_dive',
    regionalStyle: 'LPL',
    draftTrait: 'high_mechanics',
  },
  scout: {
    roleStyle: 'control_mage',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LPL',
    draftTrait: 'comfort_pick',
  },
  knight: {
    roleStyle: 'playmaker',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LPL',
    draftTrait: 'high_mechanics',
  },
  ruler: {
    roleStyle: 'hypercarry',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LCK',
    draftTrait: 'comfort_pick',
  },
  viper: {
    roleStyle: 'hypercarry',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LCK',
    draftTrait: 'high_mechanics',
  },
  caliste: {
    roleStyle: 'lane_bully',
    tacticalStyle: 'early_dive',
    regionalStyle: 'LEC',
    draftTrait: 'high_mechanics',
  },
  gumayusi: {
    roleStyle: 'hypercarry',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LCK',
    draftTrait: 'blind_pick_safe',
  },
  jackeylove: {
    roleStyle: 'lane_bully',
    tacticalStyle: 'early_dive',
    regionalStyle: 'LPL',
    draftTrait: 'high_mechanics',
  },
  deft: {
    roleStyle: 'utility_sniper',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LCK',
    draftTrait: 'shotcaller',
  },
  keria: {
    roleStyle: 'hard_engage',
    tacticalStyle: 'pick_skirmish',
    regionalStyle: 'LCK',
    draftTrait: 'high_mechanics',
  },
  mikyx: {
    roleStyle: 'roam_shotcall',
    tacticalStyle: 'pick_skirmish',
    regionalStyle: 'LEC',
    draftTrait: 'playmaker',
  },
  meiko: {
    roleStyle: 'enchanter_protect',
    tacticalStyle: 'teamfight_5v5',
    regionalStyle: 'LPL',
    draftTrait: 'shotcaller',
  },
  crisp: {
    roleStyle: 'hard_engage',
    tacticalStyle: 'early_dive',
    regionalStyle: 'LPL',
    draftTrait: 'comfort_pick',
  },
  lehends: {
    roleStyle: 'roam_shotcall',
    tacticalStyle: 'pick_skirmish',
    regionalStyle: 'LCK',
    draftTrait: 'comfort_pick',
  },
};

/**
 * Fonction de hachage simple et déterministe pour générer des traits stables
 * pour toutes les cartes du pool sans profil manuel.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Calcule et retourne l'ensemble complet des traits d'une carte joueur.
 * L'architecture est modulaire et extensible (facilité d'ajouter d'autres traits à l'avenir).
 */
export function getCardTraits(card) {
  if (!card) return null;

  const role = card.role || 'Mid';
  const roleStylesAvailable = Object.keys(ROLE_STYLES[role] || ROLE_STYLES.Mid);
  const tacticalStylesAvailable = Object.keys(TACTICAL_STYLES);
  const draftTraitsAvailable = Object.keys(DRAFT_TRAITS);

  const baseKey = (card.baseName || card.name || '').trim().toLowerCase();
  const knownProfile = KNOWN_PLAYER_PROFILES[baseKey];

  // 1. Style de Rôle
  let roleStyleKey = knownProfile?.roleStyle;
  if (!roleStyleKey || !ROLE_STYLES[role]?.[roleStyleKey]) {
    const hash = hashString(`${card.id || baseKey}-role`);
    roleStyleKey = roleStylesAvailable[hash % roleStylesAvailable.length];
  }
  const roleStyle = ROLE_STYLES[role]?.[roleStyleKey] || ROLE_STYLES[role][roleStylesAvailable[0]];

  // 2. Style Tactique
  let tacticalStyleKey = knownProfile?.tacticalStyle;
  if (!tacticalStyleKey || !TACTICAL_STYLES[tacticalStyleKey]) {
    const hash = hashString(`${card.id || baseKey}-tactical`);
    tacticalStyleKey = tacticalStylesAvailable[hash % tacticalStylesAvailable.length];
  }
  const tacticalStyle = TACTICAL_STYLES[tacticalStyleKey];

  // 3. Style Régional
  let regionalKey = knownProfile?.regionalStyle || card.league;
  if (!REGIONAL_STYLES[regionalKey]) {
    if (card.nationality === 'KR') regionalKey = 'LCK';
    else if (card.nationality === 'CN') regionalKey = 'LPL';
    else if (['FR', 'DE', 'ES', 'DK', 'SE', 'PL', 'GR', 'TR'].includes(card.nationality)) regionalKey = 'LEC';
    else if (['US', 'CA'].includes(card.nationality)) regionalKey = 'LCS';
    else regionalKey = 'WILD';
  }
  const regionalStyle = REGIONAL_STYLES[regionalKey] || REGIONAL_STYLES.WILD;

  // 4. Condition / Trait de Draft
  let draftTraitKey = knownProfile?.draftTrait;
  if (!draftTraitKey || !DRAFT_TRAITS[draftTraitKey]) {
    const hash = hashString(`${card.id || baseKey}-draft`);
    draftTraitKey = draftTraitsAvailable[hash % draftTraitsAvailable.length];
  }
  const draftTrait = DRAFT_TRAITS[draftTraitKey];

  return {
    roleStyle,
    tacticalStyle,
    regionalStyle,
    draftTrait,
  };
}
