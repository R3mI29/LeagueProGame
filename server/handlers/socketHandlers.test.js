import assert from 'node:assert/strict';
import test from 'node:test';

import { state, resetGameState } from '../state/gameState.js';
import { registerSocketHandlers } from './socketHandlers.js';
import { compareCardsForPack } from '../config/constants.js';
import { DUPLICATE_SALVAGE } from '../../src/constants/packConfig.js';
import { CARD_POOL } from '../../src/constants/cardPlayers.js';

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
    'deposit-trade-up',
    'trade-up',
    'sign-sponsor-contract',
    'abandon-sponsor-contract',
    'get-sponsor-offerings',
    'claim-collection-reward',
    'enter-card-collection',
    'enter-all-cards-collection',
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
    'dev-open-guaranteed-wanted',
    'dev-give-pack',
    'dev-clear-bonus-packs',
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

test('cardHandlers close-pack sends duplicate LIFETIME contract years directly to tradeUpBank', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  // p1 already has 't1-zeus' as LIFETIME (Rare)
  state.cardCollections['p1'] = { 't1-zeus': 'LIFETIME' };
  state.economy['p1'] = 0;
  state.pendingPackResults['p1'] = [{ id: 't1-zeus', contractAdded: 3 }];

  socket.handlers['close-pack']();

  assert.equal(state.cardCollections['p1']['t1-zeus'], 'LIFETIME');
  assert.equal(state.economy['p1'], 0, 'No financial credits granted');
  assert.equal(state.tradeUpBank['p1']['Rare'], 3, 'Contract years routed to tradeUpBank');
});

test('cardHandlers buy-pack handles elite pack and economy deduction', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  state.starterPackClaimed['p1'] = true;
  state.economy['p1'] = 500;

  socket.handlers['buy-pack']('elite');

  assert.equal(state.economy['p1'], 500 - 220);
  assert.equal(state.pendingPackResults['p1'].length, 5);
});
test('devHandlers dev-give-pack deposits pack into bonusPacks without opening', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];

  // Give wanted pack
  socket.handlers['dev-give-pack']({ packType: 'wanted', count: 2 });
  assert.equal(state.bonusPacks['p1'].wanted, 2);
  assert.equal(state.lastOpenedPack['p1'], undefined);

  // Give skin pack as string shorthand
  socket.handlers['dev-give-pack']('skin_pack');
  assert.equal(state.bonusPacks['p1'].skin_pack, 1);

  // Clear bonus packs
  socket.handlers['dev-clear-bonus-packs']();
  assert.equal(state.bonusPacks['p1'], undefined);
});

test('devHandlers dev-open-guaranteed-wanted opens 5 guaranteed WANTED cards', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];

  socket.handlers['dev-open-guaranteed-wanted']();
  assert.equal(state.lastOpenedPack['p1'].length, 5);
  // Toutes les 5 cartes doivent être de rareté WANTED
  const openedCards = state.lastOpenedPack['p1'].map(item => CARD_POOL.find(c => c.id === item.id));
  assert.ok(openedCards.every(c => c && c.rarity === 'WANTED'));
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

test('cardHandlers claim-collection-reward awards credits, enters album permanently and prevents double claims', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Tester' }];
  state.cardCollections = { p1: {} };
  state.collectionAlbum = { p1: {} };
  state.economy = { p1: 100 };
  state.collectionRewardsClaimed = { p1: {} };

  // Los Ratones only has 1 card: lr-baus
  state.cardCollections.p1['lr-baus'] = 'LIFETIME';

  const enterHandler = socket.handlers['enter-card-collection'];
  const claimHandler = socket.handlers['claim-collection-reward'];
  assert.ok(typeof enterHandler === 'function', 'enter handler exists');
  assert.ok(typeof claimHandler === 'function', 'claim handler exists');

  // 1. Trying to claim before entering into album should fail
  claimHandler('LR');
  let errorEvent = socket.emitted.find(e => e.event === 'collection-reward-error');
  assert.ok(errorEvent, 'Must require entering card into album first');
  assert.equal(state.economy.p1, 100);

  // 2. Enter card into album
  enterHandler('lr-baus');
  assert.equal(state.collectionAlbum.p1['lr-baus'], true);
  // Card still remains in playable roster!
  assert.equal(state.cardCollections.p1['lr-baus'], 'LIFETIME');

  // 3. Claim LR reward
  claimHandler('LR');
  assert.equal(state.economy.p1, 200); // 100 + 100
  assert.ok(state.collectionRewardsClaimed.p1.LR);
  assert.equal(state.collectionRewardsClaimed.p1.LR.amount, 100);

  // 4. If card is sold or contract expires, it stays in the album permanently!
  delete state.cardCollections.p1['lr-baus'];
  assert.equal(state.collectionAlbum.p1['lr-baus'], true, 'Card never leaves the album once entered');

  // 5. Claim again should fail
  claimHandler('LR');
  const duplicateError = socket.emitted.filter(e => e.event === 'collection-reward-error').pop();
  assert.ok(duplicateError, 'Should emit collection-reward-error on duplicate claim');
  assert.equal(state.economy.p1, 200); // no change
});

