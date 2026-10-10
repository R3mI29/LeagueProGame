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

export function clearPlayerSessions() {
  sessionsByToken.clear();
  tokenByPlayerId.clear();
}

export function assignHost(gameState, playerId) {
  let assigned = false;
  gameState.participants.forEach(participant => {
    const isHost = participant.id === playerId;
    participant.isHost = isHost;
    if (isHost) assigned = true;
  });
  return assigned;
}

export function getConnectedPlayers(gameState) {
  return gameState.participants.filter(participant =>
    !participant.id.startsWith('bot-') &&
    !participant.isPermanentBot &&
    !participant.isDisconnected &&
    !participant.isBot
  );
}

export function ensureConnectedHost(gameState, preferredPlayerId = null) {
  const connectedPlayers = getConnectedPlayers(gameState);
  const currentHost = connectedPlayers.find(participant => participant.isHost);
  if (currentHost) return currentHost;

  const nextHost = connectedPlayers.find(participant => participant.id === preferredPlayerId)
    || connectedPlayers[0];
  if (!nextHost) return null;
  assignHost(gameState, nextHost.id);
  return nextHost;
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
    if (match.teamA?.id === oldId) match.teamA.id = newId;
    if (match.teamB?.id === oldId) match.teamB.id = newId;
    match.ready = replaceId(match.ready, oldId, newId);
    match.dismissedBy = replaceId(match.dismissedBy, oldId, newId);
  };

  gameState.bracket?.flat().forEach(replaceIdInMatch);
  gameState.groups?.forEach(group => {
    group.teams?.forEach(team => {
      if (team?.id === oldId) team.id = newId;
    });
    group.qualified?.forEach(team => {
      if (team?.id === oldId) team.id = newId;
    });
    group.matches.forEach(replaceIdInMatch);
  });
  gameState.swissTeams?.forEach(entry => {
    if (entry.team?.id === oldId) entry.team.id = newId;
  });
  if (gameState.champion?.id === oldId) gameState.champion.id = newId;

  const token = tokenByPlayerId.get(oldId);
  if (token) {
    tokenByPlayerId.delete(oldId);
    tokenByPlayerId.set(newId, token);
    sessionsByToken.set(token, newId);
  }
}

export function exportPlayerSessions(validPlayerIds = null) {
  const allowedIds = validPlayerIds ? new Set(validPlayerIds) : null;
  return [...sessionsByToken.entries()]
    .filter(([, playerId]) => !allowedIds || allowedIds.has(playerId))
    .map(([token, playerId]) => ({ token, playerId }));
}

export function restorePlayerSessions(sessions = []) {
  sessionsByToken.clear();
  tokenByPlayerId.clear();

  sessions.forEach(session => {
    if (typeof session?.token !== 'string' || typeof session?.playerId !== 'string') return;
    sessionsByToken.set(session.token, session.playerId);
    tokenByPlayerId.set(session.playerId, session.token);
  });
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
