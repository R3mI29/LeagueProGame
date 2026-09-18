import { socket } from '../api/socket';
import { ORDERED_ROLES } from '../constants/roles';

function TeamPanel({ team, highlight }) {
  return (
    <div className="panel arena-team" style={{ borderTop: highlight ? '3px solid var(--accent-cyan)' : '' }}>
      <h2 className="title-font" style={{ marginBottom: '24px' }}>{team.name}</h2>
      <div>
        {ORDERED_ROLES.map(role => {
          const p = team.roster.find(pro => pro.role === role);
          return (
            <div key={role} className="player-slot">
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              <span className="title-font text-muted" style={{ fontSize: '14px' }}>{p.role}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ArenaView({ match, matchReady, dismissMatch }) {
  const isReady = match.ready.includes(socket.id);
  const isFinished = match.status === 'finished';

  return (
    <div className="container">
      <h1 className="title-font text-cyan" style={{ fontSize: '32px' }}>CONFRONTATION PROTOCOLE</h1>
      <p className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '4px' }}>
        {match.id.includes('qf') ? 'QUART DE FINALE' : match.id.includes('sf') ? 'DEMI-FINALE' : 'GRANDE FINALE'}
      </p>

      <div className="arena-box">
        <TeamPanel team={match.teamA} highlight={isFinished && match.winner?.id === match.teamA.id} />

        <div style={{ textAlign: 'center', width: '250px' }}>
          <div className={`title-font arena-vs ${match.status === 'simulating' ? 'simulating' : ''}`}>VS</div>

          <div style={{ marginTop: '30px' }}>
            {match.status === 'pending' && (
              <button
                className={`btn ${isReady ? 'btn-outline' : 'btn-pink'}`}
                style={{
                  background: !isReady ? 'var(--accent-pink)' : '',
                  boxShadow: !isReady ? '0 0 15px rgba(255, 51, 102, 0.3)' : ''
                }}
                onClick={() => matchReady(match.id)}
                disabled={isReady}
              >
                {isReady ? 'SYSTÈME ARMÉ...' : 'ARMER LA SÉQUENCE'}
              </button>
            )}

            {match.status === 'simulating' && (
              <div className="title-font text-pink pulse-text" style={{ fontSize: '20px' }}>
                CALCUL DE L'ISSUE...
              </div>
            )}

            {isFinished && (
              <div>
                <div className="title-font text-cyan" style={{ fontSize: '28px', marginBottom: '20px' }}>
                  VICTOIRE<br />{match.winner.name}
                </div>
                <button className="btn btn-cyan" onClick={() => dismissMatch(match.id)}>Poursuivre</button>
              </div>
            )}
          </div>
        </div>

        <TeamPanel team={match.teamB} highlight={isFinished && match.winner?.id === match.teamB.id} />
      </div>
    </div>
  );
}
