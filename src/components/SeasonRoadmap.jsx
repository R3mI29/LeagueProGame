import React from 'react';
import { EVENTS } from '../constants/seasonConfig';

export default function SeasonRoadmap({ year, currentEventIndex, history }) {
  return (
    <div style={{ background: '#0D1219', border: '1px solid #1B2333', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontFamily: "'Rajdhani', sans-serif", color: '#EDEFF3', fontSize: '24px', letterSpacing: '1px' }}>
          CIRCUIT OFFICIEL — <span style={{ color: '#4CE0D2' }}>ANNÉE {year || 1}</span>
        </h2>
        <span style={{ fontSize: '12px', color: '#8892A6', letterSpacing: '1px' }}>4 ÉVÉNEMENTS MAJEURS</span>
      </div>

      <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
        {/* Ligne de fond qui relie les événements */}
        <div style={{ position: 'absolute', top: '50%', left: '40px', right: '40px', height: '2px', background: '#1B2333', zIndex: 0 }} />

        {EVENTS.map((event, index) => {
          const isPast = index < currentEventIndex;
          const isCurrent = index === currentEventIndex;
          const winner = history?.find(h => h.year === year && h.eventId === event.id)?.winnerName;

          return (
            <div key={event.id} style={{ flex: 1, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* Le point du tournoi (Grisé, Actif, ou Terminé) */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: isCurrent ? event.color : isPast ? '#1A2235' : '#08090D',
                border: `2px solid ${isCurrent || isPast ? event.color : '#1B2333'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isCurrent ? `0 0 15px ${event.color}66` : 'none',
                marginBottom: '12px', transition: 'all 0.3s'
              }}>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold', fontSize: '13px', color: isCurrent ? '#000' : '#EDEFF3' }}>
                  {event.shortName}
                </span>
              </div>

              {/* Titre et Gagnant */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: isCurrent ? '#EDEFF3' : '#8892A6' }}>
                  {event.name}
                </div>
                {winner ? (
                  <div style={{ fontSize: '11px', color: '#FFB020', marginTop: '4px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px' }}>
                    🏆 {winner}
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: '#57607A', marginTop: '4px' }}>
                    {event.format.toUpperCase().replace('_', ' ')}
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