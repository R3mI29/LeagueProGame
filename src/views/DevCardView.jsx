import { useState } from 'react';
import { socket } from '../api/socket';
import { CARD_POOL } from '../constants/cardPlayers';
import { ORDERED_ROLES } from '../constants/roles';
import { EVENTS } from '../constants/seasonConfig';
import CardIllustration from '../components/CardIllustration';
import DevSkinPanel from '../components/DevSkinPanel';

const RARITY_ORDER = { 'Commune': 1, 'Rare': 2, 'Épique': 3, 'Légendaire': 4, 'WANTED': 5, "SECRET" : 6 };

const DEV_TABS = [
  { id: 'cards', label: 'CARTES' },
  { id: 'skins', label: 'SKINS' },
];

export default function DevCardsView({ onClose, state }) {
  const [devTab, setDevTab] = useState('cards');
  const [filterRole, setFilterRole] = useState('Tous');

  const displayedCards = CARD_POOL
    .filter(c => filterRole === 'Tous' || c.role === filterRole)
    .sort((a, b) => (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0));

  const handleGiveCard = (cardId) => socket.emit('dev-give-card', cardId);
  const handleSetEvent = (idx) => socket.emit('dev-set-event', idx);
  const handleGiveMoney = () => socket.emit('dev-give-money', 1000);

  return (
    <div className="fixed inset-0 bg-[#08090d]/95 backdrop-blur-md z-[10000] flex flex-col p-5 font-sans">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full">
        
        <div className="shrink-0 pb-5 border-b border-[#1B2333] mb-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h1 className="font-rajdhani text-accent-pink text-[32px] m-0 uppercase tracking-wide">
                PANEL DÉVELOPPEUR ⚙️
              </h1>
              <p className="text-text-muted mt-1 mb-0 tracking-widest text-sm uppercase">
                TRICHE ET OUTILS DE TEST
              </p>
            </div>
            <button 
              className="font-rajdhani font-bold tracking-widest uppercase py-2.5 px-6 bg-transparent border-2 border-accent-pink text-accent-pink rounded hover:bg-accent-pink hover:text-black transition-all" 
              onClick={onClose}
            >
              FERMER LE MODE DEV
            </button>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-5 mb-5">
            
            <div className="bg-[#0C0E14] p-4 rounded-lg border border-accent-pink/25">
              <h3 className="font-rajdhani text-white m-0 mb-3 text-lg uppercase tracking-wide">
                FORCER LE PROCHAIN TOURNOI
              </h3>
              <div className="flex gap-3 flex-wrap">
                {EVENTS.map((ev, idx) => (
                  <button 
                    key={ev.id} 
                    onClick={() => handleSetEvent(idx)}
                    className={`px-4 py-2 rounded font-rajdhani font-bold tracking-wider cursor-pointer transition-all border ${state?.eventIndex === idx ? 'bg-accent-pink text-white border-accent-pink' : 'bg-transparent text-[#768196] border-[#222838] hover:border-[#768196]'}`}
                  >
                    {ev.shortName} {state?.eventIndex === idx && ' (ACTIF)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0C0E14] p-4 rounded-lg border border-[#ffd700]/25">
              <h3 className="font-rajdhani text-white m-0 mb-3 text-lg uppercase tracking-wide">
                RESSOURCES
              </h3>
              <button 
                onClick={handleGiveMoney}
                className="bg-[#FFD700] text-black border-none py-2.5 px-5 rounded text-sm font-bold cursor-pointer font-rajdhani tracking-wider shadow-[0_4px_15px_rgba(255,215,0,0.2)] transition-transform active:scale-95"
              >
                💰 +1000 CRÉDITS
              </button>
            </div>
          </div>

          {/* Sélecteur de section + filtres */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex p-1 gap-1 bg-[#0C0E14] border border-[#222838] rounded-lg">
              {DEV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDevTab(tab.id)}
                  className={`font-rajdhani font-bold tracking-widest uppercase py-2 px-6 rounded text-[13px] transition-all border-none cursor-pointer ${devTab === tab.id ? 'bg-accent-pink text-black shadow-pink' : 'bg-transparent text-text-muted hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {devTab === 'cards' && (
              <>
                <div className="h-8 w-px bg-[#222838]" />
                <div className="flex gap-2.5 flex-wrap">
                  <button 
                    className={`font-rajdhani font-bold tracking-widest uppercase py-2 px-4 rounded text-[13px] transition-all border-2 ${filterRole === 'Tous' ? 'bg-accent-pink text-black border-accent-pink shadow-pink' : 'bg-transparent text-white border-text-muted hover:border-accent-pink hover:text-accent-pink'}`}
                    onClick={() => setFilterRole('Tous')}
                  >
                    TOUTES LES CARTES
                  </button>
                  {ORDERED_ROLES.map(role => (
                    <button 
                      key={role} 
                      className={`font-rajdhani font-bold tracking-widest uppercase py-2 px-4 rounded text-[13px] transition-all border-2 ${filterRole === role ? 'bg-accent-pink text-black border-accent-pink shadow-pink' : 'bg-transparent text-white border-text-muted hover:border-accent-pink hover:text-accent-pink'}`}
                      onClick={() => setFilterRole(role)}
                    >
                      {role.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2.5">
          {devTab === 'cards' ? (
            <div className="flex flex-wrap gap-6 justify-center items-start pb-10">
              {displayedCards.map(card => {
                const myId = socket.id;
                const ownedContract = state?.cardCollections?.[myId]?.[card.id];
                const isLifetime = ownedContract === 'LIFETIME';
                const contractCount = typeof ownedContract === 'number' ? ownedContract : 0;

                return (
                  <div 
                    key={card.id} 
                    onClick={() => handleGiveCard(card.id)}
                    className="flex flex-col items-center w-[160px] bg-[#0D1219] p-[12px_10px] rounded-lg border border-[#1B2333] cursor-pointer transition-all duration-200 relative group hover:border-accent-pink hover:-translate-y-1.5"
                  >
                    {(contractCount > 0 || isLifetime) && (
                      <div 
                        className="absolute -top-2.5 -right-2.5 font-bold py-1 px-2 rounded z-10 text-xs shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                        style={{ 
                          background: isLifetime ? 'linear-gradient(135deg, #FFD700 0%, #AA8011 100%)' : '#ff3366', 
                          color: isLifetime ? '#000' : '#FFF'
                        }}
                      >
                        {isLifetime ? '♾️' : `x${contractCount}`}
                      </div>
                    )}

                    <CardIllustration card={card} width={140} />
                    
                    <div className="mt-3.5 text-center">
                      <span className="font-rajdhani text-accent-cyan text-[14px] block font-bold uppercase tracking-wide">{card.id}</span>
                      <span className="text-text-muted text-[11px] block mt-1 uppercase tracking-wider">{card.rarity}</span>
                      <span className="text-[10px] text-accent-pink block mt-2 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">CLIQUEZ POUR OBTENIR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-[900px] mx-auto pb-10">
              <DevSkinPanel state={state} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}