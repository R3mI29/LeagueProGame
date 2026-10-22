import assert from 'node:assert/strict';
import test from 'node:test';

import {
  generateYearlyMeta,
  countMetaLeaguePlayers,
  calculatePointsGain,
  evaluateTeamMetaSynergy,
  addMetaProgress,
  classifyTeamTiers,
  AVAILABLE_LEAGUES,
  META_TARGET_POINTS,
} from '../../src/constants/metaConfig.js';

test('generateYearlyMeta produces a valid league meta and excluded leagues', () => {
  const metaY1 = generateYearlyMeta(1);
  const metaY2 = generateYearlyMeta(2);

  assert.ok(AVAILABLE_LEAGUES.includes(metaY1.metaLeague));
  assert.equal(metaY1.excludedLeagues.length, 3);
  assert.ok(!metaY1.excludedLeagues.includes(metaY1.metaLeague));
  assert.equal(metaY1.totalPointsTarget, META_TARGET_POINTS);

  assert.ok(AVAILABLE_LEAGUES.includes(metaY2.metaLeague));
  assert.notEqual(metaY1.metaLeague, metaY2.metaLeague);
});

test('classifyTeamTiers accurately divides ratings into 4 equal segments', () => {
  const participants = [
    { id: 'team-top', roster: [{ rating: 89 }, { rating: 89 }] },
    { id: 'team-solide', roster: [{ rating: 81 }, { rating: 81 }] },
    { id: 'team-moyenne', roster: [{ rating: 76 }, { rating: 76 }] },
    { id: 'team-mauvaise', roster: [{ rating: 69 }, { rating: 69 }] },
  ];

  // min = 69, max = 89, range = 20, step = 5
  // t1 = 74, t2 = 79, t3 = 84
  const tiers = classifyTeamTiers(participants);
  assert.equal(tiers['team-top'].tier, 'top');
  assert.equal(tiers['team-solide'].tier, 'solide');
  assert.equal(tiers['team-moyenne'].tier, 'moyenne');
  assert.equal(tiers['team-mauvaise'].tier, 'mauvaise');
});

test('countMetaLeaguePlayers accurately counts roster players in meta league', () => {
  const roster = [
    { id: 'p1', league: 'LCK' },
    { id: 'p2', league: 'LCK' },
    { id: 'p3', league: 'LPL' },
    { id: 'p4', league: 'LEC' },
    { id: 'p5', league: 'LCS' },
  ];

  assert.equal(countMetaLeaguePlayers(roster, 'LCK'), 2);
  assert.equal(countMetaLeaguePlayers(roster, 'LPL'), 1);
  assert.equal(countMetaLeaguePlayers(roster, 'CBLOL'), 0);
  assert.equal(countMetaLeaguePlayers([], 'LCK'), 0);
});

test('calculatePointsGain yields 2*N for tournaments and 4*N for scrims', () => {
  const roster = [
    { id: 'p1', league: 'LCK' },
    { id: 'p2', league: 'LCK' },
    { id: 'p3', league: 'LCK' },
    { id: 'p4', league: 'LPL' },
    { id: 'p5', league: 'LEC' },
  ];

  // 3 LCK players:
  // Tournament: 2 * 3 = 6 pts
  assert.equal(calculatePointsGain(roster, 'LCK', false), 6);
  // Scrim: 2 * (2 * 3) = 12 pts
  assert.equal(calculatePointsGain(roster, 'LCK', true), 12);

  // 0 LCK players:
  const noLckRoster = [
    { id: 'p1', league: 'LEC' },
    { id: 'p2', league: 'LPL' },
  ];
  assert.equal(calculatePointsGain(noLckRoster, 'LCK', false), 0);
  assert.equal(calculatePointsGain(noLckRoster, 'LCK', true), 0);
});

