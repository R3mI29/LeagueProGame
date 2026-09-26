import React, { useEffect, useState } from 'react';
import { EVENTS } from '../constants/seasonConfig';

export default function SeasonRecapCinematic({ state }) {
  const [recap, setRecap] = useState(null);
  const [showGoldenRoad, setShowGoldenRoad] = useState(false);

  useEffect(() => {
    // Si le serveur a placé un récapitulatif dans le state, on lance l'animation !
    if (state?.endOfYearRecap && !recap) {
      setRecap(state.endOfYearRecap);
      setShowGoldenRoad(false);

      // Le suspense dure 7 secondes
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
  }, [state?.endOfYearRecap]);

  if (!recap) return null;

  // --- 1. L'ÉCRAN SECRET "GOLDEN ROAD" ---
  if (showGoldenRoad && recap.goldenRoadSecret) {
    const secret = recap.goldenRoadSecret;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#050001', zIndex: 100000,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        animation: 'cinematicFade 8.5s ease-in-out forwards', fontFamily: "'Oswald', sans-serif", overflow: 'hidden'
      }}>
        <style>{`
          @keyframes cinematicFade { 0% { opacity: 0; } 5% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; } }
          @keyframes slowZoom { 0% { transform: scale(1.1); filter: grayscale(100%) contrast(1.2); } 20% { filter: grayscale(0%) contrast(1.1); } 100% { transform: scale(1.0); filter: grayscale(0%) contrast(1.1); } }
          @keyframes textReveal { 0% { opacity: 0; transform: translateY(20px); letter-spacing: 2px; } 100% { opacity: 1; transform: translateY(0); letter-spacing: 8px; } }
        `}</style>
        
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${secret.image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5, animation: 'slowZoom 8s ease-out forwards', zIndex: -1 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle, transparent 20%, #050001 90%)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <p style={{ color: '#D4AF37', fontSize: '18px', letterSpacing: '12px', margin: '0 0 20px 0', fontWeight: 'bold', animation: 'textReveal 2s ease-out 0.5s both' }}>
            SUCCÈS ABSOLU DÉVERROUILLÉ
          </p>
          <h1 style={{ color: '#FFF', fontSize: '80px', margin: '0 0 30px 0', textTransform: 'uppercase', textShadow: '0 0 40px rgba(212, 175, 55, 0.8)', animation: 'textReveal 2s ease-out 1s both' }}>
            {secret.title}
          </h1>
          <div style={{ width: '150px', height: '2px', background: '#D4AF37', margin: '0 auto 30px auto', boxShadow: '0 0 15px #D4AF37' }} />
          <p style={{ color: '#EAEAEA', fontSize: '24px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.4', fontFamily: "'Inter', sans-serif", fontWeight: 300, animation: 'textReveal 2s ease-out 2s both' }}>
            {secret.description}
          </p>
        </div>
      </div>
    );
  }

  // --- 2. L'ÉCRAN DE SUSPENSE (LE BILAN DE L'ANNÉE) ---
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(8, 10, 16, 0.98)', zIndex: 99999,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      animation: 'fadeIn 0.5s forwards', fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @keyframes popInReveal { 
          0% { opacity: 0; transform: scale(0.8) translateY(30px); } 
          100% { opacity: 1; transform: scale(1) translateY(0); } 
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <h1 style={{ fontFamily: "'Oswald', sans-serif", color: '#FFF', fontSize: '48px', marginBottom: '60px', letterSpacing: '4px' }}>
        PALMARÈS DE L'ANNÉE {recap.year}
      </h1>

      <div style={{ display: 'flex', gap: '30px' }}>
        {recap.history.map((h, index) => {
          const eventDetails = EVENTS.find(e => e.id === h.eventId);
          
          return (
            <div key={index} style={{
              background: '#11141E',
              border: `2px solid ${eventDetails?.color || '#222838'}`,
              borderRadius: '12px',
              padding: '30px',
              width: '220px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
              opacity: 0,
              animation: 'popInReveal 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              animationDelay: `${1 + (index * 1.2)}s` 
            }}>
              
              <img 
                src={eventDetails?.logo} 
                alt="Logo" 
                style={{ 
                  height: '80px', 
                  maxWidth: '100%', // <-- CORRECTION ICI : empêche le logo de sortir du cadre
                  objectFit: 'contain', 
                  marginBottom: '20px', 
                  filter: `drop-shadow(0 0 10px ${eventDetails?.color}60)` 
                }} 
              />
              
              <div style={{ fontSize: '14px', color: '#768196', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                {eventDetails?.shortName}
              </div>
              
              <div style={{ fontSize: '20px', fontFamily: "'Oswald', sans-serif", color: '#D4AF37', fontWeight: 'bold', textAlign: 'center' }}>
                {h.winnerName}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}