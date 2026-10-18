import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearAllGameTimeouts,
  createInitialGameState,
  prepareNewGame,
  resetGameState,
  resetTournamentState,
  scheduleGameTimeout,
  state,
} from './gameState.js';

test('createInitialGameState returns independent complete state objects', () => {
  const first = createInitialGameState();
  const second = createInitialGameState();

  first.participants.push({ id: 'player-1' });
  first.cardCollections['player-1'] = {};

  assert.deepEqual(second.participants, []);
  assert.deepEqual(second.cardCollections, {});
  assert.equal(second.groups, null);
  assert.equal(second.pendingPackResults instanceof Object, true);
});

test('prepareNewGame resets stale data and initializes every participant', () => {
  resetGameState();
  state.history.push({ year: 99 });
  state.groups = [{ id: 'stale' }];

  prepareNewGame([
    { id: 'player-1', name: 'Alpha', roster: [{ id: 'old-card' }] },
    { id: 'player-2', name: 'Bravo', roster: [] },
  ]);

  assert.equal(state.phase, 'cards');
  assert.equal(state.seasonRound, 1);
  assert.deepEqual(state.history, []);
  assert.equal(state.groups, null);
  assert.deepEqual(state.participants.map(player => player.roster), [[], []]);
  assert.equal(state.economy['player-1'], 100);
  assert.equal(state.pendingPacks['player-2'], 1);
});

test('resetTournamentState preserves the season but clears tournament progress', () => {
  resetGameState();
  state.year = 3;
  state.history = [{ year: 2 }];
  state.cardCollections = { player: { card: 2 } };
  state.bracket = [[{ id: 'match' }]];
  state.groups = [{ id: 'A' }];
  state.champion = { id: 'winner' };
  state.readyPlayers = ['player'];

  resetTournamentState();

  assert.equal(state.year, 3);
  assert.deepEqual(state.history, [{ year: 2 }]);
  assert.deepEqual(state.cardCollections, { player: { card: 2 } });
  assert.deepEqual(state.bracket, []);
  assert.equal(state.groups, null);
  assert.equal(state.champion, null);
  assert.deepEqual(state.readyPlayers, []);
});

test('resetGameState cancels pending game timers', async () => {
  let called = false;
  scheduleGameTimeout('test-timer', () => {
    called = true;
  }, 10);

  resetGameState();
  await new Promise(resolve => setTimeout(resolve, 25));

  assert.equal(called, false);
  clearAllGameTimeouts();
});
