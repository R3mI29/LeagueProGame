export const EVENTS = [
  {
    id: 'first_stand',
    name: 'First Stand',
    shortName: 'FS',
    format: 'single_elim', // Arbre simple (Régional)
    teams: 8,
    color: '#00D8FF',
    rewards: {
      champion: 3,   // 3 packs pour le gagnant
      finalist: 2,
      top4: 1,
      catchup: 2     // 2 packs bonus pour les équipes éliminées au 1er tour pour les aider à revenir
    }
  },
  {
    id: 'msi',
    name: 'Mid-Season Invitational',
    shortName: 'MSI',
    format: 'double_elim', // Double élimination (Upper/Lower bracket)
    teams: 8,
    color: '#FFB020',
    rewards: {
      champion: 5,
      finalist: 3,
      top4: 2,
      catchup: 1
    }
  },
  {
    id: 'ewc',
    name: 'Esports World Cup',
    shortName: 'EWC',
    format: 'single_elim', // Arbre simple mais ultra punitif et très riche
    teams: 8,
    color: '#9D00FF',
    rewards: {
      champion: 10,  // Pluie de packs (Bien riche)
      finalist: 5,
      top4: 2,
      catchup: 3     // L'argent de l'EWC aide même les perdants à se refaire
    }
  },
  {
    id: 'worlds',
    name: 'World Championship',
    shortName: 'WORLDS',
    format: 'swiss_to_knockout', // Rondes Suisses puis Arbre final
    teams: 16,
    color: '#FF3D81',
    rewards: {
      champion: 8,
      finalist: 4,
      top8: 2,
      catchup: 2     // Récompense de participation aux Worlds
    }
  }
];