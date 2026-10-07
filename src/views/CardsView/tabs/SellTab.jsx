import React from 'react';
import { socket } from '../../../api/socket';
import { CARD_POOL } from '../../../constants/cardPlayers';
import CardIllustration from '../../../components/CardIllustration';

function getCard(id) {
  return CARD_POOL.find(c => c.id === id);
}

export default function SellTab({ myCollection, myLineup, myEconomy, isReady }) {
  const sellableCards = Object.keys(myCollection).filter(
    cardId => myCollection[cardId] !== 0 && myCollection[cardId] !== 'LIFETIME' && !Object.values(myLineup).includes(cardId)
  );

  return (
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
        {sellableCards.map(cardId => {
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
        
        {sellableCards.length === 0 && (
          <div className="w-full text-center text-[#768196] p-10 italic bg-[#11141E] rounded-lg border border-[#222838]">
            Aucun joueur disponible à la vente.<br/>
            (Les joueurs de votre équipe titulaire et ceux sous contrat À VIE sont protégés et ne peuvent pas être vendus).
          </div>
        )}
      </div>
    </div>
  );
}