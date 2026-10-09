import { useState } from 'react';
import { socket } from '../../api/socket';
import { ORDERED_ROLES } from '../../constants/roles';
import { CARD_POOL } from '../../constants/cardPlayers';


// Import des sous-composants (les onglets)
import RosterTab from './Tabs/RosterTab';
import ShopTab from './Tabs/ShopTab';
import SellTab from './Tabs/SellTab';
import CircuitTab from './Tabs/CircuitTab';
import HallOfFameTab from './Tabs/HallOfFameTab';
import SkinsTab from './Tabs/SkinsTab';


function getCard(id) {
  return CARD_POOL.find(c => c.id === id);
}

export default function CardsView({ state, setLineupCard, toggleLineupReady }) {
  const myId = socket.id;
  const [activeTab, setActiveTab] = useState('roster'); 

  // --- LOGIQUE MÉTIER ET CALCULS GLOBAUX ---
  const getDynamicCard = (cardId) => {
    const card = getCard(cardId);
    if (!card) return null;
    const dynamicCard = { ...card };
    
    // Règle spécifique pour Caliste
    if (dynamicCard.id.toLowerCase().includes('caliste') && dynamicCard.rarity === 'WANTED') {
      const played = state.cardStats?.[myId]?.[dynamicCard.id] || 0;
      if (dynamicCard.overall !== undefined) dynamicCard.overall += played;
      if (dynamicCard.rating !== undefined) dynamicCard.rating += played;
    }
    return dynamicCard;
  };

  const myCollection = state.cardCollections?.[myId] || {};
  const myLineup = state.activeLineups?.[myId] || {};
  const myEconomy = state.economy?.[myId] || 0;
  const isReady = state.readyPlayers.includes(myId);
  const lineupComplete = ORDERED_ROLES.every(role => myLineup[role]);
  const hasStarter = state.starterPackClaimed?.[myId];
  const currentEventIndex = state.eventIndex || 0;

  const teamPower = ORDERED_ROLES.reduce((total, role) => {
    const card = getDynamicCard(myLineup[role]);
    return total + (card ? (card.overall || card.rating || 80) : 0);
  }, 0) / 5;

  const sortedLeaderboard = [...(state.participants || [])].sort((a, b) => {
    const ptsA = state.seasonScores?.[a.id]?.points || 0;
    const ptsB = state.seasonScores?.[b.id]?.points || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const titlesA = state.seasonScores?.[a.id]?.titles || 0;
    const titlesB = state.seasonScores?.[b.id]?.titles || 0;
    return titlesB - titlesA;
  });

  const handleToggleReady = () => {
    if (!isReady) setActiveTab('roster');
    toggleLineupReady();
  };

  // --- RENDU PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#080A10] text-[#F0F2F5] font-sans py-10 px-5">
      <div className="max-w-[1280px] mx-auto">
        
        {/* EN-TÊTE ÉLÉGANT */}
        <div className="flex justify-between items-center border-b border-[#222838] pb-6 mb-8">
          <div>
            <h1 className="font-['Oswald'] text-[38px] m-0 font-semibold tracking-[1px] text-white">
              CIRCUIT <span className="text-[#D4AF37]">PRO</span>
            </h1>
            <span className="text-[#768196] text-[13px] tracking-[2px] uppercase font-medium">
              Gestion de Roster Officiel — Année {state.year || 1}
            </span>
          </div>

          <div className="flex gap-2">
            {[
              { id: 'roster', label: 'Gestion Équipe' },
              { id: 'shop', label: 'Boutique' },
              { id: 'sell', label: 'Revente' },
              { id: 'circuit', label: 'Compétitions' },
              { id: 'skins', label: 'Casier' },
              { id: 'halloffame', label: 'Classement' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (!isReady || tab.id === 'roster') setActiveTab(tab.id);
                }}
                disabled={isReady && tab.id !== 'roster'}
                className={`bg-transparent pb-3 px-6 text-sm font-semibold transition-all duration-200 uppercase tracking-[1px] border-b-2 ${activeTab === tab.id ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-[#768196] border-transparent'} ${(isReady && tab.id !== 'roster') ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENU DYNAMIQUE DES ONGLETS */}
        {activeTab === 'roster' && (
          <RosterTab 
            myId={myId} 
            isReady={isReady} 
            myLineup={myLineup} 
            myCollection={myCollection} 
            myEconomy={myEconomy} 
            getDynamicCard={getDynamicCard}
            setLineupCard={setLineupCard}
            setActiveTab={setActiveTab}
            toggleLineupReady={handleToggleReady}
            lineupComplete={lineupComplete}
            teamPower={teamPower}
          />
        )}

        {activeTab === 'skins' && <SkinsTab state={state} myId={myId} />}

        {activeTab === 'shop' && (
          <ShopTab 
            myEconomy={myEconomy} 
            isReady={isReady} 
            hasStarter={hasStarter} 
          />
        )}

        {activeTab === 'sell' && (
          <SellTab 
            myCollection={myCollection} 
            myLineup={myLineup} 
            myEconomy={myEconomy} 
            lockedCards={state.lockedCards?.[myId] || []}
            isReady={isReady} 
          />
        )}

        {activeTab === 'circuit' && (
          <CircuitTab 
            currentEventIndex={currentEventIndex} 
            history={state.history} 
          />
        )}

        {activeTab === 'halloffame' && (
          <HallOfFameTab 
            sortedLeaderboard={sortedLeaderboard} 
            seasonScores={state.seasonScores} 
            history={state.history} 
          />
        )}
        
      </div>
    </div>
  );
}