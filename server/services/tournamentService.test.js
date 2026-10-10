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
