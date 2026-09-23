export default function ModeSelect({ selectMode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="title-font" style={{ fontSize: '28px', marginBottom: '10px' }}>SÉLECTION DU PROTOCOLE</h2>
      <p className="text-muted" style={{ marginBottom: '40px' }}>
        En tant que premier commandant, choisissez les règles de la session.
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div
          className="pick-card"
          style={{ width: '280px', padding: '30px 20px', alignItems: 'flex-start', textAlign: 'left' }}
          onClick={() => selectMode('draft_classique')}
        >
          <h3 className="title-font text-cyan" style={{ fontSize: '24px', margin: '0 0 10px 0' }}>DRAFT CLASSIQUE</h3>
          <p className="text-muted" style={{ fontSize: '14px', margin: 0, lineHeight: 1.5, fontWeight: 'normal' }}>
            Les joueurs choisissent leurs agents à tour de rôle pour bâtir la meilleure équipe.
          </p>
        </div>

        <div
          className="pick-card"
          style={{ width: '280px', padding: '30px 20px', alignItems: 'flex-start', textAlign: 'left', borderColor: 'var(--border)' }}
          onClick={() => selectMode('draft_aveugle')}
        >
          <h3 className="title-font text-pink" style={{ fontSize: '24px', margin: '0 0 10px 0' }}>DRAFT AVEUGLE</h3>
          <p className="text-muted" style={{ fontSize: '14px', margin: 0, lineHeight: 1.5, fontWeight: 'normal' }}>
            Les attributions sont secrètes. Le chaos total règne sur le Circuit.
          </p>
        </div>

        <div
          className="pick-card"
          style={{ width: '280px', padding: '30px 20px', alignItems: 'flex-start', textAlign: 'left', borderColor: 'var(--border)' }}
          onClick={() => selectMode('draft_encheres')}
        >
          <h3 className="title-font text-green" style={{ fontSize: '24px', margin: '0 0 10px 0' }}>DRAFT AUX ENCHÈRES</h3>
          <p className="text-muted" style={{ fontSize: '14px', margin: 0, lineHeight: 1.5, fontWeight: 'normal' }}>
            Chaque commandant dispose d'un budget et doit remporter les enchères pour recruter ses joueurs.
          </p>
        </div>
        <div
          className="pick-card"
          style={{ width: '280px', padding: '30px 20px', alignItems: 'flex-start', textAlign: 'left', borderColor: 'var(--border)' }}
          onClick={() => selectMode('draft_cartes')}
        >
          <h3 className="title-font" style={{ fontSize: '24px', margin: '0 0 10px 0', color: '#ffd700' }}>DRAFT AUX PACKS</h3>
          <p className="text-muted" style={{ fontSize: '14px', margin: 0, lineHeight: 1.5, fontWeight: 'normal' }}>
            Ouvrez des packs de cartes, composez votre équipe et enchaînez les tournois sur toute une saison.
          </p>
        </div>
      </div>
    </div>
  );
}