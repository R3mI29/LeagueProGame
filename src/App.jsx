import { useState, useEffect } from 'react';
import { socket } from './api/socket'; 
import { useDraftSocket } from './hooks/useDraftSocket';
import { isTournamentPhase, getMyActiveMatch } from './utils/bracketHelpers';
import { EVENTS } from './constants/seasonConfig';

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

import './styles/theme.css';

export const TEAMS_DB = [
  { name: "Anyone's Legend", tag: "AL", logo: "/equipes/anyone-legend.webp" },
  { name: "Bilibili Gaming", tag: "BLG", logo: "/equipes/bilibili-gaming.webp" },
  { name: "BRION", tag: "BRO", logo: "/equipes/brion.webp" },
  { name: "Cloud9", tag: "C9", logo: "/equipes/cloud9.webp" },
  { name: "Dignitas", tag: "DIG", logo: "/equipes/dignitas.webp" },
  { name: "Disguised", tag: "DSG", logo: "/equipes/disguised.webp" },
  { name: "Dplus KIA", tag: "DK", logo: "/equipes/dplus.webp" },
  { name: "DRX", tag: "DRX", logo: "/equipes/drx.webp" },
  { name: "Edward Gaming", tag: "EDG", logo: "/equipes/edward-gaming.webp" },
  { name: "FearX", tag: "FOX", logo: "/equipes/fearx.webp" },
  { name: "FlyQuest", tag: "FLY", logo: "/equipes/flyquest.webp" },
  { name: "Fnatic", tag: "FNC", logo: "/equipes/fnatic.webp" },
  { name: "G2 Esports", tag: "G2", logo: "/equipes/g2.webp" },
  { name: "Gen.G", tag: "GEN", logo: "/equipes/geng.webp" },
  { name: "GiantX", tag: "GX", logo: "/equipes/giantx.webp" },
  { name: "Hanwha Life Esports", tag: "HLE", logo: "/equipes/hle.webp" },
  { name: "Invictus Gaming", tag: "IG", logo: "/equipes/invictus-gaming.webp" },
  { name: "JD Gaming", tag: "JDG", logo: "/equipes/jd-gaming.webp" },
  { name: "Karmine Corp", tag: "KC", logo: "/equipes/kc.webp" },
  { name: "KT Rolster", tag: "KT", logo: "/equipes/kt-rolster.webp" },
  { name: "LGD Gaming", tag: "LGD", logo: "/equipes/lgd-gaming.webp" },
  { name: "LNG Esports", tag: "LNG", logo: "/equipes/lng.webp" },
  { name: "Lunary", tag: "LNY", logo: "/equipes/lunary.webp" },
  { name: "Lyon Gaming", tag: "LYN", logo: "/equipes/lyon.webp" },
  { name: "Movistar KOI", tag: "MKOI", logo: "/equipes/mkoi.webp" },
  { name: "NAVI", tag: "NAVI", logo: "/equipes/navi.webp" },
  { name: "Ninjas in Pyjamas", tag: "NIP", logo: "/equipes/nip.webp" },
  { name: "Nongshim RedForce", tag: "NS", logo: "/equipes/nongshim.webp" },
  { name: "OMG", tag: "OMG", logo: "/equipes/omg.webp" },
  { name: "RNG", tag: "RNG", logo: "/equipes/royal-never-give-up.webp" },
  { name: "Sentinels", tag: "SEN", logo: "/equipes/sentinels.webp" },
  { name: "Shifters", tag: "SHF", logo: "/equipes/shifters.webp" },
  { name: "Shopify Rebellion", tag: "SR", logo: "/equipes/shopify-rebellion.webp" },
  { name: "SK Gaming", tag: "SK", logo: "/equipes/sk.webp" },
  { name: "Solary", tag: "SLY", logo: "/equipes/solary.webp" },
  { name: "Soopers", tag: "SPR", logo: "/equipes/soopers.webp" },
  { name: "T1", tag: "T1", logo: "/equipes/t1.webp" },
  { name: "Team Heretics", tag: "TH", logo: "/equipes/team-heretics.webp" },
  { name: "Team Liquid", tag: "TL", logo: "/equipes/team-liquid.webp" },
  { name: "ThunderTalk Gaming", tag: "TT", logo: "/equipes/thundertalk.webp" },
  { name: "Top Esports", tag: "TES", logo: "/equipes/top-esports.webp" },
  { name: "Team Vitality", tag: "VIT", logo: "/equipes/vitality.webp" },
  { name: "Team WE", tag: "WE", logo: "/equipes/we.webp" },
  { name: "Weibo Gaming", tag: "WBG", logo: "/equipes/weibo.webp" },
  { name: "ZyB", tag: "ZYB", logo: "/equipes/zyb.webp" }
];

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
  }, [selectedBot]);

  const usedLogos = state.participants.filter(p => p.id !== selectedBot).map(p => p.logo).filter(Boolean);
  const availableLogos = TEAMS_DB.filter(t => !usedLogos.includes(t.logo));

  const handleTakeover = () => {
    if (!selectedBot || !selectedLogo) return alert("Sélectionnez une équipe et un logo.");
    if (newTag.length < 2 || newTag.length > 4) return alert("Le TAG doit faire entre 2 et 4 caractères.");
    socket.emit('takeover-bot', selectedBot, newName, newTag, selectedLogo);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0D14', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '40px' }}>
      <div style={{ backgroundColor: '#151923', padding: '50px 60px', borderRadius: '16px', border: '1px solid #2B3040', maxWidth: '1200px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <h1 style={{ color: '#8C9AD6', marginBottom: '16px', letterSpacing: '2px', fontWeight: 900, fontSize: '36px', textTransform: 'uppercase' }}>REJOINDRE LA PARTIE EN COURS</h1>
        <p style={{ color: '#7A8190', marginBottom: '40px', fontSize: '18px' }}>Sélectionnez une IA pour la remplacer. Vous récupérerez ses joueurs et ses crédits.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '40px', maxHeight: '250px', overflowY: 'auto' }}>
          {bots.map(bot => (
            <button key={bot.id} onClick={() => setSelectedBot(bot.id)}
              style={{ padding: '16px', borderRadius: '10px', backgroundColor: selectedBot === bot.id ? '#4C60D2' : '#1C212E', color: '#FFF', display: 'flex', alignItems: 'center', gap: '16px', border: selectedBot === bot.id ? '2px solid #6A7DE8' : '2px solid transparent', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: selectedBot === bot.id ? '0 4px 15px rgba(76, 96, 210, 0.4)' : 'none' }}>
              {bot.logo ? <img src={bot.logo} alt="" style={{width: '32px', height: '32px', objectFit: 'contain'}} /> : <div style={{width:'32px', height:'32px', background:'#2B3040', borderRadius:'6px'}}/>}
              <div style={{textAlign: 'left'}}>
                  <div>[{bot.tag}] {bot.name}</div>
                  {bot.isBot && !bot.id.startsWith('bot-') && <div style={{fontSize: '12px', color: selectedBot === bot.id ? '#D4DDF8' : '#7A8190'}}>Joueur Déconnecté</div>}
              </div>
            </button>
          ))}
          {bots.length === 0 && <div style={{ color: '#7A8190', gridColumn: '1 / -1', padding: '20px' }}>Aucune IA disponible.</div>}
        </div>

        {selectedBot && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <h4 style={{ color: '#FFF', marginBottom: '16px', textAlign: 'left', fontSize: '16px', letterSpacing: '1px' }}>PERSONNALISER L'IDENTITÉ</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px', justifyContent: 'center', marginBottom: '30px', maxHeight: '220px', overflowY: 'auto', padding: '16px', background: '#0A0D14', borderRadius: '12px', border: '1px solid #2B3040' }}>
              {availableLogos.map(team => (
                <div key={team.name} onClick={() => { setSelectedLogo(team.logo); setNewName(team.name); setNewTag(team.tag); }}
                  style={{ aspectRatio: '1/1', padding: '8px', borderRadius: '10px', border: selectedLogo === team.logo ? '2px solid #4C60D2' : '1px solid #2B3040', background: selectedLogo === team.logo ? '#1C212E' : '#151923', cursor: 'pointer', transition: 'all 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={team.logo} alt={team.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <input type="text" placeholder="Nom complet" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 3, padding: '20px', borderRadius: '10px', border: '1px solid #2B3040', backgroundColor: '#0A0D14', color: '#FFF', fontSize: '16px', fontWeight: 'bold' }} />
                <input type="text" placeholder="TAG (ex: T1)" value={newTag} onChange={(e) => setNewTag(e.target.value.toUpperCase())} maxLength={4} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: '1px solid #2B3040', backgroundColor: '#0A0D14', color: '#4C60D2', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }} />
            </div>
            <button onClick={handleTakeover} style={{ width: '100%', padding: '24px', borderRadius: '10px', backgroundColor: '#4C60D2', color: '#FFF', border: 'none', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' }}>
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
          <div style={{ position: 'fixed', top: 80, right: 20, background: '#11141E', border: '1px solid #4C60D2', borderRadius: '8px', padding: '15px', zIndex: 9000, boxShadow: '0 5px 20px rgba(0,0,0,0.5)', width: '280px', animation: 'fadeIn 0.5s' }}>
              <h4 style={{ color: '#8C9AD6', margin: '0 0 15px 0', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#e63946', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div> MATCHS EN DIRECT
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {liveHumanMatches.map(m => (
                      <button key={m.id} onClick={() => setSpectatedMatchId(m.id)} style={{ background: '#151923', color: '#FFF', border: '1px solid #2B3040', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4C60D2'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2B3040'}>
                          <span style={{ fontWeight: 'bold' }}>[{m.teamA?.tag}] <span style={{color: '#768196'}}>vs</span> [{m.teamB?.tag}]</span>
                          <span style={{ fontSize: '18px' }}>👁️</span>
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
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 9999 }}>
            <button onClick={() => setSpectatedMatchId(null)} style={{ background: '#151923', color: '#FFF', border: '1px solid #4C60D2', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)' }}>⬅ QUITTER SPECTATEUR</button>
          </div>
          <ArenaView match={spectatedMatch} matchReady={() => {}} dismissMatch={() => setSpectatedMatchId(null)} state={state} isSpectator={true} />
        </div>
      );
    }

    if (myActiveMatch) {
      return <ArenaView match={myActiveMatch} matchReady={draft.matchReady} dismissMatch={draft.dismissMatch} state={state} />;
    }

    // Le routage direct sans TournamentWrapper :
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
      <style>{`@keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(230, 57, 70, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); } }`}</style>
      
      {myLastOpened.length > 0 && <PackOpener cardIds={myLastOpened} onClose={() => socket.emit('close-pack')} />}

      {renderMainContent()}

      {isDevModeUnlocked && !showDevMode && (
        <button onClick={() => setShowDevMode(true)} style={{ position: 'fixed', bottom: 20, right: 20, background: '#0D1219', border: '2px solid #ff3366', color: '#ff3366', zIndex: 9999, cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '2px', fontWeight: 'bold', boxShadow: '0 0 15px rgba(255, 51, 102, 0.4)', transition: 'all 0.2s ease-in-out' }}>
          ⚙️ MODE DEV
        </button>
      )}

      {showDevMode && <DevCardsView onClose={() => setShowDevMode(false)} state={state} />}
      {state && <SeasonRecapCinematic state={state} />}
    </>
  );
}