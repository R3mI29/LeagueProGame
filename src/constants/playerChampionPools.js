// src/constants/playerChampionPools.js
// Système de Champion Pools des Joueurs, Niveaux de Compétence & Progression.

import { getChampionsByRole, getChampionById } from './championsData.js';

export const MASTERY_LEVELS = {
  1: { level: 1, name: 'Apprenti', icon: '🥉', bonus: 0.0, minXp: 0, nextXp: 100 },
  2: { level: 2, name: 'Initié', icon: '🥈', bonus: 0.4, minXp: 100, nextXp: 250 },
  3: { level: 3, name: 'Maîtrisé', icon: '🥇', bonus: 0.8, minXp: 250, nextXp: 500 },
  4: { level: 4, name: 'Expert', icon: '💎', bonus: 1.2, minXp: 500, nextXp: 850 },
  5: { level: 5, name: 'Signature', icon: '👑', bonus: 1.6, minXp: 850, nextXp: null },
};

export function getMasteryInfoByXp(xp = 0) {
  if (xp >= 850) return { ...MASTERY_LEVELS[5], currentXp: xp, progress: 100 };
  if (xp >= 500) {
    const cur = xp - 500;
    const span = 850 - 500;
    return { ...MASTERY_LEVELS[4], currentXp: xp, progress: Math.min(100, Math.round((cur / span) * 100)) };
  }
  if (xp >= 250) {
    const cur = xp - 250;
    const span = 500 - 250;
    return { ...MASTERY_LEVELS[3], currentXp: xp, progress: Math.min(100, Math.round((cur / span) * 100)) };
  }
  if (xp >= 100) {
    const cur = xp - 100;
    const span = 250 - 100;
    return { ...MASTERY_LEVELS[2], currentXp: xp, progress: Math.min(100, Math.round((cur / span) * 100)) };
  }
  const cur = xp;
  const span = 100;
  return { ...MASTERY_LEVELS[1], currentXp: xp, progress: Math.min(100, Math.round((cur / span) * 100)) };
}

/**
 * Profils de champions prédéfinis pour les légendes compétitives.
 */
