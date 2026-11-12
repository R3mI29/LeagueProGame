import { CARD_POOL, getCardTeamTags } from './cardPlayers.js';

// Équipes historiques considérées comme la même organisation (à ajuster)
export const TEAM_ALIASES = { 
  SKT: 'T1', 
  DWG: 'DK', 
  'DK.C': 'DK',
  KCB: 'KC', 
  GENG: 'GEN',
  '100': '100T',
  SHR: 'RYL',
  LOUD: 'LLL',
  TW: 'TSW'
};

// Bonus ajouté à la MOYENNE de l'équipe (en points de rating).
// Les paliers sont volontairement faibles : voir la note sur la sensibilité plus bas.
export const SYNERGY_TIERS = {
  team:   [{ at: 2, bonus: 0.5 },{ at: 3, bonus: 1 }, { at: 4, bonus: 2 }, { at: 5, bonus: 3 }],
  league: [{ at: 3, bonus: 0.5 },{ at: 4, bonus: 1 }, { at: 5, bonus: 2 }],
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
  const cards = ids.map(id => CARD_INDEX.get(id) || CARD_POOL.find(c => c.id === id)).filter(Boolean);

  // Pour les équipes : chaque carte peut avoir 1 ou plusieurs tags (ex: BLG & JDG).
  // Une carte ne compte qu'une seule fois par franchise.
  const teamCounts = new Map();
  for (const card of cards) {
    const rawTags = getCardTeamTags(card);
    const resolvedTags = new Set(rawTags.map(t => TEAM_ALIASES[t] || t).filter(Boolean));
    for (const tag of resolvedTags) {
      teamCounts.set(tag, (teamCounts.get(tag) || 0) + 1);
    }
  }

  let bestTeamKey = null, bestTeamCount = 0;
  for (const [tag, count] of teamCounts) {
    if (count > bestTeamCount) {
      bestTeamKey = tag;
      bestTeamCount = count;
    }
  }
  if (bestTeamCount < 2) { bestTeamKey = null; bestTeamCount = 0; }
  const reached = [...SYNERGY_TIERS.team].reverse().find(t => bestTeamCount >= t.at);
  const next = SYNERGY_TIERS.team.find(t => bestTeamCount < t.at) || null;
  const team = { key: bestTeamKey, count: bestTeamCount, bonus: reached ? reached.bonus : 0, next };

  const leagues = cards.map(c => c.league).filter(Boolean);
  const league = bestGroup(leagues, SYNERGY_TIERS.league);
  return { team, league, bonus: team.bonus + league.bonus };
}

/** roster : tableau d'objets { id, ... } (équipe en match). */
export const getSynergy = (roster = []) => computeSynergy(roster.map(p => p.id));
