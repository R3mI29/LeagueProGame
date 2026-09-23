// ============================================================================
// src/constants/cardEvents.js
// Base de données des événements liés aux cartes spéciales.
// ============================================================================

export const CUSTOM_CARD_EVENTS = [
  {
    id: 'faker-worlds-clutch',
    probability: 0.50,       // 50% de chance de proc si les conditions sont remplies
    uniquePerBO: true,       // Le serveur garantira que ça n'arrive qu'1 seule fois par Match (BO)
    
    // La fonction "apply" renvoie "null" si les conditions ne sont pas remplies,
    // ou un objet { side, ratingDelta, label } si le buff s'active.
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      
      // 1. Condition : Doit être le tournoi des Worlds (index 3)
      if (state.eventIndex !== 3) return null;

      // 2. Chercher si la carte "Faker Wanted" est dans l'une des équipes
      let targetPlayer = null;
      let targetSide = null;

      const aPlayer = teamA.roster.find(p => p.id.includes('faker-hall-of-legends') || p.id.includes("faker-4x-champ"));
      if (aPlayer) { targetPlayer = aPlayer; targetSide = 'A'; }
      else {
        const bPlayer = teamB.roster.find(p =>  p.id.includes('faker-hall-of-legends') || p.id.includes("faker-4x-champ"));
        if (bPlayer) { targetPlayer = bPlayer; targetSide = 'B'; }
      }

      if (!targetPlayer) return null; // La carte n'est pas dans la partie

      // 3. Déclenchement du buff
      return { 
        side: targetSide, 
        ratingDelta: 999, // +999 assure une victoire automatique de la manche
        label: `LE ROI DÉMON SE RÉVEILLE ! ${targetPlayer.name} solocarry la game (Buff Worlds) !` 
      };
    }
  },

  // --- EXEMPLE 2 : Un buff pour Uzi quand son équipe est menée au score ---
  {
    id: 'uzi-never-give-up',
    probability: 0.40,
    uniquePerBO: true,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      
      let targetPlayer = null;
      let targetSide = null;

      const aPlayer = teamA.roster.find(p => p.id.includes("uzi-adc-god"));
      if (aPlayer) { targetPlayer = aPlayer; targetSide = 'A'; }
      else {
        const bPlayer = teamB.roster.find(p => p.id.includes("uzi-adc-god"));
        if (bPlayer) { targetPlayer = bPlayer; targetSide = 'B'; }
      }

      if (!targetPlayer) return null;

      // Condition : L'équipe d'Uzi doit être en train de perdre (menée au score)
      const isLosing = (targetSide === 'A' && scoreA < scoreB) || (targetSide === 'B' && scoreB < scoreA);
      if (!isLosing) return null;

      return {
        side: targetSide,
        ratingDelta: 15,
        label: `NEVER GIVE UP ! ${targetPlayer.name} refuse la défaite et prend le match en main (+15 OVR) !`
      };
    }
  }
];