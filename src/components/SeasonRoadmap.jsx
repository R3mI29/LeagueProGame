import React from 'react';
import { EVENTS } from '../constants/seasonConfig';

export default function SeasonRoadmap({ year, currentEventIndex, history }) {
  return (
    <div className="bg-[#0D1219] border border-[#1B2333] rounded-lg p-5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="m-0 font-rajdhani text-[#EDEFF3] text-2xl tracking-wide">
          CIRCUIT OFFICIEL — <span className="text-[#4CE0D2]">ANNÉE {year || 1}</span>
        </h2>
        <span className="text-xs text-[#8892A6] tracking-wide">4 ÉVÉNEMENTS MAJEURS</span>
      </div>

      <div className="flex gap-4 relative">
        {/* Ligne de fond qui relie les événements */}
        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-[#1B2333] z-0" />

        {EVENTS.map((event, index) => {
          const isPast = index < currentEventIndex;
          const isCurrent = index === currentEventIndex;
          const winner = history?.find(h => h.year === year && h.eventId === event.id)?.winnerName;

          return (
            <div key={event.id} className="flex-1 z-10 flex flex-col items-center">
              
              {/* Le point du tournoi (Grisé, Actif, ou Terminé) */}
              <div 
                className={`w-11 h-11 rounded-full flex items-center justify-center mb-3 transition-all ${isPast ? 'bg-[#1A2235]' : 'bg-[#08090D]'}`}
                style={{
                  backgroundColor: isCurrent ? event.color : undefined,
                  border: `2px solid ${isCurrent || isPast ? event.color : '#1B2333'}`,
                  boxShadow: isCurrent ? `0 0 15px ${event.color}66` : 'none'
                }}
              >
                <span className={`font-rajdhani font-bold text-sm ${isCurrent ? 'text-black' : 'text-[#EDEFF3]'}`}>
                  {event.shortName}
                </span>
              </div>

              {/* Titre et Gagnant */}
              <div className="text-center">
                <div className={`text-sm font-bold ${isCurrent ? 'text-[#EDEFF3]' : 'text-[#8892A6]'}`}>
                  {event.name}
                </div>
                {winner ? (
                  <div className="text-[11px] text-[#FFB020] mt-1 font-rajdhani tracking-wide">
                    🏆 {winner}
                  </div>
                ) : (
                  <div className="text-[10px] text-[#57607A] mt-1 uppercase">
                    {event.format.replace('_', ' ')}
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