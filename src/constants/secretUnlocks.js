import { EVENTS } from './seasonConfig.js';

export const SECRET_UNLOCKS = [
  {
    id: 'ruler-missing-redemption',
    // La fonction retourne "true" si le succès vient d'être débloqué
    checkAndApply(match, state, io) {
      if (!match || !match.winner) return false;

      // 1. Est-ce un tournoi majeur (Worlds) ?
      const currentEvent = EVENTS[state.eventIndex];
      if (!currentEvent || !currentEvent.isMajor) return false;

      // 2. Est-ce une demi-finale ou une finale ?
      const isEndGame = match.id.includes('sf') || match.id.includes('gf') || match.id.includes('ub4') || match.id.includes('lb6') || match.id.includes('f-');
      if (!isEndGame) return false;

      const winner = match.winner;
      const loser = match.winner.id === match.teamA.id ? match.teamB : match.teamA;

      // 3. Présence du duo et de Faker
      const hasRuler = winner.roster.some(p => p.id.toLowerCase().includes('ruler'));
      const hasMissing = winner.roster.some(p => p.id.toLowerCase().includes('missing'));
      const hasGodFaker = loser.roster.some(p => p.id.toLowerCase().includes('faker') && p.rating >= 94);

      if (hasRuler && hasMissing && hasGodFaker) {
        
        // 4. On donne la carte au joueur humain
        const humanId = winner.id;
        if (!humanId.startsWith('bot-')) {
          if (!state.cardCollections[humanId]) state.cardCollections[humanId] = {};
          // On vérifie s'il ne l'a pas déjà pour éviter le spam
          if (state.cardCollections[humanId]['ruler-missing-redemption']) return false;
          
          state.cardCollections[humanId]['ruler-missing-redemption'] = 1; // Ou "LIFETIME" selon ton système
        }

        // 5. On envoie l'événement au frontend avec les textes dynamiques !
        io.emit('secret-unlocked', {
          title: "LA MALÉDICTION EST BRISÉE",
          description: `${winner.name} a éliminé le Roi Démon aux Worlds.`,
          image: '/cardsImg/others/ruler_missing_DUO.jpg'
        });

        return true;
      }
      return false;
    }
  },
  
  
];