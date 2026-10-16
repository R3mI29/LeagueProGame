import { state as defaultState, prepareNewGame, resetGameState } from '../state/gameState.js';
import { isBotCheck } from '../services/playerService.js';
import {
  assignHost,
  createPlayerSession,
  ensureConnectedHost,
  getConnectedPlayers,
  invalidatePlayerSession,
  reconnectPlayer,
  transferPlayerIdentity,
} from '../services/playerSessionService.js';
import { startAllBotMatchesInCurrentRound } from '../services/matchService.js';
import { SKIN_BY_ID, canUseSkin } from '../../src/constants/teamSkins.js';

export function registerLobbyHandlers(io, socket, {
  state = defaultState,
  getCurrentPlayer = () => state.participants.find(p => p.id === socket.id),
  isCurrentPlayerHost = () => Boolean(getCurrentPlayer()?.isHost),
} = {}) {
  socket.on('reconnect-player', (token, acknowledge = () => {}) => {
    const hadConnectedPlayers = getConnectedPlayers(state).length > 0;
    const result = reconnectPlayer(state, token, socket.id);
    if (result.ok) {
      if (!hadConnectedPlayers) assignHost(state, socket.id);
      else ensureConnectedHost(state, socket.id);
    }
    acknowledge(result);
    if (result.ok) io.emit('draft-update', state);
  });

  socket.on('takeover-bot', (botId, newName, newTag, newLogo, acknowledge = () => {}) => {
    const bot = state.participants.find(p => p.id === botId);
    if (!bot || !isBotCheck(bot)) return acknowledge({ ok: false, error: "Cette équipe n'est pas disponible." });
    if (state.participants.some(participant => participant.id === socket.id)) {
      return acknowledge({ ok: false, error: "Vous contrôlez déjà une équipe." });
    }

    const oldId = bot.id;
    const newId = socket.id;

    transferPlayerIdentity(state, oldId, newId);
    bot.id = newId;
    bot.name = typeof newName === 'string' && newName.trim() ? newName.trim() : bot.name;
    bot.tag = typeof newTag === 'string' && newTag.trim() ? newTag.trim().toUpperCase() : bot.tag;
    bot.logo = typeof newLogo === 'string' && newLogo ? newLogo : bot.logo;
    bot.isBot = false;
    bot.isDisconnected = false;

    const playerToken = createPlayerSession(newId);
    ensureConnectedHost(state, newId);
    acknowledge({ ok: true, playerToken });
    io.emit('draft-update', state);
  });

  socket.on('equip-skin', (skinId) => {
    if (!SKIN_BY_ID[skinId] || !canUseSkin(state, socket.id, skinId)) return;
    if (!state.teamSkins) state.teamSkins = {};
    state.teamSkins[socket.id] = { ...(state.teamSkins[socket.id] || {}), equipped: skinId };
    io.emit('draft-update', state);
  });

  socket.on('join-lobby', (name, tag, logo, acknowledge = () => {}) => {
    if (state.phase !== 'lobby') return acknowledge({ ok: false, error: "La saison a déjà commencé." });
    if (state.participants.length >= 16) return acknowledge({ ok: false, error: "Le lobby est complet." });
    if (typeof name !== 'string' || typeof tag !== 'string' || typeof logo !== 'string') {
      return acknowledge({ ok: false, error: "Les informations de l'équipe sont invalides." });
    }
    const cleanName = name.trim();
    const cleanTag = tag.trim().toUpperCase();
    if (!cleanName || cleanName.length > 40) return acknowledge({ ok: false, error: "Le nom doit contenir entre 1 et 40 caractères." });
    if (cleanTag.length < 2 || cleanTag.length > 4) return acknowledge({ ok: false, error: "Le TAG doit contenir entre 2 et 4 caractères." });
    if (!/^\/?equipes\/[a-zA-Z0-9._-]+$/.test(logo)) {
      return acknowledge({ ok: false, error: "Cette identité visuelle n'existe pas." });
    }
    if (state.participants.some(p => p.logo === logo && p.id !== socket.id)) {
      return acknowledge({ ok: false, error: "Cette équipe est déjà utilisée." });
    }

    let playerToken = null;
    if (!state.participants.find(p => p.id === socket.id)) {
      state.participants.push({
        id: socket.id,
        name: cleanName,
        tag: cleanTag,
        logo: logo,
        roster: [],
        isHost: false,
        isDisconnected: false,
      });
      playerToken = createPlayerSession(socket.id);
      ensureConnectedHost(state, socket.id);
      io.emit('draft-update', state);
    }
    acknowledge({ ok: true, playerToken });
  });

  socket.on('resume-game', (acknowledge = () => {}) => {
    if (!isCurrentPlayerHost()) return acknowledge({ ok: false, error: "Seul l'hôte peut reprendre la partie." });
    state.awaitingResumeDecision = false;
    io.emit('draft-update', state);
    acknowledge({ ok: true });
  });

  socket.on('leave-game', (acknowledge = () => {}) => {
    const player = getCurrentPlayer();
    if (!player) return acknowledge({ ok: false, error: "Vous ne contrôlez aucune équipe." });

    invalidatePlayerSession(player.id);
    player.isHost = false;

    if (state.phase === 'lobby') {
      state.participants = state.participants.filter(participant => participant.id !== player.id);
      [
        state.cardCollections,
        state.activeLineups,
        state.economy,
        state.cardStats,
        state.lastOpenedPack,
        state.starterPackClaimed,
        state.lockedCards,
        state.pendingPacks,
        state.pendingPackResults,
        state.teamSkins,
        state.seasonScores,
        state.recentPlacements,
      ].forEach(map => {
        if (map) delete map[player.id];
      });
    } else {
      player.isBot = true;
      player.isDisconnected = false;
      player.isPermanentBot = true;
    }

    const nextHost = ensureConnectedHost(state);
    if (!nextHost) state.awaitingResumeDecision = true;
    socket.emit('player-session-cleared');
    io.emit('draft-update', state);
    acknowledge({ ok: true });
  });

  socket.on('start-draft', () => {
    if (state.phase === 'lobby' && state.participants.length >= 1) {
      prepareNewGame(state.participants);
      io.emit('draft-update', state);
    }
  });

  socket.on('toggle-reset', () => {
    if (!state.participants.some(participant => participant.id === socket.id && !isBotCheck(participant))) return;

    if (state.resetPlayers.includes(socket.id)) state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
    else state.resetPlayers.push(socket.id);

    const humanCount = state.participants.filter(p => !isBotCheck(p)).length;

    if (humanCount === 0 || state.resetPlayers.length >= humanCount) {
      const participants = state.participants
        .filter(participant => !participant.id.startsWith('bot-'))
        .map(participant => ({
          ...participant,
          roster: [],
          isBot: Boolean(participant.isDisconnected),
        }));
      resetGameState({ participants });
    }
    io.emit('draft-update', state);
  });

  socket.on('disconnect', () => {
    const player = state.participants.find(p => p.id === socket.id);

    if (player) {
      player.isBot = true;
      player.isDisconnected = true;
      state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      state.roundReady = state.roundReady.filter(id => id !== socket.id);
      state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
      state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);
    }
    const nextHost = ensureConnectedHost(state);
    if (!nextHost && state.participants.length > 0) {
      state.awaitingResumeDecision = true;
    }
    if (state.phase === 'simulation') startAllBotMatchesInCurrentRound(io);
    io.emit('draft-update', state);
  });
}
