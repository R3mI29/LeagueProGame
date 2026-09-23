import React from 'react';

export default function SwissStageView({ state, event }) {
  const tourneyColor = event?.color || '#FF3D81';

  return (
    <div className="panel" style={{ padding: '40px', textAlign: 'center', borderTop: `4px solid ${tourneyColor}` }}>
      <h2 className="title-font" style={{ color: tourneyColor, fontSize: '28px', marginBottom: '15px' }}>
        PHASE DE RONDE SUISSE (WORLDS)
      </h2>
      <p className="text-muted" style={{ fontSize: '16px' }}>
        Le système de seeding par victoires/défaites (3-0, 3-1, 3-2 / 0-3, 1-3, 2-3) est en cours d'initialisation.
      </p>
    </div>
  );
}