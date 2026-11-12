import assert from 'node:assert/strict';
import test from 'node:test';

import { state, resetGameState } from '../state/gameState.js';
import { registerSocketHandlers } from './socketHandlers.js';
import { compareCardsForPack } from '../config/constants.js';
import { DUPLICATE_SALVAGE } from '../../src/constants/packConfig.js';
import { CARD_POOL, getCardTeamTags, getCardTeamDisplay, registerCardInPool, unregisterCardFromPool } from '../../src/constants/cardPlayers.js';
import { getTeamInfo } from '../../src/constants/teams.js';
import { computeSynergy } from '../../src/constants/synergy.js';
import { getTeamCollectionCards } from '../../src/constants/collectionConfig.js';

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

  const enterHandler = socket.handlers['enter-card-collection'];
  const claimHandler = socket.handlers['claim-collection-reward'];
  assert.ok(typeof enterHandler === 'function', 'enter handler exists');
  assert.ok(typeof claimHandler === 'function', 'claim handler exists');

  // 1. Trying to claim before owning LR cards fails
  claimHandler('LR');
  let errorEvent = socket.emitted.find(e => e.event === 'collection-reward-error');
  assert.ok(errorEvent, 'Must require owning all cards of the team first');
  assert.equal(state.economy.p1, 100);

  // 2. Give lr-baus to player (e.g. 5 contracts) and enter into album
  state.cardCollections.p1['lr-baus'] = 5;
  enterHandler('lr-baus');
  assert.equal(state.collectionAlbum.p1['lr-baus'], true);
  // Zero contracts deducted!
  assert.equal(state.cardCollections.p1['lr-baus'], 5, 'Contract years are never deducted');

  // 3. Claim LR 100% completion reward
  claimHandler('LR');
  // LR is 1 card, difficulty reward is 75 $
  assert.equal(state.economy.p1, 175); // 100 + 75
  assert.ok(state.collectionRewardsClaimed.p1.LR);
  assert.equal(state.collectionRewardsClaimed.p1.LR.amount, 75);

  // 4. If card is sold or contract expires, it stays in the album permanently!
  delete state.cardCollections.p1['lr-baus'];
  assert.equal(state.collectionAlbum.p1['lr-baus'], true, 'Card never leaves the album once entered');

  // 5. Claim again should fail
  claimHandler('LR');
  const duplicateError = socket.emitted.filter(e => e.event === 'collection-reward-error').pop();
  assert.ok(duplicateError, 'Should emit collection-reward-error on duplicate claim');
  assert.equal(state.economy.p1, 175); // no change
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
    'xun-LPL-4x': 'LIFETIME',              // Légendaire
  };
  state.collectionAlbum['p1'] = {};

  socket.handlers['sign-sponsor-contract']('secretlab_throne');
  assert.equal(state.activeContracts['p1'].id, 'secretlab_throne');

  // Insert 1st legendary card
  socket.handlers['enter-card-collection']('t1-doran-world_champion');
  assert.ok(state.activeContracts['p1'], 'Contract should still be active with 1 legendary');

  // Insert 2nd legendary card
  socket.handlers['enter-card-collection']('xun-LPL-4x');
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

