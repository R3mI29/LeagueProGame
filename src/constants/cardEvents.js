// ============================================================================
// src/constants/cardEvents.js
// Base de données des événements liés aux cartes spéciales.
// ============================================================================

export const CUSTOM_CARD_EVENTS = [
  {
    id: 'faker-worlds-clutch',
    
    uniquePerBO: true, 
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      if (state.eventIndex !== 3) return null;
      
      const results = [];
      const CHANCE = 0.2; // 20% de chance

      // Test pour l'équipe A
      const aPlayer = teamA.roster.find(p => p.id.includes('faker-hall-of-legends') || p.id.includes("faker-6x-champ"));
      if (aPlayer && Math.random() <= CHANCE) {
        results.push({ side: 'A', targetRoles: ['Mid'], ratingDelta: 999, label: `LE ROI DÉMON SE RÉVEILLE ! ${aPlayer.name} solocarry la game (Buff Worlds) !` });
      }

      // Test pour l'équipe B (Indépendant)
      const bPlayer = teamB.roster.find(p => p.id.includes('faker-hall-of-legends') || p.id.includes("faker-6x-champ"));
      if (bPlayer && Math.random() <= CHANCE) {
        results.push({ side: 'B', targetRoles: ['Mid'], ratingDelta: 999, label: `LE ROI DÉMON SE RÉVEILLE ! ${bPlayer.name} solocarry la game (Buff Worlds) !` });
      }

      return results.length > 0 ? results : null;
    }
  },

  {
    id: 'uzi-never-give-up',
    uniquePerBO: true,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const CHANCE = 0.5; 

      const aPlayer = teamA.roster.find(p => p.id.includes("uzi-adc-god"));
      if (aPlayer && scoreA < scoreB && Math.random() <= CHANCE) {
        results.push({ side: 'A', ratingDelta: 20, targetRoles: ['ADC'], persistentBO: true, label: `NEVER GIVE UP ! ${aPlayer.name} refuse la défaite et prend le match en main !` });
      }

      const bPlayer = teamB.roster.find(p => p.id.includes("uzi-adc-god"));
      if (bPlayer && scoreB < scoreA && Math.random() <= CHANCE) {
        results.push({ side: 'B', ratingDelta: 20, targetRoles: ['ADC'], persistentBO: true, label: `NEVER GIVE UP ! ${bPlayer.name} refuse la défaite et prend le match en main !` });
      }

      return results.length > 0 ? results : null;
    }
  },

  {
    id: 'showmaker-perfect-roam',
    uniquePerBO: false, 
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const CHANCE = 0.3; // 30% de chance de proc (et de relancer la boucle)

      // Fonction factorisée pour gérer le roam, peu importe l'équipe
      const processRoam = (team, side, player) => {
        // On récupère tous les joueurs de l'équipe SAUF Showmaker (pour éviter qu'il se gank lui-même)
        const teammates = team.roster.filter(p => p.id !== player.id);
        if (teammates.length === 0) return;

        let roamCount = 0;

        // Tant que la probabilité passe, il enchaîne les décalages !
        while (Math.random() <= CHANCE) {
          roamCount++;
          
          // On tire un coéquipier totalement au hasard pour CE décalage
          const target = teammates[Math.floor(Math.random() * teammates.length)];
          
          results.push({ 
            side, 
            ratingDelta: 12, 
            targetRoles: [target.role], 
            label: roamCount > 1 
              ? `🔥 ENCORE UN DÉCALAGE (Combo x${roamCount}) ! ${player.name} roam à nouveau et aide ${target.name} (+12 OVR).`
              : `DÉCALAGE PARFAIT ! ${player.name} roam et débloque la situation pour ${target.name} (+12 OVR).` 
          });
        }
      };

      // --- TEST POUR L'ÉQUIPE A ---
      const aPlayer = teamA.roster.find(p => p.id.includes("showmaker-DK-mentor"));
      if (aPlayer) processRoam(teamA, 'A', aPlayer);

      // --- TEST POUR L'ÉQUIPE B ---
      const bPlayer = teamB.roster.find(p => p.id.includes("showmaker-DK-mentor"));
      if (bPlayer) processRoam(teamB, 'B', bPlayer);

      return results.length > 0 ? results : null;
    }
  },
  {
    id: 'theshy-overextend',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const CHANCE = 0.03; 

      // Test pour l'équipe A
      const aPlayer = teamA.roster.find(p => p.id.includes("theshy-legend"));
      if (aPlayer && Math.random() <= CHANCE) {
        const enemyJungle = teamB.roster.find(p => p.role === 'Jungle');
        if (enemyJungle) {
          results.push({
            side: 'B', 
            ratingDelta: 6,
            targetRoles: ['Jungle', 'Top'], 
            label: `EXCÈS DE CONFIANCE : TheShy push jusqu'à l'inhibiteur sans vision à la 15ème minute et se fait punir par ${enemyJungle.name} !`
          });
        }
      }

      // Test pour l'équipe B
      const bPlayer = teamB.roster.find(p => p.id.includes("theshy-legend"));
      if (bPlayer && Math.random() <= CHANCE) {
        const enemyJungle = teamA.roster.find(p => p.role === 'Jungle');
        if (enemyJungle) {
          results.push({
            side: 'A', 
            ratingDelta: 6,
            targetRoles: ['Jungle', 'Top'], 
            label: `EXCÈS DE CONFIANCE : TheShy push jusqu'à l'inhibiteur sans vision à la 15ème minute et se fait punir par ${enemyJungle.name} !`
          });
        }
      }

      return results.length > 0 ? results : null;
    }
  },
  
  {
    id: 'theshy-aatrox-1v4',
    uniquePerBO: true, 
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const CHANCE = 0.10;

      // Test pour l'équipe A
      const aPlayer = teamA.roster.find(p => p.id.includes("theshy-legend"));
      if (aPlayer && Math.random() <= CHANCE) {
        results.push({
          side: 'A',
          ratingDelta:20,
          persistentBO: false,
          targetRoles: ['Top'], 
          label: `🗡️ THE SHY DESCEND DU CIEL ! Son Aatrox se jette en 1v4 avec un Flash-Q3 et annihile l'équipe de ${teamB.name} !`
        });
      }

      // Test pour l'équipe B
      const bPlayer = teamB.roster.find(p => p.id.includes("theshy-legend"));
      if (bPlayer && Math.random() <= CHANCE) {
        results.push({
          side: 'B',
          ratingDelta: 20,
          persistentBO: false,
          targetRoles: ['Top'], 
          label: `🗡️ THE SHY DESCEND DU CIEL ! Son Aatrox se jette en 1v4 avec un Flash-Q3 et annihile l'équipe de ${teamA.name} !`
        });
      }

      return results.length > 0 ? results : null;
    }
  },
  
  {
    id: 'theshy-pressure-sponge',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const CHANCE = 0.12;

      // Test pour l'équipe A
      const aPlayer = teamA.roster.find(p => p.id.includes("theshy-legend"));
      if (aPlayer && Math.random() <= CHANCE) {
        results.push(
          {
            side: 'A',
            ratingDelta: 7, 
            targetRoles: ['ADC', 'Mid', 'Jungle', 'Support'], 
            label: `🧲 AIMANT À JUNGLER : 4 joueurs viennent tuer TheShy au top... son équipe récupère le Dragon, une T2 et le contrôle total de la carte !`
          },
          {
            side: 'A',
            ratingDelta: -5, 
            targetRoles: ['Top'], 
            label: null 
          }
        );
      }

      // Test pour l'équipe B
      const bPlayer = teamB.roster.find(p => p.id.includes("theshy-legend"));
      if (bPlayer && Math.random() <= CHANCE) {
        results.push(
          {
            side: 'B',
            ratingDelta: 7, 
            targetRoles: ['ADC', 'Mid', 'Jungle', 'Support'], 
            label: `🧲 AIMANT À JUNGLER : 4 joueurs viennent tuer TheShy au top... son équipe récupère le Dragon, une T2 et le contrôle total de la carte !`
          },
          {
            side: 'B',
            ratingDelta: -5, 
            targetRoles: ['Top'], 
            label: null // Malus silencieux
          }
        );
      }

      return results.length > 0 ? results : null;
    }
  }
];