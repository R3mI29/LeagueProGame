import assert from 'node:assert/strict';
import test from 'node:test';
import { CUSTOM_CARD_EVENTS } from '../../src/constants/cardEvents.js';
import { simulateGame } from './matchService.js';
import { awardSeasonRewards } from './tournamentService.js';
import { prepareNewGame, resetGameState, state } from '../state/gameState.js';
import { EVENTS } from '../../src/constants/seasonConfig.js';

function createPlayer(id, name, role, rating, rarity) {
  return { id, baseName: name, name, role, rating, overall: rating, rarity, teamTag: 'TEST', league: 'LCK' };
}

function createTeam(id, name, roster) {
  return { id, name, roster };
}

function createMatch(teamA, teamB, overrides = {}) {
  return {
    id: 'test-match-1',
    teamA,
    teamB,
    scoreA: 0,
    scoreB: 0,
    games: [],
    currentEvents: [],
    pendingEvents: [],
    status: 'pending',
    ...overrides,
  };
}

test('Zeus Toplane Kingdom buffs Zeus by X to match opponent average when trailing', () => {
  const zeusEvent = CUSTOM_CARD_EVENTS.find(e => e.id === 'zeus-toplane-kingdom');
  assert.ok(zeusEvent, 'Zeus event exists');

  // Team A (with Zeus) has average 80
  const teamA = createTeam('teamA', 'Team A', [
    createPlayer('zeus-mvp-2023', 'Zeus', 'Top', 94, 'WANTED'),
    createPlayer('p2', 'P2', 'Jungle', 76, 'Rare'),
    createPlayer('p3', 'P3', 'Mid', 76, 'Rare'),
    createPlayer('p4', 'P4', 'ADC', 76, 'Rare'),
    createPlayer('p5', 'P5', 'Support', 78, 'Rare'),
  ]); // Sum = 400, Avg = 80

  // Team B has average 84
  const teamB = createTeam('teamB', 'Team B', [
    createPlayer('e1', 'E1', 'Top', 84, 'Rare'),
    createPlayer('e2', 'E2', 'Jungle', 84, 'Rare'),
    createPlayer('e3', 'E3', 'Mid', 84, 'Rare'),
    createPlayer('e4', 'E4', 'ADC', 84, 'Rare'),
    createPlayer('e5', 'E5', 'Support', 84, 'Rare'),
  ]); // Sum = 420, Avg = 84

  const match = createMatch(teamA, teamB);

  // Force Math.random <= 0.18 for test
  const originalRandom = Math.random;
  try {
    Math.random = () => 0.05;
    const result = zeusEvent.apply(match, teamA, teamB, 0, 0, state);
    assert.ok(result, 'Zeus event triggered');
    const zeusResult = Array.isArray(result) ? result[0] : result;
    assert.equal(zeusResult.side, 'A');
    assert.equal(zeusResult.targetRoles[0], 'Top');
    // Difference in avg = 84 - 80 = 4. X = 4 * 5 = 20
    assert.equal(zeusResult.ratingDelta, 20);
  } finally {
    Math.random = originalRandom;
  }
});

test('Zeus Tournament Gold +20% is awarded when Zeus is played in lineup', () => {
  resetGameState();
  const human = { id: 'human-1', name: 'Human Team', isBot: false };
  prepareNewGame([human]);
  state.phase = 'simulation';
  state.eventIndex = 0;
  state.champion = human;
  state.participants = [human];
  state.activeLineups[human.id] = { Top: 'zeus-mvp-2023' };
  state.economy[human.id] = 0;

  awardSeasonRewards();

  const rewardDef = EVENTS[0].rewards.money.champion;
  const expectedZeusBonus = Math.round(rewardDef * 0.20);
  assert.equal(state.lastZeusBonuses[human.id].bonus, expectedZeusBonus);
  assert.equal(state.economy[human.id], rewardDef + expectedZeusBonus);
});

