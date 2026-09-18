import { socket } from '../api/socket';
import { getHumanCount, getNextRoundVoting } from '../utils/bracketHelpers';

export default function BracketView({ state, toggleReady, toggleReset, advanceRound }) {
  const humanCount = getHumanCount(state);
  const isGlobalReady = state.readyPlayers.includes(socket.id);
  const isResetReady = state.resetPlayers?.includes(socket.id);
  const isRoundReady = state.roundReady?.includes(socket.id);
  const { requiredVotersCount, amIRequiredForNextRound } = getNextRoundVoting(state, socket.id);

  return (
    <div className="container">
      {state.phase === 'simulation' && state.champion ? (
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '4px', marginBottom: '10px' }}>
            VAINQUEUR ABSOLU
          </div>
          <h1
            className="title-font text-cyan"
            style={{ fontSize: '48px', margin: 0, textShadow: '0 0 30px rgba(0,229,255,0.4)', marginBottom: '30px' }}
          >
            {state.champion.name}
          </h1>

          <button className={`btn ${isResetReady ? 'btn-outline' : 'btn-pink'}`} onClick={toggleReset}>
            {isResetReady ? `EN ATTENTE DES COMMANDANTS (${state.resetPlayers?.length || 0}/${humanCount})` : 'NOUVELLE PARTIE'}
          </button>
        </div>
      ) : (
        <h1 className="title-font text-cyan" style={{ fontSize: '32px', marginBottom: '50px' }}>RÉSEAU DU TOURNOI</h1>
      )}

      <div style={{ display: 'flex', gap: '40px', width: '100%', maxWidth: '1200px' }}>
        {state.bracket.map((round, rIndex) => (
          <div key={rIndex} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1 }}>
            <h3 className="title-font text-muted" style={{ textAlign: 'center', fontSize: '14px', letterSpacing: '2px', marginBottom: '20px' }}>
              {rIndex === 0 ? 'QUARTS' : rIndex === 1 ? 'DEMIES' : 'FINALE'}
            </h3>
            {round.map(match => {
              const isSim = match.status === 'simulating';
              const isFin = match.status === 'finished';
              return (
                <div key={match.id} className="bracket-match">
                  <div className={`bracket-row ${isFin && match.winner?.id === match.teamA?.id ? 'winner' : ''}`}>
                    <span>{match.teamA ? match.teamA.name : '---'} {isSim && <span className="pulse-text text-pink">⚔️</span>}</span>
                  </div>
                  <div className={`bracket-row ${isFin && match.winner?.id === match.teamB?.id ? 'winner' : ''}`}>
                    <span>{match.teamB ? match.teamB.name : '---'} {isSim && <span className="pulse-text text-pink">⚔️</span>}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {state.phase === 'tournament' && (
        <div
          className="panel"
          style={{ marginTop: '50px', width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px' }}
        >
          <span className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '2px' }}>
            SYNCHRONISATION DES COMMANDANTS...
          </span>
          <button className={`btn ${isGlobalReady ? 'btn-green' : 'btn-cyan'}`} onClick={toggleReady}>
            {isGlobalReady ? `CONNECTÉ (${state.readyPlayers.length}/${humanCount})` : 'INITIALISER LA PHASE'}
          </button>
        </div>
      )}

      {state.phase === 'simulation' && state.roundComplete && !state.champion && (
        <div
          className="panel"
          style={{ marginTop: '50px', width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', border: '1px solid var(--accent-cyan)' }}
        >
          <span className="title-font text-cyan" style={{ fontSize: '18px', letterSpacing: '2px' }}>
            {state.currentRound === 0 ? 'QUARTS DE FINALE TERMINÉS' : 'DEMI-FINALES TERMINÉES'}
          </span>

          {amIRequiredForNextRound ? (
            <button className={`btn ${isRoundReady ? 'btn-green' : 'btn-cyan'}`} onClick={advanceRound}>
              {isRoundReady ? `PRÊT (${state.roundReady?.length || 0}/${requiredVotersCount})` : 'PASSER AU TOUR SUIVANT'}
            </button>
          ) : (
            <span className="title-font text-muted" style={{ fontSize: '16px', fontStyle: 'italic' }}>
              EN ATTENTE DES QUALIFIÉS ({state.roundReady?.length || 0}/{requiredVotersCount})...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
