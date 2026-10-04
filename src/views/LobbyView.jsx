import React, { useState } from 'react';
import { TEAMS_DB } from '../constants/teams.js';

export default function LobbyView({ state, socket }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');

  const usedLogos = state.participants.map(p => p.logo).filter(Boolean);
  const availableLogos = TEAMS_DB.filter(t => !usedLogos.includes(t.logo));

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Entrez un nom d'équipe.");
    if (tag.length < 2 || tag.length > 4) return alert("L'abréviation (TAG) doit faire entre 2 et 4 caractères.");
    if (!selectedLogo) return alert("Sélectionnez une icône pour votre équipe.");
    socket.emit('join-lobby', name, tag, selectedLogo);
  };

  const amIJoined = state.participants.some(p => p.id === socket.id);

  if (amIJoined) {
    return (
      <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col items-center py-16 px-10 font-sans">
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
            <div className="mt-16 flex gap-5">
                <button 
                  onClick={() => socket.emit('start-draft')} 
                  className="py-5 px-10 bg-[#4C60D2] text-white border-none rounded-lg text-lg font-bold cursor-pointer tracking-[2px] shadow-[0_0_20px_rgba(76,96,210,0.4)] transition-transform hover:-translate-y-1 active:scale-95"
                >
                    DÉMARRER LA SAISON
                </button>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col items-center justify-center font-sans p-10">
      <div className="bg-[#151923] py-12 px-16 rounded-2xl border border-[#2B3040] max-w-[1200px] w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <h1 className="text-[#8C9AD6] mb-3 text-[48px] tracking-[4px] font-black uppercase">CIRCUIT ESPORT</h1>
        <p className="text-[#7A8190] mb-10 text-lg">Sélectionnez l'identité visuelle de votre franchise.</p>

        <h4 className="text-white mb-4 text-left text-base tracking-[1px] uppercase font-bold">1. CHOISISSEZ VOTRE LOGO</h4>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3 mb-10 max-h-[320px] overflow-y-auto p-4 bg-[#0A0D14] rounded-xl border border-[#2B3040]">
            {availableLogos.map(team => (
            <div 
                key={team.name} 
                onClick={() => { setSelectedLogo(team.logo); setName(team.name); setTag(team.tag); }}
                className={`aspect-square p-2.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${selectedLogo === team.logo ? 'border-[#4C60D2] bg-[#1C212E]' : 'border-[#2B3040] bg-[#151923] hover:border-[#4C60D2]/50'}`}
            >
                <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" />
            </div>
            ))}
        </div>

        <h4 className="text-white mb-4 text-left text-base tracking-[1px] uppercase font-bold">2. IDENTITÉ DE L'ÉQUIPE</h4>
        <div className="flex gap-5 mb-10">
            <input 
                type="text" 
                placeholder="Nom complet de l'équipe" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="flex-[3] p-5 rounded-lg border border-[#2B3040] bg-[#0A0D14] text-white text-lg font-bold outline-none focus:border-[#4C60D2] transition-colors"
            />
            <input 
                type="text" 
                placeholder="TAG (ex: T1)" 
                value={tag} 
                onChange={(e) => setTag(e.target.value.toUpperCase())} 
                maxLength={4}
                className="flex-1 p-5 rounded-lg border border-[#2B3040] bg-[#0A0D14] text-[#4C60D2] text-xl font-bold text-center uppercase outline-none focus:border-[#4C60D2] transition-colors"
            />
        </div>

        <button 
          onClick={handleJoin} 
          className="w-full p-6 rounded-lg bg-[#4C60D2] text-white border-none font-bold text-xl cursor-pointer tracking-[2px] uppercase transition-transform shadow-[0_8px_20px_rgba(76,96,210,0.3)] hover:-translate-y-1 active:scale-95"
        >
            VALIDER ET REJOINDRE LE LOBBY
        </button>
      </div>
    </div>
  );
}