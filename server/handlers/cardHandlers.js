import { state as defaultState } from '../state/gameState.js';
import { ORDERED_ROLES } from '../../src/constants/roles.js';
import { PACK_TYPES, openPack, openStarterPack, getCardById } from '../services/cardService.js';
import { compareCardsForPack } from '../config/constants.js';
import { DUPLICATE_SALVAGE, TRADE_UP_TIERS } from '../../src/constants/packConfig.js';
import { SPONSOR_CONTRACTS, getOrRefreshSponsorOfferings, openSkinPack } from '../../src/constants/sponsorContracts.js';
import { CARD_POOL, getCardTeamTags } from '../../src/constants/cardPlayers.js';
import { isBotCheck } from '../services/playerService.js';
import { startCardTournament } from '../services/tournamentService.js';
import { getTeamCollectionCards, calculateTeamDifficulty, COLLECTION_INSERT_COSTS, getTeamMilestones, COLLECTION_GLOBAL_MILESTONES, getMilestoneProgress } from '../../src/constants/collectionConfig.js';

function checkSponsorAlbumContract(state, id) {
  if (!state.activeContracts?.[id]) return;
  const active = state.activeContracts[id];
  if (active.type === 'album_insert_legendary' || active.type === 'album_insert_epic') {
    const album = state.collectionAlbum?.[id] || {};
    const rarities = active.type === 'album_insert_legendary' ? ['Légendaire', 'WANTED'] : ['Épique', 'Légendaire', 'WANTED'];
    const count = Object.keys(album).filter(cardId => {
      const c = getCardById(cardId);
      return c && rarities.includes(c.rarity);
    }).length;

    if (count >= (active.targetCount || 2)) {
      state.economy[id] = (state.economy[id] || 0) + (active.reward?.credits || 0);
      if (active.reward?.bonusPack) {
        if (!state.bonusPacks) state.bonusPacks = {};
        if (!state.bonusPacks[id]) state.bonusPacks[id] = {};
        state.bonusPacks[id][active.reward.bonusPack] = (state.bonusPacks[id][active.reward.bonusPack] || 0) + 1;
      }
      if (!state.completedContracts) state.completedContracts = {};
      if (!state.completedContracts[id]) state.completedContracts[id] = [];
      state.completedContracts[id].push(active.id);
      delete state.activeContracts[id];
      getOrRefreshSponsorOfferings(state, id, true);
    }
  }
}

