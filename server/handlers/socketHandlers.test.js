import assert from 'node:assert/strict';
import test from 'node:test';

import { state, resetGameState } from '../state/gameState.js';
import { registerSocketHandlers } from './socketHandlers.js';
import { SELL_PRICES } from '../config/constants.js';

function createMockSocket(id = 'socket-1') {
  const handlers = {};
  const emitted = [];
  return {
    id,
    on(event, handler) {
      handlers[event] = handler;
    },
    emit(event, ...args) {
      emitted.push({ event, args });
    },
    handlers,
    emitted,
  };
}

function createMockIo() {
  const emitted = [];
  return {
    emit(event, ...args) {
      emitted.push({ event, args });
    },
    emitted,
  };
}

test('registerSocketHandlers registers all handlers across all domains', () => {
  const io = createMockIo();
  const socket = createMockSocket();

  registerSocketHandlers(io, socket);

  assert.equal(socket.emitted[0].event, 'draft-update');

  const expectedEvents = [
    // Lobby
    'reconnect-player',
    'takeover-bot',
    'equip-skin',
    'join-lobby',
    'resume-game',
    'leave-game',
    'start-draft',
    'toggle-reset',
    'disconnect',
    // Card
    'buy-pack',
    'close-pack',
    'toggle-lock-card',
    'sell-all-unlocked',
    'sell-card',
    'set-lineup-card',
    'toggle-lineup-ready',
    // Tournament
    'skip-match',
    'toggle-ready',
    'match-ready',
    'dismiss-match',
    'advance-round',
    'continue-season',
    'start-next-event',
    // Save
    'list-game-saves',
    'save-game',
    'delete-game-save',
    'new-game',
    'load-game',
    // Dev
    'dev-skin',
    'dev-give-card',
    'dev-give-money',
    'dev-set-event',
  ];

  for (const eventName of expectedEvents) {
    assert.ok(
      typeof socket.handlers[eventName] === 'function',
      `Handler for '${eventName}' should be registered`,
    );
  }
});

test('cardHandlers sell-card uses SELL_PRICES correctly', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  // 't1-zeus' is Rare (SELL_PRICES['Rare'] = 15)
  state.cardCollections['p1'] = { 't1-zeus': 5 };
  state.economy['p1'] = 0;

  assert.equal(SELL_PRICES['Commune'], 5);
  assert.equal(SELL_PRICES['Rare'], 15);
  assert.equal(SELL_PRICES['Épique'], 100);
  assert.equal(SELL_PRICES['Légendaire'], 500);
  assert.equal(SELL_PRICES['WANTED'], 1400);

  socket.handlers['sell-card']('t1-zeus');

  assert.equal(state.cardCollections['p1']['t1-zeus'], undefined);
  assert.equal(state.economy['p1'], 15);
});

test('cardHandlers sell-all-unlocked uses SELL_PRICES correctly', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  // 'edg_zdz' is Commune (5), 't1-zeus' is Rare (15)
  state.cardCollections['p1'] = { 'edg_zdz': 3, 't1-zeus': 2 };
  state.activeLineups['p1'] = {};
  state.lockedCards['p1'] = [];
  state.economy['p1'] = 10;

  socket.handlers['sell-all-unlocked']();

  assert.equal(state.cardCollections['p1']['edg_zdz'], undefined);
  assert.equal(state.cardCollections['p1']['t1-zeus'], undefined);
  assert.equal(state.economy['p1'], 10 + 5 + 15);
});
