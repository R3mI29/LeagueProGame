// src/constants/seasonConfig.js
export const EVENTS = [
  {
    id: 'first_stand',
    name: 'First Stand',
    shortName: 'FS',
    format: 'gsl_to_single', // GSL (Groupes) -> Arbre simple
    teams: 16,
    color: '#00D8FF',
    logo: '/logo/first-stand.webp',
    rewards: {
      champion: 3,
      finalist: 2,
      top4: 1,
      catchup: 2
    }
  },
  {
    id: 'msi',
    name: 'Mid-Season Invitational',
    shortName: 'MSI',
    format: 'double_elim', // Double élimination massive
    teams: 16,
    color: '#FFB020',
    logo: '/logo/msi.webp',
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
    format: 'gsl_to_single', // GSL -> Arbre simple
    teams: 16,
    color: '#9D00FF',
    logo: '/logo/ewc-2026-main-event.webp',
    rewards: {
      champion: 10,
      finalist: 5,
      top4: 2,
      catchup: 3
    }
  },
  {
    id: 'worlds',
    name: 'World Championship',
    shortName: 'WORLDS',
    format: 'swiss_to_single', // Rondes Suisses -> Arbre final
    teams: 16,
    color: '#FF3D81',
    logo: '/logo/world-championship.webp',
    isMajor: true, // Pour le mettre en avant visuellement
    rewards: {
      champion: 8,
      finalist: 4,
      top8: 2,
      catchup: 2
    }
  }
];