test('evaluateTeamMetaSynergy provides rating bonus of 0.3 per meta league player', () => {
  const yearlyMeta = { metaLeague: 'LCK' };
  const roster = [
    { id: 'p1', league: 'LCK' },
    { id: 'p2', league: 'LCK' },
    { id: 'p3', league: 'LPL' },
  ];

  const synergy = evaluateTeamMetaSynergy(roster, yearlyMeta);
  assert.equal(synergy.count, 2);
  assert.equal(synergy.bonus, 0.6);
});

test('addMetaProgress reveals clues in history at 50, 75 and 100 points with descriptive logs', () => {
  const yearlyMeta = {
    metaLeague: 'LCK',
    excludedLeagues: ['LEC', 'LPL', 'LCS'],
    totalPointsTarget: 100,
  };

  const knowledge = {
    points: 0,
    discoveredClues: [],
    observations: [],
  };

  // 1. Progress below 50 -> No clue, only regular log specifying meta analysis
  addMetaProgress(knowledge, 30, yearlyMeta, 'Tournoi', { metaCount: 0, matchesPlayed: 2, wins: 2, losses: 0 });
  assert.equal(knowledge.points, 30);
  assert.equal(knowledge.discoveredClues.length, 0);
  assert.equal(knowledge.observations.length, 1);
  assert.equal(knowledge.observations[0].isClue, false);
  assert.ok(knowledge.observations[0].text.includes('Analyse Méta'));

  // 2. Cross 50 pts -> Clue 1 (excluded league 1) added as a highlighted log
  const step2 = addMetaProgress(knowledge, 25, yearlyMeta, 'Tournoi', { metaCount: 2, matchesPlayed: 3, wins: 1, losses: 2 }); // 55 pts
  assert.equal(knowledge.points, 55);
  assert.equal(knowledge.discoveredClues.length, 1);
  assert.equal(knowledge.discoveredClues[0].threshold, 50);
  assert.equal(knowledge.discoveredClues[0].league, 'LEC');
  assert.equal(step2.newClue?.threshold, 50);

  const clue50Obs = knowledge.observations.find(o => o.isClue && o.clueLevel === 50);
  assert.ok(clue50Obs);
  assert.ok(clue50Obs.text.includes('LEC'));

  // 3. Cross 75 pts -> Clue 2 (excluded league 2)
  const step3 = addMetaProgress(knowledge, 20, yearlyMeta, 'Scrim', { metaCount: 3, opponentName: 'T1', tier: 'top', won: true }); // 75 pts
  assert.equal(knowledge.points, 75);
  assert.equal(knowledge.discoveredClues.length, 2);
  assert.equal(knowledge.discoveredClues[1].threshold, 75);
  assert.equal(knowledge.discoveredClues[1].league, 'LPL');
  assert.equal(step3.newClue?.threshold, 75);

  const clue75Obs = knowledge.observations.find(o => o.isClue && o.clueLevel === 75);
  assert.ok(clue75Obs);
  assert.ok(clue75Obs.text.includes('LPL'));

  // 4. Reach 100 pts -> Meta revealed in observations
  const step4 = addMetaProgress(knowledge, 30, yearlyMeta, 'Tournoi', { metaCount: 3, matchesPlayed: 2, wins: 2, losses: 0 }); // 100 pts
  assert.equal(knowledge.points, 100);
  assert.equal(knowledge.discoveredClues.length, 3);
  assert.equal(knowledge.discoveredClues[2].threshold, 100);
  assert.equal(knowledge.discoveredClues[2].type, 'meta');
  assert.equal(knowledge.discoveredClues[2].league, 'LCK');
  assert.equal(step4.newClue?.threshold, 100);

  const clue100Obs = knowledge.observations.find(o => o.isClue && o.clueLevel === 100);
  assert.ok(clue100Obs);
  assert.ok(clue100Obs.text.includes('LCK'));
});

test('generateMetaChampions provides 3 champions per role in yearlyMeta', () => {
  const meta = generateYearlyMeta(1);
  assert.ok(meta.metaChampions);
  const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  for (const role of roles) {
    assert.ok(Array.isArray(meta.metaChampions[role]));
    assert.equal(meta.metaChampions[role].length, 3);
  }
});

