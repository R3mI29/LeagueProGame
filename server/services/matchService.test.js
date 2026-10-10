import assert from 'node:assert/strict';
import test from 'node:test';

import { GAMES_TO_WIN } from '../config/constants.js';
import { resetGameState, state } from '../state/gameState.js';
import { finalizeMatch, recordCompletedGame } from './matchService.js';

function createTeam(id) {
  return {
    id,
    name: id,
    roster: [],
  };
}

function createMatch(overrides = {}) {
  return {
    id: 'final-1',
    teamA: createTeam('alpha'),
    teamB: createTeam('bravo'),
    scoreA: 0,
    scoreB: 0,
    games: [],
    currentEvents: [],
    pendingEvents: [],
    status: 'simulating_result',
    nextId: null,
    nextSlot: null,
    ...overrides,
  };
}

const io = { emit() {} };

test('recordCompletedGame updates the score and the game history once', () => {
  const match = createMatch();
  const events = [{ label: 'event' }];

  recordCompletedGame(match, 'A', events);

  assert.equal(match.scoreA, 1);
  assert.equal(match.scoreB, 0);
  assert.equal(match.games.length, 1);
  assert.equal(match.games[0].gameNumber, 1);
  assert.deepEqual(match.lastGameEvents, events);
});

test('finalizeMatch chooses the winner and advances a single-elimination champion', () => {
  resetGameState();
  const match = createMatch({ scoreA: GAMES_TO_WIN });
  state.phase = 'simulation';
  state.tournamentPhase = 'bracket';
  state.bracket = [[match]];

  finalizeMatch(match, io);

  assert.equal(match.status, 'finished');
  assert.equal(match.winner.id, 'alpha');
  assert.equal(state.champion.id, 'alpha');
  assert.deepEqual(match.currentEvents, []);
  assert.deepEqual(match.pendingEvents, []);
});

test('finalizeMatch updates Swiss standings through the shared result path', () => {
  resetGameState();
  const match = createMatch({ id: 'sw1-m1', scoreB: GAMES_TO_WIN });
  state.tournamentPhase = 'swiss';
  state.bracket = [[match]];
  state.swissTeams = [
    { team: match.teamA, wins: 0, losses: 0 },
    { team: match.teamB, wins: 0, losses: 0 },
  ];

  finalizeMatch(match, io);

  assert.equal(state.swissTeams[0].losses, 1);
  assert.equal(state.swissTeams[1].wins, 1);
  assert.equal(state.roundComplete, true);
});
