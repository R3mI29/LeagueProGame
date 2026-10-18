// server/utils/random.js

/**
 * Algorithme Fisher-Yates — shuffle uniforme.
 * Retourne un NOUVEAU tableau, ne mute pas l'original.
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Trie les équipes par points de saison décroissants (seed 1 = le plus de points).
 * En cas d'égalité ou d'absence de scores, l'ordre est randomisé uniformément.
 * Retourne un NOUVEAU tableau.
 */
export function seedTeams(participants, seasonScores) {
  const withMeta = participants.map(p => ({
    team: p,
    points: seasonScores?.[p.id]?.points ?? 0,
    tiebreak: Math.random(),
  }));
  withMeta.sort((a, b) => b.points - a.points || b.tiebreak - a.tiebreak);
  return withMeta.map(x => x.team);
}