test('getPlayerChampionPool provides signature picks for famous players and procedural for others', async () => {
  const { getPlayerChampionPool } = await import('../../src/constants/playerChampionPools.js');
  
  // Faker
  const fakerCard = { id: 't1_faker', baseName: 'Faker', role: 'Mid' };
  const fakerPool = getPlayerChampionPool(fakerCard);
  assert.ok(fakerPool.length >= 5);
  const azir = fakerPool.find(p => p.champId === 'azir');
  assert.ok(azir);
  assert.equal(azir.mastery.level, 5); // Signature level

  // Procedural player
  const rookieCard = { id: 'rookie_top_1', baseName: 'SomeRookie', role: 'Top' };
  const rookiePool = getPlayerChampionPool(rookieCard);
  assert.ok(rookiePool.length >= 4);
  assert.ok(rookiePool[0].mastery.bonus >= rookiePool[rookiePool.length - 1].mastery.bonus);
});

test('selectBotTeamChampions selects 5 distinct, well-suited champions for a team', async () => {
  const { selectBotTeamChampions, evaluateTeamChampionPicks } = await import('../../src/constants/metaConfig.js');

  const yearlyMeta = generateYearlyMeta(1);
  const botRoster = [
    { id: 'b_top', role: 'Top', rating: 80 },
    { id: 'b_jgl', role: 'Jungle', rating: 80 },
    { id: 'b_mid', role: 'Mid', rating: 80 },
    { id: 'b_adc', role: 'ADC', rating: 80 },
    { id: 'b_sup', role: 'Support', rating: 80 },
  ];

  const picks = selectBotTeamChampions(botRoster, yearlyMeta);
  assert.ok(picks.Top);
  assert.ok(picks.Jungle);
  assert.ok(picks.Mid);
  assert.ok(picks.ADC);
  assert.ok(picks.Support);

  // Vérifier qu'il n'y a pas de doublon dans l'équipe
  const pickedList = Object.values(picks);
  const uniqueList = [...new Set(pickedList)];
  assert.equal(pickedList.length, uniqueList.length);

  // Bonus calculé
  const evalTeam = evaluateTeamChampionPicks(botRoster, picks, yearlyMeta);
  assert.ok(evalTeam.totalBonus >= 0);
});

test('generateChampionMetaTiers generates 7 tiers per role including 1-3 BROKEN and 1-3 HORRIBLE', async () => {
  const { generateChampionMetaTiers, CHAMPION_META_TIERS, getChampionsByRole } = await import('../../src/constants/metaConfig.js');

  const tiersByRole = generateChampionMetaTiers(1);
  const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];

  roles.forEach(role => {
    const roleTiers = tiersByRole[role];
    assert.ok(roleTiers);
    const champsForRole = getChampionsByRole(role);
    const champIds = Object.keys(roleTiers);
    assert.equal(champIds.length, champsForRole.length);

    const broken = champIds.filter(id => roleTiers[id].tier === 'BROKEN');
    const horrible = champIds.filter(id => roleTiers[id].tier === 'HORRIBLE');
    const tresBon = champIds.filter(id => roleTiers[id].tier === 'TRES_BON');
    const bon = champIds.filter(id => roleTiers[id].tier === 'BON');
    const equilibre = champIds.filter(id => roleTiers[id].tier === 'EQUILIBRE');

    assert.ok(broken.length >= 1 && broken.length <= 3, `Role ${role} BROKEN count ${broken.length} outside [1, 3]`);
    assert.ok(horrible.length >= 1 && horrible.length <= 3, `Role ${role} HORRIBLE count ${horrible.length} outside [1, 3]`);
    assert.ok(tresBon.length > 0);
    assert.ok(bon.length > 0);
    assert.ok(equilibre.length > 0);
  });

  assert.equal(CHAMPION_META_TIERS.BROKEN.bonus, 3);
  assert.equal(CHAMPION_META_TIERS.TRES_BON.bonus, 2);
  assert.equal(CHAMPION_META_TIERS.BON.bonus, 1);
  assert.equal(CHAMPION_META_TIERS.EQUILIBRE.bonus, 0);
  assert.equal(CHAMPION_META_TIERS.MAUVAIS.bonus, -1);
  assert.equal(CHAMPION_META_TIERS.TRES_MAUVAIS.bonus, -2);
  assert.equal(CHAMPION_META_TIERS.HORRIBLE.bonus, -3);
});