test('Smeb Captain of the Tigers activates in Game 1 and blocks enemy malus across the BO', () => {
  const captainEvent = CUSTOM_CARD_EVENTS.find(e => e.id === 'smeb-captain-of-the-tigers');
  assert.ok(captainEvent, 'Captain event exists');

  const teamA = createTeam('teamA', 'ROX Tigers', [
    createPlayer('custom-smeb-1793401108574', 'Smeb', 'Top', 93, 'WANTED'),
    createPlayer('p2', 'P2', 'Jungle', 85, 'Rare'),
    createPlayer('p3', 'P3', 'Mid', 85, 'Rare'),
    createPlayer('p4', 'P4', 'ADC', 85, 'Rare'),
    createPlayer('p5', 'P5', 'Support', 85, 'Rare'),
  ]);
  const teamB = createTeam('teamB', 'Enemy Team', [
    createPlayer('e1', 'E1', 'Top', 85, 'Rare'),
    createPlayer('e2', 'E2', 'Jungle', 85, 'Rare'),
    createPlayer('e3', 'E3', 'Mid', 85, 'Rare'),
    createPlayer('e4', 'E4', 'ADC', 85, 'Rare'),
    createPlayer('e5', 'E5', 'Support', 85, 'Rare'),
  ]);

  const match = createMatch(teamA, teamB);

  // In Game 1: 50% chance procs
  const originalRandom = Math.random;
  try {
    Math.random = () => 0.1;
    const res = captainEvent.apply(match, teamA, teamB, 0, 0, state);
    assert.ok(res, 'Captain procs in Game 1');
    assert.equal(match.smebShieldA, true);

    // In Game 2 (completed games = 1), captain cannot proc again
    match.games.push({ gameNumber: 1 });
    const resG2 = captainEvent.apply(match, teamA, teamB, 1, 0, state);
    assert.equal(resG2, null, 'Cannot proc again in Game 2');
    assert.equal(match.smebShieldA, true, 'Shield remains true in Game 2');

    // Simulate Game where enemy inflicts malus on Team A
    // Simulate game with Smeb's shield active
    const simResult = simulateGame(match, state);
    // Any event with ratingDelta < 0 on side A should be repelled or neutralized
    const adverseMaluses = simResult.events.filter(e => e.side === 'A' && e.ratingDelta < 0);
    assert.equal(adverseMaluses.length, 0, 'No negative ratingDelta on side A should survive Smeb shield');
  } finally {
    Math.random = originalRandom;
  }
});

test('Smeb Miracle Tigers buffs entire team by +3 when facing #1 ranked opponent', () => {
  const miracleEvent = CUSTOM_CARD_EVENTS.find(e => e.id === 'smeb-miracle-tigers');
  assert.ok(miracleEvent, 'Miracle event exists');

  const teamA = createTeam('teamA', 'ROX Tigers', [
    createPlayer('custom-smeb-1793401108574', 'Smeb', 'Top', 93, 'WANTED'),
    createPlayer('p2', 'P2', 'Jungle', 85, 'Rare'),
    createPlayer('p3', 'P3', 'Mid', 85, 'Rare'),
    createPlayer('p4', 'P4', 'ADC', 85, 'Rare'),
    createPlayer('p5', 'P5', 'Support', 85, 'Rare'),
  ]);
  const leaderTeam = createTeam('leaderTeam', 'Top Leader', [
    createPlayer('l1', 'L1', 'Top', 88, 'Rare'),
    createPlayer('l2', 'L2', 'Jungle', 88, 'Rare'),
    createPlayer('l3', 'L3', 'Mid', 88, 'Rare'),
    createPlayer('l4', 'L4', 'ADC', 88, 'Rare'),
    createPlayer('l5', 'L5', 'Support', 88, 'Rare'),
  ]);
  const otherTeam = createTeam('otherTeam', 'Bottom Team', [
    createPlayer('o1', 'O1', 'Top', 80, 'Rare'),
    createPlayer('o2', 'O2', 'Jungle', 80, 'Rare'),
    createPlayer('o3', 'O3', 'Mid', 80, 'Rare'),
    createPlayer('o4', 'O4', 'ADC', 80, 'Rare'),
    createPlayer('o5', 'O5', 'Support', 80, 'Rare'),
  ]);

  state.participants = [teamA, leaderTeam, otherTeam];
  state.seasonScores = {
    teamA: { points: 50 },
    leaderTeam: { points: 100 }, // Leader among opponents
    otherTeam: { points: 20 },
  };

  // Facing leader -> triggers
  const matchLeader = createMatch(teamA, leaderTeam);
  const resLeader = miracleEvent.apply(matchLeader, teamA, leaderTeam, 0, 0, state);
  assert.ok(resLeader, 'Triggers against leader');
  assert.equal(resLeader[0].ratingDelta, 3);
  assert.equal(resLeader[0].targetRoles.length, 5);

  // Facing non-leader -> does not trigger
  const matchOther = createMatch(teamA, otherTeam);
  const resOther = miracleEvent.apply(matchOther, teamA, otherTeam, 0, 0, state);
  assert.equal(resOther, null, 'Does not trigger against non-leader');
});

