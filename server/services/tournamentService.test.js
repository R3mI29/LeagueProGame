import assert from 'node:assert/strict';
import test from 'node:test';

import { CARD_POOL } from '../../src/constants/cardPlayers.js';
import { ORDERED_ROLES } from '../../src/constants/roles.js';
import { prepareNewGame, resetGameState, state } from '../state/gameState.js';
import { startCardTournament } from './tournamentService.js';

test('a disconnected human team builds its roster from its saved lineup', () => {
  resetGameState();
  const player = {
    id: 'disconnected-player',
    name: 'Disconnected Team',
    tag: 'DCT',
    roster: [],
    isBot: true,
    isDisconnected: true,
  };
  prepareNewGame([player]);
  state.participants[0].isBot = true;
  state.participants[0].isDisconnected = true;

  ORDERED_ROLES.forEach(role => {
    const card = CARD_POOL.find(candidate => candidate.role === role);
    state.activeLineups[player.id][role] = card.id;
    state.cardCollections[player.id][card.id] = 'LIFETIME';
  });

  startCardTournament({ emit() {} });

  const restoredPlayer = state.participants.find(participant => participant.id === player.id);
  assert.equal(restoredPlayer.roster.length, ORDERED_ROLES.length);
  ORDERED_ROLES.forEach(role => {
    assert.equal(
      restoredPlayer.roster.find(card => card.role === role).id,
      state.activeLineups[player.id][role],
    );
  });
});

test('shuffleArray returns a shuffled copy without mutating the input', async () => {
  const { shuffleArray } = await import('../utils/random.js');
  const original = [1, 2, 3, 4, 5, 6, 7, 8];
  const copy = [...original];
  const shuffled = shuffleArray(original);

  assert.notEqual(shuffled, original);
  assert.deepEqual(original, copy);
  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
});

test('seedTeams sorts teams descending by points', async () => {
  const { seedTeams } = await import('../utils/random.js');
  const teams = [
    { id: 't1', name: 'Team 1' },
    { id: 't2', name: 'Team 2' },
    { id: 't3', name: 'Team 3' },
  ];
  const scores = {
    t1: { points: 10 },
    t2: { points: 50 },
    t3: { points: 30 },
  };
  const seeded = seedTeams(teams, scores);
  assert.deepEqual(seeded.map(t => t.id), ['t2', 't3', 't1']);
});

test('startCurrentEvent seeds double elimination 1v16, 2v15, etc.', async () => {
  const { startCurrentEvent } = await import('./tournamentService.js');
  resetGameState();
  const participants = Array.from({ length: 16 }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    roster: [],
    isBot: true,
  }));
  state.participants = participants;
  state.seasonScores = {};
  participants.forEach((p, i) => {
    state.seasonScores[p.id] = { points: (16 - i) * 10 };
  });
  // Event 1 in EVENTS is MSI (double_elim)
  state.eventIndex = 1;

  startCurrentEvent({ emit() {} });

  assert.equal(state.bracket[0].length, 8);
  for (let i = 0; i < 8; i++) {
    const match = state.bracket[0][i];
    assert.equal(match.teamA.id, `team-${i + 1}`);
    assert.equal(match.teamB.id, `team-${16 - i}`);
  }
});

test('startCurrentEvent creates GSL groups with 1 team from each pot', async () => {
  const { startCurrentEvent } = await import('./tournamentService.js');
  resetGameState();
  const participants = Array.from({ length: 16 }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    roster: [],
    isBot: true,
  }));
  state.participants = participants;
  state.seasonScores = {};
  participants.forEach((p, i) => {
    state.seasonScores[p.id] = { points: (16 - i) * 10 };
  });
  // Event 0 in EVENTS is First Stand (gsl_to_single)
  state.eventIndex = 0;

  startCurrentEvent({ emit() {} });

  assert.equal(state.groups.length, 4);
  const pot1Ids = new Set(['team-1', 'team-2', 'team-3', 'team-4']);
  const pot2Ids = new Set(['team-5', 'team-6', 'team-7', 'team-8']);
  const pot3Ids = new Set(['team-9', 'team-10', 'team-11', 'team-12']);
  const pot4Ids = new Set(['team-13', 'team-14', 'team-15', 'team-16']);

  state.groups.forEach((group) => {
    assert.ok(pot1Ids.has(group.teams[0].id));
    assert.ok(pot2Ids.has(group.teams[1].id));
    assert.ok(pot3Ids.has(group.teams[2].id));
    assert.ok(pot4Ids.has(group.teams[3].id));

    // matches: m1 is seed 1 vs seed 4 of group, m2 is seed 2 vs seed 3 of group
    assert.equal(group.matches[0].teamA.id, group.teams[0].id);
    assert.equal(group.matches[0].teamB.id, group.teams[3].id);
    assert.equal(group.matches[1].teamA.id, group.teams[1].id);
    assert.equal(group.matches[1].teamB.id, group.teams[2].id);
  });
});

