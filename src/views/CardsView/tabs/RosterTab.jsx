import React, { useState } from 'react';
import { socket } from '../../../api/socket';
import { ORDERED_ROLES } from '../../../constants/roles';
import { CARD_POOL } from '../../../constants/cardPlayers';
import CardIllustration from '../../../components/CardIllustration';

export default function RosterTab({ state, myId, isReady, myLineup, myCollection, myEconomy, getDynamicCard, setActiveTab, setLineupCard, toggleLineupReady, lineupComplete, teamPower }) {
  const [activeRole, setActiveRole] = useState(ORDERED_ROLES[0]);
  const ownedCardsForRole = (role) => CARD_POOL.filter(c => c.role === role && myCollection[c.id] !== undefined);

  return (
    <div className="grid grid-cols-[1fr_380px] gap-8 animate-[fadeIn_0.3s]">
      {/* Zone Principale : Draft et Cartes */}
      <div className="bg-[#11141E] border border-[#222838] rounded-lg p-8 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-['Oswald'] m-0 text-white text-[24px] tracking-[0.5px]">DRAFT D'ÉQUIPE</h2>
          <div className="text-sm text-[#768196]">SÉLECTIONNEZ VOS 5 TITULAIRES</div>
        </div>
        
        {/* Barre de sélection des rôles */}
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

        {/* Grille des cartes possédées pour le rôle sélectionné */}
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
                  <div className={`p-1 rounded-xl transition-all ${selected ? 'border-2 border-[#D4AF37] shadow-[0_12px_24px_rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.05)]' : 'border-2 border-transparent'} ${isExpired ? 'grayscale opacity-50' : ''}`}>
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
                    {isLifetime ? '♾️️ À VIE' : isExpired ? '⚠️ EXPIRÉ' : <><span className="text-[11px] opacity-80">✍️️</span> {contract} TRN</>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Barre Latérale : Statistiques et Trésorerie */}
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
          onClick={toggleLineupReady} 
          disabled={!lineupComplete && !isReady} 
          className={`border-none p-5 rounded-lg text-[15px] font-bold transition-all duration-200 uppercase tracking-[1px] ${(!lineupComplete && !isReady) ? 'cursor-not-allowed' : 'cursor-pointer'} ${isReady ? 'bg-[#D4AF37] text-black' : lineupComplete ? 'bg-white text-black' : 'bg-[#1F2433] text-[#768196]'}`}
        >
          {isReady ? 'ROSTER VERROUILLÉ ✓' : lineupComplete ? 'VALIDER LE ROSTER' : 'ROSTER INCOMPLET'}
        </button>
      </div>
    </div>
  );
}