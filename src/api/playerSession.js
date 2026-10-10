const PLAYER_SESSION_KEY = 'lol-draft-player-session';

export function getPlayerSessionToken() {
  try {
    return window.localStorage.getItem(PLAYER_SESSION_KEY);
  } catch {
    return null;
  }
}

export function savePlayerSessionToken(token) {
  if (!token) return;
  try {
    window.localStorage.setItem(PLAYER_SESSION_KEY, token);
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

export function clearPlayerSessionToken() {
  try {
    window.localStorage.removeItem(PLAYER_SESSION_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}