test('Tian international buff gives +20 to Common, +15 to Rare, +5 to Epic during Worlds/MSI', () => {
  const tianIntl = CUSTOM_CARD_EVENTS.find(e => e.id === 'tian-international-carry');
  assert.ok(tianIntl, 'Tian international event exists');

  const teamTian = createTeam('teamTian', 'FPX', [
    createPlayer('fpx-tian-finals-mvp', 'Tian', 'Jungle', 93, 'WANTED'),
    createPlayer('c1', 'Toplaner', 'Top', 75, 'Commune'),
    createPlayer('r1', 'Midlaner', 'Mid', 80, 'Rare'),
    createPlayer('e1', 'Adc', 'ADC', 85, 'Épique'),
    createPlayer('w1', 'Support', 'Support', 90, 'Légendaire'),
  ]);
  const teamEnemy = createTeam('teamEnemy', 'Enemy', []);

  // First Stand (eventIndex 0, not MSI or Worlds)
  state.eventIndex = 0;
  const resFS = tianIntl.apply(createMatch(teamTian, teamEnemy), teamTian, teamEnemy, 0, 0, state);
  assert.equal(resFS, null, 'Does not trigger in First Stand');

  // Worlds (eventIndex 3)
  state.eventIndex = 3;
  const resWorlds = tianIntl.apply(createMatch(teamTian, teamEnemy), teamTian, teamEnemy, 0, 0, state);
  assert.ok(resWorlds, 'Triggers during Worlds');
  assert.equal(resWorlds.length, 3); // Commune, Rare, Épique

  const topBuff = resWorlds.find(r => r.targetRoles.includes('Top'));
  const midBuff = resWorlds.find(r => r.targetRoles.includes('Mid'));
  const adcBuff = resWorlds.find(r => r.targetRoles.includes('ADC'));

  assert.equal(topBuff.ratingDelta, 20, 'Common gets +20');
  assert.equal(midBuff.ratingDelta, 15, 'Rare gets +15');
  assert.equal(adcBuff.ratingDelta, 5, 'Epic gets +5');
});

test('Tian BO tempo applies +4, +4, +2, 0, -2 across Games 1 to 5', () => {
  const tianTempo = CUSTOM_CARD_EVENTS.find(e => e.id === 'tian-bo-tempo');
  assert.ok(tianTempo, 'Tian tempo event exists');

  const teamTian = createTeam('teamTian', 'FPX', [
    createPlayer('fpx-tian-finals-mvp', 'Tian', 'Jungle', 93, 'WANTED'),
  ]);
  const teamEnemy = createTeam('teamEnemy', 'Enemy', []);

  const deltas = [];
  for (let g = 0; g < 5; g++) {
    const match = createMatch(teamTian, teamEnemy);
    match.games = Array(g).fill({ gameNumber: 1 });
    const res = tianTempo.apply(match, teamTian, teamEnemy, 0, 0, state);
    deltas.push(res[0].ratingDelta);
  }

  assert.deepEqual(deltas, [4, 4, 2, 0, -2]);
});

