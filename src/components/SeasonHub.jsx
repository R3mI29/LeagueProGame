import React from 'react';
import { socket } from '../api/socket';
import { EVENTS } from '../constants/seasonConfig';

export default function SeasonHub({ state }) {
  const currentEventIndex = state.eventIndex || 0;

  const handleStartEvent = () => {
    socket.emit('start-next-event');
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      
      {/* AFFICHAGE DE L'ANNÉE ET DU STATUT */}
      <div style={{ marginBottom: '50px' }}>
        <h2 className="title-font text-pink" style={{ fontSize: '24px', letterSpacing: '4px', margin: 0 }}>
          SAISON {state.year || 1}
        </h2>
        <h1 className="title-font text-cyan" style={{ fontSize: '48px', margin: '10px 0' }}>
          CIRCUIT COMPÉTITIF MAJEUR
        </h1>
        <p className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '2px' }}>
          16 ÉQUIPES. 4 TITRES. 1 LÉGENDE.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'stretch' }}>
        {EVENTS.map((tourney, index) => {
          const isActive = index === currentEventIndex;
          const isCompleted = index < currentEventIndex;
          
          return (
            <div 
              key={tourney.id} 
              className="panel"
              style={{ 
                flex: tourney.isMajor ? '1.4' : '1', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '30px 20px',
                opacity: isCompleted ? 0.5 : (isActive ? 1 : 0.7),
                filter: isActive ? 'none' : 'grayscale(80%)',
                border: isActive ? `2px solid ${tourney.color}` : '2px solid transparent',
                boxShadow: isActive ? `0 0 20px ${tourney.color}40` : 'none',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {isActive && (
                <div style={{ position: 'absolute', top: '-15px', background: tourney.color, color: '#000', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                  EN COURS
                </div>
              )}
              {isCompleted && (
                <div style={{ position: 'absolute', top: '-15px', background: '#4caf50', color: '#000', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                  TERMINÉ
                </div>
              )}

              {/* FIX EWC : On limite strictement la hauteur et la largeur max des logos */}
              <div style={{ height: tourney.isMajor ? '120px' : '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '20px' }}>
                <img 
                  src={tourney.logo} 
                  alt={tourney.shortName} 
                  style={{ maxHeight: '100%', maxWidth: '80%', objectFit: 'contain' }} 
                />
              </div>
              
              <h3 className="title-font" style={{ fontSize: tourney.isMajor ? '26px' : '22px', margin: '10px 0', color: isActive ? '#fff' : 'var(--text-muted)' }}>
                {tourney.name}
              </h3>

              {isActive && (
                <button 
                  className="btn" 
                  style={{ marginTop: 'auto', width: '100%', backgroundColor: tourney.color, color: '#000', fontWeight: 'bold' }}
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