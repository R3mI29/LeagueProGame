import React from 'react';
import { EVENTS } from '../constants/seasonConfig';
import SwissStageView from './formats/SwissStageView';
import GslGroupView from './formats/GslGroupView';
import DoubleElimView from './formats/DoubleElimView';
import BracketView from './BracketView'; 

export default function TournamentWrapper({ state, ...props }) {
  const currentEvent = EVENTS[state.eventIndex || 0];
  if (!currentEvent) return <div className="container">Erreur : Événement introuvable</div>;

  // ICI ON FORCE LA COULEUR OR CHAMPAGNE POUR TOUS LES WORLDS
  const isWorlds = currentEvent.isMajor;
  const tourneyColor = isWorlds ? '#D1B478' : currentEvent.color;

  return (
    <div 
      className="tournament-container" 
      style={{ width: '100%', minHeight: '100vh', padding: '20px', '--tourney-color': tourneyColor }}
    >
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px',
        borderBottom: `3px solid ${tourneyColor}`,
        boxShadow: `0 10px 20px -10px ${tourneyColor}40`,
        paddingBottom: '20px', marginBottom: '40px',
        background: `linear-gradient(180deg, ${tourneyColor}10 0%, transparent 100%)`,
        borderRadius: '12px 12px 0 0'
      }}>
        <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={currentEvent.logo} alt={currentEvent.shortName} style={{ maxHeight: '100%', maxWidth: '120px', objectFit: 'contain', filter: `drop-shadow(0 0 10px ${tourneyColor}80)` }} />
        </div>
        <div>
          <h1 className="title-font" style={{ fontSize: '42px', color: tourneyColor, margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
            {currentEvent.name}
          </h1>
          <p className="title-font" style={{ color: '#8b9bb4', fontSize: '18px', letterSpacing: '4px', margin: 0 }}>
            {state.tournamentPhase === 'groups' || state.tournamentPhase === 'swiss' ? 'PHASE DE QUALIFICATION' : 'PHASE FINALE'}
          </p>
        </div>
      </div>

      <div className="tournament-content" style={{ maxWidth: currentEvent.format === 'double_elim' ? '100%' : '1200px', margin: '0 auto' }}>
        {state.tournamentPhase === 'swiss' && <SwissStageView state={state} event={currentEvent} {...props} />}
        {state.tournamentPhase === 'groups' && <GslGroupView state={state} event={currentEvent} {...props} />}
        {state.tournamentPhase === 'bracket' && currentEvent.format !== 'double_elim' && <BracketView state={state} event={currentEvent} {...props} />}
        {state.tournamentPhase === 'bracket' && currentEvent.format === 'double_elim' && <DoubleElimView state={state} event={currentEvent} {...props} />}
      </div>
    </div>
  );
}