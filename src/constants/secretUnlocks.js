import { EVENTS } from './seasonConfig.js';
import { CARD_POOL } from './cardPlayers.js';

const REDEMPTION_ID = 'ruler-missing-redemption';

export const SECRET_UNLOCKS = [
  {
    id: REDEMPTION_ID,
    // Retourne true si le succès vient d'être débloqué
    checkAndApply(match, state, io) {
      if (!match || !match.winner) return false;

      // 1. Tournoi majeur (Worlds)
      const currentEvent = EVENTS[state.eventIndex];
      if (!currentEvent || !currentEvent.isMajor) return false;

      // 2. Quart, demi ou finale
      const isEndGame = ['qf', 'sf', 'gf', 'ub4', 'lb6', 'f-'].some(k => match.id.includes(k));
      if (!isEndGame) return false;

      const winner = match.winner;
      const loser = winner.id === match.teamA.id ? match.teamB : match.teamA;

      // 3. Ruler + Missing chez le gagnant, Faker Légendaire/WANTED chez le perdant
      const hasRuler = winner.roster.some(p => p.id.toLowerCase().includes('ruler'));
      const hasMissing = winner.roster.some(p => p.id.toLowerCase().includes('missing'));
      const hasGodFaker = loser.roster.some(
        p => p.id.toLowerCase().includes('faker') && (p.rarity === 'WANTED' || p.rarity === 'Légendaire')
      );
      if (!(hasRuler && hasMissing && hasGodFaker)) return false;

      // 4. Anti-doublon (valable aussi pour les bots)
      const winnerId = winner.id;
      if (!state.cardCollections[winnerId]) state.cardCollections[winnerId] = {};
      if (state.cardCollections[winnerId][REDEMPTION_ID]) return false;
      state.cardCollections[winnerId][REDEMPTION_ID] = 'LIFETIME';

      // 5. La carte prend la place de Missing dans la lineup active...
      const lineup = state.activeLineups?.[winnerId];
      if (lineup) {
        for (const role of Object.keys(lineup)) {
          if (String(lineup[role]).toLowerCase().includes('missing')) lineup[role] = REDEMPTION_ID;
        }
      }

      // ... et dans le roster en cours (même objet que celui du bracket)
      const idx = winner.roster.findIndex(p => p.id.toLowerCase().includes('missing'));
      if (idx !== -1) {
        const old = winner.roster[idx];
        const card = CARD_POOL.find(c => c.id === REDEMPTION_ID);
        winner.roster[idx] = {
          ...old,
          id: REDEMPTION_ID,
          role: old.role,
          ...(card ? {
            name: card.name ?? old.name,
            rating: card.rating ?? card.overall ?? old.rating,
          } : {}),
        };
      }

      // 6. Animation pour tout le monde
      try {
        io.emit('secret-unlocked', {
          title: 'LA MALÉDICTION EST BRISÉE',
          description: `${winner.name} a éliminé le Roi Démon aux Worlds.`,
          image: '/cardsImg/others/ruler_missing_DUO.jpg',
        });
      } catch (e) {
        console.error('[SECRET] emit failed', e);
      }

      return true;
    },
  },
];