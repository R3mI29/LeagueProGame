import { useEffect, useState } from 'react';
import { socket } from './api/socket';

const ORDERED_ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];

function ThemeStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Rajdhani:wght@500;600;700&display=swap');

      :root {
        --bg-base: #060913;
        --bg-panel: #0d1323;
        --bg-card: #151d33;
        --accent-cyan: #00e5ff;
        --accent-pink: #ff3366;
        --accent-green: #00e676;
        --text-main: #f8fafc;
        --text-muted: #8b9bb4;
        --border: rgba(139, 155, 180, 0.15);
      }

      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg-base); color: var(--text-main); font-family: 'Inter', sans-serif; overflow-x: hidden; }
      
      /* Typographie */
      .title-font { font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; }
      .text-cyan { color: var(--accent-cyan); }
      .text-pink { color: var(--accent-pink); }
      .text-green { color: var(--accent-green); }
      .text-muted { color: var(--text-muted); }

      /* Boutons */
      .btn {
        font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
        padding: 12px 28px; border: none; borderRadius: 4px; cursor: pointer; transition: all 0.3s ease;
      }
      .btn-cyan { background: var(--accent-cyan); color: #000; box-shadow: 0 0 15px rgba(0, 229, 255, 0.2); }
      .btn-cyan:hover { background: #00b3cc; box-shadow: 0 0 25px rgba(0, 229, 255, 0.4); transform: translateY(-2px); }
      .btn-green { background: var(--accent-green); color: #000; box-shadow: 0 0 15px rgba(0, 230, 118, 0.2); }
      .btn-green:hover { background: #00b25c; box-shadow: 0 0 25px rgba(0, 230, 118, 0.4); transform: translateY(-2px); }
      .btn-pink { background: var(--accent-pink); color: #000; box-shadow: 0 0 15px rgba(255, 51, 102, 0.2); }
      .btn-pink:hover { background: #ff1a53; box-shadow: 0 0 25px rgba(255, 51, 102, 0.4); transform: translateY(-2px); }
      .btn-outline { background: transparent; border: 2px solid var(--text-muted); color: var(--text-main); }
      .btn-outline:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

      /* Layouts & Cartes */
      .container { min-height: 100vh; padding: 40px; display: flex; flex-direction: column; align-items: center; }
      .panel { background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      
      .draft-grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; width: 100%; max-width: 1400px; }
      
      .roster-card {
        background: var(--bg-panel); width: 240px; border-radius: 8px; padding: 20px;
        border-top: 3px solid var(--border); transition: border-color 0.3s ease;
      }
      .roster-card.active { border-top-color: var(--accent-green); background: linear-gradient(180deg, rgba(0,230,118,0.05) 0%, var(--bg-panel) 100%); }
      
      .player-slot { display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; }
      .player-slot.empty { background: transparent; border: 1px dashed var(--border); }

      .pick-card {
        background: var(--bg-card); width: 160px; padding: 24px 16px; border-radius: 8px; cursor: pointer;
        border: 1px solid var(--border); transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center;
      }
      .pick-card:hover { transform: translateY(-5px); border-color: var(--accent-cyan); box-shadow: 0 10px 20px rgba(0, 229, 255, 0.15); background: var(--bg-panel); }

      /* Arbre et Arène */
      .bracket-match {
        background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; margin: 12px 0; overflow: hidden;
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      .bracket-match:hover { border-color: rgba(255, 255, 255, 0.2); }
      .bracket-row { padding: 12px 16px; display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); }
      .bracket-row:last-child { border-bottom: none; }
      .bracket-row.winner { font-weight: 600; color: var(--accent-cyan); background: rgba(0, 229, 255, 0.05); }

      .arena-box { display: flex; width: 100%; max-width: 1000px; gap: 40px; align-items: center; margin-top: 40px; }
      .arena-team { flex: 1; }
      .arena-vs { font-size: 48px; color: var(--text-muted); text-shadow: 0 0 20px rgba(255, 51, 102, 0); transition: all 0.3s ease; }
      .arena-vs.simulating { color: var(--accent-pink); text-shadow: 0 0 20px rgba(255, 51, 102, 0.6); animation: pulse 1s infinite alternate; }
      
      @keyframes pulse { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.1); opacity: 1; } }
      .pulse-text { animation: pulse 1s infinite alternate; }
    `}</style>
  );
}

export default function App() {
  const [state, setState] = useState({ phase: 'lobby', participants: [], turnIndex: 0, currentOptions: [], bracket: [], readyPlayers: [], resetPlayers: [], champion: null });
  const [pseudo, setPseudo] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showBracket, setShowBracket] = useState(false);

  useEffect(() => {
    socket.on('draft-update', (newState) => {
      setState(newState);
      setHasJoined(newState.participants.some(p => p.id === socket.id));
      if (newState.phase === 'lobby') setShowBracket(false); 
    });
    return () => socket.off('draft-update');
  }, []);

  const joinLobby = () => { if (pseudo.trim()) socket.emit('join-lobby', pseudo.trim()); };
  const startDraft = () => socket.emit('start-draft');
  const pickPlayer = (id) => socket.emit('pick-player', id);
  const toggleReady = () => socket.emit('toggle-ready');
  const matchReady = (id) => socket.emit('match-ready', id);
  const dismissMatch = (id) => socket.emit('dismiss-match', id);
  const toggleReset = () => socket.emit('toggle-reset');

  if (state.phase === 'lobby') {
    const humanParticipants = state.participants.filter(p => !p.id.startsWith('bot-'));
    return (
      <div className="container" style={{ justifyContent: 'center' }}>
        <ThemeStyles />
        <h1 className="title-font" style={{ fontSize: '42px', marginBottom: '40px', color: 'var(--accent-cyan)' }}>NEXUS ESPORT DRAFT</h1>
        
        <div className="panel" style={{ width: '100%', maxWidth: '450px' }}>
          {!hasJoined ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                value={pseudo} onChange={(e) => setPseudo(e.target.value)} 
                placeholder="Entrez votre pseudonyme" 
                style={{ width: '100%', padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px', outline: 'none', fontSize: '16px' }} 
              />
              <button className="btn btn-cyan" onClick={joinLobby}>Se connecter</button>
            </div>
          ) : (
            <div>
              <h3 className="title-font text-muted" style={{ marginBottom: '20px' }}>Commandants connectés ({humanParticipants.length}/8)</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0' }}>
                {humanParticipants.map(p => (
                  <li key={p.id} style={{ padding: '12px 16px', background: 'var(--bg-card)', marginBottom: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: p.id === socket.id ? '600' : '400' }}>{p.name}</span>
                    {p.id === socket.id && <span className="text-cyan title-font" style={{ fontSize: '14px' }}>Vous</span>}
                  </li>
                ))}
              </ul>
              {humanParticipants.length >= 2 && <button className="btn btn-green" style={{ width: '100%' }} onClick={startDraft}>Lancer la séquence de Draft</button>}
            </div>
          )}
        </div>
      </div>
    );
  }

  const isTournamentPhase = state.phase === 'tournament' || state.phase === 'simulation';
  const humanCount = state.participants.filter(p => !p.id.startsWith('bot-')).length;
  
  const myActiveMatch = state.phase === 'simulation' 
    ? state.bracket.flat().find(m => m.teamA && m.teamB && (m.teamA.id === socket.id || m.teamB.id === socket.id) && !m.dismissedBy.includes(socket.id))
    : null;

  // --- VUE ARÈNE ---
  if (myActiveMatch) {
    const isReady = myActiveMatch.ready.includes(socket.id);
    const isFinished = myActiveMatch.status === 'finished';

    return (
      <div className="container">
        <ThemeStyles />
        <h1 className="title-font text-cyan" style={{ fontSize: '32px' }}>CONFRONTATION PROTOCOLE</h1>
        <p className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '4px' }}>
          {myActiveMatch.id.includes('qf') ? 'QUART DE FINALE' : myActiveMatch.id.includes('sf') ? 'DEMI-FINALE' : 'GRANDE FINALE'}
        </p>
        
        <div className="arena-box">
          <div className="panel arena-team" style={{ borderTop: isFinished && myActiveMatch.winner?.id === myActiveMatch.teamA.id ? '3px solid var(--accent-cyan)' : '' }}>
            <h2 className="title-font" style={{ marginBottom: '24px' }}>{myActiveMatch.teamA.name}</h2>
            <div>
              {ORDERED_ROLES.map(role => {
                const p = myActiveMatch.teamA.roster.find(pro => pro.role === role);
                return (
                  <div key={role} className="player-slot">
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span className="title-font text-muted" style={{ fontSize: '14px' }}>{p.role}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center', width: '250px' }}>
            <div className={`title-font arena-vs ${myActiveMatch.status === 'simulating' ? 'simulating' : ''}`}>VS</div>
            
            <div style={{ marginTop: '30px' }}>
              {myActiveMatch.status === 'pending' && (
                <button className={`btn ${isReady ? 'btn-outline' : 'btn-pink'}`} style={{ background: !isReady ? 'var(--accent-pink)' : '', boxShadow: !isReady ? '0 0 15px rgba(255, 51, 102, 0.3)' : '' }} onClick={() => matchReady(myActiveMatch.id)} disabled={isReady}>
                  {isReady ? 'SYSTÈME ARMÉ...' : 'ARMER LA SÉQUENCE'}
                </button>
              )}

              {myActiveMatch.status === 'simulating' && <div className="title-font text-pink pulse-text" style={{ fontSize: '20px' }}>CALCUL DE L'ISSUE...</div>}

              {isFinished && (
                <div>
                  <div className="title-font text-cyan" style={{ fontSize: '28px', marginBottom: '20px' }}>
                    VICTOIRE<br/>{myActiveMatch.winner.name}
                  </div>
                  <button className="btn btn-cyan" onClick={() => dismissMatch(myActiveMatch.id)}>Poursuivre</button>
                </div>
              )}
            </div>
          </div>

          <div className="panel arena-team" style={{ borderTop: isFinished && myActiveMatch.winner?.id === myActiveMatch.teamB.id ? '3px solid var(--accent-cyan)' : '' }}>
            <h2 className="title-font" style={{ marginBottom: '24px' }}>{myActiveMatch.teamB.name}</h2>
            <div>
              {ORDERED_ROLES.map(role => {
                const p = myActiveMatch.teamB.roster.find(pro => pro.role === role);
                return (
                  <div key={role} className="player-slot">
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span className="title-font text-muted" style={{ fontSize: '14px' }}>{p.role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VUE ARBRE DE TOURNOI ---
  if (isTournamentPhase && showBracket) {
    const isGlobalReady = state.readyPlayers.includes(socket.id);
    const isResetReady = state.resetPlayers?.includes(socket.id);

    return (
      <div className="container">
        <ThemeStyles />
        
        {state.phase === 'simulation' && state.champion ? (
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '4px', marginBottom: '10px' }}>VAINQUEUR ABSOLU</div>
            <h1 className="title-font text-cyan" style={{ fontSize: '48px', margin: 0, textShadow: '0 0 30px rgba(0,229,255,0.4)', marginBottom: '30px' }}>{state.champion.name}</h1>
            
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
          <div className="panel" style={{ marginTop: '50px', width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px' }}>
            <span className="title-font text-muted" style={{ fontSize: '18px', letterSpacing: '2px' }}>SYNCHRONISATION DES COMMANDANTS...</span>
            <button className={`btn ${isGlobalReady ? 'btn-green' : 'btn-cyan'}`} onClick={toggleReady}>
              {isGlobalReady ? `CONNECTÉ (${state.readyPlayers.length}/${humanCount})` : 'INITIALISER LA PHASE'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- VUE DRAFT ---
  const activeParticipant = state.participants[state.turnIndex];
  const isMyTurn = activeParticipant?.id === socket.id;

  return (
    <div className="container">
      <ThemeStyles />
      
      {isTournamentPhase ? (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <h2 className="title-font text-green" style={{ fontSize: '32px' }}>SÉQUENCE DE DRAFT TERMINÉE</h2>
          <p className="text-muted" style={{ fontSize: '16px', marginBottom: '30px' }}>Les compositions d'équipes sont verrouillées dans le serveur central.</p>
          <button className="btn btn-cyan" onClick={() => setShowBracket(true)}>ACCÉDER AU RÉSEAU DE TOURNOI</button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="title-font text-muted" style={{ fontSize: '14px', letterSpacing: '3px', marginBottom: '10px' }}>PHASE DE SÉLECTION</div>
          <h2 className={`title-font ${isMyTurn ? 'text-cyan pulse-text' : 'text-muted'}`} style={{ fontSize: '28px' }}>
            {isMyTurn ? 'SYSTÈME DÉVERROUILLÉ : À VOUS' : `ACQUISITION EN COURS PAR ${activeParticipant?.name}...`}
          </h2>
        </div>
      )}

      {state.phase === 'draft' && isMyTurn && (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '60px' }}>
          {state.currentOptions.map(pro => (
            <div key={pro.id} className="pick-card" onClick={() => pickPlayer(pro.id)}>
              <div className="title-font text-muted" style={{ fontSize: '13px', letterSpacing: '2px', marginBottom: '12px' }}>{pro.role}</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{pro.name}</div>
            </div>
          ))}
        </div>
      )}

      <div className="draft-grid">
        {state.participants.map(p => (
          <div key={p.id} className={`roster-card ${p.id === activeParticipant?.id && !isTournamentPhase ? 'active' : ''}`}>
            <h3 className="title-font" style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>{p.name}</h3>
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