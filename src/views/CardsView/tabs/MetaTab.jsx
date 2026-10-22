import React, { useState, useEffect } from 'react';
import { socket } from '../../../api/socket';
import {
  META_TARGET_POINTS,
  CHAMPION_META_TARGET_POINTS,
  CHAMPION_META_TIERS,
  CHAMPION_META_TIER_ORDER,
  getChampionMetaTier,
  isChampionDecrypted,
  getChampionDecryptionPoints,
} from '../../../constants/metaConfig';
import { ORDERED_ROLES } from '../../../constants/roles';
import { ALL_CHAMPIONS, getChampionsByRole, getChampionById } from '../../../constants/championsData';
import { getPlayerChampionPool } from '../../../constants/playerChampionPools';
import { CARD_POOL } from '../../../constants/cardPlayers';

export const SCRIM_FOCUSES = {
  laning: { label: 'Laning Phase', emoji: '⚔️', desc: '+50% XP champions (solo laners)', color: '#38BDF8' },
  teamfight: { label: 'Teamfight', emoji: '⚡', desc: '+30% XP global +20% décryptage méta', color: '#FF6B35' },
  vision: { label: 'Contrôle Vision', emoji: '👁️', desc: '+20% méta ligue +40% décryptage', color: '#A78BFA' },
  drafting: { label: 'Drafting', emoji: '📋', desc: '+80% décryptage champion méta', color: '#D4AF37' },
  meta_study: { label: 'Étude Méta', emoji: '🔬', desc: '+150% points méta ligue', color: '#00E676' },
};

