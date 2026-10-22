import { state } from '../state/gameState.js';
import { EVENTS } from '../../src/constants/seasonConfig.js';
import { ORDERED_ROLES } from '../../src/constants/roles.js';
import { grantSkin, equipRarestSkin } from '../../src/constants/teamSkins.js';
import { isBotCheck, getUniqueBotTeam } from './playerService.js';
import { getCardById, cardToRosterEntry, generateBotRosterFromCards, upgradeBotRoster, openPack } from '../services/cardService.js';
import { shuffleArray, seedTeams } from '../utils/random.js';
import { generateYearlyMeta } from '../../src/constants/metaConfig.js';


// Barème de rattrapage sur les 4 derniers tournois (Max = 4 x 100$= 400$)
const CATCHUP_VALUES = {
  'N/A': 100,
  'TOP8': 50,
  'TOP4': 25,
  'TOP2': 0,
  'TOP1': 0
};

// Synchronise activeLineups vers p.roster pour tous les vrais joueurs (même repris d'une sauvegarde)
export function syncPlayerRosters() {
  const isGeneratedBot = participant => participant.id.startsWith('bot-') || participant.isPermanentBot;
  const playerTeams = state.participants.filter(participant => !isGeneratedBot(participant));

  playerTeams.forEach(p => {
    const lineup = state.activeLineups[p.id] || {};
    const fallbackRoster = generateBotRosterFromCards();
    p.roster = ORDERED_ROLES.map(role => {
      const cardId = lineup[role];
      const baseCard = getCardById(cardId);
      const previousEntry = p.roster?.find(player => player.role === role);
      const rosterEntry = cardToRosterEntry(baseCard)
        || previousEntry
        || fallbackRoster.find(player => player.role === role);

      if (baseCard && baseCard.id.toLowerCase().includes('caliste') && baseCard.rarity === 'WANTED') {
        const played = state.cardStats?.[p.id]?.[cardId] || 0;
        rosterEntry.rating += played; 
      }
      return rosterEntry;
    });
  });
}

