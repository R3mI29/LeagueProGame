import assert from 'node:assert/strict';
import test from 'node:test';

import { state, resetGameState } from '../state/gameState.js';
import { registerSocketHandlers } from './socketHandlers.js';
import { SELL_PRICES, compareCardsForPack } from '../config/constants.js';

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
    'dev-open-pack',
    'dev-save-custom-card',
    'dev-delete-custom-card',
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
test('devHandlers dev-open-pack opens a wanted pack and sets lastOpenedPack', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('dev-user');

  registerSocketHandlers(io, socket);

  socket.handlers['dev-open-pack']('wanted');

  assert.ok(Array.isArray(state.lastOpenedPack['dev-user']));
  assert.equal(state.lastOpenedPack['dev-user'].length, 5);
  assert.ok(Array.isArray(state.pendingPackResults['dev-user']));
  assert.equal(state.pendingPackResults['dev-user'].length, 5);

  // Closing the pack should claim the cards
  socket.handlers['close-pack']();
  assert.equal(state.lastOpenedPack['dev-user'].length, 0);
  assert.equal(state.pendingPackResults['dev-user'], undefined);
  assert.ok(Object.keys(state.cardCollections['dev-user']).length > 0);
});

test('devHandlers dev-save-custom-card rejects duplicate ID and tracks createdCardsThisGame', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('dev-user');

  registerSocketHandlers(io, socket);

  // 1. Rejects missing ID
  let callbackResult = null;
  socket.handlers['dev-save-custom-card'](
    { card: { baseName: 'TestPlayer', id: '' } },
    (res) => { callbackResult = res; }
  );
  assert.equal(callbackResult.ok, false);
  assert.match(callbackResult.error, /manquant/i);

  // 2. Rejects existing ID in CARD_POOL (e.g. edg_zdz)
  socket.handlers['dev-save-custom-card'](
    { card: { baseName: 'Fake zdz', id: 'edg_zdz' } },
    (res) => { callbackResult = res; }
  );
  assert.equal(callbackResult.ok, false);
  assert.match(callbackResult.error, /déjà attribué/i);

  // 3. resetGameState resets createdCardsThisGame
  state.createdCardsThisGame = [{ id: 'some_card' }];
  resetGameState();
  assert.deepEqual(state.createdCardsThisGame, []);
});

test('compareCardsForPack sorts lowest rarity first, highest rarity last, then by score', () => {
  const cards = [
    { id: 'w89', rarity: 'WANTED', rating: 89 },
    { id: 'l91', rarity: 'Légendaire', rating: 91 },
    { id: 'c65', rarity: 'Commune', rating: 65 },
    { id: 'c70', rarity: 'Commune', rating: 70 },
    { id: 'r80', rarity: 'Rare', rating: 80 },
    { id: 'w99', rarity: 'WANTED', rating: 99 },
    { id: 'e84', rarity: 'Épique', rating: 84 },
  ];

  cards.sort(compareCardsForPack);

  const ids = cards.map(c => c.id);
  // Expected order: Commune 65, Commune 70, Rare 80, Épique 84, Légendaire 91, WANTED 89, WANTED 99
  assert.deepEqual(ids, ['c65', 'c70', 'r80', 'e84', 'l91', 'w89', 'w99']);
  
  // Specific user check: WANTED 89 arrives AFTER Légendaire 91
  const wantedIndex = ids.indexOf('w89');
  const legIndex = ids.indexOf('l91');
  assert.ok(wantedIndex > legIndex, 'WANTED card must arrive after Legendary card regardless of rating');
});
