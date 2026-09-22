import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PRO_PLAYERS } from '../src/constants/players.js';
import { ORDERED_ROLES } from '../src/constants/roles.js';
import {
  openStandardPack, openStarterPack, addCardsToCollection,
  hasCompleteLineup, getCardById, cardToRosterEntry, generateBotRosterFromCards
} from './cardMode.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Bypass-Tunnel-Reminder"]
  }
});

// --- Réglages du mode "Draft aux enchères" ---
const STARTING_BUDGET = 1000;
const MIN_BID = 10;
const MIN_INCREMENT = 5;
const BID_TIMER_MS = 15000; // délai avant adjudication après la dernière enchère
const matchTimeouts = {};

// Noms utilisés pour les bots générés (tous modes confondus)
const teamNames = ["JD Gaming", "GenG", "T1", "Karmine Corp", "FearX", "Team WE", "Edward Gaming", "Royal Never Give Up", "Samsung White", "Samsung Blue", "Griffin", "Royal Club", "Hanwha Life Esport", "Movistar KOI", "GiantX", "KT Rolster", "SKT T1", "Damwon Gaming", "Bilibili Gaming", "Nongshim Redforce", "Lyon", "Flyquest", "Top Esport", "Invictus Gaming", "Anyone's Legend", "ZYB", "Solary", "Fnatic"];

let auctionTimer = null;

let state = {
  phase: 'lobby', gameMode: null, participants: [], availablePlayers: [], turnIndex: 0,
  currentOptions: [], bracket: [], readyPlayers: [], resetPlayers: [], champion: null,
  currentRound: 0, roundComplete: false, roundReady: [],
  auction: null, budgets: {},
  // Joueurs "passés" (skip) durant les enchères : ils ne sont plus jamais
  // reproposés aux humains, mais restent piochables par les bots en fin de draft.
  skippedPlayers: [],
  // --- Mode "Draft aux packs" (cartes + saison) ---
  cardCollections: {}, // { participantId: { cardId: quantité } }
  activeLineups: {}, // { participantId: { role: cardId } }
  pendingPacks: {}, // { participantId: nombre de packs non ouverts }
  lastOpenedPack: {}, // { participantId: [cardId, ...] } dernier pack ouvert, pour l'animation
  starterPackClaimed: {}, // { participantId: bool }
  seasonRound: 0,
  continueSeasonVotes: []
};

function getOptionsForParticipant(participant, availablePool) {
  const missingRoles = ORDERED_ROLES.filter(role => !participant.roster.some(p => p.role === role));
  const options = [];
  for (const role of missingRoles) {
    const playersInRole = availablePool.filter(p => p.role === role);
    if (playersInRole.length > 0) options.push(playersInRole[Math.floor(Math.random() * playersInRole.length)]);
  }
  return options;
}

function advanceTeam(team, nextId, nextSlot) {
  if (!nextId) { state.champion = team; return; }
  const nextMatch = state.bracket.flat().find(m => m.id === nextId);
  if (nextMatch) nextMatch[nextSlot] = team;
}

function getTeamRating(team) {
  if (!team || !team.roster || team.roster.length === 0) return 0;
  return Math.round(team.roster.reduce((acc, p) => acc + p.rating, 0) / team.roster.length);
}

// --- Simulation des matchs : Bo5 (premier à 3 manches) avec événements aléatoires ---
const GAMES_TO_WIN = 3;
const GAME_SIMULATE_MS = 6000; // durée de l'animation "en cours" pour une manche
const GAME_GAP_MS = 2500; // pause entre deux manches d'un même match

/**
 * Événements pouvant se déclencher pendant une manche et faire pencher la
 * balance vers une équipe. Chacun a sa propre probabilité (jamais garanti),
 * et certains ont en plus une condition (écart de niveau, synergie de rôles,
 * score de la série...) qui doit être remplie avant même le tirage au sort.
 * apply() renvoie null (rien ne se passe) ou { side: 'A'|'B', ratingDelta, label }.
 */
