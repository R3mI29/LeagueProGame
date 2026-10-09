import { CARD_POOL } from './cardPlayers.js';

// Équipes historiques considérées comme la même organisation (à ajuster)
export const TEAM_ALIASES = { SKT: 'T1', DWG: 'DK' };

// Bonus ajouté à la MOYENNE de l'équipe (en points de rating).
// Les paliers sont volontairement faibles : voir la note sur la sensibilité plus bas.
export const SYNERGY_TIERS = {
  team:   [{ at: 3, bonus: 0.5 }, { at: 4, bonus: 1 }, { at: 5, bonus: 1.5 }],
  league: [{ at: 4, bonus: 0.5 }, { at: 5, bonus: 1 }],
};

const CARD_INDEX = new Map(CARD_POOL.map(c => [c.id, c]));

function bestGroup(values, tiers) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);

  let key = null, count = 0;
  for (const [k, c] of counts) if (c > count) { key = k; count = c; }
  if (count < 2) { key = null; count = 0; } // un joueur seul ne fait pas un groupe

  const reached = [...tiers].reverse().find(t => count >= t.at);
  const next = tiers.find(t => count < t.at) || null;
  return { key, count, bonus: reached ? reached.bonus : 0, next };
}

/** ids : liste d'ids de cartes (lineup partielle acceptée). */
export function computeSynergy(ids = []) {
  const cards = ids.map(id => CARD_INDEX.get(id)).filter(Boolean);
  const tags = cards.map(c => TEAM_ALIASES[c.teamTag] || c.teamTag).filter(Boolean);
  const leagues = cards.map(c => c.league).filter(Boolean);

  const team = bestGroup(tags, SYNERGY_TIERS.team);
  const league = bestGroup(leagues, SYNERGY_TIERS.league);
  return { team, league, bonus: team.bonus + league.bonus };
}

/** roster : tableau d'objets { id, ... } (équipe en match). */
export const getSynergy = (roster = []) => computeSynergy(roster.map(p => p.id));