export function buildPlayoffsFromSwiss() {
  const qualified = state.swissTeams.filter(t => t.wins === 3).sort((a, b) => a.losses - b.losses).map(t => t.team);
  
  const qf = [
    { id: 'qf-0', teamA: qualified[0], teamB: qualified[7], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamA' },
    { id: 'qf-1', teamA: qualified[3], teamB: qualified[4], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamB' },
    { id: 'qf-2', teamA: qualified[2], teamB: qualified[5], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamA' },
    { id: 'qf-3', teamA: qualified[1], teamB: qualified[6], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamB' }
  ];
  const sf = [
    { id: 'sf-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamA' },
    { id: 'sf-1', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamB' }
  ];
  const f = [
    { id: 'f-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: null, nextSlot: null }
  ];
  
  state.bracket = [qf, sf, f];
  state.currentRound = 0;
  state.swissTeams = null; 
  state.champion = null;
}

export function buildPlayoffsFromGroups() {
  const qf = [
    { id: 'qf-0', teamA: state.groups[0].qualified[0], teamB: state.groups[1].qualified[1], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamA' },
    { id: 'qf-1', teamA: state.groups[2].qualified[0], teamB: state.groups[3].qualified[1], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-0', nextSlot: 'teamB' },
    { id: 'qf-2', teamA: state.groups[1].qualified[0], teamB: state.groups[0].qualified[1], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamA' },
    { id: 'qf-3', teamA: state.groups[3].qualified[0], teamB: state.groups[2].qualified[1], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'sf-1', nextSlot: 'teamB' }
  ];
  const sf = [
    { id: 'sf-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamA' },
    { id: 'sf-1', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: 'f-0', nextSlot: 'teamB' }
  ];
  const f = [
    { id: 'f-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId: null, nextSlot: null }
  ];

  state.bracket = [qf, sf, f];
  state.currentRound = 0;
  state.groups = null; 
  state.champion = null;
}

export function initializeSeasonBots(gameState = state) {
  const TOTAL_TEAMS = 16;
  const isGeneratedBot = participant => participant.id.startsWith('bot-') || participant.isPermanentBot;
  const playerTeams = gameState.participants.filter(participant => !isGeneratedBot(participant));
  const existingBots = gameState.participants.filter(isGeneratedBot);

  if (existingBots.length === 0) {
    const numBots = TOTAL_TEAMS - playerTeams.length;
    const bots = [];
    for (let i = 1; i <= numBots; i++) {
      const botId = `bot-${i}`;
      const botRoster = generateBotRosterFromCards();
      const botTeam = getUniqueBotTeam(bots);
      
      if (!gameState.cardCollections) gameState.cardCollections = {};
      if (!gameState.activeLineups) gameState.activeLineups = {};
      if (!gameState.cardCollections[botId]) gameState.cardCollections[botId] = {};
      if (!gameState.activeLineups[botId]) gameState.activeLineups[botId] = {};
      
      botRoster.forEach(card => {
        card.contract = 'LIFETIME';
        gameState.cardCollections[botId][card.id] = 'LIFETIME';
        gameState.activeLineups[botId][card.role] = card.id;
      });

      bots.push({ id: botId, name: botTeam.name, tag: botTeam.tag, logo: botTeam.logo, roster: botRoster, isBot: true });
    }
    gameState.participants = [...playerTeams, ...bots];
  }

  if (!gameState.seasonScores) {
    gameState.seasonScores = {};
    gameState.participants.forEach(p => { gameState.seasonScores[p.id] = { points: 0, titles: 0 }; });
  }

  if (!gameState.recentPlacements) {
    gameState.recentPlacements = {};
    gameState.participants.forEach(p => { gameState.recentPlacements[p.id] = []; });
  }

  // S'assurer que les bots équipent leur skin le plus rare
  gameState.participants.forEach(p => {
    if (isBotCheck(p)) equipRarestSkin(gameState, p.id);
  });
}

export function startCardTournament(io) {
  syncPlayerRosters();
  initializeSeasonBots(state);

  // Initialisation de la méta secrète régionale
  if (!state.yearlyMeta) {
    state.yearlyMeta = generateYearlyMeta(state.year || 1);
  }
  if (!state.metaKnowledge) state.metaKnowledge = {};
  state.participants.forEach(p => {
    if (!state.metaKnowledge[p.id]) {
      state.metaKnowledge[p.id] = {
        points: 0,
        scrimsAvailable: 3,
        scrimsUsed: 0,
        discoveredClues: [],
        observations: [],
      };
    }
  });

  state.phase = 'season_hub';
  if (state.eventIndex === undefined) state.eventIndex = 0;
  io.emit('draft-update', state);
}

export function startCurrentEvent(io) {
  // Met à jour p.roster avec les cartes sélectionnées dans activeLineups avant chaque tournoi
  syncPlayerRosters();

  // S'assurer que chaque bot équipe son skin le plus rare avant le début du tournoi
  state.participants.forEach(p => {
    if (isBotCheck(p)) equipRarestSkin(state, p.id);
  });

  const currentEvent = EVENTS[state.eventIndex];
  state.phase = 'tournament';
  state.champion = null;
  state.currentRound = 0;
  state.readyPlayers = []; 
  state.roundComplete = false; 

  if (currentEvent.format === 'gsl_to_single') {
    state.tournamentPhase = 'groups';
    state.groups = [];

    const seeded = seedTeams(state.participants, state.seasonScores);
    const pot1 = shuffleArray(seeded.slice(0, 4));
    const pot2 = shuffleArray(seeded.slice(4, 8));
    const pot3 = shuffleArray(seeded.slice(8, 12));
    const pot4 = shuffleArray(seeded.slice(12, 16));

    for (let i = 0; i < 4; i++) {
      const groupTeams = [pot1[i], pot2[i], pot3[i], pot4[i]];
      state.groups.push({
        id: String.fromCharCode(65 + i),
        teams: groupTeams, qualified: [],
        matches: [
          { id: `g${i}-m1`, type: 'open', teamA: groupTeams[0], teamB: groupTeams[3], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false },
          { id: `g${i}-m2`, type: 'open', teamA: groupTeams[1], teamB: groupTeams[2], status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false },
          { id: `g${i}-winner`, type: 'winner', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false },
          { id: `g${i}-loser`, type: 'loser', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false },
          { id: `g${i}-decider`, type: 'decider', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false }
        ]
      });
    }
    state.bracket = [[]];
    state.groups.forEach(g => { state.bracket[0].push(g.matches[0], g.matches[1]); });
  } 
  else if (currentEvent.format === 'swiss_to_single') {
    state.tournamentPhase = 'swiss';
    state.swissTeams = state.participants.map(p => ({ team: p, wins: 0, losses: 0 }));
    
    const createMatch = (id, pool) => ({ id, pool, teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false });

    const r0 = Array(8).fill(null).map((_, i) => createMatch(`sw1-m${i+1}`, '0-0'));
    const r1 = [...Array(4).fill(null).map((_, i) => createMatch(`sw2-w${i+1}`, '1-0')), ...Array(4).fill(null).map((_, i) => createMatch(`sw2-l${i+1}`, '0-1'))];
    const r2 = [...Array(2).fill(null).map((_, i) => createMatch(`sw3-w${i+1}`, '2-0')), ...Array(4).fill(null).map((_, i) => createMatch(`sw3-m${i+1}`, '1-1')), ...Array(2).fill(null).map((_, i) => createMatch(`sw3-l${i+1}`, '0-2'))];
    const r3 = [...Array(3).fill(null).map((_, i) => createMatch(`sw4-w${i+1}`, '2-1')), ...Array(3).fill(null).map((_, i) => createMatch(`sw4-l${i+1}`, '1-2'))];
    const r4 = Array(3).fill(null).map((_, i) => createMatch(`sw5-m${i+1}`, '2-2'));

    const shuffled = shuffleArray(state.participants);
    for (let i = 0; i < 8; i++) {
      r0[i].teamA = shuffled[i*2]; r0[i].teamB = shuffled[i*2+1];
    }
    state.bracket = [r0, r1, r2, r3, r4];
  }
  else if (currentEvent.format === 'double_elim') {
    state.tournamentPhase = 'bracket';
    const createMatch = (id, teamA, teamB, nextId, nextSlot, loserNextId = null, loserNextSlot = null) => ({
      id, teamA, teamB, status: 'pending', ready: [], dismissedBy: [], scoreA: 0, scoreB: 0, games: [], waveActive: false, nextId, nextSlot, loserNextId, loserNextSlot
    });
    const r0 = [], r1 = [], r2 = [], r3 = [], r4 = [], r5 = [], r6 = [], r7 = [];

    const seededTeams = seedTeams(state.participants, state.seasonScores);
    for (let i = 0; i < 8; i++) {
      r0.push(createMatch(`ub1-${i+1}`, seededTeams[i], seededTeams[15 - i], `ub2-${Math.floor(i/2)+1}`, i%2===0 ? 'teamA' : 'teamB', `lb1-${Math.floor(i/2)+1}`, i%2===0 ? 'teamA' : 'teamB'));
    }
    r1.push(createMatch(`ub2-1`, null, null, `ub3-1`, 'teamA', `lb2-4`, 'teamA')); r1.push(createMatch(`ub2-2`, null, null, `ub3-1`, 'teamB', `lb2-3`, 'teamA')); r1.push(createMatch(`ub2-3`, null, null, `ub3-2`, 'teamA', `lb2-2`, 'teamA')); r1.push(createMatch(`ub2-4`, null, null, `ub3-2`, 'teamB', `lb2-1`, 'teamA'));
    for (let i = 0; i < 4; i++) r1.push(createMatch(`lb1-${i+1}`, null, null, `lb2-${i+1}`, 'teamB'));
    r2.push(createMatch(`ub3-1`, null, null, `ub4-1`, 'teamA', `lb4-2`, 'teamA')); r2.push(createMatch(`ub3-2`, null, null, `ub4-1`, 'teamB', `lb4-1`, 'teamA'));
    for (let i = 0; i < 4; i++) r2.push(createMatch(`lb2-${i+1}`, null, null, `lb3-${Math.floor(i/2)+1}`, i%2===0 ? 'teamA' : 'teamB'));
    r3.push(createMatch(`ub4-1`, null, null, `gf-1`, 'teamA', `lb6-1`, 'teamA')); r3.push(createMatch(`lb3-1`, null, null, `lb4-1`, 'teamB')); r3.push(createMatch(`lb3-2`, null, null, `lb4-2`, 'teamB'));
    r4.push(createMatch(`lb4-1`, null, null, `lb5-1`, 'teamA')); r4.push(createMatch(`lb4-2`, null, null, `lb5-1`, 'teamB'));
    r5.push(createMatch(`lb5-1`, null, null, `lb6-1`, 'teamB'));
    r6.push(createMatch(`lb6-1`, null, null, `gf-1`, 'teamB'));
    r7.push(createMatch(`gf-1`, null, null, null, null));
    state.bracket = [r0, r1, r2, r3, r4, r5, r6, r7];
  }

  io.emit('draft-update', state);
}

export function awardSeasonRewards() {
  const eventConfig = EVENTS[state.eventIndex];
  const getLoser = (match) => match?.winner?.id === match?.teamA?.id ? match?.teamB?.id : match?.teamA?.id;
  
  let championId = state.champion?.id;
  let finalistId = null;
  let top4Ids = [];
  let top8Ids = []; 
  
  if (eventConfig.format === 'double_elim') {
    const gf = state.bracket[7][0]; finalistId = getLoser(gf);
    const lbFinal = state.bracket[6][0]; const thirdPlaceId = getLoser(lbFinal); if (thirdPlaceId) top4Ids.push(thirdPlaceId);
    const lbSemi = state.bracket[5][0]; const fourthPlaceId = getLoser(lbSemi); if (fourthPlaceId) top4Ids.push(fourthPlaceId);
    const lb4_1 = state.bracket[4][0]; const lb4_2 = state.bracket[4][1];
    if (lb4_1) top8Ids.push(getLoser(lb4_1)); if (lb4_2) top8Ids.push(getLoser(lb4_2));
    const lb3_1 = state.bracket[3]?.[1]; const lb3_2 = state.bracket[3]?.[2];
    if (lb3_1) top8Ids.push(getLoser(lb3_1)); if (lb3_2) top8Ids.push(getLoser(lb3_2));
  } else {
    const finalMatch = state.bracket[state.bracket.length - 1]?.[0]; finalistId = getLoser(finalMatch);
    const sfMatches = state.bracket[state.bracket.length - 2] || []; top4Ids = sfMatches.map(getLoser).filter(id => id);
    const qfMatches = state.bracket[state.bracket.length - 3] || []; top8Ids = qfMatches.map(getLoser).filter(id => id);
  }

  if (!state.economy) state.economy = {};
  if (!state.seasonScores) state.seasonScores = {};
  if (!state.recentPlacements) state.recentPlacements = {};

  // Récompense du skin MSI Clash au vainqueur du MSI
  if (eventConfig.id === 'msi' && championId) {
    grantSkin(state, championId, 'msi-clash');
  }

  if (eventConfig.id === 'worlds' && championId) {
    grantSkin(state, championId, 'worlds-sovereign');
  }

  const catchupBonuses = {};

  state.participants.forEach(p => {
    if (!state.seasonScores[p.id]) state.seasonScores[p.id] = { points: 0, titles: 0 };
    if (state.economy[p.id] === undefined) state.economy[p.id] = 0;
    if (!state.recentPlacements[p.id]) state.recentPlacements[p.id] = [];

    // 1. Enregistrer le placement du tournoi (Top 1 à 8, ou N/A)
    let currentPlacement = 'N/A';
    if (p.id === championId) currentPlacement = 'TOP1';
    else if (p.id === finalistId) currentPlacement = 'TOP2';
    else if (top4Ids.includes(p.id)) currentPlacement = 'TOP4';
    else if (top8Ids.includes(p.id)) currentPlacement = 'TOP8';

    // 2. Garder les 4 derniers tournois
    state.recentPlacements[p.id].push(currentPlacement);
    if (state.recentPlacements[p.id].length > 4) {
      state.recentPlacements[p.id].shift();
    }

    // 3. Calculer le bonus de rattrapage
    catchupBonuses[p.id] = state.recentPlacements[p.id].reduce((total, placement) => {
      return total + (CATCHUP_VALUES[placement] || 0);
    }, 0);
  });

  const rewards = eventConfig.rewards;
  state.participants.forEach(p => {
    let pointsEarned = rewards.points.base || 0;
    let moneyEarned = rewards.money.base || 0;

    if (p.id === championId) { pointsEarned = rewards.points.champion; moneyEarned = rewards.money.champion; state.seasonScores[p.id].titles += 1; } 
    else if (p.id === finalistId) { pointsEarned = rewards.points.finalist; moneyEarned = rewards.money.finalist; } 
    else if (top4Ids.includes(p.id)) { pointsEarned = rewards.points.top4; moneyEarned = rewards.money.top4; } 
    else if (top8Ids.includes(p.id)) { pointsEarned = rewards.points.top8; moneyEarned = rewards.money.top8; }

    moneyEarned += (catchupBonuses[p.id] || 0);
    state.seasonScores[p.id].points += pointsEarned;

    if (!isBotCheck(p)) {
      state.economy[p.id] += moneyEarned;
    } else {
      p.roster = p.roster.map(pro => {
        if (pro.id.toLowerCase().includes('caliste') && pro.rarity === 'WANTED') { pro.rating = (pro.rating || 89) + 1; pro.overall = (pro.overall || 89) + 1; }
        if (pro.contract === 'LIFETIME') return pro; 
        let currentContract = pro.contract !== undefined ? pro.contract : 3;
        currentContract -= 1;
        
        if (currentContract <= 0) {
          const collection = state.cardCollections[p.id] || {};
          const lifetimeIds = Object.keys(collection).filter(id => collection[id] === 'LIFETIME');
          let bestLifetime = null;
          lifetimeIds.forEach(id => {
              const card = getCardById(id);
              if (card && card.role === pro.role) {
                  if (!bestLifetime || (card.rating || card.overall || 0) > (bestLifetime.rating || bestLifetime.overall || 0)) bestLifetime = card;
              }
          });
          if (bestLifetime) {
              const newPro = cardToRosterEntry(bestLifetime); newPro.contract = 'LIFETIME'; 
              if (!state.activeLineups[p.id]) state.activeLineups[p.id] = {};
              state.activeLineups[p.id][pro.role] = newPro.id; return newPro;
          } else {
              let replacement = null;
              while(!replacement) replacement = openPack('standard').find(c => c.role === pro.role);
              const newPro = cardToRosterEntry(replacement); newPro.contract = 3; 
              if (!state.activeLineups[p.id]) state.activeLineups[p.id] = {};
              state.activeLineups[p.id][pro.role] = newPro.id; return newPro;
          }
        } else {
          pro.contract = currentContract; return pro;
        }
      });
      p.roster = upgradeBotRoster(p.roster, Math.floor(moneyEarned / 100));
      p.roster.forEach(c => { if (!state.activeLineups[p.id]) state.activeLineups[p.id] = {}; state.activeLineups[p.id][c.role] = c.id; });
      equipRarestSkin(state, p.id);
    }
  });
}