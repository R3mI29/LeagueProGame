import { useState, useEffect } from 'react';
import { socket } from './api/socket'; 
import { useDraftSocket } from './hooks/useDraftSocket';
import { isTournamentPhase, getMyActiveMatch } from './utils/bracketHelpers';
import { EVENTS } from './constants/seasonConfig';
import { TEAMS_DB } from './constants/teams'; // IMPORT AJOUTÉ

import LobbyView from './views/LobbyView';
import CardsView from './views/CardsView';
import ArenaView from './views/ArenaView';
import BracketView from './views/BracketView';
import DevCardsView from './views/DevCardView'; 
import PackOpener from './components/PackOpener'; 
import SeasonHub from './components/SeasonHub';
import SeasonRecapCinematic from './components/SeasonRecapCinematic';

import SwissStageView from './views/formats/SwissStageView';
import GslGroupView from './views/formats/GslGroupView';
import DoubleElimView from './views/formats/DoubleElimView';

import './styles/theme.css'; // Ton futur global.css

function TakeoverView({ state, socket }) {
  const [selectedBot, setSelectedBot] = useState(null);
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');

  const bots = state.participants.filter(p => p.id.startsWith('bot-') || p.isBot);

  useEffect(() => {
      if (selectedBot) {
          const bot = bots.find(b => b.id === selectedBot);
          setNewName(bot.name);
          setNewTag(bot.tag || '');
          setSelectedLogo(bot.logo || '');
      }
  }, [selectedBot, bots]);

  const usedLogos = state.participants.filter(p => p.id !== selectedBot).map(p => p.logo).filter(Boolean);
  const availableLogos = TEAMS_DB.filter(t => !usedLogos.includes(t.logo));

  const handleTakeover = () => {
    if (!selectedBot || !selectedLogo) return alert("Sélectionnez une équipe et un logo.");
    if (newTag.length < 2 || newTag.length > 4) return alert("Le TAG doit faire entre 2 et 4 caractères.");
    socket.emit('takeover-bot', selectedBot, newName, newTag, selectedLogo);
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col items-center justify-center font-sans p-10">
      <div className="bg-[#151923] p-[50px_60px] rounded-2xl border border-[#2B3040] max-w-[1200px] w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <h1 className="text-[#8C9AD6] mb-4 tracking-[2px] font-black text-[36px] uppercase">
          REJOINDRE LA PARTIE EN COURS
        </h1>
        <p className="text-[#7A8190] mb-10 text-lg">
          Sélectionnez une IA pour la remplacer. Vous récupérerez ses joueurs et ses crédits.
        </p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 mb-10 max-h-[250px] overflow-y-auto">
          {bots.map(bot => (
            <button 
              key={bot.id} 
              onClick={() => setSelectedBot(bot.id)}
              className="p-4 rounded-xl text-white flex items-center gap-4 text-base font-bold transition-all duration-200 cursor-pointer text-left"
              style={{ 
                backgroundColor: selectedBot === bot.id ? '#4C60D2' : '#1C212E', 
                border: selectedBot === bot.id ? '2px solid #6A7DE8' : '2px solid transparent', 
                boxShadow: selectedBot === bot.id ? '0 4px 15px rgba(76, 96, 210, 0.4)' : 'none' 
              }}
            >
              {bot.logo ? (
                <img src={bot.logo} alt="" className="w-8 h-8 object-contain shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-[#2B3040] rounded-md shrink-0" />
              )}
              <div className="min-w-0">
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis">[{bot.tag}] {bot.name}</div>
                  {bot.isBot && !bot.id.startsWith('bot-') && (
                    <div className="text-xs" style={{ color: selectedBot === bot.id ? '#D4DDF8' : '#7A8190' }}>
                      Joueur Déconnecté
                    </div>
                  )}
              </div>
            </button>
          ))}
          {bots.length === 0 && (
            <div className="col-span-full text-[#7A8190] p-5">Aucune IA disponible.</div>
          )}
        </div>

        {selectedBot && (
          <div className="animate-[fadeIn_0.3s]">
            <h4 className="text-white mb-4 text-left text-base tracking-[1px] uppercase">PERSONNALISER L'IDENTITÉ</h4>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] gap-2.5 justify-center mb-[30px] max-h-[220px] overflow-y-auto p-4 bg-[#0A0D14] rounded-xl border border-[#2B3040]">
              {availableLogos.map(team => (
                <div 
                  key={team.name} 
                  onClick={() => { setSelectedLogo(team.logo); setNewName(team.name); setNewTag(team.tag); }}
                  className="aspect-square p-2 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                  style={{ 
                    border: selectedLogo === team.logo ? '2px solid #4C60D2' : '1px solid #2B3040', 
                    background: selectedLogo === team.logo ? '#1C212E' : '#151923' 
                  }}
                >
                  <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" />
                </div>
              ))}
            </div>

            <div className="flex gap-5 mb-[30px]">
                <input 
                  type="text" 
                  placeholder="Nom complet" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="flex-[3] p-5 rounded-lg border border-[#2B3040] bg-[#0A0D14] text-white text-base font-bold outline-none focus:border-[#4C60D2]" 
                />
                <input 
                  type="text" 
                  placeholder="TAG (ex: T1)" 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value.toUpperCase())} 
                  maxLength={4} 
                  className="flex-1 p-5 rounded-lg border border-[#2B3040] bg-[#0A0D14] text-[#4C60D2] text-lg font-bold text-center uppercase outline-none focus:border-[#4C60D2]" 
                />
            </div>
            <button 
              onClick={handleTakeover} 
              className="w-full p-6 rounded-lg bg-[#4C60D2] text-white border-none font-bold text-lg cursor-pointer tracking-[2px] uppercase transition-transform hover:-translate-y-1 active:scale-95"
            >
              CONFIRMER LA FRANCHISE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const draft = useDraftSocket();
  const { state, showBracket } = draft;
  const [showDevMode, setShowDevMode] = useState(false);
  const [spectatedMatchId, setSpectatedMatchId] = useState(null);

  const liveHumanMatches = [];
  if (state.phase === 'simulation' || state.phase === 'tournament') {
      const checkMatch = (m) => {
          if (!m || !m.id) return;
          const isLive = m.status === 'simulating_events' || m.status === 'simulating_result' || m.status === 'pending';
          const isSpectated = m.id === spectatedMatchId; 
          const isMyMatch = m.teamA?.id === socket.id || m.teamB?.id === socket.id;

          if ((isLive || isSpectated) && !isMyMatch && m.teamA && m.teamB) {
              if (!m.teamA.isBot || !m.teamB.isBot) {
                  if (!liveHumanMatches.some(liveM => liveM.id === m.id)) liveHumanMatches.push(m);
              }
          }
      };
      if (state.bracket) state.bracket.flat().forEach(checkMatch);
      if (state.groups) state.groups.forEach(g => g.matches.forEach(checkMatch));
  }

  const spectatedMatch = spectatedMatchId ? liveHumanMatches.find(m => m.id === spectatedMatchId) : null;

  const renderSpectatorPanel = (myActiveMatch) => {
      if (myActiveMatch || liveHumanMatches.length === 0 || spectatedMatchId) return null;
      return (
          <div className="fixed top-20 right-5 bg-[#11141E] border border-[#4C60D2] rounded-lg p-4 z-[9000] shadow-[0_5px_20px_rgba(0,0,0,0.5)] w-[280px] animate-[fadeIn_0.5s]">
              <h4 className="text-[#8C9AD6] m-0 mb-4 font-sans flex items-center gap-2">
                <div className="w-2 h-2 bg-[#e63946] rounded-full animate-pulse"></div> MATCHS EN DIRECT
              </h4>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                  {liveHumanMatches.map(m => (
                      <button 
                        key={m.id} 
                        onClick={() => setSpectatedMatchId(m.id)} 
                        className="bg-[#151923] text-white border border-[#2B3040] p-3 rounded-md cursor-pointer text-[13px] text-left flex justify-between items-center transition-colors hover:border-[#4C60D2]"
                      >
                          <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">[{m.teamA?.tag}] <span className="text-[#768196] font-normal mx-1">vs</span> [{m.teamB?.tag}]</span>
                          <span className="text-lg shrink-0 ml-2">👁️</span>
                      </button>
                  ))}
              </div>
          </div>
      );
  };

  const renderMainContent = () => {
    if (state.phase === 'lobby') return <LobbyView state={state} socket={socket} {...draft} />;

    const myPlayerInfo = state.participants?.find(p => p.id === socket.id);
    if (!myPlayerInfo && state.phase !== 'lobby') return <TakeoverView state={state} socket={socket} />;
    
    if (state.phase === 'season_hub') return <SeasonHub state={state} />;
    if (state.phase === 'cards') return <CardsView state={state} openPack={draft.openPack} setLineupCard={draft.setLineupCard} toggleLineupReady={draft.toggleLineupReady} />;

    const myActiveMatch = getMyActiveMatch(state, socket.id);

    if (spectatedMatch && !myActiveMatch) {
      return (
        <div className="relative">
          <div className="absolute top-5 left-5 z-[9999]">
            <button 
              onClick={() => setSpectatedMatchId(null)} 
              className="bg-[#151923] text-white border border-[#4C60D2] p-[10px_20px] rounded-md font-bold cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.4)] transition-colors hover:bg-[#1C212E]"
            >
              ⬅ QUITTER SPECTATEUR
            </button>
          </div>
          <ArenaView match={spectatedMatch} matchReady={() => {}} dismissMatch={() => setSpectatedMatchId(null)} state={state} isSpectator={true} />
        </div>
      );
    }

    if (myActiveMatch) {
      return <ArenaView match={myActiveMatch} matchReady={draft.matchReady} dismissMatch={draft.dismissMatch} state={state} />;
    }

    if (state.phase === 'tournament' || state.phase === 'simulation' || (isTournamentPhase(state) && showBracket)) {
      const currentEvent = EVENTS[state.eventIndex || 0];
      let TournamentComponent = null;

      if (state.tournamentPhase === 'swiss') TournamentComponent = <SwissStageView state={state} event={currentEvent} />;
      else if (state.tournamentPhase === 'groups') TournamentComponent = <GslGroupView state={state} event={currentEvent} />;
      else if (state.tournamentPhase === 'bracket') {
          if (currentEvent?.format === 'double_elim') TournamentComponent = <DoubleElimView state={state} event={currentEvent} />;
          else TournamentComponent = <BracketView state={state} event={currentEvent} />;
      }

      return (
        <>
          {renderSpectatorPanel(myActiveMatch)}
          {TournamentComponent}
        </>
      ); 
    }

    return null;
  };

  const myLastOpened = state.lastOpenedPack?.[socket.id] || [];
  const playerName = state.participants?.find(p => p.id === socket.id)?.name || "";
  const isDevModeUnlocked = /^dev\d*$/i.test(playerName.toLowerCase());

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      
      {myLastOpened.length > 0 && <PackOpener cardIds={myLastOpened} onClose={() => socket.emit('close-pack')} />}

      {renderMainContent()}

      {isDevModeUnlocked && !showDevMode && (
        <button 
          onClick={() => setShowDevMode(true)} 
          className="fixed bottom-5 right-5 bg-[#0D1219] border-2 border-accent-pink text-accent-pink z-[9999] cursor-pointer p-[10px_20px] rounded-lg text-sm font-rajdhani tracking-[2px] font-bold shadow-[0_0_15px_rgba(255,51,102,0.4)] transition-all duration-200 hover:bg-accent-pink hover:text-white"
        >
          ⚙️ MODE DEV
        </button>
      )}

      {showDevMode && <DevCardsView onClose={() => setShowDevMode(false)} state={state} />}
      {state && <SeasonRecapCinematic state={state} />}
    </>
  );
}