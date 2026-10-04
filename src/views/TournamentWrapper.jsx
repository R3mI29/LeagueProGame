import React from 'react';
import { EVENTS } from '../constants/seasonConfig';
import SwissStageView from './formats/SwissStageView';
import GslGroupView from './formats/GslGroupView';
import DoubleElimView from './formats/DoubleElimView';
import BracketView from './BracketView'; 

export default function TournamentWrapper({ state, ...props }) {
  const currentEvent = EVENTS[state.eventIndex || 0];
  
  if (!currentEvent) {
    return <div className="text-white p-10 text-center font-sans">Erreur : Événement introuvable</div>;
  }
  if (state.tournamentPhase === 'swiss') return <SwissStageView state={state} event={currentEvent} {...props} />;
  if (state.tournamentPhase === 'groups') return <GslGroupView state={state} event={currentEvent} {...props} />;
  if (state.tournamentPhase === 'bracket' && currentEvent.format !== 'double_elim') return <BracketView state={state} event={currentEvent} {...props} />;
  if (state.tournamentPhase === 'bracket' && currentEvent.format === 'double_elim') return <DoubleElimView state={state} event={currentEvent} {...props} />;
  
  return null;
}