export const FAMOUS_PLAYER_POOLS = {
  faker: [
    { champId: 'azir', xp: 900 },
    { champId: 'leblanc', xp: 880 },
    { champId: 'ahri', xp: 600 },
    { champId: 'orianna', xp: 550 },
    { champId: 'ryze', xp: 520 },
    { champId: 'sylas', xp: 350 },
  ],
  caps: [
    { champId: 'sylas', xp: 900 },
    { champId: 'leblanc', xp: 870 },
    { champId: 'tristana', xp: 620 },
    { champId: 'ahri', xp: 530 },
    { champId: 'neeko', xp: 380 },
  ],
  chovy: [
    { champId: 'ahri', xp: 900 },
    { champId: 'azir', xp: 880 },
    { champId: 'sylas', xp: 860 },
    { champId: 'corki', xp: 600 },
    { champId: 'taliyah', xp: 540 },
  ],
  zeus: [
    { champId: 'aatrox', xp: 920 },
    { champId: 'k_sante', xp: 860 },
    { champId: 'gnar', xp: 620 },
    { champId: 'gragas', xp: 540 },
    { champId: 'kennen', xp: 510 },
  ],
  bin: [
    { champId: 'jax', xp: 920 },
    { champId: 'fiora', xp: 890 },
    { champId: 'renekton', xp: 650 },
    { champId: 'k_sante', xp: 520 },
    { champId: 'rumble', xp: 380 },
  ],
  '369': [
    { champId: 'gragas', xp: 900 },
    { champId: 'sion', xp: 860 },
    { champId: 'k_sante', xp: 650 },
    { champId: 'renekton', xp: 550 },
    { champId: 'aatrox', xp: 400 },
  ],
  canyon: [
    { champId: 'lee_sin', xp: 920 },
    { champId: 'nidalee', xp: 900 },
    { champId: 'graves', xp: 860 },
    { champId: 'karthus', xp: 580 },
    { champId: 'sejuani', xp: 520 },
  ],
  oner: [
    { champId: 'lee_sin', xp: 900 },
    { champId: 'viego', xp: 650 },
    { champId: 'sejuani', xp: 580 },
    { champId: 'xin_zhao', xp: 520 },
    { champId: 'poppy', xp: 380 },
  ],
  tarzan: [
    { champId: 'sejuani', xp: 880 },
    { champId: 'lee_sin', xp: 620 },
    { champId: 'vi', xp: 550 },
    { champId: 'maokai', xp: 520 },
  ],
  kanavi: [
    { champId: 'belveth', xp: 900 },
    { champId: 'viego', xp: 640 },
    { champId: 'wukong', xp: 580 },
    { champId: 'graves', xp: 530 },
  ],
  tian: [
    { champId: 'viego', xp: 880 },
    { champId: 'lee_sin', xp: 640 },
    { champId: 'sejuani', xp: 580 },
    { champId: 'elise', xp: 520 },
  ],
  rookie: [
    { champId: 'orianna', xp: 900 },
    { champId: 'syndra', xp: 880 },
    { champId: 'leblanc', xp: 600 },
    { champId: 'yasuo', xp: 520 },
  ],
  scout: [
    { champId: 'azir', xp: 900 },
    { champId: 'syndra', xp: 650 },
    { champId: 'viktor', xp: 580 },
    { champId: 'zoe', xp: 510 },
  ],
  knight: [
    { champId: 'ahri', xp: 900 },
    { champId: 'syndra', xp: 860 },
    { champId: 'sylas', xp: 600 },
    { champId: 'annie', xp: 520 },
  ],
  ruler: [
    { champId: 'zeri', xp: 920 },
    { champId: 'kai_sa', xp: 890 },
    { champId: 'ezreal', xp: 640 },
    { champId: 'varus', xp: 580 },
    { champId: 'xayah', xp: 540 },
  ],
  viper: [
    { champId: 'lucian', xp: 900 },
    { champId: 'aphelios', xp: 880 },
    { champId: 'kai_sa', xp: 620 },
    { champId: 'ezreal', xp: 550 },
    { champId: 'varus', xp: 520 },
  ],
  gumayusi: [
    { champId: 'varus', xp: 920 },
    { champId: 'caitlyn', xp: 890 },
    { champId: 'draven', xp: 640 },
    { champId: 'lucian', xp: 580 },
    { champId: 'xayah', xp: 540 },
  ],
  jackeylove: [
    { champId: 'draven', xp: 930 },
    { champId: 'kai_sa', xp: 880 },
    { champId: 'lucian', xp: 620 },
    { champId: 'varus', xp: 560 },
    { champId: 'ezreal', xp: 520 },
  ],
  deft: [
    { champId: 'ezreal', xp: 900 },
    { champId: 'caitlyn', xp: 640 },
    { champId: 'varus', xp: 580 },
    { champId: 'ashe', xp: 550 },
    { champId: 'sivir', xp: 520 },
  ],
  caliste: [
    { champId: 'draven', xp: 890 },
    { champId: 'kalista', xp: 620 },
    { champId: 'lucian', xp: 580 },
    { champId: 'zeri', xp: 520 },
  ],
  keria: [
    { champId: 'thresh', xp: 920 },
    { champId: 'bard', xp: 890 },
    { champId: 'nautilus', xp: 620 },
    { champId: 'lux', xp: 560 },
    { champId: 'tahm_kench', xp: 520 },
  ],
  mikyx: [
    { champId: 'gragas', xp: 890 },
    { champId: 'nautilus', xp: 640 },
    { champId: 'rakan', xp: 580 },
    { champId: 'leona', xp: 540 },
    { champId: 'bard', xp: 500 },
  ],
  meiko: [
    { champId: 'thresh', xp: 900 },
    { champId: 'alistar', xp: 640 },
    { champId: 'braum', xp: 580 },
    { champId: 'nautilus', xp: 530 },
  ],
  crisp: [
    { champId: 'nautilus', xp: 910 },
    { champId: 'rakan', xp: 620 },
    { champId: 'leona', xp: 580 },
    { champId: 'thresh', xp: 530 },
  ],
  lehends: [
    { champId: 'singed', xp: 920 },
    { champId: 'blitzcrank', xp: 640 },
    { champId: 'nautilus', xp: 580 },
    { champId: 'alistar', xp: 520 },
  ],
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Récupère ou génère le pool de champions d'une carte joueur.
 * Intègre la mémoire d'apprentissage (state.championMastery).
 */
export function getPlayerChampionPool(card, championMasteryState = {}) {
  if (!card) return [];

  const baseKey = (card.baseName || card.name || '').trim().toLowerCase();
  const cardId = card.id || baseKey;
  const role = card.role || 'Mid';

  // 1. Initialiser le pool de base
  let initialList = [];
  if (FAMOUS_PLAYER_POOLS[baseKey]) {
    initialList = FAMOUS_PLAYER_POOLS[baseKey].map(item => ({ ...item }));
  } else {
    // Générer un pool procédural cohérent avec son rôle
    const candidates = getChampionsByRole(role);
    const count = Math.min(5, candidates.length);
    const hash = hashString(`${cardId}-${role}`);

    const selected = [];
    for (let i = 0; i < count; i++) {
      const idx = (hash + i * 7) % candidates.length;
      const c = candidates[idx];
      if (!selected.some(s => s.id === c.id)) {
        selected.push(c);
      }
    }

    // Niveaux de départ : 1 maître (lvl 3 / 260 XP), 2 initiés (lvl 2 / 120 XP), 2 apprentis (lvl 1 / 20 XP)
    const xpDistribution = [280, 160, 120, 40, 20];
    initialList = selected.map((c, i) => ({
      champId: c.id,
      xp: xpDistribution[i] || 20,
    }));
  }

  // 2. Fusionner avec la progression en mémoire (championMasteryState)
  const masteryKey = card.baseName || card.id;
  const dynamicMap = championMasteryState[masteryKey] || (card.id ? championMasteryState[card.id] : {}) || {};

  const fullPool = initialList.map(item => {
    const override = dynamicMap[item.champId];
    const totalXp = override?.xp !== undefined ? override.xp : item.xp;
    const champ = getChampionById(item.champId);
    const mastery = getMasteryInfoByXp(totalXp);
    return {
      champId: item.champId,
      champion: champ,
      xp: totalXp,
      mastery,
    };
  });

  // Ajouter les champions appris en scrim qui n'étaient pas dans le pool initial
  for (const [champId, data] of Object.entries(dynamicMap)) {
    if (!fullPool.some(p => p.champId === champId)) {
      const champ = getChampionById(champId);
      const mastery = getMasteryInfoByXp(data.xp || 0);
      fullPool.push({
        champId,
        champion: champ,
        xp: data.xp || 0,
        mastery,
      });
    }
  }

  // Trier par niveau de maîtrise et XP décroissants
  fullPool.sort((a, b) => b.xp - a.xp);

  return fullPool;
}