test('cardHandlers trade-up burns contracts and awards higher rarity card', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  // Give 20 years of Rare cards (15 + 5)
  state.cardCollections['p1'] = { 't1-zeus': 15, 't1-doran': 10 };
  state.activeLineups['p1'] = {};

  // Tentative directe avec cartes en cours d'allocation : doit être rejetée
  socket.handlers['trade-up']({
    tierId: 'rare_to_epic',
    cardAllocations: { 't1-zeus': 15, 't1-doran': 5 }
  });
  const pendingError = socket.emitted.filter(e => e.event === 'trade-up-error').pop();
  assert.ok(pendingError, 'Should reject trade-up if cards are staged without deposit');

  // L'utilisateur doit d'abord déposer ses cartes dans la jauge via deposit-trade-up
  socket.handlers['deposit-trade-up']({
    rarity: 'Rare',
    cardAllocations: { 't1-zeus': 15, 't1-doran': 5 }
  });

  // t1-zeus was completely consumed (15 - 15 = 0)
  assert.equal(state.cardCollections['p1']['t1-zeus'], undefined);
  // t1-doran has 5 years left (10 - 5 = 5)
  assert.equal(state.cardCollections['p1']['t1-doran'], 5);
  // La jauge contient les 20 ans déposés
  assert.equal(state.tradeUpBank['p1']['Rare'], 20);

  // Échange effectué une fois la jauge prête (aucune carte en cours d'allocation)
  socket.handlers['trade-up']({
    tierId: 'rare_to_epic',
    cardAllocations: {}
  });

  // La jauge a été débitée
  assert.equal(state.tradeUpBank['p1']['Rare'], 0);

  // Animation triggered for Épique+
  assert.ok(Array.isArray(state.lastOpenedPack['p1']));
  assert.equal(state.lastOpenedPack['p1'].length, 1);
  assert.equal(state.lastOpenedPack['p1'][0].contractAdded, 4);
});

test('cardHandlers sign-sponsor-contract and abandon-sponsor-contract apply penalty', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  state.economy['p1'] = 800;

  socket.handlers['sign-sponsor-contract']('intel_overclock');
  assert.equal(state.activeContracts['p1'].id, 'intel_overclock');

  socket.handlers['abandon-sponsor-contract']();
  assert.equal(state.activeContracts['p1'], undefined);
  // Intel overclock malus is 350
  assert.equal(state.economy['p1'], 800 - 350);
});

test('cardHandlers album_insert_legendary completes when 2 legendary cards entered in collection', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  state.economy['p1'] = 0;
  state.cardCollections['p1'] = {
    't1-doran-world_champion': 'LIFETIME', // Légendaire
    'xun-worlds-finalist': 'LIFETIME',     // Légendaire
  };
  state.collectionAlbum['p1'] = {};

  socket.handlers['sign-sponsor-contract']('secretlab_throne');
  assert.equal(state.activeContracts['p1'].id, 'secretlab_throne');

  // Insert 1st legendary card
  socket.handlers['enter-card-collection']('t1-doran-world_champion');
  assert.ok(state.activeContracts['p1'], 'Contract should still be active with 1 legendary');

  // Insert 2nd legendary card
  socket.handlers['enter-card-collection']('xun-worlds-finalist');
  assert.equal(state.activeContracts['p1'], undefined, 'Contract should be completed');
  assert.equal(state.economy['p1'], 850, 'Reward credits awarded');
  assert.equal(state.bonusPacks['p1']['skin_pack'], 1, 'Skin booster pack awarded');
  assert.ok(state.completedContracts['p1'].includes('secretlab_throne'));
});

test('cardHandlers open-bonus-pack decrements count and awards skin or cards', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  state.bonusPacks['p1'] = { skin_pack: 2, wanted: 1 };

  // Ouvrir un booster de skin
  let openedEvent = null;
  socket.emit = (event, data) => {
    if (event === 'skin-pack-opened') openedEvent = data;
  };

  socket.handlers['open-bonus-pack']('skin_pack');
  assert.equal(state.bonusPacks['p1'].skin_pack, 1);
  assert.ok(openedEvent !== null);
  assert.ok(openedEvent.skinId !== null || openedEvent.compensation === true);

  // Ouvrir un booster wanted bonus
  socket.handlers['open-bonus-pack']('wanted');
  assert.equal(state.bonusPacks['p1'].wanted, undefined);
  assert.ok(state.lastOpenedPack['p1'].length > 0);
});

test('openSkinPack awards duplicate compensation if skin is already owned', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  state.economy['p1'] = 0;
  // Player already owns all non-quest skins
  state.teamSkins['p1'] = {
    owned: ['default', 'gold-circuit', 'glacier', 'neon-protocol', 'silver-fluid'],
    equipped: 'default'
  };
  state.bonusPacks['p1'] = { skin_pack: 1 };

  let openedEvent = null;
  socket.emit = (event, data) => {
    if (event === 'skin-pack-opened') openedEvent = data;
  };

  socket.handlers['open-bonus-pack']('skin_pack');
  assert.equal(openedEvent.compensation, true);
  assert.ok([100, 200, 500].includes(openedEvent.credits));
  assert.equal(state.economy['p1'], openedEvent.credits);
});

test('cardHandlers deposit-trade-up banks cards into gauge even if bar is not filled', () => {
  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');

  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Team1', isBot: false }];
  state.cardCollections['p1'] = { 't1-doran': 6 };
  state.activeLineups['p1'] = {};

  // Deposit 4 years of Rare card into Trade-Up bank
  socket.handlers['deposit-trade-up']({
    rarity: 'Rare',
    cardAllocations: { 't1-doran': 4 }
  });

  assert.equal(state.cardCollections['p1']['t1-doran'], 2);
  assert.equal(state.tradeUpBank['p1']['Rare'], 4);
});
