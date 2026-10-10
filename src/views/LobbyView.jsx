import React, { useEffect, useState } from 'react';
import { TEAMS_DB } from '../constants/teams.js';
import { savePlayerSessionToken } from '../api/playerSession';

export default function LobbyView({ state, socket }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setError('');
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectError = () => {
      setIsConnected(false);
      setError("Connexion au serveur de jeu impossible. Réessayez dans un instant.");
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  const usedLogos = state.participants.map(p => p.logo).filter(Boolean);
  const availableLogos = TEAMS_DB.filter(t => !usedLogos.includes(t.logo));

  useEffect(() => {
    if (selectedLogo || availableLogos.length === 0) return;
    const firstTeam = availableLogos[0];
    setSelectedLogo(firstTeam.logo);
    setName(firstTeam.name);
    setTag(firstTeam.tag);
  }, [availableLogos, selectedLogo]);

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError("Entrez un nom d'équipe.");
    if (tag.trim().length < 2 || tag.trim().length > 4) return setError("Le TAG doit faire entre 2 et 4 caractères.");
    if (!selectedLogo) return setError("Sélectionnez une identité visuelle.");
    if (!socket.connected) {
      socket.connect();
      return setError("Reconnexion au serveur en cours. Réessayez dans un instant.");
    }

    setIsSubmitting(true);
    socket.timeout(5000).emit(
      'join-lobby',
      name.trim(),
      tag.trim().toUpperCase(),
      selectedLogo,
      (timeoutError, response) => {
        setIsSubmitting(false);
        if (timeoutError) {
          setError("Le serveur ne répond pas. Vérifiez la connexion puis réessayez.");
          return;
        }
        if (!response?.ok) {
          setError(response?.error || "Impossible de rejoindre la partie.");
          return;
        }
        savePlayerSessionToken(response.playerToken);
      },
    );
  };

  const amIJoined = state.participants.some(p => p.id === socket.id);

  if (amIJoined) {
    return (
      <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col items-center overflow-y-auto py-8 px-10 pb-28 font-sans">
        <h1 className="text-[42px] mb-10 text-[#8C9AD6] tracking-[2px] font-extrabold uppercase">
          SALLE D'ATTENTE ({state.participants.length}/16)
        </h1>
        
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 w-full max-w-[1400px]">
            {state.participants.map(p => (
                <div key={p.id} className="bg-[#151923] border border-[#2B3040] rounded-xl p-6 flex items-center gap-5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                    {p.logo ? (
                      <img src={p.logo} alt="" className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-[#2B3040] rounded-lg" />
                    )}
                    <div>
                        <div className="text-[15px] text-[#4C60D2] font-extrabold tracking-[1px] uppercase">[{p.tag}]</div>
                        <div className="text-[20px] font-semibold text-[#F0F0F2]">{p.name}</div>
                    </div>
                </div>
            ))}
        </div>

        {state.participants.length > 0 && state.participants[0].id === socket.id && (
            <div className="fixed bottom-5 left-1/2 z-[9000] flex -translate-x-1/2 gap-5">
                <button 
                  onClick={() => socket.emit('start-draft')} 
                  className="whitespace-nowrap py-4 px-10 bg-[#4C60D2] text-white border-none rounded-lg text-base font-bold cursor-pointer tracking-[2px] shadow-[0_0_20px_rgba(76,96,210,0.4)] transition-transform hover:-translate-y-1 active:scale-95"
                >
                    DÉMARRER LA SAISON
                </button>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col items-center overflow-y-auto font-sans p-5 pb-32">
      <div className="bg-[#151923] py-8 px-10 rounded-2xl border border-[#2B3040] max-w-[1200px] w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <h1 className="text-[#8C9AD6] mb-3 text-[48px] tracking-[4px] font-black uppercase">CIRCUIT ESPORT</h1>
        <p className="text-[#7A8190] mb-10 text-lg">Sélectionnez l'identité visuelle de votre franchise.</p>

        <div className={`mb-6 rounded-lg border px-4 py-3 text-left text-sm ${isConnected ? 'border-[#00e676]/30 bg-[#00e676]/5 text-[#7de8ad]' : 'border-[#ff3366]/40 bg-[#ff3366]/5 text-[#ff8eaa]'}`}>
          {isConnected ? 'Serveur de jeu connecté' : 'Connexion au serveur de jeu en cours…'}
        </div>

        <h4 className="text-white mb-4 text-left text-base tracking-[1px] uppercase font-bold">1. CHOISISSEZ VOTRE LOGO</h4>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3 mb-10 max-h-[320px] overflow-y-auto p-4 bg-[#0A0D14] rounded-xl border border-[#2B3040]">
            {availableLogos.map(team => (
            <div 
                key={team.name} 
                onClick={() => { setSelectedLogo(team.logo); setName(team.name); setTag(team.tag); }}
                className={`relative aspect-square p-2.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${selectedLogo === team.logo ? 'border-[#4C60D2] bg-[#1C212E]' : 'border-[#2B3040] bg-[#151923] hover:border-[#4C60D2]/50'}`}
            >
                <span className="absolute font-rajdhani text-xs font-bold tracking-wider text-[#8C9AD6]">
                  {team.tag}
                </span>
                <img
                  src={team.logo}
                  alt={team.name}
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  className="relative z-[1] max-w-full max-h-full object-contain"
                />
            </div>
            ))}
        </div>

      </div>

      <div className="fixed inset-x-4 bottom-4 z-[9000] mx-auto flex max-w-[1000px] items-center gap-3 rounded-xl border border-[#4C60D2]/60 bg-[#11141E]/95 p-3 shadow-[0_15px_45px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <input
          type="text"
          aria-label="Nom complet de l'équipe"
          placeholder="Nom complet de l'équipe"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 flex-[3] rounded-lg border border-[#2B3040] bg-[#0A0D14] px-4 py-3 text-white font-bold outline-none transition-colors focus:border-[#4C60D2]"
        />
        <input
          type="text"
          aria-label="Tag de l'équipe"
          placeholder="TAG"
          value={tag}
          onChange={(event) => setTag(event.target.value.toUpperCase())}
          maxLength={4}
          className="w-24 rounded-lg border border-[#2B3040] bg-[#0A0D14] px-3 py-3 text-center text-[#8C9AD6] font-bold uppercase outline-none transition-colors focus:border-[#4C60D2]"
        />
        <button
          onClick={handleJoin}
          disabled={!isConnected || isSubmitting}
          className="shrink-0 rounded-lg bg-[#4C60D2] px-6 py-3 text-sm font-bold tracking-[1px] text-white uppercase shadow-[0_8px_20px_rgba(76,96,210,0.3)] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:cursor-wait disabled:opacity-50"
        >
          {isSubmitting ? 'CONNEXION…' : 'VALIDER L’ÉQUIPE'}
        </button>
        {error && (
          <p role="alert" className="absolute inset-x-0 bottom-full mx-auto mb-2 max-w-[700px] rounded-lg border border-[#ff3366]/40 bg-[#24131c] px-4 py-3 text-sm font-semibold text-[#ff8eaa] shadow-xl">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
