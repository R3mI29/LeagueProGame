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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  const isHost = Boolean(me?.isHost);
  const decisionRequired = Boolean(state.awaitingResumeDecision);
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
    if (!isHost) return;
    try {
      const response = await request('list-game-saves');
      setSaves(response.saves || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    if (!visible || !isHost) return;
    refreshSaves();
  }, [visible, isHost]);

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy(false);
    }
  };

  const resume = () => run(async () => {
    await request('resume-game');
    setOpen(false);
  });

  const saveCopy = () => run(async () => {
    await request('save-game', saveName.trim() || `Saison ${state.year || 1}`);
    setSaveName('');
    await refreshSaves();
  });

  const startNewGame = () => run(async () => {
    await request('new-game');
    clearPlayerSessionToken();
    setConfirmNewGame(false);
    setOpen(false);
  });

  const loadSave = saveId => run(async () => {
    const response = await request('load-game', {
      saveId,
      playerToken: getPlayerSessionToken(),
    });
    // Si on n'est pas reconnecté automatiquement, on efface le token actuel
    // pour forcer le composant TakeoverView (ou le lobby) à s'afficher.
    if (!response.reconnected) {
       clearPlayerSessionToken();
       // Optionnel : on peut afficher un petit message d'info plutôt qu'une erreur rouge
       // setError("Partie chargée. Veuillez sélectionner une équipe à contrôler.");
    }
    setOpen(false); 
  });

  const deleteSave = saveId => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette sauvegarde ? Cette action est irréversible.')) return;
    run(async () => {
      await request('delete-game-save', saveId);
      await refreshSaves();
    });
  };

  const leaveGame = () => {
    if (!window.confirm('Quitter définitivement cette partie et laisser votre équipe à une IA ?')) return;
    run(async () => {
      await request('leave-game');
      clearPlayerSessionToken();
      setOpen(false);
    });
  };

  if (!me) return null;

  return (
    <>
      {me && !decisionRequired && (
        <div className="fixed right-4 top-4 z-[9500] flex gap-2">
          {isHost && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg border border-[#4C60D2] bg-[#11141E]/95 px-4 py-2 text-xs font-bold tracking-wider text-[#AAB8F5] uppercase backdrop-blur"
            >
              Gérer la partie
            </button>
          )}
          <button
            type="button"
            onClick={leaveGame}
            className="rounded-lg border border-[#ff3366]/50 bg-[#11141E]/95 px-4 py-2 text-xs font-bold tracking-wider text-[#ff8eaa] uppercase backdrop-blur"
          >
            Quitter
          </button>
        </div>
      )}

      {visible && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center overflow-y-auto bg-[#05070D]/95 p-5 font-sans backdrop-blur-xl">
          <div className="w-full max-w-[900px] rounded-2xl border border-[#2B3040] bg-[#11141E] p-7 shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
            {!isHost ? (
              <div className="py-12 text-center">
                <h2 className="font-rajdhani text-3xl font-bold text-white uppercase">
                  Partie en attente
                </h2>
                <p className="mt-3 text-[#8B9BB4]">
                  Le premier joueur revenu est devenu hôte et choisit la suite.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-7 flex items-start justify-between gap-5">
                  <div>
                    <p className="mb-2 text-xs font-bold tracking-[3px] text-[#8C9AD6] uppercase">
                      Contrôle de l’hôte
                    </p>
                    <h2 className="m-0 font-rajdhani text-4xl font-bold text-white uppercase">
                      {decisionRequired ? 'Reprendre cette partie ?' : 'Gestion de la partie'}
                    </h2>
                    <p className="mt-2 text-sm text-[#8B9BB4]">
                      Année {state.year || 1} · {state.participants?.length || 0} équipes · phase {state.phase}
                    </p>
                  </div>
                  {!decisionRequired && (
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-lg border border-[#2B3040] px-4 py-2 text-sm text-[#8B9BB4]"
                    >
                      Fermer
                    </button>
                  )}
                </div>

                {decisionRequired && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={resume}
                    className="mb-7 w-full rounded-xl bg-[#4C60D2] px-6 py-4 font-bold tracking-wider text-white uppercase disabled:opacity-50"
                  >
                    Continuer la partie actuelle
                  </button>
                )}

                <div className="mb-7 rounded-xl border border-[#2B3040] bg-[#0A0D14] p-5">
                  <h3 className="m-0 mb-3 font-rajdhani text-lg font-bold text-white uppercase">
                    Créer une sauvegarde nommée
                  </h3>
                  <div className="flex gap-3">
                    <input
                      value={saveName}
                      onChange={event => setSaveName(event.target.value)}
                      placeholder={`Saison ${state.year || 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-[#2B3040] bg-[#151923] px-4 py-3 text-white outline-none focus:border-[#4C60D2]"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={saveCopy}
                      className="rounded-lg border border-[#4C60D2] px-5 py-3 text-sm font-bold text-[#AAB8F5] disabled:opacity-50"
                    >
                      Sauvegarder une copie
                    </button>
                  </div>
                </div>

                <div className="mb-7">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="m-0 font-rajdhani text-lg font-bold text-white uppercase">
                      Anciennes parties
                    </h3>
                    <button
                      type="button"
                      onClick={refreshSaves}
                      className="text-xs font-bold tracking-wider text-[#8C9AD6] uppercase"
                    >
                      Actualiser
                    </button>
                  </div>
                  <div className="max-h-[260px] space-y-2 overflow-y-auto">
                    {saves.map(save => (
                      <div
                        key={save.id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-[#222838] bg-[#0A0D14] p-4"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-white">
                            {/* Modification ici : On affiche le label, SINON on affiche le nom du fichier (save.id) sans l'extension .json */}
                            {save.label || save.id.replace('.json', '')} 
                          </div>
                          <div className="mt-1 text-xs text-[#768196]">
                            {save.players?.length > 0 ? save.players.join(', ') : 'Aucun joueur'} · {new Date(save.savedAt).toLocaleString()} · Année {save.year} · {save.phase}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => loadSave(save.id)}
                            className="rounded-lg bg-[#1C212E] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2B3040] disabled:opacity-50"
                          >
                            Charger
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => deleteSave(save.id)}
                            className="rounded-lg border border-[#ff3366]/40 bg-[#ff3366]/10 px-3 py-2 text-xs font-bold text-[#ff8eaa] transition-colors hover:bg-[#ff3366]/20 disabled:opacity-50"
                            title="Supprimer la sauvegarde"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {saves.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[#2B3040] p-6 text-center text-sm text-[#768196]">
                        Aucune archive enregistrée.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#ff3366]/30 bg-[#ff3366]/5 p-5">
                  {!confirmNewGame ? (
                    <button
                      type="button"
                      onClick={() => setConfirmNewGame(true)}
                      className="w-full rounded-lg border border-[#ff3366]/60 px-5 py-3 text-sm font-bold text-[#ff8eaa] uppercase"
                    >
                      Créer une nouvelle partie
                    </button>
                  ) : (
                    <div>
                      <p className="mt-0 text-sm text-[#ffb0c3]">
                        La partie actuelle sera archivée automatiquement, puis tous les joueurs devront recréer leur équipe.
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={startNewGame}
                          className="flex-1 rounded-lg bg-[#ff3366] px-5 py-3 text-sm font-bold text-white uppercase disabled:opacity-50"
                        >
                          Confirmer la nouvelle partie
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmNewGame(false)}
                          className="rounded-lg border border-[#2B3040] px-5 py-3 text-sm text-[#8B9BB4]"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <p role="alert" className="mt-4 rounded-lg border border-[#ff3366]/40 bg-[#24131C] px-4 py-3 text-sm text-[#ff9AB2]">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
