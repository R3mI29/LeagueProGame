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

      if (diff > 6) {
        
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
          label: `ADAPTATION :  Canyon respecte le topside adverse et lock un Tank utilitaire pour jouer macro !`
        };
      }
    }
  },
  {
    id: 'kanavi-CARRY',
    uniquePerBO: false, 
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const CHANCE = 0.15;

      // Test pour l'équipe A
      const aPlayer = teamA.roster.find(p => p.id.includes("kanavi-lpl-WANTED"));
      if (aPlayer && Math.random() <= CHANCE) {
        const rand = Math.random();
        if (rand <= 0.15){
          results.push({
            side: 'A',
            ratingDelta:25,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `KANAVI FLASH IN AVEC SON GRAVES ET RETOURNE LE TEAMFIGHT EN 1 V 4 !!!`,
            image: "/champions/Graves.jpg" 
          });
        }
        else if(rand <= 0.5){
          results.push({
            side: 'A',
            ratingDelta:15,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `La Bel'Veth R5 de Kanavi s'empare de toute la jungle adverse !`,
            image: "/champions/Belveth.jpg" 
          });
        }
        else{
          results.push({
            side: 'A',
            ratingDelta:10,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `Le Wukong de Kanavi trouve un 3-man flank au drake !`,
            image: "/champions/Wukong.jpg" 
          });
        }
      }

      // Test pour l'équipe B
      const bPlayer = teamB.roster.find(p => p.id.includes("kanavi-lpl-WANTED"));
      if (bPlayer && Math.random() <= CHANCE) {
        const rand = Math.random();
        if (rand <= 0.15){
          results.push({
            side: 'B',
            ratingDelta:25,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `KANAVI FLASH IN AVEC SON GRAVES ET RETOURNE LE TEAMFIGHT EN 1 V 4 !!!`,
            image: "/cardsImg/champions/Graves.webp" 
          });
        }
        else if(rand <= 0.5){
          results.push({
            side: 'B',
            ratingDelta:15,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `La Bel'Veth R5 de Kanavi s'empare de toute la jungle adverse !`,
            image: "/cardsImg/champions/Belveth.webp" 
          });
        }
        else{
          results.push({
            side: 'B',
            ratingDelta:10,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `Le Wukong de Kanavi trouve un 3-man flank au drake !`,
            image: "/cardsImg/champions/wukong.webp" 
          });
        }
      }

      return results.length > 0 ? results : null;
    }
  },
  {
    id: 'ruler-flash-faker',
    uniquePerBO: true,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];

      const processRulerFlashOnFaker = (myTeam, enemyTeam, mySide, enemySide) => {
        // La carte doit être Ruler WANTED
        const ruler = myTeam.roster.find(p => p.id === 'ruler-worlds-mvp');
        if (!ruler) return;

        // Effet UNIQUEMENT si Faker est dans l'équipe adverse (Némésis Worlds 2017)
        const enemyFaker = enemyTeam.roster.find(p => 
          p.baseName?.toLowerCase().includes('faker') || p.id?.toLowerCase().includes('faker')
        );
        if (!enemyFaker) return;

        // Calcul du numéro de game dans le BO (Game 1, Game 2, Game 3, etc.)
        const completedGames = match?.games ? match.games.length : (scoreA + scoreB);
        const currentGameNumber = completedGames + 1;

        // Grandes chances à partir de la game 3 du BO (ex: 80% dès la G3, 15% avant)
        const chance = currentGameNumber >= 3 ? 0.80 : 0.15;
        if (Math.random() > chance) return;

        // 1. Buff majeur pour Ruler (ADC) avec le splash art de Varus
        results.push({
          side: mySide,
          ratingDelta: 20,
          targetRoles: ['ADC'],
          persistentBO: false,
          label: `🎯 FLASH IN DU SIÈCLE (Worlds 2017) ! Ruler flash-in et cloue le Roi Démon Faker sur place avec la Chaîne de Corruption ! Ruler débloque le teamfight et carry la game !`,
          image: '/champions/Varus.jpg'
        });

        // 2. Malus dévastateur infligé directement sur Faker (Mid)
        results.push({
          side: enemySide,
          ratingDelta: -18,
          targetRoles: [enemyFaker.role || 'Mid'],
          persistentBO: false,
          label: null
        });
      };

      // Test pour l'équipe A
      processRulerFlashOnFaker(teamA, teamB, 'A', 'B');

      // Test pour l'équipe B
      processRulerFlashOnFaker(teamB, teamA, 'B', 'A');

      return results.length > 0 ? results : null;
    }
  },

  // ============================================================================
  // [WANTED] KINGEN - DRX WORLDS MVP 2022
  // Mechanique : Underdog Miracle DRX
  //   L'effet requiert obligatoirement une situation d'UNDERDOG (rating moyen
  //   de l'equipe inferieur a l'adversaire).
  //   Le buff s'enclenche face au deficit et scale selon le nombre de joueurs
  //   de la formation DRX 2022 reunis (Kingen, Pyosik, Zeka, Deft, BeryL) :
  //   plus il y a de membres DRX, plus le miracle des Worlds 2022 se reproduit.
  // ============================================================================
  {
    id: 'kingen-drx-reverse-sweep',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];

      const processKingen = (myTeam, enemyTeam, mySide) => {
        const kingen = myTeam.roster.find(p => p.id === 'drx-kingen-finals-mvp');
        if (!kingen) return;

        // 1. Verification de la situation d'UNDERDOG (rating moyen inferieur)
        const avg = roster => roster.reduce((s, p) => s + (p.rating || 80), 0) / (roster.length || 1);
        const myAvg = avg(myTeam.roster);
        const enemyAvg = avg(enemyTeam.roster);
        const ratingGap = enemyAvg - myAvg;

        // L'effet ne se declenche QUE si l'equipe est underdog
        if (ratingGap <= 0) return;

        // 2. Scan du nombre de freres DRX 2022 dans le roster
        const drxNames = ['kingen', 'pyosik', 'zeka', 'deft', 'beryl'];
        const drxCount = myTeam.roster.filter(p =>
          drxNames.some(name =>
            p.id?.toLowerCase().includes(name) ||
            p.baseName?.toLowerCase().includes(name)
          )
        ).length;

        if (drxCount === 0) return;

        // 3. Probabilite qui scale avec le nombre de membres DRX et le gap de niveau
        const CHANCE = Math.min(0.40 + (drxCount * 0.10) + (ratingGap * 0.02), 0.95);
        if (Math.random() > CHANCE) return;

        // 4. Puissance : base DRX + conversion du retard de rating
        const drxBaseDelta = [8, 13, 18, 23, 28];
        const gapBonus = Math.min(Math.round(ratingGap * 1.2), 12);
        const delta = Math.min(drxBaseDelta[Math.min(drxCount - 1, 4)] + gapBonus, 35);

        // Persistant si 3+ membres DRX reunis
        const isPersistent = drxCount >= 3;

        const brotherLabels = {
          1: 'Kingen seul en underdog (' + ratingGap.toFixed(1) + ' OVR de gap)',
          2: '2 freres DRX en sous-nombre (' + ratingGap.toFixed(1) + ' OVR de gap)',
          3: 'Trio DRX réuni face aux favoris (' + ratingGap.toFixed(1) + ' OVR de gap)',
          4: '4 vétérans DRX en position d underdog (' + ratingGap.toFixed(1) + ' OVR de gap)',
          5: 'LE MIRACLE DRX 2022 COMPLET ! Roster réuni pour déjouer les pronostics (' + ratingGap.toFixed(1) + ' OVR de gap)'
        };

        results.push({
          side: mySide,
          ratingDelta: delta,
          targetRoles: ['Top'],
          persistentBO: isPersistent,
          label: '🐉 UNDERDOG MIRACLE DRX ! ' + brotherLabels[drxCount] + ' - Kingen se transcende face aux favoris (+' + delta + ' OVR Top' + (isPersistent ? ', persistant' : '') + ') !',
          image: '/champions/Aatrox.jpg'
        });

        // Roster complet DRX (5 joueurs) : tout le roster profite de l elan héroïque
        if (drxCount >= 5) {
          results.push({
            side: mySide,
            ratingDelta: 10,
            targetRoles: ['Jungle', 'Mid', 'ADC', 'Support'],
            persistentBO: true,
            label: null
          });
        }
      };

      processKingen(teamA, teamB, 'A');
      processKingen(teamB, teamA, 'B');

      return results.length > 0 ? results : null;
    }
  },

  
  {
    id: 'scout-game5-inevitable',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];

      const processScout = (myTeam, enemyTeam, mySide) => {
        const scout = myTeam.roster.find(p => p.id === 'edg-scout-finals-mvp');
        if (!scout) return;

        const CHANCE = 0.75;
        if (Math.random() > CHANCE) return;

        // Initialise le compteur de procs reel pour chaque side
        if (!match._scoutProcs) match._scoutProcs = { A: 0, B: 0 };
        const procCount = match._scoutProcs[mySide] || 0;

        const delta = (procCount + 1) * 2;

        // Incremente le compteur pour le prochain proc
        match._scoutProcs[mySide] = procCount + 1;

        const labels = [
          `Scout entre dans son bo.`,
          `Scout continue à être stable.`,
          `Scout entre dans sa zone de confort !`,
          `SCOUT EST INARRETABLE !`,
          `SCOUT REUSSIT TOUT CE QU'IL ENTREPREND, MAIS QUE QUELQU'UN L'ARRETE.`
        ];

        results.push({
          side: mySide,
          ratingDelta: delta,
          targetRoles: ['Mid'],
          persistentBO: true,
          label: labels[Math.min(procCount, 4)]
        });
      };

      processScout(teamA, teamB, 'A');
      processScout(teamB, teamA, 'B');

      return results.length > 0 ? results : null;
    }
  },
];
