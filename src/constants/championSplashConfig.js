/**
 * Configuration et utilitaires pour la résolution des Splash Arts de Champions en Haute Définition.
 * Supporte le chargement local, le fallback CDN Riot Data Dragon et les coordonnées de cadrage visage.
 */

export const DDRAGON_NAME_MAP = {
  Wukong: 'MonkeyKing',
  RenataGlasc: 'Renata',
  NunuWillump: 'Nunu',
  Nunu: 'Nunu',
  KhaZix: 'Khazix',
  KaiSa: 'Kaisa',
  VelKoz: 'Velkoz',
  ChoGath: 'Chogath',
  LeBlanc: 'Leblanc',
  BelVeth: 'Belveth',
  KSante: 'Ksante',
  RekSai: 'RekSai',
  DrMundo: 'DrMundo',
  JarvanIV: 'JarvanIV',
  LeeSin: 'LeeSin',
  MasterYi: 'MasterYi',
  MissFortune: 'MissFortune',
  TahmKench: 'TahmKench',
  TwistedFate: 'TwistedFate',
  XinZhao: 'XinZhao',
  AurelionSol: 'AurelionSol',
};

export const CHAMPION_SPLASH_FOCUS = {
  Aatrox: '55% 18%',
  Ahri: '55% 18%',
  Akali: '55% 18%',
  Alistar: '55% 25%',
  Ambessa: '55% 18%',
  Ashe: '55% 15%',
  Aurora: '55% 20%',
  Azir: '55% 15%',
  Bard: '55% 25%',
  Braum: '55% 18%',
  Caitlyn: '58% 15%',
  Camille: '55% 16%',
  Cassiopeia: '60% 18%',
  Corki: '52% 28%',
  Elise: '55% 16%',
  Ezreal: '55% 18%',
  Galio: '52% 15%',
  Gnar: '55% 32%',
  Gragas: '55% 22%',
  Gwen: '55% 18%',
  Jayce: '55% 15%',
  Jhin: '52% 16%',
  Jinx: '60% 18%',
  Kaisa: '55% 16%',
  Kalista: '55% 18%',
  Karma: '55% 16%',
  Kayle: '52% 28%',
  Ksante: '55% 16%',
  Leblanc: '60% 16%',
  LeeSin: '54% 18%',
  Leona: '55% 15%',
  Lillia: '55% 20%',
  Lucian: '58% 18%',
  Lulu: '55% 30%',
  Maokai: '55% 22%',
  MissFortune: '62% 16%',
  Morgana: '50% 28%',
  Nautilus: '55% 20%',
  Neeko: '55% 22%',
  Nidalee: '58% 18%',
  Nocturne: '55% 20%',
  Orianna: '56% 18%',
  Ornn: '52% 22%',
  Poppy: '55% 26%',
  Rakan: '58% 18%',
  Rell: '55% 18%',
  Renata: '55% 16%',
  Renekton: '58% 22%',
  Rumble: '55% 25%',
  Ryze: '55% 16%',
  Sejuani: '55% 18%',
  Senna: '55% 18%',
  Skarner: '55% 25%',
  Smolder: '52% 30%',
  Sylas: '55% 16%',
  Syndra: '55% 16%',
  Taliyah: '58% 20%',
  Thresh: '60% 20%',
  Tristana: '55% 28%',
  Twitch: '55% 24%',
  Udyr: '55% 18%',
  Varus: '55% 16%',
  Vi: '58% 18%',
  Viego: '55% 16%',
  Viktor: '55% 15%',
  MonkeyKing: '55% 20%',
  Wukong: '55% 20%',
  Xayah: '52% 18%',
  XinZhao: '58% 16%',
  Yone: '55% 16%',
  Zeri: '55% 18%',
  Ziggs: '55% 28%',
  Zyra: '55% 16%',
};

export const LOCAL_CHAMPION_SPLASHES = new Set([
  'Aatrox', 'Ahri', 'Akali', 'Akshan', 'Alistar', 'Ambessa', 'Amumu', 'Anivia',
  'Belveth', 'Graves', 'Kayle', 'Morgana', 'Wukong'
]);

export function getDDragonChampKey(champData) {
  if (!champData) return '';
  const cleaned = (champData.name || champData.id || '').replace(/['\s.&]/g, '');
  if (DDRAGON_NAME_MAP[cleaned]) return DDRAGON_NAME_MAP[cleaned];
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function getChampionSplashSources(champData) {
  if (!champData) return { localUrl: null, ddragonSplashUrl: null, fallbackIcon: null, focus: '56% 18%' };
  const rawName = (champData.name || champData.id || '').replace(/['\s.]/g, '');
  const ddragonKey = getDDragonChampKey(champData);
  const hasLocal = LOCAL_CHAMPION_SPLASHES.has(rawName);

  return {
    localUrl: hasLocal ? `/champions/${rawName}.jpg` : null,
    ddragonSplashUrl: ddragonKey
      ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${ddragonKey}_0.jpg`
      : null,
    fallbackIcon: champData.icon || null,
    focus: CHAMPION_SPLASH_FOCUS[ddragonKey] || CHAMPION_SPLASH_FOCUS[rawName] || '56% 18%',
  };
}
