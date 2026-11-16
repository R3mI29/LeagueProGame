import { useEffect, useState } from 'react';
import {
  clearPlayerSessionToken,
  getPlayerSessionToken,
} from '../api/playerSession';

export default function GameManagementOverlay({ socket, state }) {
  const me = state.participants?.find(participant => participant.id === socket.id);
  const [open, setOpen] = useState(false);
  const [saves, setSaves] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [quitSaveName, setQuitSaveName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOverwriteId, setConfirmOverwriteId] = useState(null);
  const [confirmOverwriteAndQuitId, setConfirmOverwriteAndQuitId] = useState(null);
  const [confirmQuitNoSave, setConfirmQuitNoSave] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const humanParticipants = state.participants?.filter(p => !p.id.startsWith('bot-') && !p.isPermanentBot && !p.isBot) || [];
  const host = state.participants?.find(p => p.isHost && !p.isBot) || humanParticipants[0] || state.participants?.[0];
  const isHost = Boolean(me?.isHost) || Boolean(me && host && me.id === host.id) || (humanParticipants.length <= 1 && Boolean(me));
  const isInGame = state.phase !== 'lobby';
  const decisionRequired = Boolean(state.awaitingResumeDecision) && isHost && !dismissed;
  const visible = open || decisionRequired;

  const request = (event, payload) => new Promise((resolve, reject) => {
    const args = payload === undefined ? [] : [payload];
    socket.timeout(8000).emit(event, ...args, (timeoutError, response) => {
      if (timeoutError) return reject(new Error('Le serveur ne répond pas.'));
      if (!response?.ok) return reject(new Error(response?.error || 'Action impossible.'));
      resolve(response);
    });
  });

  const refreshSaves = async () => {
    try {
      const response = await request('list-game-saves');
      setSaves(response.saves || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-game-management', handleOpen);
    return () => window.removeEventListener('open-game-management', handleOpen);
  }, []);

  useEffect(() => {
    if (!visible) return;
    refreshSaves();
  }, [visible]);

  const run = async (action, successMsg = '') => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await action();
      if (successMsg) setSuccess(successMsg);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy(false);
    }
  };

  const resume = () => run(async () => {
    await request('resume-game');
    handleClose();
  });

  const saveCopy = () => run(async () => {
    const label = saveName.trim() || `Saison ${state.year || 1}`;
    await request('save-game', label);
    setSaveName('');
    await refreshSaves();
  }, 'Sauvegarde créée avec succès.');

  const overwriteSave = (saveId) => run(async () => {
    await request('overwrite-game-save', saveId);
    setConfirmOverwriteId(null);
    await refreshSaves();
  }, 'Sauvegarde mise à jour par-dessus avec succès.');

  const overwriteAndQuit = (saveId) => run(async () => {
    await request('overwrite-and-quit', saveId);
    clearPlayerSessionToken();
    setConfirmOverwriteAndQuitId(null);
    setOpen(false);
  });

  const saveAndQuit = () => run(async () => {
    const label = quitSaveName.trim() || `Saison ${state.year || 1} - Sauvegarde finale`;
    await request('save-and-quit', label);
    clearPlayerSessionToken();
    setQuitSaveName('');
    setOpen(false);
  });

  const quitWithoutSaving = () => run(async () => {
    await request('quit-to-menu');
    clearPlayerSessionToken();
    setConfirmQuitNoSave(false);
    setOpen(false);
  });

  const loadSave = (saveId) => run(async () => {
    const response = await request('load-game', {
      saveId,
      playerToken: getPlayerSessionToken(),
    });
    if (!response.reconnected) {
      clearPlayerSessionToken();
    }
    setOpen(false);
  });

  const deleteSave = (saveId) => {
    if (!window.confirm('Supprimer définitivement cette sauvegarde ?')) return;
    run(async () => {
      await request('delete-game-save', saveId);
      await refreshSaves();
    }, 'Sauvegarde supprimée.');
  };

  const handleClose = () => {
    setOpen(false);
    setDismissed(true);
  };

  return (
    <>
      {/* Bouton de gestion de la partie en cours de jeu (hors lobby) */}
      {me && isInGame && (
        <div className="fixed right-4 top-4 z-[9500] flex gap-2">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setDismissed(false);
            }}
            className="rounded-lg border border-accent-blue bg-[#11141E]/95 px-4 py-2 text-xs font-bold tracking-wider text-[#AAB8F5] uppercase backdrop-blur hover:bg-accent-blue hover:text-white transition-all cursor-pointer shadow-lg"
            title="Gérer la partie et les sauvegardes"
          >
            Sauvegardes
          </button>
        </div>
      )}

      {/* Fenêtre modale de Gestion des Sauvegardes */}
      {visible && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center overflow-y-auto bg-[#05070D]/95 p-4 sm:p-6 font-sans backdrop-blur-xl">
          <div className="w-full max-w-[950px] rounded-2xl border border-border bg-[#11141E] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] max-h-[92vh] overflow-y-auto">
            {!isHost ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center mx-auto text-accent-blue-light font-bold text-xs uppercase mb-4 font-mono">
                  Attente
                </div>
                <h2 className="font-rajdhani text-2xl sm:text-3xl font-bold text-white uppercase">
                  Partie en attente du chef
                </h2>
                <p className="mt-2 text-[#8B9BB4] text-sm max-w-md mx-auto">
                  Seul le chef du groupe peut gérer et charger les sauvegardes.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 rounded-lg border border-border px-5 py-2 text-xs font-bold text-white hover:bg-border transition-colors cursor-pointer uppercase"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                {/* En-tête de la modale */}
                <div className="mb-6 flex items-start justify-between gap-5 border-b border-white/10 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400 font-bold text-xs uppercase tracking-wider font-rajdhani">
                        Chef du groupe
                      </span>
                    </div>
                    <h2 className="m-0 font-rajdhani text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-wide">
                      {decisionRequired ? 'Reprendre la partie' : 'Gestion des Sauvegardes'}
                    </h2>
                    <p className="mt-1 text-xs text-[#8B9BB4] font-mono">
                      {isInGame ? `Saison ${state.year || 1} • Phase : ${state.phase} • ${state.participants?.length || 0} équipes` : 'Salon d’attente • Aucune partie en cours'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full border border-border hover:border-white text-[#8B9BB4] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    title="Fermer"
                  >
                    ✕
                  </button>
                </div>

                {decisionRequired && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={resume}
                    className="mb-6 w-full rounded-xl bg-gradient-to-r from-accent-blue to-[#4C60D2] px-6 py-4 font-bold tracking-wider text-white uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer font-rajdhani text-sm"
                  >
                    Continuer la partie actuelle
                  </button>
                )}

                {/* Notifications succès / erreur */}
                {success && (
                  <div className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-400 animate-fadeIn">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="mb-5 rounded-lg border border-[#ff3366]/40 bg-[#24131C] px-4 py-3 text-xs font-bold text-[#ff9AB2] animate-fadeIn">
                    {error}
                  </div>
                )}

                {/* 1. CRÉER UNE NOUVELLE SAUVEGARDE (si in game) */}
                {isInGame && (
                  <div className="mb-6 rounded-xl border border-border bg-bg-dark p-5">
                    <h3 className="m-0 mb-1 font-rajdhani text-base font-bold text-white uppercase tracking-wider">
                      1. Créer une nouvelle sauvegarde
                    </h3>
                    <p className="text-xs text-text-faint mb-3">
                      Enregistrez l’état actuel de la saison dans un nouveau fichier.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        value={saveName}
                        onChange={e => setSaveName(e.target.value)}
                        placeholder={`Saison ${state.year || 1} - ${new Date().toLocaleDateString('fr-FR')}`}
                        className="min-w-0 flex-1 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-xs text-white outline-none focus:border-accent-blue transition-colors"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={saveCopy}
                        className="rounded-lg bg-accent-blue hover:bg-accent-blue/80 px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer"
                      >
                        Créer la sauvegarde
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. LISTE DES SAUVEGARDES */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="m-0 font-rajdhani text-base font-bold text-white uppercase tracking-wider">
                        {isInGame ? '2. Sauvegardes existantes' : 'Sauvegardes disponibles'}
                      </h3>
                      <p className="text-xs text-text-faint m-0">
                        Charger, sauvegarder par-dessus ou supprimer un fichier.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={refreshSaves}
                      className="text-xs font-mono font-bold text-accent-blue-light hover:underline uppercase cursor-pointer"
                    >
                      Actualiser
                    </button>
                  </div>

                  <div className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
                    {saves.map(save => {
                      const isAutoSave = save.label?.startsWith('[AutoSave]');
                      const isConfirmingOverwrite = confirmOverwriteId === save.id;
                      const isConfirmingOverwriteAndQuit = confirmOverwriteAndQuitId === save.id;

                      return (
                        <div
                          key={save.id}
                          className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border p-4 transition-all ${
                            isAutoSave
                              ? 'border-amber-500/30 bg-amber-500/5'
                              : 'border-[#222838] bg-bg-dark hover:border-[#323D54]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {isAutoSave && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-black uppercase">
                                  Auto
                                </span>
                              )}
                              <span className="font-bold text-sm text-white truncate">
                                {save.label || save.id.replace('.json', '')}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-text-faint font-mono">
                              {save.players?.length > 0 ? save.players.join(', ') : 'Aucun joueur'} • {new Date(save.savedAt).toLocaleString('fr-FR')} • Année {save.year} • Phase : {save.phase}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Bouton Charger */}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm(`Charger "${save.label || save.id}" ? La session actuelle sera remplacée.`)) {
                                  loadSave(save.id);
                                }
                              }}
                              className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-all cursor-pointer uppercase"
                            >
                              Charger
                            </button>

                            {/* Options disponibles si une partie est en cours */}
                            {isInGame && (
                              <>
                                {/* Sauvegarder par-dessus */}
                                {isConfirmingOverwrite ? (
                                  <div className="flex items-center gap-1.5 animate-fadeIn">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => overwriteSave(save.id)}
                                      className="rounded-lg bg-amber-500 text-black px-2.5 py-1.5 text-xs font-black uppercase cursor-pointer"
                                    >
                                      Confirmer l'écrasement
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmOverwriteId(null)}
                                      className="rounded-lg border border-border px-2 py-1.5 text-xs text-text-faint hover:text-white"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                      setConfirmOverwriteAndQuitId(null);
                                      setConfirmOverwriteId(save.id);
                                    }}
                                    className="rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 transition-all cursor-pointer uppercase"
                                    title="Enregistrer par-dessus cette sauvegarde existante"
                                  >
                                    Sauvegarder par-dessus
                                  </button>
                                )}

                                {/* Sauvegarder par-dessus et quitter */}
                                {isConfirmingOverwriteAndQuit ? (
                                  <div className="flex items-center gap-1.5 animate-fadeIn">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => overwriteAndQuit(save.id)}
                                      className="rounded-lg bg-rose-500 text-white px-2.5 py-1.5 text-xs font-black uppercase cursor-pointer"
                                    >
                                      Confirmer et quitter
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmOverwriteAndQuitId(null)}
                                      className="rounded-lg border border-border px-2 py-1.5 text-xs text-text-faint hover:text-white"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                      setConfirmOverwriteId(null);
                                      setConfirmOverwriteAndQuitId(save.id);
                                    }}
                                    className="rounded-lg bg-white/5 border border-white/20 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90 transition-all cursor-pointer uppercase"
                                    title="Sauvegarder par-dessus cette archive et revenir au menu principal"
                                  >
                                    Sauvegarder par-dessus & Quitter
                                  </button>
                                )}
                              </>
                            )}

                            {/* Croix rouge distincte de suppression */}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => deleteSave(save.id)}
                              className="rounded-lg border border-red-500/50 bg-red-500/10 hover:bg-red-500/25 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer"
                              title="Supprimer définitivement cette sauvegarde"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {saves.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-text-faint">
                        Aucune sauvegarde enregistrée sur ce serveur.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. OPTIONS DE SORTIE / QUITTER (si in game) */}
                {isInGame && (
                  <div className="space-y-4 pt-2">
                    {/* A. Sauvegarder sous un nom et quitter */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                      <h3 className="m-0 mb-1 font-rajdhani text-base font-bold text-amber-300 uppercase tracking-wider">
                        3. Sauvegarder avec un nom et quitter
                      </h3>
                      <p className="text-xs text-white/70 mb-3">
                        Crée une nouvelle sauvegarde avec le nom de votre choix, puis ramène tous les joueurs au menu principal.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          value={quitSaveName}
                          onChange={e => setQuitSaveName(e.target.value)}
                          placeholder={`Saison ${state.year || 1} - Fin de session`}
                          className="min-w-0 flex-1 rounded-lg border border-amber-500/40 bg-bg-card px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={saveAndQuit}
                          className="rounded-lg bg-amber-400 hover:bg-amber-300 text-black px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                        >
                          Sauvegarder & Quitter
                        </button>
                      </div>
                    </div>

                    {/* B. Quitter vers le menu principal sans sauvegarder */}
                    <div className="rounded-xl border border-[#ff3366]/30 bg-[#ff3366]/5 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="m-0 font-rajdhani text-base font-bold text-[#ff8eaa] uppercase tracking-wider">
                            Quitter vers le menu / Recommencer (sans sauvegarder)
                          </h3>
                          <p className="text-xs text-text-faint m-0">
                            Retourne au menu principal pour recommencer une partie sans créer de nouvelle archive.
                          </p>
                        </div>

                        {!confirmQuitNoSave ? (
                          <button
                            type="button"
                            onClick={() => setConfirmQuitNoSave(true)}
                            className="rounded-lg border border-[#ff3366]/60 hover:bg-[#ff3366]/15 px-4 py-2 text-xs font-bold text-[#ff8eaa] uppercase transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Quitter sans sauvegarder
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={quitWithoutSaving}
                              className="rounded-lg bg-[#ff3366] hover:bg-[#ff1a53] px-4 py-2 text-xs font-bold text-white uppercase cursor-pointer whitespace-nowrap"
                            >
                              Confirmer le retour au menu
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmQuitNoSave(false)}
                              className="rounded-lg border border-border px-3 py-2 text-xs text-text-faint hover:text-white cursor-pointer"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
