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
      points: { champion: 3, finalist: 2, top4: 1, top8: 0, base: 0 },
      money:  { champion: 300, finalist: 200, top4: 100, top8: 150, base: 100 }
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
      points: { champion: 5, finalist: 3, top4: 2, top8: 1, base: 0 },
      money:  { champion: 600, finalist: 400, top4: 300, top8: 200, base: 100 }
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
      points: { champion: 1, finalist: 0, top4: 0, top8: 0, base: 0 },
      money:  { champion: 1000, finalist: 750, top4: 500, top8: 350, base: 250 }
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
      points: { champion: 10, finalist: 5, top4: 3, top8: 2, base: 0 },
      money:  { champion: 600, finalist: 350, top4: 250, top8: 200, base: 100 }
    }
  }
];