test('Keria adaptability sums all enemy buffs and distributes evenly across team', () => {
  const keriaEvent = CUSTOM_CARD_EVENTS.find(e => e.id === 'keria-adaptability');
  assert.ok(keriaEvent, 'Keria event exists');

  const teamKeria = createTeam('teamKeria', 'T1', [
    createPlayer('keria-3PEAT-WC', 'Keria', 'Support', 96, 'WANTED'),
    createPlayer('k1', 'Zeus', 'Top', 90, 'Rare'),
    createPlayer('k2', 'Oner', 'Jungle', 90, 'Rare'),
    createPlayer('k3', 'Faker', 'Mid', 90, 'Rare'),
    createPlayer('k4', 'Gumayusi', 'ADC', 90, 'Rare'),
  ]);
  const enemyTeam = createTeam('enemyTeam', 'Enemy', []);

  // Suppose enemy team had 2 events:
  // 1) Mid buffed by +10 (1 role -> 10 pts)
  // 2) Top & Jungle buffed by +5 each (2 roles -> 10 pts)
  // Total enemy buff power = 20 pts
  const triggeredEvents = [
    { side: 'B', ratingDelta: 10, targetRoles: ['Mid'] },
    { side: 'B', ratingDelta: 5, targetRoles: ['Top', 'Jungle'] },
  ];

  const match = createMatch(teamKeria, enemyTeam);

  const originalRandom = Math.random;
  try {
    Math.random = () => 0.1; // Passes 35% chance
    const res = keriaEvent.apply(match, teamKeria, enemyTeam, 0, 0, state, triggeredEvents);
    assert.ok(res, 'Keria triggers');
    assert.equal(res.side, 'A');
    assert.equal(res.targetRoles.length, 5);
    // Total enemy power = 10*1 + 5*2 = 20. Divided by 5 = 4 per player!
    assert.equal(res.ratingDelta, 4);
  } finally {
    Math.random = originalRandom;
  }
});

test('Kingen is balanced and does not use persistentBO runaway stacking', () => {
  const kingenEvent = CUSTOM_CARD_EVENTS.find(e => e.id === 'kingen-drx-reverse-sweep');
  assert.ok(kingenEvent, 'Kingen event exists');

  const teamKingen = createTeam('teamKingen', 'DRX', [
    createPlayer('drx-kingen-finals-mvp', 'Kingen', 'Top', 92, 'WANTED'),
    createPlayer('drx-pyosik-world-champion', 'Pyosik', 'Jungle', 90, 'Légendaire'),
    createPlayer('drx-zeka-worlds', 'Zeka', 'Mid', 90, 'Légendaire'),
    createPlayer('p4', 'Deft', 'ADC', 85, 'Rare'),
    createPlayer('p5', 'BeryL', 'Support', 85, 'Rare'),
  ]); // 5 DRX members
  const enemyTeam = createTeam('enemyTeam', 'Superteam', [
    createPlayer('e1', 'E1', 'Top', 95, 'Rare'),
    createPlayer('e2', 'E2', 'Jungle', 95, 'Rare'),
    createPlayer('e3', 'E3', 'Mid', 95, 'Rare'),
    createPlayer('e4', 'E4', 'ADC', 95, 'Rare'),
    createPlayer('e5', 'E5', 'Support', 95, 'Rare'),
  ]); // Underdog situation

  const match = createMatch(teamKingen, enemyTeam);
  const originalRandom = Math.random;
  try {
    Math.random = () => 0.1;
    const res = kingenEvent.apply(match, teamKingen, enemyTeam, 0, 0, state);
    assert.ok(res, 'Kingen triggers');
    res.forEach(item => {
      assert.equal(item.persistentBO, false, 'Kingen events must NOT be persistentBO to avoid runaway stacking');
      assert.ok(item.ratingDelta <= 25, `Kingen ratingDelta (${item.ratingDelta}) should be reasonably capped`);
    });
  } finally {
    Math.random = originalRandom;
  }
});