export default function MetaTab({ state, myId }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedOpponentId, setSelectedOpponentId] = useState(null);
  const [isOpponentLocked, setIsOpponentLocked] = useState(false);

  // Configuration de l'entraînement des Champions en Scrim
  const [trainingPicks, setTrainingPicks] = useState({});
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [rolePickingForTraining, setRolePickingForTraining] = useState(null);
  const [champSearchTerm, setChampSearchTerm] = useState('');

  // Nouveaux états de Scrims : Focus stratégique & Durée
  const [scrimFocus, setScrimFocus] = useState('laning');
  const [scrimDuration, setScrimDuration] = useState('full');

  // Filtre de rôle pour la Tierlist de Méta des Champions
  const [tierlistRoleFilter, setTierlistRoleFilter] = useState('ALL');

  const knowledge = state?.metaKnowledge?.[myId] || {
    points: 0,
    scrimsAvailable: 3,
    discoveredClues: [],
    observations: [],
    championKnowledge: {},
    lastScrimResult: null,
  };

  const yearlyMeta = state?.yearlyMeta;
  const points = Math.min(META_TARGET_POINTS, knowledge.points || 0);
  // Calcul 50% Méta Ligue + 50% Méta Champions jouables
  const championKnowledge = knowledge.championKnowledge || {};
  const leaguePart = ((Math.min(META_TARGET_POINTS, knowledge.points || 0)) / META_TARGET_POINTS) * 50;
  const maxChampPoints = ALL_CHAMPIONS.length * CHAMPION_META_TARGET_POINTS;
  const totalChampPoints = ALL_CHAMPIONS.reduce((acc, c) => acc + Math.min(CHAMPION_META_TARGET_POINTS, championKnowledge[c.id] || 0), 0);
  const champPart = maxChampPoints > 0 ? (totalChampPoints / maxChampPoints) * 50 : 0;
  const percent = Math.min(100, Math.round(leaguePart + champPart));
  const scrimsAvailable = knowledge.scrimsAvailable ?? 3;

  // Ajustement automatique de la durée si seul le format rapide est abordable
  useEffect(() => {
    if (scrimsAvailable < 1 && scrimsAvailable >= 0.5 && scrimDuration === 'full') {
      setScrimDuration('quick');
    }
  }, [scrimsAvailable, scrimDuration]);

  const lineup = state?.activeLineups?.[myId] || {};
  const isLineupComplete = ORDERED_ROLES.every(role => lineup[role]);

  const isLeagueMetaDiscovered = (points >= 100) || knowledge.discoveredClues?.some(c => c.threshold === 100);

  // Résolution de la carte titulaire pour le rôle
  const getCardForRole = (role) => {
    const cardId = lineup[role];
    if (!cardId) return null;
    return CARD_POOL.find(c => c.id === cardId) || null;
  };

  // Initialisation des choix d'entraînement par défaut (pré-lock ou 1er champion du joueur)
  useEffect(() => {
    if (isLineupComplete) {
      const initialPicks = {};
      ORDERED_ROLES.forEach(role => {
        const card = getCardForRole(role);
        const prelocked = state.prelockedChampions?.[myId]?.[role];
        if (prelocked) {
          initialPicks[role] = prelocked;
        } else if (card) {
          const pool = getPlayerChampionPool(card, state?.championMastery);
          if (pool.length > 0) {
            initialPicks[role] = pool[0].champId;
          }
        }
      });
      setTrainingPicks(prev => ({ ...initialPicks, ...prev }));
    }
  }, [isLineupComplete, myId]);

  // Liste des adversaires disponibles
  const allOpponents = (state?.participants || []).filter(p => p.id !== myId);
  const currentOpponent = allOpponents.find(o => o.id === selectedOpponentId) || allOpponents[0];
  const activeOpponentId = currentOpponent?.id;

  // Verrouillage de l'adversaire : ouvre automatiquement le menu de configuration de l'entraînement
  const handleToggleLockOpponent = () => {
    if (scrimsAvailable < 0.5) return;
    const nextLocked = !isOpponentLocked;
    setIsOpponentLocked(nextLocked);
    if (nextLocked) {
      setIsTrainingModalOpen(true);
    }
  };

  const handleLaunchScrim = () => {
    const cost = scrimDuration === 'quick' ? 0.5 : 1;
    if (scrimsAvailable < cost || !isLineupComplete || !isOpponentLocked || isSimulating) return;
    setIsSimulating(true);
    socket.emit('run-scrim', {
      opponentId: activeOpponentId,
      trainingPicks,
      focus: scrimFocus,
      duration: scrimDuration,
    });
    setTimeout(() => {
      setIsSimulating(false);
      setIsTrainingModalOpen(false);
    }, 700);
  };

  // Statistiques de décryptage des champions
  const decryptedChampionsCount = ALL_CHAMPIONS.filter(c => (championKnowledge[c.id] || 0) >= CHAMPION_META_TARGET_POINTS).length;
  const inProgressChampions = ALL_CHAMPIONS.filter(c => {
    const pts = championKnowledge[c.id] || 0;
    return pts > 0 && pts < CHAMPION_META_TARGET_POINTS;
  });

  return (
    <div className="flex flex-col gap-4 animate-[fadeIn_0.2s]">
      {/* 1. BARRE DE DÉCRYPTAGE GLOBALE (50% Ligue + 50% Champions) */}
      <div className="bg-[#11141E] border border-[#222838] rounded-xl p-5">
        <div className="flex justify-between items-center gap-3 mb-3">
          <div>
            <div className="text-[11px] font-bold text-accent-blue-light uppercase tracking-wider">
              Saison {state?.year || 1} • 50% Méta Ligue + 50% Méta Champions
            </div>
            <h2 className="font-rajdhani text-2xl font-bold text-white m-0 tracking-wide">
              DÉCRYPTAGE GLOBAL DE LA MÉTA
            </h2>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-3xl font-bold text-[#D4AF37] font-rajdhani">{percent}%</span>
            <span className="text-[11px] text-text-faint font-semibold">
              Ligue : {Math.round(leaguePart * 2)}% / 50% • Champions : {Math.round(champPart * 2)}% / 50%
            </span>
          </div>
        </div>

        {/* Jauge globale */}
        <div className="w-full bg-[#0A0D14] h-3 rounded-full overflow-hidden border border-border p-0.5">
          <div
            className="h-full bg-gradient-to-r from-accent-blue via-[#7289da] to-accent-green transition-all duration-500 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* === LAYOUT PRINCIPAL 2 COLONNES === */}
      <div className="grid grid-cols-[1fr_400px] gap-4 items-start">
        {/* COLONNE GAUCHE : Scrims */}
        <div className="flex flex-col gap-4">
          {/* Section Scrims */}
          <div className="bg-[#11141E] border border-[#222838] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="font-rajdhani text-2xl font-bold text-white m-0 tracking-wide">
                  SCRIMS D'ENTRAÎNEMENT & ANALYSE
                </h3>
                <p className="text-xs text-text-muted mt-1 m-0">
                  Verrouillez un adversaire, configurez votre focus et vos champions à entraîner. Lancez des manches rapides ou des séries complètes pour décrypter la méta et faire progresser vos joueurs.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                {/* Toggle format : rapide / série */}
                <div className="flex items-center gap-1 bg-[#090C13] border border-[#1C2335] rounded-full p-0.5">
                  <button
                    type="button"
                    onClick={() => setScrimDuration('quick')}
                    disabled={scrimsAvailable < 0.5}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      scrimDuration === 'quick'
                        ? 'bg-[#38BDF8] text-black'
                        : 'text-text-faint hover:text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    ⚡ Rapide (-0.5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScrimDuration('full')}
                    disabled={scrimsAvailable < 1}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      scrimDuration === 'full'
                        ? 'bg-[#D4AF37] text-black'
                        : 'text-text-faint hover:text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    ▶▶ Série (-1)
                  </button>
                </div>

                {/* Affichage des Scrims disponibles : barre de progression et slots */}
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0A0D14] border border-[#222838] shrink-0">
                  <span className="text-white flex items-center gap-1.5">
                    <span>🎯</span>
                    <span className="hidden sm:inline">Disponibles :</span>
                  </span>
                  <div className="flex items-center gap-1" title={`${scrimsAvailable}/3 scrims restants`}>
                    {[1, 2, 3].map(slot => {
                      const fill = Math.max(0, Math.min(1, scrimsAvailable - (slot - 1)));
                      return (
                        <div key={slot} className="w-5 h-2.5 bg-[#141A28] rounded-sm overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-accent-green transition-all"
                            style={{ width: `${fill * 100}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <span className="font-rajdhani text-sm font-bold text-[#D4AF37]">
                    {scrimsAvailable} / 3
                  </span>
                </div>
              </div>
            </div>

            {/* Grille de sélection des adversaires (NOTES ET TIERS CACHÉS) */}
            {allOpponents.length > 0 ? (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-faint">
                    Adversaires Disponibles ({allOpponents.length}) :
                  </span>
                  <span className="text-[11px] text-text-faint italic">
                    Niveau masqué — Fiez-vous à leurs résultats en compétition
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 border border-border/50 rounded-lg bg-[#0A0D14]">
                  {allOpponents.map(opp => {
                    const isSelected = (opp.id === activeOpponentId);

                    return (
                      <button
                        key={opp.id}
                        disabled={isOpponentLocked || scrimsAvailable < 0.5}
                        onClick={() => setSelectedOpponentId(opp.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? isOpponentLocked
                              ? 'bg-[#1b2219] border-accent-green text-white shadow-[0_0_10px_rgba(0,230,118,0.2)]'
                              : 'bg-[#1B2234] border-accent-blue text-white shadow-[0_0_8px_rgba(76,96,210,0.3)]'
                            : 'bg-[#0E121B] border-border text-text-muted hover:border-accent-blue/40 hover:text-white'
                        } ${isOpponentLocked && !isSelected ? 'opacity-35 cursor-not-allowed' : ''}`}
                      >
                        {opp.logo ? (
                          <img src={opp.logo} alt="" className="w-7 h-7 object-contain shrink-0" />
                        ) : (
                          <div className="w-7 h-7 bg-border rounded shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold truncate leading-tight text-white font-rajdhani">{opp.name}</div>
                          <div className="text-[10px] text-text-faint font-semibold mt-0.5">[{opp.tag}]</div>
                        </div>
                        {isSelected && (
                          <span className="text-xs shrink-0">{isOpponentLocked ? '🔒' : '✓'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bouton de Lock de l'adversaire & Déclencheur du menu d'entraînement */}
                <div className="flex items-center justify-between gap-3 mt-3 pt-2">
                  <div className="text-xs text-text-faint">
                    {!isOpponentLocked ? (
                      <span>👉 Sélectionnez une franchise puis verrouillez-la pour configurer l'entraînement.</span>
                    ) : (
                      <span className="text-accent-green font-semibold">
                        🔒 Adversaire verrouillé : {currentOpponent?.name} [{currentOpponent?.tag}]
                      </span>
                    )}
                  </div>

                  {scrimsAvailable >= 0.5 && (
                    <div className="flex items-center gap-2">
                      {isOpponentLocked && (
                        <button
                          type="button"
                          onClick={() => setIsTrainingModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/50 cursor-pointer transition-all"
                        >
                          🎯 Configurer les Champions
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleToggleLockOpponent}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isOpponentLocked
                            ? 'bg-[#1C212E] hover:bg-[#252E44] text-text-muted border border-border'
                            : 'bg-accent-blue hover:bg-accent-blue/80 text-white shadow-md'
                        }`}
                      >
                        {isOpponentLocked ? '🔓 Changer d’adversaire' : '🔒 Verrouiller & Configurer'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-faint italic mb-4">
                Génération des équipes adverses en cours...
              </p>
            )}

            {/* Choix du Focus d'entraînement */}
            <div className="p-3.5 rounded-xl bg-[#090C13] border border-[#1C2335] flex flex-col gap-2.5 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-accent-blue-light uppercase tracking-wider">
                  FOCUS D'ENTRAÎNEMENT
                </span>
                <span className="text-xs text-text-faint">
                  Orientez vos gains d'expérience et d'analyse méta
                </span>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Object.entries(SCRIM_FOCUSES).map(([key, config]) => {
                  const isSelected = scrimFocus === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setScrimFocus(key)}
                      title={config.desc}
                      className="flex-1 min-w-[90px] px-2 py-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer"
                      style={{
                        borderColor: isSelected ? config.color : '#1C2335',
                        backgroundColor: isSelected ? `${config.color}18` : '#090C13',
                        boxShadow: isSelected ? `0 0 14px ${config.color}35` : 'none',
                      }}
                    >
                      <span className="text-xl leading-none">{config.emoji}</span>
                      <span
                        className="text-[10px] font-black uppercase tracking-wide font-rajdhani leading-tight"
                        style={{ color: isSelected ? config.color : '#94A3B8' }}
                      >
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Description détaillée sous le focus actif */}
              <div className="flex items-center gap-2 pt-1.5 text-xs text-text-muted border-t border-white/5">
                <span className="font-semibold text-white">Effet actif :</span>
                <span style={{ color: SCRIM_FOCUSES[scrimFocus]?.color }} className="font-semibold">
                  {SCRIM_FOCUSES[scrimFocus]?.emoji} {SCRIM_FOCUSES[scrimFocus]?.label}
                </span>
                <span>—</span>
                <span className="text-text-faint">{SCRIM_FOCUSES[scrimFocus]?.desc}</span>
              </div>
            </div>

            {/* Ligne de lancement du Scrim */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border">
              <div className="text-xs text-text-faint">
                {!isLineupComplete 
                  ? '⚠️ 5 titulaires requis dans l’effectif.' 
                  : !isOpponentLocked 
                    ? '⚠️ Veuillez verrouiller un adversaire ci-dessus avant de lancer.' 
                    : scrimsAvailable < (scrimDuration === 'quick' ? 0.5 : 1)
                      ? 'Prochains créneaux disponibles après le prochain tournoi.' 
                      : `Prêt à affronter ${currentOpponent?.name} [${currentOpponent?.tag}] (${scrimDuration === 'quick' ? '1 manche rapide' : 'série de 5 manches'}).`}
              </div>

              <button
                onClick={handleLaunchScrim}
                disabled={scrimsAvailable < (scrimDuration === 'quick' ? 0.5 : 1) || !isLineupComplete || !isOpponentLocked || isSimulating}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                  scrimsAvailable >= (scrimDuration === 'quick' ? 0.5 : 1) && isLineupComplete && isOpponentLocked && !isSimulating
                    ? 'bg-[#D4AF37] hover:bg-[#e2bd46] text-black cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                    : 'bg-[#222838] text-text-faint cursor-not-allowed opacity-60'
                }`}
              >
                {isSimulating ? 'Simulation en cours…' : scrimDuration === 'quick' ? 'Lancer le Scrim Rapide (1 Match)' : 'Lancer la Série (5 Matchs)'}
              </button>
            </div>
          </div>

          {/* Résultat du dernier scrim (Timeline des manches, Focus & Champions entraînés) */}
          {knowledge.lastScrimResult && (
            <div className="p-4 rounded-xl bg-[#11141E] border border-[#222838] text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Scrim vs {knowledge.lastScrimResult.opponentName} :</span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase font-rajdhani tracking-wider ${
                      knowledge.lastScrimResult.won ? 'bg-accent-green/20 text-accent-green border border-accent-green/40' : 'bg-[#ef5350]/20 text-[#ef5350] border border-[#ef5350]/40'
                    }`}>
                      {knowledge.lastScrimResult.seriesScore
                        ? `${knowledge.lastScrimResult.won ? 'Victoire' : 'Défaite'} (${knowledge.lastScrimResult.seriesScore})`
                        : (knowledge.lastScrimResult.won ? 'Victoire' : 'Défaite')}
                    </span>
                    <span className="text-[11px] text-text-faint font-semibold">
                      • {knowledge.lastScrimResult.duration === 1 ? '1 partie rapide' : 'Série de 5 manches'}
                    </span>
                  </div>
                  <div className="text-text-muted mt-1 text-[11px]">
                    Efficacité d'apprentissage indexée sur le score et le focus stratégique choisi.
                  </div>
                </div>

                {knowledge.lastScrimResult.newClue && (
                  <span className="text-[#D4AF37] font-semibold shrink-0">
                    ✨ Nouvel indice découvert !
                  </span>
                )}
              </div>

              {/* Focus appliqué et son effet */}
              {knowledge.lastScrimResult.focus && SCRIM_FOCUSES[knowledge.lastScrimResult.focus] && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-[#0E131F] border border-[#1E273D] flex items-center gap-2 text-xs">
                  <span className="text-text-faint">🎯 Focus appliqué :</span>
                  <span
                    className="font-bold flex items-center gap-1 font-rajdhani"
                    style={{ color: SCRIM_FOCUSES[knowledge.lastScrimResult.focus].color }}
                  >
                    <span>{SCRIM_FOCUSES[knowledge.lastScrimResult.focus].emoji}</span>
                    <span>{SCRIM_FOCUSES[knowledge.lastScrimResult.focus].label}</span>
                  </span>
                  <span className="text-text-faint">—</span>
                  <span className="text-text-muted">{SCRIM_FOCUSES[knowledge.lastScrimResult.focus].desc}</span>
                </div>
              )}

              {/* Mini-timeline des parties jouées */}
              {knowledge.lastScrimResult.games && knowledge.lastScrimResult.games.length > 0 && (
                <div className="mb-3 pt-3 border-t border-[#1C2232]">
                  <div className="text-[11px] font-bold text-accent-blue-light uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Détail des Parties ({knowledge.lastScrimResult.games.length})</span>
                    <span className="text-[10px] text-text-faint">
                      Score : {knowledge.lastScrimResult.seriesScore}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {knowledge.lastScrimResult.games.map((g, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                          g.winner === 'user'
                            ? 'bg-accent-green/5 border-accent-green/30 text-white'
                            : 'bg-[#ef5350]/5 border-[#ef5350]/30 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              g.winner === 'user' ? 'bg-accent-green text-black' : 'bg-[#ef5350] text-white'
                            }`}
                          >
                            {g.winner === 'user' ? '✓' : '✗'}
                          </span>
                          <span className="font-rajdhani font-bold text-xs uppercase">
                            Partie {idx + 1} • {g.winner === 'user' ? 'Victoire' : 'Défaite'}
                          </span>
                          <span className="text-[10px] text-text-faint font-semibold">
                            ({g.duration || g.gameDuration || 30} min)
                          </span>
                          {g.dominant && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                              Écrasante (+5k)
                            </span>
                          )}
                        </div>
                        {g.focusEvent && (
                          <span className="text-[11px] text-text-faint italic truncate max-w-md">
                            {g.focusEvent}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Champions entraînés pendant la série */}
              {knowledge.lastScrimResult.trainedChampions && knowledge.lastScrimResult.trainedChampions.length > 0 && (
                <div className="pt-3 border-t border-[#1C2232]">
                  <div className="text-[11px] font-bold text-accent-blue-light uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Résultats de l'Entraînement des Champions (+{knowledge.lastScrimResult.trainedChampions[0]?.gainedXp || 120} XP)</span>
                    <span className="text-[10px] text-text-faint">Décryptage & Maîtrise</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {knowledge.lastScrimResult.trainedChampions.map(tc => (
                      <div key={tc.role} className={`p-2.5 rounded-lg border text-center flex flex-col items-center gap-1 ${
                        tc.levelUp || tc.isDecrypted ? 'bg-accent-green/10 border-accent-green/40 shadow-[0_0_8px_rgba(0,230,118,0.2)]' : 'bg-[#0E121B] border-border'
                      }`}>
                        <div className="text-[10px] text-text-faint font-semibold uppercase">{tc.role} • {tc.cardName}</div>
                        {tc.champIcon ? (
                          <img src={tc.champIcon} alt="" className="w-8 h-8 rounded object-cover border border-white/10" />
                        ) : (
                          <span>🛡️</span>
                        )}
                        <div className="text-[12px] font-bold text-white truncate max-w-full font-rajdhani">{tc.champName}</div>
                        
                        {/* Gain de Décryptage */}
                        <div className="text-[10px] font-semibold text-[#D4AF37]">
                          +{tc.gainedChampPoints || 4} pts décryptage ({tc.totalDecryptionPoints || 0}/10)
                        </div>

                        {/* Tier révélé si 10/10 pts atteints */}
                        {tc.isDecrypted && tc.metaTier && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green border border-accent-green/40">
                            {tc.metaTier.label} ({tc.metaTier.bonus >= 0 ? '+' : ''}{tc.metaTier.bonus})
                          </span>
                        )}

                        {/* Nouveau champion appris */}
                        {tc.isNewlyLearned && (
                          <span className="text-[9px] font-bold text-[#38BDF8] uppercase">
                            ✨ Champion Appris !
                          </span>
                        )}

                        <div className="text-[10px] text-text-muted mt-0.5">
                          {tc.levelUp ? (
                            <span className="text-accent-green font-bold animate-pulse">
                              LEVEL UP ! (Nv. {tc.newLevel})
                            </span>
                          ) : (
                            <span>Nv. {tc.newLevel}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. HISTORIQUE D'ANALYSE & INDICES */}
          <div className="bg-[#11141E] border border-[#222838] rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-text-faint">
                Historique d'Analyse & Indices
              </div>
              <span className="text-[11px] text-text-faint">
                {knowledge.observations?.length || 0} note(s)
              </span>
            </div>

            {(!knowledge.observations || knowledge.observations.length === 0) ? (
              <p className="text-xs text-text-faint italic m-0 py-2">
                Aucune note d'analyse pour le moment. Disputez des tournois ou des scrims pour consigner vos rapports.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {knowledge.observations.map(obs => {
                  if (obs.isClue) {
                    return (
                      <div 
                        key={obs.id} 
                        className={`p-3.5 rounded-lg border flex items-start gap-3 transition-all ${
                          obs.isMetaDiscovery
                            ? 'bg-gradient-to-r from-[#172d1f] to-[#101e15] border-accent-green shadow-[0_0_15px_rgba(0,230,118,0.2)] text-white'
                            : 'bg-gradient-to-r from-[#2a2412] to-[#18150c] border-[#D4AF37]/60 shadow-[0_0_12px_rgba(212,175,55,0.18)] text-white'
                        }`}
                      >
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          obs.isMetaDiscovery 
                            ? 'bg-accent-green text-black' 
                            : 'bg-[#D4AF37] text-black'
                        }`}>
                          {obs.source || 'INDICE'}
                        </span>
                        <div className="flex-1 text-xs font-semibold leading-relaxed">
                          {obs.text}
                        </div>
                        <span className="text-[10px] text-text-faint shrink-0 pt-0.5">
                          {obs.timestamp}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={obs.id} 
                      className="p-2.5 rounded-lg bg-[#0A0D14] border border-[#202738] flex items-start gap-2.5 text-xs text-text-muted hover:border-accent-blue/30 transition-colors"
                    >
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        obs.source === 'Scrim' 
                          ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30' 
                          : 'bg-white/5 text-text-faint border border-white/10'
                      }`}>
                        {obs.source}
                      </span>
                      <span className="flex-1 leading-relaxed text-[#D2D8E6]">
                        {obs.text}
                      </span>
                      <span className="text-[10px] text-text-faint shrink-0 pt-0.5">
                        {obs.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : Méta Info */}
        <div className="flex flex-col gap-4 sticky top-4">
          {/* 2. ENCADRÉ UNIQUE : MÉTA RÉGIONALE / LIGUE */}
          <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
            isLeagueMetaDiscovered
              ? 'bg-gradient-to-r from-[#132219] via-[#0f1d14] to-[#132219] border-accent-green/60 shadow-[0_0_20px_rgba(0,230,118,0.15)]'
              : 'bg-[#11141E] border-[#222838]'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shrink-0 ${
                isLeagueMetaDiscovered
                  ? 'bg-accent-green/20 border-accent-green/40 text-accent-green'
                  : 'bg-[#1A202E] border-border text-text-faint'
              }`}>
                {isLeagueMetaDiscovered ? '🏆' : '🔒'}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-accent-blue-light">
                  Méta Régionale / Ligue
                </div>
                <div className="text-xl font-bold text-white mt-0.5">
                  {isLeagueMetaDiscovered 
                    ? `Ligue dominante : ${yearlyMeta?.metaLeague}` 
                    : 'Ligue non identifiée'}
                </div>
                <p className="text-xs text-text-faint m-0 mt-0.5">
                  {isLeagueMetaDiscovered
                    ? 'Les joueurs de cette ligue confèrent un bonus de synergie en match (+0.3 par joueur aligné).'
                    : 'Expérimentez vos compositions en tournoi et en scrim pour déchiffrer la méta.'}
                </p>
              </div>
            </div>

            {isLeagueMetaDiscovered ? (
              <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-accent-green/20 text-accent-green border border-accent-green/40 shrink-0">
                {yearlyMeta?.metaLeague} Activée
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#1C212E] text-text-faint border border-border shrink-0">
                Verrouillé (100%)
              </span>
            )}
          </div>

          {/* 3. TIERLIST DE LA MÉTA DES CHAMPIONS (10 PTS PAR CHAMPION) */}
          <div className="bg-[#11141E] border border-[#222838] rounded-xl p-5">
            <div className="flex flex-col justify-between items-start gap-3 mb-4">
              <div>
                <div className="text-[11px] font-bold text-accent-blue-light uppercase tracking-wider">
                  Analyse Stratégique de la Saison
                </div>
                <h3 className="font-rajdhani text-2xl font-bold text-white m-0 tracking-wide">
                  TIERLIST DE LA MÉTA DES CHAMPIONS
                </h3>
                <p className="text-xs text-text-muted mt-1 m-0">
                  Chaque champion a un niveau d'impact (BROKEN à HORRIBLE). Jouez des scrims et des tournois pour accumuler les <strong>10 points</strong> requis afin de révéler officiellement leur tier.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#0A0D14] px-3.5 py-2 rounded-lg border border-border shrink-0">
                <span className="text-xs text-text-faint font-semibold">Décryptés :</span>
                <span className="text-sm font-bold text-[#D4AF37] font-rajdhani">
                  {decryptedChampionsCount} / {ALL_CHAMPIONS.length}
                </span>
                <span className="text-xs text-text-faint">
                  ({Math.round((decryptedChampionsCount / ALL_CHAMPIONS.length) * 100)}%)
                </span>
              </div>
            </div>

            {/* Filtres de rôle pour la Tierlist */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
              {['ALL', ...ORDERED_ROLES].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTierlistRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tierlistRoleFilter === role
                      ? 'bg-accent-blue text-white shadow-sm'
                      : 'bg-[#151923] text-text-faint hover:bg-[#1E2433] hover:text-white'
                  }`}
                >
                  {role === 'ALL' ? 'Tous les Rôles' : role}
                </button>
              ))}
            </div>

            {/* Grille des 7 Tiers de la Méta */}
            <div className="flex flex-col gap-2.5">
              {CHAMPION_META_TIER_ORDER.map(tierKey => {
                const tierConfig = CHAMPION_META_TIERS[tierKey];

                // Champions appartenant à ce tier ET dont le décryptage est complet (>= 10 pts)
                const champsInTier = ALL_CHAMPIONS.filter(c => {
                  if (tierlistRoleFilter !== 'ALL' && !c.roles?.includes(tierlistRoleFilter)) return false;
                  const targetRole = tierlistRoleFilter !== 'ALL' ? tierlistRoleFilter : (c.primaryRole || c.roles?.[0]);
                  const metaTier = getChampionMetaTier(c.id, targetRole, yearlyMeta);
                  if (metaTier?.tier !== tierKey) return false;
                  const pts = championKnowledge[c.id] || 0;
                  return pts >= CHAMPION_META_TARGET_POINTS;
                });

                return (
                  <div
                    key={tierKey}
                    className="flex items-stretch rounded-xl border border-white/5 bg-[#090C13] overflow-hidden min-h-[58px]"
                  >
                    {/* Talon du Tier (Gauche) */}
                    <div
                      className="w-[110px] shrink-0 p-2.5 flex flex-col justify-center items-center text-center select-none border-r border-white/5"
                      style={{ backgroundColor: `${tierConfig.color}15`, borderLeft: `4px solid ${tierConfig.color}` }}
                    >
                      <span
                        className="font-rajdhani text-sm font-extrabold tracking-wider leading-none"
                        style={{ color: tierConfig.color }}
                      >
                        {tierConfig.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1">
                        {tierConfig.bonus >= 0 ? `+${tierConfig.bonus}` : tierConfig.bonus} Note
                      </span>
                    </div>

                    {/* Grille des champions décryptés dans ce Tier */}
                    <div className="flex-1 p-2.5 flex flex-wrap items-center gap-2">
                      {champsInTier.length === 0 ? (
                        <span className="text-xs text-text-faint italic select-none">
                          🔒 Aucun champion révélé (10 pts requis)
                        </span>
                      ) : (
                        champsInTier.map(c => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#111624] border border-white/10 hover:border-white/25 transition-all"
                            title={`${c.name} • ${tierConfig.label} (${tierConfig.bonus >= 0 ? '+' : ''}${tierConfig.bonus})`}
                          >
                            <img
                              src={c.icon}
                              alt={c.name}
                              className="w-7 h-7 rounded object-cover border border-white/10"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white font-rajdhani leading-none">
                                {c.name}
                              </span>
                              <span className="text-[9px] text-text-faint font-semibold mt-0.5">
                                {c.primaryRole || c.roles?.[0]}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section d'analyse en cours (0 < pts < 10) */}
            {inProgressChampions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#1C2232]">
                <div className="text-xs font-bold text-accent-blue-light uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>🔬 En cours d'analyse ({inProgressChampions.length})</span>
                  <span className="text-[11px] text-text-faint">Seuil : 10 pts</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {inProgressChampions.map(c => {
                    const pts = getChampionDecryptionPoints(c.id, knowledge);
                    const progressPct = Math.min(100, (pts / CHAMPION_META_TARGET_POINTS) * 100);

                    return (
                      <div
                        key={c.id}
                        className="p-2 rounded-lg bg-[#0A0D14] border border-[#1E2536] flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={c.icon}
                            alt={c.name}
                            className="w-7 h-7 rounded object-cover border border-white/10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white font-rajdhani truncate leading-none">
                              {c.name}
                            </div>
                            <div className="text-[10px] text-text-faint font-semibold mt-0.5">
                              {pts} / 10 pts
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-[#141A28] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-blue to-[#D4AF37] rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. MODAL DE CONFIGURATION DE L'ENTRAÎNEMENT DES CHAMPIONS EN SCRIM */}
      {isTrainingModalOpen && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.15s]"
          onClick={() => setIsTrainingModalOpen(false)}
        >
          <div
            className="bg-[#0C0F17] border border-[#232B3E] rounded-2xl max-w-[760px] w-full p-6 shadow-2xl relative flex flex-col max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex justify-between items-start border-b border-[#1E2538] pb-4 mb-4">
              <div>
                <div className="text-[11px] font-bold text-accent-blue-light uppercase tracking-wider flex items-center gap-2">
                  <span>{scrimDuration === 'quick' ? '⚡ Scrim Rapide • 1 Match' : '▶▶ Série Complète • 5 Matchs'}</span>
                  <span>•</span>
                  <span>Focus : {SCRIM_FOCUSES[scrimFocus]?.label || scrimFocus}</span>
                </div>
                <h2 className="text-2xl font-bold text-white m-0 mt-1 font-rajdhani flex items-center gap-3">
                  <span>ENTRAÎNEMENT DES CHAMPIONS</span>
                  <span className="text-sm font-normal text-text-faint">
                    vs {currentOpponent?.name} [{currentOpponent?.tag}]
                  </span>
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181F30] hover:bg-[#252E44] text-text-faint hover:text-white flex items-center justify-center text-sm transition-colors border border-border cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-muted mb-4 bg-[#121622] p-3 rounded-lg border border-[#1A2234]">
              Sélectionnez pour chaque rôle le champion que vous souhaitez faire progresser. <strong>Vous pouvez choisir n'importe quel champion disponible pour le poste</strong> afin de lui faire apprendre de nouvelles armes.
            </p>

            {/* 5 Rôles */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {ORDERED_ROLES.map(role => {
                const card = getCardForRole(role);
                const selectedChampId = trainingPicks[role];
                const champData = selectedChampId ? getChampionById(selectedChampId) : null;
                const pool = card ? getPlayerChampionPool(card, state?.championMastery) : [];
                const poolEntry = pool.find(p => p.champId === selectedChampId);
                const isKnown = !!poolEntry;
                const mastery = poolEntry?.mastery;
                const isDecrypted = isChampionDecrypted(selectedChampId, knowledge);
                const metaTier = getChampionMetaTier(selectedChampId, role, yearlyMeta);

                return (
                  <div
                    key={role}
                    className="p-3.5 rounded-xl bg-[#090C13] border border-[#1C2335] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-rajdhani">
                          {role}
                        </span>
                      </div>

                      <div className="w-px h-8 bg-white/10" />

                      <div className="flex items-center gap-3">
                        {champData?.icon ? (
                          <img
                            src={champData.icon}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-white/15"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#141A28] flex items-center justify-center text-base">🛡️</div>
                        )}

                        <div>
                          <div className="text-sm font-bold text-white font-rajdhani">
                            {champData?.name || selectedChampId || 'Non sélectionné'}
                          </div>
                          <div className="text-[11px] text-text-faint flex items-center gap-2 mt-0.5">
                            <span>Titulaire : {card?.baseName || 'Aucun'}</span>
                            <span>•</span>
                            {isKnown ? (
                              <span className="text-accent-green font-semibold">
                                {mastery?.name || 'Maîtrisé'} (+{mastery?.bonus || 0})
                              </span>
                            ) : (
                              <span className="text-[#38BDF8] font-bold">
                                ✨ Nouveau Champion (Apprenti)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Indicateur de Décryptage Méta */}
                      {isDecrypted ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-black uppercase"
                          style={{ backgroundColor: `${metaTier.color}20`, color: metaTier.color }}
                        >
                          {metaTier.label} ({metaTier.bonus >= 0 ? `+${metaTier.bonus}` : metaTier.bonus})
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-faint font-semibold bg-[#141A28] px-2 py-0.5 rounded border border-white/5">
                          {getChampionDecryptionPoints(selectedChampId, knowledge)}/10 pts décryptage
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setRolePickingForTraining(role);
                          setChampSearchTerm('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue-light border border-accent-blue/40 cursor-pointer transition-all"
                      >
                        Changer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pied de modal avec Lancement */}
            <div className="mt-4 pt-4 border-t border-[#1E2538] flex items-center justify-between gap-3">
              <span className="text-xs text-text-faint">
                {scrimDuration === 'quick'
                  ? '1 match sera simulé immédiatement (coût : 0.5 scrim).'
                  : 'La série de 5 parties sera simulée immédiatement (coût : 1.0 scrim).'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTrainingModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-text-faint hover:text-white bg-[#151923] border border-border cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={handleLaunchScrim}
                  disabled={isSimulating}
                  className="px-6 py-2 rounded-lg text-xs font-bold bg-[#D4AF37] hover:bg-[#e2bd46] text-black cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.4)] uppercase tracking-wider"
                >
                  {isSimulating
                    ? 'Simulation…'
                    : `Confirmer & Lancer (${scrimDuration === 'quick' ? '1 Match' : '5 Matchs'})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TIROIR / SÉLECTEUR DE CHAMPION POUR UN RÔLE (PARMI TOUS CEUX DU POSTE) */}
      {rolePickingForTraining && (
        <div
          className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.15s]"
          onClick={() => setRolePickingForTraining(null)}
        >
          <div
            className="bg-[#0A0D15] border border-[#232B3E] rounded-2xl max-w-[680px] w-full p-5 shadow-2xl relative flex flex-col max-h-[82vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex justify-between items-center border-b border-[#1E2538] pb-3 mb-3">
              <div>
                <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  Poste : {rolePickingForTraining}
                </span>
                <h3 className="text-xl font-bold text-white m-0 mt-0.5 font-rajdhani">
                  CHOISIR LE CHAMPION À ENTRAÎNER
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setRolePickingForTraining(null)}
                className="w-7 h-7 rounded-full bg-[#181F30] hover:bg-[#252E44] text-text-faint hover:text-white flex items-center justify-center text-xs transition-colors border border-border cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Champ de recherche */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Rechercher un champion..."
                value={champSearchTerm}
                onChange={(e) => setChampSearchTerm(e.target.value)}
                className="w-full bg-[#121622] border border-[#222B3E] rounded-lg px-3 py-2 text-xs text-white placeholder-text-faint focus:border-accent-blue focus:outline-none"
              />
            </div>

            {/* Liste complète des champions du rôle */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
              {(() => {
                const availableChamps = getChampionsByRole(rolePickingForTraining);
                const filtered = availableChamps.filter(c =>
                  c.name.toLowerCase().includes(champSearchTerm.toLowerCase())
                );
                const card = getCardForRole(rolePickingForTraining);
                const pool = card ? getPlayerChampionPool(card, state?.championMastery) : [];

                if (filtered.length === 0) {
                  return (
                    <div className="col-span-full text-center py-6 text-xs text-text-faint italic">
                      Aucun champion trouvé pour « {champSearchTerm} »
                    </div>
                  );
                }

                return filtered.map(c => {
                  const poolEntry = pool.find(p => p.champId === c.id);
                  const isKnown = !!poolEntry;
                  const isSelected = trainingPicks[rolePickingForTraining] === c.id;
                  const isDecrypted = isChampionDecrypted(c.id, knowledge);
                  const metaTier = getChampionMetaTier(c.id, rolePickingForTraining, yearlyMeta);
                  const pts = getChampionDecryptionPoints(c.id, knowledge);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setTrainingPicks(prev => ({
                          ...prev,
                          [rolePickingForTraining]: c.id,
                        }));
                        setRolePickingForTraining(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#182032] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                          : 'bg-[#0E121B] border-[#1C2335] hover:border-accent-blue/50 hover:bg-[#131826]'
                      }`}
                    >
                      <img
                        src={c.icon}
                        alt={c.name}
                        className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white font-rajdhani truncate leading-none">
                          {c.name}
                        </div>
                        <div className="text-[10px] mt-1 flex items-center gap-1.5">
                          {isKnown ? (
                            <span className="text-accent-green font-semibold">
                              {poolEntry.mastery.icon} {poolEntry.mastery.name}
                            </span>
                          ) : (
                            <span className="text-[#38BDF8] font-bold">
                              ✨ Nouveau
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-text-faint mt-0.5">
                          {isDecrypted ? (
                            <span style={{ color: metaTier.color }} className="font-bold">
                              {metaTier.label} ({metaTier.bonus >= 0 ? `+${metaTier.bonus}` : metaTier.bonus})
                            </span>
                          ) : (
                            <span>{pts}/10 pts</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
