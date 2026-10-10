import assert from 'node:assert/strict';
import test from 'node:test';

import { resetGameState, state } from '../state/gameState.js';
import {
  createPlayerSession,
  reconnectPlayer,
} from './playerSessionService.js';

test('a disconnected player can recover every player-scoped value with a new socket id', () => {
  resetGameState();
  const oldId = 'old-socket';
  const newId = 'new-socket';
  const player = {
    id: oldId,
    name: 'Alpha',
    isBot: true,
    isDisconnected: true,
    roster: [],
  };
  const opponent = { id: 'opponent', name: 'Bravo', isBot: true, roster: [] };
  const match = {
    id: 'match-1',
    teamA: player,
    teamB: opponent,
    ready: [oldId],
    dismissedBy: [oldId],
  };

  state.participants = [player, opponent];
  state.cardCollections[oldId] = { card: 3 };
  state.activeLineups[oldId] = { Mid: 'card' };
  state.economy[oldId] = 420;
  state.pendingPackResults[oldId] = [{ id: 'card' }];
  state.teamSkins[oldId] = { equipped: 'default' };
  state.readyPlayers = [oldId];
  state.bracket = [[match]];

  const token = createPlayerSession(oldId);
  const result = reconnectPlayer(state, token, newId);

  assert.equal(result.ok, true);
  assert.equal(player.id, newId);
  assert.equal(player.isBot, false);
  assert.equal(player.isDisconnected, false);
  assert.deepEqual(state.cardCollections[newId], { card: 3 });
  assert.deepEqual(state.activeLineups[newId], { Mid: 'card' });
  assert.equal(state.economy[newId], 420);
  assert.deepEqual(state.pendingPackResults[newId], [{ id: 'card' }]);
  assert.deepEqual(state.teamSkins[newId], { equipped: 'default' });
  assert.deepEqual(state.readyPlayers, [newId]);
  assert.deepEqual(match.ready, [newId]);
  assert.deepEqual(match.dismissedBy, [newId]);
  assert.equal(state.cardCollections[oldId], undefined);
});

test('a token cannot replace a player who is still connected', () => {
  resetGameState();
  const player = {
    id: 'connected-socket',
    name: 'Alpha',
    isBot: false,
    isDisconnected: false,
    roster: [],
  };
  state.participants = [player];

  const token = createPlayerSession(player.id);
  const result = reconnectPlayer(state, token, 'intruder-socket');

  assert.equal(result.ok, false);
  assert.equal(player.id, 'connected-socket');
});
