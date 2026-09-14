import { useEffect, useState } from 'react';
import { socket } from './api/socket';

const ORDERED_ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];

export default function App() {
  const [state, setState] = useState({ phase: 'lobby', participants: [], turnIndex: 0, currentOptions: [], bracket: [], readyPlayers: [] });
  const [pseudo, setPseudo] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    socket.on('draft-update', (newState) => {
      setState(newState);
      setHasJoined(newState.participants.some(p => p.id === socket.id));
    });
    return () => socket.off('draft-update');
  }, []);

  const joinLobby = () => { if (pseudo.trim()) socket.emit('join-lobby', pseudo); };
  const startDraft = () => socket.emit('start-draft');
  const pickPlayer = (id) => socket.emit('pick-player', id);
  const generateBracket = () => socket.emit('generate-bracket');
  const toggleReady = () => socket.emit('toggle-ready');

  // --- PHASE 1: LOBBY ---
  if (state.phase === 'lobby') {
    return (
      <div style={{ background: '#0A0E14', color: '#EDEFF3', height: '100vh', padding: 40, fontFamily: 'sans-serif' }}>
        <h1 style={{ textAlign: 'center' }}>Esport Fantasy Draft</h1>
        <div style={{ maxWidth: 500, margin: '40px auto', background: '#111827', padding: 30, borderRadius: 8 }}>
          {!hasJoined ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Ton pseudo" style={{ flex: 1, padding: 10 }} />
              <button onClick={joinLobby} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4 }}>Rejoindre</button>
            </div>
          ) : (
            <div>
              <h3>Participants ({state.participants.length}/8) :</h3>
              <ul>{state.participants.map(p => <li key={p.id}>{p.name} {p.id === socket.id ? '(Toi)' : ''}</li>)}</ul>
              {state.participants.length >= 2 && (
                <button onClick={startDraft} style={{ width: '100%', padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 4, marginTop: 20 }}>Lancer la Draft</button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- PHASE 3: TOURNOI ---
  if (state.phase === 'tournament' || state.phase === 'simulation') {
    const isReady = state.readyPlayers.includes(socket.id);
    return (
      <div style={{ background: '#0A0E14', color: '#EDEFF3', minHeight: '100vh', padding: 40, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 40, color: '#3b82f6' }}>Arbre du Tournoi</h1>
        
        {/* Affichage de l'arbre */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          {state.bracket.map((round, rIndex) => (
            <div key={rIndex} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1 }}>
              <h3 style={{ textAlign: 'center', color: '#94a3b8' }}>
                {rIndex === 0 ? 'Quarts de finale' : rIndex === 1 ? 'Demi-finales' : 'Finale'}
              </h3>
              {round.map(match => (
                 <div key={match.id} style={{ border: '2px solid #374151', borderRadius: 6, background: '#111827', margin: '10px 0', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #374151', background: '#1f2937', fontWeight: match.teamA ? 'bold' : 'normal', color: match.teamA ? '#f8fafc' : '#4b5563' }}>
                      {match.teamA ? match.teamA.name : '--- (Bye)'}
                    </div>
                    <div style={{ padding: '12px 16px', fontWeight: match.teamB ? 'bold' : 'normal', color: match.teamB ? '#f8fafc' : '#4b5563' }}>
                      {match.teamB ? match.teamB.name : '--- (Bye)'}
                    </div>
                 </div>
              ))}
            </div>
          ))}
        </div>

        {/* Barre de validation en bas */}
        {state.phase === 'tournament' ? (
          <div style={{ marginTop: 40, padding: 20, background: '#111827', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1000, margin: '40px auto 0', width: '100%' }}>
            <span style={{ fontSize: 18, color: '#94a3b8' }}>En attente des commandants...</span>
            <button 
              onClick={toggleReady} 
              style={{ padding: '12px 30px', fontSize: 16, fontWeight: 'bold', background: isReady ? '#10b981' : '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              {isReady ? `Prêt (${state.readyPlayers.length}/${state.participants.length})` : 'Cliquez ici quand vous êtes prêt'}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: 40, padding: 20, fontSize: 24, color: '#10b981', fontWeight: 'bold' }}>
            Tous les joueurs sont prêts. Lancement de la simulation...
          </div>
        )}
      </div>
    );
  }

  // --- PHASE 2: DRAFT (En cours ou terminée) ---
  const activeParticipant = state.participants[state.turnIndex];
  const isMyTurn = activeParticipant?.id === socket.id;

  return (
    <div style={{ background: '#0A0E14', color: '#EDEFF3', minHeight: '100vh', padding: 30, fontFamily: 'sans-serif' }}>
      
      {state.phase === 'finished' ? (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <h2 style={{ color: '#10b981' }}>DRAFT TERMINÉE</h2>
          <p style={{ color: '#94a3b8', marginBottom: 20 }}>Toutes les équipes sont complètes.</p>
          <button onClick={generateBracket} style={{ padding: '15px 30px', fontSize: 18, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
            Continuer vers l'Arbre du Tournoi
          </button>
        </div>
      ) : (
        <h2 style={{ textAlign: 'center', color: isMyTurn ? '#10b981' : '#f59e0b' }}>
          {isMyTurn ? 'C\'EST TON TOUR ! Choisis un joueur :' : `Au tour de ${activeParticipant?.name}...`}
        </h2>
      )}

      {state.phase === 'draft' && isMyTurn && (
        <div style={{ display: 'flex', gap: 15, justifyContent: 'center', margin: '40px 0' }}>
          {state.currentOptions.map(pro => (
            <button key={pro.id} onClick={() => pickPlayer(pro.id)} style={{ width: 140, background: '#1e293b', border: '2px solid #3b82f6', borderRadius: 8, padding: 20, cursor: 'pointer', color: 'white' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{pro.role.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>{pro.name}</div>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginTop: 40 }}>
        {state.participants.map(p => (
          <div key={p.id} style={{ width: 220, background: '#111827', border: p.id === activeParticipant?.id && state.phase !== 'finished' ? '2px solid #10b981' : '1px solid #374151', borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #374151', paddingBottom: 8 }}>{p.name}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ORDERED_ROLES.map(role => {
                const player = p.roster.find(pro => pro.role === role);
                return player ? (
                  <div key={role} style={{ display: 'flex', justifyContent: 'space-between', background: '#1f2937', padding: '8px 12px', borderRadius: 4 }}>
                    <span>{player.name}</span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{player.role}</span>
                  </div>
                ) : (
                  <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 34, border: '1px dashed #374151', borderRadius: 4, padding: '0 12px' }}>
                    <span style={{ color: '#4b5563', fontSize: 12, fontStyle: 'italic' }}>Libre</span>
                    <span style={{ color: '#4b5563', fontSize: 12 }}>{role}</span>
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