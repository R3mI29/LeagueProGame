import React from 'react';
import { EVENTS } from '../../../constants/seasonConfig';

export default function CircuitTab({ currentEventIndex, history }) {
  return (
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
          const pastWinners = history?.filter(h => h.eventId === tourney.id) || [];
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
  );
}