const sessionsByToken = new Map();
const tokenByPlayerId = new Map();

function createToken() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function transferMapEntry(map, oldId, newId) {
  if (!map || map[oldId] === undefined) return;
  map[newId] = map[oldId];
  delete map[oldId];
}

function replaceId(list = [], oldId, newId) {
  return [...new Set(list.map(id => id === oldId ? newId : id))];
}

export function createPlayerSession(playerId) {
  invalidatePlayerSession(playerId);
  const token = createToken();
  sessionsByToken.set(token, playerId);
  tokenByPlayerId.set(playerId, token);
  return token;
}

export function invalidatePlayerSession(playerId) {
  const currentToken = tokenByPlayerId.get(playerId);
  if (!currentToken) return false;
  tokenByPlayerId.delete(playerId);
  sessionsByToken.delete(currentToken);
  return true;
}

export function transferPlayerIdentity(gameState, oldId, newId) {
  if (!oldId || !newId || oldId === newId) return;

  [
    gameState.cardCollections,
    gameState.activeLineups,
    gameState.economy,
    gameState.cardStats,
    gameState.lastOpenedPack,
    gameState.starterPackClaimed,
    gameState.lockedCards,
    gameState.pendingPacks,
    gameState.pendingPackResults,
    gameState.teamSkins,
    gameState.seasonScores,
  ].forEach(map => transferMapEntry(map, oldId, newId));

  gameState.readyPlayers = replaceId(gameState.readyPlayers, oldId, newId);
  gameState.roundReady = replaceId(gameState.roundReady, oldId, newId);
  gameState.resetPlayers = replaceId(gameState.resetPlayers, oldId, newId);
  gameState.continueSeasonVotes = replaceId(gameState.continueSeasonVotes, oldId, newId);

  const replaceIdInMatch = (match) => {
    if (!match) return;
    match.ready = replaceId(match.ready, oldId, newId);
    match.dismissedBy = replaceId(match.dismissedBy, oldId, newId);
  };

  gameState.bracket?.flat().forEach(replaceIdInMatch);
  gameState.groups?.forEach(group => group.matches.forEach(replaceIdInMatch));

  const token = tokenByPlayerId.get(oldId);
  if (token) {
    tokenByPlayerId.delete(oldId);
    tokenByPlayerId.set(newId, token);
    sessionsByToken.set(token, newId);
  }
}

export function reconnectPlayer(gameState, token, socketId) {
  if (typeof token !== 'string' || !token) {
    return { ok: false, error: 'Session de reconnexion invalide.' };
  }

  const playerId = sessionsByToken.get(token);
  const player = gameState.participants.find(participant => participant.id === playerId);
  if (!player) {
    sessionsByToken.delete(token);
    if (playerId) tokenByPlayerId.delete(playerId);
    return { ok: false, error: 'Cette ancienne session n’existe plus.' };
  }

  if (!player.isDisconnected && !player.isBot && player.id !== socketId) {
    return { ok: false, error: 'Cette équipe est déjà connectée.' };
  }

  const oldId = player.id;
  transferPlayerIdentity(gameState, oldId, socketId);
  player.id = socketId;
  player.isBot = false;
  player.isDisconnected = false;

  return {
    ok: true,
    playerId: socketId,
    playerName: player.name,
  };
}