const MATCH_EVENTS = [
  {
    id: 'carry-superstar',
    probability: 0.18,
    apply(teamA, teamB) {
      const allPlayers = [
        ...teamA.roster.map(p => ({ p, side: 'A' })),
        ...teamB.roster.map(p => ({ p, side: 'B' }))
      ];
      const best = allPlayers.reduce((acc, cur) => (cur.p.rating > acc.p.rating ? cur : acc));
      if (best.p.rating < 90) return null; // il faut un vrai crack pour ce genre de perf
      return { side: best.side, ratingDelta: 6, label: `${best.p.name} est injouable ce game` };
    }
  },
  {
    id: 'bot-synergy',
    probability: 0.15,
    apply(teamA, teamB) {
      const side = Math.random() < 0.5 ? 'A' : 'B';
      const team = side === 'A' ? teamA : teamB;
      const adc = team.roster.find(p => p.role === 'ADC');
      const sup = team.roster.find(p => p.role === 'Support');
      if (!adc || !sup || Math.abs(adc.rating - sup.rating) > 6) return null; // synergie = niveaux proches
      return { side, ratingDelta: 4, label: `Bot lane ${adc.name} / ${sup.name} totalement synchronisée` };
    }
  },
  {
    id: 'mid-jungle-duo',
    probability: 0.15,
    apply(teamA, teamB) {
      const side = Math.random() < 0.5 ? 'A' : 'B';
      const team = side === 'A' ? teamA : teamB;
      const mid = team.roster.find(p => p.role === 'Mid');
      const jgl = team.roster.find(p => p.role === 'Jungle');
      if (!mid || !jgl || Math.abs(mid.rating - jgl.rating) > 6) return null;
      return { side, ratingDelta: 4, label: `Duo Mid/Jungle ${mid.name} - ${jgl.name} qui prend le contrôle de la carte` };
    }
  },
  {
    id: 'lane-duel-mid',
    probability: 0.12,
    apply(teamA, teamB) {
      const midA = teamA.roster.find(p => p.role === 'Mid');
      const midB = teamB.roster.find(p => p.role === 'Mid');
      if (!midA || !midB) return null;
      const diff = midA.rating - midB.rating;
      if (Math.abs(diff) < 5) return null; // il faut un vrai écart pour un duel qui tourne au clash
      const winner = diff > 0 ? midA : midB;
      const loser = diff > 0 ? midB : midA;
      return { side: diff > 0 ? 'A' : 'B', ratingDelta: 5, label: `${winner.name} humilie ${loser.name} en lane mid` };
    }
  },
  {
    id: 'top-duel',
    probability: 0.12,
    apply(teamA, teamB) {
      const topA = teamA.roster.find(p => p.role === 'Top');
      const topB = teamB.roster.find(p => p.role === 'Top');
      if (!topA || !topB) return null;
      const diff = topA.rating - topB.rating;
      if (Math.abs(diff) < 5) return null;
      const winner = diff > 0 ? topA : topB;
      const loser = diff > 0 ? topB : topA;
      return { side: diff > 0 ? 'A' : 'B', ratingDelta: 4, label: `${winner.name} snowball tout seul en top face à ${loser.name}` };
    }
  },
  {
    id: 'baron-steal',
    probability: 0.1,
    apply() {
      const side = Math.random() < 0.5 ? 'A' : 'B';
      return { side, ratingDelta: 7, label: 'Baron volé sur un smite désespéré' };
    }
  },
  {
    id: 'throw',
    probability: 0.1,
    apply(teamA, teamB) {
      const ratingA = getTeamRating(teamA);
      const ratingB = getTeamRating(teamB);
      if (Math.abs(ratingA - ratingB) < 4) return null; // besoin d'un vrai favori pour "thrower"
      const favoriteSide = ratingA >= ratingB ? 'A' : 'B';
      const underdogSide = favoriteSide === 'A' ? 'B' : 'A';
      const favoriteName = favoriteSide === 'A' ? teamA.name : teamB.name;
      return { side: underdogSide, ratingDelta: 8, label: `Throw monumental de ${favoriteName} en fin de partie` };
    }
  },
  {
    id: 'tech-issue',
    probability: 0.08,
    apply(teamA, teamB) {
      const affectedSide = Math.random() < 0.5 ? 'A' : 'B';
      const beneficiarySide = affectedSide === 'A' ? 'B' : 'A';
      const affectedName = affectedSide === 'A' ? teamA.name : teamB.name;
      return { side: beneficiarySide, ratingDelta: 5, label: `Problème de connexion chez ${affectedName}` };
    }
  },
  {
    id: 'momentum',
    probability: 0.12,
    apply(teamA, teamB, scoreA, scoreB) {
      if (scoreA === scoreB) return null; // besoin d'être mené dans la série
      const trailingSide = scoreA < scoreB ? 'A' : 'B';
      const trailingName = trailingSide === 'A' ? teamA.name : teamB.name;
      return { side: trailingSide, ratingDelta: 5, label: `Dos au mur, ${trailingName} hausse enfin le niveau` };
    }
  }
];

/** Simule une manche : applique les événements déclenchés puis tire le vainqueur. */
function simulateGame(teamA, teamB, scoreA, scoreB) {
  let ratingA = getTeamRating(teamA);
  let ratingB = getTeamRating(teamB);
  const triggeredEvents = [];

  for (const event of MATCH_EVENTS) {
    if (Math.random() > event.probability) continue; // ne se déclenche jamais à 100%
    const result = event.apply(teamA, teamB, scoreA, scoreB);
    if (!result) continue;
    if (result.side === 'A') ratingA += result.ratingDelta;
    else ratingB += result.ratingDelta;
    triggeredEvents.push({ label: result.label, side: result.side });
  }

  const probA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 20));
  const winnerSide = Math.random() < probA ? 'A' : 'B';
  return { winnerSide, events: triggeredEvents };
}

function tryStartMatch(match) {
  if (!match || match.status !== 'pending' || !match.teamA || !match.teamB) return;

  if (match.teamA.id.startsWith('bot-') && !match.ready.includes(match.teamA.id)) match.ready.push(match.teamA.id);
  if (match.teamB.id.startsWith('bot-') && !match.ready.includes(match.teamB.id)) match.ready.push(match.teamB.id);

  if (match.ready.length === 2) {
    match.scoreA = 0;
    match.scoreB = 0;
    match.games = [];
    match.lastGameEvents = [];
    playNextGame(match);
  }
}

