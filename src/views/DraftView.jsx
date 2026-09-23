import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';

export default function DraftView({ state, tournamentPhase, pickPlayer, setShowBracket }) {
  const activeParticipant = state.participants[state.turnIndex];
  const isMyTurn = activeParticipant?.id === socket.id;

  return (
    <div className="container">
      {tournamentPhase ? (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <h2 className="title-font text-green" style={{ fontSize: '32px' }}>SÉQUENCE DE DRAFT TERMINÉE</h2>
          <p className="text-muted" style={{ fontSize: '16px', marginBottom: '30px' }}>
            Les compositions d'équipes sont verrouillées dans le serveur central.
          </p>
          <button className="btn btn-cyan" onClick={() => setShowBracket(true)}>
            ACCÉDER AU RÉSEAU DE TOURNOI
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="title-font text-muted" style={{ fontSize: '14px', letterSpacing: '3px', marginBottom: '10px' }}>
            PHASE DE SÉLECTION
          </div>
          <h2 className={`title-font ${isMyTurn ? 'text-cyan pulse-text' : 'text-muted'}`} style={{ fontSize: '28px' }}>
            {isMyTurn ? 'SYSTÈME DÉVERROUILLÉ : À VOUS' : `ACQUISITION EN COURS PAR ${activeParticipant?.name}...`}
          </h2>
        </div>
      )}

      {state.phase === 'draft' && isMyTurn && (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '60px' }}>
          {state.currentOptions.map(pro => (
            <div key={pro.id} className="pick-card" onClick={() => pickPlayer(pro.id)}>
              <div className="title-font text-muted" style={{ fontSize: '13px', letterSpacing: '2px', marginBottom: '12px' }}>
                {pro.role}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{pro.name}</div>
            </div>
          ))}
        </div>
      )}

      <div className="draft-grid">
        {state.participants.map(p => (
          <div
            key={p.id}
            className={`roster-card ${p.id === activeParticipant?.id && !tournamentPhase ? 'active' : ''}`}
          >
            <h3
              className="title-font"
              style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}
            >
              {p.name}
            </h3>
            <div>
              {ORDERED_ROLES.map(role => {
                const player = p.roster.find(pro => pro.role === role);
                return player ? (
                  <div key={role} className="player-slot">
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{player.name}</span>
                    <span className="title-font text-muted" style={{ fontSize: '12px' }}>{player.role}</span>
                  </div>
                ) : (
                  <div key={role} className="player-slot empty">
                    <span className="text-muted" style={{ fontSize: '13px', fontStyle: 'italic' }}>Recherche...</span>
                    <span className="title-font text-muted" style={{ fontSize: '12px' }}>{role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
