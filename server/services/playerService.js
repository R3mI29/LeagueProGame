import { state } from '../state/gameState.js';
import { TEAMS_DB } from '../config/constants.js';

export const isBotCheck = (p) => p.id.startsWith('bot-') || p.isBot;

export function getUniqueBotTeam(pendingBots = []) {
  const usedLogos = state.participants.map(p => p.logo).filter(Boolean);
  const pendingLogos = pendingBots.map(b => b.logo).filter(Boolean);
  const allUsed = [...usedLogos, ...pendingLogos];
  
  const available = TEAMS_DB.filter(t => !allUsed.includes(t.logo));
  if (available.length === 0) return { name: `Bot Squad ${Math.floor(Math.random() * 1000)}`, tag: "BOT", logo: null };
  return available[Math.floor(Math.random() * available.length)];
}

export function getAliveHumans() {
  const allHumans = state.participants.filter(p => !isBotCheck(p)).map(p => p.id);
  if (allHumans.length === 0) return [];
  
  let alive = new Set();
  
  if (state.tournamentPhase === 'swiss' && state.swissTeams) {
    state.swissTeams.forEach(t => {
      if (!isBotCheck(t.team) && t.losses < 3) alive.add(t.team.id);
    });
  } else if (state.tournamentPhase === 'groups' && state.groups) {
    state.groups.forEach(g => {
      if (g.qualified.length === 2) {
        g.qualified.forEach(q => { if (!isBotCheck(q)) alive.add(q.id); });
      } else {
        g.teams.forEach(t => { if (!isBotCheck(t)) alive.add(t.id); });
      }
    });
  } else if (state.tournamentPhase === 'bracket' && state.bracket) {
    state.bracket.flat().forEach(m => {
      if (m.status !== 'finished') {
        if (m.teamA && !isBotCheck(m.teamA)) alive.add(m.teamA.id);
        if (m.teamB && !isBotCheck(m.teamB)) alive.add(m.teamB.id);
      }
    });
  }
  
  const aliveArr = Array.from(alive);
  return aliveArr.length > 0 ? aliveArr : allHumans;
}

export function advanceTeam(team, nextId, nextSlot) {
  if (!nextId) { state.champion = team; return; }
  const nextMatch = state.bracket.flat().find(m => m.id === nextId);
  if (nextMatch) nextMatch[nextSlot] = team;
}

export function findMatchById(matchId) {
  let match = state.bracket.flat().find(m => m.id === matchId);
  if (match) return match;
  if (state.groups) {
    for (const g of state.groups) {
      match = g.matches.find(m => m.id === matchId);
      if (match) return match;
    }
  }
  return null;
}