/** Joue une manche du Bo5, puis enchaîne sur la suivante ou termine le match. */
function playNextGame(match) {
  match.status = 'simulating';
  io.emit('draft-update', state);

  // 1. On vérifie si ce match oppose uniquement des bots
  const isBotOnly = match.teamA.id.startsWith('bot-') && match.teamB.id.startsWith('bot-');

  // 2. On définit des délais dynamiques :
  // Si bots : 400ms pour simuler + 100ms de pause (BO5 bouclé en 1.5 à 2.5 secondes)
  // Si humain : On garde tes constantes GAME_SIMULATE_MS (6s) et GAME_GAP_MS (2.5s)
  const currentSimulateMs = isBotOnly ? 400 : GAME_SIMULATE_MS;
  const currentGapMs = isBotOnly ? 100 : GAME_GAP_MS;

  // On stocke le timeout dans notre dictionnaire externe, pas dans le "match"
  matchTimeouts[match.id] = setTimeout(() => {
    const gameNumber = match.games.length + 1;
    const { winnerSide, events } = simulateGame(match.teamA, match.teamB, match.scoreA, match.scoreB);

    if (winnerSide === 'A') match.scoreA++; else match.scoreB++;
    match.games.push({ gameNumber, winnerSide, events });
    match.lastGameEvents = events;

    if (match.scoreA === GAMES_TO_WIN || match.scoreB === GAMES_TO_WIN) {
      match.winner = match.scoreA === GAMES_TO_WIN ? match.teamA : match.teamB;
      match.status = 'finished';
      advanceTeam(match.winner, match.nextId, match.nextSlot);

      const allFinished = state.bracket[state.currentRound].every(m => m.status === 'finished');
      if (allFinished && !state.champion) {
        state.roundComplete = true;
      }

      io.emit('draft-update', state);
    } else {
      io.emit('draft-update', state);
      // On utilise le délai d'entre-manche dynamique ici !
      matchTimeouts[match.id] = setTimeout(() => playNextGame(match), currentGapMs);
    }
  }, currentSimulateMs); // On utilise le délai de simulation dynamique ici !
}

/**
 * Une fois que tous les commandants humains ont un roster complet (5/5),
 * complète les places restantes avec des bots et met en place le tournoi.
 * Utilisé à la fois par la draft classique/aveugle et par la draft aux enchères.
 */
/**
 * Construit le bracket (quarts/demies/finale) et démarre le tournoi à partir
 * de state.participants, en supposant que tout le monde (humains + bots) a
 * déjà un roster complet de 5 rôles. Commun à tous les modes de draft.
 */
