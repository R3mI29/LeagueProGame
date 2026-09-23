import React from 'react';

export default function DoubleElimView({ state, event }) {
  const tourneyColor = event?.color || '#FFB020';

  return (
    <div className="panel" style={{ padding: '40px', textAlign: 'center', borderTop: `4px solid ${tourneyColor}` }}>
      <h2 className="title-font" style={{ color: tourneyColor, fontSize: '28px', marginBottom: '15px' }}>
        ARBRE DE DOUBLE ÉLIMINATION (MSI)
      </h2>
      <p className="text-muted" style={{ fontSize: '16px' }}>
        L'upper bracket et le lower bracket massif se mettent en place.
      </p>
    </div>
  );
}