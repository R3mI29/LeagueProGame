import { useState } from 'react';
import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';
import { CARD_POOL } from '../constants/cardPlayers';
import { EVENTS } from '../constants/seasonConfig';
import CardIllustration from '../components/CardIllustration';

function getCard(id) {
  return CARD_POOL.find(c => c.id === id);
}

export default function CardsView({ state, setLineupCard, toggleLineupReady }) {
  const myId = socket.id;
  const [activeTab, setActiveTab] = useState('roster'); 
  const [activeRole, setActiveRole] = useState(ORDERED_ROLES[0]);

  const getDynamicCard = (cardId) => {
    const card = getCard(cardId);
    if (!card) return null;
    const dynamicCard = { ...card };
    
    if (dynamicCard.id.toLowerCase().includes('caliste') && dynamicCard.rarity === 'WANTED') {
      const played = state.cardStats?.[myId]?.[dynamicCard.id] || 0;
      if (dynamicCard.overall !== undefined) dynamicCard.overall += played;
      if (dynamicCard.rating !== undefined) dynamicCard.rating += played;
    }
    return dynamicCard;
  };

  const rawCollection = state.cardCollections?.[myId] || {};
  const myLineup = state.activeLineups?.[myId] || {};
  
  const myCollection = { ...rawCollection };
  const isReady = state.readyPlayers.includes(myId);
  const lineupComplete = ORDERED_ROLES.every(role => myLineup[role]);
  
  const ownedCardsForRole = (role) => CARD_POOL.filter(c => c.role === role && myCollection[c.id] !== undefined);

  const teamPower = ORDERED_ROLES.reduce((total, role) => {
    const card = getDynamicCard(myLineup[role]);
    return total + (card ? (card.overall || card.rating || 80) : 0);
  }, 0) / 5;

  const sortedLeaderboard = [...state.participants].sort((a, b) => {
    const ptsA = state.seasonScores?.[a.id]?.points || 0;
    const ptsB = state.seasonScores?.[b.id]?.points || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const titlesA = state.seasonScores?.[a.id]?.titles || 0;
    const titlesB = state.seasonScores?.[b.id]?.titles || 0;
    return titlesB - titlesA;
  });

  const currentEventIndex = state.eventIndex || 0;
  const myEconomy = state.economy?.[myId] || 0;
  const hasStarter = state.starterPackClaimed?.[myId];

  const handleToggleReady = () => {
    if (!isReady) setActiveTab('roster');
    toggleLineupReady();
  };

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F0F2F5] font-sans py-10 px-5">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
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

        {/* ONGLET 1 : ROSTER */}
        {activeTab === 'roster' && (
          <div className="grid grid-cols-[1fr_380px] gap-8 animate-[fadeIn_0.3s]">
            
            <div className="bg-[#11141E] border border-[#222838] rounded-lg p-8 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-['Oswald'] m-0 text-white text-[24px] tracking-[0.5px]">DRAFT D'ÉQUIPE</h2>
                <div className="text-sm text-[#768196]">SÉLECTIONNEZ VOS 5 TITULAIRES</div>
              </div>
              
              <div className="flex gap-2 mb-8 bg-[#0C0E14] p-1.5 rounded-md">
                {ORDERED_ROLES.map(role => {
                  const selectedCard = getDynamicCard(myLineup[role]);
                  return (
                    <button 
                      key={role} 
                      onClick={() => !isReady && setActiveRole(role)}
                      className={`flex-1 p-[12px_8px] rounded border-none flex flex-col items-center transition-colors ${activeRole === role ? 'bg-[#1A1E2C] text-white' : 'bg-transparent text-[#768196]'} ${isReady ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-[11px] font-semibold tracking-[1px] uppercase mb-1">{role}</span>
                      <span className={`text-[13px] ${selectedCard ? 'text-[#D4AF37] font-semibold' : 'text-[#768196] font-normal'}`}>
                        {selectedCard ? selectedCard.baseName : 'Non assigné'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-5 flex-wrap min-h-[300px]">
                {ownedCardsForRole(activeRole).length === 0 ? (
                  <div className="w-full flex items-center justify-center text-[#768196] italic">Aucun joueur disponible pour le poste de {activeRole}.</div>
                ) : (
                  ownedCardsForRole(activeRole).map(baseCard => {
                    const card = getDynamicCard(baseCard.id); 
                    const selected = myLineup[activeRole] === card.id;
                    const contract = myCollection[card.id] || 0;
                    const isLifetime = contract === 'LIFETIME';
                    const isExpired = contract === 0;
                    
                    return (
                      <div 
                        key={card.id} 
                        onClick={() => (!isExpired && !isReady) && setLineupCard(activeRole, card.id)} 
                        className={`flex flex-col items-center gap-2.5 transition-transform duration-200 ${(isExpired || isReady) ? 'cursor-not-allowed' : 'cursor-pointer'} ${selected ? '-translate-y-[6px]' : ''}`}
                      >
                        <div 
                          className={`p-1 rounded-xl transition-all ${selected ? 'border-2 border-[#D4AF37] shadow-[0_12px_24px_rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.05)]' : 'border-2 border-transparent'} ${isExpired ? 'grayscale opacity-50' : ''}`}
                        >
                          <CardIllustration card={card} width={155} />
                        </div>
                        
                        <div 
                          className="rounded-full px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 tracking-[0.5px]"
                          style={{ 
                            background: isLifetime ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : (isExpired ? 'linear-gradient(135deg, #ff3366 0%, #88001b 100%)' : 'rgba(8, 10, 16, 0.95)'), 
                            border: `1px solid ${isLifetime ? '#FFF' : (isExpired ? '#FFB3C6' : '#D4AF37')}`, 
                            color: isLifetime || isExpired ? '#FFF' : '#D4AF37', 
                            boxShadow: `0 4px 15px ${isLifetime ? 'rgba(212, 175, 55, 0.4)' : 'rgba(0,0,0,0.6)'}`
                          }}
                        >
                          {isLifetime ? '♾️ À VIE' : isExpired ? '⚠️ EXPIRÉ' : <><span className="text-[11px] opacity-80">✍️</span> {contract} TRN</>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* BARRE LATÉRALE */}
            <div className="flex flex-col gap-6">
              <div className="bg-[#11141E] border border-[#222838] rounded-lg p-8 text-center">
                <div className="text-[11px] text-[#768196] tracking-[2px] uppercase mb-2">Moyenne d'Équipe</div>
                <div className={`text-[56px] font-['Oswald'] font-semibold ${teamPower > 0 ? 'text-[#D4AF37]' : 'text-[#768196]'}`}>
                  {teamPower > 0 ? Math.round(teamPower) : '-'}
                </div>
              </div>

              <div className="bg-[#131621] border border-[#222838] rounded-lg p-6 text-center">
                <h3 className="m-0 mb-4 font-['Oswald'] text-white text-[18px] font-medium tracking-[0.5px]">TRÉSORERIE</h3>
                <div className="text-[24px] font-bold text-[#00e676] mb-5">
                  {myEconomy} 💲 CRÉDITS
                </div>
                <button 
                  onClick={() => !isReady && setActiveTab('shop')} 
                  disabled={isReady}
                  className={`w-full border-none p-4 rounded text-sm font-bold ${isReady ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#D4AF37] text-black cursor-pointer'}`}
                >
                  ALLER À LA BOUTIQUE
                </button>
              </div>

              <button 
                onClick={handleToggleReady} 
                disabled={!lineupComplete && !isReady} 
                className={`border-none p-5 rounded-lg text-[15px] font-bold transition-all duration-200 uppercase tracking-[1px] ${(!lineupComplete && !isReady) ? 'cursor-not-allowed' : 'cursor-pointer'} ${isReady ? 'bg-[#D4AF37] text-black' : lineupComplete ? 'bg-white text-black' : 'bg-[#1F2433] text-[#768196]'}`}
              >
                {isReady ? 'ROSTER VERROUILLÉ ✓' : lineupComplete ? 'VALIDER LE ROSTER' : 'ROSTER INCOMPLET'}
              </button>
            </div>
          </div>
        )}

        {/* ONGLET 2 : BOUTIQUE */}
        {activeTab === 'shop' && (
          <div className="animate-[fadeIn_0.3s]">
            <div className="text-center mb-10">
              <h2 className="font-['Oswald'] text-[36px] m-0 mb-2.5 text-white">
                BOUTIQUE DU CIRCUIT
              </h2>
              <p className="text-[#768196] text-[16px]">
                Recrutez de nouveaux talents. Les packs supérieurs offrent de meilleures chances d'obtenir des joueurs d'élite.
              </p>
              <div className="text-[28px] font-bold text-[#00e676] mt-5">
                SOLDE : 💲 {myEconomy} CRÉDITS
              </div>
            </div>

            <div className="flex gap-[30px] justify-center flex-wrap">
              
              {!hasStarter && (
                <div className="bg-[#11141E] border-2 border-[#00e676] rounded-xl p-[30px] w-[300px] text-center shadow-[0_0_30px_rgba(0,230,118,0.2)]">
                  <div className="text-[50px] mb-2.5">🎁</div>
                  <h3 className="font-['Oswald'] text-[#00e676] text-[24px] m-0 mb-2.5">PACK DE DÉPART</h3>
                  <p className="text-[#768196] text-[14px] mb-5 min-h-[60px]">Une base solide pour débuter votre saison. Contient 10 cartes de contrat À VIE.</p>
                  <div className="text-[24px] font-bold text-white mb-5">GRATUIT</div>
                  <button 
                    onClick={() => socket.emit('buy-pack', 'standard')} 
                    disabled={isReady} 
                    className={`w-full border-none p-3.5 rounded font-bold text-[16px] ${isReady ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#00e676] text-black cursor-pointer'}`}
                  >
                    OUVRIR
                  </button>
                </div>
              )}

              {hasStarter && (
                <>
                  <div className="bg-[#11141E] border border-[#222838] rounded-xl p-[30px] w-[300px] text-center transition-transform cursor-default">
                    <div className="text-[50px] mb-2.5">📦</div>
                    <h3 className="font-['Oswald'] text-white text-[24px] m-0 mb-2.5">PACK STANDARD</h3>
                    <p className="text-[#768196] text-[14px] mb-5 min-h-[60px]">Idéal pour commencer. Probabilités classiques (5 cartes).</p>
                    <div className="text-[28px] font-bold text-[#00e676] mb-5">100 💲</div>
                    <button 
                      onClick={() => socket.emit('buy-pack', 'standard')} 
                      disabled={myEconomy < 100 || isReady}
                      className={`w-full border-none p-3.5 rounded font-bold text-[16px] ${(myEconomy >= 100 && !isReady) ? 'bg-white text-black cursor-pointer' : 'bg-[#333] text-[#888] cursor-not-allowed'}`}
                    >ACHETER</button>
                  </div>

                  <div className="bg-[linear-gradient(180deg,rgba(0,229,255,0.1)_0%,#11141E_100%)] border border-[#00e5ff] rounded-xl p-[30px] w-[300px] text-center shadow-[0_10px_30px_rgba(0,229,255,0.1)]">
                    <div className="text-[50px] mb-2.5">💎</div>
                    <h3 className="font-['Oswald'] text-[#00e5ff] text-[24px] m-0 mb-2.5">PACK ÉLITE</h3>
                    <p className="text-[#768196] text-[14px] mb-5 min-h-[60px]">Chances doublées d'obtenir des cartes Rares, Épiques, Légendaires et WANTED.</p>
                    <div className="text-[28px] font-bold text-[#00e676] mb-5">250 💲</div>
                    <button 
                      onClick={() => socket.emit('buy-pack', 'elite')} 
                      disabled={myEconomy < 250 || isReady}
                      className={`w-full border-none p-3.5 rounded font-bold text-[16px] ${(myEconomy >= 250 && !isReady) ? 'bg-[#00e5ff] text-black cursor-pointer' : 'bg-[#333] text-[#888] cursor-not-allowed'}`}
                    >ACHETER</button>
                  </div>

                  <div className="bg-[linear-gradient(180deg,rgba(212,175,55,0.15)_0%,#11141E_100%)] border border-[#D4AF37] rounded-xl p-[30px] w-[300px] text-center shadow-[0_10px_30px_rgba(212,175,55,0.15)]">
                    <div className="text-[50px] mb-2.5">👑</div>
                    <h3 className="font-['Oswald'] text-[#D4AF37] text-[24px] m-0 mb-2.5">PACK LÉGENDE</h3>
                    <p className="text-[#768196] text-[14px] mb-5 min-h-[60px]">Chances multipliées par 5 pour les cartes de niveau Épique, Légendaire et WANTED.</p>
                    <div className="text-[28px] font-bold text-[#00e676] mb-5"> 500 💲</div>
                    <button 
                      onClick={() => socket.emit('buy-pack', 'legendary')} 
                      disabled={myEconomy < 500 || isReady}
                      className={`w-full border-none p-3.5 rounded font-bold text-[16px] ${(myEconomy >= 500 && !isReady) ? 'bg-[#D4AF37] text-black cursor-pointer' : 'bg-[#333] text-[#888] cursor-not-allowed'}`}
                    >ACHETER</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 3 : REVENTE */}
        {activeTab === 'sell' && (
          <div className="animate-[fadeIn_0.3s]">
            <div className="text-center mb-10">
              <h2 className="font-['Oswald'] text-[36px] m-0 mb-2.5 text-white">
                MARCHÉ DES TRANSFERTS
              </h2>
              <p className="text-[#768196] text-[16px]">
                Revendez définitivement des joueurs qui ne figurent pas dans votre équipe titulaire pour récupérer des crédits.
              </p>
              <div className="text-[28px] font-bold text-[#00e676] mt-5">
                SOLDE : 💲 {myEconomy} CRÉDITS
              </div>
            </div>

            <div className="flex gap-6 flex-wrap justify-center">
              {Object.keys(myCollection)
                .filter(cardId => myCollection[cardId] !== 0 && myCollection[cardId] !== 'LIFETIME' && !Object.values(myLineup).includes(cardId))
                .map(cardId => {
                  const card = getCard(cardId);
                  if (!card) return null;
                  
                  const contract = myCollection[cardId];
                  const isLifetime = contract === 'LIFETIME';
                  
                  let price = 10;
                  if (card.rarity === 'Rare') price = 25;
                  else if (card.rarity === 'Épique') price = 50;
                  else if (card.rarity === 'Légendaire' || card.rarity === 'WANTED') price = 100;

                  return (
                    <div key={cardId} className="flex flex-col items-center gap-3 bg-[#11141E] p-5 rounded-xl border border-[#222838] transition-transform shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                      <CardIllustration card={card} width={140} />
                      
                      <div className="text-xs text-[#768196] font-bold mt-2">
                        {isLifetime ? '♾️ CONTRAT À VIE' : `CONTRAT: ${contract} TRN`}
                      </div>
                      
                      <button 
                        onClick={() => !isReady && socket.emit('sell-card', cardId)}
                        disabled={isReady}
                        className={`w-full border-none p-2.5 rounded font-bold text-[14px] transition-colors ${isReady ? 'bg-[#444] text-[#888] cursor-not-allowed' : 'bg-[#e63946] text-white cursor-pointer'}`}
                      >
                        VENDRE LE JOUEUR ( 💲 {price} )
                      </button>
                    </div>
                  );
              })}
              
              {Object.keys(myCollection).filter(cardId => myCollection[cardId] !== 0 && myCollection[cardId] !== 'LIFETIME' && !Object.values(myLineup).includes(cardId)).length === 0 && (
                <div className="w-full text-center text-[#768196] p-10 italic bg-[#11141E] rounded-lg border border-[#222838]">
                  Aucun joueur disponible à la vente.<br/>
                  (Les joueurs de votre équipe titulaire et ceux sous contrat À VIE sont protégés et ne peuvent pas être vendus).
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 4 : CALENDRIER & COMPÉTITIONS */}
        {activeTab === 'circuit' && (
          <div className="animate-[fadeIn_0.3s]">
            <div className="text-center mb-10">
              <h2 className="font-['Oswald'] text-[32px] m-0 mb-2.5 text-white">
                FEUILLE DE ROUTE OFFICIELLE
              </h2>
              <p className="text-[#768196] text-[15px]">
                Le calendrier des tournois majeurs de la saison. Préparez votre roster pour chaque échéance.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-5">
              {EVENTS.map((tourney, index) => {
                const isActive = index === currentEventIndex;
                const isCompleted = index < currentEventIndex;
                const pastWinners = state.history?.filter(h => h.eventId === tourney.id) || [];
                const latestWinner = pastWinners[pastWinners.length - 1]?.winnerName;

                return (
                  <div 
                    key={tourney.id}
                    className={`bg-[#11141E] rounded-xl p-[24px_20px] flex flex-col items-center relative transition-all duration-300 ${isActive ? '-translate-y-1' : ''} ${isCompleted ? 'opacity-70' : (isActive ? 'opacity-100' : 'opacity-80')}`}
                    style={{
                      border: isActive ? `1px solid ${tourney.color}` : `1px solid #222838`,
                      boxShadow: isActive ? `0 0 25px ${tourney.color}15` : 'none',
                    }}
                  >
                    {isActive && (
                      <div className="absolute -top-3 text-black px-3 py-1 rounded-xl font-bold text-[11px] tracking-[1px]" style={{ background: tourney.color }}>
                        EN COURS
                      </div>
                    )}
                    {isCompleted && (
                      <div className="absolute -top-3 bg-[#3B4154] text-white px-3 py-1 rounded-xl font-bold text-[11px] tracking-[1px]">
                        TERMINÉ
                      </div>
                    )}

                    <div className="h-[80px] flex items-center justify-center mb-4 w-full">
                      <img 
                        src={tourney.logo} 
                        alt={tourney.shortName} 
                        className={`max-h-full max-w-[80px] object-contain ${isActive ? '' : 'grayscale-[30%]'}`} 
                        style={{ filter: isActive ? `drop-shadow(0 0 8px ${tourney.color}40)` : '' }}
                      />
                    </div>

                    <h3 className={`font-['Oswald'] m-0 mb-2 text-white text-center ${tourney.isMajor ? 'text-[22px]' : 'text-[18px]'}`}>
                      {tourney.name}
                    </h3>

                    <div className="text-[12px] text-[#768196] mb-5 uppercase tracking-[1px]">
                      {tourney.format === 'gsl_to_single' ? 'Groupes GSL' : tourney.format === 'swiss_to_single' ? 'Ronde Suisse' : 'Double Élimination'}
                    </div>

                    <div className="mt-auto w-full text-center pt-4 border-t border-[#222838]">
                      {latestWinner ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#768196] tracking-[1px] uppercase">Dernier Vainqueur</span>
                          <span className="text-[14px] text-[#D4AF37] font-bold whitespace-nowrap overflow-hidden text-ellipsis">👑 {latestWinner}</span>
                        </div>
                      ) : (
                        <div className="text-[12px] font-medium" style={{ color: isActive ? tourney.color : '#768196' }}>
                          {isActive ? 'Compétition en ligne' : 'Trophée vacant'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ONGLET 5 : LE PANTHÉON */}
        {activeTab === 'halloffame' && (
          <div className="animate-[fadeIn_0.3s]">
            
            <div className="text-center mb-[50px]">
              <h2 className="font-['Oswald'] text-[32px] m-0 mb-2.5 text-white">
                CLASSEMENT GLOBAL
              </h2>
              <p className="text-[#768196] text-[15px] max-w-[600px] mx-auto">
                Le classement mondial officiel basé sur les performances accumulées lors des compétitions du Circuit Pro. Seuls les plus grands laissent leur empreinte.
              </p>
            </div>

            <div className="flex justify-center items-end gap-5 mb-[60px] h-[200px]">
              {/* TOP 2 */}
              {sortedLeaderboard[1] && (
                <div className="w-[220px] bg-[linear-gradient(180deg,rgba(192,192,192,0.1)_0%,#11141E_100%)] border-t-[4px] border-[#C0C0C0] rounded-t-xl p-5 text-center relative h-[140px] flex flex-col justify-start">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-black w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-[14px] border-[4px] border-[#080A10]">2</div>
                  <h3 className="text-white mt-[15px] mb-[5px] text-[18px] whitespace-nowrap overflow-hidden text-ellipsis">{sortedLeaderboard[1].name}</h3>
                  <span className="text-[#C0C0C0] font-bold">{state.seasonScores?.[sortedLeaderboard[1].id]?.points || 0} PTS</span>
                </div>
              )}

              {/* TOP 1 */}
              {sortedLeaderboard[0] && (
                <div className="w-[260px] bg-[linear-gradient(180deg,rgba(212,175,55,0.15)_0%,#11141E_100%)] border-t-[6px] border-[#D4AF37] rounded-t-xl p-[30px_20px] text-center relative h-[180px] flex flex-col justify-start shadow-[0_-10px_40px_rgba(212,175,55,0.15)]">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[40px] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">👑</div>
                  <h3 className="text-[#D4AF37] mt-[5px] mb-[5px] text-[24px] font-['Oswald'] tracking-[1px] whitespace-nowrap overflow-hidden text-ellipsis">{sortedLeaderboard[0].name}</h3>
                  <span className="text-white font-bold text-[18px]">{state.seasonScores?.[sortedLeaderboard[0].id]?.points || 0} PTS</span>
                  {(state.seasonScores?.[sortedLeaderboard[0].id]?.titles || 0) > 0 && <span className="text-[12px] text-[#768196] mt-2.5">{state.seasonScores[sortedLeaderboard[0].id].titles} Trophée(s)</span>}
                </div>
              )}

              {/* TOP 3 */}
              {sortedLeaderboard[2] && (
                <div className="w-[220px] bg-[linear-gradient(180deg,rgba(205,127,50,0.1)_0%,#11141E_100%)] border-t-[4px] border-[#CD7F32] rounded-t-xl p-5 text-center relative h-[120px] flex flex-col justify-start">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-black w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-[14px] border-[4px] border-[#080A10]">3</div>
                  <h3 className="text-white mt-[15px] mb-[5px] text-[18px] whitespace-nowrap overflow-hidden text-ellipsis">{sortedLeaderboard[2].name}</h3>
                  <span className="text-[#CD7F32] font-bold">{state.seasonScores?.[sortedLeaderboard[2].id]?.points || 0} PTS</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-10">
              <div className="bg-[#11141E] rounded-lg p-8 border border-[#222838]">
                <h3 className="font-['Oswald'] text-white m-0 mb-5 text-[20px] border-b border-[#222838] pb-4">CHALLENGERS (TOP 4 - 16)</h3>
                <div className="flex flex-col gap-2">
                  {sortedLeaderboard.slice(3, 16).map((p, i) => (
                    <div key={p.id} className="flex justify-between p-[12px_16px] bg-[#0C0E14] rounded-md">
                      <span className="text-[#EAEAEA]">
                        <span className="text-[#768196] mr-4 inline-block w-5">#{i + 4}</span> 
                        {p.name}
                      </span>
                      <span className="text-white font-semibold">{state.seasonScores?.[p.id]?.points || 0} PTS</span>
                    </div>
                  ))}
                  {sortedLeaderboard.length <= 3 && <div className="text-[#768196] italic text-center p-5">En attente de plus d'équipes.</div>}
                </div>
              </div>

              <div className="bg-[#11141E] rounded-lg p-8 border border-[#222838]">
                <h3 className="font-['Oswald'] text-white m-0 mb-5 text-[20px] border-b border-[#222838] pb-4">LIVRE DES ARCHIVES</h3>
                <div className="flex flex-col gap-4">
                  {state.history && state.history.length > 0 ? (
                    state.history.map((h, i) => {
                      const eventDetails = EVENTS.find(e => e.id === h.eventId);
                      return (
                        <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                          <img src={eventDetails?.logo} alt="Logo" className="w-10 h-10 object-contain" />
                          <div className="flex-1">
                            <div className="text-[12px] text-[#768196] tracking-[1px] uppercase">Année {h.year} - {eventDetails?.name || h.eventId}</div>
                            <div className="text-[#D4AF37] font-bold text-[16px]">{h.winnerName}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-[#768196] italic py-10 text-center">
                      L'histoire reste à écrire. Remportez le prochain tournoi pour marquer votre nom ici.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}