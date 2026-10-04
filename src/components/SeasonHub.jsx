import React from 'react';
import { socket } from '../api/socket';
import { EVENTS } from '../constants/seasonConfig';

export default function SeasonHub({ state }) {
  const currentEventIndex = state.eventIndex || 0;

  const handleStartEvent = () => {
    socket.emit('start-next-event');
  };

  return (
    <div className="max-w-[1200px] mx-auto text-center flex flex-col items-center min-h-screen p-10">
      
      {/* AFFICHAGE DE L'ANNÉE ET DU STATUT */}
      <div className="mb-12">
        <h2 className="font-rajdhani text-accent-pink text-2xl tracking-[4px] m-0 uppercase">
          SAISON {state.year || 1}
        </h2>
        <h1 className="font-rajdhani text-accent-cyan text-5xl my-2.5 uppercase">
          CIRCUIT COMPÉTITIF MAJEUR
        </h1>
        <p className="font-rajdhani text-text-muted text-lg tracking-widest uppercase">
          16 ÉQUIPES. 4 TITRES. 1 LÉGENDE.
        </p>
      </div>

      <div className="flex gap-5 justify-center items-stretch w-full">
        {EVENTS.map((tourney, index) => {
          const isActive = index === currentEventIndex;
          const isCompleted = index < currentEventIndex;
          
          return (
            <div 
              key={tourney.id} 
              className={`bg-bg-panel rounded-xl flex flex-col items-center p-8 transition-all duration-300 relative ${isCompleted ? 'opacity-50 grayscale-[80%]' : (isActive ? 'opacity-100 grayscale-0' : 'opacity-70 grayscale-[80%]')}`}
              style={{ 
                flex: tourney.isMajor ? '1.4' : '1', 
                border: isActive ? `2px solid ${tourney.color}` : '2px solid transparent',
                boxShadow: isActive ? `0 0 20px ${tourney.color}40` : 'none',
              }}
            >
              {isActive && (
                <div 
                  className="absolute -top-4 text-black px-4 py-1 rounded-full font-bold text-sm"
                  style={{ backgroundColor: tourney.color }}
                >
                  EN COURS
                </div>
              )}
              {isCompleted && (
                <div className="absolute -top-4 bg-[#4caf50] text-black px-4 py-1 rounded-full font-bold text-sm">
                  TERMINÉ
                </div>
              )}

              {/* FIX EWC : On limite strictement la hauteur et la largeur max des logos */}
              <div className={`flex items-center justify-center w-full mb-5 ${tourney.isMajor ? 'h-[120px]' : 'h-[80px]'}`}>
                <img 
                  src={tourney.logo} 
                  alt={tourney.shortName} 
                  className="max-h-full max-w-[80%] object-contain"
                />
              </div>
              
              <h3 className={`font-rajdhani my-2.5 uppercase tracking-wide ${tourney.isMajor ? 'text-[26px]' : 'text-[22px]'} ${isActive ? 'text-white' : 'text-text-muted'}`}>
                {tourney.name}
              </h3>

              {isActive && (
                <button 
                  className="mt-auto w-full text-black font-rajdhani font-bold text-base uppercase tracking-wider py-3 px-7 rounded hover:-translate-y-0.5 transition-transform"
                  style={{ backgroundColor: tourney.color }}
                  onClick={handleStartEvent}
                >
                  ENTRER
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}