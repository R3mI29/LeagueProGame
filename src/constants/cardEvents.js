// ============================================================================
// src/constants/cardEvents.js
// Base de données des événements liés aux cartes spéciales.
// ============================================================================
import { EVENTS } from './seasonConfig.js';

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

        while (Math.random() <= CHANCE) {
          roamCount++;
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

      const aPlayer = teamA.roster.find(p => p.id.includes("showmaker-DK-mentor"));
      if (aPlayer) processRoam(teamA, 'A', aPlayer);

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

      const aPlayer = teamA.roster.find(p => p.id.includes("theshy-legend"));
      if (aPlayer && Math.random() <= CHANCE) {
        results.push({
          side: 'A',
          ratingDelta: 20,
          persistentBO: false,
          targetRoles: ['Top'], 
          label: `THE SHY SORT SON AATROX EN 1V4 ET MET UN CARREAU A TOUT LE MONDE !!!`,
          image: "/champions/Aatrox.jpg" 
        });
      }

      const bPlayer = teamB.roster.find(p => p.id.includes("theshy-legend"));
      if (bPlayer && Math.random() <= CHANCE) {
        results.push({
          side: 'B',
          ratingDelta: 20,
          persistentBO: false,
          targetRoles: ['Top'], 
          label: `THE SHY SORT SON AATROX EN 1V4 ET MET UN CARREAU A TOUT LE MONDE !!!`,
          image: "/champions/Aatrox.jpg" 
        });
      }

      return results.length > 0 ? results : null;
    }
  },

  {
    id: 'theshy-jungle-magnet',
    uniquePerBO: false, 
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const CHANCE = 0.20; 

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
            label: null
          }
        );
      }

      return results.length > 0 ? results : null;
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
      
      const topRating = enemyTop ? (enemyTop.rating || enemyTop.overall || 80) : 80;
      const jglRating = enemyJgl ? (enemyJgl.rating || enemyJgl.overall || 80) : 80;

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

      const aPlayer = teamA.roster.find(p => p.id.includes("kanavi-lpl-WANTED"));
      if (aPlayer && Math.random() <= CHANCE) {
        const rand = Math.random();
        if (rand <= 0.15){
          results.push({
            side: 'A',
            ratingDelta: 25,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `KANAVI FLASH IN AVEC SON GRAVES ET RETOURNE LE TEAMFIGHT EN 1 V 4 !!!`,
            image: "/champions/Graves.jpg" 
          });
        }
        else if (rand <= 0.5){
          results.push({
            side: 'A',
            ratingDelta: 15,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `La Bel'Veth R5 de Kanavi s'empare de toute la jungle adverse !`,
            image: "/champions/Belveth.jpg" 
          });
        }
        else {
          results.push({
            side: 'A',
            ratingDelta: 10,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `Le Wukong de Kanavi trouve un 3-man flank au drake !`,
            image: "/champions/Wukong.jpg" 
          });
        }
      }

      const bPlayer = teamB.roster.find(p => p.id.includes("kanavi-lpl-WANTED"));
      if (bPlayer && Math.random() <= CHANCE) {
        const rand = Math.random();
        if (rand <= 0.15){
          results.push({
            side: 'B',
            ratingDelta: 25,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `KANAVI FLASH IN AVEC SON GRAVES ET RETOURNE LE TEAMFIGHT EN 1 V 4 !!!`,
            image: "/cardsImg/champions/Graves.webp" 
          });
        }
        else if (rand <= 0.5){
          results.push({
            side: 'B',
            ratingDelta: 15,
            persistentBO: false,
            targetRoles: ['Jungle'], 
            label: `La Bel'Veth R5 de Kanavi s'empare de toute la jungle adverse !`,
            image: "/cardsImg/champions/Belveth.webp" 
          });
        }
        else {
          results.push({
            side: 'B',
            ratingDelta: 10,
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
        const ruler = myTeam.roster.find(p => p.id === 'ruler-worlds-mvp');
        if (!ruler) return;

        const enemyFaker = enemyTeam.roster.find(p => 
          p.baseName?.toLowerCase().includes('faker') || p.id?.toLowerCase().includes('faker')
        );
        if (!enemyFaker) return;

        const completedGames = match?.games ? match.games.length : (scoreA + scoreB);
        const currentGameNumber = completedGames + 1;

        const chance = currentGameNumber >= 3 ? 0.80 : 0.15;
        if (Math.random() > chance) return;

        results.push({
          side: mySide,
          ratingDelta: 20,
          targetRoles: ['ADC'],
          persistentBO: false,
          label: `🎯 FLASH IN DU SIÈCLE (Worlds 2017) ! Ruler flash-in et cloue le Roi Démon Faker sur place avec la Chaîne de Corruption ! Ruler débloque le teamfight et carry la game !`,
          image: '/champions/Varus.jpg'
        });

        results.push({
          side: enemySide,
          ratingDelta: -18,
          targetRoles: [enemyFaker.role || 'Mid'],
          persistentBO: false,
          label: null
        });
      };

      processRulerFlashOnFaker(teamA, teamB, 'A', 'B');
      processRulerFlashOnFaker(teamB, teamA, 'B', 'A');

      return results.length > 0 ? results : null;
    }
  },

  // ============================================================================
  // [WANTED] KINGEN - DRX WORLDS MVP 2022
  // Équilibré :
  //   Kingen s'élève face au déficit d'équipe (+6 à +20 OVR Top).
  //   L'effet est non persistant sur le BO pour éviter un effet boule de neige
  //   automatique et incontrôlable, mais peut se réactiver à chaque game où
  //   l'équipe se retrouve en position d'underdog.
  // ============================================================================
  {
    id: 'kingen-drx-reverse-sweep',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];

      const processKingen = (myTeam, enemyTeam, mySide) => {
        const kingen = myTeam.roster.find(p => p.id === 'drx-kingen-finals-mvp' || (p.baseName === 'Kingen' && p.rarity === 'WANTED'));
        if (!kingen) return;

        const avg = roster => roster.reduce((s, p) => s + (p.rating || 80), 0) / (roster.length || 1);
        const myAvg = avg(myTeam.roster);
        const enemyAvg = avg(enemyTeam.roster);
        const ratingGap = enemyAvg - myAvg;

        if (ratingGap <= 0) return;

        const drxNames = ['kingen', 'pyosik', 'zeka', 'deft', 'beryl'];
        const drxCount = myTeam.roster.filter(p =>
          drxNames.some(name =>
            p.id?.toLowerCase().includes(name) ||
            p.baseName?.toLowerCase().includes(name)
          )
        ).length;

        if (drxCount === 0) return;

        const CHANCE = Math.min(0.30 + (drxCount * 0.08) + (ratingGap * 0.01), 0.70);
        if (Math.random() > CHANCE) return;

        const drxBaseDelta = [6, 9, 12, 15, 18];
        const gapBonus = Math.min(Math.round(ratingGap * 0.7), 6);
        const delta = Math.min(drxBaseDelta[Math.min(drxCount - 1, 4)] + gapBonus, 22);

        const brotherLabels = {
          1: 'Kingen seul en underdog (' + ratingGap.toFixed(1) + ' OVR de gap)',
          2: '2 frères DRX en sous-nombre (' + ratingGap.toFixed(1) + ' OVR de gap)',
          3: 'Trio DRX réuni face aux favoris (' + ratingGap.toFixed(1) + ' OVR de gap)',
          4: '4 vétérans DRX en position d underdog (' + ratingGap.toFixed(1) + ' OVR de gap)',
          5: 'LE MIRACLE DRX 2022 COMPLET ! Roster réuni pour déjouer les pronostics (' + ratingGap.toFixed(1) + ' OVR de gap)'
        };

        results.push({
          side: mySide,
          ratingDelta: delta,
          targetRoles: ['Top'],
          persistentBO: false,
          label: '🐉 UNDERDOG MIRACLE DRX ! ' + (brotherLabels[drxCount] || '') + ' - Kingen se transcende face aux favoris (+' + delta + ' OVR Top) !',
          image: '/champions/Aatrox.jpg'
        });

        if (drxCount >= 5) {
          results.push({
            side: mySide,
            ratingDelta: 3,
            targetRoles: ['Jungle', 'Mid', 'ADC', 'Support'],
            persistentBO: false,
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

        if (!match._scoutProcs) match._scoutProcs = { A: 0, B: 0 };
        const procCount = match._scoutProcs[mySide] || 0;

        const delta = (procCount + 1) * 2;
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

  // ============================================================================
  // [WANTED] ZEUS - WORLDS FINALS MVP 2023
  // Effet 2 : Toplane Kingdom
  //   Si la moyenne de l'équipe est inférieure à celle d'en face, il y a 18% de
  //   chance que Zeus rattrape le niveau de son équipe et se buff de X pts,
  //   X étant la différence permettant à son équipe d'atteindre la même moyenne.
  // ============================================================================
  {
    id: 'zeus-toplane-kingdom',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const CHANCE = 0.18;

      const processZeus = (myTeam, enemyTeam, mySide) => {
        const zeus = myTeam.roster.find(p => p.id === 'zeus-mvp-2023' || (p.baseName === 'Zeus' && p.rarity === 'WANTED'));
        if (!zeus) return;

        const avg = roster => roster.reduce((s, p) => s + (p.rating || 80), 0) / (roster.length || 1);
        const myAvg = avg(myTeam.roster);
        const enemyAvg = avg(enemyTeam.roster);
        const ratingGap = enemyAvg - myAvg;

        if (ratingGap <= 0) return;
        if (Math.random() > CHANCE) return;

        const rosterCount = myTeam.roster.length || 5;
        const X = Math.round(ratingGap * rosterCount);

        results.push({
          side: mySide,
          ratingDelta: X,
          targetRoles: ['Top'],
          persistentBO: false,
          label: `👑 TOPLANE KINGDOM ! Zeus surclasse son vis-à-vis (+${X} Top) et hisse son équipe au même niveau que l'adversaire !`,
          image: '/cardsImg/others/worldsMVP_zeus.jpg'
        });
      };

      processZeus(teamA, teamB, 'A');
      processZeus(teamB, teamA, 'B');

      return results.length > 0 ? results : null;
    }
  },

  // ============================================================================
  // [WANTED] SMEB - LCK LEGEND / ROX TIGERS
  // Effet 1 : Captain of the Tigers
  //   Dans la Game 1 : 50% de chance que Smeb empêche son équipe durant tout le BO
  //   de subir des malus infligés par l'équipe adverse.
  //   Ne peut proc qu'en Game 1 et persiste sur le BO.
  // ============================================================================
  {
    id: 'smeb-captain-of-the-tigers',
    uniquePerBO: true,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const completedGames = match?.games ? match.games.length : (scoreA + scoreB);
      if (completedGames !== 0) return null; // Ne peut proc qu'en Game 1

      const processCaptain = (myTeam, mySide) => {
        const smeb = myTeam.roster.find(p => p.id === 'custom-smeb-1793401108574' || (p.baseName === 'Smeb' && p.rarity === 'WANTED'));
        if (!smeb) return;

        const shieldKey = mySide === 'A' ? 'smebShieldA' : 'smebShieldB';
        const checkedKey = mySide === 'A' ? 'smebShieldCheckedA' : 'smebShieldCheckedB';

        if (match[checkedKey]) return;
        match[checkedKey] = true;

        if (Math.random() <= 0.50) {
          match[shieldKey] = true;
          results.push({
            side: mySide,
            ratingDelta: 0,
            targetRoles: ['Top'],
            persistentBO: false,
            label: `🐯 CAPTAIN OF THE TIGERS ! Smeb motive ses troupes (50% réussi) : son équipe est immunisée contre tous les malus adverses pendant tout le BO !`,
            image: '/cardsImg/custom/smeb_legend.jpg'
          });
        }
      };

      processCaptain(teamA, 'A');
      processCaptain(teamB, 'B');

      return results.length > 0 ? results : null;
    }
  },

  // ============================================================================
  // [WANTED] SMEB - LCK LEGEND / ROX TIGERS
  // Effet 2 : Miracle Tigers
  //   Si l'équipe de Smeb affronte l'équipe n°1 au classement (hors sa propre
  //   équipe), Smeb buff son équipe entière de +3.
  // ============================================================================
  {
    id: 'smeb-miracle-tigers',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];

      const processMiracle = (myTeam, enemyTeam, mySide) => {
        const smeb = myTeam.roster.find(p => p.id === 'custom-smeb-1793401108574' || (p.baseName === 'Smeb' && p.rarity === 'WANTED'));
        if (!smeb) return;

        const participants = state?.participants || [];
        const otherTeams = participants.filter(p => p.id !== myTeam.id);
        if (otherTeams.length === 0) return;

        const getRankScore = (team) => {
          return state?.seasonScores?.[team.id]?.points || 0;
        };

        const sortedOthers = [...otherTeams].sort((a, b) => {
          const ptsDiff = getRankScore(b) - getRankScore(a);
          if (ptsDiff !== 0) return ptsDiff;
          const titlesDiff = (state?.seasonScores?.[b.id]?.titles || 0) - (state?.seasonScores?.[a.id]?.titles || 0);
          if (titlesDiff !== 0) return titlesDiff;
          const avg = roster => (roster || []).reduce((s, p) => s + (p.rating || 80), 0) / (roster?.length || 1);
          return avg(b.roster) - avg(a.roster);
        });

        const leaderEnemy = sortedOthers[0];
        if (enemyTeam.id !== leaderEnemy?.id) return;

        results.push({
          side: mySide,
          ratingDelta: 3,
          targetRoles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
          persistentBO: false,
          label: `🐯 MIRACLE TIGERS ! Face aux leaders du classement (${enemyTeam.name}), Smeb galvanise toute son équipe (+3 OVR sur tous les postes) !`,
          image: '/cardsImg/custom/smeb_legend.jpg'
        });
      };

      processMiracle(teamA, teamB, 'A');
      processMiracle(teamB, teamA, 'B');

      return results.length > 0 ? results : null;
    }
  },

  // ============================================================================
  // [WANTED] TIAN - FPX WORLDS FINALS MVP 2019
  // Effet 1 : Révélation Internationale (MSI / Worlds)
  //   Tian buff à chaque match des Worlds ou MSI les joueurs de son équipe
  //   qui sont Communes (+20), Rares (+15) ou Épiques (+5).
  // ============================================================================
  {
    id: 'tian-international-carry',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];

      const currentEvent = EVENTS[state?.eventIndex ?? 0];
      const eventId = currentEvent?.id?.toLowerCase() || '';
      const eventName = currentEvent?.name?.toLowerCase() || '';
      const isMsiOrWorlds = eventId.includes('msi') || eventId.includes('worlds') ||
                            eventName.includes('msi') || eventName.includes('world');

      if (!isMsiOrWorlds) return null;

      const processTian = (myTeam, mySide) => {
        const tian = myTeam.roster.find(p => p.id === 'fpx-tian-finals-mvp' || (p.baseName === 'Tian' && p.rarity === 'WANTED'));
        if (!tian) return;

        myTeam.roster.forEach(player => {
          if (player.id === tian.id) return;
          let bonus = 0;
          if (player.rarity === 'Commune') bonus = 20;
          else if (player.rarity === 'Rare') bonus = 15;
          else if (player.rarity === 'Épique' || player.rarity === 'Epique') bonus = 5;

          if (bonus > 0) {
            results.push({
              side: mySide,
              ratingDelta: bonus,
              targetRoles: [player.role],
              persistentBO: false,
              label: `🔥 TIAN FPX (BUFF ${eventId.includes('msi') ? 'MSI' : 'WORLDS'}) : Tian sublime son coéquipier ${player.baseName || player.name || player.role} (${player.rarity}) (+${bonus} OVR) !`,
              image: '/cardsImg/external/fpx_tian.jpg'
            });
          }
        });
      };

      processTian(teamA, 'A');
      processTian(teamB, 'B');

      return results.length > 0 ? results : null;
    }
  },

  // ============================================================================
  // [WANTED] TIAN - FPX WORLDS FINALS MVP 2019
  // Effet 2 : Tempo du BO
  //   Tian fait +4 à lui-même pour les games 1 et 2 d'un BO,
  //   puis baisse de 2 en partant de sa note boostée à chaque game suivante :
  //   G1: +4 (96), G2: +4 (96), G3: +2 (94), G4: +0 (92), G5: -2 (90).
  // ============================================================================
  {
    id: 'tian-bo-tempo',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state) {
      const results = [];
      const completedGames = match?.games ? match.games.length : (scoreA + scoreB);
      const currentGame = completedGames + 1;

      const delta = currentGame <= 2 ? 4 : (4 - (currentGame - 2) * 2);

      const processTian = (myTeam, mySide) => {
        const tian = myTeam.roster.find(p => p.id === 'fpx-tian-finals-mvp' || (p.baseName === 'Tian' && p.rarity === 'WANTED'));
        if (!tian) return;

        let label = null;
        if (delta > 0) {
          label = `⚡ TEMPO TIAN (Game ${currentGame}) : Tian dicte un rythme effréné dans la jungle (+${delta} Jungle) !`;
        } else if (delta === 0) {
          label = `⚖️ TEMPO TIAN (Game ${currentGame}) : Tian stabilise son niveau de jeu (rythme neutre).`;
        } else {
          label = `⏳ ESSOUFFLEMENT TIAN (Game ${currentGame}) : Le rythme effréné commence à peser sur Tian (${delta} Jungle).`;
        }

        results.push({
          side: mySide,
          ratingDelta: delta,
          targetRoles: ['Jungle'],
          persistentBO: false,
          label,
          image: '/cardsImg/external/fpx_tian.jpg'
        });
      };

      processTian(teamA, 'A');
      processTian(teamB, 'B');

      return results.length > 0 ? results : null;
    }
  },

  // ============================================================================
  // [WANTED] KERIA - 3PEAT WORLDS CHAMPION / MVP
  // Adaptabilité & Génie Tactique :
  //   Placé en TOUT DERNIER dans les événements pour analyser l'ensemble des
  //   buffs déclenchés par l'équipe adverse durant la partie.
  //   Fait la somme de TOUS les buffs adverses cumulés (tous les joueurs buffés)
  //   et les redistribue équitablement à toute son équipe (divisé par 5).
  // ============================================================================
  {
    id: 'keria-adaptability',
    uniquePerBO: false,
    apply(match, teamA, teamB, scoreA, scoreB, state, triggeredEvents) {
      const CHANCE = 0.35; 
      const hasA = teamA.roster.some(p => p.id?.includes("keria-3PEAT-WC") || (p.baseName === 'Keria' && p.rarity === 'WANTED'));
      const hasB = teamB.roster.some(p => p.id?.includes("keria-3PEAT-WC") || (p.baseName === 'Keria' && p.rarity === 'WANTED'));
      if (!hasA && !hasB) return null;

      const keriaSide = hasA ? 'A' : 'B';
      const enemySide = hasA ? 'B' : 'A';

      if (!triggeredEvents || triggeredEvents.length === 0) return null;

      // Récupérer TOUS les buffs dont a bénéficié l'équipe adverse
      const enemyBuffs = triggeredEvents.filter(e => e.side === enemySide && e.ratingDelta > 0);
      if (enemyBuffs.length === 0) return null;

      // Calculer la somme totale des points de buff reçus par l'adversaire
      const totalEnemyBuffPower = enemyBuffs.reduce((sum, e) => {
        const rolesCount = e.targetRoles && e.targetRoles.length > 0 ? e.targetRoles.length : 5;
        return sum + (e.ratingDelta * rolesCount);
      }, 0);

      if (totalEnemyBuffPower <= 0) return null;
      if (Math.random() > CHANCE) return null;

      // Répartir la puissance totale reçue par l'ennemi sur les 5 joueurs de l'équipe de Keria
      const perPlayerBonus = Math.max(1, Math.round(totalEnemyBuffPower / 5));

      return {
        side: keriaSide,
        ratingDelta: perPlayerBonus,
        targetRoles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
        label: `🧠 GÉNIE TACTIQUE : Keria a analysé la stratégie adverse (+${totalEnemyBuffPower} de buffs détectés) et redistribue la puissance (+${perPlayerBonus} par joueur) à toute son équipe !`,
        image: '/cardsImg/others/3PEAT_keria.jpg'
      };
    }
  }
];
