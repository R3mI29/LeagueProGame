import { constants as fsConstants } from 'node:fs';
import { access, copyFile, mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { restoreGameState } from '../state/gameState.js';
import {
  exportPlayerSessions,
  restorePlayerSessions,
} from './playerSessionService.js';

export const SAVE_SCHEMA_VERSION = 1;
export const DEFAULT_SAVE_PATH = path.resolve(
  process.env.GAME_DATA_DIR || path.join(process.cwd(), 'data'),
  'active-game.json',
);
export const DEFAULT_SAVES_DIRECTORY = path.join(path.dirname(DEFAULT_SAVE_PATH), 'saves');

let scheduledSave = null;
let pendingSnapshot = null;
let writeQueue = Promise.resolve();

function collectMatches(gameState) {
  const matches = new Set();
  gameState.bracket?.flat().forEach(match => match && matches.add(match));
  gameState.groups?.forEach(group => {
    group.matches?.forEach(match => match && matches.add(match));
  });
  return [...matches];
}

function relinkTeamReferences(gameState) {
  const participantsById = new Map(
    gameState.participants.map(participant => [participant.id, participant]),
  );
  const resolveTeam = team => participantsById.get(team?.id) || team;

  gameState.bracket?.flat().forEach(match => {
    if (!match) return;
    match.teamA = resolveTeam(match.teamA);
    match.teamB = resolveTeam(match.teamB);
    match.winner = resolveTeam(match.winner);
  });

  gameState.groups?.forEach(group => {
    group.teams = group.teams?.map(resolveTeam) || [];
    group.qualified = group.qualified?.map(resolveTeam) || [];
    group.matches?.forEach(match => {
      match.teamA = resolveTeam(match.teamA);
      match.teamB = resolveTeam(match.teamB);
      match.winner = resolveTeam(match.winner);
    });
  });

  gameState.swissTeams?.forEach(entry => {
    entry.team = resolveTeam(entry.team);
  });
  gameState.champion = resolveTeam(gameState.champion);
}

export function isGameStateStable(gameState) {
  return collectMatches(gameState).every(match => !String(match.status).startsWith('simulating'));
}

export function createGameSnapshot(gameState, { label = null } = {}) {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    label,
    gameState: structuredClone(gameState),
    playerSessions: exportPlayerSessions(
      gameState.participants.map(participant => participant.id),
    ),
  };
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function writeSnapshot(snapshot, filePath) {
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.backup`;

  await mkdir(directory, { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });

  if (await fileExists(filePath)) {
    await copyFile(filePath, backupPath);
  }
  await rename(temporaryPath, filePath);
}

export async function persistGameSnapshot(gameState, { filePath = DEFAULT_SAVE_PATH } = {}) {
  if (!isGameStateStable(gameState)) return false;
  await writeSnapshot(createGameSnapshot(gameState), filePath);
  return true;
}

function enqueueSnapshot(snapshot, filePath) {
  writeQueue = writeQueue
    .then(() => writeSnapshot(snapshot, filePath))
    .catch(error => {
      console.error('[SAVE] Unable to persist game state:', error);
    });
  return writeQueue;
}

export function scheduleGameSnapshot(
  gameState,
  { filePath = DEFAULT_SAVE_PATH, delay = 100 } = {},
) {
  if (!isGameStateStable(gameState)) return false;

  pendingSnapshot = {
    filePath,
    value: createGameSnapshot(gameState),
  };
  if (scheduledSave) clearTimeout(scheduledSave);

  scheduledSave = setTimeout(() => {
    scheduledSave = null;
    const snapshot = pendingSnapshot;
    pendingSnapshot = null;
    if (snapshot) enqueueSnapshot(snapshot.value, snapshot.filePath);
  }, delay);
  return true;
}

async function readSnapshot(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const snapshot = JSON.parse(raw);
  if (snapshot.schemaVersion !== SAVE_SCHEMA_VERSION) {
    throw new Error(`Unsupported save schema version: ${snapshot.schemaVersion}`);
  }
  if (!snapshot.gameState || !Array.isArray(snapshot.playerSessions)) {
    throw new Error('Incomplete game save');
  }
  return snapshot;
}

function applySnapshot(gameState, snapshot) {
  restoreGameState(snapshot.gameState);
  relinkTeamReferences(gameState);
  restorePlayerSessions(snapshot.playerSessions);

  gameState.participants.forEach(participant => {
    participant.isBot = true;
    participant.isDisconnected = !participant.id.startsWith('bot-');
  });
  gameState.awaitingResumeDecision = gameState.participants.length > 0;
}

export async function loadGameSnapshot(
  gameState,
  { filePath = DEFAULT_SAVE_PATH } = {},
) {
  const candidatePaths = [filePath, `${filePath}.backup`];

  for (const candidatePath of candidatePaths) {
    if (!(await fileExists(candidatePath))) continue;

    try {
      const snapshot = await readSnapshot(candidatePath);
      applySnapshot(gameState, snapshot);

      return {
        restored: true,
        filePath: candidatePath,
        savedAt: snapshot.savedAt,
      };
    } catch (error) {
      console.error(`[SAVE] Unable to restore ${candidatePath}:`, error);
    }
  }

  return { restored: false };
}

function createSaveId(label = 'partie') {
  const slug = String(label)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'partie';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${timestamp}-${slug}.json`;
}

function getSavePath(saveId, savesDirectory) {
  if (!/^[a-zA-Z0-9._-]+\.json$/.test(saveId)) {
    throw new Error('Invalid save id');
  }
  return path.join(savesDirectory, saveId);
}

export async function archiveGameSnapshot(
  gameState,
  {
    label = 'partie',
    activeFilePath = DEFAULT_SAVE_PATH,
    savesDirectory = DEFAULT_SAVES_DIRECTORY,
  } = {},
) {
  await mkdir(savesDirectory, { recursive: true });
  const saveId = createSaveId(label);
  const destination = getSavePath(saveId, savesDirectory);

  if (isGameStateStable(gameState)) {
    await writeSnapshot(createGameSnapshot(gameState, { label }), destination);
  } else if (await fileExists(activeFilePath)) {
    await copyFile(activeFilePath, destination);
  } else {
    throw new Error('Aucune version stable de la partie ne peut être sauvegardée.');
  }

  return { saveId, label, filePath: destination };
}

export async function listGameSnapshots({
  savesDirectory = DEFAULT_SAVES_DIRECTORY,
} = {}) {
  if (!(await fileExists(savesDirectory))) return [];
  const entries = await readdir(savesDirectory, { withFileTypes: true });
  const saves = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try {
      const snapshot = await readSnapshot(getSavePath(entry.name, savesDirectory));
      saves.push({
        id: entry.name,
        label: snapshot.label,
        savedAt: snapshot.savedAt,
        phase: snapshot.gameState.phase,
        year: snapshot.gameState.year,
        eventIndex: snapshot.gameState.eventIndex,
        players: snapshot.gameState.participants
          .filter(participant => !participant.id.startsWith('bot-'))
          .map(participant => participant.name),
      });
    } catch (error) {
      console.error(`[SAVE] Unable to inspect ${entry.name}:`, error);
    }
  }

  return saves.sort((first, second) => second.savedAt.localeCompare(first.savedAt));
}

export async function loadArchivedGame(
  gameState,
  saveId,
  { savesDirectory = DEFAULT_SAVES_DIRECTORY } = {},
) {
  const filePath = getSavePath(saveId, savesDirectory);
  const snapshot = await readSnapshot(filePath);
  applySnapshot(gameState, snapshot);
  return { restored: true, filePath, savedAt: snapshot.savedAt };
}

export async function flushGameSnapshot(
  gameState,
  { filePath = DEFAULT_SAVE_PATH } = {},
) {
  if (scheduledSave) {
    clearTimeout(scheduledSave);
    scheduledSave = null;
  }

  if (isGameStateStable(gameState)) {
    pendingSnapshot = {
      filePath,
      value: createGameSnapshot(gameState),
    };
  }

  const snapshot = pendingSnapshot;
  pendingSnapshot = null;
  if (snapshot) enqueueSnapshot(snapshot.value, snapshot.filePath);
  await writeQueue;
}

export function createPersistentIo(io, gameState) {
  return {
    emit(event, ...args) {
      const result = io.emit(event, ...args);
      if (event === 'draft-update') scheduleGameSnapshot(gameState);
      return result;
    },
  };
}
