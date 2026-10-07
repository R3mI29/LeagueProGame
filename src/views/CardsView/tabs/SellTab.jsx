import React from 'react';
import { socket } from '../../../api/socket';
import { CARD_POOL } from '../../../constants/cardPlayers';
import CardIllustration from '../../../components/CardIllustration';

function getCard(id) {
  return CARD_POOL.find(c => c.id === id);
}

// J'ai ajouté lockedCards dans les props. Assure-toi que le composant qui appelle SellTab lui passe state.lockedCards[monId] !
export default function SellTab({ myCollection, myLineup, myEconomy, lockedCards = [], isReady }) {
  
  // Cartes disponibles dans la collection, non 'LIFETIME', et non équipées
  const sellableCards = Object.keys(myCollection).filter(
    cardId => myCollection[cardId] !== 0 && myCollection[cardId] !== 'LIFETIME' && !Object.values(myLineup).includes(cardId)
  );

  // Calcul du profit total si on clique sur "TOUT VENDRE" (exclut les cartes verrouillées)
  let totalSellValue = 0;
  let cardsToSellCount = 0;
  
  sellableCards.forEach(cardId => {
    if (!lockedCards.includes(cardId)) {
      const card = getCard(cardId);
      if (card) {
        let price = 5; 
        if (card.rarity === 'Rare') price = 15;
        else if (card.rarity === 'Épique') price = 100;
        else if (card.rarity === 'Légendaire') price = 500;
        else if (card.rarity === 'WANTED') price = 1400;
        
        totalSellValue += price;
        cardsToSellCount++;
      }
    }
  });

  const handleSellAll = () => {
    if (isReady) return;
    if (cardsToSellCount === 0) {
      alert("Vous n'avez aucune carte débloquée à revendre !");
      return;
    }
    const confirm = window.confirm(`Voulez-vous vraiment revendre ${cardsToSellCount} carte(s) pour 💲 ${totalSellValue} crédits ?`);
    if (confirm) {
      socket.emit('sell-all-unlocked');
    }
  };

  return (
    <div className="animate-[fadeIn_0.3s]">
      <div className="text-center mb-10 relative">
        <h2 className="font-['Oswald'] text-[36px] m-0 mb-2.5 text-white">
          MARCHÉ DES TRANSFERTS
        </h2>
        <p className="text-[#768196] text-[16px] max-w-2xl mx-auto">
          Revendez définitivement des joueurs qui ne figurent pas dans votre équipe titulaire pour récupérer des crédits. 
          <strong className="text-white"> Utilisez le cadenas pour protéger vos cartes préférées.</strong>
        </p>
        
        <div className="flex justify-center items-center gap-10 mt-6">
          <div className="text-[28px] font-bold text-[#00e676]">
            SOLDE : 💲 {myEconomy} CRÉDITS
          </div>
          
          {/* BOUTON TOUT VENDRE */}
          {cardsToSellCount > 0 && (
            <button 
              onClick={handleSellAll}
              disabled={isReady}
              className={`border-none px-6 py-3 rounded-lg font-bold text-[16px] shadow-[0_0_15px_rgba(230,57,70,0.5)] transition-transform active:scale-95 ${isReady ? 'bg-[#444] text-[#888] cursor-not-allowed' : 'bg-[#e63946] text-white cursor-pointer hover:bg-[#d62828]'}`}
            >
              TOUT VENDRE (💲 {totalSellValue})
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6 flex-wrap justify-center">
        {sellableCards.map(cardId => {
          const card = getCard(cardId);
          if (!card) return null;
          
          const contract = myCollection[cardId];
          const isLifetime = contract === 'LIFETIME';
          const isLocked = lockedCards.includes(cardId);
          
          let price = 5; 
          if (card.rarity === 'Rare') price = 15;
          else if (card.rarity === 'Épique') price = 100;
          else if (card.rarity === 'Légendaire') price = 500;
          else if (card.rarity === 'WANTED') price = 1400;

          return (
            <div key={cardId} className={`relative flex flex-col items-center gap-3 bg-[#11141E] p-5 rounded-xl border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${isLocked ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-[#222838]'}`}>
              
              {/* BOUTON CADENAS */}
              <button
                onClick={() => socket.emit('toggle-lock-card', cardId)}
                className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all shadow-lg z-10 border-2 cursor-pointer
                  ${isLocked ? 'bg-[#11141E] border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black' : 'bg-[#11141E] border-[#444] text-[#768196] hover:border-white hover:text-white'}
                `}
              >
                {isLocked ? '🔒' : '🔓'}
              </button>

              <CardIllustration card={card} width={140} />
              
              <div className="text-xs text-[#768196] font-bold mt-2">
                CONTRAT: {contract} TRN
              </div>
              
              <button 
                onClick={() => !isReady && !isLocked && socket.emit('sell-card', cardId)}
                disabled={isReady || isLocked}
                className={`w-full border-none p-2.5 rounded font-bold text-[14px] transition-colors 
                  ${isReady ? 'bg-[#444] text-[#888] cursor-not-allowed' 
                  : isLocked ? 'bg-[#2a2a2a] text-[#555] cursor-not-allowed' 
                  : 'bg-[#e63946] text-white cursor-pointer hover:bg-[#d62828]'}`}
              >
                {isLocked ? 'CARTE PROTÉGÉE' : `VENDRE ( 💲 ${price} )`}
              </button>
            </div>
          );
        })}
        
        {sellableCards.length === 0 && (
          <div className="w-full text-center text-[#768196] p-10 italic bg-[#11141E] rounded-lg border border-[#222838]">
            Aucun joueur disponible à la vente.<br/>
            (Les joueurs de votre équipe titulaire et ceux sous contrat À VIE sont protégés par défaut).
          </div>
        )}
      </div>
    </div>
  );
}