test('champion decryption points track progress up to 10 points', async () => {
  const {
    isChampionDecrypted,
    getChampionDecryptionPoints,
    addChampionDecryptionPoints,
    CHAMPION_META_TARGET_POINTS,
  } = await import('../../src/constants/metaConfig.js');

  assert.equal(CHAMPION_META_TARGET_POINTS, 10);
  const knowledge = { championKnowledge: {} };

  assert.equal(isChampionDecrypted('ahri', knowledge), false);
  assert.equal(getChampionDecryptionPoints('ahri', knowledge), 0);

  addChampionDecryptionPoints(knowledge, 'ahri', 4);
  assert.equal(getChampionDecryptionPoints('ahri', knowledge), 4);
  assert.equal(isChampionDecrypted('ahri', knowledge), false);

  addChampionDecryptionPoints(knowledge, 'ahri', 6);
  assert.equal(getChampionDecryptionPoints('ahri', knowledge), 10);
  assert.equal(isChampionDecrypted('ahri', knowledge), true);

  // Caps at 10
  addChampionDecryptionPoints(knowledge, 'ahri', 5);
  assert.equal(getChampionDecryptionPoints('ahri', knowledge), 10);
});

test('calculateKnownMetaBonus reports only revealed league and champion bonuses', async () => {
  const { calculateKnownMetaBonus, generateYearlyMeta, getChampionMetaTier } = await import('../../src/constants/metaConfig.js');

  const yearlyMeta = generateYearlyMeta(1);
  const roster = [
    { id: 'p1', role: 'Mid', league: yearlyMeta.metaLeague },
    { id: 'p2', role: 'Top', league: 'OTHER' },
  ];
  const picks = {
    Mid: 'ahri',
    Top: 'aatrox',
  };

  // Case 1: Nothing decrypted
  const emptyKnowledge = { points: 0, championKnowledge: {} };
  const resEmpty = calculateKnownMetaBonus(roster, picks, yearlyMeta, emptyKnowledge);
  assert.equal(resEmpty.knownBonus, 0);
  assert.equal(resEmpty.hasUnknown, true);

  // Case 2: League decrypted (100 pts)
  const leagueKnowledge = { points: 100, championKnowledge: {} };
  const resLeague = calculateKnownMetaBonus(roster, picks, yearlyMeta, leagueKnowledge);
  // 1 meta league player = +0.3
  assert.equal(resLeague.knownBonus, 0.3);
  assert.equal(resLeague.hasUnknown, true); // champions are still unknown

  // Case 3: Champion Ahri and Aatrox decrypted (10 pts)
  const ahriTier = getChampionMetaTier('ahri', 'Mid', yearlyMeta);
  const aatroxTier = getChampionMetaTier('aatrox', 'Top', yearlyMeta);
  const fullKnowledge = {
    points: 100,
    championKnowledge: {
      ahri: 10,
      aatrox: 10,
    },
  };
  const resFull = calculateKnownMetaBonus(roster, picks, yearlyMeta, fullKnowledge);
  const expectedTotal = Math.round((0.3 + ahriTier.bonus + aatroxTier.bonus) * 10) / 10;
  assert.equal(resFull.knownBonus, expectedTotal);
  assert.equal(resFull.hasUnknown, false);
});

