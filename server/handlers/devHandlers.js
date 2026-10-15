import { state as defaultState } from '../state/gameState.js';
import { EVENTS } from '../../src/constants/seasonConfig.js';
import { SKINS, SKIN_BY_ID, grantSkin, revokeSkin } from '../../src/constants/teamSkins.js';

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
}
