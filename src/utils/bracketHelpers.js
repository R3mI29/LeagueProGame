export function isTournamentPhase(state) {
  return state.phase === 'tournament' || state.phase === 'simulation';
}

export function getHumanCount(state) {
  return state.participants.filter(p => !p.id.startsWith('bot-')).length;
}

/**
 * Retourne le match en cours dans lequel le joueur courant est impliqué,
 * ou null s'il n'y en a pas / si le round est terminé / si déjà "dismissed".
 */
export function getMyActiveMatch(state, socketId) {
  if (state.phase !== 'simulation' || state.roundComplete || !state.bracket[state.currentRound]) {
    return null;
  }
  return (
    state.bracket[state.currentRound].find(
      (m) =>
        m.teamA &&
        m.teamB &&
        (m.teamA.id === socketId || m.teamB.id === socketId) &&
        !m.dismissedBy.includes(socketId)
    ) || null
  );
}

/**
 * Calcule qui doit voter pour passer au tour suivant (les qualifiés humains
 * du prochain round, ou tous les humains restants s'il n'y a pas encore
 * d'appariement pour le prochain round).
 */
export function getNextRoundVoting(state, socketId) {
  const humanCount = getHumanCount(state);
  let requiredVotersCount = humanCount;
  let amIRequiredForNextRound = true;

  const nextRound = state.bracket[state.currentRound + 1];
  if (state.phase === 'simulation' && state.roundComplete && nextRound) {
    const activeHumanIds = [];
    nextRound.forEach((match) => {
      if (match.teamA && !match.teamA.id.startsWith('bot-')) activeHumanIds.push(match.teamA.id);
      if (match.teamB && !match.teamB.id.startsWith('bot-')) activeHumanIds.push(match.teamB.id);
    });

    const allHumans = state.participants.filter((p) => !p.id.startsWith('bot-')).map((p) => p.id);
    const requiredVoters = activeHumanIds.length > 0 ? activeHumanIds : allHumans;

    requiredVotersCount = requiredVoters.length;
    amIRequiredForNextRound = requiredVoters.includes(socketId);
  }

  return { requiredVotersCount, amIRequiredForNextRound };
}
