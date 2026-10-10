import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { resetGameState, state } from '../state/gameState.js';
import {
  archiveGameSnapshot,
  isGameStateStable,
  listGameSnapshots,
  loadArchivedGame,
  loadGameSnapshot,
  persistGameSnapshot,
} from './gamePersistenceService.js';
import {
  createPlayerSession,
  reconnectPlayer,
} from './playerSessionService.js';

test('a stable game and its reconnection token survive a JSON round trip', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'lol-draft-save-'));
  const filePath = path.join(directory, 'active-game.json');

  try {
    resetGameState();
    const player = {
      id: 'old-socket',
      name: 'Persistent Team',
      isBot: false,
      isDisconnected: false,
      roster: [],
    };
    state.phase = 'cards';
    state.participants = [player];
    state.economy[player.id] = 350;
    state.cardCollections[player.id] = { card: 'LIFETIME' };
    state.bracket = [[{
      id: 'pending-match',
      status: 'pending',
      teamA: player,
      teamB: null,
      ready: [],
      dismissedBy: [],
    }]];
    const token = createPlayerSession(player.id);

    assert.equal(await persistGameSnapshot(state, { filePath }), true);
    const persisted = JSON.parse(await readFile(filePath, 'utf8'));
    assert.equal(persisted.schemaVersion, 1);
    assert.equal(persisted.gameState.economy[player.id], 350);

    resetGameState();
    const result = await loadGameSnapshot(state, { filePath });
    assert.equal(result.restored, true);
    assert.equal(state.phase, 'cards');
    assert.equal(state.participants[0].isDisconnected, true);
    assert.equal(state.bracket[0][0].teamA, state.participants[0]);

    const reconnectResult = reconnectPlayer(state, token, 'new-socket');
    assert.equal(reconnectResult.ok, true);
    assert.equal(state.economy['new-socket'], 350);
    assert.deepEqual(state.cardCollections['new-socket'], { card: 'LIFETIME' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('an actively simulating game is not considered safe to persist', () => {
  resetGameState();
  state.bracket = [[{ id: 'match', status: 'simulating_events' }]];

  assert.equal(isGameStateStable(state), false);
});

test('named archives can be listed and loaded', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'lol-draft-archives-'));
  const activeFilePath = path.join(directory, 'active-game.json');
  const savesDirectory = path.join(directory, 'saves');

  try {
    resetGameState();
    state.phase = 'cards';
    state.year = 4;
    state.participants = [{ id: 'player', name: 'Archive Team', roster: [] }];
    createPlayerSession('player');

    const archived = await archiveGameSnapshot(state, {
      label: 'Soirée test',
      activeFilePath,
      savesDirectory,
    });
    const saves = await listGameSnapshots({ savesDirectory });

    assert.equal(saves.length, 1);
    assert.equal(saves[0].id, archived.saveId);
    assert.equal(saves[0].label, 'Soirée test');
    assert.equal(saves[0].year, 4);
    assert.deepEqual(saves[0].players, ['Archive Team']);

    resetGameState();
    await loadArchivedGame(state, archived.saveId, { savesDirectory });
    assert.equal(state.year, 4);
    assert.equal(state.participants[0].name, 'Archive Team');
    assert.equal(state.awaitingResumeDecision, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
