import React, { useEffect, useState } from 'react';
import { TEAMS_DB } from '../constants/teams.js';
import { savePlayerSessionToken } from '../api/playerSession';

export default function LobbyView({ state, socket }) {
  const [view, setView] = useState('home'); // 'home' | 'team_create'
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const me = state.participants?.find(p => p.id === socket.id);
  const host = state.participants?.find(p => p.isHost && !p.isBot) || state.participants?.[0];
  const isHost = Boolean(me && host && me.id === host.id);
  const otherMembers = state.participants?.filter(p => p.id !== host?.id && !p.isBot) || [];

  // Connexion automatique au salon d'accueil
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setError('');
      if (socket.connected) {
        socket.emit('enter-lobby', (res) => {
          if (res?.playerToken) savePlayerSessionToken(res.playerToken);
        });
      }
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectError = () => {
      setIsConnected(false);
      setError('Connexion au serveur impossible.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    if (socket.connected && !me) {
      socket.emit('enter-lobby', (res) => {
        if (res?.playerToken) savePlayerSessionToken(res.playerToken);
      });
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket, me]);

  // Synchronisation des infos de l'équipe du joueur
  useEffect(() => {
    if (me) {
      if (!name) setName(me.name || '');
      if (!tag) setTag(me.tag || '');
      if (!selectedLogo) setSelectedLogo(me.logo || '');
    }
  }, [me]);

  // Logos disponibles pour la création d'équipe
  const usedLogos = (state.participants || []).filter(p => p.id !== socket.id).map(p => p.logo).filter(Boolean);
  const availableLogos = TEAMS_DB.filter(t => !usedLogos.includes(t.logo));

  useEffect(() => {
    if (!selectedLogo && availableLogos.length > 0) {
      const first = availableLogos[0];
      setSelectedLogo(first.logo);
      setName(first.name);
      setTag(first.tag);
    }
  }, [availableLogos, selectedLogo]);

  // Transférer le rôle de chef
  const handleSetHost = (targetId) => {
    socket.emit('set-host', targetId, (res) => {
      if (!res?.ok) setError(res?.error || 'Action impossible.');
    });
  };

  // Validation de la création / modification d'équipe
  const handleSaveTeam = (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!name.trim()) return setError("Entrez un nom d'équipe.");
    if (tag.trim().length < 2 || tag.trim().length > 4) return setError('Le TAG doit faire entre 2 et 4 caractères.');
    if (!selectedLogo) return setError('Sélectionnez un logo.');

    setIsSubmitting(true);
    socket.timeout(5000).emit(
      'join-lobby',
      name.trim(),
      tag.trim().toUpperCase(),
      selectedLogo,
      (timeoutError, response) => {
        setIsSubmitting(false);
        if (timeoutError) {
          setError('Le serveur ne répond pas.');
          return;
        }
        if (!response?.ok) {
          setError(response?.error || "Impossible d'enregistrer l'équipe.");
          return;
        }
        if (response.playerToken) savePlayerSessionToken(response.playerToken);
        setView('home');
      }
    );
  };

  const handleStartDraft = () => {
    socket.emit('start-draft');
  };

  const openSavesModal = () => {
    window.dispatchEvent(new CustomEvent('open-game-management'));
  };

  // =========================================================================
  // ÉCRAN : CRÉATION / MODIFICATION D'ÉQUIPE
  // =========================================================================
  if (view === 'team_create') {
    return (
      <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center overflow-y-auto font-sans p-4 sm:p-8 pb-32">
        <div className="bg-bg-card py-6 sm:py-8 px-4 sm:px-10 rounded-2xl border border-border max-w-[1100px] w-full text-center shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <button
              onClick={() => setView('home')}
              className="text-text-faint hover:text-white transition-colors text-xs font-bold font-rajdhani uppercase tracking-wider cursor-pointer"
            >
              ‹ Revenir à l'accueil
            </button>
            <span className="text-xs font-mono text-accent-blue-light uppercase font-bold">
              Configuration de l'équipe
            </span>
          </div>

          <h1 className="text-accent-blue-light mb-2 text-2xl sm:text-3xl tracking-wider font-black uppercase font-rajdhani">
            {me?.hasCustomTeam ? "Modification de l'équipe" : "Création de l'équipe"}
          </h1>
          <p className="text-text-secondary mb-6 text-xs sm:text-sm">
            Choisissez un logo, un nom complet et un TAG.
          </p>

          {/* Grille de sélection des logos */}
          <div className="text-left mb-2 text-xs font-bold uppercase tracking-wider text-white">
            Logo ({availableLogos.length} disponibles)
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(75px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2.5 mb-6 max-h-[280px] overflow-y-auto p-3 bg-bg-dark rounded-xl border border-border">
            {availableLogos.map(team => (
              <div
                key={team.name}
                onClick={() => {
                  setSelectedLogo(team.logo);
                  setName(team.name);
                  setTag(team.tag);
                }}
                className={`relative aspect-square p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                  selectedLogo === team.logo
                    ? 'border-accent-blue bg-accent-blue/15 shadow-[0_0_15px_rgba(76,96,210,0.4)] scale-105'
                    : 'border-border bg-bg-card hover:border-accent-blue/50'
                }`}
                title={team.name}
              >
                <img
                  src={team.logo}
                  alt={team.name}
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  className="max-w-full max-h-full object-contain filter drop-shadow"
                />
              </div>
            ))}
          </div>

          {/* Saisie Nom et TAG */}
          <div className="text-left mb-2 text-xs font-bold uppercase tracking-wider text-white">
            Nom et TAG
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              aria-label="Nom complet de l'équipe"
              placeholder="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-bg-dark px-4 py-3 text-white font-bold outline-none transition-colors focus:border-accent-blue text-sm"
            />
            <input
              type="text"
              aria-label="Tag de l'équipe"
              placeholder="TAG"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              maxLength={4}
              className="w-full sm:w-28 rounded-xl border border-border bg-bg-dark px-4 py-3 text-center text-accent-blue-light font-bold uppercase outline-none transition-colors focus:border-accent-blue text-sm font-mono"
            />
          </div>

          {/* Validation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
            <button
              onClick={() => setView('home')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-border text-text-faint hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveTeam}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-accent-blue hover:bg-accent-blue/80 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Enregistrement…' : 'Valider'}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-[#ff3366]/40 bg-[#24131C] px-4 py-3 text-xs font-bold text-[#ff9AB2]">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ÉCRAN : ACCUEIL DU SALON
  // =========================================================================
  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-between overflow-y-auto font-sans p-4 sm:p-8 pb-32">
      <div className="w-full max-w-[1200px] space-y-6">
        {/* Barre d'en-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img
              src="/logo/others/League_of_legend.svg"
              alt="Logo"
              className="h-9 w-9 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h1 className="m-0 font-rajdhani text-2xl font-extrabold uppercase tracking-wider text-white">
                League Pro Game
              </h1>
              <p className="m-0 text-xs text-text-faint font-mono">
                Salon d'attente • {state.participants?.length || 0} / 16 équipes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
              isConnected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{isConnected ? 'En ligne' : 'Hors ligne'}</span>
            </div>

            <button
              onClick={openSavesModal}
              className="px-4 py-2 rounded-xl bg-[#141926] hover:bg-[#1E2638] border border-[#2B354C] hover:border-accent-blue text-xs font-bold text-white transition-all cursor-pointer shadow-sm uppercase tracking-wider"
              title="Gérer les sauvegardes"
            >
              Sauvegardes
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#ff3366]/40 bg-[#24131C] px-4 py-3 text-xs font-bold text-[#ff9AB2] flex justify-between items-center animate-fadeIn">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-white hover:text-white/70">✕</button>
          </div>
        )}

        {/* SECTION 1 : CHEF DU GROUPE */}
        <div className="rounded-2xl border border-amber-400/50 bg-[#121622] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase font-rajdhani font-extrabold tracking-wider text-amber-300">
              Chef du groupe
            </div>
            {isHost && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-400 text-black uppercase">
                Vous
              </span>
            )}
          </div>

          {host ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/30 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#141926] border border-white/10 flex items-center justify-center p-2 shrink-0">
                  {host.logo ? (
                    <img src={host.logo} alt="" className="w-full h-full object-contain filter drop-shadow" />
                  ) : (
                    <span className="font-mono text-xs text-text-faint">LOGO</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-amber-400 uppercase">[{host.tag}]</span>
                    <span className="font-rajdhani text-xl font-bold text-white uppercase">{host.name}</span>
                  </div>
                  <div className="text-xs text-text-faint mt-0.5">
                    {host.hasCustomTeam ? 'Équipe personnalisée' : 'Équipe par défaut'}
                  </div>
                </div>
              </div>

              {/* Si hôte et plusieurs joueurs : possibilité de transférer */}
              {isHost && otherMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-faint font-mono">Désigner chef :</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSetHost(e.target.value);
                    }}
                    defaultValue=""
                    className="bg-[#0E121E] border border-border text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="" disabled>Sélectionner un joueur…</option>
                    {otherMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} [{m.tag}]</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-text-faint text-xs">
              Aucun chef assigné.
            </div>
          )}
        </div>

        {/* SECTION 2 : MEMBRES DU GROUPE */}
        <div className="rounded-2xl border border-border bg-bg-card p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="m-0 font-rajdhani text-base font-bold uppercase tracking-wider text-white">
              Membres du groupe ({otherMembers.length})
            </h2>
          </div>

          {otherMembers.length === 0 ? (
            <div className="py-8 px-4 rounded-xl border border-dashed border-border text-center text-text-faint text-xs bg-bg-dark/40">
              En attente d'autres joueurs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherMembers.map(member => {
                const isMe = member.id === socket.id;
                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      isMe
                        ? 'border-accent-blue/60 bg-accent-blue/10'
                        : 'border-[#20283C] bg-bg-dark'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-[#141926] border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                        {member.logo ? (
                          <img src={member.logo} alt="" className="w-full h-full object-contain filter drop-shadow" />
                        ) : (
                          <span className="font-mono text-[10px] text-text-faint">LOGO</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-accent-blue-light uppercase">[{member.tag}]</span>
                          <span className="font-rajdhani text-sm font-bold text-white truncate uppercase">{member.name}</span>
                        </div>
                        <div className="text-[11px] text-text-faint">
                          {isMe ? <span className="text-accent-blue-light font-bold">Vous</span> : (member.hasCustomTeam ? 'Prêt' : 'En attente')}
                        </div>
                      </div>
                    </div>

                    {isHost && (
                      <button
                        onClick={() => handleSetHost(member.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-400/40 hover:bg-amber-400 hover:text-black text-amber-300 font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                        title="Transférer le rôle de chef"
                      >
                        Désigner chef
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BARRE D'ACTION INFÉRIEURE */}
      <div className="fixed inset-x-3 bottom-3 sm:inset-x-6 sm:bottom-6 z-[9000] mx-auto max-w-[1200px] flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-accent-blue/40 bg-[#0E121E]/95 shadow-2xl backdrop-blur-xl">
        {/* Identité de mon équipe */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 rounded-xl bg-bg-dark border border-white/10 flex items-center justify-center p-1.5 shrink-0">
            {me?.logo ? (
              <img src={me.logo} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="font-mono text-[10px] text-text-faint">LOGO</span>
            )}
          </div>
          <div className="text-left min-w-0 flex-1 sm:flex-none">
            <div className="text-[11px] text-text-faint font-mono">Mon équipe :</div>
            <div className="font-rajdhani font-bold text-sm text-white truncate uppercase">
              [{me?.tag || '?'}] {me?.name || 'Non configuré'}
            </div>
          </div>
          <button
            onClick={() => setView('team_create')}
            className="px-4 py-2 rounded-xl bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/50 text-accent-blue-light font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ml-auto sm:ml-2"
          >
            {me?.hasCustomTeam ? 'Modifier mon équipe' : 'Créer mon équipe'}
          </button>
        </div>

        {/* Action de lancement (Chef uniquement) */}
        <div className="w-full sm:w-auto flex items-center justify-end">
          {isHost ? (
            <button
              onClick={handleStartDraft}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-rajdhani font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all"
            >
              Démarrer la saison
            </button>
          ) : (
            <div className="text-xs font-mono text-text-faint text-center sm:text-right px-3 py-2">
              En attente du chef (<span className="text-amber-400 font-bold">{host?.name || 'Hôte'}</span>) pour lancer la saison.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