export function registerCardHandlers(io, socket, {
  state = defaultState,
} = {}) {
  socket.on('buy-pack', (packTypeId = 'standard') => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;
    
    if (!state.economy) state.economy = {};
    if (state.economy[id] === undefined) state.economy[id] = 0;

    const isStarter = !state.starterPackClaimed[id];
    const packConfig = PACK_TYPES[packTypeId] || PACK_TYPES.standard;
    const PACK_PRICE = packConfig.price;

    if (!isStarter) {
      if (state.economy[id] < PACK_PRICE) return; 
      state.economy[id] -= PACK_PRICE;
    }

    const cards = isStarter ? openStarterPack() : openPack(packTypeId);
    cards.sort(compareCardsForPack);

    const openedCardsWithContracts = [];
    cards.forEach(c => {
      const lifetimeChance = isStarter ? 1 : (packConfig.lifetimeChance ?? 0.01);
      // Probabilité équivalente entre 1 et 9 ans (À VIE très peu probable : 1%)
      let contractToAdd = isStarter ? 'LIFETIME' : (Math.random() < lifetimeChance ? 'LIFETIME' : Math.floor(Math.random() * 9) + 1);
      openedCardsWithContracts.push({ id: c.id, contractAdded: contractToAdd });
    });

    state.starterPackClaimed[id] = true;
    if (!state.pendingPackResults) state.pendingPackResults = {};
    state.pendingPackResults[id] = openedCardsWithContracts;
    state.lastOpenedPack[id] = openedCardsWithContracts;
    io.emit('draft-update', state);
  });

  socket.on('open-bonus-pack', (packType) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    if (!state.bonusPacks || !state.bonusPacks[id] || !state.bonusPacks[id][packType] || state.bonusPacks[id][packType] <= 0) {
      return;
    }

    state.bonusPacks[id][packType] -= 1;
    if (state.bonusPacks[id][packType] <= 0) {
      delete state.bonusPacks[id][packType];
    }

    if (packType === 'skin_pack') {
      const result = openSkinPack(state, id);
      socket.emit('skin-pack-opened', {
        skinId: result.skinId || null,
        compensation: Boolean(result.compensation),
        credits: result.credits || 0,
        rarity: result.rarity,
      });
      io.emit('draft-update', state);
      return;
    }

    if (packType === 'starter') {
      const cards = openStarterPack();
      cards.sort(compareCardsForPack);
      const openedCardsWithContracts = cards.map(c => ({ id: c.id, contractAdded: 'LIFETIME' }));
      if (!state.pendingPackResults) state.pendingPackResults = {};
      state.pendingPackResults[id] = openedCardsWithContracts;
      state.lastOpenedPack[id] = openedCardsWithContracts;
      io.emit('draft-update', state);
      return;
    }

    const packConfig = PACK_TYPES[packType] || PACK_TYPES.standard;
    const cards = openPack(packType);
    cards.sort(compareCardsForPack);

    const openedCardsWithContracts = [];
    cards.forEach(c => {
      const lifetimeChance = packConfig.lifetimeChance ?? 0.01;
      const contractToAdd = Math.random() < lifetimeChance ? 'LIFETIME' : Math.floor(Math.random() * 9) + 1;
      openedCardsWithContracts.push({ id: c.id, contractAdded: contractToAdd });
    });

    if (!state.pendingPackResults) state.pendingPackResults = {};
    state.pendingPackResults[id] = openedCardsWithContracts;
    state.lastOpenedPack[id] = openedCardsWithContracts;
    io.emit('draft-update', state);
  });

  socket.on('close-pack', () => {
    const id = socket.id;
    if (state.pendingPackResults && state.pendingPackResults[id]) {
      if (!state.cardCollections[id]) state.cardCollections[id] = {};
      let totalDuplicateSalvage = 0;

      state.pendingPackResults[id].forEach(item => {
        const cardId = item.id;
        const contractToAdd = item.contractAdded;
        const currentContract = state.cardCollections[id][cardId];

        const cardObj = getCardById(cardId);
        const rarity = cardObj?.rarity || 'Commune';

        // Si la carte est déjà possédée À VIE :
        // Les années de contrat vont directement remplir la jauge de Trade-Up !
        if (currentContract === 'LIFETIME') {
          const yearsToAdd = typeof contractToAdd === 'number' ? contractToAdd : 5;
          if (!state.tradeUpBank) state.tradeUpBank = {};
          if (!state.tradeUpBank[id]) state.tradeUpBank[id] = { Commune: 0, Rare: 0, 'Épique': 0, 'Légendaire': 0 };
          state.tradeUpBank[id][rarity] = (state.tradeUpBank[id][rarity] || 0) + yearsToAdd;
        } else if (contractToAdd === 'LIFETIME') {
          state.cardCollections[id][cardId] = 'LIFETIME';
        } else {
          state.cardCollections[id][cardId] = (currentContract || 0) + contractToAdd;
        }

        // Auto-rangement dans la collection permanente (sans coût de contrat)
        if (!state.collectionAlbum) state.collectionAlbum = {};
        if (!state.collectionAlbum[id]) state.collectionAlbum[id] = {};
        state.collectionAlbum[id][cardId] = true;
      });

      checkSponsorAlbumContract(state, id);

      if (totalDuplicateSalvage > 0) {
        if (!state.economy[id]) state.economy[id] = 0;
        state.economy[id] += totalDuplicateSalvage;
        if (!state.lastDuplicateSalvage) state.lastDuplicateSalvage = {};
        state.lastDuplicateSalvage[id] = totalDuplicateSalvage;
      } else {
        if (state.lastDuplicateSalvage && state.lastDuplicateSalvage[id]) {
          delete state.lastDuplicateSalvage[id];
        }
      }

      delete state.pendingPackResults[id];
    }
    if (state.lastOpenedPack && state.lastOpenedPack[id]) state.lastOpenedPack[id] = [];
    io.emit('draft-update', state);
  });

  socket.on('toggle-lock-card', (cardId) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    
    if (!state.lockedCards) state.lockedCards = {};
    if (!state.lockedCards[id]) state.lockedCards[id] = [];

    const locked = state.lockedCards[id];
    if (locked.includes(cardId)) {
      state.lockedCards[id] = locked.filter(cId => cId !== cardId);
    } else {
      state.lockedCards[id].push(cardId);
    }
    
    io.emit('draft-update', state);
  });

  socket.on('set-lineup-card', ({ role, cardId }) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!ORDERED_ROLES.includes(role)) return;
    const collection = state.cardCollections[id];
    const contract = collection?.[cardId];
    if (contract === undefined || contract === 0) return; 
    
    const card = getCardById(cardId);
    if (!card || card.role !== role) return;

    if (!state.activeLineups[id]) state.activeLineups[id] = {};
    state.activeLineups[id][role] = cardId;
    io.emit('draft-update', state);
  });

  socket.on('toggle-lineup-ready', () => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    const lineup = state.activeLineups[id] || {};
    const complete = ORDERED_ROLES.every(role => lineup[role]);

    if (!state.readyPlayers.includes(id)) {
      if (!complete) return; 
      state.readyPlayers.push(id);
    } else {
      state.readyPlayers = state.readyPlayers.filter(x => x !== id);
    }

    const humanCount = state.participants.filter(p => !isBotCheck(p)).length;
    if (state.readyPlayers.length === humanCount && humanCount > 0) startCardTournament(io);
    io.emit('draft-update', state);
  });

    socket.on('claim-collection-reward', (payload, legacyPercent) => {
    const id = socket.id;
    let teamTag = null;
    let percent = 100;

    if (typeof payload === 'string') {
      teamTag = payload;
      if (typeof legacyPercent === 'number') percent = legacyPercent;
    } else if (payload && typeof payload === 'object') {
      teamTag = payload.teamTag;
      percent = payload.percent || 100;
    }

    if (!teamTag) return;
    if (!state.participants.some(p => p.id === id)) return;

    // Seule la complétion d'équipe à 100% est récompensée
    if (percent !== 100) {
      socket.emit('collection-reward-error', { message: 'Seule la complétion complète de l\'équipe donne droit à la prime.' });
      return;
    }

    if (!state.collectionRewardsClaimed) state.collectionRewardsClaimed = {};
    if (!state.collectionRewardsClaimed[id]) state.collectionRewardsClaimed[id] = {};

    // Déjà réclamé ?
    if (state.collectionRewardsClaimed[id][teamTag] || state.collectionRewardsClaimed[id][`${teamTag}_100`]) {
      socket.emit('collection-reward-error', { message: 'La prime de cette équipe a déjà été réclamée !' });
      return;
    }

    const teamCards = getTeamCollectionCards(teamTag);
    if (!teamCards || teamCards.length === 0) return;

    const album = state.collectionAlbum?.[id] || {};
    const collection = state.cardCollections?.[id] || {};
    const ownedCount = teamCards.filter(card => album[card.id] || (collection[card.id] !== undefined && collection[card.id] !== 0)).length;

    if (ownedCount < teamCards.length) {
      socket.emit('collection-reward-error', { 
        message: `Toutes les cartes de l'équipe ne sont pas encore réunies (${ownedCount}/${teamCards.length}) !` 
      });
      return;
    }

    const difficulty = calculateTeamDifficulty(teamCards);
    const rewardAmount = difficulty.rewardCredits || 75;

    if (!state.economy) state.economy = {};
    if (state.economy[id] === undefined) state.economy[id] = 0;
    state.economy[id] += rewardAmount;

    state.collectionRewardsClaimed[id][teamTag] = {
      claimedAt: Date.now(),
      amount: rewardAmount,
      percent: 100,
      tier: difficulty.tier,
    };

    io.emit('draft-update', state);
    socket.emit('collection-reward-claimed', {
      teamTag,
      percent: 100,
      rewardAmount,
      difficultyTier: difficulty.tier,
      claimKey: teamTag
    });
  });

  socket.on('claim-collection-milestone', () => {
    socket.emit('collection-milestone-error', { message: 'Les missions de collection ont été retirées.' });
  });

  const autoEnterSecretCards = (userId) => {
    const collection = state.cardCollections?.[userId] || {};
    if (!state.collectionAlbum) state.collectionAlbum = {};
    if (!state.collectionAlbum[userId]) state.collectionAlbum[userId] = {};

    Object.keys(collection).forEach(cardId => {
      const contract = collection[cardId];
      if (contract !== undefined && contract !== 0) {
        state.collectionAlbum[userId][cardId] = true;
      }
    });
  };

  socket.on('enter-card-collection', (cardId) => {
    const id = socket.id;
    if (!cardId) return;
    if (!state.participants.some(p => p.id === id)) return;

    if (!state.collectionAlbum) state.collectionAlbum = {};
    if (!state.collectionAlbum[id]) state.collectionAlbum[id] = {};

    state.collectionAlbum[id][cardId] = true;
    checkSponsorAlbumContract(state, id);

    const card = getCardById(cardId);
    io.emit('draft-update', state);
    socket.emit('card-entered-collection', { cardId, teams: getCardTeamTags(card) });
  });

  socket.on('enter-all-cards-collection', (teamTag) => {
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    const collection = state.cardCollections?.[id] || {};
    if (!state.collectionAlbum) state.collectionAlbum = {};
    if (!state.collectionAlbum[id]) state.collectionAlbum[id] = {};

    const targetCards = teamTag ? getTeamCollectionCards(teamTag) : Object.keys(collection).map(cardId => getCardById(cardId)).filter(Boolean);
    let insertedCount = 0;

    targetCards.forEach(c => {
      if (c && !state.collectionAlbum[id][c.id]) {
        state.collectionAlbum[id][c.id] = true;
        insertedCount++;
      }
    });

    if (insertedCount > 0) {
      checkSponsorAlbumContract(state, id);
      io.emit('draft-update', state);
      socket.emit('cards-batch-entered', { count: insertedCount, teamTag });
    }
  });


  // --- TRADE-UP (CONTRAT D'ÉCHANGE) ---
  // Dépôt direct de cartes dans la jauge de Trade-Up (même si la barre n'est pas remplie)
  socket.on('deposit-trade-up', ({ rarity, cardAllocations = {} }) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    if (!['Commune', 'Rare', 'Épique', 'Légendaire'].includes(rarity)) return;

    const collection = state.cardCollections?.[id] || {};
    const lineup = state.activeLineups?.[id] || {};

    let totalToDeposit = 0;
    const validDeductions = [];

    for (const [cardId, years] of Object.entries(cardAllocations)) {
      const allocated = Number(years) || 0;
      if (allocated <= 0) continue;

      const currentContract = collection[cardId];
      if (typeof currentContract !== 'number' || currentContract < allocated) continue;

      // Carte titulaire protégée
      if (Object.values(lineup).includes(cardId)) continue;

      const cardObj = getCardById(cardId);
      if (!cardObj || cardObj.rarity !== rarity) continue;

      totalToDeposit += allocated;
      validDeductions.push({ cardId, allocated });
    }

    if (totalToDeposit <= 0) return;

    // Déduction des cartes de la collection
    validDeductions.forEach(({ cardId, allocated }) => {
      const remaining = collection[cardId] - allocated;
      if (remaining <= 0) {
        delete collection[cardId];
      } else {
        collection[cardId] = remaining;
      }
    });

    // Ajout à la jauge de Trade-Up
    if (!state.tradeUpBank) state.tradeUpBank = {};
    if (!state.tradeUpBank[id]) state.tradeUpBank[id] = { Commune: 0, Rare: 0, 'Épique': 0, 'Légendaire': 0 };
    state.tradeUpBank[id][rarity] = (state.tradeUpBank[id][rarity] || 0) + totalToDeposit;

    io.emit('draft-update', state);
    socket.emit('trade-up-deposited', {
      rarity,
      depositedYears: totalToDeposit,
      totalBank: state.tradeUpBank[id][rarity],
    });
  });

  socket.on('trade-up', ({ tierId, cardAllocations = {} }) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    const tier = TRADE_UP_TIERS.find(t => t.id === tierId);
    if (!tier) return;

    const collection = state.cardCollections?.[id] || {};
    const lineup = state.activeLineups?.[id] || {};

    // Interdiction d'échanger si des cartes sont en train d'être mises :
    // L'utilisateur doit obligatoirement avoir cliqué sur "Ajouter à la jauge" avant.
    const hasStagedCards = Object.values(cardAllocations).some(y => Number(y) > 0);
    if (hasStagedCards) {
      socket.emit('trade-up-error', { message: 'Déposez d\'abord vos cartes dans la jauge avant d\'effectuer l\'échange.' });
      return;
    }

    if (!state.tradeUpBank) state.tradeUpBank = {};
    if (!state.tradeUpBank[id]) state.tradeUpBank[id] = { Commune: 0, Rare: 0, 'Épique': 0, 'Légendaire': 0 };

    const bankYears = state.tradeUpBank[id][tier.fromRarity] || 0;
    if (bankYears < tier.requiredYears) {
      socket.emit('trade-up-error', { message: `Jauge insuffisante : ${bankYears}/${tier.requiredYears} ans déposés.` });
      return;
    }

    // Déduction des années requises directement depuis la jauge
    state.tradeUpBank[id][tier.fromRarity] -= tier.requiredYears;

    // Tirage de la carte de rareté supérieure
    const pool = CARD_POOL.filter(c => c.rarity === tier.toRarity);
    if (pool.length === 0) return;
    const rewardCard = pool[Math.floor(Math.random() * pool.length)];

    const currentRewardContract = collection[rewardCard.id];
    if (currentRewardContract === 'LIFETIME') {
      state.tradeUpBank[id][tier.toRarity] = (state.tradeUpBank[id][tier.toRarity] || 0) + tier.rewardYears;
    } else {
      collection[rewardCard.id] = (currentRewardContract || 0) + tier.rewardYears;
    }

    // Auto-enregistrement dans la collection permanente
    if (!state.collectionAlbum) state.collectionAlbum = {};
    if (!state.collectionAlbum[id]) state.collectionAlbum[id] = {};
    state.collectionAlbum[id][rewardCard.id] = true;
    checkSponsorAlbumContract(state, id);

    // Déclenchement de l'animation d'ouverture pour Épique+
    if (tier.animate) {
      if (!state.lastOpenedPack) state.lastOpenedPack = {};
      state.lastOpenedPack[id] = [{ id: rewardCard.id, contractAdded: tier.rewardYears }];
    }

    io.emit('draft-update', state);
    socket.emit('trade-up-success', {
      rewardCardId: rewardCard.id,
      rewardRarity: tier.toRarity,
      rewardYears: tier.rewardYears,
    });
  });

  // --- CONTRATS DE SPONSORING ---
  socket.on('sign-sponsor-contract', (contractId) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;

    if (!state.activeContracts) state.activeContracts = {};
    if (state.activeContracts[id]) {
      socket.emit('sponsor-error', { message: 'Vous avez déjà un contrat de sponsoring actif.' });
      return;
    }

    const contractDef = SPONSOR_CONTRACTS.find(c => c.id === contractId);
    if (!contractDef) return;

    state.activeContracts[id] = {
      ...contractDef,
      remainingEvents: contractDef.deadlineEvents,
      signedAtEvent: state.eventIndex || 0,
      startedAt: Date.now(),
    };

    io.emit('draft-update', state);
    socket.emit('sponsor-signed', { contractId });
  });

  socket.on('get-sponsor-offerings', () => {
    const id = socket.id;
    getOrRefreshSponsorOfferings(state, id);
    io.emit('draft-update', state);
  });

  socket.on('abandon-sponsor-contract', () => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    const active = state.activeContracts?.[id];
    if (!active) return;

    const penalty = active.malus || 400;
    state.economy[id] = Math.max(0, (state.economy[id] || 0) - penalty);
    delete state.activeContracts[id];
    getOrRefreshSponsorOfferings(state, id, true);

    io.emit('draft-update', state);
    socket.emit('sponsor-abandoned', { penalty });
  });

}