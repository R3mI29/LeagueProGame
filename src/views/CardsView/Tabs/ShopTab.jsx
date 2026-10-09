import React from 'react';
import { socket } from '../../../api/socket';

export default function ShopTab({ myEconomy, isReady, hasStarter }) {
  return (
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
              <div className="text-[28px] font-bold text-[#00e676] mb-5">200 💲</div>
              <button 
                onClick={() => socket.emit('buy-pack', 'elite')} 
                disabled={myEconomy < 200 || isReady}
                className={`w-full border-none p-3.5 rounded font-bold text-[16px] ${(myEconomy >= 200 && !isReady) ? 'bg-[#00e5ff] text-black cursor-pointer' : 'bg-[#333] text-[#888] cursor-not-allowed'}`}
              >ACHETER</button>
            </div>

            <div className="bg-[linear-gradient(180deg,rgba(212,175,55,0.15)_0%,#11141E_100%)] border border-[#D4AF37] rounded-xl p-[30px] w-[300px] text-center shadow-[0_10px_30px_rgba(212,175,55,0.15)]">
              <div className="text-[50px] mb-2.5">👑</div>
              <h3 className="font-['Oswald'] text-[#D4AF37] text-[24px] m-0 mb-2.5">PACK LÉGENDE</h3>
              <p className="text-[#768196] text-[14px] mb-5 min-h-[60px]">Chances multipliées par 5 pour les cartes de niveau Épique, Légendaire et WANTED.</p>
              <div className="text-[28px] font-bold text-[#00e676] mb-5"> 400 💲</div>
              <button 
                onClick={() => socket.emit('buy-pack', 'legendary')} 
                disabled={myEconomy < 400 || isReady}
                className={`w-full border-none p-3.5 rounded font-bold text-[16px] ${(myEconomy >= 400 && !isReady) ? 'bg-[#D4AF37] text-black cursor-pointer' : 'bg-[#333] text-[#888] cursor-not-allowed'}`}
              >ACHETER</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}