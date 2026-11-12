import { useState } from 'react';
import { socket } from '../../api/socket';
import { ORDERED_ROLES } from '../../constants/roles';
import { CARD_POOL } from '../../constants/cardPlayers';

// Import des sous-composants (les onglets)
import RosterTab from './tabs/RosterTab';
import CollectionTab from './tabs/CollectionTab';
import ShopTab from './tabs/ShopTab';
import HallOfFameTab from './tabs/HallOfFameTab';
import SkinsTab from './tabs/SkinsTab';
import { getOverallCollectionStats } from '../../constants/collectionConfig';

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
  const myAlbum = state.collectionAlbum?.[myId] || {};
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
    <div className="min-h-screen bg-[#080A10] text-[#F0F2F5] font-sans py-6 sm:py-10 px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-[1280px] mx-auto">
        
        {/* EN-TÊTE ÉLÉGANT & RESPONSIVE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222838] pb-4 sm:pb-6 mb-6 sm:mb-8 w-full">
          <div>
            <h1 className="font-rajdhani text-[28px] sm:text-[38px] m-0 font-bold tracking-[1px] text-white">
              CIRCUIT <span className="text-[#D4AF37]">PRO</span>
            </h1>
            <span className="text-text-faint text-[11px] sm:text-[13px] tracking-[1.5px] sm:tracking-[2px] uppercase font-medium">
              Gestion de Roster Officiel — Année {state.year || 1}
            </span>
          </div>

          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 w-full md:w-auto scrollbar-none">
            {(() => {
              const collectionStats = getOverallCollectionStats(myAlbum, state, myId, myCollection);
              const collectionBadge = collectionStats.unclaimedCount > 0 ? collectionStats.unclaimedCount : null;
              return [
                { id: 'roster', label: 'Gestion Équipe' },
                { id: 'collection', label: 'Collection', badge: collectionBadge },
                { id: 'shop', label: 'Boutique' },
                { id: 'skins', label: 'Casier' },
                { id: 'halloffame', label: 'Classement' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isReady || tab.id === 'roster') setActiveTab(tab.id);
                  }}
                  disabled={isReady && tab.id !== 'roster'}
                  className={`bg-transparent pb-2 sm:pb-3 px-3 sm:px-5 text-xs sm:text-sm font-semibold transition-all duration-200 uppercase tracking-[1px] border-b-2 shrink-0 whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-text-faint border-transparent'} ${(isReady && tab.id !== 'roster') ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-extrabold animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ));
            })()}
          </div>
        </div>

        {/* BANNIÈRE BONUS ZEUS */}
        {state.lastZeusBonuses?.[myId]?.bonus > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-950/30 to-[#0F121C] flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xl shrink-0">
                ⚡
              </div>
              <div>
                <p className="font-bold text-amber-300 text-sm tracking-wide uppercase font-rajdhani">
                  Bonus Zeus (Worlds Finals MVP) actif : +20% Gold !
                </p>
                <p className="text-xs text-amber-100/80">
                  Zeus a disputé le tournoi dans votre alignement : vos gains de tournoi ont été augmentés de <span className="font-bold text-amber-300">+{state.lastZeusBonuses[myId].bonus} $</span> (Gain total crédité : <span className="font-bold text-white">{state.lastZeusBonuses[myId].total} $</span>).
                </p>
              </div>
            </div>
          </div>
        )}

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
            state={state}
          />
        )}

        {activeTab === 'collection' && (
          <CollectionTab 
            state={state} 
            myId={myId} 
            myCollection={myCollection} 
            myAlbum={myAlbum}
            myEconomy={myEconomy} 
            getDynamicCard={getDynamicCard}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'skins' && <SkinsTab state={state} myId={myId} />}

        {activeTab === 'shop' && (
          <ShopTab 
            state={state}
            myId={myId}
            myEconomy={myEconomy} 
            isReady={isReady} 
            hasStarter={hasStarter} 
            myCollection={myCollection}
            myLineup={myLineup}
          />
        )}




        {activeTab === 'halloffame' && (
          <HallOfFameTab 
            state={state}
            myId={myId}
            sortedLeaderboard={sortedLeaderboard} 
            seasonScores={state.seasonScores} 
            history={state.history} 
          />
        )}
        
      </div>
    </div>
  );
}
