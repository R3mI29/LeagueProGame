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
      const CHANCE = 0.35; 

      
      const processRoam = (team, side, player) => {
        
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
          label: `🗡️ THE SHY DESCEND DU CIEL ! Son Aatrox se jette en 1v4 avec un Flash-Q3 et annihile l'équipe de ${teamB.name} !`,
          image: "/cardsImg/webp/aatrox.webp" 
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
          label: `🗡️ THE SHY DESCEND DU CIEL ! Son Aatrox se jette en 1v4 avec un Flash-Q3 et annihile l'équipe de ${teamA.name} !`,
          image: "/cardsImg/webp/aatrox.webp" 
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
  },
  {
    id: 'keria-adaptability',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state, triggeredEvents) {
      const CHANCE = 0.35; 
      const hasA = teamA.roster.some(p => p.id.includes("keria-3PEAT-WC"));
      const hasB = teamB.roster.some(p => p.id.includes("keria-3PEAT-WC"));
      if (!hasA && !hasB) return null;

      const keriaSide = hasA ? 'A' : 'B';
      const enemySide = hasA ? 'B' : 'A';

      
      if (!triggeredEvents || triggeredEvents.length === 0) return null;

      
      const enemyBuffs = triggeredEvents.filter(e => e.side === enemySide && e.ratingDelta > 0);
      if (enemyBuffs.length === 0) return null;

      
      const stolenPower = enemyBuffs.reduce((sum, e) => sum + e.ratingDelta, 0);
      if (Math.random() > CHANCE) return null;
      
      return {
        side: keriaSide,
        ratingDelta: stolenPower/5,
        targetRoles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
        label: `GÉNIE TACTIQUE : Keria a analysé la stratégie adverse et renverse la situation (+${stolenPower}) sur toute son équipe !`,
        
      };
    }
  },
  {
    id: 'canyon-showmaker-2020',
    uniquePerBO: true,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const CHANCE = 0.75; 
      const checkDuo = (team) => team.roster.some(p => p.id === "canyon-mvp-2020") && team.roster.some(p => p.id.toLowerCase().includes("showmaker-prime"));
      if (Math.random() > CHANCE) return null;
      if (checkDuo(teamA)) {
        return { side: 'A', ratingDelta: 10, targetRoles: ['Mid', 'Jungle'], persistentBO: true, label: "SYNERGIE DWG 2020: Canyon et ShowMaker sont inarretables !" };
      }
      if (checkDuo(teamB)) {
        return { side: 'B', ratingDelta: 10, targetRoles: ['Mid', 'Jungle'], persistentBO: true, label: "SYNERGIE DWG 2020: Canyon et ShowMaker sont inarretables !"};
      }
      return null;
    }
  },
  {
    id: 'canyon-2020-noob-stomp',
    uniquePerBO: false, 
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      // On cherche dans quelle équipe est Canyon
      const getCanyonData = () => {
        const canyonA = teamA.roster.find(p => p.id === "canyon-mvp-2020");
        if (canyonA) return { canyon: canyonA, myTeam: teamA, enemyTeam: teamB, side: 'A' };
        const canyonB = teamB.roster.find(p => p.id === "canyon-mvp-2020");
        if (canyonB) return { canyon: canyonB, myTeam: teamB, enemyTeam: teamA, side: 'B' };
        return null;
      };

      const data = getCanyonData();
      if (!data) return null;

      
      if (Math.random() > 0.25) return null; 

     
      const canyonRating = data.canyon.rating || data.canyon.overall || 96;
      
      const enemyTop = data.enemyTeam.roster.find(p => p.role === 'Top');
      const enemyJgl = data.enemyTeam.roster.find(p => p.role === 'Jungle');
      
      // Sécurité au cas où un rôle serait vide (draft incomplète)
      const topRating = enemyTop ? (enemyTop.rating || enemyTop.overall || 80) : 80;
      const jglRating = enemyJgl ? (enemyJgl.rating || enemyJgl.overall || 80) : 80;

      // On trouve le maillon faible entre le Top et le Jungle adverse
      const minEnemyRating = Math.min(topRating, jglRating);
      const diff = canyonRating - minEnemyRating;

      if (diff > 0) {
        // CAS 1 : NOOB STOMP (L'un des deux adversaires est plus faible)
        // On génère un texte dynamique pour savoir qui s'est fait écraser
        const victim = topRating < jglRating ? "le Toplaner" : "le Jungler";
        
        return {
          side: data.side,
          ratingDelta: diff, 
          targetRoles: ['Jungle'],
          persistentBO: false,
          label: `NOOB STOMP : Canyon repère une faiblesse chez ${victim} adverse et l'exploite. (Buff personnel : +${diff})`
        };
      } else {
        // CAS 2 : RESPECT (Le Top ET le Jungle adverses sont au moins aussi forts que lui)
        return {
          side: data.side,
          ratingDelta: 2, 
          targetRoles: ['Top', 'Mid', 'ADC', 'Support'], 
          persistentBO: false,
          label: `ADAPTATION : Le topside adverse est trop solide. Canyon lock un Tank utilitaire et buff son équipe (+2) !`
        };
      }
    }
  },
];