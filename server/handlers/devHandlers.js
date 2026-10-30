import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');
import { CARD_POOL } from '../../src/constants/cardPlayers.js';
import { state as defaultState } from '../state/gameState.js';
import { EVENTS } from '../../src/constants/seasonConfig.js';
import { SKINS, SKIN_BY_ID, grantSkin, revokeSkin } from '../../src/constants/teamSkins.js';
import { openPack } from '../services/cardService.js';

export function registerDevHandlers(io, socket, {
  state = defaultState,
} = {}) {
  socket.on('dev-skin', ({ action, skinId } = {}) => {
    const valid = SKIN_BY_ID[skinId];

    if (action === 'unlock' && valid) grantSkin(state, socket.id, skinId);
    else if (action === 'lock' && valid) revokeSkin(state, socket.id, skinId);
    else if (action === 'unlock-all') SKINS.forEach(s => grantSkin(state, socket.id, s.id));
    else if (action === 'lock-all') SKINS.forEach(s => revokeSkin(state, socket.id, s.id));
    else return;

    io.emit('draft-update', state);
  });

  socket.on('dev-give-card', (cardId) => {
    const id = socket.id;
    if (!state.cardCollections[id]) state.cardCollections[id] = {};
    let currentContract = state.cardCollections[id][cardId] || 0;
    if (currentContract !== 'LIFETIME') state.cardCollections[id][cardId] = currentContract + 5; 
    io.emit('draft-update', state);
  });

  socket.on('dev-give-money', (amount) => {
    const id = socket.id;
    if (!state.economy) state.economy = {};
    if (state.economy[id] === undefined) state.economy[id] = 0;
    state.economy[id] += amount;
    io.emit('draft-update', state);
  });

  socket.on('dev-set-event', (eventIndex) => {
    if (eventIndex >= 0 && eventIndex < EVENTS.length) {
      state.eventIndex = eventIndex;
      io.emit('draft-update', state);
    }
  });

  socket.on('dev-add-custom-card', (card) => {
    if (card && card.id && !CARD_POOL.find(c => c.id === card.id)) {
      CARD_POOL.push(card);
    }
  });

  socket.on('dev-open-pack', (packTypeId = 'wanted') => {
    const id = socket.id;
    const cards = openPack(packTypeId);
    if (!cards || cards.length === 0) return;

    cards.sort((a, b) => (a.overall || a.rating || 0) - (b.overall || b.rating || 0));

    const openedCardsWithContracts = [];
    cards.forEach(c => {
      const lifetimeChance = packTypeId === 'wanted' ? 0.10 : 0.02;
      const contractToAdd = Math.random() < lifetimeChance ? 'LIFETIME' : Math.floor(Math.random() * 9) + 1;
      openedCardsWithContracts.push({ id: c.id, contractAdded: contractToAdd });
    });

    if (!state.pendingPackResults) state.pendingPackResults = {};
    if (!state.lastOpenedPack) state.lastOpenedPack = {};

    state.pendingPackResults[id] = openedCardsWithContracts;
    state.lastOpenedPack[id] = openedCardsWithContracts;

    io.emit('draft-update', state);
  });

  socket.on('dev-save-custom-card', ({ card, imageData, imageFolder = 'cardsImg/custom', imageFileName }, callback) => {
    try {
      if (!card || !card.baseName) {
        if (typeof callback === 'function') callback({ ok: false, error: 'Nom de joueur manquant' });
        return;
      }

      // 1. Sauvegarde physique du fichier image s'il a été téléversé en base64
      if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image/')) {
        const matches = imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase();
          const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
          const buffer = Buffer.from(matches[2], 'base64');

          const cleanFolder = (imageFolder || 'cardsImg/custom')
            .replace(/^[\\/]+/, '')
            .replace(/^public[\\/]/, '')
            .replace(/\\/g, '/');

          const absFolder = path.join(PROJECT_ROOT, 'public', cleanFolder);
          if (!fs.existsSync(absFolder)) {
            fs.mkdirSync(absFolder, { recursive: true });
          }

          let finalName = (imageFileName || '').trim();
          if (!finalName) {
            const tagPrefix = card.teamTag ? `${card.teamTag}_` : '';
            finalName = `${tagPrefix}${card.baseName.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
          } else if (!path.extname(finalName)) {
            finalName = `${finalName}.${ext}`;
          }

          const absFilePath = path.join(absFolder, finalName);
          fs.writeFileSync(absFilePath, buffer);
          card.image = `/${cleanFolder}/${finalName}`.replace(/\\/g, '/');
        }
      }

      // 2. Structurer l'objet carte
      const cardToSave = {
        id: card.id || `custom-${card.baseName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        baseName: card.baseName,
        variant: card.variant || `${card.teamTag || ''} ${card.baseName}`.trim(),
        role: card.role || 'Mid',
        rating: Number(card.rating) || 75,
        rarity: card.rarity || 'Commune',
        image: card.image || '',
        nationality: (card.nationality || 'kr').toUpperCase(),
        teamTag: (card.teamTag || '').toUpperCase(),
        league: card.league || 'LCK',
      };
      if (card.themeColor) cardToSave.themeColor = card.themeColor;
      if (card.video) cardToSave.video = card.video;
      cardToSave.isCustom = true;

      // 3. Persistance physique dans src/constants/cardPlayers.js
      const cardPlayersPath = path.join(PROJECT_ROOT, 'src/constants/cardPlayers.js');
      let fileContent = fs.readFileSync(cardPlayersPath, 'utf-8');

      const idStr = `"id": "${cardToSave.id}"`;
      if (fileContent.includes(idStr)) {
        const idx = fileContent.indexOf(idStr);
        const objStart = fileContent.lastIndexOf('{', idx);
        const objEnd = fileContent.indexOf('}', idx) + 1;
        const formatted = JSON.stringify(cardToSave, null, 2).replace(/\n/g, '\n  ');
        fileContent = fileContent.slice(0, objStart) + formatted + fileContent.slice(objEnd);
      } else {
        const lastBracket = fileContent.lastIndexOf('];');
        if (lastBracket === -1) throw new Error("Balise '];' introuvable dans cardPlayers.js");
        const formatted = '  ' + JSON.stringify(cardToSave, null, 2).replace(/\n/g, '\n  ') + ',\n\n';
        fileContent = fileContent.slice(0, lastBracket) + formatted + fileContent.slice(lastBracket);
      }

      fs.writeFileSync(cardPlayersPath, fileContent, 'utf-8');

      // 4. Mise à jour de CARD_POOL en mémoire vive
      const existingIdx = CARD_POOL.findIndex(c => c.id === cardToSave.id);
      if (existingIdx !== -1) {
        CARD_POOL[existingIdx] = cardToSave;
      } else {
        CARD_POOL.push(cardToSave);
      }

      // 5. Créditer la carte au joueur en session dev
      const id = socket.id;
      if (!state.cardCollections[id]) state.cardCollections[id] = {};
      const current = state.cardCollections[id][cardToSave.id] || 0;
      if (current !== 'LIFETIME') state.cardCollections[id][cardToSave.id] = current + 5;

      io.emit('draft-update', state);
      io.emit('dev-card-saved', cardToSave);

      if (typeof callback === 'function') callback({ ok: true, card: cardToSave });
    } catch (err) {
      console.error('Erreur sauvegarde carte dev:', err);
      if (typeof callback === 'function') callback({ ok: false, error: err.message });
    }
  });

  socket.on('dev-delete-custom-card', (cardId, callback) => {
    try {
      if (!cardId) return;

      const cardPlayersPath = path.join(PROJECT_ROOT, 'src/constants/cardPlayers.js');
      let fileContent = fs.readFileSync(cardPlayersPath, 'utf-8');
      const idStr = `"id": "${cardId}"`;

      if (fileContent.includes(idStr)) {
        const idx = fileContent.indexOf(idStr);
        const objStart = fileContent.lastIndexOf('{', idx);
        let objEnd = fileContent.indexOf('}', idx) + 1;
        while (fileContent[objEnd] === ',' || fileContent[objEnd] === ' ' || fileContent[objEnd] === '\r' || fileContent[objEnd] === '\n') {
          objEnd++;
        }
        let lineStart = fileContent.lastIndexOf('\n', objStart);
        if (lineStart === -1) lineStart = 0;
        else lineStart += 1;

        fileContent = fileContent.slice(0, lineStart) + fileContent.slice(objEnd);
        fs.writeFileSync(cardPlayersPath, fileContent, 'utf-8');
      }

      const poolIdx = CARD_POOL.findIndex(c => c.id === cardId);
      if (poolIdx !== -1) {
        CARD_POOL.splice(poolIdx, 1);
      }

      io.emit('draft-update', state);
      io.emit('dev-card-deleted', cardId);
      if (typeof callback === 'function') callback({ ok: true, cardId });
    } catch (err) {
      console.error('Erreur suppression carte dev:', err);
      if (typeof callback === 'function') callback({ ok: false, error: err.message });
    }
  });

}