function buildBracketAndStartTournament() {
  state.phase = 'tournament';
  state.currentOptions = [];
  state.readyPlayers = [];
  state.auction = null;

  const shuffled = [...state.participants].sort(() => 0.5 - Math.random());
  const qf = [];
  for (let i = 0; i < 4; i++) {
    qf.push({
      id: `qf-${i}`, teamA: shuffled[i], teamB: shuffled[i + 4],
      status: 'pending', ready: [], dismissedBy: [], winner: null,
      scoreA: 0, scoreB: 0, games: [], lastGameEvents: [],
      nextId: `sf-${Math.floor(i / 2)}`, nextSlot: i % 2 === 0 ? 'teamA' : 'teamB'
    });
  }
  const sf = [
    { id: 'sf-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, scoreA: 0, scoreB: 0, games: [], lastGameEvents: [], nextId: 'f-0', nextSlot: 'teamA' },
    { id: 'sf-1', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, scoreA: 0, scoreB: 0, games: [], lastGameEvents: [], nextId: 'f-0', nextSlot: 'teamB' }
  ];
  state.bracket = [qf, sf, [{ id: 'f-0', teamA: null, teamB: null, status: 'pending', ready: [], dismissedBy: [], winner: null, scoreA: 0, scoreB: 0, games: [], lastGameEvents: [], nextId: null, nextSlot: null }]];
}

/**
 * Une fois que tous les commandants humains ont un roster complet (5/5),
 * complète les places restantes avec des bots et met en place le tournoi.
 * Utilisé par la draft classique/aveugle et par la draft aux enchères
 * (celles qui piochent dans state.availablePlayers / state.skippedPlayers).
 */
function completeDraftAndStartTournament() {
  const numBots = 8 - state.participants.length;
  for (let i = 1; i <= numBots; i++) {
    const bot = { id: `bot-${i}`, name: teamNames[Math.floor(Math.random() * teamNames.length)], roster: [] };
    ORDERED_ROLES.forEach(role => {
      // Pool des bots = joueurs disponibles + joueurs passés durant les enchères
      const pool = [...state.availablePlayers, ...state.skippedPlayers].filter(p => p.role === role);
      if (pool.length === 0) return; // sécurité, ne devrait pas arriver
      const pick = pool[Math.floor(Math.random() * pool.length)];
      bot.roster.push(pick);
      state.availablePlayers = state.availablePlayers.filter(p => p.id !== pick.id);
      state.skippedPlayers = state.skippedPlayers.filter(p => p.id !== pick.id);
    });
    state.participants.push(bot);
  }

  buildBracketAndStartTournament();
}

/**
 * Équivalent pour le mode "Draft aux packs" : construit le roster de chaque
 * humain depuis sa line-up de cartes choisie, génère les bots depuis le pool
 * de cartes, puis démarre le tournoi. Réutilisable à chaque tour de saison.
 */
// Trouve la fonction startCardTournament et remplace-la par ceci :
function startCardTournament() {
  const humanParticipants = state.participants.filter(p => !p.id.startsWith('bot-'));
  const existingBots = state.participants.filter(p => p.id.startsWith('bot-'));

  // Met à jour les rosters des humains
  humanParticipants.forEach(p => {
    const lineup = state.activeLineups[p.id] || {};
    p.roster = ORDERED_ROLES.map(role => cardToRosterEntry(getCardById(lineup[role])));
  });

  // Ne crée des bots que s'ils n'existent pas encore (pour la saison 1)
  if (existingBots.length === 0) {
    const numBots = 8 - humanParticipants.length;
    const bots = [];
    for (let i = 1; i <= numBots; i++) {
      bots.push({
        id: `bot-${i}`,
        name: teamNames[Math.floor(Math.random() * teamNames.length)],
        roster: generateBotRosterFromCards()
      });
    }
    state.participants = [...humanParticipants, ...bots];
  } else {
    // Conserve les mêmes bots et leurs mêmes cartes pour le reste de la saison
    state.participants = [...humanParticipants, ...existingBots];
  }

  // Initialisation des scores si c'est la saison 1
  if (!state.seasonScores) {
    state.seasonScores = {};
    state.participants.forEach(p => {
      state.seasonScores[p.id] = { points: 0, titles: 0 };
    });
  }

  buildBracketAndStartTournament();
}

// Trouve la fonction awardSeasonPacks et remplace-la par ceci :
function awardSeasonPacks() {
  const finalMatch = state.bracket[2] && state.bracket[2][0];
  const championId = state.champion?.id;
  const runnerUpId = finalMatch
    ? (finalMatch.teamA?.id === championId ? finalMatch.teamB?.id : finalMatch.teamA?.id)
    : null;

  // Calcul du track record de la saison
  if (!state.seasonScores) state.seasonScores = {};
  
  state.participants.forEach(p => {
    if (!state.seasonScores[p.id]) state.seasonScores[p.id] = { points: 0, titles: 0 };

    // Attribution des points
    if (p.id === championId) {
      state.seasonScores[p.id].points += 5;
      state.seasonScores[p.id].titles += 1;
    } else if (p.id === runnerUpId) {
      state.seasonScores[p.id].points += 3;
    } else if (state.bracket[1].some(m => m.teamA?.id === p.id || m.teamB?.id === p.id)) {
      // Demi-finaliste
      state.seasonScores[p.id].points += 1;
    }

    // Récompenses en packs (seulement pour les humains)
    if (!p.id.startsWith('bot-')) {
      let packs = 1; // pack de base
      if (p.id === championId) packs = 3;
      else if (p.id === runnerUpId) packs = 2;
      state.pendingPacks[p.id] = (state.pendingPacks[p.id] || 0) + packs;
    }
  });
}

// Optionnel mais recommandé : dans socket.on('start-draft', ...), 
// sous state.seasonRound = 1;, ajoute state.seasonScores = null; 
// pour bien réinitialiser les scores au début d'une toute nouvelle partie.

// --- Logique de la draft aux enchères ---

function clearAuctionTimer() {
  if (auctionTimer) {
    clearTimeout(auctionTimer);
    auctionTimer = null;
  }
}

function getRoleNeeders(role) {
  return state.participants.filter(
    p => !p.id.startsWith('bot-') && !p.roster.some(pro => pro.role === role)
  );
}

/** Un commandant est "fauché" s'il n'a plus de quoi payer la mise minimale. */
function isBroke(participantId) {
  const budget = state.budgets[participantId] ?? STARTING_BUDGET;
  return budget < MIN_BID;
}

/**
 * Le "groupe habilité à voter" pour passer ce joueur : les prétendants
 * solvables tant qu'il y en a encore en lice, sinon les fauchés restants
 * entre eux (une fois la phase de secours entamée).
 */
function getSkipVotingGroup(auction) {
  const solventActive = auction.activeIds.filter(id => !isBroke(id));
  return solventActive.length > 0 ? solventActive : auction.activeIds;
}

/** Le skip n'est ouvert que s'il y a au moins 2 votants dans le groupe actuel. */
function computeSkipEligible(auction) {
  if (!auction || auction.forced || auction.activeIds.length < 2) return false;
  return getSkipVotingGroup(auction).length >= 2;
}

/**
 * Fait apparaître le prochain joueur pro aux enchères, pour le premier rôle
 * (dans l'ordre ORDERED_ROLES) encore recherché par au moins un humain.
 * - S'il ne reste qu'1 seul humain à avoir besoin de ce rôle : acquisition
 *   obligatoire au prix minimum (pas d'enchère, pas de skip possible).
 * - S'il en reste 2 ou plus : enchère classique + possibilité de voter à
 *   l'unanimité pour "passer" ce joueur, seulement si le stock restant du
 *   rôle suffit encore à satisfaire tout le monde.
 * Si plus personne n'a besoin d'aucun rôle, la draft est terminée.
 */
function startAuctionRound() {
  clearAuctionTimer();

  const candidateRoles = ORDERED_ROLES.filter(role => getRoleNeeders(role).length > 0);
  if (candidateRoles.length === 0) {
    // Plus aucun rôle recherché : fin de la phase d'enchères
    completeDraftAndStartTournament();
    return;
  }

  // Ordre tiré au sort à chaque manche : pas de séquence figée Top->Jungle->Mid->ADC->Support.
  const shuffledRoles = [...candidateRoles].sort(() => Math.random() - 0.5);

  for (const role of shuffledRoles) {
    const needers = getRoleNeeders(role);

    let pool = state.availablePlayers.filter(p => p.role === role);
    if (pool.length === 0) {
      // Filet de sécurité : si tous les joueurs de ce rôle ont été passés,
      // on repioche exceptionnellement dans la réserve "skip" plutôt que
      // de bloquer un humain qui a encore besoin de ce rôle.
      pool = state.skippedPlayers.filter(p => p.role === role);
    }
    if (pool.length === 0) continue; // vraiment plus aucun joueur de ce rôle

    const player = pool[Math.floor(Math.random() * pool.length)];
    const contenders = needers.map(p => p.id);
    const forced = contenders.length === 1;

    state.auction = {
      player,
      role,
      contenders,
      // activeIds : liste dynamique des prétendants encore en lice (se réduit
      // au fil des retraits/skips, contrairement à "contenders" qui est figée).
      activeIds: [...contenders],
      highestBid: 0,
      highestBidderId: null,
      minBid: MIN_BID,
      increment: MIN_INCREMENT,
      forced,
      skipVotes: [],
      skipEligible: false,
      deadline: null
    };
    state.auction.skipEligible = computeSkipEligible(state.auction);
    return;
  }

  // Aucun rôle "candidat" n'avait finalement de joueur disponible (cas extrême)
  completeDraftAndStartTournament();
}

function assignAuctionPlayer(participantId, price) {
  const auction = state.auction;
  if (!auction) return;
  const participant = state.participants.find(p => p.id === participantId);
  if (participant) {
    participant.roster.push(auction.player);
    state.availablePlayers = state.availablePlayers.filter(p => p.id !== auction.player.id);
    state.skippedPlayers = state.skippedPlayers.filter(p => p.id !== auction.player.id);
    state.budgets[participantId] = (state.budgets[participantId] ?? STARTING_BUDGET) - price;
  }
  state.auction = null;
  startAuctionRound();
}

/**
 * Attribue le joueur de l'enchère en cours à participantId, au prix demandé
 * (la meilleure offre en cours, ou la mise minimale s'il n'y en a pas eu),
 * mais jamais plus que ce que le commandant possède : son solde tombe à 0
 * au pire, il ne passe jamais en négatif.
 */
function resolveAuctionWin(participantId) {
  const auction = state.auction;
  if (!auction) return;
  const budget = state.budgets[participantId] ?? STARTING_BUDGET;
  const askedPrice = auction.highestBid > 0 ? auction.highestBid : auction.minBid;
  const price = Math.min(budget, askedPrice);
  assignAuctionPlayer(participantId, price);
}

/**
 * À appeler après toute modification de auction.activeIds (retrait, passage
 * de skip, déconnexion...). Gère les cas :
 * - plus personne en lice -> le joueur est écarté (réservé aux bots)
 * - 1 seul restant -> il garde le choix de récupérer ou de passer (SAUF si
 *   "forced" était déjà vrai depuis la création de l'enchère, càd que ce
 *   rôle n'était de toute façon recherché que par cette seule personne :
 *   dans ce cas précis, pas de choix, c'est obligatoire)
 * - 2+ restants -> l'enchère continue, on recalcule juste le droit au skip
 */
function resolveActiveIdsChange() {
  const auction = state.auction;
  if (!auction) return;

  if (auction.activeIds.length === 0) {
    clearAuctionTimer();
    discardAuctionPlayer();
    return;
  }

  if (auction.activeIds.length === 1) {
    // Note : si auction.forced était déjà vrai (rareté dès la création),
    // il le reste. Sinon, on NE force PAS : le dernier restant a le choix
    // (bouton "récupérer" ou "passer" côté client), même s'il est fauché.
    auction.skipEligible = false;
    auction.skipVotes = [];
    clearAuctionTimer();
    auction.deadline = null;
    return;
  }

  auction.forced = false;
  auction.skipEligible = computeSkipEligible(auction);
}

function discardAuctionPlayer() {
  const auction = state.auction;
  if (!auction) return;
  // Le joueur "passé" est retiré des enchères pour de bon : il ne sera plus
  // jamais reproposé aux humains, mais reste disponible pour les bots
  // générés en fin de draft.
  state.availablePlayers = state.availablePlayers.filter(p => p.id !== auction.player.id);
  if (!state.skippedPlayers.some(p => p.id === auction.player.id)) {
    state.skippedPlayers.push(auction.player);
  }
  state.auction = null;
  startAuctionRound();
}

/**
 * Recalcule l'enchère en cours après la déconnexion d'un commandant
 * (retire sa mise éventuelle, met à jour les prétendants restants).
 */
function refreshAuctionAfterDisconnect() {
  if (state.phase !== 'auction' || !state.auction) return;
  const auction = state.auction;
  const stillHere = (id) => state.participants.some(p => p.id === id);

  auction.contenders = auction.contenders.filter(stillHere);
  auction.activeIds = auction.activeIds.filter(stillHere);
  auction.skipVotes = auction.skipVotes.filter(id => auction.activeIds.includes(id));

  if (auction.highestBidderId && !auction.activeIds.includes(auction.highestBidderId)) {
    auction.highestBid = 0;
    auction.highestBidderId = null;
    auction.deadline = null;
    clearAuctionTimer();
  }

  resolveActiveIdsChange();
}

io.on('connection', (socket) => {
  socket.emit('draft-update', state);

  socket.on('select-mode', (modeId) => {
    if (state.phase === 'lobby' && state.gameMode === null) {
      state.gameMode = modeId;
      io.emit('draft-update', state);
    }
  });

  socket.on('join-lobby', (name) => {
    if (state.phase !== 'lobby' || state.participants.length >= 8) return;
    const cleanName = name.trim();
    if (state.participants.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) return;
    if (!state.participants.find(p => p.id === socket.id)) {
      state.participants.push({ id: socket.id, name: cleanName, roster: [] });
      io.emit('draft-update', state);
    }
  });

  socket.on('start-draft', () => {
    if (state.phase === 'lobby' && state.participants.length >= 2) {
      if (state.gameMode === 'draft_cartes') {
        state.cardCollections = {};
        state.activeLineups = {};
        state.pendingPacks = {};
        state.lastOpenedPack = {};
        state.starterPackClaimed = {};
        state.seasonRound = 1;
        state.continueSeasonVotes = [];
        state.participants.forEach(p => {
          state.cardCollections[p.id] = {};
          state.activeLineups[p.id] = {};
          state.pendingPacks[p.id] = 1; // le pack de départ, à ouvrir manuellement
          state.lastOpenedPack[p.id] = [];
          state.starterPackClaimed[p.id] = false;
        });
        state.phase = 'cards';
        io.emit('draft-update', state);
        return;
      }

      state.availablePlayers = [...PRO_PLAYERS];

      if (state.gameMode === 'draft_encheres') {
        state.budgets = {};
        state.skippedPlayers = [];
        state.participants.forEach(p => { state.budgets[p.id] = STARTING_BUDGET; });
        state.phase = 'auction';
        startAuctionRound();
      } else {
        state.phase = 'draft';
        state.turnIndex = 0;
        state.currentOptions = getOptionsForParticipant(state.participants[0], state.availablePlayers);
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('skip-match', (matchId) => {
    const match = state.bracket.flat().find(m => m.id === matchId);
    if (!match || match.status !== 'simulating') return;

    // Coupe l'animation en cours via le dictionnaire externe
    if (matchTimeouts[match.id]) {
      clearTimeout(matchTimeouts[match.id]);
      delete matchTimeouts[match.id];
    }

    // Résout instantanément les manches restantes (Bo5)
    while (match.scoreA < GAMES_TO_WIN && match.scoreB < GAMES_TO_WIN) {
      const gameNumber = match.games.length + 1;
      const { winnerSide, events } = simulateGame(match.teamA, match.teamB, match.scoreA, match.scoreB);
      if (winnerSide === 'A') match.scoreA++; else match.scoreB++;
      match.games.push({ gameNumber, winnerSide, events });
      match.lastGameEvents = events;
    }

    match.winner = match.scoreA === GAMES_TO_WIN ? match.teamA : match.teamB;
    match.status = 'finished';
    advanceTeam(match.winner, match.nextId, match.nextSlot);

    const allFinished = state.bracket[state.currentRound].every(m => m.status === 'finished');
    if (allFinished && !state.champion) {
      state.roundComplete = true;
    }

    io.emit('draft-update', state);
  });

  socket.on('pick-player', (playerId) => {
    if (state.phase !== 'draft') return;
    const activeParticipant = state.participants[state.turnIndex];

    if (activeParticipant.id === socket.id && state.currentOptions.find(p => p.id === playerId)) {
      activeParticipant.roster.push(state.currentOptions.find(p => p.id === playerId));
      state.availablePlayers = state.availablePlayers.filter(p => p.id !== playerId);

      if (state.participants.every(p => p.roster.length === 5)) {
        completeDraftAndStartTournament();
      } else {
        state.turnIndex = (state.turnIndex + 1) % state.participants.length;
        state.currentOptions = getOptionsForParticipant(state.participants[state.turnIndex], state.availablePlayers);
      }
      io.emit('draft-update', state);
    }
  });

  // --- Événements du mode "Draft aux packs" ---

  socket.on('open-pack', () => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!state.participants.some(p => p.id === id)) return;
    if ((state.pendingPacks[id] || 0) <= 0) return;

    const isStarter = !state.starterPackClaimed[id];
    const cards = isStarter ? openStarterPack() : openStandardPack();

    if (!state.cardCollections[id]) state.cardCollections[id] = {};
    addCardsToCollection(state.cardCollections[id], cards);
    state.starterPackClaimed[id] = true;
    state.pendingPacks[id] -= 1;
    state.lastOpenedPack[id] = cards.map(c => c.id);

    io.emit('draft-update', state);
  });

  socket.on('set-lineup-card', ({ role, cardId }) => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    if (!ORDERED_ROLES.includes(role)) return;
    const collection = state.cardCollections[id];
    if (!collection || !(collection[cardId] > 0)) return;
    const card = getCardById(cardId);
    if (!card || card.role !== role) return;

    if (!state.activeLineups[id]) state.activeLineups[id] = {};
    state.activeLineups[id][role] = cardId;
    io.emit('draft-update', state);
  });

  socket.on('toggle-lineup-ready', () => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    const lineup = state.activeLineups[id] || {};
    const complete = ORDERED_ROLES.every(role => lineup[role]);

    if (!state.readyPlayers.includes(id)) {
      if (!complete) return; // ne peut se déclarer prêt qu'avec une line-up complète
      state.readyPlayers.push(id);
    } else {
      state.readyPlayers = state.readyPlayers.filter(x => x !== id);
    }

    const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
    if (state.readyPlayers.length === humanCount && humanCount > 0) {
      startCardTournament();
    }
    io.emit('draft-update', state);
  });

  // Vote unanime pour enchaîner sur un nouveau tournoi de la saison (garde
  // les collections de cartes, distribue les packs de récompense).
  socket.on('continue-season', () => {
    if (state.phase !== 'simulation' || !state.champion || state.gameMode !== 'draft_cartes') return;

    if (state.continueSeasonVotes.includes(socket.id)) {
      state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);
    } else {
      state.continueSeasonVotes.push(socket.id);
    }

    const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
    if (state.continueSeasonVotes.length === humanCount && humanCount > 0) {
      awardSeasonPacks();
      state.continueSeasonVotes = [];
      state.readyPlayers = [];
      state.champion = null;
      state.bracket = [];
      state.currentRound = 0;
      state.roundComplete = false;
      state.roundReady = [];
      state.seasonRound += 1;
      state.phase = 'cards';
    }
    io.emit('draft-update', state);
  });

  // --- Événements de la draft aux enchères ---

  socket.on('place-bid', (amount) => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;
    if (isBroke(socket.id)) return; // les fauchés ne peuvent pas enchérir

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return;

    const minRequired = auction.highestBid === 0 ? auction.minBid : auction.highestBid + auction.increment;
    if (numericAmount < minRequired) return;

    const budget = state.budgets[socket.id] ?? STARTING_BUDGET;
    if (numericAmount > budget) return;

    auction.highestBid = numericAmount;
    auction.highestBidderId = socket.id;
    auction.skipVotes = []; // une nouvelle enchère annule les votes de passage en cours

    clearAuctionTimer();
    auction.deadline = Date.now() + BID_TIMER_MS;
    auctionTimer = setTimeout(() => {
      if (state.auction === auction && auction.highestBidderId) {
        assignAuctionPlayer(auction.highestBidderId, auction.highestBid);
        io.emit('draft-update', state);
      }
    }, BID_TIMER_MS);

    io.emit('draft-update', state);
  });

  // Un seul prétendant encore en lice (fauché ou non) : acquisition obligatoire.
  socket.on('acquire-forced', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || !auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;

    resolveAuctionWin(socket.id);
    io.emit('draft-update', state);
  });

  // Se retirer de l'enchère en cours pour CE joueur précis (le prix est trop
  // haut pour soi, en tant que solvable — ou on est le dernier restant et on
  // décline). En phase de secours à plusieurs fauchés, le passage se fait
  // uniquement via le vote unanime (toggle-skip-vote), pas ici.
  socket.on('withdraw-from-auction', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;

    if (auction.activeIds.length >= 2) {
      const solventActive = auction.activeIds.filter(id => !isBroke(id));
      const inRescuePhase = solventActive.length === 0;
      if (inRescuePhase) return; // les fauchés passent tous ensemble ou pas du tout
    }

    auction.activeIds = auction.activeIds.filter(id => id !== socket.id);
    auction.skipVotes = auction.skipVotes.filter(id => id !== socket.id);

    if (auction.highestBidderId === socket.id) {
      auction.highestBid = 0;
      auction.highestBidderId = null;
      auction.deadline = null;
      clearAuctionTimer();
    }

    resolveActiveIdsChange();
    io.emit('draft-update', state);
  });

  // Récupération du joueur restant : soit on est le dernier encore en lice
  // (peu importe qu'on soit fauché ou non, on a le choix), soit on est un
  // commandant fauché et tous les solvables ont déjà renoncé (course au clic).
  socket.on('claim-player', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;

    const isSoleSurvivor = auction.activeIds.length === 1 && auction.activeIds[0] === socket.id;
    if (!isSoleSurvivor) {
      if (!isBroke(socket.id)) return;
      const solventActive = auction.activeIds.filter(id => !isBroke(id));
      if (solventActive.length > 0) return; // les solvables n'ont pas encore tous renoncé
    }

    resolveAuctionWin(socket.id);
    io.emit('draft-update', state);
  });

  // Vote pour passer ce joueur, à l'unanimité du groupe concerné :
  // - en phase normale, seuls les prétendants solvables votent ;
  // - une fois que tous les solvables ont renoncé (phase de secours), ce sont
  //   les fauchés encore en lice qui votent entre eux pour écarter le lot.
  socket.on('toggle-skip-vote', () => {
    const auction = state.auction;
    if (state.phase !== 'auction' || !auction || auction.forced) return;
    if (!auction.activeIds.includes(socket.id)) return;
    if (auction.activeIds.length <= 1) return; // dernier restant : cf. soleChoice, pas de vote

    const solventActive = auction.activeIds.filter(id => !isBroke(id));
    const inRescuePhase = solventActive.length === 0;
    const amIBroke = isBroke(socket.id);

    if (inRescuePhase && !amIBroke) return;
    if (!inRescuePhase && amIBroke) return;
    if (!inRescuePhase && !auction.skipEligible) return;

    if (auction.skipVotes.includes(socket.id)) {
      auction.skipVotes = auction.skipVotes.filter(id => id !== socket.id);
    } else {
      auction.skipVotes.push(socket.id);
    }

    const votingGroup = inRescuePhase ? auction.activeIds.filter(id => isBroke(id)) : solventActive;

    if (votingGroup.length > 0 && auction.skipVotes.length === votingGroup.length) {
      if (inRescuePhase) {
        // Unanimité des fauchés encore en lice : personne n'en veut, le joueur est écarté.
        clearAuctionTimer();
        discardAuctionPlayer();
        io.emit('draft-update', state);
        return;
      }
      // Unanimité des solvables : ils sortent tous de la course, place aux fauchés.
      auction.activeIds = auction.activeIds.filter(id => isBroke(id));
      auction.skipVotes = [];
      auction.highestBid = 0;
      auction.highestBidderId = null;
      auction.deadline = null;
      clearAuctionTimer();
      resolveActiveIdsChange();
    }
    io.emit('draft-update', state);
  });

  socket.on('toggle-ready', () => {
    if (state.phase === 'tournament') {
      if (state.readyPlayers.includes(socket.id)) state.readyPlayers = state.readyPlayers.filter(id => id !== socket.id);
      else state.readyPlayers.push(socket.id);

      const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      if (state.readyPlayers.length === humanCount && humanCount > 0) {
        state.phase = 'simulation';
        state.currentRound = 0;
        state.roundComplete = false;
        state.roundReady = [];

        state.bracket[0].forEach(match => {
          if (match.teamA && !match.teamB) { match.status = 'finished'; match.winner = match.teamA; match.scoreA = GAMES_TO_WIN; match.scoreB = 0; advanceTeam(match.winner, match.nextId, match.nextSlot); }
          else if (!match.teamA && !match.teamB) { match.status = 'finished'; match.winner = null; }
        });

        const allFinished = state.bracket[0].every(m => m.status === 'finished');
        if (allFinished && !state.champion) state.roundComplete = true;
        else state.bracket[0].forEach(match => tryStartMatch(match));
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('match-ready', (matchId) => {
    const match = state.bracket.flat().find(m => m.id === matchId);
    if (!match || match.status !== 'pending') return;
    if (!match.ready.includes(socket.id)) match.ready.push(socket.id);
    tryStartMatch(match);
  });

  socket.on('dismiss-match', (matchId) => {
    const match = state.bracket.flat().find(m => m.id === matchId);
    if (match && !match.dismissedBy.includes(socket.id)) {
      match.dismissedBy.push(socket.id);
      io.emit('draft-update', state);
    }
  });

  socket.on('advance-round', () => {
    if (state.phase === 'simulation' && state.roundComplete) {

      const nextRoundMatches = state.bracket[state.currentRound + 1];
      const activeHumanIds = [];
      if (nextRoundMatches) {
        nextRoundMatches.forEach(match => {
          if (match.teamA && !match.teamA.id.startsWith('bot-')) activeHumanIds.push(match.teamA.id);
          if (match.teamB && !match.teamB.id.startsWith('bot-')) activeHumanIds.push(match.teamB.id);
        });
      }

      const allHumans = state.participants.filter(p => !p.id.startsWith('bot-')).map(p => p.id);
      const requiredVoters = activeHumanIds.length > 0 ? activeHumanIds : allHumans;

      if (requiredVoters.includes(socket.id)) {
        if (!state.roundReady.includes(socket.id)) state.roundReady.push(socket.id);
      }

      if (state.roundReady.length === requiredVoters.length) {
        state.currentRound++;
        state.roundComplete = false;
        state.roundReady = [];

        state.bracket[state.currentRound].forEach(match => {
          if (match.teamA && !match.teamB) { match.status = 'finished'; match.winner = match.teamA; match.scoreA = GAMES_TO_WIN; match.scoreB = 0; advanceTeam(match.winner, match.nextId, match.nextSlot); }
          else if (!match.teamA && !match.teamB) { match.status = 'finished'; match.winner = null; }
        });

        const allFinished = state.bracket[state.currentRound].every(m => m.status === 'finished');
        if (allFinished && !state.champion) state.roundComplete = true;
        else state.bracket[state.currentRound].forEach(match => tryStartMatch(match));
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('toggle-reset', () => {
    if (state.phase === 'simulation' && state.champion) {
      if (state.resetPlayers.includes(socket.id)) state.resetPlayers = state.resetPlayers.filter(id => id !== socket.id);
      else state.resetPlayers.push(socket.id);

      const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      if (state.resetPlayers.length === humanCount && humanCount > 0) {
        state.participants = state.participants.filter(p => !p.id.startsWith('bot-'));
        state.participants.forEach(p => p.roster = []);
        state.phase = 'lobby';
        state.gameMode = null;
        state.bracket = [];
        state.champion = null;
        state.readyPlayers = [];
        state.resetPlayers = [];
        state.turnIndex = 0;
        state.currentRound = 0;
        state.roundComplete = false;
        state.roundReady = [];
        state.auction = null;
        state.budgets = {};
        state.skippedPlayers = [];
        state.cardCollections = {};
        state.activeLineups = {};
        state.pendingPacks = {};
        state.lastOpenedPack = {};
        state.starterPackClaimed = {};
        state.seasonRound = 0;
        state.continueSeasonVotes = [];
      }
      io.emit('draft-update', state);
    }
  });

  socket.on('disconnect', () => {
    if (!socket.id.startsWith('bot-')) {
      const humansBefore = state.participants.filter(p => !p.id.startsWith('bot-')).length;
      state.participants = state.participants.filter(p => p.id !== socket.id);
      const humansAfter = state.participants.filter(p => !p.id.startsWith('bot-')).length;

      // Nettoyage des entrées individuelles du mode cartes (departing id)
      delete state.cardCollections[socket.id];
      delete state.activeLineups[socket.id];
      delete state.pendingPacks[socket.id];
      delete state.lastOpenedPack[socket.id];
      delete state.starterPackClaimed[socket.id];
      state.continueSeasonVotes = state.continueSeasonVotes.filter(id => id !== socket.id);

      if (humansAfter === 0 && humansBefore > 0) {
        state.phase = 'lobby';
        state.gameMode = null;
        state.champion = null;
        state.participants = [];
        state.resetPlayers = [];
        state.auction = null;
        state.budgets = {};
        state.skippedPlayers = [];
        state.cardCollections = {};
        state.activeLineups = {};
        state.pendingPacks = {};
        state.lastOpenedPack = {};
        state.starterPackClaimed = {};
        state.seasonRound = 0;
        state.continueSeasonVotes = [];
        clearAuctionTimer();
      } else {
        refreshAuctionAfterDisconnect();
      }
      io.emit('draft-update', state);
    }
  });

  // --- Événements du mode "Draft aux packs" ---
  /*
  // BOUTON DE TRICHE TEMPORAIRE
  socket.on('give-me-packs', () => {
    if (state.phase !== 'cards') return;
    const id = socket.id;
    // Ajoute 10 packs d'un coup au joueur qui clique
    state.pendingPacks[id] = (state.pendingPacks[id] || 0) + 10;
    io.emit('draft-update', state);
  });
  */

});

server.listen(3001, () => console.log('Serveur Esport actif sur le port 3001'));