test('multi-team card support: getCardTeamTags, display, synergy, and collection albums', () => {
  // 1. Tag extraction
  assert.deepEqual(getCardTeamTags({ teamTags: ['BLG', 'JDG'] }), ['BLG', 'JDG']);
  assert.deepEqual(getCardTeamTags({ teamTag: ['BLG', 'JDG'] }), ['BLG', 'JDG']);
  assert.deepEqual(getCardTeamTags({ teamTag: 'BLG & JDG' }), ['BLG', 'JDG']);
  assert.deepEqual(getCardTeamTags({ teamTag: 'BLG, JDG' }), ['BLG', 'JDG']);
  assert.deepEqual(getCardTeamTags({ teamTag: 'BLG / JDG' }), ['BLG', 'JDG']);
  assert.deepEqual(getCardTeamTags({ teamTag: 'T1' }), ['T1']);
  assert.deepEqual(getCardTeamTags(null), []);

  // 2. Display format
  assert.equal(getCardTeamDisplay({ teamTags: ['BLG', 'JDG'] }), 'BLG & JDG');
  assert.equal(getCardTeamDisplay({ teamTag: 'T1' }), 'T1');

  // 3. getTeamInfo
  const blgInfo = getTeamInfo('BLG');
  assert.equal(blgInfo.tag, 'BLG');
  assert.ok(blgInfo.logo.includes('bilibili'));

  // 4. Synergy with multi-team player
  const mockCard = {
    id: 'test-multi-player',
    baseName: 'MultiPlayer',
    role: 'Mid',
    league: 'LPL',
    teamTags: ['BLG', 'JDG'],
    rarity: 'Légendaire',
    rating: 90
  };
  registerCardInPool(mockCard);

  try {
    // When paired with BLG player (e.g. blg-xun), should trigger BLG synergy
    const blgPair = computeSynergy(['test-multi-player', 'blg-xun']);
    assert.equal(blgPair.team.key, 'BLG');
    assert.equal(blgPair.team.count, 2);

    // When paired with JDG player (e.g. jdg-kanavi), should trigger JDG synergy
    const jdgPair = computeSynergy(['test-multi-player', 'jdg-kanavi']);
    assert.equal(jdgPair.team.key, 'JDG');
    assert.equal(jdgPair.team.count, 2);

    // 5. Included in both collection albums
    const blgCards = getTeamCollectionCards('BLG');
    const jdgCards = getTeamCollectionCards('JDG');
    assert.ok(blgCards.some(c => c.id === 'test-multi-player'));
    assert.ok(jdgCards.some(c => c.id === 'test-multi-player'));
  } finally {
    unregisterCardFromPool('test-multi-player');
  }
});

test('collection team completion: full completion reward based on difficulty without intermediate or global milestones', () => {
  // 1. Rogue logo resolution
  const rogueInfo = getTeamInfo('RGE');
  assert.equal(rogueInfo.name, 'Rogue');
  assert.equal(rogueInfo.tag, 'RGE');
  assert.equal(rogueInfo.logo, '/equipes/rogue.webp');

  resetGameState();
  const io = createMockIo();
  const socket = createMockSocket('p1');
  registerSocketHandlers(io, socket);

  state.phase = 'cards';
  state.participants = [{ id: 'p1', name: 'Tester' }];
  state.cardCollections = { p1: {} };
  state.collectionAlbum = { p1: {} };
  state.economy = { p1: 100 };
  state.bonusPacks = { p1: {} };
  state.collectionRewardsClaimed = { p1: {} };
  state.collectionMilestonesClaimed = { p1: {} };

  // 2. Intermediate milestones are not allowed
  socket.handlers['claim-collection-reward']({ teamTag: 'GEN', percent: 50 });
  let rewardError = socket.emitted.filter(e => e.event === 'collection-reward-error').pop();
  assert.ok(rewardError, 'Only 100% completion can be claimed');

  // 3. Complete Gen.G team
  const genCards = getTeamCollectionCards('GEN');
  assert.ok(genCards.length >= 10, 'Gen.G should be a large team with >= 10 cards');

  // Partial team cannot claim
  for (let i = 0; i < Math.floor(genCards.length / 2); i++) {
    state.collectionAlbum.p1[genCards[i].id] = true;
  }
  socket.handlers['claim-collection-reward']({ teamTag: 'GEN', percent: 100 });
  let partialError = socket.emitted.filter(e => e.event === 'collection-reward-error').pop();
  assert.ok(partialError, 'Cannot claim 100% when only partially owned');

  // Fill up entire team
  genCards.forEach(c => {
    state.collectionAlbum.p1[c.id] = true;
  });

  const prevEconomy = state.economy.p1;
  socket.handlers['claim-collection-reward']({ teamTag: 'GEN', percent: 100 });
  assert.ok(state.economy.p1 > prevEconomy, 'Credits awarded for 100% team completion');
  // Reward is balanced (<= 1200 $ max)
  assert.ok(state.economy.p1 - prevEconomy <= 1200, 'Team completion reward is balanced to protect economy');
  assert.ok(state.collectionRewardsClaimed.p1['GEN'], 'Recorded in collectionRewardsClaimed under teamTag');

  // Duplicate claim fails
  socket.handlers['claim-collection-reward']({ teamTag: 'GEN', percent: 100 });
  const doubleClaimError = socket.emitted.filter(e => e.event === 'collection-reward-error').pop();
  assert.ok(doubleClaimError, 'Duplicate claim rejected');

  // 4. Milestone claiming gives error as missions are removed
  socket.handlers['claim-collection-milestone']('cards_20');
  const milestoneRemovedError = socket.emitted.filter(e => e.event === 'collection-milestone-error').pop();
  assert.ok(milestoneRemovedError, 'Milestones are removed');
});


