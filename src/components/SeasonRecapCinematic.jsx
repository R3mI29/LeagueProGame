import React, { useEffect, useState } from 'react';
import { EVENTS } from '../constants/seasonConfig';

export default function SeasonRecapCinematic({ state }) {
  const [recap, setRecap] = useState(null);
  const [showGoldenRoad, setShowGoldenRoad] = useState(false);
  const [processedYear, setProcessedYear] = useState(null);

  useEffect(() => {
    if (state?.endOfYearRecap && state.endOfYearRecap.year !== processedYear && !recap) {
      setProcessedYear(state.endOfYearRecap.year);
      setRecap(state.endOfYearRecap);
      setShowGoldenRoad(false);

      setTimeout(() => {
        if (state.endOfYearRecap.goldenRoadSecret) {
          setShowGoldenRoad(true);
          setTimeout(() => {
            setRecap(null);
            setShowGoldenRoad(false);
          }, 8500);
        } else {
          setRecap(null);
        }
      }, 7000); 
    }
  }, [state?.endOfYearRecap, processedYear, recap]);

  if (!recap) return null;

  if (showGoldenRoad && recap.goldenRoadSecret) {
    const secret = recap.goldenRoadSecret;
    return (
      <div className="fixed inset-0 bg-[#050001] z-[100000] flex flex-col justify-center items-center overflow-hidden font-['Oswald'] animate-[cinematicFade_8.5s_ease-in-out_forwards]">
        <style>{`
          @keyframes cinematicFade { 0% { opacity: 0; } 5% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; } }
          @keyframes slowZoom { 0% { transform: scale(1.1); filter: grayscale(100%) contrast(1.2); } 20% { filter: grayscale(0%) contrast(1.1); } 100% { transform: scale(1.0); filter: grayscale(0%) contrast(1.1); } }
          @keyframes textReveal { 0% { opacity: 0; transform: translateY(20px); letter-spacing: 2px; } 100% { opacity: 1; transform: translateY(0); letter-spacing: 8px; } }
        `}</style>
        
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-50 z-[-1] animate-[slowZoom_8s_ease-out_forwards]"
          style={{ backgroundImage: `url(${secret.image})` }} 
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#050001_90%)] z-0" />

        <div className="relative z-10 text-center">
          <p className="text-[#D4AF37] text-lg mb-5 font-bold animate-[textReveal_2s_ease-out_0.5s_both]">
            SUCCÈS ABSOLU DÉVERROUILLÉ
          </p>
          <h1 className="text-white text-[80px] mb-7 uppercase drop-shadow-[0_0_40px_rgba(212,175,55,0.8)] animate-[textReveal_2s_ease-out_1s_both]">
            {secret.title}
          </h1>
          <div className="w-[150px] h-0.5 bg-[#D4AF37] mx-auto mb-7 shadow-[0_0_15px_#D4AF37]" />
          <p className="text-[#EAEAEA] text-2xl max-w-[800px] mx-auto leading-relaxed font-sans font-light animate-[textReveal_2s_ease-out_2s_both]">
            {secret.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[rgba(8,10,16,0.98)] z-[99999] flex flex-col justify-center items-center font-sans animate-[fadeIn_0.5s_forwards]">
      <style>{`
        @keyframes popInReveal { 
          0% { opacity: 0; transform: scale(0.8) translateY(30px); } 
          100% { opacity: 1; transform: scale(1) translateY(0); } 
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <h1 className="font-['Oswald'] text-white text-5xl mb-14 tracking-widest">
        PALMARÈS DE L'ANNÉE {recap.year}
      </h1>

      <div className="flex gap-7">
        {recap.history.map((h, index) => {
          const eventDetails = EVENTS.find(e => e.id === h.eventId);
          
          return (
            <div 
              key={index} 
              className="bg-[#11141E] rounded-xl p-7 w-[220px] flex flex-col items-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] opacity-0 animate-[popInReveal_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]"
              style={{
                border: `2px solid ${eventDetails?.color || '#222838'}`,
                animationDelay: `${1 + (index * 1.2)}s` 
              }}
            >
              <img 
                src={eventDetails?.logo} 
                alt="Logo" 
                className="h-20 max-w-full object-contain mb-5"
                style={{ filter: `drop-shadow(0 0 10px ${eventDetails?.color}60)` }} 
              />
              
              <div className="text-sm text-[#768196] uppercase tracking-wide mb-2.5">
                {eventDetails?.shortName}
              </div>
              
              <div className="text-xl font-['Oswald'] text-[#D4AF37] font-bold text-center">
                {h.winnerName}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}